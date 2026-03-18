import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HRRecruitmentApplicationService {
    constructor(private http: HttpClient) { }
    private apiUrl = `${environment.host}api/HRRecruitmentApplicationForm/`;

    getAllApplicationForm(chucVu: string, filterText: string): Observable<any> {
        return this.http.get<any>(this.apiUrl + `get-all-application-form?chucVu=${chucVu || ''}&filterText=${filterText || ''}`);
    }

    getApplicationFormDetail(hRRecruitmentCandidateID: number): Observable<any> {
        return this.http.get<any>(
            this.apiUrl + `get-all-application-form-detail?hRRecruitmentCandidateID=${hRRecruitmentCandidateID}`
        );
    }

    deleteApplicationForm(ids: number[]): Observable<any> {
        const params = ids.map(id => `ids=${id}`).join('&');
        return this.http.get<any>(this.apiUrl + `delete-application-form?${params}`);
    }
}
