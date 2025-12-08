'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VideoCallManager } from '@/lib/webrtc/video-call';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';

function VideoConsultationRoomContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const authContext = useAuth();
  const user = authContext?.user || null; // Allow null user for patients
  const sessionId = params.id;
  
  // Check if this is a patient link (from query parameter)
  const isPatientLink = searchParams.get('role') === 'patient' || !user;

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callManagerRef = useRef(null);
  const screenShareStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [remoteUserId, setRemoteUserId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sessionData, setSessionData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Session timer - only start when connected
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

  // Request camera and microphone permissions on page load (desktop only)
  // On mobile, permissions must be requested on user interaction (button click)
  useEffect(() => {
    const requestPermissions = async () => {
      // Only request once
      if (permissionsRequested) return;
      
      // Check if we're on a patient link or if user is not authenticated
      const isPatient = isPatientLink || !user;
      
      // Only request on desktop - mobile requires user interaction
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Skip auto-request on mobile - will request on button click
        return;
      }
      
      // Request permissions for patients on desktop
      if (isPatient) {
        try {
          // Check if getUserMedia is available
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('getUserMedia is not supported in this browser');
            setPermissionsRequested(true);
            return;
          }

          console.log('Requesting camera and microphone permissions for patient (desktop)...');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          // Stop the stream immediately - we just wanted permission
          stream.getTracks().forEach(track => track.stop());
          console.log('Permissions granted');
          setPermissionsRequested(true);
        } catch (error) {
          console.warn('Permission request failed or denied:', error);
          setPermissionsRequested(true); // Mark as requested even if denied
        }
      }
    };

    // Request permissions after a short delay to ensure page is loaded (desktop only)
    const timeoutId = setTimeout(() => {
      requestPermissions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isPatientLink, user, permissionsRequested]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load session data on mount (use public endpoint if not authenticated)
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Try public endpoint first (works for both authenticated and unauthenticated users)
        const sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
        if (sessionResponse.success && sessionResponse.data) {
          setSessionData(sessionResponse.data);
        } else {
          // Fallback to authenticated endpoint if user is logged in
          if (user) {
            const authResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
            if (authResponse.success && authResponse.data) {
              setSessionData(authResponse.data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        // If public endpoint fails and user is not authenticated, try public again
        if (!user) {
          try {
            const publicResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
            if (publicResponse.success && publicResponse.data) {
              setSessionData(publicResponse.data);
            }
          } catch (publicError) {
            console.error('Failed to load session from public endpoint:', publicError);
          }
        }
      }
    };
    if (sessionId) {
      loadSession();
    }
  }, [sessionId, user]);

  const handleConnect = async () => {
    console.log('=== handleConnect called ===');
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Check and request permissions (required for mobile browsers)
      // We'll do a quick permission check first, then let startCall handle the actual stream
      const isMobile = typeof window !== 'undefined' && 
                       typeof navigator !== 'undefined' && 
                       navigator.userAgent && 
                       /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Check if we can query permissions (not all browsers support this)
      let hasPermissions = false;
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          hasPermissions = cameraPermission?.state === 'granted' && microphonePermission?.state === 'granted';
          console.log('[Step 1] Permission check:', {
            camera: cameraPermission?.state,
            microphone: microphonePermission?.state,
            hasPermissions
          });
        } catch (e) {
          console.log('[Step 1] Permission query not supported, will request directly:', e);
        }
      }
      
      // On mobile, we need user interaction to request permissions
      // So we do a quick test request here, but don't keep the stream
      if (isMobile && !hasPermissions) {
        try {
          console.log('[Step 1] Requesting camera and microphone permissions (mobile)...');
          
          // Check if getUserMedia is available (with fallback)
          let getUserMedia = null;
          if (typeof navigator !== 'undefined') {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
            } else if (navigator.getUserMedia) {
              getUserMedia = (constraints) => new Promise((resolve, reject) => {
                navigator.getUserMedia(constraints, resolve, reject);
              });
            } else if (navigator.webkitGetUserMedia) {
              getUserMedia = (constraints) => new Promise((resolve, reject) => {
                navigator.webkitGetUserMedia(constraints, resolve, reject);
              });
            } else if (navigator.mozGetUserMedia) {
              getUserMedia = (constraints) => new Promise((resolve, reject) => {
                navigator.mozGetUserMedia(constraints, resolve, reject);
              });
            }
          }
          
          if (!getUserMedia) {
            throw new Error('getUserMedia is not supported in this browser');
          }
          
          const stream = await getUserMedia({
            video: {
              facingMode: 'user', // Prefer front-facing camera on mobile
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          
          if (!stream) {
            throw new Error('Failed to get media stream: stream is null');
          }
          
          // Stop the stream immediately - we'll get it again in startCall with proper settings
          const tracks = stream.getTracks();
          if (tracks && tracks.length > 0) {
            tracks.forEach(track => {
              if (track && track.stop) {
                track.stop();
              }
            });
          }
          console.log('[Step 1] Permissions granted on mobile');
        } catch (error) {
          console.error('[Step 1] Permission request failed:', error, {
            name: error.name,
            message: error.message,
            constraint: error.constraint
          });
          
          // Only stop and show error for actual permission errors
          // Other errors (like device busy, constraints) will be handled in startCall
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setIsConnecting(false);
            const errorMessage = 'Please allow camera and microphone access in your browser settings and try again.';
            setConnectionError(errorMessage);
            alert(errorMessage);
            return;
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            setIsConnecting(false);
            const errorMessage = 'No camera or microphone found. Please connect a device and try again.';
            setConnectionError(errorMessage);
            alert(errorMessage);
            return;
          } else {
            // For other errors (NotReadableError, OverconstrainedError, etc.), 
            // log but continue - startCall will handle them with simpler constraints
            console.warn('[Step 1] Non-critical error, continuing to startCall:', error.name, error.message);
          }
        }
      } else if (isMobile && hasPermissions) {
        console.log('[Step 1] Permissions already granted, skipping permission request');
      }

      // Use cached session data or fetch if not available
      console.log('[Step 2] Loading session data...');
      let session = sessionData;
      if (!session) {
        // Try public endpoint first
        let sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
        if (!sessionResponse.success || !sessionResponse.data) {
          // Fallback to authenticated endpoint if user is logged in
          if (user) {
            sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
          }
        }
        
        if (!sessionResponse.success || !sessionResponse.data) {
          console.error('[Step 2] Failed to load session:', sessionResponse);
          setIsConnecting(false);
          setConnectionError('Failed to load session details');
          alert('Failed to load session details');
          return;
        }
        session = sessionResponse.data;
        setSessionData(session);
        console.log('[Step 2] Session loaded:', session);
      } else {
        console.log('[Step 2] Using cached session data');
      }

      console.log('[Step 3] Setting up connection parameters...');
      const doctorId = session.doctorId?._id || session.doctorId;
      const patientId = session.patientId?._id || session.patientId;
      
      if (!doctorId || !patientId) {
        console.error('[Step 3] Missing doctorId or patientId:', { doctorId, patientId });
        setIsConnecting(false);
        setConnectionError('Invalid session: missing doctor or patient information');
        alert('Invalid session: missing doctor or patient information');
        return;
      }
      
      // Determine remote user ID (if doctor, remote is patient and vice versa)
      // If user is not logged in, assume they are the patient
      const doctorIdStr = String(doctorId).trim();
      const patientIdStr = String(patientId).trim();
      const userUserIdStr = user ? String(user.userId).trim() : null;
      
      const isDoctor = user ? (userUserIdStr === doctorIdStr) : false;
      
      // Generate a consistent user ID for signaling
      // IMPORTANT: For WebRTC signaling, we use a consistent format:
      // - Doctor uses their actual userId
      // - Patient ALWAYS uses `patient-{patientId}` format (even if logged in)
      // This ensures the doctor can always send to the correct userId
      const currentUserId = isDoctor ? userUserIdStr : `patient-${patientIdStr}`;
      
      // For remote user ID:
      // - Doctor sends to patient's signaling userId: `patient-{patientId}`
      // - Patient sends to doctor's userId: `{doctorId}`
      const remote = isDoctor 
        ? `patient-${patientIdStr}` // Doctor always sends to patient-{patientId} format
        : doctorIdStr; // Patient sends to doctor's userId
      
      setRemoteUserId(remote);
      
      console.log('[Step 3] Connection setup:', {
        isDoctor,
        currentUserId,
        remoteUserId: remote,
        doctorId: doctorIdStr,
        patientId: patientIdStr,
        userUserId: userUserIdStr,
        userRole: user?.role,
        sessionDoctorId: session.doctorId,
        sessionPatientId: session.patientId,
        comparison: user ? `${userUserIdStr} === ${doctorIdStr} = ${userUserIdStr === doctorIdStr}` : 'no user',
        note: isDoctor ? `Doctor sending to patient userId: ${remote}` : `Patient sending to doctor userId: ${remote}`,
      });

      // Initialize WebRTC call
      const callManager = new VideoCallManager(
        {
          sessionId,
          userId: currentUserId,
          remoteUserId: remote,
          isInitiator: isDoctor, // Doctor initiates the call
        },
        {
          onLocalStream: (stream) => {
            console.log('[Telemedicine] 📹 onLocalStream callback called:', {
              hasStream: !!stream,
              tracks: stream?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
              hasVideoRef: !!videoRef.current
            });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              localStreamRef.current = stream; // Store for screen share
              console.log('[Telemedicine] ✅ Local stream set to video element');
              
              // Ensure video plays
              videoRef.current.play().catch(err => {
                console.error('[Telemedicine] ❌ Failed to play local video:', err);
              });
            } else {
              console.warn('[Telemedicine] ⚠️ videoRef.current is null, cannot set local stream');
            }
          },
          onRemoteStream: (stream) => {
            console.log('[Telemedicine] 📹 onRemoteStream callback called:', {
              hasStream: !!stream,
              tracks: stream?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })),
              hasRemoteVideoRef: !!remoteVideoRef.current
            });
            if (remoteVideoRef.current && stream) {
              remoteVideoRef.current.srcObject = stream;
              console.log('[Telemedicine] ✅ Remote stream set to video element');
              
              // Ensure video plays and audio is enabled
              remoteVideoRef.current.play().catch(err => {
                console.error('[Telemedicine] ❌ Failed to play remote video:', err);
              });
              
              // Ensure audio tracks are enabled
              stream.getAudioTracks().forEach(track => {
                if (track && track.readyState === 'live') {
                  track.enabled = true;
                  console.log('[Telemedicine] ✅ Remote audio track enabled:', track.id);
                }
              });
              
              // Ensure video tracks are enabled
              stream.getVideoTracks().forEach(track => {
                if (track && track.readyState === 'live') {
                  track.enabled = true;
                  console.log('[Telemedicine] ✅ Remote video track enabled:', track.id);
                }
              });
            } else {
              console.warn('[Telemedicine] ⚠️ remoteVideoRef.current is null or stream is null, cannot set remote stream');
            }
          },
          onConnectionChange: (state) => {
            console.log('[Callback] WebRTC connection state changed:', state);
            setConnectionStatus(state);
            // Update connection status immediately
            if (state === 'connected' || state === 'completed') {
              setIsConnected(true);
              setIsConnecting(false);
              setConnectionStatus('connected');
              setConnectionError(null);
              // Timer will start automatically via useEffect when isConnected becomes true
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
              setIsConnected(false);
              setIsConnecting(false);
              if (state === 'failed') {
                setConnectionError('Connection failed. Please try again.');
              }
            } else if (state === 'connecting' || state === 'checking') {
              // Keep showing connecting state
              setConnectionStatus('connecting');
            }
          },
          onError: (error) => {
            console.error('[Callback] WebRTC error:', error);
            setIsConnecting(false);
            setConnectionError(error.message || 'Failed to establish connection. Please try again.');
            alert(error.message || 'Failed to establish connection. Please try again.');
          },
        }
      );

      callManagerRef.current = callManager;
      setConnectionStatus('connecting'); // Set initial state
      
      console.log('[Step 5] Starting video call...');
      try {
        await callManager.startCall();
        console.log('[Step 5] Call manager started successfully');
        
        // Ensure local stream is displayed if it wasn't set via callback
        // This is a fallback in case the callback didn't fire or videoRef wasn't ready
        setTimeout(() => {
          if (callManagerRef.current?.peerConnection?.localStream) {
            const stream = callManagerRef.current.peerConnection.localStream;
            if (videoRef.current && !videoRef.current.srcObject) {
              console.log('[Step 5] Fallback: Setting local stream to video element');
              videoRef.current.srcObject = stream;
              localStreamRef.current = stream;
              videoRef.current.play().catch(err => {
                console.error('[Step 5] Failed to play local video in fallback:', err);
              });
            }
          }
        }, 500);
      } catch (error) {
        console.error('[Step 5] Failed to start call manager:', error);
        setConnectionStatus('failed');
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(error.message || 'Failed to start video call');
        alert(`Failed to start video call: ${error.message || 'Please check your camera and microphone permissions and try again.'}`);
        return;
      }
      
      // Don't set isConnected to true here - wait for actual connection
      // Timer will start automatically when isConnected becomes true

      // Mark session as started (only if user is authenticated)
      console.log('[Step 6] Marking session as started...');
      if (user) {
        try {
          await apiClient.put(`/telemedicine/sessions/${sessionId}?action=start`, {});
          console.log('[Step 6] Session marked as started');
        } catch (error) {
          console.warn('[Step 6] Failed to mark session as started:', error);
          // Continue even if this fails
        }
      }
      
      console.log('[Complete] Video call initialization complete');
    } catch (error) {
      console.error('[Error] Failed to start call:', error);
      setConnectionStatus('failed');
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(error.message || 'Failed to start video call');
      alert(`Failed to start video call: ${error.message || 'Please check camera/microphone permissions.'}`);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    
    // Try using call manager first
    if (callManagerRef.current) {
      try {
        callManagerRef.current.toggleMute(newMutedState);
      } catch (error) {
        console.warn('Failed to toggle mute via call manager:', error);
      }
    }
    
    // Always update tracks directly as fallback
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState; // Disable if muted, enable if unmuted
      });
    }
    
    setIsMuted(newMutedState);
  };

  const toggleVideo = () => {
    const newVideoOffState = !isVideoOff;
    
    // Try using call manager first
    if (callManagerRef.current) {
      try {
        callManagerRef.current.toggleVideo(!newVideoOffState); // Pass enabled state (opposite of isVideoOff)
      } catch (error) {
        console.warn('Failed to toggle video via call manager:', error);
      }
    }
    
    // Always update tracks directly as fallback
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !newVideoOffState; // Disable if video off, enable if video on
      });
    }
    
    setIsVideoOff(newVideoOffState);
  };


  const handleScreenShare = async () => {
    if (!callManagerRef.current || !isConnected) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await callManagerRef.current.stopScreenShare();
        
        // Restore local video stream
        if (localStreamRef.current && videoRef.current) {
          videoRef.current.srcObject = localStreamRef.current;
        }
        
        // Stop screen share stream
        if (screenShareStreamRef.current) {
          screenShareStreamRef.current.getTracks().forEach(track => track.stop());
          screenShareStreamRef.current = null;
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await callManagerRef.current.startScreenShare();
        
        // Store the screen share stream
        screenShareStreamRef.current = screenStream;
        
        // Replace local video with screen share
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && videoRef.current) {
            videoRef.current.srcObject = localStreamRef.current;
          }
        });
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Failed to share screen: ' + (error.message || 'Please check your browser permissions.'));
    }
  };

  const handleEndCall = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }

    // Stop screen share if active
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Cleanup call manager
    if (callManagerRef.current) {
      callManagerRef.current.endCall();
    }

    if (window.confirm('Are you sure you want to end this consultation?')) {
      // If user is authenticated (doctor), go to summary page
      // If user is not authenticated (patient), just close the window/tab
      if (user) {
        router.push(`/telemedicine/${sessionId}/summary`);
      } else {
        // For patients, just close or go back
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      }
    }
  };

  const handleShareLink = async () => {
    // Generate separate links for doctor and patient
    const doctorLink = `${window.location.origin}/telemedicine/${sessionId}?role=doctor`;
    const patientLink = `${window.location.origin}/telemedicine/${sessionId}?role=patient`;
    
    try {
      // Copy patient link to clipboard (this is what should be shared)
      await navigator.clipboard.writeText(patientLink);
      alert('Patient video link copied to clipboard!');
    } catch (error) {
      // Fallback: show modal with both links
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
          <div className="text-white text-xs sm:text-sm">
            <span className="text-gray-400 hidden sm:inline">Duration: </span>
            <span className="font-mono">{formatDuration(sessionDuration)}</span>
          </div>
          {sessionData && user && (
            <button
              onClick={handleShareLink}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              title="Share video link with patient"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {!isConnected ? (
            <div className="text-center px-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Ready to Join</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 px-2">
                {isPatientLink 
                  ? 'Camera and microphone permissions have been requested. Click below to start the video consultation.'
                  : 'Click the button below to start the video consultation'}
              </p>
              <Button 
                onClick={handleConnect} 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8"
                disabled={isConnecting}
                isLoading={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Join Video Call'}
              </Button>
              {connectionError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  <p className="font-semibold">Connection Error:</p>
                  <p>{connectionError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* Remote Video (Full Screen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  console.log('[Telemedicine] ✅ Remote video metadata loaded');
                  if (remoteVideoRef.current) {
                    // Ensure audio is not muted
                    remoteVideoRef.current.muted = false;
                    remoteVideoRef.current.play().catch(err => {
                      console.error('[Telemedicine] ❌ Failed to play remote video after metadata:', err);
                    });
                  }
                }}
                onCanPlay={() => {
                  console.log('[Telemedicine] ✅ Remote video can play');
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play().catch(err => {
                      console.error('[Telemedicine] ❌ Failed to play remote video on canPlay:', err);
                    });
                  }
                }}
                onError={(e) => {
                  console.error('[Telemedicine] ❌ Remote video error:', e);
                }}
              />

              {/* Local Video (Picture in Picture) */}
              <div className="absolute bottom-16 sm:bottom-4 right-2 sm:right-4 w-32 h-24 sm:w-64 sm:h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log('[Telemedicine] ✅ Local video metadata loaded');
                    if (videoRef.current) {
                      videoRef.current.play().catch(err => {
                        console.error('[Telemedicine] ❌ Failed to play local video after metadata:', err);
                      });
                    }
                  }}
                  onError={(e) => {
                    console.error('[Telemedicine] ❌ Local video error:', e);
                  }}
                />
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
                  <span className="bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                    You
                  </span>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-2 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gray-800 bg-opacity-90 rounded-full px-2 py-2 sm:px-6 sm:py-3 flex items-center space-x-2 sm:space-x-4 shadow-lg">
                  <button
                    onClick={toggleMute}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMuted ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      )}
                    </svg>
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${
                      isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                  >
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isVideoOff ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-2 sm:p-3 px-4 sm:px-6 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                    title="End call"
                  >
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                  </button>

                  <button
                    onClick={handleScreenShare}
                    className="p-2 sm:p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors hidden sm:block"
                    title="Share screen"
                    disabled={!isConnected}
                  >
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Connection Status Banner */}
      {isConnected && connectionStatus && connectionStatus !== 'connected' && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-10 max-w-[90%] sm:max-w-none">
          <Card className="px-3 py-2 sm:px-6 sm:py-3">
            <p className="text-xs sm:text-sm text-gray-700">
              <strong>Connection Status:</strong> {connectionStatus}
              {connectionStatus === 'connecting' && ' - Establishing connection...'}
              {connectionStatus === 'disconnected' && ' - Attempting to reconnect...'}
              {connectionStatus === 'failed' && ' - Connection failed. Please try again.'}
            </p>
          </Card>
        </div>
      )}

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
                onClick={async () => {
                  const patientLink = `${window.location.origin}/telemedicine/${sessionId}?role=patient`;
                  if (!sessionData?.patientId?.email) {
                    alert('Patient email not available');
                    return;
                  }

                  try {
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
                }}
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

