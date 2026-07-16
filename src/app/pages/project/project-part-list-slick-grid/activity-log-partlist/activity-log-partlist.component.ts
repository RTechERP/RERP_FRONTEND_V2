import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartListService } from '../../project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';

@Component({
  selector: 'app-activity-log-partlist',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './activity-log-partlist.component.html',
  styleUrl: './activity-log-partlist.component.css'
})
export class ActivityLogPartListComponent implements OnInit, OnChanges {
  private partListService = inject(ProjectPartListService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() partListID!: number;
  @Input() productCode!: string;
  @Input() groupMaterial!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['partListID'] && !changes['partListID'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.partListID) return;

    this.isLoadingLogs = true;
    this.partListService.getLogActivityPartlist(this.partListID).subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
        }));
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching PartList logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  getLogIcon(actionType: string): string {
    if (!actionType) return 'info-circle';
    const type = actionType.toUpperCase();
    if (type.includes('TẠO MỚI') || type.includes('THÊM MỚI')) return 'plus-circle';
    if (type.includes('XÓA') || type.includes('XOÁ') || type.includes('DELETE')) return 'delete';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT') || type.includes('UPDATE')) return 'edit';
    if (type.includes('DUYỆT') || type.includes('XÁC NHẬN')) return 'check-circle';
    if (type.includes('HỦY') || type.includes('CANCEL')) return 'close-circle';
    if (type.includes('XUẤT KHO')) return 'export';
    if (type.includes('CHUYỂN KHO') || type.includes('TỒN KHO')) return 'swap';
    return 'info-circle';
  }

  getLogColorClass(actionType: string): string {
    if (!actionType) return 'log-blue';
    const type = actionType.toUpperCase();
    if (type.includes('TẠO MỚI') || type.includes('THÊM MỚI')) return 'log-green';
    if (type.includes('XÓA') || type.includes('XOÁ') || type.includes('DELETE')) return 'log-red';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT') || type.includes('UPDATE')) return 'log-orange';
    if (type.includes('DUYỆT') || type.includes('XÁC NHẬN')) return 'log-green-dark';
    if (type.includes('HỦY') || type.includes('CANCEL')) return 'log-red-dark';
    return 'log-blue';
  }

  handleReload(): void {
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}
