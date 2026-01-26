import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface SaveKPIEvaluationRequest {
  model: {
    ID: number;
    EvaluationCode: string;
    Note: string;
    DepartmentID: number;
    IsDeleted: boolean;
  };
  departmentId: number;
  listErrorIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class KpiEvaluationService {
  private _url = environment.host + 'api/KPIEvaluation/';

  constructor(private http: HttpClient) { }

  getKPIEvaluation(departmentID: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-kpievaluation', {
      params: {
        departmentID: departmentID.toString()
      }
    });
  }

  delete(id: number): Observable<any> {
    return this.http.post<any>(this._url + 'delete', null, {
      params: {
        id: id.toString()
      }
    });
  }

  getError(evaluationId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-error', {
      params: {
        evaluationId: evaluationId.toString()
      }
    });
  }

  saveData(dto: SaveKPIEvaluationRequest): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', dto);
  }
}
