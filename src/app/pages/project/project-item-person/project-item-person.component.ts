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
import { NzFormModule } from 'ng-zorro-antd/form';
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
import { RegisterContractService } from '../../person/register-contract/register-contract-service/register-contract.service';
import { AuthService } from '../../../auth/auth.service';
import { RegistercontractdetailComponent } from '../../person/register-contract/register-contract-detail/register-contract-detail.component';
import { ProjectItemPersonService } from './project-item-person-service/project-item-person.service';
import { ProjectService } from '../project-service/project.service';
import { ProjectItemPersonDetailComponent } from './project-item-person-detail/project-item-person-detail.component';
import { ProjectItemProblemComponent } from '../../project/work-item/work-item-form/project-item-problem/project-item-problem.component';
import { sum } from 'ng-zorro-antd/core/util';
import { AppUserService } from '../../../services/app-user.service';
@Component({
  //selector: 'app-r',
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
    NzFormModule,
    NzTableModule,
    NzSpinModule,
    NzModalModule,
  ],
  templateUrl: './project-item-person.component.html',
  styleUrl: './project-item-person.component.css'
})
export class ProjectItemPersonComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    private projectItemPersonService: ProjectItemPersonService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private authService: AuthService,
    private modal: NgbModal,
    private nzModal: NzModalService,
    private appUserService: AppUserService
  ) { }

  @ViewChild('tb_projectItemPerson', { static: false })
  tb_projectItemPersonContainer!: ElementRef;

  @ViewChild('cancelReasonTemplate', { static: false })
  cancelReasonTemplate!: TemplateRef<any>;

  // Search panel state
  showSearchBar: boolean = false; // Mặc định ẩn, sẽ được set trong ngOnInit
  isLoadTable: any = false;
  cancelReason: string = '';

  tb_projectItemPerson: any;

  // Bộ lọc hạng mục công việc cá nhân
  dataStatus: any[] = [
    { id: 0, name: 'Chưa làm' },
    { id: 1, name: 'Đang làm' },
    { id: 2, name: 'Hoàn thành' },
    { id: 3, name: 'Pending' },
  ];
  projects: any[] = [];
  employees: any[] = [];

  statusId: number = -1;
  statusIds: number[] = []; // Cho phép chọn nhiều trạng thái
  projectId: number = 0;
  userId: number = 0;
  keyword: string = '';

  // Giữ lại các biến cũ cho đăng ký hợp đồng (nếu cần)
  departments: any[] = [];
  dateStart: any = DateTime.local().set({ day: 1 }).toISO();
  dateEnd: any = DateTime.local().plus({ month: 1 }).set({ day: 1 }).toISO();
  departmentId: any = 0;
  employeeId: any = 0;

  // Biên theo dõi selected row và quyền
  selectedRow: any = null;
  currentUserEmployeeId: number = 0;
  isAdmin: boolean = false;
  // Biến điều khiển hiển thị nút
  canEdit: boolean = false;
  canDelete: boolean = false;
  canApprove: boolean = false;
  canCancel: boolean = false;
  canSelect: boolean = false;
  //#endregion

  //#region Chạy khi mở
  ngOnInit(): void {
    // Khởi tạo danh sách trạng thái khớp với work-item
    this.dataStatus = [
      { id: 0, name: 'Chưa làm' },
      { id: 1, name: 'Đang làm' },
      { id: 2, name: 'Hoàn thành' },
      { id: 3, name: 'Pending' },
    ];

    // Tự động chọn trạng thái 0,1 khi trang load
    this.statusIds = [0, 1];

    // Kiểm tra nếu là mobile thì ẩn filter bar, desktop thì hiển thị
    const isMobile = window.innerWidth <= 768;
    this.showSearchBar = !isMobile;
  }

  ngAfterViewInit(): void {
    this.drawTbProjectItemPerson(this.tb_projectItemPersonContainer.nativeElement);
    // Load dữ liệu cho combobox
    this.loadProjects();
    this.loadEmployees();
    // Gọi getCurrentUser trước, sau đó mới load data
    this.getCurrentUser();
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = [
          { ID: 0, ProjectName: 'Tất cả', ProjectCode: '' },
          ...(response.data || [])
        ];
        console.log('Projects loaded:', response.data, 'items');
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.projects = [{ ID: 0, Name: 'Tất cả' }];
      }
    });
  }

  loadEmployees(): void {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = [
          { ID: 0, FullName: 'Tất cả' },
          ...(response.data || [])
        ];
        console.log('Employees loaded:', this.employees.length, 'items');
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        this.employees = [{ ID: 0, FullName: 'Tất cả' }];
      }
    });
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUserEmployeeId = data.ID || 0;
          this.userId = data.ID || 0; // Gán cho bộ lọc mới
          this.departmentId = data.DepartmentID || 0;
          this.isAdmin = data.IsAdmin || false;
          if (data.IsAdmin == true || data.IsLeader > 0) this.canSelect = true;
          console.log('Current EmployeeID:', this.currentUserEmployeeId);

          // Gọi getProjectItemPerson() sau khi đã có userId
          this.getProjectItemPerson();
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin user:', error);
        // Nếu lỗi vẫn load data với giá trị mặc định
        this.getProjectItemPerson();
      }
    });
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const isMobile = window.innerWidth <= 768;
    const wasOpen = this.showSearchBar;

    this.showSearchBar = !this.showSearchBar;

    if (isMobile) {
      if (this.showSearchBar) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
    }

    requestAnimationFrame(() => {
      if (isMobile && this.showSearchBar && !wasOpen) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  getProjectItemPerson(): void {
    this.isLoadTable = true;

    const request = {
      ProjectID: this.projectId ?? 0,
      UserID: this.userId,
      Keyword: this.keyword?.trim() || '',
      Status: this.statusIds.length > 0 ? this.statusIds.join(';') : undefined
    };
    this.projectItemPersonService.getProjectItemPerson(request).subscribe({
      next: (response: any) => {
        const flatData = response.data || [];

        // Convert flat data thành tree structure
        const treeData = this.convertToTreeData(flatData);

        // Kiểm tra tb_projectItemPerson đã được khởi tạo chưa
        if (this.tb_projectItemPerson) {
          this.tb_projectItemPerson.setData(treeData);
        } else {
          console.warn('tb_projectItemPerson chưa được khởi tạo, dữ liệu sẽ được load sau');
        }

        this.isLoadTable = false;

        // Tự động ẩn filter bar trên mobile sau khi tìm kiếm
        const isMobile = window.innerWidth <= 768;
        if (isMobile && this.showSearchBar) {
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          setTimeout(() => {
            this.showSearchBar = false;
          }, 100);
        }
      },
      error: (error) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error);
        this.isLoadTable = false;
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
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
      max-height: calc(1.4em * 5);
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

  // Convert flat data thành tree structure dựa trên ParentID
  convertToTreeData(flatData: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Bước 1: Tạo map với _children
    flatData.forEach((item) => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Bước 2: Xây dựng cây
    flatData.forEach((item) => {
      const node = map.get(item.ID);
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          // Nếu không tìm thấy parent, thêm vào root
          tree.push(node);
        }
      } else {
        // ParentID = 0 hoặc null → node gốc
        tree.push(node);
      }
    });

    return tree;
  }

  //#region Xử lý bảng đăng ký hợp đồng
  drawTbProjectItemPerson(container: HTMLElement) {
    this.tb_projectItemPerson = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      selectableRows: 1,
      pagination: true,
      layout: 'fitDataStretch',
      height: '83vh',
      paginationMode: 'local',
      paginationSize: 50,
      rowHeader: false,
      paginationSizeSelector: [10, 20, 50, 100, 200],
      rowFormatter: (row: any) => {
        const data = row.getData();
        const el = row.getElement();

        // Reset style
        el.style.backgroundColor = '';
        el.style.color = '';

        // Kiểm tra xem có children không (parent node)
        const hasChildren = data._children && data._children.length > 0;

        // Lấy giá trị ItemLate và ItemLateActual
        const itemLate = parseInt(data['ItemLate'] || '0');
        const itemLateActual = parseInt(data['ItemLateActual'] || '0');
        const totalDayExpridSoon = parseInt(data['TotalDayExpridSoon'] || '0');
        const planEndDate = data['PlanEndDate']
          ? DateTime.fromISO(data['PlanEndDate'])
          : null;
        const actualEndDate = data['ActualEndDate']
          ? DateTime.fromISO(data['ActualEndDate'])
          : null;
        const hasActualEndDate = actualEndDate && actualEndDate.isValid;

        // Áp dụng màu theo thứ tự ưu tiên
        // 1. ItemLate = 2 hoặc ItemLateActual = 2: Red + White text (ưu tiên cao nhất)
        if (itemLate === 2 || itemLateActual === 2) {
          el.style.backgroundColor = 'Red';
          el.style.color = 'White';
          return;
        }

        // 2. ItemLate = 1 hoặc ItemLateActual = 1: Orange
        if (itemLate === 1 || itemLateActual === 1) {
          el.style.backgroundColor = 'Orange';
          return;
        }

        // 3. Parent nodes: LightGray (chỉ khi không có ItemLate = 1 hoặc 2)
        if (hasChildren) {
          el.style.backgroundColor = 'LightGray';
          return;
        }

        // 4. Sắp hết hạn: LightYellow
        if (
          planEndDate &&
          planEndDate.isValid &&
          totalDayExpridSoon <= 3 &&
          !hasActualEndDate
        ) {
          el.style.backgroundColor = 'LightYellow';
        }
      },
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'left',
          width: 50,
          frozen: true,
          bottomCalc: 'count'
        },
        {
          title: 'ParentID',
          field: 'ParentID',
          visible: false,
          frozen: true,
        },
        {
          title: 'Tình trạng',
          field: 'IsApprovedText',
          hozAlign: 'center',
          width: 150,
          frozen: true,
        },
        {
          title: 'Mã',
          field: 'Code',
          hozAlign: 'center',
          width: 130,
          frozen: true
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          hozAlign: 'center',
          width: 150,
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          hozAlign: 'center',
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          hozAlign: 'center',
          width: 150,
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeRequest',
          hozAlign: 'center',
          width: 150,
          formatter: 'textarea'
        },
        {
          title: '%',
          field: 'PercentItem',
          hozAlign: 'right',
          editor: 'input',
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value === null || value === undefined || value === '') {
              return '';
            }
            const numValue = Number(value);
            if (isNaN(numValue)) {
              return value;
            }
            return numValue.toFixed(2) + '%';
          },
        },
        {
          title: 'Công việc',
          field: 'Mission',
          hozAlign: 'left',
          formatter: this.textWithTooltipFormatter,
          width: 400,
        },
        {
          title: 'KẾ HOẠCH',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanStartDate',
              hozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            {
              title: 'Số ngày',
              field: 'TotalDayPlan',
              hozAlign: 'center',
              width: 80,
              bottomCalc: 'sum'
            },
            {
              title: 'Ngày kết thúc',
              field: 'PlanEndDate',
              hozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
          ],
        },
        {
          title: 'THỰC TẾ',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualStartDate',
              hozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualEndDate',
              hozAlign: 'center',
              width: 120,
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const dt = DateTime.fromISO(value);
                return dt.isValid ? dt.toFormat('dd/MM/yyyy') : value;
              },
            },
            {
              title: '%',
              field: 'PercentageActual',
              hozAlign: 'right',
              width: 80,
            },
          ],
        },
        {
          title: 'Phát sinh',
          field: 'ReasonLate',
          hozAlign: 'left',
          width: 200,
          formatter: this.textWithTooltipFormatter
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          hozAlign: 'left',
          width: 200,
          formatter: 'textarea'
        },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDateActual',
          hozAlign: 'center',
          width: 150,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const dt = DateTime.fromISO(value);
            return dt.isValid ? dt.toFormat('dd/MM/yyyy HH:mm') : value;
          },
        },
        {
          title: 'Người tạo',
          field: 'CreatedName',
          hozAlign: 'left',
          width: 150
        },
      ],
    });

    this.tb_projectItemPerson.on('pageLoaded', () => {
      this.tb_projectItemPerson.redraw();
    });

    // Thêm sự kiện double-click để mở modal
    this.tb_projectItemPerson.on('rowDblClick', (e: any, row: any) => {
      this.openModal(row.getData());
    });
    // Không gọi getProjectItemPerson() ở đây vì cần đợi getCurrentUser() hoàn thành
  }
  //#endregion

  //#region Xử lý trạng thái
  filterByStatus() {
    if (this.tb_projectItemPerson) {
      if (this.statusId != -1) {
        this.tb_projectItemPerson.setFilter([
          {
            field: 'Status',
            type: '=',
            value: this.statusId,
          },
        ]);
      } else {
        this.tb_projectItemPerson.clearFilter();
      }
    }
  }
  //#endregion

  //#region Xử lý Modal
  openModal(data?: any): void {
    const modalRef = this.modal.open(ProjectItemPersonDetailComponent, {
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
          this.getProjectItemPerson();
        }
      },
      (reason) => {
        // Modal bị đóng mà không có kết quả
      }
    );
  }

  editSelected(): void {
    const selectedRows = this.tb_projectItemPerson.getSelectedRows();

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

  openProblemDetailSelected(): void {
    const selectedRows = this.tb_projectItemPerson.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dòng cần xem phát sinh');
      return;
    }

    if (selectedRows.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ được chọn 1 dòng để xem phát sinh');
      return;
    }

    const selectedData = selectedRows[0].getData();
    this.openProblemDetail(selectedData);
  }

  openProblemDetail(data: any): void {
    // Import và mở modal ProjectItemProblemComponent

    const modalRef = this.modal.open(ProjectItemProblemComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: true,
    });
    if (data.ID > 0) {
      modalRef.componentInstance.projectItemId = data.ID;
    }
    modalRef.result.then(
      (result) => {
        if (result) {
          this.getProjectItemPerson();
        }
      },
      () => { }
    );
    ;
  }
  //#endregion
}
