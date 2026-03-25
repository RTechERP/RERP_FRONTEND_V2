import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ProjectTaskTypeService {
    private _url = environment.host + 'api/';

    constructor(private http: HttpClient) { }

    getProjectTaskType(): Observable<any> {
        return this.http.get<any>(this._url + 'ProjectTaskType');
    }

    saveProjectTaskType(data: any): Observable<any> {
        return this.http.post<any>(this._url + 'ProjectTaskType', data);
    }

    getDepartments(): Observable<any> {
        return this.http.get<any>(this._url + 'department/get-all');
    }
}
