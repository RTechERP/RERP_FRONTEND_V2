import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class RatingErrorService {
    private baseUrl = environment.host;

    constructor(private http: HttpClient) { }

    // FiveSRuleError
    getFiveSRuleErrors(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSRuleError/get-all`);
    }

    saveFiveSRuleError(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSRuleError/save`, data);
    }

    deleteFiveSRuleError(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSRuleError/delete`, data);
    }

    getRulesByErrorId(errorId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSRuleError/get-by-error-id/${errorId}`);
    }

    // FiveSError
    getFiveSErrors(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSError/get-all`);
    }

    saveFiveSError(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSError/save`, data);
    }

    deleteFiveSError(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSError/delete`, data);
    }

    getNextSTT(typeError: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSError/get-next-stt/${typeError}`);
    }

    // FiveSDepartment
    getFiveSDepartments(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSDepartment/get-all`);
    }

    saveFiveSDepartment(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSDepartment/save`, data);
    }

    deleteFiveSDepartment(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSDepartment/delete`, data);
    }

    getFiveSDepartmentNextSTT(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSDepartment/get-next-stt`);
    }

    // FiveSRating
    getFiveSRatings(yearValue?: number, monthValue?: number, keyword?: string): Observable<any> {
        let params = new HttpParams();
        if (yearValue) params = params.set('yearValue', yearValue.toString());
        if (monthValue) params = params.set('monthValue', monthValue.toString());
        if (keyword) params = params.set('keyword', keyword);
        return this.http.get<any>(`${this.baseUrl}api/FiveSRating/get-all`, { params });
    }

    saveFiveSRating(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSRating/save`, data);
    }

    deleteFiveSRating(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSRating/delete`, data);
    }

    // FiveSMinus / Bonus
    getMinusPoints(ticketId: number = 0, departmentId: number = 0): Observable<any> {
        let params = new HttpParams();
        if (ticketId) params = params.set('ticketId', ticketId.toString());
        if (departmentId) params = params.set('departmentId', departmentId.toString());
        return this.http.get<any>(`${this.baseUrl}api/FiveSRatingDetail/get-minus-points`, { params });
    }

    saveMinusPoint(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}api/FiveSRatingDetail/save-minus-point`, data);
    }

    // FiveSRatingTicket
    getFiveSRatingTickets(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}api/FiveSRatingTicket/get-all`);
    }
}
