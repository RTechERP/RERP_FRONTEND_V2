import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../models/kanban.interface';
import { TimelineByTeamItem } from '../project-task-time-line-total/project-task-time-line-total.service';

export interface TimelineByProjectParams {
    dateStart: string;
    dateEnd: string;
    projectID?: number;
    status?: string; // "0,1" format
}

@Injectable({
    providedIn: 'root'
})
export class ProjectTaskTimeLineProjectService {
    private apiUrl = `${environment.host}api/projecttask`;

    constructor(private http: HttpClient) { }

    getTimelineByProject(params: TimelineByProjectParams): Observable<TimelineByTeamItem[]> {
        let httpParams = new HttpParams()
            .set('dateStart', params.dateStart)
            .set('dateEnd', params.dateEnd);

        if (params.projectID !== undefined) {
            httpParams = httpParams.set('projectID', params.projectID.toString());
        }
        if (params.status !== undefined && params.status !== '') {
            httpParams = httpParams.set('status', params.status);
        }

        return this.http.get<IAPIResponse<TimelineByTeamItem[]>>(
            `${this.apiUrl}/project-task-timeline-by-team`, { params: httpParams }
        ).pipe(
            map(response => response.data || [])
        );
    }
}
