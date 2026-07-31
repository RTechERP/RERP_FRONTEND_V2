import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CodeGeneratorService } from '../../services/code-generator.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

type CodeMode = 'qr' | 'barcode';

@Component({
  selector: 'app-code-generator-modal',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  templateUrl: './code-generator-modal.component.html',
  styleUrl: './code-generator-modal.component.css',
})
export class CodeGeneratorModalComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Tạo mã QR / Mã vạch';
  @Input() codeLabel: string = 'Số phiếu';
  @Input() code: string = '';

  mode: CodeMode = 'qr';
  isLoading: boolean = false;
  imageUrl: string | null = null;

  private objectUrls: string[] = [];

  constructor(
    private modalService: NgbModal,
    private codeGeneratorService: CodeGeneratorService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.loadImage();
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  switchMode(mode: CodeMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.loadImage();
  }

  private loadImage(): void {
    if (!this.code) return;

    this.isLoading = true;
    this.imageUrl = null;

    const request$ =
      this.mode === 'qr'
        ? this.codeGeneratorService.getQrCode(this.code)
        : this.codeGeneratorService.getBarcode(this.code);

    request$.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.objectUrls.push(url);
        this.imageUrl = url;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          this.mode === 'qr'
            ? 'Không thể tạo mã QR'
            : 'Không thể tạo mã vạch'
        );
      },
    });
  }

  downloadImage(): void {
    if (!this.imageUrl) return;

    const link = document.createElement('a');
    link.href = this.imageUrl;
    link.download = `${this.mode === 'qr' ? 'QRCode' : 'Barcode'}_${this.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
