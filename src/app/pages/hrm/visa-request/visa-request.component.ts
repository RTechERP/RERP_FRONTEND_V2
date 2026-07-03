import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { VisaRequestFormComponent } from './visa-request-form/visa-request-form.component';
import { VisaRequestService, BusinessVisaRequest } from './visa-request.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-visa-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzFormModule,
    NzGridModule,
    NzTreeSelectModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    MenubarModule,
    ConfirmDialogModule,
  ],
  templateUrl: './visa-request.component.html',
  styleUrls: ['./visa-request.component.css'],
  providers: [ConfirmationService]
})
export class VisaRequestComponent implements OnInit {
  loading = false;
  requests: BusinessVisaRequest[] = [];
  menuBars: any[] = [];
  selectedRequests: any[] = [];

  // Search params
  startDate: Date = DateTime.now().startOf('month').toJSDate();
  endDate: Date = DateTime.now().endOf('month').toJSDate();
  keyword: string = '';
  selectedType: any = null;
  selectedEmployeeID: any = null;

  // Dropdown data
  employees: any[] = [];
  groupedEmployees: any[] = [];

  // UI layout
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  constructor(
    private visaRequestService: VisaRequestService,
    private notification: NzNotificationService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.loadDropdowns();
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
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.openForm()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-info',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.editRecord()
      },
      {
        label: 'Copy',
        icon: 'fa-solid fa-copy fa-lg text-warning',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.copyRecord()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.deleteRecord()
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-sync fa-lg text-primary',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.loadData()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.exportExcel()
      }
    ];
  }

  private loadDropdowns(): void {
    this.visaRequestService.getEmployees().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.employees = res.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      }
    });

    this.loadData();
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

  onSearch(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    const params = {
      Keyword: this.keyword?.trim() || '',
      StartDate: this.startDate,
      EndDate: this.endDate,
      Type: this.selectedType || 0,
      EmployeeID: this.selectedEmployeeID || 0
    };

    this.visaRequestService.search(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status === 1) {
          this.requests = res.data || [];
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải dữ liệu');
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối');
        this.loading = false;
      }
    });
  }

  openForm(request?: BusinessVisaRequest): void {
    if (request && request.ID) {
      // Gọi API lấy dữ liệu mới nhất theo ID
      this.visaRequestService.getById(request.ID).subscribe({
        next: (res: any) => {
          if (res?.status === 1 && res.data) {
            this.openModal(res.data, 0);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không tìm thấy dữ liệu bản ghi');
          }
        },
        error: () => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi lấy dữ liệu');
        }
      });
    } else {
      // Thêm mới
      const maxSTT = this.requests.length > 0 ? Math.max(...this.requests.map(r => r.STT || 0)) : 0;
      this.openModal(null, maxSTT);
    }
  }

  private openModal(record: any, maxSTT: number, isCopy: boolean = false): void {
    const modalRef = this.ngbModal.open(VisaRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.record = record ? { ...record } : null;
    modalRef.componentInstance.maxSTT = maxSTT;
    modalRef.componentInstance.isCopy = isCopy;

    modalRef.result.then((result: any) => {
      if (result) {
        this.loadData();
      }
    }).catch(() => { });
  }

  copyRecord(): void {
    if (!this.selectedRequests || this.selectedRequests.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để copy');
      return;
    }

    // Gọi API lấy dữ liệu mới nhất theo ID
    this.visaRequestService.getById(this.selectedRequests[0].ID).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) {
          const maxSTT = this.requests.length > 0 ? Math.max(...this.requests.map(r => r.STT || 0)) : 0;
          this.openModal(res.data, maxSTT, true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Không tìm thấy dữ liệu bản ghi');
        }
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi lấy dữ liệu');
      }
    });
  }

  editRecord(): void {
    if (!this.selectedRequests || this.selectedRequests.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để sửa');
      return;
    }
    this.openForm(this.selectedRequests[0]);
  }

  deleteRecord(): void {
    if (!this.selectedRequests || this.selectedRequests.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một bản ghi để xóa');
      return;
    }

    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn xóa bản ghi đã chọn?',
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      accept: () => {
        const ids = this.selectedRequests.map(x => x.ID);
        this.visaRequestService.delete(ids).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.loadData();
              this.selectedRequests = [];
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          },
          error: () => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi gọi API');
          }
        });
      }
    });
  }

  exportExcel(): void {
    const params = {
      Keyword: this.keyword?.trim() || '',
      StartDate: this.startDate,
      EndDate: this.endDate,
      Type: this.selectedType || 0,
      EmployeeID: this.selectedEmployeeID || 0
    };

    this.visaRequestService.exportExcel(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        a.download = `TheoDoiVisa_${dateStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file thành công');
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xuất file Excel');
      }
    });
  }
}
