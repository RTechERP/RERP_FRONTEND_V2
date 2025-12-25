import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentImportExportService {
  private _url = environment.host + 'api/DocumentImportExport/';
  constructor(private http: HttpClient) { }

  // API để lấy danh sách chứng từ nhập
  getDocumentImport(): Observable<any> {
    return this.http.get<any>(`${this._url}get-document-import`);
  }

  // API để lấy danh sách chứng từ xuất
  getDocumentExport(): Observable<any> {
    return this.http.get<any>(`${this._url}get-document-export`);
  }

  // API để lưu chứng từ nhập/xuất
  saveDocumentImportExport(documentType: number, code: string, name: string, id?: number): Observable<any> {
    let params = new HttpParams()
      .set('documentType', documentType.toString())
      .set('code', code)
      .set('name', name);
    
    if (id) {
      params = params.set('id', id.toString());
    }

    return this.http.post<any>(`${this._url}save-document-import-export`, null, { params });
  }
}
