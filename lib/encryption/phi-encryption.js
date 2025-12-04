import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * In production, use a proper key management system (KMS)
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise, derive key using PBKDF2
  return crypto.pbkdf2Sync(key, 'clinic-phi-salt', 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt PHI field (diagnosis, notes, prescriptions)
 * Only encrypts if the field is not already encrypted
 */
export function encryptField(plaintext) {
  if (!plaintext) {
    return plaintext;
  }

  // Check if already encrypted (avoid double encryption)
  if (isEncryptedFormat(plaintext)) {
    return plaintext;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is in encrypted format (iv:tag:encrypted)
 */
function isEncryptedFormat(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const parts = text.split(':');
  if (parts.length !== 3) {
    return false;
  }
  // Check if iv and tag are valid hex strings with correct lengths
  const [ivHex, tagHex] = parts;
  return ivHex.length === 32 && tagHex.length === 32 && /^[0-9a-f]+$/i.test(ivHex) && /^[0-9a-f]+$/i.test(tagHex);
}

/**
 * Decrypt PHI field
 * Returns plain text if decryption fails or if field is not encrypted (for backward compatibility)
 */
export function decryptField(ciphertext) {
  if (!ciphertext) {
    return ciphertext;
  }

  // Check if the field is in encrypted format
  if (!isEncryptedFormat(ciphertext)) {
    // Field is not encrypted (legacy data or plain text), return as-is
    return ciphertext;
  }

  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');
    
    if (parts.length !== 3) {
      // Not in encrypted format, return as-is
      return ciphertext;
    }

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails, return the original value (might be plain text or corrupted)
    // Log a warning but don't break the application
    console.warn(`Decryption failed, returning original value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return ciphertext;
  }
}

/**
 * Mongoose plugin to encrypt/decrypt PHI fields
 */
export function phiEncryptionPlugin(schema, fields) {
  schema.pre('save', function (next) {
    fields.forEach((field) => {
      if (this[field] && typeof this[field] === 'string') {
        this[field] = encryptField(this[field]);
      }
    });
    next();
  });

  schema.post('init', function () {
    fields.forEach((field) => {
      if (this[field] && typeof this[field] === 'string') {
        try {
          // decryptField now handles errors gracefully and returns original value if decryption fails
          this[field] = decryptField(this[field]);
        } catch (error) {
          // If decryption fails, keep original value (might be plain text or corrupted)
          // Don't log error here as decryptField already handles it
        }
      }
    });
  });

  schema.post('find', function (docs) {
    docs.forEach((doc) => {
      fields.forEach((field) => {
        if (doc[field] && typeof doc[field] === 'string') {
          try {
            // decryptField now handles errors gracefully and returns original value if decryption fails
            doc[field] = decryptField(doc[field]);
          } catch (error) {
            // If decryption fails, keep original value (might be plain text or corrupted)
            // Don't log error here as decryptField already handles it
          }
        }
      });
    });
  });

  schema.post('findOne', function (doc) {
    if (doc) {
      fields.forEach((field) => {
        if (doc[field] && typeof doc[field] === 'string') {
          try {
            // decryptField now handles errors gracefully and returns original value if decryption fails
            doc[field] = decryptField(doc[field]);
          } catch (error) {
            // If decryption fails, keep original value (might be plain text or corrupted)
            // Don't log error here as decryptField already handles it
          }
        }
      });
    }
  });
}

