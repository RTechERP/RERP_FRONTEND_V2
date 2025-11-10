import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
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
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DayOffService } from '../day-off-service/day-off.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-day-off-import-excel',
  templateUrl: './day-off-import-excel.component.html',
  styleUrls: ['./day-off-import-excel.component.css'],
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
  ]
})
export class DayOffImportExcelComponent implements OnInit, AfterViewInit{

  @Input() dataTable: any[] = [];
  @Input() table: any;

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[]=[];

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh

  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB

  employeeList: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private fb: FormBuilder,
    private dayOffService: DayOffService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit() {
    this.loadEmployee();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  drawTable() {
    if(!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel,
        layout: 'fitDataStretch',
        height: '300px',
        selectableRows: 10,
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true,
        autoColumnsDefinitions: {
          STT: {title: "STT", field: "STT", hozAlign: "center", headerHozAlign: "center", width: 50},
          Code: {title: "Mã nhân viên", field: "Code", hozAlign: "center", headerHozAlign: "center", width: 200},
          FullName: {title: "Tên nhân viên", field: "FullName", hozAlign: "center", headerHozAlign: "center", width: 200},
          DepartmentName: {title: 'Phòng ban', field: "DepartmentName", headerHozAlign: "center", hozAlign: "center", width: 100},
          YearOnleave: {title: "Năm", field: "YearOnleave", hozAlign: "center", headerHozAlign: "center", width: 100},
          TotalDayInYear: {title: "Tổng số ngày phép", field: "TotalDayInYear", hozAlign: "center", headerHozAlign: "center" , width: 100}
        }
      })
    }
  }

  formatProgressText = (percent: number): string => {
    return this.displayText;
  }

  importFromExcel(): void {
    if (this.table) {
      this.table.import("xlsx", [".xlsx", ".csv", ".ods"], "buffer");
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng chưa được khởi tạo!');
    }
  }


  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
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


  // Hàm hỗ trợ để chuẩn hóa giá trị ô
private formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    // Định dạng ngày tháng theo yêu cầu, ví dụ: DD/MM/YYYY
    return `${value.getDate().toString().padStart(2, '0')}/${(value.getMonth() + 1).toString().padStart(2, '0')}/${value.getFullYear()}`;
  }
  return value.toString().trim();
}



  onSheetChange() {
    // Đọc lại file và gọi readExcelData với sheet mới
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          await this.readExcelData(workbook, this.selectedSheet); // Bổ sung gọi hàm đọc dữ liệu
        } catch (error) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet đã chọn!');
          this.resetExcelImportState();
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }


  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    this.processedRowsForSave = 0;
    if (this.tableExcel) {      
      this.tableExcel.replaceData([]);
    }
  }

  closeExcelModal() {
    const modal = document.getElementById('importExcelForm');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      }
    })
  }

  private getEmployeeIDByCode(Code: string): number {
    const empoloyee = this.employeeList.find(e => e.Code === Code);
    return empoloyee ? empoloyee.ID : 0;
  }


  saveExcelData() {
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    // Lọc dữ liệu để chỉ lấy các dòng có STT là số để xử lý lưu
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(parseFloat(stt as string)) && isFinite(parseFloat(stt as string)));
    });

    if (validDataToSave.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    }

    // Reset tiến trình cho giai đoạn lưu dữ liệu
    this.processedRowsForSave = 0;
    const totalProductsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalProductsToSave} bản ghi`;
    this.displayProgress = 0;

    // Lấy danh sách EmployeeID + YearOnleave để kiểm tra tồn tại
    const checkExist = validDataToSave.map(item => ({
      EmployeeID: this.getEmployeeIDByCode(item.Code),
      YearOnleave: item.YearOnleave
    }));

    // Gọi API để kiểm tra các mã và lấy ID
    this.dayOffService.checkExist(checkExist).subscribe({
      next: (response: any) => {
        const existingProducts = (response.data && Array.isArray(response.data.existingProducts)) ? response.data.existingProducts : [];
        // Chuẩn bị dữ liệu để gửi đi lưu
        const processedData = validDataToSave.map((row) => {
          const existingProduct = existingProducts.find((p: any) =>
            p.EmployeeID === row.EmployeeID &&
            p.YearOnleave === row.YearOnleave
          );
          const assignedId = existingProduct ? existingProduct.ID : 0;
          return {
            ID: assignedId,
            EmployeeID: this.getEmployeeIDByCode(row.Code),
            Code: row.Code || '',
            FullName: row.FullName || '',
            DepartmentName: row.DepartmentName || '',
            YearOnleave: row.YearOnleave || '',
            TotalDayInYear: row.TotalDayInYear || '',
          };
        });

        let successCount = 0;
        let errorCount = 0;
        let completedRequests = 0;

        if (processedData.length === 0) {
          this.notification.info('Thông báo', 'Không có bản ghi hợp lệ để tiến hành lưu.');
          this.closeExcelModal();
          return;
        }

        // Hàm để xử lý lưu từng bản ghi với delay
        const saveProductWithDelay = (index: number) => {
          if (index >= processedData.length) {
            this.showSaveSummary(successCount, errorCount, totalProductsToSave);
            return;
          }

          const product = processedData[index];
          setTimeout(() => {
            this.dayOffService.saveEmployeeOnLeaveMaster(product).subscribe({
              next: (response: any) => {
                if (response.status === 1) {
                  successCount++;
                } else {
                  errorCount++;
                }
                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;
                saveProductWithDelay(index + 1);
              },
              error: (err: any) => {
                errorCount++;
                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;
                saveProductWithDelay(index + 1);
              }
            });
          }, 5); // Delay 0.005s
        };
        saveProductWithDelay(0);
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi kiểm tra dữ liệu từ database!');
        this.displayText = 'Lỗi kiểm tra dữ liệu!';
        this.displayProgress = 0;
      }
    });
  }

  private showSaveSummary(successCount: number, errorCount: number, total: number) {
    if (errorCount === 0) {
      this.notification.success('Thông báo', `Đã lưu ${successCount} bản ghi thành công`);
    } else if (successCount === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, `Lưu thất bại ${errorCount}/${total} bản ghi`);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu ${successCount} bản ghi thành công, ${errorCount} bản ghi thất bại`);
    }
    this.closeExcelModal();
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
      try {
          const worksheet = workbook.getWorksheet(sheetName);
          if(!worksheet) {
            throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`);
          }

          const headerRow = worksheet.getRow(2);
          const headers: string[] = [];
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
          });

          const columns = [
            {title: 'STT', field:'STT',hozAlign:'center',headerHozAlign:"center",width:70},
            { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
            { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
            { title: 'Phòng ban', field: 'DepartmentName', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
            { title: 'Năm', field: 'YearOnleave', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
            { title: 'Tổng số ngày phép', field: 'TotalDayInYear', hozAlign: 'left', headerHozAlign: 'center', width: 100},
          ];

          // Cập nhật cấu hình cột cho bảng Excel
        if (this.tableExcel) {
          this.tableExcel.setColumns(columns);
        }
        

        const data: any[] = []; // Dữ liệu cho bảng preview
        let validRecords = 0; // Số lượng bản ghi hợp lệ
        let foundFirstDataRow = false; // Biến flag để xác định hàng dữ liệu hợp lệ đầu tiên

        // Đọc dữ liệu từ hàng thứ 2 trở đi
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Bỏ qua hàng tiêu đề đầu tiên
            const firstCell = row.getCell(1).value;
            const secondCell = row.getCell(2).value;
            const thirdCell = row.getCell(3).value;
            
            // Kiểm tra nếu cell(1) là số
            const isFirstCellNumber = typeof firstCell === 'number' && !isNaN(firstCell);

            // Kiểm tra nếu hàng không rỗng hoàn toàn
            // Đồng thời đảm bảo secondCell và thirdCell không được rỗng
            const isEmptyRow = !firstCell || (!secondCell || !thirdCell);

            // Nếu hàng không trống, tạo rowData và thêm vào dataTableExcel
            if (!isEmptyRow) {
              const rowData: any = {
                STT: firstCell?.toString() || '', // Lấy giá trị gốc, chuyển sang chuỗi
                Code: row.getCell(2).value?.toString() || '',
                FullName: row.getCell(3).value?.toString() || '',
                DepartmentName: row.getCell(4).value?.toString() || '',
                YearOnleave: row.getCell(5).value?.toString() || '',
                TotalDayInYear: row.getCell(6).value?.toString() || '',
                EmployeeID: row.getCell(7)?.value?.toString() || '', // Nếu có cột EmployeeID
              };
              data.push(rowData); // Thêm vào data cho bảng preview
            }

            // Logic để xác định khi nào bắt đầu đếm validRecords
            if (typeof firstCell === 'number' && !isNaN(firstCell)) {
              foundFirstDataRow = true; // Đánh dấu đã tìm thấy hàng dữ liệu đầu tiên có STT số
            }

            // Đếm validRecords chỉ sau khi tìm thấy hàng đầu tiên có STT số và hàng đó không trống
            if (foundFirstDataRow && !isEmptyRow) {
              validRecords++;
            }
          }
        });

        this.dataTableExcel = data; // Gán dữ liệu đầy đủ cho bảng preview
        this.totalRowsAfterFileRead = validRecords; // Cập nhật tổng số dòng hợp lệ (đếm từ hàng có STT số)
        this.displayProgress = 0; 
        if (this.totalRowsAfterFileRead === 0) {
          this.displayText = 'Không có dữ liệu hợp lệ trong sheet.'; // Thông báo rõ ràng hơn
        } else {
          this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
        }
        
        // Cập nhật Tabulator
        if (this.tableExcel) {
          this.tableExcel.replaceData(this.dataTableExcel);
        } else {
          this.drawTable();     
        }
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ sheet trong readExcelData:', error); // Log chi tiết lỗi
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
        this.resetExcelImportState(); // Reset trạng thái khi có lỗi
      }
    }
}