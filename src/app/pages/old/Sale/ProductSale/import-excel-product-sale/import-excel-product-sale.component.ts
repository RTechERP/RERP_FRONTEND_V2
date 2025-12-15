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
import { HttpClient } from '@angular/common/http';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { environment } from '../../../../../../environments/environment';
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
  @Input() id: number = 0;

  wareHouseCode: string = "HN";
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

  // Chặn đóng modal khi đang xử lý
  isReadingFile: boolean = false;
  isSavingData: boolean = false;
  get isBusy(): boolean { return this.isReadingFile || this.isSavingData; }

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService,
    private http: HttpClient
  ) { }

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
        autoColumns: true,
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
        // Tự động tạo cột dựa trên dữ liệu
        autoColumnsDefinitions: {
          STT: { title: "STT", field: "STT", hozAlign: "center", headerHozAlign: "center", width: 50, editor: "input" },
          ProductGroupNo: { title: 'Mã nhóm', field: 'ProductGroupNo', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          productGroupName: { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          ProductCode: { title: 'Mã Sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          ProductName: { title: 'Tên Sản phẩm', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          Maker: { title: 'Hãng', field: 'Maker', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          Unit: { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },
          LoactionName: { title: 'Vị trí', field: 'AddressBox', hozAlign: 'left', headerHozAlign: 'center', editor: "input" },

          Note: { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', editor: "input" }
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
  private normalizeHeader(raw: any): string {
      const s = (raw ?? '').toString().trim().toLowerCase();
      return s
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')  // chuyển 'đ' -> 'd' để khớp các synonym như 'dvt', 'don vi'
          .replace(/\s+/g, ' ');
  }

  private headerSynonymsMap: Record<string, string> = {
      'stt': 'STT', 'so thu tu': 'STT', 'thu tu': 'STT',
      'productgroupno': 'ProductGroupNo', 'ma nhom': 'ProductGroupNo', 'mn': 'ProductGroupNo',
      'productgroupname': 'ProductGroupName', 'nhom': 'ProductGroupName', 'ten nhom': 'ProductGroupName', 'loai nhom': 'ProductGroupName',
      'productcode': 'ProductCode', 'ma san pham': 'ProductCode', 'ma sp': 'ProductCode', 'msp': 'ProductCode',
      'productname': 'ProductName', 'ten san pham': 'ProductName', 'ten sp': 'ProductName',
      'maker': 'Maker', 'hang': 'Maker', 'hang san xuat': 'Maker',
      'unit': 'Unit', 'don vi': 'Unit', 'dvt': 'Unit', 'ĐVT': 'Unit', 'DVT': 'Unit',
      'addressbox': 'AddressBox', 'vi tri': 'AddressBox', 'location': 'AddressBox', 'address': 'AddressBox',
      'note': 'Note', 'ghi chu': 'Note'
  };

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
      try {
          const worksheet = workbook.getWorksheet(sheetName);
          if (!worksheet) {
              throw new Error(`Sheet "${sheetName}" không tồn tại.`);
          }

          const headerRow = worksheet.getRow(1);
          const columnFieldMap: Record<number, string> = {};

          headerRow.eachCell((cell, colNumber) => {
              const norm = this.normalizeHeader(cell.value);
              const mapped = this.headerSynonymsMap[norm];
              if (mapped) {
                  columnFieldMap[colNumber] = mapped;
              }
          });

          if (!columnFieldMap[1]) {
              columnFieldMap[1] = 'STT';
          }

          const columns = [
              { title: 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: "center", width: 50, editor: "input" },
              { title: 'Mã nhóm', field: 'ProductGroupNo', hozAlign: 'left', headerHozAlign: "center", width: 100, editor: "input" },
              { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: "center", width: 150, editor: "input" },
              { title: 'Mã Sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: "center", width: 120, editor: "input" },
              { title: 'Tên Sản phẩm', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center', width: 200, editor: "input" },
              { title: 'Hãng', field: 'Maker', hozAlign: 'left', headerHozAlign: "center", width: 120, editor: "input" },
              { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center', width: 80, editor: "input" },
              { title: 'Vị trí', field: 'AddressBox', hozAlign: 'left', headerHozAlign: 'center', width: 150, editor: "input" },
              { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 120, editor: "input" }
          ];

          if (this.tableExcel) {
              this.tableExcel.setColumns(columns);
          }

          const data: any[] = [];
          let validRecords = 0;

          for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
              const row = worksheet.getRow(rowNumber);
              const rowData: any = {
                  STT: '',
                  ProductGroupNo: '',
                  ProductGroupName: '',
                  ProductGroup: '',
                  ProductCode: '',
                  ProductName: '',
                  Maker: '',
                  Unit: '',
                  AddressBox: '',
                  Note: ''
              };

              row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
                  const field = columnFieldMap[colIndex];
                  if (!field) return;

                  const raw = cell.value;
                  let value = '';
                  if (raw === null || raw === undefined) {
                      value = '';
                  } else if (typeof raw === 'object' && (raw as any).richText) {
                      value = (raw as any).richText.map((t: any) => t.text).join('');
                  } else if (typeof (raw as any).text !== 'undefined') {
                      value = String((raw as any).text).trim();
                  } else {
                      value = String(raw).trim();
                  }

                  rowData[field] = value;
              });

              if (!rowData.STT) {
                  const sttCell = row.getCell(1).value;
                  rowData.STT = sttCell ? String(sttCell).trim() : String(data.length + 1);
              }

              if (!rowData.ProductGroup && rowData.ProductGroupName) {
                  rowData.ProductGroup = rowData.ProductGroupName;
              }

              const hasCode = !!(rowData.ProductCode && String(rowData.ProductCode).trim().length > 0);
              const hasName = !!(rowData.ProductName && String(rowData.ProductName).trim().length > 0);
              const isEmptyRow = !hasCode && !hasName;

              if (!isEmptyRow) {
                  data.push(rowData);
                  if (hasCode && hasName) {
                      validRecords++;
                  }
              }
          }

          this.dataTableExcel = data;
          this.totalRowsAfterFileRead = validRecords;

          this.displayProgress = 0;
          this.displayText = this.totalRowsAfterFileRead === 0
              ? 'Không có dữ liệu hợp lệ trong sheet.'
              : `0/${this.totalRowsAfterFileRead} bản ghi`;

          if (this.tableExcel) {
              this.tableExcel.replaceData(this.dataTableExcel);
          } else {
              this.drawtable();
          }
      } catch (error) {
          this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
          this.resetExcelImportState();
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
  downloadTemplate() {
      const url = environment.host + 'api/share/software/Template/ExportExcel/DanhSachVatTuKhoSaleMau.xlsx';
      this.http.get(url, { responseType: 'blob' }).subscribe({
          next: (blob: Blob) => {
              const downloadUrl = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = 'DanhSachVatTuKhoSaleMau.xlsx';
              a.click();
              window.URL.revokeObjectURL(downloadUrl);
          },
          error: (err) => {
              console.error('Lỗi tải template Excel:', err);
              this.notification.error('Thông báo', 'Không thể tải file template. Vui lòng thử lại!');
          }
      });
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

      // Map dữ liệu để truyền tên thay vì ID - backend sẽ tự tìm và update
      // Backend nhận ProductSaleImportExcelDTO với các trường: ProductGroupNo, ProductGroupName, FirmName, UnitName, LocationName
      const processedData = validDataToSave.map((row) => {
        // Lấy ProductGroupNo từ row
        const productGroupNo = row.ProductGroupNo || '';
        
        // Lấy ProductGroupName từ row (có thể là ProductGroup hoặc ProductGroupName)
        const productGroupName = row.ProductGroupName || row.ProductGroup || '';
        
        // Lấy FirmName từ row.Maker
        const firmName = row.Maker || '';
        
        // Lấy UnitName từ row.Unit
        const unitName = row.Unit || '';
        
        // Lấy LocationName từ row.AddressBox
        const locationName = row.AddressBox || '';

        // Tạo object ProductSaleImportExcelDTO với các trường tên thay vì ID
        const productSaleImportDTO = {
          ProductCode: row.ProductCode || '',
          ProductName: row.ProductName || '',
          ProductGroupNo: productGroupNo,      // Mã nhóm
          ProductGroupName: productGroupName,  // Tên nhóm - backend sẽ tự tìm ProductGroupID
          FirmName: firmName,                  // Tên hãng - backend sẽ tự tìm FirmID
          UnitName: unitName,                  // Tên đơn vị - backend sẽ tự tìm Unit
          LocationName: locationName,          // Tên vị trí - backend sẽ tự tìm LocationID
          Note: row.Note || ''
        };

        return productSaleImportDTO;
      });

      console.log('Dữ liệu gửi đi (đã map tên thay vì ID):', processedData);

      // Gọi BULK API và hiển thị đúng message trả về từ backend
      this.isSavingData = true;
      this.productsaleService.saveDataProductSaleExcel(processedData).subscribe({
        next: (res: any) => {
          const successCount = res?.data?.successCount ?? 0;
          const failCount = res?.data?.failCount ?? 0;
          const duplicateCodes: string[] = res?.data?.duplicateCodes ?? [];
          const msgFromApi: string = res?.message || `Lưu thành công ${successCount} bản ghi, thất bại ${failCount} bản ghi.` +
            (duplicateCodes.length ? ` Các mã trùng bị bỏ qua: ${duplicateCodes.join(', ')}.` : '');

          this.displayProgress = 100;
          this.displayText = `${successCount}/${processedData.length} bản ghi`;

          if (failCount > 0 || duplicateCodes.length > 0) {
            this.notification.warning('Thông báo', msgFromApi);
          } else {
            this.notification.success('Thông báo', msgFromApi);
          }
          this.isSavingData = false;
          this.closeExcelModal();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu.';
          this.notification.error('Thông báo', msg);
          this.isSavingData = false;
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

            this.productsaleService.getdataProductGroup(this.wareHouseCode, false).subscribe({
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
            // Chặn đóng khi đang đọc/lưu
            if (this.isBusy) {
              this.notification.warning('Thông báo', 'Đang nhập dữ liệu, vui lòng đợi hoàn tất!');
              return;
            }
            this.modalService.dismissAll(true);
          }
      }