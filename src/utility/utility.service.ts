import { createCipheriv, createHash, scryptSync } from 'crypto';
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

  encryptDataStream(hashKey: string, iv: Buffer, dataStream: Readable): Readable {
    const key = scryptSync(hashKey, 'salt', 32);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encryptedStream = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const encryptedChunk = cipher.update(chunk);
          this.push(encryptedChunk);
          callback();
        } catch (err) {
          callback(err);
        }
      },

      flush(callback) {
        try {
          this.push(cipher.final());
          callback();
        } catch (err) {
          callback(err);
        }
      },
    });
    return dataStream.pipe(encryptedStream);
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
