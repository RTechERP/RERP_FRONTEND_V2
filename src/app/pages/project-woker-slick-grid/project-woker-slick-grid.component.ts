import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  MultipleSelectOption,
  AngularSlickgridModule,
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { Subscription } from 'rxjs';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectWorkerService } from '../project/project-department-summary/project-department-summary-form/project-woker/project-worker-service/project-worker.service';
import { ProjectSolutionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-detail/project-solution-detail.component';
import { ProjectSolutionVersionDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-solution-version-detail/project-solution-version-detail.component';
import { ProjectWorkerDetailComponent } from '../project/project-department-summary/project-department-summary-form/project-worker-detail/project-worker-detail.component';
import { ImportExcelProjectWorkerComponent } from '../project/project-department-summary/project-department-summary-form/import-excel-project-worker/import-excel-project-worker.component';
@Component({
  selector: 'app-project-woker-slick-grid',
  templateUrl: './project-woker-slick-grid.component.html',
  styleUrl: './project-woker-slick-grid.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzSpinModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    HasPermissionDirective,
  ],
})
export class ProjectWokerSlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';

  // Grid instances
  angularGridSolution!: AngularGridInstance;
  angularGridSolutionVersion!: AngularGridInstance;
  angularGridPOVersion!: AngularGridInstance;
  angularGridProjectWorker!: AngularGridInstance;

  // Column definitions
  solutionColumns: Column[] = [];
  solutionVersionColumns: Column[] = [];
  poVersionColumns: Column[] = [];
  projectWorkerColumns: Column[] = [];

  // Grid options
  solutionGridOptions!: GridOption;
  solutionVersionGridOptions!: GridOption;
  poVersionGridOptions!: GridOption;
  projectWorkerGridOptions!: GridOption;

  // Grid ready flag
  gridsInitialized = false;

  // Data
  dataProjectWorker: any[] = [];
  dataSolution: any[] = [];
  dataSolutionVersion: any[] = [];
  dataPOVersion: any[] = [];
  treeWorkerData: any[] = [];

  // State variables
  sizeLeftPanel: string = '';
  sizeRightPanel: string = '';
  projectSolutionId: number = 0;
  selectionCode: string = '';
  projectTypeID: number = 0;
  projectTypeName: string = '';
  projectCode: string = '';
  selectionProjectSolutionName: string = '';

  // Worker filters
  isDeleted: number = 0;
  isApprovedTBP: number = -1;
  keyword: string = '';
  versionID: number = 0;
  type: number = 0;
  isLoading: boolean = false;

  // Selection tracking
  lastClickedWorkerRow: any = null;
  isTogglingChildren: boolean = false;
  previousSelectedRows: Set<number> = new Set();

  // Loading management
  private loadingCounter: number = 0;
  private loadingTimeout: any = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.initializeGrids();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.gridsInitialized = true;
      setTimeout(() => {
        this.loadDataSolution();
      }, 100);
    }, 300);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  //#region Grid Initialization
  initializeGrids(): void {
    this.initSolutionGrid();
    this.initSolutionVersionGrid();
    this.initPOVersionGrid();
    this.initProjectWorkerGrid();
  }

  initSolutionGrid(): void {
    this.solutionColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 50, sortable: true, cssClass: 'text-center' },
      {
        id: 'StatusSolution', field: 'StatusSolution', name: 'PO', width: 50,
        formatter: (row, cell, value) => `<input type="checkbox" ${value === 1 ? 'checked' : ''} disabled style="pointer-events: none;" />`,
        cssClass: 'text-center',
      },
      {
        id: 'IsApprovedPO', field: 'IsApprovedPO', name: 'Duyệt PO', width: 70,
        formatter: (row, cell, value) => `<input type="checkbox" ${value === true ? 'checked' : ''} disabled style="pointer-events: none;" />`,
        cssClass: 'text-center',
      },
      { id: 'DateSolution', field: 'DateSolution', name: 'Ngày GP', width: 100, sortable: true, formatter: Formatters.dateIso },
      { id: 'CodeSolution', field: 'CodeSolution', name: 'Mã GP', width: 100, sortable: true },
      { id: 'ContentSolution', field: 'ContentSolution', name: 'Nội dung', width: 300, sortable: true },
    ];

    this.solutionGridOptions = {
      enableAutoResize: true,
      autoResize: { container: '.grid-solution-container', calculateAvailableSizeBy: 'container' },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableSorting: true,
      enablePagination: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
    };
  }

  initSolutionVersionGrid(): void {
    this.solutionVersionColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 50, cssClass: 'text-center' },
      {
        id: 'IsActive', field: 'IsActive', name: 'Sử dụng', width: 70,
        formatter: (row, cell, value) => `<input type="checkbox" ${value === true ? 'checked' : ''} disabled style="pointer-events: none;" />`,
        cssClass: 'text-center',
      },
      { id: 'Code', field: 'Code', name: 'Mã', width: 60 },
      {
        id: 'DescriptionVersion', field: 'DescriptionVersion', name: 'Mô tả', width: 200,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.DescriptionVersion}"
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
      { id: 'UpdatedBy', field: 'UpdatedBy', name: 'Người duyệt', width: 100 },
    ];

    this.solutionVersionGridOptions = {
      enableAutoResize: true,
      autoResize: { container: '.grid-solution-version-container', calculateAvailableSizeBy: 'container' },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableSorting: true,
      enablePagination: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      contextMenu: {
        commandTitle: 'Thao tác',
        commandItems: [
          {
            command: 'activate',
            title: 'Sử dụng',
            positionOrder: 1,
            action: (e: Event, args: any) => {
              const rowData = args?.dataContext || args?.item;
              if (rowData && rowData.ID) {
                this.approvedActiveVersion(rowData.ID, true, 1);
              }
            },
          },
          {
            command: 'deactivate',
            title: 'Không sử dụng',
            positionOrder: 2,
            action: (e: Event, args: any) => {
              const rowData = args?.dataContext || args?.item;
              if (rowData && rowData.ID) {
                this.approvedActiveVersion(rowData.ID, false, 1);
              }
            },
          },
        ],
      },
    };
  }

  initPOVersionGrid(): void {
    this.poVersionColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 50, cssClass: 'text-center' },
      {
        id: 'IsActive', field: 'IsActive', name: 'Sử dụng', width: 70,
        formatter: (row, cell, value) => `<input type="checkbox" ${value === true ? 'checked' : ''} disabled style="pointer-events: none;" />`,
        cssClass: 'text-center',
      },
      { id: 'Code', field: 'Code', name: 'Mã', width: 80 },
      {
        id: 'DescriptionVersion', field: 'DescriptionVersion', name: 'Mô tả', width: 200,
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.DescriptionVersion}"
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
      { id: 'UpdatedBy', field: 'UpdatedBy', name: 'Người duyệt', width: 100 },
    ];

    this.poVersionGridOptions = {
      enableAutoResize: true,
      autoResize: { container: '.grid-po-version-container', calculateAvailableSizeBy: 'container' },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableSorting: true,
      enablePagination: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      contextMenu: {
        commandTitle: 'Thao tác',
        commandItems: [
          {
            command: 'activate',
            title: 'Sử dụng',
            positionOrder: 1,
            action: (e: Event, args: any) => {
              const rowData = args?.dataContext || args?.item;
              if (rowData && rowData.ID) {
                this.approvedActiveVersion(rowData.ID, true, 2);
              }
            },
          },
          {
            command: 'deactivate',
            title: 'Không sử dụng',
            positionOrder: 2,
            action: (e: Event, args: any) => {
              const rowData = args?.dataContext || args?.item;
              if (rowData && rowData.ID) {
                this.approvedActiveVersion(rowData.ID, false, 2);
              }
            },
          },
        ],
      },
    };
  }

  initProjectWorkerGrid(): void {
    const moneyFormatter = (row: number, cell: number, value: any) => {
      if (value == null || value === '') return '';
      return Number(value).toLocaleString('vi-VN');
    };

    this.projectWorkerColumns = [
      {
        id: 'TT', field: 'TT', name: 'TT', width: 150, formatter: Formatters.tree,
        sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsApprovedTBPText', field: 'IsApprovedTBPText', name: 'TBP duyệt', width: 90,
        cssClass: 'text-center',
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [{ value: 'Đã duyệt', label: 'Đã duyệt' }, { value: 'Chưa duyệt', label: 'Chưa duyệt' }],
          filterOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'WorkContent', field: 'WorkContent', name: 'Nội dung công việc', width: 500,
        filterable: true, filter: { model: Filters['compoundInputText'], },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          return `
            <span
              title="${dataContext.WorkContent}"
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
        id: 'AmountPeople', field: 'AmountPeople', name: 'Số người', width: 70,
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        formatter: (row, cell, value, col, dataContext) => dataContext.__hasChildren ? '' : (value ?? ''),
      },
      {
        id: 'NumberOfDay', field: 'NumberOfDay', name: 'Số ngày', width: 70,
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
        formatter: (row, cell, value, col, dataContext) => dataContext.__hasChildren ? '' : (value ?? ''),
      },
      {
        id: 'TotalWorkforce', field: 'TotalWorkforce', name: 'Tổng nhân công', width: 110,
        cssClass: 'text-right', formatter: moneyFormatter,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'Price', field: 'Price', name: 'Đơn giá', width: 100,
        cssClass: 'text-right',
        formatter: (row, cell, value, col, dataContext) => {
          if (dataContext.__hasChildren) return '';
          return value ? Number(value).toLocaleString('vi-VN') : '';
        },
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
      },
      {
        id: 'TotalPrice', field: 'TotalPrice', name: 'Thành tiền',
        cssClass: 'text-right', formatter: moneyFormatter,
        filterable: true,
        filter: { model: Filters['compoundInputNumber'] },
      },
    ];

    this.projectWorkerGridOptions = {
      enableAutoResize: true,
      autoResize: { container: '.grid-project-worker-container', calculateAvailableSizeBy: 'container' },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      checkboxSelector: { hideSelectAllCheckbox: false },
      rowSelectionOptions: { selectActiveRow: false },
      enableSorting: true,
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: true,
      headerRowHeight: 35,
      rowHeight: 35,
      enablePagination: false,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'TT',
        parentPropName: 'ParentID',
        childrenPropName: '_children',
        levelPropName: '__treeLevel',
        hasChildrenPropName: '__hasChildren',
        initiallyCollapsed: false,
      },
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 35,
    };
  }
  //#endregion

  //#region Grid Ready Events
  onSolutionGridReady(event: any): void {
    this.angularGridSolution = event.detail;

    // Subscribe to row selection changed event
    if (this.angularGridSolution?.slickGrid) {
      this.angularGridSolution.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        const selectedRows = this.angularGridSolution.slickGrid.getSelectedRows();
        if (selectedRows && selectedRows.length > 0) {
          const row = selectedRows[0];
          const rowData = this.angularGridSolution.dataView?.getItem(row);
          if (rowData) {
            this.projectSolutionId = rowData.ID;
            this.selectionProjectSolutionName = rowData.CodeSolution;
            // Chỉ gọi loadDataSolutionVersion(), nó sẽ tự gọi loadDataPOVersion() nếu cần
            this.loadDataSolutionVersion();
            this.clearWorkerTable();
          }
        }
      });
    }
  }

  onSolutionVersionGridReady(event: any): void {
    this.angularGridSolutionVersion = event.detail;

    // Subscribe to row selection changed event
    if (this.angularGridSolutionVersion?.slickGrid) {
      this.angularGridSolutionVersion.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        console.log('[SolutionVersion] onSelectedRowsChanged - type:', this.type);
        console.log('[SolutionVersion] selectedRows:', this.angularGridSolutionVersion.slickGrid.getSelectedRows());
        console.log('[SolutionVersion] previousSelectedRows:', args.previousSelectedRows);

        const selectedRows = this.angularGridSolutionVersion.slickGrid.getSelectedRows();
        if (selectedRows && selectedRows.length > 0) {
          const row = selectedRows[0];
          const rowData = this.angularGridSolutionVersion.dataView?.getItem(row);
          if (rowData) {
            console.log('[SolutionVersion] Selected row:', rowData);
            this.selectionCode = rowData.Code;
            this.versionID = rowData.ID || 0;
            this.type = 1;
            // Clear selection của PO Version grid
            console.log('[SolutionVersion] Clearing PO Version selection...');
            if (this.angularGridPOVersion?.slickGrid) {
              // Disable selectActiveRow tạm thời để tránh auto-select lại
              const currentSelectActiveRow = this.angularGridPOVersion.slickGrid.getOptions().rowSelectionOptions?.selectActiveRow;
              this.angularGridPOVersion.slickGrid.setOptions({ rowSelectionOptions: { selectActiveRow: false } });
              this.angularGridPOVersion.slickGrid.setSelectedRows([]);
              setTimeout(() => {
                this.angularGridPOVersion.slickGrid.setOptions({ rowSelectionOptions: { selectActiveRow: currentSelectActiveRow } });
              }, 0);
              console.log('[SolutionVersion] PO Version selection cleared');
            }
            this.toggleTBPColumn();
            this.loadDataProjectWorker();
          }
        } else {
          // Row deselected - clear worker table
          console.log('[SolutionVersion] Row deselected, clearing worker table');
          this.versionID = 0;
          this.clearWorkerTable();
        }
      });
    }
  }

  onPOVersionGridReady(event: any): void {
    this.angularGridPOVersion = event.detail;

    // Subscribe to row selection changed event
    if (this.angularGridPOVersion?.slickGrid) {
      this.angularGridPOVersion.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        console.log('[POVersion] onSelectedRowsChanged - type:', this.type);
        console.log('[POVersion] selectedRows:', this.angularGridPOVersion.slickGrid.getSelectedRows());
        console.log('[POVersion] previousSelectedRows:', args.previousSelectedRows);

        const selectedRows = this.angularGridPOVersion.slickGrid.getSelectedRows();
        if (selectedRows && selectedRows.length > 0) {
          const row = selectedRows[0];
          const rowData = this.angularGridPOVersion.dataView?.getItem(row);
          if (rowData) {
            console.log('[POVersion] Selected row:', rowData);
            this.selectionCode = rowData.Code;
            this.projectTypeID = rowData.ProjectTypeID;
            this.projectTypeName = rowData.ProjectTypeName;
            this.projectCode = rowData.ProjectCode;
            this.versionID = rowData.ID || 0;
            this.type = 2;
            // Clear selection của Solution Version grid
            console.log('[POVersion] Clearing Solution Version selection...');
            if (this.angularGridSolutionVersion?.slickGrid) {
              // Disable selectActiveRow tạm thời để tránh auto-select lại
              const currentSelectActiveRow = this.angularGridSolutionVersion.slickGrid.getOptions().rowSelectionOptions?.selectActiveRow;
              this.angularGridSolutionVersion.slickGrid.setOptions({ rowSelectionOptions: { selectActiveRow: false } });
              this.angularGridSolutionVersion.slickGrid.setSelectedRows([]);
              setTimeout(() => {
                this.angularGridSolutionVersion.slickGrid.setOptions({ rowSelectionOptions: { selectActiveRow: currentSelectActiveRow } });
              }, 0);
              console.log('[POVersion] Solution Version selection cleared');
            }
            this.toggleTBPColumn();
            this.loadDataProjectWorker();
          }
        } else {
          // Row deselected - clear worker table
          console.log('[POVersion] Row deselected, clearing worker table');
          this.versionID = 0;
          this.clearWorkerTable();
        }
      });
    }
  }

  onProjectWorkerGridReady(event: any): void {
    this.angularGridProjectWorker = event.detail;

    // Thêm event handler cho checkbox selection
    if (this.angularGridProjectWorker?.slickGrid) {
      this.angularGridProjectWorker.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        this.onProjectWorkerRowSelectionChanged(e, args);
      });
    }

    this.updateFooterTotals();
  }

  // Handler cho checkbox selection - TỰ ĐỘNG CHỌN CON KHI CHỌN CHA
  onProjectWorkerRowSelectionChanged(e: any, args: any): void {
    if (!this.angularGridProjectWorker) {
      return;
    }

    const dataView = this.angularGridProjectWorker.dataView;
    const slickGrid = this.angularGridProjectWorker.slickGrid;

    const currentSelectedRows = new Set<number>(args.rows || []);
    const previousSelectedRows = new Set<number>(args.previousSelectedRows || []);

    const changedRows = new Set<number>();

    currentSelectedRows.forEach(rowNum => {
      if (!previousSelectedRows.has(rowNum)) {
        changedRows.add(rowNum);
      }
    });

    previousSelectedRows.forEach(rowNum => {
      if (!currentSelectedRows.has(rowNum)) {
        changedRows.add(rowNum);
      }
    });

    const finalSelection = new Set(currentSelectedRows);

    changedRows.forEach((rowNum: number) => {
      const item = dataView.getItem(rowNum);
      if (!item) return;

      const isSelecting = currentSelectedRows.has(rowNum);
      const isParent = item.__hasChildren === true;

      if (isParent) {
        this.processWorkerChildrenSelection(item, dataView, slickGrid, isSelecting, finalSelection);
      }
    });

    const newSelectedRows = Array.from(finalSelection);
    slickGrid.setSelectedRows(newSelectedRows);
  }

  private processWorkerChildrenSelection(parentItem: any, dataView: any, slickGrid: any, isSelecting: boolean, finalSelection: Set<number>, visited = new Set<number>()): void {
    if (visited.has(parentItem.id)) return;
    visited.add(parentItem.id);

    const allItems = dataView.getItems();
    const children = allItems.filter((item: any) => item.ParentID === parentItem.id);

    children.forEach((child: any) => {
      const childRowNum = dataView.getRowById(child.id);
      if (childRowNum !== undefined) {
        if (isSelecting) {
          finalSelection.add(childRowNum as number);
        } else {
          finalSelection.delete(childRowNum as number);
        }

        if (child.__hasChildren === true) {
          this.processWorkerChildrenSelection(child, dataView, slickGrid, isSelecting, finalSelection, visited);
        }
      }
    });
  }
  //#endregion

  //#region Row Click Events
  onSolutionRowClick(event: any): void {
    if (event.detail?.args) {
      const row = event.detail.args.row;
      const rowData = this.angularGridSolution?.dataView?.getItem(row);
      if (rowData) {
        this.projectSolutionId = rowData.ID;
        this.selectionProjectSolutionName = rowData.CodeSolution;
        // Chỉ gọi loadDataSolutionVersion(), nó sẽ tự gọi loadDataPOVersion() nếu cần
        this.loadDataSolutionVersion();
        this.clearWorkerTable();
      }
    }
  }

  onSolutionVersionRowClick(event: any): void {
    if (event.detail?.args) {
      const row = event.detail.args.row;
      const rowData = this.angularGridSolutionVersion?.dataView?.getItem(row);
      if (rowData) {
        this.selectionCode = rowData.Code;
        this.versionID = rowData.ID || 0;
        this.type = 1;
        if (this.angularGridPOVersion?.slickGrid) {
          this.angularGridPOVersion.slickGrid.setSelectedRows([]);
        }
        this.toggleTBPColumn();
        this.loadDataProjectWorker();
      }
    }
  }

  onPOVersionRowClick(event: any): void {
    if (event.detail?.args) {
      const row = event.detail.args.row;
      const rowData = this.angularGridPOVersion?.dataView?.getItem(row);
      if (rowData) {
        this.selectionCode = rowData.Code;
        this.projectTypeID = rowData.ProjectTypeID;
        this.projectTypeName = rowData.ProjectTypeName;
        this.projectCode = rowData.ProjectCode;
        this.versionID = rowData.ID || 0;
        this.type = 2;
        if (this.angularGridSolutionVersion?.slickGrid) {
          this.angularGridSolutionVersion.slickGrid.setSelectedRows([]);
        }
        this.toggleTBPColumn();
        this.loadDataProjectWorker();
      }
    }
  }

  onProjectWorkerRowClick(event: any): void {
    if (event.detail?.args) {
      const row = event.detail.args.row;
      const rowData = this.angularGridProjectWorker?.dataView?.getItem(row);
      if (rowData) {
        this.lastClickedWorkerRow = rowData;
      }
    }
  }

  updateFooterTotals(): void {
    if (!this.angularGridProjectWorker?.slickGrid) return;
    let totalWorkforce = 0;
    let totalPrice = 0;
    this.treeWorkerData.forEach((root: any) => {
      totalWorkforce += Number(root.TotalWorkforce) || 0;
      totalPrice += Number(root.TotalPrice) || 0;
    });
    const grid = this.angularGridProjectWorker.slickGrid;
    const footerWorkforce = grid.getFooterRowColumn('TotalWorkforce');
    const footerPrice = grid.getFooterRowColumn('TotalPrice');
    if (footerWorkforce) footerWorkforce.innerHTML = `<b>${totalWorkforce.toLocaleString('vi-VN')}</b>`;
    if (footerPrice) footerPrice.innerHTML = `<b>${totalPrice.toLocaleString('vi-VN')}</b>`;
  }
  //#endregion

  //#region Loading Management
  private startLoading(): void {
    this.loadingCounter++;
    this.isLoading = true;
    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => {
      this.loadingCounter = 0;
      this.isLoading = false;
    }, 30000);
  }

  private stopLoading(): void {
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
  //#endregion

  //#region Data Loading
  loadDataSolution(): void {
    this.startLoading();
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataSolution = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID || `sol_${index}`,
          }));
          this.clearVersionTables();
          this.clearWorkerTable();
          this.projectSolutionId = 0;

          // Auto-select first row and load version data
          if (this.dataSolution.length > 0 && this.angularGridSolution?.slickGrid) {
            setTimeout(() => {
              this.angularGridSolution.slickGrid.setSelectedRows([0]);
              // Trigger row selection event manually
              const firstRowData = this.dataSolution[0];
              this.projectSolutionId = firstRowData.ID;
              this.selectionProjectSolutionName = firstRowData.CodeSolution;
              // Load cả 2 bảng phiên bản nhưng KHÔNG focus vào dòng nào
              this.loadDataSolutionVersion();
              this.loadDataPOVersion();
            }, 100);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu giải pháp');
        this.stopLoading();
      },
    });
  }

  clearVersionTables(): void {
    this.dataSolutionVersion = [];
    this.dataPOVersion = [];
    this.versionID = 0;
    this.type = 0;
  }

  clearWorkerTable(): void {
    this.dataProjectWorker = [];
    this.treeWorkerData = [];
  }

  loadDataSolutionVersion(): void {
    this.startLoading();
    this.projectWorkerService.getSolutionVersion(this.projectSolutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataSolutionVersion = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID || `sv_${index}`,
          }));

          // KHÔNG auto-select dòng nào, chỉ load dữ liệu
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error.message);
        this.stopLoading();
      },
    });
  }

  searchDataProjectWorker(): void {
    this.loadDataProjectWorker();
  }

  loadDataPOVersion(): void {
    this.startLoading();
    this.projectWorkerService.getPOVersion(this.projectSolutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataPOVersion = (response.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID || `po_${index}`,
          }));

          // KHÔNG auto-select dòng nào, chỉ load dữ liệu
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error.message);
        this.stopLoading();
      },
    });
  }

  loadDataProjectWorker(): void {
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
      }
    } else if (this.type === 2) {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
      }
    }

    const payload = {
      projectID: this.projectId || 0,
      projectWorkerTypeID: 0,
      IsApprovedTBP: this.isApprovedTBP || -1,
      IsDeleted: this.isDeleted || 0,
      KeyWord: this.keyword || '',
      versionID: selectedVersionID || 0,
    };

    this.startLoading();
    this.projectWorkerService.getProjectWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const rawData = response.data || [];
          const treeData = this.calculateWorkerTree(rawData);
          this.treeWorkerData = treeData;
          this.dataProjectWorker = this.flattenTreeForSlickGrid(treeData);

          // Apply row styling after data is loaded
          setTimeout(() => {
            this.applyRowStyling();
            this.updateFooterTotals();
            this.stopLoading();
          }, 100);
        } else {
          this.notification.error('Lỗi', response.message);
          this.stopLoading();
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu nhân công');
        this.stopLoading();
      },
    });
  }

  private applyRowStyling(): void {
    if (!this.angularGridProjectWorker?.dataView) return;

    this.angularGridProjectWorker.dataView.getItemMetadata = (row: number) => {
      const item = this.angularGridProjectWorker?.dataView?.getItem(row);
      if (!item) return {};

      const metadata: any = { cssClasses: '' };

      // 1. Ưu tiên: Dòng bị xóa → đỏ
      if (item.IsDeleted === true) {
        metadata.cssClasses = 'row-deleted';
      }
      // 2. Dòng CHA → lightyellow + bold (chỉ khi KHÔNG bị xóa)
      else if (item.__hasChildren === true) {
        metadata.cssClasses = 'row-parent';
      }

      return metadata;
    };

    // Force refresh to apply styling
    this.angularGridProjectWorker.dataView.refresh();
    this.angularGridProjectWorker.slickGrid?.invalidate();
    this.angularGridProjectWorker.slickGrid?.render();
  }

  flattenTreeForSlickGrid(tree: any[], parentId: number | null = null, level: number = 0): any[] {
    const result: any[] = [];

    tree.forEach((node) => {
      const hasChildren = node._children && node._children.length > 0;

      const flatNode = {
        ...node,
        id: node.ID,
        ParentID: parentId,
        __treeLevel: level,
        __hasChildren: hasChildren,
        __collapsed: false,
        // Keep original _children for row styling
        _children: node._children || [],
      };
      result.push(flatNode);

      if (hasChildren) {
        const children = this.flattenTreeForSlickGrid(node._children, node.ID, level + 1);
        result.push(...children);
      }
    });

    return result;
  }
  //#endregion

  //#region Actions
  updateApprove(action: number): void {
    const selectedRows = this.angularGridProjectWorker?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân công cần cập nhật');
      return;
    }

    const selectedData = selectedRows.map((idx: number) =>
      this.angularGridProjectWorker?.dataView?.getItem(idx)
    ).filter(Boolean);

    if (this.type === 1) {
      const svSelectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (svSelectedRows.length > 0) {
        const svData = this.angularGridSolutionVersion?.dataView?.getItem(svSelectedRows[0]);
        if (svData?.IsActive === false) {
          this.notification.warning('Thông báo', 'Vui lòng chọn sử dụng phiên bản ' + svData.Code + ' để cập nhật');
          return;
        }
      }
    } else {
      const poSelectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (poSelectedRows.length > 0) {
        const poData = this.angularGridPOVersion?.dataView?.getItem(poSelectedRows[0]);
        if (poData?.IsActive === false) {
          this.notification.warning('Thông báo', 'Vui lòng chọn sử dụng phiên bản PO ' + poData.Code + ' để cập nhật');
          return;
        }
      }
    }

    const payload = selectedData.map((row: any) => ({
      ID: row.ID,
      IsApprovedTBP: action === 1,
    }));

    this.projectWorkerService.saveWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Cập nhật trạng thái thành công!');
          this.loadDataProjectWorker();
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể cập nhật trạng thái duyệt');
      },
    });
  }

  toggleTBPColumn(): void {
    // SlickGrid column visibility handled differently - could hide/show column if needed
  }

  openImportExcelProjectWorker(): void {
    let selectedVersionID: number = 0;
    let selectedVersionCode: string = '';

    if (this.type === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
        selectedVersionCode = rowData?.Code || '';
      }
    } else if (this.type === 2) {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
        selectedVersionCode = rowData?.Code || '';
      }
    }

    const modalRef = this.ngbModal.open(ImportExcelProjectWorkerComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.projectCodex;
    modalRef.componentInstance.dataProjectWorker = this.dataProjectWorker;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.dataSolutionVersion = this.dataSolutionVersion;
    modalRef.componentInstance.dataPOVersion = this.dataPOVersion;
    modalRef.componentInstance.selectedVersionID = selectedVersionID;
    modalRef.componentInstance.selectedVersionCode = selectedVersionCode;
    modalRef.componentInstance.type = this.type;

    modalRef.result.then((result: any) => {
      if (result?.success) this.loadDataProjectWorker();
    }).catch(() => { });
  }
  //#endregion

  //#region Export Excel
  onExportExcel(): void {
    if (this.treeWorkerData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nhân công');

    const headers = ['TT', 'TBP duyệt', 'Nội dung công việc', 'Số người', 'Số ngày', 'Tổng nhân công', 'Đơn giá', 'Thành tiền'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const addNodeToSheet = (node: any, level: number = 0) => {
      const row = worksheet.addRow([
        '  '.repeat(level * 2) + (node.TT || ''),
        node.IsApprovedTBPText || '',
        node.WorkContent || '',
        node._children?.length > 0 ? '' : node.AmountPeople,
        node._children?.length > 0 ? '' : node.NumberOfDay,
        node.TotalWorkforce,
        node._children?.length > 0 ? '' : node.Price,
        node.TotalPrice,
      ]);

      [5, 6, 7, 8].forEach((idx) => {
        const cell = row.getCell(idx);
        if (cell.value) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });

      if (node._children?.length > 0) {
        node._children.forEach((child: any) => addNodeToSheet(child, level + 1));
      }
    };

    this.treeWorkerData.forEach((root: any) => addNodeToSheet(root));

    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, val.length + 3);
      });
      column.width = Math.min(maxLength, 50);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `NhanCongDuAn_${this.projectCodex}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  onExportExcelSolutionVersion(): void {
    if (this.dataSolutionVersion.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.exportSimpleExcel(this.dataSolutionVersion, 'Phiên bản giải pháp', `PhienBanGiaiPhapDuAn_${this.projectCodex}`);
  }

  onExportExcelPOVersion(): void {
    if (this.dataPOVersion.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.exportSimpleExcel(this.dataPOVersion, 'Phiên bản PO', `PhienBanPODuAn_${this.projectCodex}`);
  }

  private exportSimpleExcel(data: any[], sheetName: string, fileName: string): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = ['STT', 'Sử dụng', 'Mã', 'Mô tả', 'Người duyệt'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };

    data.forEach((item: any) => {
      worksheet.addRow([item.STT, item.IsActive ? 'Có' : 'Không', item.Code, item.DescriptionVersion, item.UpdatedBy]);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }
  //#endregion

  //#region Modal Operations
  openProjectSolutionDetail(isEdit: boolean): void {
    let selectedData: any = null;

    if (isEdit) {
      const selectedRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp');
        return;
      }
      selectedData = this.angularGridSolution?.dataView?.getItem(selectedRows[0]);
      this.projectSolutionId = selectedData?.ID || 0;
    } else {
      this.projectSolutionId = 0;
    }

    const modalRef = this.ngbModal.open(ProjectSolutionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.solutionId = this.projectSolutionId;
    if (isEdit && selectedData) {
      modalRef.componentInstance.solutionData = selectedData;
    }

    modalRef.result.then((result: any) => {
      if (result?.success) this.loadDataSolution();
    }).catch(() => { });
  }

  openProjectSolutionVersionDetail(typeNumber: number, isEdit: boolean): void {
    const selectedSolutionRows = this.angularGridSolution?.slickGrid?.getSelectedRows() || [];
    if (selectedSolutionRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp');
      return;
    }

    if (isEdit) {
      if (typeNumber === 1) {
        const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
          this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản giải pháp');
          return;
        }
      } else {
        const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length === 0) {
          this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản PO');
          return;
        }
      }
    }

    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.ProjectID = this.projectId;
    modalRef.componentInstance.typeNumber = typeNumber;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.SolutionTypeID = typeNumber;
    modalRef.componentInstance.versionData = typeNumber === 1 ? this.dataSolutionVersion : this.dataPOVersion;

    if (isEdit) {
      const selectedRows = typeNumber === 1
        ? this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || []
        : this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];

      const dataView = typeNumber === 1
        ? this.angularGridSolutionVersion?.dataView
        : this.angularGridPOVersion?.dataView;

      if (selectedRows.length > 0 && dataView) {
        const row = dataView.getItem(selectedRows[0]);
        modalRef.componentInstance.ProjectTypeID = row.ProjectTypeID;
        modalRef.componentInstance.VersionCode = row.Code;
        modalRef.componentInstance.STT = row.STT;
        modalRef.componentInstance.IsActive = row.IsActive;
        modalRef.componentInstance.DescriptionVersion = row.DescriptionVersion;
        modalRef.componentInstance.ProjectworkerID = row.ID;
      }
    }

    modalRef.result.then((result: any) => {
      if (result?.success) {
        this.loadDataSolutionVersion();
        this.loadDataPOVersion();
      }
    }).catch(() => { });
  }

  deleteProjectSolutionVersion(typeNumber: number): void {
    let ID: number = 0;

    if (typeNumber === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản giải pháp');
        return;
      }
      const data = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
      if (data?.IsActive) {
        this.notification.warning('Thông báo', 'Phiên bản đang sử dụng vui lòng thử lại!');
        return;
      }
      ID = data?.ID || 0;
    } else {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản PO');
        return;
      }
      const data = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
      if (data?.IsActive) {
        this.notification.warning('Thông báo', 'Phiên bản đang sử dụng vui lòng thử lại!');
        return;
      }
      ID = data?.ID || 0;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa phiên bản này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectWorkerService.saveSolutionVersion({ ID, IsDeleted: true }).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message);
              this.loadDataSolutionVersion();
              this.loadDataPOVersion();
            } else {
              this.notification.error('Lỗi', response.message);
            }
          },
        });
      },
      nzCancelText: 'Hủy',
    });
  }
  //#endregion

  //#region Worker Operations
  calculateWorkerTree(data: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    data.forEach((item) => {
      const node = {
        ...item,
        _children: [],
        IsApprovedTBPText: item.IsApprovedTBP ? 'Đã duyệt' : 'Chưa duyệt',
      };
      map.set(node.ID, node);
    });

    data.forEach((item) => {
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

    const calculateNode = (node: any): void => {
      const numberOfPeople = Number(node.AmountPeople) || 0;
      const numberOfDays = Number(node.NumberOfDay) || 0;
      const laborCostPerDay = Number(node.Price) || 0;

      let totalLaborFromDirectChildren = 0;
      let totalCostFromDirectChildren = 0;

      node._children.forEach((child: any) => {
        calculateNode(child);
        totalLaborFromDirectChildren += Number(child.TotalWorkforce) || 0;
        totalCostFromDirectChildren += Number(child.TotalPrice) || 0;
      });

      const hasChildren = node._children && node._children.length > 0;

      if (hasChildren) {
        node.TotalWorkforce = totalLaborFromDirectChildren;
        node.TotalPrice = totalCostFromDirectChildren;
      } else {
        const totalLabor = numberOfPeople * numberOfDays;
        const totalCost = totalLabor * laborCostPerDay;
        node.TotalWorkforce = totalLabor;
        node.TotalPrice = totalCost;
      }
    };

    tree.forEach((root) => calculateNode(root));
    return tree;
  }

  openProjectWorkerDetail(isEdit: boolean): void {
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      const selectedRows = this.angularGridSolutionVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridSolutionVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
      }
    } else if (this.type === 2) {
      const selectedRows = this.angularGridPOVersion?.slickGrid?.getSelectedRows() || [];
      if (selectedRows.length > 0) {
        const rowData = this.angularGridPOVersion?.dataView?.getItem(selectedRows[0]);
        selectedVersionID = rowData?.ID || 0;
      }
    }

    if (selectedVersionID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp hoặc PO');
      return;
    }

    let workerData: any = null;
    let workerID: number = 0;

    if (isEdit) {
      // Ưu tiên lấy dòng đang focus (active cell)
      const activeCell = this.angularGridProjectWorker?.slickGrid?.getActiveCell();
      if (activeCell && activeCell.row >= 0) {
        workerData = this.angularGridProjectWorker?.dataView?.getItem(activeCell.row);
      } else {
        // Nếu không có active cell, lấy từ selected rows
        const selectedRows = this.angularGridProjectWorker?.slickGrid?.getSelectedRows() || [];
        if (selectedRows.length > 0) {
          workerData = this.angularGridProjectWorker?.dataView?.getItem(selectedRows[0]);
        }
      }

      if (!workerData) {
        this.notification.warning('Thông báo', 'Vui lòng focus vào dòng nhân công để sửa!');
        return;
      }

      workerID = workerData.ID || 0;

      if (workerData.IsApprovedTBP) {
        this.notification.warning('Thông báo', `Nhân công TT[${workerData.TT}] đã được TBP duyệt!`);
        return;
      }
    }

    const parentList = this.getParentListFromTree(this.treeWorkerData);

    const modalRef = this.ngbModal.open(ProjectWorkerDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectID = this.projectId;
    modalRef.componentInstance.ProjectWorkerVersionID = selectedVersionID;
    modalRef.componentInstance.ID = workerID;
    modalRef.componentInstance.workerData = workerData;
    modalRef.componentInstance.parentList = parentList;

    modalRef.result.then((result: any) => {
      if (result?.success) this.loadDataProjectWorker();
    }).catch(() => { });
  }

  getParentListFromTree(tree: any[]): any[] {
    const parentList: any[] = [];
    const traverse = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        parentList.push({
          ID: node.ID,
          TT: node.TT,
          WorkContent: node.WorkContent,
          _children: node._children || [],
        });
        if (node._children?.length > 0) traverse(node._children);
      });
    };
    traverse(tree);
    return parentList;
  }

  deleteProjectWorker(): void {
    const selectedRows = this.angularGridProjectWorker?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân công cần xóa');
      return;
    }

    const selectedData = selectedRows.map((idx: number) =>
      this.angularGridProjectWorker?.dataView?.getItem(idx)
    ).filter(Boolean);

    const approvedWorkers = selectedData.filter((row: any) => row.IsApprovedTBP);
    if (approvedWorkers.length > 0) {
      const approvedTTs = approvedWorkers.map((w: any) => w.TT).join(', ');
      this.notification.warning('Thông báo', `Không thể xóa nhân công đã được TBP duyệt: TT[${approvedTTs}]`);
      return;
    }

    const ttList = selectedData.map((row: any) => row.TT).join(', ');
    const message = selectedData.length === 1
      ? `Bạn có chắc chắn muốn xóa nhân công TT[${ttList}] không?`
      : `Bạn có chắc chắn muốn xóa ${selectedData.length} nhân công (TT: ${ttList}) không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteProjectWorkerConfirm(selectedData),
      nzCancelText: 'Hủy',
    });
  }

  deleteProjectWorkerConfirm(selectedRows: any[]): void {
    const payload = selectedRows.map((row: any) => ({ ID: row.ID, IsDeleted: true }));

    this.projectWorkerService.saveWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Xóa nhân công thành công!');
          this.loadDataProjectWorker();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể xóa nhân công');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error?.error?.message || 'Không thể xóa nhân công');
      },
    });
  }

  approvedActiveVersion(projectWorkerVersionID: number, isActive: boolean, type: number): void {
    this.projectWorkerService.approvedActive(projectWorkerVersionID, isActive).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Cập nhật thành công!');
          this.loadDataSolutionVersion();
          this.loadDataPOVersion();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error?.error?.message || 'Không thể cập nhật');
      },
    });
  }
  //#endregion

  //#region Panel Controls
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%';
  }

  toggleLeftPanel(): void {
    if (this.sizeLeftPanel === '0') {
      this.sizeLeftPanel = '';
      this.sizeRightPanel = '';
    } else {
      this.sizeLeftPanel = '0';
      this.sizeRightPanel = '100%';
    }
  }
  //#endregion
  private applyDistinctFilters(): void {
    const fieldsToFilter = [
      'ProjectStatusName', 'ProjectCode', 'ProjectName', 'EndUserName',
      'FullNameSale', 'FullNameTech', 'FullNamePM', 'BussinessField',
      'CurrentSituation', 'CustomerName', 'CreatedBy', 'UpdatedBy'
    ];
    this.applyDistinctFiltersToGrid(this.angularGridProjectWorker, this.projectWorkerColumns, fieldsToFilter);
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance | undefined,
    columnDefs: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
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
}
