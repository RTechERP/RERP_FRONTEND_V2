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
  Input,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
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
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { TbProductGroupRtcFormComponent } from './tb-product-group-rtc-form/tb-product-group-rtc-form.component';
import { TbProductRtcFormComponent } from './tb-product-rtc-form/tb-product-rtc-form.component';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TbProductRtcService } from './tb-product-rtc-service/tb-product-rtc.service';
import { TbProductRtcImportExcelComponent } from './tb-product-rtc-import-excel/tb-product-rtc-import-excel.component';
import { DEFAULT_TABLE_CONFIG } from '../../tabulator-default.config';
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
  ],
  selector: 'app-tb-product-rtc',
  templateUrl: './tb-product-rtc.component.html',
  styleUrls: ['./tb-product-rtc.component.css'],
})
export class TbProductRtcComponent implements OnInit, AfterViewInit {
  dataInput: any = {};
  constructor(
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService
  ) {}
  productTable: Tabulator | null = null;
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  isSearchVisible: boolean = false;
  productGroupData: any[] = [];
  productData: any[] = [];
  productGroupID: number = 0;
  keyWord: string = '';
  checkAll: number = 0;
  warehouseID: number = 1;
  productRTCID: number = 0;
  productGroupNo: string = '';
  Size: number = 100000;
  Page: number = 1;
  searchMode: string = 'group';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  ngOnInit() {}
  ngAfterViewInit(): void {
    this.getGroup();
    this.getProduct();
  }
  getGroup() {
    this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;
    });
  }
  getProduct() {
    const request = {
      productGroupID: this.productGroupID || 0,
      keyWord: this.keyWord || '',
      checkAll: 1,
      warehouseID: this.warehouseID || 1,
      productRTCID: this.productRTCID || 0,
      productGroupNo: this.productGroupNo || '',
      page: this.Page,
      size: this.Size,
    };
    this.tbProductRtcService
      .getProductRTC(request)
      .subscribe((response: any) => {
        this.productData = response.data.products || [];
        // console.log('product', this.productData);
        this.drawTable();
      });
  }
  onGroupChange(groupID: number): void {
    this.productGroupID = groupID;
    this.getProduct();
  }
  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.getProduct();
  }
  onSearchModeChange(mode: string): void {
    this.searchMode = mode;
    if (mode === 'all') {
      this.checkAll = 1;
    }
    if (mode === 'group') {
      this.checkAll = 0;
    }
    this.getProduct();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  drawTable() {
    this.productTable = new Tabulator('#dataTableProduct', {
      ...DEFAULT_TABLE_CONFIG,
      //   layout: 'fitDataFill',
      //   pagination: true,
      //   selectableRows: 1,
      //   height: '90vh',
      ajaxURL: this.tbProductRtcService.getProductAjax(),
      ajaxConfig: 'POST',
      //   paginationMode: 'remote',
      //   columnDefaults: {
      //     headerWordWrap: true,
      //     headerVertical: false,
      //     headerHozAlign: 'center',
      //     minWidth: 60,
      //     resizable: true,
      //   },
      //   movableColumns: true,
      //   paginationSize: 50,
      //   paginationSizeSelector: [5, 10, 20, 50, 100],
      //   reactiveData: true,
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          productGroupID: this.productGroupID || 0,
          keyWord: this.keyWord || '',
          checkAll: 1,
          warehouseID: this.warehouseID || 0,
          productRTCID: this.productRTCID || 0,
          productGroupNo: this.productGroupNo || '',
          page: params.page || 1,
          size: params.size || 50,
        };
        // console.log('POST Request:', request);
        return this.tbProductRtcService.getProductRTC(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.data.products || [],
          last_page: response.data.TotalPage?.[0]?.TotalPage || 1,
        };
      },
      //   placeholder: 'Không có dữ liệu',
      //   langs: {
      //     vi: {
      //       pagination: {
      //         first: '<<',
      //         last: '>>',
      //         prev: '<',
      //         next: '>',
      //       },
      //     },
      //   },
      //   locale: 'vi',
      //   dataTree: true,
      //   addRowPos: 'bottom',
      //   history: true,
      columns: [
        { title: 'ID', field: 'ID', visible: false, frozen: true },
        { title: 'STT', field: 'STT', visible: false, frozen: true },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => {
            return `<div style="text-align:center;">${cell.getValue()}</div>`;
          },
          frozen: true,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          minWidth: 120,
          frozen: true,
        },
        { title: 'Vị trí (Hộp)', field: 'LocationName', minWidth: 200 },
        { title: 'Hãng', field: 'Maker' },
        { title: 'ĐVT', field: 'UnitCountName', minWidth: 120 },
        { title: 'Ảnh ', field: 'LocationImg' },
        {
          title: 'Mã nhóm',
          field: 'ProductGroupNo',
          minWidth: 120,
          visible: false,
        },
        { title: 'Tên nhóm', field: 'ProductGroupName', minWidth: 120 },
        { title: 'Mã kế toán', field: 'ProductCodeRTC' },
        {
          title: 'Ngày tạo',
          field: 'CreateDate',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'DD/MM/YYYY HH:mm' },
        },
        {
          title: 'Đồ mượn khách',
          field: 'BorrowCustomer',
          formatter: 'tickCross',
          hozAlign: 'center',
        },
        { title: 'Part Number', field: 'PartNumber', minWidth: 120 },
        { title: 'Serial Number', field: 'SerialNumber', minWidth: 120 },
        { title: 'Code', field: 'Serial', minWidth: 120 },
        { title: 'Người tạo', field: 'CreatedBy', visible: false },
        { title: 'Input Value', field: 'InputValue' },
        { title: 'Output Value', field: 'OutputValue' },
        { title: 'Rated Current (A)', field: 'CurrentIntensityMax' },
        { title: 'Mã nhóm RTC', field: 'ProductGroupRTCID', visible: false },
        { title: 'ID vị trí', field: 'ProductLocationID', visible: false },
        { title: 'UnitCountID', field: 'UnitCountID', visible: false },
        { title: 'Số lượng', field: 'Number', visible: false },
        { title: 'SL mượn', field: 'NumberBorrowing', visible: false },
        { title: 'SL tồn kho', field: 'NumberInStore', visible: false },
        {
          title: 'SL kiểm kê',
          field: 'SLKiemKe',
          hozAlign: 'right',
          visible: false,
        },
        { title: 'SL thực tế', field: 'InventoryReal', visible: false },

        { title: 'Khách mượn', field: 'BorrowCustomerText', visible: false },
        {
          title: 'Đã sử dụng',
          field: 'StatusProduct',
          formatter: 'tickCross',
          visible: false,
        },
        { title: 'Ghi chú', field: 'Note', minWidth: 450, visible: false },

        { title: 'Lens Mount', field: 'LensMount', visible: false },
        { title: 'Focal Length', field: 'FocalLength', visible: false },
        { title: 'MOD', field: 'MOD', visible: false },
        { title: 'Magnification', field: 'Magnification', visible: false },
        { title: 'Sensor Size', field: 'SensorSize', visible: false },
        { title: 'Sensor Size Max', field: 'SensorSizeMax', visible: false },
        { title: 'Resolution', field: 'Resolution', visible: false },
        { title: 'Shutter Mode', field: 'ShutterMode', visible: false },
        { title: 'Mono/Color', field: 'MonoColor', visible: false },
        { title: 'Pixel Size', field: 'PixelSize', visible: false },
        { title: 'Lamp Type', field: 'LampType', visible: false },
        { title: 'Lamp Power', field: 'LampPower', visible: false },
        { title: 'Lamp Wattage', field: 'LampWattage', visible: false },
        { title: 'Lamp Color', field: 'LampColor', visible: false },
        { title: 'Data Interface', field: 'DataInterface', visible: false },

        { title: 'Size', field: 'Size', visible: false },

        { title: 'AddressBox', field: 'AddressBox', visible: false },
      ],
    });
  }
  onAddGroupProduct() {
    const modalRef = this.ngbModal.open(TbProductGroupRtcFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        // console.log('Modal dismissed');
      }
    );
  }
  onEditGroup() {
    const selectedGroup = this.productGroupData.find(
      (group) => group.ID === this.productGroupID
    );
    if (!selectedGroup) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một nhóm sản phẩm để sửa.'
      );
      return;
    }
    const modalRef = this.ngbModal.open(TbProductGroupRtcFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = { ...selectedGroup, isEdit: true };
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onDeleteProductGroup() {
    if (this.productData.length != 0) {
      this.notification.warning(
        'Thông báo',
        'Không thể xóa nhóm vì vẫn còn sản phẩm thuộc nhóm này.'
      );
      return;
    }
    const selectedGroup = this.productGroupData.find(
      (group) => group.ID === this.productGroupID
    );
    if (!selectedGroup) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một nhóm sản phẩm để sửa.'
      );
      return;
    }
    const payload = {
      productGroupRTC: {
        ID: selectedGroup.ID,
        IsDeleted: true,
      },
      productRTCs: [],
    };
    this.tbProductRtcService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.productGroupID = 0;
          this.notification.success('Thông báo', 'Thành công');
          setTimeout(() => this.getGroup(), 100);
          setTimeout(() => this.getProduct(), 100);
        } else {
          this.notification.warning('Thông báo', 'Thất bại');
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning('Thông báo', 'Lỗi kết nối');
      },
    });
  }
  getSelectedIds(): number[] {
    if (this.productTable) {
      const selectedRows = this.productTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteProduct() {
    const selectedIds = this.getSelectedIds();
    const payload = {
      productRTCs: [
        {
          ID: selectedIds[0],
          IsDelete: true,
        },
      ],
    };
    this.tbProductRtcService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa thiết bị thành công!');
        this.getProduct();
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      },
    });
  }
  openModalImportExcel() {
    const modalRef = this.ngbModal.open(TbProductRtcImportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
  }
  onAddProducRTC() {
    // nếu productGroupID là 0, undefined, null => gán null
    const selectedGroup =
      this.productGroupID && this.productGroupID > 0
        ? this.productGroupID
        : null;

    const modalRef = this.ngbModal.open(TbProductRtcFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = {
      ...this.modalData,
      ProductGroupRTCID: selectedGroup,
    };

    modalRef.result.then(
      (result) => {
        this.getProduct();
      },
      () => console.log('Modal dismissed')
    );
  }

  onEditProduct() {
    const selected = this.productTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một đơn vị để sửa!'
      );
      return;
    }
    const selectedProduct = { ...selected[0] };
    const modalRef = this.ngbModal.open(TbProductRtcFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedProduct;
    modalRef.result.then(
      (result) => {
        this.getProduct();
      },
      () => {
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
}
