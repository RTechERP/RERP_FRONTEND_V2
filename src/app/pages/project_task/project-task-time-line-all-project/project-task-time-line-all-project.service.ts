import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface ProjectTaskTimelineByProjectItem {
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
    SumTotalHour: number;
    DurationDays: number;
    TypeDate: number; // 1: Dự kiến, 2: Thực tế
    PlanStartDate: string | null;
    PlanEndDate: string | null;
    [key: string]: any; // Dynamic date keys (e.g. "2026-04-03": 0 | 1)
}

export interface TimelineByProjectParams {
    dateStart: string;
    dateEnd: string;
    departmentID?: number;
    teamID?: number;
    projectID?: number;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskTimeLineAllProjectService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getProjectTaskTimeLineByProject(params: TimelineByProjectParams): Observable<ProjectTaskTimelineByProjectItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.departmentID !== undefined) {
            httpParams = httpParams.set('departmentID', params.departmentID.toString());
        }
        if (params.teamID !== undefined) {
            httpParams = httpParams.set('teamID', params.teamID.toString());
        }
        if (params.projectID !== undefined) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.status !== undefined && params.status !== '') {
            httpParams = httpParams.set('status', params.status);
        }

        return this.http.get<IAPIResponse<ProjectTaskTimelineByProjectItem[]>>(
            `${this.apiUrl}/project-task-timeline-by-project`, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
