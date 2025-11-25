import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectService } from '../project-service/project.service';
import { CommonModule } from '@angular/common';
import { ProjectPartListService } from '../project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';

@Component({
  selector: 'app-project-part-list-history',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzFormModule,
  ],
  templateUrl: './project-part-list-history.component.html',
  styleUrl: './project-part-list-history.component.css'
})
export class ProjectPartListHistoryComponent implements OnInit, AfterViewInit {
  @Input() productCode: string = '';

  @ViewChild('tb_inventoryTable', { static: false })
  tb_inventoryTableContainer!: ElementRef;
  @ViewChild('tb_priceHistoryTable', { static: false })
  tb_priceHistoryTableContainer!: ElementRef;

  tb_inventoryTable: any;
  tb_priceHistoryTable: any;

  searchKeyword: string = '';

  constructor(
    private projectPartListService: ProjectPartListService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    // Fill productCode vào searchKeyword khi có giá trị
    if (this.productCode) {
      this.searchKeyword = this.productCode;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_inventoryTableContainer) {
        this.drawTbInventoryTable(this.tb_inventoryTableContainer.nativeElement);
      }
      if (this.tb_priceHistoryTableContainer) {
        this.drawTbPriceHistoryTable(this.tb_priceHistoryTableContainer.nativeElement);
      }
      // Load dữ liệu sau khi khởi tạo bảng
      this.loadData();
    }, 100);
  }

  drawTbInventoryTable(container: HTMLElement) {
    this.tb_inventoryTable = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,
      layout: 'fitDataStretch',
      locale: 'vi',
      rowHeader: false,
      groupBy: 'WarehouseType',
      groupHeader: (value: any) => `Kho: ${value}`,
      columns: [
        {
          title: 'Tên Nhóm',
          field: 'ProductGroupName',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Tích xanh',
          field: 'IsFix',
          headerHozAlign: 'center',
       
          hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                }
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          headerHozAlign: 'center',
          bottomCalc: 'count',
       
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          headerHozAlign: 'center',
         
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          headerHozAlign: 'center',
         
        },
        {
          title: 'Hãng',
          field: 'Maker',
          headerHozAlign: 'center',
        
        },
        {
          title: 'DVT',
          field: 'UnitName',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Tổng số lượng',
          field: 'InventoryTotal',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
         
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Tồn kho',
          field: 'InventoryReal',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Đang mượn',
          field: 'NumberBorrowing',
          headerHozAlign: 'center',
          bottomCalc: 'sum',
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Tên nhà cung cấp',
          field: 'SupplierName',
          headerHozAlign: 'center',
        
        },
      ],
    });
  }

  drawTbPriceHistoryTable(container: HTMLElement) {
    this.tb_priceHistoryTable = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,
      layout: 'fitDataStretch',
      locale: 'vi',
      rowHeader: false,
      groupBy: 'TableType',
      groupHeader: (value: any) => `Loại: ${value}`,
      columns: [
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          headerHozAlign: 'center',
       bottomCalc: 'count',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          headerHozAlign: 'center',

        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Model',
          headerHozAlign: 'center',
       
          formatter: 'textarea',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Đơn vị',
          field: 'Unit',
          headerHozAlign: 'center',
         
        },
        {
          title: 'Ngày cập nhật',
          field: 'CreatedDate',
          headerHozAlign: 'center',
         
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = typeof value === 'string' ? DateTime.fromISO(value) : DateTime.fromJSDate(value);
            return date.isValid ? date.toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          headerHozAlign: 'center',
         
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            decimal: '.',
            thousand: ',',
            precision: 0,
          },
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyCode',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Tỷ giá',
          field: 'CurrencyRate',
          headerHozAlign: 'center',
        
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Mã nhà cung cấp',
          field: 'CodeNCC',
          headerHozAlign: 'center',
         
        },
        {
          title: 'Tên nhà cung cấp',
          field: 'NameNCC',
          headerHozAlign: 'center',
         
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          headerHozAlign: 'center',
        
        },
        {
          title: 'Lead Time',
          field: 'LeadTime',
          headerHozAlign: 'center',
         
        },
      ],
    });
  }

  onSearch() {
    this.loadData();
  }

  loadData() {
    // Kiểm tra productCode có giá trị không
    if (!this.productCode || this.productCode.trim() === '') {
      this.notification.warning('Thông báo', 'Không tìm thấy mã sản phẩm!');
      return;
    }

    // Sử dụng searchKeyword nếu có, nếu không thì dùng productCode
    const keyword = this.searchKeyword && this.searchKeyword.trim() !== '' 
      ? this.searchKeyword.trim() 
      : this.productCode;

    // Gọi API với productCode và keyword (cả 2 đều = productCode như yêu cầu)
    this.projectPartListService.getHistoryPartList(this.productCode, keyword).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          // data là bảng trên (tồn kho theo sản phẩm) - là array of arrays, cần flatten
          const inventoryDataRaw = response.data.data || [];
          const inventoryData = Array.isArray(inventoryDataRaw) && inventoryDataRaw.length > 0 && Array.isArray(inventoryDataRaw[0])
            ? inventoryDataRaw.flat() // Flatten nếu là array of arrays
            : inventoryDataRaw;
          
          // dt là bảng dưới (lịch sử giá) - là array of arrays, cần flatten
          const priceHistoryDataRaw = response.data.dt || [];
          const priceHistoryData = Array.isArray(priceHistoryDataRaw) && priceHistoryDataRaw.length > 0 && Array.isArray(priceHistoryDataRaw[0])
            ? priceHistoryDataRaw.flat() // Flatten nếu là array of arrays
            : priceHistoryDataRaw;

          // Set data cho bảng trên (tb_inventoryTable)
          if (this.tb_inventoryTable) {
            this.tb_inventoryTable.setData(inventoryData);
          }

          // Set data cho bảng dưới (tb_priceHistoryTable)
          if (this.tb_priceHistoryTable) {
            this.tb_priceHistoryTable.setData(priceHistoryData);
          }
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
          // Set dữ liệu rỗng nếu có lỗi
          if (this.tb_inventoryTable) {
            this.tb_inventoryTable.setData([]);
          }
          if (this.tb_priceHistoryTable) {
            this.tb_priceHistoryTable.setData([]);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading history partlist:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu lịch sử giá và tồn kho');
        // Set dữ liệu rỗng nếu có lỗi
        if (this.tb_inventoryTable) {
          this.tb_inventoryTable.setData([]);
        }
        if (this.tb_priceHistoryTable) {
          this.tb_priceHistoryTable.setData([]);
        }
      }
    });
  }
}
