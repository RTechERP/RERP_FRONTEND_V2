import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TravelRegistrationServiceService } from '../travel-registration-service/travel-registration-service.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../app.config';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-travel-registration-confirm-modal',
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './travel-registration-confirm-modal.component.html',
  styleUrl: './travel-registration-confirm-modal.component.css'
})
export class TravelRegistrationConfirmModalComponent implements OnInit {
  @Input() dataInput: any[] | null = null;

  isLoading = false;
  isConfirming = false;
  travelRegistrations: any[] = [];
  unconfirmedList: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    if (this.dataInput && this.dataInput.length > 0) {
      this.travelRegistrations = this.dataInput;
      this.unconfirmedList = this.travelRegistrations.filter((x: any) => x.ConfirmStatus !== 1);
    } else {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.travelRegistrationService.getByEmployeeId().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1 && res.data) {
          this.travelRegistrations = res.data || [];
          this.unconfirmedList = this.travelRegistrations.filter((x: any) => x.ConfirmStatus !== 1);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get isAllConfirmed(): boolean {
    return this.travelRegistrations.length > 0 && this.travelRegistrations.every((x: any) => x.ConfirmStatus === 1);
  }

  onConfirmAll(): void {
    if (this.unconfirmedList.length === 0) return;
    this.isConfirming = true;
    const confirmRequests = this.unconfirmedList.map(row =>
      this.travelRegistrationService.confirm(row.EmployeeID || row.OwnerEmployeeID, 1)
    );

    forkJoin(confirmRequests).subscribe({
      next: (responses: any[]) => {
        this.isConfirming = false;
        const successCount = responses.filter(r => r?.status === 1).length;
        if (successCount === responses.length) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận đăng ký du lịch thành công');
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xác nhận ${successCount}/${responses.length} đăng ký`);
        }
        this.loadData();
      },
      error: (err: any) => {
        this.isConfirming = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
