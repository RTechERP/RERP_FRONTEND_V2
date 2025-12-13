import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RegisterIdeaDetailComponent } from './register-idea-detail/register-idea-detail.component';
import { RegisterIdeaScoreComponent } from './register-idea-score/register-idea-score.component';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { RegisterIdeaService } from './register-idea-service/register-idea.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-register-idea',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzModalModule,
    NzFormModule,
  ],
  templateUrl: './register-idea.component.html',
  styleUrl: './register-idea.component.css'
})
export class RegisterIdeaComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;

  sizeSearch: string = '0';
  
  // Filters
  filters: any = {
    dateStart: new Date(),
    dateEnd: new Date(),
    departmentId: 0,
    employeeId: 0,
    registerTypeId: 0,
    keyword: '',
  };

  // Data
  departments: any[] = [];
  employees: any[] = [];
  registerTypes: any[] = [];
  
  // Current user info
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  isAdmin: boolean = false;
  headOfDepartment: number = 0;
  
  // Filter disable flags
  disableEmployeeFilter: boolean = false;
  disableDepartmentFilter: boolean = false;
  
  // Selected row
  selectedRow: any = null;
  selectedId: number = 0;

  constructor(
    private registerIdeaService: RegisterIdeaService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {
    // Set default dates
    const dateStart = new Date();
    dateStart.setMonth(dateStart.getMonth() - 1);
    this.filters.dateStart = dateStart;
    this.filters.dateEnd = new Date();
  }

  ngOnInit() {
    this.getCurrentUser();
    this.loadDepartments();
    this.loadEmployees();
    this.loadRegisterTypes();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initTable();
      this.loadData();
    }, 100);
  }

  getCurrentUser() {
    this.currentEmployeeId = this.appUserService.employeeID || 0;
    this.currentDepartmentId = this.appUserService.departmentID || 0;
    this.currentDepartmentName = this.appUserService.departmentName || '';
    this.isAdmin = this.appUserService.isAdmin;
    if(this.currentDepartmentId == 1) {
      this.currentEmployeeId = 0;
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.departments = data.data || [];
          // Tìm HeadofDepartment từ department hiện tại
          const currentDept = this.departments.find(d => d.ID === this.currentDepartmentId);
          if (currentDept) {
            this.headOfDepartment = currentDept.HeadofDepartment || 0;
          }
          // Áp dụng logic disable filter
          this.applyFilterRestrictions();
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
      }
    });
  }

  applyFilterRestrictions() {
    // Nếu DepartmentId != 1: disable employee và department filter
    if (this.currentDepartmentId !== 1) {
      this.disableEmployeeFilter = true;
      this.disableDepartmentFilter = true;
      this.filters.employeeId = this.currentEmployeeId;
      this.filters.departmentId = this.currentDepartmentId;
    } 
    // Nếu EmployeeId == HeadofDepartment: disable employee filter
    else if (this.currentEmployeeId === this.headOfDepartment) {
      this.disableEmployeeFilter = true;
      this.filters.employeeId = this.currentEmployeeId;
    }
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.employees = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
      }
    });
  }

  loadRegisterTypes() {
    this.registerIdeaService.getCourseCatalog().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.registerTypes = data.data || [];
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách loại đề tài:', error);
      }
    });
  }

  search() {
    this.loadData();
  }

  loadData() {
    const dateStart = new Date(this.filters.dateStart || new Date());
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(this.filters.dateEnd || new Date());
    dateEnd.setHours(23, 59, 59, 999);

    this.registerIdeaService.getIdeas(
      this.currentEmployeeId,
      dateStart,
      dateEnd,
      this.filters.keyword || '',
      this.filters.employeeId || 0,
      this.filters.departmentId || 0,
      this.filters.registerTypeId || 0
    ).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          let data = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            data = response.data.data;
          } else if (response.data?.dt && Array.isArray(response.data.dt)) {
            data = response.data.dt;
          } else {
            data = response.data || [];
          }
          
          if (this.tb_Master) {
            this.tb_Master.replaceData(data);
          }
        } else {
          if (this.tb_Master) {
            this.tb_Master.replaceData([]);
          }
        }
      },
      error: (error) => {
        console.error('Error loading register idea data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu!');
        if (this.tb_Master) {
          this.tb_Master.replaceData([]);
        }
      }
    });
  }

  addNewIdea() {
    const modalRef = this.modalService.open(RegisterIdeaDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      // windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.ideaId = 0;
    modalRef.componentInstance.isEdit = false;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.search();
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
  }

  initTable() {
    if (!this.tb_MasterElement) {
      console.error('tb_Master element not found');
      return;
    }

    const rowMenu = [
      {
        label: '<i class="fas fa-edit"></i> Sửa',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.editIdea(rowData);
        },
      },
      {
        label: '<i class="fas fa-star"></i> Chấm điểm',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.scoreIdea(rowData);
        },
      },
      {
        label: '<i class="fas fa-trash"></i> Xóa',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          // Chỉ cho phép xóa nếu chưa có điểm BGD
          if (!rowData['BGDScoreNew'] || rowData['BGDScoreNew'] === '') {
            this.deleteIdea(rowData);
          } else {
            this.notification.error('Lỗi', 'Không thể xóa ý tưởng đã được chấm điểm bởi BGD');
          }
        },
      },
    ];

    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      rowHeader: false,
      pagination: false,
      paginationMode: 'local',
      selectableRows: 1,
      rowContextMenu: rowMenu,
      data: [],
      columns: [
        {
          title: 'STT',
          field: 'STT',
          sorter: 'number',
          width: 60,
          formatter: 'rownum',
        },
        {
          title: 'Tên dự án / Đề tài',
          field: 'Description',
          sorter: 'string',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Loại đề tài',
          field: 'RegisterTypeName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Ngày bắt đầu',
          field: 'DateStart',
          sorter: 'date',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Ngày kết thúc',
          field: 'DateEnd',
          sorter: 'date',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Chủ nhiệm đề tài',
          field: 'EmployeeName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Phòng ban phối hợp',
          field: 'DepartmentName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Ngày đăng ký',
          field: 'DateRegister',
          sorter: 'date',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'TBP chấm điểm',
          field: 'IsApprovedTBP',
          sorter: 'boolean',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value 
              ? '<span style="color: #54ca68;">Đã chấm</span>' 
              : '<span style="color: #fc544b;">Chưa chấm</span>';
          },
        },
        {
          title: 'BGD chấm điểm',
          field: 'IsApproved',
          sorter: 'boolean',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value 
              ? '<span style="color: #54ca68;">Đã chấm</span>' 
              : '<span style="color: #fc544b;">Chưa chấm</span>';
          },
        },
        {
          title: 'Ngày TBP chấm điểm',
          field: 'DateApprovedTBP',
          sorter: 'date',
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Trưởng bộ phận',
          field: 'TBPName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Ngày BGĐ chấm điểm',
          field: 'DateApproved',
          sorter: 'date',
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = new Date(value);
            if (isNaN(date.getTime())) return value;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
        {
          title: 'Ban giám đốc',
          field: 'BGDName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Điểm trung bình',
          field: 'BGDScoreNew',
          sorter: 'string',
          width: 120,
        },
      ],
    });

    // Lắng nghe sự kiện row selection
    this.tb_Master.on('rowClick', (e: any, row: RowComponent) => {
      const data = row.getData();
      this.selectedRow = data;
      this.selectedId = data?.['ID'] || 0;
      console.log('Selected row:', this.selectedRow);
    });
  }

  editIdea(data: any) {
    const modalRef = this.modalService.open(RegisterIdeaDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      // windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.ideaId = data.ID;
    modalRef.componentInstance.isEdit = true;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.search();
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
  }

  scoreIdea(data: any) {
    const modalRef = this.modalService.open(RegisterIdeaScoreComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.ideaId = data.ID;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.search();
        }
      },
      (reason) => {
        console.log('Modal dismissed');
      }
    );
  }

  openEditModal() {
    if (!this.selectedRow || this.selectedId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
      return;
    }
    this.editIdea(this.selectedRow);
  }

  onScoreIdea() {
    if (!this.selectedRow || this.selectedId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để chấm điểm');
      return;
    }
    this.scoreIdea(this.selectedRow);
  }

  onDeleteIdea() {
    if (!this.selectedRow || this.selectedId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
      return;
    }
    this.deleteIdea(this.selectedRow);
  }

  deleteIdea(data: any) {
    // Kiểm tra nếu đã có điểm BGD thì không cho xóa
    if (data['BGDScoreNew'] && data['BGDScoreNew'] !== '') {
      this.notification.warning('Cảnh báo', 'Không thể xóa ý tưởng đã được chấm điểm bởi BGD');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa ý tưởng này?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.registerIdeaService.deleteIdea(data.ID).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.selectedRow = null;
              this.selectedId = 0;
              this.search();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Xóa thất bại');
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa ý tưởng');
          }
        });
      }
    });
  }
}
