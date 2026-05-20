import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class HrRecruitmentApproveService {
  private readonly apiUrl = `${environment.host}api/hrrecruitmentapprove`;

  constructor(private http: HttpClient) { }
  getDataToHRRecruitApprove(HRRecruitmentCandidateID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-to-hr-recruit-approve?HRRecruitmentCandidateID=${HRRecruitmentCandidateID}`);
  }
  getDataHRRecruitmentApprove(HRRecruitmentApplicationFormID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-hr-recruitment-approve?HRRecruitmentApplicationFormID=${HRRecruitmentApplicationFormID}`);
  }
  getListHRRecruitmentApprove(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-list-hr-recruitment-approve`, { params });
  }
  getHRRecruitmentCandidateByIDForm(HRRecruitmentApplicationFormID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-hr-recruitment-candidate-by-id-form?HRRecruitmentApplicationFormID=${HRRecruitmentApplicationFormID}`);
  }
  saveHRRecruitmentApprove(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-hr-recruitment-approve`, data);
  }
  approveHRRecruitment(lstID: number[], type: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-hr-recruitment?type=${type}`, lstID);
  }
  unApproveHRRecruitment(lstID: number[], type: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/unapprove-hr-recruitment?type=${type}&reason=${encodeURIComponent(reason)}`, lstID);
  }
}
