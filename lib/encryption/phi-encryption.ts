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
function getEncryptionKey(): Buffer {
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
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) {
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
 * Decrypt PHI field
 */
export function decryptField(ciphertext: string): string {
  if (!ciphertext) {
    return ciphertext;
  }

  try {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
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
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mongoose plugin to encrypt/decrypt PHI fields
 */
export function phiEncryptionPlugin(schema: any, fields: string[]) {
  schema.pre('save', function (this: any, next: () => void) {
    fields.forEach((field) => {
      if (this[field] && typeof this[field] === 'string') {
        this[field] = encryptField(this[field]);
      }
    });
    next();
  });

  schema.post('init', function (this: any) {
    fields.forEach((field) => {
      if (this[field] && typeof this[field] === 'string') {
        try {
          this[field] = decryptField(this[field]);
        } catch (error) {
          // If decryption fails, field might not be encrypted (legacy data)
          // Log error but don't break the app
          console.error(`Decryption failed for field ${field}:`, error);
        }
      }
    });
  });

  schema.post('find', function (docs: any[]) {
    docs.forEach((doc) => {
      fields.forEach((field) => {
        if (doc[field] && typeof doc[field] === 'string') {
          try {
            doc[field] = decryptField(doc[field]);
          } catch (error) {
            console.error(`Decryption failed for field ${field}:`, error);
          }
        }
      });
    });
  });

  schema.post('findOne', function (doc: any) {
    if (doc) {
      fields.forEach((field) => {
        if (doc[field] && typeof doc[field] === 'string') {
          try {
            doc[field] = decryptField(doc[field]);
          } catch (error) {
            console.error(`Decryption failed for field ${field}:`, error);
          }
        }
      });
    }
  });
}

