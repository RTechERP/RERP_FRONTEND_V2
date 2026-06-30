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
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { VehicleRentalRequestFormComponent } from './vehicle-rental-request-form/vehicle-rental-request-form.component';
import { VehicleRentalRequest, VehicleRentalRequestService } from './vehicle-rental-request.service';
import { PermissionService } from '../../../../services/permission.service';

@Component({
  selector: 'app-vehicle-rental-request',
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
  templateUrl: './vehicle-rental-request.component.html',
  styleUrls: ['./vehicle-rental-request.component.css'],
  providers: [ConfirmationService]
})
export class VehicleRentalRequestComponent implements OnInit {
  loading = false;
  requests: VehicleRentalRequest[] = [];
  groupedRequests: VehicleRentalRequest[] = [];
  menuBars: any[] = [];

  selectedRequests: any[] = [];

  // Search params
  startDate: Date = DateTime.now().startOf('month').toJSDate();
  endDate: Date = DateTime.now().endOf('month').toJSDate();
  keyword: string = '';
  selectedEmployeeRequestID: any = null;
  selectedEmployeeID: any = null;
  selectedDepartmentID: any = null;

  // Dropdown data
  employees: any[] = [];
  groupedEmployees: any[] = [];
  departments: any[] = [];
  departmentNodes: any[] = [];

  // UI layout
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  constructor(
    private vehicleRentalRequestService: VehicleRentalRequestService,
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
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.deleteRecord()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.exportExcel()
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-sync fa-lg text-primary',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.loadData()
      }
    ];
  }

  private loadDropdowns(): void {
    this.vehicleRentalRequestService.getEmployees().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.employees = res.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      }
    });

    this.vehicleRentalRequestService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.departments = res.data || [];
          this.departmentNodes = this.buildTreeNodes(this.departments);
          this.loadData();
        }
      }
    });
  }

  buildTreeNodes(data: any[], parentId: number | null = null): any[] {
    const nodes: any[] = [];
    const children = data.filter(item => (item.ParentID === parentId) || (parentId === null && !item.ParentID));
    for (const child of children) {
      const node: any = {
        title: child.Name,
        value: child.ID,
        key: child.ID,
        isLeaf: true
      };
      const childNodes = this.buildTreeNodes(data, child.ID);
      if (childNodes.length > 0) {
        node.children = childNodes;
        node.isLeaf = false;
      }
      nodes.push(node);
    }
    return nodes;
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
      EmployeeRequestID: this.selectedEmployeeRequestID || 0,
      EmployeeID: this.selectedEmployeeID || 0,
      DepartmentID: this.selectedDepartmentID || 0
    };

    this.vehicleRentalRequestService.search(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status === 1) {
          this.requests = res.data || [];
          this.groupedRequests = this.groupDataByDepartment(this.requests);
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

  private groupDataByDepartment(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    const groups: any[] = [];
    const map = new Map();

    for (const item of data) {
      const deptName = item.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { name: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(item);
    }

    const flattened: any[] = [];
    groups.forEach(g => {
      g.items.forEach((item: any) => flattened.push(item));
    });
    return flattened;
  }

  openForm(request?: VehicleRentalRequest): void {
    const modalRef = this.ngbModal.open(VehicleRentalRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    const maxSTT = request ? 0 : (this.requests.length > 0 ? Math.max(...this.requests.map(r => r.STT || 0)) : 0);

    modalRef.componentInstance.record = request ? { ...request } : null;
    modalRef.componentInstance.maxSTT = maxSTT;

    modalRef.result.then((result: any) => {
      if (result) {
        this.loadData();
      }
    }).catch(() => { });
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
        this.vehicleRentalRequestService.delete(ids).subscribe({
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

  async exportExcel() {
    if (!this.selectedRequests || this.selectedRequests.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một bản ghi để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Yêu cầu thuê xe');

    // Cấu hình Group Headers (Dòng 1)
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'NGÀY YÊU CẦU';
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };

    worksheet.mergeCells('D1:I1');
    worksheet.getCell('D1').value = 'NỘI DUNG YÊU CẦU';
    worksheet.getCell('D1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };

    worksheet.mergeCells('J1:M1');
    worksheet.getCell('J1').value = 'THÔNG SỐ KỸ THUẬT';
    worksheet.getCell('J1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };

    worksheet.mergeCells('N1:P1');
    worksheet.getCell('N1').value = 'KHOẢNG CÁCH';
    worksheet.getCell('N1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } };

    worksheet.mergeCells('Q1:S1');
    worksheet.getCell('Q1').value = 'PHÒNG HCNS ĐỀ XUẤT';
    worksheet.getCell('Q1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } };

    // Định dạng Dòng 1
    const row1 = worksheet.getRow(1);
    row1.height = 30;
    row1.eachCell((cell) => {
      cell.font = { bold: true, size: 11, name: 'Times New Roman' };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Cấu hình Headers (Dòng 2)
    const headers = [
      'Năm', 'Tháng', 'Ngày',
      'Stt', 'Người yêu cầu', 'Bộ phận', 'Tên hàng', 'Mã dự án', 'Số lượng',
      'Dài (Cm)', 'Rộng (Cm)', 'Cao (Cm)', 'Trọng lượng (Kg)',
      'Xuất phát', 'Đích', 'Khoảng cách (km)',
      'Đơn vị vận chuyển', 'Chi phí (Chưa bao gồm Vat)', 'Ghi chú'
    ];

    const row2 = worksheet.addRow(headers);
    row2.height = 45;

    // Định dạng Dòng 2 & Màu nền theo nhóm
    const groupColors = [
      { start: 1, end: 3, color: 'FFB4C6E7' }, // Ngày yêu cầu
      { start: 4, end: 9, color: 'FFC6E0B4' }, // Nội dung
      { start: 10, end: 13, color: 'FFFFE699' }, // Thông số
      { start: 14, end: 16, color: 'FFB4C6E7' }, // Khoảng cách
      { start: 17, end: 19, color: 'FFC6E0B4' }  // Đề xuất
    ];

    row2.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 11, name: 'Times New Roman' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      const group = groupColors.find(g => colNumber >= g.start && colNumber <= g.end);
      if (group) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: group.color } };
      }
    });

    // Set độ rộng cột
    worksheet.columns = [
      { width: 8 }, { width: 8 }, { width: 8 }, // Ngày
      { width: 6 }, { width: 20 }, { width: 20 }, { width: 25 }, { width: 20 }, { width: 12 }, // Nội dung
      { width: 10 }, { width: 10 }, { width: 10 }, { width: 15 }, // Thông số
      { width: 20 }, { width: 35 }, { width: 18 }, // Khoảng cách
      { width: 25 }, { width: 25 }, { width: 30 } // Đề xuất
    ];

    // Thêm dữ liệu
    this.selectedRequests.forEach((item, index) => {
      let dateObj: Date | null = null;
      if (item.DateRequest) {
        dateObj = new Date(item.DateRequest);
      }

      const row = worksheet.addRow([
        dateObj ? dateObj.getFullYear() : '',
        dateObj ? dateObj.getMonth() + 1 : '',
        dateObj ? dateObj.getDate() : '',
        index + 1, // STT theo thứ tự xuất
        item.EmployeeRequestName || '',
        item.DepartmentName || '',
        item.PackageName || '',
        item.ProjectName || '',
        item.PackageQuantity ? item.PackageQuantity + ' kiện' : '',
        item.PackageLengthCm || '',
        item.PackageWidthCm || '',
        item.PackageHeightCm || '',
        item.PackageWeightKg ? item.PackageWeightKg + 'kg' : '',
        item.DepartureLocation || '',
        item.AddressLocation || '',
        item.DistanceKm ? item.DistanceKm + 'km' : '',
        item.NameNCC || '',
        item.Cost || '',
        item.Note || ''
      ]);

      row.eachCell((cell, colNumber) => {
        cell.font = { size: 11, name: 'Times New Roman' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Màu đỏ cho cột Chi phí
        if (colNumber === 18 && cell.value) {
          cell.font = { size: 11, name: 'Times New Roman', color: { argb: 'FFFF0000' }, bold: true };
          // Format tiền VNĐ
          cell.numFmt = '#,##0"đ"';
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `YeuCauThueXe_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`);
  }
}
