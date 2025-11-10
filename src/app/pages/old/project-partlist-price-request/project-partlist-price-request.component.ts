import {
  Component,
  inject,
  OnInit,
  EventEmitter,
  Output,
  Injector,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  ViewEncapsulation,
  createComponent,
} from '@angular/core';
import { ProjectPartlistPriceRequestService } from './project-partlist-price-request-service/project-partlist-price-request.service';
import { ProjectPartlistPriceRequestFormComponent } from './project-partlist-price-request-form/project-partlist-price-request-form.component';
import {
  TabulatorFull as Tabulator,
  ColumnComponent,
  MenuObject,
  RowComponent,
} from 'tabulator-tables';
import { SelectEditorComponent } from '../SelectEditor/SelectEditor.component';
import { NSelectComponent } from '../n-select/n-select.component';
import 'tabulator-tables/dist/css/tabulator_simple.min.css'; // Import Tabulator stylesheet
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../services/app-user.service';

@Component({
  selector: 'app-project-partlist-price-request',
  templateUrl: './project-partlist-price-request.component.html',
  styleUrls: ['./project-partlist-price-request.component.css'],
  standalone: true,
  //encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ProjectPartlistPriceRequestFormComponent,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
    NSelectComponent,
  ],
})
export class ProjectPartlistPriceRequestComponent implements OnInit {
  @Output() openModal = new EventEmitter<any>();

  // Active tab tracking
  sizeSearch: string = '0';
  activeTabId = 2;
  dtproject: any[] = [];
  dtPOKH: any[] = [];
  loading = false;
  dtprojectPartlistPriceRequest: any[] = [];
  projectTypes: any[] = [];
  tables: Map<number, Tabulator> = new Map();
  modalData: any[] = [];
  dtcurrency: any[] = [];
  showDetailModal = false;
  // Filters
  filters: any;
  dtSupplierSale: any[] = [];

  PriceRequetsService = inject(ProjectPartlistPriceRequestService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  private ngbModal = inject(NgbModal);
  appUserService = inject(AppUserService);

  constructor() {}

  ngOnInit() {
    this.filters = {
      dateStart: DateTime.local(2025, 1, 1).toJSDate(), // Lưu dạng Date
      dateEnd: DateTime.local(2025, 5, 30).toJSDate(), // Lưu dạng Date
      statusRequest: 1,
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: 0,
      isCommercialProd: -1,
    };

    this.GetCurrency();
    this.GetSupplierSale();
    this.LoadProjectTypes();
    this.GetallProject();
    this.GetAllPOKH();
  }
  OnFormSubmit(): void {
    this.LoadPriceRequests();
    this.showDetailModal = false;
  }
  OnAddClick() {
    this.modalData = [];
    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    );

    modalRef.componentInstance.dataInput = this.modalData;

    modalRef.result.then(
      (result) => {
        // Modal đóng với kết quả
        this.OnFormSubmit();
      },
      (dismissed) => {
        // Modal bị dismiss
        console.log('Modal dismissed');
      }
    );
  }

  OnEditClick() {
    const lstTypeAccept = [-1, -2];
    const table = this.tables.get(this.activeTabId);

    if (!lstTypeAccept.includes(this.activeTabId)) {
      this.notification.info(
        'Thông báo',
        'Chỉ được sửa những sản phẩm thương mại hoặc của HCNS!'
      );
      return;
    }

    if (!table) return;

    const selectedRows = table.getSelectedData();

    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để chỉnh sửa.'
      );
      return;
    }

    // Kiểm tra cùng EmployeeID
    const empID = selectedRows[0].EmployeeID;
    const allSameEmp = selectedRows.every((row) => row.EmployeeID === empID);

    if (!allSameEmp) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn các yêu cầu báo giá có cùng Người yêu cầu!'
      );
      return;
    }

    // Gán STT cho từng dòng được chọn
    const processedRows = selectedRows.map((row, index) => ({
      ...row,
      STT: index + 1,
    }));

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    );

    modalRef.componentInstance.dataInput = processedRows;

    modalRef.result.then(
      (result) => {
        // Modal đóng với kết quả
        this.OnFormSubmit();
      },
      (dismissed) => {
        // Modal bị dismiss
        console.log('Modal dismissed');
      }
    );
  }

  OnDeleteClick() {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const selectedRows = table.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để xóa.'
      );
      // Swal.fire({
      //   title: 'Thông báo',
      //   text: 'Vui lòng chọn ít nhất một dòng để xóa.',
      //   icon: 'warning',
      //   confirmButtonText: 'OK',
      // });
      return;
    }
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: 'Bạn có chắc muốn xóa các dòng đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updateData = selectedRows.map((row) => {
          const data = row.getData();
          return {
            ID: data['ID'],
            IsDeleted: true,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: new Date().toISOString(),
          };
        });

        // Gửi về server qua hàm save chung
        this.SaveDataCommon(updateData, 'Xóa dữ liệu thành công');
      },
    });
  }
  createdControl1(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any,
    displayField: string,
    labelField: string = 'Code',
    valueField: string = 'ID'
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Lấy giá trị từ cell
      const cellValue = cell.getValue();

      // Các tham số truyền vào component
      componentRef.instance.dataSource = data;
      componentRef.instance.value = cellValue;

      // Nếu component là NSelectComponent, truyền thêm các trường tùy chỉnh
      if (component === NSelectComponent) {
        componentRef.instance.displayField = displayField;
        componentRef.instance.labelField = labelField;
        componentRef.instance.valueField = valueField;
      } else {
        // Tương thích ngược với SelectEditorComponent
        componentRef.instance.label = displayField;
      }

      // Các tham số trả ra
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.value = cell.getValue();
      componentRef.instance.dataSource = this.dtcurrency;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  createdControl2(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.value = cell.getValue();
      componentRef.instance.dataSource = this.dtSupplierSale;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
  private GetSupplierSale() {
    this.PriceRequetsService.getSuplierSale()
      // .pipe(take(50))
      .subscribe((response) => {
        this.dtSupplierSale = response.data;
        console.log('dtsuppliersale: ', this.dtSupplierSale);
      });
  }
  private LoadProjectTypes(): void {
    const employeeID = 0;
    this.PriceRequetsService.getTypes(employeeID).subscribe((response) => {
      this.projectTypes = response.data.dtType;
      console.log('Types:', this.projectTypes);

      setTimeout(() => {
        this.projectTypes.forEach((type) => {
          this.CreateTableForType(type.ProjectTypeID);
        });
      }, 100);
    });
  }
  ToggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  private GetallProject() {
    this.PriceRequetsService.getProject().subscribe((response) => {
      this.dtproject = response.data;
      console.log('PriceRequests:', this.dtproject);
    });
  }
  private GetCurrency() {
    this.PriceRequetsService.getCurrency().subscribe((response) => {
      this.dtcurrency = response.data;
      this.createLabelsFromData();
      console.log('dtcurrentcy: ', this.dtcurrency);
    });
  }
  private GetAllPOKH() {
    this.PriceRequetsService.getPOKH().subscribe((response) => {
      this.dtPOKH = response.data;
      console.log('POKH:', this.dtPOKH);
    });
  }

  private LoadPriceRequests(): void {
    const activeTable = this.tables.get(this.activeTabId);
    if (activeTable) {
      activeTable.setData();
    }
  }

  public ApplyFilters(): void {
    console.log(this.filters.poKHID);
    // Reload tất cả các table đã được tạo
    this.tables.forEach((table) => {
      table.setData();
    });
  }

  public ResetFilters(): void {
    this.filters = {
      dateStart: DateTime.local(2025, 1, 1).toJSDate(),
      dateEnd: DateTime.local().toJSDate(),
      statusRequest: 1,
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: 0,
      isCommercialProd: -1,
    };

    // Reload tất cả các table
    this.tables.forEach((table) => {
      table.setData();
    });
  }

  public SelectProjectType(typeId: number): void {
    this.activeTabId = typeId;
    this.filters.projectTypeID = typeId;

    // Kiểm tra nếu bảng đã tồn tại
    if (!this.tables.has(typeId)) {
      this.CreateTableForType(typeId);
    }

    // Table sẽ tự động load dữ liệu qua AJAX
  }
  private CreateTableForType(typeId: number): void {
    const tableId = `datatable-${typeId}`;
    const element = document.getElementById(tableId);

    if (!element) {
      console.error(`Table container not found: ${tableId}`);
      return;
    }

    const table = new Tabulator(
      `#${tableId}`,
      this.GetTableConfigForType(typeId)
    );
    this.tables.set(typeId, table);
  }

  // Tạo cấu hình table riêng cho từng type
  private GetTableConfigForType(typeId: number): any {
    const baseConfig = this.GetTableConfig();

    // Override ajaxParams để truyền đúng tham số cho từng type
    baseConfig.ajaxParams = () => {
      const dateStart =
        typeof this.filters.dateStart === 'string'
          ? this.filters.dateStart
          : DateTime.fromJSDate(this.filters.dateStart).toFormat('yyyy/MM/dd');

      const dateEnd =
        typeof this.filters.dateEnd === 'string'
          ? this.filters.dateEnd
          : DateTime.fromJSDate(this.filters.dateEnd).toFormat('yyyy/MM/dd');

      let projectTypeID = typeId;
      let isCommercialProduct = -1;
      let poKHID = this.filters.poKHID;

      // Xử lý logic cho các tab đặc biệt
      if (typeId === -1) {
        // Tab "Sản phẩm thương mại"
        projectTypeID = -1;
        isCommercialProduct = 1;
        poKHID = 0;
      } else if (typeId === -2) {
        // Tab "HCNS"
        projectTypeID = 0;
        isCommercialProduct = -1;
      }

      return {
        dateStart: dateStart,
        dateEnd: dateEnd,
        statusRequest: this.filters.statusRequest - 1,
        projectId: this.filters.projectId,
        keyword: this.filters.keyword || '',
        isDeleted: this.filters.isDeleted,
        projectTypeID: projectTypeID,
        poKHID: poKHID,
        isCommercialProduct: isCommercialProduct,
      };
    };

    return baseConfig;
  }

  private UpdateActiveTable(): void {
    const tableId = this.activeTabId;
    if (!this.tables.has(tableId)) {
      this.CreateTableForType(tableId);
    }

    const table = this.tables.get(tableId);
    if (table) {
      table.setData(this.dtprojectPartlistPriceRequest);
    }
  }
  CalculateTotalPriceExchange(rowData: any, currencyRate: number): number {
    const totalMoney = Number(rowData.TotalPrice) || 0;
    return totalMoney * currencyRate;
  }
  GetDataChanged() {
    const tableId = this.activeTabId;
    const table = this.tables.get(tableId);
    if (!table) return;
    table.on('dataChanged', function (data) {});
  }
  private SaveDataCommon(
    data: any[],
    successMessage: string = 'Dữ liệu đã được lưu.'
  ): void {
    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    this.PriceRequetsService.saveChangedData(data).subscribe({
      next: (response) => {
        if ((response as any).status === 1) {
          this.LoadPriceRequests();
          this.notification.success(
            'Thông báo',
            (response as any).message || successMessage
          );
        } else {
          this.notification.success(
            'Thông báo',
            (response as any).message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu dữ liệu.');
        // Swal.fire('Thông báo', 'Không thể lưu dữ liệu.', 'error');
      },
    });
  }

  OnSaveData(): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const editedCells = table.getEditedCells();
    const changedRowsMap = new Map<number, any>();

    editedCells.forEach((cell) => {
      const row = cell.getRow();
      const data = row.getData();
      changedRowsMap.set(Number(data['ID']), data);
    });

    const changedData = Array.from(changedRowsMap.values());

    if (changedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    // Chỉ giữ lại các trường hợp lệ
    const validFields = [
      'ID',
      'EmployeeID',
      'Deadline',
      'Note',
      'Unit',
      'Quantity',
      'TotalPrice',
      'UnitPrice',
      'VAT',
      'TotaMoneyVAT',
      'CurrencyID',
      'CurrencyRate',
      'IsCheckPrice',
      'SupplierSaleID',
      'DateExpected',
      'DateRequest',
      'DatePriceQuote',
      'LeadTime',
      'TotalDayLeadTime',
      'TotalPriceExchange',
    ];
    if (!this.appUserService.isAdmin) {
      validFields.push('QuoteEmployeeID');
      validFields.push('UpdatedBy');
    }

    // Danh sách các trường ngày tháng cần xử lý đặc biệt
    const dateFields = [
      'Deadline',
      'DateExpected',
      'DateRequest',
      'DatePriceQuote',
      'LeadTime',
    ];

    const filteredData = changedData.map((item) => {
      const filteredItem: any = {};
      validFields.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          // Xử lý đặc biệt cho các trường ngày tháng
          if (dateFields.includes(key)) {
            // Kiểm tra và chuyển đổi tất cả các loại dữ liệu ngày tháng
            if (item[key] instanceof Date) {
              // Nếu là đối tượng Date, chuyển đổi sang định dạng ISO
              filteredItem[key] = DateTime.fromJSDate(item[key]).toISO();
            } else if (item[key] && typeof item[key] === 'string') {
              // Nếu là chuỗi, thử chuyển đổi sang DateTime
              try {
                // Thử phân tích chuỗi như một ISO date
                const dt = DateTime.fromISO(item[key]);
                if (dt.isValid) {
                  filteredItem[key] = dt.toISO();
                } else {
                  // Thử các định dạng khác
                  const formats = [
                    'DD/MM/YYYY',
                    'yyyy/MM/dd',
                    'dd/MM/yyyy',
                    'yyyy-MM-dd',
                  ];
                  for (const format of formats) {
                    const dt = DateTime.fromFormat(item[key], format);
                    if (dt.isValid) {
                      filteredItem[key] = dt.toISO();
                      break;
                    }
                  }
                }
              } catch (e) {
                console.error(
                  `Không thể chuyển đổi ngày tháng: ${item[key]}`,
                  e
                );
                // Giữ nguyên giá trị nếu không thể chuyển đổi
                filteredItem[key] = item[key];
              }
            } else {
              filteredItem[key] = item[key];
            }
          } else {
            filteredItem[key] = item[key];
          }
        }
      });

      // Sử dụng định dạng ISO chuẩn cho UpdatedDate
      filteredItem.UpdatedDate = DateTime.local().toISO();
      filteredItem.UpdatedBy = !this.appUserService.isAdmin ? this.appUserService.loginName : '';
      return filteredItem;
    });

    console.log('Dữ liệu đã lọc:', filteredData);

    this.SaveDataCommon(filteredData, 'Dữ liệu đã được lưu.');
  }

  AddWeekdays(date: Date, days: number): Date {
    if (!days || isNaN(days)) {
      return date; // Trả về ngày gốc nếu days không hợp lệ
    }

    let count = 0;
    let result = new Date(date.getTime());

    while (count < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        // Skip Sunday (0) and Saturday (6)
        count++;
      }
    }

    return result; // Vẫn trả về đối tượng Date JavaScript
  }
  UpdateValue(rowData: any): void {
    const quantity = Number(rowData.Quantity) || 0;
    const unitPrice = Number(rowData.UnitPrice) || 0;
    const unitImportPrice = Number(rowData.UnitImportPrice) || 0;
    const vat = Number(rowData.VAT) || 0;
    const leadTime = Number(rowData.TotalDayLeadTime) || 0;
    const currencyRate = Number(rowData.CurrencyRate) || 1;

    // Thành tiền
    const totalPrice = quantity * unitPrice;
    rowData.TotalPrice = totalPrice;

    // Thành tiền quy đổi (VNĐ)
    rowData.TotalPriceExchange = this.CalculateTotalPriceExchange(
      rowData,
      currencyRate
    );

    // Thành tiền nhập khẩu
    const totalPriceImport = quantity * unitImportPrice;
    rowData.TotalImportPrice = totalPriceImport;

    // Thành tiền có VAT
    const totalMoneyVAT = totalPrice + (totalPrice * vat) / 100;
    rowData.TotaMoneyVAT = totalMoneyVAT;

    // Tính ngày về dự kiến
    if (rowData.TotalDayLeadTime !== undefined) {
      rowData.DateExpected = this.AddWeekdays(
        DateTime.local().toJSDate(),
        leadTime
      );
    }
  }

  HandleCellEdited(cell: any) {
    const row = cell.getRow();
    const data = row.getData();

    // Lấy các giá trị cần thiết từ dòng
    const unitPrice = Number(data.UnitPrice) || 0;
    const importPrice = Number(data.UnitImportPrice) || 0;
    const quantity = Number(data.Quantity) || 0;
    const vat = Number(data.VAT) || 0;
    const currencyRate = Number(data.CurrencyRate) || 1;

    // Tính toán lại
    const totalPrice = unitPrice * quantity;
    const totalPriceImport = quantity * importPrice;
    const totalVAT = totalPrice + (totalPrice * vat) / 100;
    const totalPriceExchange = totalPrice * currencyRate;

    const leadtime = Number(data.TotalDayLeadTime);
    // Sử dụng DateTime để tạo ngày dự kiến
    const dateexpect = this.AddWeekdays(DateTime.local().toJSDate(), leadtime);

    // Cập nhật lại các cột liên quan
    row.update({
      DateExpected: dateexpect, // Đây vẫn là đối tượng Date JavaScript
      TotalImportPrice: totalPriceImport,
      TotalPrice: totalPrice,
      TotaMoneyVAT: totalVAT,
      TotalPriceExchange: totalPriceExchange,
    });
  }
  OnCurrencyChanged(cell: any) {
    const code = Number(cell.getValue());
    const currency = this.dtcurrency.find((p: { ID: number }) => p.ID === code);
    if (currency) {
      const rate = currency.CurrencyRate;
      // const finalRate = rate; // xử lý expired nếu cần

      const rowData = cell.getRow().getData();
      const totalPrice = this.CalculateTotalPriceExchange(rowData, rate);

      cell.getRow().update({
        CurrencyID: currency.ID,
        CurrencyRate: currency.CurrencyRate,
        TotalPriceExchange: totalPrice,
      });
    }
  }
  OnSupplierSaleChanged(cell: any) {
    const supplierId = cell.getValue();
    const supplier = this.dtSupplierSale.find(
      (p: { ID: number }) => p.ID === supplierId
    );

    if (supplier) {
      const row = cell.getRow();
      row.update({ CodeNCC: supplier.CodeNCC });
    }
  }
  QuotePrice(status: number = 2): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    // Map trạng thái
    const STATUS_TEXT: { [key: number]: string } = {
      0: 'Hủy hoàn thành',
      1: 'Hủy báo giá',
      2: 'Báo giá',
      3: 'Hoàn thành',
    };

    const statusText = STATUS_TEXT[status] || '';
    const selectedRows = table.getSelectedRows();

    // Validate chọn dòng
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${statusText}!`
      );
      return;
    }

    // Xử lý dữ liệu
    const updateData: any[] = [];
    const shouldValidate = ![1, 3].includes(status);

    for (const row of selectedRows) {
      const rowData = row.getData();
      const id = Number(rowData['ID']);

      // Bỏ qua các dòng không hợp lệ
      if (id <= 0) continue;

      // Validate cho các trường hợp cần kiểm tra
      if (shouldValidate) {
        const productCode = rowData['ProductCode'] || '';
        const currencyId = Number(rowData['CurrencyID']);
        const currencyCode = rowData['CurrencyCode'] || '';
        const currencyRate = Number(rowData['CurrencyRate']);
        const unitPrice = Number(rowData['UnitPrice']);
        const supplierSaleId = Number(rowData['SupplierSaleID']);

        if (currencyId <= 0) {
          this.notification.info(
            'Thông báo',
            `Vui lòng chọn Loại tiền mã sản phẩm [${productCode}]!`
          );

          return;
        }

        if (currencyRate <= 0) {
          this.notification.info(
            'Thông báo',
            `Vui lòng nhập Tỷ giá mã sản phẩm [${productCode}]!`
          );
          return;
        }

        if (unitPrice <= 0) {
          this.notification.info(
            'Thông báo',
            `Vui lòng nhập Đơn giá mã sản phẩm [${productCode}]!`
          );

          return;
        }

        if (supplierSaleId <= 0) {
          this.notification.info(
            'Thông báo',
            `Vui lòng nhập Nhà cung cấp sản phẩm [${productCode}]!`
          );
          return;
        }
      }

      // Cập nhật dữ liệu
      Object.assign(rowData, {
        StatusRequest: status,
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: new Date(),
        QuoteEmployeeID: !this.appUserService.isAdmin ? this.appUserService.employeeID : rowData['QuoteEmployeeID'],
        DatePriceQuote:
          status === 2
            ? new Date()
            : status === 1
            ? null
            : rowData['DatePriceQuote'],
      });

      updateData.push(rowData);
    }
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${statusText} danh sách sản phẩm đã chọn không?\nNhững sản phẩm NV mua không phải bạn sẽ tự động được bỏ qua!`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (updateData.length > 0) {
          this.SaveDataCommon(updateData, `${statusText} thành công`);
        }
      },
    });
  }

  // Cập nhật phương thức CheckPrice để sử dụng hàm chung
  CheckPrice(isCheckPrice: boolean): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const isCheckText = isCheckPrice ? 'Check giá' : 'Huỷ check giá';
    const selectedRows = table.getSelectedRows();

    if (selectedRows.length <= 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${isCheckText}!`
      );
      return;
    }

    // Xác nhận thao tác
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isCheckText} danh sách sản phẩm đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Xử lý khi người dùng xác nhận
        // Lấy dữ liệu từ các dòng đã chọn
        const updateData = selectedRows.map((row) => {
          const rowData = row.getData();
          return {
            ID: Number(rowData['ID']),
            IsCheckPrice: isCheckPrice,
            QuoteEmployeeID: isCheckPrice ? this.appUserService.employeeID : 0,
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toJSDate(),
          };
        });

        // Sử dụng hàm chung để lưu dữ liệu
        this.SaveDataCommon(updateData, `${isCheckText} thành công`);
      },
    });
  }
  async ExportToExcelAdvanced() {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const workbook = new ExcelJS.Workbook();
    const type = this.projectTypes.find(
      (t) => t.ProjectTypeID === this.activeTabId
    );
    const projectTypeName = type?.ProjectTypeName || 'Danh sách báo giá';
    const sanitizedName = projectTypeName
      .replace(/[\\/?*[\]:]/g, '')
      .substring(0, 31);
    const worksheet = workbook.addWorksheet(sanitizedName);

    // Lấy dữ liệu
    const data = table.getSelectedData();

    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const columns = table
      .getColumnDefinitions()
      .filter((col: any) => col.visible !== false);

    // Thêm headers
    const headerRow = worksheet.addRow(columns.map((col: any) => col.title));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Thêm dữ liệu
    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];

        // Xử lý null/undefined thành khoảng trống
        if (value === null || value === undefined) {
          return '';
        }

        // Xử lý object rỗng
        if (
          typeof value === 'object' &&
          value !== null &&
          Object.keys(value).length === 0
        ) {
          return '';
        }

        // Xử lý các trường đặc biệt
        if (col.field === 'IsCheckPrice') {
          return value ? 'Có' : 'Không';
        }

        // Xử lý trường ngày báo giá
        if (col.field === 'DatePriceQuote') {
          if (
            !value ||
            value === '' ||
            (typeof value === 'object' && Object.keys(value).length === 0)
          ) {
            return '';
          }
          return value;
        }

        // Xử lý các trường số với formatter
        if (
          col.field === 'UnitPrice' ||
          col.field === 'TotalPriceExchange' ||
          col.field === 'TotaMoneyVAT' ||
          col.field === 'TotalImportPrice'
        ) {
          return value === 0 ? 0 : value || '';
        }

        // Xử lý trường select với lookup
        if (col.field === 'CurrencyID') {
          const currency = this.dtcurrency?.find((c: any) => c.ID === value);
          return currency ? currency.Code : '';
        }

        if (col.field === 'SupplierSaleID') {
          const supplier = this.dtSupplierSale?.find(
            (s: any) => s.ID === value
          );
          return supplier ? supplier.NameNCC : '';
        }

        // Xử lý chuỗi rỗng
        if (value === '') {
          return '';
        }

        // Return giá trị bình thường
        return value;
      });
      worksheet.addRow(rowData);
    });

    // Auto-fit columns với xử lý an toàn
    worksheet.columns.forEach((column, index) => {
      const col = columns[index];
      if (col.width) {
        // Kiểm tra nếu width là string và chứa 'vh'
        if (typeof col.width === 'string' && col.width.includes('vh')) {
          column.width = parseFloat(col.width.replace('vh', '')) * 2;
        }
        // Nếu width là number
        else if (typeof col.width === 'number') {
          column.width = col.width;
        }
        // Nếu width là string nhưng không chứa 'vh'
        else if (typeof col.width === 'string') {
          column.width = parseFloat(col.width) || 15;
        }
      } else {
        column.width = 15;
      }
    });

    // Thêm border cho tất cả cells
    const range =
      worksheet.getCell('A1').address +
      ':' +
      worksheet.getCell(data.length + 1, columns.length).address;

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        // Căn giữa cho header
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `price-request-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  async ExportToExcelTab() {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const url = this.PriceRequetsService.getAPIPricerequest();
    const filters = this.filters;

    // Chuẩn bị tham số giống ajaxParams nhưng size lớn để lấy toàn bộ
    let statusRequest = filters.statusRequest;
    if (statusRequest < 0) statusRequest = 0;

    let isCommercialProduct =
      filters.projectTypeID === -1 ? 1 : filters.isCommercialProd;
    let poKHID = filters.projectTypeID >= 0 ? 0 : filters.poKHID;

    const params = {
      dateStart: DateTime.fromJSDate(filters.dateStart).toFormat('yyyy/MM/dd'),
      dateEnd: DateTime.fromJSDate(filters.dateStart).toFormat('yyyy/MM/dd'),
      statusRequest: statusRequest,
      projectId: filters.projectId,
      keyword: filters.keyword,
      isDeleted: filters.isDeleted,
      projectTypeID: filters.projectTypeID,
      poKHID: poKHID,
      isCommercialProduct: isCommercialProduct,
      page: 1,
      size: 1000000,
    };

    try {
      const response = await fetch(
        `${url}?${new URLSearchParams(params as any)}`
      );
      const result = await response.json();

      const rawData = result.data?.dtData || [];

      if (rawData.length === 0) {
        this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
        return;
      }

      const columns = table
        .getColumnDefinitions()
        .filter((col: any) => col.visible !== false);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo giá');

      // Thêm header
      const headerRow = worksheet.addRow(columns.map((col: any) => col.title));
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Nhóm dữ liệu theo ProjectFullName
      const grouped = rawData.reduce((acc: any, item: any) => {
        const groupKey = item.ProjectFullName || 'Không rõ dự án';
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {});

      // Lặp qua từng group
      for (const groupName of Object.keys(grouped)) {
        const groupRows = grouped[groupName];

        // Thêm dòng Group Header
        const groupHeaderRow = worksheet.addRow([
          `${groupName} (${groupRows.length})`,
        ]);
        groupHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFd9edf7' },
        };

        groupHeaderRow.font = { bold: true };
        groupHeaderRow.alignment = { horizontal: 'left' };
        worksheet.mergeCells(
          `A${groupHeaderRow.number}:${
            worksheet.columns.length > 0
              ? worksheet.getColumn(worksheet.columns.length).letter +
                groupHeaderRow.number
              : 'A' + groupHeaderRow.number
          }`
        );

        // Thêm các dòng dữ liệu trong nhóm
        groupRows.forEach((row: any) => {
          const rowData = columns.map((col: any) => {
            const value = row[col.field];

            if (value === null || value === undefined) return '';
            if (typeof value === 'object' && Object.keys(value).length === 0)
              return '';

            if (col.field === 'IsCheckPrice') return value ? 'Có' : 'Không';

            if (
              ['DatePriceQuote', 'DateRequest', 'Deadline'].includes(col.field)
            )
              return value
                ? DateTime.fromJSDate(value).toFormat('yyyy/MM/dd')
                : '';

            if (col.field === 'CurrencyID') {
              const currency = this.dtcurrency?.find(
                (c: any) => c.ID === value
              );
              return currency ? currency.Code : '';
            }

            if (col.field === 'SupplierSaleID') {
              const supplier = this.dtSupplierSale?.find(
                (s: any) => s.ID === value
              );
              return supplier ? supplier.NameNCC : '';
            }

            return value;
          });

          worksheet.addRow(rowData);
        });
      }

      // Auto-fit width
      worksheet.columns.forEach((column, index) => {
        const col = columns[index];
        if (col?.width) {
          if (typeof col.width === 'string' && col.width.includes('vh')) {
            column.width = parseFloat(col.width.replace('vh', '')) * 2;
          } else if (typeof col.width === 'number') {
            column.width = col.width;
          } else {
            column.width = parseFloat(col.width) || 15;
          }
        } else {
          column.width = 15;
        }
      });

      // Viền ô
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

      // Tạo & tải file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `price-request-full-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error(error);
      this.notification.error(
        'Thông báo',
        'Đã xảy ra lỗi khi xuất Excel. Vui lòng thử lại sau.'
      );
    }
  }
  async ExportAllTabsToExcel() {
    const workbook = new ExcelJS.Workbook();
    const url = this.PriceRequetsService.getAPIPricerequest();

    for (const type of this.projectTypes) {
      const filters = { ...this.filters };
      const projectTypeID = type.ProjectTypeID;

      let statusRequest = filters.statusRequest < 0 ? 0 : filters.statusRequest;
      let isCommercialProduct =
        projectTypeID === -1 ? 1 : filters.isCommercialProd;
      let poKHID = projectTypeID >= 0 ? 0 : filters.poKHID;

      const params = {
        dateStart: DateTime.fromJSDate(filters.dateStart).toFormat(
          'yyyy/MM/dd'
        ),
        dateEnd: DateTime.fromJSDate(filters.dateEnd).toFormat('yyyy/MM/dd'),
        statusRequest,
        projectId: filters.projectId,
        keyword: filters.keyword,
        isDeleted: filters.isDeleted,
        projectTypeID,
        poKHID,
        isCommercialProduct,
        page: 1,
        size: 1000000,
      };

      try {
        const response = await fetch(
          `${url}?${new URLSearchParams(params as any)}`
        );
        const result = await response.json();
        const rawData = result.data?.dtData || [];
        if (rawData.length === 0) continue;

        const table = this.tables.get(projectTypeID);
        if (!table) continue;

        const columns = table
          .getColumnDefinitions()
          .filter((col: any) => col.visible !== false);
        const sheetName = (
          type.ProjectTypeName || `Sheet-${projectTypeID}`
        ).replace(/[\\/?*[\]]/g, '');
        const sheet = workbook.addWorksheet(sheetName);

        // Add header row
        const headerRow = sheet.addRow(columns.map((col: any) => col.title));
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Group dữ liệu theo ProjectFullName
        const grouped = rawData.reduce((acc: any, item: any) => {
          const groupKey = item.ProjectFullName || 'Không rõ dự án';
          if (!acc[groupKey]) acc[groupKey] = [];
          acc[groupKey].push(item);
          return acc;
        }, {});

        for (const groupName of Object.keys(grouped)) {
          const groupRows = grouped[groupName];

          // Group header
          const groupHeader = sheet.addRow([
            `${groupName} (${groupRows.length})`,
          ]);
          groupHeader.font = { bold: true };
          groupHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFd9edf7' },
          };
          sheet.mergeCells(
            `A${groupHeader.number}:${String.fromCharCode(
              65 + columns.length - 1
            )}${groupHeader.number}`
          );

          // Dữ liệu trong group
          groupRows.forEach((row: any) => {
            const rowData = columns.map((col: any) => {
              const value = row[col.field];

              if (
                value == null ||
                (typeof value === 'object' && Object.keys(value).length === 0)
              )
                return '';
              if (col.field === 'IsCheckPrice') return value ? 'Có' : 'Không';
              if (
                ['DatePriceQuote', 'DateRequest', 'Deadline'].includes(
                  col.field
                )
              )
                return DateTime.fromJSDate(value).isValid
                  ? DateTime.fromJSDate(value).toFormat('DD/MM/YYYY')
                  : '';
              if (col.field === 'CurrencyID') {
                const cur = this.dtcurrency?.find((c) => c.ID === value);
                return cur ? cur.Code : '';
              }
              if (col.field === 'SupplierSaleID') {
                const sup = this.dtSupplierSale?.find((s) => s.ID === value);
                return sup ? sup.NameNCC : '';
              }
              return value;
            });

            sheet.addRow(rowData);
          });

          // Footer bottomCalc
          const footerRowData = columns.map((col: any) => {
            if (!col.bottomCalc) return '';
            const values = groupRows.map((r: any) => Number(r[col.field]) || 0);
            switch (col.bottomCalc) {
              case 'sum':
                return values.reduce((a: number, b: number) => a + b, 0);

              case 'avg':
                return values.length > 0
                  ? (
                      values.reduce((a: number, b: number) => a + b, 0) /
                      values.length
                    ).toFixed(0)
                  : 0;

              default:
                return '';
            }
          });

          const footerRow = sheet.addRow(footerRowData);
          footerRow.font = { bold: true };
          footerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' },
          };
          sheet.addRow([]); // dòng trống giữa nhóm
        }

        // Auto-fit và border
        sheet.columns.forEach((column, index) => {
          const col = columns[index];
          if (col?.width) {
            if (typeof col.width === 'string' && col.width.includes('vh'))
              column.width = parseFloat(col.width.replace('vh', '')) * 2;
            else if (typeof col.width === 'number') column.width = col.width;
            else column.width = parseFloat(col.width) || 15;
          } else {
            column.width = 15;
          }
        });

        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
        });
      } catch (error) {
        console.error(`Lỗi khi export sheet ${type.ProjectTypeName}:`, error);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `price-request-all-tabs-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  DownloadFile() {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const selectedRows = table.getSelectedData();
    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn 1 sản phẩm muốn tải!'
      );
      return;
    }

    selectedRows.forEach((row) => {
      const projectId = row['ProjectID'];
      const partListId = row['ProjectPartListID'];
      const productCode = row['ProductCode'];
      if (!productCode) return;

      const requestPayload = {
        projectId,
        partListId,
        productCode,
      };

      this.PriceRequetsService.downloadFile(requestPayload).subscribe({
        next: (blob: Blob) => {
          // Kiểm tra nếu blob thực ra chứa lỗi dạng JSON thay vì PDF
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const json = JSON.parse(reader.result as string);
              if (json?.status === 0) {
                this.notification.warning(
                  'Thông báo',
                  json.message || 'Không thể tải file!'
                );
                return;
              }
            } catch {
              const fileName = `${productCode}.pdf`;
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
              window.URL.revokeObjectURL(url);
            }
          };
          reader.readAsText(blob);
        },
        error: (error) => {
          const errMsg =
            error?.error?.message || error?.message || 'Đã xảy ra lỗi!';
          this.notification.warning(NOTIFICATION_TITLE.warning, errMsg);
        },
      });
    });
  }
  labels: { [key: number]: string } = {};
  labeln: { [key: number]: string } = {};
  createLables(
    data: any[],
    keyField: string = 'ID',
    valueField: string = 'Code'
  ) {
    this.labeln = {};

    data.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.labeln[item[keyField]]) {
        this.labeln[item[keyField]] = item[valueField];
      }
    });
  }
  createLabelsFromData() {
    this.labels = {};

    this.dtcurrency.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.labels[item.ID]) {
        this.labels[item.ID] = item.Code;
      }
    });
  }
  private GetTableConfig(): any {
    return {
      // data: this.dtprojectPartlistPriceRequest,
      layout: 'fitDataFill',
      height: 700,
      maxheight: '80vh',
      virtualDom: true,
      virtualDomBuffer: 300, // Thêm buffer để giảm lag

      // Cải thiện performance
      renderVertical: 'virtual',
      renderHorizontal: 'virtual',
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        cellClick: function (e: any, cell: any) {
          cell.getRow().toggleSelect();
        },
      },
      ajaxURL: this.PriceRequetsService.getAPIPricerequest(),
      ajaxParams: () => {
        const filters = this.filters;

        // Sửa statusRequest = -1 nếu không muốn lọc, hoặc truyền đúng
        let statusRequest = filters.statusRequest - 1;
        if (statusRequest < 0) statusRequest = 0;

        // Xử lý projectTypeID và isCommercialProduct logic giống như ở backend
        let isCommercialProduct =
          filters.projectTypeID === -1 ? 1 : filters.isCommercialProd;
        let poKHID = filters.projectTypeID >= 0 ? 0 : filters.poKHID;

        // Kiểm tra nếu dateStart và dateEnd là chuỗi thì sử dụng trực tiếp
        // nếu là Date thì chuyển đổi
        const dateStart =
          typeof filters.dateStart === 'string'
            ? filters.dateStart
            : DateTime.fromJSDate(filters.dateStart).toFormat('yyyy/MM/dd');

        const dateEnd =
          typeof filters.dateEnd === 'string'
            ? filters.dateEnd
            : DateTime.fromJSDate(filters.dateEnd).toFormat('yyyy/MM/dd');

        return {
          page: 1,
          size: 25,
        };
      },
      ajaxConfig: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },

      paginationMode: 'remote',
      pagination: true,
      paginationSize: 25,
      paginationvSizeSelector: [10, 25, 50, 100],
      paginationInitialPage: 1,
      ajaxResponse: function (url: string, params: any, response: any) {
        // Xử lý dữ liệu trả về từ API
        return {
          data: response.data.dtData,
          last_page: response.data.totalPages,
        };
      },
      ajaxError: function (xhr: any, textStatus: any, errorThrown: any) {
        console.error('Lỗi AJAX:', textStatus, errorThrown);
        this.notification.error(
          'Thông báo',
          'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
        );
      },
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
            page_size: 'Số dòng:',
          },
        },
      },
      locale: 'vi',
      groupBy: 'ProjectFullName',
      groupHeader: function (value: any, count: number, data: any) {
        return `${value} <span>(${count})</span>`;
      },
      columnDefaults: {
        headerContextMenu: [
          {
            label: 'Xoá sắp xếp',
            action: (e: MouseEvent, column: ColumnComponent) => {
              column.getTable().clearSort();
            },
          },
        ] as MenuObject<ColumnComponent>[],
      },
      rowContextMenu: [
        {
          label: 'Xem chi tiết',
          action: (e: MouseEvent, row: RowComponent) => {
            this.OnEditClick();
          },
        },
        { separator: true },
      ] as MenuObject<RowComponent>[],
      columns: [
        {
          title: 'ID',
          field: 'ID',
          visible: false,
          headerHozAlign: 'center',
          frozen: true,
        },
        {
          title: 'TT',
          field: 'TT',
          headerHozAlign: 'center',
          frozen: true,
          width: 100,
        },
        {
          title: 'Check giá',
          field: 'IsCheckPrice',
          hozAlign: 'center',
          headerSort: false,
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check" style="color:green;"></i>'
              : '<i style="color:red;" class="fa fa-times"></i>';
          },
          frozen: true,
          width: 100,
        },
        // {
        //   title: ' ',
        //   field: 'ProjectFullName',
        //   hozAlign: 'center',
        //   headerSort: false,
        // },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 50,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Hãng',
          field: 'Manufacturer',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 150,
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'ĐVT',
          field: 'UnitCount',
          headerHozAlign: 'center',
          width: 100,
          hozAlign: 'left',
        },
        {
          title: 'Trạng thái',
          field: 'StatusRequestText',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Người yêu cầu',
          field: 'FullName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 150,
        },
        {
          title: 'Sale phụ trách',
          field: 'FullNameSale',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'NV báo giá',
          field: 'QuoteEmployee',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Ngày yêu cầu',
          field: 'DateRequest',
          headerHozAlign: 'center',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          width: 100,
        },
        {
          title: 'Deadline',
          field: 'Deadline',
          headerHozAlign: 'center',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          width: 100,
        },
        {
          title: 'Ngày báo giá',
          field: 'DatePriceQuote',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          headerHozAlign: 'center',
          hozAlign: 'center',
          width: 100,
        },
        // {
        //   title: 'Loại tiền',
        //   field: 'CurrencyID',
        //   editor: 'list',
        //   formatter: (cell: any) => {
        //     const value = cell.getValue();
        //     const match = this.dtcurrency.find((c) => c.ID === value);
        //     return match ? match.Code : '';
        //   },
        //   editorParams: {
        //     values: this.dtcurrency.map((s) => ({
        //       value: s.ID,
        //       label: s.Code,
        //     })),

        //     autocomplete: true,
        //   },
        //   cellEdited: (cell: any) => this.OnCurrencyChanged(cell),
        //   width: '10vw',
        // },
        {
          title: 'Loại tiền',
          field: 'CurrencyID',
          hozAlign: 'left',
          editor: this.createdControl(
            SelectEditorComponent,
            this.injector,
            this.appRef
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();

            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${
              val ? this.labels[val] : 'Chọn loại tiền'
            }</p> <i class="fas fa-angle-down"></i> <div>`;
          },
          cellEdited: (cell: any) => this.OnCurrencyChanged(cell),
          width: 100,
        },
        {
          title: 'Tỷ giá',
          field: 'CurrencyRate',
          headerHozAlign: 'center',
          width: '10vw',
          hozAlign: 'right',
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          headerHozAlign: 'center',
          editor: 'input',
          hozAlign: 'right',
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
        },
        {
          title: 'Giá lịch sử',
          field: 'HistoryPrice',
          headerHozAlign: 'center',
          editor: 'input',
          hozAlign: 'right',
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
          width: 100,
        },
        {
          title: 'Thành tiền chưa VAT',
          field: 'TotalPrice',
          headerHozAlign: 'center',
          hozAlign: 'right',
          width: 100,
          formatterParams: {
            thousand: ',',
            precision: 0,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',

          bottomCalcFormatterParams: {
            thousand: ',',
            precision: 0,
          },
        },
        {
          title: 'Thành tiền quy đổi (VNĐ)',
          field: 'TotalPriceExchange',
          headerHozAlign: 'center',
          hozAlign: 'right',
          width: 100,
        },
        {
          title: '% VAT',
          field: 'VAT',
          headerHozAlign: 'center',
          editor: 'input',
          width: 100,
          hozAlign: 'right',
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
        },
        {
          title: 'Thành tiền có VAT',
          field: 'TotaMoneyVAT',
          headerHozAlign: 'center',
          editor: 'input',
          hozAlign: 'right',
          width: 100,
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
        },
        {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 100,
        },
        // {
        //   title: 'Nhà cung cấp',
        //   field: 'SupplierSaleID',
        //   headerHozAlign: 'center',
        //   editor: 'list',
        //   formatter: (cell: any) => {
        //     const value = cell.getValue();
        //     const match = this.dtSupplierSale.find((s) => s.ID === value);
        //     return match ? match.NameNCC : '';
        //   },
        //   editorParams: {
        //     values: this.dtSupplierSale.map((sup) => ({
        //       value: sup.ID,
        //       label: sup.NameNCC,
        //     })),
        //     autocomplete: true,
        //     width: '10vw',
        //   },
        //   cellEdited: (cell: any) => this.OnSupplierSaleChanged(cell),
        // },
        // {
        //   title: 'Nhà cung cấp',
        //   field: 'SupplierSaleID',
        //   headerHozAlign: 'center',
        //   hozAlign: 'left',
        // editor: this.createdControl1(
        //   NSelectComponent,
        //   this.injector,
        //   this.appRef,
        //   this.dtSupplierSale,
        //   'NameNCC',
        //   'NameNCC',
        //   'ID'
        // ),
        // formatter: (cell:any) => {
        //   const val = cell.getValue();
        //   const supplier = this.dtSupplierSale.find(s => s.ID === val);
        //   return (
        //     `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${supplier ? supplier.NameNCC : 'Chọn nhà cung cấp'}</p> <i class="fas fa-angle-down"></i> <div>`
        //   );
        // },
        //   width:100 ,
        //   cellEdited: (cell: any) => this.OnSupplierSaleChanged(cell),
        // },
        {
          title: 'Nhà cung cấp',
          field: 'SupplierSaleID',
          headerHozAlign: 'center',
          width: 150,
          hozAlign: 'left',
          editor: this.createdControl2(
            NSelectComponent,
            this.injector,
            this.appRef
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            const supplier = this.dtSupplierSale.find((s) => s.ID === val);
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${
              supplier ? supplier.NameNCC : 'Chọn nhà cung cấp'
            }</p> <i class="fas fa-angle-down"></i> <div>`;
          },
          cellEdited: (cell: any) => this.OnSupplierSaleChanged(cell),
        },
        {
          title: 'Lead Time (Ngày làm việc)',
          field: 'TotalDayLeadTime',
          headerHozAlign: 'center',
          hozAlign: 'right',
          bottomCalc: 'sum',
          editor: 'input',
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
        },
        {
          title: 'Ngày dự kiến hàng về',
          field: 'DateExpected',
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },

          width: 100,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          headerHozAlign: 'center',
          width: 100,
          hozAlign: 'left',
        },
        {
          title: 'Ghi chú KT',
          field: 'NotePartlist',
          width: 200,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Model',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Đơn giá xuất xưởng',
          field: 'UnitFactoryExportPrice',
          editor: 'input',
          headerHozAlign: 'center',
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
          width: 100,
          hozAlign: 'right',
        },
        {
          title: 'Đơn giá nhập khẩu',
          field: 'UnitImportPrice',
          headerHozAlign: 'center',
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
          width: 100,
          formatter: function (
            cell: any,
            formatterParams: any,
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            return value;
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          hozAlign: 'right',
        },
        {
          title: 'Thành tiền nhập khẩu',
          field: 'TotalImportPrice',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 100,
          formatter: function (
            cell: any,
            formatterParams: any,
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            return value;
          },
          formatterParams: {
            thousand: ',',
            precision: 0, // không có số lẻ
          },
        },
        {
          title: 'Lead Time',
          field: 'LeadTime',
          hozAlign: 'center',
          width: 100,
          headerHozAlign: 'center',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
        },
        {
          title: 'Lý do xoá',
          field: 'ReasonDeleted',
          hozAlign: 'left',
          width: 100,
          headerHozAlign: 'center',
        },
      ],
    };
  }
}
