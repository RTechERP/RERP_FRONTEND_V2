import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as XLSX from 'xlsx';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PokhHistoryServiceService } from '../pokh-history-service/pokh-history-service.service';

@Component({
  selector: 'app-import-excel',
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
  ],
  templateUrl: './import-excel.component.html',
  styleUrl: './import-excel.component.css'
})
export class ImportExcelComponent implements OnInit {
  sheetNames: string[] = [];
  selectedSheet: string | null = null;
  workbook: XLSX.WorkBook | null = null;
  
  tableData: any[] = [];
  tableHeaders: string[] = [];
  
  @ViewChild('excelTable', { static: true }) excelTable!: ElementRef;
  tabulator!: Tabulator;

  // Mapping tên cột tiếng Việt sang tên thuộc tính trong POKHHistory
  columnMapping: Record<string, string> = {
    'Mã khách': 'CustomerCode',
    'Index': 'IndexCode',
    'Số PO': 'PONumber',
    'Ngày PO': 'PODate',
    'Mã hàng': 'ProductCode',
    'Model': 'Model',
    'SL': 'Quantity',
    'SL giao': 'QuantityDeliver',
    'SL pending': 'QuantityPending',
    'ĐVT': 'Unit',
    'Giá net': 'NetPrice',
    'Đơn giá': 'UnitPrice',
    'Thành tiền': 'TotalPrice',
    'VAT': 'VAT',
    'Tổng tiền sau VAT': 'TotalPriceVAT',
    'Giao hành thực tế': 'DeliverDate',
    'Thanh toán thực tế': 'PaymentDate',
    'Ngày hóa đơn': 'BillDate',
    'Số hóa đơn': 'BillNumber',
    'Công nợ': 'Dept',
    'Sale': 'Sale',
    'Pur': 'Pur'
  };

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private pokhHistoryService: PokhHistoryServiceService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
  }

  onFileChange(evt: any) {
    this.resetPreview();
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      this.workbook = XLSX.read(bstr, { type: 'binary' });
      this.sheetNames = this.workbook.SheetNames;
    };
    reader.readAsBinaryString(target.files[0]);
  }

  private resetPreview() {
    this.selectedSheet = null;
    this.sheetNames = [];
    this.tableHeaders = [];
    this.tableData = [];

    if (this.tabulator) {
      this.tabulator.clearData();
      this.tabulator.setColumns([]);
    }
  }

  onSheetChange() {
    if (this.workbook && this.selectedSheet) {
      const ws = this.workbook.Sheets[this.selectedSheet];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

      this.tableData = rawData.map(row => {
        const newRow: any = {};

        Object.keys(row).forEach(key => {
          if (!key.startsWith('__EMPTY')) {
            let value = row[key];

            // Convert Excel date to readable format (xử lý cả tiếng Việt và tiếng Anh)
            const keyLower = key.toLowerCase();
            const isDateColumn = keyLower.includes('date') || 
                                  keyLower.includes('giao hành thực tế') ||
                                keyLower.includes('thanh toán thực tế') ||
                                 keyLower.includes('ngày');
            
            if (typeof value === 'number' && isDateColumn) {
              const parsed = XLSX.SSF.parse_date_code(value);
              if (parsed) {
                value = `${String(parsed.d).padStart(2, '0')}/${String(parsed.m).padStart(2, '0')}/${parsed.y}`;
              }
            }
            newRow[key.trim()] = value;
          }
        });

        return newRow;
      });

      this.tableHeaders = this.tableData.length > 0 ? Object.keys(this.tableData[0]) : [];
      this.renderTable();
    }
  }

  renderTable() {
    if (this.tabulator) {
      this.tabulator.setColumns(this.tableHeaders.map(col => {
        let align: "left" | "center" | "right" = "left";
        if (col.toLowerCase().includes("date")) align = "center";
        else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
        return { title: col, field: col, width: 150, headerHozAlign: 'center', hozAlign: align };
      }));
      this.tabulator.replaceData(this.tableData);
      return;
    }

    this.tabulator = new Tabulator(this.excelTable.nativeElement, {
      data: this.tableData,
      layout: 'fitDataStretch',
      reactiveData: true,
      height: '60vh',
      selectableRows: 1,
      responsiveLayout: false,
      pagination: false,
      paginationMode: 'local',
      columns: this.tableHeaders.map(col => {
        let align: "left" | "center" | "right" = "left";
        if (col.toLowerCase().includes("date")) align = "center";
        else if (this.tableData.length > 0 && typeof this.tableData[0][col] === "number") align = "right";
        return { title: col, field: col, width: 150, headerHozAlign: 'center', hozAlign: align };
      }),
    });
  }

  importData() {
    console.log('Dữ liệu đã chọn:', this.tableData);
    
    if (!this.tableData || this.tableData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để lưu!');
      return;
    }

    // Danh sách các field là DateTime
    const dateFields = ['PODate', 'DeliverDate', 'PaymentDate', 'BillDate', 'CreatedDate', 'UpdatedDate'];

    // Map dữ liệu từ tiếng Việt sang tiếng Anh trước khi lưu
    const mappedData = this.tableData.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        const mappedKey = this.columnMapping[key] || key;
        let value = row[key];
        
        // Chuyển đổi ngày từ dd/MM/yyyy sang ISO 8601 cho API hoặc null
        if (dateFields.includes(mappedKey)) {
          if (value && typeof value === 'string' && value.trim() !== '') {
            if (value.includes('/')) {
              const parts = value.split('/');
              if (parts.length === 3) {
                // Chuyển từ dd/MM/yyyy sang yyyy-MM-ddT00:00:00 (ISO 8601)
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                value = `${year}-${month}-${day}T00:00:00`;
              }
            }
          } else {
            // Nếu rỗng, set null để API có thể nhận
            value = null;
          }
        }
        
        newRow[mappedKey] = value;
      });
      
      // POTypeCode lấy từ tên sheet
      newRow['POTypeCode'] = this.selectedSheet;
      
      return newRow;
    });

    this.pokhHistoryService.save(mappedData).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          const created = res?.created ?? 0;
          const updated = res?.updated ?? 0;
          const skipped = res?.skipped ?? 0;
          
          this.notification.success('Nhập dữ liệu thành công!',
            `Tạo mới: ${created} • Cập nhật: ${updated} • Bỏ qua: ${skipped}`);

          this.modal.success({
            nzTitle: 'Hoàn tất nhập dữ liệu',
            nzContent: `
              <div>Tạo mới: <b>${created}</b> • Cập nhật: <b>${updated}</b> • Bỏ qua: <b>${skipped}</b></div>`,
            nzOkText: 'Đóng',
            nzOnOk: () => this.activeModal.close('success'),
            nzWidth: 720
          });
        } else {
          this.notification.error('Thông báo', 'Nhập dữ liệu thất bại!');
        }
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi nhập dữ liệu!');
      }
    });
  }
}
