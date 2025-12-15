import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PaymentOrderService } from './payment-order.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaymentOrderDetailComponent } from './payment-order-detail/payment-order-detail.component';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, OnEventArgs } from 'angular-slickgrid';
import { PaymentOrderField } from './model/payment-order';

@Component({
    selector: 'app-payment-order',
    imports: [
        Menubar,
        AngularSlickgridModule
    ],
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

        {
            label: 'Copy',
            icon: PrimeIcons.CLONE,
            command: () => {
                // this.onCopy();
            }
        },

        {
            label: 'TBP xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },

        {
            label: 'HR xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt hồ sơ',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Hủy duyệt hồ sơ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Bổ sung chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },


        {
            label: 'Kế toán xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt hồ sơ',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Bổ sung chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy duyệt hồ sơ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Nhận chứng từ',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy nhận chứng từ',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'TBP duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'TBP hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                },

                {
                    label: 'Đã thanh toán',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hủy thanh toán',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Đính kèm file Bank slip',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Hợp đồng',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },

        {
            label: 'BGĐ xác nhận',
            icon: PrimeIcons.CHECK,
            items: [
                {
                    label: 'Duyệt',
                    icon: PrimeIcons.CHECK
                },
                {
                    label: 'Hủy duyệt',
                    icon: PrimeIcons.UNLOCK
                },
                {
                    label: 'Duyệt đặc biệt (ko cần check những bước trước)',
                    icon: PrimeIcons.UNLOCK
                }
            ]
        },

        {
            label: 'Cây thư mục',
            icon: PrimeIcons.FOLDER
        },
        {
            label: 'Xuất excel',
            icon: PrimeIcons.FOLDER
        }
    ];

    angularGrid!: AngularGridInstance;
    gridData: any;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    constructor(
        private modalService: NgbModal,
        private paymentService: PaymentOrderService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initGrid();
    }

    initGrid() {
        this.columnDefinitions = [
            {
                id: 'ID',
                name: PaymentOrderField.ID.name,
                field: PaymentOrderField.ID.field,
                type: PaymentOrderField.ID.type,
                sortable: true, filterable: true,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'STT',
                name: PaymentOrderField.ID.name,
                field: PaymentOrderField.ID.field,
                type: PaymentOrderField.ID.type,
                sortable: true, filterable: true,
                // formatter: Formatters.icon,
                filter: { model: Filters['compoundInputNumber'] },
            },
        ]
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.gridData = angularGrid?.slickGrid || {};
    }

    handleRowSelection(e: Event, args: OnEventArgs) {

    }

    initModal() {
        const modalRef = this.modalService.open(PaymentOrderDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            scrollable: true
        });
    }

    onCreate() {
        this.initModal();
    }

    onEdit() {
        this.initModal();
    }

    onDelete() {

    }
}
