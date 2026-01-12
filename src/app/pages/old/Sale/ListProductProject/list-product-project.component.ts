import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { DateTime } from 'luxon';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// ng-bootstrap
import {
  NgbModal,
  NgbActiveModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Config
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ListProductProjectService } from './list-product-project-service/list-product-project.service';

@Component({
  selector: 'app-list-product-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzSpinModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './list-product-project.component.html',
  styleUrl: './list-product-project.component.css',
})
export class ListProductProjectComponent implements OnInit, AfterViewInit {
  constructor(
    private listproductprojectService: ListProductProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) {}

  listProductMenu: MenuItem[] = [];
  cbbProject: any;
  isLoading: boolean = false;
  warehouseCode: string = 'HN';
  sreachParam = {
    selectedProject: {
      ProjectCode: '',
      ID: 0,
      // Có thể thêm ProjectName nếu cần
      // ProjectName: ""
    },
    WareHouseCode: this.warehouseCode,
  };

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  dataset: any[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.warehouseCode = params['warehouseCode'] || 'HN';
      this.sreachParam.WareHouseCode = this.warehouseCode;
    });
    
    this.loadMenu();
    this.getProject();
    this.initAngularGrid();
    this.loadData();
  }
  ngAfterViewInit(): void {}

  loadMenu() {
    this.listProductMenu = [
      {
        label: 'Xem danh sách',
        icon: 'fas fa-search text-primary',
        command: () => this.loadData(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fas fa-file-excel text-success',
        command: () => this.exportExcel(),
      },
    ];
  }

  loadData() {
    if (this.sreachParam.selectedProject == null) {
      this.sreachParam.selectedProject = {
        ProjectCode: '',
        ID: 0,
      };
    }
    this.isLoading = true;
    this.listproductprojectService
      .getData(
        this.sreachParam.selectedProject.ProjectCode,
        this.sreachParam.selectedProject.ID,
        this.sreachParam.WareHouseCode
      )
      .subscribe({
        next: (res) => {
          this.dataset = res.data;
          this.dataset = this.dataset.map((item: any, index: number) => {
            return {
              ...item,
              id: index++,
            };
          });

          setTimeout(() => {
            this.angularGrid?.resizerService.resizeGrid();
            this.applyGrouping();
            this.applyDistinctFilters();
          }, 100);

          setTimeout(() => {
            this.updateMasterFooterRow();
          }, 1500);
          this.isLoading = false;
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lấy sản phẩm theo dự án'
          );
          this.isLoading = false;
        },
      });
  }

  private applyGrouping(): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.dataView) return;

    angularGrid.dataView.setGrouping([
      {
        getter: 'ProjectCode',
        comparer: () => 0,
        formatter: (g: any) => {
          const projectFullName = g.rows?.[0]?.ProjectFullName || '';
          return `Dự án: <strong>${projectFullName}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
        },
        aggregateCollapsed: false,
        lazyTotalsCalculation: true,
        collapsed: false,
      },
      //   {
      //     getter: 'StoreName',
      //     comparer: () => 0,
      //     formatter: (g: any) => {
      //       const warehouseName = g.value || 'HN';
      //       return `Kho: <strong>${warehouseName}</strong> <span style="color:#2b4387; margin-left:0.5rem;">(${g.count} SP)</span>`;
      //     },
      //     aggregateCollapsed: false,
      //     lazyTotalsCalculation: true,
      //     collapsed: false,
      //   },
    ]);

    // Reset pagination về trang 1 và refresh
    angularGrid.dataView.setPagingOptions({ pageNum: 0 });
    angularGrid.dataView.refresh();
    angularGrid.slickGrid?.invalidate();
    angularGrid.slickGrid?.render();
  }

  getProject() {
    this.listproductprojectService.getProject().subscribe({
      next: (res) => {
        this.cbbProject = res.data;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dự án'
        );
      },
    });
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.applyGrouping();

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });

      // Update footer khi chuyển trang
      angularGrid.dataView.onPagingInfoChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 300);

    // Thêm delay bổ sung để đảm bảo trang 1 được tính
    setTimeout(() => {
      this.updateMasterFooterRow();
    }, 800);
  }

  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const dataView = this.angularGrid.dataView;
      const slickGrid = this.angularGrid.slickGrid;
      const items: any[] = [];

      if (dataView && slickGrid) {
        // Lấy data gốc đã filter (không có group structure)
        const filteredItems = dataView.getFilteredItems() || [];

        // Lấy thông tin pagination
        const pageInfo = dataView.getPagingInfo();
        const startIndex = pageInfo.pageSize * pageInfo.pageNum;

        // Kiểm tra nếu startIndex vượt quá length
        if (startIndex >= filteredItems.length && filteredItems.length > 0) {
          console.warn('startIndex vượt quá filteredItems.length', {
            startIndex,
            filteredItemsLength: filteredItems.length,
            pageNum: pageInfo.pageNum,
            pageSize: pageInfo.pageSize,
          });
        }

        const endIndex = Math.min(
          startIndex + pageInfo.pageSize,
          filteredItems.length
        );

        // Slice để lấy items của trang hiện tại
        const pageItems = filteredItems.slice(startIndex, endIndex);

        // Filter chỉ lấy data rows có ProjectCode (vì có thể có ProductCode null)
        pageItems.forEach((item: any) => {
          if (item && item.ProjectCode) {
            items.push(item);
          }
        });

        // Debug khi items rỗng
        if (items.length === 0 && pageItems.length > 0) {
          console.warn('pageItems có data nhưng items rỗng', {
            pageItemsLength: pageItems.length,
            firstItem: pageItems[0],
            pageNum: pageInfo.pageNum,
          });
        }
      }

      // Đếm số lượng sản phẩm (đã bỏ qua group)
      const codeCount = items.length;

      // Tính tổng các cột số liệu
      const totals = (items || []).reduce(
        (acc, item) => {
          acc.NumberInStoreDauky += item.NumberInStoreDauky || 0;
          acc.Import += item.Import || 0;
          acc.Export += item.Export || 0;
          acc.QuantityImportExport += item.QuantityImportExport || 0;
          acc.NumberInStoreCuoiKy += item.NumberInStoreCuoiKy || 0;
          return acc;
        },
        {
          NumberInStoreDauky: 0,
          Import: 0,
          Export: 0,
          QuantityImportExport: 0,
          NumberInStoreCuoiKy: 0,
        }
      );

      // Set footer values cho từng column
      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột Code
        if (col.id === 'ProjectCode') {
          footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
        }
        // Tổng các cột số liệu
        else if (col.id === 'NumberInStoreDauky') {
          footerCell.innerHTML = `<b>${totals.NumberInStoreDauky.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'Import') {
          footerCell.innerHTML = `<b>${totals.Import.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'Export') {
          footerCell.innerHTML = `<b>${totals.Export.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'QuantityImportExport') {
          footerCell.innerHTML = `<b>${totals.QuantityImportExport.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'NumberInStoreCuoiKy') {
          footerCell.innerHTML = `<b>${totals.NumberInStoreCuoiKy.toLocaleString(
            'en-US'
          )}</b>`;
        }
      });
    }
  }

  applyDistinctFilters(): void {
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

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = getUniqueValues(data, field);
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
          colDef.filter.collection = getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }

  initAngularGrid() {
    this.columnDefinitions = [
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã dự án',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'NumberInStoreDauky',
        field: 'NumberInStoreDauky',
        name: 'Tồn đầu kỳ',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'Import',
        field: 'Import',
        name: 'Nhập dự án',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'Export',
        field: 'Export',
        name: 'Xuất dự án',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'QuantityImportExport',
        field: 'QuantityImportExport',
        name: 'Tồn dự án',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
      {
        id: 'NumberInStoreCuoiKy',
        field: 'NumberInStoreCuoiKy',
        name: 'Tồn cuối kỳ',
        cssClass: 'text-end',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: false,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableHeaderMenu: false,
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ',',
      },
      enableGrouping: true,
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      enablePagination: true,
      pagination: {
        pageSize: 500,
        pageSizes: [200, 300, 400, 500],
        totalItems: 0,
      },
    };
  }

  async exportExcel() {
    if (!this.angularGrid || !this.angularGrid.dataView) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
      return;
    }

    const dataView = this.angularGrid.dataView;
    const slickGrid = this.angularGrid.slickGrid;
    const filteredItems = (dataView.getFilteredItems?.() as any[]) || [];

    if (!filteredItems || filteredItems.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.isLoading = true;
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new (ExcelJS as any).Workbook();
      const worksheet = workbook.addWorksheet('Danh sách SP theo dự án');

      // Lấy columns hiển thị
      const runtimeColumns = (slickGrid?.getColumns?.() as any[]) || [];
      const columns = runtimeColumns.filter(
        (col: any) => col?.id !== '_checkbox_selector' && col?.hidden !== true
      );

      const headers = columns.map((col: any) => col?.name || col?.id);

      // Header row
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 25;
      headerRow.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4D94FF' },
        };
        cell.font = {
          name: 'Times New Roman',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Lấy tất cả items bao gồm cả group headers
      const totalRows = (dataView as any).getLength?.() ?? 0;
      const dataRowsForFooter: any[] = []; // Lưu data rows để tính footer

      for (let i = 0; i < totalRows; i++) {
        const item = (dataView as any).getItem?.(i);
        if (!item) continue;

        // Kiểm tra nếu là group header
        if (item.__group) {
          const groupValue = item.value || 'Không xác định';
          const groupCount = item.count || 0;

          // Lấy ProjectFullName từ rows
          const projectFullName = item.rows?.[0]?.ProjectFullName || groupValue;
          const groupText = `Dự án: ${projectFullName} (${groupCount} SP)`;

          const groupRow = worksheet.addRow([groupText]);
          groupRow.font = {
            name: 'Times New Roman',
            size: 11,
            bold: true,
            color: { argb: 'FFED502F' },
          };
          groupRow.alignment = { horizontal: 'left', vertical: 'middle' };

          // Merge cells cho group header
          worksheet.mergeCells(
            groupRow.number,
            1,
            groupRow.number,
            headers.length
          );

          groupRow.eachCell((cell: any) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });

          continue;
        }

        // Bỏ qua group totals
        if (item.__groupTotals) {
          continue;
        }

        // Lưu data row để tính footer
        dataRowsForFooter.push(item);

        // Data row thông thường
        const rowData = columns.map((col: any) => {
          const field = col?.field;
          const value = field ? item[field] : undefined;

          // Format số cho các cột số
          if (
            [
              'NumberInStoreDauky',
              'Import',
              'Export',
              'QuantityImportExport',
              'NumberInStoreCuoiKy',
            ].includes(field)
          ) {
            return Number(value) || 0;
          }

          return value ?? '';
        });

        const dataRow = worksheet.addRow(rowData);
        dataRow.eachCell((cell: any, colNumber: number) => {
          cell.font = { name: 'Times New Roman', size: 11 };
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Căn phải cho cột số
          const col = columns[colNumber - 1];
          if (
            col &&
            [
              'NumberInStoreDauky',
              'Import',
              'Export',
              'QuantityImportExport',
              'NumberInStoreCuoiKy',
            ].includes(col.field)
          ) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          }
        });
      }

      // Tính footer từ data rows đã export
      const totals = dataRowsForFooter.reduce(
        (acc, item) => {
          acc.NumberInStoreDauky += item.NumberInStoreDauky || 0;
          acc.Import += item.Import || 0;
          acc.Export += item.Export || 0;
          acc.QuantityImportExport += item.QuantityImportExport || 0;
          acc.NumberInStoreCuoiKy += item.NumberInStoreCuoiKy || 0;
          return acc;
        },
        {
          NumberInStoreDauky: 0,
          Import: 0,
          Export: 0,
          QuantityImportExport: 0,
          NumberInStoreCuoiKy: 0,
        }
      );

      const footerData = columns.map((col: any) => {
        if (col.field === 'ProjectCode') {
          return dataRowsForFooter.length;
        } else if (totals[col.field] !== undefined) {
          return totals[col.field];
        }
        return '';
      });

      const footerRow = worksheet.addRow(footerData);
      footerRow.font = {
        name: 'Times New Roman',
        size: 11,
        bold: true,
      };
      footerRow.eachCell((cell: any, colNumber: number) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB3B' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        const col = columns[colNumber - 1];
        if (
          col &&
          [
            'NumberInStoreDauky',
            'Import',
            'Export',
            'QuantityImportExport',
            'NumberInStoreCuoiKy',
          ].includes(col.field)
        ) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Auto width
      worksheet.columns.forEach((column: any, index: number) => {
        const col = columns[index];
        if (col) {
          column.width = col.width ? col.width / 10 : 15;
        }
      });

      // Export file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DanhSachSPTheoDuAn_${
        this.sreachParam.selectedProject?.ProjectCode || ''
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error) {
      console.error('Export error:', error);
      this.notification.error('Lỗi', 'Có lỗi khi xuất Excel!');
    } finally {
      this.isLoading = false;
    }
  }
}
