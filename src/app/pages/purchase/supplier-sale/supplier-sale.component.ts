import { Component, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { SupplierSaleService } from './supplier-sale.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { ProjectService } from '../../project/project-service/project.service';
import { SupplierSaleDetailComponent } from './supplier-sale-detail/supplier-sale-detail.component';
import { SupplierSaleImportExcelComponent } from './supplier-sale-import-excel/supplier-sale-import-excel.component';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  MultipleSelectOption,
  Formatters,
  BackendServiceApi,
  PaginationChangedArgs,
} from 'angular-slickgrid';

import { MenuItem } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { MenubarModule } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';
import { InputTextModule } from 'primeng/inputtext';
@Component({
  selector: 'app-supplier-sale',
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    HasPermissionDirective,
    ToolbarModule,
    MenubarModule,
    InputTextModule,
    AngularSlickgridModule
  ],
  templateUrl: './supplier-sale.component.html',
  styleUrl: './supplier-sale.component.css',
})
export class SupplierSaleComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private supplierSaleService: SupplierSaleService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private projectService: ProjectService,
    private permissionService: PermissionService,
  ) { }

  supplierSaleMenu: MenuItem[] = [];
  supplierSaleMenuSearch: MenuItem[] = [];
  sizeTbDetail: any = '0';
  isLoading: boolean = false;
  isLoadingDetail: boolean = false;

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  angularGridDetail!: AngularGridInstance;
  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  datasetDetail: any[] = [];

  idMaster: string = '';
  idDetail: string = '';

  pageNumber = 1;
  pageSize = 200;
  totalItems = 0;
  keyword = '';
  clickTimer: any;
  nameNcc: string = '';
  //#endregion


  //#region Hàm chạy khi load
  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngOnInit(): void {
    this.idMaster = this.generateUUIDv4();
    this.idDetail = this.generateUUIDv4();
    this.loadMenu();
    this.initGrid();
  }

  ngAfterViewInit(): void {

  }

  loadMenu() {
    this.supplierSaleMenu = [
      {
        label: 'Thêm',
        visible: this.permissionService.hasAllPermissions(['N27', 'N33', 'N52', 'N53', 'N35', 'N1']),
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddSupplierSale(),
      },
      {
        label: 'Sửa',
        visible: this.permissionService.hasAllPermissions(['N27', 'N33', 'N35', 'N1']),
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onEditSupplierSale(),
      },
      {
        label: 'Xóa',
        visible: this.permissionService.hasAllPermissions(['N27', 'N33', 'N35', 'N1']),
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDeleteSupplierSale(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExportExcel(),
      },
      {
        label: 'Nhập Excel',
        visible: this.permissionService.hasAllPermissions(['N27', 'N33', 'N35', 'N1']),
        icon: 'fa-solid fa-file-import fa-lg text-warning',
        command: () => this.onImportExcel(),
      },
    ];

    this.supplierSaleMenuSearch = [
      {
        label: 'Tìm kiếm',
        icon: 'fa-solid fa-magnifying-glass fa-lg text-primary',
        command: () => this.onSearch(),
      },
    ];
  }
  //#endregion

  //#region Hàm xử lý bảng
  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.onSearch();

    // Subscribe to pagination changes
    if (angularGrid && angularGrid.dataView) {
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

  angularGridDetailReady(angularGrid: AngularGridInstance) {
    this.angularGridDetail = angularGrid;

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 300);

    setTimeout(() => {
      this.updateMasterFooterRow();
    }, 800);
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'NgayUpdate',
        name: 'Ngày update',
        field: 'NgayUpdate',
        cssClass: 'text-center',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CompanyText',
        name: 'Công ty nhập',
        field: 'CompanyText',
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
        id: 'CodeNCC',
        name: 'Mã NCC',
        field: 'CodeNCC',
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
        id: 'ShortNameSupplier',
        name: 'Tên viết tắt',
        field: 'ShortNameSupplier',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'NameNCC',
        name: 'Tên NCC',
        field: 'NameNCC',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'TenTiengAnh',
        name: 'Tên tiếng Anh',
        field: 'TenTiengAnh',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Brand',
        name: 'Hãng/Brand',
        field: 'Brand',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'MaNhom',
        name: 'Mã nhóm',
        field: 'MaNhom',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'AddressNCC',
        name: 'Địa chỉ',
        field: 'AddressNCC',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'NVPhuTrach',
        name: 'NV phụ trách',
        field: 'NVPhuTrach',
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
        id: 'LoaiHangHoa',
        name: 'Loại hàng hóa',
        field: 'LoaiHangHoa',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'MaSoThue',
        name: 'Mã số thuế',
        field: 'MaSoThue',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Website',
        name: 'Website',
        field: 'Website',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Debt',
        name: 'Công nợ',
        field: 'Debt',
        cssClass: 'text-center',
        width: 80,
        formatter: Formatters.checkmarkMaterial,
        type: 'boolean',
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
        id: 'SoTK',
        name: 'Số TK',
        field: 'SoTK',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'PhoneNCC',
        name: 'Điện thoại',
        field: 'PhoneNCC',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'OrderNCC',
        name: 'Người đặt hàng',
        field: 'OrderNCC',
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
        name: 'Ghi chú',
        field: 'Note',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
    ]

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-' + this.idMaster,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      enableAutoTooltip: true,
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: false,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      enableContextMenu: true,
      rowHeight: 30,
      enablePagination: true,
      frozenColumn: 3,
      pagination: {
        pageSize: 500,
        pageSizes: [200, 300, 400, 500],
        totalItems: 0,
      },
    }

    this.columnDefinitionsDetail = [
      {
        id: 'SupplierName',
        name: 'Tên liên hệ',
        field: 'SupplierName',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'SupplierPhone',
        name: 'Điện thoại',
        field: 'SupplierPhone',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'SupplierEmail',
        name: 'Email',
        field: 'SupplierEmail',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Describe',
        name: 'Mô tả',
        field: 'Describe',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
    ]

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-' + this.idDetail,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: false,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableGrouping: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
    }
  }

  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const dataView = this.angularGrid.dataView;
      const slickGrid = this.angularGrid.slickGrid;

      if (dataView && slickGrid) {
        // Lấy thông tin pagination
        const pageInfo = dataView.getPagingInfo();
        const pageSize = pageInfo.pageSize;
        const pageNum = pageInfo.pageNum;

        // Lấy data đã filter
        const filteredItems = dataView.getFilteredItems() || [];

        // Tính index start/end cho trang hiện tại
        const startIndex = pageSize * pageNum;
        const endIndex = Math.min(startIndex + pageSize, filteredItems.length);

        // Lấy items của trang hiện tại
        const pageItems = filteredItems.slice(startIndex, endIndex);

        // Đếm số NCC (loại bỏ group rows)
        const nccCount = pageItems.length;

        // Set footer cho cột CodeNCC
        const columns = slickGrid.getColumns();
        columns.forEach((col: any) => {
          const footerCell = slickGrid.getFooterRowColumn(col.id);
          if (!footerCell) return;

          if (col.id === 'CodeNCC') {
            footerCell.innerHTML = `<b>${nccCount.toLocaleString('en-US')}</b>`;
          }
        });
      }
    }
  }

  applyDistinctFilters() {
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
  //#endregion

  //#region Hàm xử lý sự kiện
  onSearch() {
    // Lưu trang hiện tại
    let currentPage = 0;
    if (this.angularGrid?.dataView) {
      const pagingInfo = this.angularGrid.dataView.getPagingInfo();
      currentPage = pagingInfo.pageNum > 0 ? pagingInfo.pageNum : 1;
    }

    this.isLoading = true;
    this.supplierSaleService
      .getSupplierSaleNew(this.keyword, 1, 99999999)
      .subscribe(res => {
        
        this.dataset = res.data.data.map((item: any, index: number) => ({
          ...item,
          id: `${this.idMaster}_${index}`,
        }));
        this.isLoading = false;

        if (this.angularGrid) {
          setTimeout(() => {
            // Giữ nguyên trang hiện tại
            this.angularGrid.dataView.setPagingOptions({ pageNum: currentPage });
            this.angularGrid.dataView.refresh();
            this.angularGrid.resizerService?.resizeGrid();
            this.applyDistinctFilters();
            this.angularGrid?.slickGrid?.scrollColumnIntoView(4);
          }, 100);
        }

        setTimeout(() => {
          this.updateMasterFooterRow();
        }, 300);
      });
  }

  closeDetail() {
    this.sizeTbDetail = '0';
    this.isLoadingDetail = false;
  }

  onActiveRowChanged(row: number | undefined) {
    clearTimeout(this.clickTimer);
    if (row == null) return;
    this.clickTimer = setTimeout(() => {
      const rowData = this.angularGrid?.dataView.getItem(row);
      this.nameNcc = rowData?.CodeNCC;
      this.getSupplierSaleContact(rowData?.ID);
    }, 300);
  }

  getSupplierSaleContact(supplierID: number) {
    if (!supplierID) return;
    if (supplierID > 0) {
      this.sizeTbDetail = '38%';
    } else {
      this.sizeTbDetail = '0';
    }
    this.isLoadingDetail = true;
    this.supplierSaleService.getSupplierSaleContact(supplierID).subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.datasetDetail = data.data.map((item: any, index: number) => ({
            ...item,
            id: `${this.idDetail}_${index}`,
          }));
          if (this.angularGridDetail) {
            setTimeout(() => {
              this.angularGridDetail.resizerService?.resizeGrid();
            }, 100);
          }
          this.isLoadingDetail = false;
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không có dữ liệu liên hệ nào được tìm thấy cho NCC này.'
          );
          this.isLoadingDetail = false;
        }
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
        );
        this.isLoadingDetail = false;
      },
    });
  }

  onAddSupplierSale() {
    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0;
    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  onEditSupplierSale() {
    clearTimeout(this.clickTimer);
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length != 1) {
      this.notification.info('Thông báo', 'Vui lòng chỉ chọn 1 dòng để sửa!');
      return;
    }

    const item = angularGrid.dataView.getItem(selectedRowIndexes[0]);

    const modalRef = this.modalService.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = item.ID;
    modalRef.result.finally(() => {
      this.onSearch();
      this.getSupplierSaleContact(item.ID);
    });
  }

  onDeleteSupplierSale() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;
    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhà cung cấp cần xóa!'
      );
      return;
    } else {
      this.modal.confirm({
        nzTitle: 'Xác nhận xóa',
        nzContent: `Bạn có chắc chắn muốn xóa ${selectedRows.length} nhà cung cấp không?`,
        nzOkText: 'Xóa',
        nzCancelText: 'Hủy',
        nzOkDanger: true,
        nzOnOk: () => {
          this.sizeTbDetail = '0';
          this.isLoadingDetail = true;
          const deleteRequests = selectedRows.map(
            (row) => {
              const data = {
                ID: row.ID,
                IsDeleted: true,
              };

              return this.supplierSaleService
                .saveSupplierSale(data)
                .toPromise()
                .then(() => ({ id: row.ID, success: true }))
                .catch((error) => {
                  this.notification.error(
                    NOTIFICATION_TITLE.error,
                    `Lỗi xóa NCC ${error.error.message}`
                  );
                  this.isLoadingDetail = false;
                  return;
                });
            }
          );

          Promise.all(deleteRequests).then((results) => {
            const successCount = results.filter((r: any) => r.success).length;
            const failed = results
              .filter((r: any) => !r.success)
              .map((r: any) => r.id);

            if (successCount > 0) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã xóa ${successCount} nhà cung cấp thành công!`
              );
              this.angularGrid.gridService.setSelectedRows([]);
              this.isLoadingDetail = false;
              this.onSearch();
            }

            if (failed.length > 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Không thể xóa các nhà cung cấp có id: ${failed.join(', ')}`
              );
            }
          });
        },
      });
    }
  }

  onImportExcel() {
    const modalRef = this.modalService.open(SupplierSaleImportExcelComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.finally(() => {
      this.sizeTbDetail = '0';
      this.onSearch();
    });
  }

  onExportExcel() {
    if (!this.angularGrid || !this.angularGrid.dataView) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa có dữ liệu để xuất!');
      return;
    }

    const dataView = this.angularGrid.dataView;

    // Lấy thông tin pagination
    const pageInfo = dataView.getPagingInfo();
    const pageSize = pageInfo.pageSize;
    const pageNum = pageInfo.pageNum;

    // Lấy data đã filter
    const filteredItems = (dataView.getFilteredItems?.() as any[]) || [];

    // Tính index start/end cho trang hiện tại
    const startIndex = pageSize * pageNum;
    const endIndex = Math.min(startIndex + pageSize, filteredItems.length);

    // Chỉ lấy items của trang hiện tại
    const pageItems = filteredItems.slice(startIndex, endIndex);

    if (!pageItems || pageItems.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel.');
      return;
    }

    try {
      const formattedDate = new Date()
        .toISOString()
        .slice(2, 10)
        .split('-')
        .reverse()
        .join('');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DanhSachNCC');

      // Header
      const headerRow = worksheet.addRow([
        'Ngày update',
        'Công ty nhập',
        'Mã NCC',
        'Tên viết tắt',
        'Tên NCC',
        'Tên tiếng Anh',
        'Hãng/Brand',
        'Mã nhóm',
        'Địa chỉ',
        'NV phụ trách',
        'Loại hàng hóa',
        'Mã số thuế',
        'Website',
        'Công nợ',
        'Số TK',
        'Điện thoại',
        'Người đặt hàng',
        'Ghi chú',
      ]);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4D94FF' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Data rows - chỉ xuất trang hiện tại
      pageItems.forEach((item: any) => {
        worksheet.addRow([
          item.NgayUpdate ? new Date(item.NgayUpdate).toLocaleDateString('vi-VN') : '',
          item.CompanyText || '',
          item.CodeNCC || '',
          item.ShortNameSupplier || '',
          item.NameNCC || '',
          item.TenTiengAnh || '',
          item.Brand || '',
          item.MaNhom || '',
          item.AddressNCC || '',
          item.NVPhuTrach || '',
          item.LoaiHangHoa || '',
          item.MaSoThue || '',
          item.Website || '',
          item.Debt ? 'Có' : 'Không',
          item.SoTK || '',
          item.PhoneNCC || '',
          item.OrderNCC || '',
          item.Note || '',
        ]);
      });

      // Footer row
      const footerRow = worksheet.addRow([
        '',
        '',
        pageItems.length,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
      footerRow.font = { bold: true };

      // Auto width
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell: any) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      // Export
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `DanhSachNCC_${formattedDate}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
      });
    } catch (error) {
      console.error('Export error:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi khi xuất Excel!');
    }
  }

  onMasterDblClick(event: any) {
    const args = event?.args;
    const row = args?.row;
    this.angularGrid?.slickGrid?.setSelectedRows([row]);
    this.onEditSupplierSale();
  }
  //#endregion
}
