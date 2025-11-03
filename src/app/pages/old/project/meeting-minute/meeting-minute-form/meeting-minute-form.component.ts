import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectControlComponent } from '../../../select-control/select-control.component';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';

import { MeetingMinuteComponent } from '../meeting-minute.component';
import { MeetingMinuteService } from '../meeting-minute-service/meeting-minute.service';
import { MeetingTypeFormComponent } from '../meeting-type-form/meeting-type-form.component';
import dayjs from 'dayjs';
import { forkJoin } from 'rxjs';

interface MeetingMinutes {
  STT: number;
  ProjectCode: string;
  ProjectName: string;
  ProjectID: number;
  Title: string;
  TypeName: string;
  DateStart: Date | null;
  DateEnd: Date | null;
  Place: string;
}

interface Employee {
  EmployeeID: number;
  FullName: string;
  UserTeamID: string;
  Section: string;
}

interface Customer {
  FullName: string;
  PhoneNumber: string;
  EmailCustomer: string;
  AddressCustomer: string;
}

interface EmployeeContent {
  DetailContent: string;
  DetailResult: string;
  EmployeeID: number;
  CustomerName: string;
  PhoneNumber: string;
  PlanDate: Date | null;
  Note: string;
  ProjectHistoryProblemID: number;
}

interface CustomerContent {
  DetailContent: string;
  DetailResult: string;
  CustomerName: string;
  PhoneNumber: string;
  PlanDate: Date | null;
  Note: string;
  ProjectHistoryProblemID: number;
  EmployeeID?: number;
}

@Component({
  selector: 'app-meeting-minute-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzSplitterModule,
    NzButtonModule,
    NzModalModule,
    FormsModule,
  ],
  templateUrl: './meeting-minute-form.component.html',
  styleUrl: './meeting-minute-form.component.css',
})
export class MeetingMinuteFormComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  @Input() newMeetingMinutes: MeetingMinutes = {
    STT: 0,
    ProjectCode: '',
    ProjectName: '',
    ProjectID: 0,
    Title: '',
    TypeName: '',
    DateStart: null,
    DateEnd: null,
    Place: '',
  };
  employeeOptions: any;
  userTeamOptions: any;
  projectProblemOptions: any;
  @Input() newEmployee: Employee = {
    EmployeeID: 0,
    FullName: '',
    UserTeamID: '',
    Section: '',
  };

  newCustomer: Customer = {
    FullName: '',
    PhoneNumber: '',
    EmailCustomer: '',
    AddressCustomer: '',
  };
  newEmployeeContent: EmployeeContent = {
    DetailContent: '',
    DetailResult: '',
    EmployeeID: 0,
    CustomerName: '',
    PhoneNumber: '',
    PlanDate: null,
    Note: '',
    ProjectHistoryProblemID: 0,
  };

  newCustomerContent: CustomerContent = {
    DetailContent: '',
    DetailResult: '',
    CustomerName: '',
    PhoneNumber: '',
    PlanDate: null,
    Note: '',
    ProjectHistoryProblemID: 0,
    EmployeeID: -1,
  };

  @Input() searchParams = {
    DateStart: new Date(
      new Date().setMonth(new Date().getMonth())
    ).toISOString(),
    DateEnd: new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    ).toISOString(),
    Keywords: '',
    MeetingTypeID: 0,
  };

  @Input() isCheckmode: any;
  @Input() MeetingMinutesID: number = 0;

  @Input() meetingTypeGroupsData: any[] = [];
  dateFormat = 'dd/MM/YYYY HH:mm:ss';

  projectData: any[] = [];

  deletedMeetingMinutesDetails: any[] = [];
  deletedMeetingMinutesAttendance: any[] = [];

  employeeDetailTable: Tabulator | null = null;
  employeeDetailData: any[] = [];

  employeeDetailContentTable: Tabulator | null = null;
  employeeDetailContentData: any[] = [];

  customerDetailTable: Tabulator | null = null;
  customerDetailData: any[] = [];

  customerDetailContentTable: Tabulator | null = null;
  customerDetailContentData: any[] = [];

  activeTab = 0;
  selectedGroupId: number | null = null;
  projectHistoryProblems: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private meetingminuteService: MeetingMinuteService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder
  ) {}

  // ngOnInit(): void {
  //   this.getProject();
  //   this.getMeetingTypeGroup();

  //   if (this.isCheckmode == true) {
  //     // Mode edit: Load data từ API qua service (giả sử res.data là MeetingMinutesDTO)
  //     if (!this.MeetingMinutesID) {
  //       this.notification.warning('Thông báo', 'Thiếu ID biên bản họp!');
  //       return;
  //     }

  //     this.meetingminuteService
  //       .getMeetingMinutesID(this.MeetingMinutesID)
  //       .subscribe({
  //         next: (res) => {
  //           if (res.data) {
  //             console.log("API response:", res.data);
  //             const meetingMinute = res.data;
  //             const meetingMinuteDetail = res.data.MeetingMinutesDetail || [];
  //             const meetingMinutesAttendance =
  //               res.data.MeetingMinutesAttendance || [];
  //             const projectHistoryProblem =
  //               res.data.ProjectHistoryProblem || [];

  //             // --------- Master data (đồng bộ với API fields) ----------
  //             this.newMeetingMinutes = {
  //               ...this.newMeetingMinutes,
  //               // MeetingTypeID: this.searchParams.MeetingTypeID || meetingMinute.MeetingTypeID,
  //               ProjectID: meetingMinute.ProjectID,
  //               DateStart: meetingMinute.DateStart,
  //               DateEnd: meetingMinute.DateEnd,
  //               Place: meetingMinute.Place || '',
  //               Title: meetingMinute.Title || '',
  //             };
  //             this.searchParams.MeetingTypeID = meetingMinute.MeetingTypeID || 0;

  //             // --------- Employee detail (từ Attendance) ----------
  //             this.employeeDetailData = meetingMinutesAttendance
  //               .filter((x: any) => x.IsEmploye = 0)
  //               .map((item: any) => ({
  //                 EmployeeID: item.EmployeeID || 0,
  //                 FullName: item.FullName || '',
  //                 UserTeamID: item.UserTeamID || '',
  //                 PhoneNumber: item.PhoneNumber || '',
  //                 Section: item.Section || '',
  //                 IsDeleted: false,
  //               }));

  //               console.log('dhdhd', this.employeeDetailContentData);

  //             if (this.employeeDetailTable) {
  //               this.employeeDetailTable.replaceData(this.employeeDetailData);
  //               // Tối ưu: Không cần timeout nếu table đã init, nhưng giữ để an toàn render
  //               setTimeout(() => this.employeeDetailTable?.redraw(true), 50);
  //             }

  //             // --------- Employee content (từ Detail) ----------
  //             this.employeeDetailContentData = [
  //               // dữ liệu từ MeetingMinutesDetail
  //               ...meetingMinuteDetail
  //                 .filter((x: any) => x.IsEmployee)
  //                 .map((item: any) => ({
  //                   ID: item.ID || 0,
  //                   DetailContent: item.DetailContent || '',
  //                   DetailResult: item.DetailResult || '',
  //                   EmployeeID: item.EmployeeID || 0,
  //                   CustomerName: item.CustomerName || '',
  //                   PhoneNumber: item.PhoneNumber || '',
  //                   PlanDate: item.PlanDate || null,
  //                   Note: item.Note || '',
  //                   ProjectHistoryProblemID:
  //                     item.ProjectHistoryProblemID || null,
  //                 })),

  //               // dữ liệu từ ProjectHistoryProblem
  //               ...projectHistoryProblem.map((item: any) => ({
  //                 ID: item.ID || 0,
  //                 DetailContent: item.ContentError || '',
  //                 DetailResult: item.Reason || '',
  //                 EmployeeID: item.EmployeeID || 0,
  //                 PlanDate: item.DateImplementation || null,
  //                 Note: '',
  //                 ProjectHistoryProblemID: item.ID || null,
  //               })),
  //             ];

  //             // customerDetailContentData
  //             this.customerDetailContentData = [
  //               // dữ liệu từ MeetingMinutesDetail
  //               ...meetingMinuteDetail
  //                 .filter((x: any) => x.IsEmployee = 1)
  //                 .map((item: any) => ({
  //                   ID: item.ID || 0, // Thêm ID cho edit
  //                   DetailContent: item.DetailContent || '',
  //                   DetailResult: item.DetailResult || '',
  //                   CustomerName: item.CustomerName || '',
  //                   PhoneNumber: item.PhoneNumber || '',
  //                   PlanDate: item.PlanDate || null,
  //                   Note: item.Note || '',
  //                   ProjectHistoryProblemID:
  //                     item.ProjectHistoryProblemID || null,
  //                   IsEmployee: false,
  //                 })),

  //               // dữ liệu từ ProjectHistoryProblem
  //               ...projectHistoryProblem.map((item: any) => ({
  //                 ProjectID: item.ProjectID,
  //                 DetailContent: item.ContentError,
  //                 DetailResult: item.Reason,
  //                 PlanDate: item.Remedies,
  //               })),
  //             ];

  //             // --------- Customer detail (từ Attendance) ----------
  //             this.customerDetailData = meetingMinutesAttendance
  //               .filter((x: any) => !x.IsEmployee)
  //               .map((item: any) => ({
  //                 FullName: item.FullName || '', // Giả sử là CustomerName
  //                 PhoneNumber: item.PhoneNumber || '',
  //                 EmailCustomer: item.EmailCustomer || '',
  //                 AddressCustomer: item.AddressCustomer || '',
  //               }));

  //             if (this.customerDetailTable) {
  //               this.customerDetailTable.replaceData(this.customerDetailData);
  //               setTimeout(() => this.customerDetailTable?.redraw(true), 50);
  //             }

  //             // --------- Customer content (từ Detail) ----------
  //             // this.customerDetailContentData = meetingMinuteDetail
  //             //   .filter((x: any) => !x.EmployeeID)
  //             //   .map((item: any) => ({
  //             //     ID: item.ID || 0, // Thêm ID cho edit
  //             //     DetailContent: item.DetailContent || '',
  //             //     DetailResult: item.DetailResult || '',
  //             //     CustomerName: item.CustomerName || '',
  //             //     PhoneNumber: item.PhoneNumber || '',
  //             //     PlanDate: item.PlanDate || null,
  //             //     Note: item.Note || '',
  //             //     ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
  //             //     IsEmployee: false,
  //             //   }));

  //             // this.customerDetailContentData = projectHistoryProblem
  //             //   .filter((x: any) => x.IsEmployee)
  //             //   .map((item: any) => ({
  //             //     ProjectID: item.ProjectID,
  //             //     DetailContent: item.ContentError,
  //             //     DetailResult: item.Reason,
  //             //     PlanDate: item.Remedies,
  //             //   }));

  //             if (this.customerDetailContentTable) {
  //               this.customerDetailContentTable.replaceData(
  //                 this.customerDetailContentData
  //               );
  //               setTimeout(
  //                 () => this.customerDetailContentTable?.redraw(true),
  //                 50
  //               );
  //             }
  //           } else {
  //             this.notification.warning(
  //               'Thông báo',
  //               res?.message || 'Không thể lấy thông tin biên bản họp!'
  //             );
  //             // Clear tables nếu data rỗng
  //           }
  //         },
  //         error: (err) => {
  //           console.error('Lỗi load data:', err); // Log cho dev
  //           this.notification.error(
  //             'Thông báo',
  //             'Lỗi khi load dữ liệu biên bản họp!'
  //           );
  //         },
  //       });

  //   } else {
  //     (this.newMeetingMinutes = {
  //       ProjectCode: '',
  //       ProjectName: '',
  //       ProjectID: 0,
  //       Title: '',
  //       TypeName: '',
  //       DateStart: null,
  //       DateEnd: null,
  //       Place: '',
  //       STT: 0,
  //     }),
  //       (this.newEmployee = {
  //         EmployeeID: 0,
  //         FullName: '',
  //         UserTeamID: '',
  //         Section: '',
  //       }),
  //       (this.newEmployeeContent = {
  //         DetailContent: '',
  //         DetailResult: '',
  //         EmployeeID: 0,
  //         CustomerName: '',
  //         PhoneNumber: '',
  //         PlanDate: null,
  //         Note: '',
  //         ProjectHistoryProblemID: 0,
  //       }),
  //       (this.newCustomer = {
  //         FullName: '',
  //         PhoneNumber: '',
  //         EmailCustomer: '',
  //         AddressCustomer: '',
  //       }),
  //       (this.newCustomerContent = {
  //         DetailContent: '',
  //         DetailResult: '',
  //         CustomerName: '',
  //         PhoneNumber: '',
  //         PlanDate: null,
  //         Note: '',
  //         ProjectHistoryProblemID: 0,
  //         EmployeeID: -1,
  //       });
  //   }

  // }

  ngOnInit(): void {
    // Initialize reactive form
    this.form = this.fb.group({
      MeetingTypeID: [this.searchParams.MeetingTypeID || 0, [Validators.required, Validators.min(1)]],
      ProjectID: [this.newMeetingMinutes.ProjectID || 0, [Validators.required, Validators.min(1)]],
      Title: [this.newMeetingMinutes.Title || '', [Validators.required, Validators.maxLength(255)]],
      DateStart: [this.newMeetingMinutes.DateStart || null, [Validators.required]],
      DateEnd: [this.newMeetingMinutes.DateEnd || null, [Validators.required]],
      Place: [this.newMeetingMinutes.Place || '', [Validators.maxLength(255)]],
    });

    // Cascade behaviors
    this.form.get('MeetingTypeID')?.valueChanges.subscribe((val) => {
      if (val !== undefined && val !== null) {
        this.searchParams.MeetingTypeID = val;
        this.onMeetingTypeChange(val);
      }
    });
    this.form.get('ProjectID')?.valueChanges.subscribe((val) => {
      if (val !== undefined && val !== null) {
        this.onProjectChange(val);
      }
    });

    this.getProject();
    this.getMeetingTypeGroup();

    if (this.isCheckmode === true) {
      if (!this.MeetingMinutesID) {
        this.notification.warning('Thông báo', 'Thiếu ID biên bản họp!');
        return;
      }

      forkJoin({
        master: this.meetingminuteService.getMeetingMinutesID(
          this.MeetingMinutesID
        ),
        details: this.meetingminuteService.getMeetingMinutesDetailsByID(
          this.MeetingMinutesID
        ),
      }).subscribe({
        next: ({ master, details }) => {
          if (!master?.data) {
            this.notification.warning(
              'Thông báo',
              master?.message || 'Không thể lấy thông tin biên bản họp!'
            );
            return;
          }

          const meetingMinute = master.data;
          const customerDetails = details?.data?.customerDetails || [];
          const employeeDetails = details?.data?.employeeDetails || [];
          const employeeAttendance = details?.data?.employeeAttendance || [];
          const customerAttendance = details?.data?.customerAttendance || [];

          console.log('employeeDetails:', employeeDetails);
          console.log('employeeAttendance:', employeeAttendance);
          console.log('customerDetails:', customerDetails);
          console.log('customerAttendance:', customerAttendance);

          // --------- Master data ----------
          this.newMeetingMinutes = {
            ...this.newMeetingMinutes,
            ProjectID: meetingMinute.ProjectID,
            DateStart: meetingMinute.DateStart,
            DateEnd: meetingMinute.DateEnd,
            Place: meetingMinute.Place || '',
            Title: meetingMinute.Title || '',
          };
          this.searchParams.MeetingTypeID = meetingMinute.MeetingTypeID || 0;
          // Patch values to form for edit mode
          this.form.patchValue({
            MeetingTypeID: this.searchParams.MeetingTypeID,
            ProjectID: this.newMeetingMinutes.ProjectID,
            Title: this.newMeetingMinutes.Title,
            DateStart: this.newMeetingMinutes.DateStart,
            DateEnd: this.newMeetingMinutes.DateEnd,
            Place: this.newMeetingMinutes.Place,
          });
          this.loadProjectHistoryProblems();
          this.loadOptionProjectProblem();

          // Gỡ vẽ sớm trước khi có data thực để tránh hiển thị trống

          // --------- Employee detail (Attendance) ----------
          this.employeeDetailData = employeeDetails.map((item: any) => ({
            ID: item.ID || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || '',
            UserTeamID: item.UserTeamID || '',
            Section: item.Section || '',
          }));

          // if (this.employeeDetailTable) {
          //   this.employeeDetailTable.replaceData(this.employeeDetailData);
          //   setTimeout(() => this.employeeDetailTable?.redraw(true), 0);
          // }

          // --------- Employee content (Detail + ProjectHistoryProblem) ----------
          this.employeeDetailContentData = [
            ...employeeAttendance.map((item: any) => ({
              ID: item.ID || 0,
              DetailContent: item.DetailContent || '',
              DetailResult: item.DetailResult || '',
              EmployeeID: item.EmployeeID || 0,
              CustomerName: item.CustomerName || '',
              PhoneNumber: item.PhoneNumber || '',
              PlanDate: item.PlanDate || null,
              Note: item.Note || '',
              ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
            })),
            ...this.projectHistoryProblems.map((item: any) => ({
              ID: item.ID || 0,
              DetailContent: item.ContentError || '',
              DetailResult: item.Reason || '',
              EmployeeID: item.EmployeeID || 0,
              PlanDate: item.DateImplementation || null,
              Note: item.Note || '',
              ProjectHistoryProblemID: item.ID || null,
            })),
          ];

          // --------- Customer detail (Attendance) ----------
          this.customerDetailData = customerAttendance.map((item: any) => ({
            ID: item.ID || 0,
            FullName: item.FullName || '',
            PhoneNumber: item.PhoneNumber || '',
            EmailCustomer: item.EmailCustomer || '',
            AddressCustomer: item.AddressCustomer || '',
          }));

          // if (this.customerDetailTable) {
          //   this.customerDetailTable.replaceData(this.customerDetailData);
          //   setTimeout(() => this.customerDetailTable?.redraw(true), 0);
          // }

          // --------- Customer content (Detail + ProjectHistoryProblem) ----------
          this.customerDetailContentData = [
            ...customerDetails.map((item: any) => ({
              ID: item.ID || 0,
              DetailContent: item.DetailContent || '',
              DetailResult: item.DetailResult || '',
              CustomerName: item.CustomerName || '',
              PhoneNumber: item.PhoneNumber || '',
              PlanDate: item.PlanDate || null,
              Note: item.Note || '',
              ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
            })),
            ...this.projectHistoryProblems.map((item: any) => ({
              ProjectID: item.ProjectID,
              DetailContent: item.ContentError,
              DetailResult: item.Reason,
              PlanDate: item.Remedies,
            })),
          ];

          // Sau khi gán toàn bộ data, cập nhật/khởi tạo bảng để hiển thị ngay
          setTimeout(() => {
            if (this.employeeDetailTable) {
              this.employeeDetailTable.replaceData(this.employeeDetailData);
              this.employeeDetailTable.redraw(true);
            } else {
              this.draw_employeeDetailTable();
            }

            if (this.customerDetailTable) {
              this.customerDetailTable.replaceData(this.customerDetailData);
              this.customerDetailTable.redraw(true);
            } else {
              this.draw_customerDetailTable();
            }

            if (this.employeeDetailContentTable) {
              this.employeeDetailContentTable.replaceData(this.employeeDetailContentData);
              this.employeeDetailContentTable.redraw(true);
            }
            if (this.customerDetailContentTable) {
              this.customerDetailContentTable.replaceData(this.customerDetailContentData);
              this.customerDetailContentTable.redraw(true);
            }
          }, 0);
          console.log('employeeDetailTable', this.employeeDetailTable);
        },
        error: (err) => {
          console.error('Lỗi load data:', err);
          this.notification.error(
            'Thông báo',
            'Lỗi khi load dữ liệu biên bản họp!'
          );
        },
      });
    } else {
      // Trường hợp thêm mới (reset dữ liệu)
      this.newMeetingMinutes = {
        ProjectCode: '',
        ProjectName: '',
        ProjectID: 0,
        Title: '',
        TypeName: '',
        DateStart: null,
        DateEnd: null,
        Place: '',
        STT: 0,
      };
      this.newEmployee = {
        EmployeeID: 0,
        FullName: '',
        UserTeamID: '',
        Section: '',
      };
      this.newEmployeeContent = {
        DetailContent: '',
        DetailResult: '',
        EmployeeID: 0,
        CustomerName: '',
        PhoneNumber: '',
        PlanDate: null,
        Note: '',
        ProjectHistoryProblemID: 0,
      };
      this.newCustomer = {
        FullName: '',
        PhoneNumber: '',
        EmailCustomer: '',
        AddressCustomer: '',
      };
      this.newCustomerContent = {
        DetailContent: '',
        DetailResult: '',
        CustomerName: '',
        PhoneNumber: '',
        PlanDate: null,
        Note: '',
        ProjectHistoryProblemID: 0,
        EmployeeID: -1,
      };
    }
  }
  ngAfterViewInit(): void {
     setTimeout(() => {
      this.onTabChange(0);
    }, 200);
    setTimeout(() => {
      this.draw_employeeDetailTable();
      // this.draw_employeeDetailContentTable();
      this.draw_customerDetailTable();
    }, 0);
    this.loadOptionEmployee();
    this.loadOptionUserTeam();
    // this.loadProjectHistoryProblems();
    // this.loadOptionProjectProblem();
  }

   onTabChange(index: number) {
    this.activeTab = index;
    // Initialize tables when tabs become active
    setTimeout(() => {
      if (index === 1 && !this.employeeDetailTable) {
        this.draw_employeeDetailTable()
      } else if (index === 1 && !this.customerDetailTable) {
        this.draw_customerDetailTable();
      }
      this.cdr.detectChanges();
    }, 100); // Small delay to ensure DOM is ready
  }

  getGroupName(groupId: number): string {
    switch (groupId) {
      case 1:
        return 'Khách hàng';
      case 2:
        return 'Nội bộ';
      default:
        return 'Khác';
    }
  }

  toLocalISOString(date: Date | string): string {
  // Chuyển đổi chuỗi thành Date nếu cần
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Kiểm tra xem dateObj có hợp lệ không
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new Error('Invalid date input');
  }

  const tzOffset = 7 * 60; // GMT+7, tính bằng phút
  const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000); // Điều chỉnh sang GMT+7
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

  return (
    adjustedDate.getUTCFullYear() +
    '-' +
    pad(adjustedDate.getUTCMonth() + 1) +
    '-' +
    pad(adjustedDate.getUTCDate()) +
    'T' +
    pad(adjustedDate.getUTCHours()) +
    ':' +
    pad(adjustedDate.getUTCMinutes()) +
    ':' +
    pad(adjustedDate.getUTCSeconds())
  ); // Trả về định dạng YYYY-MM-DDTHH:mm:ss
}

  closeModal() {
    this.activeModal.close(true);
  }

  onTabChangeEmployeeContent(index: number) {
    this.activeTab = index;
    if (index === 1) {
      // Gọi vẽ bảng sau khi DOM sẵn sàng
      setTimeout(() => {
        this.draw_employeeDetailContentTable();
        this.draw_customerDetailContentTable();
        this.cdr.detectChanges(); // Kích hoạt kiểm tra thay đổi
      }, 0);
    }
  }

  getMeetingTypeGroup() {
    this.meetingminuteService.getDataGroupID().subscribe((response: any) => {
      this.meetingTypeGroupsData = response.data || [];
    });
  }

  onMeetingTypeChange(meetingTypeId: number) {
    // Tìm ra groupId từ meetingTypeId
    const selectedGroup = this.meetingTypeGroupsData.find((group) =>
      group.Rooms.some((r: any) => r.ID === meetingTypeId)
    );

    this.selectedGroupId = selectedGroup?.GroupID || null;
  }

  getProject() {
    this.meetingminuteService.getProject().subscribe((response: any) => {
      this.projectData = response.data || [];
    });
  }

  loadOptionEmployee() {
    this.meetingminuteService.getEmployee(0).subscribe({
      next: (res: any) => {
        console.log('employeeData', res.data);
        const employeeData = res.data.asset;
        if (Array.isArray(employeeData)) {
          this.employeeOptions = employeeData
            .filter(
              (employee) =>
                employee.ID !== null &&
                employee.ID !== undefined &&
                employee.ID !== 0
            )
            .map((employee) => ({
              label: employee.Code + '-' + employee.FullName,
              value: employee.ID,
              FullName: employee.FullName,
              Code: employee.Code,
            }));
        } else {
          this.employeeOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách nhân viên'
        );
        this.employeeOptions = [];
      },
    });
  }

  loadProjectHistoryProblems() {
    this.meetingminuteService
      .getProjectProblem(this.newMeetingMinutes.ProjectID)
      .subscribe({
        next: (res: any) => {
          if (Array.isArray(res.data)) {
            this.projectHistoryProblems = res.data; 
          }
        },
        error: (err) => {
          console.error(err);
        },
      });
    console.log('hđ', this.newMeetingMinutes.ProjectID);
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  loadOptionUserTeam() {
    this.meetingminuteService.getUserTeam(0).subscribe({
      next: (res: any) => {
        console.log('UserTeamData', res.data);
        const userTeamData = res.data.asset;
        if (Array.isArray(userTeamData)) {
          this.userTeamOptions = userTeamData
            .filter(
              (userteam) =>
                userteam.ID !== null &&
                userteam.ID !== undefined &&
                userteam.ID !== 0
            )
            .map((userteam) => ({
              label: userteam.Department + '-' + userteam.Name,
              value: userteam.ID,
              Name: userteam.Name,
            }));
        } else {
          this.userTeamOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách dự án'
        );
        this.userTeamOptions = [];
      },
    });
  }

  loadOptionProjectProblem() {
    this.meetingminuteService
      .getProjectProblem(this.newMeetingMinutes.ProjectID)
      .subscribe({
        next: (res: any) => {
          const projectProblem = res.data;
          console.log('PjProblem', res.data);

          if (Array.isArray(projectProblem)) {
            this.projectProblemOptions = projectProblem
              .filter((p) => p.ID !== null && p.ID !== undefined && p.ID !== 0)
              .map((p) => ({
                label: `${p.TypeProblem}-${p.Reason}-${p.Remedies}`,
                value: p.ID,
                ContentError: p.ContentError,
              }));

            // 👉 Thêm option đặc biệt (id = -1)
            this.projectProblemOptions.unshift({
              label: 'Phát sinh mới',
              value: -1,
              ContentError: 'Phát sinh mới',
            });
          } else {
            this.projectProblemOptions = [
              {
                label: 'Phát sinh mới',
                value: -1,
                ContentError: 'Phát sinh mới',
              },
            ];
          }
        },
        error: (err: any) => {
          console.error(err);
          this.notification.error(
            'Thông báo',
            'Có lỗi xảy ra khi lấy danh sách dự án'
          );
          this.projectProblemOptions = [
            {
              label: 'Phát sinh mới',
              value: -1,
              ContentError: 'Phát sinh mới',
            },
          ];
        },
      });
  }

  onProjectChange(projectId: number) {
    console.log('ProjectID đã chọn:', projectId);
    this.newMeetingMinutes.ProjectID = projectId;

    // Gọi API lấy danh sách vấn đề theo ProjectID
    this.loadOptionProjectProblem();
  }

  dateEditor(cell: CellComponent, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'date'; // hiển thị lịch dropdown
    input.value = cell.getValue() || '';

    onRendered(() => input.focus());

    input.addEventListener('change', () => success(input.value));
    input.addEventListener('blur', () => success(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') success(input.value);
      if (e.key === 'Escape') cancel();
    });

    return input;
  }

  saveData(): void {
    // Validate form before save
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.warning('Thông báo', 'Vui lòng nhập đầy đủ và hợp lệ các trường bắt buộc!');
      return;
    }

    // Sync form values to model structures
    const formValue = this.form.value;
    this.searchParams.MeetingTypeID = formValue.MeetingTypeID;
    this.newMeetingMinutes.ProjectID = formValue.ProjectID;
    this.newMeetingMinutes.Title = formValue.Title;
    this.newMeetingMinutes.DateStart = formValue.DateStart;
    this.newMeetingMinutes.DateEnd = formValue.DateEnd;
    this.newMeetingMinutes.Place = formValue.Place;

    const employeeDetailContentTable =
      this.employeeDetailContentTable?.getData() || [];
    const customerDetailContentTable =
      this.customerDetailContentTable?.getData() || [];
    const allProjectProblemData = [
      ...employeeDetailContentTable,
      ...customerDetailContentTable,
    ];
    const detailData = this.employeeDetailContentTable?.getData() || [];
    // Extra logical validation (DateEnd >= DateStart)
    if (this.newMeetingMinutes.DateStart && this.newMeetingMinutes.DateEnd) {
      const start = new Date(this.newMeetingMinutes.DateStart).getTime();
      const end = new Date(this.newMeetingMinutes.DateEnd).getTime();
      if (end < start) {
        this.notification.warning('Thông báo', 'Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu!');
        return;
      }
    }

    if (this.isCheckmode == true) {
      // Update mode
      const payload = {
        MeetingMinute: {
          ID: this.MeetingMinutesID, // ID cho update
          ProjectName: this.newMeetingMinutes.ProjectCode,
            DateStart: this.newMeetingMinutes.DateStart
              ? this.toLocalISOString(this.newMeetingMinutes.DateStart)
            : '',
          DateEnd: this.newMeetingMinutes.DateEnd
             ? this.toLocalISOString(this.newMeetingMinutes.DateEnd)
            : '',
          Place: this.newMeetingMinutes.Place,
          Title: this.newMeetingMinutes.Title,
          // ProjectID: this.newMeetingMinutes.ProjectID || 0, // Nếu backend cần
        },
        MeetingMinutesAttendance: [
          // Employee attendance
          ...(this.employeeDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              EmployeeID: item.EmployeeID || 0,
              FullName: item.FullName || '',
              UserTeamID: item.UserTeamID || '',
              Section: item.Section || '',
              // STT: index + 1, // Thêm nếu backend yêu cầu
            })) || []),
          // Customer attendance
          ...(this.customerDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              FullName: item.FullName || '',
              PhoneNumber: item.PhoneNumber || '',
              EmailCustomer: item.EmailCustomer || '',
              AddressCustomer: item.AddressCustomer || '',
              EmployeeID: -1,
              IsEmployee: true,
              // STT: index + 1,
            })) || []),
        ],
        MeetingMinutesDetail: [
          // Employee content
          ...(this.employeeDetailContentTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              DetailContent: item.DetailContent || '',
              DetailResult: item.DetailResult || '',
              EmployeeID: item.EmployeeID || 0,
              CustomerName: item.CustomerName || '',
              PhoneNumber: item.PhoneNumber || '',
              PlanDate: item.PlanDate || null,
              Note: item.Note || '',
              ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
              IsEmployee: false,
            })) || []),
          // Customer content
          ...(this.customerDetailContentTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: item.ID || 0,
              DetailContent: item.DetailContent || '',
              DetailResult: item.DetailResult || '',
              CustomerName: item.CustomerName || '',
              PhoneNumber: item.PhoneNumber || '',
              PlanDate: item.PlanDate || null,
              Note: item.Note || '',
              ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
              IsEmployee: true,
              EmployeeID: -1,
            })) || []),
        ],
        ProjectHistoryProblem: allProjectProblemData.map((item: any) => ({
          ID: this.isCheckmode ? item.ProjectHistoryProblemID || 0 : 0,
          ProjectID: this.newMeetingMinutes.ProjectID,
          ContentError: item.DetailContent || '',
          Reason: item.DetailResult || '',
          Remedies: item.PlanDate || null,
          Note: item.Note || '',
        })),
        DeletedMeetingMinutesDetails: this.deletedMeetingMinutesDetails,
        DeletedMeetingMinutesAttendance: this.deletedMeetingMinutesAttendance,
      };

      this.meetingminuteService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể cập nhật biên bản họp!'
            );
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error('Lỗi khi cập nhật:', err);
        },
      });
    } else {
      // Insert mode
      const payload = {
        MeetingMinute: {
          ID: 0,
          DateStart: this.newMeetingMinutes.DateStart
              ? this.toLocalISOString(this.newMeetingMinutes.DateStart)
            : '',
          DateEnd: this.newMeetingMinutes.DateEnd
             ? this.toLocalISOString(this.newMeetingMinutes.DateEnd)
            : '',
          Place: this.newMeetingMinutes.Place,
          Title: this.newMeetingMinutes.Title,
          ProjectID: this.newMeetingMinutes.ProjectID,
          MeetingTypeID: this.searchParams.MeetingTypeID,
        },
        MeetingMinutesAttendance: [
          ...(this.employeeDetailTable
            ?.getData()
            .map((item: any, index: number) => {
              const detail = detailData.find(
                (d: any) => d.EmployeeID === item.EmployeeID
              );

              return {
                ID: 0,
                EmployeeID: item.EmployeeID || 0,
                FullName: item.FullName || '',
                UserTeamID: item.UserTeamID || 0,
                Section: item.Section || '',
                MeetingMinutesID: this.searchParams.MeetingTypeID,
                PhoneNumber: detail?.PhoneNumber || '', 
                CustomerName: '',
                EmailCustomer: '',
                AddressCustomer: '',
                IsEmployee: false,
              };
            }) || []),
          ...(this.customerDetailTable
            ?.getData()
            .map((item: any, index: number) => ({
              ID: 0,
              FullName: item.FullName || '',
              PhoneNumber: item.PhoneNumber || '',
              EmailCustomer: item.EmailCustomer || '',
              AddressCustomer: item.AddressCustomer || '',
              IsEmployee: true,
              EmployeeID: -1,
              UserTeamID: 0,
              CustomerName: '',
              Section: '',
              MeetingMinutesID: this.searchParams.MeetingTypeID,
            })) || []),
        ],
        MeetingMinutesDetail: [
          ...(this.employeeDetailContentTable
            ?.getData()
            .map((item: any, index: number) => {
              // tìm trong projectHistoryProblems xem có cái nào liên quan
              const problem = this.projectHistoryProblems.find(
                (p: any) => p.EmployeeID === item.EmployeeID // điều kiện join
              );

              return {
                ID: 0,
                DetailContent: item.DetailContent || '',
                DetailResult: item.DetailResult || '',
                EmployeeID: item.EmployeeID || 0,
                CustomerName: item.CustomerName || '',
                PhoneNumber: item.PhoneNumber || '',
                PlanDate: item.PlanDate || null,
                Note: item.Note || '',
                ProjectHistoryProblem: '',
                ProjectHistoryProblemID: problem?.ID || null, // gán ID của bảng ProjectHistoryProblem
                IsEmployee: false,
              };
            }) || []),

          ...(this.customerDetailContentTable
            ?.getData()
            .map((item: any, index: number) => {
              // tìm trong projectHistoryProblems xem có cái nào liên quan
              const problem = this.projectHistoryProblems.find(
                (p: any) => p.EmployeeID === item.EmployeeID // điều kiện join
              );

              return {
                ID: 0,
                DetailContent: item.DetailContent || '',
                DetailResult: item.DetailResult || '',
                CustomerName: item.CustomerName || '',
                PhoneNumber: item.PhoneNumber || '',
                PlanDate: item.PlanDate || null,
                Note: item.Note || '',
                ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
                IsEmployee: true,
                EmployeeID: -1,
              };
            }) || []),
        ],
        ProjectHistoryProblem:
          allProjectProblemData.map((item: any, index: number) => ({
            ProjectID: this.newMeetingMinutes.ProjectID,
            ContentError: item.DetailContent || '',
            Reason: item.DetailResult || '',
            Remedies: item.PlanDate || null,
            Note: item.Note || '',
            STT: index + 1,
            EmployeeID: item.EmployeeID || -1,
          })) || [],

          DeletedMeetingMinutesDetails: this.deletedMeetingMinutesDetails,
        DeletedMeetingMinutesAttendance: this.deletedMeetingMinutesAttendance,
      };
      console.log('payload save: ', payload);

      this.meetingminuteService.saveData(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể thêm mới biên bản họp!'
            );
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
          console.error('Lỗi khi thêm mới:', err);
        },
      });
    }
  }

  onAddMeetingType() {
    const modalRef = this.modalService.open(MeetingTypeFormComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newMeetingMinutes = this.newMeetingMinutes;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.MeetingMinutesID = this.MeetingMinutesID;
    modalRef.componentInstance.newEmployee = this.newEmployee;

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.getMeetingTypeGroup();
          //  this.getKPICriteriaDetailByID();
          // this.draw_MeetingMinutesTable();
        }
      })
      .catch(() => {});
  }

  draw_employeeDetailTable() {
    if (this.employeeDetailTable) {
      this.employeeDetailTable.replaceData(this.employeeDetailData);
    } else {
      this.employeeDetailTable = new Tabulator('#employeeDetail', {
        data: this.employeeDetailData,
        layout: 'fitDataStretch',
        height: '24vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'Nhân viên',
          columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRow();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const rowIndex = this.employeeDetailData.indexOf(rowData);
                    this.employeeDetailData.splice(rowIndex, 1);
                     if (rowData['ID']) {
                        this.deletedMeetingMinutesAttendance.push(rowData['ID']);
                      }
                    row.delete();
                    this.employeeDetailData = this.employeeDetailData.filter(
                      (x) => x !== rowData
                    );
                    // this.saveData();
                  },
                });
              }
            },
          },
          // {
          //   title: 'Mã nhân viên',
          //   hozAlign: 'center',
          //   headerHozAlign: 'center',
          //   field: 'EmployeeID',
          //   editor: 'input',
          // },
          {
            title: 'Mã nhân viên',
            field: 'EmployeeID',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.employeeOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.Code : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProject) {
                row.update({
                  FullName: selectedProject.FullName,
                });
              }
            },
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            headerHozAlign: 'center',
            editor: 'input',
          },
          // {
          //   title: 'Team',
          //   field: 'UserTeamID',
          //   headerHozAlign: 'center',
          //   editor: 'input',
          // },
          {
            title: 'Team',
            field: 'UserTeamID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.userTeamOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const userteam = this.userTeamOptions.find(
                (p: any) => p.value === val
              );
              const userTeamName = userteam ? userteam.Name : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${userTeamName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedProject = this.userTeamOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedProject) {
                row.update({
                  Name: selectedProject.Name,
                });
              }
            },
          },
          {
            title: 'Chức vụ',
            field: 'Section',
            headerHozAlign: 'center',
            editor: 'input',
          },
        ]
      }
        ],
      });
    }
  }
  addRow() {
    if (this.employeeDetailTable) {
      this.employeeDetailTable.addRow({
        EmployeeID: 0,
        FullName: '',
        UserTeamID: '',
        Section: '',
      });
    }
  }

  draw_employeeDetailContentTable() {
    if (this.employeeDetailContentTable) {
      this.employeeDetailContentTable.replaceData(
        this.employeeDetailContentData
      );
    } else {
      this.employeeDetailContentTable = new Tabulator(
        '#employeeDetailContent',
        {
          data: this.employeeDetailContentData,
          layout: 'fitDataStretch',
          height: '24vh',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 1,

          columns: [
            {
              title: 'Nhân viên',
            columns: [
            {
              title: '',
              field: 'addRowEmployeeContent',
              hozAlign: 'center',
              width: 40,
              headerSort: false,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
              headerClick: () => {
                this.addRowEmployeeContent();
              },
              formatter: () =>
                `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
              cellClick: (e, cell) => {
                if ((e.target as HTMLElement).classList.contains('fas')) {
                  this.modal.confirm({
                    nzTitle: 'Xác nhận xóa',
                    nzContent: 'Bạn có chắc chắn muốn xóa không?',
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                      const row = cell.getRow();
                      const rowData = row.getData();
                      const rowIndex =
                        this.employeeDetailContentData.indexOf(rowData);

                      if (rowData['ID']) {
                        this.deletedMeetingMinutesDetails.push(rowData['ID']);
                      }
                      row.delete();
                      this.employeeDetailContentData =
                        this.employeeDetailContentData.filter(
                          (x) => x !== rowData
                        );
                      // this.saveData();
                    },
                  });
                }
              },
            },
            {
              title: 'Nội dung',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'DetailContent',
              editor: 'input',
            },
            {
              title: 'Kết quả',
              field: 'DetailResult',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Mã nhân viên',
              field: 'EmployeeID',
              hozAlign: 'left',
              headerHozAlign: 'center',
              width: 200,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.employeeOptions,
                {
                  valueField: 'value',
                  labelField: 'label',
                }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }
                const employee = this.employeeOptions.find(
                  (p: any) => p.value === val
                );
                const employeeName = employee ? employee.Code : val;
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellEdited: (cell) => {
                const row = cell.getRow();
                const newValue = cell.getValue();
                const selectedProject = this.employeeOptions.find(
                  (p: any) => p.value === newValue
                );
                if (selectedProject) {
                  row.update({
                    FullName: selectedProject.FullName,
                  });
                }
              },
            },
            {
              title: 'Người phụ trách',
              field: 'CustomerName',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Số điện thoại',
              field: 'PhoneNumber',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Kế hoạch',
              field: 'PlanDate',
              headerHozAlign: 'center',
              editor: this.dateEditor.bind(this),
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              editor: 'input',
            },
            // {
            //   title: 'Phát sinh',
            //   field: 'ProjectHistoryProblemID',
            //   headerHozAlign: 'center',
            //   editor: 'input',
            // },
            {
              title: 'Phát sinh',
              field: 'ProjectHistoryProblemID',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 200,
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.projectProblemOptions,
                {
                  valueField: 'value',
                  labelField: 'label',
                }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }
                const projectproblem = this.projectProblemOptions.find(
                  (p: any) => p.value === val
                );
                const projectProblemName = projectproblem
                  ? projectproblem.ContentError
                  : val;
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectProblemName}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellEdited: (cell) => {
                const row = cell.getRow();
                const newValue = cell.getValue();
                const selectedProject = this.projectProblemOptions.find(
                  (p: any) => p.value === newValue
                );
                if (selectedProject) {
                  row.update({
                    ContentError: selectedProject.ContentError,
                  });
                }
              },
            },

        
          ],
        }]
        }
      );
    }
  }
  addRowEmployeeContent() {
    if (this.employeeDetailContentTable) {
      this.employeeDetailContentTable.addRow({
        DetailContent: '',
        DetailResult: '',
        EmployeeID: 0,
        CustomerName: '',
        PhoneNumber: '',
        PlanDate: '',
        Note: '',
        ProjectHistoryProblemID: '',
      });
    }
  }

  draw_customerDetailTable() {
    if (this.customerDetailTable) {
      this.customerDetailTable.replaceData(this.customerDetailData);
    } else {
      this.customerDetailTable = new Tabulator('#customerDetail', {
        data: this.customerDetailData,
        layout: 'fitDataStretch',
        height: '24vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'Khách hàng',
          columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRowCustomer();
            },
            formatter: () =>
              `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    const rowIndex = this.customerDetailData.indexOf(rowData);

                    this.customerDetailData.splice(rowIndex, 1);
                    if (rowData['ID']) {
                        this.deletedMeetingMinutesAttendance.push(rowData['ID']);
                      }
                    row.delete();
                    this.customerDetailData = this.customerDetailData.filter(
                      (x) => x !== rowData
                    );
                    // this.saveData();
                  },
                });
              }
            },
          },
          {
            title: 'Tên khách hàng',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'FullName',
            editor: 'input',
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Email',
            field: 'EmailCustomer',
            headerHozAlign: 'center',
            editor: 'input',
          },
          {
            title: 'Địa chỉ',
            field: 'AddressCustomer',
            headerHozAlign: 'center',
            editor: 'input',
          },
   

          // cellEdited: (cell) => {
          //   const row = cell.getRow();
          //   const newValue = cell.getValue();
          //   const selectedProject = this.unitOption.find((p: any) => p.value === newValue);
          //   if (selectedProject) {
          //     row.update({
          //       ProjectCodeExport: selectedProject.UnitName,
          //       InventoryProjectIDs: [newValue],
          //     });
          //   }
          // },
        ],
      },
    ]
      });
    }
  }
  addRowCustomer() {
    if (this.customerDetailTable) {
      this.customerDetailTable.addRow({
        FullName: '',
        PhoneNumber: '',
        EmailCustomer: '',
        AddressCustome: '',
      });
    }
  }

  draw_customerDetailContentTable() {
    if (this.customerDetailContentTable) {
      this.customerDetailContentTable.replaceData(
        this.customerDetailContentData
      );
    } else {
      this.customerDetailContentTable = new Tabulator(
        '#customerDetailContent',
        {
          data: this.customerDetailContentData,
          layout: 'fitDataStretch',
          height: '24vh',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,
          selectableRows: 1,
          columns: [
            {
              title: 'Khách hàng',
            columns: [
            {
              title: '',
              field: 'addRowCustomerContent',
              hozAlign: 'center',
              width: 40,
              headerSort: false,
              titleFormatter: () =>
                `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
              headerClick: () => {
                this.addRowCustomerContent();
              },
              formatter: () =>
                `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
              cellClick: (e, cell) => {
                if ((e.target as HTMLElement).classList.contains('fas')) {
                  this.modal.confirm({
                    nzTitle: 'Xác nhận xóa',
                    nzContent: 'Bạn có chắc chắn muốn xóa không?',
                    nzOkText: 'Đồng ý',
                    nzCancelText: 'Hủy',
                    nzOnOk: () => {
                      const row = cell.getRow();
                      const rowData = row.getData();
                      const rowIndex =
                        this.customerDetailContentData.indexOf(rowData);
                      this.customerDetailContentData.splice(rowIndex, 1);
                      if (rowData['ID']) {
                        this.deletedMeetingMinutesDetails.push(rowData['ID']);
                      }
                      row.delete();
                      this.customerDetailContentData =
                        this.customerDetailContentData.filter(
                          (x) => x !== rowData
                        );
                      // this.saveData();
                    },
                  });
                }
              },
            },
            {
              title: 'Nội dung',
              hozAlign: 'center',
              headerHozAlign: 'center',
              field: 'DetailContent',
              editor: 'input',
            },
            {
              title: 'Kết quả',
              field: 'DetailResult',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Họ tên',
              field: 'CustomerName',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Số điện thoại',
              field: 'PhoneNumber',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Kế hoạch',
              field: 'PlanDate',
              headerHozAlign: 'center',
              editor: this.dateEditor.bind(this),
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              editor: 'input',
            },
            {
              title: 'Phát sinh',
              field: 'ProjectHistoryProblemID',
              headerHozAlign: 'center',
              // editor: 'input',
              editor: this.createdControl(
                SelectControlComponent,
                this.injector,
                this.appRef,
                () => this.projectProblemOptions,
                {
                  valueField: 'value',
                  labelField: 'label',
                }
              ),
              formatter: (cell) => {
                const val = cell.getValue();
                if (!val) {
                  return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
                }
                const projectproblem = this.projectProblemOptions.find(
                  (p: any) => p.value === val
                );
                const projectProblemName = projectproblem
                  ? projectproblem.ContentError
                  : val;
                return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectProblemName}</p> <i class="fas fa-angle-down"></i></div>`;
              },
              cellEdited: (cell) => {
                const row = cell.getRow();
                const newValue = cell.getValue();
                const selectedProject = this.projectProblemOptions.find(
                  (p: any) => p.value === newValue
                );
                if (selectedProject) {
                  row.update({
                    ContentError: selectedProject.ContentError,
                  });
                }
              },
            },
          ],
        }]
        }
      );
    }
  }
  addRowCustomerContent() {
    if (this.customerDetailContentTable) {
      this.customerDetailContentTable.addRow({
        DetailContent: '',
        CustomerName: '',
        PhoneNumber: '',
        PlanDate: null,
        Note: '',
        ProjectHistoryProblemID: '',
      });
    }
  }
}
