import {
  Component,
  OnInit,
  AfterViewInit,
  Optional,
  Inject,
  OnDestroy,
  ViewChild,
  TemplateRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

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

// ng-bootstrap
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

// Config
import { NOTIFICATION_TITLE } from '../../../../../app.config';

import { ListProductProjectService } from '../../ListProductProject/list-product-project-service/list-product-project.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { BillImportDetailNewComponent } from '../../BillImport/bill-import-new/bill-import-detail-new/bill-import-detail-new.component';
import { BillImportServiceService } from '../../BillImport/bill-import-service/bill-import-service.service';

@Component({
  selector: 'app-returned-inventory-product',
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
    NzSpinModule,
    AngularSlickgridModule,
  ],
  templateUrl: './returned-inventory-product.component.html',
  styleUrl: './returned-inventory-product.component.css',
})
export class ReturnedInventoryProductComponent
  implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private listproductprojectService: ListProductProjectService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private billImportService: BillImportServiceService,
    @Optional() @Inject('tabData') private tabData: any,
  ) { }

  @ViewChild('warehousePickerTpl') warehousePickerTpl!: TemplateRef<any>;

  cbbProject: any;
  dataProductGroup: any[] = [];
  selectedProductGroupIDs: number[] = [];
  dataWarehouse: any[] = [];
  pickerWarehouseID: number | null = null;
  isLoading: boolean = false;
  warehouseCode: string = 'HN';
  sreachParam = {
    selectedProject: {
      ProjectCode: '',
      ID: 0,
    },
    // Mặc định lấy dữ liệu của tất cả các kho, không lọc theo warehouseCode của tab đang mở
    WareHouseCode: '',
    ProductGroupID: '',
  };

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  dataset: any[] = [];

  excelExportService = new ExcelExportService();

  private queryParamsSub?: Subscription;

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe((params) => {
      const newWarehouseCode =
        params['warehouseCode'] ?? this.tabData?.warehouseCode ?? 'HN';

      const warehouseCodeChanged = this.warehouseCode !== newWarehouseCode;
      this.warehouseCode = newWarehouseCode;

      if (warehouseCodeChanged && this.angularGrid) {
        this.initAngularGrid();
      }
    });

    this.getProject();
    this.initAngularGrid();
    this.getProductGroup();
    this.getWarehouse();
  }

  getWarehouse(): void {
    this.billImportService.getWarehouse().subscribe({
      next: (res: any) => {
        this.dataWarehouse = res?.data || [];
        console.log('[ReturnedInventory] Danh sách kho:', this.dataWarehouse);
      },
      error: () => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy danh sách kho',
        );
      },
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSub) {
      this.queryParamsSub.unsubscribe();
    }
    if (this.angularGrid) {
      try {
        if (this.angularGrid.slickGrid) {
          this.angularGrid.slickGrid.destroy();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.angularGrid = undefined as any;
    }
  }

  ngAfterViewInit(): void { }

  resizeGrids(): void {
    if (this.angularGrid?.resizerService) {
      this.angularGrid.resizerService.resizeGrid();
    }
  }

  loadData() {
    if (this.sreachParam.selectedProject == null) {
      this.sreachParam.selectedProject = {
        ProjectCode: '',
        ID: 0,
      };
    }

    if (!this.sreachParam.WareHouseCode) {
      this.sreachParam.WareHouseCode = '';
    }
    this.isLoading = true;
    this.listproductprojectService
      .getDataReturnInventory(
        this.sreachParam.selectedProject.ProjectCode,
        this.sreachParam.selectedProject.ID,
        this.sreachParam.WareHouseCode,
        this.sreachParam.ProductGroupID,
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
            this.resizeGrids();
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
            'Có lỗi xảy ra khi lấy sản phẩm theo dự án',
          );
          this.isLoading = false;
        },
      });
  }

  private applyGrouping(): void {
    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.dataView) return;

    // Không group theo loại kho nữa -> chỉ group theo ProjectCode
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
    ]);

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
          'Có lỗi xảy ra khi lấy dự án',
        );
      },
    });
  }

  getProductGroup() {
    this.listproductprojectService
      .getProductGroup(
        this.appUserService.isAdmin ?? false,
        this.appUserService.departmentID ?? 0,
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            this.selectedProductGroupIDs = this.dataProductGroup.map(
              (item) => item.ID,
            );
            this.sreachParam.ProductGroupID =
              this.selectedProductGroupIDs.join(',');
          } else {
            this.sreachParam.ProductGroupID = '';
          }
          this.loadData();
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lấy nhóm kho',
          );
          this.sreachParam.ProductGroupID = '';
          this.loadData();
        },
      });
  }

  onProductGroupChange(selected: number[]): void {
    this.selectedProductGroupIDs = selected;
    this.sreachParam.ProductGroupID = selected.join(',');
    this.loadData();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.applyGrouping();

    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });

      angularGrid.dataView.onPagingInfoChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 300);

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
        const filteredItems = dataView.getFilteredItems() || [];
        const pageInfo = dataView.getPagingInfo();

        let pageItems = filteredItems;
        if (pageInfo.pageSize > 0) {
          const startIndex = pageInfo.pageSize * pageInfo.pageNum;
          const endIndex = Math.min(
            startIndex + pageInfo.pageSize,
            filteredItems.length,
          );
          pageItems = filteredItems.slice(startIndex, endIndex);
        }

        pageItems.forEach((item: any) => {
          if (item && item.ProjectCode) {
            items.push(item);
          }
        });
      }

      const codeCount = items.length;

      const totals = (items || []).reduce(
        (acc, item) => {
          acc.Import += item.Import || 0;
          acc.Export += item.Export || 0;
          return acc;
        },
        {
          Import: 0,
          Export: 0,
        },
      );

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id,
        );
        if (!footerCell) return;

        if (col.id === 'ProjectCode') {
          footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
        } else if (col.id === 'Import') {
          footerCell.innerHTML = `<b>${totals.Import.toLocaleString(
            'en-US',
          )}</b>`;
        } else if (col.id === 'Export') {
          footerCell.innerHTML = `<b>${totals.Export.toLocaleString(
            'en-US',
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
      field: string,
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
        a.label.localeCompare(b.label),
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
    // Chỉ giữ lại các cột: Mã dự án, Mã sản phẩm, Mã nội bộ, Tên sản phẩm, Nhập dự án, Xuất dự án.
    this.columnDefinitions = [
      {
        id: 'ProjectCode',
        field: 'ProjectCode',
        name: 'Mã dự án',
        width: 150,
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
        excelExportOptions: { width: 15 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 150,
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
        excelExportOptions: { width: 18 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 150,
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
        excelExportOptions: { width: 15 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
        excelExportOptions: { width: 40 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'UnitName',
        field: 'UnitName',
        name: 'Đơn vị tính',
        width: 70,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        excelExportOptions: { width: 40 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'FirmName',
        field: 'FirmName',
        name: 'Hãng',
        width: 70,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        excelExportOptions: { width: 40 },
        exportCustomFormatter: (_r, _c, v) => this.cleanXml(v),
      },
      {
        id: 'RequestImport',
        field: 'RequestImport',
        name: 'YC Nhập dự án',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
      {
        id: 'Import',
        field: 'Import',
        name: 'Nhập dự án',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
      {
        id: 'Export',
        field: 'Export',
        name: 'Xuất dự án (1)',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
       {
        id: 'RequestImportAgain',
        field: 'RequestImportAgain',
        name: 'SL YC nhập lại',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
      {
        id: 'ImportAgain',
        field: 'ImportAgain',
        name: 'SL Nhập lại',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
      {
        id: 'QuantityRequestPL',
        field: 'QuantityRequestPL',
        name: 'SLYC Partlist (2)',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
      {
        id: 'QuantityDiff',
        field: 'QuantityDiff',
        name: 'Chênh lệch |(1) - (2)|',
        cssClass: 'text-end',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
        type: 'number',
        excelExportOptions: { width: 12 },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      rowHeight: 40,
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
      enableCellMenu: false,
      enableContextMenu: false,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableHeaderMenu: false,
      enableExcelExport: true,
      externalResources: [this.excelExportService],
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
        addGroupIndentation: true,
        groupingColumnHeaderTitle: '',
        columnHeaderStyle: {
          font: { bold: true, color: 'FFFFFFFF' },
          fill: { type: 'pattern', patternType: 'solid', fgColor: 'FF4D94FF' },
        },
        customExcelHeader: (workbook: any, sheet: any) => {
          const titleFormat = workbook.getStyleSheet().createFormat({
            font: {
              size: 16,
              fontName: 'Calibri',
              bold: true,
              color: 'FFFFFFFF',
            },
            alignment: {
              wrapText: true,
              horizontal: 'center',
              vertical: 'center',
            },
            fill: {
              type: 'pattern',
              patternType: 'solid',
              fgColor: 'FF1F497D',
            },
          });
          sheet.setRowInstructions(0, { height: 35 });
          const customTitle = `DANH SÁCH SẢN PHẢM HÀNG TRẢ BỊ TỒN - ${this.sreachParam.selectedProject?.ProjectCode || 'Tất cả'}`;
          sheet.mergeCells('A1', 'F1');
          sheet.data.push([
            { value: customTitle, metadata: { style: titleFormat.id } },
          ]);
        },
      },
      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ',',
      },
      enableGrouping: true,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      enablePagination: false,
    };
  }

  cleanXml(value: any): string {
    if (value === null || value === undefined) return '';

    return String(value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
  }

  private getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return [];
    const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows() || [];
    return selectedIndexes
      .map((index: number) => this.angularGrid.dataView.getItem(index))
      .filter((item: any) => item && item.ProductCode);
  }

  onNhapKhoClick(): void {
    console.log('[ReturnedInventory] Click "Nhập kho"');
    const selectedRows = this.getSelectedRows();
    console.log('[ReturnedInventory] selectedRows:', selectedRows);

    if (selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một sản phẩm để nhập kho!',
      );
      return;
    }

    const groups = this.groupRowsByProductGroup(selectedRows);
    console.log('[ReturnedInventory] Nhóm sản phẩm theo loại kho:', groups);

    this.openWarehousePicker(groups);
  }

  private groupRowsByProductGroup(
    rows: any[],
  ): { productGroupID: number; rows: any[] }[] {
    const map = new Map<number, any[]>();
    rows.forEach((row: any) => {
      const key = row.ProductGroupID;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(row);
    });
    return Array.from(map.entries()).map(([productGroupID, groupRows]) => ({
      productGroupID,
      rows: groupRows,
    }));
  }

  private openWarehousePicker(
    groups: { productGroupID: number; rows: any[] }[],
  ): void {
    this.pickerWarehouseID = null;
    console.log('[ReturnedInventory] Mở popup chọn kho muốn nhập vào. dataWarehouse:', this.dataWarehouse);

    const modalRef = this.modal.create({
      nzTitle: 'Chọn kho muốn nhập vào',
      nzContent: this.warehousePickerTpl,
      nzWidth: 420,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => modalRef.destroy(),
        },
        {
          label: 'Xác nhận',
          type: 'primary',
          onClick: () => {
            console.log('[ReturnedInventory] Xác nhận kho nhập vào:', this.pickerWarehouseID);
            if (!this.pickerWarehouseID) {
              this.notification.warning(
                'Thông báo',
                'Vui lòng chọn kho muốn nhập vào!',
              );
              return;
            }
            const warehouseID = this.pickerWarehouseID;
            modalRef.destroy();

            if (groups.length > 1) {
              // this.notification.info(
              //   'Thông báo',
              //   `Bạn chọn sản phẩm từ ${groups.length} loại kho khác nhau. Hệ thống sẽ tự động mở lần lượt ${groups.length} phiếu nhập (mỗi loại kho 1 phiếu).`,
              // );
            }

            this.openBillImportSequential(groups, 0, warehouseID);
          },
        },
      ],
    });
  }

  // Mở lần lượt từng phiếu nhập theo loại kho (không mở đồng thời) vì API sinh mã phiếu
  // sẽ trả cùng 1 mã nếu gọi trùng lúc cho nhiều phiếu chưa được lưu.
  private openBillImportSequential(
    groups: { productGroupID: number; rows: any[] }[],
    index: number,
    warehouseID: number,
  ): void {
    if (index >= groups.length) {
      console.log('[ReturnedInventory] Đã mở hết các phiếu nhập, reload dữ liệu');
      if (this.angularGrid?.slickGrid) {
        this.angularGrid.slickGrid.setSelectedRows([]);
        this.loadData();
      }
      return;
    }

    const group = groups[index];
    console.log(
      `[ReturnedInventory] Mở phiếu nhập ${index + 1}/${groups.length} cho loại kho`,
      group.productGroupID,
    );

    const modalRef = this.openBillImportDetail(
      group.rows,
      group.productGroupID,
      warehouseID,
    );

    modalRef.result.then(
      () => this.openBillImportSequential(groups, index + 1, warehouseID),
      () => this.openBillImportSequential(groups, index + 1, warehouseID),
    );
  }

  private openBillImportDetail(
    selectedRows: any[],
    productGroupID: number,
    warehouseID: number,
  ): NgbModalRef {
    console.log('[ReturnedInventory] openBillImportDetail', {
      selectedRows,
      productGroupID,
      warehouseID,
    });

    const modalRef = this.modalService.open(BillImportDetailNewComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      fullscreen: true,
    });

    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.WarehouseCode = this.warehouseCode || 'HN';
    modalRef.componentInstance.warehouseID = warehouseID;
    modalRef.componentInstance.newBillImport = {
      Id: 0,
      BillImportCode: '',
      ReciverID: 0,
      Reciver: '',
      DeliverID: 0,
      Deliver: '',
      KhoType: productGroupID,
      KhoTypeID: selectedRows[0].ProductGroupID || 0,
      WarehouseID: warehouseID,
      BillTypeNew: 4,
      SupplierID: 16677, // NHẬP NỘI BỘ
      Supplier: '',
      CreatDate: new Date(),
      RulePayID: 0,
      DateRequestImport: new Date(),
    };

    modalRef.componentInstance.poNCCId = 0;
    modalRef.componentInstance.isReturnedInventory = true;
    modalRef.componentInstance.selectedList = selectedRows.map((row: any) => ({
      PONCCDetailID: 0,
      ID: 0,
      ProductSaleID: row.ProductID || row.ProductSaleID || row.ID || 0,
      ProductNewCode: row.ProductNewCode || '',
      ProductCode: row.ProductCode || '',
      ProductName: row.ProductName || '',
      UnitName: row.Unit || '',
      QtyRequest: 0,
      QuantityRemain: 1,
      ProjectID: row.ProjectID || this.sreachParam.selectedProject?.ID || 0,
      ProjectCode:
        row.ProjectCode || this.sreachParam.selectedProject?.ProjectCode || '',
      ProjectName: row.ProjectName || '',
      BillCode: '',
      POCode: '',
      QuantityExport: (row.Export || 0) - (row.ImportAgain || 0) || 0,
    }));


    return modalRef;
  }
}
