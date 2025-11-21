import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FactoryVisitRegistrationService } from './factory-visit-registration.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { AppUserService } from '../../../services/app-user.service';
import { IUser } from '../../../models/user.interface';
import { DisablePermissionDirective } from '../../../directives/disable-permission.directive';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateTime } from 'luxon';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-factory-visit-registration',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzModalModule,
    NzFormModule,
    NzSplitterModule,
    NzTabsModule,
    NzCheckboxModule,
    DisablePermissionDirective,
    HasPermissionDirective
  ],
  templateUrl: './factory-visit-registration.component.html',
  styleUrl: './factory-visit-registration.component.css',
  //encapsulation: ViewEncapsulation.None,
})
export class FactoryVisitRegistrationComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('registrationTable', { static: false })
  registrationTableRef!: ElementRef;
  @ViewChild('participantTable', { static: false })
  participantTableRef!: ElementRef;
  @ViewChild('detailTable', { static: false }) detailTableRef!: ElementRef;
  //   @ViewChild('registration-table') calendarRef!: FullCalendarComponent;

  registrationTable!: Tabulator;
  participantTable!: Tabulator;
  detailTable!: Tabulator;

  //   visitFactory: any;

  visitFactory = {
    // id: undefined,
    registrationDate: null,
    startTime: null,
    endTime: null,
    purpose: String,
    notes: String,
    fullName: String,
    guestCompany: String,
    VisitGuestTypeName: String,
    numberOfPeople: Number,
  };

  searchForm = {
    fromDate: '',
    toDate: '',
    personInCharge: '',
    keyword: '',
  };

  registrationForm = {
    id: undefined,
    registrationDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    notes: '',
    registeringEmployee: '',
    guestCompany: '',
    guestType: '',
    numberOfPeople: 1,
    informationReceived: false,
    approver: '',
  };

  registrationDetails: Array<{
    id?: number;
    employeeId: string;
    fullName: string;
    company: string;
    position: string;
    phoneNumber: string;
    email: string;
  }> = [];

  participantForm = {
    id: undefined,
    registrationId: 0,
    employeeCode: '',
    fullName: '',
    company: '',
    position: '',
    phoneNumber: '',
    email: '',
  };

  registrations: any[] = [];
  participants: any[] = [];
  selectedRegistration: any = null;
  selectedParticipant: any = null;
  selectedDetailIds: number[] = [];
  calendar!: Calendar;

  private extractNumericId(obj: any): number | null {
    if (!obj) return null;
    const raw = obj.id ?? obj.Id ?? obj.ID ?? obj['Id'] ?? obj['ID'];
    const asNum = Number(raw);
    return Number.isNaN(asNum) ? null : asNum;
  }

  isRegistrationModalVisible = false;
  isParticipantModalVisible = false;
  isEditMode = false;

  guestTypes: Array<{ id: number; name: string }> = [];

  employees: Array<{
    id: number;
    code: string;
    FullName: string;
    departmentName: string | null;
  }> = [];

  employeesByDepartment: Array<{
    department: string;
    employees: Array<{
      id: number;
      code: string;
      FullName: string;
      displayName: string;
    }>;
  }> = [];

  // date-picker view models for 24h formatted inputs
  startPickerModel: Date | null = null;
  endPickerModel: Date | null = null;

  currentUser: IUser | null = null;

  employeeID: any = '92';
  approverID: any = '558';

  constructor(
    private factoryVisitService: FactoryVisitRegistrationService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private userService: AppUserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadEmployees();
    this.loadGuestTypes();
    this.currentUser = this.userService.currentUser;
    this.employeeID = this.userService.currentUser?.EmployeeID.toString();
  }

  ngAfterViewInit(): void {
    // this.initTables();
    this.initCalendar();
    this.initDetailTable();
  }

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  initTables(): void {
    const regTableOptions: any = {
      data: this.registrations,
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitColumns',
      //   height: 1000,
      //   selectable: 1,
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 40,
        },
        { title: 'ID', field: 'id', width: 60, visible: false },
        {
          title: 'Đã nhận thông tin',
          field: 'informationReceived',
          width: 150,
          //   formatter: (cell: any) => (cell.getValue() ? 'X' : ''),
          formatter: 'tickCross',
          hozAlign: 'center',
        },
        {
          title: 'Ngày đăng ký',
          field: 'registrationDate',
          width: 130,
          formatter: (cell: any) => this.formatDate(cell.getValue(), false),
          hozAlign: 'center',
        },
        {
          title: 'Thời gian bắt đầu',
          field: 'startTime',
          width: 170,
          formatter: (cell: any) => this.formatDate(cell.getValue(), true),
          hozAlign: 'center',
        },
        {
          title: 'Thời gian kết thúc',
          field: 'endTime',
          width: 170,
          formatter: (cell: any) => this.formatDate(cell.getValue(), true),
          hozAlign: 'center',
        },
        {
          title: 'Mục đích',
          field: 'purpose',
          width: 200,
          formatter: 'textarea',
        },
        { title: 'Ghi chú', field: 'notes', width: 150, formatter: 'textarea' },
        {
          title: 'Nhân viên đăng ký',
          field: 'registeringEmployeeName',
          width: 180,
          formatter: 'textarea',
        },
        {
          title: 'Công ty/đơn vị khách',
          field: 'guestCompany',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Loại khách',
          field: 'guestTypeName',
          width: 150,
          formatter: 'textarea',
        },
        { title: 'Số người', field: 'numberOfPeople', width: 100 },
        {
          title: 'Người duyệt',
          field: 'approverName',
          width: 180,
          formatter: 'textarea',
        },
      ],
    };
    this.registrationTable = new Tabulator(
      this.registrationTableRef.nativeElement,
      regTableOptions
    );

    this.registrationTable.on('rowSelected', () => {
      try {
        const rows: any[] =
          (this.registrationTable as any).getSelectedRows?.() || [];
        if (rows.length > 1) {
          rows.slice(0, -1).forEach((r: any) => r?.deselect?.());
        }
      } catch {}
    });

    this.registrationTable.on('rowClick', (e: any, row: any) => {
      this.selectRegistration(row.getData());
    });

    this.registrationTable.on('rowSelectionChanged', (data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        this.selectRegistration(data[0]);
      } else {
        this.selectedRegistration = null;
        this.participants = [];
        if (this.participantTable) {
          this.participantTable.setData([]);
        }
      }
    });

    this.detailTable = new Tabulator(this.detailTableRef.nativeElement, {
      data: [],
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitColumns',
      //   height: 900,
      //   selectable: true,
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 40,
        },
        { title: 'ID', field: 'ID', width: 70, visible: false },
        {
          title: 'Họ và tên',
          field: 'fullName',
          width: 180,
          formatter: 'textarea',
        },
        {
          title: 'Công ty/đơn vị',
          field: 'company',
          width: 180,
          formatter: 'textarea',
        },
        {
          title: 'Chức vụ',
          field: 'position',
          width: 140,
          formatter: 'textarea',
        },
        { title: 'Số điện thoại', field: 'phoneNumber', width: 140 },
        { title: 'Email', field: 'email', width: 200 },
      ],
    } as any);

    this.detailTable.on('rowClick', (e: any, row: any) => {
      this.selectedParticipant = row.getData();
    });

    this.detailTable.on('rowSelectionChanged', (data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        this.selectedParticipant = data[0];
        this.selectedDetailIds = data
          .map((d: any) => this.extractNumericId(d))
          .filter((id: any) => id !== null) as number[];
      } else {
        this.selectedParticipant = null;
        this.selectedDetailIds = [];
      }
    });

    this.detailTable.on('rowSelected', (row: any) => {
      const id = this.extractNumericId(row?.getData?.());

      if (id !== null && !this.selectedDetailIds.includes(id)) {
        this.selectedDetailIds = [...this.selectedDetailIds, id];
      }
    });
    this.detailTable.on('rowDeselected', (row: any) => {
      const id = this.extractNumericId(row?.getData?.());

      if (id !== null) {
        this.selectedDetailIds = this.selectedDetailIds.filter((x) => x !== id);
      }
    });
  }

  loadData(): void {
    this.factoryVisitService.getRegistrations().subscribe({
      next: (data) => {
        console.log('loadData:', data);
        this.registrations = data;
        this.updateRegistrationTable();
      },
      error: () => {},
    });
  }

  loadEmployees(): void {
    this.factoryVisitService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data || [];
        this.groupEmployeesByDepartment();
        this.updateRegistrationTable();
      },
      error: () => {},
    });
  }

  private groupEmployeesByDepartment(): void {
    const departmentMap = new Map<
      string,
      Array<{ id: number; code: string; FullName: string; displayName: string }>
    >();

    this.employees.forEach((emp) => {
      const department = emp.departmentName || 'Chưa phân loại';
      const displayName = `${emp.code} - ${emp.FullName}`;

      if (!departmentMap.has(department)) {
        departmentMap.set(department, []);
      }

      departmentMap.get(department)!.push({
        id: emp.id,
        code: emp.code,
        FullName: emp.FullName,
        displayName: displayName,
      });
    });

    this.employeesByDepartment = Array.from(departmentMap.entries())
      .map(([department, employees]) => ({
        department,
        employees: employees.sort((a, b) =>
          a.FullName.localeCompare(b.FullName)
        ),
      }))
      .sort((a, b) => a.department.localeCompare(b.department));
  }

  loadGuestTypes(): void {
    this.factoryVisitService.getGuestTypes().subscribe({
      next: (data) => {
        this.guestTypes = data || [];
        this.updateRegistrationTable();
      },
      error: () => {},
    });
  }

  onEmployeeCodeChange(): void {
    const raw = (this.participantForm.employeeCode || '').trim();
    if (!raw) return;
    const id = Number(raw);
    if (Number.isNaN(id)) return;
    const found = this.employees.find((e) => e.id === id);
    if (found) this.participantForm.fullName = found.FullName || '';
  }

  selectRegistration(registration: any): void {
    this.selectedRegistration = registration;
    this.selectedParticipant = null;
    this.loadParticipants(registration.id);
    this.loadVisitDetails(registration.id);
  }

  loadParticipants(registrationId: number): void {
    this.factoryVisitService.getParticipants(registrationId).subscribe({
      next: (data) => {
        this.participants = data;
        if (this.participantTable) {
          this.participantTable.setData(data);
        }
      },
      error: () => {},
    });
  }

  loadVisitDetails(registrationId: number): void {
    this.factoryVisitService.getParticipants(registrationId).subscribe({
      next: (data) => {
        const enriched = (data || []).map((d: any) => ({
          ...d,
          createdAt: d.createdAt || '',
        }));
        if (this.detailTable) {
          this.detailTable.setData(enriched);
        }
      },
      error: () => {},
    });
  }

  search(): void {
    this.factoryVisitService.searchRegistrations(this.searchForm).subscribe({
      next: (data) => {
        console.log('factoryVisitService:', data);
        this.registrations = data;
        this.updateRegistrationTable();
      },
      error: () => {},
    });
  }

  resetSearch(): void {
    this.searchForm = {
      fromDate: '',
      toDate: '',
      personInCharge: '',
      keyword: '',
    };
    this.loadData();
  }

  openRegistrationModal(): void {
    this.isEditMode = false;
    if (!this.guestTypes || this.guestTypes.length === 0) {
      this.loadGuestTypes();
    }
    this.registrationForm = {
      id: undefined,
      registrationDate: new Date().toISOString().slice(0, 10),
      startTime: '',
      endTime: '',
      purpose: '',
      notes: '',
      registeringEmployee: '',
      guestCompany: '',
      guestType: '',
      numberOfPeople: 1,
      informationReceived: false,
      approver: '',
    };
    // sync pickers from form (if any)
    this.startPickerModel = this.registrationForm.startTime
      ? new Date(this.registrationForm.startTime)
      : null;
    this.endPickerModel = this.registrationForm.endTime
      ? new Date(this.registrationForm.endTime)
      : null;
    this.registrationDetails = [
      {
        id: 0,
        employeeId: '',
        fullName: '',
        company: '',
        position: '',
        phoneNumber: '',
        email: '',
      },
    ];
    // Chọn mặc định loại khách đầu tiên nếu có
    if (this.guestTypes && this.guestTypes.length > 0) {
      this.registrationForm.guestType = String(this.guestTypes[0].id);
    }
    this.isRegistrationModalVisible = true;
  }

  onNumberOfPeopleChange(): void {
    const targetLength = Math.max(
      1,
      Number(this.registrationForm.numberOfPeople) || 1
    );
    while (this.registrationDetails.length < targetLength) {
      this.registrationDetails.push({
        id: 0,
        employeeId: '',
        fullName: '',
        company: '',
        position: '',
        phoneNumber: '',
        email: '',
      });
    }
    while (this.registrationDetails.length > targetLength) {
      this.registrationDetails.pop();
    }
  }

  increasePeople(): void {
    this.registrationForm.numberOfPeople = (Number(
      this.registrationForm.numberOfPeople || 1
    ) + 1) as any;
    this.onNumberOfPeopleChange();
  }

  decreasePeople(): void {
    const next = Math.max(
      1,
      Number(this.registrationForm.numberOfPeople || 1) - 1
    );
    this.registrationForm.numberOfPeople = next as any;
    this.onNumberOfPeopleChange();
  }

  removeDetailRow(index: number): void {
    if (this.registrationDetails.length <= 1) return;
    this.registrationDetails.splice(index, 1);
    this.registrationForm.numberOfPeople = Math.max(
      1,
      this.registrationDetails.length
    ) as any;
  }

  onDetailEmployeeIdChange(
    row: { employeeId: string; fullName: string },
    index: number
  ): void {
    const raw = (row.employeeId || '').trim();
    const id = Number(raw);
    if (!raw || Number.isNaN(id)) return;
    const found = this.employees.find((e) => e.id === id);
    if (found) {
      this.registrationDetails[index].fullName = found.FullName || '';
    }
  }

  onDetailEmployeeSelect(value: string, index: number): void {
    const id = Number(value);
    if (Number.isNaN(id)) {
      this.registrationDetails[index].employeeId = '0';
      return;
    }
    const found: any = (this.employees as any[]).find((e) => e.id === id);
    this.registrationDetails[index].employeeId = String(id);
    this.registrationDetails[index].fullName = found
      ? found.FullName || ''
      : '';
    // auto-fill theo API mới
    this.registrationDetails[index].company = 'RTC';
    if (found) {
      if (found.phone)
        this.registrationDetails[index].phoneNumber = found.phone;
      if (found.email) this.registrationDetails[index].email = found.email;
      if (found.position)
        this.registrationDetails[index].position = found.position;
      // Debug: log giá trị chọn và dữ liệu điền
      // Lưu ý: chỉ dùng cho kiểm tra, có thể xóa sau khi ổn định
      console.log('Selected employee', found);
      console.log('Autofilled ->', {
        fullName: this.registrationDetails[index].fullName,
        phoneNumber: this.registrationDetails[index].phoneNumber,
        email: this.registrationDetails[index].email,
        position: this.registrationDetails[index].position,
      });
      // Force UI update in case deep changes aren't detected
      this.registrationDetails[index] = { ...this.registrationDetails[index] };
      this.cdr.detectChanges();
    }
  }

  editRegistration(): void {
    if (!this.selectedRegistration) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một đăng ký để chỉnh sửa'
      );
      return;
    }
    this.isEditMode = true;
    const sel = this.selectedRegistration;
    const toDateTimeLocal = (value: string) => {
      if (!value) return '';
      try {
        const d = new Date(value);
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      } catch {
        return value;
      }
    };

    this.registrationForm = {
      id: sel.id,
      registrationDate:
        sel.registrationDate ||
        (sel.startTime ? sel.startTime.slice(0, 10) : ''),
      startTime: toDateTimeLocal(sel.startTime || ''),
      endTime: toDateTimeLocal(sel.endTime || ''),
      purpose: sel.purpose || '',
      notes: sel.notes || '',
      registeringEmployee: sel.registeringEmployee
        ? String(sel.registeringEmployee)
        : '',
      guestCompany: sel.guestCompany || '',
      guestType:
        sel.guestType !== undefined && sel.guestType !== null
          ? String(sel.guestType)
          : '',
      numberOfPeople: sel.numberOfPeople || 1,
      informationReceived: !!sel.informationReceived,
      approver: sel.approver ? String(sel.approver) : '',
    };
    // sync pickers from form
    this.startPickerModel = this.registrationForm.startTime
      ? new Date(this.registrationForm.startTime)
      : null;
    this.endPickerModel = this.registrationForm.endTime
      ? new Date(this.registrationForm.endTime)
      : null;
    this.factoryVisitService.getParticipants(sel.id).subscribe({
      next: (data) => {
        const details = (data || []).map((d: any) => ({
          id: d.id,
          employeeId: d.employeeCode || '',
          fullName: d.fullName || '',
          company: d.company || '',
          position: d.position || '',
          phoneNumber: d.phoneNumber || '',
          email: d.email || '',
        }));
        this.registrationDetails =
          details.length > 0
            ? details
            : [
                {
                  id: 0,
                  employeeId: '',
                  fullName: '',
                  company: '',
                  position: '',
                  phoneNumber: '',
                  email: '',
                },
              ];
        this.registrationForm.numberOfPeople = Math.max(
          1,
          this.registrationDetails.length
        );
        this.isRegistrationModalVisible = true;
      },
      error: () => {
        this.registrationDetails = [
          {
            id: 0,
            employeeId: '',
            fullName: '',
            company: '',
            position: '',
            phoneNumber: '',
            email: '',
          },
        ];
        this.registrationForm.numberOfPeople = 1;
        this.isRegistrationModalVisible = true;
      },
    });
  }

  saveRegistration(): void {
    const clientErrors = this.validateRegistrationForm();
    if (clientErrors.length > 0) {
      clientErrors.forEach((msg) =>
        this.notification.error(NOTIFICATION_TITLE.error, msg)
      );
      return;
    }
    if (this.isEditMode) {
      const detailsPayload = (this.registrationDetails || []).map((d) => ({
        id: d.id || 0,
        registrationId: this.registrationForm.id || 0,
        employeeCode: d.employeeId || '',
        fullName: d.fullName,
        company: d.company,
        position: d.position,
        phoneNumber: d.phoneNumber,
        email: d.email,
      }));
      this.factoryVisitService
        .updateRegistration(this.registrationForm, detailsPayload)
        .subscribe({
          next: () => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Cập nhật đăng ký thành công'
            );
            this.isRegistrationModalVisible = false;
            this.loadData();
          },
          error: (error) => {
            this.handleValidationError(error, 'Cập nhật đăng ký');
          },
        });
    } else {
      const detailsPayload = (this.registrationDetails || []).map((d) => ({
        id: d.id || 0,
        registrationId: 0,
        employeeCode: '',
        fullName: d.fullName,
        company: d.company,
        position: d.position,
        phoneNumber: d.phoneNumber,
        email: d.email,
      }));
      this.factoryVisitService
        .createRegistration(this.registrationForm, detailsPayload)
        .subscribe({
          next: (newRegistration) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Tạo đăng ký thành công');
            this.isRegistrationModalVisible = false;
            this.loadData();

            this.sendNotificationEmail(newRegistration);
          },
          error: (error) => {
            this.handleValidationError(error, 'Tạo đăng ký');
          },
        });
    }
  }

  private handleValidationError(error: any, action: string): void {
    if (error.error && error.error.title) {
      // Error với title từ backend
      this.notification.error(NOTIFICATION_TITLE.error, error.error.title);
    } else if (error.error && error.error.message) {
      // Error với message từ backend
      this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
    } else if (error.status) {
      // HTTP status errors
      let message = '';
      if (error.status === 400) {
        // Không hiển thị thông báo chung chung cho 400
        return;
      }
      switch (error.status) {
        case 401:
          message = 'Không có quyền truy cập';
          break;
        case 403:
          message = 'Bị từ chối truy cập';
          break;
        case 404:
          message = 'Không tìm thấy dữ liệu';
          break;
        case 500:
          message = 'Lỗi máy chủ';
          break;
        default:
          message = `Lỗi HTTP ${error.status}`;
      }
      this.notification.error(NOTIFICATION_TITLE.error, message);
    } else if (error.message) {
      this.notification.error(NOTIFICATION_TITLE.error, error.message);
    } else {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Có lỗi xảy ra khi ${action.toLowerCase()}`
      );
    }
  }

  private sendNotificationEmail(registration: any): void {
    const participants = this.participants.filter(
      (p) => p.registrationId === registration.id
    );

    this.factoryVisitService
      .sendRegistrationNotification(registration, participants)
      .subscribe({
        next: () => {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Email thông báo đã được gửi đến quản lý nhà máy'
          );
        },
        error: () => {},
      });
  }

  deleteRegistration(): void {
    if (!this.selectedRegistration) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đăng ký để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa đăng ký này?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.factoryVisitService
          .deleteRegistration(this.selectedRegistration.id)
          .subscribe({
            next: () => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa đăng ký thành công');
              this.loadData();
              this.selectedRegistration = null;
              this.participants = [];
              if (this.participantTable) {
                this.participantTable.setData([]);
              }
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa đăng ký');
            },
          });
      },
    });
  }

  approveRegistration(): void {
    if (!this.selectedRegistration) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một đăng ký để duyệt'
      );
      return;
    }

    const isApproved = this.selectedRegistration.informationReceived;
    const actionText = isApproved ? 'hủy duyệt' : 'duyệt';
    const confirmText = isApproved ? 'Hủy duyệt' : 'Duyệt';

    this.modal.confirm({
      nzTitle: `Xác nhận ${actionText}`,
      nzContent: `Bạn có chắc chắn muốn ${actionText} đăng ký này?`,
      nzOkText: confirmText,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updatedRegistration: any = {
          id: this.selectedRegistration.id,
          informationReceived: !isApproved,
        };

        this.factoryVisitService
          .updateRegistration(updatedRegistration, [])
          .subscribe({
            next: () => {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `${confirmText} đăng ký thành công`
              );
              this.loadData();
              this.selectedRegistration = updatedRegistration;
            },
            error: (error) => {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Có lỗi xảy ra khi ${actionText} đăng ký`
              );
            },
          });
      },
    });
  }

  openParticipantModal(): void {
    if (!this.selectedRegistration) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đăng ký trước');
      return;
    }
    this.selectedParticipant = null;
    this.participantForm = {
      id: undefined,
      registrationId: this.selectedRegistration.id,
      employeeCode: '',
      fullName: '',
      company: '',
      position: '',
      phoneNumber: '',
      email: '',
    };
    this.isParticipantModalVisible = true;
  }

  saveParticipant(): void {
    // Chuẩn hóa EmployeeID từ mã nhân viên trước khi lưu
    const payload = { ...this.participantForm };
    const normalizedId = this.normalizeEmployeeIdFromCode(payload.employeeCode);
    if (normalizedId !== null) {
      payload.employeeCode = String(normalizedId);
      // Nếu chưa nhập tên, tự động điền theo danh sách nhân viên
      if (!payload.fullName) {
        const found = this.employees.find((e) => e.id === normalizedId);
        if (found) payload.fullName = found.FullName || '';
      }
    }

    this.factoryVisitService.createParticipant(payload).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success,
          'Thêm người tham gia thành công'
        );
        this.isParticipantModalVisible = false;
        this.selectedParticipant = null;
        this.loadParticipants(this.selectedRegistration.id);
        this.loadVisitDetails(this.selectedRegistration.id);
      },
      error: (error) => {
        this.handleValidationError(error, 'Thêm người tham gia');
      },
    });
  }

  deleteParticipant(): void {
    // Lấy danh sách ID đã chọn trong bảng chi tiết (nếu có)
    let selectedIds: number[] = [...(this.selectedDetailIds || [])];
    try {
      if (this.detailTable) {
        // Try by data API
        const selectedData =
          (this.detailTable as any).getSelectedData?.() || [];
        const fromData = (selectedData as any[])
          .map((d: any) => this.extractNumericId(d))
          .filter((id: any) => id !== null) as number[];
        if (fromData.length > 0) selectedIds = fromData;
        // Fallback by row API if data API returns empty
        if (selectedIds.length === 0) {
          const selectedRows =
            (this.detailTable as any).getSelectedRows?.() || [];
          selectedIds = (selectedRows as any[])
            .map((r: any) => this.extractNumericId(r?.getData?.()))
            .filter((id: any) => id !== null) as number[];
        }
      }
    } catch {}

    if (selectedIds.length === 0) {
      const singleId = this.extractNumericId(this.selectedParticipant);
      if (singleId !== null) selectedIds = [singleId];
    }

    if (selectedIds.length === 0) {
      this.notification.warning(
       NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một người tham gia để xóa'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedIds.length} người tham gia?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.factoryVisitService.deleteParticipants(selectedIds).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success,
              'Xóa người tham gia thành công'
            );
            this.loadParticipants(this.selectedRegistration.id);
            this.loadVisitDetails(this.selectedRegistration.id);
            this.selectedParticipant = null;
          },
          error: () => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Có lỗi xảy ra khi xóa người tham gia'
            );
          },
        });
      },
    });
  }

  private normalizeEmployeeIdFromCode(input: string): number | null {
    const value = (input || '').trim();
    if (!value) return null;
    // Chỉ chấp nhận EmployeeID dạng số
    const asNumber = Number(value);
    if (Number.isNaN(asNumber) || !/^\d+$/.test(value)) return null;
    // Xác thực tồn tại trong danh sách (nếu có dữ liệu)
    if (this.employees && this.employees.length > 0) {
      return this.employees.some((e) => e.id === asNumber) ? asNumber : null;
    }
    return asNumber;
  }

  private getEmployeeNameById(id: number | null | undefined): string {
    if (!id && id !== 0) return '';
    const found = this.employees.find((e) => e.id === id);
    return found ? found.FullName || '' : '';
  }

  private getEmployeeDisplayNameById(id: number | null | undefined): string {
    // console.log('id:', id);
    if (!id && id !== 0) return '';
    const found = this.employees.find((e) => e.id === id);
    if (found) {
      return `${found.code} - ${found.FullName}`;
    }
    return '';
  }

  private mapRegistrationsWithEmployeeNames(list: any[]): any[] {
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      ...item,
      registeringEmployeeName: this.getEmployeeDisplayNameById(
        Number(item.registeringEmployee) || null
      ),
      approverName: this.getEmployeeDisplayNameById(
        item.approver ? Number(item.approver) : null
      ),
      guestTypeName: this.getGuestTypeNameById(Number(item.guestType)),
    }));
  }

  private updateRegistrationTable(): void {
    const dataForTable = this.mapRegistrationsWithEmployeeNames(
      this.registrations || []
    );

    this.updateCalendarEvents(dataForTable);
    // if (this.registrationTable) {
    //   this.registrationTable.setData(dataForTable);
    // }
  }

  private getGuestTypeNameById(id: string | number | null | undefined): string {
    if (!id && id !== 0) return '';
    const numericId = typeof id === 'string' ? Number(id) : id;
    const found = this.guestTypes.find((g) => g.id === numericId);
    return found ? found.name || '' : '';
  }

  private formatDate(value: any, includeTime: boolean): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    if (!includeTime) {
      return `${dd}/${mm}/${yyyy}`;
    }
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  onStartTimeChange(value: Date | null): void {
    this.startPickerModel = value;
    if (!value) {
      this.registrationForm.startTime = '';
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = value.getFullYear();
    const mm = pad(value.getMonth() + 1);
    const dd = pad(value.getDate());
    const hh = pad(value.getHours());
    const mi = pad(value.getMinutes());
    this.registrationForm.startTime = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  onEndTimeChange(value: Date | null): void {
    this.endPickerModel = value;
    if (!value) {
      this.registrationForm.endTime = '';
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = value.getFullYear();
    const mm = pad(value.getMonth() + 1);
    const dd = pad(value.getDate());
    const hh = pad(value.getHours());
    const mi = pad(value.getMinutes());
    this.registrationForm.endTime = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  eventElements = new Map<string, HTMLElement>(); // key = eventId, value = element
  private initCalendar(): void {
    const el = this.registrationTableRef?.nativeElement;
    if (!el) return;
    this.calendar = new Calendar(el, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,dayGridDay',
      },
      locale: 'vi',
      height: 500,
      slotMinTime: '08:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      slotLabelFormat: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      },
      allDaySlot: false,
      dayMaxEvents: false,
      eventClick: (info: any) => {
        // console.log('this.calendar.getEvents():', this.calendar.getEvents());
        // console.log(info, typeof info);
        const id = Number(info.event.id);
        const found = (this.registrations || []).find(
          (r) => Number(r.id) === id
        );
        if (found) {
          this.selectRegistration(found);
          //   this.visitFactory = this.registrations.find((x) => x.id === id);
          let data = this.registrations.find((x) => x.id === id);
          this.visitFactory = {
            ...data,
            fullName: this.getEmployeeDisplayNameById(
              Number(data.registeringEmployee)
            ),
            registrationDate: new Date(data.registrationDate),
            endTime: new Date(data.endTime),
            startTime: new Date(data.startTime),
          };
          console.log(this.visitFactory);
        }

        this.eventElements.forEach((el) => (el.style.borderColor = ''));

        info.el.style.borderColor = 'red';
      },

      eventDidMount: (info: any) => {
        this.eventElements.set(info.event.id, info.el);
      },
    });
    this.calendar.render();
    this.updateCalendarEvents();
  }

  private initDetailTable(): void {
    this.detailTable = new Tabulator(this.detailTableRef.nativeElement, {
      data: [],
      layout: 'fitColumns',
      height: 900,
      selectable: true,
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerSort: false,
          width: 40,
        },
        { title: 'ID', field: 'ID', width: 70, visible: false },
        { title: 'Họ và tên', field: 'fullName', width: 180 },
        { title: 'Công ty/đơn vị', field: 'company', width: 180 },
        { title: 'Chức vụ', field: 'position', width: 140 },
        { title: 'Số điện thoại', field: 'phoneNumber', width: 140 },
        { title: 'Email', field: 'email', width: 200 },
      ],
    } as any);

    this.detailTable.on('rowClick', (e: any, row: any) => {
      this.selectedParticipant = row.getData();
    });

    this.detailTable.on('rowSelectionChanged', (data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        this.selectedParticipant = data[0];
        this.selectedDetailIds = data
          .map((d: any) => this.extractNumericId(d))
          .filter((id: any) => id !== null) as number[];
      } else {
        this.selectedParticipant = null;
        this.selectedDetailIds = [];
      }
    });

    this.detailTable.on('rowSelected', (row: any) => {
      const id = this.extractNumericId(row?.getData?.());

      if (id !== null && !this.selectedDetailIds.includes(id)) {
        this.selectedDetailIds = [...this.selectedDetailIds, id];
      }
    });
    this.detailTable.on('rowDeselected', (row: any) => {
      const id = this.extractNumericId(row?.getData?.());

      if (id !== null) {
        this.selectedDetailIds = this.selectedDetailIds.filter((x) => x !== id);
      }
    });
  }

  private updateCalendarEvents(mapped?: any[]): void {
    // console.log('mapped:', mapped);
    if (!this.calendar) return;
    const list =
      mapped ??
      this.mapRegistrationsWithEmployeeNames(this.registrations || []);

    // console.log(list);
    const events = (list || []).map((item) => {
      // Màu sắc theo trạng thái duyệt
      let backgroundColor = '#2b82e6ff'; // Chưa duyệt: đỏ
      let borderColor = '#2b82e6ff';

      if (item.informationReceived) {
        backgroundColor = '#27ae60'; // Đã duyệt: xanh lá
        borderColor = '#229954';
      }
      //   console.log('updateCalendarEvents:', item);
      return {
        id: String(item.id),
        title:
          item.guestCompany +
          ': ' +
          item.registeringEmployeeName +
          ':' +
          item.purpose,
        // ${ || ''}\n
        // ${ || ''}`,

        start: item.startTime || item.registrationDate,
        end: item.endTime || item.startTime,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        textColor: '#ffffff',
        extendedProps: { raw: item },
        // eventDidMount(info: any) {
        //   info.el.innerHTML = info.event.title;
        // },
      };
    });
    this.calendar.removeAllEvents();
    this.calendar.addEventSource(events);
  }

  closeDetailPanel(): void {
    this.selectedRegistration = null;
    this.selectedParticipant = null;
    this.selectedDetailIds = [];
    // Force calendar to resize after panel closes
    setTimeout(() => {
      if (this.calendar) {
        this.calendar.render();
      }
    }, 100);
  }

  //check validate
  private validateRegistrationForm(): string[] {
    const errors: string[] = [];
    const f = this.registrationForm;

    if (!f.registrationDate) errors.push('Vui lòng chọn ngày đăng ký');
    if (!f.startTime) errors.push('Vui lòng chọn thời gian bắt đầu');
    if (!f.endTime) errors.push('Vui lòng chọn thời gian kết thúc');
    if (!f.purpose || !f.purpose.trim()) errors.push('Vui lòng nhập mục đích');
    if (!f.guestCompany || !f.guestCompany.trim())
      errors.push('Vui lòng nhập công ty/đơn vị khách');
    if (!f.guestType || String(f.guestType).trim() === '')
      errors.push('Vui lòng chọn loại khách');

    // this.registrationDetails.forEach((d, idx) => {
    //   const rowNo = idx + 1;
    //   if (!d.fullName || !d.fullName.trim()) {
    //     errors.push(`Họ tên không được để trống (Thông tin người tham gia)`);
    //   }
    // });

    return errors;
  }
}
