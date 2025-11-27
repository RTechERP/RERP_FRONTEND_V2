import {
  Component, OnInit, AfterViewInit, ViewEncapsulation
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
import { ProductRtcQrCodeService } from '../product-rtc-qr-code-service/product-rtc-qr-code.service';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../app.config';

/* ================= Types ================= */
export interface QRCodeRow {
  ID?: number;
  ProductRTCID?: number;
  ThietBi?: string;
  MaQRCode: string;
  SerialNumber: string;
  TrangThai: string | number;
  ViTriModula?: string;
  MaSanPham?: string;
  TenSanPham?: string;
  MaNoiBo?: string;
  ViTri?: string;
  GhiChu?: string;
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

function parseStatus(raw: string | null | undefined): number {
  if (!raw) return 1; // Default: Trong kho
  const s = norm(raw);
  if (!s) return 1;
  
  // Map trạng thái
  if (s.includes('trong kho') || s === '1') return 1;
  if (s.includes('đang mượn') || s.includes('dang muon') || s === '2') return 2;
  if (s.includes('đã xuất') || s.includes('da xuat') || s === '3') return 3;
  if (s.includes('lost') || s === '4') return 4;
  return 1; // Default
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
  ID: ['id'],
  ProductRTCID: ['productrtcid', 'product rtc id', 'product_rtc_id'],
  TrangThai: ['trang thai', 'trạng thái', 'status', 'tinh trang'],
  MaQRCode: ['ma qr code', 'mã qr code', 'qr code', 'qrcode', 'ma qr'],
  MaSanPham: ['ma san pham', 'mã sản phẩm', 'product code', 'ma sp'],
  TenSanPham: ['ten san pham', 'tên sản phẩm', 'product name', 'ten sp'],
  MaNoiBo: ['ma noi bo', 'mã nội bộ', 'product code rtc'],
  ViTri: ['vi tri', 'vị trí', 'address box', 'address'],
  GhiChu: ['ghi chu', 'ghi chú', 'note'],
  SerialNumber: ['serialnumber', 'serial number', 'serial', 'số seri', 'so seri'],
  ViTriModula: ['vi tri modula', 'vị trí modula', 'modula', 'location', 'modula location']
};

function pickHeaderRow(ws: ExcelJS.Worksheet): number {
  let bestRow = 1, bestScore = -1;
  const maxScan = Math.min(30, ws.rowCount);
  const aliases = Object.values(COL_ALIASES).flat();
  // Thêm các header chính xác từ format export
  const exactHeaders = ['trạng thái', 'mã qr code', 'serialnumber', 'vị trí modula', 'id', 'productrtcid'];
  
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
    // Tính điểm: ưu tiên các header chính xác, sau đó mới đến aliases
    const exactScore = texts.reduce((acc, t) => acc + (exactHeaders.some(h => t === h) ? 2 : 0), 0);
    const aliasScore = texts.reduce((acc, t) => acc + (aliases.some(a => t.includes(a)) ? 1 : 0), 0);
    const score = exactScore + aliasScore;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  return bestRow;
}

function mapColumnsByAliases(headers: string[]): Record<'ID' | 'ProductRTCID' | 'TrangThai' | 'MaQRCode' | 'MaSanPham' | 'TenSanPham' | 'MaNoiBo' | 'ViTri' | 'GhiChu' | 'SerialNumber' | 'ViTriModula', number> {
  const nh = headers.map(h => norm(h));
  const find = (list: string[]) => { 
    for (let i = 0; i < nh.length; i++) {
      if (list.some(a => nh[i]?.includes(a))) return i + 1;
    }
    return 0; 
  };
  const out = {
    ID: find(COL_ALIASES.ID),
    ProductRTCID: find(COL_ALIASES.ProductRTCID),
    TrangThai: find(COL_ALIASES.TrangThai),
    MaQRCode: find(COL_ALIASES.MaQRCode),
    MaSanPham: find(COL_ALIASES.MaSanPham),
    TenSanPham: find(COL_ALIASES.TenSanPham),
    MaNoiBo: find(COL_ALIASES.MaNoiBo),
    ViTri: find(COL_ALIASES.ViTri),
    GhiChu: find(COL_ALIASES.GhiChu),
    SerialNumber: find(COL_ALIASES.SerialNumber),
    ViTriModula: find(COL_ALIASES.ViTriModula)
  };
  // Chỉ fallback cho các cột bắt buộc
  if (!out.MaQRCode || out.MaQRCode < 1 || out.MaQRCode > headers.length) out.MaQRCode = 4; // Mã QR Code thường ở cột 4
  if (!out.SerialNumber || out.SerialNumber < 1 || out.SerialNumber > headers.length) out.SerialNumber = 10; // SerialNumber thường ở cột 10
  if (!out.TrangThai || out.TrangThai < 1 || out.TrangThai > headers.length) out.TrangThai = 1; // Trạng thái thường ở cột 1
  return out;
}

/* ================= Component ================= */
@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-product-rtc-qr-code-import-excel',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSplitterModule, NzInputModule, NzSelectModule, NzProgressModule
  ],
  templateUrl: './product-rtc-qr-code-import-excel.component.html',
  styleUrl: './product-rtc-qr-code-import-excel.component.css'
})
export class ProductRtcQrCodeImportExcelComponent implements OnInit, AfterViewInit {
  productRTCList: any[] = [];
  modulaLocationList: any[] = [];
  filePath = '';
  excelSheets: string[] = [];
  selectedSheet = '';
  duplicateCodes: string[] = [];
  tableExcel: Tabulator | null = null;
  dataTableExcel: QRCodeRow[] = [];

  displayProgress = 0;
  displayText = '0/0';
  totalRowsAfterFileRead = 0;

  private savingTotal = 0;
  private savingDone = 0;
  warehouseID: number = 1;

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private qrCodeService: ProductRtcQrCodeService
  ) { }

  ngOnInit() {
    this.loadProducts();
    this.loadModulaLocations();
  }

  ngAfterViewInit(): void {
    this.drawtable();
  }

  /* ===== Load Data ===== */
  private loadProducts() {
    this.qrCodeService.getProducts().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res?.data?.productRTC) {
          this.productRTCList = Array.isArray(res.data.productRTC) ? res.data.productRTC : [];
        } else if (res?.status === 1 && Array.isArray(res?.data)) {
          this.productRTCList = res.data;
        }
      },
      error: (err: any) => {
        console.error('Error loading products:', err);
      }
    });
  }

  private loadModulaLocations() {
    this.qrCodeService.getLocationModula().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res?.data?.dataList) {
          this.modulaLocationList = res.data.dataList;
        }
      },
      error: (err: any) => {
        console.error('Error loading modula locations:', err);
      }
    });
  }

  private findProductIdByName(name: string): number | undefined {
    if (!this.productRTCList?.length || !name) return undefined;
    const key = norm(name);
    // Tìm theo tên hoặc mã sản phẩm
    const hit = this.productRTCList.find((p: any) =>
      norm(p?.Name || p?.ProductName || '') === key ||
      norm(p?.Code || p?.ProductCode || '') === key ||
      norm(p?.ProductCodeRTC || '') === key
    );
    return hit?.ID ?? undefined;
  }

  private findModulaIdByName(name: string): number | undefined {
    if (!this.modulaLocationList?.length || !name) return undefined;
    const key = norm(name);
    // Tìm theo tên vị trí modula
    const hit = this.modulaLocationList.find((m: any) =>
      norm(m?.Name || m?.LocationName || m?.ModulaLocationName || '') === key ||
      norm(m?.Code || m?.ModulaLocationDetailCode || '') === key
    );
    return hit?.ModulaLocationDetailID ?? hit?.ID ?? undefined;
  }

  /* ===== Progress ===== */
  private setReadingProgress(pct: number, text: string) {
    this.displayProgress = Math.max(0, Math.min(100, pct | 0));
    this.displayText = text;
  }

  beginSaving(total: number) {
    this.savingDone = 0;
    this.savingTotal = total | 0;
    this.setSavingProgress(0, this.savingTotal);
  }

  tickSaving(step = 1) {
    this.setSavingProgress(this.savingDone + (step | 0), this.savingTotal);
  }

  endSaving(success: boolean) {
    this.setSavingProgress(this.savingTotal, this.savingTotal);
    if (success) {
      this.notification.success(NOTIFICATION_TITLE.success, `Đã lưu ${this.savingTotal}/${this.savingTotal} bản ghi`);
    } else {
      this.notification.error(NOTIFICATION_TITLE.error, `Lưu thất bại. Đã xử lý ${this.savingDone}/${this.savingTotal} bản ghi`);
    }
  }

  private setSavingProgress(done: number, total: number) {
    this.savingDone = Math.max(0, done | 0);
    this.savingTotal = Math.max(0, total | 0);
    const pct = total > 0 ? Math.floor((this.savingDone / this.savingTotal) * 100) : 0;
    this.displayProgress = Math.min(100, Math.max(0, pct));
    this.displayText = `${this.savingDone}/${this.savingTotal} bản ghi`;
  }

  private resetProgress() {
    this.displayProgress = 0;
    this.displayText = '0/0';
    this.totalRowsAfterFileRead = 0;
    this.savingDone = 0;
    this.savingTotal = 0;
  }

  formatProgressText() {
    return this.displayText;
  }

  /* ===== UI / Table ===== */
  private columns(): ColumnDefinition[] {
    return [
      { title: 'ID', field: 'ID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
      { title: 'ProductRTCID', field: 'ProductRTCID', hozAlign: 'center', headerHozAlign: 'center', visible: false },
      {
        title: 'Trạng thái',
        field: 'TrangThai',
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const status = cell.getValue();
          if (typeof status === 'number') {
            switch (status) {
              case 1: return 'Trong kho';
              case 2: return 'Đang mượn';
              case 3: return 'Đã xuất kho';
              case 4: return 'Lost';
              default: return '';
            }
          }
          return String(status || '');
        }
      },
      { title: 'Mã QR Code', field: 'MaQRCode', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Mã sản phẩm', field: 'MaSanPham', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Tên sản phẩm', field: 'TenSanPham', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Mã nội bộ', field: 'MaNoiBo', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Vị trí', field: 'ViTri', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Ghi chú', field: 'GhiChu', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'SerialNumber', field: 'SerialNumber', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Vị trí modula', field: 'ViTriModula', hozAlign: 'left', headerHozAlign: 'center' }
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chọn tệp Excel (.xlsx hoặc .xls)');
      input.value = '';
      this.resetExcelImportState();
      return;
    }
    this.filePath = file.name;
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.totalRowsAfterFileRead = 0;
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
          this.resetExcelImportState();
          input.value = '';
          return;
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
    if (!ws) {
      this.resetExcelImportState();
      return;
    }
    const headerRowIndex = pickHeaderRow(ws);
    const headerRow = ws.getRow(headerRowIndex);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => headers[colNumber - 1] = getCellText(cell) || `C${colNumber}`);
    const col = mapColumnsByAliases(headers);

    const data: QRCodeRow[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;
      
      // Đọc các cột theo format export
      const IDRaw = getCellText(row.getCell(col.ID));
      const ProductRTCIDRaw = getCellText(row.getCell(col.ProductRTCID));
      const TrangThaiRaw = getCellText(row.getCell(col.TrangThai));
      const MaQRCode = getCellText(row.getCell(col.MaQRCode));
      const MaSanPham = getCellText(row.getCell(col.MaSanPham));
      const TenSanPham = getCellText(row.getCell(col.TenSanPham));
      const MaNoiBo = getCellText(row.getCell(col.MaNoiBo));
      const ViTri = getCellText(row.getCell(col.ViTri));
      const GhiChu = getCellText(row.getCell(col.GhiChu));
      const SerialNumber = getCellText(row.getCell(col.SerialNumber));
      const ViTriModula = getCellText(row.getCell(col.ViTriModula));

      // Bỏ qua dòng trống
      if (!MaQRCode && !SerialNumber) return;

      // Parse ID và ProductRTCID
      const ID = IDRaw ? parseInt(IDRaw, 10) : undefined;
      const ProductRTCID = ProductRTCIDRaw ? parseInt(ProductRTCIDRaw, 10) : undefined;
      
      // Parse trạng thái
      const TrangThai = parseStatus(TrangThaiRaw);

      data.push({
        ID: isNaN(ID as any) ? undefined : ID,
        ProductRTCID: isNaN(ProductRTCID as any) ? undefined : ProductRTCID,
        MaQRCode: MaQRCode || '',
        SerialNumber: SerialNumber || '',
        TrangThai,
        ViTriModula: ViTriModula || '',
        MaSanPham: MaSanPham || '',
        TenSanPham: TenSanPham || '',
        MaNoiBo: MaNoiBo || '',
        ViTri: ViTri || '',
        GhiChu: GhiChu || ''
      });
    });

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = data.length;
    this.setReadingProgress(0, data.length === 0 ? 'Không có dữ liệu' : `0/${data.length} bản ghi`);
    if (this.tableExcel) {
      this.tableExcel.replaceData(this.dataTableExcel as any);
    } else {
      this.drawtable();
    }
  }

  /* ===== Reset / Close ===== */
  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.resetProgress();
    if (this.tableExcel) {
      this.tableExcel.replaceData([]);
    }
  }

  closeExcelModal() {
    this.modalService.dismissAll(true);
  }

  /* ===== Save Data ===== */
  async saveExcelData(): Promise<void> {
    if (!this.dataTableExcel.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu.');
      return;
    }

    // Build payload
    const payload = this.dataTableExcel.map((row) => {
      // Ưu tiên sử dụng ProductRTCID từ file, nếu không có thì tìm theo tên/mã sản phẩm
      let productRTCID = row.ProductRTCID;
      if (!productRTCID) {
        // Tìm theo tên sản phẩm hoặc mã sản phẩm
        if (row.TenSanPham) {
          productRTCID = this.findProductIdByName(row.TenSanPham);
        }
        if (!productRTCID && row.MaSanPham) {
          productRTCID = this.findProductIdByName(row.MaSanPham);
        }
        if (!productRTCID && row.MaNoiBo) {
          productRTCID = this.findProductIdByName(row.MaNoiBo);
        }
      }
      
      // Tìm ModulaLocationDetailID
      const modulaLocationID = row.ViTriModula ? this.findModulaIdByName(row.ViTriModula) : undefined;

      return {
        ID: row.ID || 0, // Sử dụng ID từ file nếu có (để update), nếu không thì 0 (tạo mới)
        ProductRTCID: productRTCID || 0,
        ProductQRCode: row.MaQRCode.trim(),
        SerialNumber: row.SerialNumber.trim(),
        Status: typeof row.TrangThai === 'number' ? row.TrangThai : parseStatus(String(row.TrangThai)),
        ModulaLocationDetailID: modulaLocationID ?? null,
        WarehouseID: this.warehouseID || 1,
        IsDeleted: false
      };
    }).filter(item => item.ProductRTCID && item.ProductQRCode && item.SerialNumber);

    if (!payload.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ để lưu.');
      return;
    }

    // Đóng modal ngay lập tức
    this.closeExcelModal();

    // Hiển thị thông báo bắt đầu lưu
    this.notification.info(NOTIFICATION_TITLE.success, `Đang lưu ${payload.length} bản ghi...`);

    // Chạy async ở background
    this.processDataInBackground(payload);
  }

  private async processDataInBackground(payload: any[]): Promise<void> {
    this.duplicateCodes = [];
    let savedCount = 0;

    try {
      // Lưu từng batch hoặc tất cả cùng lúc tùy API
      for (const item of payload) {
        try {
          await firstValueFrom(this.qrCodeService.saveData([item]));
          savedCount++;
        } catch (res: any) {
          const msg = res?.error?.message || '';
          // Parse lỗi dạng "Mã QrCode [xxx] đã được sử dụng"
          const match = msg.match(/Mã QrCode\s*\[(.+?)\]/);
          if (match && match[1]) {
            const code = match[1].trim();
            if (!this.duplicateCodes.includes(code)) {
              this.duplicateCodes.push(code);
            }
          }
        }
      }

      // Kết thúc: hiển thị kết quả
      if (this.duplicateCodes.length > 0) {
        const list = this.duplicateCodes.join(', ');
        if (savedCount === 0) {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            `Mã QR Code: ${list} đã tồn tại, không thể lưu`
          );
        } else if (savedCount < payload.length) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Đã lưu thành công ${savedCount}/${payload.length} bản ghi. ` +
            `Các mã sau đã tồn tại: ${list}`
          );
        }
      } else {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Đã lưu thành công ${savedCount}/${payload.length} bản ghi.`
        );
      }
    } catch (res: any) {
      console.error('Lỗi khi lưu dữ liệu Excel:', res);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        res?.error?.message || 'Lưu dữ liệu thất bại. Vui lòng thử lại.'
      );
    }
  }
}

