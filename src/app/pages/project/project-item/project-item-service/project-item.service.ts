import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class ProjectItemService {
  private url = `${API_ORIGIN}api/projectitem/`;
  constructor(private http: HttpClient) { }
  getProjectItem(request: any) {
    return this.http.get<any>(`${this.url}get-project-item`, {
      params: request
    });
  }
}
