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
import { ProjectPartListService } from '../../project-partlist-service/project-part-list-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../../../../../auth/auth.service';

@Component({
  selector: 'app-import-excel-partlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzProgressModule,
    NzInputModule,
    NzButtonModule
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
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private partlistService: ProjectPartListService,
    public activeModal: NgbActiveModal,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res?.data;
      this.isAdmin = this.currentUser?.IsAdmin === true;
      console.log('CurrentUser', this.currentUser);
      console.log('IsAdmin', this.isAdmin);
      
      // Re-init table với quyền admin nếu đã có table
      if (this.tableExcel) {
        this.updateTableEditable();
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
    }
  }

  getTableColumns() {
    const editable = this.isAdmin;
    return [
      { title: "TT", field: "TT", hozAlign: "center", headerHozAlign: "center", width: 80, editor: editable ? "input" : false },
      { title: "Tên VT", field: "GroupMaterial", hozAlign: "left", headerHozAlign: "center", width: 200, formatter: 'textarea', editor: editable ? "input" : false },
      { title: "Mã VT", field: "ProductCode", hozAlign: "left", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Mã đặt hàng", field: "OrderCode", hozAlign: "left", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Hãng SX", field: "Manufacturer", hozAlign: "left", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Thông số kỹ thuật", field: "Model", hozAlign: "left", headerHozAlign: "center", width: 120, formatter: 'textarea', editor: editable ? "input" : false },
      { title: "Số lượng/1 máy", field: "QtyMin", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "Số lượng tổng", field: "QtyFull", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "Đơn vị", field: "Unit", hozAlign: "center", headerHozAlign: "center", width: 80, editor: editable ? "input" : false },
      { title: "Đơn giá KT nhập", field: "Price", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "Thành tiền KT nhập", field: "Amount", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "Tiến độ", field: "LeadTime", hozAlign: "left", headerHozAlign: "center", width: 100, editor: editable ? "input" : false },
      { title: "Nhà cung cấp", field: "NCC", hozAlign: "left", headerHozAlign: "center", width: 100, editor: editable ? "input" : false },
      { title: "Ngày yêu cầu đặt hàng", field: "RequestDate", hozAlign: "center", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Thời gian giao hàng yêu cầu", field: "LeadTimeRequest", hozAlign: "left", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Số lượng trả lại", field: "QuantityReturn", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "NCC cuối cùng", field: "NCCFinal", hozAlign: "left", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Giá đặt hàng", field: "PriceOrder", hozAlign: "right", headerHozAlign: "center", width: 100, editor: editable ? "number" : false },
      { title: "Ngày đặt hàng", field: "OrderDate", hozAlign: "center", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Ngày dự kiến trả hàng", field: "ExpectedReturnDate", hozAlign: "center", headerHozAlign: "center", width: 120, editor: editable ? "input" : false },
      { title: "Trạng thái", field: "Status", hozAlign: "center", headerHozAlign: "center", width: 100, editor: editable ? "input" : false },
      { title: "Chất lượng", field: "Quality", hozAlign: "center", headerHozAlign: "center", width: 100, editor: editable ? "input" : false },
      { title: "Note", field: "Note", hozAlign: "left", headerHozAlign: "center", width: 200, formatter: 'textarea', editor: editable ? "textarea" : false },
      { title: "Lý do huỷ", field: "ReasonProblem", hozAlign: "left", headerHozAlign: "center", width: 200, formatter: 'textarea', editor: editable ? "textarea" : false },
    ];
  }

  updateTableEditable() {
    if (this.tableExcel) {
      const columns = this.getTableColumns();
      this.tableExcel.setColumns(columns as any);
    }
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

          this.excelSheets = this.workbook.worksheets.map(sheet => sheet.name);
          console.log('Danh sách sheets tìm thấy:', this.excelSheets);

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

      const rows: any[] = [];
      const regexTT = /^-?[\d\.]+$/;
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
          QtyMin: this.parseNumber(row.getCell(7).value),
          QtyFull: this.parseNumber(row.getCell(8).value),
          Unit: this.getCellText(row.getCell(9)),
          Price: this.parseNumber(row.getCell(10).value),
          Amount: this.parseNumber(row.getCell(11).value),
          LeadTime: this.getCellText(row.getCell(12)),
          NCC: this.getCellText(row.getCell(13)),
          RequestDate: this.getCellText(row.getCell(14)),
          LeadTimeRequest: this.getCellText(row.getCell(15)),
          QuantityReturn: this.parseNumber(row.getCell(16).value),
          NCCFinal: this.getCellText(row.getCell(17)),
          PriceOrder: this.parseNumber(row.getCell(18).value),
          OrderDate: this.getCellText(row.getCell(19)),
          ExpectedReturnDate: this.getCellText(row.getCell(20)),
          Status: this.getCellText(row.getCell(21)),
          Quality: this.getCellText(row.getCell(22)),
          Note: this.getCellText(row.getCell(23)),
          ReasonProblem: this.getCellText(row.getCell(24))
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

  // Helper function để lấy text từ cell Excel (xử lý cả RichText)
  private getCellText(cell: any): string {
    if (!cell) return '';
    
    try {
      if (cell.text !== undefined && cell.text !== null) {
        return String(cell.text);
      }
    } catch (e) {
      // Bỏ qua lỗi nếu không thể đọc .text
    }
    
    try {
      const value = cell.value;
      if (value === null || value === undefined) return '';
      
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

  // Helper function để parse number
  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = value.toString().replace(/[,\.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
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
    console.log('--- Bắt đầu saveExcelData ---');

    if (!this.dataTableExcel || this.dataTableExcel.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Validate dữ liệu: chỉ lấy các dòng có TT hợp lệ (regex)
    const regex = /^-?[\d\.]+$/;
    const validDataToSave = this.dataTableExcel.filter(row => {
      const tt = row.TT?.toString()?.trim() || '';
      return tt && regex.test(tt);
    });

    if (validDataToSave.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để lưu!');
      return;
    }

    // Reset tiến trình
    this.processedRowsForSave = 0;
    const totalRowsToSave = validDataToSave.length;
    this.displayText = `Đang lưu: 0/${totalRowsToSave} bản ghi`;
    this.displayProgress = 0;

    const payload = {
      projectId: this.projectId,
      versionId: this.versionId,
      projectTypeId: this.projectTypeId,
      rows: validDataToSave
    };

    console.log('Dữ liệu gửi đi:', payload);

    this.partlistService.saveProjectPartList(payload).subscribe({
      next: (res: any) => {
        console.log('Response từ saveProjectPartList API:', res);
        
        if (res.status === 1) {
          this.displayProgress = 100;
          this.displayText = `Đã lưu: ${totalRowsToSave}/${totalRowsToSave} bản ghi`;
          this.notification.success('Thành công', `Đã lưu ${totalRowsToSave} vật tư thành công!`);
          
          // Đóng modal và trả về kết quả
          setTimeout(() => {
            this.activeModal.close({ success: true });
          }, 500);
        } else if (res.status === 2) {
          this.notification.warning('Thông báo', res.message || 'TT đã tồn tại, vui lòng kiểm tra lại!');
        } else {
          this.notification.error('Lỗi', res.message || 'Lưu dữ liệu thất bại!');
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu vật tư:', err);
        const msg = err.error?.message || err.message || 'Lỗi kết nối server khi lưu dữ liệu!';
        this.notification.error('Thông báo', msg);
        this.displayText = 'Lỗi khi lưu dữ liệu!';
        this.displayProgress = 0;
      }
    });
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

  downloadTemplate(fileName: string) {
    // TODO: Implement download template function if service has it
    this.notification.info('Thông báo', 'Tính năng tải mẫu đang được phát triển.');
    // this.partlistService.downloadTemplate(fileName).subscribe({
    //   next: (response: any) => {
    //     console.log('Response từ downloadTemplate API:', response);
    //   },
    //   error: (err: any) => {
    //     console.error('Lỗi khi download template:', err);
    //     this.notification.error('Thông báo', 'Không thể download template!');
    //   }
    // });
  }
}
