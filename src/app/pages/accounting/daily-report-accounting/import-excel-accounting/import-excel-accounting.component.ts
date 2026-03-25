import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as XLSX from 'xlsx';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DailyReportAccountingService } from '../daily-report-accounting-service/daily-report-accounting.service';

@Component({
  selector: 'app-import-excel-accounting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
  ],
  templateUrl: './import-excel-accounting.component.html',
  styleUrl: './import-excel-accounting.component.css'
})
export class ImportExcelAccountingComponent implements OnInit {
  sheetNames: string[] = [];
  selectedSheet: string | null = null;
  workbook: XLSX.WorkBook | null = null;

  tableData: any[] = [];
  tableHeaders: string[] = [];

  @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
  tabulator!: Tabulator;

  // Danh sách các cột bắt buộc (phải khớp với header trong Excel)
  requiredColumns: string[] = [
    'Mã nhân viên',
    'Ngày',
    'Nội dung Công việc',
    'Kết quả/ tình trạng công việc',
    'Kế hoạch ngày tiếp theo'
  ];

  // Danh sách các cột ngày tháng (cần chuyển đổi format)
  dateColumns: string[] = [
    'Ngày',
    'Dấu thời gian'
  ];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private dailyReportAccountingService: DailyReportAccountingService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;
    if (!target.files || target.files.length === 0) {
      if (this.selectedSheet && this.sheetNames.length > 0) {
        return;
      }
      return;
    }
    this.resetPreview();
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      this.workbook = XLSX.read(bstr, { type: 'binary' });
      this.sheetNames = this.workbook.SheetNames;
    };
    reader.readAsBinaryString(target.files[0]);
  }

  private resetPreview() {
    this.selectedSheet = null;
    this.sheetNames = [];
    this.tableHeaders = [];
    this.tableData = [];

    if (this.tabulator) {
      this.tabulator.clearData();
      this.tabulator.setColumns([]);
    }
  }

  onSheetChange() {
    if (this.workbook && this.selectedSheet) {
      const ws = this.workbook.Sheets[this.selectedSheet];
      // Không bỏ qua dòng nào, lấy dòng 1 làm header và dữ liệu từ dòng 2
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

      this.tableData = rawData.map(row => {
        const newRow: any = {};

        Object.keys(row).forEach(key => {
          if (!key.startsWith('__EMPTY')) {
            let value = row[key];

            // Convert Excel date serial number to readable format
            const keyLower = key.toLowerCase();
            const isDateColumn = keyLower.includes('ngày') || keyLower.includes('date') || keyLower.includes('thời gian');
            if (typeof value === 'number' && value > 20000 && isDateColumn) {
              const parsed = XLSX.SSF.parse_date_code(value);
              if (parsed) {
                if (value % 1 !== 0) { // Has time component
                  const ampm = parsed.H >= 12 ? 'PM' : 'AM';
                  const h12 = parsed.H % 12 || 12;
                  value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y} ${String(h12).padStart(2, '0')}:${String(parsed.M).padStart(2, '0')}:${String(parsed.S).padStart(2, '0')} ${ampm}`;
                } else {
                  value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`;
                }
              }
            }
            newRow[key.trim()] = value;
          }
        });

        return newRow;
      });

      this.tableHeaders = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
      this.renderTable();
    }
  }

  renderTable() {
    // Cột số thứ tự
    const rowNumberColumn: any = {
      title: 'STT',
      field: 'rowNumber',
      width: 80,
      headerHozAlign: 'center' as const,
      hozAlign: 'center' as const,
      formatter: (cell: any) => {
        const row = cell.getRow();
        return row.getPosition(true);
      },
      frozen: true,
      resizable: false
    };

    // Các cột dữ liệu
    const dataColumns: any[] = this.tableHeaders.map(col => {
      let align: "left" | "center" | "right" = "left";
      if (col.toLowerCase().includes("ngày") || col.toLowerCase().includes("date")) align = "center";
      else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
      return {
        title: col,
        field: col,
        width: 200,
        headerHozAlign: 'center',
        hozAlign: align
      };
    });

    if (this.tabulator) {
      this.tabulator.setColumns([rowNumberColumn, ...dataColumns]);
      this.tabulator.replaceData(this.tableData);
      return;
    }

    this.tabulator = new Tabulator(this.excelTable.nativeElement, {
      data: this.tableData,
      layout: 'fitDataStretch',
      reactiveData: true,
      height: '44vh',
      selectableRows: 1,
      responsiveLayout: false,
      pagination: false,
      paginationMode: 'local',
      columns: [rowNumberColumn, ...dataColumns],
    });
  }

  validateAllColumns(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tableData || this.tableData.length === 0) {
      return { isValid: false, errors: ['Không có dữ liệu để validate'] };
    }

    // Kiểm tra từng dòng
    this.tableData.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const missingColumns: string[] = [];

      // Kiểm tra từng cột bắt buộc
      this.requiredColumns.forEach(columnName => {
        const value = row[columnName];

        if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
          missingColumns.push(columnName);
        }
      });

      if (missingColumns.length > 0) {
        errors.push(`Dòng ${rowNumber}: Thiếu các cột: ${missingColumns.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  importData() {
    if (!this.tableData || this.tableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Validate tất cả các cột bắt buộc
    const validationResult = this.validateAllColumns();
    if (!validationResult.isValid) {
      const errorList = validationResult.errors.map((err, idx) => `${idx + 1}. ${err}`).join('<br>');

      this.modal.warning({
        nzTitle: 'Lỗi',
        nzContent: `
          <div style="max-height: 400px; overflow-y: auto;">
            <p class="mb-2"><strong>Vui lòng nhập đầy đủ tất cả các cột bắt buộc!</strong></p>
            <p class="mb-2">Tổng số lỗi: <strong>${validationResult.errors.length}</strong></p>
            <div style="text-align: left;">
              ${errorList}
            </div>
          </div>
        `,
        nzOkText: 'Đóng',
        nzWidth: 600
      });

      return;
    }

    // Map dữ liệu và chuyển đổi ngày tháng
    const mappedData = this.tableData.map(row => {
      const newRow: any = {};

      Object.keys(row).forEach(key => {
        let value = row[key];

        // Chuyển đổi ngày từ dd/MM/yyyy sang ISO 8601 cho API
        const isDateCol = this.dateColumns.includes(key) || key.toLowerCase().includes('thời gian');
        if (isDateCol) {
          if (value && typeof value === 'string' && value.trim() !== '') {
            // Giá trị formated: "04/03/2026", "04/03/2026 05:53:05 PM"
            const parts = value.split(' ');
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
              const day = dateParts[0].padStart(2, '0');
              const month = dateParts[1].padStart(2, '0');
              const year = dateParts[2];

              let hour = '00';
              let minute = '00';
              let second = '00';

              if (parts.length >= 2) {
                const timeParts = parts[1].split(':');
                if (timeParts.length >= 2) {
                  let h = parseInt(timeParts[0], 10);
                  const ampm = parts[2];
                  if (ampm === 'PM' && h < 12) h += 12;
                  if (ampm === 'AM' && h === 12) h = 0;

                  hour = String(h).padStart(2, '0');
                  minute = String(timeParts[1] || '0').padStart(2, '0');
                  second = String(timeParts[2] || '0').padStart(2, '0');
                }
              }
              value = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
            }
          } else {
            value = null;
          }
        }

        newRow[key] = value;
      });

      return newRow;
    });

    this.dailyReportAccountingService.importExcel(mappedData).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          const created = res?.data?.created ?? 0;
          const skipped = res?.data?.skipped ?? 0;
          const errors = res?.data?.errors ?? [];

          let content = `<div>Tạo mới: <b>${created}</b> • Bỏ qua: <b>${skipped}</b></div>`;

          if (errors.length > 0) {
            const errorList = errors.map((err: any, idx: number) =>
              `${idx + 1}. ${err.message}`
            ).join('<br>');
            content += `
              <div style="margin-top: 12px; max-height: 300px; overflow-y: auto;">
                <p><strong>Chi tiết lỗi:</strong></p>
                <div style="text-align: left; color: red;">${errorList}</div>
              </div>
            `;
          }

          this.modal.success({
            nzTitle: 'Hoàn tất nhập dữ liệu',
            nzContent: content,
            nzOkText: 'Đóng',
            nzOnOk: () => this.activeModal.close('success'),
            nzWidth: 720
          });
        } else {
          this.notification.error('Thông báo', res?.message || 'Nhập dữ liệu thất bại!');
        }
      },
      error: (err: any) => {
        console.error('Import excel error:', err);
        this.notification.error('Thông báo', err?.error?.message || 'Có lỗi xảy ra khi nhập dữ liệu!');
      }
    });
  }

  downloadTemplate() {
    const filePath = '\\\\192.168.1.190\\Software\\Template\\ImportExcel\\BaoCaoCongViecKeToanTemplate.xlsx';

    // Hiển thị loading message
    const msgId = this.notification.info('Thông báo', 'Đang tải file mẫu...', { nzDuration: 0 }).messageId;

    this.dailyReportAccountingService.downloadFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.notification.remove(msgId);

        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'BaoCaoCongViecKeToanTemplate.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải file mẫu thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        this.notification.remove(msgId);
        console.error('Lỗi khi tải file:', res);

        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error('Thông báo', errorMsg);
        }
      }
    });
  }
}
