'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { VideoCallManager } from '@/lib/webrtc/video-call-manager';

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
  
  const videoContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callManagerRef = useRef(null);
  const isConnectedRef = useRef(false);

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

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}/public`, undefined, true);
        if (sessionResponse.success && sessionResponse.data) {
          setSessionData(sessionResponse.data);
        } else if (user) {
          const authResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
          if (authResponse.success && authResponse.data) {
            setSessionData(authResponse.data);
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };
    if (sessionId) {
      loadSession();
    }
  }, [sessionId, user]);

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

      // Check current permission status (if API available)
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

          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            throw new Error('Camera and microphone permissions are currently denied. Please enable them in your browser settings:\n\n1. Click the lock/camera icon in your browser\'s address bar\n2. Set Camera and Microphone to "Allow"\n3. Refresh this page and try again');
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
      
      // Determine if current user is initiator (doctor starts the call)
      // Doctor is always the initiator, patient is always the receiver
      // Check session data to determine role, not just user object (auth might fail)
      let isInitiator = false;
      
      // Get session IDs for comparison
      const sessionDoctorId = session.doctorId?._id || session.doctorId;
      const sessionPatientId = session.patientId?._id || session.patientId;
      const sessionDoctorIdStr = sessionDoctorId ? sessionDoctorId.toString() : null;
      const sessionPatientIdStr = sessionPatientId ? sessionPatientId.toString() : null;
      
      // Determine initiator by comparing currentUserId with session IDs
      if (sessionDoctorIdStr && currentUserId === sessionDoctorIdStr) {
        // Current user matches doctor ID from session
        isInitiator = true;
        console.log('[VideoCall] ✅ User is DOCTOR (initiator) - matched session.doctorId');
      } else if (sessionPatientIdStr && currentUserId === sessionPatientIdStr) {
        // Current user matches patient ID from session
        isInitiator = false;
        console.log('[VideoCall] ✅ User is PATIENT (receiver) - matched session.patientId');
      } else if (user) {
        // Authenticated user but IDs don't match - assume doctor (authenticated users are usually doctors)
        isInitiator = true;
        console.log('[VideoCall] ⚠️ User is authenticated but IDs don't match session - assuming DOCTOR (initiator)');
      } else {
        // Not authenticated and IDs don't match - assume patient (anonymous users are usually patients)
        isInitiator = false;
        console.warn('[VideoCall] ⚠️ Could not determine role from session data - defaulting to PATIENT (receiver)');
        console.warn('[VideoCall] Session IDs:', {
          doctorId: sessionDoctorIdStr,
          patientId: sessionPatientIdStr,
          currentUserId: currentUserId
        });
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
          if (state.status === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
            isConnectedRef.current = true;
            setConnectionError(null);
          } else if (state.status === 'disconnected' || state.status === 'ended') {
            setIsConnected(false);
            setIsConnecting(false);
            isConnectedRef.current = false;
          } else if (state.status === 'error') {
            setIsConnecting(false);
            setConnectionError(state.error?.message || 'Connection error occurred');
          } else if (state.status === 'connecting') {
            // Keep connecting state
            setIsConnecting(true);
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

      // Mark session as started (only if user is authenticated)
      if (user) {
        try {
          await apiClient.put(`/telemedicine/sessions/${sessionId}?action=start`, {});
          console.log('[VideoCall] Session marked as started');
        } catch (error) {
          console.warn('[VideoCall] Failed to mark session as started:', error);
        }
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
      // End the call
      if (callManagerRef.current) {
        await callManagerRef.current.endCall();
        callManagerRef.current = null;
      }

      setIsConnected(false);
      setIsConnecting(false);
      setSessionDuration(0);

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
    }
  };

  const handleToggleVideo = () => {
    if (callManagerRef.current) {
      const newVideoState = !isVideoEnabled;
      callManagerRef.current.toggleVideo(newVideoState);
      setIsVideoEnabled(newVideoState);
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
            <div className="text-white text-xs sm:text-sm">
              <span className="text-gray-400 hidden sm:inline">Duration: </span>
              <span className="font-mono">{formatDuration(sessionDuration)}</span>
            </div>
          )}
          {sessionData && user && !isConnected && (
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
          {/* Video Container - WebRTC Video Streams */}
          {isConnecting || isConnected ? (
            <div 
              ref={videoContainerRef}
              className="w-full h-full relative"
            >
              {/* Remote Video (Patient/Doctor) - Full Screen */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
              />
              
              {/* Local Video (Self) - Picture in Picture */}
              <div className="absolute bottom-4 right-4 w-48 h-36 sm:w-64 sm:h-48 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-blue-500">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
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
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 sm:gap-4 bg-gray-900/80 backdrop-blur-sm px-4 py-3 rounded-full">
                  {/* Mute/Unmute Button */}
                  <button
                    onClick={handleToggleMute}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`p-3 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                  >
                    {isVideoEnabled ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                    title="End call"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                disabled={isConnecting}
                isLoading={isConnecting}
              >
                {isConnecting ? 'Requesting Permissions...' : 'Join Video Call'}
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
