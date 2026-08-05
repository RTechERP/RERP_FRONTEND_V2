import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ProductsaleServiceService } from '../../product-sale-service/product-sale-service.service';

@Component({
  selector: 'app-product-sale-import-export-log',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule, FormsModule, NzInputModule],
  templateUrl: './product-sale-import-export-log.component.html',
  styleUrl: './product-sale-import-export-log.component.css'
})
export class ProductSaleImportExportLogComponent implements OnInit {
  private modalRef = inject(NzModalRef, { optional: true });
  private srv = inject(ProductsaleServiceService);

  logs: any[] = [];
  isLoadingLogs: boolean = false;
  searchTerm: string = '';

  get filteredLogs(): any[] {
    if (!this.searchTerm.trim()) {
      return this.logs;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.logs.filter(log => {
      const contentMatch = log.ContentLog?.toLowerCase().includes(term);
      const typeMatch = log.TypeLog?.toLowerCase().includes(term);
      const dateMatch = this.formatLogDate(log.CreatedDate).includes(term);
      return contentMatch || typeMatch || dateMatch;
    });
  }

  private formatLogDate(dateStr: any): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${d}/${m}/${y} ${dd}/${mm}/${y} ${hh}:${MM}:${ss}`;
  }

  ngOnInit(): void {
    this.getLogActivity();
  }

  getLogActivity(): void {
    this.isLoadingLogs = true;

    this.srv.getlogHistoryImportExport().subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
        }));
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.isLoadingLogs = false;
      }
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
    this.getLogActivity();
  }

  handleClose(): void {
    this.modalRef?.destroy();
  }
}

