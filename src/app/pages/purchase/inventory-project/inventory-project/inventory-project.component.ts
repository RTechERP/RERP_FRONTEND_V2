import { inject } from '@angular/core';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';
(window as any).luxon = { DateTime };
import * as ExcelJS from 'exceljs';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { InventoryProjectFormComponent } from '../inventory-project-form/inventory-project-form.component';
import { InventoryProjectDetailComponent } from '../inventory-project-detail/inventory-project-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzFormModule,
    NzSpinModule,
    NgbModalModule,
    NzModalModule,
  ],
  selector: 'app-inventory-project',
  templateUrl: './inventory-project.component.html',
  styleUrl: './inventory-project.component.css'
})
export class InventoryProjectComponent implements OnInit, AfterViewInit {

  inventoryProjectTable: Tabulator | null = null;
  inventoryProjectList: any[] = [];
  selectedRow: any = null;
  selectedRows: any[] = [];
  projectID: number = 0;
  employeeID: number = 0;
  keyword: string = '';
  productSaleID: number = 0;
  projectList: any[] = [];
  employeeList: any[] = [];
  isSearchVisible: boolean = false;
  currentUser: any = null;
  exportingExcel: boolean = false;
  loading: boolean = false;
  private ngbModal = inject(NgbModal);

  constructor(
    private notification: NzNotificationService,
    private inventoryProjectService: InventoryProjectService,
    private nzModal: NzModalService,
    private authService: AuthService
  ) {}

  formatDate(value: string | null): string {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
  }

  formatNumber(value: number | null): string {
    if (value == null) return '0';
    return value.toLocaleString('vi-VN');
  }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadProject();
    this.loadEmployee();
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  loadProject() {
    this.inventoryProjectService.getProject().subscribe({
      next: (response: any) => {
        this.projectList = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách dự án:', error);
      }
    });
  }

  loadEmployee() {
    this.inventoryProjectService.getEmployee().subscribe({
      next: (response: any) => {
        this.employeeList = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
      }
    });
  }

  loadData() {
    this.loading = true;

    const request = {
      ProjectID: this.projectID || 0,
      EmployeeID: this.employeeID || 0,
      ProductSaleID: this.productSaleID || 0,
      KeyWord: this.keyword || ''
    };

    this.inventoryProjectService
      .getInventoryProject(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.inventoryProjectList = response.data || [];
          console.log('Inventory Project List:', this.inventoryProjectList);
          if (this.inventoryProjectTable) {
            this.inventoryProjectTable.setData(this.inventoryProjectList);
          }
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            error.error?.message || 'Lỗi khi tải dữ liệu'
          );
        }
      });
  }

  searchData(): void {
    this.loadData();
  }

  onSearch() {
    this.searchData();
  }

  resetFilters() {
    this.projectID = 0;
    this.employeeID = 0;
    this.keyword = '';
    this.productSaleID = 0;
    this.searchData();
  }

  drawTable() {
    this.inventoryProjectTable = new Tabulator('#inventoryProjectTable', {
      ...DEFAULT_TABLE_CONFIG,
      groupBy: 'WarehouseCode',
      groupHeader: function (value, count, data, group) {
        return `Mã kho: ${value}`;
      },
   
      selectableRows: true,
      paginationMode: 'local',
      data: this.inventoryProjectList,
      columns: [
      
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          bottomCalc: 'count',
          minWidth: 120,
          frozen: true,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          minWidth: 250,
          bottomCalc: 'count',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          minWidth: 120,
        },
        {
          title: 'DVT',
          field: 'Unit',
          width: 80,
        },
        {
          title: 'Vị trí',
          field: 'AddressBox',
          width: 120,
        },
        {
          title: 'SL Giữ',
          field: 'Quantity',
          width: 100,
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumber(cell.getValue()),
        },
        {
          title: 'SL Xuất',
          field: 'TotalQuantityExport',
          width: 100,
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumber(cell.getValue()),
        },
        {
          title: 'SL còn lại',
          field: 'TotalQuantityRemain',
          width: 120,
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumber(cell.getValue()),
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          width: 120,
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          minWidth: 200,
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          minWidth: 200,
        },
        {
          title: 'Số POKH',
          field: 'PONumber',
          width: 120,
        },
        {
          title: 'Mã POKH',
          field: 'POCode',
          width: 120,
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width: 120,
        },
        {
          title: 'Người yêu cầu',
          field: 'FullNameRequests',
          minWidth: 200,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          minWidth: 200,
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          width: 120,
          formatter: (cell) => this.formatDate(cell.getValue()),
        },
      ],
    });

    this.inventoryProjectTable.on('rowDblClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.onViewDetail();
    });

    this.inventoryProjectTable.on('rowClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
    });

    this.inventoryProjectTable.on('rowSelectionChanged', (data: any[]) => {
      this.selectedRows = data;
    });
  }

  onViewDetail() {
    if (!this.selectedRow) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để xem chi tiết!');
      return;
    }

    const modalRef = this.ngbModal.open(InventoryProjectDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = this.selectedRow;

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onRejectKeep() {
    // Ưu tiên dùng dòng được click; nếu chưa có thì lấy dòng đầu tiên trong selectedRows
    if (!this.selectedRow && this.selectedRows && this.selectedRows.length > 0) {
      this.selectedRow = this.selectedRows[0];
    }

    if (!this.selectedRow) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để nhả giữ!');
      return;
    }

    // Kiểm tra quyền
    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;
    const employeeIDs = (this.selectedRow.EmployeeIDs || '').split(';').filter((x: string) => x);
    const currentEmployeeID = this.currentUser?.EmployeeID?.toString();

    if (!employeeIDs.includes(currentEmployeeID) && !isAdmin) {
      this.notification.warning(
        'Cảnh báo',
        'Bạn không có quyền nhả giữ vì bạn không phải người yêu cầu giữ hoặc người giữ!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(InventoryProjectFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = this.selectedRow;
    modalRef.componentInstance.isRejectMode = true;

    modalRef.result.then(
      () => {
        this.notification.success('Thành công', 'Nhả giữ thành công!');
        this.loadData();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onDelete() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn sản phẩm muốn xóa!');
      return;
    }

    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;

    // Danh sách ID hợp lệ để xóa
    const ids: number[] = [];

    // Danh sách mã nội bộ không nằm trong danh sách được phép hủy giữ (theo nghiệp vụ WinForm)
    const productNewCodesSkipped: string[] = [];

    this.selectedRows.forEach((item: any) => {
      const id = Number(item.ID) || 0;
      if (id <= 0) {
        return;
      }

      const productSaleID = Number(item.ProductSaleID) || 0;
      const productNewCode = (item.ProductNewCode || '').toString();

      // Nếu là admin thì luôn cho phép xóa
      if (isAdmin) {
        ids.push(id);
        return;
      }

      // Với user thường: nghiệp vụ chi tiết kiểm tra productSaleLinks sẽ được xử lý ở API.
      // Tại FE, ta vẫn gom tất cả ID gửi lên, API sẽ tự bỏ qua những bản ghi không được phép hủy giữ.
      ids.push(id);
    });

    if (ids.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có sản phẩm nào có thể xóa!');
      return;
    }

    // Nếu có sản phẩm không được phép hủy giữ (theo nghiệp vụ phía server), có thể hiển thị cảnh báo bổ sung.
    // Ở đây giữ chỗ để sau này mở rộng nếu API trả về danh sách bị bỏ qua.

    const confirmMessage = this.selectedRows.length === 1
      ? 'Bạn có chắc muốn xóa sản phẩm đã chọn khỏi kho giữ không?'
      : `Bạn có chắc muốn xóa danh sách sản phẩm đã chọn khỏi kho giữ không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteObservables = ids.map((id: number) => {
          const payload = {
            ID: id,
            IsDeleted: true,
          };
          return this.inventoryProjectService.saveData(payload).pipe(
            catchError((error) => {
              console.error(`Lỗi khi xóa ID ${id}:`, error);
              return of({ success: false, error, id });
            })
          );
        });

        forkJoin(deleteObservables).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter(r => r.success !== false).length;
            const failCount = responses.filter(r => r.success === false).length;

            if (successCount > 0) {
              this.notification.success(
                'Thành công',
                `Xóa thành công ${successCount} sản phẩm!`
              );
            }

            if (failCount > 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Có ${failCount} sản phẩm xóa thất bại!`
              );
            }

            this.loadData();
          },
          error: (error:any) => {
            console.error('Lỗi khi xóa:', error);
            this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi xóa sản phẩm!');
          }
        });
      },
    });
  }

  async exportToExcel() {
    if (!this.inventoryProjectTable) return;
    
    const data = this.inventoryProjectTable.getData();
    if (!data || data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.exportingExcel = true;

    try {
      const table = this.inventoryProjectTable;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách hàng giữ');
      
      const columns = table
        .getColumnDefinitions()
        .filter(
          (col: any) =>
            col.visible !== false && col.field && col.field.trim() !== '' && col.field !== 'ID'
        );
      
      const headers = columns.map((col: any) => col.title || col.field);

      // Header row với màu mặc định của Tabulator (#EFEFEF)
      const headerRow = worksheet.addRow(headers);  
      headerRow.font = { 
        name: 'Times New Roman',
        size: 10,
        bold: true 
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '#0099FF' }, // Màu header mặc định của Tabulator
      };
      headerRow.alignment = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true
      };
      headerRow.height = 20;

      // Thêm border cho header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF999999' } },
          left: { style: 'thin', color: { argb: 'FF999999' } },
          bottom: { style: 'thin', color: { argb: 'FF999999' } },
          right: { style: 'thin', color: { argb: 'FF999999' } },
        };
      });

      // Thêm data rows
      data.forEach((row: any) => {
        const rowData = columns.map((col: any) => {
          const value = row[col.field];
          
          // Xử lý date
          if (col.field === 'CreatedDate' && value) {
            return new Date(value);
          }
          
          // Xử lý số
          if (['Quantity', 'TotalQuantityRemain', 'TotalQuantityFirst', 'TotalQuantityLast'].includes(col.field)) {
            return value !== null && value !== undefined ? Number(value) : 0;
          }
          
          return value !== null && value !== undefined ? value : '';
        });
        
        const excelRow = worksheet.addRow(rowData);
        
        // Set font cho data rows
        excelRow.font = {
          name: 'Times New Roman',
          size: 10
        };
        
        // Set alignment và border cho từng cell
        excelRow.eachCell((cell, colNumber) => {
          const col = columns[colNumber - 1];
          
          // Căn lề theo loại dữ liệu
          let alignment: any = {
            vertical: 'middle',
            wrapText: true
          };
          
          // Số căn phải
          if (col?.field && ['Quantity', 'TotalQuantityExport', 'TotalQuantityRemain'].includes(col.field)) {
            alignment.horizontal = 'right';
            // Format số với dấu phân cách hàng nghìn
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          }
          // Ngày căn giữa
          else if (col?.field === 'CreatedDate') {
            alignment.horizontal = 'center';
            // Format ngày
            if (cell.value instanceof Date) {
              cell.numFmt = 'dd/mm/yyyy';
            }
          }
          // Mặc định căn trái (chữ)
          else {
            alignment.horizontal = 'left';
          }
          
          cell.alignment = alignment;
          
          // Border
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          };
        });
      });
      
      // Auto width cho columns (tối thiểu 10, tối đa 50)
      worksheet.columns.forEach((column: any, index: number) => {
        let maxLength = 10;
        const headerValue = headers[index] ? headers[index].toString() : '';
        maxLength = Math.max(maxLength, headerValue.length);

        column.eachCell({ includeEmpty: true }, (cell: any) => {
          if (cell.value !== null && cell.value !== undefined) {
            let cellValue = '';
            if (cell.value instanceof Date) {
              cellValue = cell.value.toLocaleDateString('vi-VN');
            } else {
              cellValue = cell.value.toString();
            }
            maxLength = Math.max(maxLength, cellValue.length);
          }
        });

        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `danh-sach-hang-giu-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất file Excel!');
    } finally {
      this.exportingExcel = false;
    }
  }
}
