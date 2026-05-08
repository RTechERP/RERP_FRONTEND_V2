import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HrRecruitmentInterviewAssessmentServiceService {

  private readonly apiUrl = `${environment.host}api/hrrecruitmentinterviewassessment`;

  constructor(private http: HttpClient) { }

  getPerformanceCriteria(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-performance-criteria`);
  }
  getDataHRRecruitmentApplicationForm(HRRecruitmentCandidateID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-hr-recruitment-application-form?HRRecruitmentCandidateID=${HRRecruitmentCandidateID}`);
  }
  getDataByHRRecruitCandidateID(HRRecruitmentCandidateID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-by-hr-recruit-candidate-id?HRRecruitmentCandidateID=${HRRecruitmentCandidateID}`);
  }
  getDataToHRRecruitApprove(HRRecruitmentCandidateID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-to-hr-recruit-approve?HRRecruitmentCandidateID=${HRRecruitmentCandidateID}`);
  }
  getDataHRRecruitmentApprove(HRRecruitmentApplicationFormID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-data-hr-recruitment-approve?HRRecruitmentApplicationFormID=${HRRecruitmentApplicationFormID}`);
  }

  saveHRRecruitmentInterviewAssessmentForm(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data-after-interview`, data);
  }

  saveHRRecruitmentApprove(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-hr-recruitment-approve`, data);
  }
}
