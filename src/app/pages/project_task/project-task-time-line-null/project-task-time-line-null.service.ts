import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';

export interface NullTimelineItem {
    ID: number;           // EmployeeID
    FullName: string;
    DepartmentID: number;
    Code: string;
    ProjectID: number;
    ProjectCode: string;
    ProjectName: string;
    ProjectStatusName: string;
    PlanEndDate: string | null;
    PlanStartDate: string | null;
    ProjectTaskID: number;
    ProjectTaskCode: string;
    TypeProjectItem: number;
    ProjectTypeName: string;
    ProjectTaskTitle: string;
    ProjectTaskParentID: number | null;
    ProjectTaskParentCode: string | null;
    ProjectTaskParentTitle: string | null;
    Status: number;
    SumTotalHour: number | null;
    DurationDays: number | null;
    TypeDate: number;   // 1: Dự kiến (string "XYZ"), 2: Thực tế (string float)
    [key: string]: any; // Dynamic date keys
}

export interface NullTimelineParams {
    dateStart: string;
    dateEnd: string;
    departmentID?: string; // "1,2,3"
}

@Injectable({ providedIn: 'root' })
export class ProjectTaskTimeLineNullService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getDayOff(dateStart: string, dateEnd: string): Observable<string[]> {
        const params = new HttpParams()
            .set('dateStart', dateStart)
            .set('dateEnd', dateEnd);
        return this.http.post<IAPIResponse<{ DateOff: string }[]>>(
            `${this.apiUrl}/day-off`, null, { params }
        ).pipe(
            map(res => (res.data || []).map(d => d.DateOff.slice(0, 10)))
        );
    }

    getNullTimeline(params: NullTimelineParams): Observable<NullTimelineItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.departmentID && params.departmentID !== '') {
            httpParams = httpParams.set('departmentID', params.departmentID);
        }

        return this.http.get<IAPIResponse<NullTimelineItem[]>>(
            `${this.apiUrl}/project-task-timeline-null-task`, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
