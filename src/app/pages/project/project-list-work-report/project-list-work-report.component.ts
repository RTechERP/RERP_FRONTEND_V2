import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
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
  sizeSearch: string = '22%';

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
  dataProjectListWorkReport: any[] = [];
  dataProject: any[] = [];
  projects: any[] = [];
  keyword: string = '';
  totalTime: number = 0;
  totalDate: number = 0;

  ngOnInit() {
    this.getProject();
  }

  ngAfterViewInit() {
    // Đợi một chút để đảm bảo modal đã render xong và ViewChild đã sẵn sàng
    // Sử dụng setTimeout với thời gian ngắn hơn hoặc dùng requestAnimationFrame
    if (this.tb_projectListWorkReportContainer?.nativeElement) {
      // Đợi một frame để đảm bảo DOM đã được render
      requestAnimationFrame(() => {
        this.drawTbProjectListWorkReport(this.tb_projectListWorkReportContainer.nativeElement);
      });
    } else {
      // Nếu ViewChild chưa sẵn sàng, thử lại sau một chút
      setTimeout(() => {
        if (this.tb_projectListWorkReportContainer?.nativeElement) {
          this.drawTbProjectListWorkReport(this.tb_projectListWorkReportContainer.nativeElement);
        } else {
          console.error('Container element not found for table');
        }
      }, 300);
    }
  }

  drawTbProjectListWorkReport(container: HTMLElement) {
    if (!container) {
      console.error('Container element not found');
      return;
    }

    // Đảm bảo container có kích thước
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('Container has no dimensions, retrying...');
      setTimeout(() => {
        this.drawTbProjectListWorkReport(container);
      }, 100);
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
        paginationMode: 'local',
        selectableRows: true,
        columns: [
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
          field: 'TotalHours',
          headerHozAlign: 'center',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          hozAlign: 'right',
          bottomCalc: 'sum',
        },
        {
          title: 'Kết quả',
          field: 'Results',
          headerHozAlign: 'center',
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
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
        },
      ],
      });
      this.tb_projectListWorkReport.on('renderComplete', () => {
        console.log('Table rendered successfully');
      });
    } catch (error) {
      console.error('Error initializing Tabulator:', error);
      this.notification.error('Lỗi', 'Không thể khởi tạo bảng dữ liệu!');
    }
  }

  setTotalDay() {
    // Method để tính tổng số ngày nếu cần
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectId = 0;
    this.keyword = '';
    this.getProjectListWorkReport();
  }
  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          this.projects = response.data;
          console.log('dataProject', this.dataProject);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }
  
  getProjectListWorkReport() {
    if (!this.tb_projectListWorkReport) {
      console.warn('Bảng chưa được khởi tạo');
      return;
    }

    this.projectService.getProjectListWorkReport(this.projectId, this.keyword, 1, 10000).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log("giá trị dự án:", response.data);
          this.dataProjectListWorkReport = response.data || [];
          
          // Tính tổng số ngày
          const ttime = this.dataProjectListWorkReport.reduce((sum: number, row: any) => {
            const hours = parseFloat(row.TotalHours) || 0;
            return sum + (isNaN(hours) ? 0 : hours);
          }, 0);
          this.totalTime = ttime / 8;

          // Cập nhật dữ liệu vào bảng
          this.tb_projectListWorkReport.setData(this.dataProjectListWorkReport);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách báo cáo công việc!');
        console.error('Error:', error);
      },
    });
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
