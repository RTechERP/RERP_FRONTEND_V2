import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
// import { HOST } from '../../../../app.config';
import { environment } from '../../../../../environments/environment';

import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  constructor(private http: HttpClient) { }
  apiUrl: string = environment.host + 'api';
  private urlEmployee = `${environment.host}api/employee/`;

  getNextStt(documentTypeID: number, departmentID: number): Observable<any> {
    const url =
      environment.host +
      `api/document/get-next-stt?documentTypeID=${documentTypeID}&departmentID=${departmentID}`;
    return this.http.get<any>(url);
  }

  getDataDocumentType(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/document/get-document-type`
    );
  }

  getAllDocument(
    departmentID: number,
    IdDocumentType: number
  ): Observable<any> {
    const asset: any = {
      DepartmentID: departmentID || 0,
      IDDocumentType: IdDocumentType || 0,
    };
    return this.http.post<any>(
      environment.host + `api/document/get-document`,
      asset
    );
  }
  getDocumentFileByID(id: number) {
    return this.http.get<any>(
      environment.host + `api/document/get-document-file/${id}`
    );
  }
  getDataDepartment(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/document/get-departments`
    );
  }

  saveDocumentType(data: any): Observable<any> {
    return this.http.post(
      environment.host + `api/document/save-document-type`,
      data
    );
  }
  saveDocument(data: any): Observable<any> {
    return this.http.post(
      environment.host + `api/document/save-document`,
      data
    );
  }

  saveDocumentFile(data: any): Observable<any> {
    return this.http.post(
      environment.host + `api/document/save-document-file`,
      data
    );
  }

  getDocumentFile(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/document/get-document-file`
    );
  }

  uploadMultipleFiles(
    files: File[],
    typeID?: number,
    subPath?: string
  ): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Set key based on typeID: 57=Certificate, 58=Critical, default=TrainingRegistration
    let key = 'TrainingRegistration';
    if (typeID === 57) {
      key = 'Certificate';
    } else if (typeID === 58) {
      key = 'Critical';
    }
    formData.append('key', key);

    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(`${this.apiUrl}/home/upload-multiple`, formData);
  }

  downloadFile(filePath: string, typeID?: number): Observable<Blob> {
    // Set key based on typeID: 57=Certificate, 58=Critical, default=TrainingRegistration
    let key = 'TrainingRegistration';
    if (typeID === 57) {
      key = 'Certificate';
    } else if (typeID === 58) {
      key = 'Critical';
    }

    // Encode path to handle Unicode characters properly
    const encodedPath = encodeURIComponent(filePath);
    const params = new HttpParams().set('path', encodedPath).set('key', key);
    return this.http.get(`${this.apiUrl}/home/download`, {
      params,
      responseType: 'blob',
    });
  }

  downloadFileSale(
    fileName: string,
    documentName?: string,
    typeID?: number
  ): Observable<Blob> {
    // Set key based on typeID: 57=Certificate, 58=Critical, default=EconomicContract
    let key = 'TrainingRegistration';
    if (typeID === 57) {
      key = 'Certificate';
    } else if (typeID === 58) {
      key = 'Critical';
    }

    // Build subPath: Documents/documentName (if provided)
    const subPath = documentName ? `Documents/${documentName}` : 'Documents';

    const params = new HttpParams()
      .set('key', key)
      .set('subPath', subPath)
      .set('fileName', fileName);

    return this.http.get(`${this.apiUrl}/home/download-by-key`, {
      params,
      responseType: 'blob',
    });
  }
  exportExcel(id: number) {
    return this.http.get(environment.host + `api/document/export-excel/${id}`, {
      responseType: 'blob',
    });
  }
  getEmployee(request: any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`, request);
  }

  getDocumentCommon(
    keyword: string,
    departID: number,
    groupType: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('keyword', keyword || '')
      .set('departID', departID.toString())
      .set('groupType', groupType.toString());
    return this.http.get<any>(
      environment.host + `api/document/get-document-common`,
      { params }
    );
  }

  getDocumentAdminSale(departID: number): Observable<any> {
    const params = new HttpParams().set('departID', departID.toString());
    return this.http.get<any>(
      environment.host + `api/document/get-document-admin-sale`,
      { params }
    );
  }
}
