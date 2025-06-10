import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { HandoverMinutesService } from './handover-minutes/handover-minutes.service';


@Component({
    selector: 'app-handover-minutes',
    standalone: true,
    imports: [CommonModule, FormsModule, NzSelectModule, NzButtonModule],
    templateUrl: './handover-minutes.component.html',
    styleUrl: './handover-minutes.component.css'
})
export class HandoverMinutesComponent implements OnInit, AfterViewInit {
    @ViewChild('handoverMinutesTable', { static: false }) tableElement!: ElementRef;
    private table!: Tabulator;

    // Form data
    formData: any = {
        dateMinutes: new Date(),
        employeeName: null,
        employeePhone: '',
        emailCaNhan: '',
        departmentName: '',
        customerName: null,
        customerContact: '',
        customerPhone: '',
        customerAddress: '',
        receiver: '',
        receiverPhone: '',
        adminWarehouse: null
    };

    // Data arrays
    employeesAndDepartments: any[] = [];
    customers: any[] = [];
    products: any[] = [];
    details: any[] = [];

    constructor(
        private modalService: NgbModal, 
        private handoverMinutesService: HandoverMinutesService,
        public activeModal: NgbActiveModal
    ) { }

    ngOnInit(): void {
        this.loadCustomer()
        this.loadEmployeeAndDepartment();
        this.loadProduct();
    }

    ngAfterViewInit(): void {
        this.initTable();
    }
    loadCustomer(): void {
        this.handoverMinutesService.loadCustomer().subscribe(
            response => {
                if (response.status === 1) {
                    this.customers = response.data;
                } else {
                    console.error('Lỗi khi tải Customer:', response.message);
                }
            },
            error => {
                console.error('Lỗi kết nối khi tải Customer:', error);
            }
        );
    }
    loadEmployeeAndDepartment(): void {
        this.handoverMinutesService.loadEmployeeAndDepartment().subscribe(
            response => {
                if (response.status === 1) {
                    this.employeesAndDepartments = response.data;
                } else {
                    console.error('Lỗi khi tải employeesAndDepartments:', response.message);
                }
            },
            error => {
                console.error('Lỗi kết nối khi tải employeesAndDepartments:', error);
            }
        );
    }
    loadProduct(): void {
        this.handoverMinutesService.loadProduct().subscribe(
            response => {
                if (response.status === 1) {
                    this.products = response.data;
                } else {
                    console.error('Lỗi khi tải products:', response.message);
                }
            },
            error => {
                console.error('Lỗi kết nối khi tải products:', error);
            }
        );
    }
    initTable(): void {
        this.table = new Tabulator(this.tableElement.nativeElement, {
            height: '400px',
            layout: 'fitColumns',
            columns: [
                { title: 'STT', field: 'STT', width: 60, hozAlign: 'center' },
                { title: 'Số PO / Số hợp đồng', field: 'POCode', width: 120 },
                { title: 'Mã sản phẩm', field: 'ProductCode', width: 120 },
                { title: 'Tên sản phẩm', field: 'ProductName', width: 200 },
                { title: 'Hãng', field: 'Maker', width: 150 },
                { title: 'Số lượng', field: 'Quantity', width: 100, hozAlign: 'right' },
                { title: 'SL còn lại', field: 'QuantityPending', width: 100, hozAlign: 'right' },
                { title: 'ĐVT', field: 'ProductUnit', width: 100 },
                { title: 'Tình trạng hàng', field: 'ProductStatus', width: 120 },
                { title: 'Bảo hành', field: 'Guarantee', width: 100 },
                { title: 'Tình trạng giao hàng (Nhận đủ/ Thiếu)', field: 'DeliveryStatus', width: 150 },
            ],
            data: this.details
        });
    }

    saveAndClose(): void {
        // Implement save and close functionality
    }


    closeModal(): void {
        this.activeModal.close();
    }
} 