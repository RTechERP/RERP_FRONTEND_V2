import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EditorModule } from 'primeng/editor';
import Quill from 'quill';

import { NOTIFICATION_TITLE } from '../../../../app.config';
import { UpdateVersionService } from '../update-version.service';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin, Observable, of } from 'rxjs';

interface UpdateVersion {
    ID: number;
    Code: string;
    Name: string;
    Content: string;
    Status: number;
    PublicDate: Date | null;
    Note: string;
    CreatedDate: Date | null;
    CreatedBy: string;
    UpdatedDate: Date | null;
    UpdatedBy: string;
    IsDeleted: boolean;
    FileNameFEOrigin?: string;
    FileNameFE?: string;
    FileNameBEOrigin?: string;
    FileNameBE?: string;
}

@Component({
    standalone: true,
    selector: 'app-update-version-form',
    imports: [
        CommonModule,
        FormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzButtonModule,
        NzGridModule,
        EditorModule,
        NzUploadModule,
        NzIconModule,
        NzMessageModule
    ],
    templateUrl: './update-version-form.component.html',
    styleUrl: './update-version-form.component.css'
})
export class UpdateVersionFormComponent implements OnInit, AfterViewInit {
    @Input() dataInput: UpdateVersion | null = null;
    @Input() nextCode: string = '';
    @Output() formSubmitted = new EventEmitter<void>();

    formData: UpdateVersion = {
        ID: 0,
        Code: '',
        Name: '',
        Content: '',
        Status: 2, // Mặc định: Chưa public
        PublicDate: null,
        Note: '',
        CreatedDate: null,
        CreatedBy: '',
        UpdatedDate: null,
        UpdatedBy: '',
        IsDeleted: false,
        FileNameFEOrigin: '',
        FileNameFE: '',
        FileNameBEOrigin: '',
        FileNameBE: ''
    };

    selectedFEFile: File | null = null;
    selectedBEFile: File | null = null;
    feFileName: string = '';
    beFileName: string = '';

    isEditMode: boolean = false;
    loading: boolean = false;
    dateFormat: string = 'dd/MM/yyyy HH:mm';

    statusOptions = [
        { label: 'Đã public', value: 1 },
        { label: 'Chưa public', value: 2 }
    ];

    constructor(
        private activeModal: NgbActiveModal,
        private updateVersionService: UpdateVersionService,
        private notification: NzNotificationService,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.configureQuillFonts();
        if (this.dataInput) {
            this.isEditMode = true;
            this.formData = { ...this.dataInput };
            // Chuyển đổi string date sang Date object nếu cần
            if (this.formData.PublicDate && typeof this.formData.PublicDate === 'string') {
                this.formData.PublicDate = new Date(this.formData.PublicDate);
            }
            this.feFileName = this.formData.FileNameFEOrigin || '';
            this.beFileName = this.formData.FileNameBEOrigin || '';
        } else {
            this.isEditMode = false;
            // Gán nextCode từ backend khi thêm mới
            this.formData.Code = this.nextCode;
        }
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.setupFontStyles();
        }, 0);
    }

    onSave(): void {
        // Validate dữ liệu
        if (!this.isEditMode && !this.formData.Code) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã phiên bản chưa được tạo, vui lòng thử lại!');
            return;
        }

        if (!this.formData.Name || this.formData.Name.trim() === '') {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tên bản cập nhật!');
            return;
        }

        this.loading = true;

        // Perform file uploads if needed
        const uploadTasks: { [key: string]: Observable<any> } = {};
        if (this.selectedFEFile) {
            uploadTasks['fe'] = this.updateVersionService.uploadFiles([this.selectedFEFile], 'FontEnd');
        }
        if (this.selectedBEFile) {
            uploadTasks['be'] = this.updateVersionService.uploadFiles([this.selectedBEFile], 'Backend');
        }

        if (Object.keys(uploadTasks).length > 0) {
            forkJoin(uploadTasks).subscribe({
                next: (res: any) => {
                    if (res.fe && res.fe.data && res.fe.data.length > 0) {
                        this.formData.FileNameFEOrigin = res.fe.data[0].OriginalFileName;
                        this.formData.FileNameFE = res.fe.data[0].SavedFileName;
                    }
                    if (res.be && res.be.data && res.be.data.length > 0) {
                        this.formData.FileNameBEOrigin = res.be.data[0].OriginalFileName;
                        this.formData.FileNameBE = res.be.data[0].SavedFileName;
                    }
                    this.saveRecord();
                },
                error: (err) => {
                    this.loading = false;
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi upload file: ' + (err.message || ''));
                }
            });
        } else {
            this.saveRecord();
        }
    }

    private saveRecord(): void {
        const payload = {
            ...this.formData,
            Code: this.formData.Code.trim(),
            Name: this.formData.Name.trim(),
            Content: this.formData.Content?.trim() || '',
            Note: this.formData.Note?.trim() || ''
        };

        this.updateVersionService.saveUpdateVersion(payload).subscribe({
            next: (res) => {
                this.loading = false;
                if (res?.status === 1) {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        this.isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!'
                    );
                    this.formSubmitted.emit();
                    this.activeModal.close('save');
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        res?.message || 'Lưu dữ liệu thất bại'
                    );
                }
            },
            error: (err) => {
                this.loading = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message || `${err?.error || ''}\n${err?.message || 'Có lỗi xảy ra khi lưu dữ liệu'}`,
                    { nzStyle: { whiteSpace: 'pre-line' } }
                );
                console.error('Lỗi lưu dữ liệu:', err);
            }
        });
    }

    beforeUploadFE = (file: any): boolean => {
        this.selectedFEFile = file as File;
        this.feFileName = file.name;
        return false;
    };

    removeFEFile(): void {
        this.selectedFEFile = null;
        this.feFileName = '';
        this.formData.FileNameFEOrigin = '';
        this.formData.FileNameFE = '';
    }

    beforeUploadBE = (file: any): boolean => {
        this.selectedBEFile = file as File;
        this.beFileName = file.name;
        return false;
    };

    removeBEFile(): void {
        this.selectedBEFile = null;
        this.beFileName = '';
        this.formData.FileNameBEOrigin = '';
        this.formData.FileNameBE = '';
    }

    onCancel(): void {
        this.activeModal.dismiss('cancel');
    }

    onStatusChange(value: number): void {
        this.formData.Status = value;
        // Nếu chọn "Đã public" và chưa có ngày public, tự động set ngày hiện tại
        if (value === 1 && !this.formData.PublicDate) {
            this.formData.PublicDate = new Date();
        }
    }

    editorModules = {};

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
