import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import { MechanicalDrawingService } from '../mechanical-drawing.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

/**
 * Script được inject vào <head> của file HTML preview (trước mọi script khác)
 * để buộc mọi WebGL context được tạo ra giữ lại drawing buffer sau khi render.
 * Nhờ đó ta có thể đọc pixel/canvas để chụp thumbnail ngay cả sau khi frame đã swap.
 * Bắt buộc phải patch TRƯỚC khi engine 3D (eDrawings) gọi getContext lần đầu,
 * nên script này phải nằm ở đầu <head>, trước <script> gốc của file.
 */
const WEBGL_PRESERVE_BUFFER_PATCH = `
<script>
(function () {
  var origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attributes) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      attributes = attributes || {};
      attributes.preserveDrawingBuffer = true;
    }
    return origGetContext.call(this, type, attributes);
  };
})();
</script>
`;

@Component({
    selector: 'app-mechanical-drawing-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzIconModule,
        NzFormModule,
    ],
    templateUrl: './mechanical-drawing-detail.component.html',
    styleUrl: './mechanical-drawing-detail.component.css'
})
export class MechanicalDrawingDetailComponent implements OnInit, OnDestroy {
    @Input() id: number = 0;
    @Input() isEditMode: boolean = false;
    @Output() onSaved = new EventEmitter<any>();
    @ViewChild('previewIframe') previewIframeRef?: ElementRef<HTMLIFrameElement>;
    @ViewChild('previewWrapper') previewWrapperRef?: ElementRef<HTMLDivElement>;

    model: any = {};
    projects: any[] = [];
    errors: any = {};
    isLoading = false;
    isSubmitting = false;
    selectedFile: File | null = null;
    previewUrl: SafeResourceUrl | null = null;
    isCapturingThumbnail = false;
    thumbnailSaved = false;
    // Base64 thumbnail đã chụp nhưng chưa gửi lên server (dùng khi bản ghi chưa có ID)
    pendingThumbnailBase64: string | null = null;
    // Ảnh thumbnail vừa chụp (base64) - giữ lại để hiển thị cho người dùng xem lại,
    // không bị xóa sau khi lưu thành công (khác với pendingThumbnailBase64)
    capturedThumbnailPreview: string | null = null;
    isPreviewLoading = false;

    private previewBlobUrl: string | null = null;

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private mechanicalDrawingService: MechanicalDrawingService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.initModel();
        this.loadProjects();

        if (this.isEditMode && this.id > 0) {
            this.loadDetail();
        }
    }

    ngOnDestroy(): void {
        if (this.previewBlobUrl) URL.revokeObjectURL(this.previewBlobUrl);
        if (this.thumbnailBlobObjectUrl) URL.revokeObjectURL(this.thumbnailBlobObjectUrl);
    }

    private initModel(): void {
        this.model = {
            ID: this.id || 0,
            Name: '',
            ProjectID: null,
            FilePath: ''
        };
    }

    loadProjects(): void {
        this.mechanicalDrawingService.getProjects().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.projects = response.data || [];
                }
            },
            error: (error: any) => {
                console.error('Error loading projects:', error);
            }
        });
    }

    private loadDetail(): void {
        this.isLoading = true;
        this.mechanicalDrawingService.getMechanicalDrawingDetail(this.id).subscribe({
            next: (response: any) => {
                this.isLoading = false;
                if (response?.status === 1 && response.data) {
                    const data = response.data;
                    this.model.ID = data.ID || 0;
                    this.model.Name = data.Name || '';
                    this.model.ProjectID = data.ProjectID || null;
                    this.model.FilePath = data.FilePath || '';
                    this.model.ThumbnailPath = data.ThumbnailPath || null;
                    this.thumbnailSaved = !!data.ThumbnailPath;
                    if (this.model.ThumbnailPath) {
                        this.loadThumbnailBlob();
                    }
                    if (this.model.FilePath) {
                        this.loadPreview();
                    }
                }
            },
            error: (error: any) => {
                this.isLoading = false;
                console.error('Error loading detail:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải dữ liệu chi tiết');
            }
        });
    }

    // Thumbnail blob URL cho <img> — cần fetch có Bearer token
    thumbnailBlobUrl: string | null = null;
    private thumbnailBlobObjectUrl: string | null = null;

    private loadThumbnailBlob(): void {
        if (!this.model.ID || this.thumbnailBlobUrl) return;
        this.mechanicalDrawingService.fetchThumbnail(this.model.ID).subscribe({
            next: (blob) => {
                if (blob && blob.size > 0) {
                    if (this.thumbnailBlobObjectUrl) URL.revokeObjectURL(this.thumbnailBlobObjectUrl);
                    this.thumbnailBlobObjectUrl = URL.createObjectURL(blob);
                    this.thumbnailBlobUrl = this.thumbnailBlobObjectUrl;
                }
            },
            error: () => { /* 204 / 401 → bỏ qua */ }
        });
    }

    getFileName(path: string): string {
        if (!path) return '';
        return path.split('\\').pop()?.split('/').pop() || '';
    }

    /** Lấy tên file bỏ đuôi mở rộng, dùng để auto-fill tên bản vẽ khi thêm mới. */
    private getFileNameWithoutExtension(fileName: string): string {
        if (!fileName) return '';
        const lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    }

    /**
     * Trích tên bản vẽ từ tên file để auto-fill khi thêm mới.
     * Ví dụ: "RTC1.26.017-DR-3D-GP1 (Băng tải load-unload khay).html"
     *        -> "Băng tải load-unload khay"
     * Nếu tên file không có dấu (), fallback về tên file (bỏ đuôi mở rộng).
     */
    private extractDrawingNameFromFileName(fileName: string): string {
        const nameWithoutExt = this.getFileNameWithoutExtension(fileName);
        const matches = [...nameWithoutExt.matchAll(/\(([^()]+)\)/g)];
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1][1].trim();
            if (lastMatch) return lastMatch;
        }
        return nameWithoutExt;
    }

    private isHtmlFile(fileName: string): boolean {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ext === 'html' || ext === 'htm';
    }

    /**
     * Chèn patch WebGL vào đầu <head> (hoặc đầu tài liệu nếu không có head)
     * để đảm bảo patch chạy trước bất kỳ script nào khác trong file.
     */
    private injectWebglPatch(htmlContent: string): string {
        const headOpenMatch = htmlContent.match(/<head[^>]*>/i);
        if (headOpenMatch) {
            const insertPos = headOpenMatch.index! + headOpenMatch[0].length;
            return htmlContent.slice(0, insertPos) + WEBGL_PRESERVE_BUFFER_PATCH + htmlContent.slice(insertPos);
        }
        const htmlOpenMatch = htmlContent.match(/<html[^>]*>/i);
        if (htmlOpenMatch) {
            const insertPos = htmlOpenMatch.index! + htmlOpenMatch[0].length;
            return htmlContent.slice(0, insertPos) + WEBGL_PRESERVE_BUFFER_PATCH + htmlContent.slice(insertPos);
        }
        return WEBGL_PRESERVE_BUFFER_PATCH + htmlContent;
    }

    onFileSelected(event: any): void {
        const file: File | undefined = event.target.files[0];
        if (!file) return;

        // Chỉ cho phép upload file HTML
        if (!this.isHtmlFile(file.name)) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ hỗ trợ file HTML (.html, .htm)');
            event.target.value = ''; // Reset input
            return;
        }

        this.selectedFile = file;
        this.thumbnailSaved = false;
        this.pendingThumbnailBase64 = null;
        this.capturedThumbnailPreview = null;

        // Khi thêm mới (không phải sửa): tự động điền tên bản vẽ.
        // Ưu tiên lấy phần text trong dấu () của tên file (VD: "...-GP1 (Băng tải load-unload khay).html"
        // -> "Băng tải load-unload khay"). Nếu không có (), fallback về tên file bỏ đuôi mở rộng.
        // Người dùng vẫn có thể sửa lại sau đó tùy ý.
        if (!this.isEditMode) {
            this.model.Name = this.extractDrawingNameFromFileName(file.name);
            this.notification.info('Thông báo', 'Đã ghi đè tên bản vẽ theo tệp đính kèm');
        }

        this.previewSelectedFile(file);
    }

    private previewSelectedFile(file: File): void {
        if (!this.isHtmlFile(file.name)) {
            this.setPreviewUrl(null);
            return;
        }

        file.text().then((content) => {
            const patched = this.injectWebglPatch(content);
            const blob = new Blob([patched], { type: 'text/html' });
            this.setPreviewUrl(URL.createObjectURL(blob));
        }).catch((err) => {
            console.error('[Preview] Không đọc được nội dung file:', err);
            this.setPreviewUrl(null);
        });
    }

    /**
     * Load preview file đã lưu trên server, patch WebGL trước khi hiển thị.
     */
    private loadPreview(): void {
        if (!this.model.FilePath || !this.model.ID) return;
        if (!this.isHtmlFile(this.model.FilePath)) return;

        this.isPreviewLoading = true;
        this.mechanicalDrawingService.previewFile(this.model.ID).subscribe({
            next: async (blob) => {
                try {
                    const content = await blob.text();
                    const patched = this.injectWebglPatch(content);
                    const patchedBlob = new Blob([patched], { type: 'text/html' });
                    this.setPreviewUrl(URL.createObjectURL(patchedBlob));
                } catch (err) {
                    console.error('[Preview] Lỗi xử lý nội dung file:', err);
                }
                this.isPreviewLoading = false;
            },
            error: (err) => {
                console.error('Preview error:', err);
                this.isPreviewLoading = false;
            }
        });
    }

    private setPreviewUrl(blobUrl: string | null): void {
        if (this.previewBlobUrl) {
            URL.revokeObjectURL(this.previewBlobUrl);
            this.previewBlobUrl = null;
        }
        this.previewBlobUrl = blobUrl;
        this.previewUrl = blobUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl) : null;
    }

    // ============================================================
    // Thumbnail capture
    // ============================================================

    captureAndSaveThumbnail(): void {
        if (this.isCapturingThumbnail) return;
        this.isCapturingThumbnail = true;

        this.waitForIframeLoad()
            .then(() => this.capturePreviewElement())
            .catch(() => this.capturePreviewElement());
    }

    private waitForIframeLoad(): Promise<void> {
        return new Promise((resolve, reject) => {
            const iframe = this.previewIframeRef?.nativeElement;
            if (!iframe) { reject('no-iframe'); return; }

            const doc = iframe.contentDocument;
            if (doc?.readyState === 'complete' && doc.body?.innerHTML) {
                resolve(); return;
            }
            iframe.onload = () => resolve();
            setTimeout(() => reject('timeout'), 5000);
        });
    }

    /**
     * Poll đến khi canvas WebGL bên trong iframe có ít nhất một pixel không phải
     * trắng/trong suốt (tức là 3D đã render xong), hoặc timeout sau maxWaitMs.
     * Trả về canvas element (có thể vẫn blank nếu timeout).
     */
    private pollForRenderedCanvas(iframe: HTMLIFrameElement, maxWaitMs = 20000, intervalMs = 500): Promise<HTMLCanvasElement | null> {
        const deadline = Date.now() + maxWaitMs;
        return new Promise((resolve) => {
            const tick = () => {
                const canvas = iframe.contentDocument?.querySelector('canvas') as HTMLCanvasElement | null;
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    if (this.canvasHasNonBlankContent(canvas)) {
                        resolve(canvas); return;
                    }
                }
                if (Date.now() > deadline) { resolve(canvas ?? null); return; }
                setTimeout(tick, intervalMs);
            };
            tick();
        });
    }

    private canvasHasNonBlankContent(canvas: HTMLCanvasElement): boolean {
        try {
            const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
            if (!gl) return false;
            const w = canvas.width;
            const h = canvas.height;
            // Lấy mẫu ở 5 vị trí (tâm + 4 góc phần tư)
            const points: [number, number][] = [
                [Math.floor(w / 2), Math.floor(h / 2)],
                [Math.floor(w / 4), Math.floor(h / 4)],
                [Math.floor((3 * w) / 4), Math.floor(h / 4)],
                [Math.floor(w / 4), Math.floor((3 * h) / 4)],
                [Math.floor((3 * w) / 4), Math.floor((3 * h) / 4)],
            ];
            const px = new Uint8Array(4);
            for (const [x, y] of points) {
                gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
                const isWhiteOrTransparent =
                    px[3] === 0 ||
                    (px[0] === 255 && px[1] === 255 && px[2] === 255);
                if (!isWhiteOrTransparent) return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    private async capturePreviewElement(): Promise<void> {
        const iframe = this.previewIframeRef?.nativeElement;

        if (!iframe?.contentDocument?.body) {
            this.captureWrapperFallback();
            return;
        }

        // Đợi 3D render xong (poll canvas)
        const canvas = await this.pollForRenderedCanvas(iframe);

        if (canvas && canvas.width > 0 && canvas.height > 0) {
            try {
                const out = document.createElement('canvas');
                out.width = canvas.width;
                out.height = canvas.height;
                const ctx = out.getContext('2d');
                if (ctx) {
                    // preserveDrawingBuffer đã được patch -> drawImage trực tiếp OK
                    ctx.drawImage(canvas, 0, 0);
                    this.processThumbnailCanvas(out);
                    return;
                }
            } catch (err) {
                console.warn('[Thumbnail] drawImage từ canvas thất bại, thử html2canvas:', err);
            }
        }

        // Fallback: chụp toàn bộ body iframe bằng html2canvas
        html2canvas(iframe.contentDocument.body, {
            backgroundColor: '#ffffff',
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            windowWidth: iframe.contentWindow?.innerWidth || 800,
            windowHeight: iframe.contentWindow?.innerHeight || 600,
        }).then((resultCanvas: HTMLCanvasElement) => {
            if (resultCanvas.width < 10 || resultCanvas.height < 10) {
                this.isCapturingThumbnail = false;
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Nội dung 3D chưa render xong, vui lòng thử lại sau vài giây');
                return;
            }
            this.processThumbnailCanvas(resultCanvas);
        }).catch((err) => {
            console.warn('[Thumbnail] html2canvas thất bại:', err);
            this.isCapturingThumbnail = false;
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể tạo thumbnail từ bản vẽ');
        });
    }

    private captureWrapperFallback(): void {
        if (!this.previewWrapperRef) {
            this.isCapturingThumbnail = false;
            return;
        }
        html2canvas(this.previewWrapperRef.nativeElement, {
            backgroundColor: '#ffffff',
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
        }).then((c: HTMLCanvasElement) => this.processThumbnailCanvas(c))
          .catch((err) => {
              console.error('[Thumbnail] wrapper fallback thất bại:', err);
              this.isCapturingThumbnail = false;
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể tạo thumbnail từ bản vẽ');
          });
    }

    /**
     * Resize canvas về kích thước chuẩn (max 400×300) giữ nguyên tỷ lệ aspect ratio
     * rồi lưu lên server. Nếu bản ghi chưa có ID, giữ tạm base64 và sẽ gửi khi submitForm().
     */
    private processThumbnailCanvas(canvas: HTMLCanvasElement): void {
        const maxW = 400, maxH = 300;
        const srcW = canvas.width, srcH = canvas.height;
        
        // Tính tỷ lệ scale giữ nguyên aspect ratio
        const scale = Math.min(maxW / srcW, maxH / srcH);
        const destW = Math.floor(srcW * scale);
        const destH = Math.floor(srcH * scale);

        const thumb = document.createElement('canvas');
        thumb.width = destW;
        thumb.height = destH;
        const ctx = thumb.getContext('2d');
        if (!ctx) { this.isCapturingThumbnail = false; return; }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, destW, destH);
        ctx.drawImage(canvas, 0, 0, srcW, srcH, 0, 0, destW, destH);
        const base64 = thumb.toDataURL('image/png', 0.85);
        this.capturedThumbnailPreview = base64;

        if (this.model?.ID) {
            this.saveThumbnailToServer(this.model.ID, base64);
        } else {
            // Bản ghi chưa tồn tại - giữ tạm, gửi cùng submitForm()
            this.pendingThumbnailBase64 = base64;
            this.thumbnailSaved = true;
            this.isCapturingThumbnail = false;
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã chụp thumbnail. Bấm "Lưu lại" để hoàn tất.');
        }
    }

    private saveThumbnailToServer(id: number, base64: string): void {
        this.mechanicalDrawingService.saveThumbnail(id, base64).subscribe({
            next: (res: any) => {
                this.isCapturingThumbnail = false;
                if (res?.status === 1) {
                    this.thumbnailSaved = true;
                    this.pendingThumbnailBase64 = null;
                    this.model.ThumbnailPath = res.data?.ThumbnailPath || 'saved';
                    this.notification.success(NOTIFICATION_TITLE.success, 'Đã lưu thumbnail thành công');
                } else {
                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Lưu thumbnail thất bại: ' + (res?.message || ''));
                }
            },
            error: (err) => {
                this.isCapturingThumbnail = false;
                console.error('[Thumbnail] Save failed:', err);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lưu thumbnail');
            }
        });
    }

    // ============================================================
    // Validate & Submit
    // ============================================================

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.model.Name || (this.model.Name || '').trim() === '') {
            this.errors.name = 'Vui lòng nhập tên bản vẽ';
            isValid = false;
        }

        if (!this.model.ProjectID || this.model.ProjectID === 0) {
            this.errors.projectId = 'Vui lòng chọn dự án';
            isValid = false;
        }

        // Chỉ bắt buộc thumbnail khi file là HTML (vì chỉ HTML mới được phép upload và chụp thumbnail)
        const isHtmlFile = this.selectedFile 
            ? this.isHtmlFile(this.selectedFile.name) 
            : (this.model.FilePath ? this.isHtmlFile(this.model.FilePath) : false);
        
        if (isHtmlFile) {
            const hasThumbnail = !!this.model.ThumbnailPath || !!this.pendingThumbnailBase64;
            if (!hasThumbnail) {
                this.errors.thumbnail = 'Vui lòng lấy thumbnail cho bản vẽ HTML trước khi lưu';
                isValid = false;
            }
        }

        return isValid;
    }

    submitForm(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        const payload = {
            ID: this.model.ID || 0,
            Name: (this.model.Name || '').trim(),
            ProjectID: this.model.ProjectID,
            FilePath: (this.model.FilePath || '').trim()
        };

        this.isSubmitting = true;
        this.mechanicalDrawingService.saveData(payload).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    const savedData = response.data;
                    if (this.selectedFile) {
                        this.mechanicalDrawingService.uploadFile(savedData.ID, this.selectedFile).subscribe({
                            next: (uploadRes: any) => {
                                if (uploadRes?.status === 1) {
                                    this.model.ID = uploadRes.data.ID;
                                    this.model.FilePath = uploadRes.data.FilePath;
                                    this.notification.success(NOTIFICATION_TITLE.success, 'Lưu và tải lên file thành công');
                                    this.finalizeSave({ ...savedData, ...uploadRes.data });
                                } else {
                                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Lưu thông tin thành công nhưng tải file thất bại: ' + (uploadRes?.message || ''));
                                    this.finalizeSave(savedData);
                                }
                            },
                            error: () => {
                                this.notification.warning(NOTIFICATION_TITLE.warning, 'Lưu thông tin thành công nhưng lỗi khi tải file lên');
                                this.finalizeSave(savedData);
                            }
                        });
                    } else {
                        this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                        this.finalizeSave(savedData);
                    }
                } else {
                    this.isSubmitting = false;
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error: any) => {
                this.isSubmitting = false;
                console.error('Error saving:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
            }
        });
    }

    /**
     * Sau khi lưu bản ghi thành công, kiểm tra xem có thumbnail đang chờ không.
     * Nếu có, gửi thumbnail lên server rồi mới đóng modal.
     */
    private finalizeSave(savedData: any): void {
        const id: number = savedData?.ID || this.model.ID;

        if (this.pendingThumbnailBase64 && id) {
            this.mechanicalDrawingService.saveThumbnail(id, this.pendingThumbnailBase64).subscribe({
                next: (res: any) => {
                    this.isSubmitting = false;
                    const thumbnailPath = res?.data?.ThumbnailPath;
                    const finalData = thumbnailPath ? { ...savedData, ThumbnailPath: thumbnailPath } : savedData;
                    this.onSaved.emit(finalData);
                    this.activeModal.close(finalData);
                },
                error: () => {
                    this.isSubmitting = false;
                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Lưu dữ liệu thành công nhưng lưu thumbnail thất bại');
                    this.onSaved.emit(savedData);
                    this.activeModal.close(savedData);
                }
            });
        } else {
            this.isSubmitting = false;
            this.onSaved.emit(savedData);
            this.activeModal.close(savedData);
        }
    }

    destroyModal(): void {
        this.activeModal.dismiss();
    }
}
