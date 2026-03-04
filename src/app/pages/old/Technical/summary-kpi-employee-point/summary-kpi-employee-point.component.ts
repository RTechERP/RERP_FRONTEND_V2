import {
  Component,
  ViewEncapsulation,
  OnInit,
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';
import { Menubar } from 'primeng/menubar';
import { ActivatedRoute } from '@angular/router';
import { SummaryKpiEmployeePointService, SummaryKPIEmployeePointRequest, SaveActualNewRequest } from './summary-kpi-employee-point-service/summary-kpi-employee-point.service';
import { KPIEvaluationFactorScoringDetailsComponent } from '../../../KPITech/kpievaluation-factor-scoring-details/kpievaluation-factor-scoring-details.component';
import { KpiRankingComponent } from '../kpi-ranking/kpi-ranking.component';

@Component({
  selector: 'app-summary-kpi-employee-point',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './summary-kpi-employee-point.component.html',
  styleUrl: './summary-kpi-employee-point.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ExcelExportService],
})
export class SummaryKpiEmployeePointComponent implements OnInit, AfterViewInit {
  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Menu bar
  menuBars: any[] = [];

  // Filters
  year: number = new Date().getFullYear();
  quarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
  departmentId: number = 0;
  employeeId: number = 0;
  keyword: string = '';

  // Dropdown data
  departments: any[] = [];
  employees: any[] = [];

  // Selected row
  selectedId: number = 0;
  selectedRow: any = null;

  // Total summary
  totalEmployees: number = 0;

  constructor(
    private summaryKpiService: SummaryKpiEmployeePointService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private ngbModal: NgbModal,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private excelExportService: ExcelExportService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrid();

    this.loadDepartments();
    this.loadEmployees();

    this.search();
  }

  ngAfterViewInit(): void { }

  loadDepartments(): void {
    this.summaryKpiService.getDepartment().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.departments = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadEmployees(): void {
    this.summaryKpiService.getEmployees().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.employees = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  search(): void {
    const request: SummaryKPIEmployeePointRequest = {
      Year: this.year,
      Quarter: this.quarter,
      DepartmentID: this.departmentId || 0,
      EmployeeID: this.employeeId || 0,
      Keyword: this.keyword || ''
    };

    this.summaryKpiService.loadData(request).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataset = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.KPIEmployeePointID || item.ID || index,
            STT: index + 1,
          }));
          this.totalEmployees = this.dataset.length;
          this.selectedId = 0;
          this.selectedRow = null;
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu');
      }
    });
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Duyệt đánh giá',
        icon: 'fa-solid fa-check-circle fa-lg text-success',
        command: () => {
          this.onPublish();
        },
      },
      {
        label: 'Hủy duyệt',
        icon: 'fa-solid fa-times-circle fa-lg text-danger',
        command: () => {
          this.onUnpublish();
        },
      },
      {
        label: 'Lưu điểm',
        icon: 'fa-solid fa-save fa-lg text-primary',
        command: () => {
          this.onSaveData();
        },
      },
      {
        label: 'Xếp loại',
        icon: 'fa-solid fa-ranking-star fa-lg text-warning',
        command: () => {
          this.onRanking();
        },
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        },
      },
    ];
  }

  onRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem?.(args.row);
    if (item && item.KPIEmployeePointID) {
      this.selectedId = item.KPIEmployeePointID;
      this.selectedRow = item;
    }
  }

  onRowDoubleClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem?.(args.row);
    if (item) {
      this.openDetailDialog(item);
    }
  }

  openDetailDialog(item: any): void {
    // Validate employee ID
    const empId = item.EmployeeID || item.ID;
    if (!empId || empId <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    // Get KPIExamID from the row
    const kpiExamID = item.KPIExamID;
    if (!kpiExamID || kpiExamID <= 0) {
      this.notification.warning('Thông báo', 'Bài đánh giá không hợp lệ!');
      return;
    }

    this.summaryKpiService.getKPIExamByID(kpiExamID).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          const kpiExam = response.data;

          // Validate KPI Exam
          if (!kpiExam.ID || kpiExam.ID <= 0) {
            this.notification.warning('Thông báo', 'Bài đánh giá không hợp lệ! Hãy chọn lại bài đánh giá');
            return;
          }

          // Open the KPI Evaluation Factor Scoring Details modal
          const modalRef = this.ngbModal.open(KPIEvaluationFactorScoringDetailsComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
          });

          // Set modal parameters
          modalRef.componentInstance.typePoint = 3; // BGĐ view 
          modalRef.componentInstance.departmentID = 2; // Set to 2 
          modalRef.componentInstance.employeeID = empId;
          modalRef.componentInstance.kpiExam = kpiExam;
          modalRef.componentInstance.isAdminConfirm = item.IsAdminConfirm || false;

          // Handle modal close
          modalRef.result.then(
            (result: any) => {
              if (result?.success) {
                this.search(); // Reload data
              }
            },
            () => { }
          );
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải thông tin bài đánh giá');
        }
      },
      error: (error: any) => {
        console.error('Error loading KPI Exam:', error);
        this.notification.error('Lỗi', 'Không thể tải thông tin bài đánh giá');
      }
    });
  }

  // Menu actions
  onPublish(): void {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để duyệt');
      return;
    }

    const itemsToPublish: SaveActualNewRequest[] = selectedRows.map((rowIndex: number) => {
      const item = this.angularGrid.dataView.getItem(rowIndex);
      return {
        Id: item?.KPIEmployeePointID,
        TotalPercentActual: item?.TotalPercentActual ?? 0,
        IsPublish: true
      } as SaveActualNewRequest;
    }).filter((req: SaveActualNewRequest) => req.Id);

    if (itemsToPublish.length === 0) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy ID để duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận duyệt',
      nzContent: `Bạn có chắc chắn muốn duyệt ${itemsToPublish.length} dòng đã chọn?`,
      nzOkText: 'Duyệt',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.summaryKpiService.saveActualNew(itemsToPublish).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Duyệt thành công');
              this.search();
            } else {
              this.notification.error('Lỗi', response.message || 'Duyệt thất bại');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', 'Không thể duyệt dữ liệu');
          }
        });
      }
    });
  }

  onUnpublish(): void {
    const selectedRows = this.angularGrid?.slickGrid?.getSelectedRows() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ít nhất một dòng để hủy duyệt');
      return;
    }

    const itemsToUnpublish: SaveActualNewRequest[] = selectedRows.map((rowIndex: number) => {
      const item = this.angularGrid.dataView.getItem(rowIndex);
      return {
        Id: item?.KPIEmployeePointID,
        TotalPercentActual: item?.TotalPercentActual ?? 0,
        IsPublish: false
      } as SaveActualNewRequest;
    }).filter((req: SaveActualNewRequest) => req.Id);

    if (itemsToUnpublish.length === 0) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy ID để hủy duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận hủy duyệt',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt ${itemsToUnpublish.length} dòng đã chọn?`,
      nzOkText: 'Hủy duyệt',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.summaryKpiService.saveActualNew(itemsToUnpublish).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Hủy duyệt thành công');
              this.search();
            } else {
              this.notification.error('Lỗi', response.message || 'Hủy duyệt thất bại');
            }
          },
          error: (error: any) => {
            this.notification.error('Lỗi', 'Không thể hủy duyệt dữ liệu');
          }
        });
      }
    });
  }

  onSaveData(): void {
    // Collect modified TotalPercentActual values
    const dataToSave: SaveActualNewRequest[] = [];

    this.dataset.forEach(item => {
      if (item.KPIEmployeePointID && item.TotalPercentActual !== undefined) {
        dataToSave.push({
          Id: item.KPIEmployeePointID,
          TotalPercentActual: item.TotalPercentActual,
          IsPublish: null // không thay đổi trạng thái publish
        });
      }
    });

    if (dataToSave.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để lưu');
      return;
    }

    this.summaryKpiService.saveActualNew(dataToSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu điểm thành công');
          this.search();
        } else {
          this.notification.error('Lỗi', response.message || 'Lưu điểm thất bại');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể lưu điểm');
      }
    });
  }

  onRanking(): void {
    if (this.dataset.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để xem xếp loại');
      return;
    }

    // Calculate KPI Level Summary (matching C# GetKpiLevelSummary)
    const summary = this.getKpiLevelSummary();

    // Open KPI Ranking modal with data (matching WinForm btnRanking_ItemClick)
    const modalRef = this.ngbModal.open(KpiRankingComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Pass data to modal (matching WinForm: dtData, dtSummary, year, quarter, departmentID)
    modalRef.componentInstance.dtData = this.dataset;
    modalRef.componentInstance.dtSummary = summary;
    modalRef.componentInstance.inputYear = this.year;
    modalRef.componentInstance.inputQuarter = this.quarter;
    modalRef.componentInstance.inputDepartmentId = this.departmentId;
  }

  // Calculate KPI Level Summary (matching C# GetKpiLevelSummary)
  getKpiLevelSummary(): any[] {
    const levels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];
    const result: any[] = [];

    levels.forEach((level, index) => {
      const expectedCount = this.dataset.filter((item: any) =>
        (item.TotalPercentText || '').trim().toUpperCase() === level.toUpperCase()
      ).length;

      const actualCount = this.dataset.filter((item: any) =>
        (item.TotalPercentTextActual || '').trim().toUpperCase() === level.toUpperCase()
      ).length;

      result.push({
        KPILevel: level,
        SortOrder: index + 1,
        SoLuongExpected: expectedCount,
        SoLuongActual: actualCount
      });
    });

    return result;
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'KPIEmployeePointID',
        name: 'ID',
        field: 'KPIEmployeePointID',
        sortable: true,
        maxWidth: 60,
        excludeFromExport: true,
        hidden: true,
      },
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: this.commonTooltipFormatter,
      },
      {
        id: 'FullName',
        name: 'Họ tên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        minWidth: 170,
        formatter: this.commonTooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
        },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        minWidth: 150,
        formatter: this.commonTooltipFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: { autoAdjustDropHeight: true, filter: true } as MultipleSelectOption
        },
      },
      {
        id: 'PositionName',
        name: 'Chức vụ',
        field: 'PositionName',
        sortable: true,
        filterable: true,
        minWidth: 120,
        formatter: this.commonTooltipFormatter,
      },
      {
        id: 'ProjectTypeName',
        name: 'Team',
        field: 'ProjectTypeName',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: this.commonTooltipFormatter,
      },
      {
        id: 'IsPublishText',
        name: 'Trạng thái',
        field: 'IsPublishText',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: this.commonTooltipFormatter,
      },
      {
        id: 'TotalPercent',
        name: 'Tổng điểm',
        field: 'TotalPercent',
        sortable: true,
        filterable: true,
        minWidth: 90,
        formatter: Formatters.decimal,
        params: { minDecimal: 1, maxDecimal: 1 },
        cssClass: 'text-end',
      },
      {
        id: 'TotalPercentText',
        name: 'Xếp loại',
        field: 'TotalPercentText',
        sortable: true,
        filterable: true,
        minWidth: 80,
        cssClass: 'text-center fw-bold',
      },
      {
        id: 'TotalPercentActual',
        name: 'Điểm cuối cùng',
        field: 'TotalPercentActual',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: Formatters.decimal,
        params: { minDecimal: 1, maxDecimal: 1 },
        cssClass: 'text-end',
        editor: {
          model: Editors['float'],
          decimal: 1,
        },
      },
      {
        id: 'TotalPercentTextActual',
        name: 'Xếp loại cuối',
        field: 'TotalPercentTextActual',
        sortable: true,
        filterable: true,
        minWidth: 90,
        cssClass: 'text-center fw-bold',
      },
      {
        id: 'YearEvaluation',
        name: 'Năm',
        field: 'YearEvaluation',
        sortable: true,
        filterable: true,
        minWidth: 60,
        cssClass: 'text-center',
      },
      {
        id: 'QuarterEvaluation',
        name: 'Quý',
        field: 'QuarterEvaluation',
        sortable: true,
        filterable: true,
        minWidth: 50,
        cssClass: 'text-center',
      },
      {
        id: 'StartWorking',
        name: 'Ngày vào',
        field: 'StartWorking',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: Formatters.dateEuro,
      },
      {
        id: 'BirthOfDate',
        name: 'Ngày sinh',
        field: 'BirthOfDate',
        sortable: true,
        filterable: true,
        minWidth: 100,
        formatter: Formatters.dateEuro,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.grid-container-main',
        calculateAvailableSizeBy: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      rowHeight: 35,
      headerRowHeight: 40,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      multiSelect: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      enableGrouping: false,
      editable: true,
      autoEdit: false,
      autoCommitEdit: true,
      externalResources: [this.excelExportService],
    };
  }

  // Auto calculate rating text based on TotalPercentActual (matching grvData_CellValueChanged)
  calculateRatingText(totalPercent: number): string {
    if (totalPercent < 60) return 'D';
    else if (totalPercent >= 60 && totalPercent < 65) return 'C-';
    else if (totalPercent >= 65 && totalPercent < 70) return 'C';
    else if (totalPercent >= 70 && totalPercent < 75) return 'C+';
    else if (totalPercent >= 75 && totalPercent < 80) return 'B-';
    else if (totalPercent >= 80 && totalPercent < 85) return 'B';
    else if (totalPercent >= 85 && totalPercent < 90) return 'B+';
    else if (totalPercent >= 90 && totalPercent < 95) return 'A-';
    else if (totalPercent >= 95 && totalPercent < 100) return 'A';
    else if (totalPercent >= 100) return 'A+';
    return '';
  }

  // Handle cell value change - auto update TotalPercentTextActual when TotalPercentActual changes
  onCellChanged(e: any, args: any): void {
    const column = args.column;
    const item = args.item;

    if (column.field === 'TotalPercentActual' && item) {
      const totalPercent = parseFloat(item.TotalPercentActual) || 0;
      const newRatingText = this.calculateRatingText(totalPercent);

      // Update the item in dataset
      item.TotalPercentTextActual = newRatingText;

      // Update the grid
      if (this.angularGrid && this.angularGrid.dataView) {
        this.angularGrid.dataView.updateItem(item.id, item);
        this.angularGrid.slickGrid.invalidateRow(args.row);
        this.angularGrid.slickGrid.render();
      }
    }
  }

  // Helper function to escape HTML special characters for title attributes
  private escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private commonTooltipFormatter = (_row: any, _cell: any, value: any, _column: any, _dataContext: any) => {
    if (!value) return '';
    const escaped = this.escapeHtml(value);
    return `
                <span
                title="${escaped}"
                style="
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
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
  }

  // Grid events
  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;

    // Set up double-click event handler
    if (this.angularGrid && this.angularGrid.slickGrid) {
      this.angularGrid.slickGrid.onDblClick.subscribe((e: any, args: any) => {
        this.onRowDoubleClick(e, args);
      });

      // Set up single click for row selection
      this.angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
        this.onRowClick(e, args);
      });
    }

    // Set up row styling via getItemMetadata (matching grvData_RowStyle)
    if (this.angularGrid && this.angularGrid.dataView) {
      const dataView = this.angularGrid.dataView;
      const originalGetItemMetadata = dataView.getItemMetadata;

      dataView.getItemMetadata = (row: number) => {
        const item = dataView.getItem(row);
        let metadata = originalGetItemMetadata ? originalGetItemMetadata.call(dataView, row) : null;

        if (item) {
          const totalPercentText = (item.TotalPercentText || '').trim().toUpperCase();
          const totalPercentTextActual = (item.TotalPercentTextActual || '').trim().toUpperCase();

          // Highlight if ratings are different (matching C# logic)
          if (totalPercentText && totalPercentTextActual && totalPercentText !== totalPercentTextActual) {
            metadata = metadata || {};
            metadata.cssClasses = (metadata.cssClasses || '') + ' row-rating-different';
          }
        }

        return metadata;
      };
    }

    // NOTE: Grouping disabled to allow cell editing - uncomment if grouping is needed
    // Auto group by DepartmentName
    // setTimeout(() => {
    //   if (this.angularGrid && this.angularGrid.dataView) {
    //     this.angularGrid.dataView.setGrouping([
    //       {
    //         getter: 'DepartmentName',
    //         formatter: (g: any) => `Phòng ban: <strong>${g.value}</strong> <span style="color:red">(${g.count} nhân viên)</span>`,
    //         aggregateCollapsed: false,
    //         lazyTotalsCalculation: true,
    //       },
    //     ]);
    //   }
    // }, 100);
  }

  applyDistinctFiltersToGrid(): void {
    if (!this.angularGrid || !this.dataset) return;

    const columnFilterUpdates: { [key: string]: any[] } = {
      'FullName': [...new Set(this.dataset.map(d => d.FullName).filter(Boolean))].sort().map(v => ({ value: v, label: v })),
      'DepartmentName': [...new Set(this.dataset.map(d => d.DepartmentName).filter(Boolean))].sort().map(v => ({ value: v, label: v })),
    };

    this.columnDefinitions.forEach(col => {
      if (columnFilterUpdates[col.id as string] && col.filter) {
        col.filter.collection = columnFilterUpdates[col.id as string];
      }
    });

    if (this.angularGrid.slickGrid) {
      this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
    }
  }

  async exportToExcel(): Promise<void> {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để export');
      return;
    }
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Summary KPI Employee Point');

      const columnsToExport = this.columnDefinitions.filter(col =>
        !col.excludeFromExport && !col.hidden
      );

      // Add header row
      worksheet.addRow(columnsToExport.map(col => col.name));

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

      // Add data rows
      this.dataset.forEach(item => {
        const rowData = columnsToExport.map(col => {
          const value = item[col.field as string];
          if (col.formatter === Formatters.dateEuro && value) {
            return new Date(value).toLocaleDateString('vi-VN');
          }
          return value;
        });
        worksheet.addRow(rowData);
      });

      // Auto fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TongHopDanhGiaKPI_${this.year}-Q${this.quarter}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.notification.success('Thành công', 'Xuất Excel thành công');
    } catch (error) {
      console.error('Export error:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel');
    }
  }
}
