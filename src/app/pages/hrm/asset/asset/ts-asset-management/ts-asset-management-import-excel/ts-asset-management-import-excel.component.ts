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
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
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
    private AssetsManagementService: AssetsManagementService,
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
        height: '40vh',
        paginationMode: 'local',
        columns: [
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
          { title: 'Mã tài sản', field: 'TSCodeNCC', hozAlign: 'left' },
          { title: 'Tên tài sản', field: 'TSAssetName', hozAlign: 'left' },
          { title: 'Mã loại tài sản', field: 'AssetCode', hozAlign: 'left' },
          { title: 'Tên loại', field: 'AssetType', hozAlign: 'left' },
          { title: 'Mã nguồn gốc tài sản', field: 'SourceCode', hozAlign: 'left' },
          { title: 'Tên nguồn gốc', field: 'SourceName', hozAlign: 'left' },


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
        { title: headers[1] || 'Mã tài sản', field: 'TSCodeNCC', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[2] || 'Tên tài sản', field: 'TSAssetName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[3] || 'Mã loại tài sản', field: 'AssetCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[4] || 'Mã nguồn gốc tài sản', field: 'SourceCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[5] || 'Mô tả chi tiết (Model, thông số kỹ thuật…)', field: 'SpecificationsAsset', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[6] || 'Số seri', field: 'Seri', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[7] || 'Đơn vị tính', field: 'UnitName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[8] || 'Số lượng', field: 'Quantity', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[9] || 'Tình trạng', field: 'Status', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[10] || 'Mã phòng ban', field: 'DepartmentCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[11] || 'Mã nhân viên', field: 'EmployeeCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[12] || 'Người sử dụng', field: 'EmployeeName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: headers[13] || 'Thời gian ghi tăng', field: 'DateBuy', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[14] || 'Thời gian bảo hành (tháng)', field: 'Insurance', hozAlign: 'right', headerHozAlign: 'center' },
        { title: headers[15] || 'Hiệu lực từ', field: 'DateEffect', hozAlign: 'center', headerHozAlign: 'center', formatter: formatDateCell },
        { title: headers[16] || 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' },
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
              TSCodeNCC: getCellText(row.getCell(2)),   // Mã tài sản
              TSAssetName: getCellText(row.getCell(3)),   // Tên tài sản

              AssetCode: getCellText(row.getCell(4)),     // Mã loại tài sản

              SourceCode: getCellText(row.getCell(5)),    // Mã nguồn gốc tài sản
              // Mã nhà cung cấp

              SpecificationsAsset: getCellText(row.getCell(6)), // Mô tả chi tiết
              Seri: getCellText(row.getCell(7)),                // Số seri

              UnitName: getCellText(row.getCell(8)),      // Đơn vị tính
              Quantity: getCellText(row.getCell(9)),     // Số lượng
              Status: getCellText(row.getCell(10)),       // Tình trạng

              DepartmentCode: getCellText(row.getCell(11)), // Mã phòng ban
              EmployeeCode: getCellText(row.getCell(12)),   // Mã nhân viên
              EmployeeName: getCellText(row.getCell(13)),   // Người sử dụng

              DateBuy: getCellText(row.getCell(14)),     // Thời gian ghi tăng
              Insurance: getCellText(row.getCell(15)),   // Thời gian bảo hành (Tháng)
              DateEffect: getCellText(row.getCell(16)),  // Hiệu lực từ
              Note: getCellText(row.getCell(17)),        // Ghi chú
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
  nextCode: string = '';
  // Cache để lưu code cao nhất đã dùng cho mỗi ngày trong session
  private usedCodesCache = new Map<string, string>(); // key: date (YYYY-MM-DD), value: lastUsedCode

  private async getAssetCodeInfo(rawDate: string): Promise<{ code: string; maxSTT: number }> {
    try {
      const iso = formatDate(rawDate) || new Date().toISOString().split('T')[0];
  
      const res: any = await firstValueFrom(
        this.assetsManagementService.getAssetCode(iso)
      );
  
      let apiCode = res?.data ?? '';
      
      console.log('🔍 API getAssetCode response:', {
        date: iso,
        apiCode: apiCode,
        maxSTT: res?.maxSTT,
        cachedCode: this.usedCodesCache.get(iso)
      });
  
      // Kiểm tra xem có code đã dùng trong cache không
      const cachedCode = this.usedCodesCache.get(iso);
      if (cachedCode && apiCode) {
        // So sánh code từ API vs code đã dùng trong cache
        const apiNumber = this.extractCodeNumber(apiCode);
        const cachedNumber = this.extractCodeNumber(cachedCode);
        
        if (cachedNumber >= apiNumber) {
          // Cache có code cao hơn → dùng code tiếp theo từ cache
          const nextCode = this.incrementCode(cachedCode);
          console.log('⚠️ Cache có code cao hơn API. Dùng code từ cache:', {
            apiCode,
            cachedCode,
            nextCode
          });
          apiCode = nextCode;
        }
      }
  
      return {
        code: apiCode,
        maxSTT: res?.maxSTT ?? 0
      };
    } catch (e) {
      console.error('Lỗi khi lấy mã tài sản (code + maxSTT):', e);
      return { code: '', maxSTT: 0 };
    }
  }
  
  // Helper: Extract số từ code
  private extractCodeNumber(code: string): number {
    const match = code.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  // Helper: Tăng code lên 1
  private incrementCode(code: string): string {
    const match = code.match(/(\d+)$/);
    if (!match) return code;
    
    const numberPart = match[1];
    const prefix = code.slice(0, -numberPart.length);
    const nextNumber = parseInt(numberPart, 10) + 1;
    const padded = nextNumber.toString().padStart(numberPart.length, '0');
    
    return prefix + padded;
  }
  
  async generateTSAssetCode(rawDate: string): Promise<string> {
    const { code } = await this.getAssetCodeInfo(rawDate);
    return code;
  }
  
  private buildAssetCode(baseCode: string, offset: number): string {
    if (!baseCode) return '';

    const match = baseCode.match(/(\d+)$/);
    if (!match) {
      // Không tìm được phần số ở cuối thì trả luôn baseCode (hoặc xử lý khác tùy mày)
      return baseCode;
    }

    const numberPart = match[1];                 // '00001'
    const prefix = baseCode.slice(0, -numberPart.length); // 'TS01012025'
    const current = parseInt(numberPart, 10);   // 1
    const next = current + offset;              // + offset
    const padded = next.toString().padStart(numberPart.length, '0');

    return prefix + padded;
  }
  async saveExcelData() {
    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }
  
    const validDataToSave = this.dataTableExcel.filter(row => {
      const stt = row.STT;
      return typeof stt === 'number'
        || (typeof stt === 'string' && !isNaN(parseFloat(stt)) && isFinite(parseFloat(stt)));
    });
  
    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ (STT là số) để lưu!');
      this.displayProgress = 0;
      this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      return;
    }
  
    const totalAssetsToSave = validDataToSave.length;
    this.displayProgress = 10;
    this.displayText = `Đang chuẩn bị dữ liệu: ${totalAssetsToSave} bản ghi`;
  
    const notifKey = 'asset-import-progress';
    this.notification.info(
      'Đang lưu dữ liệu',
      `Đang gửi ${totalAssetsToSave} bản ghi lên server...`,
      { nzKey: notifKey, nzDuration: 0 }
    );
  
    // 1) Group theo ngày ghi tăng (ISO)
    const groups = new Map<string, any[]>();
  
    for (const row of validDataToSave) {
      const iso = formatDate(row.DateBuy) || new Date().toISOString().split('T')[0];
      if (!groups.has(iso)) {
        groups.set(iso, []);
      }
      groups.get(iso)!.push(row);
    }
  
    const groupEntries = Array.from(groups.entries());
    if (groupEntries.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để lưu!');
      return;
    }
  
    const tSAssetManagements: any[] = [];
  
    // 2) Lấy code + maxSTT từ group đầu tiên
    const [firstIsoDate, firstRows] = groupEntries[0];
    
    console.log('📅 Đang lấy code cho ngày:', firstIsoDate);
    const { code: firstBaseCode, maxSTT } = await this.getAssetCodeInfo(firstIsoDate);
    console.log('✅ Code nhận được từ API:', firstBaseCode, '| maxSTT:', maxSTT);
  
    if (!firstBaseCode) {
      this.notification.error('Thông báo', 'Không lấy được mã tài sản từ server.');
      return;
    }
  
    let currentSTT = maxSTT; // DB hiện tại, sẽ ++ cho từng bản ghi
  
    const processGroup = (rows: any[], baseCode: string, groupOffset: number) => {
      rows.forEach((row, idx) => {
        // Dùng groupOffset + idx để tính code cho group này
        const code = this.buildAssetCode(baseCode, groupOffset + idx);
  
        currentSTT += 1; // STT: maxSTT + 1, +2, ...
  
        console.log(`Bản ghi: Code=${code}, STT=${currentSTT}, BaseCode=${baseCode}, Offset=${groupOffset + idx}`);
  
        tSAssetManagements.push({
          ID: 0,
          STT: currentSTT,
          TSAssetCode: code || '',
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
        });
      });
    };
  
    // Track offset cho từng baseCode để tránh trùng lặp
    const baseCodeOffsets = new Map<string, number>();
    
    // 3) Xử lý group đầu tiên với baseCode + maxSTT vừa lấy
    baseCodeOffsets.set(firstBaseCode, 0);
    processGroup(firstRows, firstBaseCode, 0);
    baseCodeOffsets.set(firstBaseCode, firstRows.length); // Update offset sau khi xử lý
  
    // 4) Các group còn lại: chỉ cần code theo ngày, STT vẫn dùng currentSTT đang tăng dần
    for (let i = 1; i < groupEntries.length; i++) {
      const [isoDate, rows] = groupEntries[i];
      const baseCode = await this.generateTSAssetCode(isoDate); // chỉ lấy code, kệ maxSTT
  
      if (!baseCode) {
        console.warn('Không lấy được mã tài sản cho ngày', isoDate);
        continue;
      }
  
      // Lấy offset hiện tại cho baseCode này (nếu đã dùng trước đó)
      const currentOffset = baseCodeOffsets.get(baseCode) || 0;
      processGroup(rows, baseCode, currentOffset);
      // Cập nhật offset cho baseCode này
      baseCodeOffsets.set(baseCode, currentOffset + rows.length);
    }
  
    // Cập nhật cache với code cao nhất đã dùng
    tSAssetManagements.forEach(item => {
      if (item.TSAssetCode && item.DateBuy) {
        const dateKey = formatDate(item.DateBuy) || '';
        if (dateKey) {
          const currentCached = this.usedCodesCache.get(dateKey);
          if (!currentCached || this.extractCodeNumber(item.TSAssetCode) > this.extractCodeNumber(currentCached)) {
            this.usedCodesCache.set(dateKey, item.TSAssetCode);
          }
        }
      }
    });
    
    console.log('💾 Cache sau khi xử lý:', Object.fromEntries(this.usedCodesCache));
  
    const payload = { tSAssetManagements };
  
    this.displayProgress = 30;
    this.displayText = `Đang gửi ${totalAssetsToSave} bản ghi...`;
    console.log('Payload import excel', payload);
  
    this.assetsManagementService.saveDataAsset(payload).subscribe({
      next: (response: any) => {
        console.log('=== Response từ API saveDataAsset ===', response);
        console.log('response.status:', response?.status);
        console.log('response.data:', response?.data);
        
        // Đếm số bản ghi có ID trong response (đã lưu thành công)
        let successCount = 0;
        let errorCount = 0;
        
        // Backend trả về status chữ thường
        if (response?.status === 1) {
          // Nếu API trả về status = 1, nghĩa là thành công
          // Kiểm tra xem response.data có tSAssetManagements không
          const assetData = response.data;
          
          if (assetData && assetData.tSAssetManagements && Array.isArray(assetData.tSAssetManagements)) {
            console.log('Tìm thấy tSAssetManagements array:', assetData.tSAssetManagements);
            console.log('Số phần tử:', assetData.tSAssetManagements.length);
            
            // Đếm số bản ghi có ID > 0 (đã được lưu vào DB)
            const itemsWithId = assetData.tSAssetManagements.filter((item: any) => {
              const hasValidId = item && item.ID && item.ID > 0;
              if (!hasValidId) {
                console.warn('Item không có ID hợp lệ:', item);
              }
              return hasValidId;
            });
            
            successCount = itemsWithId.length;
            errorCount = totalAssetsToSave - successCount;
            
            console.log('Số bản ghi có ID > 0:', successCount);
            console.log('Chi tiết các ID:', itemsWithId.map((item: any) => item.ID));
            console.log(`✅ Tổng kết: ${successCount}/${totalAssetsToSave} thành công, ${errorCount} thất bại`);
          } else {
            // Nếu API trả về status = 1 nhưng không có array chi tiết
            // Có thể backend chưa trả về data đầy đủ, coi như tất cả thành công
            console.warn('⚠️ API trả về status = 1 nhưng không có tSAssetManagements array');
            console.log('Cấu trúc response.data:', assetData ? Object.keys(assetData) : 'null');
            console.log('Coi như tất cả bản ghi đã lưu thành công');
            successCount = totalAssetsToSave;
            errorCount = 0;
          }
        } else {
          // Nếu status !== 1, coi như thất bại
          console.error('❌ API trả về status !== 1:', response?.status);
          successCount = 0;
          errorCount = totalAssetsToSave;
        }
  
        this.displayProgress = 100;
        this.displayText = `Đã xử lý ${totalAssetsToSave}/${totalAssetsToSave} bản ghi`;
  
        this.notification.remove(notifKey);
  
        // Hiển thị thông báo dựa trên số bản ghi có ID
        if (successCount > 0) {
          if (successCount === totalAssetsToSave) {
            this.notification.success(
              'Thông báo',
              `Đã lưu ${successCount}/${totalAssetsToSave} bản ghi thành công`
            );
          } else {
            this.notification.warning(
              'Thông báo',
              `Đã lưu ${successCount}/${totalAssetsToSave} bản ghi thành công. ${errorCount} bản ghi thất bại.`
            );
          }
        } else {
          const backendMsg =
            response?.message ||
            response?.data?.message ||
            response?.error?.message ||
            'Lưu dữ liệu thất bại.';
  
          this.notification.error(
            'Thông báo',
            `${backendMsg}`
          );
        }
  
        // Refresh table nếu có ít nhất 1 bản ghi thành công
        if (successCount > 0 && this.table) {
          console.log('Refreshing table after successful import...');
          this.table.replaceData();
        }
        
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
          'Thông báo',
          `${backendMsg} (thất bại ${totalAssetsToSave}/${totalAssetsToSave} bản ghi)`
        );
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
