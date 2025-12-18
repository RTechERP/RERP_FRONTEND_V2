import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { EmployeeNightShiftService } from '../employee-night-shift-service/employee-night-shift.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { EmployeeAttendanceService } from '../../employee-attendance/employee-attendance.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { EmployeeNightShiftSummaryComponent } from '../employee-night-shift-summary/employee-night-shift-summary.component';
import { EmployeeNightShiftFormComponent } from '../employee-night-shift-form/employee-night-shift-form.component';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
(window as any).luxon = { DateTime };

@Component({
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
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NgbModalModule,
    NzModalModule,
    HasPermissionDirective,
    NgbDropdownModule,
    NzDropDownModule,
  ],
  selector: 'app-employee-night-shift',
  templateUrl: './employee-night-shift.component.html',
  styleUrls: ['./employee-night-shift.component.css'],
})
export class EmployeeNightShiftComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private notification: NzNotificationService,
    private employeeNightShiftService: EmployeeNightShiftService,
    private modal: NzModalService,
    private employeeAttendanceService: EmployeeAttendanceService,
    private vehicleRepairService: VehicleRepairService
  ) { }

  nightShiftTable: Tabulator | null = null;
  isSearchVisible: boolean = false;

  // Master data
  departments: any[] = [];
  allEmployees: any[] = [];
  employees: any[] = [];

  // Filter params
  dateStart: Date = new Date();
  dateEnd: Date = new Date();
  employeeID: number = 0;
  departmentID: number = 0;
  isApproved: number | null = null;
  keyWord: string = '';

  private ngbModal = inject(NgbModal);
  
  // Debounce subjects
  private keywordSearchSubject = new Subject<string>();
  private filterChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Helper function để convert giá trị sang boolean
  private toBool(v: any): boolean {
    if (v === true || v === false) return v;
    const n = Number(v);
    if (!isNaN(n)) return n > 0;
    const s = String(v ?? '').toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }

  // Helper function để kiểm tra đã duyệt (giá trị = 1)
  private isApprovedValue(v: any): boolean {
    const n = Number(v);
    return n === 1;
  }

  ngOnInit() {
    // Set đầu tháng và cuối tháng làm mặc định
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();

    this.loadDepartments();
    this.loadEmployees();

    // Setup debounce cho keyword search
    this.keywordSearchSubject.pipe(
      debounceTime(500), // Đợi 500ms sau khi người dùng ngừng gõ
      distinctUntilChanged(), // Chỉ emit khi giá trị thay đổi
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.getNightShift();
    });

    // Setup debounce cho filter changes
    this.filterChangeSubject.pipe(
      debounceTime(300), // Đợi 300ms cho các filter khác
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.getNightShift();
    });
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  loadDepartments(): void {
    this.employeeAttendanceService.getDepartment().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.departments = res.data || [];
        console.log('Departments:', this.departments);
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể tải danh sách phòng ban'),
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0);
        this.allEmployees = all;

        const filtered =
          this.departmentID && this.departmentID > 0
            ? all.filter(
              (x: any) => Number(x.DepartmentID) === Number(this.departmentID)
            )
            : all;

        this.employees = this.employeeAttendanceService.createdDataGroup(filtered, 'DepartmentName');
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error.message || 'Không thể tải danh sách nhân viên'),
    });
  }

  onDepartmentChange(): void {
    this.employeeID = 0;
    this.loadEmployees();
    this.filterChangeSubject.next();
  }

  onEmployeeChange(): void {
    this.filterChangeSubject.next();
  }

  onIsApprovedChange(): void {
    this.filterChangeSubject.next();
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.keywordSearchSubject.next(value);
  }

  onDateRangeChange(): void {
    this.filterChangeSubject.next();
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  resetSearch(): void {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.employeeID = 0;
    this.departmentID = 0;
    this.isApproved = null;
    this.keyWord = '';
    this.loadEmployees();
    this.getNightShift();
  }

  private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getLastDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  getNightShift() {
    if (this.nightShiftTable) {
      this.nightShiftTable.replaceData();
    }
  }

  drawTable() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.nightShiftTable = new Tabulator('#dataTableNightShift', {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      ajaxURL: this.employeeNightShiftService.getEmployeeNightShiftAjax(),
      ajaxConfig: 'POST',
      groupBy: 'DepartmentName',
      groupHeader: (value: any, count: number, data: any, group: any) => {
        return `<strong>Phòng ban: ${value || 'Không xác định'}</strong> <span style="color: #666; margin-left: 10px;">(${count} bản ghi)</span>`;
      },
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          EmployeeID: this.employeeID || 0,
          DateStart: this.dateStart ? DateTime.fromJSDate(this.dateStart).startOf('day').toISO() : null,
          DateEnd: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).endOf('day').toISO() : null,
          IsApproved: this.isApproved || -1,
          DepartmentID: this.departmentID || 0,
          KeyWord: this.keyWord || '',
          Page: params.page || 1,
          Size: params.size || 50,
        };
        return this.employeeNightShiftService.getEmployeeNightShift(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.data.nightShiftdata || [],
          last_page: response.data.TotalPage?.[0]?.TotalPage || 1,
        };
      },
      columns: [
        { title: 'ID', field: 'ID', visible: false, frozen: true },
        {
          title: 'STT',
          formatter: 'rownum',
          width: 60,
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: !isMobile,
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          minWidth: 120,
          frozen: !isMobile,
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          minWidth: 200,
          frozen: !isMobile,
          formatter: 'textarea',
          bottomCalc: 'count',
        },
        {
          title: 'TBP duyệt',
          field: 'IsApprovedTBP',
          formatter: (cell: any) => {
            const value = cell.getValue();
            const numValue = value === null || value === undefined ? 0 : Number(value);
            return this.formatApprovalBadge(numValue);
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: !isMobile,
          width: 100,
        },
        {
          title: 'HR Duyệt',
          field: 'IsApprovedHR',
          formatter: (cell: any) => {
            const value = cell.getValue();
            const numValue = value === null || value === undefined ? 0 : Number(value);
            return this.formatApprovalBadge(numValue);
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: !isMobile,
          width: 100,
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          minWidth: 150,
          visible: false, // Ẩn cột vì đã hiển thị trong group header
        },
        {
          title: 'Bổ sung',
          field: 'IsProblem',
          formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
          ,
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 100,
        },

        {
          title: 'Ngày đăng ký',
          field: 'DateRegister',
          minWidth: 120,
          hozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            try {
              // Thử parse từ ISO string hoặc Date object
              let dt: DateTime | null = null;
              if (value instanceof Date) {
                dt = DateTime.fromJSDate(value);
              } else if (typeof value === 'string') {
                dt = DateTime.fromISO(value);
                if (!dt.isValid) {
                  dt = DateTime.fromSQL(value);
                }
              }
              return dt && dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
            } catch {
              return value;
            }
          },
        },

        {
          title: 'Số giờ',
          field: 'TotalHours',
          minWidth: 100,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? parseFloat(value).toFixed(2) : '0.00';
          },
        },

        // {
        //   title: 'Người duyệt',
        //   field: 'ApprovedBy',
        //   minWidth: 150,
        // },
        // {
        //   title: 'Ngày duyệt',
        //   field: 'ApprovedDate',
        //   minWidth: 120,
        //   hozAlign: 'center',
        //   formatter: 'datetime',
        //   formatterParams: { outputFormat: 'DD/MM/YYYY HH:mm' },
        // },
        {
          title: 'Địa điểm',
          field: 'Location',
          minWidth: 200,
          formatter: 'textarea',
        },
        {
          title: 'Lý do sửa',
          field: 'ReasonHREdit',
          minWidth: 200,
          formatter: 'textarea',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          minWidth: 200,
          formatter: 'textarea',
        },

      ],
    });

    this.nightShiftTable.on(
      'rowDblClick',
      (e: UIEvent, row: RowComponent) => {
        const selectedData = row.getData();
        // TODO: Mở form edit
        console.log('Selected night shift:', selectedData);
      }
    );
  }

  onAddNightShift() {
    const modalRef = this.ngbModal.open(EmployeeNightShiftFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.allEmployees = this.allEmployees;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNightShift();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onEditNightShift() {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa!');
      return;
    }

    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chỉ một bản ghi để sửa!');
      return;
    }

    const dataInput = selectedRows[0];
    const modalRef = this.ngbModal.open(EmployeeNightShiftFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = dataInput;
    modalRef.componentInstance.allEmployees = this.allEmployees;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNightShift();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  // TBP Duyệt
  onTBPApprove(): void {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateTBPApprove(listID, true);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.toBool(row.IsApprovedTBP);

        if (isApprovedTBP) {
          // Đã được TBP duyệt rồi, có thể duyệt lại hoặc bỏ qua
          listID.push(id);
        } else {
          // Chưa được TBP duyệt, vẫn có thể duyệt
          listID.push(id);
        }
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt danh sách nhân viên đã chọn (${listID.length} bản ghi) không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateTBPApprove(listID, true);
        }
      });
    }
  }

  // TBP Hủy duyệt
  onTBPCancel(): void {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateTBPApprove(listID, false);
        }
      });
    } else {
      // Nhiều dòng
      for (const row of selectedRows) {
        const id = row.ID;
        listID.push(id);
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn (${listID.length} bản ghi) không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateTBPApprove(listID, false);
        }
      });
    }
  }

  // HR Duyệt
  onHRApprove(): void {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';
      const isApprovedTBP = this.toBool(row.IsApprovedTBP);

      if (isApprovedTBP !== true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên <b>${fullName}</b> chưa được TBP duyệt!`);
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt/huỷ duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateHRApprove(listID, true);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.isApprovedValue(row.IsApprovedTBP);

        if (!isApprovedTBP) {
          isCheck = false;
          invalidNames.push(fullName);
        } else {
          listID.push(id);
        }
      }

      if (!isCheck) {
        const names = invalidNames.join(', ');
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên ${names} chưa được TBP duyệt!`);
        return;
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn duyệt/huỷ duyệt danh sách nhân viên đã chọn không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateHRApprove(listID, true);
        }
      });
    }
  }

  // HR Hủy duyệt
  onHRCancel(): void {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên muốn duyệt/huỷ duyệt!');
      return;
    }

    const listID: number[] = [];

    if (selectedRows.length === 1) {
      const row = selectedRows[0];
      const id = row.ID;
      const fullName = row.FullName || row.EmployeeName || 'Không xác định';
      const isApprovedTBP = this.toBool(row.IsApprovedTBP);

      if (isApprovedTBP !== true) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên <b>${fullName}</b> chưa được TBP duyệt!`);
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt nhân viên <b>${fullName}</b> không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          listID.push(id);
          this.updateHRApprove(listID, false);
        }
      });
    } else {
      // Nhiều dòng
      let isCheck = true;
      const invalidNames: string[] = [];

      for (const row of selectedRows) {
        const id = row.ID;
        const fullName = row.FullName || row.EmployeeName || 'Không xác định';
        const isApprovedTBP = this.isApprovedValue(row.IsApprovedTBP);

        if (!isApprovedTBP) {
          isCheck = false;
          invalidNames.push(fullName);
        } else {
          listID.push(id);
        }
      }

      if (!isCheck) {
        const names = invalidNames.join(', ');
        this.notification.warning(NOTIFICATION_TITLE.warning, `Nhân viên ${names} chưa được TBP duyệt!`);
        return;
      }

      if (listID.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có bản ghi hợp lệ để hủy duyệt!');
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận',
        nzContent: `Bạn có chắc muốn hủy duyệt danh sách nhân viên đã chọn không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.updateHRApprove(listID, false);
        }
      });
    }
  }

  // Update TBP Approve
  private updateTBPApprove(listID: number[], isApprove: boolean): void {
    if (listID.length === 0) return;

    // Lấy dữ liệu từ table để build payload
    const payload = listID.map(id => {
      const row = this.nightShiftTable?.getRows().find(r => r.getData()['ID'] === id);
      const rowData: any = row?.getData() || {};

      return {
        ID: id,
        EmployeeID: rowData['EmployeeID'],
        ApprovedTBP: rowData['ApprovedTBP'],
        DateRegister: rowData['DateRegister'],
        DateStart: rowData['DateStart'],
        DateEnd: rowData['DateEnd'],
        TotalHours: rowData['TotalHours'],
        BreaksTime: rowData['BreaksTime'] || 0,
        Location: rowData['Location'] || '',
        Note: rowData['Note'] || '',
        IsProblem: rowData['IsProblem'] || false,
        ReasonHREdit: rowData['ReasonHREdit'] || '',
        IsApprovedTBP: isApprove ? 1 : 2,
        IsApprovedHR: rowData['IsApprovedHR'] || 0,
        IsDeleted: false,
      };
    });

    this.employeeNightShiftService.saveApproveTBP(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Cập nhật trạng thái duyệt thành công!');
          this.getNightShift();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể cập nhật trạng thái duyệt!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật duyệt:', err);
        const errorMessage = err?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái duyệt!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  // Update HR Approve
  private updateHRApprove(listID: number[], isApprove: boolean): void {
    if (listID.length === 0) return;

    // Lấy dữ liệu từ table để build payload
    const payload = listID.map(id => {
      const row = this.nightShiftTable?.getRows().find(r => r.getData()['ID'] === id);
      const rowData: any = row?.getData() || {};

      return {
        ID: id,
        EmployeeID: rowData['EmployeeID'],
        ApprovedTBP: rowData['ApprovedTBP'],
        DateRegister: rowData['DateRegister'],
        DateStart: rowData['DateStart'],
        DateEnd: rowData['DateEnd'],
        TotalHours: rowData['TotalHours'],
        BreaksTime: rowData['BreaksTime'] || 0,
        Location: rowData['Location'] || '',
        Note: rowData['Note'] || '',
        IsProblem: rowData['IsProblem'] || false,
        ReasonHREdit: rowData['ReasonHREdit'] || '',
        IsApprovedTBP: rowData['IsApprovedTBP'] || 0,
        IsApprovedHR: isApprove ? 1 : 2,
        IsDeleted: false,
      };
    });

    this.employeeNightShiftService.saveApproveHR(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Cập nhật trạng thái duyệt thành công!');
          this.getNightShift();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể cập nhật trạng thái duyệt!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật duyệt:', err);
        const errorMessage = err?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái duyệt!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      },
    });
  }

  onDeleteNightShift() {
    const selectedRows = this.nightShiftTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một bản ghi để xóa!');
      return;
    }

    // Tách thành 2 nhóm: đã duyệt HR (không xóa được) và chưa duyệt (xóa được)
    const lockedRows = selectedRows.filter((row: any) => this.toBool(row.IsApprovedHR));
    const deletableRows = selectedRows.filter((row: any) => !this.toBool(row.IsApprovedHR));

    // Nếu tất cả đều đã được HR duyệt
    if (deletableRows.length === 0) {
      const lockedNames = lockedRows
        .map((row: any) => row.FullName || row.EmployeeName || 'Không xác định')
        .join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Tất cả các bản ghi đã được HR duyệt, không thể xóa. Danh sách: ${lockedNames}`
      );
      // Log ra console
      console.log('Không thể xóa các bản ghi sau (đã được HR duyệt):', lockedRows.map((r: any) => ({
        ID: r.ID,
        EmployeeName: r.FullName || r.EmployeeName,
        DateRegister: r.DateRegister,
        IsApprovedHR: r.IsApprovedHR
      })));
      return;
    }

    // Nếu có một số bản ghi đã được HR duyệt, báo cảnh báo
    if (lockedRows.length > 0) {
      const lockedNames = lockedRows
        .map((row: any) => row.FullName || row.EmployeeName || 'Không xác định')
        .join(', ');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bản ghi của nhân viên ${lockedNames} đã được HR duyệt, không thể xóa. Chỉ xóa các bản ghi chưa được duyệt.`
      );
      // Log ra console
      console.log('Không thể xóa các bản ghi sau (đã được HR duyệt):', lockedRows.map((r: any) => ({
        ID: r.ID,
        EmployeeName: r.FullName || r.EmployeeName,
        DateRegister: r.DateRegister,
        IsApprovedHR: r.IsApprovedHR
      })));
    }

    // Chuẩn bị text hiển thị cho các bản ghi sẽ xóa
    let nameDisplay = '';
    deletableRows.forEach((item: any, index: number) => {
      nameDisplay += item.FullName || item.EmployeeName || 'Không xác định';
      if (index < deletableRows.length - 1) {
        nameDisplay += ', ';
      }
    });

    if (deletableRows.length > 10) {
      if (nameDisplay.length > 50) {
        nameDisplay = nameDisplay.slice(0, 50) + '...';
      }
      nameDisplay += ` và ${deletableRows.length - 1} bản ghi khác`;
    } else {
      if (nameDisplay.length > 100) {
        nameDisplay = nameDisplay.slice(0, 100) + '...';
      }
    }

    const payload = deletableRows.map((row: any) => ({
      ID: row.ID,
      IsDeleted: true,
    }));

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <b>[${nameDisplay}]</b> không?${lockedRows.length > 0 ? '<br/><br/><b>Lưu ý:</b> Các bản ghi đã được HR duyệt sẽ không bị xóa.' : ''}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.employeeNightShiftService.saveApproveHR(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã xóa ${deletableRows.length} bản ghi thành công!${lockedRows.length > 0 ? ` (${lockedRows.length} bản ghi đã được HR duyệt không thể xóa)` : ''}`);
              this.getNightShift();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể xóa bản ghi!');
            }
          },
          error: (err) => {
            console.error('Lỗi xóa:', err);
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi xóa bản ghi!');
          },
        });
      },
    });
  }

  onOpenSummary() {
    const modalRef = this.ngbModal.open(EmployeeNightShiftSummaryComponent, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'night-shift-summary-modal',
    });
    modalRef.result.then(
      (result) => {
        // Handle result if needed
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  async exportToExcel() {
    if (!this.nightShiftTable) return;

    const selectedData = this.nightShiftTable.getData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách làm thêm');

    const columns = this.nightShiftTable
      .getColumnDefinitions()
      .filter(
        (col: any) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );

    const headerRow = worksheet.addRow(
      columns.map((col) => col.title || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        switch (col.field) {
          case 'IsApproved':
            return value ? 'Có' : 'Không';
          case 'NightShiftDate':
          case 'ApprovedDate':
          case 'CreateDate':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-lam-them-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  private formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Không duyệt
    const numStatus = status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
    }
  }
}
