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

  getTeamSaleByEmployee(employeeId: number): Observable<any> {
    return this.http.get(this._url + 'get-teamsale-by-employee', {
      params: {
        employeeId: employeeId.toString(),
      },
    });
  }

  getGroupSale(userId: number): Observable<any> {
    return this.http.get(this._url + 'get-group-sale', {
      params: {
        userId: userId.toString(),
      },
    });
  }

  loadGroupSales(userId: number): Observable<any> {
    return this.http.get(this._url + 'load-group-sales', {
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

  getCustomerContacts(customerId: number): Observable<any> {
    return this.http.get(this._url + 'get-customercontact', {
      params: {
        customerId: customerId.toString(),
      },
    });
  }

  getCustomerParts(customerId: number): Observable<any> {
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
    // Format date theo local time để tránh lệch timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    return this.http.get(this._url + 'get-data', {
      params: {
        page: page.toString(),
        size: size.toString(),
        dateStart: formatLocalDate(dateStart),
        dateEnd: formatLocalDate(dateEnd),
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

  saveProjectStatus(stt: number, statusName: string): Observable<any> {
    const projectStatus = {
      STT: stt,
      StatusName: statusName
    };
    return this.http.post(this._url + 'save-project-status', projectStatus);
  }

  importExcel(data: any[]): Observable<any> {
    return this.http.post(this._url + 'import-excel', data);
  }
}
