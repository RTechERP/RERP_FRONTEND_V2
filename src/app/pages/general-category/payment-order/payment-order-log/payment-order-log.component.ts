import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Formatters,
    GridOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { PaymentOrderLogService } from './payment-order-log.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
    selector: 'app-payment-order-log',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzSelectModule,
        AngularSlickgridModule
    ],
    templateUrl: './payment-order-log.component.html',
    styleUrl: './payment-order-log.component.css'
})
export class PaymentOrderLogComponent implements OnInit {
    @Input() paymentOrderId: number = 0;

    selectedPaymentOrderId: number = 0;
    paymentOrders: any[] = [];

    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    excelExportService = new ExcelExportService();

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private paymentOrderLogService: PaymentOrderLogService
    ) { }

    ngOnInit(): void {
        this.initGrid();
        this.loadPaymentOrders();
    }

    initGrid(): void {
        this.columnDefinitions = [
            {
                id: 'Step',
                name: 'Bước',
                field: 'Step',
                sortable: true,
                filterable: true,
                width: 80,
                cssClass: 'text-end'
            },
            {
                id: 'StepName',
                name: 'Tên bước',
                field: 'StepName',
                sortable: true,
                filterable: true,
                width: 300,
            },
            {
                id: 'ContentLog',
                name: 'Nội dung',
                field: 'ContentLog',
                sortable: true,
                filterable: true,
                width: 700,
            },
            {
                id: 'UpdatedDate',
                name: 'Ngày cập nhật',
                field: 'UpdatedDate',
                sortable: true,
                filterable: true,
                width: 170,
                formatter: Formatters.date,
                params: { dateFormat: 'DD/MM/YYYY HH:mm' },
            }
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container-log',
                calculateAvailableSizeBy: 'container'
            },
            forceFitColumns: true,
            enableAutoResize: true,
            enableSorting: true,
            enableFiltering: true,
            enableExcelExport: true,
            excelExportOptions: {
                exportWithFormatter: true,
            },
            externalResources: [this.excelExportService],
            gridHeight: 400,
            enableCellNavigation: true,
            enableColumnReorder: false,
            showHeaderRow: true,
            headerRowHeight: 35,
            rowHeight: 35,
            enableCheckboxSelector: false,
            enableRowSelection: false,
        };
    }

    loadPaymentOrders(): void {
        this.paymentOrderLogService.getPaymentOrder().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.paymentOrders = response.data || [];
                    if (this.paymentOrderId > 0) {
                        this.selectedPaymentOrderId = this.paymentOrderId;
                    }
                    this.loadData();
                }
            },
            error: (error: any) => {
                console.error('Error loading payment orders:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải danh sách mã phiếu');
            }
        });
    }

    loadData(): void {
        const paymentOrderId = this.selectedPaymentOrderId || 0;

        this.paymentOrderLogService.getData(paymentOrderId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.dataset = (response.data || []).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || index
                    }));
                } else {
                    this.dataset = [];
                }
            },
            error: (error: any) => {
                console.error('Error loading data:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải dữ liệu lịch sử');
                this.dataset = [];
            }
        });
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
    }

    exportExcel(): void {
        const selectedCode = this.paymentOrders.find((p: any) => p.ID === this.selectedPaymentOrderId)?.Code || '';
        this.excelExportService.exportToExcel({
            filename: `LichSuDuyetKhongDuyet_${selectedCode}`,
            format: 'xlsx'
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
