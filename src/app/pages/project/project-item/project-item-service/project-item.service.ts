import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectItemService {
  private url = `${HOST}api/projectitem/`;
  constructor(private http: HttpClient) {}
  getProjectItem(request: any) {
    return this.http.get<any>(`${this.url}get-project-item`, {
      params: request,
    });
  }
}
