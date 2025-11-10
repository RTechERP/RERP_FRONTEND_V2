import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  NgZone,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { IS_ADMIN } from '../../../../../app.config';
import { ReportImportExportService } from './report-import-export-service/report-import-export.service';
import { ProductsaleServiceService } from '../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { ProductSaleDetailComponent } from '../ProductSale/product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from '../ProductSale/product-group-detail/product-group-detail.component';
import { ImportExportModalComponent } from './detail-modal/import-export-detail-modal..component';
import { BillExportDetailComponent } from '../BillExport/Modal/bill-export-detail/bill-export-detail.component';

interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  Unit: string;
  AddressBox: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
}
interface ProductGroup {
  ID?: number;
  ProductGroupID: string;
  ProductGroupName: string;
  IsVisible: boolean;
  EmployeeID: number;
  WareHouseID: number;
}

@Component({
  selector: 'app-report-import-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NgbModule,
  ],
  templateUrl: './report-import-export.component.html',
  styleUrl: './report-import-export.component.css',
})
export class ReportImportExportComponent implements OnInit, AfterViewInit {
  tableProductgroup: any;
  dataProductGroup: any[] = [];

  tableReport: any;
  dataReport: any[] = [];

  sizeSearch: string = '0';
  dateFormat = 'dd/MM/yyyy';

  ExportID: number = 0;

  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    keyword: '',
    group: 0,
    warehouseCode: 'HN',
  };

  dataEmployees: any[] = [];
  productID: number = 0;

  listLocation: any[] = [];
  productGroupID: number = 0;
  listWH: any[] = [];
  listEmployee: any[] = [];

  newProductSale: ProductSale = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
    AddressBox: '',
  };

  newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0,
  };

  constructor(
    private reportImportExportService: ReportImportExportService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private productsaleService: ProductsaleServiceService,
    private zone: NgZone
  ) {}
  ngOnInit(): void {
    this.getDataProductGroup();
  }
  ngAfterViewInit(): void {
    this.drawTable_ProductGroup();
    this.drawTable_productsale();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  resetform() {
    this.searchParams = {
      dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
        .toISOString()
        .split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      keyword: '',
      group: 0,
      warehouseCode: 'HN',
    };
  }

  searchData() {
    this.getReport();
    // Tự động đóng panel tìm kiếm
    this.sizeSearch = '0';
  }
  getDataProductGroup() {
    this.productsaleService.getDataProductGroupcbb().subscribe({
      next: (res) => {
        if (res?.data) {
          this.dataProductGroup = Array.isArray(res.data) ? res.data : [];
          this.searchParams.group = this.dataProductGroup[0].ID;

          console.log('Data Product Group:', this.dataProductGroup);

          // Vẽ bảng sau khi có dữ liệu
          this.drawTable_ProductGroup();

          // Gọi lấy chi tiết sau khi bảng group có dữ liệu
          this.getReport();
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }

  //them, sua san pham
  openModalNewProduct() {
    this.productsaleService.getDataProductSalebyID(this.productID).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newProductSale = {
            ProductCode: data.ProductCode,
            ProductName: data.ProductName,
            Maker: data.Maker,
            Unit: data.Unit,
            NumberInStoreDauky: data.NumberInStoreDauky,
            NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
            ProductGroupID: data.ProductGroupID,
            LocationID: data.LocationID,
            FirmID: data.FirmID,
            Note: data.Note,
            AddressBox: data.AddressBox,
          };
          console.log('newproduct', this.newProductSale);

          // Tải dữ liệu location cho nhóm sản phẩm đã chọn
          this.productsaleService
            .getDataLocation(this.newProductSale.ProductGroupID)
            .subscribe({
              next: (locationRes) => {
                if (locationRes?.data) {
                  this.listLocation = Array.isArray(locationRes.data)
                    ? locationRes.data
                    : [];
                }

                // Mở modal sau khi đã load xong dữ liệu
                this.openModalWithData();
              },
              error: (err) => {
                console.error('Lỗi khi tải dữ liệu location:', err);
                // Vẫn mở modal ngay cả khi lỗi load location
                this.openModalWithData();
              },
            });
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lấy thông tin sản phẩm!'
          );
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy thông tin!'
        );
        console.error(err);
      },
    });
  }

  private openModalWithData() {
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.newProductSale = { ...this.newProductSale };
    modalRef.componentInstance.listLocation = [...this.listLocation];
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.selectedList = [{ ID: this.productID }];
    modalRef.componentInstance.id = this.productID;

    modalRef.result.catch((result: any) => {
      if (result == true) {
        // Reload dữ liệu sau khi lưu
        this.getReport();
      }
    });
  }
  openModalProductGroup(ischeckmode: boolean) {
    // Load dữ liệu warehouse và employee trước khi mở modal
    Promise.all([
      this.productsaleService.getdataWareHouse().toPromise(),
      this.productsaleService.getdataEmployee().toPromise(),
    ])
      .then(([warehouseRes, employeeRes]) => {
        if (warehouseRes?.data) {
          this.listWH = Array.isArray(warehouseRes.data)
            ? warehouseRes.data
            : [];
        }
        if (employeeRes?.data) {
          this.listEmployee = Array.isArray(employeeRes.data)
            ? employeeRes.data
            : [];
          console.log('listEmployee', this.listEmployee);
        }

        // Mở modal sau khi đã load xong dữ liệu
        this.openProductGroupModal(ischeckmode);
      })
      .catch((err) => {
        console.error('Lỗi khi load dữ liệu:', err);
        // Vẫn mở modal ngay cả khi có lỗi
        this.openProductGroupModal(ischeckmode);
      });
  }

  private openProductGroupModal(ischeckmode: boolean) {
    const modalRef = this.modalService.open(ProductGroupDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductGroup = this.newProductGroup;
    modalRef.componentInstance.isCheckmode = ischeckmode;
    modalRef.componentInstance.listWH = this.listWH;
    modalRef.componentInstance.listEmployee = this.listEmployee;
    // Lấy warehouse ID cho HN
    this.reportImportExportService.getWarehouse().subscribe({
      next: (warehouseRes: any) => {
        if (warehouseRes?.data) {
          const warehouse = warehouseRes.data.find(
            (x: any) => x.WareHouseCode === 'HN'
          );
          modalRef.componentInstance.warehouseId = warehouse?.ID || 0;
        }
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy warehouse:', err);
        modalRef.componentInstance.warehouseId = 0;
      },
    });
    modalRef.componentInstance.id = this.productGroupID;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.getDataProductGroup();
      }
    });
  }
  openModalDetail() {
    const modalRef = this.modalService.open(ImportExportModalComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.productID = this.productID;

    modalRef.result.catch((result) => {
      if (result == true) {
      }
    });
  }
  getReport() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));

    this.reportImportExportService
      .getReportImportExport(
        dateStart,
        dateEnd,
        this.searchParams.warehouseCode,
        this.searchParams.group,
        this.searchParams.keyword
      )
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.dataReport = Array.isArray(res.data) ? res.data : [];

            // Vẽ bảng hoặc cập nhật
            if (!this.tableReport) {
              this.drawTable_productsale();
            } else {
              this.tableReport.replaceData(this.dataReport);
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy dữ liệu', err);
        },
      });
  }
  async exportExcel() {
    const table = this.tableReport;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo nhập xuất');

    const columns = table.getColumns();
    const filteredColumns = columns.slice(0);
    const headers = [
      'STT',
      ...filteredColumns.map((col: any) => col.getDefinition().title),
    ];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        ...filteredColumns.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          if (field === 'IsApproved') {
            value = value === true ? '✓' : ''; // hoặc '✓' / '✗'
          }

          return value;
        }),
      ];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }, // Freeze hàng đầu tiên
      ];
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Baocaonhapxuat.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  drawTable_ProductGroup() {
    this.tableProductgroup = new Tabulator('#table_productgroup', {
      data: this.dataProductGroup,
      layout: 'fitDataFill',
      height: '65vh',
      selectableRows: 1,

      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      rowFormatter: function (row) {
        const data = row.getData();
        console.log('Row data:', data); // Kiểm tra dữ liệu của từng dòng
        if (data['IsVisible'] === false) {
          row.getElement().style.backgroundColor = '#990011FF';
          row.getElement().style.color = '#D9D9D9';
        }
      },

      columns: [
        {
          title: 'Mã nhóm',
          field: 'ProductGroupID',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: '50%',
          headerFilter: true,
        },
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: '50%',
          headerFilter: true,
        },
      ],
    });

    // Nếu đã có dữ liệu, cập nhật bảng
    if (this.dataProductGroup && this.dataProductGroup.length > 0) {
      this.tableProductgroup.replaceData(this.dataProductGroup);
    }
    this.tableProductgroup.on('rowDblClick', (e: MouseEvent, row: any) => {
      const rowData = row.getData();

      this.productGroupID = rowData['ID'];
      this.zone.run(() => {
        this.openModalProductGroup(true);
      });
    });

    this.tableProductgroup.on('rowSelected', (row: RowComponent) => {
      const rowData = row.getData();
      this.searchParams.group = rowData['ID'];
      this.getReport();
    });
    this.tableProductgroup.on('rowDeselected', (row: RowComponent) => {
      // Khi một hàng bị bỏ chọn, kiểm tra xem còn hàng nào được chọn không
      const selectedRows = this.tableProductgroup.getSelectedRows();
      if (selectedRows.length === 0) {
        this.searchParams.group = 0; // Reset id về 0 (hoặc null)
        this.tableReport?.replaceData([]); // Xóa dữ liệu bảng chi tiết
      }
    });
  }
  drawTable_productsale() {
    var rowMenu = [
      {
        label: 'Chi tiết',
        action: (e: any, row: any) => {
          const rowData = row.getData(); // Lấy data trực tiếp
          this.productID = rowData['ID']; // Hoặc thuộc tính tương ứng bạn cần
          this.openModalDetail();
        },
      },
    ];
    this.tableReport = new Tabulator('#table_productsale', {
      data: this.dataReport,
      layout: 'fitDataFill',
      height: '80vh',
      selectableRows: 1,
      rowContextMenu: rowMenu,

      movableColumns: true,
      resizableRows: true,
      reactiveData: true,

      columns: [
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductNewCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Tồn DK',
          field: 'TonDauKy',
          hozAlign: 'right',
          headerHozAlign: 'center',
          formatter: 'money',
          formatterParams: { precision: 2 },
        },
        {
          title: 'Nhập',
          field: 'Import1',
          hozAlign: 'right',
          headerHozAlign: 'center',
          formatter: 'money',
          formatterParams: { precision: 2 },
        },
        {
          title: 'Xuất',
          field: 'Export1',
          hozAlign: 'right',
          headerHozAlign: 'center',
          formatter: 'money',
          formatterParams: { precision: 2 },
        },
        {
          title: 'Tồn CK',
          field: 'TonCuoiKy',
          hozAlign: 'right',
          headerHozAlign: 'center',
          formatter: 'money',
          formatterParams: { precision: 2 },
        },
        {
          title: 'Vị trí',
          field: 'AddressBox',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });

    if (this.dataReport && this.dataReport.length > 0) {
      this.tableReport.replaceData(this.dataReport);
    }
    this.tableReport.on('rowDblClick', (e: MouseEvent, row: any) => {
      const rowData = row.getData();
      console.log('hahah', rowData);
      this.productID = rowData['ProductSaleID'];
      this.zone.run(() => {
        this.openModalNewProduct();
      });
    });
  }
}
