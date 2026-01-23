import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
// import { BorrowService } from '../borrow-service/borrow.service';
import { CommonModule } from '@angular/common';
import { RouterTestingHarness } from '@angular/router/testing';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { AppUserService } from '../../../../services/app-user.service';
import { ID_ADMIN_DEMO_LIST } from '../../../../app.config';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';

@Component({
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    CommonModule,


  ],
  selector: 'app-history-product-rtc-protective-gear-detail',
  templateUrl: './history-product-rtc-protective-gear-detail.component.html',
  styleUrls: ['./history-product-rtc-protective-gear-detail.component.css']
})
export class HistoryProductRtcProtectiveGearDetailComponent implements OnInit {

  // INTEGRATION: Input để hoạt động như modal từ bill export technical
  @Input() isExportMode: boolean = false; // Chế độ xuất sang phiếu xuất
  @Input() preselectedProduct: any = null; // Sản phẩm được chọn từ card

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private ProductProtectiveGearService: ProductProtectiveGearService
  ) { this.PeopleID = this.appUserService.id }

  @ViewChild('tb_productRTCDetail', { static: false })
  tb_productRTCDetailContainer!: ElementRef;
  tb_productRTCDetailBody: any;

  @ViewChild('tb_productRTCDetailBorrow', { static: false })
  tb_productRTCDetailBorrowContainer!: ElementRef;
  tb_productRTCDetailBorrowBody: any;

  // parram call api
  userId: any = 0;
  productGroupID: any = 0;
  keyword: any = '';
  checkAll: any = 1;
  filter: any = '';
  warehouseID: any = 5;
  @Input() warehouseType: number = 1;

  users: any[] = []; // get user select option

  selectedProduct: any[] = [];
  selectedProductBorrow: any[] = [];
  arrProductBorrow: any[] = [];

  // param create product history
  PeopleID: any = 0;
  Project: string = "Test văn phòng";
  Note: string = "";
  Status: number = 7;
  DateReturnExpected: Date = new Date(Date.UTC(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
    23, 59, 59
  ));
  DateBorrow: Date = new Date();
  ProductRTCID: number = 0;


  ngOnInit() {
    this.loadUser();
    this.getProductRTCDetail();
  }

  ngAfterViewInit(): void {

    this.drawTbProductRTCDetail(this.tb_productRTCDetailContainer.nativeElement);
    this.drawTbProductRTCDetailBorrow(this.tb_productRTCDetailBorrowContainer.nativeElement);

    // Auto-add preselected product to borrow list
    if (this.preselectedProduct) {
      setTimeout(() => {
        this.autoAddPreselectedProduct();
      }, 100);
    }
  }

  loadUser() {
     
    this.ProductProtectiveGearService.getUserHistoryProduct(this.userId).subscribe({
      next: (response: any) => {
        let data = response.data;
        this.users = this.createdNestedGroup(data, 'DepartmentName', 'TeamName');
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });

  }
  getProductRTCDetail() {
    this.ProductProtectiveGearService.getProductRTCDetail(this.productGroupID, this.keyword, this.checkAll, this.filter, this.warehouseID).subscribe({
      next: (response: any) => {
        this.tb_productRTCDetailBody.setData(response.data);
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  getProductRTCDetailBorrow() {
    this.tb_productRTCDetailBody.setData(this.arrProductBorrow);
  }
  onSearch(event: any) {
    const keyword = (event.target.value || "").toLowerCase();

    this.tb_productRTCDetailBody.setFilter([
      [
        { field: "ProductName", type: "like", value: keyword },
        { field: "ProductCode", type: "like", value: keyword },
        { field: "SerialNumber", type: "like", value: keyword },
        { field: "PartNumber", type: "like", value: keyword },
        { field: "Serial", type: "like", value: keyword },
        { field: "Maker", type: "like", value: keyword },
        { field: "AddressBox", type: "like", value: keyword },
        // { field: "Note", type: "like", value: keyword }
      ]
    ]);
  }

  drawTbProductRTCDetail(container: HTMLElement) {
    this.tb_productRTCDetailBody = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      layout: 'fitDataStretch',
      selectableRows: true,
      index: "ID",
      pagination: true,
      paginationMode: 'local',
      paginationSize: 20,           // số record mỗi trang
      paginationSizeSelector: [20, 50, 100], // cho phép user chọn
      locale: 'vi',
      // Grouping by ProductGroupName
      groupBy: "ProductGroupName",
      groupStartOpen: true,
      groupToggleElement: "header",
      groupHeader: (value: any, count: number) => {
        return `<span>Tên nhóm: </span><span style="font-weight: bold; color: #1890ff;">${value || 'Chưa phân loại'}</span> <span style="color: #999;">(${count} sản phẩm)</span>`;
      },
      columns: [
        { title: 'ID', field: 'ID', hozAlign: 'left', headerHozAlign: 'center', visible: false },
        { title: 'Mã sản phẩm', field: 'ProductCode', hozAlign: 'left', headerHozAlign: 'center', width: 150 },
        { title: 'Tên', field: 'ProductName', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
        { title: 'Số lượng hiện có', field: 'InventoryReal', hozAlign: 'right', headerHozAlign: 'center' },
        { title: 'Vị trí (Hộp)', field: 'AddressBox', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Note', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
      ],
    });
    // Lắng nghe sự kiện chọn
    this.tb_productRTCDetailBody.on('rowSelected', (row: any) => {
      this.selectedProduct.push(row.getData());
    });
    //  Lắng nghe sự kiện bỏ chọn
    this.tb_productRTCDetailBody.on('rowDeselected', (row: any) => {
      const index = this.selectedProduct.indexOf(row.getData());
      if (index !== -1) {
        this.selectedProduct.splice(index, 1);
      }

    });
  }
  drawTbProductRTCDetailBorrow(container: HTMLElement) {
    this.tb_productRTCDetailBorrowBody = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      layout: 'fitColumns',
      selectableRows: true,
      pagination: false,
      locale: 'vi',
      index: "ID",
      columns: [
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Mã sản phẩm', field: 'ProductCode' },
        { title: 'Tên', field: 'ProductName' },
        { title: 'Số lượng mượn', field: 'NumberBorrow', hozAlign: 'right', editor: 'input' },
      ],
    });

    this.tb_productRTCDetailBorrowBody.on('rowSelected', (row: any) => {
      const rowData = row.getData();
      this.selectedProductBorrow.push(rowData);
    });

    this.tb_productRTCDetailBorrowBody.on('rowDeselected', (row: any) => {
      const rowData = row.getData();
      this.selectedProductBorrow = this.selectedProductBorrow.filter(
        item => item.ID !== rowData.ID
      );
    });

  }
  moveData() {
    if (this.selectedProduct.length === 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần mượn!.'
      );
      return;
    }

    const itemsToRemove: any[] = [];
    const borrowArray = [...this.arrProductBorrow]; // copy

    // duyệt qua bản sao để không bị ảnh hưởng khi update/xóa
    for (const item of [...this.selectedProduct]) {
      item.InventoryReal--;

      // Kiểm tra sản phẩm đã tồn tại trong borrow chưa
      // const idx = borrowArray.findIndex((x: any) => x.ID === item.ID);
      // if (idx !== -1) {
      //   borrowArray[idx].NumberBorrow++;
      // } else {
      borrowArray.push({
        ID: item.ID,
        ProductCode: item.ProductCode,
        ProductName: item.ProductName,
        ProductCodeRTC: item.ProductCodeRTC,
        SerialNumber: item.SerialNumber,
        PartNumber: item.PartNumber,
        Maker: item.Maker,
        Note: item.Note,
        NumberBorrow: 1,
        UnitCountName: item.UnitCountName || '',
        UnitCountID: item.UnitCountID || 0,
      });
      // }

      if (item.InventoryReal === 0) {
        this.tb_productRTCDetailBody.deleteRow(item.ID);
        itemsToRemove.push(item);
      } else {
        // update lại số lượng tồn kho trên row
        const row = this.tb_productRTCDetailBody.getRow(item.ID);
        if (row) {
          row.update({ InventoryReal: item.InventoryReal });
        }
      }
    }

    // update borrow 1 lần sau vòng lặp
    this.arrProductBorrow = borrowArray;
    this.tb_productRTCDetailBorrowBody.setData(borrowArray);

    // cuối cùng mới lọc selectedProduct
    this.selectedProduct = this.selectedProduct.filter(
      item => !itemsToRemove.includes(item)
    );

  }
  removeData() {
    if (!this.selectedProductBorrow || this.selectedProductBorrow.length === 0) {
      this.notification.create('warning', 'Thông báo', 'Vui lòng chọn sản phẩm để trả lại!');
      return;
    }

    // Lưu các ID đang chọn
    const selectedIds = this.selectedProductBorrow.map((x: any) => x.ID);

    let borrowArray = [...this.arrProductBorrow];

    for (const selected of [...this.selectedProductBorrow]) {
      const idx = borrowArray.findIndex((x: any) => x.ID === selected.ID);
      if (idx !== -1) {
        const borrowItem = borrowArray[idx];
        borrowItem.NumberBorrow--;

        if (borrowItem.NumberBorrow <= 0) {
          // Xóa khỏi Borrow
          borrowArray.splice(idx, 1);
          this.tb_productRTCDetailBorrowBody.deleteRow(borrowItem.ID);
        } else {
          borrowArray[idx] = borrowItem;
          const row = this.tb_productRTCDetailBorrowBody.getRow(borrowItem.ID);
          if (row) row.update({ NumberBorrow: borrowItem.NumberBorrow });
        }

        // Trả lại bên bảng chính
        const rowMain = this.tb_productRTCDetailBody.getRow(borrowItem.ID);
        if (rowMain) {
          const rowData = rowMain.getData();
          rowData.InventoryReal++;
          rowMain.update(rowData);
        } else {
          this.tb_productRTCDetailBody.addRow({
            ID: borrowItem.ID,
            ProductCode: borrowItem.ProductCode,
            ProductName: borrowItem.ProductName,
            SerialNumber: borrowItem.SerialNumber,
            PartNumber: borrowItem.PartNumber,
            Maker: borrowItem.Maker,
            Note: borrowItem.Note,
            InventoryReal: 1,
          });
        }
      }
    }

    this.arrProductBorrow = borrowArray;

    this.tb_productRTCDetailBorrowBody.deselectRow();
    selectedIds.forEach(id => {
      const row = this.tb_productRTCDetailBorrowBody.getRow(id);
      if (row) row.select();
    });

    // Cập nhật lại selectedProductBorrow
    this.selectedProductBorrow = this.tb_productRTCDetailBorrowBody.getSelectedData();
  }
  onSubmit() {
    if (this.arrProductBorrow.length == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn thiết bị mượn!.'
      );
      return;
    } else {
      // Validate required fields
      if (!this.PeopleID) {
        this.notification.create(
          'warning',
          'Thông báo',
          'Vui lòng chọn người mượn!'
        );
        return;
      }
      if (this.Project == "") {
        this.notification.create(
          'warning',
          'Thông báo',
          'Vui lòng nhập dự án!.'
        );
        return;
      }
      if (this.DateReturnExpected <= new Date()) {
        this.notification.create(
          'warning',
          'Thông báo',
          'Ngày dự kiến trả không phù hợp! Ngày dự kiến trả phải lớn hơn ngày mượn hoặc thời gian hiện tại!.'
        );
        return;
      }

      this.modal.confirm({
        nzTitle: 'Xác nhận đăng ký mượn.',
        nzContent: `Bạn có chắc chắn muốn mượn không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          const deleteRequests = this.arrProductBorrow.map(item => {
            const data = {
              ProductRTCID: item.ID,
              PeopleID: this.PeopleID,
              Project: this.Project,
              Note: this.Note || '',
              Status: 7, // trạng thái đăng kí mượn
              DateReturnExpected: this.DateReturnExpected.toISOString(),
              DateBorrow: this.DateBorrow.toISOString(),
              NumberBorrow: item.NumberBorrow,
              SerialNumber: item.SerialNumber || '',
              WarehouseID: this.warehouseID,
              IsDelete: false
            };
            return this.ProductProtectiveGearService.postSaveHistoryProductRTC(data).toPromise()
              .then(() => {
                return { item, success: true, message: null }
              })
              .catch(error => {
                const message = error?.error?.message || 'Lỗi không xác định!';
                console.error(`Lỗi khi thêm thiết bị ${item.ID}:`, message);
                return { item, success: false, message };
              });
          });

          Promise.all(deleteRequests).then(results => {
            const successCount = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success);

            if (successCount > 0) {
              this.notification.success('Thành công', `Đã thêm ${successCount} thiết bị thành công!`);
            }

            if (failed.length > 0) {
              failed.forEach(f => {
                this.notification.error('Lỗi', f.message);
              });
            }

            // Close modal after all API requests complete
            this.activeModal.close('success');
          });
        }
      });


    }
  }


  // INTEGRATION: Xuất sản phẩm đã chọn sang phiếu xuất
  exportToBillExport() {
    if (this.arrProductBorrow.length === 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xuất sang phiếu xuất!'
      );
      return;
    }

    // Lấy dữ liệu từ bảng sản phẩm đã chọn
    const productsToExport = this.arrProductBorrow.map((item: any) => ({
      ProductRTCID: item.ID,
      ProductCode: item.ProductCode,
      ProductName: item.ProductName,
      ProductCodeRTC: item.ProductCodeRTC,
      UnitCountName: item.UnitCountName || '',
      UnitCountID: item.UnitCountID || 0,
      Maker: item.Maker || '',
      NumberBorrow: item.NumberBorrow || 1,
      SerialNumber: item.SerialNumber || '',
      PartNumber: item.PartNumber || '',
      Note: item.Note || '',
    }));

    // Đóng modal và trả về dữ liệu
    this.activeModal.close(productsToExport);
  }

  // Service grouping theo DepartmentName -> TeamName
  createdNestedGroup(items: any[], groupByDept: string, groupByTeam: string) {
    const deptGrouped: Record<string, any[]> = items.reduce((acc, item) => {
      const deptKey = item[groupByDept] || 'Khác';
      if (!acc[deptKey]) acc[deptKey] = [];
      acc[deptKey].push(item);
      return acc;
    }, {});

    return Object.entries(deptGrouped).map(([deptLabel, deptItems]) => {
      const teamGrouped: Record<string, any[]> = deptItems.reduce((acc, item) => {
        const teamKey = item[groupByTeam] || 'Khác';
        if (!acc[teamKey]) acc[teamKey] = [];
        acc[teamKey].push(item);
        return acc;
      }, {});

      return {
        label: deptLabel,
        teams: Object.entries(teamGrouped).map(([teamLabel, teamItems]) => ({
          label: teamLabel,
          options: teamItems.map(item => ({ item }))
        }))
      };
    });
  }

  // Auto-add preselected product to borrow list
  autoAddPreselectedProduct() {
    if (!this.preselectedProduct || !this.tb_productRTCDetailBorrowBody) {
      return;
    }

    // Create borrow item from preselected product
    const borrowItem = {
      ID: this.preselectedProduct.ProductRTCID || this.preselectedProduct.ID,
      ProductCode: this.preselectedProduct.ProductCode,
      ProductName: this.preselectedProduct.ProductName,
      ProductCodeRTC: this.preselectedProduct.ProductCodeRTC || this.preselectedProduct.ProductCode,
      SerialNumber: this.preselectedProduct.SerialNumber || '',
      PartNumber: this.preselectedProduct.PartNumber || '',
      Maker: this.preselectedProduct.Maker || '',
      Note: this.preselectedProduct.Note || '',
      NumberBorrow: 1,
      UnitCountName: this.preselectedProduct.UnitCountName || '',
      UnitCountID: this.preselectedProduct.UnitCountID || 0,
    };

    // Add to borrow array
    this.arrProductBorrow.push(borrowItem);

    // Update borrow table
    this.tb_productRTCDetailBorrowBody.setData(this.arrProductBorrow);

    console.log('Auto-added preselected product to borrow list:', borrowItem);
  }
}
