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

import { QuotationKhDetailServiceService } from './quotation-kh-detail-service/quotation-kh-detail-service.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { PokhService } from '../pokh/pokh-service/pokh.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-quotation-kh-detail',
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
  templateUrl: './quotation-kh-detail.component.html',
  styleUrl: './quotation-kh-detail.component.css',
})
export class QuotationKhDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;

  private mainTable!: Tabulator;

  @Input() groupedData: any[] = []; // Dữ liệu từ component cha truyền vào
  @Input() isEditMode: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private quotationKhDetailService: QuotationKhDetailServiceService,
    private customerPartService: CustomerPartService,
    private pokhService: PokhService,
    private RIDService: RequestInvoiceDetailService
  ) {}

  formData: any = this.getDefaultFormData();
  data: any[] = [];
  customers: any[] = [];
  contact: any[] = [];
  projects: any[] = [];
  products: any[] = [];
  Users: any[] = [];
  details: any[] = [];
  deletedQuotationKHDetailIds: number[] = [];
  selectedCustomer: any = null;

  showRTCCode: boolean = false;

  companyOptions = [
    { value: 'RTC', label: 'RTC' },
    { value: 'MVI', label: 'MVI' },
    { value: 'APR', label: 'APR' },
  ];
  statusOptions = [
    { value: 0, label: 'Chờ phản hồi' },
    { value: 1, label: 'Fail' },
    { value: 2, label: 'Thành PO' },
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.loadCustomer();
    this.loadProducts();
    this.loadProject();

    if (this.isEditMode && this.groupedData.length > 0) {
      this.handleEditModeData();
    }
  }
  ngAfterViewInit(): void {}
  closeModal() {
    this.activeModal.close();
  }
  handleEditModeData(): void {
    if (this.groupedData.length === 0) return;

    const firstGroup = this.groupedData[0];
    const mainData = firstGroup.MainData;
    const detailItems = firstGroup.items || [];

    // Đổ dữ liệu lên form
    this.formData = {
      id: mainData.ID,
      status: mainData.Status,
      code: mainData.QuotationCode,
      version: mainData.Version,
      poCode: mainData.POCode,
      totalPrice: mainData.TotalPrice,
      createDate: mainData.CreateDate
        ? mainData.CreateDate.substring(0, 10)
        : new Date().toISOString().split('T')[0],
      projectId: mainData.ProjectID,
      userId: mainData.UserID,
      comPercent: mainData.Commission ? mainData.Commission * 100 : 0,
      comMoney: mainData.ComMoney,
      comEnabled: false, // Mặc định tắt, có thể điều chỉnh theo logic nghiệp vụ
      quotationDate: mainData.QuotationDate
        ? mainData.QuotationDate.substring(0, 10)
        : new Date().toISOString().split('T')[0],
      company: mainData.Company || 'RTC',
      explanation: mainData.Explanation,
      dateMinutes: new Date().toISOString().split('T')[0],
      contactId: mainData.ContactID,
      employeePhone: '',
      departmentName: '',
      customerId: mainData.CustomerID,
      customerName: mainData.CustomerName,
      customerContact: mainData.ContactName,
      customerPhone: mainData.ContactPhone,
      customerAddress: '',
      receiver: '',
      receiverPhone: '',
      adminWarehouse: null,
    };

    // Load contact đúng của khách hàng và cập nhật lại các trường liên hệ
    if (mainData.CustomerID) {
      this.loadContact(mainData.CustomerID);
      // Đợi contact load xong rồi gán lại các trường liên hệ
      setTimeout(() => {
        const contactItem = this.contact.find(
          (c: any) => c.ID === mainData.ContactID
        );
        if (contactItem) {
          this.formData.contactId = contactItem.ID;
        }
      }, 300);
    }

    // Load project data nếu có projectId
    if (mainData.ProjectID) {
      setTimeout(() => {
        this.onProjectChange(mainData.ProjectID);
      }, 200);
    }
    // Đổ dữ liệu chi tiết lên bảng
    if (detailItems.length > 0) {
      const tableData = detailItems.map((item: any, index: number) => ({
        ID: item.ID,
        STT: index + 1,
        IsSelected: false,
        ProductNewCode: item.ProductNewCode || '',
        ProductRTCCode: item.ProductID || '',
        ProductCode: item.ProductCode || '',
        ProductName: item.ProductName || '',
        InternalCode: item.InternalCode || '',
        Maker: item.Maker || '',
        Unit: item.Unit || '',
        Qty: Number(item.Qty) || 0,
        UnitPrice: Number(item.UnitPrice) || 0,
        IntoMoney: Number(item.IntoMoney) || 0,
        TypeOfPrice: item.TypeOfPrice || '',
        UnitPriceImport: Number(item.UnitPriceImport) || 0,
        TotalPriceImport: Number(item.TotalPriceImport) || 0,
        GiaNet: Number(item.GiaNet) || 0,
        Note: item.Note || '',
        GroupQuota: item.GroupQuota || '',
      }));

      // Cập nhật dữ liệu cho bảng nếu đã được khởi tạo
      if (this.mainTable) {
        this.mainTable.setData(tableData);
        this.details = tableData;
        this.calculateFinishTotal();
      } else {
        // Lưu dữ liệu để đổ vào bảng sau khi bảng được khởi tạo
        this.data = tableData;
        this.details = tableData;
      }
    }
  }
  saveAndClose() {
    const QUOTATION_KH = {
      ID: this.formData.id,
      QuotationCode: this.formData.code,
      Version: '',
      ProjectID: this.formData.projectId,
      UserID: this.formData.userId,
      POCode: this.formData.poCode,
      CustomerID: this.formData.customerId,
      Explanation: this.formData.explanation,
      IsApproved: false,
      TotalPrice: this.formData.totalPrice,
      CreatedDate: new Date(),
      QuotationDate: this.formData.quotationDate,
      Status: this.formData.status,
      ContactID: this.formData.contactId,
      Month: new Date().getMonth() + 1,
      Year: new Date().getFullYear(),
      UserName: 0,
      CreateDate: this.formData.createDate,
      Commission: this.formData.comPercent / 100,
      ComMoney: this.formData.comMoney,
      Company: this.formData.company,
      IsMerge: false,
    };

    const QUOTATION_DETAIL = this.mainTable.getData().map((item) => {
      const product = this.products.find(
        (p) => p.ProductNewCode === item.ProductRTCCode
      );
      return {
        ...item,
        ProductID: product ? product.ID : null,
        InternalName: item.InternalCode,
      };
    });

    const PAYLOAD = {
      quotationKHs: QUOTATION_KH,
      quotationKHDetails: QUOTATION_DETAIL,
      DeletedDetailIds: this.deletedQuotationKHDetailIds,
    };

    this.quotationKhDetailService.save(PAYLOAD).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thành công', 'Lưu dữ liệu thành công');
          // Đóng modal và trả về kết quả để reload data ở component cha
          this.activeModal.close({
            success: true,
            reloadData: true,
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message);
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err);
      },
    });
  }
  onAddCustomer() {
    alert('Thêm khách hàng mới!');
  }
  onAddProject() {
    alert('Thêm dự án mới!');
  }
  //#region Các hàm load dữ liệu
  loadUsers(): void {
    this.quotationKhDetailService.getUser().subscribe(
      (response) => {
        if (response.status === 1) {
          this.Users = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu User:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải User:', error);
      }
    );
  }
  loadCustomer(): void {
    this.customerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu Customer:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải Customer:', error);
      }
    );
  }

  loadProject(): void {
    this.pokhService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu projects:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải projects:', error);
      }
    );
  }

  loadContact(id: number): void {
    this.quotationKhDetailService.getCustomerContact(id).subscribe(
      (response) => {
        if (response.status === 1) {
          this.contact = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu contact:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải contact:', error);
      }
    );
  }

  loadCode(customerId: number, createDate: string): void {
    this.quotationKhDetailService
      .generateCode(customerId, '2025-07-02')
      .subscribe(
        (response) => {
          if (response.status === 1) {
            this.formData.code = response.data;
          } else {
            this.notification.error(
              'Lỗi khi tải dữ liệu contact:',
              response.message
            );
          }
        },
        (error) => {
          this.notification.error('Lỗi kết nối khi tải contact:', error);
        }
      );
  }
  loadProducts(): void {
    this.RIDService.loadProductSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.products = response.data;
          this.initMainTable();
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu products:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải products:', error);
      }
    );
  }
  //#endregion
  onCustomerChange(customerId: number, contactId?: number): void {
    this.selectedCustomer = this.customers.find((c) => c.ID === customerId);
    this.formData.customerId = customerId;
    this.loadCode(customerId, this.formData.createDate);
    this.loadContact(customerId);
    this.formData.contactId = contactId ?? -1;
  }
  onProjectChange(projectId: number): void {
    if (!projectId) return;
    const project = this.projects.find((p: any) => p.ID === projectId);
    if (project) {
      this.formData.userId = project.UserID;
      this.onCustomerChange(project.CustomerID, project.ContactID);
    }
  }
  onContactChange(contactId: number): void {
    const ITEM = this.contact.find((c: any) => c.ID === contactId);
    if (ITEM == null || ITEM == undefined) {
      return;
    } else {
      this.formData.customerPhone = ITEM.ContactPhone;
    }
  }
  getDefaultFormData(): any {
    return {
      status: 0,
      code: '',
      poCode: '',
      totalPrice: '',
      createDate: new Date().toISOString().split('T')[0],
      projectId: '',
      comPercent: 0,
      comMoney: '',
      comEnabled: false,
      quotationDate: new Date().toISOString().split('T')[0],
      company: 'RTC',
      explanation: '',
      dateMinutes: new Date().toISOString().split('T')[0],
      contactId: null,
      employeePhone: '',
      departmentName: '',
      customerId: null,
      customerName: null,
      customerContact: '',
      customerPhone: '',
      customerAddress: '',
      receiver: '',
      receiverPhone: '',
      adminWarehouse: null,
    };
  }
  formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9-]/g, ''));
  };
  addNewRow(): void {
    const newRow = {
      STT: this.details.length + 1,
      IsSelected: false,
      ProductNewCode: '',
      ProductCode: '',
      ProductName: '',
      InternalCode: '',
      Maker: '',
      Unit: '',
      Qty: 0,
      UnitPrice: 0,
      IntoMoney: 0,
      TypeOfPrice: '',
      UnitPriceImport: 0,
      TotalPriceImport: 0,
      GiaNet: 0,
      Note: '',
      GroupQuota: '',
    };
    this.mainTable.addRow(newRow);
  }

  initMainTable(): void {
    this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      data: this.data,
      layout: 'fitDataFill',
      height: '60vh',
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columns: [
        {
          title: '',
          field: 'actions',
          formatter: (cell) => {
            return `<i class="bi bi-trash3 text-danger delete-btn" style="font-size:15px; cursor: pointer;"></i>`;
          },
          width: 20,
          hozAlign: 'center',
          cellClick: (e, cell) => {
            if ((e.target as HTMLElement).classList.contains('delete-btn')) {
              this.modal.confirm({
                nzTitle: 'Xác nhận xóa',
                nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
                nzOkText: 'Đồng ý',
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                  const row = cell.getRow();
                  const rowData = row.getData();

                  if (rowData['ID']) {
                    this.deletedQuotationKHDetailIds.push(rowData['ID']);
                  }
                  row.delete();
                  this.details = this.mainTable.getData();
                },
              });
            }
          },
        },
        { title: 'STT', field: 'STT', width: 60, editor: 'input' },
        {
          title: 'Select',
          field: 'IsSelected',
          sorter: 'boolean',
          width: 80,
          formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} style="width: 16px; height: 16px; cursor: pointer;"/>
          </div>`;
          },
          cellClick: (e, cell) => {
            if ((e.target as HTMLInputElement).type === 'checkbox') {
              const currentValue = cell.getValue();
              cell.setValue(!currentValue);
            }
          },
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 200,
          editor: 'input',
        },
        {
          title: 'Mã RTC',
          field: 'ProductRTCCode',
          width: 200,
          editor: 'list',
          visible: false,
          editorParams: {
            values: this.products.map((item) => ({
              label: item.ProductCode + ' - ' + item.ProductName,
              value: item.ID,
            })),
          },
          formatter: (cell) => {
            const id = cell.getValue();
            const product = this.products.find((p) => p.ID === id);
            return product ? product.ProductNewCode : id;
          },
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 150,
          editor: 'input',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          width: 150,
          editor: 'input',
        },
        {
          title: 'Mã báo khách',
          field: 'InternalCode',
          width: 150,
          editor: 'input',
        },
        { title: 'Hãng', field: 'Maker', width: 120, editor: 'input' },
        { title: 'Đơn vị', field: 'Unit', width: 120, editor: 'input' },
        { title: 'Số lượng', field: 'Qty', width: 120, editor: 'number' },
        {
          title: 'Đơn giá báo trước VAT',
          field: 'UnitPrice',
          width: 150,
          editor: 'input',
          formatter: 'money',
        },
        {
          title: 'Thành tiền trước VAT',
          field: 'IntoMoney',
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
          title: 'Loại tiền',
          field: 'TypeOfPrice',
          width: 120,
          editor: 'input',
        },
        {
          title: 'Đơn giá nhập',
          field: 'UnitPriceImport',
          width: 150,
          editor: 'input',
          formatter: 'money',
        },
        {
          title: 'Tổng giá nhập',
          field: 'TotalPriceImport',
          width: 150,
          editor: 'input',
          formatter: 'money',
        },
        {
          title: 'Giá NET',
          field: 'GiaNet',
          width: 120,
          editor: 'input',
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
        { title: 'Ghi chú', field: 'Note', width: 120, editor: 'input' },
        { title: 'Nhóm', field: 'GroupQuota', width: 120, editor: 'input' },
      ],
    });
    // Thêm sự kiện cellEdited để auto-fill các trường khi chọn Mã RTC
    this.mainTable.on('cellEdited', (cell) => {
      if (cell.getColumn().getField() === 'ProductRTCCode') {
        const selectedProduct = this.products.find(
          (p) => p.ID === cell.getValue()
        );
        if (selectedProduct) {
          const row = cell.getRow();
          row.update({
            ProductNewCode: selectedProduct.ProductCode,
            ProductName: selectedProduct.ProductName,
            Unit: selectedProduct.Unit,
            Maker: selectedProduct.Maker,
          });
        }
      }
      this.handleCellValueChange(cell);
    });
  }

  handleCellValueChange(cell: any): void {
    const row = cell.getRow();
    const columnField = cell.getColumn().getField();
    const rowData = row.getData();

    const quantity = Number(rowData.Qty) || 0;
    const unitPrice = Number(rowData.UnitPrice) || 0;
    const unitPriceImport = Number(rowData.UnitPriceImport) || 0;

    try {
      // Tính toán khi thay đổi Qty, UnitPrice hoặc UnitPriceImport
      if (
        columnField === 'Qty' ||
        columnField === 'UnitPrice' ||
        columnField === 'UnitPriceImport'
      ) {
        const intoMoney = quantity * unitPrice;
        const totalPriceImport = quantity * unitPriceImport;

        row.update({
          IntoMoney: intoMoney,
          TotalPriceImport: totalPriceImport,
        });

        this.calculateFinishTotal();
      }

      // Tính lại tiền COM khi thay đổi Giá NET
      if (columnField === 'GiaNet') {
        this.calculateFinishTotal();
      }

      // Xử lý khi thay đổi ProductNewCode
      if (columnField === 'ProductNewCode') {
        const selectedProduct = this.products.find(
          (p) => p.ProductNewCode === cell.getValue()
        );
        if (selectedProduct) {
          row.update({
            ProductRTCCode: selectedProduct.ID,
            ProductName: selectedProduct.ProductName,
            ProductCode: selectedProduct.ProductCode,
            Maker: selectedProduct.Maker,
            Unit: selectedProduct.Unit,
          });
        }
      }
    } catch (error) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi:' + error);
    }
  }

  onCommissionPercentChange(): void {
    this.calculateFinishTotal();
  }

  onCommissionEnabledChange(): void {
    this.calculateFinishTotal();
  }

  onRTCCodeToggle(checked: boolean) {
    this.showRTCCode = checked;
    if (this.mainTable) {
      if (checked) {
        this.mainTable.getColumn('ProductNewCode').hide();
        this.mainTable.getColumn('ProductRTCCode').show();
      } else {
        this.mainTable.getColumn('ProductNewCode').show();
        this.mainTable.getColumn('ProductRTCCode').hide();
      }
    }
  }

  calculateFinishTotal(): void {
    if (!this.mainTable) return;

    const allData = this.mainTable.getData();
    let totalIntoMoney = 0;
    let totalGiaNet = 0;

    allData.forEach((row: any) => {
      totalIntoMoney += Number(row.IntoMoney) || 0;
      totalGiaNet += Number(row.GiaNet) || 0;
    });

    // Cập nhật tổng tiền vào formData
    this.formData.totalPrice = totalIntoMoney;

    // Tính toán commission money
    const comPercent = Number(this.formData.comPercent) || 0;
    const comEnabled = this.formData.comEnabled;

    if (comEnabled) {
      // Nếu commission được bật, tính dựa trên (total - gianet) * comPercent
      this.formData.comMoney =
        (totalIntoMoney - totalGiaNet) * (comPercent / 100);
    } else {
      // Nếu commission tắt, tính dựa trên total * comPercent
      this.formData.comMoney = totalIntoMoney * (comPercent / 100);
    }

    // Format commission money để hiển thị
    this.formData.comMoney = Number(this.formData.comMoney.toFixed(0));

    console.log('Tổng thành tiền:', totalIntoMoney);
    console.log('Tổng giá NET:', totalGiaNet);
  }
}
