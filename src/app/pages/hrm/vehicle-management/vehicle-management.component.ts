import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { VehicleManagementService } from './vehicle-management.service';
import { VehicleCategoryComponent } from './vehicle-category/vehicle-category.component';
import { VehicleManagementFormComponent } from './vehicle-management-form/vehicle-management-form.component';
import { CommonModule } from '@angular/common';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { inject } from '@angular/core';
import { VehicleRepairComponentFormComponent } from '../vehicle-repair/vehicle-repair-component-form/vehicle-repair-component-form.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-vehicle-management',
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzUploadModule,HasPermissionDirective
  ],
  templateUrl: './vehicle-management.component.html',
  styleUrl: './vehicle-management.component.css',
})
export class VehicleManagementComponent implements AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private VehicleManagementService: VehicleManagementService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  searchText: string = '';
  private ngbModal = inject(NgbModal);
  tb_vehicleManagement: Tabulator | null = null;
  vehicleMnagemens: any[] = [];
  selectedRow: any;
  selectedID: number = 0;
  //#endregion
  //#region Chạy khi mở chương trình
  ngAfterViewInit(): void {
    this.getVehicleManagement();
  }

  async getVehicleManagement() {
    this.VehicleManagementService.getVehicleManagement().subscribe({
      next: (response: any) => {
        console.log('tb_vehicleManagement', response.data);
        this.vehicleMnagemens = response.data;
        this.drawTbVehicle();
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  //#endregion
  onSearch() {
    if (this.tb_vehicleManagement) {
      if (!this.searchText.trim()) {
        this.tb_vehicleManagement.clearFilter(false); // <-- Thêm false ở đây
      } else {
        this.tb_vehicleManagement.setFilter([
          [
            { field: 'DriverName', type: 'like', value: this.searchText },
            { field: 'LicensePlate', type: 'like', value: this.searchText },
            { field: 'VehicleName', type: 'like', value: this.searchText },
            { field: 'STT', type: 'like', value: this.searchText },
            { field: 'PhoneNumber', type: 'like', value: this.searchText },
          ],
        ]);
      }
    }
  }
  //#region Vẽ bảng khảo sát dự án
  drawTbVehicle() {
    this.tb_vehicleManagement = new Tabulator('#tb_vehicleManagement', {
      ...DEFAULT_TABLE_CONFIG,
      groupBy: 'VehicleCategoryText',
      selectableRows: 1,
      data: this.vehicleMnagemens,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên xe',
          field: 'VehicleName',
          headerHozAlign: 'center',
        },
        {
          title: 'Biên số',
          field: 'LicensePlate',
          headerHozAlign: 'center',
        },
        {
          title: 'Chỗ ngồi',
          field: 'Slot',
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Lái xe',
          field: 'DriverName',
          headerHozAlign: 'center',
        },
        {
          title: 'Liên hệ',
          field: 'PhoneNumber',
          headerHozAlign: 'center',
        },
      ],
    });
    this.tb_vehicleManagement.on('rowDblClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.onEditVehicle();
    });

    this.tb_vehicleManagement.on('rowClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.selectedID = this.selectedRow.ID;
      console.log('selectedID: ', this.selectedID);
    });
  }
  //#endregion

  //#region Add Product
  onAddVehicle() {
    const modalRef = this.modalService.open(VehicleManagementFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        this.notification.success('Thông báo', 'Tạo sản phẩm thành công');
        setTimeout(() => this.getVehicleManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  //#endregion

  onEditVehicle() {
    if (this.selectedRow == null) {
      const selected = this.tb_vehicleManagement?.getSelectedData();
      if (!selected || selected.length === 0) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn một đơn vị để sửa!'
        );
        return;
      }
      this.selectedRow = { ...selected[0] };
    }

    const modalRef = this.modalService.open(VehicleManagementFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    console.log(this.selectedRow);
    modalRef.componentInstance.dataInput = this.selectedRow;
    modalRef.result.then(
      (result) => {
        this.notification.success(
          'Thông báo',
          'Sửa lĩnh vực dựa án thành công'
        );
        setTimeout(() => this.getVehicleManagement(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }
  onDeleteVehicle() {
    if (!this.selectedID || this.selectedID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn xe để xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa dự án đã chọn?'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const status = {
          ID: this.selectedID,
          IsDeleted: true,
        };
        this.VehicleManagementService.saveDataVehicleManagement(
          status
        ).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                'Thông báo',
                'Xóa lĩnh vực dự án thành công'
              );
              setTimeout(() => this.getVehicleManagement(), 100);
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Thất bại');
            }
          },
          error: (err) => {
            console.error(err);
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi kết nối');
          },
        });
      },
    });
  }
  onViewVehicleCategory() {
    const modalRef = this.modalService.open(VehicleCategoryComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {},
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  //#region Xuất excel
  async exportToExcel() {
    let table = this.tb_vehicleManagement;
    if (!table) return;
    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lĩnh vực dự án');
    const columns = table.getColumns();

    const headers = columns.map((col: any) => col.getDefinition().title);

    // Thêm dòng header và lưu lại dòng đó để thao tác
    const headerRow = worksheet.addRow(headers);

    // Gán style màu xám cho từng ô trong dòng header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    const startRow = 2;
    const column = 'A';

    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount - 2; i += 3) {
      const cell1 = worksheet.getCell(`${column}${i}`);
      const cell2 = worksheet.getCell(`${column}${i + 1}`);
      const cell3 = worksheet.getCell(`${column}${i + 2}`);

      if (cell1.value === cell2.value && cell1.value === cell3.value) {
        worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
        // Căn giữa nếu cần
        cell1.alignment = { vertical: 'middle' };
      }
    }

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle', // tùy chọn: căn giữa theo chiều dọc
        };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Timelinecongviec.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  addVehicleRepair() {
    // yêu cầu chọn dòng trước
    if (!this.selectedID) {
      this.notification.warning(
        'Thông báo',
        'Chọn xe trước khi thêm sửa chữa.'
      );
      return;
    }

    const modalRef = this.ngbModal.open(VehicleRepairComponentFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    // truyền tối thiểu ID; truyền thêm tên/biển số để hiển thị tức thì nếu muốn
    modalRef.componentInstance.dataInput = {
      VehicleManagementID: this.selectedID,
      VehicleName: this.selectedRow?.VehicleName,
      LicensePlate: this.selectedRow?.LicensePlate,
      EmployeeID: this.selectedRow?.EmployeeID, // nếu backend có
    };

    modalRef.result.then(
      () => this.getVehicleManagement(),
      () => {}
    );
  }
}
