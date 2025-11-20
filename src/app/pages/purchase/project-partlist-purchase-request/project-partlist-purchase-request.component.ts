import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
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
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, ColumnDefinition, RowComponent, CellComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
// import { PONCCDetailComponent } from '../poncc-detail/poncc-detail.component';
import { ProjectPartlistPurchaseRequestService } from './project-partlist-purchase-request.service';
import { RequestType, Currency } from './project-partlist-purchase-request.model';

@Component({
  selector: 'app-project-partlist-purchase-request',
  standalone: true,
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
  ],
  templateUrl: './project-partlist-purchase-request.component.html',
  styleUrls: ['./project-partlist-purchase-request.component.css'],
})
export class ProjectPartlistPurchaseRequestComponent implements OnInit, AfterViewInit {
  // UI state
  // Kích thước panel tìm kiếm khi mở (có thể đổi sang '320px' nếu muốn cố định)
  searchSize: string = '30%';
  isLoading = false;
  lstPOKH: any[] = [];
  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
  keyword: string = '';
  // Advanced filters (giống pattern HiringRequest)
  statusRequestFilter: number = 0; // 0: tất cả
  supplierSaleFilter: number = 0;
  isApprovedTBPFilter: number = -1; // -1: tất cả, 0: chưa, 1: đã
  isApprovedBGDFilter: number = -1; // -1: tất cả, 0: chưa, 1: đã
  isDeletedFilter: number = 0; // 0: chưa xóa, 1: đã xóa, -1: tất cả
  projectIdFilter: number = 0;
  pokhIdFilter: number = 0;

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
    FullName: 'NV đề nghị',
    DateRequest: 'Ngày yêu cầu',
    DateReturnExpected: 'Ngày yêu cầu hàng về',
    Quantity: 'Số lượng',
    UnitPrice: 'Đơn giá',
    TotalPrice: 'Thành tiền',
    RequestDate: 'Ngày đề nghị',
    DeadlineDelivery: 'Thời hạn',
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
    ProductGroupID: 'Nhóm SP',
    ProductSaleID: 'SP Sale',
    UnitName: 'ĐVT',
    ProductNewCode: 'Mã nội bộ',
    IsImport: 'Hàng nhập khẩu',
    CurrencyID: 'Tiền tệ',
    HistoryPrice: 'Đơn giá lịch sử',
    CurrencyRate: 'Tỷ giá',
    TotalPriceExchange: 'Thành tiền quy đổi',
    LeadTime: 'Lead time',
    UnitFactoryExportPrice: 'Đơn giá xuất xưởng',
    UnitImportPrice: 'Đơn giá nhập khẩu',
    TotalImportPrice: 'Thành tiền NK',
    IsRequestApproved: 'Yêu cầu duyệt',
    Manufacturer: 'Hãng sản xuất',
    ReasonCancel: 'Lý do',
    ProjectID: 'Dự án ID',
    ProjectName: 'Tên dự án',
    UpdatedName: 'NV mua',
    VAT: 'VAT',
    TotaMoneyVAT: 'Thành tiền VAT',
    TotalDayLeadTime: 'Số ngày Leadtime',
    PONCCID: 'PO NCC',
    BillCode: 'Số hóa đơn',
    UnitPricePOKH: 'Đơn giá PO KH',
    CustomerName: 'Tên KH',
    IsCommercialProduct: 'Hàng thương mại',
    IsDeleted: 'Đã hủy',
    Model: 'Model',
    JobRequirementID: 'YCMH ID',
    CustomerID: 'KH ID',
    ProjectTypeName: 'Loại dự án',
    PONumber: 'PO KH',
    GuestCode: 'Mã khách',
    CustomerCode: 'Mã KH',
    ProjectCode: 'Mã dự án',
    POKHCode: 'Mã PO KH',
    StatusPOKHText: 'Trạng thái PO KH',
    SpecialCode: 'Mã đặc biệt',
    TotalPriceHistory: 'Tổng giá lịch sử',
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
    FullNamePriceRequest: 'NV hỏi giá',
    UnitNameNew: 'ĐVT mới',
    UnitPricetext: 'Đơn giá (text)',
    POKHDetailID: 'PO KH Detail',
    ProductGroupRTCID: 'Nhóm SP RTC',
    ProductRTCID: 'SP RTC',
    ProductCodeRTC: 'Mã RTC',
    ProjectPartlistPurchaseRequestTypeID: 'Loại yêu cầu',
    TotalHN:'Tồn CK HN',
    TotalHCM:'Tồn CK HCM',
    TotalHP:'Tồn CK HP',
    TotalDP:'Tồn CK DP',
  TotalBN:'Tồn CK BN'
  };

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

  // Thứ tự cột hiển thị theo VisibleIndex trong form WinForms
  private FORM_COLUMN_ORDER: string[] = [
    'IsRequestApproved',
    'IsApprovedBGD',
    'TT',
    'CustomerName',
    'ProjectCode',
    'ProductCode',
    'ProductName',
    'Manufacturer',
    'Quantity',
    'ProductNewCode',
    'UnitName',
    'TicketTypeText',
    'StatusRequestText',
    'FullName',
    'UpdatedName',
    'OriginQuantity',
    'TargetPrice',
    'DateRequest',
    'DeadlineDelivery',
    'UnitMoney',
    'CurrencyRate',
    'UnitPrice',
    'VAT',
    'TotaMoneyVAT',
    'SupplierSaleID',
    'LeadTime',
    'Note',
    'NotePartlist',
    'NoteMarketing',
    'DateOrder',
    'ReasonCancel',
    'DateReturnExpected',
    'DateReturnActual',
    'DateReceive',
    'IsImport',
    'UnitFactoryExportPrice',
    'UnitImportPrice',
    'TotalImportPrice',
    'TotalHN',
    'TotalHCM',
    'TotalHP',
    'TotalDP',
    'TotalBN'
  ];

  constructor(
    private srv: ProjectPartlistPurchaseRequestService,
    private notify: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getRequestTypes();
    this.loadLookups();
  }

  ngAfterViewInit(): void {
    // Khởi tạo bảng sau khi containers sẵn sàng và mỗi khi danh sách containers thay đổi
    this.containers.changes.subscribe(() => this.initTables());
    this.initTables();
    // Đảm bảo panel tìm kiếm mở ở kích thước mong muốn sau khi bảng/tabulator render xong
    setTimeout(() => {
      if (this.searchSize === '0') this.searchSize = '30%';
    }, 300);
  }

  // ========== Lookups ==========
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
  }

  private updateEditorLookups() {
    if (!this.tables || this.tables.length === 0) return;
    this.tables.forEach((t) => {
      if (!t) return;
      try {
        t.updateColumnDefinition('CurrencyID', {
          editorParams: { values: this.currencies.map((c) => ({ value: c.ID, label: c.Code })) },
        } as any);
        t.updateColumnDefinition('ProductGroupID', {
          editorParams: { values: this.productGroups.map((g) => ({ value: g.ID, label: g.ProductGroupName })) },
        } as any);
        t.updateColumnDefinition('SupplierSaleID', {
          editorParams: { values: this.supplierSales.map((s) => ({ value: s.ID, label: s.NameNCC })) },
        } as any);
      } catch {}
    });
  }

  // ========== Tabs ==========
  getRequestTypes() {
    this.srv.getRequestTypes().subscribe({
      next: (types: RequestType[]) => {
        this.tabs = (types || []).map((t) => ({ id: t.ID, title: t.RequestTypeName.toUpperCase() }));
        // Sau khi có tabs, tải dữ liệu
        this.onSearch();
      },
      error: (err) => this.notify.error('Lỗi', 'Không tải được loại yêu cầu'),
    });
  }
getPOKH(){
  this.srv.getPOKH().subscribe({
    next: (res) => {
      this.lstPOKH = res || [];
    },
  });
}
  onTabChange(index: number) {
    this.activeTabIndex = index;
    // cập nhật dữ liệu hiển thị
    this.refreshTable(index);
  }

  // ========== Tables ==========
  private initTables() {
    if (!this.containers || this.containers.length === 0) return;
    // Tạo một bảng cho mỗi tab
    this.tables = this.containers.toArray().map((ref, idx) => {
      const table = new Tabulator(ref.nativeElement, {
        ...DEFAULT_TABLE_CONFIG,
        height:'86vh',
        paginationMode: 'local',
        columns: this.buildColumns(),
        data: [],
        // Context menu cho dòng: thao tác theo ảnh WinForms
        rowContextMenu: () => this.buildRowContextMenu(idx),
      });
      // Đăng ký sự kiện cellEdited sau khi khởi tạo để phù hợp typings
      table.on('cellEdited', (cell: CellComponent) => this.onCellEdited(cell));
      // Gắn menu header cho toàn bộ cột sau khi bảng đã có columns
      this.applyHeaderMenus(table);
      return table;
    });
    // Sau khi khởi tạo, đổ dữ liệu lần đầu
    this.refreshAllTables();
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
    } catch {}
    return items;
  }

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
    } catch {}
  }

  // Menu chuột phải trên dòng (theo ảnh WinForms)
  private buildRowContextMenu(idx: number): any[] {
    return [
      { label: 'Duplicate', action: () => this.onDuplicateSelected(idx) },
      { label: 'Tạo PO NCC', action: () => this.onCreatePONCC(idx) },
      { label: 'Lịch sử hỏi giá', action: () => this.onHistoryPrice(idx) },
      { label: 'Hàng nhập khẩu', action: () => this.onToggleImport(true, idx) },
      { label: 'Hủy hàng nhập khẩu', action: () => this.onToggleImport(false, idx) },
      { label: 'Yêu cầu duyệt mua', action: () => this.onRequestApproved(idx, true) },
      { label: 'Hủy yêu cầu duyệt mua', action: () => this.onRequestApproved(idx, false) },
      { label: 'Nhập kho', action: () => this.onImportWarehouse(idx) },
      { label: 'Xem PO', action: () => this.onShowPO(idx) },
      { separator: true },
      { label: 'Giữ hàng', action: () => this.onKeepProduct(idx) },
      { label: 'Hủy giữ hàng', action: () => this.onUnkeepProduct(idx) },
      { label: 'Cập nhật mã nội bộ', action: () => this.onUpdateInternalCode(idx) },
    ];
  }

  private buildColumns(): ColumnDefinition[] {
    // Danh sách cột theo yêu cầu (sẽ loại trùng)
    const colsText = `ID TotalBillImport ProjectCode ProjectName ProjectFullName TT ProductCode ProductName StatusRequest StatusRequestText FullName DateRequest DateReturnExpected Quantity UnitPrice TotalPrice RequestDate DeadlineDelivery DateReturnActual DateReceive Note NameNCC ProjectPartListID SupplierSaleID UnitMoney IsApprovedTBP IsApprovedBGD ApprovedTBP ApprovedTBPName ApprovedBGD ApprovedBGDName DateApprovedTBP DateApprovedBGD ProductGroupID ProductSaleID ProductNewCode IsImport CurrencyID CurrencyRate TotalPriceExchange LeadTime UnitFactoryExportPrice UnitImportPrice TotalImportPrice IsRequestApproved Manufacturer ReasonCancel ProjectID UpdatedName VAT TotaMoneyVAT TotalDayLeadTime PONCCID BillCode UnitPricePOKH IsCommercialProduct IsDeleted Model JobRequirementID CustomerID ProjectTypeName CustomerName PONumber GuestCode CustomerCode POKHCode StatusPOKHText SpecialCode HistoryPrice TotalPriceHistory IsTechBought IsApprovedBGDText ProductGroupRTCID ProductRTCID ProductNewCodeSale NotePartlist TicketType TicketTypeText DateReturnEstimated IsStock ProductCodeRTC TotalBillImportCount ProjectPartlistPurchaseRequestTypeID UnitCountID NoteMarketing UnitName FullNamePriceRequest UnitNameNew UnitPricetext POKHDetailID InventoryProjectID TargetPrice DuplicateID OriginQuantity TotalHN TotalHCM TotalBN TotalHP TotalBH TotalDP`;

    const unique = Array.from(new Set(colsText.split(/\s+/).filter(Boolean)));
    const visibleOnly = new Set<string>([
      'Note','ProjectFullName','TT','ProductCode','ProductName','StatusRequestText','FullName','DateRequest','DateReturnExpected','Quantity','UnitPrice','TotalPrice','RequestDate','DeadlineDelivery','DateReturnActual','DateReceive','SupplierSaleID','IsApprovedBGD','ProductGroupID','UnitName','ProductNewCode','IsImport','CurrencyID','HistoryPrice','CurrencyRate','TotalPriceExchange','LeadTime','UnitFactoryExportPrice','UnitImportPrice','TotalImportPrice','IsRequestApproved','Manufacturer','ReasonCancel','UpdatedName','VAT','TotaMoneyVAT','TotalDayLeadTime','BillCode','UnitPricePOKH','CustomerName','Model','GuestCode','ProjectCode','POKHCode','StatusPOKHText','SpecialCode','TotalPriceHistory','NotePartlist','TargetPrice','OriginQuantity','DateReturnEstimated'
    ]);

    const columnsMap = new Map<string, ColumnDefinition>();
    unique.forEach((field) => {
      columnsMap.set(field, {
        field,
        title: this.CAPTION_MAP[field] || field,
        headerSort: true,
        width: 120,
        visible: visibleOnly.has(field),
        // sẽ gắn headerContextMenu sau khi bảng khởi tạo
        headerContextMenu: [] as any,
      } as ColumnDefinition);
    });

    // Một số cột phổ biến ở trái
    ['ID', 'ProjectCode', 'ProductCode', 'ProductName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.frozen = true;
        col.width = f === 'ProductName' ? 220 : 120;
      }
    });

    // Editor numeric
    ['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'TargetPrice'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.editor = 'input';
        col.mutator = (value) => {
          const v = Number(value);
          return isNaN(v) ? 0 : v;
        };
      }
    });

    // Chỉ cho sửa Số lượng khi là bản Duplicate
    const qtyCol = columnsMap.get('Quantity');
    if (qtyCol) {
      (qtyCol as any).editable = (cell: any) => {
        const rd = cell.getRow?.().getData?.() || {};
        return Number(rd['DuplicateID'] || 0) > 0;
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
      'TargetPrice',
      'HistoryPrice',
      'UnitPricePOKH',
      // tồn kho theo kho (số lượng dùng)
      'TotalHN','TotalHCM','TotalHP','TotalDP','TotalBN'
    ];
    moneyCols.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = (cell) => this.formatNumberEnUS(cell.getValue(), 2);
        col.hozAlign = 'right';
        (col as any).headerHozAlign = 'right';
      }
    });

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
        col.width = Math.max(currentWidth, 240);
        col.hozAlign = 'left';
        (col as any).headerHozAlign = 'center';
      }
    });

    // Widen name-related columns (nhân viên, duyệt)
    ['FullName', 'UpdatedName', 'ApprovedTBPName', 'ApprovedBGDName'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        const currentWidth = typeof col.width === 'number' ? col.width : Number(col.width) || 0;
        col.width = Math.max(currentWidth, 220);
        col.hozAlign = 'left';
        (col as any).headerHozAlign = 'center';
      }
    });

    // Widen SupplierSaleID (hiển thị tên NCC qua formatter)
    const supplierIdCol = columnsMap.get('SupplierSaleID');
    if (supplierIdCol) {
      const currentWidth = typeof supplierIdCol.width === 'number' ? supplierIdCol.width : Number(supplierIdCol.width) || 0;
      supplierIdCol.width = Math.max(currentWidth, 240);
      supplierIdCol.hozAlign = 'left';
      (supplierIdCol as any).headerHozAlign = 'center';
    }

    // Đảm bảo các cột tồn kho TotalHN/HCM/HP/DP/BN luôn hiển thị và căn phải
    ['TotalHN','TotalHCM','TotalHP','TotalDP','TotalBN'].forEach((f)=>{
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

    // Boolean fields: chỉ hiển thị checkbox, KHÔNG cho edit/toggle
    const boolExclude = new Set<string>(['IsApprovedBGDText']);
    const boolCandidates = unique
      .filter((f) => f.startsWith('Is'))
      .filter((f) => !boolExclude.has(f))
      .concat(['IsImport', 'IsStock']);
    boolCandidates.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) {
        col.formatter = 'tickCross';
        col.hozAlign = 'center';
        (col as any).headerHozAlign = 'center';
        // khóa chỉnh sửa
        (col as any).editable = false;
        delete (col as any).cellClick;
        delete (col as any).editor;
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
      pgCol.editor = 'list';
      pgCol.editorParams = {
        values: this.productGroups.map((g) => ({ value: g.ID, label: g.ProductGroupName })),
      };
      pgCol.formatter = (cell) => {
        const id = cell.getValue();
        const g = this.productGroups.find((x) => x.ID === id);
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

    // Tính tổng ở footer
    ['TotalBillImport', 'TotalPrice', 'TotalPriceExchange', 'TotalImportPrice', 'TotaMoneyVAT','TotalHN','TotalHCM','TotalHP','TotalDP','TotalBN'].forEach((f) => {
      const col = columnsMap.get(f);
      if (col) col.bottomCalc = 'sum';
    });

    // Sắp xếp theo FORM_COLUMN_ORDER, các cột còn lại ẩn và đặt sau
    const ordered: ColumnDefinition[] = [];
    this.FORM_COLUMN_ORDER.forEach((f) => {
      const col = columnsMap.get(f);
      if (col) ordered.push(col);
    });
    unique
      .filter((f) => !this.FORM_COLUMN_ORDER.includes(f))
      .forEach((f) => {
        const col = columnsMap.get(f);
        if (col) {
          (col as any).visible = false;
          ordered.push(col);
        }
      });

    return ordered;
  }

  private onCellEdited(cell: CellComponent): void {
    const row = cell.getRow();
    const data = row.getData() as any;
    const field = (cell as any).getField ? (cell as any).getField() : '';
    const newValue = cell.getValue();
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
    if (field === 'CurrencyID') {
      const id = Number(newValue ?? data['CurrencyID']) || 0;
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
        } catch {}
        row.update({ CurrencyRate: rate, UnitMoney: cur['Code'] });
      }
    }

    // Nếu thay đổi các cột ảnh hưởng đến tổng, tính lại
    if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'CurrencyID'].includes(field)) {
      const q = field === 'Quantity' ? Number(newValue) || quantity : quantity;
      const up = field === 'UnitPrice' ? Number(newValue) || unitPrice : unitPrice;
      const cr = field === 'CurrencyRate' ? Number(newValue) || currencyRate : (field === 'CurrencyID' ? Number((row.getData() as any)['CurrencyRate']) || currencyRate : currencyRate);
      const uip = field === 'UnitImportPrice' ? Number(newValue) || unitImportPrice : unitImportPrice;
      const v = field === 'VAT' ? Number(newValue) || vat : vat;
      const tp = q * up;
      const tpex = tp * cr;
      const tip = uip * q;
      const tmv = tp + (tp * v) / 100;
      row.update({ TotalPrice: tp, TotalPriceExchange: tpex, TotalImportPrice: tip, TotaMoneyVAT: tmv });
    }

    // Track edited
    const id = Number(data['ID']);
    if (id > 0) this.editedMap.set(id, row.getData());
  }

  private refreshAllTables() {
    this.tabs.forEach((_, idx) => this.refreshTable(idx));
  }

  private refreshTable(idx: number) {
    const tab = this.tabs[idx];
    const table = this.tables?.[idx];
    if (!tab || !table) return;
    const data = this.dataByType.get(tab.id) || [];
    // Use try-catch to handle table initialization timing
    try {
      table.setData(data);
    } catch (error) {
      // If table not ready, wait for tableBuilt event
      table.on('tableBuilt', () => {
        table.setData(data);
      });
    }
  }

  // ========== Data loading ==========
  onSearch() {
    if (!this.tabs || this.tabs.length === 0) return;
    this.isLoading = true;
    const filter = {
      DateStart: this.toStartOfDayISO(this.dateStart),
      DateEnd: this.toEndOfDayISO(this.dateEnd),
      StatusRequest: this.statusRequestFilter,
      ProjectID: this.projectIdFilter || 0,
      Keyword: this.keyword?.trim() || '',
      SupplierSaleID: this.supplierSaleFilter || 0,
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
        // Phân loại theo ProjectPartlistPurchaseRequestTypeID
        this.dataByType.clear();
        this.tabs.forEach((t) => {
          const dt = data.filter(
            (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) === Number(t.id)
          );
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
  }

  ToggleSearchPanel() {
    // Toggle giữa đóng (0) và mở (28% mặc định). Bạn có thể điều chỉnh lên 32% hoặc '360px' tùy ý.
    this.searchSize = this.searchSize === '0' ? '40%' : '0';
  }

  resetSearch(): void {
    this.dateStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.dateEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
    this.keyword = '';
    this.statusRequestFilter = 0;
    this.supplierSaleFilter = 0;
    this.isApprovedTBPFilter = -1;
    this.isApprovedBGDFilter = -1;
    this.isDeletedFilter = 0;
    this.onSearch();
  }

  private toStartOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString();
  }
  private toEndOfDayISO(d: Date): string {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.toISOString();
  }

  // ========== Actions ==========
  saveChanges() {
    const changes = Array.from(this.editedMap.values());
    if (changes.length === 0) {
      this.notify.info('Thông báo', 'Không có thay đổi để lưu');
      return;
    }
    this.srv.saveChanges(changes).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã lưu thay đổi');
        this.editedMap.clear();
        this.onSearch();
      },
      error: (err) => this.notify.error('Lỗi', 'Lưu thay đổi thất bại'),
    });
  }

  private getSelectedRowsData(idx: number): any[] {
    const table = this.tables?.[idx];
    if (!table) return [];
    return (table.getSelectedData() as any[]) || [];
  }

  onCheckOrder(idx: number): void {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng để check');
      return;
    }
    const payload = rows.map((r) => ({ ID: r['ID'], EmployeeIDRequestApproved: this.srv.employeeID }));
    this.srv.checkOrder(payload).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã xử lý check');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Check thất bại'),
    });
  }

  onUncheckOrder(idx: number): void {
    // API đang toggle, gọi lại như onCheckOrder
    this.onCheckOrder(idx);
  }

  onCancelRequest(idx: number): void {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng để hủy');
      return;
    }
    const payload = rows.map((r) => ({ ID: r['ID'], IsDeleted: true, InventoryProjectID: r['InventoryProjectID'] || 0 }));
    this.srv.cancelRequest(payload).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã hủy yêu cầu');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Hủy yêu cầu thất bại'),
    });
  }

  onRequestApproved(idx: number, isApproved: boolean): void {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng');
      return;
    }
    const payload = rows.map((r) => ({
      ID: r['ID'],
      IsRequestApproved: isApproved ? 1 : 0,
      EmployeeIDRequestApproved: this.srv.employeeID,
    }));
    this.srv.requestApproved(payload).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã cập nhật yêu cầu duyệt');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Cập nhật yêu cầu duyệt thất bại'),
    });
  }

  onApproveBGD(isApproved: boolean, idx: number): void {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng');
      return;
    }
    const payload = rows.map((r) => ({ ID: r['ID'], IsApprovedBGD: isApproved ? 1 : 0 }));
    this.srv.approve(payload).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã cập nhật duyệt BGĐ');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Cập nhật duyệt BGĐ thất bại'),
    });
  }

  onCompleteRequest(idx: number): void {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng');
      return;
    }
    const now = new Date().toISOString();
    const payload = rows.map((r) => ({ ID: r['ID'], StatusRequest: 5, DateReturnActual: now }));
    this.srv.completeRequest(payload).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã cập nhật hoàn thành');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Cập nhật hoàn thành thất bại'),
    });
  }

  // Stubs / TODOs
  onEdit() {
    this.notify.info('Thông báo', 'Chức năng Sửa sẽ được bổ sung.');
  }
  onAddSupplierSale() {
    this.notify.info('Thông báo', 'Thêm NCC sẽ được bổ sung.');
  }
  onCreatePONCC(idx: number) {
    // const table = this.tables?.[idx];
    // const selected = (table?.getSelectedData() as any[]) || [];

    // // 1. Check có rows được chọn không
    // if (!selected.length) {
    //   this.notify.warning('Thông báo', 'Chọn dòng để tạo PO NCC');
    //   return;
    // }

    // // 2. Validate: tất cả rows phải cùng 1 supplier
    // const supplierIDs = [...new Set(selected.map(r => r.SupplierSaleID).filter(id => id))];
    // if (supplierIDs.length > 1) {
    //   this.notify.error('Lỗi', 'Vui lòng chỉ chọn sản phẩm từ 1 Nhà cung cấp!');
    //   return;
    // }
    // if (supplierIDs.length === 0) {
    //   this.notify.error('Lỗi', 'Các sản phẩm được chọn chưa có Nhà cung cấp!');
    //   return;
    // }

    // // 3. Validate business rules
    // const errors: string[] = [];

    // for (const row of selected) {
    //   const productName = row.ProductName || row.ProductCode || 'Sản phẩm';

    //   // BGD approval check (except for commercial or special types)
    //   if (!row.IsApprovedBGD && !row.IsCommercialProduct && row.TicketType !== 1) {
    //     errors.push(`${productName}: Chưa được BGD duyệt`);
    //   }

    //   // Internal code check
    //   if (!row.ProductNewCode) {
    //     errors.push(`${productName}: Chưa có mã nội bộ (ProductNewCode)`);
    //   }

    //   // Currency check
    //   if (!row.CurrencyID || row.CurrencyID <= 0) {
    //     errors.push(`${productName}: Chưa chọn loại tiền tệ`);
    //   }

    //   // Supplier check
    //   if (!row.SupplierSaleID || row.SupplierSaleID <= 0) {
    //     errors.push(`${productName}: Chưa có nhà cung cấp`);
    //   }

    //   // Unit price check (for non-borrow products)
    //   if (row.TicketType !== 1 && (!row.UnitPrice || row.UnitPrice <= 0)) {
    //     errors.push(`${productName}: Chưa có đơn giá`);
    //   }

    //   // For borrow products: TBP approval required
    //   if (row.TicketType === 1 && !row.IsApprovedTBP) {
    //     errors.push(`${productName}: Hàng mượn chưa được TBP duyệt`);
    //   }
    // }

    // if (errors.length > 0) {
    //   const errorMsg = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... và ${errors.length - 5} lỗi khác` : '');
    //   this.notify.error('Lỗi Validation', errorMsg);
    //   return;
    // }

    // // 4. Detect currency (nếu nhiều currency → 0, nếu 1 currency → use it)
    // const currencyIDs = [...new Set(selected.map(r => r.CurrencyID).filter(id => id))];
    // const detectedCurrencyID = currencyIDs.length === 1 ? currencyIDs[0] : 0;

    // // 5. Prepare data for PONCC detail form
    // const purchaseRequests = selected.map(row => ({
    //   ID: row.ID,
    //   ProductSaleID: row.ProductSaleID,
    //   ProductRTCID: row.ProductRTCID,
    //   Quantity: row.Quantity,
    //   UnitPrice: row.UnitPrice,
    //   SupplierSaleID: row.SupplierSaleID,
    //   ProjectPartListID: row.ProjectPartListID,
    //   EmployeeID: row.EmployeeID,
    //   ProjectID: row.ProjectID,
    //   ProjectName: row.ProjectName,
    //   Deadline: row.Deadline,
    //   ProductCode: row.ProductCode,
    //   ProductNewCode: row.ProductNewCode,
    //   VAT: row.VAT,
    //   GuestCode: row.GuestCode,
    //   IsCommercialProduct: row.IsCommercialProduct,
    //   HistoryPrice: row.HistoryPrice,
    //   DateReturnEstimated: row.DateReturnEstimated,
    //   TicketType: row.TicketType,
    //   IsStock: row.IsStock,
    //   ProductGroupID: row.ProductGroupID,
    //   UnitName: row.UnitName,
    //   SpecialCode: row.SpecialCode,
    //   CurrencyID: row.CurrencyID
    // }));

    // // 6. Open PONCC Detail modal/component
    // const modalRef = this.modalService.open(PONCCDetailComponent, {
    //   centered: true,
    //   size: 'xl',
    //   backdrop: 'static',
    //   keyboard: false,
    // });

    // const instance = modalRef.componentInstance as any;
    // instance.purchaseRequests = purchaseRequests;
    // instance.initialSupplierID = supplierIDs[0];
    // instance.initialCurrencyID = detectedCurrencyID;
    // instance.mode = 'create-from-request';

    // modalRef.result.then(
    //   (result) => {
    //     if (result === 'saved') {
    //       this.notify.success('Thành công', 'Đã tạo PO NCC!');
    //       this.onSearch(); // Refresh data
    //     }
    //   },
    //   () => {} // Dismissed
    // );
  }
  onExportExcel(idx: number) {
    this.notify.info('Thông báo', 'Xuất Excel sẽ được bổ sung.');
  }
  onDownloadFiles(idx: number) {
    this.notify.info('Thông báo', 'Tải file sẽ được bổ sung.');
  }

  // ====== Context menu handlers ======
  onDuplicateSelected(idx: number) {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng để Duplicate');
      return;
    }
    const first = rows[0];
    this.srv.duplicate(first).subscribe({
      next: (newId) => {
        this.notify.success('Thành công', 'Đã Duplicate');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Duplicate thất bại'),
    });
  }
  onToggleImport(isImport: boolean, idx: number) {
    const table = this.tables?.[idx];
    const rows = (table?.getSelectedRows() || []) as any[];
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng');
      return;
    }
    rows.forEach((r) => r.update({ IsImport: isImport ? 1 : 0 }));
    this.notify.success('Thành công', isImport ? 'Đã chuyển Hàng nhập khẩu' : 'Đã hủy Hàng nhập khẩu');
  }
  onKeepProduct(idx: number) {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng để giữ hàng');
      return;
    }
    this.srv.keepProduct(rows).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã giữ hàng');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Giữ hàng thất bại'),
    });
  }
  onUnkeepProduct(idx: number) {
    const rows = this.getSelectedRowsData(idx);
    if (rows.length === 0) {
      this.notify.warning('Thông báo', 'Chọn dòng để hủy giữ hàng');
      return;
    }
    // Giả sử API keepProduct toggle, gọi lại
    this.srv.keepProduct(rows).subscribe({
      next: () => {
        this.notify.success('Thành công', 'Đã hủy giữ hàng');
        this.onSearch();
      },
      error: () => this.notify.error('Lỗi', 'Hủy giữ hàng thất bại'),
    });
  }
  onHistoryPrice(idx: number) {
    this.notify.info('Thông báo', 'Lịch sử hỏi giá sẽ được bổ sung.');
  }
  onImportWarehouse(idx: number) {
    this.notify.info('Thông báo', 'Nhập kho sẽ được bổ sung.');
  }
  onShowPO(idx: number) {
    this.notify.info('Thông báo', 'Xem PO sẽ được bổ sung.');
  }
  onUpdateInternalCode(idx: number) {
    this.notify.info('Thông báo', 'Cập nhật mã nội bộ sẽ được bổ sung.');
  }
}
