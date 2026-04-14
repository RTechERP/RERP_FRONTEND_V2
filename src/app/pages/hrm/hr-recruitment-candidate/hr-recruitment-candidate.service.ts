import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';
import { AppUserService } from '../../../services/app-user.service';

@Injectable({
  providedIn: 'root',
})
export class HRRecruitmentCandidateService {
  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.host}api/HRRecruitmentCandidate/`;

  getPositionContract() {
    return this.http.get<any>(
      this.apiUrl + `position-contract`
    );
  }

  getHrHiringRequest() {
    return this.http.get<any>(
      this.apiUrl + `hiring-request`
    );
  }

  getDataHrRecruitmentCandidate(
    id: number,
    status: number,
    employeeRequestId: number,
    departmentId: number,
    ds: any,
    de: any,
    keywords: string
  ) {
    return this.http.get<any>(
      this.apiUrl +
      `data?id=${id}&status=${status}&employeeRequestId=${employeeRequestId}&departmentId=${departmentId}&dateStart=${ds}&dateEnd=${de}&keyword=${keywords}`
    );
  }

  saveData(payload: any, file?: File) {
    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === null || value === undefined) return;

      if (value instanceof Date) {
        // Dùng local time để tránh lệch ngày do UTC offset
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, '0');
        const d = String(value.getDate()).padStart(2, '0');
        formData.append(key, `${y}-${m}-${d}`);
      } else {
        formData.append(key, value);
      }
    });

    if (file) {
      formData.append('FileCV', file);
    }

    return this.http.post<any>(
      this.apiUrl + `save-data`,
      formData
    );
  }

  updateStatus(payload: any) {
    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      const value = payload[key];

      if (value === null || value === undefined) return;

      if (key === 'listIds' && Array.isArray(value)) {
        value.forEach((id: number) => {
          formData.append('listIds', id.toString());
        });
      } else {
        formData.append(key, value.toString());
      }
    });

    return this.http.post<any>(
      this.apiUrl + 'update-status',
      formData
    );
  }

  deleteData(listIds: any[]) {
    return this.http.post<any>(
      this.apiUrl + `delete`,
      listIds
    );
  }

  dowloadFileCv(id: number) {
    return this.http.get(
      this.apiUrl + `download-file-cv?id=${id}`, {
      responseType: 'blob',
    }
    );
  }
  sendInterviewMail(payload: any[]) {
    return this.http.post<any>(this.apiUrl + `send-interview-mail`, payload);
  }

  getUsernameCandidate() {
    return this.http.get<any>(this.apiUrl + `get-username-candidate`);
  }

  getEmployees(): Observable<any> {
    const request = { status: 0, departmentid: 0, keyword: '' };
    return this.http.get<any>(`${environment.host}api/employee/`, {
      params: request as any,
    });
  }
}

