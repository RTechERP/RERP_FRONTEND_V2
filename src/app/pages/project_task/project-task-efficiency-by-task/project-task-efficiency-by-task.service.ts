import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface EfficiencyByTaskParams {
    dateStart: string;
    dateEnd: string;
    departmentID: number;
    teamID: number;
    employeeID: number;
    projectID: number;
    status: string;
}

export interface EfficiencyByTaskItem {
    EmployeeID: number;
    EmployeeFullName: string;
    EmployeeCode: string;
    DepartmentID: number;
    ProjectID: number;
    ProjectTaskID: number;
    ProjectTaskCode: string;
    ProjectTaskTitle: string;
    ProjectTaskParentID: number | null;
    EstimateHours: number | null;
    ProjectTaskPriority: number | null;
    TaskComplexity: number | null;
    DifficultyFactor: number | null;
    ProjectTaskWeight: number | null;
    TypeProjectItem: number;
    Status: number;
    StartDate: string | null;
    PlanEndDate: string | null;
    PlanStartDate: string | null;
    IsPersonalProject: boolean;
    FinishDate: string | null;
    Deadline: string | null;
    ProjectCode: string | null;
    ProjectName: string | null;
    ProjectStatusName: string | null;
    DurationDays: number | null;
    ActualHours: number | null;
    OTHours: number | null;
    StandardHours: number | null;
    DeadlineMet: number | null;
    Efficiency: number;
    AdjustedEfficiency: number;
    OTRatio: number | null;
    OTScore: number | null;
    TaskWeightedScore: number;
    DelayDays: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskEfficiencyByTaskService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getEfficiencyByTask(params: EfficiencyByTaskParams): Observable<EfficiencyByTaskItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd)
            .set('departmentID', params.departmentID.toString())
            .set('teamID', params.teamID.toString())
            .set('employeeID', params.employeeID.toString())
            .set('projectID', params.projectID.toString())
            .set('status', params.status);

        return this.http.post<IAPIResponse<EfficiencyByTaskItem[]>>(
            `${this.apiUrl}/efficiency-task`, null, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
