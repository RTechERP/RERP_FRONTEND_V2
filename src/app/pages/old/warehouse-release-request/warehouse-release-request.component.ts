import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  viewChild,
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { WarehouseReleaseRequestService } from './warehouse-release-request/warehouse-release-request.service';
import { CustomerPartService } from '../customer-part/customer-part/customer-part.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';

interface BillExportDetail {
  ProductID: number;
  Qty: number;
  ProjectID: number;
  Note: string;
  ProductCode: string;
  ProductNewCode: string;
  ProductName: string;
  Unit: string;
  ProductGroupName: string;
  ItemType: string;
  ProjectNameText: string;
  ProjectCodeText: string;
  ProjectCodeExport: string;
  productGroupID: number;
  POKHID: number;
  POKHDetailID: number;
  UserReceiver: string;
  QuantityRemain: number;
  CustomerID: number;
  KhoTypeID: number;
  UserID: number;
  IsMerge: boolean;
  ProductFullName: string;
  ParentID: string;
  TotalInventory: string;
  UnitPricePurchase: string;
  BillCode: string;
  UnitPricePOKH: string;
}

interface BillExport {
  CustomerID: number;
  UserID: number;
  KhoTypeID: number;
  ProductType: number;
  IsMerge: boolean;
  Status: number;
  RequestDate: Date;
  WarehouseCode: string;
  Details: BillExportDetail[];
}

@Component({
  selector: 'app-warehouse-release-request',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzCardModule,
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
    NzUploadModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzModalModule,
    NzSwitchModule,
    NzTabsModule,
    NzDropDownModule,
    NzIconModule,
    NzSpinModule,
  ],
  templateUrl: './warehouse-release-request.component.html',
  styleUrl: './warehouse-release-request.component.css',
})
export class WarehouseReleaseRequestComponent implements OnInit {
  @ViewChild('tb_WarehouseRelease', { static: false })
  tableElement!: ElementRef;

  private table!: Tabulator;
  isLoading: boolean = false;

  // Data sources
  customers: any[] = [];
  projects: any[] = [];
  productGroups: any[] = [];
  warehouses: any[] = [];
  gridData: any[] = [];
  billExports: BillExport[] = [];

  // Selected values
  selectedCustomer: any;
  selectedProject: any;
  selectedProductGroup: any;
  keyword: string = '';

  // Grid configuration
  columnDefs = [
    {
      field: 'IsSelected',
      headerName: 'Chọn',
      checkboxSelection: true,
      width: 80,
    },
    { field: 'PONumber', headerName: 'Số PO', width: 120 },
    { field: 'StatusText', headerName: 'Trạng thái', width: 120 },
    { field: 'CustomerName', headerName: 'Khách hàng', width: 250 },
    { field: 'ProjectName', headerName: 'Dự án', width: 250 },
    { field: 'ProductCode', headerName: 'Mã sản phẩm', width: 120 },
    { field: 'ProductNewCode', headerName: 'Mã nội bộ', width: 120 },
    { field: 'GuestCode', headerName: 'Mã theo khách', width: 120 },
    { field: 'ProductName', headerName: 'Tên sản phẩm', width: 200 },
    { field: 'ProductGroupName', headerName: 'Loại kho', width: 150 },
    { field: 'Unit', headerName: 'ĐVT', width: 80 },
    {
      field: 'Qty',
      headerName: 'Số lượng PO',
      width: 120,
      type: 'numericColumn',
    },
    {
      title: 'SL yêu cầu xuất',
      field: 'QuantityRequestExport',
      width: 150,
      hozAlign: 'center',
      editor: 'input',
      cellEdited: (cell: CellComponent) => {
        const value = parseFloat(cell.getValue()) || 0;
        const rowData = cell.getRow().getData();
        const quantityRemain = rowData['QuantityRemain'] as number;

        // Remove leading zeros and update the cell value
        cell.setValue(Number(value));

        if (!Number.isInteger(value)) {
          this.notification.warning('Thông báo', 'Vui lòng nhập số nguyên');
          cell.setValue(0);
          return;
        }

        if (value > quantityRemain) {
          this.notification.error(
            'Lỗi',
            'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
          );
          cell.setValue(0);
          return;
        }
      },
    },
    {
      field: 'QuantityExport',
      headerName: 'SL đã xuất',
      width: 120,
      type: 'numericColumn',
    },
    {
      field: 'QuantityRemain',
      headerName: 'SL còn lại',
      width: 120,
      type: 'numericColumn',
    },
    { field: 'UserReceiver', headerName: 'Người nhận', width: 180 },
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  constructor(
    public activeModal: NgbActiveModal,
    private WRRService: WarehouseReleaseRequestService,
    private notification: NzNotificationService,
    private CustomerPartService: CustomerPartService,
    private RequestInvoiceDetailService: RequestInvoiceDetailService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadWarehouse();
    this.loadProductGroup();
    this.loadCustomer();
    this.loadProject();
    this.loadPOKHExportRequest(1, 0, 0, 0, '');
  }

  ngAfterViewInit(): void {}

  //#region Các hàm load dữ liệu từ api
  loadWarehouse(): void {
    this.WRRService.loadWarehouse().subscribe(
      (response) => {
        if (response.status === 1) {
          this.warehouses = response.data;
        } else {
          this.notification.error('Lỗi khi tải kho:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải kho:', error);
      }
    );
  }
  loadProductGroup(): void {
    this.WRRService.loadProductGroup().subscribe(
      (response) => {
        if (response.status === 1) {
          this.productGroups = response.data;
        } else {
          this.notification.error(
            'Lỗi khi tải nhóm sản phẩm:',
            response.message
          );
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải nhóm sản phẩm:', error);
      }
    );
  }
  loadCustomer(): void {
    this.CustomerPartService.getCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error('Lỗi khi tải khách hàng:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải khách hàng:', error);
      }
    );
  }
  loadProject(): void {
    this.RequestInvoiceDetailService.loadProject().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data;
        } else {
          this.notification.error('Lỗi khi tải dự án:', response.message);
        }
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dự án:', error);
      }
    );
  }
  loadPOKHExportRequest(
    warehouseId: number,
    customerId: number,
    projectId: number,
    productGroupId: number,
    keyword: string
  ): void {
    this.isLoading = true;
    this.WRRService.loadPOKHExportRequest(
      warehouseId,
      customerId,
      projectId,
      productGroupId,
      keyword
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          this.gridData = response.data;
          this.initWarehouseReleaseTable();
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu bảng:',
            response.message
          );
        }
        this.isLoading = false;
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu bảng:', error);
        this.isLoading = false;
      }
    );
  }
  //#endregion
  onWarehouseSelect(warehouse: any): void {
    // Lấy các dòng đã chọn từ bảng
    const selectedRows = this.table.getSelectedRows();

    if (selectedRows.length <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn sản phẩm muốn Yêu cầu xuất kho!'
      );
      return;
    }

    // Hiển thị dialog xác nhận
    if (
      confirm(
        `Bạn có chắc muốn yêu cầu xuất kho danh sách sản phẩm đã chọn từ [${warehouse.WarehouseName}] không?`
      )
    ) {
      // Chuẩn bị dữ liệu chi tiết
      const details: BillExportDetail[] = selectedRows.map((row) => {
        const data = row.getData();
        return {
          ProductID: data['ProductID'],
          Qty: data['QuantityRequestExport'] || 0,
          ProjectID: data['ProjectID'],
          Note: data['PONumber'],
          ProductCode: data['ProductCode'],
          ProductNewCode: data['ProductNewCode'],
          ProductName: data['ProductName'],
          Unit: data['Unit'],
          ProductGroupName: data['ProductGroupName'],
          ItemType: data['ItemType'],
          ProjectNameText: data['ProjectName'],
          ProjectCodeText: data['ProjectCode'],
          ProjectCodeExport: data['ProjectCodeExport'],
          productGroupID: data['productGroupID'],
          POKHID: data['POKHID'],
          POKHDetailID: data['POKHDetailID'],
          UserReceiver: data['UserReceiver'],
          QuantityRemain: data['QuantityRemain'],
          CustomerID: data['CustomerID'],
          KhoTypeID: data['KhoTypeID'],
          UserID: data['UserID'],
          IsMerge: data['IsMerge'],
          ProductFullName: data['GuestCode'],
          ParentID: data['ParentID'],
          TotalInventory: data['TotalInventory'],
          UnitPricePurchase: data['UnitPricePurchase'],
          BillCode: data['BillCode'],
          UnitPricePOKH: data['UnitPricePOKH'],
        };
      });

      // Kiểm tra xem có nhiều khách hàng hoặc loại kho khác nhau không
      const distinctValues = [
        ...new Set(details.map((d) => `${d.CustomerID}-${d.KhoTypeID}`)),
      ];

      if (distinctValues.length > 1) {
        this.notification.info(
          'Thông báo',
          `Bạn chọn sản phẩm từ ${distinctValues.length} Khách hàng hoặc Loại kho.\nNên phần mềm sẽ tự động tạo ${distinctValues.length} phiếu xuất.`
        );
      }

      // Tạo dữ liệu master cho từng nhóm khách hàng/kho
      this.billExports = distinctValues.map((value) => {
        const [customerID, khoTypeID] = value.split('-');
        const groupDetails = details.filter(
          (d) =>
            d.CustomerID.toString() === customerID &&
            d.KhoTypeID.toString() === khoTypeID
        );

        return {
          CustomerID: parseInt(customerID),
          UserID: groupDetails[0]?.UserID || 0,
          KhoTypeID: parseInt(khoTypeID),
          ProductType: 1,
          IsMerge: groupDetails[0]?.IsMerge || false,
          Status: 6,
          RequestDate: new Date(),
          WarehouseCode: warehouse.WarehouseCode,
          Details: groupDetails,
        };
      });

      // Đóng modal hiện tại
      this.activeModal.close();

      // // Mở modal mới với dữ liệu đã chuẩn bị
      // const modalRef = this.modalService.open(WarehouseReleaseRequestComponent, {
      //   centered: true,
      //   backdrop: 'static',
      //   windowClass: 'full-screen-modal',
      // });

      // // Truyền dữ liệu sang modal mới
      // modalRef.componentInstance.billExports = this.billExports;
    }
  }

  onCustomerChange(event: any): void {
    // TODO: Implement customer change logic
    console.log('Selected customer:', event);
  }

  onProjectChange(event: any): void {
    // TODO: Implement project change logic
    console.log('Selected project:', event);
  }

  onProductGroupChange(event: any): void {
    // TODO: Implement product group change logic
    console.log('Selected product group:', event);
  }

  onSearch() {
    this.isLoading = true;
    this.WRRService.loadPOKHExportRequest(
      1,
      this.selectedCustomer,
      this.selectedProject,
      this.selectedProductGroup,
      this.keyword
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          let data = response.data;
          this.table.setData(data);
        } else {
          this.notification.error(
            'Lỗi khi tải dữ liệu bảng:',
            response.message
          );
        }
        this.isLoading = false;
      },
      (error) => {
        this.notification.error('Lỗi kết nối khi tải dữ liệu bảng:', error);
        this.isLoading = false;
      }
    );
  }

  onSubmit(): void {
    // TODO: Implement submit logic
    console.log('Submit data');
    this.activeModal.close('submit');
  }

  closeModal(): void {
    this.activeModal.dismiss('close');
  }

  onCustomerSelect(customer: any): void {
    this.selectedCustomer = customer.CustomerID;
    this.onCustomerChange(customer);
  }

  onProjectSelect(project: any): void {
    this.selectedProject = project.ProjectID;
    this.onProjectChange(project);
  }
  //#region Hàm vẽ bảng
  initWarehouseReleaseTable(): void {
    this.table = new Tabulator(this.tableElement.nativeElement, {
      data: this.gridData,
      height: '75vh',
      layout: 'fitColumns',
      reactiveData: true,
      resizableRows: true,
      movableColumns: true,
      groupBy: 'PONumber',
      selectableRows: true,
      selectableRange: true,
      pagination: true,
      paginationSize: 100,
      columns: [
        {
          title: 'Chọn',
          field: 'IsSelected',
          width: 10,
          hozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          frozen: true,
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          width: 120,
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Số PO',
          field: 'PONumber',
          width: 100,
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          width: 120,
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Dự án',
          field: 'ProjectName',
          width: 100,
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 150,
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 150,
          hozAlign: 'center',
        },
        {
          title: 'Mã theo khách',
          field: 'ProductCode',
          width: 150,
          hozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          width: 150,
          hozAlign: 'center',
        },
        {
          title: 'Loại kho',
          field: 'ProductGroupName',
          width: 100,
          hozAlign: 'center',
        },
        { title: 'ĐVT', field: 'Unit', width: 100, hozAlign: 'center' },
        { title: 'Số lượng PO', field: 'Qty', width: 100, hozAlign: 'center' },
        {
          title: 'SL yêu cầu xuất',
          field: 'QuantityRequestExport',
          width: 150,
          hozAlign: 'center',
          editor: 'input',
          validator: 'integer',
          cellEdited: (cell: CellComponent) => {
            const value = parseFloat(cell.getValue()) || 0;
            const rowData = cell.getRow().getData();
            const quantityRemain = rowData['QuantityRemain'] as number;

            // Remove leading zeros and update the cell value
            cell.setValue(Number(value));

            if (!Number.isInteger(value)) {
              this.notification.warning('Thông báo', 'Vui lòng nhập số nguyên');
              cell.setValue(0);
              return;
            }

            if (value > quantityRemain) {
              this.notification.error(
                'Lỗi',
                'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
              );
              cell.setValue(0);
              return;
            }
          },
        },
        {
          title: 'SL đã xuất',
          field: 'QuantityExport',
          width: 150,
          hozAlign: 'center',
        },
        {
          title: 'SL còn lại',
          field: 'QuantityRemain',
          width: 100,
          hozAlign: 'center',
        },
        {
          title: 'Người nhận',
          field: 'UserReceiver',
          width: 150,
          hozAlign: 'center',
        },
      ],
    });
  }
  //#endregion
}
