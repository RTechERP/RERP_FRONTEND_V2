import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Editors,
    GridOption,
} from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { ViewPokhSlickgridComponent } from './view-pokh-slickgrid.component';

@Component({
    selector: 'app-view-pokh-row-detail-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AngularSlickgridModule,
        NzButtonModule,
        NzIconModule,
    ],
    template: `
    <div class="row-detail-container">
      <!-- Tab Header -->
      <div class="row-detail-tab-header" *ngIf="hasExportData && hasInvoiceData">
        <button class="row-detail-tab-btn" [class.active]="activeTab === 'export'" (click)="switchTab('export')">
          Xuất kho ({{ exportDataset.length }})
        </button>
        <button class="row-detail-tab-btn" [class.active]="activeTab === 'invoice'" (click)="switchTab('invoice')">
          Hóa đơn ({{ invoiceDataset.length }})
        </button>
      </div>

      <!-- Export Grid -->
      <div class="inner-grid-container" *ngIf="activeTab === 'export' && hasExportData">
        <angular-slickgrid
          [gridId]="exportGridId"
          [columns]="exportColumnDefinitions"
          [options]="exportGridOptions"
          [dataset]="exportDataset"
          (onAngularGridCreated)="exportGridReady($event.detail)">
        </angular-slickgrid>
      </div>

      <!-- Invoice Grid -->
      <div class="inner-grid-container" *ngIf="activeTab === 'invoice' && hasInvoiceData">
        <angular-slickgrid
          [gridId]="invoiceGridId"
          [columns]="invoiceColumnDefinitions"
          [options]="invoiceGridOptions"
          [dataset]="invoiceDataset"
          (onAngularGridCreated)="invoiceGridReady($event.detail)">
        </angular-slickgrid>
      </div>

      <!-- No Data Message -->
      <div class="no-data-message" *ngIf="!hasExportData && !hasInvoiceData">
        <span>Không có dữ liệu chi tiết</span>
      </div>
    </div>
  `,
    styles: [`
    .row-detail-container {
      padding: 6px 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    .row-detail-tab-header {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }
    .row-detail-tab-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1px 8px;
      font-size: 11px;
      line-height: 1.3;
      font-weight: 500;
      color: #595959;
      background-color: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .row-detail-tab-btn:hover {
      color: #1890ff;
      border-color: #1890ff;
    }
    .row-detail-tab-btn.active {
      color: #fff;
      background-color: #1890ff;
      border-color: #1890ff;
    }
    .inner-grid-container {
      height: 130px;
      max-width: 700px;
      background-color: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
    }
    .no-data-message {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 13px;
    }
  `],
    encapsulation: ViewEncapsulation.None
})
export class ViewPokhRowDetailViewComponent implements OnInit, OnDestroy {
    // Model data passed from parent grid
    model: any;

    // Access to addon, grid, dataView from SlickGrid
    addon: any;
    grid: any;
    dataView: any;

    // Parent component reference
    parentRef!: ViewPokhSlickgridComponent;

    // Tab state
    activeTab: 'export' | 'invoice' = 'export';

    // Export Grid
    exportGridId = '';
    exportAngularGrid!: AngularGridInstance;
    exportColumnDefinitions: Column[] = [];
    exportGridOptions: GridOption = {};
    exportDataset: any[] = [];

    // Invoice Grid
    invoiceGridId = '';
    invoiceAngularGrid!: AngularGridInstance;
    invoiceColumnDefinitions: Column[] = [];
    invoiceGridOptions: GridOption = {};
    invoiceDataset: any[] = [];

    get hasExportData(): boolean {
        return this.exportDataset && this.exportDataset.length > 0;
    }

    get hasInvoiceData(): boolean {
        return this.invoiceDataset && this.invoiceDataset.length > 0;
    }

    ngOnInit(): void {
        // Generate unique grid IDs based on model ID
        this.exportGridId = `export-inner-${this.model?.ID || 0}`;
        this.invoiceGridId = `invoice-inner-${this.model?.ID || 0}`;

        this.initExportGrid();
        this.initInvoiceGrid();

        this.loadData();

        // đặt tab mặc định lúc mở lên 
        if (this.hasExportData) {
            this.activeTab = 'export';
        } else if (this.hasInvoiceData) {
            this.activeTab = 'invoice';
        }

        if (this.parentRef && this.model?.ID) {
            this.parentRef.nestedRowDetailViews.set(this.model.ID, this);
        }
    }

    ngOnDestroy(): void {
        if (this.parentRef && this.model?.ID) {
            this.parentRef.nestedRowDetailViews.delete(this.model.ID);
        }
    }

    loadData(): void {
        if (this.model?.exportDetails) {
            this.exportDataset = this.model.exportDetails.map((item: any, idx: number) => ({
                ...item,
                id: item.BillExportDetailID || item.ID || idx,
            }));
        }

        if (this.model?.invoiceDetails) {
            this.invoiceDataset = this.model.invoiceDetails.map((item: any, idx: number) => ({
                ...item,
                id: item.RequestInvoiceDetailID || item.ID || idx,
            }));
        }
    }

    initExportGrid(): void {
        this.exportColumnDefinitions = [
            {
                id: 'select',
                name: '',
                field: 'select',
                width: 40,
                minWidth: 40,
                maxWidth: 40,
                formatter: (row, cell, value, columnDef, dataContext) => {
                    // Dùng Code + POKHDetailID làm composite key (vì BillExportDetailID có thể undefined)
                    const isSelected = this.parentRef?.selectedExportRowsAll?.some(
                        (r: any) => r.POKHDetailID === dataContext.POKHDetailID && r.Code === dataContext.Code
                    );
                    return `<div style="text-align: center;">
            <input type="checkbox" ${isSelected ? 'checked' : ''} class="export-row-checkbox" 
              data-code="${dataContext.Code}" 
              data-parent-id="${dataContext.POKHDetailID}" 
              style="cursor: pointer; width: 16px; height: 16px;"/>
          </div>`;
                },
                excludeFromExport: true,
            },
            { id: 'Code', name: 'Mã phiếu xuất', field: 'Code', width: 200, minWidth: 200, sortable: true },
            { id: 'TotalQty', name: 'Tổng SL PO', field: 'TotalQty', width: 120, minWidth: 120, sortable: true, cssClass: 'text-end' },
            { id: 'Qty', name: 'SL xuất', field: 'Qty', width: 120, minWidth: 120, sortable: true, cssClass: 'text-end' },
        ];

        this.exportGridOptions = {
            autoResize: {
                container: `.inner-grid-container`,
                calculateAvailableSizeBy: 'container',
            },
            enableAutoResize: true,
            gridHeight: 120,
            enableCellNavigation: true,
            enableFiltering: false,
            rowHeight: 30,
            headerRowHeight: 15,
        };
    }

    initInvoiceGrid(): void {
        this.invoiceColumnDefinitions = [
            { id: 'RequestInvoiceCode', name: 'Mã lệnh', field: 'RequestInvoiceCode', width: 170, minWidth: 170, sortable: true },
            { id: 'TaxCompanyName', name: 'Công ty', field: 'TaxCompanyName', width: 150, minWidth: 150, sortable: true },
            {
                id: 'InvoiceNumber',
                name: 'Số hóa đơn',
                field: 'InvoiceNumber',
                width: 170,
                minWidth: 170,
                sortable: true,
                editor: { model: Editors['text'] },
            },
            {
                id: 'InvoiceDate',
                name: 'Ngày hóa đơn',
                field: 'InvoiceDate',
                width: 150,
                minWidth: 150,
                sortable: true,
                formatter: this.dateFormatter,
                editor: { model: Editors['date'] },
            },
        ];

        this.invoiceGridOptions = {
            autoResize: {
                container: `.inner-grid-container`,
                calculateAvailableSizeBy: 'container',
            },
            enableAutoResize: true,
            gridHeight: 120,
            enableCellNavigation: true,
            enableFiltering: false,
            editable: true,
            autoEdit: false,
            rowHeight: 30,
            headerRowHeight: 15,
        };
    }

    dateFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    switchTab(tab: 'export' | 'invoice'): void {
        this.activeTab = tab;
        // Resize grid sau khi chuyển tab để đảm bảo width đúng
        setTimeout(() => {
            if (tab === 'invoice' && this.invoiceAngularGrid?.resizerService) {
                this.invoiceAngularGrid.resizerService.resizeGrid();
            } else if (tab === 'export' && this.exportAngularGrid?.resizerService) {
                this.exportAngularGrid.resizerService.resizeGrid();
            }
        }, 50);
    }

    exportGridReady(angularGrid: AngularGridInstance): void {
        this.exportAngularGrid = angularGrid;

        if (angularGrid.slickGrid) {
            // Handle checkbox clicks
            angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('export-row-checkbox')) {
                    e.stopImmediatePropagation();
                    const isChecked = (target as HTMLInputElement).checked;
                    const dataContext = angularGrid.slickGrid?.getDataItem(args.row);
                    if (dataContext && this.parentRef) {
                        this.parentRef.handleExportRowSelect(dataContext, this.model.ID, isChecked);
                        // Refresh master grid to update parent row checkbox
                        this.parentRef.refreshMasterGridRow(this.model.ID);
                    }
                    angularGrid.slickGrid?.invalidateRow(args.row);
                    angularGrid.slickGrid?.render();
                }
            });

            // Handle selection changes
            angularGrid.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
                const selectedRowIndexes = args.rows || [];
                const allData = angularGrid.dataView?.getItems() || [];
                const parentId = this.model.ID;

                if (this.parentRef) {
                    // Remove all previous selections for this parent
                    this.parentRef.selectedExportRowsAll = this.parentRef.selectedExportRowsAll.filter(
                        (x: any) => x.POKHDetailID !== parentId
                    );

                    // Add new selections
                    selectedRowIndexes.forEach((idx: number) => {
                        const item = allData[idx];
                        if (item) {
                            this.parentRef.selectedExportRowsAll.push({
                                POKHDetailID: parentId,
                                BillExportDetailID: item.BillExportDetailID || item.ID,
                                Code: item.Code || '',
                            });
                        }
                    });

                    // Sync parent selection
                    if (selectedRowIndexes.length > 0) {
                        if (!this.parentRef.selectedRowsAll.some((r: any) => r.ID === parentId)) {
                            this.parentRef.selectedRowsAll.push({ ...this.model });
                        }
                    }
                }
            });
        }
    }

    invoiceGridReady(angularGrid: AngularGridInstance): void {
        this.invoiceAngularGrid = angularGrid;

        if (angularGrid.slickGrid) {
            // Handle cell changes for tracking modified invoice rows
            angularGrid.slickGrid.onCellChange.subscribe((e: any, args: any) => {
                const item = args.item;
                if (item && item.RequestInvoiceDetailID && this.parentRef) {
                    this.parentRef.modifiedInvoiceRows.add(item.RequestInvoiceDetailID);

                    const parentDataset = this.parentRef.dataset;
                    if (parentDataset) {
                        const parentRow = parentDataset.find((p: any) => p.ID === this.model.ID);
                        if (parentRow && parentRow.invoiceDetails) {
                            const invoiceIndex = parentRow.invoiceDetails.findIndex(
                                (inv: any) => inv.RequestInvoiceDetailID === item.RequestInvoiceDetailID
                            );
                            if (invoiceIndex >= 0) {
                                parentRow.invoiceDetails[invoiceIndex] = { ...item };
                            }
                        }
                    }
                }
            });
        }
    }
}
