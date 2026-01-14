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
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// ng-bootstrap
import {
  NgbModal,
  NgbActiveModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Services
import { BorrowService } from '../../borrow-service/borrow.service';
import { AppUserService } from '../../../../../../services/app-user.service';

// Components
import { BorrowProductHistoryDetailComponent } from '../borrow-product-history-detail/borrow-product-history-detail.component';
import { BorrowProductHistoryBorrowDetailAdminComponent } from '../borrow-product-history-borrow-detail-admin/borrow-product-history-borrow-detail-admin.component';
import { BorrowProductHistoryLogComponent } from '../borrow-product-history-log/borrow-product-history-log.component';
import { BorrowProductHistoryEditPersonComponent } from '../borrow-product-history-edit-person/borrow-product-history-edit-person.component';
import { BillExportTechnicalFormComponent } from '../../../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';

// Config
import {
  ID_ADMIN_DEMO_LIST,
  NOTIFICATION_TITLE,
} from '../../../../../../app.config';

// Directives
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
import { HistoryProductRtcDetailComponent } from '../history-product-rtc-detail/history-product-rtc-detail.component';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../../../services/permission.service';
import { HistoryProductRtcBorrowQrComponent } from '../history-product-rtc-borrow-qr/history-product-rtc-borrow-qr.component';
import { HistoryProductRtcReturnQrComponent } from '../history-product-rtc-return-qr/history-product-rtc-return-qr.component';

@Component({
  selector: 'app-history-product-rtc',
  templateUrl: './history-product-rtc.component.html',
  styleUrls: ['./history-product-rtc.component.css'],
  standalone: true,
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
    NzDropDownModule,
    NgbModalModule,
    Menubar,
  ],
})
export class HistoryProductRtcComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  // INTEGRATION: Input/Output để hoạt động như modal
  @Input() isModalMode: boolean = false;
  @Output() productsExported = new EventEmitter<any[]>();
  public activeModal = inject(NgbActiveModal, { optional: true });
  historyProductMenu: MenuItem[] = [];
  // Parameters
  warehouseType: number = 0;
  warehouseID: number = 1;
  userID: number = 0;
  keyWords: string = '';
  dateStart: string = '';
  dateEnd: string = '';
  status: string = '1,2,3,4,5,6,7,8';
  selectedStatus: string[] = ['1'];
  dateExtend: any = new Date(Date.now());
  sizeSearch: string = '0';

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
  shouldShowSearchBar: boolean = true;

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
    private borrowService: BorrowService,
    private appUserService: AppUserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadMenu();
    this.route.queryParams.subscribe((params) => {
      this.warehouseID = params['warehouseID'] || 1;
      this.warehouseType = params['warehouseType'] || 1;
    });

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
        id: 'AdminConfirm',
        field: 'AdminConfirm',
        name: 'Duyệt',
        width: 80,
        sortable: true,
        filterable: true,
        formatter: Formatters.checkmarkMaterial,
        exportCustomFormatter: this.excelBooleanFormatter,
        filter: {
          model: Filters['multipleSelect'],
          collection: [
            { value: true, label: 'Có' },
            { value: false, label: 'Không' },
          ],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên',
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
        id: 'ProductQRCode',
        field: 'ProductQRCode',
        name: 'Mã QR',
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
        id: 'SerialNumber',
        field: 'SerialNumber',
        name: 'Serial',
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
        id: 'PartNumber',
        field: 'PartNumber',
        name: 'Part Number',
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
        id: 'Serial',
        field: 'Serial',
        name: 'Code',
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
        name: 'Vị trí hộp',
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
        id: 'ModulaLocationName',
        field: 'ModulaLocationName',
        name: 'Vị trí Modula',
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
        id: 'AddressBoxActual',
        field: 'AddressBoxActual',
        name: 'Vị trí trả',
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
          dataContext: any
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
            return `<span style="background-color: ${bgColor}; color: ${textColor}; display: block; width: 100%; height: 100%; padding: 3px;">${
              value || ''
            }</span>`;
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
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          try {
            return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
          } catch {
            return value;
          }
        },
      },
      {
        id: 'DateReturnExpected',
        field: 'DateReturnExpected',
        name: 'Ngày trả dự kiến',
        width: 130,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          try {
            return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
          } catch {
            return value;
          }
        },
      },
      {
        id: 'DateReturn',
        field: 'DateReturn',
        name: 'Ngày trả',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (row: number, cell: number, value: any) => {
          if (!value) return '';
          try {
            return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
          } catch {
            return value;
          }
        },
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
        name: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'BillExportCode',
        field: 'BillExportCode',
        name: 'Mã phiếu xuất',
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
        id: 'BillTypeText',
        field: 'BillTypeText',
        name: 'Loại phiếu',
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
            command: 'view-bill-export',
            title: 'Xem phiếu xuất',
            iconCssClass: 'fa fa-file-text-o',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              this.showBillExport(rowData);
            },
          },
          {
            command: 'delete',
            title: 'Xóa',
            iconCssClass: 'fa fa-trash',
            action: (e: any, args: any) => {
              const rowData = args.dataContext;
              const id = rowData?.ID || 0;
              if (id > 0) {
                this.deleteHistoryProduct([id]);
              }
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

  loadDate() {
    const now = new Date();

    // Đầu tháng -1s
    const from = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    );
    from.setUTCSeconds(from.getUTCSeconds() - 1);

    // Cuối tháng +1s
    const to = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    );
    to.setUTCSeconds(to.getUTCSeconds());

    this.dateStart = this.borrowService.formatDateVN(from);
    this.dateEnd = this.borrowService.formatDateVN(to);
  }

  loadEmployee() {
    this.borrowService.getEmployeeTeamAndDepartment().subscribe({
      next: (data) => {
        if (data.status == 1) {
          let datas = data.data;
          this.employees = this.borrowService.createdDataGroup(
            datas,
            'DepartmentName'
          );
        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu nào được tìm thấy.'
          );
        }
      },
      error: (error) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        );
      },
    });
  }

  loadData() {
    this.isLoading = true;

    // Single API call with large pageSize to load all data at once
    const params = {
      keyWords: this.keyWords?.trim() || '',
      dateStart: this.dateStart
        ? this.borrowService.formatDateVN(new Date(this.dateStart as any))
        : '',
      dateEnd: this.dateEnd
        ? this.borrowService.formatDateVN(new Date(this.dateEnd as any))
        : '',
      warehouseID: this.warehouseID ?? 0,
      userID: this.userID ?? 0,
      status:
        this.selectedStatus && this.selectedStatus.length > 0
          ? this.selectedStatus.join(',')
          : '1',
      isDeleted: 0,
      warehouseType: this.warehouseType ?? 1,
      page: 1,
      size: 9999999, // Load all data in one call
    };

    const sub = this.borrowService.getProductHistory(params).subscribe({
      next: (response: any) => {
        const data = response.data || [];

        // Map data with unique id for SlickGrid
        // Ensure each item has a unique id (handle duplicate IDs)
        const mappedData = data.map((item: any, index: number) => {
          const originalId = item.ID || 0;
          // Always create unique ID by combining original ID with index
          // This ensures uniqueness even if original IDs are duplicated
          const uniqueId = originalId * 1000000 + index;

          return {
            ...item,
            id: uniqueId,
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
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (error.message || error)
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
      field: string
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
  }

  resetFilter() {
    this.refresh();
    this.toggleSearchPanel();
  }

  expiredProduct() {
    this.keyWords = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.warehouseID = 1;
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
    this.warehouseID = 1;
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
        'Vui lòng chọn sản phẩm cần trả!.'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận trả ',
        nzContent: `Bạn có chắc chắn muốn trả sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const IDAdminDemo = ID_ADMIN_DEMO_LIST || [];
          const userId = this.appUserService?.id || 0;
          const isAdmin = IDAdminDemo.includes(userId);
          const isGlobalAdmin = this.appUserService?.isAdmin || false;
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
                  this.borrowService.getHistoryProductRTCByID(id)
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

                if (isGlobalAdmin || isAdmin) {
                  if (
                    modulaLocationDetailID > 0 &&
                    statusPerson <= 0 &&
                    !(isGlobalAdmin && employeeID <= 0)
                  ) {
                    this.notification.error(
                      'Thông báo',
                      'Nhân viên chưa hoàn thành thao tác trả hàng.\nBạn không thể duyệt trả!'
                    );
                    return;
                  }
                }

                validItems.push({ id, modulaLocationDetailID });
              } catch (error) {
                // Bỏ qua item này và tiếp tục
              }
            }

            if (validItems.length === 0) {
              this.notification.warning(
                'Thông báo',
                'Không có sản phẩm nào hợp lệ để trả!'
              );
              return;
            }

            const tasks = validItems.map((item) =>
              firstValueFrom(
                this.borrowService.postReturnProductRTC(
                  item.id,
                  isGlobalAdmin || isAdmin,
                  item.modulaLocationDetailID
                )
              )
                .then(() => ({ id: item.id, success: true, message: null }))
                .catch((error) => {
                  const message =
                    error?.error?.message || 'Lỗi không xác định!';
                  return { id: item.id, success: false, message };
                })
            );

            return Promise.all(tasks).then((results) => {
              const ok = results.filter((r) => r.success).length;
              const failed = results.filter((r) => !r.success);

              if (ok > 0)
                this.notification.success(
                  'Thông báo',
                  `Trả thành công ${ok} sản phẩm.`
                );
              if (failed.length > 0)
                failed.forEach((item) => {
                  this.notification.error('Trả thất bại', item.message);
                });
              this.loadData();
              this.selectedArrHistoryProductID.clear();
              this.selectedProductsMap.clear();
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
        'Vui lòng chọn sản phẩm gia hạn!.'
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
                this.borrowService.getHistoryProductRTCByID(id)
              );
              if (res?.status !== 1) throw new Error('Truy vấn thất bại');

              const history = {
                ...res.data,
                DateReturnExpected: dateExtend,
                UpdatedDate: new Date().toISOString(),
              };
              const up = await firstValueFrom(
                this.borrowService.postSaveHistoryProduct(history)
              );
              if (up?.status !== 1) throw new Error('Cập nhật thất bại');

              const logObj = {
                HistoryProductRTCID: id,
                DateReturnExpected: dateExtend,
              };
              const log = await firstValueFrom(
                this.borrowService.postSaveHistoryProductRTCLog(logObj)
              );
              if (log?.status !== 1) throw new Error('Lưu log thất bại');

              return { id, success: true };
            } catch (err) {
              return { id, success: false, err };
            }
          });

          const results = await Promise.allSettled(tasks);
          const flat = results.map((r) =>
            r.status === 'fulfilled' ? r.value : r.reason
          );
          const ok = flat.filter((x: any) => x?.success).length;
          const fail = flat.length - ok;

          if (ok)
            this.notification.success(
              'Thông báo',
              `Gia hạn thành công ${ok} sản phẩm.`
            );
          if (fail)
            this.notification.error(
              'Thông báo',
              `Gia hạn thất bại ${fail} sản phẩm.`
            );

          this.loadData();
          this.selectedArrHistoryProductID.clear();
        },
      });
    }
  }

  approveBorrowing() {
    if (this.selectedArrHistoryProductID.size == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn sản phẩm cần duyệt!.'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận duyệt',
        nzContent: `Bạn có chắc chắn muốn duyệt sản phẩm này không?`,
        nzOkText: 'Xác nhận',
        nzCancelText: 'Hủy',

        nzOnOk: () => {
          const IDAdminDemo = ID_ADMIN_DEMO_LIST || [];
          const userId = this.appUserService?.id || 0;
          const isAdmin = IDAdminDemo.includes(userId);
          const isGlobalAdmin = this.appUserService?.isAdmin || false;
          const isAdminAll = isGlobalAdmin || isAdmin;
          const arrIds = Array.from(this.selectedArrHistoryProductID);

          const tasks = arrIds.map((id) => {
            const rowData = this.selectedProductsMap.get(id);
            const productCode =
              rowData?.ProductCodeRTC || rowData?.ProductCode || 'N/A';
            const modulaLocationDetailID = rowData?.ModulaLocationDetailID ?? 0;
            return firstValueFrom(
              this.borrowService.postApproveBorrowingRTC(
                id,
                modulaLocationDetailID,
                isAdminAll
              )
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
                `Duyệt thành công ${ok} sản phẩm.`
              );

            if (failed.length > 0) {
              failed.forEach((item) => {
                this.notification.error(
                  'Duyệt thất bại',
                  `Thiết bị ${item.ProductNewCode}: ${item.message}`
                );
              });
            }

            this.loadData();
            this.selectedArrHistoryProductID.clear();
            this.selectedProductsMap.clear();
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
        'Vui lòng chọn sản phẩm cần chuyển người mượn!.'
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
        }
      );
      modalRef.componentInstance.arrHistoryProductID = Array.from(
        this.selectedArrHistoryProductID
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
        'Vui lòng chọn sản phẩm cần xóa!'
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
        try {
          const response = await firstValueFrom(
            this.borrowService.postDeleteHistoryProduct(idsToDelete)
          );

          if (response?.status === 1) {
            this.notification.success(
              'Thông báo',
              `Xóa thành công ${idsToDelete.length} thiết bị khỏi lịch sử mượn.`
            );
            this.loadData();
            this.selectedArrHistoryProductID.clear();
            this.selectedProductsMap.clear();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Xóa thất bại!'
            );
          }
        } catch (error: any) {
          const message = error?.error?.message || 'Đã xảy ra lỗi khi xóa!';
          this.notification.error('Lỗi', message);
        }
      },
    });
  }

  exportSelectedProducts() {
    if (this.selectedArrHistoryProductID.size === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn sản phẩm cần xuất!'
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
        'Không có sản phẩm hợp lệ để xuất!'
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
    const modalRef = this.modalService.open(
      BorrowProductHistoryBorrowDetailAdminComponent,
      {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        scrollable: true,
        size: 'xl',
      }
    );
    modalRef.componentInstance.HistoryProductID =
      id ?? Array.from(this.selectedArrHistoryProductID).at(-1) ?? 0;

    modalRef.result
      .then((result) => {
        if (result === true) {
          this.loadData();
        }
      })
      .catch(() => {
        // Modal dismissed
      });
  }

  productHistoryDetail() {
    const modalRef = this.modalService.open(
      BorrowProductHistoryDetailComponent,
      {
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        modalDialogClass: 'modal-fullscreen modal-dialog-scrollable',
      }
    );
    modalRef.componentInstance.warehouseType = this.warehouseType;

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
    modalRef.componentInstance.warehouseType = this.warehouseType;
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

    let filename = 'LichSuMuon';
    if (dateStart && dateEnd) {
      filename = `LichSuMuon_${dateStart}_${dateEnd}_${now}`;
    } else {
      filename = `LichSuMuon_${now}`;
    }

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

    const modalRef = this.modalService.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.masterId = billExportID;
    modalRef.componentInstance.warehouseID = this.warehouseID;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.fromBorrowHistory = true;

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

  openDetailTab(rowData: any): void {
    const params = new URLSearchParams({
      productRTCID1: String(rowData.ProductRTCID || 0),
      warehouseID1: String(this.warehouseID || 1),
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
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );
  }

  //#region loadMenu
  loadMenu() {
    this.historyProductMenu = [
      {
        label: 'Thêm mới',
        icon: 'fa fa-plus text-success',
        command: () => {
          this.productHistoryDetail();
        },
      },
      {
        label: 'Trả thiết bị',
        icon: 'fa fa-recycle text-primary',
        command: () => {
          this.returnProduct();
        },
      },
      {
        label: 'Duyệt mượn',
        icon: 'fa-solid fa-circle-check text-success',
        visible: this.permissionService.hasPermission('N26,N1,N80'),
        command: () => {
          this.approveBorrowing();
        },
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-spinner text-primary',
        command: () => {
          this.refresh();
        },
      },
      {
        label: 'Sửa người mượn',
        icon: 'fa fa-pencil text-primary',
        visible: this.permissionService.hasPermission('N26,N1,N34,N80'),
        command: () => {
          this.editBorrower();
        },
      },
      {
        label: 'Quá hạn',
        icon: 'fa-solid fa-calendar-xmark text-danger',
        command: () => {
          this.expiredProduct();
        },
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        command: () => {
          this.exportExcel();
        },
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        visible: this.isModalMode,
        command: () => {
          this.exportSelectedProducts();
        },
      },
      {
        label: 'Mượn/trả thiết bị QRCode',
        icon: 'fa-solid fa-qrcode text-primary',
        //visible: this.permissionService.hasPermission('N26,N1,N80'),
        items: [
          {
            label: 'Mượn thiết bị',
            icon: 'fa-solid fa-box text-success',
            command: () => {
              this.onBorrowProductQRCode();
            },
          },
          {
            label: 'Trả thiết bị',
            icon: 'fa-solid fa-inbox text-danger',
            command: () => {
              this.onReturnProductQRCode();
            },
          },
        ],
      },
    ];
  }
  //#endregion

  //#region Mượn thiết bị
  onBorrowProductQRCode() {
    const modalRef = this.modalService.open(
      HistoryProductRtcBorrowQrComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        //windowClass: 'full-screen-modal',
        size: 'xl',
      }
    );
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

  //#region Trả thiết bị
  onReturnProductQRCode() {
    const modalRef = this.modalService.open(
      HistoryProductRtcReturnQrComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        //windowClass: 'full-screen-modal',
        size: 'xl',
      }
    );
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
