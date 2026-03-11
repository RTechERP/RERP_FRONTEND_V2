import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HRRecruitmentApplicationFormService {
    private apiUrl = `${environment.host}api/HRRecruitmentApplicationForm`;

    constructor(private http: HttpClient) { }

    getAllChucVu(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/get-all-chuc-vu`);
    }

    uploadFile(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('key', 'HRRecruitmentApplicationForm');
        return this.http.post<any>(`${environment.host}api/home/upload-multiple`, formData);
    }

    downloadFile(fileName: string): Observable<Blob> {
        return this.http.get(`${environment.host}api/home/download-by-key`, {
            params: {
                key: 'HRRecruitmentApplicationForm',
                fileName: fileName
            },
            responseType: 'blob'
        });
    }

    saveForm(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/save-form`, data);
    }

    saveFormAuto(data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/save-form-auto`, data);
    }

    getCandidateInformation(hRRecruitmentCandidateID: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/get-candidate-infomation`, {
            params: { hRRecruitmentCandidateID }
        });
    }
}
