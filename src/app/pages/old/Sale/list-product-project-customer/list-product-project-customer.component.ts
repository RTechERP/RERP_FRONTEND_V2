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
import * as ExcelJS from 'exceljs';
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
  contextMenu: MenuItem[] = [{ label: ' ', disabled: true }]; // placeholder để p-table đăng ký context menu

  selectedContextRow: any = null;

  getContextMenuItems = (row: any): MenuItem[] => {
    if (!row) return [];

    const ids: number[] = String(row.BillExportIDs || '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((id: number) => !isNaN(id) && id > 0);

    const codes: string[] = String(row.BillExportCodes || '')
      .split(',')
      .map((s: string) => s.trim());

    if (ids.length === 0) return [{ label: 'Không có phiếu xuất', disabled: true }];

    return ids.map((id: number, i: number) => ({
      label: `Xem phiếu xuất: ${codes[i] || id}`,
      icon: 'fas fa-eye text-primary',
      command: () => this.openBillExportDetail(id),
    }));
  };

  cbbProject: any;
  cbbCustomer: { ID: number; CustomerName: string }[] = [];
  isLoading: boolean = false;
  warehouseCode: string = 'HN';
  sreachParam = {
    selectedProject: {
      ProjectCode: '',
      ID: 0,
    },
    selectedCustomer: {
      ID: 0,
      CustomerName: '',
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
    this.getProject();
    this.getCustomers();
    this.initColumns();
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

  openBillExportDetail(billExportID: number) {
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
      this.sreachParam.selectedProject = { ProjectCode: '', ID: 0 };
    }
    this.isLoading = true;
    this.listproductprojectService
      .getDataCustomer(
        this.sreachParam.selectedProject.ProjectCode,
        this.sreachParam.selectedProject.ID,
        this.sreachParam.WareHouseCode,
        this.sreachParam.selectedCustomer?.ID || 0
      )
      .subscribe({
        next: (res) => {
          this.dataset = res.data || [];
          this.isLoading = false;
        },
        error: () => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy sản phẩm theo dự án');
          this.isLoading = false;
        },
      });
  }

  exportExcel() {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel');
      return;
    }

    this.isLoading = true;
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh sách sản phẩm');

      worksheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Mã dự án', key: 'ProjectCode', width: 15 },
        { header: 'Mã sản phẩm', key: 'ProductCode', width: 18 },
        { header: 'Mã nội bộ', key: 'ProductNewCode', width: 15 },
        { header: 'Tên sản phẩm', key: 'ProductName', width: 35 },
        { header: 'Tổng xuất dự án', key: 'TotalExportQty', width: 14 },
        { header: 'Ngày tạo', key: 'BillDate', width: 14 },
        { header: 'Mã phiếu', key: 'BillExportCodes', width: 18 },
        { header: 'Khách hàng', key: 'CustomerName', width: 35 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      headerRow.height = 25;
      headerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      let totalExportQty = 0;

      this.dataset.forEach((item: any, index: number) => {
        const row = worksheet.addRow({
          stt: index + 1,
          ProjectCode: this.cleanXml(item.ProjectCode),
          ProductCode: this.cleanXml(item.ProductCode),
          ProductNewCode: this.cleanXml(item.ProductNewCode),
          ProductName: this.cleanXml(item.ProductName),
          TotalExportQty: item.TotalExportQty || 0,
          BillDate: item.BillDate || '',
          BillExportCodes: this.cleanXml(item.BillExportCodes),
          CustomerName: this.cleanXml(item.CustomerName),
        });

        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });

        row.getCell('stt').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('ProjectCode').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('BillDate').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('TotalExportQty').alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell('TotalExportQty').numFmt = '#,##0';
        totalExportQty += item.TotalExportQty || 0;
      });

      const footerRow = worksheet.addRow({
        stt: '', ProjectCode: '', ProductCode: 'TỔNG',
        ProductNewCode: '', ProductName: '',
        TotalExportQty: totalExportQty,
        BillDate: '', BillExportCodes: '', CustomerName: '',
      });
      footerRow.font = { bold: true, size: 11 };
      footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
      footerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
      footerRow.getCell('TotalExportQty').alignment = { horizontal: 'right', vertical: 'middle' };
      footerRow.getCell('TotalExportQty').numFmt = '#,##0';

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DanhSachSanPham_${this.warehouseCode}_${dateStr}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file Excel thành công!', { nzDuration: 1500 });
      });
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xuất Excel');
      this.isLoading = false;
    }
  }

  getProject() {
    this.listproductprojectService.getProject().subscribe({
      next: (res) => {
        this.cbbProject = res.data;
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy dự án');
      },
    });
  }

  getCustomers() {
    this.listproductprojectService.getCustomers().subscribe({
      next: (res) => {
        this.cbbCustomer = res.data || [];
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy khách hàng');
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
      },
      {
        field: 'ProductCode',
        header: 'Mã sản phẩm',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
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
        field: 'TotalExportQty',
        header: 'Xuất dự án',
        width: '80px',
        sortable: true,
        filterType: 'numeric',
        footerType: 'sum',
        cssClass: 'text-right',
      },

      {
        field: 'BillDate',
        header: 'Ngày tạo',
        width: '120px',
        sortable: true,
        filterMode: 'input',
        // format: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '',
      },
      {
        field: 'BillExportCodes',
        header: 'Mã phiếu',
        width: '150px',
        sortable: true,
        filterMode: 'multiselect',
      },
      {
        field: 'CustomerName',
        header: 'Khách hàng',
        width: '250px',
        sortable: true,
        filterMode: 'multiselect',
        textWrap: true,
      },
      {
        field: 'BillExportIDs',
        header: 'BillExportIDs',
        width: '0px',
        visible: false,
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

}
