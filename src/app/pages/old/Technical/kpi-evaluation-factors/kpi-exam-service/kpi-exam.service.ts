import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface KPIExam {
    ID: number;
    KPISessionID: number;
    ExamCode: string;
    ExamName: string;
    Deadline: Date | string;
    IsActive: boolean;
    IsDeleted?: boolean;
}

export interface SaveDataRequest {
    KPIExam: KPIExam;
    positionIds: number[];
}

export interface PositionItem {
    ID: number;
    PositionCode: string;
    PositionName: string;
    TypePositionName: string;
    IsCheck: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class KpiExamService {
    private apiUrl = `${environment.host}api/KPIExam`;

    constructor(private http: HttpClient) { }

    /**
     * Load positions by exam ID and session ID
     * @param kpiExamId - KPI Exam ID (0 for new exam)
     * @param kpiSessionId - KPI Session ID
     */
    getDataPosition(kpiExamId: number, kpiSessionId: number): Observable<any> {
        const params = new HttpParams()
            .set('kpiExamId', kpiExamId.toString())
            .set('kpiSessionID', kpiSessionId.toString());
        return this.http.get<any>(`${this.apiUrl}/get-data-position`, { params });
    }

    /**
     * Get all KPI sessions
     * @param year - Year filter (not used by API but kept for compatibility)
     * @param departmentId - Department ID filter (not used by API but kept for compatibility)
     */
    getSessions(year: number = 0, departmentId: number = 0): Observable<any> {
        const params = new HttpParams()
            .set('year', year.toString())
            .set('departmentId', departmentId.toString());
        return this.http.get<any>(`${this.apiUrl}/get-session`, { params });
    }

    /**
     * Save exam with positions
     * @param dto - SaveDataRequest containing KPIExam and positionIds
     */
    saveData(dto: SaveDataRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/save-data`, dto);
    }
}
