import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input, IterableDiffers } from '@angular/core';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { PokhService } from '../../../pokh/pokh-service/pokh.service';
import { CustomerPartService } from '../../../customer-part/customer-part/customer-part.service';
import { TradePriceService } from '../trade-price/trade-price/trade-price.service';
import { RequestInvoiceDetailService } from '../../../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
@Component({
  standalone: true,
  selector: 'app-trade-price-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
  ],
  templateUrl: './trade-price-detail.component.html',
  styleUrl: './trade-price-detail.component.css'
})
export class TradePriceDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;

  private tb_Detail!: Tabulator;

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private customerPartService: CustomerPartService,
    private tradePriceService: TradePriceService,
    private RIDService: RequestInvoiceDetailService,
    private pokhService: PokhService,
  ) { }

  nextRowId: number = 0;
  selectedRow: any = null;
  formCustomerData: any[] = [];
  formProjectData: any[] = [];
  formAdminSaleAndEmployeesData: any[] = [];
  cboProductSale: any[] = [];
  cboCurrency: any[] = [];
  cboUnitCount: any[] = [];
  customers: any[] = [];
  dataDetail: any[] = [];
  radioValue: boolean = true;
  currencyRate: number = 0;

  // Form data
  formData: any = this.getDefaultFormData();

  rateCOM: number = 0; // Tỷ lệ COM
  quantityRTCVision: number = 0; // Số lượng RTC Vision
  unitPriceRTCVision: number = 0; // Đơn giá RTC Vision

  closeModal(): void {
    this.activeModal.close();
  }

  ngOnInit(): void {
    this.loadAllData();
  }
  ngAfterViewInit(): void {

  }
  loadAllData() {
    forkJoin({
      customer: this.customerPartService.getCustomer(),
      employees: this.tradePriceService.getEmployees(0),
      project: this.RIDService.loadProject(),
      productSale: this.RIDService.loadProductSale(),
      unitCount: this.tradePriceService.getUnitCount(),
      currency: this.pokhService.getCurrency(),
    }).subscribe({
      next: (results) => {
        this.formCustomerData = results.customer.data;
        this.formAdminSaleAndEmployeesData = results.employees.data;
        this.formProjectData = results.project.data;
        this.cboProductSale = results.productSale.data;
        this.cboUnitCount = results.unitCount.data;
        this.cboCurrency = results.currency.data;
        console.log("cboCurrency", this.cboCurrency)

        this.initDetailTable();
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }

  onCustomerChange(id: number): void {
    const selectedCustomer = this.formCustomerData.find(customer => customer.ID === id);
    if (selectedCustomer) {
      this.formData.customerName = selectedCustomer.CustomerName;
    } else {
      this.formData.customerName = '';
    }
  }
  onProjectChange(id: number): void {
    const selectedProject = this.formProjectData.find(project => project.ID === id);
    if (selectedProject) {
      this.formData.projectName = selectedProject.ProjectName;
    } else {
      this.formData.projectName = '';
    }
  }
  // Hàm tạo form data mặc định
  getDefaultFormData(): any {
    return {
      customerId: null,
      projectId: null,
      employeeId: null,
      saleAdminId: null,
      customerName: '',
      projectName: '',
      UnitPriceDelivery: 0,
      QuantityDelivery: 0,
    };
  }

  private toDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = parseFloat(value.toString());
    return isNaN(num) ? 0 : num;
  }

  // Main calculation function
  calculator(row: any): void {
    // Get values from the row
    const currencyRate = this.toDecimal(row.CurrencyRate); // Tỷ giá
    const rateCOM = this.toDecimal(this.rateCOM); // Tỷ lệ COM
    const quantityRTCVision = this.toDecimal(this.quantityRTCVision); // Số lượng RTC Vision
    const unitPriceRTCVision = this.toDecimal(this.unitPriceRTCVision); // Đơn giá RTC Vision

    const quantity = this.toDecimal(row.Quantity); // Số lượng
    const unitPriceImportEXW = this.toDecimal(row.UnitImportPriceUSD); // Đơn giá nhập EXW (USD)

    const bankCharge = this.toDecimal(row.BankCharge); // Phí ngân hàng
    const protectiveTariff = this.toDecimal(row.ProtectiveTariff); // Thuế nhập khẩu (%)
    const feeShipPcs = this.toDecimal(row.FeeShipPcs); // Phí vận chuyển /1pcs
    const ortherFees = this.toDecimal(row.OrtherFees); // Phí vận chuyển,HCHQ, CO, MSDS,vv bảo hiểm
    const customFees = this.toDecimal(row.CustomFees); // Phí khai HQ
    const totalPriceLabor = this.toDecimal(row.TotalPriceLabor); // Giá báo nhân công

    const totalImport = quantity * unitPriceImportEXW; // Tổng giá nhập 
    const unitImportPriceVND = unitPriceImportEXW * currencyRate; // Đơn giá nhập chưa chi phí (VND)
    const totalImportPriceVND = unitImportPriceVND * quantity; // Tổng giá nhập chưa Chi phí(VND)
    const protectiveTariffPerPcs = protectiveTariff * (unitImportPriceVND + feeShipPcs); // Thuế nhập khẩu /1pcs(VND)
    const totalProtectiveTariff = protectiveTariff * quantity; // Tổng thuế nhập khẩu
    const totalImportPriceIncludeFees = this.toDecimal(row.TotalImportPriceIncludeFees); // Tổng giá nhập chưa VAT
    const unitPriceIncludeFees = totalImportPriceVND !== 0 ? totalImportPriceIncludeFees / totalImportPriceVND * unitImportPriceVND : 0; // Đơn giá về kho

    let unitPriceExpectCustomer = this.toDecimal(row.UnitPriceExpectCustomer); // Đơn giá dự kiến báo khách
    const margin = this.toDecimal(row.Margin); // Margin

    if (margin > 0) {
      unitPriceExpectCustomer = Math.round((margin * unitPriceIncludeFees) * 10) / 10;
    }
    else if (unitPriceExpectCustomer > 0) {
      const calculatedMargin = unitPriceIncludeFees === 0 ? 0 : unitPriceExpectCustomer / unitPriceIncludeFees;
      row.Margin = calculatedMargin;
    }

    const cmSet = (rateCOM * unitPriceExpectCustomer) / 100; // CM/set
    const totalPriceExpectCustomer = unitPriceExpectCustomer * quantity; // Tổng đơn hàng
    const profit = totalPriceExpectCustomer - totalImportPriceIncludeFees; // Lợi nhuận
    const profitPercent = totalPriceExpectCustomer !== 0 ? (profit / totalPriceExpectCustomer) * 100 : 0; // Tỷ lệ lợi nhuận
    const totalPriceRTCVision = (unitPriceRTCVision + (unitPriceRTCVision * rateCOM)) * quantityRTCVision; // Giá báo RTC Vision Software
    const totalPrice = totalPriceExpectCustomer + totalPriceLabor + totalPriceRTCVision; // Tổng giá trị đầu ra đơn hàng

    //Điền dữ liệu vào bảng
    row.TotalImportPriceUSD = totalImport;
    row.UnitImportPriceVND = unitImportPriceVND;
    row.TotalImportPriceVND = totalImportPriceVND;
    row.ProtectiveTariffPerPcs = protectiveTariffPerPcs;
    row.TotalProtectiveTariff = totalProtectiveTariff;
    row.TotalImportPriceIncludeFees = totalImportPriceIncludeFees;
    row.UnitPriceIncludeFees = unitPriceIncludeFees;
    row.CMPerSet = cmSet;
    row.UnitPriceExpectCustomer = unitPriceExpectCustomer;
    row.TotalPriceExpectCustomer = totalPriceExpectCustomer;
    row.Profit = profit;
    row.ProfitPercent = profitPercent;
    row.TotalPriceRTCVision = totalPriceRTCVision;
    row.TotalPrice = totalPrice;

    //Cập nhật dữ liệu vào bảng
    this.tb_Detail.updateData([row]);
  }

  // Tính toán tất cả dữ liệu
  calculateAll(): void {
    const data = this.tb_Detail.getData();
    data.forEach(row => {
      this.calculator(row);
    });

  }

  // Xử lý sự kiện sửa dữ liệu
  onCellEdited(cell: any): void {
    const row = cell.getRow().getData();
    this.calculator(row);
    if (cell.getColumn().getField() === "CurrencyCode") {
      const selectedCurrency = this.cboCurrency.find(p => p.Code === cell.getValue());
      let dateNow = new Date();
      console.log("Dữ liệu của Currency đã nhận: ", selectedCurrency)
      
      if (this.radioValue === true) {
        this.currencyRate = selectedCurrency.CurrencyRateOfficialQuota;
        if (selectedCurrency.DateExpriedOfficialQuota < dateNow.toISOString() ) //Expired
        {
          this.notification.error("Lỗi", `Tỷ giá chính ngạch của ${selectedCurrency.Code} đã hết hạn`)
          this.currencyRate = 0;
        }
      }
      else {   
        this.currencyRate = selectedCurrency.CurrencyRateUnofficialQuota;
        if (selectedCurrency.DateExpriedUnofficialQuota < dateNow.toISOString() ) //Expired
        {
          this.notification.error("Lỗi", `Tỷ giá tiểu ngạch của ${selectedCurrency.Code} đã hết hạn`)
          this.currencyRate = 0;
        }
      }
      const row = cell.getRow();
      row.update({
        CurrencyRate: this.currencyRate
      })
    }
    this.calculatorBankCharge();
  }

  // Tính toán phí ngân hàng
  calculatorBankCharge(): void {
    // Lấy giá trị từ form hoặc biến
    const unitPriceDelivery = this.toDecimal(this.formData.UnitPriceDelivery);
    const quantityDelivery = this.toDecimal(this.formData.QuantityDelivery);

    // Tính tổng TotalImportPriceVND của tất cả các dòng
    const data = this.tb_Detail.getData();
    const sumTotalImportPriceVND = data.reduce((sum, row) => sum + this.toDecimal(row.TotalImportPriceVND), 0);

    // Tính phí ngân hàng
    const bankCharge = unitPriceDelivery * quantityDelivery + (0.002 * sumTotalImportPriceVND);

    // Gán giá trị bankCharge cho tất cả các dòng
    data.forEach(row => {
      row['BankCharge'] = bankCharge;
    });

    // Cập nhật lại bảng
    this.tb_Detail.replaceData(data);
  }

  // Tính toán tổng giá nhập
  calculatorTotalImport(): void {
    // Implementation for total import calculation
    // This would depend on your specific business logic
  }

  // Tính toán tổng giá
  calculateTotal(): void {
    // Implementation for total calculation
    // This would depend on your specific business logic
  }
  addNewRow(): void {
    this.nextRowId = this.nextRowId - 1;
    const newRow = {
      STT: this.dataDetail.length + 1,
      Maker: '',
      ProductName: '',
      ProductCode: '',
      ProductCodeCustomer: '',
      Quantity: 0,
      UnitCountID: '',
      UnitImportPriceUSD: 0,
      CurrencyCode: '',
      CurrencyRate: 0,
      BankCharge: 0,
      ProtectiveTariff: 0,
      FeeShipPcs: 0,
      OrtherFees: 0,
      CustomFees: 0,
      TotalPriceLabor: 0,
      Margin: 0,
      UnitPriceExpectCustomer: 0,
      LeadTime: '',
      Note: '',
      //
      TotalImportPriceUSD: 0,
      UnitImportPriceVND: 0,
      TotalImportPriceVND: 0,
      ProtectiveTariffPerPcs: 0,
      TotalProtectiveTariff: 0,
      TotalImportPriceIncludeFees: 0,
      UnitPriceIncludeFees: 0,
      CMPerSet: 0,
      TotalPriceExpectCustomer: 0,
      Profit: 0,
      ProfitPercent: 0,
      TotalPriceRTCVision: 0,
      TotalPrice: 0,
      UnitPricePerCOM: 0,
      _children: []
    };

    if (this.tb_Detail) {
      this.tb_Detail.addRow(newRow);
    } else {
      this.dataDetail.push(newRow);
    }
  }

  addChildRow(): void {
    if (!this.selectedRow) {
      this.notification.warning('Thông báo', "Vui lòng chọn một sản phẩm trước khi thêm sản phẩm con!");
      return;
    }

    // Kiểm tra xem row được chọn có phải là row cha (level 0) hay không
    const selectedData = this.selectedRow.getData();
    const parentRow = this.selectedRow.getTreeParent();

    // Nếu row được chọn đã có parent (tức là nó là row con), thì không cho phép thêm con
    if (parentRow) {
      this.notification.warning('Thông báo', "Chỉ có thể thêm sản phẩm con cho sản phẩm cha (cấp 1). Sản phẩm con không thể có sản phẩm con!");
      return;
    }

    this.nextRowId = this.nextRowId - 1;
    const childRow = {
      STT: selectedData._children.length + 1,
      ParentId: selectedData.ID,
      Maker: '',
      ProductName: '',
      ProductCode: '',
      ProductCodeCustomer: '',
      Quantity: 0,
      UnitCountID: '',
      UnitImportPriceUSD: 0,
      CurrencyCode: '',
      CurrencyRate: 0,
      BankCharge: 0,
      ProtectiveTariff: 0,
      FeeShipPcs: 0,
      OrtherFees: 0,
      CustomFees: 0,
      TotalPriceLabor: 0,
      Margin: 0,
      UnitPriceExpectCustomer: 0,
      LeadTime: '',
      Note: '',
      //
      TotalImportPriceUSD: 0,
      UnitImportPriceVND: 0,
      TotalImportPriceVND: 0,
      ProtectiveTariffPerPcs: 0,
      TotalProtectiveTariff: 0,
      TotalImportPriceIncludeFees: 0,
      UnitPriceIncludeFees: 0,
      CMPerSet: 0,
      TotalPriceExpectCustomer: 0,
      Profit: 0,
      ProfitPercent: 0,
      TotalPriceRTCVision: 0,
      TotalPrice: 0,
      UnitPricePerCOM: 0,
      _children: []
    };
    this.selectedRow.addTreeChild(childRow);
    this.selectedRow.treeExpand();
  }

  initDetailTable(): void {
    this.tb_Detail = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      height: "64vh",
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      dataTree: true,
      dataTreeStartExpanded: true,
      selectableRows: 1,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        formatter: "rowSelection",
        headerHozAlign: "center",
        hozAlign: "center",
        titleFormatter: "rowSelection",
        cellClick: (e, cell) => {
          e.stopPropagation();
        },
      },
      columns: [
        {
          title: "Tổng CM/Set",
          frozen: true,
          columns: [
            {
              title: "STT", field: "STT", width: 70, hozAlign: "center", resizable: true
            },
            {
              title: "Cụm", field: "Maker", width: 70, hozAlign: "center", resizable: true, editor: "input"
            },
            {
              title: "Tên sản phẩm",
              field: "ProductName",
              width: 150,
              resizable: true,
              variableHeight: true,
              editor: "input",

            },
          ]
        },
        {
          title: "EXW",
          columns: [
            {
              title: 'Chọn mã gốc',
              field: 'ProductCode',
              sorter: 'string',
              width: 120,
              editor: "list",
              tooltip: true,
              frozen: true,
              editorParams: {
                values: this.cboProductSale.map(product => {
                  const shortLabel = `${product.ProductNewCode} ${product.ProductCode}`
                  return {
                    label: shortLabel,
                    value: product.ProductCode,
                    id: product.ID
                  }
                }),
                autocomplete: true,
                listOnEmpty: true,
              },
            },
            {
              title: 'Nhập mã gốc',
              field: 'ProductCodeOrigin',
              sorter: 'string',
              width: 120,
              editor: "input",
              tooltip: true,
            },
          ]
        },
        {
          title: "Margin",
          columns: [
            { title: "Mã báo khách", field: "ProductCodeCustomer", width: 150, hozAlign: "center", resizable: true },
            {
              title: "Số lượng", field: "Quantity", width: 100, hozAlign: "center", resizable: true, editor: "number", formatter: "money",
              formatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              },
              bottomCalc: "sum",
              bottomCalcFormatter: "money",
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              }
            },
          ]
        },
        {
          title: `Lợi nhuận`,
          field: 'bandTotalProfit',
          columns: [
            {
              title: 'ĐVT',
              field: 'UnitCountID',
              width: 120,
              editor: "list",
              editorParams: {
                values: this.cboUnitCount.map(product => {
                  return {
                    label: product.UnitName,
                    value: product.UnitName,
                    id: product.ID
                  }
                }),
                autocomplete: true,
                listOnEmpty: true,
              },
            },
            {
              title: "Đơn giá nhập EXW", field: "UnitImportPriceUSD", width: 150, hozAlign: "center", resizable: true, editor: "number", formatter: "money",
              formatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              },
              bottomCalc: "sum",
              bottomCalcFormatter: "money",
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              }
            },
          ]
        },
        {
          title: "Tỷ lệ lợi nhuận",
          columns: [
            {
              title: 'Loại tiền',
              field: 'CurrencyCode',
              width: 120,
              editor: "list",
              editorParams: {
                values: this.cboCurrency.map(item => {
                  const shortLabel = `${item.Code} - ${item.NameVietNamese}`
                  return {
                    label: shortLabel,
                    value: item.Code,
                    id: item.ID
                  }
                }),
                autocomplete: true,
                listOnEmpty: true,
              },
            },
            { title: "Tỷ giá", field: "CurrencyRate", width: 150, hozAlign: "center", resizable: true },
          ]
        },
        {
          title: 'Tổng giá nhập', field: 'TotalImportPriceUSD', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá nhập chưa chi phí (VND)', field: 'UnitImportPriceVND', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá nhập chưa chi phí (VND)', field: 'TotalImportPriceVND', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí ngân hàng (VND)', field: 'BankCharge', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Thuế nhập khẩu (%)', field: 'ProtectiveTariff', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí vận chuyển / 1pcs', field: 'FeeShipPcs', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Thuế nhập khẩu/1pcs (VND)', field: 'ProtectiveTariffPerPcs', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng thuế nhập khẩu (VND)', field: 'TotalProtectiveTariff', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí vận chuyển, HCHQ, CO, MSDV, vv (VND)', field: 'OrtherFees', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí khai HQ (VND)', field: 'CustomFees', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá nhập chưa VAT (VND)', field: 'TotalImportPriceIncludeFees', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá về kho (Bao gồm chi phí)', field: 'UnitPriceIncludeFees', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'CM/Set', field: 'CMPerSet', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Margin', field: 'Margin', sorter: 'string', width: 150, editor: "number" },
        {
          title: 'Đơn giá dự kiến báo khách', field: 'UnitPriceExpectCustomer', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng đơn hàng', field: 'TotalPriceExpectCustomer', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Lợi nhuận', field: 'Profit', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tỷ lệ lợi nhuận', field: 'ProfitPercent', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Leadtime', field: 'LeadTime', sorter: 'string', width: 150 },
        {
          title: 'Giá báo nhân công', field: 'TotalPriceLabor', sorter: 'string', width: 150, editor: "number", formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Giá báo RTC Vision Software', field: 'TotalPriceRTCVision', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá trị đầu ra đơn hàng', field: 'TotalPrice', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá/Máy (Bao gồm nhân công và COM', field: 'UnitPricePerCOM', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 150 },
      ]
    });

    this.tb_Detail.on("rowClick", (e: any, row: RowComponent) => {
      this.selectedRow = row;
      console.log("selectedRow", this.selectedRow);
      console.log("_children: ", this.selectedRow.getData()['_children']);
    });

    // Add event handlers after table initialization
    this.tb_Detail.on('cellEdited', (cell: any) => {
      this.onCellEdited(cell);
    });
  }
}
