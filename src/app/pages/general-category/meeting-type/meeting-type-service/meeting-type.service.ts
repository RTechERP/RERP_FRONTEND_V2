import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
export interface MeetingTypeDto {
  ID?: number;
  TypeCode?: string;
  TypeName?: string;
  TypeContent?: string;
  GroupID?: number;
  GroupName?: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  IsDelete?: boolean;
}

export interface ApiResponse<T> {
  Success: boolean;
  Message?: string;
  Data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class MeetingTypeService {
  private apiUrl = environment.apiUrl + '/MeetingType';

  constructor(private http: HttpClient) {}

  getAllMeetingTypes(): Observable<ApiResponse<MeetingTypeDto[]>> {
    return this.http
      .get<ApiResponse<MeetingTypeDto[]>>(`${this.apiUrl}/meetingtypes`)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(this.handleError)
      );
  }

  saveData(data: MeetingTypeDto): Observable<ApiResponse<MeetingTypeDto>> {
    return this.http
      .post<ApiResponse<MeetingTypeDto>>(`${this.apiUrl}/savedata`, data)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(this.handleError)
      );
  }

  // Thêm method check duplicate code

  // Thêm method get by ID
  getMeetingTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  checkMeetingTypeCode(id: number, typeCode: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/checkmeetingtype/${id}/${typeCode}`
    );
  }
  private handleError(error: HttpErrorResponse) {
    console.error('Service Error:', error);

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      console.error('Client Error:', error.error.message);
    } else {
      // Server-side error
      console.error(
        `Server Error Code: ${error.status}, Message: ${error.message}`
      );
    }

    return throwError(() => error);
  }
}
