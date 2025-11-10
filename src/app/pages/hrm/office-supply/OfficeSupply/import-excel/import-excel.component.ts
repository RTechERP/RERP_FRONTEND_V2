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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyService } from '../office-supply-service/office-supply-service.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
@Component({
  selector: 'app-import-excel',
  standalone:true,
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
  ],
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css'
})
export class ImportExcelComponent implements OnInit, AfterViewInit {
  @Input() lstVP: any[] = [];
  @Input() dataTable: any[] = [];
  @Input() table: any;
  @Input() lastAddedIdProduct: number | null = null;
  @Input() searchText: string = '';

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[]=[];
  listUnit: any[] = [];
  
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB


  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private officesupplyService :OfficeSupplyService
  ) { }
  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    this.drawtable();
  }

  drawtable(){
    if (!this.tableExcel) { // Chỉ khởi tạo nếu chưa có
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel, // Dữ liệu ban đầu rỗng
        layout: 'fitDataFill',
        height: '300px', // Chiều cao cố định cho bảng trong modal
        selectableRows: 10,
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true, // Tự động tạo cột dựa trên dữ liệu
        autoColumnsDefinitions: {
          STT: { title: "STT", field: "STT", hozAlign: "center", headerHozAlign: "center", width: 50 },
          CodeRTC: { title: "Mã RTC", field: "CodeRTC", hozAlign: "left", headerHozAlign: "center", width: 80 },
          CodeNCC: { title: "Mã NCC", field: "CodeNCC", hozAlign: "left", headerHozAlign: "center", width: 100 },
          NameRTC: { title: "Tên (RTC)", field: "NameRTC", hozAlign: "left", headerHozAlign: "center", width: 200 },
          NameNCC: { title: "Tên (NCC)", field: "NameNCC", hozAlign: "left", headerHozAlign: "center", width: 350 },
          Unit: { title: "Đơn vị tính", field: "Unit", hozAlign: "left", headerHozAlign: "center", width: 80 },
          Price: { 
            title: "Giá (VND)", 
            field: "Price", 
            hozAlign: "right", 
            headerHozAlign: "center", 
            width: 120 
          },
          RequestLimit: { title: "Định mức", field: "RequestLimit", hozAlign: "right", headerHozAlign: "center", width: 80 },
          Type: { title: "Loại", field: "Type", hozAlign: "left", headerHozAlign: "center", width: 80 }
        }
      });   
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

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`); // Log
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`); // Log lỗi cụ thể
      }

      // Đọc header từ hàng đầu tiên
      const headerRow = worksheet.getRow(2);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Cập nhật cấu hình cột cho bảng Excel
      const columns = [
        {title: headers[0] || 'STT', field:'STT',hozAlign:'center',headerHozAlign:"center",width:50},
        { title: headers[1] || 'CodeRTC', field: 'CodeRTC', hozAlign: 'left', headerHozAlign: 'center', width: 80 },
        { title: headers[2] || 'CodeNCC', field: 'CodeNCC', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[3] || 'NameRTC', field: 'NameRTC', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
        { title: headers[4] || 'NameNCC', field: 'NameNCC', hozAlign: 'left', headerHozAlign: 'center', width: 350 },
        {
          title: headers[5] || 'Unit', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80
        },
        {
          title: headers[6] || 'Price', field: 'Price', hozAlign: 'right', headerHozAlign: 'center', 
          width: 120,
        },
        { title: headers[7] || 'RequestLimit', field: 'RequestLimit', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[8] || 'Type', field: 'Type', hozAlign: 'left', headerHozAlign: 'center', width: 80 }
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
               CodeRTC: row.getCell(2).value?.toString() || '',
               CodeNCC: row.getCell(3).value?.toString() || '',
               NameRTC: row.getCell(4).value?.toString() || '',
               NameNCC: row.getCell(5).value?.toString() || '',
               Unit: row.getCell(6).value?.toString() || '',
               // Giữ nguyên logic kiểm tra kiểu dữ liệu đã sửa
               Price: typeof row.getCell(7).value === 'number' ? row.getCell(7).value : row.getCell(7).value?.toString() || '',
               RequestLimit: typeof row.getCell(8).value === 'number' ? row.getCell(8).value : row.getCell(8).value?.toString() || '',
               Type: row.getCell(9).value?.toString() || ''
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
      console.log(`Đã đọc ${data.length} dòng dữ liệu không trống từ sheet (hiển thị preview).`);
      console.log(`Tìm thấy ${validRecords} bản ghi hợp lệ (bắt đầu từ STT số).`); // Log rõ ràng hơn

      // Cập nhật hiển thị sau khi đọc dữ liệu xong (0/tổng số dòng)
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
        // Trường hợp này ít xảy ra nếu drawTable được gọi trong ngOnInit
        this.drawtable();     
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet trong readExcelData:', error); // Log chi tiết lỗi
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetExcelImportState(); // Reset trạng thái khi có lỗi
    }
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
                    this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet đã chọn!');
                    this.resetExcelImportState(); // Reset trạng thái khi có lỗi
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }
  }

  saveExcelData() {
    console.log('--- Bắt đầu saveExcelData ---');
    console.log('Tổng số bản ghi cần lưu (trước lọc):', this.dataTableExcel.length);
    console.log('Dữ liệu Excel hiện tại (trước lọc):', this.dataTableExcel);

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      console.log('Không có dữ liệu để lưu.');
      return;
    }

    // Lọc dữ liệu để chỉ lấy các dòng có STT là số để xử lý lưu
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      // Kiểm tra nếu STT là kiểu số hoặc chuỗi có thể chuyển đổi thành số
      return typeof stt === 'number' || (typeof stt === 'string' && !isNaN(parseFloat(stt as string)) && isFinite(parseFloat(stt as string)));
    });

    console.log('Số lượng bản ghi hợp lệ để lưu (sau lọc STT số):', validDataToSave.length);
    console.log('Dữ liệu hợp lệ để lưu:', validDataToSave);

    if (validDataToSave.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
      console.log('Không có dữ liệu hợp lệ (STT là số) để lưu.');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    } 

    // Reset tiến trình cho giai đoạn lưu dữ liệu
    this.processedRowsForSave = 0;
    const totalProductsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalProductsToSave} bản ghi`;
    this.displayProgress = 0;

    // Lấy danh sách mã sản phẩm cần kiểm tra từ dữ liệu đã lọc
    const codesToCheck = validDataToSave.map(item => ({
      CodeRTC: item.CodeRTC,
      CodeNCC: item.CodeNCC
    }));

    console.log('codesToCheck (dữ liệu gửi đi kiểm tra, đã lọc STT số):', codesToCheck);

    // Gọi API để kiểm tra các mã và lấy ID
    this.officesupplyService.checkProductCodes(codesToCheck).subscribe({
      next: (response: any) => {
        console.log('Response từ checkProductCodes API:', response);
        const existingProducts = (response.data && Array.isArray(response.data.existingProducts)) ? response.data.existingProducts : [];
        console.log('existingProducts (sau khi xử lý response):', existingProducts);
        
        // Chuẩn bị dữ liệu để gửi đi lưu
        const processedData = validDataToSave.map((row, index) => {
          const existingProduct = existingProducts.find((p: any) => 
            p.CodeRTC === row.CodeRTC && p.CodeNCC === row.CodeNCC
          );

          const assignedId = existingProduct ? existingProduct.ID : 0;

          return {
            id: assignedId,
            codeRTC: row.CodeRTC || '',
            codeNCC: row.CodeNCC || '',
            nameRTC: row.NameRTC || '',
            nameNCC: row.NameNCC || '',
            SupplyUnitID: this.getUnitIdByName(row.Unit),
            price: Number(row.Price) || 0,
            requestLimit: Number(row.RequestLimit) || null,
            type: row.Type === 'Cá nhân' ? 1 : 2,
            isActive: true
          };
        });

        console.log('processedData (dữ liệu cuối cùng gửi đi lưu, đã lọc STT số):', processedData);

        let successCount = 0;
        let errorCount = 0;
        let completedRequests = 0;

        if (processedData.length === 0) {
          this.notification.info('Thông báo', 'Không có sản phẩm hợp lệ để tiến hành lưu.');
          this.closeExcelModal();
          console.log('Không có sản phẩm nào để lưu sau xử lý map.');
          return;
        }

        // Hàm để xử lý lưu từng sản phẩm với delay
       const saveProductWithDelay = (index: number) => {
  if (index >= processedData.length) {
    console.log('--- Tất cả các request adddata đã hoàn thành ---');
    this.showSaveSummary(successCount, errorCount, totalProductsToSave);
    return;
  }

  const product = processedData[index];
  console.log(`Gửi lưu sản phẩm ${index + 1}/${totalProductsToSave}:`, product);

  setTimeout(() => {
    this.officesupplyService.adddata(product).subscribe({
      next: (response: any) => {
        console.log(`Response từ adddata cho sản phẩm ${index + 1}:`, response);

        if (response.status === 1) {
          successCount++;
        } else {
          errorCount++;

          // Lấy message khi backend trả status != 1
          const msg =
            response.error?.message ||
            response.message ||
            'Lưu thất bại, không có message từ server';

          console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, msg, response);
          // Nếu muốn show từng dòng lỗi:
          // this.notification.error(NOTIFICATION_TITLE.error, `Dòng ${index + 1}: ${msg}`);
        }

        completedRequests++;
        this.processedRowsForSave = completedRequests;
        this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
        this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

        saveProductWithDelay(index + 1);
      },
      error: (err: any /* hoặc HttpErrorResponse */) => {
        errorCount++;

        // Lấy message khi call API lỗi hẳn (4xx/5xx, timeout,...)
        const msg =
          err.error?.message ||
          err.message ||
          'Lỗi kết nối server khi lưu sản phẩm';

        console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, msg, err);

        // Nếu muốn show luôn:
        // this.notification.error(NOTIFICATION_TITLE.error, `Dòng ${index + 1}: ${msg}`);

        completedRequests++;
        this.processedRowsForSave = completedRequests;
        this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
        this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

        saveProductWithDelay(index + 1);
      }
    });
  }, 5);
};

        // Bắt đầu xử lý từ sản phẩm đầu tiên
        saveProductWithDelay(0);
      },
      error: (err) => {
        console.error('Lỗi khi kiểm tra mã sản phẩm từ API:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi kiểm tra mã sản phẩm từ database!');
        this.displayText = 'Lỗi kiểm tra sản phẩm!';
        this.displayProgress = 0;
      }
    });
  }

  // Thêm phương thức hiển thị tóm tắt kết quả lưu
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
    this.closeExcelModal();
    this.getAll(); // Refresh the table
  }

  // Hàm helper để lấy ID của đơn vị tính từ tên
  private getUnitIdByName(unitName: string): number {
    const unit = this.listUnit.find(u => u.Name === unitName);
    return unit ? unit.ID : 0;
  }

  // Hàm mới để reset trạng thái nhập Excel
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
      this.tableExcel.replaceData([]); // Xóa dữ liệu trong Tabulator preview
    }
    console.log('Trạng thái nhập Excel đã được reset.'); // Log
  }

  closeExcelModal() {
    this.modalService.dismissAll('success');
  }

  getAll() {
    this.officesupplyService.getdata(this.searchText).subscribe({
      next: (res) => {
        console.log('Dữ liệu nhận được:', res);
        this.lstVP = res.data.officeSupply;
        
        // Sắp xếp dữ liệu: sản phẩm mới nhất lên đầu, các sản phẩm khác theo thứ tự tăng dần
        if (this.lastAddedIdProduct) {
          const newItem = this.lstVP.find(item => item.ID === this.lastAddedIdProduct);
          if (newItem) {
            // Tách sản phẩm mới ra khỏi danh sách
            this.lstVP = this.lstVP.filter(item => item.ID !== this.lastAddedIdProduct);
            // Sắp xếp các sản phẩm còn lại theo ID tăng dần
            this.lstVP.sort((a, b) => a.ID - b.ID);
            // Thêm sản phẩm mới vào đầu danh sách
            this.lstVP.unshift(newItem);
          }
        } else {
          // Nếu không có sản phẩm mới, sắp xếp tất cả theo ID tăng dần
          this.lstVP.sort((a, b) => a.ID - b.ID);
        }

        // Cập nhật lại dataTable và reload bảng
        this.dataTable = this.lstVP;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi API:', err);
        this.lstVP = [];
        this.dataTable = [];
      },
    });
  }
}
