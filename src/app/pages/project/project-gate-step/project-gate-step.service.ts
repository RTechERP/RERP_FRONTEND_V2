import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProjectGateStepService {
    private url = environment.host + 'api/ProjectGateStep';

    constructor(private http: HttpClient) { }

    getAll(gateId?: number | null, departmentId?: number | null): Observable<any> {
        let url = `${this.url}/get-all?`;
        if (gateId !== null && gateId !== undefined) {
            url += `gateId=${gateId}&`;
        }
        if (departmentId !== null && departmentId !== undefined) {
            url += `departmentId=${departmentId}&`;
        }
        return this.http.get<any>(url);
    }

    getByGate(gateId: number): Observable<any> {
        return this.http.get<any>(`${this.url}/get-by-gate/${gateId}`);
    }

    getProduce(): Observable<any> {
        return this.http.get<any>(`${this.url}/get-produce`);
    }

    save(items: any[]): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, items);
    }

    delete(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.url}/delete`, ids);
    }

    saveGateStepLink(data: any): Observable<any> {
        return this.http.post<any>(`${environment.host}api/ProjectGateStepLink/Save`, data);
    }

    getByProject(projectId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetByProject/${projectId}`);
    }

    getDeletedByProject(projectId: number): Observable<any> {
        return this.http.get<any>(`${environment.host}api/ProjectGateStepLink/GetDeletedByProject/${projectId}`);
    }

    // ProjectGateStepTemplate API
    private templateApiUrl = environment.host + 'api/ProjectGateStepTemplate';

    getAllTemplates(): Observable<any> {
        return this.http.get<any>(`${this.templateApiUrl}/get-all`);
    }

    saveTemplates(items: any[]): Observable<any> {
        return this.http.post<any>(`${this.templateApiUrl}/save-data`, items);
    }

    deleteTemplates(ids: number[]): Observable<any> {
        return this.http.post<any>(`${this.templateApiUrl}/delete`, ids);
    }
}
