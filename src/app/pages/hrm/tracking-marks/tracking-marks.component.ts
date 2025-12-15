import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  TemplateRef,
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
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { TrackingMarksService } from './tracking-marks-service/tracking-marks.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { TrackingMarksDetailComponent } from './tracking-marks-detail/tracking-marks-detail.component';

@Component({
  selector: 'app-tracking-marks',
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
  templateUrl: './tracking-marks.component.html',
  styleUrl: './tracking-marks.component.css'
})
export class TrackingMarksComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
  tb_Master!: Tabulator;

  sizeSearch: string = '0';
  
  // Filters
  filters: any = {
    dateStart: new Date(),
    dateEnd: new Date(),
    departmentId: 0,
    employeeId: 0,
    status: -1,
    keyword: '',
  };

  // Data
  departments: any[] = [];
  employees: any[] = [];
  
  // Current user info
  currentEmployeeId: number = 0;
  currentDepartmentId: number = 0;
  currentDepartmentName: string = '';
  isAdmin: boolean = false;
  
  // Filter disable flags
  disableEmployeeFilter: boolean = false;
  disableDepartmentFilter: boolean = false;
  
  // Selected row
  selectedRow: any = null;
  selectedId: number = 0;
  
  // Check if can edit/delete
  get canEditOrDelete(): boolean {
    if (!this.selectedRow) return false;
    const status = this.selectedRow['Status'] || this.selectedRow['status'] || 0;
    return status === 0; // Chỉ cho phép sửa/xóa khi status = 0 (Chưa hoàn thành)
  }
  
  // Value for expect date complete modal
  expectDateCompleteValue: Date | null = null;
  
  // Value for reason cancel modal
  reasonCancelValue: string = '';
  
  @ViewChild('expectDateCompleteModalContent', { static: false }) expectDateCompleteModalContent!: TemplateRef<any>;
  @ViewChild('reasonCancelModalContent', { static: false }) reasonCancelModalContent!: TemplateRef<any>;

  constructor(
    private trackingMarksService: TrackingMarksService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {
    // Set default dates - tháng hiện tại
    const dateStart = new Date();
    dateStart.setDate(1);
    this.filters.dateStart = dateStart;
    
    const dateEnd = new Date();
    dateEnd.setMonth(dateEnd.getMonth() + 1);
    dateEnd.setDate(0);
    this.filters.dateEnd = dateEnd;
  }

  ngOnInit() {
    this.getCurrentUser();
    this.loadDepartments();
    this.loadEmployees();
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
    
    if (this.currentDepartmentId == 1) {
      this.currentEmployeeId = 0;
    }
    
    this.applyFilterRestrictions();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.departments = data.data || [];
          this.applyFilterRestrictions();
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách phòng ban:', error);
      }
    });
  }

  applyFilterRestrictions() {
    if (this.isAdmin) {
      this.disableEmployeeFilter = false;
      this.disableDepartmentFilter = false;
    } else {
      // Nếu không phải admin và không phải department 1 thì disable filter
      if (this.currentDepartmentId !== 1) {
        this.disableEmployeeFilter = true;
        this.disableDepartmentFilter = true;
        this.filters.employeeId = this.currentEmployeeId;
        this.filters.departmentId = this.currentDepartmentId;
      } else {
        // Department 1 thì enable filter
        this.disableEmployeeFilter = false;
        this.disableDepartmentFilter = false;
        this.filters.employeeId = this.currentEmployeeId;
        this.filters.departmentId = this.currentDepartmentId;
      }
    }
  }

  loadEmployees() {
    this.trackingMarksService.getEmployees().subscribe({
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

  search() {
    this.loadData();
  }

  loadData() {
    const dateStart = new Date(this.filters.dateStart || new Date());
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(this.filters.dateEnd || new Date());
    dateEnd.setHours(23, 59, 59, 999);

    // Trim keyword trước khi gửi lên API
    const keyword = (this.filters.keyword || '').trim();

    this.trackingMarksService.getAll(
      dateStart,
      dateEnd,
      keyword,
      this.filters.employeeId || 0,
      this.filters.departmentId || 0,
      this.filters.status || -1
    ).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          let data = [];
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            data = response.data.data;
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
        console.error('Error loading tracking marks data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu!');
        if (this.tb_Master) {
          this.tb_Master.replaceData([]);
        }
      }
    });
  }

  addNewTrackingMark() {
    const modalRef = this.modalService.open(TrackingMarksDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.trackingMarkId = 0;
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

    const rowMenu = (e: any, row: RowComponent) => {
      const rowData = row.getData();
      const status = rowData['Status'] || rowData['status'] || 0;
      const canEditDelete = status === 0;
      
      const menu: any[] = [];
      
      if (canEditDelete) {
        menu.push({
          label: '<i class="fas fa-edit"></i> Sửa',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.editTrackingMark(rowData);
          },
        });
        menu.push({
          label: '<i class="fas fa-trash"></i> Xóa',
          action: (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.deleteTrackingMark(rowData);
          },
        });
      }
      
      menu.push({
        label: '<i class="fas fa-check"></i> Xác nhận hoàn thành',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.approveTrackingMark(rowData, 1);
        },
      });
      menu.push({
        label: '<i class="fas fa-times"></i> Hủy duyệt',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.approveTrackingMark(rowData, 2);
        },
      });
      
      return menu;
    };

    this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      rowHeader: false,
      pagination: false,
      paginationMode: 'local',
      selectableRows: 1,
      rowContextMenu: rowMenu,
      rowFormatter: (row: any) => {
        const data = row.getData();
        const status = data['Status'] || data['status'] || 0;
        const isUrgent = data['IsUrgent'] || data['isUrgent'] || false;
        
        // Tô màu đỏ đậm nếu hủy duyệt (Status = 2)
        if (status === 2) {
          row.getElement().style.backgroundColor = '#ffcdd2';
        }
        // Tô màu cam đậm nếu đóng dấu gấp (IsUrgent = true)
        else if (isUrgent) {
          row.getElement().style.backgroundColor = '#ffe0b2';
        }
        // Màu mặc định
        else {
          row.getElement().style.backgroundColor = '';
        }
      },
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
          title: 'Ngày đăng ký',
          field: 'RegisterDate',
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
          title: 'Hạn đóng dấu',
          field: 'Deadline',
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
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
          },
        },
        {
          title: 'Dự kiến hoàn thành',
          field: 'ExpectDateComplete',
          sorter: 'date',
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">Chọn ngày</span>';
            const date = new Date(value);
            if (isNaN(date.getTime())) return '<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">Chọn ngày</span>';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${day}/${month}/${year}</span>`;
          },
          cellClick: (e: any, cell: any) => {
            e.preventDefault();
            e.stopPropagation();
            const rowData = cell.getRow().getData();
            this.updateExpectDateComplete(rowData);
          },
        },
        {
          title: 'Trạng thái',
          field: 'Status',
          sorter: 'number',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value === 1) return '<span style="color: #54ca68;">Hoàn thành</span>';
            if (value === 2) return '<span style="color: #fc544b;">Đã hủy</span>';
            return '<span style="color: #ffc107;">Chưa hoàn thành</span>';
          },
        },
        {
          title: 'Người đăng ký',
          field: 'EmployeeName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Bộ phận',
          field: 'DepartmentName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Loại văn bản',
          field: 'DocumentTypeName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Tên văn bản',
          field: 'DocumentName',
          sorter: 'string',
          width: 200,
        },
        {
          title: 'Số lượng bản',
          field: 'DocumentQuantity',
          sorter: 'number',
          width: 100,
          hozAlign: 'right',
        },
        {
          title: 'Số tờ/bản',
          field: 'DocumentTotalPage',
          sorter: 'number',
          width: 100,
          hozAlign: 'right',
        },
        {
          title: 'Tên công ty',
          field: 'TaxCompanyText',
          sorter: 'string',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Người ký chính',
          field: 'EmployeeSignName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Quy cách đóng dấu',
          field: 'SealNameText',
          sorter: 'string',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Người duyệt',
          field: 'ApprovedName',
          sorter: 'string',
          width: 150,
        },
        {
          title: 'Lý do hủy',
          field: 'ReasonCancel',
          sorter: 'string',
          width: 200,
          formatter: 'textarea',
        },
      ],
    });

    // Lắng nghe sự kiện row selection
    this.tb_Master.on('rowClick', (e: any, row: RowComponent) => {
      const data = row.getData();
      this.selectedRow = data;
      this.selectedId = data?.['ID'] || data?.['Id'] || 0;
    });
  }

  editTrackingMark(data: any) {
    const status = data.Status || data.status || 0;
    if (status !== 0) {
      this.notification.error('Lỗi', 'Phiếu đã duyệt hoặc đã hủy, không thể sửa');
      return;
    }
    
    const modalRef = this.modalService.open(TrackingMarksDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.trackingMarkId = data.ID || data.Id;
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

  openEditModal() {
    if (!this.selectedRow || this.selectedId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
      return;
    }
    if (!this.canEditOrDelete) {
      this.notification.error('Lỗi', 'Phiếu đã duyệt hoặc đã hủy, không thể sửa');
      return;
    }
    this.editTrackingMark(this.selectedRow);
  }

  onDeleteTrackingMark() {
    if (!this.selectedRow || this.selectedId === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
      return;
    }
    if (!this.canEditOrDelete) {
      this.notification.error('Lỗi', 'Phiếu đã duyệt hoặc đã hủy, không thể xóa');
      return;
    }
    this.deleteTrackingMark(this.selectedRow);
  }

  deleteTrackingMark(data: any) {
    const status = data.Status || data.status || 0;
    if (status !== 0) {
      this.notification.error('Lỗi', 'Phiếu đã duyệt hoặc đã hủy, không thể xóa');
      return;
    }
    
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa phiếu theo dõi đóng dấu này?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.trackingMarksService.delete(data.ID || data.Id).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Xóa thành công');
              this.selectedRow = null;
              this.selectedId = 0;
              this.search();
            } else {
              // Hiển thị message từ API khi status = 0 hoặc lỗi
              const errorMessage = res?.message || res?.error?.message || 'Xóa thất bại';
              this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            }
          },
          error: (error) => {
            // Xử lý lỗi từ HTTP error response
            const errorMessage = error?.error?.message || error?.message || 'Lỗi khi xóa phiếu';
            this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          }
        });
      }
    });
  }

  approveTrackingMark(data: any, status: number) {
    const statusText = status === 2 ? 'Hủy duyệt' : 'Xác nhận hoàn thành';

    if (status === 2) {
      this.reasonCancelValue = '';
      const modal = this.nzModal.create({
        nzTitle: statusText,
        nzContent: this.reasonCancelModalContent,
        nzOkText: 'Xác nhận',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzWidth: 500,
        nzOnOk: () => {
          if (!this.reasonCancelValue || !this.reasonCancelValue.trim()) {
            this.notification.warning('Cảnh báo', 'Vui lòng nhập lý do hủy duyệt');
            return;
          }
          this.doApprove(data, status, this.reasonCancelValue);
          modal.close();
        },
        nzOnCancel: () => {
          this.reasonCancelValue = '';
        }
      });
    } else {
      this.nzModal.confirm({
        nzTitle: statusText,
        nzContent: 'Bạn có chắc muốn xác nhận phiếu theo dõi đóng dấu không?',
        nzOkText: 'Xác nhận',
        nzOkType: 'primary',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          this.doApprove(data, status, '');
        }
      });
    }
  }

  doApprove(data: any, status: number, reasonCancel: string) {
    const model = {
      listID: [data.ID || data.Id],
      status: status,
      reasonCancel: reasonCancel
    };

    this.trackingMarksService.approve(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Thành công');
          this.search();
        } else {
          // Hiển thị message từ API khi status = 0 hoặc lỗi
          const errorMessage = res?.message || res?.error?.message || 'Thất bại';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        }
      },
      error: (error) => {
        // Xử lý lỗi từ HTTP error response
        const errorMessage = error?.error?.message || error?.message || 'Lỗi khi duyệt phiếu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  updateExpectDateComplete(data: any) {
    const currentDate = data.ExpectDateComplete ? new Date(data.ExpectDateComplete) : new Date();
    this.expectDateCompleteValue = currentDate;
    
    const modal = this.nzModal.create({
      nzTitle: 'Cập nhật ngày dự kiến hoàn thành',
      nzContent: this.expectDateCompleteModalContent,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzWidth: 500,
      nzOnOk: () => {
        if (!this.expectDateCompleteValue) {
          this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày hợp lệ');
          return;
        }

        this.trackingMarksService.updateExpectDateComplete(data.ID || data.Id, this.expectDateCompleteValue).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công');
              modal.close();
              this.search();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Cập nhật thất bại');
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi cập nhật ngày dự kiến hoàn thành');
          }
        });
      },
      nzOnCancel: () => {
        this.expectDateCompleteValue = null;
      }
    });
  }
}
