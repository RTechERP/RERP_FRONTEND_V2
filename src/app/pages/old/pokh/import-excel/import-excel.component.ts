import { Component, OnInit, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import * as XLSX from 'xlsx';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { PokhService } from '../pokh-service/pokh.service';

@Component({
  selector: 'app-import-excel-pokh',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css'
})
export class ImportExcelPokhComponent implements OnInit {
  sheetNames: string[] = [];
  selectedSheet: string | null = null;
  workbook: XLSX.WorkBook | null = null;
  isLoading: boolean = false;

  tableData: any[] = [];
  tableHeaders: string[] = [];

  @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
  @ViewChild('excelFileInput', { static: false }) excelFileInput!: ElementRef<HTMLInputElement>;
  tabulator!: Tabulator;

  // Mapping cột Excel sang cột API (dựa trên code WinForm)
  // F1 = TT (thứ tự cha con), F2 = STT, F3 = ProductNewCode, F4 = Nhóm sản phẩm
  // F5 = ProductCode, F6 = ProductName, F7 = GuestCode, F9 = Maker
  // F10 = Unit, F11 = Qty, F14 = UnitPrice
  columnMapping: { [key: string]: string } = {
    'TT': 'TT',
    'STT': 'STT',
    'Mã nội bộ': 'ProductNewCode',
    'Nhóm': 'ProductGroupName',
    'Mã sản phẩm': 'ProductCode',
    'Tên sản phẩm': 'ProductName',
    'Mã theo khách': 'GuestCode',
    'Hãng': 'Maker',
    'ĐVT': 'Unit',
    'Số lượng': 'Qty',
    'Đơn giá': 'UnitPrice',
    'Spec': 'Spec',
  };

  // Danh sách các cột bắt buộc
  requiredColumns: string[] = [
    'TT',
    'Mã sản phẩm',
    'Tên sản phẩm',
  ];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private pokhService: PokhService
  ) { }

  ngOnInit(): void {
  }

  onFileChange(evt: any) {
    const target: HTMLInputElement = evt.target;
    if (!target.files || target.files.length === 0) {
      if (this.selectedSheet && this.sheetNames.length > 0) {
        return;
      }
      return;
    }

    // Reset preview trước khi load file mới
    this.resetPreview();

    if (target.files.length !== 1) {
      // Reset input để có thể chọn lại file
      if (target) {
        target.value = '';
      }
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      this.workbook = XLSX.read(bstr, { type: 'binary' });
      this.sheetNames = this.workbook.SheetNames;

      // Không reset input ở đây để giữ tên file hiển thị
      // Input sẽ được reset khi chọn file mới (trong lần gọi onFileChange tiếp theo)
    };
    reader.onerror = () => {
      // Reset input nếu có lỗi
      if (target) {
        target.value = '';
      }
      this.notification.error('Lỗi', 'Không thể đọc file Excel!');
    };
    reader.readAsBinaryString(target.files[0]);
  }

  private resetPreview() {
    this.selectedSheet = null;
    this.sheetNames = [];
    this.tableHeaders = [];
    this.tableData = [];
    this.workbook = null;

    if (this.tabulator) {
      this.tabulator.clearData();
      this.tabulator.setColumns([]);
    }

    // Reset input file khi chọn file mới để có thể chọn lại file cùng tên
    if (this.excelFileInput && this.excelFileInput.nativeElement) {
      this.excelFileInput.nativeElement.value = '';
    }
  }

  onSheetChange() {
    if (this.workbook && this.selectedSheet) {
      const ws = this.workbook.Sheets[this.selectedSheet];
      // Bắt đầu từ hàng 4 (index 3) như code WinForm: for (int i = 3; i < grvData.RowCount; i++)
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        defval: '',
        range: 2 // Bắt đầu từ hàng 4 (0-indexed = 3)
      });

      this.tableData = rawData.map(row => {
        const newRow: any = {};

        Object.keys(row).forEach(key => {
          if (!key.startsWith('__EMPTY')) {
            let value = row[key];
            newRow[key.trim()] = value;
          }
        });

        return newRow;
      }).filter(row => {
        // Bỏ qua các dòng không có cột TT hoặc TT rỗng
        const tt = row['TT'];
        return tt !== null && tt !== undefined && tt !== '' &&
          (typeof tt === 'string' ? tt.trim() !== '' : true);
      });

      this.tableHeaders = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
      this.renderTable();
    }
  }

  renderTable() {
    const rowNumberColumn: any = {
      title: 'STT',
      field: 'rowNumber',
      width: 60,
      headerHozAlign: 'center' as const,
      hozAlign: 'center' as const,
      formatter: (cell: any) => {
        const row = cell.getRow();
        return row.getPosition(true);
      },
      frozen: true,
      resizable: false
    };

    const dataColumns: any[] = this.tableHeaders.map(col => {
      let align: "left" | "center" | "right" = "left";
      if (col.toLowerCase().includes("date") || col.toLowerCase().includes("ngày")) align = "center";
      else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
      return {
        title: col,
        field: col,
        width: 150,
        headerHozAlign: 'center',
        hozAlign: align
      };
    });

    if (this.tabulator) {
      this.tabulator.setColumns([rowNumberColumn, ...dataColumns]);
      this.tabulator.replaceData(this.tableData);
      return;
    }

    this.tabulator = new Tabulator(this.excelTable.nativeElement, {
      data: this.tableData,
      layout: 'fitDataStretch',
      reactiveData: true,
      height: '40vh',
      selectableRows: 1,
      responsiveLayout: false,
      pagination: false,
      paginationMode: 'local',
      columns: [rowNumberColumn, ...dataColumns],
    });
  }

  validateAllColumns(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tableData || this.tableData.length === 0) {
      return { isValid: false, errors: ['Không có dữ liệu để validate'] };
    }

    this.tableData.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const missingColumns: string[] = [];

      this.requiredColumns.forEach(columnName => {
        const value = row[columnName];
        if (value === null || value === undefined || value === '' ||
          (typeof value === 'string' && value.trim() === '')) {
          missingColumns.push(columnName);
        }
      });

      if (missingColumns.length > 0) {
        errors.push(`Dòng ${rowNumber}: Thiếu các cột: ${missingColumns.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  importData() {
    if (!this.tableData || this.tableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để nhập!');
      return;
    }

    const validationResult = this.validateAllColumns();
    if (!validationResult.isValid) {
      const errorList = validationResult.errors.slice(0, 20).map((err, idx) => `${idx + 1}. ${err}`).join('<br>');
      const moreErrors = validationResult.errors.length > 20 ? `<br>... và ${validationResult.errors.length - 20} lỗi khác` : '';

      this.modal.warning({
        nzTitle: 'Lỗi dữ liệu',
        nzContent: `
          <div style="max-height: 400px; overflow-y: auto;">
            <p class="mb-2"><strong>Vui lòng nhập đầy đủ các cột bắt buộc!</strong></p>
            <p class="mb-2">Tổng số lỗi: <strong>${validationResult.errors.length}</strong></p>
            <div style="text-align: left; font-size: 13px;">
              ${errorList}${moreErrors}
            </div>
          </div>
        `,
        nzOkText: 'Đóng',
        nzWidth: 600
      });
      return;
    }

    this.isLoading = true;

    // Bước 1: Chuẩn bị data để gửi lên API
    const excelDataForAPI = this.tableData.map((row, index) => {
      return {
        RowIndex: index,
        ProductNewCode: row['Mã nội bộ'] || '',
        ProductGroupName: String(row['Tên nhóm'] || ''),
        ProductCode: row['Mã sản phẩm'] || '',
        ProductName: row['Tên sản phẩm'] || ''
      };
    });

    // Bước 2: Gọi API checkProductSaleList một lần với tất cả data
    this.pokhService.checkProductSaleList(excelDataForAPI).subscribe({
      next: (response: any) => {
        if (response.status !== 1) {
          this.isLoading = false;
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Có lỗi khi kiểm tra sản phẩm!');
          return;
        }

        const productIdMap: { [key: number]: number } = {};
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((item: any) => {
            if (item.RowIndex !== undefined && item.ProductID) {
              productIdMap[item.RowIndex] = item.ProductID;
            }
          });
        }

        // Bước 3: Xử lý dữ liệu sau khi có ProductID từ API
        const ttToIdMap: { [key: string]: number } = {};
        let tempId = 0;

        const rawProcessedData = this.tableData.map((row, index) => {
          tempId--;
          const tt = (row['TT']?.toString()?.trim()) || '';

          let parentTT = '';
          if (tt && tt.includes('.')) {
            parentTT = tt.substring(0, tt.lastIndexOf('.'));
          }

          const qty = this.parseNumber(row["Q'ty"]);
          const unitPrice = this.parseNumber(row['Đơn giá']);
          const intoMoney = qty * unitPrice;

          const item: any = {
            ID: tempId,
            STT: 0,
            TT: tt,
            ParentTT: parentTT,
            ParentID: 0,
            ProductID: productIdMap[index] || null,
            ProductNewCode: row['Mã nội bộ'] || '',
            ProductCode: row['Mã sản phẩm'] || '',
            ProductName: row['Tên sản phẩm'] || '',
            GuestCode: row['Model'] || '',
            Maker: row['Maker'] || '',
            Unit: row['Unit'] || '',
            Qty: qty,
            UnitPrice: unitPrice,
            IntoMoney: intoMoney,
            VAT: 0,
            TotalPriceIncludeVAT: intoMoney,
            Spec: row['Spec'] || '',
            Note: row['Note'] || '',
            _children: []
          };

          ttToIdMap[tt] = tempId;
          return item;
        });

        // Bước 3: Gán ParentID
        rawProcessedData.forEach(item => {
          if (item.ParentTT && ttToIdMap[item.ParentTT]) {
            item.ParentID = ttToIdMap[item.ParentTT];
          }
        });

        // Bước 4: Tính lại STT
        let parentSTT = 0;
        let childSTTCounter: { [parentId: number]: number } = {};

        rawProcessedData.forEach(item => {
          if (item.ParentID === 0) {
            parentSTT++;
            item.STT = parentSTT;
            childSTTCounter[item.ID] = 0;
          } else {
            if (!childSTTCounter[item.ParentID]) {
              childSTTCounter[item.ParentID] = 0;
            }
            childSTTCounter[item.ParentID]++;
            item.STT = childSTTCounter[item.ParentID];
          }
        });

        // Bước 5: Loại bỏ ParentTT
        const processedData = rawProcessedData.map(item => {
          const { ParentTT, ...rest } = item;
          return rest;
        });

        this.isLoading = false;
        console.log('=== DATA SAU KHI NHẬP EXCEL ===');
        console.log('Tổng số dòng:', processedData.length);
        console.log('Chi tiết từng dòng:', processedData);
        console.log('=== END LOG ===');

        this.notification.success(NOTIFICATION_TITLE.success, `Đã nhập ${processedData.length} dòng dữ liệu`);

        this.activeModal.close({
          success: true,
          processedData: processedData
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Check ProductSale error:', err);
        this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi kiểm tra sản phẩm!');
      }
    });
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
}
