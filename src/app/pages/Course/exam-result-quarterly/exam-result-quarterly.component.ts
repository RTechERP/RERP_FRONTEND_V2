import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ExamResultQuarterlyService } from './exam-result-quarterly-service/exam-result-quarterly.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import * as ExcelJS from 'exceljs';
import { ExamResultDetailModalComponent } from './exam-result-detail-modal/exam-result-detail-modal.component';

import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-exam-result-quarterly',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzLayoutModule,
    NzSplitterModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzInputNumberModule,
    NzDividerModule,
    NzModalModule,
    NzSpinModule,
  ],
  templateUrl: './exam-result-quarterly.component.html',
  styleUrl: './exam-result-quarterly.component.css',
})
export class ExamResultQuarterlyComponent implements OnInit, AfterViewInit {
  @ViewChild('CourseTable') courseTableRef!: ElementRef;
  @ViewChild('ExamResultTable') examResultTableRef!: ElementRef;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  isExamResultLoading: boolean = false;

  // Bộ lọc
  yearValue: number = new Date().getFullYear();
  quarter: number = Math.ceil((new Date().getMonth() + 1) / 3);

  // Bảng danh sách kỳ thi
  courseTable: Tabulator | null = null;
  courseData: any[] = [
    { ExamType: 1, Code: 'VS/HL', Name: 'Vision', NameDepartment: 'Kỹ thuật' },
    { ExamType: 2, Code: 'PLC', Name: 'Điện', NameDepartment: 'Kỹ thuật' },
    { ExamType: 3, Code: 'K1', Name: 'Phần mềm', NameDepartment: 'Kỹ thuật' },
    { ExamType: 4, Code: 'NQKT', Name: 'Nội quy', NameDepartment: 'Kỹ thuật' },
    { ExamType: 5, Code: 'AGV', Name: 'AGV', NameDepartment: 'AGV' },
    { ExamType: 6, Code: 'T', Name: 'Tester', NameDepartment: 'Kỹ thuật' },
    { ExamType: 7, Code: 'MB', Name: 'Mobile', NameDepartment: 'Kỹ thuật' },
    { ExamType: 8, Code: 'BA', Name: 'BA', NameDepartment: 'Kỹ thuật' },
  ];
  selectedExamType: number = 0;
  selectedExamName: string = '';

  // Bảng kết quả thi
  examResultTable: Tabulator | null = null;
  examResultData: any[] = [];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private examResultService: ExamResultQuarterlyService,
    private notification: NzNotificationService,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });
  }

  ngAfterViewInit(): void {
    this.draw_courseTable();
    this.draw_examResultTable();
  }

  // ─── Vẽ bảng danh sách kỳ thi (bên trái) ──────────────────────────────────
  draw_courseTable(): void {
    if (this.courseTable) {
      this.courseTable.setData(this.courseData);
    } else {
      this.courseTable = new Tabulator(this.courseTableRef.nativeElement, {
        data: this.courseData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '86vh',
        selectableRows: 1,
        pagination: false,
        rowHeader: false,
        groupBy: 'NameDepartment',
        groupHeader: (value: any, count: number) => {
          return `Tên phòng ban: ${value}`;
        },
        columns: [
          {
            title: 'Mã',
            field: 'Code',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 90,
          },
          {
            title: 'Tên',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'center',
          },
        ],
      });

      this.courseTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedExamType = rowData['ExamType'];
        this.selectedExamName = rowData['Name'];
        this.loadData();
      });

      this.courseTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.selectedExamType = rowData['ExamType'];
        this.selectedExamName = rowData['Name'];
        this.loadData();
      });
    }
  }

  // ─── Vẽ bảng kết quả thi (bên phải) ───────────────────────────────────────
  draw_examResultTable(): void {
    if (this.examResultTable) {
      this.examResultTable.setData(this.examResultData);
    } else {
      this.examResultTable = new Tabulator(
        this.examResultTableRef.nativeElement,
        {
          data: this.examResultData,
          ...DEFAULT_TABLE_CONFIG,
          layout: 'fitDataStretch',
          height: '86vh',
          selectableRows: true,
          pagination: false,
          rowHeader: {
            headerSort: false,
            resizable: false,
            frozen: true,
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            cellClick: (_e: UIEvent, cell: any) => {
              cell.getRow().toggleSelect();
            },
            width: 40,
          },
          rowContextMenu: [
            {
              label:
                '<span class="text-danger"><i class="fa fa-trash"></i> Xóa nhân viên đã chọn</span>',
              action: (e: UIEvent, row: RowComponent) => {
                // Nếu dòng chưa được chọn thì chọn nó và giữ nguyên các dòng đã chọn trước đó
                if (!row.isSelected()) {
                  row.select();
                }
                this.deleteSelected();
              },
            },
          ],
          columns: [
            {
              title: 'STT',
              field: 'STT',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 60,
            },
            {
              title: 'Tên thí sinh',
              field: 'FullName',
              hozAlign: 'left',
              headerHozAlign: 'center',
              minWidth: 180,
            },
            {
              title: 'Tổng số câu',
              field: 'TotalQuestion',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 110,
            },
            {
              title: 'Số câu làm',
              field: 'TotalChoosen',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 110,
            },
            {
              title: 'Số câu đúng',
              field: 'TotalCorrect',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 110,
            },
            {
              title: 'Số câu sai',
              field: 'TotalInCorrect',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 110,
            },
            {
              title: 'Điểm',
              field: 'FinalMark',
              hozAlign: 'center',
              headerHozAlign: 'center',
              width: 90,
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null ? parseFloat(value).toFixed(2) : '0.00';
              },
            },
          ],
        },
      );

      // Double click -> xem chi tiết
      this.examResultTable.on(
        'rowDblClick',
        (_e: UIEvent, row: RowComponent) => {
          const rowData = row.getData();
          this.openDetail(rowData);
        },
      );
    }
  }

  // ─── Load kết quả thi từ API ───────────────────────────────────────────────
  loadData(): void {
    if (!this.selectedExamType) return;

    this.isExamResultLoading = true;
    this.examResultService
      .getExamResult(this.yearValue, this.quarter, this.selectedExamType)
      .subscribe({
        next: (response: any) => {
          this.isExamResultLoading = false;
          if (response && response.status === 1 && response.data) {
            this.examResultData = response.data.map(
              (item: any, index: number) => ({
                ...item,
                STT: index + 1,
                FinalMark:
                  item.TotalQuestion > 0
                    ? Math.round(
                        (item.TotalCorrect / item.TotalQuestion) * 100,
                      ) / 100
                    : 0,
              }),
            );
          } else {
            this.examResultData = [];
          }
          if (this.examResultTable) {
            this.examResultTable.replaceData(this.examResultData);
          }
        },
        error: (error: any) => {
          this.isExamResultLoading = false;
          const msg =
            error?.error?.message || error?.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          this.examResultData = [];
          if (this.examResultTable) {
            this.examResultTable.replaceData([]);
          }
        },
      });
  }

  // ─── Mở modal chi tiết bài thi ───────────────────────────────────────────
  openDetail(rowData: any): void {
    const modal = this.modal.create({
      nzTitle: 'CHI TIẾT BÀI THI',
      nzContent: ExamResultDetailModalComponent,
      nzWidth: '100vw',
      nzFooter: null,
      nzClosable: true,
      nzMaskClosable: false,
      nzClassName: 'full-screen-modal',
      nzStyle: { top: '0px', padding: '0px', margin: '0px' },
      nzBodyStyle: {
        padding: '0px',
        height: 'calc(100vh - 55px)',
        overflow: 'hidden',
      },
      nzData: {
        employeeID: rowData['EmployeeID'] ?? rowData['ID'] ?? 0,
        employeeName: rowData['FullName'] ?? '',
        yearValue: this.yearValue,
        quarter: this.quarter,
        examType: this.selectedExamType,
      },
    });

    // Truyền @Input từ nzData vào component instance
    const instance =
      modal.getContentComponent() as ExamResultDetailModalComponent;
    instance.employeeID = rowData['EmployeeID'] ?? rowData['ID'] ?? 0;
    instance.employeeName = rowData['FullName'] ?? '';
    instance.yearValue = this.yearValue;
    instance.quarter = this.quarter;
    instance.examType = this.selectedExamType;
  }

  // ─── Xóa các dòng đã chọn ─────────────────────────────────────────────────
  deleteSelected(): void {
    if (!this.examResultTable) return;

    const selectedRows: RowComponent[] = this.examResultTable.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn nhân viên muốn xóa!',
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent:
        'Bạn có chắc muốn xóa kết quả thi của nhân viên đã chọn không?',
      nzOkText: 'Có',
      nzCancelText: 'Không',
      nzOnOk: () => {
        const ids = selectedRows
          .map((row) => row.getData()['ID'])
          .filter((id) => id)
          .join(',');

        if (!ids) return;

        this.examResultService.deleteExamResult(ids).subscribe({
          next: () => {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              'Xóa thành công!',
            );
            this.loadData();
          },
          error: (error: any) => {
            const msg =
              error?.error?.message || error?.message || 'Xóa thất bại';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
          },
        });
      },
    });
  }

  // ─── Xuất Excel ────────────────────────────────────────────────────────────
  async exportToExcel() {
    if (!this.examResultTable) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!',
      );
      return;
    }

    const data = this.examResultTable.getData();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất!',
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kết quả thi');

    // Tiêu đề
    const headers = [
      'STT',
      'Tên thí sinh',
      'Tổng số câu',
      'Số câu làm',
      'Số câu đúng',
      'Số câu sai',
      'Điểm',
    ];
    const fields = [
      'STT',
      'FullName',
      'TotalQuestion',
      'TotalChoosen',
      'TotalCorrect',
      'TotalInCorrect',
      'FinalMark',
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' },
      };
      cell.font = { bold: true };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    });

    data.forEach((row: any) => {
      const rowData = fields.map((f) => {
        const val = row[f];
        if (f === 'FinalMark')
          return val != null ? parseFloat(val).toFixed(2) : '0.00';
        return val != null ? val : '';
      });
      const excelRow = worksheet.addRow(rowData);
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    worksheet.columns.forEach((col: any) => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const v = cell.value ? cell.value.toString() : '';
        maxLen = Math.max(maxLen, v.length + 2);
      });
      col.width = maxLen;
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const examName = this.selectedExamName || 'KyThi';
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `KetQuaThi_${examName}_Q${this.quarter}_${this.yearValue}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
