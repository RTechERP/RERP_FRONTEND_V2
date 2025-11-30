import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProjectWorkerService {
  private _url = environment.host + 'api/';
  private _urlProjectWorker = this._url + 'projectworker/';
  private _urlProjectWorkerVersion = this._url + 'projectwokervesion/';
  private _urlProjectSolution = this._url + 'projectsolution/';
  constructor(private http: HttpClient) { }
  //load giải pháp
  getSolution(projectId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-solution/${projectId}`);
  }
  //load phiên bản giải pháp
  getSolutionVersion(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-solution-version/${projectSolutionId}`);
  }
  //load phiên bản PO
  getPOVersion(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-version-po/${projectSolutionId}`);
  }

  //load loại dự án 
  getProjectType(): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + 'get-project-type');
  }
  //save phiên bản giải pháp, phiên bản PO
  saveSolutionVersion(data: any): Observable<any> {
    return this.http.post<any>(this._urlProjectWorkerVersion + 'save-worker-version', data);
  }
  //get cbb project type
  getProjectSolutionCbb(projectId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorkerVersion + 'get-project-solution-cbb/' + projectId);
  }
  //get cbb project
  getProject(projectId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + 'get-project/' + projectId);
  }
  // modal chi tiết giải pháp
  //get all project
  getAllProject(): Observable<any> {
    return this.http.get<any>(this._urlProjectSolution + 'get-all-project');
  }
  // get all project request
  getProjectRequest(projectId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectSolution + 'get-all-project-request?projectID=' + projectId);
  }
  // save project solution
  saveSolution(data: any): Observable<any> {
    return this.http.post<any>(this._urlProjectSolution + 'save-data-solution', data);
  }
  //get file giair phap 
  getSolutionFile(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + 'get-project-solution-file?projectSolutionID=' + projectSolutionId);
  }
  //hàm get nhân công dự án 
  getProjectWorker(data: any): Observable<any> {
    return this.http.post<any>(this._urlProjectWorker + 'get-project-worker' , data);
  }
  //hàm save nhân công dự án (thêm/sửa) - theo API backend
  saveWorker(data: any): Observable<any> {
    return this.http.post<any>(this._urlProjectWorker + 'save-project-worker', data);
  }
  //hàm get worker by ID
  getWorkerById(id: number): Observable<any> {
    return this.http.get<any>(this._urlProjectWorker + `get-worker-by-id/${id}`);
  }
  //ham upload file
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'TrainingRegistration'); //192.168.1.190/duan/projects
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url +`home/upload-multiple`, formData);
  }
  //LƯU MẪU EXCEL
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
  // Duyệt/hủy duyệt phiên bản giải pháp hoặc PO
  approvedActive(projectWorkerVersionID: number, isActive: boolean): Observable<any> {
    const requestBody = {
      ProjectWorkerVersionID: projectWorkerVersionID,
      IsActive: isActive
    };
    return this.http.post<any>(this._url + `projectworkerversion/approved-active`, requestBody);
  }
}
