import { createCipheriv, createHash, scryptSync, pbkdf2Sync } from 'crypto';
import { Injectable } from '@nestjs/common';
import { camelCase, isArray, isDate, isObject, transform } from 'lodash';
import { Readable, Transform } from 'node:stream';

@Injectable()
export class UtilityService {
  generateMD5Hash(target: string) {
    return createHash('md5').update(target).digest('hex');
  }

  encrypt(hashKey: string, iv: string, data: string): string {
    const cipher = createCipheriv('aes-256-cbc', hashKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  encryptDataStream(dataStream, key, iv) {
    let hashKey: string;
    let hashIv: string;
    const iterations = parseInt(process.env.PBKDF2_ITERATIONS, 10) || 10000;
    const salt = process.env.ENCRYPT_DATA_STREAM_SALT;

    if (key.length < 64) {
      hashKey = key.padEnd(64, '0');
    }

    if (iv.length < 32) {
      hashIv = iv.padEnd(32, '0');
    }

    const derivedKey = pbkdf2Sync(hashKey, salt, iterations, 32, 'sha256');
    const derivedIv = pbkdf2Sync(hashIv, salt, iterations, 16, 'sha256');
    const cipher = createCipheriv('aes-256-cbc', derivedKey, derivedIv);
    let totalLength = 0;
    const encryptedChunks = [];

    const encryptedStream = new Transform({
      transform(chunk, encoding, callback) {
        totalLength += chunk.length;
        try {
          const encryptedChunk = cipher.update(chunk);
          encryptedChunks.push(encryptedChunk);
          callback();
        } catch (err) {
          callback(err);
        }
      },
      flush(callback) {
        try {
          encryptedChunks.push(cipher.final());
          this.push(Buffer.concat(encryptedChunks));
          callback();
        } catch (err) {
          callback(err);
        }
      },
    });
    dataStream.pipe(encryptedStream);
    return encryptedStream;
  }

  sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  arrayBufferToBase64Url(buffer: any): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  objectToBase64url(payload: any): string {
    return this.arrayBufferToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  }

  convertObjectKeysToCamelCase(obj): any {
    return transform(obj, (acc, value, key, target) => {
      const camelKey = isArray(target) ? key : camelCase(key as any);
      acc[camelKey] = isDate(value) ? value : isObject(value) ? this.convertObjectKeysToCamelCase(value) : value;
    });
  }
}
