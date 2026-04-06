import { Component, Input, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DomSanitizer, SafeHtml, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

type FileType = 'image' | 'pdf' | 'excel' | 'word' | 'other';

@Component({
    selector: 'app-file-preview',
    standalone: true,
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './file-preview.component.html',
    styleUrl: './file-preview.component.css'
})
export class FilePreviewComponent implements OnInit, AfterViewChecked, OnDestroy {
    @Input() fileName: string = '';
    @Input() fileUrl:  string = '';

    @ViewChild('docxContainer') docxContainerRef?: ElementRef<HTMLElement>;

    fileType: FileType = 'other';
    isLoading = false;
    errorMsg: string | null = null;

    zoom = 1;

    // image
    imageUrl: SafeUrl | null = null;

    // pdf
    pdfUrl: SafeResourceUrl | null = null;

    // excel
    excelHtml: SafeHtml | null = null;
    excelSheetNames: string[] = [];
    activeSheet = 0;
    private workbook: XLSX.WorkBook | null = null;

    // word
    wordBuffer: ArrayBuffer | null = null;
    private _docxRendered = false;

    // download link
    downloadUrl: SafeUrl | null = null;

    private _objectUrls: string[] = [];

    constructor(
        public activeModal: NgbActiveModal,
        private http: HttpClient,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.fileType = this.detectFileType(this.fileName);
        this.downloadUrl = this.sanitizer.bypassSecurityTrustUrl(this.fileUrl);
        this.loadFile();
    }

    ngAfterViewChecked(): void {
        if (this.wordBuffer && !this._docxRendered && this.docxContainerRef?.nativeElement) {
            this._docxRendered = true;
            this.renderDocx();
        }
    }

    ngOnDestroy(): void {
        this._objectUrls.forEach(u => URL.revokeObjectURL(u));
    }

    // ---- helpers ----
    detectFileType(name: string): FileType {
        const ext = (name.split('.').pop() ?? '').toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
        if (['docx', 'doc'].includes(ext)) return 'word';
        return 'other';
    }

    get fileIcon(): string {
        switch (this.fileType) {
            case 'image': return 'file-image';
            case 'pdf':   return 'file-pdf';
            case 'excel': return 'file-excel';
            case 'word':  return 'file-word';
            default:      return 'file-unknown';
        }
    }

    // ---- load ----
    loadFile(): void {
        this.isLoading = true;
        this.errorMsg = null;

        if (this.fileType === 'pdf') {
            this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
            this.isLoading = false;
        } else if (this.fileType === 'image') {
            this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(this.fileUrl);
            this.isLoading = false;
        } else if (this.fileType === 'excel') {
            this.http.get(this.fileUrl, { responseType: 'arraybuffer' }).subscribe({
                next: buffer => {
                    this.workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                    this.excelSheetNames = this.workbook.SheetNames;
                    this.renderSheet(0);
                    this.isLoading = false;
                },
                error: () => {
                    this.errorMsg = 'Không thể tải file Excel.';
                    this.isLoading = false;
                }
            });
        } else if (this.fileType === 'word') {
            this.http.get(this.fileUrl, { responseType: 'arraybuffer' }).subscribe({
                next: buffer => {
                    this.wordBuffer = buffer;
                    this.isLoading = false;
                    // renderDocx() sẽ được gọi từ ngAfterViewChecked khi container sẵn sàng
                },
                error: () => {
                    this.errorMsg = 'Không thể tải file Word.';
                    this.isLoading = false;
                }
            });
        } else {
            this.isLoading = false;
        }
    }

    renderDocx(): void {
        const container = this.docxContainerRef?.nativeElement;
        if (!container || !this.wordBuffer) return;
        renderAsync(this.wordBuffer, container, undefined, {
            className: 'docx-render',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
        }).catch(() => {
            this.errorMsg = 'Không thể hiển thị file Word.';
        });
    }

    renderSheet(index: number): void {
        if (!this.workbook) return;
        this.activeSheet = index;
        const ws = this.workbook.Sheets[this.workbook.SheetNames[index]];
        const html = XLSX.utils.sheet_to_html(ws, { id: 'xlsx-preview-table' });
        this.excelHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }

    // ---- zoom ----
    get zoomPct(): number { return Math.round(this.zoom * 100); }

    zoomIn():    void { this.zoom = Math.min(+(this.zoom + 0.1).toFixed(1), 4); }
    zoomOut():   void { this.zoom = Math.max(+(this.zoom - 0.1).toFixed(1), 0.2); }
    zoomReset(): void { this.zoom = 1; }

    @HostListener('wheel', ['$event'])
    onWheel(event: WheelEvent): void {
        if (!event.shiftKey) return;
        event.preventDefault();
        event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
    }

    // ---- computed styles ----
    get scaledWidth(): string  { return (100 / this.zoom) + '%'; }
    get scaledHeight(): string { return (100 / this.zoom) + '%'; }
    get scaleStyle(): any {
        return {
            transform: `scale(${this.zoom})`,
            'transform-origin': 'top left',
            width: this.scaledWidth,
        };
    }
}
