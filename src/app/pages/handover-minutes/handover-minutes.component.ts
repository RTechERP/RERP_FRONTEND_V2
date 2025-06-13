import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input } from '@angular/core';
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
import { ViewPokhService } from '../view-pokh/view-pokh/view-pokh.service';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
    selector: 'app-handover-minutes',
    standalone: true,
    imports: [CommonModule, FormsModule, NzSelectModule, NzButtonModule, NzTabsModule, NzDropDownModule, NzIconModule],
    templateUrl: './handover-minutes.component.html',
    styleUrl: './handover-minutes.component.css'
})
export class HandoverMinutesComponent implements OnInit, AfterViewInit {
    @ViewChild('handoverMinutesTable', { static: false }) tableElement!: ElementRef;
    private table!: Tabulator;

    @Input() groupedData: any[] = []; // Dữ liệu từ component cha truyền vào
    @Input() isMultipleGroups: boolean = false; // Flag để kiểm tra có nhiều tab không
    activeTabIndex: number = 0; // Index của tab hiện tại
    currentTabData: any = null; // Dữ liệu của tab hiện tại
    savedTabs: Set<number> = new Set(); // Theo dõi các tab đã được lưu

    // Form data
    formData: any = this.getDefaultFormData();

    //Lưu trữ form data cho từng tab
    tabFormData: any[] = []; // Mảng chứa form data cho từng tab 

    // Data arrays
    deletedHandoverMinutesDetailIds: number[] = [];
    employeesAndDepartments: any[] = [];
    customers: any[] = [];
    products: any[] = [];
    details: any[] = [];
    productStatusOptions = [
        { value: 1, label: 'Mới' },
        { value: 2, label: 'Cũ' },
    ];
    deliveryStatusOptions = [
        { value: 1, label: 'Nhận đủ' },
        { value: 2, label: 'Thiếu' },
    ];

    constructor(
        private modalService: NgbModal,
        private handoverMinutesService: HandoverMinutesService,
        public activeModal: NgbActiveModal,
        private viewPokhService: ViewPokhService
    ) { }

    ngOnInit(): void {
        // Load dữ liệu cần thiết trước
        this.loadCustomer();
        this.loadEmployeeAndDepartment();
        this.loadProduct();
        this.initializeTabFormData();

        // Sau khi load xong customers, mới khởi tạo form data
        setTimeout(() => {
            this.loadTabFormData(this.activeTabIndex);
            // Khởi tạo tab đầu tiên
            if (this.groupedData && this.groupedData.length > 0) {
                this.switchTab(0);
            }
        }, 250);
    }

    ngAfterViewInit(): void {
    }
    //#region Hàm tải dữ liệu từ API
    loadCustomer(): void {
        this.viewPokhService.loadCustomer().subscribe(
            response => {
                if (response.status === 1) {
                    this.customers = response.data;
                    // Khởi tạo form data sau khi đã load xong customers
                    setTimeout(() => {
                        this.initializeTabFormData();
                    }, 1);
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
                    // Sort employees by FullName alphabetically
                    this.employeesAndDepartments = response.data.sort((a: any, b: any) =>
                        a.Employee.FullName.localeCompare(b.Employee.FullName, 'vi')
                    );
                    console.log("Employees and Departments:", this.employeesAndDepartments);
                } else {
                    console.error('Lỗi khi tải Employee và Department:', response.message);
                }
            },
            error => {
                console.error('Lỗi kết nối khi tải Employee và Department:', error);
            }
        );
    }
    loadProduct(): void {
        this.handoverMinutesService.loadProduct().subscribe(
            response => {
                if (response.status === 1) {
                    this.products = response.data[0];
                    this.initTable();
                    setTimeout(() => {
                        if (this.details.length > 0) {
                            this.updateTableWithPOCode();
                        }
                    }, 1);
                } else {
                    console.error('Lỗi khi tải products:', response.message);
                }
            },
            error => {
                console.error('Lỗi kết nối khi tải products:', error);
            }
        );
    }
    //#endregion
    //#region Vẽ bảng
    initTable(): void {
        this.table = new Tabulator(this.tableElement.nativeElement, {
            data: this.details,
            height: '400px',
            layout: 'fitColumns',
            columns: [
                {
                    title: '', field: 'actions', formatter: (cell) => {
                        return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
                    },
                    width: '5%',
                    hozAlign: "center",
                    cellClick: (e, cell) => {
                        if ((e.target as HTMLElement).classList.contains('delete-btn')) {
                            if (confirm('Bạn có chắc chắn muốn xóa người phụ trách này?')) {
                                const row = cell.getRow();
                                const rowData = row.getData();

                                // thêm id của người phụ trách đã xóa vào mảng deletedHandoverMinutesDetailIds
                                if (rowData['ID']) {
                                    this.deletedHandoverMinutesDetailIds.push(rowData['ID']);
                                }
                                console.log('deletedHandoverMinutesDetailIds:', this.deletedHandoverMinutesDetailIds);

                                row.delete();
                                this.details = this.table.getData();
                            }
                        }
                    }
                },
                { title: 'STT', field: 'STT', width: 60, hozAlign: 'center' },
                {
                    title: 'Số PO / Số hợp đồng', field: 'POCode', width: 120, editor: "list", editorParams: {
                        values: this.products.map((product) => ({
                            label: product.POCode,
                            value: product.POKHDetailID
                        }))
                    }, formatter: (cell) => {
                        const value = cell.getValue();
                        const product = this.products.find(p => p.POKHDetailID === value);
                        return product ? product.POCode : value;
                    }
                },
                { title: 'Mã sản phẩm', field: 'ProductCode', width: 120, editor: "input" },
                { title: 'Tên sản phẩm', field: 'ProductName', width: 200, editor: "input" },
                { title: 'Hãng', field: 'Maker', width: 100, editor: "input" },
                { title: 'Số lượng', field: 'Quantity', width: 100, hozAlign: 'right', editor: "input" },
                { title: 'SL còn lại', field: 'QuantityPending', width: 100, hozAlign: 'right' },
                { title: 'ĐVT', field: 'Unit', width: 100, editor: "input" },
                {
                    title: 'Tình trạng hàng', field: 'ProductStatus', width: 120, editor: "list", editorParams: {
                        values: this.productStatusOptions.map(option => ({
                            label: option.label,
                            value: option.value
                        })),
                    }, formatter: (cell) => {
                        const value = cell.getValue();
                        const option = this.productStatusOptions.find(opt => opt.value === value);
                        return option ? option.label : value;
                    }
                },
                { title: 'Bảo hành', field: 'Guarantee', width: 100, editor: "input" },
                {
                    title: 'Tình trạng giao hàng (Nhận đủ/ Thiếu)', field: 'DeliveryStatus', width: 150, editor: "list", editorParams: {
                        values: this.deliveryStatusOptions.map(option => ({
                            label: option.label,
                            value: option.value
                        }))
                    }, formatter: (cell) => {
                        const value = cell.getValue();
                        const option = this.deliveryStatusOptions.find(opt => opt.value === value);
                        return option ? option.label : value;
                    }
                },
            ],
        });

        this.table.on('cellEdited', (cell: CellComponent) => {
            if (cell.getColumn().getField() === 'POCode') {
                const pokhDetailId = cell.getValue();
                const selectedProduct = this.products.find(p => p.POKHDetailID === pokhDetailId);

                if (selectedProduct) {
                    const row = cell.getRow();
                    row.update({
                        ProductCode: selectedProduct.ProductCode,
                        ProductName: selectedProduct.ProductName,
                        Maker: selectedProduct.Maker,
                        Quantity: selectedProduct.Quantity,
                        Unit: selectedProduct.Unit
                    });
                }
            }
        });
    }
    //#endregion
    //#region Xử lý sự kiện
    saveAndClose(): void {
        if(!this.validateForm()){
            return;
        }
        // Lưu form data của tab hiện tại
        this.saveCurrentTabFormData();

        // Chuẩn bị dữ liệu để gửi lên server
        const currentFormData = this.tabFormData[this.activeTabIndex];
        const currentDetails = this.details;

        const handoverMinutesData = {
            ID: this.currentTabData?.ID || 0,
            DateMinutes: currentFormData.dateMinutes,
            CustomerID: currentFormData.customerId,
            CustomerAddress: currentFormData.customerAddress,
            CustomerContact: currentFormData.customerContact,
            CustomerPhone: currentFormData.customerPhone,
            EmployeeID: currentFormData.employeeName,
            Receiver: currentFormData.receiver,
            ReceiverPhone: currentFormData.receiverPhone,
            AdminWarehouseID: currentFormData.adminWarehouse,
            Details: currentDetails.map((detail, index) => ({
                ID: detail.ID || 0,
                STT: index + 1,
                POKHDetailID: detail.POKHDetailID,
                Quantity: detail.Quantity,
                ProductStatus: detail.ProductStatus,
                Guarantee: detail.Guarantee,
                DeliveryStatus: detail.DeliveryStatus
            }))
        };

        // Gọi API để lưu dữ liệu
        this.handoverMinutesService.save(handoverMinutesData).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    // Đánh dấu tab hiện tại đã được lưu
                    this.savedTabs.add(this.activeTabIndex);

                    // Kiểm tra nếu tất cả các tab đã được lưu thì mới đóng modal
                    if (this.savedTabs.size === this.groupedData.length) {
                        this.activeModal.close({ success: true, reloadTable: true });
                    }
                } else {
                    console.error('Lỗi khi lưu biên bản:', response.message);
                }
            },
            error: (error) => {
                console.error('Lỗi kết nối khi lưu biên bản:', error);
            }
        });
    }
    closeModal(): void {
        this.activeModal.close({ reloadTable: this.savedTabs.size > 0 });
    }
    onEmployeeChange(employeeId: number): void {
        const selectedEmployee = this.employeesAndDepartments.find(emp => emp.Employee.ID === employeeId);
        if (selectedEmployee) {
            this.formData.departmentName = selectedEmployee.Department?.Name || '';
            this.formData.emailCaNhan = selectedEmployee.Employee.EmailCaNhan || '';
            this.formData.employeePhone = selectedEmployee.Employee.SDTCaNhan || '';
        }
        this.saveCurrentTabFormData();
    }
    onCustomerChange(customerId: number): void {
        const selectedCustomer = this.customers.find(cust => cust.ID === customerId);
        console.log("Customer đã chọn: ", selectedCustomer);
        if (selectedCustomer) {
            this.formData.customerId = selectedCustomer.ID;
            this.formData.customerName = selectedCustomer.CustomerName;
            this.formData.customerAddress = selectedCustomer.Address || '';
            this.formData.customerContact = selectedCustomer.ContactPerson || '';
            this.formData.customerPhone = selectedCustomer.Phone || '';
        }
        this.saveCurrentTabFormData();
    }
    // Hàm chuyển tab 
    switchTab(index: number): void {
        // Lưu form data và dữ liệu bảng của tab hiện tại
        this.saveCurrentTabFormData();
        if (this.table) {
            const currentTableData = this.table.getData();
            if (this.activeTabIndex >= 0 && this.activeTabIndex < this.tabFormData.length) {
                this.tabFormData[this.activeTabIndex].tableData = currentTableData;
            }
        }

        // Chuyển sang tab mới
        this.activeTabIndex = index;
        this.currentTabData = this.groupedData[index];

        // Load form data của tab mới
        this.loadTabFormData(index);

        // Cập nhật dữ liệu bảng
        if (this.currentTabData) {
            // Kiểm tra xem có dữ liệu đã lưu của tab này không
            const savedTableData = this.tabFormData[index]?.tableData;
            if (savedTableData) {
                this.details = savedTableData;
            } else {
                this.details = this.currentTabData.items || [];
                // Cập nhật POCode cho dữ liệu details
                if (this.products.length > 0) {
                    this.details = this.updateDetailsWithPOCode(this.details);
                }
            }
            // Cập nhật bảng với dữ liệu mới
            if (this.table) {
                this.table.setData(this.details);
            }
        }
    }
    onFormChange(): void {
        // Tự động lưu khi có thay đổi
        this.saveCurrentTabFormData();
    }
    //#endregion
    //#region Xử lý dữ liệu 
    validateForm(): boolean {
        if (this.formData.dateMinutes < 0) {
            alert('Xin hãy chọn ngày nhập.');
            return false;
        }
        if (!this.formData.employeeName) {
            alert('Xin hãy chọn nhân viên.');
            return false;
        }
        if (!this.formData.employeePhone) {
            alert('Xin hãy nhập số điện thoại nhân viên.');
            return false;
        }
        if (!this.formData.emailCaNhan) {
            alert('Xin hãy nhập email nhân viên.');
            return false;
        }
        if (!this.formData.customerId) {
            alert('Xin hãy chọn khách hàng.');
            return false;
        }
        if (!this.formData.customerContact) {
            alert('Xin hãy nhập liên hệ khách hàng.');
            return false;
        }
        if (!this.formData.customerPhone) {
            alert('Xin hãy nhập số điện thoại khách hàng');
            return false;
        }
        if (!this.formData.customerAddress) {
            alert('Xin hãy nhập địa chỉ khách hàng');
            return false;
        }
        if (!this.formData.receiver) {
            alert('Xin hãy điền người nhận');
            return false;
        }
        if (!this.formData.receiverPhone) {
            alert('Xin hãy điền số điện thoại người nhận');
            return false;
        }
        if (!this.formData.adminWarehouse) {
            alert('Xin hãy điền thủ kho');
            return false;
        }
        return true;
    }
    // Hàm tạo form data mặc định
    getDefaultFormData(): any {
        return {
            dateMinutes: new Date().toISOString().split('T')[0],
            employeeName: null,
            employeePhone: '',
            emailCaNhan: '',
            departmentName: '',
            customerId: null,
            customerName: null,
            customerContact: '',
            customerPhone: '',
            customerAddress: '',
            receiver: '',
            receiverPhone: '',
            adminWarehouse: null
        };
    }
    saveCurrentTabFormData(): void {
        if (this.activeTabIndex >= 0 && this.activeTabIndex < this.tabFormData.length) {
            this.tabFormData[this.activeTabIndex] = { ...this.formData };
        }
    }

    // Load form data từ tab
    loadTabFormData(tabIndex: number): void {
        if (tabIndex >= 0 && tabIndex <= this.tabFormData.length) {
            this.formData = { ...this.tabFormData[tabIndex] };
        }
    }
    // Khởi tạo form data cho từng tab
    initializeTabFormData(): void {
        this.tabFormData = [];
        for (let i = 0; i < this.groupedData.length; i++) {
            const defaultForm = this.getDefaultFormData();
            // Lấy CustomerID từ items
            const customerId = this.groupedData[i].items.find((item: any) => item.CustomerID)?.CustomerID;
            if (customerId) {
                defaultForm.customerId = customerId;
                // Tìm thông tin chi tiết khách hàng từ mảng customers
                const customerDetail = this.customers.find(c => c.ID === customerId);
                if (customerDetail) {
                    defaultForm.customerName = customerDetail.CustomerName;
                    defaultForm.customerAddress = customerDetail.Address || '';
                    defaultForm.customerContact = customerDetail.ContactEmail || '';
                    defaultForm.customerPhone = customerDetail.ContactPhone || '';
                }
            }
            // Set employee information if available
            defaultForm.employeeName = this.groupedData[i].employeeName;
            this.tabFormData.push(defaultForm);
        }
    }
    //#endregion
    //#region Hàm xử lý POCode
    // Hàm lấy POCode từ POKHDetailID
    getPOCodeByDetailID(pokhDetailId: number): string {
        const product = this.products.find((p: any) => p.POKHDetailID == pokhDetailId);
        return product ? product.POCode : '';
    }

    // Hàm cập nhật dữ liệu với POCode
    updateDetailsWithPOCode(details: any[]): any[] {
        return details.map(detail => ({
            ...detail,
            POCode: this.getPOCodeByDetailID(detail.POKHDetailID)
        }));
    }

    // Hàm cập nhật bảng với POCode
    updateTableWithPOCode(): void {
        if (this.table && this.details.length > 0) {
            const updatedDetails = this.updateDetailsWithPOCode(this.details);
            this.details = updatedDetails;
            this.table.setData(updatedDetails);
        }
    }
    //#endregion

    // Thêm hàm kiểm tra tab đã được lưu chưa
    isTabSaved(tabIndex: number): boolean {
        return this.savedTabs.has(tabIndex);
    }
} 