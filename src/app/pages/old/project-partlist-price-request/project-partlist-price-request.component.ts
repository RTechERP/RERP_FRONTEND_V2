import { DEFAULT_TABLE_CONFIG } from './../../../tabulator-default.config';
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
} from '@angular/core';
import { ProjectPartlistPriceRequestService } from './project-partlist-price-request-service/project-partlist-price-request.service';
import { ProjectPartlistPriceRequestFormComponent } from './project-partlist-price-request-form/project-partlist-price-request-form.component';
import { ImportExcelProjectPartlistPriceRequestComponent } from './import-excel-project-partlist-price-request/import-excel-project-partlist-price-request.component';
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
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AppUserService } from '../../../services/app-user.service';
import { bottom } from '@popperjs/core';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { TabulatorPopupComponent, TabulatorPopupService } from '../../../shared/components/tabulator-popup';
import { ColumnDefinition } from 'tabulator-tables';
import { SupplierSaleDetailComponent } from '../../purchase/supplier-sale/supplier-sale-detail/supplier-sale-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { HorizontalScrollDirective } from '../../../directives/horizontalScroll.directive';

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
    // NSelectComponent,
    NgbModalModule,
    TabulatorPopupComponent,
    ImportExcelProjectPartlistPriceRequestComponent,
    HasPermissionDirective,
    HorizontalScrollDirective
  ],
})
export class ProjectPartlistPriceRequestComponent implements OnInit {
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

  constructor(@Optional() @Inject('tabData') private tabData: any) {
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
      dateEnd: DateTime.local().toJSDate(), // Ngày hiện tại
      statusRequest: 1,
      projectId: 0,
      keyword: '',
      isDeleted: 0,
      projectTypeID: this.activeTabId,
      poKHID: this.poKHID,
      isCommercialProduct: -1,
      isJobRequirement: -1,
    };

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
    if (this.jobRequirementID > 0 || this.isVPP) projectTypeIdHR = -2;
    this.PriceRequetsService.getTypes(employeeID, projectTypeIdHR).subscribe(
      (response) => {
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
                  if (
                    this.tabData &&
                    this.tabData.initialTabId !== null &&
                    this.tabData.initialTabId !== undefined
                  ) {
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
      }
    );
  }

  private LoadAllTablesData(): void {
    // Load dữ liệu cho tất cả các bảng tuần tự
    let delay = 0;
    this.tables.forEach((table) => {
      setTimeout(() => {
        table.setData();
      }, delay);
      delay += 200; // Chờ 200ms giữa mỗi request
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
      let poKHID = 0;
      let isJobRequirement = -1;
      let projectPartlistPriceRequestTypeID = -1;
      let employeeID = 0;

      if (typeId === -1) {
        projectTypeID = -1;
        isCommercialProduct = 1;
        poKHID = this.filters.poKHID;
      } else if (typeId === -2) {
        projectTypeID = -1;
        isJobRequirement = 1;
        isCommercialProduct = -1;
      } else if (typeId === -3) {
        projectPartlistPriceRequestTypeID = 4;
        isCommercialProduct = 0;
        // employeeID = this.appUserService.employeeID ?? 0; // Can be enabled if needed for filtering by employee
      } else if (typeId === 0) {
        isCommercialProduct = 0;
        isJobRequirement = 0;
      }

      // poKHID = 0;

      if (this.jobRequirementID > 0 || this.isVPP) {
        isJobRequirement = 1;
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
        isJobRequirement: isJobRequirement,
        projectPartlistPriceRequestTypeID: projectPartlistPriceRequestTypeID,
        employeeID: employeeID,
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
    if (data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi.');
      return;
    }

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
          cleanedItem[key] = value;
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

    // Nếu có dòng được chọn, cập nhật tất cả các dòng đã chọn
    if (hasSelectedRows) {
      // Cập nhật tất cả các dòng đã chọn với giá trị mới (trừ dòng đang edit)
      selectedRows.forEach((selectedRow: any) => {
        const rowData = selectedRow.getData();
        const currentRowId = Number(rowData['ID']);

        // Bỏ qua dòng đang được edit (vì nó đã được Tabulator tự động cập nhật)
        if (currentRowId === Number(data['ID'])) {
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
        if (currentRowId > 0) {
          if (!this.editedRowsMap.has(this.activeTabId)) {
            this.editedRowsMap.set(this.activeTabId, new Map());
          }
          // Lấy dữ liệu mới nhất sau khi update
          const updatedRowData = selectedRow.getData();
          this.editedRowsMap.get(this.activeTabId)!.set(currentRowId, updatedRowData);
        }
      });

      // Tính toán lại cho TẤT CẢ các dòng được chọn (bao gồm cả dòng đang edit)
      if (['Quantity', 'UnitPrice', 'CurrencyRate', 'UnitImportPrice', 'VAT', 'TotalDayLeadTime'].includes(field)) {
        selectedRows.forEach((selectedRow: any) => {
          this.recalculateRow(selectedRow);
        });
      }
    } else {
      // Nếu không có dòng nào được chọn, chỉ tính toán lại cho dòng đang edit
      this.recalculateRow(row);
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

      // Nếu có dòng được chọn, cập nhật tất cả các dòng đã chọn
      if (hasSelectedRows) {
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
        // Nếu không có dòng nào được chọn, chỉ cập nhật dòng đang edit
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

      // Nếu có dòng được chọn, cập nhật tất cả các dòng đã chọn
      if (hasSelectedRows) {
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
        // Nếu không có dòng nào được chọn, chỉ cập nhật dòng đang edit
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

      // Tạo object chỉ chứa các field cần thiết cho API
      const quoteData: any = {
        ID: id,
        StatusRequest: status === 0 ? 1 : status, // Nếu status = 0 (Hủy hoàn thành) thì set về 1 (Yêu cầu báo giá)
        UpdatedBy: this.appUserService.loginName,
        UpdatedDate: new Date(),
        QuoteEmployeeID: !isAdmin ? currentEmployeeID : (rowData['QuoteEmployeeID'] || 0),
      };

      // Xử lý DatePriceQuote theo logic backend
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
    const columns = table
      .getColumnDefinitions()
      .filter((col: any) => col.visible !== false);

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

      if (!table) continue;

      try {
        // Lấy dữ liệu từ bảng đang hiển thị
        const rawData = table.getData();
        if (!rawData || rawData.length === 0) continue;

        const columns = table
          .getColumnDefinitions()
          .filter((col: any) => col.visible !== false);

        const sheetName = (
          type.ProjectTypeName || `Sheet-${projectTypeID}`
        ).replace(/[\\/?*[\]]/g, '');

        // Giới hạn tên sheet tối đa 31 ký tự (Excel limit)
        const finalSheetName = sheetName.substring(0, 31);
        const sheet = workbook.addWorksheet(finalSheetName);

        // Add header row
        const headerRow = sheet.addRow(columns.map((col: any) => col.title));
        headerRow.font = { bold: true, name: 'Tahoma' };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

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

        // Set column width từ Tabulator (chuyển đổi từ pixels sang Excel width)
        const tabulatorColumns = table.getColumns();
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
  private GetTableConfig(): any {
    return {
      // data: this.dtprojectPartlistPriceRequest,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '96%',

      ajaxURL: 'dummy', // Required but not used with ajaxRequestFunc
      ajaxRequestFunc: (url: string, config: any, params: any) => {
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

        const page = params.page || 1;
        const size = params.size || 25;

        return new Promise((resolve, reject) => {
          this.PriceRequetsService
            .getAllPartlist(
              dateStart,
              dateEnd,
              statusRequest,
              filters.projectId || 0,
              filters.keyword || '',
              filters.isDeleted || 0,
              filters.projectTypeID || 0,
              poKHID,
              isCommercialProduct,
              -1,
              -1,
              0,
              page,
              size
            )
            .subscribe({
              next: (res: any) => {
                // Xử lý response từ API
                const dtData = res?.data?.dtData || [];
                const totalPages = dtData.length > 0 ? dtData[0].TotalPage : 1;

                // Format các trường ngày tháng về dd/MM/yyyy
                const formattedData = this.formatDateFields(dtData);

                // Trả về đúng format mà Tabulator mong đợi
                resolve({
                  data: formattedData,
                  last_page: totalPages,
                });
              },
              error: (err) => {
                console.error('Error loading data:', err);
                reject(err);
              },
            });
        });
      },
      paginationMode: 'remote',
      pagination: true,
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100],
      paginationInitialPage: 1,
      ajaxError: function (xhr: any, textStatus: any, errorThrown: any) {
        console.error('Lỗi AJAX:', textStatus, errorThrown);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
        );
      },
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
          width: 100,
        },
        {
          title: 'TT',
          field: 'TT',
          headerHozAlign: 'center',
          frozen: true,
          headerSort: false,

          width: 70,
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
          width: 150,
          headerSort: false,
          formatter: 'textarea',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          headerHozAlign: 'center',
          frozen: true,
          hozAlign: 'left',
          width: 150,
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
          width: 150,
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
          width: 100,
          headerSort: false,
          bottomCalc: 'sum'
        },
        {
          title: 'ĐVT',
          field: 'Unit',
          headerHozAlign: 'center',
          width: 100,
          hozAlign: 'left',
          headerSort: false,
        },
        {
          title: 'Trạng thái',
          field: 'StatusRequestText',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Người yêu cầu',
          field: 'FullName',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 150,
          headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'Sale phụ trách',
          field: 'FullNameSale',
          headerHozAlign: 'center',
          hozAlign: 'left',
          width: 150,
          headerSort: false,
          formatter: 'textarea'
        },
        {
          title: 'NV báo giá',
          field: 'QuoteEmployee',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 150,
          headerSort: false,
          formatter: 'textarea'
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
                // Optional: xử lý khi popup đóng
              }
            }, cellElement);
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
}
