import {
  Component, OnInit, AfterViewInit, ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { TravelRegistrationServiceService } from '../travel-registration-service/travel-registration-service.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';

/* ================= Types ================= */
export interface TravelFlatRow {
  EmployeeID: number | string;
  EmployeeCode: string;
  EmployeeName: string;
  Department: string;
  PositionName: string;
  BirthDay: string;
  Age: number | string;
  Height: number | string;
  Gender: string;
  Relationship: string;
  Address: string;
  CCCD: string;
  CCCDIssueDate: string;
  CCCDIssuePlace: string;
  PhoneNumber: string;
  DepartureLocation: string;
  ConfirmStatus: string;
  ConfirmDate: string;
  ConfirmBy: string;
}

/* ================ Helpers core ================ */
function getCellText(cell: ExcelJS.Cell): string {
  return normalizeCellValue(cell.value as any);
}
function normalizeCellValue(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return DateTime.fromJSDate(v).toISODate() ?? '';
  if (Array.isArray((v as any)?.richText)) return (v as any).richText.map((rt: any) => rt.text ?? '').join('');
  if ((v as any)?.text) return String((v as any).text);
  if ((v as any)?.hyperlink && (v as any)?.text) return String((v as any).text);
  if ((v as any)?.result != null) return normalizeCellValue((v as any).result);
  return String(v);
}
function parseNumberSmart(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[^\d,.\-]/g, '');
  const val = Number(s);
  if (!Number.isFinite(val)) return null;
  return val;
}

/* ================ Header tolerant mapping ================ */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
function norm(s: any): string {
  if (s == null) return '';
  return stripDiacritics(String(s)).toLowerCase().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

const COL_ALIASES = {
  EmployeeID: ['employeeid', 'id', 'employee id', 'ma he thong'],
  EmployeeCode: ['ma nhan vien', 'manv', 'ma nv', 'employee code'],
  EmployeeName: ['ten nhan vien', 'ho ten', 'hoten', 'ho va ten', 'employee name', 'name'],
  Department: ['phong ban', 'phong', 'department', 'bo phan'],
  PositionName: ['chuc vu', 'position', 'vi tri'],
  BirthDay: ['ngay sinh', 'dob', 'birthday'],
  Age: ['tuoi', 'age'],
  Height: ['chieu cao', 'cao', 'height'],
  Gender: ['gioi tinh', 'gt', 'gender', 'sex'],
  Relationship: ['moi quan he', 'quan he', 'relationship', 'mqh'],
  Address: ['dia chi', 'address', 'noi o'],
  CCCD: ['cccd', 'cmnd', 'can cuoc', 'id card'],
  CCCDIssueDate: ['ngay cap', 'issue date'],
  CCCDIssuePlace: ['noi cap', 'issue place'],
  PhoneNumber: ['so dien thoai', 'sdt', 'dien thoai', 'phone'],
  DepartureLocation: ['noi xuat phat', 'xuat phat', 'departure', 'khoi hanh', 've'],
  ConfirmStatus: ['trang thai', 'status'],
  ConfirmDate: ['ngay xn', 'ngay xac nhan', 'confirm date'],
  ConfirmBy: ['nguoi xn', 'nguoi xac nhan', 'confirm by']
};

function pickHeaderRow(ws: ExcelJS.Worksheet): number {
  let bestRow = 1, bestScore = -1;
  const maxScan = Math.min(30, ws.rowCount);
  const aliases = Object.values(COL_ALIASES).flat().map(a => norm(a));
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    const texts: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      texts.push(norm(getCellText(cell)));
    });
    if (!texts.length) continue;
    const score = texts.reduce((acc, t) => acc + (aliases.some(a => t.includes(a)) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  return bestRow;
}

function mapColumnsByAliases(headers: string[]): Record<keyof typeof COL_ALIASES, number> {
  const nh = headers.map(h => norm(h));
  const find = (list: string[]) => {
    const normList = list.map(a => norm(a));
    for (let i = 0; i < nh.length; i++)
      if (normList.some(a => nh[i]?.includes(a))) return i + 1;
    return 0;
  };

  const out: any = {};
  for (const key of Object.keys(COL_ALIASES)) {
    out[key] = find((COL_ALIASES as any)[key]);
  }
  return out;
}

function getCellSafe(row: ExcelJS.Row, colIndex: number): string {
  if (!colIndex || colIndex < 1) return '';
  return getCellText(row.getCell(colIndex));
}

/* ================= Component ================= */
@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-travel-registration-import-excel',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule, NzSelectModule, NzProgressModule
  ],
  templateUrl: './travel-registration-import-excel.component.html',
  styleUrl: './travel-registration-import-excel.component.css'
})
export class TravelRegistrationImportExcelComponent implements OnInit, AfterViewInit {
  filePath = '';
  excelSheets: string[] = [];
  selectedSheet = '';
  tableExcel: Tabulator | null = null;
  dataTableExcel: TravelFlatRow[] = [];

  displayProgress = 0;
  displayText = '0/0';
  totalRowsAfterFileRead = 0;
  isSaving = false;
  employeeList: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.loadEmployee();
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (res: any) => {
        this.employeeList = res.data || [];
      },
      error: (err: any) => console.error('Lỗi lấy nhân viên', err)
    });
  }

  private getEmployeeIDByCode(code: string): number {
    if (!code) return 0;
    const emp = this.employeeList.find(e => e.Code === code);
    return emp ? emp.ID : 0;
  }

  ngAfterViewInit(): void {
    this.drawtable();
  }

  /* ===== Progress ===== */
  private setReadingProgress(pct: number, text: string) {
    this.displayProgress = Math.max(0, Math.min(100, pct | 0));
    this.displayText = text;
  }
  private setSavingProgress(done: number, total: number) {
    const pct = total > 0 ? Math.floor((done / total) * 100) : 0;
    this.displayProgress = Math.min(100, Math.max(0, pct));
    this.displayText = `${done}/${total} bản ghi`;
  }
  private resetProgress() {
    this.displayProgress = 0; this.displayText = '0/0'; this.totalRowsAfterFileRead = 0;
  }
  formatProgressText() { return this.displayText; }

  /* ===== UI / Table ===== */
  private columns(): ColumnDefinition[] {
    return [
      { title: 'Mã NV', field: 'EmployeeCode', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: 'Họ tên', field: 'EmployeeName', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: 'Phòng ban', field: 'Department', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: 'Ngày sinh', field: 'BirthDay', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
      { title: 'Giới tính', field: 'Gender', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
      { title: 'Tuổi', field: 'Age', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
      { title: 'Chiều cao', field: 'Height', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
      { title: 'Mối quan hệ', field: 'Relationship', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: 'Địa chỉ thường trú', field: 'Address', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: 'CCCD', field: 'CCCD', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: 'Ngày cấp', field: 'CCCDIssueDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
      { title: 'Nơi cấp', field: 'CCCDIssuePlace', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
      { title: 'SĐT', field: 'PhoneNumber', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
      { title: 'Nơi xuất phát', field: 'DepartureLocation', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
    ];
  }

  drawtable() {
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel,
        layout: 'fitDataFill',
        ...DEFAULT_TABLE_CONFIG,
        height: '100%',
        paginationMode: 'local',
        columns: this.columns()
      });
    } else {
      this.tableExcel.setColumns(this.columns());
      this.tableExcel.replaceData(this.dataTableExcel as any);
    }
  }

  /* ===== File handling ===== */
  openFileExplorer() {
    (document.getElementById('fileInput') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chọn tệp Excel (.xlsx hoặc .xls)');
      input.value = ''; this.resetExcelImportState(); return;
    }
    this.filePath = file.name;
    this.excelSheets = []; this.selectedSheet = '';
    this.dataTableExcel = []; this.totalRowsAfterFileRead = 0;
    this.setReadingProgress(0, 'Đang đọc file...');

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        this.setReadingProgress(pct, `Đang tải file: ${pct}%`);
      }
    };
    reader.onload = async (e: any) => {
      const data = e.target.result;
      try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(data);
        this.excelSheets = wb.worksheets.map(s => s.name);
        if (this.excelSheets.length === 0) {
          this.resetExcelImportState(); input.value = ''; return;
        }
        this.selectedSheet = this.excelSheets[0];
        await this.readExcelData(wb, this.selectedSheet);
        this.setReadingProgress(0, this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu' : `0/${this.totalRowsAfterFileRead} bản ghi`);
      } catch {
        this.resetExcelImportState();
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  onSheetChange() {
    if (!this.filePath) return;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(e.target.result);
        await this.readExcelData(wb, this.selectedSheet);
        this.setReadingProgress(0, this.totalRowsAfterFileRead === 0 ? 'Không có dữ liệu' : `0/${this.totalRowsAfterFileRead} bản ghi`);
      } catch {
        this.resetExcelImportState();
      }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
  }

  /* ===== Parse Excel ===== */
  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) { this.resetExcelImportState(); return; }

    const headerRowIndex = pickHeaderRow(ws);
    const headerRow = ws.getRow(headerRowIndex);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => headers[colNumber - 1] = getCellText(cell) || `C${colNumber}`);
    const col = mapColumnsByAliases(headers);

    const data: TravelFlatRow[] = [];
    let total = 0;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const EmployeeID = getCellSafe(row, col.EmployeeID);
      const EmployeeCode = getCellSafe(row, col.EmployeeCode);
      const EmployeeName = getCellSafe(row, col.EmployeeName);

      const Department = getCellSafe(row, col.Department);

      // Bỏ qua dòng trống
      if (!EmployeeID && !EmployeeCode && !EmployeeName) return;

      const normCode = norm(EmployeeCode);
      const normName = norm(EmployeeName);
      if (
        ['ma nhan vien', 'employee code', 'ma nv'].includes(normCode) ||
        ['ten nhan vien', 'ho ten', 'ho va ten', 'employee name'].includes(normName) ||
        ['phong ban', 'department'].includes(norm(Department))
      ) {
        return; // Bỏ qua dòng tiêu đề phụ
      }
      const PositionName = getCellSafe(row, col.PositionName);
      const BirthDay = getCellSafe(row, col.BirthDay);
      const Age = getCellSafe(row, col.Age);
      const Height = getCellSafe(row, col.Height);
      const Gender = getCellSafe(row, col.Gender) || 'Nam';
      const Relationship = getCellSafe(row, col.Relationship);
      const Address = getCellSafe(row, col.Address);
      const CCCD = getCellSafe(row, col.CCCD);
      const CCCDIssueDate = getCellSafe(row, col.CCCDIssueDate);
      const CCCDIssuePlace = getCellSafe(row, col.CCCDIssuePlace);
      const PhoneNumber = getCellSafe(row, col.PhoneNumber);
      const DepartureLocation = getCellSafe(row, col.DepartureLocation);
      const ConfirmStatus = getCellSafe(row, col.ConfirmStatus) || '0';
      const ConfirmDate = getCellSafe(row, col.ConfirmDate);
      const ConfirmBy = getCellSafe(row, col.ConfirmBy);

      data.push({
        EmployeeID: parseNumberSmart(EmployeeID) ?? 0,
        EmployeeCode,
        EmployeeName,
        Department,
        PositionName,
        BirthDay,
        Age: parseNumberSmart(Age) ?? 0,
        Height: parseNumberSmart(Height) ?? 0,
        Gender,
        Relationship,
        Address,
        CCCD,
        CCCDIssueDate,
        CCCDIssuePlace,
        PhoneNumber,
        DepartureLocation,
        ConfirmStatus,
        ConfirmDate,
        ConfirmBy
      });
      total++;
    });

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = total;
    this.setReadingProgress(0, total === 0 ? 'Không có dữ liệu' : `0/${total} bản ghi`);

    if (this.tableExcel) this.tableExcel.replaceData(this.dataTableExcel as any);
    else this.drawtable();
  }

  /* ===== Reset / Close ===== */
  private resetExcelImportState(): void {
    this.filePath = ''; this.excelSheets = []; this.selectedSheet = '';
    this.dataTableExcel = []; this.resetProgress();
    if (this.tableExcel) this.tableExcel.replaceData([]);
  }

  onCancel() {
    this.activeModal.dismiss('cancel');
  }

  onDownloadTemplate() {
    const fileName = 'TemplateCheckSheetDulich.xlsx';
    this.travelRegistrationService.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.notification.success(NOTIFICATION_TITLE.success, 'Tải file mẫu thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi tải file mẫu:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải xuống file mẫu!');
      }
    });
  }

  /* ===== Save ===== */
  private parseDateString(str: any): string | null {
    if (!str) return null;
    if (typeof str !== 'string') {
      if (str instanceof Date && !isNaN(str.getTime())) {
        return DateTime.fromJSDate(str).toFormat('yyyy-MM-dd');
      }
      str = String(str);
    }
    const s = str.trim();
    if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;

    // Try parse DD/MM/YYYY or D/M/YYYY
    let parsed = DateTime.fromFormat(s, 'dd/MM/yyyy');
    if (parsed.isValid) return parsed.toFormat('yyyy-MM-dd');

    parsed = DateTime.fromFormat(s, 'd/M/yyyy');
    if (parsed.isValid) return parsed.toFormat('yyyy-MM-dd');

    parsed = DateTime.fromFormat(s, 'dd-MM-yyyy');
    if (parsed.isValid) return parsed.toFormat('yyyy-MM-dd');

    // Try parse YYYY-MM-DD
    parsed = DateTime.fromFormat(s, 'yyyy-MM-dd');
    if (parsed.isValid) return parsed.toFormat('yyyy-MM-dd');

    // Try parse ISO format (or string with T)
    parsed = DateTime.fromISO(s);
    if (parsed.isValid) return parsed.toFormat('yyyy-MM-dd');

    const jsDate = new Date(s);
    if (!isNaN(jsDate.getTime())) {
      return DateTime.fromJSDate(jsDate).toFormat('yyyy-MM-dd');
    }

    return null;
  }

  async onImport(): Promise<void> {
    if (!this.dataTableExcel.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu.');
      return;
    }

    let lastCBNVEmployeeID = 0;

    const dtoList = this.dataTableExcel.map(r => {
      const isCBNV = !r.Relationship || r.Relationship.trim().toUpperCase() === 'CBNV';
      let employeeIdByCode = 0;
      if (r.EmployeeCode) {
        employeeIdByCode = this.getEmployeeIDByCode(r.EmployeeCode);
      }
      const parsedEmployeeID = employeeIdByCode > 0 ? employeeIdByCode : (typeof r.EmployeeID === 'number' ? r.EmployeeID : 0);

      if (isCBNV) {
        lastCBNVEmployeeID = parsedEmployeeID;
      }

      return {
        EmployeeID: isCBNV ? parsedEmployeeID : 0,
        EmployeeCode: r.EmployeeCode || '',
        EmployeeName: r.EmployeeName || '',
        Department: r.Department || '',
        PositionName: r.PositionName || '',
        BirthDay: this.parseDateString(r.BirthDay),
        Age: parseNumberSmart(r.Age) ?? null,
        Height: parseNumberSmart(r.Height) ?? null,
        Gender: r.Gender || '',
        Relationship: r.Relationship || '',
        Address: r.Address || '',
        CCCD: r.CCCD || '',
        CCCDIssueDate: this.parseDateString(r.CCCDIssueDate),
        CCCDIssuePlace: r.CCCDIssuePlace || '',
        PhoneNumber: r.PhoneNumber || '',
        DepartureLocation: r.DepartureLocation || '',
        ConfirmStatus: r.ConfirmStatus === '0' ? 0 : r.ConfirmStatus === '1' ? 1 : Number(r.ConfirmStatus) || 0,
        ConfirmDate: this.parseDateString(r.ConfirmDate),
        ConfirmBy: r.ConfirmBy || '',
        OwnerEmployeeID: lastCBNVEmployeeID
      };
    });

    this.isSaving = true;
    let savedCount = 0;
    const total = dtoList.length;

    this.setSavingProgress(0, total);

    try {
      for (const dto of dtoList) {
        try {
          await firstValueFrom(this.travelRegistrationService.saveData(dto));
          savedCount++;
          this.setSavingProgress(savedCount, total);
        } catch (res: any) {
          console.error('Lỗi khi lưu dòng:', dto, res);
          // Tiếp tục vòng lặp dù lỗi
        }
      }

      this.isSaving = false;
      if (savedCount === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lưu dữ liệu thất bại toàn bộ.');
      } else if (savedCount < total) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu thành công ${savedCount}/${total} bản ghi.`);
      } else {
        this.notification.success(NOTIFICATION_TITLE.success, `Đã lưu thành công ${savedCount}/${total} bản ghi.`);
        this.activeModal.close('import_success');
      }
    } catch (err: any) {
      this.isSaving = false;
      this.notification.error(NOTIFICATION_TITLE.error, 'Đã xảy ra lỗi trong quá trình lưu dữ liệu.');
    }
  }
}
