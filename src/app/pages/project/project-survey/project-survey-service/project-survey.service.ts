import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectSurveyService {
  private apiUrl = environment.host + 'api/';
  private apiProjectSurvey = this.apiUrl + 'projectsurvey/';

  constructor(private http: HttpClient) {}

  getDataProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `get-project-survey`, {
      params: data,
    });
  }

  approvedUrgent(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `approved-urgent`, {
      params: data,
    });
  }

  approved(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `approved-request`, {
      params: data,
    });
  }

  getTbDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `get-tb-detail`, {
      params: data,
    });
  }

  getDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `get-detail`, {
      params: data,
    });
  }

  getFileDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `get-files`, {
      params: data,
    });
  }

  viewFile(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `see-file`, {
      params: data,
    });
  }

  checkStatusDetail(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `check-status-detail`, {
      params: data,
    });
  }

  deletedProjectSurvey(data: any): Observable<any> {
    return this.http.get<any>(
      this.apiProjectSurvey + `deleted-project-survey`,
      { params: data }
    );
  }

  openFolder(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `open-folder`, {
      params: data,
    });
  }

  getDetailByid(data: any): Observable<any> {
    return this.http.get<any>(this.apiProjectSurvey + `get-detail-byid`, {
      params: data,
    });
  }

  saveProjectSurvey(projectSurveyDTO: any): Observable<any> {
    return this.http.post<any>(
      this.apiProjectSurvey + `save-project-survey`,
      projectSurveyDTO
    );
  }

  saveProjectSurveyFiles(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiProjectSurvey + `save-project-survey-files`,
      data
    );
  }

  saveProjectSurveyResult(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiProjectSurvey + `save-project-survey-result`,
      data
    );
  }

  // Upload multiple files
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'Projects');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this.apiUrl + `home/upload-multiple`, formData);
  }
    // Mở thư mục khảo sát dự án
    openSurveyFolder(projectId: number): Observable<any> {
      return this.http.get<any>(this.apiProjectSurvey + `open-survey/${projectId}`);
    }

  // Download file
  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this.apiUrl}home/download`, {
      params,
      responseType: 'blob',
    });
  }
}


