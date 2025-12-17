import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BookingRoom {
  ID?: number;
  MeetingRoomId: number;
  DateRegister: string;
  Content: string;
  StartTime: string;
  EndTime: string;
  DepartmentId: number;
  EmployeeId?: number;
  IsApproved?: number;
  IsDeleted?: boolean;
}

export interface BookingRoomResponse {
  status: number;
  data: {
    room1: any[];
    room2: any[];
    room3: any[];
  };
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingRoomService {
  private apiUrl = `${environment.host}api/BookingRoom/`;

  constructor(private http: HttpClient) {}

  getBookingRooms(
    dateStart: Date,
    dateEnd: Date,
    isShowWeb: boolean = true
  ): Observable<BookingRoomResponse> {
    // Format date chỉ gửi ngày, không có giờ
    const formatDateOnly = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const params = new HttpParams()
      .set('DateStart', formatDateOnly(dateStart))
      .set('DateEnd', formatDateOnly(dateEnd))
      .set('IsShowWeb', isShowWeb.toString());

    return this.http.post<BookingRoomResponse>(
      `${this.apiUrl}get-booking-room`,
      null,
      { params }
    );
  }

  saveBookingRoom(bookingRoom: BookingRoom): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}save-data`, bookingRoom);
  }

  deleteBookingRoom(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrl}delete-booking-room`, { params });
  }

  getBookingRoomById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get-by-id`, {
      params: new HttpParams().set('id', id.toString())
    });
  }
}

