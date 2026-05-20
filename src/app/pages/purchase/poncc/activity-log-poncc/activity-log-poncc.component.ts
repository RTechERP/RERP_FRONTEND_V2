import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PONCCService } from '../poncc.service';

@Component({
  selector: 'app-activity-log-poncc',
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './activity-log-poncc.component.html',
  styleUrl: './activity-log-poncc.component.css'
})
export class ActivityLogPonccComponent implements OnInit, OnChanges {
  private ponccService = inject(PONCCService);
  private modal = inject(NgbActiveModal, { optional: true });
  constructor() { }

  @Input() ponccId!: number;
  @Input() ponccCode!: string;
  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ponccId'] && !changes['ponccId'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.ponccId) return;

    this.isLoadingLogs = true;
    this.ponccService.getLogActivityPoncc(this.ponccId).subscribe({
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
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}

