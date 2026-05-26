import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface EfficiencyByTaskProjectParams {
    dateStart: string;
    dateEnd: string;
    departmentID: number;
    teamID: number;
    employeeID: number;
    projectID: number;
    status: string;
}

export interface EfficiencyByProjectItem {
    EmployeeID: number;
    ProjectID: number;
    EmployeeFullName: string;
    ProjectCode: string;
    ProjectName: string;
    ProjectStatusName: string;
    TaskCount: number;
    DoneTasks: number;
    TotalEstimate: number;
    TotalActual: number;
    TotalOT: number;
    Efficiency: number;
    AdjustedEfficiency: number;
    DeadlineRate: number;
    OTRatio: number;
    AverageEfficiency: number;
    StdDevEfficiency: number;
    StabilityCV: number;
    StabilityScore: number;
    OTScore: number;
    FinalKPIScore: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskEfficiencyByProjectService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getEfficiencyByProject(params: EfficiencyByTaskProjectParams): Observable<EfficiencyByProjectItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd)
            .set('departmentID', params.departmentID.toString())
            .set('teamID', params.teamID.toString())
            .set('employeeID', params.employeeID.toString())
            .set('projectID', params.projectID.toString())
            .set('status', params.status);

        return this.http.post<IAPIResponse<EfficiencyByProjectItem[]>>(
            `${this.apiUrl}/efficiency-task-project`, null, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
