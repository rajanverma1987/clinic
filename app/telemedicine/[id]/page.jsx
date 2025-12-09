'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { VideoCallManager } from '@/lib/webrtc/video-call-manager';
import { WaitingRoom } from '@/components/telemedicine/WaitingRoom';
import { ChatPanel } from '@/components/telemedicine/ChatPanel';
import { FileTransfer } from '@/components/telemedicine/FileTransfer';
import { AuditLogger } from '@/lib/audit/audit-logger';
import { deriveSharedKey, encryptMessage, decryptMessage, encryptFile, decryptFile } from '@/lib/encryption/e2ee';

function VideoConsultationRoomContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const authContext = useAuth();
  const user = authContext?.user || null;
  const sessionId = params.id;
  
  // Check if this is a patient link
  const isPatientLink = searchParams.get('role') === 'patient' || !user;

  const [isConnected, setIsConnected] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showFileTransfer, setShowFileTransfer] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [waitingRoomParticipants, setWaitingRoomParticipants] = useState([]);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'doctor', 'patient', 'admin'
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState(null); // E2EE key for chat and files
  const [waitingForRemoteUser, setWaitingForRemoteUser] = useState(false); // Show "Waiting for user A" message
  const [remoteUserConnected, setRemoteUserConnected] = useState(false); // Track if remote user is connected
  const [connectionQuality, setConnectionQuality] = useState('UNKNOWN'); // Connection quality indicator
  const [reconnectAttempts, setReconnectAttempts] = useState(0); // Track reconnection attempts
  
  const videoContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callManagerRef = useRef(null);
  const isConnectedRef = useRef(false);
  const canvasRef = useRef(null); // For watermarking

  // Session timer
  useEffect(() => {
    if (!isConnected) {
      setSessionDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  // Request media permissions explicitly on page load
  useEffect(() => {
    const requestMediaPermissions = async () => {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      try {
        // Request camera and microphone permissions explicitly
        console.log('[VideoCall] Requesting media permissions on page load...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        // Permissions granted
        setHasCameraPermission(true);
        setHasMicrophonePermission(true);
        console.log('[VideoCall] ✅ Media permissions granted');

        // Stop the stream immediately (we just needed to trigger the permission prompt)
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('[VideoCall] Media permission request failed:', error);
        
        // Check which permission was denied
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          // User denied permissions
          setHasCameraPermission(false);
          setHasMicrophonePermission(false);
          setConnectionError('Camera and microphone permissions are required. Please allow access and refresh the page.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          // No devices found
          setConnectionError('No camera or microphone found. Please connect a device and refresh the page.');
        } else {
          // Other error
          console.warn('[VideoCall] Permission request error (will retry on connect):', error);
          // Don't set error state here, let it be requested again on connect
        }
      }
    };

    // Only request if we're in a secure context and have the API
    if (window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      requestMediaPermissions();
    }
  }, []); // Run once on mount

  // Load session data and check expiry
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
        if (sessionResponse.success && sessionResponse.data) {
          const session = sessionResponse.data;
          setSessionData(session);
          
          // Check if session is expired
          if (session.expiresAt) {
            const expiresAt = new Date(session.expiresAt);
            const now = new Date();
            if (now > expiresAt) {
              setSessionExpired(true);
              setConnectionError('This session link has expired. Please request a new link.');
              return;
            }
          }

          // Check if one-time link was already used
          if (session.oneTimeToken && session.linkUsed && !user) {
            setSessionExpired(true);
            setConnectionError('This session link has already been used. Please request a new link.');
            return;
          }

          // Load shared files
          if (session.sharedFiles) {
            setSharedFiles(session.sharedFiles);
          }

          // Load waiting room participants
          if (session.participants) {
            setWaitingRoomParticipants(session.participants);
          }

          // Load chat messages (will be decrypted when encryption key is available)
          if (session.chatMessages && session.chatMessages.length > 0) {
            setChatMessages(session.chatMessages);
          }
        } else if (user) {
          const authResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
          if (authResponse.success && authResponse.data) {
            const session = authResponse.data;
            setSessionData(session);
            
            // Check expiry for authenticated users too
            if (session.expiresAt) {
              const expiresAt = new Date(session.expiresAt);
              const now = new Date();
              if (now > expiresAt) {
                setSessionExpired(true);
                setConnectionError('This session has expired.');
                return;
              }
            }

            if (session.sharedFiles) {
              setSharedFiles(session.sharedFiles);
            }

            if (session.participants) {
              setWaitingRoomParticipants(session.participants);
            }

            if (session.chatMessages && session.chatMessages.length > 0) {
              setChatMessages(session.chatMessages);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };
    if (sessionId) {
      loadSession();
    }

    // Poll for waiting room updates (if patient)
    let waitingRoomInterval = null;
    if (isInWaitingRoom && !isConnected) {
      waitingRoomInterval = setInterval(async () => {
        try {
          const response = await apiClient.get(`/telemedicine/sessions/${sessionId}/waiting-room`, undefined, true);
          if (response.success && response.data) {
            const currentUserId = user?.userId || user?._id;
            const participant = response.data.participants?.find(p => 
              p.userId?.toString() === currentUserId?.toString()
            );
            
            if (participant && participant.status === 'admitted') {
              setIsInWaitingRoom(false);
              // Auto-connect when admitted
              if (!isConnecting && !isConnected) {
                handleConnect();
              }
            } else if (participant && participant.status === 'rejected') {
              setIsInWaitingRoom(false);
              setConnectionError('You have been rejected from the waiting room.');
            }
          }
        } catch (error) {
          console.error('Failed to check waiting room status:', error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (waitingRoomInterval) {
        clearInterval(waitingRoomInterval);
      }
    };
  }, [sessionId, user, isInWaitingRoom, isConnected, isConnecting]);

  // Decrypt chat messages when encryption key becomes available
  useEffect(() => {
    if (encryptionKey && chatMessages.length > 0) {
      const decryptMessages = async () => {
        const decryptedMessages = await Promise.all(
          chatMessages.map(async (msg) => {
            if (msg.encrypted && msg.message && typeof msg.message === 'string' && !msg.decrypted) {
              try {
                const decrypted = await decryptMessage(msg.message, encryptionKey);
                return { ...msg, message: decrypted, decrypted: true };
              } catch (error) {
                console.error('[E2EE] Failed to decrypt message:', error);
                return { ...msg, message: '[Encrypted - Decryption failed]', decrypted: false };
              }
            }
            return msg; // Already decrypted or not encrypted
          })
        );
        // Only update if we actually decrypted something
        const hasEncrypted = decryptedMessages.some(msg => msg.encrypted && !msg.decrypted);
        if (!hasEncrypted) {
          setChatMessages(decryptedMessages);
        }
      };
      decryptMessages();
    }
  }, [encryptionKey]); // Only run when encryption key changes

  // Poll for new chat messages when connected (with improved synchronization)
  useEffect(() => {
    if (!isConnected || !sessionId) return;

    let chatPollInterval = null;
    const messageIds = new Set(chatMessages.map(m => {
      // Create unique ID from timestamp and senderId
      return `${m.timestamp?.toString() || Date.now()}-${m.senderId || 'unknown'}`;
    }));

    const pollChatMessages = async () => {
      try {
        const response = await apiClient.get(
          `/telemedicine/sessions/${sessionId}/chat`,
          undefined,
          true
        );

        if (response.success && response.data && response.data.messages) {
          // Filter out messages we already have
          const newMessages = response.data.messages.filter(msg => {
            const msgId = `${msg.timestamp?.toString() || Date.now()}-${msg.senderId || 'unknown'}`;
            return !messageIds.has(msgId);
          });

          if (newMessages.length > 0) {
            console.log(`[Chat] Received ${newMessages.length} new message(s)`);
            
            // Decrypt new messages if encryption key is available
            let processedMessages = newMessages;
            if (encryptionKey) {
              processedMessages = await Promise.all(
                newMessages.map(async (msg) => {
                  if (msg.encrypted && msg.message && typeof msg.message === 'string') {
                    try {
                      const decrypted = await decryptMessage(msg.message, encryptionKey);
                      return { ...msg, message: decrypted, decrypted: true };
                    } catch (error) {
                      console.error('[E2EE] Failed to decrypt message:', error);
                      return { ...msg, message: '[Encrypted - Decryption failed]', decrypted: false };
                    }
                  }
                  return msg;
                })
              );
            }

            // Add to message IDs set
            processedMessages.forEach(msg => {
              const msgId = `${msg.timestamp?.toString() || Date.now()}-${msg.senderId || 'unknown'}`;
              messageIds.add(msgId);
            });

            // Update chat messages
            setChatMessages(prev => {
              // Merge and sort by timestamp
              const allMessages = [...prev, ...processedMessages];
              return allMessages.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
              });
            });
          }
        }
      } catch (error) {
        console.error('[Chat] Failed to poll chat messages:', error);
        // Don't stop polling on error - retry next interval
      }
    };

    // Poll every 2 seconds for new messages
    chatPollInterval = setInterval(pollChatMessages, 2000);
    
    // Poll immediately on mount
    pollChatMessages();

    return () => {
      if (chatPollInterval) {
        clearInterval(chatPollInterval);
      }
    };
  }, [isConnected, sessionId, encryptionKey]); // Removed chatMessages.length from deps to avoid infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup call manager
      if (callManagerRef.current) {
        callManagerRef.current.endCall().catch(console.error);
      }
    };
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if getUserMedia is available (for UI feedback)
  const checkMediaSupport = () => {
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
    const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    return {
      supported: hasGetUserMedia && isSecure,
      hasMediaDevices,
      hasGetUserMedia,
      isSecure,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    };
  };

  const handleConnect = async () => {
    console.log('[VideoCall] Starting connection...');
    
    // Check if session is expired
    if (sessionExpired) {
      setConnectionError('This session has expired. Please request a new link.');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    isConnectedRef.current = false;
    
    try {
      // Check if browser supports WebRTC
      if (typeof window === 'undefined') {
        throw new Error('This feature requires a browser environment');
      }

      // More comprehensive WebRTC support check (works on mobile too)
      // Check for RTCPeerConnection first (more reliable indicator)
      const hasRTCPeerConnection = !!(
        window.RTCPeerConnection || 
        window.webkitRTCPeerConnection || 
        window.mozRTCPeerConnection
      );
      
      // Check for getUserMedia - be more lenient for mobile
      const hasGetUserMedia = !!(
        navigator.mediaDevices?.getUserMedia || 
        navigator.getUserMedia || 
        navigator.webkitGetUserMedia || 
        navigator.mozGetUserMedia
      );
      
      // On mobile, if we have RTCPeerConnection, we likely have WebRTC support
      // The getUserMedia check might fail due to permissions, but that's handled later
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Log for debugging
      console.log('[VideoCall] WebRTC support check:', {
        hasGetUserMedia,
        hasRTCPeerConnection,
        isMobile,
        hasMediaDevices: !!navigator.mediaDevices,
        userAgent: navigator.userAgent,
        mediaDevicesGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        getUserMedia: !!navigator.getUserMedia,
        webkitGetUserMedia: !!navigator.webkitGetUserMedia,
        RTCPeerConnection: !!window.RTCPeerConnection,
        webkitRTCPeerConnection: !!window.webkitRTCPeerConnection
      });
      
      // For mobile, if RTCPeerConnection exists, assume WebRTC is supported
      // getUserMedia will be checked when we actually try to use it
      if (!hasRTCPeerConnection) {
        const errorMsg = `WebRTC is not supported in this browser. RTCPeerConnection not found. Please use a modern browser like Chrome, Firefox, or Safari.`;
        console.error('[VideoCall] WebRTC not supported:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Only check getUserMedia on desktop (mobile might need permissions first)
      if (!isMobile && !hasGetUserMedia) {
        const errorMsg = `getUserMedia is not available in this browser. Please use a modern browser like Chrome, Firefox, or Safari.`;
        console.error('[VideoCall] getUserMedia not supported:', errorMsg);
        throw new Error(errorMsg);
      }

      // Check current permission status (if API available) - this is a secondary check
      // Primary permission request happens on page load
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const [cameraPermission, microphonePermission] = await Promise.all([
            navigator.permissions.query({ name: 'camera' }).catch(() => ({ state: 'prompt' })),
            navigator.permissions.query({ name: 'microphone' }).catch(() => ({ state: 'prompt' }))
          ]);
          
          console.log('[VideoCall] Current permissions:', {
            camera: cameraPermission.state,
            microphone: microphonePermission.state
          });

          // Update permission state based on query results
          if (cameraPermission.state === 'denied') {
            setHasCameraPermission(false);
          } else if (cameraPermission.state === 'granted') {
            setHasCameraPermission(true);
          }

          if (microphonePermission.state === 'denied') {
            setHasMicrophonePermission(false);
          } else if (microphonePermission.state === 'granted') {
            setHasMicrophonePermission(true);
          }

          // Block if both permissions are denied
          if (cameraPermission.state === 'denied' && microphonePermission.state === 'denied') {
            throw new Error('Camera and microphone permissions are denied. Please enable both in your browser settings:\n\n1. Click the lock/camera icon in your browser\'s address bar\n2. Set Camera and Microphone to "Allow"\n3. Refresh this page and try again');
          }
        } catch (permError) {
          // Permission API might not be fully supported or query failed, continue anyway
          console.warn('[VideoCall] Permission check failed, will request on getUserMedia:', permError);
        }
      }

      // Load session data if not already loaded
      let session = sessionData;
      if (!session) {
        console.log('[VideoCall] Loading session data...');
        let sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
        if (!sessionResponse.success || !sessionResponse.data) {
          if (user) {
            sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
          }
        }
        
        if (!sessionResponse.success || !sessionResponse.data) {
          setIsConnecting(false);
          setConnectionError('Failed to load session details');
          console.error('[VideoCall] Failed to load session:', sessionResponse);
          return;
        }
        session = sessionResponse.data;
        setSessionData(session);
        console.log('[VideoCall] Session loaded:', session);
      }

      // Determine user IDs
      // CRITICAL: Both users must use the SAME userId format for signaling to work
      // Get session IDs first to determine role
      const sessionDoctorId = session.doctorId?._id || session.doctorId;
      const sessionPatientId = session.patientId?._id || session.patientId;
      const sessionDoctorIdStr = sessionDoctorId ? sessionDoctorId.toString() : null;
      const sessionPatientIdStr = sessionPatientId ? sessionPatientId.toString() : null;
      
      let currentUserId;
      if (user) {
        // Try multiple possible user ID fields
        currentUserId = user.userId || user._id || user.id;
        if (currentUserId) {
          currentUserId = currentUserId.toString();
          
          // Verify this ID matches either doctor or patient in session
          if (currentUserId !== sessionDoctorIdStr && currentUserId !== sessionPatientIdStr) {
            console.warn('[VideoCall] User ID does not match session doctorId or patientId. Using session doctorId as fallback.');
            // If authenticated user, assume they're the doctor
            currentUserId = sessionDoctorIdStr || `doctor-${sessionId}`;
          }
        } else {
          // User object exists but no ID field found - use doctor ID from session (authenticated users are usually doctors)
          currentUserId = sessionDoctorIdStr || `doctor-${sessionId}`;
        }
      } else {
        // No user object - determine if this is doctor or patient by checking URL or session
        // For now, we'll determine based on which ID is being accessed
        // If the page is accessed by doctor (authenticated route), they should have user object
        // If no user object, assume patient (public route)
        currentUserId = sessionPatientIdStr || `patient-${sessionId}`;
        console.log('[VideoCall] No user object - assuming PATIENT, using patientId from session');
      }
      
      // Ensure currentUserId is never undefined
      if (!currentUserId) {
        // Last resort fallback
        currentUserId = user ? `doctor-${sessionId}` : `patient-${sessionId}`;
        console.warn('[VideoCall] currentUserId was undefined, using fallback:', currentUserId);
      }
      
      console.log('[VideoCall] User ID determination:', {
        hasUser: !!user,
        currentUserId,
        sessionDoctorId: sessionDoctorIdStr,
        sessionPatientId: sessionPatientIdStr,
        matchesDoctor: currentUserId === sessionDoctorIdStr,
        matchesPatient: currentUserId === sessionPatientIdStr
      });
      
      // Determine remoteUserId - must match the other peer's currentUserId
      let remoteUserId;
      if (user) {
        // Doctor is connected - remote is patient
        remoteUserId = session.patientId?._id || session.patientId || `patient-${sessionId}`;
      } else {
        // Patient is connected - remote is doctor
        remoteUserId = session.doctorId?._id || session.doctorId || `doctor-${sessionId}`;
      }
      
      // Ensure remoteUserId is never undefined and convert to string
      if (!remoteUserId) {
        remoteUserId = user ? `patient-${sessionId}` : `doctor-${sessionId}`;
        console.warn('[VideoCall] remoteUserId was undefined, using fallback:', remoteUserId);
      } else {
        remoteUserId = remoteUserId.toString();
      }

      // Derive E2EE encryption key for chat and files
      if (currentUserId && remoteUserId && sessionId) {
        try {
          const key = await deriveSharedKey(sessionId, currentUserId, remoteUserId);
          setEncryptionKey(key);
          console.log('[E2EE] ✅ Encryption key derived successfully for session:', sessionId);
        } catch (error) {
          console.error('[E2EE] ❌ Failed to derive encryption key:', error);
          // Continue without encryption (graceful degradation)
        }
      }
      
      // Determine if current user is initiator (doctor starts the call)
      // Doctor is always the initiator, patient is always the receiver
      // Check session data to determine role, not just user object (auth might fail)
      // Note: sessionDoctorId, sessionPatientId, sessionDoctorIdStr, sessionPatientIdStr are already declared above
      let isInitiator = false;
      
      // Determine initiator by comparing currentUserId with session IDs
      let detectedRole = 'patient'; // Default to patient
      
      if (sessionDoctorIdStr && currentUserId === sessionDoctorIdStr) {
        // Current user matches doctor ID from session
        isInitiator = true;
        detectedRole = 'doctor';
        console.log('[VideoCall] ✅ User is DOCTOR (initiator) - matched session.doctorId');
      } else if (sessionPatientIdStr && currentUserId === sessionPatientIdStr) {
        // Current user matches patient ID from session
        isInitiator = false;
        detectedRole = 'patient';
        console.log('[VideoCall] ✅ User is PATIENT (receiver) - matched session.patientId');
      } else if (user) {
        // Authenticated user but IDs don't match - assume doctor (authenticated users are usually doctors)
        isInitiator = true;
        detectedRole = 'doctor';
        console.log('[VideoCall] ⚠️ User is authenticated but IDs don\'t match session - assuming DOCTOR (initiator)');
      } else {
        // Not authenticated and IDs don't match - assume patient (anonymous users are usually patients)
        isInitiator = false;
        detectedRole = 'patient';
        console.warn('[VideoCall] ⚠️ Could not determine role from session data - defaulting to PATIENT (receiver)');
        console.warn('[VideoCall] Session IDs:', {
          doctorId: sessionDoctorIdStr,
          patientId: sessionPatientIdStr,
          currentUserId: currentUserId
        });
      }

      // Set user role for UI components
      setUserRole(detectedRole);

      // If patient, check if they need to wait in waiting room
      if (detectedRole === 'patient' && session.waitingRoomEnabled) {
        setIsInWaitingRoom(true);
        
        // Add participant to waiting room via API
        try {
          await apiClient.post(`/telemedicine/sessions/${sessionId}/waiting-room`, {
            userId: currentUserId,
            name: user?.firstName || 'Patient',
            role: 'patient'
          }, {}, true);
        } catch (error) {
          console.warn('Failed to add to waiting room:', error);
        }
      }

      console.log('[VideoCall] User info:', {
        currentUserId,
        remoteUserId,
        isInitiator,
        sessionId,
        hasUser: !!user,
        userKeys: user ? Object.keys(user) : [],
        userValues: user ? {
          userId: user.userId,
          _id: user._id,
          id: user.id
        } : null
      });
      
      // Validate user IDs before proceeding
      if (!currentUserId || currentUserId === 'undefined') {
        console.error('[VideoCall] ❌ currentUserId is invalid:', currentUserId);
        setIsConnecting(false);
        setConnectionError('Failed to identify user. Please refresh the page and try again.');
        return;
      }
      
      if (!remoteUserId || remoteUserId === 'undefined') {
        console.error('[VideoCall] ❌ remoteUserId is invalid:', remoteUserId);
        setIsConnecting(false);
        setConnectionError('Failed to identify remote user. Please refresh the page and try again.');
        return;
      }

      // Create video call manager
      console.log('[VideoCall] Creating VideoCallManager...');
      const callManager = new VideoCallManager({
        sessionId,
        userId: currentUserId,
        remoteUserId: remoteUserId.toString(),
        isInitiator,
        apiClient, // Pass apiClient instance
        onLocalStream: (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        },
        onRemoteStream: (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        },
        onConnectionChange: (state) => {
          console.log('[VideoCall] Connection state changed:', state);
          
          // Handle reconnection attempts
          if (state.isReconnecting) {
            setConnectionError(`Reconnecting... (Attempt ${state.reconnectAttempts})`);
            setIsConnecting(true);
            return;
          }

          if (state.status === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
            isConnectedRef.current = true;
            setConnectionError(null);
            setRemoteUserConnected(true);
            setWaitingForRemoteUser(false);
          } else if (state.status === 'disconnected' || state.status === 'ended') {
            setIsConnected(false);
            setIsConnecting(false);
            isConnectedRef.current = false;
            setRemoteUserConnected(false);
            // Don't show error if it's a normal disconnect
            if (state.status === 'disconnected' && state.reason && !state.reason.includes('ended')) {
              setConnectionError(state.reason || 'Connection lost. Reconnecting...');
            }
          } else if (state.status === 'error' || state.status === 'failed') {
            setIsConnecting(false);
            const errorMsg = state.error?.message || state.reason || 'Connection error occurred';
            setConnectionError(errorMsg);
            // Don't set isConnected to false immediately - let reconnection try
          } else if (state.status === 'connecting') {
            // Keep connecting state
            setIsConnecting(true);
            // If we're connected locally but remote isn't, show waiting message
            if (isConnectedRef.current && !remoteUserConnected) {
              setWaitingForRemoteUser(true);
            }
          }
        },
        onError: (error) => {
          console.error('Call manager error:', error);
          setIsConnecting(false);
          const errorMsg = error?.message || (typeof error === 'string' ? error : 'Failed to start video call');
          setConnectionError(errorMsg);
        }
      });

      callManagerRef.current = callManager;

      // Start the call
      console.log('[VideoCall] Starting call...');
      await callManager.startCall();
      console.log('[VideoCall] Call started successfully');

      // Monitor connection quality and status
      const qualityInterval = setInterval(() => {
        if (callManagerRef.current) {
          try {
            const status = callManagerRef.current.getConnectionStatus();
            if (status) {
              setConnectionQuality(status.quality || 'UNKNOWN');
              setReconnectAttempts(status.reconnectAttempts || 0);
              
              // Update remote user connection status
              if (status.connectionState === 'connected' && status.iceConnectionState === 'connected') {
                setRemoteUserConnected(true);
                setWaitingForRemoteUser(false);
              } else if (status.connectionState === 'disconnected' || status.iceConnectionState === 'disconnected') {
                setRemoteUserConnected(false);
                if (isConnectedRef.current) {
                  setWaitingForRemoteUser(true);
                }
              }
            }
          } catch (error) {
            console.error('[VideoCall] Error getting connection status:', error);
          }
        }
      }, 2000);

      // Store interval for cleanup
      window.qualityInterval = qualityInterval;

      // Audit log: User joined call
      if (user) {
        try {
          await AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'ACCESS',
            { action: 'join_call', role: detectedRole },
            { timestamp: new Date().toISOString() }
          );
        } catch (error) {
          console.warn('Failed to log audit:', error);
        }
      }

      // Mark session as started (only if user is authenticated)
      if (user) {
        try {
          await apiClient.put(`/telemedicine/sessions/${sessionId}?action=start`, {});
          console.log('[VideoCall] Session marked as started');
        } catch (error) {
          console.warn('[VideoCall] Failed to mark session as started:', error);
        }
      }

      // Show recording consent modal if not already consented
      if (!recordingConsent && session?.recordingEnabled) {
        setShowRecordingConsent(true);
      }
    } catch (error) {
      console.error('[VideoCall] Failed to start call:', error);
      console.error('[VideoCall] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      setIsConnecting(false);
      // Ensure error message is always a string
      const errorMsg = error?.message || (typeof error === 'string' ? error : 'Failed to start video call');
      setConnectionError(errorMsg);
      
      // Cleanup on error
      if (callManagerRef.current) {
        try {
          await callManagerRef.current.endCall();
        } catch (cleanupError) {
          console.error('[VideoCall] Error during cleanup:', cleanupError);
        }
        callManagerRef.current = null;
      }
    }
  };


  const handleEndCall = async () => {
    if (window.confirm('Are you sure you want to end this consultation?')) {
      // Audit log: User left call
      if (user) {
        try {
          await AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'ACCESS',
            { action: 'leave_call', duration: sessionDuration },
            { timestamp: new Date().toISOString() }
          );
        } catch (error) {
          console.warn('Failed to log audit:', error);
        }
      }

      // End the call
      if (callManagerRef.current) {
        await callManagerRef.current.endCall();
        callManagerRef.current = null;
      }

      // Cleanup intervals
      if (window.screenShareWatermarkInterval) {
        clearInterval(window.screenShareWatermarkInterval);
        window.screenShareWatermarkInterval = null;
      }

      if (window.qualityInterval) {
        clearInterval(window.qualityInterval);
        window.qualityInterval = null;
      }

      // Remove watermark overlay
      const watermark = document.querySelector('.screen-share-watermark');
      if (watermark) {
        watermark.remove();
      }

      setIsConnected(false);
      setIsConnecting(false);
      setSessionDuration(0);
      setIsScreenSharing(false);
      setConnectionQuality('UNKNOWN');
      setReconnectAttempts(0);

      // Mark session as ended (only if user is authenticated)
      if (user) {
        try {
          await apiClient.put(`/telemedicine/sessions/${sessionId}?action=end`, {});
        } catch (error) {
          console.warn('Failed to mark session as ended:', error);
        }
        router.push(`/telemedicine/${sessionId}/summary`);
      } else {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      }
    }
  };

  const handleToggleMute = () => {
    if (callManagerRef.current) {
      const newMutedState = !isMuted;
      callManagerRef.current.toggleMute(newMutedState);
      setIsMuted(newMutedState);
      
      // Audit log
      if (user) {
        AuditLogger.auditWrite(
          'telemedicine_session',
          sessionId,
          user.userId || user._id,
          user.tenantId,
          'UPDATE',
          { muted: newMutedState },
          { action: 'toggle_mute' }
        ).catch(console.error);
      }
    }
  };

  const handleToggleVideo = () => {
    if (callManagerRef.current) {
      const newVideoState = !isVideoEnabled;
      callManagerRef.current.toggleVideo(newVideoState);
      setIsVideoEnabled(newVideoState);
      
      // Audit log
      if (user) {
        AuditLogger.auditWrite(
          'telemedicine_session',
          sessionId,
          user.userId || user._id,
          user.tenantId,
          'UPDATE',
          { videoEnabled: newVideoState },
          { action: 'toggle_video' }
        ).catch(console.error);
      }
    }
  };

  const handleScreenShare = async () => {
    if (!callManagerRef.current) return;
    
    try {
      if (isScreenSharing) {
        await callManagerRef.current.stopScreenShare();
        setIsScreenSharing(false);
        
        // Audit log
        if (user) {
          AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'UPDATE',
            { screenShare: false },
            { action: 'stop_screen_share' }
          ).catch(console.error);
        }
      } else {
        const stream = await callManagerRef.current.startScreenShare();
        setIsScreenSharing(true);
        
        // Apply watermark overlay to screen share video element
        if (remoteVideoRef.current && stream) {
          // Create canvas overlay for watermark
          const video = remoteVideoRef.current;
          const container = video.parentElement;
          
          // Remove existing watermark if any
          const existingWatermark = container.querySelector('.screen-share-watermark');
          if (existingWatermark) {
            existingWatermark.remove();
          }
          
          // Create watermark overlay
          const watermark = document.createElement('div');
          watermark.className = 'screen-share-watermark absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-mono z-10';
          watermark.textContent = `${user?.userId || user?._id || 'User'} | ${new Date().toLocaleString()}`;
          container.appendChild(watermark);
          
          // Update watermark timestamp every second
          const watermarkInterval = setInterval(() => {
            if (watermark && isScreenSharing) {
              watermark.textContent = `${user?.userId || user?._id || 'User'} | ${new Date().toLocaleString()}`;
            } else {
              clearInterval(watermarkInterval);
            }
          }, 1000);
          
          // Store interval for cleanup
          if (!window.screenShareWatermarkInterval) {
            window.screenShareWatermarkInterval = watermarkInterval;
          }
        }
        
        // Audit log
        if (user) {
          AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'UPDATE',
            { screenShare: true },
            { action: 'start_screen_share' }
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert(error.message || 'Failed to share screen');
    }
  };

  const handleSendChatMessage = async (message) => {
    if (!message.trim()) return;
    
    try {
      let encryptedMessage = message;
      let encryptionError = null;

      // Encrypt message if encryption key is available
      if (encryptionKey) {
        try {
          encryptedMessage = await encryptMessage(message, encryptionKey);
          console.log('[E2EE] ✅ Message encrypted successfully');
        } catch (error) {
          console.error('[E2EE] ❌ Failed to encrypt message:', error);
          encryptionError = error;
          // Continue with plain text if encryption fails (graceful degradation)
        }
      } else {
        console.warn('[E2EE] ⚠️ No encryption key available, sending plain text');
      }

      const chatMessage = {
        senderId: user?.userId || user?._id || 'anonymous',
        senderName: user?.firstName || 'User',
        message: encryptionKey && !encryptionError ? encryptedMessage : message, // Send encrypted if available
        encrypted: !!encryptionKey && !encryptionError,
        timestamp: new Date(),
        isEncrypted: !!encryptionKey && !encryptionError
      };
      
      // Add to local state (decrypted for display)
      // Use functional update to avoid race conditions
      setChatMessages(prev => {
        // Check for duplicates
        const msgId = `${chatMessage.timestamp?.toString() || Date.now()}-${chatMessage.senderId || 'unknown'}`;
        const existingIds = new Set(prev.map(m => 
          `${m.timestamp?.toString() || Date.now()}-${m.senderId || 'unknown'}`
        ));
        
        if (existingIds.has(msgId)) {
          return prev; // Already have this message
        }
        
        return [...prev, {
          ...chatMessage,
          message: message // Store decrypted version for display
        }].sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeA - timeB;
        });
      });
      
      // Send encrypted message to backend
      try {
        await apiClient.post(
          `/telemedicine/sessions/${sessionId}/chat`,
          {
            encryptedMessage: chatMessage.message,
            senderId: chatMessage.senderId,
            senderName: chatMessage.senderName,
            timestamp: chatMessage.timestamp,
            encrypted: chatMessage.encrypted
          },
          {},
          true
        );
      } catch (error) {
        console.error('Failed to send message to backend:', error);
      }
      
      // Audit log
      if (user) {
        AuditLogger.auditWrite(
          'telemedicine_session',
          sessionId,
          user.userId || user._id,
          user.tenantId,
          'CREATE',
          { messageSent: true, encrypted: chatMessage.encrypted },
          { action: 'send_chat_message' }
        ).catch(console.error);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const handleAdmitParticipant = async (participantId) => {
    try {
      const response = await apiClient.post(
        `/telemedicine/sessions/${sessionId}/admit`,
        { participantId },
        {},
        true
      );

      if (response.success) {
        setWaitingRoomParticipants(prev => 
          prev.map(p => 
            p.userId === participantId ? { ...p, status: 'admitted' } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to admit participant:', error);
    }
    
    // Audit log
    if (user) {
      AuditLogger.auditWrite(
        'telemedicine_session',
        sessionId,
        user.userId || user._id,
        user.tenantId,
        'UPDATE',
        { participantAdmitted: participantId },
        { action: 'admit_participant' }
      ).catch(console.error);
    }
  };

  const handleRejectParticipant = async (participantId) => {
    try {
      const response = await apiClient.post(
        `/telemedicine/sessions/${sessionId}/reject`,
        { participantId },
        {},
        true
      );

      if (response.success) {
        setWaitingRoomParticipants(prev => prev.filter(p => p.userId !== participantId));
      }
    } catch (error) {
      console.error('Failed to reject participant:', error);
    }
    
    // Audit log
    if (user) {
      AuditLogger.auditWrite(
        'telemedicine_session',
        sessionId,
        user.userId || user._id,
        user.tenantId,
        'UPDATE',
        { participantRejected: participantId },
        { action: 'reject_participant' }
      ).catch(console.error);
    }
  };

  const handleRecordingConsent = async (consented) => {
    setRecordingConsent(consented);
    setShowRecordingConsent(false);
    
    // Save consent to session
    try {
      await apiClient.put(`/telemedicine/sessions/${sessionId}`, {
        recordingConsent: consented
      });
    } catch (error) {
      console.error('Failed to save recording consent:', error);
    }
    
    // Audit log
    if (user) {
      AuditLogger.auditWrite(
        'telemedicine_session',
        sessionId,
        user.userId || user._id,
        user.tenantId,
        'UPDATE',
        { recordingConsent: consented },
        { action: 'recording_consent' }
      ).catch(console.error);
    }
  };

  const handleFileUpload = async (fileData) => {
    try {
      let encryptedFileData = fileData.encryptedData;
      let iv = null;

      // Encrypt file if encryption key is available
      if (encryptionKey && fileData.fileData) {
        try {
          // fileData.fileData should be ArrayBuffer from FileReader
          const encrypted = await encryptFile(fileData.fileData, encryptionKey);
          encryptedFileData = encrypted.encrypted;
          iv = encrypted.iv;
          console.log('[E2EE] ✅ File encrypted successfully');
        } catch (error) {
          console.error('[E2EE] ❌ Failed to encrypt file:', error);
          throw new Error('Failed to encrypt file');
        }
      } else if (!encryptionKey) {
        console.warn('[E2EE] ⚠️ No encryption key available, file will be stored unencrypted');
      }

      // Upload encrypted file
      const response = await apiClient.post(
        `/telemedicine/sessions/${sessionId}/files`,
        {
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize,
          encryptedData: encryptedFileData,
          iv: iv, // Include IV for decryption
          encrypted: !!encryptionKey,
          uploadedBy: fileData.uploadedBy,
          uploadedAt: fileData.uploadedAt
        },
        {},
        true
      );

      if (response.success) {
        setSharedFiles(prev => [...prev, response.data]);
        
        // Audit log
        if (user) {
          AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'CREATE',
            { fileName: fileData.fileName, fileSize: fileData.fileSize, encrypted: !!encryptionKey },
            { action: 'upload_file' }
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleFileDownload = async (file) => {
    try {
      // Download encrypted file
      const response = await apiClient.get(
        `/telemedicine/sessions/${sessionId}/files/${file._id || file.id}`,
        undefined,
        true
      );

      if (response.success) {
        let decryptedData;

        // Decrypt file if it's encrypted
        if (file.encrypted && encryptionKey && response.data.encryptedData && response.data.iv) {
          try {
            decryptedData = await decryptFile(
              response.data.encryptedData,
              response.data.iv,
              encryptionKey
            );
            console.log('[E2EE] ✅ File decrypted successfully');
          } catch (error) {
            console.error('[E2EE] ❌ Failed to decrypt file:', error);
            throw new Error('Failed to decrypt file');
          }
        } else if (file.encrypted && !encryptionKey) {
          throw new Error('File is encrypted but no decryption key available');
        } else {
          // File is not encrypted, use as-is
          const binaryString = atob(response.data.encryptedData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          decryptedData = bytes.buffer;
        }
        
        // Create download link
        const blob = new Blob([decryptedData], { type: file.fileType || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Audit log
        if (user) {
          AuditLogger.auditWrite(
            'telemedicine_session',
            sessionId,
            user.userId || user._id,
            user.tenantId,
            'ACCESS',
            { fileName: file.fileName, encrypted: file.encrypted },
            { action: 'download_file' }
          ).catch(console.error);
        }
      }
    } catch (error) {
      console.error('File download error:', error);
      throw error;
    }
  };

  const handleShareLink = async () => {
    const patientLink = `${window.location.origin}/telemedicine/${sessionId}?role=patient`;
    
    try {
      await navigator.clipboard.writeText(patientLink);
      alert('Patient video link copied to clipboard!');
    } catch (error) {
      setShowShareModal(true);
    }
  };

  const handleSendEmail = async () => {
    if (!sessionData?.patientId?.email) {
      alert('Patient email not available');
      return;
    }

    try {
      const patientLink = `${window.location.origin}/telemedicine/${sessionId}?role=patient`;
      const response = await apiClient.post('/telemedicine/sessions/send-link', {
        sessionId,
        patientEmail: sessionData.patientId.email,
        videoLink: patientLink,
      }, {}, true);

      if (response.success) {
        alert('Patient video link sent via email!');
        setShowShareModal(false);
      } else {
        alert(response.error?.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try copying the link manually.');
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-semibold text-sm sm:text-base truncate">Telemedicine Consultation</h2>
            <p className="text-gray-400 text-xs sm:text-sm truncate">Session: {sessionId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {isConnected && (
            <>
              <div className="text-white text-xs sm:text-sm">
                <span className="text-gray-400 hidden sm:inline">Duration: </span>
                <span className="font-mono">{formatDuration(sessionDuration)}</span>
              </div>
              {/* Connection Quality Indicator */}
              {connectionQuality !== 'UNKNOWN' && (
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionQuality === 'EXCELLENT' ? 'bg-green-500' :
                    connectionQuality === 'GOOD' ? 'bg-blue-500' :
                    connectionQuality === 'FAIR' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} title={`Connection: ${connectionQuality}`}></div>
                  {reconnectAttempts > 0 && (
                    <span className="text-yellow-400 text-xs" title={`Reconnecting (${reconnectAttempts} attempts)`}>
                      🔄
                    </span>
                  )}
                </div>
              )}
            </>
          )}
          {sessionData && user && userRole === 'doctor' && (
            <button
              onClick={handleShareLink}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              title="Share video link with patient"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm sm:text-base font-medium hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-0">
          {/* Video Container - WebRTC Video Streams */}
          {isConnecting || isConnected ? (
            <div 
              ref={videoContainerRef}
              className="w-full h-full relative overflow-hidden"
            >
              {/* Remote Video (Patient/Doctor) - Full Screen */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ maxHeight: '100vh' }}
                // Removed mirror effect - remote video should show normally
              />
              
              {/* Local Video (Self) - Picture in Picture */}
              <div className="absolute bottom-16 sm:bottom-20 right-2 sm:right-4 w-28 h-20 sm:w-48 sm:h-36 md:w-64 md:h-48 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-blue-500 z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect for self-view only
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Call Controls - Overlay */}
              {isConnected && (
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3 md:gap-4 bg-gray-900/80 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 rounded-full flex-wrap justify-center max-w-[95vw]">
                  {/* Mute/Unmute Button */}
                  <button
                    onClick={handleToggleMute}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isMuted 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>

                  {/* Video On/Off Button */}
                  <button
                    onClick={handleToggleVideo}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  >
                    {isVideoEnabled ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </button>

                  {/* Screen Share Button */}
                  <button
                    onClick={handleScreenShare}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isScreenSharing 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Chat Toggle Button */}
                  <button
                    onClick={() => {
                      setShowChat(!showChat);
                      if (!showChat) setShowFileTransfer(false); // Close file transfer if opening chat
                    }}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      showChat 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={showChat ? 'Close chat' : 'Open chat'}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>

                  {/* File Transfer Toggle Button */}
                  <button
                    onClick={() => {
                      setShowFileTransfer(!showFileTransfer);
                      if (!showFileTransfer) setShowChat(false); // Close chat if opening file transfer
                    }}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      showFileTransfer 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={showFileTransfer ? 'Close files' : 'Open files'}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                    title="End call"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M16 16l2 2m0 0l2 2m-2-2l-2 2m2-2l-2-2M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Connecting Indicator */}
              {isConnecting && !isConnected && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="text-center bg-gray-900/90 rounded-lg p-6 max-w-md mx-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg font-semibold mb-2">Connecting...</p>
                    <p className="text-gray-400 text-sm">Establishing peer-to-peer connection</p>
                    <p className="text-gray-500 text-xs mt-2">This may take a few seconds</p>
                    {connectionError && (
                      <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-xs">
                        {connectionError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Waiting for Remote User Message */}
              {isConnected && !remoteUserConnected && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  <div className="text-center bg-gray-900/90 rounded-lg p-6 max-w-md mx-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg font-semibold mb-2">Waiting for {userRole === 'doctor' ? 'patient' : 'doctor'} to join...</p>
                    <p className="text-gray-400 text-sm">You're connected. Waiting for the other participant to join the call.</p>
                    {reconnectAttempts > 0 && (
                      <p className="text-yellow-400 text-xs mt-2">Reconnecting... (Attempt {reconnectAttempts})</p>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Quality Warning */}
              {isConnected && connectionQuality === 'POOR' && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-900/90 border border-yellow-700 rounded-lg px-4 py-2 z-30">
                  <p className="text-yellow-200 text-sm flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>Poor connection quality. Check your internet connection.</span>
                  </p>
                </div>
              )}

              {/* Waiting Room Overlay */}
              {userRole === 'doctor' && (
                <WaitingRoom
                  participants={waitingRoomParticipants}
                  onAdmit={handleAdmitParticipant}
                  onReject={handleRejectParticipant}
                  isHost={userRole === 'doctor'}
                  currentUserId={user?.userId || user?._id}
                />
              )}

              {/* Chat Panel */}
              <ChatPanel
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                currentUserId={user?.userId || user?._id}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
              />

              {/* File Transfer Panel */}
              <FileTransfer
                files={sharedFiles}
                onUpload={handleFileUpload}
                onDownload={handleFileDownload}
                currentUserId={user?.userId || user?._id}
                isOpen={showFileTransfer}
                onClose={() => setShowFileTransfer(false)}
              />

              {/* Recording Consent Modal */}
              {showRecordingConsent && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
                    <h3 className="text-white text-xl font-semibold mb-4">Recording Consent</h3>
                    <p className="text-gray-300 mb-4">
                      This session may be recorded for medical records and quality assurance purposes.
                      By continuing, you consent to the recording of this consultation.
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleRecordingConsent(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        I Consent
                      </Button>
                      <Button
                        onClick={() => handleRecordingConsent(false)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Decline
                      </Button>
                    </div>
                    <p className="text-gray-500 text-xs mt-4">
                      Note: Recording will be disabled if you decline consent.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Pre-connection UI - Shown when not connecting and not connected */
            <div className="text-center px-4 w-full absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Ready to Join</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 px-2">
                {isPatientLink 
                  ? 'Click below to start the video consultation. You will be asked to allow camera and microphone access.'
                  : 'Click the button below to start the video consultation. You will be asked to allow camera and microphone access.'}
              </p>
              <Button 
                onClick={handleConnect} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8"
                disabled={isConnecting || sessionExpired || !hasCameraPermission || !hasMicrophonePermission}
                isLoading={isConnecting}
              >
                {sessionExpired 
                  ? 'Session Expired' 
                  : isConnecting 
                    ? 'Requesting Permissions...' 
                    : !hasCameraPermission || !hasMicrophonePermission
                      ? 'Permissions Required'
                      : 'Join Video Call'}
              </Button>
              {(() => {
                const mediaSupport = checkMediaSupport();
                if (!mediaSupport.supported) {
                  return (
                    <div className="text-yellow-400 text-xs mt-3 px-2 max-w-md space-y-1 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                      <p className="font-semibold mb-2">⚠️ Browser Compatibility Check:</p>
                      <p>• Media Devices: {mediaSupport.hasMediaDevices ? '✅' : '❌'}</p>
                      <p>• getUserMedia: {mediaSupport.hasGetUserMedia ? '✅' : '❌'}</p>
                      <p>• Secure Context: {mediaSupport.isSecure ? '✅' : '❌'} ({mediaSupport.protocol})</p>
                      {!mediaSupport.isSecure && (
                        <p className="mt-2 text-yellow-300">⚠️ Camera/mic requires HTTPS. Current: {mediaSupport.protocol}</p>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="text-gray-500 text-xs mt-3 px-2 max-w-md space-y-1">
                    <p>💡 <strong>On Mobile:</strong> A permission popup will appear. Tap "Allow" for both camera and microphone.</p>
                    <p>💡 <strong>If denied:</strong> Look for the camera/microphone icon in your browser's address bar and tap "Allow"</p>
                  </div>
                );
              })()}
              {connectionError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm max-w-md mx-auto">
                  <p className="font-semibold">Connection Error:</p>
                  <p>{typeof connectionError === 'string' ? connectionError : JSON.stringify(connectionError)}</p>
                </div>
              )}

              {/* Permission Status Indicator */}
              {!hasCameraPermission || !hasMicrophonePermission ? (
                <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-sm max-w-md mx-auto">
                  <p className="font-semibold text-yellow-300 mb-2">⚠️ Permissions Required</p>
                  <ul className="text-yellow-200 space-y-1 text-xs">
                    {!hasCameraPermission && <li>❌ Camera permission denied</li>}
                    {!hasMicrophonePermission && <li>❌ Microphone permission denied</li>}
                  </ul>
                  <p className="text-yellow-300 text-xs mt-2">
                    Please enable camera and microphone permissions to join the call.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Waiting Room UI for Patients */}
          {isInWaitingRoom && !isConnected && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700 text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-white text-xl font-semibold mb-2">Waiting Room</h3>
                <p className="text-gray-400 mb-4">
                  You are in the waiting room. The doctor will admit you to the consultation shortly.
                </p>
                <p className="text-gray-500 text-sm">
                  Please wait...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Link Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Video Link"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Link (Share this with patient)
            </label>
            <div className="flex gap-2">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/telemedicine/${sessionId}?role=patient`}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  const link = `${window.location.origin}/telemedicine/${sessionId}?role=patient`;
                  try {
                    await navigator.clipboard.writeText(link);
                    alert('Patient link copied to clipboard!');
                  } catch (error) {
                    alert('Failed to copy link');
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Link (Your link)
            </label>
            <div className="flex gap-2">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/telemedicine/${sessionId}?role=doctor`}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  const link = `${window.location.origin}/telemedicine/${sessionId}?role=doctor`;
                  try {
                    await navigator.clipboard.writeText(link);
                    alert('Doctor link copied to clipboard!');
                  } catch (error) {
                    alert('Failed to copy link');
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          
          {sessionData?.patientId?.email && (
            <div>
              <Button
                onClick={handleSendEmail}
                className="w-full"
                variant="primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Patient Link via Email to {sessionData.patientId.email}
              </Button>
            </div>
          )}
          
          <p className="text-sm text-gray-600">
            Share the <strong>Patient Link</strong> with the patient so they can join the video consultation.
            The <strong>Doctor Link</strong> is for your use.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function VideoConsultationRoom() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VideoConsultationRoomContent />
    </Suspense>
  );
}
