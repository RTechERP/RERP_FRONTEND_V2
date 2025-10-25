import { Component, ElementRef, OnInit, ViewChild, Input, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { TabulatorTableSingleComponent } from '../../tabulator-table/tabulator-tables.component';
import { ColumnDefinition } from 'tabulator-tables';
import { PonccService } from '../service/poncc.service';
import { PONCC,PONCCDTO,PONCCRulePay,DocumentImportPONCC,PONCCDetail } from './poncc.inteface';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
@Component({
  selector: 'app-poncc-detail',
  templateUrl: './poncc-detail.component.html',
  styleUrls: ['./poncc-detail.component.css'],
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzFormModule,
    NzCheckboxModule,
    CommonModule,
    TabulatorTableSingleComponent,
    NzInputNumberModule
  ],
})
export class PonccDetailComponent implements OnInit {
  @Input() dataInput: any = null;
  @ViewChild(TabulatorTableSingleComponent) detailTableComp!: TabulatorTableSingleComponent;
  @ViewChild(TabulatorTableSingleComponent) documentTableComp!: TabulatorTableSingleComponent;

  ponccForm!: FormGroup;
  isLoading = false;
  isEditMode = false;

  // Data arrays
  dataSupplierSale: any[] = [];
  dataEmployee: any[] = [];
  dataCurrency: any[] = [];
  dataRulePay: any[] = [];
  dataProductSale: any[] = [];
  dataProductRTC: any[] = [];
  dataProject: any[] = [];
  dataCompany: any[] = [
    { value: 0, label: 'RTC' },
    { value: 1, label: 'RTCVN' }
  ];
  dataStatus: any[] = [
    { value: 0, label: 'Chờ duyệt' },
    { value: 1, label: 'Đã duyệt' },
    { value: 2, label: 'Từ chối' },
    { value: 3, label: 'Hủy' },
    { value: 4, label: 'Hoàn thành' },
    { value: 5, label: 'Đóng' }
  ];
  dataPOType: any[] = [
    { value: 0, label: 'PO thương mại' },
    { value: 1, label: 'PO mượn' }
  ];

  // Table data
  dataDetail: PONCCDetail[] = [];
  dataDocumentImport: DocumentImportPONCC[] = [];
  selectedDetailRows: any[] = [];
  selectedDocumentRows: any[] = [];

  // Services
  ponccService = inject(PonccService);
  notification = inject(NzNotificationService);
  modal = inject(NzModalService);

  // Table columns for detail
  detailColumns: ColumnDefinition[] = [
    { title: 'STT', field: 'STT', width: 60, editor: 'input' },
    { 
      title: 'Mã sản phẩm', 
      field: 'ProductCode', 
      width: 120, 
      editor: 'list', 
      editorParams: { 
        valuesLookup: ((cell: any) => {
          return this.getProductValues(cell);
        }) as any,
        autocomplete: true,
        allowEmpty: true,
        listOnEmpty: true,
      }
    },
    { title: 'Tên sản phẩm', field: 'ProductName', width: 200 },
    { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120 },
    { title: 'Tên nhóm', field: 'ProductGroupName', width: 150 },
    { title: 'Mã sản phẩm NCC', field: 'ProductCodeOfSupplier', width: 150, editor: 'input' },
    { 
      title: 'Mã dự án', 
      field: 'ProjectCode', 
      width: 120, 
      editor: 'list', 
      editorParams: { 
        valuesLookup: ((cell: any) => {
          return this.getProjectValues(cell);
        }) as any,
        autocomplete: true,
        allowEmpty: true,
        listOnEmpty: true
      }
    },
    { title: 'Tên dự án', field: 'ProjectName', width: 200 },
    { title: 'ĐVT', field: 'Unit', width: 80 },
    { title: 'SL yêu cầu', field: 'QtyRequest', width: 100, editor: 'number', hozAlign: 'right' },
    { title: 'SL trả về', field: 'QuantityReturn', width: 100, editor: 'number', hozAlign: 'right' },
    { title: 'Đơn giá', field: 'UnitPrice', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Thành tiền', field: 'ThanhTien', width: 120, hozAlign: 'right', formatter: 'money' },
    { title: '% VAT', field: 'VAT', width: 80, editor: 'number', hozAlign: 'right' },
    { title: 'Tổng tiền VAT', field: 'VATMoney', width: 120, hozAlign: 'right', formatter: 'money' },
    { title: '% Chiết khấu', field: 'DiscountPercent', width: 120, editor: 'number', hozAlign: 'right' },
    { title: 'Chiết khấu', field: 'Discount', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Phí vận chuyển', field: 'FeeShip', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Tổng tiền', field: 'TotalPrice', width: 120, hozAlign: 'right', formatter: 'money' },
    { title: 'Deadline giao hàng', field: 'DeadlineDelivery', width: 150, editor: 'date' },
    { title: 'Ngày về dự kiến', field: 'ExpectedDate', width: 150, editor: 'date' },
    { title: 'Ngày về thực tế', field: 'ActualDate', width: 150, editor: 'date' },
    { title: 'Giá bán', field: 'PriceSale', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Giá lịch sử', field: 'PriceHistory', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Giá chào thầu', field: 'BiddingPrice', width: 120, editor: 'number', hozAlign: 'right', formatter: 'money' },
    { title: 'Diễn giải', field: 'Note', width: 200, editor: 'textarea' },
  ];

  // Table columns for document import
  documentColumns: ColumnDefinition[] = [
    {
      title: 'Chọn', field: 'IsSelected', width: 60, headerSort: false, hozAlign: "center",
      formatter: function (cell) {
        let value = cell.getValue();
        return value
          ? "<input type='checkbox' checked>"
          : "<input type='checkbox'>";
      },
      cellClick: function (e, cell) {
        let currentValue = cell.getValue();
        cell.setValue(!currentValue);
      }
    },
    { title: 'Tên chứng từ', field: 'DocumentName', width: 300 },
    { title: 'Đường dẫn', field: 'DocumentPath', width: 400 },
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadInitialData();
    this.loadFormData();
  }
formatCurrency = (value: number): string => {
  if (value == null) return '';
  return `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/\$\s?|(,*)/g, '')) || 0;
};

  initForm() {
    this.ponccForm = this.fb.group({
      ID: [0],
      SupplierSaleID: [null, Validators.required],
      POCode: ['', Validators.required],
      BillCode: ['', Validators.required],
      EmployeeID: [null, Validators.required],
      Company: [0, Validators.required],
      RequestDate: [new Date(), Validators.required],
      DeliveryDate: [new Date(), Validators.required],
      Status: [0],
      TotalMoneyPO: [0, [Validators.required, Validators.min(0)]],
      CurrencyID: [null, Validators.required],
      CurrencyRate: [1],
      Note: [''],
      AddressDelivery: [''],
      OtherTerms: [''],
      AccountNumberSupplier: [''],
      BankCharge: [''],
      FedexAccount: [''],
      OriginItem: [''],
      SupplierVoucher: [''],
      BankSupplier: [''],
      RuleIncoterm: [''],
      OrderTargets: [''],
      NCCNew: [false],
      DeptSupplier: [false],
      POType: [0],
      ShippingPoint: [''],
      OrderQualityNotMet: [false],
      ReasonForFailure: [''],
      IsApproved: [false]
    });
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      // Load all dropdown data
      await Promise.all([
        this.loadSupplierSale(),
        this.loadEmployee(),
        this.loadCurrency(),
        this.loadRulePay(),
        this.loadProductSale(),
        this.loadProductRTC(),
        this.loadProject()
      ]);
    } catch (error) {
      this.notification.error('Lỗi', 'Không thể tải dữ liệu ban đầu');
    } finally {
      this.isLoading = false;
    }
  }

  loadFormData() {
    if (this.dataInput && this.dataInput.ID > 0) {
      this.isEditMode = true;
      this.loadPONCCData(this.dataInput.ID);
    } else {
      this.isEditMode = false;
      this.generateNewCodes();
    }
  }

  async loadSupplierSale() {
    try {
      const response = await firstValueFrom(this.ponccService.getSupplierSale());
      this.dataSupplierSale = response.data || [];
    } catch (error) {
      console.error('Error loading supplier sale:', error);
    }
  }

  async loadEmployee() {
    try {
      const response = await firstValueFrom(this.ponccService.getEmployee(0));
      this.dataEmployee = response.data || [];
    } catch (error) {
      console.error('Error loading employee:', error);
    }
  }

  async loadCurrency() {
    try {
      const response = await firstValueFrom(this.ponccService.getCurrency());
      this.dataCurrency = response.data || [];
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  }

  async loadRulePay() {
    try {
      const response = await firstValueFrom(this.ponccService.getRulePay());
      this.dataRulePay = response.data || [];
    } catch (error) {
      console.error('Error loading rule pay:', error);
    }
  }

  async loadProductSale() {
    try {
      const response = await firstValueFrom(this.ponccService.getProductSale());
      this.dataProductSale = response.data || [];
    } catch (error) {
      console.error('Error loading product sale:', error);
    }
  }

  async loadProductRTC() {
    try {
      const response = await firstValueFrom(this.ponccService.getProductRTC());
      this.dataProductRTC = response.data || [];
    } catch (error) {
      console.error('Error loading product RTC:', error);
    }
  }

  async loadProject() {
    try {
      const response = await firstValueFrom(this.ponccService.getProject());
      this.dataProject = response.data || [];
    } catch (error) {
      console.error('Error loading project:', error);
    }
  }

  getProductValues(cell: any): any {
    const rowData = cell.getRow().getData();
    const values: any = {};
    
    // Có thể filter sản phẩm dựa trên context của row
    let filteredProducts = this.dataProductSale;
    
    // Ví dụ: Filter theo supplier nếu có
    const supplierCode = this.ponccForm.get('SupplierCode')?.value;
    if (supplierCode) {
      filteredProducts = this.dataProductSale.filter(product => 
        product.SupplierCode === supplierCode || !product.SupplierCode
      );
    }
    
    // Tạo values object cho dropdown
    filteredProducts.forEach(product => {
      values[product.ProductCode] = `${product.ProductCode} - ${product.ProductName}`;
    });
    
    return values;
  }

  getProjectValues(cell: any): any {
    const rowData = cell.getRow().getData();
    const values: any = {};
    
    // Có thể filter dự án dựa trên context
    let filteredProjects = this.dataProject;
    
    // Ví dụ: Filter theo company
    const company = this.ponccForm.get('Company')?.value;
    if (company !== null && company !== undefined) {
      filteredProjects = this.dataProject.filter(project => 
        project.Company === company || project.Company === null
      );
    }
    
    // Tạo values object cho dropdown
    filteredProjects.forEach(project => {
      values[project.ProjectCode] = `${project.ProjectCode} - ${project.ProjectName}`;
    });
    
    return values;
  }

  async loadPONCCData(ponccId: number) {
    try {
      // Load PONCC detail
      const detailResponse = await firstValueFrom(this.ponccService.getPonccDetail(ponccId));
      this.dataDetail = detailResponse.data || [];

      // Load document import
      const docResponse = await firstValueFrom(this.ponccService.getDocumentImport(ponccId));
      this.dataDocumentImport = docResponse.data || [];

      // Populate form with existing data
      this.populateForm();
    } catch (error) {
      this.notification.error('Lỗi', 'Không thể tải dữ liệu PONCC');
    }
  }

  populateForm() {
    if (this.dataInput) {
      this.ponccForm.patchValue({
        ID: this.dataInput.ID,
        SupplierSaleID: this.dataInput.SupplierSaleID,
        POCode: this.dataInput.POCode,
        BillCode: this.dataInput.BillCode,
        EmployeeID: this.dataInput.EmployeeID,
        Company: this.dataInput.Company,
        RequestDate: new Date(this.dataInput.RequestDate),
        DeliveryDate: new Date(this.dataInput.DeliveryDate),
        Status: this.dataInput.Status,
        TotalMoneyPO: this.dataInput.TotalMoneyPO,
        CurrencyID: this.dataInput.CurrencyID,
        CurrencyRate: this.dataInput.CurrencyRate,
        Note: this.dataInput.Note,
        AddressDelivery: this.dataInput.AddressDelivery,
        OtherTerms: this.dataInput.OtherTerms,
        AccountNumberSupplier: this.dataInput.AccountNumberSupplier,
        BankCharge: this.dataInput.BankCharge,
        FedexAccount: this.dataInput.FedexAccount,
        OriginItem: this.dataInput.OriginItem,
        SupplierVoucher: this.dataInput.SupplierVoucher,
        BankSupplier: this.dataInput.BankSupplier,
        RuleIncoterm: this.dataInput.RuleIncoterm,
        OrderTargets: this.dataInput.OrderTargets,
        NCCNew: this.dataInput.NCCNew,
        DeptSupplier: this.dataInput.DeptSupplier,
        POType: this.dataInput.POType,
        ShippingPoint: this.dataInput.ShippingPoint,
        OrderQualityNotMet: this.dataInput.OrderQualityNotMet,
        ReasonForFailure: this.dataInput.ReasonForFailure,
        IsApproved: this.dataInput.IsApproved
      });
    }
  }

  async generateNewCodes() {
    try {
      // Lấy mã PO và BillCode từ backend (đã có logic tự động tạo mã)
      const [poCodeResponse, billCodeResponse] = await Promise.all([
        firstValueFrom(this.ponccService.getPOCode(this.ponccForm.value.SupplierSaleID)),
        firstValueFrom(this.ponccService.getBillCode({ POType: this.ponccForm.value.POType }))
      ]);
      
      this.ponccForm.patchValue({
        POCode: poCodeResponse.data || '',
        BillCode: billCodeResponse.data || ''
      });
    } catch (error) {
      console.error('Error generating codes:', error);
      this.notification.error('Lỗi', 'Không thể tạo mã tự động');
    }
  }

  // Table event handlers
  onDetailRowSelectionChanged(selectedRows: any[]) {
    this.selectedDetailRows = selectedRows;
  }

  onDetailCellEdited(cell: any) {
    const field = cell.getField();
    const value = cell.getValue();
    const rowData = cell.getRow().getData();
    
    // Handle product selection
    if (field === 'ProductCode') {
      this.onProductSelected(cell, value);
    }
    
    // Handle project selection
    if (field === 'ProjectCode') {
      this.onProjectSelected(cell, value);
    }
    
    // Handle số lượng và giá thay đổi
    if (['QtyRequest', 'UnitPrice', 'VAT', 'DiscountPercent', 'FeeShip'].includes(field)) {
      this.calculateRowTotals(rowData);
    }
    
    this.calculateGrandTotal();
  }

  onDocumentRowSelectionChanged(selectedRows: any[]) {
    this.selectedDocumentRows = selectedRows;
  }

  // Method để handle khi chọn product
  onProductSelected(cell: any, value: string): void {
    const product = this.dataProductSale.find(p => p.ProductCode === value);
    if (product) {
      const rowData = cell.getRow().getData();
      
      // Auto-fill các field liên quan
      cell.getRow().update({
        ...rowData,
        ProductCode: product.ProductCode,
        ProductName: product.ProductName,
        ProductNewCode: product.ProductNewCode,
        ProductGroupName: product.ProductGroupName,
        Unit: product.Unit,
        UnitPrice: product.UnitPrice || 0,
        PriceSale: product.PriceSale || 0,
        PriceHistory: product.PriceHistory || 0
      });
      
      // Tính lại tổng tiền
      this.calculateRowTotals(cell.getRow().getData());
    }
  }

  // Method để handle khi chọn project
  onProjectSelected(cell: any, value: string): void {
    const project = this.dataProject.find(p => p.ProjectCode === value);
    if (project) {
      const rowData = cell.getRow().getData();
      
      // Auto-fill project name
      cell.getRow().update({
        ...rowData,
        ProjectCode: project.ProjectCode,
        ProjectName: project.ProjectName
      });
    }
  }

  // Calculation methods
  calculateRowTotals(rowData: any) {
    const qty = parseFloat(rowData.QtyRequest) || 0;
    const unitPrice = parseFloat(rowData.UnitPrice) || 0;
    const vat = parseFloat(rowData.VAT) || 0;
    const discountPercent = parseFloat(rowData.DiscountPercent) || 0;
    const feeShip = parseFloat(rowData.FeeShip) || 0;

    // Calculate ThanhTien (subtotal)
    rowData.ThanhTien = qty * unitPrice;

    // Calculate discount
    rowData.Discount = rowData.ThanhTien * (discountPercent / 100);

    // Calculate VAT money
    rowData.VATMoney = (rowData.ThanhTien - rowData.Discount) * (vat / 100);

    // Calculate total price
    rowData.TotalPrice = rowData.ThanhTien - rowData.Discount + rowData.VATMoney + feeShip;

    // Update the row in table
    if (this.detailTableComp && this.detailTableComp.table) {
      this.detailTableComp.table.updateRow(rowData.ID, rowData);
    }
  }

  calculateGrandTotal() {
    const total = this.dataDetail.reduce((sum, item) => sum + (item.TotalPrice || 0), 0);
    this.ponccForm.patchValue({ TotalMoneyPO: total });
  }

  // CRUD operations for detail table
  addDetailRow() {
    const newRow: PONCCDetail = {
      ID: 0,
      STT: this.dataDetail.length + 1,
      PONCCID: this.ponccForm.get('ID')?.value || 0,
      ProductID: 0,
      Qty: 0,
      UnitPrice: 0,
      IntoMoney: 0,
      QtyRequest: 0,
      VAT: 0,
      ThanhTien: 0,
      TotalPrice: 0
    };

    this.dataDetail.push(newRow);
    if (this.detailTableComp && this.detailTableComp.table) {
      this.detailTableComp.table.addRow(newRow);
    }
  }

  deleteDetailRows() {
    if (this.selectedDetailRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn dòng cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedDetailRows.length} dòng đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.selectedDetailRows.forEach(row => {
          const index = this.dataDetail.findIndex(item => item.ID === row.ID);
          if (index > -1) {
            this.dataDetail.splice(index, 1);
          }
          if (this.detailTableComp && this.detailTableComp.table) {
            this.detailTableComp.table.deleteRow(row.ID);
          }
        });
        this.calculateGrandTotal();
        this.selectedDetailRows = [];
      }
    });
  }

  // Form submission
  async onSubmit() {
    if (this.ponccForm.invalid) {
      this.notification.error('Lỗi', 'Vui lòng kiểm tra lại thông tin nhập');
      return;
    }

    this.isLoading = true;
    try {
      const formData = this.ponccForm.value;
      
      // Prepare DTO
      const ponccDTO: PONCCDTO = {
        ...formData,
        lstPONCCDetail: this.dataDetail,
        lstPONCCRulePay: this.getSelectedRulePay(),
        lstDocumentImportPONCC: this.getSelectedDocuments(),
        lstPONCCDetailRequestBuy: [],
        lstBillImportDetail: [],
        lstPONCCDetailLog: []
      };

      const response = await firstValueFrom(this.ponccService.savePoncc(ponccDTO));
      
      if (response.success) {
        this.notification.success('Thành công', 'Lưu dữ liệu thành công');
        this.activeModal.close(response.data);
      } else {
        this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    } catch (error: any) {
      this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      this.isLoading = false;
    }
  }

  getSelectedRulePay(): PONCCRulePay[] {
    // Implementation depends on how rule pay selection is handled
    // This is a placeholder
    return [];
  }
  AddProduct(){
    
  }
  getSelectedDocuments(): DocumentImportPONCC[] {
    return this.dataDocumentImport.filter(doc => doc.IsSelected);
  }

  onCancel() {
    this.activeModal.dismiss();
  }

  // Event handlers for form changes
  onOrderQualityNotMetChange() {
    const orderQualityNotMet = this.ponccForm.get('OrderQualityNotMet')?.value;
    if (!orderQualityNotMet) {
      this.ponccForm.patchValue({ ReasonForFailure: '' });
    }
  }

  async onSupplierChange(): Promise<void> {
    const supplierCode = this.ponccForm.get('SupplierCode')?.value;
    if (supplierCode) {
      // Reload product data based on supplier
      await this.reloadProductData(supplierCode);
    }
  }

  // Method để reload data động khi cần
  async reloadProductData(supplierCode?: string): Promise<void> {
    try {
      // Có thể gọi API với filter
      const response = await firstValueFrom(this.ponccService.getProductSale());
      this.dataProductSale = response.data || [];
      
      // Filter theo supplier nếu có
      if (supplierCode) {
        this.dataProductSale = this.dataProductSale.filter(product => 
          product.SupplierCode === supplierCode || !product.SupplierCode
        );
      }
      
      // Refresh table để update dropdown
      if (this.detailTableComp) {
        this.detailTableComp.reloadData();
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  }

  async reloadProjectData(company?: number): Promise<void> {
    try {
      // Có thể gọi API với filter
      const response = await firstValueFrom(this.ponccService.getProject());
      this.dataProject = response.data || [];
      
      // Filter theo company nếu có
      if (company !== null && company !== undefined) {
        this.dataProject = this.dataProject.filter(project => 
          project.Company === company || project.Company === null
        );
      }
      
      // Refresh table để update dropdown
      if (this.detailTableComp) {
        this.detailTableComp.reloadData();
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  }

  onCurrencyChange() {
    // Handle currency change logic if needed
  }
}
