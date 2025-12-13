import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgModule } from '@angular/core';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
  Optional,
  Inject,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { HrPurchaseProposalService } from './hr-purchase-proposal-service/hr-purchase-proposal.service';
// import { HandoverFormComponent } from './handover-form/handover-form.component';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';
import { ChangeDetectorRef } from '@angular/core';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';

interface DepartmentRequired {
  ID: number;
  STT: number;
  JobRequirementID: number;
  RequesterID: number;
  DepartmentID: number;
  PositionID: number;
  RequestDate: Date | null;
  RequestContent: string;
  Reason: string;
  CompletionDate: Date | null;
  Unit: string;
  Quantity: string;
  Description: string;
}
@Component({
  selector: 'app-hr-purchase-proposal',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
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
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
    NzDropDownModule,
    NzMenuModule,
    HasPermissionDirective,
  ],
  templateUrl: './hr-purchase-proposal.component.html',
  styleUrl: './hr-purchase-proposal.component.css',
})
export class HrPurchaseProposalComponent implements OnInit, AfterViewInit {
  @ViewChild('DepartmentRequiredTable') tableRef1!: ElementRef;

  @Input() JobrequirementID: number = 0; 
  newDepartmentRequired: DepartmentRequired = {
    ID: 0,
    STT: 0,
    JobRequirementID: 0,
    RequesterID: 0,
    DepartmentID: 0,
    PositionID: 0,
    RequestDate: new Date(),
    RequestContent: '',
    Reason: '',
    CompletionDate: new Date(),
    Unit: '',
    Quantity: '',
    Description: '',
  };
  data: any[] = [];
   sizeSearch: string = '0';
  isCheckmode: boolean = false;
  dateFormat = 'dd/MM/yyyy';
  DeletedCommend: any[] = [];

   searchParams = {
    JobRequirementID: 0,
    EmployeeID: 0,
    DepartmentID: 0,
    Keyword: '',
    DateStart: new Date(new Date().setFullYear(new Date().getFullYear() - 5)),
    DateEnd: new Date(),
  };

  dataDepartment: any[] = [];
  cbbEmployee: any[] = [];

  DepartmentRequiredData: any[] = [];
  DepartmentRequiredTable: Tabulator | null = null;

  // HCNS Data
  HCNSApprovalData: any[] = [];
  selectedDepartmentRequiredID: number = 0;
  
  // Product selection for approval
  selectedProductIndices = new Set<number>();
  
  // Selected supplier for approval (productIndex, supplierIndex)
  selectedSupplier: { productIndex: number; supplierIndex: number } | null =
    null;
  
  // Modal for disapproval reason
  disapprovalReason: string = '';
  isDisapprovalModalVisible: boolean = false;

  ngOnInit(): void {
      // Cập nhật searchParams với JobrequirementID nếu có
      if (this.JobrequirementID) {
        this.searchParams.JobRequirementID = this.JobrequirementID;
      }
      this.getDepartmentRequired();
      this.getdataEmployee();
      this.getdataDepartment();
  }

  ngAfterViewInit(): void {
    this.draw_DepartmentRequiredTable();
    
    // Sau khi table đã được khởi tạo, load dữ liệu nếu có JobrequirementID
    // Sử dụng setTimeout để đảm bảo table đã được render xong
    if (this.JobrequirementID) {
      setTimeout(() => {
        this.getDepartmentRequired();
      }, 100);
    }
  }

  constructor(
      private notification: NzNotificationService,
      private hrPurchaseProposalService: HrPurchaseProposalService,
      private modalService: NgbModal,
      private modal: NzModalService,
      private cdr: ChangeDetectorRef,
      private message: NzMessageService,
      @Optional() @Inject('tabData') private tabData: any
    ) {
      // Khi mở từ new tab, data được truyền qua injector
      if (this.tabData) {
        this.JobrequirementID = this.tabData.JobrequirementID || 0;
        this.searchParams.JobRequirementID = this.JobrequirementID;
        this.isCheckmode = this.tabData.isCheckmode || false;
      }
    }

      toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  searchData() {
    this.getDepartmentRequired();
  }

    filterOption = (input: string, option: any): boolean => {
    const label = option.nzLabel?.toLowerCase() || '';
    const value = option.nzValue?.toString().toLowerCase() || '';
    return (
      label.includes(input.toLowerCase()) || value.includes(input.toLowerCase())
    );
  };

   getDepartmentRequired(): void {
    this.hrPurchaseProposalService
      .getDepartmentRequired(
      this.searchParams.JobRequirementID,
      this.searchParams.EmployeeID,
      this.searchParams.DepartmentID,
      this.searchParams.Keyword,
      this.searchParams.DateStart,
      this.searchParams.DateEnd
      )
      .subscribe((response: any) => {
        this.DepartmentRequiredData =
          response.data?.departmentRequiredData || [];
      if (this.DepartmentRequiredTable) {
          this.DepartmentRequiredTable.setData(
            this.DepartmentRequiredData || []
          );
      } else {
        this.draw_DepartmentRequiredTable();
      }
    });
  }

   getdataDepartment() {
    this.hrPurchaseProposalService
      .getDataDepartment()
      .subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }
  getdataEmployee() {
    this.hrPurchaseProposalService
      .getAllEmployee()
      .subscribe((response: any) => {
      this.cbbEmployee = response.data || [];
    });
  }

  /**
   * Load dữ liệu HCNS từ database dựa trên DepartmentRequiredID
   */
  loadHCNSData(DepartmentRequiredID: number): void {
    if (!DepartmentRequiredID || DepartmentRequiredID === 0) {
      this.HCNSApprovalData = [];
      return;
    }

    this.hrPurchaseProposalService
      .getHCNSProposals(
      this.JobrequirementID,
      DepartmentRequiredID,
      this.searchParams.DateStart,
      this.searchParams.DateEnd
      )
      .subscribe({
      next: (response: any) => {
        this.loadHCNSDataFromDB(response);
      },
      error: (err) => {
        this.HCNSApprovalData = [];
        },
    });
  }

  /**
   * Load và transform dữ liệu HCNS từ database
   * Transform từ flat structure (mỗi row có ProductName, Supplier...) 
   * thành nested structure (Product với Suppliers array)
   */
  private loadHCNSDataFromDB(response: any): void {
    
    // Lấy dữ liệu HCNSProposals từ response
    const hcnsProposals = response?.data?.HCNSProPosalData || [];

    if (!hcnsProposals || !hcnsProposals.length) {
      this.HCNSApprovalData = [];
      return;
    }

    // Group các rows theo ProductName
    const productMap = new Map<string, any[]>();

    hcnsProposals.forEach((row: any) => {
      const productName = row.ProductName || '';
      
      if (!productName) return; // Bỏ qua nếu không có ProductName
      
      if (!productMap.has(productName)) {
        productMap.set(productName, []);
      }

      const supplier = {
        ID: row.ID || 0,
        STT: row.STT || 0,
        JobRequirementID: row.JobRequirementID || this.JobrequirementID || 0,
        DepartmentRequiredID: row.DepartmentRequiredID || 0,
        Supplier: row.Supplier || '',
        Contact: row.Contact || '',
        UnitPrice: row.UnitPrice || '',
        TotalAmount: row.TotalAmount || '',
        Note: row.Note || '',
        IsApproved: row.IsApproved !== undefined ? row.IsApproved : 0, // 0: Chưa duyệt, 1: Đã duyệt, 2: Hủy duyệt
        DisapprovalReason: row.DisapprovalReason || '',
        ApprovalDate: row.ApprovalDate || '',   
      };

      productMap.get(productName)!.push(supplier);
    });

    // Transform thành array với ProductName và Suppliers
    this.HCNSApprovalData = Array.from(productMap.entries()).map(
      ([productName, suppliers]) => ({
      ProductName: productName,
      Suppliers: suppliers,
      })
    );
  }

  onDeleteDepartmentRequired() {
    const dataSelect: DepartmentRequired[] =
      this.DepartmentRequiredTable!.getSelectedData();
    const payloads = {
      JobRequirementID: this.JobrequirementID || 0,
      DepartmentRequired: [
        {
          ...dataSelect[0],
          IsDeleted: true,
        },
      ],
      HCNSProposal: [
        {
          IsDeleted: true
        }
      ],
      DeletedCommend: [],
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một văn bản để xóa!'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].ID} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.hrPurchaseProposalService.saveData(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.getDepartmentRequired();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
          },
        });
      },
    });
  }

   private draw_DepartmentRequiredTable(): void {
    if (this.DepartmentRequiredTable) {
      this.DepartmentRequiredTable.setData(this.DepartmentRequiredData || []);
    } else {
      this.DepartmentRequiredTable = new Tabulator(
        this.tableRef1.nativeElement,
        {
        data: this.DepartmentRequiredData || [],
        ...DEFAULT_TABLE_CONFIG,
        selectableRows: 1,
        paginationMode: 'local',
        height: '100%',
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
          },
          {
            title: 'Người yêu cầu',
            field: 'EmployeeName',
            headerHozAlign: 'center',
          },
          {
            title: 'Vị trí',
            field: 'ChucVu',
            headerHozAlign: 'center',
          },
              {
            title: 'Bộ phận',
            field: 'EmployeeDepartment',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày yêu cầu',
            field: 'DateRequest',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Nội dung yêu cầu',
            field: 'RequestContent',
            headerHozAlign: 'center',
          },
      
          {
            title: 'Lý do yêu cầu',
            field: 'Reason',
            headerHozAlign: 'center',
          },
          {
            title: 'Đơn vị tính',
            field: 'Unit',
            headerHozAlign: 'center',
          },
          {
            title: 'Số lượng',
            field: 'Quantity',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày yêu cầu hoàn thành',
            field: 'CompletionDate',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Link/Mô tả chi tiết',
            field: 'Note',
            headerHozAlign: 'center',
          },
        ],
        }
      );

      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.DepartmentRequiredTable.on('rowSelected', (row: RowComponent) => {
        const rowData: any = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        
        // Lấy JobRequirementID từ rowData (không phải ID)
        this.JobrequirementID =
          rowData['JobRequirementID'] ||
          rowData['JobrequirementID'] ||
          this.JobrequirementID ||
          0;
        
        // Lấy DepartmentRequiredID từ ID của row
        this.selectedDepartmentRequiredID = rowData['ID'] || 0;
        
        // Load HCNS data khi chọn DepartmentRequired
        if (this.selectedDepartmentRequiredID) {
          this.loadHCNSData(this.selectedDepartmentRequiredID);
        }
      });
      this.DepartmentRequiredTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.DepartmentRequiredTable!.getSelectedRows();
        this.JobrequirementID = 0;
        this.selectedDepartmentRequiredID = 0;
        this.HCNSApprovalData = [];
        if (selectedRows.length === 0) {
          this.data = []; // Reset data
        }
      });
    }
  }

  /**
   * Format approval badge based on status
   */
  formatApprovalBadge(status: number): string {
    // 0 hoặc null: Chưa duyệt, 1: Đã duyệt, 2: Hủy duyệt
    const numStatus =
      status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Hủy duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
    }
  }

  /**
   * Select supplier row when clicked
   */
  selectSupplier(productIndex: number, supplierIndex: number): void {
    this.selectedSupplier = { productIndex, supplierIndex };
  }

  /**
   * Check if supplier is selected
   */
  isSupplierSelected(productIndex: number, supplierIndex: number): boolean {
    return (
      this.selectedSupplier?.productIndex === productIndex &&
      this.selectedSupplier?.supplierIndex === supplierIndex
    );
  }

  /**
   * Approve supplier (IsApproved = 1)
   */
  approveSupplier(): void {
    if (!this.selectedSupplier) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một nhà cung cấp để duyệt');
      return;
    }

    const { productIndex, supplierIndex } = this.selectedSupplier;
    const product = this.HCNSApprovalData[productIndex];
    if (!product || !product.Suppliers || !product.Suppliers[supplierIndex]) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy nhà cung cấp được chọn!');
      return;
    }

    const supplier = product.Suppliers[supplierIndex];
    
    // Cập nhật trạng thái
    supplier.IsApproved = 1;
    supplier.DisapprovalReason = '';
    supplier.ApprovalDate = DateTime.now().toISO();

    // Lưu vào database
    this.saveSupplierApproval(supplier);

    this.notification.success(NOTIFICATION_TITLE.success, 'Đã duyệt nhà cung cấp thành công');
    this.selectedSupplier = null;
    this.cdr.detectChanges();
  }

  /**
   * Disapprove supplier (IsApproved = 2) - hiển thị modal để nhập lý do
   */
  disapproveSupplier(): void {
    if (!this.selectedSupplier) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một nhà cung cấp để hủy duyệt');
      return;
    }

    // Hiển thị modal để nhập lý do hủy duyệt
    this.disapprovalReason = '';
    this.isDisapprovalModalVisible = true;
  }

  /**
   * Xác nhận hủy duyệt sau khi nhập lý do
   */
  confirmDisapprove(): void {
    if (!this.selectedSupplier) {
      return;
    }

    if (!this.disapprovalReason || this.disapprovalReason.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập lý do hủy duyệt');
      return;
    }

    const { productIndex, supplierIndex } = this.selectedSupplier;
    const product = this.HCNSApprovalData[productIndex];
    if (!product || !product.Suppliers || !product.Suppliers[supplierIndex]) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy nhà cung cấp được chọn');
      return;
    }

    const supplier = product.Suppliers[supplierIndex];
    
    // Cập nhật trạng thái
    supplier.IsApproved = 2;
    supplier.DisapprovalReason = this.disapprovalReason.trim();
    supplier.ApprovalDate = DateTime.now().toISO();

    // Lưu vào database
    this.saveSupplierApproval(supplier);

    this.notification.success(NOTIFICATION_TITLE.success, 'Đã hủy duyệt nhà cung cấp');
    this.isDisapprovalModalVisible = false;
    this.disapprovalReason = '';
    this.selectedSupplier = null;
    this.cdr.detectChanges();
  }

  /**
   * Hủy modal hủy duyệt
   */
  cancelDisapprove(): void {
    this.isDisapprovalModalVisible = false;
    this.disapprovalReason = '';
  }

  /**
   * Lưu approval status vào database
   */
  private saveSupplierApproval(supplier: any): void {
    if (!this.selectedSupplier) {
      return;
    }

    const product = this.HCNSApprovalData[this.selectedSupplier.productIndex];
    if (!product) {
      return;
    }

    // Xây dựng HCNSProposal payload với tất cả suppliers, chỉ update supplier được chọn
    const hcnsProposal: any[] = [];
    const { productIndex, supplierIndex } = this.selectedSupplier;

    this.HCNSApprovalData.forEach((prod, prodIdx) => {
      if (prod.Suppliers && prod.Suppliers.length > 0) {
        prod.Suppliers.forEach((sup: any, supIdx: number) => {

          const isSelectedSupplier =
            prodIdx === productIndex && supIdx === supplierIndex;

          hcnsProposal.push({
            ID: sup.ID || 0,
            STT: sup.STT || 0,
            JobRequirementID:
              sup.JobRequirementID || this.JobrequirementID || 0,
            DepartmentRequiredID:
              sup.DepartmentRequiredID ||
              this.selectedDepartmentRequiredID ||
              0,
            ProductName: prod.ProductName || '',
            Supplier: sup.Supplier || '',
            Contact: sup.Contact || '',
            UnitPrice: sup.UnitPrice || 0,
            TotalAmount: sup.TotalAmount || 0,
            Note: sup.Note || '',
            // Chỉ update approval cho supplier được chọn
            IsApproved: isSelectedSupplier
              ? supplier.IsApproved
              : sup.IsApproved !== undefined
              ? sup.IsApproved
              : null,
            DisapprovalReason: isSelectedSupplier
              ? supplier.DisapprovalReason
              : sup.DisapprovalReason || '',
            ApprovalDate: new Date(),
          });
        });
      }
    });

    // Khi chỉ cập nhật approval, không gửi DepartmentRequired để tránh lỗi tracking entity
    // Chỉ gửi HCNSProposal với approval data
    const payload = {
      JobRequirementID: this.JobrequirementID || 0,
      DepartmentRequired: [], // Không gửi DepartmentRequired khi chỉ update approval
      HCNSProposal: hcnsProposal,
      DeletedCommend: [],
    };

    // Gọi API để lưu approval status
    this.hrPurchaseProposalService.saveData(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          // Reload HCNS data để cập nhật từ server
          if (this.selectedDepartmentRequiredID) {
            this.loadHCNSData(this.selectedDepartmentRequiredID);
          }
        } else {
          this.message.warning(
            response.message || 'Không thể lưu trạng thái duyệt'
          );
        }
      },
      error: (err) => {
      },
    });
  }
}
