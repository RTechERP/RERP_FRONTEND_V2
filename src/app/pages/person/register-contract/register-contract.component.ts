import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { RegisterContractService } from './register-contract-service/register-contract.service';
import { AuthService } from '../../../auth/auth.service';
import { RegistercontractdetailComponent } from './register-contract-detail/register-contract-detail.component';

@Component({
  selector: 'app-register-contract',
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzSpinModule,
    NzModalModule,
  ],
  templateUrl: './register-contract.component.html',
  styleUrl: './register-contract.component.css'
})
export class RegisterContractComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private registerContractService: RegisterContractService,
    private notification: NzNotificationService,
    private authService: AuthService,
    private modal: NgbModal,
    private nzModal: NzModalService
  ) {}

  @ViewChild('tb_registerContract', { static: false })
  tb_registerContractContainer!: ElementRef;

  @ViewChild('cancelReasonTemplate', { static: false })
  cancelReasonTemplate!: TemplateRef<any>;

  sizeSearch: string = '22%';
  isLoadTable: any = false;
  cancelReason: string = '';

  tb_registerContract: any;

  departments: any[] = [];
  employees: any[] = [];
  statuses: any[] = [
    { id: -1, name: 'Tất cả' },
    { id: 0, name: 'Chờ hoàn thành' },
    { id: 1, name: 'Hoàn thành' },
    { id: 2, name: 'Đã hủy' },
  ];

  dateStart: any = DateTime.local().set({ day: 1 }).toISO();
  dateEnd: any = DateTime.local().plus({ month: 1 }).set({ day: 1 }).toISO();
  departmentId: any = 0;
  employeeId: any = 0;
  statusId: any = -1;
  keyword: any;

  // Biến theo dõi selected row và quyền
  selectedRow: any = null;
  currentUserEmployeeId: number = 0;
  isAdmin: boolean = false;

  // Biến điều khiển hiển thị nút
  canEdit: boolean = false;
  canDelete: boolean = false;
  canApprove: boolean = false;
  canCancel: boolean = false;
  //#endregion

  //#region Chạy khi mở
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.drawTbRegisterContract(this.tb_registerContractContainer.nativeElement);
    this.getDepartment();
    this.getEmployees();
    // Gọi getCurrentUser trước, sau đó mới load data
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUserEmployeeId = data.EmployeeID || 0;
          this.employeeId = data.EmployeeID || 0;
          this.departmentId = data.DepartmentID || 0;
          this.isAdmin = data.IsAdmin || false;
          console.log('Current EmployeeID:', this.currentUserEmployeeId);
          console.log('Current DepartmentID:', this.departmentId);
          console.log('Is Admin:', this.isAdmin);
          
          // Gọi getRegisterContracts sau khi đã có employeeId và departmentId
          this.getRegisterContracts();
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin user:', error);
        // Nếu lỗi vẫn load data với giá trị mặc định
        this.getRegisterContracts();
      }
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  getDepartment() {
    this.registerContractService.getDepartment().subscribe({
      next: (response: any) => {
        // Thêm option "Tất cả" vào đầu danh sách
        this.departments = [
          { ID: 0, Name: 'Tất cả' },
          ...response.data
        ];
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getEmployees() {
    this.registerContractService.getEmployees(0).subscribe({
      next: (response: any) => {
        this.employees = this.registerContractService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  private textWithTooltipFormatter = (cell: any): HTMLElement => {
    const value = cell.getValue();
    const div = document.createElement('div');
    
    if (!value || value.trim() === '') {
      return div;
    }
    
    // Style cho div: giới hạn 3 dòng với ellipsis
    div.style.cssText = `
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
      max-height: calc(1.4em * 3);
      cursor: text;
    `;
    
    // Chuyển đổi URLs thành links
    const linkedText = this.linkifyText(value);
    div.innerHTML = linkedText;
    
    // Thêm title attribute để hiển thị tooltip với text gốc (không có HTML)
    div.title = value;
    
    // Cho phép click vào links mà không trigger row selection
    div.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.stopPropagation(); // Ngăn không cho event bubble lên row
      }
    });
    
    return div;
  };
  private linkifyText(text: string): string {
    // Regex pattern để match URLs (http, https, ftp, www)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    
    // Escape HTML để tránh XSS
    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    // Split text thành các phần (text và URLs)
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    // Reset regex
    urlPattern.lastIndex = 0;
    
    while ((match = urlPattern.exec(text)) !== null) {
      // Thêm text trước URL
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }
      
      // Xử lý URL
      let url = match[0];
      let href = url;
      
      // Thêm protocol nếu chưa có
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }
      
      // Tạo link với target="_blank" để mở tab mới
      parts.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline; cursor: pointer;">${escapeHtml(url)}</a>`);
      
      lastIndex = match.index + match[0].length;
    }
    
    // Thêm phần text còn lại
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }
    
    return parts.join('');
  }
  

  resetSearch() {
    this.dateStart = DateTime.local().set({ day: 1 }).toISO();
    this.dateEnd = DateTime.local().plus({ month: 1 }).set({ day: 1 }).toISO();
    this.departmentId = 0;
    this.employeeId = 0;
    this.statusId = -1;
    this.keyword = '';
    if (this.tb_registerContract) {
      this.tb_registerContract.clearFilter();
    }
  }
  //#endregion

  //#region Xử lý bảng đăng ký hợp đồng
  drawTbRegisterContract(container: HTMLElement) {
    this.tb_registerContract = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: true,
      layout: 'fitDataStretch',
      height: '87vh',
      paginationMode: 'local',
      selectableRows: 1,
      rowHeader:false,
      rowFormatter: function(row) {
        const data = row.getData();
        const status = data['Status'];
        const rowElement = row.getElement();
        
        if (status === 0) {
          // Chưa xác nhận - Màu mặc định (không tô màu)
          rowElement.style.backgroundColor = '';
          rowElement.style.color = '';
        } else if (status === 1) {
          // Đã xác nhận - Màu xanh lá
          rowElement.style.backgroundColor = '#90EE90';
          rowElement.style.color = '#000000';
        } else if (status === 2) {
          // Đã hủy - Màu đỏ
          rowElement.style.backgroundColor = '#FF6B6B';
          rowElement.style.color = 'white';
        }
      },
      columns: [
        {
          title: '',
          field: 'actions',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'center',
          frozen: true,
          formatter: (cell: any) => {
            const data = cell.getRow().getData();
            const status = data.Status || 0;
            const employeeId = data.EmployeeID || 0;
            const employeeReciveId = data.EmployeeReciveID || 0;
            
            let buttons = '';
            
            // Logic quyền Sửa, Xóa: Status = 0 VÀ empID == EmployeeId (người đăng ký)
            if (status === 0 && this.currentUserEmployeeId === employeeId) {
              buttons += `
                <button class="btn btn-sm btn-primary me-1" data-action="edit" title="Sửa" style="font-size: 11px; padding: 2px 8px;">
                  Sửa
                </button>
                <button class="btn btn-sm btn-danger me-1" data-action="delete" title="Xóa" style="font-size: 11px; padding: 2px 8px;">
                  Xóa
                </button>
              `;
            }
            
            // Logic quyền Xác nhận, Hủy: empID == EmployeeReciveId (người nhận) HOẶC Admin
            if ((this.currentUserEmployeeId === employeeReciveId || this.isAdmin) && status === 0) {
              buttons += `
                <button class="btn btn-sm btn-success me-1" data-action="approve" title="Xác nhận" style="font-size: 11px; padding: 2px 8px;">
                  Xác nhận
                </button>
                <button class="btn btn-sm btn-warning" data-action="cancel" title="Hủy" style="font-size: 11px; padding: 2px 8px;">
                  Hủy
                </button>
              `;
            }
            
            return buttons || '<span class="text-muted">-</span>';
          },
          cellClick: (e: any, cell: any) => {
            const target = e.target;
            const button = target.closest('button');
            
            if (button) {
              const action = button.getAttribute('data-action');
              const data = cell.getRow().getData();
              
              switch (action) {
                case 'edit':
                  this.openModal(data);
                  break;
                case 'delete':
                  this.confirmDeleteSingle(data);
                  break;
                case 'approve':
                  this.approveSingle(data);
                  break;
                case 'cancel':
                  this.cancelSingle(data);
                  break;
              }
            }
          }
        },
        {
          title: 'STT',
          field: 'RowNum',
          width: 60,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function(cell) {
            const row = cell.getRow();
            const table = cell.getTable();
            const page = table.getPage() as number;
            const pageSize = table.getPageSize() as number;
            const rowPosition = row.getPosition() as number;
            
            // Tính STT liên tục qua các trang
            return (page - 1) * pageSize + rowPosition;
          },
        },
        {
          title: 'Ngày đăng ký',
          field: 'RegistedDate',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function (cell) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Ngày nhận/hủy',
          field: 'DateApproved',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: function (cell) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
        },
        {
          title: 'Người đăng ký',
          field: 'EmployeeRegister',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Người nhận',
          field: 'EmployeeRecive',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Bộ phận',
          field: 'DepartmentName',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại hồ sơ',
          field: 'DocumentType',
          width: 150,
          headerHozAlign: 'center',
        },
        {
          title: 'Loại văn bản',
          field: 'ContractType',
          width: 70,
          headerHozAlign: 'center',
        },
        {
          title: 'Tên văn bản',
          field: 'DocumentName',
          width: 300,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Số lượng bản',
          field: 'DocumentQuantity',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Tên công ty',
          field: 'TaxCompany',
          width: 100,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Đường dẫn',
          field: 'FolderPath',
          width: 250,
          headerHozAlign: 'center',
          hozAlign: 'left',
          formatter: this.textWithTooltipFormatter,
          // formatter: function (cell) {
          //   const value = cell.getValue();
          //   if (value) {
          //     return `<a href="${value}" target="_blank" style="color: #1890ff; text-decoration: underline;">Xem file</a>`;
          //   }
          //   return '';
          // },
        },
        {
          title: 'Lý do hủy',
          field: 'ReasonCancel',
          width: 250,
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
      ],
    });

    this.tb_registerContract.on('pageLoaded', () => {
      this.tb_registerContract.redraw();
    });

    // Thêm sự kiện double-click để mở modal
    this.tb_registerContract.on('rowDblClick', (e: any, row: any) => {
      this.openModal(row.getData());
    });

    // Thêm sự kiện row selection để cập nhật quyền
    this.tb_registerContract.on('rowSelectionChanged', (data: any, rows: any) => {
      this.onRowSelectionChanged(rows);
    });
  }
  //#endregion

  //#region Load dữ liệu đăng ký hợp đồng
  getRegisterContracts() {
    this.isLoadTable = true;

    let params = {
      empID: this.employeeId ?? 0,
      departmentID: this.departmentId ?? 0,
      status: this.statusId ?? -1,
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      keyword: this.keyword?.trim() ?? '',
    };

    this.registerContractService.getAllRegisterContracts(params).subscribe({
      next: (response: any) => {
        console.log('Dữ liệu nhận được:', response.data?.length || 0, 'bản ghi');
        this.tb_registerContract.setData(response.data || []);
        this.isLoadTable = false;
      },
      error: (error) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  //#endregion

  //#region Xuất excel
  exportExcel() {
    let date = DateTime.local().toFormat('ddMMyy');
    this.tb_registerContract.download('xlsx', `DangKyHopDong_${date}.xlsx`, {
      sheetName: 'Đăng ký hợp đồng',
    });
  }
  //#endregion

  //#region Xử lý trạng thái
  filterByStatus() {
    if (this.tb_registerContract) {
      if (this.statusId != -1) {
        this.tb_registerContract.setFilter([
          {
            field: 'Status',
            type: '=',
            value: this.statusId,
          },
        ]);
      } else {
        this.tb_registerContract.clearFilter();
      }
    }
  }
  //#endregion

  //#region Xử lý quyền theo RTCWeb pattern
  onRowSelectionChanged(rows: any[]): void {
    if (rows.length === 0) {
      // Không có row nào được chọn
      this.selectedRow = null;
      this.canEdit = false;
      this.canDelete = false;
      this.canApprove = false;
      this.canCancel = false;
    } else if (rows.length === 1) {
      // Có 1 row được chọn
      this.selectedRow = rows[0].getData();
      this.updateButtonPermissions();
    } else {
      // Nhiều hơn 1 row được chọn
      this.selectedRow = null;
      this.canEdit = false;
      this.canDelete = false;
      this.canApprove = false;
      this.canCancel = false;
    }
  }

  updateButtonPermissions(): void {
    if (!this.selectedRow) {
      this.canEdit = false;
      this.canDelete = false;
      this.canApprove = false;
      this.canCancel = false;
      return;
    }

    const status = this.selectedRow.Status || 0;
    const employeeId = this.selectedRow.EmployeeID || 0;
    const employeeReciveId = this.selectedRow.EmployeeReciveID || 0;

    // Logic theo RTCWeb:
    // Nút Sửa, Xóa: Status = 0 VÀ empID == EmployeeId (người đăng ký)
    if (status === 0 && this.currentUserEmployeeId === employeeId) {
      this.canEdit = true;
      this.canDelete = true;
      this.canApprove = false;
      this.canCancel = false;
    }
    // Nút Xác nhận, Hủy: empID == EmployeeReciveId (người nhận) HOẶC Admin
    else if (this.currentUserEmployeeId === employeeReciveId || this.isAdmin) {
      this.canEdit = false;
      this.canDelete = false;
      this.canApprove = status === 0; // Chỉ cho phép xác nhận nếu Status = 0
      this.canCancel = status === 0;  // Chỉ cho phép hủy nếu Status = 0
    }
    // Không có quyền gì
    else {
      this.canEdit = false;
      this.canDelete = false;
      this.canApprove = false;
      this.canCancel = false;
    }

    console.log('Permissions:', {
      canEdit: this.canEdit,
      canDelete: this.canDelete,
      canApprove: this.canApprove,
      canCancel: this.canCancel,
      status: status,
      currentUserId: this.currentUserEmployeeId,
      employeeId: employeeId,
      employeeReciveId: employeeReciveId,
      isAdmin: this.isAdmin
    });
  }
  //#endregion

  //#region Xử lý Modal
  openModal(data?: any): void {
    const modalRef = this.modal.open(RegistercontractdetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: true,
    });

    // Truyền dữ liệu vào modal
    // Nếu có data và có ID, chỉ truyền object có ID để modal tự load data mới nhất
    if (data && data.ID) {
      modalRef.componentInstance.dataInput = { ID: data.ID };
    } else {
      modalRef.componentInstance.dataInput = null;
    }

    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        if (result) {
          // Reload data nếu cần
          this.getRegisterContracts();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  editSelected(): void {
    const selectedRows = this.tb_registerContract.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dòng cần sửa');
      return;
    }
    
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ được chọn 1 dòng để sửa');
      return;
    }
    
    const selectedData = selectedRows[0].getData();
    this.openModal(selectedData);
  }

  deleteSelected(): void {
    const selectedRows = this.tb_registerContract.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dòng cần xóa');
      return;
    }

    if (selectedRows.length === 1) {
      // Xóa 1 dòng
      this.confirmDeleteSingle(selectedRows[0].getData());
    } else {
      // Xóa nhiều dòng
      this.confirmDelete(selectedRows);
    }
  }

  confirmDelete(selectedRows: any[]): void {
    const count = selectedRows.length;
    const message = `Bạn có chắc chắn muốn xóa ${count} bản ghi đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // Xóa từng bản ghi bằng cách set IsDeleted = true
        let deleteCount = 0;
        let errorCount = 0;

        selectedRows.forEach(row => {
          const data = row.getData();
          const deleteData = {
            ID: data.ID,
            IsDeleted: true
          };

          this.registerContractService.saveData(deleteData).subscribe({
            next: (response) => {
              deleteCount++;
              if (deleteCount + errorCount === count) {
                if (errorCount === 0) {
                  this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
                } else {
                  this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xóa ${deleteCount}/${count} bản ghi`);
                }
                this.getRegisterContracts();
              }
            },
            error: (error) => {
              errorCount++;
              const msg = error.error?.message || error.message || 'Lỗi không xác định';
              this.notification.error(NOTIFICATION_TITLE.error, msg);
              
              if (deleteCount + errorCount === count) {
                if (deleteCount > 0) {
                  this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xóa ${deleteCount}/${count} bản ghi`);
                }
                this.getRegisterContracts();
              }
            }
          });
        });
      }
    });
  }

  // Xác nhận từ nút trong dòng
  approveSingle(data: any): void {
    this.nzModal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có chắc muốn xác nhận Đăng ký hợp đồng không?',
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const approveData = {
          ID: data.ID,
          Status: 1, // Hoàn thành
          ReasonCancel: ''
        };

         this.registerContractService.approveOrCancel(approveData).subscribe({
           next: (response) => {
             this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận thành công');
             
             // Gửi email thông báo cho người đăng ký
             this.registerContractService.sendEmailApproval({
               RegisterContractID: data.ID,
               Status: 1,
               ReasonCancel: ''
             }).subscribe({
               next: () => console.log('Email gửi thành công'),
               error: (err) => console.error('Lỗi gửi email:', err)
             });
             
             this.getRegisterContracts();
           },
           error: (error) => {
             const msg = error.error?.message || error.message || 'Lỗi không xác định';
             this.notification.error(NOTIFICATION_TITLE.error, msg);
           }
         });
       }
     });
  }

  // Hủy từ nút trong dòng
  cancelSingle(data: any): void {
    this.cancelReason = ''; // Reset lý do hủy
    
    this.nzModal.confirm({
      nzTitle: 'Hủy đăng ký hợp đồng',
      nzContent: this.cancelReasonTemplate,
      nzOkText: 'Hủy phiếu',
      nzCancelText: 'Đóng',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!this.cancelReason || this.cancelReason.trim() === '') {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do hủy!');
          return false;
        }

        const cancelData = {
          ID: data.ID,
          Status: 2, // Hủy
          ReasonCancel: this.cancelReason.trim()
        };

         this.registerContractService.approveOrCancel(cancelData).subscribe({
           next: (response) => {
             this.notification.success(NOTIFICATION_TITLE.success, 'Hủy thành công');
             
             // Gửi email thông báo cho người đăng ký (kèm lý do hủy)
             this.registerContractService.sendEmailApproval({
               RegisterContractID: data.ID,
               Status: 2,
               ReasonCancel: this.cancelReason.trim()
             }).subscribe({
               next: () => console.log('Email gửi thành công'),
               error: (err) => console.error('Lỗi gửi email:', err)
             });
             
             this.getRegisterContracts();
           },
           error: (error) => {
             const msg = error.error?.message || error.message || 'Lỗi không xác định';
             this.notification.error(NOTIFICATION_TITLE.error, msg);
           }
         });
         
         return true;
       }
     });
  }

  // Xóa từ nút trong dòng
  confirmDeleteSingle(data: any): void {
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa Đăng ký hợp đồng này không?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const deleteData = {
          ID: data.ID,
          IsDeleted: true
        };

        this.registerContractService.saveData(deleteData).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
            this.getRegisterContracts();
          },
          error: (error) => {
            const msg = error.error?.message || error.message || 'Lỗi không xác định';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          }
        });
      }
    });
  }

  // Giữ lại cho toolbar (nếu cần)
  approveSelected(): void {
    const selectedRows = this.tb_registerContract.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dòng cần xác nhận');
      return;
    }
    
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ được chọn 1 dòng để xác nhận');
      return;
    }
    
    const selectedData = selectedRows[0].getData();
    
    // Kiểm tra quyền
    if (!this.canApprove) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền xác nhận phiếu này');
      return;
    }

    this.approveSingle(selectedData);
  }

  cancelSelected(): void {
    const selectedRows = this.tb_registerContract.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dòng cần hủy');
      return;
    }
    
    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ được chọn 1 dòng để hủy');
      return;
    }
    
    const selectedData = selectedRows[0].getData();
    
    // Kiểm tra quyền
    if (!this.canCancel) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền hủy phiếu này');
      return;
    }

    this.cancelSingle(selectedData);
  }
  //#endregion
}
