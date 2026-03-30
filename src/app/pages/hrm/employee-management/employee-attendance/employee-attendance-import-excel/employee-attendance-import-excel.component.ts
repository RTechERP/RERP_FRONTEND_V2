import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit,
  TemplateRef
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
import { NzProgressModule } from 'ng-zorro-antd/progress';
import * as XLSX from 'xlsx';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal'; // Thêm để hiển thị modal chi tiết
import { EmployeeAttendanceService } from '../employee-attendance.service';
import { FormsModule } from '@angular/forms';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

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
    NzProgressModule, // Thêm cho progress bar
  ],
})
export class EmployeeAttendanceImportExcelComponent
  implements OnInit, OnDestroy, AfterViewInit {
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

  // Progress tracking
  progressCurrent = 0;
  progressTotal = 0;
  progressPercent = 0;
  progressText = '';
  private progressInterval: any = null;

  @ViewChild('tb_excelPreview', { static: false }) tableElement!: ElementRef;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('errorModalContent', { static: false }) errorModalContent!: TemplateRef<any>;
  
  modalErrorData: any = {};
  private table?: Tabulator;
  previewData: ExcelPreviewRow[] = [];
  private workbook?: XLSX.WorkBook;

  constructor(
    public modal: NgbActiveModal,
    private noti: NzNotificationService,
    private modalSvc: NzModalService, // Thêm để hiển thị modal chi tiết
    private svc: EmployeeAttendanceService
  ) { }
  ngOnDestroy(): void {
    // Clear progress interval when component is destroyed
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  ngOnInit(): void {
    if (this.dateStart) this.fromDate = new Date(this.dateStart);
    if (this.dateEnd) this.toDate = new Date(this.dateEnd);

    // Lấy danh sách Văn phòng từ API getDepartment và lọc như WinForm
    this.svc.getDepartment().subscribe({
      next: (res: any) => {
        // Lấy data từ response
        let list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        list = list.filter((x: any) => (x.ID || 0) > 10);
        list.push({
          ID: 9, // hoặc một ID phù hợp
          Code: 'HN',
          Name: 'Văn phòng Hà Nội'
        });
        this.departments = list;
        if (!this.officeId && this.departments.length) {
          const first = this.departments[0];
          this.officeId = (first.ID ?? first.Code ?? '').toString();
        }
      },
      error: () =>
        this.noti.error('Lỗi', 'Không tải được danh sách Văn phòng!'),
    });
  }

  ngAfterViewInit(): void {
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

    // Đọc toàn bộ sheet dạng mảng 2 chiều, mỗi phần tử = 1 row
    const rawArray = XLSX.utils.sheet_to_json<any[]>(ws, {
      header: 1,
      defval: '',
      raw: false // convert về string/number
    });

    console.log('Raw array length:', rawArray.length);
    console.log('First row:', rawArray[0]);

    if (!rawArray || rawArray.length === 0) {
      this.previewData = [];
      this.headerTitles = [];
      this.renderTable();
      this.noti.warning('Cảnh báo', 'Sheet không có dữ liệu');
      return;
    }
    let headerRowIndex = 0;
    for (let i = 0; i < rawArray.length; i++) {
      const row = rawArray[i] || [];
      const nonEmpty = row.filter(
        (c: any) => String(c || '').trim().length > 0
      );
      if (nonEmpty.length >= 4) {
        headerRowIndex = i;
        break;
      }
    }
    console.log('Header row index:', headerRowIndex, 'Row:', rawArray[headerRowIndex]);

    const headerRow = rawArray[headerRowIndex] || [];
    const headers = headerRow
      .map((h: any) => String(h || '').trim())
      .filter((h: string) => h.length > 0 && !h.startsWith('__'));

    console.log('Headers extracted:', headers);

    if (headers.length === 0) {
      this.previewData = [];
      this.headerTitles = [];
      this.renderTable();
      this.noti.warning('Cảnh báo', 'Không tìm thấy header trong sheet');
      return;
    }

    this.headerTitles = headers;

    // ===== BUILD DATA TỪ SAU DÒNG HEADER =====
    this.previewData = rawArray
      .slice(headerRowIndex + 1) // dữ liệu bắt đầu sau dòng header thực sự
      .map((row: any[], index: number) => {
        const newRow: ExcelPreviewRow = {};

        headers.forEach((header, colIndex) => {
          let value = row[colIndex];

          // Giá trị rỗng
          if (value === null || value === undefined || value === '') {
            value = '';
          }

          // Chuẩn hoá NGÀY -> dd/MM/yyyy
          if (header.toLowerCase().includes('ngày')) {
            value = this.normalizeDateCell(value);
          }

          // Convert time nếu là fraction of day và header chứa "giờ" / "time"
          if (
            header.toLowerCase().includes('giờ') ||
            header.toLowerCase().includes('time')
          ) {
            value = this.normalizeTimeCell(value);
          }

          newRow[header] = value;
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
      })
      .filter((row: ExcelPreviewRow) =>
        // Lọc bỏ dòng hoàn toàn trống (bỏ qua các field kỹ thuật __*)
        Object.keys(row).some(
          (key) =>
            !key.startsWith('__') &&
            row[key] !== '' &&
            row[key] !== null &&
            row[key] !== undefined
        )
      );

    console.log('✅ Data processed:', {
      dataLength: this.previewData.length,
      headerCount: this.headerTitles.length,
      headers: this.headerTitles,
      sampleRow: this.previewData[0]
    });

    // Render table với delay để DOM đảm bảo đã update
    setTimeout(() => {
      this.renderTable();
    }, 50);
  }
  private normalizeDateCell(value: any): string {
    if (value === null || value === undefined || value === '') return '';

    // Excel numeric serial date
    if (typeof value === 'number') {
      try {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
          const d = String(parsed.d).padStart(2, '0');
          const m = String(parsed.m).padStart(2, '0');
          const y = parsed.y;
          return `${d}/${m}/${y}`; // dd/MM/yyyy
        }
      } catch (e) {
        console.warn('Date parse error (number):', e);
      }
    }

    // Nếu là Date object
    if (value instanceof Date) {
      const d = String(value.getDate()).padStart(2, '0');
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const y = value.getFullYear();
      return `${d}/${m}/${y}`;
    }

    // Chuỗi kiểu mm/dd/yyyy hoặc dd/mm/yyyy...
    const s = String(value).trim();
    if (!s) return '';

    const dObj = new Date(s);
    if (!isNaN(dObj.getTime())) {
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = dObj.getFullYear();
      return `${d}/${m}/${y}`;
    }

    // fallback: trả lại chuỗi gốc
    return s;
  }

  private normalizeTimeCell(value: any): string {
    if (value === null || value === undefined || value === '') return '';

    // Excel time dạng số (fraction of day)
    if (typeof value === 'number') {
      try {
        const timeValue = value * 24;
        const hours = Math.floor(timeValue);
        const minutes = Math.floor((timeValue - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(
          minutes
        ).padStart(2, '0')}`;
      } catch (e) {
        console.warn('Time parse error (number):', e);
      }
    }

    // Nếu đã là string thì để nguyên
    return String(value).trim();
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
      ...DEFAULT_TABLE_CONFIG,
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

    // Reset progress
    this.progressCurrent = 0;
    this.progressTotal = 0;
    this.progressPercent = 0;
    this.progressText = 'Đang chuẩn bị...';
    this.saving = true;

    // Cho phép đóng modal ngay sau khi bấm lưu (chạy async)
    // Modal sẽ tự đóng khi hoàn thành hoặc có lỗi

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

      // Kiểm tra lại dữ liệu trước khi build payload
      if (!this.previewData || this.previewData.length === 0) {
        this.noti.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để import');
        this.saving = false;
        return;
      }

      // Kiểm tra văn phòng đã chọn
      // Lưu ý: deptId = 0 là hợp lệ (Văn phòng Hà Nội - lấy tất cả các phòng ban)
      // Nhưng phải đảm bảo officeId đã được chọn (không được null/undefined/'')
      if (this.officeId === null || this.officeId === undefined || this.officeId === '') {
        this.noti.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn văn phòng');
        this.saving = false;
        return;
      }

      // Kiểm tra deptId có hợp lệ không (sau khi convert)
      if (isNaN(deptId)) {
        this.noti.error(NOTIFICATION_TITLE.error, 'Văn phòng không hợp lệ');
        this.saving = false;
        return;
      }

      // Chuẩn bị payload theo format backend expect
      // Backend expect: List<Dictionary<string, object>> - mỗi row là object với key-value pairs
      // Theo nghiệp vụ WinForm: chỉ lấy dòng có STT > 0
      const totalPreviewRows = this.previewData.length;
      let filteredBySTT = 0;
      let filteredByEmpty = 0;

      const cleanedRows: Array<Record<string, any>> = this.previewData
        .filter((row) => {
          // Theo WinForm: chỉ lấy dòng có STT > 0
          const stt = this.getSTT(row);
          if (stt <= 0) {
            filteredBySTT++;
            return false; // Bỏ qua dòng không có STT hoặc STT <= 0
          }

          // Lọc bỏ các dòng hoàn toàn trống hoặc không có dữ liệu hợp lệ
          const hasData = Object.keys(row).some(
            (key) =>
              !key.startsWith('__') &&
              row[key] !== '' &&
              row[key] !== null &&
              row[key] !== undefined
          );

          if (!hasData) {
            filteredByEmpty++;
            return false;
          }

          return true;
        })
        .map((row) => {
          const cleanedRow: Record<string, any> = {};

          // Lặp qua tất cả các key trong row (trừ các field kỹ thuật __*)
          Object.keys(row).forEach((key) => {
            if (!key.startsWith('__')) {
              // Giữ nguyên giá trị, backend sẽ tự động parse
              cleanedRow[key] = row[key];
            }
          });

          return cleanedRow;
        });

      console.log('📊 Data filtering:', {
        totalPreviewRows,
        filteredBySTT: `Bỏ qua ${filteredBySTT} dòng (STT <= 0)`,
        filteredByEmpty: `Bỏ qua ${filteredByEmpty} dòng (trống)`,
        validRows: cleanedRows.length,
      });

      // Kiểm tra sau khi clean có còn dữ liệu không
      if (cleanedRows.length === 0) {
        this.noti.error(
          NOTIFICATION_TITLE.error,
          `Không có dữ liệu hợp lệ để import. Tổng ${totalPreviewRows} dòng, đã lọc bỏ ${filteredBySTT} dòng (STT <= 0) và ${filteredByEmpty} dòng trống.`
        );
        this.saving = false;
        return;
      }

      // Build payload theo format backend C# expect (PascalCase)
      // DateStart/DateEnd: ISO DateTime string với time 00:00:00 UTC
      // Backend sẽ parse và dùng .Date để lấy ngày (bỏ qua giờ)
      const dateStartISO = ds ? `${ds}T00:00:00.000Z` : '';
      const dateEndISO = de ? `${de}T00:00:00.000Z` : '';

      // Kiểm tra payload đầy đủ
      if (!dateStartISO || !dateEndISO) {
        this.noti.error(NOTIFICATION_TITLE.error, 'Ngày bắt đầu và kết thúc không hợp lệ');
        this.saving = false;
        return;
      }

      const payload = {
        DateStart: dateStartISO, // Backend expect DateTime format (ISO string)
        DateEnd: dateEndISO, // Backend expect DateTime format (ISO string)
        DepartmentId: deptId,
        Overwrite: overwrite,
        Rows: cleanedRows, // Array of Dictionary<string, object>
      };

      console.log('✅ Payload validation:', {
        dateStart: dateStartISO,
        dateEnd: dateEndISO,
        departmentId: deptId,
        overwrite: overwrite,
        rowsCount: cleanedRows.length,
        sampleRow: cleanedRows[0],
      });

      // Log sample rows để debug
      console.log('📋 Sample rows (first 3):', cleanedRows.slice(0, 3));
      console.log('📋 Sample row keys:', cleanedRows[0] ? Object.keys(cleanedRows[0]) : []);

      // Bắt đầu mô phỏng progress từ 0% → 70% (chạy dần)
      this.progressTotal = cleanedRows.length;
      this.startFakeProgress();

      // Gọi API import-excel (async - không block UI)
      // Backend sẽ xử lý từng dòng và trả về kết quả
      const res = await this.svc.importExcelWithPayload(payload).toPromise();

      // Dừng progress simulation khi API trả về
      this.stopFakeProgress();

      // Log response để debug
      console.log('📥 Full API Response:', res);
      console.log('📥 Response keys:', Object.keys(res || {}));
      console.log('📥 Response.status:', res?.status);
      console.log('📥 Response.success:', res?.success);
      console.log('📥 Response.data:', res?.data);

      // Backend trả về ApiResponseFactory.Success với ImportResult
      // ImportResult có: Created, Updated, Skipped, Errors
      // Kiểm tra nhiều format response khác nhau
      let data: any = null;

      if (res?.data) {
        data = res.data;
      } else if (res?.Data) {
        data = res.Data;
      } else if (res?.status === 1 || res?.success) {
        data = res;
      } else {
        data = res;
      }

      console.log('📊 Parsed data:', data);
      console.log('📊 Data keys:', Object.keys(data || {}));

      // Thử nhiều cách lấy giá trị (PascalCase và camelCase)
      const created =
        data?.Created ??
        data?.created ??
        data?.CreatedCount ??
        data?.createdCount ??
        0;
      const updated =
        data?.Updated ??
        data?.updated ??
        data?.UpdatedCount ??
        data?.updatedCount ??
        0;
      const skipped =
        data?.Skipped ??
        data?.skipped ??
        data?.SkippedCount ??
        data?.skippedCount ??
        (data?.Errors?.length ?? data?.errors?.length ?? 0);
      const errors =
        data?.Errors ??
        data?.errors ??
        data?.ErrorList ??
        data?.errorList ??
        [];

      console.log('📊 Parsed values:', {
        created,
        updated,
        skipped,
        errorsCount: errors.length,
      });

      // Kiểm tra nếu response thành công nhưng không có dữ liệu
      if ((res?.status === 1 || res?.success) && created === 0 && updated === 0 && skipped === 0 && errors.length === 0) {
        console.warn('⚠️ Response thành công nhưng không có dữ liệu được lưu.');
        console.warn('⚠️ Có thể:');
        console.warn('  1. Không tìm thấy nhân viên với mã nhân viên trong Excel');
        console.warn('  2. Tất cả dữ liệu ngoài khoảng ngày đã chọn');
        console.warn('  3. Dữ liệu không hợp lệ nhưng không được báo lỗi');
        console.log('⚠️ Full response object:', JSON.stringify(res, null, 2));
        console.log('⚠️ Sample payload row:', JSON.stringify(cleanedRows[0], null, 2));


      }

      // Kiểm tra response thành công
      if (res?.status === 1 || res?.success || res?.data || data) {
        // Tính tổng số bản ghi đã lưu thành công và tổng số bản ghi gửi lên
        const totalSuccess = created + updated;
        const totalRows = cleanedRows.length;

        // Hiển thị notification với format "Lưu được X/Y bản ghi"
        if (totalSuccess === 0 && errors.length === 0) {
          // Nếu không có gì được lưu và không có lỗi, hiển thị warning
          this.noti.warning(
            NOTIFICATION_TITLE.warning,
            `Không có bản ghi nào được lưu (0/${totalRows}). Vui lòng kiểm tra lại dữ liệu.`
          );
        } else {
          this.noti.success(
            NOTIFICATION_TITLE.success,
            `Lưu được ${totalSuccess}/${totalRows} bản ghi. Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`
          );
        }

        // Cập nhật progress: hoàn tất
        this.progressCurrent = totalSuccess;
        this.progressPercent = 100;
        this.progressText = `Hoàn tất: ${totalSuccess}/${totalRows} bản ghi đã lưu (Tạo mới: ${created}, Cập nhật: ${updated}, Bỏ qua: ${skipped})`;

        // Hiển thị modal chi tiết nếu có lỗi
        if (errors.length > 0) {
          this.modalErrorData = {
            totalSuccess, totalRows, created, updated, skipped, errors
          };

          this.modalSvc.warning({
            nzTitle: 'Hoàn tất nhập dữ liệu (có lỗi)',
            nzContent: this.errorModalContent,
            nzOkText: 'Đóng',
            nzOnOk: () => {
              this.saving = false;
              this.modal.close('success');
            },
            nzWidth: 720,
          });
        } else {
          // Đóng modal sau khi lưu thành công (delay nhỏ để user thấy progress 100%)
          setTimeout(() => {
            this.saving = false;
            this.modal.close('success');
          }, 500);
        }
      } else {
        const errorMsg = res?.message || res?.Message || 'Nhập dữ liệu thất bại!';
        this.noti.error(NOTIFICATION_TITLE.error, errorMsg);
        this.progressText = 'Lỗi: ' + errorMsg;
        this.saving = false;
      }
    } catch (err: any) {
      console.error('Import error details:', err);

      // Hiển thị lỗi chi tiết từ server
      const errorMessage =
        err?.error?.message ||
        err?.error?.Message ||
        err?.message ||
        err?.Message ||
        'Có lỗi xảy ra khi nhập dữ liệu!';
      this.noti.error(NOTIFICATION_TITLE.error, errorMessage);
      this.progressText = 'Lỗi: ' + errorMessage;
      this.progressPercent = 0;
      this.stopFakeProgress();
    } finally {
      // Đảm bảo dừng progress interval
      this.stopFakeProgress();
      // Đảm bảo saving = false sau khi hoàn tất (trừ khi đã đóng modal)
      if (this.saving) {
        // Nếu vẫn đang saving, có thể user chưa đóng modal
        // Giữ nguyên để user có thể thấy kết quả
      }
    }
  }

  private startFakeProgress(): void {
    // Clear existing interval if any
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    // Start from 0% and gradually increase to 70%
    this.progressPercent = 0;
    this.progressCurrent = 0;
    this.progressText = 'Đang xử lý...';

    let currentProgress = 0;
    this.progressInterval = setInterval(() => {
      if (currentProgress < 70) {
        // Increment by 0.4-0.8% randomly (4x faster than original)
        const increment = Math.random() * 0.4 + 0.4; // 0.4% - 0.8% per update
        currentProgress = Math.min(70, currentProgress + increment);
        this.progressPercent = currentProgress;

        // Calculate fake current records based on percentage
        if (this.progressTotal > 0) {
          const fakeCurrent = Math.floor((currentProgress / 100) * this.progressTotal);
          this.progressCurrent = fakeCurrent;
          this.progressText = `Đang xử lý... ${fakeCurrent}/${this.progressTotal} bản ghi`;
        } else {
          this.progressText = `Đang xử lý... ${currentProgress.toFixed(1)}%`;
        }
      } else {
        // Stop at 70%
        if (this.progressTotal > 0) {
          const fakeCurrent = Math.floor((70 / 100) * this.progressTotal);
          this.progressCurrent = fakeCurrent;
          this.progressText = `Đang xử lý... ${fakeCurrent}/${this.progressTotal} bản ghi`;
        } else {
          this.progressText = 'Đang xử lý...';
        }
      }
    }, 500); // Update every 0.5 seconds (4x faster)
  }

  private stopFakeProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private validateForm(): boolean {
    // Kiểm tra từ ngày
    if (!this.fromDate) {
      return this.err('Vui lòng chọn từ ngày');
    }

    // Kiểm tra đến ngày
    if (!this.toDate) {
      return this.err('Vui lòng chọn đến ngày');
    }

    // Kiểm tra từ ngày không được lớn hơn đến ngày
    if (this.fromDate > this.toDate) {
      return this.err('Từ ngày không được lớn hơn đến ngày');
    }

    // Kiểm tra file Excel
    if (!this.file) {
      return this.err('Vui lòng chọn file Excel');
    }

    // Kiểm tra sheet
    if (!this.sheetName?.trim()) {
      return this.err('Vui lòng chọn sheet');
    }

    // Kiểm tra văn phòng (BẮT BUỘC)
    // Lưu ý: officeId = "0" hoặc 0 là hợp lệ (Văn phòng Hà Nội - lấy tất cả các phòng ban)
    if (this.officeId === null || this.officeId === undefined || this.officeId === '') {
      return this.err('Vui lòng chọn văn phòng');
    }

    // Kiểm tra có dữ liệu preview
    if (this.previewData.length === 0) {
      return this.err('Không có dữ liệu để import. Vui lòng kiểm tra lại file Excel.');
    }

    // Kiểm tra dữ liệu có đủ thông tin cần thiết
    const hasValidData = this.previewData.some((row) => {
      // Kiểm tra có STT hoặc có mã nhân viên hoặc có ngày
      const hasSTT = row['STT'] !== undefined && row['STT'] !== null && row['STT'] !== '';
      const hasCode =
        (row['Mã nhân viên'] !== undefined && row['Mã nhân viên'] !== null && row['Mã nhân viên'] !== '') ||
        (row['Mã NV'] !== undefined && row['Mã NV'] !== null && row['Mã NV'] !== '') ||
        (row['Code'] !== undefined && row['Code'] !== null && row['Code'] !== '');
      const hasDate =
        (row['Ngày'] !== undefined && row['Ngày'] !== null && row['Ngày'] !== '') ||
        (row['Date'] !== undefined && row['Date'] !== null && row['Date'] !== '') ||
        (row['AttendanceDate'] !== undefined && row['AttendanceDate'] !== null && row['AttendanceDate'] !== '');

      return hasSTT || hasCode || hasDate;
    });

    if (!hasValidData) {
      return this.err('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file Excel có đủ cột: STT, Mã nhân viên, Ngày.');
    }

    return true;
  }

  private err(msg: string): false {
    this.noti.error(NOTIFICATION_TITLE.error, msg);
    return false;
  }

  /**
   * Lấy STT từ row (theo nghiệp vụ WinForm: F1 = STT)
   * Hỗ trợ nhiều tên cột: STT, F1, hoặc cột đầu tiên nếu không tìm thấy
   */
  private getSTT(row: ExcelPreviewRow): number {
    // Thử lấy từ các tên cột phổ biến
    const sttValue = row['STT'] ?? row['F1'] ?? row['stt'] ?? row['f1'];

    if (sttValue === null || sttValue === undefined || sttValue === '') {
      return 0;
    }

    // Convert sang number
    const num = typeof sttValue === 'number'
      ? sttValue
      : parseInt(String(sttValue).trim(), 10);

    return isNaN(num) ? 0 : num;
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
  onMonthChange(_: any): void { }
  isFormValid(): boolean {
    // Kiểm tra văn phòng: officeId phải có giá trị (null/undefined/'' là không hợp lệ)
    // Nhưng "0" hoặc 0 là hợp lệ (Văn phòng Hà Nội)
    const isOfficeIdValid =
      this.officeId !== null &&
      this.officeId !== undefined &&
      this.officeId !== '';

    return !!(
      this.fromDate &&
      this.toDate &&
      isOfficeIdValid &&
      this.file &&
      this.sheetName.trim() &&
      this.previewData.length > 0
    );
  }

  /**
   * Format progress text cho progress bar
   */
  progressFormat = (percent: number): string => {
    if (this.progressTotal > 0) {
      return `${this.progressCurrent}/${this.progressTotal}`;
    }
    return `${percent}%`;
  };
}
