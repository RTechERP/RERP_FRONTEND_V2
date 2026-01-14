import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  Optional,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  SortComparers,
  SortDirectionNumber,
  AngularSlickgridModule,
} from 'angular-slickgrid';
import {
  MultipleSelectOption,
} from '@slickgrid-universal/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { RequestType, Currency } from '../project-partlist-purchase-request.model';
import { HasPermissionDirective } from "../../../../directives/has-permission.directive";
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
import { DateTime } from 'luxon';
import { ProductRtcPurchaseRequestComponent } from '../product-rtc-purchase-request/product-rtc-purchase-request.component';
import { WarehouseReleaseRequestService } from '../../../old/warehouse-release-request/warehouse-release-request/warehouse-release-request.service';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import * as ExcelJS from 'exceljs';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { Subscription } from 'rxjs';

interface Tab {
  id: number;
  title: string;
}

/**
 * Custom editor for single select with searchable dropdown and grouped options support
 */
class GroupSelectEditor {
  private args: any;
  private wrapperElm!: HTMLDivElement;
  private inputElm!: HTMLInputElement;
  private dropdownElm!: HTMLDivElement;
  private defaultValue: string = '';
  private selectedValue: string = '';
  private collection: Array<any> = [];
  private visibleOptions: Array<{
    value: string;
    label: string;
    group?: string;
  }> = [];
  private activeIndex = -1;

  private handleOutsideMouseDown!: (e: Event) => void;
  private handleReposition!: () => void;

  constructor(args: any) {
    this.args = args;
    this.init();
  }

  init() {
    const editor = this.args?.column?.editor ?? {};
    this.collection = editor.collection ?? [];

    this.wrapperElm = document.createElement('div');
    this.wrapperElm.style.width = '100%';
    this.wrapperElm.style.height = '100%';

    this.inputElm = document.createElement('input');
    this.inputElm.type = 'text';
    this.inputElm.placeholder = 'Tìm...';
    this.inputElm.style.width = '100%';
    this.inputElm.style.height = '100%';
    this.inputElm.style.boxSizing = 'border-box';
    this.inputElm.style.padding = '2px 6px';
    this.inputElm.style.fontSize = '12px';

    this.wrapperElm.appendChild(this.inputElm);
    this.args.container.appendChild(this.wrapperElm);

    this.dropdownElm = document.createElement('div');
    this.dropdownElm.style.position = 'fixed';
    this.dropdownElm.style.zIndex = '99999';
    this.dropdownElm.style.background = '#fff';
    this.dropdownElm.style.border = '1px solid #d9d9d9';
    this.dropdownElm.style.borderRadius = '4px';
    this.dropdownElm.style.boxShadow = '0 6px 16px rgba(0,0,0,.08)';
    this.dropdownElm.style.maxHeight = '260px';
    this.dropdownElm.style.overflow = 'auto';
    this.dropdownElm.style.display = 'none';
    document.body.appendChild(this.dropdownElm);

    this.inputElm.addEventListener('input', () => {
      this.activeIndex = -1;
      this.buildDropdown(this.inputElm.value);
      this.openDropdown();
    });

    this.inputElm.addEventListener('focus', () => {
      this.activeIndex = -1;
      this.buildDropdown(this.inputElm.value);
      this.openDropdown();
    });

    this.inputElm.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeDropdown();
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        this.moveActive(1);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp') {
        this.moveActive(-1);
        e.preventDefault();
        return;
      }

      if (e.key === 'Enter') {
        this.selectActiveOrCommit();
        e.preventDefault();
      }
    });

    this.dropdownElm.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    this.handleOutsideMouseDown = (e: Event) => {
      const target = e.target as Node;
      if (
        this.wrapperElm?.contains(target) ||
        this.dropdownElm?.contains(target)
      )
        return;
      this.closeDropdown();
    };

    this.handleReposition = () => {
      if (this.dropdownElm?.style.display !== 'none') {
        this.repositionDropdown();
      }
    };

    document.addEventListener('mousedown', this.handleOutsideMouseDown, true);
    window.addEventListener('scroll', this.handleReposition, true);
    window.addEventListener('resize', this.handleReposition, true);

    this.buildDropdown('');
    this.openDropdown();
    this.inputElm.focus();
  }

  private openDropdown() {
    this.repositionDropdown();
    this.dropdownElm.style.display = 'block';
  }

  private closeDropdown() {
    if (this.dropdownElm) {
      this.dropdownElm.style.display = 'none';
    }
  }

  private repositionDropdown() {
    const rect = this.wrapperElm.getBoundingClientRect();
    this.dropdownElm.style.left = `${rect.left}px`;
    this.dropdownElm.style.top = `${rect.bottom}px`;
    this.dropdownElm.style.width = `${rect.width}px`;
  }

  private commit() {
    const grid = this.args?.grid;
    const lock = grid?.getEditorLock?.();
    lock?.commitCurrentEdit?.();
  }

  private getFlattenedCollection(): Array<{
    group?: string;
    value: string;
    label: string;
  }> {
    const out: Array<{ group?: string; value: string; label: string }> = [];
    const editor = this.args?.column?.editor ?? {};
    const addBlankEntry = editor?.collectionOptions?.addBlankEntry !== false;

    if (addBlankEntry) {
      out.push({ value: '', label: '' });
    }

    for (const item of this.collection) {
      if (item?.options?.length) {
        for (const opt of item.options) {
          out.push({
            group: item.label ?? '',
            value: String(opt.value ?? ''),
            label: String(opt.label ?? ''),
          });
        }
      } else {
        out.push({
          value: String(item.value ?? ''),
          label: String(item.label ?? ''),
        });
      }
    }
    return out;
  }

  private buildDropdown(searchTerm: string) {
    const term = (searchTerm ?? '').trim().toLowerCase();
    const currentValue = String(this.selectedValue ?? '');
    const all = this.getFlattenedCollection();

    const filtered = all.filter((x) => {
      if (!term) return true;
      if (String(x.value ?? '') === currentValue) return true;
      const label = String(x.label ?? '').toLowerCase();
      const value = String(x.value ?? '').toLowerCase();
      return label.includes(term) || value.includes(term);
    });

    this.visibleOptions = filtered;

    const root = document.createElement('div');
    root.style.padding = '4px 0';

    const grouped = new Map<string, Array<{ value: string; label: string }>>();
    const noGroup: Array<{ value: string; label: string }> = [];

    for (const x of filtered) {
      const item = { value: x.value, label: x.label };
      if (x.group) {
        if (!grouped.has(x.group)) grouped.set(x.group, []);
        grouped.get(x.group)!.push(item);
      } else {
        noGroup.push(item);
      }
    }

    const appendOption = (
      opt: { value: string; label: string },
      optIndex: number
    ) => {
      const row = document.createElement('div');
      row.setAttribute('data-idx', String(optIndex));
      row.style.padding = '6px 10px';
      row.style.cursor = 'pointer';
      row.style.userSelect = 'none';
      row.style.whiteSpace = 'nowrap';
      row.style.overflow = 'hidden';
      row.style.textOverflow = 'ellipsis';
      row.textContent = opt.label;

      if (opt.value === currentValue) {
        row.style.background = '#e6f4ff';
      }
      if (optIndex === this.activeIndex) {
        row.style.background = '#f5f5f5';
      }

      row.addEventListener('click', () => {
        this.selectValue(opt.value);
      });

      root.appendChild(row);
    };

    let optIndex = 0;
    for (const opt of noGroup) {
      appendOption(opt, optIndex);
      optIndex++;
    }

    for (const [groupLabel, items] of grouped.entries()) {
      const header = document.createElement('div');
      header.style.padding = '6px 10px';
      header.style.fontWeight = '600';
      header.style.color = '#666';
      header.textContent = groupLabel;
      root.appendChild(header);

      for (const opt of items) {
        appendOption(opt, optIndex);
        optIndex++;
      }
    }

    this.dropdownElm.innerHTML = '';
    this.dropdownElm.appendChild(root);
  }

  private moveActive(delta: number) {
    const count = this.visibleOptions?.length ?? 0;
    if (count <= 0) return;
    const next = Math.max(0, Math.min(count - 1, this.activeIndex + delta));
    this.activeIndex = next;
    this.buildDropdown(this.inputElm.value);

    const active = this.dropdownElm.querySelector(
      `[data-idx="${this.activeIndex}"]`
    ) as HTMLDivElement | null;
    active?.scrollIntoView({ block: 'nearest' });
  }

  private selectActiveOrCommit() {
    if (
      this.activeIndex >= 0 &&
      this.activeIndex < (this.visibleOptions?.length ?? 0)
    ) {
      this.selectValue(this.visibleOptions[this.activeIndex].value);
      return;
    }
    this.commit();
  }

  private selectValue(val: string) {
    this.selectedValue = String(val ?? '');
    const flat = this.getFlattenedCollection();
    const found = flat.find(
      (x) => String(x.value ?? '') === this.selectedValue
    );
    this.inputElm.value = found?.label ?? '';
    this.closeDropdown();
    this.commit();
  }

  destroy() {
    document.removeEventListener(
      'mousedown',
      this.handleOutsideMouseDown,
      true
    );
    window.removeEventListener('scroll', this.handleReposition, true);
    window.removeEventListener('resize', this.handleReposition, true);
    this.dropdownElm?.remove();
    this.wrapperElm?.remove();
  }

  focus() {
    this.inputElm?.focus();
  }

  loadValue(item: any) {
    this.defaultValue = String(item?.[this.args.column.field] ?? '');
    this.selectedValue = this.defaultValue;
    const flat = this.getFlattenedCollection();
    const found = flat.find(
      (x) => String(x.value ?? '') === this.selectedValue
    );
    this.inputElm.value = found?.label ?? '';
    this.buildDropdown('');
    this.openDropdown();
  }

  serializeValue() {
    return this.selectedValue ?? '';
  }

  applyValue(item: any, state: any) {
    item[this.args.column.field] = state;
  }

  isValueChanged() {
    return String(this.selectedValue ?? '') !== String(this.defaultValue ?? '');
  }

  validate() {
    return { valid: true, msg: null };
  }
}

@Component({
  selector: 'app-purchase-request-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTabsModule,
    NzModalModule,
    NzDropDownModule,
    NgbModule,
    HasPermissionDirective
  ],
  templateUrl: './purchase-request-demo.component.html',
  styleUrl: './purchase-request-demo.component.css'
})
export class PurchaseRequestDemoComponent implements OnInit, AfterViewInit, OnDestroy {

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
    private cdr: ChangeDetectorRef,
    @Optional() public activeModal?: NgbActiveModal
  ) { }

  @Input() showHeader: boolean = false;
  @Input() headerText: string = "";
  @Input() showCloseButton: boolean = false;
  @Input() employeeID: number = 0; // Nhận EmployeeID từ bên ngoài

  // Grid instances for each tab
  angularGrids: Map<number, AngularGridInstance> = new Map();
  columnDefinitionsMap: Map<number, Column[]> = new Map();
  gridOptionsMap: Map<number, GridOption> = new Map();
  datasetsMap: Map<number, any[]> = new Map();
  visitedTabs: Set<number> = new Set(); // Track which tabs have been visited

  sizeSearch: string = '0';
  showSearchBar: boolean = false;
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

  // Tabs - chỉ hiển thị tab mua demo (type 3) và mượn demo (type 4)
  tabs: Tab[] = [];
  activeTabIndex = 0;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Lookup data for editors
  currencies: Currency[] = [];
  productGroups: any[] = [];
  productRTC: any[] = [];
  supplierSales: any[] = [];
  projects: any[] = [];

  // Track edited rows by ID
  private editedMap = new Map<number, any>();

  // Cached all data for getDataToSave
  private allData: any[] = [];

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

  //#region Tab helpers
  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const tab = this.tabs[index];
    if (tab) {
      this.visitedTabs.add(tab.id);
    }
  }

  shouldRenderGrid(tabId: number): boolean {
    return this.visitedTabs.has(tabId);
  }
  //#endregion

  //#region Hàm chạy khi mở chương trình
  ngOnInit(): void {
    this.loadLookups();
    this.getRequestTypes();
  }

  ngAfterViewInit(): void {
    // Grids will be initialized in getRequestTypes after tabs are loaded
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  //#endregion

  //#region Sự kiện tìm kiếm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const isMobile = window.innerWidth <= 768;
    const wasOpen = this.showSearchBar;

    this.showSearchBar = !this.showSearchBar;

    if (isMobile) {
      if (this.showSearchBar) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    }

    requestAnimationFrame(() => {
      if (isMobile && this.showSearchBar && !wasOpen) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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

    this.srv.getAllDemo(filter).subscribe({
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

        // Clear changedRows when reloading data
        this.changedRows = [];

        // Process data for each tab
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

          // Add ProjectFullName for grouping
          dt = dt.map((item: any) => ({
            ...item,
            ProjectFullName: `${item.ProjectCode || ''} - ${item.ProjectName || ''}`.trim(),
            id: item.ID || Math.random(), // SlickGrid needs unique id
          }));

          this.datasetsMap.set(t.id, dt);
          const countText = (dt?.length || 0).toLocaleString('vi-VN');
          t.title = `${t.title.split('(')[0].trim()} (${countText})`;

          // Update grid data if grid exists
          const angularGrid = this.angularGrids.get(t.id);
          if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.setItems(dt, 'id');
            angularGrid.dataView.refresh();
            angularGrid.slickGrid.render();
          }
        });
        this.isLoading = false;

        // Tự động ẩn filter bar trên mobile sau khi tìm kiếm
        const isMobile = window.innerWidth <= 768;
        if (isMobile && this.showSearchBar) {
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          setTimeout(() => {
            this.showSearchBar = false;
          }, 100);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notify.error('Lỗi', err.error.message);
      },
    });

    this.changedRows = [];
    // Sau khi load dữ liệu, cập nhật collection cho header filter
    setTimeout(() => this.applyDistinctFilters(), 0);
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
    const sub = this.srv.getRequestTypes().subscribe({
      next: (types: RequestType[]) => {
        this.requestTypes = types || [];
        // Chỉ lọc tab type 3 (mua demo) và type 4 (mượn demo)
        this.tabs = (types || [])
          .filter((t) => t.ID === 3 || t.ID === 4)
          .map((t) => ({ id: t.ID, title: t.RequestTypeName.toUpperCase() }));

        // Initialize grids for each tab
        this.initAllGrids();

        // Trigger change detection
        this.cdr.detectChanges();

        // Mark first tab as visited and load data
        if (this.tabs.length > 0) {
          setTimeout(() => {
            this.visitedTabs.add(this.tabs[0].id);
            this.cdr.detectChanges();

            setTimeout(() => {
              this.onSearch();
            }, 150);
          }, 200);
        }
      },
      error: (err) => this.notify.error('Lỗi', 'Không tải được loại yêu cầu'),
    });
    this.subscriptions.push(sub);
  }

  // Initialize all grids
  initAllGrids() {
    this.tabs.forEach((tab) => {
      this.columnDefinitionsMap.set(tab.id, this.initGridColumns(tab.id));
      this.gridOptionsMap.set(tab.id, this.initGridOptions(tab.id));
      this.datasetsMap.set(tab.id, []);
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

  //#endregion

  // Helper methods for change tracking
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
  //#endregion

  //#region SlickGrid Methods
  // Initialize grid columns for a specific tab
  private initGridColumns(typeId: number): Column[] {
    const isRTCTab = typeId === 3 || typeId === 4;
    const isTBPTab = typeId === 4; // Tab 4 (Mượn demo) có TBP columns

    const columns: Column[] = [
      // TT - Row number
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 50,
        sortable: false,
        filterable: false,
      },
    ];

    // Add TBP columns only for typeId === 4 (Mượn demo)
    if (isTBPTab) {
      columns.push(
        {
          id: 'IsApprovedTBP',
          field: 'IsApprovedTBP',
          name: 'TBP duyệt',
          width: 80,
          sortable: true,
          filterable: true,
          formatter: Formatters.iconBoolean,
          params: { cssClass: 'mdi mdi-check' },
        },
        {
          id: 'ApprovedTBPName',
          field: 'ApprovedTBPName',
          name: 'TBP',
          width: 120,
          sortable: true,
          filterable: true,
          filter: { model: Filters['compoundInputText'] },
        },
        {
          id: 'DateApprovedTBP',
          field: 'DateApprovedTBP',
          name: 'Ngày TBP duyệt',
          width: 120,
          sortable: true,
          filterable: true,
          formatter: Formatters.date,
          params: { dateFormat: 'DD/MM/YYYY' },
          filter: { model: Filters['compoundDate'] },
        }
      );
    }

    // Add common columns - simplified version for demo tabs
    columns.push(
      {
        id: 'CustomerName',
        field: 'CustomerName',
        name: 'Khách hàng',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã dự án',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        field: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        name: 'Loại kho',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getProductGroupCollection(isRTCTab),
          collectionOptions: { addBlankEntry: false },
          editorOptions: { enableClear: true },
        },
        formatter: (row: number, cell: number, value: any) => {
          const groups = isRTCTab ? this.productRTC : this.productGroups;
          const group = groups.find((g: any) => g.ID === value);
          return group ? group.ProductGroupName : '';
        },
      },
      {
        id: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        field: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 160,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'ĐVT',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'WarehouseID',
        field: 'WarehouseID',
        name: 'Kho nhập hàng',
        width: 120,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getWarehouseCollection(),
          collectionOptions: { addBlankEntry: false },
          editorOptions: { enableClear: true },
        },
        formatter: (row: number, cell: number, value: any) => {
          const warehouse = this.lstWarehouses.find((w: any) => w.ID === value);
          return warehouse ? warehouse.WarehouseCode : '';
        },
      },
      {
        id: 'Manufacturer',
        field: 'Manufacturer',
        name: 'Hãng',
        width: 90,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'StatusRequestText',
        field: 'StatusRequestText',
        name: 'Trạng thái',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người YC',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'UpdatedName',
        field: 'UpdatedName',
        name: 'NV mua',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DateRequest',
        field: 'DateRequest',
        name: 'Ngày YC',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'DateReturnExpected',
        field: 'DateReturnExpected',
        name: 'Deadline',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getCurrencyCollection(),
          collectionOptions: { addBlankEntry: false },
          editorOptions: { enableClear: true },
        },
        formatter: (row: number, cell: number, value: any) => {
          const currency = this.currencies.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        },
      },
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'UnitPrice',
        field: 'UnitPrice',
        name: 'Đơn giá',
        width: 120,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 0,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalPrice',
        field: 'TotalPrice',
        name: 'Thành tiền',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalPriceExchange',
        field: 'TotalPriceExchange',
        name: 'Thành tiền QĐ',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'VAT',
        field: 'VAT',
        name: 'VAT (%)',
        width: 80,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TotaMoneyVAT',
        field: 'TotaMoneyVAT',
        name: 'Tổng tiền có VAT',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
        editor: {
          model: GroupSelectEditor,
          collection: this.getSupplierCollection(),
          collectionOptions: { addBlankEntry: false },
          editorOptions: { enableClear: true },
        },
        formatter: (row: number, cell: number, value: any) => {
          const supplier = this.supplierSales.find((s: any) => s.ID === value);
          return supplier ? supplier.NameNCC : '';
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['longText'],
        },
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsPaidLater',
        field: 'IsPaidLater',
        name: 'Trả sau',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        editor: {
          model: Editors['checkbox'],
        },
        filter: { model: Filters['compoundInputNumber'] },
      }
    );

    return columns;
  }

  // Initialize grid options
  private initGridOptions(typeId: number): GridOption {
    return {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-${typeId}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false, // Multiple Selections
      },
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
        columnIndexPosition: 0,
        width: 35,
      },
      editable: false,
      enableCellNavigation: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,
      enableGrouping: true,
      enableHeaderMenu: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 10,
      enablePagination: false,
    };
  }

  // Grid ready event handler
  angularGridReady(typeId: number, angularGrid: AngularGridInstance): void {
    this.angularGrids.set(typeId, angularGrid);

    if (!this.gridOptionsMap.has(typeId)) {
      this.columnDefinitionsMap.set(typeId, this.initGridColumns(typeId));
      this.gridOptionsMap.set(typeId, this.initGridOptions(typeId));
      this.datasetsMap.set(typeId, []);
    }

    this.ensureCheckboxSelector(angularGrid);

    // Setup grouping by ProjectFullName
    if (angularGrid && angularGrid.dataView) {
      const aggregators = [
        new Aggregators['Sum']('Quantity'),
        new Aggregators['Sum']('TotalPrice'),
        new Aggregators['Sum']('TotalPriceExchange'),
        new Aggregators['Sum']('TotaMoneyVAT'),
        new Aggregators['Sum']('CurrencyRate'),
        new Aggregators['Sum']('UnitPrice'),
      ];

      angularGrid.dataView.setGrouping({
        getter: 'ProjectFullName',
        formatter: (g: any) => {
          const projectName = g.value || '';
          return `Dự án: ${projectName} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
        },
        comparer: (a: any, b: any) => {
          return SortComparers.string(
            a.value,
            b.value,
            SortDirectionNumber.asc
          );
        },
        aggregators: aggregators,
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false,
      });

      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();
      this.ensureCheckboxSelector(angularGrid, 50);
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.ensureCheckboxSelector(angularGrid);
      if (angularGrid.slickGrid) {
        angularGrid.slickGrid.render();
      }
    }, 100);
  }

  // Helper method to ensure checkbox selector stays enabled
  private ensureCheckboxSelector(
    angularGrid: AngularGridInstance | undefined,
    delay: number = 0
  ): void {
    if (!angularGrid || !angularGrid.slickGrid) return;

    const enableCheckbox = () => {
      angularGrid!.slickGrid!.setOptions({
        enableCheckboxSelector: true,
        enableRowSelection: true,
        rowSelectionOptions: {
          selectActiveRow: false,
        },
        checkboxSelector: {
          hideInFilterHeaderRow: false,
          hideInColumnTitleRow: true,
          applySelectOnAllPages: true,
          columnIndexPosition: 0,
          width: 35,
        },
      });
      angularGrid!.slickGrid!.render();
    };

    if (delay > 0) {
      setTimeout(enableCheckbox, delay);
    } else {
      enableCheckbox();
    }
  }

  // Event handlers
  onCellClicked(typeId: number, e: Event, args: OnClickEventArgs): void {
    // Handle cell click events if needed
  }

  onCellChange(typeId: number, e: Event, args: OnCellChangeEventArgs): void {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return;

    const rowIndex = args.row;
    const item = angularGrid.dataView.getItem(rowIndex);
    if (!item) return;

    const column = args.column;
    const field = column?.field || '';
    const newValue = args.item?.[field];

    if (field && newValue !== undefined) {
      item[field] = newValue;
    }

    const columns = angularGrid.slickGrid.getColumns();
    const changedColumn = columns[args.cell];

    // Handle CurrencyID change
    if (field === 'CurrencyID') {
      const currencyId = Number(newValue) || 0;
      let newCurrencyRate = 0;

      if (currencyId > 0) {
        const currency = this.currencies.find((c: any) => c.ID === currencyId);
        if (currency) {
          newCurrencyRate = currency.CurrencyRate || 0;
        }
      }

      item.CurrencyRate = newCurrencyRate;
      this.recalculateTotals(item);

      const currencyRateColumn = columns.find(
        (col: any) => col.field === 'CurrencyRate'
      );
      if (currencyRateColumn) {
        const currencyRateColIndex = columns.indexOf(currencyRateColumn);
        angularGrid.dataView.updateItem(item.id, item);
        angularGrid.slickGrid.updateCell(rowIndex, currencyRateColIndex);
      }
    }

    // Recalculate totals when prices change
    if (
      changedColumn &&
      ['UnitPrice', 'Quantity', 'CurrencyRate', 'VAT'].includes(
        changedColumn.field || ''
      )
    ) {
      this.recalculateTotals(item);
    }

    // Track changes
    const rowId = Number(item.ID || 0);
    if (rowId > 0) {
      const existingIndex = this.changedRows.findIndex(
        (r: any) => Number(r.ID) === rowId
      );

      if (existingIndex >= 0) {
        this.changedRows[existingIndex] = { ...item };
      } else {
        this.changedRows.push({ ...item });
      }
    }

    angularGrid.dataView.updateItem(item.id, item);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
    this.ensureCheckboxSelector(angularGrid);
  }

  handleRowSelection(
    typeId: number,
    e: Event,
    args: OnSelectedRowsChangedEventArgs
  ): void {
    // Handle row selection changes if needed
  }

  // Getting selected rows
  private getSelectedGridData(typeId: number): any[] {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return [];
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);
  }

  // Recalculate totals for an item
  private recalculateTotals(item: any): void {
    const quantity = parseFloat(item.Quantity) || 0;
    const unitPrice = parseFloat(item.UnitPrice) || 0;
    const currencyRate = parseFloat(item.CurrencyRate) || 1;
    const vat = parseFloat(item.VAT) || 0;

    item.TotalPrice = quantity * unitPrice;
    item.TotalPriceExchange = item.TotalPrice * currencyRate;
    item.TotaMoneyVAT = item.TotalPriceExchange * (1 + vat / 100);
  }

  // Helper methods for collections
  private getProductGroupCollection(isRTC: boolean): Array<{ value: number; label: string }> {
    const groups = isRTC ? this.productRTC : this.productGroups;
    return (groups || []).map((g: any) => ({
      value: g.ID,
      label: g.ProductGroupName || '',
    }));
  }

  private getWarehouseCollection(): Array<{ value: number; label: string }> {
    return (this.lstWarehouses || []).map((w: any) => ({
      value: w.ID,
      label: w.WarehouseCode + ' - ' + w.WarehouseName || '',
    }));
  }

  private getCurrencyCollection(): Array<{
    value: number;
    label: string;
    currencyRate: number;
  }> {
    return (this.currencies || []).map((c: any) => ({
      value: c.ID,
      label: c.Code || '',
      currencyRate: c.CurrencyRate || 0,
    }));
  }

  private getSupplierCollection(): Array<{ value: number; label: string }> {
    return (this.supplierSales || []).map((s: any) => ({
      value: s.ID,
      label: `${s.CodeNCC || ''} - ${s.NameNCC || ''}`.replace(/^ - |^ -$| - $/g, '').trim() || s.NameNCC || '',
    }));
  }

  // Sum totals formatter
  sumTotalsFormatterWithFormat(totals: any, columnDef: any): string {
    const field = columnDef.field;
    const sum = totals.sum && totals.sum[field];
    const prefix = columnDef.params?.groupFormatterPrefix || '';

    if (sum !== undefined && sum !== null) {
      return `${prefix}${this.formatNumberEnUS(sum, 0)}`;
    }
    return '';
  }

  // Update editor collections
  private updateEditorLookups(): void {
    this.tabs.forEach((tab) => {
      const angularGrid = this.angularGrids.get(tab.id);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      // Update CurrencyID column
      const currencyColumn = columns.find(
        (col: any) => col.field === 'CurrencyID'
      );
      if (currencyColumn && currencyColumn.editor) {
        currencyColumn.editor.collection = this.getCurrencyCollection();
      }

      // Update SupplierSaleID column
      const supplierColumn = columns.find(
        (col: any) => col.field === 'SupplierSaleID'
      );
      if (supplierColumn && supplierColumn.editor) {
        supplierColumn.editor.collection = this.getSupplierCollection();
      }

      // Update ProductGroupID/ProductGroupRTCID columns
      const isRTCTab = tab.id === 3 || tab.id === 4;
      const productGroupField = isRTCTab
        ? 'ProductGroupRTCID'
        : 'ProductGroupID';
      const productGroupColumn = columns.find(
        (col: any) => col.field === productGroupField
      );
      if (productGroupColumn && productGroupColumn.editor) {
        productGroupColumn.editor.collection =
          this.getProductGroupCollection(isRTCTab);
      }

      // Update WarehouseID column
      const warehouseColumn = columns.find(
        (col: any) => col.field === 'WarehouseID'
      );
      if (warehouseColumn && warehouseColumn.editor) {
        warehouseColumn.editor.collection = this.getWarehouseCollection();
      }
    });

    // Sau khi cập nhật editor collections, cập nhật luôn header filter collections
    setTimeout(() => this.applyDistinctFilters(), 0);
  }
  //#endregion

  //#region Header filter helpers
  private getUniqueValues(data: any[], field: string): Array<{ value: string; label: string }> {
    const map = new Map<string, string>();
    data.forEach((row: any) => {
      const raw = row?.[field];
      // Bỏ qua giá trị null/undefined/rỗng
      if (raw === null || raw === undefined || raw === '') return;
      const key = String(raw);
      if (!map.has(key)) {
        map.set(key, key);
      }
    });
    return Array.from(map.entries())
      .map(([key, label]) => {
        // Giữ nguyên kiểu dữ liệu gốc cho value (number/bool/string) để filter khớp dữ liệu
        const originalSample = data.find((row: any) => String(row?.[field]) === key)?.[field];
        return { value: originalSample, label };
      })
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }

  /** Cập nhật collection cho các cột multipleSelect sau khi có dữ liệu */
  private applyDistinctFilters(): void {
    this.tabs.forEach(tab => {
      const angularGrid = this.angularGrids.get(tab.id);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const dataView = angularGrid.dataView;
      if (!dataView) return;

      const data = this.datasetsMap.get(tab.id) || [];
      if (!data || data.length === 0) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      const isRTCTab = tab.id === 3 || tab.id === 4;

      columns.forEach((column: any) => {
        if (column.filter && column.filter.model === Filters['multipleSelect']) {
          const field = column.field;
          if (!field) return;

          if (field === 'CurrencyID') {
            const filtered = this.getCurrencyCollection()
              .filter((x) => x.value > 0)
              .map((x) => ({ value: x.value, label: x.label }));
            column.filter.collection = filtered;
          } else if (field === 'SupplierSaleID') {
            const filtered = this.getSupplierCollection().filter((x) => x.value > 0);
            column.filter.collection = filtered;
          } else if (field === 'WarehouseID') {
            const filtered = this.getWarehouseCollection().filter((x) => x.value > 0);
            column.filter.collection = filtered;
          } else if (field === 'ProductGroupID' || field === 'ProductGroupRTCID') {
            const filtered = this.getProductGroupCollection(isRTCTab).filter((x) => x.value > 0);
            column.filter.collection = filtered;
          } else {
            column.filter.collection = this.getUniqueValues(data, field);
          }
        }
      });

      // Lưu lại column definitions để đồng bộ và render lại grid
      angularGrid.slickGrid.setColumns(columns);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đồng bộ vào map definitions (để lần sau init không mất filter collection)
      this.columnDefinitionsMap.set(tab.id, columns);
    });
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

    const modalRef = this.modalService.open(ProductRtcPurchaseRequestComponent, {
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
      TicketType: projectPartlistPurchaseRequestTypeID === 4 ? 1 : 0, // 4 = mượn demo (TicketType = 1), 3 = mua demo (TicketType = 0)
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

    const currentTab = this.tabs[this.activeTabIndex];
    if (!currentTab) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy tab!');
      return;
    }

    const angularGrid = this.angularGrids.get(currentTab.id);
    if (!angularGrid) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    // Lấy dòng đang được focus/selected
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    let rowData: any = null;

    if (selectedRowIndexes && selectedRowIndexes.length > 0) {
      rowData = angularGrid.dataView.getItem(selectedRowIndexes[0]);
    } else {
      // Nếu không có dòng được chọn, lấy dòng đầu tiên
      const allRows = angularGrid.dataView.getItems();
      if (allRows && allRows.length > 0) {
        rowData = allRows[0];
      }
    }

    if (!rowData) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn yêu cầu muốn sửa!');
      return;
    }
    const id = Number(rowData['ID'] || 0);

    // Kiểm tra ID > 0
    if (id === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn yêu cầu muốn sửa!');
      return;
    }

    // Lấy ProductRTCID từ row
    const productRTCID = Number(rowData['ProductRTCID'] || 0);

    // Lấy UpdatedName từ row
    const updatedName = String(rowData['UpdatedName'] || '').trim();

    // Gọi API để lấy model
    this.srv.getDetailByID(id).subscribe({
      next: (rs) => {
        const focusedModel = rs.data || rs;

        if (!focusedModel) {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy yêu cầu này!');
          return;
        }

        // Kiểm tra IsDeleted
        if (focusedModel.IsDeleted) {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Yêu cầu này đã bị xóa!');
          return;
        }

        // Kiểm tra IsApprovedTBP hoặc IsApprovedBGD
        if (focusedModel.IsApprovedTBP || focusedModel.IsApprovedBGD) {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Yêu cầu này đã được phê duyệt TBP!');
          return;
        }

        // Kiểm tra UpdatedName
        if (updatedName && updatedName !== '') {
          this.notify.warning(NOTIFICATION_TITLE.warning, 'Yêu cầu này đã có nhân viên mua!');
          return;
        }

        // Mở modal với productRTCID và model
        const modalRef = this.modalService.open(ProductRtcPurchaseRequestComponent, {
          centered: false,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'full-screen-modal'
        });

        // Truyền productRTCID và model vào modal
        modalRef.componentInstance.productRTCID = productRTCID;
        modalRef.componentInstance.projectPartlistDetail = {
          ...focusedModel,
          Unit: rowData['UnitName'] || '',
          CustomerID: rowData['CustomerID'] || 0,
          Maker: rowData['Manufacturer'] || '',
        };

        modalRef.result.then(
          () => {
            this.onSearch();
          },
          () => {
            this.onSearch();
          }
        );
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi lấy dữ liệu chi tiết!');
      }
    });
  }

  onDelete() {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const currentTab = this.tabs[this.activeTabIndex];
    if (!currentTab) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy tab!');
      return;
    }

    const rows = this.getSelectedGridData(currentTab.id);
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
      const duplicateId = changedRow.DuplicateId;

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
