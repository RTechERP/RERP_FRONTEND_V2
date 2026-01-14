import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectHistoryProblemService {
  private _url = environment.host + 'api/';
  private _urlProjectHistoryProblem = this._url + 'ProjectHistoryProblem/';

  constructor(private http: HttpClient) { }

  // Get data history problem với projectID
  getDataHistoryProblem(projectID: number): Observable<any> {
    const params = new HttpParams()
      .set('projectID', projectID.toString());
    
    return this.http.post<any>(this._urlProjectHistoryProblem + 'get-data', null, { params });
  }

  // Get data detail với id (ProjectHistoryProblemID)
  getDataHistoryProblemDetail(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id.toString());
    
    return this.http.post<any>(this._urlProjectHistoryProblem + 'get-data-detail', null, { params });
  }

  // Save data
  saveData(payload: any): Observable<any> {
    return this.http.post<any>(this._urlProjectHistoryProblem + 'save-data-problem', payload);
  }

  // Download file
  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this._url}home/download`, {
      params,
      responseType: 'blob',
    });
  }

  // Get project history problem by project and date
  getProjectHistoryProblemByProject(projectID: number, dateProblem: Date): Observable<any> {
    // Format date thành yyyy-MM-dd để so sánh đúng (chỉ so sánh ngày, không so sánh giờ phút giây)
    const dateStr = DateTime.fromJSDate(dateProblem).toFormat('yyyy-MM-dd');
    const params = new HttpParams()
      .set('projectID', projectID.toString())
      .set('dateProblem', dateStr);
    
    return this.http.get<any>(this._urlProjectHistoryProblem + 'add-problem', { params });
  }
}

