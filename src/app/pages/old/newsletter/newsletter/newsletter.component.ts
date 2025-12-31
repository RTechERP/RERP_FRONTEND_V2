import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { PermissionService } from '../../../../services/permission.service';
import { NewsletterFormComponent } from './newsletter-form/newsletter-form.component';
import { NewsletterDetailComponent } from './newsletter-detail/newsletter-detail.component';
import { NewsletterService } from './newsletter.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PrimeIcons } from 'primeng/api';
(window as any).luxon = { DateTime };

@Component({
  selector: 'newsletter',
    imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
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
    NzMessageModule,
    NgbModalModule,
    NzModalModule,
    HasPermissionDirective,
    NgbDropdownModule,
    NzDropDownModule,
  ],
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.css'
})
export class NewsletterComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private permissionService: PermissionService,
    private modalService: NgbModal,
    private newsletterService: NewsletterService,
    private http: HttpClient
  ) { }

    nightShiftTable: Tabulator | null = null;
  isSearchVisible: boolean = false;

  // Master data
  departments: any[] = [];
  allEmployees: any[] = [];
  employees: any[] = [];
  newsletterTypes: any[] = [];

  // Filter params
  dateStart: Date = new Date();
  dateEnd: Date = new Date();
  keyWord: string = '';
  typeID: number = 0;

  private ngbModal = inject(NgbModal);

  // Debounce subjects
  private keywordSearchSubject = new Subject<string>();
  private filterChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();



    ngOnInit() {
    // Load newsletter types
    this.loadNewsletterTypes();
    
    // Set đầu tháng và cuối tháng làm mặc định
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    
    // Setup debounce
    this.keywordSearchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterChangeSubject.next();
      });

    this.filterChangeSubject
      .pipe(debounceTime(100), takeUntil(this.destroy$)) // Reduced from 300ms to 100ms
      .subscribe(() => {
        this.getNewsletter();
      });
  }
  ngAfterViewInit() {
    this.initTable();
    // Load initial data after table is initialized
    setTimeout(() => {
      this.getNewsletter();
    }, 100);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNewsletterTypes(): void {
    console.log('Loading newsletter types...');
    this.newsletterService.getNewsletterType().subscribe({
      next: (response: any) => {
        console.log('Newsletter types response:', response);
        this.newsletterTypes = response.data || [];
        console.log('Newsletter types loaded:', this.newsletterTypes.length);
      },
      error: (error: any) => {
        console.error('Error loading newsletter types:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải danh sách loại bản tin');
      }
    });
  }

  private initTable(): void {
    const tableElement = document.getElementById('newsletter-table');
    console.log('Table element found:', !!tableElement);
    
    if (!tableElement) {
      console.error('Newsletter table element not found');
      return;
    }

    this.nightShiftTable = new Tabulator(tableElement, {
      ...DEFAULT_TABLE_CONFIG,
      columns: this.getTableColumns(),
      data: [],
      pagination: true,
      paginationSize: 20,
      paginationSizeSelector: [10, 20, 50, 100],
      height: "calc(100vh - 150px)", // Fit to full viewport
      layout: "fitColumns", // Auto-fit columns to table width
      responsiveLayout: "hide", // Hide columns on small screens
      selectableRows: true, // Allow row selection on click
    });
    
    console.log('Newsletter table initialized successfully');
  }

  private getTableColumns(): ColumnDefinition[] {
    return [
      {
        title: 'STT',
        field: 'ID',
        width: 60,
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell: CellComponent) => {
          return String(cell.getRow().getPosition());
        },
      },
      {
        title: 'Mã bản tin',
        field: 'Code',
        width: 170,
        hozAlign: 'center',
        headerHozAlign: 'center',
      },
      {
        title: 'Tiêu đề',
        field: 'Title',
        minWidth: 250,
        // No fixed width, it will grow
        formatter: (cell: CellComponent) => {
          return `<span style="cursor: pointer; color: #1890ff; font-weight: 500;">${cell.getValue()}</span>`;
        },
        cellClick: (e: Event, cell: CellComponent) => {
          e.preventDefault();
          this.openNewsletterDetail(cell.getRow().getData());
        },
      },
      {
        title: 'Loại bản tin',
        field: 'NewsletterTypeName',
        width: 180,
      },
      {
        title: 'Ngày tạo',
        field: 'CreatedDate',
        width: 120,
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell: CellComponent) => {
          const date = cell.getValue();
          return date ? DateTime.fromISO(date).toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        title: 'Người tạo',
        field: 'CreatedBy',
        width: 140,
      },
      {
        title: 'Files',
        field: 'NewsletterFiles',
        width: 80,
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell: CellComponent) => {
          const files = cell.getValue() || [];
          if (files.length === 0) {
            return '<span class="text-muted">-</span>';
          }
          return `<span style="cursor: pointer; color: #1890ff;"><i class="fas fa-paperclip"></i> ${files.length}</span>`;
        },
        cellClick: (e: Event, cell: CellComponent) => {
          e.preventDefault();
          this.showFilesList(cell.getRow().getData());
        },
      },
    ];
  }

  showFilesList(newsletter: any): void {
    const files = newsletter.NewsletterFiles || [];
    if (files.length === 0) {
      this.notification.warning('Thông báo', 'Không có file đính kèm');
      return;
    }

    // Create modal content
    const modalContent = `
      <div class="file-list-modal">
        <h5>Danh sách files - ${newsletter.Title}</h5>
        <div class="file-list">
          ${files.map((file: any, index: number) => `
            <div class="file-item" data-file='${JSON.stringify(file)}'>
              <span class="file-icon">📄</span>
              <span class="file-name">${file.FileName}</span>
              <button class="download-btn" onclick="downloadFile('${file.ServerPath}', '${file.FileName}')">
                <i class="fas fa-download"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Show modal
    const modal = this.modal.create({
      nzTitle: 'Danh sách Files',
      nzContent: modalContent,
      nzWidth: 600,
      nzFooter: null,
    });

    // Add download function to window
    (window as any).downloadFile = (serverPath: string, fileName: string) => {
      this.downloadFile(serverPath, fileName);
    };
  }

  downloadFile(serverPath: string, fileName: string): void {
    if (!serverPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Đường dẫn file không hợp lệ');
      return;
    }

    // Tạo URL để download file
    const downloadUrl = `${environment.host}api/share/Newsletter/${encodeURIComponent(serverPath)}`;
    
    // Tạo link download và click
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
    toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
    onKeywordChange(value: string): void {
    this.keyWord = value;
    this.keywordSearchSubject.next(value);
  }

  onDateRangeChange(): void {
    console.log('Date range changed:', {
      dateStart: this.dateStart,
      dateEnd: this.dateEnd
    });
    
    // Trigger filter change immediately for date changes
    this.filterChangeSubject.next();
  }

    resetSearch(): void {
    this.dateStart = this.getFirstDayOfMonth();
    this.dateEnd = this.getLastDayOfMonth();
    this.typeID = 0;
    this.keyWord = '';
    this.getNewsletter();
  }

    private getFirstDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getLastDayOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

    getNewsletter(): void {
    const params = {
      FromDate: this.dateStart ? DateTime.fromJSDate(this.dateStart).startOf('day').toFormat('yyyy-MM-dd\'T\'HH:mm:ss') : null,
      ToDate: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).endOf('day').toFormat('yyyy-MM-dd\'T\'HH:mm:ss') : null,
      Keyword: this.keyWord || '',
      TypeId: this.typeID || 0
    };

    console.log('=== getNewsletter called ===');
    console.log('Current dateStart:', this.dateStart);
    console.log('Current dateEnd:', this.dateEnd);
    console.log('API params:', params);

    this.newsletterService.getNewsletter(params).subscribe({
      next: (response: any) => {
        console.log('Newsletter API response:', response);
        const data = response.data || [];
        console.log('Newsletter data:', data);
        
        if (this.nightShiftTable) {
          this.nightShiftTable.setData(data);
          setTimeout(() => {
            this.nightShiftTable?.redraw(true);
          }, 50);
          console.log('Table data set and redraw called');
        } else {
          console.log('Table not initialized yet');
        }
      },
      error: (error: any) => {
        console.error('Error loading newsletters:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải danh sách bản tin');
      }
    });
  }

 onAddNewsletter(): void {
    const modalRef = this.modalService.open(NewsletterFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNewsletter();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }
  onEditNewsletter(data?: any): void {
    // If no data provided, get selected row from table
    if (!data && this.nightShiftTable) {
      const selectedData = this.nightShiftTable.getSelectedData();
      if (selectedData.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn bản tin cần sửa');
        return;
      }
      data = selectedData[0];
    }

    const modalRef = this.modalService.open(NewsletterFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = data || null;
    modalRef.componentInstance.isEditMode = !!data;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.getNewsletter();
        }
      },
      () => {
        // Modal dismissed
      }
    );
  }

  onDeleteNewsletter(data?: any): void {
    // Get selected rows from table
    if (!this.nightShiftTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng dữ liệu chưa được khởi tạo');
      return;
    }

    const selectedRows = this.nightShiftTable.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản tin cần xóa');
      return;
    }

    // Prepare confirmation message
    const confirmMessage = selectedRows.length === 1
      ? `Bạn có chắc chắn muốn xóa bản tin "${selectedRows[0].getData()['Title']}"?`
      : `Bạn có chắc chắn muốn xóa ${selectedRows.length} bản tin đã chọn?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMessage,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOkType: 'primary',
      nzOnOk: () => {
        // Delete all selected newsletters
        for (let row of selectedRows) {
          const selectedData = row.getData();
          
          // Use saveNewsletter with NewsletterDTO structure
          const deleteDTO = {
            Newsletter: {
              ...selectedData,
              IsDeleted: true,
              UpdatedDate: new Date().toISOString()
            },
            NewsletterFiles: selectedData['NewsletterFiles'] || []
          };

          this.newsletterService.saveNewsletter(deleteDTO).subscribe({
            next: (response: any) => {
              console.log('Delete newsletter response:', response);
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa bản tin thành công');
              this.getNewsletter(); // Reload data
            },
            error: (error: any) => {
              console.error('Error deleting newsletter:', error);
              this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi xóa bản tin: ' + (error.message || ''));
            }
          });
        }
      }
    });
  }

  openNewsletterDetail(newsletter: any): void {
    const modalRef = this.modalService.open(NewsletterDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      scrollable: true
    });

    modalRef.componentInstance.newsletterId = newsletter.ID;
  }

  async exportToExcel() {}

  onTypeNewsletterChange(): void {
    this.filterChangeSubject.next();
  }
}
