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
import { MenuItem, PrimeIcons } from 'primeng/api';
// Angular Slickgrid
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnSelectedRowsChangedEventArgs,
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
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

// ng-bootstrap
import {
  NgbModal,
  NgbActiveModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Services
// import { ProductProtectiveGearService } from '../../borrow-service/borrow.service';
import { AppUserService } from '../../../../services/app-user.service';

// // Components
//import { BorrowProductHistoryDetailComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-detail/borrow-product-history-detail.component';
// import { BorrowProductHistoryDetailComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-detail/borrow-product-history-detail.component';
// import { BorrowProductHistoryBorrowDetailAdminComponent } from '../borrow-product-history-borrow-detail-admin/borrow-product-history-borrow-detail-admin.component';
import { BorrowProductHistoryLogComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-log/borrow-product-history-log.component';
import { BorrowProductHistoryAddErrorPersonalComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-add-error-personal/borrow-product-history-add-error-personal.component';

// import { BorrowProductHistoryEditPersonComponent } from '../borrow-product-history-edit-person/borrow-product-history-edit-person.component';
// import { BillExportTechnicalFormComponent } from '../../../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';

// Config
import { ID_ADMIN_DEMO_LIST, NOTIFICATION_TITLE } from '../../../../app.config';

// Directives
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
// import { HistoryProductRtcDetailComponent } from '../history-product-rtc-detail/history-product-rtc-detail.component';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { HistoryProductRtcProtectiveGearDetailComponent } from '../history-product-rtc-protective-gear-detail/history-product-rtc-protective-gear-detail.component';
import { Menubar } from 'primeng/menubar';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { BorrowProductHistoryEditPersonComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/borrow-product-history-edit-person/borrow-product-history-edit-person.component';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSplitterModule,
    NzTreeSelectModule,
    NgbModalModule,
    HasPermissionDirective,
    Menubar,
    NzCardComponent,
  ],
  selector: 'app-history-product-rtc-protective-gear',
  templateUrl: './history-product-rtc-protective-gear.component.html',
  styleUrls: ['./history-product-rtc-protective-gear.component.css'],
})
export class HistoryProductRtcProtectiveGearComponent
  implements OnInit, AfterViewInit, OnDestroy {
  // INTEGRATION: Input/Output để hoạt động như modal
  menuBars: MenuItem[] = [];
  @Input() isModalMode: boolean = false;
  @Output() productsExported = new EventEmitter<any[]>();
  public activeModal = inject(NgbActiveModal, { optional: true });

  // Parameters
  warehouseID: number = 5;
  userID: number = 0;
  keyWords: string = '';
  dateStart: string = '';
  dateEnd: string = '';
  status: string = '1,2,3,4,5,6,7,8';
  selectedStatus: string[] = ['1', '4', '7', '8'];
  dateExtend: any = new Date(Date.now());
  sizeSearch: string = '0';
  isMobile = window.innerWidth <= 768;
  selectedCondition: number = 0;
  // Data
  employees: any[] = [];
  dataset: any[] = [];
  selectedArrHistoryProductID: Set<number> = new Set();
  selectedProductName: any = '';
  selectedProductCode: any = '';
  selectedProductsMap: Map<number, any> = new Map();

  // AngularSlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  isLoading: boolean = false;

  // No pagination - load all data at once

  // Excel Export
  excelExportService = new ExcelExportService();
  excelBooleanFormatter: Formatter = (_row, _cell, value) => {
    if (value === true) return 'x';
    if (value === false) return '';
    return '';
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    // private ProductProtectiveGearService: ProductProtectiveGearService,
    private appUserService: AppUserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ProductProtectiveGearService: ProductProtectiveGearService,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.warehouseID = params['warehouseID'] || 5;
    });
    this.initMenuBar();
    this.loadDate();
    this.loadEmployee();
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadData();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  initMenuBar() {
    this.menuBars = [
      {
        label: 'Đăng kí mượn',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: true,
        command: () => {
          this.productHistoryDetail();
        },
      },
      {
        label: 'Duyệt mượn',
        icon: 'fa-solid fa-circle-check fa-lg text-primary',
        visible: true,
        command: () => {
          this.approveBorrowing();
        },
      },
      {
        label: 'Duyệt gia hạn',
        icon: 'fa-solid fa-circle-check fa-lg text-primary',
        visible: true,
        command: () => {
          this.extendBorrowing();
        },
      },
      {
        label: 'Trả thiết bị',
        icon: 'fa-solid  fa-arrow-right fa-lg text-primary',
        visible: true,
        command: () => {
          this.returnProduct();
        },
      },
      {
        label: 'Duyệt trả',
        icon: 'fa-solid fa-circle-check fa-lg text-primary',
        visible: true,
        command: () => {
          this.returnProduct();
        },
      },
      {
        label: 'Sửa người mượn',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: true,
        command: () => {
          this.editBorrower();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: true,
        command: () => {
          this.deleteHistoryProductBySave();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: true,
        command: () => {
          this.exportExcel();
        },
      },
    ];
  }
  private initGridColumns(): void {
    this.columnDefinitions = [
      {
        id: 'StatusText',
        field: 'StatusText',
        name: 'Trạng thái',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
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
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'UnitCountName',
        field: 'UnitCountName',
        name: 'ĐVT',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Maker',
        field: 'Maker',
        name: 'Hãng',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'NumberBorrow',
        field: 'NumberBorrow',
        name: 'Số lượng mượn',
        width: 100,
        sortable: true,
        filterable: true,
      },
      {
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí(Hộp)',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'DepartmentName',
        field: 'DepartmentName',
        name: 'Phòng ban',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Người mượn',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
        // Custom formatter for cell coloring
        formatter: (
          row: number,
          cell: number,
          value: any,
          columnDef: Column,
          dataContext: any,
        ) => {
          const statusNew = dataContext['StatusNew'];
          const status = dataContext['Status'];
          const billExportID = dataContext['BillExportTechnicalID'] || 0;

          let bgColor = '';
          let textColor = 'black';

          if (statusNew == 6) {
            // Sắp đến ngày
            bgColor = 'rgb(255, 255, 74)';
          } else if (statusNew == 5) {
            // Quá hạn
            bgColor = 'rgb(239, 31, 62)';
            textColor = 'white';
          } else if (status == 4) {
            // Đăng ký trả
            bgColor = 'rgb(0, 255, 0)';
          } else if (billExportID > 0) {
            // Từ phiếu xuất
            bgColor = 'rgb(128, 255, 255)';
          }

          if (bgColor) {
            return `<span style="background-color: ${bgColor}; color: ${textColor}; display: block; width: 100%; height: 100%; padding: 3px;">${value || ''}</span>`;
          }
          return value || '';
        },
      },
      {
        id: 'DateBorrow',
        field: 'DateBorrow',
        name: 'Ngày mượn',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        cssClass: 'text-center',
      },
      {
        id: 'DateReturnExpected',
        field: 'DateReturnExpected',
        name: 'Ngày trả dự kiến',
        width: 130,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        cssClass: 'text-center',
      },
      {
        id: 'DateReturn',
        field: 'DateReturn',
        name: 'Ngày trả',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          collectionOptions: {
            addBlankEntry: true,
          },
        },
        cssClass: 'text-center',
      },
      {
        id: 'Project',
        field: 'Project',
        name: 'Dự án',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 140,
        sortable: true,
        filterable: true,
      },
    ];
  }

  private initGridOptions(): void {
    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-history-product-rtc',
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
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableHeaderMenu: false,
      enablePagination: false,
      enableContextMenu: true,
      contextMenu: {
        hideCloseButton: false,
        commandItems: [
          {
            command: 'view-history',
            title: 'Lịch sử gia hạn',
            iconCssClass: 'fa fa-history',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              const id = rowData?.ID || 0;
              if (id > 0) {
                this.historyProductRTCLog(id);
              }
            },
          },
          {
            command: 'view-detail',
            title: 'Chi tiết',
            iconCssClass: 'fa fa-info-circle',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              this.openDetailTab(rowData);
            },
          },
          {
            command: 'view-detail',
            title: 'Ghi lại lỗi quy trình nhập xuất kho cá nhân',
            iconCssClass: 'fa fa-warning',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              this.addErrorPersonal(rowData.ID);
            },
          },
          {
            command: 'view-bill-export',
            title: 'Xem phiếu xuất',
            iconCssClass: 'fa fa-file-text-o',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              this.showBillExport(rowData);
            },
          },
        ],
      },
      // Config xuất excel
      externalResources: [this.excelExportService],
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
    };
  }
  addErrorPersonal(ID: number) {
    const modalRef = this.modalService.open(
      BorrowProductHistoryAddErrorPersonalComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: 'xl',
      },
    );
    modalRef.componentInstance.HistoryProductID = ID;
  }
  loadDate() {
    const now = new Date();

    // Đầu tháng -1s
    const from = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
    );
    from.setUTCSeconds(from.getUTCSeconds() - 1);

    // Cuối tháng +1s
    const to = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    );
    to.setUTCSeconds(to.getUTCSeconds());

    this.dateStart = this.ProductProtectiveGearService.formatDateVN(from);
    this.dateEnd = this.ProductProtectiveGearService.formatDateVN(to);
  }

  loadEmployee() {
    this.ProductProtectiveGearService.getEmployeeTeamAndDepartment().subscribe({
      next: (data) => {
        if (data.status == 1) {
          let datas = data.data;
          this.employees = this.ProductProtectiveGearService.createdDataGroup(
            datas,
            'DepartmentName',
          );
        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu nào được tìm thấy.',
          );
        }
      },
      error: (error) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.',
        );
      },
    });
  }

  loadData() {
    // Validate required fields
    if (!this.dateStart || !this.dateEnd) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn ngày bắt đầu và ngày kết thúc!',
      );
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Single API call with large pageSize to load all data at once
    const params = {
      keyWords: this.keyWords?.trim() || '',
      dateStart: this.dateStart
        ? this.ProductProtectiveGearService.formatDateVN(
          new Date(this.dateStart as any),
        )
        : '',
      dateEnd: this.dateEnd
        ? this.ProductProtectiveGearService.formatDateVN(
          new Date(this.dateEnd as any),
        )
        : '',
      warehouseID: this.warehouseID ?? 5,
      userID: this.userID ?? 0,
      status:
        this.selectedStatus && this.selectedStatus.length > 0
          ? this.selectedStatus.join(',')
          : '1',
      isDeleted: this.selectedCondition,

      page: 1,
      size: 9999999, // Load all data in one call
    };

    const sub = this.ProductProtectiveGearService.getProductHistory(
      params,
    ).subscribe({
      next: (response: any) => {
        const data = response.data || [];

        // Map data with unique id for SlickGrid
        // Ensure each item has a unique id (handle duplicate IDs)
        const mappedData = data.map((item: any, index: number) => {
          const originalId = item.ID || 0;
          // Always create unique ID by combining original ID with index
          // This ensures uniqueness even if original IDs are duplicated
          const uniqueId = originalId * 1000000 + index;
          let rowClass = '';
          if (item.IsDelete == true) {
            rowClass = 'row-red';
          }
          return {
            ...item,
            id: uniqueId,
            _rowClass: rowClass,
          };
        });

        this.dataset = mappedData;
        this.isLoading = false;
        this.cdr.detectChanges();

        // Update filter collections after data is loaded
        this.updateFilterCollections();

        // Resize grid
        setTimeout(() => {
          if (this.angularGrid) {
            this.angularGrid.resizerService.resizeGrid();
          }
        }, 100);

        // Re-apply row metadata after data is set (dataset change resets DataView handler)
        setTimeout(() => {
          if (this.angularGrid?.dataView) {
            const originalMetadata = this.angularGrid.dataView.getItemMetadata;
            this.angularGrid.dataView.getItemMetadata = (row: number) => {
              const item = this.angularGrid.dataView.getItem(row);
              if (item && item._rowClass) {
                return { cssClasses: item._rowClass };
              }
              return originalMetadata ? originalMetadata.call(this.angularGrid.dataView, row) : {};
            };
            this.angularGrid.slickGrid.invalidate();
          }
        }, 200);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (error.message || error),
        );
      },
    });
    this.subscriptions.push(sub);
  }

  private updateFilterCollections(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;

    const columns = this.angularGrid.slickGrid.getColumns();
    const allData = this.dataset;

    // Helper function to get unique values for a field
    const getUniqueValues = (
      field: string,
    ): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      allData.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // Update collections for each filterable column
    columns.forEach((column: any) => {
      if (column.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (field && field !== 'AdminConfirm') {
          const collection = getUniqueValues(field);
          if (column.filter) {
            column.filter.collection = collection;
          }
        }
      }
    });

    // Update grid columns
    this.angularGrid.slickGrid.setColumns(columns);
    this.angularGrid.slickGrid.render();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // Resize grid sau khi container đã render
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);

    // Apply row CSS classes based on data
    this.angularGrid.dataView.getItemMetadata = (row: number) => {
      const item = this.angularGrid.dataView.getItem(row);
      if (item && item._rowClass) {
        return {
          cssClasses: item._rowClass,
        };
      }
      return {};
    };
  }

  onRowSelectionChanged(eventData: any, args: OnSelectedRowsChangedEventArgs) {
    // Handle row selection
    const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();

    // Clear previous selection
    this.selectedArrHistoryProductID.clear();
    this.selectedProductsMap.clear();

    // Add selected rows
    selectedIndexes.forEach((index: number) => {
      const rowData = this.angularGrid.dataView.getItem(index);
      if (rowData) {
        const id = rowData.ID;
        this.selectedArrHistoryProductID.add(id);
        this.selectedProductCode = rowData.ProductCode;
        this.selectedProductName = rowData.ProductName;
        this.selectedProductsMap.set(id, rowData);
      }
    });
  }

  getSelectedRows(): any[] {
    if (!this.angularGrid) return [];
    const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();
    if (!selectedIndexes || selectedIndexes.length === 0) return [];
    return selectedIndexes
      .map((index: number) => this.angularGrid.dataView.getItem(index))
      .filter((item: any) => item);
  }

  // UI Methods
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onEmployeeChange(event: number | null) {
    this.userID = event ?? 0;
  }

  onStatusChange(event: string[] | null) {
    this.selectedStatus = event ?? [];
    this.status = this.selectedStatus.join(',');
  }

  filter() {
    this.keyWords = this.keyWords?.trim() || '';
    this.userID = this.userID ?? 0;

    if (!this.selectedStatus || this.selectedStatus.length === 0) {
      this.selectedStatus = ['1'];
    }
    this.status = this.selectedStatus.join(',');

    this.loadData();
    this.toggleSearchPanel();
  }

  resetFilter() {
    this.refresh();
    this.toggleSearchPanel();
  }

  expiredProduct() {
    this.keyWords = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.warehouseID = 5;
    this.userID = 0;
    this.selectedStatus = ['5'];
    this.status = '5';
    this.loadDate();
    this.loadData();
  }

  refresh() {
    this.keyWords = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.warehouseID = 5;
    this.userID = 0;
    this.selectedStatus = ['1'];
    this.status = '1';
    this.loadDate();
    this.loadData();
  }

  // Action Methods (keeping the logic from borrow-product-history)
  returnProduct() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần trả!.',
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận trả ',
        nzContent: `Bạn có chắc chắn muốn trả sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const employeeID = this.appUserService?.employeeID || 0;
          const arrIds = Array.from(this.selectedArrHistoryProductID);

          const validateAndProcess = async () => {
            const validItems: Array<{
              id: number;
              modulaLocationDetailID: number;
            }> = [];

            for (const id of arrIds) {
              try {
                const rowData = this.selectedProductsMap.get(id);
                if (!rowData) {
                  continue;
                }

                const historyRes = await firstValueFrom(
                  this.ProductProtectiveGearService.getHistoryProductRTCByID(
                    id,
                  ),
                );

                if (historyRes?.status !== 1 || !historyRes?.data) {
                  continue;
                }

                const model = historyRes.data;
                const status = model.Status || 0;
                const modulaLocationDetailID =
                  model.ModulaLocationDetailID || 0;
                const statusPerson = model.StatusPerson || 0;

                if (status !== 1 && status !== 4 && status !== 7) {
                  continue;
                }

                // if (isGlobalAdmin || isAdmin) {
                //   if (
                //     modulaLocationDetailID > 0 &&
                //     statusPerson <= 0 &&
                //     !(isGlobalAdmin && employeeID <= 0)
                //   ) {
                //     this.notification.error(
                //       'Thông báo',
                //       'Nhân viên chưa hoàn thành thao tác trả hàng.\nBạn không thể duyệt trả!',
                //     );
                //     return;
                //   }
                // }

                validItems.push({ id, modulaLocationDetailID });
              } catch (error) {
                // Bỏ qua item này và tiếp tục
              }
            }

            if (validItems.length === 0) {
              this.notification.warning(
                'Thông báo',
                'Không có sản phẩm nào hợp lệ để trả!',
              );
              return;
            }

            const tasks = validItems.map((item) =>
              firstValueFrom(
                this.ProductProtectiveGearService.postReturnProductRTC(
                  item.id,
                  false,
                  item.modulaLocationDetailID,
                ),
              )
                .then(() => ({ id: item.id, success: true, message: null }))
                .catch((error) => {
                  const message =
                    error?.error?.message || 'Lỗi không xác định!';
                  return { id: item.id, success: false, message };
                }),
            );

            return Promise.all(tasks).then((results) => {
              const ok = results.filter((r) => r.success).length;
              const failed = results.filter((r) => !r.success);

              if (ok > 0)
                this.notification.success(
                  'Thông báo',
                  `Trả thành công ${ok} sản phẩm.`,
                );
              if (failed.length > 0)
                failed.forEach((item) => {
                  this.notification.error('Trả thất bại', item.message);
                });
              this.loadData();
              this.selectedArrHistoryProductID.clear();
              this.selectedProductsMap.clear();
              // Clear SlickGrid selection to sync with cleared tracking Sets
              if (this.angularGrid && this.angularGrid.slickGrid) {
                this.angularGrid.slickGrid.setSelectedRows([]);
              }
            });
          };

          return validateAndProcess();
        },
      });
    }
  }

  extendBorrowing() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm gia hạn!.',
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận gia hạn',
        nzContent: `Bạn có chắc chắn muốn gia hạn sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: async () => {
          const ids = Array.from(this.selectedArrHistoryProductID);
          if (!ids.length) {
            this.notification.warning('Thông báo', 'Chưa chọn sản phẩm nào.');
            return;
          }
          const dateExtend = this.dateExtend.toISOString();

          const tasks = ids.map(async (id) => {
            try {
              const res = await firstValueFrom(
                this.ProductProtectiveGearService.getHistoryProductRTCByID(id),
              );
              if (res?.status !== 1) throw new Error('Truy vấn thất bại');

              const history = {
                ...res.data,
                DateReturnExpected: dateExtend,
                UpdatedDate: new Date().toISOString(),
              };
              const up = await firstValueFrom(
                this.ProductProtectiveGearService.postSaveExtendProduct(
                  history,
                ),
              );
              if (up?.status !== 1) throw new Error('Cập nhật thất bại');
              return { id, success: true };
            } catch (err) {
              return { id, success: false, err };
            }
          });

          const results = await Promise.allSettled(tasks);
          const flat = results.map((r) =>
            r.status === 'fulfilled' ? r.value : r.reason,
          );
          const ok = flat.filter((x: any) => x?.success).length;
          const fail = flat.length - ok;

          if (ok)
            this.notification.success(
              'Thông báo',
              `Gia hạn thành công ${ok} sản phẩm.`,
            );
          if (fail)
            this.notification.error(
              'Thông báo',
              `Gia hạn thất bại ${fail} sản phẩm.`,
            );

          this.loadData();
          this.selectedArrHistoryProductID.clear();
          // Clear SlickGrid selection to sync with cleared tracking Sets
          if (this.angularGrid && this.angularGrid.slickGrid) {
            this.angularGrid.slickGrid.setSelectedRows([]);
          }
        },
      });
    }
  }

  approveBorrowing() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần duyệt!.',
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận trả ',
        nzContent: `Bạn có chắc chắn muốn duyệt sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const arrIds = Array.from(this.selectedArrHistoryProductID);
          const tasks = arrIds.map((id) => {
            const rowData = this.selectedProductsMap.get(id);
            const productCode =
              rowData?.ProductCodeRTC || rowData?.ProductCode || 'N/A';

            return firstValueFrom(
              this.ProductProtectiveGearService.postApproveBorrowingRTC(
                id,
                false,
              ),
            )
              .then(() => ({
                id,
                success: true,
                message: null,
                ProductNewCode: productCode,
              }))
              .catch((error) => {
                const message = error?.error?.message || 'Lỗi không xác định!';
                return {
                  id,
                  success: false,
                  message,
                  ProductNewCode: productCode,
                };
              });
          });

          return Promise.all(tasks).then((results) => {
            const ok = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success);

            if (ok > 0)
              this.notification.success(
                'Thông báo',
                `Duyệt thành công ${ok} sản phẩm.`,
              );

            if (failed.length > 0) {
              failed.forEach((item) => {
                this.notification.error(
                  'Duyệt thất bại',
                  `Thiết bị ${item.ProductNewCode}: ${item.message}`,
                );
              });
            }

            this.loadData();
            this.selectedArrHistoryProductID.clear();
            this.selectedProductsMap.clear();
            // Clear SlickGrid selection to sync with cleared tracking Sets
            if (this.angularGrid && this.angularGrid.slickGrid) {
              this.angularGrid.slickGrid.setSelectedRows([]);
            }
          });
        },
      });
    }
  }

  editBorrower() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần chuyển người mượn!.',
      );
      return;
    } else {
      const modalRef = this.modalService.open(
        BorrowProductHistoryEditPersonComponent,
        {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          scrollable: true,
          size: 'xl',
        },
      );
      modalRef.componentInstance.arrHistoryProductID = Array.from(
        this.selectedArrHistoryProductID,
      );
      modalRef.componentInstance.ProductName = this.selectedProductName;
      modalRef.componentInstance.ProductCode = this.selectedProductCode;
      modalRef.result.finally(() => {
        this.loadData();
      });
    }
  }

  deleteHistoryProduct(ids?: number[]) {
    const idsToDelete = ids ?? Array.from(this.selectedArrHistoryProductID);

    if (idsToDelete.length === 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa thiết bị đã chọn khỏi lịch sử mượn không?`,
      nzOkText: 'Có',
      nzCancelText: 'Không',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          const response = await firstValueFrom(
            this.ProductProtectiveGearService.postDeleteHistoryProduct(
              idsToDelete,
            ),
          );

          if (response?.status === 1) {
            this.notification.success(
              'Thông báo',
              `Xóa thành công ${idsToDelete.length} thiết bị khỏi lịch sử mượn.`,
            );
            this.loadData();
            this.selectedArrHistoryProductID.clear();
            this.selectedProductsMap.clear();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Xóa thất bại!',
            );
          }
        } catch (error: any) {
          const message = error?.error?.message || 'Đã xảy ra lỗi khi xóa!';
          this.notification.error('Lỗi', message);
        }
      },
    });
  }

  /**
   * Xóa lịch sử mượn bằng cách gọi API save với IsDelete = true
   */
  deleteHistoryProductBySave() {
    const idsToDelete = Array.from(this.selectedArrHistoryProductID);

    if (idsToDelete.length === 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa ${idsToDelete.length} thiết bị đã chọn khỏi lịch sử mượn không?`,
      nzOkText: 'Có',
      nzCancelText: 'Không',
      nzOkDanger: true,
      nzOnOk: async () => {
        const deleteRequests = idsToDelete.map(async (id) => {
          try {
            // Lấy thông tin sản phẩm từ selectedProductsMap
            const productData = this.selectedProductsMap.get(id);
            if (!productData) {
              return {
                id,
                success: false,
                message: 'Không tìm thấy thông tin sản phẩm!',
              };
            }

            // Gọi API save với IsDelete = true
            const data = {
              ID: productData.ID || id,
              ProductRTCID: productData.ProductRTCID || 0,
              PeopleID: productData.PeopleID || 0,
              Project: productData.Project || '',
              Note: productData.Note || '',
              Status: productData.Status || 0,
              DateReturnExpected: productData.DateReturnExpected || null,
              DateBorrow: productData.DateBorrow || null,
              NumberBorrow: productData.NumberBorrow || 0,
              SerialNumber: productData.SerialNumber || '',
              WarehouseID: productData.WarehouseID || this.warehouseID,
              IsDelete: true, // Flag để xóa
            };

            await firstValueFrom(
              this.ProductProtectiveGearService.postSaveHistoryProductRTC(data),
            );
            return { id, success: true, message: null };
          } catch (error: any) {
            const message = error?.error?.message || 'Lỗi không xác định!';
            return { id, success: false, message };
          }
        });

        const results = await Promise.all(deleteRequests);
        const successCount = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success);

        if (successCount > 0) {
          this.notification.success(
            'Thông báo',
            `Xóa thành công ${successCount} thiết bị khỏi lịch sử mượn.`,
          );
        }

        if (failed.length > 0) {
          failed.forEach((f) => {
            this.notification.error(
              'Xóa thất bại',
              f.message || 'Lỗi không xác định',
            );
          });
        }

        this.loadData();
        this.selectedArrHistoryProductID.clear();
        this.selectedProductsMap.clear();
        // Clear SlickGrid selection to sync with cleared tracking Sets
        if (this.angularGrid && this.angularGrid.slickGrid) {
          this.angularGrid.slickGrid.setSelectedRows([]);
        }
      },
    });
  }

  exportSelectedProducts() {
    if (this.selectedArrHistoryProductID.size === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xuất!',
      );
      return;
    }

    const selectedProducts = Array.from(this.selectedArrHistoryProductID)
      .map((id) => {
        return this.selectedProductsMap.get(id);
      })
      .filter((product) => product != null);

    if (selectedProducts.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có sản phẩm hợp lệ để xuất!',
      );
      return;
    }

    this.productsExported.emit(selectedProducts);
    this.activeModal?.close(selectedProducts);
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.dismiss('cancel');
    }
  }

  productHistoryBorrowDetail(id?: number, rowData?: any) {
    // const modalRef = this.modalService.open(
    //   BorrowProductHistoryBorrowDetailAdminComponent,
    //   {
    //     backdrop: 'static',
    //     keyboard: false,
    //     centered: true,
    //     scrollable: true,
    //     size: 'xl',
    //   }
    // );
    // modalRef.componentInstance.HistoryProductID =
    //   id ?? Array.from(this.selectedArrHistoryProductID).at(-1) ?? 0;
    // modalRef.result.then(
    //   (result) => {
    //     if (result === true) {
    //       this.loadData();
    //     }
    //   }
    // ).catch(() => {
    //   // Modal dismissed
    // });
  }

  productHistoryDetail() {
    const modalRef = this.modalService.open(
      HistoryProductRtcProtectiveGearDetailComponent,
      {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
      },
    );
    modalRef.componentInstance.warehouseType = 0;

    modalRef.result.finally(() => {
      this.loadData();
    });
  }

  historyProductRTCLog(ID: number) {
    const modalRef = this.modalService.open(BorrowProductHistoryLogComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      scrollable: true,
      size: 'xl',
    });
    modalRef.componentInstance.HistoryProductID = ID;
    modalRef.componentInstance.warehouseType = 1;
  }

  exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.error('', 'Không có dữ liệu xuất Excel!');
      return;
    }

    const now = DateTime.fromJSDate(new Date()).toFormat('ddMMyyyyHHmmss');
    const dateStart = this.dateStart
      ? DateTime.fromISO(this.dateStart).toFormat('ddMMyyyy')
      : '';
    const dateEnd = this.dateEnd
      ? DateTime.fromISO(this.dateEnd).toFormat('ddMMyyyy')
      : '';

    const filename = `LichSuMuon_${now}`;

    this.excelExportService.exportToExcel({
      filename: filename,
      format: 'xlsx',
    });
  }

  showBillExport(rowData: any): void {
    const billExportID = rowData.BillExportTechnicalID || 0;

    if (billExportID <= 0) {
      this.notification.warning('Thông báo', 'Không có phiếu xuất liên kết!');
      return;
    }

    // const modalRef = this.modalService.open(BillExportTechnicalFormComponent, {
    //   centered: true,
    //   backdrop: 'static',
    //   keyboard: false,
    //   windowClass: 'full-screen-modal',
    // });

    // modalRef.componentInstance.masterId = billExportID;
    // modalRef.componentInstance.warehouseID = this.warehouseID;
    // modalRef.componentInstance.warehouseType = this.warehouseType;
    // modalRef.componentInstance.fromBorrowHistory = true;

    // modalRef.result.then(
    //   (result) => {
    //     if (result === true) {
    //       this.loadData();
    //     }
    //   },
    //   (dismissed) => {
    //     // Modal dismissed
    //   }
    // );
  }

  openDetailTab(rowData: any): void {
    const params = new URLSearchParams({
      productRTCID1: String(rowData.ProductRTCID || 0),
      warehouseID1: String(this.warehouseID || 5),
      ProductCode: rowData.ProductCode || '',
      ProductName: rowData.ProductName || '',
      NumberBegin: String(rowData.Number || 0),
      InventoryLatest: String(rowData.InventoryLatest || 0),
      NumberImport: String(rowData.NumberImport || 0),
      NumberExport: String(rowData.NumberExport || 0),
      NumberBorrowing: String(rowData.NumberBorrowing || 0),
      InventoryReal: String(rowData.InventoryReal || 0),
    });

    window.open(
      `/material-detail-of-product-rtc?${params.toString()}`,
      '_blank',
      'width=1200,height=800,scrollbars=yes,resizable=yes',
    );
  }
}
