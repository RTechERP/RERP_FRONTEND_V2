import {
  Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { DateTime } from 'luxon';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { UnitService } from '../../asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';

/* ================= Types ================= */
export interface FilmDetail {
  NoiDungCongViec: string;
  DVT: string;
  NangSuatTrungBinh: number;
}
export interface FilmMaster {
  STT: string | number;
  Ma: string;
  DauMuc: string;
  YeuCauKetQua: string;
  Details: FilmDetail[];
}
export interface FilmPayload { Masters: FilmMaster[]; }

/** Dòng preview phẳng */
export interface FilmFlatRow {
  STT: string | number;
  Ma: string;
  DauMuc: string;
  YeuCauKetQua: string;
  NoiDungCongViec: string;
  DVT: string;
  NangSuatTrungBinh: number | string;
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

/** Parse number thông minh */
function parseNumberSmart(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  let s = String(raw).trim();
  if (!s) return null;
  let isPercent = false;
  if (/%$/.test(s)) { isPercent = true; s = s.replace('%', ''); }
  s = s.replace(/[^\d,.\-]/g, '');
  const hasComma = s.includes(','), hasDot = s.includes('.');
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    const parts = s.split(',');
    s = parts.length === 2 && parts[1].length <= 2
      ? parts[0].replace(/\./g, '') + '.' + parts[1]
      : s.replace(/,/g, '');
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2) { const dec = parts.pop(); s = parts.join('') + '.' + dec; }
  }
  const val = Number(s);
  if (!Number.isFinite(val)) return null;
  return isPercent ? val / 100 : val;
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
  STT: ['stt', 'so thu tu', 's t t'],
  Ma: ['ma', 'mã'],
  DauMuc: ['dau muc', 'dau-muc', 'dau_muc'],
  YeuCauKetQua: ['yeu cau ket qua', 'yeu cau', 'ket qua', 'yeu-cau-ket-qua'],
  NoiDungCongViec: ['noi dung cong viec', 'noi dung', 'cong viec'],
  DVT: ['dvt', 'don vi tinh', 'don vi'],
  NangSuatTrungBinh: ['nang suat trung binh', 'nang suat', 'ns tb', 'nang suat tb']
};
function pickHeaderRow(ws: ExcelJS.Worksheet): number {
  let bestRow = 1, bestScore = -1;
  const maxScan = Math.min(30, ws.rowCount);
  const aliases = Object.values(COL_ALIASES).flat();
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    const texts: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      if (typeof v === 'string' || typeof v === 'number') texts.push(norm(v));
      else if (v instanceof Date) texts.push(norm(DateTime.fromJSDate(v).toISODate() ?? ''));
      else if (v && typeof v === 'object' && 'text' in (v as any)) texts.push(norm((v as any).text));
    });
    if (!texts.length) continue;
    const score = texts.reduce((acc, t) => acc + (aliases.some(a => t.includes(a)) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  return bestRow;
}
function mapColumnsByAliases(headers: string[]): Record<'STT'|'Ma'|'DauMuc'|'YeuCau'|'NoiDung'|'DVT'|'NangSuat', number> {
  const nh = headers.map(h => norm(h));
  const find = (list: string[]) => { for (let i = 0; i < nh.length; i++) if (list.some(a => nh[i]?.includes(a))) return i + 1; return 0; };
  const out = {
    STT: find(COL_ALIASES.STT),
    Ma: find(COL_ALIASES.Ma),
    DauMuc: find(COL_ALIASES.DauMuc),
    YeuCau: find(COL_ALIASES.YeuCauKetQua),
    NoiDung: find(COL_ALIASES.NoiDungCongViec),
    DVT: find(COL_ALIASES.DVT),
    NangSuat: find(COL_ALIASES.NangSuatTrungBinh)
  };
  const fallback = [1,2,3,4,5,6,7];
  (Object.keys(out) as Array<keyof typeof out>).forEach((k, i) => {
    if (!out[k] || out[k] < 1 || out[k] > headers.length) out[k] = fallback[i] as any;
  });
  return out;
}

/* ================= Component ================= */
@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-film-management-import-excel',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSplitterModule, NzInputModule, NzSelectModule, NzProgressModule
  ],
  templateUrl: './film-management-import-excel.component.html',
  styleUrl: './film-management-import-excel.component.css'
})
export class FilmManagementImportExcelComponent implements OnInit, AfterViewInit {
  @Input() table: any;
  @Output() submit = new EventEmitter<any>(); // emit payload đã map theo DB

  unitData: any[] = [];
  filePath = '';
  excelSheets: string[] = [];
  selectedSheet = '';

  tableExcel: Tabulator | null = null;
  dataTableExcel: FilmFlatRow[] = [];

  displayProgress = 0;
  displayText = '0/0';
  totalRowsAfterFileRead = 0;

  private savingTotal = 0;
  private savingDone = 0;

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private unitService: UnitService
  ) {}

  ngOnInit() {
    this.getUnits();
  }
  ngAfterViewInit(): void { this.drawtable(); }

  /* ===== Units ===== */
  private getUnits() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = Array.isArray(res?.data) ? res.data : [];
    });
  }
  private normalizeUnitName(s: string): string {
    return (s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }
  private findUnitIdByName(name: string): number | null {
    if (!this.unitData?.length) return null;
    const key = this.normalizeUnitName(name);
    const hit = this.unitData.find((u: any) =>
      this.normalizeUnitName(u?.Name || u?.UnitName || u?.Code) === key
    );
    return hit?.ID ?? null;
  }

  /* ===== Progress ===== */
  private setReadingProgress(pct: number, text: string) {
    this.displayProgress = Math.max(0, Math.min(100, pct | 0));
    this.displayText = text;
  }
  beginSaving(total: number) {
    this.savingDone = 0; this.savingTotal = total | 0;
    this.setSavingProgress(0, this.savingTotal);
  }
  tickSaving(step = 1) { this.setSavingProgress(this.savingDone + (step | 0), this.savingTotal); }
  endSaving(success: boolean) {
    this.setSavingProgress(this.savingTotal, this.savingTotal);
    if (success) this.notification.success('Thông báo', `Đã lưu ${this.savingTotal}/${this.savingTotal} bản ghi`);
    else this.notification.error('Thông báo', `Lưu thất bại. Đã xử lý ${this.savingDone}/${this.savingTotal} bản ghi`);
  }
  private setSavingProgress(done: number, total: number) {
    this.savingDone = Math.max(0, done | 0); this.savingTotal = Math.max(0, total | 0);
    const pct = total > 0 ? Math.floor((this.savingDone / this.savingTotal) * 100) : 0;
    this.displayProgress = Math.min(100, Math.max(0, pct));
    this.displayText = `${this.savingDone}/${this.savingTotal} bản ghi`;
  }
  private resetProgress() {
    this.displayProgress = 0; this.displayText = '0/0'; this.totalRowsAfterFileRead = 0;
    this.savingDone = 0; this.savingTotal = 0;
  }
  formatProgressText() { return this.displayText; }

  /* ===== UI / Table ===== */
  private columns(): ColumnDefinition[] {
    return [
      { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 70 },
      { title: 'Mã', field: 'Ma', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Đầu mục', field: 'DauMuc', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Yêu cầu kết quả', field: 'YeuCauKetQua', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Nội dung công việc', field: 'NoiDungCongViec', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'DVT', field: 'DVT', hozAlign: 'center', headerHozAlign: 'center', width: 90 },
      {
        title: 'Năng suất trung bình',
        field: 'NangSuatTrungBinh',
        hozAlign: 'right',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const v = cell.getValue();
          if (v == null || v === '') return '';
          const num = Number(v);
          return Number.isFinite(num) ? num.toString() : String(v);
        }
      }
    ];
  }
  drawtable() {
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel,
        layout: 'fitDataFill',
        ...DEFAULT_TABLE_CONFIG,
        height: '40vh',
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
      this.notification.warning('Thông báo', 'Chọn tệp Excel (.xlsx hoặc .xls)');
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

  /* ===== Parse Excel + forward-fill ===== */
  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) { this.resetExcelImportState(); return; }
    const headerRowIndex = pickHeaderRow(ws);
    const headerRow = ws.getRow(headerRowIndex);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => headers[colNumber - 1] = getCellText(cell) || `C${colNumber}`);
    const col = mapColumnsByAliases(headers);

    const data: FilmFlatRow[] = [];
    let total = 0;
    let last = { STT: '', Ma: '', DauMuc: '', YeuCauKetQua: '' };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      const vals = [col.STT, col.Ma, col.DauMuc, col.YeuCau, col.NoiDung, col.DVT, col.NangSuat]
        .map(c => row.getCell(c).value);
      if (vals.every(v => v == null || v === '')) return;

      let STT = getCellText(row.getCell(col.STT));
      let Ma = getCellText(row.getCell(col.Ma));
      let DauMuc = getCellText(row.getCell(col.DauMuc));
      let YeuCauKetQua = getCellText(row.getCell(col.YeuCau));
      const NoiDungCongViec = getCellText(row.getCell(col.NoiDung));
      const DVT = getCellText(row.getCell(col.DVT));
      const NSTBraw = getCellText(row.getCell(col.NangSuat));

      if (STT || Ma || DauMuc || YeuCauKetQua) {
        last = {
          STT: STT || last.STT,
          Ma: Ma || last.Ma,
          DauMuc: DauMuc || last.DauMuc,
          YeuCauKetQua: YeuCauKetQua || last.YeuCauKetQua
        };
      }
      STT = STT || last.STT;
      Ma = Ma || last.Ma;
      DauMuc = DauMuc || last.DauMuc;
      YeuCauKetQua = YeuCauKetQua || last.YeuCauKetQua;

      const parsed = parseNumberSmart(NSTBraw);
      data.push({
        STT: /^\d+$/.test(String(STT)) ? Number(STT) : STT,
        Ma,
        DauMuc,
        YeuCauKetQua,
        NoiDungCongViec,
        DVT,
        NangSuatTrungBinh: parsed ?? NSTBraw
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
  closeExcelModal() { this.modalService.dismissAll(true); }

  /* ===== Build payload DB + Save ===== */
  private buildPayloadForApi(): any {
    // Gom master theo STT|Ma|DauMuc|YeuCauKetQua
    const groups = new Map<string, FilmMaster>();
    for (const r of this.dataTableExcel) {
      const key = [String(r.STT ?? '').trim(), r.Ma?.trim() || '', r.DauMuc?.trim() || '', r.YeuCauKetQua?.trim() || ''].join('||');
      if (!groups.has(key)) {
        groups.set(key, {
          STT: r.STT ?? '',
          Ma: r.Ma ?? '',
          DauMuc: r.DauMuc ?? '',
          YeuCauKetQua: r.YeuCauKetQua ?? '',
          Details: []
        });
      }
      const ns =
        typeof r.NangSuatTrungBinh === 'number'
          ? r.NangSuatTrungBinh
          : (parseNumberSmart(r.NangSuatTrungBinh) ?? 0);

      groups.get(key)!.Details.push({
        NoiDungCongViec: r.NoiDungCongViec ?? '',
        DVT: r.DVT ?? '',
        NangSuatTrungBinh: ns
      });
    }

    // Map sang schema DB:
    // FilmManagement: Code, Name, RequestResult
    // FilmManagementDetail: WorkContent, PerformanceAVG, UnitID, STT
    const masters = Array.from(groups.values()).map(m => ({
      STT: /^\d+$/.test(String(m.STT)) ? Number(m.STT) : m.STT,
      Code: m.Ma,
      Name: m.DauMuc,
      RequestResult: m.YeuCauKetQua,
      Details: m.Details.map((d, i) => ({
        STT: i + 1,
        WorkContent: d.NoiDungCongViec,
        PerformanceAVG: d.NangSuatTrungBinh,
        UnitID: this.findUnitIdByName(d.DVT) ?? 0
      }))
    }));

    return { Masters: masters };
  }

  saveExcelData(): void {
    if (!this.dataTableExcel.length) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu.');
      return;
    }
    const payloadForApi = this.buildPayloadForApi();
    const total = (payloadForApi.Masters || []).reduce((acc: number, m: any) => acc + (m.Details?.length || 0), 0);
    this.beginSaving(total || 0);

    // Emit cho component cha tự gọi API:
    this.submit.emit(payloadForApi);

    // Nếu muốn gọi API trực tiếp thì thay thế trên bằng service.saveData(payloadForApi).subscribe(...)
    this.endSaving(true);
    this.notification.success('Thông báo', `Đã chuẩn bị ${(payloadForApi.Masters || []).length} nhóm master.`);
    // this.closeExcelModal();
  }
}
