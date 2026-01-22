import {
  Component, OnInit, AfterViewInit, ViewEncapsulation, Input, ChangeDetectorRef, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
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
import { NzFormModule } from 'ng-zorro-antd/form';
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
function formatCellValue(v: any): string {
  if (v == null) return '';
  if (v instanceof Date) {
    return DateTime.fromJSDate(v).toFormat('dd/MM/yyyy');
  }
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  if (Array.isArray((v as any)?.richText)) return (v as any).richText.map((rt: any) => rt.text ?? '').join('').trim();
  if ((v as any)?.text) return String((v as any).text).trim();
  if ((v as any)?.hyperlink && (v as any)?.text) return String((v as any).text).trim();
  if ((v as any)?.result != null) return formatCellValue((v as any).result);
  return String(v).trim();
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
  SerialNumber: ['serialnumber', 'serial number', 'serial', 'số seri', 'so seri', 'seri'],
  ViTriModula: ['vi tri modula', 'vị trí modula', 'modula', 'location', 'modula location', 'kho']
};

function pickHeaderRow(ws: ExcelJS.Worksheet): number {
  let bestRow = 1, bestScore = -1;
  const maxScan = Math.min(30, ws.rowCount);
  const aliases = Object.values(COL_ALIASES).flat();
  // Thêm các header chính xác từ format export
  const exactHeaders = ['trạng thái', 'mã qr code', 'serialnumber', 'vị trí modula', 'id', 'productrtcid'].map(h => norm(h));

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
    const aliasScore = texts.reduce((acc, t) => acc + (aliases.some(a => t.includes(norm(a))) ? 1 : 0), 0);
    const score = exactScore + aliasScore;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  console.log(`Picked header row: ${bestRow} with score ${bestScore}`);
  return bestRow;
}

function mapColumnsByAliases(headers: string[]): Record<'ID' | 'ProductRTCID' | 'TrangThai' | 'MaQRCode' | 'MaSanPham' | 'TenSanPham' | 'MaNoiBo' | 'ViTri' | 'GhiChu' | 'SerialNumber' | 'ViTriModula', number> {
  const nh = headers.map(h => norm(h));
  const find = (list: string[]) => {
    const normList = list.map(a => norm(a));
    for (let i = 0; i < nh.length; i++) {
      if (normList.some(a => nh[i]?.includes(a))) return i + 1;
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
  // Chỉ fallback cho các cột bắt buộc nếu không tìm thấy qua alias
  if (!out.MaQRCode) {
    out.MaQRCode = find(['ma', 'qr']) || 4;
  }
  if (!out.SerialNumber) {
    out.SerialNumber = find(['serial', 'sn', 'seri']) || 10;
  }
  if (!out.TrangThai) {
    out.TrangThai = find(['trang thai', 'status', 'tt', 'stat']) || 1;
  }
  console.log('Mapped columns:', out);
  return out;
}

/* ================= Component ================= */
@Component({
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  selector: 'app-product-rtc-qr-code-import-excel',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSplitterModule, NzInputModule, NzSelectModule, NzProgressModule,
    NzFormModule
  ],
  templateUrl: './product-rtc-qr-code-import-excel.component.html',
  styleUrl: './product-rtc-qr-code-import-excel.component.css'
})
export class ProductRtcQrCodeImportExcelComponent implements OnInit, AfterViewInit {
  @ViewChild('tableContainer', { static: false }) tableContainer!: ElementRef;
  productRTCList: any[] = [];
  modulaLocationList: any[] = [];
  filePath = '';
  excelSheets: string[] = [];
  selectedSheet = '';
  duplicateCodes: string[] = [];
  tableExcel: any;
  dataTableExcel: any[] = [];

  displayProgress = 0;
  displayText = '0/0';
  totalRowsAfterFileRead = 0;

  private savingTotal = 0;
  private savingDone = 0;
  @Input() warehouseID: number = 1;

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private qrCodeService: ProductRtcQrCodeService,
    private cdr: ChangeDetectorRef
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
    if (!this.tableContainer) {
      console.warn('Table container not found');
      return;
    }

    setTimeout(() => {
      try {
        if (this.tableExcel) {
          this.tableExcel.destroy();
        }

        this.tableExcel = new Tabulator(this.tableContainer.nativeElement, {
          data: this.dataTableExcel,
          layout: 'fitDataFill',
          ...DEFAULT_TABLE_CONFIG,
          height: '400px',
          pagination: true,
          paginationSize: 50,
          paginationMode: 'local',
          columns: this.columns()
        });

        this.tableExcel.on("tableBuilt", () => {
          this.tableExcel.redraw(true);
          this.cdr.detectChanges();
        });
      } catch (err) {
        console.error('Tabulator init error:', err);
      }
    }, 50); // Increased timeout to ensure DOM is ready
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
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error reading file:', error);
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
    headerRow.eachCell((cell, colNumber) => headers[colNumber - 1] = formatCellValue(cell.value) || `C${colNumber}`);
    const col = mapColumnsByAliases(headers);

    const data: QRCodeRow[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      // Đọc các cột theo format export
      const IDRaw = col.ID > 0 ? formatCellValue(row.getCell(col.ID).value) : '';
      const ProductRTCIDRaw = col.ProductRTCID > 0 ? formatCellValue(row.getCell(col.ProductRTCID).value) : '';
      const TrangThaiRaw = col.TrangThai > 0 ? formatCellValue(row.getCell(col.TrangThai).value) : '';
      const MaQRCode = col.MaQRCode > 0 ? formatCellValue(row.getCell(col.MaQRCode).value) : '';
      const MaSanPham = col.MaSanPham > 0 ? formatCellValue(row.getCell(col.MaSanPham).value) : '';
      const TenSanPham = col.TenSanPham > 0 ? formatCellValue(row.getCell(col.TenSanPham).value) : '';
      const MaNoiBo = col.MaNoiBo > 0 ? formatCellValue(row.getCell(col.MaNoiBo).value) : '';
      const ViTri = col.ViTri > 0 ? formatCellValue(row.getCell(col.ViTri).value) : '';
      const GhiChu = col.GhiChu > 0 ? formatCellValue(row.getCell(col.GhiChu).value) : '';
      const SerialNumber = col.SerialNumber > 0 ? formatCellValue(row.getCell(col.SerialNumber).value) : '';
      const ViTriModula = col.ViTriModula > 0 ? formatCellValue(row.getCell(col.ViTriModula).value) : '';

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

    this.cdr.detectChanges();
    this.drawtable();
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
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    // Lọc dữ liệu hợp lệ
    const validDataToSave = this.dataTableExcel.filter(row => row.MaQRCode || row.SerialNumber);

    if (validDataToSave.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ để lưu!');
      return;
    }

    // Reset tiến trình
    this.savingTotal = validDataToSave.length;
    this.savingDone = 0;
    this.displayProgress = 0;
    this.displayText = `Đang chuẩn bị lưu: 0/${this.savingTotal} bản ghi`;

    // Chuẩn bị payload
    const processedData = validDataToSave.map((row) => {
      let productRTCID = row.ProductRTCID;
      if (!productRTCID) {
        if (row.TenSanPham) productRTCID = this.findProductIdByName(row.TenSanPham);
        if (!productRTCID && row.MaSanPham) productRTCID = this.findProductIdByName(row.MaSanPham);
        if (!productRTCID && row.MaNoiBo) productRTCID = this.findProductIdByName(row.MaNoiBo);
      }

      const modulaLocationID = row.ViTriModula ? this.findModulaIdByName(row.ViTriModula) : undefined;

      return {
        ID: row.ID || 0,
        ProductRTCID: productRTCID || 0,
        ProductQRCode: (row.MaQRCode || '').trim(),
        SerialNumber: (row.SerialNumber || '').trim(),
        Status: typeof row.TrangThai === 'number' ? row.TrangThai : parseStatus(String(row.TrangThai)),
        ModulaLocationDetailID: modulaLocationID ?? null,
        WarehouseID: this.warehouseID || 1,
        IsDeleted: false
      };
    }).filter(item => item.ProductQRCode || item.SerialNumber);

    if (processedData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy dữ liệu hợp lệ sau khi xử lý!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    this.duplicateCodes = [];

    // Hàm lưu tuần tự có delay để cập nhật UI
    const saveWithDelay = (index: number) => {
      if (index >= processedData.length) {
        this.showSaveSummary(successCount, errorCount, processedData.length);
        return;
      }

      const item = processedData[index];

      setTimeout(() => {
        this.qrCodeService.saveData([item]).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              successCount++;
            } else {
              errorCount++;
              this.collectDuplicate(response?.error?.message || response?.message);
            }
            this.updateProgress(index + 1, processedData.length);
            this.cdr.detectChanges();
            saveWithDelay(index + 1);
          },
          error: (err: any) => {
            errorCount++;
            this.collectDuplicate(err?.error?.message || err?.message);
            this.updateProgress(index + 1, processedData.length);
            this.cdr.detectChanges();
            saveWithDelay(index + 1);
          }
        });
      }, 5); // Delay 5ms giống employee import
    };

    // Bắt đầu lưu
    saveWithDelay(0);
  }

  private collectDuplicate(msg: string) {
    if (!msg) return;
    const match = msg.match(/Mã QrCode\s*\[(.+?)\]/);
    if (match && match[1]) {
      const code = match[1].trim();
      if (!this.duplicateCodes.includes(code)) {
        this.duplicateCodes.push(code);
      }
    }
  }

  private updateProgress(done: number, total: number) {
    this.savingDone = done;
    this.displayProgress = Math.round((done / total) * 100);
    this.displayText = `Đang lưu: ${done}/${total} bản ghi`;
  }

  private showSaveSummary(success: number, error: number, total: number) {
    if (this.duplicateCodes.length > 0) {
      const list = this.duplicateCodes.slice(0, 10).join(', ') + (this.duplicateCodes.length > 10 ? '...' : '');
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Đã lưu ${success}/${total}. Các mã sau đã tồn tại: ${list}`
      );
    } else if (success === total) {
      this.notification.success(NOTIFICATION_TITLE.success, `Đã lưu thành công ${success}/${total} bản ghi.`);
    } else {
      this.notification.info('Thông báo', `Hoàn thành lưu dữ liệu. Thành công: ${success}, Thất bại: ${error}`);
    }
  }

  /* ===== Helpers ===== */
  private parseDate(value: any): Date | null {
    if (!value) return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private parseBoolean(value: string, keyword?: string): boolean {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    return keyword ? !lowerValue.includes(keyword) : !!lowerValue;
  }

  private parseDecimal(value: any): number | null {
    if (!value) return null;
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  private parseInt(value: any): number | null {
    if (!value) return null;
    const num = parseInt(value.toString(), 10);
    return isNaN(num) ? null : num;
  }
}

