import { Injectable } from '@angular/core';
import { host } from '../../../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = host + 'api/menu/';
  constructor(private http: HttpClient) {}

  getMenus(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'menus/0');
  }
}
