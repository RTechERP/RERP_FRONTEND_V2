import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProjectPartListService } from '../../project-partlist-service/project-part-list-service.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../../../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../../tabulator-default.config';
import { ImportExcelDiffComponent } from './import-excel-diff/import-excel-diff.component';
import { ImportExcelSaveComponent } from './import-excel-save/import-excel-save.component';

@Component({
  selector: 'app-import-excel-partlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzProgressModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzTableModule,
    NzIconModule
  ],
  templateUrl: './import-excel-partlist.component.html',
  styleUrls: ['./import-excel-partlist.component.css']
})
export class ImportExcelPartlistComponent implements OnInit, AfterViewInit {

  @Input() projectId = 0;
  @Input() versionId = 0;
  @Input() versionCode = '';
  @Input() projectCode = '';
  @Input() projectSolutionId = 0;
  @Input() projectTypeId = 0;
  @Input() projectTypeName = '';

  filePath: string = '';
  excelSheets: string[] = [];
  selectedSheet: string = '';
  tableExcel: any;
  dataTableExcel: any[] = [];
  workbook: ExcelJS.Workbook | null = null;

  // Biến hiển thị chính trên thanh tiến trình
  displayProgress: number = 0; // % hiển thị trên thanh
  displayText: string = '0/0'; // Text hiển thị trên thanh

  totalRowsAfterFileRead: number = 0; // Tổng số dòng dữ liệu hợp lệ sau khi đọc file
  processedRowsForSave: number = 0; // Số dòng đã được xử lý khi lưu vào DB

  currentUser: any;
  isAdmin: boolean = false;

  // Các biến mới cho dropdown và checkbox
  listVersions: any[] = []; // Danh sách phiên bản
  selectedVersion: number = 0; // Phiên bản đã chọn
  isProblemRow: boolean = false; // Checkbox Hàng phát sinh
  isUpdate: boolean = false; // Checkbox Update
  isStock: boolean = false;
  checkPayload: any;

  // Biến cho import check
  diffs: any[] = []; // Danh sách các diff từ API import-check
  showDiffModal: boolean = false; // Hiển thị modal diff chi tiết (BƯỚC 2) - để chọn Excel/Stock
  validDataToSaveForDiff: any[] = []; // Lưu validDataToSave để dùng khi mở modal 2
  dataDiff: any[] = []; // Lưu dataDiff để dùng khi mở modal 3
  isSaving: boolean = false; // Trạng thái đang lưu - dùng để disable nút
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private partlistService: ProjectPartListService,
    public activeModal: NgbActiveModal,
    private authService: AuthService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit() {
    // Load danh sách phiên bản
    this.loadVersions();

    // Set giá trị mặc định cho selectedVersion
    if (this.versionId > 0) {
      this.selectedVersion = this.versionId;
    }

    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res?.data;
      this.isAdmin = this.currentUser?.IsAdmin === true;
    });
  }

  // Load danh sách phiên bản
  loadVersions(): void {
    if (this.projectSolutionId <= 0) {
      return;
    }

    let solutionVersions: any[] = [];
    let poVersions: any[] = [];
    let loadedCount = 0;

    const checkAndMergeVersions = () => {
      loadedCount++;
      if (loadedCount === 2) {
        this.listVersions = [...solutionVersions, ...poVersions];
      }
    };

    // Load phiên bản giải pháp
    this.partlistService.getProjectPartListVersion(this.projectSolutionId, false).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          solutionVersions = (response.data || []).map((v: any) => ({
            ID: v.ID,
            Code: v.Code,
            Name: `${v.Code} - Giải pháp-${v.ProjectTypeName.trim()}`
          }));
        }
        checkAndMergeVersions();
      },
      error: (error: any) => {
        console.error('Error loading solution versions:', error);
        checkAndMergeVersions();
      }
    });

    // Load phiên bản PO
    this.partlistService.getProjectPartListVersion(this.projectSolutionId, true).subscribe({
      next: (poResponse: any) => {
        if (poResponse.status === 1) {
          poVersions = (poResponse.data || []).map((v: any) => ({
            ID: v.ID,
            Code: v.Code,
            Name: `${v.Code} - PO-${v.ProjectTypeName.trim()}`
          }));
        }
        checkAndMergeVersions();
      },
      error: (error: any) => {
        console.error('Error loading PO versions:', error);
        checkAndMergeVersions();
      }
    });
  }

  ngAfterViewInit() {
    this.initTable();
  }

  initTable() {
    if (!this.tableExcel) {
      const columns = this.getTableColumns();
      this.tableExcel = new Tabulator('#partlistTable', {
        data: this.dataTableExcel,
        layout: 'fitDataStretch',
        height: '300px',
        selectableRows: false,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        columns: columns as any
      });

      // Cập nhật dataTableExcel khi user chỉnh sửa dữ liệu trong bảng
      this.tableExcel.on('cellEdited', (cell: any) => {
        const rowData = cell.getRow().getData();
        const rowIndex = this.dataTableExcel.findIndex((row: any) => row === cell.getRow().getData());
        if (rowIndex !== -1) {
          this.dataTableExcel[rowIndex] = { ...rowData };
        }
      });
    } else {
      // Nếu table đã tồn tại, update columns để enable editing
      const columns = this.getTableColumns();
      this.tableExcel.setColumns(columns as any);
    }
  }

  getTableColumns() {
    // Cho phép edit luôn (không cần admin)
    const editable = true;
    return [
      { title: "TT", field: "TT", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Tên VT", field: "GroupMaterial", hozAlign: "left", headerHozAlign: "center", formatter: 'textarea', editor: editable ? "input" : false },
      { title: "Mã VT", field: "ProductCode", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Mã đặt hàng", field: "OrderCode", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Mã đặc biệt", field: "SpecialCode", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Hãng SX", field: "Manufacturer", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Thông số kỹ thuật", field: "Model", hozAlign: "left", headerHozAlign: "center", formatter: 'textarea', editor: editable ? "input" : false },
      { title: "Số lượng/1 máy", field: "QtyMin", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "Số lượng tổng", field: "QtyFull", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "Đơn vị", field: "Unit", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Đơn giá KT nhập", field: "Price", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "Thành tiền KT nhập", field: "Amount", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "Tiến độ", field: "LeadTime", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Nhà cung cấp", field: "NCC", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Ngày yêu cầu đặt hàng", field: "RequestDate", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Thời gian giao hàng yêu cầu", field: "LeadTimeRequest", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Số lượng trả lại", field: "QuantityReturn", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "NCC cuối cùng", field: "NCCFinal", hozAlign: "left", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Giá đặt hàng", field: "PriceOrder", hozAlign: "right", headerHozAlign: "center", editor: editable ? "number" : false },
      { title: "Ngày đặt hàng", field: "OrderDate", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Ngày dự kiến trả hàng", field: "ExpectedReturnDate", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Trạng thái", field: "Status", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Chất lượng", field: "Quality", hozAlign: "center", headerHozAlign: "center", editor: editable ? "input" : false },
      { title: "Note", field: "Note", hozAlign: "left", headerHozAlign: "center", formatter: 'textarea', editor: editable ? "textarea" : false },
      { title: "Lý do phát sinh", field: "ReasonProblem", hozAlign: "left", headerHozAlign: "center", formatter: 'textarea', editor: editable ? "textarea" : false },
    ];
  }

  // Mở modal import-excel-diff để hiển thị diff
  openDiffModal() {
    const modalRef = this.ngbModal.open(ImportExcelDiffComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.diffs = this.diffs;
    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.checkExistData();
        }
      },
      (dismissed) => {
        // Modal bị đóng, không làm gì
      }
    );
  }

  openSaveModal() {
    const modalRef = this.ngbModal.open(ImportExcelSaveComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu diff vào modal
    modalRef.componentInstance.dataDiff = this.dataDiff;

    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        // Kiểm tra nếu cần reload bảng partlist
        if (result && result.reloadPartlist) {
          // Cập nhật dataDiff từ modal (nếu có)
          if (result.dataDiff !== undefined) {
            this.dataDiff = result.dataDiff;
          }
          // Nếu không còn dữ liệu diff, đóng modal cha và reload bảng partlist
          if (!this.dataDiff || this.dataDiff.length === 0) {
            // Đóng modal ImportExcelPartlistComponent và truyền kết quả để reload bảng partlist
            this.activeModal.close({ success: true });
          }
        }
      },
      (dismissed) => {
        // Modal bị đóng bằng nút "Đóng", không làm gì (không đóng modal cha)
        // Chỉ cần xử lý logic cần thiết nếu có
      }
    );
  }

  formatProgressText = (percent: number): string => {
    return this.displayText;
  }

  openFileExplorer() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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
      this.workbook = null;

      // Đặt trạng thái ban đầu cho thanh tiến trình: Đang đọc file
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
          this.workbook = new ExcelJS.Workbook();
          await this.workbook.xlsx.load(data);
          console.log('Workbook đã được tải bởi ExcelJS.');

          // Chỉ lấy các sheet visible (bỏ qua sheet ẩn)
          this.excelSheets = this.workbook.worksheets
            .filter(sheet => sheet.state === 'visible')
            .map(sheet => sheet.name);
          console.log('Danh sách sheets visible tìm thấy:', this.excelSheets);

          if (this.excelSheets.length > 0) {
            this.selectedSheet = this.excelSheets[0];
            console.log('Sheet mặc định được chọn:', this.selectedSheet);
            await this.readSheet(this.selectedSheet);

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

  async readSheet(sheetName: string) {
    console.log(`Bắt đầu đọc dữ liệu từ sheet: "${sheetName}"`);
    try {
      const ws = this.workbook?.getWorksheet(sheetName);
      if (!ws) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong workbook.`);
      }

      // Đọc ô D2 và so sánh với projectCode
      let cellD2 = ws.getCell("D2");
      let projectCodeExcel = this.getCellText(cellD2.master ?? cellD2).trim();
      console.log('projectCodeExcel', projectCodeExcel);
      // So sánh với projectCode
      if (projectCodeExcel && this.projectCode && projectCodeExcel !== this.projectCode.trim()) {
        this.notification.error('Thông báo', `Mã dự án excel [${projectCodeExcel}] khác với [${this.projectCode}]. Vui lòng kiểm tra lại`);
        this.resetExcelImportState();
        return;
      }

      const rows: any[] = [];
      const regexTT = /^\d+(\.\d+)*$/;
      let validRecords = 0;

      // Đọc dữ liệu từ hàng thứ 7 trở đi (theo template)
      ws.eachRow((row, rowNum) => {
        if (rowNum < 7) return;

        const cell1 = row.getCell(1);
        const TT = this.getCellText(cell1).trim();

        if (!TT) return;

        // Validate TT bằng regex
        if (!regexTT.test(TT)) return;

        rows.push({
          TT,
          GroupMaterial: this.getCellText(row.getCell(2)),
          ProductCode: this.getCellText(row.getCell(3)),
          OrderCode: this.getCellText(row.getCell(4)),
          Manufacturer: this.getCellText(row.getCell(5)),

          Model: this.getCellText(row.getCell(6)),
          QtyMin: this.parseNumber(row.getCell(7)),
          QtyFull: this.parseNumber(row.getCell(8)),
          Unit: this.getCellText(row.getCell(9)),
          Price: this.parseNumber(row.getCell(10)),
          Amount: this.parseNumber(row.getCell(11)),
          LeadTime: this.getCellText(row.getCell(12)),
          NCC: this.getCellText(row.getCell(13)),
          RequestDate: this.getCellText(row.getCell(14)),
          LeadTimeRequest: this.getCellText(row.getCell(15)),
          QuantityReturn: this.parseNumber(row.getCell(16)),
          NCCFinal: this.getCellText(row.getCell(17)),
          PriceOrder: this.parseNumber(row.getCell(18)),
          OrderDate: this.getCellText(row.getCell(19)),
          ExpectedReturnDate: this.getCellText(row.getCell(20)),
          Status: this.getCellText(row.getCell(21)),
          Quality: this.getCellText(row.getCell(22)),
          Note: this.getCellText(row.getCell(23)),
          ReasonProblem: this.getCellText(row.getCell(24)),
          SpecialCode: this.getCellText(row.getCell(25)),  //TN.Binh update 20251207
        });

        validRecords++;
      });

      this.dataTableExcel = rows;
      this.totalRowsAfterFileRead = validRecords;
      console.log(`Đã đọc ${validRecords} bản ghi hợp lệ từ sheet.`);

      // Cập nhật hiển thị
      this.displayProgress = 0;
      if (this.totalRowsAfterFileRead === 0) {
        this.displayText = 'Không có dữ liệu hợp lệ trong sheet.';
      } else {
        this.displayText = `0/${this.totalRowsAfterFileRead} bản ghi`;
      }

      // Cập nhật Tabulator
      if (this.tableExcel) {
        this.tableExcel.replaceData(this.dataTableExcel);
      } else {
        this.initTable();
      }

    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ sheet:', error);
      this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet! Vui lòng kiểm tra định dạng dữ liệu.');
      this.resetExcelImportState();
    }
  }

  // Helper function để lấy text từ cell Excel (xử lý cả RichText và Formula)
  private getCellText(cell: any): string {
    if (!cell) return '';

    try {
      // Ưu tiên 1: Lấy giá trị đã tính toán từ formula (cell.result)
      if (cell.result !== undefined && cell.result !== null) {
        return String(cell.result);
      }

      // Ưu tiên 2: Lấy text hiển thị (đã được format, bao gồm cả giá trị từ formula)
      if (cell.text !== undefined && cell.text !== null && cell.text !== '') {
        return String(cell.text);
      }
    } catch (e) {
      // Bỏ qua lỗi nếu không thể đọc .result hoặc .text
    }

    try {
      const value = cell.value;
      if (value === null || value === undefined) return '';

      // Xử lý formula object
      if (typeof value === 'object' && value.formula) {
        // Nếu có formula nhưng không có result, thử lấy từ text
        if (cell.text !== undefined && cell.text !== null) {
          return String(cell.text);
        }
        return '';
      }

      // Xử lý richText
      if (typeof value === 'object' && value.richText) {
        if (Array.isArray(value.richText)) {
          return value.richText.map((rt: any) => rt?.text || '').join('');
        }
      }

      if (typeof value === 'object' && 'text' in value && value.text !== null && value.text !== undefined) {
        return String(value.text);
      }

      return String(value);
    } catch (e) {
      return '';
    }
  }

  // Helper function để parse number (xử lý cả Formula)
  private parseNumber(cell: any): number {
    if (!cell) return 0;

    try {
      // Ưu tiên 1: Lấy giá trị đã tính toán từ formula (cell.result)
      if (cell.result !== undefined && cell.result !== null) {
        if (typeof cell.result === 'number') {
          return cell.result;
        }
        // Nếu result là string, parse nó
        const num = parseFloat(String(cell.result).replace(/[,\.]/g, ''));
        if (!isNaN(num)) {
          return num;
        }
      }

      // Ưu tiên 2: Lấy từ cell.value
      let value = cell.value;

      // Xử lý formula object
      if (typeof value === 'object' && value.formula) {
        // Nếu có formula, thử lấy từ result hoặc text
        if (cell.result !== undefined && cell.result !== null) {
          value = cell.result;
        } else if (cell.text !== undefined && cell.text !== null) {
          value = cell.text;
        } else {
          return 0;
        }
      }

      if (typeof value === 'number') return value;
      if (!value) return 0;

      // Xử lý string: loại bỏ dấu phẩy và dấu chấm (nếu là định dạng số)
      const str = String(value).replace(/,/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    } catch (e) {
      return 0;
    }
  }

  // Helper function để parse date - trả về string ISO format hoặc null
  private parseDate(value: any): string | null {
    if (!value) return null;

    // Nếu đã là string date hợp lệ
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      // Thử parse format dd/MM/yyyy hoặc dd-MM-yyyy
      const dateMatch = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }
    }

    // Nếu là Date object
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        return value.toISOString();
      }
    }

    // Nếu không parse được, trả về null
    return null;
  }

  async onSheetChange() {
    console.log('Sheet đã thay đổi thành:', this.selectedSheet);
    if (this.selectedSheet && this.workbook) {
      try {
        await this.readSheet(this.selectedSheet);
        this.displayProgress = 0;
        console.log('Dữ liệu đã được đọc lại sau khi thay đổi sheet.');
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ sheet đã chọn:', error);
        this.notification.error('Thông báo', 'Không thể đọc dữ liệu từ sheet đã chọn!');
        this.resetExcelImportState();
      }
    } else if (!this.workbook) {
      this.notification.warning('Thông báo', 'Vui lòng chọn file Excel trước!');
    }
  }

  saveExcelData() {
    // Set trạng thái đang lưu
    this.isSaving = true;

    // Validate phiên bản (theo logic WinForm dòng 110-114)
    if (!this.selectedVersion || this.selectedVersion <= 0) {
      this.notification.error('Lỗi', 'Vui lòng chọn Phiên bản!');
      this.isSaving = false;
      return;
    }

    // Validate projectCode (required field)
    if (!this.projectCode || this.projectCode.trim() === '') {
      this.notification.error('Lỗi', 'Mã dự án (ProjectCode) là bắt buộc!');
      this.isSaving = false;
      return;
    }

    // Lấy dữ liệu mới nhất từ bảng Tabulator (để đảm bảo có dữ liệu đã chỉnh sửa)
    if (!this.tableExcel) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      this.isSaving = false;
      return;
    }

    // Lấy dữ liệu mới nhất từ bảng
    const currentTableData = this.tableExcel.getData();

    if (!currentTableData || currentTableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      this.isSaving = false;
      return;
    }

    // Cập nhật dataTableExcel với dữ liệu mới nhất từ bảng
    this.dataTableExcel = currentTableData;

    // Validate dữ liệu: chỉ lấy các dòng có TT hợp lệ (regex)
    const regex = /^-?[\d\.]+$/;
    const validDataToSave = currentTableData.filter((row: any) => {
      const tt = row.TT?.toString()?.trim() || '';
      return tt && regex.test(tt);
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để lưu!');
      this.isSaving = false;
      return;
    }
    // if (!this.currentUser.IsAdmin && currentTableData.length > 0) {
    //   const excelProjectCode = currentTableData[0]?.OrderCode?.toString()?.trim() || '';

    //   if (excelProjectCode && excelProjectCode !== this.projectCode.trim()) {
    //     this.notification.warning('Cảnh báo', 'Không đúng Mã dự án!');
    //     return;
    //   }
    // }
    //hàm check validate và check xem có vật tư tích xanh bị khác không
    this.proceedWithImportCheck(validDataToSave);
  }

  // Tiếp tục với import-check
  proceedWithImportCheck(validDataToSave: any[]): void {
    // Reset tiến trình
    debugger;
    this.processedRowsForSave = 0;
    const totalRowsToSave = validDataToSave.length;
    this.displayText = `Đang kiểm tra: 0/${totalRowsToSave} bản ghi`;
    this.displayProgress = 0;

    // Chuẩn bị payload cho import-check 
    this.checkPayload = {
      projectID: this.projectId,
      projectPartListVersionID: this.selectedVersion,
      projectTypeID: this.projectTypeId,
      projectCode: this.projectCode.trim(), // Đảm bảo không có khoảng trắng thừa
      isProblem: this.isProblemRow,
      checkIsStock: null,
      items: validDataToSave.map((row: any) => ({
        TT: row.TT?.toString()?.trim() || "",
        GroupMaterial: row.GroupMaterial?.toString()?.trim() || "",
        ProductCode: row.ProductCode?.toString()?.trim() || "",
        OrderCode: row.OrderCode?.toString()?.trim() || "",
        Manufacturer: row.Manufacturer?.toString()?.trim() || "",
        SpecialCode: row.SpecialCode?.toString()?.trim() || "",
        Model: row.Model?.toString()?.trim() || "",
        QtyMin: row.QtyMin || 0,
        QtyFull: row.QtyFull || 0,
        Unit: row.Unit?.toString()?.trim() || "",
        Price: row.Price || 0,
        Amount: row.Amount || 0,
        LeadTime: row.LeadTime?.toString()?.trim() || "",
        NCC: row.NCC?.toString()?.trim() || "",
        RequestDate: this.parseDate(row.RequestDate),
        LeadTimeRequest: row.LeadTimeRequest?.toString()?.trim() || "",
        QuantityReturn: row.QuantityReturn || 0,
        NCCFinal: row.NCCFinal?.toString()?.trim() || "",
        PriceOrder: row.PriceOrder || 0,
        OrderDate: this.parseDate(row.OrderDate),
        ExpectedReturnDate: this.parseDate(row.ExpectedReturnDate),
        Status: (isNaN(row.Status)) ? 0 : Number(row.Status),
        Quality: row.Quality?.toString()?.trim() || "",
        Note: row.Note?.toString()?.trim() || "",
        ReasonProblem: row.ReasonProblem?.toString()?.trim() || "",
      })),
      diffs: null // Chưa có diffs ở bước check
    };

    // Bước 1: Gọi API import-check để validate
    this.partlistService.importCheck(this.checkPayload).subscribe({
      next: (res: any) => {
        console.log('Response từ import-check API:', res);

        // Kiểm tra lỗi: status = 0 hoặc success = false
        if (res.status === 0 || (res.success === false && !res.needConfirm)) {
          // Có lỗi validate 
          const errorMessage = res.message || res.Message || 'Dữ liệu không hợp lệ!';
          this.notification.error('Lỗi', errorMessage);
          this.displayText = 'Đang kiểm tra dữ liệu...!';
          this.displayProgress = 0;
          return;
        }

        // Có Diff → mở modal diff
        if (res.needConfirm && res.diffs?.length > 0) {
          this.diffs = res.diffs;
          this.validDataToSaveForDiff = validDataToSave;
          this.openDiffModal();   // chỉ mở ở đây
          return;
        }

        // Không có diff
        this.diffs = [];
        this.validDataToSaveForDiff = validDataToSave;
        this.checkExistData(); // chỉ nhảy vào đây
      },
      error: (err: any) => {
        console.error('Lỗi khi gọi import-check API:', err);
        // Xử lý lỗi HTTP (400, 500, etc.)
        let errorMessage = 'Lỗi kết nối server khi kiểm tra dữ liệu!';

        if (err.error) {
          // Nếu có error object từ server
          if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.Message) {
            errorMessage = err.error.Message;
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.notification.error('Lỗi', errorMessage);
        this.displayText = 'Kiểm tra thất bại!';
        this.displayProgress = 0;
      }
    });
  }


  // Hàm tiếp tục lưu sau khi đã validate - sử dụng apply-diff endpoint
  applyDiff(validDataToSave: any[], diffsWithChoose: any[] = []) {
    const totalRowsToSave = validDataToSave.length;
    this.displayText = `Đã lưu: 0/${totalRowsToSave} bản ghi`;
    this.displayProgress = 0;

    // Chuẩn bị payload theo PartlistImportRequestDTO structure (match với user đã sửa)
    const payload = {
      projectID: this.projectId,
      projectPartListVersionID: this.selectedVersion,
      projectTypeID: this.projectTypeId,
      projectCode: this.projectCode.trim(),
      isProblem: this.isProblemRow,
      checkIsStock: null, // Có thể set nếu cần
      items: validDataToSave.map((row: any) => ({
        TT: row.TT?.toString()?.trim() || "",
        GroupMaterial: row.GroupMaterial?.toString()?.trim() || "",
        ProductCode: row.ProductCode?.toString()?.trim() || "",
        OrderCode: row.OrderCode?.toString()?.trim() || "",
        Manufacturer: row.Manufacturer?.toString()?.trim() || "",
        SpecialCode: row.SpecialCode?.toString()?.trim() || "",
        Model: row.Model?.toString()?.trim() || "",
        QtyMin: row.QtyMin || 0,
        QtyFull: row.QtyFull || 0,
        Unit: row.Unit?.toString()?.trim() || "",
        Price: row.Price || 0,
        Amount: row.Amount || 0,
        LeadTime: row.LeadTime?.toString()?.trim() || "",
        NCC: row.NCC?.toString()?.trim() || "",
        RequestDate: this.parseDate(row.RequestDate),
        LeadTimeRequest: row.LeadTimeRequest?.toString()?.trim() || "",
        QuantityReturn: row.QuantityReturn || 0,
        NCCFinal: row.NCCFinal?.toString()?.trim() || "",
        PriceOrder: row.PriceOrder || 0,
        OrderDate: this.parseDate(row.OrderDate),
        ExpectedReturnDate: this.parseDate(row.ExpectedReturnDate),
        Status: (isNaN(row.Status)) ? 0 : Number(row.Status),
        Quality: row.Quality?.toString()?.trim() || "",
        Note: row.Note?.toString()?.trim() || "",
        ReasonProblem: row.ReasonProblem?.toString()?.trim() || "",
      })),
      diffs: diffsWithChoose && diffsWithChoose.length > 0 ? diffsWithChoose : null
    };

    console.log('Dữ liệu gửi đi để apply-diff:', payload);
    this.partlistService.applyDiff(payload).subscribe({
      next: (res: any) => {
        console.log('Response từ apply-diff API:', res);
        debugger;

        if (res.status === 1 || res.success) {
          this.displayProgress = 100;
          this.displayText = `Đã lưu: ${totalRowsToSave}/${totalRowsToSave} bản ghi`;
          this.notification.success('Thành công', res.message || `Đã lưu ${totalRowsToSave} vật tư thành công!`);
          if (res.data.DiffData.length > 0) {
            console.log('Dữ liệu nhận được', res.data.DiffData);
            this.dataDiff = res.data.DiffData;
            this.openSaveModal();
            this.isSaving = false;
            return;
          }

          // Đóng modal và trả về kết quả
          setTimeout(() => {
            this.activeModal.close({ success: true });
          }, 500);
        } else {
          this.notification.error('Lỗi', res.message || 'Lưu dữ liệu thất bại!');
          this.isSaving = false;
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu vật tư:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi lưu dữ liệu!';
        this.notification.error('Thông báo', msg);
        this.displayText = 'Lỗi khi lưu dữ liệu!';
        this.displayProgress = 0;
        this.isSaving = false;
      }
    });
  }
  // checkExistData() {
  //   const hasDiff = this.diffs && this.diffs.length > 0;
  //   debugger;
  // if( this.isProblemRow == true || this.isUpdate == true) {
  //   if(hasDiff){
  //     this.onConfirmDiff();
  //   } else {
  //     this.applyDiff(this.validDataToSaveForDiff, []);
  //   }
  //   return;
  // }
  // let message = '';
  // this.partlistService.checkExistImport(this.validDataToSaveForDiff).subscribe({
  //           next: (res: any) => {
  //             if(res.status === 1 && res.data.length > 0){
  //               message= res.message;
  //             }
  //           },
  //           error: (err: any) => {
  //             const msg = err.error?.message || err.message || 'Lỗi kết nối server khi kiểm tra dữ liệu!';
  //             this.notification.error('Thông báo', msg);
  //             this.displayText = 'Lỗi khi kiểm tra dữ liệu!';
  //       this.displayProgress = 0;
  //           }
  //         });
  //   this.partlistService.checkExist(this.checkPayload).subscribe({
  //     next: (res: any) => {
  //       let message = '';
  //       // Có dữ liệu cũ
  //       if (res.status === 1 && res.data.length > 0) {
  //         this.modal.confirm({
  //           nzTitle: 'Xác nhận',
  //           nzContent: 'Danh mục đã tồn tại. Bạn có muốn ghi đè không?',
  //           nzOkText: 'Có',
  //           nzCancelText: 'Không',

  //           nzOnOk: () => {
  //             this.partlistService.overwriteData(this.checkPayload).subscribe({
  //               next: () => {
  //                 // Sau khi ghi đè
  //                 if(hasDiff){
  //                   this.onConfirmDiff();
  //                 } else {
  //                   this.applyDiff(this.validDataToSaveForDiff, []);
  //                 }
  //               }
  //             });
  //           },

  //           nzOnCancel: () => {
  //             this.displayText = 'Đã hủy';
  //             this.displayProgress = 0;
  //           }
  //         });

  //         return;
  //       }

  //       // Không có dữ liệu cũ
  //       if (res.status === 1 && res.data.length === 0) {
  //           this.applyDiff(this.validDataToSaveForDiff, []);
  //       }
  //     }
  //   });
  // }
  setupPayload(validDataToSave: any[], diffsWithChoose: any[] = []) {
    const totalRowsToSave = validDataToSave.length;
    this.displayText = `Đã lưu: 0/${totalRowsToSave} bản ghi`;
    this.displayProgress = 0;

    // Chuẩn bị payload theo PartlistImportRequestDTO structure (match với user đã sửa)
    const payload = {
      projectID: this.projectId,
      projectPartListVersionID: this.selectedVersion,
      projectTypeID: this.projectTypeId,
      projectCode: this.projectCode.trim(),
      isProblem: this.isProblemRow,
      checkIsStock: null, // Có thể set nếu cần
      items: validDataToSave.map((row: any) => ({
        TT: row.TT?.toString()?.trim() || "",
        GroupMaterial: row.GroupMaterial?.toString()?.trim() || "",
        ProductCode: row.ProductCode?.toString()?.trim() || "",
        OrderCode: row.OrderCode?.toString()?.trim() || "",
        Manufacturer: row.Manufacturer?.toString()?.trim() || "",
        SpecialCode: row.SpecialCode?.toString()?.trim() || "",
        Model: row.Model?.toString()?.trim() || "",
        QtyMin: row.QtyMin || 0,
        QtyFull: row.QtyFull || 0,
        Unit: row.Unit?.toString()?.trim() || "",
        Price: row.Price || 0,
        Amount: row.Amount || 0,
        LeadTime: row.LeadTime?.toString()?.trim() || "",
        NCC: row.NCC?.toString()?.trim() || "",
        RequestDate: this.parseDate(row.RequestDate),
        LeadTimeRequest: row.LeadTimeRequest?.toString()?.trim() || "",
        QuantityReturn: row.QuantityReturn || 0,
        NCCFinal: row.NCCFinal?.toString()?.trim() || "",
        PriceOrder: row.PriceOrder || 0,
        OrderDate: this.parseDate(row.OrderDate),
        ExpectedReturnDate: this.parseDate(row.ExpectedReturnDate),
        Status: (isNaN(row.Status)) ? 0 : Number(row.Status),
        Quality: row.Quality?.toString()?.trim() || "",
        Note: row.Note?.toString()?.trim() || "",
        ReasonProblem: row.ReasonProblem?.toString()?.trim() || "",
      })),
      diffs: diffsWithChoose && diffsWithChoose.length > 0 ? diffsWithChoose : null
    };

    console.log('Dữ liệu gửi đi để apply-diff:', payload);
    return payload;
  }
  checkExistData() {
    const hasDiff = this.diffs && this.diffs.length > 0;

    // Xử lý riêng cho Update Stock - gọi API update-stock
    if (this.isStock) {
      this.displayText = 'Đang cập nhật tồn kho...';
      this.displayProgress = 50;

      this.partlistService.updateStock(this.checkPayload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success('Thành công', res.message || 'Cập nhật tồn kho thành công!');
            this.displayProgress = 100;
            this.displayText = 'Cập nhật tồn kho hoàn tất';
            setTimeout(() => {
              this.activeModal.close({ success: true });
            }, 500);
          } else {
            this.notification.error('Lỗi', res.message || 'Lỗi khi cập nhật tồn kho!');
            this.displayProgress = 0;
            this.displayText = 'Cập nhật thất bại';
          }
          this.isSaving = false;
        },
        error: (err: any) => {
          const msg = err.error?.message || err.message || 'Lỗi kết nối server khi cập nhật tồn kho!';
          this.notification.error('Lỗi', msg);
          this.displayProgress = 0;
          this.displayText = 'Cập nhật thất bại';
          this.isSaving = false;
        }
      });
      return;
    }

    if (this.isProblemRow == true || this.isUpdate == true) {
      if (hasDiff) {
        this.onConfirmDiff();
      } else {
        this.applyDiff(this.validDataToSaveForDiff, []);
      }
      return;
    }

    // Bước 1: Kiểm tra Unit và Hãng TRƯỚC
    this.partlistService.checkExistImport(this.setupPayload(this.validDataToSaveForDiff, [])).subscribe({
      next: (importRes: any) => {
        let warningMessage = '';

        // Lấy message cảnh báo
        if (importRes.status === 1 && (importRes.data.firmIssues?.length > 0 || importRes.data.unitIssues?.length > 0)) {
          debugger;
          warningMessage = importRes.message;
        }

        // Bước 2: Sau đó mới kiểm tra dữ liệu đã tồn tại
        this.partlistService.checkExist(this.checkPayload).subscribe({
          next: (res: any) => {
            // Trường hợp 1: Có dữ liệu cũ - hiển thị modal ghi đè + warning
            if (res.status === 1 && res.data.length > 0) {
              const content = warningMessage
                ? `
                  <div>
                    <p>Danh mục đã tồn tại. Bạn có muốn ghi đè không?</p>
                    <br>
                    <div style="padding: 12px; background: #fff7e6; border-left: 4px solid #FF8C00; border-radius: 4px; max-height: 300px; overflow-y: auto;">
                      ${warningMessage}
                    </div>
                  </div>
                `
                : 'Danh mục đã tồn tại. Bạn có muốn ghi đè không?';

              this.modal.confirm({
                nzTitle: 'Xác nhận',
                nzContent: content,
                nzOkText: 'Có',
                nzCancelText: 'Không',
                nzOnOk: () => {
                  this.partlistService.overwriteData(this.checkPayload).subscribe({
                    next: () => {
                      //TNBinh update 13/01/2026
                      // if (this.isStock) {
                      //   this.partlistService.updateStock(this.checkPayload).subscribe({
                      //     next: () => {
                      //       this.closeExcelModal();
                      //     },
                      //     error: (err: any) => {
                      //       const msg = err.error?.message || err.message || 'Lỗi khi ghi đè dữ liệu!';
                      //       this.notification.error('Thông báo', msg);
                      //       this.isSaving = false;
                      //     }
                      //   });
                      // }
                      //end update stock
                      if (hasDiff) {
                        this.onConfirmDiff();
                      } else {
                        this.applyDiff(this.validDataToSaveForDiff, []);
                      }
                    },
                    error: (err: any) => {
                      const msg = err.error?.message || err.message || 'Lỗi khi ghi đè dữ liệu!';
                      this.notification.error('Thông báo', msg);
                      this.isSaving = false;
                    }
                  });
                },
                nzOnCancel: () => {
                  this.displayText = 'Đã hủy';
                  this.displayProgress = 0;
                  this.isSaving = false;
                }
              });
              return;
            }

            // Trường hợp 2: Không có dữ liệu cũ
            if (res.status === 1 && res.data.length === 0) {
              // Nếu có warning message -> hiển thị modal xác nhận
              if (warningMessage) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận lưu',
                  nzContent: `
                  <div>
                    <p>Phát hiện dữ liệu sai thông tin. Bạn có muốn tiếp tục lưu không?</p>
                    <br>
                    <div style="padding: 12px; background: #fff7e6; border-left: 4px solid #FF8C00; border-radius: 4px; max-height: 300px; overflow-y: auto;">
                      ${warningMessage}
                    </div>
                  </div>
                `,
                  nzOkText: 'Tiếp tục',
                  nzCancelText: 'Hủy',
                  nzOkDanger: true,
                  nzOnOk: () => {
                    this.applyDiff(this.validDataToSaveForDiff, []);
                  },
                  nzOnCancel: () => {
                    this.displayText = 'Đã hủy';
                    this.displayProgress = 0;
                    this.isSaving = false;
                  }
                });
              } else {
                // Không có warning -> lưu trực tiếp
                this.applyDiff(this.validDataToSaveForDiff, []);
              }
            }
          },
          error: (err: any) => {
            const msg = err.error?.message || err.message || 'Lỗi kết nối server!';
            this.notification.error('Thông báo', msg);
            this.displayText = 'Lỗi khi kiểm tra dữ liệu!';
            this.displayProgress = 0;
            this.isSaving = false;
          }
        });
      },
      error: (err: any) => {
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi kiểm tra dữ liệu!';
        this.notification.error('Thông báo', msg);
        this.displayText = 'Lỗi khi kiểm tra dữ liệu!';
        this.displayProgress = 0;
        this.isSaving = false;
      }
    });
  }

  // BƯỚC 2: Xử lý khi user confirm diff chi tiết (chọn Excel hoặc Stock cho từng dòng)
  onConfirmDiff() {
    const diffsWithChoose = this.diffs.map(x => ({ ...x }));
    this.applyDiff(this.validDataToSaveForDiff, diffsWithChoose);
  }
  // BƯỚC 2: Hủy diff modal chi tiết
  onCancelDiff() {
    this.showDiffModal = false;
    // Quay lại FlyoutPanel (BƯỚC 1) hoặc đóng hoàn toàn
    // Theo logic WinForm, nếu hủy ở modal 2, có thể quay lại modal 1 hoặc đóng
    // Ở đây ta đóng hoàn toàn để đơn giản
    this.diffs = [];
    this.validDataToSaveForDiff = [];
    this.displayText = 'Đã hủy';
    this.displayProgress = 0;
  }

  // Hàm để reset trạng thái nhập Excel
  private resetExcelImportState(): void {
    this.filePath = '';
    this.excelSheets = [];
    this.selectedSheet = '';
    this.dataTableExcel = [];
    this.workbook = null;
    this.displayText = '0/0';
    this.displayProgress = 0;
    this.totalRowsAfterFileRead = 0;
    this.processedRowsForSave = 0;

    if (this.tableExcel) {
      this.tableExcel.replaceData([]);
    }
    console.log('Trạng thái nhập Excel đã được reset.');
  }

  closeExcelModal() {
    this.activeModal.close({ success: true });
  }

  closePartlistModal() {
    this.activeModal.close({ success: true });
  }

  // Xử lý khi checkbox Update thay đổi (theo logic WinForm dòng 1631-1634)
  onIsUpdateChange(): void {
    if (this.isUpdate) {
      this.isProblemRow = false; // Loại trừ checkbox Hàng phát sinh
      this.isStock = false;
    }
  }

  // Xử lý khi checkbox Hàng phát sinh thay đổi (theo logic WinForm dòng 1636-1639)
  onIsProblemRowChange(): void {
    if (this.isProblemRow) {
      this.isUpdate = false; // Loại trừ checkbox Update
      this.isStock = false;
    }
  }
  onIsStockChange(): void {
    if (this.isStock) {
      this.isUpdate = false; // Loại trừ checkbox Update
      this.isProblemRow = false;
    }
  }

  downloadTemplate() {
    const fileName = 'DanhMucVatTuDuAnTemplate.xlsx';
    this.partlistService.downloadTemplate(fileName).subscribe({
      next: (blob: Blob) => {
        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success('Thông báo', 'Tải file mẫu thành công!');
        } else {
          this.notification.error('Thông báo', 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        console.error('Lỗi khi tải file mẫu:', res);
        // Nếu error response là blob (có thể server trả về lỗi dạng blob)
        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error('Thông báo', errorText.message || 'Tải file mẫu thất bại!');
            } catch {
              this.notification.error('Thông báo', 'Tải file mẫu thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải file mẫu thất bại. Vui lòng thử lại!';
          this.notification.error('Thông báo', errorMsg);
        }
      }
    });
  }
}
