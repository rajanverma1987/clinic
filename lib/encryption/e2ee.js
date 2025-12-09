/**
 * End-to-End Encryption (E2EE) Library
 * Uses Web Crypto API for AES-GCM encryption
 * HIPAA-compliant: All encryption happens client-side
 */

/**
 * Generate a shared encryption key from session data
 * Both users can derive the same key using sessionId and their user IDs
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<CryptoKey>} - Encryption key
 */
export async function deriveSharedKey(sessionId, userId1, userId2) {
  // Sort user IDs to ensure consistent key generation
  const sortedIds = [userId1, userId2].sort().join('-');

  // Create a key material from session data
  const keyMaterial = `${sessionId}-${sortedIds}`;

  // Convert to ArrayBuffer
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  // Import as a raw key and derive AES-GCM key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  const salt = encoder.encode('telemedicine-e2ee-salt'); // Fixed salt for consistency
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a text message
 * 
 * @param {string} message - Plain text message
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<string>} - Base64-encoded encrypted message with IV
 */
export async function encryptMessage(message, key) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Generate random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for transmission
    const base64 = btoa(String.fromCharCode(...combined));

    return base64;
  } catch (error) {
    console.error('[E2EE] Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a text message
 * 
 * @param {string} encryptedData - Base64-encoded encrypted message with IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<string>} - Plain text message
 */
export async function decryptMessage(encryptedData, key) {
  try {
    // Decode from base64
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    // Convert to string
    const decoder = new TextDecoder();
    const message = decoder.decode(decrypted);

    return message;
  } catch (error) {
    console.error('[E2EE] Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt a file (ArrayBuffer)
 * 
 * @param {ArrayBuffer} fileData - File data as ArrayBuffer
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<{encrypted: string, iv: string}>} - Encrypted data and IV as base64
 */
export async function encryptFile(fileData, key) {
  try {
    // Generate random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      fileData
    );

    // Convert IV and encrypted data to base64
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

    return {
      encrypted: encryptedBase64,
      iv: ivBase64
    };
  } catch (error) {
    console.error('[E2EE] File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file
 * 
 * @param {string} encryptedData - Base64-encoded encrypted file data
 * @param {string} ivBase64 - Base64-encoded IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<ArrayBuffer>} - Decrypted file data
 */
export async function decryptFile(encryptedData, ivBase64, key) {
  try {
    // Decode IV from base64
    const ivBinary = atob(ivBase64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    // Decode encrypted data from base64
    const encryptedBinary = atob(encryptedData);
    const encrypted = new Uint8Array(encryptedBinary.length);
    for (let i = 0; i < encryptedBinary.length; i++) {
      encrypted[i] = encryptedBinary.charCodeAt(i);
    }

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    return decrypted;
  } catch (error) {
    console.error('[E2EE] File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Generate a random encryption key (for testing or alternative key exchange)
 * 
 * @returns {Promise<CryptoKey>} - Random AES-GCM key
 */
export async function generateRandomKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 (for key exchange)
 * 
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<string>} - Base64-encoded key
 */
export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from base64
 * 
 * @param {string} keyBase64 - Base64-encoded key
 * @returns {Promise<CryptoKey>} - Encryption key
 */
export async function importKey(keyBase64) {
  const binaryString = atob(keyBase64);
  const keyData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    keyData[i] = binaryString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}
