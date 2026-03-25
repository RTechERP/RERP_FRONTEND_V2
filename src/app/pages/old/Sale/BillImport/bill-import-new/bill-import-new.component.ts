import {
  Component,
  Inject,
  OnInit,
  Optional,
  HostListener,
} from '@angular/core';
import * as ExcelJS from 'exceljs';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SplitterModule } from 'primeng/splitter';
import { CardModule } from 'primeng/card';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { BillImportServiceService } from '../bill-import-service/bill-import-service.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';
import { ActivatedRoute } from '@angular/router';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { HistoryDeleteBillComponent } from '../../BillExport/Modal/history-delete-bill/history-delete-bill.component';
import { environment } from '../../../../../../environments/environment';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BillImportDetailNewComponent } from './bill-import-detail-new/bill-import-detail-new.component';
import { CustomTable } from '../../../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../../../shared/custom-table/column-def.model';

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
  selector: 'app-bill-import-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    SplitterModule,
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
    CustomTable,
    Menubar,
    CardModule,
  ],
  templateUrl: './bill-import-new.component.html',
  styleUrls: ['./bill-import-new.component.css'],
})
export class BillImportNewComponent implements OnInit {
  // Export progress tracking
  exportProgress = { current: 0, total: 0, fileName: '' };
  private exportModalRef: any = null;

  // Column definitions (PrimeNG custom-table)
  columnsMaster: ColumnDef[] = [];
  columnsDetail: ColumnDef[] = [];

  // Datasets
  datasetMaster: any[] = [];
  datasetDetail: any[] = [];

  // Selection
  selectedMasterRows: any[] = [];

  // PrimeNG Menubar items
  menuBars: MenuItem[] = [];

  // Component state
  wareHouseCode: string = 'HN';
  readonly componentId: string =
    'billimport-' + Math.random().toString(36).substring(2, 11);
  isLoadTable: boolean = false;
  isDetailLoad: boolean = false;
  sizeTbDetail: any = '0';
  selectedRow: any = null;
  tabDetailTitle: string = 'Thông tin phiếu nhập';
  dataProductGroup: any[] = [];
  sizeSearch: string = '0';
  selectedKhoTypes: number[] = [];
  isCheckmode: boolean = false;
  id: number = 0;
  selectBillImport: any[] = [];

  isLoading: boolean = false;
  isMobile: boolean =
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  isShowModal: boolean = false;
  showSearchBar: boolean = true;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (typeof window !== 'undefined') {
      this.isMobile = event.target.innerWidth <= 768;
    }
  }

  searchParams = {
    dateStart: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    })(),
    dateEnd: (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    })(),
    listproductgroupID: '',
    status: -1,
    warehousecode: this.wareHouseCode,
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 99999999,
  };

  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];

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

  constructor(
    private billImportService: BillImportServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private message: NzMessageService,
    @Optional() @Inject('tabData') private tabData: any,
  ) {}

  ngOnInit(): void {
    this.initColumns();
    this.initMenuBar();

    this.route.queryParams.subscribe((params) => {
      const newWarehouseCode =
        params['warehouseCode'] ?? this.tabData?.warehouseCode ?? 'HN';

      const warehouseCodeChanged = this.wareHouseCode !== newWarehouseCode;
      this.wareHouseCode = newWarehouseCode;
      this.searchParams.warehousecode = this.wareHouseCode;

      if (warehouseCodeChanged) {
        this.initColumns();
      }

      this.getProductGroup();
      this.loadDataBillImport();
    });
  }

  // =================================================================
  // MENUBAR INITIALIZATION
  // =================================================================

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N27,N1,N33,N34,N69'),
        command: () => {
          this.openModalBillImportDetail(false);
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N27,N1,N33,N34,N69'),
        command: () => {
          this.openModalBillImportDetail(true);
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N27,N1,N33,N34,N69'),
        command: () => {
          this.deleteBillImport();
        },
      },

      {
        label: 'Nhận chứng từ',
        icon: 'fa-solid fa-circle-check fa-lg text-success',
        visible: this.permissionService.hasPermission('N11,N50,N1'),
        command: () => {
          this.IsApproved(true);
        },
      },
      {
        label: 'Hủy chứng từ',
        icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
        visible: this.permissionService.hasPermission('N11,N1,N18'),
        command: () => {
          this.IsApproved(false);
        },
      },

      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        items: [
          {
            label: 'Xuất phiếu',
            icon: 'fa-solid fa-file-export fa-lg text-primary',
            command: () => {
              this.onExportExcel();
            },
          },
          {
            label: 'Excel KT',
            icon: 'fa-solid fa-calculator fa-lg text-info',
            command: () => {
              this.onExportExcelKT();
            },
          },
          {
            label: 'Xuất danh sách',
            icon: 'fa-solid fa-list fa-lg text-secondary',
            command: () => {
              this.exportExcel();
            },
          },
        ],
      },
      {
        label: 'Xuất hàng',
        icon: 'fa-solid fa-truck fa-lg text-warning',
        visible: this.permissionService.hasPermission('N27,N1,N33,N34,N69'),
        command: () => {
          this.convertExport();
        },
      },
      {
        label: 'Hồ sơ chứng từ',
        icon: 'fa-solid fa-folder-open fa-lg text-info',
        visible: this.permissionService.hasPermission('N52,N36,N1,N34'),
        command: () => {
          this.openModalBillDocumentImport();
        },
      },
      {
        label: 'Cây thư mục',
        icon: 'fa-solid fa-folder-tree fa-lg text-warning',
        command: () => {
          this.openFolderTree();
        },
      },
      {
        label: 'QR Code Phiếu',
        icon: 'fa-solid fa-qrcode fa-lg text-dark',
        command: () => {
          this.openModalScanBill();
        },
      },
      {
        label: 'Tổng hợp',
        icon: 'fa-solid fa-chart-pie fa-lg text-primary',
        command: () => {
          this.openModalBillImportSynthetic();
        },
      },
    ];
  }

  // =================================================================
  // COLUMN INITIALIZATION
  // =================================================================

  private formatDate(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime())
      ? ''
      : d.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }

  initColumns(): void {
    this.initColumnsMaster();
    this.initColumnsDetail();
  }

  initColumnsMaster(): void {
    this.columnsMaster = [
      {
        field: 'Status',
        header: 'Nhận chứng từ',
        width: '30px',
        sortable: true,
        // filterMode: 'dropdown',
        filterOptions: [
          { label: 'Đã nhận', value: true },
          { label: 'Chưa nhận', value: false },
        ],
        filterMode: 'multiselect',
        format: (val) => (val === true ? '✓' : ''),
        cssClass: 'text-center',
        frozen: true,
        alignFrozen: 'left',
      },
      {
        field: 'DoccumentReceiver',
        header: 'Người nhận / Hủy CT',
        width: '50px',
        sortable: true,
        filterMode: 'multiselect',
        frozen: true,
        alignFrozen: 'left',
        textWrap:true
      },
      {
        field: 'DateStatus',
        header: 'Ngày nhận / Hủy',
        width: '50px',
        sortable: true,
        filterMode: 'datetime',
        format: (val) => this.formatDate(val),
        cssClass: 'text-center',
        frozen: true,
        alignFrozen: 'left',
      },
      {
        field: 'BillTypeText',
        header: 'Loại phiếu',
        width: '150px',
        sortable: true,
      },
      {
        field: 'DateRequestImport',
        header: 'Ngày Y/c nhập',
        width: '130px',
        sortable: true,
        filterMode: 'datetime',
        format: (val) => this.formatDate(val),
        cssClass: 'text-center',
      },
      {
        field: 'BillImportCode',
        header: 'Số phiếu',
        width: '180px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'Suplier',
        header: 'Nhà cung cấp / Bộ phận',
        width: '400px',
        sortable: true,
        textWrap: true,
      },
      {
        field: 'DepartmentName',
        header: 'Phòng ban',
        width: '150px',
        sortable: true,
      },
      {
        field: 'Code',
        header: 'Mã NV',
        width: '100px',
        sortable: true,
      },
      {
        field: 'Deliver',
        header: 'Người giao / Người trả',
        width: '180px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'Reciver',
        header: 'Người nhận',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'KhoType',
        header: 'Loại vật tư',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'WarehouseName',
        header: 'Kho',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'IsSuccessText',
        header: 'Tình trạng hồ sơ',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'CreatDate',
        header: 'Ngày tạo',
        width: '130px',
        sortable: true,
        filterMode: 'datetime',
        format: (val) => this.formatDate(val),
        cssClass: 'text-center',
      },
      {
        field: 'CreatedBy',
        header: 'Người tạo',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
      },
    ];
  }

  initColumnsDetail(): void {
    this.columnsDetail = [
      {
        field: 'ProductNewCode',
        header: 'Mã nội bộ',
        width: '150px',
        sortable: true,
      },
      {
        field: 'ProductCode',
        header: 'Mã hàng',
        width: '150px',
        sortable: true,
      },
      {
        field: 'ProductName',
        header: 'Chi tiết sản phẩm',
        width: '300px',
        sortable: true,
      },
      {
        field: 'SerialNumber',
        header: 'Serial Number',
        width: '300px',
        sortable: true,
      },
      {
        field: 'Unit',
        header: 'ĐVT',
        width: '80px',
        sortable: true,
        cssClass: 'text-center',
      },
      {
        field: 'ProjectCode',
        header: 'Mã theo dự án',
        width: '150px',
        sortable: true,
      },
      {
        field: 'Qty',
        header: 'SL thực tế',
        width: '100px',
        sortable: true,
        format: (val) =>
          val != null
            ? Number(val).toLocaleString('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })
            : '',
        cssClass: 'text-end',
      },
      { field: 'SomeBill', header: 'Hóa đơn', width: '150px', sortable: true },
      {
        field: 'DateSomeBill',
        header: 'Ngày hóa đơn',
        width: '130px',
        sortable: true,
        format: (val) => this.formatDate(val),
        cssClass: 'text-center',
      },
      {
        field: 'ProductGroupName',
        header: 'Loại hàng',
        width: '150px',
        sortable: true,
      },
      {
        field: 'ProjectCodeText',
        header: 'Mã dự án',
        width: '150px',
        sortable: true,
      },
      {
        field: 'ProjectNameText',
        header: 'Tên dự án',
        width: '200px',
        sortable: true,
      },
      {
        field: 'CustomerFullName',
        header: 'Khách hàng',
        width: '400px',
        sortable: true,
      },
      {
        field: 'BillCodePO',
        header: 'Đơn mua hàng',
        width: '150px',
        sortable: true,
      },
      { field: 'Note', header: 'Ghi chú (PO)', width: '150px', sortable: true },
      {
        field: 'DealineQC',
        header: 'Hạn QC',
        width: '130px',
        sortable: true,
        format: (val) => this.formatDate(val),
        cssClass: 'text-center',
      },
      {
        field: 'StatusQCText',
        header: 'Trạng thái QC',
        width: '150px',
        sortable: true,
      },
    ];
  }

  // =================================================================
  // SELECTION EVENTS
  // =================================================================

  onMasterSelectionChange(selection: any[]): void {
    this.selectedMasterRows = selection || [];
  }

  onRowClick(rowData: any): void {
    this.selectedRow = rowData;
    this.id = rowData?.ID || 0;
    this.updateTabDetailTitle();
    if (this.id > 0) {
      this.getBillImportDetail(this.id);
      this.getBillImportByID(this.id);
    } else {
      this.datasetDetail = [];
      this.selectBillImport = [];
    }
  }

  // =================================================================
  // DATA LOADING
  // =================================================================

  loadDataBillImport(): void {
    this.isLoading = true;
    this.billImportService.getBillImport(this.searchParams).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.status === 1 && res.data) {
          this.datasetMaster = res.data.map((item: any) => ({
            ...item,
            id: item.ID,
          }));
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Không thể tải dữ liệu phiếu nhập',
        );
      },
    });
  }

  getBillImportDetail(id: number): void {
    this.isDetailLoad = true;
    this.billImportService.getBillImportDetail(id).subscribe({
      next: (res) => {
        this.datasetDetail = (res.data || []).map((item: any) => ({
          ...item,
          id: item.ID,
        }));
        this.isDetailLoad = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Có lỗi xảy ra khi lấy chi tiết',
        );
        this.isDetailLoad = false;
      },
    });
  }

  getBillImportByID(ids: number): void {
    this.billImportService.getBillImportByID(ids).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.selectBillImport = res.data;
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Lỗi',
          );
        }
      },
    });
  }

  getProductGroup(): void {
    this.billImportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID ?? 0,
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            this.selectedKhoTypes = this.dataProductGroup.map(
              (item) => item.ID,
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

  // =================================================================
  // ACTIONS
  // =================================================================

  // =================================================================
  // MODAL ACTIONS
  // =================================================================

  openModalBillImportDetail(ischeckmode: boolean): void {
    this.isCheckmode = ischeckmode;
    if (this.isCheckmode == true && this.id == 0) {
      this.notification.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 phiếu nhập để sửa',
      );
      this.id = 0;
      return;
    }
    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      fullscreen: true,
    });
    modalRef.componentInstance.newBillImport = this.newBillImport;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.id = this.id;
    modalRef.componentInstance.WarehouseCode = this.wareHouseCode;

    modalRef.result.finally(() => {
      this.loadDataBillImport();
      if (this.id > 0) {
        this.getBillImportDetail(this.id);
      }
    });
  }

  openModalHistoryDeleteBill(): void {
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
        // Reload if needed
      }
    });
  }

  IsApproved(apr: boolean): void {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 phiếu để nhận chứng từ!',
      );
      return;
    }

    for (const bill of selectedRows) {
      if (bill.Approved == false && apr == false) {
        this.notification.info(
          NOTIFICATION_TITLE.warning,
          `Phiếu ${bill.BillImportCode} chưa nhận chứng từ, không thể hủy!`,
        );
        return;
      }

      if (bill.BillTypeNew === 4) {
        this.notification.info(
          NOTIFICATION_TITLE.warning,
          `Không thể thao tác với phiếu Yêu cầu nhập kho ${bill.BillImportCode}!`,
        );
        return;
      }
    }

    const billsWithDetails = selectedRows.map((bill: any) => ({
      ...bill,
      billImportDetails: this.datasetDetail,
    }));

    this.billImportService.approved(billsWithDetails, apr).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Thành công!',
          );
          this.loadDataBillImport();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Có lỗi xảy ra!',
          );
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      },
    });
  }

  updateDocumentStatus(status: boolean): void {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một phiếu để cập nhật!',
      );
      return;
    }

    const receiverID = this.selectedRow['DoccumentReceiverID'];

    if (receiverID !== this.appUserService.id && !this.appUserService.isAdmin) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bạn không có quyền cập nhật trạng thái hồ sơ chứng từ này!\nChỉ admin hoặc người nhận hồ sơ mới có thể cập nhật.',
      );
      return;
    }

    const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật trạng thái hồ sơ chứng từ thành <strong>"${statusText}"</strong>?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.callApiUpdateDocumentStatus([this.id], status);
      },
    });
  }

  private callApiUpdateDocumentStatus(
    billIDs: number[],
    status: boolean,
  ): void {
    const payload = billIDs.map((id) => {
      const bill = this.datasetMaster.find((b) => b.ID === id);
      return {
        ID: id,
        DoccumentReceiverID: bill?.DoccumentReceiverID || null,
      };
    });

    this.billImportService.approveDocumentImport(payload, status).subscribe({
      next: (res: any) => {
        if (res?.success) {
          const statusText = status ? 'đã nhận đủ' : 'chưa nhận đủ';
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message ||
              `Cập nhật trạng thái hồ sơ chứng từ thành "${statusText}" thành công!`,
          );
          this.loadDataBillImport();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Cập nhật trạng thái thất bại!',
          );
        }
      },
      error: (err: any) => {
        console.error('Error updating document status:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message ||
            'Có lỗi xảy ra khi cập nhật trạng thái hồ sơ chứng từ!',
        );
      },
    });
  }

  openFolderPath(): void {
    if (!this.selectedRow) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một phiếu để mở thư mục!',
      );
      return;
    }

    const code = this.selectedRow['BillImportCode'];
    const creatDate = this.selectedRow['CreatDate'];

    if (!code) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy mã phiếu nhập!',
      );
      return;
    }

    let year: number;
    if (creatDate) {
      const date = new Date(creatDate);
      year = date.getFullYear();
    } else {
      year = new Date().getFullYear();
    }

    const billtypeText: string = 'PhieuNhapKho';
    const path = `${environment.host}api/share/software/test/VP.${this.wareHouseCode}/${billtypeText}/${year}/${code}`;
    window.open(path, '_blank');
  }

  // =================================================================
  // HELPER METHODS
  // =================================================================

  private getSelectedRows(): any[] {
    return this.selectedMasterRows || [];
  }

  // Export master grid data to Excel using ExcelJS
  async exportExcel(): Promise<void> {
    const data = this.datasetMaster;
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!',
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách phiếu nhập');

    const filteredColumns = this.columnsMaster;
    const headers = [
      'STT',
      ...filteredColumns.map((col: ColumnDef) => col.header),
    ];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        ...filteredColumns.map((col: ColumnDef) => {
          const field = col.field;
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          if (field === 'Status') {
            value = value === true ? '✓' : '';
          }

          return value;
        }),
      ];
      worksheet.addRow(rowData);
    });

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
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
      from: { row: 1, column: 1 },
      to: { row: 1, column: filteredColumns.length + 1 },
    };

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
    link.download = `DanhSachPhieuNhap_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success(
      NOTIFICATION_TITLE.success,
      'Xuất file Excel thành công!',
    );
  }

  // =================================================================
  // ADDITIONAL UI AND DATA METHODS
  // =================================================================

  dateFormat = 'dd/MM/yyyy';
  checked: any = false;

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onCheckboxChange() {
    this.loadDataBillImport();
  }

  onDateStartChange(date: any) {
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      this.searchParams.dateStart = d.toISOString();
    }
  }

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
      pageSize: 99999999,
    };
    this.loadDataBillImport();
  }

  onSearch() {
    this.loadDataBillImport();
  }

  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }

  closePanel() {
    this.sizeTbDetail = '0';
  }

  updateTabDetailTitle(): void {
    if (this.selectedRow?.BillImportCode) {
      this.tabDetailTitle = `Thông tin phiếu nhập - ${this.selectedRow.BillImportCode}`;
    } else {
      this.tabDetailTitle = 'Thông tin phiếu nhập';
    }
  }

  // =================================================================
  // MODAL AND ACTION METHODS
  // =================================================================

  openModalScanBill() {
    import('../Modal/scan-bill-import/scan-bill-import.component').then((m) => {
      const modalRef = this.modalService.open(m.ScanBillImportComponent, {
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
    });
  }

  openModalBillDocumentImport() {
    let importId = this.id;
    let code = '';

    if (!importId || importId === 0) {
      const selectedRows = this.getSelectedRows();
      if (selectedRows.length > 0) {
        importId = selectedRows[0]?.ID || 0;
        code = selectedRows[0]?.BillImportCode || '';
      }
    }

    if (!importId || importId === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }

    if (!code && this.selectedRow) {
      code = this.selectedRow?.BillImportCode || '';
    }

    import('../Modal/bill-document-import/bill-document-import.component').then(
      (m) => {
        const modalRef = this.modalService.open(m.BillDocumentImportComponent, {
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
      },
    );
  }

  openModalBillImportSynthetic() {
    import('../Modal/bill-import-synthetic-new/bill-import-synthetic-new.component').then(
      (m) => {
        const modalRef = this.modalService.open(
          m.BillImportSyntheticNewComponent,
          {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            fullscreen: true,
          },
        );
        modalRef.componentInstance.warehouseCode = this.wareHouseCode;
        modalRef.result.catch((result) => {
          if (result == true) {
            this.loadDataBillImport();
          }
        });
      },
    );
  }

  deleteBillImport() {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất 1 phiếu muốn xóa!',
      );
      return;
    }

    const approvedBills = selectedRows.filter((bill) => bill.Status == true);
    if (approvedBills.length > 0) {
      const approvedBillCodes = approvedBills
        .map((bill) => bill.BillImportCode)
        .join(', ');
      this.notification.warning(
        'Thông báo',
        `Các phiếu đã được duyệt không thể xóa: ${approvedBillCodes}`,
      );
      return;
    }

    const billsToDelete = selectedRows.filter((bill) => bill.Status != true);

    if (billsToDelete.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có phiếu nào hợp lệ để xóa!',
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
                `Đã xóa thành công ${billsToDelete.length} phiếu!`,
              );
              this.loadDataBillImport();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Xóa thất bại!',
              );
            }
          },
          error: (err: any) => {
            this.notification.error(
              'Thông báo',
              err.error.message || 'Có lỗi xảy ra khi xóa dữ liệu!',
            );
          },
        });
      },
    });
  }

  //#region Xử lý tải nhiều file
  async onExportExcel() {
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length <= 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xuất file!',
      );
      return;
    }

    const ids = selectedRows
      .filter((row: any) => row.ID > 0)
      .map((row: any) => row.ID);
    if (ids.length <= 0) {
      this.notification.info(
        'Thông báo',
        'Không có sản phẩm hợp lệ để xuất file!',
      );
      return;
    }

    if (!('showDirectoryPicker' in window)) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Trình duyệt không hỗ trợ tính năng này!',
      );
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();

      try {
        const testFileHandle = await dirHandle.getFileHandle('.export_test', {
          create: true,
        });
        const testWritable = await testFileHandle.createWritable();
        await testWritable.write('test');
        await testWritable.close();
        await dirHandle.removeEntry('.export_test');
      } catch (permErr: any) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không có quyền ghi vào thư mục này!',
        );
        return;
      }

      this.isLoading = true;

      if (ids.length >= 10) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          'Do lượng file lớn vui lòng chờ ít phút để hoàn tất tải file!',
        );
      }

      await this.exportSequentiallyToFolder(ids, 0, dirHandle);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.notification.info('Thông báo', 'Bạn đã hủy chọn thư mục!');
      } else {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi: ${err.message || 'Có lỗi xảy ra khi chọn thư mục'}`,
        );
      }
      this.isLoading = false;
    }
  }

  private async exportSequentiallyToFolder(
    ids: number[],
    index: number,
    dirHandle: any,
  ): Promise<void> {
    if (index === 0) {
      this.exportProgress = { current: 0, total: ids.length, fileName: '' };
      this.exportModalRef = this.modal.info({
        nzTitle: 'Đang xuất file',
        nzContent: `Đang xuất file 0/${ids.length}...`,
        nzClosable: false,
        nzMaskClosable: false,
        nzKeyboard: false,
        nzOkText: null,
        nzCancelText: null,
        nzMask: false,
      });
    }

    if (index >= ids.length) {
      if (this.exportModalRef) {
        this.exportModalRef.close();
        this.exportModalRef = null;
      }
      this.message.success(`Xuất thành công ${ids.length} file!`);
      this.isLoading = false;
      return;
    }

    const id = ids[index];
    const selectedRows = this.datasetMaster.find((item) => item.ID === id);

    this.exportProgress.current = index + 1;
    this.exportProgress.fileName = selectedRows?.BillImportCode || `ID ${id}`;

    if (this.exportModalRef) {
      this.exportModalRef.updateConfig({
        nzContent: `Đang xuất file ${index + 1}/${ids.length}: ${this.exportProgress.fileName}`,
      });
    }

    try {
      const res = await this.billImportService.export(id).toPromise();
      const now = new Date();

      const dateString = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}`;
      const tick = Date.now().toString(36);

      const fileName = `${selectedRows?.BillImportCode || 'export'}_${dateString}_${tick}.xlsx`;

      const fileHandle = await dirHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(res);
      await writable.close();

      await this.exportSequentiallyToFolder(ids, index + 1, dirHandle);
    } catch (err: any) {
      if (this.exportModalRef) {
        this.exportModalRef.close();
        this.exportModalRef = null;
      }
      this.message.error(
        `Lỗi xuất file ${index + 1}/${ids.length} (ID ${id}): ${err.message || 'Có lỗi xảy ra'}`,
      );
      this.isLoading = false;
    }
  }
  //#endregion

  onExportExcelKT() {
    if (!this.id || this.id === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn bản ghi cần xuất file',
      );
      return;
    }

    const selectedBill = this.datasetMaster.find((item) => item.ID === this.id);
    if (!selectedBill) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không tìm thấy bản ghi được chọn',
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
        const fileName = `${selectedBill.BillImportCode || 'PhieuNhap'}_${dateString}.xls`;
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
          'Có lỗi xảy ra khi xuất file KT. ' + err.error?.message,
        );
        console.error(err);
      },
    });
  }

  convertExport() {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một phiếu nhập để chuyển đổi!',
      );
      return;
    }

    const lstBillImportID: number[] = selectedRows
      .map((row: any) => row.ID)
      .filter((id: number) => id > 0);

    if (lstBillImportID.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không tìm thấy phiếu nhập hợp lệ để chuyển đổi!',
      );
      return;
    }

    const firstBillImport = selectedRows[0];

    import('../../BillExport/bill-export-detail-new/bill-export-detail-new.component').then(
      (m) => {
        const modalRef = this.modalService.open(
          m.BillExportDetailNewComponent,
          {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            fullscreen: true,
          },
        );

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
      },
    );
  }

  openFolderTree() {
    const selectedRows = this.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu nhập!');
      return;
    }

    const rowData = selectedRows[0];
    const code = rowData.BillImportCode;
    const creatDate = rowData.CreatDate;

    if (!code) {
      this.notification.warning('Thông báo', 'Không tìm thấy mã phiếu!');
      return;
    }

    let year: number;
    if (creatDate) {
      const date = new Date(creatDate);
      year = date.getFullYear();
    } else {
      year = new Date().getFullYear();
    }

    const billtypeText: string = 'PhieuNhapKho';
    const path = `${environment.host}api/share/software/test/VP.${this.wareHouseCode}/${billtypeText}/${year}/${code}`;
    window.open(path, '_blank');
  }

  formatNumber(num: number, digits: number = 0): string {
    num = num || 0;
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
}
