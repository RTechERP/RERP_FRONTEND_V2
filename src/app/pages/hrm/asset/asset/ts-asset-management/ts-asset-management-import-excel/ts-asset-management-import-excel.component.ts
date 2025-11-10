import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AssetsManagementService } from '../ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  if (!val) return '';

  // Nếu là Date JS
  if (val instanceof Date) {
    const dt = DateTime.fromJSDate(val);
    return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
  }

  // Nếu là string
  if (typeof val === 'string') {
    const trimmed = val.trim();

    // Thử ISO trước
    let dt = DateTime.fromISO(trimmed);
    if (dt.isValid) return dt.toFormat('dd/MM/yyyy');

    // Thử dạng d/M/yyyy
    dt = DateTime.fromFormat(trimmed, 'd/M/yyyy');
    if (dt.isValid) return dt.toFormat('dd/MM/yyyy');

    // Không phải date → trả nguyên text, KHÔNG "Invalid"
    return trimmed;
  }

  // Các kiểu khác bỏ qua
  return '';
}
function getCellText(cell: ExcelJS.Cell): string {
  const v = cell.value as any;
  return normalizeCellValue(v);
}

function normalizeCellValue(v: any): string {
  if (v == null) return '';

  // primitive
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }

  // Date
  if (v instanceof Date) {
    return DateTime.fromJSDate(v).toISODate() ?? '';
    // hoặc: return DateTime.fromJSDate(v).toFormat('dd/MM/yyyy') ?? '';
  }

  // richText: { richText: [{ text: '...' }, ...] }
  if (Array.isArray(v.richText)) {
    return v.richText.map((rt: any) => rt.text ?? '').join('');
  }

  // object có text: { text: '...' }
  if (v.text) {
    return String(v.text);
  }

  // hyperlink: { text: '...', hyperlink: '...' }
  if (v.hyperlink && v.text) {
    return String(v.text);
  }

  // formula: { formula: '...', result: ... }
  if (v.result !== undefined && v.result !== null) {
    return normalizeCellValue(v.result); // xử lý lại y như trên, không toString thô
  }

  // fallback
  return String(v);
}
function formatDate(value: any): string | null {
  if (!value) return null;

  // Nếu là Date JS
  if (value instanceof Date) {
    const dt = DateTime.fromJSDate(value);
    return dt.isValid ? dt.toISODate() : null;
  }

  // Chuẩn hóa về string
  const str = String(value).trim();
  if (!str) return null;

  // Thử dd/M/yyyy
  let dt = DateTime.fromFormat(str, 'd/M/yyyy');
  if (dt.isValid) return dt.toISODate();

  // Thử ISO (2024-01-01)
  dt = DateTime.fromISO(str);
  if (dt.isValid) return dt.toISODate();

  // Không parse được thì trả null
  return null;
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
  selector: 'app-ts-asset-management-import-excel',
  templateUrl: './ts-asset-management-import-excel.component.html',
  styleUrls: ['./ts-asset-management-import-excel.component.css']
})
export class TsAssetManagementImportExcelComponent implements OnInit, AfterViewInit {
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
  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh
  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0;
  constructor(private notification: NzNotificationService,
    private modalService: NgbModal,
    private assetsManagementService: AssetsManagementService,
    private unitService: UnitService,
    private soucerService: AssetsService,
    private typeAssetsService: TypeAssetsService,
    private tsAssetManagementPersonalService: TsAssetManagementPersonalService,
  ) { }
  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.loadUnit();
    this.drawtable();
  }
  drawtable() {
    if (!this.tableExcel) {
      this.tableExcel = new Tabulator('#datatableExcel', {
        data: this.dataTableExcel,
        layout: 'fitDataFill',
    ...DEFAULT_TABLE_CONFIG,
    height:'40vh',
    paginationMode:'local',
        columns: [
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
          { title: 'Mã tài sản', field: 'TSAssetCode', hozAlign: 'left' },
          { title: 'Tên tài sản', field: 'TSAssetName', hozAlign: 'left' },
          { title: 'Mã loại tài sản', field: 'AssetCode', hozAlign: 'left' },
          { title: 'Tên loại', field: 'AssetType', hozAlign: 'left' },
          { title: 'Mã nguồn gốc tài sản', field: 'SourceCode', hozAlign: 'left' },
          { title: 'Tên nguồn gốc', field: 'SourceName', hozAlign: 'left' },
          { title: 'Mã NCC', field: 'TSCodeNCC', hozAlign: 'left' },

          { title: 'Mô tả chi tiết (Model, thông số kỹ thuật…)', field: 'SpecificationsAsset', hozAlign: 'left' },
          { title: 'Seri', field: 'Seri', hozAlign: 'left' },
          { title: 'Đơn vị tính', field: 'UnitName', hozAlign: 'left' },
          { title: 'Số lượng', field: 'Quantity', hozAlign: 'right' },
          {
            title: 'Trạng thái',
            field: 'Status',
            hozAlign: 'center',
            formatter: (cell: any) => {
              const val = cell.getValue();
              const el = cell.getElement();
              el.style.backgroundColor = '';
              el.style.color = '';
              if (val === 'Chưa sử dụng') { el.style.backgroundColor = '#00CC00'; el.style.color = '#fff'; }
              else if (val === 'Đang sử dụng') { el.style.backgroundColor = '#FFCC00'; el.style.color = '#000'; }
              else if (val === 'Đã thu hồi' || val === 'Hỏng') { el.style.backgroundColor = '#FFCCCC'; }
              else if (val === 'Mất') { el.style.backgroundColor = '#BB0000'; el.style.color = '#fff'; }
              return val;
            }
          },
          { title: 'Mã phòng ban', field: 'DepartmentCode', hozAlign: 'left' },
          { title: 'Tên phòng ban', field: 'DepartmentName', hozAlign: 'left' },
          { title: 'Mã nhân viên', field: 'EmployeeCode', hozAlign: 'left' },
          { title: 'Người sử dụng', field: 'EmployeeName', hozAlign: 'left' },
          { title: 'Thời gian ghi tăng', field: 'DateBuy', hozAlign: 'center', formatter: formatDateCell },
          { title: 'Thời gian bảo hành (tháng)', field: 'Insurance', hozAlign: 'right' },
          { title: 'Hiệu lực từ', field: 'DateEffect', hozAlign: 'center', formatter: formatDateCell },
          { title: 'Ghi chú', field: 'Note', hozAlign: 'left' },

        ],
      });
    } else {
      this.tableExcel.replaceData(this.dataTableExcel);
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
          this.notification.error('Thông báo', 'Không thể đọc tệp Excel. Vui lòng đảm bảo tệp không bị hỏng và đúng định dạng.');
          this.resetExcelImportState(); // Reset trạng thái khi có lỗi
        }
        input.value = ''; // Xóa input để có thể chọn lại cùng file
      };
      reader.readAsArrayBuffer(file); // Bắt đầu đọc file ngay lập tức
    }
  }
  private normalizeHeader(value: any): string {
  if (value == null) return '';

  return value
    .toString()
    .toLowerCase()
    .replace(/\u00A0/g, ' ')   // thay non-breaking space thành space thường
    .replace(/\s+/g, ' ')      // gộp tất cả khoảng trắng (space, \n, \t, ...) thành 1 space
    .trim();
}
  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`);
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

      // Tìm dòng header theo ô cột 1 = "STT"
      let headerRowIndex = 0;
      worksheet.eachRow((row, rowNumber) => {
        const v = row.getCell(1).value;
        if (!headerRowIndex && v && v.toString().trim().toUpperCase() === 'STT') {
          headerRowIndex = rowNumber;
        }
      });

      if (!headerRowIndex) {
        throw new Error('Không tìm thấy dòng header có STT ở cột 1.');
      }

      const headerRow = worksheet.getRow(headerRowIndex);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = getCellText(cell);
      });
const requiredHeaders = [
  'stt',
  'mã tài sản',
  'tên tài sản',
  'mã loại',
  'nguồn gốc',
  'đơn vị',
  'số lượng'
];

const normalizedHeaders = headers.map(h => this.normalizeHeader(h));

const isHeaderValid = requiredHeaders.every(req => {
  const normReq = this.normalizeHeader(req);
  return normalizedHeaders.some(h => h.includes(normReq));
});

if (!isHeaderValid) {
  console.warn('Header không hợp lệ:', headers, normalizedHeaders);
  this.notification.error(
    'Thông báo',
    'File Excel không đúng mẫu biên bản tài sản. Vui lòng tải xuống mẫu xuất để có mẫu nhập excel.'
  );
  this.resetExcelImportState();
  return;
}
      const columns: ColumnDefinition[] = [
        { title: headers[0] || 'STT', field: 'STT', hozAlign: 'center', headerHozAlign: 'center', width: 70 },
        { title: headers[1] || 'Mã tài sản', field: 'TSAssetCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[2] || 'Tên tài sản', field: 'TSAssetName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[3] || 'Mã loại tài sản', field: 'AssetCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[4] || 'Mã nguồn gốc tài sản', field: 'SourceCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[5] || 'Mã nhà cung cấp', field: 'TSCodeNCC', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[6] || 'Mô tả chi tiết (Model, thông số kỹ thuật…)', field: 'SpecificationsAsset', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[7] || 'Số seri', field: 'Seri', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[8] || 'Đơn vị tính', field: 'UnitName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[9] || 'Số lượng', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[10] || 'Tình trạng', field: 'Status', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[11] || 'Mã phòng ban', field: 'DepartmentCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[12] || 'Mã nhân viên', field: 'EmployeeCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[13] || 'Người sử dụng', field: 'EmployeeName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[14] || 'Thời gian ghi tăng', field: 'DateBuy', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[15] || 'Thời gian bảo hành (tháng)', field: 'Insurance', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[16] || 'Hiệu lực từ', field: 'DateEffect', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[17] || 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' },
      ];
   
      if (this.tableExcel) {
        this.tableExcel.setColumns(columns);
      }

      const data: any[] = [];
      let validRecords = 0;

      // Data bắt đầu từ hàng sau header
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > headerRowIndex) {
          const firstCell = row.getCell(1).value;
          const isEmptyRow =
            !firstCell &&
            !row.getCell(2).value &&
            !row.getCell(3).value;

          if (!isEmptyRow) {
            const rowData: any = {
              STT: getCellText(row.getCell(1)),
              TSAssetCode: getCellText(row.getCell(2)),   // Mã tài sản
              TSAssetName: getCellText(row.getCell(3)),   // Tên tài sản

              AssetCode: getCellText(row.getCell(4)),     // Mã loại tài sản

              SourceCode: getCellText(row.getCell(5)),    // Mã nguồn gốc tài sản
              TSCodeNCC: getCellText(row.getCell(6)),     // Mã nhà cung cấp

              SpecificationsAsset: getCellText(row.getCell(7)), // Mô tả chi tiết
              Seri: getCellText(row.getCell(8)),                // Số seri

              UnitName: getCellText(row.getCell(9)),      // Đơn vị tính
              Quantity: getCellText(row.getCell(10)),     // Số lượng
              Status: getCellText(row.getCell(11)),       // Tình trạng

              DepartmentCode: getCellText(row.getCell(12)), // Mã phòng ban
              EmployeeCode: getCellText(row.getCell(13)),   // Mã nhân viên
              EmployeeName: getCellText(row.getCell(14)),   // Người sử dụng

              DateBuy: getCellText(row.getCell(15)),     // Thời gian ghi tăng
              Insurance: getCellText(row.getCell(16)),   // Thời gian bảo hành (Tháng)
              DateEffect: getCellText(row.getCell(17)),  // Hiệu lực từ
              Note: getCellText(row.getCell(18)),        // Ghi chú
            };
            data.push(rowData);
            validRecords++;
          }
        }
      });

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
        this.drawtable();
      }

      console.log(`Đã load ${validRecords} bản ghi hợp lệ.`);
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet!');
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
 async saveExcelData() {
  if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để lưu!');
    return;
  }

  const validDataToSave = this.dataTableExcel.filter(row => {
    const stt = row.STT;
    return typeof stt === 'number'
      || (typeof stt === 'string' && !isNaN(parseFloat(stt)) && isFinite(parseFloat(stt)));
  });

  if (validDataToSave.length === 0) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
    this.displayProgress = 0;
    this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
    return;
  }

  const totalAssetsToSave = validDataToSave.length;

  // cập nhật progress bar
  this.displayProgress = 10;
  this.displayText = `Đang chuẩn bị dữ liệu: ${totalAssetsToSave} bản ghi`;

  // notification tiến trình (1 cái duy nhất, update theo nzKey)
  const notifKey = 'asset-import-progress';
  this.notification.info(
    'Đang lưu dữ liệu',
    `Đang gửi ${totalAssetsToSave} bản ghi lên server...`,
    { nzKey: notifKey, nzDuration: 0 }
  );

  let payload: any;
  try {
    payload = {
      tSAssetManagements: validDataToSave.map(row => ({
        ID: 0,
        STT: row.STT,
        TSAssetCode: row.TSAssetCode || '',
        TSAssetName: row.TSAssetName || '',
        IsAllocation: false,
        UnitID: this.getUnitIdByName(row.UnitName),
        Seri: row.Seri || '',
        SpecificationsAsset: row.SpecificationsAsset || '',
        DateBuy: formatDate(row.DateBuy),
        DateEffect: formatDate(row.DateEffect),
        Insurance: row.Insurance || 0,
        TSCodeNCC: row.TSCodeNCC || '',
        OfficeActiveStatus: 0,
        WindowActiveStatus: 0,
        Note: row.Note || '',
        StatusID: 1,
        SourceID: this.getSourceIdByName(row.SourceCode),
        TSAssetID: this.getTypeIdByName(row.AssetType),
        Status: 'Chưa sử dụng',
        EmployeeID: this.getEmployeeIDByName(row.EmployeeName),
        SupplierID: 0,
        DepartmentID: this.getDepartmentIDByName(row.DepartmentName),
      }))
    };
  } catch (e) {
    console.error('Lỗi khi map dữ liệu từ Excel sang payload API:', e, validDataToSave);
    this.notification.error('Thông báo', 'Lỗi khi chuẩn bị dữ liệu để lưu.');
    return;
  }

  // gửi 1 lần duy nhất
  this.displayProgress = 30;
  this.displayText = `Đang gửi ${totalAssetsToSave} bản ghi...`;

  this.assetsManagementService.saveDataAsset(payload).subscribe({
    next: (response: any) => {
      // giả sử backend: status = 1 là ok, còn lại là lỗi
      let successCount = 0;
      let errorCount = 0;

      if (response?.status === 1) {
        successCount = totalAssetsToSave;
        errorCount = 0;
      } else {
        successCount = 0;
        errorCount = totalAssetsToSave;
      }

      this.displayProgress = 100;
      this.displayText = `Đã xử lý ${totalAssetsToSave}/${totalAssetsToSave} bản ghi`;

      this.notification.remove(notifKey);

      if (response?.status === 1) {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          `Đã lưu ${successCount}/${totalAssetsToSave} bản ghi thành công`
        );
      } else {
        const backendMsg =
          response?.message ||
          response?.error?.message ||
          'Lưu dữ liệu thất bại.';

        this.notification.error(NOTIFICATION_TITLE.error,
          `${backendMsg} (thất bại ${errorCount}/${totalAssetsToSave} bản ghi)`
        );
      }

      // nếu muốn vẫn đóng modal sau khi lưu xong:
      this.closeExcelModal();
    },
    error: (err: any) => {
      console.error('Lỗi API khi lưu danh sách tài sản:', err);

      const backendMsg =
        err?.error?.message ||
        err?.error?.title ||
        err?.message ||
        'Lưu dữ liệu thất bại.';  

      this.displayProgress = 100;
      this.displayText = `Lỗi khi lưu ${totalAssetsToSave} bản ghi`;

      this.notification.remove(notifKey);
      this.notification.error(
       NOTIFICATION_TITLE.error,
        `${backendMsg} (thất bại ${totalAssetsToSave}/${totalAssetsToSave} bản ghi)`
      );
      // tùy mày: có thể KHÔNG đóng modal để xem lại dữ liệu
      // this.closeExcelModal();
    }
  });
}

  showSaveSummary(successCount: number, errorCount: number, totalProducts: number) {
    console.log('--- Hiển thị tóm tắt kết quả lưu ---');
    console.log(`Tổng sản phẩm: ${totalProducts}, Thành công: ${successCount}, Thất bại: ${errorCount}`);

    if (errorCount === 0) {
      this.notification.success(NOTIFICATION_TITLE.success, `Đã lưu ${successCount} sản phẩm thành công`);
    } else if (successCount === 0) {
      this.notification.error('Thông báo', `Lưu thất bại ${errorCount}/${totalProducts} sản phẩm`);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, `Đã lưu ${successCount} sản phẩm thành công, ${errorCount} sản phẩm thất bại`);
    }
    this.closeExcelModal();
  }
  // Hàm helper để lấy ID của đơn vị tính từ tên
  private getUnitIdByName(unitName: string): number {
    const unit = this.listUnitCount.find(u => u.UnitName === unitName);
    return unit ? unit.ID : 0;
  }

  // Hàm helper để lấy ID của hãng từ tên
  private getSourceIdByName(sourceCode: string): number {
    const source = this.listSourceAsset.find(s => s.SourceCode === sourceCode);
    return source ? source.ID : 0;
  }
  // Hàm helper để lấy ID của ProductGroup từ tên
  private getTypeIdByName(typeName: string): number {
    const type = this.listTypeAsset.find(t => t.TypeName === typeName);
    return type ? type.ID : 0;
  }
  private getEmployeeIDByName(Name: string) {
    const emp = this.emPloyeeLists.find(t => t.FullName == Name);
    return emp ? emp.ID : 0;

  }
  private getDepartmentIDByName(dpmName: string) {
    const dpm = this.emPloyeeLists.find(t => t.DepartmentName == dpmName);
    return dpm ? dpm.ID : 0;

  }
  // Hàm helper để lấy ID của Location từ tên
  // Hàm để lấy danh sách đơn vị, ProductGroup và Location
  private loadUnit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.listUnitCount = res.data;
      console.log(this.listUnitCount);
    });
    this.soucerService.getAssets().subscribe((response: any) => {
      this.listSourceAsset = response.data;
      console.log(this.listSourceAsset);
    });
    this.typeAssetsService.getTypeAssets().subscribe((resppon: any) => {
      this.listTypeAsset = resppon.data;
      console.log(this.listTypeAsset);
    });
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.tsAssetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
    });
    this.assetsManagementService.getAssetAllocationDetail(1).subscribe({
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