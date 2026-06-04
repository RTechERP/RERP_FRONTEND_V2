import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProjectTaskEfficiencyTotal {
  TaskCount: number;
  DoneTasks: number;
  TotalEstimate: number | null;
  TotalActual: number | null;
  Efficiency: number;
  DeadlineRate: number | null;
  OTRatio: number;
}

export interface ProjectTaskEfficiencyEmployee {
  EmployeeID: number;
  ProjectID: number;
  EmployeeFullName: string;
  ProjectCode: string;
  ProjectName: string;
  ProjectStatusName: string;
  TaskCount: number;
  DoneTasks: number;
  TotalEstimate: number | null;
  TotalActual: number | null;
  TotalOT: number | null;
  Efficiency: number;
  AdjustedEfficiency: number;
  DeadlineRate: number | null;
  OTRatio: number;
  AverageEfficiency: number | null;
  StdDevEfficiency: number;
  StabilityCV: number;
  StabilityScore: number;
  OTScore: number;
  FinalKPIScore: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectTaskEfficiencyDashboardService {
  constructor(private http: HttpClient) {}

  getProjectTotalEfficiency(dateStart: string, dateEnd: string, projectId: number, departmentId: number = 0): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('projectID', projectId.toString())
      .set('departmentID', departmentId.toString());
      
    return this.http.post<any>(`${environment.host}api/projecttask/efficiency-task-project-total?${params.toString()}`, {});
  }

  getEmployeeEfficiency(dateStart: string, dateEnd: string, projectId: number, departmentId: number = 0): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('departmentID', departmentId.toString())
      .set('teamID', '0')
      .set('employeeID', '0')
      .set('projectID', projectId.toString())
      .set('status', '-1');

    return this.http.post<any>(`${environment.host}api/projecttask/efficiency-task-project?${params.toString()}`, {});
  }
}
