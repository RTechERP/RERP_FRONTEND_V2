import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, firstValueFrom } from 'rxjs';
import { Menubar } from 'primeng/menubar';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { MechanicalDrawingService } from './mechanical-drawing.service';
import { MechanicalDrawingDetailComponent } from './mechanical-drawing-detail/mechanical-drawing-detail.component';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-mechanical-drawing',
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzModalModule,
    NzMessageModule,
    NzSplitterModule,
    Menubar,
    PaginatorModule,
    ProgressSpinnerModule,
    TooltipModule,
    ButtonModule,
  ],
  templateUrl: './mechanical-drawing.component.html',
  styleUrl: './mechanical-drawing.component.css',
})
export class MechanicalDrawingComponent implements OnInit, OnDestroy {
  dataset: any[] = [];

  menuBars: any[] = [];
  private readonly actionPermissionCodes = 'N114';

  keyword: string = '';
  projectId: number | null = null;
  projects: any[] = [];

  selectedId: number = 0;
  selectedRow: any = null;

  totalRecords: number = 0;
  page: number = 1;
  pageSize: number = 20;

  isLoading = false;
  isDeleting = false;

  // raw blob URL cache (id -> blob:http://...)
  private blobUrlCache = new Map<number, string>();
  // trusted SafeResourceUrl cache (id -> SafeResourceUrl)
  private previewUrlCache = new Map<number, SafeResourceUrl>();
  private blobLoadingIds = new Set<number>();

  // thumbnail blob URL cache - cần fetch có Bearer token vì endpoint [Authorize]
  private thumbnailBlobCache = new Map<number, string>();
  private thumbnailLoadingIds = new Set<number>();

  // Loading state riêng cho từng card khi mở tab mới / tải file
  openingTabIds = new Set<number>();
  downloadingIds = new Set<number>();

  constructor(
    private mechanicalDrawingService: MechanicalDrawingService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private sanitizer: DomSanitizer,
    public permissionService: PermissionService,
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.loadProjects();
    this.search();
  }

  ngAfterViewInit(): void {
    // Cards được load ngay khi dataset thay đổi, không cần IntersectionObserver
  }

  ngOnDestroy(): void {
    // Giải phóng blob URLs để tránh memory leak
    this.blobUrlCache.forEach(url => URL.revokeObjectURL(url));
    this.blobUrlCache.clear();
    this.previewUrlCache.clear();
    this.thumbnailBlobCache.forEach(url => URL.revokeObjectURL(url));
    this.thumbnailBlobCache.clear();
  }

  /**
   * Xóa toàn bộ cache preview và thumbnail. Dùng khi dataset thay đổi hoàn toàn.
   */
  private clearAllPreviewCache(): void {
    this.blobUrlCache.forEach(url => URL.revokeObjectURL(url));
    this.blobUrlCache.clear();
    this.previewUrlCache.clear();
    this.blobLoadingIds.clear();
    this.thumbnailBlobCache.forEach(url => URL.revokeObjectURL(url));
    this.thumbnailBlobCache.clear();
    this.thumbnailLoadingIds.clear();
  }

  trackById(_index: number, item: any): any {
    return item?.ID ?? item?.id ?? item;
  }

  loadProjects(): void {
    this.mechanicalDrawingService.getProjects().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.projects = response.data || [];
        }
      },
      error: (error: any) => console.error('Error loading projects:', error),
    });
  }

  search(): void {
    this.page = 1;
    this.loadData();
  }

  loadData(resetPreviewCache: boolean = true): void {
    this.isLoading = true;
    if (resetPreviewCache) {
      // Đổi trang / đổi pageSize / search → dataset hoàn toàn khác → clear toàn bộ cache
      this.clearAllPreviewCache();
    }
    this.mechanicalDrawingService.getMechanicalDrawings(
      this.page,
      this.pageSize,
      this.projectId || undefined,
      this.keyword || undefined
    ).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataset = (response.data.data || []).map((item: any, index: number) => ({
            ...item,
            STT: (this.page - 1) * this.pageSize + index + 1,
          }));
          this.totalRecords = response.data.total || 0;
          this.selectedId = 0;
          this.selectedRow = null;
          // Auto fetch thumbnail blob cho các card có ThumbnailPath
          this.dataset.forEach(item => {
            if (item.ThumbnailPath && item.ID) {
              this.loadThumbnailBlob(item.ID);
            }
          });
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', error.message || error.error.message || 'Không thể tải dữ liệu');
      },
    });
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.canManageActions(),
        command: () => this.onAdd(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.canManageActions(),
        command: () => this.onEdit(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.canManageActions(),
        command: () => this.onDelete(),
      },
    ];
  }

  onCardClick(row: any): void {
    if (!row || !row.ID) return;
    this.selectedId = row.ID;
    this.selectedRow = row;
  }

  /**
   * Bấm nút preview trên card: load iframe preview ngay lập tức, đè lên thumbnail.
   */
  onCardPreview(event: Event, item: any): void {
    event.stopPropagation();
    if (!item || !item.ID || !item.FilePath) return;
    if (!this.isHtmlFile(item.FilePath)) return;
    
    // Force load preview blob ngay cả khi đã có thumbnail
    this.loadPreviewBlob(item.ID);
  }

  /**
   * Mở file HTML ra tab mới để xem toàn màn hình.
   * Không set previewUrlCache để tránh side effect hiển thị iframe trong card.
   */
  openInNewTab(event: Event, item: any): void {
    event.stopPropagation();
    if (!item || !item.ID || !item.FilePath) return;
    if (!this.isHtmlFile(item.FilePath)) {
      this.notification.warning('Cảnh báo', 'Chỉ hỗ trợ mở file HTML');
      return;
    }
    if (this.openingTabIds.has(item.ID)) return;

    // Nếu đã có blob URL trong cache, dùng luôn
    const cachedUrl = this.blobUrlCache.get(item.ID);
    if (cachedUrl) {
      window.open(cachedUrl, '_blank');
      return;
    }

    // Mở tab placeholder trước để tránh popup blocker
    const newTab = window.open('about:blank', '_blank');
    if (!newTab) {
      this.notification.error('Lỗi', 'Popup bị chặn. Vui lòng cho phép popup trên trình duyệt.');
      return;
    }

    this.openingTabIds.add(item.ID);

    // Fetch blob và cập nhật tab đã mở
    this.mechanicalDrawingService.previewFile(item.ID).pipe(
      finalize(() => this.openingTabIds.delete(item.ID))
    ).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.blobUrlCache.set(item.ID, url);
        // KHÔNG set previewUrlCache ở đây để tránh hiển thị iframe trong card
        newTab.location.href = url;
      },
      error: () => {
        newTab.close();
        this.notification.error('Lỗi', 'Không thể mở file');
      }
    });
  }

  isOpeningTab(id: number): boolean {
    return this.openingTabIds.has(id);
  }

  isDownloading(id: number): boolean {
    return this.downloadingIds.has(id);
  }

  isHtmlFile(filePath: string): boolean {
    if (!filePath) return false;
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'html' || ext === 'htm';
  }

  getFileExtension(filePath: string): string {
    if (!filePath) return '';
    const ext = filePath.split('.').pop()?.toUpperCase();
    return ext || '';
  }

  getSafeUrl(id: number): SafeResourceUrl {
    const cached = this.previewUrlCache.get(id);
    return cached ?? this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
  }

  getThumbnailBlobUrl(id: number): string {
    return this.thumbnailBlobCache.get(id) ?? '';
  }

  private loadThumbnailBlob(id: number): void {
    if (this.thumbnailLoadingIds.has(id) || this.thumbnailBlobCache.has(id)) return;
    this.thumbnailLoadingIds.add(id);

    this.mechanicalDrawingService.fetchThumbnail(id).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          this.thumbnailBlobCache.set(id, url);
        }
        this.thumbnailLoadingIds.delete(id);
      },
      error: () => {
        // 204 No Content hoặc 401 -> không có thumbnail, xóa ThumbnailPath để card fallback sang placeholder
        this.thumbnailLoadingIds.delete(id);
        const item = this.dataset.find(d => d.ID === id);
        if (item) {
          item.ThumbnailPath = null;
        }
      }
    });
  }

  /**
   * Load preview iframe khi cần (lazy load). Được gọi khi:
   * - User click vào card (onCardClick)
   * - Thumbnail lỗi và cần fallback (onThumbnailError)
   */
  onThumbnailError(event: Event, item: any): void {
    // Khi thumbnail load lỗi (204 hoặc file không tồn tại), xóa ThumbnailPath
    // để template không còn cố render <img>, sau đó tự động fallback sang iframe
    item.ThumbnailPath = null;
  }

  private loadPreviewBlob(id: number): void {
    if (this.blobLoadingIds.has(id) || this.previewUrlCache.has(id)) return;

    // Đã có blob (vd: từ openInNewTab) nhưng chưa set trusted URL cho card → dùng lại blob, khỏi fetch lại
    const existingBlobUrl = this.blobUrlCache.get(id);
    if (existingBlobUrl) {
      this.previewUrlCache.set(id, this.sanitizer.bypassSecurityTrustResourceUrl(existingBlobUrl));
      return;
    }

    this.blobLoadingIds.add(id);

    this.mechanicalDrawingService.previewFile(id).subscribe({
      next: async (blob) => {
        try {
          const cloned = blob.slice(0, 1024);
          const text = await cloned.text();
          const trimmed = text.trim().toLowerCase();
          const isHtml = trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
          if (isHtml) {
            const url = URL.createObjectURL(blob);
            this.blobUrlCache.set(id, url);
            this.previewUrlCache.set(id, this.sanitizer.bypassSecurityTrustResourceUrl(url));
          } else {
            console.warn(`File ${id} không phải HTML, bỏ qua preview.`);
          }
        } catch {
          console.warn(`Không đọc được content file ${id}.`);
        }
        this.blobLoadingIds.delete(id);
      },
      error: (err) => {
        console.error(`Preview file ${id} failed:`, err);
        this.blobLoadingIds.delete(id);
      },
    });
  }

  isPreviewLoaded(id: number): boolean {
    return this.previewUrlCache.has(id);
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onAdd(): void {
    if (!this.canManageActions()) return;

    const modalRef = this.modalService.open(MechanicalDrawingDetailComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result: any) => {
        if (result) {
          // Enrich data với ProjectName từ projects array
          const project = this.projects.find(p => p.ID === result.ProjectID);
          const projectName = project ? (project.ProjectName || project.Name) : '';
          
          // Insert record mới vào đầu danh sách
          const newRecord = { 
            ...result, 
            STT: 1,
            ProjectName: projectName,
            ProjectCode: project?.ProjectCode || ''
          };
          this.dataset = [newRecord, ...this.dataset];
          // Re-index STT
          this.dataset = this.dataset.map((item, index) => ({
            ...item,
            STT: (this.page - 1) * this.pageSize + index + 1,
          }));
          this.totalRecords = (this.totalRecords || 0) + 1;
          
          // Load thumbnail blob nếu có ThumbnailPath
          if (newRecord.ThumbnailPath && newRecord.ID) {
            this.loadThumbnailBlob(newRecord.ID);
          }
          
          // Load preview blob cho bản ghi mới (nếu là HTML và chưa có thumbnail)
          if (newRecord.FilePath && this.isHtmlFile(newRecord.FilePath) && !newRecord.ThumbnailPath) {
            this.loadPreviewBlob(newRecord.ID);
          }
        } else {
          this.loadData();
        }
      },
      () => { }
    );
  }

  onEdit(): void {
    if (!this.canManageActions()) return;

    if (!this.selectedId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để sửa');
      return;
    }

    const modalRef = this.modalService.open(MechanicalDrawingDetailComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.id = this.selectedId;
    modalRef.componentInstance.isEditMode = true;

    modalRef.result.then(
      (result: any) => {
        if (result) {
          // Enrich ProjectName nếu backend không trả về
          const project = this.projects.find(p => p.ID === result.ProjectID);
          const projectName = project ? (project.ProjectName || project.Name) : (result.ProjectName || '');
          const enriched = { ...result, ProjectName: projectName, ProjectCode: project?.ProjectCode || result.ProjectCode || '' };

          // Update record trong dataset, giữ nguyên cache preview
          this.dataset = this.dataset.map(item =>
            item.ID === this.selectedId ? { ...item, ...enriched } : item
          );
          // Nếu thumbnail thay đổi (mới thêm hoặc update), xóa cache cũ và fetch lại
          if (result.ThumbnailPath) {
            const oldUrl = this.thumbnailBlobCache.get(this.selectedId);
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            this.thumbnailBlobCache.delete(this.selectedId);
            this.thumbnailLoadingIds.delete(this.selectedId);
            this.loadThumbnailBlob(this.selectedId);
          }
        } else {
          this.loadData();
        }
      },
      () => { }
    );
  }

  downloadFile(event: Event, row: any): void {
    event.stopPropagation();
    if (!row || !row.FilePath || !row.ID) return;
    if (this.downloadingIds.has(row.ID)) return;

    this.downloadingIds.add(row.ID);
    this.mechanicalDrawingService.downloadFileByPath(row.FilePath).pipe(
      finalize(() => this.downloadingIds.delete(row.ID))
    ).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const fileName = row.FilePath.split('\\').pop()?.split('/').pop() || 'file';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải file!');
      }
    });
  }

  onDelete(): void {
    if (!this.canManageActions()) return;
    if (this.isDeleting) {
      this.notification.info('Thông báo', 'Đang xóa dữ liệu, vui lòng chờ');
      return;
    }

    if (!this.selectedId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một dòng để xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa bản vẽ đã chọn?',
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        this.isDeleting = true;
        const messageId = this.message.loading('Đang xóa, vui lòng chờ...', { nzDuration: 0 }).messageId;

        try {
          const response: any = await firstValueFrom(this.mechanicalDrawingService.deleteMechanicalDrawing(this.selectedId));
          
          if (response.status === 1) {
            this.notification.success('Thành công', 'Xóa thành công');

            // Xóa cache blob để tránh memory leak
            const blobUrl = this.blobUrlCache.get(this.selectedId);
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
              this.blobUrlCache.delete(this.selectedId);
              this.previewUrlCache.delete(this.selectedId);
            }
            const thumbUrl = this.thumbnailBlobCache.get(this.selectedId);
            if (thumbUrl) {
              URL.revokeObjectURL(thumbUrl);
              this.thumbnailBlobCache.delete(this.selectedId);
            }

            // Loại bỏ khỏi dataset, KHÔNG gọi loadData() để giữ preview các bản ghi khác
            this.dataset = this.dataset
              .filter(item => item.ID !== this.selectedId)
              .map((item, index) => ({
                ...item,
                STT: (this.page - 1) * this.pageSize + index + 1,
              }));
            this.totalRecords = Math.max(0, (this.totalRecords || 0) - 1);

            this.selectedId = 0;
            this.selectedRow = null;
          } else {
            this.notification.error('Lỗi', 'Không thể xóa bản ghi');
          }
        } catch {
          this.notification.error('Lỗi', 'Không thể xóa dữ liệu');
        } finally {
          this.isDeleting = false;
          this.message.remove(messageId);
        }
      }
    });
  }

  canManageActions(): boolean {
    return this.permissionService.hasPermission(this.actionPermissionCodes);
  }

  handlePageChange(event: any): void {
    if (event.first !== undefined) {
      this.page = Math.floor(event.first / this.pageSize) + 1;
    } else if (event.page !== undefined) {
      this.page = event.page + 1;
    }
    this.loadData();
  }
}
