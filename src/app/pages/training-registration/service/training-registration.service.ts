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
    return this.http.get<any>(
      `${this.apiUrl}/TrainingRegistrationDetail?trainingRegistrationID=${id}`
    );
  }
  // Thêm phương thức upload file
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(
      `${this.apiUrl}/TrainingRegistration/upload`,
      formData
    );
  }
  getEmployee(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Employee/employees`);
  }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/TrainingRegistration/save-data`,
      data
    );
  }
  getTrainingRegistrationFile(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/TrainingRegistrationFile/get-by-training-registration-id?trainingRegistrationID=${id}`
    );
  }
  getTrainingRegistrationApproved(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/TrainingRegistrationApproved/get-by-training-registration-id?trainingRegistrationID=${id}`
    );
  }
  getTrainingRegistrationCategory(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/TrainingRegistrationCategory`);
  }
  approveTrainingRegistration(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/TrainingRegistrationApproved/approve`,
      data
    );
  }
}
