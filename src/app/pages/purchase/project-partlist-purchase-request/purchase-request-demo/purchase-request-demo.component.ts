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
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { RequestType, Currency } from '../project-partlist-purchase-request.model';
import { HasPermissionDirective } from "../../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { DateTime } from 'luxon';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { WarehouseReleaseRequestService } from '../../../old/warehouse-release-request/warehouse-release-request/warehouse-release-request.service';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import * as ExcelJS from 'exceljs';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';

@Component({
  selector: 'app-purchase-request-demo',
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
  templateUrl: './purchase-request-demo.component.html',
  styleUrl: './purchase-request-demo.component.css'
})
export class PurchaseRequestDemoComponent implements OnInit, AfterViewInit {

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
  @Input() employeeID: number = 0; // Nhận EmployeeID từ bên ngoài

  sizeSearch: string = '0';
  isLoading = false;
  lstPOKH: any[] = [];
  lstWarehouses: any[] = [];
  requestTypes: any[] = [];
  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
  keyword: string = '';
  // Advanced filters
  statusRequestFilter: number = 1;
  supplierSaleFilter: number = 0;
  isApprovedTBPFilter: number = -1;
  isApprovedBGDFilter: number = -1;
  isDeletedFilter: number = 0;
  projectIdFilter: number = 0;
  pokhIdFilter: number = 0;
  changedRows: any[] = [];
  originalDataMap: Map<number, any> = new Map();
  duplicateIdList: number[] = [];
  selectedRowIds: number[] = [];
  selectedTabIndex: number = -1;
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

  // Tabs & tables - chỉ hiển thị tab mua demo (type 3) và mượn demo (type 4)
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
    ProductCodeRTC: 'Mã nội bộ',
    ProjectPartlistPurchaseRequestTypeID: 'Loại yêu cầu',
    TotalHN: 'Tồn sử dụng HN',
    TotalHCM: 'Tồn sử dụng HCM',
    TotalHP: 'Tồn sử dụng HP',
    TotalDP: 'Tồn sử dụng DP',
    TotalBN: 'Tồn sử dụng BN',
    ParentProductCodePO: 'Mã cha',
    WarehouseID: 'Kho',
    IsPaidLater: 'Đợi trả sau',
    Note: 'Ghi chú',
  };

  // Cấu hình độ rộng cột (px)
  private COLUMN_WIDTH_CONFIG: Record<string, number> = {
    TotalPriceExchange: 200,
    ProductName: 165,
    CustomerName: 60,
    NameNCC: 100,
    TT: 30,
    ProjectCode: 60,
    ProductCode: 60,
    ProductNewCode: 100,
    Quantity: 60,
    ProductGroupID: 60,
    UnitName: 60,
    Manufacturer: 60,
    StatusRequestText: 90,
    FullName: 90,
    UpdatedName: 90,
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

  private toStartOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const year = x.getFullYear();
    const month = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  private toEndOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
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
    this.containers.changes.subscribe(() => {
      setTimeout(() => this.initTables(), 100);
    });
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
      SupplierSaleID: 0,
      IsApprovedTBP: this.isApprovedTBPFilter,
      IsApprovedBGD: this.isApprovedBGDFilter,
      IsCommercialProduct: -1,
      POKHID: this.pokhIdFilter || 0,
      ProductRTCID: -1,
      IsDeleted: this.isDeletedFilter,
      IsTechBought: -1,
      IsJobRequirement: -1,
      EmployeeID: this.employeeID || 0, // Truyền EmployeeID vào filter
    };

    this.srv.getAll(filter).subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : res?.data || res || [];
        this.allData = data;

        this.originalDataMap.clear();
        data.forEach((item: any) => {
          if (item.ID) {
            this.originalDataMap.set(item.ID, { ...item });
          }
        });

        this.duplicateIdList = [];
        data.forEach((item: any) => {
          const duplicateId = Number(item.DuplicateID || 0);
          if (duplicateId > 0 && !this.duplicateIdList.includes(duplicateId)) {
            this.duplicateIdList.push(duplicateId);
          }
        });

        this.dataByType.clear();

        this.tabs.forEach((t) => {
          let dt: any[] = [];
          const typeId = Number(t.id);

          // Chỉ lọc type 3 (mua demo) và type 4 (mượn demo)
          if (typeId === 3) {
            dt = data.filter((x: any) =>
              Number(x.ProjectPartlistPurchaseRequestTypeID) == 3
            );
          } else if (typeId === 4) {
            dt = data.filter((x: any) =>
              Number(x.ProjectPartlistPurchaseRequestTypeID) == 4
            );
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

  //#region Load các tab của bảng - chỉ hiển thị tab mua demo (type 3) và mượn demo (type 4)
  getRequestTypes() {
    this.srv.getRequestTypes().subscribe({
      next: (types: RequestType[]) => {
        this.requestTypes = types || [];
        // Chỉ lọc tab type 3 (mua demo) và type 4 (mượn demo)
        this.tabs = (types || [])
          .filter((t) => t.ID === 3 || t.ID === 4)
          .map((t) => ({ id: t.ID, title: t.RequestTypeName.toUpperCase() }));
        setTimeout(() => {
          this.initTables();
        }, 100);
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

        const tabIndex = index;

        t.updateColumnDefinition('ProductGroupID', {
          editorParams: (cell: any) => {
            const rowData = cell.getRow().getData();
            const ticketType = Number(rowData?.['TicketType'] || 0);
            const isBorrowDemo = tabIndex === 1; // Tab index 1 là mượn demo
            const isRTCTab = tabIndex === 0 || tabIndex === 1; // Tab 0: mua demo, Tab 1: mượn demo

            const productGroupData = (isBorrowDemo || isRTCTab) ? this.productRTC : this.productGroups;

            return {
              values: productGroupData.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
            };
          },
          formatter: (cell: any) => {
            const rowData = cell.getRow().getData();
            const ticketType = Number(rowData?.['TicketType'] || 0);
            const isBorrowDemo = tabIndex === 1;

            const id = isBorrowDemo ? (rowData?.['ProductGroupRTCID'] || 0) : (rowData?.['ProductGroupID'] || 0);
            if (!id || id === 0) return '';

            const productGroupDataForFormatter = isBorrowDemo || (tabIndex === 0 || tabIndex === 1)
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
    if (!this.containers || this.containers.length === 0) {
      setTimeout(() => {
        if (this.containers && this.containers.length > 0) {
          this.initTables();
        }
      }, 200);
      return;
    }
    
    this.tables.forEach((table) => {
      try {
        table.destroy();
      } catch (e) {
      }
    });
    this.tables = [];
    
    this.tables = this.containers.toArray().map((ref, idx) => {
      const tableConfig = this.GetTableConfig(idx);
      const table = new Tabulator(ref.nativeElement, tableConfig);
      table.on('cellEdited', (cell: CellComponent) => {
        this.onCellEdited(cell);

        const row = cell.getRow();
        const rowData = row.getData();
        const rowId = rowData['ID'];

        const originalData = this.originalDataMap.get(rowId);

        if (originalData) {
          const hasChanges = this.hasRowChanged(rowData, originalData);
          const index = this.changedRows.findIndex(r => r.ID === rowId);

          if (hasChanges) {
            const newRow = {
              ...rowData,
              IsMarketing: this.activeTabIndex === 1
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
      this.applyHeaderMenus(table);
      return table;
    });
    this.refreshAllTables();
  }

  // Formatter dùng lại
  private readonly checkboxFormatterReadonly = (cell: any) => {
    const value = cell.getValue();
    const checked = value === true || value === 'true' || value === 1 || value === '1';
    return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
  };

  private readonly checkboxFormatterEditable = (cell: any) => {
    const value = cell.getValue();
    const checked = value === true || value === 'true' || value === 1 || value === '1';
    return `<input type="checkbox" ${checked ? 'checked' : ''} style="accent-color: #1677ff; cursor: pointer;" />`;
  };

  private readonly moneyFormatter = (cell: any) => this.formatNumberEnUS(cell.getValue(), 2);
  private readonly dateFormatter = (cell: any) => this.formatDateDDMMYYYY(cell.getValue());
  private readonly tooltipFormatter = (cell: any) => {
    const value = cell.getValue();
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  };

  private readonly numberMutator = (value: any) => {
    const v = Number(value);
    return isNaN(v) ? 0 : v;
  };

  private getBaseColumnConfig(field: string, tabIndex: number): any {
    let visible = true;
    if (tabIndex === 1) {
      if (['IsRequestApproved', 'IsApprovedBGD', 'TT'].includes(field)) {
        visible = false;
      }
    } else {
      if (['IsApprovedTBP', 'ApprovedTBPName', 'DateApprovedTBP'].includes(field)) {
        visible = false;
      }
    }

    return {
      title: this.CAPTION_MAP[field] || field,
      field: field,
      headerSort: false,
      width: 120,
      visible: visible,
      headerHozAlign: 'center',
      tooltip: this.tooltipFormatter,
    };
  }

  private readonly CHECKBOX_FIELDS_READONLY = new Set([
    'IsApprovedTBP', 'IsRequestApproved', 'IsApprovedBGD', 'IsImport'
  ]);

  private readonly MONEY_SUM_FIELDS = new Set([
    'TotalPrice', 'TotalPriceExchange', 'TotaMoneyVAT', 'TotalImportPrice', 
    'TotalPriceHistory', 'UnitFactoryExportPrice', 'TotalHN', 'TotalHCM', 
    'TotalHP', 'TotalDP', 'TotalBN', 'UnitPrice', 'CurrencyRate'
  ]);

  private readonly NUMERIC_EDITOR_FIELDS = new Set([
    'Quantity', 'VAT', 'TargetPrice', 'TotalDayLeadTime', 'UnitPrice', 
    'UnitImportPrice', 'CurrencyRate'
  ]);

  private readonly DATE_FIELDS = new Set([
    'DateRequest', 'DateReturnExpected', 'RequestDate', 'DeadlineDelivery',
    'DateReturnActual', 'DateReceive', 'DateApprovedTBP', 'DateApprovedBGD', 
    'DateReturnEstimated'
  ]);

  private readonly TEXTAREA_FIELDS = new Set([
    'Note', 'ReasonCancel', 'NotePartlist', 'NoteMarketing', 'Model',
    'ProjectCode', 'ProductCode', 'ProductName', 'CustomerName'
  ]);

  private readonly RIGHT_ALIGN_FIELDS = new Set([
    'Quantity', 'VAT', 'CurrencyRate', 'UnitFactoryExportPrice',
    'UnitPrice', 'UnitPricePOKH', 'HistoryPrice', 'TotalPriceHistory',
    'TotalPrice', 'TotalPriceExchange', 'TotaMoneyVAT', 'TargetPrice',
    'TotalImportPrice', 'UnitImportPrice', 'TotalDayLeadTime',
    'TotalHN', 'TotalHCM', 'TotalHP', 'TotalDP', 'TotalBN'
  ]);

  private buildColumn(field: string, tabIndex: number): any {
    const colDef = this.getBaseColumnConfig(field, tabIndex);

    if (this.CHECKBOX_FIELDS_READONLY.has(field)) {
      colDef.width = 60;
      colDef.hozAlign = 'center';
      colDef.formatter = this.checkboxFormatterReadonly;
      colDef.editable = false;
      if (field === 'IsApprovedTBP' || field === 'IsRequestApproved' || field === 'IsApprovedBGD') {
        colDef.frozen = true;
      }
      return colDef;
    }

    if (field === 'IsPaidLater') {
      colDef.width = 60;
      colDef.hozAlign = 'center';
      colDef.formatter = this.checkboxFormatterEditable;
      colDef.cellClick = (e: any, cell: any) => {
        const currentValue = cell.getValue();
        const newValue = !currentValue;
        cell.setValue(newValue);
      };
      return colDef;
    }

    if (this.DATE_FIELDS.has(field)) {
      colDef.width = 120;
      colDef.hozAlign = 'center';
      colDef.formatter = this.dateFormatter;
      if (field === 'DateApprovedTBP') {
        colDef.frozen = true;
      }
      return colDef;
    }

    if (this.TEXTAREA_FIELDS.has(field)) {
      colDef.formatter = 'textarea';
      if (field === 'Note') {
        colDef.editor = 'textarea';
        colDef.width = 220;
      } else if (field === 'Model' || field === 'NotePartlist' || field === 'ReasonCancel') {
        colDef.width = 220;
      } else if (field === 'ProjectCode' || field === 'ProductCode') {
        colDef.frozen = true;
        colDef.width = this.COLUMN_WIDTH_CONFIG[field] || 60;
        colDef.bottomCalc = 'count';
        colDef.bottomCalcFormatter = (cell: any) => cell.getValue();
      } else if (field === 'ProductName') {
        colDef.frozen = false;
        colDef.width = this.COLUMN_WIDTH_CONFIG[field] || 220;
        colDef.bottomCalc = 'count';
        colDef.bottomCalcFormatter = (cell: any) => cell.getValue();
      } else if (field === 'CustomerName') {
        colDef.frozen = true;
        colDef.width = this.COLUMN_WIDTH_CONFIG[field] || 60;
        colDef.headerWordWrap = true;
      }
      return colDef;
    }

    if (this.RIGHT_ALIGN_FIELDS.has(field)) {
      colDef.hozAlign = 'right';
      colDef.headerHozAlign = 'right';
    }

    if (this.MONEY_SUM_FIELDS.has(field)) {
      colDef.formatter = this.moneyFormatter;
      colDef.bottomCalc = 'sum';
      colDef.bottomCalcFormatter = this.moneyFormatter;
    }

    if (this.NUMERIC_EDITOR_FIELDS.has(field)) {
      colDef.editor = 'input';
      colDef.mutator = this.numberMutator;
      if (this.MONEY_SUM_FIELDS.has(field)) {
        colDef.bottomCalc = 'sum';
        colDef.bottomCalcFormatter = this.moneyFormatter;
      }
    }

    if (this.COLUMN_WIDTH_CONFIG[field]) {
      colDef.width = this.COLUMN_WIDTH_CONFIG[field];
    }

    if (field === 'TotalPriceExchange') {
      colDef.width = this.COLUMN_WIDTH_CONFIG['TotalPriceExchange'] || 200;
    }

    return colDef;
  }

  private applySpecialFieldLogic(field: string, colDef: any, tabIndex: number): void {
    switch (field) {
      case 'TT':
        colDef.frozen = true;
        colDef.width = this.COLUMN_WIDTH_CONFIG['TT'] || 30;
        colDef.hozAlign = 'center';
        break;

      case 'ApprovedTBPName':
        colDef.frozen = true;
        colDef.width = 120;
        colDef.hozAlign = 'left';
        break;

      case 'ProductNewCode':
        colDef.width = this.COLUMN_WIDTH_CONFIG['ProductNewCode'] || 100;
        colDef.hozAlign = 'left';
        break;

      case 'ProductCodeRTC':
        colDef.width = this.COLUMN_WIDTH_CONFIG['ProductNewCode'] || 100;
        colDef.hozAlign = 'left';
        colDef.title = this.CAPTION_MAP['ProductCodeRTC'] || 'Mã nội bộ';
        break;

      case 'ProductGroupRTCID':
        colDef.width = this.COLUMN_WIDTH_CONFIG['ProductGroupID'] || 60;
        colDef.hozAlign = 'left';
        colDef.title = this.CAPTION_MAP['ProductGroupID'] || 'Loại kho';
        colDef.editor = 'list';
        colDef.editorParams = (cell: any) => {
          return {
            values: this.productRTC.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
          };
        };
        colDef.formatter = (cell: any) => {
          const id = cell.getValue();
          if (!id || id === 0) return '';
          const g = this.productRTC.find((x: any) => x.ID === id);
          return g?.ProductGroupName || '';
        };
        break;

      case 'Quantity':
        colDef.editable = (cell: any) => {
          const rd = cell.getRow?.().getData?.() || {};
          const currentId = Number(rd['ID'] || 0);
          const duplicateId = Number(rd['DuplicateID'] || 0);
          return this.duplicateIdList.includes(currentId) || this.duplicateIdList.includes(duplicateId);
        };
        break;

      case 'ProductGroupID':
        colDef.accessor = (value: any, data: any, type: string, params: any, column: any) => {
          const ticketType = Number(data?.['TicketType'] || 0);
          const isBorrowDemo = tabIndex === 1;
          return isBorrowDemo ? (data?.['ProductGroupRTCID'] || 0) : (data?.['ProductGroupID'] || 0);
        };
        colDef.mutator = (value: any, data: any, type: string, params: any, column: any) => {
          const ticketType = Number(data?.['TicketType'] || 0);
          const isBorrowDemo = tabIndex === 1;
          if (isBorrowDemo) {
            data['ProductGroupRTCID'] = value;
          } else {
            data['ProductGroupID'] = value;
          }
          return value;
        };
        colDef.editor = 'list';
        colDef.editorParams = (cell: any) => {
          const rowData = cell.getRow().getData();
          const ticketType = Number(rowData?.['TicketType'] || 0);
          const isBorrowDemo = tabIndex === 1;
          const isRTCTab = tabIndex === 0 || tabIndex === 1;
          const productGroupData = (isBorrowDemo || isRTCTab) ? this.productRTC : this.productGroups;
          return {
            values: productGroupData.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
          };
        };
        colDef.formatter = (cell: any) => {
          const rowData = cell.getRow().getData();
          const ticketType = Number(rowData?.['TicketType'] || 0);
          const isBorrowDemo = tabIndex === 1;
          const id = isBorrowDemo ? (rowData?.['ProductGroupRTCID'] || 0) : (rowData?.['ProductGroupID'] || 0);
          if (!id || id === 0) return '';
          const productGroupDataForFormatter = isBorrowDemo || (tabIndex === 0 || tabIndex === 1)
            ? this.productRTC
            : this.productGroups;
          const g = productGroupDataForFormatter.find((x: any) => x.ID === id);
          return g?.ProductGroupName || '';
        };
        break;

      case 'UnitName':
      case 'Manufacturer':
      case 'StatusRequestText':
      case 'FullName':
      case 'UpdatedName':
        colDef.width = this.COLUMN_WIDTH_CONFIG[field] || (field === 'Manufacturer' ? 60 : 90);
        colDef.hozAlign = 'left';
        break;

      case 'CurrencyID':
        colDef.editor = 'list';
        colDef.editorParams = {
          values: this.currencies.map((c) => ({ value: c.ID, label: c.Code })),
        };
        colDef.formatter = (cell: any) => {
          const id = cell.getValue();
          const cur = this.currencies.find((c) => c.ID === id);
          return cur?.Code || '';
        };
        break;

      case 'UnitPrice':
      case 'UnitImportPrice':
        colDef.editable = (cell: any) => {
          const rd = cell.getRow?.().getData?.() || {};
          const ticketType = Number(rd['TicketType'] || 0);
          return ticketType !== 1;
        };
        break;

      case 'SupplierSaleID':
        colDef.width = 400;
        colDef.hozAlign = 'left';
        colDef.editor = 'list';
        colDef.editorParams = {
          values: this.supplierSales.map((s) => ({ value: s.ID, label: s.NameNCC })),
        };
        colDef.formatter = (cell: any) => {
          const id = cell.getValue();
          const s = this.supplierSales.find((x) => x.ID === id);
          return s?.NameNCC || '';
        };
        break;

      case 'WarehouseID':
        colDef.editor = 'list';
        colDef.editorParams = {
          values: this.lstWarehouses.map((w) => ({ value: w.ID, label: w.WarehouseCode })),
        };
        colDef.formatter = (cell: any) => {
          const id = cell.getValue();
          const w = this.lstWarehouses.find((x) => x.ID === id);
          return w?.WarehouseCode || '';
        };
        break;

      case 'UnitPricePOKH':
      case 'HistoryPrice':
        colDef.formatter = this.moneyFormatter;
        colDef.bottomCalc = undefined;
        break;

      case 'TotalHN':
      case 'TotalHCM':
      case 'TotalHP':
      case 'TotalDP':
      case 'TotalBN':
        colDef.visible = true;
        break;
    }
  }

  private GetTableConfig(tabIndex: number = 0): any {
    const columns = this.FORM_COLUMN_ORDER.map(field => {
      let actualField = field;
      const isRTCTab = tabIndex === 0 || tabIndex === 1;
      if (field === 'ProductNewCode' && isRTCTab) {
        actualField = 'ProductCodeRTC';
      }
      if (field === 'ProductGroupID' && isRTCTab) {
        actualField = 'ProductGroupRTCID';
      }
      
      const colDef = this.buildColumn(actualField, tabIndex);
      this.applySpecialFieldLogic(actualField, colDef, tabIndex);
      return colDef;
    });

    return {
      ...DEFAULT_TABLE_CONFIG,
      height: '82vh',
      paginationMode: 'local',
      columns: columns,
      data: [],
      selectableRows: 'highlight',
      columnCalcs: 'both',
      groupBy: (data: any) => `Dự án: ${data.ProjectCode ?? ""} - ${data.ProjectName ?? ""}`,
      groupHeader: function (value: any, count: number, data: any, group: any) {
        return `${value} (${count})`;
      },
      rowContextMenu: () => [],
    };
  }

  private applyHeaderMenus(table: any): void {
    try {
      const items = this.buildColumnHeaderMenu(table);
      const cols = (table.getColumns?.() || []) as any[];
      cols.forEach((c: any) => {
        const field = c.getField?.();
        if (!field) return;
        table.updateColumnDefinition(field, { headerMenu: items } as any);
      });
    } catch { }
  }

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

    try {
      table.setData(data);
      if (this.selectedRowIds.length > 0 && this.selectedTabIndex === idx) {
        this.restoreSelectedRows(idx);
      }
    } catch (error) {
      table.on('tableBuilt', () => {
        table.setData(data);
        if (this.selectedRowIds.length > 0 && this.selectedTabIndex === idx) {
          this.restoreSelectedRows(idx);
        }
      });
    }
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    this.updateEditorLookups();
    this.refreshTable(index);
  }

  private getSelectedRowsData(idx: number): any[] {
    const table = this.tables?.[idx];
    if (!table) return [];
    return (table.getSelectedData() as any[]) || [];
  }

  private restoreSelectedRows(idx: number): void {
    const table = this.tables?.[idx];
    if (!table || this.selectedRowIds.length === 0) return;

    setTimeout(() => {
      try {
        const rows = table.getRows();
        rows.forEach((row: any) => {
          const rowData = row.getData();
          if (this.selectedRowIds.includes(rowData.ID)) {
            row.select();
          }
        });
        this.selectedRowIds = [];
        this.selectedTabIndex = -1;
      } catch (error) {
        console.error('Error restoring selected rows:', error);
      }
    }, 100);
  }

  private hasRowChanged(currentData: any, originalData: any): boolean {
    const editableFields = [
      'Quantity', 'UnitPrice', 'UnitImportPrice', 'VAT', 'TargetPrice',
      'CurrencyID', 'ProductGroupID', 'ProductGroupRTCID', 'SupplierSaleID', 'WarehouseID', 'Note',
      'CurrencyRate', 'UnitMoney', 'IsPaidLater'
    ];

    for (const field of editableFields) {
      const currentValue = currentData[field];
      const originalValue = originalData[field];

      if (this.normalizeValue(currentValue) !== this.normalizeValue(originalValue)) {
        return true;
      }
    }

    return false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'number' || !isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }

  private onCellEdited(cell: CellComponent): void {
    const row = cell.getRow();
    const data = row.getData() as any;
    const field = (cell as any).getField ? (cell as any).getField() : '';
    const newValue = cell.getValue();

    const table = this.tables?.[this.activeTabIndex];
    const selectedRows = table?.getSelectedRows() || [];
    const hasSelectedRows = selectedRows.length > 0;

    const currentRowId = data['ID'];
    const isCurrentRowSelected = hasSelectedRows && selectedRows.some((selectedRow: any) => {
      return selectedRow.getData()['ID'] === currentRowId;
    });

    if (hasSelectedRows && isCurrentRowSelected) {
      selectedRows.forEach((selectedRow: any) => {
        const rowData = selectedRow.getData();
        const selectedRowId = rowData['ID'];

        if (selectedRowId === currentRowId) {
          return;
        }

        const oldValue = rowData[field];

        if (this.normalizeValue(oldValue) !== this.normalizeValue(newValue)) {
          const updateData: any = {};
          updateData[field] = newValue;
          selectedRow.update(updateData);

          const rowId = Number(selectedRow.getData()['ID']);
          if (rowId > 0) this.editedMap.set(rowId, selectedRow.getData());
        }
      });

      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'CurrencyID'].includes(field)) {
        selectedRows.forEach((selectedRow: any) => {
          this.recalculateRow(selectedRow);
        });
      }

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
              IsMarketing: this.activeTabIndex === 1
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

      const originalData = this.originalDataMap.get(currentRowId);
      if (originalData) {
        const hasChanges = this.hasRowChanged(row.getData(), originalData);
        const index = this.changedRows.findIndex(r => r.ID === currentRowId);

        if (hasChanges) {
          const newRow = {
            ...row.getData(),
            IsMarketing: this.activeTabIndex === 1
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

      const id = Number(data['ID']);
      if (id > 0) this.editedMap.set(id, row.getData());
    } else {
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'CurrencyID'].includes(field)) {
        this.recalculateRow(row);
      }

      const id = Number(data['ID']);
      if (id > 0) this.editedMap.set(id, row.getData());

      const originalData = this.originalDataMap.get(id);
      if (originalData) {
        const hasChanges = this.hasRowChanged(row.getData(), originalData);
        const index = this.changedRows.findIndex(r => r.ID === id);

        if (hasChanges) {
          const newRow = {
            ...row.getData(),
            IsMarketing: this.activeTabIndex === 1
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

  private recalculateRow(row: any): void {
    const data = row.getData() as any;

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

  //#region Chức năng Thêm, Sửa, Xóa
  onAdd() {
    const currentTab = this.tabs[this.activeTabIndex];
    if (!currentTab) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy tab!');
      return;
    }

    // Xác định ProjectPartlistPurchaseRequestTypeID dựa trên tab hiện tại
    const projectPartlistPurchaseRequestTypeID = currentTab.id; // 3 hoặc 4

    const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
      centered: false,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal'
    });

    // Tạo dữ liệu mới với EmployeeID và TypeID
    const newData = {
      ID: 0,
      ProjectPartlistPurchaseRequestTypeID: projectPartlistPurchaseRequestTypeID,
      EmployeeID: this.employeeID || 0,
      Quantity: 0,
      UnitPrice: 0,
      TotalPrice: 0,
      CurrencyID: 0,
      CurrencyRate: 0,
      VAT: 0,
      TotaMoneyVAT: 0,
      DateRequest: new Date(),
      DateReturnExpected: null,
      Note: '',
      IsImport: false,
      IsApprovedTBP: false,
      IsApprovedBGD: false,
      IsRequestApproved: false,
    };

    modalRef.componentInstance.projectPartlistDetail = newData;
    modalRef.result.then(
      () => {
        this.onSearch();
      },
      () => {
        this.onSearch();
      }
    );
  }

  onEdit() {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(this.activeTabIndex);
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
    this.selectedTabIndex = this.activeTabIndex;

    this.srv.getDetailByID(rows[0].ID).subscribe({
      next: (rs) => {
        const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
          centered: false,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'full-screen-modal'
        });
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

  onDelete() {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const rows = this.getSelectedRowsData(this.activeTabIndex);
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
        this.srv.deletedRequest(rows, true).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message);
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error.message),
        });
      },
    });
  }

  async onSaveData() {
    if (this.changedRows.length <= 0 || this.changedRows == null) {
      this.notify.warning(NOTIFICATION_TITLE.warning, "Không có dữ liệu thay đổi!");
      return;
    }
    this.selectedRowIds = this.changedRows.map(r => r.ID);
    this.selectedTabIndex = this.activeTabIndex;

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

  private getDataToSave(): any[] {
    const result: any[] = [];
    const addedIds = new Set<number>();

    this.changedRows.forEach(changedRow => {
      const rowId = changedRow.ID;
      const duplicateId = changedRow.DuplicateID;

      if (!addedIds.has(rowId)) {
        result.push(changedRow);
        addedIds.add(rowId);
      }

      if (duplicateId && duplicateId > 0) {
        this.allData.forEach((item: any) => {
          const itemId = item.ID;
          const itemDuplicateId = item.DuplicateID;

          const isRelated =
            itemId === duplicateId ||
            (itemDuplicateId && itemDuplicateId === duplicateId);

          if (isRelated && !addedIds.has(itemId)) {
            result.push({
              ...item,
              IsMarketing: this.activeTabIndex === 1
            });
            addedIds.add(itemId);
          }
        });
      }
    });

    return result;
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }
  //#endregion
}
