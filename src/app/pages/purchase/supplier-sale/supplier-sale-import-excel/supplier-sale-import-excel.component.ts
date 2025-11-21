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
import { from } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { SupplierSaleService } from '../supplier-sale.service';

@Component({
  selector: 'app-supplier-sale-import-excel',
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzProgressModule,
  ],
  templateUrl: './supplier-sale-import-excel.component.html',
  styleUrl: './supplier-sale-import-excel.component.css'
})

export class SupplierSaleImportExcelComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến 
  constructor(
    private supplierSaleService: SupplierSaleService,
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
  companies: any[] = [];
  isSave: any = false;

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;
  //#endregion

  //#region Hàm format
  formatProgressText = (percent: number): string => {
    return this.displayText;
  }
  //#endregion

  //#region Hàm chạy khi mở chương trính
  ngOnInit(): void {
    this.getTaxCompany();
  }

  ngAfterViewInit(): void {
    this.drawTbExcel(this.tb_excelContainer.nativeElement);
  }
  //#endregion

  //#region Đọc file
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
  //#endregion

  //#region Reset excel
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
  //#endregion

  //#region Đọc dữ liệu excel
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
          const isEmptyRow = !firstCell;

          if (!isEmptyRow) {
            const rowData: any = {
              NgayUpdate: row.getCell(1).value?.toString().trim() || '',
              NVPhuTrach: row.getCell(2).value?.toString().trim() || '',
              LoaiHangHoa: row.getCell(3).value?.toString().trim() || '',
              Brand: row.getCell(4).value?.toString().trim() || '',
              MaNhom: row.getCell(5).value?.toString().trim() || '',
              CodeNCC: row.getCell(6).value?.toString().trim() || '',
              NameNCC: row.getCell(7).value?.toString().trim() || '',
              TenTiengAnh: row.getCell(8).value?.toString().trim() || '',
              AddressNCC: row.getCell(9).value?.toString().trim() || '',
              MaSoThue: row.getCell(10).value?.toString().trim() || '',
              Website: row.getCell(11).value?.toString().trim() || '',
              Debt: row.getCell(11).value?.toString().trim() || '',
              SoTK: row.getCell(13).value?.toString().trim() || '',
              NganHang: row.getCell(14).value?.toString().trim() || '',
              CompanyText: row.getCell(15).value?.toString().trim() || '',
              ShortNameSupplier: row.getCell(16).value?.toString().trim() || '',
              PhoneNCC: row.getCell(17).value?.toString().trim() || '',
              OrderNCC: row.getCell(18).value?.toString().trim() || '',
              Email: row.getCell(19).value?.toString().trim() || '',
              Note: row.getCell(20).value?.toString().trim() || ''
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
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể đọc dữ liệu từ sheet!');
      this.resetExcelImportState();
    }
  }
  //#endregion

  //#region Chuyển tab
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
  //#endregion

  //#region Sự kiện khác
  getTaxCompany() {
    this.supplierSaleService.getTaxCompany().subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.companies = data.data.map((item: any) => ({
            title: item.Name,
            value: item.ID
          }));
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có dữ liệu liên hệ nào được tìm thấy.'
          );
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
      }
    });
  }
  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }
  //#endregion

  //#region Lưu sự liệu
  saveExcelData() {
    this.isSave = true;

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
      return;
    }

    // Khởi tạo progress
    this.processedRowsForSave = 0;
    const totalToSave = this.dataTableExcel.length;
    this.displayText = `Đang lưu: ${totalToSave} bản ghi`;
    this.displayProgress = 0;

    // Gọi service lưu dữ liệu
    from(this.dataTableExcel).pipe(
      concatMap((row: any) => {
        const companyObj = this.companies.find(c => c.title === row.CompanyText);
        const companyID = companyObj ? companyObj.value : null;
        const payload = {
          ...row,
          Company: companyID,
          NgayUpdate: row.NgayUpdate ? DateTime.fromJSDate(new Date(row.NgayUpdate)).toISODate() : null
        };

        Object.keys(payload).forEach(key => {
          if (typeof payload[key] === 'string') {
            payload[key] = payload[key].trim();
          }
        });

        // Tăng progress
        this.processedRowsForSave++;
        this.displayProgress = this.processedRowsForSave;

        return this.supplierSaleService.saveSupplierSale(payload);
      })
    ).subscribe({
      next: res => {
      },
      error: err => {
        this.notification.error(NOTIFICATION_TITLE.error, err.error.message);
        this.isSave = false;
      },
      complete: () => {
        // Khi tất cả API xong mới reset
        this.processedRowsForSave = 0;
        this.displayProgress = 0;
        this.displayText = `0/0`;
        this.notification.success(NOTIFICATION_TITLE.success, "Lưu dữ liệu thành công!");
        this.isSave = false;
        this.activeModal.dismiss();
      }
    });


  }
  //#endregion

  //#region Vẽ bảng
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
          title: 'Ngày update', field: 'NgayUpdate', width: 100, hozAlign: 'center',
          formatter: function (cell) {
            const raw = cell.getValue();
            if (!raw) return "";

            const dateObj = new Date(raw);

            const date = DateTime.fromJSDate(dateObj);

            return date.isValid ? date.toFormat('dd/MM/yyyy') : String(raw);
          }, headerSort: false, headerWordWrap: true
        },
        { title: 'Công ty nhập', field: 'CompanyText', width: 150, hozAlign: 'center', headerSort: false, headerWordWrap: true, formatter: 'textarea' },
        { title: 'Mã NCC', field: 'CodeNCC', width: 150, headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Tên viết tắt', field: 'ShortNameSupplier', width: 150, headerWordWrap: true, formatter: 'textarea', headerSort: false, },
        { title: 'Tên NCC', field: 'NameNCC', width: 250, headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Tên tiếng Anh', field: 'TenTiengAnh', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Hãng/Brand', field: 'Brand', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Mã nhóm', field: 'MaNhom', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Địa chỉ', field: 'AddressNCC', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'NV phụ trách', field: 'NVPhuTrach', width: 100, headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Loại hàng hóa', field: 'LoaiHangHoa', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Mã số thuế', field: 'MaSoThue', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Website', field: 'Website', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Công nợ', field: 'Debt', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Số TK', field: 'SoTK', width: 300, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Điện thoại', field: 'PhoneNCC', width: 100, hozAlign: 'center', headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Người đặt hàng', field: 'OrderNCC', width: 200, headerWordWrap: true, formatter: 'textarea', headerSort: false },
        { title: 'Ghi chú', field: 'Note', width: 100, headerWordWrap: true, formatter: 'textarea', headerSort: false },
      ]
    });

    this.tb_excel.on("pageLoaded", () => {
      this.tb_excel.redraw();
    });
  }
  //#endregion
}
