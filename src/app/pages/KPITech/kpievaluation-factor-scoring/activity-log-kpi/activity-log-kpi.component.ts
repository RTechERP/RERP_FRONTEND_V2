import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KPIService } from '../../kpi-service/kpi.service';

@Component({
  selector: 'app-activity-log-kpi',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './activity-log-kpi.component.html',
  styleUrl: './activity-log-kpi.component.css'
})
export class ActivityLogKpiComponent implements OnInit, OnChanges {
  private kpiService = inject(KPIService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() employeeID!: number;
  @Input() employeeName!: string;
  @Input() kpiSessionID!: number;
  @Input() kpiSessionCode!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['employeeID'] && !changes['employeeID'].firstChange) ||
        (changes['kpiSessionID'] && !changes['kpiSessionID'].firstChange)) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.employeeID) return;

    this.isLoadingLogs = true;
    this.kpiService.getLogActivityKPI(this.employeeID, this.kpiSessionID).subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
        }));
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching KPI logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  getLogIcon(typeLog: string): string {
    if (!typeLog) return 'info-circle';
    const type = typeLog.toUpperCase();
    if (type.includes('TẠO MỚI') || type.includes('THÊM MỚI')) return 'plus-circle';
    if (type.includes('XÓA') || type.includes('XOÁ')) return 'delete';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT') || type.includes('LƯU')) return 'edit';
    if (type.includes('THÊM')) return 'plus-square';
    if (type.includes('DUYỆT') || type.includes('XÁC NHẬN')) return 'check-circle';
    if (type.includes('HỦY') || type.includes('CANCEL')) return 'close-circle';
    return 'info-circle';
  }

  handleReload(): void {
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}
