import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProjectService } from '../project-service/project.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-project-partlist-problem',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
  ],
  templateUrl: './project-partlist-problem.component.html',
  styleUrl: './project-partlist-problem.component.css'
})
export class ProjectPartlistProblemComponent implements OnInit, AfterViewInit {
  @Input() projectID: number = 0;
  sizeSearch: string = '22%';
  
  @ViewChild('tb_projectPartlistProblem', { static: false })
  tb_projectPartlistProblemContainer!: ElementRef;
  tb_projectPartlistProblem: any;
  dataProject: any[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;
  searchKeyword: string = '';

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    // Set giá trị mặc định: fromDate = ngày 1 tháng hiện tại, toDate = ngày 1 tháng sau
    const now = DateTime.now();
    this.fromDate = now.startOf('month').toJSDate();
    this.toDate = now.plus({ months: 1 }).startOf('month').toJSDate();
    
    this.getProject();
  }

  ngAfterViewInit() {
    // Sử dụng setTimeout để đảm bảo container đã render xong (đặc biệt với modal và splitter)
    setTimeout(() => {
      if (this.tb_projectPartlistProblemContainer) {
        this.drawTbProjectPartlistProblem(this.tb_projectPartlistProblemContainer.nativeElement);
        // Trigger load data sau khi khởi tạo bảng
        setTimeout(() => {
          if (this.tb_projectPartlistProblem) {
            this.tb_projectPartlistProblem.setPage(1);
          }
        }, 100);
      }
    }, 100);
  }

  drawTbProjectPartlistProblem(container: HTMLElement) {
    this.tb_projectPartlistProblem = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination: true,
      layout: 'fitColumns',
      locale: 'vi',
      index: 'ID',
      rowHeader: false,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [10, 30, 50, 100, 300, 500],
      selectableRows: true,
      ajaxURL: 'get-project-partlist-problem', // Placeholder URL - ajaxRequestFunc sẽ override
      ajaxConfig: 'GET',
      ajaxRequestFunc: (url, config, params) => {
        const now = DateTime.now();
        const fromDateStr = this.fromDate 
          ? DateTime.fromJSDate(this.fromDate).toFormat('yyyy-MM-dd') 
          : now.startOf('month').toFormat('yyyy-MM-dd');
        const toDateStr = this.toDate 
          ? DateTime.fromJSDate(this.toDate).toFormat('yyyy-MM-dd') 
          : now.plus({ months: 1 }).startOf('month').toFormat('yyyy-MM-dd');

        const request = {
          pageNumber: params.page || 1,
          pageSize: params.size || 50,
          dateStart: fromDateStr,
          dateEnd: toDateStr,
          projectId: this.projectID || 0,
          keyword: this.searchKeyword || '',
        };

        console.log('Loading project partlist problem data:', request);
        return this.projectService.getProjectPartlistProblem(request).toPromise().catch((error) => {
          console.error('Error loading project partlist problem data:', error);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu vật tư phát sinh!');
          throw error;
        });
      },
      ajaxResponse: (url, params, res) => {
        console.log('API Response:', res);
        // API trả về { status: 1, data: { dt: [...], totalpage: [...] } }
        if (res && res.status === 1 && res.data) {
          // Kiểm tra xem data có phải là array trực tiếp không
          const data = Array.isArray(res.data) ? res.data : (res.data.dt || []);
          
          // Xử lý totalpage - có thể là array hoặc number
          let totalPage = 1;
          if (res.data && res.data.totalpage) {
            if (Array.isArray(res.data.totalpage)) {
              // Nếu là array, lấy phần tử đầu tiên (có thể là object với property TotalPage hoặc là number)
              totalPage = res.data.totalpage[0]?.TotalPage || res.data.totalpage[0] || 1;
            } else if (typeof res.data.totalpage === 'number') {
              totalPage = res.data.totalpage;
            }
          }

          console.log('Processed data:', data.length, 'Total pages:', totalPage);
          return {
            data: data,
            last_page: totalPage,
          };
        }
        
        // Trường hợp lỗi hoặc response không đúng format
        console.warn('Unexpected response format:', res);
        return {
          data: [],
          last_page: 1,
        };
      },
      columns: [
        {
          title: 'TT',
        field:'TT',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          frozen: true,
        },
        {
          title: 'Tên vật tư',
          field: 'GroupMaterial',
          headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Mã thiết bị',
          field: 'ProductCode',
          headerHozAlign: 'center',
          width: 120,
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          headerHozAlign: 'center',
          width: 120,
        },
        {
          title: 'Số lượng/1 máy',
          field: 'QtyMin',
          hozAlign: 'right',
          headerHozAlign: 'center',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Số lượng tổng',
          field: 'QtyFull',
          headerHozAlign: 'center',
          hozAlign: 'right',
          width: 120,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Đơn vị',
          field: 'Unit',
          headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Đơn giá báo',
          field: 'UnitPriceQuote',
          headerHozAlign: 'center',
          width: 130,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Thành tiền báo giá',
          field: 'TotalPriceQuote',
          headerHozAlign: 'center',
          width: 150,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Đơn giá mua',
          field: 'UnitPricePurchase',
          headerHozAlign: 'center',
          width: 130,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Thành tiền mua',
          field: 'TotalPricePurchase',
          headerHozAlign: 'center',
          width: 150,
          hozAlign: 'right',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            return value != null ? value.toLocaleString('vi-VN') : '';
          },
        },
        {
          title: 'Ngày phát sinh',
          field: 'CreatedDate',
          headerHozAlign: 'center',
          width: 130,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (!value) return '';
            const date = typeof value === 'string' ? DateTime.fromISO(value) : DateTime.fromJSDate(value);
            return date.isValid ? date.toFormat('dd/MM/yyyy HH:mm') : '';
          },
        },
        {
          title: 'Lý do phát sinh',
          field: 'ReasonProblem',
          headerHozAlign: 'center',
          width: 200,
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          headerHozAlign: 'center',
          width: 120,
        },   
        {
          title: 'Ghi chú',
          field: 'Note',
          headerHozAlign: 'center',
          width: 200,
        },
      ],
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectID = 0;
    // Set lại giá trị mặc định: fromDate = ngày 1 tháng hiện tại, toDate = ngày 1 tháng sau
    const now = DateTime.now();
    this.fromDate = now.startOf('month').toJSDate();
    this.toDate = now.plus({ months: 1 }).startOf('month').toJSDate();
    this.searchKeyword = '';
    this.refreshTable();
  }

  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }

  getProjectPartlistProblem() {
    this.refreshTable();
  }

  refreshTable() {
    if (this.tb_projectPartlistProblem) {
      // Reload data từ trang đầu tiên
      this.tb_projectPartlistProblem.setPage(1);
    }
  }

  exportExcel() {
    const table = this.tb_projectPartlistProblem;
    if (!table) return;
    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }
    this.projectService.exportExcel(table, data, 'Vật tư phát sinh', 'Vật tư phát sinh');
  }
}
