import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ProductRtcQrCodeFormComponent } from '../product-rtc-qr-code-form/product-rtc-qr-code-form.component';
import { ProductRtcQrCodeImportExcelComponent } from '../product-rtc-qr-code-import-excel/product-rtc-qr-code-import-excel.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ProductRtcQrCodeService } from '../product-rtc-qr-code-service/product-rtc-qr-code.service';
import { forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { ActivatedRoute } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../services/permission.service';
import { HistoryProductRtcReturnQrComponent } from '../../inventory-demo/borrow/borrow-product-history/history-product-rtc-return-qr/history-product-rtc-return-qr.component';
import { HistoryProductRtcBorrowQrComponent } from '../../inventory-demo/borrow/borrow-product-history/history-product-rtc-borrow-qr/history-product-rtc-borrow-qr.component';

// SlickGrid imports
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
  Pagination,
} from 'angular-slickgrid';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzLayoutModule,
    NzFlexModule,
    NzSplitterModule,
    NgbModalModule,
    NzModalModule,
    NzSpinModule,
    HasPermissionDirective,
    Menubar,
    AngularSlickgridModule,
  ],
  selector: 'app-product-rtc-qr-code',
  templateUrl: './product-rtc-qr-code.component.html',
  styleUrl: './product-rtc-qr-code.component.css',
})
export class ProductRtcQrCodeComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private ngbModal = inject(NgbModal);

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  isLoading: boolean = false;

  filterText: string = '';
  warehouseID: number = 1;
  qrCodeData: any[] = [];
  modulaLocationGroups: any[] = [];
  selectedModulaLocationID: number | null = null;
  private searchSubject = new Subject<string>();

  productQrCodeMenu: MenuItem[] = [];

  constructor(
    private notification: NzNotificationService,
    private qrCodeService: ProductRtcQrCodeService,
    private modal: NzModalService,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    // Grid is initialized via template
  }

  ngOnInit() {
    // Initialize grid columns and options first
    this.initGridColumns();
    this.initGridOptions();

    this.route.queryParams.subscribe((params) => {
      const warehouseID = params['warehouseID'];

      if (!warehouseID) {
        const savedWarehouseID = localStorage.getItem(
          'product-rtc-qr-code-warehouseID'
        );
        this.warehouseID = savedWarehouseID ? parseInt(savedWarehouseID) : 1;
      } else {
        switch (warehouseID) {
          case '1':
            this.warehouseID = 1;
            break;
          case '2':
            this.warehouseID = 2;
            break;
          case '3':
            this.warehouseID = 3;
            break;
          case '4':
            this.warehouseID = 4;
            break;
          case '5':
            this.warehouseID = 5;
            break;
          case '6':
            this.warehouseID = 6;
            break;
          default:
            this.warehouseID = 1;
        }
        localStorage.setItem(
          'product-rtc-qr-code-warehouseID',
          this.warehouseID.toString()
        );
      }

      this.loadData();
      this.loadModulaLocations();
    });

    this.loadMenu();

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  private initGridColumns(): void {
    // Status formatter
    const statusFormatter: Formatter = (
      row,
      cell,
      value,
      columnDef,
      dataContext
    ) => {
      const status = dataContext['Status'];
      switch (status) {
        case 1:
          return 'Trong kho';
        case 2:
          return 'Đang mượn';
        case 3:
          return 'Đã xuất kho';
        case 4:
          return 'Lost';
        default:
          return value || '';
      }
    };

    // Note formatter with tooltip
    const noteFormatter: Formatter = (
      row,
      cell,
      value,
      columnDef,
      dataContext
    ) => {
      if (!value) return '';
      const maxLength = 50;
      if (value.length > maxLength) {
        const truncated = value.substring(0, maxLength) + '...';
        const escapedValue = value
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const escapedTruncated = truncated
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<span title="${escapedValue}" style="cursor: help;">${escapedTruncated}</span>`;
      }
      return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    this.columnDefinitions = [
      {
        id: 'Status',
        field: 'Status',
        name: 'Trạng thái',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: statusFormatter,
        filter: {
          collection: [
            { value: 1, label: 'Trong kho' },
            { value: 2, label: 'Đang mượn' },
            { value: 3, label: 'Đã xuất kho' },
            { value: 4, label: 'Lost' },
          ],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ProductQRCode',
        field: 'ProductQRCode',
        name: 'Mã QR Code',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'SerialNumber',
        field: 'SerialNumber',
        name: 'SerialNumber',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ProductCodeRTC',
        field: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
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
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'ModulaLocationName',
        field: 'ModulaLocationName',
        name: 'Vị trí modula',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
            autoAdjustDropWidthByTextSize: true,
          } as MultipleSelectOption,
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
        formatter: noteFormatter,
        filter: { model: Filters['compoundInputText'] }
      },
    ];
  }

  private initGridOptions(): void {
    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',

      // Row selection with checkbox
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: true,
        hideInColumnTitleRow: false,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,

      enableCellNavigation: true,
      enableFiltering: true,

      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,

      // No pagination - show all data
      enablePagination: false,
      forceFitColumns: true,
      // Footer row for count
      showFooterRow: true,
      createFooterRow: true,

      rowHeight: 35,
      headerRowHeight: 35,
      enableHeaderMenu: false,
    };
  }

  // SlickGrid ready event
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // Update footer count when data changes
    this.updateFooterCount();

    // Listen to filter changes to update count
    this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateFooterCount();
    });

    // Resize grid after container is rendered
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  // Update footer row with count
  updateFooterCount() {
    if (this.angularGrid?.slickGrid) {
      const grid = this.angularGrid.slickGrid;
      const dataView = this.angularGrid.dataView;
      const visibleRowCount = dataView.getLength();
      const totalRowCount = this.dataset.length;

      const footerRow = grid.getFooterRow();
      if (footerRow) {
        const qrCodeColumn = this.columnDefinitions.find(
          (c) => c.id === 'ProductQRCode'
        );
        if (qrCodeColumn) {
          const qrCodeFooterCell = grid.getFooterRowColumn(qrCodeColumn.id);
          if (qrCodeFooterCell) {
            qrCodeFooterCell.innerHTML = `${visibleRowCount}`;
          }
        }
      }
    }
  }

  // Apply distinct filters - populate filter collections from dataset
  applyDistinctFilters(): void {
    if (!this.angularGrid || !this.dataset || this.dataset.length === 0) return;

    const columnDefinitions = this.angularGrid.slickGrid?.getColumns();
    if (!columnDefinitions) return;

    // Fields to apply distinct filter (exclude Status which has fixed collection)
    const fieldsToFilter = [
      'ProductQRCode',
      'SerialNumber',
      'ProductCode',
      'ProductName',
      'ProductCodeRTC',
      'AddressBox',
      'ModulaLocationName',
    ];

    fieldsToFilter.forEach((field) => {
      const column = columnDefinitions.find((col: any) => col.field === field);
      if (column && column.filter) {
        // Get distinct values from dataset
        const distinctValues = [
          ...new Set(
            this.dataset
              .map((item) => item[field])
              .filter(
                (val) => val !== null && val !== undefined && val !== ''
              )
          ),
        ];
        // Create collection for multiselect
        const collection = distinctValues
          .map((val) => ({ value: val, label: String(val) }))
          .sort((a, b) => a.label.localeCompare(b.label));
        column.filter.collection = collection;
      }
    });

    // Refresh filter row to show updated collections
    this.angularGrid.slickGrid?.setColumns(columnDefinitions);
  }

  // Handle row selection
  handleRowSelection(eventData: any, args: OnSelectedRowsChangedEventArgs) {
    // Optional: Handle selection change events
  }

  // Handle cell click to toggle row selection
  onCellClick(eventData: any, args: any) {
    if (!this.angularGrid?.slickGrid) return;

    const grid = this.angularGrid.slickGrid;
    const row = args.row;
    const cell = args.cell;
    const columns = grid.getColumns();
    const clickedColumn = columns[cell];

    // Check if clicked on checkbox selector column
    const isCheckboxColumn = clickedColumn?.id === '_checkbox_selector';

    if (isCheckboxColumn) {
      // Checkbox column: toggle selection (multiple selection allowed)
      const currentSelectedRows = grid.getSelectedRows();
      const rowIndex = currentSelectedRows.indexOf(row);
      if (rowIndex >= 0) {
        // Row is already selected, remove it
        currentSelectedRows.splice(rowIndex, 1);
      } else {
        // Row is not selected, add it
        currentSelectedRows.push(row);
      }
      grid.setSelectedRows(currentSelectedRows);
    } else {
      // Other columns: single selection only
      grid.setSelectedRows([row]);
    }
  }

  // Get selected data from SlickGrid
  getSelectedData(): any[] {
    if (!this.angularGrid?.slickGrid) return [];
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    const dataView = this.angularGrid.dataView;
    return selectedRowIndexes
      .map((idx: number) => dataView.getItem(idx))
      .filter((item: any) => item);
  }

  loadData() {
    this.isLoading = true;
    console.log('warehouseID = ', this.warehouseID);
    this.qrCodeService
      .getQRCodeList(this.warehouseID, this.filterText || '')
      .subscribe({
        next: (response: any) => {
          console.log('response getQRCodeList = ', response);
          if (response?.status === 1 && response?.data?.dataList) {
            this.qrCodeData = response.data.dataList || [];
          } else {
            this.qrCodeData = [];
          }
          // Map data with unique id for SlickGrid
          this.dataset = this.qrCodeData.map((item: any, index: number) => ({
            ...item,
            id: item.ID || `qr_${index}_${Date.now()}`,
          }));
          this.isLoading = false;
          this.cdr.detectChanges();

          // Apply distinct filters after data is loaded
          setTimeout(() => {
            this.applyDistinctFilters();
            this.updateFooterCount();
          }, 100);
        },
        error: (err: any) => {
          console.error('Error loading QR code data:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải dữ liệu QR code'
          );
          this.qrCodeData = [];
          this.dataset = [];
          this.isLoading = false;
        },
      });
  }

  loadModulaLocations() {
    this.qrCodeService.getLocationModula().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res?.data?.dataList) {
          this.groupModulaLocations(res.data.dataList);
        }
      },
      error: (res: any) => {
        console.error('Error loading modula locations:', res);
      },
    });
  }

  groupModulaLocations(dataList: any[]) {
    const grouped = new Map<number, any[]>();

    dataList.forEach((item: any) => {
      const trayId = item.ModulaLocationID;
      if (trayId) {
        if (!grouped.has(trayId)) {
          grouped.set(trayId, []);
        }
        grouped.get(trayId)!.push(item);
      }
    });

    this.modulaLocationGroups = Array.from(grouped.entries()).map(
      ([trayId, items]) => {
        const trayName = items[0]?.Name || items[0]?.Code || `Tray ${trayId}`;
        return {
          label: trayName,
          options: items.map((item: any) => ({
            value: item.ModulaLocationDetailID,
            label:
              item.LocationName ||
              `${trayName} - ${item.ModulaLocationDetailName ||
              item.ModulaLocationDetailCode ||
              ''
              }`,
          })),
        };
      }
    );
  }

  filterOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const label = option.nzLabel?.toLowerCase() || '';
    return label.includes(searchText);
  };

  onSetModulaLocation() {
    if (!this.selectedModulaLocationID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn vị trí modula'
      );
      return;
    }

    const selectedRows = this.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn bản ghi cần set vị trí'
      );
      return;
    }

    const count = selectedRows.length;
    const content = `Bạn có muốn set vị trí modula cho ${count} bản ghi đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận set vị trí',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = selectedRows.map((row: any) => ({
          ID: row.ID || 0,
          ProductRTCID: row.ProductRTCID,
          ProductQRCode: row.ProductQRCode || '',
          SerialNumber: row.SerialNumber || '',
          Status: row.Status || 1,
          ModulaLocationDetailID: this.selectedModulaLocationID,
          WarehouseID: row.WarehouseID || this.warehouseID,
          IsDeleted: false,
        }));

        this.qrCodeService.saveLocation(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã set vị trí modula cho ${count} bản ghi`
              );
              this.angularGrid?.slickGrid?.setSelectedRows([]);
              this.loadData();
              this.selectedModulaLocationID = null;
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                res?.message || 'Set vị trí modula thất bại'
              );
            }
          },
          error: (res: any) => {
            const errorMessage =
              res?.error?.message || 'Có lỗi xảy ra khi set vị trí modula';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          },
        });
      },
    });
  }

  onAddQRCode() {
    const modalRef = this.ngbModal.open(ProductRtcQrCodeFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = {
      ID: 0,
      WarehouseID: this.warehouseID,
    };
    modalRef.result.then(
      (result) => {
        this.loadData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onEditQRCode() {
    const selectedData = this.getSelectedData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn QR code cần sửa!'
      );
      return;
    }
    const selectedRow = selectedData[0];

    const modalRef = this.ngbModal.open(ProductRtcQrCodeFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = {
      ...selectedRow,
      WarehouseID: this.warehouseID,
    };
    modalRef.result.then(
      (result) => {
        this.loadData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  onDeleteQRCode() {
    const selectedRows = this.getSelectedData();
    if (!selectedRows.length) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn bản ghi cần xóa'
      );
      return;
    }

    const count = selectedRows.length;
    const content = `Bạn có muốn xóa ${count} QR code đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: content,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteRequests = selectedRows.map((row: any) => {
          const payload = [
            {
              ID: row.ID,
              ProductRTCID: row.ProductRTCID,
              ProductQRCode: row.ProductQRCode,
              SerialNumber: row.SerialNumber,
              Status: row.Status,
              ModulaLocationDetailID: row.ModulaLocationDetailID,
              WarehouseID: row.WarehouseID || this.warehouseID,
              IsDeleted: true,
            },
          ];
          return this.qrCodeService.saveData(payload);
        });

        forkJoin(deleteRequests).subscribe({
          next: (responses: any[]) => {
            const success = responses.filter((r) => r?.status === 1).length;
            const failed = responses.length - success;

            if (failed === 0) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa ${success} QR code.`
              );
            } else if (success === 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Không xóa được QR code nào.'
              );
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Xóa thành công ${success}, lỗi ${failed}.`
              );
            }

            this.angularGrid?.slickGrid?.setSelectedRows([]);
            this.loadData();
          },
          error: (error: any) => {
            const errorMessage =
              error?.error?.message || 'Có lỗi xảy ra khi xóa';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          },
        });
      },
    });
  }

  searchQRCode() {
    this.searchSubject.next(this.filterText);
  }

  async exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    const data = this.qrCodeData;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách QR Code');

    const headers = [
      'Trạng thái',
      'ID',
      'ProductRTCID',
      'Mã QR Code',
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Mã nội bộ',
      'Vị trí',
      'Ghi chú',
      'SerialNumber',
      'Vị trí modula',
    ];
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    data.forEach((row: any) => {
      const statusText =
        row.Status === 1
          ? 'Trong kho'
          : row.Status === 2
            ? 'Đang mượn'
            : row.Status === 3
              ? 'Đã xuất kho'
              : row.Status === 4
                ? 'Lost'
                : row.StatusText || '';

      worksheet.addRow([
        statusText,
        row.ID || '',
        row.ProductRTCID || '',
        row.ProductQRCode || '',
        row.ProductCode || '',
        row.ProductName || '',
        row.ProductCodeRTC || '',
        row.AddressBox || '',
        row.Note || '',
        row.SerialNumber || '',
        row.ModulaLocationName || '',
      ]);
    });

    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(0, 10)
      .split('-')
      .reverse()
      .join('');
    const fileName = `QRCode_${formattedDate}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.notification.success(
      NOTIFICATION_TITLE.success,
      'Xuất Excel thành công!'
    );
  }

  openModalImportExcel() {
    const modalRef = this.ngbModal.open(ProductRtcQrCodeImportExcelComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.result.then(
      (result) => {
        this.loadData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  //#region Load menu
  loadMenu() {
    this.productQrCodeMenu = [
      {
        label: 'Thêm',
        icon: 'fa fa-plus text-success',
        visible: this.permissionService.hasPermission('N26,N1,N80'),
        command: () => {
          this.onAddQRCode();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa fa-pencil text-primary',
        visible: this.permissionService.hasPermission('N26,N1,N80'),
        command: () => {
          this.onEditQRCode();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        visible: this.permissionService.hasPermission('N26,N1,N80'),
        command: () => {
          this.onDeleteQRCode();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa fa-file-excel text-success',
        command: () => {
          this.exportExcel();
        },
      },
      {
        label: 'Nhập excel',
        visible: this.permissionService.hasPermission('N26,N1,N80'),
        icon: 'fa-solid fa-file-import text-success',
        command: () => {
          this.openModalImportExcel();
        },
      },
      {
        label: 'Mượn thiết bị QRCode',
        icon: 'fa-solid fa-qrcode text-primary',
        command: () => {
          this.onBorrowProductQRCode();
        },
      },
    ];
  }
  //#endregion

  //#region Mượn thiết bị
  onBorrowProductQRCode() {
    const selectedData = this.getSelectedData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn QR code cần mượn!'
      );
      return;
    }
    let _qrCodes: string[] = [];
    for (let i = 0; i < selectedData.length; i++) {
      const item = selectedData[i];
      if (item.Status == 1) {
        if (!_qrCodes.includes(item.ProductQRCode)) {
          _qrCodes.push(item.ProductQRCode);
        }
      }
    }

    if (_qrCodes.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có sản phẩm hợp lệ để mượn. Vui lòng chọn sản phẩm với trạng thái trong kho!'
      );
      return;
    }

    const modalRef = this.modalService.open(HistoryProductRtcBorrowQrComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
    });
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance._qrCodes = _qrCodes;
    modalRef.componentInstance.isLoadQR = true;
    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.loadData();
        }
      },
      (dismissed) => {
        // Modal dismissed
      }
    );
  }
  //#endregion

  //#region Trả thiết bị
  onReturnProductQRCode() {
    const modalRef = this.modalService.open(HistoryProductRtcReturnQrComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
    });
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.loadData();
        }
      },
      (dismissed) => {
        // Modal dismissed
      }
    );
  }
  //#endregion
}
