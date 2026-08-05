import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { InventoryStockService } from '../inventory-stock.service';

@Component({
  selector: 'app-inventory-stock-log',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './inventory-stock-log.component.html',
  styleUrl: './inventory-stock-log.component.css'
})
export class InventoryStockLogComponent implements OnInit, OnChanges {
  public activeModal = inject(NgbActiveModal, { optional: true });
  private srv = inject(InventoryStockService);

  @Input() inventoryId!: number;
  @Input() productCode!: string;
  @Input() productName!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.getLogActivity();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inventoryId'] && !changes['inventoryId'].firstChange) {
      this.getLogActivity();
    }
  }

  getLogActivity(): void {
    if (!this.inventoryId) return;

    this.isLoadingLogs = true;

    this.srv.getLogActivity(this.inventoryId).subscribe({
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
    this.activeModal?.close();
  }
}
