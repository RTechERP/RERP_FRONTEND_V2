import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { BillExportService } from '../bill-export-service/bill-export.service';
import { environment } from '../../../../../../environments/environment';


interface FileItem {
  ID?: number;
  FileName: string;
  FileSize?: number;
  FilePath?: string;
  ServerPath?: string;
  FileObject?: File; // Đối với file mới chọn
  IsNew?: boolean;
}

@Component({
  selector: 'app-bill-export-detail-file',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './bill-export-detail-file.component.html',
  styleUrl: './bill-export-detail-file.component.css'
})
export class BillExportDetailFileComponent implements OnInit {
  @Input() fileData: FileItem[] = [];
  @Input() fileName: string = ''; // Tên sản phẩm hoặc mã để hiển thị tiêu đề
  @Input() billExportDetailId: number = 0;
  @Input() isHistoryBorrow = false;

  isUploading = false;
  isDragOver = false;
  deletedFileIds: number[] = [];
  previewImage: string | null = null;
  previewVisible = false;


  constructor(
    public activeModal: NgbActiveModal,
    private billExportService: BillExportService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    // Đảm bảo fileData là mảng hợp lệ
    this.fileData = Array.isArray(this.fileData) ? [...this.fileData] : [];

    // Nếu có billExportDetailId > 0 (chế độ sửa), tải danh sách file thật từ DB
    if (this.billExportDetailId > 0) {
      this.isUploading = true;
      this.billExportService.getFiles(this.billExportDetailId).subscribe({
        next: (res: any) => {
          if (res && res.status === 1 && Array.isArray(res.data)) {
            const dbFiles: FileItem[] = res.data.map((f: any) => ({
              ID: f.ID,
              FileName: f.FileName,
              FilePath: f.ServerPath || f.OriginPath || '',
              ServerPath: f.ServerPath || f.OriginPath || '',
              IsNew: false
            }));

            // Lọc trùng theo FileName để tránh file cũ truyền từ modal (chưa có ID) bị trùng với file vừa load từ DB
            const dbFileNames = new Set(dbFiles.map(f => f.FileName.toLowerCase()));
            const pendingFiles = this.fileData.filter(f => f.IsNew || (!f.ID && !dbFileNames.has(f.FileName.toLowerCase())));
            this.fileData = [...dbFiles, ...pendingFiles];
          }
          this.isUploading = false;
        },
        error: (err: any) => {
          console.error('Error loading files:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách file đính kèm');
          this.isUploading = false;
        }
      });
    }
  }

  // Kéo thả file
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.handleFileSelection(event.dataTransfer.files);
    }
  }

  // Chọn file thông qua nút bấm
  triggerFileSelect(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.handleFileSelection(target.files);
      target.value = ''; // Reset input để có thể chọn lại cùng 1 file
    }
  }

  // Xử lý tệp đã chọn
  handleFileSelection(files: FileList): void {
    const newFiles: FileItem[] = [];
    const duplicateNames: string[] = [];
    const invalidTypes: string[] = [];

    Array.from(files).forEach(file => {
      // Chỉ cho phép file dạng ảnh
      if (!file.type.startsWith('image/')) {
        invalidTypes.push(file.name);
        return;
      }

      // Kiểm tra trùng tên file
      const isDuplicate = this.fileData.some(
        existing => existing.FileName.toLowerCase() === file.name.toLowerCase()
      );

      if (isDuplicate) {
        duplicateNames.push(file.name);
      } else {
        newFiles.push({
          FileName: file.name,
          FileSize: file.size,
          FileObject: file,
          IsNew: true
        });
      }
    });

    if (invalidTypes.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Các tệp sau không phải là ảnh hợp lệ: ${invalidTypes.join(', ')}`
      );
    }

    if (duplicateNames.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Tệp đã tồn tại: ${duplicateNames.join(', ')}`
      );
    }

    if (newFiles.length > 0) {
      this.fileData = [...this.fileData, ...newFiles];
    }
  }

  // Xem trước ảnh
  previewFile(file: FileItem): void {
    if (file.FileObject) {
      this.previewImage = URL.createObjectURL(file.FileObject);
      this.previewVisible = true;
    } else if (file.FilePath || file.ServerPath) {
      let fullPath = file.FilePath || file.ServerPath || '';
      const fileName = file.FileName || '';

      // Đảm bảo đường dẫn đầy đủ có chứa tên file ở cuối (tương tự như project-history-problem-new.component.ts)
      if (fileName && !fullPath.toLowerCase().includes(fileName.toLowerCase())) {
        const separator = fullPath.includes('/') ? '/' : '\\';
        fullPath = fullPath.replace(/[\\\/]+$/, '') + separator + fileName;
      }

      this.isUploading = true;
      this.billExportService.downloadFile(fullPath).subscribe({
        next: (blob: Blob) => {
          this.previewImage = URL.createObjectURL(blob);
          this.previewVisible = true;
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Error previewing file:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải ảnh để xem trước!');
          this.isUploading = false;
        }
      });
    } else {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy đường dẫn ảnh để xem!'
      );
    }
  }

  // Đóng xem trước ảnh
  closePreview(): void {
    this.previewVisible = false;
    this.previewImage = null;
  }


  // Xóa tệp khỏi danh sách
  removeFile(index: number): void {
    const file = this.fileData[index];
    if (file && file.ID && file.ID > 0) {
      this.deletedFileIds.push(file.ID);
    }
    this.fileData = this.fileData.filter((_, i) => i !== index);
  }


  // Định dạng dung lượng tệp
  formatFileSize(size?: number): string {
    if (size === undefined || size === null) return '';
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Lấy icon ứng với đuôi file
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'file-pdf';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'file-excel';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return 'picture';
      case 'zip':
      case 'rar':
      case '7z':
        return 'folder';
      default:
        return 'file';
    }
  }

  // Lấy class CSS cho icon đuôi file để tô màu đẹp mắt
  getFileIconClass(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'text-danger'; // màu đỏ cho PDF
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'text-success'; // màu xanh lá cho Excel
      case 'doc':
      case 'docx':
        return 'text-primary'; // màu xanh dương cho Word
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return 'text-warning'; // màu vàng/cam cho ảnh
      case 'zip':
      case 'rar':
      case '7z':
        return 'text-info'; // màu tím/cyan cho nén
      default:
        return 'text-secondary';
    }
  }

  // Lưu file - truyền fileData (chứa FileObject) và danh sách file bị xóa về màn chi tiết
  save(): void {
    this.activeModal.close({ fileData: this.fileData, deletedFileIds: this.deletedFileIds });
  }
}


