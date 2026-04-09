import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { Menubar } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { HRHiringRequestExamService } from './hrhiring-request-exam.service';
import { HRHiringRequestExamDetailComponent } from './hrhiring-request-exam-detail/hrhiring-request-exam-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ContextMenuModule } from 'primeng/contextmenu';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';

@Component({
  selector: 'app-hrhiring-request-exam',
  templateUrl: './hrhiring-request-exam.component.html',
  styleUrls: ['./hrhiring-request-exam.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Menubar,
    ToastModule,
    ConfirmDialogModule,
    CheckboxModule,
    ContextMenuModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService]
})
export class HRHiringRequestExamComponent implements OnInit {
  items: MenuItem[] = [];
  dataList: any[] = [];
  uniqueHiringRequests: any[] = [];
  filteredExams: any[] = [];
  selectedHiringRequest: any;
  selectedItems: any[] = [];
  loading: boolean = false;
  contextMenuItems: MenuItem[] = [];
  selectedRow: any;

  constructor(
    private service: HRHiringRequestExamService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.initContextMenu();
    this.loadData();
  }

  initMenu(): void {
    this.items = [
      // {

      //   label: 'Thêm',
      //   icon: 'fa-solid fa-plus text-success',
      //   hasPermission: 'N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86',
      //   command: () => this.onAdd()
      // },
      {
        label: 'Thiết lập bài thi',
        icon: 'fa-solid fa-pencil text-primary',
        hasPermission: 'N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86',
        command: () => this.onEdit()
      },
      // {
      //   label: 'Xóa',
      //   icon: 'fa-solid fa-trash text-danger',
      //   command: () => this.onDelete(),
      //   disabled: true
      // },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-arrows-rotate text-info',
        command: () => this.loadData()
      }
    ];
  }

  initContextMenu(): void {
    this.contextMenuItems = [
      {
        label: 'Kích hoạt bài thi',
        icon: 'fa-solid fa-check text-success',
        command: () => this.onActivateExam(this.selectedRow, true)
      },
      {
        label: 'Hủy kích hoạt bài thi',
        icon: 'fa-solid fa-times text-danger',
        command: () => this.onActivateExam(this.selectedRow, false)
      }
    ];
  }

  loadData(): void {
    this.loading = true;
    this.service.getHiringRequests().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.uniqueHiringRequests = res.data;
          this.extractUniqueHiringRequests(); // Ensure standard fields
          if (this.selectedHiringRequest) {
            const stillExists = this.uniqueHiringRequests.find(h => h.HiringRequestID === this.selectedHiringRequest.HiringRequestID || h.ID === this.selectedHiringRequest.HiringRequestID);
            if (stillExists) {
              this.selectedHiringRequest = stillExists;
              this.filterExams();
            } else {
              this.selectedHiringRequest = null;
              this.filteredExams = [];
            }
          }
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: res.message || 'Không thể tải dữ liệu' });
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        this.loading = false;
      }
    });
  }

  updateMenuState(): void {
    const hasSelectionOnLeft = !!this.selectedHiringRequest;
    const hasSelectionOnRight = this.selectedItems && this.selectedItems.length > 0;
  }

  onSelectionChange(event: any): void {
    this.updateMenuState();
  }

  onRowSelect(event: any): void {
    this.updateMenuState();
  }

  onRowUnselect(event: any): void {
    this.updateMenuState();
  }

  onHiringRequestSelect(event: any): void {
    this.filterExams();
    this.updateMenuState();
  }

  filterExams(): void {
    if (this.selectedHiringRequest) {
      const id = this.selectedHiringRequest.ID || this.selectedHiringRequest.HiringRequestID;
      this.loading = true;
      this.service.getExamsByHiringRequestId(id).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.filteredExams = res.data;
          } else {
            this.filteredExams = [];
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.filteredExams = [];
          this.loading = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        }
      });
    } else {
      this.filteredExams = [];
    }
    this.selectedItems = [];
  }

  extractUniqueHiringRequests(): void {
    // Ensure all items have a HiringRequestID for consistent comparison
    this.uniqueHiringRequests = this.uniqueHiringRequests.map(item => ({
      ...item,
      HiringRequestID: item.ID || item.HiringRequestID,
      HiringRequestCode: item.HiringRequestCode || item.Code,
      ChucVu: item.ChucVu || item.EmployeeChucVuHDName || item.Name,
      EmployeeChucVuHDName: item.ChucVu || item.EmployeeChucVuHDName || item.Name
    }));
  }

  onAdd(): void {
    const modalRef = this.modalService.open(HRHiringRequestExamDetailComponent, { size: 'xl', backdrop: 'static' });
    modalRef.componentInstance.isEditMode = false;
    if (this.selectedHiringRequest) {
      modalRef.componentInstance.editData = {
        HiringRequestID: this.selectedHiringRequest.HiringRequestID,
        DepartmentID: this.selectedHiringRequest.DepartmentID || this.selectedHiringRequest.EmployeeChucVuHDID
      };
    }
    modalRef.result.then((result) => {
      if (result && result.success) {
        this.loadData();
      }
    }, () => { });
  }

  onEdit(): void {
    if (this.selectedHiringRequest) {
      const hiringRequestId = this.selectedHiringRequest.HiringRequestID;

      // FilteredExams now contains the exams for this request
      const examsForRequest = this.filteredExams;

      // Use the first record or the selection itself
      const mappingRecord = examsForRequest[0];

      const aggregatedData = {
        ...this.selectedHiringRequest,
        ID: mappingRecord ? mappingRecord.HiringRequestExamID : 0, // Fallback if no exams assigned yet
        HiringRequestID: hiringRequestId,
        ExamIDs: examsForRequest.map(item => item.ID || item.ExamID).filter(id => !!id),
        Status: this.selectedHiringRequest.IsActiveExam
      };

      const modalRef = this.modalService.open(HRHiringRequestExamDetailComponent, { size: 'xl', backdrop: 'static' });
      modalRef.componentInstance.isEditMode = true;
      modalRef.componentInstance.editData = aggregatedData;
      modalRef.result.then((result) => {
        if (result && result.success) {
          this.loadData();
        }
      }, () => { });
    }
  }

  onDelete(): void {
    if (this.selectedItems && this.selectedItems.length > 0) {
      this.confirmationService.confirm({
        message: `Bạn có chắc chắn muốn xóa ${this.selectedItems.length} bản ghi đã chọn?`,
        header: 'Xác nhận xóa',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Có',
        rejectLabel: 'Không',
        accept: () => {
          this.loading = true;
          const ids = this.selectedItems.map(item => item.HiringRequestExamID || item.ID);

          const requests = ids.map(id => this.service.deleteData(id));

          forkJoin(requests).subscribe({
            next: (results: any[]) => {
              this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa dữ liệu thành công' });
              this.loadData();
              this.selectedItems = [];
              this.updateMenuState();
            },
            error: (err: any) => {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                err?.error?.message || `${err.error}\n${err.message}`,
                { nzStyle: { whiteSpace: 'pre-line' } }
              );
              this.loading = false;
            }
          });
        }
      });
    }
  }

  onRowContextMenu(event: any): void {
    this.selectedRow = event.data;
  }

  onActivateExam(item: any, status: boolean): void {
    if (!item) return;
    // Placeholder for activation logic
    console.log('Activating exam for request:', item);
    this.loading = true;
    const savePayload = {
      IsActiveExam: status,
      HiringRequestID: item.HiringRequestID,
      //listHiringRequestIDExam: [],
      //deletedHiringRequestIDExam: []
    };

    this.service.saveData(savePayload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.create(
            'success',
            'Thành công',
            `${status ? 'Kích hoạt' : 'Hủy kích hoạt'} bài thi cho vị trí: ${item.PositionName || item.HiringRequestCode}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
          this.loadData();
        } else {
          this.notification.create(
            'error',
            'Lỗi',
            res.message || 'Không thể kích hoạt bài thi',
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        this.loading = false;
      }
    });
  }
}
