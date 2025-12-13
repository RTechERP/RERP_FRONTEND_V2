import { inject, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DateTime } from 'luxon';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
declare var bootstrap: any;
// @ts-ignore
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { BillImportTechnicalService } from './bill-import-technical-service/bill-import-technical.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BillImportTechnicalFormComponent } from './bill-import-technical-form/bill-import-technical-form.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  standalone: true,
  imports: [
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
    NzSpinModule,
    NzModalModule,
    HasPermissionDirective,
  ],
  selector: 'app-bill-import-technical',
  templateUrl: './bill-import-technical.component.html',
  styleUrls: ['./bill-import-technical.component.css'],
})
export class BillImportTechnicalComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private billImportTechnicalService: BillImportTechnicalService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    @Optional() @Inject('tabData') private tabData: any
  ) {}
  private ngbModal = inject(NgbModal);
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  billImportTechnicalData: any[] = [];
  billImportTechnicalDetailData: any[] = [];
  billImportTechnicalTable: Tabulator | null = null;
  billImportTechnicalDetailTable: Tabulator | null = null;
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number = 1;
  selectedApproval: number | null = null;
  isSearchVisible: boolean = false;
  isDetailLoad: boolean = false;
  title: string = '';
  tabDetailTitle: string = 'Thông tin phiếu nhập';
  // Danh sách nhân viên
  emPloyeeLists: any[] = [];
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' },
  ];
  warehouseType: number = 1;
  @ViewChild('billImportTechnicalTableRef', { static: true })
  billImportTechnicalTableRef!: ElementRef;
  @ViewChild('billImportTechnicalDetailTableRef', { static: true })
  billImportTechnicalDetailTableRef!: ElementRef;

  ngOnInit() {
    // Khởi tạo giá trị mặc định cho dateStart (đầu tháng hiện tại) và dateEnd (hôm nay)
    const now = new Date();
    this.dateStart = new Date(now.getFullYear(), now.getMonth(), 1); // Ngày đầu tháng
    this.dateEnd = new Date(); // Hôm nay
    if (this.tabData?.warehouseID) {
      this.warehouseID = this.tabData.warehouseID;
      this.warehouseType = this.tabData.warehouseType;
    }
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }

  // Helper method to format date to yyyy-MM-dd
  private formatDateToString(date: Date | null): string {
    if (!date) return '';
    return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
  }
  getBillImportTechnical() {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      Page: this.Page,
      Size: this.Size,
      dateStart: this.formatDateToString(this.dateStart) || '2024-12-01',
      dateEnd: this.formatDateToString(this.dateEnd) || '2025-12-31',
      status: statusString,
      filterText: this.filterText || '',
      warehouseID: this.warehouseID || 1,
    };
    console.log('Request', request);
    this.billImportTechnicalService
      .getBillimportTechnical(request)
      .subscribe((response: any) => {
        this.billImportTechnicalData = response.billImportTechnical || [];
        console.log('Data', this.billImportTechnicalData);
        this.drawTable();
      });
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: '',
    };
    this.billImportTechnicalService.getUser().subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
    });
  }
  getProjectAjaxParams() {
    const startDate = this.dateStart || new Date('2024-12-01');
    const endDate = this.dateEnd || new Date('2025-12-31');

    return {
      dateTimeS: DateTime.fromJSDate(startDate)
        .set({ hour: 0, minute: 0, second: 0 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),

      dateTimeE: DateTime.fromJSDate(endDate)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      filterText: this.filterText || '',
      warehouseID: this.warehouseID ?? 1,
      status:
        this.selectedApproval !== null
          ? this.selectedApproval === 1
            ? 1
            : 0
          : -1,
      page: this.Page,
      size: this.Size,
    };
  }
  public drawTable(): void {
    this.billImportTechnicalTable = new Tabulator(
      this.billImportTechnicalTableRef.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        ajaxURL: this.billImportTechnicalService.getBillImport(),
        ajaxConfig: 'POST',
        paginationSize: 30,
        ajaxRequestFunc: (url, config, params) => {
          const request = {
            Page: params.page,
            Size: params.size,
            dateStart: this.formatDateToString(this.dateStart) || '2024-12-01',
            dateEnd: this.formatDateToString(this.dateEnd) || '2025-12-31',
            status:
              this.selectedApproval !== null
                ? this.selectedApproval === 1
                  ? '1'
                  : '0'
                : '-1',
            filterText: this.filterText || '',
            warehouseID: this.warehouseID || 1,
            BillType: (this.warehouseType || 1) == 2,
          };
          console.log(' POST Request:', request);
          return this.billImportTechnicalService
            .getBillimportTechnical(request)
            .toPromise();
        },
        ajaxResponse: (url, params, response) => {
          return {
            data: response.billImportTechnical || [],
            last_page: response.billImportTechnical?.[0]?.TotalPage || 1,
          };
        },

        placeholder: 'Không có dữ liệu',
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
        dataTree: true,
        addRowPos: 'bottom',
        history: true,
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            frozen: true,
          },
          // { title: "ID", field: "ID", visible: false },
          {
            title: 'Duyệt',
            field: 'Status',
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
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          // { title: "Số thứ tự", field: "RowNumber", visible: false },
          { title: 'Người duyệt', field: 'EmployeeApproveName' },

          {
            title: 'Ngày duyệt',
            field: 'DateStatus',
            formatter: formatDateCell,
          },
          { title: 'Loại phiếu ', field: 'BillTypeNewText' },
          { title: 'Mã phiếu nhập', field: 'BillCode' },
          // { title: "Loại chứng từ", field: "BillDocumentImportType", visible: false },
          // { title: "Loại phiếu (bool)", field: "BillType", visible: false },
          // { title: "Loại phiếu", field: "BillTypeNew", visible: false },
          { title: 'Nhà cung cấp', field: 'NCC' },
          { title: 'Khách hàng', field: 'CustomerName' },
          { title: 'Phòng ban', field: 'DepartmentName' },
          { title: 'Người giao', field: 'Deliver' },
          { title: 'Người nhận', field: 'EmployeeReceiverName' },
          { title: 'Ngày tạo', field: 'CreatDate', formatter: formatDateCell },
          { title: 'Người tạo', field: 'CreatedBy' },
          { title: 'Loại kho', field: 'WarehouseType' },
          // { title: "Ngày tạo bản ghi", field: "CreatedDate", formatter: formatDateCell, visible: false },
          // { title: "ID khách hàng", field: "CustomerID", visible: false },
          // { title: "Ngày yêu cầu nhập", field: "DateRequestImport", formatter: formatDateCell, visible: false },
          // { title: "ID người giao", field: "DeliverID", visible: false },
          // { title: "GroupTypeID", field: "GroupTypeID", visible: false },
          // { title: "Ảnh", field: "Image", visible: false },
          // { title: "Mượn NCC?", field: "IsBorrowSupplier", formatter: (cell) => {
          //     const val = cell.getValue();
          //     return val === true ? "Có" : (val === false ? "Không" : "");
          //   }, visible: false
          // },
          // {
          //   title: "Chuẩn hóa?", field: "IsNormalize", formatter: (cell) => {
          //     const val = cell.getValue();
          //     return val ? "Đã chuẩn hóa" : "Chưa chuẩn hóa";
          //   }, visible: false
          // },
          // { title: "ID người nhận", field: "ReceiverID", visible: false },
          // { title: "RulePayID", field: "RulePayID", visible: false },
          // {
          //   title: "Trạng thái", field: "Status", formatter: (cell) => {
          //     const value = cell.getValue();
          //     return value ? `<span class="badge bg-success">Hoạt động</span>` : `<span class="badge bg-danger">Không hoạt động</span>`;
          //   }, visible: false
          // },
          // { title: "Nhà cung cấp (text)", field: "Suplier", visible: false },
          // { title: "ID NCC", field: "SuplierID", visible: false },
          // { title: "ID người bán NCC", field: "SupplierSaleID", visible: false },
          // { title: "Người cập nhật", field: "UpdatedBy", visible: false },
          // { title: "Ngày cập nhật", field: "UpdatedDate", formatter: formatDateCell, visible: false },
          // { title: "ID kho", field: "WarehouseID", visible: false },

          // { title: "ID người duyệt", field: "ApproverID", visible: false }
        ],
      }
    );
    this.billImportTechnicalTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const id = rowData['ID'];
      const billcode = rowData['BillCode'];
      this.selectedRow = rowData;
      this.updateTabDetailTitle();
      this.isDetailLoad = true;
      this.billImportTechnicalService
        .getBillImportDetail(id)
        .subscribe({
          next: (res) => {
            const details = Array.isArray(res.billDetail) ? res.billDetail : [];
            this.billImportTechnicalDetailData = details;
            console.log('Detail Data', this.billImportTechnicalDetailData);
            this.drawDetail();
            this.isDetailLoad = false;
          },
          error: () => {
            this.isDetailLoad = false;
          }
        });
    });
    this.billImportTechnicalTable.on(
      'rowClick',
      (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
        this.updateTabDetailTitle();
      }
    );

    // Tự động select dòng đầu tiên sau khi data được load
    this.billImportTechnicalTable.on('dataLoaded', () => {
      setTimeout(() => {
        const rows = this.billImportTechnicalTable?.getRows();
        if (rows && rows.length > 0) {
          const firstRow = rows[0];
          firstRow.select();
          // Trigger rowClick để load detail
          const rowData = firstRow.getData();
          const id = rowData['ID'];
          if (id) {
            this.isDetailLoad = true;
            this.billImportTechnicalService
              .getBillImportDetail(id)
              .subscribe({
                next: (res) => {
                  const details = Array.isArray(res.billDetail) ? res.billDetail : [];
                  this.billImportTechnicalDetailData = details;
                  console.log('Detail Data', this.billImportTechnicalDetailData);
                  this.drawDetail();
                  this.isDetailLoad = false;
                },
                error: () => {
                  this.isDetailLoad = false;
                }
              });
          }
          this.selectedRow = rowData;
          this.sizeTbDetail = null;
          this.updateTabDetailTitle();
        } else {
          // Clear detail khi không có master data
          this.billImportTechnicalDetailData = [];
          this.selectedRow = null;
          this.sizeTbDetail = '0';
          this.updateTabDetailTitle();
          if (this.billImportTechnicalDetailTable) {
            this.billImportTechnicalDetailTable.setData([]);
          }
        }
      }, 100);
    });
  }
  updateTabDetailTitle(): void {
    if (this.selectedRow?.BillCode) {
      this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillCode}`;
    } else {
      this.tabDetailTitle = 'Thông tin phiếu nhập';
    }
  }
  onSearch(): void {
    this.drawTable(); // Gọi lại bảng với các điều kiện đã binding sẵn: dateStart, dateEnd, selectedApproval, filterText
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  private drawDetail(): void {
    if (this.billImportTechnicalDetailTable) {
      this.billImportTechnicalDetailTable.setData(
        this.billImportTechnicalDetailData
      );
    } else {
      this.billImportTechnicalDetailTable = new Tabulator(
        this.billImportTechnicalDetailTableRef.nativeElement,
        {
          data: this.billImportTechnicalDetailData,
          layout: 'fitDataStretch',
          paginationSize: 5,
          height: '100%',
          movableColumns: true,
          reactiveData: true,
          columns: [
            { title: 'Tên sản phẩm', field: 'ProductName', width:200 },
            { title: 'Serial', field: 'Serial', width:200 },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
            { title: 'ĐVT', field: 'UnitCountName' },
            { title: 'Tình trạng hàng', field: 'WarehouseType' },
            { title: 'Mã nội bộ', field: 'ProductCodeRTC', width:200 },
            { title: 'Đơn mua hàng', field: 'BillCodePO' },
            { title: 'Hãng', field: 'Maker', width:200 },
            { title: 'Người cần mượn', field: 'EmployeeBorrowName', width:200 },
            {
              title: 'Deadline trả NCC',
              field: 'DeadlineReturnNCC',
              formatter: formatDateCell,
            },
            // { title: 'Ghi chú', field: 'Note' },
            // { title: 'Mã tài sản NCC', field: 'TSCodeNCC', visible: false },
            // { title: 'Số lượng yêu cầu', field: 'QtyRequest', hozAlign: 'center', visible: false },
            // { title: 'Giá', field: 'Price', hozAlign: 'right', formatter: 'money', formatterParams: { thousand: ',', precision: 0 }, visible: false },
            // { title: 'Tổng giá', field: 'TotalPrice', hozAlign: 'right', formatter: 'money', formatterParams: { thousand: ',', precision: 0 }, visible: false },
            { title: 'Ghi chú', field: 'Note', formatter: (cell) => {
              const val = cell.getValue();
              return val ? `<span class="text-wrap">${val}</span>` : '';
            }, width:300 },

            {
              title: 'Mượn từ NCC?',
              field: 'IsBorrowSupplier',
              hozAlign: 'center',
              formatter: (cell) => {
                const val = cell.getValue();
                return val === true || val === 1
                  ? 'Có'
                  : val === false || val === 0
                  ? 'Không'
                  : '';
              },
              visible: false,
            },
            {
              title: '  Ngày yêu cầu phiếu',
              field: 'DateSomeBill',
              formatter: formatDateCell,
              visible: false,
            },
            { title: 'Mã dự án', field: 'ProjectCode', visible: false },
            { title: 'Tên dự án', field: 'ProjectName', visible: false },
          ],
        }
      );
    }
  }
  openModalImportExcel() {
    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen',
    });
    // Truyền warehouseID từ component cha vào modal
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      // Reload table after successful save
      this.drawTable();
    });
  }
  onEditBillImportTechnical() {
    const selectedData = this.billImportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn biên bản cần sửa!'
      );
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning(
        'Không thể sửa',
        'Biên bản đã duyệt, không thể sửa!'
      );
      return;
    }
    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen',
    });
    modalRef.componentInstance.masterId = selectedRow.ID;
    modalRef.componentInstance.dataEdit = selectedRow;
    // Truyền warehouseID từ component cha vào modal
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.formSubmitted.subscribe(() => {
      // Reload table after successful edit
      this.drawTable();
    });
  }

  getSelectedIds(): number[] {
    if (this.billImportTechnicalTable) {
      const selectedRows = this.billImportTechnicalTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteBillImportTechnical() {
    const selectedData = this.billImportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn biên bản cần xóa!'
      );
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning(
        'Không thể xóa',
        'Biên bản đã được duyệt, không thể xóa!'
      );
      return;
    }

    const selectedIds = this.getSelectedIds();
    const payload = {
      billImportTechnical: {
        ID: selectedIds[0],
        IsDeleted: true,
      },
      historyDeleteBill: {
        ID: 0,
        UserID: 1,
        BillID: selectedIds[0],
        Name: 'AdminSW',
        TypeBill: selectedRow.BillCode,
        DeleteDate: DateTime.now().toUTC().toISO(),
      },
    };

    this.billImportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Xóa biên bản thành công!'
        );
        // Reload table after successful delete
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning(
          NOTIFICATION_TITLE.error,
          'Lỗi kết nối máy chủ!'
        );
      },
    });
  }
  // Approve multiple bills
  onApprove() {
    const selectedBills = this.billImportTechnicalTable?.getSelectedData();

    if (!selectedBills || selectedBills.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn phiếu cần duyệt!');
      return;
    }

    // Show confirmation dialog
    const billCount = selectedBills.length;
    const confirmMsg =
      billCount === 1
        ? `Bạn có chắc chắn muốn duyệt phiếu "${
            selectedBills[0].BillCode || selectedBills[0].ID
          }" không?`
        : `Bạn có chắc chắn muốn duyệt ${billCount} phiếu đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận duyệt phiếu',
      nzContent: confirmMsg,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Gửi chỉ ID của bills cần duyệt
        const billsToApprove = selectedBills.map((bill) => ({ ID: bill.ID }));

        this.billImportTechnicalService.approveBills(billsToApprove).subscribe({
          next: (response) => {
            console.log('Approve response:', response);

            if (response?.success) {
              // Backend trả về success = true
              const data = response.data || {};
              const successCount = data.SuccessCount || 0;
              const totalProcessed = data.TotalProcessed || billCount;

              this.notification.success(
                NOTIFICATION_TITLE.success,
                response.message ||
                  `Duyệt thành công ${successCount}/${totalProcessed} phiếu!`
              );
            } else {
              // Backend trả về success = false nhưng vẫn OK status
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                response?.message || 'Không có phiếu nào được duyệt.'
              );
            }

            // Reload table after successful approve
            if (this.billImportTechnicalTable) {
              this.drawTable();
            }
          },
          error: (err) => {
            console.error('Approve error:', err);
            const errorMsg =
              err?.error?.message || err?.message || 'Lỗi kết nối máy chủ!';
            this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
          },
        });
      },
    });
  }

  // Unapprove multiple bills
  onUnApprove() {
    const selectedBills = this.billImportTechnicalTable?.getSelectedData();

    if (!selectedBills || selectedBills.length === 0) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn phiếu cần hủy duyệt!'
      );
      return;
    }

    // Show confirmation dialog
    const billCount = selectedBills.length;
    const confirmMsg =
      billCount === 1
        ? `Bạn có chắc chắn muốn HỦY DUYỆT phiếu "${
            selectedBills[0].BillCode || selectedBills[0].ID
          }" không?`
        : `Bạn có chắc chắn muốn HỦY DUYỆT ${billCount} phiếu đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận hủy duyệt phiếu',
      nzContent: confirmMsg,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Gửi chỉ ID của bills cần hủy duyệt
        const billsToUnapprove = selectedBills.map((bill) => ({ ID: bill.ID }));

        this.billImportTechnicalService
          .unapproveBills(billsToUnapprove)
          .subscribe({
            next: (response) => {
              console.log('Unapprove response:', response);

              if (response?.success) {
                // Backend trả về success = true
                const data = response.data || {};
                const successCount = data.SuccessCount || 0;
                const totalProcessed = data.TotalProcessed || billCount;

                this.notification.success(
                  NOTIFICATION_TITLE.success,
                  response.message ||
                    `Hủy duyệt thành công ${successCount}/${totalProcessed} phiếu!`
                );
              } else {
                // Backend trả về success = false nhưng vẫn OK status
                this.notification.warning(
                  NOTIFICATION_TITLE.warning,
                  response?.message || 'Không có phiếu nào được hủy duyệt.'
                );
              }

              this.drawTable();
            },
            error: (err) => {
              console.error('Unapprove error:', err);
              const errorMsg =
                err?.error?.message || err?.message || 'Lỗi kết nối máy chủ!';
              this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
            },
          });
      },
    });
  }
  exportBillImportTechnicalExcel() {
    const selectedMaster =
      this.billImportTechnicalTable?.getSelectedData()?.[0];
    const details = this.billImportTechnicalDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    // Hiển thị thông báo đang tải
    const loadingNotification = this.notification.info(
      'Đang xử lý',
      'Đang tải dữ liệu...',
      { nzDuration: 0 } // Không tự đóng
    );

    const payload = {
      master: {
        ID: selectedMaster.ID,
        BillCode: selectedMaster.BillCode,
        CreatDate: selectedMaster.CreatDate,
        Suplier: selectedMaster.Suplier,
        CustomerName: selectedMaster.CustomerName,
        Deliver: selectedMaster.Deliver,
        EmployeeReceiverName: selectedMaster.EmployeeReceiverName,
        DepartmentName: selectedMaster.DepartmentName,
      },
      details: details.map((item: any) => ({
        ProductCode: item.ProductCode,
        ProductName: item.ProductName,
        Quantity: item.Quantity,
        UnitName: item.UnitName,
        Maker: item.Maker,
        WarehouseType: item.WarehouseType,
        ProductCodeRTC: item.ProductCodeRTC,
        Note: item.Note,
      })),
    };

    this.billImportTechnicalService
      .exportBillImportTechnical(payload)
      .subscribe({
        next: (blob: Blob) => {
          const fileName = `PhieuNhapKT_${selectedMaster.BillCode}.xlsx`;
          saveAs(blob, fileName);

          // Đóng notification loading
          this.notification.remove(loadingNotification.messageId);

          // Hiển thị thông báo thành công
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Xuất Excel thành công!'
          );
        },
        error: (err) => {
          // Đóng notification loading
          this.notification.remove(loadingNotification.messageId);

          console.error(err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể xuất phiếu nhập kỹ thuật!'
          );
        },
      });
  }
  closePanel() {
    this.sizeTbDetail = '0';
  }
}
