import { Component, OnInit } from '@angular/core';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

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

    ngOnInit(): void {
        this.initializeGrid();
    }

    initializeGrid() {

    }


    onCreate() {

    }

    onEdit() {

    }

    onDelete() {

    }
}
