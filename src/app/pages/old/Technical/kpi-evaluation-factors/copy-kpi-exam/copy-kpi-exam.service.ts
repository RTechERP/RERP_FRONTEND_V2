import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface CopyKPIExamRequest {
    SourceExamId: number;
    TargetExamId: number;
    Overwrite: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CopyKpiExamService {
    private apiUrl = `${environment.host}api/KPIExam`;

    constructor(private http: HttpClient) { }

    /**
     * Get KPI Sessions by department
     */
    getKPISessions(departmentId: number): Observable<any> {
        const params = new HttpParams()
            .set('departmentId', departmentId.toString());
        return this.http.get<any>(`${this.apiUrl}/get-kpi-session`, { params });
    }

    /**
     * Get KPI Exams for copy dropdown
     */
    getKPIExams(departmentId: number, kpiSessionId: number): Observable<any> {
        const params = new HttpParams()
            .set('departmentId', departmentId.toString())
            .set('kpiSessionId', kpiSessionId.toString());
        return this.http.get<any>(`${this.apiUrl}/get-kpi-exam-copy`, { params });
    }

    /**
     * Copy exam evaluation factors
     */
    copyExam(sourceExamId: number, targetExamId: number, overwrite: boolean = false): Observable<any> {
        const body: CopyKPIExamRequest = {
            SourceExamId: sourceExamId,
            TargetExamId: targetExamId,
            Overwrite: overwrite
        };
        return this.http.post<any>(`${this.apiUrl}/copy-exam`, body);
    }
}
