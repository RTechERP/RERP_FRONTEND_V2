import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  Inject,
  Optional,
} from '@angular/core';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { environment } from '../../../../../environments/environment';

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
    NzSpinModule,
    NzTabsModule,
    HasPermissionDirective,
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
    private appUserService: AppUserService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
  wareHouseCode: string = 'HN';
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
  isLoadTable: boolean = false;
  isDetailLoad: boolean = false;
  sizeTbDetail: any = '0';
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
    dateStart: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0); // đầu ngày
      return d.toISOString(); // ISO chuẩn UTC
    })(),
    dateEnd: (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999); // cuối ngày
      return d.toISOString(); // ISO chuẩn UTC
    })(),
    listproductgroupID: '',
    status: -1,
    warehousecode: this.wareHouseCode,
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 50,
  };

  searchText: string = '';
  dateFormat = 'dd/MM/yyyy';
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];
  ngOnInit(): void {
    if (this.tabData?.warehouseCode) {
      this.wareHouseCode = this.tabData.warehouseCode;
    }
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

  // Tự động set giờ 00:00:00 cho dateStart khi người dùng chọn ngày
  onDateStartChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      this.searchParams.dateStart = d.toISOString();
    }
  }

  // Tự động set giờ 23:59:59 cho dateEnd khi người dùng chọn ngày
  onDateEndChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      this.searchParams.dateEnd = d.toISOString();
    }
  }
  resetform(): void {
    this.selectedKhoTypes = [];
    const dateStart = new Date();
    dateStart.setMonth(dateStart.getMonth() - 1);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    this.searchParams = {
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      listproductgroupID: '',
      status: -1,
      warehousecode: this.wareHouseCode,
      keyword: '',
      checkAll: false,
      pageNumber: 1,
      pageSize: 50,
    };
    this.searchText = '';
    this.loadDataBillImport();
  }
  searchData() {
    this.loadDataBillImport();
  }
  convertExport() {
    // Get selected rows from the table
    const selectedRows = this.table_billImport?.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một phiếu nhập để chuyển đổi!'
      );
      return;
    }

    // Get the list of bill import IDs
    const lstBillImportID: number[] = selectedRows
      .map((row: any) => {
        const rowData = row.getData();
        return rowData.ID;
      })
      .filter((id: number) => id > 0);

    if (lstBillImportID.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không tìm thấy phiếu nhập hợp lệ để chuyển đổi!'
      );
      return;
    }

    // Get the first selected bill import for default values
    const firstBillImport = selectedRows[0].getData();

    // Import BillExportDetailComponent dynamically
    import(
      '../BillExport/Modal/bill-export-detail/bill-export-detail.component'
    )
      .then((m) => {
        const modalRef = this.modalService.open(m.BillExportDetailComponent, {
          centered: true,
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
        });

        // Pass data to the modal matching the C# form logic
        modalRef.componentInstance.lstBillImportID = lstBillImportID;
        modalRef.componentInstance.wareHouseCode = this.wareHouseCode;
        modalRef.componentInstance.billImport = firstBillImport;
        modalRef.componentInstance.checkConvert = false;
        modalRef.componentInstance.isAddExport = false;

        modalRef.result.catch((result) => {
          if (result === true) {
            this.loadDataBillImport();
          }
        });
      })
      .catch((err) => {
        console.error(
          'Error loading BillExportDetailComponent:',
          err.error.message
        );
        this.notification.error(
          'Thông báo',
          err.error.message || 'Không thể mở form chuyển đổi phiếu xuất!'
        );
      });
  }

  openModalBillImportDetail(ischeckmode: boolean) {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất để sửa');
      this.id = 0;
      return;
    }
    const modalRef = this.modalService.open(BillImportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.wareHouseCode = this.wareHouseCode;

    modalRef.result.finally(() => {
      this.id = 0;
      this.loadDataBillImport();
    });
  }
  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }
  getProductGroup() {
    this.billImportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID ?? 0
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            this.selectedKhoTypes = this.dataProductGroup.map(
              (item) => item.ID
            );
            this.searchParams.listproductgroupID =
              this.selectedKhoTypes.join(',');
            this.loadDataBillImport();
          } else {
            this.searchParams.listproductgroupID = '';
            this.loadDataBillImport();
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy nhóm vật tư', err);
          this.searchParams.listproductgroupID = '';
          this.loadDataBillImport();
        },
      });
  }
  getBillImportDetail(id: number) {
    this.isDetailLoad = true;
    this.billImportService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.dataTableBillImportDetail = res.data;
        this.table_billImportDetail?.replaceData(
          this.dataTableBillImportDetail
        );
        this.isDetailLoad = false;
      },
      error: (err) => {
        this.notification.error(
          'Thông báo',
          err.error.message || 'Có lỗi xảy ra khi lấy chi tiết'
        );
        this.isDetailLoad = false;
      },
    });
  }
  getBillImportByID(ids: number) {
    this.billImportService.getBillImportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillImport = res.data;
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Lỗi'
          );
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
  IsApproved(apr: boolean) {
    const selectedRows = this.table_billImport?.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 phiếu để nhận chứng từ!'
      );
      return;
    }

    const selectedBills = selectedRows.map((row: any) => row.getData());

    // Kiểm tra điều kiện cho từng phiếu được chọn
    for (const bill of selectedBills) {
      if (bill.Approved == false && apr == false) {
        this.notification.info(
          'Thông báo',
          `Phiếu ${bill.BillImportCode} chưa nhận chứng từ, không thể hủy!`
        );
        return;
      }

      if (bill.BillTypeNew === 4) {
        this.notification.info(
          'Thông báo',
          `Không thể thao tác với phiếu Yêu cầu nhập kho ${bill.BillImportCode}!`
        );
        return;
      }
    }

    // Lấy dữ liệu chi tiết từ table_billImportDetail
    const billImportDetails = this.table_billImportDetail?.getData() || [];

    // Gắn billImportDetails vào từng bill
    const billsWithDetails = selectedBills.map((bill: any) => ({
      ...bill,
      billImportDetails: billImportDetails,
    }));

    // Gọi API với danh sách phiếu có kèm billImportDetails
    this.billImportService.approved(billsWithDetails, apr).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Thành công!'
          );
          this.loadDataBillImport();
        } else {
          this.notification.error('Thông báo', res.message || 'Có lỗi xảy ra!');
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      },
    });
  }
  loadDataBillImport() {
    // Nếu table đã tồn tại, chỉ cần setData để trigger Ajax request
    if (this.table_billImport) {
      this.table_billImport.setData();
    }
    // Nếu chưa có table, drawTable() sẽ tự động load data
  }
  async exportExcel() {
    const table = this.table_billImport;
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
    const worksheet = workbook.addWorksheet('Danh sách phiếu nhập');

    const columns = table.getColumns();
    const filteredColumns = columns.filter(
      (col: any, index: number) => index !== 0 && col.isVisible()
    );

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
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      column.width = Math.min(maxLength, 30);
    });

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
  onExportExcel() {
    if (!this.id || this.id === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xuất file'
      );
      return;
    }

    const selectedHandover = this.data.find((item) => item.ID === this.id);
    if (!selectedHandover) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy bản ghi được chọn'
      );
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
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi xuất file.'
        );
        console.error(err);
      },
    });
  }

  onExportExcelKT() {
    if (!this.id || this.id === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xuất file'
      );
      return;
    }

    const selectedBill = this.data.find((item) => item.ID === this.id);
    if (!selectedBill) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy bản ghi được chọn'
      );
      return;
    }

    this.billImportService.exportExcelKT(this.id).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        const now = new Date();
        const dateString =
          now.getDate().toString().padStart(2, '0') +
          '_' +
          (now.getMonth() + 1).toString().padStart(2, '0') +
          '_' +
          now.getFullYear() +
          '_' +
          now.getHours().toString().padStart(2, '0') +
          '_' +
          now.getMinutes().toString().padStart(2, '0') +
          '_' +
          now.getSeconds().toString().padStart(2, '0');
        const fileName = `${
          selectedBill.BillImportCode || 'PhieuNhap'
        }_${dateString}.xls`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notification.success('Thông báo', 'Xuất file thành công!');
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi xuất file KT. ' + err.error?.message
        );
        console.error(err);
      },
    });
  }
  //hồ sơ chứng từ
  openModalBillDocumentImport() {
    let importId = this.id;
    let code = '';
    if (!importId || importId === 0) {
      const selectedRows = this.table_billImport?.getSelectedRows?.() || [];
      if (selectedRows.length > 0) {
        const rowData = selectedRows[0].getData();
        importId = rowData?.ID || 0;
        code = rowData?.BillImportCode || '';
      }
    }
    if (!importId || importId === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }
    if (!code) {
      const selected = this.data?.[0];
      code = selected?.BillImportCode || '';
    }

    const modalRef = this.modalService.open(BillDocumentImportComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.id = importId;
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
      backdrop: 'static',
      keyboard: false,
      fullscreen: true,
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
    const selectedRows: BillImport[] = this.table_billImport?.getSelectedRows();
    debugger;
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 phiếu muốn xóa!'
      );
      return;
    }

    const selectedBills = selectedRows.map((row: any) => row.getData());

    // Kiểm tra từng phiếu có được duyệt không
    const approvedBills = selectedBills.filter((bill) => bill.Status == true);
    if (approvedBills.length > 0) {
      const approvedBillCodes = approvedBills
        .map((bill) => bill.BillImportCode)
        .join(', ');
      this.notification.warning(
        'Thông báo',
        `Các phiếu đã được duyệt không thể xóa: ${approvedBillCodes}`
      );
      return;
    }

    // Chỉ lấy các phiếu chưa duyệt để xóa
    const billsToDelete = selectedBills.filter((bill) => bill.Status != true);

    if (billsToDelete.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có phiếu nào hợp lệ để xóa!'
      );
      return;
    }

    const payload = billsToDelete.map((bill) => ({
      billImport: {
        ID: bill.ID,
        IsDeleted: true,
      },
      billImportDetail: [],
      DeletedDetailIDs: [],
      billDocumentImports: [],
    }));

    const billCodes = billsToDelete
      .map((bill) => bill.BillImportCode)
      .join(', ');

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${billsToDelete.length} phiếu: ${billCodes} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.billImportService.saveBillImport(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa thành công ${billsToDelete.length} phiếu!`
              );
              this.loadDataBillImport();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Xóa thất bại!'
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Thông báo',
              err.error.message || 'Có lỗi xảy ra khi xóa dữ liệu!'
            );
          },
        });
      },
    });
  }
  openFolderTree() {
    // Lấy dòng được chọn từ bảng
    const selectedRows = this.table_billImport?.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }

    const rowData = selectedRows[0].getData();
    const code = rowData.BillImportCode;
    const creatDate = rowData.CreatDate;

    if (!code) {
      this.notification.warning('Thông báo', 'Không tìm thấy mã phiếu!');
      return;
    }

    // Lấy năm từ ngày tạo
    let year: number;
    if (creatDate) {
      const date = new Date(creatDate);
      year = date.getFullYear();
    } else {
      year = new Date().getFullYear();
    }

    const billtypeText: string = 'PhieuNhapKho';

    // Tạo đường dẫn (giống C#)
    const path = `${environment.host}api/share/software/test/VP.${this.wareHouseCode}/${billtypeText}/${year}/${code}`;

    // Mở đường dẫn trong tab mới
    window.open(path, '_blank');
  }

  deleteAttachment() {}
  addAttachment() {}

  /**
   * Cập nhật trạng thái hồ sơ chứng từ
   * @param row - Row được chọn từ context menu
   * @param status - true: đã nhận đủ, false: chưa nhận đủ
   */
  updateDocumentStatus(row: any, status: boolean): void {
    const rowData = row.getData();
    const billID = rowData['ID'];
    const receiverID = rowData['DoccumentReceiverID'];

    // Validate: Chỉ admin hoặc người nhận hồ sơ mới được cập nhật
    if (receiverID !== this.appUserService.id && !this.appUserService.isAdmin) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bạn không có quyền cập nhật trạng thái hồ sơ chứng từ này!\nChỉ admin hoặc người nhận hồ sơ mới có thể cập nhật.'
      );
      return;
    }

    // Hiển thị confirm dialog
    const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật trạng thái hồ sơ chứng từ thành <strong>"${statusText}"</strong>?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.callApiUpdateDocumentStatus([billID], status);
      },
    });
  }

  /**
   * Gọi API để cập nhật trạng thái hồ sơ chứng từ
   * @param billIDs - Mảng ID các phiếu nhập cần cập nhật
   * @param status - true: đã nhận đủ, false: chưa nhận đủ
   */
  private callApiUpdateDocumentStatus(billIDs: number[], status: boolean): void {
    // Chuẩn bị payload theo format API yêu cầu
    const payload = billIDs.map((id) => {
      // Tìm bill từ dataTableBillImport để lấy DoccumentReceiverID
      const bill = this.dataTableBillImport.find((b) => b.ID === id);
      return {
        ID: id,
        DoccumentReceiverID: bill?.DoccumentReceiverID || null,
      };
    });

    // Gọi API
    this.billImportService.approveDocumentImport(payload, status).subscribe({
      next: (res: any) => {
        if (res?.success) {
          const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || `Cập nhật trạng thái hồ sơ chứng từ thành "${statusText}" thành công!`
          );
          // Reload danh sách phiếu nhập
          this.loadDataBillImport();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Cập nhật trạng thái thất bại!'
          );
        }
      },
      error: (err: any) => {
        console.error('Error updating document status:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error, err.error.message ||
          'Có lỗi xảy ra khi cập nhật trạng thái hồ sơ chứng từ!'
        );
      },
    });
  }

  //vẽ bảng
  drawTable() {
    const rowMenu = [
      {
        label: '<i class="fas fa-check-circle"></i> Đã nhận đủ hồ sơ chứng từ',
        action: (e: any, row: any) => {
          this.updateDocumentStatus(row, true);
        },
      },
      {
        label: '<i class="fas fa-times-circle"></i> Chưa nhận đủ hồ sơ chứng từ',
        action: (e: any, row: any) => {
          this.updateDocumentStatus(row, false);
        },
      },
      {
        separator: true,
      },
      {
        label: 'Hủy duyệt phiếu nhập',
        action: (e: any, row: any) => {
          const rowData = row.getData();
          this.id = rowData['ID'];

          const selectedBill = this.dataTableBillImport.find(
            (item) => item.ID === this.id
          );
          if (selectedBill && selectedBill.Status !== true) {
            // Gọi với mảng chứa 1 phần tử
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
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (this.table_billImport) {
      this.table_billImport.setData();
    } else {
      this.table_billImport = new Tabulator('#table_billImport', {
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'remote',
        ajaxURL: 'dummy',
        ajaxRequestFunc: (_url, _config, params) => {
          return new Promise((resolve, reject) => {
            this.isLoadTable = true;
            const updatedParams = {
              ...this.searchParams,
              pageNumber: params.page || 1,
              pageSize: params.size || 50,
            };

            this.billImportService.getBillImport(updatedParams).subscribe({
              next: (res) => {
                this.isLoadTable = false;
                if (res.status === 1) {
                  resolve({
                    data: res.data,
                    last_page: res.data[0].TotalPage || 1,
                  });
                } else {
                  reject('Failed to load data');
                }
              },
              error: (err) => {
                this.isLoadTable = false;
                this.notification.error(
                  NOTIFICATION_TITLE.error,
                  err?.error?.message || 'Không thể tải dữ liệu phiếu nhập'
                );
                reject(err);
              },
            });
          });
        },
        paginationSize: 50,
        paginationSizeSelector: [10, 25, 50, 100, 200],
        height: '97%',
        layout: 'fitDataStretch',
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        rowContextMenu: rowMenu,
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
        locale: 'vi',
        columns: [
          {
            title: 'Nhận chứng từ',
            field: 'Status',
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
          },
          {
            title: 'Loại phiếu',
            field: 'BillTypeText',
            hozAlign: 'left',
            headerHozAlign: 'center',
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
          },
          {
            title: 'Số phiếu',
            field: 'BillImportCode',
            hozAlign: 'left',
            headerHozAlign: 'center',

            resizable: true,
            variableHeight: true,
            bottomCalc: 'count',
          },
          {
            title: 'Nhà cung cấp / Bộ phận',
            field: 'Suplier',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã NV',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người giao / Người trả',
            field: 'Deliver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Người nhận',
            field: 'Reciver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          // {
          //   title: 'Ngày nhập',
          //   field: 'CreatDate',
          //   hozAlign: 'center',
          //   headerHozAlign: 'center',
          //   formatter: (cell) => {
          //     const v = cell.getValue();
          //     return v
          //       ? DateTime.fromISO(v).isValid
          //         ? DateTime.fromISO(v).toFormat('dd/MM/yyyy HH:mm')
          //         : DateTime.fromSQL(v).isValid
          //         ? DateTime.fromSQL(v).toFormat('dd/MM/yyyy HH:mm')
          //         : v
          //       : '';
          //   },
          // },
          {
            title: 'Loại vật tư',
            field: 'KhoType',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Kho',
            field: 'WarehouseName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },

          {
            title: 'TotalPage',
            field: 'TotalPage',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'RowNum',
            field: 'RowNum',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'BillType',
            field: 'BillType',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'GroupID',
            field: 'GroupID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'SupplierID',
            field: 'SupplierID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Người giao / Người trả',
            field: 'DeliverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'ReciverID',
            field: 'ReciverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'KhoTypeID',
            field: 'KhoTypeID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'UpdatedDate',
            field: 'UpdatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
            formatter: (cell) => {
              const v = cell.getValue();
              return v
                ? DateTime.fromISO(v).isValid
                  ? DateTime.fromISO(v).toFormat('dd/MM/yyyy HH:mm')
                  : DateTime.fromSQL(v).isValid
                  ? DateTime.fromSQL(v).toFormat('dd/MM/yyyy HH:mm')
                  : v
                : '';
            },
          },
          {
            title: 'Người tạo',
            field: 'CreatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'UpdatedBy',
            field: 'UpdatedBy',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
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
          },
          {
            title: 'WarehouseID',
            field: 'WarehouseID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'BillTypeNew',
            field: 'BillTypeNew',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'BillDocumentImportType',
            field: 'BillDocumentImportType',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          // DateRequestImport đã có ở trên
          {
            title: 'RulePayID',
            field: 'RulePayID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
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
          },
          {
            title: 'BillExportID',
            field: 'BillExportID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'StatusDocumentImport',
            field: 'StatusDocumentImport',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Overdue QC',
            field: 'Overdue',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Tình trạng hồ sơ',
            field: 'IsSuccessText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const v = cell.getValue();
              return v
                ? DateTime.fromISO(v).isValid
                  ? DateTime.fromISO(v).toFormat('dd/MM/yyyy HH:mm')
                  : DateTime.fromSQL(v).isValid
                  ? DateTime.fromSQL(v).toFormat('dd/MM/yyyy HH:mm')
                  : v
                : '';
            },
          },
          {
            title: 'Người nhận / Hủy CT',
            field: 'DoccumentReceiver',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'DoccumentReceiverID',
            field: 'DoccumentReceiverID',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'CurrencyList',
            field: 'CurrencyList',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'VAT',
            field: 'VAT',
            hozAlign: 'right',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'PONCCCodeList',
            field: 'PONCCCodeList',
            hozAlign: 'left',
            headerHozAlign: 'center',
            visible: false,
          },
        ],
      });

      if (isMobile) {
        this.table_billImport.getColumns().forEach((col: any) => {
          const def = col.getDefinition();
          if (def && def.frozen === true) {
            col.updateDefinition({ frozen: false });
          }
        });
      }

      // Events for row selection
      this.table_billImport.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.id = rowData['ID'];
        this.sizeTbDetail = null;
        this.data = [rowData];
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
        layout: 'fitDataStretch',
        height: '39vh',
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
            visible: false,
          },
          {
            title: 'ĐVT',
            field: 'Unit',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Mã theo dự án',
            field: 'ProjectCode',
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
            editor: 'datetime',
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
            field: 'ProjectCodeText',
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
            title: 'Số POKH',
            field: 'PONumber',
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
          {
            title: 'Hạn QC',
            field: 'DealineQC',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Trạng thái QC',
            field: 'StatusQCText',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }
  closePanel() {
    this.sizeTbDetail = '0';
  }
}
