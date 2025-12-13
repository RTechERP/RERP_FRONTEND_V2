import { DEFAULT_TABLE_CONFIG } from './../../../tabulator-default.config';
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
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
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { ProjectPartlistPriceRequestService } from '../../old/project-partlist-price-request/project-partlist-price-request-service/project-partlist-price-request.service';
import { ProjectPartlistPriceRequestFormComponent } from '../../old/project-partlist-price-request/project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ImportExcelProjectPartlistPriceRequestComponent } from '../../old/project-partlist-price-request/import-excel-project-partlist-price-request/import-excel-project-partlist-price-request.component';
import {
  TabulatorFull as Tabulator,
  ColumnComponent,
  MenuObject,
  RowComponent,
} from 'tabulator-tables';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../services/app-user.service';
import { bottom } from '@popperjs/core';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { TabulatorPopupComponent, TabulatorPopupService } from '../../../shared/components/tabulator-popup';
import { ColumnDefinition } from 'tabulator-tables';
import { SupplierSaleDetailComponent } from '../../purchase/supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { HorizontalScrollDirective } from '../../../directives/horizontalScroll.directive';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-project-partlist-price-request-new',
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
    NzSpinModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
    // NSelectComponent,
    NgbModalModule,
    TabulatorPopupComponent,
    ImportExcelProjectPartlistPriceRequestComponent,
    HasPermissionDirective,
    HorizontalScrollDirective
  ],
  templateUrl: './project-partlist-price-request-new.component.html',
  styleUrls: ['./project-partlist-price-request-new.component.css']
})
export class ProjectPartlistPriceRequestNewComponent implements OnInit, OnDestroy {
@Output() openModal = new EventEmitter<any>();
  @Input() poKHID: number = 0;
  @Input() jobRequirementID: number = 0;
  @Input() isVPP: boolean = false;
  @Input() projectPartlistPriceRequestTypeID: number = 0;
  @Input() initialTabId: number = 0;
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
  dtProductSale: any[] = [];
  // Map để lưu dữ liệu theo từng type (cho local pagination)
  allDataByType: Map<number, any[]> = new Map();
  // Quản lý subscriptions để có thể hủy khi cần
  private dataLoadingSubscriptions: Subscription[] = [];
  // Request ID để đảm bảo chỉ xử lý response từ request hiện tại
  private currentRequestId: number = 0;
  PriceRequetsService = inject(ProjectPartlistPriceRequestService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private tabulatorPopupService = inject(TabulatorPopupService);
  injector = inject(EnvironmentInjector);
  appRef = inject(ApplicationRef);
  appUserService = inject(AppUserService);
  private ngbModal = inject(NgbModal);

  showSupplierPopup: boolean = false;
  currentEditingCell: any = null;
  currentSuccess?: (value: any) => void;
  currentCancel?: () => void;
  supplierPopupPosition: { top: string; left: string } = {
    top: '0px',
    left: '0px',
  };
  supplierColumns: ColumnDefinition[] = [
    { title: 'Mã', field: 'CodeNCC', width: 120, headerSort: false },
    { title: 'Tên nhà cung cấp', field: 'NameNCC', width: 200, headerSort: false },
  ];
  supplierSearchFields: string[] = ['Code', 'NameNCC'];
  currencyColumns: ColumnDefinition[] = [
    { title: 'Mã', field: 'Code', width: 120, headerSort: false },
    { title: 'Tỷ giá', field: 'CurrencyRate', width: 150, headerSort: false, hozAlign: 'right', formatter: 'money', formatterParams: { thousand: ',', decimal: '.', precision: 2 } },
  ];
  currencySearchFields: string[] = ['Code'];

  @ViewChild('rejectReasonTpl', { static: false })
  rejectReasonTpl!: TemplateRef<any>;
  rejectReason: string = '';
  lastSelectedRowsForReject: any[] = [];

  @ViewChild('requestBuyTpl', { static: false })
  requestBuyTpl!: TemplateRef<any>;
  requestBuyDeadline: Date | null = null;
  requestBuyIsVPP: boolean = false;
  requestBuyJobRequirementID: number = 0;
  lastSelectedRowsForBuy: any[] = [];
  labels: { [key: number]: string } = {};
  labeln: { [key: number]: string } = {};
  showSearchBar: boolean = false;

  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private ngZone: NgZone = inject(NgZone);

  constructor(
    @Optional() @Inject('tabData') private tabData: any,
    @Optional() public activeModal?: NgbActiveModal
  ) {
    // Khi mở từ new tab, data được truyền qua injector
    if (this.tabData) {
      // Nếu có initialTabId trong tabData, set activeTabId trực tiếp
      if (
        this.tabData.initialTabId !== null &&
        this.tabData.initialTabId !== undefined
      ) {
        this.activeTabId = this.tabData.initialTabId;
      }
      // Nếu có projectPartlistPriceRequestTypeID trong tabData, set và map sang activeTabId
      if (
        this.tabData.projectPartlistPriceRequestTypeID !== null &&
        this.tabData.projectPartlistPriceRequestTypeID !== undefined
      ) {
        this.projectPartlistPriceRequestTypeID =
          this.tabData.projectPartlistPriceRequestTypeID;
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

    this.filters = {
      dateStart: DateTime.local().startOf('month').toJSDate(), // Ngày đầu tháng hiện tại
      dateEnd: DateTime.local().endOf('month').toJSDate(), // Ngày cuối cùng của tháng hiện tại
      statusRequest: 1, // Mặc định: Yêu cầu báo giá
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: this.poKHID,
      isCommercialProduct: -1,
      isJobRequirement: -1,
    };

    // Hiển thị search bar mặc định cho nhân viên mua (có permission) hoặc không phải HR
    const hasPurchasePermission = this.appUserService.hasPermission('N27,N34,N69,N80');
    if (hasPurchasePermission || !this.isHRDept) {
      this.showSearchBar = true;
    }

    this.GetCurrency();
    this.GetSupplierSale();
    this.GetProductSale(); //NXL Update 29/11/25
    this.LoadProjectTypes();
    this.GetallProject();
    this.GetAllPOKH();
  }

  get restrictedView(): boolean {
    return (
      this.jobRequirementID > 0 ||
      this.isVPP ||
      this.projectPartlistPriceRequestTypeID === 4
    );
  }
  get isHRDept(): boolean {
    const d = this.appUserService.departmentID ?? 0;
    return d === 4 && !this.appUserService.isAdmin;
  }
  get shouldShowSearchBar(): boolean {
    // Hiển thị search bar khi showSearchBar = true và:
    // - Không phải HR, HOẶC
    // - Có permission của nhân viên mua (N27, N34, N69, N80)
    if (!this.showSearchBar) return false;
    
    // Nếu có permission của nhân viên mua, luôn hiển thị
    const hasPurchasePermission = this.appUserService.hasPermission('N27,N34,N69,N80');
    if (hasPurchasePermission) return true;
    
    // Nếu không phải HR, hiển thị
    return true;
  }
  shouldShowProjectType(id: number): boolean {
    if (this.poKHID > 0 && id !== -1) return false;
    if (this.projectPartlistPriceRequestTypeID === 3) return id === -2;
    if (this.projectPartlistPriceRequestTypeID === 4) return id === -3;
    return true;
  }
  getVisibleProjectTypes(): any[] {
    return (this.projectTypes || []).filter((t: any) =>
      this.shouldShowProjectType(t.ProjectTypeID)
    );
  }

  OnFormSubmit(): void {
    this.LoadPriceRequests();
    this.showDetailModal = false;
  }
  OnAddClick() {
    this.modalData = [];

    // Map projectTypeID (activeTabId) sang projectPartlistPriceRequestTypeID
    const projectPartlistPriceRequestTypeID =
      this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID =
      projectPartlistPriceRequestTypeID;

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
  private getProjectPartlistPriceRequestTypeID(projectTypeID: number): number {
    //NXL Update 29/11/25
    const mapping: { [key: number]: number } = {
      0: 5,
      '-1': 2,
      '-2': 3,
      '-3': 4,
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
    const table = this.tables.get(this.activeTabId);

    if (!lstTypeAccept.includes(this.activeTabId)) {
      this.notification.info(
        'Thông báo',
        'Chỉ được sửa những sản phẩm thương mại hoặc của yêu cầu công việc!'
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
        ProjectPartlistPriceRequestTypeID:
          row.ProjectPartlistPriceRequestTypeID ?? null,
      };
    });

    const modalRef = this.ngbModal.open(
      ProjectPartlistPriceRequestFormComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
    modalRef.componentInstance.dataInput = processedRows;
    modalRef.componentInstance.jobRequirementID = 0;
    modalRef.componentInstance.projectTypeID = this.activeTabId;
    modalRef.componentInstance.initialPriceRequestTypeID =
      this.getProjectPartlistPriceRequestTypeID(this.activeTabId);

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

  private GetProductSale() {
    //NXL Update 29/11/25
    this.PriceRequetsService.getProductSale().subscribe((response) => {
      this.dtProductSale = response.data || [];
      console.log('ProductSale:', this.dtProductSale);
    });
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
    if (this.jobRequirementID > 0 || this.isVPP) projectTypeIdHR = -2;
    
    // Lấy danh sách types
    this.PriceRequetsService.getTypes(employeeID, projectTypeIdHR).subscribe(
      (response) => {
        this.projectTypes = response.data.dtType;
        
        // Tạo tables trước
        setTimeout(() => {
          this.projectTypes.forEach((type) => {
            const projectTypeID = type.ProjectTypeID;
            if (!this.tables.has(projectTypeID)) {
              this.CreateTableForType(projectTypeID);
            }
          });
          
          // Sau khi tạo xong tables, load dữ liệu
          setTimeout(() => {
            this.LoadAllDataOnce();
          }, 300);
        }, 100);
      }
    );
  }

  /**
   * Hủy tất cả các subscription đang chờ load dữ liệu
   */
  private cancelAllDataLoading(): void {
    if (this.dataLoadingSubscriptions.length > 0) {
      console.log(`Cancelling ${this.dataLoadingSubscriptions.length} pending subscriptions...`);
      this.dataLoadingSubscriptions.forEach(sub => {
        if (sub && !sub.closed) {
          sub.unsubscribe();
        }
      });
      this.dataLoadingSubscriptions = [];
    }
  }

  /**
   * Load tất cả dữ liệu cho từng type từ API (gọi nhiều lần, mỗi type một lần)
   * Sau đó set vào từng table với local pagination
   */
  private LoadAllDataOnce(): void {
    // Đảm bảo filters tồn tại
    if (!this.filters) {
      console.error('Filters is not initialized');
      return;
    }

    // Hủy tất cả subscriptions cũ trước khi bắt đầu request mới
    this.cancelAllDataLoading();

    // Tăng request ID để đánh dấu request mới
    this.currentRequestId++;
    const currentRequestId = this.currentRequestId;

    // Bắt đầu loading
    this.loading = true;

    const dateStart =
      typeof this.filters.dateStart === 'string'
        ? this.filters.dateStart
        : DateTime.fromJSDate(this.filters.dateStart).toFormat('yyyy/MM/dd');

    const dateEnd =
      typeof this.filters.dateEnd === 'string'
        ? this.filters.dateEnd
        : DateTime.fromJSDate(this.filters.dateEnd).toFormat('yyyy/MM/dd');

    const statusRequest = this.filters.statusRequest ;
    const projectId = this.filters.projectId || 0;
    const keyword = (this.filters.keyword || '').trim();
    const isDeleted = this.filters.isDeleted || 0;
    const employeeID = this.appUserService.employeeID ?? 0;
    
    console.log(`[Request ${currentRequestId}] LoadAllDataOnce - Filters:`, {
      dateStart,
      dateEnd,
      statusRequest,
      projectId,
      keyword,
      isDeleted,
      employeeID,
      poKHID: this.filters.poKHID
    });
    
    // Clear Map
    this.allDataByType.clear();
    
    // Gọi API cho từng type với logic mapping giống WinForm
    let loadedCount = 0;
    const totalTypes = this.projectTypes.length;
    
    // Nếu không có types, tắt loading ngay
    if (totalTypes === 0) {
      this.loading = false;
      console.log('No project types to load');
      return;
    }
    
    console.log(`[Request ${currentRequestId}] Starting to load data for ${totalTypes} types...`);
    
    // Timeout để đảm bảo loading không bị kẹt mãi (30 giây)
    let loadingTimeout: any = setTimeout(() => {
      // Chỉ force tắt loading nếu đây vẫn là request hiện tại
      if (this.loading && currentRequestId === this.currentRequestId) {
        console.warn(`[Request ${currentRequestId}] Loading timeout - forcing loading to false`);
        console.warn(`[Request ${currentRequestId}] Loaded count: ${loadedCount}/${totalTypes}`);
        this.loading = false;
      }
    }, 30000);
    
    // Helper function để clear timeout và set loading = false
    const finishLoading = () => {
      // Chỉ finish loading nếu đây vẫn là request hiện tại
      if (currentRequestId !== this.currentRequestId) {
        console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request (${this.currentRequestId}) is active`);
        return;
      }
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      if (this.loading) {
        this.loading = false;
        console.log(`[Request ${currentRequestId}] Loading finished. Loaded: ${loadedCount}/${totalTypes}`);
      }
    };
    
          this.projectTypes.forEach((type, index) => {
      const projectTypeID = type.ProjectTypeID;
      
      // Map projectTypeID sang các tham số API theo logic WinForm
      let mappedProjectTypeID = projectTypeID;
      let isCommercialProduct = -1;
      let poKHID = 0;
      let isJobRequirement = -1;
      let projectPartlistPriceRequestTypeID = -1;
      
      if (projectTypeID === -1) {
        mappedProjectTypeID = -1;
        isCommercialProduct = 1;
        poKHID = this.filters.poKHID || 0;
      } else if (projectTypeID === -2) {
        mappedProjectTypeID = -1;
        isJobRequirement = 1;
        isCommercialProduct = -1;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else if (projectTypeID === -3) {
        projectPartlistPriceRequestTypeID = 4;
        isCommercialProduct = 0;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else if (projectTypeID === 0) {
        isCommercialProduct = 0;
        isJobRequirement = 0;
        poKHID = 0; // poKHID = 0 cho các type khác
      } else {
        // projectTypeID > 0
        poKHID = 0; // poKHID = 0 cho các type khác
      }
      
      if (this.jobRequirementID > 0 || this.isVPP) {
        isJobRequirement = 1;
      }
      
      // Gọi API cho type này
      const subscription = this.PriceRequetsService.getAllPartlistLocal(
        dateStart,
        dateEnd,
        statusRequest,
        projectId,
        keyword,
        employeeID,
        isDeleted,
        mappedProjectTypeID,
        poKHID,
        isJobRequirement,
        projectPartlistPriceRequestTypeID,
        isCommercialProduct
      ).subscribe({
        next: (response: any) => {
          // Kiểm tra xem đây có phải response từ request hiện tại không
          if (currentRequestId !== this.currentRequestId) {
            console.log(`[Request ${currentRequestId}] Ignored response for type ${projectTypeID} - newer request (${this.currentRequestId}) is active`);
            return;
          }

          const data = response?.data || [];
          
          // Format các trường ngày tháng
          const formattedData = this.formatDateFields(data);
          
          // Log dữ liệu của từng tab
          console.log(`[Request ${currentRequestId}] === Tab ${type.ProjectTypeName} (ID: ${projectTypeID}) ===`);
          console.log(`[Request ${currentRequestId}] Số lượng bản ghi:`, formattedData.length);
          console.log(`[Request ${currentRequestId}] Dữ liệu:`, formattedData);
          console.log(`[Request ${currentRequestId}] Tham số API:`, {
            mappedProjectTypeID,
            poKHID,
            isJobRequirement,
            projectPartlistPriceRequestTypeID,
            isCommercialProduct,
            dateStart,
            dateEnd,
            statusRequest,
            projectId,
            keyword,
            isDeleted
          });
          console.log(`[Request ${currentRequestId}] ==========================================`);
          
          // Lưu dữ liệu vào Map
          this.allDataByType.set(projectTypeID, formattedData);
          
          loadedCount++;
          console.log(`[Request ${currentRequestId}] [${projectTypeID}] Data loaded. Progress: ${loadedCount}/${totalTypes}`);
          
          // Set dữ liệu vào table NGAY LẬP TỨC (không dùng setTimeout)
          const table = this.tables.get(projectTypeID);
          if (table) {
            try {
              table.setData(formattedData);
              // Resize bảng sau khi set data
              this.resizeTableForType(projectTypeID);
            } catch (e) {
              console.warn(`[Request ${currentRequestId}] Error setting data for type ${projectTypeID}:`, e);
            }
          }
          
          // Sau khi load xong tất cả types
          if (loadedCount >= totalTypes) {
            // Kiểm tra lại request ID trước khi finish
            if (currentRequestId !== this.currentRequestId) {
              console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request is active`);
              return;
            }
            
            console.log(`[Request ${currentRequestId}] [FINAL] All types processed. Count: ${loadedCount}, Total: ${totalTypes}`);
            
            // Log tổng hợp tất cả các tab
            console.log(`[Request ${currentRequestId}] === TỔNG HỢP DỮ LIỆU TẤT CẢ CÁC TAB ===`);
            this.allDataByType.forEach((data, typeId) => {
              const type = this.projectTypes.find(t => t.ProjectTypeID === typeId);
              console.log(`[Request ${currentRequestId}] Tab ${type?.ProjectTypeName || typeId}: ${data.length} bản ghi`);
            });
            console.log(`[Request ${currentRequestId}] Tổng số tab:`, this.allDataByType.size);
            console.log(`[Request ${currentRequestId}] ==========================================`);
            
            // Đợi tất cả tables render xong rồi mới tắt spinner
            // Sử dụng requestAnimationFrame để đảm bảo UI đã render
            requestAnimationFrame(() => {
              setTimeout(() => {
                // Kiểm tra lại request ID trước khi finish
                if (currentRequestId !== this.currentRequestId) {
                  return;
                }
                
                // Tắt spinner SAU KHI tables đã render
                finishLoading();
                console.log(`[Request ${currentRequestId}] All ${totalTypes} types loaded and rendered successfully.`);
                
                // Force change detection
                this.cdr.detectChanges();
                
                // Nếu có initialTabId từ tabData, chọn tab đó sau khi load xong
                if (
                  this.tabData &&
                  this.tabData.initialTabId !== null &&
                  this.tabData.initialTabId !== undefined
                ) {
                  setTimeout(() => {
                    this.SelectProjectType(this.tabData.initialTabId);
                  }, 100);
                }
                // Nếu có projectPartlistPriceRequestTypeID, chọn tab tương ứng sau khi load xong
                else if (this.projectPartlistPriceRequestTypeID === 3) {
                  setTimeout(() => {
                    this.SelectProjectType(-2); // HCNS tab
                  }, 100);
                } else if (this.projectPartlistPriceRequestTypeID === 4) {
                  setTimeout(() => {
                    this.SelectProjectType(-3); // Tab tương ứng với type 4
                  }, 100);
                }
                
                // Focus vào job requirement nếu có
                if (this.jobRequirementID > 0) {
                  setTimeout(() => {
                    this.LoadViewToJobRequirement();
                  }, 200);
                }
              }, 50); // Đợi 50ms sau requestAnimationFrame
            });
          }
        },
        error: (err) => {
          // Kiểm tra xem đây có phải response từ request hiện tại không
          if (currentRequestId !== this.currentRequestId) {
            console.log(`[Request ${currentRequestId}] Ignored error for type ${projectTypeID} - newer request (${this.currentRequestId}) is active`);
            return;
          }
          
          console.error(`[Request ${currentRequestId}] [ERROR] Loading data for type ${projectTypeID}:`, err);
          loadedCount++;
          console.log(`[Request ${currentRequestId}] [${projectTypeID}] Error occurred. Progress: ${loadedCount}/${totalTypes}`);
          
          // Lưu mảng rỗng vào Map để tránh lỗi
          this.allDataByType.set(projectTypeID, []);
          
          // Nếu tất cả đã load xong (kể cả lỗi)
          if (loadedCount >= totalTypes) {
            // Kiểm tra lại request ID trước khi finish
            if (currentRequestId !== this.currentRequestId) {
              console.log(`[Request ${currentRequestId}] Ignored finishLoading - newer request is active`);
              return;
            }
            
            console.log(`[Request ${currentRequestId}] [FINAL ERROR] All types processed. Count: ${loadedCount}, Total: ${totalTypes}`);
            finishLoading();
            console.log(`[Request ${currentRequestId}] All ${totalTypes} types processed (including errors).`);
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Một số dữ liệu không thể tải. Vui lòng thử lại sau.'
            );
          }
        }
      });

      // Lưu subscription để có thể hủy sau này
      this.dataLoadingSubscriptions.push(subscription);
    });
  }

  private LoadAllTablesData(): void {
    // Reload tất cả dữ liệu và filter lại
    this.LoadAllDataOnce();
  }

  /**
   * Load view theo Job Requirement - ẩn/hiện các nút và focus vào row tương ứng
   * Logic này được xử lý trong HTML thông qua restrictedView và isHRDept
   * Hàm này chỉ focus vào row có jobRequirementID tương ứng
   */
  private LoadViewToJobRequirement(): void {
    // Focus vào row có jobRequirementID tương ứng
    if (this.jobRequirementID > 0) {
      const table = this.tables.get(this.activeTabId);
      if (table) {
        // Đợi table render xong
        setTimeout(() => {
          // Tìm row có JobRequirementID tương ứng
          const rows = table.getRows();
          const targetRow = rows.find((row: any) => {
            const rowData = row.getData();
            return Number(rowData['JobRequirementID'] || 0) === this.jobRequirementID;
          });

          if (targetRow) {
            // Scroll đến row và select nó
            targetRow.scrollTo();
            targetRow.select();
            // Focus vào row
            setTimeout(() => {
              const cells = targetRow.getCells();
              if (cells && cells.length > 0) {
                cells[0].getElement().focus();
              }
            }, 100);
          }
        }, 300);
      }
    }
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

  /**
   * Refresh toàn bộ dữ liệu: combobox, bảng, projecttype
   */
  RefreshAll(): void {
    // Xóa tất cả các tables hiện tại
    this.tables.forEach((table) => {
      try {
        table.destroy();
      } catch (e) {
        console.warn('Error destroying table:', e);
      }
    });
    this.tables.clear();

    // Clear editedRowsMap
    this.editedRowsMap.clear();

    // Load lại tất cả các combobox
    this.GetCurrency();
    this.GetSupplierSale();
    this.GetProductSale();
    this.GetallProject();
    this.GetAllPOKH();

    // Load lại ProjectTypes (sẽ tự động tạo lại tables và load data)
    this.LoadProjectTypes();

    // Hiển thị thông báo
    this.notification.success('Thông báo', 'Đang làm mới dữ liệu...');
  }

  private LoadPriceRequests(): void {
    // Reload tất cả dữ liệu
    this.LoadAllDataOnce();
  }

  public ApplyFilters(): void {
    console.log('ApplyFilters - Filters:', this.filters);
    
    // Đảm bảo filters được cập nhật trước khi load dữ liệu
    // Sử dụng setTimeout để đảm bảo ngModel đã cập nhật
    setTimeout(() => {
      // Reload tất cả dữ liệu với filter mới
      this.loading = true;
      this.LoadAllDataOnce();

    // Tự động ẩn filter bar trên mobile sau khi tìm kiếm
    const isMobile = window.innerWidth <= 768;
    if (isMobile && this.showSearchBar) {
      // Khôi phục body scroll trước khi đóng modal
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';

      // Đóng modal với animation
      setTimeout(() => {
        this.showSearchBar = false;
      }, 100);
    }
    }, 0);
  }

  public ResetFilters(): void {
    this.filters = {
      dateStart: DateTime.local().startOf('month').toJSDate(), // Ngày đầu tháng hiện tại
      dateEnd: DateTime.local().endOf('month').toJSDate(), // Ngày cuối cùng của tháng hiện tại
      statusRequest: 2, // Mặc định: Yêu cầu báo giá
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: 0,
      isCommercialProduct: -1,
      isJobRequirement: -1,
    };

    // Reload tất cả dữ liệu
    this.LoadAllDataOnce();
  }

  public SelectProjectType(typeId: number, event?: Event): void {
    // Ngăn chặn hành vi mặc định của link
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Nếu đang ở cùng tab, không làm gì
    if (this.activeTabId === typeId) {
      return;
    }

    // Lưu tab hiện tại để có thể khôi phục nếu chọn Hủy
    const currentTabId = this.activeTabId;

    // Kiểm tra xem có dữ liệu thay đổi trong tab hiện tại không
    const hasChanges = this.hasUnsavedChanges();

    if (hasChanges) {
      // Hiển thị modal xác nhận với 3 nút
      const modalRef = this.modal.create({
        nzTitle: 'Thông báo',
        nzContent: 'Bạn vừa thay đổi dữ liệu.\nBạn có muốn lưu dữ liệu đã thay đổi trước không?',
        nzFooter: [
          {
            label: 'Có',
            type: 'primary',
            onClick: () => {
              modalRef.close();
              // Lưu dữ liệu trước khi chuyển tab
              this.saveAndSwitchTab(typeId);
            }
          },
          {
            label: 'Không',
            onClick: () => {
              modalRef.close();
              // Không lưu, chuyển tab luôn
              this.switchTab(typeId);
            }
          },
          {
            label: 'Hủy',
            onClick: () => {
              modalRef.close();
              // Không làm gì cả, giữ nguyên tab
              // Đảm bảo activeTabId vẫn là tab hiện tại (khôi phục về tab ban đầu)
              this.activeTabId = currentTabId;
              this.filters.projectTypeID = currentTabId;
              // Force change detection để UI cập nhật lại
              setTimeout(() => {
                // Đảm bảo tab hiện tại vẫn được active
                const currentTabElement = document.querySelector(`#tab-${currentTabId}`);
                const clickedTabElement = document.querySelector(`#tab-${typeId}`);
                if (currentTabElement) {
                  currentTabElement.classList.add('active');
                  currentTabElement.setAttribute('aria-selected', 'true');
                }
                if (clickedTabElement && clickedTabElement !== currentTabElement) {
                  clickedTabElement.classList.remove('active');
                  clickedTabElement.setAttribute('aria-selected', 'false');
                }
              }, 0);
            }
          }
        ]
      });
    } else {
      // Không có thay đổi, chuyển tab trực tiếp
      this.switchTab(typeId);
    }
  }

  private hasUnsavedChanges(): boolean {
    const table = this.tables.get(this.activeTabId);
    if (!table) return false;

    const editedCells = table.getEditedCells();
    return editedCells.length > 0;
  }

  private saveAndSwitchTab(typeId: number): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) {
      this.switchTab(typeId);
      return;
    }

    const editedCells = table.getEditedCells();
    const changedRowsMap = new Map<number, any>();

    // Lấy các row từ getEditedCells() (các row được edit trực tiếp)
    editedCells.forEach((cell) => {
      const row = cell.getRow();
      const data = row.getData();
      changedRowsMap.set(Number(data['ID']), data);
    });

    // Lấy các row từ editedRowsMap (các row được cập nhật thông qua update())
    const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
    if (tabEditedRows) {
      const allTableData = table.getData();
      tabEditedRows.forEach((rowData: any, rowId: number) => {
        // Lấy dữ liệu mới nhất từ table
        const latestRowData = allTableData.find((row: any) => Number(row['ID']) === rowId);
        if (latestRowData) {
          // Chỉ thêm nếu chưa có trong changedRowsMap (tránh duplicate)
          if (!changedRowsMap.has(rowId)) {
            changedRowsMap.set(rowId, latestRowData);
          } else {
            // Nếu đã có, merge dữ liệu mới nhất
            const existingData = changedRowsMap.get(rowId);
            changedRowsMap.set(rowId, { ...existingData, ...latestRowData });
          }
        }
      });
    }

    const changedData = Array.from(changedRowsMap.values());

    // Xóa editedRowsMap sau khi đã lấy dữ liệu
    if (tabEditedRows) {
      tabEditedRows.clear();
    }

    if (changedData.length === 0) {
      this.switchTab(typeId);
      return;
    }

    // Lọc những dòng hợp lệ
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const allTableData = table.getData();

    const validData: any[] = [];
    for (const changedItem of changedData) {
      const id = Number(changedItem['ID']);
      if (id <= 0) continue;

      const originalData = allTableData.find((row: any) => Number(row['ID']) === id);
      if (!originalData) continue;

      const quoteEmployeeID = Number(originalData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID <= 0) continue;

      const isCheckPrice = originalData['IsCheckPrice'] === true || originalData['IsCheckPrice'] === 1 || originalData['IsCheckPrice'] === 'true';
      if (isCheckPrice) {
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          continue;
        }
      }

      validData.push(changedItem);
    }

    if (validData.length === 0) {
      this.switchTab(typeId);
      return;
    }

    // Lưu dữ liệu
    this.processSaveData(validData, () => {
      // Sau khi lưu thành công, chuyển tab
      this.switchTab(typeId);
    });
  }

  private switchTab(typeId: number): void {
    this.activeTabId = typeId;
    this.filters.projectTypeID = typeId;

    // Kiểm tra nếu bảng đã tồn tại
    if (!this.tables.has(typeId)) {
      this.CreateTableForType(typeId);
      
      // Set dữ liệu nếu đã có trong Map
      setTimeout(() => {
        const table = this.tables.get(typeId);
        const data = this.allDataByType.get(typeId);
        if (table && data) {
          table.setData(data);
        }
      }, 100);
    }
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
    
    // Resize bảng sau khi tạo
    setTimeout(() => {
      this.resizeTableForType(typeId);
    }, 100);
  }

  // Tạo cấu hình table riêng cho từng type
  private GetTableConfigForType(typeId: number): any {
    const baseConfig = this.GetTableConfig();

    // Sử dụng local pagination: lấy dữ liệu từ Map (có thể rỗng lúc đầu, sẽ được set sau)
    const dataForType = this.allDataByType.get(typeId) || [];
    
    // Set data trực tiếp vào config (local pagination)
    baseConfig.data = dataForType;

    return baseConfig;
  }

  private UpdateActiveTable(): void {
    const tableId = this.activeTabId;
    if (!this.tables.has(tableId)) {
      this.CreateTableForType(tableId);
    }

    const table = this.tables.get(tableId);
    if (table) {
      // Format các trường ngày tháng trước khi set vào bảng
      const formattedData = this.formatDateFields(this.dtprojectPartlistPriceRequest);
      table.setData(formattedData);
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
    table.on('dataChanged', function (data) { });
  }
  private SaveDataCommon(
    data: any[],
    successMessage: string = 'Dữ liệu đã được lưu.',
    onSuccessCallback?: () => void
  ): void {
    // Đảm bảo data là array
    if (!Array.isArray(data)) {
      console.error('SaveDataCommon: data không phải là array', data);
      this.notification.error('Thông báo', 'Dữ liệu không hợp lệ.');
      return;
    }

    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    console.log('SaveDataCommon: Gửi dữ liệu', { projectPartlistPriceRequest: data });

    this.PriceRequetsService.saveChangedData(data).subscribe({
      next: (response) => {
        if ((response as any).status === 1) {
          // Xóa editedRowsMap sau khi save thành công
          const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
          if (tabEditedRows) {
            tabEditedRows.clear();
          }

          this.LoadPriceRequests();
          this.notification.success(
            'Thông báo',
            (response as any).message || successMessage
          );
          // Gọi callback nếu có
          if (onSuccessCallback) {
            onSuccessCallback();
          }
        } else {
          this.notification.success(
            'Thông báo',
            (response as any).message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (error) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, error.error.message || 'Lỗi khi lưu dữ liệu.');
        // Swal.fire('Thông báo', 'Không thể lưu dữ liệu.', 'error');
      },
    });
  }

  OnSaveData(): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    const editedCells = table.getEditedCells();
    const changedRowsMap = new Map<number, any>();

    // Lấy các row từ getEditedCells() (các row được edit trực tiếp)
    editedCells.forEach((cell) => {
      const row = cell.getRow();
      const data = row.getData();
      changedRowsMap.set(Number(data['ID']), data);
    });

    // Lấy các row từ editedRowsMap (các row được cập nhật thông qua update())
    const tabEditedRows = this.editedRowsMap.get(this.activeTabId);
    if (tabEditedRows) {
      const allTableData = table.getData();
      tabEditedRows.forEach((rowData: any, rowId: number) => {
        // Lấy dữ liệu mới nhất từ table
        const latestRowData = allTableData.find((row: any) => Number(row['ID']) === rowId);
        if (latestRowData) {
          // Chỉ thêm nếu chưa có trong changedRowsMap (tránh duplicate)
          if (!changedRowsMap.has(rowId)) {
            changedRowsMap.set(rowId, latestRowData);
          } else {
            // Nếu đã có, merge dữ liệu mới nhất
            const existingData = changedRowsMap.get(rowId);
            changedRowsMap.set(rowId, { ...existingData, ...latestRowData });
          }
        }
      });
    }

    const changedData = Array.from(changedRowsMap.values());

    // Xóa editedRowsMap sau khi đã lấy dữ liệu
    if (tabEditedRows) {
      tabEditedRows.clear();
    }

    if (changedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

    // Lọc những dòng hợp lệ: chỉ cho phép sửa nếu là người check giá hoặc Admin
    const isAdmin = this.appUserService.isAdmin || false;
    const currentEmployeeID = this.appUserService.employeeID || 0;
    const allTableData = table.getData(); // Lấy tất cả dữ liệu từ table để so sánh

    const validData: any[] = [];
    let skippedCount = 0;

    for (const changedItem of changedData) {
      const id = Number(changedItem['ID']);
      if (id <= 0) continue;

      // Tìm dữ liệu gốc từ table
      const originalData = allTableData.find((row: any) => Number(row['ID']) === id);
      if (!originalData) continue;

      // Kiểm tra nếu dòng không có nhân viên báo giá (QuoteEmployeeID = 0 hoặc null)
      const quoteEmployeeID = Number(originalData['QuoteEmployeeID'] || 0);
      if (quoteEmployeeID <= 0) {
        skippedCount++;
        continue; // Bỏ qua dòng không có nhân viên báo giá
      }

      // Kiểm tra nếu dòng đã được check giá
      const isCheckPrice = originalData['IsCheckPrice'] === true || originalData['IsCheckPrice'] === 1 || originalData['IsCheckPrice'] === 'true';
      if (isCheckPrice) {
        // Kiểm tra quyền: chỉ cho phép sửa nếu là người check giá hoặc Admin
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          skippedCount++;
          continue; // Bỏ qua dòng không có quyền
        }
      }

      // Dòng hợp lệ, thêm vào danh sách
      validData.push(changedItem);
    }

    // Kiểm tra nếu không có dòng nào hợp lệ
    if (validData.length === 0) {
      if (skippedCount > 0) {
        this.notification.warning(
          'Thông báo',
          'Không có dữ liệu hợp lệ để lưu. Những dòng không có nhân viên báo giá hoặc NV báo giá không phải bạn sẽ bị bỏ qua!'
        );
      } else {
        this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      }
      return;
    }

    // Hiển thị cảnh báo nếu có dòng bị bỏ qua
    if (skippedCount > 0) {
      this.modal.confirm({
        nzTitle: 'Thông báo',
        nzContent: `Các sản phẩm không có nhân viên báo giá hoặc không phải NV check giá sẽ bị bỏ qua. Bạn có muốn tiếp tục lưu dữ liệu không?`,
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.processSaveData(validData);
        },
      });
      return;
    }

    // Nếu không có dòng nào bị bỏ qua, lưu trực tiếp
    this.processSaveData(validData);

  }

  private processSaveData(changedData: any[], onSuccess?: () => void): void {
    // Đảm bảo changedData là array
    if (!Array.isArray(changedData)) {
      console.error('processSaveData: changedData không phải là array', changedData);
      this.notification.error('Thông báo', 'Dữ liệu không hợp lệ.');
      return;
    }

    // Chỉ giữ lại các trường hợp lệ
    // Bao gồm tất cả các cột có editor để có thể lưu được
    const validFields = [
      'ID',
      'EmployeeID',
      'Deadline',
      'Note', // textarea editor
      'Unit',
      'Quantity',
      'TotalPrice',
      'UnitPrice', // moneyEditor
      'UnitFactoryExportPrice', // moneyEditor
      'UnitImportPrice', // moneyEditor
      'VAT', // input editor
      'TotaMoneyVAT',
      'CurrencyID', // custom editor (popup)
      'CurrencyRate',
      'IsCheckPrice',
      'IsImport', // checkbox editor
      'SupplierSaleID', // supplierEditor (popup)
      'DateExpected',
      'DateRequest',
      'DatePriceQuote',
      'LeadTime',
      'TotalDayLeadTime', // number editor
      'TotalPriceExchange',
      'HistoryPrice', // moneyEditor
      'TotalImportPrice'
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

    // Danh sách các trường số cần chuyển đổi từ string sang number
    const numericFields = [
      'ID',
      'EmployeeID',
      'ProjectPartListID',
      'Quantity',
      'UnitPrice',
      'TotalPrice',
      'UnitFactoryExportPrice',
      'UnitImportPrice',
      'TotalImportPrice',
      'VAT',
      'TotaMoneyVAT',
      'CurrencyID',
      'CurrencyRate',
      'TotalPriceExchange',
      'HistoryPrice',
      'SupplierSaleID',
      'TotalDayLeadTime',
      'QuoteEmployeeID',
      'StatusRequest',
      'POKHDetailID',
      'JobRequirementID',
      'ProjectPartlistPriceRequestTypeID',
      'EmployeeIDUnPrice'
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
          } else if (numericFields.includes(key)) {
            // Xử lý đặc biệt cho các trường số: chuyển đổi từ string sang number
            const value = item[key];
            if (value === null || value === undefined || value === '') {
              // Giữ nguyên null/undefined/empty string
              filteredItem[key] = value;
            } else if (typeof value === 'string') {
              // Chuyển đổi string sang number
              const numValue = Number(value);
              filteredItem[key] = isNaN(numValue) ? value : numValue;
            } else {
              // Đã là number hoặc boolean, giữ nguyên
              filteredItem[key] = value;
            }
          } else {
            filteredItem[key] = item[key];
          }
        }
      });

      // Sử dụng định dạng ISO chuẩn cho UpdatedDate
      filteredItem.UpdatedDate = DateTime.local().toISO();
      filteredItem.UpdatedBy = !this.appUserService.isAdmin
        ? this.appUserService.loginName
        : '';

      // Loại bỏ các trường có giá trị null, undefined, hoặc empty string
      const cleanedItem: any = {};
      const requiredFields = ['ID', 'UpdatedDate', 'UpdatedBy']; // Các trường bắt buộc luôn giữ lại

      Object.keys(filteredItem).forEach((key) => {
        const value = filteredItem[key];

        // Luôn giữ lại các trường bắt buộc
        if (requiredFields.includes(key)) {
          cleanedItem[key] = value;
          return;
        }

        // Kiểm tra giá trị hợp lệ
        if (value === null || value === undefined) {
          // Bỏ qua null và undefined
          return;
        }

        // Xử lý chuỗi: loại bỏ empty string và chuỗi chỉ có khoảng trắng
        if (typeof value === 'string') {
          if (value.trim() === '') {
            return; // Bỏ qua empty string
          }
          // Nếu là trường số nhưng vẫn là string, chuyển đổi lại
          if (numericFields.includes(key)) {
            const numValue = Number(value);
            cleanedItem[key] = isNaN(numValue) ? value : numValue;
          } else {
            cleanedItem[key] = value;
          }
          return;
        }

        // Giữ lại số (kể cả 0), boolean (kể cả false), và các object/array hợp lệ
        if (
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          (typeof value === 'object' && value !== null) ||
          Array.isArray(value)
        ) {
          cleanedItem[key] = value;
        }
      });

      return cleanedItem;
    });

    console.log('Dữ liệu đã lọc:', filteredData);

    this.SaveDataCommon(filteredData, 'Dữ liệu đã được lưu.', onSuccess);
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

  /**
   * Chuẩn hóa các trường ngày tháng về ISO format để Tabulator formatter xử lý
   * Không format thành dd/MM/yyyy vì formatter của Tabulator sẽ xử lý việc này
   */
  private formatDateFields(data: any[]): any[] {
    if (!data || !Array.isArray(data)) {
      return data;
    }

    const dateFields = ['DateRequest', 'DateExpected', 'DateHistoryPrice', 'LeadTime', 'DatePriceQuote'];

    return data.map((row: any) => {
      const formattedRow = { ...row };
      dateFields.forEach((field) => {
        if (formattedRow[field]) {
          try {
            let dateValue: DateTime | null = null;

            // Nếu là string, thử parse
            if (typeof formattedRow[field] === 'string') {
              // Nếu đã là ISO format hoặc empty string, giữ nguyên
              if (formattedRow[field].trim() === '') {
                formattedRow[field] = '';
                return;
              }

              // Thử ISO format trước
              dateValue = DateTime.fromISO(formattedRow[field]);
              if (!dateValue.isValid) {
                // Thử các format khác và chuyển về ISO
                const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                for (const format of formats) {
                  dateValue = DateTime.fromFormat(formattedRow[field], format);
                  if (dateValue.isValid) break;
                }
              }
            } else if (formattedRow[field] instanceof Date) {
              // Nếu là Date object, chuyển về ISO
              dateValue = DateTime.fromJSDate(formattedRow[field]);
            }

            // Chuyển về ISO format để formatter của Tabulator xử lý
            if (dateValue && dateValue.isValid) {
              formattedRow[field] = dateValue.toISO();
            }
            // Nếu không parse được, giữ nguyên giá trị
          } catch (e) {
            // Nếu có lỗi, giữ nguyên giá trị
            console.warn(`Không thể chuẩn hóa ${field}:`, formattedRow[field], e);
          }
        }
      });
      return formattedRow;
    });
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
      const dateExpected = this.AddWeekdays(
        DateTime.local().toJSDate(),
        leadTime
      );
      // Chuyển đổi Date thành ISO string để Tabulator hiển thị đúng
      rowData.DateExpected = DateTime.fromJSDate(dateExpected).toISO();
    }
  }

  // Map để track các row đã được cập nhật thông qua update() (không được Tabulator tự động đánh dấu là edited)
  private editedRowsMap: Map<number, Map<number, any>> = new Map(); // Map<tabId, Map<rowId, rowData>>

  HandleCellEdited(cell: any) {
    const row = cell.getRow();
    const data = row.getData();
    const field = cell.getField();
    const newValue = cell.getValue();

    // Lấy table hiện tại
    const table = this.tables.get(this.activeTabId);
    if (!table) return;

    // Track row đang được edit
    const currentRowId = Number(data['ID']);
    if (currentRowId > 0) {
      if (!this.editedRowsMap.has(this.activeTabId)) {
        this.editedRowsMap.set(this.activeTabId, new Map());
      }
      this.editedRowsMap.get(this.activeTabId)!.set(currentRowId, data);
    }

    // Kiểm tra xem có dòng nào được chọn không
    const selectedRows = table.getSelectedRows() || [];
    const hasSelectedRows = selectedRows.length > 0;

    // Kiểm tra xem dòng đang được edit có nằm trong danh sách các dòng được chọn không
    const isCurrentRowSelected = hasSelectedRows && selectedRows.some((selectedRow: any) => {
      return Number(selectedRow.getData()['ID']) === currentRowId;
    });

    // Chỉ cập nhật các dòng được chọn nếu dòng đang edit cũng nằm trong danh sách được chọn
    if (hasSelectedRows && isCurrentRowSelected) {
      // Cập nhật tất cả các dòng đã chọn với giá trị mới (trừ dòng đang edit)
      selectedRows.forEach((selectedRow: any) => {
        const rowData = selectedRow.getData();
        const selectedRowId = Number(rowData['ID']);

        // Bỏ qua dòng đang được edit (vì nó đã được Tabulator tự động cập nhật)
        if (selectedRowId === currentRowId) {
          return;
        }

        // Luôn cập nhật giá trị cho tất cả các dòng được chọn (bất kể giá trị có thay đổi hay không)
        // Đảm bảo giá trị được cập nhật đúng kiểu dữ liệu
        const updateData: any = {};
        // Xử lý đặc biệt cho các trường số để đảm bảo kiểu dữ liệu đúng
        if (['HistoryPrice', 'UnitPrice', 'UnitImportPrice', 'UnitFactoryExportPrice', 'VAT', 'Quantity', 'CurrencyRate', 'TotalDayLeadTime'].includes(field)) {
          updateData[field] = typeof newValue === 'number' ? newValue : (Number(newValue) || 0);
        } else {
          updateData[field] = newValue;
        }
        selectedRow.update(updateData);

        // Track row đã được cập nhật
        if (selectedRowId > 0) {
          if (!this.editedRowsMap.has(this.activeTabId)) {
            this.editedRowsMap.set(this.activeTabId, new Map());
          }
          // Lấy dữ liệu mới nhất sau khi update
          const updatedRowData = selectedRow.getData();
          this.editedRowsMap.get(this.activeTabId)!.set(selectedRowId, updatedRowData);
        }
      });

      // Tính toán lại cho TẤT CẢ các dòng được chọn (bao gồm cả dòng đang edit)
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'TotalDayLeadTime'].includes(field)) {
        selectedRows.forEach((selectedRow: any) => {
          this.recalculateRow(selectedRow);
        });
      }
    } else {
      // Nếu không có dòng nào được chọn HOẶC dòng đang edit không nằm trong danh sách được chọn
      // Chỉ tính toán lại cho dòng đang edit
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'TotalDayLeadTime'].includes(field)) {
        this.recalculateRow(row);
      }
    }
  }

  private recalculateRow(row: any) {
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
    // Chuyển đổi Date thành ISO string để Tabulator hiển thị đúng
    const dateExpectedISO = DateTime.fromJSDate(dateexpect).toISO();

    // Cập nhật lại các cột liên quan
    row.update({
      DateExpected: dateExpectedISO, // Chuyển đổi sang ISO string
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

      const row = cell.getRow();
      const rowData = row.getData();
      const totalPrice = this.CalculateTotalPriceExchange(rowData, rate);

      // Lấy table hiện tại
      const table = this.tables.get(this.activeTabId);
      if (!table) return;

      // Kiểm tra xem có dòng nào được chọn không
      const selectedRows = table.getSelectedRows() || [];
      const hasSelectedRows = selectedRows.length > 0;

      // Track row đang được edit
      const currentRowId = Number(rowData['ID']);
      if (currentRowId > 0) {
        if (!this.editedRowsMap.has(this.activeTabId)) {
          this.editedRowsMap.set(this.activeTabId, new Map());
        }
        this.editedRowsMap.get(this.activeTabId)!.set(currentRowId, rowData);
      }

      // Kiểm tra xem dòng đang được edit có nằm trong danh sách các dòng được chọn không
      const isCurrentRowSelected = hasSelectedRows && selectedRows.some((selectedRow: any) => {
        return Number(selectedRow.getData()['ID']) === currentRowId;
      });

      // Chỉ cập nhật các dòng được chọn nếu dòng đang edit cũng nằm trong danh sách được chọn
      if (hasSelectedRows && isCurrentRowSelected) {
        selectedRows.forEach((selectedRow: any) => {
          const selectedRowData = selectedRow.getData();
          const selectedTotalPrice = this.CalculateTotalPriceExchange(selectedRowData, rate);
          const selectedRowId = Number(selectedRowData['ID']);

          selectedRow.update({
            CurrencyID: currency.ID,
            CurrencyRate: currency.CurrencyRate,
            TotalPriceExchange: selectedTotalPrice,
          });

          // Track row đã được cập nhật
          if (selectedRowId > 0) {
            if (!this.editedRowsMap.has(this.activeTabId)) {
              this.editedRowsMap.set(this.activeTabId, new Map());
            }
            const updatedRowData = selectedRow.getData();
            this.editedRowsMap.get(this.activeTabId)!.set(selectedRowId, updatedRowData);
          }
        });
      } else {
        // Nếu không có dòng nào được chọn HOẶC dòng đang edit không nằm trong danh sách được chọn
        // Chỉ cập nhật dòng đang edit
        row.update({
          CurrencyID: currency.ID,
          CurrencyRate: currency.CurrencyRate,
          TotalPriceExchange: totalPrice,
        });
      }
    }
  }
  OnSupplierSaleChanged(cell: any) {
    const supplierId = cell.getValue();
    const supplier = this.dtSupplierSale.find(
      (p: { ID: number }) => p.ID === supplierId
    );

    if (supplier) {
      const row = cell.getRow();

      // Lấy table hiện tại
      const table = this.tables.get(this.activeTabId);
      if (!table) return;

      // Kiểm tra xem có dòng nào được chọn không
      const selectedRows = table.getSelectedRows() || [];
      const hasSelectedRows = selectedRows.length > 0;

      // Track row đang được edit
      const rowData = row.getData();
      const currentRowId = Number(rowData['ID']);
      if (currentRowId > 0) {
        if (!this.editedRowsMap.has(this.activeTabId)) {
          this.editedRowsMap.set(this.activeTabId, new Map());
        }
        this.editedRowsMap.get(this.activeTabId)!.set(currentRowId, rowData);
      }

      // Kiểm tra xem dòng đang được edit có nằm trong danh sách các dòng được chọn không
      const isCurrentRowSelected = hasSelectedRows && selectedRows.some((selectedRow: any) => {
        return Number(selectedRow.getData()['ID']) === currentRowId;
      });

      // Chỉ cập nhật các dòng được chọn nếu dòng đang edit cũng nằm trong danh sách được chọn
      if (hasSelectedRows && isCurrentRowSelected) {
        selectedRows.forEach((selectedRow: any) => {
          const selectedRowData = selectedRow.getData();
          const selectedRowId = Number(selectedRowData['ID']);

          selectedRow.update({
            SupplierSaleID: supplierId,
            CodeNCC: supplier.CodeNCC
          });

          // Track row đã được cập nhật
          if (selectedRowId > 0) {
            if (!this.editedRowsMap.has(this.activeTabId)) {
              this.editedRowsMap.set(this.activeTabId, new Map());
            }
            const updatedRowData = selectedRow.getData();
            this.editedRowsMap.get(this.activeTabId)!.set(selectedRowId, updatedRowData);
          }
        });
      } else {
        // Nếu không có dòng nào được chọn HOẶC dòng đang edit không nằm trong danh sách được chọn
        // Chỉ cập nhật dòng đang edit
        row.update({
          SupplierSaleID: supplierId,
          CodeNCC: supplier.CodeNCC
        });
      }
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

    // Validate dữ liệu trước (chỉ validate khi status = 0 hoặc 2, không validate khi status = 1 hoặc 3)
    const shouldValidate = status !== 1 && status !== 3; // Chỉ validate khi Báo giá (2) hoặc Hủy hoàn thành (0)

    if (shouldValidate) {
      const isAdmin = this.appUserService.isAdmin || false;
      const currentEmployeeID = this.appUserService.employeeID || 0;

      for (const row of selectedRows) {
        const rowData = row.getData();
        const id = Number(rowData['ID']);
        if (id <= 0) continue;

        // Kiểm tra quyền: chỉ validate những sản phẩm của mình (hoặc admin)
        const quoteEmployeeID = Number(rowData['QuoteEmployeeID'] || 0);
        if (quoteEmployeeID !== currentEmployeeID && !isAdmin) {
          continue; // Bỏ qua sản phẩm không phải của mình khi validate
        }

        const productCode = rowData['ProductCode'] || '';
        const currencyId = Number(rowData['CurrencyID'] || 0);
        const currencyRate = Number(rowData['CurrencyRate'] || 0);
        const unitPrice = Number(rowData['UnitPrice'] || 0);
        const supplierSaleId = Number(rowData['SupplierSaleID'] || 0);

        // Lấy currency code để hiển thị trong thông báo lỗi
        let currencyCode = '';
        if (currencyId > 0 && this.dtcurrency) {
          const currency = this.dtcurrency.find((c: any) => c.ID === currencyId);
          currencyCode = currency ? currency.Code : '';
        }

        if (currencyId <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Loại tiền mã sản phẩm [${productCode}]!`
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

        if (supplierSaleId <= 0) {
          this.notification.warning(
            'Thông báo',
            `Vui lòng nhập Nhà cung cấp mã sản phẩm [${productCode}]!`
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

      // Tạo object chỉ chứa các field cần thiết cho API (giống WinForm)
      const quoteData: any = {
        ID: id,
        StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: new Date(),
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
        this.PriceRequetsService.quotePrice(updateData).subscribe({
          next: (response: any) => {
            if (response?.status === 1) {
              this.notification.success('Thông báo', response?.message || `${statusText} thành công!`);
              this.LoadPriceRequests(); // Reload data
            } else {
              this.notification.warning('Thông báo', response?.message || `${statusText} thất bại!`);
            }
          },
          error: (error) => {
            console.error('Error quoting price:', error);
            this.notification.error('Lỗi', error?.error?.message || `Có lỗi xảy ra khi ${statusText}!`);
          },
        });
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

    // Message xác nhận với thông báo đặc biệt khi check giá
    const message = isCheckPrice
      ? '\nNhững sản phẩm đã có NV mua check sẽ tự động được bỏ qua!'
      : '';

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
            QuoteEmployeeID: this.appUserService.employeeID, // Giữ nguyên QuoteEmployeeID hiện tại
            // EmployeeID: this.appUserService.employeeID, // Backend dùng field này để set QuoteEmployeeID mới
            UpdatedBy: this.appUserService.loginName,
            UpdatedDate: DateTime.local().toJSDate(),
          });
        });
        console.log(updateData);
        // Kiểm tra nếu không có dòng nào hợp lệ sau khi validate
        if (updateData.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Không có dữ liệu thay đổi để cập nhật!'
          );
          return;
        }

        // Gọi API check-price (backend sẽ validate thêm một lần nữa)
        this.PriceRequetsService.checkPrice(updateData).subscribe({
          next: (response: any) => {
            if (response?.status === 1 || response?.success) {
              this.notification.success('Thông báo', `${isCheckText} thành công!`);
              this.LoadPriceRequests(); // Reload data
            } else {
              this.notification.warning('Thông báo', `${isCheckText} thất bại!`);
            }
          },
          error: (error) => {
            console.error('Error checking price:', error);
            this.notification.error(
              'Lỗi',
              error?.error?.message || `Có lỗi xảy ra khi ${isCheckText}!`
            );
          },
        });
      },
    });
  }

  RejectPriceRequest(status: number = 5): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;
    const selectedRows = table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn sản phẩm muốn từ chối!'
      );
      return;
    }

    const invalids: string[] = [];
    selectedRows.forEach((row) => {
      const data = row.getData();
      const cur = Number(data['StatusRequest'] || 0);
      // Không thể từ chối nếu đã từ chối (status = 5)
      if (cur === 5) {
        invalids.push(`[${data['ProductCode']}] đã bị từ chối trước đó`);
      }
      // Không thể từ chối nếu đã báo giá (status = 2)
      if (cur === 2) {
        invalids.push(`[${data['ProductCode']}] đã ở trạng thái Đã báo giá, không thể từ chối`);
      }
      // Không thể từ chối nếu đã hoàn thành (status = 3)
      if (cur === 3) {
        invalids.push(`[${data['ProductCode']}] đã hoàn thành, không thể từ chối`);
      }
    });
    if (invalids.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, invalids[0]);
      return;
    }

    this.lastSelectedRowsForReject = selectedRows.map((r) => r.getData());
    this.rejectReason = '';

    this.modal.create({
      nzTitle: 'Từ chối báo giá',
      nzContent: this.rejectReasonTpl,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const reason = (this.rejectReason || '').trim();
        if (!reason) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng nhập lý do từ chối!'
          );
          return false;
        }
        this.performUpdateRejectStatus(status, reason);
        return true;
      },
    });
  }

  CancelRejectPriceRequest(): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;
    const selectedRows = table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn sản phẩm muốn hủy từ chối!'
      );
      return;
    }
    const invalids: string[] = [];
    const listModel = selectedRows.map(row => {
      const data = row.getData();
      const cur = Number(data['StatusRequest'] || 0);
      // Chỉ có thể hủy từ chối nếu status hiện tại = 5 (đã từ chối)
      if (cur !== 5) {
        invalids.push(`[${data['ProductCode']}] chưa bị từ chối`);
      }
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
      nzContent:
        'Bạn có chắc muốn Hủy từ chối danh sách sản phẩm đã chọn không?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = { ListModel: listModel, ListDataMail: [] };
        this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              let message = res?.message || 'Hủy từ chối thành công';
              // Hiển thị thông tin về sản phẩm không hợp lệ nếu có
              if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
                const invalidList = res.invalidProducts.join('\n');
                message += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
              }
              this.notification.success('Thông báo', message);
              this.LoadPriceRequests();
            } else {
              let errorMessage = res?.message || 'Có lỗi xảy ra';
              // Hiển thị danh sách sản phẩm không hợp lệ nếu có
              if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
                const invalidList = res.invalidProducts.join('\n');
                errorMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
              }
              this.notification.warning(NOTIFICATION_TITLE.warning, errorMessage);
            }
          },
          error: (err: any) => {
            const errorMsg = err?.error?.message || 'Có lỗi xảy ra';
            const invalidProducts = err?.error?.invalidProducts;
            let fullMessage = errorMsg;
            if (invalidProducts && Array.isArray(invalidProducts) && invalidProducts.length > 0) {
              const invalidList = invalidProducts.join('\n');
              fullMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
            }
            this.notification.error(NOTIFICATION_TITLE.error, fullMessage);
          }
        });
      },
    });
  }

  private performUpdateRejectStatus(status: number, reason: string): void {
    const listModel = (this.lastSelectedRowsForReject || [])
      .map((data: any) => ({
        ID: Number(data['ID']),
        StatusRequest: status,
        UpdatedBy: this.appUserService.loginName,
        EmployeeIDUnPrice: this.appUserService.employeeID,
        ReasonUnPrice: reason,
      }))
      .filter((x) => x.ID > 0);

    const listDataMail = (this.lastSelectedRowsForReject || [])
      .map((data: any) => ({
        EmployeeID: Number(data['EmployeeID'] || 0),
        ProjectCode: String(data['ProjectCode'] || '').trim(),
        ProductCode: String(data['ProductCode'] || '').trim(),
        ProductName: String(data['ProductName'] || '').trim(),
        Manufacturer: String(
          data['Manufacturer'] || data['Maker'] || ''
        ).trim(),
        UnitCount: String(
          data['Unit'] || data['UnitName'] || data['UnitCount'] || ''
        ).trim(),
        Quantity: Number(data['Quantity'] || 0),
        DateRequest: (() => {
          const v = data['DateRequest'];
          if (!v) return '';
          const d =
            typeof v === 'string'
              ? DateTime.fromISO(v)
              : DateTime.fromJSDate(new Date(v));
          return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
        })(),
        Deadline: (() => {
          const v = data['Deadline'];
          if (!v) return '';
          const d =
            typeof v === 'string'
              ? DateTime.fromISO(v)
              : DateTime.fromJSDate(new Date(v));
          return d.isValid ? d.toFormat('yyyy-MM-dd') : '';
        })(),
      }))
      .filter((x: any) => x.ProductCode);

    const payload = { ListModel: listModel, ListDataMail: listDataMail };
    this.PriceRequetsService.updatePriceRequestStatus(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          let message = res?.message || 'Từ chối báo giá thành công';
          // Hiển thị thông tin về sản phẩm không hợp lệ nếu có
          if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
            const invalidList = res.invalidProducts.join('\n');
            message += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
          }
          this.notification.success('Thông báo', message);
          this.LoadPriceRequests();
        } else {
          let errorMessage = res?.message || 'Có lỗi xảy ra';
          // Hiển thị danh sách sản phẩm không hợp lệ nếu có
          if (res?.invalidProducts && Array.isArray(res.invalidProducts) && res.invalidProducts.length > 0) {
            const invalidList = res.invalidProducts.join('\n');
            errorMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
          }
          this.notification.warning(NOTIFICATION_TITLE.warning, errorMessage);
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra';
        const invalidProducts = err?.error?.invalidProducts;
        let fullMessage = errorMsg;
        if (invalidProducts && Array.isArray(invalidProducts) && invalidProducts.length > 0) {
          const invalidList = invalidProducts.join('\n');
          fullMessage += `\n\nCác sản phẩm không hợp lệ:\n${invalidList}`;
        }
        this.notification.error(NOTIFICATION_TITLE.error, fullMessage);
      }
    });
  }

  OpenRequestBuyModal(): void {
    const table = this.tables.get(this.activeTabId);
    if (!table) return;
    const selectedRows = table.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một dòng để yêu cầu mua.'
      );
      return;
    }
    this.lastSelectedRowsForBuy = selectedRows.map((r) => r.getData());
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
      },
    });
  }

  OpenImportExcel(): void {
    const modalRef = this.ngbModal.open(
      ImportExcelProjectPartlistPriceRequestComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        centered: true,
      }
    );
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
    const d = new Date(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate()
    );
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timeSpan =
      Math.floor((d.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;

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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn Deadline!'
      );
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
      UnitName: String(
        data['Unit'] || data['UnitName'] || data['UnitCount'] || ''
      ).trim(),
      NoteHR: String(
        data['NoteHR'] || data['HRNote'] || data['Note'] || ''
      ).trim(),
    }));

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const stt = i + 1;
      if (!p.ProductCode) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Mã sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }
      if (!p.ProductName) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Tên sản phẩm tại dòng [${stt}]!`
        );
        return false;
      }
      if (!p.UnitName) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập ĐVT tại dòng [${stt}]!`
        );
        return false;
      }
      if (p.Quantity <= 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Vui lòng nhập Số lượng > 0 tại dòng [${stt}]!`
        );
        return false;
      }
    }

    const payload: any = {
      JobRequirementID: this.isVPP
        ? 999999
        : Number(this.jobRequirementID || 0),
      IsVPP: this.isVPP,
      Deadline: deadline,
      EmployeeID: this.appUserService.employeeID,
      ProjectPartlistPriceRequestTypeID:
        this.projectPartlistPriceRequestTypeID > 0
          ? this.projectPartlistPriceRequestTypeID
          : 7,
      Products: products,
    };

    this.PriceRequetsService.requestBuy(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(
            'Thông báo',
            res?.message || 'Yêu cầu mua đã xử lý xong.'
          );
          this.LoadPriceRequests();
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res?.message || 'Có lỗi xảy ra'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Có lỗi xảy ra'
        );
      },
    });

    return true;
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
    let columns = table
      .getColumnDefinitions()
      .filter((col: any) => col.visible !== false);

    // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
    const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
    const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
    if (supplierIndex >= 0 && !codeNCCExists) {
      const codeNCCColumn = {
        title: 'Mã NCC',
        field: 'CodeNCC',
        hozAlign: 'left',
        headerHozAlign: 'center',
        headerSort: false,
        width: 100,
      } as any;
      columns.splice(supplierIndex, 0, codeNCCColumn);
    }

    // Thêm headers
    const headerRow = worksheet.addRow(columns.map((col: any) => col.title));
    headerRow.font = { bold: true, name: 'Tahoma' };
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

        // Xử lý checkbox: true -> "X", false -> ""
        if (col.field === 'IsCheckPrice') {
          return value ? 'X' : '';
        }

        // Format tiền cho các cột số tiền
        if (
          ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
            col.field
          )
        ) {
          const numValue = Number(value) || 0;
          return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(numValue);
        }

        // Format date columns thành dd/MM/yyyy
        if (
          ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(col.field)
        ) {
          if (!value) return '';
          // Xử lý nhiều kiểu dữ liệu date
          let dateValue: DateTime | null = null;
          if (value instanceof Date) {
            dateValue = DateTime.fromJSDate(value);
          } else if (typeof value === 'string') {
            dateValue = DateTime.fromISO(value);
            if (!dateValue.isValid) {
              // Thử các format khác
              const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateValue = DateTime.fromFormat(value, format);
                if (dateValue.isValid) break;
              }
            }
          }
          return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
        }

        // Format VAT và TotalDayLeadTime theo en-US
        if (col.field === 'VAT' || col.field === 'TotalDayLeadTime') {
          if (value === null || value === undefined || value === '') return '';
          const numValue = Number(value) || 0;
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
          }).format(numValue);
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

        if (col.field === 'CodeNCC') {
          // Lấy CodeNCC từ SupplierSaleID
          const supplierId = row['SupplierSaleID'];
          const supplier = this.dtSupplierSale?.find(
            (s: any) => s.ID === supplierId
          );
          return supplier ? (supplier.CodeNCC || '') : '';
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

    // Footer tổng cho toàn bảng
    const totalFooterRowData = columns.map((col: any) => {
      if (!col.bottomCalc) return '';
      const values = data.map((r: any) => Number(r[col.field]) || 0);
      let result: number | string = 0;
      switch (col.bottomCalc) {
        case 'sum':
          result = values.reduce((a: number, b: number) => a + b, 0);
          break;

        case 'avg':
          result = values.length > 0
            ? (
              values.reduce((a: number, b: number) => a + b, 0) /
              values.length
            )
            : 0;
          break;

        case 'count':
          return values.length;

        default:
          return '';
      }

      // Format tiền cho các cột tiền
      if (
        ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
          col.field
        ) && typeof result === 'number'
      ) {
        return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(result);
      }

      return result;
    });

    // Thêm label "Tổng cộng" vào cột đầu tiên
    if (totalFooterRowData.some((val: any) => val !== '')) {
      totalFooterRowData[0] = 'Tổng cộng';
      const totalFooterRow = worksheet.addRow(totalFooterRowData);
      totalFooterRow.font = { bold: true, name: 'Tahoma' };
      totalFooterRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }

    // Set column width từ Tabulator (chuyển đổi từ pixels sang Excel width)
    const tabulatorColumns = table.getColumns();
    worksheet.columns = columns.map((colDef: any, index: number) => {
      let width = 15; // default width

      // Lấy width từ Tabulator column object (width thực tế đang hiển thị)
      const tabulatorCol = tabulatorColumns[index];
      if (tabulatorCol) {
        const actualWidth = tabulatorCol.getWidth();
        if (actualWidth && actualWidth > 0) {
          // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
          width = Math.max(actualWidth / 7, 8); // Minimum width 8
          width = Math.min(width, 50); // Maximum width 50
        }
      }

      // Nếu không lấy được từ Tabulator, thử lấy từ column definition
      if (width === 15 && colDef?.width) {
        let colWidth = colDef.width;
        if (typeof colWidth === 'string') {
          if (colWidth.includes('vh')) {
            colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
          } else {
            colWidth = parseFloat(colWidth) || 15;
          }
        }
        // Chuyển đổi từ pixels sang Excel width
        width = Math.max(colWidth / 7, 8);
        width = Math.min(width, 50);
      }

      return { width };
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

        // Đặt font Tahoma cho tất cả các cell
        if (!cell.font) {
          cell.font = { name: 'Tahoma' };
        } else {
          cell.font = { ...cell.font, name: 'Tahoma' };
        }

        // Căn giữa cho header và wrapText cho tất cả các cell
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else {
          if (!cell.alignment) {
            cell.alignment = { wrapText: true };
          } else {
            cell.alignment = { ...cell.alignment, wrapText: true };
          }
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
    const table = this.tables.get(this.activeTabId);
    if (!table) {
      this.notification.warning('Thông báo', 'Không tìm thấy bảng dữ liệu.');
      return;
    }

    // Lấy dữ liệu từ Map (local pagination) thay vì gọi API
    const rawData = this.allDataByType.get(this.activeTabId) || [];

      if (rawData.length === 0) {
        this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
        return;
      }

    try {
      let columns = table
        .getColumnDefinitions()
        .filter((col: any) => col.visible !== false);

      // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
      const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
      const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
      if (supplierIndex >= 0 && !codeNCCExists) {
        const codeNCCColumn = {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
        } as any;
        columns.splice(supplierIndex, 0, codeNCCColumn);
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách báo giá');

      // Thêm header
      const headerRow = worksheet.addRow(columns.map((col: any) => col.title));
      headerRow.font = { bold: true, name: 'Tahoma' };
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

        groupHeaderRow.font = { bold: true, name: 'Tahoma' };
        groupHeaderRow.alignment = { horizontal: 'left', wrapText: true };

        // Merge cells từ cột A đến cột cuối cùng (dựa trên số cột thực tế)
        const lastColumnLetter = this.getColumnLetter(columns.length);
        worksheet.mergeCells(
          `A${groupHeaderRow.number}:${lastColumnLetter}${groupHeaderRow.number}`
        );

        // Thêm các dòng dữ liệu trong nhóm
        groupRows.forEach((row: any) => {
          const rowData = columns.map((col: any) => {
            const value = row[col.field];

            if (value === null || value === undefined) return '';
            if (typeof value === 'object' && Object.keys(value).length === 0)
              return '';

            // Xử lý checkbox: true -> "X", false -> ""
            if (col.field === 'IsCheckPrice') return value ? 'X' : '';

            // Format tiền cho các cột số tiền
            if (
              ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                col.field
              )
            ) {
              const numValue = Number(value) || 0;
              return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(numValue);
            }

            // Format date columns thành dd/MM/yyyy
            if (
              ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(col.field)
            ) {
              if (!value) return '';
              // Xử lý nhiều kiểu dữ liệu date
              let dateValue: DateTime | null = null;
              if (value instanceof Date) {
                dateValue = DateTime.fromJSDate(value);
              } else if (typeof value === 'string') {
                dateValue = DateTime.fromISO(value);
                if (!dateValue.isValid) {
                  // Thử các format khác
                  const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                  for (const format of formats) {
                    dateValue = DateTime.fromFormat(value, format);
                    if (dateValue.isValid) break;
                  }
                }
              }
              return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
            }

            // Format VAT và TotalDayLeadTime theo en-US
            if (col.field === 'VAT' || col.field === 'TotalDayLeadTime') {
              if (value === null || value === undefined || value === '') return '';
              const numValue = Number(value) || 0;
              return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
              }).format(numValue);
            }

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

            if (col.field === 'CodeNCC') {
              // Lấy CodeNCC từ SupplierSaleID
              const supplierId = row['SupplierSaleID'];
              const supplier = this.dtSupplierSale?.find(
                (s: any) => s.ID === supplierId
              );
              return supplier ? (supplier.CodeNCC || '') : '';
            }

            return value;
          });

          worksheet.addRow(rowData);
        });
      }

      // Footer tổng cho toàn bảng
      const totalFooterRowData = columns.map((col: any) => {
        if (!col.bottomCalc) return '';
        const values = rawData.map((r: any) => Number(r[col.field]) || 0);
        let result: number | string = 0;
        switch (col.bottomCalc) {
          case 'sum':
            result = values.reduce((a: number, b: number) => a + b, 0);
            break;

          case 'avg':
            result = values.length > 0
              ? (
                values.reduce((a: number, b: number) => a + b, 0) /
                values.length
              )
              : 0;
            break;

          case 'count':
            return values.length;

          default:
            return '';
        }

        // Format tiền cho các cột tiền
        if (
          ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
            col.field
          ) && typeof result === 'number'
        ) {
          return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(result);
        }

        return result;
      });

      // Thêm label "Tổng cộng" vào cột đầu tiên
      if (totalFooterRowData.some((val: any) => val !== '')) {
        totalFooterRowData[0] = 'Tổng cộng';
        const totalFooterRow = worksheet.addRow(totalFooterRowData);
        totalFooterRow.font = { bold: true, name: 'Tahoma' };
        totalFooterRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // Set column width từ Tabulator (chuyển đổi từ pixels sang Excel width)
      const tabulatorColumns = table.getColumns();
      worksheet.columns = columns.map((colDef: any, index: number) => {
        let width = 15; // default width

        // Lấy width từ Tabulator column object (width thực tế đang hiển thị)
        const tabulatorCol = tabulatorColumns[index];
        if (tabulatorCol) {
          const actualWidth = tabulatorCol.getWidth();
          if (actualWidth && actualWidth > 0) {
            // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
            width = Math.max(actualWidth / 7, 8); // Minimum width 8
            width = Math.min(width, 50); // Maximum width 50
          }
        }

        // Nếu không lấy được từ Tabulator, thử lấy từ column definition
        if (width === 15 && colDef?.width) {
          let colWidth = colDef.width;
          if (typeof colWidth === 'string') {
            if (colWidth.includes('vh')) {
              colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
            } else {
              colWidth = parseFloat(colWidth) || 15;
            }
          }
          // Chuyển đổi từ pixels sang Excel width
          width = Math.max(colWidth / 7, 8);
          width = Math.min(width, 50);
        }

        return { width };
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

          // Đặt font Tahoma cho tất cả các cell
          if (!cell.font) {
            cell.font = { name: 'Tahoma' };
          } else {
            cell.font = { ...cell.font, name: 'Tahoma' };
          }

          // WrapText cho tất cả các cell
          if (rowNumber === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
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

    // Lấy các tab đang hiển thị
    const visibleTypes = this.getVisibleProjectTypes();

    for (const type of visibleTypes) {
      const projectTypeID = type.ProjectTypeID;
      const table = this.tables.get(projectTypeID);

      // Vẫn tạo sheet cho tab dù không có table hoặc không có dữ liệu
      let columns: any[] = [];
      if (table) {
        columns = table
          .getColumnDefinitions()
          .filter((col: any) => col.visible !== false);
      }

      try {
        // Lấy dữ liệu từ Map (local pagination) thay vì từ table
        const rawData = this.allDataByType.get(projectTypeID) || [];
        
        // Nếu không có columns (không có table), lấy từ table đầu tiên có columns
        if (columns.length === 0 && this.tables.size > 0) {
          const firstTable = Array.from(this.tables.values())[0];
          if (firstTable) {
            columns = firstTable
          .getColumnDefinitions()
          .filter((col: any) => col.visible !== false);
          }
        }

        // Thêm cột CodeNCC ngay trước cột SupplierSaleID nếu chưa có
        const supplierIndex = columns.findIndex((col: any) => col.field === 'SupplierSaleID');
        const codeNCCExists = columns.some((col: any) => col.field === 'CodeNCC');
        if (supplierIndex >= 0 && !codeNCCExists) {
          const codeNCCColumn: any = {
            title: 'Mã NCC',
            field: 'CodeNCC',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerSort: false,
            width: 100,
          };
          columns.splice(supplierIndex, 0, codeNCCColumn);
        }

        const sheetName = (
          type.ProjectTypeName || `Sheet-${projectTypeID}`
        ).replace(/[\\/?*[\]]/g, '');

        // Giới hạn tên sheet tối đa 31 ký tự (Excel limit)
        const finalSheetName = sheetName.substring(0, 31);
        const sheet = workbook.addWorksheet(finalSheetName);

        // Add header row
        if (columns.length > 0) {
        const headerRow = sheet.addRow(columns.map((col: any) => col.title));
        headerRow.font = { bold: true, name: 'Tahoma' };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }

        // Nếu không có dữ liệu, thêm dòng thông báo
        if (!rawData || rawData.length === 0) {
          const noDataRow = sheet.addRow(['Không có dữ liệu']);
          noDataRow.font = { italic: true, name: 'Tahoma' };
          noDataRow.alignment = { horizontal: 'center', vertical: 'middle' };
          // Merge cells nếu có nhiều cột
          if (columns.length > 1) {
            const lastColumnLetter = this.getColumnLetter(columns.length);
            sheet.mergeCells(`A${noDataRow.number}:${lastColumnLetter}${noDataRow.number}`);
          }
        } else {
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
          groupHeader.font = { bold: true, name: 'Tahoma' };
          groupHeader.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFd9edf7' },
          };
          groupHeader.alignment = { wrapText: true };
          // Merge cells từ cột A đến cột cuối cùng
          const lastColumnLetter = this.getColumnLetter(columns.length);
          sheet.mergeCells(
            `A${groupHeader.number}:${lastColumnLetter}${groupHeader.number}`
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

              // Xử lý checkbox: true -> "X", false -> ""
              if (col.field === 'IsCheckPrice' || col.field === 'IsImport') return value ? 'X' : '';

              // Format tiền cho các cột số tiền
              if (
                ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                  col.field
                )
              ) {
                const numValue = Number(value) || 0;
                return numValue === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(numValue);
              }

              // Format date columns thành dd/MM/yyyy
              if (
                ['DatePriceQuote', 'DateRequest', 'Deadline', 'DateExpected', 'DateHistoryPrice', 'LeadTime'].includes(
                  col.field
                )
              ) {
                if (!value) return '';
                // Xử lý nhiều kiểu dữ liệu date
                let dateValue: DateTime | null = null;
                if (value instanceof Date) {
                  dateValue = DateTime.fromJSDate(value);
                } else if (typeof value === 'string') {
                  dateValue = DateTime.fromISO(value);
                  if (!dateValue.isValid) {
                    // Thử các format khác
                    const formats = ['yyyy/MM/dd', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
                    for (const format of formats) {
                      dateValue = DateTime.fromFormat(value, format);
                      if (dateValue.isValid) break;
                    }
                  }
                }
                return dateValue && dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : '';
              }

              // Format VAT và TotalDayLeadTime theo en-US
              if (col.field === 'VAT' || col.field === 'TotalDayLeadTime') {
                if (value === null || value === undefined || value === '') return '';
                const numValue = Number(value) || 0;
                return new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: col.field === 'VAT' ? 2 : 0,
                }).format(numValue);
              }

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
            let result: number | string = 0;
            switch (col.bottomCalc) {
              case 'sum':
                result = values.reduce((a: number, b: number) => a + b, 0);
                break;

              case 'avg':
                result = values.length > 0
                  ? (
                    values.reduce((a: number, b: number) => a + b, 0) /
                    values.length
                  )
                  : 0;
                break;

              default:
                return '';
            }

            // Format tiền cho các cột tiền
            if (
              ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
                col.field
              ) && typeof result === 'number'
            ) {
              return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(result);
            }

            return result;
          });

          const footerRow = sheet.addRow(footerRowData);
          footerRow.font = { bold: true, name: 'Tahoma' };
          footerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' },
          };
          footerRow.alignment = { wrapText: true };
          sheet.addRow([]); // dòng trống giữa nhóm
        }

        // Footer tổng cho toàn bảng
        const totalFooterRowData = columns.map((col: any) => {
          if (!col.bottomCalc) return '';
          const values = rawData.map((r: any) => Number(r[col.field]) || 0);
          let result: number | string = 0;
          switch (col.bottomCalc) {
            case 'sum':
              result = values.reduce((a: number, b: number) => a + b, 0);
              break;

            case 'avg':
              result = values.length > 0
                ? (
                  values.reduce((a: number, b: number) => a + b, 0) /
                  values.length
                )
                : 0;
              break;

            case 'count':
              return values.length;

            default:
              return '';
          }

          // Format tiền cho các cột tiền
          if (
            ['TotalPrice', 'UnitPrice', 'TotaMoneyVAT', 'TotalPriceExchange', 'TotalImportPrice'].includes(
              col.field
            ) && typeof result === 'number'
          ) {
            return result === 0 ? 0 : new Intl.NumberFormat('vi-VN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(result);
          }

          return result;
        });

        // Thêm label "Tổng cộng" vào cột đầu tiên
        if (totalFooterRowData.some((val: any) => val !== '')) {
          totalFooterRowData[0] = 'Tổng cộng';
          const totalFooterRow = sheet.addRow(totalFooterRowData);
          totalFooterRow.font = { bold: true, name: 'Tahoma' };
          totalFooterRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' },
          };
          totalFooterRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        }

        // Set column width từ Tabulator (chuyển đổi từ pixels sang Excel width) - áp dụng cho cả trường hợp có và không có dữ liệu
        let tabulatorColumns: any[] = [];
        if (table) {
          tabulatorColumns = table.getColumns();
        }
        sheet.columns = columns.map((colDef: any, index: number) => {
          let width = 15; // default width

          // Lấy width từ Tabulator column object (width thực tế đang hiển thị)
          const tabulatorCol = tabulatorColumns[index];
          if (tabulatorCol) {
            const actualWidth = tabulatorCol.getWidth();
            if (actualWidth && actualWidth > 0) {
              // Chuyển đổi từ pixels sang Excel width (1 pixel ≈ 0.14 Excel units, hoặc width/7)
              width = Math.max(actualWidth / 7, 8); // Minimum width 8
              width = Math.min(width, 50); // Maximum width 50
            }
          }

          // Nếu không lấy được từ Tabulator, thử lấy từ column definition
          if (width === 15 && colDef?.width) {
            let colWidth = colDef.width;
            if (typeof colWidth === 'string') {
              if (colWidth.includes('vh')) {
                colWidth = parseFloat(colWidth.replace('vh', '')) * 2;
              } else {
                colWidth = parseFloat(colWidth) || 15;
              }
            }
            // Chuyển đổi từ pixels sang Excel width
            width = Math.max(colWidth / 7, 8);
            width = Math.min(width, 50);
          }

          return { width };
        });

        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            // Đặt font Tahoma cho tất cả các cell
            if (!cell.font) {
              cell.font = { name: 'Tahoma' };
            } else {
              cell.font = { ...cell.font, name: 'Tahoma' };
            }
            // WrapText cho tất cả các cell
            if (!cell.alignment) {
              cell.alignment = { wrapText: true };
            } else {
              cell.alignment = { ...cell.alignment, wrapText: true };
            }
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
        next: (response: any) => {
          if (response?.status === 0) {
            this.notification.warning(
              'Thông báo',
              response.message || 'Không thể tải file!'
            );
            return;
          }

          const fileUrl = response?.data || response;
          if (!fileUrl || typeof fileUrl !== 'string') {
            this.notification.warning(
              'Thông báo',
              'Không tìm thấy đường dẫn file!'
            );
            return;
          }

          // Mở URL trong tab mới
          window.open(fileUrl, '_blank');
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
      left: `${rect.left + window.pageXOffset}px`,
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

  // Sửa lại hàm ToggleSearchPanel - responsive và đảm bảo hoạt động trên mọi thiết bị
  ToggleSearchPanelNew(event?: Event) {
    // Ngăn chặn event bubbling và default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    // Chạy trong NgZone để đảm bảo change detection hoạt động
    this.ngZone.run(() => {
      const isMobile = window.innerWidth <= 768;
      const wasOpen = this.showSearchBar;

      // Toggle state một cách rõ ràng và đảm bảo không bị conflict
      // Sử dụng giá trị boolean rõ ràng thay vì toggle trực tiếp
      const newState = !wasOpen;
      this.showSearchBar = newState;
      
      // Log để debug (có thể xóa sau)
      console.log('ToggleSearchPanelNew:', { 
        wasOpen, 
        newState, 
        showSearchBar: this.showSearchBar,
        isHRDept: this.isHRDept,
        willShow: this.showSearchBar && !this.isHRDept
      });
      
      // Force change detection ngay lập tức bằng nhiều cách
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.appRef.tick(); // Force application-wide change detection
      
      // Đảm bảo change detection được trigger bằng nhiều cách
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            this.appRef.tick();
            // Force một lần nữa sau khi DOM cập nhật
            setTimeout(() => {
              this.cdr.detectChanges();
              this.appRef.tick();
            }, 10);
          });
        }, 0);
      });

      // Xử lý body scroll trên mobile
      if (isMobile) {
        if (this.showSearchBar) {
          // Ngăn body scroll khi modal mở
          document.body.style.overflow = 'hidden';
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
        } else {
          // Khôi phục body scroll khi modal đóng
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
        }
      }
      
      // Resize tất cả các bảng sau khi toggle filter bar
      // Đợi một chút để DOM cập nhật xong
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.resizeAllTables();
            // Force change detection lại sau khi resize
            this.cdr.detectChanges();
          });
        }, 150);
      });
      
      // Force change detection để đảm bảo UI cập nhật ngay lập tức
      // Sử dụng requestAnimationFrame để đảm bảo render đúng trên mọi thiết bị
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          this.ngZone.run(() => {
            // Scroll về đầu trang nếu cần (trên mobile khi mở)
            if (isMobile && this.showSearchBar && !wasOpen) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // Force change detection một lần nữa sau khi animation
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          });
        });
      });
    });
  }

  /**
   * Resize một bảng cụ thể
   */
  private resizeTableForType(typeId: number): void {
    const table = this.tables.get(typeId);
    if (!table) return;

    try {
      const container = document.getElementById(`datatable-${typeId}`);
      if (!container) return;

      // Lấy container cha
      const tableContainer = container.closest('.table-container');
      const tabPane = container.closest('.tab-pane');
      const tabContent = container.closest('.tab-content');
      
      if (tableContainer && tabPane && tabContent) {
        // Tính toán chiều cao dựa trên viewport
        const viewportHeight = window.innerHeight;
        const cardHeader = document.querySelector('.card-header');
        const cardHeaderHeight = cardHeader?.clientHeight || 0;
        
        // Lấy chiều cao filter bar nếu đang hiển thị
        let filterBarHeight = 0;
        if (this.showSearchBar) {
          const filterBar = document.querySelector('.filter-bar');
          filterBarHeight = filterBar?.clientHeight || 0;
        }
        
        // Lấy chiều cao tabs
        const tabs = document.querySelector('.nav-tabs');
        const tabsHeight = tabs?.clientHeight || 0;
        
        // Padding và margin
        const padding = 40; // Padding của các container
        
        // Tính chiều cao còn lại cho bảng
        const availableHeight = viewportHeight - cardHeaderHeight - filterBarHeight - tabsHeight - padding;
        
        if (availableHeight > 200) {
          table.setHeight(availableHeight);
          table.redraw(true);
        } else {
          // Fallback: sử dụng chiều cao của tab pane
          const tabPaneHeight = tabPane.clientHeight || 0;
          if (tabPaneHeight > 0) {
            table.setHeight(tabPaneHeight - 20);
            table.redraw(true);
          }
        }
      }
    } catch (error) {
      console.warn(`Error resizing table for type ${typeId}:`, error);
    }
  }

  /**
   * Resize tất cả các bảng để phù hợp với chiều cao container mới
   */
  private resizeAllTables(): void {
    // Đợi DOM cập nhật xong
    setTimeout(() => {
      this.tables.forEach((table, typeId) => {
        this.resizeTableForType(typeId);
      });
    }, 200); // Đợi 200ms để DOM cập nhật xong
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
  private GetTableConfig(): any {
    return {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      // Không set height cố định, để tính toán động dựa trên container
      // height sẽ được set trong resizeAllTables()
      
      // Local pagination
      paginationMode: 'local',
      pagination: true,
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100],
      paginationInitialPage: 1,
      // langs: {
      //   vi: {
      //     pagination: {
      //       first: '<<',
      //       last: '>>',
      //       prev: '<',
      //       next: '>',
      //     },
      //   },
      // },
      // locale: 'vi',
      columnCalcs: 'both',
      groupBy: 'ProjectFullName',
      groupHeader: function (value: any, count: number, data: any) {
        return `${value} <span>(${count})</span>`;
      },
      rowFormatter: (row: any) => {
        const data = row.getData();
        const isRequestBuy = data['IsRequestBuy'] === true || data['IsRequestBuy'] === 1 || data['IsRequestBuy'] === 'true';
        if (isRequestBuy) {
          row.getElement().style.backgroundColor = '#008000';
          row.getElement().style.color = '#ffffff';
        }
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
          title: 'Check giá',
          field: 'IsCheckPrice',
          hozAlign: 'center',
          headerSort: false,
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''
              } style="pointer-events: none; accent-color: #1677ff;" />`;
          },
          frozen: true,
          width: 50,
        },
        {
          title: 'TT',
          field: 'TT',
          headerHozAlign: 'center',
          frozen: true,
          headerSort: false,

          width: 50,
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
          width: 120,
          headerSort: false,
          formatter: 'textarea',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 120,
          bottomCalc: 'count',
          headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 120,
          headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Hãng',
          field: 'Manufacturer',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 50,
          headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Số lượng',
          field: 'Quantity',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 50,
          headerSort: false,
          bottomCalc: 'sum',
          frozen: true,
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          headerHozAlign: 'center',
          width: 50,
          hozAlign: 'left',
          headerSort: false,
          frozen: true,
        },
        {
          title: 'Trạng thái',
          field: 'StatusRequestText',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 120,
          frozen: true,
          formatter: 'textarea',
        },
        {
          title: 'Người yêu cầu',
          field: 'FullName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 120,
          headerSort: false,
          frozen: true,
          formatter: 'textarea'
        },
        {
          title: 'Sale phụ trách',
          field: 'FullNameSale',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 120,
          headerSort: false,
          frozen: true,
          formatter: 'textarea'
          
        },
        {
          title: 'NV báo giá',
          field: 'QuoteEmployee',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 120,
          headerSort: false,
          
          formatter: 'textarea',
          frozen: true,
        },
        {
          title: 'Ngày yêu cầu',
          field: 'DateRequest',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
          },
          hozAlign: 'center',
          width: 100,
        },
        {
          title: 'Deadline',
          field: 'Deadline',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
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
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
          },
          headerHozAlign: 'center',
          hozAlign: 'center',
          width: 100,
        },
        {
          title: 'Loại tiền',
          field: 'CurrencyID',
          hozAlign: 'left',
          headerSort: false,
          editor: (cell: any, onRendered: any, success: any, cancel: any) => {
            const cellElement = cell.getElement();

            // Toggle: nếu đang mở thì đóng
            if (cellElement.classList.contains('popup-open')) {
              this.tabulatorPopupService.close();
              cancel();
              return document.createElement('div'); // Return dummy element
            }

            // Tạo dummy input để Tabulator không tự động đóng editor
            const dummyInput = document.createElement('input');
            dummyInput.type = 'text';
            dummyInput.style.position = 'absolute';
            dummyInput.style.opacity = '0';
            dummyInput.style.pointerEvents = 'none';
            dummyInput.style.width = '1px';
            dummyInput.style.height = '1px';
            dummyInput.readOnly = true;

            // Ngăn chặn các sự kiện click để tránh xung đột
            const stopPropagation = (e: Event) => {
              e.stopPropagation();
              e.preventDefault();
            };
            
            // Thêm event listeners để ngăn chặn click events
            dummyInput.addEventListener('click', stopPropagation, true);
            dummyInput.addEventListener('mousedown', stopPropagation, true);
            dummyInput.addEventListener('mouseup', stopPropagation, true);

            // Mở popup với delay nhỏ để tránh xung đột với click event
            setTimeout(() => {
              // Kiểm tra lại xem cell vẫn còn tồn tại
              if (!cellElement || !cellElement.isConnected) {
                cancel();
                return;
              }

              // Mở popup với TabulatorPopupService
              this.tabulatorPopupService.open({
                data: this.dtcurrency || [],
                columns: this.currencyColumns,
                searchFields: this.currencySearchFields,
                searchPlaceholder: 'Tìm kiếm loại tiền...',
                height: '300px',
                selectableRows: 1,
                layout: 'fitColumns',
                minWidth: '400px',
                maxWidth: '500px',
                onRowSelected: (selectedCurrency: any) => {
                  // Cập nhật giá trị cell
                  success(selectedCurrency.ID);

                  // Trigger cellEdited để cập nhật tỷ giá
                  setTimeout(() => {
                    const newCell = cell.getTable().getRows().find((row: any) => {
                      return row.getData().ID === cell.getRow().getData().ID;
                    })?.getCell('CurrencyID');
                    if (newCell) {
                      this.OnCurrencyChanged(newCell);
                    }
                  }, 100);

                  // Đóng popup
                  this.tabulatorPopupService.close();
                },
                onClosed: () => {
                  // Xóa class popup-open khi đóng
                  if (cellElement) {
                    cellElement.classList.remove('popup-open');
                  }
                  // Gọi cancel để đóng editor
                  cancel();
                }
              }, cellElement);
            }, 10); // Delay nhỏ để tránh xung đột với click event

            // Focus vào dummy input
            onRendered(() => {
              setTimeout(() => {
                dummyInput.focus();
              }, 50);
            });

            return dummyInput;
          },
          formatter: (cell: any) => {
            const val = cell.getValue();

            return `<div class="d-flex w-100 h-100 justify-content-between align-items-center" style="width: 100%; height: 100%; padding: 4px 8px;"><p class="w-100 m-0">${val ? this.labels[val] : 'Chọn loại tiền'
              }</p> <i class="fas fa-angle-down"></i></div>`;
          },
          cellEdited: (cell: any) => this.OnCurrencyChanged(cell),
          width: 100,
        },
        {
          title: 'Tỷ giá',
          field: 'CurrencyRate',
          headerHozAlign: 'center',
          width: '100',
          hozAlign: 'right',
          headerSort: false,
          formatter: 'money',
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 2,
          },
        },
        {
          title: 'Đơn giá',
          field: 'UnitPrice',
          headerHozAlign: 'center',
          headerSort: false,
          editor: this.moneyEditor.bind(this),
          formatter: 'money',
          hozAlign: 'right',
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
        },
        {
          title: 'Giá lịch sử',
          field: 'HistoryPrice',
          headerHozAlign: 'center',
          headerSort: false,
          editor: this.moneyEditor.bind(this),
          formatter: 'money',
          hozAlign: 'right',
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
        },
        {
          title: 'Ngày báo giá lịch sử',
          field: 'DateHistoryPrice',
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          width: 100,
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
          },
        },
        {
          title: 'Thành tiền chưa VAT',
          field: 'TotalPrice',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: 'money',
          hozAlign: 'right',
          width: 100,
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
        },
        {
          title: 'Thành tiền quy đổi (VNĐ)',
          field: 'TotalPriceExchange',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: 'money',
          hozAlign: 'right',
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          width: 100,
        },
        {
          title: '% VAT',
          field: 'VAT',
          headerHozAlign: 'center',
          headerSort: false,
          editor: 'input',
          width: 100,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '';
            const numValue = Number(value) || 0;
            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(numValue);
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
        },
        {
          title: 'Thành tiền có VAT',
          field: 'TotaMoneyVAT',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: 'money',
          hozAlign: 'right',
          width: 100,
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
        },
        {
          title: 'Mã NCC',
          field: 'CodeNCC',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
          visible: false,
        },
        {
          title: 'Nhà cung cấp',
          field: 'SupplierSaleID',
          headerHozAlign: 'center',
          headerSort: false,
          width: 150,
          hozAlign: 'left',
          editor: this.supplierEditor.bind(this),
          formatter: (cell: any) => {
            const val = cell.getValue();
            const supplier = this.dtSupplierSale.find((s) => s.ID === val);
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${supplier ? supplier.NameNCC : 'Chọn nhà cung cấp'
              }</p> <i class="fas fa-angle-down"></i> <div>`;
          },
          cellEdited: (cell: any) => this.OnSupplierSaleChanged(cell),
        },
        {
          title: 'Lead Time (Ngày làm việc)',
          field: 'TotalDayLeadTime',
          headerHozAlign: 'center',
          hozAlign: 'right',
          headerSort: false,
          bottomCalc: 'sum',
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
          editor: 'number',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '';
            const numValue = Number(value) || 0;
            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(numValue);
          },
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') return '';
            const numValue = Number(value) || 0;
            return new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(numValue);
          },
        },
        {
          title: 'Ngày dự kiến hàng về',
          field: 'DateExpected',
          headerHozAlign: 'center',
          hozAlign: 'center',
          headerSort: false,
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
          },
          width: 100,
        },
        {
          title: 'Ghi chú Pur',
          field: 'Note',
          headerHozAlign: 'center',
          headerSort: false,
          width: 100,
          hozAlign: 'left',
          editor: 'textarea',
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
        },
        {
          title: 'Ghi chú (Người Y/C)',
          field: 'NotePartlist',
          width: 200,
          headerSort: false,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Thông số kỹ thuật',
          field: 'Model',
          headerHozAlign: 'center',
          headerSort: false,
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Mã đặc biệt',
          field: 'SpecialCode',
          headerHozAlign: 'center',
          headerSort: false,
          hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Hàng nhập khẩu',
          field: 'IsImport',
          headerHozAlign: 'center',
          headerSort: false,
          hozAlign: 'center',
          width: 100,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            // Tạo checkbox với event listener để tránh double toggle
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = checked;
            checkbox.style.cursor = 'pointer';
            checkbox.style.accentColor = '#1677ff';

            checkbox.addEventListener('change', (e: any) => {
              e.stopPropagation();
              const newValue = checkbox.checked;
              cell.setValue(newValue);
              // Gọi trực tiếp HandleCellEdited vì setValue() không tự động trigger cellEdited
              setTimeout(() => {
                this.HandleCellEdited(cell);
              }, 0);
            });

            return checkbox;
          },
          cellClick: (e: any, cell: any) => {
            // Nếu click vào cell (không phải checkbox), toggle giá trị
            if (e.target && e.target.type !== 'checkbox') {
              const currentValue = cell.getValue();
              const newValue = !(currentValue === true || currentValue === 'true' || currentValue === 1 || currentValue === '1');
              cell.setValue(newValue);
              // Gọi trực tiếp HandleCellEdited vì setValue() không tự động trigger cellEdited
              setTimeout(() => {
                this.HandleCellEdited(cell);
              }, 0);
            }
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
        },
        {
          title: 'Đơn giá xuất xưởng',
          field: 'UnitFactoryExportPrice',
          editor: this.moneyEditor.bind(this),
          formatter: 'money',
          headerSort: false,
          headerHozAlign: 'center',
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          width: 100,
          hozAlign: 'right',
        },
        {
          title: 'Đơn giá nhập khẩu',
          field: 'UnitImportPrice',
          editor: this.moneyEditor.bind(this),
          formatter: 'money',
          headerHozAlign: 'center',
          headerSort: false,
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
          width: 100,
          cellEdited: (cell: any) => this.HandleCellEdited(cell),
          hozAlign: 'right',
        },
        {
          title: 'Thành tiền nhập khẩu',
          field: 'TotalImportPrice',
          hozAlign: 'right',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: 'money',
          width: 100,
          formatterParams: {
            thousand: ',',
            decimal: '.',
            precision: 0,
          },
        },
        {
          title: 'Lead Time',
          field: 'LeadTime',
          hozAlign: 'center',
          headerSort: false,
          width: 100,
          headerHozAlign: 'center',
          formatter: function (
            cell: any,
            formatterParams: any[],
            onRendered: any
          ) {
            let value = cell.getValue();
            if (!value) return '';

            // Thử parse từ nhiều format
            let dateTime = DateTime.fromISO(value);
            if (!dateTime.isValid) {
              // Thử các format khác
              const formats = ['dd/MM/yyyy', 'yyyy/MM/dd', 'yyyy-MM-dd', 'MM/dd/yyyy'];
              for (const format of formats) {
                dateTime = DateTime.fromFormat(String(value), format);
                if (dateTime.isValid) break;
              }
            }

            return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : String(value);
          },
        },
        {
          title: 'Lý do xoá',
          field: 'ReasonDeleted',
          hozAlign: 'left',
          width: 100,
          headerHozAlign: 'center',
          headerSort: false,
        },
      ],
    };
  }

  /**
   * Helper function để chuyển số cột thành chữ cái (A, B, C, ..., Z, AA, AB, ...)
   */
  private getColumnLetter(columnNumber: number): string {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return letter;
  }

  /**
   * Đóng modal khi mở dưới dạng modal
   */
  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  /**
   * Cleanup khi component bị destroy
   */
  ngOnDestroy(): void {
    // Hủy tất cả subscriptions đang chờ
    this.cancelAllDataLoading();
    
    // Khôi phục body styles nếu modal đang mở
    if (this.showSearchBar && window.innerWidth <= 768) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }
}
