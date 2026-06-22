import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { CourseDashboardService } from './course-dashboard-service/course-dashboard.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-course-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzLayoutModule,
    NzGridModule,
    NzIconModule,
    NzBadgeModule,
    NzButtonModule,
    NzSkeletonModule,
    NzSelectModule,
    NzToolTipModule
  ],
  templateUrl: './course-dashboard.component.html',
  styleUrl: './course-dashboard.component.css'
})
export class CourseDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('CourseTable') courseTableRef!: ElementRef;

  courseTable: Tabulator | null = null;
  coursesData: any[] = [];

  // Summary Metrics
  totalCourses: number = 0;
  totalEnrollments: number = 0;
  averageRating: number = 0;
  popularCourseName: string = '-';
  popularCourseCount: number = 0;

  // Top 5 Courses
  top5Courses: any[] = [];

  // Top 5 Rating Courses
  top5RatingCourses: any[] = [];

  // Phase 3 Data
  topParticipationCourses: any[] = [];
  topLikedCourses: any[] = [];
  topCommentCourses: any[] = [];
  timeRangeFilter = 'MONTH';

  isParticipationLoading = true;
  isCommentLoading = true;

  constructor(
    private courseDashboardService: CourseDashboardService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.loadCourseSummary();
    this.loadTopParticipation();
    this.loadCourseCommentSummary();
  }

  loadCourseSummary() {
    this.courseDashboardService.getCourseSummary().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.coursesData = response.data;
          this.calculateMetrics();
          this.draw_courseTable();
        } else {
          this.coursesData = [];
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi khi lấy dữ liệu tổng hợp:', error);
      }
    });
  }

  loadTopParticipation() {
    this.isParticipationLoading = true;
    this.courseDashboardService.getTopCourseParticipation(this.timeRangeFilter, 100).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.topParticipationCourses = res.data;
        } else {
          this.topParticipationCourses = [];
        }
        this.isParticipationLoading = false;
      },
      error: () => this.isParticipationLoading = false
    });
  }

  onTimeRangeChange() {
    this.loadTopParticipation();
  }

  loadCourseCommentSummary() {
    this.isCommentLoading = true;
    this.courseDashboardService.getCourseCommentSummary(5).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.topCommentCourses = res.data;
        }
        this.isCommentLoading = false;
      },
      error: () => this.isCommentLoading = false
    });
  }

  calculateMetrics() {
    if (!this.coursesData || this.coursesData.length === 0) return;

    // Total courses
    this.totalCourses = this.coursesData.length;

    // Total enrollments
    this.totalEnrollments = this.coursesData.reduce((sum, course) => sum + (course.TotalParticipants || 0), 0);

    // Average rating
    const totalAvgRating = this.coursesData.reduce((sum, course) => sum + (course.AverageRating || 0), 0);
    this.averageRating = this.coursesData.length > 0 ? (totalAvgRating / this.coursesData.length) : 0;

    // Top Khóa nhiều học viên
    this.top5Courses = [...this.coursesData]
      .sort((a, b) => (b.TotalParticipants || 0) - (a.TotalParticipants || 0))
      .slice(0, 100);

    // Most popular course (Lấy khóa Top 1)
    if (this.top5Courses.length > 0) {
      const mostPopular = this.top5Courses[0];
      this.popularCourseName = mostPopular.NameCourse || '-';
      this.popularCourseCount = mostPopular.TotalParticipants || 0;
    } else {
      this.popularCourseName = '-';
      this.popularCourseCount = 0;
    }

    // Top 5 Courses by Rating
    this.top5RatingCourses = [...this.coursesData]
      .sort((a, b) => {
        const ratingDiff = (b.AverageRating || 0) - (a.AverageRating || 0);
        if (ratingDiff === 0) {
          return (b.TotalRatings || 0) - (a.TotalRatings || 0);
        }
        return ratingDiff;
      })
      .slice(0, 100);

    // Top 5 Liked Courses
    this.topLikedCourses = [...this.coursesData]
      .sort((a, b) => (b.TotalLikes || 0) - (a.TotalLikes || 0))
      .slice(0, 100);
  }

  getBarWidth(value: number): string {
    const max = this.top5Courses[0]?.TotalParticipants || 1;
    return `${(value / max) * 100}%`;
  }

  draw_courseTable(): void {
    if (this.courseTable) {
      this.courseTable.setData(this.coursesData);
    } else {
      this.courseTable = new Tabulator(this.courseTableRef.nativeElement, {
        data: this.coursesData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataTable',
        height: '83vh',
        selectableRows: false,
        pagination: false,
        columnCalcs: 'table',
        groupBy: 'NameCourseCatalog',
        rowHeader: false,
        groupHeader: function (value, count, data, group) {
          return `Danh mục: ${value} (${count} khóa học)`;
        },
        columns: [
          {
            title: 'Tên khóa học',
            field: 'NameCourse',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 400,
            bottomCalc: 'count',
            bottomCalcFormatter: (cell: any) => {
              return `Tổng cộng: ${cell.getValue()}`;
            }
          },
          {
            title: 'Người phụ trách',
            field: 'Instructor',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 250,
          },
          {
            title: 'Số bài học',
            field: 'NumberLesson',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
          },
          {
            title: 'Lượt tham gia',
            field: 'TotalParticipants',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            bottomCalc: 'sum',
            formatter: (cell: any) => {
              const rowData = cell.getRow().getData();
              return rowData.TotalParticipantsText || cell.getValue();
            }
          },
          {
            title: 'Lượt thích',
            field: 'TotalLikes',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            bottomCalc: 'sum',
            formatter: (cell: any) => {
              const rowData = cell.getRow().getData();
              return `❤️ ${rowData.TotalLikesText || cell.getValue()}`;
            }
          },
          {
            title: 'Đánh giá TB',
            field: 'AverageRating',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            bottomCalc: 'avg',
            bottomCalcFormatter: (cell: any) => {
              const val = cell.getValue();
              return val ? parseFloat(val).toFixed(1) : '-';
            },
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? `⭐ ${parseFloat(value).toFixed(1)}` : '-';
            }
          },
          {
            title: 'Số đánh giá',
            field: 'TotalRatings',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 200,
            bottomCalc: 'sum',
            formatter: (cell: any) => {
              const rowData = cell.getRow().getData();
              return rowData.TotalRatingsText || cell.getValue();
            }
          }

        ]
      });
    }
  }

  async exportToExcel() {
    if (!this.courseTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const data = this.courseTable.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TongHopKhoaHoc');

    const columns = this.courseTable.getColumns();
    const headers = columns.filter((col: any) => col.getField() !== 'ThumbnailUrl').map((col: any) => col.getDefinition().title);

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    data.forEach((row: any) => {
      const rowData = columns.filter((col: any) => col.getField() !== 'ThumbnailUrl').map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (field === 'DeleteFlag') {
          return row['DeleteFlagText'];
        }
        return value != null ? value : '';
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formattedDate = new Date().toISOString().slice(2, 10).split('-').reverse().join('');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `TongHopKhoaHoc_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
