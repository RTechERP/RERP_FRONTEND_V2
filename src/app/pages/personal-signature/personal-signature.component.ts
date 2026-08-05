import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { UserService } from '../../services/user.service';
import { EmployeeService } from '../hrm/employee/employee-service/employee.service';

@Component({
  selector: 'app-personal-signature',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzUploadModule,
    NzModalModule,
    NzTagModule,
    NzDividerModule,
    NzStepsModule,
    NzToolTipModule
  ],
  providers: [NzNotificationService],
  templateUrl: './personal-signature.component.html',
  styleUrl: './personal-signature.component.css'
})
export class PersonalSignatureComponent implements OnInit {
  signatureUrl: string | null = null;
  selectedFile: File | null = null;
  fileName: string | null = null;
  fileSize: string | null = null;
  uploadDate: string | null = null;
  isLoading = false;
  userName: string = '';

  // Các biến cho Modal Căn chỉnh/Crop chữ ký
  isCropModalVisible = false;
  rawImageUrl: string | null = null;
  scale = 1;
  translateX = 0;
  translateY = 0;
  isDragging = false;
  startX = 0;
  startY = 0;
  imgElement: HTMLImageElement | null = null;
  cropFileName = 'signature.png';

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private userService: UserService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    const user = this.userService.getUser();
    if (user) {
      this.userName = user.FullName || user.LoginName || 'Người dùng';
    }
    this.loadSignature();
  }

  loadSignature(): void {
    this.isLoading = true;
    this.employeeService.getSignature().subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        if (blob && blob.size > 0 && blob.type !== 'application/json') {
          if (this.signatureUrl && this.signatureUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.signatureUrl);
          }
          this.signatureUrl = URL.createObjectURL(blob);
          this.selectedFile = null;
        } else {
          this.signatureUrl = null;
        }
      },
      error: () => {
        this.isLoading = false;
        this.signatureUrl = null;
      }
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const isPng = file.type === 'image/png' || file.name?.toLowerCase()?.endsWith('.png');
    if (!isPng) {
      this.notification.error('Lỗi định dạng', 'Hệ thống chỉ chấp nhận file ảnh chữ ký định dạng PNG!');
      return false;
    }

    const isLt5M = (file.size || 0) / 1024 / 1024 < 5;
    if (!isLt5M) {
      this.notification.error('Lỗi dung lượng', 'Dung lượng ảnh chữ ký phải nhỏ hơn 5MB!');
      return false;
    }

    const originFile = (file as any).originFileObj || (file as unknown as File);
    this.cropFileName = file.name || 'signature.png';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.rawImageUrl = e.target.result;
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        this.imgElement = img;
        const frameW = 300;
        const frameH = 150;
        const scaleW = frameW / img.width;
        const scaleH = frameH / img.height;
        this.scale = Math.min(scaleW, scaleH, 1);
        if (this.scale < 0.1) this.scale = 0.1;
        this.translateX = (frameW - img.width * this.scale) / 2;
        this.translateY = (frameH - img.height * this.scale) / 2;
        this.isCropModalVisible = true;
      };
    };
    reader.readAsDataURL(originFile);

    return false;
  };

  startDrag(e: MouseEvent): void {
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
  }

  onDrag(e: MouseEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
  }

  endDrag(): void {
    this.isDragging = false;
  }

  onWheelZoom(e: WheelEvent): void {
    e.preventDefault();
    const zoomStep = 0.05;
    const oldScale = this.scale;
    if (e.deltaY < 0) {
      this.scale = Math.min(this.scale + zoomStep, 3);
    } else {
      this.scale = Math.max(this.scale - zoomStep, 0.05);
    }

    // Adjust position to zoom toward center of frame (150, 75)
    const factor = this.scale / oldScale;
    this.translateX = 150 - (150 - this.translateX) * factor;
    this.translateY = 75 - (75 - this.translateY) * factor;
  }

  applyCrop(): void {
    if (!this.imgElement) return;

    const frameW = 300;
    const frameH = 150;
    const canvas = document.createElement('canvas');
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, frameW, frameH);
      ctx.drawImage(
        this.imgElement,
        this.translateX,
        this.translateY,
        this.imgElement.width * this.scale,
        this.imgElement.height * this.scale
      );

      canvas.toBlob((blob) => {
        if (blob) {
          this.selectedFile = new File([blob], this.cropFileName, { type: 'image/png' });
          if (this.signatureUrl && this.signatureUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.signatureUrl);
          }
          this.signatureUrl = canvas.toDataURL('image/png');
          this.fileName = this.cropFileName;
          this.fileSize = ((blob.size || 0) / 1024).toFixed(1) + ' KB';
          this.uploadDate = new Date().toLocaleString('vi-VN');
          this.isCropModalVisible = false;
        }
      }, 'image/png');
    }
  }

  cancelCrop(): void {
    this.isCropModalVisible = false;
  }

  onSaveSignature(): void {
    if (!this.selectedFile) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn file ảnh chữ ký mới trước khi lưu!');
      return;
    }

    this.isLoading = true;
    this.employeeService.uploadFiles(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1 || res?.success || res?.status === 'success' || !res?.status) {
          this.notification.success('Thành công', res?.message || 'Đã lưu chữ ký cá nhân thành công!');
          this.selectedFile = null;
          this.loadSignature();
        } else {
          this.notification.error('Lỗi', res?.message || 'Lưu chữ ký thất bại!');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error('Lỗi', err?.error?.message || err?.message || 'Không thể lưu chữ ký!');
      }
    });
  }

  onRemoveSignature(): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa chữ ký',
      nzContent: 'Bạn có chắc chắn muốn xóa ảnh chữ ký cá nhân không?',
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;
        this.employeeService.deleteSignature().subscribe({
          next: (res: any) => {
            this.isLoading = false;
            if (res?.status === 1 || res?.success || res?.status === 'success' || !res?.status) {
              if (this.signatureUrl && this.signatureUrl.startsWith('blob:')) {
                URL.revokeObjectURL(this.signatureUrl);
              }
              this.signatureUrl = null;
              this.selectedFile = null;
              this.fileName = null;
              this.fileSize = null;
              this.uploadDate = null;
              this.notification.success('Thành công', res?.message || 'Đã xóa ảnh chữ ký cá nhân.');
            } else {
              this.notification.error('Lỗi', res?.message || 'Xóa chữ ký thất bại!');
            }
          },
          error: (err: any) => {
            this.isLoading = false;
            this.notification.error('Lỗi', err?.error?.message || err?.message || 'Không thể xóa chữ ký!');
          }
        });
      }
    });
  }

  openExternalTool(url: string): void {
    window.open(url, '_blank');
  }
}
