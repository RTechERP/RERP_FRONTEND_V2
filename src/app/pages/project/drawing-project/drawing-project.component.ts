import { Component, Input, OnInit, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';

// PrimeNG
import { SharedModule, MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { CustomTable } from '../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../shared/custom-table/column-def.model';

import { DrawingProjectService } from './drawing-project.service';
import { AppUserService } from '../../../services/app-user.service';
import { DrawingProjectDetailComponent } from './drawing-project-detail/drawing-project-detail.component';
import { DateTime } from 'luxon';
import { PDFDocument } from 'pdf-lib';
import { forkJoin, of, lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
@Component({
  selector: 'app-drawing-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    SharedModule,
    CustomTable
  ],
  templateUrl: './drawing-project.component.html',
  styleUrl: './drawing-project.component.css'
})
export class DrawingProjectComponent implements OnInit {
  @Input() projectId: number = 0;
  @Input() projectCode: string = '';

  data: any[] = [];
  selectedRows: any[] = [];
  isLoading: boolean = false;

  columns: ColumnDef[] = [];
  menuBars: MenuItem[] = [];

  constructor(
    private notification: NzNotificationService,
    private message: NzMessageService,
    private modalService: NzModalService,
    @Optional() private activeModal: NgbActiveModal | null,
    private drawingService: DrawingProjectService,
    private appUserService: AppUserService
  ) { }

  get isModalMode(): boolean {
    return !!this.activeModal;
  }

  ngOnInit(): void {
    this.initMenuBar();
    this.initColumns();
    this.loadData();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus fa-lg text-primary',
        command: () => this.addDrawing(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-warning',
        command: () => this.editSelectedDrawing(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteSelectedDrawing(),
      },
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => this.loadData(),
      },
      {
        label: 'Tải PDF lên',
        icon: 'fa-solid fa-file-pdf fa-lg text-danger',
        command: () => this.triggerUploadPdf(),
      },
      {
        label: 'Quy trình',
        icon: 'fa-solid fa-code-branch fa-lg text-success',
        items: [
          {
            label: 'Check bản vẽ',
            icon: 'fa-solid fa-check text-primary',
            command: () => this.checkDrawing(),
          },
          {
            label: 'Duyệt bản vẽ',
            icon: 'fa-solid fa-check-double text-success',
            command: () => this.approveDrawing(),
          }
        ]
      }
    ];
  }

  initColumns(): void {
    this.columns = [
      { field: 'STT', header: 'STT', width: '10px', editable: false, cssClass: 'text-center' },
      { field: 'ProjectTypeName', header: 'Danh mục', width: '150px', editable: false },
      { field: 'DrawingName', header: 'Tên bản vẽ', width: '250px', editable: false },
      { field: 'Version', header: 'Version', width: '100px', editable: false, cssClass: 'text-center' },
      { field: 'DesignByName', header: 'Người Thiết kế', width: '150px', editable: false },
      { field: 'DesignDate', header: 'Ngày thiết kế', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : '' },
      { field: 'CheckedByName', header: 'Người Check', width: '150px', editable: false },
      { field: 'CheckedDate', header: 'Ngày check', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : '' },
      { field: 'ApprovedByName', header: 'Người Duyệt', width: '150px', editable: false },
      { field: 'ApprovedDate', header: 'Ngày duyệt', width: '120px', editable: false, cssClass: 'text-center', format: (v: any) => v ? DateTime.fromISO(v).toFormat('dd/MM/yyyy') : '' },
      { field: 'ServerPath', header: 'File PDF', width: '110px', editable: false, textWrap: true, clickable: true, format: (v: any) => v ? '<a href="javascript:void(0)" class="view-pdf"><i class="fa-solid fa-file-pdf text-danger me-1"></i>Xem file</a>' : 'Chưa có' }
    ];
  }

  loadData(): void {
    if (this.projectId <= 0) return;

    this.isLoading = true;
    this.drawingService.getData(this.projectId, '').subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 1 || res.isSuccess || res.data) {
          this.data = (res.data || []).map((item: any, i: number) => ({ ...item, STT: i + 1 }));
        } else {
          this.data = [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu bản vẽ!');
        this.data = [];
      }
    });
  }

  addDrawing(): void {
    const modalRef = this.modalService.create({
      nzTitle: 'Thêm bản vẽ mới',
      nzContent: DrawingProjectDetailComponent,
      nzData: { data: { ProjectID: this.projectId } },
      nzWidth: 800,
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe(result => {
      if (result === true) {
        this.loadData();
      }
    });
  }

  editSelectedDrawing(): void {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một bản vẽ để sửa!');
      return;
    }
    if (this.selectedRows.length > 1) {
      this.notification.warning('Thông báo', 'Chỉ được chọn duy nhất một bản vẽ để sửa!');
      return;
    }

    const id = this.selectedRows[0].ID || this.selectedRows[0].id;
    this.drawingService.getById(id).subscribe({
      next: (res: any) => {
        if ((res.status === 1 || res.isSuccess) && res.data) {
          const modalRef = this.modalService.create({
            nzTitle: 'Sửa bản vẽ',
            nzContent: DrawingProjectDetailComponent,
            nzData: { data: res.data },
            nzWidth: 800,
            nzFooter: null,
            nzClosable: true,
            nzMaskClosable: false
          });

          modalRef.afterClose.subscribe(result => {
            if (result === true) {
              this.loadData();
              this.selectedRows = [];
            }
          });
        }
      }
    });
  }

  deleteSelectedDrawing(): void {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bản vẽ để xóa!');
      return;
    }

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa <b>${this.selectedRows.length}</b> bản vẽ đã chọn?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = this.selectedRows[0].ID || this.selectedRows[0].id; // Currently API only supports deleting by ID one by one
        this.drawingService.delete(id).subscribe({
          next: (res: any) => {
            if (res.status === 1 || res.isSuccess) {
              this.notification.success('Thành công', 'Đã xóa bản vẽ thành công!');
              this.selectedRows = [];
              this.loadData();
            } else {
              this.notification.error('Lỗi', res.message || 'Xóa thất bại');
            }
          },
          error: (err: any) => {
            this.notification.error('Lỗi', err?.error?.message || 'Không thể xóa bản vẽ này!');
          }
        });
      }
    });
  }

  checkDrawing(): void {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bản vẽ để check!');
      return;
    }
    const id = this.selectedRows[0].ID || this.selectedRows[0].id;
    const employeeID = this.appUserService.employeeID || 0;

    this.drawingService.check(id, employeeID).subscribe({
      next: (res: any) => {
        if (res.status === 1 || res.isSuccess) {
          this.notification.success('Thành công', 'Check bản vẽ thành công!');
          this.loadData();
        } else {
          this.notification.error('Lỗi', res.message || 'Thất bại');
        }
      },
      error: (err: any) => {
        this.notification.error('Lỗi', err?.error?.message || 'Không thể check bản vẽ này!');
      }
    });
  }

  approveDrawing(): void {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bản vẽ để duyệt!');
      return;
    }
    const id = this.selectedRows[0].ID || this.selectedRows[0].id;
    const employeeID = this.appUserService.employeeID || 0;

    this.drawingService.approve(id, employeeID).subscribe({
      next: (res: any) => {
        if (res.status === 1 || res.isSuccess) {
          this.notification.success('Thành công', 'Duyệt bản vẽ thành công!');
          this.loadData();
        } else {
          this.notification.error('Lỗi', res.message || 'Thất bại');
        }
      },
      error: (err: any) => {
        this.notification.error('Lỗi', err?.error?.message || 'Không thể duyệt bản vẽ này!');
      }
    });
  }

  triggerUploadPdf(): void {
    if (this.selectedRows.length !== 1) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 bản vẽ để tải file lên!');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadPdf(file);
      }
    };
    input.click();
  }

  uploadPdf(file: File): void {
    const id = this.selectedRows[0].ID || this.selectedRows[0].id;
    this.drawingService.uploadPdf(id, file, '').subscribe({
      next: (res: any) => {
        if (res.status === 1 || res.isSuccess) {
          this.notification.success('Thành công', 'Đã tải lên file PDF!');
          this.loadData();
        } else {
          this.notification.error('Lỗi', res.message || 'Tải file thất bại!');
        }
      },
      error: (err: any) => {
        this.notification.error('Lỗi', err?.error?.message || 'Lỗi khi upload!');
      }
    });
  }

  onCloseModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    }
  }

  getImageType(bytes: Uint8Array): 'png' | 'jpg' | 'unknown' {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'png';
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'jpg';
    }
    return 'unknown';
  }

  onCellAction(event: any): void {
    if (event.field === 'ServerPath' && event.rowData.ServerPath) {
      const drawingID = event.rowData.ID || event.rowData.id;
      this.isLoading = true;

      this.drawingService.getSignedPdfBlob(drawingID).subscribe({
        next: (blob: Blob) => {
          this.isLoading = false;
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error(err);
          this.notification.error('Lỗi', 'Không thể tải file PDF đã đóng dấu');
        }
      });
    }
  }
}
