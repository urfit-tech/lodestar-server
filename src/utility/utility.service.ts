import { createCipheriv } from 'crypto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class UtilityService {
  encrypt(hashKey: string, iv: string, data: string): string {
    const cipher = createCipheriv('aes-256-cbc', hashKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
