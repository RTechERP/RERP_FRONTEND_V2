import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnEventArgs
} from 'angular-slickgrid';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { DateTime } from 'luxon';

import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { InventoryProjectFormComponent } from '../inventory-project-form/inventory-project-form.component';
import { InventoryProjectDetailComponent } from '../inventory-project-detail/inventory-project-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AuthService } from '../../../../auth/auth.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

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
    NzFormModule,
    NzSpinModule,
    NzModalModule,
    HasPermissionDirective,
    AngularSlickgridModule
  ],
  selector: 'app-inventory-project-new',
  templateUrl: './inventory-project-new.component.html',
  styleUrls: ['./inventory-project-new.component.css']
})
export class InventoryProjectNewComponent implements OnInit {
  // Angular Slickgrid instances
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Filter parameters
  projectID: number = 0;
  employeeID: number = 0;
  keyword: string = '';
  productSaleID: number = 0;

  // Data lists
  projectList: any[] = [];
  employeeList: any[] = [];

  // UI state
  loading: boolean = false;
  exportingExcel: boolean = false;

  // Current user
  currentUser: any = null;

  // Selected rows
  selectedRow: any = null;
  selectedRows: any[] = [];

  // Excel export service
  excelExportService = new ExcelExportService();

  constructor(
    private ngbModal: NgbModal,
    private notification: NzNotificationService,
    private inventoryProjectService: InventoryProjectService,
    private nzModal: NzModalService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadProject();
    this.loadEmployee();
    this.initGrid();
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
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
    this.inventoryProjectService.getEmployee().subscribe({
      next: (response: any) => {
        this.employeeList = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
      }
    });
  }

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        minWidth: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        minWidth: 250,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        sortable: true,
        filterable: true,
        minWidth: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'Unit',
        name: 'DVT',
        field: 'Unit',
        sortable: true,
        filterable: true,
        width: 80,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'AddressBox',
        name: 'Vị trí',
        field: 'AddressBox',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'Quantity',
        name: 'SL Giữ',
        field: 'Quantity',
        sortable: true,
        filterable: true,
        width: 100,
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2, thousandSeparator: ',' },
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: this.sumTotalsFormatter
      },
      {
        id: 'TotalQuantityExport',
        name: 'SL Xuất',
        field: 'TotalQuantityExport',
        sortable: true,
        filterable: true,
        width: 100,
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2, thousandSeparator: ',' },
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: this.sumTotalsFormatter
      },
      {
        id: 'TotalQuantityRemain',
        name: 'SL còn lại',
        field: 'TotalQuantityRemain',
        sortable: true,
        filterable: true,
        width: 120,
        type: 'number',
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 2, thousandSeparator: ',' },
        filter: { model: Filters['compoundInputNumber'] },
        groupTotalsFormatter: this.sumTotalsFormatter
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        sortable: true,
        filterable: true,
        minWidth: 200,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        sortable: true,
        filterable: true,
        minWidth: 200,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'PONumber',
        name: 'Số POKH',
        field: 'PONumber',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'POCode',
        name: 'Mã POKH',
        field: 'POCode',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true
          } as MultipleSelectOption
        }
      },
      {
        id: 'FullNameRequests',
        name: 'Người yêu cầu',
        field: 'FullNameRequests',
        sortable: true,
        filterable: true,
        minWidth: 200,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true  
          } as MultipleSelectOption
        }
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        minWidth: 200,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            autoAdjustDropHeight: true,
            maxHeight: 250,
            filter: true  
          } as MultipleSelectOption
        }
      },
      {
        id: 'CreatedDate',
        name: 'Ngày tạo',
        field: 'CreatedDate',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: Formatters.dateIso,
        params: { parseDateFormat: 'YYYY-MM-DD', outputFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] }
      },
      {
        id: 'POKHDetailID',
        name: 'POKHDetailID',
        field: 'POKHDetailID',
        sortable: true,
        filterable: true,
        width: 120,
        hidden: true,
        excludeFromColumnPicker: false
      },
            {
        id: 'ProductSaleID',
        name: 'ProductSaleID',
        field: 'ProductSaleID',
        sortable: true,
        filterable: true,
        width: 120,
        hidden: true,
        excludeFromColumnPicker: false
              
      },
                {
        id: 'ProjectID',
        name: 'ProjectID',
        field: 'ProjectID',
        sortable: true,
        filterable: true,
        width: 120,
        hidden: true,
        excludeFromColumnPicker: false
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      datasetIdPropertyName: 'id',
      enableAutoResize: true,
      gridWidth: '100%',
      gridHeight: 600,
      enableRowSelection: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      rowSelectionOptions: {
        selectActiveRow: false
      },
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true
      },
      enableColumnPicker: true,
    columnPicker: {
      hideForceFitButton: false,
      hideSyncResizeButton: true,
      onColumnsChanged: (e, args) => {
        console.log('Columns changed:', args.columns);
      }
    },
      enableCheckboxSelector: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      frozenColumn: 2,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      enableGrouping: true,

      // Excel export configuration
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true
      }
    };
  }

  // Custom formatter for sum totals
  sumTotalsFormatter(totals: any, columnDef: Column) {
    const val = totals.sum && totals.sum[columnDef.field];
    if (val != null) {
      return `Tổng: ${val.toLocaleString('vi-VN')}`;
    }
    return '';
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.loadData();
  }

  // Populate dynamic filters based on DataView (visible data after filters/sorts)
  populateFilterCollections() {
    if (!this.angularGrid || !this.angularGrid.dataView) return;

    const textFields = [
      'ProductCode',
      'ProductName',
      'ProductNewCode',
      'Unit',
      'AddressBox',
      'ProjectCode',
      'ProjectName',
      'CustomerName',
      'PONumber',
      'POCode',
      'Code',
      'FullNameRequests',
      'Note'
    ];

    // Get data from DataView (current visible data after any filters/sorting)
    const dataView = this.angularGrid.dataView;
    const dataLength = dataView.getLength();

    if (dataLength === 0) return;

    // Get all columns from the grid
    const gridColumns = this.angularGrid.slickGrid.getColumns();

    textFields.forEach(field => {
      // Extract unique values from DataView items
      const uniqueValuesSet = new Set<any>();

      for (let i = 0; i < dataLength; i++) {
        const item = dataView.getItem(i);
        const value = item?.[field];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValuesSet.add(value);
        }
      }

      // Convert to array and sort
      const uniqueValues = Array.from(uniqueValuesSet).sort();

      const collection = uniqueValues.map(value => ({
        value: value,
        label: value
      }));

      // Find the column in grid columns
      const gridColumn = gridColumns.find((col: any) => col.field === field);
      if (gridColumn && gridColumn.filter) {
        gridColumn.filter.collection = collection;
      }

      // Also update in columnDefinitions for future reference
      const columnDef = this.columnDefinitions.find(col => col.field === field);
      if (columnDef && columnDef.filter) {
        columnDef.filter.collection = collection;
      }
    });

    // Refresh the grid header to show updated filters
    if (this.angularGrid.slickGrid) {
      this.angularGrid.slickGrid.setColumns(gridColumns);
    }
  }

  loadData() {
    this.loading = true;

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
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response.data || [];
          const ds = data.map((item:any) => ({
            ...item,
            id: item.ID
          }));
          this.dataset = ds;
          setTimeout(() => {
            this.populateFilterCollections();
          }, 100);
        },
        error: (error: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            error.error?.message
          );
        }
      });
  }

  searchData(): void {
    this.loadData();
  }

  onSearch() {
    this.searchData();
  }

  resetFilters() {
    this.projectID = 0;
    this.employeeID = 0;
    this.keyword = '';
    this.productSaleID = 0;
    this.searchData();
  }

  onRowClick(e: any, args: any) {
    const dataContext = args?.dataContext;
    this.selectedRow = dataContext;
  }

  onRowDblClick(e: any, args: any) {
    const dataContext = args?.dataContext;
    this.selectedRow = dataContext;
    this.onViewDetail();
  }

  onSelectedRowsChanged(e: any, args: any) {
    if (this.angularGrid?.gridService) {
      this.selectedRows = this.angularGrid.gridService
        .getSelectedRows()
        .map((idx: number) => this.angularGrid.dataView.getItem(idx));
    }
  }

  onViewDetail() {
    if (!this.selectedRow) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một dòng để xem chi tiết!');
      return;
    }

    const modalRef = this.ngbModal.open(InventoryProjectDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = this.selectedRow;

    modalRef.result.then(
      () => {
        this.loadData();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  onRejectKeep() {
    // Ưu tiên dùng dòng được click; nếu chưa có thì lấy dòng đầu tiên trong selectedRows
    if (!this.selectedRow && this.selectedRows && this.selectedRows.length > 0) {
      this.selectedRow = this.selectedRows[0];
    }

    if (!this.selectedRow) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để nhả giữ!');
      return;
    }

    // Kiểm tra quyền
    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;
    const employeeIDs = (this.selectedRow.EmployeeIDs || '').split(';').filter((x: string) => x);
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

    modalRef.componentInstance.dataInput = this.selectedRow;
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
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn sản phẩm muốn xóa!');
      return;
    }

    const isAdmin = this.currentUser?.IsAdmin && this.currentUser?.EmployeeID <= 0;

    // Danh sách ID hợp lệ để xóa
    const ids: number[] = [];

    this.selectedRows.forEach((item: any) => {
      const id = Number(item.ID) || 0;
      if (id <= 0) {
        return;
      }

      // Nếu là admin thì luôn cho phép xóa
      if (isAdmin) {
        ids.push(id);
        return;
      }

      // Với user thường: nghiệp vụ chi tiết kiểm tra sẽ được xử lý ở API
      ids.push(id);
    });

    if (ids.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có sản phẩm nào có thể xóa!');
      return;
    }

    const confirmMessage =
      this.selectedRows.length === 1
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

  exportToExcel() {
    if (!this.angularGrid) return;

    if (!this.dataset || this.dataset.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.exportingExcel = true;

    try {
      const dateString = DateTime.fromJSDate(new Date()).toFormat('ddMMyyyy_HHmmss');
      this.excelExportService.exportToExcel({
        filename: `danh-sach-hang-giu-${dateString}`,
        format: 'xlsx'
      });

      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
    } finally {
      setTimeout(() => {
        this.exportingExcel = false;
      }, 1000);
    }
  }
}
