/**
 * User-Friendly Message Mapper
 * Converts technical error messages to intuitive user-friendly messages
 */

const messageMap = {
  // Connection messages
  'Peer connection closed': 'The other person has left the call',
  'peer connection closed': 'The other person has left the call',
  'Peer connection established': 'Connected successfully',
  'Connection lost': 'Connection lost. Trying to reconnect...',
  'Connection lost. Reconnecting...': 'Connection lost. Trying to reconnect...',
  'Connection error occurred': 'Unable to connect. Please check your internet connection.',
  'Connection failed': 'Unable to connect. Trying again...',
  'Connection timeout': 'Taking longer than usual to connect. Please wait...',
  'Connection timeout.': 'Taking longer than usual to connect. Please wait...',

  // ICE/WebRTC technical messages
  'ICE connection failed': 'Connection failed. Trying again...',
  'ICE connection state': '', // Remove technical details
  'Peer-to-peer connection failed': 'Unable to connect. Please check your internet connection.',
  'Unable to establish peer-to-peer connection': 'Unable to connect. Please check your internet connection.',
  'This often happens when both users are behind firewalls or NAT': 'Please check your internet connection and try again.',
  'A TURN server may be required for your network setup': 'Please check your internet connection and try again.',

  // Reconnection messages
  'Reconnecting...': 'Reconnecting...',
  'Reconnection attempt': 'Reconnecting',
  'Max reconnection attempts reached': 'Unable to reconnect. Please refresh the page and try again.',

  // Permission messages
  'Camera and microphone permissions are required': 'Please allow camera and microphone access to join the call.',
  'Camera and microphone permissions are denied': 'Please allow camera and microphone access in your browser settings.',
  'No camera or microphone found': 'No camera or microphone detected. Please connect a device and refresh the page.',

  // Session messages
  'This session link has expired': 'This link has expired. Please request a new link.',
  'This session link has already been used': 'This link has already been used. Please request a new link.',
  'This session has expired': 'This session has expired. Please request a new link.',
  'Session not found': 'Session not found. Please check the link and try again.',

  // Waiting room messages
  'You have been rejected from the waiting room': 'Your request to join was declined.',
  'Waiting for': 'Waiting for',

  // User identification messages
  'Failed to identify user': 'Unable to identify you. Please refresh the page and try again.',
  'Failed to identify remote user': 'Unable to identify the other person. Please refresh the page and try again.',

  // General error messages
  'Failed to start video call': 'Unable to start the video call. Please try again.',
  'Failed to load session': 'Unable to load session details. Please refresh the page.',
  'Failed to load session details': 'Unable to load session details. Please refresh the page.',

  // WebRTC support messages
  'WebRTC is not supported': 'Your browser does not support video calls. Please use Chrome, Firefox, or Safari.',
  'getUserMedia is not available': 'Your browser does not support video calls. Please use Chrome, Firefox, or Safari.',

  // Encryption messages (shouldn't be shown to users, but just in case)
  'Failed to encrypt': 'Unable to secure message. Please try again.',
  'Failed to decrypt': 'Unable to read message. Please try again.',
  'Encrypted - Decryption failed': 'Unable to read this message.',

  // File messages
  'Failed to encrypt file': 'Unable to secure file. Please try again.',
  'Failed to decrypt file': 'Unable to open file. Please try again.',
  'File is encrypted but no decryption key available': 'Unable to open this file.',

  // Network messages
  'Network offline': 'You are offline. Please check your internet connection.',
  'Network back online': 'Connection restored.',
};

/**
 * Convert technical message to user-friendly message
 * @param {string} technicalMessage - The technical error/status message
 * @param {object} context - Additional context (e.g., { role: 'doctor', attempts: 3 })
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(technicalMessage, context = {}) {
  if (!technicalMessage || typeof technicalMessage !== 'string') {
    return 'Something went wrong. Please try again.';
  }

  // Check for exact matches first
  if (messageMap[technicalMessage]) {
    let message = messageMap[technicalMessage];

    // Handle reconnection attempts
    if (context.attempts !== undefined && message.includes('Reconnecting')) {
      message = `Reconnecting... (try ${context.attempts} of 10)`;
    }

    return message;
  }

  // Check for partial matches (case-insensitive)
  const lowerMessage = technicalMessage.toLowerCase();
  for (const [key, value] of Object.entries(messageMap)) {
    if (key && lowerMessage.includes(key.toLowerCase())) {
      let message = value;

      // Handle reconnection attempts
      if (context.attempts !== undefined && message.includes('Reconnecting')) {
        message = `Reconnecting... (try ${context.attempts} of 10)`;
      }

      return message || technicalMessage; // Return mapped value or original if empty
    }
  }

  // Check for common patterns
  if (lowerMessage.includes('peer connection')) {
    if (lowerMessage.includes('closed') || lowerMessage.includes('disconnected')) {
      return 'The other person has left the call';
    }
    if (lowerMessage.includes('established') || lowerMessage.includes('connected')) {
      return 'Connected successfully';
    }
  }

  if (lowerMessage.includes('connection') && lowerMessage.includes('failed')) {
    return 'Connection failed. Trying again...';
  }

  if (lowerMessage.includes('connection') && lowerMessage.includes('timeout')) {
    return 'Taking longer than usual to connect. Please wait...';
  }

  if (lowerMessage.includes('reconnecting') || lowerMessage.includes('reconnection')) {
    const attempts = context.attempts || 1;
    return `Reconnecting... (try ${attempts} of 10)`;
  }

  if (lowerMessage.includes('ice') || lowerMessage.includes('webrtc') || lowerMessage.includes('signaling')) {
    // Hide all technical WebRTC/ICE details
    if (lowerMessage.includes('failed')) {
      return 'Connection failed. Trying again...';
    }
    if (lowerMessage.includes('disconnected')) {
      return 'Connection lost. Trying to reconnect...';
    }
    return 'Connecting...';
  }

  // Default: return a generic friendly message
  return 'Something went wrong. Please try again.';
}

/**
 * Get user-friendly connection quality label
 * @param {string} quality - Technical quality level
 * @returns {string} User-friendly label
 */
export function getConnectionQualityLabel(quality) {
  const qualityMap = {
    'EXCELLENT': 'Excellent',
    'GOOD': 'Good',
    'FAIR': 'Fair',
    'POOR': 'Poor',
    'UNKNOWN': 'Checking...'
  };

  return qualityMap[quality] || 'Checking...';
}

/**
 * Get user-friendly connection status message
 * @param {string} status - Connection status
 * @param {string} reason - Technical reason (optional)
 * @returns {string} User-friendly status message
 */
export function getConnectionStatusMessage(status, reason = '') {
  const statusMessages = {
    'connected': 'Connected',
    'connecting': 'Connecting...',
    'disconnected': 'The other person has left the call',
    'reconnecting': 'Reconnecting...',
    'failed': 'Connection failed. Trying again...',
    'error': 'Unable to connect. Please check your internet connection.',
    'ended': 'Call ended',
    'closed': 'Call ended'
  };

  if (statusMessages[status]) {
    return statusMessages[status];
  }

  // If we have a reason, try to convert it
  if (reason) {
    return getUserFriendlyMessage(reason);
  }

  return 'Connecting...';
}
