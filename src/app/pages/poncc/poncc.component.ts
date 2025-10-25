import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PonccService } from './service/poncc.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorTableSingleComponent } from './../tabulator-table/tabulator-tables.component';
import { ColumnDefinition } from 'tabulator-tables';
import { PonccDetailComponent } from './poncc-detail/poncc-detail.component';
@Component({
  selector: 'app-poncc',
  templateUrl: './poncc.component.html',
  styleUrls: ['./poncc.component.css'],
  standalone: true,
  imports: [
    TabulatorTableSingleComponent,
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
  ],
})

export class PonccComponent implements OnInit {

  constructor() { }
  filters: any = {};
  dataPoNccDetail: any[] = [];
  dataEmployee: any[] = [];
  dataSupplierSale: any[] = [];
  sizeSearch: string = '0';
  modalService = inject(NgbModal);
  ponccService = inject(PonccService);
  dataSelected: any[] = [];
  apiUrlPoNcc: string = this.ponccService.getApiUrlPoNcc();

  @ViewChild(TabulatorTableSingleComponent) tableComp!: TabulatorTableSingleComponent;

  ngOnInit() {
    this.filters =
    {
      Keywords: '',
      DateStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      DateEnd: new Date().toISOString(),
      EmployeeID: 0,
      SupplierSaleID: 0,
      Status: 0
      // Page: 1,
      // Size: 30
    }
    // this.getPonCC();
    this.getEmployee(0);
    this.getSupplierSale();
  }
  columnsdetail: ColumnDefinition[] = [
    { title: 'STT', field: 'STT' },
    { title: 'Mã sản phẩm', field: 'ProductCode' },
    { title: 'Tên sản phẩm', field: 'ProductName' },
    { title: 'Mã nội bộ', field: 'ProductNewCode' },
    { title: 'Tên nhóm', field: 'ProductGroupName' },
    { title: 'Mã sản phẩm NCC', field: 'ProductCodeOfSupplier' },
    { title: 'Mã dự án', field: 'ProjectCode' },
    { title: 'Tên dự án', field: 'ProjectName' },
    { title: 'ĐVT', field: 'Unit' },
    { title: 'SL yêu cầu', field: 'QtyRequest' },
    { title: 'SL trả về', field: 'QuantityReturn' },
    { title: 'Đơn giá', field: 'UnitPrice' },
    { title: 'Thành tiền', field: 'ThanhTien' },
    { title: '% VAT', field: 'VAT' },
    { title: 'Tổng tiền VAT', field: 'VATMoney' },
    { title: '% Chiết khấu', field: 'DiscountPercent' },
    { title: 'Chiết khấu', field: 'Discount' },
    { title: 'Phí vận chuyển', field: 'FeeShip' },
    { title: 'Tổng tiền', field: 'TotalPrice' },
    { title: 'Tổng tiền quy đổi (VNĐ)', field: 'CurrencyExchange' },
    { title: 'Deadline giao hàng', field: 'DeadlineDelivery' },
    { title: 'Ngày về dự kiến', field: 'ExpectedDate' },
    { title: 'Ngày về thực tế', field: 'ActualDate' },
    { title: 'Giá bán', field: 'PriceSale' },
    { title: 'Giá lịch sử', field: 'PriceHistory' },
    { title: 'Giá chào thầu', field: 'BiddingPrice' },
    { title: 'Diễn giải', field: 'Note' },
  ]
  columns: ColumnDefinition[] = [
    {
      title: 'Duyệt', field: 'IsApproved', width: 70, headerSort: false, hozAlign: "center",
      formatter: function (cell) {
        let value = cell.getValue();
        return value
          ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
          : "<input type='checkbox' readonly style='pointer-events:none'>";
      }
    },
    { title: 'Trạng thái', field: 'StatusText', width: 120 },
    { title: 'Ngày PO', field: 'RequestDate', width: 120 },
    { title: 'Ngày giao hàng', field: 'DeliveryDate', width: 150 },
    { title: 'Số PO', field: 'POCode', width: 150 },
    { title: 'Số đơn hàng', field: 'BillCode', width: 150 },
    { title: 'Tổng tiền', field: 'TotalMoneyPO', width: 150, hozAlign: "right", formatter: "money", formatterParams: { thousand: ",", precision: 0, symbol: "₫", symbolAfter: " " } },
    { title: 'Loại tiền', field: 'CurrencyText', width: 150 },
    { title: 'Tỷ giá', field: 'CurrencyRate', width: 120 },
    { title: 'Nhà cung cấp', field: 'NameNCC', width: 300 },
    { title: 'Nhân viên mua', field: 'FullName', width: 150 },
    {
      title: 'Công nợ', field: 'DeptSupplier', width: 150, headerSort: false, hozAlign: "center",
      formatter: function (cell) {
        let value = cell.getValue();
        return value
          ? "<input type='checkbox' checked readonly style='pointer-events:none'>"
          : "<input type='checkbox' readonly style='pointer-events:none'>";
      }
    },
    { title: 'Bank Charge', field: 'BankCharge', width: 150 },
    { title: 'Điều khoản thanh toán', field: 'RulePayName', width: 150 },
    { title: 'Công ty', field: 'CompanyText', width: 150 },
    { title: 'Fedex Account', field: 'FedexAccount', width: 150 },
    { title: 'Điều khoản Incoterm', field: 'RuleIncoterm', width: 150 },
    { title: 'NCC xử lý chứng từ', field: 'SupplierVoucher', width: 150 },
    { title: 'Chỉ tiêu đơn hàng', field: 'OrderTargets', width: 150 },
    { title: 'Xuất xứ hàng hóa', field: 'OriginItem', width: 150 },
    { title: 'Diễn giải', field: 'Note', width: 150 },
    { title: 'Loại PO', field: 'POTypeText', width: 150 },
    { title: 'ID', field: 'ID', width: 150, visible: false },
    { title: 'Status', field: 'Status', width: 150, visible: false },
  ]

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  getPoNccDetail(poID: number) {
    this.ponccService.getPonccDetail(poID).subscribe({
      next: (res) => {
        this.dataPoNccDetail = res.data;  // gán vào tableData
      },
      error: (err) => {
        console.error('Lỗi khi load PonCC', err);
      }
    });
  }
  getEmployee(status: number) {
    this.ponccService.getEmployee(status).subscribe({
      next: (res) => {
        this.dataEmployee = res.data;  // gán vào tableData
      },
      error: (err) => {
        console.error('Lỗi khi load PonCC', err);
      }
    });
  }
    getSupplierSale() {
    this.ponccService.getSupplierSale().subscribe({
      next: (res) => {
        this.dataSupplierSale = res.data;  // gán vào tableData
      },
      error: (err) => {
        console.error('Lỗi khi load PonCC', err);
      }
    });
  }
  filter(){
    this.tableComp.reloadData(this.filters);
  }
  onRowsSelected(selectedRows: any[]) {
    console.log("Các dòng được chọn:", selectedRows);
    this.dataSelected = selectedRows;
    if (this.dataSelected.length > 0) {
      const poID = this.dataSelected[this.dataSelected.length - 1].ID;
      this.getPoNccDetail(poID);
    }
    else {
      this.dataPoNccDetail = [];
    }
  }
  onRowsDoubleClick(selectedRows: any[]) {
    this.openTrainingFormModal(selectedRows[0]);
  }
  handleAction(type: string) {
    if (type == "create") {
      this.openTrainingFormModal(null);
    }
  }
  openTrainingFormModal(selectedData: any) {
    // Mở modal
    const modalRef = this.modalService.open(PonccDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      modalDialogClass: 'modal-fullscreen modal-dialog-scrollable'
    });

    // Truyền dữ liệu vào modal (nếu sửa)
    modalRef.componentInstance.dataInput = selectedData || [];

    // Xử lý kết quả trả về từ modal
    modalRef.result.then(
      (result) => {
        // this.getData();
        console.log('Modal closed with:', result);
        // Refresh danh sách hoặc xử lý sau khi lưu
      },
      (reason) => {

        console.log('Modal dismissed with:', reason);
        // Xử lý khi modal bị hủy
      }
    );
  }
  // Thêm phương thức này vào component
  getCustomAjaxConfig() {
    return {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.filters),
      credentials: 'same-origin'
    };
  }
}
