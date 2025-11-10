import { Component, OnInit, AfterViewInit, ViewChild, Input, ElementRef, AfterRenderOptions } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';

import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PayrollService } from '../../payroll.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
function formatDate(value: any): string | null {
  if (!value) return null;
  const strValue = String(value).trim();

  const date = DateTime.fromFormat(strValue, 'd/M/yyyy');

  if (!date.isValid) return null;
  return date.toISODate();
}

function checkBoxFormatter(cell: CellComponent) {
  debugger
  const value = String(cell.getValue()).toLowerCase();
  const isChecked = value === 'true';

  return `<input type="checkbox" ${isChecked ? 'checked' : ''} readonly style="pointer-events: none;">`;
}

function moneyCol(title: any, field: any) {
  return {
    title,
    field,
    hozAlign: 'right',
    headerHozAlign: 'center',
    formatter: 'money',
    formatterParams: {
      decimal: '.',
      thousand: ',',
      precision: false,
    },
    bottomCalc: 'sum',
    bottomCalcFormatter: 'money',
  };
}

@Component({
  selector: 'app-import-excel',
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzProgressModule
  ],
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css'
})
export class ImportExcelComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private payrollService: PayrollService,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
  ) { }

  @ViewChild('tb_excel', { static: true })
  tb_excelContainer!: ElementRef;
  tb_excel!: any;

  @Input() payrollId: number = 0;
  @Input() totalWorkday: number = 0;
  @Input() month: number = 0;
  @Input() year: number = 0;
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  isSave: any = false;

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;

  selectedFile: File | null = null;

  //#endregion

  //#region Các hàm chạy 
  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.drawTbExcel(this.tb_excelContainer.nativeElement);
  }

  formatProgressText = (percent: number): string => {
    return this.displayText;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const file = input.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('File đã chọn:', file.name); // Log để kiểm tra
      console.log('Phần mở rộng:', fileExtension); // Log để kiểm tra
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
        input.value = ''; // Xóa input để có thể chọn lại file
        this.resetExcelImportState(); // Reset trạng thái khi có lỗi định dạng
        return;
      }
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.processedRowsForSave = 0; // Reset cho giai đoạn lưu
      // Đặt trạng thái ban đầu cho thanh tiến trình: Đang đọc file
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';
      console.log('Progress bar state set to: Đang đọc file...'); // Log trạng thái ban đầu
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          this.displayProgress = Math.round((event.loaded / event.total) * 100);
          this.displayText = `Đang tải file: ${this.displayProgress}%`;
          // console.log(`Tiến trình đọc file: ${this.displayProgress}%`); // Bỏ comment nếu muốn log chi tiết tiến trình tải
        }
      };
      let startTime = Date.now(); // Ghi lại thời gian bắt đầu đọc file
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          console.log('Workbook đã được tải bởi ExcelJS.'); // Log
          this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
          console.log('Danh sách sheets tìm thấy:', this.excelSheets); // Log
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            console.log('Sheet mặc định được chọn:', this.selectedSheet); // Log
            await this.readExcelData(workbook, this.selectedSheet);
            const elapsedTime = Date.now() - startTime;
            const minDisplayTime = 500; // Thời gian hiển thị tối thiểu cho trạng thái tải (500ms)
            if (elapsedTime < minDisplayTime) {
              // Nếu quá trình xử lý nhanh hơn thời gian tối thiểu, đợi thêm
              setTimeout(() => {
                this.displayProgress = 0; // Luôn hiển thị 0% cho trạng thái "0/tổng số dòng"
                if (this.totalRowsAfterFileRead === 0) {
                  this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                } else {
                  this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                }
                console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật (sau delay).');
              }, minDisplayTime - elapsedTime);
            } else {
              // Nếu quá trình xử lý đã đủ lâu, cập nhật ngay lập tức
              this.displayProgress = 0;
              if (this.totalRowsAfterFileRead === 0) {
                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
              } else {
                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
              }
              console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật.');
            }
          } else {
            console.warn('File Excel không chứa bất kỳ sheet nào.'); // Log
            this.notification.warning(NOTIFICATION_TITLE.warning, 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (error) {
          console.error('Lỗi khi đọc tệp Excel trong FileReader.onload:', error); // Log chi tiết lỗi
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
          this.resetExcelImportState(); // Reset trạng thái khi có lỗi
        }
        input.value = ''; // Xóa input để có thể chọn lại cùng file
      };
      reader.readAsArrayBuffer(file); // Bắt đầu đọc file ngay lập tức
    }
  }

  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.filePath) {
      debugger
      if (this.selectedFile != null) {
        const file = this.selectedFile;
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const data = e.target.result;
          try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            await this.readExcelData(workbook, this.selectedSheet);
            // Sau khi thay đổi sheet và đọc dữ liệu, đặt lại thanh tiến trình
            this.displayProgress = 0;
            // displayText được cập nhật trong readExcelData
            console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.'); // Log
          } catch (error) {
            console.error('Lỗi khi đọc tệp Excel khi thay đổi sheet:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet đã chọn!');
            this.resetExcelImportState(); // Reset trạng thái khi có lỗi
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  }

  async saveExcelData() {
    this.isSave = true;

    try {
      if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
        return;
      }

      // Lọc dữ liệu hợp lệ (STT phải là số)
      const validDataToSave = this.dataTableExcel.filter(row => {
        const stt = row.STT;
        return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(+stt));
      });

      if (validDataToSave.length === 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
        this.displayProgress = 0;
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
        return;
      }

      // Khởi tạo progress
      this.processedRowsForSave = 0;
      const totalToSave = validDataToSave.length;
      this.displayText = `Đang lưu: ${totalToSave} bản ghi`;
      this.displayProgress = 0;

      this.payrollService.importExcelPayrollBonusDeduction(this.dataTableExcel, this.month, this.year).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            const created = res?.data?.created ?? 0;
            const updated = res?.data?.updated ?? 0;
            const skipped = res?.data?.skipped ?? 0;

            this.displayProgress = 100;
            this.displayText = `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`;
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, 'Nhập dữ liệu thất bại!');
          }
          this.isSave = false;
        },
        error: () => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi nhập dữ liệu!');
          this.isSave = false;
        }
      });

    } catch (error) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra!');
      this.isSave = false;
    }
  }


  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);
      debugger
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      const data: any[] = [];
      let validRecords = 0;
      let foundFirstDataRow = false;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const firstCell = row.getCell(1).value;
          const isEmptyRow = !firstCell || !row.getCell(2).value || !row.getCell(5).value;

          if (!isEmptyRow) {
            const rowData: any = {
              STT: row.getCell(1).value?.toString() || '',
              Code: row.getCell(2).value?.toString() || '',   // Mã nhân viên
              FullName: row.getCell(3).value?.toString() || '', // Tên nhân viên
              Year: row.getCell(4).value?.toString() || '',
              Month: row.getCell(5).value?.toString() || '',
              Depart: row.getCell(6).value?.toString() || '',
              KPIBonus: row.getCell(7).value || 0,            // Thưởng KPIs / doanh số
              OtherBonus: row.getCell(8).value || 0,          // Thưởng khác
              ParkingMoney: row.getCell(9).value || 0,       // Gửi xe Ô tô
              Punish5S: row.getCell(10).value || 0,           // Phạt 5s
              OtherDeduction: row.getCell(11).value || 0,     // Khoản trừ khác
              Insurances: row.getCell(12).value || 0,          // Mức thu BHXH
              TotalWorkDay: row.getCell(13).value || 0,             // Lao động (nếu có)
              SalaryAdvance: this.getCellText(row.getCell(14)),      // Ứng lương
              Note: row.getCell(15).value?.toString() || '',  // Ghi chú
            };

            data.push(rowData);
          }

          if (typeof firstCell === 'number' && !isNaN(firstCell)) {
            foundFirstDataRow = true;
          }
          if (foundFirstDataRow && !isEmptyRow) {
            validRecords++;
          }
        }
      });

      this.dataTableExcel = data;
      this.totalRowsAfterFileRead = data.length;
      this.displayProgress = 0;
      this.displayText = `${data.length} bản ghi`;
      if (this.tb_excel) {
        this.tb_excel.replaceData(data);
      } else {
        this.drawTbExcel(this.tb_excelContainer.nativeElement);
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet!');
      this.resetExcelImportState();
    }
  }

  getCellText(cell: ExcelJS.Cell): string {
    if (!cell || cell.value == null) return '';
    const value = cell.value as any;

    if (typeof value === 'object' && 'formula' in value) {
      return value.result?.toString() || '';
    }

    return value.toString();
  }

  resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    this.processedRowsForSave = 0;

    if (this.tableExcel) {
      this.tableExcel.replaceData([]); // Xóa dữ liệu trong Tabulator preview
    }
    console.log('Trạng thái nhập Excel đã được reset.'); // Log
  }

  drawTbExcel(container: HTMLElement) {
    this.tb_excel = new Tabulator(container, {
      height: '74vh',
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      paginationMode: 'local',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      columnHeaderVertAlign: "bottom",
      layout: 'fitDataStretch',
      columns: [
        { title: "STT", field: "STT", width: 60, headerHozAlign: "center", hozAlign: "center", frozen: true },
        { title: "Mã nhân viên", field: "Code", width: 130, headerHozAlign: "center", hozAlign: "center", frozen: true },
        { title: "Tên nhân viên", field: "FullName", width: 200, headerHozAlign: "center", frozen: true },
        { title: "Năm", field: "Year", width: 60, headerHozAlign: "center", frozen: true },
        { title: "Tháng", field: "Month", width: 80, headerHozAlign: "center", frozen: true },
        { title: "Phòng", field: "Depart", width: 100, headerHozAlign: "center", frozen: true },
        {
          title: "Thưởng KPIs / doanh số", field: "KPIBonus", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          },
          headerWordWrap: true,
        },
        {
          title: "Thưởng khác", field: "OtherBonus", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Gửi xe Ô tô", field: "ParkingMoney", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Phạt 5s", field: "Punish5S", width: 100, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Khoản trừ khác", field: "OtherDeduction", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },

        {
          title: "Mức thu BHXH", field: "Insurances", width: 150, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Công", field: "TotalWorkDay", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        {
          title: "Ứng lương", field: "SalaryAdvance", width: 120, headerHozAlign: "center", hozAlign: "right", formatter: "money",
          formatterParams: {
            decimal: ".",
            thousand: ",",
            precision: false
          }
        },
        { title: "Ghi chú", field: "Note", width: 200, headerHozAlign: "center", hozAlign: "left" }
      ]
    });

    this.tb_excel.on("pageLoaded", () => {
      this.tb_excel.redraw();
    });
  }

  importFromExcel(): void {
    if (this.tb_excel) {
      this.tb_excel.import("xlsx", [".xlsx", ".csv", ".ods"], "buffer");
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
    }
  }

  showSaveSummary(successCount: number, errorCount: number, totalProducts: number) {
    console.log('--- Hiển thị tóm tắt kết quả lưu ---');
    console.log(`Tổng sản phẩm: ${totalProducts}, Thành công: ${successCount}, Thất bại: ${errorCount}`);

    if (errorCount === 0) {
      this.notification.success('Thông báo', `Đã lưu ${successCount} sản phẩm thành công`);
    } else if (successCount === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, `Lưu thất bại ${errorCount}/${totalProducts} sản phẩm`);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu ${successCount} sản phẩm thành công, ${errorCount} sản phẩm thất bại`);
    }
    this.activeModal.dismiss();
  }
  //#endregion
}
