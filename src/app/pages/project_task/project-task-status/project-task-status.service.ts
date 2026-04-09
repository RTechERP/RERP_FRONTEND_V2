import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProjectTaskViewStatusItem {
    ID: number;
    FullName: string | null;
    ProjectID: number | null;
    ProjectCode: string | null;
    ProjectName: string | null;
    NotStarted: number;
    Doing: number;
    DoingOverdue: number;
    Done: number;
    DoneLate: number;
    Pending: number;
    TotalTasks: number;
}

export interface ProjectTaskChartItem {
    ID: number;
    FullName: string;
    NotStarted: number;
    Doing: number;
    DoingOverdue: number;
    Done: number;
    DoneLate: number;
    Pending: number;
    TotalTasks: number;
}

export interface ProjectTaskViewStatusParams {
    dateStart: string;
    dateEnd: string;
    departmentID?: number;
    teamID?: number;
    userID?: number;
    projectID?: number;
    keyword?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskStatusService {
    private apiUrl = `${environment.host}api/projecttask/project-task-view-status`;

    constructor(private http: HttpClient) { }

    getList(params: ProjectTaskViewStatusParams): Observable<any> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.departmentID !== undefined) {
            httpParams = httpParams.set('departmentID', params.departmentID.toString());
        }
        if (params.teamID !== undefined) {
            httpParams = httpParams.set('teamID', params.teamID.toString());
        }
        if (params.userID !== undefined) {
            httpParams = httpParams.set('userID', params.userID.toString());
        }
        if (params.projectID !== undefined) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.keyword) {
            httpParams = httpParams.set('keyword', params.keyword);
        }

        return this.http.get<any>(this.apiUrl, { params: httpParams });
    }

    getChartData(params: ProjectTaskViewStatusParams): Observable<any> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.departmentID !== undefined) {
            httpParams = httpParams.set('departmentID', params.departmentID.toString());
        }
        if (params.teamID !== undefined) {
            httpParams = httpParams.set('teamID', params.teamID.toString());
        }
        if (params.userID !== undefined) {
            httpParams = httpParams.set('userID', params.userID.toString());
        }
        if (params.projectID !== undefined) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.keyword) {
            httpParams = httpParams.set('keyword', params.keyword);
        }

        return this.http.get<any>(`${environment.host}api/projecttask/project-task-view-status-chart`, { params: httpParams });
    }
}
