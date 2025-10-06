import { Injectable } from '@angular/core';
import { HOST } from '../../../../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = HOST + 'api/menu/';
  constructor(private http: HttpClient) {}

  getMenus(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `menus/${id}`);
  }
}
