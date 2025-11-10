import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
// import * as bootstrap from 'bootstrap';

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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { BillImportServiceService } from './bill-import-service/bill-import-service.service';
import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { HistoryDeleteBillComponent } from '../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { BillImportDetailComponent } from './Modal/bill-import-detail/bill-import-detail.component';
import { BillDocumentExportComponent } from '../BillExport/Modal/bill-document-export/bill-document-export.component';
import { BillDocumentImportComponent } from './Modal/bill-document-import/bill-document-import.component';
import { BillImportSyntheticComponent } from './Modal/bill-import-synthetic/bill-import-synthetic.component';
import { ScanBillImportComponent } from './Modal/scan-bill-import/scan-bill-import.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
interface BillImport {
  Id?: number;
  BillImportCode: string;
  ReciverID: number;
  Reciver: string;
  DeliverID: number;
  Deliver: string;
  KhoTypeID: number;
  KhoType: string;
  WarehouseID: number;
  BillTypeNew: number;
  SupplierID: number;
  Supplier: string;
  RulePayID: number;
  CreatDate: Date | string;
  RequestDate: Date | string;
}
@Component({
  selector: 'app-bill-import',
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
  templateUrl: './bill-import.component.html',
  styleUrl: './bill-import.component.css',
})
export class BillImportComponent implements OnInit, AfterViewInit {
  constructor(
    private billImportService: BillImportServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService
  ) {}

  newBillImport: BillImport = {
    BillImportCode: '',
    ReciverID: 0,
    Reciver: '',
    DeliverID: 0,
    Deliver: '',
    KhoType: '',
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: '',
    CreatDate: new Date(),
    RequestDate: new Date(),
    RulePayID: 0,
  };

  dataProductGroup: any[] = [];
  data: any[] = [];
  sizeSearch: string = '0';
  checked: any;
  listproductgroupID: any[] = [];
  table_billImport: any;
  dataTableBillImport: any[] = [];
  table_billImportDetail: any;
  dataTableBillImportDetail: any[] = [];
  selectedKhoTypes: number[] = [];
  isCheckmode: boolean = false;
  id: number = 0;
  selectBillImport: any[] = [];

  searchParams = {
    dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
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
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Mượn' },
    { ID: 1, Name: 'Tồn Kho' },
    { ID: 2, Name: 'Đã Xuất Kho' },
    { ID: 5, Name: 'Xuất trả NCC' },
    { ID: 6, Name: 'Yêu cầu xuất kho' },
  ];
  ngOnInit(): void {
    this.getProductGroup();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  onCheckboxChange() {
    this.loadDataBillImport();
  }
  resetform(): void {
    this.selectedKhoTypes = [];
    this.searchParams = {
      dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split('T')[0],
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
  searchData() {
    this.loadDataBillImport();
    this.sizeSearch = '';
  }
  convertExport(){}

  openModalBillImportDetail(ischeckmode: boolean) {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất để sửa');
      this.id = 0;
      return;
    }
    console.log('is', this.isCheckmode);
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;

    modalRef.result.catch((result) => {
      if (result == true) {
        this.id = 0;
        this.loadDataBillImport();
      }
    });
  }
  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }
  getProductGroup() {
    this.billImportService.getProductGroup(this.appUserService.isAdmin,this.appUserService.departmentID??0).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.dataProductGroup = res.data;
          console.log('>>> Kết quả getProductGroup:', res);
          this.selectedKhoTypes = this.dataProductGroup.map((item) => item.ID);
          this.searchParams.listproductgroupID =
            this.selectedKhoTypes.join(',');
          // Load data sau khi đã có product group
          this.loadDataBillImport();
        } else {
          // Nếu không có data, vẫn load với listproductgroupID rỗng
          this.searchParams.listproductgroupID = '';
          this.loadDataBillImport();
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy nhóm vật tư', err);
        // Vẫn load data ngay cả khi lỗi getProductGroup
        this.searchParams.listproductgroupID = '';
        this.loadDataBillImport();
      },
    });
  }
  getBillImportDetail(id: number) {
    this.billImportService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.dataTableBillImportDetail = res.data;
        this.table_billImportDetail?.replaceData(
          this.dataTableBillImportDetail
        );
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy chi tiết');
      },
    });
  }
  getBillImportByID(ids: number) {
    this.billImportService.getBillImportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillImport = res.data;
          console.log('seelct:', this.selectBillImport);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Lỗi');
        }
      },
    });
  }

  //mở hồ sơ chúng từ
  openModalScanBill() {
    const modalRef = this.modalService.open(ScanBillImportComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.catch((result) => {
      if (result == true) {
        this.id = 0;
        this.loadDataBillImport();
      }
    });
  }
  //mở lịch sử hủy, duyệt chứng từ
  openModalHistoryDeleteBill() {
    const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.billImportID = this.id;
    modalRef.componentInstance.billType = 1;
    modalRef.result.catch((result) => {
      if (result == true) {
        // this.loadDataBillExport();
      }
    });
  }
  // hủy chứng từ , duyệt chứng từ
  IsApproved(apr: boolean) {
    if (!this.data || this.data.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn 1 phiếu để nhận chứng từ !'
      );
      return;
    }
    if (this.data[0].Approved == false && apr == false) {
      this.notification.info(
        'Thông báo',
        `${this.data[0].Code} chưa nhận chứng từ, không thể hủy!`
      );
      return;
    } else {
      this.billImportService.approved(this.data[0], apr).subscribe({
        next: (res) => {
          console.log('Approval response:', res);
          if (res.status === 1) {
            this.notification.success(
              'Thông báo',
              res.message || 'Thành công!'
            );
            this.data = [];
            this.loadDataBillImport();
            this.table_billImport?.replaceData(this.dataTableBillImport);
          } else {
            this.notification.error(
              'Thông báo',
              res.message || 'Có lỗi xảy ra!'
            );
          }
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        },
      });
    }
  }

  loadDataBillImport() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.billImportService
      .getBillImport(
        this.searchParams
      )
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.dataTableBillImport = res.data;
            console.log('>>> Kết quả getBillImport:', res.data);
            if (this.table_billImport) {
              this.table_billImport.replaceData(this.dataTableBillImport);
            } else {
              console.log(
                '>>> Bảng chưa tồn tại, dữ liệu sẽ được load khi drawTable() được gọi'
              );
            }
          }
        },
        error: (err) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu phiếu xuất');
        },
      });
  }

  //#region xuất excel
  async exportExcel() {
    const table = this.table_billImport;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách phiếu nhập');

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
    link.download = `DanhSachPhieuNhập.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  //Xuất Excel theo mẫu
  onExportExcel() {
    if (!this.id || this.id === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần xuất file');
      return;
    }

    const selectedHandover = this.data.find((item) => item.ID === this.id);
    if (!selectedHandover) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy bản ghi được chọn');
      return;
    }

    this.billImportService.export(this.id).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        const now = new Date();
        const dateString = `${now.getDate().toString().padStart(2, '0')}_${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, '0')}_${now.getFullYear()}`;
        const fileName = `Phiếu nhập - ${
          selectedHandover.BillImportCode || 'export'
        }_${dateString}.xlsx`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xuất file.');
        console.error(err);
      },
    });
  }
  //hồ sơ chứng từ
  openModalBillDocumentImport() {
    if (this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      this.id = 0;
      return;
    }
    const code = this.data[0].BillImportCode;
    const modalRef = this.modalService.open(BillDocumentImportComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.code = code;
    modalRef.result.catch((result) => {
      if (result == true) {
        this.id = 0;
        this.loadDataBillImport();
      }
    });
  }

  //#region tong hop phieu nhập
  openModalBillImportSynthetic() {
    const modalRef = this.modalService.open(BillImportSyntheticComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.catch((result) => {
      if (result == true) {
        // this.id=0;
        // this.loadDataBillExport();
      }
    });
  }
  //#endregion
  //xoa phieu nhap
  deleteBillImport() {
    if (!this.data) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 phiếu muốn xóa!');
      return;
    }
    if (this.data[0].Status == true) {
      this.notification.warning(
        'Thông báo',
        'Phiếu đã được duyệt không thể xóa!'
      );
      return;
    }

    const payload = {
      billImport: {
        ID: this.data[0].ID || 0,
        IsDeleted: true, // Bổ sung nếu cần
      },
    };
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa phiếu "${this.data[0].BillImportCode}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.billImportService.saveBillImport(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công!');
              this.loadDataBillImport();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Xóa thất bại!');
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Thông báo',
              'Có lỗi xảy ra khi xóa dữ liệu!'
            );
          },
        });
      },
    });
  }
openFolderTree(){

}

deleteAttachment(){

}
addAttachment(){

}
  //vẽ bảng
  drawTable() {
    const rowMenu = [
      {
        label: 'Hủy duyệt phiếu nhập',
        action: (e: any, row: any) => {
          const rowData = row.getData();
          this.data = [rowData];
          if (this.data[0].Status !== true) {
            this.IsApproved(false);
          } else {
            this.notification.error(
              'Thông báo',
              'Phiếu nhập đã duyệt không thể hủy!'
            );
          }
        },
      },
      {
        label: 'Lịch sử nhận chứng từ',
        action: (e: any, row: any) => {
          const rowData = row.getData();
          this.data = [rowData];
          this.id = rowData['ID'];
          this.openModalHistoryDeleteBill();
        },
      },
    ];

    const headerMenu = function (this: any) {
      const menu = [];
      const columns = this.getColumns();

      for (let column of columns) {
        let icon = document.createElement('i');
        icon.classList.add('fas');
        icon.classList.add(
          column.isVisible() ? 'fa-check-square' : 'fa-square'
        );

        let label = document.createElement('span');
        let title = document.createElement('span');

        title.textContent = ' ' + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        menu.push({
          label: label,
          action: function (e: any) {
            e.stopPropagation();
            column.toggle();
            icon.classList.toggle('fa-check-square', column.isVisible());
            icon.classList.toggle('fa-square', !column.isVisible());
          },
        });
      }
      return menu;
    };

    if (this.table_billImport) {
      this.table_billImport.replaceData(this.dataTableBillImport);
    } else {
      this.table_billImport = new Tabulator('#table_billImport', {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dataTableBillImport,
        height: '90vh',
        layout: 'fitDataFill',
        pagination: true,
        selectableRows: 1,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        rowContextMenu: rowMenu,
        columns: [
          {
            title: 'Nhận chứng từ',
            field: 'Status',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${
                value === true ? 'checked' : ''
              } disabled />`;
            },
            headerMenu: headerMenu,
          },
          {
            title: 'Ngày nhận / Hủy',
            field: 'DateStatus',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
            headerMenu: headerMenu,
          },
          {
            title: 'Loại phiếu',
            field: 'BillTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Ngày Y/c nhập',
            field: 'DateRequestImport',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
            headerMenu: headerMenu,
          },
          {
            title: 'Số phiếu',
            field: 'BillImportCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
            resizable: true,
            variableHeight: true,
            bottomCalc: 'count',
          },
          {
            title: 'Nhà cung cấp / Bộ phận',
            field: 'Suplier',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Mã NV',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Người giao / Người trả',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Người nhận',
            field: 'Reciver',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Ngày tạo',
            field: 'CreatDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
            headerMenu: headerMenu,
          },
          {
            title: 'Loại vật tư',
            field: 'KhoType',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Kho',
            field: 'WarehouseName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },

          // ====== Bổ sung đầy đủ các cột yêu cầu ======
          {
            title: 'TotalPage',
            field: 'TotalPage',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'RowNum',
            field: 'RowNum',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'BillType',
            field: 'BillType',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'GroupID',
            field: 'GroupID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'SupplierID',
            field: 'SupplierID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'Người giao / Người trả',
            field: 'DeliverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'ReciverID',
            field: 'ReciverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title:'Người giao',
            field:'FullNameSender',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'KhoTypeID',
            field: 'KhoTypeID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const v = cell.getValue();
              return v ? DateTime.fromISO(v).isValid ? DateTime.fromISO(v).toFormat('dd/MM/yyyy HH:mm') : (DateTime.fromSQL(v).isValid ? DateTime.fromSQL(v).toFormat('dd/MM/yyyy HH:mm') : v) : '';
            },
            headerMenu: headerMenu,
          },
          {
            title: 'UpdatedDate',
            field: 'UpdatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
            formatter: (cell) => {
              const v = cell.getValue();
              return v ? DateTime.fromISO(v).isValid ? DateTime.fromISO(v).toFormat('dd/MM/yyyy HH:mm') : (DateTime.fromSQL(v).isValid ? DateTime.fromSQL(v).toFormat('dd/MM/yyyy HH:mm') : v) : '';
            },
            headerMenu: headerMenu,
          },
          {
            title:'Người tạo',
            field: 'CreatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'UpdatedBy',
            field: 'UpdatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'UnApprove',
            field: 'UnApprove',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
            formatter: (cell) => {
              const v = cell.getValue();
              return `<input type="checkbox" ${v ? 'checked' : ''} disabled />`;
            },
            headerMenu: headerMenu,
          },
          {
            title: 'PTNB',
            field: 'PTNB',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const v = cell.getValue();
              return `<input type="checkbox" ${v ? 'checked' : ''} disabled />`;
            },
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'WarehouseID',
            field: 'WarehouseID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'BillTypeNew',
            field: 'BillTypeNew',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'BillDocumentImportType',
            field: 'BillDocumentImportType',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          // DateRequestImport đã có ở trên
          {
            title: 'RulePayID',
            field: 'RulePayID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'IsDeleted',
            field: 'IsDeleted',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
            formatter: (cell) => {
              const v = cell.getValue();
              return `<input type="checkbox" ${v ? 'checked' : ''} disabled />`;
            },
            headerMenu: headerMenu,
          },
          {
            title: 'BillExportID',
            field: 'BillExportID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'StatusDocumentImport',
            field: 'StatusDocumentImport',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          // BillTypeText đã có ở trên
          // Code đã có ở trên
          // DepartmentName đã có ở trên
          {
            title: 'Overdue QC',
            field: 'Overdue',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'Tình trạng hồ sơ',
            field: 'IsSuccessText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'Người nhận / Hủy CT',
            field: 'DoccumentReceiver',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerMenu: headerMenu,
          },
          {
            title: 'DoccumentReceiverID',
            field: 'DoccumentReceiverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'CurrencyList',
            field: 'CurrencyList',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'VAT',
            field: 'VAT',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          {
            title: 'PONCCCodeList',
            field: 'PONCCCodeList',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
            headerMenu: headerMenu,
          },
          // ====== Hết phần bổ sung ======
        ],
      });

      // Events for row selection
      this.table_billImport.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.data = [rowData];
        console.log('dhdgdfgd', this.data);
        this.getBillImportDetail(this.id);
        this.getBillImportByID(this.id);
      });

      this.table_billImport.on('rowDeselected', () => {
        const selectedRows = this.table_billImport.getSelectedRows();
        if (selectedRows.length === 0) {
          this.id = 0;
          this.data = [];
          this.table_billImportDetail?.replaceData([]);
          this.selectBillImport = [];
        }
      });
    }
    if (this.table_billImportDetail) {
      this.table_billImportDetail.replaceData(this.dataTableBillImportDetail);
    } else {
      this.table_billImportDetail = new Tabulator('#table_billimportdetail', {
        ...DEFAULT_TABLE_CONFIG,
        data: this.dataTableBillImportDetail,
        layout: 'fitDataFill',
        height: '90vh',
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: 'Mã nội bộ',
            field: 'ProductNewCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã hàng',
            field: 'ProductCode',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Chi tiết sản phẩm',
            field: 'ProductName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Serial Number',
            field: 'SerialNumber',
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
            title: 'Mã theo dự án',
            field: 'ProjectCodeExport',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'SL thực tế',
            field: 'Qty',
            hozAlign: 'right',
            headerHozAlign: 'center',
          },
          {
            title: 'Hóa đơn',
            field: 'SomeBill',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày hóa đơn',
            field: 'DateSomeBill',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Loại hàng',
            field: 'ProductGroupName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã dự án',
            field: 'ProjectCodeExport',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Tên dự án',
            field: 'ProjectNameText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Khách hàng',
            field: 'CustomerFullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Đơn mua hàng',
            field: 'BillCodePO',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú (PO)',
            field: 'Note',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }
}
