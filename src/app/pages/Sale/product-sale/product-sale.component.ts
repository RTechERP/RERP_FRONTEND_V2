import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProductsaleServiceService } from './product-sale-service/productsale-service.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

interface ProductGroup {
  ID?: number;
  ProductGroupID: string;
  ProductGroupName: string;
  IsVisible: boolean;
  EmployeeID: number;
  WareHouseID: number;

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
    NgbModule
  ],
  templateUrl: './product-sale.component.html',
  styleUrl: './product-sale.component.css'
})
export class ProductSaleComponent implements OnInit, AfterViewInit {
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
  listEmployeeID: any[] = [];
  //list lưu dữ liệu kho
  listWH: any[] = [];
  //data để xóa
  dataDelete: any = {};
  //biến để check thêm hay sửa
  isCheckmode: boolean = false;
  //biến liên quan đến dữ liệu và bảng của productgroupwarehouse
  table_pgwarehouse: any;
  dataPGWareHouse: any[] = [];
  listPGWareHouse: any[] = [];
  newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0
  };

  constructor(
    private productsaleSV: ProductsaleServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    this.drawTable_ProductGroup();
    this.drawTable_PGWareHouse();
    this.drawTable_ProductSale();
    this.GetProductGroup();
    this.getdataEmployee();
    this.getdataWH();
  }
  GetProductGroup() {
    this.productsaleSV.getdataProductGroup().subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          this.listProductGroup = res.data;
          this.dataProducGroup = res.data;
          this.id = res.data[0].ID;
          // Gọi GetProductSale sau khi đã có dữ liệu và ID        
          this.GetProductSale();
          this.getDataProductGroupWareHouse(res.data[0].ID);
          if (this.table) {
            this.table.setData(this.dataProducGroup);
          } else {
            this.drawTable_ProductGroup();
          }
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy nhóm vật tư:', err);
      }
    });
  }
  getAllProductSale() {
    if (this.checkedALL == true) {
      this.productsaleSV.getdataProductSalebyID(0, this.keyword, this.checkedALL).subscribe({
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
        }
      });
    }
    else {
      this.getDataProductSaleByIDgroup(this.id);

    }
  }
  GetProductSale() {
    if (!this.id) return;
    this.productsaleSV.getdataProductSalebyID(this.id, this.keyword, this.checkedALL).subscribe({
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
      }
    });
  }
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
        { title: 'Mã nhóm', field: 'ProductGroupID', hozAlign: 'left', headerHozAlign: 'center', width: '50%' },
        { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center', width: '50%' },
      ]
    });

    this.table.on("rowClick", (e: MouseEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.dataDelete = rowData;
      this.id = rowData['ID'];
      console.log('Selected ID:', this.id);
      this.getDataProductSaleByIDgroup(this.id);
      this.getDataProductGroupWareHouse(this.id);
    });
  }

  getDataProductSaleByIDgroup(id: number) {
    if (this.checkedALL == false) {
      this.productsaleSV.getdataProductSalebyID(id, this.keyword, false).subscribe({
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
        }
      });
    }
  }
  getdataFind() {
    if (this.checkedALL == true) {
      this.getAllProductSale();
    }
    else {
      this.getDataProductSaleByIDgroup(this.id);
    }
  }
  getDataProductGroupWareHouse(id: number) {
    this.productsaleSV.getdataProductGroupWareHouse(id).subscribe({
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
      }
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
        { title: 'Kho', field: 'WarehouseCode', hozAlign: 'left', headerHozAlign: 'center', width: '50%' },
        { title: 'NV phụ trách', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: '50%' },
      ]
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
      columns: [
        { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã Sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên Sản phẩm', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Hãng', field: 'Maker', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Vị trí', field: 'LocationName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chi tiết nhập', field: 'Detail', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' }
      ]
    });
  }

  getdataEmployee() {
    this.productsaleSV.getdataEmployee().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listEmployeeID = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
      }
    });
  }
  getdataWH() {
    this.productsaleSV.getdataWareHouse().subscribe({
      next: (res) => {
        if (res?.data) {
          this.listWH = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }

  addProductGroup() {
    if (!this.newProductGroup.ProductGroupID || !this.newProductGroup.ProductGroupName || !this.newProductGroup.EmployeeID || !this.newProductGroup.WareHouseID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (this.isCheckmode == true) {
      // Update existing product group
      const payload = {
        Productgroup: {
          ID: this.id,
          ProductGroupID: this.newProductGroup.ProductGroupID,
          ProductGroupName: this.newProductGroup.ProductGroupName,
          EmployeeID: this.newProductGroup.EmployeeID,
        
        },
        ProductgroupWarehouse: {
          WarehouseID: this.newProductGroup.WareHouseID,
          EmployeeID: this.newProductGroup.EmployeeID,
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        }
      };

      this.productsaleSV.updateProductGroup(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal();
            this.GetProductGroup();
            this.getDataProductGroupWareHouse(this.id);
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể cập nhật nhóm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error(err);
        }
      });
    } else {
      // Add new product group
      const payload = {
        Productgroup: {
          ProductGroupID: this.newProductGroup.ProductGroupID,
          ProductGroupName: this.newProductGroup.ProductGroupName,
          EmployeeID: this.newProductGroup.EmployeeID,
          IsVisible: true
        },
        ProductgroupWarehouse: {
          WarehouseID: this.newProductGroup.WareHouseID,
          EmployeeID: this.newProductGroup.EmployeeID,
          CreatedBy: 'admin',
          CreatedDate: new Date(),
          UpdatedBy: 'admin',
          UpdatedDate: new Date()
        }
      };

      this.productsaleSV.addnewProductGroup(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
            this.GetProductGroup();
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể thêm nhóm!');
          }
        },
        error: (err) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
          console.error(err);
        }
      });
    }
  }
  deleteProductGroup() {
    if (this.dataDelete.IsVisible == false) {
      this.notification.warning('Thông báo', 'Nhóm vật tư đang ở trạng thái đã xóa');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productsaleSV.deleteProductGroup(this.dataDelete).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', res.message || 'Đã xóa thành công!');
              this.GetProductGroup();
            } else {
              this.notification.warning('Thông báo', res.message || 'Không thể xóa nhóm!');
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
            console.error(err);
          }
        });
      }
    });
  }
  openModalProductGroup() {
    const modalEl = document.getElementById('detailProductGroupModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      // console.log('ischeckmode:', this.isCheckmode);
    }
  }
  openModalForNewProduct() {
    this.isCheckmode = false;
    this.newProductGroup = {
      ProductGroupID: '',
      ProductGroupName: '',
      EmployeeID: 0,
      IsVisible: false,
      WareHouseID: 0
    };
    this.openModalProductGroup();
  }
  updateProductGroup() {
    this.isCheckmode = true;
    this.productsaleSV.getdataProductGroupbyID(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newProductGroup = {
            ProductGroupID: data.ProductGroupID,
            ProductGroupName: data.ProductGroupName,
            EmployeeID: data.EmployeeID,
            IsVisible: data.IsVisible,
            WareHouseID: data.WarehouseID
          };
          this.openModalProductGroup();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể lấy thông tin nhóm!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin!');
        console.error(err);
      }
    });
  }
  closeModal() {
    const modalEl = document.getElementById('detailProductGroupModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.hide();
    }
  }
}
