
import {
  Component,
  inject,
  OnInit,
  EventEmitter,
  Output,
  Input,
  Injector,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  ViewEncapsulation,
  createComponent,
  TemplateRef,
  ViewChild,
  Optional,
  Inject,
  OnDestroy,
} from '@angular/core';
import { ProjectPartlistPriceRequestService } from '../project-partlist-price-request-service/project-partlist-price-request.service';
import { ProjectPartlistPriceRequestFormComponent } from '../project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ImportExcelProjectPartlistPriceRequestComponent } from '../import-excel-project-partlist-price-request/import-excel-project-partlist-price-request.component';
import { SelectEditorComponent } from './../../SelectEditor/SelectEditor.component';
import { NSelectComponent } from '../../n-select/n-select.component';

// TanStack Table imports
import {
  createAngularTable,
  type ColumnDef,
  type Table,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  FilterFn,
} from '@tanstack/angular-table';
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
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../../services/app-user.service';
import { bottom } from '@popperjs/core';
import { NOTIFICATION_TITLE } from '../../../../app.config';
// Tabulator imports removed - migrated to Angular-SlickGrid
import { TabulatorPopupComponent } from '../../../../shared/components/tabulator-popup/tabulator-popup.component';
import { ColumnDefinition } from 'tabulator-tables';
import { SupplierSaleDetailComponent } from '../../../purchase/supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
@Component({
  selector: 'app-project-partlist-price-request-new',
  templateUrl: './project-partlist-price-request-new.component.html',
   standalone: true,
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
      NgbModalModule,
      ImportExcelProjectPartlistPriceRequestComponent,
      HasPermissionDirective,
      TabulatorPopupComponent
    ],
  styleUrls: ['./project-partlist-price-request-new.component.css']
})
export class ProjectPartlistPriceRequestNewComponent implements OnInit, OnDestroy {
@Output() openModal = new EventEmitter<any>();
  @Input() poKHID: number = 0;
  @Input() jobRequirementID: number = 0;
  @Input() isVPP: boolean = false;
  @Input() projectPartlistPriceRequestTypeID: number = 0
  @Input() initialTabId: number = 0;
  // Active tab tracking
  sizeSearch: string = '0';
  activeTabId = 2;
  dtproject: any[] = [];
  dtPOKH: any[] = [];
  loading = false;
  dtprojectPartlistPriceRequest: any[] = [];
  projectTypes: any[] = [];
  // TanStack Table instances and config
  tables: Map<number, Table<any>> = new Map();
  gridColumns: Map<number, ColumnDef<any>[]> = new Map();
  gridDatasets: Map<number, any[]> = new Map();
  sorting: Map<number, SortingState> = new Map();
  columnFilters: Map<number, ColumnFiltersState> = new Map();
  selectedRows: Map<number, Set<number>> = new Map();
  // Track filter operators: typeId -> columnId -> operator
  filterOperators: Map<number, Map<string, string>> = new Map();
  // Track edited rows by typeId -> Set of row IDs
  editedRows: Map<number, Set<number>> = new Map();
  modalData: any[] = [];
  dtcurrency: any[] = [];
  showDetailModal = false;
  // Filters - khởi tạo giá trị mặc định
  filters: any = {
    dateStart: DateTime.local().startOf('month').toJSDate(),
    dateEnd: DateTime.local().toJSDate(),
    statusRequest: 1,
    projectId: 0,
    keyword: '',
    isDeleted: 0,
    projectTypeID: 0,
    poKHID: 0,
    isCommercialProduct: -1,
    isJobRequirement: -1,
  };
  dtSupplierSale: any[] = [];
  dtProductSale: any[] = [];
  PriceRequetsService = inject(ProjectPartlistPriceRequestService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  appUserService = inject(AppUserService);
  private ngbModal = inject(NgbModal);

  showSupplierPopup: boolean = false;
  currentEditingCell: any = null;
  currentSuccess?: (value: any) => void;
  currentCancel?: () => void;
  supplierPopupPosition: { top: string; left: string } = { top: '0px', left: '0px' };
  supplierColumns: any[] = [
    { title: 'Mã', field: 'Code', width: 120, headerSort: false },
    { title: 'Tên nhà cung cấp', field: 'NameNCC', width: 200, headerSort: false },
  ];
  supplierSearchFields: string[] = ['Code', 'NameNCC'];

  @ViewChild('rejectReasonTpl', { static: false }) rejectReasonTpl!: TemplateRef<any>;
  rejectReason: string = '';
  lastSelectedRowsForReject: any[] = [];

  @ViewChild('requestBuyTpl', { static: false }) requestBuyTpl!: TemplateRef<any>;

  requestBuyDeadline: Date | null = null;
  requestBuyIsVPP: boolean = false;
  requestBuyJobRequirementID: number = 0;
  lastSelectedRowsForBuy: any[] = [];

  constructor(
    @Optional() @Inject('tabData') private tabData: any
  ) {
    // Khi mở từ new tab, data được truyền qua injector
    if (this.tabData) {
      // Nếu có initialTabId trong tabData, set activeTabId trực tiếp
      if (this.tabData.initialTabId !== null && this.tabData.initialTabId !== undefined) {
        this.activeTabId = this.tabData.initialTabId;
      }
      // Nếu có projectPartlistPriceRequestTypeID trong tabData, set và map sang activeTabId
      if (this.tabData.projectPartlistPriceRequestTypeID !== null && this.tabData.projectPartlistPriceRequestTypeID !== undefined) {
        this.projectPartlistPriceRequestTypeID = this.tabData.projectPartlistPriceRequestTypeID;
        if (this.projectPartlistPriceRequestTypeID === 3) {
          this.activeTabId = -2; // HCNS tab
        } else if (this.projectPartlistPriceRequestTypeID === 4) {
          this.activeTabId = -3; // Tab tương ứng với type 4
        }
      }
      // Nếu có isVPP trong tabData, set nó
      if (this.tabData.isVPP !== undefined) {
        this.isVPP = this.tabData.isVPP;
      }
    }
  }

  ngOnInit() {
    // Nếu có projectPartlistPriceRequestTypeID được truyền vào, set activeTabId tương ứng
    if (this.projectPartlistPriceRequestTypeID === 3) {
      this.activeTabId = -2; // HCNS tab
    } else if (this.projectPartlistPriceRequestTypeID === 4) {
      this.activeTabId = -3; // Tab tương ứng với type 4
    }

    // Cập nhật projectTypeID trong filters (filters đã được khởi tạo khi khai báo)
    this.filters.projectTypeID = this.activeTabId;
    
    console.log('Filters initialized:', this.filters);

    this.GetCurrency();
    this.GetSupplierSale();
    this.GetProductSale();//NXL Update 29/11/25
    this.LoadProjectTypes();
    this.GetallProject();
    this.GetAllPOKH();
  }

  get restrictedView(): boolean {
     return (this.jobRequirementID > 0) || this.isVPP || this.projectPartlistPriceRequestTypeID === 4;
    }
  get isHRDept(): boolean { const d = this.appUserService.departmentID ?? 0; return d === 4 && !this.appUserService.isAdmin; }
  shouldShowProjectType(id: number): boolean { if (this.poKHID > 0 && id !== -1) return false;
     if (this.projectPartlistPriceRequestTypeID === 3) return id === -2;
     if (this.projectPartlistPriceRequestTypeID === 4) return id === -3;
     return true; }
  getVisibleProjectTypes(): any[] {
     return (this.projectTypes || []).filter((t: any) => this.shouldShowProjectType(t.ProjectTypeID));
    }

  OnFormSubmit(): void {
    this.LoadPriceRequests();
    this.showDetailModal = false;
  }
  OnAddClick() {
    this.modalData = [];

    // Map projectTypeID (activeTabId) sang projectPartlistPriceRequestTypeID
    const projectPartlistPriceRequestTypeID = this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

    const modalRef = this.ngbModal.open(ProjectPartlistPriceRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID = projectPartlistPriceRequestTypeID;

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.OnFormSubmit();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  // Map projectTypeID sang projectPartlistPriceRequestTypeID theo logic WinForm
  private getProjectPartlistPriceRequestTypeID(projectTypeID: number): number {//NXL Update 29/11/25
    const mapping: { [key: number]: number } = {
      0: 5,
      '-1': 2,
      '-2': 3,
      '-3': 4
    };

    const key = String(projectTypeID);
    if (mapping.hasOwnProperty(key)) {
      return mapping[key as any];
    }

    // Nếu projectTypeID > 0 thì trả về 1
    return projectTypeID > 0 ? 1 : 0;
  }

  OnEditClick() {
    const lstTypeAccept = [-1, -2];

    if (!lstTypeAccept.includes(this.activeTabId)) {
      this.notification.info(
        'Thông báo',
        'Chỉ được sửa những sản phẩm thương mại hoặc của HCNS!'
      );
      return;
    }

    const selectedRows = this.getSelectedData();

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

    // Gán STT và map các field cần thiết cho từng dòng được chọn
    const processedRows = selectedRows.map((row, index) => {
      // Tìm ProductNewCode từ ProductCode trong danh sách sản phẩm
      let productNewCode = row.ProductNewCode;
      if (!productNewCode && row.ProductCode) {
        const product = this.dtProductSale.find(
          (p: any) => p.ProductCode === row.ProductCode
        );
        productNewCode = product ? product.ProductNewCode : null;
      }

      return {
        ...row,
        STT: index + 1,
        ProductNewCode: productNewCode || row.ProductNewCode || null,
        Maker: row.Maker || row.Manufacturer || '',
        Unit: row.Unit || row.UnitCount || '',
        ProjectPartlistPriceRequestTypeID: row.ProjectPartlistPriceRequestTypeID ?? null,
      };
    });

    const modalRef = this.ngbModal.open(ProjectPartlistPriceRequestFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = processedRows;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID = this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.OnFormSubmit();
        }
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }

  private GetProductSale() {//NXL Update 29/11/25
    this.PriceRequetsService.getProductSale().subscribe((response) => {
      this.dtProductSale = response.data || [];
      console.log('ProductSale:', this.dtProductSale);
    });
  }
  OnDeleteClick() {
    const selectedRows = this.getSelectedRows();

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
    const employeeID = this.appUserService.employeeID ?? 0;
    let projectTypeIdHR = 0;
    if(this.jobRequirementID > 0 || this.isVPP) projectTypeIdHR=-2
    this.PriceRequetsService.getTypes(employeeID, projectTypeIdHR).subscribe((response) => {
      this.projectTypes = response.data.dtType;
      setTimeout(() => {
        let delay = 0;
        this.projectTypes.forEach((type, index) => {
          setTimeout(() => {
            this.CreateTableForType(type.ProjectTypeID);

            // Sau khi tạo xong table cuối cùng, load dữ liệu cho tất cả các tab
            if (index === this.projectTypes.length - 1) {
              setTimeout(() => {
                this.LoadAllTablesData();
                // Nếu có initialTabId từ tabData, chọn tab đó sau khi load xong
                if (this.tabData && this.tabData.initialTabId !== null && this.tabData.initialTabId !== undefined) {
                  setTimeout(() => {
                    this.SelectProjectType(this.tabData.initialTabId);
                  }, 300);
                }
                // Nếu có projectPartlistPriceRequestTypeID, chọn tab tương ứng sau khi load xong
                else if (this.projectPartlistPriceRequestTypeID === 3) {
                  setTimeout(() => {
                    this.SelectProjectType(-2); // HCNS tab
                  }, 300);
                } else if (this.projectPartlistPriceRequestTypeID === 4) {
                  setTimeout(() => {
                    this.SelectProjectType(-3); // Tab tương ứng với type 4
                  }, 300);
                }
              }, 500); // Chờ table cuối cùng được tạo xong
            }
          }, delay);
          delay += 300; // Chờ 300ms giữa mỗi table creation
        });
      }, 100);
    });
  }

  private LoadAllTablesData(): void {
    // Gọi API cho TỪNG tab (vì API mới có phân trang và chỉ trả về 1 tab/query)
    // Load dữ liệu cho các tabs đã được tạo
    this.tables.forEach((table, typeId) => {
      this.LoadGridDataForType(typeId);
    });
  }

  // Load data cho 1 tab cụ thể với phân trang
  private LoadGridDataForType(typeId: number, page: number = 1, pageSize: number = 1000): void {
    const dateStart =
      typeof this.filters.dateStart === 'string'
        ? this.filters.dateStart
        : DateTime.fromJSDate(this.filters.dateStart).toFormat('yyyy/MM/dd');

    const dateEnd =
      typeof this.filters.dateEnd === 'string'
        ? this.filters.dateEnd
        : DateTime.fromJSDate(this.filters.dateEnd).toFormat('yyyy/MM/dd');

    // Xác định parameters dựa trên typeId
    let projectTypeID = typeId;
    let isCommercialProduct = -1;
    let poKHID = this.filters.poKHID;
    let isJobRequirement = -1;
    let projectPartlistPriceRequestTypeID = -1;

    // Áp dụng logic giống backend
    if (typeId === -1) {
      projectTypeID = -1;
      isCommercialProduct = 1;
      poKHID = 0;
    } else if (typeId === -2) {
      projectTypeID = -1;
      isJobRequirement = 1;
      isCommercialProduct = -1;
    } else if (typeId === -3) {
      projectPartlistPriceRequestTypeID = 4;
      isCommercialProduct = 0;
    } else if (typeId === 0) {
      isCommercialProduct = 0;
      isJobRequirement = 0;
    }

    poKHID = 0;

    if (this.jobRequirementID > 0 || this.isVPP) {
      isJobRequirement = 1;
    }

    this.PriceRequetsService.getAllPartlist(
      dateStart,
      dateEnd,
      this.filters.statusRequest,
      this.filters.projectId,
      this.filters.keyword,
      this.filters.isDeleted,
      projectTypeID,
      poKHID,
      isCommercialProduct,
      isJobRequirement,
      projectPartlistPriceRequestTypeID,
      0, // employeeID
      page,
      pageSize
    ).subscribe({
      next: (response: any) => {
        const data = response.data?.dtData || [];
        const totalPages = response.data?.totalPages || 1;
        
        // Cập nhật dataset cho tab này
        this.gridDatasets.set(typeId, data);
        
        // Recreate table instance with new data
        if (this.tables.has(typeId)) {
          this.createTableInstance(typeId);
        }
        
        console.log(`Loaded data for tab ${typeId}:`, data.length, 'rows, totalPages:', totalPages);
      },
      error: (error: any) => {
        console.error(`Error loading data for tab ${typeId}:`, error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu');
      },
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
    // Gọi API 1 lần để load tất cả tabs
    this.LoadAllTablesData();
  }

  public ApplyFilters(): void {
    console.log(this.filters.poKHID);
    // Reload tất cả các table đã được tạo
    this.LoadAllTablesData();
  }

  public ResetFilters(): void {
    this.filters = {
      dateStart: DateTime.local().startOf('month').toJSDate(), // Ngày đầu tháng hiện tại
      dateEnd: DateTime.local().toJSDate(), // Ngày hiện tại
      statusRequest: 1,
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: 0,
      isCommercialProd: -1,
    };

    // Reload tất cả các table
    this.LoadAllTablesData();
  }

  public SelectProjectType(typeId: number): void {
    this.activeTabId = typeId;
    this.filters.projectTypeID = typeId;

    // Kiểm tra nếu bảng chưa được tạo
    if (!this.tables.has(typeId)) {
      this.CreateTableForType(typeId);
    } else {
      // Nếu tab đã tồn tại, kiểm tra xem có data chưa
      const currentData = this.gridDatasets.get(typeId) || [];
      if (currentData.length === 0) {
        // Chưa có data, load lại
        this.LoadGridDataForType(typeId);
      }
    }
  }

  private CreateTableForType(typeId: number): void {
    // Initialize columns and dataset for this type
    this.gridColumns.set(typeId, this.GetColumnsForType(typeId));
    
    // Khởi tạo dataset rỗng
    if (!this.gridDatasets.has(typeId)) {
    this.gridDatasets.set(typeId, []);
    }
    
    this.sorting.set(typeId, []);
    this.columnFilters.set(typeId, []);
    this.selectedRows.set(typeId, new Set());

    // Create TanStack Table instance
    this.createTableInstance(typeId);
    
    // Load data cho tab này
    setTimeout(() => {
      this.LoadGridDataForType(typeId);
    }, 100);
  }

  // Create TanStack Table instance for a type
  private createTableInstance(typeId: number): void {
    const component = this;
    const table = createAngularTable(() => ({
      data: component.gridDatasets.get(typeId) || [],
      columns: component.gridColumns.get(typeId) || [],
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      state: {
        sorting: component.sorting.get(typeId) || [],
        columnFilters: component.columnFilters.get(typeId) || [],
      },
      onSortingChange: (updater) => {
        const current = component.sorting.get(typeId) || [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        component.sorting.set(typeId, next);
      },
      onColumnFiltersChange: (updater) => {
        const current = component.columnFilters.get(typeId) || [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        component.columnFilters.set(typeId, next);
      },
    }));
    
    this.tables.set(typeId, table);
  }

  // Helper methods for table data management
  private getSelectedRows(typeId: number = this.activeTabId): any[] {
    const dataset = this.gridDatasets.get(typeId) || [];
    const selected = this.selectedRows.get(typeId) || new Set();
    return dataset.filter(row => selected.has(row.ID));
  }

  private getSelectedData(typeId: number = this.activeTabId): any[] {
    return this.getSelectedRows(typeId);
  }

  private getEditedCells(typeId: number = this.activeTabId): any[] {
    // Return edited rows based on editedRows tracking
    const dataset = this.gridDatasets.get(typeId) || [];
    const edited = this.editedRows.get(typeId) || new Set();
    return dataset.filter(row => edited.has(row.ID));
  }

  private getAllData(typeId: number = this.activeTabId): any[] {
    return this.gridDatasets.get(typeId) || [];
  }

  private updateRow(typeId: number, rowId: any, data: any): void {
    const dataset = this.gridDatasets.get(typeId) || [];
    const rowIndex = dataset.findIndex(row => row.ID === rowId);
    if (rowIndex !== -1) {
      dataset[rowIndex] = { ...dataset[rowIndex], ...data };
      this.gridDatasets.set(typeId, [...dataset]); // Trigger change detection
    }
  }

  // Toggle row selection
  toggleRowSelection(typeId: number, rowId: number): void {
    const selected = this.selectedRows.get(typeId) || new Set();
    if (selected.has(rowId)) {
      selected.delete(rowId);
    } else {
      selected.add(rowId);
    }
    this.selectedRows.set(typeId, selected);
  }

  // Toggle all rows selection
  toggleAllRowsSelection(typeId: number): void {
    const dataset = this.gridDatasets.get(typeId) || [];
    const selected = this.selectedRows.get(typeId) || new Set();
    
    if (selected.size === dataset.length) {
      // Deselect all
      selected.clear();
    } else {
      // Select all
      dataset.forEach(row => selected.add(row.ID));
    }
    this.selectedRows.set(typeId, selected);
  }

  // Check if row is selected
  isRowSelected(typeId: number, rowId: number): boolean {
    const selected = this.selectedRows.get(typeId) || new Set();
    return selected.has(rowId);
  }

  // Check if all rows are selected
  areAllRowsSelected(typeId: number): boolean {
    const dataset = this.gridDatasets.get(typeId) || [];
    const selected = this.selectedRows.get(typeId) || new Set();
    return dataset.length > 0 && selected.size === dataset.length;
  }

  // Get cell value by calling the cell function
  getCellValue(cell: any): any {
    const cellDef = cell.column.columnDef.cell;
    if (typeof cellDef === 'function') {
      return cellDef(cell.getContext());
    }
    return cell.getValue();
  }

  // Helper để get filter input value từ filter object
  getFilterInputValue(filterValue: any): string {
    if (!filterValue) return '';
    if (typeof filterValue === 'string') return filterValue;
    if (filterValue.value) return filterValue.value;
    return '';
  }

  // Update filter value với operator
  updateFilterValue(typeId: number, header: any, operator: string, value: string): void {
    if (!value || value.trim() === '') {
      header.column.setFilterValue(undefined);
      return;
    }
    
    header.column.setFilterValue({
      operator: operator,
      value: value.trim()
    });
  }

  // Load data for specific grid
  private LoadGridData(typeId: number): void {
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
    let isJobRequirement = -1;
    let projectPartlistPriceRequestTypeID = -1;
    let employeeID = 0;

    // Áp dụng logic giống WinForm
    if (typeId === -1) {
      projectTypeID = -1;
      isCommercialProduct = 1;
      poKHID = 0;
    } else if (typeId === -2) {
      projectTypeID = -1;
      isJobRequirement = 1;
      isCommercialProduct = -1;
    } else if (typeId === -3) {
      projectPartlistPriceRequestTypeID = 4;
      isCommercialProduct = 0;
    } else if (typeId === 0) {
      isCommercialProduct = 0;
      isJobRequirement = 0;
    }

    poKHID = 0;

    if (this.jobRequirementID > 0 || this.isVPP) {
      isJobRequirement = 1;
    }

    this.PriceRequetsService.getAllPriceRequests(
      dateStart,
      dateEnd,
      this.filters.statusRequest - 1,
      this.filters.projectId,
      this.filters.keyword || '',
      this.filters.isDeleted,
      projectTypeID,
      poKHID,
      isCommercialProduct,
      isJobRequirement,
      projectPartlistPriceRequestTypeID
    ).subscribe({
      next: (response: any) => {
        const data = response.data?.dtData || [];
        this.gridDatasets.set(typeId, data);

        // Recreate table instance with new data
        this.createTableInstance(typeId);
      },
      error: (error: any) => {
        console.error('Error loading grid data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu');
      },
    });
  }

  // Custom filter function với support cho nhiều operators
  private getFilterFunction(typeId: number): FilterFn<any> {
    return (row, columnId, filterValue) => {
      if (!filterValue || !filterValue.value) return true;
      
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      
      const operator = filterValue.operator || 'contains';
      const searchValue = String(filterValue.value).toLowerCase();
      const cellValue = String(value).toLowerCase();
      
      switch (operator) {
        case 'equals':
          return cellValue === searchValue;
        case 'notEquals':
          return cellValue !== searchValue;
        case 'contains':
          return cellValue.includes(searchValue);
        case 'notContains':
          return !cellValue.includes(searchValue);
        case 'startsWith':
          return cellValue.startsWith(searchValue);
        case 'endsWith':
          return cellValue.endsWith(searchValue);
        default:
          return cellValue.includes(searchValue);
      }
    };
  }

  // Helper để get/set filter operator
  getFilterOperator(typeId: number, columnId: string): string {
    if (!this.filterOperators.has(typeId)) {
      this.filterOperators.set(typeId, new Map());
    }
    const operator = this.filterOperators.get(typeId)?.get(columnId);
    if (!operator) {
      // Set mặc định là 'contains' nếu chưa có
      this.filterOperators.get(typeId)!.set(columnId, 'contains');
      return 'contains';
    }
    return operator;
  }

  setFilterOperator(typeId: number, columnId: string, operator: string): void {
    if (!this.filterOperators.has(typeId)) {
      this.filterOperators.set(typeId, new Map());
    }
    this.filterOperators.get(typeId)!.set(columnId, operator);
  }

  // Get columns configuration for SlickGrid
  private GetColumnsForType(typeId: number): ColumnDef<any>[] {
    const columns: ColumnDef<any>[] = [
      {
        id: 'select',
        header: () => '', // Checkbox column for selection
        cell: ({ row }) => row.original,
        size: 50,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'ID',
        id: 'ID',
        header: 'ID',
        size: 0,
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'IsCheckPrice',
        id: 'IsCheckPrice',
        header: 'Check giá',
        size: 100,
        enableColumnFilter: false,
        cell: ({ getValue }) => {
          const value = getValue();
          const checked = value === true || value === 'true' || value === 1 || value === '1';
          return checked;
        },
      },
      {
        accessorKey: 'TT',
        id: 'TT',
        header: 'TT',
        size: 70,
      },
      {
        accessorKey: 'ProjectCode',
        id: 'ProjectCode',
        header: 'Mã dự án',
        size: 150,
      },
      {
        accessorKey: 'ProductCode',
        id: 'ProductCode',
        header: 'Mã sản phẩm',
        size: 150,
      },
      {
        accessorKey: 'ProductName',
        id: 'ProductName',
        header: 'Tên sản phẩm',
        size: 200,
      },
      {
        accessorKey: 'Manufacturer',
        id: 'Manufacturer',
        header: 'Hãng',
        size: 100,
        cell: ({ getValue, row }) => getValue(),
      },
      {
        accessorKey: 'Quantity',
        id: 'Quantity',
        header: 'Số lượng',
        size: 100,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'UnitCount',
        id: 'UnitCount',
        header: 'ĐVT',
        size: 100,
      },
      {
        accessorKey: 'StatusRequestText',
        id: 'StatusRequestText',
        header: 'Trạng thái',
        size: 150,
      },
      {
        accessorKey: 'FullName',
        id: 'FullName',
        header: 'Người yêu cầu',
        size: 150,
      },
      {
        accessorKey: 'FullNameSale',
        id: 'FullNameSale',
        header: 'Sale phụ trách',
        size: 150,
      },
      {
        accessorKey: 'QuoteEmployee',
        id: 'QuoteEmployee',
        header: 'NV báo giá',
        size: 150,
      },
      {
        accessorKey: 'DateRequest',
        id: 'DateRequest',
        header: 'Ngày yêu cầu',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return '';
          const dateTime = DateTime.fromISO(value as string);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        accessorKey: 'Deadline',
        id: 'Deadline',
        header: 'Deadline',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return '';
          const dateTime = DateTime.fromISO(value as string);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        accessorKey: 'DatePriceQuote',
        id: 'DatePriceQuote',
        header: 'Ngày báo giá',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return '';
          const dateTime = DateTime.fromISO(value as string);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        accessorKey: 'CurrencyID',
        id: 'CurrencyID',
        header: 'Loại tiền',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value || !this.labels) return 'Chọn loại tiền';
          return this.labels[value as number] || 'Chọn loại tiền';
        },
      },
      {
        accessorKey: 'CurrencyRate',
        id: 'CurrencyRate',
        header: 'Tỷ giá',
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'UnitPrice',
        id: 'UnitPrice',
        header: 'Đơn giá',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'HistoryPrice',
        id: 'HistoryPrice',
        header: 'Giá lịch sử',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'TotalPrice',
        id: 'TotalPrice',
        header: 'Thành tiền chưa VAT',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'TotalPriceExchange',
        id: 'TotalPriceExchange',
        header: 'Thành tiền quy đổi (VNĐ)',
        size: 180,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'VAT',
        id: 'VAT',
        header: '% VAT',
        size: 100,
        cell: ({ getValue }) => getValue(),
      },
      {
        accessorKey: 'TotaMoneyVAT',
        id: 'TotaMoneyVAT',
        header: 'Thành tiền có VAT',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'CodeNCC',
        id: 'CodeNCC',
        header: 'Mã NCC',
        size: 100,
      },
      {
        accessorKey: 'SupplierSaleID',
        id: 'SupplierSaleID',
        header: 'Nhà cung cấp',
        size: 200,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return 'Chọn nhà cung cấp';
          const supplier = this.dtSupplierSale.find(s => s.ID === value);
          return supplier ? supplier.NameNCC : 'Chọn nhà cung cấp';
        },
      },
      {
        accessorKey: 'TotalDayLeadTime',
        id: 'TotalDayLeadTime',
        header: 'Lead Time (Ngày làm việc)',
        size: 180,
      },
      {
        accessorKey: 'DateExpected',
        id: 'DateExpected',
        header: 'Ngày dự kiến hàng về',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return '';
          const dateTime = DateTime.fromISO(value as string);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        accessorKey: 'Note',
        id: 'Note',
        header: 'Ghi chú Pur',
        size: 200,
      },
      {
        accessorKey: 'NotePartlist',
        id: 'NotePartlist',
        header: 'Ghi chú (Người Y/C)',
        size: 200,
      },
      {
        accessorKey: 'Model',
        id: 'Model',
        header: 'Thông số kỹ thuật',
        size: 150,
      },
      {
        accessorKey: 'SpecialCode',
        id: 'SpecialCode',
        header: 'Mã đặc biệt',
        size: 120,
      },
      {
        accessorKey: 'IsImport',
        id: 'IsImport',
        header: 'Hàng nhập khẩu',
        size: 120,
      },
      {
        accessorKey: 'UnitFactoryExportPrice',
        id: 'UnitFactoryExportPrice',
        header: 'Đơn giá xuất xưởng',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'UnitImportPrice',
        id: 'UnitImportPrice',
        header: 'Đơn giá nhập khẩu',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'TotalImportPrice',
        id: 'TotalImportPrice',
        header: 'Thành tiền nhập khẩu',
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : '';
        },
      },
      {
        accessorKey: 'LeadTime',
        id: 'LeadTime',
        header: 'Lead Time',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return '';
          const dateTime = DateTime.fromISO(value as string);
          return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        accessorKey: 'ReasonDeleted',
        id: 'ReasonDeleted',
        header: 'Lý do xoá',
        size: 150,
      },
    ];

    // Apply filter function to all columns with accessorKey (except disabled ones)
    const filterFn = this.getFilterFunction(typeId);
    columns.forEach((col: any) => {
      if (col.accessorKey && col.enableColumnFilter !== false && col.id !== 'select' && col.id !== 'ID' && col.id !== 'IsCheckPrice') {
        col.filterFn = filterFn;
      }
    });

    return columns;
  }

  // Removed GetGridOptionsForType - no longer needed with TanStack Table

  // Track cell changes - called when data is edited
  onCellChanged(typeId: number, item: any, fieldName: string): void {
    if (!item || !item.ID) return;

    const rowId = item.ID;

    // Initialize Set if not exists
    if (!this.editedRows.has(typeId)) {
      this.editedRows.set(typeId, new Set());
    }

    // Add row to edited set
    this.editedRows.get(typeId)!.add(rowId);

    // Recalculate values if needed
    if (['UnitPrice', 'Quantity', 'VAT', 'UnitImportPrice', 'TotalDayLeadTime'].includes(fieldName)) {
      this.UpdateValue(item);

      // Update the row in dataset
      this.updateRow(typeId, rowId, item);
    }
  }

  private UpdateActiveTable(): void {
    const tableId = this.activeTabId;
    if (!this.tables.has(tableId)) {
      this.CreateTableForType(tableId);
    }
    // Không cần load data vì đã có sẵn từ LoadAllTablesData()
  }
  CalculateTotalPriceExchange(rowData: any, currencyRate: number): number {
    const totalMoney = Number(rowData.TotalPrice) || 0;
    return totalMoney * currencyRate;
  }
  // GetDataChanged() method removed - no longer needed with SlickGrid
  // Data changes are tracked automatically via onCellChanged() method
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
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

    // Get edited rows from tracking
    const editedRowIds = this.editedRows.get(this.activeTabId);

    if (!editedRowIds || editedRowIds.size === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    // Get all data and filter by edited IDs
    const allData = this.getAllData();
    const changedData = allData.filter(row => editedRowIds.has(row.ID));

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
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

    // Map trạng thái
    const STATUS_TEXT: { [key: number]: string } = {
      0: 'Hủy hoàn thành',
      1: 'Hủy báo giá',
      2: 'Báo giá',
      3: 'Hoàn thành',
    };

    const statusText = STATUS_TEXT[status] || '';
    const selectedRows = this.getSelectedRows();

    // Validate chọn dòng
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${statusText}!`
      );
      return;
    }

    // Validate dữ liệu trước (chỉ validate những dòng của mình hoặc admin)
    const shouldValidate = ![1, 3].includes(status); // Chỉ validate khi Báo giá (2) hoặc Hủy hoàn thành (0)

    for (const row of selectedRows) {
      const rowData = row.getData();
      const id = Number(rowData['ID']);
      if (id <= 0) continue;

      // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      const currentEmployeeID = this.appUserService.employeeID || 0;
      const isAdmin = this.appUserService.isAdmin || false;

      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình
      }

      // Validate cho các trường hợp cần kiểm tra
      if (shouldValidate) {
        const productCode = rowData['ProductCode'] || '';
        const currencyId = Number(rowData['CurrencyID']);
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
            `Tỷ giá của loại tiền phải > 0.\nVui lòng kiểm tra lại mã sản phẩm [${productCode}]!`
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
    }

    // Xử lý dữ liệu update (chỉ update những dòng của mình hoặc admin)
    const updateData: any[] = [];
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;

    for (const row of selectedRows) {
      const rowData = row.getData();
      const id = Number(rowData['ID']);

      if (id <= 0) continue;

      // Lọc theo QuoteEmployeeID (chỉ update những sản phẩm của mình hoặc admin)
      const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
        continue; // Bỏ qua sản phẩm không phải của mình
      }

      // Cập nhật dữ liệu
      Object.assign(rowData, {
        StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: new Date(),
        QuoteEmployeeID: !isAdmin ? currentEmployeeID : rowData['QuoteEmployeeID'],
        DatePriceQuote:
          status === 2
            ? new Date()
            : status === 1
              ? null
              : rowData['DatePriceQuote'],
      });

      updateData.push(rowData);
    }

    // Kiểm tra nếu không có dòng nào hợp lệ
    if (updateData.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có sản phẩm nào hợp lệ để cập nhật!'
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
        this.SaveDataCommon(updateData, `${statusText} thành công`);
      },
    });
  }

  // Cập nhật phương thức CheckPrice để sử dụng hàm chung
  CheckPrice(isCheckPrice: boolean): void {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

    const isCheckText = isCheckPrice ? 'Check giá' : 'Huỷ check giá';
    const selectedRows = this.getSelectedRows();

    if (selectedRows.length <= 0) {
      this.notification.info(
        'Thông báo',
        `Vui lòng chọn sản phẩm muốn ${isCheckText}!`
      );
      return;
    }

    // Message xác nhận với thông báo đặc biệt khi check giá
    const message = isCheckPrice ? '\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!' : '';

    // Xác nhận thao tác
    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: `Bạn có chắc muốn ${isCheckText} danh sách sản phẩm đã chọn không?${message}`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Lọc các dòng hợp lệ ở frontend (validate trước khi gửi lên backend)
        const updateData: any[] = [];

        selectedRows.forEach((row) => {
          const rowData = row.getData();
          const id = Number(rowData['ID']);

          if (id <= 0) return; // Bỏ qua ID không hợp lệ

          // Validate ở frontend: Khi check giá, chỉ cho phép check nếu chưa có QuoteEmployeeID hoặc QuoteEmployeeID là của mình
          if (isCheckPrice) {
            const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
            const currentEmployeeID = this.appUserService.employeeID || 0;

            // Nếu đã có người khác check rồi thì bỏ qua (giống WinForm và backend logic)
            if (quoteEmployeeID > 0 && quoteEmployeeID !== currentEmployeeID) {
              return;
            }
          }

          // Thêm vào danh sách update (gửi đúng format cho backend)
          updateData.push({
            ID: id,
            IsCheckPrice: isCheckPrice,
            QuoteEmployeeID: Number(rowData['QuoteEmployeeID'] || 0), // Giữ nguyên QuoteEmployeeID hiện tại
            EmployeeID: this.appUserService.employeeID, // Backend dùng field này để set QuoteEmployeeID mới
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toJSDate(),
          });
        });

        // Kiểm tra nếu không có dòng nào hợp lệ sau khi validate
        if (updateData.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Không có sản phẩm nào hợp lệ để cập nhật!'
          );
          return;
        }

        // Gọi API check-price (backend sẽ validate thêm một lần nữa)
        this.PriceRequetsService.checkPrice(updateData).subscribe({
          next: (response) => {
            if (response.success) {
              this.notification.success('Thông báo', `${isCheckText} thành công!`);
              this.LoadPriceRequests(); // Reload data
            } else {
              this.notification.error('Lỗi', response.message || `${isCheckText} thất bại!`);
            }
          },
          error: (error) => {
            console.error('Error checking price:', error);
            this.notification.error('Lỗi', error?.error?.message || `Có lỗi xảy ra khi ${isCheckText}!`);
          },
        });
      },
    });
  }

  RejectPriceRequest(status: number = 3): void {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn sản phẩm muốn từ chối!');
      return;
    }

    const invalids: string[] = [];
    selectedRows.forEach((row) => {
      const data = row.getData();
      const cur = Number(data['StatusRequest'] || 0);
      if (cur === 3 || cur === 5) invalids.push(`[${data['ProductCode']}] đã bị từ chối trước đó`);
      if (cur === 2) invalids.push(`[${data['ProductCode']}] đã ở trạng thái Đã báo giá, không thể từ chối`);
    });
    if (invalids.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, invalids[0]);
      return;
    }

    this.lastSelectedRowsForReject = selectedRows.map(r => r.getData());
    this.rejectReason = '';

    this.modal.create({
      nzTitle: 'Từ chối báo giá',
      nzContent: this.rejectReasonTpl,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const reason = (this.rejectReason || '').trim();
        if (!reason) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do từ chối!');
          return false;
        }
        this.performUpdateRejectStatus(status, reason);
        return true;
      }
    });
  }

  CancelRejectPriceRequest(): void {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn sản phẩm muốn hủy từ chối!');
      return;
    }
    const invalids: string[] = [];
    const listModel = selectedRows.map(row => {
      const data = row.getData();
      const cur = Number(data['StatusRequest'] || 0);
      if (cur !== 3 && cur !== 5) invalids.push(`[${data['ProductCode']}] chưa bị từ chối`);
      return {
        ID: Number(data['ID']),
        StatusRequest: 1,
        UpdatedBy: this.appUserService.loginName,
        EmployeeIDUnPrice: this.appUserService.employeeID,
        ReasonUnPrice: ''
      };
    }).filter(x => x.ID > 0);

    if (invalids.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, invalids[0]);
      return;
    }

    this.modal.confirm({
      nzTitle: 'Thông báo',
      nzContent: 'Bạn có chắc muốn Hủy từ chối danh sách sản phẩm đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = { ListModel: listModel, ListDataMail: [] };
        this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', res?.message || 'Hủy từ chối thành công');
              this.LoadPriceRequests();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Có lỗi xảy ra');
            }
          },
          error: (err: any) => {
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
          }
        });
      }
    });
  }

  private performUpdateRejectStatus(status: number, reason: string): void {
    const listModel = (this.lastSelectedRowsForReject || []).map((data: any) => ({
      ID: Number(data['ID']),
      StatusRequest: status,
      UpdatedBy: this.appUserService.loginName,
      EmployeeIDUnPrice: this.appUserService.employeeID,
      ReasonUnPrice: reason,
    })).filter(x => x.ID > 0);

    const listDataMail = (this.lastSelectedRowsForReject || []).map((data: any) => ({
      EmployeeID: Number(data['EmployeeID'] || 0),
      ProjectCode: String(data['ProjectCode'] || '').trim(),
      ProductCode: String(data['ProductCode'] || '').trim(),
      ProductName: String(data['ProductName'] || '').trim(),
      Manufacturer: String(data['Manufacturer'] || data['Maker'] || '').trim(),
      UnitCount: String(data['Unit'] || data['UnitName'] || data['UnitCount'] || '').trim(),
      Quantity: Number(data['Quantity'] || 0),
      DateRequest: (() => {
        const v = data['DateRequest'];
        if (!v) return '';
        const d = typeof v === 'string' ? DateTime.fromISO(v) : DateTime.fromJSDate(new Date(v));
        return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
      })(),
      Deadline: (() => {
        const v = data['Deadline'];
        if (!v) return '';
        const d = typeof v === 'string' ? DateTime.fromISO(v) : DateTime.fromJSDate(new Date(v));
        return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
      })(),
    })).filter((x: any) => x.ProductCode);

    const payload = { ListModel: listModel, ListDataMail: listDataMail };
    this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thông báo', res?.message || 'Từ chối báo giá thành công');
          this.LoadPriceRequests();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Có lỗi xảy ra');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }

  OpenRequestBuyModal(): void {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn ít nhất một dòng để yêu cầu mua.');
      return;
    }
    this.lastSelectedRowsForBuy = selectedRows.map(r => r.getData());
    this.requestBuyDeadline = new Date();
    this.requestBuyIsVPP = this.isVPP;
    this.requestBuyJobRequirementID = Number(this.jobRequirementID || 0);

    this.modal.create({
      nzTitle: 'Yêu cầu mua',
      nzContent: this.requestBuyTpl,
      nzOkText: 'Gửi yêu cầu',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        return this.PerformRequestBuy();
      }
    });
  }

  OpenImportExcel(): void {
    const modalRef = this.ngbModal.open(ImportExcelProjectPartlistPriceRequestComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
  }

  OpenAddSupplierModal(): void {
    const modalRef = this.ngbModal.open(SupplierSaleDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.supplierSaleID = 0; // 0 = thêm mới
    modalRef.result.finally(() => {
      // Reload danh sách supplier sau khi đóng modal
      this.GetSupplierSale();
    });
  }

  private validateRequestBuyDeadline(deadline: Date): string | null {
    const now = new Date();
    const d = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeSpan = Math.floor((d.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;

    if (now.getHours() < 15 && timeSpan < 2) {
      return 'Deadline tối thiểu là 2 ngày từ ngày hiện tại!';
    }
    if (now.getHours() >= 15 && timeSpan < 3) {
      return 'Yêu cầu từ sau 15h nên ngày Deadline tối thiểu là 2 ngày tính từ ngày hôm sau!';
    }
    const dow = d.getDay();
    if (dow === 6 || dow === 0) {
      return 'Deadline phải là ngày làm việc (T2 - T6)!';
    }
    return null;
  }

  private PerformRequestBuy(): boolean {
    const deadline = this.requestBuyDeadline as Date | null;
    if (!deadline) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Deadline!');
      return false;
    }
    const deadlineMsg = this.validateRequestBuyDeadline(deadline as Date);
    if (deadlineMsg) {
      this.notification.warning(NOTIFICATION_TITLE.warning, deadlineMsg);
      return false;
    }

    const products = (this.lastSelectedRowsForBuy || []).map((data: any) => ({
      ProductCode: String(data['ProductCode'] || '').trim(),
      ProductName: String(data['ProductName'] || '').trim(),
      Quantity: Number(data['Quantity'] || 0),
      UnitName: String(data['Unit'] || data['UnitName'] || data['UnitCount'] || '').trim(),
      NoteHR: String(data['NoteHR'] || data['HRNote'] || data['Note'] || '').trim(),
    }));

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stt = i + 1;
      if (!p.ProductCode) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Mã sản phẩm tại dòng [${stt}]!`);
        return false;
      }
      if (!p.ProductName) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Tên sản phẩm tại dòng [${stt}]!`);
        return false;
      }
      if (!p.UnitName) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập ĐVT tại dòng [${stt}]!`);
        return false;
      }
      if (p.Quantity <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập Số lượng > 0 tại dòng [${stt}]!`);
        return false;
      }
    }

    const payload: any = {
      JobRequirementID: this.isVPP ? 999999 : Number(this.jobRequirementID || 0),
      IsVPP: this.isVPP,
      Deadline: deadline,
      EmployeeID: this.appUserService.employeeID,
      ProjectPartlistPriceRequestTypeID: this.projectPartlistPriceRequestTypeID > 0 ? this.projectPartlistPriceRequestTypeID : 7,
      Products: products,
    };

    this.PriceRequetsService.requestBuy(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thông báo', res?.message || 'Yêu cầu mua đã xử lý xong.');
          this.LoadPriceRequests();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Có lỗi xảy ra');
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });

    return true;
  }

  async ExportToExcelAdvanced() {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

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
    const data = this.getSelectedData();

    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const columns = this.gridColumns.get(this.activeTabId) || [];

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
      if (col && col.size) {
        // Use size from TanStack Table column definition
        column.width = col.size / 5; // Convert pixels to Excel width units (approximate)
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
    link.download = `price-request-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  async ExportToExcelTab() {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

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

      const columns = this.gridColumns.get(this.activeTabId) || [];
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
          `A${groupHeaderRow.number}:${worksheet.columns.length > 0
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
        if (col && col.size) {
          column.width = col.size / 5; // Convert pixels to Excel width units
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
      link.download = `price-request-full-${new Date().toISOString().split('T')[0]
        }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error(error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
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

        const columns = this.gridColumns.get(projectTypeID) || [];
        if (columns.length === 0) continue;
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
          if (col && col.size) {
            column.width = col.size / 5; // Convert pixels to Excel width units
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
    link.download = `price-request-all-tabs-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  DownloadFile() {
    const grid = this.tables.get(this.activeTabId);
    if (!grid) return;

    const selectedRows = this.getSelectedData();
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

  onSupplierSelected(data: any) {
    if (this.currentSuccess) {
      this.currentSuccess(data.ID);
      this.currentSuccess = undefined;
      this.currentCancel = undefined;
    }
    this.showSupplierPopup = false;
    this.currentEditingCell = null;
  }

  onSupplierPopupClosed() {
    if (this.currentCancel) {
      this.currentCancel();
      this.currentCancel = undefined;
      this.currentSuccess = undefined;
    }
    this.showSupplierPopup = false;
    this.currentEditingCell = null;
  }

  supplierEditor(cell: any, onRendered: any, success: any, cancel: any) {
    this.currentEditingCell = cell;
    this.currentSuccess = success;
    this.currentCancel = cancel;

    const rect = cell.getElement().getBoundingClientRect();
    this.supplierPopupPosition = {
      top: `${rect.bottom + window.pageYOffset}px`,
      left: `${rect.left + window.pageXOffset}px`
    };

    this.showSupplierPopup = true;

    const dummyInput = document.createElement('input');
    dummyInput.style.border = 'none';
    dummyInput.style.background = 'transparent';
    dummyInput.style.width = '1px';
    dummyInput.style.padding = '0';
    dummyInput.style.margin = '0';
    dummyInput.style.opacity = '0';

    onRendered(() => {
      dummyInput.focus({ preventScroll: true });
    });

    return dummyInput;
  }

  labels: { [key: number]: string } = {};
  labeln: { [key: number]: string } = {};

  // Custom editor cho số tiền với format en-US
  moneyEditor(cell: any, onRendered: any, success: any, cancel: any) {
    const input = document.createElement('input');
    input.type = 'text';
    input.style.width = '100%';
    input.style.padding = '4px';
    input.style.boxSizing = 'border-box';

    // Format giá trị hiện tại
    const currentValue = cell.getValue() || 0;
    input.value = new Intl.NumberFormat('en-US').format(currentValue);

    // Format khi nhập
    input.addEventListener('input', (e: any) => {
      const value = e.target.value.replace(/[^0-9.]/g, '');
      const numValue = parseFloat(value) || 0;
      e.target.value = new Intl.NumberFormat('en-US').format(numValue);
    });

    // Xử lý khi hoàn thành
    input.addEventListener('blur', () => {
      const cleanValue = input.value.replace(/[^0-9.]/g, '');
      success(parseFloat(cleanValue) || 0);
    });

    input.addEventListener('keydown', (e: any) => {
      if (e.key === 'Enter') {
        const cleanValue = input.value.replace(/[^0-9.]/g, '');
        success(parseFloat(cleanValue) || 0);
      } else if (e.key === 'Escape') {
        cancel();
      }
    });

    onRendered(() => {
      input.focus();
      input.select();
    });

    return input;
  }
// Thêm property để quản lý hiển thị filter bar
showSearchBar: boolean = false;

// Sửa lại hàm ToggleSearchPanel
ToggleSearchPanelNew() {
    this.showSearchBar = !this.showSearchBar;
}
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
  // private GetTableConfig(): any {
  //   return {
  //     // data: this.dtprojectPartlistPriceRequest,
  //     ...DEFAULT_TABLE_CONFIG,
  //     layout: 'fitDataStretch',
  //     height: '96%',

  //     ajaxURL: this.PriceRequetsService.getAPIPricerequest(),
  //     ajaxParams: () => {
  //       const filters = this.filters;

  //       // Sửa statusRequest = -1 nếu không muốn lọc, hoặc truyền đúng
  //       let statusRequest = filters.statusRequest - 1;
  //       if (statusRequest < 0) statusRequest = 0;

  //       // Xử lý projectTypeID và isCommercialProduct logic giống như ở backend
  //       let isCommercialProduct =
  //         filters.projectTypeID === -1 ? 1 : filters.isCommercialProd;
  //       let poKHID = filters.projectTypeID >= 0 ? 0 : filters.poKHID;

  //       // Kiểm tra nếu dateStart và dateEnd là chuỗi thì sử dụng trực tiếp
  //       // nếu là Date thì chuyển đổi
  //       const dateStart =
  //         typeof filters.dateStart === 'string'
  //           ? filters.dateStart
  //           : DateTime.fromJSDate(filters.dateStart).toFormat('yyyy/MM/dd');

  //       const dateEnd =
  //         typeof filters.dateEnd === 'string'
  //           ? filters.dateEnd
  //           : DateTime.fromJSDate(filters.dateEnd).toFormat('yyyy/MM/dd');

  //       return {
  //         page: 1,
  //         size: 25,
  //       };
  //     },
  //     ajaxConfig: {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     },

  //     paginationMode: 'remote',
  //     pagination: true,
  //     paginationSize: 25,
  //     paginationSizeSelector: [10, 25, 50, 100],
  //     paginationInitialPage: 1,
  //     ajaxResponse: function (url: string, params: any, response: any) {
  //       // Xử lý dữ liệu trả về từ API
  //       const dtData = response.data.dtData || [];
  //       const totalPages = dtData.length > 0 ? dtData[0].TotalPage : 1;
  //       return {
  //         data: dtData,
  //         last_page: totalPages,
  //       };
  //     },
  //     ajaxError: function (xhr: any, textStatus: any, errorThrown: any) {
  //       console.error('Lỗi AJAX:', textStatus, errorThrown);
  //       this.notification.error(NOTIFICATION_TITLE.error,
  //         'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
  //       );
  //     },
  //     // langs: {
  //     //   vi: {
  //     //     pagination: {
  //     //       first: '<<',
  //     //       last: '>>',
  //     //       prev: '<',
  //     //       next: '>',
  //     //     },
  //     //   },
  //     // },
  //     // locale: 'vi',
  //     columnCalcs: 'both',
  //     groupBy: 'ProjectFullName',
  //     groupHeader: function (value: any, count: number, data: any) {
  //       return `${value} <span>(${count})</span>`;
  //     },
  //     rowContextMenu: [
  //       {
  //         label: 'Xem chi tiết',
  //         action: (e: MouseEvent, row: RowComponent) => {
  //           this.OnEditClick();
  //         },
  //       },
  //       { separator: true },
  //     ] as MenuObject<RowComponent>[],
  //     columns: [
  //       {
  //         title: 'ID',
  //         field: 'ID',
  //         visible: false,
  //         headerHozAlign: 'center',
  //         frozen: true,
  //       },
  //       {
  //         title: 'Check giá',
  //         field: 'IsCheckPrice',
  //         hozAlign: 'center',
  //         headerSort: false,
  //         headerHozAlign: 'center',
  //         formatter: function (cell: any) {
  //           const value = cell.getValue();
  //           const checked = value === true || value === 'true' || value === 1 || value === '1';
  //           return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
  //         },
  //         frozen: true,
  //         width: 100,
  //       },
  //       {
  //         title: 'TT',
  //         field: 'TT',
  //         headerHozAlign: 'center',
  //         frozen: true,
  //         width: 70,
  //         headerFilter: 'input',
  //       },

  //       // {
  //       //   title: ' ',
  //       //   field: 'ProjectFullName',
  //       //   hozAlign: 'center',
  //       //   headerSort: false,
  //       // },
  //       {
  //         title: 'Mã dự án',
  //         field: 'ProjectCode',
  //         headerHozAlign: 'center',
  //         frozen: true,
  //         hozAlign: 'left',
  //         width: 150,
  //         formatter:'textarea',
  //       },
  //       {
  //         title: 'Mã sản phẩm',
  //         field: 'ProductCode',
  //         headerHozAlign: 'center',
  //         frozen: true,
  //         hozAlign: 'left',
  //         width: 150,
  //         bottomCalc: 'count',
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Tên sản phẩm',
  //         field: 'ProductName',
  //         headerHozAlign: 'center',
  //         frozen: true,
  //         hozAlign: 'left',
  //         width: 150,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Hãng',
  //         field: 'Manufacturer',
  //         headerHozAlign: 'center',
  //         frozen: true,
  //         hozAlign: 'left',
  //         width: 50,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Số lượng',
  //         field: 'Quantity',
  //         hozAlign: 'right',
  //         headerHozAlign: 'center',
  //         width: 100,
  //         bottomCalc: 'sum'
  //       },
  //       {
  //         title: 'ĐVT',
  //         field: 'UnitCount',
  //         headerHozAlign: 'center',
  //         width: 100,
  //         hozAlign: 'left',
  //       },
  //       {
  //         title: 'Trạng thái',
  //         field: 'StatusRequestText',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 150,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Người yêu cầu',
  //         field: 'FullName',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 150,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Sale phụ trách',
  //         field: 'FullNameSale',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 150,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'NV báo giá',
  //         field: 'QuoteEmployee',
  //         hozAlign: 'left',
  //         headerHozAlign: 'center',
  //         width: 150,
  //         formatter:'textarea'
  //       },
  //       {
  //         title: 'Ngày yêu cầu',
  //         field: 'DateRequest',
  //         headerHozAlign: 'center',
  //         formatter: function (
  //           cell: any,
  //           formatterParams: any[],
  //           onRendered: any
  //         ) {
  //           let value = cell.getValue() || '';
  //           const dateTime = DateTime.fromISO(value);
  //           value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  //           return value;
  //         },
  //         hozAlign: 'center',
  //         width: 100,
  //       },
  //       {
  //         title: 'Deadline',
  //         field: 'Deadline',
  //         headerHozAlign: 'center',
  //         formatter: function (
  //           cell: any,
  //           formatterParams: any[],
  //           onRendered: any
  //         ) {
  //           let value = cell.getValue() || '';
  //           const dateTime = DateTime.fromISO(value);
  //           value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  //           return value;
  //         },
  //         hozAlign: 'center',
  //         width: 100,
  //       },
  //       {
  //         title: 'Ngày báo giá',
  //         field: 'DatePriceQuote',
  //         formatter: function (
  //           cell: any,
  //           formatterParams: any[],
  //           onRendered: any
  //         ) {
  //           let value = cell.getValue() || '';
  //           const dateTime = DateTime.fromISO(value);
  //           value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  //           return value;
  //         },
  //         headerHozAlign: 'center',
  //         hozAlign: 'center',
  //         width: 100,
  //       },
  //       {
  //         title: 'Loại tiền',
  //         field: 'CurrencyID',
  //         hozAlign: 'left',
  //         editor: this.createdControl(
  //           SelectEditorComponent,
  //           this.injector,
  //           this.appRef
  //         ),
  //         formatter: (cell: any) => {
  //           const val = cell.getValue();

  //           return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${val ? this.labels[val] : 'Chọn loại tiền'
  //             }</p> <i class="fas fa-angle-down"></i> <div>`;
  //         },
  //         cellEdited: (cell: any) => this.OnCurrencyChanged(cell),
  //         width: 100,
  //       },
  //       {
  //         title: 'Tỷ giá',
  //         field: 'CurrencyRate',
  //         headerHozAlign: 'center',
  //         width: '100',
  //         hozAlign: 'right',
  //       },
  //       {
  //         title: 'Đơn giá',
  //         field: 'UnitPrice',
  //         headerHozAlign: 'center',
  //         editor: this.moneyEditor.bind(this),
  //         formatter: 'money',
  //         hozAlign: 'right',
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         cellEdited: (cell: any) => this.HandleCellEdited(cell),
  //         width: 100,
  //       },
  //       {
  //         title: 'Giá lịch sử',
  //         field: 'HistoryPrice',
  //         headerHozAlign: 'center',
  //         editor: this.moneyEditor.bind(this),
  //         formatter: 'money',
  //         hozAlign: 'right',
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         width: 100,
  //       },
  //       {
  //         title: 'Thành tiền chưa VAT',
  //         field: 'TotalPrice',
  //         headerHozAlign: 'center',
  //         formatter: 'money',
  //         hozAlign: 'right',
  //         width: 100,
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         bottomCalc: 'sum',
  //         bottomCalcFormatter: 'money',
  //         bottomCalcFormatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //       },
  //       {
  //         title: 'Thành tiền quy đổi (VNĐ)',
  //         field: 'TotalPriceExchange',
  //         headerHozAlign: 'center',
  //         formatter: 'money',
  //         hozAlign: 'right',
  //         headerFilter: 'input',
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         width: 100,
  //       },
  //       {
  //         title: '% VAT',
  //         field: 'VAT',
  //         headerHozAlign: 'center',
  //         editor: 'input',
  //         width: 100,
  //         hozAlign: 'right',
  //         cellEdited: (cell: any) => this.HandleCellEdited(cell),
  //       },
  //       {
  //         title: 'Thành tiền có VAT',
  //         field: 'TotaMoneyVAT',
  //         headerHozAlign: 'center',
  //         formatter: 'money',
  //         hozAlign: 'right',
  //         width: 100,
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //       },
  //       {
  //         title: 'Mã NCC',
  //         field: 'CodeNCC',
  //         hozAlign: 'left',
  //         headerHozAlign: 'center',
  //         width: 100,
  //       },
  //       {
  //         title: 'Nhà cung cấp',
  //         field: 'SupplierSaleID',
  //         headerHozAlign: 'center',
  //         width: 150,
  //         hozAlign: 'left',
  //         editor: this.supplierEditor.bind(this),
  //         formatter: (cell: any) => {
  //           const val = cell.getValue();
  //           const supplier = this.dtSupplierSale.find((s) => s.ID === val);
  //           return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${supplier ? supplier.NameNCC : 'Chọn nhà cung cấp'
  //             }</p> <i class="fas fa-angle-down"></i> <div>`;
  //         },
  //         cellEdited: (cell: any) => this.OnSupplierSaleChanged(cell),
  //       },
  //       {
  //         title: 'Lead Time (Ngày làm việc)',
  //         field: 'TotalDayLeadTime',
  //         headerHozAlign: 'center',
  //         hozAlign: 'right',
  //         bottomCalc: 'sum',
  //         cellEdited: (cell: any) => this.HandleCellEdited(cell),
  //         width: 100,

  //       },
  //       {
  //         title: 'Ngày dự kiến hàng về',
  //         field: 'DateExpected',
  //         headerHozAlign: 'center',
  //         hozAlign: 'center',
  //         formatter: function (
  //           cell: any,
  //           formatterParams: any[],
  //           onRendered: any
  //         ) {
  //           let value = cell.getValue() || '';
  //           const dateTime = DateTime.fromISO(value);
  //           value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  //           return value;
  //         },
  //         width: 100,
  //       },
  //       {
  //         title: 'Ghi chú Pur',
  //         field: 'Note',
  //         headerHozAlign: 'center',
  //         width: 100,
  //         hozAlign: 'left',
  //       },
  //       {
  //         title: 'Ghi chú (Người Y/C)',
  //         field: 'NotePartlist',
  //         width: 200,
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //       },
  //       {
  //         title: 'Thông số kỹ thuật',
  //         field: 'Model',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 100,
  //       },
  //       {
  //         title: 'Mã đặc biệt',
  //         field: 'SpecialCode',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 100,
  //       },
  //       {
  //         title: 'Hàng nhập khẩu',
  //         field: 'IsImport',
  //         headerHozAlign: 'center',
  //         hozAlign: 'left',
  //         width: 100,
  //       },
  //       {
  //         title: 'Đơn giá xuất xưởng',
  //         field: 'UnitFactoryExportPrice',
  //         editor: this.moneyEditor.bind(this),
  //         formatter: 'money',
  //         headerHozAlign: 'center',
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         width: 100,
  //         hozAlign: 'right',
  //       },
  //       {
  //         title: 'Đơn giá nhập khẩu',
  //         field: 'UnitImportPrice',
  //         editor: this.moneyEditor.bind(this),
  //         formatter: 'money',
  //         headerHozAlign: 'center',
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //         width: 100,
  //         cellEdited: (cell: any) => this.HandleCellEdited(cell),
  //         hozAlign: 'right',
  //       },
  //       {
  //         title: 'Thành tiền nhập khẩu',
  //         field: 'TotalImportPrice',
  //         hozAlign: 'right',
  //         headerHozAlign: 'center',
  //         formatter: 'money',
  //         width: 100,
  //         formatterParams: {
  //           thousand: ',',
  //           decimal: '.',
  //           precision: 0,
  //         },
  //       },
  //       {
  //         title: 'Lead Time',
  //         field: 'LeadTime',
  //         hozAlign: 'center',
  //         width: 100,
  //         headerHozAlign: 'center',
  //         formatter: function (
  //           cell: any,
  //           formatterParams: any[],
  //           onRendered: any
  //         ) {
  //           let value = cell.getValue() || '';
  //           const dateTime = DateTime.fromISO(value);
  //           value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  //           return value;
  //         },
  //       },
  //       {
  //         title: 'Lý do xoá',
  //         field: 'ReasonDeleted',
  //         hozAlign: 'left',
  //         width: 100,
  //         headerHozAlign: 'center',
  //       },
  //     ],
  //   };
  // }

  ngOnDestroy(): void {
    // Cleanup tables
    this.tables.clear();
    this.gridColumns.clear();
    this.sorting.clear();
    this.columnFilters.clear();
    this.gridDatasets.clear();
    this.selectedRows.clear();
    this.editedRows.clear();
  }
}
