import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../../../app.config';

export interface SaveMasterWithDetailsDto {
  master: {
    Code: string;
    Title: string;
    UnitName?: string;
    PerformanceAVG?: string | number | null;
    RequestResult?: string;
  };
  details: Array<{
    DetailIndex: number;
    Code: string;
    Name: string;
    UnitName?: string;
    PerformanceAVG?: string | number | null;
    RequestResult?: string;
  }>;
}
@Injectable({
  providedIn: 'root',
})

export class FilmManagementService {
  private url = `${environment.host}api/FilmManagement/`;
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
  saveMasterWithDetails(dto: SaveMasterWithDetailsDto): Observable<any> {
    return this.http.post<any>(`${this.url}master-with-details`, dto);
  }
  downloadTemplate(fileName: string): Observable<Blob> {
    const url = `${environment.host}api/share/software/Template/ImportExcel/${fileName}`;
    return this.http.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        return response.body as Blob;
      })
    );
  }
}
