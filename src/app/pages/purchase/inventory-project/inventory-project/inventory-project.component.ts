import { inject } from '@angular/core';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DateTime } from 'luxon';
(window as any).luxon = { DateTime };
import { Workbook } from 'exceljs';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { InventoryProjectFormComponent } from '../inventory-project-form/inventory-project-form.component';
import { InventoryProjectDetailComponent } from '../inventory-project-detail/inventory-project-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

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
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { ProjectService } from '../../../project/project-service/project.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzFormModule,
    NzSpinModule,
    NgbModalModule,
    NzModalModule,
    AngularSlickgridModule,
    Menubar
  ],
  selector: 'app-inventory-project',
  templateUrl: './inventory-project.component.html',
  styleUrl: './inventory-project.component.css'
})
export class InventoryProjectComponent implements OnInit, AfterViewInit {

  //#region Khai báo biến
  inventoryProjectMenu: MenuItem[] = [];
  isLoading: boolean = false;
  idTable: string = '';

  projectID: number = 0;
  employeeID: number = 0;
  keyword: string = '';
  productSaleID: number = 0;
  projectList: any[] = [];
  employeeList: any[] = [];

  currentUser: any = null;
  exportingExcel: boolean = false;

  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};

  dataset: any[] = [];

  inventorySaleLinkIds: number[] = [];

  currentPage: number = 0;

  private ngbModal = inject(NgbModal);
  constructor(
    private notification: NzNotificationService,
    private inventoryProjectService: InventoryProjectService,
    private nzModal: NzModalService,
    private authService: AuthService,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private projectService: ProjectService
  ) { }
  //#endregion

  //#region Hàm chạy khi mở chương trình 
  formatDate(value: string | null): string {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
  }

  formatNumber(value: number | null): string {
    if (value == null) return '0';
    return value.toLocaleString('vi-VN');
  }

  generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngOnInit(): void {
    this.idTable = this.generateUUIDv4();
    this.loadInventorySaleLink();
    this.loadMenu();
    this.initAngularGrid();
    this.getCurrentUser();
    this.loadProject();
    this.loadEmployee();
    this.loadData();
  }

  ngAfterViewInit(): void {
  }
  //#endregion

  //#region Load dữ liệu
  loadMenu() {
    this.inventoryProjectMenu = [
      {
        label: 'Nhả giữ',
        icon: 'fa fa-plus text-success',
        visible: this.permissionService.hasPermission("N33,N1"),
        command: () => {
          this.onRejectKeep();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        visible: this.permissionService.hasPermission("N33,N27,N1"),
        command: () => {
          this.onDelete();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        },
      },
    ];
  }

  loadInventorySaleLink() {
    this.inventoryProjectService.getInventorySaleLink().subscribe({
      next: (response: any) => {
        this.inventorySaleLinkIds = response.data;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || `${error.error}\n${error.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      }
    });
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
    });
  }

  loadProject() {
    this.inventoryProjectService.getProject().subscribe({
      next: (response: any) => {
        this.projectList = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách dự án:', error);
      }
    });
  }

  loadEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error.message);
      },
    });
  }

  onSearch() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const pagingInfo = this.angularGrid?.dataView.getPagingInfo() || { pageNum: 0 };
    this.currentPage = pagingInfo.pageNum;
    const request = {
      ProjectID: this.projectID || 0,
      EmployeeID: this.employeeID || 0,
      ProductSaleID: this.productSaleID || 0,
      KeyWord: this.keyword || ''
    };

    this.inventoryProjectService
      .getInventoryProject(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.dataset = response.data.map((item: any, index: number) => {
            return {
              ...item,
              id: `${this.idTable}-${index++}`,
            };
          });

          setTimeout(() => {
            this.applyGrouping();
            this.applyDistinctFilters();
            if (this.currentPage > 0) {
              this.angularGrid?.dataView.setPagingOptions({ pageNum: this.currentPage });
              this.updateMasterFooterRow();
            }
            this.angularGrid?.slickGrid?.scrollColumnIntoView(1);
            this.angularGrid?.slickGrid?.resizeCanvas();
          }, 100);

          this.isLoading = false;
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            error.error?.message || 'Lỗi khi tải dữ liệu'
          );
        }
      });
  }
  //#endregion

  //#region Xử lý bảng 
  applyGrouping(): void {

    const angularGrid = this.angularGrid;
    if (!angularGrid || !angularGrid.dataView) return;

    angularGrid.dataView.setGrouping([
      {
        getter: 'WarehouseCode',
        comparer: () => 0,
        formatter: (g: any) => {
          const WarehouseCode = g.rows?.[0]?.WarehouseCode || '';
          return `Mã kho: <strong>${WarehouseCode}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.applyGrouping();

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.applyDistinctFilters();
    }, 100);
  }

  initAngularGrid() {
    this.columnDefinitions = [
      {
        id: 'ProductCode',
        field: 'ProductCode',
        name: 'Mã sản phẩm',
        width: 200,
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
        id: 'ProductName',
        field: 'ProductName',
        name: 'Tên sản phẩm',
        width: 300,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'ProductNewCode',
        field: 'ProductNewCode',
        name: 'Mã nội bộ',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 80,
        cssClass: 'text-center',
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
        id: 'AddressBox',
        field: 'AddressBox',
        name: 'Vị trí',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Quantity',
        field: 'Quantity',
        name: 'SL giữ',
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
        id: 'TotalQuantityExport',
        field: 'TotalQuantityExport',
        name: 'SL xuất',
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
        id: 'TotalQuantityRemain',
        field: 'TotalQuantityRemain',
        name: 'SL còn lại',
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
      },
      {
        id: 'ProjectName',
        field: 'ProjectName',
        name: 'Tên dự án',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'CustomerName',
        field: 'CustomerName',
        name: 'Khách hàng',
        width: 250,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'PONumber',
        field: 'PONumber',
        name: 'Số POKH',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'POCode',
        field: 'POCode',
        name: 'Mã POKH',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã nhân viên',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'FullNameRequests',
        field: 'FullNameRequests',
        name: 'Người yêu cầu',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
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
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: `.container-${this.idTable}`,
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
      //forceFitColumns: true,
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
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      enableGrouping: true,
      frozenColumn: 1,
      enableHtmlRendering: true,
      enablePagination: true,
      pagination: {
        pageSize: 500,
        pageSizes: [200, 300, 400, 500],
        totalItems: 0,
      },
    };
  }

  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const dataView = this.angularGrid.dataView;
      const slickGrid = this.angularGrid.slickGrid;
      const items: any[] = [];

      if (dataView && slickGrid) {
        const filteredItems = dataView.getFilteredItems() || [];

        const pageInfo = dataView.getPagingInfo();
        const startIndex = pageInfo.pageSize * pageInfo.pageNum;

        const endIndex = Math.min(
          startIndex + pageInfo.pageSize,
          filteredItems.length
        );

        const pageItems = filteredItems.slice(startIndex, endIndex);

        pageItems.forEach((item: any) => {
          if (item && item.ProductCode) {
            items.push(item);
          }
        });
      }

      const codeCount = items.length;

      const totals = (items || []).reduce(
        (acc, item) => {
          acc.TotalQuantityRemain += item.TotalQuantityRemain || 0;
          acc.TotalQuantityExport += item.TotalQuantityExport || 0;
          acc.Quantity += item.Quantity || 0;
          return acc;
        },
        {
          TotalQuantityRemain: 0,
          TotalQuantityExport: 0,
          Quantity: 0,
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
        if (col.id === 'ProductCode') {
          footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
        }
        // Tổng các cột số liệu
        else if (col.id === 'TotalQuantityRemain') {
          footerCell.innerHTML = `<b>${totals.TotalQuantityRemain.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'TotalQuantityExport') {
          footerCell.innerHTML = `<b>${totals.TotalQuantityExport.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'Quantity') {
          footerCell.innerHTML = `<b>${totals.Quantity.toLocaleString(
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
    this.updateMasterFooterRow();
  }

  //#endregion

  //#region Xử lý sự kiện


  onRejectKeep() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length != 1) {
      this.notification.info('Thông báo', 'Vui lòng chọn 1 dòng để nhả giữ!');
      return;
    }

    const item = angularGrid.dataView.getItem(selectedRowIndexes[0]);

    // Kiểm tra quyền
    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;
    const employeeIDs = (item.EmployeeIDs || '').split(';').filter((x: string) => x);
    const currentEmployeeID = this.currentUser?.EmployeeID?.toString();

    if (!employeeIDs.includes(currentEmployeeID) && !isAdmin) {
      this.notification.warning(
        'Cảnh báo',
        'Bạn không có quyền nhả giữ vì bạn không phải người yêu cầu giữ hoặc người giữ!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(InventoryProjectFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = item;
    modalRef.componentInstance.isRejectMode = true;

    modalRef.result.then(
      () => {
        this.notification.success('Thành công', 'Nhả giữ thành công!');
        this.loadData();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onDelete() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length <= 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn sản phẩm để xóa!');
      return;
    }

    const selectedData = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;
    debugger;
    // Danh sách ID hợp lệ để xóa
    const ids: number[] = [];
    let productNewCodes: string[] = [];
    selectedData.forEach((item: any) => {
      const id = Number(item.ID) || 0;
      let productSaleID = item.ProductSaleID || 0;
      let productNewCode = item.ProductNewCode || '';
      if (id <= 0) {
        return;
      }

      // if (isAdmin) {
      //   ids.push(id);
      //   return;
      // }

      if (!this.inventorySaleLinkIds.includes(productSaleID)
        && !productNewCodes.includes(productNewCode)
        && !isAdmin
      ) {
        productNewCodes.push(productNewCode);
      }

      if (this.inventorySaleLinkIds.includes(productSaleID) || isAdmin) {
        ids.push(id);
      }

    });

    if (ids.length === 0) {
      this.notification.warning('Thông báo', 'Không có sản phẩm phù hợp để xóa!');
      return;
    }

    if (productNewCodes.length > 0 && ids.length > 0) {
      this.notification.info('Thông báo', `Những sản phẩm [${productNewCodes.join(', ')}] không có trong danh sách được hủy giữ sẽ tự động được bỏ qua.`);
    }

    const confirmMessage =
      selectedData.length === 1
        ? 'Bạn có chắc muốn xóa sản phẩm đã chọn khỏi kho giữ không?'
        : `Bạn có chắc muốn xóa danh sách sản phẩm đã chọn khỏi kho giữ không?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteObservables = ids.map((id: number) => {
          const payload = {
            ID: id,
            IsDeleted: true
          };
          return this.inventoryProjectService.saveData(payload).pipe(
            catchError((error) => {
              console.error(`Lỗi khi xóa ID ${id}:`, error);
              return of({ success: false, error, id });
            })
          );
        });

        forkJoin(deleteObservables).subscribe({
          next: (responses: any[]) => {
            const successCount = responses.filter((r) => r.success !== false).length;
            const failCount = responses.filter((r) => r.success === false).length;

            if (successCount > 0) {
              this.notification.success('Thành công', `Xóa thành công ${successCount} sản phẩm!`);
            }

            if (failCount > 0) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                `Có ${failCount} sản phẩm xóa thất bại!`
              );
            }

            this.loadData();
          },
          error: (error: any) => {
            console.error('Lỗi khi xóa:', error);
            this.notification.error(
              NOTIFICATION_TITLE.error,
              error.error?.message
            );
          }
        });
      }
    });
  }

  async exportToExcel() {
    if (!this.angularGrid) return;

    const dataView = this.angularGrid.dataView;
    if (!dataView) return;

    // Lấy dữ liệu trang hiện tại
    const pageInfo = dataView.getPagingInfo();
    const startIndex = pageInfo.pageSize * pageInfo.pageNum;
    const endIndex = Math.min(startIndex + pageInfo.pageSize, dataView.getFilteredItems().length);
    const pageItems = dataView.getFilteredItems().slice(startIndex, endIndex);

    if (pageItems.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.exportingExcel = true;

    try {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Danh sách hàng giữ');

      // Header
      const headers = [
        'Mã sản phẩm',
        'Tên sản phẩm',
        'Mã nội bộ',
        'ĐVT',
        'Vị trí',
        'SL giữ',
        'SL xuất',
        'SL còn lại',
        'Mã dự án',
        'Tên dự án',
        'Khách hàng',
        'Số POKH',
        'Mã POKH',
        'Mã nhân viên',
        'Người yêu cầu',
        'Ghi chú',
        'Ngày tạo'
      ];

      worksheet.addRow(headers);

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 20;

      // Group data theo WarehouseCode
      const groupedData = new Map<string, any[]>();
      pageItems.forEach((item: any) => {
        if (!item.ProductCode) return;
        const warehouseCode = item.WarehouseCode || '';
        if (!groupedData.has(warehouseCode)) {
          groupedData.set(warehouseCode, []);
        }
        groupedData.get(warehouseCode)!.push(item);
      });

      let currentRow = 2;

      // Tổng trang
      let pageTotal = {
        Quantity: 0,
        TotalQuantityExport: 0,
        TotalQuantityRemain: 0,
        count: 0
      };

      // Xuất từng group
      groupedData.forEach((items, warehouseCode) => {
        // Group header
        const groupRow = worksheet.getRow(currentRow);
        groupRow.getCell(1).value = `Mã kho: ${warehouseCode} (${items.length} SP)`;
        groupRow.font = { bold: true };
        groupRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
        worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
        currentRow++;

        // Group items
        items.forEach((item: any) => {
          const row = worksheet.addRow([
            item.ProductCode,
            item.ProductName,
            item.ProductNewCode,
            item.Unit,
            item.AddressBox,
            item.Quantity || 0,
            item.TotalQuantityExport || 0,
            item.TotalQuantityRemain || 0,
            item.ProjectCode,
            item.ProjectName,
            item.CustomerName,
            item.PONumber,
            item.POCode,
            item.Code,
            item.FullNameRequests,
            item.Note,
            item.CreatedDate ? DateTime.fromISO(item.CreatedDate).toFormat('dd/MM/yyyy') : ''
          ]);

          // Format và align số
          [6, 7, 8].forEach(col => {
            const cell = row.getCell(col);
            cell.alignment = { horizontal: 'right' };
            cell.numFmt = '#,##0';
          });

          pageTotal.Quantity += item.Quantity || 0;
          pageTotal.TotalQuantityExport += item.TotalQuantityExport || 0;
          pageTotal.TotalQuantityRemain += item.TotalQuantityRemain || 0;
          pageTotal.count++;

          currentRow++;
        });
      });

      // Footer tổng trang
      currentRow++;
      const footerRow = worksheet.getRow(currentRow);
      footerRow.getCell(1).value = `TỔNG CỘNG (${pageTotal.count} SP)`;
      footerRow.getCell(6).value = pageTotal.Quantity;
      footerRow.getCell(7).value = pageTotal.TotalQuantityExport;
      footerRow.getCell(8).value = pageTotal.TotalQuantityRemain;
      footerRow.font = { bold: true, size: 12 };
      footerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC000' }
      };
      [6, 7, 8].forEach(col => {
        const cell = footerRow.getCell(col);
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0';
      });

      // Set column widths
      worksheet.columns = [
        { width: 15 }, { width: 35 }, { width: 15 }, { width: 8 },
        { width: 20 }, { width: 10 }, { width: 10 }, { width: 12 },
        { width: 15 }, { width: 30 }, { width: 25 }, { width: 15 },
        { width: 15 }, { width: 12 }, { width: 20 }, { width: 25 },
        { width: 12 }
      ];

      // Border cho tất cả cells
      worksheet.eachRow((row: any) => {
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Export
      const dateString = DateTime.fromJSDate(new Date()).toFormat('ddMMyyyy_HHmmss');
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `danh-sach-hang-giu-${dateString}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, error?.message || 'Lỗi xuất Excel');
    } finally {
      this.exportingExcel = false;
    }
  }
  //#endregion
}
