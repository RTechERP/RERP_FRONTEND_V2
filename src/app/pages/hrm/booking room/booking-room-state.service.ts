import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BookingRoomDateRange {
  dateStart: Date;
  dateEnd: Date;
}

@Injectable({
  providedIn: 'root',
})
export class BookingRoomStateService {
  private dateRangeSubject = new BehaviorSubject<BookingRoomDateRange>({
    dateStart: this.getStartOfWeek(new Date()),
    dateEnd: this.getEndOfWeek(new Date()),
  });

  public dateRange$: Observable<BookingRoomDateRange> =
    this.dateRangeSubject.asObservable();

  constructor() {}

  /**
   * Lấy giá trị hiện tại của date range
   */
  getCurrentDateRange(): BookingRoomDateRange {
    return this.dateRangeSubject.value;
  }

  /**
   * Cập nhật date range
   */
  setDateRange(dateStart: Date, dateEnd: Date): void {
    this.dateRangeSubject.next({ dateStart, dateEnd });
  }

  /**
   * Cập nhật date range từ calendar view
   */
  setDateRangeFromCalendar(start: Date, end: Date): void {
    // Lấy start và end của tuần từ calendar
    const dateStart = new Date(start);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(end);
    dateEnd.setHours(23, 59, 59, 999);
    
    this.setDateRange(dateStart, dateEnd);
  }

  /**
   * Lấy ngày đầu tuần (Thứ 2)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  /**
   * Lấy ngày cuối tuần (Chủ nhật)
   */
  private getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  }
}

