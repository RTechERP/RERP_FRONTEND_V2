import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
  private activeModal = inject(NgbActiveModal);
  private priceService = inject(ProjectPartlistPriceRequestService);
  private appUserService = inject(AppUserService);

  @Input() projectPartlistPriceRequestTypeID: number = 0;

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
    // X\u1eed l\u00fd "\u0111" tr\u01b0\u1edbc v\u00ec kh\u00f4ng decompose \u0111\u01b0\u1ee3c b\u1eb1ng NFD
    const withD = s.replace(/\u0111/g, 'd');
    const noAccents = withD.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
    input.type = 'date';
    input.value = cell.getValue() || '';
    input.className = 'form-control form-control-sm';
    onRendered(() => { input.focus(); input.showPicker?.(); });
    input.addEventListener('change', () => { success(input.value || null); });
    input.addEventListener('blur', () => { success(input.value || null); });
    input.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); });
    return input;
  }

  addRow(): void {
    const nextStt = (this.dataTableExcel?.length || 0) + 1;
    const newRow = { STT: nextStt, ProductCode: '', ProductName: '', Maker: '', Deadline: null, Quantity: 0, UnitName: '', NoteHR: '' };
    if (this.tableExcel) {
      this.tableExcel.addRow(newRow);
    }
    this.dataTableExcel = [...(this.dataTableExcel || []), newRow];
  }

  drawTable() {
    const deleteCol: ColumnDefinition = {
      title: '',
      field: '_delete',
      width: 40,
      hozAlign: 'center',
      headerSort: false,
      titleFormatter: (_cell: any, _params: any, onRendered: any) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-link p-0 text-success';
        btn.title = 'Thêm dòng';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        onRendered(() => btn.addEventListener('click', () => this.addRow()));
        return btn;
      },
      formatter: () => `<button class="btn btn-link p-0 text-danger" title="Xóa"><i class="fas fa-times"></i></button>`,
      cellClick: (_e: any, cell: any) => {
        const row = cell.getRow();
        const data = row.getData();
        this.dataTableExcel = this.dataTableExcel.filter((r: any) => r !== data);
        row.delete();
      }
    };
    const cols: ColumnDefinition[] = [
      deleteCol,
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

  private getDeadlineError(deadlineISO: string | null, stt: number): string | null {
    if (!deadlineISO) return `Vui lòng nhập Deadline! (Dòng stt: ${stt})`;
    const deadline = DateTime.fromISO(deadlineISO);
    if (!deadline.isValid) return `Deadline không hợp lệ! (Dòng stt: ${stt})`;
    if (deadline.weekday === 6 || deadline.weekday === 7)
      return `Deadline (${deadline.toFormat('dd/MM/yyyy')}) là ngày cuối tuần, phải là ngày làm việc T2-T6! (Dòng stt: ${stt})`;
    let startDate = DateTime.local().startOf('day');
    if (DateTime.local().hour >= 15) startDate = startDate.plus({ days: 1 });
    while (startDate.weekday === 6 || startDate.weekday === 7) startDate = startDate.plus({ days: 1 });
    if (deadline.startOf('day') < startDate.plus({ days: 2 }))
      return `Deadline phải cách ít nhất 2 ngày làm việc tính từ [${startDate.toFormat('dd/MM/yyyy')}]! (Dòng stt: ${stt})`;
    return null;
  }

  validateRows(): boolean {
    const rows = this.dataTableExcel || [];
    const tabulatorRows = this.tableExcel?.getRows() || [];
    tabulatorRows.forEach(r => r.getElement().classList.remove('row-error'));

    const errors: string[] = [];
    rows.forEach((r, i) => {
      const stt = Number(r.STT || i + 1);
      const msgs: string[] = [];
      if (!String(r.ProductCode || '').trim()) msgs.push(`Vui lòng nhập Mã sản phẩm! (Dòng stt: ${stt})`);
      if (!String(r.ProductName || '').trim()) msgs.push(`Vui lòng nhập Tên sản phẩm! (Dòng stt: ${stt})`);
      const deadlineErr = this.getDeadlineError(r.Deadline || null, stt);
      if (deadlineErr) msgs.push(deadlineErr);
      if (Number(r.Quantity || 0) <= 0) msgs.push(`Vui lòng nhập SL yêu cầu! (Dòng stt: ${stt})`);
      if (msgs.length > 0) {
        errors.push(...msgs);
        if (tabulatorRows[i]) tabulatorRows[i].getElement().classList.add('row-error');
      }
    });

    if (errors.length > 0) {
      this.notification.warning('Thông báo', errors[0]);
      return false;
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

  closeExcelModal() { this.activeModal.dismiss(); }

  async downloadTemplate(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Template');
    ws.columns = [
      { header: 'STT', key: 'STT', width: 8 },
      { header: 'Mã sản phẩm', key: 'ProductCode', width: 18 },
      { header: 'Tên sản phẩm', key: 'ProductName', width: 30 },
      { header: 'Hãng', key: 'Maker', width: 15 },
      { header: 'Deadline', key: 'Deadline', width: 14 },
      { header: 'SL yêu cầu', key: 'Quantity', width: 12 },
      { header: 'ĐVT', key: 'UnitName', width: 10 },
      { header: 'Ghi chú', key: 'NoteHR', width: 25 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.addRow([1, '', '', '', 'dd/MM/yyyy', 0, '', '']);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template_NhapExcel_YeuCauBaoGia.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  saveExcelData() {
    if (!this.validateRows()) return;
    const payload = this.dataTableExcel.map((r) => ({
      ProductCode: r.ProductCode,
      ProductName: r.ProductName,
      Maker: r.Maker || '',
      Deadline: r.Deadline ? new Date(r.Deadline + 'T00:00:00.000Z') : null,
      Quantity: Number(r.Quantity || 0),
      Unit: r.UnitName || '',
      NoteHR:this.projectPartlistPriceRequestTypeID === 6 ? '' : (r.NoteHR || ''),
      JobRequirementID: 0,
      IsJobRequirement: false,
      StatusRequest: 1,
      DateRequest: new Date(),
      EmployeeID: this.appUserService.employeeID,
      ProjectPartlistPriceRequestTypeID: this.projectPartlistPriceRequestTypeID || 0,
    }));
    this.priceService.saveData(payload).subscribe({
      next: (res: any) => {
        if (this.projectPartlistPriceRequestTypeID === 6) {
          this.saveNotesForDemo(res);
        } else {
          this.notification.success('Thông báo', res?.message || 'Lưu thành công');
          this.closeExcelModal();
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }

  private saveNotesForDemo(saveResponse: any): void {
    const savedItems: any[] = Array.isArray(saveResponse?.data)
      ? saveResponse.data
      : Array.isArray(saveResponse?.data?.data)
        ? saveResponse.data.data
        : [];

    const notes = savedItems
      .map((saved: any, index: number) => ({
        ID: 0,
        ProjectPartlistPriceRequestID: saved.ID || 0,
        Note: this.dataTableExcel[index]?.NoteHR || null,
      }))
      .filter(n => n.ProjectPartlistPriceRequestID > 0);

    if (notes.length === 0) {
      this.notification.success('Thông báo', saveResponse?.message || 'Lưu thành công');
      this.closeExcelModal();
      return;
    }

    this.priceService.saveRequestNote(notes).subscribe({
      next: (res: any) => {
        // this.notification.success('Thông báo', res?.message || 'Lưu thành công');
        this.closeExcelModal();
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lưu ghi chú thất bại');
      }
    });
  }
}
 
       