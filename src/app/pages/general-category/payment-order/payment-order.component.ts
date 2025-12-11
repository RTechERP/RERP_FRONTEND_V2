import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PaymentOrderService } from './payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaymentOrderDetailComponent } from './payment-order-detail/payment-order-detail.component';

@Component({
    selector: 'app-payment-order',
    imports: [Menubar],
    templateUrl: './payment-order.component.html',
    styleUrl: './payment-order.component.css',
    standalone: true
})
export class PaymentOrderComponent implements OnInit {

    menuBars: MenuItem[] = [
        {
            label: 'Thêm',
            icon: PrimeIcons.PLUS,
            command: () => {
                this.onCreate();
            }
        },
        {
            label: 'Sửa',
            icon: PrimeIcons.PENCIL,
            command: () => {
                this.onEdit();
            }
        },

        {
            label: 'Xóa',
            icon: PrimeIcons.TRASH,
            command: () => {
                this.onDelete();
            }
        },
    ];

    constructor(
        private modalService: NgbModal,
        private paymentService: PaymentOrderService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initializeGrid();
    }

    initializeGrid() {

    }

    initializeModal() {
        const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
    }

    onCreate() {
        this.initializeModal();
    }

    onEdit() {
        this.initializeModal();
    }

    onDelete() {

    }
}
