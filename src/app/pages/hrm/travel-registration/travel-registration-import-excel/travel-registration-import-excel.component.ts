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
  Height: string;
  Gender: string;
  Relationship: string;
  Address: string;
  CCCD: string;
  CCCDIssueDate: string;
  CCCDIssuePlace: string;
  PhoneNumber: string;
  DepartureLocation: string;
  GroupNumber: string;
  DepartureDate: string;
  DepartureFlightCode: string;
  DepartureFlightTime: string;
  DepartureHLKG: string;
  ReturnDate: string;
  ReturnFlightCode: string;
  ReturnFlightTime: string;
  ReturnHLKG: string;
  XeVPSB: string;
  XeSBKS: string;
  XeVinWonder: string;
  XeGalaDinner: string;
  XeKSSB: string;
  XeSBVP: string;
  DateDepartureVinWonder: string;
  DangKyVinwonders: boolean | null;
  RoomNumber: string;
  RommCode: string;
  RoomType: string;
  Note: string;
  TableNumberGala: string;
  Note2: string;
  TripCost: string;
  VinWonderCost: string;
  HLKGCost: string;
  TotalCost: string;
  SupportLunchCost: string;
  SupportFlightCost: string;
  SupportTotalCost: string;
  SeptemberDeductionAmount: string;
  TotalPaymentAmount: string;
  DangKyHLKGChieuDi: string;
  DangKyHLKGChieuVe: string;
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

function parseBoolSmart(raw: any): boolean | null {
  if (raw == null) return null;
  if (typeof raw === 'boolean') return raw;
  const s = norm(raw);
  if (!s) return null;
  if (['co', 'x', '1', 'true', 'yes', 'dang ky', 'co dang ky'].includes(s)) return true;
  if (['khong', 'k', '0', 'false', 'no'].includes(s)) return false;
  return null;
}

/* ================ Header tolerant mapping ================ */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
function norm(s: any): string {
  if (s == null) return '';
  return stripDiacritics(String(s))
    .toLowerCase()
    .replace(/[≥]/g, '>=')
    .replace(/[≤]/g, '<=')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  DepartureLocation: ['khoi hanh/ve', 'khoi hanh', 'xuat phat', 'departure'],
  GroupNumber: ['doan', 'so doan', 'group'],

  // Lịch bay chiều đi
  DepartureDate: ['ngay bay chieu di', 'ngay bay', 'departure date'],
  DepartureFlightCode: ['ma chuyen bay chieu di', 'ma chuyen bay', 'departure flight code'],
  DepartureFlightTime: ['gio bay chieu di', 'gio bay', 'departure flight time'],
  DepartureHLKG: ['hlkg (kg) chieu di', 'hlkg chieu di', 'dang ky hlkg chieu di', 'hlkg (kg)', 'hlkg', 'departure hlkg'],

  // Lịch bay chiều về
  ReturnDate: ['ngay bay chieu ve', 'return date'],
  ReturnFlightCode: ['ma chuyen bay chieu ve', 'return flight code'],
  ReturnFlightTime: ['gio bay chieu ve', 'return flight time'],
  ReturnHLKG: ['hlkg (kg) chieu ve', 'hlkg chieu ve', 'dang ky hlkg chieu ve', 'return hlkg'],

  // Xếp xe
  XeVPSB: ['xe tien vphn', 'xe tien', 'xe vpsb'],
  XeSBKS: ['xe don tai sb cam ranh', 'xe don sb cam ranh', 'xe sbks'],
  XeVinWonder: ['xe di vinwonder', 'xe vinwonder'],
  XeGalaDinner: ['xe di gala dinner', 'xe gala dinner', 'xe gala'],
  XeKSSB: ['xe tien k.san', 'xe tien ks', 'xe kssb'],
  XeSBVP: ['xe don sb noi bai', 'xe don sbvp', 'xe sbvp'],
  DateDepartureVinWonder: ['ngay di vinwonder', 'ngay di vinwonders', 'ngay di'],
  DangKyVinwonders: ['vinwonders', 'vinwoder', 'dang ky vinwonders', 'dk vinwonders'],
  RoomNumber: ['so phong', 'room number'],
  RommCode: ['ma phong', 'room code'],
  RoomType: ['loai giuong', 'room type'],
  Note: ['ghi chu cua btc', 'ghi chu btc', 'note'],
  TableNumberGala: ['xep ban gala dinner', 'xep ban gala', 'ban gala'],
  Note2: ['ghi chu 2', 'note 2'],
  TripCost: ['dong thanh toan', 'trip cost'],
  VinWonderCost: [
    'cbnv thanh toan|chieu cao >= 1m',
    'cbnv thanh toan|chieu cao >= 1m di vinwonders',
    'cbnv thanh toan|chieu cao >= 1m vinwonders',
    'cbnv thanh toan|chieu cao',
    'chieu cao >= 1m di vinwonders',
    'chieu cao >= 1m vinwonders',
    'chieu cao >= 1m',
    'chieu cao >=1m',
    'vinwonder cost'
  ],
  HLKGCost: ['mua hlkg', 'hlkg cost'],
  TotalCost: ['tong cong cbnv thanh toan', 'tong cong cbnv', 'cbnv thanh toan|tong cong', 'tong cong', 'total cost'],
  SupportLunchCost: ['ho tro tu tuc bua an', 'ho tro bua an', 'ho tro >= 5 tuoi', 'ho tro tua truc', 'support lunch cost'],
  SupportFlightCost: ['ho tro tu tuc vmb', 'support flight cost'],
  SupportTotalCost: ['tong cong cong ty ho tro', 'tong cong cty ho tro', 'cong ty ho tro|tong cong', 'tong cong cong ty', 'tong cong cty', 'support total cost'],
  SeptemberDeductionAmount: ['theo tung nguoi', 'so tien trich luong t9', 'september deduction'],
  TotalPaymentAmount: ['tong so tien thanh toan', 'tong so tien cbnv phai thanh toan', 'tong thanh toan', 'total payment'],
  DangKyHLKGChieuDi: ['dang ky hlkg chieu di'],
  DangKyHLKGChieuVe: ['dang ky hlkg chieu ve'],
  ConfirmStatus: ['trang thai', 'status'],
  ConfirmDate: ['ngay xn', 'ngay xac nhan', 'confirm date'],
  ConfirmBy: ['nguoi xn', 'nguoi xac nhan', 'confirm by']
};

function pickHeaderRows(ws: ExcelJS.Worksheet): { groupRowIdx: number; headerRowIdx: number } {
  // Tìm 2 dòng header liên tiếp có nhiều alias khớp nhất
  let bestHeaderRow = 1, bestScore = -1;
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
    if (score > bestScore) { bestScore = score; bestHeaderRow = r; }
  }
  // Nếu dòng trước bestHeaderRow cũng có nội dung, coi đó là dòng nhóm
  const groupRowIdx = bestHeaderRow > 1 ? bestHeaderRow - 1 : bestHeaderRow;
  return { groupRowIdx, headerRowIdx: bestHeaderRow };
}

/** Lấy text của 1 row thành mảng theo cột (1-indexed), merged cell trả về text cell gốc */
function getRowTexts(ws: ExcelJS.Worksheet, rowIdx: number, totalCols: number): string[] {
  const row = ws.getRow(rowIdx);
  const result: string[] = new Array(totalCols).fill('');
  for (let c = 1; c <= totalCols; c++) {
    const cell = row.getCell(c);
    const text = getCellText(cell);
    result[c - 1] = text;
  }
  return result;
}

function mapColumnsByAliases(
  headers: string[],
  groupHeaders?: string[]
): Record<keyof typeof COL_ALIASES, number> {
  const nh = headers.map(h => norm(h));
  // Tạo composite header = "group|header" nếu có groupHeaders
  const composite = headers.map((h, i) => {
    const g = groupHeaders ? norm(groupHeaders[i] || '') : '';
    const hh = norm(h);
    return g ? `${g}|${hh}` : hh;
  });

  const find = (list: string[], skipCols: number[] = [], isHeight = false, isDep = false) => {
    const normList = list.map(a => norm(a));
    for (let i = 0; i < nh.length; i++) {
      if (skipCols.includes(i + 1)) continue;
      // Nếu đang tìm Height (thông tin cá nhân), tránh cột VinWonderCost / thanh toán
      if (isHeight && (nh[i]?.includes('vinwonder') || nh[i]?.includes('1m') || composite[i]?.includes('cbnv thanh toan'))) {
        continue;
      }
      // Nếu đang tìm Chiều đi, tránh các cột có hậu tố chiều về
      if (isDep && (nh[i]?.includes('chieu ve') || composite[i]?.includes('chieu ve'))) {
        continue;
      }
      if (normList.some(a => nh[i]?.includes(a))) return i + 1;
    }
    return 0;
  };

  const out: any = {};

  // Map tuần tự - theo thứ tự khai báo trong COL_ALIASES
  const usedCols: number[] = [];

  for (const key of Object.keys(COL_ALIASES)) {
    const aliases = (COL_ALIASES as any)[key] as string[];
    const isHeightKey = key === 'Height';
    const isDepKey = ['DepartureDate', 'DepartureFlightCode', 'DepartureFlightTime', 'DepartureHLKG'].includes(key);

    // Ưu tiên tìm trên composite header (group|sub)
    let found = 0;
    for (let i = 0; i < composite.length; i++) {
      if (usedCols.includes(i + 1)) continue;
      if (isHeightKey && (composite[i]?.includes('vinwonder') || composite[i]?.includes('1m') || composite[i]?.includes('cbnv thanh toan'))) {
        continue;
      }
      if (isDepKey && (composite[i]?.includes('chieu ve') || nh[i]?.includes('chieu ve'))) {
        continue;
      }
      if (aliases.some(a => composite[i]?.includes(norm(a)))) { found = i + 1; break; }
    }
    // Fallback: tìm trên header thường, tránh cột đã dùng
    if (!found) {
      found = find(aliases, usedCols, isHeightKey, isDepKey);
    }

    out[key] = found;
    if (found > 0) usedCols.push(found);
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
  existingRegistrationList: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.loadEmployee();
    this.loadExistingRegistrations();
  }

  loadExistingRegistrations() {
    this.travelRegistrationService.getAll().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.existingRegistrationList = res.data || [];
        }
      },
      error: (err: any) => console.error('Lỗi lấy danh sách đăng ký hiện có', err)
    });
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
      { title: 'Khởi hành/Về', field: 'DepartureLocation', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
      { title: 'Đoàn', field: 'GroupNumber', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
      {
        title: 'Lịch bay chiều đi',
        columns: [
          { title: 'Ngày bay', field: 'DepartureDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
          { title: 'Mã chuyến bay', field: 'DepartureFlightCode', hozAlign: 'left', headerHozAlign: 'center', width: 110 },
          { title: 'Giờ bay', field: 'DepartureFlightTime', hozAlign: 'center', headerHozAlign: 'center', width: 120 },
          { title: 'HLKG (kg)', field: 'DepartureHLKG', hozAlign: 'left', headerHozAlign: 'center', width: 110 }
        ]
      },
      {
        title: 'Lịch bay chiều về',
        columns: [
          { title: 'Ngày bay', field: 'ReturnDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
          { title: 'Mã chuyến bay', field: 'ReturnFlightCode', hozAlign: 'left', headerHozAlign: 'center', width: 110 },
          { title: 'Giờ bay', field: 'ReturnFlightTime', hozAlign: 'center', headerHozAlign: 'center', width: 120 },
          { title: 'HLKG (kg)', field: 'ReturnHLKG', hozAlign: 'left', headerHozAlign: 'center', width: 110 }
        ]
      },
      {
        title: 'Xếp xe',
        columns: [
          { title: 'Xe tiễn VP ➝ SB', field: 'XeVPSB', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Xe đón SB Cam Ranh', field: 'XeSBKS', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Xe đi Vinwonder 12/9', field: 'XeVinWonder', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Xe đi Gala Dinner', field: 'XeGalaDinner', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Xe tiễn KS ➝ SB', field: 'XeKSSB', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Xe đón SB ➝ VP', field: 'XeSBVP', hozAlign: 'left', headerHozAlign: 'center', width: 130 }
        ]
      },
      {
        title: 'Vinwonders',
        columns: [
          { title: 'Ngày đi', field: 'DateDepartureVinWonder', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
          {
            title: 'VinWonders', field: 'DangKyVinwonders', hozAlign: 'center', headerHozAlign: 'center', width: 100,
            formatter: (cell: any) => {
              const val = cell.getValue();
              if (val === true || val === 'true' || val === 1) return 'Có';
              if (val === false || val === 'false' || val === 0) return 'Không';
              return '';
            }
          }
        ]
      },
      {
        title: 'Xếp phòng',
        columns: [
          { title: 'Số phòng', field: 'RoomNumber', hozAlign: 'center', headerHozAlign: 'center', width: 90 },
          { title: 'Mã phòng', field: 'RommCode', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
          { title: 'Loại giường', field: 'RoomType', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
          { title: 'Ghi chú của BTC', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 150 }
        ]
      },
      { title: 'Xếp bàn Gala Dinner', field: 'TableNumberGala', hozAlign: 'center', headerHozAlign: 'center', width: 130 },
      { title: 'Ghi chú 2', field: 'Note2', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
      {
        title: 'CBNV thanh toán',
        columns: [
          { title: 'Đồng thanh toán', field: 'TripCost', hozAlign: 'left', headerHozAlign: 'center', width: 140 },
          { title: 'Chiều cao ≥ 1m Vinwonders', field: 'VinWonderCost', hozAlign: 'left', headerHozAlign: 'center', width: 140 },
          { title: 'Mua HLKG', field: 'HLKGCost', hozAlign: 'left', headerHozAlign: 'center', width: 110 },
          { title: 'Tổng cộng', field: 'TotalCost', hozAlign: 'right', headerHozAlign: 'center', width: 120 }
        ]
      },
      {
        title: 'Công ty hỗ trợ',
        columns: [
          { title: 'Hỗ trợ tự túc bữa ăn', field: 'SupportLunchCost', hozAlign: 'left', headerHozAlign: 'center', width: 140 },
          { title: 'Hỗ trợ tự túc VMB', field: 'SupportFlightCost', hozAlign: 'left', headerHozAlign: 'center', width: 130 },
          { title: 'Tổng cộng', field: 'SupportTotalCost', hozAlign: 'right', headerHozAlign: 'center', width: 120 }
        ]
      },
      {
        title: 'Quyết toán vào kỳ lương T9',
        columns: [
          { title: 'Theo từng người', field: 'SeptemberDeductionAmount', hozAlign: 'right', headerHozAlign: 'center', width: 140 },
          { title: 'Tổng số tiền thanh toán', field: 'TotalPaymentAmount', hozAlign: 'right', headerHozAlign: 'center', width: 150 }
        ]
      }
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

    const { groupRowIdx, headerRowIdx } = pickHeaderRows(ws);
    // Tính tổng số cột (dùng actualColumnCount hoặc columnCount)
    const totalCols = Math.max(ws.actualColumnCount || 0, ws.columnCount || 0, 60);

    // Đọc cả group header (row 1) và sub header (row 2)
    const groupHeaders = getRowTexts(ws, groupRowIdx, totalCols);
    const subHeaders = getRowTexts(ws, headerRowIdx, totalCols);

    // Với merged cell ở group row: lan giá trị sang các cột con
    let lastGroup = '';
    const filledGroupHeaders = groupHeaders.map(g => {
      if (g) lastGroup = g;
      return lastGroup;
    });

    const col = mapColumnsByAliases(subHeaders, filledGroupHeaders);
    const headerRowIndex = headerRowIdx;

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

      const GroupNumber = getCellSafe(row, col.GroupNumber);
      const DepartureDate = getCellSafe(row, col.DepartureDate);
      const DepartureFlightCode = getCellSafe(row, col.DepartureFlightCode);
      const DepartureFlightTime = getCellSafe(row, col.DepartureFlightTime);
      const DepartureHLKG = getCellSafe(row, col.DepartureHLKG) || getCellSafe(row, col.DangKyHLKGChieuDi);

      const ReturnDate = getCellSafe(row, col.ReturnDate);
      const ReturnFlightCode = getCellSafe(row, col.ReturnFlightCode);
      const ReturnFlightTime = getCellSafe(row, col.ReturnFlightTime);
      const ReturnHLKG = getCellSafe(row, col.ReturnHLKG) || getCellSafe(row, col.DangKyHLKGChieuVe);

      const XeVPSB = getCellSafe(row, col.XeVPSB);
      const XeSBKS = getCellSafe(row, col.XeSBKS);
      const XeVinWonder = getCellSafe(row, col.XeVinWonder);
      const XeGalaDinner = getCellSafe(row, col.XeGalaDinner);
      const XeKSSB = getCellSafe(row, col.XeKSSB);
      const XeSBVP = getCellSafe(row, col.XeSBVP);

      const DateDepartureVinWonder = getCellSafe(row, col.DateDepartureVinWonder);
      const DangKyVinwondersRaw = getCellSafe(row, col.DangKyVinwonders);
      const DangKyVinwonders = parseBoolSmart(DangKyVinwondersRaw);

      const RoomNumber = getCellSafe(row, col.RoomNumber);
      const RommCode = getCellSafe(row, col.RommCode);
      const RoomType = getCellSafe(row, col.RoomType);
      const Note = getCellSafe(row, col.Note);

      const TableNumberGala = getCellSafe(row, col.TableNumberGala);
      const Note2 = getCellSafe(row, col.Note2);

      const TripCost = getCellSafe(row, col.TripCost);
      const VinWonderCost = getCellSafe(row, col.VinWonderCost);
      const HLKGCost = getCellSafe(row, col.HLKGCost);
      const TotalCost = getCellSafe(row, col.TotalCost);

      const SupportLunchCost = getCellSafe(row, col.SupportLunchCost);
      const SupportFlightCost = getCellSafe(row, col.SupportFlightCost);
      const SupportTotalCost = getCellSafe(row, col.SupportTotalCost);

      const SeptemberDeductionAmount = getCellSafe(row, col.SeptemberDeductionAmount);
      const TotalPaymentAmount = getCellSafe(row, col.TotalPaymentAmount);

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
        Height: Height ? String(Height).trim() : '',
        Gender,
        Relationship,
        Address,
        CCCD,
        CCCDIssueDate,
        CCCDIssuePlace,
        PhoneNumber,
        DepartureLocation,
        GroupNumber,
        DepartureDate,
        DepartureFlightCode,
        DepartureFlightTime,
        DepartureHLKG,
        ReturnDate,
        ReturnFlightCode,
        ReturnFlightTime,
        ReturnHLKG,
        XeVPSB,
        XeSBKS,
        XeVinWonder,
        XeGalaDinner,
        XeKSSB,
        XeSBVP,
        DateDepartureVinWonder,
        DangKyVinwonders,
        RoomNumber,
        RommCode,
        RoomType,
        Note,
        TableNumberGala,
        Note2,
        TripCost,
        VinWonderCost,
        HLKGCost,
        TotalCost,
        SupportLunchCost,
        SupportFlightCost,
        SupportTotalCost,
        SeptemberDeductionAmount,
        TotalPaymentAmount,
        DangKyHLKGChieuDi: DepartureHLKG,
        DangKyHLKGChieuVe: ReturnHLKG,
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

      // Tìm bản ghi đã tồn tại theo Mã nhân viên hoặc Tên nhân viên
      let existingRecord: any = null;
      if (r.EmployeeCode && r.EmployeeCode.trim()) {
        const code = r.EmployeeCode.trim().toLowerCase();
        existingRecord = this.existingRegistrationList.find(x => x.EmployeeCode && x.EmployeeCode.trim().toLowerCase() === code);
      }
      if (!existingRecord && r.EmployeeName && r.EmployeeName.trim()) {
        const name = r.EmployeeName.trim().toLowerCase();
        if (isCBNV && parsedEmployeeID > 0) {
          existingRecord = this.existingRegistrationList.find(x => x.EmployeeID === parsedEmployeeID && x.EmployeeName && x.EmployeeName.trim().toLowerCase() === name);
        } else if (!isCBNV && lastCBNVEmployeeID > 0) {
          existingRecord = this.existingRegistrationList.find(x => x.OwnerEmployeeID === lastCBNVEmployeeID && x.EmployeeName && x.EmployeeName.trim().toLowerCase() === name && (!r.Relationship || x.Relationship === r.Relationship));
        }
      }

      return {
        ID: existingRecord ? existingRecord.ID : 0,
        EmployeeID: isCBNV ? parsedEmployeeID : 0,
        EmployeeCode: r.EmployeeCode || '',
        EmployeeName: r.EmployeeName || '',
        Department: r.Department || '',
        PositionName: r.PositionName || '',
        BirthDay: this.parseDateString(r.BirthDay),
        Age: parseNumberSmart(r.Age) ?? null,
        Height: r.Height ? String(r.Height).trim() : null,
        Gender: r.Gender || '',
        Relationship: r.Relationship || '',
        Address: r.Address || '',
        CCCD: r.CCCD || '',
        CCCDIssueDate: this.parseDateString(r.CCCDIssueDate),
        CCCDIssuePlace: r.CCCDIssuePlace || '',
        PhoneNumber: r.PhoneNumber || '',
        DepartureLocation: r.DepartureLocation || '',
        DangKyHLKGChieuDi: r.DepartureHLKG || r.DangKyHLKGChieuDi || '',
        DangKyHLKGChieuVe: r.ReturnHLKG || r.DangKyHLKGChieuVe || '',
        GroupNumber: r.GroupNumber || '',
        DepartureDate: this.parseDateString(r.DepartureDate),
        DepartureFlightCode: r.DepartureFlightCode || '',
        DepartureFlightTime: r.DepartureFlightTime || '',
        DepartureHLKG: r.DepartureHLKG || r.DangKyHLKGChieuDi || '',
        ReturnDate: this.parseDateString(r.ReturnDate),
        ReturnFlightCode: r.ReturnFlightCode || '',
        ReturnFlightTime: r.ReturnFlightTime || '',
        ReturnHLKG: r.ReturnHLKG || r.DangKyHLKGChieuVe || '',
        XeVPSB: r.XeVPSB || '',
        XeSBKS: r.XeSBKS || '',
        XeVinWonder: r.XeVinWonder || '',
        XeGalaDinner: r.XeGalaDinner || '',
        XeKSSB: r.XeKSSB || '',
        XeSBVP: r.XeSBVP || '',
        DateDepartureVinWonder: this.parseDateString(r.DateDepartureVinWonder),
        DangKyVinwonders: r.DangKyVinwonders,
        RoomNumber: r.RoomNumber || '',
        RommCode: r.RommCode || '',
        RoomType: r.RoomType || '',
        Note: r.Note || '',
        TableNumberGala: r.TableNumberGala || '',
        Note2: r.Note2 || '',
        TripCost: r.TripCost || '',
        VinWonderCost: r.VinWonderCost || '',
        HLKGCost: r.HLKGCost || '',
        TotalCost: r.TotalCost || '',
        SupportLunchCost: r.SupportLunchCost || '',
        SupportFlightCost: r.SupportFlightCost || '',
        SupportTotalCost: r.SupportTotalCost || '',
        SeptemberDeductionAmount: r.SeptemberDeductionAmount || '',
        TotalPaymentAmount: r.TotalPaymentAmount || '',
        ConfirmStatus: existingRecord ? (existingRecord.ConfirmStatus ?? 0) : 0,
        ConfirmDate: existingRecord ? existingRecord.ConfirmDate : null,
        ConfirmBy: existingRecord ? (existingRecord.ConfirmBy || '') : '',
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
