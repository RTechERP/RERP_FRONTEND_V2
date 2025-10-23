import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class IssueSolutionService {
  private _url = HOST + 'api/IssueLogSolution/';
  constructor(private http: HttpClient) { }

  getAllIssueSolution(
    keyword: string
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        keyword: keyword,
      },
    });
  }
  getAllDepartment() {
    return this.http.get<any>(HOST + 'api/Department/' + 'get-all');
  }
  getAllCustomers() {
    return this.http.get<any>(this._url + 'get-all-customers');
  }
  getSupplierSale() {
    return this.http.get<any>(HOST + 'api/SupplierSale/' + 'get-all');
  }
  getAllProjects() {
    return this.http.get<any>(this._url + 'get-projects');
  }
  getEmployees() {
    return this.http.get<any>(HOST + 'api/Employee/' + 'get-all');
  }
  getCauses() {
    return this.http.get<any>(this._url + 'get-causes');
  }
  getStatuses() {
    return this.http.get<any>(this._url + 'get-statuses');
  }
  getDocuments() {
    return this.http.get<any>(this._url + 'get-documents');
  }

  saveData(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'save', payload);
  }

  getIssueSolutionDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-detail', {
      params: {
        id: id,
      },
    }
    );
  }
}
