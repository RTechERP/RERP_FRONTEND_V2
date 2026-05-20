import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PollApiResponse<T> {
  success?: boolean;
  status?: number;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class PollFormService {
  private readonly apiUrl = `${environment.host}api/pollform`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PollApiResponse<any[]>> {
    return this.http.get<PollApiResponse<any[]>>(`${this.apiUrl}/all`);
  }

  getDetail(id: number): Observable<PollApiResponse<any>> {
    return this.http.get<PollApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  createPollForm(data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/create`, data);
  }

  updatePollForm(data: any): Observable<PollApiResponse<any>> {
    return this.http.put<PollApiResponse<any>>(`${this.apiUrl}/update`, data);
  }

  uploadBackgroundImage(file: File): Observable<PollApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/background/upload`, formData);
  }

  deletePollForm(id: number): Observable<PollApiResponse<any>> {
    return this.http.delete<PollApiResponse<any>>(`${this.apiUrl}/delete/${id}`);
  }

  createSection(pollFormId: number, data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/${pollFormId}/section`, data);
  }

  updateSection(id: number, data: any): Observable<PollApiResponse<any>> {
    return this.http.put<PollApiResponse<any>>(`${this.apiUrl}/section/${id}`, data);
  }

  deleteSection(id: number): Observable<PollApiResponse<any>> {
    return this.http.delete<PollApiResponse<any>>(`${this.apiUrl}/section/${id}`);
  }

  getEmployeeFieldOptions(): Observable<PollApiResponse<any[]>> {
    return this.http.get<PollApiResponse<any[]>>(`${this.apiUrl}/employee-field-options`);
  }

  getEmployeeFields(): Observable<PollApiResponse<any[]>> {
    return this.http.get<PollApiResponse<any[]>>(`${this.apiUrl}/employee-fields`);
  }

  addQuestion(data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/question/add`, data);
  }

  updateQuestion(data: any): Observable<PollApiResponse<any>> {
    return this.http.put<PollApiResponse<any>>(`${this.apiUrl}/question/update`, data);
  }

  deleteQuestion(id: number): Observable<PollApiResponse<any>> {
    return this.http.delete<PollApiResponse<any>>(`${this.apiUrl}/question/delete/${id}`);
  }

  addOption(data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/option/add`, data);
  }

  updateOption(data: any): Observable<PollApiResponse<any>> {
    return this.http.put<PollApiResponse<any>>(`${this.apiUrl}/option/update`, data);
  }

  deleteOption(id: number): Observable<PollApiResponse<any>> {
    return this.http.delete<PollApiResponse<any>>(`${this.apiUrl}/option/delete/${id}`);
  }

  submitResponse(data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/submit`, data);
  }

  submitSection(pollFormId: number, data: any): Observable<PollApiResponse<any>> {
    return this.http.post<PollApiResponse<any>>(`${this.apiUrl}/${pollFormId}/submit-section`, data);
  }

  getMyResponse(pollFormId: number): Observable<PollApiResponse<any>> {
    return this.http.get<PollApiResponse<any>>(`${this.apiUrl}/${pollFormId}/my-response`);
  }

  getResponses(pollFormId: number): Observable<PollApiResponse<any[]>> {
    return this.http.get<PollApiResponse<any[]>>(`${this.apiUrl}/${pollFormId}/responses`);
  }

  exportResponsesExcel(pollFormId: number, includeIncomplete = false): Observable<Blob> {
    const params = new HttpParams().set('includeIncomplete', includeIncomplete ? 'true' : 'false');
    return this.http.get(`${this.apiUrl}/${pollFormId}/responses/export-excel`, {
      params,
      responseType: 'blob',
    });
  }

  getResponseDetail(id: number): Observable<PollApiResponse<any>> {
    return this.http.get<PollApiResponse<any>>(`${this.apiUrl}/response/${id}`);
  }

  getStatistics(pollFormId: number): Observable<PollApiResponse<any>> {
    return this.http.get<PollApiResponse<any>>(`${this.apiUrl}/${pollFormId}/statistics`);
  }
}
