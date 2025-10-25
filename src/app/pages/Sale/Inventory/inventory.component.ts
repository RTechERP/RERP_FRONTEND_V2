import { Component, OnInit, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { ProductsaleServiceService } from '../ProductSale/product-sale-service/product-sale-service.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProductSaleDetailComponent } from '../ProductSale/product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from '../ProductSale/product-group-detail/product-group-detail.component';
import { ImportExcelProductSaleComponent } from '../ProductSale/import-excel-product-sale/import-excel-product-sale.component';
import { InventoryService } from './inventory-service/inventory.service';
import { ProductSaleComponent } from '../ProductSale/product-sale.component';
import { InventoryBorrowNCCComponent } from './Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';

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
  selector: 'app-inventory',
  standalone:true,
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
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})

export class InventoryComponent implements OnInit, AfterViewInit {
  constructor(
    private productsaleSV: ProductsaleServiceService,
    private inventoryService:InventoryService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone ,

  ) { }

  id:number=0;
  listLocation:any[]=[];

  dataUpdate:any=[];

  wareHouseCode:string="HN";
  productGroupID:number=0;

  table_productgroup:any;
  dataProductGroup:any[]=[];

  table_pgwarehouse:any;
  dataPGWareHouse:any[]=[];

  table_inventory:any;
  dataInventory:any[]=[];

    //lưu các id khi click vào dòng productsale
  selectedList: any[] = [];

  searchParam= {
    checkedAll: true,
    Find: "",
    checkedStock: false,
  }
  newProductGroup: ProductGroup = {
    ProductGroupID: '',
    ProductGroupName: '',
    EmployeeID: 0,
    IsVisible: false,
    WareHouseID: 0
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
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    this.drawTable_ProductGroup();
    this.drawTable_PGWareHouse();
    this.drawTable_Inventory();
    this.getProductGroup();
    this.getDataProductGroupWareHouse(this.productGroupID);
  }
  openModalInventoryBorrowNCC() {
    const modalRef = this.modalService.open(InventoryBorrowNCCComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.ngAfterViewInit();
        }
      },
    );
  }
    //#region dong mo modal
    // updateProductSale() {
    //   var dataSelect = this.table_inventory.getSelectedData();
    //   this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
    //   const ids = this.selectedList.map(item => item.ProductSaleID);
    //   if (ids.length == 0) {
    //     this.notification.warning("Thông báo", "Vui lòng chọn ít nhất 1 sản phẩm để sửa!");
    //     return;
    //   }
    //   if (ids.length > 1) {
    //     this.notification.warning("Thông báo", "Vui lòng chỉ chọn 1 sản phẩm để sửa!");
    //     return;
    //   }
    //   else {
    //     const id = ids[0];
    //     this.inventoryService.getInventoryByID(id).subscribe({
    //       next: (res) => {
    //         if (res?.data) {
    //           this.dataUpdate = Array.isArray(res.data) ? res.data[0] : res.data;
    //           this.openModalProductInventory();
    //         } else {
    //           this.notification.warning('Thông báo', res.message || 'Không thể lấy thông tin vật tư!');
    //         }
    //       },
    //       error: (err) => {
    //         this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin!');
    //         console.error(err);
    //       }
    //     });
    //   }
    // }
  openModalImportExcel(){

  }
  getAllProductSale(){
    this.getInventory();
  }
  getdataFind(){

  }
   //#region các hàm lấy dữ liệu và mở mđ ProductGroup
   getProductGroup() {
    this.productsaleSV.getdataProductGroup(this.wareHouseCode,false).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          this.dataProductGroup = res.data;
          // Chỉ gán ID nếu chưa có ID được chọn
          if (!this.productGroupID) {
            this.getDataProductGroupWareHouse(res.data[0].ID);
            this.getInventory();
          }
          if (this.table_productgroup) {
            this.table_productgroup.setData(this.dataProductGroup);
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
  getDataProductGroupWareHouse(id: number) {
    this.inventoryService.getPGWH(id,this.wareHouseCode).subscribe({
      next: (res) => {
        if (res?.data) {
          // this.listPGWareHouse = Array.isArray(res.data) ? res.data : [];
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
  getInventory() {
    this.inventoryService.getInventory(this.searchParam.checkedAll,this.searchParam.Find,this.wareHouseCode,this.searchParam.checkedStock, this.productGroupID).subscribe({
      next: (res) => {
        if (res?.data) {
          this.dataInventory = res.data;
          console.log("hehehehe",this.dataInventory);
          if (!this.table_inventory) {
            this.drawTable_Inventory();
        } else {
            this.table_inventory.setData(this.dataInventory);
          }
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
      }
    });
  }

  openModalProductGroup() {
    if(this.productGroupID === 0){
      this.notification.warning("Thông báo", "Vui lòng chọn 1 nhóm sản phẩm để sửa!")
      return
    }
    // Reset lại dữ liệu trước khi gán
    this.newProductGroup = {
      ProductGroupID: '',
      ProductGroupName: '',
      EmployeeID: 0,
      IsVisible: false,
      WareHouseID: 0
    };

    this.productsaleSV.getdataProductGroupWareHouse(this.productGroupID, 1).subscribe({
      next: (res) => {
        if (res?.data && res.data.length > 0) {
          this.newProductGroup.EmployeeID = res.data[0].EmployeeID ?? 0;
        }
        this.newProductGroup.WareHouseID = 1;
        const modalRef = this.modalService.open(ProductGroupDetailComponent, {
          centered: true,
          size: 'lg',
          backdrop: 'static',
          keyboard: false
        });

        modalRef.componentInstance.newProductGroup = this.newProductGroup;
        modalRef.componentInstance.isCheckmode = true;
        modalRef.componentInstance.id = this.productGroupID;
        modalRef.componentInstance.isFromParent = true;

        modalRef.result.catch((result) => {
          if (result == true) {
            // reload lại dữ liệu
            this.getProductGroup();
            this.getDataProductGroupWareHouse(this.productGroupID);
            this.productGroupID=0;
          }
        });
      }
    });
  }
  //hàm xuất excel
  async exportExcel() {
    const today = new Date();
    const formattedDatee = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;


    const table = this.table_inventory;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`DanhSachTonKhoHN_${formattedDatee}`);


    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = ['STT', ...filteredColumns.map(
      (col: any) => col.getDefinition().title
    )];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [index + 1, ...filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        if (field === 'IsApproved') {
          value = value === true ? '✓' : '';  // hoặc '✓' / '✗'
        }

        return value;
      })];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 } // Freeze hàng đầu tiên
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
    link.download = `DanhSachTonKhoHn_${formattedDatee}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //vẽ bảng
  drawTable_ProductGroup() {
    this.table_productgroup = new Tabulator('#table_productgroup', {
      data: this.dataProductGroup,
      layout: 'fitDataFill',
      height: '100%',
      pagination: true,
      paginationSize: 15,
      selectableRows: 1,

      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        { title: 'Mã nhóm', field: 'ProductGroupID', hozAlign: 'left', headerHozAlign: 'center', width: '50%', headerFilter: true },
        { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center', width: '50%', headerFilter: true },
      ]
    });

    this.table_productgroup.on("rowClick", (e: MouseEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.productGroupID = rowData['ID'];
      console.log('Selected ID:', this.productGroupID);
      this.getInventory();
      this.getDataProductGroupWareHouse(this.productGroupID);
    });
    this.table_productgroup.on("rowDblClick", (e: MouseEvent, row: any) => {
      const rowData = row.getData();

      this.productGroupID = rowData['ID'];
      this.zone.run(() => {
        this.openModalProductGroup();
      });
    });
    this.table_productgroup.on("rowDeselected", (row: RowComponent) => {
      // Khi một hàng bị bỏ chọn, kiểm tra xem còn hàng nào được chọn không
      const selectedRows = this.table_productgroup.getSelectedRows();
      if (selectedRows.length === 0) {
        this.productGroupID = 0; // Reset id về 0 (hoặc null)
      //   this.tableReport?.replaceData([]); // Xóa dữ liệu bảng chi tiết
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

  drawTable_Inventory() {
    this.table_inventory = new Tabulator('#table_inventory', {
      data: this.dataInventory || [],
      layout: 'fitDataFill',
      height: '84vh',
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        formatter: "rowSelection",
        headerHozAlign: "center",
        hozAlign: "center",
        titleFormatter: "rowSelection",
        cellClick: (e, cell) => {
          e.stopPropagation();
        },
      },
      columns: [
        { title: 'Tên nhóm', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên sản phẩm', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'NCC', field: 'NameNCC', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Người nhập', field: 'Deliver', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Hãng', field: 'Maker', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'ĐVT', field: 'Unit', hozAlign: 'center', headerHozAlign: 'center' },
        { title: 'Tồn ĐK', field: 'TotalQuantityFirst', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Nhập', field: 'Import', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Xuất', field: 'Export', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'SL tồn thực tế', field: 'TotalQuantityLastActual', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Xuất kho giữ', field: 'TotalQuantityExportKeep', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'SL giữ', field: 'TotalQuantityKeep', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Tồn CK', field: 'TotalQuantityLast', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Tồn tối thiểu Y/c', field: 'MinQuantity', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Tồn tối thiểu thực tế', field: 'MinQuantityActual', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'SL phải trả NCC', field: 'TotalQuantityReturnNCC', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Vị trí', field: 'AddressBox', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tổng mượn', field: 'ImportPT', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Tổng trả', field: 'ExportPM', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Đang mượn', field: 'StillBorrowed', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Chi tiết nhập', field: 'Detail', hozAlign: 'left', headerHozAlign: 'center', formatter: "textarea" },
        { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' }
      ],
    });
  }
}
