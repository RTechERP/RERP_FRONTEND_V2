import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { EmployeeCurricularService } from '../employee-curricular-service/employee-curricular.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DateTime } from 'luxon';


@Component({
  selector: 'app-employee-curricular-excel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSplitterModule,
  ],
  templateUrl: './excel-employee-curricular.component.html',
  styleUrls: ['./excel-employee-curricular.component.css'],
})
export class EmployeeCurricularExcelComponent implements OnInit, AfterViewInit {
  file?: File;
  filePath: string = '';
  sheetNames: string[] = [];
  selectedSheet: string = '';
  previewData: any[] = [];
  previewColumns: string[] = [];

  @ViewChild('excelTableContainer', { static: false })
  tableContainer!: ElementRef;
  tb_excelPreview!: Tabulator;

  constructor(
    private curricularService: EmployeeCurricularService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {}
  ngAfterViewInit(): void {}

  openFileExplorer(): void {
    (document.getElementById('fileInput') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event): void {
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
    this.file = file;
    this.filePath = file.name;
    this.sheetNames = [];
    this.selectedSheet = '';
    this.previewData = [];
    this.loadExcel(file);
    input.value = '';
  }

  async loadExcel(file: File): Promise<void> {
    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        this.sheetNames = workbook.worksheets.map((ws) => ws.name);
        if (this.sheetNames.length > 0) {
          this.selectedSheet = this.sheetNames[0];
          const ws = workbook.getWorksheet(this.selectedSheet);
          this.extractSheet(ws);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi đọc file Excel!');
      this.resetExcelImportState();
    }
  }

  async onSheetChange(): Promise<void> {
    if (!this.file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const ws = workbook.getWorksheet(this.selectedSheet);
        this.extractSheet(ws);
      };
      reader.readAsArrayBuffer(this.file);
    } catch (error) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi đọc sheet!');
    }
  }

  private resetExcelImportState(): void {
    this.file = undefined;
    this.filePath = '';
    this.sheetNames = [];
    this.selectedSheet = '';
    this.previewData = [];
    this.previewColumns = [];
    if (this.tb_excelPreview) {
      this.tb_excelPreview.replaceData([]);
    }
  }
  
  extractSheet(ws: ExcelJS.Worksheet | undefined) {
    if (!ws) return;

    const rows: any[] = [];
    const header: string[] = [];

    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colIndex) => {
      header.push(cell.text ? cell.text.toString().trim() : `F${colIndex}`);
    });
    this.previewColumns = header;

    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      const obj: any = {};
      row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        const key = this.previewColumns[colIndex - 1] || `F${colIndex}`;
        obj[key] = cell.text ? cell.text.toString().trim() : '';
      });
      rows.push(obj);
    }

    this.previewData = rows;
    this.drawExcelPreview();
  }

  drawExcelPreview(): void {
    if (!this.tableContainer) return;

    const columns = this.previewColumns.map((col) => ({
      title: col,
      field: col,
      widthGrow: 2,
      headerHozAlign: 'center' as const,
      hozAlign: 'left' as const,
    }));

    if (!this.tb_excelPreview) {
      this.tb_excelPreview = new Tabulator(this.tableContainer.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        height: '50vh',
        layout: 'fitColumns',
        data: this.previewData,
        columns: columns,
      } as any);
    } else {
      this.tb_excelPreview.setColumns(columns);
      this.tb_excelPreview.replaceData(this.previewData);
    }
  }

  saveData(): void {
    if (!this.file) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file Excel!');
      return;
    }

    if (this.previewData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    this.notification.info('Thông báo', 'Đang xử lý file Excel...');

    this.curricularService.importExcel(this.file, this.selectedSheet || undefined).subscribe({
      next: (response: any) => {
        if (response && (response.status === 1 || response.Success)) {
          const result = response.data || {};
          const importedCount = result.ImportedCount || 0;
          const errorCount = result.ErrorCount || 0;
          const errors = result.Errors || [];

          if (errorCount > 0) {
            const errorMsg = errors.length > 0 
              ? `Đã import ${importedCount} bản ghi. Có ${errorCount} lỗi:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`
              : `Đã import ${importedCount} bản ghi. Có ${errorCount} lỗi.`;
            
            this.notification.warning(NOTIFICATION_TITLE.warning, errorMsg);
          } else {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              `Đã import thành công ${importedCount} bản ghi!`
            );
          }

          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Import thất bại!');
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi import dữ liệu!'
        );
      },
    });
  }

  downloadTemplate(): void {
    const fileName = 'Danh_Muc_Nhan_Vien_Ngoai_Khoa.xlsx';
    this.curricularService.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success(NOTIFICATION_TITLE.success, 'Tải file mẫu thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error(NOTIFICATION_TITLE.error, errorText.message || 'Tải file mẫu thất bại!');
            } catch {
              this.notification.error(NOTIFICATION_TITLE.error, 'Tải file mẫu thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải file mẫu thất bại. Vui lòng thử lại!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        }
      },
    });
  }

  closeExcelModal(): void {
    this.activeModal.dismiss();
  }
}
