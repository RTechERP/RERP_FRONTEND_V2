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
import { AppUserService } from '../../../services/app-user.service';
import { BillExportDetailComponent } from '../Sale/BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
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
  STT?: number;
  ChildID?: string;
  POKHDetailIDActual?: string;
  PONumber?: string;
  POCode?: string;
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
  @Input() warehouseId!: number;
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
  selectedRowsAll: any[] = []; // Lưu toàn bộ các dòng đã chọn, không phụ thuộc data hiện tại

  // Selected values
  selectedCustomer: any;
  selectedProject: any;
  selectedProductGroup: any;
  keyword: string = '';

  // columnDefs = [
  //   {
  //     field: 'IsSelected',
  //     headerName: 'Chọn',
  //     checkboxSelection: true,
  //     width: 80,
  //   },
  //   { field: 'PONumber', headerName: 'Số PO', width: 120 },
  //   { field: 'StatusText', headerName: 'Trạng thái', width: 120 },
  //   { field: 'CustomerName', headerName: 'Khách hàng', width: 250 },
  //   { field: 'ProjectName', headerName: 'Dự án', width: 250 },
  //   { field: 'ProductCode', headerName: 'Mã sản phẩm', width: 120 },
  //   { field: 'ProductNewCode', headerName: 'Mã nội bộ', width: 120 },
  //   { field: 'GuestCode', headerName: 'Mã theo khách', width: 120 },
  //   { field: 'ProductName', headerName: 'Tên sản phẩm', width: 200 },
  //   { field: 'ProductGroupName', headerName: 'Loại kho', width: 150 },
  //   { field: 'Unit', headerName: 'ĐVT', width: 80 },
  //   {
  //     field: 'Qty',
  //     headerName: 'Số lượng PO',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   {
  //     title: 'SL yêu cầu xuất',
  //     field: 'QuantityRequestExport',
  //     width: 150,
  //     hozAlign: 'center',
  //     editor: 'input',
  //     cellEdited: (cell: CellComponent) => {
  //       const value = parseFloat(cell.getValue()) || 0;
  //       const rowData = cell.getRow().getData();
  //       const quantityRemain = rowData['QuantityRemain'] as number;

  //       // Remove leading zeros and update the cell value
  //       cell.setValue(Number(value));

  //       if (!Number.isInteger(value)) {
  //         this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số nguyên');
  //         cell.setValue(0);
  //         return;
  //       }

  //       if (value > quantityRemain) {
  //         this.notification.error(
  //           'Lỗi',
  //           'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
  //         );
  //         cell.setValue(0);
  //         return;
  //       }
  //     },
  //   },
  //   {
  //     field: 'QuantityExport',
  //     headerName: 'SL đã xuất',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   {
  //     field: 'QuantityRemain',
  //     headerName: 'SL còn lại',
  //     width: 120,
  //     type: 'numericColumn',
  //   },
  //   { field: 'UserReceiver', headerName: 'Người nhận', width: 180 },
  // ];

  // defaultColDef = {
  //   sortable: true,
  //   filter: true,
  //   resizable: true,
  // };

  constructor(
    public activeModal: NgbActiveModal,
    private WRRService: WarehouseReleaseRequestService,
    private notification: NzNotificationService,
    private CustomerPartService: CustomerPartService,
    private RequestInvoiceDetailService: RequestInvoiceDetailService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.loadWarehouse();
    this.loadProductGroup();
    this.loadCustomer();
    this.loadProject();
    this.loadPOKHExportRequest(this.warehouseId, 0, 0, 0, '');
  }

  ngAfterViewInit(): void {
    // Khởi tạo bảng ngay lập tức với data rỗng
    this.initWarehouseReleaseTable();
  }

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
          // Chuyển đổi dữ liệu từ flat sang nested structure cho dataTree
          const treeData = this.convertToTreeData(this.gridData);
          this.gridData = treeData;
          // Cập nhật data vào bảng đã được khởi tạo sẵn
          if (this.table) {
            this.table.setData(treeData);
            // Select lại các dòng có trong selectedRowsAll
            const selectedIds = this.selectedRowsAll.map(r => r['POKHDetailID']);
            this.table.getRows().forEach(row => {
              const rowData = row.getData();
              if (selectedIds.includes(rowData['POKHDetailID'])) {
                row.select();
              }
            });
          }
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

  /**
   * Chuyển đổi dữ liệu từ flat structure (có ParentID) sang nested structure (có _children)
   * để Tabulator dataTree có thể hiển thị đúng
   */
  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Bước 1: Tạo map với key là ID của mỗi item và thêm _children rỗng
    flatData.forEach((item) => {
      map.set(item.POKHDetailID, { ...item, _children: [] });
    });

    // Bước 2: Xây dựng cấu trúc cây
    flatData.forEach((item) => {
      const node = map.get(item.POKHDetailID);
      if (!item.ParentID || item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          // Nếu không tìm thấy parent, thêm vào root
          treeData.push(node);
        }
      }
    });

    return treeData;
  }
  //#endregion
  // onWarehouseSelect(warehouse: any): void {
  //   const selectedRows = this.table.getSelectedRows();

  //   if (selectedRows.length <= 0) {
  //     this.notification.warning(
  //       'Thông báo',
  //       'Vui lòng chọn sản phẩm muốn Yêu cầu xuất kho!'
  //     );
  //     return;
  //   }

  //   // Validate số lượng tồn kho trước khi hiển thị dialog xác nhận
  //   this.isLoading = true;
    
  //   const validateRequests = selectedRows.map((row) => {
  //     const dataRow = row.getData();
  //     return this.WRRService.validateKeep(
  //       warehouse.ID,
  //       Number(dataRow['ProductID']) || 0,
  //       0, // projectID = 0
  //       Number(dataRow['POKHDetailID']) || 0,
  //       0, // billExportDetailID = 0
  //       dataRow['Unit'] || '',
  //       Number(dataRow['QuantityRequestExport']) || 0,
  //       dataRow['ProductNewCode'] || ''
  //     ).pipe(
  //       map((response) => ({
  //         isValid: response.status === 1 && response.data?.IsValid === true,
  //         productNewCode: response.data?.ProductNewCode || dataRow['ProductNewCode'] || '',
  //         message: response.data?.Message || '',
  //         dataRow: dataRow,
  //       })),
  //       catchError((error) => {
  //         console.error('Lỗi khi validate keep:', error);
  //         return of({
  //           isValid: false,
  //           productNewCode: dataRow['ProductNewCode'] || '',
  //           message: 'Lỗi khi kiểm tra số lượng tồn kho',
  //           dataRow: dataRow,
  //         });
  //       })
  //     );
  //   });

  //   forkJoin(validateRequests).subscribe({
  //     next: (validateResults) => {
  //       this.isLoading = false;

  //       // Thu thập danh sách sản phẩm không đủ số lượng
  //       const productNewCodes: string[] = [];
  //       validateResults.forEach((result) => {
  //         if (!result.isValid) {
  //           const productNewCode = result.productNewCode;
  //           if (productNewCode && !productNewCodes.includes(productNewCode)) {
  //             productNewCodes.push(productNewCode);
  //           }
  //         }
  //       });

  //       // Hiển thị dialog xác nhận
  //       if (
  //         confirm(
  //           `Bạn có chắc muốn yêu cầu xuất kho danh sách sản phẩm đã chọn từ [${warehouse.WarehouseName}] không?`
  //         )
  //       ) {
  //         // Hiển thị cảnh báo về các sản phẩm không đủ số lượng
  //         if (productNewCodes.length > 0) {
  //           this.notification.warning(
  //             'Thông báo',
  //             `Các sản phẩm có mã nội bộ [${productNewCodes.join('; ')}] sẽ không được yêu cầu xuất kho vì không đủ số lượng!`
  //           );
  //         }

  //         // Chuẩn bị dữ liệu chi tiết (chỉ lấy những sản phẩm hợp lệ)
  //         const details: BillExportDetail[] = [];
  //         let stt = 0;

  //         for (let i = 0; i < validateResults.length; i++) {
  //           const result = validateResults[i];

  //           if (!result.isValid) {
  //             continue;
  //           }

  //           const dataRow = result.dataRow;
  //           const productID = Number(dataRow['ProductID']) || 0;
  //           const productNewCode = (dataRow['ProductNewCode'] || '').trim();
  //           const quantityRemain = Number(dataRow['QuantityRemain']) || 0;
  //           const quantityRequestExport = Number(dataRow['QuantityRequestExport']) || 0;

  //           if (productID <= 0 || productNewCode === '' || quantityRemain <= 0 || quantityRequestExport <= 0) {
  //             continue;
  //           }

  //           stt++;
  //           details.push({
  //             ProductID: productID,
  //             Qty: quantityRequestExport,
  //             ProjectID: Number(dataRow['ProjectID']) || 0,
  //             Note: dataRow['PONumber'] || '',
  //             ProductCode: dataRow['ProductCode'] || '',
  //             ProductNewCode: productNewCode,
  //             ProductName: dataRow['ProductName'] || '',
  //             Unit: dataRow['Unit'] || '',
  //             ProductGroupName: dataRow['ProductGroupName'] || '',
  //             ItemType: dataRow['ItemType'] || '',
  //             ProjectNameText: dataRow['ProjectName'] || '',
  //             ProjectCodeText: dataRow['ProjectCode'] || '',
  //             ProjectCodeExport: dataRow['ProjectCodeExport'] || '',
  //             productGroupID: Number(dataRow['productGroupID']) || 0,
  //             POKHID: Number(dataRow['POKHID']) || 0,
  //             POKHDetailID: Number(dataRow['POKHDetailID']) || 0,
  //             UserReceiver: dataRow['UserReceiver'] || '',
  //             QuantityRemain: quantityRemain,
  //             CustomerID: Number(dataRow['CustomerID']) || 0,
  //             KhoTypeID: Number(dataRow['KhoTypeID']) || 0,
  //             UserID: Number(dataRow['UserID']) || 0,
  //             IsMerge: Boolean(dataRow['IsMerge']) || false,
  //             ProductFullName: dataRow['GuestCode'] || '',
  //             ParentID: dataRow['ParentID'] || '',
  //             TotalInventory: dataRow['TotalInventory'] || '',
  //             UnitPricePurchase: dataRow['UnitPricePurchase'] || '',
  //             BillCode: dataRow['BillCode'] || '',
  //             UnitPricePOKH: dataRow['UnitPricePOKH'] || '',
  //             STT: stt,
  //             ChildID: String(dataRow['POKHDetailID'] || ''),
  //             POKHDetailIDActual: String(dataRow['POKHDetailID'] || ''),
  //             PONumber: dataRow['PONumber'] || '',
  //             POCode: dataRow['POCode'] || '',
  //           });
  //         }

  //         if (details.length === 0) {
  //           this.notification.warning(
  //             'Thông báo',
  //             'Không có sản phẩm nào hợp lệ để yêu cầu xuất kho!'
  //           );
  //           return;
  //         }

  //         // Kiểm tra xem có nhiều khách hàng hoặc loại kho khác nhau không
  //         const distinctValues = [
  //           ...new Set(details.map((d) => `${d.CustomerID}-${d.KhoTypeID}`)),
  //         ];

  //         if (distinctValues.length > 1) {
  //           this.notification.info(
  //             'Thông báo',
  //             `Bạn chọn sản phẩm từ ${distinctValues.length} Khách hàng hoặc Loại kho.\nNên phần mềm sẽ tự động tạo ${distinctValues.length} phiếu xuất.`
  //           );
  //         }

  //         // Tạo dữ liệu master cho từng nhóm khách hàng/kho
  //         this.billExports = distinctValues.map((value) => {
  //           const [customerID, khoTypeID] = value.split('-');
  //           const groupDetails = details.filter(
  //             (d) =>
  //               d.CustomerID.toString() === customerID &&
  //               d.KhoTypeID.toString() === khoTypeID
  //           );

  //           return {
  //             CustomerID: parseInt(customerID),
  //             UserID: this.appUserService.id || 0,
  //             KhoTypeID: parseInt(khoTypeID),
  //             ProductType: 1,
  //             IsMerge: groupDetails[0]?.IsMerge || false,
  //             Status: 6,
  //             RequestDate: new Date(),
  //             WarehouseCode: warehouse.WarehouseCode,
  //             Details: groupDetails,
  //           };
  //         });

  //         this.activeModal.close();

  //         // Mở modal chi tiết cho từng bill export (tuần tự)
  //         this.openBillExportDetailModals(0, warehouse);
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       this.notification.error('Lỗi', 'Lỗi khi kiểm tra số lượng tồn kho: ' + error.message);
  //     },
  //   });
  // }

  onWarehouseSelect(warehouse: any): void {
    if (this.selectedRowsAll.length <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn yêu cầu xuất kho!');
      return;
    }
  
    this.nzModal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn yêu cầu xuất kho danh sách sản phẩm đã chọn từ [${warehouse.WarehouseName}] không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;
    
        const payload = {
          WarehouseID: warehouse.ID,
          Items: this.selectedRowsAll.map((d: any) => {
            return {
              ProductID: Number(d["ProductID"]) || 0,
              POKHDetailID: Number(d["POKHDetailID"]) || 0,
              UnitName: d["Unit"] || "",
              QuantityRequestExport: Number(d["QuantityRequestExport"]) || 0,
              ProductNewCode: d["ProductNewCode"] || ""
            };
          })
        };
    
        this.WRRService.validateKeepNew(payload).subscribe({
          next: (res) => {
            this.isLoading = false;
    
            const validSelected = res.data.ValidSelected || [];
            const invalidCodes = res.data.InvalidProductCodes || [];
    
            // Hiển thị thông báo về các sản phẩm không đủ số lượng
            if (invalidCodes.length > 0) {
              this.notification.warning(
                'Thông báo',
                `Các sản phẩm có mã nội bộ: ${invalidCodes.join('; ')} sẽ không được xuất kho vì không đủ số lượng!`
              );
            }
    
            const validDetails = this.selectedRowsAll
              .filter((d: any) => validSelected.includes(d.POKHDetailID))
              .map((d: any) => this.convertToDetail(d));

            // Kiểm tra các sản phẩm không hợp lệ 
            const noRemainProducts: string[] = [];
            const finalValidDetails = validDetails.filter((d: BillExportDetail) => {
              const originalData = this.selectedRowsAll.find(
                (r: any) => r.POKHDetailID === d.POKHDetailID
              );
              
              if (!originalData) return false;
              
              const productID = Number(originalData.ProductID) || 0;
              const productNewCode = (originalData.ProductNewCode || '').trim();
              const quantityRemain = Number(originalData.QuantityRemain) || 0;
              
              if (productID <= 0 || productNewCode === '' || quantityRemain <= 0) {
                if (productNewCode && !noRemainProducts.includes(productNewCode)) {
                  noRemainProducts.push(productNewCode);
                }
                return false;
              }
              
              return true;
            });

            // Hiển thị thông báo về các sản phẩm không đủ số lượng còn lại
            if (noRemainProducts.length > 0) {
              this.notification.warning(
                'Thông báo',
                `Các sản phẩm sau không đủ số lượng còn lại nên sẽ bị bỏ qua: ${noRemainProducts.join('; ')}`
              );
            }

            if (finalValidDetails.length === 0) {
              this.notification.warning('Thông báo', 'Không có sản phẩm nào hợp lệ để yêu cầu xuất kho!');
              return;
            }
      
            this.generateBillExport(finalValidDetails, warehouse);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('validate keep batch error:', err);
            this.notification.error('Lỗi', 'Không kiểm tra được số lượng tồn kho!');
          }
        });
      }
    });
  }
  

  onWarehouseTranferSelect(warehouse: any) {
    this.notification.warning('Thông báo!', "Chức năng đang phát triển")
  }

  private generateBillExport(details: BillExportDetail[], warehouse: any): void {
    const groupedKeys = [...new Set(
      details.map(d => `${d.CustomerID}-${d.KhoTypeID}`)
    )];
  
    if (groupedKeys.length > 1) {
      this.notification.info(
        'Thông báo',
        `Bạn chọn sản phẩm từ ${groupedKeys.length} Khách hàng hoặc Loại kho.\n` +
        `Hệ thống sẽ tự động tạo ${groupedKeys.length} phiếu xuất.`
      );
    }
  
    this.billExports = groupedKeys.map(key => {
      const [customerID, khoTypeID] = key.split("-");
      const groupDetails = details.filter(
        d => d.CustomerID.toString() === customerID &&
             d.KhoTypeID.toString() === khoTypeID
      );
  
      return {
        CustomerID: Number(customerID),
        UserID: this.appUserService.id || 0,
        KhoTypeID: Number(khoTypeID),
        ProductType: 1,
        IsMerge: groupDetails[0]?.IsMerge || false,
        Status: 6,
        RequestDate: new Date(),
        WarehouseCode: warehouse.WarehouseCode,
        Details: groupDetails,
      };
    });
  
    // this.activeModal.close();
    this.openBillExportDetailModals(0, warehouse);
  }
  private convertToDetail(d: any): BillExportDetail {
    return {
      ProductID: Number(d.ProductID) || 0,
      Qty: Number(d.QuantityRequestExport) || 0,
      ProjectID: Number(d.ProjectID) || 0,
      Note: d.PONumber || "",
      ProductCode: d.ProductCode || "",
      ProductNewCode: d.ProductNewCode || "",
      ProductName: d.ProductName || "",
      Unit: d.Unit || "",
      ProductGroupName: d.ProductGroupName || "",
      ItemType: d.ItemType || "",
      ProjectNameText: d.ProjectName || "",
      ProjectCodeText: d.ProjectCode || "",
      ProjectCodeExport: d.ProjectCodeExport || "",
      productGroupID: Number(d.productGroupID) || 0,
      POKHID: Number(d.POKHID) || 0,
      POKHDetailID: Number(d.POKHDetailID) || 0,
      UserReceiver: d.UserReceiver || "",
      QuantityRemain: Number(d.QuantityRemain) || 0,
      CustomerID: Number(d.CustomerID) || 0,
      KhoTypeID: Number(d.KhoTypeID) || 0,
      UserID: Number(d.UserID) || 0,
      IsMerge: Boolean(d.IsMerge) || false,
      ProductFullName: d.GuestCode || "",
      ParentID: d.ParentID || "",
      TotalInventory: d.TotalInventory || "",
      UnitPricePurchase: d.UnitPricePurchase || "",
      BillCode: d.BillCode || "",
      UnitPricePOKH: d.UnitPricePOKH || "",
      STT: 0,
      ChildID: String(d.POKHDetailID),
      POKHDetailIDActual: String(d.POKHDetailID),
      PONumber: d.PONumber,
      POCode: d.POCode,
    };
  }
  

  /**
   * Mở modal chi tiết cho từng bill export tuần tự
   * @param index - Index của bill export hiện tại trong mảng billExports
   * @param warehouse - Warehouse object từ onWarehouseSelect
   */
  private openBillExportDetailModals(index: number, warehouse: any): void {
    if (index >= this.billExports.length) {
      return;
    }

    const billExport = this.billExports[index];

    const billExportForModal = {
      TypeBill: false,
      Code: '',
      Address: '',
      CustomerID: billExport.CustomerID,
      UserID: billExport.UserID,
      SenderID: 0, 
      WarehouseType: '',
      GroupID: '',
      KhoTypeID: billExport.KhoTypeID,
      ProductType: billExport.ProductType,
      AddressStockID: 0,
      WarehouseID: warehouse.ID, //  WarehouseID từ selected warehouse
      Status: billExport.Status,
      SupplierID: 0,
      CreatDate: billExport.RequestDate,
      RequestDate: billExport.RequestDate,
    };

    const modalRef = this.modalService.open(BillExportDetailComponent, {
      centered: true,
      // size: 'xl',
      windowClass: 'full-screen-modal',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.newBillExport = billExportForModal;
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.isPOKH = true;
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.wareHouseCode = billExport.WarehouseCode;
    modalRef.componentInstance.isFromWarehouseRelease = true; // FLAG RIÊNG cho luồng Warehouse Release Request

    const detailsForModal = billExport.Details.map((detail: any) => ({
      ID: 0,
      POKHDetailID: detail.POKHDetailID || 0,
      ProductID: detail.ProductID || 0,
      ProductNewCode: detail.ProductNewCode || '',
      ProductCode: detail.ProductCode || '',
      ProductName: detail.ProductName || '',
      Unit: detail.Unit || '',
      TotalInventory: detail.TotalInventory || 0,
      Qty: detail.Qty || 0,
      QuantityRemain: detail.QuantityRemain || 0,
      ProjectID: detail.ProjectID || 0,
      ProjectCodeExport: detail.ProjectCodeExport || '',
      ProjectNameText: detail.ProjectNameText || '',
      ProductFullName: detail.ProductFullName || '',
      Note: detail.Note || '',
      UnitPricePOKH: detail.UnitPricePOKH || 0,
      UnitPricePurchase: detail.UnitPricePurchase || 0,
      BillCode: detail.BillCode || '',
      UserReceiver: detail.UserReceiver || '',
      POKHID: detail.POKHID || 0,
    }));

    setTimeout(() => {
      modalRef.componentInstance.dataTableBillExportDetail = detailsForModal;

      if (modalRef.componentInstance.table_billExportDetail) {
        modalRef.componentInstance.table_billExportDetail.replaceData(detailsForModal);
        
        // Update TotalInventory after data is set into table
        // Wait a bit for productOptions to be loaded if not already
        setTimeout(() => {
          if (modalRef.componentInstance.updateTotalInventoryForExistingRows) {
            modalRef.componentInstance.updateTotalInventoryForExistingRows();
          }
        }, 500);
      }
    }, 200);

    modalRef.result.then(
      (result) => {
        // Modal đóng thành công (result có thể là undefined, true, hoặc bất kỳ giá trị nào)
        // Luôn mở modal tiếp theo nếu chưa phải modal cuối cùng
        if (index < this.billExports.length - 1) {
          this.openBillExportDetailModals(index + 1, warehouse);
        } else {
          // Đây là modal cuối cùng, đóng activeModal
          this.activeModal.close();
        }
      },
      (dismissed) => {
        // Modal bị dismiss, vẫn tiếp tục mở modal tiếp theo nếu có
        if (index < this.billExports.length - 1) {
          this.openBillExportDetailModals(index + 1, warehouse);
        } else {
          // Đây là modal cuối cùng, đóng activeModal
          this.activeModal.close();
        }
      }
    );
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
      this.warehouseId,
      this.selectedCustomer,
      this.selectedProject,
      this.selectedProductGroup,
      this.keyword
    ).subscribe(
      (response) => {
        if (response.status === 1) {
          let data = response.data;
          const treeData = this.convertToTreeData(data);
          this.table.setData(treeData);
          // Select lại các dòng có trong selectedRowsAll
          const selectedIds = this.selectedRowsAll.map(r => r['POKHDetailID']);
          this.table.getRows().forEach(row => {
            const rowData = row.getData();
            if (selectedIds.includes(rowData['POKHDetailID'])) {
              row.select();
            }
          });
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
      ...DEFAULT_TABLE_CONFIG,
      data: this.gridData,
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      dataTreeBranchElement: true,
      dataTreeChildIndent: 15,
      height: '73.8vh',
      layout: 'fitColumns',
      reactiveData: true,
      resizableRows: true,
      movableColumns: true,
      // selectableRows: true,
      // selectableRange: true,
      pagination: true,
      paginationSize: 500,
      rowHeader: false,
      columns: [
        {
          title: 'Chọn',
          field: 'IsSelected',
          width: 20,
          hozAlign: 'center',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          frozen: true,
          cellClick: (e, cell) => {
            // Only toggle selection when clicking the checkbox
            cell.getRow().toggleSelect();
          },
        },
        {
          title: 'ID',
          field: 'POKHDetailID',
          width: 120,
          hozAlign: 'center',
          visible: false,
          frozen: true,
        },
        {
          title: 'ID cha',
          field: 'ParentID',
          width: 120,
          hozAlign: 'center',
          visible: false,
          frozen: true,
        },
        {
          title: 'Trạng thái',
          formatter: 'textarea',
          field: 'StatusText',
          width: 120,
          frozen: true,
          headerFilter: 'input',
        },
        {
          title: 'Số PO',
          field: 'PONumber',
          width: 100,
          formatter:'textarea',
          frozen: true,
          headerFilter: 'input',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          formatter: 'textarea',
          width: 250,
          frozen: true,
          headerFilter: 'input',
        },
        {
          title: 'Dự án',
          field: 'ProjectName',
          width: 250,
          frozen: true,
          headerFilter: 'input',
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 200,
          frozen: true,
          headerFilter: 'input',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 150,
          headerFilter: 'input',
        },
        {
          title: 'Mã theo khách',
          field: 'GuestCode',
          width: 250,
          headerFilter: 'input',
        },
        {
          title: 'Tên sản phẩm',
          formatter: 'textarea',
          field: 'ProductName',
          width: 250,
          headerFilter: 'input',
        },
        {
          title: 'Loại kho',
          field: 'ProductGroupName',
          width: 250,
          headerFilter: 'input',
        },
        { title: 'ĐVT', field: 'Unit', width: 100, headerFilter: 'input' },
        { title: 'Số lượng PO', field: 'Qty', width: 100, hozAlign: 'right' },
        {
          title: 'SL yêu cầu xuất',
          field: 'QuantityRequestExport',
          width: 150,
          hozAlign: 'right',
          editor: 'input',
          validator: 'integer',
          cellEdited: (cell: CellComponent) => {
            const value = parseFloat(cell.getValue()) || 0;
            const rowData = cell.getRow().getData();
            const quantityRemain = rowData['QuantityRemain'] as number;

            // Remove leading zeros and update the cell value
            cell.setValue(Number(value));

            if (!Number.isInteger(value)) {
              this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số nguyên');
              cell.setValue(0);
              return;
            }

            if (value > quantityRemain) {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Số lượng yêu cầu xuất không được lớn hơn số lượng còn lại'
              );
              cell.setValue(0);
              return;
            }

            // Cập nhật lại data trong selectedRowsAll nếu dòng này đã được chọn
            const pokhDetailID = rowData['POKHDetailID'];
            const index = this.selectedRowsAll.findIndex(r => r['POKHDetailID'] === pokhDetailID);
            if (index !== -1) {
              // Cập nhật data mới nhất từ row
              this.selectedRowsAll[index] = { ...cell.getRow().getData() };
            }
          },
        },
        {
          title: 'SL đã xuất',
          field: 'QuantityExport',
          width: 150,
          hozAlign: 'right',
        },
        {
          title: 'SL còn lại',
          field: 'QuantityRemain',
          width: 100,
          hozAlign: 'right',
        },
        {
          title: 'Người nhận',
          field: 'UserReceiver',
          width: 150,
          headerFilter: 'input',
        },
        {
          title: 'Mã phiếu xuất',
          field: 'BillExportCode',
          width: 150,
          headerFilter: 'input',
        },

      ],
    });

    this.table.on('rowSelected', (row) => {
      const rowData = row.getData();
      const pokhDetailID = rowData['POKHDetailID'];

      // Tìm xem dòng này đã có trong selectedRowsAll chưa
      const index = this.selectedRowsAll.findIndex(r => r['POKHDetailID'] === pokhDetailID);
      
      if (index !== -1) {
        // Nếu đã có, cập nhật lại data mới nhất
        this.selectedRowsAll[index] = { ...rowData };
      } else {
        // Nếu chưa có, thêm mới
        this.selectedRowsAll.push({ ...rowData });
      }
      console.log("Dòng đã chọn không phụ thuộc datasource", this.selectedRowsAll);
    });

    this.table.on('rowDeselected', (row) => {
      const rowData = row.getData();

      // Loại bỏ khỏi selectedRowsAll theo ID
      this.selectedRowsAll = this.selectedRowsAll.filter(r => r['POKHDetailID'] !== rowData['POKHDetailID']);
    });
  }
  //#endregion
}
