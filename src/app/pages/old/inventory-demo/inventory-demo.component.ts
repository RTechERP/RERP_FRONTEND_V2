import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Inject,
  Optional,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { UpdateQrcodeFormComponent } from './update-qrcode-form/update-qrcode-form.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InventoryDemoService } from './inventory-demo-service/inventory-demo.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TbProductRtcService } from '../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { InventoryBorrowSupplierDemoComponent } from './inventory-borrow-supplier-demo/inventory-borrow-supplier-demo.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { MaterialDetailOfProductRtcComponent } from './material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  standalone: true,
  imports: [
    NzUploadModule,
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule,
    HasPermissionDirective,
  ],
  selector: 'app-inventory-demo',
  templateUrl: './inventory-demo.component.html',
  styleUrls: ['./inventory-demo.component.css'],
})
export class InventoryDemoComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  dataInput: any = {};
  sizeTbDetail: any = '0';
  modalData: any = [];
  isSearchVisible: boolean = false;
  // nhận data
  productGroupData: any[] = [];
  productData: any[] = [];
  // lọc theo Store
  productGroupID: number = 0;
  keyWord: string = '';
  checkAll: number = 0;
  warehouseID: number = 0;
  productRTCID: number = 0;
  productGroupNo: string = '';
  searchMode: string = 'group';
  // List BillType for Orange color (Gift/Sell/Return)
  listBillType: number[] = [0, 3];
  // tb sản phẩm kho Demo
  productTable: Tabulator | null = null;

  warehouseType = 1;

  @ViewChild('tableDeviceTemp') tableDeviceTemp!: ElementRef;
  @ViewChild('productTableRef', { static: true }) productTableRef!: ElementRef;

  constructor(
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService,
    private inventoryDemoService: InventoryDemoService,
    private menuEventService: MenuEventService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
  ngAfterViewInit(): void {
    this.getGroup();
    this.getProduct();
    // Delay nhỏ để đảm bảo DOM có thể render xong
    setTimeout(() => {
      this.drawTable();
    }, 0);
  }
  ngOnInit(): void {
    if (this.tabData) {
      this.warehouseID = this.tabData.warehouseID || 1;
      this.warehouseType = this.tabData.warehouseType || 1;
    }
  }
  getGroup() {
    this.tbProductRtcService
      .getProductRTCGroup(this.warehouseType)
      .subscribe((resppon: any) => {
        this.productGroupData = resppon.data;
      });
  }
  // ấn hiện splizt tìm kiếm
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.getProduct();
  }
  getProduct() {
    const request = {
      productGroupID: this.productGroupID || 0,
      keyWord: this.keyWord || '',
      checkAll: 1,
      warehouseID: this.warehouseID || 1,
      productRTCID: this.productRTCID || 0,
      warehouseType: this.warehouseType || 1,
    };
    this.inventoryDemoService
      .getInventoryDemo(request)
      .subscribe((response: any) => {
        this.productData = response.products || [];
        console.log('product', this.productData);
        this.productTable?.setData(this.productData);
      });
  }
  onGroupChange(groupID: number): void {
    this.productGroupID = groupID;
    this.getProduct();
  }
  onSearchModeChange(mode: string): void {
    this.searchMode = mode;
    if (mode === 'all') {
      this.productGroupID = 0;
    }
    this.getProduct();
  }

  cellColorFormatter(cell: any): any {
    const data = cell.getData();
    const value = cell.getValue();
    const billType = data.BillType; // Ensure BillType is available in data
    const numberInStore = data.InventoryLate;

    const element = cell.getElement();
    // Reset styles first
    element.style.backgroundColor = '';
    element.style.color = '';

    if (this.listBillType.includes(billType) && numberInStore === 0) {
      element.style.backgroundColor = 'rgb(255, 231, 187)'; // Orange
      element.style.color = 'black';
    } else if (billType === 7 && numberInStore === 0) {
      element.style.backgroundColor = '#ffd3dd'; // Pink
      element.style.color = 'black';
    }
    return value;
  }

  drawTable() {
    const rowMenu = [
      {
        label: '<i class="fas fa-eye"></i> Xem chi tiết',
        action: (e: any, row: any) => {
          const rowData = row.getData();
          this.openDetailTab(rowData);
        },
      },
    ];

    if (this.productTable) {
      this.productTable.setData(this.productData);
    } else {
      this.productTable = new Tabulator(this.productTableRef.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        selectableRows: 5,
        height: '100%',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        paginationMode: 'local',
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        history: true,
        rowContextMenu: rowMenu,
        columns: [
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            formatter: this.cellColorFormatter.bind(this),
          },
          {
            title: 'Tên sản phẩm',
            field: 'ProductName',
            formatter: this.cellColorFormatter.bind(this),
          },
          {
            title: 'Vị trí (Hộp)',
            field: 'LocationName',
          },
          {
            title: 'Vị trí Modula',
            field: 'ModulaLocationName',
          },
          // {
          //   title: 'Mã nhóm',
          //   field: 'ProductGroupName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          // },

          {
            title: 'Hãng',
            field: 'Maker',
          },
          {
            title: 'ĐVT',
            field: 'UnitCountName',
          },
          {
            title: 'Đang mượn',
            field: 'NumberBorrowing',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'SL trong kho',
            field: 'InventoryReal',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'SL khách hàng mượn',
            field: 'QuantityExportMuon',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'SL kế toán',
            field: 'InventoryLate',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'SL kho quản lý',
            field: 'QuantityManager',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          // {
          //   title: 'SL kiểm kê',
          //   field: 'SLKiemKe',
          //   hozAlign: 'right',
          //   headerHozAlign: 'center',
          // },
          {
            title: 'Phiếu xuất',
            field: 'NumberExport',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Phiếu nhập',
            field: 'NumberImport',
            bottomCalc: 'sum',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Tồn kho Modula',
            field: 'TotalQuantityInArea',
            bottomCalc: 'sum', // tính tổng
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã kho HCM',
            field: 'CodeHCM',
          },
          {
            title: 'Ảnh',
            field: 'LocationImg',
          },
          {
            title: 'Tên nhóm',
            field: 'ProductGroupName',
          },
          {
            title: 'Mã kế toán',
            field: 'ProductCodeRTC',
          },
          {
            title: 'Ngày tạo',
            field: 'CreateDate',
          },
          {
            title: 'Đồ mượn KH',
            field: 'BorrowCustomerText',
            hozAlign: 'center',
            headerHozAlign: 'center',
            // formatter: function (cell: any) {
            //   const value = cell.getValue();
            //   const checked =
            //     value === true ||
            //     value === 'true' ||
            //     value === 1 ||
            //     value === '1';
            //   return `<input type="checkbox" ${
            //     checked ? 'checked' : ''
            //   } style="pointer-events: none; accent-color: #1677ff;" />`;
            // },
          },
          {
            title: 'Part Number',
            field: 'PartNumber',
          },
          {
            title: 'Serial',
            field: 'SerialNumber',
          },
          {
            title: 'Code',
            field: 'Serial',
          },
          {
            title: 'NCC',
            field: 'NmaeNCC',
          },
          {
            title: 'Người nhập',
            field: 'Deliver',
          },
          {
            title: 'Mã phiếu nhập',
            field: 'BillCode',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            width: 400,
            tooltip: true,
            formatter: function (cell: any) {
              const value = cell.getValue();
              if (!value) return '';
              return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${value}</div>`;
            },
          },
        ],
      });
    }
  }
  onUpdateQrCode() {
    const selectedData = this.productTable?.getSelectedData()[0];

    if (!selectedData) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một dòng để cập nhật mã QR!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(UpdateQrcodeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = {
      ID: selectedData.ID,
      ProductName: selectedData.ProductName,
    };
    console.log('dataInput', modalRef.componentInstance.dataInput);
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onReportNCC() {
    const modalRef = this.ngbModal.open(InventoryBorrowSupplierDemoComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  async exportToExcelProduct() {
    if (!this.productTable) return;

    const selectedData = [...this.productData];
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thiết bị');

    const columns = this.productTable
      .getColumnDefinitions()
      .filter(
        (col: any) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );

    const headerRow = worksheet.addRow(
      columns.map((col) => col.title || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
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
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

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
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-thiet-bi-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  openDetailTab(rowData: any): void {
    const title = `Chi tiết: ${rowData.ProductName || rowData.ProductCode}`;
    const data = {
      productRTCID1: rowData.ProductRTCID || 0,
      warehouseID1: this.warehouseID || 1,
      ProductCode: rowData.ProductCode || '',
      ProductName: rowData.ProductName || '',
      NumberBegin: rowData.Number || 0,
      InventoryLatest: rowData.InventoryLatest || 0,
      NumberImport: rowData.NumberImport || 0,
      NumberExport: rowData.NumberExport || 0,
      NumberBorrowing: rowData.NumberBorrowing || 0,
      InventoryReal: rowData.InventoryReal || 0,
    };
    console.log('data: ', data);

    this.menuEventService.openNewTab(
      MaterialDetailOfProductRtcComponent,
      title,
      data
    );
  }
}
