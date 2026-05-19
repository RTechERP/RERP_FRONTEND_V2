import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PinAuthService {
  private apiUrl = `${environment.host}api/PinAuth`;

  constructor(private http: HttpClient) { }

  checkPinStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/check-pin-status`);
  }

  setPin(pin: string, confirmPin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/set-pin`, { pin, confirmPin });
  }

  verifyPin(pin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-pin`, { pin });
  }

  requestResetPin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-reset-pin`, {});
  }

  resetPin(token: string, newPin: string, confirmPin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-pin`, { token, newPin, confirmPin });
  }

  validateToken(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-token`, JSON.stringify(token), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Session management
  setAuthenticated(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      sessionStorage.setItem('is_pin_authenticated', 'true');
    } else {
      sessionStorage.removeItem('is_pin_authenticated');
    }
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem('is_pin_authenticated') === 'true';
  }

  clearSession(): void {
    sessionStorage.removeItem('is_pin_authenticated');
  }
}
