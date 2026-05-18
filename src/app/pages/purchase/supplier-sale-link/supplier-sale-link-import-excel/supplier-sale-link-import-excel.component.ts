import { Component, ElementRef, OnInit, OnDestroy, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as XLSX from 'xlsx';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SupplierSaleLinkService } from '../supplier-sale-link.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

type ExcelPreviewRow = { [key: string]: any };

@Component({
  selector: 'app-supplier-sale-link-import-excel',
  standalone: true,
  templateUrl: './supplier-sale-link-import-excel.component.html',
  styleUrls: ['./supplier-sale-link-import-excel.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzFormModule,
    NzProgressModule,
    NzModalModule
  ]
})
export class SupplierSaleLinkImportExcelComponent implements OnInit, OnDestroy {
  file: File | null = null;
  fileName = '';
  sheetName = '';
  availableSheets: string[] = [];
  private headerTitles: string[] = [];

  isFormDisabled = false;
  loading = false;
  saving = false;

  progressCurrent = 0;
  progressTotal = 0;
  progressPercent = 0;
  progressText = '';
  private progressInterval: any = null;

  @ViewChild('tb_excelPreview', { static: false }) tableElement!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  private table?: Tabulator;
  previewData: ExcelPreviewRow[] = [];
  private workbook?: XLSX.WorkBook;

  constructor(
    public modal: NgbActiveModal,
    private noti: NzNotificationService,
    private svc: SupplierSaleLinkService,
    private cdr: ChangeDetectorRef,
    private modalSvc: NzModalService
  ) { }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.stopFakeProgress();
  }

  closeModal(): void {
    this.modal.close('closed');
  }

  isFormValid(): boolean {
    return !!this.file && !!this.sheetName && this.previewData.length > 0;
  }

  onFileChange(evt: Event): void {
    this.resetPreview();
    const target = evt.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length !== 1) return;

    this.file = files[0];
    this.fileName = files[0].name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        this.workbook = XLSX.read(bstr, { type: 'binary' });
        this.availableSheets = this.workbook.SheetNames || [];

        if (!this.availableSheets.length) {
          this.noti.warning('Thông báo', 'File không có sheet nào!');
          this.resetPreview();
          return;
        }

        this.sheetName = this.availableSheets[0];
        this.onSheetChange();
        this.cdr.detectChanges();
      } catch (e) {
        this.noti.error('Lỗi', 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
        this.resetPreview();
      }
    };

    reader.onerror = () => {
      this.noti.error('Lỗi', 'Không thể đọc file. Vui lòng thử lại.');
      this.resetPreview();
    };

    reader.readAsBinaryString(this.file);
    // Clear input value so selecting the same file again triggers change event
    target.value = '';
  }

  private resetPreview(): void {
    this.previewData = [];
    this.headerTitles = [];
    this.availableSheets = [];
    this.sheetName = '';
    this.workbook = undefined;
    if (this.table) {
      this.table.destroy();
      this.table = undefined;
    }
    this.cdr.detectChanges();
  }

  onSheetChange(sheetName?: string): void {
    if (sheetName) this.sheetName = sheetName;
    if (!this.workbook || !this.sheetName) return;

    const ws = this.workbook.Sheets[this.sheetName];
    if (!ws || !ws['!ref']) {
      this.resetPreview();
      this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
      return;
    }

    const rawArray = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '', raw: false });
    if (!rawArray || rawArray.length === 0) {
      this.resetPreview();
      this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
      return;
    }

    let headerRowIndex = 0;
    for (let i = 0; i < rawArray.length; i++) {
      const row = rawArray[i] || [];
      const nonEmpty = row.filter((c: any) => String(c || '').trim().length > 0);
      if (nonEmpty.length >= 4) {
        headerRowIndex = i;
        break;
      }
    }

    const headerRow = rawArray[headerRowIndex] || [];
    const headers = headerRow.map((h: any) => String(h || '').trim()).filter((h: string) => h.length > 0);

    if (headers.length === 0) {
      this.resetPreview();
      this.noti.warning('Cảnh báo', 'Không tìm thấy header trong sheet');
      return;
    }

    this.headerTitles = headers;
    this.previewData = rawArray.slice(headerRowIndex + 1).map((row: any[]) => {
      const newRow: ExcelPreviewRow = {};
      headers.forEach((header, colIndex) => {
        newRow[header] = row[colIndex] === null || row[colIndex] === undefined ? '' : row[colIndex];
      });
      return newRow;
    }).filter((row: ExcelPreviewRow) =>
      Object.keys(row).some(key => row[key] !== '' && row[key] !== null && row[key] !== undefined)
    );

    this.cdr.detectChanges();
    setTimeout(() => this.renderTable(), 50);
  }

  private renderTable(): void {
    setTimeout(() => {
      if (!this.tableElement?.nativeElement) {
        setTimeout(() => this.renderTable(), 200);
        return;
      }

      if (this.table) {
        this.table.destroy();
        this.table = undefined;
      }

      const getColumnWidth = (title: string): number => {
        const t = title.trim().toLowerCase();
        if (t === 'stt') return 60;
        if (t === 'mã nv' || t === 'manv') return 90;
        if (t === 'nhân viên' || t === 'nhanvien' || t === 'tên nv' || t === 'ten nv') return 160;
        if (t === 'mã ncc' || t === 'mancc') return 130;
        if (t === 'tên nhà cung cấp' || t === 'tên ncc' || t === 'ten ncc' || t === 'nhà cung cấp' || t === 'ten nha cung cap') return 250;
        if (t === 'mặt hàng' || t === 'mathang') return 250;
        if (t === 'ghi chú' || t === 'ghichu' || t === 'note') return 200;
        return 150;
      };

      const getColumnAlign = (title: string): 'center' | 'left' => {
        const t = title.trim().toLowerCase();
        if (t === 'stt' || t === 'mã nv' || t === 'manv' || t === 'mã ncc' || t === 'mancc') return 'center';
        return 'left';
      };

      const getColumnFormatter = (title: string): string | undefined => {
        const t = title.trim().toLowerCase();
        if (t === 'stt' || t === 'mã nv' || t === 'manv') return undefined;
        return 'textarea';
      };

      const columns = this.headerTitles.map(col => ({
        title: col,
        field: col,
        width: getColumnWidth(col),
        hozAlign: getColumnAlign(col) as any,
        formatter: getColumnFormatter(col) as any
      }));

      this.table = new Tabulator(this.tableElement.nativeElement, {
        data: this.previewData,
        ...DEFAULT_TABLE_CONFIG,
        columns: columns,
        layout: 'fitDataStretch',
        reactiveData: true,
        height: '400px',
        selectableRows: 1,
        pagination: true,
        paginationMode: 'local',
        paginationSize: 20,
        paginationSizeSelector: [20, 50, 100, 200, 500],

      });
      this.cdr.detectChanges();
    }, 100);
  }

  startFakeProgress(): void {
    this.progressPercent = 0;
    this.progressInterval = setInterval(() => {
      if (this.progressPercent < 90) {
        this.progressPercent += Math.floor(Math.random() * 10) + 1;
        if (this.progressPercent > 90) this.progressPercent = 90;
        this.progressText = `Đang xử lý... ${this.progressPercent}%`;
        this.cdr.detectChanges();
      }
    }, 300);
  }

  stopFakeProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  async save(): Promise<void> {
    if (!this.isFormValid()) return;

    this.saving = true;
    this.startFakeProgress();
    this.cdr.detectChanges();

    // The export produces columns: STT, Mã NV, Nhân viên, Mã NCC, Tên nhà cung cấp, Mặt hàng, Ghi chú
    // We pass rows exactly as read
    const payload = {
      Rows: this.previewData
    };

    try {
      const res = await this.svc.importExcelWithPayload(payload).toPromise();
      this.stopFakeProgress();
      this.progressPercent = 100;
      this.progressText = 'Hoàn thành';
      this.cdr.detectChanges();

      let data: any = res?.data || res?.Data || res;
      const created = data?.Created ?? data?.created ?? 0;
      const updated = data?.Updated ?? data?.updated ?? 0;
      const skipped = data?.Skipped ?? data?.skipped ?? (data?.Errors?.length ?? 0);
      const errors = data?.Errors ?? data?.errors ?? [];

      const totalSuccess = created + updated;
      const totalRows = this.previewData.length;

      if (errors && errors.length > 0) {
        const errorHtml = `
          <div style="max-height: 250px; overflow-y: auto; padding: 10px; background: #fff1f0; border: 1px solid #ffa39e; border-radius: 4px; margin-top: 8px;">
            <ul style="margin: 0; padding-left: 20px; color: #cf1322; font-family: Consolas, monospace; font-size: 12px; text-align: left;">
              ${errors.map((err: string) => `<li style="margin-bottom: 6px;">${err}</li>`).join('')}
            </ul>
          </div>
        `;

        this.modalSvc.warning({
          nzTitle: 'Hoàn tất nhập dữ liệu (có dòng bị bỏ qua)',
          nzContent: `
            <div style="font-size: 12px; font-family: inherit;">
              <p style="margin-bottom: 8px;">Đã lưu thành công <strong style="color: #52c41a;">${totalSuccess}/${totalRows}</strong> bản ghi (Tạo mới: ${created} • Cập nhật: ${updated}).</p>
              <p style="margin-bottom: 8px; color: #fa8c16;">Số dòng bị bỏ qua do dữ liệu không hợp lệ: <strong>${skipped}</strong> dòng.</p>
              ${errorHtml}
            </div>
          `,
          nzOkText: 'Đóng',
          nzOnOk: () => {
            this.modal.close('success');
          },
          nzWidth: 600
        });
      } else {
        if (totalSuccess === 0) {
          this.noti.warning(NOTIFICATION_TITLE.warning, `Không có bản ghi nào được lưu (0/${totalRows}). Vui lòng kiểm tra lại dữ liệu.`);
        } else {
          this.noti.success(NOTIFICATION_TITLE.success, `Lưu thành công ${totalSuccess}/${totalRows} bản ghi. Tạo mới: ${created} • Cập nhật: ${updated}`);
        }
        this.modal.close('success');
      }
    } catch (err: any) {
      this.stopFakeProgress();
      this.saving = false;
      this.cdr.detectChanges();
      this.noti.error('Lỗi', err?.error?.message || err?.message || 'Có lỗi xảy ra khi nhập Excel');
    }
  }

  downloadTemplate(): void {
    const fileName = 'FileMau_DSNVMuaTheoNCC.xlsx';
    this.svc.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.noti.success('Thành công', 'Tải file mẫu thành công');
      },
      error: (err: any) => {
        this.noti.error('Lỗi', err?.message || 'Không thể tải xuống file mẫu');
      }
    });
  }
}
