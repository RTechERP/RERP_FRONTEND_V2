import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';

// Import Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// Import XLSX at top of file
import * as XLSX from 'xlsx';

// Services
import {
  ProtectiveGearService,
  ProtectiveGearDto,
  ProductGroupRTC,
  ProtectiveGearSearchParams,
} from './protective-gear.service';

@Component({
  selector: 'app-protective-gear',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzSplitterModule,
  ],
  templateUrl: './protective-gear.component.html',
  styleUrls: ['./protective-gear.component.css'],
})
export class ProtectiveGearComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('tb_protectiveGear', { static: false })
  tb_protectiveGearContainer!: ElementRef;

  @ViewChild('tb_protectiveGearGroup', { static: false })
  tb_protectiveGearGroupContainer!: ElementRef;

  // Tabulator instances
  tb_protectiveGear: any;
  tb_protectiveGearGroup: any;

  private isGroupTableReady = false;
  private isMainTableReady = false;

  // Properties for data
  protectiveGears: ProtectiveGearDto[] = [];
  filteredProtectiveGears: ProtectiveGearDto[] = [];
  productGroups: ProductGroupRTC[] = [];
  selectedGroup: ProductGroupRTC | null = null;

  // Properties for loading states
  isLoadTable: boolean = false;
  isLoadGroupTable: boolean = false;

  // Properties for search
  searchValue: string = '';
  private searchTimeout: any;

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private protectiveGearService: ProtectiveGearService
  ) {}

  ngOnInit(): void {
    // Initialize tables
    this.isGroupTableReady = false;
    this.isMainTableReady = false;

    // Load initial data
    this.loadProductGroups();
    this.loadProtectiveGears();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTables();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.tb_protectiveGear) {
      this.tb_protectiveGear.destroy();
    }
    if (this.tb_protectiveGearGroup) {
      this.tb_protectiveGearGroup.destroy();
    }
  }

  private initializeTables(): void {
    if (this.tb_protectiveGearGroupContainer?.nativeElement) {
      this.drawTbProtectiveGearGroup(
        this.tb_protectiveGearGroupContainer.nativeElement
      );
    }

    if (this.tb_protectiveGearContainer?.nativeElement) {
      this.drawTbProtectiveGear(this.tb_protectiveGearContainer.nativeElement);
    }
  }

  loadProductGroups(): void {
    this.isLoadGroupTable = true;

    this.protectiveGearService.getProductGroupRTC().subscribe({
      next: (response: any) => {
        console.log('Product Groups Response:', response);
        console.log('Response.data:', response?.data);

        let processedData: ProductGroupRTC[] = [];

        if (response && response.data) {
          if (Array.isArray(response.data)) {
            if (response.data.length > 0 && Array.isArray(response.data[0])) {
              processedData = response.data[0];
              console.log('Using nested array data[0]:', processedData);
            } else {
              processedData = response.data;
              console.log('Using direct array data:', processedData);
            }
          }
        }

        this.productGroups = processedData;
        console.log('Final product groups:', this.productGroups);
        this.updateGroupTable();
        this.isLoadGroupTable = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.productGroups = [];
        this.updateGroupTable();
        this.isLoadGroupTable = false;
      },
    });
  }

  loadProtectiveGears(searchParams?: ProtectiveGearSearchParams): void {
    this.isLoadTable = true;

    const params: ProtectiveGearSearchParams = {
      productGroupID:
        searchParams?.productGroupID || this.selectedGroup?.ID || 0,
      keyword: searchParams?.keyword || this.searchValue || '',
      allProduct: searchParams?.allProduct || (this.selectedGroup ? 0 : 1),
      warehouseID: searchParams?.warehouseID || 5,
    };

    this.protectiveGearService.getAllProtectiveGears(params).subscribe({
      next: (response: any) => {
        console.log('Protective Gears Response:', response);
        console.log('Response.data:', response?.data);

        let processedData: ProtectiveGearDto[] = [];

        if (response && response.data) {
          if (Array.isArray(response.data)) {
            if (response.data.length > 0 && Array.isArray(response.data[0])) {
              processedData = response.data[0];
              console.log('Using nested array data[0]:', processedData);
            } else {
              processedData = response.data;
              console.log('Using direct array data:', processedData);
            }
          }
        }

        this.protectiveGears = processedData;
        this.filteredProtectiveGears = [...this.protectiveGears];
        console.log('Final protective gears:', this.filteredProtectiveGears);
        this.updateMainTable();
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.protectiveGears = [];
        this.filteredProtectiveGears = [];
        this.updateMainTable();
        this.isLoadTable = false;
      },
    });
  }

  private updateGroupTable(): void {
    if (this.isGroupTableReady && this.tb_protectiveGearGroup) {
      console.log('Updating group table with data:', this.productGroups.length);
      this.tb_protectiveGearGroup.replaceData(this.productGroups);
    } else {
      console.log('Group table not ready yet, will update later');
    }
  }

  private updateMainTable(): void {
    if (this.isMainTableReady && this.tb_protectiveGear) {
      console.log(
        'Updating main table with data:',
        this.filteredProtectiveGears.length
      );
      this.tb_protectiveGear.replaceData(this.filteredProtectiveGears);
    } else {
      console.log('Main table not ready yet, will update later');
    }
  }

  drawTbProtectiveGearGroup(container: HTMLElement): void {
    console.log('Creating group table...');

    this.tb_protectiveGearGroup = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      data: [],
      selectableRows: 1,
      selectableRowsRangeMode: 'click',

      columns: [
        {
          title: 'STT',
          field: 'NumberOrder',
          width: 60,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Mã nhóm',
          field: 'ProductGroupNo',
          width: 100,
          headerHozAlign: 'center',
          hozAlign: 'center',
          sorter: 'string',
        },
        {
          title: 'Tên nhóm',
          width: 268,
          field: 'ProductGroupName',
          headerHozAlign: 'center',
          sorter: 'string',
        },
      ],
    });

    // ✅ Wait for table to be built
    this.tb_protectiveGearGroup.on('tableBuilt', () => {
      console.log('Group table built successfully');
      this.isGroupTableReady = true;
      // ✅ Load data after table is ready
      this.loadProductGroups();
    });

    // ✅ Event listeners
    this.tb_protectiveGearGroup.on('rowClick', (e: any, row: any) => {
      this.selectedGroup = row.getData();
      console.log('Selected group:', this.selectedGroup);
      this.loadProtectiveGearsByGroup(this.selectedGroup?.ID || 0);
    });

    this.tb_protectiveGearGroup.on(
      'rowSelectionChanged',
      (data: any, rows: any) => {
        this.selectedGroup = rows.length > 0 ? rows[0].getData() : null;
      }
    );
  }

  // ✅ Draw protective gears table
  drawTbProtectiveGear(container: HTMLElement): void {
    this.tb_protectiveGear = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',

      data: [],
      selectableRows: 1,
      selectableRowsRangeMode: 'click',

      columns: [
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 140,
          headerHozAlign: 'center',
          hozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Tên',
          field: 'ProductName',
          width: 200,
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Vị trí',
          field: 'LocationName',
          width: 90,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          width: 100,
          headerHozAlign: 'center',
        },
        {
          title: 'ĐVT',
          field: 'UnitCountName',
          width: 80,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'SL nhập',
          field: 'NumberImport',
          width: 90,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          formatterParams: { precision: 2, thousand: ',', symbol: '' },
        },
        {
          title: 'SL xuất',
          field: 'NumberExport',
          width: 90,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          formatterParams: { precision: 2, thousand: ',', symbol: '' },
        },
        {
          title: 'SL mượn',
          field: 'NumberBorrowing',
          width: 90,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: 'money',
          formatterParams: { precision: 2, thousand: ',', symbol: '' },
        },
        {
          title: 'SL trong kho',
          field: 'InventoryReal',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            const formattedValue = new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value || 0);

            if (value < 0) {
              return `<span style="color: red; font-weight: bold;">${formattedValue}</span>`;
            }
            return formattedValue;
          },
        },
      ],
    });

    this.tb_protectiveGear.on('tableBuilt', () => {
      console.log('Main table built successfully');
      this.isMainTableReady = true;
      this.loadProtectiveGears();
    });

    this.tb_protectiveGear.on('rowClick', (e: any, row: any) => {

    });

    this.tb_protectiveGear.on('rowSelectionChanged', (data: any, rows: any) => {

    });
  }

  // ✅ Load protective gears by selected group
  loadProtectiveGearsByGroup(groupId: number): void {
    console.log('Loading products for group ID:', groupId);
    this.loadProtectiveGears({
      productGroupID: groupId,
      keyword: this.searchValue,
      allProduct: 1,
      warehouseID: 5,
    });
  }

  exportToExcel(): void {
    console.log('Starting Excel export...');
    console.log('Filtered data:', this.filteredProtectiveGears);

    // Kiểm tra có data không
    if (!this.filteredProtectiveGears || this.filteredProtectiveGears.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    try {
      // Chuẩn bị data cho Excel
      const excelData = this.filteredProtectiveGears.map((item, index) => ({
        'STT': index + 1,
        'Mã sản phẩm': item.ProductCode || '',
        'Tên sản phẩm': item.ProductName || '',
        'Vị trí': item.LocationName || '',
        'Nhà sản xuất': item.Maker || '',
        'Đơn vị tính': item.UnitCountName || '',
        'Số lượng nhập': item.NumberImport || 0,
        'Số lượng xuất': item.NumberExport || 0,
        'Số lượng mượn': item.NumberBorrowing || 0,
        'Số lượng trong kho': item.InventoryReal || 0,
      }));

      // Tạo workbook và worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Đồ Bảo Hộ Lao Động');

      // Set column widths
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 15 },  // Mã sản phẩm
        { wch: 30 },  // Tên sản phẩm
        { wch: 15 },  // Vị trí
        { wch: 15 },  // Nhà sản xuất
        { wch: 12 },  // Đơn vị tính
        { wch: 12 },  // SL nhập
        { wch: 12 },  // SL xuất
        { wch: 12 },  // SL mượn
        { wch: 15 },  // SL trong kho
      ];
      worksheet['!cols'] = colWidths;

      // Tạo filename với timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const filename = `bao-ho-lao-dong_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.xlsx`;

      // Xuất file Excel
      XLSX.writeFile(workbook, filename);

      // Thông báo thành công
      this.notification.success(
        'Thành công',
        `Đã xuất ${this.filteredProtectiveGears.length} sản phẩm ra file: ${filename}`
      );

      console.log('Excel export completed successfully');

    } catch (error) {
      console.error('Excel export error:', error);
      this.notification.error(
        'Lỗi',
        'Không thể xuất file Excel. Vui lòng thử lại!'
      );
    }
  }

  // Đảm bảo method createdText tồn tại (nếu cần)
  createdText(text: string): string {
    return text;
  }

  addQRCode(): void {
    this.notification.info(
      'Thông báo',
      'Chức năng thêm QR Code đang phát triển'
    );
  }

  NCCReport(): void {
    this.notification.info(
      'Thông báo',
      'Chức năng báo cáo NCC đang phát triển'
    );
  }

  highlightSearchKeyword(text: string): string {
    if (!this.searchValue || !this.searchValue.trim() || !text) {
      return text;
    }
    const keyword = this.searchValue.trim();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(
      regex,
      '<span style="background-color: #ffff00; color: #000; font-weight: bold; padding: 1px 2px; border-radius: 2px;">$1</span>'
    );
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.searchProtectiveGears();
    }, 300);
  }

  // Sửa lại method searchProtectiveGears
  searchProtectiveGears(): void {
    console.log('Searching with keyword:', this.searchValue);
    
    if (!this.searchValue || this.searchValue.trim() === '') {
      // Nếu không có từ khóa, load lại data từ API
      this.loadProtectiveGears();
    } else {
      // Tìm kiếm với từ khóa
      this.loadProtectiveGears({
        productGroupID: this.selectedGroup?.ID || 0,
        keyword: this.searchValue.trim(),
        allProduct: this.selectedGroup ? 0 : 1,
        warehouseID: 5,
      });
    }
  }
  clearSearch(): void {
    console.log('Clearing search');
    this.searchValue = '';
    
    if (this.selectedGroup) {
      this.loadProtectiveGearsByGroup(this.selectedGroup.ID || 0);
    } else {
      this.loadProtectiveGears();
    }
  }
}
