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
import { BillExportService } from '../../bill-export-service/bill-export.service';

@Component({
  selector: 'app-bill-export-sale-log',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './bill-export-sale-log.component.html',
  styleUrl: './bill-export-sale-log.component.css',
})
export class BillExportSaleLogComponent implements OnInit {
  @Input() billExportID!: number;
  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  constructor(
    private billExportService: BillExportService
  ) {}

   ngOnChanges(changes: SimpleChanges): void {
    if (changes['billImportId'] && !changes['billImportId'].firstChange) {
      this.loadLogs();
    }
  }

  
  loadLogs(): void {
    if (!this.billExportID) return;

    this.isLoadingLogs = true;
    this.billExportService.getSaleLogs(this.billExportID).subscribe({
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
