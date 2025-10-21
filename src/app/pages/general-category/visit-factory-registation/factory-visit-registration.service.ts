import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface FactoryVisitRegistration {
  id?: number;
  registrationDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
  registeringEmployee: string;
  guestCompany: string;
  guestType: string;
  numberOfPeople: number;
  informationReceived: boolean;
  approver?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Participant {
  id?: number;
  registrationId: number;
  employeeCode: string;
  fullName: string;
  company: string;
  position: string;
  phoneNumber: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchCriteria {
  fromDate?: string;
  toDate?: string;
  personInCharge?: string;
  keyword?: string;
}

export interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  registrationData: FactoryVisitRegistration;
  participants: Participant[];
}

@Injectable({
  providedIn: 'root',
})
export class FactoryVisitRegistrationService {
  // Base URL từ backend bạn cung cấp
  private baseUrl = environment.host + 'api/VisitFactory';
  private baseDetailUrl = environment.host + 'api/VisitFactoryDetail';
  private baseGuestTypeUrl = environment.host + 'api/VisitGuestType';
  private emailApiUrl = 'api/email-notifications';

  // Employees
  public getEmployees(): Observable<
    Array<{
      id: number;
      code: string;
      FullName: string;
      departmentName: string | null;
    }>
  > {
    return this.http.get<any>(`${this.baseUrl}/employee-list`).pipe(
      map((res) =>
        (res?.data ?? []).map((e: any) => ({
          id: e.ID,
          code: e.Code ?? '',
          FullName: e.FullName ?? '',
          departmentName: e.DepartmentName ?? null,
        }))
      )
    );
  }

  // Email addresses for notifications
  private readonly MANAGER_EMAIL = 'nguyentuan.dang@rtc.edu.vn';
  private readonly ADMIN_EMAIL = 'admin11@rtc.edu.vn';

  private registrationsSubject = new BehaviorSubject<
    FactoryVisitRegistration[]
  >([]);
  public registrations$ = this.registrationsSubject.asObservable();

  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  public participants$ = this.participantsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Registration CRUD operations (map sang API VisitFactory)
  getRegistrations(): Observable<FactoryVisitRegistration[]> {
    return this.http.get<any>(`${this.baseUrl}/getall`).pipe(
      map((res) =>
        (res?.data ?? []).map((x: any) => this.mapRegistrationFromApi(x))
      ),
      tap((registrations) => this.registrationsSubject.next(registrations))
    );
  }

  getRegistration(id: number): Observable<FactoryVisitRegistration> {
    return this.http
      .get<any>(`${this.baseUrl}/getbyid`, { params: { id } as any })
      .pipe(map((res) => this.mapRegistrationFromApi(res?.data)));
  }

  createRegistration(
    registration: FactoryVisitRegistration,
    details: Participant[] = []
  ): Observable<FactoryVisitRegistration> {
    const payload = this.mapRegistrationToApi(registration, details);

    return this.http.post<any>(`${this.baseUrl}/save`, payload).pipe(
      map((res) => this.mapRegistrationFromApi(res?.data ?? payload)),
      tap((newRegistration) => {
        const currentRegistrations = this.registrationsSubject.value;
        this.registrationsSubject.next([
          ...currentRegistrations,
          newRegistration,
        ]);
      })
    );
  }

  updateRegistration(
    registration: FactoryVisitRegistration,
    details: Participant[] = []
  ): Observable<FactoryVisitRegistration> {
    // Backend dùng cùng endpoint save cho cả tạo/sửa
    return this.getRegistration(registration.id as number).pipe(
      map((existing) =>
        this.mapRegistrationToApi({ ...existing, ...registration }, details)
      ),
      // Gửi lại full object
      switchMap((payload: any) => {
        return this.http.post<any>(`${this.baseUrl}/save`, payload);
      }),
      map((res) => this.mapRegistrationFromApi(res?.data ?? registration)),
      tap((updatedRegistration) => {
        const currentRegistrations = this.registrationsSubject.value;
        const index = currentRegistrations.findIndex(
          (r) => r.id === updatedRegistration.id
        );
        if (index !== -1) {
          currentRegistrations[index] = updatedRegistration;
          this.registrationsSubject.next([...currentRegistrations]);
        }
      })
    );
  }

  deleteRegistration(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/delete/${id}`, {}).pipe(
      tap(() => {
        const currentRegistrations = this.registrationsSubject.value;
        const filteredRegistrations = currentRegistrations.filter(
          (r) => r.id !== id
        );
        this.registrationsSubject.next(filteredRegistrations);
      })
    );
  }

  searchRegistrations(
    criteria: SearchCriteria
  ): Observable<FactoryVisitRegistration[]> {
    // Backend chưa có API search riêng -> filter client-side tạm thời
    return this.getRegistrations().pipe(
      map((list) =>
        list.filter((item) => {
          const inRange =
            (!criteria.fromDate ||
              new Date(item.registrationDate) >= new Date(criteria.fromDate)) &&
            (!criteria.toDate ||
              new Date(item.registrationDate) <= new Date(criteria.toDate));
          const matchKeyword =
            !criteria.keyword ||
            JSON.stringify(item)
              .toLowerCase()
              .includes(criteria.keyword.toLowerCase());
          const matchRegistrant =
            !criteria.personInCharge ||
            String(item.registeringEmployee) ===
              String(criteria.personInCharge);
          return inRange && matchKeyword && matchRegistrant;
        })
      )
    );
  }

  // Participant CRUD operations
  getParticipants(registrationId: number): Observable<Participant[]> {
    return this.http
      .get<any>(`${this.baseDetailUrl}/getall`, {
        params: { visitFactoryID: registrationId } as any,
      })
      .pipe(
        map((res) =>
          (res?.data ?? []).map((d: any) => this.mapParticipantFromApi(d))
        ),
        tap((participants) => this.participantsSubject.next(participants))
      );
  }

  createParticipant(participant: Participant): Observable<Participant> {
    const payload = this.mapParticipantToApi(participant);

    return this.http.post<any>(`${this.baseDetailUrl}/save`, payload).pipe(
      map((res) => this.mapParticipantFromApi(res?.data ?? payload)),
      tap((newP) => {
        const current = this.participantsSubject.value;
        this.participantsSubject.next([...current, newP]);
      })
    );
  }

  updateParticipant(participant: Participant): Observable<Participant> {
    const payload = this.mapParticipantToApi(participant);

    return this.http.post<any>(`${this.baseDetailUrl}/save`, payload).pipe(
      map((res) => this.mapParticipantFromApi(res?.data ?? payload)),
      tap((updated) => {
        const current = this.participantsSubject.value;
        const idx = current.findIndex((p) => p.id === updated.id);
        if (idx !== -1) {
          current[idx] = updated;
          this.participantsSubject.next([...current]);
        }
      })
    );
  }

  deleteParticipant(
    registrationId: number,
    participantId: number
  ): Observable<void> {
    return this.http
      .post<void>(`${this.baseDetailUrl}/delete/${participantId}`, {})
      .pipe(
        tap(() => {
          const current = this.participantsSubject.value;
          this.participantsSubject.next(
            current.filter((p) => p.id !== participantId)
          );
        })
      );
  }

  // New bulk delete API: POST /api/VisitFactoryDetail/delete with body: number[]
  deleteParticipants(ids: number[]): Observable<void> {
    const payload = Array.isArray(ids) ? ids : [];
    return this.http.post<void>(`${this.baseDetailUrl}/delete`, payload).pipe(
      tap(() => {
        const current = this.participantsSubject.value;
        this.participantsSubject.next(
          current.filter((p) => !payload.includes(Number(p.id)))
        );
      })
    );
  }

  // Email notification methods
  sendRegistrationNotification(
    registration: FactoryVisitRegistration,
    participants: Participant[]
  ): Observable<any> {
    const emailData: EmailNotification = {
      to: [this.MANAGER_EMAIL, this.ADMIN_EMAIL],
      subject: `Thông báo đăng ký thăm nhà máy - ${registration.guestCompany}`,
      body: this.generateEmailBody(registration, participants),
      registrationData: registration,
      participants: participants,
    };

    return this.http.post(this.emailApiUrl, emailData);
  }

  // ----------------
  // Mapping helpers
  // ----------------
  private mapRegistrationFromApi(x: any): FactoryVisitRegistration {
    if (!x) return {} as any;
    return {
      id: x.ID,
      registrationDate: x.DateVisit,
      startTime: x.DateStart,
      endTime: x.DateEnd,
      purpose: x.Purpose,
      notes: x.Note,
      registeringEmployee: String(x.EmployeeID ?? ''),
      guestCompany: x.Company,
      guestType: String(x.GuestTypeID ?? ''),
      numberOfPeople: x.TotalPeople,
      informationReceived: x.IsReceive,
      approver: x.EmployeeReceive ? String(x.EmployeeReceive) : undefined,
    };
  }

  private mapRegistrationToApi(
    r: FactoryVisitRegistration,
    details: Participant[]
  ): any {
    return {
      Id: r.id ?? 0,
      // DateVisit ưu tiên ngày nhập trên form, fallback sang DateStart
      DateVisit: r.registrationDate || r.startTime,
      DateStart: r.startTime,
      DateEnd: r.endTime,
      Purpose: r.purpose,
      Note: r.notes,
      EmployeeId: Number(r.registeringEmployee) || 0,
      Company: r.guestCompany,
      // Theo yêu cầu: GuestTypeId là string
      GuestTypeId: String(r.guestType ?? ''),
      TotalPeople: r.numberOfPeople,
      IsReceive: r.informationReceived,
      EmployeeReceive: r.approver ? Number(r.approver) : 0,
      CreatedBy: 'admin',
      CreatedDate: new Date().toISOString(),
      UpdatedBy: '',
      UpdatedDate: new Date().toISOString(),
      IsDeleted: false,
      VisitFactoryDetails: (details || []).map((d) =>
        this.mapParticipantToApi(d)
      ),
    };
  }

  private mapParticipantFromApi(d: any): Participant {
    const mapped: Participant = {
      id: d.Id ?? d.ID ?? d.id,
      registrationId: d.VisitFactoryId ?? d.VisitFactoryID ?? d.visitFactoryId,
      employeeCode: d.EmployeeID
        ? String(d.EmployeeID)
        : d.EmployeeId
        ? String(d.EmployeeId)
        : '',
      fullName: d.FullName ?? d.fullName,
      company: d.Company ?? d.company,
      position: d.Position ?? d.position,
      phoneNumber: d.Phone ?? d.phone,
      email: d.Email ?? d.email,
    };

    return mapped;
  }

  private mapParticipantToApi(p: Participant): any {
    return {
      Id: p.id ?? 0,
      VisitFactoryId: p.registrationId ?? 0,
      EmployeeId: p.employeeCode ? Number(p.employeeCode) : 0,
      FullName: p.fullName,
      Company: p.company,
      Position: p.position,
      Phone: p.phoneNumber,
      Email: p.email,
      CreatedBy: 'admin',
      CreatedDate: new Date().toISOString(),
      UpdatedBy: '',
      UpdatedDate: new Date().toISOString(),
      IsDeleted: false,
    };
  }

  private generateEmailBody(
    registration: FactoryVisitRegistration,
    participants: Participant[]
  ): string {
    const startDateTime = new Date(registration.startTime).toLocaleString(
      'vi-VN'
    );
    const endDateTime = new Date(registration.endTime).toLocaleString('vi-VN');

    let body = `
      <h2>THÔNG BÁO ĐĂNG KÝ THĂM NHÀ MÁY</h2>
      
      <h3>Thông tin đăng ký:</h3>
      <ul>
        <li><strong>Công ty/Đơn vị:</strong> ${registration.guestCompany}</li>
        <li><strong>Loại khách:</strong> ${registration.guestType}</li>
        <li><strong>Thời gian:</strong> ${startDateTime} - ${endDateTime}</li>
        <li><strong>Mục đích:</strong> ${registration.purpose}</li>
        <li><strong>Số người:</strong> ${registration.numberOfPeople}</li>
        <li><strong>Nhân viên đăng ký:</strong> ${
          registration.registeringEmployee
        }</li>
        <li><strong>Người duyệt:</strong> ${
          registration.approver || 'Chưa duyệt'
        }</li>
      </ul>
      
      ${
        registration.notes
          ? `<p><strong>Ghi chú:</strong> ${registration.notes}</p>`
          : ''
      }
      
      <h3>Danh sách người tham gia:</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 8px;">STT</th>
            <th style="padding: 8px;">Họ và tên</th>
            <th style="padding: 8px;">Công ty/Đơn vị</th>
            <th style="padding: 8px;">Chức vụ</th>
            <th style="padding: 8px;">Số điện thoại</th>
            <th style="padding: 8px;">Email</th>
          </tr>
        </thead>
        <tbody>
    `;

    participants.forEach((participant, index) => {
      body += `
        <tr>
          <td style="padding: 8px;">${index + 1}</td>
          <td style="padding: 8px;">${participant.fullName}</td>
          <td style="padding: 8px;">${participant.company}</td>
          <td style="padding: 8px;">${participant.position}</td>
          <td style="padding: 8px;">${participant.phoneNumber}</td>
          <td style="padding: 8px;">${participant.email}</td>
        </tr>
      `;
    });

    body += `
        </tbody>
      </table>
      
      <p><em>Email này được gửi tự động từ hệ thống đăng ký thăm nhà máy.</em></p>
    `;

    return body;
  }

  // Utility methods
  checkTimeConflict(
    registrationId: number,
    startTime: string,
    endTime: string
  ): Observable<boolean> {
    // Chưa có API -> giả lập client-side
    return of(false);
  }

  getAvailableTimeSlots(date: string): Observable<string[]> {
    // Chưa có API -> trả về mảng rỗng
    return of([]);
  }

  // Statistics methods (chưa có API)
  getRegistrationStats(): Observable<any> {
    return of({});
  }

  getMonthlyStats(year: number, month: number): Observable<any> {
    return of({});
  }

  // Guest Types
  getGuestTypes(): Observable<Array<{ id: number; name: string }>> {
    return this.http
      .get<any>(`${this.baseGuestTypeUrl}/getall`)
      .pipe(
        map((res) =>
          (res?.data ?? []).map((g: any) => ({ id: g.ID, name: g.Name }))
        )
      );
  }
}
