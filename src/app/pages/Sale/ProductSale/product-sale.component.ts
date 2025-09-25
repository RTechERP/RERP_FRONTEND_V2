import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from '@ng-bootstrap/ng-bootstrap';

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
import { ProductsaleServiceService } from './product-sale-service/product-sale-service.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProductSaleDetailComponent } from './product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from './product-group-detail/product-group-detail.component';
import { ImportExcelProductSaleComponent } from './import-excel-product-sale/import-excel-product-sale.component';
import { ISADMIN } from '../../../app.config';

interface ProductGroup {
  ID?: number;
  ProductGroupID: string;
  ProductGroupName: string;
  IsVisible: boolean;
  EmployeeID: number;
  WareHouseID: number;
}
interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  Unit: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
}

@Component({
  selector: 'app-product-sale',
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
    NzCheckboxModule,
    NgbModule,
    ProductSaleDetailComponent,
    ImportExcelProductSaleComponent,
  ],
  templateUrl: './product-sale.component.html',
  styleUrl: './product-sale.component.css',
})
export class ProductSaleComponent implements OnInit, AfterViewInit {
  //VP tai dau
  wareHouseCode: string = 'HN';
  //biến liên quan đến dữ liệu và bảng của productSale
  table_productsale: any;
  dataProductSale: any[] = [];
  listProductSale: any[] = [];

  // biến liên quan đến dữ liệu và bảng của productGroup
  table: any;
  listProductGroup: any[] = [];
  dataProducGroup: any[] = [];

  // các biến truyền vào của hàm getDataProductSale
  id: number = 0;
  keyword: string = '';
  checkedALL: boolean = false;

  //list lưu dữ liệu employee
  listEmployee: any[] = [];
  //list lưu dữ liệu kho
  listWH: any[] = [];
  //data để xóa
  dataDelete: any = {};
  //biến để check thêm hay sửa
  isCheckmode: boolean = false;
  //biến liên quan đến dữ liệu và bảng của productgroupwarehouse

  //list lấy dữ liệu đơn vị productsale
  listUnitCount: any[] = [];

  //list lấy dữ liệu nhóm kho
  listProductGroupcbb: any[] = [];

  //list lấy dữ liệu hãng
  listFirm: any[] = [];
  //list lấy dữ liệu vị trí
  listLocation: any[] = [];

  //lưu các id khi click vào dòng productsale
  selectedList: any[] = [];
  //luwua các id khi click vào dòng productgroup

  table_pgwarehouse: any;
  dataPGWareHouse: any[] = [];
  listPGWareHouse: any[] = [];
  newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0,
  };

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
  };

  constructor(
    private productsaleSV: ProductsaleServiceService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService
  ) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.drawTable_ProductGroup();
    this.drawTable_PGWareHouse();
    this.drawTable_ProductSale();
    this.getProductGroup();
    this.getdataEmployee();
    this.getDataWareHouse();
    this.getdataUnit();
    this.getDataProductGroupCBB();
  }
  //#region các hàm lấy dữ liệu và mở mđ ProductGroup
  getProductGroup() {
    this.productsaleSV
      .getdataProductGroup(this.wareHouseCode, false)
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            this.listProductGroup = res.data;
            this.dataProducGroup = res.data;
            // Chỉ gán ID nếu chưa có ID được chọn
            if (!this.id) {
              this.id = res.data[0].ID;
              this.getProductSaleByID(this.id);
              this.getDataProductGroupWareHouse(this.id);
            }
            if (this.table) {
              this.table.setData(this.dataProducGroup);
            } else {
              this.drawTable_ProductGroup();
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy nhóm vật tư:', err);
        },
      });
  }
  deleteProductGroup() {
    const payload = {
      Productgroup: {
        ID: this.id,
        IsVisible: false,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      },
    };
    if (this.dataDelete.IsVisible == false) {
      this.notification.warning(
        'Thông báo',
        'Nhóm vật tư đang ở trạng thái đã xóa'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productsaleSV.savedataProductGroup(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                'Thông báo',
                res.message || 'Đã xóa thành công!'
              );
              this.id = 0; // Set to 0 to trigger selection of first record in GetProductGroup
              this.getProductGroup();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa nhóm!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
            console.error(err);
          },
        });
      },
    });
  }
  openModalProductGroup(isEditmode: boolean) {
    this.isCheckmode = isEditmode;
    console.log('is', this.isCheckmode);
    const modalRef = this.modalService.open(ProductGroupDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductGroup = this.newProductGroup;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.listWH = this.listWH;
    modalRef.componentInstance.listEmployee = this.listEmployee;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.getProductGroup();
        this.getDataProductGroupWareHouse(this.id);
        this.getDataProductSaleByIDgroup(this.id);
        this.drawTable_PGWareHouse();
        this.drawTable_ProductGroup();
      }
    });
  }
  //#endregion

  //#region hàm liên quan productSale
  getAllProductSale() {
    if (this.checkedALL == true) {
      this.productsaleSV
        .getdataProductSalebyID(0, this.keyword, this.checkedALL)
        .subscribe({
          next: (res) => {
            if (res?.data) {
              this.listProductSale = Array.isArray(res.data) ? res.data : [];
              this.dataProductSale = res.data;
              if (this.table_productsale) {
                this.table_productsale.replaceData(this.dataProductSale);
              } else {
                this.drawTable_ProductSale();
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
          },
        });
    } else {
      this.getDataProductSaleByIDgroup(this.id);
    }
  }
  getProductSaleByID(id: number) {
    if (!this.id) return;
    this.productsaleSV
      .getdataProductSalebyID(id, this.keyword, this.checkedALL)
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.listProductSale = Array.isArray(res.data) ? res.data : [];
            this.dataProductSale = res.data;
            if (this.table_productsale) {
              this.table_productsale.replaceData(this.dataProductSale);
            } else {
              this.drawTable_ProductSale();
            }
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
        },
      });
  }
  getDataProductSaleByIDgroup(id: number) {
    if (this.checkedALL == false) {
      this.productsaleSV
        .getdataProductSalebyID(id, this.keyword, false)
        .subscribe({
          next: (res) => {
            if (res?.data) {
              this.listProductSale = Array.isArray(res.data) ? res.data : [];
              this.dataProductSale = res.data;
              if (this.table_productsale) {
                this.table_productsale.replaceData(this.dataProductSale);
              } else {
                this.drawTable_ProductSale();
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
          },
        });
    }
  }
  // hàm để fill dữ liệu lên
  updateProductSale() {
    this.isCheckmode = true;
    var dataSelect = this.table_productsale.getSelectedData();
    this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
    const ids = this.selectedList.map((item) => item.ID);
    if (ids.length == 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 sản phẩm để sửa!'
      );
      return;
    }
    if (ids.length > 1) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chỉ chọn 1 sản phẩm để sửa!'
      );
      return;
    } else {
      const id = ids[0];
      this.productsaleSV.getDataProductSalebyID(id).subscribe({
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
            };

            // Tải dữ liệu location cho nhóm sản phẩm đã chọn
            this.productsaleSV
              .getDataLocation(this.newProductSale.ProductGroupID)
              .subscribe({
                next: (locationRes) => {
                  if (locationRes?.data) {
                    this.listLocation = Array.isArray(locationRes.data)
                      ? locationRes.data
                      : [];
                    this.openModalProductSale();
                  }
                },
                error: (err) => {
                  console.error('Lỗi khi tải dữ liệu location:', err);
                  this.openModalProductSale(); // Vẫn mở modal ngay cả khi tải location thất bại
                },
              });
          } else {
            this.notification.warning(
              'Thông báo',
              res.message || 'Không thể lấy thông tin nhóm!'
            );
          }
        },
        error: (err) => {
          this.notification.error(
            'Thông báo',
            'Có lỗi xảy ra khi lấy thông tin!'
          );
          console.error(err);
        },
      });
    }
  }
  deleteProductSale() {
    const dataSelect: ProductSale[] = this.table_productsale.getSelectedData();
    console.log('ban ghi xoa', dataSelect);
    const payloads = dataSelect.map((item) => ({
      ProductSale: {
        ...item,
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      },
    }));
    console.log('test', payloads);

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productsaleSV.saveDataProductSale(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.id = 0; // Set to 0 to trigger selection of first record in GetProductGroup
              this.getProductGroup();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa vật tư!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
            console.error(err);
          },
        });
      },
    });
  }
  //#endregion

  //#region  Vẽ 3 bảng
  drawTable_ProductGroup() {
    this.table = new Tabulator('#table_productgroup', {
      data: this.dataProducGroup,
      layout: 'fitDataFill',
      height: '100%',
      pagination: true,
      paginationSize: 15,
      selectableRows: 1,

      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      rowFormatter: function (row) {
        const data = row.getData();
        console.log('dd', data); // Kiểm tra dữ liệu của từng dòng
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

    this.table.on('rowClick', (e: MouseEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.dataDelete = rowData;
      this.id = rowData['ID'];
      console.log('Selected ID:', this.id);
      this.getDataProductSaleByIDgroup(this.id);
      this.getDataProductGroupWareHouse(this.id);
    });
  }
  drawTable_PGWareHouse() {
    this.table_pgwarehouse = new Tabulator('#table_pgwarehouse', {
      data: this.dataPGWareHouse || [],
      layout: 'fitDataFill',
      height: '100%',
      pagination: true,
      paginationSize: 15,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        {
          title: 'Kho',
          field: 'WarehouseCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: '50%',
        },
        {
          title: 'NV phụ trách',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: '50%',
        },
      ],
    });
  }
  drawTable_ProductSale() {
    this.table_productsale = new Tabulator('#table_productsale', {
      data: this.dataProductSale,
      layout: 'fitDataFill',
      height: '100%',
      pagination: true,
      paginationSize: 18,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: 5,
      columns: [
        {
          title: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: 40,
          frozen: true,
        },
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã Sản phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên Sản phẩm',
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
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Vị trí',
          field: 'LocationName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Chi tiết nhập',
          field: 'Detail',
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
    this.table_productsale.on(
      'rowDblClick',
      (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedList = [rowData]; // Make it an array with single item
        const id = rowData['ID'];
        this.productsaleSV.getDataProductSalebyID(id).subscribe({
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
              };

              // Tải dữ liệu location cho nhóm sản phẩm đã chọn
              this.productsaleSV
                .getDataLocation(this.newProductSale.ProductGroupID)
                .subscribe({
                  next: (locationRes) => {
                    if (locationRes?.data) {
                      this.listLocation = Array.isArray(locationRes.data)
                        ? locationRes.data
                        : [];
                      this.openModalProductSale();
                    }
                  },
                  error: (err) => {
                    console.error('Lỗi khi tải dữ liệu location:', err);
                    this.openModalProductSale(); // Vẫn mở modal ngay cả khi tải location thất bại
                  },
                });
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể lấy thông tin nhóm!'
              );
            }
          },
          error: (err) => {
            this.notification.error(
              'Thông báo',
              'Có lỗi xảy ra khi lấy thông tin!'
            );
            console.error(err);
          },
        });
      }
    );
  }
  //#endregion

  //hàm tìm kiếm
  getdataFind() {
    if (this.checkedALL == true) {
      this.getAllProductSale();
    } else {
      this.getDataProductSaleByIDgroup(this.id);
    }
  }

  getDataProductGroupWareHouse(id: number) {
    this.productsaleSV.getdataProductGroupWareHouse(id, 0).subscribe({
      next: (res) => {
        if (res?.data) {
          this.listPGWareHouse = Array.isArray(res.data) ? res.data : [];
          this.dataPGWareHouse = res.data;
          if (!this.table_pgwarehouse) {
            this.drawTable_PGWareHouse();
          } else {
            this.table_pgwarehouse.setData(this.dataPGWareHouse);
          }
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
      },
    });
  }
  getdataEmployee() {
    this.productsaleSV.getdataEmployee().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listEmployee = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
      },
    });
  }
  getdataUnit() {
    this.productsaleSV.getdataUnitCount().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listUnitCount = Array.isArray(res.data) ? res.data : [];
          console.log('don vi tinh', this.listUnitCount);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }
  getDataProductGroupCBB() {
    this.productsaleSV.getDataProductGroupcbb().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }
  getDataWareHouse() {
    this.productsaleSV.getdataWareHouse().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listWH = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      },
    });
  }

  openModalProductSale() {
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductSale = this.newProductSale;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.listLocation = this.listLocation;
    modalRef.componentInstance.listUnitCount = this.listUnitCount;
    modalRef.componentInstance.listProductGroupcbb = this.listProductGroupcbb;
    modalRef.componentInstance.selectedList = this.selectedList;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.getProductGroup();
        this.getDataProductSaleByIDgroup(this.id);
      }
    });
  }

  openModalForNewProductSale() {
    this.isCheckmode = false;
    this.newProductSale = {
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
    };
    this.openModalProductSale();
  }

  openModalImportExcel() {
    const modalRef = this.modalService.open(ImportExcelProductSaleComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.getDataProductSaleByIDgroup(this.id);
      }
    });
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.table_productsale;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách vật tư');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
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

          return value;
        }),
      ];

      worksheet.addRow(rowData);
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
    link.download = `DanhSachVatTuKhoSale.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion
}
