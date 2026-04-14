import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ɵNzTransitionPatchDirective } from "ng-zorro-antd/core/transition-patch";
import { CommercialPriceRequestServiceService } from '../commercial-price-request-service/commercial-price-request-service.service';

@Component({
  selector: 'app-commercial-price-request-import-excel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzProgressModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    ɵNzTransitionPatchDirective
  ],
  templateUrl: './commercial-price-request-import-excel.component.html',
  styleUrl: './commercial-price-request-import-excel.component.css'
})
export class CommercialPriceRequestImportExcelComponent implements OnInit, AfterViewInit {

  @Input() rfqNo: string = '';
  @Output() dataSaved = new EventEmitter<any[]>();

  // ── State ────────────────────────────────────────────────────────────────
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  workbook: ExcelJS.Workbook | null = null;

  dataTableExcel: any[] = [];
  totalRowsAfterFileRead = 0;

  displayProgress = 0;
  displayText = 'Chưa có file nào được chọn';

  isSaving = false;

  private tableExcel: any;

  constructor(
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private commercialPriceRequestService: CommercialPriceRequestServiceService
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initTable();
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  initTable(): void {
    if (this.tableExcel) {
      this.tableExcel.setColumns(this.getTableColumns() as any);
      return;
    }
    this.tableExcel = new Tabulator('#priceRequestImportTable', {
      data: this.dataTableExcel,
      layout: 'fitDataStretch',
      height: '100%',
      selectableRows: false,
      movableColumns: true,
      reactiveData: true,
      columns: this.getTableColumns() as any,
    });
    this.tableExcel.on('cellEdited', (cell: any) => {
      const rd = cell.getRow().getData();
      const idx = this.dataTableExcel.findIndex(r => r === rd);
      if (idx !== -1) this.dataTableExcel[idx] = { ...rd };
    });
  }

  /** Custom Tabulator editor dùng input[type=date], lưu giá trị dd/MM/yyyy */
  private dateEditorFn(): (cell: any, onRendered: any, success: any, cancel: any) => HTMLElement {
    return (cell, onRendered, success, cancel) => {
      const currentVal: string = cell.getValue() ?? '';

      // Convert dd/MM/yyyy → yyyy-MM-dd cho input[type=date]
      const toInputVal = (v: string): string => {
        if (!v) return '';
        // dd/MM/yyyy
        const m1 = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
        // yyyy-MM-dd đã chuẩn
        const m2 = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m2) return v;
        return '';
      };

      const input = document.createElement('input');
      input.setAttribute('type', 'date');
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
      input.style.border = 'none';
      input.style.padding = '2px 4px';
      input.style.fontSize = '13px';
      input.value = toInputVal(currentVal);

      onRendered(() => { input.focus(); });

      const commit = () => {
        if (!input.value) { cancel(); return; }
        // Convert yyyy-MM-dd → dd/MM/yyyy
        const [y, mo, d] = input.value.split('-');
        success(`${d}/${mo}/${y}`);
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      });

      return input;
    };
  }

  getTableColumns(): object[] {
    const e = true;
    const dateEditor = this.dateEditorFn();
    return [
      {
        title: '', field: '_del', hozAlign: 'center', headerHozAlign: 'center',
        width: 40, resizable: false, editable: false, headerSort: false,
        formatter: () => `<span class="fa-lg fa-solid fa-trash p-menubar-item-icon text-danger" ng-reflect-p-bind="[object Object]" tabindex="-1" title="Xoá dòng"></span>`,
        cellClick: (_e: any, cell: any) => {
          cell.getRow().delete();
          // Cập nhật lại STT sau khi xóa
          this.tableExcel?.getRows().forEach((row: any, i: number) => {
            row.update({ _stt: i + 1 });
          });
        },
      },
      { title: 'STT', field: '_stt', hozAlign: 'center', headerHozAlign: 'center', width: 60, editable: false },
      { title: 'RFQ No', field: 'RfqNo', hozAlign: 'left', headerHozAlign: 'center', editor: e ? 'input' : false, width: 120 },
      {
        title: 'Request Seq', field: 'RequestSeq', hozAlign: 'center', headerHozAlign: 'center',
        editor: e ? 'number' : false, width: 120,
        formatter: 'money', formatterParams: { symbol: '', precision: 0, thousand: ',' },
      },
      { title: 'Item Code', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center', editor: e ? 'input' : false, width: 200 },
      { title: 'Description', field: 'Description', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 200 },
      { title: 'Specification', field: 'Specification', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 300 },
      {
        title: 'Est. Qty', field: 'Qty', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 100,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        },
      },
      { title: 'Unit', field: 'Unit', hozAlign: 'center', headerHozAlign: 'center', editor: e ? 'input' : false, width: 100 },
      {
        title: 'MOQ', field: 'Moq', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 100,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        },
      },
      { title: 'Giờ Admin gửi', field: 'AdminSentAtHour', hozAlign: 'center', headerHozAlign: 'center', editor: e ? 'input' : false, width: 110 },
      { title: 'Ngày Admin gửi', field: 'AdminSentAtDate', hozAlign: 'center', headerHozAlign: 'center', editor: e ? dateEditor : false, width: 150 },
      { title: 'Hạn check giá', field: 'QuoteDeadline', hozAlign: 'center', headerHozAlign: 'center', editor: e ? dateEditor : false, width: 150 },
      { title: 'Giờ Pur gửi', field: 'PurSentAtHour', hozAlign: 'right', headerHozAlign: 'center', editor: e ? 'input' : false, width: 110 },
      { title: 'Ngày Pur gửi', field: 'PurSentAtDate', hozAlign: 'center', headerHozAlign: 'center', editor: e ? dateEditor : false, width: 150 },
      {
        title: 'Unit Price', field: 'UnitPrice', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 130,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        },
      },
      {
        title: 'Chi phí vận chuyển', field: 'ShippingCost', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 160,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        },
      },
      { title: 'Nhà cung cấp', field: 'Supplier', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 150 },
      { title: 'Leadtime', field: 'Leadtime', hozAlign: 'center', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 150 },
      { title: 'Ghi chú', field: 'RequestNote', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'textarea' : false, width: 200 },
      { title: 'Note của Sales', field: 'SaleNote', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'textarea' : false, width: 200 },
      {
        title: 'Tỉ lệ margin', field: 'MarginRate', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 140,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
        },
      },
      {
        title: 'Đơn giá báo', field: 'SaleUnitPrice', hozAlign: 'right', headerHozAlign: 'center',
        editor: e ? 'input' : false, width: 130,
        formatter: (cell: any) => {
          const v = this.parseFormattedNumber(cell.getValue());
          if (isNaN(v)) return cell.getValue() ?? '';
          return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        },
      },
      { title: 'Ghi chú', field: 'ImportPriceNote', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'textarea' : false, width: 200 },
      { title: 'Sale báo giá', field: 'IsSaleQuotedText', hozAlign: 'center', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 120 },
      { title: 'Pur check giá', field: 'IsPurQuotedText', hozAlign: 'center', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'input' : false, width: 120 },
      { title: 'Ghi chú lý do', field: 'NoteReason', hozAlign: 'left', headerHozAlign: 'center', formatter: 'textarea', editor: e ? 'textarea' : false, width: 200 },
      { title: 'Tuần', field: 'WeekNo', hozAlign: 'center', headerHozAlign: 'center', editor: e ? 'number' : false, width: 80 },
      { title: 'Tháng', field: 'MonthNo', hozAlign: 'center', headerHozAlign: 'center', editor: e ? 'number' : false, width: 80 },
      { title: 'Năm', field: 'YearNo', hozAlign: 'center', headerHozAlign: 'center', editor: e ? 'number' : false, width: 90 },
    ];

  }

  // ── File ──────────────────────────────────────────────────────────────────
  openFileExplorer(): void {
    document.getElementById('filePriceInput')?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.notification.warning('Thông báo', 'Vui lòng chọn file Excel (.xlsx / .xls)!');
      input.value = '';
      return;
    }

    this.filePath = file.name;
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.totalRowsAfterFileRead = 0;
    this.workbook = null;
    this.displayProgress = 0;
    this.displayText = 'Đang đọc file...';

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        this.displayProgress = Math.round((e.loaded / e.total) * 100);
        this.displayText = `Đang tải: ${this.displayProgress}%`;
      }
    };
    reader.onload = async (e: any) => {
      try {
        this.workbook = new ExcelJS.Workbook();
        await this.workbook.xlsx.load(e.target.result);
        this.excelSheets = this.workbook.worksheets
          .filter(ws => ws.state === 'visible')
          .map(ws => ws.name);
        if (this.excelSheets.length > 0) {
          this.selectedSheet = this.excelSheets[0];
          await this.readSheet(this.selectedSheet);
        } else {
          this.notification.warning('Thông báo', 'File không có sheet nào!');
          this.resetState();
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Không thể đọc file Excel!');
        this.resetState();
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  async onSheetChange(): Promise<void> {
    if (this.selectedSheet && this.workbook) {
      await this.readSheet(this.selectedSheet);
    }
  }

  async readSheet(sheetName: string): Promise<void> {
    try {
      const ws = this.workbook?.getWorksheet(sheetName);
      if (!ws) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

      const rows: any[] = [];
      let stt = 0;
      ws.eachRow((row, rowNum) => {
        if (rowNum < 2) return;
        const rfq = this.getCellText(row.getCell(1)).trim();
        const prodName = this.getCellText(row.getCell(4)).trim();
        if (!rfq && !prodName) return;
        stt++;
        rows.push({
          _stt: stt,
          ID: 0,
          RfqNo: this.getCellText(row.getCell(1)),       // A
          RequestSeq: this.getCellText(row.getCell(2)),  // B
          ProductCode: this.getCellText(row.getCell(3)), // C
          Description: this.getCellText(row.getCell(4)), // D
          ProductName: this.getCellText(row.getCell(5)), // E
          Specification: this.getCellText(row.getCell(5)), // E
          Qty: this.getCellText(row.getCell(6)),          // F
          Unit: this.getCellText(row.getCell(7)),         // G
          Moq: this.getCellText(row.getCell(8)),          // H
          AdminSentAtHour: this.parseTime(row.getCell(9)),   // I  - nvarchar (giờ)
          AdminSentAtDate: this.getCellDate(row.getCell(10)), // J  - date
          QuoteDeadline: this.getCellDate(row.getCell(11)),   // K  - date
          PurSentAtHour: this.parseTime(row.getCell(12)),   // L  - nvarchar (giờ)
          PurSentAtDate: this.getCellDate(row.getCell(13)),   // M  - date
          UnitPrice: this.getCellText(row.getCell(14)),        // N
          ShippingCost: this.getCellText(row.getCell(15)),     // O
          Supplier: this.getCellText(row.getCell(16)),         // P
          Leadtime: this.getCellText(row.getCell(17)),         // Q
          RequestNote: this.getCellText(row.getCell(18)),      // R
          SaleNote: this.getCellText(row.getCell(19)),         // S
          MarginRate: this.getCellText(row.getCell(20)),       // T
          SaleUnitPrice: this.getCellText(row.getCell(21)),    // U
          ImportPriceNote: this.getCellText(row.getCell(22)), // V
          IsSaleQuotedText: this.getCellText(row.getCell(23)),// W
          IsPurQuotedText: this.getCellText(row.getCell(24)), // X
          NoteReason: this.getCellText(row.getCell(25)),       // Y
          WeekNo: this.getCellText(row.getCell(26)),           // Z
          MonthNo: this.getCellText(row.getCell(27)),          // AA
          YearNo: this.getCellText(row.getCell(28)),           // AB
        });
      });

      this.dataTableExcel = rows;
      this.totalRowsAfterFileRead = rows.length;
      this.displayProgress = 0;
      this.displayText = rows.length === 0
        ? 'Không có dữ liệu hợp lệ trong sheet.'
        : `Đã đọc ${rows.length} bản ghi`;

      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        this.initTable();
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể đọc dữ liệu từ sheet!');
      this.resetState();
    }
  }

  // ── Validate (removed – invalid fields will be sent as null) ─────────────

  /** Parse time values from excel, convert format 6.5 -> 06:30, 6 giờ 30 -> 06:30, or excel native time */
  private parseTime(cell: any): string {
    if (!cell) return '';
    try {
      let v = cell.value;
      if (typeof v === 'object' && v !== null && 'formula' in v) {
        v = cell.result ?? cell.text ?? '';
      }

      // If Excel parses it as Date (e.g. 08:30 -> Date object)
      if (v instanceof Date) {
        // ExcelJS returns dates in UTC. A time like 6:30 is parsed as 1899-12-30T06:30:00.000Z.
        // Using local getHours() in 1899 would apply historical +07:06:40 offset, yielding 13:36.
        // getUTCHours() fixes exactly this issue.
        const h = String(v.getUTCHours()).padStart(2, '0');
        const m = String(v.getUTCMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }

      let textVal = cell.text;
      if (textVal === undefined || textVal === null || textVal === '') {
        textVal = v;
      }
      const s = String(textVal).trim().replace(',', '.');
      if (!s || s === 'null' || s === 'undefined') return '';

      // fractional hour like 6.5 -> 06:30 or 0.35416 -> 08:30 (excel native time proportion of 1 day)
      if (!isNaN(Number(s)) && s.includes('.')) {
        const num = Number(s);
        if (num < 1) {
          const totalMins = Math.round(num * 24 * 60);
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        } else {
          const h = Math.floor(num);
          const m = Math.round((num - h) * 60);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }

      // "6 giờ 30", "06 giơ 30"
      const mText = s.match(/^(\d{1,2})\s*gi[ờo]\s*(\d{1,2})$/i);
      if (mText) {
        return `${String(mText[1]).padStart(2, '0')}:${String(mText[2]).padStart(2, '0')}`;
      }

      // "6 giờ"
      const mText2 = s.match(/^(\d{1,2})\s*gi[ờo]$/i);
      if (mText2) {
        return `${String(mText2[1]).padStart(2, '0')}:00`;
      }

      // "8h" => 08:00
      const mText3 = s.match(/^(\d{1,2})h$/i);
      if (mText3) {
        return `${String(mText3[1]).padStart(2, '0')}:00`;
      }

      return s;
    } catch { return ''; }
  }



  // ── Save ──────────────────────────────────────────────────────────────────
  async saveExcelData(): Promise<void> {
    if (!this.tableExcel) {
      this.notification.warning('Thông báo', 'Bảng chưa sẵn sàng!');
      return;
    }
    const data: any[] = this.tableExcel.getData();
    if (!data.length) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }
    this.performImport(data);
  }

  private performImport(data: any[]): void {

    const normalizeNum = (v: any) => {
      const n = this.parseFormattedNumber(v);
      return isNaN(n) ? null : n;
    };

    // Convert date columns to ISO format (yyyy-MM-dd) and numeric fields
    const payload = data.map(row => ({
      ID: row.ID ?? 0,
      RfqNo: row.RfqNo,
      RequestSeq: row.RequestSeq?.toString() || null,
      ProductCode: row.ProductCode,
      ProductName: row.ProductName,
      Description: row.Description,
      Specification: row.Specification,
      Qty: row.Qty?.toString() || null,
      Unit: row.Unit,
      Moq: row.Moq?.toString() || null,
      AdminSentAtHour: this.toNullableHour(row.AdminSentAtHour),
      AdminSentAtDate: this.toIsoDate(row.AdminSentAtDate),
      QuoteDeadline: this.toIsoDate(row.QuoteDeadline),
      PurSentAtHour: this.toNullableHour(row.PurSentAtHour),
      PurSentAtDate: this.toIsoDate(row.PurSentAtDate),
      UnitPrice: row.UnitPrice?.toString() || null,
      ShippingCost: row.ShippingCost?.toString() || null,
      Supplier: row.Supplier,
      Leadtime: row.Leadtime,
      RequestNote: row.RequestNote || '',
      SaleNote: row.SaleNote || '',
      MarginRate: row.MarginRate?.toString() || null,
      SaleUnitPrice: row.SaleUnitPrice?.toString() || null,
      ImportPriceNote: row.ImportPriceNote || '',
      IsSaleQuotedText: row.IsSaleQuotedText,
      IsPurQuotedText: row.IsPurQuotedText,
      NoteReason: row.NoteReason || '',
      WeekNo: row.WeekNo?.toString() || null,
      MonthNo: row.MonthNo?.toString() || null,
      YearNo: row.YearNo?.toString() || null
    }));

    this.isSaving = true;
    this.displayText = `Đang lưu ${data.length} bản ghi...`;
    this.displayProgress = 50;

    this.commercialPriceRequestService.postDataImportExcel(payload).subscribe({
      next: (res: any) => {
        if (res.status == 1) {
          this.dataSaved.emit(payload); // Emit the converted data
          this.displayProgress = 100;
          this.displayText = `Đã lưu ${data.length} bản ghi`;
          this.isSaving = false;
          this.notification.success('Thành công', `Đã import ${data.length} bản ghi!`);
          this.activeModal.close({ success: true, count: data.length });
        } else {
          this.isSaving = false;
          this.notification.error('Lỗi', `Lỗi khi import dữ liệu!`);
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error('Lỗi', `Lỗi khi import dữ liệu!`);
      }
    })
  }


  downloadTemplate() {
    const fileName = 'CommercialPriceRequestTemplate.xlsx';
    this.commercialPriceRequestService.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải file mẫu thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi tải file mẫu:', res);
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải file mẫu thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải file mẫu thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải file mẫu thất bại. Vui lòng thử lại!';
          this.notification.error('Thông báo', errorMsg);
        }
      }
    });
  }

  public closeModal(): void {
    this.activeModal.dismiss();
  }

  private resetState(): void {
    this.displayProgress = 0;
    this.displayText = 'Chưa có file nào được chọn';
    this.dataTableExcel = [];
    this.totalRowsAfterFileRead = 0;
    if (this.tableExcel) this.tableExcel.replaceData([]);
  }

  /** Format a JS Date → dd/MM/yyyy */
  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /** dd/MM/yyyy → yyyy-MM-dd (ISO) cho DateOnly BE. Trả null nếu sai định dạng hoặc năm ngoài 1900–2100 */
  private toIsoDate(v: string): string | null {
    if (!v) return null;
    const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    const check = new Date(year, month - 1, day);
    if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  /**
   * Kiểm tra format giờ, trả về giá trị nếu hợp lệ (15h00 | 15:00 | 3:00 PM), null nếu không hợp lệ.
   */
  private toNullableHour(v: string | null | undefined): string | null {
    if (!v) return null;
    const s = v.trim();
    // 15h00 / 8h05
    const mH = s.match(/^(\d{1,2})h(\d{2})$/i);
    if (mH) {
      const h = parseInt(mH[1], 10), min = parseInt(mH[2], 10);
      return h <= 23 && min <= 59 ? s : null;
    }
    // 15:00
    const mC = s.match(/^(\d{1,2}):(\d{2})$/);
    if (mC) {
      const h = parseInt(mC[1], 10), min = parseInt(mC[2], 10);
      return h <= 23 && min <= 59 ? s : null;
    }
    // 3:00 PM / 11:00AM
    const mAP = s.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (mAP) {
      const h = parseInt(mAP[1], 10), min = parseInt(mAP[2], 10);
      return h >= 1 && h <= 12 && min <= 59 ? s : null;
    }
    return null;
  }

  /**
   * Đọc cell ngày từ ExcelJS.
   * ExcelJS trả về Date object cho ô kiểu date → format dd/MM/yyyy.
   * Nếu là chuỗi thì trả nguyên.
   */
  private getCellDate(cell: any): string {
    if (!cell) return '';
    try {
      let v = cell.value;
      // Formula cell → dùng result
      if (typeof v === 'object' && v !== null && 'formula' in v) {
        v = cell.result ?? cell.text ?? '';
      }
      if (v instanceof Date) return this.formatDate(v);
      // Số serial Excel (e.g. 45000) → convert to Date
      if (typeof v === 'number' && v > 25000) {
        const d = new Date((v - 25569) * 86400 * 1000);
        if (!isNaN(d.getTime())) return this.formatDate(d);
      }
      // Fallback: chuỗi
      if (v !== null && v !== undefined) {
        const s = String(cell.text ?? v).trim();
        // Nếu bản thân là chuỗi mm/dd/yy hoặc yyyy-mm-dd → parse
        const d2 = new Date(s);
        if (!isNaN(d2.getTime()) && s.length >= 6) return this.formatDate(d2);
        return s;
      }
      return '';
    } catch { return ''; }
  }

  private getCellText(cell: any): string {
    if (!cell) return '';
    try {
      // Nếu value là Date → dùng getCellDate
      const v0 = cell.value;
      if (v0 instanceof Date) return this.formatDate(v0);
      if (cell.text !== undefined && cell.text !== null && cell.text !== '') return String(cell.text);
      if (cell.result !== undefined && cell.result !== null) {
        if (cell.result instanceof Date) return this.formatDate(cell.result);
        return String(cell.result);
      }
    } catch { }
    try {
      const v = cell.value;
      if (v === null || v === undefined) return '';
      if (typeof v === 'object' && v.formula) return cell.text != null ? String(cell.text) : '';
      if (typeof v === 'object' && v.richText) {
        return Array.isArray(v.richText) ? v.richText.map((r: any) => r?.text || '').join('') : '';
      }
      return String(v);
    } catch { return ''; }
  }

  private parseNumber(cell: any): number {
    if (!cell) return 0;
    try {
      // Ưu tiên cell.text vì nó là định dạng hiển thị trong Excel (ví dụ khi làm tròn 770500)
      if (cell.text !== undefined && cell.text !== null && cell.text !== '') {
        const rawTextOrig = String(cell.text).trim();
        const rawText = rawTextOrig.replace(/\s+/g, '');
        const matchAny = rawText.match(/-?[\d.,]+/);
        if (matchAny && matchAny[0] !== '.' && matchAny[0] !== ',') {
          let parsedN = this.parseFormattedNumber(matchAny[0]);
          if (!isNaN(parsedN)) {
            if (rawTextOrig.startsWith('(') && rawTextOrig.endsWith(')')) {
              parsedN = -Math.abs(parsedN);
            }
            return parsedN;
          }
        }
      }

      if (cell.result !== undefined && cell.result !== null && typeof cell.result === 'number') return cell.result;
      let v = cell.value;
      if (typeof v === 'object' && v?.formula) v = cell.result ?? cell.text ?? 0;

      const n = this.parseFormattedNumber(v);
      return isNaN(n) ? 0 : n;
    } catch { return 0; }
  }

  private parseFormattedNumber(v: any): number {
    if (v === null || v === undefined || v === '') return NaN;
    if (typeof v === 'number') return v;
    let s = String(v).trim().replace(/\s+/g, '');
    if (!s) return NaN;

    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');

    const isValidThousand = (parts: string[]) => {
      // Ví dụ hợp lệ: 1.000 (parts = ["1","000"]), 12.000 (["12","000"]), 123.000 (["123","000"])
      // Không hợp lệ: 770500.345 (parts = ["770500","345"]) vì parts[0] > 3 ký tự.
      if (parts[0].length === 0 || parts[0].length > 3) return false;
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].length !== 3) return false;
      }
      return true;
    };

    if (lastDot > -1 && lastComma > -1) {
      if (lastDot > lastComma) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(/\./g, '').replace(/,/g, '.');
      }
    } else if (lastComma > -1) {
      const parts = s.split(',');
      if (isValidThousand(parts)) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(/,/g, '.');
      }
    } else if (lastDot > -1) {
      const parts = s.split('.');
      if (isValidThousand(parts)) {
        s = s.replace(/\./g, ''); // Xóa chấm (chấm là hàng ngàn)
      }
    }
    return parseFloat(s);
  }
}
