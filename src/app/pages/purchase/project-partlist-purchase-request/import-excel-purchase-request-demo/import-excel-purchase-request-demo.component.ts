import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as ExcelJS from 'exceljs';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { DateTime } from 'luxon';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { log } from 'ng-zorro-antd/core/logger';

@Component({
  selector: 'app-import-excel-purchase-request-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzProgressModule,
    NzInputModule,
  ],
  templateUrl: './import-excel-purchase-request-demo.component.html',
  styleUrl: './import-excel-purchase-request-demo.component.css'
})
export class ImportExcelPurchaseRequestDemoComponent implements OnInit, OnDestroy {
  constructor(
    public activeModal: NgbActiveModal,
    private service: ProjectPartlistPurchaseRequestService,
    private notification: NzNotificationService,
  ) { }

  @Input() warehouseID: number = 0;
  @Input() warehouseType: number = 1;
  @Input() projectPartListID: number = 0;
  /** Truyền từ component cha để tránh gọi API lại */
  @Input() supplierSales: any[] = [];
  @Input() productGroupsRTC: any[] = [];

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  dataTableExcel: any[] = [];
  displayText: string = '';
  displayProgress: number = 0;
  isSaving: boolean = false;

  private workbook: ExcelJS.Workbook | null = null;
  private table: Tabulator | null = null;

  ngOnInit() {
    if (!this.productGroupsRTC.length) {
      this.service.getProductGroupsRTC(this.warehouseType).subscribe({
        next: (res) => { this.productGroupsRTC = res || []; },
      });
    }
    if (!this.supplierSales.length) {
      this.service.getSupplierSales().subscribe({
        next: (res) => {
          this.supplierSales = res || []; console.log('suppliersale', this.supplierSales);
        },
      });
    }
  }

  ngOnDestroy() {
    this.table?.destroy();
  }

  // ─── File ─────────────────────────────────────────────────────────────────

  openFileExplorer() {
    document.getElementById('fileImportInput')?.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.filePath = file.name;
    this.displayText = 'Đang đọc file...';
    this.displayProgress = 20;

    this.workbook = new ExcelJS.Workbook();
    await this.workbook.xlsx.load(await file.arrayBuffer());

    this.excelSheets = this.workbook.worksheets.map(s => s.name);
    this.selectedSheet = this.excelSheets[0] || '';
    this.displayProgress = 50;
    if (this.selectedSheet) this.readSheet();
    // Reset input để có thể chọn lại cùng file
    input.value = '';
  }

  onSheetChange() {
    if (this.selectedSheet) this.readSheet();
  }

  // ─── Excel parse ──────────────────────────────────────────────────────────

  readSheet() {
    if (!this.workbook || !this.selectedSheet) return;
    const sheet = this.workbook.getWorksheet(this.selectedSheet);
    if (!sheet) return;

    const rows: any[] = [];
    let stt = 1;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ header

      const productCode = this.getCellText(row.getCell(1));
      const productName = this.getCellText(row.getCell(2));
      if (!productCode && !productName) return; // bỏ dòng trống

      rows.push({
        _stt: stt++,
        ProductCode: productCode,
        ProductName: productName,
        Quantity: Number(this.getCellText(row.getCell(3))) || 0,
        UnitName: this.getCellText(row.getCell(4)),
        Maker: this.getCellText(row.getCell(5)),
        Note: this.getCellText(row.getCell(6)),
        ProductGroupName: this.getCellText(row.getCell(7)),
        SupplierCode: this.getCellText(row.getCell(8)),
        SupplierName: this.getCellText(row.getCell(9)),
        DateReturnExpected: this.getCellDate(row.getCell(10)),
        ['_hasError']: false,
        ['_errorMsgs']: [] as string[],
      });
    });

    rows.forEach(r => this.validateRow(r));
    this.dataTableExcel = rows;
    this.displayProgress = 100;
    this.displayText = `Đọc xong ${rows.length} dòng`;
    this.initTable();
  }

  private getCellText(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (v === null || v === undefined) return '';
    if (typeof v === 'object' && 'richText' in (v as any))
      return (v as any).richText.map((r: any) => r.text).join('');
    if (typeof v === 'object' && 'formula' in (v as any))
      return (v as any).result?.toString().trim() || '';
    if (v instanceof Date)
      return DateTime.fromJSDate(v).toFormat('dd/MM/yyyy');
    return v.toString().trim();
  }

  private getCellDate(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (!v) return '';
    if (v instanceof Date) return DateTime.fromJSDate(v).toFormat('dd/MM/yyyy');
    if (typeof v === 'number') {
      const d = new Date((v - 25569) * 86400 * 1000);
      return DateTime.fromJSDate(d).toFormat('dd/MM/yyyy');
    }
    return v.toString().trim();
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  validateRow(row: any) {
    const errors: string[] = [];
    if (!row.ProductCode) errors.push('Mã sản phẩm không được trống');
    if (!row.ProductName) errors.push('Tên sản phẩm không được trống');
    if (!row.Quantity || Number(row.Quantity) <= 0) errors.push('Qty phải lớn hơn 0');
    if (!row.UnitName) errors.push('Đơn vị không được trống');
    if (!row.Maker) errors.push('Hãng không được trống');
    if (!row.ProductGroupName) errors.push('Loại nhóm không được trống');
    if (!row.SupplierCode && !row.SupplierName) errors.push('Nhà cung cấp không được trống');
    if (!row.DateReturnExpected) errors.push('Ngày trả dự kiến không được trống');
    row['_hasError'] = errors.length > 0;
    row['_errorMsgs'] = errors;
  }

  // ─── Tabulator ────────────────────────────────────────────────────────────

  private initTable() {
    if (this.table) { this.table.destroy(); this.table = null; }

    this.table = new Tabulator('#importRtcTable', {
      data: this.dataTableExcel,
      layout: 'fitDataFill',
      height: '100%',
      rowFormatter: (row) => {
        row.getElement().style.backgroundColor = row.getData()['_hasError'] ? '#fff1f0' : '';
      },
      columns: [
        {
          title: 'STT', field: '_stt', width: 50,
          hozAlign: 'center', headerHozAlign: 'center', frozen: true,
        },
        {
          title: 'Mã sản phẩm', field: 'ProductCode', width: 130, editor: 'input',
          formatter: (cell) => this.requiredCellFormatter(cell, 'Mã sản phẩm'),
          cellEdited: (cell) => this.onCellEdited(cell),
        },
        {
          title: 'Tên sản phẩm', field: 'ProductName', width: 200, editor: 'input',
          formatter: (cell) => this.requiredCellFormatter(cell, 'Tên sản phẩm'),
          cellEdited: (cell) => this.onCellEdited(cell),
        },
        {
          title: 'Qty', field: 'Quantity', width: 70, hozAlign: 'right',
          editor: 'number', editorParams: { min: 0 },
          formatter: (cell) => this.requiredCellFormatter(cell, 'Qty'),
          cellEdited: (cell) => this.onCellEdited(cell),
        },
        { title: 'Đơn vị', field: 'UnitName', width: 80, editor: 'input' },
        { title: 'Maker', field: 'Maker', width: 110, editor: 'input' },
        { title: 'Ghi Chú', field: 'Note', width: 200, editor: 'input' },
        {
          title: 'Loại nhóm', field: 'ProductGroupName', width: 160, editor: 'input',
          formatter: (cell: any) => this.requiredCellFormatter(cell, 'Loại nhóm'),
          cellEdited: (cell: any) => this.onCellEdited(cell),
        },
        {
          title: 'Mã NCC', field: 'SupplierCode', width: 100, editor: 'input',
          formatter: (cell: any) => this.requiredCellFormatter(cell, 'Mã NCC'),
          cellEdited: (cell: any) => this.onCellEdited(cell),
        },
        { title: 'Nhà cung cấp', field: 'SupplierName', width: 160, editor: 'input' },
        {
          title: 'Ngày trả dự kiến', field: 'DateReturnExpected', width: 150, editor: 'input',
          editorParams: { elementAttributes: { placeholder: 'dd/MM/yyyy' } },
          formatter: (cell) => this.requiredCellFormatter(cell, 'Ngày trả dự kiến'),
          cellEdited: (cell) => this.onCellEdited(cell),
        },
        {
          title: '', field: '_del', width: 38, hozAlign: 'center', headerSort: false,
          formatter: () => '<span style="color:#ff4d4f;cursor:pointer;font-size:14px">✕</span>',
          cellClick: (_e, cell) => {
            cell.getRow().delete();
            this.syncDataFromTable();
          },
        },
      ],
    });
  }

  private requiredCellFormatter(cell: any, label: string): string {
    const val = cell.getValue();
    const empty = val === null || val === undefined || val === '' || val === 0;
    const el = cell.getElement() as HTMLElement;
    if (empty) {
      el.style.border = '1px solid #ff4d4f';
      el.title = `${label} không được trống`;
    } else {
      el.style.border = '';
      el.title = '';
    }
    return val?.toString() ?? '';
  }

  private onCellEdited(cell: any) {
    this.validateRow(cell.getRow().getData());
    cell.getRow().reformat();
    this.syncDataFromTable();
  }

  private syncDataFromTable() {
    this.dataTableExcel = this.table?.getData() || [];
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  saveExcelData() {
    if (!this.table) return;
    const data: any[] = this.table.getData();
    if (!data.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    data.forEach(r => this.validateRow(r));
    const invalid = data.filter(r => r['_hasError']);
    if (invalid.length) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Có ${invalid.length} dòng chưa hợp lệ. Vui lòng kiểm tra lại!`
      );
      this.table.replaceData(data);
      return;
    }

    const models = data.map(r => this.buildModel(r));
    this.isSaving = true;
    this.displayProgress = 50;
    this.displayText = `Đang lưu ${models.length} dòng...`;

    this.service.saveDataRTCExcel(models).subscribe({
      next: () => {
        this.isSaving = false;
        this.displayProgress = 100;
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Lưu thành công ${models.length} dòng!`
        );
        this.activeModal.close({ success: true, count: models.length });
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Lưu thất bại!'
        );
      },
    });
  }

  private buildModel(row: any): any {
    console.log('productgroup', this.productGroupsRTC);
    
    const group = this.productGroupsRTC.find(
      (g: any) => g.ProductGroupName === row.ProductGroupName || g.Name === row.ProductGroupName
    );
    console.log('foundProductgroup', group);

    const supplier = this.supplierSales.find(
      (s: any) => s.CodeNCC === row.SupplierCode
        || s.NameNCC === row.SupplierName
    );

    return {
      ProductCode: row.ProductCode || '',
      ProductName: row.ProductName || '',
      Quantity: Number(row.Quantity) || 0,
      UnitName: row.UnitName || '',
      Maker: row.Maker || '',
      Note: row.Note || '',
      ProductGroupRTCID: group?.ID || 0,
      SupplierSaleID: supplier?.ID || 0,
      DateReturnExpected: this.toIsoDate(row.DateReturnExpected),
      TicketType: 1,
      IsTechBought: true,
      ProjectPartListID: this.projectPartListID || 0,
      WarehouseID: this.warehouseID || 0,
    };
  }

  private toIsoDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const dt = DateTime.fromFormat(dateStr, 'dd/MM/yyyy');
    if (dt.isValid) return dt.toISO();
    const dt2 = DateTime.fromISO(dateStr);
    if (dt2.isValid) return dt2.toISO();
    return null;
  }

  // ─── Template ─────────────────────────────────────────────────────────────

  downloadTemplate() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Template');
    const headers = [
      'Mã sản phẩm', 'Tên sản phẩm', 'Qty', 'Đơn vị', 'Maker',
      'Ghi Chú', 'Loại nhóm', 'Mã nhà cung cấp', 'Nhà cung cấp', 'Ngày trả dự kiến',
    ];
    ws.addRow(headers);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, name: 'Tahoma', size: 10 };
    headerRow.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    headers.forEach((_, i) => { ws.getColumn(i + 1).width = 20; });

    wb.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-import-rtc.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}
