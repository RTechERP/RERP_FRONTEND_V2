import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HomeLayoutService {
  constructor(private http: HttpClient) {}
  getMenuParents(): Observable<any> {
    return this.http.get<any>(HOST + `api/menu/menus/parent`);
  }
}
