import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LuckyNumberService {

    private url = environment.host + 'api/employeeluckynumber';
    constructor(private http: HttpClient) { }


    getall(data: any): Observable<any> {
        const params = new HttpParams()
            .set('year', data.year)
            .set('departmentID', data.departmentID)
            .set('employeeID', data.employeeID)
            .set('keyword', data.keyword)
        return this.http.get<any>(this.url, { params });
    }

    getRandomNumber(year: number): Observable<any> {
        const params = new HttpParams()
            .set('year', year)

        return this.http.get<any>(this.url + '/get-random-number', { params });
    }


    savedata(data: any): Observable<any> {
        return this.http.post<any>(this.url + '/save-data', data);
    }
}
