import { Component, OnInit, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  Formatter,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { ProjectService } from '../project/project-service/project.service';
import { ProjectChangeComponent } from '../project/project-change/project-change.component';
import { EmployeeService } from '../hrm/employee/employee-service/employee.service';

@Component({
  selector: 'app-project-report-slick-grid',
  templateUrl: './project-report-slick-grid.component.html',
  styleUrl: './project-report-slick-grid.component.css',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzModalModule,
    NzFormModule,
    CommonModule,
    AngularSlickgridModule,
  ],
})
export class ProjectReportSlickGridComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() projectId: number = 0;
  @Input() teamId: number = 0;

  constructor(
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) { }

  // SlickGrid variables
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  isLoading = false;

  // Data variables
  dataProject: any[] = [];
  projects: any[] = [];
  teams: any[] = [];
  keyword: string = '';
  totalTime: number = 0;
  projectCode: string = '';

  // Biến lưu tổng từ tất cả dữ liệu
  totalAllData: {
    count: number;
    sumTimeReality: number;
    sumTotalHours: number;
    totalDays: number;
  } = {
      count: 0,
      sumTimeReality: 0,
      sumTotalHours: 0,
      totalDays: 0,
    };

  ngOnInit() {
    this.initGrid();
    this.getProject();
    this.getTeam();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadData();
    }, 100);
  }

  ngOnDestroy() { }

  //#region Formatters
  // Date formatter
  dateFormatter: Formatter = (_row, _cell, value) => {
    if (!value) return '';
    const dateTime = DateTime.fromISO(value);
    return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  };

  // Number formatter với 2 chữ số thập phân
  numberFormatter: Formatter = (_row, _cell, value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  // Number formatter với default 0.00
  numberFormatterDefault: Formatter = (_row, _cell, value) => {
    if (value === null || value === undefined || value === '') return '0.00';
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // Text formatter với wrap và linkify
  textWrapFormatter: Formatter = (_row, _cell, value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) return '';
    const text = String(value);
    // Linkify URLs
    const linkedText = this.linkifyText(text);
    return `<div class="cell-wrap-content" title="${text.replace(/"/g, '&quot;')}">${linkedText}</div>`;
  };
  //#endregion

  //#region Chuyển đổi URLs thành clickable links
  private linkifyText(text: string): string {
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    urlPattern.lastIndex = 0;

    while ((match = urlPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }
      let url = match[0];
      let href = url;
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }
      parts.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="cell-link">${escapeHtml(url)}</a>`);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }

    return parts.join('');
  }
  //#endregion

  //#region Grid Initialization
  initGrid() {
    this.columnDefinitions = [
      {
        id: 'EmployeeCode',
        name: 'Mã nhân viên',
        field: 'EmployeeCode',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: { addBlankEntry: true },
          filterOptions: {
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption
        },
      },
      {
        id: 'FullName',
        name: 'Họ tên',
        field: 'FullName',
        width: 150,
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
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        width: 120,
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
      },
      {
        id: 'TeamName',
        name: 'Team',
        field: 'TeamName',
        width: 100,
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
      },
      {
        id: 'DateReport',
        name: 'Ngày',
        field: 'DateReport',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-center',
        formatter: this.dateFormatter,
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'Content',
        name: 'Nội dung',
        field: 'Content',
        width: 350,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'TimeReality',
        name: 'Số giờ',
        field: 'TimeReality',
        width: 80,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: this.numberFormatter,
      },
      {
        id: 'Ratio',
        name: 'Hệ số',
        field: 'Ratio',
        width: 70,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: this.numberFormatterDefault,
      },
      {
        id: 'TotalHours',
        name: 'Tổng số giờ',
        field: 'TotalHours',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-right',
        formatter: this.numberFormatterDefault,
      },
      {
        id: 'Results',
        name: 'Kết quả',
        field: 'Results',
        width: 300,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'Problem',
        name: 'Vấn đề phát sinh',
        field: 'Problem',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'ProblemSolve',
        name: 'Giải pháp',
        field: 'ProblemSolve',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'Backlog',
        name: 'Tồn đọng',
        field: 'Backlog',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'PlanNextDay',
        name: 'Kế hoạch ngày tiếp theo',
        field: 'PlanNextDay',
        width: 250,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        formatter: this.textWrapFormatter,
        //filter: { model: Filters['compoundInputText'] },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-report',
        calculateAvailableSizeBy: 'container',
      },
      enableAutoResize: true,
      gridWidth: '100%',
      forceFitColumns: false,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 4, // Freeze 6 cột đầu (EmployeeCode, FullName, DepartmentName, TeamName, DateReport, Content)
      rowHeight: 80,
      autoHeight: false,
    };
  }
  //#endregion

  //#region Grid Events
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }
  //#endregion

  //#region Data Loading
  loadData() {
    this.isLoading = true;
    this.projectService.getProjectListWorkReport(
      this.projectId || 0,
      this.keyword || '',
      1,
      999999, // Lấy tất cả dữ liệu
      this.teamId || 0,
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.status === 1 && response.data) {
          let data: any[] = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data.dt && Array.isArray(response.data.dt)) {
            data = response.data.dt;
          }

          // Map data với id cho SlickGrid
          this.dataset = data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
          }));

          // Áp dụng bộ lọc distinct cho dropdowns
          setTimeout(() => {
            this.applyDistinctFilters();
          }, 0);

          // Tính tổng
          this.calculateTotals(data);
        } else {
          this.dataset = [];
          this.resetTotals();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading data:', error);
        this.notification.error('Lỗi', error?.message || error?.error?.message || 'Không thể tải dữ liệu danh sách báo cáo công việc!');
        this.dataset = [];
        this.resetTotals();
      },
    });
  }

  calculateTotals(data: any[]) {
    this.totalAllData = {
      count: data.length,
      sumTimeReality: data.reduce((sum: number, row: any) => {
        const value = parseFloat(row.TimeReality) || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0),
      sumTotalHours: data.reduce((sum: number, row: any) => {
        const value = parseFloat(row.TotalHours) || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0),
      totalDays: 0,
    };
    this.totalAllData.totalDays = this.totalAllData.sumTotalHours / 8.0;
    this.totalTime = this.totalAllData.totalDays;
  }

  resetTotals() {
    this.totalAllData = {
      count: 0,
      sumTimeReality: 0,
      sumTotalHours: 0,
      totalDays: 0,
    };
    this.totalTime = 0;
  }

  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          this.projects = response.data;
          if (this.projectId > 0) {
            this.updateProjectCode();
          }
        }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }
  //#endregion


  //#region Search & Actions
  onProjectChange() {
    this.updateProjectCode();
    this.onSearch();
  }

  onTeamChange() {
    this.onSearch();
  }

  getTeam() {
    this.employeeService.getEmployeeTeam().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.teams = response.data;
        }
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách team!');
      },
    });
  }

  updateProjectCode() {
    if (this.projectId > 0) {
      const selectedProject = this.projects.find((p) => p.ID === this.projectId);
      this.projectCode = selectedProject ? selectedProject.ProjectCode : '';
    } else {
      this.projectCode = '';
    }
  }

  onSearch() {
    this.loadData();
  }

  setDefaultSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.projectCode = '';
    this.loadData();
  }

  onClose() {
    this.activeModal.close(true);
  }

  changeProject() {
    if (this.projectId <= 0) {
      this.notification.error('', 'Vui lòng chọn dự án!');
      return;
    }

    // Lấy selected rows từ SlickGrid
    let selectedIDs: number[] = [];
    if (this.angularGrid) {
      const selectedRows = this.angularGrid.slickGrid?.getSelectedRows() || [];
      selectedIDs = selectedRows.map((rowIndex: number) => {
        const item = this.angularGrid.dataView?.getItem(rowIndex);
        return item?.ID;
      }).filter((id: number) => id !== undefined);
    }

    if (selectedIDs.length <= 0) {
      this.notification.error('', 'Vui lòng chọn báo cáo cần chuyển dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectIdOld = this.projectId;
    modalRef.componentInstance.reportIds = selectedIDs;
    modalRef.componentInstance.disable = true;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.loadData();
      }
    });
  }
  //#endregion

  //#region Export Excel
  async exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo cáo công việc');

      // Headers
      const headers = this.columnDefinitions.map((col) => col.name || col.id);
      worksheet.addRow(headers);

      // Data rows
      this.dataset.forEach((row: any) => {
        const rowData = this.columnDefinitions.map((col) => {
          const field = col.field as string;
          let value = row[field];

          // Format date
          if (field === 'DateReport' && value) {
            const dateTime = DateTime.fromISO(value);
            if (dateTime.isValid) {
              value = dateTime.toFormat('dd/MM/yyyy');
            }
          }

          return value;
        });
        worksheet.addRow(rowData);
      });

      // Bottom row với tổng
      const bottomRow: any[] = this.columnDefinitions.map((col) => {
        const field = col.field as string;
        if (field === 'Content') {
          return `Số báo cáo = ${this.totalAllData.count}`;
        } else if (field === 'TimeReality') {
          return this.totalAllData.sumTimeReality.toFixed(2);
        } else if (field === 'TotalHours') {
          return this.totalAllData.sumTotalHours.toFixed(2);
        } else if (field === 'Results') {
          return `Tổng số ngày = ${this.totalAllData.totalDays.toFixed(1)}`;
        }
        return '';
      });

      const excelBottomRow = worksheet.addRow(bottomRow);
      excelBottomRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        cell.alignment = {
          wrapText: true,
          vertical: 'middle',
          horizontal: 'left',
        };
      });

      // Auto width
      worksheet.columns.forEach((column: any) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, Math.min(cellValue.length + 2, 50));
        });
        column.width = maxLength;
      });

      // Fixed width cho các cột dài
      const fixedWidths: { [field: string]: number } = {
        Content: 50,
        Results: 50,
        Note: 50,
        Backlog: 40,
        Problem: 40,
        ProblemSolve: 40,
        PlanNextDay: 40,
      };

      this.columnDefinitions.forEach((col, index) => {
        const field = col.field as string;
        if (fixedWidths[field]) {
          const excelCol = worksheet.getColumn(index + 1);
          excelCol.width = fixedWidths[field];
          excelCol.alignment = {
            wrapText: true,
            vertical: 'top',
          };
        }
      });

      // Wrap all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = {
            ...(cell.alignment || {}),
            wrapText: true,
            vertical: 'middle',
          };
        });
      });

      // Auto filter
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: this.columnDefinitions.length },
      };

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const today = DateTime.now();
      const dateStr = today.toFormat('ddMMyyyy');
      const projectCodeStr = this.projectCode || 'ALL';
      const fileName = `${projectCodeStr}_${dateStr}.xlsx`;

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success('Thông báo', `Đã xuất Excel thành công với ${this.dataset.length} bản ghi!`);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất Excel! ' + (error?.message || ''));
    }
  }
  //#endregion

  private applyDistinctFilters(): void {
    const fieldsToFilter = ['EmployeeCode', 'FullName', 'DepartmentName', 'TeamName'];
    this.applyDistinctFiltersToGrid();
  }

  // private applyDistinctFiltersToGrid(
  //   angularGrid: AngularGridInstance | undefined,
  //   columnDefs: Column[],
  //   fieldsToFilter: string[]
  // ): void {
  //   if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

  //   const data = angularGrid.dataView.getItems();
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

  //   const columns = angularGrid.slickGrid.getColumns();
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
  //   columnDefs.forEach((colDef: any) => {
  //     if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
  //       const field = colDef.field;
  //       if (!field || !fieldsToFilter.includes(field)) return;
  //       colDef.filter.collection = getUniqueValues(data, field);
  //     }
  //   });

  //   angularGrid.slickGrid.setColumns(columns);
  //   angularGrid.slickGrid.invalidate();
  //   angularGrid.slickGrid.render();
  // }
  applyDistinctFiltersToGrid(): void {
    const angularGrid = this.angularGrid;
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

    if (this.columnDefinitions) {
      this.columnDefinitions.forEach((colDef: any) => {
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
    angularGrid.slickGrid.render();
  }
}
