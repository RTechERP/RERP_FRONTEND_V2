import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HrhiringRequestService {
  private apiUrl = environment.host + 'api/HrHiringRequest/';

  constructor(private http: HttpClient) {}

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  GlobalDepartmentId: number = 1;

  getDepartments(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-department');
  }

  // SỬA: Cập nhật getList để sử dụng DTO format
  getList(params: any = {}): Observable<any> {
    const requestData = {
      DateStart: params.dateStart || null,
      DateEnd: params.dateEnd || null,
      DepartmentID: params.departmentID || 0,
      Keyword: params.keyword || params.findText || '',
      Id: params.id || 0,
      ChucVuHDID: params.chucVuHDID || 0,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    console.log(
      'GetList request payload:',
      JSON.stringify(requestData, null, 2)
    );

    return this.http
      .post<any>(this.apiUrl + 'getdata', requestData, { headers })
      .pipe(
        tap((response) => console.log('GetData API response:', response)),
        map((response: any) => {
          if (
            response?.status === 1 &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            if (requestData.Id > 0) {
              return response.data; // Multiple result sets cho edit
            } else {
              return response.data[0] || []; // Result set đầu tiên cho list
            }
          }
          return [];
        }),
        catchError((error) => {
          console.error('GetList service error details:', error);
          return of([]);
        })
      );
  }

  // SỬA: Cập nhật getHrHiringRequestData để sử dụng DTO format
  getHrHiringRequestData(
    departmentID: number = 0,
    findText: string = '',
    dateStart: string = '',
    dateEnd: string = '',
    id: number = 0,
    chucVuHDID: number = 0
  ): Observable<any[]> {
    const requestData = {
      DateStart: dateStart || null,
      DateEnd: dateEnd || null,
      DepartmentID: departmentID,
      Keyword: findText,
      Id: 0, // Luôn = 0 để lấy danh sách
      ChucVuHDID: chucVuHDID,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // console.log('Request payload:', JSON.stringify(requestData, null, 2));
    console.log('his.apiUrl', this.apiUrl);

    return this.http
      .post<any>(this.apiUrl + 'getdata', requestData, { headers })
      .pipe(
        tap((response) => console.log('Raw API response:', response)),
        map((response) => {
          if (
            response?.status === 1 &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            return response.data[0] || []; // Lấy result set đầu tiên (danh sách)
          }
          return [];
        }),
        catchError((error) => {
          console.error('Service error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            body: error.error,
          });
          return of([]);
        })
      );
  }

  // SỬA: Cập nhật getHiringRequestDetail để sử dụng DTO format
  getHiringRequestDetail(id: number): Observable<any> {
    const params = {
      DateStart: null,
      DateEnd: null,
      DepartmentID: 0,
      Keyword: '',
      Id: id, // SỬA: Capital case để match DTO
      ChucVuHDID: 0,
    };

    return this.http.post<any>(this.apiUrl + 'getdata', params).pipe(
      map((response: any) => {
        console.log('Raw API response for detail:', response);

        if (
          response?.status === 1 &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const mainData = response.data[0][0];
          const educationData = response.data[1] || [];
          const experienceData = response.data[2] || [];
          const genderData = response.data[3] || [];
          const appearanceData = response.data[4] || [];
          const languageData = response.data[5] || [];
          const computerData = response.data[6] || [];
          const healthData = response.data[7] || [];
          const communicationData = response.data[8] || [];

          console.log('Appearance data:', appearanceData);
          console.log('Health data:', healthData);
          console.log('Communication data:', communicationData);

          const editData = {
            ...mainData,
            EducationSelections: educationData.map(
              (item: any) => item.value || item.EducationLevel
            ),
            ExperienceSelections: experienceData.map(
              (item: any) => item.value || item.Experience
            ),
            GenderSelections: genderData.map(
              (item: any) => item.value || item.Gender
            ),
            AppearanceSelections: appearanceData.map(
              (item: any) => item.value || item.Appearance
            ),

            // Languages
            EnglishLevel: this.getEnglishLevel(languageData),
            OtherLanguage: this.getOtherLanguageName(languageData),
            OtherLanguageLevel: this.getOtherLanguageLevel(languageData),

            // Computer skills
            SkillWord: computerData.some(
              (item: any) => item.ComputerType === 1
            ),
            SkillExcel: computerData.some(
              (item: any) => item.ComputerType === 4
            ),
            SkillPowerpoint: computerData.some(
              (item: any) => item.ComputerType === 2
            ),
            SkillOutlook: computerData.some(
              (item: any) => item.ComputerType === 3
            ),
            SkillInternet: computerData.some(
              (item: any) => item.ComputerType === 5
            ),
            SkillOther: this.getOtherSkills(computerData),

            // Health requirements
            NeedPhysical: healthData.some((item: any) => item.HealthType === 1),
            PhysicalNote: this.getHealthNote(healthData, 1),
            NeedSpecialStrength: healthData.some(
              (item: any) => item.HealthType === 2
            ),
            StrengthNote: this.getHealthNote(healthData, 2),
            EnsureHealth: healthData.some((item: any) => item.HealthType === 3),
            HealthNote: this.getHealthNote(healthData, 3),

            // Communication requirements
            CommNoneExternal: communicationData.some(
              (item: any) => item.CommunicationType === 1
            ),
            CommInternal: communicationData.some(
              (item: any) => item.CommunicationType === 2
            ),
            CommDomesticCustomer: communicationData.some(
              (item: any) => item.CommunicationType === 3
            ),
            CommForeignCustomer: communicationData.some(
              (item: any) => item.CommunicationType === 4
            ),
            CommForeignCountry: this.getForeignCountry(communicationData),
            CommMedia: communicationData.some(
              (item: any) => item.CommunicationType === 5
            ),
            CommAuthorities: communicationData.some(
              (item: any) => item.CommunicationType === 6
            ),
          };

          console.log('Processed edit data:', editData);
          return { status: 1, data: editData };
        } else {
          return { status: 0, data: null };
        }
      }),
      catchError((error) => {
        console.error('Service error:', error);
        return of({ status: 0, data: null });
      })
    );
  }

  // SỬA: Giữ nguyên endpoint cũ cho backward compatibility
  getHrHiringRequestList(
    departmentID: number = 0,
    findText: string = '',
    dateStart: string = '',
    dateEnd: string = '',
    id: number = 0,
    chucVuHDID: number = 0
  ): Observable<any> {
    let params = new HttpParams();

    if (departmentID > 0) {
      params = params.set('departmentID', departmentID.toString());
    }
    if (findText.trim()) {
      params = params.set('findText', findText.trim());
    }
    if (dateStart) {
      params = params.set('dateStart', dateStart);
    }
    if (dateEnd) {
      params = params.set('dateEnd', dateEnd);
    }
    if (id > 0) {
      params = params.set('id', id.toString());
    }
    if (chucVuHDID > 0) {
      params = params.set('chucVuHDID', chucVuHDID.toString());
    }

    return this.http
      .get<any>(this.apiUrl + 'get-hrhiring-request', { params })
      .pipe(
        map((response) => {
          if (response && response.data) {
            if (
              typeof response.data === 'object' &&
              !Array.isArray(response.data)
            ) {
              return Object.values(response.data);
            }
            if (Array.isArray(response.data)) {
              return response.data;
            }
          }
          if (Array.isArray(response)) {
            return response;
          }
          return [];
        }),
        map((dataArray: any[]) => {
          if (!findText.trim()) return dataArray;

          return dataArray.filter(
            (item: any) =>
              (item.EmployeeChucVuHDName || '')
                .toLowerCase()
                .includes(findText.toLowerCase()) ||
              (item.DepartmentName || '')
                .toLowerCase()
                .includes(findText.toLowerCase()) ||
              (item.ProfessionalRequirement || '')
                .toLowerCase()
                .includes(findText.toLowerCase()) ||
              (item.JobDescription || '')
                .toLowerCase()
                .includes(findText.toLowerCase())
          );
        }),
        catchError((error) => {
          console.error('Service error:', error);
          return of([]);
        })
      );
  }

  getHrhiringRequest(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-hrhiring-request');
  }

  saveData(data: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    return this.http.post<any>(this.apiUrl + 'savedata', data, { headers });
  }

  getChucVuHD(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-employee-chuc-vu-hd');
  }

  deleteHiringRequest(id: number): Observable<any> {
    const deleteData = {
      HiringRequests: {
        ID: id,
        IsDeleted: true,
        UpdatedBy: this.LoginName,
        UpdatedDate: new Date().toISOString(),
      },
      EducationLevels: [],
      Experiences: [],
      Appearances: [],
      Genders: [],
      HealthRequirements: [],
      Languages: [],
      ComputerSkills: [],
      Communications: [],
      Approvals: [],
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return this.http
      .post<any>(this.apiUrl + 'savedata', deleteData, { headers })
      .pipe(
        tap((response) => console.log('Delete response:', response)),
        catchError((error) => {
          console.error('Delete service error:', error);
          return of({ status: 0, message: 'Xóa không thành công' });
        })
      );
  }

  // Approve request
  approveRequest(data: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    console.log('Approve request data:', data);
    return this.http.post<any>(this.apiUrl + 'approve', data, { headers }).pipe(
      tap((response) => console.log('Approve response:', response)),
      catchError((error) => {
        console.error('Approve service error:', error);
        return of({ status: 0, message: 'Duyệt không thành công' });
      })
    );
  }

  // Get approval status
  getApprovalStatus(hiringRequestId: number): Observable<any> {
    return this.http
      .get<any>(this.apiUrl + `get-approval-status/${hiringRequestId}`)
      .pipe(
        catchError((error) => {
          console.error('Get approval status error:', error);
          return of({ status: 0, data: null });
        })
      );
  }

  // Helper methods for approval
  approveHCNS(hiringRequestId: number, note: string = ''): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 1,
      IsApprove: true,
      Note: note,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  approveTBP(hiringRequestId: number, note: string = ''): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 2,
      IsApprove: true,
      Note: note,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  approveBGD(hiringRequestId: number, note: string = ''): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 3,
      IsApprove: true,
      Note: note,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  cancelApproveHCNS(
    hiringRequestId: number,
    reason: string = ''
  ): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 1,
      IsApprove: false,
      ReasonUnApprove: reason,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  cancelApproveTBP(
    hiringRequestId: number,
    reason: string = ''
  ): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 2,
      IsApprove: false,
      ReasonUnApprove: reason,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  cancelApproveBGD(
    hiringRequestId: number,
    reason: string = ''
  ): Observable<any> {
    const data = {
      HiringRequestID: hiringRequestId,
      ApproveID: this.GlobalEmployeeId,
      Step: 3,
      IsApprove: false,
      ReasonUnApprove: reason,
      ApproverName: this.LoginName,
    };
    return this.approveRequest(data);
  }

  // Helper methods - giữ nguyên
  private getEnglishLevel(languageData: any[]): string {
    const english = languageData.find((item) => item.LanguageType === 1);
    if (!english) return '';

    const levelMap: { [key: number]: string } = {
      1: 'Level A',
      2: 'Level B',
      3: 'Level C',
      4: 'Không cần',
    };
    return levelMap[english.LanguageLevel] || '';
  }

  private getOtherLanguageName(languageData: any[]): string {
    const other = languageData.find((item) => item.LanguageType === 2);
    return other?.LanguageTypeName || '';
  }

  private getOtherLanguageLevel(languageData: any[]): string {
    const other = languageData.find((item) => item.LanguageType === 2);
    if (!other) return '';

    const levelMap: { [key: number]: string } = {
      1: 'Level A',
      2: 'Level B',
      3: 'Level C',
      4: 'Không cần',
    };
    return levelMap[other.LanguageLevel] || '';
  }

  private getOtherSkills(computerData: any[]): string {
    const other = computerData.find((item) => item.ComputerType === 6);
    return other?.ComputerName || '';
  }

  private getHealthNote(healthData: any[], type: number): string {
    const health = healthData.find((item) => item.HealthType === type);
    return health?.HealthDecription || '';
  }

  private getForeignCountry(communicationData: any[]): string {
    const foreign = communicationData.find(
      (item) => item.CommunicationType === 4
    );
    if (!foreign?.CommunicationDecription) return '';

    const patterns = [
      /Đặc biệt là nước:\s*(.+)/i,
      /nước:\s*(.+)/i,
      /country:\s*(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = foreign.CommunicationDecription.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const parts = foreign.CommunicationDecription.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].trim();
      if (lastPart && lastPart.length < 50) {
        return lastPart;
      }
    }

    return '';
  }

  //#region Duyệt yêu cầu
  approvedTBP(data: any[]): Observable<any> {
    console.log(this.apiUrl + 'approved-tbp', data);
    return this.http.post<any>(this.apiUrl + 'approved-tbp', data);
  }

  approvedHR(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'approved-hr', data);
  }

  approvedBGD(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'approved-bgd', data);
  }
  //#endregion
}
