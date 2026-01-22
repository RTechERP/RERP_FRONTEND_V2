import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';

import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
} from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';
import { UnitService } from '../../../hrm/asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';

import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

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
    NzProgressModule,
    // HasPermissionDirective,
  ],
  selector: 'app-tb-product-rtc-import-excel',
  templateUrl: './tb-product-rtc-import-excel.component.html',
  styleUrls: ['./tb-product-rtc-import-excel.component.css'],
})
export class TbProductRtcImportExcelComponent implements OnInit {
  @Input() table: any;
  @Input() lastAddedIdProduct: number | null = null;
  @Input() searchText: string = '';
  @Input() id: number = 0;
  @Input() warehouseType: number = 1;
  @Input() warehouseID: number = 1;
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

  locationData: any[] = [];
  productGroupData: any[] = [];
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;
  isSaving: boolean = false;
  private saveSubscription: any = null; // Lưu subscription để theo dõi
  private savingNotificationId: string | null = null; // ID của notification đang lưu
  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private unitService: UnitService,
    private tbProductRtcService: TbProductRtcService
  ) {}
  ngOnInit() {
    this.loadUnit();
  }
  drawTable() {
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel || [],
        layout: 'fitDataFill',
        height: '65vh',
        selectableRows: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        autoColumns: true,
        autoColumnsDefinitions: {
          ID: { title: 'ID', field: 'ID' },
          ProductCode: { title: 'Mã sản phẩm', field: 'ProductCode' },
          ProductName: { title: 'Tên sản phẩm', field: 'ProductName' },
          ProductGroupName: { title: 'Tên nhóm', field: 'ProductGroupName' },
          ProductGroupNo:{title:'Mã nhóm', field: 'ProductGroupNo' },
          ProductCodeRTC: { title: 'Code RTC', field: 'ProductCodeRTC' },
          LocationCode: { title: 'Mã vị trí', field: 'LocationCode' },
          LocationName: { title: 'Vị trí', field: 'LocationName' },
          FirmName: { title: 'FirmName', field: 'FirmName' },
          Serial: { title: 'Serial', field: 'Serial' },
          SerialNumber: { title: 'Serial Number', field: 'SerialNumber' },
          PartNumber: { title: 'Part Number', field: 'PartNumber' },
          UnitName: { title: 'ĐVT', field: 'UnitName' }, // đổi title cho dễ nhìn
          Number: { title: 'Tồn đầu', field: 'Number' },
          NumberInStore: { title: 'SL tồn kho', field: 'NumberInStore' },
          SLKiemKe: { title: 'SL kiểm kê', field: 'SLKiemKe' },
          BorrowCustomer: {
            title: 'Mượn KH?',
            field: 'BorrowCustomer',
            formatter: 'tickCross',
          },
          StatusProduct: {
            title: 'Trạng thái',
            field: 'StatusProduct',
            formatter: 'tickCross',
          },
          Note: { title: 'Ghi chú', field: 'Note' },
          CreatedBy: { title: 'Người tạo', field: 'CreatedBy' },
          CreateDate: {
            title: 'Ngày tạo',
            field: 'CreateDate',
            formatter: 'datetime',
            formatterParams: { outputFormat: 'DD/MM/YYYY HH:mm' },
          },
          LensMount: { title: 'Lens Mount', field: 'LensMount' },
          FocalLength: { title: 'Focal Length', field: 'FocalLength' },
          MOD: { title: 'MOD', field: 'MOD' },
          Magnification: { title: 'Magnification', field: 'Magnification' },
          SensorSize: { title: 'Sensor Size', field: 'SensorSize' },
          SensorSizeMax: { title: 'Sensor Size Max', field: 'SensorSizeMax' },
          Resolution: { title: 'Resolution', field: 'Resolution' },
          ShutterMode: { title: 'Shutter Mode', field: 'ShutterMode' },
          MonoColor: { title: 'Mono/Color', field: 'MonoColor' },
          PixelSize: { title: 'Pixel Size', field: 'PixelSize' },
          LampType: { title: 'LampType', field: 'LampType' },
          LampPower: { title: 'LampPower', field: 'LampPower' },
          LampWattage: { title: 'LampWattage', field: 'LampWattage' },
          LampColor: { title: 'LampColor', field: 'LampColor' },
          DataInterface: { title: 'Data Interface', field: 'DataInterface' },
          InputValue: { title: 'Input Value', field: 'InputValue' },
          OutputValue: { title: 'Output Value', field: 'OutputValue' },
          CurrentIntensityMax: {
            title: 'Cường độ dòng tối đa',
            field: 'CurrentIntensityMax',
          },
          Size: { title: 'Kích thước', field: 'Size' },
          LocationImg: { title: 'Ảnh vị trí', field: 'LocationImg' },
          AddressBox: { title: 'AddressBox', field: 'AddressBox' },
          WarehouseID: { title: 'Kho', field: 'WarehouseID', visible: false },
          FNo: { title: 'FNo', field: 'FNo', visible: false },
          WD: { title: 'WD', field: 'WD', visible: false },
          Status: {
            title: 'Trạng thái thiết bị',
            field: 'Status',
            visible: false,
          },
          FirmID: {
            title: 'Hãng thiết bị (ID)',
            field: 'FirmID',
            visible: false,
          },
          CodeHCM: { title: 'Code HCM', field: 'CodeHCM', visible: false },
        },
      });
    } else {
      this.tableExcel.setData(this.dataTableExcel || []);
    }
  }
  formatProgressText = (percent: number): string => {
    return this.displayText;
  };
  importFromExcel(): void {
    if (this.table) {
      this.table.import('xlsx', ['.xlsx', '.csv', '.ods'], 'buffer');
    } else {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bảng chưa được khởi tạo!'
      );
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
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn tệp Excel (.xlsx hoặc .xls)!'
        );
        input.value = '';
        this.resetExcelImportState();
        return;
      }
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.processedRowsForSave = 0; // Reset cho giai đoạn lưu
      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';
      console.log('Progress bar state set to: Đang đọc file...'); // Log trạng thái ban đầu
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
          this.excelSheets = workbook.worksheets.map((sheet) => sheet.name);
          console.log('Danh sách sheets tìm thấy:', this.excelSheets);
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            console.log('Sheet mặc định được chọn:', this.selectedSheet);
            await this.readExcelData(workbook, this.selectedSheet);
            const elapsedTime = Date.now() - startTime;
            const minDisplayTime = 100;
            if (elapsedTime < minDisplayTime) {
              setTimeout(() => {
                this.displayProgress = 0;
                if (this.totalRowsAfterFileRead === 0) {
                  this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
                } else {
                  this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
                }
                console.log(
                  'Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật (sau delay).'
                );
              }, minDisplayTime - elapsedTime);
            } else {
              // Nếu quá trình xử lý đã đủ lâu, cập nhật ngay lập tức
              this.displayProgress = 0;
              if (this.totalRowsAfterFileRead === 0) {
                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
              } else {
                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
              }
              console.log(
                'Dữ liệu đã được đọc và bảng Excel preview đã được cập nhật.'
              );
            }
          } else {
            console.warn('File Excel không chứa bất kỳ sheet nào.'); // Log
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'File Excel không có sheet nào!'
            );
            this.resetExcelImportState();
          }
        } catch (error) {
          console.error(
            'Lỗi khi đọc tệp Excel trong FileReader.onload:',
            error
          ); // Log chi tiết lỗi
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.'
          );
          this.resetExcelImportState();
        }
        input.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  }
  onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.filePath) {
      const fileInput = document.getElementById(
        'fileInput'
      ) as HTMLInputElement;
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const data = e.target.result;
          try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            await this.readExcelData(workbook, this.selectedSheet);
            this.displayProgress = 0;
            console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.'); // Log
          } catch (error) {
            console.error('Lỗi khi đọc tệp Excel khi thay đổi sheet:', error);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Không thể đọc dữ liệu từ sheet đã chọn!'
            );
            this.resetExcelImportState();
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
    // Nếu đang lưu, hiển thị notification và cho phép đóng modal
    if (this.isSaving) {
      const loadingNotification = this.notification.info(
        'Đang lưu dữ liệu',
        'Hệ thống đang lưu dữ liệu Excel. Vui lòng đợi cho đến khi hoàn tất.',
        {
          nzDuration: 0, // Không tự đóng
          nzPlacement: 'topRight',
        }
      );
      this.savingNotificationId = loadingNotification.messageId;
      // Vẫn đóng modal nhưng giữ notification
      this.modalService.dismissAll(true);
      return;
    }
    this.modalService.dismissAll(true);
  }
  private normalizeHeader(h: any): string {
    const s = (typeof h === 'string' ? h : h?.toString() || '')
      .trim()
      .toLowerCase();
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // bỏ dấu
  }

  private headerSynonyms: Record<string, string> = {
    // Mã và Tên
    'ma san pham': 'ProductCode',
    'ma thiet bi': 'ProductCode',
    'ten san pham': 'ProductName',
    'ten thiet bi': 'ProductName',
    // Nhóm / Kho / Vị trí
    productgroupname: 'ProductGroupName',
    'ten nhom': 'ProductGroupName',
    'ma nhom': 'ProductGroupNo',
    'vi tri': 'LocationName',
    'vi tri (hop)': 'LocationName',
    'ma vi tri': 'LocationCode',
    'ma vi tri (hop)': 'LocationCode',
    locationcode: 'LocationCode',
    locationname: 'LocationName',
    kho: 'WarehouseID',
    // Đơn vị / Hãng
    // 'unitname': 'UnitName',
    // 'don vi': 'UnitName',
    đvt: 'UnitName', // thêm: ĐVT
    dvt: 'UnitName', // thêm: DVT
    DVT: 'UnitName',
    firmname: 'FirmName',
    hang: 'FirmName',
    'hang thiet bi (id)': 'FirmID',
    // Code
    'code rtc': 'ProductCodeRTC',
    'code hcm': 'CodeHCM',
    // Thông số, số lượng, trạng thái
    serial: 'Serial',
    'serial number': 'SerialNumber',
    'part number': 'PartNumber',
    'so luong': 'Number',
    'ton cuoi ky': 'Number',
    'sl ton kho': 'NumberInStore',
    'sl kiem ke': 'SLKiemKe',
    'muon kh?': 'BorrowCustomer',
    'muon kh': 'BorrowCustomer',
    'trang thai': 'StatusProduct',
    'trang thai thiet bi': 'Status',
    'ghi chu': 'Note',
    'nguoi tao': 'CreatedBy',
    'ngay tao': 'CreateDate',
    // Quang học, camera
    'lens mount': 'LensMount',
    'focal length': 'FocalLength',
    mod: 'MOD',
    magnification: 'Magnification',
    'sensor size': 'SensorSize',
    'sensor size max': 'SensorSizeMax',
    resolution: 'Resolution',
    'shutter mode': 'ShutterMode',
    'mono/color': 'MonoColor',
    'mono color': 'MonoColor',
    'pixel size': 'PixelSize',
    // Đèn, giao tiếp
    'lamp type': 'LampType',
    'lamp power': 'LampPower',
    'lamp wattage': 'LampWattage',
    'lamp color': 'LampColor',
    'data interface': 'DataInterface',
    'input value': 'InputValue',
    'output value': 'OutputValue',
    // Khác
    'cuong do dong toi da': 'CurrentIntensityMax',
    'kich thuoc': 'Size',
    'anh vi tri': 'LocationImg',
    addressbox: 'AddressBox',
    fno: 'FNo',
    wd: 'WD',
  };

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

      // Map theo header ở hàng 1
      const headerRow = worksheet.getRow(1);
      const fieldToCol: Record<string, number> = {};
      for (let c = 1; c <= headerRow.cellCount; c++) {
        const raw = (
          headerRow.getCell(c)?.text ??
          headerRow.getCell(c)?.value ??
          ''
        ).toString();
        const norm = this.normalizeHeader(raw);
        const field = this.headerSynonyms[norm] || norm; // nếu trùng sẵn field chuẩn thì dùng trực tiếp
        if (field) fieldToCol[field] = c;
        // Debug: log mapping cho Number field
        if (field === 'Number' || norm.includes('ton') || norm.includes('cuoi')) {
          console.log(`Header mapping: "${raw}" -> normalized: "${norm}" -> field: "${field}" -> column: ${c}`);
        }
      }
      // Debug: log fieldToCol để kiểm tra
      console.log('fieldToCol mapping:', fieldToCol);

      //   const headerRow = worksheet.getRow(1);
      //   const fieldToCol: Record<string, number> = {};
      //   for (let c = 1; c <= headerRow.cellCount; c++) {
      //     const raw = (headerRow.getCell(c)?.text ?? headerRow.getCell(c)?.value ?? '').toString();
      //     const norm = this.normalizeHeader(raw);
      //     const field = this.headerSynonyms[norm] || norm; // nếu trùng sẵn field chuẩn thì dùng trực tiếp
      //     if (field) fieldToCol[field] = c;
      //   }

      const data: any[] = [];
      let validRecords = 0;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 1) return;

        // yêu cầu có ít nhất mã hoặc tên để coi là bản ghi hợp lệ
        const firstVal =
          (fieldToCol['ProductCode']
            ? row.getCell(fieldToCol['ProductCode']).value
            : null) ||
          (fieldToCol['ProductName']
            ? row.getCell(fieldToCol['ProductName']).value
            : null);
        if (!firstVal) return;

        const getValueByField = (field: string) => {
          const col = fieldToCol[field];
          if (!col) return '';
          const cell = row.getCell(col);

          // Kiểm tra text trước - nếu text rỗng hoặc null/undefined thì trả về rỗng
          // Không lấy formula nếu text rỗng
          const cellText = cell.text;
          if (cellText === null || cellText === undefined || cellText.trim() === '') {
            return '';
          }

          // Nếu có text thì trả về text (đây là giá trị hiển thị thực tế trong Excel)
          return cellText.trim();
        };
        const getNumberByField = (field: string) => {
          const col = fieldToCol[field];
          if (!col) {
            if (field === 'Number') {
              console.log(`Warning: Column for field "${field}" not found in header mapping`);
            }
            return 0;
          }
          const cell = row.getCell(col);
          // Thử lấy giá trị từ text trước (ExcelJS có thể trả về text đã format)
          let val = cell.text || cell.value;
          // Nếu vẫn không có, thử lấy từ value
          if (val === null || val === undefined || val === '') {
            val = cell.value;
          }
          // Debug cho Number field (chỉ log 5 dòng đầu)
          if (field === 'Number' && rowNumber <= 5) {
            console.log(`Row ${rowNumber}, Field "${field}": raw value =`, val, `type =`, typeof val, `cell.text =`, cell.text);
          }
          // Xử lý trực tiếp giá trị từ Excel cell
          if (val === null || val === undefined || val === '') {
            return 0;
          }
          // Nếu đã là số thì trả về trực tiếp
          if (typeof val === 'number') {
            return isNaN(val) ? 0 : val;
          }
          // Nếu là string thì parse
          if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed === '') return 0;
            // Loại bỏ các ký tự không phải số (trừ dấu chấm và dấu phẩy)
            const cleaned = trimmed.replace(/[^\d.,-]/g, '');
            const n = parseFloat(cleaned.replace(',', '.'));
            return isNaN(n) ? 0 : n;
          }
          // Thử chuyển đổi sang số
          const n = Number(val);
          return isNaN(n) ? 0 : n;
        };
        const getDateByField = (field: string) => {
          const col = fieldToCol[field];
          if (!col) return null;
          const val = row.getCell(col).value;
          if (!val) return null;
          if (val instanceof Date) {
            return DateTime.fromJSDate(val).toISODate();
          }
          const s = val.toString().trim();
          return formatDate(s); // d/M/yyyy hoặc dd/MM/yyyy
        };
        const getBoolByField = (field: string) => {
          const v = getValueByField(field).toLowerCase();
          return (
            v === 'true' ||
            v === '1' ||
            v === 'x' ||
            v === 'yes' ||
            v === 'y' ||
            v === 'co' ||
            v === 'có'
          );
        };

        const rowData = {
          ProductCode: getValueByField('ProductCode'),
          ProductName: getValueByField('ProductName'),
          ProductGroupName: getValueByField('ProductGroupName'),
          ProductGroupNo: getValueByField('ProductGroupNo'),
          ProductCodeRTC: getValueByField('ProductCodeRTC'),
          LocationCode: getValueByField('LocationCode'),
          LocationName: getValueByField('LocationName'),
          FirmName: getValueByField('FirmName'),
          Serial: getValueByField('Serial'),
          SerialNumber: getValueByField('SerialNumber'),
          PartNumber: getValueByField('PartNumber'),
          UnitName: getValueByField('UnitName'),
          Number: getNumberByField('Number'),
          NumberInStore: getNumberByField('NumberInStore'),
          SLKiemKe: getNumberByField('SLKiemKe'),
          BorrowCustomer: getBoolByField('BorrowCustomer'),
          StatusProduct: getBoolByField('StatusProduct'),
          Note: getValueByField('Note'),
          CreatedBy: getValueByField('CreatedBy'),
          CreateDate: getDateByField('CreateDate'),
          LensMount: getValueByField('LensMount'),
          FocalLength: getValueByField('FocalLength'),
          MOD: getValueByField('MOD'),
          Magnification: getValueByField('Magnification'),
          SensorSize: getValueByField('SensorSize'),
          SensorSizeMax: getValueByField('SensorSizeMax'),
          Resolution: getValueByField('Resolution'),
          ShutterMode: getValueByField('ShutterMode'),
          MonoColor: getValueByField('MonoColor'),
          PixelSize: getValueByField('PixelSize'),
          LampType: getValueByField('LampType'),
          LampPower: getValueByField('LampPower'),
          LampWattage: getValueByField('LampWattage'),
          LampColor: getValueByField('LampColor'),
          DataInterface: getValueByField('DataInterface'),
          InputValue: getValueByField('InputValue'),
          OutputValue: getValueByField('OutputValue'),
          CurrentIntensityMax: getValueByField('CurrentIntensityMax'),
          Size: getValueByField('Size'),
          LocationImg: getValueByField('LocationImg'),
          AddressBox: getValueByField('AddressBox'),
          WarehouseID: this.warehouseID,
          FNo: getValueByField('FNo'),
          WD: getValueByField('WD'),
          Status: getValueByField('Status'),
          FirmID: getValueByField('FirmID'),
          CodeHCM: getValueByField('CodeHCM'),
        };

        data.push(rowData);
        validRecords++;
      });

      console.log('data import:', data);
      this.dataTableExcel = data;
      this.totalRowsAfterFileRead = validRecords;
      this.displayProgress = 0;
      this.displayText =
        validRecords === 0
          ? 'Không có dữ liệu hợp lệ trong sheet.'
          : `0/${validRecords} bản ghi`;

      if (this.tableExcel) {
        this.tableExcel.replaceData(data);
      } else {
        this.drawTable();
      }

      console.log(`Đã load ${validRecords} bản ghi hợp lệ.`);
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không thể đọc dữ liệu từ sheet!'
      );
      this.resetExcelImportState();
    }
  }
  checkDuplicateFromList(row: any, existingList: any[]): boolean {
    const normalize = (val: any) => val?.toString().trim().toLowerCase();

    const code = normalize(row.ProductCode);

    const isDuplicate = existingList.some((item: any) => {
      return normalize(item.ProductCode) === code;
    });

    return isDuplicate;
  }

  /**
   * Helper function to safely convert value to number
   * Returns 0 if value is NaN, null, or undefined
   */
  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? 0 : num;
  }

  async saveExcelData() {
    if (this.isSaving) return;
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để lưu!'
      );
      return;
    }

    const validDataToSave = this.dataTableExcel.filter(
      (row) => row.ProductCode && row.ProductName
    );
    if (validDataToSave.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thiết bị hợp lệ để lưu!'
      );
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    }

    // Map toàn bộ rows sang DTO theo API
    // Backend nhận List<ProductRTCImportExcelDTO> và tự động map ProductGroupName, Maker, AddressBox
    const productRTCs = validDataToSave.map((row) => {
      return {
        ID: 0,
        ProductGroupRTCID: 0, // Backend sẽ tự gán sau khi tìm/tạo ProductGroup
        ProductGroupName: row.ProductGroupName?.trim() || null, // Backend dùng để tìm/tạo ProductGroup
        ProductGroupNo: row.ProductGroupNo?.trim() || null, // Mã nhóm
        ProductCode: row.ProductCode || '',
        ProductName: row.ProductName || '',
        UnitCountID: this.getUnitIdByName(row.UnitName) || 0,
        Number: this.toNumber(row.Number),
        Maker: row.FirmName?.trim() || '', // Backend dùng để tìm/tạo Firm
        AddressBox: row.AddressBox?.trim() || '', // Backend dùng để tìm/tạo ProductLocation
        Note: row.Note || '',
        StatusProduct: row.StatusProduct === true || row.StatusProduct === '1',
        CreateDate: formatDate(row.CreateDate),
        NumberInStore: this.toNumber(row.NumberInStore),
        Serial: row.Serial || '',
        SerialNumber: row.SerialNumber || '',
        PartNumber: row.PartNumber || '',
        CreatedBy: row.CreatedBy || '',
        LocationImg: row.LocationImg || '',
        ProductCodeRTC: null, // Không lấy từ Excel
        BorrowCustomer: row.BorrowCustomer === true || row.BorrowCustomer === '1',
        SLKiemKe: this.toNumber(row.SLKiemKe),
        ProductLocationID: 0, // Backend sẽ tự gán sau khi tìm/tạo ProductLocation
          WarehouseID: this.warehouseID,
        WarehouseType: this.warehouseType, // Thêm WarehouseType để backend map đúng
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
        FirmID: 0, // Backend sẽ tự gán sau khi tìm/tạo Firm
        InputValue: row.InputValue || '',
        OutputValue: row.OutputValue || '',
        CurrentIntensityMax: row.CurrentIntensityMax || '',
        Status: 0,
        Size: row.Size || '',
        CodeHCM: row.CodeHCM || '',
        IsDelete: false,
        LocationName: row.LocationName || '',
        LocationCode: row.LocationCode || '',
      };
    });

    // API nhận List<ProductRTCImportExcelDTO> trực tiếp, không cần wrap trong object
    const payload = productRTCs;

    this.displayText = `Đang lưu: ${validDataToSave.length}/${validDataToSave.length} bản ghi`;
    this.displayProgress = 50;
    this.isSaving = true;
    console.log('payload:', payload);
    this.saveSubscription = this.tbProductRtcService.saveDataExcel(payload).subscribe({
      next: (res: any) => {
        // Lưu lại ID notification trước khi reset
        const notificationIdToRemove = this.savingNotificationId;

        // Reset state trước
        this.isSaving = false;
        this.saveSubscription = null;
        this.savingNotificationId = null;

        // Đóng notification đang lưu nếu có
        if (notificationIdToRemove) {
          this.notification.remove(notificationIdToRemove);
        }

        // Hiển thị chính xác message từ API
        if (res.status === 1) {
          const successMessage = res.message || 'Lưu dữ liệu thành công.';
          this.notification.success(
            'Thông báo',
            successMessage
          );
          // Đóng modal sau khi lưu thành công
          this.modalService.dismissAll(true);
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Lưu dữ liệu có lỗi.'
          );
        }

        this.displayProgress = 100;
        if (res?.data && typeof res.data.successCount === 'number') {
          this.displayText = `${res.data.successCount}/${validDataToSave.length} thành công`;
        } else {
          this.displayText = 'Hoàn tất';
        }
      },
      error: (err) => {
        // Lưu lại ID notification trước khi reset
        const notificationIdToRemove = this.savingNotificationId;

        // Reset state trước
        this.isSaving = false;
        this.saveSubscription = null;
        this.savingNotificationId = null;

        // Đóng notification đang lưu nếu có
        if (notificationIdToRemove) {
          this.notification.remove(notificationIdToRemove);
        }

        const errorMessage = err.error?.message || 'Không thể lưu dữ liệu Excel!';
        this.notification.error(
          'Thông báo',
          errorMessage
        );
        console.error('Lỗi API save-data-excel:', err);
        this.displayProgress = 0;
        this.displayText = `0/${validDataToSave.length} bản ghi`;
      },
    });
  }

  private loadUnit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log('unit:', this.unitData);
    });

    let firmType = 1;
    if (this.warehouseType == 1) firmType = 2;
    else if (this.warehouseType == 2) firmType = 3;

    this.tbProductRtcService.getFirm(firmType).subscribe((response: any) => {
      this.firmData = response.data;
      console.log('Firm:', this.firmData);
    });
    this.tbProductRtcService.getLocation(1).subscribe((response: any) => {
      this.locationData = response.data.location;
      console.log('Location', this.locationData);
    });
    this.tbProductRtcService
      .getProductRTCGroup(this.warehouseType)
      .subscribe((resppon: any) => {
        this.productGroupData = resppon.data;
        console.log('Group', this.productGroupData);
      });
  }
  private getUnitIdByName(unitName: string): number {
    const key = (unitName || '').trim().toLowerCase();
    const unit = this.unitData.find(
      (u) => (u.UnitName || '').trim().toLowerCase() === key
    );
    return unit ? unit.ID : 0;
  }

  private getFirmIdByName(firmName: string): number {
    const firm = this.firmData.find(
      (f) => f.FirmName.trim().toLowerCase() === firmName.trim().toLowerCase()
    );
    return firm ? firm.ID : 0;
  }

  private getLocationIdByName(locationName: string): number {
    const location = this.locationData.find(
      (l) =>
        l.LocationName.trim().toLowerCase() ===
        locationName.trim().toLowerCase()
    );
    return location ? location.ID : 0;
  }
  private getProductGroupIdByName(ProductGroupName: string): number {
    const group = this.productGroupData.find(
      (g) =>
        g.ProductGroupName.trim().toLowerCase() ===
        ProductGroupName.trim().toLowerCase()
    );
    console.log('group:', group);

    return group ? group.ID : 0;
  }
  async exportToExcelProduct() {
    if (!this.tableExcel) return;

    const selectedData = [...this.dataTableExcel];
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thiết bị');

    const columns: ColumnDefinition[] = this.tableExcel
      .getColumnDefinitions()
      .filter(
        (col: ColumnDefinition) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );

    // Header
    const headerRow = worksheet.addRow(
      columns.map((col) => col.title || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Data rows
    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: ColumnDefinition) => {
        const value = row[col.field as string]; // Cast để tránh lỗi
        switch (col.field) {
          case 'BorrowCustomer':
            return value ? 'Có' : 'Không';
          case 'CreateDate':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });

    // Column width
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    // Border + alignment
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // Tạo và tải file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-thiet-bi-loi-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
