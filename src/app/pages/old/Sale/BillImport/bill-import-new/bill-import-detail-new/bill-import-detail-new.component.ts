import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  NonNullableFormBuilder,
} from '@angular/forms';

import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Editors,
  Formatters,
  OnClickEventArgs,
} from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  MultipleSelectOption,
  AutocompleterOption,
} from '@slickgrid-universal/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { AppUserService } from '../../../../../../services/app-user.service';
import { ClipboardService } from '../../../../../../services/clipboard.service';
import { BillImportChoseSerialComponent } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.component';
import { BillImportChoseSerialService } from '../../../../bill-import-technical/bill-import-chose-serial/bill-import-chose-serial.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { ProjectService } from '../../../../../project/project-service/project.service';
import { BillReturnComponent } from '../../Modal/bill-return/bill-return.component';
import { BillImportQcDetailComponent } from '../../../bill-import-qc/bill-import-qc-detail/bill-import-qc-detail.component';
import { BillImportQcService } from '../../../bill-import-qc/bill-import-qc-service/bill-import-qc-service.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { log } from 'ng-zorro-antd/core/logger';

interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  Unit: string;
  AddressBox: string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
}

interface BillImport {
  Id?: number;
  BillImportCode: string;
  ReciverID: number;
  Reciver: string;
  DeliverID: number;
  Deliver: string;
  KhoTypeID: number;
  KhoType: string;
  WarehouseID: number;
  BillTypeNew: number;
  SupplierID: number;
  Supplier: string;
  RulePayID: number;
  CreatDate: Date | string | null;
  DateRequest?: Date | string | null;
  DateRequestImport: Date | string | null;
}

@Component({
  selector: 'app-bill-import-detail-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzModalModule,
    NzCheckboxModule,
    NzSpinModule,
    HasPermissionDirective,
    AngularSlickgridModule,
    NzTabsModule,
  ],
  templateUrl: './bill-import-detail-new.component.html',
  styleUrls: ['./bill-import-detail-new.component.css'],
})
export class BillImportDetailNewComponent
  implements OnInit, AfterViewInit, OnDestroy {
  //#region Khai bao
  isLoading: boolean = false;
  isSaving: boolean = false;
  isFormDisabled: boolean = false;
  isApproved: boolean = false;
  activePur: boolean = false;
  isEditPM: boolean = true;
  activeTabIndex: number = 0;

  // Document Import
  dataDocumentImport: any[] = [];
  cbbStatusPur: any = [
    { ID: 1, Name: 'Đã bàn giao' },
    { ID: 2, Name: 'Hủy bàn giao' },
    { ID: 3, Name: 'Không cần' },
  ];

  // SlickGrid Document Import
  angularGridDocument!: AngularGridInstance;
  columnDefinitionsDocument: Column[] = [];
  gridOptionsDocument: GridOption = {};

  // Unique grid ID for this component instance
  gridUniqueId: string = `billImportDetail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  gridDocUniqueId: string = `billImportDocDetail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  dataCbbReciver: any[] = [];
  dataCbbDeliver: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSupplier: any[] = [];
  dataCbbRulePay: any[] = [];
  warehouses: any[] = [];

  productOptions: any[] = [];
  projectOptions: any[] = [];
  deletedDetailIds: number[] = [];

  @Input() id: number = 0;
  @Input() isCheckmode: boolean = false;
  @Input() selectedList: any[] = [];
  @Input() WarehouseCode: string = 'HN';
  @Input() poNCCId: number = 0;
  @Input() warehouseID: number = 0;
  @Input() isEmbedded: boolean = false;
  @Input() createImport: any;
  @Input() dataHistory: any[] = [];
  @Input() groupID: number = 0;

  @Output() saveSuccess = new EventEmitter<void>();

  @Input() newBillImport: BillImport = {
    Id: 0,
    BillImportCode: '',
    ReciverID: 0,
    Reciver: '',
    DeliverID: 0,
    Deliver: '',
    KhoType: '',
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: '',
    CreatDate: new Date(),
    RulePayID: 0,
    DateRequestImport: new Date(),
  };

  cbbStatus: any = [
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];

  // Label động theo loại phiếu
  labelSupplier: string = 'Nhà cung cấp';
  labelDeliver: string = 'Người giao';
  placeholderSupplier: string = 'Chọn nhà cung cấp';
  placeholderDeliver: string = 'Chọn người giao';

  dateFormat = 'dd/MM/yyyy';

  newProductSale: ProductSale = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    AddressBox: '',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
  };

  validateForm: FormGroup;
  private destroy$ = new Subject<void>();

  // SlickGrid
  angularGridDetail!: AngularGridInstance;
  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  dataDetail: any[] = [];

  // Cache for product/project grid collections
  productGridCollection: any[] = [];
  projectGridCollection: any[] = [];

  private isLoadingEditData: boolean = false;
  private initialBillTypeNew: number | null = null;
  private isInitialLoad: boolean = true;
  private warehouseIdHN: number = 0;

  //#endregion

  constructor(
    private fb: NonNullableFormBuilder,
    private modal: NzModalService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private billExportService: BillExportService,
    private billImportService: BillImportServiceService,
    private appUserService: AppUserService,
    private clipboardService: ClipboardService,
    private productSaleService: ProductsaleServiceService,
    private projectService: ProjectService,
    private billImportQcService: BillImportQcService
  ) {
    this.validateForm = this.fb.group({
      BillImportCode: [{ value: '', disabled: true }, [Validators.required]],
      BillTypeNew: [0, [Validators.required]],
      ReciverID: [0, [Validators.required, Validators.min(1)]],
      WarehouseName: [{ value: 'HN', disabled: true }],
      WarehouseID: [0, [Validators.required, Validators.min(1)]],
      SupplierID: [0, [Validators.required, Validators.min(1)]],
      DeliverID: [0, [Validators.required, Validators.min(1)]],
      CreatDate: [null],
      KhoTypeID: [0, [Validators.required, Validators.min(1)]],
      RulePayID: [0, [Validators.required, Validators.min(1)]],
      DateRequestImport: [null],
    });
  }

  //#region Lifecycle hooks
  ngOnInit(): void {
    const trimmed = (this.WarehouseCode || '').trim();
    if (trimmed && trimmed !== '') {
      this.WarehouseCode = trimmed;
    } else {
      this.WarehouseCode = 'HN';
    }

    this.initGridColumns();
    this.initGridOptions();
    this.initDocumentGridColumns();
    this.initDocumentGridOptions();

    this.updateActivePur();

    this.loadWarehouse();
    this.getDataCbbProductGroup();
    this.getDataCbbRulePay();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
    this.loadOptionProject();
    this.loadDocumentImport();

    this.setupFormSubscriptions();
    this.initializeFormData();
  }

  ngAfterViewInit(): void {
    // Grid ready callback handles data loading
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //#endregion

  //#region Form subscriptions
  private setupFormSubscriptions(): void {
    this.validateForm
      .get('BillTypeNew')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((newValue: number) => {
        this.changeStatus();
      });

    this.validateForm
      .get('KhoTypeID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((productGroupId: number) => {
        this.changeProductGroup(productGroupId);
        this.updateReceiverDeliver();
      });

    this.validateForm
      .get('SupplierID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeSuplierSale();
        this.updateReceiverDeliver();
      });

    this.validateForm
      .get('DeliverID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((deliverID: number) => {
        this.updateActivePur();
        this.clearRestrictedFieldsIfNeeded(deliverID);
      });

    this.validateForm
      .get('WarehouseID')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateReceiverDeliver();
      });

    this.validateForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.newBillImport = { ...this.newBillImport, ...values };
      });
  }

  /**
   * Cập nhật quyền sửa StatusPur dựa trên:
   * - Admin: luôn có quyền
   * - Phòng Purchasing (departmentID === 4): luôn có quyền
   * - Người giao (DeliverID === user.id): có quyền
   */
  private updateActivePur(): void {
    const currentDeliverID = this.validateForm.get('DeliverID')?.value || 0;
    const isDeliverer = currentDeliverID === this.appUserService.id;

    const newActivePur =
      this.appUserService.isAdmin ||
      this.appUserService.departmentID === 4 ||
      isDeliverer;

    // Nếu activePur thay đổi, cần reinitialize document columns
    if (this.activePur !== newActivePur) {
      this.activePur = newActivePur;
      this.initDocumentGridColumns();
      // Cập nhật lại columns trong grid nếu grid đã ready
      if (this.angularGridDocument?.slickGrid) {
        this.angularGridDocument.slickGrid.setColumns(this.columnDefinitionsDocument);
        this.angularGridDocument.slickGrid.invalidate();
        this.angularGridDocument.slickGrid.render();
      }
    } else {
      this.activePur = newActivePur;
    }
  }

  private updateReceiverDeliver(): void {
    if (this.isCheckmode && this.id > 0) return;

    const khoTypeId = this.validateForm.controls['KhoTypeID'].value || 0;
    const warehouseId = this.validateForm.controls['WarehouseID'].value || 0;
    const supplierId = this.validateForm.controls['SupplierID'].value || 0;

    if (!khoTypeId || !warehouseId) return;

    const isHCM = String(this.WarehouseCode).toUpperCase().includes('HCM');
    const specialSuppliers = [1175, 16677];

    // Nếu đang load từ history và có dataHistory, không ghi đè DeliverID
    const hasHistoryDeliverer =
      this.dataHistory &&
      this.dataHistory.length > 0 &&
      this.dataHistory[0].UserID;
    const shouldPreserveDeliverer = hasHistoryDeliverer && this.isInitialLoad;

    if (isHCM) {
      this.validateForm.controls['ReciverID'].setValue(
        this.appUserService.id || 0
      );

      if (specialSuppliers.includes(supplierId) && this.warehouseIdHN) {
        this.productSaleService
          .getdataProductGroupWareHouse(khoTypeId, this.warehouseIdHN)
          .subscribe({
            next: (res: any) => {
              const userId = res?.data?.[0]?.UserID || 0;
              if (!shouldPreserveDeliverer) {
                this.validateForm.controls['DeliverID'].setValue(userId);
              }
            },
            error: () => {
              if (!shouldPreserveDeliverer) {
                this.validateForm.controls['DeliverID'].setValue(0);
              }
            },
          });
      } else {
        if (!shouldPreserveDeliverer) {
          this.validateForm.controls['DeliverID'].setValue(0);
        }
      }
    } else {
      this.productSaleService
        .getdataProductGroupWareHouse(khoTypeId, warehouseId)
        .subscribe({
          next: (res: any) => {
            const userId = res?.data?.[0]?.UserID || 0;
            this.validateForm.controls['ReciverID'].setValue(userId);
          },
          error: () => {
            this.validateForm.controls['ReciverID'].setValue(0);
          },
        });
    }
  }

  private clearRestrictedFieldsIfNeeded(deliverID: number): void {
    const canEdit = !(
      this.appUserService.id != deliverID && !this.appUserService.isAdmin
    );

    if (!canEdit && this.dataDetail.length > 0) {
      this.dataDetail = this.dataDetail.map((row: any) => {
        const needsClear =
          row.SomeBill ||
          row.DateSomeBill ||
          row.DPO ||
          row.DueDate ||
          row.TaxReduction ||
          row.COFormE;

        if (needsClear) {
          return {
            ...row,
            SomeBill: '',
            DateSomeBill: null,
            DPO: 0,
            DueDate: null,
            TaxReduction: 0,
            COFormE: 0,
          };
        }
        return row;
      });
      this.refreshGrid();
    }
  }


  private calculateQuantityKeep(
    quantityReal: number,
    quantityRequest: number
  ): number {
    let quantityKeep = quantityReal;

    if (quantityReal > 0 && quantityRequest > 0) {
      quantityKeep = Math.min(quantityReal, quantityRequest);
    }

    return quantityKeep;
  }



  private initializeFormData(): void {
    if (this.poNCCId > 0 && this.newBillImport && this.newBillImport.BillImportCode) {
      // Luồng từ PONCC
      this.initialBillTypeNew = this.newBillImport.BillTypeNew || 4;
      this.isInitialLoad = false;
      this.updateLabels(this.newBillImport.BillTypeNew || 4);
      this.patchDataFromPONCC();
      if (this.newBillImport.KhoTypeID && this.newBillImport.KhoTypeID > 0) {
        this.changeProductGroup(this.newBillImport.KhoTypeID);
      }
    } else if (this.createImport) {
      this.newBillImport.BillTypeNew = 1;
      this.initialBillTypeNew = 1;
      this.validateForm.patchValue({
        BillTypeNew: 1,
        CreatDate: new Date(),
        DateRequestImport: null,
      });
      this.updateLabels(1);
      this.getNewCode();
      this.patchNewBillImportFromHistory();
    } else if (this.isCheckmode && this.id > 0) {
      this.getBillImportByID();
    } else if (!this.newBillImport.Id || this.newBillImport.Id === 0) {
      this.initialBillTypeNew = 0;
      this.isInitialLoad = false;
      this.updateLabels(0);
      this.getNewCode();
    }
  }

  private patchNewBillImportFromHistory(): void {
    if (!this.dataHistory || this.dataHistory.length === 0) return;

    const firstHistory = this.dataHistory[0];
    this.newBillImport.BillImportCode = '';
    this.newBillImport.Deliver = firstHistory.FullName;
    this.newBillImport.DeliverID = firstHistory.UserID;
    this.newBillImport.KhoTypeID = firstHistory.ProductGroupID;
    this.newBillImport.KhoType = firstHistory.ProductGroupName;

    this.validateForm.patchValue(
      {
        BillImportCode: this.newBillImport.BillImportCode,
        DeliverID: this.newBillImport.DeliverID,
        KhoTypeID: this.newBillImport.KhoTypeID,
      },
      { emitEvent: false }
    );

    this.isInitialLoad = false;
    if (this.newBillImport.KhoTypeID) {
      this.changeProductGroup(this.newBillImport.KhoTypeID);
    }
  }

  private patchDataFromPONCC(): void {
    if (!this.newBillImport || !this.newBillImport.BillImportCode) {
      return;
    }

    this.validateForm.patchValue(
      {
        BillImportCode: this.newBillImport.BillImportCode || '',
        BillTypeNew: this.newBillImport.BillTypeNew || 4,
        ReciverID: this.newBillImport.ReciverID || 0,
        WarehouseID: this.newBillImport.WarehouseID || 0,
        SupplierID: this.newBillImport.SupplierID || 0,
        DeliverID: this.newBillImport.DeliverID || 0,
        CreatDate: this.newBillImport.CreatDate
          ? new Date(this.newBillImport.CreatDate)
          : null,
        KhoTypeID: this.newBillImport.KhoTypeID || 0,
        RulePayID: this.newBillImport.RulePayID || 0,
        DateRequestImport: this.newBillImport.DateRequestImport
          ? new Date(this.newBillImport.DateRequestImport)
          : new Date(),
      },
      { emitEvent: false }
    );
  }

  private updateLabels(billTypeNew: number): void {
    if (billTypeNew === 0 || billTypeNew === 4) {
      this.labelSupplier = 'Nhà cung cấp';
      this.labelDeliver = 'Người giao';
      this.placeholderSupplier = 'Chọn nhà cung cấp';
      this.placeholderDeliver = 'Chọn người giao';
    } else if (billTypeNew === 1) {
      this.labelSupplier = 'Bộ phận';
      this.labelDeliver = 'Người trả';
      this.placeholderSupplier = 'Chọn bộ phận';
      this.placeholderDeliver = 'Chọn người trả';
    } else if (billTypeNew === 3) {
      this.labelSupplier = 'Nhà cung cấp';
      this.labelDeliver = 'Người giao';
      this.placeholderSupplier = 'Chọn nhà cung cấp';
      this.placeholderDeliver = 'Chọn người giao';
    } else {
      this.labelSupplier = 'Bộ phận';
      this.labelDeliver = 'Người trả';
      this.placeholderSupplier = 'Chọn bộ phận';
      this.placeholderDeliver = 'Chọn người trả';
    }
  }

  changeStatus(): void {
    const billTypeNew = this.validateForm.get('BillTypeNew')?.value;
    this.updateLabels(billTypeNew);

    if (!this.isCheckmode && this.id === 0) {
      if (billTypeNew === 1) {
        this.validateForm.patchValue({
          CreatDate: new Date(),
          DateRequestImport: null,
        });
      } else if (billTypeNew === 4) {
        this.validateForm.patchValue({
          CreatDate: null,
          DateRequestImport: new Date(),
        });
      } else {
        this.validateForm.patchValue({
          DateRequestImport: new Date(),
        });
      }
      this.getNewCode();
    }
  }

  changeSuplierSale(): void {
    const supplierId = this.validateForm.get('SupplierID')?.value;
    const specialSuppliers = [1175, 16677];
    this.validateForm.patchValue({
      RulePayID: specialSuppliers.includes(supplierId) ? 34 : 0,
    });
  }
  //#endregion

  // Các cột chỉ cho phép edit khi appUserService.id === DeliverID hoặc là Admin
  private deliverOnlyColumns = ['SomeBill', 'DateSomeBill', 'DPO', 'DueDate', 'TaxReduction', 'COFormE'];

  //#region SlickGrid configuration
  initGridOptions(): void {
    this.gridOptionsDetail = {
      enableGridMenu: true,
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      rowHeight: 55,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createFooterRow: false,
      showFooterRow: false,
      forceFitColumns: false,
      frozenColumn: 5,
      enableColumnReorder: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      enableCellMenu: true,
      cellMenu: {
        commandItems: [
          {
            command: 'copy',
            title: 'Sao chép (Copy)',
            iconCssClass: 'fa fa-copy',
            positionOrder: 1,
            action: (_e, args) => {
              this.clipboardService.copy(args.value);
            },
          },
        ],
      },
      enableContextMenu: true,
      contextMenu: {
        commandItems: [
          {
            command: 'requestQC',
            title: 'Yêu cầu QC',
            iconCssClass: 'fas fa-clipboard-check',
            action: () => {
              this.openModalRequestQC();
            },
          },
          {
            command: 'viewQC',
            title: 'Xem yêu cầu QC',
            iconCssClass: 'fas fa-eye',
            action: () => {
              this.onViewBillImportQC();
            },
          },
        ],
      },
    };
  }

  // Helper function to format text with max 3 lines, ellipsis and tooltip
  private formatTextWithTooltip(value: string | null | undefined): string {
    if (!value) return '';
    const escapedValue = String(value).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="cell-multiline" title="${escapedValue}">${escapedValue}</div>`;
  }

  initGridColumns(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'action',
        name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm dòng mới"></i>',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: () => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa dòng"></i></div>`;
        },
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        sortable: true,
        filterable: false,
        formatter: (_row, _cell, _value, _column, dataContext) => {
          const idx =
            this.dataDetail.findIndex((d) => d.id === dataContext.id) + 1;
          return `<span style="display:block; text-align:center;">${idx}</span>`;
        },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductID',
        name: 'Mã hàng',
        field: 'ProductID',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _columnDef, dataContext) => {
          if (!value) return '';
          const productCode = dataContext?.ProductCode || '';
          const productName = dataContext?.ProductName || '';
          if (productCode) {
            const tooltipText = `Mã: ${productCode}\nTên: ${productName}`;
            return `<span title="${tooltipText.replace(/"/g, '&quot;')}">${productCode}</span>`;
          }
          const found = this.productGridCollection.find(
            (x: any) => x.value === Number(value)
          );
          if (found) {
            const tooltipText = `Mã: ${found.ProductCode || ''}\nTên: ${found.ProductName || ''}`;
            return `<span title="${tooltipText.replace(/"/g, '&quot;')}">${found.ProductCode || ''}</span>`;
          }
          return '';
        },
        editor: {
          model: Editors['autocompleter'],
          alwaysSaveOnEnterKey: true,
          editorOptions: {
            minLength: 0,
            forceUserInput: false,
            openSearchListOnFocus: true,
            labelField: 'ProductCode',
            fetch: (searchTerm: string, callback: (items: false | any[]) => void) => {
              const products = this.productGridCollection || [];
              if (!searchTerm || searchTerm.length === 0) {
                callback(products);
              } else {
                const filtered = products.filter((product: any) => {
                  const code = (product.ProductCode || '').toLowerCase();
                  const newCode = (product.ProductNewCode || '').toLowerCase();
                  const name = (product.ProductName || '').toLowerCase();
                  const term = searchTerm.toLowerCase();
                  return code.includes(term) || newCode.includes(term) || name.includes(term);
                });
                callback(filtered);
              }
            },
            renderItem: {
              layout: 'twoRows',
              templateCallback: (item: any) => {
                const code = item?.ProductCode || '';
                const name = item?.ProductName || '';
                const inventory = item?.TotalInventory ?? 0;
                const formattedInventory = new Intl.NumberFormat('vi-VN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(inventory);
                const inventoryColor = inventory < 0 ? '#ff4d4f' : '#52c41a';
                const tooltipText = `Mã: ${code}\nTên: ${name}\nTồn kho: ${formattedInventory}`;
                return `<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding: 4px 0; gap: 8px;" title="${tooltipText.replace(/"/g, '&quot;')}">
                  <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <div style="font-weight: 600; color: #1890ff; word-wrap: break-word; overflow-wrap: break-word;">${code}</div>
                    <div style="font-size: 12px; color: #666; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; max-height: 4.2em;">${name}</div>
                  </div>
                  <div style="text-align: right; min-width: 70px; flex-shrink: 0; font-weight: 500; color: ${inventoryColor}; padding-top: 2px;">${formattedInventory}</div>
                </div>`;
              },
            },
          } as AutocompleterOption,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => this.formatTextWithTooltip(value),
        editor: { model: Editors['text'], maxLength: 250 }, // nvarchar(250)
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 50 }, // nvarchar(50)
      },
      {
        id: 'ProjectCode',
        name: 'Mã theo dự án',
        field: 'ProjectCode',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 150 }, // nvarchar(150)
      },
      {
        id: 'QtyRequest',
        name: 'SL yêu cầu',
        field: 'QtyRequest',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 2 },
      },
      {
        id: 'Qty',
        name: 'SL thực tế',
        field: 'Qty',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 2 },
      },
      {
        id: 'IsNotKeep',
        name: 'Không giữ',
        field: 'IsNotKeep',
        width: 80,
        sortable: true,
        filterable: false,
        cssClass: 'text-center',
        formatter: Formatters['checkmarkMaterial'],
        editor: { model: Editors['checkbox'] },
      },
      {
        id: 'ProjectID',
        name: 'Dự án/Công ty',
        field: 'ProjectID',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          const found = this.projectGridCollection.find(
            (x: any) => x.value === Number(value)
          );
          const code = found?.ProjectCode ?? '';
          return this.formatTextWithTooltip(code);
        },
        editor: {
          model: Editors['singleSelect'],
          collectionOptions: { addBlankEntry: true },
          collection: this.projectGridCollection,
          editorOptions: { filter: true } as MultipleSelectOption,
        },
      },
      {
        id: 'ProjectNameText',
        name: 'Tên dự án/Công ty',
        field: 'ProjectNameText',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => this.formatTextWithTooltip(value),
      },
      {
        id: 'CustomerFullName',
        name: 'Khách hàng',
        field: 'CustomerFullName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => this.formatTextWithTooltip(value),
        editor: { model: Editors['text'], maxLength: 250 }, // nvarchar(250)
      },
      {
        id: 'BillCodePO',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'PONumber',
        name: 'Số POKH',
        field: 'PONumber',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú (PO)',
        field: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => this.formatTextWithTooltip(value),
        editor: { model: Editors['text'] }, // nvarchar(max) - không giới hạn
      },
      {
        id: 'SomeBill',
        name: 'Số hóa đơn',
        field: 'SomeBill',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'], maxLength: 150 }, // nvarchar(150)
      },
      {
        id: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        field: 'DateSomeBill',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        editor: { model: Editors['date'] },
      },
      {
        id: 'DPO',
        name: 'Số ngày công nợ',
        field: 'DPO',
        width: 80,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          return `<span style="display:block; text-align:right;">${value}</span>`;
        },
        editor: { model: Editors['integer'] },
      },
      {
        id: 'DueDate',
        name: 'Ngày tới hạn',
        field: 'DueDate',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        editor: { model: Editors['date'] },
      },
      {
        id: 'TaxReduction',
        name: 'Giảm thuế',
        field: 'TaxReduction',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 0 },
      },
      {
        id: 'COFormE',
        name: 'Chi phí FE',
        field: 'COFormE',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (value === null || value === undefined) return '';
          const formatted = new Intl.NumberFormat('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
          return `<span style="display:block; text-align:right;">${formatted}</span>`;
        },
        editor: { model: Editors['float'], decimal: 0 },
      },
      {
        id: 'CodeMaPhieuMuon',
        name: 'Phiếu mượn',
        field: 'CodeMaPhieuMuon',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `<span style="cursor:pointer; color:#1890ff; text-decoration:underline;" title="Click để xem chi tiết phiếu mượn">${value}</span>`;
        },
      },
      {
        id: 'AddSerial',
        name: '<i class="fas fa-plus" style="color:#52c41a;" title=""></i>',
        field: 'AddSerial',
        width: 40,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: () => {
          return `<div style="text-align:center;"><i class="fas fa-plus" style="cursor:pointer; color:#52c41a;" title="Thêm serial"></i></div>`;
        },
      },
      {
        id: 'StatusQCText',
        name: 'Trạng thái QC',
        field: 'StatusQCText',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'BillImportQCID',
        name: 'BillImportQCID',
        field: 'BillImportQCID',
        width: 120,
        sortable: true,
        filterable: true,
        hidden: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'PONCCDetailID',
        name: 'PONCCDetailID',
        field: 'PONCCDetailID',
        width: 80,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        hidden: true,
      },
    ];
  }

  angularGridDetailReady(angularGrid: AngularGridInstance): void {
    this.angularGridDetail = angularGrid;
    // Đảm bảo DataView dùng 'id' làm idPropertyName
    angularGrid.dataView.setItems([], 'id');

    // Delay để đảm bảo checkbox selector đã được SlickGrid thêm vào
    setTimeout(() => {
      // Hide columns that should not be visible, but preserve checkbox selector
      const hiddenColumnIds = ['PONCCDetailID'];
      const visibleColumns = angularGrid.slickGrid.getColumns().filter(
        (col: any) => col.id === '_checkbox_selector' || !hiddenColumnIds.includes(col.id)
      );
      angularGrid.slickGrid.setColumns(visibleColumns);
    }, 0);

    // Subscribe to header click for add row
    angularGrid.slickGrid.onHeaderClick.subscribe((_e: any, args: any) => {
      this.onGridDetailHeaderClick(_e, args);
    });

    // Subscribe to cell click for delete row
    angularGrid.slickGrid.onClick.subscribe((_e: any, args: any) => {
      this.onGridDetailClick(_e, args);
    });

    // Subscribe to cell change for product selection
    angularGrid.slickGrid.onCellChange.subscribe((_e: any, args: any) => {
      this.onCellChange(args);
    });

    // Subscribe to onBeforeEditCell để chặn edit các cột đặc biệt
    // Các cột: Chi phí FE, Giảm thuế, Ngày tới hạn, Số ngày công nợ, Ngày hóa đơn, Số hóa đơn
    // Chỉ cho phép edit khi appUserService.id === DeliverID hoặc là Admin
    angularGrid.slickGrid.onBeforeEditCell.subscribe((e: any, args: any) => {
      const columnField = args.column?.field;
      // Kiểm tra nếu là cột đặc biệt
      if (columnField && this.deliverOnlyColumns.includes(columnField)) {
        const currentDeliverID = this.validateForm.get('DeliverID')?.value || 0;
        const userId = this.appUserService.id;
        const isAdmin = this.appUserService.isAdmin;
        const isDeliverer = currentDeliverID === userId;
        const canEdit = isAdmin || isDeliverer;

        if (!canEdit) {
          // Chặn edit - hiển thị thông báo và ngăn SlickGrid mở editor
          // this.notification.warning(
          //   'Thông báo',
          //   'Chỉ người giao hàng hoặc Admin mới được phép sửa cột này!'
          // );
          // Ngăn chặn event propagation và return false thông qua SlickEventData
          e.stopImmediatePropagation();
          (e as any).returnValue = false;
          return;
        }
      }
    });

    // If dataDetail already has data, populate the grid
    if (this.dataDetail && this.dataDetail.length > 0) {
      this.angularGridDetail.dataView.setItems(this.dataDetail, 'id');
      this.angularGridDetail.slickGrid.invalidate();
      this.angularGridDetail.slickGrid.render();
    }

    // Resize grid after render and update footer
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateDetailFooter();
    }, 100);
  }

  onGridDetailHeaderClick(e: Event, args: any): void {
    if (this.isApproved) return;

    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;
      if (clickedElement.classList.contains('fa-plus')) {
        this.addNewRow();
      }
    }
  }

  onGridDetailClick(e: Event, args: OnClickEventArgs): void {
    const column = args.grid.getColumns()[args.cell];
    const clickedElement = e.target as HTMLElement;

    if (column.id === 'action' && !this.isApproved) {
      if (clickedElement.classList.contains('fa-trash')) {
        const item = args.grid.getDataItem(args.row);
        this.modal.confirm({
          nzTitle: 'Xác nhận xóa',
          nzContent: `Bạn có chắc chắn muốn xóa dòng này không?`,
          nzOnOk: () => {
            this.deleteRow(item);
          },
        });
      }
    }

    // Handle Add Serial click
    if (column.id === 'AddSerial') {
      if (clickedElement.classList.contains('fa-plus')) {
        const item = args.grid.getDataItem(args.row);
        this.openAddSerialModal(item);
      }
    }

    // Handle Phiếu mượn (CodeMaPhieuMuon) column click
    if (column.id === 'CodeMaPhieuMuon') {
      if (!this.isEditPM) return;
      const item = args.grid.getDataItem(args.row);
      this.openBillReturnModal(item);
    }
  }

  onCellChange(args: any): void {
    const columnDef = this.angularGridDetail.slickGrid.getColumns()[args.cell];

    if (columnDef.field === 'ProductID') {
      const productIdValue = args.item.ProductID;
      let productId: number;
      let selectedProduct: any;

      if (typeof productIdValue === 'object' && productIdValue !== null) {
        productId = productIdValue.value || 0;
        selectedProduct = productIdValue;
        args.item.ProductID = productId;
      } else {
        productId = Number(productIdValue) || 0;
        selectedProduct = this.productGridCollection.find(
          (p: any) => p.value === productId
        );
      }

      if (selectedProduct) {
        args.item.ProductCode = selectedProduct.ProductCode || '';
        args.item.ProductNewCode = selectedProduct.ProductNewCode || '';
        args.item.ProductName = selectedProduct.ProductName || '';
        args.item.Unit = selectedProduct.Unit || '';
      } else {
        args.item.ProductCode = '';
        args.item.ProductNewCode = '';
        args.item.ProductName = '';
        args.item.Unit = '';
      }
      this.angularGridDetail.gridService.updateItem(args.item);
    }

    if (columnDef.field === 'ProjectID') {
      const projectIdValue = args.item.ProjectID;
      let projectId: number;

      if (typeof projectIdValue === 'string') {
        projectId = parseInt(projectIdValue, 10) || 0;
      } else {
        projectId = Number(projectIdValue) || 0;
      }

      args.item.ProjectID = projectId;

      const selectedProject = this.projectGridCollection.find(
        (p: any) => p.value === projectId
      );

      if (selectedProject) {
        args.item.ProjectNameText = selectedProject.ProjectName || selectedProject.label || '';
      } else {
        args.item.ProjectNameText = '';
      }
      this.angularGridDetail.gridService.updateItem(args.item);
      this.angularGridDetail.slickGrid.invalidate();
      this.angularGridDetail.slickGrid.render();
    }

    // Bulk edit logic
    const selectedRows = this.angularGridDetail.slickGrid.getSelectedRows();
    if (selectedRows.length > 1) {
      const field = columnDef.field;
      const isEditingRowSelected = selectedRows.includes(args.row);

      if (isEditingRowSelected) {
        selectedRows.forEach((rowIndex: number) => {
          if (rowIndex !== args.row) {
            const rowItem = this.angularGridDetail.slickGrid.getDataItem(rowIndex);
            if (rowItem) {
              rowItem[field] = args.item[field];

              if (field === 'ProductID') {
                rowItem.ProductCode = args.item.ProductCode;
                rowItem.ProductNewCode = args.item.ProductNewCode;
                rowItem.ProductName = args.item.ProductName;
                rowItem.Unit = args.item.Unit;
              } else if (field === 'ProjectID') {
                rowItem.ProjectNameText = args.item.ProjectNameText;
              }

              this.angularGridDetail.gridService.updateItem(rowItem);
            }
          }
        });
        this.angularGridDetail.slickGrid.invalidate();
      }
    }

    // Calculate DueDate when DateSomeBill or DPO changes
    if (columnDef.field === 'DateSomeBill' || columnDef.field === 'DPO') {
      this.calculateDueDate(args.item);
    }

    if (columnDef.field === 'ProductID' || columnDef.field === 'Qty') {
      this.updateDetailFooter();
    }
  }

  private calculateDueDate(item: any): void {
    const dateSomeBill = item.DateSomeBill;
    const dpo = parseInt(item.DPO) || 0;

    if (dateSomeBill && dpo > 0) {
      const someBillDate = new Date(dateSomeBill);
      const dueDate = new Date(someBillDate);
      dueDate.setDate(dueDate.getDate() + dpo);
      item.DueDate = dueDate;
    } else {
      item.DueDate = null;
    }
    this.angularGridDetail.gridService.updateItem(item);
  }

  addNewRow(): void {
    const tempIds = this.dataDetail
      .filter((x) => Number(x?.id) < 0)
      .map((x) => Math.abs(Number(x?.id)));
    const nextTempId = tempIds.length > 0 ? Math.max(...tempIds) + 1 : 1;

    const newRow = {
      id: -nextTempId,
      ID: 0,
      ProductID: 0,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      Unit: '',
      QtyRequest: 0,
      Qty: 0,
      IsNotKeep: false,
      ProjectID: 0,
      ProjectCode: '',
      ProjectNameText: '',
      CustomerFullName: '',
      BillCodePO: '',
      PONumber: '',
      Note: '',
      SomeBill: '',
      DateSomeBill: null,
      DPO: 0,
      DueDate: null,
      TaxReduction: 0,
      COFormE: 0,
      SerialNumber: '',
      PONCCDetailID: 0,
    };

    this.dataDetail = [...this.dataDetail, newRow];
    this.refreshGrid();
    setTimeout(() => this.updateDetailFooter(), 0);
  }

  deleteRow(item: any): void {
    const rowId = item?.id;
    if (rowId !== undefined && rowId !== null) {
      if (item?.ID > 0) {
        this.deletedDetailIds.push(item.ID);
      }
      this.dataDetail = this.dataDetail.filter(
        (x) => Number(x?.id) !== Number(rowId)
      );
      this.refreshGrid();
      setTimeout(() => this.updateDetailFooter(), 0);
    }
  }

  refreshGrid(): void {
    if (this.angularGridDetail?.dataView) {
      // Lưu lại selected rows trước khi refresh
      const selectedRows = this.angularGridDetail.slickGrid?.getSelectedRows() || [];
      const selectedIds = selectedRows.map(rowIndex => {
        const item = this.angularGridDetail.slickGrid.getDataItem(rowIndex);
        return item?.id;
      }).filter(id => id != null);

      // Refresh data
      this.angularGridDetail.dataView.setItems(this.dataDetail, 'id');
      this.angularGridDetail.slickGrid?.invalidate();
      this.angularGridDetail.slickGrid?.render();

      // Restore selected rows dựa trên id
      if (selectedIds.length > 0) {
        setTimeout(() => {
          const rowsToSelect: number[] = [];
          this.dataDetail.forEach((item: any, index: number) => {
            if (selectedIds.includes(item.id)) {
              rowsToSelect.push(index);
            }
          });
          if (rowsToSelect.length > 0) {
            this.angularGridDetail.slickGrid?.setSelectedRows(rowsToSelect);
          }
        }, 0);
      }
    }
  }

  openAddSerialModal(rowData: any): void {
    // 1. Validate dữ liệu dòng
    if (!rowData || !rowData.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng lưu dòng trước khi chọn Serial!'
      );
      return;
    }

    // 2. Kiểm tra phiếu đã được duyệt chưa
    if (this.isApproved) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Phiếu đã được duyệt, không thể chỉnh sửa Serial!'
      );
      return;
    }

    // 3. Lấy thông tin từ dòng
    const quantity = rowData.Qty || 0;
    const productCode = rowData.ProductID || '';
    const serialIDsRaw = rowData.SerialNumber;
    const type = 1; // Type 1 cho Bill Import

    // 4. Validate số lượng
    if (quantity <= 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập số lượng nhập lớn hơn 0 trước khi chọn Serial!'
      );
      return;
    }

    // 5. Định nghĩa hàm phụ để mở modal
    const openModal = (existingSerials: { ID: number; Serial: string }[]) => {
      const modalRef = this.modalService.open(BillImportChoseSerialComponent, {
        size: 'md',
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });

      // Truyền dữ liệu vào component modal
      modalRef.componentInstance.quantity = quantity;
      modalRef.componentInstance.productCode = productCode;
      modalRef.componentInstance.existingSerials = existingSerials;
      modalRef.componentInstance.type = type;
      modalRef.componentInstance.dataBillDetail = rowData;
      modalRef.componentInstance.isBillImport = true;

      // Xử lý kết quả từ modal
      modalRef.result.then(
        (result) => {
          if (result) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Đã lưu Serial thành công!'
            );
            // Reload dữ liệu nếu cần
            if (this.id > 0) {
              this.getBillImportDetailID();
            }
          }
        },
        (reason) => {
          console.log('Serial modal dismissed:', reason);
        }
      );
    };

    // 6. Kiểm tra và fetch serial hiện có
    if (serialIDsRaw && typeof serialIDsRaw === 'string') {
      const serialIDs = serialIDsRaw
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id) && id > 0);

      if (serialIDs.length === 0) {
        openModal([]);
        return;
      }

      // Fetch serial từ API
      const payload = { Ids: serialIDs, Type: type };
      this.billExportService.getSerialByIDs(payload).subscribe({
        next: (res) => {
          if (res?.status === 1 && res.data) {
            const existingSerials = res.data.map((item: any) => ({
              ID: item.ID,
              Serial: item.SerialNumber || item.Serial || '',
            }));
            openModal(existingSerials);
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Không tải được serial!'
            );
            openModal([]);
          }
        },
        error: (err) => {
          console.error('Error loading serial:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Lỗi khi tải serial!'
          );
          openModal([]);
        },
      });
    } else {
      openModal([]);
    }
  }

  private updateDetailFooter(): void {
    const grid = this.angularGridDetail?.slickGrid;
    if (!grid) return;

    const rows = this.dataDetail || [];
    const countProduct = rows.filter(
      (x: any) => Number(x?.ProductID || 0) > 0
    ).length;

    const sumQty = rows.reduce(
      (acc: number, x: any) => acc + (Number(x?.Qty) || 0),
      0
    );

    const formattedQty = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(sumQty);

    const footerData: any = {
      ProductID: `<div style="text-align:right; font-weight:600;">${countProduct}</div>`,
      Qty: `<div style="text-align:right; font-weight:600;">${formattedQty}</div>`,
    };

    const columns = grid.getColumns();
    columns.forEach((col: any) => {
      if (footerData[col.id] !== undefined) {
        const footerElm = grid.getFooterRowColumn(col.id);
        if (footerElm) {
          footerElm.innerHTML = footerData[col.id];
        }
      }
    });
  }
  //#endregion

  //#region API calls
  private loadWarehouse(): void {
    this.billImportService.getWarehouse().subscribe((res: any) => {
      const list = res.data || [];
      this.warehouses = list;
      const currentWarehouse = list.find(
        (item: any) =>
          String(item.WarehouseCode).toUpperCase() ===
          String(this.WarehouseCode).toUpperCase()
      );
      const currentId = currentWarehouse?.ID ?? 0;

      const hnId =
        list.find((item: any) =>
          String(item.WareHouseCode).toUpperCase().includes('HN')
        )?.ID ?? 1;

      this.validateForm.controls['WarehouseID'].setValue(currentId);
      this.validateForm.controls['WarehouseName'].setValue(
        currentWarehouse?.WarehouseName || this.WarehouseCode
      );
      this.validateForm.controls['WarehouseID'].disable();

      this.warehouseIdHN = hnId;

      if (!this.dataHistory || this.dataHistory.length === 0) {
        this.validateForm.controls['DeliverID'].setValue(
          this.appUserService.id || 0
        );
      }
    });
  }

  getBillImportByID(): void {
    this.isLoading = true;
    this.billImportService.getBillImportByID(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillImport = {
            Id: data.ID,
            BillImportCode: data.BillImportCode,
            Reciver: data.Reciver,
            Deliver: data.Deliver,
            KhoType: data.KhoType,
            Supplier: data.Suplier,
            ReciverID: data.ReciverID,
            DeliverID: data.DeliverID,
            KhoTypeID: data.KhoTypeID,
            WarehouseID: data.WarehouseID,
            BillTypeNew: data.BillTypeNew,
            SupplierID: data.SupplierID,
            CreatDate: data.CreatDate ? new Date(data.CreatDate) : null,
            DateRequest: data.DateRequestImport
              ? new Date(data.DateRequestImport)
              : null,
            DateRequestImport: data.DateRequestImport
              ? new Date(data.DateRequestImport)
              : null,
            RulePayID: data.RulePayID,
          };

          if (
            data &&
            (data.Status === true || data.Status === 1) &&
            !this.appUserService.isAdmin
          ) {
            this.isApproved = true;
          }

          this.initialBillTypeNew = data.BillTypeNew;

          this.validateForm.patchValue(this.newBillImport, {
            emitEvent: false,
          });

          this.updateLabels(data.BillTypeNew);
          this.isInitialLoad = false;
          this.changeProductGroup(this.validateForm.get('KhoTypeID')?.value);
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể lấy thông tin phiếu nhập!'
          );
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy thông tin!'
        );
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  getProductById(productId: number): void {
    this.productSaleService.getDataProductSalebyID(productId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const product = res.data;
          if (!this.productOptions.find((p: any) => p.value === product.ID)) {
            this.productOptions.push({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductNewCode: product.ProductNewCode,
            });
            this.productGridCollection = [...this.productOptions];
            this.refreshGrid();
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi khi lấy thông tin sản phẩm!'
        );
      },
    });
  }

  getProjectById(projectId: number): void {
    this.projectService.getProject(projectId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const project = res.data;
          if (!this.projectOptions.find((p: any) => p.value === project.ID)) {
            this.projectOptions.push({
              label: project.ProjectCode ? `${project.ProjectCode} - ${project.ProjectName}` : project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
              ProjectName: project.ProjectName,
            });
            this.projectGridCollection = [...this.projectOptions];
            this.refreshGrid();
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi lấy thông tin dự án!');
      },
    });
  }

  getBillImportDetailID(): void {
    this.isLoading = true;
    this.billImportService.getBillImportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];

          this.dataDetail = rawData.map((item: any, index: number) => {
            const productInfo =
              this.productOptions.find(
                (p: any) => p.value === item.ProductID
              ) || {};

            return {
              id: item.ID > 0 ? item.ID : -(index + 1),
              ID: item.ID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode:
                item.ProductNewCode || productInfo.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo.ProductCode || '',
              ProductName: item.ProductName || productInfo.ProductName || '',
              Unit: item.Unit || '',
              QtyRequest: item.QtyRequest || 0,
              Qty: item.Qty || 0,
              IsNotKeep: item.IsNotKeep || false,
              ProjectID: item.ProjectID || 0,
              ProjectCode: item.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || '',
              CustomerFullName: item.CustomerFullName || '',
              BillCodePO: item.BillCodePO || '',
              PONumber: item.PONumber || '',
              Note: item.Note || '',
              SomeBill: item.SomeBill || '',
              DateSomeBill: item.DateSomeBill
                ? new Date(item.DateSomeBill)
                : null,
              DPO: item.DPO || 0,
              DueDate: item.DueDate ? new Date(item.DueDate) : null,
              TaxReduction: item.TaxReduction || 0,
              COFormE: item.COFormE || 0,
              SerialNumber: item.SerialNumber || '',
              PONCCDetailID: item.PONCCDetailID || 0,
              BillImportQCID: item.BillImportQCID || null,
              StatusQCText: item.StatusQCText || '',
              DealineQC: item.DealineQC || null,
              Overdue: item.Overdue || null,
            };
          });

          this.refreshGrid();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu nhập!'
        );
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  changeProductGroup(productGroupId: number): void {
    if (!productGroupId || productGroupId <= 0) return;

    this.billImportService
      .getProductOption(1, productGroupId)
      .subscribe({
        next: (res: any) => {
          const products = res.data || [];
          this.productOptions = products
            .filter((p: any) => p.ID > 0)
            .map((p: any) => ({
              label: p.ProductName,
              value: p.ID,
              ProductCode: p.ProductCode,
              ProductNewCode: p.ProductNewCode,
              ProductName: p.ProductName,
              Unit: p.Unit,
              TotalInventory: p.TotalQuantityLast || 0,
            }));

          this.productGridCollection = [...this.productOptions];

          // Update editor collection
          const productCol = this.columnDefinitionsDetail.find(
            (c) => c.id === 'ProductID'
          );
          if (productCol?.editor?.editorOptions) {
            (productCol.editor.editorOptions as any).collection =
              this.productGridCollection;
          }

          // Load detail data after products are loaded
          if (this.isCheckmode && this.id > 0 && !this.isLoadingEditData) {
            this.isLoadingEditData = true;
            this.getBillImportDetailID();
          } else if (this.poNCCId > 0 && this.selectedList?.length > 0) {
            this.mapDataFromPONCCToTable();
          } else if (this.dataHistory?.length > 0) {
            this.mapDataHistoryToTable();
          }
        },
        error: (err) => {
          console.error(err);
          this.notification.error(
            'Thông báo',
            'Có lỗi xảy ra khi lấy danh sách sản phẩm!'
          );
        },
      });
  }

  private mapDataFromPONCCToTable(): void {
    if (!this.selectedList || this.selectedList.length === 0) {
      return;
    }

    this.dataDetail = this.selectedList.map((item: any, index: number) => {
      const productInfo =
        this.productOptions.find(
          (p: any) => p.value === item.ProductSaleID
        ) || {};

      const projectInfo =
        this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};

      return {
        id: -(index + 1),
        ID: 0,
        PONCCDetailID: item.PONCCDetailID || item.ID || 0,
        ProductID: item.ProductSaleID || null,
        ProductNewCode:
          item.ProductNewCode || productInfo.ProductNewCode || '',
        ProductCode: item.ProductCode || productInfo.ProductCode || '',
        ProductName: item.ProductName || productInfo.ProductName || '',
        Unit: item.UnitName || item.Unit || productInfo.Unit || '',
        QtyRequest: item.QtyRequest || 0,
        Qty: item.QtyRequest || item.QuantityRemain || 0,
        IsNotKeep: false,
        ProjectID: item.ProjectID || 0,
        ProjectCode: item.ProjectCode || '',
        ProjectNameText: item.ProjectName || projectInfo.label || '',
        CustomerFullName: '',
        BillCodePO: item.BillCode || '',
        PONumber: '',
        Note: item.POCode || '',
        SomeBill: '',
        DateSomeBill: null,
        DPO: 0,
        DueDate: null,
        TaxReduction: 0,
        COFormE: 0,
        SerialNumber: '',
      };
    });

    this.refreshGrid();
  }

  private mapDataHistoryToTable(): void {
    if (!this.dataHistory || this.dataHistory.length === 0) {
      return;
    }

    this.dataDetail = this.dataHistory.map((item: any, index: number) => {
      const productInfo =
        this.productOptions.find((p: any) => p.value === item.ProductID) || {};
      const projectInfo =
        this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};

      return {
        id: -(index + 1),
        ID: 0,
        ProductID: item.ProductID || null,
        ProductNewCode:
          item.ProductNewCode || productInfo.ProductNewCode || null,
        ProductCode: item.ProductCode || productInfo.ProductCode || '',
        ProductName: item.ProductName || productInfo.ProductName || '',
        Unit: item.Unit || productInfo.Unit || '',
        QtyRequest: 0,
        Qty: item.BorrowQty || 0,
        IsNotKeep: false,
        ProjectID: item.ProjectID || 0,
        ProjectCode: item.ProjectCode || '',
        ProjectNameText: item.ProjectNameText || projectInfo.label || '',
        CustomerFullName: '',
        BillCodePO: item.BillCodePO || '',
        PONumber: '',
        Note: item.Note || '',
        SomeBill: item.SomeBill || '',
        DateSomeBill: item.DateSomeBill ? new Date(item.DateSomeBill) : null,
        DPO: item.DPO || 0,
        DueDate: item.DueDate ? new Date(item.DueDate) : null,
        TaxReduction: item.TaxReduction || 0,
        COFormE: item.COFormE || 0,
        SerialNumber: item.SerialNumber || '',
        BillExportDetailID: item.BorrowID || 0,
        CodeMaPhieuMuon: item.BorrowCode || '',
      };
    });

    this.refreshGrid();
  }

  getDataCbbProductGroup(): void {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbRulePay(): void {
    this.billImportService.getDataRulePay().subscribe({
      next: (res: any) => {
        this.dataCbbRulePay = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbUser(): void {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbReciver = res.data;
        this.dataCbbDeliver = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getDataCbbSupplierSale(): void {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      },
    });
  }

  getNewCode(): void {
    const billTypeNew = this.validateForm.get('BillTypeNew')?.value;
    this.billImportService.getNewCode(billTypeNew).subscribe({
      next: (res: any) => {
        this.newBillImport.BillImportCode = res.data;
        this.validateForm.patchValue({ BillImportCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi mã phiếu');
      },
    });
  }

  loadOptionProject(): void {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectOptions = projectData
            .filter(
              (project) =>
                project.ID !== null &&
                project.ID !== undefined &&
                project.ID !== 0
            )
            .map((project) => ({
              label: project.ProjectCode ? `${project.ProjectCode} - ${project.ProjectName}` : project.ProjectName,
              value: project.ID,
              ProjectCode: project.ProjectCode,
              ProjectName: project.ProjectName,
            }));

          this.projectGridCollection = [...this.projectOptions];

          // Update editor collection
          const projectCol = this.columnDefinitionsDetail.find(
            (c) => c.id === 'ProjectID'
          );
          if (projectCol?.editor) {
            projectCol.editor.collection = this.projectGridCollection;
          }
        } else {
          this.projectOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách dự án'
        );
        this.projectOptions = [];
      },
    });
  }

  openModalNewProduct(): void {
    this.newProductSale = {
      ProductCode: '',
      ProductName: '',
      Maker: '',
      Unit: '',
      AddressBox: '',
      NumberInStoreDauky: 0,
      NumberInStoreCuoiKy: 0,
      ProductGroupID: 0,
      LocationID: 0,
      FirmID: 0,
      Note: '',
    };
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newProductSale = this.newProductSale;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedList = [];
    modalRef.componentInstance.id = 0;
    modalRef.result.catch((result: any) => {
      if (result == true) {
        // Reload if needed
      }
    });
  }
  //#endregion

  //#region Save & Close
  closeModal(): void {
    this.activeModal.close();
  }

  private mapTableDataToBillImportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      return {
        ID: (row.ID && row.ID > 0) ? row.ID : 0,
        BillImportID: row.BillImportID || 0,
        ProductID: row.ProductID || 0,
        Qty: row.Qty || 0,
        Price: row.Price || 1,
        TotalPrice: (row.Qty || 0) * (row.Price || 1),
        ProjectName: row.ProjectNameText || '',
        ProjectCode: row.ProjectCode || '',
        SomeBill: row.SomeBill || '',
        Note: row.Note || '',
        STT: row.STT || index + 1,
        TotalQty: row.TotalQty || 0,
        CreatedDate: row.CreatedDate
          ? new Date(row.CreatedDate).toISOString()
          : new Date().toISOString(),
        UpdatedDate: new Date().toISOString(),
        ProjectID: row.ProjectID || 0,
        PONCCDetailID: row.PONCCDetailID || 0,
        SerialNumber: row.SerialNumber || '',
        CodeMaPhieuMuon: row.CodeMaPhieuMuon || '',
        BillExportDetailID: row.BillExportDetailID || 0,
        ProjectPartListID: row.ProjectPartListID || 0,
        IsKeepProject: row.IsKeepProject || false,
        QtyRequest: row.QtyRequest || 0,
        BillCodePO: row.BillCodePO || '',
        ReturnedStatus: row.ReturnedStatus || false,
        InventoryProjectID: row.InventoryProjectID || 0,
        DateSomeBill: row.DateSomeBill
          ? new Date(row.DateSomeBill).toISOString()
          : null,
        isDeleted: row.isDeleted || false,
        DPO: row.DPO || 0,
        DueDate: row.DueDate ? new Date(row.DueDate).toISOString() : null,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
        IsNotKeep: row.IsNotKeep || false,
        UnitName: row.Unit || '',
        POKHDetailID: row.POKHDetailID || null,
        CustomerID: row.CustomerID || null,
        QuantityRequestBuy: row.QuantityRequestBuy || null,
      };
    });
  }

  private formatDateForServer(date: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async saveDataBillImport(): Promise<void> {
    if (!this.validateForm.valid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra lỗi!'
      );
      this.validateForm.markAllAsTouched();
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    let formValues = this.validateForm.getRawValue();

    // Validate các trường bắt buộc
    if (!formValues.BillImportCode || formValues.BillImportCode.trim() === '') {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền số phiếu.'
      );
      return;
    }
    if (!formValues.SupplierID || formValues.SupplierID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Xin hãy điền thông tin ${this.labelSupplier.toLowerCase()}.`
      );
      return;
    }
    if (!formValues.ReciverID || formValues.ReciverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy điền thông tin người nhập.'
      );
      return;
    }
    if (!formValues.KhoTypeID || formValues.KhoTypeID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Xin hãy chọn kho quản lý.'
      );
      return;
    }
    if (!formValues.DeliverID || formValues.DeliverID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `Xin hãy điền thông tin ${this.labelDeliver.toLowerCase()}.`
      );
      return;
    }
    if (formValues.BillTypeNew !== 4 && !formValues.CreatDate) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng nhập Ngày nhập!'
      );
      return;
    }
    if (!formValues.RulePayID || formValues.RulePayID <= 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Vui lòng nhập Điều khoản TT!'
      );
      return;
    }

    const billImportDetailsFromTable = this.dataDetail;

    if (
      !billImportDetailsFromTable ||
      billImportDetailsFromTable.length === 0
    ) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng thêm ít nhất một sản phẩm vào bảng!'
      );
      return;
    }

    this.isSaving = true;

    // Kiểm tra trùng số phiếu (chỉ khi thêm mới, không phải cập nhật)
    if (!this.isCheckmode || this.newBillImport.Id === 0) {
      try {
        const checkRes = await firstValueFrom(
          this.billImportService.checkBillCode(formValues.BillImportCode)
        );
        if (checkRes.status === 1 && checkRes.data === true) {
          const oldCode = formValues.BillImportCode;
          // Lấy mã mới
          const newCodeRes = await firstValueFrom(
            this.billImportService.getNewCode(formValues.BillTypeNew)
          );
          if (newCodeRes.data) {
            const newCode = newCodeRes.data;
            const confirmed = await new Promise<boolean>((resolve) => {
              this.modal.confirm({
                nzTitle: 'Xác nhận',
                nzContent: `Số phiếu [${oldCode}] đã tồn tại, đổi thành [${newCode}] và tiếp tục lưu?`,
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => resolve(true),
                nzOnCancel: () => resolve(false),
              });
            });
            if (!confirmed) {
              this.isSaving = false;
              return;
            }
            this.validateForm.patchValue({ BillImportCode: newCode });
            formValues = this.validateForm.getRawValue();
          }
        }
      } catch (err) {
        console.error('Check bill code error:', err);
      }
    }

    const payload = [
      {
        billImport: {
          ID: this.newBillImport.Id || 0,
          BillImportCode: formValues.BillImportCode,
          BillType: false,
          Reciver:
            this.dataCbbReciver.find((item) => item.ID === formValues.ReciverID)
              ?.FullName || '',
          Deliver:
            this.dataCbbDeliver.find((item) => item.ID === formValues.DeliverID)
              ?.FullName || '',
          KhoType:
            this.dataCbbProductGroup.find(
              (item) => item.ID === formValues.KhoTypeID
            )?.ProductGroupName || '',
          GroupID: String(formValues.KhoTypeID || ''),
          Suplier:
            this.dataCbbSupplier.find(
              (item) => item.ID === formValues.SupplierID
            )?.NameNCC || '',
          SupplierID: formValues.SupplierID,
          ReciverID: formValues.ReciverID,
          DeliverID: formValues.DeliverID,
          KhoTypeID: formValues.KhoTypeID,
          WarehouseID: formValues.WarehouseID || this.newBillImport.WarehouseID,
          CreatDate: this.formatDateForServer(formValues.CreatDate),
          DateRequestImport: this.formatDateForServer(
            formValues.DateRequestImport
          ),
          BillTypeNew: formValues.BillTypeNew,
          BillDocumentImportType: 2,
          Status: false,
          PTNB: false,
          UnApprove: 1,
          RulePayID: formValues.RulePayID,
          IsDeleted: false,
        },
        billImportDetail: this.mapTableDataToBillImportDetails(
          billImportDetailsFromTable
        ),
        DeletedDetailIds: this.deletedDetailIds || [],
        billDocumentImports: [],
        pONCCID: this.poNCCId || 0,
      },
    ];

    this.billImportService.saveBillImport(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            this.isCheckmode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'
          );

          if (this.isEmbedded) {
            this.saveSuccess.emit();
          } else {
            this.closeModal();
          }
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message ||
            (this.isCheckmode ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!')
          );
        }
        this.isSaving = false;
      },
      error: (err: any) => {
        console.error('Save error:', err);
        let errorMessage =
          'Có lỗi xảy ra khi ' + (this.isCheckmode ? 'cập nhật!' : 'thêm mới!');
        if (err.error && err.error.message) {
          errorMessage += ' Chi tiết: ' + err.error.message;
        }
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        this.isSaving = false;
      },
    });
  }
  //#endregion

  //#region Document Import Grid
  initDocumentGridOptions(): void {
    this.gridOptionsDocument = {
      enableGridMenu: true,
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-document',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'id',
      rowHeight: 40,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      forceFitColumns: true,
      enableColumnReorder: true,
    };
  }

  initDocumentGridColumns(): void {
    this.columnDefinitionsDocument = [
      {
        id: 'DocumentStatusPur',
        name: 'Trạng thái pur',
        field: 'DocumentStatusPur',
        width: 150,
        sortable: true,
        filterable: true,
        editor: this.activePur ? {
          model: Editors['singleSelect'],
          collectionOptions: { addBlankEntry: true },
          collection: this.cbbStatusPur.map((s: any) => ({ value: s.ID, label: s.Name })),
          editorOptions: { filter: true } as MultipleSelectOption,
        } : undefined,
        formatter: (_row: number, _cell: number, value: any) => {
          const status = this.cbbStatusPur.find((s: any) => s.ID === value);
          return status ? status.Name : '';
        },
      },
      {
        id: 'DocumentImportCode',
        name: 'Mã chứng từ',
        field: 'DocumentImportCode',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'DocumentImportName',
        name: 'Tên chứng từ',
        field: 'DocumentImportName',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'StatusText',
        name: 'Trạng thái',
        field: 'StatusText',
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        id: 'DateRecive',
        name: 'Ngày nhận / hủy nhận',
        field: 'DateRecive',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => {
          if (!value) return '';
          const date = new Date(value);
          if (isNaN(date.getTime())) return '';
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        },
      },
      {
        id: 'FullNameRecive',
        name: 'Người nhận / Hủy',
        field: 'FullNameRecive',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ReasonCancel',
        name: 'Lý do huỷ',
        field: 'ReasonCancel',
        width: 200,
        sortable: true,
        filterable: true,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        filterable: true,
      },
    ];
  }

  angularGridDocumentReady(angularGrid: AngularGridInstance): void {
    this.angularGridDocument = angularGrid;
    // Đảm bảo DataView dùng 'id' làm idPropertyName
    angularGrid.dataView.setItems([], 'id');

    if (this.dataDocumentImport && this.dataDocumentImport.length > 0) {
      this.angularGridDocument.dataView.setItems(this.dataDocumentImport, 'id');
      this.angularGridDocument.slickGrid.invalidate();
      this.angularGridDocument.slickGrid.render();
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  loadDocumentImport(): void {
    this.billImportService.getDocumentImport(0, this.id).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.dataDocumentImport = (res.data || []).map((item: any, index: number) => ({
            ...item,
            id: -(index + 1),
          }));
          if (this.angularGridDocument?.dataView) {
            this.angularGridDocument.dataView.setItems(this.dataDocumentImport, 'id');
            this.angularGridDocument.slickGrid?.invalidate();
            this.angularGridDocument.slickGrid?.render();
          }
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu chứng từ'
        );
      },
    });
  }

  mapTableDataToDocumentImports(documents: any[]): any[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    return documents.map((doc) => ({
      ID: doc.ID || 0,
      DocumentImportID: doc.DocumentImportID || 0,
      ReasonCancel: (doc.ReasonCancel || '').trim(),
      Note: (doc.Note || '').trim(),
      Status: doc.Status || 0,
      StatusPurchase: doc.DocumentStatusPur || 0,
      BillImportID: this.newBillImport.Id || 0,
      UpdatedDate: new Date().toISOString(),
    }));
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;

    setTimeout(() => {
      if (index === 0 && this.angularGridDetail?.resizerService) {
        this.angularGridDetail.resizerService.resizeGrid();
      } else if (index === 1 && this.angularGridDocument?.resizerService) {
        this.angularGridDocument.resizerService.resizeGrid();
      }
    }, 100);
  }
  //#endregion

  //#region QC Functions
  openModalRequestQC(): void {
    const selectedRows = this.angularGridDetail?.slickGrid?.getSelectedRows() || [];

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn sản phẩm cần QC!'
      );
      return;
    }

    const lsProductID: number[] = [];
    const dtDetails: any[] = [];
    let stt = 1;

    for (let i = 0; i < selectedRows.length; i++) {
      const rowData = this.angularGridDetail.slickGrid.getDataItem(selectedRows[i]);
      const billImportDetailID = rowData['ID'] || 0;
      const productSaleID = rowData['ProductID'] || 0;
      const productName = rowData['ProductName'] || '';
      const billImportQCId = rowData['BillImportQCID'] || 0;

      if (billImportQCId > 0) {
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Sản phẩm thứ [${i + 1}] đã được QC!`
        );
        return;
      }

      if (!lsProductID.includes(productSaleID) && productSaleID > 0) {
        lsProductID.push(productSaleID);
      }

      const detailRow = {
        ID: -(i + 1),
        STT: stt++,
        ProductSaleID: productSaleID,
        ProductName: productName,
        Quantity: rowData['Qty'] || 0,
        LeaderTechID: 0,
        EmployeeTechID: 0,
        ProjectID: rowData['ProjectID'] || 0,
        Status: 0,
        BillImportDetailID: billImportDetailID,
        POKHCode: rowData['BillCodePO'] || '',
        BillCode: rowData['BillCodePO'] || '',
      };

      dtDetails.push(detailRow);
    }

    const modalRef = this.modalService.open(BillImportQcDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });
    console.log('dtDetails', dtDetails);
    modalRef.componentInstance.dataImport = dtDetails;
    modalRef.componentInstance.isAddNewToBillImport = true;

    modalRef.result.finally(
      () => {
        this.getBillImportDetailID();
      },
    );
  }

  async onViewBillImportQC(): Promise<void> {
    const selectedRows = this.angularGridDetail?.slickGrid?.getSelectedRows() || [];

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn sản phẩm cần xem QC!'
      );
      return;
    }

    const lsBillImportQCIds: number[] = [];
    for (let i = 0; i < selectedRows.length; i++) {
      const rowData = this.angularGridDetail.slickGrid.getDataItem(selectedRows[i]);
      const billImportQCId = rowData['BillImportQCID'] || 0;

      if (!lsBillImportQCIds.includes(billImportQCId) && billImportQCId > 0) {
        lsBillImportQCIds.push(billImportQCId);
      }
    }
    console.log('lsBillImportQCIds',lsBillImportQCIds);

    if (lsBillImportQCIds.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Sản phẩm chưa được yêu cầu QC!'
      );
      return;
    }

    for (const billImportQCId of lsBillImportQCIds) {
      try {
        const res: any = await this.billImportQcService
          .getDataMasterById(billImportQCId)
          .toPromise();

        if (res && res.data) {
          const modalRef = this.modalService.open(BillImportQcDetailComponent, {
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'full-screen-modal',
            size: 'xl',
          });

          modalRef.componentInstance.billImportQCMaster = res.data;
          modalRef.componentInstance.isCheckBillQC = true;

          try {
            await modalRef.result;
          } catch {
            // Modal bị dismiss, tiếp tục mở modal tiếp theo
          }
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            `Không tìm thấy yêu cầu QC với ID: ${billImportQCId}`
          );
        }
      } catch (error: any) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Lỗi khi tải yêu cầu QC: ${error.message || error}`
        );
      }
    }
  }
  //#endregion

  //#region Bill Return Functions
  openBillReturnModal(rowData: any): void {
    const modalRef = this.modalService.open(BillReturnComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.productID = rowData.ProductID || 0;
    modalRef.componentInstance.Type = 1;

    modalRef.componentInstance.maphieuSelected.subscribe((maphieu: string) => {
      if (maphieu) {
        rowData.CodeMaPhieuMuon = maphieu;
        this.angularGridDetail?.gridService?.updateItem(rowData);
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Cập nhật phiếu mượn thành công!'
        );
        modalRef.close();
      }
    });
  }
  //#endregion

  //#region Check Serial
  async checkSerial(): Promise<boolean> {
    // Validate serial count vs quantity
    // Currently returns true as in original
    return true;
  }

  async closeModalWithCheck(): Promise<void> {
    const isValid = await this.checkSerial();
    if (!isValid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Số lượng serial không khớp với số lượng sản phẩm!'
      );
      return;
    }
    this.activeModal.close();
  }
  //#endregion
}
