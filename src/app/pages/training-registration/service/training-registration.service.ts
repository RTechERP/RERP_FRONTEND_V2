import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class TrainingRegistrationService {
  apiUrl: string = HOST + 'api';
  constructor(private http: HttpClient) {}
  getAll(param: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/trainingregistration`, param);
  }
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/TrainingRegistrationDetail?trainingRegistrationID=${id}`);
  }
   // Thêm phương thức upload file
    // Cập nhật phương thức upload file để sử dụng API generic từ HomeController
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', 'TrainingRegistration');
    return this.http.post<any>(`${this.apiUrl}/Home/upload`, formData);
  }

  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('key', 'TrainingRegistration');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(`${this.apiUrl}/Home/upload-multiple`, formData);
  }
  getEmployee():Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/Employee/get-employees`);
  }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/TrainingRegistration/save-data`, data);
  }
  getTrainingRegistrationFile(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/TrainingRegistrationFile/get-by-training-registration-id?trainingRegistrationID=${id}`);
  }
  getTrainingRegistrationApproved(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/TrainingRegistrationApproved/get-by-training-registration-id?trainingRegistrationID=${id}`);
  }
  getTrainingRegistrationCategory(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/TrainingRegistrationCategory`);
  }
  approveTrainingRegistration(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/TrainingRegistrationApproved/approve`, data);
  }
}
