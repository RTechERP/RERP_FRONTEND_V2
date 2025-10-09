import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';

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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { BillExportService } from './bill-export-service/bill-export.service';
import { IS_ADMIN } from '../../../app.config';
import { DEPARTMENTID } from '../../../app.config';
import { DateTime } from 'luxon';
import { BillExportDetailComponent } from './Modal/bill-export-detail/bill-export-detail.component';
import { HistoryDeleteBillComponent } from './Modal/history-delete-bill/history-delete-bill.component';
import { BillExportSyntheticComponent } from './Modal/bill-export-synthetic/bill-export-synthetic.component';
import { ScanBillComponent } from './Modal/scan-bill/scan-bill.component';
import { BillDocumentExportComponent } from './Modal/bill-document-export/bill-document-export.component';
interface BillExport {
  Id?: number;
  TypeBill: boolean;
  Code: string;
  Address: string;
  CustomerID: number;
  UserID: number;
  SenderID: number;
  WarehouseType: string;
  GroupID: string;
  KhoTypeID: number;
  ProductType: number;
  AddressStockID: number;
  WarehouseID: number;
  Status: number;
  SupplierID: number;
  CreatDate: Date | string;
  RequestDate: Date | string;
}
@Component({
  selector: 'app-bill-export',
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
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './bill-export.component.html',
  styleUrl: './bill-export.component.css'
})

export class BillExportComponent implements OnInit, AfterViewInit {
  dataProductGroup: any[] = [];
  data: any[] = []
  sizeSearch: string = '0';
  checked: any;
  listproductgroupID: any[] = [];
  table_billExport: any;
  dataTableBillExport: any[] = [];
  table_billExportDetail: any;
  dataTableBillExportDetail: any[] = [];
  selectedKhoTypes: number[] = [];
  isCheckmode: boolean = false;
  id: number = 0;
  selectBillExport: any[] = [];
  newBillExport: BillExport = {
    TypeBill: false,
    Code: '',
    Address: '',
    CustomerID: 0,
    UserID: 0,
    SenderID: 0,
    WarehouseType: "",
    GroupID: "",
    KhoTypeID: 0,
    ProductType: 0,
    AddressStockID: 0,
    WarehouseID: 0,
    Status: 0,
    SupplierID: 0,
    CreatDate: new Date(),
    RequestDate: new Date(),
  };
  cbbStatus: any = [
    { ID: -1, Name: "--Tất cả--" },
    { ID: 0, Name: "Mượn" },
    { ID: 1, Name: "Tồn Kho" },
    { ID: 2, Name: "Đã Xuất Kho" },
    { ID: 5, Name: "Xuất trả NCC" },
    { ID: 6, Name: "Yêu cầu xuất kho" },
  ];

  searchParams = {
    dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    listproductgroupID: '',
    status: -1,
    warehousecode: 'HN',
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000,
  };

  searchText: string = '';
  dateFormat = 'dd/MM/yyyy';
  constructor(
    private billExportService: BillExportService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
  ) { }
  ngOnInit(): void {
    this.getProductGroup();
  }
  ngAfterViewInit(): void { 
    this.drawTable();    
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetform(): void {
    this.selectedKhoTypes = [];
    this.searchParams = {
      dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      listproductgroupID: '',
      status: -1,
      warehousecode: 'HN',
      keyword: '',
      checkAll: false,
      pageNumber: 1,
      pageSize: 1000,
    };
    this.searchText = '';
  }
  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }
  getProductGroup() {
    this.billExportService.getProductGroup(IS_ADMIN, DEPARTMENTID).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataProductGroup = res.data;
          console.log('>>> Kết quả getProductGroup:', res);
          this.selectedKhoTypes = this.dataProductGroup.map(item => item.ID);
          this.searchParams.listproductgroupID = this.selectedKhoTypes.join(',');
          // Load data sau khi đã có product group
          this.loadDataBillExport();
        } else {
          // Nếu không có data, vẫn load với listproductgroupID rỗng
          this.searchParams.listproductgroupID = '';
          this.loadDataBillExport();
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy nhóm vật tư', err);
        // Vẫn load data ngay cả khi lỗi getProductGroup
        this.searchParams.listproductgroupID = '';
        this.loadDataBillExport();
      }
    });
  }
  loadDataBillExport() {
    const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateStart));
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.billExportService.getBillExport(
      this.searchParams.listproductgroupID,
      this.searchParams.status,
      dateStart,
      dateEnd,
      this.searchParams.keyword,
      this.checked,
      this.searchParams.pageNumber,
      this.searchParams.pageSize,
      this.searchParams.warehousecode
    ).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.dataTableBillExport = res.data;
          if (this.table_billExport) {
            this.table_billExport.replaceData(this.dataTableBillExport);
          } else {
            console.log('>>> Bảng chưa tồn tại, dữ liệu sẽ được load khi drawTable() được gọi');
          }
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu phiếu xuất');
      }
    });
  }
  getBillExportDetail(id: number) {
    this.billExportService.getBillExportDetail(id).subscribe({
      next: (res) => {
        this.dataTableBillExportDetail = res.data;
        this.table_billExportDetail?.replaceData(this.dataTableBillExportDetail);
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy chi tiết');
      }
    });
  }
  searchData() {
    this.loadDataBillExport();
    console.log("searchparams", this.searchParams);
  }
  onCheckboxChange() {
    this.loadDataBillExport();
  }
  // hủy chứng từ , duyệt chứng từ
  IsApproved(apr: boolean) {
    if (!this.data || this.data.length === 0) {
      this.notification.info("Thông báo", "Vui lòng chọn 1 phiếu để nhận chứng từ !");
      return;
    }
    if (this.data[0].Approved == false && apr == false) {
      this.notification.info("Thông báo", `${this.data[0].Code} chưa nhận chứng từ, không thể hủy!`);
      return;
    }
    else {
      this.billExportService.approved(this.data[0], apr).subscribe({
        next: (res) => {
          console.log("Approval response:", res);
          if (res.status === 1) {
            this.notification.success("Thông báo", res.message || 'Thành công!');
            this.data = [];
            this.loadDataBillExport();
            this.table_billExport?.replaceData(this.dataTableBillExport);
          } else {
            this.notification.error('Thông báo', res.message || 'Có lỗi xảy ra!');
          }
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
          this.notification.error('Thông báo', errorMsg);
        }
      });
    }
  }
  //chức năng đã xuất kho
  shippedOut() {
    if (!this.data || this.data.length === 0) {
      this.notification.info("Thông báo", "Vui lòng chọn 1 phiếu để chuyển trạng thái !");
      return;
    }
    else {
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: 'Bạn có chắc chắn muốn chuyển trạng thái phiếu không?',
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.billExportService.shippedOut(this.data[0]).subscribe({
            next: (res: any) => {
              if (res.status === 1) {
                this.notification.success("Thông báo", res.message || 'Thành công!');
                this.data = [];
                this.loadDataBillExport(); // Reload the data to reflect changes
              } else {
                this.notification.error('Thông báo', res.message || 'Có lỗi xảy ra!');
              }
            },
            error: (err) => {
              const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
              this.notification.error('Thông báo', errorMsg);
            }
          });
        }
      });
    }
  }
  openModalBillExportDetail(ischeckmode: boolean) {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất để sửa');
      this.id = 0;
      return
    }
    console.log('is', this.isCheckmode);
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.newBillExport = this.newBillExport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.id = 0;
          this.loadDataBillExport();
        }
      },
    );
  }
  getBillExportByID(ids: number) {
    this.billExportService.getBillExportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillExport = res.data;
          console.log("seelct:", this.selectBillExport);
        }
        else {
          this.notification.warning('Thông báo', res.message || 'Lỗi');
        }
      }
    });
  }
  deleteBillExport() {
    if (!this.selectBillExport) {
      this.notification.info("Thông báo", "Vui lòng chọn 1 phiếu để xóa!");
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa phiếu không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.billExportService.deleteBillExport(this.selectBillExport).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', res.message || 'Đã xóa thành công!');
              this.loadDataBillExport();
              this.getBillExportDetail(this.id);
            } else {
              this.notification.warning('Thông báo', res.message || 'Không thể xóa phiếu!');
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
  openModalHistoryDeleteBill() {
    const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.billExportID = this.id;
    modalRef.componentInstance.billType=0;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          // this.loadDataBillExport();     
        }
      },
    );
  }

  //mo modal billdocumentExport
  openModalBillDocumentExport() {
    if (this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
      this.id = 0;
      return
    }
   const code = this.data[0].Code;
    const modalRef = this.modalService.open(BillDocumentExportComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.code = code;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.id = 0;
          this.loadDataBillExport();
        }
      },
    );
  }
   drawTable(){
    var rowMenu = [
      {
        label: " Hủy duyệt phiếu mượn",
        action: (e: any, row: any) => {
          const rowData = row.getData(); // Lấy data trực tiếp
          this.data = [rowData]; // Hoặc thuộc tính tương ứng bạn cần
          debugger
          if (this.data[0].Status != 2) {
            this.IsApproved(false);
          } else this.notification.error("Thông báo", "Phiếu xuất đã xuất kho không thể hủy phiếu!");
        }
      },
      {
        label: "Lịch sử nhận chứng từ ",
        action: (e: any, row: any) => {
          const rowData = row.getData(); // Lấy data trực tiếp
          this.data = [rowData];
          this.id = rowData['ID'];
          this.openModalHistoryDeleteBill();
        }
      },
    ]
    var headerMenu = function (this: any) {
      var menu = [];
      var columns = this.getColumns();

      for (let column of columns) {

        //create checkbox element using font awesome icons
        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square");

        //build label
        let label = document.createElement("span");
        let title = document.createElement("span");

        title.textContent = " " + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
          label: label,
          action: function (e: any) {
            //prevent menu closing
            e.stopPropagation();

            //toggle current column visibility
            column.toggle();

            //change menu item icon
            if (column.isVisible()) {
              icon.classList.remove("fa-square");
              icon.classList.add("fa-check-square");
            } else {
              icon.classList.remove("fa-check-square");
              icon.classList.add("fa-square");
            }
          }
        });
      }

      return menu;
    };

    if (this.table_billExport) {
      this.table_billExport.replaceData(this.dataTableBillExport);
    } else {
      this.table_billExport = new Tabulator('#table_billExport', {
        data: this.dataTableBillExport,
        layout: 'fitDataFill',
        height: '80vh',
        pagination: true,
        selectableRows: 1,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        rowContextMenu: rowMenu,
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
          {
            title: 'Nhận chứng từ',
            field: 'IsApproved',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${value === true ? 'checked' : ''} disabled />`;
            },
            headerMenu: headerMenu
          },
          {
            title: 'Ngày nhận',
            field: 'DateStatus',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
            headerMenu: headerMenu
          },
          { title: 'Trạng thái', field: 'nameStatus', hozAlign: 'left', headerHozAlign: 'center', width: 200 },
          {
            title: 'Ngày yêu cầu xuất kho', field: 'RequestDate', hozAlign: 'left', headerHozAlign: 'center', width: 150, formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            }, headerMenu: headerMenu
          },
          ///
          { title: 'Số phiếu ', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 160 },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'left',
            width: 200,
            headerMenu: headerMenu,  
            resizable: true,
            variableHeight: true,
            bottomCalc: "count",
          },
          {
            title: 'Mã NV',
            field: 'EmployeeCode',
            hozAlign: 'left',
            headerHozAlign: 'left',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Tên NV',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'left',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Khách hàng',
            field: 'CustomerName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Nhà cung cấp',
            field: 'NameNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Địa chỉ',
            field: 'Address',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Ngày xuất',
            field: 'CreatDate',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            formatter: (cell) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
            headerMenu: headerMenu
          },
          {
            title: 'Loại vật tư',
            field: 'WarehouseType',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Kho',
            field: 'WarehouseName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Loại phiếu',
            field: 'ProductTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
          {
            title: 'Người giao',
            field: 'FullNameSender',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            headerMenu: headerMenu
          },
        ]
      });

      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.table_billExport.on("rowSelected", (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.getBillExportDetail(this.id);
        this.getBillExportByID(this.id);
      });
      this.table_billExport.on("rowDeselected", (row: RowComponent) => {
        // Khi một hàng bị bỏ chọn, kiểm tra xem còn hàng nào được chọn không
        const selectedRows = this.table_billExport.getSelectedRows();

        if (selectedRows.length === 0) {
          this.id = 0; // Reset id về 0 (hoặc null)
          this.data = []; // Reset data về mảng rỗng
          this.table_billExportDetail?.replaceData([]); // Xóa dữ liệu bảng chi tiết
          this.selectBillExport = []; // Xóa dữ liệu phiếu xuất được chọn
        }
      });
    }

    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
      this.table_billExportDetail = new Tabulator('#table_billexportdetail', {
        data: this.dataTableBillExportDetail,
        layout: 'fitDataFill',
        height: "80vh",
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Mã sản phẩm', field: 'ProductCode', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'SL tồn', field: 'TotalInventory', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'Chi tiết sản phẩm', field: 'ProductName', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'Mã sản phẩm theo dự án', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center' },
          {
            title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center',
            width: 250,
          },
          { title: 'Số lượng', field: 'Qty', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Dự án (mới)', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Loại hàng', field: 'ProductGroupName', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Hàng xuất', field: 'ProductTypeText', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Ghi chú (PO)', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Đơn giá bán', field: 'UnitPricePOKH', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Đơn giá múa', field: 'UnitPricePurchase', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Đơn mua hàng', field: 'BillCode', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Mã dự án', field: 'ProjectCodeExport', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Dự án', field: 'ProjectNameText', hozAlign: 'left', headerHozAlign: 'center' },
        ]
      });
    }
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.table_billExport;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách phiếu xuất');

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
    link.download = `DanhSachPhieuXuat.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  onExportGroupItem(type: number) {
    if (!this.id || this.id == 0) {
      this.notification.error("Lỗi", "Vui lòng chọn bản ghi cần xuất file");
      return;
    }
    const selectedHandover = this.data.find(item => item.ID === this.id);
    this.billExportService.export(this.id, type).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        const now = new Date();
        const dateString = `${now.getFullYear().toString().slice(-2)}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const fileName = `${selectedHandover?.Code || 'export'}_${dateString}.xlsx`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi xuất file.');
        console.error(err);
      }
    });
  }


  //#region tong hop phieu xuat 
  openModalBillExportSynthetic() {
    const modalRef = this.modalService.open(BillExportSyntheticComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          // this.id=0;
          // this.loadDataBillExport();     
        }
      },
    );
  }
  //#endregion
  //#region tong hop phieu xuat 
  openModalScanBill() {
    const modalRef = this.modalService.open(ScanBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.id = 0;
          this.loadDataBillExport();
        }
      },
    );
  }
  //#endregion
}
