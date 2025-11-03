import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// ✅ NG-ZORRO imports - kiểm tra version compatibility
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// Import Service và Detail Component
import {
  MeetingTypeService,
  MeetingTypeDto,
} from './meeting-type-service/meeting-type.service';
import { MeetingTypeDetailComponent } from './meeting-type-detail/meeting-type-detail.component';

// Import Tabulator
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

@Component({
  selector: 'app-meeting-type',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzSplitterModule,
    NzModalModule, // ✅ Cho confirm dialog
  ],
  templateUrl: './meeting-type.component.html',
  styleUrls: ['./meeting-type.component.css'],
})
export class MeetingTypeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tb_meetingType', { static: false })
  tb_meetingTypeContainer!: ElementRef;

  // Tabulator instance
  tb_meetingType: any;

  // Properties for data
  meetingTypes: MeetingTypeDto[] = [];
  filteredMeetingTypes: MeetingTypeDto[] = [];
  selectedMeetingType: MeetingTypeDto | null = null;

  // Properties for loading states
  isLoadTable: boolean = false;

  // Properties for search
  searchForm: FormGroup;
  private searchTimeout: any;

  constructor(
    private fb: FormBuilder,
    private meetingTypeService: MeetingTypeService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private ngbModal: NgbModal, // ✅ Rename để phân biệt
    private nzModal: NzModalService // ✅ Thêm NzModalService cho confirm dialog
  ) {
    this.searchForm = this.fb.group({
      searchValue: ['', [Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.loadMeetingTypes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawTbMeetingType(this.tb_meetingTypeContainer.nativeElement);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.tb_meetingType) {
      this.tb_meetingType.destroy();
    }
  }

  // Draw Tabulator table
  drawTbMeetingType(container: HTMLElement): void {
    let contextMenu = [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-edit"></i> Sửa</span>',
        action: (e: any, row: any) => {
          this.selectedMeetingType = row.getData();
          this.editMeetingType();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:red;"><i class="fas fa-trash"></i> Xóa</span>',
        action: (e: any, row: any) => {
          this.selectedMeetingType = row.getData();
          this.deleteMeetingType();
        },
      },
    ];

    this.tb_meetingType = new Tabulator(container, {
      height: '100%',
      layout: 'fitColumns',
      locale: 'vi',
      pagination: true,
      paginationSize: 20,
      paginationSizeSelector: [10, 20, 50, 100, 200],
      paginationButtonCount: 5,
      langs: {
        vi: {
          pagination: {
            first: '<<',
            first_title: 'Trang đầu',
            last: '>>',
            last_title: 'Trang cuối',
            prev: '<',
            prev_title: 'Trang trước',
            next: '>',
            next_title: 'Trang sau',
          },
        },
      },
      data: this.filteredMeetingTypes,
      groupBy: ['GroupName'],
      groupStartOpen: true,
      groupHeader: function (value: any, count: any, data: any, group: any) {
        return `Thành phần tham gia: ${value}`;
      },
      rowContextMenu: contextMenu,
      selectableRows: 1,
      selectableRowsRangeMode: 'click',
      columns: [
        {
          title: 'STT',
          field: 'STT',
          width: 60,
          headerHozAlign: 'center',
          hozAlign: 'center',
          formatter: (cell: any) => cell.getRow().getPosition(),
        },
        {
          title: 'Mã loại cuộc họp',
          field: 'TypeCode',
          width: 200,
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Tên loại cuộc họp',
          field: 'TypeName',
          width: 300,
          headerHozAlign: 'center',
          sorter: 'string',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
        {
          title: 'Nội dung',
          field: 'TypeContent',
          headerHozAlign: 'center',
          formatter: (cell: any) =>
            this.highlightSearchKeyword(cell.getValue() || ''),
        },
      ],
    });

    // Add event listeners
    this.tb_meetingType.on('rowClick', (e: any, row: any) => {
      this.selectedMeetingType = row.getData();
    });

    this.tb_meetingType.on('rowDblClick', (e: any, row: any) => {
      this.selectedMeetingType = row.getData();
      this.editMeetingType();
    });

    this.tb_meetingType.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedMeetingType = rows.length > 0 ? rows[0].getData() : null;
    });
  }

  // Highlight search keyword
 
  highlightSearchKeyword(text: string): string {
    const searchValue = this.searchForm.get('searchValue')?.value;
    if (!searchValue || !searchValue.trim() || !text) {
      return text;
    }
    const keyword = searchValue.trim();
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(
      regex,
      '<span style="background-color: #ffff00; color: #000; font-weight: bold; padding: 1px 2px; border-radius: 2px;">$1</span>'
    );
  }

  // Load data from API
  loadMeetingTypes(): void {
    this.isLoadTable = true;
    const fallbackData: MeetingTypeDto[] = [];

    this.meetingTypeService.getAllMeetingTypes().subscribe({
      next: (response: any) => {
        let processedData: MeetingTypeDto[] = [];

        if (response) {
          if (
            response.Success &&
            response.Data &&
            Array.isArray(response.Data)
          ) {
            processedData = response.Data;
          } else if (Array.isArray(response.Data)) {
            processedData = response.Data;
          } else if (Array.isArray(response)) {
            processedData = response;
          } else if (response.data && Array.isArray(response.data)) {
            processedData = response.data;
          } else if (response.result && Array.isArray(response.result)) {
            processedData = response.result;
          } else {
            processedData = fallbackData;
          }
        } else {
          processedData = fallbackData;
        }

        this.meetingTypes = processedData.map((item: any) => ({
          ...item,
          GroupName:
            item.GroupName ||
            (item.GroupID === 1
              ? 'Nội bộ'
              : item.GroupID === 2
              ? 'Khách hàng'
              : ''),
        }));

        this.filteredMeetingTypes = [...this.meetingTypes];

        if (this.tb_meetingType) {
          this.tb_meetingType.setData(this.filteredMeetingTypes);
        }

        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.meetingTypes = fallbackData;
        this.filteredMeetingTypes = [...this.meetingTypes];
        if (this.tb_meetingType) {
          this.tb_meetingType.setData(this.filteredMeetingTypes);
        }
        this.isLoadTable = false;
        this.message.warning('Không thể tải dữ liệu từ API');
      },
    });
  }

  // // Load data from API
  // loadMeetingTypes(): void {
  //   this.isLoadTable = true;
  //   const fallbackData: MeetingTypeDto[] = [];

  //   this.meetingTypeService.getAllMeetingTypes().subscribe({
  //     next: (response: any) => {
  //       let processedData: MeetingTypeDto[] = [];

  //       if (response) {
  //         if (
  //           response.Success &&
  //           response.Data &&
  //           Array.isArray(response.Data)
  //         ) {
  //           processedData = response.Data;
  //         } else if (Array.isArray(response.Data)) {
  //           processedData = response.Data;
  //         } else if (Array.isArray(response)) {
  //           processedData = response;
  //         } else if (response.data && Array.isArray(response.data)) {
  //           processedData = response.data;
  //         } else if (response.result && Array.isArray(response.result)) {
  //           processedData = response.result;
  //         } else {
  //           processedData = fallbackData;
  //         }
  //       } else {
  //         processedData = fallbackData;
  //       }

  //       this.meetingTypes = processedData.map((item: any) => ({
  //         ...item,
  //         GroupName:
  //           item.GroupName ||
  //           (item.GroupID === 1
  //             ? 'Nội bộ'
  //             : item.GroupID === 2
  //             ? 'Khách hàng'
  //             : ''),
  //       }));

  //       this.filteredMeetingTypes = [...this.meetingTypes];

  //       if (this.tb_meetingType) {
  //         this.tb_meetingType.setData(this.filteredMeetingTypes);
  //       }

  //       this.isLoadTable = false;
  //     },
  //     error: (error) => {
  //       console.error('API Error:', error);
  //       this.meetingTypes = fallbackData;
  //       this.filteredMeetingTypes = [...this.meetingTypes];
  //       if (this.tb_meetingType) {
  //         this.tb_meetingType.setData(this.filteredMeetingTypes);
  //       }
  //       this.isLoadTable = false;
  //       this.message.warning('Không thể tải dữ liệu từ API');
  //     },
  //   });
  // }

  // Search functionality
  clearSearch(): void {
    this.searchForm.patchValue({ searchValue: '' });
    this.filteredMeetingTypes = [...this.meetingTypes];
    if (this.tb_meetingType) {
      this.tb_meetingType.setData(this.filteredMeetingTypes);
      this.tb_meetingType.redraw();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.filterMeetingTypes();
    }, 300);
  }

  private filterMeetingTypes(): void {
    const searchValue = this.searchForm.get('searchValue')?.value;
    if (!searchValue || searchValue.trim() === '') {
      this.filteredMeetingTypes = [...this.meetingTypes];
    } else {
      const keyword = searchValue.toLowerCase().trim();
      this.filteredMeetingTypes = this.meetingTypes.filter(
        (item) =>
          item.TypeCode?.toLowerCase().includes(keyword) ||
          item.TypeName?.toLowerCase().includes(keyword) ||
          item.TypeContent?.toLowerCase().includes(keyword)
      );
    }

    // Update table data
    if (this.tb_meetingType) {
      this.tb_meetingType.setData(this.filteredMeetingTypes);
    }
  }

  // CRUD operations - Sử dụng Detail Component
  addMeetingType(): void {
    const modalRef = this.ngbModal.open(MeetingTypeDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.meetingTypeId = 0;
    modalRef.componentInstance.isEdit = false;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadMeetingTypes();
        }
      },
      (dismissed) => {
        if (dismissed) {
          this.loadMeetingTypes();
        }
      }
    );
  }

  editMeetingType(): void {
    if (!this.selectedMeetingType) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn 1 loại cuộc họp cần sửa!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }
    const modalRef = this.ngbModal.open(MeetingTypeDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.meetingTypeId = this.selectedMeetingType.ID;
    modalRef.componentInstance.isEdit = true;
    modalRef.componentInstance.currentData = this.selectedMeetingType;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadMeetingTypes();
        }
      },
      (dismissed) => {
        if (dismissed) {
          this.loadMeetingTypes();
        }
      }
    );
  }

  deleteMeetingType(): void {
    if (!this.selectedMeetingType) {
      this.notification.error(
        'Thông báo',
        'Vui lòng chọn 1 loại cuộc họp cần xóa!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại cuộc họp <strong>"${this.selectedMeetingType?.TypeName}"</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDelete(),
    });
  }

  confirmDelete(): void {
    if (!this.selectedMeetingType) return;

    const deleteData: MeetingTypeDto = {
      ...this.selectedMeetingType,
      IsDelete: true,
      UpdatedBy: 'Current User',
      UpdatedDate: new Date(),
    };

    this.meetingTypeService.saveData(deleteData).subscribe({
      next: (response) => {
        if (response) {
          this.notification.success(
            'Thông báo',
            'Xóa loại cuộc họp thành công!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          this.selectedMeetingType = null;
          this.loadMeetingTypes();
        } else {
          this.notification.error(
            'Thông báo',
            'Xóa loại cuộc họp không thành công!',
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi xóa loại cuộc họp!',
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
      }
    });
  }

  refreshData(): void {
    this.searchForm.patchValue({ searchValue: '' });
    this.selectedMeetingType = null;
    this.loadMeetingTypes();
  }
}
