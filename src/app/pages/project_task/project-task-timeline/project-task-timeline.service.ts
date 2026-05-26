import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface ProjectTaskTimelineItem {
    ID: number;
    ProjectID: number;
    ProjectName: string;
    ProjectCode: string;
    Status: number;
    TypeDate: number; // 1: Planned, 2: Actual
    ParentID?: number;
    ParentCode?: string;
    ParentTitle?: string;
    EmployeeIDRequest?: number;
    FullName?: string;
    TaskCode?: string;
    TaskTitle?: string;
    Code?: string;
    Mission?: string;
    IsApproved?: number | boolean | string | null;
    [key: string]: any; // Allow for dynamic date keys
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskTimelineService {
    private apiUrl = `${environment.host}api/ProjectTask`;

    constructor(private http: HttpClient) { }

    getProjectTaskTimeLine(dateStart: string, dateEnd: string, departmentId?: number, teamId?: number, employeeId?: number, keyword?: string, status?: string, typeSearch?: number): Observable<ProjectTaskTimelineItem[]> {
        let params = new HttpParams()
            .set('dateStart', dateStart)
            .set('dateEnd', dateEnd);

        if (departmentId) params = params.set('departmentId', departmentId);
        if (teamId) params = params.set('teamId', teamId);
        if (employeeId) params = params.set('employeeId', employeeId);
        if (keyword) params = params.set('keyword', keyword);
        if (status) params = params.set('status', status);
        if (typeSearch !== undefined) params = params.set('typeSearch', typeSearch.toString());

        return this.http.get<IAPIResponse<ProjectTaskTimelineItem[]>>(`${this.apiUrl}/project-task-timeline`, { params }).pipe(
            map(response => response.data || [])
        );
    }

    getProjectTaskGetDayOff(dateStart: string, dateEnd: string): Observable<string[]> {
        const httpParams = new HttpParams()
            .set('dateStart', dateStart)
            .set('dateEnd', dateEnd);

        return this.http.post<IAPIResponse<any[]>>(
            `${this.apiUrl}/day-off`, {}, { params: httpParams }
        ).pipe(
            map(response => {
                if (response && response.status === 1 && response.data) {
                    return response.data.map(item => item.DateOff.split('T')[0]);
                }
                return [];
            })
        );
    }

    getProjectTaskStatuses(): Observable<any[]> {
        return this.http.get<IAPIResponse<any>>(
            `${this.apiUrl}/project-task-status`
        ).pipe(
            map(response => response.data?.projectTaskStatuses || [])
        );
    }
}
