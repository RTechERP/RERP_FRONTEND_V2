import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProtectgearService } from '../protectgear-service/protectgear.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ProtectgearFormComponent } from '../protectgear-form/protectgear-form.component';

@Component({
  standalone: true,
  imports: [
    NzUploadModule,
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
    NgbModalModule,
    NzModalModule,
    HasPermissionDirective,
  ],
  selector: 'app-protectgear',
  templateUrl: './protectgear.component.html',
  styleUrl: './protectgear.component.css',
})
export class ProtectgearComponent implements OnInit, AfterViewInit {
  dataInput: any = {};
  constructor(
    private notification: NzNotificationService,
    private protectgearService: ProtectgearService,
    private modal: NzModalService
  ) {}
  
  protectgearTable: Tabulator | null = null;
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  detailTabTitle: string = 'Chi tiết đồ bảo hộ';
  isSearchVisible: boolean = false;
  productGroupData: any[] = [];
  protectgearData: any[] = [];
  productGroupID: number = 0;
  keyWord: string = '';
  checkAll: number = 0;
  Size: number = 100000;
  Page: number = 1;
  searchMode: string = 'group';
  modalData: any = [];
  private ngbModal = inject(NgbModal);

  ngOnInit() {}

  ngAfterViewInit(): void {
    // Initialize table first - it will auto-load data via remote pagination
    this.getGroup();
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.drawTable();
    }, 100);
  }

  getGroup() {
    this.protectgearService.getProtectgearGroup().subscribe((response: any) => {
      this.productGroupData = response.data;
    });
  }

  getProtectgear() {
    // With remote pagination, trigger reload by setting page to 1
    if (this.protectgearTable) {
      // Force reload by setting page to 1 (will trigger ajaxRequestFunc)
      const currentPage = this.protectgearTable.getPage();
      if (currentPage === 1) {
        // If already on page 1, force reload by replacing with empty then setting page
        this.protectgearTable.replaceData([]).then(() => {
          this.protectgearTable?.setPage(1);
        });
      } else {
        this.protectgearTable.setPage(1);
      }
    }
  }

  onGroupChange(groupID: number): void {
    this.productGroupID = groupID;
    this.getProtectgear();
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.getProtectgear();
  }

  onSearchModeChange(mode: string): void {
    this.searchMode = mode;
    if (mode === 'all') {
      this.checkAll = 1;
    }
    if (mode === 'group') {
      this.checkAll = 0;
    }
    this.getProtectgear();
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  drawTable() {
    this.protectgearTable = new Tabulator('#dataTableProtectgear', {
      ...DEFAULT_TABLE_CONFIG,
      ajaxURL: '/api/protectgear',
      ajaxConfig: 'POST',
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 20, 50, 100],
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          productGroupID: this.productGroupID || 140,
          keyword: this.keyWord || '',
          checkAll: this.checkAll || 1,
          page: params.page || 1,
          size: params.size || 50,
        };
        console.log('Tabulator ajaxRequestFunc called with:', request);
        return this.protectgearService.getProtectgear(request).toPromise().then(response => {
          console.log('Tabulator ajaxResponse received:', response);
          return response;
        });
      },
      ajaxResponse: (url, params, response) => {
        console.log('ajaxResponse processing:', response);
        // Backend returns: { status: 1, data: [protectiveGears[]], TotalPage: [{ TotalPage: X }] }
        return {
          data: response.data[0] || [],
          last_page: response.TotalPage?.[0]?.TotalPage || 1,
        };
      },
      columns: [
        { title: 'ID', field: 'ID', visible: false, frozen: true },
        { title: 'STT', field: 'STT', visible: false, frozen: true },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => {
            return `<div style="text-align:center;">${cell.getValue()}</div>`;
          },
          frozen: true,
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          minWidth: 120,
          frozen: true,
          formatter: 'textarea',
        },
        { title: 'Vị trí (Hộp)', field: 'LocationName', minWidth: 200 },
        { title: 'Hãng', field: 'FirmName' },
        { title: 'ĐVT', field: 'UnitCountName', minWidth: 120 },
        { title: 'Ảnh ', field: 'LocationImg' },
        {
          title: 'Mã nhóm',
          field: 'ProductGroupNo',
          minWidth: 120,
          visible: false,
        },
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          minWidth: 120,
          formatter: 'textarea',
        },
        { title: 'Mã kế toán', field: 'ProductCodeRTC' },
        {
          title: 'Ngày tạo',
          field: 'CreateDate',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'DD/MM/YYYY HH:mm' },
        },
        { title: 'Part Number', field: 'PartNumber', minWidth: 120 },
        { title: 'Serial Number', field: 'SerialNumber', minWidth: 120 },
        { title: 'Code', field: 'Serial', minWidth: 120 },
        { title: 'Người tạo', field: 'CreatedBy', visible: false },
        { title: 'Số lượng', field: 'Number', visible: false },
        { title: 'SL tồn kho', field: 'NumberInStore', visible: false },
        {
          title: 'Ghi chú',
          field: 'Note',
          minWidth: 450,
          visible: false,
          formatter: 'textarea',
        },
       
        { title: 'Size', field: 'Size', visible: false },
      ],
    });

    this.protectgearTable.on(
      'rowDblClick',
      (e: UIEvent, row: RowComponent) => {
        const selectedProduct = row.getData();
        const modalRef = this.ngbModal.open(ProtectgearFormComponent, {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          centered: true,
        });
        modalRef.componentInstance.dataInput = selectedProduct;
        modalRef.result.then(
          (result) => {
            this.getProtectgear();
          },
          () => {
            console.log('Modal dismissed');
          }
        );
      }
    );
  }

  onAddGroupProduct() {
    // TODO: Implement add group modal
    this.notification.info('Thông báo', 'Chức năng đang được phát triển');
  }

  onEditGroup() {
    const selectedGroup = this.productGroupData.find(
      (group) => group.ID === this.productGroupID
    );
    if (!selectedGroup) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một nhóm sản phẩm để sửa.'
      );
      return;
    }
    // TODO: Implement edit group modal
    this.notification.info('Thông báo', 'Chức năng đang được phát triển');
  }

  onDeleteProductGroup() {
    if (this.protectgearData.length !== 0) {
      this.notification.warning(
        'Thông báo',
        'Không thể xóa nhóm vì vẫn còn sản phẩm thuộc nhóm này.'
      );
      return;
    }

    const selectedGroup = this.productGroupData.find(
      (group) => group.ID === this.productGroupID
    );

    if (!selectedGroup) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một nhóm để xóa!'
      );
      return;
    }

    let nameDisplay = selectedGroup.ProductGroupName || 'Không xác định';
    if (nameDisplay.length > 30) {
      nameDisplay = nameDisplay.slice(0, 30) + '...';
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa nhóm',
      nzContent: `Bạn có chắc chắn muốn xóa nhóm <b>[${nameDisplay}]</b> không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        // TODO: Implement delete API call
        this.notification.info('Thông báo', 'Chức năng đang được phát triển');
      },
    });
  }

  onDeleteProduct() {
    const selectedRows = this.protectgearTable?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một sản phẩm để xóa!'
      );
      return;
    }

    let nameDisplay = '';
    selectedRows.forEach((item: any, index: number) => {
      nameDisplay += item.ProductName + ',';
    });

    if (selectedRows.length > 10) {
      if (nameDisplay.length > 10) {
        nameDisplay = nameDisplay.slice(0, 10) + '...';
      }
      nameDisplay += ` và ${selectedRows.length - 1} sản phẩm khác`;
    } else {
      if (nameDisplay.length > 20) {
        nameDisplay = nameDisplay.slice(0, 20) + '...';
      }
    }

    const payload = {
      productRTCs: selectedRows.map((row: any) => ({
        ID: row.ID,
        IsDelete: true,
      })),
    };

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa sản phẩm <b>[${nameDisplay}]</b> không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.protectgearService.saveProtectgear(payload).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(
                'Thành công',
                'Đã xóa sản phẩm thành công!'
              );
              this.getProtectgear();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa sản phẩm!'
              );
            }
          },
          error: (err) => {
            console.error('Lỗi xóa:', err);
            this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa sản phẩm!');
          },
        });
      },
    });
  }

  onAddProtectgear() {
    const selectedGroup =
      this.productGroupID && this.productGroupID > 0
        ? this.productGroupID
        : null;

    const modalRef = this.ngbModal.open(ProtectgearFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = {
      ...this.modalData,
      ProductGroupRTCID: selectedGroup,
    };

    modalRef.result.then(
      (result) => {
        this.getProtectgear();
      },
      () => console.log('Modal dismissed')
    );
  }

  onEditProduct() {
    const selected = this.protectgearTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một sản phẩm để sửa!'
      );
      return;
    }

    const selectedProduct = { ...selected[0] };
    const modalRef = this.ngbModal.open(ProtectgearFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = selectedProduct;
    modalRef.result.then(
      (result) => {
        this.getProtectgear();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }

  async exportToExcel() {
    if (!this.protectgearTable) return;

    // Get all data from table (current page data)
    const selectedData = this.protectgearTable.getData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đồ bảo hộ');

    const columns = this.protectgearTable
      .getColumnDefinitions()
      .filter(
        (col: any) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );

    const headerRow = worksheet.addRow(
      columns.map((col) => col.title || col.field)
    );
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        switch (col.field) {
          case 'CreateDate':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-do-bao-ho-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  onResetSearch() {
    this.productGroupID = 0;
    this.keyWord = '';
    this.getProtectgear();
  }

  closePanel() {
    this.sizeTbDetail = '0';
    this.detailTabTitle = 'Chi tiết đồ bảo hộ';
  }
}
