import { NzNotificationService } from 'ng-zorro-antd/notification'
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit
} from '@angular/core';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { NzUploadFile } from 'ng-zorro-antd/upload';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { log } from 'ng-zorro-antd/core/logger';
import { NzFormModule } from 'ng-zorro-antd/form';
export const SERVER_PATH = `D:\RTC_Sw\RTC\ProductRTC`;
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
function formatDate(value: any): string | null {
  if (!value) return null;
  // Cố gắng parse theo định dạng dd/M/yyyy hoặc dd/MM/yyyy
  const date = DateTime.fromFormat(value.trim(), 'd/M/yyyy');
  return date.isValid ? date.toISODate() : null;
}
@Component({
  standalone: true,
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
  selector: 'app-tb-product-rtc-import-excel',
  templateUrl: './tb-product-rtc-import-excel.component.html',
  styleUrls: ['./tb-product-rtc-import-excel.component.css']
})
export class TbProductRtcImportExcelComponent implements OnInit {
  @Input() table: any;
  @Input() lastAddedIdProduct: number | null = null;
  @Input() searchText: string = '';
  @Input() id: number = 0;
  emPloyeeLists: any[] = [];
  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  listUnitCount: any[] = [];
  listMaker: any[] = [];
  listSourceAsset: any[] = [];
  listTypeAsset: any[] = [];
    unitData: any[] = [];
  firmData: any[] = [];
  productData: any[] = [];
  locationData: any[] = [];
    productGroupData: any[] = [];
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;
  constructor(private notification: NzNotificationService,
    private modalService: NgbModal,
    private unitService: UnitService,
    private tbProductRtcService: TbProductRtcService,
    private tsAssetManagementPersonalService: TsAssetManagementPersonalService,
  ) { }

  ngOnInit() {
    this.load();
   
  }
  drawTable() {
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel || [],
        layout: 'fitDataFill',
        height: '650px',
        pagination: true,
        paginationSize: 50,
        selectableRows: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true,
        autoColumnsDefinitions: {
          ID: { title: "ID", field: "ID" },
          ProductCode: { title: "Mã sản phẩm", field: "ProductCode" },
          ProductName: { title: "Tên sản phẩm", field: "ProductName" },
          ProductGroupName: { title: "ProductGroupName", field: "ProductGroupName", visible: false },
          ProductCodeRTC: { title: "Code RTC", field: "ProductCodeRTC" },
          LocationName: { title: "Vị trí", field: "LocationName" },
          FirmName: { title: "FirmName", field: "FirmName" },
          Serial: { title: "Serial", field: "Serial" },
          SerialNumber: { title: "Serial Number", field: "SerialNumber" },
          PartNumber: { title: "Part Number", field: "PartNumber" },
          UnitName: { title: "UnitName", field: "UnitName" },
          Number: { title: "Số lượng", field: "Number" },
          NumberInStore: { title: "SL tồn kho", field: "NumberInStore" },
          SLKiemKe: { title: "SL kiểm kê", field: "SLKiemKe" },
          BorrowCustomer: { title: "Mượn KH?", field: "BorrowCustomer", formatter: "tickCross" },
          StatusProduct: { title: "Đã sử dụng?", field: "StatusProduct", formatter: "tickCross" },
          Note: { title: "Ghi chú", field: "Note" },
          CreatedBy: { title: "Người tạo", field: "CreatedBy" },
          CreateDate: {
            title: "Ngày tạo",
            field: "CreateDate",
            formatter: "datetime",
            formatterParams: { outputFormat: "DD/MM/YYYY HH:mm" }
          },
          LensMount: { title: "Lens Mount", field: "LensMount" },
          FocalLength: { title: "Focal Length", field: "FocalLength" },
          MOD: { title: "MOD", field: "MOD" },
          Magnification: { title: "Hệ số phóng đại", field: "Magnification" },
          SensorSize: { title: "Sensor Size", field: "SensorSize" },
          SensorSizeMax: { title: "Sensor Size Max", field: "SensorSizeMax" },
          Resolution: { title: "Độ phân giải", field: "Resolution" },
          ShutterMode: { title: "Shutter Mode", field: "ShutterMode" },
          MonoColor: { title: "Mono/Color", field: "MonoColor" },
          PixelSize: { title: "Pixel Size", field: "PixelSize" },
          LampType: { title: "Loại đèn", field: "LampType" },
          LampPower: { title: "Công suất đèn", field: "LampPower" },
          LampWattage: { title: "Công suất đèn (W)", field: "LampWattage" },
          LampColor: { title: "Màu đèn", field: "LampColor" },
          DataInterface: { title: "Data Interface", field: "DataInterface" },
          InputValue: { title: "Input Value", field: "InputValue" },
          OutputValue: { title: "Output Value", field: "OutputValue" },
          CurrentIntensityMax: { title: "Cường độ dòng tối đa", field: "CurrentIntensityMax" },
          Size: { title: "Kích thước", field: "Size" },
          LocationImg: { title: "Ảnh vị trí", field: "LocationImg" },
          AddressBox: { title: "AddressBox", field: "AddressBox" },
          WarehouseID: { title: "Kho", field: "WarehouseID", visible: false },
          FNo: { title: "FNo", field: "FNo", visible: false },
          WD: { title: "WD", field: "WD", visible: false },
          Status: { title: "Trạng thái thiết bị", field: "Status", visible: false },
          FirmID: { title: "Hãng thiết bị (ID)", field: "FirmID", visible: false },
          CodeHCM: { title: "Code HCM", field: "CodeHCM", visible: false }
        }


      });
    } else {
      this.tableExcel.setData(this.dataTableExcel || []);
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
 async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
  console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`);
  try {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

    const data: any[] = [];
    let validRecords = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;

      const firstCell = row.getCell(1).value;
      if (!firstCell) return;

      const getValue = (col: number) => row.getCell(col).value?.toString()?.trim() || '';
      const getNumber = (col: number) => parseFloat(getValue(col)) || 0;
      const getDate = (col: number) => formatDate(getValue(col));
      const getBool = (col: number) => {
        const val = getValue(col).toLowerCase();
        return val === 'true' || val === '1' || val === 'x';
      };

      const rowData = {
        ID: getValue(1),
        ProductCode: getValue(2),
        ProductName: getValue(3),
        ProductGroupName: getValue(4),
        ProductCodeRTC: getValue(5),
        LocationName: getValue(6),
        FirmName: getValue(7),
        Serial: getValue(8),
        SerialNumber: getValue(9),
        PartNumber: getValue(10),
        UnitName: getValue(11),
        Number: getNumber(12),
        NumberInStore: getNumber(13),
        SLKiemKe: getNumber(14),
        BorrowCustomer: getBool(15),
        StatusProduct: getBool(16),
        Note: getValue(17),
        CreatedBy: getValue(18),
        CreateDate: getDate(19),
        LensMount: getValue(20),
        FocalLength: getValue(21),
        MOD: getValue(22),
        Magnification: getValue(23),
        SensorSize: getValue(24),
        SensorSizeMax: getValue(25),
        Resolution: getValue(26),
        ShutterMode: getValue(27),
        MonoColor: getValue(28),
        PixelSize: getValue(29),
        LampType: getValue(30),
        LampPower: getValue(31),
        LampWattage: getValue(32),
        LampColor: getValue(33),
        DataInterface: getValue(34),
        InputValue: getValue(35),
        OutputValue: getValue(36),
        CurrentIntensityMax: getValue(37),
        Size: getValue(38),
        LocationImg: getValue(39),
        AddressBox: getValue(40),
        WarehouseID: getValue(41),
        FNo: getValue(42),
        WD: getValue(43),
        Status: getValue(44),
        FirmID: getValue(45),
        CodeHCM: getValue(46)
      };

      data.push(rowData);
      validRecords++;
    });

    this.dataTableExcel = data;
    this.totalRowsAfterFileRead = validRecords;
    this.displayProgress = 0;
    this.displayText = validRecords === 0
      ? 'Không có dữ liệu hợp lệ trong sheet.'
      : `0/${validRecords} bản ghi`;

    if (this.tableExcel) {
      this.tableExcel.replaceData(data);
    } else {
      this.drawTable(); // drawTable nên đã cấu hình columns theo bảng bạn gửi
    }

    console.log(`Đã load ${validRecords} bản ghi hợp lệ.`);
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
    this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet!');
    this.resetExcelImportState();
  }
}

  async saveExcelData() {
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    const validDataToSave = this.dataTableExcel.filter(row => {
      return row.ProductCode && row.ProductName;
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu thiết bị hợp lệ để lưu!');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    }

    this.processedRowsForSave = 0;
    const totalToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalToSave} bản ghi`;
    this.displayProgress = 0;

    let successCount = 0;
    let errorCount = 0;
    let completedRequests = 0;

    const saveOneByOne = (index: number) => {
      if (index >= totalToSave) {
        this.showSaveSummary(successCount, errorCount, totalToSave);
        return;
      }
      const row = validDataToSave[index];

      const productData = {
        productRTCs: [{
          ID: 0,
          ProductGroupRTCID: this.getProductGroupIdByName(row.ProductGroupName) || 0,
          ProductCode: row.ProductCode || '',
          ProductName: row.ProductName || '',
          UnitCountID: this.getUnitIdByName(row.UnitName) || 0,
          Number:  0,
          Maker:row.FirmName || '',
          AddressBox: row.AddressBox || '',
           Note: row.Note || '',
          StatusProduct: row.StatusProduct === true || row.StatusProduct === '1' ? true : false,
           CreateDate: formatDate(row.CreateDate),
          NumberInStore: +row.NumberInStore || 0,
          Serial: row.Serial || '',
          SerialNumber: row.SerialNumber || '',
          PartNumber: row.PartNumber || '',
          CreatedBy: row.CreatedBy || '',
          LocationImg: row.LocationImg || '',
          ProductCodeRTC: row.ProductCodeRTC || '',
          BorrowCustomer: row.BorrowCustomer === true || row.BorrowCustomer === '1' ? true : false,
          SLKiemKe: +row.SLKiemKe || 0,
          ProductLocationID: this.getLocationIdByName(row.LocationName) || 0 ,
          WarehouseID: +row.WarehouseID || 0,
          Resolution: row.Resolution || '',
          MonoColor: row.MonoColor || '',
          SensorSize: row.SensorSize || '',
          DataInterface: row.DataInterface || '',
          LensMount: row.LensMount || '',
          ShutterMode: row.ShutterMode || '',
          PixelSize: row.PixelSize || '',
          SensorSizeMax: row.SensorSizeMax || '',
          MOD: row.MOD || '',
          FNo: row.FNo || '',
          WD: row.WD || '',
          LampType: row.LampType || '',
          LampColor: row.LampColor || '',
          LampPower: row.LampPower || '',
          LampWattage: row.LampWattage || '',
          Magnification: row.Magnification || '',
          FocalLength: row.FocalLength || '',
          FirmID: this.getFirmIdByName(row.FirmName),
          InputValue: row.InputValue || '',
          OutputValue: row.OutputValue || '',
          CurrentIntensityMax: row.CurrentIntensityMax || '',
          Status: 0,
          Size: row.Size || '',
          CodeHCM: row.CodeHCM || ''
        }]
      };
console.log(`Lưu thiết bị ${index + 1}:`, productData); 
      setTimeout(() => {
        this.tbProductRtcService.saveData(productData).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              successCount++;
            } else {
              errorCount++;
              console.error(`Lỗi khi lưu thiết bị ${index + 1}:`, res.message);
            }
            completedRequests++;
            this.processedRowsForSave = completedRequests;
            this.displayProgress = Math.round((completedRequests / totalToSave) * 100);
            this.displayText = `Đang lưu: ${completedRequests}/${totalToSave} bản ghi`;
            saveOneByOne(index + 1);
          },
          error: (err) => {
            errorCount++;
            console.error(`Lỗi API khi lưu thiết bị ${index + 1}:`, err);
            completedRequests++;
            this.processedRowsForSave = completedRequests;
            this.displayProgress = Math.round((completedRequests / totalToSave) * 100);
            this.displayText = `Đang lưu: ${completedRequests}/${totalToSave} bản ghi`;
            saveOneByOne(index + 1);
          }
        });
      }, 10);
    };

    saveOneByOne(0);
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
  private load()
  {
      this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log("unit:", this.unitData);
    });
      this.tbProductRtcService.getFirm().subscribe((response: any) => {
      this.firmData = response.data;
      console.log("Firm:", this.firmData);
    });
      this.tbProductRtcService.getLocation( 1).subscribe((response: any) => {
      this.locationData = response.data.location;
      console.log("Location", this.locationData);
    });
        this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;
      console.log("Group", this.productGroupData);
    });
  }
private getUnitIdByName(unitName: string): number {
  const unit = this.unitData.find(u => u.UnitName === unitName);
  return unit ? unit.ID : 0;
}

private getFirmIdByName(firmName: string): number {
  const firm = this.firmData.find(f => f.FirmName === firmName);
  return firm ? firm.ID : 0;
}

private getLocationIdByName(locationName: string): number {
  const location = this.locationData.find(l => l.LocationName === locationName);
  return location ? location.ID : 0;
}
private getProductGroupIdByName(ProductGroupName: string): number {
  const group = this.productGroupData.find(g => g.ProductGroupName === ProductGroupName);
  return group ? group.ID : 0;
}

}
