import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MakertrainingService {
  private api = environment.host + 'api/';
  private url = `${environment.host}api/MakerTraining/`;
  constructor(private http: HttpClient) {}

  getMakerTraining(
    DepartmentID: number,
    MakerTrainingTypeID: number,
    FirmID: number,
    Keyword: string,
    DateStart: string,
    DateEnd: string,
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID || 0,
      MakerTrainingTypeID: MakerTrainingTypeID || 0,
      FirmID: FirmID || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
      DateEnd: DateEnd,
    };
    return this.http.post<any>(this.url + `get-maker-training`, asset);
  }

  getMakerTrainingData(ID: number): Observable<any> {
    const asset: any = { MakerTrainingID: ID || 0 };
    return this.http.post<any>(this.url + `get-maker-training-data`, asset);
  }

  getDataDepartment(): Observable<any> {
    return this.http.get<any>(this.url + `get-departments`);
  }

  getDataFirm(): Observable<any> {
    return this.http.get<any>(this.url + `get-firms`);
  }

  getDataTrainingType(): Observable<any> {
    return this.http.get<any>(this.url + `get-maker-training-type`);
  }

  getEmployee(Status: number): Observable<any> {
    const asset: any = { Status };
    return this.http.post<any>(this.url + `get-employee-maker-training`, asset);
  }

  getMakerTrainingDocumentByID(id: number) {
    return this.http.get<any>(this.url + `get-maker-training-document/${id}`);
  }
  getMakerTrainingID(id: number) {
    return this.http.get<any>(this.url + `get-maker-training/${id}`);
  }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(this.url + `save-data-maker-training`, data);
  }

  saveMakerTrainingType(data: any): Observable<any> {
    return this.http.post(this.url + `save-makertraining-type`, data);
  }

  getDocumentFileByID(id: number) {
    return this.http.get<any>(this.url + `get-maker-training-document/${id}`);
  }

  uploadFile(file: File, makerTrainingId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.url + `upload/${makerTrainingId}`, formData);
  }

  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'MakerTraining');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this.api + `home/upload-multiple`, formData);
  }

  deleteMakerTraining(ids: number[]): Observable<any> {
    return this.http.post(this.url + `delete`, ids);
  }
}
