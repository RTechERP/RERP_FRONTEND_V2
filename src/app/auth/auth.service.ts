import { Injectable } from '@angular/core';
import { HOST } from '../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = HOST + 'api/home/login';
  private tokenkey = 'token';
  constructor(private http: HttpClient) {}

  login(credentials: { loginname: string; password: string }): Observable<any> {
    return this.http.post(this.apiUrl, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenkey, response.access_token);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenkey);
  }

  logout() {
    localStorage.removeItem(this.tokenkey);
     sessionStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenkey);
  }
}
