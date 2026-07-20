import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProjectGateCheckListTypeService {
    private url = environment.host + 'api/ProjectGateCheckListType';

    constructor(private http: HttpClient) { }

    getAll(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-all`);
    }

    save(items: any[]): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, items);
    }

    delete(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.url}/delete`, ids);
    }
}
