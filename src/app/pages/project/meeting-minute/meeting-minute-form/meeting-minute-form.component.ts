import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { SelectControlComponent } from '../../../old/select-control/select-control.component';
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
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';

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
  @Input() isCheckmode: any;
  @Input() MeetingMinutesID: number = 0;

  // ViewChild cho các bảng
  @ViewChild('tb_EmployeeDetailTable', { static: false })
  tb_EmployeeDetailTableElement!: ElementRef;
  @ViewChild('tb_CustomerDetailTable', { static: false })
  tb_CustomerDetailTableElement!: ElementRef;
  @ViewChild('tb_EmployeeDetailContentTable', { static: false })
  tb_EmployeeDetailContentTableElement!: ElementRef;
  @ViewChild('tb_CustomerDetailContentTable', { static: false })
  tb_CustomerDetailContentTableElement!: ElementRef;
  @ViewChild('tb_FileTable', { static: false })
  tb_FileTableElement!: ElementRef;

  // Tabulator instances
  private tb_EmployeeDetailTable!: Tabulator;
  private tb_CustomerDetailTable!: Tabulator;
  private tb_EmployeeDetailContentTable!: Tabulator;
  private tb_CustomerDetailContentTable!: Tabulator;
  private tb_FileTable!: Tabulator;

  // Form
  form!: FormGroup;

  // Data arrays
  employeeDetailData: any[] = [];
  customerDetailData: any[] = [];
  employeeDetailContentData: any[] = [];
  customerDetailContentData: any[] = [];
  fileDatas: Array<{
    ID?: number;
    FileName: string;
    OriginPath: string;
    ServerPath?: string;
    File?: File;
  }> = [];

  // Options data
  employeeOptions: any[] = [];
  userTeamOptions: any[] = [];
  projectProblemOptions: any[] = [];
  meetingTypeGroupsData: any[] = [];
  projectData: any[] = [];
  placeData: any[] = [
    { ID: 1, Name: 'Phòng họp 1 (Hồ Tây)' },
    { ID: 2, Name: 'Phòng họp 2 (Hồ Gươm)' },
    { ID: 3, Name: 'Phòng họp 3 (Hồ Trúc Bạch)' },
  ];

  // Deleted IDs tracking
  deletedIdsEmployeeDetail: any[] = [];
  deletedIdsCustomerDetail: any[] = [];
  deletedIdsEmployeeContent: any[] = [];
  deletedIdsCustomerContent: any[] = [];
  deletedFile: any[] = [];

  // Other properties
  activeTab = 0;
  selectedGroupId: number | null = null;
  projectHistoryProblems: any[] = [];
  dateFormat = 'dd/MM/YYYY HH:mm:ss';

  selectedProject: {
    ProjectCode?: string;
    CreatedDate?: string | Date;
  } = {};

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
  ) {
    this.form = this.fb.group({
      MeetingTypeID: [null, [Validators.required]],
      ProjectID: [null, [Validators.required]],
      Title: ['', [Validators.required]],
      DateStart: [null, [Validators.required]],
      DateEnd: [null, [Validators.required]],
      Place: [null],
    });
  }

  ngOnInit(): void {
    this.loadProjectData();
    this.getMeetingTypeGroup();

    // Cascade behaviors
    this.form.get('MeetingTypeID')?.valueChanges.subscribe((val) => {
      if (val) {
        this.onMeetingTypeChange(val);
      }
    });

    this.form.get('ProjectID')?.valueChanges.subscribe((projectId) => {
      if (projectId) {
        const project = this.projectData.find((p) => p.ID === projectId);
        if (project) {
          this.selectedProject = {
            ProjectCode: project.ProjectCode,
            CreatedDate: project.CreatedDate,
          };
          this.loadOptionProjectProblem();
          this.loadProjectHistoryProblems();
        }
      }
    });

    // Load options first, then load detail if edit mode
    forkJoin({
      employee: this.loadOptionEmployee(),
      userTeam: this.loadOptionUserTeam(),
    }).subscribe({
      next: () => {
        // Load detail if edit mode - after options are loaded
        if (this.isCheckmode === true) {
          if (!this.MeetingMinutesID) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Thiếu ID biên bản họp!');
            return;
          }
          this.loadDetailEditMode(this.MeetingMinutesID);
        }
      },
      error: (err) => {
        console.error('Error loading options:', err);
        // Still try to load detail even if options fail
        if (this.isCheckmode === true) {
          if (!this.MeetingMinutesID) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Thiếu ID biên bản họp!');
            return;
          }
          this.loadDetailEditMode(this.MeetingMinutesID);
        }
      },
    });
  }

  loadProjectData(): void {
    this.meetingminuteService.getProject().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projectData = response.data || [];
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadDetailEditMode(id: number): void {
    forkJoin({
      master: this.meetingminuteService.getMeetingMinutesID(id),
      details: this.meetingminuteService.getMeetingMinutesDetailsByID(id),
    }).subscribe({
      next: ({ master, details }) => {
        if (master?.status === 1 && master?.data) {
          const meetingMinute = master.data;
          const customerDetails = details?.data?.cusContent || [];
          const employeeDetails = details?.data?.empContent || [];
          const employeeAttendance = details?.data?.empDetail || [];
          const customerAttendance = details?.data?.cusDetail || [];

          // Patch form values
          this.form.patchValue({
            MeetingTypeID: meetingMinute.MeetingTypeID || null,
            ProjectID: meetingMinute.ProjectID || null,
            Title: meetingMinute.Title || '',
            DateStart: meetingMinute.DateStart || null,
            DateEnd: meetingMinute.DateEnd || null,
            Place: meetingMinute.Place || null,
          });

          // Set selected project
          const project = this.projectData.find(
            (p) => p.ID === meetingMinute.ProjectID
          );
          if (project) {
            this.selectedProject = {
              ProjectCode: project.ProjectCode,
              CreatedDate: project.CreatedDate,
            };
          }

          // Employee detail (Attendance)
          this.employeeDetailData = employeeAttendance.map((item: any) => ({
            ID: item.ID || 0,
            EmployeeID: item.EmployeeID || 0,
            FullName: item.FullName || '',
            UserTeamID: item.UserTeamID || '',
            Section: item.Section || '',
          }));

          // Customer detail (Attendance)
          this.customerDetailData = customerAttendance.map((item: any) => ({
            ID: item.ID || 0,
            FullName: item.FullName || '',
            PhoneNumber: item.PhoneNumber || '',
            EmailCustomer: item.EmailCustomer || '',
            AddressCustomer: item.AddressCustomer || '',
          }));

          // Employee content
          this.employeeDetailContentData = employeeDetails.map((item: any) => ({
            ID: item.ID || 0,
            DetailContent: item.DetailContent || '',
            DetailResult: item.DetailResult || '',
            EmployeeID: item.EmployeeID || 0,
            CustomerName: item.CustomerName || '',
            PhoneNumber: item.PhoneNumber || '',
            PlanDate: item.PlanDate || null,
            Note: item.Note || '',
            ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
          }));

          // Customer content
          this.customerDetailContentData = customerDetails.map((item: any) => ({
            ID: item.ID || 0,
            DetailContent: item.DetailContent || '',
            DetailResult: item.DetailResult || '',
            CustomerName: item.CustomerName || '',
            PhoneNumber: item.PhoneNumber || '',
            PlanDate: item.PlanDate || null,
            Note: item.Note || '',
            ProjectHistoryProblemID: item.ProjectHistoryProblemID || null,
            EmployeeID: -1,
          }));

          // File data
          const fileList = details?.data?.file || [];
          this.fileDatas = fileList.map((item: any) => ({
            ID: item.ID,
            MeetingMinutesID: item.MeetingMinutesID,
            FileName: item.FileName,
            OriginPath: item.OriginPath,
            ServerPath: item.ServerPath,
          }));

          // Update tables after data loaded - wait a bit more to ensure options are ready
          setTimeout(() => {
            if (this.tb_EmployeeDetailTable) {
              this.tb_EmployeeDetailTable.replaceData(this.employeeDetailData);
              this.tb_EmployeeDetailTable.redraw(true);
            }
            if (this.tb_CustomerDetailTable) {
              this.tb_CustomerDetailTable.replaceData(this.customerDetailData);
              this.tb_CustomerDetailTable.redraw(true);
            }
            if (this.tb_EmployeeDetailContentTable) {
              this.tb_EmployeeDetailContentTable.replaceData(
                this.employeeDetailContentData
              );
              this.tb_EmployeeDetailContentTable.redraw(true);
            }
            if (this.tb_CustomerDetailContentTable) {
              this.tb_CustomerDetailContentTable.replaceData(
                this.customerDetailContentData
              );
              this.tb_CustomerDetailContentTable.redraw(true);
            }
            if (this.tb_FileTable) {
              this.tb_FileTable.replaceData(this.fileDatas);
              this.tb_FileTable.redraw(true);
            }
          }, 200);

          // Load project problems
          this.loadOptionProjectProblem();
          this.loadProjectHistoryProblems();
        } else {
          this.notification.error(
            'Lỗi',
            master?.message || 'Không thể lấy thông tin biên bản họp!'
          );
        }
      },
      error: (err) => {
        console.error('Lỗi load data:', err);
        this.notification.error(
          'Thông báo',
          'Lỗi khi load dữ liệu biên bản họp!'
        );
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initEmployeeDetailTable();
      this.initCustomerDetailTable();
      this.initEmployeeDetailContentTable();
      this.initCustomerDetailContentTable();
      this.initFileTable();
    }, 0);
  }

  onTabChange(index: number) {
    this.activeTab = index;

    setTimeout(() => {
      if (index === 0) {
        // Tab Employee
        if (this.tb_EmployeeDetailTable) {
          this.tb_EmployeeDetailTable.replaceData(this.employeeDetailData);
          this.tb_EmployeeDetailTable.redraw(true);
        }
        if (this.tb_CustomerDetailTable) {
          this.tb_CustomerDetailTable.replaceData(this.customerDetailData);
          this.tb_CustomerDetailTable.redraw(true);
        }
      }

      if (index === 1) {
        // Tab Content
        if (this.tb_EmployeeDetailContentTable) {
          this.tb_EmployeeDetailContentTable.replaceData(
            this.employeeDetailContentData
          );
          this.tb_EmployeeDetailContentTable.redraw(true);
        }
        if (this.tb_CustomerDetailContentTable) {
          this.tb_CustomerDetailContentTable.replaceData(
            this.customerDetailContentData
          );
          this.tb_CustomerDetailContentTable.redraw(true);
        }
      }

      if (index === 2) {
        // File tab
        if (this.tb_FileTable) {
          this.tb_FileTable.replaceData(this.fileDatas);
          this.tb_FileTable.redraw(true);
        }
      }

      this.cdr.detectChanges();
    }, 100);
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
    if (this.form) {
      this.form.reset();
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }

    if (this.tb_EmployeeDetailTable) {
      this.tb_EmployeeDetailTable.clearData();
    }
    if (this.tb_CustomerDetailTable) {
      this.tb_CustomerDetailTable.clearData();
    }
    if (this.tb_EmployeeDetailContentTable) {
      this.tb_EmployeeDetailContentTable.clearData();
    }
    if (this.tb_CustomerDetailContentTable) {
      this.tb_CustomerDetailContentTable.clearData();
    }
    if (this.tb_FileTable) {
      this.tb_FileTable.clearData();
    }

    this.activeModal.close({ success: false, reloadData: false });
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
    return this.meetingminuteService.getEmployee(0).pipe(
      map((res: any) => {
        console.log('employeeDatadfrdfd', res.data);
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
              ChucVu: employee.ChucVu || employee.Section || '',
              TeamID: employee.TeamID || employee.UserTeamID || null,
              SDTCaNhan: employee.SDTCaNhan || '',
            }));
        } else {
          this.employeeOptions = [];
        }
        return this.employeeOptions;
      }),
      catchError((err: any) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy danh sách nhân viên'
        );
        this.employeeOptions = [];
        return of([]);
      })
    );
  }

  loadProjectHistoryProblems() {
    const projectId = this.form.get('ProjectID')?.value;
    if (projectId) {
      this.meetingminuteService.getProjectProblem(projectId).subscribe({
        next: (res: any) => {
          if (Array.isArray(res.data)) {
            this.projectHistoryProblems = res.data;
          }
        },
        error: (err) => {
          console.error(err);
        },
      });
    }
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
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
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

      const hostEl = (componentRef.hostView as any).rootNodes[0];
      if (hostEl && hostEl.style) {
        hostEl.style.width = '100%';
        hostEl.style.display = 'block';
      }
      container.appendChild(hostEl);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  loadOptionUserTeam() {
    return this.meetingminuteService.getUserTeam(0).pipe(
      map((res: any) => {
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
        return this.userTeamOptions;
      }),
      catchError((err: any) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy danh sách dự án'
        );
        this.userTeamOptions = [];
        return of([]);
      })
    );
  }

  loadOptionProjectProblem() {
    const projectId = this.form.get('ProjectID')?.value;
    if (projectId) {
      this.meetingminuteService.getProjectProblem(projectId).subscribe({
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
            NOTIFICATION_TITLE.error,
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
      return;
    }

    const formValues = this.form.getRawValue();

    // Extra logical validation (DateEnd >= DateStart)
    if (formValues.DateStart && formValues.DateEnd) {
      const start = new Date(formValues.DateStart).getTime();
      const end = new Date(formValues.DateEnd).getTime();
      if (end < start) {
        this.notification.warning(
          'Thông báo',
          'Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu!'
        );
        return;
      }
    }

    // Lấy dữ liệu từ các bảng
    const employeeDetailRows = this.tb_EmployeeDetailTable?.getData() || [];
    const customerDetailRows = this.tb_CustomerDetailTable?.getData() || [];
    const employeeContentRows =
      this.tb_EmployeeDetailContentTable?.getData() || [];
    const customerContentRows =
      this.tb_CustomerDetailContentTable?.getData() || [];

    // Map dữ liệu giống customer-detail
    const employeeAttendance = employeeDetailRows
      .filter((r: any) => r?.EmployeeID)
      .map((r: any) => ({
        ID: r?.ID ?? 0,
        EmployeeID: r?.EmployeeID ?? 0,
        FullName: r?.FullName ?? '',
        UserTeamID: r?.UserTeamID ?? '',
        Section: r?.Section ?? '',
        IsEmployee: false,
      }));

    const customerAttendance = customerDetailRows
      .filter((r: any) => r?.FullName?.trim())
      .map((r: any) => ({
        ID: r?.ID ?? 0,
        FullName: r?.FullName ?? '',
        PhoneNumber: r?.PhoneNumber ?? '',
        EmailCustomer: r?.EmailCustomer ?? '',
        AddressCustomer: r?.AddressCustomer ?? '',
        EmployeeID: -1,
        IsEmployee: true,
      }));

    const employeeDetails = employeeContentRows
      .filter((r: any) => r?.DetailContent?.trim() || r?.EmployeeID)
      .map((r: any) => ({
        ID: r?.ID ?? 0,
        DetailContent: r?.DetailContent ?? '',
        DetailResult: r?.DetailResult ?? '',
        EmployeeID: r?.EmployeeID ?? 0,
        CustomerName: r?.CustomerName ?? '',
        PhoneNumber: r?.PhoneNumber ?? '',
        PlanDate:
          typeof r?.PlanDate === 'string' && r?.PlanDate
            ? new Date(r.PlanDate).toISOString()
            : r?.PlanDate instanceof Date
            ? r.PlanDate.toISOString()
            : null,
        Note: r?.Note ?? '',
        ProjectHistoryProblemID: r?.ProjectHistoryProblemID ?? null,
        IsEmployee: true,
      }));
    console.log('employeeDetailskk', employeeDetails);

    const customerDetails = customerContentRows
      .filter((r: any) => r?.DetailContent?.trim() || r?.CustomerName?.trim())
      .map((r: any) => ({
        ID: r?.ID ?? 0,
        DetailContent: r?.DetailContent ?? '',
        DetailResult: r?.DetailResult ?? '',
        CustomerName: r?.CustomerName ?? '',
        PhoneNumber: r?.PhoneNumber ?? '',
        PlanDate:
          typeof r?.PlanDate === 'string' && r?.PlanDate
            ? new Date(r.PlanDate).toISOString()
            : r?.PlanDate instanceof Date
            ? r.PlanDate.toISOString()
            : null,
        Note: r?.Note ?? '',
        ProjectHistoryProblemID: r?.ProjectHistoryProblemID ?? null,
        IsEmployee: false,
        EmployeeID: -1,
      }));
    console.log('customerDetailskk', customerDetails);

    // Upload files nếu có
    const subPath = this.getSubPath();
    const filesToUpload: File[] = this.fileDatas
      .filter((f) => f.File && !f.ServerPath)
      .map((f) => f.File!);

    if (filesToUpload.length > 0 && subPath) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      this.meetingminuteService
        .uploadMultipleFiles(filesToUpload, subPath)
        .subscribe({
          next: (res: any) => {
            if (res?.data?.length > 0) {
              // Cập nhật ServerPath cho các file đã upload
              let fileIndex = 0;
              this.fileDatas.forEach((f) => {
                if (f.File && !f.ServerPath && res.data[fileIndex]) {
                  f.ServerPath = res.data[fileIndex].FilePath;
                  fileIndex++;
                }
              });
            }
            this.performSave(
              formValues,
              employeeAttendance,
              customerAttendance,
              employeeDetails,
              customerDetails
            );
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Upload file thất bại!'
            );
          },
        });
    } else {
      this.performSave(
        formValues,
        employeeAttendance,
        customerAttendance,
        employeeDetails,
        customerDetails
      );
    }
  }

  performSave(
    formValues: any,
    employeeAttendance: any[],
    customerAttendance: any[],
    employeeDetails: any[],
    customerDetails: any[]
  ): void {
    const payload = {
      MeetingMinute: {
        ID: this.isCheckmode ? this.MeetingMinutesID : 0,
        MeetingTypeID: formValues.MeetingTypeID ?? 0,
        ProjectID: formValues.ProjectID ?? 0,
        Title: formValues.Title ?? '',
        DateStart: formValues.DateStart
          ? this.toLocalISOString(formValues.DateStart)
          : '',
        DateEnd: formValues.DateEnd
          ? this.toLocalISOString(formValues.DateEnd)
          : '',
        Place: formValues.Place ?? '',
      },
      MeetingMinutesAttendance: [...employeeAttendance, ...customerAttendance],
      MeetingMinutesDetail: [...customerDetails, ...employeeDetails],
      DeletedMeetingMinutesDetails: this.deletedIdsEmployeeContent.concat(
        this.deletedIdsCustomerContent
      ),
      DeletedMeetingMinutesAttendance: this.deletedIdsEmployeeDetail.concat(
        this.deletedIdsCustomerDetail
      ),
      MeetingMinutesFile: this.fileDatas.map((f) => ({
        ID: f.ID || 0,
        MeetingMinutesID: this.isCheckmode ? this.MeetingMinutesID : 0,
        FileName: f.FileName,
        OriginPath: f.OriginPath,
        ServerPath: f.ServerPath,
      })),
      DeletedFile: this.deletedFile,
    };

    console.log('payload save: ', payload);

    this.meetingminuteService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            'Thông báo',
            this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'
          );
          this.closeModal();
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lưu biên bản họp!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu!');
        console.error('Lỗi khi lưu:', err);
      },
    });
  }

  onAddMeetingType() {
    const modalRef = this.modalService.open(MeetingTypeFormComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.getMeetingTypeGroup();
        }
      })
      .catch(() => {});
  }

  // Khởi tạo các bảng theo logic customer-detail
  initEmployeeDetailTable(): void {
    if (!this.tb_EmployeeDetailTableElement?.nativeElement) {
      console.warn('tb_EmployeeDetailTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_EmployeeDetailTable) {
      this.tb_EmployeeDetailTable.destroy();
    }

    this.tb_EmployeeDetailTable = new Tabulator(
      this.tb_EmployeeDetailTableElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.employeeDetailData,
        height: '100%',
        rowHeader: false,
        selectableRows: 1,
        layout: 'fitColumns',
        pagination: false,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen: true,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => {
              this.addNewEmployeeRow();
            },
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let fullName = data['FullName'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa nhân viên`,
                nzContent: `${fullName}?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.deletedIdsEmployeeDetail.includes(id))
                      this.deletedIdsEmployeeDetail.push(id);
                    this.tb_EmployeeDetailTable.deleteRow(cell.getRow());
                  } else {
                    this.tb_EmployeeDetailTable.deleteRow(cell.getRow());
                  }
                },
              });
            },
          },
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'Mã nhân viên',
            field: 'EmployeeID',

            headerHozAlign: 'center',
            frozen: true,
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
                return '<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.Code : val;
              return `<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedEmployee = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedEmployee) {
                row.update({
                  FullName: selectedEmployee.FullName,
                  Section: selectedEmployee.ChucVu,
                  UserTeamID: selectedEmployee.TeamID,
                });
              }
            },
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            headerHozAlign: 'center',
            editor: true,
            frozen: true,
          },
          {
            title: 'Team',
            field: 'UserTeamID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            editable: false, // 🔒 Không cho chỉnh sửa
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
                return '<div class="d-flex justify-content-between align-items-center" style="width: 100% !important;"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const userteam = this.userTeamOptions.find(
                (p: any) => p.value === val
              );
              const userTeamName = userteam ? userteam.Name : val;
              return `<div class="d-flex justify-content-between align-items-center" style="width: 100% !important;"><p class="w-100 m-0">${userTeamName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
          },
          {
            title: 'Chức vụ',
            field: 'Section',
            headerHozAlign: 'center',
            editor: true,
          },
        ],
      }
    );
  }

  addNewEmployeeRow(): void {
    const newRow = {
      ID: null,
      EmployeeID: 0,
      FullName: '',
      UserTeamID: '',
      Section: '',
    };
    this.tb_EmployeeDetailTable.addRow(newRow);
  }

  initCustomerDetailTable(): void {
    if (!this.tb_CustomerDetailTableElement?.nativeElement) {
      console.warn('tb_CustomerDetailTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_CustomerDetailTable) {
      this.tb_CustomerDetailTable.destroy();
    }

    this.tb_CustomerDetailTable = new Tabulator(
      this.tb_CustomerDetailTableElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.customerDetailData,
        height: '100%',
        rowHeader: false,
        selectableRows: 1,
        layout: 'fitColumns',
        pagination: false,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen: true,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => {
              this.addNewCustomerRow();
            },
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let fullName = data['FullName'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa khách hàng`,
                nzContent: `${fullName}?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.deletedIdsCustomerDetail.includes(id))
                      this.deletedIdsCustomerDetail.push(id);
                    this.tb_CustomerDetailTable.deleteRow(cell.getRow());
                  } else {
                    this.tb_CustomerDetailTable.deleteRow(cell.getRow());
                  }
                },
              });
            },
          },
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'Tên khách hàng',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            editor: true,
            frozen: true,
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Email',
            field: 'EmailCustomer',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Địa chỉ',
            field: 'AddressCustomer',
            headerHozAlign: 'center',
            editor: true,
          },
        ],
      }
    );
  }

  addNewCustomerRow(): void {
    const newRow = {
      ID: null,
      FullName: '',
      PhoneNumber: '',
      EmailCustomer: '',
      AddressCustomer: '',
    };
    this.tb_CustomerDetailTable.addRow(newRow);
  }

  initEmployeeDetailContentTable(): void {
    if (!this.tb_EmployeeDetailContentTableElement?.nativeElement) {
      console.warn('tb_EmployeeDetailContentTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_EmployeeDetailContentTable) {
      this.tb_EmployeeDetailContentTable.destroy();
    }

    this.tb_EmployeeDetailContentTable = new Tabulator(
      this.tb_EmployeeDetailContentTableElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.employeeDetailContentData,
        height: '100%',
        rowHeader: false,
        selectableRows: 1,
        layout: 'fitDataStretch',
        pagination: false,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen: true,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => {
              this.addNewEmployeeContentRow();
            },
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa nội dung này không?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.deletedIdsEmployeeContent.includes(id))
                      this.deletedIdsEmployeeContent.push(id);
                    this.tb_EmployeeDetailContentTable.deleteRow(cell.getRow());
                  } else {
                    this.tb_EmployeeDetailContentTable.deleteRow(cell.getRow());
                  }
                },
              });
            },
          },
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'Nội dung',
            field: 'DetailContent',
            headerHozAlign: 'center',
            editor: true,
            formatter: 'textarea',
            width: 200,
          },
          {
            title: 'Kết quả',
            field: 'DetailResult',
            headerHozAlign: 'center',
            editor: true,
            formatter: 'textarea',
            width: 200,
          },
          {
            title: 'Mã nhân viên',
            field: 'EmployeeID',
            hozAlign: 'left',
            headerHozAlign: 'center',

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
                return '<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const employee = this.employeeOptions.find(
                (p: any) => p.value === val
              );
              const employeeName = employee ? employee.Code : val;
              return `<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              const row = cell.getRow();
              const newValue = cell.getValue();
              const selectedEmployee = this.employeeOptions.find(
                (p: any) => p.value === newValue
              );
              if (selectedEmployee) {
                row.update({
                  CustomerName: selectedEmployee.FullName,
                  PhoneNumber: selectedEmployee.SDTCaNhan || '',
                });
              }
            },
          },
          {
            title: 'Người phụ trách',
            field: 'CustomerName',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Kế hoạch',
            field: 'PlanDate',
            headerHozAlign: 'center',
            editor: 'date',
            editorParams: {
              format: 'yyyy-MM-dd',
            },
            formatter: 'datetime',
            formatterParams: {
              inputFormat: 'yyyy-MM-dd',
              outputFormat: 'dd/MM/yyyy',
            },
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            editor: true,
          },
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
                return '<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const projectproblem = this.projectProblemOptions.find(
                (p: any) => p.value === val
              );
              const projectProblemName = projectproblem
                ? projectproblem.ContentError
                : val;
              return `<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0">${projectProblemName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
          },
        ],
      }
    );
  }

  addNewEmployeeContentRow(): void {
    const newRow = {
      ID: null,
      DetailContent: '',
      DetailResult: '',
      EmployeeID: 0,
      CustomerName: '',
      PhoneNumber: '',
      PlanDate: null,
      Note: '',
      ProjectHistoryProblemID: null,
    };
    this.tb_EmployeeDetailContentTable.addRow(newRow);
  }

  initCustomerDetailContentTable(): void {
    if (!this.tb_CustomerDetailContentTableElement?.nativeElement) {
      console.warn('tb_CustomerDetailContentTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_CustomerDetailContentTable) {
      this.tb_CustomerDetailContentTable.destroy();
    }

    this.tb_CustomerDetailContentTable = new Tabulator(
      this.tb_CustomerDetailContentTableElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        data: this.customerDetailContentData,
        height: '100%',
        rowHeader: false,
        selectableRows: 1,
        layout: 'fitDataStretch',
        pagination: false,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen: true,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => {
              this.addNewCustomerContentRow();
            },
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa nội dung này không?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.deletedIdsCustomerContent.includes(id))
                      this.deletedIdsCustomerContent.push(id);
                    this.tb_CustomerDetailContentTable.deleteRow(cell.getRow());
                  } else {
                    this.tb_CustomerDetailContentTable.deleteRow(cell.getRow());
                  }
                },
              });
            },
          },
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'Nội dung',
            field: 'DetailContent',
            headerHozAlign: 'center',
            editor: true,
            formatter: 'textarea',
            width: 200,
          },
          {
            title: 'Kết quả',
            field: 'DetailResult',
            headerHozAlign: 'center',
            editor: true,
            formatter: 'textarea',
            width: 200,
          },
          {
            title: 'Họ tên',
            field: 'CustomerName',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Kế hoạch',
            field: 'PlanDate',
            headerHozAlign: 'center',
            editor: 'date',
            editorParams: {
              format: 'yyyy-MM-dd',
            },
            formatter: 'datetime',
            formatterParams: {
              inputFormat: 'yyyy-MM-dd',
              outputFormat: 'dd/MM/yyyy',
            },
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            editor: true,
          },
          {
            title: 'Phát sinh',
            field: 'ProjectHistoryProblemID',
            headerHozAlign: 'center',
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
                return '<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const projectproblem = this.projectProblemOptions.find(
                (p: any) => p.value === val
              );
              const projectProblemName = projectproblem
                ? projectproblem.ContentError
                : val;
              return `<div class="d-flex justify-content-between align-items-center" style="width: 100%;"><p class="w-100 m-0">${projectProblemName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
          },
        ],
      }
    );
  }

  addNewCustomerContentRow(): void {
    const newRow = {
      ID: null,
      DetailContent: '',
      DetailResult: '',
      CustomerName: '',
      PhoneNumber: '',
      PlanDate: null,
      Note: '',
      ProjectHistoryProblemID: null,
      EmployeeID: -1,
    };
    this.tb_CustomerDetailContentTable.addRow(newRow);
  }

  initFileTable(): void {
    if (!this.tb_FileTableElement?.nativeElement) {
      console.warn('tb_FileTableElement chưa sẵn sàng');
      return;
    }

    if (this.tb_FileTable) {
      this.tb_FileTable.destroy();
    }

    this.tb_FileTable = new Tabulator(this.tb_FileTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.fileDatas,
      height: '100%',
      rowHeader: false,
      selectableRows: 1,
      layout: 'fitColumns',
      pagination: false,
      placeholder: 'Chưa có file đính kèm. Click nút + để thêm.',
      columns: [
        {
          title: '',
          field: 'actions',
          hozAlign: 'center',
          width: 40,
          frozen: true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm file"></i></div>`,
          headerClick: () => {
            this.openFileSelector();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('fas')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa file này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();
                  const id = rowData['ID'];

                  // Tìm và xóa trong fileDatas
                  const index = this.fileDatas.findIndex(
                    (f) =>
                      f['FileName'] === rowData['FileName'] &&
                      f['ServerPath'] === rowData['ServerPath'] &&
                      f['ID'] === rowData['ID']
                  );

                  if (index > -1) {
                    const deletedFile = this.fileDatas[index];
                    if (deletedFile['ID']) {
                      this.deletedFile.push(deletedFile['ID']);
                    }
                    this.fileDatas.splice(index, 1);
                  }

                  row.delete();
                },
              });
            }
          },
        },
        {
          title: 'Tên file',
          field: 'FileName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: false as any,
        },
      ],
    });
  }

  openFileSelector() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        const newFile = {
          FileName: file.name,
          OriginPath: file.name,
          File: file,
        };

        this.fileDatas.push(newFile);
        // Không cần gọi addRow() vì reactiveData: true sẽ tự động cập nhật bảng
      });
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  getSubPath(): string {
    if (
      !this.selectedProject.ProjectCode ||
      !this.selectedProject.CreatedDate
    ) {
      return '';
    }
    const year = new Date(this.selectedProject.CreatedDate).getFullYear();
    return `${year}\\${this.selectedProject.ProjectCode}\\TaiLieuChung\\BienBanCuocHop`;
  }

  openFileExplorerForRow(row: RowComponent) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = false;
    fileInput.style.display = 'none';

    const cleanup = () => {
      if (fileInput.parentNode) {
        fileInput.parentNode.removeChild(fileInput);
      }
    };

    const handleFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (!files || files.length === 0) {
        cleanup();
        return;
      }

      const file = files[0];
      const fileName = file.name;

      // 1. Cập nhật dữ liệu trong Tabulator row
      row.update({
        FileName: fileName,
        File: file,
        // Không cần gán ID, OriginPath, ServerPath ở đây nếu chưa có
      });

      // 2. Lấy dữ liệu hiện tại của row
      const rowData = row.getData();

      // 3. Tìm index trong this.fileDatas (dùng findIndex để tránh lỗi reference)
      const index = this.fileDatas.findIndex(
        (f) =>
          f['ID'] === rowData['ID'] &&
          f['FileName'] === rowData['FileName'] &&
          f['ServerPath'] === rowData['ServerPath']
      );

      if (index > -1) {
        // 4. Cập nhật trong mảng chính (giữ lại các trường cũ)
        this.fileDatas[index] = {
          ...this.fileDatas[index],
          FileName: fileName,
          OriginPath: fileName, // OriginPath = tên file gốc
          File: file, // File object mới
          // ServerPath: giữ nguyên (sẽ có sau khi upload)
        };
      } else {
      }

      cleanup();
    };

    fileInput.addEventListener('change', handleFileChange);

    // Xử lý khi người dùng hủy (click ngoài)
    fileInput.addEventListener('cancel', cleanup);

    // Thêm vào DOM và kích hoạt click
    document.body.appendChild(fileInput);
    fileInput.click();

    // Dọn dẹp sau 5 phút (tránh rò rỉ)
    setTimeout(cleanup, 300_000);
  }
}
