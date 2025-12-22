import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, TemplateRef, ChangeDetectorRef, Input, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  GroupTotalFormatters,
  AngularSlickgridModule
} from 'angular-slickgrid';
import { SortDirectionNumber } from '@slickgrid-universal/common';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
import { ProjectPartlistPurchaseRequestParam } from '../project-partlist-purchase-request.model';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { Subscription } from 'rxjs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { SupplierSaleDetailComponent } from '../../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { HistoryPriceComponent } from '../history-price/history-price.component';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { PonccDetailComponent } from '../../poncc/poncc-detail/poncc-detail.component';
import { PONCCService } from '../../poncc/poncc.service';

interface Tab {
  id: number;
  title: string;
}

@Component({
  selector: 'app-project-part-list-purchase-request-slick-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzTabsModule,
    NzSpinModule,
    NzModalModule,
    NzDropDownModule,
    NgbModule,
    HasPermissionDirective
  ],
  templateUrl: './project-part-list-purchase-request-slick-grid.component.html',
  styleUrls: ['./project-part-list-purchase-request-slick-grid.component.css']
})
export class ProjectPartListPurchaseRequestSlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rejectReasonTpl', { static: false }) rejectReasonTpl!: TemplateRef<any>;

  // Grid instances for each tab
  angularGrids: Map<number, AngularGridInstance> = new Map();
  columnDefinitionsMap: Map<number, Column[]> = new Map();
  gridOptionsMap: Map<number, GridOption> = new Map();
  datasetsMap: Map<number, any[]> = new Map();

  // Tabs
  tabs: Tab[] = [];
  activeTabIndex: number = 0;
  requestTypes: any[] = [];
  visitedTabs: Set<number> = new Set(); // Track which tabs have been visited

  // Get filtered tabs based on isApprovedTBP
  get filteredTabs(): Tab[] {
    if (this.isApprovedTBP) {
      // Chỉ hiển thị tab Mượn demo (id = 4)
      return this.tabs.filter(tab => tab.id === 4);
    }
    return this.tabs;
  }

  // Get typeId from activeTabIndex (sử dụng filteredTabs)
  getActiveTabTypeId(): number | undefined {
    return this.filteredTabs[this.activeTabIndex]?.id;
  }

  // Get typeId from tabIndex (sử dụng filteredTabs)
  getTypeIdFromTabIndex(tabIndex: number): number | undefined {
    return this.filteredTabs[tabIndex]?.id;
  }

  // Data
  dtproducts: any[] = [];
  dtproductGroups: any[] = [];
  dtproductGroupsRTC: any[] = [];
  dtSupplierSale: any[] = [];
  dtcurrency: any[] = [];
  dtprojects: any[] = [];
  dtwarehouses: any[] = [];
  lstPOKH: any[] = [];

  // Filters
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);
  keyword: string = '';
  statusRequestFilter: number = 1;
  projectIdFilter: number | null = null;
  supplierId: number | null = null;
  isDeletedFilter: number = 0;
  isApprovedBGDFilter: number = -1;
  isApprovedTBPFilter: number = -1;
  pokhIdFilter: number | null = null;

  // Filter options
  statusOptions: any[] = [
    { value: 0, label: '--Tất cả--' },
    { value: 1, label: 'Yêu cầu mua / mượn hàng' },
    { value: 2, label: 'Huỷ yêu cầu mua hàng' },
    { value: 3, label: 'Đã đặt hàng' },
    { value: 4, label: 'Đang về' },
    { value: 5, label: 'Đã về' },
    { value: 6, label: 'Không đặt hàng' }
  ];

  deletedOptions: any[] = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa xóa' },
    { value: 1, label: 'Đã xóa' }
  ];

  approvalOptions: any[] = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa duyệt' },
    { value: 1, label: 'Đã duyệt' }
  ];

  projects: any[] = [];
  supplierSales: any[] = [];

  // UI state
  @Input() showHeader: boolean = false;
  @Input() headerText: string = 'YÊU CẦU MUA HÀNG';
  @Input() showCloseButton: boolean = false;
  @Input() isYCMH: boolean = false;
  showSearchBar: boolean = true;
  @Input() isApprovedTBP: boolean = false;
  @Input() isSelectedPO: boolean = false;
  @Input() isApprovedBGD: boolean = false;
  @Input() listRequestBuySelect: boolean = false;
  shouldShowSearchBar: boolean = true;
  isLoading: boolean = false;
  @Input() isPurchaseRequestDemo: boolean = false;
   WarehouseType: number = 1;
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Track changes for save functionality
  changedRows: any[] = [];
  originalDataMap: Map<number, any> = new Map();
  selectedRowIds: number[] = [];
  selectedTabIndex: number = -1;
  allData: any[] = [];
  duplicateIdList: number[] = [];

  constructor(
    private srv: ProjectPartlistPurchaseRequestService,
    private notify: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private supplierSaleService: SupplierSaleService,
    private ponccService: PONCCService,
    @Optional() public activeModal?: NgbActiveModal,
    @Optional() @Inject('tabData') private tabData?: any
  ) {}

  ngOnInit() {
    // Lấy data từ tabData nếu có (khi component được sử dụng như tab component)
    if (this.tabData) {
      if (this.tabData.isApprovedTBP !== undefined) {
        this.isApprovedTBP = this.tabData.isApprovedTBP;
      }
      // if (this.tabData.isSelectedPO !== undefined) {
      //   this.isSelectedPO = this.tabData.isSelectedPO;
      // }
      if (this.tabData.isApprovedBGD !== undefined) {
        this.isApprovedBGD = this.tabData.isApprovedBGD;
      }
      // if (this.tabData.listRequestBuySelect !== undefined) {
      //   this.listRequestBuySelect = this.tabData.listRequestBuySelect;
      // }
    }

    this.loadMasterData();
    this.getRequestTypes();
  }


  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Load master data
  loadMasterData() {
    const sub1 = this.srv.getProductGroups().subscribe({
      next: (data) => this.dtproductGroups = data || [],
      error: (err) => console.error('Error loading product groups:', err)
    });
    if(this.activeTabIndex===3 || this.activeTabIndex===4) this.WarehouseType=1;

    const sub2 = this.srv.getProductGroupsRTC(this.WarehouseType).subscribe({
      next: (data) => this.dtproductGroupsRTC = data || [],
      error: (err) => console.error('Error loading product groups RTC:', err)
    });

    const sub3 = this.srv.getSupplierSales().subscribe({
      next: (data) => {
        this.dtSupplierSale = data || [];
        this.supplierSales = data || [];
        // Update editor collections after data is loaded
        this.updateEditorCollections();
      },
      error: (err) => console.error('Error loading suppliers:', err)
    });

    const sub4 = this.srv.getCurrencies().subscribe({
      next: (data) => {
        this.dtcurrency = data || [];
        // Update editor collections after data is loaded
        this.updateEditorCollections();
      },
      error: (err) => console.error('Error loading currencies:', err)
    });

    const sub5 = this.srv.getProjects().subscribe({
      next: (data) => {
        this.dtprojects = data || [];
        this.projects = data || [];
      },
      error: (err) => console.error('Error loading projects:', err)
    });

    const sub6 = this.srv.getWarehouses().subscribe({
      next: (data) => this.dtwarehouses = data || [] ,
      error: (err) => console.error('Error loading warehouses:', err)
    });

    const sub7 = this.srv.getPOKH().subscribe({
      next: (data) => this.lstPOKH = data || [],
      error: (err) => console.error('Error loading POKH:', err)
    });

    this.subscriptions.push(sub1, sub2, sub3, sub4, sub5, sub6, sub7);
  }

  // Get request types and create tabs
  getRequestTypes() {
    const sub = this.srv.getRequestTypes().subscribe({
      next: (types: any[]) => {
        this.requestTypes = types || [];
        this.tabs = (types || []).map((t) => ({ id: t.ID, title: t.RequestTypeName.toUpperCase() }));

        // Initialize grids for each tab first
          this.initAllGrids();

        // Trigger change detection to update view
        this.cdr.detectChanges();

        // Mark first tab as visited after a delay to ensure DOM is ready
        // This is done here instead of ngAfterViewInit because getRequestTypes
        // might complete after ngAfterViewInit
        if (this.tabs.length > 0) {
          setTimeout(() => {
            // Nếu isApprovedTBP = true, chỉ mark tab 4 (Mượn demo) là visited
            if (this.isApprovedTBP) {
              const muonDemoTab = this.tabs.find(tab => tab.id === 4);
              if (muonDemoTab) {
                this.visitedTabs.add(muonDemoTab.id);
                this.activeTabIndex = 0; // Index trong filteredTabs sẽ là 0
              }
            } else {
              this.visitedTabs.add(this.tabs[0].id);
            }
            this.cdr.detectChanges();

            // Load data after grid container is rendered
            setTimeout(() => {
          this.onSearch();
            }, 150);
          }, 200);
        }
      },
      error: (err) => this.notify.error('Lỗi', err.error.message),
    });

    this.subscriptions.push(sub);
  }

  ngAfterViewInit() {
    // If tabs are already loaded, ensure first tab is marked as visited
    // This handles the case where getRequestTypes completes before ngAfterViewInit
    if (this.tabs.length > 0 && !this.visitedTabs.has(this.tabs[0].id)) {
      setTimeout(() => {
        this.visitedTabs.add(this.tabs[0].id);
        this.cdr.detectChanges();

        setTimeout(() => {
          this.onSearch();
        }, 150);
      }, 200);
    }
  }

  // Initialize all grids
  initAllGrids() {
    this.tabs.forEach(tab => {
      this.columnDefinitionsMap.set(tab.id, this.initGridColumns(tab.id));
      this.gridOptionsMap.set(tab.id, this.initGridOptions(tab.id));
      this.datasetsMap.set(tab.id, []);
    });
  }

  // Initialize grid columns for a specific tab
  private initGridColumns(typeId: number): Column[] {
    // Check if this is an RTC tab (indexes 3 and 4 = typeId 3 and 4)
    const isRTCTab = typeId === 3 || typeId === 4;
    // Check if this is tab 4 (Mượn demo - RTC) - only this tab has TBP columns
    const isTBPTab = typeId === 4;

    const columns: Column[] = [
      // TT - Row number (frozen)
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 50,
        sortable: false,
        filterable: false,
      },
    ];

    // Add TBP columns only for typeId === 3
    if (isTBPTab) {
      columns.push(
        // IsApprovedTBP - Checkbox (read-only)
        {
          id: 'IsApprovedTBP',
          field: 'IsApprovedTBP',
          name: 'TBP duyệt',
          width: 80,
          sortable: true,
          filterable: true,
          formatter: Formatters.iconBoolean,
          params: { cssClass: 'mdi mdi-check' },
          filter: { model: Filters['compoundInputNumber'] },
        },
        {
          id: 'ApprovedTBPName',
          field: 'ApprovedTBPName',
          name: 'TBP',
          width: 120,
          sortable: true,
          filterable: true,
          filter: { model: Filters['compoundInputText'] },

          formatter: (_row, _cell, value, _column, dataContext) => {
            if (!value) return '';
            return `
              <span
                title="${dataContext.ApprovedTBPName}"
                style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
              >
                ${value}
              </span>
            `;
          },

          customTooltip: {
            useRegularTooltip: true,
            // useRegularTooltipFromCellTextOnly: true,
          },
        },

        // DateApprovedTBP
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

    // Continue with common columns
    columns.push(
      // IsRequestApproved
      {
        id: 'IsRequestApproved',
        field: 'IsRequestApproved',
        name: 'YC duyệt',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // IsApprovedBGD
      {
        id: 'IsApprovedBGD',
        field: 'IsApprovedBGD',
        name: 'BGĐ duyệt',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // CustomerName
      {
        id: 'CustomerName',
        field: 'CustomerName',
        name: 'Khách hàng',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.CustomerName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // ProjectCode
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã dự án',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProjectCode}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // ProductCode
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductCode}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // ProductName
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // ProductNewCode or ProductCodeRTC for RTC tabs
      {
        id: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        field: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductNewCode}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // Quantity
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 100,
        sortable: true,
        filterable: true,
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // ProductGroupID or ProductGroupRTCID for RTC tabs
      {
        id: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        field: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        name: 'Nhóm SP',
        width: 150,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getProductGroupCollection(isRTCTab),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const groups = isRTCTab ? this.dtproductGroupsRTC : this.dtproductGroups;
          const group = groups.find((g: any) => g.ID === value);
          return group ? group.ProductGroupName : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // UnitName
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'ĐVT',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // WarehouseID
      {
        id: 'WarehouseID',
        field: 'WarehouseID',
        name: 'Kho',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getWarehouseCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const warehouse = this.dtwarehouses.find((w: any) => w.ID === value);
          return warehouse ? warehouse.WarehouseName : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // Manufacturer
      {
        id: 'Manufacturer',
        field: 'Manufacturer',
        name: 'Hãng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Manufacturer}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // StatusRequestText
      {
        id: 'StatusRequestText',
        field: 'StatusRequestText',
        name: 'Trạng thái',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.StatusRequestText}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // FullName
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người YC',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // UpdatedName
      {
        id: 'UpdatedName',
        field: 'UpdatedName',
        name: 'NV mua',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.UpdatedName}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // DateRequest
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
      // DateReturnExpected
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
      // CurrencyID
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 100,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getCurrencyCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const currency = this.dtcurrency.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // CurrencyRate
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // UnitPricePOKH
      {
        id: 'UnitPricePOKH',
        field: 'UnitPricePOKH',
        name: 'Đơn giá bán (Sale Admin up)',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // UnitPrice (editable)
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
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // HistoryPrice
      {
        id: 'HistoryPrice',
        field: 'HistoryPrice',
        name: 'Giá lịch sử',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // TotalPriceHistory
      {
        id: 'TotalPriceHistory',
        field: 'TotalPriceHistory',
        name: 'Tổng giá LS',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // TotalPrice
      {
        id: 'TotalPrice',
        field: 'TotalPrice',
        name: 'Thành tiền',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // TotalPriceExchange
      {
        id: 'TotalPriceExchange',
        field: 'TotalPriceExchange',
        name: 'Thành tiền QĐ',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // VAT
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
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // TotaMoneyVAT
      {
        id: 'TotaMoneyVAT',
        field: 'TotaMoneyVAT',
        name: 'Tổng tiền có VAT',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // TargetPrice
      {
        id: 'TargetPrice',
        field: 'TargetPrice',
        name: 'Giá Target',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // SupplierSaleID
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 200,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['singleSelect'],
          collection: this.getSupplierCollection(),
          collectionOptions: {
            addBlankEntry: false
          },
          editorOptions: {
            enableClear: true
          }
        },
        formatter: (row: number, cell: number, value: any) => {
          const supplier = this.dtSupplierSale.find((s: any) => s.ID === value);
          return supplier ? supplier.NameNCC : '';
        },

        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // TotalDayLeadTime
      {
        id: 'TotalDayLeadTime',
        field: 'TotalDayLeadTime',
        name: 'Lead time (ngày)',
        width: 100,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // Note (editable)
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
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Model}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // Model
      {
        id: 'Model',
        field: 'Model',
        name: 'Thông số kỹ thuật',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Model}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // NotePartlist
      {
        id: 'NotePartlist',
        field: 'NotePartlist',
        name: 'Ghi chú KT',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NotePartlist}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
      },
      // RequestDate
      {
        id: 'RequestDate',
        field: 'RequestDate',
        name: 'Ngày đặt hàng',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // ReasonCancel
      {
        id: 'ReasonCancel',
        field: 'ReasonCancel',
        name: 'Lý do hủy',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // DeadlineDelivery
      {
        id: 'DeadlineDelivery',
        field: 'DeadlineDelivery',
        name: 'Ngày về dự kiến',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // DateReturnActual
      {
        id: 'DateReturnActual',
        field: 'DateReturnActual',
        name: 'Ngày về thực tế',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // DateReceive
      {
        id: 'DateReceive',
        field: 'DateReceive',
        name: 'Ngày nhận',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // IsImport (editable checkbox)
      {
        id: 'IsImport',
        field: 'IsImport',
        name: 'Hàng nhập khẩu',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        editor: {
          model: Editors['checkbox'],
        },
        filter: { model: Filters['compoundInputNumber'] },
      },
      // UnitFactoryExportPrice
      {
        id: 'UnitFactoryExportPrice',
        field: 'UnitFactoryExportPrice',
        name: 'Đơn giá xuất xưởng',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // UnitImportPrice
      {
        id: 'UnitImportPrice',
        field: 'UnitImportPrice',
        name: 'Giá nhập khẩu',
        width: 120,
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // TotalImportPrice
      {
        id: 'TotalImportPrice',
        field: 'TotalImportPrice',
        name: 'Tổng tiền nhập khẩu',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // LeadTime
      {
        id: 'LeadTime',
        field: 'LeadTime',
        name: 'Lead time',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // BillCode
      {
        id: 'BillCode',
        field: 'BillCode',
        name: 'Đơn mua hàng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // POKHCode
      {
        id: 'POKHCode',
        field: 'POKHCode',
        name: 'Mã POKH',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // ParentProductCodePO
      {
        id: 'ParentProductCodePO',
        field: 'ParentProductCodePO',
        name: 'Mã cha',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // GuestCode
      {
        id: 'GuestCode',
        field: 'GuestCode',
        name: 'Mã KH',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // StatusPOKHText
      {
        id: 'StatusPOKHText',
        field: 'StatusPOKHText',
        name: 'Trạng thái PO',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // SpecialCode
      {
        id: 'SpecialCode',
        field: 'SpecialCode',
        name: 'Mã đặc biệt',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // FullNamePriceRequest
      {
        id: 'FullNamePriceRequest',
        field: 'FullNamePriceRequest',
        name: 'Kỹ thuật phụ trách',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // Inventory columns
      {
        id: 'TotalHN',
        field: 'TotalHN',
        name: 'Tồn HN',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalHCM',
        field: 'TotalHCM',
        name: 'Tồn HCM',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalHP',
        field: 'TotalHP',
        name: 'Tồn HP',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalDP',
        field: 'TotalDP',
        name: 'Tồn ĐN',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalBN',
        field: 'TotalBN',
        name: 'Tồn BN',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) => this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      // IsPaidLater
      {
        id: 'IsPaidLater',
        field: 'IsPaidLater',
        name: 'Trả sau',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.iconBoolean,
        params: { cssClass: 'mdi mdi-check' },
        filter: { model: Filters['compoundInputNumber'] },
      }
    );

    // Nếu là tab 1 (Mua dự án), đổi chỗ cột Model và CustomerName
    if (typeId === 1) {
      const customerNameIndex = columns.findIndex(col => col.id === 'CustomerName');
      const modelIndex = columns.findIndex(col => col.id === 'Model');

      if (customerNameIndex !== -1 && modelIndex !== -1) {
        // Swap vị trí: đặt Model trước CustomerName
        const temp = columns[customerNameIndex];
        columns[customerNameIndex] = columns[modelIndex];
        columns[modelIndex] = temp;
      }
    }

    return columns;
  }

  // Initialize grid options for a specific tab
  private initGridOptions(typeId: number): GridOption {
    // Tab 1 (Mua dự án) sẽ readonly khi isSelectedPO = true
    const isReadOnly = this.isSelectedPO && typeId === 1;
    
    return {
      enableAutoResize: true,
      autoResize: {
        container: `.grid-container-${typeId}`,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',

      // ROW SELECTION CONFIGURATION
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false, // False = Multiple Selections
      },

      // CHECKBOX SELECTOR CONFIGURATION
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
        columnIndexPosition: 0,
        width: 35,
      },

      // EDITING
      editable: !isReadOnly,
      enableCellNavigation: true,
      autoEdit: !isReadOnly,
      autoCommitEdit: true,

      // FILTERING & GROUPING
      enableFiltering: true,
      enableGrouping: true,

      // COLUMNS
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 10, // Freeze first 10 columns

      // PAGINATION
      enablePagination: false,

      // CONTEXT MENU
      contextMenu: {
        hideCloseButton: false,
        commandTitle: '',
        commandItems: this.buildContextMenuItems(typeId),
      },
    };
  }

  // Grid ready event handler
  angularGridReady(typeId: number, angularGrid: AngularGridInstance): void {
    // Store grid instance
    this.angularGrids.set(typeId, angularGrid);

    // Ensure config exists
    if (!this.gridOptionsMap.has(typeId)) {
      this.columnDefinitionsMap.set(typeId, this.initGridColumns(typeId));
      this.gridOptionsMap.set(typeId, this.initGridOptions(typeId));
      this.datasetsMap.set(typeId, []);
    }

    // Enable checkbox selector
    this.ensureCheckboxSelector(angularGrid);

    // Setup grouping by ProjectFullName (và POKHCode nếu listRequestBuySelect = true)
    if (angularGrid && angularGrid.dataView) {
      const aggregators = [
        new Aggregators['Sum']('Quantity'),
        new Aggregators['Sum']('TotalPrice'),
        new Aggregators['Sum']('TotalPriceExchange'),
        new Aggregators['Sum']('TotaMoneyVAT'),
        new Aggregators['Sum']('TotalImportPrice'),
        new Aggregators['Sum']('TotalPriceHistory'),
        new Aggregators['Sum']('CurrencyRate'),
        new Aggregators['Sum']('UnitPrice'),
        new Aggregators['Sum']('UnitFactoryExportPrice'),
        new Aggregators['Sum']('TotalHN'),
        new Aggregators['Sum']('TotalHCM'),
        new Aggregators['Sum']('TotalHP'),
        new Aggregators['Sum']('TotalDP'),
        new Aggregators['Sum']('TotalBN'),
      ];

      if (this.listRequestBuySelect) {
        // Nested grouping: ProjectFullName -> POKHCode
        angularGrid.dataView.setGrouping([
          {
            getter: 'ProjectFullName',
            formatter: (g: any) => {
              const projectName = g.value || '';
              return `Dự án: ${projectName} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
            },
            comparer: (a: any, b: any) => {
              return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
            },
            aggregators: aggregators,
            aggregateCollapsed: false,
            lazyTotalsCalculation: true,
            collapsed: false,
          },
          {
            getter: 'POKHCode',
            formatter: (g: any) => {
              const pokhCode = g.value || '';
              return `Mã POKH: ${pokhCode} <span style="color:blue; margin-left:10px;">(${g.count} sản phẩm)</span>`;
            },
            comparer: (a: any, b: any) => {
              return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
            },
            aggregators: aggregators,
            aggregateCollapsed: false,
            lazyTotalsCalculation: true,
            collapsed: false,
          }
        ]);
      } else {
        // Single grouping: ProjectFullName only
        angularGrid.dataView.setGrouping({
          getter: 'ProjectFullName',
          formatter: (g: any) => {
            const projectName = g.value || '';
            return `Dự án: ${projectName} <span style="color:green; margin-left:10px;">(${g.count} sản phẩm)</span>`;
          },
          comparer: (a: any, b: any) => {
            return SortComparers.string(a.value, b.value, SortDirectionNumber.asc);
          },
          aggregators: aggregators,
          aggregateCollapsed: false,
          lazyTotalsCalculation: true,
          collapsed: false,
        });
      }

      angularGrid.dataView.refresh();
      angularGrid.slickGrid.render();
      this.ensureCheckboxSelector(angularGrid, 50);
    }

    // Resize grid
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.ensureCheckboxSelector(angularGrid);
      if (angularGrid.slickGrid) {
        angularGrid.slickGrid.render();
      }
    }, 100);
  }

  // Helper method to ensure checkbox selector stays enabled
  private ensureCheckboxSelector(angularGrid: AngularGridInstance | undefined, delay: number = 0): void {
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

  // Update editor collections for all grids after master data is loaded
  private updateEditorCollections(): void {
    // Update columns for all tabs
    this.tabs.forEach(tab => {
      const angularGrid = this.angularGrids.get(tab.id);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      // Update CurrencyID column editor collection
      const currencyColumn = columns.find((col: any) => col.field === 'CurrencyID');
      if (currencyColumn && currencyColumn.editor) {
        currencyColumn.editor.collection = this.getCurrencyCollection();
      }

      // Update SupplierSaleID column editor collection
      const supplierColumn = columns.find((col: any) => col.field === 'SupplierSaleID');
      if (supplierColumn && supplierColumn.editor) {
        supplierColumn.editor.collection = this.getSupplierCollection();
      }

      // Update ProductGroupID/ProductGroupRTCID columns
      const isRTCTab = tab.id === 3 || tab.id === 4;
      const productGroupField = isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID';
      const productGroupColumn = columns.find((col: any) => col.field === productGroupField);
      if (productGroupColumn && productGroupColumn.editor) {
        productGroupColumn.editor.collection = this.getProductGroupCollection(isRTCTab);
      }

      // Update WarehouseID column editor collection
      const warehouseColumn = columns.find((col: any) => col.field === 'WarehouseID');
      if (warehouseColumn && warehouseColumn.editor) {
        warehouseColumn.editor.collection = this.getWarehouseCollection();
      }

      // Update column definitions in the map to keep them in sync
      const columnDefs = this.columnDefinitionsMap.get(tab.id);
      if (columnDefs) {
        const currencyColDef = columnDefs.find((col: any) => col.field === 'CurrencyID');
        if (currencyColDef && currencyColDef.editor) {
          currencyColDef.editor.collection = this.getCurrencyCollection();
        }

        const supplierColDef = columnDefs.find((col: any) => col.field === 'SupplierSaleID');
        if (supplierColDef && supplierColDef.editor) {
          supplierColDef.editor.collection = this.getSupplierCollection();
        }

        const productGroupColDef = columnDefs.find((col: any) => col.field === productGroupField);
        if (productGroupColDef && productGroupColDef.editor) {
          productGroupColDef.editor.collection = this.getProductGroupCollection(isRTCTab);
        }

        const warehouseColDef = columnDefs.find((col: any) => col.field === 'WarehouseID');
        if (warehouseColDef && warehouseColDef.editor) {
          warehouseColDef.editor.collection = this.getWarehouseCollection();
        }
      }

      // Refresh grid to apply changes
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
    });
  }

  // Build context menu items for a specific tab
  private buildContextMenuItems(typeId: number): any[] {
    // Kiểm tra quyền N35 và N1
    const hasN35Permission = this.permissionService.hasPermission('N35');
    const hasN1Permission = this.permissionService.hasPermission('N1');
    const hasN35OrN1 = hasN35Permission || hasN1Permission;

    const menuItems: any[] = [];
    let positionOrder = 10;

    // Xuất Excel - luôn hiển thị (nếu có method export)
    // Note: Method exportExcel chưa có trong component này, có thể thêm sau
    // menuItems.push({
    //   command: 'export-selected',
    //   title: 'Xuất SP chọn',
    //   iconCssClass: 'mdi mdi-file-excel',
    //   positionOrder: positionOrder++,
    //   action: (e: any, args: any) => {
    //     const tabIndex = this.tabs.findIndex(t => t.id === typeId);
    //     if (tabIndex >= 0) {
    //       // this.exportExcel(tabIndex, false);
    //     }
    //   }
    // });

    // menuItems.push({
    //   command: 'export-all',
    //   title: 'Xuất tất cả',
    //   iconCssClass: 'mdi mdi-file-excel',
    //   positionOrder: positionOrder++,
    //   action: (e: any, args: any) => {
    //     const tabIndex = this.tabs.findIndex(t => t.id === typeId);
    //     if (tabIndex >= 0) {
    //       // this.exportExcel(tabIndex, true);
    //     }
    //   }
    // });

    // Duplicate - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        command: 'duplicate',
        title: 'Duplicate',
        iconCssClass: 'mdi mdi-content-copy',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.duplicateRow(tabIndex);
          }
        }
      });
    }

    // Lịch sử hỏi giá - luôn hiển thị
    menuItems.push({
      command: 'history-price',
      title: 'Lịch sử hỏi giá',
      iconCssClass: 'mdi mdi-history',
      positionOrder: positionOrder++,
      action: (e: any, args: any) => {
        const tabIndex = this.tabs.findIndex(t => t.id === typeId);
        if (tabIndex >= 0) {
          this.onHistoryPrice(tabIndex);
        }
      }
    });

    // Hàng nhập khẩu - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        command: 'set-import',
        title: 'Hàng nhập khẩu',
        iconCssClass: 'mdi mdi-check',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.updateProductImport(tabIndex, true);
          }
        }
      });

      menuItems.push({
        command: 'unset-import',
        title: 'Hủy hàng nhập khẩu',
        iconCssClass: 'mdi mdi-close',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.updateProductImport(tabIndex, false);
          }
        }
      });
    }

    // Yêu cầu duyệt mua - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        command: 'request-approved',
        title: 'Yêu cầu duyệt mua',
        iconCssClass: 'mdi mdi-check',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.onRequestApproved(tabIndex, true);
          }
        }
      });

      menuItems.push({
        command: 'cancel-request-approved',
        title: 'Hủy yêu cầu duyệt mua',
        iconCssClass: 'mdi mdi-close',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.onRequestApproved(tabIndex, false);
          }
        }
      });
    }

    // Separator
    if (menuItems.length > 0) {
      menuItems.push({
        divider: true,
        command: '',
        positionOrder: positionOrder++
      });
    }

    // Giữ hàng - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        command: 'keep-product',
        title: 'Giữ hàng',
        iconCssClass: 'mdi mdi-check',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex(t => t.id === typeId);
          if (tabIndex >= 0) {
            this.onKeepProduct(tabIndex);
          }
        }
      });
    }

    // Cập nhật mã nội bộ - yêu cầu quyền N35 hoặc N1 và chỉ cho tab index 3
    const tabIndex = this.tabs.findIndex(t => t.id === typeId);
    if (hasN35OrN1 && tabIndex === 3) {
      menuItems.push({
        command: 'update-internal-code',
        title: 'Cập nhật mã nội bộ',
        iconCssClass: 'mdi mdi-refresh',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          if (tabIndex >= 0) {
            this.updateInternalCode(tabIndex);
          }
        }
      });
    }

    return menuItems;
  }

  // Collection helper methods
  private getProductGroupCollection(isRTC: boolean): Array<{ value: number; label: string }> {
    const groups = isRTC ? this.dtproductGroupsRTC : this.dtproductGroups;
    const collection = (groups || []).map((g: any) => ({
      value: g.ID,
      label: g.ProductGroupName || ''
    }));
    return [
      { value: 0, label: '' },
      ...collection
    ];
  }

  private getWarehouseCollection(): Array<{ value: number; label: string }> {
    const warehouses = (this.dtwarehouses || []).map((w: any) => ({
      value: w.ID,
      label:w.WarehouseCode + ' - ' + w.WarehouseName || ''
    }));
    return [
      { value: 0, label: '' },
      ...warehouses
    ];
  }

  private getCurrencyCollection(): Array<{ value: number; label: string; currencyRate: number }> {
    const currencies = (this.dtcurrency || []).map((c: any) => ({
      value: c.ID,
      label: `${c.Code || ''} - ${this.formatNumberEnUS(c.CurrencyRate || 0, 2)}`,
      currencyRate: c.CurrencyRate || 0
    }));
    return [
      { value: 0, label: '', currencyRate: 0 },
      ...currencies
    ];
  }

  private getSupplierCollection(): Array<{ value: number; label: string }> {
    const suppliers = (this.dtSupplierSale || []).map((s: any) => ({
      value: s.ID,
      label: `${s.CodeNCC || ''} - ${s.NameNCC || ''}`.replace(/^ - |^ -$| - $/g, '').trim() || s.NameNCC || ''
    }));
    return [
      { value: 0, label: '' },
      ...suppliers
    ];
  }

  // Format number with en-US locale
  formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // Sum totals formatter with format
  sumTotalsFormatterWithFormat(totals: any, columnDef: any): string {
    const field = columnDef.field;
    const sum = totals.sum && totals.sum[field];
    const prefix = columnDef.params?.groupFormatterPrefix || '';

    if (sum !== undefined && sum !== null) {
      return `${prefix}${this.formatNumberEnUS(sum, 0)}`;
    }
    return '';
  }

  // Getting selected rows
  private getSelectedGridData(typeId: number): any[] {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return [];
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    return selectedRowIndexes.map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);
  }

  // Event handlers
  onCellClicked(typeId: number, e: Event, args: OnClickEventArgs): void {
    // Handle cell click events if needed
  }

  onCellChange(typeId: number, e: Event, args: OnCellChangeEventArgs): void {
    // Handle cell change events
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) return;

    const rowIndex = args.row;
    const item = angularGrid.dataView.getItem(rowIndex);
    if (!item) return;

    const column = args.column;
    const field = column?.field || '';
    const newValue = args.item?.[field];

    // Update the item with new value
    if (field && newValue !== undefined) {
      item[field] = newValue;
    }

    // Get the column info from the grid
    const columns = angularGrid.slickGrid.getColumns();
    const changedColumn = columns[args.cell];

    // Handle CurrencyID change - update CurrencyRate automatically
    if (field === 'CurrencyID') {
      const currencyId = Number(newValue) || 0;
      let newCurrencyRate = 0;

      if (currencyId > 0) {
        const currency = this.dtcurrency.find((c: any) => c.ID === currencyId);
        if (currency) {
          newCurrencyRate = currency.CurrencyRate || 0;
        }
      }

      // Update CurrencyRate in item
      item.CurrencyRate = newCurrencyRate;

      // Recalculate totals after currency change
      this.recalculateTotals(item);

      // Update the CurrencyRate cell directly in the grid to ensure it displays immediately
      const currencyRateColumn = columns.find((col: any) => col.field === 'CurrencyRate');
      if (currencyRateColumn) {
        const currencyRateColIndex = columns.indexOf(currencyRateColumn);
        // Update item in dataView first
        angularGrid.dataView.updateItem(item.id, item);
        // Invalidate and update the specific cell
        angularGrid.slickGrid.updateCell(rowIndex, currencyRateColIndex);
      }
    }

    // Recalculate totals when prices change
    if (changedColumn && ['UnitPrice', 'Quantity', 'CurrencyRate', 'VAT'].includes(changedColumn.field || '')) {
      this.recalculateTotals(item);
    }

    // Track changes: Add to changedRows array if not already exists
    const rowId = Number(item.ID || 0);
    if (rowId > 0) {
      // Check if row already exists in changedRows
      const existingIndex = this.changedRows.findIndex((r: any) => Number(r.ID) === rowId);

      if (existingIndex >= 0) {
        // Update existing row with latest data
        this.changedRows[existingIndex] = { ...item };
      } else {
        // Add new changed row
        this.changedRows.push({ ...item });
      }
    }

    // Update item in dataView
    angularGrid.dataView.updateItem(item.id, item);

    // Refresh grid
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
    this.ensureCheckboxSelector(angularGrid);
  }

  handleRowSelection(typeId: number, e: Event, args: OnSelectedRowsChangedEventArgs): void {
    // Handle row selection changes if needed
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

  // Tab change handler
  onTabChange(index: number): void {
    this.activeTabIndex = index;
    const typeId = this.filteredTabs[index]?.id;
    if (typeId) {
      // Mark tab as visited
      this.visitedTabs.add(typeId);

      const angularGrid = this.angularGrids.get(typeId);
      if (angularGrid) {
        setTimeout(() => {
          angularGrid.resizerService.resizeGrid();
          this.ensureCheckboxSelector(angularGrid);
        }, 100);
      }
    }
  }

  // Check if tab should render grid
  shouldRenderGrid(tabId: number): boolean {
    return this.visitedTabs.has(tabId);
  }

  // Helper functions for date formatting (giống file gốc)
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

  // Search/filter methods
  onSearch(): void {
    this.isLoading = true;

    const filter: any = {
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

    const sub = this.srv.getAll(filter).subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data) ? response.data : response?.data || response || [];
        const allData = data;
        this.allData = allData;

        // Clear changedRows khi reload data
        this.changedRows = [];

        // Lưu dữ liệu gốc vào Map để so sánh sau này
        this.originalDataMap.clear();
        allData.forEach((item: any) => {
          if (item.ID) {
            this.originalDataMap.set(item.ID, { ...item });
          }
        });

        // Tạo danh sách các DuplicateID
        this.duplicateIdList = [];
        allData.forEach((item: any) => {
          const duplicateId = Number(item.DuplicateID || 0);
          if (duplicateId > 0 && !this.duplicateIdList.includes(duplicateId)) {
            this.duplicateIdList.push(duplicateId);
          }
        });

        // Filter data for each tab - logic giống file gốc
        this.tabs.forEach(tab => {
          let filteredData: any[] = [];
          const typeId = Number(tab.id);

          // Lọc theo từng loại tab (tương ứng với logic WinForm)
          switch (typeId) {
            case 1:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 1
              );
              break;

            case 2:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 2
              );
              break;

            case 3:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 3
              );
              break;

            case 4:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 4
              );
              break;

            case 5:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 5
              );
              break;

            case 6:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 6
              );
              break;

            case 7:
              filteredData = allData.filter((x: any) =>
                Number(x.ProjectPartlistPurchaseRequestTypeID) == 7
              );
              break;

            default:
              break;
          }

          // Add id property for grid
          const dataWithId = filteredData.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index
          }));

          // Cập nhật title tab với số lượng (giống file gốc)
          const countText = (filteredData?.length || 0).toLocaleString('vi-VN');
          tab.title = `${tab.title.split('(')[0].trim()} (${countText})`;

          this.datasetsMap.set(tab.id, dataWithId);

          // Refresh grid if it exists
          const angularGrid = this.angularGrids.get(tab.id);
          if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.setItems(dataWithId);
            angularGrid.dataView.refresh();
          }
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.notify.error('Lỗi', 'Không thể tải dữ liệu');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
    this.shouldShowSearchBar = this.showSearchBar;
  }

  // Action methods
  onCheckOrder(tabIndex: number, status: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      const textStatus = status ? "check" : "hủy check";
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }

    const textStatus = status ? "check" : "hủy check";
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
        this.selectedRowIds = selected.map(r => r.ID);
        this.selectedTabIndex = tabIndex;

        // API cần List<int> listIds - chỉ gửi mảng các ID (số nguyên)
        const listIds = selected.map(r => Number(r.ID || 0)).filter(id => id > 0);

        const sub = this.srv.checkOrder(listIds, status).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || `${textStatus} thành công`);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || `${textStatus} thất bại`);
            // Xóa selectedRowIds nếu có lỗi
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onSaveData(tabIndex: number): void {
    if (this.changedRows.length <= 0 || this.changedRows == null) {
      this.notify.warning(NOTIFICATION_TITLE.warning, "Không có dữ liệu thay đổi!");
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    // Lấy dữ liệu mới nhất từ grid để đảm bảo có đầy đủ thông tin
    const angularGrid = this.angularGrids.get(typeId);
    if (angularGrid && angularGrid.dataView) {
      // Update changedRows với dữ liệu mới nhất từ grid
      const allGridData: any[] = [];
      for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
        const item = angularGrid.dataView.getItem(i);
        if (item) {
          allGridData.push(item);
        }
      }

      // Cập nhật changedRows với dữ liệu mới nhất từ grid
      this.changedRows = this.changedRows.map(changedRow => {
        const rowId = Number(changedRow.ID || 0);
        if (rowId > 0) {
          const latestRowData = allGridData.find((row: any) => Number(row.ID) === rowId);
          if (latestRowData) {
            return latestRowData;
          }
        }
        return changedRow;
      }).filter((row: any) => row && row.ID);
    }

    if (this.changedRows.length <= 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, "Không có dữ liệu thay đổi!");
      return;
    }

    this.selectedRowIds = this.changedRows.map(r => r.ID);
    this.selectedTabIndex = tabIndex;

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

        // API expects List<ProjectPartlistPurchaseRequestDTO> directly (array)
        const sub = this.srv.saveData(dataToSave).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || 'Lưu dữ liệu thành công');
            this.changedRows = [];
        this.isLoading = false;
            this.onSearch();
      },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lưu dữ liệu thất bại');
        this.isLoading = false;
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
      }
    });
    this.subscriptions.push(sub);
      }
    });
  }

  // Hàm lấy dữ liệu cần lưu (bao gồm các dòng duplicate liên quan)
  private getDataToSave(): any[] {
    const result: any[] = [];
    const addedIds = new Set<number>();

    // Duyệt qua từng dòng đã thay đổi
    this.changedRows.forEach(changedRow => {
      const rowId = changedRow.ID;
      const duplicateId = changedRow.DuplicateID;

      // Thêm dòng hiện tại nếu chưa có (đã normalize)
      if (!addedIds.has(rowId)) {
        result.push(this.normalizeRowData(changedRow));
        addedIds.add(rowId);
      }

      // Nếu có DuplicateID, tìm tất cả các dòng liên quan
      if (duplicateId && duplicateId > 0) {
        this.allData.forEach((item: any) => {
          const itemId = item.ID;
          const itemDuplicateId = item.DuplicateID;

          const isRelated =
            itemId === duplicateId ||
            (itemDuplicateId && itemDuplicateId === duplicateId);

          if (isRelated && !addedIds.has(itemId)) {
            const relatedItem = {
              ...item,
              IsMarketing: Boolean(this.activeTabIndex === 7 || this.activeTabIndex === 1) || false
            };
            result.push(this.normalizeRowData(relatedItem));
            addedIds.add(itemId);
          }
        });
      }
    });

    return result;
  }

  // Hàm normalize dữ liệu row trước khi gửi lên API
  private normalizeRowData(row: any): any {
    // Loại bỏ các field không cần thiết từ grid (như 'id', 'TT')
    const { id, TT, ...rowData } = row;
    const normalized: any = { ...rowData };

    // Danh sách các field số nguyên
    const integerFields = [
      'ID', 'SupplierSaleID', 'CurrencyID', 'ProductGroupID', 'ProductGroupRTCID',
      'WarehouseID', 'ProjectID', 'ProductRTCID', 'ProductSaleID',
      'DuplicateID', 'PONCCID', 'POKHID', 'JobRequirementID', 'CustomerID',
      'TotalDayLeadTime', 'StatusRequest', 'ProjectPartlistPurchaseRequestTypeID',
      'TicketType', 'UnitCountID', 'ApprovedTBP', 'ApprovedBGD',
      'EmployeeID', 'EmployeeIDRequestApproved', 'EmployeeApproveID',
      'InventoryProjectID', 'ProjectPartListID', 'POKHDetailID'
    ];

    // Danh sách các field số thập phân
    const decimalFields = [
      'Quantity', 'UnitPrice', 'UnitImportPrice', 'VAT', 'TargetPrice',
      'CurrencyRate', 'HistoryPrice', 'TotalPrice', 'TotalPriceExchange',
      'TotaMoneyVAT', 'UnitFactoryExportPrice', 'TotalImportPrice',
      'TotalPriceHistory', 'OriginQuantity'
    ];

    // Xử lý integer fields
    integerFields.forEach(field => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        const value = normalized[field];
        if (value === '' || value === 'null' || value === 'undefined') {
          normalized[field] = null;
        } else {
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            normalized[field] = Math.floor(numValue); // Làm tròn xuống cho integer
          } else {
            normalized[field] = null;
          }
        }
      } else {
        normalized[field] = null;
      }
    });

    // Xử lý decimal fields
    decimalFields.forEach(field => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        const value = normalized[field];
        if (value === '' || value === 'null' || value === 'undefined') {
          normalized[field] = null;
        } else {
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            normalized[field] = numValue;
          } else {
            normalized[field] = null;
          }
        }
      } else {
        normalized[field] = null;
      }
    });

    // Xử lý boolean fields - đảm bảo convert đúng sang boolean
    const booleanFields = [
      'IsApprovedTBP', 'IsApprovedBGD', 'IsImport', 'IsRequestApproved',
      'IsCommercialProduct', 'IsDeleted', 'IsTechBought', 'IsPurchase',
      'IsPaidLater', 'IsMarketing'
    ];

    booleanFields.forEach(field => {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        const value = normalized[field];
        // Xử lý các trường hợp đặc biệt
        if (typeof value === 'string') {
          normalized[field] = value.toLowerCase() === 'true' || value === '1';
        } else if (typeof value === 'number') {
          normalized[field] = value !== 0;
        } else {
          normalized[field] = Boolean(value);
        }
      } else {
        normalized[field] = false;
      }
    });

    // Xử lý date fields - chuyển sang string ISO nếu là Date object
    const dateFields = [
      'DateRequest', 'DateReturnExpected', 'DateOrder', 'DateEstimate',
      'DateReturnActual', 'DateReceive', 'DateApprovedTBP', 'DateApprovedBGD',
      'DateReturnEstimated', 'CreatedDate', 'UpdatedDate'
    ];

    dateFields.forEach(field => {
      if (normalized[field]) {
        if (normalized[field] instanceof Date) {
          normalized[field] = normalized[field].toISOString();
        } else if (typeof normalized[field] === 'string') {
          // Giữ nguyên nếu đã là string
        } else {
          normalized[field] = null;
        }
      } else {
        normalized[field] = null;
      }
    });

    return normalized;
  }

  onEdit(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần sửa!`);
      return;
    }

    if (selected.length !== 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn 1 dòng cần sửa!`);
      return;
    }

    const row = selected[0];
    const isCommercialProduct = row.IsCommercialProduct;
    const poNCC = row.PONCCID;

    if (!isCommercialProduct || poNCC > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Sửa Y/C chỉ áp dụng với [Hàng thương mại] và yêu cầu [Chưa có PO]!`);
      return;
    }

    this.selectedRowIds = [row.ID];
    this.selectedTabIndex = tabIndex;

    const sub = this.srv.getDetailByID(row.ID).subscribe({
      next: (rs) => {
        const modalRef = this.modalService.open(ProjectPartlistPurchaseRequestDetailComponent, {
          centered: false,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'full-screen-modal'
        });
        let data = {
          ...rs.data,
          Unit: row.UnitName || '',
          CustomerID: row.CustomerID || 0,
          Maker: row.Manufacturer || '',
        };
        modalRef.componentInstance.projectPartlistDetail = data;
        modalRef.result.catch((reason) => {
          this.onSearch();
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi lấy dữ liệu chi tiết!');
        this.selectedRowIds = [];
        this.selectedTabIndex = -1;
      }
    });
    this.subscriptions.push(sub);
  }

  onDeleteRequest(tabIndex: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
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
        const isPurchaseRequestDemo = typeId === 2 || typeId === 3; // RTC tabs
        const sub = this.srv.deletedRequest(selected, isPurchaseRequestDemo).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || 'Hủy yêu cầu thành công');
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Hủy yêu cầu thất bại')
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onAddSupplierSale(): void {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0;
    modalRef.result.finally(() => {
      const sub = this.srv.getSupplierSales().subscribe({
        next: (res) => {
          this.dtSupplierSale = res || [];
          // Update supplier sales list
        },
      });
      this.subscriptions.push(sub);
    });
  }

  onRequestApproved(tabIndex: number, status: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      const textStatus = status ? "Y/C duyệt mua" : "hủy Y/C duyệt mua";
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }

    this.selectedRowIds = selected.map(r => r.ID);
    this.selectedTabIndex = tabIndex;

    const textStatus = status ? "Y/C duyệt mua" : "hủy Y/C duyệt mua";
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.requestApproved(selected, status).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || `${textStatus} thành công`);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || `${textStatus} thất bại`);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onCompleteRequest(tabIndex: number, statusValue: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      const textStatus = statusValue == 7 ? "hoàn thành" : "hủy hoàn thành";
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }

    this.selectedRowIds = selected.map(r => r.ID);
    this.selectedTabIndex = tabIndex;

    const textStatus = statusValue == 7 ? "hoàn thành" : "hủy hoàn thành";
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn ${textStatus} danh sách đang chọn không?
      \nNhững sản phẩm đã có NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.completeRequest(selected, statusValue).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || `${textStatus} thành công`);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || `${textStatus} thất bại`);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onApproved(tabIndex: number, status: boolean, type: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      const textStatus = status ? "duyệt" : "hủy duyệt";
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần ${textStatus}!`);
      return;
    }

    // Validation cho TBP duyệt: kiểm tra ProductNewCode nếu ProductSaleID <= 0
    if (type && status) {
      for (const row of selected) {
        const productSaleId = Number(row.ProductSaleID || 0);
        const productNewCode = String(row.ProductNewCode || '').trim();
        const productCode = String(row.ProductCode || '');

        if (productSaleId <= 0 && !productNewCode) {
          this.notify.warning(
            NOTIFICATION_TITLE.warning,
            `Vui lòng tạo Mã nội bộ cho sản phẩm [${productCode}].\nChọn Loại kho sau đó chọn Lưu thay đổi để tạo Mã nội bộ!`
          );
          return;
        }
      }
    }

    this.selectedRowIds = selected.map(r => r.ID);
    this.selectedTabIndex = tabIndex;

    const textStatus = status ? "duyệt" : "hủy duyệt";
    const typeText = type ? "TBP" : "BGD";
    let message = '';
    // if (type && !status) message = `Những sản phẩm đã được BGĐ duyệt sẽ không thể ${textStatus}!`;
    // if (!type && status) message = `Những sản phẩm chưa được TBP duyệt sẽ không thể ${textStatus}!`;

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${textStatus} danh sách sản phẩm đã chọn không?${message ? '\n' + message : ''}`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.approved(selected, status, type).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || `${textStatus} thành công`);
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || `${textStatus} thất bại`);
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onAddPoncc(): void {
    const tabIndex = this.activeTabIndex;
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    if (!selectedRowIndexes || selectedRowIndexes.length <= 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm muốn Tạo PO NCC!');
      return;
    }

    const selectedData = selectedRowIndexes.map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);

    // Validate từng sản phẩm theo logic WinForm
    for (const row of selectedData) {
      const id = Number(row.ID || 0);
      if (id <= 0) continue;

      const productCode = String(row.ProductCode || '');
      const productRtcId = Number(row.ProductRTCID || 0);
      const productSaleId = Number(row.ProductSaleID || 0);
      const currencyID = Number(row.CurrencyID || 0);
      const parentProductCode = String(row.ParentProductCodePO || '').trim();
      const supplierSaleId = Number(row.SupplierSaleID || 0);
      const unitPrice = Number(row.UnitPrice || 0);
      const ticketType = Number(row.TicketType || 0); // 0: mua, 1: mượn

      // Lấy IsApprovedTBP từ requestModel (từ database) thay vì từ row
      const requestModel = this.allData.find((item: any) => Number(item.ID) === id);
      const isTBPApproved = Boolean(requestModel?.IsApprovedTBP || row.IsApprovedTBP);

      // Validate: productRtcId <= 0 && productSaleId <= 0
      if (productRtcId <= 0 && productSaleId <= 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng tạo Mã nội bộ cho sản phẩm [${productCode}].\nChọn Loại kho sau đó chọn Lưu thay đổi để tạo Mã nội bộ!`
        );
        return;
      }

      // Validate: currencyID <= 0
      if (currencyID <= 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng chọn loại tiền tệ cho sản phẩm [${productCode}].\nChọn Loại tiền sau đó chọn Lưu thay đổi!`
        );
        return;
      }

      // Nếu có parentProductCode, chỉ cần validate supplierSaleId
      if (parentProductCode) {
        if (supplierSaleId <= 0) {
          this.notify.warning(
            NOTIFICATION_TITLE.warning,
            `Vui lòng nhập Nhà cung cấp cho sản phẩm con [${productCode}].\nChọn Nhà cung cấp sau đó chọn Lưu thay đổi!`
          );
          return;
        }
        // Bỏ qua validate khác cho sản phẩm con
        continue;
      }

      // Validate: supplierSaleId <= 0
      if (supplierSaleId <= 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Nhà cung cấp cho sản phẩm [${productCode}].\nChọn Nhà cung cấp sau đó chọn Lưu thay đổi!`
        );
        return;
      }

      // Validate: unitPrice <= 0 && isBorrowProduct == 0
      if (unitPrice <= 0 && ticketType === 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Đơn giá cho sản phẩm [${productCode}]!`
        );
        return;
      }

      // Validate: !isTBPAprroved && isBorrowProduct == 1
      if (!isTBPApproved && ticketType === 1) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Sản phẩm [${productCode}] chưa được TBP duyệt!`
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
        if (tabIndex !== 4 && tabIndex !== 5) {
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
      const sub = this.srv.validateAddPoncc(validData).subscribe({
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
              const { listRequest, currencys } = this.preparePonccData(validData, tabIndex);

              const uniqueCurrencies = [...new Set(currencys)]; // Lọc distinct
              const currencyID = uniqueCurrencies.length > 1 ? 0 : (uniqueCurrencies[0] || 0);

              const supplierSub = this.supplierSaleService.getSupplierSaleByID(listSupplierSale[0]).subscribe({
                next: (rs) => {
                  this.isLoading = false;
                  let data = rs.data;

                  // Kiểm tra xem có phải tab Mượn demo (index 3) hoặc có sản phẩm mượn không
                  const isMuonDemoTab = tabIndex === 3;
                  const hasMuonProduct = validData.some((row: any) => Number(row.TicketType || 0) === 1);
                  const poType = (isMuonDemoTab || hasMuonProduct) ? 1 : 0; // 0: PO Thương mại, 1: PO Mượn

                  // Lấy số đơn hàng (BillCode) theo POType
                  const billCodeSub = this.ponccService.getBillCode(poType).subscribe({
                    next: (billCodeRes: any) => {
                      // Thu thập tất cả các Model từ các dòng đã chọn
                      const models = validData
                        .map((row: any) => String(row.Model || '').trim())
                        .filter((model: string) => model !== '')
                        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Lọc unique

                      const note = models.length > 0 ? models.join('; ') : '';

                      let poncc = {
                        SupplierSaleID: listSupplierSale[0],
                        AccountNumberSupplier: data.SoTK,
                        BankSupplier: data.NganHang,
                        AddressSupplier: data.AddressNCC,
                        MaSoThueNCC: data.MaSoThue,
                        EmployeeID: this.appUserService.employeeID,
                        CurrencyID: currencyID,
                        POType: poType, // 0: PO Thương mại, 1: PO Mượn
                        BillCode: billCodeRes.data || '', // Số đơn hàng theo POType
                        Note: note, // Gán Model từ projectpartlist vào Note
                      };

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
                      // Báo cho PonccDetailComponent biết BillCode đã được gen từ YCMH, không cần gen lại
                      modalRef.componentInstance.skipBillCodeGeneration = true;

                      // Reload table after modal closes
                      modalRef.result.finally(() => {
                        this.onSearch();
                      });
                    },
                    error: (error) => {
                      this.isLoading = false;
                      this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi lấy số đơn hàng!');
                    }
                  });
                  this.subscriptions.push(billCodeSub);
                },
                error: (error) => {
                  this.isLoading = false;
                  this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi validate dữ liệu!');
                }
              });
              this.subscriptions.push(supplierSub);
            },
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Lỗi khi validate dữ liệu!');
        }
      });
      this.subscriptions.push(sub);
    }
  }

  private preparePonccData(selectedData: any[], tabIndex: number): { listRequest: any[], currencys: number[] } {
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

      // Lấy tên loại kho từ ProductGroupID hoặc ProductGroupRTCID (tùy theo tab)
      const isRTCTab = tabIndex === 2 || tabIndex === 3;
      // Ở tab RTC, lấy từ ProductGroupRTCID, ngược lại lấy từ ProductGroupID
      const ProductGroupID = isRTCTab
        ? Number(row.ProductGroupRTCID || 0)
        : Number(row.ProductGroupID || 0);
      const productGroupData = isRTCTab ? this.dtproductGroupsRTC : this.dtproductGroups;
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

  onDownloadFile(tabIndex: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn tải file!');
      return;
    }

    this.selectedRowIds = selected.map(r => r.ID);
    this.selectedTabIndex = tabIndex;

    this.isLoading = true;
    const sub = this.srv.downloadFiles(selected).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "DownloadFiles.zip";
        a.click();
        window.URL.revokeObjectURL(url);
        this.notify.success('Thành công', 'Tải file thành công');
        this.isLoading = false;
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
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onHistoryPrice(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length !== 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn 1 sản phẩm cần xem lịch sử hỏi giá!`);
      return;
    }

    const productCode = selected[0].ProductCode;

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

  duplicateRow(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length !== 1) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn sản phẩm cần sao chép!`);
      return;
    }

    const originalRow = selected[0];
    const originalId = Number(originalRow.ID || 0);
    const originalDuplicateId = Number(originalRow.DuplicateID || 0);

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn sao chép các dòng đã chọn không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;
        const sub = this.srv.duplicate(selected).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || 'Sao chép thành công');

            // Reload data và sau đó tìm và select cả 2 dòng (gốc và mới)
            this.onSearch();

            // Đợi data load xong rồi tìm và select cả 2 dòng
            setTimeout(() => {
              this.selectAndEditDuplicateRows(tabIndex, originalId, originalDuplicateId);
            }, 500);

            this.isLoading = false;
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Sao chép thất bại');
            this.isLoading = false;
          }
        });
        this.subscriptions.push(sub);
      },
    });
  }

  // Method để tìm và select cả 2 dòng (gốc và mới) sau khi duplicate
  private selectAndEditDuplicateRows(tabIndex: number, originalId: number, originalDuplicateId: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid || !angularGrid.dataView) return;

    // Lấy tất cả dữ liệu từ grid
    const allItems: any[] = [];
    for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
      const item = angularGrid.dataView.getItem(i);
      if (item) {
        allItems.push(item);
      }
    }

    // Tìm dòng gốc và dòng mới
    const originalRow = allItems.find((item: any) => Number(item.ID) === originalId);

    // Tìm dòng mới: có DuplicateID = originalId hoặc ID = originalDuplicateId (nếu có)
    // Hoặc tìm dòng có cùng ProductCode, ProjectID và các field khác giống nhưng ID khác originalId
    let newRow = allItems.find((item: any) => {
      const itemId = Number(item.ID || 0);
      const itemDuplicateId = Number(item.DuplicateID || 0);

      // Dòng mới sẽ có DuplicateID = originalId
      if (itemDuplicateId === originalId && itemId !== originalId) {
        return true;
      }

      // Hoặc nếu originalDuplicateId > 0, tìm dòng có ID = originalDuplicateId
      if (originalDuplicateId > 0 && itemId === originalDuplicateId) {
        return true;
      }

      return false;
    });

    // Nếu không tìm thấy bằng DuplicateID, tìm bằng cách so sánh các field khác
    if (!newRow && originalRow) {
      newRow = allItems.find((item: any) => {
        const itemId = Number(item.ID || 0);
        if (itemId === originalId) return false; // Bỏ qua dòng gốc

        // So sánh các field quan trọng để tìm dòng duplicate
        return item.ProductCode === originalRow.ProductCode &&
               item.ProjectID === originalRow.ProjectID &&
               item.SupplierSaleID === originalRow.SupplierSaleID &&
               item.CurrencyID === originalRow.CurrencyID &&
               item.DateRequest === originalRow.DateRequest;
      });
    }

    if (!originalRow) {
      console.warn('Không tìm thấy dòng gốc sau khi duplicate');
      return;
    }

    if (!newRow) {
      console.warn('Không tìm thấy dòng mới sau khi duplicate');
      // Chỉ select dòng gốc nếu không tìm thấy dòng mới
      this.selectRowAndFocusQuantity(angularGrid, originalRow);
      return;
    }

    // Select cả 2 dòng
    const originalRowIndex = allItems.findIndex((item: any) => Number(item.ID) === Number(originalRow.ID));
    const newRowIndex = allItems.findIndex((item: any) => Number(item.ID) === Number(newRow.ID));

    if (originalRowIndex >= 0 && newRowIndex >= 0) {
      // Select cả 2 dòng
      angularGrid.slickGrid.setSelectedRows([originalRowIndex, newRowIndex]);

      // Refresh grid để đảm bảo selection được hiển thị
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đợi một chút để grid render xong
      setTimeout(() => {
        // Focus vào cột Quantity của dòng đầu tiên (dòng gốc)
        const quantityColumn = angularGrid.slickGrid.getColumns().find((col: any) => col.field === 'Quantity');
        if (quantityColumn) {
          const quantityColIndex = angularGrid.slickGrid.getColumnIndex(quantityColumn.id);
          if (quantityColIndex >= 0) {
            // Scroll đến dòng đầu tiên được select
            angularGrid.slickGrid.scrollRowIntoView(originalRowIndex, false);

            // Focus vào cell Quantity của dòng gốc và bắt đầu edit
            angularGrid.slickGrid.setActiveCell(originalRowIndex, quantityColIndex);

            // Đợi một chút rồi mới edit để đảm bảo cell đã được focus
            setTimeout(() => {
              angularGrid.slickGrid.editActiveCell();
            }, 100);
          }
        }
      }, 100);
    } else if (originalRowIndex >= 0) {
      // Chỉ select dòng gốc nếu không tìm thấy dòng mới
      this.selectRowAndFocusQuantity(angularGrid, originalRow);
    }
  }

  // Helper method để select một dòng và focus vào cột Quantity
  private selectRowAndFocusQuantity(angularGrid: AngularGridInstance, row: any): void {
    const allItems: any[] = [];
    for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
      const item = angularGrid.dataView.getItem(i);
      if (item) {
        allItems.push(item);
      }
    }

    const rowIndex = allItems.findIndex((item: any) => Number(item.ID) === Number(row.ID));
    if (rowIndex >= 0) {
      angularGrid.slickGrid.setSelectedRows([rowIndex]);

      // Refresh grid để đảm bảo selection được hiển thị
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đợi một chút để grid render xong
      setTimeout(() => {
        const quantityColumn = angularGrid.slickGrid.getColumns().find((col: any) => col.field === 'Quantity');
        if (quantityColumn) {
          const quantityColIndex = angularGrid.slickGrid.getColumnIndex(quantityColumn.id);
          if (quantityColIndex >= 0) {
            // Scroll đến dòng
            angularGrid.slickGrid.scrollRowIntoView(rowIndex, false);

            // Focus vào cell Quantity và bắt đầu edit
            angularGrid.slickGrid.setActiveCell(rowIndex, quantityColIndex);

            // Đợi một chút rồi mới edit để đảm bảo cell đã được focus
            setTimeout(() => {
              angularGrid.slickGrid.editActiveCell();
            }, 100);
          }
        }
      }, 100);
    }
  }

  onKeepProduct(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length !== 1) {
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
        const sub = this.srv.keepProduct(selected).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || 'Giữ hàng thành công');
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Giữ hàng thất bại')
        });
        this.subscriptions.push(sub);
      },
    });
  }

  updateProductImport(tabIndex: number, isImport: boolean): void {
    const isImportText = isImport ? "hàng nhập khẩu" : "hủy hàng nhập khẩu";

    if (this.changedRows.length > 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần chuyển thành ${isImportText}!`);
      return;
    }

    const rowsToUpdate = selected.filter((row: any) => row.IsImport !== isImport);

    rowsToUpdate.forEach((row: any) => {
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
        const sub = this.srv.updateProductImport(rowsToUpdate).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs.message || `${isImportText} thành công`);
            this.onSearch();
          },
          error: (error) => this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || `${isImportText} thất bại`)
        });
        this.subscriptions.push(sub);
      },
    });
  }

  onSelectYCMH(): void {
    const typeId = this.tabs[this.activeTabIndex]?.id;
    if (!typeId) return;

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy bảng dữ liệu!');
      return;
    }

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    if (!selectedRowIndexes || selectedRowIndexes.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một dòng!');
      return;
    }

    const selected = selectedRowIndexes.map((rowIndex: number) =>
      angularGrid.dataView.getItem(rowIndex)
    ).filter((item: any) => item);

    // Bước 1: Kiểm tra validation
    for (const data of selected) {
      const id = data['ID'] || 0;
      if (id <= 0) continue;

      const code = data['ProductNewCode'] || '';
      const isApprovedBGD = data['IsApprovedBGD'] || false;
      const isTechBought = data['IsTechBought'] || false;

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

    for (const data of selected) {
      const id = data['ID'] || 0;
      const code = data['ProductNewCode'] || '';

      if (id <= 0) continue;

      const isApprovedBGD = data['IsApprovedBGD'] || false;

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
      this.supplierId = null;

      this.activeModal.close({
        strLstRequestBuyIDs: strLstRequestBuyIDs,
        strLstCodes: strLstCodes
      });
    }
  }

  updateInternalCode(tabIndex: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Vui lòng chọn dòng cần cập nhật!`);
      return;
    }
    if (tabIndex !== 3) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Chức năng này chỉ dành cho tab Mượn Demo!'
      );
      return;
    }
    if (!this.validateManufacturerForVision(selected)) {
      return;
    }

    // Kiểm tra nếu có thay đổi khác ngoài ProductGroupID/ProductGroupRTCID
    const hasOtherChanges = this.changedRows.some(changedRow => {
      const rowId = changedRow.ID;
      const selectedRow = selected.find((r: any) => r.ID === rowId);
      if (!selectedRow) return false;

      // Lấy dữ liệu gốc
      const originalData = this.originalDataMap.get(rowId);
      if (!originalData) return false;

      // So sánh các field ngoài ProductGroupID và ProductGroupRTCID
      const fieldsToCheck = [
        'Quantity', 'UnitPrice', 'UnitImportPrice', 'VAT', 'TargetPrice',
        'CurrencyID', 'SupplierSaleID', 'WarehouseID', 'Note',
        'CurrencyRate', 'UnitMoney', 'IsPaidLater'
      ];

      for (const field of fieldsToCheck) {
        const currentValue = this.normalizeValue(changedRow[field]);
        const originalValue = this.normalizeValue(originalData[field]);
        if (currentValue !== originalValue) {
          return true; // Có thay đổi field khác
        }
      }

      return false; // Chỉ có thay đổi ProductGroupID/ProductGroupRTCID
    });

    if (hasOtherChanges) {
      this.notify.warning(NOTIFICATION_TITLE.warning, `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`);
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn cập nhật không?`,
      nzOkText: 'Cập nhật',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;

        // Lấy dữ liệu từ các dòng đã chọn, đảm bảo có ProductGroupRTCID
        const dataToUpdate = selected.map(row => {
          const rowData = { ...row };
          // Đảm bảo có ProductGroupRTCID nếu là mượn demo
          const ticketType = Number(rowData['TicketType'] || 0);
          if (ticketType === 1) { // Mượn
            // Nếu chưa có ProductGroupRTCID, lấy từ ProductGroupID (nếu có)
            if (!rowData['ProductGroupRTCID'] && rowData['ProductGroupID']) {
              rowData['ProductGroupRTCID'] = rowData['ProductGroupID'];
            }
          }
          return rowData;
        });

        const sub = this.srv.createProductRTC(dataToUpdate).subscribe({
          next: (rs) => {
            this.notify.success(NOTIFICATION_TITLE.success, rs?.message || "Cập nhật thành công");
            this.isLoading = false;
            // Reload data sau khi update thành công
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error.error?.message || 'Cập nhật thất bại');
            this.isLoading = false;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

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

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }
}
