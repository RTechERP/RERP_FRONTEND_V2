import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamEmployeeProjectService {
  private apiUrl = environment.host + 'api/TeamEmployeeProject/';

  constructor(private http: HttpClient) {}

  /**
   * Get employees in team (still working: EndWorking IS NULL).
   * Filtered optionally by UserTeam and/or Department.
   */
  getEmployeesInTeam(userTeamIds?: number | number[], departmentId?: number): Observable<any> {
    let params = new HttpParams();
    if (userTeamIds != null) {
      if (Array.isArray(userTeamIds)) {
        if (userTeamIds.length > 0) {
          params = params.set('userTeamIDs', userTeamIds.join(','));
        }
      } else if (userTeamIds > 0) {
        params = params.set('userTeamIDs', userTeamIds.toString());
      }
    }
    if (departmentId != null && departmentId > 0) {
      params = params.set('departmentid', departmentId.toString());
    }
    return this.http.get<any>(this.apiUrl + 'get-employees', { params });
  }

  /**
   * Get distinct projects for the given employee IDs within an optional date range.
   * A project is counted when the employee has a DailyReportTechnical for it.
   */
  getProjectsByEmployees(body: {
    employeeIds: number[];
    dateFrom?: string | null;
    dateTo?: string | null;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-projects-by-employees', body);
  }


}
