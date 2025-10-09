import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class FilmManagementService {
  private url = `${HOST}api/FilmManagement/`;
  constructor(private http: HttpClient) {}
  getFilm(request: { keyWord?: string; page?: number; size?: number }) {
    const params = new HttpParams()
      .set('filterText', request.keyWord ?? '')
      .set('Page', String(request.page ?? 1))
      .set('Size', String(request.size ?? 30));

    return this.http.get<any>(`${this.url}get-film`, { params });
  }
  getFilmDetail(filmManagementID: number): Observable<any> {
    const url = `${
      this.url + `get-film-detail`
    }?filmManagementID=${filmManagementID}`;
    return this.http.get<any>(url);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
  getFilmAjax(): string {
    return `${this.url}get-film`;
  }
}
