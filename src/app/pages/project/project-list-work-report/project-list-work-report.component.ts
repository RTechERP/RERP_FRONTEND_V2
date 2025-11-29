import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../project-service/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { ProjectChangeComponent } from '../project-change/project-change.component';

@Component({
  selector: 'app-project-list-work-report',
  templateUrl: './project-list-work-report.component.html',
  styleUrls: ['./project-list-work-report.component.css'],
  standalone: true,
  imports: [
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzFormModule,
  ],
})
export class ProjectListWorkReportComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  sizeSearch: string = '0';

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal
  ) { }
  
  @ViewChild('tb_projectlistworkreport', { static: false })
  tb_projectListWorkReportContainer!: ElementRef;
  tb_projectListWorkReport: any;
  dataProject: any[] = [];
  projects: any[] = [];
  keyword: string = '';
  totalTime: number = 0;
  projectCode: string = '';

  ngOnInit() {
    this.getProject();
  }

  ngAfterViewInit() {
    // Sử dụng setTimeout để đảm bảo container đã render xong (đặc biệt với modal và splitter)
    setTimeout(() => {
      if (this.tb_projectListWorkReportContainer) {
        this.drawTbProjectListWorkReport(this.tb_projectListWorkReportContainer.nativeElement);
        // Trigger load data sau khi khởi tạo bảng
        setTimeout(() => {
          if (this.tb_projectListWorkReport) {
            this.tb_projectListWorkReport.setPage(1);
          }
        }, 100);
      }
    }, 100);
  }

  drawTbProjectListWorkReport(container: HTMLElement) {
    if (!container) {
      console.error('Container element not found');
      return;
    }

    try {
      this.tb_projectListWorkReport = new Tabulator(container, {
        ...DEFAULT_TABLE_CONFIG,
        height: '100%',
        pagination: true,
        layout: 'fitDataStretch',
        locale: 'vi',
        index: 'ID',
        rowHeader: false,
        paginationMode: 'remote',
        paginationSize: 50,
        paginationSizeSelector: [10, 30, 50, 100, 300, 500],
        selectableRows: true,
        ajaxURL: 'get-project-list-work-report', // Placeholder URL - ajaxRequestFunc sẽ override
        ajaxConfig: 'GET',
        ajaxRequestFunc: (url, config, params) => {
          const request = {
            projectId: this.projectId || 0,
            keyword: this.keyword || '',
            page: params.page || 1,
            size: params.size || 50,
          };

          console.log('Loading project list work report data:', request);
          return this.projectService.getProjectListWorkReport(
            request.projectId,
            request.keyword,
            request.page,
            request.size
          ).toPromise().catch((error) => {
            console.error('Error loading project list work report data:', error);
            this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách báo cáo công việc!');
            throw error;
          });
        },
        ajaxResponse: (url, params, res) => {
          console.log('API Response:', res);
          // API trả về { status: 1, data: [...] } hoặc { status: 1, data: { dt: [...], totalpage: [...] } }
          if (res && res.status === 1 && res.data) {
            // Kiểm tra xem data có phải là array trực tiếp không
            const data = Array.isArray(res.data) ? res.data : (res.data.dt || []);
            
            // Tính tổng số giờ từ tất cả dữ liệu hiện tại (chỉ trang hiện tại)
            const ttime = data.reduce((sum: number, row: any) => {
              const hours = parseFloat(row.TotalHours) || 0;
              return sum + (isNaN(hours) ? 0 : hours);
            }, 0);
            this.totalTime = ttime / 8;

            // Xử lý totalpage - có thể là array hoặc number
            let totalPage = 1;
            if (res.data && res.data.totalpage) {
              if (Array.isArray(res.data.totalpage)) {
                // Nếu là array, lấy phần tử đầu tiên (có thể là object với property TotalPage hoặc là number)
                totalPage = res.data.totalpage[0]?.TotalPage || res.data.totalpage[0] || 1;
              } else if (typeof res.data.totalpage === 'number') {
                totalPage = res.data.totalpage;
              }
            } else {
              // Nếu API không trả về totalpage, tính dựa trên data length
              // Giả sử nếu data.length < size thì đây là trang cuối
              const pageSize = params.size || 50;
              totalPage = data.length < pageSize ? (params.page || 1) : (params.page || 1) + 1;
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
            title: 'Mã nhân viên',
            field: 'EmployeeCode',
            headerHozAlign: 'center',
            hozAlign: 'center',
            frozen: true,
          },
        {
          title: 'Họ tên',
          field: 'FullName',
          headerHozAlign: 'center',
          frozen: true,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          headerHozAlign: 'center',
          frozen: true,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Team',
          field: 'TeamName',
          headerHozAlign: 'center',
          frozen: true,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Ngày',
          field: 'DateReport',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            value = DateTime.fromISO(value).isValid
              ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
              : '';
            return value;
          },
          hozAlign: 'center',
          frozen: true,
        },
        {
          title: 'Nội dung',
          field: 'Content',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => {
            const count = cell.getValue();
            return count > 0 ? `Số báo cáo = ${count}` : '';
          },
        },
        {
          title: 'Số giờ',
          field: 'TimeReality',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          hozAlign: 'right',
          bottomCalc: 'sum',
        },
        {
          title: 'Hệ số',
          field: 'Ratio',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          hozAlign: 'right',
        
        },
        {
          title: 'Tổng số giờ',
          field: 'TotalHours',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          hozAlign: 'right',
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell: any) => {
            const value = cell.getValue();
            if (value !== null && value !== undefined) {
              return parseFloat(value).toFixed(2);
            }
            return '';
          },
        },
        {
          title: 'Kết quả',
          field: 'Results',
          headerHozAlign: 'center',
          width: 300,
          bottomCalc: (values: any[], data: any[]) => {
            // Tính tổng số giờ từ cột TotalHours
            const totalHours = data.reduce((sum: number, row: any) => {
              const hours = parseFloat(row.TotalHours) || 0;
              return sum + (isNaN(hours) ? 0 : hours);
            }, 0);
            // Tính tổng số ngày = tổng giờ / 8
            const totalDays = totalHours / 8.0;
            return totalDays;
          },
          bottomCalcFormatter: (cell: any) => {
            const totalDays = cell.getValue();
            if (totalDays && totalDays > 0) {
              return `Tổng số ngày = ${totalDays.toFixed(1)}`;
            }
            return '';
          },
          hozAlign: 'left',
        },
        {
          title: 'Vấn đề phát sinh',
          field: 'Problem',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Giải pháp',
          field: 'ProblemSolve',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Tồn đọng',
          field: 'Backlog',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
        {
          title: 'Ghi chú',
          field: 'Note',
          headerHozAlign: 'center',
          formatter: 'textarea'
        },
      ],
      });
    } catch (error) {
      console.error('Error initializing Tabulator:', error);
      this.notification.error('Lỗi', 'Không thể khởi tạo bảng dữ liệu!');
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.projectCode = '';
    this.refreshTable();
  }

  onProjectChange() {
    this.updateProjectCode();
    this.onSearch();
  }

  updateProjectCode() {
    if (this.projectId > 0) {
      const selectedProject = this.projects.find(p => p.ID === this.projectId);
      this.projectCode = selectedProject ? selectedProject.ProjectCode : '';
    } else {
      this.projectCode = '';
    }
  }
  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          this.projects = response.data;
          console.log('dataProject', this.dataProject);
          // Cập nhật projectCode nếu đã có projectId từ @Input
          if (this.projectId > 0) {
            this.updateProjectCode();
          }
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }
  
  getProjectListWorkReport() {
    this.refreshTable();
  }

  refreshTable() {
    if (this.tb_projectListWorkReport) {
      // Reload data từ trang đầu tiên
      this.tb_projectListWorkReport.setPage(1);
    }
  }
  exportExcel(){
    const table = this.tb_projectListWorkReport;
    if (!table) return;
    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }
    this.projectService.exportExcel(table, data, 'Tổng hợp nhân công', 'Tổng hợp nhân công');
  }
  onClose() {
    this.activeModal.close(true); // đóng modal và trả dữ liệu về
  }
  changeProject() {
    let selectedRows = this.tb_projectListWorkReport.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (this.projectId <= 0) {
      this.notification.error('', 'Vui lòng chọn dự án!');
      return;
    }

    if (selectedIDs.length <= 0) {
      this.notification.error('', 'Vui lòng chọn báo cáo cần chuyển dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectIdOld = this.projectId;
    modalRef.componentInstance.reportIds = selectedIDs;
    modalRef.componentInstance.disable = true;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getProjectListWorkReport();
      }
    });
  }
  onSearch() {
    this.getProjectListWorkReport();
  }
}
