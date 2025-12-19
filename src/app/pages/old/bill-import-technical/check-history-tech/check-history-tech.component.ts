import { Component, OnInit, HostListener, Inject, Optional, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator, CellComponent, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { MaterialDetailOfProductRtcComponent } from '../../inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { BillExportTechnicalFormComponent } from '../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { MenuEventService } from '../../../systems/menus/menu-service/menu-event.service';

function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}

function formatDateTimeCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm') : '';
}

@Component({
  selector: 'app-check-history-tech',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzGridModule,
    NzSpinModule
  ],
  templateUrl: './check-history-tech.component.html',
  styleUrl: './check-history-tech.component.css'
})
export class CheckHistoryTechComponent implements OnInit, AfterViewInit {

  // Inputs
  @Input() warehouseID: number = 1;
  @Input() warehouseType: number = 1;

  // Outputs
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  // State & Model
  dtLoad: any[] = [];
  selectedRows: any[] = [];
  currentCellValue: string = '';
  isLoading: boolean = false;

  filter = {
    dateStart: new Date(),
    dateEnd: new Date(),
    supplierId: 0,
    employeeId: 0,
    employeeBorrowId: 0,
    keyword: '',
    warehouseId: 0
  };

  // Tabulator
  @ViewChild('checkHistoryTableRef', { static: false }) checkHistoryTableRef!: ElementRef;
  checkHistoryTable: Tabulator | null = null;

  // Combobox data
  suppliers: any[] = [];
  employees: any[] = [];
  employeeBorrows: any[] = [];

  // Inject services
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);

  constructor(
    private historyService: BillImportTechnicalService,
    private notification: NzNotificationService,
    private menuEventService: MenuEventService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    // Nhận warehouseId từ tabData hoặc @Input
    if (this.tabData?.warehouseId) {
      this.filter.warehouseId = this.tabData.warehouseId;
      this.warehouseID = this.tabData.warehouseId;
    } else if (this.warehouseID) {
      this.filter.warehouseId = this.warehouseID;
    }

    if (this.tabData?.warehouseType) {
      this.warehouseType = this.tabData.warehouseType;
    }
    
    this.initDate();
    this.loadSuppliers();
    this.loadEmployees();
    this.loadEmployeeBorrows();
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
  }

  initDate() {
    const today = new Date();
    this.filter.dateStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    this.filter.dateEnd = new Date();
  }

  drawTable() {
    if (!this.checkHistoryTableRef) return;

    this.checkHistoryTable = new Tabulator(
      this.checkHistoryTableRef.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '70vh',
        pagination: false,
        placeholder: 'Không có dữ liệu',
        selectableRows: true,
        rowFormatter: (row: RowComponent) => {
          const data = row.getData();
          const rowElement = row.getElement();
          
          // Remove existing classes
          rowElement.classList.remove('row-warning');
          
          // Add warning class based on deadline condition
          if (data['checkDeadline'] <= 30 && data['reMain'] !== 0) {
            rowElement.classList.add('row-warning');
          }
        },
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            frozen: true,
          },
          {
            title: 'Duyệt',
            field: 'Status',
            formatter: (cell: CellComponent) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 80,
          },
          {
            title: 'Ngày duyệt / huỷ duyệt',
            field: 'DateStatus',
            formatter: formatDateTimeCell,
            width: 150,
          },
          {
            title: 'Ngày tạo',
            field: 'CreatDate',
            formatter: formatDateCell,
            width: 120,
          },
          {
            title: 'Mã phiếu nhập',
            field: 'BillCode',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Nhà cung cấp',
            field: 'NCC',
            width: 200,
            formatter:'textarea',
          },
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Mã nội bộ',
            field: 'ProductCodeRTC',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            width: 250,
            formatter:'textarea',
          },
          {
            title: 'ĐVT',
            field: 'UnitName',
            width: 80,
            formatter:'textarea',
          },
          {
            title: 'Hãng',
            field: 'Maker',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'SL mượn',
            field: 'Quantity',
            hozAlign: 'right',
            width: 100,
          },
          {
            title: 'SL trả',
            field: 'backQuantity',
            hozAlign: 'right',
            width: 100,
          },
          {
            title: 'SL còn lại',
            field: 'ReMain',
            hozAlign: 'right',
            width: 100,
          },
          {
            title: 'Người nhận',
            field: 'Receiver',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Người giao',
            field: 'Deliver',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Người cần mượn',
            field: 'employeeBorrow',
            width: 150,
            formatter:'textarea',
          },
          {
            title: 'Deadline trả NCC',
            field: 'DeadlineReturnNCC',
            formatter: formatDateCell,
            width: 150,
          },
          {
            title: 'Tình trạng hàng',
            field: 'WarehouseType',
            width: 150,
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            width: 200,
            formatter:'textarea',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            width: 300,
            
            formatter: (cell: CellComponent) => {
              const val = cell.getValue();
              return val ? `<span class="text-wrap">${val}</span>` : '';
            },
          },
        ],
      }
    );

    // Handle row click
    this.checkHistoryTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      // Update current cell value for copy functionality
      const cell = row.getCells()[0];
      if (cell) {
        this.currentCellValue = String(cell.getValue() || '');
      }
    });

    // Handle double click
    this.checkHistoryTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.openExportDialog();
    });

    // Handle row selection
    this.checkHistoryTable.on('rowSelectionChanged', (data: any[], rows: RowComponent[]) => {
      this.selectedRows = rows.map(row => row.getData());
    });

    // Handle cell click for copy
    this.checkHistoryTable.on('cellClick', (e: UIEvent, cell: CellComponent) => {
      const value = cell.getValue();
      if (value !== null && value !== undefined) {
        this.currentCellValue = String(value);
      }
    });
  }

  loadData() {
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const endOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const params = {
      dateStart: startOfDay(this.filter.dateStart),
      dateEnd: endOfDay(this.filter.dateEnd),
      employeeId: this.filter.employeeId || 0,
      employeeBorrowId: this.filter.employeeBorrowId || 0,
      supplierId: this.filter.supplierId || 0,
      wareHouseId: this.filter.warehouseId || 0,
      filterText: this.filter.keyword || ''
    };

    this.isLoading = true;
    this.historyService.getCheckHistoryTech(params).subscribe({
      next: (res) => {
        // Backend trả về data trực tiếp hoặc trong res.data
        this.dtLoad = res.data || res || [];
        
        if (this.checkHistoryTable) {
          this.checkHistoryTable.setData(this.dtLoad);
          this.restoreSelectedRows();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Lỗi khi tải dữ liệu');
      }
    });
  }

  restoreSelectedRows() {
    if (this.checkHistoryTable && this.selectedRows.length > 0) {
      this.checkHistoryTable.getRows().forEach((row: RowComponent) => {
        const rowData = row.getData();
        if (this.selectedRows.some(selected => selected['id'] === rowData['id'])) {
          row.select();
        }
      });
    }
  }

  loadSuppliers() {
    this.historyService.getNCC().subscribe({
      next: (res: any) => {
        this.suppliers = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Lỗi khi tải danh sách nhà cung cấp');
      }
    });
  }

  loadEmployees() {
    // Sử dụng getEmployeeHistoryProduct với userId = 0 để lấy tất cả
    this.historyService.getEmployeeHistoryProduct(0).subscribe({
      next: (res) => {
        // Backend trả về data trực tiếp hoặc trong res.data
        this.employees = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Lỗi khi tải danh sách nhân viên');
      }
    });
  }

  loadEmployeeBorrows() {
    this.historyService.getEmployeeBorrow(0).subscribe({
      next: (res) => {
        // Backend trả về data trực tiếp hoặc trong res.data
        this.employeeBorrows = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Lỗi khi tải danh sách nhân viên mượn');
      }
    });
  }


  showMaterialDetail(row: any) {
    this.openMaterialDetail(row);
  }

  showMaterialDetailForSelected() {
    if (this.selectedRows.length === 1) {
      this.openMaterialDetail(this.selectedRows[0]);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để xem chi tiết');
    }
  }

  @HostListener('document:keydown.control.c', ['$event'])
  copyCell(event: KeyboardEvent) {
    if (this.currentCellValue) {
      navigator.clipboard.writeText(this.currentCellValue).then(() => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Đã sao chép');
      });
    }
  }

  async exportExcel() {
    const table = this.checkHistoryTable;
    if (!table) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const today = new Date();
    const formattedDatee = `${today.getDate().toString().padStart(2, '0')}${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `DSSanPhamMuonNCC_${formattedDatee}`
    );

    const columns = table.getColumns();
    // Bỏ qua cột STT (rownum)
    const filteredColumns = columns.filter((col: any) => {
      const def = col.getDefinition();
      return def.formatter !== 'rownum' && def.visible !== false;
    });

    const headers = filteredColumns.map((col: any) => col.getDefinition().title);
    const headerRow = worksheet.addRow(headers);
    
    // Format header row: màu xám, font size 12, font Tahoma
    headerRow.font = { 
      name: 'Tahoma', 
      size: 12, 
      bold: true 
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Màu xám
    };
    headerRow.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    };

    data.forEach((row: any, index: number) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        // Format date fields
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        // Format Status checkbox
        if (field === 'Status') {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          value = checked ? '✓' : '';
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format font và alignment cho toàn bộ sheet: Tahoma, size 12, alignment theo Tabulator
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        // Lấy column definition để lấy alignment
        const colDef = filteredColumns[colNumber - 1]?.getDefinition();
        const hozAlign = colDef?.hozAlign || 'left'; // Mặc định là left
        const headerHozAlign = colDef?.headerHozAlign || hozAlign;
        
        // Đặt font Tahoma, size 12 cho tất cả cells
        if (rowNumber === 1) {
          // Header row: bold, màu xám đã set ở trên
          cell.font = { 
            name: 'Tahoma', 
            size: 12, 
            bold: true 
          };
          
          // Alignment cho header theo headerHozAlign hoặc hozAlign
          const align = headerHozAlign || hozAlign;
          cell.alignment = {
            horizontal: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
            vertical: 'middle',
            wrapText: true
          };
        } else {
          // Data rows: font Tahoma, size 12, không bold
          cell.font = { 
            name: 'Tahoma', 
            size: 12 
          };
          
          // Format date fields
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy HH:mm';
          }
          
          // Alignment cho data rows theo hozAlign
          cell.alignment = {
            horizontal: hozAlign === 'center' ? 'center' : hozAlign === 'right' ? 'right' : 'left',
            vertical: 'middle',
            wrapText: true
          };
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', ySplit: 1 },
    ];

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DSSanPhamMuonNCC_${formattedDatee}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công');
  }

  openMaterialDetail(row: any) {
    const title = `Chi tiết: ${row.productName || row.ProductName || row.productCode || row.ProductCode || 'Vật tư'}`;
    const data = {
      productRTCID1: row.productID || row.ProductRTCID || 0,
      warehouseID1: this.filter.warehouseId || 1,
      ProductCode: row.productCode || row.ProductCode || '',
      ProductName: row.productName || row.ProductName || '',
      NumberBegin: row.Number || row.NumberBegin || 0,
      InventoryLatest: row.InventoryLatest || 0,
      NumberImport: row.NumberImport || 0,
      NumberExport: row.NumberExport || 0,
      NumberBorrowing: row.NumberBorrowing || 0,
      InventoryReal: row.InventoryReal || 0,
    };

    const modalRef = this.ngbModal.open(MaterialDetailOfProductRtcComponent, {
      centered: false,
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'full-screen-modal'
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.productRTCID1 = data.productRTCID1;
    modalRef.componentInstance.warehouseID1 = data.warehouseID1;
    modalRef.componentInstance.ProductCode = data.ProductCode;
    modalRef.componentInstance.ProductName = data.ProductName;
    modalRef.componentInstance.NumberBegin = data.NumberBegin;
    modalRef.componentInstance.InventoryLatest = data.InventoryLatest;
    modalRef.componentInstance.NumberImport = data.NumberImport;
    modalRef.componentInstance.NumberExport = data.NumberExport;
    modalRef.componentInstance.NumberBorrowing = data.NumberBorrowing;
    modalRef.componentInstance.InventoryReal = data.InventoryReal;

    modalRef.result.then(
      (ok: any) => {
        // Modal closed
      },
      () => {
        // Modal dismissed
      }
    );
  }

  validateSameSupplier(rows: any[]): boolean {
    if (rows.length === 0) return false;
    
    // Lấy NCC (Nhà cung cấp) và CustomerName (Khách hàng) từ row đầu tiên
    const firstNCC = rows[0].NCC || '';
    const firstCustomerName = rows[0].CustomerName || '';
    
    // Kiểm tra xem tất cả rows có cùng NCC (Nhà cung cấp) không
    const allSameNCC = rows.every(row => {
      const rowNCC = row.NCC || '';
      return rowNCC === firstNCC && rowNCC !== ''; // Phải cùng NCC và NCC không rỗng
    });
    
    // Kiểm tra xem tất cả rows có cùng CustomerName (Khách hàng) không
    const allSameCustomer = rows.every(row => {
      const rowCustomer = row.CustomerName || '';
      return rowCustomer === firstCustomerName && rowCustomer !== ''; // Phải cùng CustomerName và CustomerName không rỗng
    });
    
    // Phải cùng NCC HOẶC cùng CustomerName thì mới cho phép trả
    return allSameNCC || allSameCustomer;
  }

  prepareExportData(rows: any[]): any[] {
    return rows.map((row, index) => ({
      ID: 0,
      STT: index + 1,
      Note: row.BillCode,
      ...row
    }));
  }

  openExportDialog() {
    if (this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng');
      return;
    }

    if (!this.validateSameSupplier(this.selectedRows)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn cần chọn cùng NCC hoặc Khách hàng');
      return;
    }

    // Lấy dữ liệu từ row đầu tiên theo logic WinForms
    const firstRow = this.selectedRows[0];
    // Lấy DeliverID - có thể từ nhiều field khác nhau
    const deliverID = firstRow.DeliverID || firstRow.deliverID || firstRow.DeliverId || 0;
    // Lấy SupplierID - có thể từ nhiều field khác nhau
    const supplierID = firstRow.supplierID || firstRow.suplierID || firstRow.SupplierID || 
                       firstRow.SupplierId || firstRow.supplierId || 0;
    // Lấy BillCode
    const BillCode = firstRow.BillCode || '';
    // Lấy CustomerID - có thể từ nhiều field khác nhau
    const customerID = firstRow.customerID || firstRow.CustomerID || firstRow.CustomerId || 
                       firstRow.customerId || 0;

    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: false,
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'full-screen-modal'
    });

    modalRef.componentInstance.dataInput = {
      details: this.prepareExportData(this.selectedRows)
    };
    modalRef.componentInstance.warehouseID = this.filter.warehouseId;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.openFrmSummary = true;
    modalRef.componentInstance.deliverID = deliverID;
    modalRef.componentInstance.supplierID = supplierID;
    modalRef.componentInstance.BillCode = BillCode;
    modalRef.componentInstance.customerID = customerID;
    modalRef.componentInstance.fromBorrowHistory = true; // Flag để phân biệt luồng từ check-history-tech

    modalRef.result.then(
      (ok: any) => {
        if (ok) {
          this.selectedRows = [];
          this.loadData();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onSearch() {
    this.loadData();
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
