import {
  Component,
  ViewEncapsulation,
  Input,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  OnEventArgs,
  SlickGrid,
} from 'angular-slickgrid';
import { OnInit } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { PokhService } from '../pokh/pokh-service/pokh.service';
import { PoRequestBuySlickgridService } from './po-request-buy-slickgrid-service/po-request-buy-slickgrid.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AppUserService } from '../../../services/app-user.service';
@Component({
  selector: 'app-po-request-buy-slickgrid',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
    NzSpaceModule,
    NzSpinModule,
    AngularSlickgridModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './po-request-buy-slickgrid.component.html',
  styleUrl: './po-request-buy-slickgrid.component.css',
})
export class PoRequestBuySlickgridComponent implements OnInit {
  @Input() pokhId!: number;

  // SlickGrid properties
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  isLoading: boolean = false;

  constructor(
    private pokhService: PokhService,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private PoRequestBuySlickgridService: PoRequestBuySlickgridService,
    private appUserService: AppUserService
  ) { }

  dataDepartment: any[] = [];
  dataEmployee: any[] = [];
  gridData: any[] = [];

  selectedDepartment: any;
  selectedEmployee: any;
  dateRequest: Date = new Date();
  dateReturnExpected: Date = new Date();
  selectedRows: any[] = [];
  isEmployeeDisabled: boolean = false;

  ngOnInit(): void {
    // Kiểm tra quyền admin và set employeeId
    const isAdmin = this.appUserService.isAdmin;
    this.isEmployeeDisabled = !isAdmin;
    
    // Nếu không phải admin, set employeeId của user hiện tại
    if (!isAdmin) {
      const currentUserId = this.appUserService.employeeID;
      if (currentUserId) {
        this.selectedEmployee = currentUserId;
        // Set department dựa trên employee hiện tại
        this.selectedDepartment = this.appUserService.departmentID || 0;
      }
    }

    this.initGrid();
    this.loadDepartment();
    this.loadEmployee();
    this.loadPOKHProducts(this.pokhId);
  }
  
  closeModal(): void {
    this.activeModal.close();
  }


  loadPOKHProducts(id: number = 0): void {
    this.isLoading = true;
    this.PoRequestBuySlickgridService.getPOKHProductForRequestBuy(id).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.gridData = response.data;
          this.dataset = this.gridData.map((item: any) => ({
            ...item,
            id: item.ID
          }));
          // Apply distinct filters after data is loaded
          setTimeout(() => {
            this.applyDistinctFiltersToGrid(this.angularGrid, this.columnDefinitions, ['Maker', 'Unit']);
          }, 1000);
          
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải chi tiết POKH: ' + response.message
          );
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải chi tiết POKH: ' + error
        );
        this.isLoading = false;
      },
    });
  }

  loadEmployee(status: number = 0): void {
    this.PoRequestBuySlickgridService.getEmployees(status).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataEmployee = response.data;
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải Employees: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải Employees: ' + error
        );
      },
    });
  }

  loadDepartment(): void {
    this.PoRequestBuySlickgridService.getDepartments().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataDepartment = response.data;
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải Departments: ' + response.message
          );
        }
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error,
          'Lỗi kết nối khi tải Departments: ' + error
        );
      },
    });
  }

  onEmployeeChange(event: any): void {
    const item = this.dataEmployee.find((x) => x.ID === event);
    if (!item) return;
    const department = this.dataDepartment.find(
      (x) => x.ID === item.DepartmentID
    );
    if (department) {
      this.selectedDepartment = department.ID;
    }
  }
  saveData(): void {
    if (!this.selectedEmployee) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn người yêu cầu!');
      return;
    }
    
    const selectedRows = this.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng chọn ít nhất một sản phẩm!'
      );
      return;
    }
    
    // Chuẩn bị dữ liệu gửi lên API
    const requestData = selectedRows.map((row) => ({
      EmployeeID: this.selectedEmployee,
      ProductCode: row.ProductCode,
      ProductName: row.ProductName,
      DateRequest: this.formatLocalDate(this.dateRequest),
      DateReturnExpected: this.formatLocalDate(this.dateReturnExpected),
      Quantity: row.QuantityRequestRemain,
      Note: row.Note,
      ProductSaleID: row.ProductID,
      ProductGroupID: row.ProductGroupID,
      CurrencyID: row.CurrencyID || 0,
      CurrencyRate: row.CurrencyRate || 0,
      TotalPrice: row.IntoMoney,
      VAT: row.VAT,
      TotaMoneyVAT: row.TotalPriceIncludeVAT,
      POKHDetailID: row.ID,
      UnitName: row.Unit,
      DateReceive: row.DeliveryRequestedDate,
      ParentProductCode: row.ParentProductCode,
    }));
    
    this.PoRequestBuySlickgridService.saveData(requestData).subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.notification.success(
            'Thông báo',
            'Lưu yêu cầu mua hàng thành công!'
          );
          this.closeModal();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại!');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu!');
      },
    });
  }

  initGrid(): void {
    this.columnDefinitions = [
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 250,
        minWidth: 250,
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        type: FieldType.string,
        width: 100,
        minWidth: 100,
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: {
            addBlankEntry: true
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as any,
        },
      },
      {
        id: 'GuestCode',
        name: 'Mã theo khách',
        field: 'GuestCode',
        sortable: true,
        filterable: true,
        width: 150,
        minWidth: 150,
      },
      {
        id: 'ParentProductCode',
        name: 'Mã cha',
        field: 'ParentProductCode',
        sortable: true,
        filterable: true,
        width: 150,
        minWidth: 150,
      },
      {
        id: 'Qty',
        name: 'Số lượng PO',
        field: 'Qty',
        sortable: true,
        type: FieldType.number,
        width: 100,
        minWidth: 100,
        cssClass: 'text-end',
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'QuantityRequest',
        name: 'SL đã yêu cầu',
        field: 'QuantityRequest',
        sortable: true,
        type: FieldType.number,
        width: 100,
        minWidth: 100,
        cssClass: 'text-end',
        filterable: true,
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'QuantityRequestRemain',
        name: 'SL yêu cầu',
        field: 'QuantityRequestRemain',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        editor: { model: Editors['integer'] },
        width: 100,
        minWidth: 100,
        cssClass: 'text-end',
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      // {
      //   id: 'CurrencyRate',
      //   name: 'CurrencyRate',
      //   field: 'CurrencyRate',
      //   sortable: true,
      //   type: FieldType.number,
      //   width: 100,
      //   minWidth: 100,
      //   excludeFromColumnPicker: true,
      // },
      // {
      //   id: 'CurrencyID',
      //   name: 'CurrencyID',
      //   field: 'CurrencyID',
      //   sortable: true,
      //   type: FieldType.number,
      //   width: 100,
      //   minWidth: 100,
      //   excludeFromColumnPicker: true,
      // },
      {
        id: 'FilmSize',
        name: 'Kích thước phim cắt',
        field: 'FilmSize',
        sortable: true,
        filterable: true,
        width: 100,
        minWidth: 100,
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        sortable: true,
        filterable: true,
        width: 80,
        minWidth: 80,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          collectionOptions: {
            addBlankEntry: true
          },
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as any,
        },
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá trước VAT',
        field: 'UnitPrice',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { thousandSeparator: ',', decimalSeparator: '.', minDecimal: 0, maxDecimal: 0 },
        width: 150,
        minWidth: 150,
        cssClass: 'text-end',
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'IntoMoney',
        name: 'Tổng tiền trước VAT',
        field: 'IntoMoney',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { thousandSeparator: ',', decimalSeparator: '.', minDecimal: 0, maxDecimal: 0 },
        width: 150,
        minWidth: 150,
        cssClass: 'text-end',
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'VAT',
        name: 'VAT(%)',
        field: 'VAT',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        width: 100,
        minWidth: 100,
        cssClass: 'text-end',
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'TotalPriceIncludeVAT',
        name: 'Tổng tiền sau VAT',
        field: 'TotalPriceIncludeVAT',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { thousandSeparator: ',', decimalSeparator: '.', minDecimal: 0, maxDecimal: 0 },
        width: 150,
        minWidth: 150,
        cssClass: 'text-end',
        filter: {
          model: Filters['compoundInputNumber'],
        },
      },
      {
        id: 'UserReceiver',
        name: 'Người nhận',
        field: 'UserReceiver',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'DeliveryRequestedDate',
        name: 'Ngày y/c giao hàng',
        field: 'DeliveryRequestedDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        type: FieldType.dateIso,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'ActualDeliveryDate',
        name: 'Ngày giao hàng thực tế',
        field: 'ActualDeliveryDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        type: FieldType.dateIso,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'EstimatedPay',
        name: 'Thanh toán dự kiến',
        field: 'EstimatedPay',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'RecivedMoneyDate',
        name: 'Ngày tiền về',
        field: 'RecivedMoneyDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        type: FieldType.dateIso,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'BillDate',
        name: 'Ngày hóa đơn',
        field: 'BillDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        type: FieldType.dateIso,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'BillNumber',
        name: 'Số hóa đơn',
        field: 'BillNumber',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'Debt',
        name: 'Công nợ',
        field: 'Debt',
        sortable: true,
        filterable: true,
        type: FieldType.number,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'PayDate',
        name: 'Ngày y/c thanh toán',
        field: 'PayDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.dateIso,
        type: FieldType.dateIso,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'GroupPO',
        name: 'Nhóm',
        field: 'GroupPO',
        sortable: true,
        filterable: true,
        width: 200,
        minWidth: 200,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 250,
        minWidth: 250,
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#gridContainer',
        rightPadding: 10,
        bottomPadding: 20,
      },
      enableAutoResize: true,
      gridWidth: '100%',
      enableSorting: true,
      enableFiltering: true,
      enableColumnReorder: true,
      enableCellNavigation: true,
      editable: true,
      autoEdit: false,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      checkboxSelector: {
        hideSelectAllCheckbox: false,
        columnIndexPosition: 0,
      },
      multiSelect: true,
      rowHeight: 35,
      headerRowHeight: 40,
      // enablePagination: true,
      // pagination: {
      //   pageSizes: [10, 20, 50, 100, 500],
      //   pageSize: 20,
      // },
      autoCommitEdit: true,
    };
  }

  onAngularGridCreated(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
    // Don't apply filters here, wait for data to load
  }

  getSelectedRows(): any[] {
    if (!this.angularGrid || !this.angularGrid.slickGrid) {
      return [];
    }
    const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows();
    const dataView = this.angularGrid.dataView;
    return selectedRowIndexes.map((index: number) => dataView?.getItem(index));
  }

  private formatLocalDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private applyDistinctFiltersToGrid(
    angularGrid: AngularGridInstance,
    columnDefinitions: Column[],
    fieldsToFilter: string[]
  ): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const data = angularGrid.dataView.getItems();
    if (!data || data.length === 0) return;

    const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      dataArray.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const columns = angularGrid.slickGrid.getColumns();
    if (!columns) return;

    // Update runtime columns
    columns.forEach((column: any) => {
      if (column?.filter && column.filter.model === Filters['multipleSelect']) {
        const field = column.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        column.filter.collection = getUniqueValues(data, field);
      }
    });

    // Update column definitions
    columnDefinitions.forEach((colDef: any) => {
      if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
        const field = colDef.field;
        if (!field || !fieldsToFilter.includes(field)) return;
        colDef.filter.collection = getUniqueValues(data, field);
      }
    });

    angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }
}
