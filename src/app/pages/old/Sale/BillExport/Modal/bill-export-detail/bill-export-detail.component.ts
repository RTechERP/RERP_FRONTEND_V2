import { Component, OnInit, AfterViewInit, ViewChild, Input, EnvironmentInjector, ApplicationRef, Type, createComponent } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from 'bootstrap';

import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProductSaleDetailComponent } from '../../../ProductSale/product-sale-detail/product-sale-detail.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { ProductsaleServiceService } from '../../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { SelectControlComponent } from '../select-control/select-control.component';
import { ProjectComponent } from '../../../../project/project.component';
import { HistoryDeleteBillComponent } from '../history-delete-bill/history-delete-bill.component';


interface ProductSale {
  Id?: number;
  ProductCode: string;
  ProductName: string;
  Maker: string;
  Unit: string;
  AddressBox:string;
  NumberInStoreDauky: number;
  NumberInStoreCuoiKy: number;
  ProductGroupID: number;
  LocationID: number;
  FirmID: number;
  Note: string;
}
interface BillExport {
  Id?: number;
  TypeBill: boolean;
  Code: string;
  Address: string;
  CustomerID: number;
  UserID: number;
  SenderID: number;
  WarehouseType: string;
  GroupID: string;
  KhoTypeID: number;
  ProductType: number;
  AddressStockID: number;
  WarehouseID: number;
  Status: number;
  SupplierID: number;
  CreatDate: Date | string;
  RequestDate: Date | string;
}
@Component({
  selector: 'app-bill-export-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NgbModule,
    NzDividerModule,
    NzDatePickerModule,
    ProductSaleDetailComponent,
    SelectControlComponent,
  ],
  templateUrl: './bill-export-detail.component.html',
  styleUrl: './bill-export-detail.component.css'
})
export class BillExportDetailComponent implements OnInit, AfterViewInit {
  table_billExportDetail: any;
  dataTableBillExportDetail: any[] = [];

  dataCbbUser: any[] = [];
  dataCbbCustomer: any[] = [];
  dataCbbAdressStock: any[] = [];
  datCbbSupplierSale: any[] = [];
  dataCbbProductGroup: any[] = [];
  dataCbbSender: any[] = [];
  dataCbbSupplier: any[] = [];
  customerID: number = 0;

  dataProductSale: any = [];
  productOptions: any = [];
  projectOptions: any = [];
  billID:number=0;
  deletedDetailIds: any=[];
  @Input() isCheckmode: any;
  @Input() selectedList: any[] = [];
  @Input() id: number = 0;
  
  cbbStatus: any = [
    { ID: 0, Name: "Mượn" },
    { ID: 1, Name: "Tồn Kho" },
    { ID: 2, Name: "Đã Xuất Kho" },
    { ID: 5, Name: "Xuất trả NCC" },
    { ID: 6, Name: "Yêu cầu xuất kho" },
  ];
  cbbProductType: any = [
    { ID: 1, Name: "Hàng thương mại" },
    { ID: 2, Name: "Hàng dự án" },
  ]
  dateFormat = 'dd/MM/yyyy';
  newProductSale: ProductSale = {
    ProductCode: '',
    ProductName: '',
    Maker: '',
    Unit: '',
    AddressBox:'',
    NumberInStoreDauky: 0,
    NumberInStoreCuoiKy: 0,
    ProductGroupID: 0,
    LocationID: 0,
    FirmID: 0,
    Note: '',
  };
  @Input() newBillExport: BillExport = {
    TypeBill: false,
    Code: '',
    Address: '',
    CustomerID: 0,
    UserID: 0,
    SenderID: 0,
    WarehouseType: "",
    GroupID: "",
    KhoTypeID: 0,
    ProductType: 0,
    AddressStockID: 0,
    WarehouseID: 0,
    Status: 0,
    SupplierID: 0,
    CreatDate: new Date(),
    RequestDate: new Date(),
  };

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private modal: NzModalService,
    private billExportService: BillExportService,
    private productSaleService: ProductsaleServiceService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.getDataCbbAdressStock();
    this.getDataCbbCustomer();
    this.getDataCbbProductGroup();
    this.getDataCbbSender();
    this.getDataCbbUser();
    this.getDataCbbSupplierSale();
 
    this.loadOptionProject();
    if(this.isCheckmode==true){
      this.getBillExportByID();
      // this.getBillExportDetailID();
    }
    else{
      this.getNewCode();
      this.newBillExport = {
        TypeBill: false,
        Code: '',
        Address: '',
        CustomerID: 0,
        UserID: 0,
        SenderID: 0,
        WarehouseType: "",
        GroupID: "",
        KhoTypeID: 0,
        ProductType: 0,
        AddressStockID: 0,
        WarehouseID: 0,
        Status: 0,
        SupplierID: 0,
        CreatDate: new Date(),
        RequestDate: new Date(),
      };
    }
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  getBillExportByID() {
    this.billExportService.getBillExportByID(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.newBillExport = {
            Id: data.ID,
            TypeBill: data.TypeBill,
            Code: data.Code,
            Address: data.Address,
            CustomerID: data.CustomerID,
            UserID: data.UserID,
            SenderID: data.SenderID,
            WarehouseType: data.WarehouseType,
            GroupID: data.GroupID,
            KhoTypeID: data.KhoTypeID,
            ProductType: data.ProductType,
            AddressStockID: data.AddressStockID,
            WarehouseID: data.WarehouseID,
            Status: data.Status,
            SupplierID: data.SupplierID,
            CreatDate: data.CreatDate,
            RequestDate: data.RequestDate,
          };
          // Gọi changeProductGroup để tải productOptions
          this.changeProductGroup(this.newBillExport.KhoTypeID);
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể lấy thông tin phiếu xuất!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin!');
        console.error(err);
      }
    });
  }
  
  getBillExportDetailID() {
    this.billExportService.getBillExportDetail(this.id).subscribe({
      next: (res) => {
        if (res?.data) {
          const rawData = Array.isArray(res.data) ? res.data : [res.data];
          this.billID = rawData[0].BillID;
  
          this.dataTableBillExportDetail = rawData.map((item: any) => {
            const productInfo = this.productOptions.find((p: any) => p.value === item.ProductID) || {};
            // Nếu không tìm thấy sản phẩm, gọi getProductById để tải bổ sung
            // if (!productInfo.value && item.ProductID) {
            //   this.getProductById(item.ProductID);
            // }
            const projectInfo = this.projectOptions.find((p: any) => p.value === item.ProjectID) || {};
            return {
              ID: item.ID || 0,
              POKHDetailID: item.POKHDetailID || 0,
              ProductID: item.ProductID || 0,
              ProductNewCode: item.ProductNewCode || productInfo.ProductNewCode || '',
              ProductCode: item.ProductCode || productInfo.ProductCode || '',
              ProductName: item.ProductName || productInfo.ProductName || '',
              Unit: item.Unit || productInfo.Unit || '',
              TotalInventory: item.TotalInventory || productInfo.TotalInventory || 0,
              Qty: item.Qty || 0,
              QuantityRemain: item.QuantityRemain || 0,
              ProjectID: item.ProjectID || 0,
              ProjectCodeExport: item.ProjectCodeExport || projectInfo.ProjectCode || '',
              ProjectNameText: item.ProjectNameText || projectInfo.label || '',
              ProductFullName: item.ProductFullName || '',
              Note: item.Note || '',
              UnitPricePOKH: item.UnitPricePOKH || 0,
              UnitPricePurchase: item.UnitPricePurchase || 0,
              BillCode: item.BillCode || '',
              Specifications: item.Specifications || '',
              GroupExport: item.GroupExport || '',
              UserReceiver: item.UserReceiver || '',
              POKHID: item.POKHID || 0,
              'Add Serial': item.SerialNumber || '',
              ProductType: item.ProductType || 0,
              IsInvoice: item.IsInvoice || false,
              InvoiceNumber: item.InvoiceNumber || '',
              SerialNumber: item.SerialNumber || '',
              ReturnedStatus: item.ReturnedStatus || false,
              ProjectPartListID: item.ProjectPartListID || 0,
              TradePriceDetailID: item.TradePriceDetailID || 0,
              BillImportDetailID: item.BillImportDetailID || 0,
              ExpectReturnDate: item.ExpectReturnDate ? new Date(item.ExpectReturnDate) : new Date(),
              InventoryProjectIDs: item.ProjectID ? [item.ProjectID] : [],
            };
          });
  
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
            setTimeout(() => {
              this.table_billExportDetail.redraw(true);
            }, 100);
          }
        } else {
          this.notification.warning('Thông báo', res.message || 'Không có dữ liệu chi tiết phiếu xuất!');
          this.dataTableBillExportDetail = [];
          if (this.table_billExportDetail) {
            this.table_billExportDetail.replaceData([]);
          }
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy thông tin chi tiết phiếu xuất!');
        console.error(err);
        this.dataTableBillExportDetail = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
      }
    });
  }
  
  getProductById(productId: number) {
    this.productSaleService.getDataProductSalebyID(productId).subscribe({
      next: (res: any) => {
        if (res?.data) {
          const product = res.data;
          if (!this.productOptions.find((p:any) => p.value === product.ID)) {
            this.productOptions.push({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductNewCode: product.ProductNewCode,
            });
            if (this.table_billExportDetail) {
              this.table_billExportDetail.redraw(true); // Làm mới bảng để hiển thị sản phẩm mới
            }
          }
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi lấy thông tin sản phẩm!');
      }
    });
  }
  
  loadOptionProject() {
    this.billExportService.getOptionProject().subscribe({
      next: (res: any) => {
        console.log("pj", res.data);
        const projectData = res.data;
        if (Array.isArray(projectData)) {
          this.projectOptions = projectData.filter(project => project.ID !== null && project.ID !== undefined && project.ID !== 0)
            .map(project => { // <-- SỬA Ở ĐÂY
              return {
                label: project.ProjectName,
                value: project.ID,
                ProjectCode: project.ProjectCode,
              };
            });
        } else {
          this.projectOptions = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy danh sách dự án');
        this.projectOptions = [];
      }

    })
  }
  changeProductGroup(ID: number) {
    if (!ID) {
      this.productOptions = [];
      if (this.table_billExportDetail) {
        this.table_billExportDetail.replaceData([]);
      }
      return;
    }
    this.billExportService.getOptionProduct(ID).subscribe({
      next: (res: any) => {
        const productData = res.data;
        if (Array.isArray(productData)) {
          this.productOptions = productData
            .filter(product => product.ID !== null && product.ID !== undefined && product.ID !== 0)
            .map(product => ({
              label: product.ProductName,
              value: product.ID,
              ProductCode: product.ProductCode,
              TotalInventory: product.TotalQuantityLast,
              ProductName: product.ProductName,
              Unit: product.Unit,
              Note: product.Note,
              ProductID: product.ID,
              ProductNewCode: product.ProductNewCode,
            }));
        } else {
          this.productOptions = [];
          console.warn("Dữ liệu sản phẩm không phải mảng:", productData);
        }
  
        // Gọi getBillExportDetailID nếu ở chế độ chỉnh sửa
        if (this.isCheckmode) {
          this.getBillExportDetailID();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi khi tải danh sách sản phẩm!');
        this.productOptions = [];
        if (this.table_billExportDetail) {
          this.table_billExportDetail.replaceData([]);
        }
      }
    });
  }
  getNewCode() {
    this.billExportService.getNewCodeBillExport(this.newBillExport.Status).subscribe({
      next: (res:any) => {
        console.log('New code received:', res);
        this.newBillExport.Code = res.data;
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi mã phiếu');
      }
    });
  }
  changeStatus() {
    this.getNewCode();
  }
  getDataCbbSupplierSale() {
    this.billExportService.getCbbSupplierSale().subscribe({
      next: (res: any) => {
        this.dataCbbSupplier = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbUser() {
    this.billExportService.getCbbUser().subscribe({
      next: (res: any) => {
        this.dataCbbUser = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbSender() {
    this.billExportService.getCbbSender().subscribe({
      next: (res: any) => {
        this.dataCbbSender = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbAdressStock() {
    this.billExportService.getCbbAddressStock(this.customerID).subscribe({
      next: (res: any) => {
        this.dataCbbAdressStock = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  getDataCbbCustomer() {
    this.billExportService.getCbbCustomer().subscribe({
      next: (res: any) => {
        this.dataCbbCustomer = res.data;
        console.log("d", this.dataCbbCustomer);
      },
      error: () => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  changeCustomer() {
    const id = this.newBillExport.CustomerID;
    this.billExportService.getCustomerByID(id).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.newBillExport.Address = res.data.Address;
          console.log("Address:", this.newBillExport.Address);
        } else {
          console.warn("Không tìm thấy địa chỉ khách hàng");
          this.newBillExport.Address = '';
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu khách hàng', err);
      }
    });
    this.billExportService.getCbbAddressStock(id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.dataCbbAdressStock = Array.isArray(res.data) ? res.data : [];
        }
      }, error: (err) => {
        console.error('Lỗi khi lấy dữ liệu', err);
      }
    });
  }
  getDataCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.dataCbbProductGroup = res.data;
      },
      error: (err: any) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy dữ liệu');
      }
    });
  }
  //#region dong mo modal
  openModalNewProduct() {
    this.newProductSale = {
      ProductCode: '',
      ProductName: '',
      Maker: '',
      Unit: '',
      AddressBox:'',
      NumberInStoreDauky: 0,
      NumberInStoreCuoiKy: 0,
      ProductGroupID: 0,
      LocationID: 0,
      FirmID: 0,
      Note: '',
    };
    const modalRef = this.modalService.open(ProductSaleDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.newProductSale = this.newProductSale;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedList = [];
    modalRef.componentInstance.id = 0;
    modalRef.result.catch((result: any) => {
      if (result == true) {
        // Xử lý reload nếu cần
      }
    });
  }
  closeModal() {
    this.activeModal.close();
  }
  addRow() {
    if (this.table_billExportDetail) {
      this.table_billExportDetail.addRow({
        // ID: 0,
        ProductNewCode: '',
        ProductCode: null, // cần là null để select hoạt động
        TotalInventory: 0,
        ProductName: '',
        ProductFullName: '',
        Unit: '',
        Qty: 0,
        ProductGroupName: '',
        ProductTypeText: '',
        Note: '',
        UnitPricePOKH: 0,
        UnitPricePurchase: 0,
        BillCode: '',
        ProjectCodeExport: '',
        ProjectNameText: ''
      });
    }
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    // Thêm tham số config để nhận cấu hình
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      // Truyền các cấu hình vào instance của component
      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => { });

      return container;
    };
  }
  //#region Ve bang
  drawTable() {
    console.log("data", this.dataTableBillExportDetail)
    // Đảm bảo productOptions có dữ liệu
    if (this.table_billExportDetail) {
      this.table_billExportDetail.replaceData(this.dataTableBillExportDetail);
    } else {
   
      this.table_billExportDetail = new Tabulator('#table_BillExportDetails', {
        data: this.dataTableBillExportDetail,
        layout: 'fitDataFill',
        height: "38vh",
        pagination: true,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: "",
            field: "addRow",
            hozAlign: "center",
            width: 40,
            headerSort: false,
            titleFormatter: () => `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => { this.addRow(); },
            formatter: () => `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,

            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();
                    console.log('Row Data:', rowData); // Debug toàn bộ dữ liệu dòng
                    console.log('ID to delete:', rowData['ID']); // Debug ID
                    if (rowData['ID']) {
                      this.deletedDetailIds.push(rowData['ID']);
                      console.log('Updated deletedDetailIds:', this.deletedDetailIds); // Debug mảng
                    }
                    row.delete();
                  }
                });
              }
            }
          },
          {
            title: "STT",
            formatter: "rownum",
            hozAlign: "center",
            width: 60,
            headerSort: false,
        },
        { title: "ID", field: "ID", hozAlign: "center", width: 60, headerSort: false, },
          { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'left', headerHozAlign: 'center' },
          {
            title: 'Mã sản phẩm',
            field: 'ProductID',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 450,
            // SỬ DỤNG EDITOR MỚI
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.productOptions,
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted">Chọn sản phẩm</p> <i class="fas fa-angle-down"></i></div>';
              }
              const product = this.productOptions.find((p: any) => p.value === val);
              console.log('ProductID:', val, 'Found Product:', product); // Debug
              const productCode = product ? product.ProductCode : 'Chưa có dữ liệu';
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${productCode}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              // cell là component của ô vừa được chỉnh sửa
              const row = cell.getRow();
              const newValue = cell.getValue(); // ID của sản phẩm mới

              // 1. Tìm thông tin đầy đủ của sản phẩm vừa được chọn
              const selectedProduct = this.productOptions.find((p: any) => p.value === newValue);

              // 2. Nếu tìm thấy sản phẩm, cập nhật các ô khác trên cùng một dòng
              if (selectedProduct) {
                row.update({
                  'ProductCode': selectedProduct.ProductCode,
                  'ProductNewCode': selectedProduct.ProductNewCode,
                  'Unit': selectedProduct.Unit || '', // Tự động điền Đơn vị tính
                  'TotalInventory': selectedProduct.TotalInventory || 0, // Tự động điền SL tồn
                  'ProductName': selectedProduct.ProductName, // Cập nhật lại tên chi tiết sản phẩm
                });
              }
            },
          },
          { title: 'SL tồn', field: 'TotalInventory', hozAlign: 'right', headerHozAlign: 'center' },
          { title: 'Mã sp theo dự án', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Tên sản phẩm', field: 'ProductName', hozAlign: 'center', headerHozAlign: 'center' },
          { title: 'ĐVT', field: 'Unit', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'SL xuất', field: 'Qty', hozAlign: 'right', headerHozAlign: 'center', editor: 'input' },
          { title: 'SL còn lại', field: 'QuantityRemain', hozAlign: 'right', headerHozAlign: 'center', editor: 'input' },
          {
            title: 'Dự án', field: 'ProjectID', hozAlign: 'left', headerHozAlign: 'center',
            width: 200,
            editor: this.createdControl(
              SelectControlComponent,
              this.injector,
              this.appRef,
              () => this.projectOptions,
              // Cung cấp thêm đối tượng cấu hình
              {
                valueField: 'value',
                labelField: 'label',
              }
            ),
            // SỬ DỤNG FORMATTER MỚI ĐỂ HIỂN THỊ ĐẸP HƠN
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                // Hiển thị placeholder nếu chưa có giá trị
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              // Tìm label tương ứng với value để hiển thị
              const project = this.projectOptions.find((p: any) => p.value === val);
              const projectName = project ? project.label : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${projectName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            cellEdited: (cell) => {
              // cell là component của ô vừa được chỉnh sửa
              const row = cell.getRow();
              const newValue = cell.getValue(); // ID của sản phẩm mới

              // 1. Tìm thông tin đầy đủ của sản phẩm vừa được chọn
              const selectedProject = this.projectOptions.find((p: any) => p.value === newValue);

              // 2. Nếu tìm thấy sản phẩm, cập nhật các ô khác trên cùng một dòng
              if (selectedProject) {
                row.update({  
                  'ProjectCodeExport':selectedProject.ProjectCode,   
                  InventoryProjectIDs: [newValue]          
                });
              }
            },
           },
          { title: 'Mã dự án', field: 'ProjectCodeExport', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Ghi chú (PO)', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Đơn giá bán', field: 'UnitPricePOKH', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Đơn giá mua', field: 'UnitPricePurchase', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Mã đơn hàng', field: 'BillCode', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Thông số kỹ thuật', field: 'Specifications', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Nhóm', field: 'GroupExport', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Người nhận', field: 'UserReceiver', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'Mã sp xuất dự án', field: 'ProductFullName', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          { title: 'POKHID', field: 'POKHID', hozAlign: 'left', headerHozAlign: 'center' },
          { title: 'Add Serial', field: 'Add Serial', hozAlign: 'left', headerHozAlign: 'center' },
        ]
      });
    }
  }
 
  //#endregion
  //hàm save bill export
  saveDataBillExport() {
    console.log('saveDataBillExport called');
    
    // Kiểm tra dữ liệu bắt buộc
    if (!this.newBillExport.CustomerID || !this.newBillExport.UserID || !this.newBillExport.SenderID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    // Kiểm tra dữ liệu trong bảng
    const billExportDetailsFromTable = this.table_billExportDetail?.getData();
    if (!billExportDetailsFromTable || billExportDetailsFromTable.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng thêm ít nhất một sản phẩm vào bảng!');
      return;
    }
    //Cập nhật
    if (this.isCheckmode == true) {
      // Update existing bill export
      const payload = {
        BillExport: {
          ID: this.newBillExport.Id,
          Code: this.newBillExport.Code,
          TypeBill: false,
          SupplierID: this.newBillExport.SupplierID,
          CustomerID: this.newBillExport.CustomerID,
          UserID: this.newBillExport.UserID,
          SenderID: this.newBillExport.SenderID,
          StockID: this.newBillExport.AddressStockID,
          Description: "",
          Address: this.newBillExport.Address,
          Status: this.newBillExport.Status,
          GroupID: this.newBillExport.GroupID,
          WarehouseType: this.newBillExport.WarehouseType,
          KhoTypeID: this.newBillExport.KhoTypeID,
          UpdatedDate: new Date(),
          CreateDate: this.newBillExport.CreatDate,
          ProductType: this.newBillExport.ProductType,
          AddressStockID: this.newBillExport.AddressStockID,
          WarehouseID: this.newBillExport.WarehouseID,
          RequestDate: this.newBillExport.RequestDate,
          BillDocumentExportType: 2,
        },
        billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log("đay la payload", payload)
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Cập nhật thành công!');
            this.closeModal();
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể cập nhật phiếu xuất!');
          }
        },
        error: (err: any) => {
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật!');
          console.error(err);
        }
      });
    } else {
      // Add new bill export
      const wareHouseCode = this.dataCbbProductGroup.find((p: any) => p.ID === this.newBillExport.KhoTypeID);
      
      const payload = {
        BillExport: {
          ID:this.newBillExport.Id || 0,
          Code: this.newBillExport.Code,
          TypeBill: false,
          SupplierID: this.newBillExport.SupplierID,
          CustomerID: this.newBillExport.CustomerID,
          UserID: this.newBillExport.UserID,
          SenderID: this.newBillExport.SenderID,
          StockID: this.newBillExport.AddressStockID,
          Description: "",
          Address: this.newBillExport.Address,
          CreatDate: new Date(),
          IsApproved: false,
          Status: this.newBillExport.Status,
          GroupID: this.newBillExport.GroupID,
          WarehouseType: wareHouseCode ? wareHouseCode.ProductGroupName : "",
          KhoTypeID: this.newBillExport.KhoTypeID,
          CreatedDate: this.newBillExport.CreatDate,
          UpdatedDate: new Date(),
          ProductType: this.newBillExport.ProductType,
          AddressStockID: this.newBillExport.AddressStockID,
          WarehouseID: 1,
          IsPrepared: false,
          IsReceived: false,
          RequestDate: this.newBillExport.RequestDate,
          // PreparedDate: "2025-06-28T04:36:55.950Z",
          BillDocumentExportType: 2,
          IsDeleted: false,
        },
        billExportDetail: this.mapTableDataToBillExportDetails(billExportDetailsFromTable),  
        DeletedDetailIds: this.deletedDetailIds || [],
      };
      console.log("payload", payload);
      this.billExportService.saveBillExport(payload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success('Thông báo', 'Thêm mới thành công!');
            this.closeModal();
          } else {
            this.notification.warning('Thông báo', res.message || 'Không thể thêm phiếu xuất!');
          }
        },
        error: (err: any) => {
          console.error('Save error:', err);
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
          console.error(err);
        }
      });
    }
  }

  private mapTableDataToBillExportDetails(tableData: any[]): any[] {
    return tableData.map((row: any, index: number) => {
      return {
        ID: row.ID || 0, 
        ProductID: row.ProductID || 0,
        ProductName: row.ProductName||"",
        ProductCode:row.ProductCode||"",
        ProductNewCode:row.ProductNewCode||"",
        ProductFullName: row.ProductName || "",
        Qty: row.Qty || 0,
        ProjectName: row.ProjectNameText || "",
        Note: row.Note || "",
        STT: index + 1,
        // TotalQty: row.Qty || 0,
        ProjectID: row.ProjectID || 0,
        ProductType: this.newBillExport.ProductType,
        POKHID: row.POKHID || 0,
        GroupExport: row.GroupExport || "",
        IsInvoice: false,
        InvoiceNumber: "",
        SerialNumber: "",
        ReturnedStatus: false,
        ProjectPartListID: 0,
        TradePriceDetailID: 0,
        POKHDetailID: 0,
        Specifications: row.Specifications || "",
        BillImportDetailID: 0,
        TotalInventory: row.TotalInventory || 0,
        ExpectReturnDate: null,
        
      };
    });
  }

  //xuất
  
}
