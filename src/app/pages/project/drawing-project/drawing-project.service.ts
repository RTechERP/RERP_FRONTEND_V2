import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DrawingProjectService {
  private apiUrl = environment.host + 'api/Drawing';

  constructor(private http: HttpClient) { }

  getData(projectID: number = 0, keyword: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-data?projectID=${projectID}&keyword=${keyword}`);
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-employees`);
  }

  getProjectType(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-project-type`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-by-id?id=${id}`);
  }

  saveData(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data`, request);
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete?id=${id}`, {});
  }

  uploadPdf(drawingID: number, file: File, subPath: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('key', 'TuanBeoTest');
    formData.append('subPath', subPath);
    formData.append('files', file, file.name);

    return this.http.post<any>(`${this.apiUrl}/upload-pdf?drawingID=${drawingID}`, formData);
  }

  check(id: number, employeeID: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check?id=${id}&employeeID=${employeeID}`, {});
  }

  approve(id: number, employeeID: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approve?id=${id}&employeeID=${employeeID}`, {});
  }

  downloadFileByPath(filePath: string): Observable<Blob> {
    return this.http.get(`${environment.host}api/home/download?path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
    });
  }

  getSignatures(drawingID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-signatures?drawingID=${drawingID}`);
  }

  getSignedPdfBlob(drawingID: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/view-signed-pdf?drawingID=${drawingID}`, {
      responseType: 'blob'
    });
  }
}
