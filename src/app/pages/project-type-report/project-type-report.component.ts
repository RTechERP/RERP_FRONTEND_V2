import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { Chart, ChartConfiguration } from 'chart.js/auto';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
// import { ProjectService } from '../project-service/project.service';

// Import thư viện NG-ZORRO
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { en_US, NzI18nService, NZ_DATE_LOCALE, NZ_I18N } from 'ng-zorro-antd/i18n';
import { NzInputModule } from 'ng-zorro-antd/input';

// Import CSS Tabulator
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

interface ProjectType {
  ID: number;
  ProjectTypeName: string;
  Value: number;
}

interface Project {
  ID: number;
  ProjectCode: string;
  ProjectName: string;
  CreatedDate: string;
  StatusName?: string;
}

@Component({
  selector: 'app-project-type-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NzDatePickerModule,
    NzButtonModule,
    NzCardModule,
    NzGridModule,
    NzAlertModule,
    NzSpinModule,
    NzIconModule,
    NzStatisticModule,
    NzSplitterModule,
    NzInputModule
  ],
  templateUrl: './project-type-report.component.html',
  styleUrls: ['./project-type-report.component.css'],
  providers: [
    DatePipe,
    { provide: NZ_I18N, useValue: en_US },
    { provide: NZ_DATE_LOCALE, useValue: en_US }
  ]
})
export class ProjectTypeReportComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  @ViewChild('dataTable') dataTable!: ElementRef;

  dateRange: Date[] = [];
  projectTypeData: ProjectType[] = [];
  projectTypeDataNoPO: ProjectType[] = [];
  projectsByType: Project[] = [];
  selectedProjectTypeId: number = 0;
  selectedProjectTypeName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  chart: any;
  tb_projectReport: Tabulator | null = null;
  isTableVisible: boolean = false;
  tableTitle: string = '';
  chartSize = 70;
  tableSize = 30;
  startDateObj: Date = new Date();
  endDateObj: Date = new Date();
  searchTerm: string = '';

  // Inject services
  private http = inject(HttpClient);
  private datePipe = inject(DatePipe);
  // private projectService = inject(ProjectService);
  private i18n = inject(NzI18nService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Thiết lập ngôn ngữ cho date picker
    this.i18n.setLocale(en_US);

    // Set default date range (last 6 months to today)
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    this.startDateObj = sixMonthsAgo;
    this.endDateObj = today;
  }

  ngOnInit(): void {
    // this.loadProjectTypeReport();
  }

  loadProjectTypeReport(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // TODO: Wire up to ProjectService when ready
    setTimeout(() => {
      this.isLoading = false;
      this.projectTypeData = [];
      this.projectTypeDataNoPO = [];
      this.projectsByType = [];
      this.errorMessage = '';
    }, 0);
  }

  get startDate(): string {
    return this.datePipe.transform(this.startDateObj, 'yyyy-MM-dd') || '';
  }

  get endDate(): string {
    return this.datePipe.transform(this.endDateObj, 'yyyy-MM-dd') || '';
  }

  // createBarChart(): void {
  //   if (!this.chartCanvas?.nativeElement) return;
  //   const ctx = (this.chartCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
  //   if (!ctx) return;

  //   if (this.chart) this.chart.destroy();

  //   const labels = this.projectTypeData.map(i => i.ProjectTypeName);
  //   const dataPO = this.projectTypeData.map(i => i.Value);
  //   const dataNoPO = this.projectTypeDataNoPO.map(i => i.Value);

  //   const colorsPO = 'rgba(111, 192, 233, 0.7)';
  //   const colorsNoPO = 'rgba(255, 99, 132, 0.7)';

  //   // const config: ChartConfiguration = {
  //   //   type: 'bar',
  //   //   data: {
  //   //     labels,
  //   //     datasets: [
  //   //       {
  //   //         label: 'Đã PO',
  //   //         data: dataPO,
  //   //         backgroundColor: colorsPO,
  //   //         borderColor: colorsPO.replace('0.7', '1'),
  //   //         borderWidth: 2
  //   //       },
  //   //       {
  //   //         label: 'Chưa PO',
  //   //         data: dataNoPO,
  //   //         backgroundColor: colorsNoPO,
  //   //         borderColor: colorsNoPO.replace('0.7', '1'),
  //   //         borderWidth: 2
  //   //       }
  //   //     ]
  //   //   },
  //   //   options: {
  //   //     responsive: true,
  //   //     maintainAspectRatio: false,
  //   //     onClick: (_evt, elements) => {
  //   //       if (elements.length > 0) {
  //   //         const index = elements[0].index;
  //   //         const datasetIndex = elements[0].datasetIndex;

  //   //         let projectTypeId = 0;
  //   //         let status = 0;
  //   //         if (datasetIndex === 0) {
  //   //           projectTypeId = this.projectTypeData[index].ID;
  //   //           this.selectedProjectTypeName = this.projectTypeData[index].ProjectTypeName;
  //   //           status = 0; // Đã PO
  //   //         } else {
  //   //           projectTypeId = this.projectTypeDataNoPO[index].ID;
  //   //           this.selectedProjectTypeName = this.projectTypeDataNoPO[index].ProjectTypeName;
  //   //           status = 1; // Chưa PO
  //   //         }

  //   //         this.selectedProjectTypeId = projectTypeId;
  //   //         this.loadProjectsByTypeWithStatus(status);
  //   //       }
  //   //     },
  //       scales: {
  //         y: {
  //           beginAtZero: true,
  //           stacked: true,
  //           title: { display: true, text: 'Giá trị', font: { weight: 'bold' } },
  //           grid: { color: 'rgba(0, 0, 0, 0.1)' }
  //         },
  //         x: {
  //           stacked: true,
  //           title: { display: true, text: 'Kiểu dự án', font: { weight: 'bold' } },
  //           grid: { color: 'rgba(0, 0, 0, 0.1)' }
  //         }
  //       },
  //       plugins: {
  //         legend: { labels: { font: { size: 14, weight: 'bold' } } },
  //         tooltip: {
  //           backgroundColor: 'rgba(0, 0, 0, 0.7)',
  //           titleFont: { size: 14, weight: 'bold' },
  //           bodyFont: { size: 13 },
  //           callbacks: {
  //             label: (ctx) =>
  //               `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('vi-VN')} VND`
  //           }
  //         }
  //       }
  //     }
  //   };

  //   this.chart = new Chart(ctx, config);
  // }

  // showProjectsByType(projectTypeId: number, status: number): void {
  //   let projectType;

  //   if (status === 0) {
  //     projectType = this.projectTypeData.find(item => item.ID === projectTypeId);
  //   } else {
  //     projectType = this.projectTypeDataNoPO.find(item => item.ID === projectTypeId);
  //   }

  //   if (projectType) {
  //     this.selectedProjectTypeId = projectTypeId;
  //     this.selectedProjectTypeName = projectType.ProjectTypeName;
  //     this.loadProjectsByTypeWithStatus(status);
  //   }
  // }

  loadProjectsByTypeWithStatus(status: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    // this.projectService.getProjectByType({
    //   projectTypeId: this.selectedProjectTypeId,
    //   dateStart: this.startDate,
    //   dateEnd: this.endDate,
    //   status: status
    // }).subscribe({
    //   next: (response:any) => {
    //     this.isLoading = false;
    //     if (response.status === 1) {
    //       this.projectsByType = response.data;
    //       this.isTableVisible = true;
    //       this.tableTitle = `Dự án ${status === 0 ? 'Đã PO' : 'Chưa PO'}: ${this.selectedProjectTypeName}`;
    //       this.cdr.detectChanges();
    //       setTimeout(() => {
    //         this.drawTbProjectReport();
    //       }, 0);
    //     } else {
    //       this.errorMessage = 'Không thể tải danh sách dự án';
    //     }
    //   },
    //   error: (err:any) => {
    //     this.isLoading = false;
    //     this.errorMessage = 'Lỗi kết nối đến server';
    //     console.error(err);
    //   }
    // });
  }

  drawTbProjectReport(): void {
    if (!this.dataTable || !this.dataTable.nativeElement) {
      console.error('Data table element not found');
      return;
    }

    if (this.tb_projectReport) {
      this.tb_projectReport.destroy();
    }

    try {
      this.tb_projectReport = new Tabulator(this.dataTable.nativeElement, {
        data: this.projectsByType,
        height: '59vh',
        layout: 'fitDataFill',
        locale: 'vi',
        selectableRows: true,
        selectableRowsPersistence: false,
        placeholder: 'Không có dữ liệu',
        groupBy: (data: any) => {
          return data.StatusName || 'Không xác định';
        },
        groupHeader: (value: any, count: number) => {
          return `${value} <span style="color: gray;">(${count} dự án)</span>`;
        },
        initialSort: [{ column: 'ID', dir: 'desc' }],
        columns: [
          {
            title: 'Mã dự án',
            field: 'ProjectCode',
            headerHozAlign: 'center',
            headerSort: false,
            widthGrow: 1,
            cssClass: 'text-bold',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return `<div class="text-truncate" title="${value}">${value}</div>`;
            },

          },
          {
            title: 'Tên dự án',
            field: 'ProjectName',
            headerHozAlign: 'center',
            headerSort: false,
            widthGrow: 2,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return `<div class="text-truncate" title="${value}">${value}</div>`;
            },

          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            headerHozAlign: 'center',
            headerSort: false,
            width: 120,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (!value) return '';

              // Chuyển đổi định dạng ngày từ yyyy-MM-ddTHH:mm:ss sang dd/MM/yyyy
              const dateObj = new Date(value);
              if (isNaN(dateObj.getTime())) return value;

              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear();

              return `${day}/${month}/${year}`;
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error initializing Tabulator:', error);
    }
  }

  calculatePercentage(value: number): number {
    const total = this.getTotalValue();
    return total > 0 ? (value / total) * 100 : 0;
  }

  getTotalValue(): number {
    return this.projectTypeData.reduce((sum, item) => sum + item.Value, 0);
  }

  backToReport(): void {
    this.selectedProjectTypeId = 0;
    this.projectsByType = [];
    this.isTableVisible = false;
    if (this.tb_projectReport) {
      this.tb_projectReport.destroy();
      this.tb_projectReport = null;
    }
  }

  onSearchChange(): void {
    if (this.tb_projectReport) {
      if (!this.searchTerm.trim()) {
        this.tb_projectReport.clearFilter(false);
      } else {
        this.tb_projectReport.setFilter([
          [
            { field: "ProjectCode", type: "like", value: this.searchTerm },
            { field: "ProjectName", type: "like", value: this.searchTerm }
          ]
        ]);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.tb_projectReport) {
      this.tb_projectReport.destroy();
    }
  }
}
