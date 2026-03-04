import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private secret = 'INTERNAL_APP_SECRET_2025'; // đổi chuỗi này

  private async getKey(): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('internal-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(text: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.getKey();
    const encoded = new TextEncoder().encode(text);

    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(cipher))
    });
  }

  async decrypt(cipherText: string): Promise<string> {
    const parsed = JSON.parse(cipherText);
    const iv = new Uint8Array(parsed.iv);
    const data = new Uint8Array(parsed.data);

    const key = await this.getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }
}
