import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';

import {
  EmployeeDeductionService,
  EmployeeDeductionParam,
  EmployeeDeductionDto,
} from './employee-deduction.service';
import { EmployeeDeductionFormComponent } from './employee-deduction-form/employee-deduction-form.component';
import { EmployeeDeductionSummaryComponent } from './employee-deduction-summary/employee-deduction-summary.component';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { PermissionService } from '../../../../services/permission.service';
import { UserService } from '../../../../services/user.service';
import { EmployeeDeductionTypeService } from './employee-deduction-type/employee-deduction-type.service';
@Component({
  selector: 'app-employee-deduction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzDropDownModule,
    NzFormModule,
    NzGridModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    MenubarModule,
    RippleModule,
    NzModalModule
  ],
  providers: [ConfirmationService],
  templateUrl: './employee-deduction.component.html',
  styleUrls: ['./employee-deduction.component.css'],
})
export class EmployeeDeductionComponent implements OnInit, OnDestroy {
  // Search params
  selectedMonth: Date = new Date();
  selectedEmployeeID: any = null;
  selectedDepartmentID: any = null;
  selectedDeductionType: any = null;
  keyword: string = '';

  // Dropdown data
  employees: any[] = [];
  groupedEmployees: any[] = [];
  departments: any[] = [];
  deductionTypes: any[] = [];

  // Table data
  deductions: any[] = [];
  selectedDeduction: any = null;
  isLoading: boolean = false;

  // Permission
  isN1N2: boolean = false;

  // Grouping
  groupRowsBy: string = '';
  expandedRows: any = {}; // { 'DeptName': true/false }
  groupedDeductions: any[] = [];

  // UI layout
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  menuBars: any[] = [];

  constructor(
    private deductionService: EmployeeDeductionService,
    private notification: NzNotificationService,
    private confirmationService: ConfirmationService,
    private ngbModal: NgbModal,
    private modal: NzModalService,
    private router: Router,
    private tabService: TabServiceService,
    private permissionService: PermissionService,
    private userService: UserService,
    private employeeDeductionTypeService: EmployeeDeductionTypeService
  ) { }

  ngOnInit(): void {
    this.isN1N2 = this.permissionService.hasPermission('N1,N2');
    this.initMenuBar();
    this.loadDropdowns();
    this.getDeductionTypes();
  }
  getDeductionTypes(): void {
    this.isLoading = true;
    this.employeeDeductionTypeService.getAll().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.deductionTypes = (res.data || []).map((item: any) => ({
            label: item.DeductionTypeName,
            value: item.ID,
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải dữ liệu');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        this.isLoading = false;
      }
    });
  }
  get hasFullAccess(): boolean {
    return this.isN1N2;
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  initMenuBar(): void {
    this.menuBars = [

      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus-circle fa-lg text-success',
        command: () => this.addDeduction(),
        visible: this.permissionService.hasPermission("N1,N2"),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-info',
        command: () => this.editDeduction(),
        visible: this.permissionService.hasPermission("N1,N2"),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteDeduction(),
        visible: this.permissionService.hasPermission("N1,N2"),
      },
      {
        label: 'Tính phạt',
        icon: 'fa-solid fa-calculator fa-lg text-warning',
        command: () => this.calculateDeductions(false),
        visible: this.permissionService.hasPermission("N1,N2"),
      },
      {
        label: 'Tính phạt ALL',
        icon: 'fa-solid fa-users-cog fa-lg text-danger',
        command: () => this.calculateDeductions(true),
        visible: this.permissionService.hasPermission("N1,N2"),
      },
      {
        label: 'Tổng hợp phạt',
        icon: 'fa-solid fa-table-list fa-lg text-success',
        command: () => this.openSummary()
      },
      {
        label: 'Khai báo Loại phạt',
        icon: 'fa-solid fa-list-check fa-lg text-info',
        command: () => this.router.navigate(['/employee-deduction-type']),
        visible: this.permissionService.hasPermission("N1,N2"),
      }
    ];
  }

  toggleGroup(deptName: string): void {
    this.expandedRows[deptName] = !this.expandedRows[deptName];
    this.updateGroupedDeductions();
  }

  private updateGroupedDeductions(): void {
    const grouped: any[] = [];
    const depts: string[] = [];
    this.deductions.forEach(d => {
      const deptName = d.Name || 'Chưa phân loại';
      if (!depts.includes(deptName)) depts.push(deptName);
    });

    let currentIndex = 0; // Để đếm STT thực tế của bản ghi data
    depts.forEach(dept => {
      const deptName = dept || 'Chưa phân loại';
      // Add header row
      grouped.push({ isHeader: true, Name: deptName });

      // Add data rows if expanded
      // Lưu ý: data gốc vẫn dùng dept (có thể null) để filter chính xác
      const deptRows = this.deductions.filter(d => d.Name === dept);

      if (this.expandedRows[deptName] === undefined) this.expandedRows[deptName] = true;

      if (this.expandedRows[deptName]) {
        deptRows.forEach(row => {
          currentIndex++;
          grouped.push({ ...row, stt: currentIndex });
        });
      } else {
        currentIndex += deptRows.length; // Vẫn tăng index ngay cả khi group bị đóng để STT đồng nhất
      }
    });

    this.groupedDeductions = grouped;
  }

  ngOnDestroy(): void { }

  openSummary(): void {
    this.tabService.openTabComp({
      comp: EmployeeDeductionSummaryComponent,
      title: 'Tổng hợp phạt',
      key: 'employee-deduction-summary',
      data: {}
    });
  }

  private loadDropdowns(): void {
    this.deductionService.getEmployees().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.employees = res.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });

    this.deductionService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.departments = res.data || [];
          const currentUser = this.userService.getUser();
          if (!this.isN1N2 && currentUser) {
            this.selectedEmployeeID = currentUser.EmployeeID;
            this.selectedDepartmentID = currentUser.DepartmentID;
          }
          this.onSearch(); // Trigger search after loading departments
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  onSearch(): void {
    this.isLoading = true;
    let month: number;
    let year: number;

    if (typeof this.selectedMonth === 'string') {
      const dt = DateTime.fromISO(this.selectedMonth);
      month = dt.isValid ? dt.month : DateTime.now().month;
      year = dt.isValid ? dt.year : DateTime.now().year;
    } else {
      const dateObj = this.selectedMonth || new Date();
      month = dateObj.getMonth() + 1;
      year = dateObj.getFullYear();
    }

    const param: EmployeeDeductionParam = {
      Month: month,
      Year: year,
      EmployeeID: this.selectedEmployeeID || 0,
      DepartmentID: this.selectedDepartmentID || 0,
      Keyword: this.keyword?.trim() || '',
      DeductionType: this.selectedDeductionType || 0,
    };

    this.deductionService.getDeductions(param).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          this.deductions = res.data || [];

          // Initialize expanded state for all depts
          const depts = Array.from(new Set(this.deductions.map(d => d.Name)));
          depts.forEach(d => {
            if (d && this.expandedRows[d] === undefined) this.expandedRows[d] = true;
          });

          this.updateGroupedDeductions();
        } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  addDeduction(): void {
    const modalRef = this.ngbModal.open(EmployeeDeductionFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.deductionData = null;
    modalRef.componentInstance.employees = this.employees;

    modalRef.result.then((result: any) => {
      if (result?.action === 'save') {
        this.notification.success(NOTIFICATION_TITLE.success, 'Thêm phạt thành công!');
        this.onSearch();
      }
    }).catch(() => { });
  }

  editDeduction(): void {
    if (!this.selectedDeduction) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(EmployeeDeductionFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.deductionData = { ...this.selectedDeduction };
    modalRef.componentInstance.employees = this.employees;

    modalRef.result.then((result: any) => {
      if (result?.action === 'save') {
        this.notification.success(NOTIFICATION_TITLE.success, 'Sửa phạt thành công!');
        this.onSearch();
      }
    }).catch(() => { });
  }

  deleteDeduction(): void {
    if (!this.selectedDeduction) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần xóa!');
      return;
    }

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa bản ghi của <strong>"${this.selectedDeduction.FullName}"</strong> không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      accept: () => {
        this.deductionService.deleteDeduction({ ID: this.selectedDeduction.ID }).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công!');
              this.selectedDeduction = null;
              this.onSearch();
            } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
              this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              }
            );
          },
        });
      },
    });
  }

  calculateDeductions(all: boolean = false): void {
    if (!all && !this.selectedDeduction) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên cần tính phạt!');
      return;
    }

    if (all) {
      this.modal.create({
        nzTitle: 'Xác nhận tính phạt',
        nzContent: `Bạn có chắc chắn muốn tính phạt cho <strong>toàn bộ nhân viên</strong> không?<br/>⚠️ <strong>Lưu ý:</strong> Dữ liệu phạt cũ của tháng sẽ được xử lý theo lựa chọn bên dưới.`,
        nzCentered: true,
        nzClosable: true,
        nzClassName: 'deduction-calc-modal',
        nzWidth: 450,
        nzFooter: [
          {
            label: 'Hủy',
            danger: true,
            onClick: () => this.modal.closeAll()
          },
          {
            label: 'Không ghi đè',
            type: 'dashed',
            onClick: () => {
              this.modal.closeAll();
              this.executeCalculation(true, 0); // IsOverride = 0
            }
          },
          {
            label: 'Ghi đè dữ liệu cũ',
            type: 'primary',
            onClick: () => {
              this.modal.closeAll();
              this.executeCalculation(true, 1); // IsOverride = 1
            }
          }
        ]
      });
    } else {
      this.modal.create({
        nzTitle: 'Xác nhận tính phạt',
        nzContent: `Bạn có chắc chắn muốn tính phạt cho nhân viên <strong>"${this.selectedDeduction.FullName}"</strong> không?<br/>⚠️ <strong>Lưu ý:</strong> Dữ liệu phạt cũ của nhân viên này trong tháng sẽ được cập nhật lại.`,
        nzCentered: true,
        nzClosable: true,
        nzClassName: 'deduction-calc-modal',
        nzWidth: 450,
        nzFooter: [
          {
            label: 'Hủy',
            danger: true,
            onClick: () => this.modal.closeAll()
          },
          {
            label: 'Đồng ý tính phạt',
            type: 'primary',
            onClick: () => {
              this.modal.closeAll();
              this.executeCalculation(false, 1); // IsOverride = 1
            }
          }
        ]
      });
    }
  }

  private executeCalculation(all: boolean, isOverride: number): void {
    this.isLoading = true;
    const employeeId = all ? 0 : this.selectedDeduction.EmployeeID;

    let month: number;
    let year: number;

    if (typeof this.selectedMonth === 'string') {
      const dt = DateTime.fromISO(this.selectedMonth);
      month = dt.isValid ? dt.month : DateTime.now().month;
      year = dt.isValid ? dt.year : DateTime.now().year;
    } else {
      const dateObj = this.selectedMonth || new Date();
      month = dateObj.getMonth() + 1;
      year = dateObj.getFullYear();
    }

    this.deductionService.calculateDeductions({
      Month: month,
      Year: year,
      EmployeeID: employeeId,
      IsOverride: isOverride
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Tính phạt thành công!');
          this.onSearch();
        } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Tính phạt thất bại');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  onRowSelect(event: any): void {
    this.selectedDeduction = event.data;
  }

  onRowUnselect(event: any): void {
    this.selectedDeduction = null;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  formatCurrency(value: number | undefined): string {
    if (value === null || value === undefined) return '';
    return Number(value).toLocaleString('vi-VN') + 'đ';
  }

  getDeductionTypeName(type: number | undefined): string {
    switch (type) {
      case 1: return 'Đi muộn về sớm';
      case 2: return 'Quên chấm công';
      case 3: return 'Đăng ký nghỉ';
      case 4: return 'Khác';
      default: return '';
    }
  }

  getTotalRecords(): number {
    if (!this.deductions) return 0;
    return this.deductions.length;
  }

  getTotalAmount(): number {
    if (!this.deductions) return 0;
    return this.deductions.reduce((sum, d) => sum + (d.DeductionAmount || 0), 0);
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }
}
