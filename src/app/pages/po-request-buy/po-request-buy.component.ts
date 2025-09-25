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
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator, RowComponent, CellComponent, CellComponent as TabulatorCell } from 'tabulator-tables';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { PokhService } from '../pokh/pokh-service/pokh.service';
import { PoRequestBuyService } from './po-request-buy/po-request-buy.service';
@Component({
  selector: 'app-po-request-buy',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
  ],
  templateUrl: './po-request-buy.component.html',
  styleUrl: './po-request-buy.component.css'
})
export class PoRequestBuyComponent implements OnInit, AfterViewInit {
  @ViewChild('dataTable', { static: false }) dataTableElement!: ElementRef;

  private dataTable!: Tabulator;

  @Input() pokhId!: number;

  constructor(
    private pokhService: PokhService,
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private PoRequestBuyService: PoRequestBuyService,

  ) { }

  dataDepartment: any[] = [];
  dataEmployee: any[] = [];
  gridData: any[] = [];

  selectedDepartment: any;
  selectedEmployee: any;
  dateRequest: Date = new Date();
  dateReturnExpected: Date = new Date();
  selectedRows: any[] = [];


  ngOnInit(): void {
    this.loadDepartment();
    this.loadEmployee();
    this.loadPOKHProducts(this.pokhId, 0);
  }
  ngAfterViewInit(): void {
    this.initDataTable();
  }
  closeModal(): void {
    this.activeModal.close();
  }
  loadPOKHProducts(id: number = 0, idDetail: number = 0): void {
    this.pokhService.getPOKHProduct(id, idDetail).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const gridData = response.data;
          this.dataTable.setData(gridData);
        } else {
          this.notification.error('Thông báo', 'Lỗi khi tải chi tiết POKH: ' + response.message);
        }
      },
      error: (error) => {
        this.notification.error('Thông báo', 'Lỗi kết nối khi tải chi tiết POKH: ' + error);
      }
    });
  }
  loadEmployee(status: number = 0): void {
    this.PoRequestBuyService.getEmployees(status).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataEmployee = response.data;
        } else {
          this.notification.error('Thông báo', 'Lỗi khi tải Employees: ' + response.message);
        }
      },
      error: (error) => {
        this.notification.error('Thông báo', 'Lỗi kết nối khi tải Employees: ' + error);
      }
    });
  }
  loadDepartment(): void {
    this.PoRequestBuyService.getDepartments().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataDepartment = response.data;
        } else {
          this.notification.error('Thông báo', 'Lỗi khi tải Departments: ' + response.message);
        }
      },
      error: (error) => {
        this.notification.error('Thông báo', 'Lỗi kết nối khi tải Departments: ' + error);
      }
    });
  }
  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach(item => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach(item => {
      const node = map.get(item.ID);
      if (item.ParentID === 0) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }
  onEmployeeChange(event: any): void {
    const item = this.dataEmployee.find(x=>x.ID === event);
    if(!item) return;
    const department = this.dataDepartment.find(x=>x.ID === item.DepartmentID);
    if(department) {
      this.selectedDepartment = department.ID;
    }
  }
  saveData(): void {
    if (!this.selectedEmployee) {
      this.notification.error('Thông báo', 'Vui lòng chọn người yêu cầu!');
      return;
    }
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }
    // Chuẩn bị dữ liệu gửi lên API
    const requestData = this.selectedRows.map(row => ({
      EmployeeID: this.selectedEmployee,
      ProductCode: row.ProductCode,
      ProductName: row.ProductName,
      DateRequest: this.dateRequest,
      DateReturnExpected: this.dateReturnExpected,
      Quantity: row.QuantityRequestRemain,
      Note: row.Note,
      ProductSaleID: row.ProductID,
      ProductGroupID: row.ProductGroupID,
      CurrencyID: row.CurrencyID || 0,
      CurrencyRate: row.CurrencyRate || 0,
      TotalPrice: row.IntoMoney,
      VAT: row.VAT,
      TotaMoneyVAT: row.TotalPriceIncludeVAT,
      POKHDetailID: row.ID,
      UnitName: row.Unit,
      DateReceive: row.DeliveryRequestedDate,
      
    }));
    this.PoRequestBuyService.saveData(requestData).subscribe({
      next: (res) => {
        if (res && res.status === 1) {
          this.notification.success('Thông báo', 'Lưu yêu cầu mua hàng thành công!');
          this.closeModal();
        } else {
          this.notification.error('Thông báo', res?.message || 'Lưu thất bại!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu dữ liệu!');
      }
    });
  }
  initDataTable(): void {
    this.dataTable = new Tabulator(this.dataTableElement.nativeElement, {
      data: this.gridData,
      layout: "fitDataFill",
      movableColumns: true,
      pagination: true,
      height: "78vh",
      resizableRows: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false
      },
      columns: [
        {
          title: "",
          formatter: "rowSelection",
          titleFormatter: (cell: any, formatterParams: any, onRendered: any) => {
            // Tạo custom header checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.style.marginRight = "5px";
            // Event listener cho header checkbox
            checkbox.addEventListener("change", (e) => {
              const target = e.target as HTMLInputElement;
              if (target.checked) {
                this.selectAllRows();
              } else {
                this.deselectAllRows();
              }
            });
            return checkbox;
          },
          hozAlign: "center",
          headerSort: false,
          frozen: true,
          width: 100,
          cellClick: (e, cell) => {
            // Logic chọn dòng đơn lẻ (bình thường, không tree)
            const row = cell.getRow();
            const rowData = row.getData();
            const isCurrentlySelected = row.isSelected();
            if (isCurrentlySelected) {
              row.deselect();
              this.selectedRows = this.selectedRows.filter(r => r["ID"] !== rowData["ID"]);
            } else {
              row.select();
              if (!this.selectedRows.some(r => r["ID"] === rowData["ID"])) {
                this.selectedRows.push(rowData);
              }
            }
            // Cập nhật trạng thái header checkbox
            this.updateHeaderCheckbox();
            console.log('Selected Rows:', this.selectedRows);
          }
        },
        { title: 'Mã nội bộ', field: 'ProductNewCode', sorter: 'number', width: 100, },
        { title: 'Mã sản phẩm', field: 'ProductCode', sorter: 'number', width: 100, },
        { title: 'Tên sản phẩm', field: 'ProductName', sorter: 'number', width: 100, },
        { title: 'Hãng', field: 'Maker', sorter: 'number', width: 100, },
        { title: 'Mã theo khách', field: 'GuestCode', sorter: 'number', width: 100, },
        { title: 'Số lượng PO', field: 'Qty', sorter: 'number', width: 100, },
        { title: 'SL đã yêu cầu', field: 'QuantityRequest', sorter: 'number', width: 100, },
        { title: 'SL yêu cầu', field: 'QuantityRequestRemain', sorter: 'number', width: 100, },
        { title: 'CurrencyRate', field: 'CurrencyRate', sorter: 'number', width: 100, editor: "input" },
        { title: 'CurrencyID', field: 'CurrencyID', sorter: 'number', width: 100, editor: "input" },
        { title: 'Kích thước phim cắt', field: 'FilmSize', sorter: 'number', width: 100, },
        { title: 'ĐVT', field: 'Unit', sorter: 'number', width: 80, },
        {
          title: 'Đơn giá trước VAT', field: 'UnitPrice', sorter: 'number', width: 100, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
        },
        {
          title: 'Tổng tiền trước VAT', field: 'IntoMoney', sorter: 'number', width: 100, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
        },
        { title: 'VAT(%)', field: 'VAT', sorter: 'number', width: 100, },
        {
          title: 'Tổng tiền sau VAT', field: 'TotalPriceIncludeVAT', sorter: 'number', width: 100, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
        },
        { title: 'Người nhận', field: 'UserReceiver', sorter: 'number', width: 100, },
        { title: 'Ngày y/c giao hàng', field: 'DeliveryRequestedDate', sorter: 'number', width: 100, },
        { title: 'Ngày giao hàng thực tế', field: 'ActualDeliveryDate', sorter: 'number', width: 100, },
        { title: 'Thanh toán dự kiến', field: 'EstimatedPay', sorter: 'number', width: 100, },
        { title: 'Ngày tiền về', field: 'RecivedMoneyDate', sorter: 'number', width: 100, },
        { title: 'Ngày hóa đơn', field: 'BillDate', sorter: 'number', width: 100, },
        { title: 'Số hóa đơn', field: 'BillNumber', sorter: 'number', width: 100, },
        { title: 'Công nợ', field: 'Debt', sorter: 'number', width: 100, },
        { title: 'Ngày y/c thanh toán', field: 'PayDate', sorter: 'number', width: 100, },
        { title: 'Nhóm', field: 'GroupPO', sorter: 'number', width: 100, },
        { title: 'Ghi chú', field: 'Note', sorter: 'number', width: 100, },
      ],
    });
    // Lắng nghe sự kiện rowSelectionChanged để đồng bộ selectedRows
    this.dataTable.on('rowSelectionChanged', (data: any[]) => {
      this.selectedRows = data;
      this.updateHeaderCheckbox();
      console.log('Selected Rows (rowSelectionChanged):', this.selectedRows);
    });
  }
  
  private selectAllRows(): void {
    // Lấy tất cả các rows từ Tabulator (chỉ các dòng hiện tại, không tree)
    const allRows = this.dataTable.getRows();
    this.selectedRows = [];
    allRows.forEach(row => {
      row.select();
      const rowData = row.getData();
      if (!this.selectedRows.some(r => r["ID"] === rowData["ID"])) {
        this.selectedRows.push(rowData);
      }
    });
    console.log('All Selected Rows:', this.selectedRows);
  }

  private deselectAllRows(): void {
    // Bỏ chọn tất cả
    this.dataTable.deselectRow();
    this.selectedRows = [];
    console.log('All Deselected');
  }

  private updateHeaderCheckbox(): void {
    // Cập nhật trạng thái của header checkbox dựa trên số dòng đã chọn
    setTimeout(() => {
      const headerCheckbox = this.dataTableElement.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (headerCheckbox) {
        const totalRows = this.dataTable.getRows().length;
        const selectedCount = this.selectedRows.length;
        if (selectedCount === 0) {
          headerCheckbox.checked = false;
          headerCheckbox.indeterminate = false;
        } else if (selectedCount === totalRows) {
          headerCheckbox.checked = true;
          headerCheckbox.indeterminate = false;
        } else {
          headerCheckbox.checked = false;
          headerCheckbox.indeterminate = true;
        }
      }
    }, 10);
  }
}
