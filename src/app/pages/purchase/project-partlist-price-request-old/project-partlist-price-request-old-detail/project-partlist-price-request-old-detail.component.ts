import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProjectService } from '../../../project/project-service/project.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  NzSelectModule,
  NzOptionComponent,
  NzOptionGroupComponent,
} from 'ng-zorro-antd/select';
import { ProjectPartlistPriceRequestService } from '../../../old/project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { SupplierSaleDetailComponent } from '../../supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { AppUserService } from '../../../../services/app-user.service';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../../services/permission.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-project-partlist-price-request-old-detail',
  standalone: true,
  imports: [
    NzModalModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSlickgridModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzGridModule,
    NzSplitterModule,
    NzSelectModule,
    NzOptionComponent,
    NzOptionGroupComponent,
    Menubar,
    HasPermissionDirective,
  ],
  templateUrl: './project-partlist-price-request-old-detail.component.html',
  styleUrl: './project-partlist-price-request-old-detail.component.css',
})
export class ProjectPartlistPriceRequestOldDetailComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private modal: NzModalService,
    private appUserService: AppUserService,
    private ngbModal: NgbModal,
    private priceRequetsService: ProjectPartlistPriceRequestService,
    private supplierSaleService: SupplierSaleService,
    private projectPartlistPriceRequestService: ProjectPartlistPriceRequestService,
    private permissionService: PermissionService
  ) {}

  @Input() dataDetail: any;
  projectPartlistPriceRequestOldDetailMenu: MenuItem[] = [];
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  headerData: any = null;
  informationForm!: FormGroup;
  employeeList: any[] = [];
  currencyList: any[] = [];
  supplierList: any[] = [];

  ngOnInit(): void {
    this.loadMenu();
    this.initForm();
    this.getEmployee();
    this.getSupplier();
    this.initGridColumns();
    this.initGridOptions();
    this.getCurrency(); // Load currency trước, sau đó mới loadInitialData
    this.loadInitialData();
  }

  //#region Load menu
  loadMenu() {
    this.projectPartlistPriceRequestOldDetailMenu = [
      {
        label: 'Báo giá',
        icon: 'fa-solid fa-circle-check text-success',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.SaveQuote(2);
        },
      },
      {
        label: 'Hủy báo giá',
        icon: 'fa-solid fa-circle-xmark text-danger',
        visible: this.permissionService.hasPermission('N35,N1'),
        command: () => {
          this.SaveQuote(1);
        },
      },
    ];
  }
  //#endregion

  initForm(): void {
    this.informationForm = this.fb.group({
      DatePriceQuote: [null],
      QuoteEmployeeID: [null],
      CurrencyID: [null],
      CurrencyRate: [{ value: 0, disabled: true }],
      HistoryPrice: [{ value: 0, disabled: false }],
      UnitPrice: [{ value: 0, disabled: false }],
      VAT: [{ value: 0, disabled: false }],
      TotalDayLeadTime: [{ value: 0, disabled: false }],
      DateExpected: [null],
      SupplierSaleID: [null],
      Note: [''],
    });
  }

  moneyFormatter = (value: number | string): string => {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  moneyParser = (value: string): number => {
    return value ? Number(value.replace(/,/g, '')) : 0;
  };

  getEmployee() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
  }

  getCurrency() {
    this.priceRequetsService.getCurrency().subscribe((response) => {
      this.currencyList = response.data;
      console.log(this.currencyList);
      // Load data sau khi currency list đã sẵn sàng
      this.loadInitialData();
    });
  }

  getSupplier() {
    this.supplierSaleService.getNCC().subscribe({
      next: (res) => {
        this.supplierList = res.data || [];
        console.log(this.supplierList);
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + error.message
        );
      },
    });
  }

  onCurrencyChange(currencyID: number): void {
    if (!currencyID) {
      this.informationForm.patchValue({ CurrencyRate: 0 });
      this.updateCalculation({ exchange: true });
      return;
    }

    const selectedCurrency = this.currencyList.find(
      (item) => item.ID === currencyID
    );

    if (selectedCurrency && selectedCurrency.CurrencyRate) {
      this.informationForm.patchValue({
        CurrencyRate: selectedCurrency.CurrencyRate,
      });
    } else {
      this.informationForm.patchValue({ CurrencyRate: 0 });
    }

    this.updateCalculation({ exchange: true });
  }

  initGridColumns(): void {
    const ellipsisFormatter = (
      _row: number,
      _cell: number,
      value: any
    ): string => {
      if (value === null || value === undefined || value === '') return '';
      const text = String(value);
      return `
        <span
          title="${text.replace(/\"/g, '&quot;')}"
          style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
        >
          ${text}
        </span>
      `;
    };

    this.columnDefinitions = [
      {
        id: 'TT',
        name: 'TT',
        field: 'TT',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: ellipsisFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: ellipsisFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: ellipsisFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: ellipsisFormatter,
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Quantity',
        name: 'Số lượng',
        field: 'Quantity',
        width: 60,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        type: 'number',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('vi-VN');
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotalPrice',
        name: 'Thành tiền chưa VAT',
        field: 'TotalPrice',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        type: 'number',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('vi-VN');
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotalPriceExchange',
        name: 'Thành tiền quy đổi',
        field: 'TotalPriceExchange',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        type: 'number',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('vi-VN');
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotaMoneyVAT',
        name: 'Thành tiền có VAT',
        field: 'TotaMoneyVAT',
        width: 180,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        type: 'number',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('vi-VN');
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
    ];
  }

  initGridOptions(): void {
    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.project-partlist-price-request-old-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      multiSelect: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },
      enableCheckboxSelector: true,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,

      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
    console.log('angularGrid assigned:', this.angularGrid);
    if (this.angularGrid?.slickGrid) {
      this.angularGrid.slickGrid.onSelectedRowsChanged.subscribe(
        (_e: any, args: any) => {
          const rowIndex =
            Array.isArray(args?.rows) && args.rows.length > 0
              ? args.rows[0]
              : null;
          if (rowIndex === null || rowIndex === undefined) return;
          const rowData = this.angularGrid.dataView?.getItem(rowIndex);
          if (!rowData) return;
          this.patchFormFromRow(rowData);
        }
      );
    }

    setTimeout(() => {
      this.angularGrid?.resizerService.resizeGrid();
      this.updateFooterRow();
      this.syncGridFromDataset();
    }, 100);
  }

  private loadInitialData(): void {
    if (!this.dataDetail || this.dataDetail.length === 0) {
      setTimeout(() => this.updateFooterRow(), 0);
      return;
    }

    // Gán data cho grid
    this.dataset = this.ensureRowIds(this.dataDetail || []);

    // Lấy giá trị max của các trường
    const maxCurrencyID = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.CurrencyID) || 0)
    );
    const maxHistoryPrice = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.HistoryPrice) || 0)
    );
    const maxUnitPrice = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.UnitPrice) || 0)
    );
    const maxVAT = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.VAT) || 0)
    );
    const maxTotalDayLeadTime = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.TotalDayLeadTime) || 0)
    );
    const maxSupplierSaleID = Math.max(
      ...this.dataDetail.map((item: any) => Number(item.SupplierSaleID) || 0)
    );

    // Lấy date và note từ item đầu tiên
    const datePriceQuote = this.dataDetail[0]?.DatePriceQuote || new Date();
    const dateExpected = this.dataDetail[0]?.DateExpected || new Date();
    const note = this.dataDetail[0]?.Note || '';

    // Fill vào form
    this.informationForm.patchValue({
      DatePriceQuote: datePriceQuote,
      QuoteEmployeeID: this.appUserService.employeeID || 0,
      CurrencyID: maxCurrencyID,
      HistoryPrice: maxHistoryPrice,
      UnitPrice: maxUnitPrice,
      VAT: maxVAT,
      TotalDayLeadTime: maxTotalDayLeadTime,
      SupplierSaleID: maxSupplierSaleID,
      DateExpected: dateExpected,
      Note: note,
    });

    // Update CurrencyRate nếu có CurrencyID
    if (maxCurrencyID && this.currencyList.length > 0) {
      this.onCurrencyChange(maxCurrencyID);
    }

    // tính lại data sau khi đã patch form (để fill TotalPrice/VAT/Exchange lên grid)
    this.updateCalculation({ totalPrice: true, exchange: true });

    // Trigger grid update để hiển thị dữ liệu
    setTimeout(() => {
      if (this.angularGrid?.gridService) {
        this.angularGrid.gridService.renderGrid();
      }
      this.updateFooterRow();
    }, 100);
  }

  private updateFooterRow(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;

    const totalCount = (this.dataset || []).length;
    const totalQuantity = (this.dataset || []).reduce(
      (sum: number, item: any) => {
        return sum + (Number(item?.Quantity) || 0);
      },
      0
    );
    const totalPrice = (this.dataset || []).reduce((sum: number, item: any) => {
      return sum + (Number(item?.TotalPrice) || 0);
    }, 0);
    const totalPriceExchange = (this.dataset || []).reduce(
      (sum: number, item: any) => {
        return sum + (Number(item?.TotalPriceExchange) || 0);
      },
      0
    );
    const totalMoneyVAT = (this.dataset || []).reduce(
      (sum: number, item: any) => {
        return sum + (Number(item?.TotaMoneyVAT) || 0);
      },
      0
    );

    this.angularGrid.slickGrid.setFooterRowVisibility(true);
    const columns = this.angularGrid.slickGrid.getColumns();
    columns.forEach((col: any) => {
      const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
      if (!footerCell) return;

      if (col.id === 'ProductCode') {
        footerCell.innerHTML = `${totalCount} sản phẩm`;
      } else if (col.id === 'Quantity') {
        footerCell.innerHTML = `${totalQuantity.toLocaleString('en-US')}`;
      } else if (col.id === 'TotalPrice') {
        footerCell.innerHTML = `<b>${totalPrice.toLocaleString('en-US')}</b>`;
      } else if (col.id === 'TotalPriceExchange') {
        footerCell.innerHTML = `<b>${totalPriceExchange.toLocaleString(
          'en-US'
        )}</b>`;
      } else if (col.id === 'TotaMoneyVAT') {
        footerCell.innerHTML = `<b>${totalMoneyVAT.toLocaleString(
          'en-US'
        )}</b>`;
      } else {
        footerCell.innerHTML = '';
      }
    });
  }

  private patchFormFromRow(row: any): void {
    if (!this.informationForm) return;
    this.informationForm.patchValue({
      ProductCode: row?.ProductCode ?? '',
      ProductName: row?.ProductName ?? '',
      Quantity: Number(row?.Quantity ?? 0),
      Unit: row?.Unit ?? '',
      DateRequest: row?.DateRequest ?? null,
      Deadline: row?.Deadline ?? null,
      FullName: row?.FullName ?? '',
      Note: row?.Note ?? '',
    });
  }

  //#region Form Value Change Handlers
  onUnitPriceChange(value?: number): void {
    const unitPrice = Number(
      value ?? this.informationForm.get('UnitPrice')?.value ?? 0
    );
    this.updateCalculation({ unitPrice, totalPrice: true, exchange: true });
  }

  onVATChange(value?: number): void {
    const vat = Number(value ?? this.informationForm.get('VAT')?.value ?? 0);
    this.updateCalculation({ vat, totalPrice: false, exchange: false });
  }

  onTotalDayLeadTimeChange(value?: number): void {
    if (Number(value) > 999999) {
      return;
    }
    const leadTime = Number(
      value ?? this.informationForm.get('TotalDayLeadTime')?.value ?? 0
    );

    const expectedDate = this.addWeekdays(new Date(), leadTime + 1);
    this.informationForm.patchValue({ DateExpected: expectedDate });
  }

  private commitCurrentGridEdit(): void {
    const grid = this.angularGrid?.slickGrid as any;
    const lock = grid?.getEditorLock?.();
    lock?.commitCurrentEdit?.();
  }

  private ensureRowIds(items: any[]): any[] {
    let autoId = 1;
    return (items || []).map((x: any) => {
      const existingId = x?.id ?? x?.ID;
      return {
        ...x,
        id:
          existingId !== null && existingId !== undefined && existingId !== ''
            ? existingId
            : autoId++,
      };
    });
  }

  onUpdateCalculation(): void {
    this.updateCalculation({ totalPrice: true, exchange: true });
  }

  private syncGridFromDataset(): void {
    if (!this.angularGrid?.dataView) return;
    if (!this.dataset || this.dataset.length === 0) return;

    const items = this.ensureRowIds(this.dataset);
    this.dataset = items;
    (this.angularGrid.dataView as any).setItems(items, 'id');
    this.angularGrid.slickGrid?.invalidate?.();
    this.angularGrid.slickGrid?.render?.();
  }

  private updateCalculation(options?: {
    unitPrice?: number;
    vat?: number;
    totalPrice?: boolean;
    exchange?: boolean;
  }): void {
    // grid có thể chưa ready, vẫn tính trước trên dataset
    if (this.angularGrid?.dataView) {
      this.commitCurrentGridEdit();
      this.updateFooterRow();
    }

    const unitPrice = Number(
      options?.unitPrice ?? this.informationForm.get('UnitPrice')?.value ?? 0
    );
    const vat = Number(
      options?.vat ?? this.informationForm.get('VAT')?.value ?? 0
    );
    const currencyRate = Number(
      this.informationForm.get('CurrencyRate')?.value ?? 0
    );
    const recalcTotalPrice = options?.totalPrice !== false;
    const recalcExchange = options?.exchange === true;

    const sourceItems =
      (this.angularGrid?.dataView?.getItems?.() as any[]) || this.dataset || [];
    const items = this.ensureRowIds(sourceItems);

    const updatedItems = items.map((item: any) => {
      const quantity = Number(item?.Quantity || 0);
      const totalPrice = quantity * unitPrice;
      const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

      const patch: any = {
        ...item,
        TotaMoneyVAT: totalMoneyVAT,
      };

      if (recalcTotalPrice) {
        patch.TotalPrice = totalPrice;
      }

      if (recalcExchange) {
        patch.TotalPriceExchange = totalPrice * currencyRate;
      }

      return patch;
    });

    // update giống pattern excel-formula: setItems lại toàn bộ
    this.dataset = updatedItems;
    this.syncGridFromDataset();
    this.updateFooterRow();
  }

  private calculateTotalMoneyExchange(index: number): number {
    const totalMoney = Number(this.dataset[index]?.TotalPrice || 0);
    const currencyRate = Number(
      this.informationForm.get('CurrencyRate')?.value || 0
    );
    return totalMoney * currencyRate;
  }

  private addWeekdays(startDate: Date, days: number): Date {
    let currentDate = new Date(startDate);
    let addedDays = 0;

    while (addedDays < days) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return currentDate;
  }
  //#endregion

  onSave(): void {
    if (!this.informationForm) return;
    this.informationForm.markAllAsTouched();
    if (this.informationForm.invalid) return;

    this.activeModal.close({
      header: this.headerData,
      form: this.informationForm.getRawValue(),
      dataset: this.dataset,
    });
  }

  OpenAddSupplierModal(): void {
    const modalRef = this.ngbModal.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0; // 0 = thêm mới
    modalRef.result.finally(() => {
      this.getSupplier();
    });
  }

  //#region Báo giá
  SaveQuote(status: number = 2): void {
    const statusName = status == 2 ? 'báo giá' : 'hủy báo giá';
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const loginName = this.appUserService.loginName || '';

    // Lấy giá trị từ form
    const unitPrice = Number(this.informationForm.get('UnitPrice')?.value || 0);
    const note = String(this.informationForm.get('Note')?.value || '').trim();
    const supplierSaleID = Number(
      this.informationForm.get('SupplierSaleID')?.value || 0
    );
    const currencyID = Number(
      this.informationForm.get('CurrencyID')?.value || 0
    );
    const historyPrice = Number(
      this.informationForm.get('HistoryPrice')?.value || 0
    );
    const vat = Number(this.informationForm.get('VAT')?.value || 0);
    const totalDayLeadTime = Number(
      this.informationForm.get('TotalDayLeadTime')?.value || 0
    );
    const currencyRate = Number(
      this.informationForm.get('CurrencyRate')?.value || 0
    );
    const dateExpected = this.informationForm.get('DateExpected')?.value;

    const data = this.angularGrid.slickGrid.getSelectedRows();

    if (data.length === 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn ít nhất một dòng để ${statusName}.`
      );
      return;
    }

    // Validate dữ liệu trước khi lưu
    const shouldValidate = status !== 1 && status !== 3; // Chỉ validate khi Báo giá (2) hoặc Hủy hoàn thành (0)

    if (shouldValidate) {
      for (const idx of data) {
        const rowData = this.angularGrid.dataView.getItem(idx);
        const id = Number(rowData['ID']);
        if (id <= 0) continue;

        // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
        const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          continue; // Bỏ qua sản phẩm không phải của mình khi validate
        }

        const productCode = rowData['ProductCode'] || '';

        // Lấy currency code để hiển thị trong thông báo lỗi
        let currencyCode = '';
        if (currencyID > 0 && this.currencyList) {
          const currency = this.currencyList.find(
            (c: any) => c.ID === currencyID
          );
          currencyCode = currency ? currency.Code : '';
        }

        if (currencyID <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng chọn Loại tiền mã sản phẩm [${productCode}]!`
          );
          return;
        }

        if (currencyRate <= 0) {
          this.notification.warning(
            'Thông báo',
            `Tỷ giá của [${currencyCode}] phải > 0.\nVui lòng kiểm tra lại Ngày hết hạn!`
          );
          return;
        }

        if (unitPrice <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Đơn giá mã sản phẩm [${productCode}]!`
          );
          return;
        }

        if (supplierSaleID <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng chọn Nhà cung cấp mã sản phẩm [${productCode}]!`
          );
          return;
        }
      }
    }

    const updateData: any[] = [];

    for (const idx of data) {
      const row = this.angularGrid.dataView.getItem(idx);
      const quantity = Number(row.Quantity || 0);
      const totalPrice = quantity * unitPrice;
      const totalPriceExchange = totalPrice * currencyRate;
      const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

      const rowData: any = {
        ID: row.ID,
        UnitPrice: unitPrice,
        Note: note,
        SupplierSaleID: supplierSaleID,
        CurrencyID: currencyID,
        HistoryPrice: historyPrice,
        VAT: vat,
        TotalDayLeadTime: totalDayLeadTime,
        CurrencyRate: currencyRate,
        TotalPrice: totalPrice,
        TotalPriceExchange: totalPriceExchange,
        TotaMoneyVAT: totalMoneyVAT,
        UpdatedDate: DateTime.local().toISO(),
        UpdatedBy: loginName,
        DateExpected: dateExpected
          ? dateExpected instanceof Date
            ? DateTime.fromJSDate(dateExpected).toISO()
            : DateTime.fromISO(dateExpected).toISO()
          : null,
      };

      if (!isAdmin) {
        rowData.QuoteEmployeeID = currentEmployeeID;
      }

      updateData.push(rowData);
    }

    this.projectPartlistPriceRequestService.saveData(updateData).subscribe({
      next: (response: any) => {
        this.QuotePrice(status, response.data);
      },
      error: (error) => {
        console.error('Error saving data:', error);
        this.notification.error(
          'Lỗi',
          error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
        );
      },
    });
  }
  //#endregion

  //#region Lưu dữ liệu
  saveData() {
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const loginName = this.appUserService.loginName || '';

    // Lấy giá trị từ form
    const unitPrice = Number(this.informationForm.get('UnitPrice')?.value || 0);
    const note = String(this.informationForm.get('Note')?.value || '').trim();
    const supplierSaleID = Number(
      this.informationForm.get('SupplierSaleID')?.value || 0
    );
    const currencyID = Number(
      this.informationForm.get('CurrencyID')?.value || 0
    );
    const historyPrice = Number(
      this.informationForm.get('HistoryPrice')?.value || 0
    );
    const vat = Number(this.informationForm.get('VAT')?.value || 0);
    const totalDayLeadTime = Number(
      this.informationForm.get('TotalDayLeadTime')?.value || 0
    );
    const currencyRate = Number(
      this.informationForm.get('CurrencyRate')?.value || 0
    );
    const dateExpected = this.informationForm.get('DateExpected')?.value;

    // Chuẩn bị data update cho từng row
    const updateData: any[] = [];

    for (const row of this.dataset) {
      const quantity = Number(row.Quantity || 0);
      const totalPrice = quantity * unitPrice;
      const totalPriceExchange = totalPrice * currencyRate;
      const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;

      const rowData: any = {
        ID: row.ID,
        UnitPrice: unitPrice,
        Note: note,
        SupplierSaleID: supplierSaleID,
        CurrencyID: currencyID,
        HistoryPrice: historyPrice,
        VAT: vat,
        TotalDayLeadTime: totalDayLeadTime,
        CurrencyRate: currencyRate,
        TotalPrice: totalPrice,
        TotalPriceExchange: totalPriceExchange,
        TotaMoneyVAT: totalMoneyVAT,
        UpdatedDate: DateTime.local().toISO(),
        UpdatedBy: loginName,
        DateExpected: dateExpected
          ? dateExpected instanceof Date
            ? DateTime.fromJSDate(dateExpected).toISO()
            : DateTime.fromISO(dateExpected).toISO()
          : null,
      };

      if (!isAdmin) {
        rowData.QuoteEmployeeID = currentEmployeeID;
      }

      updateData.push(rowData);
    }

    this.projectPartlistPriceRequestService.saveData(updateData).subscribe({
      next: (response: any) => {
        this.notification.success(
          'Thông báo',
          response?.message || 'Lưu dữ liệu thành công!'
        );

        this.activeModal.dismiss();
      },
      error: (error) => {
        console.error('Error saving data:', error);
        this.notification.error(
          'Lỗi',
          error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
        );
      },
    });
  }
  //#endregion

  //#region Báo giá
  QuotePrice(status: number = 2, dataSet: any = []): void {
    const STATUS_TEXT: { [key: number]: string } = {
      0: 'Hủy hoàn thành',
      1: 'Hủy báo giá',
      2: 'Báo giá',
      3: 'Hoàn thành',
    };

    const statusText = STATUS_TEXT[status] || '';

    // Xử lý dữ liệu update (chỉ update những dòng của mình hoặc admin)
    const updateData: any[] = [];
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;

    // Helper function để chuyển đổi date sang ISO string hoặc null
    const formatDate = (value: any): string | null => {
      if (!value) return null;
      if (value instanceof Date) {
        return DateTime.fromJSDate(value).toISO();
      }
      if (typeof value === 'string') {
        const dt = DateTime.fromISO(value);
        if (dt.isValid) return dt.toISO();
        // Thử các format khác
        const formats = [
          'yyyy/MM/dd',
          'dd/MM/yyyy',
          'yyyy-MM-dd',
          'MM/dd/yyyy',
        ];
        for (const format of formats) {
          const dt2 = DateTime.fromFormat(value, format);
          if (dt2.isValid) return dt2.toISO();
        }
      }
      return null;
    };

    // Helper function để chuyển đổi số
    const toNumber: any = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    // Helper function để chuyển đổi boolean
    const toBoolean = (value: any): boolean | null => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') return value;
      if (value === 1 || value === '1' || value === 'true' || value === true)
        return true;
      if (value === 0 || value === '0' || value === 'false' || value === false)
        return false;
      return null;
    };

    // Helper function để chuyển đổi string
    const toString = (value: any): string | null => {
      if (value === null || value === undefined) return null;
      const str = String(value).trim();
      return str === '' ? null : str;
    };

    for (const rowData of dataSet) {
      const id = Number(rowData['ID']);

      if (id <= 0) continue;

      // Lọc theo QuoteEmployeeID (chỉ update những sản phẩm của mình hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình
      }

      // Tạo object với toàn bộ model ProjectPartlistPriceRequest
      const quoteData: any = {
        ID: id,
        ProjectPartListID: toNumber(rowData['ProjectPartListID']),
        EmployeeID: toNumber(rowData['EmployeeID']),
        ProductCode: toString(rowData['ProductCode']),
        ProductName: toString(rowData['ProductName']),
        StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
        DateRequest: formatDate(rowData['DateRequest']),
        Deadline: formatDate(rowData['Deadline']),
        Quantity: toNumber(rowData['Quantity']),
        UnitPrice: toNumber(rowData['UnitPrice']),
        TotalPrice: toNumber(rowData['TotalPrice']),
        Unit: toString(
          rowData['Unit'] || rowData['UnitName'] || rowData['UnitCount']
        ),
        SupplierSaleID: toNumber(rowData['SupplierSaleID']),
        Note: toString(rowData['Note']),
        CreatedBy: toString(rowData['CreatedBy']),
        CreatedDate: formatDate(rowData['CreatedDate']),
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: DateTime.local().toISO(),
        // Xử lý DatePriceQuote theo logic WinForm
        DatePriceQuote:
          status === 1
            ? null
            : status === 2
            ? DateTime.local().toISO()
            : formatDate(rowData['DatePriceQuote']),
        TotalPriceExchange: toNumber(rowData['TotalPriceExchange']),
        CurrencyRate: toNumber(rowData['CurrencyRate']),
        CurrencyID: toNumber(rowData['CurrencyID']),
        HistoryPrice: toNumber(rowData['HistoryPrice']),
        LeadTime: toString(rowData['LeadTime']),
        UnitFactoryExportPrice: toNumber(rowData['UnitFactoryExportPrice']),
        UnitImportPrice: toNumber(rowData['UnitImportPrice']),
        TotalImportPrice: toNumber(rowData['TotalImportPrice']),
        IsImport: toBoolean(rowData['IsImport']),
        IsDeleted: toBoolean(rowData['IsDeleted']),
        QuoteEmployeeID: !isAdmin
          ? currentEmployeeID
          : toNumber(rowData['QuoteEmployeeID']),
        IsCheckPrice: toBoolean(rowData['IsCheckPrice']),
        VAT: toNumber(rowData['VAT']),
        TotaMoneyVAT: toNumber(rowData['TotaMoneyVAT']),
        TotalDayLeadTime: toNumber(rowData['TotalDayLeadTime']),
        DateExpected: formatDate(rowData['DateExpected']),
        POKHDetailID: toNumber(rowData['POKHDetailID']),
        IsCommercialProduct: toBoolean(rowData['IsCommercialProduct']),
        Maker: toString(rowData['Maker'] || rowData['Manufacturer']),
        IsJobRequirement: toBoolean(rowData['IsJobRequirement']),
        NoteHR: toString(rowData['NoteHR']),
        JobRequirementID: toNumber(rowData['JobRequirementID']),
        IsRequestBuy: toBoolean(rowData['IsRequestBuy']),
        ProjectPartlistPriceRequestTypeID: toNumber(
          rowData['ProjectPartlistPriceRequestTypeID']
        ),
        ReasonUnPrice: toString(rowData['ReasonUnPrice']),
        EmployeeIDUnPrice: toNumber(rowData['EmployeeIDUnPrice']),
      };

      // Chỉ set QuoteEmployeeID khi KHÔNG phải admin (giống WinForm)
      if (!isAdmin) {
        quoteData.QuoteEmployeeID = currentEmployeeID;
      }

      // Xử lý DatePriceQuote theo logic WinForm
      if (status === 1) {
        // Hủy báo giá
        quoteData.DatePriceQuote = null;
      } else if (status === 2) {
        // Báo giá
        quoteData.DatePriceQuote = new Date();
      }
      // Nếu status khác (0, 3) thì không set DatePriceQuote, backend sẽ giữ nguyên

      updateData.push(quoteData);
    }

    // Kiểm tra nếu không có dòng nào hợp lệ
    if (updateData.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu thay đổi để cập nhật!'
      );
      return;
    }

    // Confirm trước khi update
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Gọi API quote-price
        this.projectPartlistPriceRequestService
          .quotePrice(updateData)
          .subscribe({
            next: (response: any) => {
              if (response?.status === 1) {
                this.notification.success(
                  'Thông báo',
                  response?.message || `${statusText} thành công!`
                );

                // Nếu là báo giá (status = 2), gọi API send-mail với data của các dòng đã chọn
                if (status === 2) {
                  // Lấy data đầy đủ từ các dòng đã chọn và map sang format MailItemPriceRequestDTO
                  // selectedRows từ getSelectedGridData() đã là dữ liệu items trực tiếp
                  const mailData = dataSet.map((rowData: any) => {
                    // Map data sang format MailItemPriceRequestDTO
                    return {
                      EmployeeID: Number(rowData['EmployeeID'] || 0),
                      QuoteEmployee: String(
                        rowData['QuoteEmployee'] ||
                          rowData['FullNameQuote'] ||
                          ''
                      ),
                      ProjectCode: String(rowData['ProjectCode'] || ''),
                      ProductCode: String(rowData['ProductCode'] || ''),
                      ProductName: String(rowData['ProductName'] || ''),
                      Manufacturer: String(
                        rowData['Manufacturer'] || rowData['Maker'] || ''
                      ),
                      Quantity: Number(rowData['Quantity'] || 0),
                      Unit: String(
                        rowData['Unit'] ||
                          rowData['UnitName'] ||
                          rowData['UnitCount'] ||
                          ''
                      ),
                      DateRequest: rowData['DateRequest']
                        ? (() => {
                            const date = rowData['DateRequest'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      Deadline: rowData['Deadline']
                        ? (() => {
                            const date = rowData['Deadline'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      DatePriceQuote: rowData['DatePriceQuote']
                        ? (() => {
                            const date = rowData['DatePriceQuote'];
                            if (date instanceof Date) return date.toISOString();
                            if (typeof date === 'string') {
                              const dt = DateTime.fromISO(date);
                              return dt.isValid ? dt.toISO() : null;
                            }
                            return null;
                          })()
                        : null,
                      CurrencyID: Number(rowData['CurrencyID'] || 0),
                      UnitPrice: Number(rowData['UnitPrice'] || 0),
                      TotalPrice: Number(rowData['TotalPrice'] || 0),
                      TotalPriceExchange: Number(
                        rowData['TotalPriceExchange'] || 0
                      ),
                    };
                  });

                  // Gọi API send-mail
                  this.projectPartlistPriceRequestService
                    .sendMail(mailData)
                    .subscribe({
                      next: (mailResponse: any) => {
                        // Không cần hiển thị thông báo riêng cho send-mail, chỉ log nếu cần
                        if (mailResponse?.status !== 1) {
                          console.warn('Send mail response:', mailResponse);
                        }
                      },
                      error: (mailError) => {
                        // Log lỗi nhưng không hiển thị thông báo lỗi để không làm gián đoạn flow
                        console.error('Error sending mail:', mailError);
                      },
                    });
                }
              } else {
                this.notification.warning(
                  'Thông báo',
                  response?.message || `${statusText} thất bại!`
                );
              }
            },
            error: (error) => {
              console.error('Error quoting price:', error);
              this.notification.error(
                'Lỗi',
                error?.error?.message || `Có lỗi xảy ra khi ${statusText}!`
              );
            },
          });
      },
    });
  }
  //#endregion
}
