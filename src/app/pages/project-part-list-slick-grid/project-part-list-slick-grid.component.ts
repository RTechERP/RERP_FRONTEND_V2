import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  TemplateRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Inject,
  Optional,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router'; //nhận param
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
  AngularSlickgridModule,
  MultipleSelectOption
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import { TranslateService } from '@ngx-translate/core';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectWorkerService } from '../project/project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectPartListService } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';
import { AppUserService } from '../../services/app-user.service';
import { BillExportService } from '../old/Sale/BillExport/bill-export-service/bill-export.service';
import { AuthService } from '../../auth/auth.service';
import { appConfig, NOTIFICATION_TITLE, USER_ALL_REPORT_TECH } from '../../app.config';
import { ProjectSolutionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-detail/project-solution-detail.component';
import { ProjectSolutionVersionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-version-detail/project-solution-version-detail.component';
import { ProjectPartlistDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/project-partlist-detail.component';
import { ProjectPartListHistoryComponent } from '../project/project-part-list-history/project-part-list-history.component';
import { BillExportDetailComponent } from '../old/Sale/BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { ImportExcelPartlistComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/import-excel-partlist/import-excel-partlist.component';
import { FormExportExcelPartlistComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/form-export-excel-partlist/form-export-excel-partlist.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../purchase/project-partlist-purchase-request/project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
import { environment } from '../../../environments/environment';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-project-part-list-slick-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputModule,
    NzTabsModule,
    NzSpinModule,
    NzDropDownModule,
    NzCheckboxModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzTreeSelectModule,
    NgbModule,
    HasPermissionDirective
  ],
  templateUrl: './project-part-list-slick-grid.component.html',
  styleUrl: './project-part-list-slick-grid.component.css'
})
export class ProjectPartListSlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inputs
  @Input() tbp: boolean = false;
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  @Input() projectNameX: string = '';
  @Input() project: any;
  @Input() isPOKH: boolean = false;
  @Input() dtAddDetail: any;
  @Input() nodeMinLevelCount: number = 0;
  @Input() isSelectPartlist: any;
  @Input() typecheck: number = 0;
  @Input() onSelectProductPOCallback?: (data: { listIDInsert: number[], processedData: any[] }) => void;

  // ViewChilds for grid containers
  @ViewChild('gridSolution', { static: false }) gridSolutionContainer!: ElementRef;
  @ViewChild('gridSolutionVersion', { static: false }) gridSolutionVersionContainer!: ElementRef;
  @ViewChild('gridPOVersion', { static: false }) gridPOVersionContainer!: ElementRef;
  @ViewChild('gridPartList', { static: false }) gridPartListContainer!: ElementRef;

  // Template refs
  @ViewChild('priceRequestModalContent', { static: false }) priceRequestModalContent!: TemplateRef<any>;
  @ViewChild('purchaseRequestModalContent', { static: false }) purchaseRequestModalContent!: TemplateRef<any>;
  @ViewChild('deletePartListModalContent', { static: false }) deletePartListModalContent!: TemplateRef<any>;
  @ViewChild('deleteVersionModalContent', { static: false }) deleteVersionModalContent!: TemplateRef<any>;
  @ViewChild('additionalPartListPOModalContent', { static: false }) additionalPartListPOModalContent!: TemplateRef<any>;

  // Grid instances
  angularGridSolution!: AngularGridInstance;
  angularGridSolutionVersion!: AngularGridInstance;
  angularGridPOVersion!: AngularGridInstance;
  angularGridPartList!: AngularGridInstance;

  // Column definitions
  solutionColumns: Column[] = [];
  solutionVersionColumns: Column[] = [];
  poVersionColumns: Column[] = [];
  partListColumns: Column[] = [];

  // Grid options
  solutionGridOptions!: GridOption;
  solutionVersionGridOptions!: GridOption;
  poVersionGridOptions!: GridOption;
  partListGridOptions!: GridOption;

  // Grid ready flags
  gridsInitialized = false;

  // Data
  dataSolution: any[] = [];
  dataSolutionVersion: any[] = [];
  dataPOVersion: any[] = [];
  dataProjectPartList: any[] = [];
  projects: any[] = [];
  warehouses: any[] = [];
  treeWorkerData: any[] = [];

  // State variables
  sizeLeftPanel: string = '';
  sizeRightPanel: string = '';
  projectSolutionId: number = 0;
  versionID: number = 0;
  versionPOID: number = 0;
  type: number = 0;
  keyword: string = '';
  searchKeyword: string = '';
  isDeleted: number = 0;
  isApprovedTBP: number = -1;
  isApprovedPurchase: number = -1;
  selectionCode: string = '';
  projectTypeID: number = 0;
  projectTypeName: string = '';
  projectCode: string = '';
  selectionProjectSolutionName: string = '';
  STT: number = 0;
  currentUser: any;
  isLoading: boolean = false;
  private loadingCounter: number = 0;
  private loadingTimeout: any = null;

  // Selection tracking
  savedSelectedRowIds: Set<number> = new Set();
  isTogglingChildren: boolean = false;
  previousSelectedRows: Set<number> = new Set();
  independentlyDeselectedNodes: Set<number> = new Set();
  selectedData: any[] = [];
  CodeName: string = '';
  lastClickedPartListRow: any = null;

  // Flag to prevent recursive selection events
  private clearingSelection = false;

  // Modal data
  deadlinePriceRequest: Date | null = null;
  deadlinePurchaseRequest: Date | null = null;
  reasonDeleted: string = '';
  reasonDeletedVersion: string = '';
  reasonProblem: string = '';
  isGeneratedItem: boolean = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Callback data
  private selectProductPOData: { listIDInsert: number[], processedData: any[] } | null = null;

  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private projectPartListService: ProjectPartListService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    @Optional() public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService,
    private billExportService: BillExportService,
    private authService: AuthService,
    private route: ActivatedRoute,  //nhận param
    @Optional() private translateService?: TranslateService,
    @Optional() @Inject('tabData') private tabData?: any
  ) { }

  ngOnInit(): void {
    console.log('=== [LIFECYCLE] ngOnInit START ===');
    
    // Đọc query parameter tbp
    this.route.queryParams.subscribe((params: any) => {
      if (params['tbp'] !== undefined) {
        this.tbp = params['tbp'] === 'true';
        console.log('[LIFECYCLE] tbp from query params:', this.tbp);
      }
    });
    
    console.log('[LIFECYCLE] Input params:', {
      projectId: this.projectId,
      isPOKH: this.isPOKH,
      tbp: this.tbp,
      projectCodex: this.projectCodex
    });

    if (this.tabData?.tbp) {
      this.tbp = this.tabData.tbp;
      console.log('[LIFECYCLE] tbp updated from tabData:', this.tbp);
    }
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.isApprovedPurchase = -1;

    // Initialize grids in ngOnInit to ensure options are ready before grid renders
    console.log('[LIFECYCLE] Calling initializeGrids()');
    this.initializeGrids();
    console.log('=== [LIFECYCLE] ngOnInit END ===');
  }

  ngAfterViewInit(): void {
    console.log('=== [LIFECYCLE] ngAfterViewInit START ===');
    console.log('[LIFECYCLE] Loading initial data');
    this.loadProjects();
    this.loadWarehouses();
    this.authService.getCurrentUser().subscribe((user: any) => {
      this.currentUser = user.data;
      console.log('[LIFECYCLE] Current user loaded:', user.data?.FullName);
    });

    // Delay để đảm bảo DOM đã sẵn sàng trước khi render version grids
    setTimeout(() => {
      console.log('[LIFECYCLE] Setting gridsInitialized = true');
      this.gridsInitialized = true;

      // Load data sau khi grids đã được khởi tạo
      setTimeout(() => {
        console.log('[LIFECYCLE] Triggering loadDataSolution');
        this.loadDataSolution();
      }, 100);
    }, 300);
    console.log('=== [LIFECYCLE] ngAfterViewInit END ===');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Initialize all grids
  initializeGrids(): void {
    console.log('[INIT] initializeGrids START');
    console.log('[INIT] isPOKH:', this.isPOKH, '| tbp:', this.tbp);

    console.log('[INIT] Initializing Solution Grid');
    this.initSolutionGrid();
    console.log('[INIT] Solution Grid columns:', this.solutionColumns?.length);

    if (!this.isPOKH) {
      console.log('[INIT] Initializing Solution Version Grid');
      this.initSolutionVersionGrid();
      console.log('[INIT] Solution Version Grid columns:', this.solutionVersionColumns?.length);
    } else {
      console.log('[INIT] Skipping Solution Version Grid (isPOKH=true)');
    }

    console.log('[INIT] Initializing PO Version Grid');
    this.initPOVersionGrid();
    console.log('[INIT] PO Version Grid columns:', this.poVersionColumns?.length);

    console.log('[INIT] Initializing PartList Grid');
    this.initPartListGrid();
    console.log('[INIT] PartList Grid columns:', this.partListColumns?.length);

    console.log('[INIT] initializeGrids END');
  }

  // Initialize Solution Grid
  initSolutionGrid(): void {
    this.solutionColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 30,
        sortable: false,
        filterable: false,
      },
      {
        id: 'StatusSolution',
        field: 'StatusSolution',
        name: 'Trạng thái',
        width: 50,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
      },
      {
        id: 'IsApprovedPO',
        field: 'IsApprovedPO',
        name: 'Duyệt PO',
        width: 50,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
      },
      {
        id: 'DateSolution',
        field: 'DateSolution',
        name: 'Ngày GP',
        width: 100,
        sortable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
      },
      {
        id: 'CodeSolution',
        field: 'CodeSolution',
        name: 'Mã',
        width: 70,
        sortable: true,
      },
      {
        id: 'ContentSolution',
        field: 'ContentSolution',
        name: 'Nội dung',
        width: 300,
        sortable: true,
      },
    ];

    this.solutionGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-solution-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableSorting: true,
      enablePagination: false,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Initialize Solution Version Grid
  initSolutionVersionGrid(): void {
    this.solutionVersionColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 50,
      },
      // {
      //   id: 'ID',
      //   field: 'ID',
      //   name: 'ID',
      //   width: 0,
      //   excludeFromColumnPicker: true,
      //   excludeFromGridMenu: true,
      //   excludeFromQuery: true,
      // },
      {
        id: 'IsActive',
        field: 'IsActive',
        name: 'Sử dụng',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã',
        width: 100,
      },
      {
        id: 'DescriptionVersion',
        field: 'DescriptionVersion',
        name: 'Mô tả',
        width: 300,
      },
    ];

    this.solutionVersionGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-solution-version-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableSorting: true,
      enablePagination: false,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Initialize PO Version Grid
  initPOVersionGrid(): void {
    this.poVersionColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 50,
      },
      // {
      //   id: 'ID',
      //   field: 'ID',
      //   name: 'ID',
      //   width: 0,
      //   excludeFromColumnPicker: true,
      //   excludeFromGridMenu: true,
      //   excludeFromQuery: true,
      // },
      {
        id: 'IsActive',
        field: 'IsActive',
        name: 'Sử dụng',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã',
        width: 100,
      },
      {
        id: 'DescriptionVersion',
        field: 'DescriptionVersion',
        name: 'Mô tả',
        width: 300,
      },
    ];

    this.poVersionGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-po-version-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true,
      },
      enableSorting: true,
      enablePagination: false,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Initialize PartList Grid (Tree structure)
  initPartListGrid(): void {
    console.log('[INIT PARTLIST] ========== Initializing PartList Grid ==========');

    // Helper: checkbox formatter
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value === true || value === 'true' || value === 1 || value === '1';
      return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff !important;" />`;
    };

    // Helper: money formatter
    const moneyFormatter = (row: number, cell: number, value: any) => {
      return this.formatMoney(value, 2);
    };

    // Helper: number formatter
    const numberFormatter = (row: number, cell: number, value: any) => {
      return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
    };

    // Helper: natural sorting for hierarchy strings (1.1.1, 1.1.10, etc.)
    const naturalSortHierarchy = (value1: any, value2: any) => {
      const a = String(value1 || '');
      const b = String(value2 || '');

      if (a === b) return 0;

      const aParts = a.split('.');
      const bParts = b.split('.');
      const maxLength = Math.max(aParts.length, bParts.length);

      for (let i = 0; i < maxLength; i++) {
        const aPart = parseInt(aParts[i] || '0', 10);
        const bPart = parseInt(bParts[i] || '0', 10);

        if (aPart < bPart) return -1;
        if (aPart > bPart) return 1;
      }

      return 0;
    };

    // Áp dụng cấu trúc cột đầy đủ từ project-part-list.component.ts với columnGroup
    this.partListColumns = [
      // ==================== NHÓM: Vật tư dự án ====================
      {
        id: 'TT', field: 'TT', name: 'TT', width: 120, columnGroup: 'Vật tư dự án', formatter: Formatters.tree,
        sortable: true,
        sortComparer: naturalSortHierarchy,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'GroupMaterial', field: 'GroupMaterial', name: 'Tên vật tư', width: 200, columnGroup: 'Vật tư dự án',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.GroupMaterial}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductCode', field: 'ProductCode', name: 'Mã thiết bị', width: 150, columnGroup: 'Vật tư dự án',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
         formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ProductCode}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Model', field: 'Model', name: 'Thông số kỹ thuật', width: 200, columnGroup: 'Vật tư dự án',
         formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Model}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: { model: Filters['compoundInputText'] }
      },
      {
        id: 'QtyMin', field: 'QtyMin', name: 'SL/1 máy', width: 50, columnGroup: 'Vật tư dự án', formatter: numberFormatter, cssClass: 'text-right', filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'QtyFull', field: 'QtyFull', name: 'SL tổng', width: 50, columnGroup: 'Vật tư dự án', formatter: numberFormatter, cssClass: 'text-right', filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },

      // ==================== NHÓM: Thông tin thêm (trống title) ====================
      {
        id: 'SpecialCode', field: 'SpecialCode', name: 'Mã đặc biệt', width: 120, columnGroup: ' ',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.SpecialCode}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Manufacturer', field: 'Manufacturer', name: 'Hãng SX', width: 120, columnGroup: ' ',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Manufacturer}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Unit', field: 'Unit', name: 'Đơn vị', width: 70, columnGroup: ' ', cssClass: 'text-center',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'IsFix', field: 'IsFix', name: 'Tích xanh', width: 50, columnGroup: ' ', formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'Có' },
            { value: 'false', label: 'Không' }
          ],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
    id: 'IsApprovedTBPText',
    field: 'IsApprovedTBPText',
    name: 'TBP duyệt',
    width: 70,
    columnGroup: ' ',
    formatter: (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
        if (value === 'Đã duyệt') {
            return `<i class="mdi mdi-check text-success" style="font-size: 18px;"></i>`;
        }
        return '';  // Không hiển thị gì nếu chưa duyệt
    },
    cssClass: 'text-center',
    filterable: true,
    filter: {
        model: Filters['multipleSelect'],
        collection: [
            { value: 'Đã duyệt', label: 'Đã duyệt' },
            { value: 'Chưa duyệt', label: 'Chưa duyệt' }
        ],
        collectionOptions: { 
            addBlankEntry: true 
        },
        filterOptions: { 
            autoAdjustDropWidthByTextSize: true, 
            filter: true 
        }
    }
},
      {
        id: 'IsNewCode', field: 'IsNewCode', name: 'Hàng mới', width: 50, columnGroup: ' ', formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Hàng mới' },
            // { value: false, label: 'Không có' },
          ],
          model: Filters['singleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'IsApprovedTBPNewCode', field: 'IsApprovedTBPNewCode', name: 'TBP duyệt SP mới', width: 80, columnGroup: ' ', formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'Có' },
            { value: 'false', label: 'Không' }
          ],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'Price', field: 'Price', name: 'Đơn giá', width: 100, columnGroup: ' ', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'Amount', field: 'Amount', name: 'Tổng tiền', width: 120, columnGroup: ' ', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'UnitPriceHistory', field: 'UnitPriceHistory', name: 'Đơn giá lịch sử', width: 100, columnGroup: ' ', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CurrencyCode', field: 'CurrencyCode', name: 'Loại tiền', width: 80, columnGroup: ' ', cssClass: 'text-center',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'Quality', field: 'Quality', name: 'Chất lượng', width: 80, columnGroup: ' ', cssClass: 'text-center',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'FullNameCreated', field: 'FullNameCreated', name: 'Người tạo', width: 120, columnGroup: ' ',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      { id: 'CreatedDate', field: 'CreatedDate', name: 'Ngày tạo', width: 100, columnGroup: ' ', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'Note', field: 'Note', name: 'Ghi chú', width: 200, columnGroup: ' ', filterable: true,filter: { model: Filters['compoundInputText']},
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Note}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ReasonProblem', field: 'ReasonProblem', name: 'Lý do phát sinh', width: 200, columnGroup: ' ',filterable: true,filter: { model: Filters['compoundInputText']},
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ReasonProblem}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ReasonDeleted', field: 'ReasonDeleted', name: 'Lý do xóa', width: 150, columnGroup: ' ',filterable: true,filter: { model: Filters['compoundInputText']},
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.ReasonDeleted}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },

      // ==================== NHÓM: Yêu cầu báo giá ====================
      {
        id: 'IsCheckPrice', field: 'IsCheckPrice', name: 'Check giá', width: 70, columnGroup: 'Yêu cầu báo giá', formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'Có' },
            { value: 'false', label: 'Không' }
          ],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'StatusPriceRequestText', field: 'StatusPriceRequestText', name: 'Trạng thái báo giá', width: 120, columnGroup: 'Yêu cầu báo giá', cssClass: 'text-center',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'FullNameQuote', field: 'FullNameQuote', name: 'NV báo giá', width: 120, columnGroup: 'Yêu cầu báo giá',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameQuote}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'DatePriceRequest', field: 'DatePriceRequest', name: 'Ngày yêu cầu', width: 100, columnGroup: 'Yêu cầu báo giá', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'FullNameRequestPrice', field: 'FullNameRequestPrice', name: 'Người yêu cầu', width: 120, columnGroup: 'Yêu cầu báo giá',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameRequestPrice}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'DeadlinePriceRequest', field: 'DeadlinePriceRequest', name: 'Deadline Báo giá', width: 110, columnGroup: 'Yêu cầu báo giá', formatter: Formatters.dateIso, cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'DatePriceQuote', field: 'DatePriceQuote', name: 'Ngày báo giá', width: 100, columnGroup: 'Yêu cầu báo giá', formatter: Formatters.dateIso, cssClass: 'text-center',
        filterable: true, filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'UnitPriceQuote', field: 'UnitPriceQuote', name: 'Đơn giá báo', width: 100, columnGroup: 'Yêu cầu báo giá', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPriceQuote', field: 'TotalPriceQuote', name: 'Thành tiền báo giá', width: 120, columnGroup: 'Yêu cầu báo giá', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CurrencyQuote', field: 'CurrencyQuote', name: 'Loại tiền BG', width: 90, columnGroup: 'Yêu cầu báo giá', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'CurrencyRateQuote', field: 'CurrencyRateQuote', name: 'Tỷ giá báo', width: 90, columnGroup: 'Yêu cầu báo giá', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPriceExchangeQuote', field: 'TotalPriceExchangeQuote', name: 'Thành tiền quy đổi (VND)', width: 150, columnGroup: 'Yêu cầu báo giá', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'NameNCCPriceQuote', field: 'NameNCCPriceQuote', name: 'Nhà cung cấp báo giá', width: 150, columnGroup: 'Yêu cầu báo giá',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NameNCCPriceQuote}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'LeadTimeQuote', field: 'LeadTimeQuote', name: 'Lead Time báo giá', width: 110, columnGroup: 'Yêu cầu báo giá', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      { id: 'DateExpectedQuote', field: 'DateExpectedQuote', name: 'Ngày về dự kiến', width: 110, columnGroup: 'Yêu cầu báo giá', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'NoteQuote', field: 'NoteQuote', name: 'Ghi chú báo giá', width: 200, columnGroup: 'Yêu cầu báo giá',filterable: true,filter: { model: Filters['compoundInputText']},
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NoteQuote}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },

      // ==================== NHÓM: Yêu cầu mua hàng ====================
      {
        id: 'IsApprovedPurchase', field: 'IsApprovedPurchase', name: 'Yêu cầu mua', width: 90, columnGroup: 'Yêu cầu mua hàng',
        formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'Có' },
            { value: 'false', label: 'Không' }
          ],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'FullNameRequestPurchase', field: 'FullNameRequestPurchase', name: 'Người yêu cầu mua', width: 130, columnGroup: 'Yêu cầu mua hàng',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNameRequestPurchase}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
      },
      {
        id: 'StatusText', field: 'StatusText', name: 'Tình trạng', width: 100, columnGroup: 'Yêu cầu mua hàng', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'FullNamePurchase', field: 'FullNamePurchase', name: 'NV mua hàng', width: 120, columnGroup: 'Yêu cầu mua hàng',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.FullNamePurchase}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      { id: 'ExpectedReturnDate', field: 'ExpectedReturnDate', name: 'Deadline mua hàng', width: 120, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'RequestDate', field: 'RequestDate', name: 'Ngày yêu cầu đặt hàng', width: 130, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center',
        filterable: true, filter: { model: Filters['compoundDate'] }
      },
      { id: 'RequestDatePurchase', field: 'RequestDatePurchase', name: 'Ngày bắt đầu đặt hàng', width: 140, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'ExpectedDatePurchase', field: 'ExpectedDatePurchase', name: 'Ngày dự kiến đặt hàng', width: 140, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      { id: 'ExpectedArrivalDate', field: 'ExpectedArrivalDate', name: 'Ngày dự kiến hàng về', width: 140, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'BillCodePurchase', field: 'BillCodePurchase', name: 'Mã đặt hàng', width: 120, columnGroup: 'Yêu cầu mua hàng',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.BillCodePurchase}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'UnitPricePurchase', field: 'UnitPricePurchase', name: 'Đơn giá mua hàng', width: 120, columnGroup: 'Yêu cầu mua hàng', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPricePurchase', field: 'TotalPricePurchase', name: 'Thành tiền mua hàng', width: 130, columnGroup: 'Yêu cầu mua hàng', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'CurrencyPurchase', field: 'CurrencyPurchase', name: 'Loại tiền MH', width: 90, columnGroup: 'Yêu cầu mua hàng', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'CurrencyRatePurchase', field: 'CurrencyRatePurchase', name: 'Tỷ giá mua', width: 90, columnGroup: 'Yêu cầu mua hàng', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalPriceExchangePurchase', field: 'TotalPriceExchangePurchase', name: 'Thành tiền quy đổi MH (VND)', width: 160, columnGroup: 'Yêu cầu mua hàng', formatter: moneyFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'SupplierNamePurchase', field: 'SupplierNamePurchase', name: 'NCC mua hàng', width: 150, columnGroup: 'Yêu cầu mua hàng',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.SupplierNamePurchase}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'LeadTimePurchase', field: 'LeadTimePurchase', name: 'Lead Time đặt hàng', width: 120, columnGroup: 'Yêu cầu mua hàng', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'QuantityReturn', field: 'QuantityReturn', name: 'SL đã về', width: 80, columnGroup: 'Yêu cầu mua hàng', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalExport', field: 'TotalExport', name: 'SL đã xuất', width: 80, columnGroup: 'Yêu cầu mua hàng', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'RemainQuantity', field: 'RemainQuantity', name: 'SL còn lại', width: 80, columnGroup: 'Yêu cầu mua hàng', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'ProductNewCode', field: 'ProductNewCode', name: 'Mã nội bộ', width: 100, columnGroup: 'Yêu cầu mua hàng', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'BillExportCode', field: 'BillExportCode', name: 'Phiếu xuất', width: 100, columnGroup: 'Yêu cầu mua hàng', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'DateImport', field: 'DateImport', name: 'Ngày nhận hàng', width: 110, columnGroup: 'Yêu cầu mua hàng', formatter: Formatters.dateIso, cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'NotePurchase', field: 'NotePurchase', name: 'Ghi chú mua', width: 200, columnGroup: 'Yêu cầu mua hàng',filterable: true,filter: { model: Filters['compoundInputText']},
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.NotePurchase}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },

      // ==================== NHÓM: Nhập kho ====================
      { id: 'DateImport2', field: 'DateImport', name: 'Ngày nhập kho', width: 110, columnGroup: 'Nhập kho', formatter: Formatters.dateIso, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'] } },
      {
        id: 'BillImportCode', field: 'BillImportCode', name: 'Mã phiếu nhập', width: 120, columnGroup: 'Nhập kho', cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.BillImportCode}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
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
        id: 'Reciver', field: 'Reciver', name: 'Người nhập kho', width: 120, columnGroup: 'Nhập kho', formatter: (_row: any, _cell: any,
          value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.Reciver}"
              style="
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                word-wrap: break-word;
                word-break: break-word;
                line-height: 1.4;
              "
            >
              ${value}
            </span>
          `;
        },
        customTooltip: {
          useRegularTooltip: true,
          // useRegularTooltipFromCellTextOnly: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },
      {
        id: 'KhoType', field: 'KhoType', name: 'Kho nhập', width: 100, columnGroup: 'Nhập kho',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        }
      },

      // ==================== NHÓM: Tồn CK (được sử dụng) ====================
      {
        id: 'TotalHN', field: 'TotalHN', name: 'Hà Nội', width: 80, columnGroup: 'Tồn CK (được sử dụng)', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalHCM', field: 'TotalHCM', name: 'Hồ Chí Minh', width: 100, columnGroup: 'Tồn CK (được sử dụng)', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalDP', field: 'TotalDP', name: 'Đan Phượng', width: 90, columnGroup: 'Tồn CK (được sử dụng)', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalHP', field: 'TotalHP', name: 'Hải Phòng', width: 90, columnGroup: 'Tồn CK (được sử dụng)', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
      {
        id: 'TotalBN', field: 'TotalBN', name: 'Bắc Ninh', width: 80, columnGroup: 'Tồn CK (được sử dụng)', formatter: numberFormatter, cssClass: 'text-right',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] }
      },
    ];
    this.partListGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-partlist-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      // Freeze 6 columns (Checkbox + first 5 defined columns)
      frozenColumn: 6,
      // rowHeight: 33, // Base height - sẽ tự động tăng theo nội dung qua CSS
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      enableFiltering: true,
      enableSorting: true,
      multiColumnSort: false,
      enablePagination: false,
      // Row height - tăng để text wrap không bị đè
      rowHeight: 50,
      // headerRowHeight: 40,
      // Checkbox Selector - thêm cột dấu tích ở đầu
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      // Tree Data Configuration - Đơn giản như project-slick-grid2
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'TT',              // Cột hiển tree icon
        parentPropName: 'parentId',  // Chỉ cần parentId
        levelPropName: 'treeLevel',  // SlickGrid tự tính
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      // Header Grouping
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,
      // Footer Row for Bottom Calculations
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      // Frozen Columns - Freeze all columns in "Vật tư dự án" group (6 columns)
      //frozenColumn: 6,
      // Row Metadata Provider cho tô màu dòng/cell
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: any, row: number) => this.getPartListRowMetadata(item, row),
        },
      },
    };

    console.log('[INIT PARTLIST] PartList grid options configured with tree data, header grouping, checkbox selector and row coloring');
  }

  // Hàm trả về row metadata cho tô màu dòng/cell (giống component cũ)
  getPartListRowMetadata(item: any, row: number): any {
    if (!item) return null;

    // Check if item has children by looking for items with this item as parent
    const hasChildren = !item.IsLeaf; // Sử dụng property đã tính sẵn thay vì .some() để tối ưu
    const isDeleted = item.IsDeleted === true;
    const isProblem = item.IsProblem === true;
    const quantityReturn = Number(item.QuantityReturn) || 0;
    const isFix = item.IsFix === true;
    const isProductSale = item.IsProductSale && item.IsProductSale !== '';
    const isNewCode = item.IsNewCode === true;

    // Các trường totalSame - check = 0 thì màu hồng
    const totalSameProductCode = Number(item.IsSameProductCode) || 0;
    const totalSameProductName = Number(item.IsSameProductName) || 0;
    const totalSameMaker = Number(item.IsSameMaker) || 0;
    const totalSameUnit = Number(item.IsSameUnit) || 0;

    let rowCssClass = '';

    // 1. Ưu tiên cao nhất: Dòng bị xóa → Red
    if (isDeleted) {
      rowCssClass = 'row-deleted';
    }
    // 2. Dòng có vấn đề → Orange
    else if (isProblem) {
      rowCssClass = 'row-problem';
    }
    // 3. Số lượng trả về > 0 → LightGreen
    else if (quantityReturn > 0) {
      rowCssClass = 'row-return';
    }
    // 4. Node cha (có children) → LightGray + Bold
    else if (hasChildren) {
      rowCssClass = 'row-parent';
    }

    // Tạo column metadata cho tô màu cell cụ thể
    // Màu cell sẽ đè lên màu dòng (giống logic Tabulator gốc)
    const columns: Record<string, { cssClass?: string }> = {};

    // Chỉ áp dụng màu cell cho node lá (không phải parent)
    if (!hasChildren) {
      // === Logic màu HỒNG: IsNewCode = true VÀ totalSame = 0 ===
      if (isNewCode) {
        // Cột GroupMaterial - màu hồng nếu IsSameProductName = 0
        if (totalSameProductName === 0) {
          columns['GroupMaterial'] = { cssClass: 'cell-pink' };
        }
        // Cột ProductCode - ưu tiên: IsFix > IsProductSale > màu hồng
        if (isFix) {
          columns['ProductCode'] = { cssClass: 'cell-is-fix' }; // Xanh nước biển
        } else if (isProductSale) {
          columns['ProductCode'] = { cssClass: 'cell-product-sale' }; // Light yellow
        } else if (totalSameProductCode === 0) {
          columns['ProductCode'] = { cssClass: 'cell-pink' }; // Màu hồng
        }
        // Cột Manufacturer - màu hồng nếu IsSameMaker = 0
        if (totalSameMaker === 0) {
          columns['Manufacturer'] = { cssClass: 'cell-pink' };
        }
        // Cột Unit - màu hồng nếu IsSameUnit = 0
        if (totalSameUnit === 0) {
          columns['Unit'] = { cssClass: 'cell-pink' };
        }
      } else {
        // Không phải IsNewCode - áp dụng màu IsFix/IsProductSale cho ProductCode
        if (isFix) {
          columns['ProductCode'] = { cssClass: 'cell-is-fix' };
        } else if (isProductSale) {
          columns['ProductCode'] = { cssClass: 'cell-product-sale' };
        }
      }
    }

    // Chỉ log khi có cell coloring thực sự để giảm noise
    // if (Object.keys(columns).length > 0) {
    //   console.log(`[ROW METADATA] Row ${row}: TT=${item.TT}, IsNewCode=${isNewCode}, IsFix=${isFix}, hasChildren=${hasChildren}, rowClass=${rowCssClass}, columns=`, Object.keys(columns));
    // }

    return {
      cssClasses: rowCssClass,
      columns: Object.keys(columns).length > 0 ? columns : undefined,
    };
  }

  // Handler cho checkbox selection - TỰ ĐỘNG CHỌN CON KHI CHỌN CHA (giống component cũ)
  // Logic: Khi chọn cha → tự động chọn tất cả con, khi bỏ chọn cha → bỏ chọn tất cả con
  onPartListRowSelectionChanged(e: any, args: any): void {
    console.log('[CHECKBOX] ========== Selection Changed ==========');
    console.log('[CHECKBOX] Current rows:', args.rows);
    console.log('[CHECKBOX] Previous rows:', args.previousSelectedRows);

    if (!this.angularGridPartList) {
      console.log('[CHECKBOX] Grid not ready, skipping');
      return;
    }

    const dataView = this.angularGridPartList.dataView;
    const slickGrid = this.angularGridPartList.slickGrid;

    // Lấy danh sách các row được chọn và trước đó
    const currentSelectedRows = new Set<number>(args.rows || []);
    const previousSelectedRows = new Set<number>(args.previousSelectedRows || []);

    // Xác định các row thay đổi (được chọn/bỏ chọn)
    const changedRows = new Set<number>();

    // Tìm các row được thêm vào selection
    currentSelectedRows.forEach(rowNum => {
      if (!previousSelectedRows.has(rowNum)) {
        changedRows.add(rowNum);
      }
    });

    // Tìm các row bị bỏ khỏi selection
    previousSelectedRows.forEach(rowNum => {
      if (!currentSelectedRows.has(rowNum)) {
        changedRows.add(rowNum);
      }
    });

    console.log('[CHECKBOX] Changed rows:', Array.from(changedRows));

    // Xử lý từng row thay đổi
    const finalSelection = new Set(currentSelectedRows);

    changedRows.forEach((rowNum: number) => {
      const item = dataView.getItem(rowNum);
      if (!item) return;

      const isSelecting = currentSelectedRows.has(rowNum);
      const isParent = item.IsLeaf === false; // Node cha = IsLeaf = false

      console.log(`[CHECKBOX] Processing row ${rowNum}: TT=${item.TT}, ID=${item.id}, IsLeaf=${item.IsLeaf}, Action=${isSelecting ? 'SELECT' : 'DESELECT'}`);

      if (isParent) {
        // Nếu là node cha, xử lý tất cả các con
        this.processChildrenSelection(item, dataView, slickGrid, isSelecting, finalSelection);
      }
    });

    // Set selection mới
    const newSelectedRows = Array.from(finalSelection);
    console.log('[CHECKBOX] Final selection:', newSelectedRows);

    // Cập nhật selection (sẽ trigger event nhưng chúng ta sẽ xử lý lại)
    slickGrid.setSelectedRows(newSelectedRows);
  }

  // Helper method: Lấy danh sách các row đã chọn với thông tin IsLeaf (dùng cho API actions)
  getSelectedPartListData(): any[] {
    console.log('[SELECTION] ========== Getting Selected PartList Data ==========');

    if (!this.angularGridPartList) {
      console.log('[SELECTION] Grid not ready');
      return [];
    }

    const slickGrid = this.angularGridPartList.slickGrid;
    const dataView = this.angularGridPartList.dataView;
    const selectedRowIndices = slickGrid.getSelectedRows() || [];

    console.log('[SELECTION] Selected row indices:', selectedRowIndices);

    const selectedData = selectedRowIndices.map((rowIndex: number) => {
      const item = dataView.getItem(rowIndex);
      return item;
    }).filter((item: any) => item !== null && item !== undefined);

    console.log('[SELECTION] Selected data count:', selectedData.length);

    // Log chi tiết từng item
    selectedData.forEach((item: any, index: number) => {
      console.log(`[SELECTION] Item ${index}: ID=${item.ID}, TT=${item.TT}, IsLeaf=${item.IsLeaf}, IsDeleted=${item.IsDeleted}`);
    });

    // Phân loại leaf và parent nodes
    const leafNodes = selectedData.filter((item: any) => item.IsLeaf === true);
    const parentNodes = selectedData.filter((item: any) => item.IsLeaf === false);
    console.log(`[SELECTION] Leaf nodes: ${leafNodes.length}, Parent nodes: ${parentNodes.length}`);

    return selectedData;
  }

  // Helper method: Lấy chỉ các node lá (IsLeaf = true) đã chọn - dùng cho các action chỉ áp dụng cho node lá
  getSelectedLeafNodes(): any[] {
    const allSelected = this.getSelectedPartListData();
    const leafNodes = allSelected.filter((item: any) => item.IsLeaf === true);
    console.log(`[SELECTION] Filtered to ${leafNodes.length} leaf nodes only`);
    return leafNodes;
  }

  // Xử lý chọn/bỏ chọn tất cả children của một parent (đệ quy)
  private processChildrenSelection(parentItem: any, dataView: any, slickGrid: any, isSelecting: boolean, finalSelection: Set<number>, visited = new Set<number>()): void {
    if (visited.has(parentItem.id)) return;
    visited.add(parentItem.id);

    console.log(`[CHECKBOX] Processing children for parent: TT=${parentItem.TT}, ID=${parentItem.id}, Action=${isSelecting ? 'SELECT' : 'DESELECT'}`);

    const allItems = dataView.getItems();
    const children = allItems.filter((item: any) => item.parentId === parentItem.id);

    console.log(`[CHECKBOX] Found ${children.length} direct children`);

    children.forEach((child: any) => {
      const childRowNum = dataView.getRowById(child.id);
      if (childRowNum !== undefined) {
        if (isSelecting) {
          finalSelection.add(childRowNum as number);
        } else {
          finalSelection.delete(childRowNum as number);
        }

        console.log(`[CHECKBOX] ${isSelecting ? 'SELECTED' : 'DESELECTED'} child: TT=${child.TT}, ID=${child.id}, Row=${childRowNum}`);

        // Đệ quy cho các con của child (multi-level) - Sử dụng IsLeaf để tối ưu
        if (!child.IsLeaf) {
          this.processChildrenSelection(child, dataView, slickGrid, isSelecting, finalSelection, visited);
        }
      }
    });
  }

  // Thu thập tất cả children của một node (đệ quy) - giữ lại cho các hàm khác
  private collectAllChildren(parentItem: any, dataView: any, rowsToProcess: Set<number>, visited = new Set<number>()): void {
    if (visited.has(parentItem.id)) return;
    visited.add(parentItem.id);

    const allItems = dataView.getItems();
    const children = allItems.filter((item: any) => item.parentId === parentItem.id);

    console.log('[CHECKBOX] Collecting children for parent:', parentItem.TT || parentItem.id, 'Found:', children.length);

    children.forEach((child: any) => {
      const childRowNum = dataView.getRowById(child.id);
      if (childRowNum !== undefined) {
        rowsToProcess.add(childRowNum as number);

        // Đệ quy cho các con của child - Sử dụng IsLeaf để tối ưu
        if (!child.IsLeaf) {
          this.collectAllChildren(child, dataView, rowsToProcess, visited);
        }
      }
    });
  }

  // Hàm tô màu dòng cho PartList (giống logic từ project-part-list.component.ts)
  getPartListRowClass(item: any): string {
    if (!item) return '';

    // Check if item has children using pre-calculated IsLeaf property
    const hasChildren = !item.IsLeaf;
    const isDeleted = item.IsDeleted === true;
    const isProblem = item.IsProblem === true;
    const quantityReturn = Number(item.QuantityReturn) || 0;

    // 1. Ưu tiên cao nhất: Dòng bị xóa → Red
    if (isDeleted) {
      return 'row-deleted';
    }
    // 2. Dòng có vấn đề → Orange
    if (isProblem) {
      return 'row-problem';
    }
    // 3. Số lượng trả về > 0 → LightGreen
    if (quantityReturn > 0) {
      return 'row-return';
    }
    // 4. Node cha (có children) → LightGray + Bold
    if (hasChildren) {
      return 'row-parent';
    }
    // 5. Node lá - không có class đặc biệt
    return '';
  }

  // Grid ready handlers
  onSolutionGridReady(event: any): void {
    console.log('[GRID READY] Solution Grid ready');
    this.angularGridSolution = event.detail;
    console.log('[GRID READY] Solution Grid instance:', !!this.angularGridSolution);

    // Setup grouping by ProjectCode
    if (this.angularGridSolution && this.angularGridSolution.dataView) {
      this.angularGridSolution.dataView.setGrouping([
        {
          getter: 'CodeRequest',
          comparer: () => 0,
          formatter: (g: any) => {
            const projectCode = g.value;
            return `Mã yêu cầu: ${projectCode}`;
          }
        }
      ]);
    }

    // Load data nếu chưa có
    if (this.dataSolution.length === 0 && this.projectId > 0) {
      console.log('[GRID READY] Scheduling Solution data load');
      setTimeout(() => this.loadDataSolution(), 100);
    }
  }

  onSolutionVersionGridReady(event: any): void {
    console.log('[GRID READY] Solution Version Grid ready');
    this.angularGridSolutionVersion = event.detail;
    console.log('[GRID READY] Solution Version Grid instance:', !!this.angularGridSolutionVersion);

    // Setup grouping by CodeSolution
    if (this.angularGridSolutionVersion && this.angularGridSolutionVersion.dataView) {
      this.angularGridSolutionVersion.dataView.setGrouping([
        {
          getter: 'ProjectTypeName',
          comparer: () => 0,
          formatter: (g: any) => {
            const solutionCode = g.value;
            return `Danh mục: ${solutionCode}`;
          }
        }
      ]);
    }

    // Load data nếu đã có projectSolutionId
    if (this.dataSolutionVersion.length === 0 && this.projectSolutionId > 0) {
      console.log('[GRID READY] Scheduling Solution Version data load');
      setTimeout(() => this.loadDataProjectPartListVersion(), 100);
    }
  }

  onPOVersionGridReady(event: any): void {
    console.log('[GRID READY] PO Version Grid ready');
    this.angularGridPOVersion = event.detail;
    console.log('[GRID READY] PO Version Grid instance:', !!this.angularGridPOVersion);

    // Setup grouping by CodeSolution
    if (this.angularGridPOVersion && this.angularGridPOVersion.dataView) {
      this.angularGridPOVersion.dataView.setGrouping([
        {
          getter: 'ProjectTypeName',
          comparer: () => 0,
          formatter: (g: any) => {
            const solutionCode = g.value;
            return `Danh mục: ${solutionCode}`;
          }
        }
      ]);
    }

    // Load data nếu đã có projectSolutionId
    if (this.dataPOVersion.length === 0 && this.projectSolutionId > 0) {
      console.log('[GRID READY] Scheduling PO Version data load');
      setTimeout(() => this.loadDataProjectPartListVersionPO(), 100);
    }
  }

  onPartListGridReady(event: any): void {
    console.log('[GRID READY] ========== PartList Grid ready ==========');
    this.angularGridPartList = event.detail;
    console.log('[GRID READY] PartList Grid instance:', !!this.angularGridPartList);

    // Log thông tin grid để debug
    if (this.angularGridPartList) {
      const slickGrid = this.angularGridPartList.slickGrid;
      const dataView = this.angularGridPartList.dataView;

      console.log('[GRID READY] PartList - Available columns:', slickGrid?.getColumns()?.length);
      console.log('[GRID READY] PartList - Column names:', slickGrid?.getColumns()?.map((col: any) => col.name));
      console.log('[GRID READY] PartList - Column groups:', [...new Set(slickGrid?.getColumns()?.map((col: any) => col.columnGroup))]);
      console.log('[GRID READY] PartList - Grid width:', slickGrid?.getOptions()?.gridWidth);
      console.log('[GRID READY] PartList - Container width:', slickGrid?.getViewportWidth());
      console.log('[GRID READY] PartList - Tree data enabled:', slickGrid?.getOptions()?.enableTreeData);
      console.log('[GRID READY] PartList - Pre-header panel:', slickGrid?.getOptions()?.showPreHeaderPanel);
      
      // Log thông tin frozen columns
      console.log('[GRID READY] PartList - Frozen columns count:', slickGrid?.getOptions()?.frozenColumn);
      console.log('[GRID READY] PartList - Row height:', slickGrid?.getOptions()?.rowHeight);
      console.log('[GRID READY] PartList - First 6 columns:', slickGrid?.getColumns()?.slice(0, 6).map((col: any) => ({ id: col.id, name: col.name, width: col.width })));
      
      // Log viewport information
      setTimeout(() => {
        console.log('[GRID READY] PartList - Viewport left element:', !!document.querySelector('.slick-viewport-left'));
        console.log('[GRID READY] PartList - Viewport right element:', !!document.querySelector('.slick-viewport-right'));
        console.log('[GRID READY] PartList - Viewport left styles:', window.getComputedStyle(document.querySelector('.slick-viewport-left') || document.body));
        console.log('[GRID READY] PartList - Viewport right styles:', window.getComputedStyle(document.querySelector('.slick-viewport-right') || document.body));
      }, 1000);

      // Cấu hình dataView để áp dụng row coloring
      if (dataView) {
        console.log('[GRID READY] PartList - Configuring dataView for row coloring');
        const originalGetItemMetadata = dataView.getItemMetadata;
        const self = this;
        dataView.getItemMetadata = (row: number) => {
          const item = dataView.getItem(row);
          // Sử dụng getPartListRowMetadata để lấy cả cssClass cho row và columns
          const metadata = self.getPartListRowMetadata(item, row);

          // Merge với metadata gốc nếu có
          let originalMetadata = originalGetItemMetadata ? originalGetItemMetadata.call(dataView, row) : null;

          if (metadata) {
            if (!originalMetadata) {
              originalMetadata = {};
            }
            // Merge row cssClasses
            if (metadata.cssClasses) {
              originalMetadata.cssClasses = originalMetadata.cssClasses
                ? `${originalMetadata.cssClasses} ${metadata.cssClasses}`
                : metadata.cssClasses;
            }
            // Merge column metadata cho cell coloring
            if (metadata.columns) {
              originalMetadata.columns = originalMetadata.columns
                ? { ...originalMetadata.columns, ...metadata.columns }
                : metadata.columns;
            }
          }

          return originalMetadata;
        };

        // Invalidate grid để áp dụng changes
        slickGrid?.invalidate();
       

        // Thêm event handler cho checkbox selection
        slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
          this.onPartListRowSelectionChanged(e, args);
        });
       

        // Subscribe to filter changes to update calculations
        dataView.onRowsChanged.subscribe(() => {
          this.updatePartListBottomCalculations();
        });
        

        // Force footer row to be visible if not already
        slickGrid.setOptions({ showFooterRow: true });
        if (slickGrid.resizeCanvas) {
          slickGrid.resizeCanvas();
        }
       
       
      }
    }

    // Load data if already available, or schedule load if not
    if (this.dataProjectPartList.length > 0) {
      console.log('[GRID READY] PartList - Data already loaded, setting to grid');
      this.angularGridPartList.dataView.setItems(this.dataProjectPartList);
      this.updatePartListBottomCalculations();
      this.applyDistinctFiltersToPartList();
    } else if (this.versionID > 0 || this.versionPOID > 0) {
      console.log('[GRID READY] Scheduling PartList data load');
      setTimeout(() => this.loadDataProjectPartList(), 100);
    }
  }

  // Load data methods
  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.projects = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
      },
    });
  }

  loadWarehouses(): void {
    this.billExportService.getWarehouses().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.warehouses = response.data || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading warehouses:', error);
      },
    });
  }

  loadDataSolution(): void {
    console.log('[DATA LOAD] loadDataSolution called');
    if (!this.angularGridSolution) {
      console.log('[DATA LOAD] Grid not ready, retrying in 100ms');
      setTimeout(() => this.loadDataSolution(), 100);
      return;
    }
    if (this.projectId === 0) {
      console.log('[DATA LOAD] projectId is 0, skipping');
      return;
    }
    console.log('[DATA LOAD] Loading Solution data for projectId:', this.projectId);
    this.startLoading();
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response: any) => {
        console.log('[DATA LOAD] Solution data received:', response?.status);
        if (response && response.status === 1) {
          let data = response.data || [];
          console.log('[DATA LOAD] Solution raw data count:', data.length);
          // Thêm STT và id cho mỗi dòng
          data = data.map((item: any, index: number) => ({
            ...item,
            STT: index + 1,
            id: item.ID || index
          }));
          this.dataSolution = data;
          console.log('[DATA LOAD] Solution processed data:', data.length, 'rows');
          if (this.angularGridSolution) {
            console.log('[DATA LOAD] Rendering Solution grid');
            this.angularGridSolution.dataView.setItems(this.dataSolution);
            this.angularGridSolution.dataView.refresh();
            this.angularGridSolution.slickGrid.invalidate();
            this.angularGridSolution.slickGrid.render();
            console.log('[DATA LOAD] Solution grid rendered');

            // Tự động chọn dòng đầu tiên nếu có dữ liệu
            if (this.dataSolution.length > 0) {
              console.log('[DATA LOAD] Automatically selecting first solution row...');
              // Đưa về dòng đầu tiên (index 0)
              this.angularGridSolution.slickGrid.setSelectedRows([0]);

              const firstItem = this.dataSolution[0];
              if (firstItem) {
                this.projectSolutionId = firstItem.ID;
                this.selectionProjectSolutionName = firstItem.CodeSolution;
                console.log('[DATA LOAD] Automatically set projectSolutionId to:', this.projectSolutionId);

                if (!this.isPOKH) {
                  this.loadDataProjectPartListVersion();
                }
                this.loadDataProjectPartListVersionPO();
                this.resetPartlistTable();
              }
            } else {
              console.log('[DATA LOAD] No solution data found, resetting tables...');
              this.projectSolutionId = 0;
              this.resetVersionAndPartlistTables();
            }
          }
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading solution:', error);
        this.notification.error(NOTIFICATION_TITLE.error, error.message || 'Lỗi khi tải dữ liệu giải pháp');
        this.stopLoading();
      },
    });
  }

  private resetVersionAndPartlistTables(): void {
    this.dataSolutionVersion = [];
    this.dataPOVersion = [];
    this.dataProjectPartList = [];
    if (this.angularGridSolutionVersion) {
      this.angularGridSolutionVersion.dataView.setItems([]);
      this.angularGridSolutionVersion.dataView.refresh();
      this.angularGridSolutionVersion.slickGrid.invalidate();
      this.angularGridSolutionVersion.slickGrid.render();
    }
    if (this.angularGridPOVersion) {
      this.angularGridPOVersion.dataView.setItems([]);
      this.angularGridPOVersion.dataView.refresh();
      this.angularGridPOVersion.slickGrid.invalidate();
      this.angularGridPOVersion.slickGrid.render();
    }
    if (this.angularGridPartList) {
      this.angularGridPartList.dataView.setItems([]);
      this.angularGridPartList.dataView.refresh();
      this.angularGridPartList.slickGrid.invalidate();
      this.angularGridPartList.slickGrid.render();
    }
  }

  loadDataProjectPartListVersion(): void {
    if (!this.projectSolutionId || this.projectSolutionId === 0) {
      return;
    }
    if (!this.angularGridSolutionVersion) {
      setTimeout(() => this.loadDataProjectPartListVersion(), 100);
      return;
    }
    this.startLoading();
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, false).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          let data = response.data || [];
          // Thêm STT và id cho mỗi dòng
          data = data.map((item: any, index: number) => ({
            ...item,
            STT: index + 1,
            id: item.ID || index
          }));
          this.dataSolutionVersion = data;
          if (this.angularGridSolutionVersion) {
            this.angularGridSolutionVersion.dataView.setItems(this.dataSolutionVersion);
            this.angularGridSolutionVersion.dataView.refresh();
            this.angularGridSolutionVersion.slickGrid.invalidate();
            this.angularGridSolutionVersion.slickGrid.render();

            // Tự động chọn phiên bản đầu tiên nếu có dữ liệu và chưa có version nào được chọn
            if (this.dataSolutionVersion.length > 0 && this.versionID === 0 && this.versionPOID === 0) {
              console.log('[DATA LOAD] Automatically selecting first solution version...');
              this.angularGridSolutionVersion.slickGrid.setSelectedRows([0]);

              const firstItem = this.dataSolutionVersion[0];
              if (firstItem) {
                this.versionID = firstItem.ID;
                this.versionPOID = 0;
                this.type = 1;
                this.selectionCode = firstItem.Code || '';
                this.projectTypeID = firstItem.ProjectTypeID || 0;
                this.projectTypeName = firstItem.ProjectTypeName || '';
                this.CodeName = firstItem.Code || '';

                console.log('[DATA LOAD] Automatically loading PartList for versionID:', this.versionID);
                this.loadDataProjectPartList();
              }
            }
          }
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading solution version:', error);
        this.stopLoading();
      },
    });
  }

  loadDataProjectPartListVersionPO(): void {
    if (!this.projectSolutionId || this.projectSolutionId === 0) {
      return;
    }
    if (!this.angularGridPOVersion) {
      setTimeout(() => this.loadDataProjectPartListVersionPO(), 100);
      return;
    }
    this.startLoading();
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, true).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          let data = response.data || [];
          // Thêm STT và id cho mỗi dòng
          data = data.map((item: any, index: number) => ({
            ...item,
            STT: index + 1,
            id: item.ID || index
          }));
          this.dataPOVersion = data;
          if (this.angularGridPOVersion) {
            this.angularGridPOVersion.dataView.setItems(this.dataPOVersion);
            this.angularGridPOVersion.dataView.refresh();
            this.angularGridPOVersion.slickGrid.invalidate();
            this.angularGridPOVersion.slickGrid.render();

            // Tự động chọn PO version đầu tiên nếu có dữ liệu và chưa có version nào được chọn (ưu tiên Solution Version trước)
            if (this.dataPOVersion.length > 0 && this.versionID === 0 && this.versionPOID === 0) {
              console.log('[DATA LOAD] Automatically selecting first PO version...');
              this.angularGridPOVersion.slickGrid.setSelectedRows([0]);

              const firstItem = this.dataPOVersion[0];
              if (firstItem) {
                this.versionPOID = firstItem.ID;
                this.versionID = 0;
                this.type = 2;
                this.selectionCode = firstItem.Code || '';
                this.projectTypeID = firstItem.ProjectTypeID || 0;
                this.projectTypeName = firstItem.ProjectTypeName || '';
                this.projectCode = firstItem.ProjectCode || '';
                this.CodeName = firstItem.Code || '';

                console.log('[DATA LOAD] Automatically loading PartList for versionPOID:', this.versionPOID);
                this.loadDataProjectPartList();
              }
            }
          }
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading PO version:', error);
        this.stopLoading();
      },
    });
  }

  loadDataProjectPartList(): void {
    console.log('[DATA LOAD] ========== loadDataProjectPartList called ==========');
    console.log('[DATA LOAD] versionID:', this.versionID, '| versionPOID:', this.versionPOID, '| type:', this.type);

    if (!this.versionID && !this.versionPOID) {
      console.log('[DATA LOAD] No versionID or versionPOID, skipping');
      return;
    }
    if (!this.angularGridPartList) {
      console.log('[DATA LOAD] Grid not ready, retrying in 100ms');
      setTimeout(() => this.loadDataProjectPartList(), 100);
      return;
    }
    this.startLoading();

    // Lấy versionID và projectTypeID theo logic component cũ
    let selectedVersionID: number = 0;
    let projectTypeID: number = 0;

    if (this.type === 1 && !this.isPOKH) {
      // Giải pháp
      selectedVersionID = this.versionID || 0;
      // Dùng projectTypeID đã lưu trong sự kiện chọn phiên bản
      projectTypeID = this.projectTypeID || 0;
      console.log('[DATA LOAD] Solution Version - versionID:', selectedVersionID, 'projectTypeID:', projectTypeID);
    } else if (this.type === 2) {
      // PO
      selectedVersionID = this.versionPOID || 0;
      // Dùng projectTypeID đã lưu trong sự kiện chọn phiên bản
      projectTypeID = this.projectTypeID || 0;
      console.log('[DATA LOAD] PO Version - versionPOID:', selectedVersionID, 'projectTypeID:', projectTypeID);
    }

    // Payload đúng theo API spec
    const params = {
      ProjectID: this.projectId || 0,
      PartlistTypeID: projectTypeID,
      IsDeleted: this.isDeleted || 0,
      Keywords: this.keyword.trim() || '',
      IsApprovedTBP: this.isApprovedTBP || 0,
      IsApprovedPurchase: this.isApprovedPurchase || 0,
      ProjectPartListVersionID: selectedVersionID || 0,
    };
    console.log('[DATA LOAD] API params (correct format):', params);

    this.projectPartListService.getProjectPartList(params).subscribe({
      next: (response: any) => {
       
        if (response && response.status === 1) {
          const flatData = response.data || [];
         

          // For SlickGrid tree data, we use convertToTreeData to prepare items
          this.dataProjectPartList = this.convertToTreeData(flatData);
          

          // Update bottom calculations after data load
          setTimeout(() => {
            this.updatePartListBottomCalculations();
          }, 100);

          if (this.angularGridPartList) {
           
            if (params.Keywords) {
              this.angularGridPartList.filterService.clearFilters();
            }
            this.angularGridPartList.dataView.setItems(this.dataProjectPartList);
            this.angularGridPartList.dataView.refresh();
            this.angularGridPartList.slickGrid.invalidate();
            this.angularGridPartList.slickGrid.render();

            // Apply distinct filters after data is loaded
            this.applyDistinctFiltersToPartList();
          } else {
            // Dữ liệu đã được lưu vào this.dataProjectPartList, 
            // nó sẽ được load trong onPartListGridReady khi grid sẵn sàng.
          }
        } else {
          console.log('[DATA LOAD] API returned non-success status:', response?.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('[DATA LOAD] Error loading part list:', error);
        this.notification.error(NOTIFICATION_TITLE.error, error.message || 'Lỗi khi tải dữ liệu vật tư');
        this.stopLoading();
      },
    });
  }

  // Convert flat data to tree structure - Fix logic theo yêu cầu
  convertToTreeData(flatData: any[]): any[] {
    console.log('[TREE CONVERT] Converting flat data to tree structure (correct logic)');

    // ========== BƯỚC 1: Tính tổng từ node con lên node cha (giống WinForm CalculatorData) ==========
    const calculatedData = this.calculateParentTotals(flatData);

    // ========== BƯỚC 2: Convert sang format cho SlickGrid ==========
    // Logic đúng: ParentID = 0 → root, ParentID != 0 → con của ID = ParentID
    const result = (calculatedData || []).map((item: any, idx: number) => ({
      ...item,
      id: item.ID || `temp_id_${idx}_${Date.now()}`, // Đảm bảo ID duy nhất nếu ID=0
      parentId: item.ParentID === 0 ? null : item.ParentID,
      treeLevel: 0,
      IsLeaf: true
    }));

    // Tạo map để lookup nhanh
    const itemMap = new Map(result.map(item => [item.id, item]));

    // Xử lý node mồ côi (parentId không tồn tại trong tập dữ liệu) -> chuyển thành root
    result.forEach(item => {
      if (item.parentId !== null && !itemMap.has(item.parentId)) {
        console.log(`[TREE CONVERT] Found orphan node: ID=${item.id}, ParentID=${item.parentId} -> Treating as root`);
        item.parentId = null;
      }
    });

    // Tính treeLevel cho mỗi item
    const calculateLevel = (item: any, items: Map<number, any>, visited = new Set<any>()): number => {
      if (visited.has(item.id)) return 0;
      visited.add(item.id);

      if (item.parentId === null) return 0;

      const parent = items.get(item.parentId);
      if (!parent) return 0;

      return 1 + calculateLevel(parent, items, visited);
    };

    // Tái tạo map (nếu cần, thực ra itemMap vẫn ref đúng các object)

    // Tính treeLevel và IsLeaf cho tất cả items
    result.forEach(item => {
      item.treeLevel = calculateLevel(item, itemMap);
    });

    // Tính IsLeaf
    const parentIds = new Set(result.filter(item => item.parentId !== null).map(item => item.parentId));
    result.forEach(item => {
      item.IsLeaf = !parentIds.has(item.id);
    });

    console.log('[TREE CONVERT] Correct mapping completed - Total items:', result.length);
    if (result.length > 0) {
      console.log('[TREE CONVERT] Sample data with IsLeaf:');
      result.slice(0, 10).forEach((item, index) => {
        console.log(`  [${index}] ID: ${item.id}, ParentID: ${item.ParentID}, parentId: ${item.parentId}, treeLevel: ${item.treeLevel}, IsLeaf: ${item.IsLeaf}, TT: ${item.TT}, Amount: ${item.Amount}`);
      });

      // Count root vs child nodes
      const rootCount = result.filter(item => item.parentId === null).length;
      const childCount = result.filter(item => item.parentId !== null).length;
      const leafCount = result.filter(item => item.IsLeaf === true).length;
      const parentCount = result.filter(item => item.IsLeaf === false).length;
      console.log(`[TREE CONVERT] Root nodes (ParentID=0): ${rootCount}, Child nodes: ${childCount}`);
      console.log(`[TREE CONVERT] Leaf nodes: ${leafCount}, Parent nodes: ${parentCount}`);

      // Log tree levels
      const levels = [...new Set(result.map(item => item.treeLevel))].sort((a, b) => a - b);
      console.log(`[TREE CONVERT] Tree levels: ${levels.join(', ')}`);
    }

    return result;
  }

  // Tính tổng từ node con lên node cha (giống WinForm CalculatorData)
  private calculateParentTotals(flatData: any[]): any[] {
    if (!flatData || flatData.length === 0) return [];

    console.log('[CALC TOTALS] Calculating parent totals from children...');

    // Bước 1: Clone data và tạo map
    const dataMap = new Map<number, any>();
    flatData.forEach(item => {
      dataMap.set(item.ID, { ...item });
    });

    // Bước 2: Xây dựng cây tạm thời để tính toán
    const childrenMap = new Map<number, any[]>(); // parentId -> children[]
    flatData.forEach(item => {
      const parentId = item.ParentID || 0;
      if (parentId !== 0) {
        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(dataMap.get(item.ID));
      }
    });

    // Bước 3: Hàm đệ quy tính tổng từ dưới lên (bottom-up)
    const calculateNodeTotals = (nodeId: number): void => {
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) return;

      // Đệ quy tính con trước
      children.forEach(child => {
        calculateNodeTotals(child.ID);
      });

      // Tính tổng từ tất cả children
      let totalAmount = 0;
      let totalAmountQuote = 0;
      let totalAmountPurchase = 0;
      let totalPriceExchangePurchase = 0;
      let totalPriceExchangeQuote = 0;

      children.forEach(child => {
        totalAmount += Number(child.Amount) || 0;
        totalAmountQuote += Number(child.TotalPriceQuote1) || 0;
        totalAmountPurchase += Number(child.TotalPricePurchaseExport) || 0;
        totalPriceExchangePurchase += Number(child.TotalPriceExchangePurchase) || 0;
        totalPriceExchangeQuote += Number(child.TotalPriceExchangeQuote) || 0;
      });

      // Gán giá trị vào parent node
      const parentNode = dataMap.get(nodeId);
      if (parentNode) {
        parentNode.Price = 0; // Parent có children → Price = 0
        parentNode.Amount = totalAmount;
        parentNode.TotalPriceQuote1 = totalAmountQuote;
        parentNode.TotalPricePurchaseExport = totalAmountPurchase;
        parentNode.TotalPriceExchangePurchase = totalPriceExchangePurchase;
        parentNode.TotalPriceExchangeQuote = totalPriceExchangeQuote;

        // Set các flag cho parent
        parentNode.IsNewCode = false;
        parentNode.IsApprovedTBPNewCode = false;
        parentNode.IsFix = false;

        console.log(`[CALC TOTALS] Parent ID=${nodeId}: Amount=${totalAmount}, TotalPriceExchangePurchase=${totalPriceExchangePurchase}`);
      }
    };

    // Bước 4: Tính toán cho tất cả parent nodes (những node có children)
    childrenMap.forEach((_, parentId) => {
      calculateNodeTotals(parentId);
    });

    // Trả về mảng kết quả
    const result = Array.from(dataMap.values());
    console.log('[CALC TOTALS] Calculation completed for', result.length, 'items');
    return result;
  }

  // Cập nhật tính toán dòng tổng (Bottom Calculations)
  // Chỉ tính cho các node cha (level 0)
  updatePartListBottomCalculations(): void {
    if (!this.angularGridPartList || !this.angularGridPartList.slickGrid) {
      return;
    }

    const slickGrid = this.angularGridPartList.slickGrid;
    const dataView = this.angularGridPartList.dataView;
    const items = dataView.getFilteredItems();

    // Lọc ra các node cha (ParentID null hoặc 0 hoặc không tồn tại)
    const parentNodes = items.filter((item: any) => !item.ParentID || item.ParentID === 0);
   
    const totals: any = {
      TT: parentNodes.length,
      Price: 0,
      Amount: 0,
      UnitPriceQuote: 0,
      TotalPriceQuote: 0,
      TotalPriceExchangeQuote: 0,
      UnitPricePurchase: 0,
      TotalPricePurchase: 0,
      TotalPriceExchangePurchase: 0
    };

    parentNodes.forEach((node: any) => {
      totals.Price += Number(node.Price) || 0;
      totals.Amount += Number(node.Amount) || 0;
      totals.UnitPriceQuote += Number(node.UnitPriceQuote) || 0;
      totals.TotalPriceQuote += Number(node.TotalPriceQuote) || 0;
      totals.TotalPriceExchangeQuote += Number(node.TotalPriceExchangeQuote) || 0;
      totals.UnitPricePurchase += Number(node.UnitPricePurchase) || 0;
      totals.TotalPricePurchase += Number(node.TotalPricePurchase) || 0;
      totals.TotalPriceExchangePurchase += Number(node.TotalPriceExchangePurchase) || 0;
    });

    // console.log('[BOTTOM CALC] Calculated totals:', totals);

    // Cập nhật giá trị vào footer row
    const columns = slickGrid.getColumns();
 
    columns.forEach((column: any) => {
      if (!column || !column.field) {
        return;
      }
      
      const field = column.field;
      if (totals.hasOwnProperty(field)) {
        const footerCol = slickGrid.getFooterRowColumn(column.id);
        if (footerCol) {
          let value = totals[field];
          let formattedValue = '';

          if (field === 'TT') {
            formattedValue = `<b>${value.toLocaleString('vi-VN')}</b>`;
          } else {
            formattedValue = `<b>${this.formatMoney(value, 2)}</b>`;
          }

          footerCol.innerHTML = formattedValue;
          footerCol.style.textAlign = 'right';
          footerCol.style.paddingRight = '4px';
          footerCol.style.color = '#000';
          footerCol.style.backgroundColor = '#f0f0f0';
          footerCol.style.lineHeight = '30px';
        } else {
          console.log(`[BOTTOM CALC] WARNING: Could not find footer element for column: ${field} (ID: ${column.id})`);
        }
      }
    });

    // SlickGrid footer might need a render or invalidate to show correctly sometimes
    // though in some versions manual innerHTML update is enough.
    slickGrid.render();
  }

  // Apply distinct filters for multiple columns after data is loaded
  // private applyDistinctFiltersToPartList(): void {
  //   console.log('[DISTINCT FILTERS] Applying distinct filters to PartList grid...');
  //   const fieldsToFilter = [
  //     'GroupMaterial', 'ProductCode', 'Model', 'SpecialCode', 'Manufacturer', 
  //     'Unit', 'CurrencyCode', 'Quality', 'FullNameCreated', 'StatusPriceRequestText',
  //     'FullNameQuote', 'FullNamePurchase', 'StatusPurchaseRequestText', 
  //     'StatusExportText', 'FullNameExport', 'StatusTransferText', 'FullNameTransfer',
  //     'NCC', 'NCCFinal', 'StatusRequestText'
  //   ];
  //   console.log('[DISTINCT FILTERS] Fields to filter:', fieldsToFilter);
  //   this.applyDistinctFiltersToGrid(this.angularGridPartList, this.partListColumns, fieldsToFilter);
  // }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    console.log('[DISTINCT FILTERS] applyDistinctFiltersToGrid called');
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) {
      console.log('[DISTINCT FILTERS] Grid not ready, skipping');
      return;
    }

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) {
      console.log('[DISTINCT FILTERS] No data found, skipping');
      return;
    }

    console.log('[DISTINCT FILTERS] Found', data.length, 'items to process');

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      console.log(`[DISTINCT FILTERS] Processing field: ${field}`);
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      const result = Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
      console.log(`[DISTINCT FILTERS] Field ${field}: found ${result.length} unique values`);
      return result;
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) {
      console.log('[DISTINCT FILTERS] No columns found, skipping');
      return;
    }

    console.log('[DISTINCT FILTERS] Found', columns.length, 'columns to process');

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        console.log(`[DISTINCT FILTERS] Updating column: ${field}`);
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    // Update column definitions (so when grid re-renders, it keeps the collections)
    columnDefs.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();

    // Thêm tooltip cho dropdown options sau khi render
    setTimeout(() => {
      this.addTooltipsToDropdownOptions();
    }, 100);

    console.log('[DISTINCT FILTERS] Distinct filters applied successfully');
  }

  private addTooltipsToDropdownOptions(): void {
    // Tìm tất cả dropdown options và thêm title attribute
    const dropdownOptions = document.querySelectorAll('.ms-drop.bottom .ms-list li label span');
    dropdownOptions.forEach((span: Element) => {
      const text = span.textContent || '';
      if (text && text.length > 30) { // Chỉ thêm tooltip cho text dài
        (span as HTMLElement).setAttribute('title', text);
      }
    });
  }

  startLoading(): void {
    this.loadingCounter++;
    if (this.loadingCounter === 1) {
      this.isLoading = true;
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    this.loadingTimeout = setTimeout(() => {
      if (this.loadingCounter > 0) {
        this.isLoading = false;
        this.loadingCounter = 0;
      }
    }, 10000);
  }

  stopLoading(): void {
    this.loadingCounter--;
    if (this.loadingCounter <= 0) {
      this.loadingCounter = 0;
      this.isLoading = false;
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
    }
  }

  // Row selection handlers
  onSolutionRowSelectionChanged(event: any): void {
    console.log('[ROW SELECT] Solution Grid selection changed');
    const selectedRows = event.detail.args.rows || [];
    console.log('[ROW SELECT] Selected row indices:', selectedRows);
    if (selectedRows.length > 0) {
      const rowIndex = selectedRows[0];
      const data = this.angularGridSolution?.dataView?.getItem(rowIndex);
      console.log('[ROW SELECT] Selected data:', data);
      if (data) {
        this.projectSolutionId = data.ID;
        this.selectionProjectSolutionName = data.CodeSolution;
        console.log('[ROW SELECT] projectSolutionId set to:', this.projectSolutionId);
        // Load phiên bản giải pháp và PO
        if (!this.isPOKH) {
          console.log('[ROW SELECT] Loading Solution Version table');
          this.loadDataProjectPartListVersion();
        }
        console.log('[ROW SELECT] Loading PO Version table');
        this.loadDataProjectPartListVersionPO();
        // Reset bảng partlist vì chưa chọn phiên bản nào
        this.resetPartlistTable();
      } else {
        console.error('[ROW SELECT] Could not get data for row index:', rowIndex);
      }
    } else {
      // Row bị bỏ chọn - kiểm tra xem còn row nào được chọn không
      const allSelectedRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
      if (allSelectedRows.length === 0) {
        // Không còn row nào được chọn - reset tất cả
        this.projectSolutionId = 0;
        this.selectionProjectSolutionName = '';
        this.resetVersionAndPartlistTables();
      }
    }
  }

  onSolutionVersionRowSelectionChanged(event: any): void {
    // Skip if we're clearing selection to avoid recursive calls
    if (this.clearingSelection) {
      console.log('[ROW SELECT] Skipping Solution Version event (clearing selection)');
      return;
    }

    console.log('[ROW SELECT] Solution Version Grid selection changed');
    const selectedRows = event.detail.args.rows || [];
    console.log('[ROW SELECT] Selected row indices:', selectedRows);
    if (selectedRows.length > 0) {
      const rowIndex = selectedRows[0];
      const data = this.angularGridSolutionVersion?.dataView?.getItem(rowIndex);
      console.log('[ROW SELECT] Selected data:', data);
      if (data) {
        this.versionID = data.ID;
        this.versionPOID = 0; // Reset PO version
        this.type = 1;
        // Cập nhật các biến cho tiêu đề - giống component cũ
        this.selectionCode = data.Code || '';
        this.projectTypeID = data.ProjectTypeID || 0;
        this.projectTypeName = data.ProjectTypeName || '';
        this.CodeName = data.Code || '';
        console.log('[ROW SELECT] versionID set to:', this.versionID, '| type:', this.type);
        console.log('[ROW SELECT] projectTypeName:', this.projectTypeName, '| CodeName:', this.CodeName);

        // Bỏ chọn các dòng trong bảng PO version - nhưng tránh trigger event
        if (this.angularGridPOVersion?.slickGrid) {
          console.log('[ROW SELECT] Clearing PO Version selection to avoid conflicts');
          this.clearingSelection = true;
          this.angularGridPOVersion.slickGrid.setSelectedRows([]);
          this.clearingSelection = false;
        }

        console.log('[ROW SELECT] Loading PartList table');
        this.loadDataProjectPartList();
      } else {
        console.error('[ROW SELECT] Could not get data for row index:', rowIndex);
      }
    } else {
      // Kiểm tra xem còn row nào được chọn không
      const allSelectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (allSelectedRows.length === 0) {
        console.log('[ROW SELECT] No rows selected in Solution Version, resetting');
        this.versionID = 0;
        this.type = 0;
        this.CodeName = '';
        this.projectTypeName = '';
        this.projectTypeID = 0; // Reset projectTypeID
        this.resetPartlistTable();
      }
    }
  }

  onPOVersionRowSelectionChanged(event: any): void {
    // Skip if we're clearing selection to avoid recursive calls
    if (this.clearingSelection) {
      console.log('[ROW SELECT] Skipping PO Version event (clearing selection)');
      return;
    }

    console.log('[ROW SELECT] PO Version Grid selection changed');
    const selectedRows = event.detail.args.rows || [];
    console.log('[ROW SELECT] Selected row indices:', selectedRows);
    if (selectedRows.length > 0) {
      const rowIndex = selectedRows[0];
      const data = this.angularGridPOVersion?.dataView?.getItem(rowIndex);
      console.log('[ROW SELECT] Selected data:', data);
      if (data) {
        this.versionPOID = data.ID;
        this.versionID = 0; // Reset solution version
        this.type = 2;
        // Cập nhật các biến cho tiêu đề - giống component cũ
        this.selectionCode = data.Code || '';
        this.projectTypeID = data.ProjectTypeID || 0;
        this.projectTypeName = data.ProjectTypeName || '';
        this.projectCode = data.ProjectCode || '';
        this.CodeName = data.Code || '';
        console.log('[ROW SELECT] versionPOID set to:', this.versionPOID, '| type:', this.type);
        console.log('[ROW SELECT] projectTypeName:', this.projectTypeName, '| CodeName:', this.CodeName);

        // Bỏ chọn các dòng trong bảng Solution version - nhưng tránh trigger event
        if (this.angularGridSolutionVersion?.slickGrid) {
          console.log('[ROW SELECT] Clearing Solution Version selection to avoid conflicts');
          this.clearingSelection = true;
          this.angularGridSolutionVersion.slickGrid.setSelectedRows([]);
          this.clearingSelection = false;
        }

        console.log('[ROW SELECT] Loading PartList table');
        this.loadDataProjectPartList();
      } else {
        console.error('[ROW SELECT] Could not get data for row index:', rowIndex);
      }
    } else {
      // Kiểm tra xem còn row nào được chọn không
      const allSelectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (allSelectedRows.length === 0) {
        console.log('[ROW SELECT] No rows selected in PO Version, resetting');
        this.versionPOID = 0;
        this.type = 0;
        this.CodeName = '';
        this.projectTypeName = '';
        this.projectTypeID = 0; // Reset projectTypeID
        this.resetPartlistTable();
      }
    }
  }

  private resetPartlistTable(): void {
    this.dataProjectPartList = [];
    this.versionID = 0;
    this.versionPOID = 0;
    this.type = 0;
    this.projectTypeID = 0; // Reset projectTypeID
    if (this.angularGridPartList) {
      this.angularGridPartList.dataView.setItems([]);
      this.angularGridPartList.dataView.refresh();
      this.angularGridPartList.slickGrid.invalidate();
      this.angularGridPartList.slickGrid.render();
    }
  }

  // Mở modal giải pháp
  openProjectSolutionDetail(isEdit: boolean): void {
    console.log('[SOLUTION DETAIL] isEdit:', isEdit, '| projectId:', this.projectId);

    // Kiểm tra đã chọn dự án chưa
    if (!this.projectId || this.projectId === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dự án trước!');
      return;
    }

    let selectedData: any = null;
    if (isEdit) {
      // Ưu tiên lấy dòng đang focus, nếu không có thì lấy selected rows
      // Lấy dòng đang focus (active cell)
      const activeCell = this.angularGridSolution?.slickGrid?.getActiveCell();
      console.log('[SOLUTION DETAIL] Active cell:', activeCell);

      if (activeCell && activeCell.row >= 0) {
        selectedData = this.angularGridSolution?.dataView?.getItem(activeCell.row);
        console.log('[SOLUTION DETAIL] Lấy từ active cell row:', activeCell.row, selectedData);
      } else {
        // Nếu không có active cell, thử lấy từ selected rows
        const selectedRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length > 0) {
          selectedData = this.angularGridSolution?.dataView?.getItem(selectedRows[0]);
          console.log('[SOLUTION DETAIL] Lấy từ selected rows:', selectedData);
        }
      }

      if (!selectedData) {
        this.notification.warning('Thông báo', 'Vui lòng focus vào dòng giải pháp để sửa!');
        return;
      }

      console.log('[SOLUTION DETAIL] selectedData:', selectedData);
    }

    const modalRef = this.ngbModal.open(ProjectSolutionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });

    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.isEdit = isEdit;

    if (isEdit && selectedData) {
      modalRef.componentInstance.solutionId = selectedData.ID;
      modalRef.componentInstance.solutionData = selectedData;
    }

    modalRef.result.then((result: any) => {
      if (result && result.success) {
        this.loadDataSolution();
      }
    }).catch(() => { });
  }

  openProjectSolutionVersionDetail(typenumber: number, isEdit: boolean): void {
    console.log('[VERSION DETAIL] typenumber:', typenumber, '| isEdit:', isEdit);
    console.log('[VERSION DETAIL] projectSolutionId:', this.projectSolutionId);

    // Kiểm tra đã chọn giải pháp chưa
    if (!this.projectSolutionId || this.projectSolutionId === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp trước!');
      return;
    }

    let selectedData: any = null;
    if (isEdit) {
      if (typenumber === 1) {
        // Solution Version grid
        const activeCell = this.angularGridSolutionVersion?.slickGrid?.getActiveCell();
        if (activeCell && activeCell.row >= 0) {
          selectedData = this.angularGridSolutionVersion?.dataView?.getItem(activeCell.row);
        } else {
          const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
          if (selectedRows.length > 0) {
            selectedData = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
          }
        }
      } else {
        // PO Version grid
        const activeCell = this.angularGridPOVersion?.slickGrid?.getActiveCell();
        if (activeCell && activeCell.row >= 0) {
          selectedData = this.angularGridPOVersion?.dataView?.getItem(activeCell.row);
        } else {
          const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
          if (selectedRows.length > 0) {
            selectedData = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
          }
        }
      }

      if (!selectedData) {
        const gridName = typenumber === 1 ? 'phiên bản giải pháp' : 'phiên bản PO';
        this.notification.warning('Thông báo', `Vui lòng focus vào dòng ${gridName} để sửa!`);
        return;
      }
    }

    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });

    modalRef.componentInstance.ProjectID = this.projectId;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.typeNumber = typenumber;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.typecheck = 1; // 1 for versions in PartList (matching old component logic)
    modalRef.componentInstance.SolutionTypeID = typenumber; // 1: giải pháp, 2: PO

    // Truyền toàn bộ dataset để tính STT
    modalRef.componentInstance.versionData = typenumber === 1 ? this.dataSolutionVersion : this.dataPOVersion;

    if (isEdit && selectedData) {
      modalRef.componentInstance.ProjectworkerID = selectedData.ID;
      modalRef.componentInstance.VersionCode = selectedData.Code;
      modalRef.componentInstance.ProjectTypeID = selectedData.ProjectTypeID;
      modalRef.componentInstance.ProjectTypeName = selectedData.ProjectTypeName;
      modalRef.componentInstance.STT = typenumber === 1 ? selectedData.STT : selectedData.TT;
      modalRef.componentInstance.IsActive = selectedData.IsActive;
      modalRef.componentInstance.DescriptionVersion = selectedData.DescriptionVersion;

      console.log('[VERSION DETAIL] Passing selectedData fields to modal:', selectedData);
    }

    modalRef.result.then((result: any) => {
      if (result && result.success) {
        if (typenumber === 1) {
          this.loadDataProjectPartListVersion();
        } else {
          this.loadDataProjectPartListVersionPO();
        }
      }
    }).catch(() => { });
  }

  openProjectPartlistDetail(isEdit: boolean): void {
    if (this.type === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản trước!');
      return;
    }
    let selectedVersionID = this.type === 1 ? this.versionID : this.versionPOID;
    if (!selectedVersionID || selectedVersionID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản trước!');
      return;
    }
    if (isEdit) {
      // Ưu tiên lấy dòng đang focus, nếu không có thì lấy selected rows
      let item: any = null;

      // Lấy dòng đang focus (active cell)
      const activeCell = this.angularGridPartList?.slickGrid?.getActiveCell();
      console.log('[EDIT] Active cell:', activeCell);

      if (activeCell && activeCell.row >= 0) {
        item = this.angularGridPartList?.dataView?.getItem(activeCell.row);
        console.log('[EDIT] Lấy từ active cell row:', activeCell.row, item);
      } else {
        // Nếu không có active cell, thử lấy từ selected rows
        const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length > 0) {
          item = this.angularGridPartList?.dataView?.getItem(selectedRows[0]);
          console.log('[EDIT] Lấy từ selected rows:', item);
        }
      }

      if (!item) {
        this.notification.warning('Thông báo', 'Vui lòng focus vào dòng vật tư để sửa!');
        return;
      }

      // Kiểm tra các điều kiện không cho phép sửa
      const currentUser = this.appUserService.currentUser;
      const isAdmin = currentUser?.IsAdmin || false;
   
        // 1. Kiểm tra IsDeleted
      if (item.IsDeleted === true || item.IsDeleted === 1) {
        this.notification.warning('Thông báo', 'Vật tư đã bị xóa, không thể sửa!');
        return;
      }

      // 2. Kiểm tra IsApprovedTBP
      if (item.IsApprovedTBP === true || item.IsApprovedTBP === 1) {
        this.notification.warning('Thông báo', 'Vật tư đã được TBP duyệt, không thể sửa!');
        return;
      }

      // 3. Kiểm tra IsApprovedTBPNewCode (cho hàng mới)
      if (item.IsNewCode === true || item.IsNewCode === 1) {
        if (item.IsApprovedTBPNewCode === true || item.IsApprovedTBPNewCode === 1) {
          this.notification.warning('Thông báo', 'Hàng mới đã được TBP duyệt, không thể sửa!');
          return;
        }
      }

      // 4. Kiểm tra StatusPriceRequest (đã yêu cầu báo giá)
      if (item.StatusPriceRequest && item.StatusPriceRequest > 0) {
        this.notification.warning('Thông báo', 'Vật tư đã được yêu cầu báo giá, không thể sửa!');
        return;
      }

      // 5. Kiểm tra IsApprovedPurchase (đã yêu cầu mua hàng)
      if (item.IsApprovedPurchase === true || item.IsApprovedPurchase === 1) {
        this.notification.warning('Thông báo', 'Vật tư đã được yêu cầu mua hàng, không thể sửa!');
        return;
      }

      // 6. Kiểm tra quyền người tạo (nếu không phải admin)
      if (!isAdmin && item.EmployeeIDCreated && item.EmployeeIDCreated !== currentUser?.EmployeeID) {
        this.notification.warning('Thông báo', 'Bạn không thể sửa vật tư do người khác tạo!');
        return;
      }
      
      

      // // 7. Kiểm tra phiên bản có đang active không
      // if (this.type === 1) {
      //   // Solution version
      //   const selectedVersion = this.dataSolutionVersion.find(v => v.ID === this.versionID);
      //   if (!selectedVersion || selectedVersion.StatusVersion !== 1 || !selectedVersion.IsActive) {
      //     this.notification.warning('Thông báo', 'Phiên bản không ở trạng thái hoạt động, không thể sửa vật tư!');
      //     return;
      //   }
      // } else if (this.type === 2) {
      //   // PO version
      //   const selectedVersion = this.dataPOVersion.find(v => v.ID === this.versionPOID);
      //   if (!selectedVersion || selectedVersion.StatusVersion !== 1 || !selectedVersion.IsActive) {
      //     this.notification.warning('Thông báo', 'Phiên bản không ở trạng thái hoạt động, không thể sửa vật tư!');
      //     return;
      //   }
      // }
    }
    const modalRef = this.ngbModal.open(ProjectPartlistDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.projectCodex;
    modalRef.componentInstance.type = this.type;
    modalRef.componentInstance.versionPOID = selectedVersionID;
    modalRef.componentInstance.CodeName = this.CodeName;
    modalRef.componentInstance.projectTypeName = this.projectTypeName;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId || 0;

    // Nếu là edit mode, map dữ liệu từ row đang focus vào selectedData
    if (isEdit) {
      let partListData: any = null;

      // Ưu tiên lấy từ active cell (dòng đang focus)
      const activeCell = this.angularGridPartList?.slickGrid?.getActiveCell();
      if (activeCell && activeCell.row >= 0) {
        partListData = this.angularGridPartList?.dataView?.getItem(activeCell.row);
        console.log('[EDIT] Modal data từ active cell row:', activeCell.row, partListData);
      } else if (this.lastClickedPartListRow) {
        // Fallback: lấy từ last clicked row
        partListData = this.lastClickedPartListRow;
        console.log('[EDIT] Modal data từ lastClickedPartListRow:', partListData);
      } else {
        // Fallback cuối: lấy từ selected rows
        const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length > 0) {
          partListData = this.angularGridPartList?.dataView?.getItem(selectedRows[0]);
          console.log('[EDIT] Modal data từ selectedRows:', partListData);
        }
      }

      if (partListData) {
        // Map dữ liệu giống component cũ
        modalRef.componentInstance.selectedData = [{
          ProductID: partListData.ProductID || 0,
          ProductCode: partListData.ProductCode || '',
          ProductName: partListData.GroupMaterial || '',
          GuestCode: partListData.ProductCode || '',
          Maker: partListData.Manufacturer || '',
          Qty: partListData.QtyFull || 0,
          Unit: partListData.Unit || '',
          TT: partListData.TT || '',
          ProjectPartListID: partListData.ID || 0,
          ID: partListData.ID || 0,
          STT: partListData.STT || 0,
          ParentID: partListData.ParentID || 0,
          Note: partListData.Note || '',
          EmployeeID: partListData.EmployeeID || 0,
          SpecialCode: partListData.SpecialCode || '',
          IsDeleted: partListData.IsDeleted || false,
          Model: partListData.Model || '',
          QtyMin: partListData.QtyMin || 0,
          EmployeeIDRequestPrice: partListData.EmployeeIDRequestPrice || null,
          IsProblem: partListData.IsProblem || false,
          ReasonProblem: partListData.ReasonProblem || '',
          SupplierSaleID: partListData.SupplierSaleID || null,
          NCC: partListData.NCC || '',
          Price: partListData.Price || 0,
          Amount: partListData.Amount || 0,
          UnitMoney: partListData.UnitMoney || '',
          LeadTime: partListData.LeadTime || "",
          OrderCode: partListData.OrderCode || '',
          NCCFinal: partListData.NCCFinal || '',
          PriceOrder: partListData.PriceOrder || 0,
          TotalPriceOrder: partListData.TotalPriceOrder || 0,
          CurrencyExchange: partListData.CurrencyExchange || '',
          ExpectedDate: partListData.ExpectedDate || null,
          ActualDate: partListData.ActualDate || null,
          ExpectedReturnDate: partListData.ExpectedReturnDate || null,
          RequestDate: partListData.RequestDate || null,
          Status: partListData.Status || 0,
          Quality: partListData.Quality || '',
          IsApprovedTBP: partListData.IsApprovedTBP || false,
          IsApprovedTBPNewCode: partListData.IsApprovedTBPNewCode || false,
          IsCheckPrice: partListData.IsCheckPrice === true || partListData.IsCheckPrice === 1 || partListData.IsCheckPrice === '1',
          StatusRequest: partListData.StatusRequest ?? null,
          StatusPriceRequest: partListData.StatusPriceRequest ?? null,
          IsApprovedPurchase: partListData.IsApprovedPurchase ?? null,
          IsRequestPurchase: partListData.IsRequestPurchase ?? null,
          IsApprovedWarehouseExport: partListData.IsApprovedWarehouseExport ?? null,
        }];
        console.log('[EDIT] Modal selectedData:', modalRef.componentInstance.selectedData);
      }
    }
    modalRef.result.then((result: any) => {
      if (result && result.success) {
        this.loadDataProjectPartList();
      }
    }).catch(() => { });
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%';
  }

  toggleLeftPanel(): void {
    if (this.sizeLeftPanel === '0') {
      this.sizeLeftPanel = '25%';
      this.sizeRightPanel = '75%';
    } else {
      this.closeLeftPanel();
    }
  }

  // Xử lý khi projectId thay đổi
  onProjectIdChange(projectId: number | null): void {
    this.projectId = projectId || 0;
    this.versionID = 0;
    this.versionPOID = 0;
    this.type = 0;
    this.selectionCode = '';
    this.projectTypeID = 0;
    this.projectTypeName = '';
    this.projectCode = '';
    this.CodeName = '';
    if (this.projectId > 0) {
      const selectedProject = this.projects.find(p => p.ID === this.projectId);
      if (selectedProject) {
        this.projectCodex = selectedProject.ProjectCode || '';
      }
      this.loadDataSolution();
    } else {
      this.projectCodex = '';
      this.dataSolution = [];
      this.dataSolutionVersion = [];
      this.dataPOVersion = [];
      this.dataProjectPartList = [];
      this.projectSolutionId = 0;
    }
  }

  searchDataProjectWorker(): void {
    console.log('[SEARCH] searchDataProjectWorker called');
    console.log('[SEARCH] versionID:', this.versionID, '| versionPOID:', this.versionPOID, '| type:', this.type);
    console.log('[SEARCH] projectId:', this.projectId, '| keyword:', this.keyword);

    // Kiểm tra đã chọn phiên bản chưa
    if (!this.versionID && !this.versionPOID) {
      console.log('[SEARCH] No version selected, showing warning');
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản trước khi tìm kiếm!');
      return;
    }

    this.loadDataProjectPartList();
  }

  clearSavedSelectedRows(): void {
    this.savedSelectedRowIds.clear();
    this.previousSelectedRows.clear();
    this.independentlyDeselectedNodes.clear();
  }

  // Duyệt/Hủy duyệt TBP
  updateApprove(action: number): void {
    const isApproved = action === 1;
    const isApprovedText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${isApprovedText}`);
      return;
    }
    const projectpartlistIDs: number[] = [];
    for (let row of selectedRows) {
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư!');
        return;
      }
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return;
      }
      if (!isApproved && row.IsApprovedPurchase == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT || row.ID}] đã được Yêu cầu mua!`);
        return;
      }
      projectpartlistIDs.push(row.ID);
    }
    this.projectPartListService.approveProjectPartList(projectpartlistIDs, isApproved).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', `${isApprovedText} thành công!`);
          this.loadDataProjectPartList();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật trạng thái duyệt');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể cập nhật trạng thái duyệt');
      }
    });
  }

  // Duyệt/Hủy duyệt tích xanh
  approveIsFix(isFix: boolean): void {
    const actionText = isFix ? 'Duyệt' : 'Hủy duyệt';
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${actionText} tích xanh`);
      return;
    }
    const validRows = selectedRows.filter((row: any) => {
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${actionText} vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return false;
      }
      return true;
    });
    if (validRows.length === 0) return;
    const requestItems = validRows.map((row: any) => ({
      ID: row.ID || 0,
      ProjectID: row.ProjectID || 0,
      ProjectTypeID: row.ProjectTypeID || 0,
      ProjectPartListVersionID: row.ProjectPartListVersionID || 0,
      TT: row.TT || '',
      ProductCode: row.ProductCode || '',
      GroupMaterial: row.GroupMaterial || '',
      Manufacturer: row.Manufacturer || '',
      Unit: row.Unit || '',
      IsLeaf: row.IsLeaf,
      IsNewCode: row.IsNewCode || false,
      IsDeleted: row.IsDeleted || false
    }));
    this.modal.confirm({
      nzTitle: `Xác nhận ${actionText} tích xanh`,
      nzContent: `Bạn có chắc chắn muốn ${actionText} tích xanh cho ${requestItems.length} vật tư?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: !isFix,
      nzOnOk: () => {
        this.projectPartListService.approveIsFix(requestItems, isFix).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', `${actionText} tích xanh thành công!`);
              this.loadDataProjectPartList();
            } else {
              this.notification.warning('Thông báo', response.message || 'Không thể cập nhật trạng thái tích xanh');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể cập nhật trạng thái tích xanh');
          }
        });
      }
    });
  }

  // Duyệt/Hủy duyệt mã mới
  approveNewCode(isApproved: boolean): void {
    const isApprovedText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${isApprovedText} mã mới`);
      return;
    }
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      if (!row.ID || row.ID <= 0) continue;
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT}] đã bị xóa!`);
        return;
      }
      const isLeaf = row.IsLeaf === true;
      if (!isLeaf) continue;
      if (row.IsNewCode == false && isApproved) continue;
      if (!row.ProductCode || row.ProductCode.trim() === '') {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.ID}] không có mã thiết bị!`);
        return;
      }
      requestItems.push({
        ID: row.ID || 0,
        TT: row.TT || row.ID || '',
        ProductCode: row.ProductCode || '',
        GroupMaterial: row.GroupMaterial || '',
        Manufacturer: row.Manufacturer || '',
        Unit: row.Unit || '',
        IsNewCode: row.IsNewCode || false,
        IsLeaf: isLeaf
      });
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', `Không có vật tư hợp lệ để ${isApprovedText} mã mới`);
      return;
    }
    this.modal.confirm({
      nzTitle: `Xác nhận ${isApprovedText} mã mới`,
      nzContent: `Bạn có chắc chắn muốn ${isApprovedText} mã mới cho ${requestItems.length} vật tư?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: !isApproved,
      nzOnOk: () => {
        this.projectPartListService.approveNewCode(requestItems, isApproved).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', `${isApprovedText} mã mới thành công!`);
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể cập nhật trạng thái duyệt mã mới');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể cập nhật trạng thái duyệt mã mới');
          }
        });
      }
    });
  }

  // Duyệt PO
  ApprovePO(isApproved: boolean): void {
    const actionText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    const selectedRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp!');
      return;
    }
    const selectedData = this.angularGridSolution?.dataView?.getItem(selectedRows[0]);
    if (!selectedData || !selectedData.ID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp!');
      return;
    }
    this.modal.confirm({
      nzTitle: `Xác nhận ${actionText} PO`,
      nzContent: `Bạn có chắc chắn muốn ${actionText} PO cho giải pháp [${selectedData.CodeSolution}]?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: !isApproved,
      nzOnOk: () => {
        // TODO: Add approvePO method to ProjectWorkerService if needed
        this.notification.info('Thông báo', 'Chức năng đang được phát triển');
      }
    });
  }

  // Yêu cầu báo giá
  requestPriceQuote(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần yêu cầu báo giá');
      return;
    }

    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    if (this.type == 1) {
      const versionRows = this.angularGridSolutionVersion?.slickGrid.getSelectedRows().map((rowIdx: number) =>
        this.angularGridSolutionVersion.dataView.getItem(rowIdx)
      ) || [];
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để yêu cầu báo giá');
        return;
      }
      selectedVersion = versionRows[0];
      if (selectedVersion['StatusVersion'] == 2) {
        this.notification.warning('Thông báo', `Phiên bản [${selectedVersion.Code}] đã bị PO. Bạn không thể yêu cầu báo giá!`);
        return;
      }
    } else {
      const versionRows = this.angularGridPOVersion?.slickGrid.getSelectedRows().map((rowIdx: number) =>
        this.angularGridPOVersion.dataView.getItem(rowIdx)
      ) || [];
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để yêu cầu báo giá');
        return;
      }
      selectedVersion = versionRows[0];
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
        return;
      }
    }

    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể yêu cầu báo giá vì vật tư thứ tự [${row.TT}] đã bị xóa!`);
        return;
      }

      const isLeaf = row.IsLeaf === true;
      // Validation chỉ áp dụng cho node lá
      if (isLeaf) {
        if (row.IsNewCode == true && (row.IsApprovedTBPNewCode ?? false) == false) {
          this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] chưa được TBP duyệt mới.\nVui lòng kiểm tra lại!`);
          return;
        }

        // Kiểm tra đã yêu cầu báo giá chưa (trong vòng 3 tháng)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        debugger
        const datePriceQuote = row.DatePriceQuote ? new Date(row.DatePriceQuote) : null;
        if ((row.StatusPriceRequest > 0 && (row.StatusPriceRequestText != "")) && (datePriceQuote == null || datePriceQuote > threeMonthsAgo)) {
          this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] đã được yêu cầu báo giá.\nVui lòng kiểm tra lại!`);
          return;
        }

        // Validate các trường bắt buộc
        if (!row.ProductCode || row.ProductCode.trim() === '') {
          this.notification.warning('Thông báo', `[Mã thiết bị] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.GroupMaterial || row.GroupMaterial.trim() === '') {
          this.notification.warning('Thông báo', `[Tên vật tư] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.Manufacturer || row.Manufacturer.trim() === '') {
          this.notification.warning('Thông báo', `[Hãng SX] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.QtyMin || row.QtyMin <= 0) {
          this.notification.warning('Thông báo', `[Số lượng / 1 máy] có số thứ tự [${row.TT}] phải lớn hơn 0!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.QtyFull || row.QtyFull <= 0) {
          this.notification.warning('Thông báo', `[Số lượng tổng] có số thứ tự [${row.TT}] phải lớn hơn 0!\nVui lòng kiểm tra lại!`);
          return;
        }
      }

      requestItems.push({
        ID: row.ID,
        STT: row.STT,
        ProductCode: row.ProductCode,
        GroupMaterial: row.GroupMaterial,
        Manufacturer: row.Manufacturer,
        QtyMin: row.QtyMin,
        QtyFull: row.QtyFull,
        ParentID: row.ParentID,
        IsNewCode: row.IsNewCode,
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode ?? false,
        StatusPriceRequest: row.StatusPriceRequest,
        IsLeaf: isLeaf,
        DatePriceQuote: row.DatePriceQuote || null,
        DeadlinePriceRequest: null
      });
    }

    this.deadlinePriceRequest = null;
    this.modal.confirm({
      nzTitle: 'Yêu cầu báo giá',
      nzContent: this.priceRequestModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzWidth: 500,
      nzOnOk: () => {
        if (!this.deadlinePriceRequest) {
          this.notification.warning('Thông báo', 'Vui lòng chọn deadline báo giá!');
          return false;
        }

        const deadlineFixed = new Date(this.deadlinePriceRequest);
        deadlineFixed.setHours(12, 0, 0, 0);
        const deadlineISO = deadlineFixed.toISOString();

        requestItems.forEach(item => {
          item.DeadlinePriceRequest = deadlineISO;
        });

        this.projectPartListService.requestPrice(requestItems).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Yêu cầu báo giá thành công!');
              this.loadDataProjectPartList();
              this.deadlinePriceRequest = null;
            } else if (response.status === 2) {
              this.notification.warning('Thông báo', response.message || 'Không thể yêu cầu báo giá');
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể yêu cầu báo giá');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể yêu cầu báo giá');
          }
        });
        return true;
      }
    });
  }

  // Hủy yêu cầu báo giá
  cancelPriceRequest(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần hủy yêu cầu báo giá');
      return;
    }

    // Lấy thông tin user hiện tại
    const currentUser = this.appUserService.currentUser;
    if (!currentUser) {
      this.notification.error('Lỗi', 'Không thể lấy thông tin người dùng');
      return;
    }

    // Validate và chuẩn bị payload
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      if (!row.ID || row.ID <= 0) {
        continue;
      }

      const isLeaf = row.IsLeaf === true;
      // Bỏ qua node cha - chỉ xử lý node lá
      if (!isLeaf) {
        continue;
      }

      // Kiểm tra đã yêu cầu báo giá chưa
      if (!row.StatusPriceRequest || row.StatusPriceRequest <= 0) {
        this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] chưa được yêu cầu báo giá.\nKhông thể hủy yêu cầu báo giá!`);
        return;
      }

      // Kiểm tra phòng mua đã check giá chưa
      if (row.IsCheckPrice === true) {
        this.notification.warning('Thông báo', `Phòng mua đã check giá sản phẩm Stt [${row.TT}].\nBạn không thể hủy y/c báo giá`);
        return;
      }

      // Kiểm tra quyền: chỉ người tạo yêu cầu hoặc admin mới được hủy
      if (row.EmployeeIDRequestPrice &&
        row.EmployeeIDRequestPrice !== currentUser.EmployeeID &&
        !currentUser.IsAdmin) {
        this.notification.warning('Thông báo', `Bạn không thể hủy yêu cầu báo giá của người khác!`);
        return;
      }

      requestItems.push({
        ID: row.ID,
        STT: row.STT,
        IsLeaf: isLeaf,
        IsCheckPrice: row.IsCheckPrice || false,
        EmployeeIDRequestPrice: row.EmployeeIDRequestPrice || null
      });
    }

    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để hủy yêu cầu báo giá.\nVui lòng chọn các vật tư đã được yêu cầu báo giá');
      return;
    }

    const sttList = requestItems.map((item: any) => item.STT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy yêu cầu báo giá',
      nzContent: `Bạn có chắc chắn muốn hủy yêu cầu báo giá cho ${requestItems.length} vật tư (Stt: ${sttList})?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectPartListService.cancelPriceRequest(requestItems).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Hủy yêu cầu báo giá thành công!');
              this.loadDataProjectPartList();
            } else if (response.status === 2) {
              this.notification.warning('Thông báo', response.message || 'Không thể hủy yêu cầu báo giá');
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể hủy yêu cầu báo giá');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể hủy yêu cầu báo giá');
          }
        });
      }
    });
  }

  // Yêu cầu mua hàng
  requestPurchase(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần yêu cầu mua hàng');
      return;
    }

    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    let projectTypeID: number = 0;
    if (this.type == 1) {
      const versionRows = this.angularGridSolutionVersion?.slickGrid.getSelectedRows().map((rowIdx: number) =>
        this.angularGridSolutionVersion.dataView.getItem(rowIdx)
      ) || [];
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
        return;
      }
    } else {
      const versionRows = this.angularGridPOVersion?.slickGrid.getSelectedRows().map((rowIdx: number) =>
        this.angularGridPOVersion.dataView.getItem(rowIdx)
      ) || [];
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
        return;
      }
    }

    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] đã bị xóa!`);
        return;
      }

      const isLeaf = row.IsLeaf === true;
      // Chỉ xử lý node lá
      if (!isLeaf) {
        continue;
      }

      // Kiểm tra đã được TBP duyệt chưa
      if ((row.IsApprovedTBP ?? false) == false) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được TBP duyệt!`);
        return;
      }

      // Kiểm tra đã được TBP duyệt mới chưa (nếu là mã mới)
      if (row.IsNewCode == true && row.IsApprovedTBPNewCode == false) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được TBP duyệt mới!`);
        return;
      }

      // Kiểm tra đã được yêu cầu mua chưa
      if (row.IsApprovedPurchase == true) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] đã được Y/c mua.\nVui lòng kiểm tra lại!`);
        return;
      }

      // Kiểm tra đã được báo giá chưa (trong vòng 3 tháng)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const datePriceQuote = row.DatePriceQuote ? new Date(row.DatePriceQuote) : null;
      if (datePriceQuote == null) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được báo giá!\nVui lòng kiểm tra lại!`);
        return;
      }
      if (datePriceQuote < threeMonthsAgo) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] đã được báo giá từ hơn 3 tháng trước!\nVui lòng yêu cầu báo giá lại!`);
        return;
      }

      requestItems.push({
        ID: row.ID,
        STT: row.STT || 0,
        TT: row.TT || 0,
        IsLeaf: isLeaf,
        IsDeleted: row.IsDeleted || false,
        IsApprovedTBP: row.IsApprovedTBP || false,
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode || false,
        IsNewCode: row.IsNewCode || false,
        IsApprovedPurchase: row.IsApprovedPurchase || false,
        DeadlinePur: null,
        SupplierSaleQuoteID: row.SupplierSaleQuoteID || 0,
        UnitPriceQuote: row.UnitPriceQuote || 0,
        TotalPriceOrder: row.TotalPriceOrder || 0,
        QtyFull: row.QtyFull || 0,
        LeadTime: row.LeadTime || "",
        UnitMoney: row.UnitMoney || "",
        DatePriceQuote: row.DatePriceQuote || null
      });
    }

    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để yêu cầu mua hàng.\nVui lòng chọn các vật tư đã được TBP duyệt');
      return;
    }

    this.deadlinePurchaseRequest = null;
    this.modal.confirm({
      nzTitle: 'Yêu cầu mua hàng',
      nzContent: this.purchaseRequestModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzWidth: 500,
      nzOnOk: () => {
        if (!this.deadlinePurchaseRequest) {
          this.notification.warning('Thông báo', 'Vui lòng chọn deadline hàng về!');
          return false;
        }

        const deadlineFixed = new Date(this.deadlinePurchaseRequest);
        deadlineFixed.setHours(12, 0, 0, 0);
        const deadlineISO = deadlineFixed.toISOString();

        requestItems.forEach(item => {
          item.DeadlinePur = deadlineISO;
        });

        this.projectPartListService.approvePurchaseRequest(requestItems, true, projectTypeID, this.projectSolutionId, this.projectId).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Yêu cầu mua hàng thành công!');
              this.loadDataProjectPartList();
              this.deadlinePurchaseRequest = null;
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể yêu cầu mua hàng');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || error?.message || 'Không thể yêu cầu mua hàng');
          }
        });
        return true;
      }
    });
  }

  // Hủy yêu cầu mua hàng
  cancelPurchaseRequest(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần hủy yêu cầu mua hàng');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy yêu cầu mua hàng',
      nzContent: `Bạn có chắc chắn muốn hủy yêu cầu mua hàng cho ${selectedRows.length} vật tư?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const requestItems = selectedRows.map((row: any) => ({
          ID: row.ID,
          STT: row.STT,
          TT: row.TT,
          IsLeaf: row.IsLeaf
        }));
        this.projectPartListService.approvePurchaseRequest(requestItems, false, this.projectTypeID, this.projectSolutionId, this.projectId).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Hủy yêu cầu mua hàng thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể hủy yêu cầu mua hàng');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể hủy yêu cầu mua hàng');
          }
        });
      }
    });
  }

  // Xóa vật tư
  deleteProjectPartList(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần xóa');
      return;
    }

    // Validate từng vật tư được chọn theo logic cũ
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã được yêu cầu mua hàng chưa
      if (row.IsApprovedPurchase == true) {
        const tt = row.TT || row.STT;
        this.notification.warning('Thông báo', `Vật tư TT ${tt} đã được yêu cầu mua hàng. Vui lòng hủy yêu cầu mua trước`);
        return;
      }
      // Kiểm tra vật tư đã được TBP duyệt chưa
      if (row.IsApprovedTBP == true) {
        const tt = row.TT || row.STT;
        this.notification.warning('Thông báo', `Vật tư TT ${tt} đã được TBP duyệt. Vui lòng hủy duyệt trước`);
        return;
      }
    }

    this.reasonDeleted = '';
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa vật tư',
      nzContent: this.deletePartListModalContent,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzWidth: 500,
      nzOnOk: () => {
        if (!this.reasonDeleted || this.reasonDeleted.trim() === '') {
          this.notification.warning('Thông báo', 'Vui lòng nhập lý do xóa!');
          return false;
        }

        const payload = selectedRows.map((row: any) => ({
          ID: row.ID || 0,
          TT: row.TT || '',
          IsDeleted: true,
          ReasonDeleted: this.reasonDeleted.trim()
        }));

        this.projectPartListService.deletePartList(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Xóa vật tư thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error(' Lỗi', response.message || 'Không thể xóa vật tư');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể xóa vật tư');
          }
        });
        return true;
      }
    });
  }

  // Xóa phiên bản
  deleteProjectPartListVersion(typenumber: number): void {
    let selectedVersion: any = null;
    if (typenumber === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để xóa!');
        return;
      }
      selectedVersion = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
    } else {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để xóa!');
        return;
      }
      selectedVersion = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
    }

    if (!selectedVersion || !selectedVersion.ID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản!');
      return;
    }

    // Kiểm tra điều kiện xóa theo logic cũ
    if (selectedVersion.IsActive === true) {
      this.notification.warning(
        'Thông báo',
        `Phiên bản [${selectedVersion.Code}] đang được sử dụng.\nBạn không thể xóa!`
      );
      return;
    }
    if (selectedVersion.IsApproved === true) {
      this.notification.warning(
        'Thông báo',
        `Phiên bản [${selectedVersion.Code}] đã được phê duyệt.\nBạn không thể xóa!`
      );
      return;
    }

    this.reasonDeletedVersion = '';
    this.modal.confirm({
      nzTitle: `Xác nhận xóa phiên bản [${selectedVersion.Code || ''}]`,
      nzContent: this.deleteVersionModalContent,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzWidth: 500,
      nzOnOk: () => {
        if (!this.reasonDeletedVersion || this.reasonDeletedVersion.trim() === '') {
          this.notification.warning('Thông báo', 'Vui lòng nhập lý do xóa!');
          return false;
        }

        const payload: any = {
          ...selectedVersion,
          IsDeleted: true,
          ReasonDeleted: this.reasonDeletedVersion.trim()
        };

        this.projectPartListService.saveProjectPartListVersion(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Xóa phiên bản thành công!');
              // Refresh data
              if (this.projectSolutionId) {
                this.loadDataProjectPartListVersion();
                this.loadDataProjectPartListVersionPO();
              }
              this.reasonDeletedVersion = '';
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể xóa phiên bản!');
            }
          },
          error: (error: any) => {
            console.error('Error deleting version:', error);
            const errorMessage = error?.error?.message || error?.message || 'Không thể xóa phiên bản!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
        return true;
      }
    });
  }

  // Yêu cầu chuyển kho
  requestTransfer(warehouseCode?: string): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn yêu cầu chuyển kho!');
      return;
    }

    // Lọc chỉ lấy node lá (IsLeaf === true)
    const leafNodes = selectedRows.filter((row: any) => {
      return row.IsLeaf === true;
    });

    if (leafNodes.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn các sản phẩm  để yêu cầu chuyển kho!');
      return;
    }

    // Nếu đã có warehouseCode, xử lý trực tiếp
    if (warehouseCode) {
      this.confirmRequestTransfer(leafNodes, warehouseCode);
      return;
    }

    // Nếu chưa có warehouseCode, mở modal chọn kho
    if (!this.warehouses || this.warehouses.length === 0) {
      this.notification.error('Lỗi', 'Không có kho nào để chọn!');
      return;
    }
    // TODO: Mở modal chọn kho
    this.notification.info('Thông báo', 'Chức năng chọn kho đang phát triển');
  }

  // Xác nhận và gọi API yêu cầu chuyển kho
  confirmRequestTransfer(selectedNodes: any[], warehouseCode: string): void {
    const itemCount = selectedNodes.length;
    const ttList = selectedNodes.map((node: any) => node.TT || node.STT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận yêu cầu chuyển kho',
      nzContent: `Bạn có chắc muốn yêu cầu chuyển kho ${itemCount} sản phẩm (TT: ${ttList}) không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.executeRequestTransfer(selectedNodes, warehouseCode);
      }
    });
  }

  // Thực hiện yêu cầu chuyển kho
  executeRequestTransfer(selectedNodes: any[], warehouseCode: string): void {
    // Chuẩn bị payload theo ProjectPartListExportDTO structure
    const listItem = selectedNodes.map((node: any) => {
      const item: any = {
        ID: node.ID || 0,
        RemainQuantity: node.RemainQuantity || 0,
        QuantityReturn: node.QuantityReturn || 0,
        QtyFull: node.QtyFull || 0,
        ProductNewCode: node.ProductNewCode || '',
        GroupMaterial: node.GroupMaterial || '',
        Unit: node.Unit || '',
        ProjectCode: node.ProjectCode || this.projectCodex || '',
        ProjectID: node.ProjectID || 0,
        ProductID: node.ProductID || 0,
        TT: node.TT || '',
        WarehouseID: 0
      };
      return item;
    });

    const request = {
      WarehouseCode: warehouseCode,
      ListItem: listItem
    };

    console.log('[REQUEST TRANSFER] Payload:', request);
    this.startLoading();

    this.projectPartListService.requestExport(request).subscribe({
      next: (response: any) => {
        this.stopLoading();
        if (response.status === 1 && response.data) {
          const billsData = response.data.Bills || [];
          const warningMessage = response.data.Warning || '';
          // Hiển thị cảnh báo nếu có
          if (warningMessage) {
            this.notification.warning('Thông báo', warningMessage);
          }
          // Kiểm tra có bills để mở modal không
          if (billsData.length === 0) {
            this.notification.warning('Thông báo', 'Không có dữ liệu để xuất kho!');
            return;
          }
          // Mở modal BillExportDetail tuần tự cho từng bill
          this.openBillExportDetailModals(billsData, 0, true);
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu chuyển kho!');
        }
      },
      error: (error: any) => {
        this.stopLoading();
        console.error('Error requesting transfer:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể yêu cầu chuyển kho';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  // Yêu cầu xuất kho
  requestExportByWarehouse(warehouseCode: string): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn yêu cầu xuất kho!');
      return;
    }

    // Lọc chỉ lấy node lá (IsLeaf === true)
    const leafNodes = selectedRows.filter((row: any) => {
      return row.IsLeaf === true;
    });

    if (leafNodes.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn các sản phẩm  để yêu cầu xuất kho!');
      return;
    }

    // Nếu đã có warehouseCode, xử lý trực tiếp
    if (warehouseCode) {
      this.confirmRequestExport(leafNodes, warehouseCode);
      return;
    }

    // Nếu chưa có warehouseCode, mở modal chọn kho
    if (!this.warehouses || this.warehouses.length === 0) {
      this.notification.error('Lỗi', 'Không có kho nào để chọn!');
      return;
    }
    // TODO: Mở modal chọn kho
    this.notification.info('Thông báo', 'Chức năng chọn kho đang phát triển');
  }

  // Xác nhận và gọi API yêu cầu xuất kho
  confirmRequestExport(selectedNodes: any[], warehouseCode: string): void {
    const itemCount = selectedNodes.length;
    const ttList = selectedNodes.map((node: any) => node.TT || node.STT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận yêu cầu xuất kho',
      nzContent: `Bạn có chắc muốn yêu cầu xuất kho ${itemCount} sản phẩm (TT: ${ttList}) không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.executeRequestExport(selectedNodes, warehouseCode);
      }
    });
  }

  // Thực hiện yêu cầu xuất kho
  executeRequestExport(selectedNodes: any[], warehouseCode: string): void {
    // Chuẩn bị payload theo ProjectPartListExportDTO structure
    const listItem = selectedNodes.map((node: any) => {
      const item: any = {
        ID: node.ID || 0,
        RemainQuantity: node.RemainQuantity || 0,
        QuantityReturn: node.QuantityReturn || 0,
        QtyFull: node.QtyFull || 0,
        ProductNewCode: node.ProductNewCode || '',
        GroupMaterial: node.GroupMaterial || '',
        Unit: node.Unit || '',
        ProjectCode: node.ProjectCode || this.projectCodex || '',
        ProjectID: node.ProjectID || 0,
        ProductID: node.ProductID || 0,
        TT: node.TT || '',
        WarehouseID: 0
      };
      return item;
    });

    const request = {
      WarehouseCode: warehouseCode,
      ListItem: listItem
    };

    console.log('[REQUEST EXPORT] Payload:', request);
    this.startLoading();

    this.projectPartListService.requestExport(request).subscribe({
      next: (response: any) => {
        this.stopLoading();
        if (response.status === 1 && response.data) {
          const billsData = response.data.Bills || [];
          const warningMessage = response.data.Warning || '';
          // Hiển thị cảnh báo nếu có
          if (warningMessage) {
            this.notification.warning('Thông báo', warningMessage);
          }
          // Kiểm tra có bills để mở modal không
          if (billsData.length === 0) {
            this.notification.warning('Thông báo', 'Không có dữ liệu để xuất kho!');
            return;
          }
          // Mở modal BillExportDetail tuần tự cho từng bill
          this.openBillExportDetailModals(billsData, 0, false);
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu xuất kho!');
        }
      },
      error: (error: any) => {
        this.stopLoading();
        console.error('Error requesting export:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể yêu cầu xuất kho';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  // Mở modal BillExportDetail tuần tự cho từng bill
  private openBillExportDetailModals(billsData: any[], index: number, isTransfer: boolean): void {
    if (index >= billsData.length) {
      // Đã mở hết tất cả modal → reload data
      this.loadDataProjectPartList();
      return;
    }
    const billData = billsData[index];
    const bill = billData.Bill || {};
    const details = billData.Details || [];
    const billExportForModal = {
      TypeBill: false,
      Code: bill.Code || '',
      Address: bill.Address || '',
      CustomerID: bill.CustomerID || 0,
      UserID: bill.UserID || 0,
      SenderID: bill.SenderID || 0,
      WarehouseType: bill.WarehouseType || '',
      GroupID: bill.GroupID || '',
      KhoTypeID: bill.KhoTypeID || 0,
      ProductType: bill.ProductType || 0,
      AddressStockID: bill.AddressStockID || 0,
      WarehouseID: bill.WarehouseID || 0,
      Status: bill.Status || 6,
      SupplierID: bill.SupplierID || 0,
      CreatDate: bill.CreatDate || bill.RequestDate || new Date(),
      RequestDate: bill.RequestDate || new Date(),
    };
    // Map details cho modal theo BillExportDetailRQPDTO structure
    const detailsForModal = details.map((detail: any) => ({
      ID: 0,
      STT: detail.STT || 0,
      ChildID: detail.ChildID || 0,
      ParentID: detail.ParentID || 0,
      ProductID: detail.ProductID || 0,
      ProductCode: detail.ProductCode || '',
      ProductNewCode: detail.ProductNewCode || '',
      ProductName: detail.ProductName || '',
      ProductFullName: detail.ProductFullName || '',
      Unit: detail.Unit || '',
      Qty: detail.Qty || 0,
      TotalQty: detail.TotalQty || 0,
      QuantityRemain: detail.Qty || 0,
      ProjectID: detail.ProjectID || 0,
      ProjectName: detail.ProjectName || '',
      ProjectCodeText: detail.ProjectCodeText || '',
      ProjectCodeExport: detail.ProjectCodeExport || '',
      ProjectPartListID: detail.ProjectPartListID || 0,
      Note: detail.Note || '',
      SerialNumber: detail.SerialNumber || '',
      ProjectNameText: detail.ProjectName || '',
      IsTransfer: isTransfer,
      TotalInventory: 0
    }));
    const modalRef = this.ngbModal.open(BillExportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    // Truyền dữ liệu vào modal
    modalRef.componentInstance.newBillExport = billExportForModal;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.isAddExport = true;
    modalRef.componentInstance.wareHouseCode = bill.WarehouseCode || '';
    modalRef.componentInstance.isPOKH = bill.IsPOKH || false;
    modalRef.componentInstance.isFromProjectPartList = true;
    // Set detail data sau khi modal mở
    setTimeout(() => {
      modalRef.componentInstance.dataTableBillExportDetail = detailsForModal;
      if (modalRef.componentInstance.table_billExportDetail) {
        modalRef.componentInstance.table_billExportDetail.replaceData(detailsForModal);
      }
    }, 200);
    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        // Modal đóng thành công → mở modal tiếp theo
        if (result === true && index < billsData.length - 1) {
          this.openBillExportDetailModals(billsData, index + 1, isTransfer);
        } else if (result === true && index === billsData.length - 1) {
          // Modal cuối cùng đóng → reload data và gọi API thông báo
          const text = (isTransfer ? "Mã phiếu chuyển kho: " : "Mã phiếu xuất: ") + bill.Code + "\nNgười yêu cầu: " + (this.currentUser?.FullName || '');
          const employeeID = this.currentUser?.ID || this.currentUser?.EmployeeID || 0;
          const departmentID = 0;
          // Gọi API thông báo
          this.projectPartListService.addNotify(text, employeeID, departmentID).subscribe({
            next: (response: any) => {
              if (response.status === 1) {
                console.log('Thông báo đã được gửi thành công:', response);
              } else {
                console.warn('Có lỗi khi gửi thông báo:', response.message);
              }
            },
            error: (error: any) => {
              console.error('Lỗi khi gọi API thông báo:', error);
            }
          });
          this.loadDataProjectPartList();
        }
      },
      (dismissed) => {
        // Modal bị dismiss → vẫn tiếp tục mở modal tiếp theo nếu có
        if (index < billsData.length - 1) {
          this.openBillExportDetailModals(billsData, index + 1, isTransfer);
        } else {
          // Modal cuối cùng bị dismiss → reload data
          this.loadDataProjectPartList();
        }
      }
    );
  }

  // Mở form xuất Excel
  async openFormExportExcelPartlist(): Promise<void> {
    // Xuất Excel trước
    const exportSuccess = await this.exportExcelPartlist();
    // Sau khi xuất thành công, mở modal
    if (exportSuccess) {
      const modalRef = this.ngbModal.open(FormExportExcelPartlistComponent, {
        centered: true,
        windowClass: 'full-screen-modal',
        keyboard: false,
      });
      modalRef.componentInstance.projectId = this.projectId;
      modalRef.componentInstance.projectCode = this.projectCodex || '';
      modalRef.componentInstance.projectName = this.projectNameX || '';
      modalRef.componentInstance.versionPOID = this.versionPOID;
      modalRef.componentInstance.partListData = this.dataProjectPartList || [];
    }
  }

  /**
   * Flatten tree data to array (recursive)
   */
  private flattenTreeDataForExport(treeData: any[]): any[] {
    const result: any[] = [];
    const flatten = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        result.push(node);
        if (node._children && node._children.length > 0) {
          flatten(node._children);
        }
      });
    };
    flatten(treeData);
    return result;
  }

  /**
   * Xuất Excel danh mục vật tư
   * @returns Promise<boolean> - true nếu xuất thành công, false nếu thất bại
   */
  async exportExcelPartlist(): Promise<boolean> {
    if (!this.dataProjectPartList) return false;

    // Lấy toàn bộ dữ liệu tree (cả node cha và node con) từ dữ liệu gốc
    const treeData = this.dataProjectPartList || [];
    // Flatten tree data để export tất cả các node
    const data = this.flattenTreeDataForExport(treeData);

    if (!data || data.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel!'
      );
      return false;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh mục vật tư');

    // ===== HEADER SECTION (Rows 1-6) =====
    // Row 1: Title "DANH MỤC VẬT TƯ"
    // ===== MERGE CELLS (HEADER) =====
    worksheet.mergeCells('A1:A3');
    worksheet.mergeCells('B1:B3');
    worksheet.mergeCells('A4:B4');
    worksheet.mergeCells('A5:B5');

    worksheet.mergeCells('C1:F1');
    worksheet.mergeCells('G2:I2');
    worksheet.mergeCells('G3:I3');

    // ===== HEADER VALUES =====
    worksheet.getCell('C1').value = 'DANH MỤC VẬT TƯ';
    worksheet.getCell('C1').font = { bold: true, size: 14 };
    worksheet.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell('C2').value = 'Mã dự án:';
    worksheet.getCell('C2').alignment = { horizontal: 'right' };
    worksheet.getCell('D2').value = this.projectCodex || '';

    worksheet.getCell('C3').value = 'Tên dự án';
    worksheet.getCell('C3').alignment = { horizontal: 'right' };
    worksheet.getCell('D3').value = this.projectNameX || '';

    worksheet.getCell('G3').value = 'BM03-RTC.TE-QT01\nBan hành lần: 02';
    worksheet.getCell('G3').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    worksheet.getCell('A4').value = 'Người lập:';
    worksheet.getCell('E4').value = 'Kiểm tra:';
    worksheet.getCell('H4').value = 'Phê duyệt:';

    worksheet.getCell('A6').value = 'Ngày:';
    worksheet.getCell('G6').value = DateTime.now().toFormat('dd/MM/yyyy');
    worksheet.getCell('E6').value = 'Ngày:';
    worksheet.getCell('H6').value = 'Ngày:';

    // ===== DATA HEADER (Row 7) =====
    const exportColumns = [
      { header: 'TT', field: 'TT', width: 10 },
      { header: 'Tên vật tư', field: 'GroupMaterial', width: 35 },
      { header: 'Mã thiết bị', field: 'ProductCode', width: 18 },
      { header: 'Mã đặt hàng', field: 'BillCodePurchase', width: 18 },
      { header: 'Hãng SX', field: 'Manufacturer', width: 15 },
      { header: 'Thông số kỹ thuật', field: 'Model', width: 30 },
      { header: 'Số lượng/1 máy', field: 'QtyMin', width: 15, isNumber: true },
      { header: 'Số lượng tổng', field: 'QtyFull', width: 15, isNumber: true },
      { header: 'Đơn vị', field: 'Unit', width: 10 },
      { header: 'Đơn giá KT nhập', field: 'Price', width: 15, isNumber: true },
      { header: 'Thành tiền KT nhập', field: 'Amount', width: 18, isNumber: true },
      { header: 'Tiến độ', field: 'LeadTime', width: 15 },
      { header: 'Nhà cung cấp', field: 'NameNCCPriceQuote', width: 20 },
      { header: 'Ngày yêu cầu đặt hàng', field: 'RequestDate', width: 20, isDate: true },
      { header: 'Tiến độ yêu cầu', field: 'LeadTimePurchase', width: 18 },
      { header: 'SL đặt thực tế', field: 'QtyOrderActual', width: 15, isNumber: true },
      { header: 'NCC mua hàng', field: 'SupplierNamePurchase', width: 18 },
      { header: 'Giá đặt mua', field: 'PriceOrder', width: 15, isNumber: true },
      { header: 'Ngày đặt hàng thực tế', field: 'RequestDatePurchase', width: 18, isDate: true },
      { header: 'Dự kiến hàng về', field: 'ExpectedReturnDate', width: 18, isDate: true },
      { header: 'Tình trạng', field: 'StatusText', width: 12 },
      { header: 'Chất lượng', field: 'Quality', width: 12 },
      { header: 'Note', field: 'Note', width: 20 },
      { header: 'Lý do phát sinh', field: 'ReasonProblem', width: 20 },
      { header: 'Mã đặc biệt', field: 'SpecialCode', width: 15 },
      { header: 'Đơn giá Pur báo', field: 'UnitPriceQuote', width: 15, isNumber: true },
      { header: 'Thành tiền Pur báo', field: 'TotalPriceQuote1', width: 18, isNumber: true },
      { header: 'Loại tiền Pur báo', field: 'CurrencyQuote', width: 18 },
      { header: 'Tỷ giá báo', field: 'CurrencyRateQuote', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi báo giá (VNĐ)', field: 'TotalPriceExchangeQuote', width: 25, isNumber: true },
      { header: 'Đơn giá Pur mua', field: 'UnitPricePurchase', width: 18, isNumber: true },
      { header: 'Thành tiền Pur mua', field: 'TotalPricePurchase', width: 18, isNumber: true },
      { header: 'Loại tiền Pur mua', field: 'CurrencyPurchase', width: 18 },
      { header: 'Tỷ giá mua', field: 'CurrencyRatePurchase', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi mua (VNĐ)', field: 'TotalPriceExchangePurchase', width: 25, isNumber: true },
      { header: 'Leadtime Pur báo giá', field: 'LeadTimeQuote', width: 20 },
      { header: 'Leadtime Pur đặt mua', field: 'LeadTimePurchase', width: 20 },
      { header: 'SL đã về', field: 'QuantityReturn', width: 12, isNumber: true },
      { header: 'Mã nội bộ', field: 'ProductNewCode', width: 15 },
      { header: 'Số HĐ đầu vào', field: 'SomeBill', width: 18 },
      { header: 'SL đã xuất', field: 'TotalExport', width: 12, isNumber: true },
      { header: 'SL còn lại', field: 'RemainQuantity', width: 12, isNumber: true },
    ];

    // Set column widths
    worksheet.columns = exportColumns.map((col, index) => ({
      key: col.field,
      width: col.width,
    }));

    // Add header row (Row 7 - tự động là row 7 vì đã có 6 dòng trước đó)
    const headerRowData = exportColumns.map((col) => col.header);
    const excelHeaderRow = worksheet.addRow(headerRowData);
    excelHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Light grey background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Add data rows
    data.forEach((row: any, rowIndex: number) => {
      const rowData = exportColumns.map((col) => {
        let value = row[col.field];

        // Format dates
        if (col.isDate && value) {
          const dateTime = DateTime.fromISO(value);
          value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        }

        // Format numbers
        if (col.isNumber && value !== null && value !== undefined && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
          } else {
            value = '';
          }
        }

        return value ?? '';
      });

      const excelRow = worksheet.addRow(rowData);

      // === LOGIC VẼ MÀU GIỐNG WINFORM NodeCellStyle ===
      const hasChildren = row._children && row._children.length > 0;
      const isDeleted = row.IsDeleted === true;
      const isProblem = row.IsProblem === true;
      // Parse QuantityReturn - giống logic trong rowFormatter
      const quantityReturn = Number(row.QuantityReturn) || 0;

      // Xác định màu nền cho toàn bộ dòng (ưu tiên theo thứ tự)
      let rowFillColor: ExcelJS.Fill | null = null;
      let rowFont: Partial<ExcelJS.Font> | null = null;

      // Áp dụng màu theo thứ tự ưu tiên (giống WinForm)
      // 1. Ưu tiên cao nhất: Dòng bị xóa → Red
      if (isDeleted) {
        rowFillColor = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } } as ExcelJS.Fill; // Đỏ
        rowFont = { name: 'Times New Roman', size: 11, color: { argb: 'FFFFFFFF' } }; // Trắng
      }
      // 2. Dòng có vấn đề → Orange
      else if (isProblem) {
        rowFillColor = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } } as ExcelJS.Fill; // Cam
      }
      // 3. Số lượng trả về > 0 → LightGreen (hàng đã về)
      else if (quantityReturn > 0) {
        rowFillColor = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } } as ExcelJS.Fill; // Xanh lá
      }
      // 4. Node cha (có children) → Light yellow
      else if (hasChildren) {
        rowFillColor = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFACD' } } as ExcelJS.Fill; // Light yellow
        rowFont = { name: 'Times New Roman', size: 11, bold: true };
      }

      // Style data rows
      excelRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Right-align number columns
        const colDef = exportColumns[colNumber - 1];
        if (colDef && colDef.isNumber) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }

        // Áp dụng màu nền cho toàn bộ dòng (nếu có)
        if (rowFillColor) {
          cell.fill = rowFillColor;
        }
        if (rowFont) {
          cell.font = { ...cell.font, ...rowFont };
        }
      });

      excelRow.eachCell((cell, colNumber) => {
        const colDef = exportColumns[colNumber - 1];
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: colDef?.isNumber ? 'right' : 'left'
        };
      });
    });

    // Generate and download file
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Lấy thông tin loại phiên bản, tên phiên bản và tên danh mục phiên bản
      let versionType = ''; // GP hoặc PO
      let versionName = ''; // Tên phiên bản (Code)
      let projectTypeName = ''; // Tên danh mục phiên bản (ProjectTypeName)

      if (this.type === 1) {
        // Giải pháp (GP)
        versionType = 'GP';
        versionName = this.CodeName || '';
        projectTypeName = this.projectTypeName || '';
      } else if (this.type === 2) {
        // PO
        versionType = 'PO';
        versionName = this.CodeName || '';
        projectTypeName = this.projectTypeName || '';
      } else {
        // Mặc định nếu không có type
        versionType = '';
        versionName = this.CodeName || '';
        projectTypeName = this.projectTypeName || '';
      }

      // Tạo tên file: DanhMucVatTu_ProjectCode_Loại phiên bản_tên danh mục phiên bản
      const projectCode = (this.projectCodex);
      const versionTypeClean = versionType;
      const versionNameClean = (versionName);
      const projectTypeNameClean = (projectTypeName);

      let fileName = `DanhMucVatTu_${projectCode}`;
      if (versionTypeClean) {
        fileName += `_${versionTypeClean}`;
      }
      if (versionNameClean) {
        fileName += `_${versionNameClean}`;
      }
      fileName += '.xlsx';

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success(
        'Thành công',
        'Xuất Excel thành công!'
      );

      return true;
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất file Excel!');
      return false;
    }
  }

  // Mở form nhập Excel
  openImportExcelProjectPartList(): void {
    let selectedVersionID = this.type === 1 ? this.versionID : this.versionPOID;
    if (!selectedVersionID || selectedVersionID === 0) {
      selectedVersionID = this.versionID > 0 ? this.versionID : this.versionPOID;
    }
    const modalRef = this.ngbModal.open(ImportExcelPartlistComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCodex;
    modalRef.componentInstance.versionId = selectedVersionID;
    modalRef.componentInstance.versionCode = this.CodeName;
    modalRef.componentInstance.projectTypeId = this.projectTypeID;
    modalRef.componentInstance.projectTypeName = this.projectTypeName;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.result.then((result: any) => {
      if (result && result.success) {
        this.loadDataProjectPartList();
      }
    }).catch(() => { });
  }

  // Chọn sản phẩm cho POKH
  SelectProroduct(): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư!');
      return;
    }
    const listIDInsert = selectedRows.map((row: any) => row.ID);
    const processedData = selectedRows;
    if (this.onSelectProductPOCallback) {
      this.onSelectProductPOCallback({ listIDInsert, processedData });
    }
    this.selectProductPOData = { listIDInsert, processedData };
    if (this.activeModal) {
      this.activeModal.close(this.selectProductPOData);
    }
  }

  // Disable ngày trong date picker
  disabledDate = (current: Date): boolean => {
    if (!current) return false;
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    if (new Date().getHours() >= 15) {
      minDate.setDate(minDate.getDate() + 2);
    } else {
      minDate.setDate(minDate.getDate() + 1);
    }
    return current < minDate;
  };

  disabledDatePurchase = (current: Date): boolean => {
    if (!current) return false;
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    if (new Date().getHours() >= 15) {
      minDate.setDate(minDate.getDate() + 2);
    } else {
      minDate.setDate(minDate.getDate() + 1);
    }
    return current < minDate;
  };

  onIsGeneratedItemChange(): void {
    if (!this.isGeneratedItem) {
      this.reasonProblem = '';
    }
  }

  // Helper: Lấy các row đã chọn từ PartList grid
  private getSelectedPartListRows(): any[] {
    if (!this.angularGridPartList) return [];
    const selectedRowIndices = this.angularGridPartList.slickGrid?.getSelectedRows() || [];
    return selectedRowIndices.map((i: number) => this.angularGridPartList.dataView?.getItem(i)).filter((item: any) => item);
  }

  // Tính toán tree data (giống CalculatorData trong WinForm)
  calculateWorkerTree(data: any[]): any[] {
    if (!data || data.length === 0) return [];
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Clone và khởi tạo _children
    data.forEach(item => {
      const node = { ...item, id: item.ID, _children: [] };
      map.set(node.ID, node);
    });

    // Bước 2: Xây dựng cây (build tree structure)
    data.forEach(item => {
      const node = map.get(item.ID);
      if (!node) return;
      // Kiểm tra điều kiện parent
      if (item.ParentID && item.ParentID !== 0 && item.ParentID !== null) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          // Parent không tồn tại → thêm vào root
          tree.push(node);
        }
      } else {
        // Không có parent → root node
        tree.push(node);
      }
    });

    // Bước 3: Tính tổng từ dưới lên (post-order traversal - giống WinForm loop từ cuối lên)
    const calculateTotals = (nodes: any[]): void => {
      nodes.forEach(node => {
        // Bỏ qua nếu không có children
        if (!node._children || node._children.length === 0) {
          return;
        }
        // Đệ quy tính con trước (bottom-up)
        calculateTotals(node._children);

        // Khởi tạo biến tổng
        let totalAmount = 0;
        let totalAmountQuote = 0;
        let totalAmountPurchase = 0;
        let totalPriceExchangePurchase = 0;
        let totalPriceExchangeQuote = 0;

        // Tính tổng từ tất cả children (giống foreach trong WinForm)
        node._children.forEach((child: any) => {
          totalAmount += Number(child.Amount) || 0;
          totalAmountQuote += Number(child.TotalPriceQuote1) || 0;
          totalAmountPurchase += Number(child.TotalPricePurchaseExport) || 0;
          totalPriceExchangePurchase += Number(child.TotalPriceExchangePurchase) || 0;
          totalPriceExchangeQuote += Number(child.TotalPriceExchangeQuote) || 0;
        });

        // Gán giá trị vào parent node (giống SetValue trong WinForm)
        // Parent có children → Price = 0
        if (node._children.length > 0) {
          node.Price = 0;
        }

        // Gán tổng vào parent
        node.Amount = totalAmount;
        node.TotalPriceQuote1 = totalAmountQuote;
        node.TotalPricePurchaseExport = totalAmountPurchase;
        node.TotalPriceExchangePurchase = totalPriceExchangePurchase;
        node.TotalPriceExchangeQuote = totalPriceExchangeQuote;

        // Set các flag cho parent (node cha không có các flag này)
        node.IsNewCode = false;
        node.IsApprovedTBPNewCode = false;
        node.IsFix = false; // Tích xanh chỉ dành cho node lá
      });
    };

    // Bắt đầu tính toán từ root
    calculateTotals(tree);
    return tree;
  }

  // Apply distinct filters to PartList grid (tham khảo project-slick-grid2)
  // private applyDistinctFiltersToPartList(): void {
  //   if (!this.angularGridPartList?.slickGrid || !this.angularGridPartList?.dataView) return;

  //   const data = this.angularGridPartList.dataView.getItems();
  //   if (!data || data.length === 0) return;

  //   const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
  //     const map = new Map<string, string>();
  //     dataArray.forEach((row: any) => {
  //       const value = String(row?.[field] ?? '');
  //       if (value && !map.has(value)) {
  //         map.set(value, value);
  //       }
  //     });
  //     return Array.from(map.entries())
  //       .map(([value, label]) => ({ value, label }))
  //       .sort((a, b) => a.label.localeCompare(b.label));
  //   };

  //   const fieldsToFilter = [
  //     'TT', 'GroupMaterial', 'ProductCode', 'Model', 'QtyMin', 'QtyFull',
  //     'SpecialCode', 'Manufacturer', 'Unit', 'IsFix', 'IsApprovedTBPText', 'IsNewCode', 'IsApprovedTBPNewCode',
  //     'Price', 'Amount', 'UnitPriceHistory', 'CurrencyCode', 'Quality', 'FullNameCreated', 'CreatedDate',
  //     'Note', 'ReasonProblem', 'ReasonDeleted', 'IsCheckPrice', 'StatusPriceRequestText', 'FullNameQuote',
  //     'DatePriceRequest', 'FullNameRequestPrice', 'DeadlinePriceRequest', 'DatePriceQuote',
  //     'UnitPriceQuote', 'TotalPriceQuote', 'CurrencyQuote', 'CurrencyRateQuote', 'TotalPriceExchangeQuote',
  //     'NameNCCPriceQuote', 'LeadTimeQuote', 'DateExpectedQuote', 'NoteQuote', 'IsApprovedPurchase',
  //     'FullNameRequestPurchase', 'StatusText', 'FullNamePurchase', 'ExpectedReturnDate', 'RequestDate',
  //     'RequestDatePurchase', 'ExpectedDatePurchase', 'ExpectedArrivalDate', 'BillCodePurchase',
  //     'UnitPricePurchase', 'TotalPricePurchase', 'CurrencyPurchase', 'CurrencyRatePurchase',
  //     'TotalPriceExchangePurchase', 'SupplierNamePurchase', 'LeadTimePurchase', 'QuantityReturn',
  //     'TotalExport', 'RemainQuantity', 'ProductNewCode', 'BillExportCode', 'DateImport', 'NotePurchase',
  //     'DateImport2', 'BillImportCode', 'Reciver', 'KhoType', 'TotalHN', 'TotalHCM', 'TotalDP', 'TotalHP', 'TotalBN'
  //   ];

  //   const columns = this.angularGridPartList.slickGrid.getColumns();
  //   if (!columns) return;

  //   // Update runtime columns
  //   columns.forEach((column: any) => {
  //     if (column?.filter && column.filter.model === Filters['multipleSelect']) {
  //       const field = column.field;
  //       if (!field || !fieldsToFilter.includes(field)) return;
  //       column.filter.collection = getUniqueValues(data, field);
  //     }
  //   });

  //   // Update column definitions
  //   this.partListColumns.forEach((colDef: any) => {
  //     if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
  //       const field = colDef.field;
  //       if (!field || !fieldsToFilter.includes(field)) return;
  //       colDef.filter.collection = getUniqueValues(data, field);
  //     }
  //   });

  //   this.angularGridPartList.slickGrid.setColumns(this.angularGridPartList.slickGrid.getColumns());
  //   this.angularGridPartList.slickGrid.invalidate();
  //   this.angularGridPartList.slickGrid.render();
  // }

  // Utility methods
  /**
   * Format số tiền với dấu phân cách hàng nghìn và phần thập phân
   * Định dạng: 1.000.000,00 (dấu chấm cho hàng nghìn, dấu phẩy cho phần thập phân)
   * @param value - Giá trị số cần format
   * @param decimals - Số chữ số thập phân (mặc định: 2)
   * @returns Chuỗi đã được format
   */
  formatMoney(value: any, decimals: number = 2): string {
    if (value == null || value === '' || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    // Format với số thập phân
    const formatted = numValue.toFixed(decimals);
    // Tách phần nguyên và phần thập phân
    const parts = formatted.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    // Xử lý số âm
    const isNegative = integerPart.startsWith('-');
    if (isNegative) {
      integerPart = integerPart.substring(1);
    }
    // Thêm dấu chấm phân cách hàng nghìn
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Thêm lại dấu âm nếu có
    if (isNegative) {
      integerPart = '-' + integerPart;
    }
    // Kết hợp với dấu phẩy cho phần thập phân
    if (decimalPart) {
      return `${integerPart},${decimalPart}`;
    }
    return integerPart;
  }
  applyDistinctFiltersToPartList(): void {
    const angularGrid = this.angularGridPartList;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];
    if (!data || data.length === 0) return;

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
    };

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];
    const booleanFields = new Set([
      'IsApprovedPurchase',
      'IsCheckPrice',
      'IsApprovedTBPNewCode',
      'IsNewCode',
      'IsApprovedTBPText',
      'IsFix',
    ]);

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;

          if (booleanFields.has(field)) {
            // For boolean fields: only "Có"/"Không" without Select All
            column.filter.collection = booleanCollection;
            column.filter.collectionOptions = {
              addBlankEntry: false, // Không có option trống
              enableSelectAllOption: false, // Không có Select All
              maxSelectAllItems: 0 // Không cho phép select all
            };
            column.filter.filterOptions = {
              enableSelectAllOption: false, // Disable Select All trong filter options
              maxSelectAllItems: 0,
              selectAllText: null // Không hiển thị text Select All
            };
          } else {
            // For other fields: normal behavior
            column.filter.collection = getUniqueValues(data, field);
          }
        }
      });
    }

    if (this.partListColumns) {
      this.partListColumns.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;

          if (booleanFields.has(field)) {
            // For boolean fields: only "Có"/"Không" without Select All
            colDef.filter.collection = booleanCollection;
            colDef.filter.collectionOptions = {
              addBlankEntry: false, // Không có option trống
              enableSelectAllOption: false // Không có Select All
            };
            colDef.filter.filterOptions = {
              enableSelectAllOption: false // Disable Select All trong filter options
            };
          } else {
            // For other fields: normal behavior
            colDef.filter.collection = getUniqueValues(data, field);
          }
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
  }

  openProjectPartListHistory(productCode?: string): void {
    let finalProductCode = '';
    if (this.lastClickedPartListRow) {
      finalProductCode = this.lastClickedPartListRow.ProductCode || '';
    } else if (productCode) {
      finalProductCode = productCode;
    }
    if (!finalProductCode || finalProductCode.trim() === '') {
      this.notification.warning('Thông báo', 'Không tìm thấy mã sản phẩm!');
      return;
    }
    const modalRef = this.ngbModal.open(ProjectPartListHistoryComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      keyboard: false,
    });
    modalRef.componentInstance.productCode = finalProductCode;
    modalRef.result.then(
      (result: any) => {},
      (reason: any) => {}
    );
  }

  getPriceHistory(): void {
    if (!this.angularGridPartList) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }
    const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư!');
      return;
    }
    const requestItems: any[] = [];
    for (let rowIndex of selectedRows) {
      const row = this.angularGridPartList?.dataView?.getItem(rowIndex);
      if (!row || !row.ID || row.ID <= 0) continue;
      if (row.UnitPriceHistory == null || row.UnitPriceHistory === '') continue;
      const isLeaf = !row._children || row._children.length === 0;
      requestItems.push({
        ID: row.ID,
        IsLeaf: isLeaf,
        UnitPriceHistory: row.UnitPriceHistory || 0,
        QtyFull: row.QtyFull || 0
      });
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn hoặc các dòng được chọn không có giá lịch sử!');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận lấy giá lịch sử',
      nzContent: `Bạn có chắc muốn lấy giá lịch sử cho ${requestItems.length} vật tư không? Hành động này sẽ cập nhật giá và thành tiền của các vật tư.`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isLoading = true;
        this.projectPartListService.getPriceHistory(requestItems).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Lấy giá lịch sử thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi lấy giá lịch sử!');
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lấy giá lịch sử!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }

  restoreDelete(): void {
    if (!this.angularGridPartList) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }
    const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn!');
      return;
    }
    const requestItems: any[] = [];
    const selectedData: any[] = [];
    for (let rowIndex of selectedRows) {
      const row = this.angularGridPartList?.dataView?.getItem(rowIndex);
      if (!row || !row.ID || row.ID <= 0) continue;
      const isLeaf = !row._children || row._children.length === 0;
      requestItems.push({
        ID: row.ID,
        IsLeaf: isLeaf
      });
      selectedData.push(row);
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn!');
      return;
    }
    const itemCount = requestItems.length;
    const sttList = selectedData
      .filter((row: any) => row.IsDeleted === true && row.ID > 0)
      .map((row: any) => row.TT || row.STT)
      .join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận khôi phục',
      nzContent: `Bạn có chắc chắn muốn khôi phục ${itemCount} dòng đã xóa (Stt: ${sttList})?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isLoading = true;
        this.projectPartListService.restoreDelete(requestItems).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Khôi phục thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi khôi phục!');
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi khôi phục!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }

  additionalPartListPO(): void {
    const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần bổ sung vào PO');
      return;
    }
    if (this.type !== 1) {
      this.notification.warning('Thông báo', 'Chức năng này chỉ áp dụng cho phiên bản giải pháp (GP)');
      return;
    }
    let selectedVersion: any = null;
    const versionRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
    if (versionRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp để bổ sung vào PO');
      return;
    }
    selectedVersion = this.angularGridSolutionVersion?.dataView?.getItem(versionRows[0]);
    if (!selectedVersion || selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion?.Code}] trước!`);
      return;
    }
    const requestItems: any[] = [];
    for (let rowIndex of selectedRows) {
      const row = this.angularGridPartList?.dataView?.getItem(rowIndex);
      if (!row || !row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể bổ sung vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return;
      }
      const isLeaf = !row._children || row._children.length === 0;
      requestItems.push({
        ID: row.ID || 0,
        TT: row.TT || '',
        IsLeaf: isLeaf
      });
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để bổ sung vào PO');
      return;
    }
    this.reasonProblem = '';
    this.isGeneratedItem = false;
    this.showAdditionalPartListPOModal(requestItems, selectedVersion);
  }

  showAdditionalPartListPOModal(requestItems: any[], selectedVersion: any): void {
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.TT).filter((tt: string) => tt).join(', ');
    this.modal.confirm({
      nzTitle: 'Bổ sung vật tư vào PO',
      nzContent: this.additionalPartListPOModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmAdditionalPartListPO(requestItems, selectedVersion);
      },
      nzOnCancel: () => {
        this.reasonProblem = '';
        this.isGeneratedItem = false;
      }
    });
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  validateAndConfirmAdditionalPartListPO(requestItems: any[], selectedVersion: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isGeneratedItem) {
        if (!this.reasonProblem || this.reasonProblem.trim() === '') {
          this.notification.warning('Thông báo', 'Vui lòng nhập lý do phát sinh!');
          resolve(false);
          return;
        }
      }
      this.confirmAdditionalPartListPO(requestItems, selectedVersion);
      resolve(true);
    });
  }

  confirmAdditionalPartListPO(requestItems: any[], selectedVersion: any): void {
    const payload = {
      ListItem: requestItems,
      VersionID: selectedVersion.ID || 0,
      ProjectTypeID: selectedVersion.ProjectTypeID || 0,
      ProjectTypeName: selectedVersion.ProjectTypeName || '',
      ProjectSolutionID: this.projectSolutionId || 0,
      projectID: this.projectId || 0,
      ReasonProblem: this.reasonProblem.trim()
    };
    console.log('=== SENDING ADDITIONAL PARTLIST PO TO API ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    this.startLoading();
    this.projectPartListService.additionalPartListPO(payload).subscribe({
      next: (response: any) => {
        this.stopLoading();
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Bổ sung vật tư vào PO thành công!');
          this.loadDataProjectPartList();
          this.loadDataProjectPartListVersionPO();
          this.reasonProblem = '';
          this.isGeneratedItem = false;
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể bổ sung vật tư vào PO');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể bổ sung vật tư vào PO');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể bổ sung vật tư vào PO';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  downloadDrawing(): void {
    const selectedSolutionRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
    if (selectedSolutionRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp!');
      return;
    }
    const solutionData = this.angularGridSolution?.dataView?.getItem(selectedSolutionRows[0]);
    const solutionCode = solutionData?.CodeSolution?.trim();
    if (!solutionCode) {
      this.notification.warning('Thông báo', 'Không tìm thấy mã giải pháp!');
      return;
    }
    const selectedProducts = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedProducts.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn tải file!');
      return;
    }
    const getAllSelectedRows = (): any[] => {
      const allRows: any[] = [];
      for (let rowIndex of selectedProducts) {
        const rowData = this.angularGridPartList?.dataView?.getItem(rowIndex);
        if (rowData && rowData.ProductCode && rowData.ProductCode.trim()) {
          allRows.push(rowData);
        }
        if (rowData && rowData._children && rowData._children.length > 0) {
          const getChildrenRecursive = (children: any[]) => {
            children.forEach((child: any) => {
              if (child.ProductCode && child.ProductCode.trim()) {
                allRows.push(child);
              }
              if (child._children && child._children.length > 0) {
                getChildrenRecursive(child._children);
              }
            });
          };
          getChildrenRecursive(rowData._children);
        }
      }
      return allRows;
    };
    const allSelectedProducts = getAllSelectedRows();
    if (allSelectedProducts.length === 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy sản phẩm hợp lệ để tải file!');
      return;
    }
    this.notification.info('Thông báo', 'Đang tải xuống file...');
    let downloadCount = 0;
    let errorCount = 0;
    const totalFiles = allSelectedProducts.length;
    let completedCount = 0;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (projectResponse: any) => {
        if (projectResponse.status !== 1 || !projectResponse.data) {
          this.notification.error('Thông báo', `Không tìm thấy thông tin dự án ID: ${this.projectId}`);
          return;
        }
        const project = projectResponse.data;
        if (!project.CreatedDate) {
          this.notification.error('Thông báo', `Dự án ${project.ProjectCode} không có ngày tạo!`);
          return;
        }
        const createdDate = new Date(project.CreatedDate);
        const year = createdDate.getFullYear();
        const projectCode = project.ProjectCode?.trim() || this.projectCodex?.trim();
        if (!projectCode) {
          this.notification.error('Thông báo', `Dự án ID ${this.projectId} không có mã dự án!`);
          return;
        }
        const pathPattern = `${year}/${projectCode}/THIETKE.Co/${solutionCode}/2D/GC/DH`;
        allSelectedProducts.forEach((product: any) => {
          const productCode = product.ProductCode?.trim();
          if (!productCode) {
            completedCount++;
            if (completedCount === totalFiles) {
              if (downloadCount > 0) {
                this.notification.success('Thông báo', `Đã tải xuống thành công ${downloadCount}/${totalFiles} file!`);
              }
            }
            return;
          }
          const fileName = `${productCode}.pdf`;
          const url = `  ${environment.host}api/share/duan/projects/${pathPattern}/${fileName}`;
          this.projectPartListService.downloadDrawingFile(url).subscribe({
            next: (blob: Blob) => {
              completedCount++;
              if (blob && blob.size > 0) {
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                downloadCount++;
              } else {
                errorCount++;
                this.notification.warning('Thông báo', `File [${fileName}] không tồn tại hoặc rỗng!`);
              }
              if (completedCount === totalFiles) {
                if (downloadCount > 0) {
                  this.notification.success('Thông báo', `Đã tải xuống thành công ${downloadCount}/${totalFiles} file!`);
                }
                if (errorCount > 0 && downloadCount === 0) {
                  this.notification.error('Thông báo', `Không thể tải xuống file nào! (${errorCount} lỗi)`);
                }
              }
            },
            error: (error: any) => {
              completedCount++;
              errorCount++;
              console.error(`Error downloading file ${fileName}:`, error);
              this.notification.error('Thông báo', `File [${fileName}] không tồn tại!\n${error?.message || error?.error?.message || 'Lỗi không xác định'}`);
              if (completedCount === totalFiles) {
                if (downloadCount > 0) {
                  this.notification.success('Thông báo', `Đã tải xuống thành công ${downloadCount}/${totalFiles} file!`);
                }
              }
            }
          });
        });
      }
    });
  }

  techBought(): void {
    const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư mua!');
      return;
    }
    const selectedRow = this.angularGridPartList?.dataView?.getItem(selectedRows[0]);
    if (selectedRow && selectedRow.BillCodePurchase && selectedRow.BillCodePurchase.length > 0) {
      this.notification.warning('Thông báo', `Mã sản phẩm ${selectedRow.ProductCode} đã được có đơn mua ${selectedRow.BillCodePurchase}, bạn không thể mua!`);
      return;
    }
    const modalRef = this.ngbModal.open(ProjectPartlistPurchaseRequestDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    const projectPartlistDetail: any = {
      ID: 0,
      IsTechBought: false,
      ProjectPartListID: selectedRow.ID,
      ProductSaleID: selectedRow.ProductSaleID || 0,
      ProductCode: selectedRow.ProductCode || '',
      ProductName: selectedRow.GroupMaterial || '',
      UnitName: selectedRow.Unit || '',
      Manufacturer: selectedRow.Maker || '',
      Quantity: selectedRow.QtyFull || 0,
      EmployeeID: selectedRow.EmployeeID || 0
    };
    modalRef.componentInstance.projectPartlistDetail = projectPartlistDetail;
    modalRef.result.finally(() => {
      this.loadDataProjectPartList();
    });
  }

  unTechBought(): void {
    const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư mua!');
      return;
    }
    const selectedRow = this.angularGridPartList?.dataView?.getItem(selectedRows[0]);
    if (selectedRow && selectedRow.BillCodePurchase && selectedRow.BillCodePurchase.length > 0) {
      this.notification.warning('Thông báo', `Mã sản phẩm ${selectedRow.ProductCode} đã được có đơn mua ${selectedRow.BillCodePurchase}, bạn không thể hủy!`);
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy đã mua',
      nzContent: `Bạn có chắc muốn hủy đã mua mã sản phẩm ${selectedRow.ProductCode} không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectPartListService.cancelTechBought(selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Hủy đã mua thành công!');
              this.loadDataProjectPartList();
            }
          }
        });
      }
    });
  }
  //#endregion
}
