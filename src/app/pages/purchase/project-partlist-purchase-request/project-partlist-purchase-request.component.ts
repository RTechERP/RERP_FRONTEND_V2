import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  Input,
  Optional,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, ColumnDefinition, RowComponent, CellComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
// import { PONCCDetailComponent } from '../poncc-detail/poncc-detail.component';
import { ProjectPartlistPurchaseRequestService } from './project-partlist-purchase-request.service';
import { RequestType, Currency } from './project-partlist-purchase-request.model';
import { HasPermissionDirective } from "../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../app.config';
import { SupplierSaleDetailComponent } from '../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { ProjectService } from '../../project/project-service/project.service';
import { DateTime } from 'luxon';
import { ProjectPartListComponent } from '../../project/project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from './project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { WarehouseReleaseRequestService } from '../../old/warehouse-release-request/warehouse-release-request/warehouse-release-request.service';
import { HistoryPriceComponent } from './history-price/history-price.component';
import { AppUserService } from '../../../services/app-user.service';
import { PermissionService } from '../../../services/permission.service';
import * as ExcelJS from 'exceljs';
import { SupplierSaleService } from '../supplier-sale/supplier-sale.service';
import { PonccDetailComponent } from '../poncc/poncc-detail/poncc-detail.component';
@Component({
  selector: 'app-project-partlist-purchase-request',
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzTabsModule,
    NzModalModule,
    NgbModule,
    HasPermissionDirective
  ],
  templateUrl: './project-partlist-purchase-request.component.html',
  styleUrl: './project-partlist-purchase-request.component.css'
})
export class ProjectPartlistPurchaseRequestComponent implements OnInit, AfterViewInit {

  //#region Khai báo biến
  constructor(
    private srv: ProjectPartlistPurchaseRequestService,
    private notify: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private whService: WarehouseReleaseRequestService,
    private appUserService: AppUserService,
    private suplierSaleService: SupplierSaleService,
    private permissionService: PermissionService,
    @Optional() public activeModal?: NgbActiveModal
  ) { }

  @Input() showHeader: boolean = false;
  @Input() headerText: string = "";
  @Input() showCloseButton: boolean = false;
  @Input() isYCMH: boolean = false;
  @Input() supplierId: number = 0;
  @Input() isPurchaseRequestDemo: any = false;

  sizeSearch: string = '0';
  isLoading = false;
  lstPOKH: any[] = [];
  lstWarehouses: any[] = [];
  requestTypes: any[] = [];
  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
  keyword: string = '';
  // Advanced filters (giống pattern HiringRequest)
  statusRequestFilter: number = 1; // 0: tất cả
  supplierSaleFilter: number = 0;
  isApprovedTBPFilter: number = -1; // -1: tất cả, 0: chưa, 1: đã
  isApprovedBGDFilter: number = -1; // -1: tất cả, 0: chưa, 1: đã
  isDeletedFilter: number = 0; // 0: chưa xóa, 1: đã xóa, -1: tất cả
  projectIdFilter: number = 0;
  pokhIdFilter: number = 0;
  changedRows: any[] = [];
  originalDataMap: Map<number, any> = new Map(); // Lưu dữ liệu gốc theo ID
  duplicateIdList: number[] = []; // Danh sách các DuplicateID để kiểm tra editable
  selectedRowIds: number[] = []; // Lưu các ID đã chọn để khôi phục sau khi reload
  selectedTabIndex: number = -1; // Lưu tab index của các dòng đã chọn
  // Option lists for selects
  statusOptions = [
    { value: 0, label: '--Tất cả--' },
    { value: 1, label: 'Yêu cầu mua / mượn hàng' },
    { value: 2, label: 'Huỷ yêu cầu mua hàng' },
    { value: 3, label: 'Đã đặt hàng' },
    { value: 4, label: 'Đang về' },
    { value: 5, label: 'Đã về' },
    { value: 6, label: 'Không đặt hàng' },
  ];
  approvalOptions = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa duyệt' },
    { value: 1, label: 'Đã duyệt' },
  ];
  deletedOptions = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa xóa' },
    { value: 1, label: 'Đã xóa' },
  ];

  // Tabs & tables
  tabs: { id: number; title: string }[] = [];
  activeTabIndex = 0;
  @ViewChildren('tbContainer') containers!: QueryList<ElementRef>;
  private tables: Tabulator[] = [];

  // Lookup data for editors
  currencies: Currency[] = [];
  productGroups: any[] = [];
  productRTC: any[] = [];
  supplierSales: any[] = [];
  projects: any[] = [];

  // Track edited rows by ID
  private editedMap = new Map<number, any>();

  // Cached data by type for local pagination
  private allData: any[] = [];
  private dataByType = new Map<number, any[]>();

  // Map caption theo form WinForms để hiển thị tiêu đề cột tiếng Việt
  private CAPTION_MAP: Record<string, string> = {
    ID: 'ID',
    ProjectFullName: 'Dự án',
    TT: 'TT',
    ProductCode: 'Mã sản phẩm',
    ProductName: 'Tên sản phẩm',
    StatusRequestText: 'Trạng thái',
    FullName: 'Người yêu cầu',
    DateRequest: 'Ngày yêu cầu',
    DateReturnExpected: 'Deadline',
    Quantity: 'Số lượng',
    UnitPrice: 'Đơn giá',
    TotalPrice: 'Thành tiền chưa VAT',
    RequestDate: 'Ngày đặt hàng',
    DeadlineDelivery: 'Ngày về dự kiến',
    DateReturnActual: 'Ngày về',
    DateReceive: 'Ngày nhận',
    NameNCC: 'Nhà cung cấp',
    ProjectPartListID: 'ID PL DA',
    StatusRequest: 'Trạng thái',
    SupplierSaleID: 'Nhà cung cấp',
    UnitMoney: 'Tiền tệ',
    IsApprovedTBP: 'TBP duyệt',
    IsApprovedBGD: 'BGĐ duyệt',
    ApprovedTBPName: 'Tên TBP duyệt',
    ApprovedBGDName: 'Tên BGĐ duyệt',
    DateApprovedTBP: 'Ngày TBP duyệt',
    DateApprovedBGD: 'Ngày BGĐ duyệt',
    ProductGroupID: 'Loại kho',
    ProductSaleID: 'SP Sale',
    UnitName: 'ĐVT',
    ProductNewCode: 'Mã nội bộ',
    IsImport: 'Hàng nhập khẩu',
    HistoryPrice: 'Đơn giá lịch sử',
    CurrencyID: 'Loại tiền',
    CurrencyRate: 'Tỷ giá',
    TotalPriceExchange: 'Thành tiền quy đổi (VNĐ)',
    LeadTime: 'Lead time',
    UnitFactoryExportPrice: 'Đơn giá xuất xưởng',
    UnitImportPrice: 'Đơn giá nhập khẩu',
    TotalImportPrice: 'Tổng tiền nhập khẩu',
    IsRequestApproved: 'Y/c duyệt',
    Manufacturer: 'Hãng',
    ReasonCancel: 'Lý do hủy',
    ProjectID: 'Dự án ID',
    ProjectName: 'Tên dự án',
    UpdatedName: 'NV mua',
    VAT: 'VAT',
    TotaMoneyVAT: 'Thành tiền có VAT',
    TotalDayLeadTime: 'Số ngày Leadtime',
    PONCCID: 'PO NCC',
    BillCode: 'Đơn mua hàng',
    UnitPricePOKH: 'Đơn giá bán (Sale Admin up)',
    CustomerName: 'Khách hàng',
    IsCommercialProduct: 'Hàng thương mại',
    IsDeleted: 'Đã hủy',
    Model: 'Thông số Kỹ thuật',
    JobRequirementID: 'YCMH ID',
    CustomerID: 'KH ID',
    ProjectTypeName: 'Loại dự án',
    PONumber: 'PO KH',
    GuestCode: 'Mã theo khách',
    CustomerCode: 'Mã KH',
    ProjectCode: 'Mã dự án',
    POKHCode: 'Mã PO KH',
    StatusPOKHText: 'Trạng thái đặt hàng',
    SpecialCode: 'Mã đặc biệt',
    TotalPriceHistory: 'Thành tiền lịch sử',
    InventoryProjectID: 'Phiếu giữ hàng',
    NotePartlist: 'Ghi chú PL',
    IsStock: 'Tồn kho',
    TargetPrice: 'Giá Target',
    DuplicateID: 'DuplicateID',
    OriginQuantity: 'SL gốc',
    DateReturnEstimated: 'Ngày dự kiến về',
    TicketType: 'Loại phiếu',
    TicketTypeText: 'Loại phiếu',
    UnitCountID: 'Đơn vị tính',
    NoteMarketing: 'Ghi chú Marketing',
    FullNamePriceRequest: 'Kỹ thuật phụ trách',
    UnitNameNew: 'ĐVT mới',
    UnitPricetext: 'Đơn giá (text)',
    POKHDetailID: 'PO KH Detail',
    ProductGroupRTCID: 'Nhóm SP RTC',
    ProductRTCID: 'SP RTC',
    ProductCodeRTC: 'Mã RTC',
    ProjectPartlistPurchaseRequestTypeID: 'Loại yêu cầu',
    TotalHN: 'Tồn sử dụng HN',
    TotalHCM: 'Tồn sử dụng HCM',
    TotalHP: 'Tồn sử dụng HP',
    TotalDP: 'Tồn sử dụng DP',
    TotalBN: 'Tồn sử dụng BN',
    ParentProductCodePO: 'Mã cha',
    WarehouseID: 'Kho',
    IsPaidLater: 'Đợi trả sau',
  };

  // Cấu hình độ rộng cột (px)
  private COLUMN_WIDTH_CONFIG: Record<string, number> = {
    TotalPriceExchange: 200,
    ProductName: 165, // Giảm 1/4 từ 220 -> 165 (220 - 220/4 = 165)
    CustomerName: 60, // Giảm từ 240 xuống 60 (1/4)
    NameNCC: 100,
    TT: 30, // Giảm từ 60 xuống 30 (1/2, vì 60/4 = 15 quá nhỏ)
    ProjectCode: 60, // Giảm từ 120 xuống 60 (1/2, vì 120/4 = 30 quá nhỏ)
    ProductCode: 60, // Giảm từ 120 xuống 60 (1/2, vì 120/4 = 30 quá nhỏ)
    ProductNewCode: 100, // Giảm 1/6 từ 120 -> 100 (120 - 120/6 = 100)
    Quantity: 60, // Giảm 1/2 từ 120 -> 60 (120 - 120/2 = 60)
    ProductGroupID: 60, // Giảm 1/2 từ 120 -> 60 (120 - 120/2 = 60)
    UnitName: 60, // Giảm 1/2 từ 120 -> 60 (120 - 120/2 = 60)
    Manufacturer: 60, // Giảm 1/2 từ 120 -> 60 (120 - 120/2 = 60)
    StatusRequestText: 90, // Giảm 1/4 từ 120 -> 90 (120 - 120/4 = 90)
    FullName: 90, // Giảm 1/4 từ 120 -> 90 (120 - 120/4 = 90)
    UpdatedName: 90, // Giảm 1/4 từ 120 -> 90 (120 - 120/4 = 90)
  };

  // Thứ tự cột hiển thị theo VisibleIndex trong form WinForms
  private FORM_COLUMN_ORDER: string[] = [
    'IsApprovedTBP',
    'ApprovedTBPName',
    'DateApprovedTBP',
    'IsRequestApproved',
    'IsApprovedBGD',
    'TT',
    'CustomerName',
    'ProjectCode',
    'ProductCode',
    'ProductName',
    'ProductNewCode',
    'Quantity',
    'ProductGroupID',
    'UnitName',
    'WarehouseID',
    'Manufacturer',
    //'TicketTypeText',
    'StatusRequestText',
    'FullName',
    'UpdatedName',
    'DateRequest',
    'DateReturnExpected',
    'CurrencyID',
    'CurrencyRate',
    'UnitPricePOKH',
    'UnitPrice',
    'HistoryPrice',
    'TotalPriceHistory',
    'TotalPrice',
    'TotalPriceExchange',
    'VAT',
    'TotaMoneyVAT',
    'TargetPrice',
    'SupplierSaleID',
    'TotalDayLeadTime',
    'Note',
    'Model',
    'NotePartlist',
    'RequestDate',
    'ReasonCancel',
    'DeadlineDelivery',
    'DateReturnActual',
    'DateReceive',
    'IsImport',
    'UnitFactoryExportPrice',
    'UnitImportPrice',
    'TotalImportPrice',
    'LeadTime',
    'BillCode',
    'POKHCode',
    'ParentProductCodePO',
    'GuestCode',
    'StatusPOKHText',
    'SpecialCode',
    'FullNamePriceRequest',
    'TotalHN',
    'TotalHCM',
    'TotalHP',
    'TotalDP',
    'TotalBN',
    'IsPaidLater',
  ];
  //#endregion

  //#region Hàm format dữ liệu
  // Helpers: format number (en-US) & date (dd/MM/yyyy)
  private formatNumberEnUS(v: any, digits: number = 2): string {
    const n = Number(v);
    if (!isFinite(n)) return '';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  private formatDateDDMMYYYY(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const p2 = (n: number) => String(n).padStart(2, '0');
      return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  }
// ===== 1. Validate Manufacturer cho Vision =====
private validateManufacturerForVision(rows: any[]): boolean {
  const PRODUCT_GROUP_TVISION = 4;

  for (const row of rows) {
    const manufacturer = String(row.Manufacturer || '').trim();
    const productGroupID = Number(row.ProductGroupID || 0);
    const productSaleID = Number(row.ProductSaleID || 0);
    const productCode = String(row.ProductCode || '');
    const tt = String(row.TT || '');

    if (productSaleID <= 0) {
      if (!manufacturer && productGroupID === PRODUCT_GROUP_TVISION) {
        this.notify.error(
          NOTIFICATION_TITLE.error,
          `Yêu cầu mua hàng kho vision có mã sản phẩm ${productCode} ở vị trí ${tt} phải có hãng!`
        );
        return false;
      }
    }
  }

  return true;
}


  private toStartOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    // Format theo múi giờ local (GMT+7) thay vì UTC
    const year = x.getFullYear();
    const month = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private toEndOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    // Format theo múi giờ local (GMT+7) thay vì UTC
    const year = x.getFullYear();
    const month = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59`;
  }
  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {
    this.getRequestTypes();
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    // Khởi tạo bảng sau khi containers sẵn sàng và mỗi khi danh sách containers thay đổi
    this.containers.changes.subscribe(() => this.initTables());
    this.initTables();
  }
  //#endregion

  //#region Sự kiện tìm kiếm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onSearch() {
    if (!this.tabs || this.tabs.length === 0) return;
    this.isLoading = true;
    const filter = {
      DateStart: this.toStartOfDayISO(this.dateStart),
      DateEnd: this.toEndOfDayISO(this.dateEnd),
      StatusRequest: this.statusRequestFilter,
      ProjectID: this.projectIdFilter || 0,
      Keyword: this.keyword?.trim() || '',
      SupplierSaleID: this.supplierId || 0,
      IsApprovedTBP: this.isApprovedTBPFilter,
      IsApprovedBGD: this.isApprovedBGDFilter,
      IsCommercialProduct: -1,
      POKHID: this.pokhIdFilter || 0,
      ProductRTCID: -1,
      IsDeleted: this.isDeletedFilter,
      IsTechBought: -1,
      IsJobRequirement: -1,
      Page: 1,
      Size: 5000,
    };

    this.srv.getAll(filter).subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : res?.data || res || [];
        this.allData = data;

        // Lưu dữ liệu gốc vào Map để so sánh sau này
        this.originalDataMap.clear();
        data.forEach((item: any) => {
          if (item.ID) {
            this.originalDataMap.set(item.ID, { ...item }); // Deep copy
          }
        });

        // Tạo danh sách các DuplicateID
        this.duplicateIdList = [];
        data.forEach((item: any) => {
          const duplicateId = Number(item.DuplicateID || 0);
          if (duplicateId > 0 && !this.duplicateIdList.includes(duplicateId)) {
            this.duplicateIdList.push(duplicateId);
          }
        });

        // Phân loại dữ liệu theo logic WinForm
        this.dataByType.clear();

        this.tabs.forEach((t) => {
          let dt: any[] = [];
          const typeId = Number(t.id);

          // Lọc theo từng loại tab (tương ứng với logic WinForm)
          switch (typeId) {
            case 1:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 1
              );
              break;

            case 2:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 2
              );
              break;

            case 3:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 3
              );
              break;

            case 4:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 4
              );
              break;
            case 5:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 5
              );
              break;
            case 6:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 6
              );
              break;
            case 7:
              dt = data.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 7
              );
              break;

            default:
              break;
          }

          this.dataByType.set(t.id, dt);
          const countText = (dt?.length || 0).toLocaleString('vi-VN');
          t.title = `${t.title.split('(')[0].trim()} (${countText})`;
        });

        this.refreshAllTables();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', 'Không tải được dữ liệu');
      },
    });

    this.changedRows = [];
  }

  resetSearch() {
    this.dateStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.dateEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
    this.keyword = '';
    this.statusRequestFilter = 1;
    this.supplierSaleFilter = 0;
    this.isApprovedTBPFilter = -1;
    this.isApprovedBGDFilter = -1;
    this.isDeletedFilter = 0;
    this.onSearch();
  }
  //#endregion

  //#region Load các tab của bảng
  getRequestTypes() {
    this.srv.getRequestTypes().subscribe({
      next: (types: RequestType[]) => {
        this.requestTypes = types || [];
        this.tabs = (types || []).map((t) => ({ id: t.ID, title: t.RequestTypeName.toUpperCase() }));
        this.onSearch();
      },
      error: (err) => this.notify.error('Lỗi', 'Không tải được loại yêu cầu'),
    });
  }
  //#endregion

  //#region Load dữ liệu cho các tab
  private loadLookups() {
    this.srv.getCurrencies().subscribe({
      next: (res) => {
        this.currencies = res || [];
        this.updateEditorLookups();
      },
    });
    this.srv.getProductGroups().subscribe({
      next: (res) => {
        this.productGroups = res || [];
        this.updateEditorLookups();
      },
    });
    this.srv.getSupplierSales().subscribe({
      next: (res) => {
        this.supplierSales = res || [];
        this.updateEditorLookups();
      },
    });
    this.srv.getProjects().subscribe({
      next: (res) => {
        this.projects = res || [];
      },
    });
    this.srv.getPOKH().subscribe({
      next: (res) => {
        this.lstPOKH = res || [];
      },
    });
    this.srv.getWarehouses().subscribe({
      next: (res) => {
        this.lstWarehouses = res || [];
        this.updateEditorLookups();
      },
    });
    this.srv.getProductRTC().subscribe({
      next: (res) => {
        this.productRTC = res || [];
        this.updateEditorLookups();
      },
    });
  }

  private updateEditorLookups() {
    if (!this.tables || this.tables.length === 0) return;
    this.tables.forEach((t, index) => {
      if (!t) return;
      try {
        t.updateColumnDefinition('CurrencyID', {
          editorParams: { values: this.currencies.map((c) => ({ value: c.ID, label: c.Code })) },
        } as any);

        const tabIndex = index; // Lưu tabIndex vào closure

        t.updateColumnDefinition('ProductGroupID', {
          editorParams: (cell: any) => {
            const rowData = cell.getRow().getData();
            const ticketType = Number(rowData?.['TicketType'] || 0);
            const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;
            const isRTCTab = tabIndex === 2 || tabIndex === 3;

            // Nếu là mượn demo hoặc tab RTC: dùng productRTC, ngược lại dùng productGroups
            const productGroupData = (isBorrowDemo || isRTCTab) ? this.productRTC : this.productGroups;

            return {
              values: productGroupData.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
            };
          },
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const ticketType = Number(rowData?.['TicketType'] || 0);
            const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;

            // Đọc từ đúng field
            const id = isBorrowDemo ? (rowData?.['ProductGroupRTCID'] || 0) : (rowData?.['ProductGroupID'] || 0);
            if (!id || id === 0) return '';

            // Sử dụng productRTC cho mượn demo, ngược lại dựa trên tab index
            const productGroupDataForFormatter = isBorrowDemo || (tabIndex === 2 || tabIndex === 3)
              ? this.productRTC
              : this.productGroups;
            const g = productGroupDataForFormatter.find((x: any) => x.ID === id);
            return g?.ProductGroupName || '';
          },
        } as any);

        t.updateColumnDefinition('SupplierSaleID', {
          editorParams: { values: this.supplierSales.map((s) => ({ value: s.ID, label: s.NameNCC })) },
        } as any);
        t.updateColumnDefinition('WarehouseID', {
          editorParams: { values: this.lstWarehouses.map((w) => ({ value: w.ID, label: w.WarehouseCode })) },
        } as any);
      } catch { }
    });
  }
  //#endregion

  //#region Tạo bảng cho các tab
  private initTables() {
    if (!this.containers || this.containers.length === 0) return;
    // Tạo một bảng cho mỗi tab
    this.tables = this.containers.toArray().map((ref, idx) => {
      const table = new Tabulator(ref.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        height: '82vh',
        paginationMode: 'local',
        columns: this.buildColumns(idx),
        data: [],
        selectableRows: 'highlight',
        columnCalcs: 'both', // Hiển thị cả footer cho group và footer tổng cho toàn bảng
        groupBy: (data) => `Dự án: ${data.ProjectCode ?? ""} - ${data.ProjectName ?? ""}`,
        groupHeader: function (value, count, data, group) {
          return `${value} (${count})`; // Hiển thị: Dự án: ABC (5)
        },
        // Context menu cho dòng: thao tác theo ảnh WinForms
        rowContextMenu: () => !this.isYCMH ? this.buildRowContextMenu(idx) : [],
      });
      // Đăng ký sự kiện cellEdited sau khi khởi tạo để phù hợp typings
      table.on('cellEdited', (cell: CellComponent) => {
        this.onCellEdited(cell);

        const row = cell.getRow();
        const rowData = row.getData();
        const rowId = rowData['ID'];

        // Lấy dữ liệu gốc từ Map
        const originalData = this.originalDataMap.get(rowId);

        if (originalData) {
          // So sánh toàn bộ dòng hiện tại với dữ liệu gốc
          const hasChanges = this.hasRowChanged(rowData, originalData);

          // Tìm index của dòng trong changedRows
          const index = this.changedRows.findIndex(r => r.ID === rowId);

          if (hasChanges) {
            // Có thay đổi: thêm hoặc cập nhật trong changedRows
            const newRow = {
              ...rowData,
              IsMarketing: this.activeTabIndex === 7 || this.activeTabIndex === 1
            };

            if (index !== -1) {
              // Cập nhật dòng đã tồn tại
              this.changedRows[index] = newRow;
            } else {
              // Thêm dòng mới
              this.changedRows.push(newRow);
            }
          } else {
            // Không có thay đổi (đã revert về giá trị gốc): xóa khỏi changedRows
            if (index !== -1) {
              this.changedRows.splice(index, 1);
            }
          }
        }
      });
      // Gắn menu header cho toàn bộ cột sau khi bảng đã có columns
      this.applyHeaderMenus(table);
      return table;
    });
    // Sau khi khởi tạo, đổ dữ liệu lần đầu
    this.refreshAllTables();
  }

  private buildColumns(tabIndex: number = 0): ColumnDefinition[] {
    const columnsMap = new Map<string, ColumnDefinition>();

    this.FORM_COLUMN_ORDER.forEach((field) => {
      let visible = true;
      if (tabIndex === 3) {
        if (['IsRequestApproved', 'IsApprovedBGD', 'TT'].includes(field)) {
          visible = false;
        }
      } else {
        if (['IsApprovedTBP', 'ApprovedTBPName', 'DateApprovedTBP'].includes(field)) {
          visible = false;
        }
      }

      // Ẩn cột ProductGroupID cho mua hàng demo (sẽ hiện lại trong refreshTable nếu có dòng mượn hàng)
      if (field === 'ProductGroupID' && this.isPurchaseRequestDemo) {
        visible = false;
      }

      columnsMap.set(field, {
        field,
        title: this.CAPTION_MAP[field] || field,
        headerSort: false,
        width: 120,
        visible: visible,
        headerContextMenu: [] as any,
      } as ColumnDefinition);
    });

    ['ProjectCode', 'ProductCode', 'ProductName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.frozen = true;
        col.width = this.COLUMN_WIDTH_CONFIG[f] || (f === 'ProductName' ? 220 : 60);
        col.formatter = 'textarea';
        col.bottomCalc = 'count';
        col.bottomCalcFormatter = (cell: any) => cell.getValue(); // Hiển thị số lượng
      }
    });

    // Một số cột phổ biến ở trái
    ['IsApprovedTBP',
      'ApprovedTBPName',
      'DateApprovedTBP',
      'IsRequestApproved',
      'IsApprovedBGD',
      'TT',
      'CustomerName',
    ].forEach((f) => {
      const col = columnsMap.get(f);
      // Chỉ frozen nếu cột đang visible

      if (col) {
        col.frozen = true;
        // Áp dụng width từ config nếu có
        if (this.COLUMN_WIDTH_CONFIG[f]) {
          col.width = this.COLUMN_WIDTH_CONFIG[f];
        } else if (f === 'TT') {
          col.width = 30; // Giảm width cho cột TT
        } else if (f === 'CustomerName') {
          col.width = 60; // Giảm width cho cột CustomerName
        }
      }
    });

    ['ProductName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.frozen = false;
      }
    });

    // Áp dụng width từ COLUMN_WIDTH_CONFIG cho các cột được chỉ định
    ['ProductNewCode', 'Quantity', 'ProductGroupID', 'UnitName', 'Manufacturer', 
     'StatusRequestText', 'FullName', 'UpdatedName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col && this.COLUMN_WIDTH_CONFIG[f]) {
        col.width = this.COLUMN_WIDTH_CONFIG[f];
      }
    });

    // Editor numeric
    ['Quantity', 'UnitPrice', 'UnitImportPrice', 'VAT', 'TargetPrice', 'TotalDayLeadTime'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.editor = 'input';
        col.bottomCalc = 'sum';
        col.bottomCalcFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
        col.mutator = (value) => {
          const v = Number(value);
          return isNaN(v) ? 0 : v;
        };
      }
    });

    ['CurrencyRate'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.bottomCalc = 'sum';
        col.bottomCalcFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
        col.mutator = (value) => {
          const v = Number(value);
          return isNaN(v) ? 0 : v;
        };
      }
    });

    // Chỉ cho sửa Số lượng khi ID hoặc DuplicateID nằm trong duplicateIdList
    const qtyCol = columnsMap.get('Quantity');
    if (qtyCol) {
      (qtyCol as any).editable = (cell: any) => {
        const rd = cell.getRow?.().getData?.() || {};
        const currentId = Number(rd['ID'] || 0);
        const duplicateId = Number(rd['DuplicateID'] || 0);

        // Cho phép sửa nếu ID hoặc DuplicateID nằm trong duplicateIdList
        return this.duplicateIdList.includes(currentId) || this.duplicateIdList.includes(duplicateId);
      };
    }

    // Format money/price columns using en-US
    const moneyCols = [
      'UnitPrice',
      'TotalPrice',
      'TotalPriceExchange',
      'UnitImportPrice',
      'TotalImportPrice',
      'TotaMoneyVAT',
      'TotalPriceHistory',
      'TargetPrice',
      'HistoryPrice',
      'UnitFactoryExportPrice',
      'UnitPricePOKH',
      // tồn kho theo kho (số lượng dùng)
      'TotalHN', 'TotalHCM', 'TotalHP', 'TotalDP', 'TotalBN'
    ];
    moneyCols.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = (cell) => this.formatNumberEnUS(cell.getValue(), 2);
        col.hozAlign = 'right';
        (col as any).headerHozAlign = 'right';
      }
    });

    // Thêm bottomCalc cho các cột thành tiền
    ['TotalPrice', 'TotalPriceExchange', 'TotaMoneyVAT', 'TotalImportPrice', 'TotalPriceHistory'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.bottomCalc = 'sum';
        col.bottomCalcFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
      }
    });

    // Tăng độ rộng cột TotalPriceExchange
    const totalPriceExchangeCol = columnsMap.get('TotalPriceExchange');
    if (totalPriceExchangeCol) {
      totalPriceExchangeCol.width = this.COLUMN_WIDTH_CONFIG['TotalPriceExchange'] || 200;
    }

    // Format date columns to dd/MM/yyyy
    const dateCols = [
      'DateRequest',
      'DateReturnExpected',
      'RequestDate',
      'DeadlineDelivery',
      'DateReturnActual',
      'DateReceive',
      'DateApprovedTBP',
      'DateApprovedBGD',
      'DateReturnEstimated',
    ];
    dateCols.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = (cell) => this.formatDateDDMMYYYY(cell.getValue());
        col.hozAlign = 'center';
        (col as any).headerHozAlign = 'center';
      }
    });

    // Widen text columns: Khách hàng & Nhà cung cấp
    ['CustomerName', 'NameNCC'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        const currentWidth = typeof col.width === 'number' ? col.width : Number(col.width) || 0;
        col.width = Math.max(currentWidth, this.COLUMN_WIDTH_CONFIG[f] || 240);
        col.hozAlign = 'left';
        col.headerWordWrap = true;
        col.formatter = 'textarea';
        (col as any).headerHozAlign = 'center';
      }
    });

    // Widen name-related columns (nhân viên, duyệt)
    ['FullName', 'UpdatedName', 'ApprovedTBPName', 'ApprovedBGDName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        const currentWidth = typeof col.width === 'number' ? col.width : Number(col.width) || 0;
        col.width = Math.max(currentWidth, 120);
        col.hozAlign = 'left';
        (col as any).headerHozAlign = 'center';
      }
    });

    // Widen SupplierSaleID (hiển thị tên NCC qua formatter)
    const supplierIdCol = columnsMap.get('SupplierSaleID');
    if (supplierIdCol) {
      const currentWidth = typeof supplierIdCol.width === 'number' ? supplierIdCol.width : Number(supplierIdCol.width) || 0;
      supplierIdCol.width = 400;
      supplierIdCol.hozAlign = 'left';
      (supplierIdCol as any).headerHozAlign = 'center';
    }

    // Đảm bảo các cột tồn kho TotalHN/HCM/HP/DP/BN luôn hiển thị và căn phải
    ['TotalHN', 'TotalHCM', 'TotalHP', 'TotalDP', 'TotalBN'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        (col as any).visible = true;
        col.hozAlign = 'right';
        (col as any).headerHozAlign = 'right';
        const currentWidth = typeof col.width === 'number' ? col.width : Number(col.width) || 0;
        col.width = Math.max(currentWidth, 120);
      }
    });

    // Use textarea formatter for note-like columns
    ['Note', 'ReasonCancel', 'NotePartlist', 'NoteMarketing'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = 'textarea';
        const currentWidth = typeof col.width === 'number' ? col.width : Number(col.width) || 0;
        col.width = Math.max(currentWidth, 220);
        col.hozAlign = 'left';
        (col as any).headerHozAlign = 'center';
      }
    });

    ['Note'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.editor = 'textarea';
      }
    });

    // Boolean fields: chỉ hiển thị checkbox, KHÔNG cho edit/toggle
    const boolExclude = new Set<string>(['IsApprovedBGDText']);
    const boolCandidates = this.FORM_COLUMN_ORDER
      .filter((f: string) => f.startsWith('Is') && f !== 'IsPaidLater')
      .filter((f: string) => !boolExclude.has(f))
      .concat(['IsImport', 'IsStock']);
    boolCandidates.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.width = 60;
        col.formatter = function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
        },
          col.hozAlign = 'center';
        (col as any).headerHozAlign = 'center';
        // khóa chỉnh sửa
        (col as any).editable = false;
        delete (col as any).cellClick;
        delete (col as any).editor;
      }
    });

    ['IsPaidLater'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.width = 60;
        col.formatter = function (cell: any) {
          const value = cell.getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color: #1677ff; cursor: pointer;" />`;
        };
        col.hozAlign = 'center';
        (col as any).headerHozAlign = 'center';

        // Cho phép click để toggle giá trị
        (col as any).cellClick = (e: any, cell: any) => {
          const currentValue = cell.getValue();
          const newValue = !currentValue;
          cell.setValue(newValue);
        };
      }
    });

    // Căn phải cho các cột: Số lượng, VAT, Tỷ giá, Đơn giá xuất xưởng
    ['Quantity', 'VAT', 'CurrencyRate', 'UnitFactoryExportPrice'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.hozAlign = 'right';
        (col as any).headerHozAlign = 'right';
      }
    });

    // Thêm formatter định dạng số cho VAT và TotalDayLeadTime
    ['VAT', 'TotalDayLeadTime', 'CurrencyRate', 'UnitPricePOKH'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = (cell) => this.formatNumberEnUS(cell.getValue(), 2);
      }
    });

    // Editor list: CurrencyID, ProductGroupID, SupplierSaleID
    const currencyCol = columnsMap.get('CurrencyID');
    if (currencyCol) {
      currencyCol.editor = 'list';
      currencyCol.editorParams = {
        values: this.currencies.map((c) => ({ value: c.ID, label: c.Code })),
      };
      currencyCol.formatter = (cell) => {
        const id = cell.getValue();
        const cur = this.currencies.find((c) => c.ID === id);
        return cur?.Code || '';
      };
    }

    const pgCol = columnsMap.get('ProductGroupID');
    if (pgCol) {
      // Accessor để đọc giá trị từ đúng field dựa trên loại request
      (pgCol as any).accessor = (value: any, data: any, type: string, params: any, column: any) => {
        const ticketType = Number(data?.['TicketType'] || 0);
        const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;
        // Nếu là mượn demo: đọc từ ProductGroupRTCID, ngược lại đọc từ ProductGroupID
        return isBorrowDemo ? (data?.['ProductGroupRTCID'] || 0) : (data?.['ProductGroupID'] || 0);
      };

      // Mutator để ghi vào đúng field
      (pgCol as any).mutator = (value: any, data: any, type: string, params: any, column: any) => {
        const ticketType = Number(data?.['TicketType'] || 0);
        const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;
        // Nếu là mượn demo: ghi vào ProductGroupRTCID, ngược lại ghi vào ProductGroupID
        if (isBorrowDemo) {
          data['ProductGroupRTCID'] = value;
        } else {
          data['ProductGroupID'] = value;
        }
        return value;
      };

      // Editor params động dựa trên từng dòng
      pgCol.editor = 'list';
      (pgCol.editorParams as any) = (cell: any) => {
        const rowData = cell.getRow().getData();
        const ticketType = Number(rowData?.['TicketType'] || 0);
        const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;
        const isRTCTab = tabIndex === 2 || tabIndex === 3;

        // Nếu là mượn demo hoặc tab RTC: dùng productRTC, ngược lại dùng productGroups
        const productGroupData = (isBorrowDemo || isRTCTab) ? this.productRTC : this.productGroups;

        return {
          values: productGroupData.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
        };
      };
      pgCol.formatter = (cell) => {
        const rowData = cell.getRow().getData();
        const ticketType = Number(rowData?.['TicketType'] || 0);
        const isBorrowDemo = this.isPurchaseRequestDemo && ticketType === 1;

        // Đọc từ đúng field
        const id = isBorrowDemo ? (rowData?.['ProductGroupRTCID'] || 0) : (rowData?.['ProductGroupID'] || 0);
        if (!id || id === 0) return '';

        // Sử dụng productRTC cho mượn demo, ngược lại dựa trên tab index
        const productGroupDataForFormatter = isBorrowDemo || (tabIndex === 2 || tabIndex === 3)
          ? this.productRTC
          : this.productGroups;
        const g = productGroupDataForFormatter.find((x: any) => x.ID === id);
        return g?.ProductGroupName || '';
      };
    }

    const supCol = columnsMap.get('SupplierSaleID');
    if (supCol) {
      supCol.editor = 'list';
      supCol.editorParams = {
        values: this.supplierSales.map((s) => ({ value: s.ID, label: s.NameNCC })),
      };
      supCol.formatter = (cell) => {
        const id = cell.getValue();
        const s = this.supplierSales.find((x) => x.ID === id);
        return s?.NameNCC || '';
      };
    }

    const warehouseCol = columnsMap.get('WarehouseID');
    if (warehouseCol) {
      warehouseCol.editor = 'list';
      warehouseCol.editorParams = {
        values: this.lstWarehouses.map((w) => ({ value: w.ID, label: w.WarehouseCode })),
      };
      warehouseCol.formatter = (cell) => {
        const id = cell.getValue();
        const w = this.lstWarehouses.find((x) => x.ID === id);
        return w?.WarehouseCode || '';
      };
    }

    // Tính tổng ở footer
    ['TotalBillImport', 'TotalPrice', 'TotalPriceExchange', 'TotalImportPrice', 'TotaMoneyVAT', 'UnitFactoryExportPrice', 'TotalHN', 'TotalHCM', 'TotalHP', 'TotalDP', 'TotalBN'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.bottomCalc = 'sum';
        col.bottomCalcFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
      }
    });
    ['UnitPrice', 'UnitImportPrice'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.editor = 'input';

        // ✅ Chỉ cho sửa nếu KHÔNG phải hàng mượn
        (col as any).editable = (cell: any) => {
          const rd = cell.getRow?.().getData?.() || {};
          const ticketType = Number(rd['TicketType'] || 0);
          return ticketType !== 1; // Không cho sửa nếu là mượn (TicketType = 1)
        };

        col.bottomCalc = 'sum';
        col.bottomCalcFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
        col.mutator = (value) => {
          const v = Number(value);
          return isNaN(v) ? 0 : v;
        };
      }
    });

    // Sắp xếp theo FORM_COLUMN_ORDER, các cột còn lại ẩn và đặt sau
    // Thêm tooltip cho tất cả các cột
    columnsMap.forEach((col, field) => {
      if (col && !(col as any).tooltip) {
        (col as any).tooltip = (cell: any) => {
          const value = cell.getValue();
          if (value === null || value === undefined || value === '') {
            return '';
          }
          // Chuyển đổi giá trị thành string để hiển thị
          return String(value);
        };
      }
    });

    const ordered: ColumnDefinition[] = [];
    this.FORM_COLUMN_ORDER.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) ordered.push(col);
    });

    return ordered;
  }

  // Menu chuột phải trên dòng (theo ảnh WinForms)
  private buildRowContextMenu(idx: number): any[] {
    // Kiểm tra quyền N35 và N1
    const hasN35Permission = this.permissionService.hasPermission('N35');
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN35OrN1 = hasN35Permission || hasN1Permission;

    const menuItems: any[] = [];

    // Xuất Excel - luôn hiển thị
    menuItems.push({
      label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_export_excel_24.svg" />Xuất Excel',
      menu: [
        {
          label: 'Xuất SP chọn',
          action: () => this.exportExcel(idx, false)
        },
        {
          label: 'Xuất tất cả',
          action: () => this.exportExcel(idx, true)
        }
      ]
    });

    // Duplicate - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_copy_24.svg" />Duplicate',
        action: () => this.duplicateRow(idx)
      });
    }

    // Lịch sử hỏi giá - luôn hiển thị
    menuItems.push({
      label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_history_24.svg" />Lịch sử hỏi giá',
      action: () => this.onHistoryPrice(idx)
    });

    // Hàng nhập khẩu - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_check_24.svg" />Hàng nhập khẩu',
        action: () => this.updateProductImport(idx, true)
      });

      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_cancle_24.svg" />Hủy hàng nhập khẩu',
        action: () => this.updateProductImport(idx, false)
      });
    }

    // Yêu cầu duyệt mua - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_check_24.svg" />Yêu cầu duyệt mua',
        action: () => this.onRequestApproved(idx, true)
      });

      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_cancle_24.svg" />Hủy yêu cầu duyệt mua',
        action: () => this.onRequestApproved(idx, false)
      });
    }

    // Separator nếu có ít nhất một item phía trên và phía dưới
    if (menuItems.length > 0) {
      menuItems.push({ separator: true });
    }

    // Giữ hàng - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_check_24.svg" />Giữ hàng',
        action: () => this.onKeepProduct(idx)
      });
    }

    // Cập nhật mã nội bộ - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1 && idx === 3) {
      menuItems.push({
        label: '<img class="btn-action-icon pt-0 ps-0" src="assets/icon/action_reset_24.svg" />Cập nhật mã nội bộ',
        action: () => this.updateInternalCode(idx),
        disabled: function (component: any) {
          return idx !== 3;
        },
      });
    }

    return menuItems;
  }
  //#endregion

  //#region Hàm helper
  // Hàm kiểm tra xem dòng có thay đổi so với dữ liệu gốc hay không
  private hasRowChanged(currentData: any, originalData: any): boolean {
    // Danh sách các trường có thể chỉnh sửa (editable fields)
    const editableFields = [
      'Quantity', 'UnitPrice', 'UnitImportPrice', 'VAT', 'TargetPrice',
      'CurrencyID', 'ProductGroupID', 'SupplierSaleID', 'WarehouseID', 'Note',
      'CurrencyRate', 'UnitMoney', 'IsPaidLater'
    ];

    // So sánh từng trường
    for (const field of editableFields) {
      const currentValue = currentData[field];
      const originalValue = originalData[field];

      // So sánh giá trị (xử lý cả null, undefined, và số)
      if (this.normalizeValue(currentValue) !== this.normalizeValue(originalValue)) {
        return true; // Có thay đổi
      }
    }

    return false; // Không có thay đổi
  }

  // Hàm chuẩn hóa giá trị để so sánh
  private normalizeValue(value: any): any {
    // Nếu là null hoặc undefined, trả về null
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Nếu là số, chuyển về dạng số để so sánh
    if (typeof value === 'number' || !isNaN(Number(value))) {
      return Number(value);
    }

    // Các giá trị khác giữ nguyên
    return value;
  }

  //#endregion

  //#region Sự kiện cell edited
  private onCellEdited(cell: CellComponent): void {
    const row = cell.getRow();
    const data = row.getData() as any;
    const field = (cell as any).getField ? (cell as any).getField() : '';
    const newValue = cell.getValue();

    // Lấy table hiện tại
    const table = this.tables?.[this.activeTabIndex];
    // Kiểm tra xem có dòng nào được chọn không
    const selectedRows = table?.getSelectedRows() || [];
    const hasSelectedRows = selectedRows.length > 0;

    // Kiểm tra xem dòng đang được edit có nằm trong danh sách các dòng được chọn không
    const currentRowId = data['ID'];
    const isCurrentRowSelected = hasSelectedRows && selectedRows.some((selectedRow: any) => {
      return selectedRow.getData()['ID'] === currentRowId;
    });

    // Chỉ cập nhật các dòng được chọn nếu dòng đang edit cũng nằm trong danh sách được chọn
    if (hasSelectedRows && isCurrentRowSelected) {
      // Cập nhật tất cả các dòng đã chọn với giá trị mới (trừ dòng đang edit)
      selectedRows.forEach((selectedRow: any) => {
        const rowData = selectedRow.getData();
        const selectedRowId = rowData['ID'];

        // Bỏ qua dòng đang được edit (vì nó đã được Tabulator tự động cập nhật)
        if (selectedRowId === currentRowId) {
          return;
        }

        const oldValue = rowData[field];

        // Chỉ cập nhật nếu giá trị thực sự thay đổi
        if (this.normalizeValue(oldValue) !== this.normalizeValue(newValue)) {
          const updateData: any = {};
          updateData[field] = newValue;
          selectedRow.update(updateData);

          // Track edited cho từng dòng
          const rowId = Number(selectedRow.getData()['ID']);
          if (rowId > 0) this.editedMap.set(rowId, selectedRow.getData());
        }
      });

      // Tính toán lại cho TẤT CẢ các dòng được chọn (bao gồm cả dòng đang edit)
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'CurrencyID'].includes(field)) {
        selectedRows.forEach((selectedRow: any) => {
          this.recalculateRow(selectedRow);
        });
      }

      // Track TẤT CẢ các dòng được chọn vào changedRows
      selectedRows.forEach((selectedRow: any) => {
        const rowData = selectedRow.getData();
        const rowId = rowData['ID'];
        const originalData = this.originalDataMap.get(rowId);

        if (originalData) {
          const hasChanges = this.hasRowChanged(rowData, originalData);
          const index = this.changedRows.findIndex(r => r.ID === rowId);

          if (hasChanges) {
            const newRow = {
              ...rowData,
              IsMarketing: this.activeTabIndex === 7 || this.activeTabIndex === 1
            };

            if (index !== -1) {
              this.changedRows[index] = newRow;
            } else {
              this.changedRows.push(newRow);
            }
          } else {
            if (index !== -1) {
              this.changedRows.splice(index, 1);
            }
          }
        }
      });

      // Track dòng đang edit vào changedRows
      const originalData = this.originalDataMap.get(currentRowId);
      if (originalData) {
        const hasChanges = this.hasRowChanged(row.getData(), originalData);
        const index = this.changedRows.findIndex(r => r.ID === currentRowId);

        if (hasChanges) {
          const newRow = {
            ...row.getData(),
            IsMarketing: this.activeTabIndex === 7 || this.activeTabIndex === 1
          };

          if (index !== -1) {
            this.changedRows[index] = newRow;
          } else {
            this.changedRows.push(newRow);
          }
        } else {
          if (index !== -1) {
            this.changedRows.splice(index, 1);
          }
        }
      }

      // Track dòng đang edit vào editedMap
      const id = Number(data['ID']);
      if (id > 0) this.editedMap.set(id, row.getData());
    } else {
      // Logic cho trường hợp không có dòng nào được chọn HOẶC dòng đang edit không nằm trong danh sách được chọn
      // Tính toán lại cho dòng đang edit
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'CurrencyID'].includes(field)) {
        this.recalculateRow(row);
      }

      // Track edited
      const id = Number(data['ID']);
      if (id > 0) this.editedMap.set(id, row.getData());

      // Track vào changedRows
      const originalData = this.originalDataMap.get(id);
      if (originalData) {
        const hasChanges = this.hasRowChanged(row.getData(), originalData);
        const index = this.changedRows.findIndex(r => r.ID === id);

        if (hasChanges) {
          const newRow = {
            ...row.getData(),
            IsMarketing: this.activeTabIndex === 7 || this.activeTabIndex === 1
          };

          if (index !== -1) {
            this.changedRows[index] = newRow;
          } else {
            this.changedRows.push(newRow);
          }
        } else {
          if (index !== -1) {
            this.changedRows.splice(index, 1);
          }
        }
      }
    }
  }

  // Helper function để tính lại các giá trị của một dòng
  private recalculateRow(row: any): void {
    const data = row.getData() as any;
    const field = (row as any).getField ? (row as any).getField() : '';

    // Recalc totals similar to WinForms code
    const quantity = Number(data['Quantity']) || 0;
    const unitPrice = Number(data['UnitPrice']) || 0;
    const currencyRate = Number(data['CurrencyRate']) || 0;
    const unitImportPrice = Number(data['UnitImportPrice']) || 0;
    const vat = Number(data['VAT']) || 0;

    const totalPrice = quantity * unitPrice;
    const totalPriceExchange = totalPrice * currencyRate;
    const totalImportPrice = unitImportPrice * quantity;
    const totaMoneyVAT = totalPrice + (totalPrice * vat) / 100;

    row.update({
      TotalPrice: totalPrice,
      TotalPriceExchange: totalPriceExchange,
      TotalImportPrice: totalImportPrice,
      TotaMoneyVAT: totaMoneyVAT,
    });

    // Nếu đổi CurrencyID thì cập nhật CurrencyRate, đơn vị tiền và re-calc
    if (data['CurrencyID']) {
      const id = Number(data['CurrencyID']) || 0;
      const cur = this.currencies.find((c) => Number(c.ID) === id);
      if (cur) {
        let rate = Number(cur.CurrencyRate) || 0;
        try {
          const today = new Date();
          const ds = (cur as any).DateStart ? new Date((cur as any).DateStart) : null;
          const de = (cur as any).DateExpried ? new Date((cur as any).DateExpried) : null;
          const isExpired = (de && de < today) || (ds && ds > today);
          const code = (cur['Code'] || '').toLowerCase();
          if (isExpired && code !== 'vnd') rate = 0;
        } catch { }
        row.update({ CurrencyRate: rate, UnitMoney: cur['Code'] });
      }
    }
  }
  //#endregion

  //#region Cấu hình bảng
  private applyHeaderMenus(table: any): void {
    try {
      const items = this.buildColumnHeaderMenu(table);
      const cols = (table.getColumns?.() || []) as any[];
      cols.forEach((c: any) => {
        const field = c.getField?.();
        if (!field) return;
        // Gắn nút "ba chấm" ở header để mở menu ẩn/hiện cột
        table.updateColumnDefinition(field, { headerMenu: items } as any);
      });
    } catch { }
  }

  // Tạo menu ẩn/hiện cột cho tất cả header
  private buildColumnHeaderMenu(table?: any): any[] {
    const items: any[] = [];
    try {
      const allCols = (table?.getColumns?.() || this.tables?.[0]?.getColumns?.() || []) as any[];
      allCols.forEach((col: any) => {
        const title = col.getDefinition?.().title || col.getField?.();
        const wrapper = document.createElement('div');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = col.isVisible?.() || false;
        const label = document.createElement('span');
        label.textContent = ' ' + (title || col.getField?.());
        wrapper.appendChild(cb);
        wrapper.appendChild(label);
        cb.addEventListener('change', () => {
          if (cb.checked) col.show?.();
          else col.hide?.();
        });
        items.push({ label: wrapper });
      });
    } catch { }
    return items;
  }

  private refreshAllTables() {
    this.tabs.forEach((_, idx) => this.refreshTable(idx));
  }

  private refreshTable(idx: number) {
    const tab = this.tabs[idx];
    const table = this.tables?.[idx];
    if (!tab || !table) return;
    const data = this.dataByType.get(tab.id) || [];

    // Kiểm tra và ẩn/hiện cột ProductGroupID cho mua hàng demo
    if (this.isPurchaseRequestDemo) {
      try {
        const pgCol = table.getColumn('ProductGroupID');
        if (pgCol) {
          let shouldShow = false;

          if (data.length > 0) {
            // Kiểm tra xem có dòng nào là mượn hàng (TicketType = 1) không
            const hasBorrowRow = data.some((row: any) => {
              const ticketType = Number(row.TicketType || 0);
              return ticketType === 1; // 1 = mượn
            });

            // Chỉ hiện cột nếu có ít nhất một dòng mượn hàng
            shouldShow = hasBorrowRow;
          }

          // Sử dụng setVisible để đảm bảo cột được ẩn/hiện đúng
          if (shouldShow) {
            pgCol.show();
          } else {
            pgCol.hide();
          }
        }
      } catch (e) {
        // Ignore nếu cột chưa được khởi tạo
      }
    }

    // Use try-catch to handle table initialization timing
    try {
      table.setData(data);
      // Tự động chọn lại các dòng đã lưu nếu đúng tab
      if (this.selectedRowIds.length > 0 && this.selectedTabIndex === idx) {
        this.restoreSelectedRows(idx);
      }
    } catch (error) {
      table.on('tableBuilt', () => {
        table.setData(data);
        // Tự động chọn lại các dòng đã lưu nếu đúng tab
        if (this.selectedRowIds.length > 0 && this.selectedTabIndex === idx) {
          this.restoreSelectedRows(idx);
        }
      });
    }
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    // Cập nhật editor lookups khi chuyển tab để đảm bảo formatter đúng
    this.updateEditorLookups();
    // cập nhật dữ liệu hiển thị
    this.refreshTable(index);
  }
  //#endregion

  //#region Chức năng Check Order (Kiểm tra đơn hàng)
  private getSelectedRowsData(idx: number): any[] {
    const table = this.tables?.[idx];
    if (!table) return [];
    return (table.getSelectedData() as any[]) || [];
  }

  private restoreSelectedRows(idx: number): void {
    const table = this.tables?.[idx];
    if (!table || this.selectedRowIds.length === 0) return;

    // Đợi một chút để table render xong
    setTimeout(() => {
      try {
        // Lấy tất cả các rows trong table
        const rows = table.getRows();

        // Chọn lại các dòng có ID trong danh sách selectedRowIds
        rows.forEach((row: any) => {
          const rowData = row.getData();
          if (this.selectedRowIds.includes(rowData.ID)) {
            row.select();
          }
        });

        // Xóa danh sách sau khi đã chọn lại
        this.selectedRowIds = [];
        this.selectedTabIndex = -1;
      } catch (error) {
        console.error('Error restoring selected rows:', error);
      }
    }, 100);
  }

  onCheckOrder(idx: number, status: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    let textStatus = status ? "check" : "hủy check";
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        // Lưu lại các ID đã chọn và tab index trước khi gọi API
        this.selectedRowIds = rows.map(r => r.ID);
        this.selectedTabIndex = idx;

        const payload = rows.map(r => r.ID);
        this.srv.checkOrder(payload, status).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            // Xóa selectedRowIds nếu có lỗi
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
      },
    });
  }
  //#endregion

  //#region Chức năng Request Approved (Yêu cầu duyệt mua)
  onRequestApproved(idx: number, status: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    let textStatus = status ? "Y/C duyệt mua" : "hủy Y/C duyệt mua";
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }
    this.selectedRowIds = rows.map(r => r.ID);
    this.selectedTabIndex = idx;

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.requestApproved(rows, status).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
      },
    });
  }
  //#endregion

  //#region Chức năng Complete Request (Hoàn thành yêu cầu)
  onCompleteRequest(idx: number, status: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    let textStatus = status == 7 ? "hoàn thành" : "hủy hoàn thành";
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }

    this.selectedRowIds = rows.map(r => r.ID);
    this.selectedTabIndex = idx;

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.completeRequest(rows, status).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
      },
    });
  }
  //#endregion

  //#region Chức năng Approved (Duyệt)
  onApproved(idx: number, status: boolean, type: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    let textStatus = status ? "duyệt" : "hủy duyệt";
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }
    this.selectedRowIds = rows.map(r => r.ID);
    this.selectedTabIndex = idx;

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.approved(rows, status, type).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
      },
    });
  }
  //#endregion

  //#region Chức năng Supplier Sale (Nhà cung cấp)
  onAddSupplierSale() {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0;
    modalRef.result.finally(() => {
      this.srv.getSupplierSales().subscribe({
        next: (res) => {
          this.supplierSales = res || [];
          this.updateEditorLookups();
        },
      });
    });
  }
  //#endregion

  //#region Chức năng Export Excel
  async exportExcel(idx: number, status: boolean) {
    let data = [];
    const table = this.tables?.[idx];
    if (status) data = table.getData();
    else data = this.getSelectedRowsData(idx);

    if (data == null || data.length <= 0) {
      if (status) {
        this.notify.error(NOTIFICATION_TITLE.error, "Không có dữ liệu để xuất excel!");
        return;
      } else {
        this.notify.error(NOTIFICATION_TITLE.error, "Vui lòng chọn sản phẩm cần xuất excel!");
        return;
      }
    }

    let title = this.tabs[idx].title;
    let date = DateTime.fromJSDate(new Date()).toFormat("ddMMyy");
    let fileName = `YeuCauMua_${title}${status ? "_All" : ""}_${date}`;

    // Gọi hàm xuất Excel mới với group và footer
    await this.exportExcelWithGroupAndFooter(table, data, title, fileName);
  }

  /**
   * Hàm xuất Excel với group theo ProjectCode và footer tổng số lượng và tiền
   */
  private async exportExcelWithGroupAndFooter(
    table: any,
    data: any[],
    sheetName: string,
    fileName: string
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Lấy danh sách cột hiển thị (bỏ cột checkbox)
    const columns = table.getColumns();
    const visibleColumns = columns
      .map((col: any) => col.getDefinition())
      .filter((def: any) => def.formatter !== "rowSelection");

    const headers = visibleColumns.map((def: any) => def.title);

    // Thêm header row - màu xám nhạt
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Phát hiện các cột cần tính tổng từ bottomCalc
    const sumFields: string[] = [];
    const countFields: string[] = [];
    visibleColumns.forEach((col: any) => {
      if (col.bottomCalc === 'sum') {
        sumFields.push(col.field);
      } else if (col.bottomCalc === 'count') {
        countFields.push(col.field);
      }
    });

    // Group dữ liệu theo ProjectCode
    const groupedData = new Map<string, any[]>();
    data.forEach((row: any) => {
      const projectCode = row['ProjectCode'] || '';
      const projectName = row['ProjectName'] || '';
      const groupKey = `${projectCode} - ${projectName}`;

      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, []);
      }
      groupedData.get(groupKey)?.push(row);
    });

    // Duyệt qua từng nhóm và ghi dữ liệu
    groupedData.forEach((rows, groupName) => {
      // Thêm dòng tiêu đề nhóm
      const groupRow = worksheet.addRow([groupName]);
      const groupRowIndex = groupRow.number;

      worksheet.mergeCells(`A${groupRowIndex}:${this.getColumnLetter(headers.length)}${groupRowIndex}`);

      groupRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
      groupRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      groupRow.alignment = { vertical: 'middle', horizontal: 'left' };
      groupRow.height = 22;

      // Khởi tạo biến tổng
      const totals: any = {};
      sumFields.forEach(field => totals[field] = 0);
      countFields.forEach(field => totals[field] = 0);

      // Ghi dữ liệu
      rows.forEach((row: any) => {
        const rowData = visibleColumns.map((col: any) => {
          const field = col.field;
          let value = row[field];

          // Tính tổng
          if (sumFields.includes(field) && value) {
            totals[field] += Number(value) || 0;
          }
          if (countFields.includes(field)) {
            totals[field] += 1;
          }

          // Chuyển ID thành text
          if (field === 'CurrencyID') {
            const cur = this.currencies.find((c) => c.ID === value);
            return cur?.Code || '';
          }
          if (field === 'ProductGroupID') {
            const isRTCTab = this.activeTabIndex === 2 || this.activeTabIndex === 3;
            const productGroupData = isRTCTab ? this.productRTC : this.productGroups;
            const g = productGroupData.find((x) => x.ID === value);
            return g?.ProductGroupName || '';
          }
          if (field === 'SupplierSaleID') {
            const s = this.supplierSales.find((x) => x.ID === value);
            return s?.NameNCC || '';
          }
          if (field === 'WarehouseID') {
            const w = this.lstWarehouses.find((x) => x.ID === value);
            return w?.WarehouseCode || '';
          }

          if (typeof value === 'boolean') {
            return value ? '☑' : '☐';
          }

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }

          return value;
        });

        const dataRow = worksheet.addRow(rowData);
        dataRow.alignment = { vertical: 'middle', wrapText: true };

        dataRow.eachCell((cell, colNumber) => {
          const field = visibleColumns[colNumber - 1]?.field;

          if (sumFields.includes(field)) {
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          }

          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      });

      // Footer
      const footerData = visibleColumns.map((col: any) => {
        const field = col.field;

        if (sumFields.includes(field) || countFields.includes(field)) {
          return totals[field];
        }

        if (field === visibleColumns[0].field) {
          return `${rows.length} sản phẩm`;
        }

        return '';
      });

      const footerRow = worksheet.addRow(footerData);
      footerRow.font = { bold: true, color: { argb: 'FF000000' } };
      footerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
      };
      footerRow.alignment = { vertical: 'middle', horizontal: 'right' };
      footerRow.height = 22;

      footerRow.eachCell((cell, colNumber) => {
        const field = visibleColumns[colNumber - 1]?.field;
        if (sumFields.includes(field)) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }
      });

      worksheet.addRow([]);
    });

    // Thêm dòng TỔNG CỘNG cho toàn bộ bảng
    const grandTotals: any = {};
    sumFields.forEach(field => grandTotals[field] = 0);
    countFields.forEach(field => grandTotals[field] = 0);

    // Tính tổng toàn bộ từ data gốc
    data.forEach((row: any) => {
      sumFields.forEach(field => {
        if (row[field]) {
          grandTotals[field] += Number(row[field]) || 0;
        }
      });
      countFields.forEach(field => {
        grandTotals[field] += 1;
      });
    });

    const grandTotalData = visibleColumns.map((col: any) => {
      const field = col.field;

      if (sumFields.includes(field) || countFields.includes(field)) {
        return grandTotals[field];
      }

      if (field === visibleColumns[0].field) {
        return `${data.length} sản phẩm`;
      }

      return '';
    });

    const grandTotalRow = worksheet.addRow(grandTotalData);
    grandTotalRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    grandTotalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Màu xanh đậm để phân biệt
    };
    grandTotalRow.alignment = { vertical: 'middle', horizontal: 'right' };
    grandTotalRow.height = 25;

    grandTotalRow.eachCell((cell, colNumber) => {
      const field = visibleColumns[colNumber - 1]?.field;
      if (sumFields.includes(field)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      }
    });

    // Độ rộng cột
    worksheet.columns.forEach((column: any, colIndex: number) => {
      const field = visibleColumns[colIndex]?.field;

      if (field === 'ProductCode') column.width = 15;
      else if (field === 'ProductName' || field === 'ProjectName') column.width = 35;
      else if (field === 'CustomerName' || field === 'NameNCC') column.width = 30;
      else if (field === 'SupplierSaleID') column.width = 40;
      else if (sumFields.includes(field)) column.width = 18;
      else if (field === 'Quantity') column.width = 12;
      else if (field?.includes('Date')) column.width = 15;
      else if (field?.includes('Status') || field?.includes('Text')) column.width = 20;
      else if (field === 'Note' || field === 'Model') column.width = 30;
      else column.width = 15;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  /**
   * Helper function để chuyển số cột thành chữ cái (A, B, C, ..., Z, AA, AB, ...)
   */
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }
  //#endregion

  //#region Chức năng Save Data (Lưu dữ liệu)
  async onSaveData(idx: number) {
    if (this.changedRows.length <= 0 || this.changedRows == null) {
      this.notify.warning(NOTIFICATION_TITLE.warning, "Không có dữ liệu thay đổi!");
      return;
    }
    this.selectedRowIds = this.changedRows.map(r => r.ID);
    this.selectedTabIndex = idx;

    // Lấy danh sách các dòng cần lưu (bao gồm cả các dòng duplicate liên quan)
    const dataToSave = this.getDataToSave();

    this.modal.confirm({
      nzTitle: `Bạn có muốn lưu các thay đổi không?`,
      nzOkText: 'Lưu',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;

        this.srv.saveData(dataToSave).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.changedRows = [];
            this.isLoading = false;
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            this.isLoading = false;
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
      },
    });

  }
  //#endregion

  //#region Hàm xử lý lưu dữ liệu
  // Hàm lấy dữ liệu cần lưu (bao gồm các dòng duplicate liên quan)
  private getDataToSave(): any[] {
    const result: any[] = [];
    const addedIds = new Set<number>(); // Theo dõi các ID đã thêm để tránh trùng lặp

    // Duyệt qua từng dòng đã thay đổi
    this.changedRows.forEach(changedRow => {
      const rowId = changedRow.ID;
      const duplicateId = changedRow.DuplicateID;

      // Thêm dòng hiện tại nếu chưa có
      if (!addedIds.has(rowId)) {
        result.push(changedRow);
        addedIds.add(rowId);
      }

      // Nếu có DuplicateID, tìm tất cả các dòng liên quan
      if (duplicateId && duplicateId > 0) {
        // Tìm trong allData các dòng có cùng DuplicateID hoặc ID = DuplicateID
        this.allData.forEach((item: any) => {
          const itemId = item.ID;
          const itemDuplicateId = item.DuplicateID;

          // Kiểm tra nếu:
          // 1. ID của item = DuplicateID của dòng hiện tại
          // 2. DuplicateID của item = DuplicateID của dòng hiện tại
          const isRelated =
            itemId === duplicateId ||
            (itemDuplicateId && itemDuplicateId === duplicateId);

          if (isRelated && !addedIds.has(itemId)) {
            result.push({
              ...item,
              IsMarketing: this.activeTabIndex === 7 || this.activeTabIndex === 1
            });
            addedIds.add(itemId);
          }
        });
      }
    });

    return result;
  }
  //#endregion

  //#region Chức năng Update Internal Code (Cập nhật mã nội bộ)
  async updateInternalCode(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần cập nhật!`);
      return;
    }
    if (idx !== 3) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Chức năng này chỉ dành cho tab Mượn Demo!'
      );
      return;
    }
    if (!this.validateManufacturerForVision(rows)) {
      return;
    }

    // const isRTCTab = idx === 2 || idx === 3;
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn cập nhật không?`,
      nzOkText: 'Cập nhật',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;

        // const apiCall = isRTCTab
        // ? this.srv.createProductRTC(rows)  // API mới cần tạo
        // : this.srv.saveData(rows);

        this.srv.createProductRTC(rows).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, "Cập nhật thành công");
            this.isLoading = false;
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error.message);
            this.isLoading = false;
          },
        });
      },
    });

  }

  onEdit(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length != 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn 1 dòng cần sửa!`);
      return;
    }

    let isCommercialProduct = rows[0].IsCommercialProduct;
    let poNCC = rows[0].PONCCID;

    if (!isCommercialProduct || poNCC > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Sửa Y/C chỉ áp dụng với [Hàng thương mại] và yêu cầu [Chưa có PO]!`);
      return;
    }

    this.selectedRowIds = rows.map(r => r.ID);
    this.selectedTabIndex = idx;

    this.srv.getDetailByID(rows[0].ID).subscribe({
      next: (rs) => {
        const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
          centered: false,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'full-screen-modal'
        });
        console.log(rs.data);
        let data = {
          ...rs.data,
          Unit: rows[0].UnitName || '',
          CustomerID: rows[0].CustomerID || 0,
          Maker: rows[0].Manufacturer || '',
        };
        modalRef.componentInstance.projectPartlistDetail = data;
        modalRef.result.catch((reason) => {
          this.onSearch();
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(NOTIFICATION_TITLE.error, error.error.message || 'Lỗi khi lấy dữ liệu chi tiết!');
        this.selectedRowIds = [];
        this.selectedTabIndex = -1;
      }
    });
  }

  onDeleteRequest(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần hủy yêu cầu!`);
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn hủy danh sách đang chọn không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.deletedRequest(rows, this.isPurchaseRequestDemo).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error.message),
        });
      },
    });
  }

  //#endregion

  //#region Chức năng Update Product Import (Cập nhật hàng nhập khẩu)
  updateProductImport(idx: number, isImport: boolean) {
    let isImportText = isImport ? "hàng nhập khẩu" : "hủy hàng nhập khẩu";

    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần chuyển thành ${isImportText}!`);
      return;
    }

    const rowsToUpdate = rows.filter(row => row.IsImport !== isImport);

    rowsToUpdate.forEach(row => {
      row.IsImport = isImport;
    });

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn chuyển sản phẩm đã chọn thành ${isImportText} không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.updateProductImport(rowsToUpdate).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error.message),
        });
      },
    });
  }
  //#endregion

  //#region Chức năng History Price (Lịch sử hỏi giá)
  onHistoryPrice(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length != 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn 1 sản phẩm cần xem lịch sử hỏi giá!`);
      return;
    }

    let productCode = rows[0].ProductCode;

    const modalRef = this.modalService.open(HistoryPriceComponent, {
      centered: false,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });
    modalRef.componentInstance.searchKeyword = productCode;
    modalRef.result.catch((reason) => {
    });
  }
  //#endregion

  //#region Chức năng Duplicate (Sao chép)
  duplicateRow(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length != 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn sản phẩm cần sao chép!`);
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn sao chép các dòng đã chọn không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.duplicate(rows).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error.message),
        });
      },
    });


  }
  //#endregion

  //#region Chức năng Keep Product (Giữ hàng)
  onKeepProduct(idx: number) {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(idx);
    if (rows.length != 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn sản phẩm cần giữ hàng!`);
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn giữ hàng sản phẩm đã chọn không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.srv.keepProduct(rows).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error.message),
        });
      },
    });

  }

  // #region Chức năng Download File (Tải file PDF)
  onDownloadFile(idx: number) {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn tải file!');
      return;
    }

    this.selectedRowIds = rows.map(r => r.ID);
    this.selectedTabIndex = idx;

    this.srv.downloadFiles(rows).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        a.download = "DownloadFiles.zip";
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        if (error.error instanceof Blob) {
          this.selectedRowIds = [];
          this.selectedTabIndex = -1;
          error.error.text().then((text: string) => {
            try {
              const errorObj = JSON.parse(text);
              const errorMessage = errorObj.message || errorObj.Message || 'Lỗi khi tải file!';
              this.notify.error(NOTIFICATION_TITLE.error, errorMessage);
            } catch (e) {
              this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file!');
            }
          });
        } else {
          const errorMessage = error.error?.message || error.message || 'Lỗi khi tải file!';
          this.notify.error(NOTIFICATION_TITLE.error, errorMessage);
        }
        console.error('Download error:', error);
      },
    });
  }
  //#endregion

  //#region đang update
  onUpdate() {
    this.notify.warning(NOTIFICATION_TITLE.warning, `Chức năng đang được cập nhật!`);
    return;
  }
  //#endregion

  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  onSelectYCMH() {
    const currentTable = this.tables[this.activeTabIndex];
    if (!currentTable) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    const selectedRows = currentTable.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng!');
      return;
    }

    // Bước 1: Kiểm tra validation
    for (const row of selectedRows) {
      const data = row.getData();
      const id = data['ID'] || 0;
      if (id <= 0) continue;

      const code = data['ProductNewCode'] || '';
      const isApprovedBGD = data['IsApprovedBGD'] || false;
      const isTechBought = data['IsTechBought'] || false;

      // Kiểm tra điều kiện (tương đương !chkIsCommercialProduct.Checked && !chkIsJobRequirement.Checked)
      if (!isApprovedBGD && !isTechBought) {
        this.notify.warning(NOTIFICATION_TITLE.warning, 'Sản phẩm chưa được BGĐ duyệt!');
        return;
      }

      if (!code || code.toString().trim() === '') {
        this.notify.warning(NOTIFICATION_TITLE.warning, 'Sản phẩm chưa có mã nội bộ!');
        return;
      }
    }

    // Bước 2: Thu thập dữ liệu
    const lstYCMH: number[] = [];
    const lstYCMHCode: string[] = [];

    for (const row of selectedRows) {
      const data = row.getData();
      const id = data['ID'] || 0;
      const code = data['ProductNewCode'] || '';

      if (id <= 0) continue;

      const isApprovedBGD = data['IsApprovedBGD'] || false;

      // Logic lọc nghiêm ngặt cho danh sách kết quả
      if (!isApprovedBGD) continue;
      if (!code || code.toString().trim() === '') continue;

      if (!lstYCMH.includes(id)) {
        lstYCMH.push(id);
        lstYCMHCode.push(code);
      }
    }

    if (lstYCMH.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có dòng nào thỏa mãn điều kiện!');
      return;
    }


    if (this.activeModal) {
      const strLstRequestBuyIDs = Array.isArray(lstYCMH) ? lstYCMH.join(';') : '';
      const strLstCodes = Array.isArray(lstYCMHCode) ? lstYCMHCode.join('; ') : '';

      this.isYCMH = false;
      this.supplierId = 0;

      this.activeModal.close({
        strLstRequestBuyIDs: strLstRequestBuyIDs,
        strLstCodes: strLstCodes
      });
    }
  }

  onAddPoncc() {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    // Lấy bảng hiện tại đang active
    const currentTable = this.tables[this.activeTabIndex];

    if (!currentTable) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    // Lấy các dòng đã chọn
    const selectedRows = currentTable.getSelectedRows();

    if (!selectedRows || selectedRows.length <= 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm muốn Tạo PO NCC!');
      return;
    }

    // Lấy data từ các dòng đã chọn
    const selectedData = selectedRows.map((row: any) => row.getData());


    for (const row of selectedData) {
      const ticketType = Number(row.TicketType || 0);
      const isTBPApproved = Boolean(row.IsApprovedTBP);
      const productCode = String(row.ProductCode || '');
      const unitPrice = Number(row.UnitPrice || 0);

      // Hàng mượn phải được TBP duyệt
      if (ticketType === 1) {
        if (!isTBPApproved) {
          this.notify.warning(
            NOTIFICATION_TITLE.warning,
            `Sản phẩm ${productCode} (hàng mượn) chưa được TBP duyệt!`
          );
          return;
        }
      }

      // Hàng mua phải có đơn giá
      if (ticketType === 0 && unitPrice <= 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Đơn giá cho sản phẩm ${productCode}!`
        );
        return;
      }
    }
    // Check validate: danh sách sản phẩm có cùng nhà cung cấp không
    const listSupplierSale: number[] = [];

    selectedData.forEach((row: any) => {
      const id = Number(row.ID || 0);
      if (id <= 0) return;

      const supplierSaleId = Number(row.SupplierSaleID || 0);
      if (supplierSaleId > 0 && !listSupplierSale.includes(supplierSaleId)) {
        listSupplierSale.push(supplierSaleId);
      }
    });

    // Kiểm tra nếu có nhiều hơn 1 nhà cung cấp
    if (listSupplierSale.length > 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chỉ chọn sản phẩm từ 1 Nhà cung cấp!');
      return;
    }

    // Kiểm tra nếu không có nhà cung cấp nào
    if (listSupplierSale.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm có Nhà cung cấp!');
      return;
    }

    // Thu thập danh sách ID hợp lệ để gửi lên API
    const validData: any[] = [];
    selectedData.forEach((row: any) => {
      const id = Number(row.ID || 0);
      if (id > 0) {
        validData.push(row);
      }
    });

    if (validData.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không có sản phẩm hợp lệ để tạo PO!');
      return;
    }

    if (this.isYCMH) {
      for (const row of selectedData) {
        const id = Number(row.ID || 0);
        if (id <= 0) continue;

        const code = String(row.ProductNewCode || '').trim();

        // Chỉ kiểm tra khi không phải tab 5 hoặc 6 (activeTabIndex 4 hoặc 5)
        if (this.activeTabIndex !== 4 && this.activeTabIndex !== 5) {
          const isBGDApproved = Boolean(row.IsApprovedBGD);
          const isTechBought = Boolean(row.IsTechBought);

          // Kiểm tra BGD approval hoặc Tech Bought
          if (!isBGDApproved && !isTechBought) {
            this.notify.warning(NOTIFICATION_TITLE.warning, 'Sản phẩm chưa được BGĐ duyệt!');
            return;
          }

          // Kiểm tra mã nội bộ
          if (!code) {
            this.notify.warning(NOTIFICATION_TITLE.warning, 'Sản phẩm chưa có mã nội bộ!');
            return;
          }
        }
      }
    } else {
      this.isLoading = true;
      this.srv.validateAddPoncc(validData).subscribe({
        next: (rs) => {
          this.isLoading = false;

          this.modal.confirm({
            nzTitle: `Bạn có chắc muốn tạo PO NCC danh sách sản phẩm đã chọn không?
          \nNhững sản phẩm chưa được BGĐ duyệt sẽ tự động được bỏ qua!`,
            nzOkText: 'Ok',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOkDanger: false,
            nzClosable: false,
            nzOnOk: () => {
              const { listRequest, currencys } = this.preparePonccData(validData);

              const uniqueCurrencies = [...new Set(currencys)]; // Lọc distinct
              const currencyID = uniqueCurrencies.length > 1 ? 0 : (uniqueCurrencies[0] || 0);
              this.suplierSaleService.getSupplierSaleByID(listSupplierSale[0]).subscribe({
                next: (rs) => {
                  this.isLoading = false;
                  let data = rs.data;
                  let poncc = {
                    SupplierSaleID: listSupplierSale[0],
                    AccountNumberSupplier: data.SoTK,
                    BankSupplier: data.NganHang,
                    AddressSupplier: data.AddressNCC,
                    MaSoThueNCC: data.MaSoThue,
                    EmployeeID: this.appUserService.employeeID,
                    CurrencyID: currencyID,
                  }

                  const modalRef = this.modalService.open(PonccDetailComponent, {
                    backdrop: 'static',
                    keyboard: false,
                    centered: true,
                    windowClass: 'full-screen-modal',
                  });

                  // Pass data to modal component
                  modalRef.componentInstance.poncc = poncc;
                  modalRef.componentInstance.ponccDetail = listRequest || [];
                  modalRef.componentInstance.isAddPoYCMH = true;

                  // Reload table after modal closes
                  modalRef.result.finally(() => {
                    this.onSearch();
                  });


                },
                error: (error) => {
                  this.isLoading = false;
                  this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi validate dữ liệu!');
                }
              });
            },
          });

        },
        error: (error) => {
          this.isLoading = false;
          this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi validate dữ liệu!');
        }
      });
    }
  }

  private preparePonccData(selectedData: any[]): { listRequest: any[], currencys: number[] } {
    const listRequest: any[] = [];
    const currencys: number[] = [];
    let stt = 0;
    selectedData.forEach((row: any) => {
      const id = Number(row.ID || 0);
      if (id <= 0) return;
      stt++;
      // Lấy các giá trị từ row
      const requestTypeID = Number(row.ProjectPartlistPurchaseRequestTypeID || 0);
      const isApprovedBGD = Boolean(row.IsApprovedBGD);
      const isCommercialProduct = Boolean(row.IsCommercialProduct);
      const isTechBought = Boolean(row.IsTechBought);
      const isTBPAprroved = Boolean(row.IsApprovedTBP);
      const isBorrowProduct = Number(row.TicketType || 0); // 0: mua, 1: mượn
      const productRtcId = Number(row.ProductRTCID || 0);
      const jobRequirementID = Number(row.JobRequirementID || 0);

      const IsIgnoreBGD = this.requestTypes.find((x: any) => x.ID === requestTypeID)?.IsIgnoreBGD || false;

      // Validation logic theo WinForm
      if (jobRequirementID <= 0) {
        if (isBorrowProduct === 0) { // Mua
          if (!isApprovedBGD && !isCommercialProduct && !isTechBought && productRtcId <= 0 && !IsIgnoreBGD) {
            return; // Skip row này
          }
        } else { // Mượn
          if (!isTBPAprroved) {
            return; // Skip row này
          }
        }
      }

      // Lấy các giá trị cần thiết
      const productId = Number(row.ProductSaleID || 0);
      const productRTCID = Number(row.ProductRTCID || 0);
      const quantity = Number(row.Quantity || 0);
      const unitPrice = Number(row.UnitPrice || 0);
      let projectId = Number(row.ProjectID || 0);
      let projectName = String(row.ProjectName || '');
      const deadline = row.DateReturnExpected ? new Date(row.DateReturnExpected) : null;
      const productCode = String(row.ProductCode || '');
      const vat = Number(row.VAT || 0);
      const totaMoneyVAT = Number(row.TotaMoneyVAT || 0);
      const ticketType = Number(row.TicketType || 0);
      const dateReturnEstimated = row.DateReturnEstimated ? new Date(row.DateReturnEstimated) : null;

      // Xử lý projectName cho hàng thương mại không có projectId
      if (isCommercialProduct && projectId <= 0) {
        const customerCode = String(row.CustomerCode || '');
        const poNumber = String(row.PONumber || '');
        projectName = `${customerCode}_${poNumber}`;
      }

      // Lấy tên loại kho từ ProductGroupID
      const ProductGroupID = Number(row.ProductGroupID || 0);
      const isRTCTab = this.activeTabIndex === 2 || this.activeTabIndex === 3;
      const productGroupData = isRTCTab ? this.productRTC : this.productGroups;
      const productGroup = productGroupData.find((x: any) => x.ID === ProductGroupID);
      const ProductGroupName = productGroup?.ProductGroupName || '';

      // Tạo request object
      const request = {
        ...row,
        STT: stt,
        ID: 0,
        ProductCodeOfSupplier: String(row.GuestCode || ''),
        ProductGroupName: ProductGroupName,
        PriceHistory: Number(row.HistoryPrice || 0),
        VATMoney: totaMoneyVAT,
        VAT: vat,
        ThanhTien: Number(row.TotalPrice || 0),
        // TotalPrice: Number(row.TotalPrice || 0),
        QtyRequest: Number(row.Quantity || 0),
        IsBill: totaMoneyVAT > 0 ? true : false,
        IsPurchase: false
      };

      listRequest.push(request);

      // Thu thập currency IDs
      const currencyId = Number(row.CurrencyID || 0);
      if (currencyId > 0) {
        currencys.push(currencyId);
      }
    });

    return { listRequest, currencys };
  }

}
