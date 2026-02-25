import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
  Input,
  Optional,
  Inject,
} from '@angular/core';
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
  AngularSlickgridModule,
} from 'angular-slickgrid';
import {
  AutocompleterOption,
  MultipleSelectOption,
  SortDirectionNumber,
} from '@slickgrid-universal/common';
import { ProjectPartlistPurchaseRequestService } from '../project-partlist-purchase-request.service';
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
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import {
  NgbActiveModal,
  NgbModal,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { SupplierSaleDetailComponent } from '../../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { HistoryPriceComponent } from '../history-price/history-price.component';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { PonccDetailComponent } from '../../poncc/poncc-detail/poncc-detail.component';
import { PONCCService } from '../../poncc/poncc.service';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { ActivatedRoute } from '@angular/router';

interface Tab {
  id: number;
  title: string;
}

/**
 * Custom editor for single select with searchable dropdown and grouped options support
 */


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
    HasPermissionDirective,
    MenubarModule,
  ],
  templateUrl: './project-part-list-purchase-request-slick-grid.component.html',
  styleUrls: ['./project-part-list-purchase-request-slick-grid.component.css'],
})
export class ProjectPartListPurchaseRequestSlickGridComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('rejectReasonTpl', { static: false })
  rejectReasonTpl!: TemplateRef<any>;

  // Grid instances for each tab
  angularGrids: Map<number, AngularGridInstance> = new Map();
  columnDefinitionsMap: Map<number, Column[]> = new Map();
  gridOptionsMap: Map<number, GridOption> = new Map();
  datasetsMap: Map<number, any[]> = new Map();
  // Store original data for each tab (before filters)
  datasetsAllMap: Map<number, any[]> = new Map();
  // Store selected row IDs for each tab
  selectedRowIdsSetMap: Map<number, Set<number>> = new Map();

  // Tabs
  tabs: Tab[] = [];
  activeTabIndex: number = 0;
  requestTypes: any[] = [];
  visitedTabs: Set<number> = new Set(); // Track which tabs have been visited

  // Get filtered tabs based on isApprovedTBP, isFromMarketing, isFromHr and isApprovedBGD
  get filteredTabs(): Tab[] {
    if (this.isFromHr) {
      // Chỉ hiển thị tab Hàng HR (id = 6)
      return this.tabs.filter((tab) => tab.id === 6);
    }
    if (this.isFromMarketing) {
      // Chỉ hiển thị tab Marketing (id = 7)
      this.showHeader = true;
      return this.tabs.filter((tab) => tab.id === 7);
    }
    if (this.isApprovedTBP) {
      // Chỉ hiển thị tab Mượn demo (id = 4)
      return this.tabs.filter((tab) => tab.id === 4);
    }
    if (this.isApprovedBGD) {
      // Chỉ hiển thị tab Mua dự án (id = 1)
      return this.tabs.filter((tab) => tab.id === 1);
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
  dateStart: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  dateEnd: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 2,
    0
  );
  keyword: string = '';
  statusRequestFilter: number = 1;
  projectIdFilter: number | null = null;
  supplierId: number | null = null;
  isDeletedFilter: number = 0;
  isApprovedBGDFilter: number = -1;
  isApprovedTBPFilter: number = -1;
  @Input() pokhIdFilter: number = 0;

  // Filter options
  statusOptions: any[] = [
    { value: 0, label: '--Tất cả--' },
    { value: 1, label: 'Yêu cầu mua / mượn hàng' },
    { value: 2, label: 'Huỷ yêu cầu mua hàng' },
    { value: 3, label: 'Đã đặt hàng' },
    { value: 4, label: 'Đang về' },
    { value: 5, label: 'Đã về' },
    { value: 6, label: 'Không đặt hàng' },
  ];

  deletedOptions: any[] = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa xóa' },
    { value: 1, label: 'Đã xóa' },
  ];

  approvalOptions: any[] = [
    { value: -1, label: '--Tất cả--' },
    { value: 0, label: 'Chưa duyệt' },
    { value: 1, label: 'Đã duyệt' },
  ];

  projects: any[] = [];
  supplierSales: any[] = [];

  // UI state
  @Input() showHeader: boolean = false;
  @Input() headerText: string = 'YÊU CẦU MUA HÀNG';
  @Input() showCloseButton: boolean = false;
  @Input() isYCMH: boolean = false;
  @Input() isApprovedTBP: boolean = false;
  @Input() isSelectedPO: boolean = false;
  @Input() isApprovedBGD: boolean = false;
  @Input() listRequestBuySelect: boolean = false;
  shouldShowSearchBar: boolean = true;
  showSearchBar: boolean =
    typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  isLoading: boolean = false;
  @Input() isPurchaseRequestDemo: boolean = false;
  @Input() isFromMarketing: boolean = false;
  @Input() isFromHr: boolean = false;
  WarehouseType: number = 1;
  // Flag to track if grids are ready and initial data has been loaded
  private gridsInitialized: boolean = false;
  // Flag to indicate a reload is pending (Input changed before grids ready)
  private pendingReload: boolean = false;
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Menu items for PrimeNG Menubar
  menuItems: MenuItem[] = [];
  maxVisibleItems = 14; // Số nút tối đa hiển thị trực tiếp, còn lại vào More menu

  // Check if mobile
  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  // Toggle search panel
  toggleSearchPanel(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

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
    private route: ActivatedRoute,
    @Optional() public activeModal?: NgbActiveModal
  ) { }

  ngOnInit() {
    if (this.listRequestBuySelect) {
      this.showHeader = true;
    }

    // Lấy data từ tabData nếu có (khi component được sử dụng như tab component)
    // if (this.tabData) {
    //     if (this.tabData.isApprovedTBP !== undefined) {
    //         this.isApprovedTBP = this.tabData.isApprovedTBP;
    //     }
    //     // if (this.tabData.isSelectedPO !== undefined) {
    //     //   this.isSelectedPO = this.tabData.isSelectedPO;
    //     // }
    //     if (this.tabData.isApprovedBGD !== undefined) {
    //         this.isApprovedBGD = this.tabData.isApprovedBGD;
    //     }
    //     // if (this.tabData.listRequestBuySelect !== undefined) {
    //     //   this.listRequestBuySelect = this.tabData.listRequestBuySelect;
    //     // }
    // }

    this.route.queryParams.subscribe((params) => {
      this.isApprovedTBP = params['isApprovedTBP'] || false;
      this.isApprovedBGD = params['isApprovedBGD'] || false;
    });
    this.initMenuItems();
    this.loadMasterData();
    this.getRequestTypes();
    if (this.listRequestBuySelect) {
      this.activeTabIndex = -1;

      this.onSearch();
    }
  }

  // Initialize menu items based on current state
  initMenuItems() {
    this.menuItems = [];

    // Khi isFromHr = true, chỉ hiển thị: Thêm, Sửa, Hủy Y/c, Xuất Excel
    if (this.isFromHr) {
      this.menuItems = [
        {
          label: 'Sửa',
          icon: 'fa-solid fa-pen-to-square fa-lg text-warning',
          command: () => this.onEdit(this.activeTabIndex),
        },
        {
          label: 'Hủy Y/c',
          icon: 'fa-solid fa-trash fa-lg text-danger',
          command: () => this.onDeleteRequest(this.activeTabIndex),
        },
        {
          label: 'Xuất Excel',
          icon: 'fa-solid fa-file-excel fa-lg text-success',
          items: [
            {
              label: 'Xuất theo dòng đã chọn',
              icon: 'fa-solid fa-file-excel fa-lg text-success',
              command: () => this.exportExcelSelectedRows(),
            },
            {
              label: 'Xuất tất cả',
              icon: 'fa-solid fa-file-excel fa-lg text-success',
              command: () => this.exportExcelAllTabs(),
            },
          ],
        },
      ];
      return;
    }

    // Khi isFromMarketing = true, chỉ hiển thị nút xóa
    if (this.isFromMarketing) {
      this.menuItems = [
        {
          label: 'Hủy Y/c',
          icon: 'fa-solid fa-trash fa-lg text-danger',
          command: () => this.onDeleteRequest(this.activeTabIndex),
        },
      ];

      return;
    }

    // Khi listRequestBuySelect = true, chỉ hiển thị nút xóa
    if (this.listRequestBuySelect && !this.isYCMH) {

      this.menuItems = [
        {
          label: 'Hủy Y/c',
          icon: 'fa-solid fa-trash fa-lg text-danger',
          command: () => this.onDeleteRequest(this.activeTabIndex),
        },
      ];

      return;
    }

    // Khi isYCMH = true
    if (this.isYCMH) {
      this.menuItems = [
        {
          label: 'Chọn YCMH',
          icon: 'fa-solid fa-plus fa-lg text-primary',
          command: () => this.onSelectYCMH(),
        },
      ];
      return;
    }

    // Khi isApprovedBGD = true, chỉ hiển thị 2 nút BGD
    if (
      this.isApprovedBGD &&
      !this.isApprovedTBP &&
      !this.isYCMH &&
      !this.listRequestBuySelect
    ) {
      if (this.permissionService.hasPermission('N58,N1')) {
        this.menuItems = [
          {
            label: 'BGD duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.onApproved(this.activeTabIndex, true, false),
          },
          {
            label: 'BGD hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.onApproved(this.activeTabIndex, false, false),
          },
        ];
      }
      return;
    }

    // Khi isApprovedTBP = true, chỉ hiển thị 2 nút TBP
    if (
      this.isApprovedTBP &&
      !this.isApprovedBGD &&
      !this.isYCMH &&
      !this.listRequestBuySelect
    ) {
      this.menuItems = [
        {
          label: 'TBP duyệt',
          icon: 'fa-solid fa-circle-check fa-lg text-success',
          command: () => this.onApproved(this.activeTabIndex, true, true),
        },
        {
          label: 'TBP hủy duyệt',
          icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
          command: () => this.onApproved(this.activeTabIndex, false, true),
        },
      ];
      return;
    }

    // Khi cả isApprovedTBP và isApprovedBGD đều false, hiển thị tất cả các nút
    if (
      !this.isApprovedTBP &&
      !this.isApprovedBGD &&
      !this.isYCMH &&
      !this.listRequestBuySelect
    ) {
      const allItems: MenuItem[] = [
        {
          label: 'Check đặt hàng',
          icon: 'fa-solid fa-check fa-lg text-success',
          command: () => this.onCheckOrder(this.activeTabIndex, true),
        },
        {
          label: 'Hủy Check đặt hàng',
          icon: 'fa-solid fa-xmark fa-lg text-danger',
          command: () => this.onCheckOrder(this.activeTabIndex, false),
        },
      ];

      // Items requiring N35,N1 permission
      if (this.permissionService.hasPermission('N35,N1')) {
        allItems.push(
          {
            label: 'Lưu thay đổi',
            icon: 'fa-solid fa-floppy-disk fa-lg text-primary',
            visible: !this.isSelectedPO,
            command: () => this.onSaveData(this.activeTabIndex),
          },
          {
            label: 'Sửa',
            icon: 'fa-solid fa-pen-to-square fa-lg text-warning',
            command: () => this.onEdit(this.activeTabIndex),
          },
          {
            label: 'Hủy Y/c',
            icon: 'fa-solid fa-trash fa-lg text-danger',
            command: () => this.onDeleteRequest(this.activeTabIndex),
          },
          {
            label: 'Thêm NCC',
            icon: 'fa-solid fa-plus fa-lg text-primary',
            command: () => this.onAddSupplierSale(),
          },
          {
            label: 'Y/C duyệt mua',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.onRequestApproved(this.activeTabIndex, true),
          },
          {
            label: 'Hủy Y/C duyệt mua',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.onRequestApproved(this.activeTabIndex, false),
          },
          {
            label: 'Hoàn thành',
            icon: 'fa-solid fa-check-circle fa-lg text-success',
            command: () => this.onCompleteRequest(this.activeTabIndex, 7),
          },
          {
            label: 'Hủy hoàn thành',
            icon: 'fa-solid fa-times-circle fa-lg text-danger',
            command: () => this.onCompleteRequest(this.activeTabIndex, 1),
          }
        );
      }

      // Items requiring N58,N1 permission
      if (this.permissionService.hasPermission('N58,N1')) {
        allItems.push(
          {
            label: 'BGD duyệt',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            visible: !this.isSelectedPO,
            command: () => this.onApproved(this.activeTabIndex, true, false),
          },
          {
            label: 'BGD hủy duyệt',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            visible: !this.isSelectedPO,
            command: () => this.onApproved(this.activeTabIndex, false, false),
          }
        );
      }

      // Items requiring N35,N1 permission (continued)
      if (this.permissionService.hasPermission('N35,N1')) {
        allItems.push(
          {
            label: 'Tạo PO NCC',
            icon: 'fa-solid fa-file-circle-plus fa-lg text-primary',
            command: () => this.onAddPoncc(),
          },
          {
            label: 'Tải file',
            icon: 'fa-solid fa-download fa-lg text-primary',
            command: () => this.onDownloadFile(this.activeTabIndex),
          },
          {
            label: 'Xuất Excel',
            icon: 'fa-solid fa-file-excel fa-lg text-success',
            items: [
              {
                label: 'Xuất theo dòng đã chọn',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportExcelSelectedRows(),
              },
              {
                label: 'Xuất tất cả',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => this.exportExcelAllTabs(),
              },
            ],
          }
        );
      }

      // Lọc các items có visible = false
      const visibleItems = allItems.filter((item) => item.visible !== false);

      // Nếu số lượng items <= maxVisibleItems, hiển thị tất cả trực tiếp
      if (visibleItems.length <= this.maxVisibleItems) {
        this.menuItems = visibleItems;
      } else {
        // Nếu vượt quá maxVisibleItems, tách ra: items chính + More menu
        const directItems = visibleItems.slice(0, this.maxVisibleItems - 1);
        const moreItems = visibleItems.slice(this.maxVisibleItems - 1);

        this.menuItems = [
          ...directItems,
          {
            label: 'More',
            icon: 'fa-solid fa-ellipsis fa-lg text-secondary',
            items: moreItems,
          },
        ];
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    // Khi listRequestBuySelect hoặc pokhIdFilter thay đổi và grids đã được khởi tạo, reload data
    const hasRelevantChanges =
      changes['listRequestBuySelect'] || changes['pokhIdFilter'];

    if (hasRelevantChanges) {
      if (this.gridsInitialized) {
        // Reload data khi Input values thay đổi sau khi grids đã sẵn sàng
        setTimeout(() => {
          this.onSearch();
        }, 100);
      } else {
        // Đánh dấu cần reload khi grids sẵn sàng
        this.pendingReload = true;
      }
    }
  }

  // Load master data
  loadMasterData() {
    const sub1 = this.srv.getProductGroups().subscribe({
      next: (data) => (this.dtproductGroups = data || []),
      error: (err) => console.error('Error loading product groups:', err),
    });
    if (this.activeTabIndex === 3 || this.activeTabIndex === 4)
      this.WarehouseType = 1;

    const sub2 = this.srv.getProductGroupsRTC(this.WarehouseType).subscribe({
      next: (data) => (this.dtproductGroupsRTC = data || []),
      error: (err) => console.error('Error loading product groups RTC:', err),
    });

    const sub3 = this.srv.getSupplierSales().subscribe({
      next: (data) => {
        this.dtSupplierSale = data || [];
        this.supplierSales = data || [];
        // Update editor collections after data is loaded
        this.updateEditorCollections();
      },
      error: (err) => console.error('Error loading suppliers:', err),
    });

    const sub4 = this.srv.getCurrencies().subscribe({
      next: (data) => {
        this.dtcurrency = data || [];
        // Update editor collections after data is loaded
        this.updateEditorCollections();
      },
      error: (err) => console.error('Error loading currencies:', err),
    });

    const sub5 = this.srv.getProjects().subscribe({
      next: (data) => {
        this.dtprojects = data || [];
        this.projects = data || [];
      },
      error: (err) => console.error('Error loading projects:', err),
    });

    const sub6 = this.srv.getWarehouses().subscribe({
      next: (data) => (this.dtwarehouses = data || []),
      error: (err) => console.error('Error loading warehouses:', err),
    });

    const sub7 = this.srv.getPOKH().subscribe({
      next: (data) => (this.lstPOKH = data || []),
      error: (err) => console.error('Error loading POKH:', err),
    });

    this.subscriptions.push(sub1, sub2, sub3, sub4, sub5, sub6, sub7);
  }

  // Get request types and create tabs
  getRequestTypes() {
    const sub = this.srv.getRequestTypes().subscribe({
      next: (types: any[]) => {
        this.requestTypes = types || [];
        this.tabs = (types || []).map((t) => ({
          id: t.ID,
          title: t.RequestTypeName.toUpperCase(),
        }));

        this.initAllGrids();

        this.cdr.detectChanges();

        if (this.tabs.length > 0) {
          setTimeout(() => {
            // Nếu isFromHr = true, chỉ mark tab 6 (Hàng HR) là visited
            if (this.isFromHr) {
              const hrTab = this.tabs.find((tab) => tab.id === 6);
              if (hrTab) {
                this.visitedTabs.add(hrTab.id);
                this.activeTabIndex = 0;
              }
            }
            // Nếu isFromMarketing = true, chỉ mark tab 7 (Marketing) là visited
            else if (this.isFromMarketing) {
              const marketingTab = this.tabs.find((tab) => tab.id === 7);
              if (marketingTab) {
                this.visitedTabs.add(marketingTab.id);
                this.activeTabIndex = 0; // Index trong filteredTabs sẽ là 0
              }
            }
            // Nếu isApprovedTBP = true, chỉ mark tab 4 (Mượn demo) là visited
            else if (this.isApprovedTBP) {
              const muonDemoTab = this.tabs.find((tab) => tab.id === 4);
              if (muonDemoTab) {
                this.visitedTabs.add(muonDemoTab.id);
                this.activeTabIndex = 0; // Index trong filteredTabs sẽ là 0
              }
            } else if (this.listRequestBuySelect) {
              //NTA B update 2612
              // Nếu listRequestBuySelect = true, chuyển sang tab hàng thương mại id = 5
              const hangThuongMaiTab = this.tabs.find((tab) => tab.id === 5);
              if (hangThuongMaiTab) {
                // Tìm index của tab "Hàng thương mại" trong filteredTabs
                const tabIndex = this.filteredTabs.findIndex(
                  (tab) => tab.id === 5
                );
                // set activeTabIndex để nztabset chuyển tab
                this.activeTabIndex = tabIndex >= 0 ? tabIndex : 0;
                this.cdr.detectChanges();

                // Sau đó thêm vào visitedTabs để render grid
                setTimeout(() => {
                  this.visitedTabs.add(hangThuongMaiTab.id);
                  this.cdr.detectChanges();
                  //load lại data khi chuyên tab
                  setTimeout(() => {
                    this.onSearch();
                  }, 150);
                }, 100);
                return;
              }
            } else {
              this.visitedTabs.add(this.tabs[0].id);
            }
            this.cdr.detectChanges();

            // Load data after grid container is rendered
            setTimeout(() => {
              this.onSearch();
              this.gridsInitialized = true;
              // Nếu có pending reload (Input values đã thay đổi trước khi grids sẵn sàng), reload lại
              if (this.pendingReload) {
                this.pendingReload = false;
                setTimeout(() => this.onSearch(), 100);
              }
            }, 150);
          }, 200);
        }
      },
      error: (err) => this.notify.error('Lỗi', err.error.message || err?.message),
    });

    this.subscriptions.push(sub);
  }

  ngAfterViewInit() {
    // If tabs are already loaded, ensure first tab is marked as visited
    // This handles the case where getRequestTypes completes before ngAfterViewInit
    if (
      this.tabs.length > 0 &&
      !this.listRequestBuySelect &&
      !this.visitedTabs.has(this.tabs[0].id)
    ) {
      //NTA B update 2612
      setTimeout(() => {
        this.visitedTabs.add(this.tabs[0].id);
        this.cdr.detectChanges();

        setTimeout(() => {
          this.onSearch();
          this.gridsInitialized = true;
          // Nếu có pending reload, reload lại
          if (this.pendingReload) {
            this.pendingReload = false;
            setTimeout(() => this.onSearch(), 100);
          }
        }, 150);
      }, 200);
    }
  }

  // Initialize all grids
  initAllGrids() {
    this.tabs.forEach((tab) => {
      this.columnDefinitionsMap.set(tab.id, this.initGridColumns(tab.id));
      this.gridOptionsMap.set(tab.id, this.initGridOptions(tab.id));
      this.datasetsMap.set(tab.id, []);
    });
  }

  // Initialize columns for BGD approval mode (limited columns)
  private initBGDApprovalColumns(typeId: number, isRTCTab: boolean): Column[] {
    return [
      // TT - Row number
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 50,
        sortable: false,
        filterable: false,
      },
      // IsApprovedBGD - Trạng thái duyệt BGD (màu xanh/đỏ)
      {
        id: 'IsApprovedBGDText',
        field: 'IsApprovedBGD',
        name: 'TT Duyệt BGĐ',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (_row, _cell, value, _column, dataContext) => {
          const isApproved = value === true || value === 1;
          const text = isApproved ? 'Đã duyệt' : 'Chưa duyệt';
          const color = isApproved ? '#28a745' : '#dc3545'; // green / red
          return `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
        },
        filter: {
          collection: [
            { value: true, label: 'Đã duyệt' },
            { value: false, label: 'Chưa duyệt' },
          ],
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      // ProductCode - Mã sản phẩm (click để mở lịch sử hỏi giá)
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              class="product-code-link"
              data-action="history-price"
              title="Click để xem lịch sử hỏi giá"
              style="color: #1890ff; cursor: pointer; text-decoration: underline;"
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
      // ProductName - Tên sản phẩm
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
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
        },
      },
      // UnitName - Đơn vị
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'ĐVT',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // Quantity - Số lượng
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // UnitPrice - Đơn giá
      {
        id: 'UnitPrice',
        field: 'UnitPrice',
        name: 'Đơn giá',
        width: 120,
        sortable: true,
        filterable: true,
        type: 'number',
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // TotalPrice - Thành tiền
      {
        id: 'TotalPrice',
        field: 'TotalPrice',
        name: 'Thành tiền',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // CurrencyCode - Loại tiền tệ
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row: number, cell: number, value: any) => {
          const currency = this.dtcurrency.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        },
      },
      // CurrencyRate - Tỷ giá
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // NameNCC - Nhà cung cấp
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 300,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';

          const supplierId = Array.isArray(value) ? value[0] : value;
          const supplier = this.dtSupplierSale.find((s: any) => s.ID === supplierId);

          if (!supplier) return '';

          const codeNCC = supplier.CodeNCC || '';
          const nameNCC = supplier.NameNCC || '';

          const tooltipText = `Mã: ${codeNCC}\nTên: ${nameNCC}`;

          return `
            <span title="${tooltipText.replace(/"/g, '&quot;')}">
              ${nameNCC}
            </span>
          `;
        },
        editor: {
          model: Editors['autocompleter'],
          alwaysSaveOnEnterKey: true,
          editorOptions: {
            minLength: 0,
            forceUserInput: false,
            openSearchListOnFocus: true,
            labelValue: 'NameNCC',  // Hiển thị NameNCC khi chọn xong
            valueField: 'ID',       // Lưu giá trị ID vào field SupplierSaleID
            fetch: (searchTerm: string, callback: (items: false | any[]) => void) => {
              const suppliers = this.dtSupplierSale || [];
              if (!searchTerm || searchTerm.length === 0) {
                callback(suppliers);
              } else {
                const filtered = suppliers.filter((s: any) => {
                  const code = (s.CodeNCC || '').toLowerCase();
                  const name = (s.NameNCC || '').toLowerCase();
                  const term = searchTerm.toLowerCase();
                  return code.includes(term) || name.includes(term);
                });
                callback(filtered);
              }
            },
            renderItem: {
              layout: 'twoRows',
              templateCallback: (item: any) => {
                const codeNCC = item?.CodeNCC || '';
                const nameNCC = item?.NameNCC || '';
                const ngayUpdate = item?.NgayUpdate ? new Date(item.NgayUpdate).toLocaleDateString('vi-VN') : '';
                const tooltipText = `Mã: ${codeNCC}\nTên: ${nameNCC}\nNgày Update: ${ngayUpdate}`;
                return `<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 4px 0; gap: 8px;" title="${tooltipText.replace(/"/g, '&quot;')}">
                  <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #1890ff; word-wrap: break-word; overflow-wrap: break-word;">${codeNCC}</div>
                    <div style="font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 2.8em;">${nameNCC}</div>
                  </div>
                  <div style="text-align: right; min-width: 100px; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="font-size: 11px; color: #999;">${ngayUpdate ? 'Ngày cập nhật' : ''}</div>
                    <div style="font-size: 11px; color: #666; font-weight: 500;">${ngayUpdate}</div>
                  </div>
                </div>`;
              },
            },
          } as AutocompleterOption,
        },
      },
      // Note - Ghi chú
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${value}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      // ReasonCancel - Lý do huỷ
      {
        id: 'ReasonCancel',
        field: 'ReasonCancel',
        name: 'Lý do hủy',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
            <span
              title="${value}"
              style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
    ];
  }

  // Initialize grid columns for a specific tab
  private initGridColumns(typeId: number): Column[] {
    // Check if this is an RTC tab (indexes 3 and 4 = typeId 3 and 4)
    const isRTCTab = typeId === 3 || typeId === 4;
    // Check if this is tab 4 (Mượn demo - RTC) - only this tab has TBP columns
    const isTBPTab = typeId === 4;

    // Khi isApprovedBGD == true, chỉ hiển thị các cột cần thiết cho BGĐ duyệt
    if (this.isApprovedBGD) {
      return this.initBGDApprovalColumns(typeId, isRTCTab);
    }

    // Check if this is tab 5 (Hàng Thương mại)
    const isCommercialTab = typeId === 5;

    const columns: Column[] = [
      // TT - Row number (frozen) - ẩn ở tab Hàng Thương mại
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 50,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
        hidden: isCommercialTab,
      },
      {
        id: 'WarehouseID',
        field: 'WarehouseID',
        name: 'Kho nhập hàng',
        width: 120,
        sortable: false,
        filterable: true,
        hidden: typeId === 3 || isCommercialTab,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        editor: {
          model: Editors['singleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: this.getWarehouseCollection(),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row: number, cell: number, value: any) => {
          const warehouse = this.dtwarehouses.find((w: any) => w.ID === value);
          return warehouse ? warehouse.WarehouseName : '';
        },
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
          filter: {
            collection: [
              { value: true, label: 'Đã duyệt' },
              { value: false, label: 'Chưa duyệt' },
            ],
            model: Filters['multipleSelect'],
            collectionOptions: {
              addBlankEntry: true
            },
            options: {
              offsetLeft: 14,
              width: 100,
            } as Partial<MultipleSelectOption>,
          },
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
          exportCustomFormatter: Formatters.date,
          type: 'date',
          params: { dateFormat: 'DD/MM/YYYY' },
          filter: { model: Filters['compoundDate'] },
        }
      );
    }

    // Continue with common columns
    // Chỉ thêm 2 cột YC duyệt và BGĐ duyệt nếu KHÔNG phải tab "Mua hàng dự án" (typeId !== 1) và KHÔNG phải tab "Mượn demo" (typeId !== 4) và KHÔNG phải tab mua demo (typeId !== 3) và KHÔNG phải tab Hàng Thương mại (typeId !== 5)
    if (typeId !== 1 && typeId !== 4 && typeId !== 3 && typeId !== 5) {
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
        }
      );
    }

    // Chỉ thêm cột CustomerName nếu KHÔNG phải tab "Mua hàng dự án" (typeId !== 1) và KHÔNG phải tab mua demo (typeId !== 3)
    if (typeId !== 1 && typeId !== 3) {
      columns.push(
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
        }
      );
    }

    columns.push(
      // ProjectCode
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã dự án',
        width: 100,
        sortable: false,
        filterable: true,
        hidden: typeId === 3,
        filter: {
          model: Filters['compoundInputText'],
          // model: Filters['multipleSelect'],
          // collectionOptions: {
          //   addBlankEntry: true
          // },
          // collection: [],
          // filterOptions: {
          //   filter: true,

          // } as MultipleSelectOption,
        },
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
      {
        id: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        field: isRTCTab ? 'ProductGroupRTCID' : 'ProductGroupID',
        name: 'Loại kho',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          // model: Filters['compoundInputText'],
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        editor: {
          model: Editors['singleSelect'],
          collection: this.getProductGroupCollection(isRTCTab),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row: number, cell: number, value: any) => {
          const groups = isRTCTab
            ? this.dtproductGroupsRTC
            : this.dtproductGroups;
          const group = groups.find((g: any) => g.ID === value);
          return group ? group.ProductGroupName : '';
        },
      }, // ProductNewCode or ProductCodeRTC for RTC tabs
      {
        id: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        field: isRTCTab ? 'ProductCodeRTC' : 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
          // model: Filters['multipleSelect'],
          // collectionOptions: {
          //   addBlankEntry: true
          // },
          // collection: [],
          // filterOptions: {
          //   filter: true,
          // } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          const fieldValue = isRTCTab
            ? dataContext.ProductCodeRTC
            : dataContext.ProductNewCode;
          return `
            <span
              title="${fieldValue}"
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
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
          // model: Filters['multipleSelect'],
          // collectionOptions: {
          //   addBlankEntry: true
          // },
          // collection: [],
          // filterOptions: {
          //   filter: true,
          // } as MultipleSelectOption,
        },
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
        width: 160,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
          // model: Filters['multipleSelect'],
          // collectionOptions: {
          //   addBlankEntry: true
          // },
          // collection: [],
          // filterOptions: {
          //   filter: true,
          // } as MultipleSelectOption,
        },
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
      // Model - ẩn ở tab Hàng Thương mại (typeId === 5)
      {
        id: 'Model',
        field: 'Model',
        name: 'Thông số kỹ thuật',
        width: 180,
        sortable: true,
        filterable: true,
        hidden: isCommercialTab,
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
      {
        id: 'Manufacturer',
        field: 'Manufacturer',
        name: 'Hãng',
        width: 90,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
          // model: Filters['multipleSelect'],
          // collectionOptions: {
          //   addBlankEntry: true
          // },
          // collection: [],
          // filterOptions: {
          //   filter: true,
          // } as MultipleSelectOption,
        },
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
      // Quantity
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'Số lượng',
        width: 80,
        sortable: true,
        filterable: true,
        type: 'number',
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // ProductGroupID or ProductGroupRTCID for RTC tabs

      // UnitName - Cột cố định, tính index để đảm bảo các cột sau luôn đúng vị trí khi có ẩn/hiện cột động
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'ĐVT',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        // Tính index cố định: TT(0) + WarehouseID(1) + TBP columns(0-3) + Approval columns(0-2) + CustomerName(0-1) + Fixed columns before UnitName
        // Fixed columns trước UnitName: ProjectCode, ProductGroupID/ProductGroupRTCID, ProductNewCode/ProductCodeRTC, ProductCode, ProductName, Model, Manufacturer, Quantity = 8 columns
        // Index = 2 + (isTBPTab ? 3 : 0) + (typeId !== 1 && typeId !== 4 ? 2 : 0) + (typeId !== 1 ? 1 : 0) + 8
      },
      // WarehouseID
      // {
      //   id: 'WarehouseID',
      //   field: 'WarehouseID',
      //   name: 'Kho',
      //   width: 120,
      //   sortable: true,
      //   filterable: true,
      //   editor: {
      //     model: Editors['singleSelect'],
      //     collection: this.getWarehouseCollection(),
      //     collectionOptions: {
      //       addBlankEntry: false
      //     },
      //     editorOptions: {
      //       enableClear: true
      //     }
      //   },
      //   formatter: (row: number, cell: number, value: any) => {
      //     const warehouse = this.dtwarehouses.find((w: any) => w.ID === value);
      //     return warehouse ? warehouse.WarehouseName : '';
      //   },
      //   filter: { model: Filters['compoundInputNumber'] },
      // },
      // Manufacturer

      // StatusRequestText
      {
        id: 'StatusRequestText',
        field: 'StatusRequestText',
        name: 'Trạng thái',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
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
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
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
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      // CurrencyID
      {
        id: 'CurrencyID',
        field: 'CurrencyID',
        name: 'Loại tiền',
        width: 100,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        editor: {
          model: Editors['singleSelect'],
          collection: this.getCurrencyCollection(),
          editorOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (row: number, cell: number, value: any) => {
          const currency = this.dtcurrency.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        },
      },

      // UnitPricePOKH
      {
        id: 'UnitPricePOKH',
        field: 'UnitPricePOKH',
        name: 'Đơn giá bán (Sale Admin up)',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
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
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 4,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // HistoryPrice
      {
        id: 'HistoryPrice',
        field: 'HistoryPrice',
        name: 'Giá lịch sử',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
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
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // TotalPrice
      {
        id: 'TotalPrice',
        field: 'TotalPrice',
        name: 'Thành tiền',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // DiscountPercent
      {
        id: 'DiscountPercentPur',
        field: 'DiscountPercentPur',
        name: '% giảm giá',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        type: 'number',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
      },
      // TotalPriceExchange
      {
        id: 'TotalPriceExchange',
        field: 'TotalPriceExchange',
        name: 'Thành tiền QĐ',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // VAT
      {
        id: 'VAT',
        field: 'VAT',
        name: 'VAT (%)',
        width: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
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
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // TargetPrice

      // SupplierSaleID
      {
        id: 'SupplierSaleID',
        field: 'SupplierSaleID',
        name: 'Nhà cung cấp',
        width: 300,
        sortable: false,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collectionOptions: {
            addBlankEntry: true,
          },
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value) => {
          if (!value) return '';

          const supplierId = Array.isArray(value) ? value[0] : value;
          const supplier = this.dtSupplierSale.find((s: any) => s.ID === supplierId);

          if (!supplier) return '';

          const codeNCC = supplier.CodeNCC || '';
          const nameNCC = supplier.NameNCC || '';

          const tooltipText = `Mã: ${codeNCC}\nTên: ${nameNCC}`;

          return `
            <span title="${tooltipText.replace(/"/g, '&quot;')}">
              ${nameNCC}
            </span>
          `;
        },
        editor: {
          model: Editors['autocompleter'],
          alwaysSaveOnEnterKey: true,
          editorOptions: {
            minLength: 0,
            forceUserInput: false,
            openSearchListOnFocus: true,
            labelValue: 'NameNCC',  // Hiển thị NameNCC khi chọn xong
            valueField: 'ID',       // Lưu giá trị ID vào field SupplierSaleID
            fetch: (searchTerm: string, callback: (items: false | any[]) => void) => {
              const suppliers = this.dtSupplierSale || [];
              if (!searchTerm || searchTerm.length === 0) {
                callback(suppliers);
              } else {
                const filtered = suppliers.filter((s: any) => {
                  const code = (s.CodeNCC || '').toLowerCase();
                  const name = (s.NameNCC || '').toLowerCase();
                  const term = searchTerm.toLowerCase();
                  return code.includes(term) || name.includes(term);
                });
                callback(filtered);
              }
            },
            renderItem: {
              layout: 'twoRows',
              templateCallback: (item: any) => {
                const codeNCC = item?.CodeNCC || '';
                const nameNCC = item?.NameNCC || '';
                const ngayUpdate = item?.NgayUpdate ? new Date(item.NgayUpdate).toLocaleDateString('vi-VN') : '';
                const tooltipText = `Mã: ${codeNCC}\nTên: ${nameNCC}\nNgày Update: ${ngayUpdate}`;
                return `<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 4px 0; gap: 8px;" title="${tooltipText.replace(/"/g, '&quot;')}">
                  <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #1890ff; word-wrap: break-word; overflow-wrap: break-word;">${codeNCC}</div>
                    <div style="font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 2.8em;">${nameNCC}</div>
                  </div>
                  <div style="text-align: right; min-width: 100px; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="font-size: 11px; color: #999;">${ngayUpdate ? 'Ngày cập nhật' : ''}</div>
                    <div style="font-size: 11px; color: #666; font-weight: 500;">${ngayUpdate}</div>
                  </div>
                </div>`;
              },
            },
          } as AutocompleterOption,
        },
      },
      // TotalDayLeadTime
      {
        id: 'TotalDayLeadTime',
        field: 'TotalDayLeadTime',
        name: 'Lead time (ngày)',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
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
      // {
      //   id: 'Model',
      //   field: 'Model',
      //   name: 'Thông số kỹ thuật',
      //   width: 200,
      //   sortable: true,
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      //   formatter: (_row, _cell, value, _column, dataContext) => {
      //     if (!value) return '';
      //     return `
      //       <span
      //         title="${dataContext.Model}"
      //         style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
      //       >
      //         ${value}
      //       </span>
      //     `;
      //   },
      //   customTooltip: {
      //     useRegularTooltip: true,
      //     // useRegularTooltipFromCellTextOnly: true,
      //   },
      // },
      // CurrencyRate
      {
        id: 'CurrencyRate',
        field: 'CurrencyRate',
        name: 'Tỷ giá',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
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
      // TargetPrice
      {
        id: 'TargetPrice',
        field: 'TargetPrice',
        name: 'Giá Target',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
      },
      // UnitImportPrice
      {
        id: 'UnitImportPrice',
        field: 'UnitImportPrice',
        name: 'Giá nhập khẩu',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
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
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 2),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
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
        exportCustomFormatter: Formatters.date,
        type: 'date',
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
        name: 'Mã Khách',
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
        name: 'Tồn được sử dụng HN',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalHCM',
        field: 'TotalHCM',
        name: 'Tồn được sử dụng HCM',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalHP',
        field: 'TotalHP',
        name: 'Tồn được sử dụng HP',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalDP',
        field: 'TotalDP',
        name: 'Tồn được sử dụng ĐP',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
        params: { groupFormatterPrefix: 'Tổng: ' },
      },
      {
        id: 'TotalBN',
        field: 'TotalBN',
        name: 'Tồn được sử dụng BN',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: (row: number, cell: number, value: any) =>
          this.formatNumberEnUS(value, 0),
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: (totals: any, columnDef: any) =>
          this.sumTotalsFormatterWithFormat(totals, columnDef),
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
      const customerNameIndex = columns.findIndex(
        (col) => col.id === 'CustomerName'
      );
      const modelIndex = columns.findIndex((col) => col.id === 'Model');

      if (customerNameIndex !== -1 && modelIndex !== -1) {
        // Swap vị trí: đặt Model trước CustomerName
        const temp = columns[customerNameIndex];
        columns[customerNameIndex] = columns[modelIndex];
        columns[modelIndex] = temp;
      }
    }

    // Nếu là tab 5 (Thương mại) và listRequestBuySelect = true, chuyển GuestCode lên trước ProjectCode
    if (typeId === 5 && this.listRequestBuySelect) {
      const projectCodeIndex = columns.findIndex(
        (col) => col.id === 'ProjectCode'
      );
      const guestCodeIndex = columns.findIndex((col) => col.id === 'GuestCode');

      if (
        projectCodeIndex !== -1 &&
        guestCodeIndex !== -1 &&
        guestCodeIndex > projectCodeIndex
      ) {
        // Lấy cột GuestCode ra
        const guestCodeColumn = columns[guestCodeIndex];
        // Xóa GuestCode khỏi vị trí cũ (xóa từ vị trí lớn hơn trước để không ảnh hưởng đến index của ProjectCode)
        columns.splice(guestCodeIndex, 1);
        // Chèn GuestCode vào trước ProjectCode (sau khi xóa, projectCodeIndex vẫn đúng)
        columns.splice(projectCodeIndex, 0, guestCodeColumn);
      }
    }

    // Xóa cột UnitPricePOKH (Đơn giá bán Sale Admin up) nếu KHÔNG phải tab hàng thương mại (typeId !== 5)
    // Chỉ hiển thị cột này ở tab hàng thương mại (typeId === 5)
    if (typeId !== 5) {
      const unitPricePOKHIndex = columns.findIndex(
        (col) => col.id === 'UnitPricePOKH'
      );
      if (unitPricePOKHIndex !== -1) {
        columns.splice(unitPricePOKHIndex, 1);
      }
    }

    // Di chuyển cột Loại kho và Mã nội bộ ra sau cột Đơn vị tính (UnitName) ở tab Mua dự án (typeId = 1)
    if (typeId === 1) {
      const unitNameIndex = columns.findIndex((col) => col.id === 'UnitName');
      const productGroupIndex = columns.findIndex(
        (col) => col.id === 'ProductGroupID' || col.id === 'ProductGroupRTCID'
      );
      const productCodeRTCIndex = columns.findIndex(
        (col) => col.id === 'ProductNewCode' || col.id === 'ProductCodeRTC'
      );

      if (
        unitNameIndex !== -1 &&
        productGroupIndex !== -1 &&
        productCodeRTCIndex !== -1
      ) {
        // Lấy 2 cột cần di chuyển
        const productGroupColumn = columns[productGroupIndex];
        const productCodeRTCColumn = columns[productCodeRTCIndex];

        // Xóa 2 cột khỏi vị trí cũ (xóa từ vị trí lớn hơn trước)
        if (productGroupIndex > productCodeRTCIndex) {
          columns.splice(productGroupIndex, 1);
          columns.splice(productCodeRTCIndex, 1);
        } else {
          columns.splice(productCodeRTCIndex, 1);
          columns.splice(productGroupIndex, 1);
        }

        // Tìm lại index của UnitName sau khi xóa
        const newUnitNameIndex = columns.findIndex(
          (col) => col.id === 'UnitName'
        );

        // Chèn 2 cột vào sau UnitName
        columns.splice(newUnitNameIndex + 1, 0, productGroupColumn);
        columns.splice(newUnitNameIndex + 2, 0, productCodeRTCColumn);
      }
    }

    return columns;
  }

  // Initialize grid options for a specific tab
  private initGridOptions(typeId: number): GridOption {
    // Tab 1 (Mua dự án) sẽ readonly khi isSelectedPO = true
    // Grid sẽ readonly khi isFromMarketing = true hoặc isFromHr = true
    const isReadOnly = (this.isSelectedPO && typeId === 1) || this.isFromMarketing || this.isFromHr;

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

      // HEADER MENU - Disable dropdown menu
      enableHeaderMenu: false,

      // COLUMNS
      forceFitColumns: this.isApprovedBGD,
      autoFitColumnsOnFirstLoad: this.isApprovedBGD,
      enableAutoSizeColumns: false,
      // Freeze columns đến cột ĐVT (UnitName) - index được tính động dựa trên các cột có thể ẩn/hiện
      frozenColumn: this.getUnitNameColumnIndex(typeId) + 1,

      // PAGINATION
      enablePagination: false,

      // CONTEXT MENU
      contextMenu: {
        hideCloseButton: false,
        commandTitle: '',
        commandItems: this.buildContextMenuItems(typeId),
      },

      // Footer row configuration
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
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
          },
          {
            getter: 'POKHCode',
            formatter: (g: any) => {
              const pokhCode = g.value || '';
              return `Mã POKH: ${pokhCode} <span style="color:blue; margin-left:10px;">(${g.count} sản phẩm)</span>`;
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
          },
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
      }

      // Store original getItemMetadata from grouping
      const originalGetItemMetadata = (
        angularGrid.dataView as any
      ).getItemMetadata?.bind(angularGrid.dataView);

      // Override getItemMetadata to merge grouping metadata with row styling metadata
      (angularGrid.dataView as any).getItemMetadata = (row: number) => {
        const item = angularGrid.dataView.getItem(row);

        // Get group metadata first (if this row is a group or group totals)
        // This is important to preserve group row formatting
        if (originalGetItemMetadata) {
          const groupMetadata = originalGetItemMetadata(row);

          // If this is a group row or group totals row, return the group metadata as-is
          if (item && (item.__group || item.__groupTotals)) {
            return groupMetadata;
          }

          // For data rows, merge custom styling with any existing metadata
          if (item && !item.__group && !item.__groupTotals) {
            const customMetadata = this.getRowMetadata(item);

            if (groupMetadata) {
              // Merge cssClasses
              return {
                ...groupMetadata,
                cssClasses: (
                  (groupMetadata.cssClasses || '') +
                  ' ' +
                  (customMetadata.cssClasses || '')
                ).trim(),
              };
            } else if (customMetadata.cssClasses) {
              return customMetadata;
            }
          }

          return groupMetadata;
        }

        // No original metadata, just return custom metadata for data rows
        if (item && !item.__group && !item.__groupTotals) {
          const customMetadata = this.getRowMetadata(item);
          if (customMetadata.cssClasses) {
            return customMetadata;
          }
        }

        return null;
      };

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
      // Apply distinct filters for this grid after it's ready
      this.applyDistinctFilters();
      // Update editor collections after grid is ready (để đảm bảo data đã load)
      this.updateEditorCollections();
      // Update footer row
      this.updateFooterRow(typeId);
    }, 100);

    // Subscribe to dataView.onRowCountChanged để update footer khi data thay đổi (bao gồm filter)
    if (angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        // Update footer trực tiếp không dùng setTimeout để tránh re-render gây mất focus
        this.updateFooterRow(typeId);
      });
    }
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

  // Get row metadata for styling based on row data
  private getRowMetadata(item: any): any {
    const metadata: any = { cssClasses: '' };

    // Rule: IsDeleted = true → row-deleted (màu đỏ)
    if (item.IsDeleted === true || item.IsDeleted === 1) {
      metadata.cssClasses += 'row-deleted ';
    }

    return metadata;
  }

  /**
   * Update footer row với count cho ProductName và sum cho Quantity, UnitPrice, TotalPrice
   * Sử dụng cách tiếp cận của payment-order: chỉ update textContent, không gọi setFooterRowVisibility
   * để tránh gây re-render grid và mất focus khỏi ô filter
   */
  updateFooterRow(typeId: number): void {
    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid || !angularGrid.slickGrid) return;

    // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
    const items =
      (angularGrid.dataView?.getFilteredItems?.() as any[]) ||
      this.datasetsMap.get(typeId) ||
      [];

    // Lọc bỏ các group row, chỉ lấy data rows
    const dataItems = (items || []).filter(
      (item: any) => !item.__group && !item.__groupTotals
    );

    // Đếm số lượng sản phẩm (ProductName)
    const productCount = dataItems.length;

    // Tính tổng cho các cột số
    const quantitySum = dataItems.reduce(
      (sum, item) => sum + (Number(item.Quantity) || 0),
      0
    );
    const unitPriceSum = dataItems.reduce(
      (sum, item) => sum + (Number(item.UnitPrice) || 0),
      0
    );
    const totalPriceSum = dataItems.reduce(
      (sum, item) => sum + (Number(item.TotalPrice) || 0),
      0
    );

    // Update footer values trực tiếp bằng textContent thay vì innerHTML để tránh re-render
    const productNameFooter = angularGrid.slickGrid.getFooterRowColumn('ProductName');
    if (productNameFooter) {
      productNameFooter.textContent = `${this.formatNumberEnUS(productCount, 0)}`;
    }

    const quantityFooter = angularGrid.slickGrid.getFooterRowColumn('Quantity');
    if (quantityFooter) {
      quantityFooter.textContent = `${this.formatNumberEnUS(quantitySum, 0)}`;
    }

    const unitPriceFooter = angularGrid.slickGrid.getFooterRowColumn('UnitPrice');
    if (unitPriceFooter) {
      unitPriceFooter.textContent = `${this.formatNumberEnUS(unitPriceSum, 2)}`;
    }

    const totalPriceFooter = angularGrid.slickGrid.getFooterRowColumn('TotalPrice');
    if (totalPriceFooter) {
      totalPriceFooter.textContent = `${this.formatNumberEnUS(totalPriceSum, 0)}`;
    }
  }

  // Update editor collections for all grids after master data is loaded
  private updateEditorCollections(): void {
    // Update columns for all tabs
    this.tabs.forEach((tab) => {
      const angularGrid = this.angularGrids.get(tab.id);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      // Update CurrencyID column editor collection
      const currencyColumn = columns.find(
        (col: any) => col.field === 'CurrencyID'
      );
      if (currencyColumn) {
        if (currencyColumn.editor) {
          currencyColumn.editor.collection = this.getCurrencyCollection();
        }
        if (currencyColumn.filter) {
          const currencyCollection = this.getCurrencyCollection();
          // Filter out empty entries but keep entries with valid value
          const filteredCollection = currencyCollection.filter(
            (x) => x.value > 0
          );
          currencyColumn.filter.collection = filteredCollection;
        }
      }

      // Update SupplierSaleID column editor collection
      const supplierColumn = columns.find(
        (col: any) => col.field === 'SupplierSaleID'
      );
      if (supplierColumn) {
        if (supplierColumn.filter) {
          const supplierCollection = this.getSupplierCollection();
          // Filter out empty entries but keep entries with valid value
          const filteredCollection = supplierCollection.filter(
            (x) => x.value > 0
          );
          supplierColumn.filter.collection = filteredCollection;
        }
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

      // Update WarehouseID column editor collection
      const warehouseColumn = columns.find(
        (col: any) => col.field === 'WarehouseID'
      );
      if (warehouseColumn && warehouseColumn.editor) {
        warehouseColumn.editor.collection = this.getWarehouseCollection();
      }

      // Update column definitions in the map to keep them in sync
      const columnDefs = this.columnDefinitionsMap.get(tab.id);
      if (columnDefs) {
        const currencyColDef = columnDefs.find(
          (col: any) => col.field === 'CurrencyID'
        );
        if (currencyColDef) {
          if (currencyColDef.editor) {
            currencyColDef.editor.collection = this.getCurrencyCollection();
          }
          if (currencyColDef.filter) {
            const currencyCollection = this.getCurrencyCollection();
            // Filter out empty entries but keep entries with valid value
            const filteredCollection = currencyCollection.filter(
              (x) => x.value > 0
            );
            currencyColDef.filter.collection = filteredCollection;
          }
        }

        const supplierColDef = columnDefs.find(
          (col: any) => col.field === 'SupplierSaleID'
        );
        if (supplierColDef) {
          if (supplierColDef.filter) {
            const supplierCollection = this.getSupplierCollection();
            // Filter out empty entries but keep entries with valid value
            const filteredCollection = supplierCollection.filter(
              (x) => x.value > 0
            );
            supplierColDef.filter.collection = filteredCollection;
          }
        }

        const productGroupColDef = columnDefs.find(
          (col: any) => col.field === productGroupField
        );
        if (productGroupColDef && productGroupColDef.editor) {
          productGroupColDef.editor.collection =
            this.getProductGroupCollection(isRTCTab);
        }

        const warehouseColDef = columnDefs.find(
          (col: any) => col.field === 'WarehouseID'
        );
        if (warehouseColDef && warehouseColDef.editor) {
          warehouseColDef.editor.collection = this.getWarehouseCollection();
        }
      }

      // Refresh grid to apply changes
      const updatedColumns = angularGrid.slickGrid.getColumns();
      angularGrid.slickGrid.setColumns(updatedColumns);
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
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.duplicateRow(tabIndex);
          }
        },
      });
    }

    // Lịch sử hỏi giá - luôn hiển thị
    menuItems.push({
      command: 'history-price',
      title: 'Lịch sử hỏi giá',
      iconCssClass: 'mdi mdi-history',
      positionOrder: positionOrder++,
      action: (e: any, args: any) => {
        const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
        if (tabIndex >= 0) {
          this.onHistoryPrice(tabIndex);
        }
      },
    });

    // Hàng nhập khẩu - yêu cầu quyền N35 hoặc N1
    if (hasN35OrN1) {
      menuItems.push({
        command: 'set-import',
        title: 'Hàng nhập khẩu',
        iconCssClass: 'mdi mdi-check',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.updateProductImport(tabIndex, true);
          }
        },
      });

      menuItems.push({
        command: 'unset-import',
        title: 'Hủy hàng nhập khẩu',
        iconCssClass: 'mdi mdi-close',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.updateProductImport(tabIndex, false);
          }
        },
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
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.onRequestApproved(tabIndex, true);
          }
        },
      });

      menuItems.push({
        command: 'cancel-request-approved',
        title: 'Hủy yêu cầu duyệt mua',
        iconCssClass: 'mdi mdi-close',
        positionOrder: positionOrder++,
        action: (e: any, args: any) => {
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.onRequestApproved(tabIndex, false);
          }
        },
      });
    }

    // Separator
    if (menuItems.length > 0) {
      menuItems.push({
        divider: true,
        command: '',
        positionOrder: positionOrder++,
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
          const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
          if (tabIndex >= 0) {
            this.onKeepProduct(tabIndex);
          }
        },
      });
    }

    // Cập nhật mã nội bộ - yêu cầu quyền N35 hoặc N1 và chỉ cho tab index 3
    const tabIndex = this.tabs.findIndex((t) => t.id === typeId);
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
        },
      });
    }

    return menuItems;
  }

  // Collection helper methods
  private getProductGroupCollection(
    isRTC: boolean
  ): Array<{ value: number; label: string }> {
    const groups = isRTC ? this.dtproductGroupsRTC : this.dtproductGroups;
    const collection = (groups || []).map((g: any) => ({
      value: g.ID,
      label: g.ProductGroupName || '',
    }));
    return [{ value: 0, label: '' }, ...collection];
  }

  private getWarehouseCollection(): Array<{ value: number; label: string }> {
    const warehouses = (this.dtwarehouses || []).map((w: any) => ({
      value: w.ID,
      label: w.WarehouseCode + ' - ' + w.WarehouseName || '',
    }));
    return [{ value: 0, label: '' }, ...warehouses];
  }

  private getCurrencyCollection(): Array<{
    value: number;
    label: string;
    currencyRate: number;
  }> {
    const currencies = (this.dtcurrency || []).map((c: any) => ({
      value: c.ID,
      label: c.Code || '',
      currencyRate: c.CurrencyRate || 0,
    }));
    return [...currencies];
  }

  private getSupplierCollection(): Array<{ value: number; label: string }> {
    const suppliers = (this.dtSupplierSale || []).map((s: any) => ({
      value: s.ID,
      label:
        `${s.CodeNCC || ''} - ${s.NameNCC || ''}`
          .replace(/^ - |^ -$| - $/g, '')
          .trim() ||
        s.NameNCC ||
        '',
    }));
    return [{ value: 0, label: '' }, ...suppliers];
  }

  // Format number with en-US locale
  formatNumberEnUS(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
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
    return selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);
  }

  // Event handlers
  onCellClicked(typeId: number, e: Event, args: OnClickEventArgs): void {
    // Xử lý click vào cột ProductCode để mở lịch sử hỏi giá (chế độ BGĐ duyệt)
    if (this.isApprovedBGD) {
      const angularGrid = this.angularGrids.get(typeId);
      if (!angularGrid) return;

      const column = angularGrid.slickGrid.getColumns()[args.cell];
      if (column?.field === 'ProductCode') {
        const item = angularGrid.dataView.getItem(args.row);
        if (item?.ProductCode) {
          this.openHistoryPriceByProductCode(item.ProductCode);
        }
      }
    }
  }
  OnSupplierSaleChangedSlickGrid(item: any): void {
    const supplierId = Number(item.SupplierSaleID);
    const supplier = this.dtSupplierSale.find(
      (p: { ID: number }) => p.ID === supplierId
    );

    if (supplier) {
      item.CodeNCC = supplier.CodeNCC || '';

      // Update in grid
      const angularGrid = this.angularGrids.get(this.activeTabIndex);
      if (angularGrid && item.id) {
        angularGrid.dataView.updateItem(item.id, item);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
        // Đảm bảo checkbox selector vẫn được enable sau khi render
        this.ensureCheckboxSelector(angularGrid);
      }

      // Track edited row
      const rowId = Number(item['ID']);
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
    }
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

    if (field && newValue !== undefined) {
      // Xử lý đặc biệt cho SupplierSaleID: autocompleter trả về object hoặc array
      if (field === 'SupplierSaleID') {
        if (Array.isArray(newValue)) {
          // Từ multiselect - lấy giá trị đầu tiên
          item[field] = newValue.length > 0 ? newValue[0] : null;
        } else if (typeof newValue === 'object' && newValue !== null) {
          // Từ autocompleter - lấy ID từ object
          item[field] = newValue.ID || null;
        } else {
          item[field] = newValue;
        }
      } else {
        item[field] = newValue;
      }
    }

    // Lấy tất cả các dòng đã chọn
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const currentEmployeeID = this.appUserService.employeeID;
    const isAdmin = this.appUserService.isAdmin || false;

    // Kiểm tra xem cell được edit có nằm trong các dòng đã chọn không
    const isEditedRowSelected =
      selectedRowIndexes && selectedRowIndexes.includes(rowIndex);

    // Nếu có nhiều dòng được chọn VÀ dòng đang edit nằm trong selection
    // thì fill giá trị cho các dòng đã chọn khác
    // với điều kiện QuoteEmployeeID = người đăng nhập hiện tại hoặc là Admin
    if (
      isEditedRowSelected &&
      selectedRowIndexes &&
      selectedRowIndexes.length > 1 &&
      field
    ) {
      let hasUpdatedRows = false;

      for (const selectedRowIndex of selectedRowIndexes) {
        // Bỏ qua dòng đang được edit
        if (selectedRowIndex === rowIndex) continue;

        const selectedItem = angularGrid.dataView.getItem(selectedRowIndex);
        if (!selectedItem) continue;

        // Fill giá trị vào dòng này (bỏ qua kiểm tra QuoteEmployeeID)

        // Fill giá trị vào dòng này
        // Xử lý đặc biệt cho SupplierSaleID (autocompleter hoặc multiselect)
        if (field === 'SupplierSaleID') {
          if (Array.isArray(newValue)) {
            selectedItem[field] = newValue.length > 0 ? newValue[0] : null;
          } else if (typeof newValue === 'object' && newValue !== null) {
            selectedItem[field] = newValue.ID || null;
          } else {
            selectedItem[field] = newValue;
          }
        } else {
          selectedItem[field] = newValue;
        }

        // Xử lý đặc biệt cho CurrencyID - cập nhật CurrencyRate
        if (field === 'CurrencyID') {
          const currencyId = Number(newValue) || 0;
          let newCurrencyRate = 0;
          if (currencyId > 0) {
            const currency = this.dtcurrency.find(
              (c: any) => c.ID === currencyId
            );
            if (currency) {
              newCurrencyRate = currency.CurrencyRate || 0;
            }
          }
          selectedItem.CurrencyRate = newCurrencyRate;
        } else if (field === 'SupplierSaleID') {
          this.OnSupplierSaleChangedSlickGrid(selectedItem);

          // Recalculate totals nếu cần
          if (
            [
              'UnitPrice',
              'Quantity',
              'CurrencyRate',
              'VAT',
              'CurrencyID',
            ].includes(field)
          ) {
            this.recalculateTotals(selectedItem);
          }

          // Track changes cho dòng này
          const selectedRowId = Number(selectedItem.ID || 0);
          if (selectedRowId > 0) {
            const existingIndex = this.changedRows.findIndex(
              (r: any) => Number(r.ID) === selectedRowId
            );
            if (existingIndex >= 0) {
              this.changedRows[existingIndex] = { ...selectedItem };
            } else {
              this.changedRows.push({ ...selectedItem });
            }
          }

          // Update item in dataView
          if (selectedItem.id) {
            angularGrid.dataView.updateItem(selectedItem.id, selectedItem);
          }
          hasUpdatedRows = true;
        }

        // Refresh grid nếu có dòng được update
        if (hasUpdatedRows) {
          angularGrid.slickGrid.invalidate();
          angularGrid.slickGrid.render();
          this.ensureCheckboxSelector(angularGrid);
        }
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
        const currencyRateColumn = columns.find(
          (col: any) => col.field === 'CurrencyRate'
        );
        if (currencyRateColumn) {
          const currencyRateColIndex = columns.indexOf(currencyRateColumn);
          // Update item in dataView first
          angularGrid.dataView.updateItem(item.id, item);
          // Invalidate and update the specific cell
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

      // Track changes: Add to changedRows array if not already exists
      const rowId = Number(item.ID || 0);
      if (rowId > 0) {
        // Check if row already exists in changedRows
        const existingIndex = this.changedRows.findIndex(
          (r: any) => Number(r.ID) === rowId
        );

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
  }
  handleRowSelection(
    typeId: number,
    e: Event,
    args: OnSelectedRowsChangedEventArgs
  ): void {
    // Clear previous selections
    this.selectedRowIds = [];

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid || !angularGrid.slickGrid) return;

    const rows = args.rows || [];

    // Initialize Set for this typeId if not exists
    if (!this.selectedRowIdsSetMap.has(typeId)) {
      this.selectedRowIdsSetMap.set(typeId, new Set<number>());
    }

    const selectedRowIdsSet = this.selectedRowIdsSetMap.get(typeId)!;
    selectedRowIdsSet.clear();

    rows.forEach((rowIndex: number) => {
      const item: any = angularGrid.dataView.getItem(rowIndex);
      if (item?.ID !== undefined && item?.ID !== null) {
        this.selectedRowIds.push(Number(item.ID));
        selectedRowIdsSet.add(Number(item.ID));
      }
    });
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
          // Cập nhật lại header filter cho tab vừa active
          this.applyDistinctFilters();
        }, 100);
      }
    }
  }

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

  // Handle date input change
  onDateChange(field: 'dateStart' | 'dateEnd', value: string): void {
    if (value) {
      (this as any)[field] = new Date(value);
    }
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
      IsRequestApproved: this.isApprovedBGD ? 1 : -1,
      EmployeeID: this.isFromHr ? (this.appUserService.employeeID || 0) : 0,
      Page: 1,
      Size: 100000,
    };

    const sub = this.srv.getAll(filter).subscribe({
      next: (response) => {
        const data = Array.isArray(response?.data)
          ? response.data
          : response?.data || response || [];
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
        this.tabs.forEach((tab) => {
          let filteredData: any[] = [];
          const typeId = Number(tab.id);

          // Lọc theo từng loại tab (tương ứng với logic WinForm)
          switch (typeId) {
            case 1:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 1
              );
              break;

            case 2:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 2
              );
              break;

            case 3:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 3
              );
              break;

            case 4:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 4
              );
              break;

            case 5:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 5
              );
              break;

            case 6:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 6
              );
              break;

            case 7:
              filteredData = allData.filter(
                (x: any) => Number(x.ProjectPartlistPurchaseRequestTypeID) == 7
              );
              break;

            default:
              break;
          }

          // Add id property for grid
          const dataWithId = filteredData.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
          }));

          // Lưu dataset hiển thị cho tab
          this.datasetsMap.set(tab.id, dataWithId);
          // Store original data (before filters)
          this.datasetsAllMap.set(tab.id, dataWithId);

          // Cập nhật title tab với số lượng (giống file gốc)
          const filteredDataForTitle =
            this.datasetsMap.get(tab.id) || dataWithId;
          const countText = (
            filteredDataForTitle?.length ||
            dataWithId.length ||
            0
          ).toLocaleString('vi-VN');
          tab.title = `${tab.title.split('(')[0].trim()} (${countText})`;

          // Refresh grid if it exists
          const angularGrid = this.angularGrids.get(tab.id);
          if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.setItems(dataWithId);
            angularGrid.dataView.refresh();
          }
        });

        // Apply distinct filters after data is loaded
        this.applyDistinctFilters();

        this.isLoading = false;
      },
      error: (err) => {
        this.notify.error('Lỗi', err.error.message || err?.message);
        this.isLoading = false;
      },
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    const isCheckOrderText = status ? 'check' : 'hủy check';
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn ${isCheckOrderText}!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${isCheckOrderText} danh sách đang chọn không?\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        // Lưu lại các ID đã chọn và tab index trước khi gọi API
        this.selectedRowIds = selected.map((r) => r.ID);
        this.selectedTabIndex = tabIndex;

        // API cần List<int> listIds - chỉ gửi mảng các ID (số nguyên)
        const listIds = selected
          .map((r) => Number(r.ID || 0))
          .filter((id) => id > 0);

        const sub = this.srv.checkOrder(listIds, status).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `${isCheckOrderText} thành công`
            );
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            // Xóa selectedRowIds nếu có lỗi
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  onSaveData(tabIndex: number): void {
    if (this.changedRows.length <= 0 || this.changedRows == null) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thay đổi!'
      );
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
      this.changedRows = this.changedRows
        .map((changedRow) => {
          const rowId = Number(changedRow.ID || 0);
          if (rowId > 0) {
            const latestRowData = allGridData.find(
              (row: any) => Number(row.ID) === rowId
            );
            if (latestRowData) {
              return latestRowData;
            }
          }
          return changedRow;
        })
        .filter((row: any) => row && row.ID);
    }

    if (this.changedRows.length <= 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thay đổi!'
      );
      return;
    }

    this.selectedRowIds = this.changedRows.map((r) => r.ID);
    this.selectedTabIndex = tabIndex;

    // Lấy danh sách các dòng cần lưu (bao gồm cả các dòng duplicate liên quan)
    const dataToSave = this.getDataToSave();

    this.modal.confirm({
      nzTitle: `Bạn có muốn lưu lại thay đổi không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua`,
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
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || 'Lưu dữ liệu thành công'
            );
            this.changedRows = [];
            this.isLoading = false;
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            this.isLoading = false;
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  // Hàm lấy dữ liệu cần lưu (bao gồm các dòng duplicate liên quan)
  private getDataToSave(): any[] {
    const result: any[] = [];
    const addedIds = new Set<number>();

    // Duyệt qua từng dòng đã thay đổi
    this.changedRows.forEach((changedRow) => {
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
              IsMarketing:
                Boolean(
                  this.activeTabIndex === 7 || this.activeTabIndex === 1
                ) || false,
            };
            result.push(this.normalizeRowData(relatedItem));
            addedIds.add(itemId);
          }
        });
      }
    });

    return result;
  }
  private normalizeRowData(row: any): any {
    const { id, TT, ...rowData } = row;
    const normalized: any = { ...rowData };

    const integerFields = [
      'ID',
      'SupplierSaleID',
      'CurrencyID',
      'ProductGroupID',
      'ProductGroupRTCID',
      'WarehouseID',
      'ProjectID',
      'ProductRTCID',
      'ProductSaleID',
      'DuplicateID',
      'PONCCID',
      'POKHID',
      'JobRequirementID',
      'CustomerID',
      'TotalDayLeadTime',
      'StatusRequest',
      'ProjectPartlistPurchaseRequestTypeID',
      'TicketType',
      'UnitCountID',
      'ApprovedTBP',
      'ApprovedBGD',
      'EmployeeID',
      'EmployeeIDRequestApproved',
      'EmployeeApproveID',
      'InventoryProjectID',
      'ProjectPartListID',
      'POKHDetailID',
    ];
    const decimalFields = [
      'Quantity',
      'UnitPrice',
      'UnitImportPrice',
      'VAT',
      'TargetPrice',
      'CurrencyRate',
      'HistoryPrice',
      'TotalPrice',
      'TotalPriceExchange',
      'TotaMoneyVAT',
      'UnitFactoryExportPrice',
      'TotalImportPrice',
      'TotalPriceHistory',
      'OriginQuantity',
    ];

    // Xử lý integer fields
    integerFields.forEach((field) => {
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
    decimalFields.forEach((field) => {
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
      'IsApprovedTBP',
      'IsApprovedBGD',
      'IsImport',
      'IsRequestApproved',
      'IsCommercialProduct',
      'IsDeleted',
      'IsTechBought',
      'IsPurchase',
      'IsPaidLater',
      'IsMarketing',
    ];

    booleanFields.forEach((field) => {
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
      'DateRequest',
      'DateReturnExpected',
      'DateOrder',
      'DateEstimate',
      'DateReturnActual',
      'DateReceive',
      'DateApprovedTBP',
      'DateApprovedBGD',
      'DateReturnEstimated',
      'CreatedDate',
      'UpdatedDate',
    ];

    dateFields.forEach((field) => {
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn yêu cầu muốn sửa!`
      );
      return;
    }

    if (selected.length !== 1) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn 1 yêu cầu muốn sửa!`
      );
      return;
    }

    const row = selected[0];
    const isCommercialProduct = row.IsCommercialProduct;
    const poNCC = row.PONCCID;

    // Cho phép sửa với tab HR (6), Marketing (7), Thương mại (5)
    const allowEditTabs = [5, 6, 7];
    const isAllowedTab = allowEditTabs.includes(typeId);

    if (!isAllowedTab && !isCommercialProduct) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Sửa Y/C chỉ áp dụng với [Hàng thương mại] và yêu cầu [Chưa có PO]!`
      );
      return;
    }
    if (poNCC > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Sửa Y/C chỉ áp dụng với [Hàng thương mại] và yêu cầu [Chưa có PO]!`
      );
      return;
    }

    this.selectedRowIds = [row.ID];
    this.selectedTabIndex = tabIndex;

    const sub = this.srv.getDetailByID(row.ID).subscribe({
      next: (rs) => {
        const modalRef = this.modalService.open(
          ProjectPartlistPurchaseRequestDetailComponent,
          {
            centered: false,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
          }
        );
        // Xác định chế độ edit: HR (6) hoặc Marketing (7) chỉ cho sửa số lượng và deadline
        const isLimitedEditMode = [6, 7].includes(typeId);
        let data = {
          ...rs.data,
          Unit: row.UnitName || '',
          CustomerID: row.CustomerID || 0,
          Maker: row.Manufacturer || '',
          isLimitedEditMode: isLimitedEditMode, // true nếu là tab HR hoặc Marketing
        };
        modalRef.componentInstance.projectPartlistDetail = data;
        modalRef.result.catch((reason) => {
          this.onSearch();
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
          nzStyle: { whiteSpace: 'pre-line' }
        });
        this.selectedRowIds = [];
        this.selectedTabIndex = -1;
      },
    });
    this.subscriptions.push(sub);
  }

  onAddNewHr(): void {
    const modalRef = this.modalService.open(
      ProjectPartlistPurchaseRequestDetailComponent,
      {
        centered: false,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'full-screen-modal',
      }
    );
    modalRef.componentInstance.projectPartlistDetail = {
      ProjectPartlistPurchaseRequestTypeID: 6,
      EmployeeID: this.appUserService.employeeID || 0,
    };
    modalRef.result.catch(() => {
      this.onSearch();
    });
  }

  onDeleteRequest(tabIndex: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn xoá!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xoá danh sách đã chọn không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const isPurchaseRequestDemo = typeId === 2 || typeId === 3; // RTC tabs
        const sub = this.srv
          .deletedRequest(selected, isPurchaseRequestDemo)
          .subscribe({
            next: (rs) => {
              this.notify.success(
                NOTIFICATION_TITLE.success,
                rs.message || 'Xoá thành công'
              );
              this.onSearch();
            },
            error: (error) =>
              this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
                nzStyle: { whiteSpace: 'pre-line' }
              }),
          });
        this.subscriptions.push(sub);
      },
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    const isRequestApprovedText = status ? 'yêu cầu duyệt' : 'hủy yêu cầu duyệt';
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn ${isRequestApprovedText}!`
      );
      return;
    }

    this.selectedRowIds = selected.map((r) => r.ID);
    this.selectedTabIndex = tabIndex;

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${isRequestApprovedText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.requestApproved(selected, status).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `${isRequestApprovedText} thành công`
            );
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  onCompleteRequest(tabIndex: number, statusValue: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    const statusText = statusValue == 7 ? 'hoàn thành' : 'hủy hoàn thành';
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn ${statusText} yêu cầu mua!`
      );
      return;
    }

    this.selectedRowIds = selected.map((r) => r.ID);
    this.selectedTabIndex = tabIndex;

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.completeRequest(selected, statusValue).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `${statusText} thành công`
            );
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  onApproved(tabIndex: number, status: boolean, type: boolean): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    const isApprovedText = status ? 'duyệt' : 'hủy duyệt';
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn ${isApprovedText}!`
      );
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

    this.selectedRowIds = selected.map((r) => r.ID);
    this.selectedTabIndex = tabIndex;

    const typeText = type ? 'TBP' : 'BGD';
    let message = '';
    // if (type && !status) message = `Những sản phẩm đã được BGĐ duyệt sẽ không thể ${isApprovedText}!`;
    // if (!type && status) message = `Những sản phẩm chưa được TBP duyệt sẽ không thể ${isApprovedText}!`;

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${isApprovedText} danh sách sản phẩm đã chọn không?${message ? '\n' + message : ''
        }`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.approved(selected, status, type).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `${isApprovedText} thành công`
            );
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            this.selectedRowIds = [];
            this.selectedTabIndex = -1;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  onAddPoncc(): void {
    const tabIndex = this.activeTabIndex;
    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    if (!selectedRowIndexes || selectedRowIndexes.length <= 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn sản phẩm muốn Tạo PO NCC!'
      );
      return;
    }

    const selectedData = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    // Validate đầu tiên theo logic từ file gốc
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
            `Sản phẩm chưa được TBP duyệt!`
          );
          return;
        }
      }

      // Hàng mua phải có đơn giá
      if (ticketType === 0 && unitPrice <= 0) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Đơn giá cho sản phẩm [${productCode}]!`
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chỉ chọn sản phẩm từ 1 Nhà cung cấp!'
      );
      return;
    }

    // Kiểm tra nếu không có nhà cung cấp nào
    if (listSupplierSale.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập Nhà cung cấp cho sản phẩm!\nChọn Nhà cung cấp sau đó chọn Lưu thay đổi!'
      );
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không có sản phẩm hợp lệ để tạo PO!'
      );
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
            this.notify.warning(
              NOTIFICATION_TITLE.warning,
              'Sản phẩm chưa được BGĐ duyệt!'
            );
            return;
          }

          // Kiểm tra mã nội bộ
          if (!code) {
            this.notify.warning(
              NOTIFICATION_TITLE.warning,
              'Sản phẩm chưa có mã nội bộ!'
            );
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
            nzTitle: `Bạn có chắc muốn tạo PO NCC danh sách sản phẩm đã chọn không?\nNhững sản phẩm chưa được BGĐ duyệt sẽ tự động được bỏ qua!`,
            nzOkText: 'Ok',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOkDanger: false,
            nzClosable: false,
            nzOnOk: () => {
              const { listRequest, currencys } = this.preparePonccData(
                validData,
                tabIndex
              );

              const uniqueCurrencies = [...new Set(currencys)]; // Lọc distinct
              const currencyID =
                uniqueCurrencies.length > 1 ? 0 : uniqueCurrencies[0] || 0;

              const supplierSub = this.supplierSaleService
                .getSupplierSaleByID(listSupplierSale[0])
                .subscribe({
                  next: (rs) => {
                    this.isLoading = false;
                    let data = rs.data;

                    // Kiểm tra xem có phải tab Mượn demo (index 3) hoặc có sản phẩm mượn không
                    const isMuonDemoTab = tabIndex === 3;
                    const hasMuonProduct = validData.some(
                      (row: any) => Number(row.TicketType || 0) === 1
                    );
                    const poType = isMuonDemoTab || hasMuonProduct ? 1 : 0; // 0: PO Thương mại, 1: PO Mượn

                    // Lấy số đơn hàng (BillCode) theo POType
                    const billCodeSub = this.ponccService
                      .getBillCode(poType)
                      .subscribe({
                        next: (billCodeRes: any) => {
                          // Thu thập tất cả các Model từ các dòng đã chọn
                          const models = validData
                            .map((row: any) => String(row.Model || '').trim())
                            .filter((model: string) => model !== '')
                            .filter(
                              (value: string, index: number, self: string[]) =>
                                self.indexOf(value) === index
                            ); // Lọc unique

                          const note =
                            models.length > 0 ? models.join('; ') : '';

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

                          const modalRef = this.modalService.open(
                            PonccDetailComponent,
                            {
                              backdrop: 'static',
                              keyboard: false,
                              centered: true,
                              windowClass: 'full-screen-modal',
                            }
                          );

                          // Pass data to modal component
                          modalRef.componentInstance.poncc = poncc;
                          modalRef.componentInstance.ponccDetail =
                            listRequest || [];
                          modalRef.componentInstance.isAddPoYCMH = true;
                          // Báo cho PonccDetailComponent biết BillCode đã được gen từ YCMH, không cần gen lại
                          modalRef.componentInstance.skipBillCodeGeneration =
                            true;

                          // Reload table after modal closes
                          modalRef.result.finally(() => {
                            this.onSearch();
                          });
                        },
                        error: (error) => {
                          this.isLoading = false;
                          this.notify.error(
                            NOTIFICATION_TITLE.error,
                            error.error?.message || error?.message
                          );
                        },
                      });
                    this.subscriptions.push(billCodeSub);
                  },
                  error: (error) => {
                    this.isLoading = false;
                    this.notify.error(
                      NOTIFICATION_TITLE.error,
                      error.error?.message || error?.message
                    );
                  },
                });
              this.subscriptions.push(supplierSub);
            },
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.notify.error(
            NOTIFICATION_TITLE.error,
            error.error?.message || error?.message
          );
        },
      });
      this.subscriptions.push(sub);
    }
  }

  private preparePonccData(
    selectedData: any[],
    tabIndex: number
  ): { listRequest: any[]; currencys: number[] } {
    const listRequest: any[] = [];
    const currencys: number[] = [];
    let stt = 0;
    selectedData.forEach((row: any) => {
      const id = Number(row.ID || 0);
      if (id <= 0) return;
      stt++;
      // Lấy các giá trị từ row
      const requestTypeID = Number(
        row.ProjectPartlistPurchaseRequestTypeID || 0
      );
      const isApprovedBGD = Boolean(row.IsApprovedBGD);
      const isCommercialProduct = Boolean(row.IsCommercialProduct);
      const isTechBought = Boolean(row.IsTechBought);
      const isTBPAprroved = Boolean(row.IsApprovedTBP);
      const isBorrowProduct = Number(row.TicketType || 0); // 0: mua, 1: mượn
      const productRtcId = Number(row.ProductRTCID || 0);
      const jobRequirementID = Number(row.JobRequirementID || 0);

      const IsIgnoreBGD =
        this.requestTypes.find((x: any) => x.ID === requestTypeID)
          ?.IsIgnoreBGD || false;

      // Validation logic theo WinForm
      if (jobRequirementID <= 0) {
        if (isBorrowProduct === 0) {
          // Mua
          if (
            !isApprovedBGD &&
            !isCommercialProduct &&
            !isTechBought &&
            productRtcId <= 0 &&
            !IsIgnoreBGD
          ) {
            return; // Skip row này
          }
        } else {
          // Mượn
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
      const deadline = row.DateReturnExpected
        ? new Date(row.DateReturnExpected)
        : null;
      const productCode = String(row.ProductCode || '');
      const vat = Number(row.VAT || 0);
      const totaMoneyVAT = Number(row.TotaMoneyVAT || 0);
      const ticketType = Number(row.TicketType || 0);
      const dateReturnEstimated = row.DateReturnEstimated
        ? new Date(row.DateReturnEstimated)
        : null;

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
      const productGroupData = isRTCTab
        ? this.dtproductGroupsRTC
        : this.dtproductGroups;
      const productGroup = productGroupData.find(
        (x: any) => x.ID === ProductGroupID
      );
      const ProductGroupName = productGroup?.ProductGroupName || '';

      // Tạo request object
      const request = {
        ...row,
        STT: stt,
        ID: 0,
        ProductCodeOfSupplier: String(row.ProductName + '-' + row.ProductCode || ''),
        ProductGroupName: ProductGroupName,
        PriceHistory: Number(row.HistoryPrice || 0),
        VATMoney: totaMoneyVAT,
        VAT: vat,
        ThanhTien: Number(row.TotalPrice || 0),
        QtyRequest: Number(row.Quantity || 0),
        IsBill: totaMoneyVAT > 0 ? true : false,
        IsPurchase: false,
        ProjectPartlistPurchaseRequestID: id,
        PONCCDetailRequestBuyID: id.toString()
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

    this.selectedRowIds = selected.map((r) => r.ID);
    this.selectedTabIndex = tabIndex;

    this.isLoading = true;
    const sub = this.srv.downloadFiles(selected).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DownloadFiles.zip';
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
              const errorMessage =
                errorObj.message || errorObj.Message || 'Lỗi khi tải file!';
              this.notify.error(NOTIFICATION_TITLE.error, errorMessage);
            } catch (e) {
              this.notify.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải file!');
            }
          });
        } else {
          this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
            nzStyle: { whiteSpace: 'pre-line' }
          });
        }
        console.error('Download error:', error);
        this.isLoading = false;
      },
    });
    this.subscriptions.push(sub);
  }

  onHistoryPrice(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length !== 1) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn 1 sản phẩm cần xem lịch sử hỏi giá!`
      );
      return;
    }

    const productCode = selected[0].ProductCode;

    const modalRef = this.modalService.open(HistoryPriceComponent, {
      centered: false,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
    });
    modalRef.componentInstance.searchKeyword = productCode;
    modalRef.result.catch((reason) => { });
  }

  // Mở lịch sử hỏi giá trực tiếp từ ProductCode (dùng cho chế độ BGĐ duyệt)
  openHistoryPriceByProductCode(productCode: string): void {
    if (!productCode) return;

    const modalRef = this.modalService.open(HistoryPriceComponent, {
      centered: false,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
    });
    modalRef.componentInstance.searchKeyword = productCode;
    modalRef.result.catch((reason) => { });
  }

  duplicateRow(tabIndex: number): void {
    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length !== 1) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm cần sao chép!`
      );
      return;
    }

    const originalRow = selected[0];
    const originalId = Number(originalRow.ID || 0);
    const originalDuplicateId = Number(originalRow.DuplicateID || 0);
    const productCode = String(originalRow.ProductCode || '');

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn duplicate yêu cầu mua vật tư [${productCode}] không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;
        const sub = this.srv.duplicate(selected).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || 'Duplicate thành công'
            );

            // Reload data và sau đó tìm và select cả 2 dòng (gốc và mới)
            this.onSearch();
            // Đợi data load xong rồi tìm và select cả 2 dòng
            setTimeout(() => {
              this.selectAndEditDuplicateRows(
                tabIndex,
                originalId,
                originalDuplicateId
              );
            }, 500);

            this.isLoading = false;
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
            this.isLoading = false;
          },
        });
        this.subscriptions.push(sub);
      },
    });
  }

  // Method để tìm và select cả 2 dòng (gốc và mới) sau khi duplicate
  private selectAndEditDuplicateRows(
    tabIndex: number,
    originalId: number,
    originalDuplicateId: number
  ): void {
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
    const originalRow = allItems.find(
      (item: any) => Number(item.ID) === originalId
    );

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
        return (
          item.ProductCode === originalRow.ProductCode &&
          item.ProjectID === originalRow.ProjectID &&
          item.SupplierSaleID === originalRow.SupplierSaleID &&
          item.CurrencyID === originalRow.CurrencyID &&
          item.DateRequest === originalRow.DateRequest
        );
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
    const originalRowIndex = allItems.findIndex(
      (item: any) => Number(item.ID) === Number(originalRow.ID)
    );
    const newRowIndex = allItems.findIndex(
      (item: any) => Number(item.ID) === Number(newRow.ID)
    );

    if (originalRowIndex >= 0 && newRowIndex >= 0) {
      // Select cả 2 dòng
      angularGrid.slickGrid.setSelectedRows([originalRowIndex, newRowIndex]);

      // Refresh grid để đảm bảo selection được hiển thị
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đợi một chút để grid render xong
      setTimeout(() => {
        // Focus vào cột Quantity của dòng đầu tiên (dòng gốc)
        const quantityColumn = angularGrid.slickGrid
          .getColumns()
          .find((col: any) => col.field === 'Quantity');
        if (quantityColumn) {
          const quantityColIndex = angularGrid.slickGrid.getColumnIndex(
            quantityColumn.id
          );
          if (quantityColIndex >= 0) {
            // Scroll đến dòng đầu tiên được select
            angularGrid.slickGrid.scrollRowIntoView(originalRowIndex, false);

            // Focus vào cell Quantity của dòng gốc và bắt đầu edit
            angularGrid.slickGrid.setActiveCell(
              originalRowIndex,
              quantityColIndex
            );

            // Đợi một chút rồi mới edit để đảm bảo cell đã được focus
            setTimeout(() => {
              angularGrid.slickGrid.editActiveCell();
            }, 100);
          }
        }
      }, 100);
    } else if (originalRowIndex >= 0) {
      this.selectRowAndFocusQuantity(angularGrid, originalRow);
    }
  }

  // Helper method để select một dòng và focus vào cột Quantity
  private selectRowAndFocusQuantity(
    angularGrid: AngularGridInstance,
    row: any
  ): void {
    const allItems: any[] = [];
    for (let i = 0; i < angularGrid.dataView.getLength(); i++) {
      const item = angularGrid.dataView.getItem(i);
      if (item) {
        allItems.push(item);
      }
    }

    const rowIndex = allItems.findIndex(
      (item: any) => Number(item.ID) === Number(row.ID)
    );
    if (rowIndex >= 0) {
      angularGrid.slickGrid.setSelectedRows([rowIndex]);

      // Refresh grid để đảm bảo selection được hiển thị
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();

      // Đợi một chút để grid render xong
      setTimeout(() => {
        const quantityColumn = angularGrid.slickGrid
          .getColumns()
          .find((col: any) => col.field === 'Quantity');
        if (quantityColumn) {
          const quantityColIndex = angularGrid.slickGrid.getColumnIndex(
            quantityColumn.id
          );
          if (quantityColIndex >= 0) {
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

  onKeepProduct(tabIndex: number, isKeep: boolean = true): void {
    const isKeepText = isKeep ? 'giữ hàng' : 'hủy giữ hàng';

    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn ${isKeepText}!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn ${isKeepText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.keepProduct(selected).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `${isKeepText} thành công`
            );
            this.onSearch();
          },
          error: (error) =>
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            }),
        });
        this.subscriptions.push(sub);
      },
    });
  }

  updateProductImport(tabIndex: number, isImport: boolean): void {
    const isImportText = isImport ? 'hàng nhập khẩu' : 'hàng nội địa';

    if (this.changedRows.length > 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn sản phẩm muốn chuyển thành ${isImportText}!`
      );
      return;
    }

    const rowsToUpdate = selected.filter(
      (row: any) => row.IsImport !== isImport
    );

    rowsToUpdate.forEach((row: any) => {
      row.IsImport = isImport;
    });

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn chuyển sản phẩm đã chọn thành ${isImportText} không?`,
      nzOkText: 'Ok',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        const sub = this.srv.updateProductImport(rowsToUpdate).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs.message || `Chuyển thành ${isImportText} thành công`
            );
            this.onSearch();
          },
          error: (error) =>
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            }),
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    if (!selectedRowIndexes || selectedRowIndexes.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một dòng!'
      );
      return;
    }

    const selected = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    // Bước 1: Kiểm tra validation
    for (const data of selected) {
      const id = data['ID'] || 0;
      if (id <= 0) continue;

      const code = data['ProductNewCode'] || '';
      const isApprovedBGD = data['IsApprovedBGD'] || false;
      const isTechBought = data['IsTechBought'] || false;

      if (!isApprovedBGD && !isTechBought) {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          'Sản phẩm chưa được BGĐ duyệt!'
        );
        return;
      }

      if (!code || code.toString().trim() === '') {
        this.notify.warning(
          NOTIFICATION_TITLE.warning,
          'Sản phẩm chưa có mã nội bộ!'
        );
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dòng nào thỏa mãn điều kiện!'
      );
      return;
    }

    if (this.activeModal) {
      const strLstRequestBuyIDs = Array.isArray(lstYCMH)
        ? lstYCMH.join(';')
        : '';
      const strLstCodes = Array.isArray(lstYCMHCode)
        ? lstYCMHCode.join('; ')
        : '';

      this.isYCMH = false;
      this.supplierId = null;

      this.activeModal.close({
        strLstRequestBuyIDs: strLstRequestBuyIDs,
        strLstCodes: strLstCodes,
      });
    }
  }

  updateInternalCode(tabIndex: number): void {
    const typeId = this.getTypeIdFromTabIndex(tabIndex);
    if (!typeId) return;

    const selected = this.getSelectedGridData(typeId);
    if (selected.length === 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Vui lòng chọn dòng cần cập nhật!`
      );
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
    const hasOtherChanges = this.changedRows.some((changedRow) => {
      const rowId = changedRow.ID;
      const selectedRow = selected.find((r: any) => r.ID === rowId);
      if (!selectedRow) return false;

      // Lấy dữ liệu gốc
      const originalData = this.originalDataMap.get(rowId);
      if (!originalData) return false;

      // So sánh các field ngoài ProductGroupID và ProductGroupRTCID
      const fieldsToCheck = [
        'Quantity',
        'UnitPrice',
        'UnitImportPrice',
        'VAT',
        'TargetPrice',
        'CurrencyID',
        'SupplierSaleID',
        'WarehouseID',
        'Note',
        'CurrencyRate',
        'UnitMoney',
        'IsPaidLater',
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
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        `Dữ liệu đã thay đổi!\nVui lòng lưu lại dữ liệu hoặc load lại trước khi thao tác!`
      );
      return;
    }

    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn cập nhật trạng thái danh sách sản phẩm đã chọn không?`,
      nzOkText: 'Cập nhật',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzClosable: false,
      nzOnOk: () => {
        this.isLoading = true;

        // Lấy dữ liệu từ các dòng đã chọn, đảm bảo có ProductGroupRTCID
        const dataToUpdate = selected.map((row) => {
          const rowData = { ...row };
          // Đảm bảo có ProductGroupRTCID nếu là mượn demo
          const ticketType = Number(rowData['TicketType'] || 0);
          if (ticketType === 1) {
            // Mượn
            // Nếu chưa có ProductGroupRTCID, lấy từ ProductGroupID (nếu có)
            if (!rowData['ProductGroupRTCID'] && rowData['ProductGroupID']) {
              rowData['ProductGroupRTCID'] = rowData['ProductGroupID'];
            }
          }
          return rowData;
        });

        const sub = this.srv.createProductRTC(dataToUpdate).subscribe({
          next: (rs) => {
            this.notify.success(
              NOTIFICATION_TITLE.success,
              rs?.message || 'Cập nhật thành công'
            );
            this.isLoading = false;
            // Reload data sau khi update thành công
            this.onSearch();
          },
          error: (error) => {
            this.notify.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`, {
              nzStyle: { whiteSpace: 'pre-line' }
            });
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

  //#region Chức năng Export Excel
  async exportExcelSelectedRows() {
    const typeId = this.getActiveTabTypeId();
    if (!typeId) {
      this.notify.error(
        NOTIFICATION_TITLE.error,
        'Không xác định được tab hiện tại!'
      );
      return;
    }

    const selectedData = this.getSelectedGridData(typeId);
    if (!selectedData || selectedData.length <= 0) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn sản phẩm cần xuất excel!'
      );
      return;
    }

    const angularGrid = this.angularGrids.get(typeId);
    if (!angularGrid) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    const title = this.filteredTabs[this.activeTabIndex].title;
    const date = DateTime.fromJSDate(new Date()).toFormat('ddMMyy');
    const fileName = `YeuCauMua_${title}_${date}`;

    await this.exportExcelWithGroupAndFooter(
      angularGrid,
      selectedData,
      title,
      fileName,
      typeId
    );
  }

  async exportExcelAllTabs() {
    const workbook = new ExcelJS.Workbook();
    let hasData = false;

    for (const tab of this.filteredTabs) {
      const typeId = tab.id;
      const angularGrid = this.angularGrids.get(typeId);

      if (!angularGrid) continue;

      const dataset = this.datasetsMap.get(typeId) || [];
      if (dataset.length <= 0) continue;

      hasData = true;
      await this.addSheetToWorkbook(
        workbook,
        angularGrid,
        dataset,
        tab.title,
        typeId
      );
    }

    if (!hasData) {
      this.notify.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất excel!'
      );
      return;
    }

    const date = DateTime.fromJSDate(new Date()).toFormat('ddMMyy');
    const fileName = `YeuCauMua_TatCa_${date}`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  private async exportExcelWithGroupAndFooter(
    angularGrid: AngularGridInstance,
    data: any[],
    sheetName: string,
    fileName: string,
    typeId: number
  ) {
    const workbook = new ExcelJS.Workbook();
    await this.addSheetToWorkbook(
      workbook,
      angularGrid,
      data,
      sheetName,
      typeId
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  private async addSheetToWorkbook(
    workbook: ExcelJS.Workbook,
    angularGrid: AngularGridInstance,
    data: any[],
    sheetName: string,
    typeId: number
  ) {
    const worksheet = workbook.addWorksheet(sheetName);

    // Lấy danh sách cột hiển thị (bỏ cột checkbox)
    const allColumns = angularGrid.slickGrid.getColumns();
    let visibleColumns = allColumns.filter(
      (col: any) =>
        col.id !== '_checkbox_selector' && col.field !== '_checkbox_selector'
    );

    // Nếu là tab "Mua hàng dự án" (typeId = 1), loại bỏ các cột không cần thiết
    if (typeId === 1) {
      const excludeFields = [
        'IsRequestApproved',
        'IsApprovedBGD',
        'CustomerName',
      ];
      visibleColumns = visibleColumns.filter(
        (col: any) => !excludeFields.includes(col.field)
      );
    }

    const headers = visibleColumns.map((col: any) => col.name || col.field);

    // Thêm header row - màu xám nhạt
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FF000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Phát hiện các cột cần tính tổng từ groupTotalsFormatter
    const sumFields: string[] = [];
    const countFields: string[] = [];
    visibleColumns.forEach((col: any) => {
      // Nếu column có groupTotalsFormatter thì là cột cần tính tổng (sum)
      if (
        col.groupTotalsFormatter &&
        typeof col.groupTotalsFormatter === 'function'
      ) {
        sumFields.push(col.field);
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

      worksheet.mergeCells(
        `A${groupRowIndex}:${this.getColumnLetter(
          headers.length
        )}${groupRowIndex}`
      );

      groupRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
      groupRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      groupRow.alignment = { vertical: 'middle', horizontal: 'left' };
      groupRow.height = 22;

      // Khởi tạo biến tổng
      const totals: any = {};
      sumFields.forEach((field) => (totals[field] = 0));
      countFields.forEach((field) => (totals[field] = 0));

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
            const cur = this.dtcurrency.find((c) => c.ID === value);
            return cur?.Code || '';
          }
          if (field === 'ProductGroupID') {
            const isRTCTab =
              this.activeTabIndex === 2 || this.activeTabIndex === 3;
            const productGroupData = isRTCTab
              ? this.dtproductGroupsRTC
              : this.dtproductGroups;
            const g = productGroupData.find((x) => x.ID === value);
            return g?.ProductGroupName || '';
          }
          if (field === 'SupplierSaleID') {
            const s = this.dtSupplierSale.find((x) => x.ID === value);
            return s?.NameNCC || '';
          }
          if (field === 'WarehouseID') {
            const w = this.dtwarehouses.find((x) => x.ID === value);
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
        fgColor: { argb: 'FFFFD966' },
      };
      footerRow.alignment = { vertical: 'middle', horizontal: 'left' };
      footerRow.height = 22;

      footerRow.eachCell((cell, colNumber) => {
        const field = visibleColumns[colNumber - 1]?.field;

        if (sumFields.includes(field)) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }
      });
    });

    // Dòng tổng cuối cùng
    const grandTotals: any = {};
    sumFields.forEach((field) => (grandTotals[field] = 0));
    countFields.forEach((field) => (grandTotals[field] = 0));

    data.forEach((row: any) => {
      sumFields.forEach((field) => {
        const val = Number(row[field]) || 0;
        grandTotals[field] += val;
      });
      countFields.forEach((field) => {
        grandTotals[field] += 1;
      });
    });

    const grandTotalData = visibleColumns.map((col: any) => {
      const field = col.field;
      if (sumFields.includes(field) || countFields.includes(field)) {
        return grandTotals[field];
      }
      if (field === visibleColumns[0].field) {
        return 'Tổng cộng';
      }
      return '';
    });

    const grandRow = worksheet.addRow(grandTotalData);
    grandRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    grandRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    grandRow.alignment = { vertical: 'middle', horizontal: 'left' };
    grandRow.height = 25;

    grandRow.eachCell((cell, colNumber) => {
      const field = visibleColumns[colNumber - 1]?.field;
      if (sumFields.includes(field)) {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      }
    });

    // Auto width
    worksheet.columns.forEach((column: any, colIndex: number) => {
      const field = visibleColumns[colIndex]?.field;

      if (field === 'ProductCode') column.width = 15;
      else if (field === 'ProductName' || field === 'ProjectName')
        column.width = 35;
      else if (field === 'CustomerName' || field === 'NameNCC')
        column.width = 30;
      else if (field === 'SupplierSaleID') column.width = 40;
      else if (sumFields.includes(field)) column.width = 18;
      else if (field === 'Quantity') column.width = 12;
      else if (field?.includes('Date')) column.width = 15;
      else if (field?.includes('Status') || field?.includes('Text'))
        column.width = 20;
      else if (field === 'Note' || field === 'Model') column.width = 30;
      else column.width = 15;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  // Apply distinct filters for multiple columns after data is loaded
  private applyDistinctFilters(): void {
    // Helper function to get unique values for a field
    const getUniqueValues = (
      data: any[],
      field: string
    ): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      data.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    this.tabs.forEach((tab) => {
      const angularGrid = this.angularGrids.get(tab.id);
      if (!angularGrid || !angularGrid.slickGrid) return;

      const dataView = angularGrid.dataView;
      if (!dataView) return;

      // Lấy dữ liệu đã được filter từ view (không phải tất cả data gốc)
      const data: any[] = [];
      for (let i = 0; i < dataView.getLength(); i++) {
        const item = dataView.getItem(i);
        if (item) {
          data.push(item);
        }
      }
      if (!data || data.length === 0) return;

      const columns = angularGrid.slickGrid.getColumns();
      if (!columns) return;

      const isRTCTab = tab.id === 3 || tab.id === 4;

      // Update collections for each filterable column with multipleSelect
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;

          // Handle CurrencyID - use collection from editor
          if (field === 'CurrencyID') {
            const currencyCollection = this.getCurrencyCollection();
            const filteredCollection = currencyCollection.filter(
              (x) => x.value > 0
            );
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle SupplierSaleID - use collection from editor
          else if (field === 'SupplierSaleID') {
            const supplierCollection = this.getSupplierCollection();
            const filteredCollection = supplierCollection.filter(
              (x) => x.value > 0
            );
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle WarehouseID - use collection from editor
          else if (field === 'WarehouseID') {
            const warehouseCollection = this.getWarehouseCollection();
            const filteredCollection = warehouseCollection.filter(
              (x) => x.value > 0
            );
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle ProductGroupID/ProductGroupRTCID - use collection from editor
          else if (
            field === 'ProductGroupID' ||
            field === 'ProductGroupRTCID'
          ) {
            const productGroupCollection =
              this.getProductGroupCollection(isRTCTab);
            const filteredCollection = productGroupCollection.filter(
              (x) => x.value > 0
            );
            if (column.filter) {
              column.filter.collection = filteredCollection;
            }
          }
          // Handle text columns - get unique values from data
          else if (
            [
              'ProductCode',
              'ProjectCode',
              'ProductName',
              'Manufacturer',
              'StatusRequestText',
              'FullName',
              'UpdatedName',
              'ProductNewCode',
              'ProductCodeRTC',
            ].includes(field)
          ) {
            const collection = getUniqueValues(data, field);
            if (column.filter) {
              column.filter.collection = collection;
            }
          }
        }
      });

      // Update column definitions in the map
      const columnDefs = this.columnDefinitionsMap.get(tab.id);
      if (columnDefs) {
        columnDefs.forEach((colDef: any) => {
          if (
            colDef.filter &&
            colDef.filter.model === Filters['multipleSelect']
          ) {
            const field = colDef.field;
            if (!field) return;

            // Handle CurrencyID - use collection from editor
            if (field === 'CurrencyID') {
              const currencyCollection = this.getCurrencyCollection();
              const filteredCollection = currencyCollection.filter(
                (x) => x.value > 0
              );
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle SupplierSaleID - use collection from editor
            else if (field === 'SupplierSaleID') {
              const supplierCollection = this.getSupplierCollection();
              const filteredCollection = supplierCollection.filter(
                (x) => x.value > 0
              );
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle WarehouseID - use collection from editor
            else if (field === 'WarehouseID') {
              const warehouseCollection = this.getWarehouseCollection();
              const filteredCollection = warehouseCollection.filter(
                (x) => x.value > 0
              );
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle ProductGroupID/ProductGroupRTCID - use collection from editor
            else if (
              field === 'ProductGroupID' ||
              field === 'ProductGroupRTCID'
            ) {
              const productGroupCollection =
                this.getProductGroupCollection(isRTCTab);
              const filteredCollection = productGroupCollection.filter(
                (x) => x.value > 0
              );
              if (colDef.filter) {
                colDef.filter.collection = filteredCollection;
              }
            }
            // Handle text columns - get unique values from data
            else if (
              [
                'ProductCode',
                'ProjectCode',
                'ProductName',
                'Manufacturer',
                'StatusRequestText',
                'FullName',
                'UpdatedName',
                'ProductNewCode',
                'ProductCodeRTC',
              ].includes(field)
            ) {
              const collection = getUniqueValues(data, field);
              if (colDef.filter) {
                colDef.filter.collection = collection;
              }
            }
          }
        });
      }

      // Force refresh columns
      const updatedColumns = angularGrid.slickGrid.getColumns();
      angularGrid.slickGrid.setColumns(updatedColumns);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
    });
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

  /**
   * Tính index cố định của cột ĐVT (UnitName) dựa trên các cột động có thể ẩn/hiện
   * @param typeId - ID của tab để xác định các cột động
   * @returns Index của cột UnitName trong mảng columns
   */
  private getUnitNameColumnIndex(typeId: number): number {
    const isTBPTab = typeId === 4; // Tab "Mượn demo - RTC" có thêm 3 cột TBP

    let index = 0;

    // Cột cố định luôn có
    index += 2; // TT + WarehouseID

    // Cột TBP (chỉ có khi typeId === 4)
    if (isTBPTab) {
      index += 3; // IsApprovedTBP + ApprovedTBPName + DateApprovedTBP
    }

    // Cột Approval (có khi typeId !== 1 && typeId !== 4)
    if (typeId !== 1 && typeId !== 4) {
      index += 2; // IsRequestApproved + IsApprovedBGD
    }

    // Cột CustomerName (có khi typeId !== 1)
    if (typeId !== 1) {
      index += 1; // CustomerName
    }

    // Các cột cố định trước UnitName
    // CHÚ Ý: Ở tab 1, ProductGroupID và ProductNewCode được di chuyển ra SAU UnitName
    // nên chỉ tính 6 cột thay vì 8 cột
    if (typeId === 1) {
      // Tab Mua dự án: ProjectCode + ProductCode + ProductName + Model + Manufacturer + Quantity = 6 cột
      // (ProductGroupID và ProductNewCode đã được di chuyển ra sau UnitName)
      index += 6;
    } else {
      // Các tab khác: ProjectCode + ProductGroupID/ProductGroupRTCID + ProductNewCode/ProductCodeRTC + ProductCode + ProductName + Model + Manufacturer + Quantity = 8 cột
      index += 8;
    }

    return index;
  }
  //#endregion
}
