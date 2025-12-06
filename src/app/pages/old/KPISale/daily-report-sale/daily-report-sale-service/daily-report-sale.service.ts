import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportSaleService {
  private _url = environment.host + 'api/DailyReportSale/';
  
  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any> {
    return this.http.get(environment.host + 'api/Employee/employees', {
      params: {
        status: 0,
      },
    });
  }

  getProjects(): Observable<any> {
    return this.http.get(this._url + 'get-projects');
  }

  getEmployeeTeamSale(): Observable<any> {
    return this.http.get(this._url + 'get-employee-team-sale');
  }

  getGroupSale(userId: number): Observable<any> {
    return this.http.get(this._url + 'get-group-sale', {
      params: {
        userId: userId.toString(),
      },
    });
  }

  getCustomers(): Observable<any> {
    return this.http.get(this._url + 'get-customers');
  }

  getFirmBase(): Observable<any> {
    return this.http.get(this._url + 'get-firmbase');
  }

  getProjectTypeBase(): Observable<any> {
    return this.http.get(this._url + 'get-projecttypebase');
  }

  getProjectStatuses(): Observable<any> {
    return this.http.get(this._url + 'get-projectstatus');
  }

  getCustomerContacts(customerId : number): Observable<any> {
    return this.http.get(this._url + 'get-customercontact', {
      params: {
        customerId: customerId.toString(),
      },
    });
  } 

  getCustomerParts(customerId : number): Observable<any> {
    return this.http.get(this._url + 'get-customerpart', {
      params: {
        customerId: customerId.toString(),
      },
    });
  }

  getMainIndexes(): Observable<any> {
    return this.http.get(this._url + 'get-mainindex');
  }

  getDailyReportSale(
    page: number,
    size: number,
    dateStart: Date,
    dateEnd: Date,
    filterText: string = '',
    customerId: number,
    userId: number,
    groupType: number,
    projectId: number,
    employeeTeamSaleId: number
  ): Observable<any> {

    return this.http.get(this._url + 'get-data', {
      params: {
        page: page.toString(),
        size: size.toString(),
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        filterText: filterText || '',
        customerId: customerId.toString(),
        userId: userId.toString(),
        groupType: groupType.toString(),
        projectId: projectId.toString(),
        employeeTeamSaleId: employeeTeamSaleId.toString(),
      },
    });
  }

  save(dto: any): Observable<any> {
    return this.http.post(this._url + 'save-data', dto);
  }

  getLatestDailyReportSale(userId: number, projectId: number): Observable<any> {
    return this.http.get(this._url + 'get-latest-daily-report-sale', {
      params: {
        userId: userId.toString(),
        projectId: projectId.toString(),
      },
    });
  }

  getLatestFollowProjectBase(projectId: number): Observable<any> {
    return this.http.get(this._url + 'get-latest-follow-project-base', {
      params: {
        projectId: projectId.toString(),
      },
    });
  }

  getById(id: number): Observable<any> {
    return this.http.get(this._url + 'get-by-id', {
      params: {
        id: id.toString(),
      },
    });
  }

  delete(id: number): Observable<any> {
    return this.http.post(this._url + 'delete', null, {
      params: {
        id: id.toString()
      }
    });
  }

  importExcel(data: any[]): Observable<any> {
    return this.http.post(this._url + 'import-excel', data);
  }
}
