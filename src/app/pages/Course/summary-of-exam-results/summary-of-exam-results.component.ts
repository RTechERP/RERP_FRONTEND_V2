import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SummaryOfExamResultsService } from './summary-of-exam-results-service/summary-of-exam-results.service';
import { ProjectService } from '../../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-summary-of-exam-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzLayoutModule,
    NzSplitterModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './summary-of-exam-results.component.html',
  styleUrl: './summary-of-exam-results.component.css'
})
export class SummaryOfExamResultsComponent implements OnInit, AfterViewInit {
  @ViewChild('EmployeeTable') employeeTableRef!: ElementRef;
  @ViewChild('ExamResultsTable') examResultsTableRef!: ElementRef;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  sizeSearch: string = '0';

  employeeTable: Tabulator | null = null;
  employeeData: any[] = [];
  selectedEmployeeID: number = 0;

  examResultsTable: Tabulator | null = null;
  examResultsData: any[] = [];

  departments: any[] = [];
  teams: any[] = [];
  employees: any[] = [];
  departmentId: any;
  teamId: any;
  employeeId: any;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private examResultsService: SummaryOfExamResultsService,
    private projectService: ProjectService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });
  }

  ngAfterViewInit(): void {
    this.draw_employeeTable();
    this.draw_examResultsTable();
    this.getDepartment();
    this.getEmployees();
    this.getEmployeeData();
    this.getExamResultsByEmployeeID(this.selectedEmployeeID);
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    // Redraw bảng sau khi thay đổi kích thước panel
    if (this.employeeTable) {
      setTimeout(() => {
        this.employeeTable?.redraw(true);
      }, 200);
    }
    if (this.examResultsTable) {
      setTimeout(() => {
        this.examResultsTable?.redraw(true);
      }, 200);
    }
  }

  getDepartment() {
    this.projectService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data || [];
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getUserTeam() {
    this.teams = [];
    if (this.departmentId > 0) {
      this.projectService.getUserTeam(this.departmentId).subscribe({
        next: (response: any) => {
          this.teams = response.data || [];
        },
        error: (error) => {
          console.error('Lỗi:', error);
        },
      });
    }
  }

  getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data || [],
          'DepartmentName'
        );
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  resetSearch() {
    this.departmentId = null;
    this.teamId = null;
    this.employeeId = null;
    this.teams = [];
    this.getEmployeeData();
  }

  getEmployeeData() {
    const departmentid = this.departmentId || null;
    const userTeamID = this.teamId || null;
    const employeeID = this.employeeId || null;

    this.examResultsService.getEmployees(userTeamID, departmentid, employeeID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.employeeData = response.data;
        } else {
          this.employeeData = [];
        }
        
        if (this.employeeTable) {
          this.employeeTable.replaceData(this.employeeData);
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
        this.employeeData = [];
        if (this.employeeTable) {
          this.employeeTable.replaceData(this.employeeData);
        }
      }
    });
  }

  getExamResultsByEmployeeID(employeeID: number) {
    // Cho phép gọi API với employeeID = 0 để lấy tất cả kết quả thi
    if (employeeID === null || employeeID === undefined || employeeID < 0) {
      this.examResultsData = [];
      if (this.examResultsTable) {
        this.examResultsTable.setData(this.examResultsData);
      }
      return;
    }

    const departmentid = this.departmentId || undefined;
    // Nếu employeeID = 0, truyền undefined để API lấy tất cả
    const employeeIDParam = employeeID > 0 ? employeeID : undefined;

    this.examResultsService.getCourseSummary(departmentid, employeeIDParam).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.examResultsData = response.data;
        } else {
          this.examResultsData = [];
        }
        
        if (this.examResultsTable) {
          this.examResultsTable.setData(this.examResultsData);
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi khi lấy kết quả thi:', error);
        this.examResultsData = [];
        if (this.examResultsTable) {
          this.examResultsTable.setData(this.examResultsData);
        }
      }
    });
  }

  draw_employeeTable(): void {
    if (this.employeeTable) {
      this.employeeTable.setData(this.employeeData);
    } else {
      this.employeeTable = new Tabulator(this.employeeTableRef.nativeElement, {
        data: this.employeeData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        selectableRows: 1,
        paginationMode: 'local',
        groupBy: 'DepartmentName',
        groupHeader: function (value, count, data, group) {
          return (
            `Phòng ban: ${value} (${count} thành viên)`
          );
        },
        columns: [
          {
            title: 'Mã NV',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'EmployeeCode',
            width: 120,
            formatter: (cell: any) => {
              const rowData = cell.getRow().getData();
              return rowData['EmployeeCode'] || rowData['Code'] || '';
            },
          },
          {
            title: 'Họ và tên',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });

      this.employeeTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedEmployeeID = rowData['UserID'] || rowData['ID'] || 0;
        this.getExamResultsByEmployeeID(this.selectedEmployeeID);
      });

      this.employeeTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.selectedEmployeeID = rowData['UserID'] || rowData['ID'] || 0;
        this.getExamResultsByEmployeeID(this.selectedEmployeeID);
      });

      this.employeeTable.on('rowDeselected', (row: RowComponent) => {
        this.selectedEmployeeID = 0;
        this.examResultsData = [];
        if (this.examResultsTable) {
          this.examResultsTable.setData(this.examResultsData);
        }
      });
    }
  }

  draw_examResultsTable(): void {
    if (this.examResultsTable) {
      this.examResultsTable.setData(this.examResultsData);
    } else {
      this.examResultsTable = new Tabulator(this.examResultsTableRef.nativeElement, {
        data: this.examResultsData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        selectableRows: false,
        paginationMode: 'local',
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            width: 80,
            formatter: 'rownum',
          },
          {
            title: 'Mã khóa học',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'Code',
            width: 150,
          },
          {
            title: 'Tên khóa học',
            field: 'NameCourse',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
          {
            title: 'Đánh giá',
            field: 'EvaluateText',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value != null && value !== '' ? value.toString() : '-';
            },
          },
          {
            title: 'Điểm trắc nghiệm',
            field: 'QuizPoints',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              const rowData = cell.getRow().getData();
              // Ưu tiên QuizPointsText nếu có, nếu không thì dùng QuizPoints
              if (rowData['QuizPointsText'] && rowData['QuizPointsText'] !== '-') {
                return rowData['QuizPointsText'];
              }
              return value != null && value !== 0 ? value.toString() : '-';
            },
          },
          {
            title: 'Điểm thực hành',
            field: 'PracticePoints',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              const rowData = cell.getRow().getData();
              // Ưu tiên PracticePointsText nếu có, nếu không thì dùng PracticePoints
              if (rowData['PracticePointsText'] && rowData['PracticePointsText'] !== '-') {
                return rowData['PracticePointsText'];
              }
              return value != null && value !== 0 ? value.toString() : '-';
            },
          },
          {
            title: 'Điểm bài tập',
            field: 'ExcercisePoints',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              const rowData = cell.getRow().getData();
              // Ưu tiên ExcercisePointsText nếu có, nếu không thì dùng ExcercisePoints
              if (rowData['ExcercisePointsText'] && rowData['ExcercisePointsText'] !== '-') {
                return rowData['ExcercisePointsText'];
              }
              return value != null && value !== 0 ? value.toString() : '-';
            },
          },
          {
            title: 'Thời gian học (ngày)',
            field: 'LeadTime',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 180,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value != null && value !== 0 ? `${value} ngày` : '-';
            },
          },
          {
            title: 'Thời gian học thực tế (Ngày)',
            field: 'TotalTimeLearned',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 220,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value != null && value !== 0 ? `${value} ngày` : '-';
            },
          },
        ],
      });
    }
  }

  async exportToExcel() {
    if (!this.examResultsTable) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!'
      );
      return;
    }

    const data = this.examResultsTable.getData();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kết quả thi');

    const columns = this.examResultsTable.getColumns();
    const headers = columns.map((col: any) => col.getDefinition().title);

    // Thêm dòng header
    const headerRow = worksheet.addRow(headers);

    // Gán style cho header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Thêm dữ liệu
    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        // Xử lý các trường đặc biệt
        if (field === 'LeadTime' || field === 'TotalTimeLearned') {
          return value != null && value !== 0 ? value : '';
        }
        
        // Xử lý các điểm số - ưu tiên Text field nếu có
        if (field === 'QuizPoints' && row['QuizPointsText'] && row['QuizPointsText'] !== '-') {
          return row['QuizPointsText'];
        }
        if (field === 'PracticePoints' && row['PracticePointsText'] && row['PracticePointsText'] !== '-') {
          return row['PracticePointsText'];
        }
        if (field === 'ExcercisePoints' && row['ExcercisePointsText'] && row['ExcercisePointsText'] !== '-') {
          return row['ExcercisePointsText'];
        }

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value != null ? value : '';
      });

      worksheet.addRow(rowData);
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    // Wrap text cho các ô
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle',
        };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `KetQuaThi_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
