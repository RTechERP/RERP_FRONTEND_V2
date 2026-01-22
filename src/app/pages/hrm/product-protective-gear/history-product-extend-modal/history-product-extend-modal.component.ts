import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-history-product-extend-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzDatePickerModule,
        NzButtonModule
    ],
    templateUrl: './history-product-extend-modal.component.html',
    styleUrls: ['./history-product-extend-modal.component.css']
})
export class HistoryProductExtendModalComponent implements OnInit {
    extendDate: Date | null = null;

    constructor(
        private modalRef: NzModalRef,
        private notification: NzNotificationService,
        @Inject(NZ_MODAL_DATA) public data: { item: any; currentReturnDate: Date | null }
    ) { }

    ngOnInit(): void {
        // Set default extend date to current return date or today + 7 days
        if (this.data?.currentReturnDate) {
            this.extendDate = new Date(this.data.currentReturnDate);
        } else {
            const today = new Date();
            today.setDate(today.getDate() + 7);
            this.extendDate = today;
        }
    }

    onConfirm(): void {
        if (!this.extendDate) {
            this.notification.warning('Thông báo', 'Vui lòng chọn ngày gia hạn!');
            return;
        }

        // Check if extend date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(this.extendDate);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.notification.warning('Thông báo', 'Ngày gia hạn không được nhỏ hơn ngày hiện tại!');
            return;
        }

        // Close modal and return the selected date
        this.modalRef.close(this.extendDate);
    }

    onCancel(): void {
        this.modalRef.destroy();
    }
}
