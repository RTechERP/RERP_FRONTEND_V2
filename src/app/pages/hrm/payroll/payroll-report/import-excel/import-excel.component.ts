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
      const file = input.files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('File đã chọn:', file.name); // Log để kiểm tra
      console.log('Phần mở rộng:', fileExtension); // Log để kiểm tra
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        this.notification.warning('Thông báo', 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
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
            this.notification.warning('Thông báo', 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (error) {
          console.error('Lỗi khi đọc tệp Excel trong FileReader.onload:', error); // Log chi tiết lỗi
          this.notification.error('Thông báo', 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
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
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
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
            this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
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
        this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
        return;
      }

      // Lọc dữ liệu hợp lệ (STT phải là số)
      const validDataToSave = this.dataTableExcel.filter(row => {
        const stt = row.STT;
        return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(+stt));
      });

      if (validDataToSave.length === 0) {
        this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
        this.displayProgress = 0;
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
        return;
      }

      // Khởi tạo progress
      this.processedRowsForSave = 0;
      const totalToSave = validDataToSave.length;
      this.displayText = `Đang lưu: ${totalToSave} bản ghi`;
      this.displayProgress = 0;

      // Gọi service lưu dữ liệu
      this.payrollService.importExcelPayrollReport(validDataToSave, this.payrollId)
        .subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              const created = res?.data?.created ?? 0;
              const updated = res?.data?.updated ?? 0;
              const skipped = res?.data?.skipped ?? 0;

              this.displayProgress = 100;
              this.displayText = `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`;
            } else {
              this.notification.error('Thông báo', 'Nhập dữ liệu thất bại!');
            }
            this.isSave = false;
          },
          error: () => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi nhập dữ liệu!');
            this.isSave = false;
          }
        });

    } catch (error) {
      this.notification.error('Thông báo', 'Có lỗi xảy ra!');
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
          const isEmptyRow = !firstCell || !row.getCell(2).value || !row.getCell(3).value;

          if (!isEmptyRow) {
            const rowData: any = {
              IsPublish: row.getCell(1).value?.toString() || '', // Công bố
              Sign: row.getCell(2).value?.toString() || '', // Ký nhận
              STT: row.getCell(3).value?.toString() || '',
              Code: row.getCell(4).value?.toString() || '', // Mã NV
              FullName: row.getCell(5).value?.toString() || '',
              PositionName: row.getCell(6).value?.toString() || '',
              StartWorking: row.getCell(7).value?.toString() || '',
              BasicSalary: row.getCell(8).value || 0,
              TotalMerit: row.getCell(9).value || 0,
              TotalSalaryByDay: row.getCell(10).value || 0,
              SalaryOneHour: row.getCell(11).value || 0,

              OT_Hour_WD: row.getCell(12).value || 0,
              OT_Money_WD: row.getCell(13).value || 0,
              OT_Hour_WK: row.getCell(14).value || 0,
              OT_Money_WK: row.getCell(15).value || 0,
              OT_Hour_HD: row.getCell(16).value || 0,
              OT_Money_HD: row.getCell(17).value || 0,
              OT_TotalSalary: row.getCell(18).value || 0,

              ReferenceIndustry: row.getCell(19).value || 0,
              RealIndustry: row.getCell(20).value || 0,
              AllowanceMeal: row.getCell(21).value || 0,
              Allowance_OT_Early: row.getCell(22).value || 0,
              TotalAllowance: row.getCell(23).value || 0,

              BussinessMoney: row.getCell(24).value || 0,
              NightShiftMoney: row.getCell(25).value || 0,
              CostVehicleBussiness: row.getCell(26).value || 0,
              Bonus: row.getCell(27).value || 0,
              Other: row.getCell(28).value || 0,
              TotalBonus: row.getCell(29).value || 0,

              RealSalary: row.getCell(30).value || 0,

              SocialInsurance: row.getCell(31).value || 0,
              Insurances: row.getCell(32).value || 0,
              UnionFees: row.getCell(33).value || 0,
              AdvancePayment: row.getCell(34).value || 0,
              DepartmentalFees: row.getCell(35).value || 0,
              ParkingMoney: row.getCell(36).value || 0,
              Punish5S: row.getCell(37).value || 0,
              MealUse: row.getCell(38).value || 0,
              OtherDeduction: row.getCell(39).value || 0,
              TotalDeduction: row.getCell(40).value || 0,

              ActualAmountReceived: row.getCell(41).value || 0,
              Note: row.getCell(42).value?.toString() || '',
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
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet!');
      this.resetExcelImportState();
    }
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
      height: '73.4vh',
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
        {
          title: "BẢNG THANH TOÁN LƯƠNG THÁNG " + this.month + " NĂM " + this.year,
          headerHozAlign: "center",
          frozen: true,
          columns: [

            // Nhóm Công tiêu chuẩn + Lương cơ bản
            {
              title: "CÔNG TIÊU CHUẨN " + this.totalWorkday,
              headerHozAlign: "center",
              columns: [
                // Cột lẻ bên trái
                {
                  title: "Công bố", field: "IsPublish", width: 40, hozAlign: "center", headerHozAlign: "center",
                  headerSort: false,
                  headerWordWrap: true,
                  formatter: function (cell: any) {
                    const value = String(cell.getValue()).toLowerCase();
                    const isChecked = value === 'true';
                    return `<input type="checkbox" ${isChecked ? 'checked' : ''} readonly style="pointer-events: none;">`;
                  }

                },
                {
                  title: "Ký nhận", field: "Sign", width: 40, headerHozAlign: "center", hozAlign: "center",
                  headerSort: false,
                  headerWordWrap: true,
                  formatter: function (cell: any) {
                    const value = String(cell.getValue()).toLowerCase();
                    const isChecked = value === 'true';
                    return `<input type="checkbox" ${isChecked ? 'checked' : ''} readonly style="pointer-events: none;">`;
                  }
                },
                { title: "STT", field: "STT", width: 58, hozAlign: "center", headerHozAlign: "center", headerWordWrap: true, },
                { title: "Mã NV", field: "Code", width: 100, headerHozAlign: "center" },
                { title: "Họ tên", field: "FullName", width: 120, headerHozAlign: "center", formatter: 'textarea', headerWordWrap: true, },
                { title: "Chức vụ", field: "PositionName", width: 120, headerHozAlign: "center", formatter: 'textarea' },
                {
                  title: "Ngày vào", field: "StartWorking", width: 120, headerHozAlign: "center", hozAlign: "center",
                  formatter: function (cell) {
                    const raw = cell.getValue();
                    if (!raw) return "";

                    const dateObj = new Date(raw);

                    const date = DateTime.fromJSDate(dateObj);

                    return date.isValid ? date.toFormat('dd/MM/yyyy') : String(raw);
                  }
                },
                {
                  title: "LƯƠNG CƠ BẢN",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "Lương thực lĩnh", hozAlign: "right", headerHozAlign: "center",
                      columns: [
                        {
                          title: "Lương cơ bản tham chiếu", field: "BasicSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          },
                          width: 120,
                          headerWordWrap: true,
                          bottomCalcFormatter: "money", bottomCalc: "sum"
                        },
                        { title: "Công", hozAlign: "right", field: "TotalMerit", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                        {
                          title: "Lương", hozAlign: "right", field: "TotalSalaryByDay", headerHozAlign: "center", formatter: "money",
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          },
                          bottomCalcFormatter: "money", bottomCalc: "sum"
                        },
                        {
                          title: "Đơn giá tiền công/giờ", field: "SalaryOneHour", width: 150, hozAlign: "right", headerHozAlign: "center", formatter: "money",
                          headerWordWrap: true,
                          formatterParams: {
                            decimal: ".",
                            thousand: ",",
                            precision: false
                          },
                          bottomCalcFormatter: "money", bottomCalc: "sum"
                        },
                      ]
                    },
                  ]
                }
              ]
            }
          ]
        },
        {
          title: "",
          headerHozAlign: "center",
          columns: [
            {
              title: "",
              headerHozAlign: "center",
              columns: [
                {
                  title: "Làm thêm",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "Làm thêm ngày thường", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_WD", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_WD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Làm thêm cuối tuần", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_WK", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_WK", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Làm thêm ngày lễ, tết", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          { title: "Số giờ", field: "OT_Hour_HD", hozAlign: "right", headerHozAlign: "center", bottomCalcFormatter: "money", bottomCalc: "sum" },
                          {
                            title: "Thành tiền", field: "OT_Money_HD", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "Tổng tiền làm thêm", field: "OT_TotalSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                      formatterParams: {
                        decimal: ".",
                        thousand: ",",
                        precision: false
                      },
                      bottomCalcFormatter: "money", bottomCalc: "sum"
                    },
                  ]
                },
                {
                  title: "Phụ cấp",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "PCCC", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Phụ cấp chuyên cần tham chiếu", field: "ReferenceIndustry", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phụ cấp chuyên cần thực lĩnh", field: "RealIndustry", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "PC ăn cơm", field: "AllowanceMeal", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "PC đi làm trước 7h15", field: "Allowance_OT_Early", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng tiền PC", field: "TotalAllowance", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },

                  ]
                },
                {
                  title: "Các khoản cộng khác",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Tiền công tác phí", field: "BussinessMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tiền công làm đêm", field: "NightShiftMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Chi phí phương tiện công tác", field: "CostVehicleBussiness", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Thưởng KPIs / doanh số", field: "Bonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Khác", field: "Other", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng cộng", field: "TotalBonus", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },


                  ]
                },
                {
                  title: "Tổng thu nhập", field: "RealSalary", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                  formatterParams: {
                    decimal: ".",
                    thousand: ",",
                    precision: false
                  },
                  bottomCalcFormatter: "money", bottomCalc: "sum"
                },
                {
                  title: "Các khoản phải trừ",
                  headerHozAlign: "center",
                  columns: [
                    {
                      title: "BHXH, BHYT, BHTN", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Mức đóng", field: "SocialInsurance", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phải thu BHXH", field: "Insurances", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                    {
                      title: "", hozAlign: "right", headerHozAlign: "center",
                      columns:
                        [
                          {
                            title: "Công đoàn", field: "UnionFees", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Ứng lương", field: "AdvancePayment", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Thu hộ phòng ban", field: "DepartmentalFees", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Gửi xe ô tô", field: "ParkingMoney", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Phạt 5s", field: "Punish5S", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Cơm ca đã ăn tại cty", field: "MealUse", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Khác (Phải trừ)", field: "OtherDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                          {
                            title: "Tổng cộng các khoản phải trừ", field: "TotalDeduction", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                            formatterParams: {
                              decimal: ".",
                              thousand: ",",
                              precision: false
                            },
                            bottomCalcFormatter: "money", bottomCalc: "sum"
                          },
                        ]
                    },
                  ]
                },
                {
                  title: "Thực lĩnh", field: "ActualAmountReceived", hozAlign: "right", headerHozAlign: "center", formatter: "money",
                  formatterParams: {
                    decimal: ".",
                    thousand: ",",
                    precision: false
                  },
                  bottomCalcFormatter: "money", bottomCalc: "sum"
                },
                { title: "Ghi chú", field: "Note", hozAlign: "right", headerHozAlign: "center" },
              ]
            }
          ]
        }

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
      this.notification.warning('Thông báo', 'Bảng chưa được khởi tạo!');
    }
  }

  showSaveSummary(successCount: number, errorCount: number, totalProducts: number) {
    console.log('--- Hiển thị tóm tắt kết quả lưu ---');
    console.log(`Tổng sản phẩm: ${totalProducts}, Thành công: ${successCount}, Thất bại: ${errorCount}`);

    if (errorCount === 0) {
      this.notification.success('Thông báo', `Đã lưu ${successCount} sản phẩm thành công`);
    } else if (successCount === 0) {
      this.notification.error('Thông báo', `Lưu thất bại ${errorCount}/${totalProducts} sản phẩm`);
    } else {
      this.notification.warning('Thông báo', `Đã lưu ${successCount} sản phẩm thành công, ${errorCount} sản phẩm thất bại`);
    }
    this.activeModal.dismiss();
  }
  //#endregion
}
