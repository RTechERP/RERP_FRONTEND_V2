import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  Optional,
  Inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ColumnDef } from '../../../../shared/custom-table/column-def.model';
import { CustomTable } from '../../../../shared/custom-table/custom-table';

// ng-zorro
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

// ng-bootstrap
import {
  NgbModal,
  NgbActiveModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';

// Config
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { ListProductProjectService } from '../ListProductProject/list-product-project-service/list-product-project.service';
import { BillExportDetailNewComponent } from '../BillExport/bill-export-detail-new/bill-export-detail-new.component';
// import { ClipboardService } from '../../../../services/clipboard.service';

@Component({
  selector: 'app-list-product-project-customer',
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    CustomTable,
    Menubar,
  ],
  templateUrl: './list-product-project-customer.component.html',
  styleUrl: './list-product-project-customer.component.css'
})
export class ListProductProjectCustomerComponent {
  constructor(
    private listproductprojectService: ListProductProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    // private clipboardService: ClipboardService
    @Optional() @Inject('tabData') private tabData: any,
  ) { }

  listProductMenu: MenuItem[] = [];
  contextMenu: MenuItem[] = [];
  selectedContextRow: any = null;
  cbbProject: any;
  isLoading: boolean = false;
  warehouseCode: string = 'HN';
  sreachParam = {
    selectedProject: {
      ProjectCode: '',
      ID: 0,
      // Có thể thêm ProjectName nếu cần
      // ProjectName: ""
    },
    WareHouseCode: this.warehouseCode,
  };

  columnDefinitions: ColumnDef[] = [];
  dataset: any[] = [];

  private queryParamsSub?: Subscription;

  ngOnInit(): void {
    // Get warehouseCode from query params
    this.queryParamsSub = this.route.queryParams.subscribe((params) => {
      const newWarehouseCode =
        params['warehouseCode'] ?? this.tabData?.warehouseCode ?? 'HN';

      this.warehouseCode = newWarehouseCode;
      this.sreachParam.WareHouseCode = this.warehouseCode;
    });

    this.loadMenu();
    this.initContextMenu();
    this.getProject();
    this.initColumns();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.queryParamsSub) {
      this.queryParamsSub.unsubscribe();
    }
  }
  ngAfterViewInit(): void { }



  loadMenu() {
    this.listProductMenu = [
      {
        label: 'Xem danh sách',
        icon: 'fas fa-search text-primary',
        command: () => this.loadData(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fas fa-file-excel text-success',
        command: () => this.exportExcel(),
      },
    ];
  }

  initContextMenu() {
    this.contextMenu = [
      {
        label: 'Xem phiếu xuất',
        icon: 'fas fa-eye text-primary',
        command: () => this.openBillExportDetail(),
      },
    ];
  }

  openBillExportDetail() {
    const billExportID = this.selectedContextRow?.BillExportID;
    if (!billExportID) {
      this.notification.warning('Thông báo', 'Không tìm thấy ID phiếu xuất');
      return;
    }
    const modalRef = this.modalService.open(BillExportDetailNewComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      fullscreen: true,
    });
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.id = billExportID;
    modalRef.componentInstance.wareHouseCode = this.warehouseCode;
  }

  loadData() {
    if (this.sreachParam.selectedProject == null) {
      this.sreachParam.selectedProject = {
        ProjectCode: '',
        ID: 0,
      };
    }
    this.isLoading = true;
    this.listproductprojectService
      .getDataCustomer(
        this.sreachParam.selectedProject.ProjectCode,
        this.sreachParam.selectedProject.ID,
        this.sreachParam.WareHouseCode,
      )
      .subscribe({
        next: (res) => {
          this.dataset = res.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lấy sản phẩm theo dự án',
          );
          this.isLoading = false;
        },
      });
  }

  getProject() {
    this.listproductprojectService.getProject().subscribe({
      next: (res) => {
        this.cbbProject = res.data;
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Có lỗi xảy ra khi lấy dự án',
        );
      },
    });
  }
  initColumns() {
    this.columnDefinitions = [
      {
        field: 'ProjectCode',
        header: 'Mã dự án',
        width: '120px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'ProductCode',
        header: 'Mã sản phẩm',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'ProductNewCode',
        header: 'Mã nội bộ',
        width: '120px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'ProductName',
        header: 'Tên sản phẩm',
        width: '250px',
        sortable: true,
        textWrap: true,
      },
      {
        field: 'NumberInStoreDauky',
        header: 'Tồn đầu kỳ',
        width: '80px',
        sortable: true,
        filterType: 'numeric',
        footerType: 'sum',
        cssClass: 'text-right',
      },
      {
        field: 'Import',
        header: 'Nhập dự án',
        width: '80px',
        sortable: true,
        filterType: 'numeric',
        footerType: 'sum',
        cssClass: 'text-right',
      },
      {
        field: 'Export',
        header: 'Xuất dự án',
        width: '80px',
        sortable: true,
        filterType: 'numeric',
        footerType: 'sum',
        cssClass: 'text-right',
      },
      {
        field: 'QuantityImportExport',
        header: 'Tồn dự án',
        width: '80px',
        sortable: true,
        filterType: 'numeric',
        footerType: 'sum',
        cssClass: 'text-right',
      },
      {
        field: 'ImportDates',
        header: 'Ngày nhập',
        width: '120px',
        sortable: true,
        filterMode: 'datetime',
        format: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '',
      },
      {
        field: 'ExportDates',
        header: 'Ngày xuất',
        width: '120px',
        sortable: true,
        filterMode: 'datetime',
        format: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '',
      },
      {
        field: 'BillExportCode',
        header: 'Mã phiếu xuất',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'CustomerName',
        header: 'Khách hàng',
        width: '250px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
    ];
  }

  cleanXml(value: any): string {
    if (value === null || value === undefined) return '';

    return (
      String(value)
        // remove invalid XML chars
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        // remove nbsp
        .replace(/\u00A0/g, ' ')
        // remove emoji (optional nhưng nên)
        .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    );
  }

  exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
      return;
    }
    // Export functionality is handled by CustomTable's exportCSV or similar
    // We can also trigger it manually if we had a ViewChild to CustomTable
  }
}
