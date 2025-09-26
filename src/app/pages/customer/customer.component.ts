import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { RowComponent, TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CustomerServiceService } from './customer-service/customer-service.service';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzConfigService } from 'ng-zorro-antd/core/config';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import * as ExcelJS from 'exceljs';

import { saveAs } from 'file-saver';
import { CustomerSpecializationFormComponent } from './customer-specialization-form/customer-specialization-form.component';
import { forkJoin } from 'rxjs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
  imports: [
    CustomerSpecializationFormComponent,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzNotificationModule,
    NzCheckboxModule,
    NzFormModule,
    NzSelectModule,
    NzSpinModule,
    NgIf,
  ],
  providers: [NzModalService, NzNotificationService, NzConfigService],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
})
export class CustomerComponent implements OnInit, AfterViewInit {
  private tabulator!: Tabulator;
  private tabulatorContacts!: Tabulator;
  private tabulatorEmployeeSale!: Tabulator;
  private tabulatorAddress!: Tabulator;
  private tabulatorContactsCreate: Tabulator | null = null;
  private tabulatorAddressCreate: Tabulator | null = null;
  private tabulatorEmployeeSaleCreate: Tabulator | null = null;

  customers: any[] = [];
  selectedCustomer: any = null;
  customerContacts: any[] = [];
  employeeSales: any[] = [];
  address: any[] = [];
  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  customerForm!: FormGroup;
  customersToExcel: any[] = [];
  isModalVisible = false;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  businessFieldList: any[] = [];
  teamList: any[] = [];
  majorList: any[] = [];
  provinces: any[] = [];
  private customerContactsCreate: any[] = [];
  private addressesCreate: any[] = [];
  private employeeSalesCreate: any[] = [];
  private employeeList: any[] = [];

  @ViewChild('tb_Customer', { static: false })
  tb_customerContainer!: ElementRef;

  @ViewChild('tb_Contact', { static: false })
  tb_contactContainer!: ElementRef;

  @ViewChild('tb_EmployeeSale', { static: false })
  tb_employeeSaleContainer!: ElementRef;

  @ViewChild('tb_AddressStock', { static: false })
  tb_addressStockContainer!: ElementRef;

  // Add search form properties
  searchForm!: FormGroup;
  searchTeamList: any[] = [];
  searchEmployeeList: any[] = [];

  constructor(
    private customerService: CustomerServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    this.initForm();
    this.initSearchForm();
  }

  private initForm() {
    this.customerForm = this.fb.group({
      ID: [0],
      Province: [null, Validators.required],
      CodeProvinces: ['', Validators.required],
      CustomerCode: ['', Validators.required],
      CustomerShortName: ['', Validators.required],
      TaxCode: [''],
      CustomerType: [''],
      BigAccount: [false],
      CustomerName: ['', Validators.required],
      Address: ['', Validators.required],
      BusinessFieldID: [null],
      CustomerSpecializationID: [null, Validators.required],
      ProductDetails: [''],
      Debt: [''],
      NoteDelivery: [''],
      NoteVoucher: [''],
      ClosingDateDebt: [new Date().toISOString().split('T')[0]],
      HardCopyVoucher: [''],
      CheckVoucher: [''],
      IsDeleted: [false],
    });
  }

  private initSearchForm() {
    this.searchForm = this.fb.group({
      team: [0],
      employee: [0],
      keyword: [''],
    });
  }

  ngOnInit() {
    this.loadCustomers();
    this.loadCustomersToExcel();
    this.loadProvinces();
    this.loadEmployees();
    this.loadMajor();
    this.loadBusinessField();
    this.loadTeams();
    this.loadSearchData();
  }

  ngAfterViewInit(): void {
    this.initializeTabulator(this.tb_customerContainer.nativeElement);
    this.initializeTabulatorContacts(this.tb_contactContainer.nativeElement);
    this.initializeTabulatorEmployeeSale(
      this.tb_employeeSaleContainer.nativeElement
    );
    this.initializeTabulatorAddress(
      this.tb_addressStockContainer.nativeElement
    );
    this.initializeTabulatorContactsCreate();
    this.initializeTabulatorAddressCreate();
    this.initializeTabulatorEmployeeSaleCreate();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  //#region Hàm khởi tạo bảng Khách hàng
  private initializeTabulator(container: HTMLElement): void {
    this.tabulator = new Tabulator(container, {
      data: this.customers,
      selectableRows: 1,
      layout: 'fitDataFill',
      height: '90vh',
      columns: [
        {
          title: 'Mã khách hàng',
          field: 'CustomerCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên kí hiệu',
          field: 'CustomerShortName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên khách hàng',
          field: 'CustomerName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Địa chỉ',
          field: 'Address',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã số thuế',
          field: 'TaxCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại hình',
          field: 'CustomerType',
          hozAlign: 'left',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            switch (value) {
              case 0:
                return '';
              case 1:
                return 'SL';
              case 2:
                return 'Thương mại';
              case 3:
                return 'Sản xuất';
              case 4:
                return 'Chế tạo máy';
              case 5:
                return 'Cá nhân';
              default:
                return value;
            }
          },
        },
        {
          title: 'Lưu ý giao hàng',
          field: 'NoteDelivery',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Lưu ý chứng từ',
          field: 'NoteVoucher',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Đầu mối gửi check chứng từ',
          field: 'CheckVoucher',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Đầu mối gửi chứng từ bản cứng',
          field: 'HardCopyVoucher',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày chốt công nợ',
          field: 'ClosingDateDebt',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Công nợ',
          field: 'Debt',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Địa chỉ giao hàng',
          field: 'AddressStock',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 50, 100],
    });

    this.tabulator.on('rowClick', (evt,row:RowComponent) => {
      console.log(row.getData());
      const data = row.getData();
      const customerId = data['ID'];
      this.loadCustomerContacts(customerId);
      this.loadCustomerEmployeeSale(customerId);
      this.loadCustomerAddress(customerId);
    });

    this.tabulator.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedCustomer = row.getData();
      this.sizeTbDetail = null;
    });

    this.tabulator.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
      this.selectedCustomer = row.getData();
    });
  }
  //#endregion

  //#region Hàm khởi tạo bảng Thông tin liên hệ
  private initializeTabulatorContacts(container: HTMLElement): void {
    this.tabulatorContacts = new Tabulator(container, {
      data: this.customerContacts,
      layout: 'fitColumns',
      height: '85vh',
      columns: [
        {
          title: 'Tên liên hệ',
          field: 'ContactName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Bộ phận',
          field: 'CustomerPart',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Chức vụ',
          field: 'CustomerPosition',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Team',
          field: 'CustomerTeam',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'SĐT',
          field: 'ContactPhone',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Email',
          field: 'ContactEmail',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
    });
  }
  //#endregion

  //#region Hàm khởi tạo bảng Nhân viên sale
  private initializeTabulatorEmployeeSale(container: HTMLElement): void {
    this.tabulatorEmployeeSale = new Tabulator(container, {
      data: this.employeeSales,
      layout: 'fitColumns',
      height: '85vh',
      columns: [
        {
          title: 'Tên nhân viên sale',
          field: 'EmployeeName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
    });
  }
  //#endregion

  //#region Hàm khởi tạo bảng Địa chỉ giao hàng
  private initializeTabulatorAddress(container: HTMLElement): void {
    this.tabulatorAddress = new Tabulator(container, {
      data: this.address,
      layout: 'fitColumns',
      height: '85vh',
      columns: [
        {
          title: 'Địa chỉ giao hàng',
          field: 'Address',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
    });
  }
  //#endregion

  //#region Hàm bảng Tabulator nhập liên hệ khi tạo khách hàng
  private initializeTabulatorContactsCreate(): void {
    this.tabulatorContactsCreate = new Tabulator('#customerContact-table-create',
      {
        data: this.customerContactsCreate, // Initialize with empty array
        layout: 'fitDataStretch',
        //responsiveLayout: true,
        height: '25vh',
        columns: [
          {
            title: ' + ',
            field: 'actions',
            formatter: 'buttonCross', // 'X' button for deleting rows in cells
            headerSort: false,
            width: 40,
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerFormatter: function () {
              return "<i class='fas fa-plus' style='cursor:pointer;font-size:1.2rem;color:blue;' title='Thêm dòng'></i>"; // '+' button in header
            },
            headerClick: (e: any, column: any) => {
              this.addContactRow();
            },
            cellClick: (e: any, cell: any) => {
              cell.getRow().delete(); // Delete row on 'X' button click
            },
          } as any,
          {
            title: 'Họ tên',
            field: 'ContactName',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Bộ phận',
            field: 'CustomerPart',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Chức vụ',
            field: 'CustomerPosition',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Team',
            field: 'CustomerTeam',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'SĐT',
            field: 'ContactPhone',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Email',
            field: 'ContactEmail',
            editor: 'input',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      }
    );
    if (this.tabulatorContactsCreate) {
      this.tabulatorContactsCreate.on('cellEdited', () => {
        this.customerContactsCreate = this.tabulatorContactsCreate!.getData();
      });
      this.tabulatorContactsCreate.on('dataChanged', () => {
        this.customerContactsCreate = this.tabulatorContactsCreate!.getData();
      });
    }
  }
  //#endregion

  //#region Hàm bảng Tabulator nhập địa chỉ giao hàng khi tạo khách hàng
  private initializeTabulatorAddressCreate(): void {
    this.tabulatorAddressCreate = new Tabulator('#address-table-create', {
      data: this.addressesCreate, // Initialize with empty array
      layout: 'fitDataStretch',
      height: '25vh',
      columns: [
        {
          title: '+',
          field: 'addRow',
          headerSort: false,
          formatter: 'buttonCross', // 'X' button for deleting rows in cells
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerFormatter: function () {
            return "<i class='fas fa-plus-circle text-primary' style='cursor:pointer;font-size:1.2rem;' title='Thêm dòng'></i>";
          },
          headerClick: (e: any, column: any) => {
            this.addAddressRow();
          },
          cellClick: (e: any, cell: any) => {
            cell.getRow().delete(); // Delete row on 'X' button click
          },
        } as any,
        {
          title: 'Địa chỉ giao hàng',
          field: 'Address',
          editor: 'input',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });
    if (this.tabulatorAddressCreate) {
      this.tabulatorAddressCreate.on('cellEdited', () => {
        this.addressesCreate = this.tabulatorAddressCreate!.getData();
      });
      this.tabulatorAddressCreate.on('dataChanged', () => {
        this.addressesCreate = this.tabulatorAddressCreate!.getData();
      });
    }
  }
  //#endregion

  //#region Hàm bảng Tabulator nhập nhân viên sale khi tạo khách hàng
  private initializeTabulatorEmployeeSaleCreate(): void {
    this.tabulatorEmployeeSaleCreate = new Tabulator(
      '#employeeSale-table-create',
      {
        data: this.employeeSalesCreate,
        layout: 'fitDataStretch',
        height: '25vh',
        columns: [
          {
            title: ' + ',
            field: 'addRow',
            headerSort: false,
            width: 40,
            formatter: 'buttonCross',
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerFormatter: function () {
              return "<i class='fas fa-plus-circle text-primary' style='cursor:pointer;font-size:1.2rem;' title='Thêm dòng'></i>";
            },
            headerClick: (e: any, column: any) => {
              this.addEmployeeSaleRow();
            },
            cellClick: (e: any, cell: any) => {
              cell.getRow().delete();
            },
          } as any,
          {
            title: 'Tên nhân viên',
            field: 'EmployeeName',
            editor: 'list',
            editorParams: {
              values: this.employeeList.map((employee: any) => ({
                value: employee.ID,
                label: employee.FullName,
              })),
              searchable: true,
              autocomplete: true,
            },
            formatter: (cell: any) => {
              const value = cell.getValue();
              const employee = this.employeeList.find(
                (emp: any) => emp.ID === value
              );
              return employee ? employee.FullName : value;
            },
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      }
    );

    if (this.tabulatorEmployeeSaleCreate) {
      this.tabulatorEmployeeSaleCreate.on('cellEdited', () => {
        this.employeeSalesCreate = this.tabulatorEmployeeSaleCreate!.getData();
      });
      this.tabulatorEmployeeSaleCreate.on('dataChanged', () => {
        this.employeeSalesCreate = this.tabulatorEmployeeSaleCreate!.getData();
      });
    }
  }
  //#endregion

  //#region Hàm thêm dòng mới cho từng bảng (gọi từ nút/thao tác ngoài Tabulator nếu muốn)
  addContactRow() {
    if (this.tabulatorContactsCreate) {
      this.tabulatorContactsCreate.addRow({});
    }
  }
  addAddressRow() {
    if (this.tabulatorAddressCreate) {
      this.tabulatorAddressCreate.addRow({});
    }
  }
  addEmployeeSaleRow() {
    if (this.tabulatorEmployeeSaleCreate) {
      this.tabulatorEmployeeSaleCreate.addRow({});
    }
  }
  //#endregion

  //#region Hàm lấy dữ liệu từ API
  loadCustomers() {
    this.isLoading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        console.log(data.data);
        this.customers = Array.isArray(data.data) ? data.data : [data.data];
        this.isLoading = false;
        this.initializeTabulator(this.tb_customerContainer.nativeElement);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading customers:', error);
      },
    });
  }

  // Load customer contacts
  loadCustomerContacts(customerId: number) {
    this.customerService.getCustomerContacts(customerId).subscribe({
      next: (data) => {
        this.customerContacts = Array.isArray(data.data)
          ? data.data
          : [data.data];
        if (this.tabulatorContacts) {
          this.tabulatorContacts.setData(this.customerContacts);
        }
      },
      error: (error) => {
        console.error('Error loading customer contacts:', error);
      },
    });
  }

  // Load customer employee sale
  loadCustomerEmployeeSale(customerId: number) {
    this.customerService.getCustomerEmployeeSale(customerId).subscribe({
      next: (data) => {
        if (data.data && Array.isArray(data.data)) {
          this.employeeSales = data.data.map((sale: any) => ({
            ID: sale.ID,
            EmployeeID: sale.EmployeeID,
            EmployeeName: sale.EmployeeName,
          }));
        } else {
          this.employeeSales = [];
        }
        if (this.tabulatorEmployeeSale) {
          this.tabulatorEmployeeSale.setData(this.employeeSales);
        }
      },
      error: (error) => {
        console.error('Error loading customer employee sale:', error);
      },
    });
  }

  // Load customer address
  loadCustomerAddress(customerId: number) {
    this.customerService.getCustomerAddress(customerId).subscribe({
      next: (data) => {
        if (data.data) {
          if (typeof data.data === 'object' && !Array.isArray(data.data)) {
            this.address = [
              {
                ID: data.data.ID || 0,
                Address: data.data.Address || '',
              },
            ];
          } else if (Array.isArray(data.data)) {
            this.address = data.data.map((addr: any) => ({
              ID: addr.ID || 0,
              Address: addr.Address || '',
            }));
          } else {
            this.address = [];
          }
        }
        if (this.tabulatorAddress) {
          this.tabulatorAddress.setData(this.address);
        }
      },
      error: (error) => {
        console.error('Error loading customer address:', error);
      },
    });
  }

  loadProvinces() {
    this.customerService.getProvinces().subscribe({
      next: (data: any) => {
        this.provinces = data.data.map((province: any) => ({
          value: `${province.ProvinceName}`,
          label: `${province.ProvinceName}`,
          code: `${province.ProvinceCode}`,
        }));
      },
      error: (error: any) => {
        console.error('Error loading provinces:', error);
      },
    });
  }

  loadTeams() {
    this.customerService.getTeams().subscribe({
      next: (data: any) => {
        this.teamList = data.data.map((team: any) => ({
          value: Number(team.ID),
          label: `${team.GroupSalesName}`,
        }));
      },
      error: (error: any) => {
        console.error('Error loading teams:', error);
      },
    });
  }

  loadBusinessField() {
    this.customerService.getBusinessField().subscribe({
      next: (data: any) => {
        this.businessFieldList = data.data.map((businessField: any) => ({
          value: Number(businessField.ID),
          label: `${businessField.Name}`,
        }));
      },
      error: (error: any) => {
        console.error('Error loading businessFields:', error);
      },
    });
  }

  loadMajor() {
    this.customerService.getCustomerSpecialization().subscribe({
      next: (data: any) => {
        this.majorList = data.data.map((major: any) => ({
          value: Number(major.ID),
          label: `${major.Name}`,
        }));
      },
      error: (error: any) => {
        console.error('Error loading majors:', error);
      },
    });
  }
  //#endregion

  //#region Hàm xuất excel
  loadCustomersToExcel() {
    this.customerService.getCustomersToExcel().subscribe({
      next: (data) => {
        this.customersToExcel = Array.isArray(data.data)
          ? data.data
          : [data.data];
      },
      error: (error) => {
        console.error('Error loading customers for Excel:', error);
      },
    });
  }

  async exportToExcel() {
    // Chuẩn bị dữ liệu xuất, bỏ qua object rỗng và các trường object rỗng trong từng dòng
    const exportData = this.customersToExcel
      .filter((customer) => Object.keys(customer).length > 0)
      .map((customer, idx) => {
        // Loại bỏ các trường object rỗng nếu có
        const safe = (val: any) =>
          val && typeof val === 'object' && Object.keys(val).length === 0
            ? ''
            : val;
        return {
          STT: idx + 1,
          'Tên khách hàng': safe(customer.CustomerName),
          'Địa chỉ': safe(customer.Address),
          Tỉnh: safe(customer.Province),
          'Loại hình': safe(customer.TypeName),
          Ngành: safe(customer.Name),
          'Tên liên hệ': safe(customer.ContactName),
          'Chức vụ': safe(customer.CustomerPart),
          ĐT: safe(customer.ContactPhone),
          Email: safe(customer.ContactEmail),
          Sales: safe(customer.FullName),
          'Mã khách hàng': safe(customer.CustomerCode),
          'Tên ký hiệu': safe(customer.CustomerShortName),
        };
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KhachHang');

    // Thêm header
    worksheet.columns = [
      {
        header: 'STT',
        key: 'STT',
        width: 5,
        style: { alignment: { horizontal: 'center', vertical: 'middle' } },
      },
      { header: 'Tên khách hàng', key: 'Tên khách hàng', width: 30 },
      { header: 'Địa chỉ', key: 'Địa chỉ', width: 40 },
      { header: 'Tỉnh', key: 'Tỉnh', width: 15 },
      { header: 'Loại hình', key: 'Loại hình', width: 15 },
      { header: 'Ngành', key: 'Ngành', width: 20 },
      { header: 'Tên liên hệ', key: 'Tên liên hệ', width: 20 },
      { header: 'Chức vụ', key: 'Chức vụ', width: 15 },
      { header: 'ĐT', key: 'ĐT', width: 15 },
      { header: 'Email', key: 'Email', width: 30 },
      { header: 'Sales', key: 'Sales', width: 25 },
      { header: 'Mã khách hàng', key: 'Mã khách hàng', width: 20 },
      { header: 'Tên ký hiệu', key: 'Tên ký hiệu', width: 15 },
    ];

    // Thêm dữ liệu
    exportData.forEach((row) => worksheet.addRow(row));

    // Định dạng header
    worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
    });
    worksheet.getRow(1).height = 30;

    // Định dạng các dòng dữ liệu
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber !== 1) {
        row.height = 40;
        row.getCell('STT').alignment = {
          horizontal: 'center',
          vertical: 'middle',
        };
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          if (colNumber !== 1) {
            cell.font = { name: 'Tahoma', size: 10 };
            cell.alignment = {
              horizontal: 'left',
              vertical: 'middle',
              wrapText: true,
            };
          }
        });
      }
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      blob,
      `DanhSachKhachHang_${new Date()
        .toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
        .replace(/\//g, '')}.xlsx`
    );
  }
  //#endregion

  //#region Hàm mở modal thêm
  openAddModal() {
    this.isEditMode = false;
    this.isModalVisible = true;
    this.resetForm();

    // Initialize Tabulator tables after modal is opened
    setTimeout(() => {
      this.initializeTabulatorContactsCreate();
      this.initializeTabulatorAddressCreate();
      this.initializeTabulatorEmployeeSaleCreate();
    }, 100);
  }
  //#endregion

  //#region Hàm mở modal sửa và hiển thị dữ liệu lên modal
  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng chọn khách hàng cần chỉnh sửa'
      );
      return;
    }
    this.isEditMode = true;

    // Load customer data into form
    const selectedCustomer = this.tabulator.getSelectedData()[0];
    const customerCodeParts = this.selectedCustomer.CustomerCode?.split(
      '-'
    ) || ['', ''];

    // Create an array of observables for all data loading operations
    const loadOperations = [
      this.customerService.getBusinessFieldLinkByCustomerID(
        this.selectedCustomer.ID
      ),
      this.customerService.getCustomerContacts(selectedCustomer.ID),
      this.customerService.getCustomerAddress(selectedCustomer.ID),
      this.customerService.getCustomerEmployeeSale(selectedCustomer.ID),
    ];

    // Use forkJoin to wait for all operations to complete
    forkJoin(loadOperations).subscribe({
      next: ([
        businessFieldResponse,
        contactsResponse,
        addressResponse,
        employeeSaleResponse,
      ]) => {
        // Handle business field data
        const businessFieldLink = businessFieldResponse.data;
        if (businessFieldLink) {
          this.selectedCustomer.BusinessFieldID =
            businessFieldLink[0].BusinessFieldID;
        }

        // Find province
        const selectedProvince = this.provinces.find(
          (p) => p.label === selectedCustomer.Province
        );

        // Update form values
        this.customerForm.patchValue({
          ID: selectedCustomer.ID,
          Province: selectedProvince ? selectedProvince.value : null,
          CodeProvinces: customerCodeParts[0],
          CustomerCode: selectedCustomer.CustomerCode,
          CustomerShortName: selectedCustomer.CustomerShortName,
          TaxCode: selectedCustomer.TaxCode,
          CustomerType: selectedCustomer.CustomerType?.toString(),
          BigAccount: selectedCustomer.BigAccount,
          CustomerName: selectedCustomer.CustomerName,
          Address: selectedCustomer.Address,
          BusinessFieldID: this.selectedCustomer.BusinessFieldID,
          CustomerSpecializationID: selectedCustomer.CustomerSpecializationID,
          ProductDetails: selectedCustomer.ProductDetails,
          Debt: selectedCustomer.Debt,
          NoteDelivery: selectedCustomer.NoteDelivery,
          NoteVoucher: selectedCustomer.NoteVoucher,
          ClosingDateDebt: selectedCustomer.ClosingDateDebt,
          HardCopyVoucher: selectedCustomer.HardCopyVoucher,
          CheckVoucher: selectedCustomer.CheckVoucher,
          IsDeleted: false,
        });

        // Handle contacts data
        this.customerContactsCreate = Array.isArray(contactsResponse.data)
          ? contactsResponse.data
          : [contactsResponse.data];

        // Handle address data
        if (addressResponse.data) {
          if (
            typeof addressResponse.data === 'object' &&
            !Array.isArray(addressResponse.data)
          ) {
            this.addressesCreate = [
              {
                ID: addressResponse.data.ID || 0,
                Address: addressResponse.data.Address || '',
              },
            ];
          } else if (Array.isArray(addressResponse.data)) {
            this.addressesCreate = addressResponse.data.map((addr: any) => ({
              ID: addr.ID || 0,
              Address: addr.Address || '',
            }));
          } else {
            this.addressesCreate = [];
          }
        }

        // Handle employee sale data
        if (
          employeeSaleResponse.data &&
          Array.isArray(employeeSaleResponse.data)
        ) {
          this.employeeSalesCreate = employeeSaleResponse.data.map(
            (sale: any) => ({
              ID: sale.ID,
              EmployeeID: sale.EmployeeID,
              EmployeeName: sale.EmployeeName,
            })
          );
        } else {
          this.employeeSalesCreate = [];
        }

        // Show modal and initialize Tabulator tables
        this.isModalVisible = true;

        // Initialize Tabulator tables after a short delay to ensure DOM is ready
        setTimeout(() => {
          this.initializeTabulatorContactsCreate();
          this.initializeTabulatorAddressCreate();
          this.initializeTabulatorEmployeeSaleCreate();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading customer data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu khách hàng');
      },
    });
  }
  //#endregion

  //Đóng modal
  closeModal() {
    this.isModalVisible = false;
    this.resetForm();
    this.customerForm.markAsUntouched();
    this.customerForm.markAsPristine();
  }

  //Reset modal
  resetForm() {
    this.customerForm.reset({
      ID: 0,
      Province: '',
      CodeProvinces: '',
      CustomerCode: '',
      CustomerShortName: '',
      TaxCode: '',
      CustomerType: '',
      BigAccount: false,
      CustomerName: '',
      Address: '',
      BusinessFieldID: null,
      CustomerSpecializationID: null,
      ProductDetails: '',
      Debt: '',
      NoteDelivery: '',
      NoteVoucher: '',
      ClosingDateDebt: new Date().toISOString().split('T')[0],
      HardCopyVoucher: '',
      CheckVoucher: '',
      IsDeleted: false,
    });

    // Reset data in Tabulator tables
    if (this.tabulatorContactsCreate) {
      // this.tabulatorContactsCreate.setData([]);
      this.customerContactsCreate = [];
    }
    if (this.tabulatorAddressCreate) {
      // this.tabulatorAddressCreate.setData([]);
      this.addressesCreate = [];
    }
    if (this.tabulatorEmployeeSaleCreate) {
      // this.tabulatorEmployeeSaleCreate.setData([]);
      this.employeeSalesCreate = [];
    }
  }

  //#region Hàm lấy mã tỉnh theo tỉnh
  onProvinceChange(selectedProvince: any) {
    if (selectedProvince) {
      const province = this.provinces.find((p) => p.value === selectedProvince);
      if (province) {
        this.customerForm.patchValue({
          Province: province.value,
          CodeProvinces: province.code,
        });
      }
    } else {
      this.customerForm.patchValue({
        Province: null,
        CodeProvinces: '',
      });
    }
  }
  //#endregion

  //#region Hàm lưu dữ liệu
  onSubmit() {
    if (this.customerForm.invalid) {
      // Mark all controls as touched to trigger validation messages
      Object.keys(this.customerForm.controls).forEach((key) => {
        const control = this.customerForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    if (this.customerForm.valid) {
      this.isSubmitting = true;
      const formData = this.customerForm.value;

      // Format customer code by combining province code and customer code
      formData.CustomerShortName = formData.CustomerShortName.toUpperCase();
      const fullCustomerCode = `${formData.CodeProvinces}-${formData.CustomerShortName}`;
      formData.CustomerCode = fullCustomerCode;
      formData.IsDeleted = false;

      // Get current data from tables
      const currentContacts = this.tabulatorContactsCreate?.getData() || [];
      const currentAddresses = this.tabulatorAddressCreate?.getData() || [];
      const currentSales = this.tabulatorEmployeeSaleCreate?.getData() || [];

      // Find province name from selected province value
      const selectedProvince = this.provinces.find(
        (p) => p.value === formData.Province
      );
      const provinceName = selectedProvince ? selectedProvince.label : '';

      // Prepare the data structure matching the API
      const customerData = {
        ...formData,
        Province: provinceName,
        ProductDetails: formData.ProductDetails || '',
        Contacts: currentContacts.map((contact) => ({
          idConCus: contact.idConCus || 0,
          ID: contact.ID || 0,
          ContactName: contact.ContactName,
          ContactPhone: contact.ContactPhone,
          ContactEmail: contact.ContactEmail,
          CreatedDate: new Date().toISOString(),
          CustomerTeam: contact.CustomerTeam,
          CustomerPart: contact.CustomerPart,
          CustomerPosition: contact.CustomerPosition,
        })),
        Addresses: currentAddresses.map((address) => ({
          ID: address.ID || 0,
          Address: address.Address,
        })),
        Sales: currentSales.map((sale) => {
          if (this.isEditMode && this.employeeSales.length > 0) {
            const existingSale = this.employeeSales.find(
              (es) =>
                es.EmployeeID === parseInt(sale.EmployeeName) ||
                es.EmployeeName === sale.EmployeeName
            );
            if (existingSale) {
              return {
                ID: existingSale.ID,
                EmployeeID: existingSale.EmployeeID,
              };
            }
          }
          return {
            ID: 0,
            EmployeeID: parseInt(sale.EmployeeName),
          };
        }),
        BusinessFieldID: formData.BusinessFieldID,
      };

      console.log('Submitting customer data:', customerData);

      if (this.isEditMode) {
        this.customerService.saveCustomer(customerData).subscribe({
          next: (response) => {
            this.notification.success(
              'Thành công',
              'Cập nhật khách hàng thành công'
            );
            this.closeModal();
            this.loadCustomers();
          },
          error: (error) => {
            this.notification.error(
              'Lỗi',
              'Cập nhật khách hàng thất bại: ' + error.message
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
      } else {
        this.customerService.saveCustomer(customerData).subscribe({
          next: (response) => {
            this.notification.success(
              'Thành công',
              'Tạo khách hàng mới thành công'
            );
            this.closeModal();
            this.loadCustomers();
          },
          error: (error) => {
            this.notification.error(
              'Lỗi',
              'Tạo khách hàng mới thất bại: ' + error.message
            );
          },
          complete: () => {
            this.isSubmitting = false;
          },
        });
      }
    }
  }
  //#endregion

  //#region Hàm lấy dữ liệu nhân viên sale hiển thị lên tabulator nhân viên sale
  loadEmployees() {
    this.customerService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data;
        // Update employee list in tabulator if it exists
        if (this.tabulatorEmployeeSaleCreate) {
          this.tabulatorEmployeeSaleCreate.setColumns([
            {
              title: ' + ',
              field: 'addRow',
              headerSort: false,
              width: 40,
              formatter: 'buttonCross',
              hozAlign: 'center',
              headerHozAlign: 'center',
              headerFormatter: function () {
                return "<i class='fas fa-plus-circle text-primary' style='cursor:pointer;font-size:1.2rem;' title='Thêm dòng'></i>";
              },
              headerClick: (e: any, column: any) => {
                this.addEmployeeSaleRow();
              },
              cellClick: (e: any, cell: any) => {
                cell.getRow().delete();
              },
            } as any,
            {
              title: 'Tên nhân viên',
              field: 'EmployeeName',
              editor: 'list',
              editorParams: {
                values: this.employeeList.map((employee: any) => ({
                  value: employee.ID,
                  label: `${employee.Code} - ${employee.FullName}`,
                })),
                searchable: true,
                autocomplete: true,
              },
              formatter: (cell: any) => {
                const value = cell.getValue();
                const employee = this.employeeList.find(
                  (emp: any) => emp.ID === value
                );
                return employee ? employee.FullName : value;
              },
              hozAlign: 'left',
              headerHozAlign: 'center',
            },
          ]);
        }
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.notification.error(
          'Lỗi',
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
  }
  //#endregion

  //#region Hàm xóa khách hàng
  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn khách hàng cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa khách hàng này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const selectedCustomer = selectedRows[0].getData();
        this.deleteCustomer(selectedCustomer['ID']);
      },
      nzCancelText: 'Hủy',
    });
  }

  deleteCustomer(customerId: number) {
    if (customerId) {
      this.customerService.deleteCustomer(customerId).subscribe({
        next: (response) => {
          this.notification.success('Thành công', 'Xóa khách hàng thành công');
          this.loadCustomers();
        },
        error: (error) => {
          this.notification.error(
            'Lỗi',
            'Xóa khách hàng thất bại: ' + error.message
          );
        },
      });
    }
  }
  //#endregion

  //#region  Hàm mở form Ngành nghề
  openCustomerSpecializationForm() {
    const modal = new (window as any).bootstrap.Modal(
      document.getElementById('customerSpecializationModal')
    );
    modal.show();
  }
  //#endregion

  //#region Hàm cho form Tìm kiếm
  loadSearchData() {
    // Load teams for search
    this.customerService.getTeams().subscribe({
      next: (data: any) => {
        this.searchTeamList = data.data.map((team: any) => ({
          value: Number(team.ID),
          label: team.GroupSalesName,
        }));
      },
      error: (error) => {
        console.error('Error loading teams for search:', error);
      },
    });

    // Load employees for search
    this.customerService.getEmployees().subscribe({
      next: (data: any) => {
        this.searchEmployeeList = data.data.map((employee: any) => ({
          value: Number(employee.ID),
          label: employee.FullName,
        }));
      },
      error: (error) => {
        console.error('Error loading employees for search:', error);
      },
    });
  }

  onSearch() {
    const searchData = this.searchForm.value;
    this.customerService
      .filterCustomer(
        searchData.team || 0,
        searchData.employee || 0,
        searchData.keyword || ''
      )
      .subscribe({
        next: (data: any) => {
          this.customers = Array.isArray(data.data) ? data.data : [data.data];
          if (this.tb_customerContainer) {
            this.initializeTabulator(this.tb_customerContainer.nativeElement);
          }
        },
        error: (error) => {
          console.error('Error searching customers:', error);
          this.notification.error('Lỗi', 'Không thể tìm kiếm khách hàng');
        },
      });
  }

  resetSearch() {
    this.searchForm.reset();
    this.loadCustomers();
  }
  //#endregion
}
