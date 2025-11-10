import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import * as ExcelJS from 'exceljs';
import { RulePayService, RulePay } from './rule-pay.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RulePayDetailComponent } from './rule-pay-detail/rule-pay-detail.component';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-rule-pay',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzFormModule,
    NzNotificationModule,
    NzSelectModule,
    NzSplitterModule,
    NzProgressModule,
    NzInputNumberModule,
    NzCheckboxModule
    , HasPermissionDirective
  ],
  templateUrl: './rule-pay.component.html',
  styleUrl: './rule-pay.component.css'
})
export class RulePayComponent implements OnInit, AfterViewInit {
  // Bảng dữ liệu
  table: any;
  dataTable: any[] = [];
  listData: any[] = [];

  // Biến tìm kiếm
  searchText: string = '';
  keyword: string = '';

  // Biến modal
  isCheckmode = false;

  // Form data
  newRulePay: RulePay = {
    Code: '',
    Note: ''
  };

  // Selected items
  selectedList: any[] = [];
  selectAll: boolean = false;

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private rulePayService: RulePayService
  ) { }

  ngOnInit(): void {
    this.getData();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }



  getData(): void {
    // Xóa cache để luôn lấy dữ liệu mới nhất
    localStorage.removeItem('rulePayData');
    localStorage.removeItem('rulePayLastFetch');

    // Kiểm tra xem có dữ liệu trong localStorage không
    const cachedData = localStorage.getItem('rulePayData');
    const lastFetchTime = localStorage.getItem('rulePayLastFetch');
    const currentTime = new Date().getTime();

    // Nếu có dữ liệu cache và chưa quá 5 phút, sử dụng cache
    if (cachedData && lastFetchTime && (currentTime - parseInt(lastFetchTime)) < 300000) {
      try {
        this.dataTable = JSON.parse(cachedData);
        this.listData = [...this.dataTable];
        if (this.table) {
          this.table.replaceData(this.dataTable);
        }
        console.log('Using cached data');
        return;
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }

    // Nếu không có cache hoặc cache đã hết hạn, fetch từ server
    this.rulePayService.getAll().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.dataTable = response.data || [];
          this.listData = [...this.dataTable];
          // Lưu vào localStorage
          localStorage.setItem('rulePayData', JSON.stringify(this.dataTable));
          localStorage.setItem('rulePayLastFetch', currentTime.toString());
          if (this.table) {
            this.table.replaceData(this.dataTable);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể kết nối đến server');
      }
    });
  }

  drawTable(): void {
    this.table = new Tabulator('#rule-pay-table', {
      data: this.dataTable,
       ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',  
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      layout: 'fitDataStretch',
      
      columns: [
        { title: 'Mã', field: 'Code', width: 350, formatter: 'textarea' },
        { title: 'Chú giải', field: 'Note', formatter: 'textarea' }
      ]
    });



    this.table.on('rowSelectionChanged', (data: any, rows: any) => {
      this.selectedList = rows.map((row: any) => row.getData());
      this.selectAll = rows.length === this.dataTable.length && this.dataTable.length > 0;
    });
  }

  openModal(): void {
    console.log('Opening modal with data:', this.newRulePay);
    const modalRef = this.modalService.open(RulePayDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.newRulePay = this.newRulePay;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getData();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }



  delete(): void {
    if (this.selectedList.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dữ liệu cần xóa!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa dữ liệu đã chọn?',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const idsToDelete = this.selectedList.map(item => item.ID);
        this.rulePayService.saveData({ DeleteIds: idsToDelete }).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công!');
              this.getData();
              this.selectedList = [];
              this.selectAll = false;
              this.searchText = '';
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không thể xóa dữ liệu');
            }
          },
          error: (error) => {
            console.error('Error deleting data:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Không thể kết nối đến server');
          }
        });
      }
    });
  }

  deleteGroup(): void {
    this.notification.info('Thông báo', 'Chức năng xóa nhóm TB đang được phát triển');
  }

  editItem(): void {
    if (this.selectedList.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dữ liệu cần sửa!');
      return;
    }
    if (this.selectedList.length > 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chỉ chọn 1 dữ liệu để sửa!');
      return;
    }

    this.newRulePay = { ...this.selectedList[0] };
    this.isCheckmode = true;
    this.openModal();
  }

  importExcel(): void {
    this.notification.info('Thông báo', 'Chức năng nhập Excel đang được phát triển');
  }

  search(): void {
    const keyword = this.searchText.trim().toLowerCase();
    if (!keyword) {
      this.table.replaceData(this.listData);
      return;
    }
    const filtered = this.listData.filter(item =>
      (item.Code && item.Code.toLowerCase().includes(keyword)) ||
      (item.Note && item.Note.toLowerCase().includes(keyword))
    );
    this.table.replaceData(filtered);
  }

  onSelectAllChange(checked: boolean): void {
    if (checked) {
      this.table.selectRow();
    } else {
      this.table.deselectRow();
    }
  }

  async exportExcel(): Promise<void> {
    const data = this.table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Điều Khoản Thanh Toán');

    // Headers
    const headers = ['STT', 'Mã', 'Chú giải'];
    worksheet.addRow(headers);

    // Data
    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        row.Code,
        row.Note
      ];
      worksheet.addRow(rowData);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DieuKhoanThanhToan.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);

    this.notification.success('Thông báo', 'Xuất Excel thành công!');
  }

  openModalForNew(): void {
    this.isCheckmode = false;
    this.newRulePay = {
      Code: '',
      Note: ''
    };
    this.openModal();
  }



} 