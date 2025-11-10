import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { SelectControlComponent } from '../../../old/select-control/select-control.component';

import { CustomerServiceService } from '../customer/customer-service/customer-service.service';
import { CustomerMajorDetailComponent } from '../customer-specialization/customer-major-detail/customer-major-detail.component';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
<<<<<<< HEAD:src/app/pages/old/VisionBase/customer-detail/customer-detail.component.ts
import { NOTIFICATION_TITLE } from '../../../../app.config';
=======
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
>>>>>>> 5f94c36de4edfaa15e0ea34bf0dd2be91e663215:src/app/pages/crm/customers/customer-detail/customer-detail.component.ts

@Component({
  selector: 'app-customer-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    CommonModule,
    NzTreeSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css',
})
export class CustomerDetailComponent implements OnInit, AfterViewInit {
  @Input() EditID!: number;
  @Input() isEditMode!: boolean;

  @ViewChild('tb_DataTable', { static: false })
  tb_DataTableElement!: ElementRef;
  @ViewChild('tb_AddressTable', { static: false })
  tb_AddressTableElement!: ElementRef;
  @ViewChild('tb_SaleTable', { static: false })
  tb_SaleTableElement!: ElementRef;

  private tb_DataTable!: Tabulator;
  private tb_AddressTable!: Tabulator;
  private tb_SaleTable!: Tabulator;

  data: any[] = [];
  addressStockTableData: any[] = [];
  customerSaleTableData: any[] = [];
  cboEmployeeDataTable: any[] = [];
  provincesData: any[] = [];
  businessFieldData: any[] = [];
  majorData: any[] = [];

  listIdsContact: any[] = [];
  listIdsAdress: any[]=[];
  listIdsEmp: any[]=[];
  
  dictCustomer: { [key: number]: string } = {};

  // Form validation
  formGroup: FormGroup;

  formData: any = {
    fullName: '',
    address: '',
    province: null,
    provinceCode: '',
    customerCode: '',
    customerShortName: '',
    taxCode: '',
    customerType: 0,
    isBigAccount: false,
    businessField: 0,
    debt: '',
    noteVoucher: '',
    majorId: 0,
    hardCopyVoucher: '',
    productDetails: '',
    checkVoucher: '',
    noteDelivery: '',
    closingDateDebt: new Date(),
  };

  customerTypeData: any[] = [
    { value: 0, customerType: 'Chưa chọn loại hình' },
    { value: 1, customerType: 'SI' },
    { value: 2, customerType: 'Thương mại' },
    { value: 3, customerType: 'Sản xuất' },
    { value: 4, customerType: 'Chế tạo máy' },
    { value: 5, customerType: 'Cá nhân' },
  ];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    // private customerService: CustomerServiceService,
    private customerService: CustomerServiceService,
    public activeModal: NgbActiveModal,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      province: [null, [Validators.required]],
      provinceCode: [{value: '', disabled: true}],
      customerCode: [''],
      customerShortName: ['', [Validators.required]],
      taxCode: [''],
      customerType: [null],
      isBigAccount: [false],
      businessField: [null],
      fullName: ['', [Validators.required]],
      address: ['', [Validators.required]],
      debt: [''],
      noteVoucher: [''],
      majorId: [null, [Validators.required]],
      hardCopyVoucher: [''],
      productDetails: [''],
      checkVoucher: [''],
      noteDelivery: [''],
      closingDateDebt: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadBusinessField();
    this.loadCustomerSpecialization();
    this.loadProvinces();
    this.loadEmployee();
    if (this.isEditMode) {
      this.loadDetailEditMode(this.EditID);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initDataTable();
      this.initAddressTable();
      this.initSaleTable();
    }, 0);
  }

  openCustomerMajorDetail(): void {
    const modalRef = this.modalService.open(CustomerMajorDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'm',
    });
    modalRef.closed.subscribe((result) => {
      if (result === true) {
        this.loadCustomerSpecialization();
      }
    });
  }

  loadDetailEditMode(id: number) {
    this.customerService.getDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          let province = this.provincesData.find(
            (x) => x.Code == response.data.provinceCode
          );
          
          // Cập nhật form values
          this.formGroup.patchValue({
            fullName: response.data.model.CustomerName,
            address: response.data.model.Address,
            businessField: response.data.business.BusinessFieldID,
            provinceCode: response.data.provinceCode,
            customerCode: response.data.customerCode,
            province: province?.Name,
            customerShortName: response.data.model.CustomerShortName,
            taxCode: response.data.model.TaxCode,
            customerType: response.data.model.CustomerType,
            isBigAccount: response.data.model.BigAccount,
            debt: response.data.model.Debt,
            noteVoucher: response.data.model.NoteVoucher,
            majorId: response.data.model.CustomerSpecializationID,
            hardCopyVoucher: response.data.model.HardCopyVoucher,
            productDetails: response.data.model.ProductDetails,
            checkVoucher: response.data.model.CheckVoucher,
            noteDelivery: response.data.model.NoteDelivery,
            closingDateDebt: response.data.model.ClosingDateDebt
              ? response.data.model.ClosingDateDebt.substring(0, 10)
              : new Date().toISOString().split('T')[0],
          });

          // Giữ lại formData cho các mục đích khác nếu cần
          this.formData = {
            fullName: response.data.model.CustomerName,
            address: response.data.model.Address,
            businessField: response.data.business.BusinessFieldID,
            provinceCode: response.data.provinceCode,
            customerCode: response.data.customerCode,
            province: province?.Name,
            customerShortName: response.data.model.CustomerShortName,
            taxCode: response.data.model.TaxCode,
            customerType: response.data.model.CustomerType,
            isBigAccount: response.data.model.BigAccount,
            debt: response.data.model.Debt,
            noteVoucher: response.data.model.NoteVoucher,
            majorId: response.data.model.CustomerSpecializationID,
            hardCopyVoucher: response.data.model.HardCopyVoucher,
            productDetails: response.data.model.ProductDetails,
            checkVoucher: response.data.model.CheckVoucher,
            noteDelivery: response.data.model.NoteDelivery,
            closingDateDebt: response.data.model.ClosingDateDebt
              ? response.data.model.ClosingDateDebt.substring(0, 10)
              : new Date().toISOString().split('T')[0],
          };

          this.addressStockTableData = response.data.addressStock;
          this.tb_AddressTable.replaceData(this.addressStockTableData);
          this.data = response.data.customerContact;
          this.tb_DataTable.replaceData(this.data);
          this.customerSaleTableData = response.data.customerEmployeeWithName;

          this.tb_SaleTable.replaceData(this.customerSaleTableData);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  closeModal() {
    if (this.formGroup) {
      this.formGroup.reset();
      this.formGroup.markAsPristine();
      this.formGroup.markAsUntouched();
    }

 if (this.tb_SaleTable) {
  this.tb_SaleTable.clearData();
}

if (this.tb_DataTable) {
  this.tb_DataTable.clearData();
}

if (this.tb_AddressTable) {
  this.tb_AddressTable.clearData();
}

    this.activeModal.close({ success: false, reloadData: false });
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {});

      return container;
    };
  }

  loadCustomerSpecialization(): void {
    this.customerService.getCustomerSpecialization().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.majorData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadEmployee() {
    this.customerService.getEmployees(0).subscribe({
      next: (res: any) => {
        const employeeData = res.data;
        if (Array.isArray(employeeData)) {
          this.cboEmployeeDataTable = employeeData
            .filter(
              (employee) =>
                employee.ID !== null &&
                employee.ID !== undefined &&
                employee.ID !== 0
            )
            .map((employee) => ({
              label: employee.FullName,
              value: employee.ID,
            }));
        } else {
          this.cboEmployeeDataTable = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi lấy danh sách nhân viên'
        );
        this.cboEmployeeDataTable = [];
      },
    });
  }

  loadBusinessField(): void {
    this.customerService.getBusinessField().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.businessFieldData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadProvinces(): void {
    this.customerService.getProvinces().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.provincesData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  onProvinceChange(provinceName: string): void {
    if (provinceName) {
      const selectedProvince = this.provincesData.find(
        (province) => province.Name === provinceName
      );
      if (selectedProvince && selectedProvince.Code) {
        this.formGroup.patchValue({ provinceCode: selectedProvince.Code });
      }
    } else {
      this.formGroup.patchValue({ provinceCode: '' });
    }
  }

  addNewRow(): void {
    const newRow = {
      ID: null,
      ContactName: '',
      CustomerPart: '',
      CustomerPosition: '',
      CustomerTeam: '',
      ContactPhone: '',
      ContactEmail: '',
    };

    // this.data.push(newRow);
    this.tb_DataTable.addRow(newRow);
  }

  addNewAddressRow(): void {
    const newRow = {
      ID: null,
      Address: '',
    };
    this.tb_AddressTable.addRow(newRow);
  }

  addNewSaleRow(): void {
    const newRow = {
      ID: null,
      FullName: '',
    };
    this.tb_SaleTable.addRow(newRow);
  }

  saveAndClose() {
    // Validate form trước khi lưu
    if (!this.validateForm()) {
      return;
    }

    const contactRows = this.tb_DataTable ? this.tb_DataTable.getData() : [];
    const addressRows = this.tb_AddressTable
      ? this.tb_AddressTable.getData()
      : [];
    const saleRows = this.tb_SaleTable ? this.tb_SaleTable.getData() : [];

    const customerContacts = (contactRows || [])
    .filter((r: any) =>
      r?.ContactName?.trim()
    )
    .map((r: any) => ({
      ID: r?.ID ?? 0,
      ContactName: r?.ContactName ?? '',
      CustomerPart:r?.CustomerPart ?? '',
      CustomerPosition:r?.CustomerPosition ?? '',
      CustomerTeam:r?.CustomerTeam ?? '',
      ContactPhone:r?.ContactPhone ?? '',
      ContactEmail:r?.ContactEmail ?? ''
    }));
  const addressStocks = (addressRows || [])
    .filter((r: any) => r?.Address?.trim())
    .map((r: any) => ({
      ID: r?.ID ?? 0,
      Address: r?.Address ?? '',
    }));
  
  const customerEmployees = (saleRows || [])
    .filter((r: any) => r?.EmployeeID)
    .map((r: any) => ({
      ID: r?.ID ?? 0,
      EmployeeID: r?.EmployeeID ?? null,
    }));
  

   // Lấy giá trị từ form controls, bao gồm cả các trường disabled
  const formValues = this.formGroup.getRawValue(); // Sử dụng getRawValue thay vì value
    const isEditing = this.isEditMode && !!this.EditID && this.EditID > 0;
    const customer = {

      ID: isEditing ? this.EditID : 0,
      Province: formValues.province ?? '',
      CustomerCode: formValues.provinceCode + '-' + formValues.customerCode,
      CustomerName: formValues.fullName ?? '',
      CustomerShortName: formValues.customerShortName ?? '',
      TaxCode: formValues.taxCode ?? '',
      CustomerType: formValues.customerType ?? null,
      BigAccount: formValues.isBigAccount,
      Address: formValues.address ?? '',
      Debt: formValues.debt ?? '',
      NoteVoucher: formValues.noteVoucher ?? '',
      HardCopyVoucher: formValues.hardCopyVoucher ?? '',
      ProductDetails: formValues.productDetails ?? '',
      CheckVoucher: formValues.checkVoucher ?? '',
      NoteDelivery: formValues.noteDelivery ?? '',
      IsDeleted: false,
      ClosingDateDebt: formValues.closingDateDebt ?? null,
      FullName: formValues.fullName ?? '',
      CustomerSpecializationID: formValues.majorId ?? 0,
    } as any;

    const payload = {
      Customer: customer,
      CustomerContacts: customerContacts,
      AddressStocks: addressStocks,
      CustomerEmployees: customerEmployees,
      deletedIdsEmp : this.listIdsEmp,
      deletedIdsAdrress: this.listIdsAdress,
      deletedIdsContact: this.listIdsContact,
      BusinessFieldID: formValues.businessField,
    };
    console.log("payloadB: ", payload);
    this.customerService.save(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thông báo', 'Lưu thành công');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(
            'Lỗi',
            res?.message || 'Không thể lưu dữ liệu'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.message || 'Không thể lưu dữ liệu');
      },
    });
  }

  initDataTable(): void {
    if (!this.tb_DataTableElement?.nativeElement) {
      console.warn('tb_DataTableElement chưa sẵn sàng');
      return;
    }
  
    if (this.tb_DataTable) {
      this.tb_DataTable.destroy(); // Tránh khởi tạo lại
    }
    this.tb_DataTable = new Tabulator(this.tb_DataTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      //height:'40vh',
      data: this.data,
      // layout: 'fitColumns',
       height: '100%',
      // selectableRows: 1,
      // pagination: true,
      // paginationSize: 100,
      // movableColumns: true,
      // resizableRows: true,
      // reactiveData: true,
      rowHeader: false,
      selectableRows:1,
     layout:"fitColumns",
     pagination: false,
     
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen:true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewRow();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            
            let data = cell.getRow().getData();
            console.log("hahah",data)
            let id = data['ID'];
            let contactName = data['ContactName'];
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa nhân viên`,
              nzContent: `${contactName}?`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.listIdsContact.includes(id)) this.listIdsContact.push(id);
                  this.tb_DataTable.deleteRow(cell.getRow());
                } else {
                  this.tb_DataTable.deleteRow(cell.getRow());
                }
              },
            });
            //this.updateSTTColumn();
          },
        },
        { title: 'ID', field: 'ID', visible: false },
        { title: 'Họ tên', field: 'ContactName', editor: true,   frozen:true, },
        { title: 'Bộ phận', field: 'CustomerPart', editor: true },
        { title: 'Chức vụ', field: 'CustomerPosition', editor: true },
        { title: 'Team', field: 'CustomerTeam', editor: true },
        { title: 'SĐT', field: 'ContactPhone', editor: true },
        { title: 'Email', field: 'ContactEmail', editor: true },
      ],
    });
  }
  initAddressTable(): void {
    if (!this.tb_AddressTableElement?.nativeElement) {
      console.warn('tb_DataTableElement chưa sẵn sàng');
      return;
    }
  
    if (this.tb_AddressTable) {
      this.tb_AddressTable.destroy(); // Tránh khởi tạo lại
    }
    this.tb_AddressTable = new Tabulator(
      this.tb_AddressTableElement.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
      
        data: this.addressStockTableData,
        // layout: 'fitColumns',
        height: '100%',
        // selectableRows: 1,
        // pagination: true,
        // paginationSize: 100,
        // movableColumns: true,
        // resizableRows: true,
        // reactiveData: true,
        rowHeader: false,
        selectableRows:1,
       layout:"fitColumns",
       pagination: false,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            frozen:true,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
            headerClick: () => {
              this.addNewAddressRow();
            },
            formatter: (cell) => {
              const data = cell.getRow().getData();
              let isDeleted = data['IsDeleted'];
              return !isDeleted
                ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
                : '';
            },
            cellClick: (e, cell) => {
              let data = cell.getRow().getData();
              let id = data['ID'];
              let isDeleted = data['IsDeleted'];
              if (isDeleted) {
                return;
              }
              this.modal.confirm({
                nzTitle: `Bạn có chắc chắn muốn xóa địa chỉ này không ?`,
                nzOkText: 'Xóa',
                nzOkType: 'primary',
                nzCancelText: 'Hủy',
                nzOkDanger: true,
                nzOnOk: () => {
                  if (id > 0) {
                    if (!this.listIdsAdress.includes(id)) this.listIdsAdress.push(id);
                    this.tb_AddressTable.deleteRow(cell.getRow());
                  } else {
                    this.tb_AddressTable.deleteRow(cell.getRow());
                  }
                },
              });
              //this.updateSTTColumn();
            },
          },
          { title: 'ID', field: 'ID', visible: false },
          { title: 'Địa chỉ giao hàng', field: 'Address', editor: true },
        ],
      }
    );
  }
  initSaleTable(): void {
    if (!this.tb_SaleTableElement?.nativeElement) {
      console.warn('tb_SaleTableElement chưa sẵn sàng');
      return;
    }
  
    if (this.tb_SaleTable) {
      this.tb_SaleTable.destroy(); // Tránh khởi tạo lại
    }
    this.tb_SaleTable = new Tabulator(this.tb_SaleTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.customerSaleTableData,
     
      // layout: 'fitColumns',
       height: '100%',
       rowHeader: false,
       selectableRows:1,
      layout:"fitColumns",
      pagination: false,
      // pagination: true,
      // paginationSize: 100,
      // movableColumns: true,
      // resizableRows: true,
      // reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        {
          title: '',
          field: 'addRow',
          hozAlign: 'center',
          width: 40,
          frozen:true,
          headerSort: false,
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: () => {
            this.addNewSaleRow();
          },
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fullName = data['FullName']
            let isDeleted = data['IsDeleted'];
            if (isDeleted) {
              return;
            }
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa nhân viên sale`,
              nzContent: `${fullName}`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.listIdsEmp.includes(id)) this.listIdsEmp.push(id);
                  this.tb_SaleTable.deleteRow(cell.getRow());
                  console.log("this: ", this.listIdsEmp)
                } else {
                  this.tb_SaleTable.deleteRow(cell.getRow());
                }
              },
            });
            //this.updateSTTColumn();
          },
        },
        { title: 'ID', field: 'EmployeeID', visible:false },
        {
          title: 'Nhân viên Sale',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: this.createdControl(
            SelectControlComponent,
            this.injector,
            this.appRef,
            () => this.cboEmployeeDataTable,
            {
              valueField: 'value',
              labelField: 'label',
            }
          ),
          formatter: (cell) => {
            const val = cell.getValue();
            if (!val) {
              return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
            }
            const employee = this.cboEmployeeDataTable.find(
              (p: any) => p.value === val
            );
            const employeeName = employee ? employee.label : val;
            return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${employeeName}</p> <i class="fas fa-angle-down"></i></div>`;
          },
          cellEdited: (cell) => {
            const row = cell.getRow();
            const newValue = cell.getValue();
            const selectedEmployee = this.cboEmployeeDataTable.find(
              (p: any) => p.value === newValue
            );
            console.log('dât', selectedEmployee);
            if (selectedEmployee) {
              row.update({
                EmployeeID: selectedEmployee.value,
              });
            }
          },
        },
      ],
    });
  }

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.formGroup.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'province':
            return 'Vui lòng chọn tỉnh!';
          case 'customerShortName':
            return 'Vui lòng nhập ký hiệu!';
          case 'fullName':
            return 'Vui lòng nhập tên khách hàng!';
          case 'address':
            return 'Vui lòng nhập địa chỉ!';
          case 'majorId':
            return 'Vui lòng chọn ngành nghề!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
    this.trimAllStringControls();
    const requiredFields = [
      'province',
      'customerShortName',
      'fullName',
      'address',
      'majorId'
    ];
    const invalidFields = requiredFields.filter(key => {
      const control = this.formGroup.get(key);
      return !control || control.invalid || control.value === '' || control.value == null;
    });
    if (invalidFields.length > 0) {
      this.formGroup.markAllAsTouched();
      return false;
    }
    return true;
  }
  //#endregion
}
