import { Component, OnInit, Input, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { EditorModule } from 'primeng/editor';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Editor } from 'primeng/editor';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../../../auth/auth.service';
import { NewsletterService } from '../newsletter.service';
import { DateTime } from 'luxon';
import { forkJoin, Observable } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { environment } from '../../../../../../environments/environment';
import Quill from 'quill';

// Interfaces cho Newsletter
interface Newsletter {
  ID?: number;
  Code?: string;
  Title?: string;
  NewsletterContent?: string;
  Type?: number; // Use number type to match C# int?
  Image?: string;
  OriginImgPath?: string;
  ServerImgPath?: string;
  CreatedBy?: string;
  CreatedDate?: string; // DateTime string
  UpdatedBy?: string;
  UpdatedDate?: string; // DateTime string
  IsDeleted?: boolean | null; // Use boolean | null to match C# bool?
}

interface NewsletterFile {
  ID?: number;
  NewsletterID?: number;
  FileName?: string;
  OriginPath?: string;
  ServerPath?: string;
  CreatedBy?: string;
  CreatedDate?: string; // DateTime string
  UpdatedBy?: string;
  UpdatedDate?: string; // DateTime string
  IsDeleted?: boolean | null; // Use boolean | null to match C# bool?
}

interface NewsletterDTO {
  Newsletter: Newsletter;
  NewsletterFiles?: NewsletterFile[];
}
@Component({
  selector: 'newsletter-form',
  templateUrl: './newsletter-form.component.html',
  styleUrls: ['./newsletter-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzSpinModule,
    NzCheckboxModule,
    NzGridModule,
    NzUploadModule,
    NzMessageModule,
    NzModalModule,
    NzInputNumberModule,
    EditorModule
  ]
})
export class NewsletterFormComponent implements OnInit, AfterViewInit {
  @Input() data: Newsletter | null = null;
  @Input() isEditMode: boolean = false;
  @ViewChild('editor') editor!: Editor;
  
  newsletterForm!: FormGroup;
  activeTabIndex = 0;
  isLoading = false;
  typeList: any[] = [];
  currentUser: any = null;

  // File upload properties
  selectedImageFile: File | null = null;
  attachImageName: string = '';
  selectedFiles: File[] = [];
  attachFileNames:string = '';
  newImagePreviewUrl: string | null = null;

  // Existing files khi edit
  existingFiles: NewsletterFile[] = [];
  deletedFileIds: number[] = [];

  editorModules = {};

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private newsletterService: NewsletterService,
    private message: NzMessageService,
    private modalService: NgbModal,
    private nzModal: NzModalService
  ) {
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
    });

    this.initForm();
    this.configureQuillFonts();
    
    // Load newsletter types
    this.loadNewsletterTypes();
    
    // Load data khi edit mode
    if (this.isEditMode && this.data) {
      this.loadEditData();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupFontStyles();
    }, 0);
  }

  private initForm(): void {
    this.newsletterForm = this.fb.group({
      ID: [0],
      Code: [''],
      Title: [null, Validators.required],
      NewsletterContent: [null, Validators.required],
      Type: [null, Validators.required],
      Image: [''],
      OriginImgPath: [''],
      ServerImgPath: [''],
      CreatedBy: [''],
      CreatedDate: [''],
      UpdatedBy: [''],
      UpdatedDate: [''],
      IsDeleted: [false] // Use boolean default
    });
  }

  private loadEditData(): void {
    this.deletedFileIds = []; // Clear any previous state
    if (this.data) {
      this.newsletterForm.patchValue({
        ID: this.data.ID || 0,
        Code: this.data.Code || '',
        Title: this.data.Title || '',
        NewsletterContent: this.data.NewsletterContent || '',
        Type: this.data.Type || null,
        Image: this.data.Image || '',
        OriginImgPath: this.data.OriginImgPath || '',
        ServerImgPath: this.data.ServerImgPath || '',
        CreatedBy: this.data.CreatedBy || '',
        CreatedDate: this.data.CreatedDate || '',
        UpdatedBy: this.data.UpdatedBy || '',
        UpdatedDate: this.data.UpdatedDate || '',
        IsDeleted: this.data.IsDeleted || false // Use boolean
      });

      // Set image display name
      if (this.data.Image) {
        this.attachImageName = this.data.OriginImgPath || this.data.Image || '';
      }

      // Load existing files nếu có
      if (this.data.ID) {
        this.loadExistingFiles(this.data.ID);
      }
    }
  }

  private loadNewsletterTypes(): void {
    this.newsletterService.getNewsletterType().subscribe({
      next: (response: any) => {
        this.typeList = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading newsletter types:', error);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi tải danh sách loại bản tin'
        );
      }
    });
  }

  private loadExistingFiles(newsletterId: number): void {
    console.log('Loading existing files for newsletter ID:', newsletterId);
    
    // Sử dụng API getNewsletterFileByNewsletterID cho đồng bộ với Detail
    this.newsletterService.getNewsletterFileByNewsletterID(newsletterId).subscribe({
      next: (response: any) => {
        console.log('Existing files response:', response);
        this.existingFiles = response.data || [];
        console.log('Loaded existing files:', this.existingFiles.length);
        
        // Cập nhật attachFileNames để hiển thị (chỉ lấy các file chưa bị xóa)
        this.updateAttachFileNames();
      },
      error: (error: any) => {
        console.error('Error loading existing files:', error);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi tải danh sách file đính kèm'
        );
      }
    });
  }

  private updateAttachFileNames(): void {
    const names = this.existingFiles
      .filter(f => !this.deletedFileIds.includes(f.ID!))
      .map(f => f.FileName || '');
    
    if (this.selectedFiles.length > 0) {
      names.push(...this.selectedFiles.map(f => f.name));
    }
    
    this.attachFileNames = names.join(', ');
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  // Image upload handlers
  beforeUploadImage = (file: any): boolean => {
    this.selectedImageFile = file as File;
    this.attachImageName = file.name;
    
    // Create preview for new image
    if (this.newImagePreviewUrl) {
      URL.revokeObjectURL(this.newImagePreviewUrl);
    }
    this.newImagePreviewUrl = URL.createObjectURL(this.selectedImageFile);
    
    return false; // Prevent automatic upload
  };

  removeImage(): void {
    if (this.newImagePreviewUrl) {
      URL.revokeObjectURL(this.newImagePreviewUrl);
      this.newImagePreviewUrl = null;
    }
    this.selectedImageFile = null;
    this.attachImageName = '';
    // Reset image fields if user wants to remove existing image
    this.newsletterForm.patchValue({
      Image: '',
      ServerImgPath: ''
    });
  }

  getImageUrl(): string {
    const serverPath = this.newsletterForm.get('ServerImgPath')?.value;
    const imageName = this.newsletterForm.get('Image')?.value;

    if (!serverPath && !imageName) return '';
    
    const host = environment.host + 'api/share/';
    let urlImage = (serverPath || imageName || '').replace("\\\\192.168.1.190\\", "");
    urlImage = urlImage.replace(/\\/g, '/');
    
    return host + urlImage;
  }

  // File upload handlers
  beforeUploadFiles = (file: any): boolean => {
    this.selectedFiles.push(file as File);
    this.updateAttachFileNames();
    return false; // Prevent automatic upload
  };

  removeFiles(): void {
    this.selectedFiles = [];
    // Mark all existing files as deleted
    this.existingFiles.forEach(file => {
      if (file.ID && !this.deletedFileIds.includes(file.ID)) {
        this.deletedFileIds.push(file.ID);
      }
    });
    this.updateAttachFileNames();
    this.cdr.detectChanges();
  }

  deleteExistingFile(file: NewsletterFile): void {
    if (file && file.ID) {
      const index = this.deletedFileIds.indexOf(file.ID);
      if (index > -1) {
        // Undo delete
        this.deletedFileIds.splice(index, 1);
      } else {
        // Delete
        this.deletedFileIds.push(file.ID);
      }
      this.updateAttachFileNames();
      this.cdr.detectChanges();
    }
  }

  viewFile(file: any): void {
    if (!file.ServerPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Đường dẫn file không hợp lệ');
      return;
    }

    const host = environment.host + 'api/share/';
    let urlFile = file.ServerPath.replace("\\\\192.168.1.190\\", "");
    urlFile = urlFile.replace(/\\/g, '/');
    urlFile = host + urlFile;

    const newWindow = window.open(urlFile, '_blank', 'width=1000,height=700');
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.document.title = file.FileName || 'File';
      };
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.');
    }
  }

  onSubmit(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      this.message.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    this.isLoading = true;

    const formData = this.newsletterForm.getRawValue();
    const currentUser = this.currentUser;

    // Upload files first if any
    const filesToUpload = [...this.selectedFiles];
    const imageToUpload = this.selectedImageFile;

    if (filesToUpload.length > 0 || imageToUpload) {
      this.uploadFilesAndSave(formData, currentUser, imageToUpload, filesToUpload);
    } else {
      // Save without file upload
      this.saveNewsletterData(formData, currentUser);
    }
  }

  private uploadFilesAndSave(formData: any, currentUser: any, imageFile: File | null, files: File[]): void {
    const uploadTasks: Observable<any>[] = [];

    // Upload image if selected
    if (imageFile) {
      uploadTasks.push(this.newsletterService.uploadNewsletterImage(imageFile));
    }

    // Upload multiple files if selected
    if (files.length > 0) {
      uploadTasks.push(this.newsletterService.uploadNewsletterFiles(files));
    }

    // Execute all uploads in parallel
    if (uploadTasks.length > 0) {
      forkJoin(uploadTasks).subscribe({
        next: (responses: any[]) => {
          this.processUploadResponses(responses, formData, currentUser);
        },
        error: (error: any) => {
          this.isLoading = false;
          const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Lỗi upload files';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
        }
      });
    } else {
      this.saveNewsletterData(formData, currentUser);
    }
  }

  private processUploadResponses(responses: any[], formData: any, currentUser: any): void {
    let imageInfo: any = null;
    let uploadedFiles: any[] = [];
    let responseIndex = 0;

    // Process image response if an image was selected
    if (this.selectedImageFile) {
      const imageResponse = responses[responseIndex++];
      if (imageResponse && imageResponse.data && Array.isArray(imageResponse.data) && imageResponse.data.length > 0) {
        imageInfo = imageResponse.data[0];
      }
    }

    // Process newsletter files response if files were selected
    if (this.selectedFiles.length > 0) {
      const filesResponse = responses[responseIndex++];
      if (filesResponse && filesResponse.data && Array.isArray(filesResponse.data)) {
        uploadedFiles = filesResponse.data;
      }
    }

    // Update form with image info
    if (imageInfo) {
      this.newsletterForm.patchValue({
        Image: imageInfo.SavedFileName || imageInfo.OriginalFileName || '',
        OriginImgPath: imageInfo.OriginalFileName || '',
        ServerImgPath: imageInfo.FilePath || ''
      });
    }

    // Prepare newsletter files data
    const newsletterFiles: NewsletterFile[] = [];
    
    // Add existing files (not deleted)
    this.existingFiles.forEach(file => {
      if (!this.deletedFileIds.includes(file.ID!)) {
        newsletterFiles.push({
          ...file,
          UpdatedBy: currentUser?.UserName || '',
          UpdatedDate: DateTime.now().toISO()
        });
      }
    });

    // Add newly uploaded files
    uploadedFiles.forEach((uploadedFile) => {
      newsletterFiles.push({
        ID: 0,
        NewsletterID: formData.ID || 0,
        FileName: uploadedFile.SavedFileName || uploadedFile.OriginalFileName || '',
        OriginPath: uploadedFile.OriginalFileName || '',
        ServerPath: uploadedFile.FilePath || '',
        CreatedBy: currentUser?.UserName || '',
        CreatedDate: DateTime.now().toISO(),
        UpdatedBy: currentUser?.UserName || '',
        UpdatedDate: DateTime.now().toISO(),
        IsDeleted: false // Use boolean type (false = not deleted)
      });
    });

    // Save newsletter data with uploaded files info
    const updatedFormData = this.newsletterForm.getRawValue();
    this.saveNewsletterDataWithFiles(updatedFormData, currentUser, newsletterFiles);
  }

  private saveNewsletterDataWithFiles(formData: any, currentUser: any, newsletterFiles: NewsletterFile[]): void {
    // Prepare Newsletter data
    const newsletterData: Newsletter = {
      ID: formData.ID || 0,
      Code: formData.Code || `NL${DateTime.now().toFormat('yyyyMMddHHmmss')}`,
      Title: formData.Title,
      NewsletterContent: formData.NewsletterContent,
      Type: formData.Type || null,
      Image: formData.Image || '',
      OriginImgPath: formData.OriginImgPath || '',
      ServerImgPath: formData.ServerImgPath || '',
      CreatedBy: formData.CreatedBy || (currentUser?.UserName || ''),
      CreatedDate: formData.CreatedDate || DateTime.now().toISO(),
      UpdatedBy: currentUser?.UserName || '',
      UpdatedDate: DateTime.now().toISO(),
      IsDeleted: formData.IsDeleted !== undefined ? formData.IsDeleted : false // Use boolean type
    };

    // Prepare DTO
    const newsletterDTO: NewsletterDTO = {
      Newsletter: newsletterData,
      NewsletterFiles: newsletterFiles
    };

    console.log('Saving newsletter with DTO:', newsletterDTO);
    console.log('NewsletterFiles count:', newsletterFiles.length);

    // Call API
    this.newsletterService.saveNewsletter(newsletterDTO).subscribe({
      next: (response: any) => {
        // If there are files marked for deletion, delete them now
        if (this.deletedFileIds.length > 0) {
          const idsToDelete = this.deletedFileIds.join(',');
          console.log('Preparing to delete files with IDs:', idsToDelete);
          this.newsletterService.deleteNewsletterFolderByID(idsToDelete).subscribe({
            next: (res: any) => {
              console.log('Successfully deleted files response:', res);
            },
            error: (err: any) => {
              console.error('Error deleting files:', err);
            }
          });
        }

        this.isLoading = false;
        this.notification.success(
          NOTIFICATION_TITLE.success,
          this.isEditMode ? 'Cập nhật newsletter thành công!' : 'Thêm newsletter thành công!'
        );
        this.activeModal.close(response);
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || error?.error?.Message || error?.message || 'Có lỗi xảy ra';
        this.notification.error(
          NOTIFICATION_TITLE.error,
          errorMessage
        );
      }
    });
  }

  private saveNewsletterData(formData: any, currentUser: any): void {
    // Prepare NewsletterFiles data (existing files only)
    const newsletterFiles: NewsletterFile[] = [];

    // Add existing files (not deleted)
    this.existingFiles.forEach(file => {
      if (!this.deletedFileIds.includes(file.ID!)) {
        newsletterFiles.push({
          ...file,
          UpdatedBy: currentUser?.UserName || '',
          UpdatedDate: DateTime.now().toISO()
        });
      }
    });

    this.saveNewsletterDataWithFiles(formData, currentUser, newsletterFiles);
  }
      autoResizeTextarea(event: any) {
    const textarea = event.target;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }


  private configureQuillFonts() {
    // Sử dụng type assertion để tránh lỗi TypeScript
    const Font = Quill.import('formats/font') as any;

    // Định nghĩa danh sách font
    const fontWhitelist = [
      'arial',
      'times-new-roman',
      'courier-new',
      'tahoma',
      'verdana',
      'georgia',
      'comic-sans-ms',
      'impact',
      'arial-black'
    ];

    // Gán whitelist
    if (Font) {
      Font.whitelist = fontWhitelist;
      Quill.register(Font, true);
    }
  }

  private setupFontStyles() {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = this.getFontCSS();
    document.head.appendChild(style);
  }

  private getFontCSS(): string {
    return `
      /* Font styles */
      .ql-font-arial { font-family: Arial, Helvetica, sans-serif !important; }
      .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; }
      .ql-font-courier-new { font-family: "Courier New", Courier, monospace !important; }
      .ql-font-tahoma { font-family: Tahoma, Verdana, sans-serif !important; }
      .ql-font-verdana { font-family: Verdana, Geneva, sans-serif !important; }
      .ql-font-georgia { font-family: Georgia, "Times New Roman", Times, serif !important; }
      .ql-font-comic-sans-ms { font-family: "Comic Sans MS", cursive, sans-serif !important; }
      .ql-font-impact { font-family: Impact, Charcoal, sans-serif !important; }
      .ql-font-arial-black { font-family: "Arial Black", Gadget, sans-serif !important; }

      /* For editor content */
      .ql-editor .ql-font-arial { font-family: Arial, Helvetica, sans-serif !important; }
      .ql-editor .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; }
      .ql-editor .ql-font-courier-new { font-family: "Courier New", Courier, monospace !important; }
    `;
  }
}

