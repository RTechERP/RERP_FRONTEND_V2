import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImportExcelProjectTaskService {
  private apiUrl = `${environment.host}api/ProjectTask`;

  constructor(private http: HttpClient) { }

  /**
   * Tải template mẫu Excel
   */
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

  /**
   * Import hàng loạt công việc (placeholder - sẽ bổ sung khi có API backend)
   */
  importTasks(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import_excel`, payload);
  }
}