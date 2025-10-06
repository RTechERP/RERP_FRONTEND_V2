import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCarouselComponent, NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import {
  AppNotifycationDropdownComponent,
  NotifyItem,
} from '../../pages/old/app-notifycation-dropdown/app-notifycation-dropdown.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HomeLayoutService } from './home-layout-service/home-layout.service';
import { CommonModule } from '@angular/common';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AppUserDropdownComponent } from '../../pages/old/app/app-user-dropdown/app-user-dropdown.component';

interface dynamicApps {
  MenuName: string;
  Link?: string;
  ImageName?: string;
}

interface Application {
  name: string;
  route?: string;
  image?: string;
}

interface LeaveItem {
  employee: string;
  leaveDate: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface DepartmentPerformance {
  department: string;
  completionRate: number;
}

interface WorkStatus {
  status: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    RouterLink,
    // RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzTabsModule,
    NzDropDownModule,
    // NzBadgeModule,
    // NzAvatarModule,
    // BrowserModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    NzInputModule,
    NzAvatarModule,
    NzBadgeModule,
    NzModalModule,
    CommonModule,
    NzCardModule,
    FormsModule,
    NzRadioModule,
    NzSpaceModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    NzCarouselModule,
    AppNotifycationDropdownComponent,
    AppUserDropdownComponent,
  ],
  templateUrl: './home-layout.component.html',
  styleUrl: './home-layout.component.css',
})
export class HomeLayoutComponent implements OnInit, AfterViewInit {
  @ViewChild('carousel', { static: false }) carousel!: NzCarouselComponent;

  menuParents: any[] = [];
  private dynamicApps: dynamicApps[] = [];
  private allApps: dynamicApps[] = [];
  keyword: string = '';

  applications: Application[] = [];
  dynamicTabs: any[] = [];

  effect = 'effect';

  // Dữ liệu lịch làm việc tháng
  currentMonth = 'Sept 2025';
  calendarDays: number[] = [];
  currentDay = 13;

  //   logout() {}

  // Dữ liệu danh sách nghỉ
  leaveItems: LeaveItem[] = [
    {
      employee: 'Nguyễn Văn A',
      leaveDate: '05/09',
      reason: 'Họp dự án',
      status: 'approved',
    },
    {
      employee: 'Trần Thị B',
      leaveDate: '07-08/09',
      reason: 'Nghỉ bệnh',
      status: 'pending',
    },
    {
      employee: 'Lê Văn C',
      leaveDate: '10/09',
      reason: 'Từ chối',
      status: 'rejected',
    },
  ];

  // Dữ liệu hiệu suất công việc theo phòng ban
  departmentPerformance: DepartmentPerformance[] = [
    { department: 'Tổng thể', completionRate: 80 },
    { department: 'Kinh doanh', completionRate: 60 },
    { department: 'Kế toán', completionRate: 30 },
    { department: 'Nhân sự', completionRate: 50 },
    { department: 'Công nghệ', completionRate: 20 },
  ];

  // Dữ liệu phân bố trạng thái công việc
  workStatusDistribution: WorkStatus[] = [
    { status: 'Đang', percentage: 25, color: '#87CEEB' },
    { status: 'Hoàn thành', percentage: 85, color: '#4169E1' },
    { status: 'Trễ hạn', percentage: 16, color: '#DC143C' },
  ];

  constructor(
    private notification: NzNotificationService,
    private homepageService: HomeLayoutService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setResponsivePageSize();
    this.getMenuParents();
    this.generateCalendarDays();
  }

  private generateCalendarDays(): void {
    // Tạo dữ liệu lịch cho tháng 9/2025
    // Tháng 9/2025 bắt đầu từ thứ 2 (T2)
    this.calendarDays = [];

    // Thêm các ngày trống cho tuần đầu (nếu cần)
    // Tháng 9/2025 bắt đầu từ thứ 2, nên không cần ngày trống

    // Thêm các ngày trong tháng
    for (let i = 1; i <= 30; i++) {
      this.calendarDays.push(i);
    }
  }

  ngAfterViewInit(): void {}

  newTab(routerLink: string[], title: string): void {
    const { length } = this.dynamicTabs;
    const newTabId = length + 1;
    // const title = `NewTab${newTabId}`;
    this.dynamicTabs = [
      ...this.dynamicTabs,
      {
        title,
        content: title,
        routerLink: routerLink,
        queryParams: {
          tab: newTabId,
        },
      },
    ];
  }

  onPick(n: NotifyItem) {
    console.log('picked:', n);
    // TODO: điều hướng/đánh dấu đã đọc...
  }
  notifItems: NotifyItem[] = [
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },
    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail: 'Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
    {
      id: 3,
      title: 'Đơn cấp phát #CP-778 tạo mới',
      detail: 'Kho TB • 5 mục',
      time: '16:40',
      group: 'yesterday',
      icon: 'plus-square',
    },
    {
      id: 1,
      title: 'Phiếu xe #A123 đã duyệt',
      detail: 'Xe VP Hà Nội',
      time: '09:12',
      group: 'today',
      icon: 'car',
    },

    {
      id: 2,
      title: 'Bàn giao TS BM-09 hoàn tất',
      detail:
        'Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556Phòng IT • BB556',
      time: '08:55',
      group: 'today',
      icon: 'file-done',
    },
  ];

  getMenuParents(): void {
    this.homepageService.getMenuParents().subscribe((response: any) => {
      this.menuParents = response.data || [];
      this.allApps = (this.menuParents || []).map((item: any) => ({
        MenuName: item?.MenuName ?? 'Menu',
        Link: item?.Link ?? undefined,
        ImageName: item?.ImageName ?? undefined,
      }));
      this.dynamicApps = [...this.allApps];
      this.cdr.markForCheck?.();
    });
  }

  // Carousel state
  currentPage = 1;
  pageSize = 22; // Desktop default

  private setResponsivePageSize(): void {
    const isMobile = window.matchMedia('(max-width: 576px)').matches;
    const desired = isMobile ? 12 : 22;
    if (this.pageSize !== desired) {
      this.pageSize = desired;
      this.currentPage = 1;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.setResponsivePageSize();
  }

  private get sourceApplications() {
    return this.dynamicApps.length > 0 ? this.dynamicApps : this.applications;
  }

  private get displayedApps() {
    return this.sourceApplications.map((item: any) => {
      if (item && typeof item === 'object' && 'MenuName' in item) {
        const image = item.ImageName as string | undefined;
        return {
          title: item.MenuName as string,
          link: item.Link as string | undefined,
          color: item.color as string,
          image,
        };
      }
      return {
        title: item.name as string,
        link: item.route as string | undefined,
        color: item.color as string,
        image: item.image as string | undefined,
      };
    });
  }

  searchData(event?: Event): void {
    // Ngăn form submit mặc định nếu có event
    if (event) {
      event.preventDefault();
    }

    const q = (this.keyword || '').toLowerCase().trim();
    if (!q) {
      this.dynamicApps = [...this.allApps];
    } else {
      this.dynamicApps = this.allApps.filter((x) =>
        (x.MenuName || '').toLowerCase().includes(q)
      );
    }
    this.currentPage = 1;
  }

  get chunkedApplications() {
    const chunkSize = this.pageSize; // Sử dụng pageSize responsive (12 cho mobile, 22 cho desktop)
    const apps = this.displayedApps;
    const result = [];
    for (let i = 0; i < apps.length; i += chunkSize) {
      result.push(apps.slice(i, i + chunkSize));
    }
    return result;
  }

  get shouldShowPagination(): boolean {
    // Chỉ hiển thị pagination khi có nhiều hơn 1 slide
    return this.chunkedApplications.length > 1;
  }

  onCarouselChange(index: number): void {
    // Cập nhật currentPage khi carousel thay đổi
    this.currentPage = index + 1;
    this.cdr.markForCheck();
  }

  // Helper methods cho dữ liệu
  getStatusText(status: string): string {
    switch (status) {
      case 'approved':
        return 'Đã duyệt';
      case 'pending':
        return 'Đang chờ duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'rejected':
        return 'text-danger';
      default:
        return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  }

  isCurrentDay(day: number): boolean {
    return day === this.currentDay;
  }

  isWeekend(day: number, index: number): boolean {
    // Tháng 9/2025 bắt đầu từ thứ 2 (T2)
    // T2=0, T3=1, T4=2, T5=3, T7=4, CN=5
    // Cuối tuần là T7 (index 4) và CN (index 5)
    return index % 6 === 4 || index % 6 === 5;
  }

  getWeekDays(): string[] {
    return ['T2', 'T3', 'T4', 'T5', 'T7', 'CN'];
  }
}
