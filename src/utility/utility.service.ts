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

  encryptDataStream(hashKey: string, hashiv: Buffer, dataStream: Readable): Readable {
    const key = scryptSync(hashKey, 'salt', 32);
    const iv = scryptSync(hashiv, 'salt', 16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);

    let encryptedChunks = [];
    console.log(iv);
    const ivHex = iv.toString('hex');
    encryptedChunks = [Buffer.from(ivHex, 'hex')]; // 將IV加到加密數據的開頭
    console.log('key', key);
    let totalLength = 0;

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
        console.log('原始數據長度:', totalLength);
        try {
          encryptedChunks.push(cipher.final());
          this.push(Buffer.concat(encryptedChunks));
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
