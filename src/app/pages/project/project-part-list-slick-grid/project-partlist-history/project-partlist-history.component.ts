import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartListService } from '../../project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';

@Component({
  selector: 'app-project-partlist-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule
  ],
  templateUrl: './project-partlist-history.component.html',
  styleUrl: './project-partlist-history.component.css'
})
export class ProjectPartListHistoryModalComponent implements OnInit {
  private partListService = inject(ProjectPartListService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() projectId!: number;
  @Input() projectCode!: string;
  @Input() versionId?: number;

  logs: any[] = [];
  filteredLogs: any[] = [];
  isLoadingLogs: boolean = false;

  searchTerm: string = '';
  selectedCategory: string = 'ALL';

  // Phân trang phía Client để tránh lag DOM
  hasMoreLogs: boolean = false;
  remainingLogsCount: number = 0;
  displayLimit: number = 50;
  isLoadingMore: boolean = false;

  categories: any[] = [
    { value: 'ALL', label: 'Tất cả hoạt động' },
    { value: 'SOLUTION', label: 'Giải pháp' },
    { value: 'VERSION', label: 'Phiên bản' },
    { value: 'PARTLIST', label: 'Vật tư partlist' }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    if (!this.projectId && !this.versionId) return;

    this.isLoadingLogs = true;
    this.displayLimit = 50; // Reset số lượng hiển thị khi load lại
    this.partListService.getLogHistoryPartlist(this.projectId, this.versionId).subscribe({
      next: (res: any) => {
        const rawLogs = res?.Data || res?.data || [];
        // Tính toán trước Icon và Class Color để tránh gọi hàm liên tục trên HTML
        this.logs = rawLogs.map((log: any) => {
          const actionType = log.ActionType || '';
          return {
            ...log,
            ContentLog: log.ContentLog?.replace(/\\n/g, '\n'),
            iconName: this.getLogIcon(actionType),
            colorClass: this.getLogIconColorClass(actionType)
          };
        });
        this.applyFilter();
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching project partlist history logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  onFilterChange(): void {
    this.displayLimit = 50; // Reset phân trang khi đổi bộ lọc
    this.applyFilter();
  }

  applyFilter(): void {
    let tempLogs = [...this.logs];

    // Filter by Category
    if (this.selectedCategory !== 'ALL') {
      tempLogs = tempLogs.filter(log => {
        const type = (log.ActionType || '').toUpperCase();
        if (this.selectedCategory === 'SOLUTION') {
          return type.includes('GIẢP PHÁP') || type.includes('GIẢI PHÁP');
        }
        if (this.selectedCategory === 'REQUEST') {
          return type.includes('YÊU CẦU') || type.includes('YC');
        }
        if (this.selectedCategory === 'VERSION') {
          return type.includes('PHIÊN BẢN');
        }
        if (this.selectedCategory === 'PARTLIST') {
          return !type.includes('GIẢI PHÁP') && !type.includes('GIẢP PHÁP') && !type.includes('YÊU CẦU') && !type.includes('YC') && !type.includes('PHIÊN BẢN');
        }
        return true;
      });
    }

    // Filter by search keyword
    if (this.searchTerm.trim()) {
      const keyword = this.searchTerm.toLowerCase().trim();
      tempLogs = tempLogs.filter(log =>
        (log.ActionType?.toLowerCase() || '').includes(keyword) ||
        (log.ContentLog?.toLowerCase() || '').includes(keyword) ||
        (log.CreatedBy?.toLowerCase() || '').includes(keyword)
      );
    }

    // Tính toán phân trang
    this.hasMoreLogs = tempLogs.length > this.displayLimit;
    this.remainingLogsCount = tempLogs.length - this.displayLimit;
    this.filteredLogs = tempLogs.slice(0, this.displayLimit);
  }

  loadMore(): void {
    this.isLoadingMore = true;
    setTimeout(() => {
      this.displayLimit += 100; // Tải thêm 100 dòng tiếp theo
      this.applyFilter();
      
      // Đợi quá trình render hoàn tất mới tắt spinner để tạo cảm giác mượt mà
      setTimeout(() => {
        this.isLoadingMore = false;
      }, 150);
    }, 200);
  }

  getLogIcon(actionType: string): string {
    if (!actionType) return 'fa fa-info-circle';
    const type = actionType.toUpperCase();
    if (type.includes('GIẢI PHÁP')) {
      if (type.includes('DUYỆT')) return 'fa fa-check-circle';
      if (type.includes('XÓA') || type.includes('XOÁ')) return 'fa fa-trash-o';
      return 'fa fa-lightbulb-o';
    }
    if (type.includes('YÊU CẦU') || type.includes('YC')) {
      if (type.includes('HỦY') || type.includes('HUY')) return 'fa fa-times-circle';
      return 'fa fa-file-text-o';
    }
    if (type.includes('PHIÊN BẢN')) {
      if (type.includes('XÓA') || type.includes('XOÁ')) return 'fa fa-trash-o';
      return 'fa fa-tags';
    }
    if (type.includes('TẠO MỚI') || type.includes('THÊM MỚI')) return 'fa fa-plus-circle';
    if (type.includes('XÓA') || type.includes('XOÁ') || type.includes('DELETE')) return 'fa fa-trash-o';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT') || type.includes('UPDATE')) return 'fa fa-pencil-square-o';
    if (type.includes('DUYỆT') || type.includes('XÁC NHẬN')) return 'fa fa-check-circle';
    if (type.includes('HỦY') || type.includes('CANCEL')) return 'fa fa-times-circle';
    if (type.includes('XUẤT KHO')) return 'fa fa-share-square-o';
    if (type.includes('CHUYỂN KHO') || type.includes('TỒN KHO')) return 'fa fa-exchange';
    return 'fa fa-info-circle';
  }

  getLogIconColorClass(actionType: string): string {
    if (!actionType) return 'color-info';
    const type = actionType.toUpperCase();

    // Prioritize actions
    if (type.includes('THÊM MỚI') || type.includes('TẠO MỚI')) return 'color-add';
    if (type.includes('XÓA') || type.includes('XOÁ') || type.includes('DELETE')) return 'color-delete';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT') || type.includes('UPDATE')) return 'color-version';
    if (type.includes('DUYỆT') || type.includes('XÁC NHẬN')) return 'color-approve';

    // Fallback to category types
    if (type.includes('GIẢI PHÁP')) return 'color-solution';
    if (type.includes('YÊU CẦU') || type.includes('YC')) return 'color-request';
    if (type.includes('PHIÊN BẢN')) return 'color-version';

    return 'color-default';
  }

  handleReload(): void {
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}
