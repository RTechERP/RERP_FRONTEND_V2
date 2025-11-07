import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal'; // ✅ Giữ cho confirm dialog
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // ✅ Chính cho modal

// Import Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

// Services
import {
  EmployeePurchaseService,
  EmployeePurchaseDto,
  EmployeeDto,
  TaxCompanyDto,
  EmployeePurchaseSearchParams,
} from './employee-purchase-service/employee-purchase.service';
import { EmployeePurchaseDetailComponent } from './employee-purchase-detail/employee-purchase-detail.component';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-employee-purchase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzSplitterModule,
    NzSelectModule,
    NzModalModule, // ✅ Cho confirm dialog
    NzFormModule,
    HasPermissionDirective,
  ],
  templateUrl: './employee-purchase.component.html',
  styleUrls: ['./employee-purchase.component.css'],
})
export class EmployeePurchaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('tb_employeePurchase', { static: false })
  tb_employeePurchaseContainer!: ElementRef;

  // Tabulator instance
  tb_employeePurchase: any;

  // ✅ Properties for grouped employees
  employees: any[] = []; // Grouped employees by department
  allEmployeeList: EmployeeDto[] = []; // Raw employee data

  // Properties for data
  employeePurchases: EmployeePurchaseDto[] = [];
  filteredEmployeePurchases: EmployeePurchaseDto[] = [];
  companyList: TaxCompanyDto[] = [];
  selectedEmployee: EmployeePurchaseDto | null = null;

  // Properties for loading states
  isLoadTable: boolean = false;

  // Properties for search panel toggle
  showSearchPanel: boolean = false;
  sizeSearch: string = '300px';

  // Properties for search
  searchValue: string = '';
  private searchTimeout: any;

  // Filter properties
  selectedEmployeeFilter: number | null = null;
  selectedCompanyFilter: number | null = null;

  // Current search parameters
  private currentSearchParams: EmployeePurchaseSearchParams = {};

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private nzModal: NzModalService, // ✅ Cho confirm dialog
    private employeePurchaseService: EmployeePurchaseService,
    private ngbModal: NgbModal, // ✅ Chính cho modal
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadAllEmployees();
    this.loadCompanyList();
    this.loadEmployeePurchases();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_employeePurchaseContainer?.nativeElement) {
        this.drawTbEmployeePurchase(
          this.tb_employeePurchaseContainer.nativeElement
        );
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.tb_employeePurchase) {
      this.tb_employeePurchase.destroy();
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadAllEmployees(): void {
    this.employeePurchaseService.getAllEmployee().subscribe({
      next: (response: any) => {
        console.log('Employee Response:', response);

        let employeeData: EmployeeDto[] = [];

        if (response) {
          if (
            response.Success &&
            response.Data &&
            Array.isArray(response.Data)
          ) {
            employeeData = response.Data;
          } else if (response.data && Array.isArray(response.data)) {
            employeeData = response.data;
          } else if (Array.isArray(response)) {
            employeeData = response;
          } else {
            console.warn('No valid employee data found');
            employeeData = [];
          }
        }

        this.allEmployeeList = employeeData;

        this.employees = this.employeePurchaseService.createdDataGroup(
          this.allEmployeeList,
          'DepartmentName'
        );

        console.log('All Employee List:', this.allEmployeeList);
        console.log('Grouped Employees:', this.employees);
      },
      error: (error) => {
        console.error('Load employees error:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
        this.allEmployeeList = [];
        this.employees = [];
      },
    });
  }

  loadEmployeePurchases(searchParams?: EmployeePurchaseSearchParams): void {
    this.isLoadTable = true;

    const params: EmployeePurchaseSearchParams = {
      keyword: searchParams?.keyword || this.searchValue || '',
      employeeID: searchParams?.employeeID || this.selectedEmployeeFilter || 0,
      taxCompanyID:
        searchParams?.taxCompanyID || this.selectedCompanyFilter || 0,
    };

    this.currentSearchParams = params;

    console.log('Search params:', params);

    this.employeePurchaseService.getAllEmployeePurchase(params).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);

        let processedData: EmployeePurchaseDto[] = [];

        if (response && response.Success && Array.isArray(response.Data)) {
          processedData = response.Data;
        } else if (response && Array.isArray(response.data)) {
          processedData = response.data;
        } else if (
          response &&
          response.status === 1 &&
          Array.isArray(response.data)
        ) {
          processedData = response.data;
        } else {
          console.warn('No valid data found in response');
          processedData = [];
        }

        this.employeePurchases = processedData;
        this.filteredEmployeePurchases = [...this.employeePurchases];

        if (this.tb_employeePurchase) {
          this.tb_employeePurchase.setData(this.filteredEmployeePurchases);
          this.tb_employeePurchase.redraw();
        }

        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.isLoadTable = false;

        this.notification.error(
          'Lỗi',
          'Không thể tải dữ liệu từ API: ' + (error.message || 'Unknown error')
        );

        this.employeePurchases = [];
        this.filteredEmployeePurchases = [];

        if (this.tb_employeePurchase) {
          this.tb_employeePurchase.setData(this.filteredEmployeePurchases);
          this.tb_employeePurchase.redraw();
        }
      },
    });
  }

  loadCompanyList(): void {
    this.employeePurchaseService.getAllTaxCompany().subscribe({
      next: (response: any) => {
        if (response.Success && response.Data) {
          this.companyList = response.Data;
        } else if (response.data) {
          this.companyList = response.data;
        } else if (Array.isArray(response)) {
          this.companyList = response;
        } else {
          console.warn('No company data found');
          this.companyList = [];
        }
      },
      error: (error) => {
        console.error('Load company list error:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách công ty');
        this.companyList = [];
      },
    });
  }

  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!input) return true;

    let employee: any = null;
    for (const group of this.employees) {
      employee = group.options.find(
        (opt: any) => opt.item.ID === option.nzValue
      );
      if (employee) {
        employee = employee.item;
        break;
      }
    }

    if (!employee) return false;

    const searchText = input.toLowerCase();
    return (
      employee.FullName?.toLowerCase().includes(searchText) ||
      employee.ID?.toString().includes(searchText) ||
      employee.Code?.toLowerCase().includes(searchText) ||
      employee.DepartmentName?.toLowerCase().includes(searchText)
    );
  };

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadEmployeePurchases({
        keyword: this.searchValue || '',
        employeeID: this.selectedEmployeeFilter || 0,
        taxCompanyID: this.selectedCompanyFilter || 0,
      });
    }, 300);
  }

  onEmployeeFilterChange(): void {
    console.log('Employee filter changed to:', this.selectedEmployeeFilter);
    this.loadEmployeePurchases({
      keyword: this.searchValue || '',
      employeeID: this.selectedEmployeeFilter || 0,
      taxCompanyID: this.selectedCompanyFilter || 0,
    });
  }

  onCompanyFilterChange(): void {
    console.log('Company filter changed to:', this.selectedCompanyFilter);
    this.loadEmployeePurchases({
      keyword: this.searchValue || '',
      employeeID: this.selectedEmployeeFilter || 0,
      taxCompanyID: this.selectedCompanyFilter || 0,
    });
  }

  resetSearch(): void {
    this.searchValue = '';
    this.selectedEmployeeFilter = null;
    this.selectedCompanyFilter = null;

    this.loadEmployeePurchases({
      keyword: '',
      employeeID: 0,
      taxCompanyID: 0,
    });
  }

  // ✅ Update addEmployeePurchase - sử dụng NgbModal giống meeting-type
  addEmployeePurchase(): void {
    const modalRef = this.ngbModal.open(EmployeePurchaseDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.employeePurchaseID = 0;
    modalRef.componentInstance.isEdit = false;
    modalRef.componentInstance.currentData = null;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.refreshData();
        }
      },
      (dismissed) => {
        if (dismissed) {
          this.refreshData();
        }
      }
    );
  }

  // ✅ Update editEmployeePurchase - sử dụng NgbModal giống meeting-type
  editEmployeePurchase(): void {
    if (!this.selectedEmployee) {
      this.notification.error('Thông báo', 'Vui lòng chọn nhân viên cần sửa!');
      return;
    }

    const modalRef = this.ngbModal.open(EmployeePurchaseDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.employeePurchaseID = this.selectedEmployee.ID;
    modalRef.componentInstance.isEdit = true;
    modalRef.componentInstance.currentData = { ...this.selectedEmployee };

    modalRef.result.then(
      (result) => {
        if (result) {
          this.refreshData();
        }
      },
      (dismissed) => {
        if (dismissed) {
          this.refreshData();
        }
      }
    );
  }

  // ✅ deleteEmployeePurchase method giữ nguyên - vẫn dùng NzModal cho confirm
  deleteEmployeePurchase(): void {
    if (!this.selectedEmployee) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn 1 nhân viên cần xóa!',
        { nzStyle: { fontSize: '0.75rem' } }
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa nhân viên <strong>"${this.selectedEmployee?.EmployeeName}"</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDelete(),
    });
  }

  confirmDelete(): void {
    if (!this.selectedEmployee) return;

    const deleteData: EmployeePurchaseDto = {
      ID: this.selectedEmployee.ID,
      EmployeeID: this.selectedEmployee.EmployeeID,
      TaxCompayID: this.selectedEmployee.TaxCompayID,
      Telephone: this.selectedEmployee.Telephone || '',
      Email: this.selectedEmployee.Email || '',
      EmployeeName: this.selectedEmployee.EmployeeName || '',
      FullName: this.selectedEmployee.FullName || '',

      IsDeleted: true,
      UpdatedBy: this.employeePurchaseService.LoginName || 'Current User',
      UpdatedDate: new Date(),

      CreatedBy: this.selectedEmployee.CreatedBy,
      CreatedDate: this.selectedEmployee.CreatedDate,
    };

    this.employeePurchaseService.saveEmployeePurchase(deleteData).subscribe({
      next: (response: any) => {
        console.log('Delete response:', response);

        if (
          response &&
          (response.Success || response.success || response.status === 1)
        ) {
          this.notification.success(
            'Thông báo',
            'Xóa nhân viên mua hàng thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );

          this.selectedEmployee = null;
          this.refreshData();
        } else {
          this.notification.error(
            'Thông báo',
            response?.Message || response?.message || 'Xóa không thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.notification.error(
          'Lỗi',
          'Không thể xóa: ' + (error.message || 'Unknown error'),
          { nzStyle: { fontSize: '0.75rem' } }
        );
      },
    });
  }

  refreshData(): void {
    this.selectedEmployee = null;
    this.resetSearch();
  }

  drawTbEmployeePurchase(container: HTMLElement): void {
    let contextMenu = [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-edit"></i> Sửa</span>',
        action: (e: any, row: any) => {
          this.selectedEmployee = row.getData();
          this.editEmployeePurchase();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:red;"><i class="fas fa-trash"></i> Xóa</span>',
        action: (e: any, row: any) => {
          this.selectedEmployee = row.getData();
          this.deleteEmployeePurchase();
        },
      },
    ];

    this.tb_employeePurchase = new Tabulator(container, {
      height: '89vh',
      layout: 'fitColumns',
      locale: 'vi',
      pagination: true,
      paginationSize: 30,
      paginationSizeSelector: [10,30, 50, 100, 500],
      paginationButtonCount: 5,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      data: this.filteredEmployeePurchases,

      groupBy: ['Company'],
      groupStartOpen: true,
      groupHeader: function (value: any, count: any, data: any, group: any) {
        return `Công ty: ${value}`;
      },

      rowContextMenu: contextMenu,
      selectableRows: 1,
      selectableRowsRangeMode: 'click',
      columns: [
        {
          title: 'Mã nhân viên',
          field: 'Code',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'center',
          sorter: 'number',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? `${value.toString().padStart(3, '0')}` : '';
          },
        },
        {
          title: 'Tên nhân viên',
          field: 'EmployeeName',
          width: 300,
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Tên hiển thị',
          field: 'FullName',
          width: 300,
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },

        {
          title: 'Số điện thoại',
          field: 'Telephone',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Email',
          field: 'Email',
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
      ],
    });

    this.tb_employeePurchase.on('rowClick', (e: any, row: any) => {
      this.selectedEmployee = row.getData();
    });

    this.tb_employeePurchase.on('rowDblClick', (e: any, row: any) => {
      this.selectedEmployee = row.getData();
      // Kiểm tra quyền trước khi cho phép sửa bằng double click
      if (this.permissionService.hasPermission('N33,N1')) {
        this.editEmployeePurchase();
      }
    });

    this.tb_employeePurchase.on(
      'rowSelectionChanged',
      (data: any, rows: any) => {
        this.selectedEmployee = rows.length > 0 ? rows[0].getData() : null;
      }
    );

    this.tb_employeePurchase.on('groupClick', (e: any, group: any) => {
      group.toggle();
    });
  }

  highlightSearchKeyword(text: string): string {
    if (!this.searchValue || !this.searchValue.trim() || !text) {
      return text;
    }
    const keyword = this.searchValue.trim();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(
      regex,
      '<span style="background-color: #ffff00; color: #000; font-weight: bold; padding: 1px 2px; border-radius: 2px;">$1</span>'
    );
  }
}
