import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface TimelineByTeamItem {
    ID: number; // EmployeeID
    FullName: string;
    DepartmentID: number;
    Code: string; // Employee Code
    ProjectID: number;
    ProjectCode: string;
    ProjectName: string;
    ProjectTaskID: number;
    ProjectTaskCode: string;
    ProjectTaskTitle: string;
    ProjectTaskParentID: number | null;
    ProjectTaskParentCode: string | null;
    ProjectTaskParentTitle: string | null;
    Status: number;
    TypeDate: number; // 1: Dự kiến, 2: Thực tế
    [key: string]: any; // Dynamic date keys (e.g. "2026-04-03": 1)
}

export interface TimelineByTeamParams {
    dateStart: string;
    dateEnd: string;
    departmentID?: number;
    teamID?: number;
    userID?: number;
    projectID?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskTimeLineTotalService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getTimelineByTeam(params: TimelineByTeamParams): Observable<TimelineByTeamItem[]> {
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

        return this.http.get<IAPIResponse<TimelineByTeamItem[]>>(
            `${this.apiUrl}/project-task-timeline-by-team`, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
