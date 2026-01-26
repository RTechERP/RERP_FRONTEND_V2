import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface DeleteEmployeeRequest {
  DepartmentID?: number;
  KPIPositionEmployeeID?: number;
}

@Injectable({
  providedIn: 'root'
})
export class KpiPositionEmployeeService {
  private _url = environment.host + 'api/KPIPositionEmployee/';

  constructor(private http: HttpClient) { }

  getDepartment(): Observable<any> {
    return this.http.get<any>(this._url + 'get-department');
  }

  getKPISession(departmentId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-kpi-session', {
      params: {
        departmentId: departmentId.toString()
      }
    });
  }

  getData(kpiSessionId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-data', {
      params: {
        kpiSessionId: kpiSessionId.toString()
      }
    });
  }

  getDetail(positionId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-detail', {
      params: {
        positionId: positionId.toString()
      }
    });
  }

  getPositionType(kpiSessionID: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-position-type', {
      params: {
        kpiSessionID: kpiSessionID.toString()
      }
    });
  }

  deletePosition(positionID: number): Observable<any> {
    return this.http.post<any>(this._url + 'delete-position', null, {
      params: {
        positionID: positionID.toString()
      }
    });
  }

  deleteEmployee(dto: DeleteEmployeeRequest[]): Observable<any> {
    return this.http.post<any>(this._url + 'delete-employee', dto);
  }

  savePosition(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data-position', model);
  }

  getPositionEmployeeDetail(departmentId: number, kpiSessionId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-position-employee-detail', {
      params: {
        departmentId: departmentId.toString(),
        kpiSessionId: kpiSessionId.toString()
      }
    });
  }

  // Save position employees - delete and insert in one call
  savePositionEmployee(listDel: number[], listInsert: number[], kpiPositionId: number): Observable<any> {
    return this.http.post<any>(this._url + 'save-position-employee', {
      listDel: listDel,
      listInsert: listInsert,
      KPIPositionID: kpiPositionId
    });
  }

  // KPIPositionTypeDetail
  getProjectTypes(departmentId: number, kpiSessionId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-project-types', {
      params: {
        departmentId: departmentId.toString(),
        kpiSessionId: kpiSessionId.toString()
      }
    });
  }

  saveKPIPositionType(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-kpi-position-type', model);
  }

  // Copy position employee từ kỳ đánh giá này sang kỳ khác
  copyPositionEmployee(kpiSessionFrom: number, kpiSessionTo: number): Observable<any> {
    return this.http.post<any>(this._url + 'copy-position-employee', null, {
      params: {
        kpiSessionFrom: kpiSessionFrom.toString(),
        kpiSessionTo: kpiSessionTo.toString()
      }
    });
  }
}

