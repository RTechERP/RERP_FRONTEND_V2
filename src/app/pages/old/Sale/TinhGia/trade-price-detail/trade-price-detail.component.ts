import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
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
import { pl_PL } from 'ng-zorro-antd/i18n';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
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
  styleUrl: './trade-price-detail.component.css',
})
export class TradePriceDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;

  @Input() selectedId = 0;
  @Input() groupedData: any[] = [];
  @Input() isEditMode: boolean = false;

  private tb_Detail!: Tabulator;

  deletedTradePriceDetailIds: number[] = [];
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
  radioValue: boolean = false;
  currencyRate: number = 0;
  // Dữ liệu cho các cell Summary bên trên bảng
  summaryEXW: number = 0;
  summaryMargin: number = 0;
  summaryTotalProfitRate: number = 0;
  summaryTotalProfit: number = 0;
  summaryTotalCMPerSet: number = 0;

  formData: any = this.getDefaultFormData();

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private customerPartService: CustomerPartService,
    private tradePriceService: TradePriceService,
    private RIDService: RequestInvoiceDetailService,
    private pokhService: PokhService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    if (this.isEditMode && this.groupedData.length > 0) {
    }
  }

  ngAfterViewInit(): void {}

  closeModal(): void {
    this.deletedTradePriceDetailIds = [];
    this.activeModal.dismiss('cancel');
  }

  //#region Data Loading Methods
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
        console.log('cboCurrency', this.cboCurrency);

        this.initDetailTable();
        //xử lí editmode
        if (
          this.isEditMode &&
          this.groupedData &&
          this.groupedData.length > 0
        ) {
          this.handleEditModeData();
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  handleEditModeData(): void {
    if (!this.groupedData || this.groupedData.length === 0) return;

    const group = this.groupedData[0];
    const main = group.MainData || {};

    this.selectedId = group.ID ?? main.ID ?? this.selectedId ?? 0;
    this.formData.customerId =
      main.CustomerID ?? main.CustomerId ?? this.formData.customerId ?? null;
    this.formData.customerName =
      main.CustomerName ?? this.formData.customerName ?? '';
    this.formData.adminSaleId =
      main.SaleAdminID ?? main.SaleAdminId ?? this.formData.adminSaleId ?? null;
    this.formData.saleId =
      main.EmployeeID ?? main.EmployeeId ?? this.formData.saleId ?? null;
    this.formData.projectId =
      main.ProjectID ?? main.ProjectId ?? this.formData.projectId ?? null;
    this.formData.projectName =
      main.ProjectName ?? this.formData.projectName ?? '';
    this.formData.rateCOM =
      main.RateCOM ?? main.COM ?? this.formData.rateCOM ?? 0;
    this.formData.UnitPriceDelivery =
      main.UnitPriceDelivery ?? this.formData.UnitPriceDelivery ?? 0;
    this.formData.QuantityDelivery =
      main.QuantityDelivery ?? this.formData.QuantityDelivery ?? 0;
    this.formData.groupTotalPrice =
      main.GroupTotalPrice ?? this.formData.groupTotalPrice ?? false;
    this.formData.rtcVisionCheckbox =
      main.IsRTCVision ?? this.formData.rtcVisionCheckbox ?? false;
    this.formData.quantityRTCVision =
      main.QuantityRTCVision ?? this.formData.quantityRTCVision ?? 0;
    this.formData.unitPriceRTCVision =
      main.UnitPriceRTCVision ?? this.formData.unitPriceRTCVision ?? 0;
    this.radioValue = main.CurrencyType ?? this.radioValue ?? false;

    // Cập nhật details: API trả về mảng phẳng dùng ParentID -> chuyển sang tree với _children
    const flatItems = Array.isArray(group.items) ? group.items : [];
    if (flatItems.length > 0) {
      const map = new Map<number, any>();
      const roots: any[] = [];

      // Khởi tạo node và gắn _children
      flatItems.forEach((it: any, index: number) => {
        const node = {
          ID: it.ID ?? 0,
          ParentID: it.ParentID ?? null,
          STT: index + 1,
          Maker: it.Maker ?? '',
          ProductName: it.ProductName ?? '',
          ProductCode: it.ProductCode ?? '',
          ProductCodeCustomer: it.ProductCodeCustomer ?? '',
          Quantity: it.Quantity ?? 0,
          UnitCountID: it.UnitCountID ?? 0,
          UnitImportPriceUSD: it.UnitImportPriceUSD ?? 0,
          CurrencyCode: it.CurrencyCode ?? '',
          CurrencyID: it.CurrencyID ?? 0,
          CurrencyRate: it.CurrencyRate ?? 0,
          BankCharge: it.BankCharge ?? 0,
          ProtectiveTariff: it.ProtectiveTariff ?? 0,
          FeeShipPcs: it.FeeShipPcs ?? 0,
          OrtherFees: it.OrtherFees ?? 0,
          CustomFees: it.CustomFees ?? 0,
          TotalPriceLabor: it.TotalPriceLabor ?? 0,
          Margin: it.Margin ?? 0,
          UnitPriceExpectCustomer: it.UnitPriceExpectCustomer ?? 0,
          LeadTime: it.LeadTime ?? '',
          Note: it.Note ?? '',
          // Các trường tính toán (nếu API trả về thì dùng, không thì 0)
          TotalImportPriceUSD: it.TotalImportPriceUSD ?? 0,
          UnitImportPriceVND: it.UnitImportPriceVND ?? 0,
          TotalImportPriceVND: it.TotalImportPriceVND ?? 0,
          ProtectiveTariffPerPcs: it.ProtectiveTariffPerPcs ?? 0,
          TotalProtectiveTariff: it.TotalProtectiveTariff ?? 0,
          TotalImportPriceIncludeFees: it.TotalImportPriceIncludeFees ?? 0,
          UnitPriceIncludeFees: it.UnitPriceIncludeFees ?? 0,
          CMPerSet: it.CMPerSet ?? 0,
          TotalPriceExpectCustomer: it.TotalPriceExpectCustomer ?? 0,
          Profit: it.Profit ?? 0,
          ProfitPercent: it.ProfitPercent ?? 0,
          TotalPriceRTCVision: it.TotalPriceRTCVision ?? 0,
          TotalPrice: it.TotalPrice ?? 0,
          UnitPricePerCOM: it.UnitPricePerCOM ?? 0,
          _children: [] as any[],
        };
        map.set(node.ID, node);
      });

      // Liên kết parent-child theo ParentID
      map.forEach((node) => {
        const parentId = node.ParentID;
        if (parentId && parentId !== 0 && map.has(parentId)) {
          map.get(parentId)._children.push(node);
        } else {
          roots.push(node);
        }
      });

      this.dataDetail = roots;

      if (this.tb_Detail) {
        // Đảm bảo setData sau khi bảng đã render
        setTimeout(() => {
          this.tb_Detail.setData(this.dataDetail);
          this.tb_Detail.redraw(true);
          this.calculateAll();
          this.calculateTotal();
        }, 0);
      }
    }
  }

  //#endregion

  //#region Event Handlers
  onCustomerChange(id: number): void {
    const selectedCustomer = this.formCustomerData.find(
      (customer) => customer.ID === id
    );
    if (selectedCustomer) {
      this.formData.customerName = selectedCustomer.CustomerName;
    } else {
      this.formData.customerName = '';
    }
  }

  onProjectChange(id: number): void {
    const selectedProject = this.formProjectData.find(
      (project) => project.ID === id
    );
    if (selectedProject) {
      this.formData.projectName = selectedProject.ProjectName;
    } else {
      this.formData.projectName = '';
    }
  }

  onGroupTotalPriceChange(value: boolean): void {
    this.formData.groupTotalPrice = value;

    if (this.tb_Detail) {
      this.calculatorTotalImport();
    }
  }

  onRtcVisionCheckboxChange(value: boolean): void {
    this.formData.rtcVisionCheckbox = value;
    this.formData.unitPriceRTCVision =
      this.formData.rtcVisionCheckbox == true ? 15000000 : 0;
    if (this.tb_Detail) {
      this.calculatorTotalImport();
      this.calculatorBankCharge();
      this.calculateAll();
      this.calculateTotal();
    }
  }

  onRadioValueChange(value: boolean): void {
    this.radioValue = value;
    this.updateCurrencyRatesForAllRows();
  }

  saveData(): void {
    // Cập nhật lại STT cho tất cả các dòng trước khi lấy dữ liệu lưu
    this.updateSTTForAllRows();
    const DETAIL_DATA_TREE = this.tb_Detail ? this.tb_Detail.getData() : [];
    const DETAIL_DATA = this.flattenFromData(DETAIL_DATA_TREE);

    const TRADE_PRICE = {
      ID: this.selectedId || 0,
      CustomerID: this.formData.customerId || null,
      ProjectID: this.formData.projectId || null,
      CreatedDate: new Date(),
      UpdatedDate: new Date(),
      IsApprovedSale: 0,
      IsApprovedLeader: 0,
      IsApprovedBGD: 0,
      ApprovedSaleID: 0,
      ApprovedLeaderID: 0,
      ApprovedBGDID: 0,
      SaleApprovedDate: null,
      LeaderApprovedDate: null,
      BGDApprovedDate: null,
      SaleAdminID: this.formData.adminSaleId || 0,
      EmployeeID: this.formData.saleId || 0,
      RateCOM: this.formData.rateCOM || 0,
      COM: this.formData.rateCOM || 0, // Giống với RateCOM
      CurrencyID: 0, // Cần lấy từ bảng chi tiết hoặc form
      CurrencyRate: 0,
      CurrencyType: this.radioValue, // false = chính ngạch, true = tiểu ngạch
      IsRTCVision: this.formData.rtcVisionCheckbox || false,
      QuantityRTCVision: this.formData.quantityRTCVision || 0,
      UnitPriceRTCVision: this.formData.unitPriceRTCVision || 0,
      IsQuotation: 0, // Mặc định là 0 khi thêm mới, và được báo giá khi bấm nút báo giá bên ngoài màn chính
      UnitPriceDelivery: this.formData.UnitPriceDelivery || 0,
      QuantityDelivery: this.formData.QuantityDelivery || 0,
      IsDeleted: false,
    };

    const PAYLOAD = {
      tradePrices: TRADE_PRICE,
      tradePriceDetails: DETAIL_DATA,
      deletedTradePriceDetails: this.deletedTradePriceDetailIds,
    };

    console.log('TradePrice object:', TRADE_PRICE);
    console.log('Detail data:', DETAIL_DATA);

    // Gọi service để lưu dữ liệu
    this.tradePriceService.saveData(PAYLOAD).subscribe({
      next: (response: any) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
        this.activeModal.close({ success: true, reloadData: true });
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể lưu dữ liệu: ' + error.message
        );
      },
    });
  }
  //#endregion

  //#region Utility Methods
  getRowNumber(cell: any): string {
    const row = cell.getRow();
    const parent = row.getTreeParent();
    if (!parent) {
      // Dòng cha
      // Lấy index của dòng cha trong tất cả các dòng cha
      const allParentRows = row
        .getTable()
        .getRows()
        .filter((r: any) => !r.getTreeParent());
      const parentIndex = allParentRows.findIndex((r: any) => r === row);
      return (parentIndex + 1).toString();
    } else {
      // Dòng con
      const parentRow = parent;
      const childRows = parentRow.getTreeChildren();
      const childIndex = childRows.findIndex((r: any) => r === row);
      // Lấy số thứ tự cha
      const allParentRows = row
        .getTable()
        .getRows()
        .filter((r: any) => !r.getTreeParent());
      const parentIndex = allParentRows.findIndex((r: any) => r === parentRow);
      return `${parentIndex + 1}.${childIndex + 1}`;
    }
  }

  updateCurrencyRatesForAllRows(): void {
    if (!this.tb_Detail) return;

    const nowIso = new Date().toISOString();
    let hasError = false;

    const processRowsRecursively = (rows: any[]) => {
      rows.forEach((rowComp: any) => {
        const rowData = rowComp.getData();
        if (rowData && rowData.CurrencyCode) {
          const selectedCurrency = this.cboCurrency.find(
            (p) => p.Code === rowData.CurrencyCode
          );
          if (selectedCurrency) {
            let newRate = 0;
            if (this.radioValue === false) {
              // Chính ngạch
              newRate = selectedCurrency.CurrencyRateOfficialQuota;
              if (selectedCurrency.DateExpriedOfficialQuota < nowIso) {
                this.notification.error(
                  'Lỗi',
                  `Tỷ giá chính ngạch của ${selectedCurrency.Code} đã hết hạn`
                );
                hasError = true;
                newRate = 0;
              }
            } else {
              // Tiểu ngạch
              newRate = selectedCurrency.CurrencyRateUnofficialQuota;
              if (selectedCurrency.DateExpriedUnofficialQuota < nowIso) {
                this.notification.error(
                  'Lỗi',
                  `Tỷ giá tiểu ngạch của ${selectedCurrency.Code} đã hết hạn`
                );
                hasError = true;
                newRate = 0;
              }
            }

            rowComp.update({
              CurrencyRate: newRate,
              CurrencyID: selectedCurrency ? selectedCurrency.ID : 0,
            });

            this.calculator(rowComp.getData());
          }
        }

        const childRows = rowComp.getTreeChildren && rowComp.getTreeChildren();
        if (childRows && childRows.length > 0) {
          processRowsRecursively(childRows);
        }
      });
    };

    const allRows = this.tb_Detail.getRows();
    const topLevelRows = allRows.filter(
      (r: any) => !r.getTreeParent || !r.getTreeParent()
    );
    processRowsRecursively(topLevelRows);

    if (!hasError) {
      this.calculatorBankCharge();
      this.calculatorTotalImport();
      this.calculateAll();
      this.calculateTotal();
    }
  }

  formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
      groupTotalPrice: false,
      rtcVisionCheckbox: false,
      rateCOM: 0, // Tỷ lệ COM
      quantityRTCVision: 0, // Số lượng RTC Vision
      unitPriceRTCVision: 0, // Đơn giá RTC Vision
    };
  }

  private toDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = parseFloat(value.toString());
    return isNaN(num) ? 0 : num;
  }
  //#endregion

  //#region Calculation Methods
  calculator(row: any): void {
    //lấy dữ liệu từ các dòng
    const currencyRate = this.toDecimal(row.CurrencyRate); // Tỷ giá
    const rateCOM = this.toDecimal(this.formData.rateCOM); // Tỷ lệ COM
    const quantityRTCVision = this.toDecimal(this.formData.quantityRTCVision); // Số lượng RTC Vision
    const unitPriceRTCVision = this.toDecimal(this.formData.unitPriceRTCVision); // Đơn giá RTC Vision

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
    const protectiveTariffPerPcs =
      protectiveTariff * (unitImportPriceVND + feeShipPcs); // Thuế nhập khẩu /1pcs(VND)
    const totalProtectiveTariff = protectiveTariff * quantity; // Tổng thuế nhập khẩu
    const totalImportPriceIncludeFees = this.toDecimal(
      row.TotalImportPriceIncludeFees
    ); // Tổng giá nhập chưa VAT
    const unitPriceIncludeFees =
      totalImportPriceVND !== 0
        ? (totalImportPriceIncludeFees / totalImportPriceVND) *
          unitImportPriceVND
        : 0; // Đơn giá về kho

    let unitPriceExpectCustomer = this.toDecimal(row.UnitPriceExpectCustomer); // Đơn giá dự kiến báo khách
    const margin = this.toDecimal(row.Margin); // Margin

    if (margin > 0) {
      unitPriceExpectCustomer =
        Math.round(margin * unitPriceIncludeFees * 10) / 10;
    } else if (unitPriceExpectCustomer > 0) {
      const calculatedMargin =
        unitPriceIncludeFees === 0
          ? 0
          : unitPriceExpectCustomer / unitPriceIncludeFees;
      row.Margin = calculatedMargin;
    }

    const cmSet = (rateCOM * unitPriceExpectCustomer) / 100; // CM/set
    const totalPriceExpectCustomer = unitPriceExpectCustomer * quantity; // Tổng đơn hàng
    const profit = totalPriceExpectCustomer - totalImportPriceIncludeFees; // Lợi nhuận
    const profitPercent =
      totalPriceExpectCustomer !== 0
        ? (profit / totalPriceExpectCustomer) * 100
        : 0; // Tỷ lệ lợi nhuận
    const totalPriceRTCVision =
      (unitPriceRTCVision + unitPriceRTCVision * rateCOM) * quantityRTCVision; // Giá báo RTC Vision Software
    const totalPrice =
      totalPriceExpectCustomer + totalPriceLabor + totalPriceRTCVision; // Tổng giá trị đầu ra đơn hàng

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
    data.forEach((row) => {
      this.calculator(row);
    });
    this.tb_Detail.replaceData(data);
  }

  // Xử lý sự kiện sửa dữ liệu
  onCellEdited(cell: any): void {
    const row = cell.getRow().getData();
    this.calculator(row);
    if (cell.getColumn().getField() === 'CurrencyCode') {
      const selectedCurrency = this.cboCurrency.find(
        (p) => p.Code === cell.getValue()
      );
      let dateNow = new Date();
      console.log('Dữ liệu của Currency đã nhận: ', selectedCurrency);

      if (this.radioValue === false) {
        this.currencyRate = selectedCurrency.CurrencyRateOfficialQuota;
        if (selectedCurrency.DateExpriedOfficialQuota < dateNow.toISOString()) {
          this.notification.error(
            'Lỗi',
            `Tỷ giá chính ngạch của ${selectedCurrency.Code} đã hết hạn`
          );
          this.currencyRate = 0;
        }
      } else {
        this.currencyRate = selectedCurrency.CurrencyRateUnofficialQuota;
        if (
          selectedCurrency.DateExpriedUnofficialQuota < dateNow.toISOString()
        ) {
          this.notification.error(
            'Lỗi',
            `Tỷ giá tiểu ngạch của ${selectedCurrency.Code} đã hết hạn`
          );
          this.currencyRate = 0;
        }
      }
      const row = cell.getRow();
      row.update({
        CurrencyRate: this.currencyRate,
        CurrencyID: selectedCurrency ? selectedCurrency.ID : 0,
      });

      // Tính toán lại chỉ dòng đã thay đổi loại tiền
      this.calculator(row.getData());
    }
    if (cell.getColumn().getField() === 'ProductCode') {
      const selectedProductCode = this.cboProductSale.find(
        (p) => p.ProductCode === cell.getValue()
      );
      const rowComp = cell.getRow();
      rowComp.update({
        ProductID: selectedProductCode ? selectedProductCode.ID : 0,
      });
    }

    this.calculatorBankCharge();
    this.calculatorTotalImport();
    this.calculateTotal();
  }

  calculatorBankCharge(): void {
    const unitPriceDelivery = this.toDecimal(this.formData.UnitPriceDelivery);
    const quantityDelivery = this.toDecimal(this.formData.QuantityDelivery);

    if (!this.tb_Detail) return;

    // Tính tổng TotalImportPriceVND của tất cả các dòng (bao gồm cả dòng con)
    const allRows = this.tb_Detail.getRows();
    let sumTotalImportPriceVND = 0;

    const accumulateTotals = (rows: any[]) => {
      rows.forEach((row: any) => {
        const rowData = row.getData();
        sumTotalImportPriceVND += this.toDecimal(rowData.TotalImportPriceVND);
        const childRows = row.getTreeChildren && row.getTreeChildren();
        if (childRows && childRows.length > 0) {
          accumulateTotals(childRows);
        }
      });
    };

    accumulateTotals(allRows);

    // Tính phí ngân hàng cho toàn bộ bảng
    const bankCharge =
      unitPriceDelivery * quantityDelivery + 0.002 * sumTotalImportPriceVND;

    // Gán bankCharge cho tất cả các dòng (bao gồm cả dòng con)
    const assignBankCharge = (rows: any[]) => {
      rows.forEach((row: any) => {
        row.update({ BankCharge: bankCharge });
        const childRows = row.getTreeChildren && row.getTreeChildren();
        if (childRows && childRows.length > 0) {
          assignBankCharge(childRows);
        }
      });
    };

    assignBankCharge(allRows);
  }

  calculatorTotalImport(): void {
    if (this.formData.groupTotalPrice === true) {
      let totalImportPriceVND = 0;
      let bankCharge = 0;
      let totalProtectiveTariff = 0;
      let ortherFees = 0;
      let customFees = 0;

      const allRows = this.tb_Detail.getRows();

      // Hàm đệ quy để tính tổng từ tất cả các dòng (cha và con)
      const calculateTotalsRecursively = (rows: any[]) => {
        rows.forEach((row: any) => {
          const rowData = row.getData();
          totalImportPriceVND += this.toDecimal(rowData.TotalImportPriceVND);
          bankCharge = this.toDecimal(rowData.BankCharge);
          totalProtectiveTariff += this.toDecimal(
            rowData.TotalProtectiveTariff
          );
          ortherFees += this.toDecimal(rowData.OrtherFees);
          customFees += this.toDecimal(rowData.CustomFees);

          const childRows = row.getTreeChildren();
          if (childRows && childRows.length > 0) {
            calculateTotalsRecursively(childRows);
          }
        });
      };

      calculateTotalsRecursively(allRows);

      const totalImportPriceIncludeFees =
        totalImportPriceVND +
        bankCharge +
        totalProtectiveTariff +
        ortherFees +
        customFees;

      // Hàm đệ quy để cập nhật giá trị cho tất cả các dòng (cha và con)
      const updateRowsRecursively = (rows: any[]) => {
        rows.forEach((row: any) => {
          row.update({
            TotalImportPriceIncludeFees: totalImportPriceIncludeFees,
          });

          const childRows = row.getTreeChildren();
          if (childRows && childRows.length > 0) {
            updateRowsRecursively(childRows);
          }
        });
      };

      updateRowsRecursively(allRows);
    } else {
      // Nếu checkbox không được chọn, tính riêng cho từng dòng
      const allRows = this.tb_Detail.getRows();

      // Hàm đệ quy để tính và cập nhật từng dòng riêng biệt
      const calculateAndUpdateRowsRecursively = (rows: any[]) => {
        rows.forEach((row: any) => {
          const rowData = row.getData();
          const totalImportPriceVND = this.toDecimal(
            rowData.TotalImportPriceVND
          );
          const bankCharge = this.toDecimal(rowData.BankCharge);
          const totalProtectiveTariff = this.toDecimal(
            rowData.TotalProtectiveTariff
          );
          const ortherFees = this.toDecimal(rowData.OrtherFees);
          const customFees = this.toDecimal(rowData.CustomFees);

          const totalImportPriceIncludeFees =
            totalImportPriceVND +
            bankCharge +
            totalProtectiveTariff +
            ortherFees +
            customFees;

          row.update({
            TotalImportPriceIncludeFees: totalImportPriceIncludeFees,
          });

          // Nếu có dòng con, xử lý tiếp cho dòng con
          const childRows = row.getTreeChildren();
          if (childRows && childRows.length > 0) {
            calculateAndUpdateRowsRecursively(childRows);
          }
        });
      };

      calculateAndUpdateRowsRecursively(allRows);
    }
  }

  // Tính toán tổng giá
  calculateTotal(): void {
    if (!this.tb_Detail) {
      this.summaryEXW = 0;
      this.summaryMargin = 0;
      this.summaryTotalProfit = 0;
      this.summaryTotalProfitRate = 0;
      this.summaryTotalCMPerSet = 0;
      return;
    }

    // Tính tổng theo trường cho tất cả dòng bao gồm cả dòng con
    const allRows = this.tb_Detail.getRows();
    const sumField = (rows: any[], field: string): number => {
      let sum = 0;
      rows.forEach((row: any) => {
        const rowData = row.getData();
        sum += this.toDecimal(rowData[field]);
        const childRows = row.getTreeChildren && row.getTreeChildren();
        if (childRows && childRows.length > 0) {
          sum += sumField(childRows, field);
        }
      });
      return sum;
    };

    const totalImportPriceVND = sumField(allRows, 'TotalImportPriceVND');
    const totalPriceExpectCustomer = sumField(
      allRows,
      'TotalPriceExpectCustomer'
    );
    const totalImportPriceIncludeFees = sumField(
      allRows,
      'TotalImportPriceIncludeFees'
    );
    const totalCMPerSetSummary = sumField(allRows, 'CMPerSet');

    this.summaryEXW =
      totalImportPriceVND > 0
        ? totalPriceExpectCustomer / totalImportPriceVND
        : 0;

    this.summaryMargin =
      totalImportPriceIncludeFees > 0
        ? totalPriceExpectCustomer -
          totalCMPerSetSummary / totalImportPriceIncludeFees
        : 0;

    this.summaryTotalProfit =
      totalPriceExpectCustomer -
      totalCMPerSetSummary -
      totalImportPriceIncludeFees;

    this.summaryTotalProfitRate =
      totalPriceExpectCustomer > 0
        ? this.summaryTotalProfit / totalPriceExpectCustomer
        : 0;

    const rateComInput = this.toDecimal(this.formData.rateCOM);
    const rateComAsRatio = rateComInput > 1 ? rateComInput / 100 : rateComInput;
    this.summaryTotalCMPerSet = totalPriceExpectCustomer * rateComAsRatio;

    setTimeout(() => {
      if (this.tb_Detail) {
        const columns = this.tb_Detail.getColumnDefinitions();
        columns[1].title = `Tổng CM/Set = ${this.formatMoney(
          this.summaryTotalCMPerSet
        )}`;
        columns[2].title = `EXW = ${this.formatMoney(this.summaryEXW)}`;
        columns[3].title = `Margin = ${this.formatMoney(this.summaryMargin)}`;
        columns[4].title = `Lợi nhuận = ${this.formatMoney(
          this.summaryTotalProfit
        )}`;
        columns[5].title = `Tỷ lệ lợi nhuận = ${this.formatMoney(
          this.summaryTotalProfitRate
        )}`;
        this.tb_Detail.setColumns(columns);
      }
    });
  }
  formatMoney(value: any): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(
      Number(value)
    );
  }
  //#endregion

  //#region Row Management Methods

  addNewRow(): void {
    this.nextRowId = this.nextRowId - 1;
    const newRow = {
      ID: this.nextRowId,
      Maker: '',
      ProductName: '',
      ProductCode: '',
      ProductID: 0,
      ProductCodeCustomer: '',
      Quantity: 0,
      UnitCountID: 0,
      UnitImportPriceUSD: 0,
      CurrencyCode: '',
      CurrencyID: 0,
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
      _children: [],
    };

    if (this.tb_Detail) {
      this.tb_Detail.addRow(newRow);
    } else {
      this.dataDetail.push(newRow);
    }
    this.calculatorBankCharge();
    this.calculatorTotalImport();
    this.calculateTotal();
  }

  addChildRow(): void {
    if (!this.selectedRow) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một sản phẩm trước khi thêm sản phẩm con!'
      );
      return;
    }

    // Kiểm tra xem row được chọn có phải là row cha (level 0) hay không
    const selectedData = this.selectedRow.getData();
    const parentRow = this.selectedRow.getTreeParent();

    // Nếu row được chọn đã có parent (tức là nó là row con), thì không cho phép thêm con
    if (parentRow) {
      this.notification.warning(
        'Thông báo',
        'Chỉ có thể thêm sản phẩm con cho sản phẩm cha (cấp 1). Sản phẩm con không thể có sản phẩm con!'
      );
      return;
    }

    this.nextRowId = this.nextRowId - 1;
    const childRow = {
      ID: this.nextRowId,
      ParentId: selectedData.ID,
      Maker: '',
      ProductName: '',
      ProductCode: '',
      ProductID: 0,
      ProductCodeCustomer: '',
      Quantity: 0,
      UnitCountID: 0,
      UnitImportPriceUSD: 0,
      CurrencyCode: '',
      CurrencyID: 0,
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
      _children: [],
    };
    this.selectedRow.addTreeChild(childRow);
    this.selectedRow.treeExpand();
    this.calculatorBankCharge();
    this.calculatorTotalImport();
    this.calculateTotal();
  }

  //#endregion
  private getAllRowIds(row: any): number[] {
    const ids: number[] = [];
    const rowData = row.getData();

    if (rowData.ID) {
      ids.push(rowData.ID);
    }

    if (rowData._children && rowData._children.length > 0) {
      rowData._children.forEach((child: any) => {
        const childRow = {
          getData: () => child,
        };
        ids.push(...this.getAllRowIds(childRow));
      });
    }

    return ids;
  }

  private deleteRowAndChildren(row: any): void {
    const children =
      row && typeof row.getTreeChildren === 'function'
        ? row.getTreeChildren()
        : [];
    if (children && children.length > 0) {
      children.forEach((child: any) => this.deleteRowAndChildren(child));
    }
    row.delete();
  }

  // Chuyển dữ liệu tree sang dạng phẳng
  private flattenFromData(treeData: any[]): any[] {
    const flat: any[] = [];

    const walk = (nodes: any[], parentId: number | null = null) => {
      nodes.forEach((node) => {
        const { _children, ParentId, ParentID, ...rest } = node || {};
        const currentParent = ParentID !== undefined ? ParentID : ParentId;
        const normalizedParentId =
          currentParent !== undefined && currentParent !== null
            ? currentParent
            : parentId;
        const normalized = { ...rest, ParentID: normalizedParentId ?? null };
        flat.push(normalized);
        if (_children && Array.isArray(_children) && _children.length > 0) {
          walk(_children, normalized.ID ?? null);
        }
      });
    };

    walk(treeData);
    return flat;
  }

  // Cập nhật STT vào dữ liệu theo thứ tự hiển thị hiện tại của bảng (bao gồm tree)
  private updateSTTForAllRows(): void {
    if (!this.tb_Detail) return;
    const assign = (rows: any[], prefix: string | null) => {
      rows.forEach((rowComp: any, idx: number) => {
        const stt = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
        rowComp.update({ STT: stt });
        const children = rowComp.getTreeChildren && rowComp.getTreeChildren();
        if (children && children.length > 0) assign(children, stt);
      });
    };
    const allRows = this.tb_Detail.getRows();
    const topRows = allRows.filter(
      (r: any) => !r.getTreeParent || !r.getTreeParent()
    );
    this.tb_Detail.blockRedraw();
    try {
      assign(topRows, null);
    } finally {
      this.tb_Detail.restoreRedraw();
    }
  }
  //#region Table Initialization
  initDetailTable(): void {
    this.tb_Detail = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      height: '64vh',
      movableColumns: true,
      dataTreeChildField: '_children',
      resizableRows: true,
      dataTree: true,
      dataTreeStartExpanded: true,
      selectableRows: 1,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      columns: [
        {
          title: '',
          field: 'actions',
          frozen: true,
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: 100,
          hozAlign: 'center',
          cellClick: (e, cell) => {
            e.stopPropagation();
            e.preventDefault();
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const ids = this.getAllRowIds(row);
                  ids.forEach((id: number) => {
                    if (!this.deletedTradePriceDetailIds.includes(id)) {
                      this.deletedTradePriceDetailIds.push(id);
                    }
                  });
                  if (this.selectedRow && this.selectedRow === row) {
                    this.selectedRow = null;
                  }
                  this.deleteRowAndChildren(row);
                  this.calculatorBankCharge();
                  this.calculatorTotalImport();
                  this.calculateAll();
                  this.calculateTotal();
                },
              });
            }
          },
        },
        {
          title: 'Tổng CM/Set',
          frozen: true,
          columns: [
            {
              title: 'STT',
              field: 'STT',
              width: 70,
              hozAlign: 'center',
              resizable: true,
              formatter: (cell) => this.getRowNumber(cell),
            },
            {
              title: 'Cụm',
              field: 'Maker',
              width: 70,
              hozAlign: 'center',
              resizable: true,
              editor: 'input',
            },
            {
              title: 'Tên sản phẩm',
              field: 'ProductName',
              width: 150,
              resizable: true,
              variableHeight: true,
              editor: 'input',
            },
          ],
        },
        {
          title: 'EXW',
          columns: [
            {
              title: 'ID cột chọn mã gốc',
              field: 'ProductID',
              width: 120,
              visible: false,
            },
            {
              title: 'Chọn mã gốc',
              field: 'ProductCode',
              sorter: 'string',
              width: 120,
              editor: 'list',
              tooltip: true,
              frozen: true,
              editorParams: {
                values: this.cboProductSale.map((product) => {
                  const shortLabel = `${product.ProductNewCode} ${product.ProductCode}`;
                  return {
                    label: shortLabel,
                    value: product.ProductCode,
                    id: product.ID,
                  };
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
              editor: 'input',
              tooltip: true,
            },
          ],
        },
        {
          title: 'Margin',
          columns: [
            {
              title: 'Mã báo khách',
              field: 'ProductCodeCustomer',
              width: 150,
              hozAlign: 'center',
              resizable: true,
              editor: 'input',
            },
            {
              title: 'Số lượng',
              field: 'Quantity',
              width: 100,
              hozAlign: 'center',
              resizable: true,
              editor: 'number',
              formatter: 'money',
              formatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
              bottomCalc: 'sum',
              bottomCalcFormatter: 'money',
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
            },
          ],
        },
        {
          title: `Lợi nhuận`,
          field: 'bandTotalProfit',
          columns: [
            {
              title: 'ĐVT',
              field: 'UnitCountID',
              width: 120,
              editor: 'list',
              editorParams: {
                values: this.cboUnitCount.map((product) => {
                  return {
                    label: product.UnitName,
                    value: product.ID,
                  };
                }),
                autocomplete: true,
                listOnEmpty: true,
              },
              formatter: (cell) => {
                const id = cell.getValue();
                const found = this.cboUnitCount.find((u) => u.ID === id);
                return found ? found.UnitName : '';
              },
            },
            {
              title: 'Đơn giá nhập EXW',
              field: 'UnitImportPriceUSD',
              width: 150,
              hozAlign: 'center',
              resizable: true,
              editor: 'number',
              formatter: 'money',
              formatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
              bottomCalc: 'sum',
              bottomCalcFormatter: 'money',
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: '.',
                thousand: ',',
                symbol: '',
                symbolAfter: true,
              },
            },
          ],
        },
        {
          title: 'Tỷ lệ lợi nhuận',
          columns: [
            {
              title: 'ID Loại tiền',
              field: 'CurrencyID',
              width: 120,
              visible: false,
            },
            {
              title: 'Loại tiền',
              field: 'CurrencyCode',
              width: 120,
              editor: 'list',
              editorParams: {
                values: this.cboCurrency.map((item) => {
                  const shortLabel = `${item.Code} - ${item.NameVietNamese}`;
                  return {
                    label: shortLabel,
                    value: item.Code,
                    id: item.ID,
                  };
                }),
                autocomplete: true,
                listOnEmpty: true,
              },
            },
            {
              title: 'Tỷ giá',
              field: 'CurrencyRate',
              width: 150,
              hozAlign: 'center',
              resizable: true,
            },
          ],
        },
        {
          title: 'Tổng giá nhập',
          field: 'TotalImportPriceUSD',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Đơn giá nhập chưa chi phí (VND)',
          field: 'UnitImportPriceVND',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng giá nhập chưa chi phí (VND)',
          field: 'TotalImportPriceVND',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Phí ngân hàng (VND)',
          field: 'BankCharge',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Thuế nhập khẩu (%)',
          field: 'ProtectiveTariff',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Phí vận chuyển / 1pcs',
          field: 'FeeShipPcs',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Thuế nhập khẩu/1pcs (VND)',
          field: 'ProtectiveTariffPerPcs',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng thuế nhập khẩu (VND)',
          field: 'TotalProtectiveTariff',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Phí vận chuyển, HCHQ, CO, MSDV, vv (VND)',
          field: 'OrtherFees',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Phí khai HQ (VND)',
          field: 'CustomFees',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng giá nhập chưa VAT (VND)',
          field: 'TotalImportPriceIncludeFees',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Đơn giá về kho (Bao gồm chi phí)',
          field: 'UnitPriceIncludeFees',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'CM/Set',
          field: 'CMPerSet',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Margin',
          field: 'Margin',
          sorter: 'string',
          width: 150,
          editor: 'number',
        },
        {
          title: 'Đơn giá dự kiến báo khách',
          field: 'UnitPriceExpectCustomer',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng đơn hàng',
          field: 'TotalPriceExpectCustomer',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Lợi nhuận',
          field: 'Profit',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tỷ lệ lợi nhuận',
          field: 'ProfitPercent',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Leadtime',
          field: 'LeadTime',
          sorter: 'string',
          width: 150,
          editor: 'input',
        },
        {
          title: 'Giá báo nhân công',
          field: 'TotalPriceLabor',
          sorter: 'string',
          width: 150,
          editor: 'number',
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Giá báo RTC Vision Software',
          field: 'TotalPriceRTCVision',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Tổng giá trị đầu ra đơn hàng',
          field: 'TotalPrice',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Đơn giá/Máy (Bao gồm nhân công và COM',
          field: 'UnitPricePerCOM',
          sorter: 'string',
          width: 150,
          formatter: 'money',
          editor: 'number',
          formatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: 'money',
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: '.',
            thousand: ',',
            symbol: '',
            symbolAfter: true,
          },
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          sorter: 'string',
          width: 150,
          editor: 'input',
        },
      ],
    });

    this.tb_Detail.on('rowClick', (e: any, row: RowComponent) => {
      this.selectedRow = row;
      console.log('selectedRow', this.selectedRow);
      console.log('_children: ', this.selectedRow.getData()['_children']);
    });

    // Add event handlers after table initialization
    this.tb_Detail.on('cellEdited', (cell: any) => {
      this.onCellEdited(cell);
    });
  }
  //#endregion
}
