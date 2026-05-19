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

  // Thử d-M-yyyy
  dt = DateTime.fromFormat(str, 'd-M-yyyy');
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
      this.filePath = file.name;
      this.excelSheets = [];
      this.selectedSheet = '';
      this.dataTableExcel = [];
      this.totalRowsAfterFileRead = 0;
      this.processedRowsForSave = 0;

      this.displayProgress = 0;
      this.displayText = 'Đang đọc file...';
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
          this.excelSheets = workbook.worksheets.map(sheet => sheet.name);
          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
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
              }, minDisplayTime - elapsedTime);
            } else {
              // Nếu quá trình xử lý đã đủ lâu, cập nhật ngay lập tức
              this.displayProgress = 0;
              if (this.totalRowsAfterFileRead === 0) {
                this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
              } else {
                this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
              }
            }
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'File Excel không có sheet nào!');
            this.resetExcelImportState();
          }
        } catch (error) {
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
  // Mapping từ title Excel sang field name
  private getFieldFromHeader(headerTitle: string): string {
    const normalized = this.normalizeHeader(headerTitle);

    // Mapping các cột từ export Excel
    if (normalized.includes('stt')) return 'STT';
    if (normalized.includes('mã tài sản') && !normalized.includes('ncc')) return 'TSCodeNCC';
    if (normalized.includes('mã tài sản ncc') || (normalized.includes('mã tài sản') && normalized.includes('ncc'))) return 'TSCodeNCC';
    if (normalized.includes('mã ncc')) return 'SupplierCode';
    if (normalized === 'mã tài sản') return 'TSCodeNCC';

    if (normalized.includes('office active')) return 'OfficeActiveStatusText';
    if (normalized.includes('windows active')) return 'WindowActiveStatusText';
    if (normalized.includes('tên tài sản')) return 'TSAssetName';
    if (normalized.includes('seri')) return 'Seri';
    if (normalized.includes('đơn vị') || normalized === 'đvt') return 'UnitName';
    if (normalized.includes('thông số')) return 'SpecificationsAsset';
    if (normalized.includes('model')) return 'Model';
    if (normalized.includes('ngày mua') || normalized.includes('thời gian mua') || normalized.includes('thời gian ghi tăng')) return 'DateBuy';
    if (normalized.includes('ngày hiệu lực') || normalized.includes('thời gian hiệu lực')) return 'DateEffect';
    if (normalized.includes('bảo hành')) return 'Insurance';
    if (normalized === 'mã loại') return 'AssetCode';
    if (normalized.includes('tên loại') || normalized.includes('loại tài sản') || normalized === 'loại') return 'AssetType';
    if (normalized.includes('phòng ban') || normalized === 'mã phòng ban' || normalized === 'tên phòng ban' || normalized.includes('bộ phận')) return 'Name';
    if (normalized.includes('trạng thái') || normalized.includes('tình trạng')) return 'Status';
    if (normalized.includes('nguồn gốc') || normalized === 'mã nguồn gốc' || normalized === 'tên nguồn gốc') return 'SourceName';
    if (normalized.includes('người quản lý') || normalized.includes('người sử dụng') || normalized.includes('nhân viên') || normalized.includes('họ tên')) return 'FullName';
    if (normalized.includes('cấp phát')) return 'IsAllocation';
    if (normalized.includes('mô tả chi tiết')) return 'SpecificationsAsset';
    if (normalized.includes('ghi chú')) return 'Note';

    // Mặc định trả về header gốc
    return headerTitle;
  }

  async readExcelData(workbook: ExcelJS.Workbook, sheetName: string) {
    try {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) throw new Error(`Sheet "${sheetName}" không tồn tại.`);

      // Đọc header từ dòng đầu tiên (row 1)
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      const headerToFieldMap: Map<number, string> = new Map();

      headerRow.eachCell((cell, colNumber) => {
        const headerText = getCellText(cell);
        headers[colNumber - 1] = headerText;
        const fieldName = this.getFieldFromHeader(headerText);
        headerToFieldMap.set(colNumber, fieldName);
      });

      // Tạo columns cho Tabulator dựa trên header
      const columns: ColumnDefinition[] = headers.map((header, index) => {
        const fieldName = headerToFieldMap.get(index + 1) || `col_${index}`;
        return {
          title: header || `Cột ${index + 1}`,
          field: fieldName,
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: (fieldName === 'DateBuy' || fieldName === 'DateEffect') ? formatDateCell : undefined
        };
      });

      if (this.tableExcel) {
        this.tableExcel.setColumns(columns);
      }

      const data: any[] = [];
      let validRecords = 0;

      // Data bắt đầu từ hàng thứ 2 (sau header)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Kiểm tra xem dòng có rỗng không
          let isEmptyRow = true;
          for (let i = 1; i <= headers.length; i++) {
            const cellValue = row.getCell(i).value;
            if (cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '') {
              isEmptyRow = false;
              break;
            }
          }

          if (!isEmptyRow) {
            const rowData: any = {};

            // Đọc dữ liệu theo mapping
            headerToFieldMap.forEach((fieldName, colNumber) => {
              const cell = row.getCell(colNumber);
              let cellValue = getCellText(cell);

              // Xử lý đặc biệt cho Model - nếu là số dạng scientific notation, chuyển về string
              if (fieldName === 'Model') {
                const cellRawValue = cell.value;
                // Nếu là số dạng scientific notation, chuyển về string đầy đủ
                if (typeof cellRawValue === 'number') {
                  // Kiểm tra xem có phải scientific notation không
                  if (cellValue.includes('E+') || cellValue.includes('e+')) {
                    // Chuyển số về string đầy đủ
                    cellValue = cellRawValue.toFixed(0);
                  } else {
                    cellValue = String(cellRawValue);
                  }
                } else {
                  cellValue = String(cellValue || '');
                }
              }

              // Xử lý đặc biệt cho một số trường
              if (fieldName === 'IsAllocation') {
                rowData[fieldName] = (cellValue === 'Có' || cellValue === 'Yes' || cellValue === '1' || cellValue === 'true');
              } else if (fieldName === 'DateBuy' || fieldName === 'DateEffect') {
                // Chuyển đổi date từ format Excel
                rowData[fieldName] = formatDate(cellValue) || cellValue;
              } else if (fieldName === 'Insurance' || fieldName === 'STT') {
                // Chuyển đổi số
                const numValue = parseFloat(cellValue);
                rowData[fieldName] = isNaN(numValue) ? (fieldName === 'Insurance' ? 0 : '') : numValue;
              } else {
                rowData[fieldName] = cellValue;
              }
            });

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
    } catch (error) {
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet!');
      this.resetExcelImportState();
    }
  }

  onSheetChange() {
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
          } catch (error) {
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

      // Kiểm tra xem có code đã dùng trong cache không
      const cachedCode = this.usedCodesCache.get(iso);
      if (cachedCode && apiCode) {
        // So sánh code từ API vs code đã dùng trong cache
        const apiNumber = this.extractCodeNumber(apiCode);
        const cachedNumber = this.extractCodeNumber(cachedCode);

        if (cachedNumber >= apiNumber) {
          // Cache có code cao hơn → dùng code tiếp theo từ cache
          const nextCode = this.incrementCode(cachedCode);
          apiCode = nextCode;
        }
      }

      return {
        code: apiCode,
        maxSTT: res?.maxSTT ?? 0
      };
    } catch (e) {
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
    const { code: firstBaseCode, maxSTT } = await this.getAssetCodeInfo(firstIsoDate);

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

        // Xử lý trạng thái
        let statusID = 1;
        let statusText = 'Chưa sử dụng';
        if (row.Status) {
          const statusLower = String(row.Status).toLowerCase();
          if (statusLower.includes('đang sử dụng')) {
            statusID = 2;
            statusText = 'Đang sử dụng';
          } else if (statusLower.includes('đã thu hồi')) {
            statusID = 3;
            statusText = 'Đã thu hồi';
          } else if (statusLower.includes('hỏng')) {
            statusID = 3;
            statusText = 'Hỏng';
          } else if (statusLower.includes('mất')) {
            statusID = 4;
            statusText = 'Mất';
          } else if (statusLower.includes('thanh lý')) {
            statusID = 6;
            statusText = 'Thanh lý';
          } else if (statusLower.includes('đề nghị thanh lý')) {
            statusID = 7;
            statusText = 'Đề nghị thanh lý';
          } else if (statusLower.includes('sửa chữa') || statusLower.includes('bảo dưỡng')) {
            statusID = 5;
            statusText = 'Sữa chữa, Bảo dưỡng';
          }
        }

        // Xử lý Office/Windows Active Status
        let officeActiveStatus = null;
        let windowActiveStatus = null;
        if (row.OfficeActiveStatusText) {
          const officeText = String(row.OfficeActiveStatusText).toLowerCase();
          if (officeText.includes('đã active') || officeText.includes('đã kích hoạt')) {
            officeActiveStatus = 2;
          } else if (officeText.includes('chưa active') || officeText.includes('chưa kích hoạt')) {
            officeActiveStatus = 1;
          } else if (officeText.includes('crack')) {
            officeActiveStatus = 3;
          }
        }
        if (row.WindowActiveStatusText) {
          const windowText = String(row.WindowActiveStatusText).toLowerCase();
          if (windowText.includes('đã active') || windowText.includes('đã kích hoạt')) {
            windowActiveStatus = 2;
          } else if (windowText.includes('chưa active') || windowText.includes('chưa kích hoạt')) {
            windowActiveStatus = 1;
          } else if (windowText.includes('crack')) {
            windowActiveStatus = 3;
          }
        }

        // Lấy các ID từ tên
        const unitName = row.UnitName || '';
        const sourceName = row.SourceName || '';
        const assetType = row.AssetType || row.AssetCode || '';
        const employeeName = row.FullName || row.EmployeeName || '';
        const departmentName = row.Name || row.DepartmentName || '';

        tSAssetManagements.push({
          ID: 0,
          STT: currentSTT,
          TSAssetCode: code || '',
          TSAssetName: row.TSAssetName || '',
          Model: row.Model || '',
          IsAllocation: row.IsAllocation === true || row.IsAllocation === 'Có' || row.IsAllocation === 'Yes' || false,
          UnitID: this.getUnitIdByName(unitName),
          Seri: row.Seri || '',
          SpecificationsAsset: row.SpecificationsAsset || '',
          DateBuy: formatDate(row.DateBuy),
          DateEffect: formatDate(row.DateEffect),
          Insurance: Number(row.Insurance) || 0,
          TSCodeNCC: row.TSCodeNCC || '',
          OfficeActiveStatus: officeActiveStatus,
          WindowActiveStatus: windowActiveStatus,
          Note: row.Note || '',
          StatusID: statusID,
          SourceID: this.getSourceIdByName(sourceName),
          TSAssetID: this.getTypeIdByName(assetType),
          Status: statusText,
          EmployeeID: this.getEmployeeIDByName(employeeName),
          SupplierID: 0,
          DepartmentID: this.getDepartmentIDByName(departmentName),
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

    const payload = { tSAssetManagements };

    this.displayProgress = 30;
    this.displayText = `Đang gửi ${totalAssetsToSave} bản ghi...`;

    this.assetsManagementService.saveDataAsset(payload).subscribe({
      next: (response: any) => {

        // Đếm số bản ghi có ID trong response (đã lưu thành công)
        let successCount = 0;
        let errorCount = 0;

        // Backend trả về status chữ thường
        if (response?.status === 1) {
          // Nếu API trả về status = 1, nghĩa là thành công
          // Kiểm tra xem response.data có tSAssetManagements không
          const assetData = response.data;

          if (assetData && assetData.tSAssetManagements && Array.isArray(assetData.tSAssetManagements)) {

            // Đếm số bản ghi có ID > 0 (đã được lưu vào DB)
            const itemsWithId = assetData.tSAssetManagements.filter((item: any) => {
              const hasValidId = item && item.ID && item.ID > 0;
              return hasValidId;
            });

            successCount = itemsWithId.length;
            errorCount = totalAssetsToSave - successCount;
          } else {
            successCount = totalAssetsToSave;
            errorCount = 0;
          }
        } else {
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
          this.table.replaceData();
        }

        this.closeExcelModal();
      },
      error: (err: any) => {
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

  // Hàm helper để lấy ID của hãng từ tên hoặc code
  private getSourceIdByName(sourceNameOrCode: string): number {
    if (!sourceNameOrCode) return 0;
    // Tìm theo SourceName trước
    let source = this.listSourceAsset.find(s => s.SourceName === sourceNameOrCode);
    if (source) return source.ID;
    // Nếu không tìm thấy, tìm theo SourceCode
    source = this.listSourceAsset.find(s => s.SourceCode === sourceNameOrCode);
    return source ? source.ID : 0;
  }
  // Hàm helper để lấy ID của loại tài sản từ tên hoặc mã
  getTypeIdByName(typeName: string): number {
    if (!typeName) return 0;
    const search = typeName.toString().trim().toLowerCase();
    const type = this.listTypeAsset.find(t =>
      (t.AssetType && t.AssetType.toString().trim().toLowerCase() === search) ||
      (t.AssetCode && t.AssetCode.toString().trim().toLowerCase() === search)
    );
    return type ? type.ID : 0;
  }
  private getEmployeeIDByName(Name: string) {
    if (!Name) return 0;
    const search = Name.toString().trim().toLowerCase();
    const emp = this.emPloyeeLists.find(t =>
      (t.FullName && t.FullName.toString().trim().toLowerCase() === search) ||
      (t.EmployeeCode && t.EmployeeCode.toString().trim().toLowerCase() === search)
    );
    return emp ? emp.ID : 0;

  }
  private getDepartmentIDByName(dpmName: string) {
    if (!dpmName) return 0;
    const search = dpmName.toString().trim().toLowerCase();
    const dpm = this.emPloyeeLists.find(t =>
      (t.DepartmentName && t.DepartmentName.toString().trim().toLowerCase() === search) ||
      (t.DepartmentCode && t.DepartmentCode.toString().trim().toLowerCase() === search)
    );
    return dpm ? (dpm.DepartmentID || dpm.ID) : 0;

  }
  // Hàm helper để lấy ID của Location từ tên
  // Hàm để lấy danh sách đơn vị, ProductGroup và Location
  private loadUnit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.listUnitCount = res.data;
    });
    this.soucerService.getAssets().subscribe((response: any) => {
      this.listSourceAsset = response.data;
    });
    this.typeAssetsService.getTypeAssets().subscribe((resppon: any) => {
      this.listTypeAsset = resppon.data;
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
  }
  closeExcelModal() {
    this.modalService.dismissAll(true);
  }
}