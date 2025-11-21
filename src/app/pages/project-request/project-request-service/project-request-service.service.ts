import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectRequestServiceService {
  private _url = environment.host + 'api/';
  private _urlProjectSolution = this._url + 'projectsolution/';

  constructor(private http: HttpClient) { }

  // Get project request với projectID và keyword
  getProjectRequest2(projectID: number, keyword: string): Observable<any> {
    let params = new HttpParams()
      .set('projectID', projectID.toString())
      .set('keyword', keyword || '');
    
    return this.http.get<any>(this._urlProjectSolution + 'get-project-request2', { params });
  }

  // Get project solution với projectID và projectRequestID
  getProjectSolution(projectID: number, projectRequestID: number): Observable<any> {
    let params = new HttpParams()
      .set('projectID', projectID.toString())
      .set('projectRequestID', projectRequestID.toString());
    
    return this.http.get<any>(this._urlProjectSolution + 'get-project-solution', { params });
  }

  // Get request file với projectRequestID
  getRequestFile(projectRequestID: number): Observable<any> {
    let params = new HttpParams()
      .set('projectRequestID', projectRequestID.toString());
    
    return this.http.get<any>(this._urlProjectSolution + 'get-request-file', { params });
  }

  // Get solution file với projectSolutionID
  getSolutionFile(projectSolutionID: number): Observable<any> {
    let params = new HttpParams()
      .set('projectSolutionID', projectSolutionID.toString());
    
    return this.http.get<any>(this._urlProjectSolution + 'get-solution-file', { params });
  }

  // Save project request
  saveRequest(payload: any): Observable<any> {
    return this.http.post<any>(this._urlProjectSolution + 'save-request', payload);
  }
}
