import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import { PONCCService } from '../poncc.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { ProjectService } from '../../../project/project-service/project.service';

@Component({
  selector: 'app-poncc-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSplitterModule,
    NzSpinComponent,
  ],
  templateUrl: './poncc-summary.component.html',
  styleUrl: './poncc-summary.component.css'
})
export class PonccSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('table_ponccSummary', { static: false }) tableRef!: ElementRef;
  table!: Tabulator;
  public activeModal = inject(NgbActiveModal);

  get modalTitle(): string {
    return 'TỔNG HỢP PO NCC';
  }

  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  supplierId: number = 0;
  employeeId: number = 0;
  status: number = -1;
  filterText: string = '';
  sizeSearch: string = '0';
  suppliers: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;

  constructor(
    private srv: PONCCService,
    private notify: NzNotificationService,
    private projectService: ProjectService,
    private supplierSaleService: SupplierSaleService,
  ) { }

  ngOnInit(): void {
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    this.initTable();
    setTimeout(() => {
      this.onSearch();
    }, 0);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  resetSearch(): void {
    this.dateStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.dateEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    this.supplierId = 0;
    this.employeeId = 0;
    this.status = -1;
    this.filterText = '';
    this.onSearch();
  }

  private loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => (this.suppliers = res.data || []),
      error: (error: any) => {
        this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhà cung cấp: ' + error.message);
      },
    });
  }

  onSearch(): void {
    this.isLoading = true;
    const dateStartCopy = new Date(this.dateStart);
    dateStartCopy.setHours(0, 0, 0, 0);
    const dateEndCopy = new Date(this.dateEnd);
    dateEndCopy.setHours(23, 59, 59, 999);

    const request = {
      FilterText: this.filterText?.trim() || '',
      DateStart: dateStartCopy.toISOString(),
      DateEnd: dateEndCopy.toISOString(),
      SupplierID: this.supplierId || 0,
      Status: this.status === -1 ? undefined : this.status,
      EmployeeID: this.employeeId || 0,
    };

    this.srv.getPONCCSummary(request).subscribe({
      next: (response) => {
        const data = response.data || [];
        this.table?.setData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(NOTIFICATION_TITLE.error, 'Không tải được dữ liệu tổng hợp PO NCC: ' + (error.message || ''));
      },
    });
  }

  private initTable() {
    const columns: ColumnDefinition[] = [
      {
        title: 'Ngày đơn hàng', field: 'RequestDate', width: 110, headerSort: false, hozAlign: 'center',
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
        , frozen: true
      },
      { title: 'Công ty nhập', field: 'CompanyText', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea', frozen: true },
      { title: 'Số đơn hàng', field: 'BillCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea', bottomCalc: 'count', frozen: true },
      { title: 'Diễn giải', field: 'Note', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Ngày giao hàng', field: 'DeliveryDate', width: 110, headerSort: false, hozAlign: 'center',
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
      },
      { title: 'Mã nhà cung cấp', field: 'CodeNCC', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên nhà cung cấp', field: 'NameNCC', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã dự án', field: 'ProjectCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên dự án', field: 'ProjectName', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Số PO', field: 'POCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Tên hàng', field: 'ProductName', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã sản phẩm', field: 'ProductCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Mã sản phẩm NCC', field: 'ProductCodeOfSupplier', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Hãng', field: 'Maker', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Đơn vị tính', field: 'UnitName', width: 100, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Loại tiền', field: 'CurrencyName', width: 100, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Đơn giá mua chưa VAT', field: 'UnitPrice', width: 140, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Đơn giá mua có VAT', field: 'UnitPriceVAT', width: 140, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Số lượng đặt hàng', field: 'QtyRequest', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0)
      },
      {
        title: 'Số lượng đã nhận', field: 'QuantityReturn', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0)
      },
      {
        title: 'Số lượng còn lại', field: 'QuantityRemain', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0)
      },
      {
        title: 'Giá trị hàng quy đổi', field: 'TotalMoneyChangePO', width: 150, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Giá trị đặt hàng', field: 'TotalPrice', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'Tình trạng', field: 'StatusText', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Nhân viên mua hàng', field: 'FullName', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      { title: 'Phân loại NCC/NCC mới', field: 'NCCNew', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Công nợ', field: 'DeptSupplier', width: 80, headerSort: false, hozAlign: 'center',
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      { title: 'Điều khoản thanh toán', field: 'RulePayName', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Phí vận chuyển', field: 'FeeShip', width: 120, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Giá bán', field: 'PriceSale', width: 120, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Deadline Giao hàng', field: 'DeadlineDelivery', width: 130, headerSort: false, hozAlign: 'center',
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
      },
      {
        title: 'Giá lịch sử', field: 'PriceHistory', width: 120, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Giá chào thầu', field: 'BiddingPrice', width: 120, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()),
        bottomCalc: 'sum',
        bottomCalcFormatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'NCC xử lý chứng từ', field: 'SupplierVoucher', width: 150, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Stock kho hiện tại', field: 'TotalQuantityLast', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0),
        bottomCalc: 'sum',
      },
      {
        title: 'Ghi chú stock kho', field: 'MinQuantity', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 0)
      },
      {
        title: 'Thuế VAT', field: 'VAT', width: 100, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue(), 2)
      },
      {
        title: 'Tỷ giá', field: 'CurrencyRate', width: 100, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Hóa đơn', field: 'IsBill', width: 80, headerSort: false, hozAlign: 'center',
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      {
        title: 'Ngày yêu cầu nhập kho', field: 'DateRequestImport', width: 150, headerSort: false, hozAlign: 'center',
        formatter: (cell: any) => this.formatDateDDMMYYYY(cell.getValue())
      },

      { title: 'Số phiếu nhập', field: 'BillImportCode', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Đơn giá bán Admin', field: 'UnitPricePOKH', width: 140, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue()),
        bottomCalc: 'sum',
        bottomCalcFormatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Không đạt chất lượng', field: 'OrderQualityNotMet', width: 150, headerSort: false, hozAlign: 'center',
        formatter: function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
      },
      { title: 'Lý do không đạt', field: 'ReasonForFailure', width: 200, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
      {
        title: 'Tiền giảm thuế', field: 'TaxReduction', width: 130, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      {
        title: 'Chi phí FE', field: 'COFormE', width: 120, headerSort: false, hozAlign: 'right',
        formatter: (cell: any) => this.formatNumberEnUS(cell.getValue())
      },
      { title: 'Số hóa đơn', field: 'SomeBill', width: 120, headerSort: false, hozAlign: 'left', formatter: 'textarea' },
    ];

    if (this.tableRef) {
      this.table = new Tabulator(this.tableRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        columns: columns,
        rowHeader: false,

        data: [],
        layout: 'fitDataStretch',
        paginationMode: 'local',
      } as any);
    }
  }

  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  private formatDateDDMMYYYY(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const p2 = (n: number) => String(n).padStart(2, '0');
      return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  }

  /**
   * Export table to Excel with footer using ExcelJS
   */
  async onExportToExcel(): Promise<void> {
    if (!this.table) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const data = this.table.getData();
    if (!data || data.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    // Format dates for filename: DDMMYY
    const formatDate = (date: Date | null): string => {
      if (!date) return new Date().toLocaleDateString('en-GB').split('/').map(p => p.padStart(2, '0')).join('').slice(0, 6);
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}${month}${year}`;
    };

    const dateStartStr = formatDate(this.dateStart);
    const dateEndStr = formatDate(this.dateEnd);
    const fileName = `TongHopPONCC_${dateStartStr}_${dateEndStr}.xlsx`;

    // Use ExcelJS to create workbook
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tổng hợp PO NCC');

    // Get visible columns
    const columns = this.table.getColumns();
    const visibleColumns = columns
      .map((col: any) => col.getDefinition())
      .filter((def: any) => def.formatter !== 'rowSelection');

    const headers = visibleColumns.map((def: any) => def.title);

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Times New Roman', size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '32A441' } // Màu xanh lá
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 25;

    // Set font Times New Roman size 10 for header cells
    headerRow.eachCell((cell) => {
      cell.font = { ...cell.font, name: 'Times New Roman', size: 10 };
    });

    // Detect columns with bottomCalc
    const sumFields: string[] = [];
    const countFields: string[] = [];
    visibleColumns.forEach((col: any) => {
      if (col.bottomCalc === 'sum') {
        sumFields.push(col.field);
      } else if (col.bottomCalc === 'count') {
        countFields.push(col.field);
      }
    });

    // Initialize totals
    const totals: any = {};
    sumFields.forEach(field => totals[field] = 0);
    countFields.forEach(field => totals[field] = 0);

    // Add data rows
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.field;
        let value = row[field];

        // Calculate sum
        if (sumFields.includes(field) && value) {
          totals[field] += Number(value) || 0;
        }

        // Calculate count
        if (countFields.includes(field)) {
          totals[field] += 1;
        }

        // Format boolean
        if (typeof value === 'boolean') {
          return value ? 'V' : 'X';
        }

        // Format date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      const dataRow = worksheet.addRow(rowData);
      dataRow.alignment = { vertical: 'middle', wrapText: true };

      dataRow.eachCell((cell, colNumber) => {
        const field = visibleColumns[colNumber - 1]?.field;
        const colDef = visibleColumns[colNumber - 1];

        // Set font Times New Roman size 10
        cell.font = { name: 'Times New Roman', size: 10 };

        // Set alignment based on column definition
        if (colDef?.hozAlign === 'right') {
          cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
        } else if (colDef?.hozAlign === 'center') {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }

        if (sumFields.includes(field)) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }

        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Add footer row
    const footerData = visibleColumns.map((col: any) => {
      const field = col.field;

      if (sumFields.includes(field)) {
        return totals[field];
      }

      if (countFields.includes(field)) {
        return totals[field];
      }

      if (field === visibleColumns[0].field) {
        return 'Tổng cộng';
      }

      return '';
    });

    const footerRow = worksheet.addRow(footerData);
    footerRow.font = { bold: true, name: 'Times New Roman', size: 10 };
    footerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    footerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    footerRow.eachCell((cell, colNumber) => {
      const field = visibleColumns[colNumber - 1]?.field;
      const colDef = visibleColumns[colNumber - 1];

      // Set font Times New Roman size 10
      cell.font = { bold: true, name: 'Times New Roman', size: 10 };

      // Set alignment based on column definition
      if (colDef?.hozAlign === 'right') {
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
      } else if (colDef?.hozAlign === 'center') {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      if (sumFields.includes(field) || countFields.includes(field)) {
        cell.numFmt = '#,##0';
      }
    });

    // Set column width based on Tabulator column width (convert pixels to Excel width)
    // Excel width unit is approximately 1/7 of a character width
    // Tabulator width is in pixels, roughly 1 pixel = 0.14 Excel units
    worksheet.columns = visibleColumns.map((colDef: any) => {
      const tabulatorWidth = colDef.width || 120;
      // Convert pixels to Excel width: approximately 1 pixel = 0.14 Excel units
      // But we'll use a more practical conversion: width in pixels / 7
      const excelWidth = Math.max(tabulatorWidth / 7, 8); // Minimum width 8
      return { width: Math.min(excelWidth, 50) }; // Maximum width 50
    });

    // Download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
