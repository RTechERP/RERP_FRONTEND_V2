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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PokhHistoryServiceService } from '../pokh-history-service/pokh-history-service.service';

@Component({
  selector: 'app-import-excel',
  standalone: true,
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
  dataTableExcel: any[] = [];
  
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB
  selectedFile: File | null = null;

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private pokhHistoryService: PokhHistoryServiceService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    
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
        this.selectedFile = file;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        console.log('File đã chọn:', file.name);
        console.log('Phần mở rộng:', fileExtension);

        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            this.notification.warning('Thông báo', 'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!');
            input.value = '';
            this.resetExcelImportState();
            return;
        }

        this.filePath = file.name;
        this.excelSheets = [];
        this.selectedSheet = '';
        this.dataTableExcel = [];
        this.totalRowsAfterFileRead = 0;
        this.processedRowsForSave = 0;

        this.displayProgress = 0;
        this.displayText = 'Đang đọc file...'; 
        console.log('Progress bar state set to: Đang đọc file...');

        const reader = new FileReader();

        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                this.displayProgress = Math.round((event.loaded / event.total) * 100);
                this.displayText = `Đang tải file: ${this.displayProgress}%`;
            }
        };

        let startTime = Date.now();

        reader.onload = async (e: any) => {
            const data = e.target.result;
            try {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(data);
                console.log('Workbook đã được tải bởi ExcelJS.');

                this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
                console.log('Danh sách sheets tìm thấy:', this.excelSheets);

                if (this.excelSheets.length > 0) {
                    this.selectedSheet = this.excelSheets[0];
                    console.log('Sheet mặc định được chọn:', this.selectedSheet);
                    await this.readExcelData(workbook, this.selectedSheet);
                    
                    const elapsedTime = Date.now() - startTime;
                    const minDisplayTime = 500;

                    if (elapsedTime < minDisplayTime) {
                        setTimeout(() => {
                            this.displayProgress = 0;
                            if (this.totalRowsAfterFileRead === 0) {
                                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                            } else {
                                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                            }
                            console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật (sau delay).');
                        }, minDisplayTime - elapsedTime);
                    } else {
                        this.displayProgress = 0;
                        if (this.totalRowsAfterFileRead === 0) {
                            this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                        } else {
                            this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                        }
                        console.log('Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật.');
                    }

                } else {
                    console.warn('File Excel không chứa bất kỳ sheet nào.');
                    this.notification.warning('Thông báo', 'File Excel không có sheet nào!');
                    this.resetExcelImportState();
                }
            } catch (error) {
                console.error('Lỗi khi đọc tệp Excel trong FileReader.onload:', error);
                this.notification.error('Thông báo', 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
                this.resetExcelImportState();
            }
            input.value = '';
        };
        reader.readAsArrayBuffer(file);
    }
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`);
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`);
      }

      // Đọc header từ hàng đầu tiên
      const headerRow = worksheet.getRow(2);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Cập nhật cấu hình cột cho bảng Excel theo model POKHHistory
      const columns = [
        { title: headers[0] || 'CustomerCode', field: 'CustomerCode', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        { title: headers[1] || 'IndexCode', field: 'IndexCode', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[2] || 'PONumber', field: 'PONumber', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        { title: headers[3] || 'PODate', field: 'PODate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[4] || 'ProductCode', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        { title: headers[5] || 'Model', field: 'Model', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[6] || 'Quantity', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[7] || 'QuantityDeliver', field: 'QuantityDeliver', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[8] || 'QuantityPending', field: 'QuantityPending', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[9] || 'Unit', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80 },
        { title: headers[10] || 'NetPrice', field: 'NetPrice', hozAlign: 'right', headerHozAlign: 'center', width: 100 },
        { title: headers[11] || 'UnitPrice', field: 'UnitPrice', hozAlign: 'right', headerHozAlign: 'center', width: 100 },
        { title: headers[12] || 'TotalPrice', field: 'TotalPrice', hozAlign: 'right', headerHozAlign: 'center', width: 120 },
        { title: headers[13] || 'VAT', field: 'VAT', hozAlign: 'right', headerHozAlign: 'center', width: 80 },
        { title: headers[14] || 'TotalPriceVAT', field: 'TotalPriceVAT', hozAlign: 'right', headerHozAlign: 'center', width: 120 },
        { title: headers[15] || 'COM', field: 'COM', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[16] || 'DeliverDate', field: 'DeliverDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[17] || 'PaymentDate', field: 'PaymentDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[18] || 'ThanhToanDK', field: 'ThanhToanDK', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[19] || 'BillDate', field: 'BillDate', hozAlign: 'center', headerHozAlign: 'center', width: 100 },
        { title: headers[20] || 'Pur', field: 'Pur', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        { title: headers[21] || 'BillNumber', field: 'BillNumber', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[22] || 'Dept', field: 'Dept', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[23] || 'Sale', field: 'Sale', hozAlign: 'left', headerHozAlign: 'center', width: 100 },
        { title: headers[24] || 'POTypeCode', field: 'POTypeCode', hozAlign: 'left', headerHozAlign: 'center', width: 80 }
      ];

      // Cập nhật cấu hình cột cho bảng Excel
      if (this.tableExcel) {
        this.tableExcel.setColumns(columns);
      }

      const data: any[] = [];
      let validRecords = 0;
      let foundFirstDataRow = false;

      // Đọc dữ liệu từ hàng thứ 2 trở đi
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          //Debug
          let rowValues = [];
          for (let i = 1; i <= 24; i++) {
            rowValues.push(row.getCell(i).value);
          }
          console.log('Row:', rowNumber, rowValues);
          //
          const rowData: any = {
            CustomerCode: row.getCell(1).value?.toString() || '',
            IndexCode: row.getCell(2).value?.toString() || '',
            PONumber: row.getCell(3).value?.toString() || '',
            PODate: this.formatDate(row.getCell(4).value),
            ProductCode: row.getCell(5).value?.toString() || '',
            Model: row.getCell(6).value?.toString() || '',
            Quantity: typeof row.getCell(7).value === 'number' ? row.getCell(7).value : parseFloat(row.getCell(7).value?.toString() || '0'),
            QuantityDeliver: typeof row.getCell(8).value === 'number' ? row.getCell(8).value : parseFloat(row.getCell(8).value?.toString() || '0'),
            QuantityPending: typeof row.getCell(9).value === 'number' ? row.getCell(9).value : parseFloat(row.getCell(9).value?.toString() || '0'),
            Unit: row.getCell(10).value?.toString() || '',
            NetPrice: typeof row.getCell(11).value === 'number' ? row.getCell(11).value : parseFloat(row.getCell(11).value?.toString() || '0'),
            UnitPrice: typeof row.getCell(12).value === 'number' ? row.getCell(12).value : parseFloat(row.getCell(12).value?.toString() || '0'),
            TotalPrice: typeof row.getCell(13).value === 'number' ? row.getCell(13).value : parseFloat(row.getCell(13).value?.toString() || '0'),
            VAT: typeof row.getCell(14).value === 'number' ? row.getCell(14).value : parseFloat(row.getCell(14).value?.toString() || '0'),
            //com
            TotalPriceVAT: typeof row.getCell(16).value === 'number' ? row.getCell(15).value : parseFloat(row.getCell(15).value?.toString() || '0'),
            DeliverDate: this.formatDate(row.getCell(17).value),
            PaymentDate: this.formatDate(row.getCell(18).value),
            //Thanh toán DK 
            BillDate: this.formatDate(row.getCell(20).value),
            Pur: row.getCell(21).value?.toString() || '',
            BillNumber: row.getCell(22).value?.toString() || '',
            Dept: row.getCell(23).value?.toString() || '',
            Sale: row.getCell(24).value?.toString() || '',
            POTypeCode: row.getCell(25).value?.toString() || ''
          };
          data.push(rowData);
        }
      });

      this.dataTableExcel = data;
      this.totalRowsAfterFileRead = validRecords;
      console.log(`Đã đọc ${data.length} dòng dữ liệu không trống từ sheet (hiển thị preview).`);
      console.log(`Tìm thấy ${validRecords} bản ghi hợp lệ (bắt đầu từ STT số).`);

      this.displayProgress = 0; 
      if (this.totalRowsAfterFileRead === 0) {
        this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
      } else {
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      }
      
      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        this.drawtable();     
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet trong readExcelData:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetExcelImportState();
    }
  }

  // Hàm helper để format ngày tháng
  private formatDate(value: any): string {
    if (!value) return '';

    let date: Date | null = null;

    if (value instanceof Date) {
      if (isNaN(value.getTime())) return '';
      date = value;
    } else if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) date = d;
    } else if (typeof value === 'number') {
      const d = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) date = d;
    }

    if (!date) return '';

    // Format dd/MM/yy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
  }

  onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = e.target.result;
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          await this.readExcelData(workbook, this.selectedSheet);
          this.displayProgress = 0;
          console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.');
        } catch (error) {
          console.error('Lỗi khi đọc tệp Excel khi thay đổi sheet:', error);
          this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
          this.resetExcelImportState();
        }
      };
      reader.readAsArrayBuffer(this.selectedFile);
    }
  }

  saveExcelData() {
    console.log('--- Bắt đầu saveExcelData ---');
    console.log('Tổng số bản ghi cần lưu (trước lọc):', this.dataTableExcel.length);
    console.log('Dữ liệu Excel hiện tại (trước lọc):', this.dataTableExcel);

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      console.log('Không có dữ liệu để lưu.');
      return;
    }

    // Lọc dữ liệu để chỉ lấy các dòng có STT là số để xử lý lưu
    const validDataToSave = this.dataTableExcel;

    console.log('Số lượng bản ghi hợp lệ để lưu (sau lọc STT số):', validDataToSave.length);
    console.log('Dữ liệu hợp lệ để lưu:', validDataToSave);

    // Reset tiến trình cho giai đoạn lưu dữ liệu
    this.processedRowsForSave = 0;
    const totalRecordsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalRecordsToSave} bản ghi`;
    this.displayProgress = 0;

    // Chuẩn bị dữ liệu để gửi đi lưu theo model POKHHistory
    const processedData = validDataToSave.map((row) => {
      return {
        customerCode: row.CustomerCode || '',
        indexCode: row.IndexCode || '',
        poNumber: row.PONumber || '',
        poDate: row.PODate ? new Date(row.PODate) : null,
        productCode: row.ProductCode || '',
        model: row.Model || '',
        quantity: Number(row.Quantity) || 0,
        quantityDeliver: Number(row.QuantityDeliver) || 0,
        quantityPending: Number(row.QuantityPending) || 0,
        unit: row.Unit || '',
        netPrice: Number(row.NetPrice) || 0,
        unitPrice: Number(row.UnitPrice) || 0,
        totalPrice: Number(row.TotalPrice) || 0,
        vat: Number(row.VAT) || 0,
        totalPriceVAT: Number(row.TotalPriceVAT) || 0,
        deliverDate: row.DeliverDate ? new Date(row.DeliverDate) : null,
        paymentDate: row.PaymentDate ? new Date(row.PaymentDate) : null,
        billDate: row.BillDate ? new Date(row.BillDate) : null,
        billNumber: row.BillNumber || '',
        dept: row.Dept || '',
        sale: row.Sale || '',
        pur: row.Pur || '',
        poTypeCode: this.selectedSheet || ''
      };
    });

    if (processedData.length === 0) {
      this.notification.info('Thông báo', 'Không có bản ghi hợp lệ để tiến hành lưu.');
      this.closeExcelModal();
      console.log('Không có bản ghi nào để lưu sau xử lý map.');
      return;
    }

    // Khi bắt đầu gửi
    this.displayText = `Đang lưu ${processedData.length} bản ghi...`;
    this.displayProgress = 50;

    // Gửi toàn bộ mảng processedData về API một lần
    this.pokhHistoryService.save(processedData).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.displayText = `Đã lưu ${processedData.length} bản ghi thành công`;
          this.displayProgress = 100;
          this.notification.success('Thông báo', `Đã lưu ${processedData.length} bản ghi thành công`);
        } else {
          this.displayText = 'Lưu thất bại!';
          this.displayProgress = 0;
          this.notification.error('Thông báo', response.message || 'Lưu thất bại!');
        }
        this.closeExcelModal();
      },
      error: (err: any) => {
        this.displayText = 'Có lỗi khi lưu!';
        this.displayProgress = 0;
        this.notification.error('Thông báo', 'Có lỗi khi lưu dữ liệu!');
        this.closeExcelModal();
      }
    });
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
    this.selectedFile = null;
    
    if (this.tableExcel) {
      this.tableExcel.replaceData([]);
    }
    console.log('Trạng thái nhập Excel đã được reset.');
  }

  closeExcelModal() {
    this.activeModal.close();
  }
}
