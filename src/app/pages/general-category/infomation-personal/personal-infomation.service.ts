import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PersonalInfomationService {
    private url = environment.host + 'api/home';

    constructor(private http: HttpClient) { }

    getPersonalInformation(): Observable<any> {
        return this.http.get<any>(`${this.url}/personal-information`);
    }

    updatePersonalInformation(payload: any): Observable<any> {
        return this.http.post<any>(`${this.url}/update-personal-information`, payload);
    }
}
