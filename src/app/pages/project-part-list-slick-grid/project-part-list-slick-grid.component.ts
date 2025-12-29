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
import { NOTIFICATION_TITLE } from '../../app.config';
import { ProjectSolutionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-detail/project-solution-detail.component';
import { ProjectSolutionVersionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-version-detail/project-solution-version-detail.component';
import { ProjectPartlistDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/project-partlist-detail.component';
import { ProjectPartListHistoryComponent } from '../project/project-part-list-history/project-part-list-history.component';
import { BillExportDetailComponent } from '../old/Sale/BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { ImportExcelPartlistComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/import-excel-partlist/import-excel-partlist.component';
import { FormExportExcelPartlistComponent } from '../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-detail/form-export-excel-partlist/form-export-excel-partlist.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../purchase/project-partlist-purchase-request/project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
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
    @Optional() private translateService?: TranslateService,
    @Optional() @Inject('tabData') private tabData?: any
  ) {}

  ngOnInit(): void {
    console.log('=== [LIFECYCLE] ngOnInit START ===');
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
        width: 50,
        sortable: false,
        filterable: false,
      },
      {
        id: 'StatusSolution',
        field: 'StatusSolution',
        name: 'Trạng thái',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'IsApprovedPO',
        field: 'IsApprovedPO',
        name: 'Duyệt PO',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none; accent-color: #1677ff;" />`;
        },
        cssClass: 'text-center',
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        }
      },
      {
        id: 'DateSolution',
        field: 'DateSolution',
        name: 'Ngày GP',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
      },
      {
        id: 'CodeSolution',
        field: 'CodeSolution',
        name: 'Mã',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ContentSolution',
        field: 'ContentSolution',
        name: 'Nội dung',
        width: 300,
        sortable: true,
        filterable: true,
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
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
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
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        }
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
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
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
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: 'true', label: 'true' },
            { value: 'false', label: 'false' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        }
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
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Initialize PartList Grid (Tree structure)
  initPartListGrid(): void {
    console.log('[INIT PARTLIST] Initializing PartList Grid');
    // This will be a complex tree grid - simplified version for now
    this.partListColumns = [
      {
        id: 'TT',
        field: 'TT',
        name: 'TT',
        width: 100,
      },
      {
        id: 'GroupMaterial',
        field: 'GroupMaterial',
        name: 'Tên vật tư',
        width: 200,
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã thiết bị',
        width: 150,
      },
      {
        id: 'Model',
        field: 'Model',
        name: 'Thông số kỹ thuật',
        width: 200,
      },
      {
        id: 'QtyMin',
        field: 'QtyMin',
        name: 'SL/1 máy',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          return value != null ? parseFloat(value).toFixed(1) : '';
        },
      },
      {
        id: 'QtyFull',
        field: 'QtyFull',
        name: 'SL tổng',
        width: 80,
        formatter: (row: number, cell: number, value: any) => {
          return value != null ? parseFloat(value).toFixed(1) : '';
        },
      },
      {
        id: 'Price',
        field: 'Price',
        name: 'Đơn giá',
        width: 100,
        formatter: (row: number, cell: number, value: any) => {
          return this.formatMoney(value, 2);
        },
      },
      {
        id: 'Amount',
        field: 'Amount',
        name: 'Tổng tiền',
        width: 100,
        formatter: (row: number, cell: number, value: any) => {
          return this.formatMoney(value, 2);
        },
      },
    ];
    
    console.log('[INIT PARTLIST] PartList columns defined:', this.partListColumns.length);
    console.log('[INIT PARTLIST] Column names:', this.partListColumns.map(col => col.name));
    console.log('[INIT PARTLIST] Column fields:', this.partListColumns.map(col => col.field));

    this.partListGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-partlist-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
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
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'TT',
        childrenPropName: '_children',
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  // Grid ready handlers
  onSolutionGridReady(event: any): void {
    console.log('[GRID READY] Solution Grid ready');
    this.angularGridSolution = event.detail;
    console.log('[GRID READY] Solution Grid instance:', !!this.angularGridSolution);
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
    // Load data nếu đã có projectSolutionId
    if (this.dataPOVersion.length === 0 && this.projectSolutionId > 0) {
      console.log('[GRID READY] Scheduling PO Version data load');
      setTimeout(() => this.loadDataProjectPartListVersionPO(), 100);
    }
  }

  onPartListGridReady(event: any): void {
    console.log('[GRID READY] PartList Grid ready');
    this.angularGridPartList = event.detail;
    console.log('[GRID READY] PartList Grid instance:', !!this.angularGridPartList);
    
    // Log thông tin grid để debug
    if (this.angularGridPartList) {
      console.log('[GRID READY] PartList - Available columns:', this.angularGridPartList.slickGrid?.getColumns()?.length);
      console.log('[GRID READY] PartList - Column names:', this.angularGridPartList.slickGrid?.getColumns()?.map((col: any) => col.name));
      console.log('[GRID READY] PartList - Grid width:', this.angularGridPartList.slickGrid?.getOptions()?.gridWidth);
      console.log('[GRID READY] PartList - Container width:', this.angularGridPartList.slickGrid?.getViewportWidth());
    }
    
    // Load data nếu đã có versionID hoặc versionPOID
    if (this.dataProjectPartList.length === 0 && (this.versionID > 0 || this.versionPOID > 0)) {
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
          }
          this.projectSolutionId = 0;
          this.resetVersionAndPartlistTables();
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
    if (!this.versionID && !this.versionPOID) {
      return;
    }
    if (!this.angularGridPartList) {
      setTimeout(() => this.loadDataProjectPartList(), 100);
      return;
    }
    this.startLoading();
    const params = {
      versionID: this.versionID,
      versionPOID: this.versionPOID,
      type: this.type,
      keyword: this.keyword,
      isDeleted: this.isDeleted,
      isApprovedTBP: this.isApprovedTBP,
      isApprovedPurchase: this.isApprovedPurchase,
    };
    this.projectPartListService.getProjectPartList(params).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          const flatData = response.data || [];
          // Convert flat data to tree structure
          this.dataProjectPartList = this.convertToTreeData(flatData);
          if (this.angularGridPartList) {
            this.angularGridPartList.dataView.setItems(this.dataProjectPartList);
            this.angularGridPartList.dataView.refresh();
            this.angularGridPartList.slickGrid.invalidate();
            this.angularGridPartList.slickGrid.render();
          }
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading part list:', error);
        this.notification.error(NOTIFICATION_TITLE.error, error.message || 'Lỗi khi tải dữ liệu vật tư');
        this.stopLoading();
      },
    });
  }

  // Convert flat data to tree structure
  convertToTreeData(flatData: any[]): any[] {
    const tree: any[] = [];
    const map = new Map<number, any>();

    // First pass: create map with id property
    flatData.forEach(item => {
      map.set(item.ID, { ...item, id: item.ID || 0, _children: [] });
    });

    // Second pass: build tree
    flatData.forEach(item => {
      const node = map.get(item.ID)!;
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  // Utility methods
  formatMoney(value: any, decimals: number = 2): string {
    if (value == null || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
        console.log('[ROW SELECT] versionID set to:', this.versionID, '| type:', this.type);
        console.log('[ROW SELECT] Loading PartList table');
        this.loadDataProjectPartList();
      } else {
        console.error('[ROW SELECT] Could not get data for row index:', rowIndex);
      }
    } else {
      // Kiểm tra xem còn row nào được chọn không
      const allSelectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (allSelectedRows.length === 0) {
        this.versionID = 0;
        this.type = 0;
        this.resetPartlistTable();
      }
    }
  }

  onPOVersionRowSelectionChanged(event: any): void {
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
        console.log('[ROW SELECT] versionPOID set to:', this.versionPOID, '| type:', this.type);
        console.log('[ROW SELECT] Loading PartList table');
        this.loadDataProjectPartList();
      } else {
        console.error('[ROW SELECT] Could not get data for row index:', rowIndex);
      }
    } else {
      // Kiểm tra xem còn row nào được chọn không
      const allSelectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (allSelectedRows.length === 0) {
        this.versionPOID = 0;
        this.type = 0;
        this.resetPartlistTable();
      }
    }
  }

  private resetPartlistTable(): void {
    this.dataProjectPartList = [];
    this.versionID = 0;
    this.versionPOID = 0;
    this.type = 0;
    if (this.angularGridPartList) {
      this.angularGridPartList.dataView.setItems([]);
      this.angularGridPartList.dataView.refresh();
      this.angularGridPartList.slickGrid.invalidate();
      this.angularGridPartList.slickGrid.render();
    }
  }

  // Placeholder methods for future implementation
  openProjectSolutionDetail(isEdit: boolean): void {
    // TODO: Implement
  }

  openProjectSolutionVersionDetail(typenumber: number, isEdit: boolean): void {
    if (isEdit) {
      let selectedData: any[] = [];
      if (typenumber === 1) {
        selectedData = this.angularGridSolutionVersion?.dataView?.getItems()?.filter((_: any, i: number) => 
          this.angularGridSolutionVersion?.slickGrid?.getSelectedRows()?.includes(i)) || [];
      } else {
        selectedData = this.angularGridPOVersion?.dataView?.getItems()?.filter((_: any, i: number) => 
          this.angularGridPOVersion?.slickGrid?.getSelectedRows()?.includes(i)) || [];
      }
      if (!selectedData || selectedData.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để sửa!');
        return;
      }
    }
    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'lg',
      keyboard: false,
      backdrop: 'static',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.typenumber = typenumber;
    modalRef.componentInstance.isEdit = isEdit;
    if (isEdit) {
      const selectedData = typenumber === 1 
        ? this.angularGridSolutionVersion?.dataView?.getItems()?.filter((_: any, i: number) => 
            this.angularGridSolutionVersion?.slickGrid?.getSelectedRows()?.includes(i))[0]
        : this.angularGridPOVersion?.dataView?.getItems()?.filter((_: any, i: number) => 
            this.angularGridPOVersion?.slickGrid?.getSelectedRows()?.includes(i))[0];
      modalRef.componentInstance.versionData = selectedData;
    }
    modalRef.result.then((result: any) => {
      if (result && result.success) {
        if (typenumber === 1) {
          this.loadDataProjectPartListVersion();
        } else {
          this.loadDataProjectPartListVersionPO();
        }
      }
    }).catch(() => {});
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
      const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư để sửa!');
        return;
      }
    }
    const modalRef = this.ngbModal.open(ProjectPartlistDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCodex;
    modalRef.componentInstance.versionId = selectedVersionID;
    modalRef.componentInstance.type = this.type;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.projectTypeId = this.projectTypeID;
    modalRef.componentInstance.projectTypeName = this.projectTypeName;
    modalRef.componentInstance.isEdit = isEdit;
    if (isEdit) {
      const selectedRows = this.angularGridPartList?.slickGrid?.getSelectedRows() || [];
      const selectedData = selectedRows.map((i: number) => this.angularGridPartList?.dataView?.getItem(i));
      modalRef.componentInstance.selectedData = selectedData[0];
    }
    modalRef.result.then((result: any) => {
      if (result && result.success) {
        this.loadDataProjectPartList();
      }
    }).catch(() => {});
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
      IsLeaf: !row._children || row._children.length === 0,
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
      const isLeaf = !row._children || row._children.length === 0;
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
        const requestItems = selectedRows.map((row: any) => ({
          ID: row.ID,
          STT: row.STT,
          ProductCode: row.ProductCode,
          GroupMaterial: row.GroupMaterial,
          Manufacturer: row.Manufacturer,
          QtyMin: row.QtyMin,
          QtyFull: row.QtyFull,
          ParentID: row.ParentID,
          IsLeaf: !row._children || row._children.length === 0,
          DeadlinePriceRequest: this.deadlinePriceRequest?.toISOString()
        }));
        this.projectPartListService.requestPrice(requestItems).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Yêu cầu báo giá thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể yêu cầu báo giá');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể yêu cầu báo giá');
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
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy yêu cầu báo giá',
      nzContent: `Bạn có chắc chắn muốn hủy yêu cầu báo giá cho ${selectedRows.length} vật tư?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const requestItems = selectedRows.map((row: any) => ({
          ID: row.ID,
          STT: row.STT,
          IsLeaf: !row._children || row._children.length === 0
        }));
        this.projectPartListService.cancelPriceRequest(requestItems).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Hủy yêu cầu báo giá thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể hủy yêu cầu báo giá');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể hủy yêu cầu báo giá');
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
        const requestItems = selectedRows.map((row: any) => ({
          ID: row.ID,
          STT: row.STT,
          TT: row.TT,
          IsLeaf: !row._children || row._children.length === 0,
          DeadlinePur: this.deadlinePurchaseRequest?.toISOString()
        }));
        this.projectPartListService.approvePurchaseRequest(requestItems, true, this.projectTypeID, this.projectSolutionId, this.projectId).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Yêu cầu mua hàng thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể yêu cầu mua hàng');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', error?.error?.message || 'Không thể yêu cầu mua hàng');
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
          IsLeaf: !row._children || row._children.length === 0
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
        const ids = selectedRows.map((row: any) => row.ID);
        this.projectPartListService.deletePartList(ids.map((id: number) => ({ ID: id, ReasonDeleted: this.reasonDeleted }))).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Xóa vật tư thành công!');
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Không thể xóa vật tư');
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
    let selectedData: any = null;
    if (typenumber === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để xóa!');
        return;
      }
      selectedData = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
    } else {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để xóa!');
        return;
      }
      selectedData = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
    }
    if (!selectedData || !selectedData.ID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản!');
      return;
    }
    this.reasonDeletedVersion = '';
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa phiên bản',
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
        // TODO: Add deleteProjectPartListVersion method to ProjectPartListService if needed
        this.notification.info('Thông báo', 'Chức năng xóa phiên bản đang được phát triển');
        return true;
      }
    });
  }

  // Yêu cầu xuất kho
  requestExportByWarehouse(warehouseCode: string): void {
    const selectedRows = this.getSelectedPartListRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần xuất kho');
      return;
    }
    const modalRef = this.ngbModal.open(BillExportDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCodex;
    modalRef.componentInstance.warehouseCode = warehouseCode;
    modalRef.componentInstance.selectedPartList = selectedRows;
    modalRef.result.then((result: any) => {
      if (result && result.success) {
        this.loadDataProjectPartList();
      }
    }).catch(() => {});
  }

  // Mở form xuất Excel
  openFormExportExcelPartlist(): void {
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
    }).catch(() => {});
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

  // Tính toán tree data
  calculateWorkerTree(data: any[]): any[] {
    if (!data || data.length === 0) return [];
    const map = new Map<number, any>();
    const tree: any[] = [];
    data.forEach(item => {
      map.set(item.ID, { ...item, id: item.ID, _children: [] });
    });
    data.forEach(item => {
      const node = map.get(item.ID)!;
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });
    return tree;
  }
}
