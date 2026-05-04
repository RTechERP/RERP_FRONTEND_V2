import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';

@Component({
  selector: 'app-bill-import-sale-log',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './bill-import-sale-log.component.html',
  styleUrl: './bill-import-sale-log.component.css',
})
export class BillImportSaleLogComponent implements OnInit, OnChanges {
  @Input() billImportId!: number;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  constructor(
    private billImportService: BillImportServiceService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['billImportId'] && !changes['billImportId'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.billImportId) return;

    this.isLoadingLogs = true;
    this.billImportService.getSaleLogs(this.billImportId).subscribe({
      next: (res: any) => {
        // ApiResponseFactory usually returns { status: 1, Data: ... } or { data: ... }
        this.logs = res?.Data || res?.data || [];
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.isLoadingLogs = false;
      },
    });
  }

  getLogIcon(typeLog: string): string {
    if (!typeLog) return 'info-circle';
    const type = typeLog.toUpperCase();
    if (type.includes('TẠO MỚI')) return 'plus-circle';
    if (type.includes('XÓA') || type.includes('XOÁ')) return 'delete';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT')) return 'edit';
    if (type.includes('THÊM')) return 'plus-square';
    return 'info-circle';
  }

  handleReload(): void {
    this.loadLogs();
  }
}
