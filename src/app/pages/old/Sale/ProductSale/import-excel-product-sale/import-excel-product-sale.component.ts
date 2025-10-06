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
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
@Component({
  selector: 'app-import-excel-product-sale',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzProgressModule, NzIconModule, NzButtonModule],
  templateUrl: './import-excel-product-sale.component.html',
  styleUrl: './import-excel-product-sale.component.css'
})
export class ImportExcelProductSaleComponent implements OnInit, AfterViewInit {


  @Input() table: any;
  @Input() lastAddedIdProduct: number | null = null;
  @Input() searchText: string = '';
  @Input() id:number=0;

  wareHouseCode:string="HN";
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  listUnitCount: any[] = [];
  listMaker: any[] = [];
  listProductGroup: any[] = [];
  listLocation: any[] = [];
  

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh

  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService
  ) {}

  ngOnInit(): void {
    this.loadUnitAndMakerData();
  }
  ngAfterViewInit(): void {
    this.drawtable();
  }
  drawtable() {
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
          productGroupName: { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center' },
          ProductCode: { title: 'Mã Sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center' },
          ProductName: { title: 'Tên Sản phẩm', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center' },
          Maker: { title: 'Hãng', field: 'Maker', hozAlign: 'left', headerHozAlign: 'center' },
          Unit: { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center' },
          LoactionName: { title: 'Vị trí', field: 'AddressBox', hozAlign: 'left', headerHozAlign: 'center' },
       
          Note: { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' }
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
      this.notification.warning('Thông báo', 'Bảng chưa được khởi tạo!');
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
        {title: headers[1] || 'ProductGroupName', field:'ProductGroupName',hozAlign:'left',headerHozAlign:"center",width:150},
        {title: headers[2] || 'ProductCode', field:'ProductCode',hozAlign:'left',headerHozAlign:"center",width:120},
        { title: headers[3] || 'ProductName', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
        {title: headers[4] || 'Maker', field:'MakerName',hozAlign:'left',headerHozAlign:"center",width:120},
        { title: headers[5] || 'Unit', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80 },
        { title: headers[6] || 'Location', field: 'LocationName', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
  
        { title: headers[7] || 'Note', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 100 }
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
               STT: firstCell?.toString() || '',
               ProductGroup: row.getCell(2).value?.toString() || '',
               ProductGroupName: row.getCell(2).value?.toString() || '',
               ProductCode: row.getCell(3).value?.toString() || '',
               ProductName: row.getCell(4).value?.toString() || '',
               Maker: row.getCell(5).value?.toString() || '',
               MakerName: row.getCell(5).value?.toString() || '',
               Unit: row.getCell(6).value?.toString() || '',
               AddressBox: row.getCell(7).value?.toString() || '',
               LocationName: row.getCell(7).value?.toString() || '',
        
               Note: row.getCell(9).value?.toString() || ''
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
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
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
                    this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
                    this.resetExcelImportState(); // Reset trạng thái khi có lỗi
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }
  }
  saveExcelData() {

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
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
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
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
      ProductCode: item.ProductCode,
      ProductName: item.ProductName,
    }));

    console.log('codesToCheck (dữ liệu gửi đi kiểm tra, đã lọc STT số):', codesToCheck);

    // Gọi API để kiểm tra các mã và lấy ID
    this.productsaleService.checkProductSaleCodes(codesToCheck).subscribe({
      next: (response: any) => {
        console.log('Response từ checkProductCodes API:', response);
        const existingProducts = (response.data && Array.isArray(response.data.existingProducts)) ? response.data.existingProducts : [];
        console.log('existingProducts (sau khi xử lý response):', existingProducts);
        
        // Chuẩn bị dữ liệu để gửi đi lưu
        const processedData = validDataToSave.map((row) => {
          // Tìm sản phẩm đã tồn tại dựa trên cả ProductCode và ProductName
          const existingProduct = existingProducts.find((p: any) => 
            p.ProductCode === row.ProductCode && p.ProductName === row.ProductName
          );

            // Chuẩn bị đối tượng ProductSale với ID nếu có
        const productSaleData = {
            ID: existingProduct ? existingProduct.ID : 0, // Thêm ID vào đây!
            ProductCode: row.ProductCode || '',
            ProductName: row.ProductName || '',
            ProductGroupID: this.getProductGroupIdByName(row.ProductGroup),
            Maker: row.Maker || '', // Bạn có thể muốn dùng MakerID thay vì MakerName nếu API lưu nhận ID
            Unit: row.Unit || '', // Tương tự, nếu API lưu nhận ID thì dùng UnitID
            NumberInStoreDauky: 0,
            NumberInStoreCuoiKy: 0,
            LocationID: this.getLocationIdByName(row.AddressBox),
            FirmID: this.getFirmIdByName(row.Maker), // Đảm bảo FirmID được tìm đúng
            Note: row.Note || '',
            CreatedBy: 'admin',
            CreatedDate: new Date(),
            UpdatedBy: 'admin',
            UpdatedDate: new Date()
        };

        return [{
            ProductSale: productSaleData, // Truyền đối tượng ProductSale đã có ID
            Inventory: {
              Note: row.Note || '' // Inventory cũng có thể cần ID nếu là cập nhật
            }
          }];
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
            // Đã xử lý xong tất cả sản phẩm
            console.log('--- Tất cả các request savedata đã hoàn thành ---');
            this.showSaveSummary(successCount, errorCount, totalProductsToSave);
            return;
          }

          const product = processedData[index]; // Đây là mảng chứa ProductSale và Inventory
          console.log(`Gửi lưu sản phẩm ${index + 1}/${totalProductsToSave}:`, product);

          // Thêm delay 0,0005 trước khi lưu mỗi sản phẩm
          setTimeout(() => {
            this.productsaleService.saveDataProductSale(product).subscribe({
              next: (response) => {
                console.log(`Response từ adddata cho sản phẩm ${index + 1}:`, response);
                if (response.status === 1) {
                  successCount++;
                } else {
                  errorCount++;
                  console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, response.message);
                }

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

                // Xử lý sản phẩm tiếp theo
                saveProductWithDelay(index + 1);
              },
              error: (err) => {
                errorCount++;
                console.error(`Lỗi khi lưu sản phẩm ${index + 1}:`, err);

                completedRequests++;
                this.processedRowsForSave = completedRequests;
                this.displayProgress = Math.round((completedRequests / totalProductsToSave) * 100);
                this.displayText = `Đang lưu: ${completedRequests}/${totalProductsToSave} bản ghi`;

                // Xử lý sản phẩm tiếp theo
                saveProductWithDelay(index + 1);
              }
            });
          }, 5); // Delay 0,0005s
        };

        // Bắt đầu xử lý từ sản phẩm đầu tiên
        saveProductWithDelay(0);
      },
      error: (err) => {
        console.error('Lỗi khi kiểm tra mã sản phẩm từ API:', err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi kiểm tra mã sản phẩm từ database!');
        this.displayText = 'Lỗi kiểm tra sản phẩm!';
        this.displayProgress = 0;
      }
    });
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
    this.closeExcelModal();
  }
  // Hàm helper để lấy ID của đơn vị tính từ tên
  private getUnitIdByName(unitName: string): number {
    const unit = this.listUnitCount.find(u => u.UnitName === unitName);
    return unit ? unit.ID : 0;
  }

  // Hàm helper để lấy ID của hãng từ tên
  private getFirmIdByName(firmName: string): number {
    const firm = this.listMaker.find(f => f.MakerName === firmName);
    console.log('Kết quả tìm kiếm:', firm);
    return firm ? firm.ID : 0;
  }

  // Hàm helper để lấy ID của ProductGroup từ tên
  private getProductGroupIdByName(groupName: string): number {
    const group = this.listProductGroup.find(g => g.ProductGroupName === groupName);
    return group ? group.ID : 0;
  }

  // Hàm helper để lấy ID của Location từ tên
  private getLocationIdByName(locationName: string): number {
    const location = this.listLocation.find(l => l.LocationName === locationName);
    return location ? location.ID : 0;
  }

  // Hàm để lấy danh sách đơn vị, ProductGroup và Location
  private loadUnitAndMakerData() {
    this.productsaleService.getdataUnitCount().subscribe({
      next: (res: any) => {
        this.listUnitCount = res.data || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách đơn vị:', err);
      }
    });

    this.productsaleService.getdataProductGroup(this.wareHouseCode,false).subscribe({
      next: (res: any) => {
        this.listProductGroup = res.data || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách nhóm sản phẩm:', err);
      }
    });

    this.productsaleService.getDataLocation(0).subscribe({
      next: (res: any) => {
        this.listLocation = res.data || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách vị trí:', err);
      }
    });

    this.productsaleService.getDataFirm().subscribe({
      next: (res: any) => {
        this.listMaker = res.data || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy danh sách hãng:', err);
      }
    });
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
    this.modalService.dismissAll(true);
  }
}
