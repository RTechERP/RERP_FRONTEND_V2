import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  NgZone,
  ElementRef,
  Inject,
  Optional,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
import { ProductsaleServiceService } from '../ProductSale/product-sale-service/product-sale-service.service';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ProductSaleDetailComponent } from '../ProductSale/product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from '../ProductSale/product-group-detail/product-group-detail.component';
import { ImportExcelProductSaleComponent } from '../ProductSale/import-excel-product-sale/import-excel-product-sale.component';
import { BillExportDetailComponent } from '../BillExport/Modal/bill-export-detail/bill-export-detail.component';

import { AppUserService } from '../../../../services/app-user.service';
import { InventoryService } from './inventory-service/inventory.service';
import { InventoryBorrowNCCComponent } from './Modal/inventory-borrow-ncc/inventory-borrow-ncc.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { MenuEventService } from '../../../systems/menus/menu-service/menu-event.service';
import { ChiTietSanPhamSaleComponent } from '../chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';

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
    NzCheckboxModule,
    NzSpinModule,
    NgbModule,
    ProductSaleDetailComponent,
    ImportExcelProductSaleComponent,
    ProductGroupDetailComponent,
    InventoryBorrowNCCComponent,
    HasPermissionDirective,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit, AfterViewInit {
  constructor(
    private productsaleSV: ProductsaleServiceService,
    private inventoryService: InventoryService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone,
    private menuEventService: MenuEventService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}

  id: number = 0;
  listLocation: any[] = [];

  dataUpdate: any = [];

  warehouseCode: string = 'HN';
  productGroupID: number = 0;

  table_productgroupInven: any;
  dataProductGroup: any[] = [];

  table_pgwarehouse: any;
  dataPGWareHouse: any[] = [];

  table_inventory: any;
  dataInventory: any[] = [];

  //lưu các id khi click vào dòng productsale
  selectedList: any[] = [];

  // Loading states
  isLoadingProductGroup: boolean = false;
  isLoadingInventory: boolean = false;

  searchParam = {
    checkedAll: true,
    Find: '',
    checkedStock: false,
  };
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
  ngOnInit(): void {
    if (this.tabData?.warehouseCode) {
      this.warehouseCode = this.tabData.warehouseCode;
    }
  }
  ngAfterViewInit(): void {
    this.drawTable_ProductGroup();
    this.drawTable_PGWareHouse();
    this.drawTable_Inventory();
    this.getProductGroup();
    this.getDataProductGroupWareHouse(this.productGroupID);

    // Disable product group table on init since checkedAll is true by default
    if (this.searchParam.checkedAll && this.table_productgroupInven) {
      this.table_productgroupInven.options.selectable = false;
    }
  }
  openModalInventoryBorrowNCC() {
    // Mở tab mới với component InventoryBorrowNCCComponent
    this.menuEventService.openNewTab(
      InventoryBorrowNCCComponent,
      'Danh sách mượn NCC',
      {}
    );
  }

  requestBorrow() {
    try {
      const selectedData = this.table_inventory.getSelectedData();
      if (!selectedData || selectedData.length === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Vui lòng chọn ít nhất 1 sản phẩm để mượn!'
        );
        return;
      }

      // Check if any selected product has TotalQuantityLast <= 0
      const invalidProducts = selectedData.filter((row: any) => {
        const totalQuantityLast = row.TotalQuantityLast || 0;
        return totalQuantityLast <= 0;
      });

      // Filter valid products (TotalQuantityLast > 0)
      const validProducts = selectedData.filter((row: any) => {
        const totalQuantityLast = row.TotalQuantityLast || 0;
        return totalQuantityLast > 0;
      });

      // Show warning for invalid products
      if (invalidProducts.length > 0) {
        const productNames = invalidProducts
          .map((p: any) => p.ProductCode || p.ProductName)
          .join(', ');
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Các sản phẩm sau có tồn cuối kỳ <= 0 và sẽ không được mượn:\n${productNames}`
        );
      }

      // If no valid products remaining, stop
      if (validProducts.length === 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Không có sản phẩm nào hợp lệ để mượn!'
        );
        return;
      }

      // Group valid selected rows by warehouse and product group
      const groupedData = new Map<string, any[]>();

      validProducts.forEach((row: any) => {
        const warehouseID = row.WarehouseID || 0;
        // Use ProductGroupID as KhoTypeID (matching C# logic)
        const khoTypeID = row.ProductGroupID || 0;
        const key = `${warehouseID}_${khoTypeID}`;

        if (!groupedData.has(key)) {
          groupedData.set(key, []);
        }
        groupedData.get(key)!.push(row);
      });

      if (groupedData.size > 1) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn chọn sản phẩm từ ${groupedData.size} kho.\nPhần mềm sẽ tự động tạo ${groupedData.size} phiếu mượn`
        );
      }

      // Open bill-export-detail modal for each group
      groupedData.forEach((groupRows: any[], key: string) => {
        const [warehouseID, khoTypeID] = key.split('_').map(x => parseInt(x));

        // Prepare data table with selected rows
        const dtDetail = this.prepareDetailData(groupRows);

        // Prepare lstTonCk
        const lstTonCk = this.prepareTonCkData(groupRows);

        // Create newBillExport object
        // Open modal
        this.openBillExportDetailModal(dtDetail, lstTonCk, warehouseID,khoTypeID);
      });
    } catch (error) {
      console.error('Error in requestBorrow:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Có lỗi xảy ra khi xử lý yêu cầu mượn'
      );
    }
  }

  /**
   * Prepare detail data from selected inventory rows
   */
  private prepareDetailData(selectedRows: any[]): any[] {
    return selectedRows.map((row: any, index: number) => ({
      STT: index + 1,
      ProductCode: row.ProductCode,
      ProductName: row.ProductName,
      ProductNewCode: row.ProductNewCode,
      ProductID: row.ProductSaleID || row.ProductID,
      ProductSaleID: row.ProductSaleID,
      Qty: 0, // User will fill this
      Unit: row.Unit,
      ProductGroupID: row.KhoTypeID,
      ProductGroupName: row.ProductGroupName,
      WarehouseID: row.WarehouseID,
      WarehouseCode: row.WarehouseCode,
      TotalQuantityLast: row.TotalQuantityLast,
      TotalInventory: row.TotalQuantityLast,
      Maker: row.Maker,
      NameNCC: row.NameNCC,
      AddressBox: row.AddressBox,
    }));
  }

  /**
   * Prepare lstTonCk data (stock inventory)
   */
  private prepareTonCkData(selectedRows: any[]): any[] {
    return selectedRows.map((row: any) => ({
      ProductSaleID: row.ProductSaleID || row.ProductID,
      TotalQuantityLast: row.TotalQuantityLast,
    }));
  }

  /**
   * Open bill-export-detail modal for borrow request
   */
  private openBillExportDetailModal(
    dtDetail: any[],
    lstTonCk: any[],
    warehouseID: number,
    khoTypeID:number
  ) {
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Set input properties matching WinForms logic (C# lines 118-128)
    modalRef.componentInstance.isBorrow = true;
    modalRef.componentInstance.selectedList = dtDetail;
    modalRef.componentInstance.lstTonCk = lstTonCk;
    modalRef.componentInstance.KhoTypeID = khoTypeID;
    modalRef.componentInstance.wareHouseCode = this.getWarehouseCode(warehouseID);

    modalRef.componentInstance.newBillExport = {
      ...modalRef.componentInstance.newBillExport,
      WarehouseID: warehouseID,
      KhoTypeID: khoTypeID,
    };

    modalRef.result
      .then((result) => {
        if (result === true) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Phiếu mượn đã được tạo thành công!'
          );
          this.getAllProductSale();
        }
      })
      .catch((error) => {
      });
  }

  /**
   * Get warehouse code by warehouse ID
   */
  private getWarehouseCode(warehouseID: number): string {
    // Match C# logic: frm.WarehouseCode = VP (where VP is current warehouse)
    // Use current wareHouseCode from component state
    return this.warehouseCode || 'HN';
  }
  //#region dong mo modal
  // updateProductSale() {
  //   var dataSelect = this.table_inventory.getSelectedData();
  //   this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
  //   const ids = this.selectedList.map(item => item.ProductSaleID);
  //   if (ids.length == 0) {
  //     this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn ít nhất 1 sản phẩm để sửa!");
  //     return;
  //   }
  //   if (ids.length > 1) {
  //     this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chỉ chọn 1 sản phẩm để sửa!");
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
  //           this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể lấy thông tin vật tư!');
  //         }
  //       },
  //       error: (err) => {
  //         this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin!');
  //         console.error(err);
  //       }
  //     });
  //   }
  // }
  openModalImportExcel() {}
  getAllProductSale() {
    this.getInventory();

    // Enable/disable product group table based on checkedAll
    if (this.table_productgroupInven) {
      if (this.searchParam.checkedAll) {
        // Disable selection when checkedAll is true
        this.table_productgroupInven.deselectRow();
        this.productGroupID = 0;
        // Disable row selection
        this.table_productgroupInven.options.selectableRows = false;
      } else {
        // Enable row selection
        this.table_productgroupInven.options.selectableRows = 1;
      }
      // Redraw table to apply changes
      this.table_productgroupInven.redraw();
    }
  }
  getdataFind() {
    this.getInventory();
  }
  //#region các hàm lấy dữ liệu và mở mđ ProductGroup
  getProductGroup() {
    this.isLoadingProductGroup = true;
    this.productsaleSV
      .getdataProductGroup(this.warehouseCode, false)
      .subscribe({
        next: (res) => {
          this.isLoadingProductGroup = false;
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            this.dataProductGroup = res.data;
            // Chỉ gán ID nếu chưa có ID được chọn
            if (!this.productGroupID) {
              this.getDataProductGroupWareHouse(res.data[0].ID);
              this.getInventory();
            }
            if (this.table_productgroupInven) {
              this.table_productgroupInven
                .setData(this.dataProductGroup)
                .then(() => {
                  // Tự động select dòng đầu tiên
                  const rows = this.table_productgroupInven.getRows();
                  if (rows.length > 0) {
                    rows[0].select();
                  }
                });
            } else {
              this.drawTable_ProductGroup();
            }
          }
        },
        error: (err) => {
          this.isLoadingProductGroup = false;
          console.error('Lỗi khi lấy nhóm vật tư:', err);
        },
      });
  }
  getDataProductGroupWareHouse(id: number) {
    this.inventoryService.getPGWH(id, this.warehouseCode).subscribe({
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
      },
    });
  }
  getInventory() {
    // For remote pagination, just trigger reload by setting page to 1
    if (!this.table_inventory) {
      this.drawTable_Inventory();
    } else {
      // Reload data with current filters using setPage to trigger ajaxRequestFunc
      this.table_inventory.setPage(1);
    }

    // Old local pagination code - commented out
    // this.isLoadingInventory = true;
    // this.inventoryService
    //   .getInventory(
    //     this.searchParam.checkedAll,
    //     this.searchParam.Find,
    //     this.wareHouseCode,
    //     this.searchParam.checkedStock,
    //     this.productGroupID
    //   )
    //   .subscribe({
    //     next: (res) => {
    //       this.isLoadingInventory = false;
    //       if (res?.data) {
    //         this.dataInventory = res.data;
    //         console.log('hehehehe', this.dataInventory);
    //         if (!this.table_inventory) {
    //           this.drawTable_Inventory();
    //         } else {
    //           this.table_inventory.setData(this.dataInventory);
    //         }
    //       }
    //     },
    //     error: (err) => {
    //       this.isLoadingInventory = false;
    //       console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
    //     },
    //   });
  }

  openModalProductGroup() {
    if (this.productGroupID === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn 1 nhóm sản phẩm để sửa!'
      );
      return;
    }
    // Reset lại dữ liệu trước khi gán
    this.newProductGroup = {
      ProductGroupID: '',
      ProductGroupName: '',
      EmployeeID: 0,
      IsVisible: false,
      WareHouseID: 0,
    };

    this.productsaleSV
      .getdataProductGroupWareHouse(this.productGroupID, 1)
      .subscribe({
        next: (res) => {
          if (res?.data && res.data.length > 0) {
            this.newProductGroup.EmployeeID = res.data[0].EmployeeID ?? 0;
          }
          this.newProductGroup.WareHouseID = 1;
          const modalRef = this.modalService.open(ProductGroupDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
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
              this.productGroupID = 0;
            }
          });
        },
      });
  }
  //hàm xuất excel
  async exportExcel() {
    const today = new Date();
    const formattedDatee = `${today.getDate().toString().padStart(2, '0')}${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

    const table = this.table_inventory;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `DanhSachTonKhoHN_${formattedDatee}`
    );

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
    link.download = `DanhSachTonKhoHn_${formattedDatee}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //vẽ bảng
  @ViewChild('tableProductGroup') tableProductGroupRef!: ElementRef;
  @ViewChild('tablePGWarehouse') tablePGWarehouseRef!: ElementRef;
  @ViewChild('tableInventory') tableInventoryRef!: ElementRef;
  drawTable_ProductGroup() {

    this.table_productgroupInven = new Tabulator(
      this.tableProductGroupRef.nativeElement,
      {
        data: this.dataProductGroup,
        layout: 'fitDataFill',

        ...DEFAULT_TABLE_CONFIG,

        pagination: false,
        height: '60vh',
        selectableRows: this.searchParam.checkedAll ? false : 1, // Disable selection if checkedAll is true
        columns: [
          {
            title: 'Mã nhóm',
            field: 'ProductGroupID',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: '50%',
          },
          {
            title: 'Tên nhóm',
            field: 'ProductGroupName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: '50%',
          },
        ],
      }
    );

    this.table_productgroupInven.on(
      'rowSelected',
      (e: MouseEvent, row: RowComponent) => {
        const selectrow = this.table_productgroupInven.getSelectedRows();
        if (selectrow.length === 0) {
          this.productGroupID = 0;
          return;
        }
        const rowData = selectrow[0].getData();
        this.productGroupID = rowData['ID'];

        this.getInventory();
        this.getDataProductGroupWareHouse(this.productGroupID);
      }
    );
    this.table_productgroupInven.on(
      'rowDblClick',
      (e: MouseEvent, row: any) => {
        const rowData = row.getData();

        this.productGroupID = rowData['ID'];
        this.zone.run(() => {
          this.openModalProductGroup();
        });
      }
    );
    this.table_productgroupInven.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.table_productgroupInven.getSelectedRows();
      if (selectedRows.length === 0) {
        this.productGroupID = 0;
      }
    });

    // Tự động select dòng đầu tiên sau khi table được khởi tạo (chỉ khi checkedAll = false)
    this.table_productgroupInven.on('tableBuilt', () => {
      if (!this.searchParam.checkedAll) {
        const rows = this.table_productgroupInven.getRows();
        if (rows.length > 0) {
          rows[0].select();
        }
      }
    });
  }
  drawTable_PGWareHouse() {
    this.table_pgwarehouse = new Tabulator(
      this.tablePGWarehouseRef.nativeElement,
      {
        data: this.dataPGWareHouse || [],
        layout: 'fitDataFill',
        height: '100%',
        pagination: false,
        paginationSize: 15,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        // ...DEFAULT_TABLE_CONFIG,
        langs: {
          vi: {
            pagination: {
              first: '<<',
              last: '>>',
              prev: '<',
              next: '>',
            },
          },
        },
        columnDefaults: {
          headerWordWrap: true,
          headerVertical: false,
          headerHozAlign: 'center',
          minWidth: 60,
          hozAlign: 'left',
          vertAlign: 'middle',
          resizable: true,
        },
        locale: 'vi',
        paginationMode: 'local',
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
      }
    );
  }

  drawTable_Inventory() {
    // Context menu cho bảng inventory
    const contextMenu = [
      {
        label: '<i class="fa fa-info-circle"></i> Chi tiết sản phẩm',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.zone.run(() => {
            this.openChiTietSanPhamSale(rowData);
          });
        },
      },
    ];

    this.table_inventory = new Tabulator(this.tableInventoryRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataFill',
      height: '89vh',
      pagination: true,
      paginationSize: 50,
      paginationSizeSelector: [10, 25, 50, 100, 200, 500],
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      paginationMode: 'remote',
      ajaxURL: 'dummy', // Required but not used with ajaxRequestFunc
      ajaxRequestFunc: (_url: string, _config: any, params: any) => {
        return new Promise((resolve, reject) => {
          const page = params.page || 1;
          const size = params.size || 50;

          this.inventoryService
            .getInventoryPagination(
              this.searchParam.checkedAll,
              this.searchParam.Find,
              this.warehouseCode,
              this.searchParam.checkedStock,
              this.productGroupID,
              size,
              page
            )
            .subscribe({
              next: (res) => {
                if (res?.data) {
                  // Tabulator expects { last_page, data } format
                  resolve({
                    last_page: res.data[0].TotalPage,
                    data: res.data,
                  });
                } else {
                  resolve({ last_page: 1, data: [] });
                }
              },
              error: (err) => {
                console.error('Error loading inventory data:', err);
                reject(err);
              },
            });
        });
      },
      rowContextMenu: contextMenu,
      columns: [
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          frozen: true,
        },
                {
          title: 'Tích xanh',
          field: 'IsFix',
          hozAlign: 'center',
          headerHozAlign: 'center',
        formatter: function (cell: any) {
              const value = cell.getValue();
              const checked =
                value === true ||
                value === 'true' ||
                value === 1 ||
                value === '1';
              return `<input type="checkbox" ${
                checked ? 'checked' : ''
              } style="pointer-events: none; accent-color: #1677ff;" />`;
            },
            frozen: true,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea',
          frozen: true,
        },
                {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea',
          frozen: true,
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          frozen: true,
        },

        {
          title: 'NCC',
          field: 'NameNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea'
        },
        {
          title: 'Người nhập',
          field: 'Deliver',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea'
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
          title: 'Tồn đầu kỳ',
          field: 'TotalQuantityFirst',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Nhập',
          field: 'Import',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Xuất',
          field: 'Export',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'SL tồn thực tế',
          field: 'TotalQuantityLastActual',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
                {
          title: 'SL yêu cầu xuất',
          field: 'QuantityRequestExport',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        // {
        //   title: 'Xuất kho giữ',
        //   field: 'TotalQuantityExportKeep',
        //   hozAlign: 'right',
        //   headerHozAlign: 'center',
        // },
        {
          title: 'SL giữ',
          field: 'TotalQuantityKeep',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },

        {
          title: 'Tồn CK(được xử dụng)',
          field: 'TotalQuantityLast',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
                        {
          title: 'Tồn sử dụng',
          field: 'QuantityUse',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Tồn tối thiểu Y/c',
          field: 'MinQuantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Tồn tối thiểu thực tế',
          field: 'MinQuantityActual',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'SL phải trả NCC',
          field: 'TotalQuantityReturnNCC',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },

        {
          title: 'Tổng mượn',
          field: 'ImportPT',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Tổng trả',
          field: 'ExportPM',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
        {
          title: 'Đang mượn',
          field: 'StillBorrowed',
          hozAlign: 'right',
          headerHozAlign: 'center',
        },
                {
          title: 'Vị trí',
          field: 'AddressBox',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea'
        },
        {
          title: 'Chi tiết nhập',
          field: 'Detail',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter:'textarea'
        },
      ],
    });
  }

  /**
   * Mở tab chi tiết sản phẩm sale với các tham số
   * @param productData Dữ liệu sản phẩm từ inventory
   */
  openChiTietSanPhamSale(productData: any) {
    // Chuẩn bị data để truyền vào component chi-tiet-san-pham-sale
    const tabData = {
      code: productData.ProductCode || '',
      suplier: productData.Supplier || '',
      productName: productData.ProductName || '',
      numberDauKy: productData.NumberInStoreDauky?.toString() || '0',
      numberCuoiKy: productData.NumberInStoreCuoiKy?.toString() || '0',
      import: productData.Import?.toString() || '0',
      export: productData.Export?.toString() || '0',
      productSaleID: productData.ProductSaleID || 0,
      wareHouseCode: this.warehouseCode || 'HN',
      oProductSaleModel: productData,
    };
    this.menuEventService.openNewTab(
      ChiTietSanPhamSaleComponent,
      `Chi tiết: ${productData.ProductCode || 'Sản phẩm'}`,
      tabData
    );
  }
}
