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
  AngularSlickgridModule
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
    if (this.tabData?.tbp) {
      this.tbp = this.tabData.tbp;
    }
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.isApprovedPurchase = -1;
    
    // Initialize grids in ngOnInit to ensure options are ready before grid renders
    this.initializeGrids();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadProjects();
      this.loadWarehouses();
      this.authService.getCurrentUser().subscribe((user: any) => {
        this.currentUser = user.data;
      });
      // Load data sau khi grids đã được khởi tạo
      setTimeout(() => {
        this.loadDataSolution();
      }, 200);
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Initialize all grids
  initializeGrids(): void {
    this.initSolutionGrid();
    if (!this.isPOKH) {
      this.initSolutionVersionGrid();
    }
    this.initPOVersionGrid();
    this.initPartListGrid();
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
        name: 'PO',
        width: 50,
        sortable: false,
        filterable: false,
        formatter: Formatters.iconBoolean,
      },
      {
        id: 'IsApprovedPO',
        field: 'IsApprovedPO',
        name: 'Duyệt PO',
        width: 80,
        sortable: false,
        filterable: false,
        formatter: Formatters.iconBoolean,
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
      {
        id: 'ID',
        field: 'ID',
        name: 'ID',
        width: 0,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromQuery: true,
      },
      {
        id: 'IsActive',
        field: 'IsActive',
        name: 'Sử dụng',
        width: 80,
        formatter: Formatters.iconBoolean,
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
      {
        id: 'ID',
        field: 'ID',
        name: 'ID',
        width: 0,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromQuery: true,
      },
      {
        id: 'IsActive',
        field: 'IsActive',
        name: 'Sử dụng',
        width: 80,
        formatter: Formatters.iconBoolean,
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
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      enableFiltering: true,
      enableSorting: true,
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
    this.angularGridSolution = event.detail;
    // Load data nếu chưa có
    if (this.dataSolution.length === 0 && this.projectId > 0) {
      setTimeout(() => this.loadDataSolution(), 100);
    }
  }

  onSolutionVersionGridReady(event: any): void {
    this.angularGridSolutionVersion = event.detail;
    // Load data nếu đã có projectSolutionId
    if (this.dataSolutionVersion.length === 0 && this.projectSolutionId > 0) {
      setTimeout(() => this.loadDataProjectPartListVersion(), 100);
    }
  }

  onPOVersionGridReady(event: any): void {
    this.angularGridPOVersion = event.detail;
    // Load data nếu đã có projectSolutionId
    if (this.dataPOVersion.length === 0 && this.projectSolutionId > 0) {
      setTimeout(() => this.loadDataProjectPartListVersionPO(), 100);
    }
  }

  onPartListGridReady(event: any): void {
    this.angularGridPartList = event.detail;
    // Load data nếu đã có versionID hoặc versionPOID
    if (this.dataProjectPartList.length === 0 && (this.versionID > 0 || this.versionPOID > 0)) {
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
    if (!this.angularGridSolution) {
      setTimeout(() => this.loadDataSolution(), 100);
      return;
    }
    if (this.projectId === 0) {
      return;
    }
    this.startLoading();
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          let data = response.data || [];
          // Thêm STT và id cho mỗi dòng
          data = data.map((item: any, index: number) => ({
            ...item,
            STT: index + 1,
            id: item.ID || index
          }));
          this.dataSolution = data;
          if (this.angularGridSolution) {
            this.angularGridSolution.dataView.setItems(this.dataSolution);
            this.angularGridSolution.dataView.refresh();
            this.angularGridSolution.slickGrid.invalidate();
            this.angularGridSolution.slickGrid.render();
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
    const selectedRows = event.detail.args.rows || [];
    if (selectedRows.length > 0) {
      const data = selectedRows[0].dataContext;
      this.projectSolutionId = data.ID;
      this.selectionProjectSolutionName = data.CodeSolution;
      // Load phiên bản giải pháp và PO
      if (!this.isPOKH) {
        this.loadDataProjectPartListVersion();
      }
      this.loadDataProjectPartListVersionPO();
      // Reset bảng partlist vì chưa chọn phiên bản nào
      this.resetPartlistTable();
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
    const selectedRows = event.detail.args.rows || [];
    if (selectedRows.length > 0) {
      const data = selectedRows[0].dataContext;
      this.versionID = data.ID;
      this.versionPOID = 0; // Reset PO version
      this.type = 1;
      this.loadDataProjectPartList();
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
    const selectedRows = event.detail.args.rows || [];
    if (selectedRows.length > 0) {
      const data = selectedRows[0].dataContext;
      this.versionPOID = data.ID;
      this.versionID = 0; // Reset solution version
      this.type = 2;
      this.loadDataProjectPartList();
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
    // TODO: Implement
  }

  openProjectPartlistDetail(isEdit: boolean): void {
    // TODO: Implement
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

  // TODO: Add all other methods from project-part-list.component.ts
  // This is a skeleton - more methods need to be added
}
