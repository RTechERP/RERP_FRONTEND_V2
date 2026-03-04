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
            .set('isPerson', data.isPerson)
        return this.http.get<any>(this.url, { params });
    }

    getRandomNumber(data: any): Observable<any> {
        return this.http.post<any>(this.url + '/get-random-number', data);
    }


    getEmployees(): Observable<any> {
        return this.http.get<any>(environment.host + 'api/employee/employees');
    }


    savedata(data: any[]): Observable<any> {
        return this.http.post<any>(this.url + '/save-data', data);
    }

    uploadFile(files: File[], id: number, phoneNumber: string): Observable<any> {
        const formData = new FormData();
        if (files) {
            Array.from(files).forEach(file => {
                formData.append('files', file);
            });
        }

        formData.append('EmployeeLuckyNumberID', id.toString());
        formData.append('PhoneNumber', phoneNumber.toString());
        return this.http.post<any>(`${this.url}/upload-avatar`, formData);
    }
}
