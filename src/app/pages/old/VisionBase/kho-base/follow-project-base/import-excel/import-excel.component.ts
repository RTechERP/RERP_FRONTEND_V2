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
import { KhoBaseService } from '../../kho-base-service/kho-base.service';

@Component({
  selector: 'app-import-excel',
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
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css'
})
export class ImportExcelComponent implements OnInit {
  sheetNames: string[] = [];
  selectedSheet: string | null = null;
  workbook: XLSX.WorkBook | null = null;

  tableData: any[] = [];
  tableHeaders: string[] = [];

  @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
  tabulator!: Tabulator;

  // Danh sách các cột bắt buộc
  requiredColumns: string[] = [
    'Mã dự án',
    'Tên dự án'
  ];

  // Danh sách các cột ngày tháng (cần chuyển đổi format)
  dateColumns: string[] = [
    'Ngày bắt đầu',
    'Ngày lên phương án',
    'Ngày báo giá',
    'Ngày PO',
    'Ngày kết thúc dự án',
    'Ngày lên phương án_1',
    'Ngày báo giá_1',
    'Ngày PO_1',
    'Ngày kết thúc dự án_1'
  ];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private khoBaseService: KhoBaseService,
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
      // Bỏ qua dòng 1 (band), lấy dòng 2 làm header và dữ liệu từ dòng 3
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '', range: 1 });

      this.tableData = rawData.map(row => {
        const newRow: any = {};

        Object.keys(row).forEach(key => {
          if (!key.startsWith('__EMPTY')) {
            let value = row[key];

            // Convert Excel date to readable format (xử lý cả tiếng Việt và tiếng Anh)
            const keyLower = key.toLowerCase();
            const isDateColumn = keyLower.includes('date') ||
              keyLower.includes('ngày');
            if (typeof value === 'number' && isDateColumn) {
              const parsed = XLSX.SSF.parse_date_code(value);
              if (parsed) {
                value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`;
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
    // Tạo cột số thứ tự
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

    // Tạo các cột dữ liệu
    const dataColumns: any[] = this.tableHeaders.map(col => {
      let align: "left" | "center" | "right" = "left";
      if (col.toLowerCase().includes("date") || col.toLowerCase().includes("ngày")) align = "center";
      else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
      return {
        title: col,
        field: col,
        width: 150,
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
      height: '40vh',
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

        // Kiểm tra giá trị có rỗng không
        if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
          missingColumns.push(columnName);
        }
      });

      // Nếu có cột thiếu, thêm vào danh sách lỗi
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
    console.log('Dữ liệu đã chọn:', this.tableData);

    if (!this.tableData || this.tableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Validate tất cả các cột bắt buộc
    const validationResult = this.validateAllColumns();
    if (!validationResult.isValid) {
      // Hiển thị modal với danh sách lỗi chi tiết
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

        // Chuyển đổi ngày từ dd/MM/yyyy sang ISO 8601 cho API hoặc null
        if (this.dateColumns.includes(key)) {
          if (value && typeof value === 'string' && value.trim() !== '') {
            if (value.includes('/')) {
              const parts = value.split('/');
              if (parts.length === 3) {
                // Chuyển từ dd/MM/yyyy sang yyyy-MM-ddT00:00:00 (ISO 8601)
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                value = `${year}-${month}-${day}T00:00:00`;
              }
            }
          } else {
            // Nếu rỗng, set null để API có thể nhận
            value = null;
          }
        }

        newRow[key] = value;
      });

      return newRow;
    });

    this.khoBaseService.postImportExcel(mappedData).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          const created = res?.created ?? 0;
          const updated = res?.updated ?? 0;
          const skipped = res?.skipped ?? 0;

          this.notification.success('Nhập dữ liệu thành công!',
            `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`);

          this.modal.success({
            nzTitle: 'Hoàn tất nhập dữ liệu',
            nzContent: `
              <div>Tạo mới: <b>${created}</b> • Cập nhật: <b>${updated}</b> • Bỏ qua: <b>${skipped}</b></div>
            `,
            nzOkText: 'Đóng',
            nzOnOk: () => this.activeModal.close('success'),
            nzWidth: 720
          });
        } else {
          this.notification.error('Thông báo', 'Nhập dữ liệu thất bại!');
        }
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi nhập dữ liệu!');
      }
    });
  }
}
