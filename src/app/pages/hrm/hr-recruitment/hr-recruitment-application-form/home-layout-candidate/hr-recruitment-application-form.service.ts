import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HRRecruitmentApplicationFormService {
    private apiUrl = `${environment.host}api/HRRecruitmentApplicationForm`;
    private apiUrlExam = `${environment.host}api/HRRecruitmentExam`;

    constructor(private http: HttpClient) { }

    getAllChucVu(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/get-all-chuc-vu`);
    }

    uploadFile(file: File, subPath?: string): Observable<any> {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('key', 'HRRecruitmentApplicationForm');
        if (subPath) {
            formData.append('subPath', subPath);
        }
        return this.http.post<any>(`${environment.host}api/home/upload-multiple`, formData);
    }

    downloadFile(fileName: string, subPath?: string): Observable<Blob> {
        const params: any = {
            key: 'HRRecruitmentApplicationForm',
            fileName: fileName
        };
        if (subPath) params.subPath = subPath;

        return this.http.get(`${environment.host}api/HRRecruitmentApplicationForm/download-by-key`, {
            params: params,
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

    getDataExamByEmployee(hRRecruitmentCandidateID: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrlExam}/get-data-exam-by-employee`, { params: { hRRecruitmentCandidateID } });
    }
}
