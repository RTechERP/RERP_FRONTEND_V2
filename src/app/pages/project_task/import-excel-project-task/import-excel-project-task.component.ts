import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImportExcelProjectTaskService } from './import-excel-project-task.service';

@Component({
  selector: 'app-import-excel-project-task',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzProgressModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './import-excel-project-task.component.html',
  styleUrl: './import-excel-project-task.component.css'
})
export class ImportExcelProjectTaskComponent implements OnInit, AfterViewInit {

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  workbook: ExcelJS.Workbook | null = null;

  // Thanh tiến trình
  displayProgress: number = 0;
  displayText: string = '0/0';

  totalRowsAfterFileRead: number = 0;
  isSaving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private importService: ImportExcelProjectTaskService
  ) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.initTable();
  }

  // ===== KHỞI TẠO BẢNG TABULATOR =====
  initTable() {
    if (!this.tableExcel) {
      const columns = this.getTableColumns();
      this.tableExcel = new Tabulator('#taskImportTable', {
        data: this.dataTableExcel,
        layout: 'fitDataStretch',
        height: '100%',
        selectableRows: false,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: columns as any
      });

      this.tableExcel.on('cellEdited', (cell: any) => {
        const rowData = cell.getRow().getData();
        const rowIndex = this.dataTableExcel.findIndex((row: any) => row === cell.getRow().getData());
        if (rowIndex !== -1) {
          this.dataTableExcel[rowIndex] = { ...rowData };
        }
      });
    } else {
      const columns = this.getTableColumns();
      this.tableExcel.setColumns(columns as any);
    }
  }

  getTableColumns() {
    return [
      { title: "TT", field: "TT", hozAlign: "center", headerHozAlign: "center", width: 80, editor: "input" },
      { title: "Tên công việc", field: "Mission", hozAlign: "left", headerHozAlign: "center", minWidth: 250, formatter: 'textarea', editor: "input" },
      { title: "Mã dự án", field: "ProjectCode", hozAlign: "center", headerHozAlign: "center", width: 130, editor: "input" },
      { title: "Người giao việc", field: "EmployeeCode", hozAlign: "center", headerHozAlign: "center", width: 130, editor: "input" },
      { title: "Người thực hiện", field: "AssigneesCodes", hozAlign: "left", headerHozAlign: "center", width: 210, editor: "input" },
      { title: "Người liên quan", field: "RelatedCodes", hozAlign: "left", headerHozAlign: "center", width: 210, editor: "input" },
      { title: "Độ phức tạp", field: "TaskComplexity", hozAlign: "center", headerHozAlign: "center", width: 120, editor: "number" },
      { title: "Ngày BĐ dự kiến", field: "PlanStartDate", hozAlign: "center", headerHozAlign: "center", width: 140, editor: "input" },
      { title: "Ngày KT dự kiến", field: "PlanEndDate", hozAlign: "center", headerHozAlign: "center", width: 140, editor: "input" },
    ];
  }

  // ===== MỞ FILE EXPLORER =====
  openFileExplorer() {
    const fileInput = document.getElementById('fileInputTask') as HTMLInputElement;
    fileInput?.click();
  }

  // ===== XỬ LÝ CHỌN FILE =====
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning('Thông báo', 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = '';
        this.resetState();
        return;
      }

      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.workbook = null;

      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          this.displayProgress = Math.round((event.loaded / event.total) * 100);
          this.displayText = `Đang tải file: ${this.displayProgress}%`;
        }
      };

      const startTime = Date.now();

      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          this.workbook = new ExcelJS.Workbook();
          await this.workbook.xlsx.load(data);

          // Chỉ lấy các sheet visible
          this.excelSheets = this.workbook.worksheets
            .filter(sheet => sheet.state === 'visible')
            .map(sheet => sheet.name);

          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            await this.readSheet(this.selectedSheet);

            const elapsedTime = Date.now() - startTime;
            const minDisplayTime = 500;

            if (elapsedTime < minDisplayTime) {
              setTimeout(() => {
                this.updateProgressAfterRead();
              }, minDisplayTime - elapsedTime);
            } else {
              this.updateProgressAfterRead();
            }
          } else {
            this.notification.warning('Thông báo', 'File Excel không có sheet nào!');
            this.resetState();
          }
        } catch (error) {
          console.error('Lỗi khi đọc tệp Excel:', error);
          this.notification.error('Thông báo', 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
          this.resetState();
        }
        input.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  }

  // ===== ĐỌC DỮ LIỆU TỪ SHEET =====
  async readSheet(sheetName: string) {
    try {
      const ws = this.workbook?.getWorksheet(sheetName);
      if (!ws) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`);
      }

      const rows: any[] = [];
      let validRecords = 0;
      const regexTT = /^\d+(\.\d+)*$/;

      // Dữ liệu bắt đầu từ hàng 3
      ws.eachRow((row, rowNum) => {
        if (rowNum < 3) return;

        const TT = this.getCellText(row.getCell(1)).trim();
        if (!TT) return;

        // Validate TT bằng regex
        if (!regexTT.test(TT)) return;

        rows.push({
          TT,
          Mission: this.getCellText(row.getCell(2)),
          ProjectCode: this.getCellText(row.getCell(3)),
          EmployeeCode: this.getCellText(row.getCell(4)),
          AssigneesCodes: this.getCellText(row.getCell(5)),
          RelatedCodes: this.getCellText(row.getCell(6)),
          TaskComplexity: this.parseNumber(row.getCell(7)),
          PlanStartDate: this.formatDateForDisplay(row.getCell(8)),
          PlanEndDate: this.formatDateForDisplay(row.getCell(9)),
        });

        validRecords++;
      });

      this.dataTableExcel = rows;
      this.totalRowsAfterFileRead = validRecords;

      // Cập nhật Tabulator
      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        this.initTable();
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetState();
    }
  }

  // ===== THAY ĐỔI SHEET =====
  async onSheetChange() {
    if (this.selectedSheet && this.workbook) {
      try {
        await this.readSheet(this.selectedSheet);
        this.displayProgress = 0;
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ sheet đã chọn:', error);
        this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
        this.resetState();
      }
    } else if (!this.workbook) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file Excel trước!');
    }
  }

  // ===== LƯU DỮ LIỆU =====
  saveExcelData() {
    this.isSaving = true;

    // Lấy dữ liệu mới nhất từ bảng Tabulator
    if (!this.tableExcel) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      this.isSaving = false;
      return;
    }

    const currentTableData = this.tableExcel.getData();

    if (!currentTableData || currentTableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      this.isSaving = false;
      return;
    }

    // Validate: Mission bắt buộc
    const invalidRows = currentTableData.filter((row: any) => !row.Mission || row.Mission.trim() === '');
    if (invalidRows.length > 0) {
      this.notification.warning('Thông báo', `Có ${invalidRows.length} dòng chưa có Tên công việc!`);
      this.isSaving = false;
      return;
    }

    // Validate: TaskComplexity phải từ 1-5 (nếu có)
    const invalidComplexity = currentTableData.filter((row: any) => {
      const val = Number(row.TaskComplexity);
      return row.TaskComplexity && (val < 1 || val > 5);
    });
    if (invalidComplexity.length > 0) {
      this.notification.warning('Thông báo', `Có ${invalidComplexity.length} dòng có Độ phức tạp không hợp lệ (phải từ 1-5)!`);
      this.isSaving = false;
      return;
    }

    // Validate: Ngày tháng (Định dạng & Logic)
    for (const row of currentTableData) {
      const startStr = row.PlanStartDate?.toString()?.trim();
      const endStr = row.PlanEndDate?.toString()?.trim();

      const start = startStr ? new Date(startStr) : null;
      const end = endStr ? new Date(endStr) : null;

      if (startStr && start && isNaN(start.getTime())) {
        this.notification.warning('Thông báo', `Dòng ${row.TT || ''}: Ngày bắt đầu dự kiến không hợp lệ!`);
        this.isSaving = false;
        return;
      }
      if (endStr && end && isNaN(end.getTime())) {
        this.notification.warning('Thông báo', `Dòng ${row.TT || ''}: Ngày kết thúc dự kiến không hợp lệ!`);
        this.isSaving = false;
        return;
      }
      if (start && end && start > end) {
        this.notification.warning('Thông báo', `Dòng ${row.TT || ''}: Ngày bắt đầu không được lớn hơn ngày kết thúc!`);
        this.isSaving = false;
        return;
      }
    }

    // Chuẩn bị payload
    const payload = currentTableData.map((row: any) => ({
      TT: row.TT?.toString()?.trim() || '',
      Mission: row.Mission?.toString()?.trim() || '',
      ProjectCode: row.ProjectCode?.toString()?.trim() || '',
      EmployeeCode: row.EmployeeCode?.toString()?.trim() || '',
      AssigneesCodes: row.AssigneesCodes?.toString()?.trim() || '',
      RelatedCodes: row.RelatedCodes?.toString()?.trim() || '',
      TaskComplexity: row.TaskComplexity || 0,
      PlanStartDate: this.parseDate(row.PlanStartDate),
      PlanEndDate: this.parseDate(row.PlanEndDate),
    }));

    // Gọi API import
    this.importService.importTasks(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 1 || res.success) {
          this.notification.success('Thành công', res.message || `Đã import ${currentTableData.length} công việc thành công!`);
          this.activeModal.close({ success: true });
        } else {
          this.notification.error('Lỗi', res.message || 'Import thất bại!');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Lỗi khi import:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server!';
        this.notification.error('Lỗi', msg);
      }
    });
  }

  // ===== TẢI TEMPLATE MẪU =====
  downloadTemplate() {
    this.importService.downloadTemplate('KhaiBaoCongViecTemplate.xlsx').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'KhaiBaoCongViecTemplate.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Thành công', 'Đã tải template mẫu!');
      },
      error: (err: any) => {
        console.error('Lỗi khi tải template:', err);
        this.notification.error('Lỗi', 'Không thể tải template mẫu!');
      }
    });
  }

  // ===== ĐÓNG MODAL =====
  onClose() {
    this.activeModal.dismiss();
  }

  // ===== HELPER FUNCTIONS =====

  private updateProgressAfterRead() {
    this.displayProgress = 0;
    if (this.totalRowsAfterFileRead === 0) {
      this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
    } else {
      this.displayText = `${this.totalRowsAfterFileRead} bản ghi hợp lệ`;
    }
  }

  private resetState() {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.totalRowsAfterFileRead = 0;
    this.displayProgress = 0;
    this.displayText = '0/0';
    this.workbook = null;
    if (this.tableExcel) {
      this.tableExcel.replaceData([]);
    }
  }

  private getCellText(cell: any): string {
    if (!cell) return '';

    try {
      if (cell.result !== undefined && cell.result !== null) {
        return String(cell.result);
      }
      if (cell.text !== undefined && cell.text !== null && cell.text !== '') {
        return String(cell.text);
      }
    } catch (e) { }

    try {
      const value = cell.value;
      if (value === null || value === undefined) return '';

      if (typeof value === 'object' && value.formula) {
        if (cell.text !== undefined && cell.text !== null) {
          return String(cell.text);
        }
        return '';
      }

      if (typeof value === 'object' && value.richText) {
        if (Array.isArray(value.richText)) {
          return value.richText.map((rt: any) => rt?.text || '').join('');
        }
      }

      if (typeof value === 'object' && 'text' in value && value.text !== null && value.text !== undefined) {
        return String(value.text);
      }

      return String(value);
    } catch (e) {
      return '';
    }
  }

  private parseNumber(cell: any): number {
    if (!cell) return 0;
    try {
      if (cell.result !== undefined && cell.result !== null) {
        if (typeof cell.result === 'number') return cell.result;
        const num = parseFloat(String(cell.result).replace(/[,\.]/g, ''));
        if (!isNaN(num)) return num;
      }

      let value = cell.value;
      if (typeof value === 'object' && value?.formula) {
        value = cell.result ?? cell.text ?? 0;
      }
      if (typeof value === 'number') return value;
      if (!value) return 0;

      const str = String(value).replace(/,/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    } catch (e) {
      return 0;
    }
  }

  private formatDateForDisplay(cell: any): string {
    if (!cell) return '';
    try {
      let value = cell.value;

      // Nếu là formula, lấy result
      if (typeof value === 'object' && value?.formula) {
        value = cell.result ?? cell.text ?? null;
      }

      if (!value) return '';

      // Nếu là Date object
      if (value instanceof Date) {
        if (!isNaN(value.getTime())) {
          return this.formatDate(value);
        }
      }

      // Nếu là string
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return this.formatDate(date);
        }
        // Thử parse dd/MM/yyyy
        const match = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          const parsed = new Date(`${year}-${month}-${day}`);
          if (!isNaN(parsed.getTime())) {
            return this.formatDate(parsed);
          }
        }
      }

      // Nếu là number (Excel serial date)
      if (typeof value === 'number') {
        const date = this.excelSerialToDate(value);
        if (date) return this.formatDate(date);
      }

      return String(value);
    } catch (e) {
      return '';
    }
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private excelSerialToDate(serial: number): Date | null {
    if (serial < 1) return null;
    // Excel serial date: days since 1900-01-01 (with a known bug for 1900-02-29)
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseDate(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      const dateMatch = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString();
    }
    return null;
  }
}
