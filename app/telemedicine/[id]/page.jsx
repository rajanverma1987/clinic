'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VideoCallManager } from '@/lib/webrtc/video-call';
import { apiClient } from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';

export default function VideoConsultationRoom() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const sessionId = params.id;

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callManagerRef = useRef(null);
  const screenShareStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [remoteUserId, setRemoteUserId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [sessionData, setSessionData] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Session timer
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
        if (sessionResponse.success && sessionResponse.data) {
          setSessionData(sessionResponse.data);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleConnect = async () => {
    try {
      // Use cached session data or fetch if not available
      let session = sessionData;
      if (!session) {
        const sessionResponse = await apiClient.get(`/telemedicine/sessions/${sessionId}`);
        if (!sessionResponse.success || !sessionResponse.data) {
          alert('Failed to load session details');
          return;
        }
        session = sessionResponse.data;
        setSessionData(session);
      }

      const doctorId = session.doctorId?._id || session.doctorId;
      const patientId = session.patientId?._id || session.patientId;
      
      // Determine remote user ID (if doctor, remote is patient and vice versa)
      const isDoctor = user?.userId === doctorId;
      const remote = isDoctor ? patientId : doctorId;
      setRemoteUserId(remote);

      // Initialize WebRTC call
      const callManager = new VideoCallManager(
        {
          sessionId,
          userId: user?.userId || '',
          remoteUserId: remote,
          isInitiator: isDoctor, // Doctor initiates the call
        },
        {
          onLocalStream: (stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          },
          onRemoteStream: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          onConnectionChange: (state) => {
            setConnectionStatus(state);
            console.log('WebRTC connection state:', state);
          },
          onError: (error) => {
            console.error('WebRTC error:', error);
            alert(error.message);
          },
        }
      );

      callManagerRef.current = callManager;
      await callManager.startCall();
      setIsConnected(true);

      // Mark session as started
      await apiClient.put(`/telemedicine/sessions/${sessionId}?action=start`, {});
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start video call. Please check camera/microphone permissions.');
    }
  };

  const toggleMute = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderName: `${user?.firstName} ${user?.lastName}`,
      message: chatMessage,
      timestamp: new Date(),
      isMe: true,
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatMessage('');

    // TODO: Send message via WebSocket/API
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
      router.push(`/telemedicine/${sessionId}/summary`);
    }
  };

  const handleShareLink = async () => {
    const videoLink = `${window.location.origin}/telemedicine/${sessionId}`;
    
    try {
      // Try to copy to clipboard
      await navigator.clipboard.writeText(videoLink);
      alert('Video link copied to clipboard!');
    } catch (error) {
      // Fallback: show modal with link
      setShowShareModal(true);
    }
  };

  const handleSendEmail = async () => {
    if (!sessionData?.patientId?.email) {
      alert('Patient email not available');
      return;
    }

    try {
      const response = await apiClient.post('/telemedicine/sessions/send-link', {
        sessionId,
        patientEmail: sessionData.patientId.email,
        videoLink: `${window.location.origin}/telemedicine/${sessionId}`,
      });

      if (response.success) {
        alert('Video link sent to patient via email!');
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
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold">Telemedicine Consultation</h2>
            <p className="text-gray-400 text-sm">Session: {sessionId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-white">
            <span className="text-sm text-gray-400">Duration: </span>
            <span className="font-mono">{formatDuration(sessionDuration)}</span>
          </div>
          {sessionData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              title="Share video link with patient"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Link
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            {showChat ? 'Hide' : 'Show'} Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {!isConnected ? (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">Ready to Join</h3>
              <p className="text-gray-400 mb-6">Click the button below to start the video consultation</p>
              <Button onClick={handleConnect} size="lg">
                Join Video Call
              </Button>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* Remote Video (Full Screen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (Picture in Picture) */}
              <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2">
                  <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    You
                  </span>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-gray-800 bg-opacity-90 rounded-full px-6 py-3 flex items-center space-x-4 shadow-lg">
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMuted ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      )}
                    </svg>
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isVideoOff ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="p-3 px-6 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                    title="End call"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                  </button>

                  <button
                    onClick={handleScreenShare}
                    className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                    title="Share screen"
                    disabled={!isConnected}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-96 bg-white flex flex-col border-l border-gray-200">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Chat</h3>
              <p className="text-sm text-gray-600">Secure messaging</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  size="sm"
                >
                  Send
                </Button>
              </div>

              {/* File Upload */}
              <div className="mt-2">
                <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attach File
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status Banner */}
      {isConnected && connectionStatus !== 'connected' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <Card className="px-6 py-3">
            <p className="text-sm text-gray-700">
              <strong>Connection Status:</strong> {connectionStatus}
              {connectionStatus === 'connecting' && ' - Establishing connection...'}
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
              Video Consultation Link
            </label>
            <div className="flex gap-2">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/telemedicine/${sessionId}`}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={async () => {
                  const link = `${window.location.origin}/telemedicine/${sessionId}`;
                  try {
                    await navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard!');
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
                Send Link via Email to {sessionData.patientId.email}
              </Button>
            </div>
          )}
          
          <p className="text-sm text-gray-600">
            Share this link with the patient so they can join the video consultation.
          </p>
        </div>
      </Modal>
    </div>
  );
}

