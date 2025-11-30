import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPriceRequestService } from '../project-partlist-price-request-service/project-partlist-price-request.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  standalone: true,
  selector: 'app-import-excel-project-partlist-price-request',
  imports: [CommonModule, FormsModule, NzButtonModule, NzIconModule, NzInputModule, NzProgressModule],
  templateUrl: './import-excel-project-partlist-price-request.component.html',
  styleUrls: ['./import-excel-project-partlist-price-request.component.css']
})
export class ImportExcelProjectPartlistPriceRequestComponent implements OnInit {
  private notification = inject(NzNotificationService);
  private modalService = inject(NgbModal);
  private priceService = inject(ProjectPartlistPriceRequestService);
  private appUserService = inject(AppUserService);

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: Tabulator | null = null;
  dataTableExcel: any[] = [];
  displayProgress: number = 0;
  displayText: string = '0/0';
  totalRowsAfterFileRead: number = 0;

  ngOnInit(): void {}

  formatProgressText = (percent: number): string => this.displayText;

  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = '';
        this.resetExcelImportState();
        return;
      }
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';

      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          this.excelSheets = workbook.worksheets.map(s => s.name);
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            await this.readExcelData(workbook, this.selectedSheet);
            this.displayProgress = 0;
            this.displayText = this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu hợp lệ trong sheet.' : `0/${this.totalRowsAfterFileRead} bản ghi`;
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (err) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc tệp Excel.');
          this.resetExcelImportState();
        }
        input.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  }

  onSheetChange() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (!this.filePath || !fileInput.files || fileInput.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = e.target.result;
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        await this.readExcelData(workbook, this.selectedSheet);
        this.displayProgress = 0;
      } catch (err) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet đã chọn!');
        this.resetExcelImportState();
      }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
  }

  private normalizeHeader(h: any): string {
    const s = (typeof h === 'string' ? h : h?.toString() || '').trim().toLowerCase();
    const noAccents = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const stripped = noAccents.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    return stripped;
  }

  private headerSynonyms: Record<string, string> = {
    'stt': 'STT',
    'ma san pham': 'ProductCode',
    'ma sp': 'ProductCode',
    'ten san pham': 'ProductName',
    'hang': 'Maker',
    'deadline': 'Deadline',
    'sl yeu cau': 'Quantity',
    'so luong yeu cau': 'Quantity',
    'dvt': 'UnitName',
    'đvt': 'UnitName',
    'don vi': 'UnitName',
    'ghi chu': 'NoteHR'
  };

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) return;
    const headerRow = worksheet.getRow(1);
    const fieldToCol: Record<string, number> = {};
    const headerCellCount = (headerRow as any).actualCellCount || headerRow.cellCount;
    for (let c = 1; c <= headerCellCount; c++) {
      const rawCell = headerRow.getCell(c);
      const raw = (rawCell?.text ?? rawCell?.value ?? '').toString();
      const norm = this.normalizeHeader(raw);
      const field = this.headerSynonyms[norm] || norm;
      if (field) fieldToCol[field] = c;
    }
    const data: any[] = [];
    let validRecords = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return;
      const hasKey = (fieldToCol['ProductCode'] && row.getCell(fieldToCol['ProductCode']).value) ||
                     (fieldToCol['ProductName'] && row.getCell(fieldToCol['ProductName']).value);
      if (!hasKey) return;

      const getText = (field: string) => {
        const col = fieldToCol[field];
        if (!col) return '';
        const v = row.getCell(col).value;
        return v?.toString()?.trim() || '';
      };
      const getNumber = (field: string) => {
        const n = parseFloat(getText(field));
        return isNaN(n) ? 0 : n;
      };
      const getDateISO = (field: string) => {
        const col = fieldToCol[field];
        if (!col) return null;
        const v = row.getCell(col).value;
        if (!v) return null;
        if (v instanceof Date) return DateTime.fromJSDate(v).toISODate();
        if (typeof v === 'number') {
          const jsDate = new Date(Math.round((v - 25569) * 86400 * 1000));
          return DateTime.fromJSDate(jsDate).toISODate();
        }
        const s = v.toString().trim();
        const d = DateTime.fromFormat(s, 'd/M/yyyy');
        return d.isValid ? d.toISODate() : null;
      };

      const rowData = {
        STT: getNumber('STT') || (rowNumber - 1),
        ProductCode: getText('ProductCode'),
        ProductName: getText('ProductName'),
        Maker: getText('Maker'),
        Deadline: getDateISO('Deadline'),
        Quantity: getNumber('Quantity'),
        UnitName: getText('UnitName'),
        NoteHR: getText('NoteHR')
      };
      data.push(rowData);
      validRecords++;
    });

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = validRecords;
    this.drawTable();
  }

  formatDeadlineDisplay(val: any): string {
    if (!val) return '';
    const iso = typeof val === 'string' ? DateTime.fromISO(val) : DateTime.invalid('');
    if (iso.isValid) return iso.toFormat('dd/MM/yyyy');
    const dmy = DateTime.fromFormat(String(val), 'dd/MM/yyyy');
    return dmy.isValid ? dmy.toFormat('dd/MM/yyyy') : '';
  }

  deadlineEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'dd/MM/yyyy';
    input.value = this.formatDeadlineDisplay(cell.getValue());
    input.className = 'form-control form-control-sm';
    onRendered(() => { input.focus(); input.select(); });
    const apply = () => {
      const s = (input.value || '').trim();
      const d = DateTime.fromFormat(s, 'dd/MM/yyyy');
      if (d.isValid) { success(d.toISODate()); } else { this.notification.warning('Thông báo', 'Ngày không hợp lệ. Định dạng dd/MM/yyyy'); cancel(); }
    };
    input.addEventListener('blur', apply);
    input.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') apply(); if (e.key === 'Escape') cancel(); });
    return input;
  }

  drawTable() {
    const cols: ColumnDefinition[] = [
      { title: 'STT', field: 'STT', width: 60, hozAlign: 'center' },
      { title: 'Mã sản phẩm', field: 'ProductCode', width: 150, editor: 'input', validator: ['required'] },
      { title: 'Tên sản phẩm', field: 'ProductName', width: 220, editor: 'input', validator: ['required'] },
      { title: 'Hãng', field: 'Maker', width: 150, editor: 'input' },
      { title: 'Deadline', field: 'Deadline', width: 120, editor: this.deadlineEditor.bind(this), formatter: (cell) => this.formatDeadlineDisplay(cell.getValue()) },
      { title: 'SL yêu cầu', field: 'Quantity', width: 110, hozAlign: 'right', editor: 'number' },
      { title: 'ĐVT', field: 'UnitName', width: 100, editor: 'input' },
      { title: 'Ghi chú', field: 'NoteHR', width: 200, editor: 'input' }
    ];
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel || [],
        layout: 'fitDataFill',
        height: '60vh',
        reactiveData: true,
        columns: cols
      });
    } else {
      this.tableExcel.replaceData(this.dataTableExcel || []);
    }
  }

  private checkDeadline(deadlineISO: string | null, stt: number): boolean {
    if (!deadlineISO) {
      this.notification.warning('Thông báo', `Vui lòng nhập Deadline! (Dòng stt: ${stt})`);
      return false;
    }
    const deadline = DateTime.fromISO(deadlineISO);
    if (!deadline.isValid) {
      this.notification.warning('Thông báo', `Deadline không hợp lệ! (Dòng stt: ${stt})`);
      return false;
    }
    let dateRequest = DateTime.local();
    if (dateRequest.hour >= 15) dateRequest = dateRequest.plus({ days: 1 });
    if (dateRequest.weekday === 6) dateRequest = dateRequest.plus({ days: 1 });
    if (dateRequest.weekday === 7) dateRequest = dateRequest.plus({ days: 1 });
    const days: string[] = [];
    let cur = dateRequest.startOf('day');
    const end = deadline.startOf('day');
    while (cur <= end) {
      if (cur.weekday !== 6 && cur.weekday !== 7) days.push(cur.toISODate()!);
      cur = cur.plus({ days: 1 });
    }
    if (days.length < 2) {
      this.notification.warning('Thông báo', `Dealine phải ít nhất là 2 ngày tính từ [${dateRequest.toFormat('dd/MM/yyyy')}] và KHÔNG tính T7, CN! (Dòng stt: ${stt})`);
      return false;
    }
    return true;
  }

  validateRows(): boolean {
    const rows = this.dataTableExcel || [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const stt = Number(r.STT || i + 1);
      const code = String(r.ProductCode || '').trim();
      const name = String(r.ProductName || '').trim();
      const qty = Number(r.Quantity || 0);
      if (!code) { this.notification.warning('Thông báo', `Vui lòng nhập Mã sản phẩm! (Dòng stt: ${stt})`); return false; }
      if (!name) { this.notification.warning('Thông báo', `Vui lòng nhập Tên sản phẩm! (Dòng stt: ${stt})`); return false; }
      if (!this.checkDeadline(r.Deadline || null, stt)) return false;
      if (qty <= 0) { this.notification.warning('Thông báo', `Vui lòng nhập SL yêu cầu! (Dòng stt: ${stt})`); return false; }
    }
    return true;
  }

  resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    if (this.tableExcel) this.tableExcel.replaceData([]);
  }

  closeExcelModal() { this.modalService.dismissAll(true); }

  saveExcelData() {
    if (!this.validateRows()) return;
    const payload = this.dataTableExcel.map((r) => ({
      ProductCode: r.ProductCode,
      ProductName: r.ProductName,
      Maker: r.Maker || '',
      Deadline: r.Deadline ? DateTime.fromISO(r.Deadline).toJSDate() : null,
      Quantity: Number(r.Quantity || 0),
      Unit: r.UnitName || '',
      NoteHR: r.NoteHR || '',
      JobRequirementID: 0,
      IsJobRequirement: false,
      StatusRequest: 1,
      DateRequest: new Date(),
      EmployeeID: this.appUserService.employeeID
    }));
    this.priceService.saveData(payload).subscribe({
      next: (res: any) => {
        this.notification.success('Thông báo', res?.message || 'Lưu thành công');
        this.closeExcelModal();
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }
}
 
       