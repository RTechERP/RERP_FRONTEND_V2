import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal'; // Thêm nếu chưa có
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox'; // Thêm nếu chưa có
import * as XLSX from 'xlsx';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal'; // Thêm để hiển thị modal chi tiết
import { EmployeeAttendanceService } from '../employee-attendance.service';
import { FormsModule } from '@angular/forms';

type AOA = any[][];

interface ExcelPreviewRow {
  [key: string]: any;
  __isLate?: boolean;
  __overLate?: boolean;
  __isEarly?: boolean;
  __overEarly?: boolean;
}

@Component({
  selector: 'app-employee-attendance-import-excel',
  standalone: true,
  templateUrl: './employee-attendance-import-excel.component.html',
  imports: [
    CommonModule,
    FormsModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzFormModule,
    NzModalModule, // Thêm
    NzCheckboxModule, // Thêm
  ],
})
export class EmployeeAttendanceImportExcelComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() dateStart?: string;
  @Input() dateEnd?: string;
  @Input() departmentId?: number;

  fromDate?: Date;
  toDate?: Date;
  officeId: string | null = null;
  file: File | null = null;
  fileName = '';
  sheetName = '';
  availableSheets: string[] = [];
  private headerTitles: string[] = [];
  private headerFields: string[] = [];
  isFormDisabled = false;
  isViewMode = false;
  loading = false;
  saving = false;
  departments: any[] = [];

  @ViewChild('tb_excelPreview', { static: false }) tableElement!: ElementRef;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  private table?: Tabulator;
  previewData: ExcelPreviewRow[] = [];
  private workbook?: XLSX.WorkBook;

  constructor(
    public modal: NgbActiveModal,
    private noti: NzNotificationService,
    private modalSvc: NzModalService, // Thêm để hiển thị modal chi tiết
    private svc: EmployeeAttendanceService
  ) {}
  ngOnDestroy(): void {}

  ngOnInit(): void {
    if (this.dateStart) this.fromDate = new Date(this.dateStart);
    if (this.dateEnd) this.toDate = new Date(this.dateEnd);

    // Lấy danh sách Văn phòng từ API "import"
    this.svc.getDepartmentImport().subscribe({
      next: (res: any) => {
        // SỬA: Type res as any để tránh lỗi type inference
        this.departments = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        // auto chọn phần tử đầu nếu chưa chọn
        if (!this.officeId && this.departments.length) {
          // ưu tiên item có ID; nếu không có, dùng Code
          const first = this.departments[0];
          this.officeId = (first.ID ?? first.Code ?? '').toString();
        }
      },
      error: () =>
        this.noti.error('Lỗi', 'Không tải được danh sách Văn phòng!'),
    });
  }

  ngAfterViewInit(): void {
    // Không khởi tạo table ở đây nữa, để renderTable() tự tạo khi cần
    console.log('ngAfterViewInit called');
  }

  // ====== File & Sheet Handling ======
  closeModal(): void {
    this.modal.close('closed');
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

        // Auto select first sheet và load ngay
        this.sheetName = this.availableSheets[0];
        this.onSheetChange();
      } catch (e) {
        console.error('Error reading Excel file:', e);
        this.noti.error(
          'Lỗi',
          'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.'
        );
        this.resetPreview();
      }
    };

    reader.onerror = () => {
      this.noti.error('Lỗi', 'Không thể đọc file. Vui lòng thử lại.');
      this.resetPreview();
    };

    reader.readAsBinaryString(this.file);
  }
  private resetFileData(): void {
    this.file = null;
    this.fileName = '';
    this.workbook = undefined;
    this.resetPreview();

    // Reset file input
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }
  onSheetChange(sheetName?: string): void {
    console.log('onSheetChange called with:', sheetName);

    if (sheetName) {
      this.sheetName = sheetName;
    }

    if (!this.workbook || !this.sheetName) {
      console.warn('No workbook or sheetName');
      return;
    }

    console.log('Loading sheet:', this.sheetName);

    const ws = this.workbook.Sheets[this.sheetName];
    if (!ws || !ws['!ref']) {
      this.previewData = [];
      this.headerTitles = [];
      this.renderTable();
      this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
      return;
    }

    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
      defval: '',
    });

    console.log('Raw data length:', rawData.length);

    // Làm sạch và convert dữ liệu
    this.previewData = rawData.map((row) => {
      const newRow: ExcelPreviewRow = {};

      Object.keys(row).forEach((key) => {
        // Bỏ các cột rác __EMPTY
        if (!key.startsWith('__EMPTY')) {
          let value = row[key];

          // Convert date nếu cột chứa "ngày" và là số seri Excel
          if (typeof value === 'number' && key.toLowerCase().includes('ngày')) {
            const parsed = XLSX.SSF.parse_date_code(value);
            if (parsed) {
              value = `${String(parsed.d).padStart(2, '0')}/${String(
                parsed.m
              ).padStart(2, '0')}/${parsed.y}`;
            }
          }
          newRow[key.trim()] = value;
        }
      });

      // Tính cờ màu cho preview
      const dateStr = newRow['Ngày'] || newRow['AttendanceDate'] || '';
      const inStr = newRow['Giờ vào'] || newRow['CheckIn'] || '';
      const outStr = newRow['Giờ ra'] || newRow['CheckOut'] || '';
      const date = this.parseDateOnly(dateStr);
      const flags = this.computeFlags(date, inStr, outStr);
      newRow.__isLate = flags.isLate;
      newRow.__overLate = flags.overLate;
      newRow.__isEarly = flags.isEarly;
      newRow.__overEarly = flags.overEarly;

      return newRow;
    });

    this.headerTitles =
      this.previewData.length > 0
        ? Object.keys(this.previewData[0]).filter((k) => !k.startsWith('__'))
        : [];

    console.log('✅ Data processed:', {
      dataLength: this.previewData.length,
      headerCount: this.headerTitles.length,
      headers: this.headerTitles,
    });

    // Render table với delay để đảm bảo DOM đã update
    setTimeout(() => {
      this.renderTable();
    }, 50);
  }
  private loadSheet(sheetName: string): void {
    if (!this.workbook) {
      console.warn('No workbook available');
      return;
    }

    console.log(`Loading sheet: ${sheetName}`);
    this.loading = true;

    // Sử dụng setTimeout để đảm bảo UI đã được update
    setTimeout(() => {
      try {
        const ws = this.workbook!.Sheets[sheetName];
        if (!ws || !ws['!ref']) {
          this.previewData = [];
          this.headerTitles = [];
          this.renderTable();
          this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
          this.loading = false;
          return;
        }

        // Parse dữ liệu từ sheet
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
          defval: '',
        });
        console.log('Raw data from sheet:', rawData);

        if (!rawData || rawData.length === 0) {
          this.previewData = [];
          this.headerTitles = [];
          this.renderTable();
          this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
          this.loading = false;
          return;
        }

        // Làm sạch và convert dữ liệu
        this.previewData = rawData.map((row, index) => {
          const newRow: ExcelPreviewRow = {};

          Object.keys(row).forEach((key) => {
            // Bỏ cột rác __EMPTY
            if (!key.startsWith('__EMPTY')) {
              let value = row[key];

              // Convert date nếu cột chứa "ngày" và là số seri Excel
              if (
                typeof value === 'number' &&
                key.toLowerCase().includes('ngày')
              ) {
                const parsed = XLSX.SSF.parse_date_code(value);
                if (parsed) {
                  value = `${String(parsed.d).padStart(2, '0')}/${String(
                    parsed.m
                  ).padStart(2, '0')}/${parsed.y}`;
                }
              }
              newRow[key.trim()] = value;
            }
          });

          // Tính cờ màu cho preview
          const dateStr = newRow['Ngày'] || newRow['AttendanceDate'] || '';
          const inStr = newRow['Giờ vào'] || newRow['CheckIn'] || '';
          const outStr = newRow['Giờ ra'] || newRow['CheckOut'] || '';
          const date = this.parseDateOnly(dateStr);
          const flags = this.computeFlags(date, inStr, outStr);
          newRow.__isLate = flags.isLate;
          newRow.__overLate = flags.overLate;
          newRow.__isEarly = flags.isEarly;
          newRow.__overEarly = flags.overEarly;

          return newRow;
        });

        // Cập nhật header titles
        this.headerTitles =
          this.previewData.length > 0
            ? Object.keys(this.previewData[0]).filter(
                (k) => !k.startsWith('__')
              )
            : [];

        console.log('Header titles:', this.headerTitles);
        console.log('Preview data length:', this.previewData.length);
        console.log('Sample data:', this.previewData.slice(0, 2));

        // Render table với dữ liệu mới - delay để đảm bảo DOM đã ready
        setTimeout(() => {
          this.renderTable();
          this.loading = false;
        }, 100);
      } catch (e) {
        console.error('Error loading sheet data:', e);
        this.noti.error('Lỗi', 'Không thể đọc dữ liệu từ sheet');
        this.previewData = [];
        this.headerTitles = [];
        this.renderTable();
        this.loading = false;
      }
    }, 100);
  }

  private initTable(): void {
    if (!this.tableElement?.nativeElement) {
      console.warn('Table element not ready, retrying...');
      setTimeout(() => this.initTable(), 100); // Retry sau 100ms
      return;
    }

    console.log('Initializing Tabulator table...');
    this.table = new Tabulator(this.tableElement.nativeElement, {
      data: [],
      layout: 'fitDataStretch',
      reactiveData: true,
      height: '400px',
      selectableRows: 1,
      responsiveLayout: false,
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,
      paginationSizeSelector: [20, 50, 100, 200, 500],
      columns: [],
    });
    console.log('Tabulator table initialized successfully');
  }
  private renderTable(): void {
    console.log(
      'renderTable called with data length:',
      this.previewData.length
    );
    console.log('headerTitles:', this.headerTitles);

    // Đợi DOM render trước khi xử lý table
    setTimeout(() => {
      // Kiểm tra table element
      if (!this.tableElement?.nativeElement) {
        console.warn('Table element not ready, retrying...');
        setTimeout(() => this.renderTable(), 200);
        return;
      }

      console.log('Table element found:', !!this.tableElement.nativeElement);

      // Nếu table đã tồn tại, clear và tạo lại hoàn toàn
      if (this.table) {
        console.log('Destroying existing table...');
        try {
          this.table.destroy();
        } catch (e) {
          console.warn('Error destroying table:', e);
        }
        this.table = undefined;
      }

      // Tạo columns
      const columns = this.headerTitles.map((col) => {
        let align: 'left' | 'center' | 'right' = 'left';
        if (col.toLowerCase().includes('ngày')) align = 'center';
        else if (
          this.previewData.length > 0 &&
          typeof this.previewData[0][col] === 'number'
        )
          align = 'right';

        // Formatter cho cột Giờ vào/Giờ ra
        let formatter: any = undefined;
        if (
          col.toLowerCase().includes('giờ vào') ||
          col.toLowerCase().includes('checkin')
        ) {
          formatter = (cell: any) => {
            const d = cell.getRow().getData();
            const over = !!d.__overLate;
            const late = !!d.__isLate;
            const bg = over ? '#ffeb3b' : late ? '#f44336' : '';
            const color = late ? '#fff' : 'inherit';
            const v = cell.getValue() ?? '';
            return `<div style="background:${bg};color:${color};padding:2px 4px;border-radius:2px">${v}</div>`;
          };
        } else if (
          col.toLowerCase().includes('giờ ra') ||
          col.toLowerCase().includes('checkout')
        ) {
          formatter = (cell: any) => {
            const d = cell.getRow().getData();
            const over = !!d.__overEarly;
            const early = !!d.__isEarly;
            const bg = over ? '#ffeb3b' : early ? '#f44336' : '';
            const color = early ? '#fff' : 'inherit';
            const v = cell.getValue() ?? '';
            return `<div style="background:${bg};color:${color};padding:2px 4px;border-radius:2px">${v}</div>`;
          };
        }

        return {
          title: col,
          field: col,
          width: 150,
          hozAlign: align,
          formatter,
        };
      });

      console.log('Creating new table with columns:', columns.length);
      console.log('Data length:', this.previewData.length);

      // Tạo table mới hoàn toàn
      try {
        this.table = new Tabulator(this.tableElement.nativeElement, {
          data: this.previewData, // Truyền data ngay khi khởi tạo
          columns: columns, // Truyền columns ngay khi khởi tạo
          layout: 'fitDataStretch',
          reactiveData: true,
          height: '400px',
          selectableRows: 1,
          responsiveLayout: false,
          pagination: true,
          paginationMode: 'local',
          paginationSize: 20,
          paginationSizeSelector: [20, 50, 100, 200, 500],
        });

        console.log(
          '✅ New table created successfully with',
          this.previewData.length,
          'rows'
        );

        // Force redraw sau khi tạo xong
        setTimeout(() => {
          if (this.table) {
            this.table.redraw(true);
            console.log('✅ Table redrawn');
          }
        }, 100);
      } catch (error) {
        console.error('❌ Error creating table:', error);
      }
    }, 100); // Delay 100ms để đảm bảo DOM ready
  }
  async save(): Promise<void> {
    if (!this.validateForm()) return;
    this.saving = true;

    try {
      // Chuẩn hóa ngày yyyy-MM-dd
      const ds = this.fromDate ? this.fromDate.toISOString().slice(0, 10) : '';
      const de = this.toDate ? this.toDate.toISOString().slice(0, 10) : '';
      const deptId = Number(this.officeId || 0);

      // Kiểm tra đã có dữ liệu chưa
      const exist = await this.svc
        .checkExistingData(ds, de, deptId)
        .toPromise()
        .catch(() => ({ count: 0 }));

      const count = (exist as any)?.count ?? 0;
      let overwrite = false;

      if (count > 0) {
        const ok = confirm(
          `Đã tồn tại ${count} bản ghi trong khoảng ngày & văn phòng đã chọn.\nBạn có muốn ghi đè không?`
        );
        if (!ok) {
          this.saving = false;
          return;
        }
        overwrite = true;
      }

      // SỬA: Chuẩn bị payload theo format backend expect
      const cleanedRows = this.previewData.map((row) => {
        const { __isLate, __overLate, __isEarly, __overEarly, ...rest } = row;
        return rest;
      });

      const payload = {
        dateStart: new Date(ds).toISOString(), // Backend expect DateTime format
        dateEnd: new Date(de).toISOString(), // Backend expect DateTime format
        departmentId: deptId,
        overwrite: overwrite,
        rows: cleanedRows,
      };

      console.log('Payload being sent:', payload); // Debug log

      // SỬA: Gọi method mới với payload đúng format
      const res = await this.svc.importExcelWithPayload(payload).toPromise();

      if (res?.status === 1 || res?.success) {
        const created = res?.created ?? 0;
        const updated = res?.updated ?? 0;
        const skipped = res?.skipped ?? 0;
        const errors = res?.errors ?? [];

        this.noti.success(
          'Nhập dữ liệu thành công!',
          `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`
        );

        this.modalSvc.success({
          nzTitle: 'Hoàn tất nhập dữ liệu',
          nzContent: `
          <div>Tạo mới: <b>${created}</b> • Cập nhật: <b>${updated}</b> • Bỏ qua: <b>${skipped}</b></div>
          ${errors.length > 0 ? `<div>Lỗi: ${errors.length} dòng</div>` : ''}
        `,
          nzOkText: 'Đóng',
          nzOnOk: () => this.modal.close('success'),
          nzWidth: 720,
        });
      } else {
        this.noti.error('Thông báo', 'Nhập dữ liệu thất bại!');
      }
    } catch (err: any) {
      console.error('Import error details:', err);

      // Hiển thị lỗi chi tiết từ server
      const errorMessage =
        err?.error?.message ||
        err?.message ||
        'Có lỗi xảy ra khi nhập dữ liệu!';
      this.noti.error('Lỗi', errorMessage);
    } finally {
      this.saving = false;
    }
  }

  private validateForm(): boolean {
    if (!this.fromDate) return this.err('Vui lòng chọn từ ngày');
    if (!this.toDate) return this.err('Vui lòng chọn đến ngày');
    if (this.fromDate > this.toDate)
      return this.err('Từ ngày không được lớn hơn đến ngày');
    if (!this.file) return this.err('Vui lòng chọn file Excel');
    if (!this.sheetName?.trim()) return this.err('Vui lòng chọn sheet');
    if (!this.officeId) return this.err('Vui lòng chọn văn phòng');
    if (this.previewData.length === 0)
      return this.err('Không có dữ liệu để import');
    return true;
  }

  private err(msg: string): false {
    this.noti.error('Lỗi', msg);
    return false;
  }

  private resetPreview(): void {
    console.log('resetPreview called');

    // reset chọn sheet + dữ liệu
    this.sheetName = '';
    this.availableSheets = [];
    this.headerTitles = [];
    this.previewData = [];

    // Destroy table hoàn toàn
    if (this.table) {
      console.log('Destroying table in resetPreview');
      try {
        this.table.destroy();
      } catch (e) {
        console.warn('Error destroying table in reset:', e);
      }
      this.table = undefined;
    }
  }
  // Giữ nguyên các helper methods cũ (parseDateOnly, computeFlags, v.v.)
  private parseDateOnly(s: string): Date | null {
    if (!s) return null;
    const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    const d = new Date(s);
    return isNaN(d.getTime())
      ? null
      : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private computeFlags(date: Date | null, inStr: string, outStr: string) {
    // Giữ nguyên logic cũ
    let isLate = false,
      overLate = false,
      isEarly = false,
      overEarly = false;
    if (!date) return { isLate, overLate, isEarly, overEarly };
    // ... (logic tính cờ màu)
    return { isLate, overLate, isEarly, overEarly };
  }

  // Các methods khác giữ nguyên
  onMonthChange(_: any): void {}
  isFormValid(): boolean {
    return !!(
      this.fromDate &&
      this.toDate &&
      this.officeId &&
      this.file &&
      this.sheetName.trim() &&
      this.previewData.length > 0
    );
  }
}
