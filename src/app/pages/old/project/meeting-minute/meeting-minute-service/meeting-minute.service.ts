import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MeetingMinuteService {
   private apiUrl = environment.host + 'api/';
   private apiMeetingminutes = this.apiUrl +'meetingminutes/';
  constructor(private http: HttpClient) {}

  getDataMeetingType(): Observable<any> {
    return this.http.get<any>(
      this.apiMeetingminutes + `get-meeting-type`
    );
  }

  getMeetingMinutes(
    Keywords: string,
    DateStart: string,
    DateEnd: string,
    MeetingTypeID: number
  ): Observable<any> {
    const asset: any = {
      Keywords: Keywords?.trim() || '',
      DateStart: DateStart ,
      DateEnd: DateEnd,
      MeetingTypeID: MeetingTypeID || 0,
    };
    return this.http.post<any>(
      this.apiMeetingminutes + `get-meeting-minutes`,
      asset
    );
  }

  getEmployee(Status: number): Observable<any> {
    const asset: any = { Status };
    return this.http.post<any>(
      this.apiMeetingminutes + `get-employee`,
      asset
    );
  }

  getUserTeam(DepartmentID: number): Observable<any> {
    const asset: any = { DepartmentID };
    return this.http.post<any>(
      this.apiMeetingminutes + `get-user-team`,
      asset
    );
  }

  getProjectProblem(id: number) {
    return this.http.get<any>(
      this.apiMeetingminutes + `get-project-history-problem/${id}`
    );
  }

   getMeetingMinutesID(id: number) {
    return this.http.get<any>(
      this.apiMeetingminutes  + `get-meeting-minutes/${id}`
    );
  }

  getMeetingMinutesDetailsByID(ID: number): Observable<any> {
    const asset: any = { MeetingMinutesID: ID || 0 };
    return this.http.post<any>(
      this.apiMeetingminutes + `get-meeting-minutes-details`,
      asset
    );
  }

  getDataGroupID(): Observable<any> {
    return this.http.get<any>(
      this.apiMeetingminutes + `get-meetingtype-groups`
    );
  }
  getProject(): Observable<any> {
    return this.http.get<any>(this.apiMeetingminutes + `get-projects`);
  }

  saveData(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiMeetingminutes + `save-data-meeting-minutes`,
      data
    );
  }

  saveMeetingType(data: any): Observable<any> {
    return this.http.post(
      this.apiMeetingminutes + `save-meeting-type`,
      data
    );
  }
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'MeetingMinutes');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this.apiUrl +`home/upload-multiple`, formData);
  }
  //tải file
  downloadFile(path: string): Observable<ArrayBuffer> {
    return this.http.get<ArrayBuffer>(`${this.apiUrl}home/download`, {
      params: { path },
      responseType: 'arraybuffer' as 'json'
    });
  }
}
