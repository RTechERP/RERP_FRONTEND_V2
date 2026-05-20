import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionManagerService {
  private url = environment.host + 'api/formandFunctionGroup';

  constructor(private http: HttpClient) {}

  // ============================================================
  // Group (Master) methods
  // ============================================================

  getGroups(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  saveGroup(model: any): Observable<any> {
    return this.http.post<any>(`${this.url}/save-data`, model);
  }

  // ============================================================
  // Function (Detail) methods
  // ============================================================

  getAllFunctions(): Observable<any> {
    return this.http.get<any>(`${this.url}/get-functions`);
  }

  getFunctionsByGroup(groupId: number): Observable<any> {
    return this.http.get<any>(`${this.url}/get-by-group?groupId=${groupId}`);
  }

  saveFunction(model: any): Observable<any> {
    return this.http.post<any>(`${this.url}/save-function`, model);
  }
}
