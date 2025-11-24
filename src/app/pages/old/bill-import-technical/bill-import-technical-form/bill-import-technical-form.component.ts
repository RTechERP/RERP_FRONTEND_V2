import { log } from 'ng-zorro-antd/core/logger';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { BillImportChoseProductFormComponent } from '../bill-import-chose-product-form/bill-import-chose-product-form.component';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Editor } from 'tabulator-tables';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { BillImportChoseSerialComponent } from '../bill-import-chose-serial/bill-import-chose-serial.component';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { firstValueFrom } from 'rxjs';
import { TbProductRtcService } from '../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { AppUserService } from '../../../../services/app-user.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  standalone: true,
  imports: [
    NzCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzSpinModule,
  ],
  selector: 'app-bill-import-technical-form',
  templateUrl: './bill-import-technical-form.component.html',
  styleUrls: ['./bill-import-technical-form.component.css'],
})
export class BillImportTechnicalFormComponent implements OnInit, AfterViewInit {
  // danh sách loại phiếu nhập kĩ thuật
  billType: any = [
    { ID: 0, Name: '--Chọn loại phiếu--' },
    { ID: 1, Name: 'Mượn NCC' },
    { ID: 2, Name: 'Mua NCC' },
    { ID: 3, Name: 'Trả' },
    { ID: 4, Name: 'Nhập nội bộ' },
    { ID: 5, Name: 'Y/c nhập kho' },
    { ID: 6, Name: 'Nhập hàng bảo hành' },
    { ID: 7, Name: 'NCC tặng/cho' },
  ];
  cbbStatusPur: any = [
    { ID: 1, Name: 'Đã bàn giao' },
    { ID: 2, Name: 'Hủy bàn giao' },
    { ID: 3, Name: 'Không cần' },
  ];
  activePur: boolean = false;
  @ViewChild('table_DocumnetImport') tableDocumnetImport!: ElementRef;
  table_DocumnetImport!: Tabulator;
  @ViewChild('tableDeviceTemp') tableDeviceTemp!: ElementRef;
  isLoading: boolean = false;
  @Input() masterId!: number;//IDDetail
  @Input() dataEdit: any;
  @Input() dataInput: any;
  @Input() billImport:any;

  @Input() IsEdit: boolean = false;
  formDeviceInfo!: FormGroup;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  @Input() warehouseID: number = 1;
  @Input() dtDetails:any[]=[];
  @Input() flag:number=0;
  @Input() POCode:string='';
  @Input() body:string='';
  @Input() receiverMailID:number=0;
@Input() warehouseIDNew:number=0;
  employeeSelectOptions: { label: string; value: number }[] = [];
  documentBillImport: any[] = [];
  selectedDevices: any[] = [];
  deviceTempTable: Tabulator | null = null;
  customerList: any[] = [];
  nccList: any[] = [];
  rulePayList: any[] = [];
  emPloyeeLists: any[] = [];
  productOptions: any[] = [];

  isAdmin: boolean = false;
  currentUserID: number = 0;
  currentEmployeeID: number = 0;
  currentDepartmentID: number = 0;
  canEditRestrictedFields: boolean = false;
  isFormDisabled: boolean = false;

  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  constructor(
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private billImportTechnicalService: BillImportTechnicalService,
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService,
    private appUserService: AppUserService
  ) {}

  supplierOrCustomerValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const parent = control.parent;
    if (!parent) return null;

    const supplierSaleID = parent.get('SupplierSaleID')?.value;
    const customerID = parent.get('CustomerID')?.value;

    if (!supplierSaleID && !customerID) {
      return { supplierOrCustomerRequired: true };
    }

    return null;
  }
  // Khởi tạo form
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [null],
      BillCode: ['', Validators.required],
      CreatDate: [new Date(), Validators.required],
      Deliver: ['', Validators.required],
      BillType: [null],
      WarehouseType: ['', Validators.required],
      DeliverID: [null, Validators.required],
      ReceiverID: [null, Validators.required],
      WarehouseID: [this.warehouseID, Validators.required],
      SupplierSaleID: [null, this.supplierOrCustomerValidator.bind(this)],
      RulePayID: [34, Validators.required],
      CustomerID: [null, this.supplierOrCustomerValidator.bind(this)],
      ApproverID: [54, Validators.required],
      Receiver: [''],
      Status: [false],
      Suplier: [''],
      SuplierID: [null],
      GroupTypeID: [null],
      CreatedBy: [''],
      CreatedDate: [null],
      UpdatedBy: [''],
      UpdatedDate: [null],
      Image: [''],
      BillTypeNew: [0, Validators.required],
      IsBorrowSupplier: [false],
      BillDocumentImportType: [null],
      DateRequestImport: [null],
      IsNormalize: [false],
    });

    this.formDeviceInfo.get('SupplierSaleID')?.valueChanges.subscribe(() => {
      this.formDeviceInfo
        .get('CustomerID')
        ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
    this.formDeviceInfo.get('CustomerID')?.valueChanges.subscribe(() => {
      this.formDeviceInfo
        .get('SupplierSaleID')
        ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }
  getCustomer() {
    this.billImportTechnicalService
      .getCustomer(1, 10000, '', 0, 0)
      .subscribe((res: any) => {
        // API returns { status, data: { data: [], data1: [], data2: [] } }
        this.customerList = res.data?.data || [];
        console.log('Customer List:', this.customerList);
      });
  }
  getNCC() {
    this.billImportTechnicalService.getNCC().subscribe((res: any) => {
      // API returns { status, data: [] } - using ApiResponseFactory
      this.nccList = res.data || [];
      console.log('NCC List:', this.nccList);
    });
  }
  getRulepay() {
    this.billImportTechnicalService.getRulepay().subscribe((res: any) => {
      // API returns { status, data: [] } - using ApiResponseFactory
      this.rulePayList = res.data || [];
      console.log('RulePay List:', this.rulePayList);
    });
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: '',
    };
    this.TsAssetManagementPersonalService.getEmployee(request).subscribe(
      (respon: any) => {
        // API returns { status, data: [] } - using ApiResponseFactory
        this.emPloyeeLists = respon.data || [];
        console.log('Employee List:', this.emPloyeeLists);

        this.employeeSelectOptions = this.emPloyeeLists.map((e: any) => ({
          label: e.FullName,
          value: e.ID,
        }));

        // Force update table columns to refresh employee dropdown
        if (this.deviceTempTable) {
          this.deviceTempTable.setColumns(
            this.deviceTempTable.getColumnDefinitions()
          );
        }
      }
    );
  }

  // Load danh sách sản phẩm cho select dropdown
  getProductList() {
    const request = {
      productGroupID: 0,
      keyWord: '',
      checkAll: 1,
      warehouseID: 0,
      productRTCID: 0,
      productGroupNo: '',
      page: 1,
      size: 100000, // Load tất cả sản phẩm
    };

    this.tbProductRtcService
      .getProductRTC(request)
      .subscribe((response: any) => {
        if (response && response.data) {
          this.productOptions = response.data.products.map((p: any) => ({
            ID: p.ID,
            ProductCode: p.ProductCode,
            ProductName: p.ProductName,
            ProductCodeRTC: p.ProductCodeRTC,
            Maker: p.Maker,
            UnitCountID: p.UnitCountID,
            UnitCountName: p.UnitCountName,
            NumberInStore: p.NumberInStore,
          }));
          console.log('product', this.productOptions);

          if (this.deviceTempTable) {
            this.deviceTempTable.redraw(true);
          }
          // Force update table columns nếu table đã được tạo
          // if (this.deviceTempTable) {
          //   this.deviceTempTable.setColumns(this.deviceTempTable.getColumnDefinitions());
          // }
        }
      });
  }

  ngAfterViewInit(): void {
    this.drawTableSelectedDevices();
  }

 //#region load quyền người dùng
  initializePermissions() {
    const currentUser = this.appUserService.currentUser;
    this.isAdmin = currentUser?.IsAdmin || false;
    this.currentUserID = currentUser?.ID || 0;
    this.currentEmployeeID = currentUser?.EmployeeID || 0;
    this.currentDepartmentID = currentUser?.DepartmentID || 0;

    this.applyFormPermissions();
  }

  applyFormPermissions() {
    const deliverID = this.formDeviceInfo.get('DeliverID')?.value || 0;
    this.canEditRestrictedFields =
      this.isAdmin || this.currentUserID === deliverID;

    const isApproved = this.formDeviceInfo.get('Status')?.value === true;
    this.isFormDisabled = isApproved && !this.isAdmin;

    console.log('Form Permissions:', {
      deliverID: deliverID,
      canEditRestrictedFields: this.canEditRestrictedFields,
      isFormDisabled: this.isFormDisabled,
      isApproved: isApproved,
    });

    if (this.isFormDisabled) {
      this.formDeviceInfo.disable();
      console.log('Form disabled: Bill is approved and user is not admin');
    } else {
      this.formDeviceInfo.enable();

      this.formDeviceInfo.get('BillCode')?.disable();
    }
  }

  onDeliverIDChanged() {
    this.applyFormPermissions();
  }
//#endregion

//#Init
  ngOnInit() {
    this.initForm();

    // Khởi tạo BillTypeNew = 0 (--Chọn loại phiếu--)
    this.formDeviceInfo.patchValue({BillTypeNew: 0});

    // BillCode luôn ReadOnly (auto-generated)
    this.formDeviceInfo.get('BillCode')?.disable();

    // Nếu là chế độ Edit, disable các nút
    if(this.IsEdit){
      this.isFormDisabled = true;
    }

    this.initializePermissions();

    // Nếu phiếu đã được duyệt (Status = true) và không phải Admin
    if(this.billImport?.Status === true && !this.isAdmin){
      this.isFormDisabled = true;
    }

    if (this.dataEdit) {
      this.formDeviceInfo.patchValue({
        ...this.dataEdit,
        CreatDate: this.dataEdit?.CreatDate
          ? DateTime.fromISO(this.dataEdit.CreatDate).toJSDate()
          : null,
        DateRequestImport: this.dataEdit?.DateRequestImport
          ? DateTime.fromISO(this.dataEdit.DateRequestImport).toJSDate()
          : null,
      });
    }

    if (this.masterId) {
      this.billImportTechnicalService
        .getBillImportDetail(this.masterId)
        .subscribe((res) => {
          this.selectedDevices = res.billDetail || [];
          this.drawTableSelectedDevices();
        });
    }

    this.getNewCode();
    this.getRulepay();
    this.getNCC();
    this.getCustomer();
    this.getDocumentImport();
    this.getListEmployee();
    this.getProductList();

    const currentUser = this.appUserService.currentUser;
    if(currentUser?.ID){
      this.formDeviceInfo.patchValue({ReceiverID: currentUser.ID});

      if(this.warehouseID === 2){
        this.formDeviceInfo.patchValue({ReceiverID: 1434});
      }
    }
  }
//#endregion
  changeStatus() {
    this.getNewCode();
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  getDocumentImport() {
    this.billImportTechnicalService
      .getDocumentBillImport(1, 1)
      .subscribe((respon: any) => {
        this.documentBillImport = respon.document;
      });
  }
  getNewCode() {
    const billType = this.formDeviceInfo.get('BillTypeNew')?.value ?? 0;
    this.billImportTechnicalService.getBillCode(billType).subscribe({
      next: (res: any) => {
        this.formDeviceInfo.patchValue({ BillCode: res.data });
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy mã phiếu'
        );
      },
    });
  }
  openModalChoseProduct() {
    const modalRef = this.ngbModal.open(BillImportChoseProductFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.formSubmitted.subscribe(
      (selectedProducts: any[]) => {
        this.selectedDevices = [...this.selectedDevices, ...selectedProducts];

        if (this.deviceTempTable) {
          this.deviceTempTable.setData(this.selectedDevices);
        }
      }
    );
  }
  prevProductID: any = null;
  // Vẽ bảng tạm chọn thiết bị
  drawTableSelectedDevices() {
    this.deviceTempTable = new Tabulator(this.tableDeviceTemp.nativeElement, {
      layout: 'fitColumns',
      data: this.selectedDevices,
      selectableRows: true,
      height: '47vh',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [5, 10, 20, 50],
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        resizable: true,
      },
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          titleFormatter: () => `
          <div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
          headerClick: () => {
            this.addRow();
          },
          formatter: () =>
            `<i class="fas fa-times text-danger cursor-pointer" title="Xóa dòng"></i>`,
          cellClick: (e, cell) => {
            cell.getRow().delete();
          },
        },
        { title: 'STT', formatter: 'rownum', hozAlign: 'center', width: 60 },
        {
          title: 'Mã sản phẩm',
          field: 'ProductID',
          width: 150,
          editor: 'list',
          editorParams: () => {
            // Tạo object với key là ID, value là ProductCode
            const values: any = {};
            this.productOptions.forEach((p) => {
              values[p.ID] = p.ProductCode;
            });
            return {
              values: values,
              autocomplete: true,
              listOnEmpty: true,
              freetext: false,
              allowEmpty: false,
              emptyValue: null,
            };
          },
          cellEditing: (cell) => {
            if (cell.getField() === 'ProductID') {
              this.prevProductID = cell.getValue(); // Lưu lại giá trị cũ
            }
          },

          formatter: (cell) => {
            const productId = Number(cell.getValue());
            const product = this.productOptions.find((p) => p.ID === productId);
            return product ? product.ProductCode : '';
          },
          cellEdited: (cell) => {
            const newValue = cell.getValue();

            if (!newValue) {
              cell.setValue(this.prevProductID, true);
              return;
            }

            this.onProductSelected(cell);
          },
        },
        { title: 'Tên sản phẩm', field: 'ProductName', width: 200 },
        { title: 'Mã nội bộ', field: 'ProductCodeRTC', width: 120 },
        { title: 'Đơn vị tính', field: 'UnitCountName', width: 100 },
        {
          title: 'Số lượng',
          field: 'Quantity',
          editor: 'input',
          width: 100,
          editorParams: { elementAttributes: { type: 'number' } },
          cellEdited: (cell) => this.onQuantityChanged(cell),
        },
        {
          title: 'Tổng SL',
          field: 'TotalQuantity',
          width: 100,
          hozAlign: 'right',
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? val.toString() : '0';
          },
        },
        {
          title: 'Đơn giá',
          field: 'Price',
          editor: 'input',
          width: 120,
          hozAlign: 'right',
          editorParams: { elementAttributes: { type: 'number' } },
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
          cellEdited: (cell) => this.onPriceChanged(cell),
        },
        {
          title: 'Thành tiền',
          field: 'TotalPrice',
          width: 130,
          hozAlign: 'right',
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
        },
        {
          title: 'Hãng',
          field: 'Maker',
          editor: 'input',
          width: 120,
        },
        {
          title: 'Số chứng từ',
          field: 'SomeBill',
          editor: 'input',
          width: 120,
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'Ngày chứng từ',
          field: 'DateSomeBill',
          editor: 'input',
          width: 130,
          editorParams: {
            elementAttributes: { type: 'date' },
          },
          mutator: (value) => (value ? new Date(value).toISOString() : null),
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString('vi-VN') : '';
          },
          cellEdited: (cell) => this.onDateSomeBillChanged(cell),
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'DPO (ngày)',
          field: 'DPO',
          editor: 'input',
          width: 100,
          editorParams: { elementAttributes: { type: 'number' } },
          cellEdited: (cell) => this.onDPOChanged(cell),
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'Hạn thanh toán',
          field: 'DueDate',
          width: 130,
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString('vi-VN') : '';
          },
        },
        {
          title: 'Giảm thuế',
          field: 'TaxReduction',
          editor: 'input',
          width: 100,
          hozAlign: 'right',
          editorParams: { elementAttributes: { type: 'number' } },
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? parseFloat(val).toLocaleString('vi-VN') : '0';
          },
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'C/O Form E',
          field: 'COFormE',
          editor: 'input',
          width: 120,
          editable: () => this.canEditRestrictedFields, // PHASE 6.3: Only DeliverID or Admin
        },
        {
          title: 'Mã PO NCC',
          field: 'BillCodePO',
          width: 120,
        },
        {
          title: 'Người mượn',
          field: 'EmployeeIDBorrow',
          editor: 'list',
          width: 150,
          editorParams: () => {
            // Tạo object với key là ID, value là ProductCode
            const values: any = {};
            this.employeeSelectOptions.forEach((p) => {
              values[p.value] = p.label;
            });
            return {
              values: values,
              autocomplete: true,
              listOnEmpty: true,
              freetext: false,
              allowEmpty: false,
              emptyValue: null,
            };
          },

          formatter: (cell) => {
            const val = Number(cell.getValue());
            const emp = this.employeeSelectOptions.find(
              (e) => Number(e.value) === val
            );
            return emp ? emp.label : '';
          },

          cellEdited: (cell) => this.onEmployeeBorrowChanged(cell),
        },
        {
          title: 'Hạn trả NCC',
          field: 'DeadlineReturnNCC',
          editor: 'input',
          width: 130,
          editorParams: {
            elementAttributes: { type: 'date' },
          },
          mutator: (value) => (value ? new Date(value).toISOString() : null),
          formatter: (cell) => {
            const val = cell.getValue();
            return val ? new Date(val).toLocaleDateString('vi-VN') : '';
          },
          cellEdited: (cell) => this.onDeadlineReturnNCCChanged(cell),
        },
        { title: 'Ghi chú', field: 'Note', editor: 'input', width: 150 },
        { title: 'Serial IDs', field: 'SerialIDs', visible: false },
        {
          title: 'HistoryProductRTCID',
          field: 'HistoryProductRTCID',
          visible: false,
        },
        {
          title: 'ProductRTCQRCodeID',
          field: 'ProductRTCQRCodeID',
          visible: false,
        },
        { title: 'PONCCDetailID', field: 'PONCCDetailID', visible: false },
        { title: 'ProjectID', field: 'ProjectID', visible: false },
        // Chọn serial
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          headerSort: false,
          titleFormatter: () => `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i>
    </div>`,
          formatter: () => `
  <i class="fas fa-plus text-success cursor-pointer" title="Thêm serial"></i>
  `,
          cellClick: (e, cell) => {
            const row = cell.getRow();
            const rowData = row.getData();
            const quantity = rowData['Quantity'];
            const productCode = rowData['ProductCode'];
            const serialIDsRaw = rowData['SerialIDs'];
            if (quantity <= 0) {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng nhập số lượng lớn hơn 0 trước khi chọn Serial!'
              );
              return;
            }
            if (serialIDsRaw) {
              const serialIDs = serialIDsRaw
                .split(',')
                .map((id: string) => parseInt(id))
                .filter((id: number) => !isNaN(id) && id > 0);

              const existingSerials: { ID: number; Serial: string }[] = [];
              let loadedCount = 0;
              serialIDs.forEach((id: number) => {
                this.billImportTechnicalService.getSerialByID(id).subscribe({
                  next: (res) => {
                    if (res?.status === 1 && res.data) {
                      existingSerials.push({
                        ID: res.data.ID,
                        Serial: res.data.SerialNumber || res.data.Serial || '',
                      });
                    }
                  },
                  error: (err) => {
                    console.error(`Lỗi khi load serial ID ${id}:`, err);
                  },
                  complete: () => {
                    loadedCount++;
                    if (loadedCount === serialIDs.length) {
                      this.openSerialModal(
                        rowData,
                        row,
                        quantity,
                        productCode,
                        existingSerials
                      );
                    }
                  },
                });
              });
            } else {
              this.openSerialModal(rowData, row, quantity, productCode, []);
            }
          },
        },
      ],
      placeholder: 'Chưa có thiết bị nào được chọn',
    });
  }
  // Mở modal chọn serial
  openSerialModal(
    rowData: any,
    row: RowComponent,
    quantity: number,
    productCode: string,
    existingSerials: { ID: number; Serial: string }[]
  ) {
    const modalRef = this.ngbModal.open(BillImportChoseSerialComponent, {
      size: 'md',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.quantity = quantity;
    modalRef.componentInstance.productCode = productCode;
    modalRef.componentInstance.existingSerials = existingSerials;

    modalRef.result
      .then((serials: { ID: number; Serial: string }[]) => {
        const newSerial = serials.map((s) => s.Serial).join(', ');
        const serialIDs = serials.map((s) => s.ID).join(', ');
        rowData['Serial'] = newSerial;
        rowData['SerialIDs'] = serialIDs;
        row.update(rowData);
      })
      .catch(() => {});
  }
  // Thêm dòng mới vào bảng tạm
  addRow() {
    if (this.deviceTempTable) {
      const newRow = {
        UID: Date.now() + Math.random(),
        ProductCode: '',
        ProductName: '',
        NumberInStore: 1,
        Serial: '',
        Note: '',
        Quantity: 0,
        Price: 0,
        TotalPrice: 0,
        TotalQuantity: 0,
      };
      this.selectedDevices.push(newRow);
      this.deviceTempTable.setData(this.selectedDevices);
    }
  }

  onProductSelected(cell: CellComponent) {
    const productId = Number(cell.getValue());
    const product = this.productOptions.find((p) => p.ID === productId);

    if (!product) return;

    const row = cell.getRow();

    row.update({
      Maker: product.Maker,
      UnitCountName: product.UnitCountName,
      UnitCountID: product.UnitCountID,
      ProductName: product.ProductName,
      NumberInStore: product.NumberInStore,
      ProductCodeRTC: product.ProductCodeRTC,
    });
  }

  // PHASE 2.2: Calculation Logic - Calculate TotalPrice when Quantity or Price changes
  onQuantityChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const quantity = parseFloat(data['Quantity']) || 0;
    const price = parseFloat(data['Price']) || 0;

    // Calculate TotalPrice = Quantity * Price
    data['TotalPrice'] = quantity * price;
    data['TotalQuantity'] = quantity;

    row.update(data);

    // Recalculate totals for duplicate products
    this.recheckQty();
  }

  onPriceChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const quantity = parseFloat(data['Quantity']) || 0;
    const price = parseFloat(data['Price']) || 0;

    // Calculate TotalPrice = Quantity * Price
    data['TotalPrice'] = quantity * price;

    row.update(data);
  }

  // PHASE 2.2: Calculate DueDate = DateSomeBill + DPO days
  onDateSomeBillChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();

    if (data['DateSomeBill'] && data['DPO']) {
      const dateSomeBill = new Date(data['DateSomeBill']);
      const dpo = parseInt(data['DPO']) || 0;

      // Add DPO days to DateSomeBill
      const dueDate = new Date(dateSomeBill);
      dueDate.setDate(dueDate.getDate() + dpo);

      data['DueDate'] = dueDate.toISOString();
      row.update(data);
    }
  }

  onDPOChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();

    if (data['DateSomeBill'] && data['DPO']) {
      const dateSomeBill = new Date(data['DateSomeBill']);
      const dpo = parseInt(data['DPO']) || 0;

      // Add DPO days to DateSomeBill
      const dueDate = new Date(dateSomeBill);
      dueDate.setDate(dueDate.getDate() + dpo);

      data['DueDate'] = dueDate.toISOString();
      row.update(data);
    }
  }

  // PHASE 2.3: Auto-fill logic - Fill deadline to all subsequent rows
  onDeadlineReturnNCCChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const currentIndex = row.getPosition() as number;
    const deadline = data['DeadlineReturnNCC'];

    if (!deadline) return;

    // Fill down to all subsequent rows
    const allRows = this.deviceTempTable?.getRows() || [];
    for (let i = currentIndex; i < allRows.length; i++) {
      const rowData = allRows[i].getData();
      rowData['DeadlineReturnNCC'] = deadline;
      allRows[i].update(rowData);
    }
  }

  // PHASE 2.3: Auto-fill logic - Fill employee to all subsequent rows
  onEmployeeBorrowChanged(cell: CellComponent) {
    const row = cell.getRow();
    const data = row.getData();
    const currentIndex = row.getPosition() as number;
    const employeeId = data['EmployeeIDBorrow'];

    if (!employeeId) return;

    // Fill down to all subsequent rows
    const allRows = this.deviceTempTable?.getRows() || [];
    for (let i = currentIndex; i < allRows.length; i++) {
      const rowData = allRows[i].getData();
      rowData['EmployeeIDBorrow'] = employeeId;
      allRows[i].update(rowData);
    }
  }

  // PHASE 2.2: RecheckQty - Recalculate TotalQuantity for duplicate products
  recheckQty() {
    if (!this.deviceTempTable) return;

    const allRows = this.deviceTempTable.getRows();
    const productQtyMap = new Map<number, number>();

    // First pass: sum quantities by ProductID
    allRows.forEach((row) => {
      const data = row.getData();
      const productId = data['ProductID'];
      const quantity = parseFloat(data['Quantity']) || 0;

      if (productId) {
        const currentTotal = productQtyMap.get(productId) || 0;
        productQtyMap.set(productId, currentTotal + quantity);
      }
    });

    // Second pass: update TotalQuantity for all rows with same ProductID
    allRows.forEach((row) => {
      const data = row.getData();
      const productId = data['ProductID'];

      if (productId && productQtyMap.has(productId)) {
        data['TotalQuantity'] = productQtyMap.get(productId);
        row.update(data);
      }
    });
  }
  // PHASE 3.1: Validate BillCode uniqueness
  async validateBillCodeUniqueness(): Promise<boolean> {
    const billCode = this.formDeviceInfo.get('BillCode')?.value;
    const currentID = this.formDeviceInfo.get('ID')?.value || 0;

    if (!billCode) return true;

    try {
      const response: any = await firstValueFrom(
        this.billImportTechnicalService.getBillImportByCode(billCode)
      );
      if (
        response.status === 1 &&
        response.master &&
        response.master.length > 0
      ) {
        const existingBill = response.master[0];
        // If editing and same ID, it's ok
        if (currentID > 0 && existingBill.ID === currentID) {
          return true;
        }
        // Otherwise it's a duplicate
        this.notification.error(
          'Lỗi',
          `Mã phiếu "${billCode}" đã tồn tại. Vui lòng sử dụng mã khác.`
        );
        return false;
      }
      return true;
    } catch (error) {
      // If error (bill not found), it means it's unique
      return true;
    }
  }

  // Lưu dữ liệu
  async saveData() {
    // PHASE 3.1: Validate form
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }
    const formValue = this.formDeviceInfo.value;

    // Borrow type validation: require EmployeeIDBorrow and DeadlineReturnNCC per row
    if (formValue.BillTypeNew === 1) {
      const invalidRow = this.selectedDevices.find(
        (d: any) => !d.EmployeeIDBorrow || !d.DeadlineReturnNCC
      );
      if (invalidRow) {
        this.notification.warning(
          'Cảnh báo',
          'Đối với phiếu Mượn NCC, vui lòng nhập Người mượn và Hạn trả NCC cho từng dòng.'
        );
        return;
      }
    }
    const payload = {
      billImportTechnical: {
        ID: formValue.ID || 0,
        BillCode: formValue.BillCode,
        CreatDate: formValue.CreatDate,
        Deliver: formValue.Deliver,
        Receiver: formValue.Receiver || '',
        Status: formValue.Status || false,
        Suplier: formValue.Suplier || '',
        BillType: false,
        WarehouseType: formValue.WarehouseType,
        DeliverID: formValue.DeliverID,
        ReceiverID: formValue.ReceiverID,
        SuplierID: 0,
        GroupTypeID: 0,
        Image: formValue.Image || '',
        WarehouseID: formValue.WarehouseID || 1,
        SupplierSaleID: formValue.SupplierSaleID || 0,
        BillTypeNew: formValue.BillTypeNew || 0,
        IsBorrowSupplier: formValue.IsBorrowSupplier || 0,
        CustomerID: formValue.CustomerID || 0,
        BillDocumentImportType: formValue.BillDocumentImportType || 0,
        DateRequestImport: formValue.DateRequestImport,
        RulePayID: formValue.RulePayID,
        IsNormalize: formValue.IsNormalize || false,
        ApproverID: formValue.ApproverID || 0,
      },
      billImportDetailTechnicals: this.selectedDevices.map((device, index) => ({
        ID: device.ID || 0,
        STT: index + 1,
        ProductID: device.ProductID || null,
        ProductCode: device.ProductCode || '',
        ProductName: device.ProductName || '',
        ProductCodeRTC: device.ProductCodeRTC || '',
        Serial: device.Serial || '',
        SerialNumber: device.SerialNumber || '',
        PartNumber: device.PartNumber || '',
        UnitCountName: device.UnitCountName || '',
        NumberInStore: device.NumberInStore || 1,
        Note: device.Note || '',
        DeadlineReturnNCC: device.DeadlineReturnNCC
          ? DateTime.fromJSDate(new Date(device.DeadlineReturnNCC)).toISO()
          : null,
        LocationName: device.LocationName || '',
        Quantity: device.Quantity || 1,
        TotalQuantity: device.TotalQuantity || device.Quantity || 1,
        Price: device.Price || 0,
        TotalPrice: device.TotalPrice || 0,
        UnitID: device.UnitCountID || 0,
        UnitName: device.UnitCountName || '',
        ProjectID: device.ProjectID || 0,
        ProjectCode: device.ProjectCode || '',
        ProjectName: device.ProjectName || '',
        SomeBill: device.SomeBill || '',
        DateSomeBill: device.DateSomeBill
          ? DateTime.fromJSDate(new Date(device.DateSomeBill)).toISO()
          : null,
        DPO: device.DPO || 0,
        DueDate: device.DueDate
          ? DateTime.fromJSDate(new Date(device.DueDate)).toISO()
          : null,
        TaxReduction: device.TaxReduction || 0,
        COFormE: device.COFormE || '',
        Maker: device.Maker || '',
        BillCodePO: device.BillCodePO || '',
        PONCCDetailID: device.PONCCDetailID || 0,
        HistoryProductRTCID: device.HistoryProductRTCID || 0,
        ProductRTCQRCodeID: device.ProductRTCQRCodeID || 0,
        EmployeeIDBorrow: device.EmployeeIDBorrow || 0,
      })),
      billImportTechDetailSerials: this.selectedDevices
        .map((device, index) => {
          const serialIDs = (device.SerialIDs || '')
            .split(',')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id) && id > 0);
          const stt = device.STT ?? index + 1;
          return serialIDs.map((serialID: number) => ({
            ID: serialID || 0,
            STT: stt,
            WarehouseID: formValue.WarehouseID || 1,
          }));
        })
        .flat(),
    };

    this.billImportTechnicalService.saveData(payload).subscribe({
      next: (response: any) => {
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Lưu phiếu thành công'
        );
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể lưu phiếu, vui lòng thử lại sau'
        );
      },
    });
  }
  drawDocumentTable() {
    this.isLoading = true;

    setTimeout(() => {
      this.table_DocumnetImport = new Tabulator(
        this.tableDocumnetImport.nativeElement,
        {
          data: this.documentBillImport, // mảng chứa dữ liệu JSON
          layout: 'fitDataStretch',
          height: '38vh',
          movableColumns: true,
          resizableRows: true,
          reactiveData: true,

          columns: [
            {
              title: 'Trạng thái pur',
              field: 'DocumentStatusPur',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 150,
              editor: (cell, onRendered, success, cancel) => {
                // Chỉ cho edit nếu activePur = true
                if (!this.activePur) {
                  return false;
                }

                const value = cell.getValue();
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = value === true;

                checkbox.style.width = '18px';
                checkbox.style.height = '18px';
                checkbox.style.cursor = 'pointer';

                checkbox.addEventListener('click', (e) => {
                  e.stopPropagation();
                  success(checkbox.checked);
                });

                return checkbox;
              },

              formatter: (cell) => {
                const value = cell.getValue();
                return value
                  ? "<div style='text-align:center'><input type='checkbox' checked disabled></div>"
                  : "<div style='text-align:center'><input type='checkbox' disabled></div>";
              },
            },

            {
              title: 'Mã chứng từ',
              field: 'DocumentImportCode',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Tên chứng từ',
              field: 'DocumentImportName',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Trạng thái',
              field: 'StatusText',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Ngày nhận / hủy nhận',
              field: 'DateRecive',
              headerHozAlign: 'center',
              hozAlign: 'center',
              formatter: 'datetime',
              formatterParams: {
                inputFormat: 'iso',
                outputFormat: 'dd/MM/yyyy HH:mm',
              },
            },
            {
              title: 'Người nhận / Hủy',
              field: 'FullNameRecive',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Lý do huỷ',
              field: 'ReasonCancel',
              headerHozAlign: 'center',
              hozAlign: 'left',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              headerHozAlign: 'center',
              hozAlign: 'left',
              width: 300,
            },
          ],
        }
      );

      this.isLoading = false;
    }, 300);
  }
}
