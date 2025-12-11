import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { WorkPlan } from './WorkPlan';

@Injectable({
    providedIn: 'root'
})
export class WorkplanService {
    private url = environment.host + "api/workplan";
    constructor(private http: HttpClient) { }

    getWorkPlans(data: any): Observable<any> {
        return this.http.post<any>(this.url, { params: data });
    }

    saveWorkPlan(product: WorkPlan): Observable<any> {
        return this.http.post<any>(`${this.url}/save-data`, product);
    }
}
