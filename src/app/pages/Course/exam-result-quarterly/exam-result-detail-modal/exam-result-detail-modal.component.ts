import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Inject,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ExamResultQuarterlyService } from '../exam-result-quarterly-service/exam-result-quarterly.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import * as ExcelJS from 'exceljs';

export const EXAM_TYPE_MAP: Record<number, string> = {
  1: 'Vision',
  2: 'PLC',
  3: 'Phần mềm',
  4: 'Nội quy',
  5: 'AGV',
};

@Component({
  selector: 'app-exam-result-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    NzFormModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTagModule,
    NzSpinModule,
  ],
  templateUrl: './exam-result-detail-modal.component.html',
  styleUrl: './exam-result-detail-modal.component.css',
})
export class ExamResultDetailModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('DetailTable') detailTableRef!: ElementRef;
  @ViewChild('SummaryTable') summaryTableRef!: ElementRef;

  // Values received from NZ_MODAL_DATA
  employeeID: number;
  employeeName: string;
  yearValue: number;
  quarter: number;
  examType: number;

  // Danh sách loại đề thi
  examTypeOptions = [
    { value: 1, label: 'Vision' },
    { value: 2, label: 'PLC' },
    { value: 3, label: 'Phần mềm' },
    { value: 4, label: 'Nội quy' },
    { value: 5, label: 'AGV' },
  ];

  // Bảng chi tiết câu hỏi
  detailTable: Tabulator | null = null;
  detailData: any[] = [];

  // Bảng tổng kết
  summaryTable: Tabulator | null = null;
  summaryData: any[] = [];
  viewReady = false;

  // Thống kê đúng / sai
  correctCount = 0;
  incorrectCount = 0;
  isLoading = false; // Added isLoading property

  get examTypeName(): string {
    return EXAM_TYPE_MAP[this.examType] ?? '';
  }

  constructor(
    private examResultService: ExamResultQuarterlyService, // Renamed 'service' to 'examResultService'
    private notification: NzNotificationService,
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
  ) {
    // Receive data injected by NzModalService
    this.employeeID = modalData?.employeeID ?? 0;
    this.employeeName = modalData?.employeeName ?? '';
    this.yearValue = modalData?.yearValue ?? new Date().getFullYear();
    this.quarter = modalData?.quarter ?? 1;
    this.examType = modalData?.examType ?? 1;
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    if (this.viewReady) return;
    this.viewReady = true;

    // Chờ 1 chút để DOM .ant-modal-body hoàn toàn mở ra dãn full width mới init bảng
    setTimeout(() => {
      this.drawDetailTable();
      this.drawSummaryTable();
      this.loadData();
    }, 150);
  }

  ngOnDestroy(): void {
    this.detailTable?.destroy();
    this.summaryTable?.destroy();
  }

  // ─── Vẽ bảng chi tiết câu hỏi ────────────────────────────────────────────
  drawDetailTable(): void {
    this.detailTable = new Tabulator(this.detailTableRef.nativeElement, {
      data: this.detailData,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      pagination: false,
      groupBy: 'TypeName',
      groupHeader: (value: any, count: number) => {
        const groupName = value && value !== 'undefined' ? value : 'Chưa phân nhóm';
        return `Nhóm: <strong>${groupName}</strong> (${count} câu)`;
      },
      columnCalcs: 'table',
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 55,
          frozen: true,
        },
        {
          title: 'Nội dung câu hỏi',
          field: 'Content',
          hozAlign: 'left',
          headerHozAlign: 'center',
          minWidth: 300,
          widthGrow: 5,
          formatter: 'textarea',
        },
        {
          title: 'Đáp án đúng',
          field: 'CorrectAnswers',
          hozAlign: 'center',
          headerHozAlign: 'center',
          minWidth: 100,
          widthGrow: 1,
          formatter: 'textarea',
          bottomCalc: (values: any[], data: any[]) => {
            let correct = 0;
            data.forEach((row: any) => {
              if (row.AnswerStatus === true) correct++;
            });
            return correct;
          },
          bottomCalcFormatter: (cell: any) => {
            const count = cell.getValue() || 0;
            cell.getElement().style.backgroundColor = '#f0f0f0';
            return `<div style="line-height:1.5; font-weight:bold; color:green;">${count} Đúng</div>`;
          },
        },
        {
          title: 'Đáp án đã chọn',
          field: 'PickedAnswers',
          hozAlign: 'center',
          headerHozAlign: 'center',
          minWidth: 100,
          widthGrow: 1,
          formatter: 'textarea',
          bottomCalc: (values: any[], data: any[]) => {
            let incorrect = 0;
            data.forEach((row: any) => {
              if (row.AnswerStatus === false) incorrect++;
            });
            return incorrect;
          },
          bottomCalcFormatter: (cell: any) => {
            const count = cell.getValue() || 0;
            cell.getElement().style.backgroundColor = '#f0f0f0';
            return `<div style="line-height:1.5; font-weight:bold; color:red;">${count} Sai</div>`;
          },
        },
        {
          title: 'Kết quả',
          field: 'AnswerStatus',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 90,
          formatter: (cell: any) => {
            const val = cell.getValue();
            const el = cell.getElement();
            if (val === true) {
              el.style.backgroundColor = 'rgb(144, 238, 144)'; // green
            } else {
              el.style.backgroundColor = 'rgb(255, 160, 160)'; // red
            }
            return val === true ? 'Đúng' : 'Sai';
          },
        },
      ],
    });
  }

  // ─── Vẽ bảng tổng kết theo nhóm ──────────────────────────────────────────
  drawSummaryTable(): void {
    this.summaryTable = new Tabulator(this.summaryTableRef.nativeElement, {
      data: this.summaryData,
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitColumns',
      height: '100%',
      pagination: false,
      columns: [
        {
          title: 'Tên khóa học',
          field: 'NameExam',
          hozAlign: 'left',
          headerHozAlign: 'center',
          minWidth: 150,
          widthGrow: 1,
          formatter: 'textarea',
          bottomCalc: 'count',
        },
        {
          title: 'Tổng số câu',
          field: 'TotalQuestions',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          bottomCalc: 'sum',
        },
        {
          title: 'Số câu đúng',
          field: 'TotalCorrect',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          bottomCalc: 'sum',
        },
        {
          title: 'Số câu sai',
          field: 'TotalIncorrect',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          bottomCalc: 'sum',
        },
      ],
    });
  }

  // ─── Tải dữ liệu từ API ───────────────────────────────────────────────────
  loadData(): void {
    this.isLoading = true;
    this.examResultService // Changed 'service' to 'examResultService'
      .getExamResultDetail(this.yearValue, this.quarter, this.examType, this.employeeID)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response && response.status === 1 && response.data) {
            this.detailData = response.data.detail || []; // Removed .map for STT
            this.summaryData = response.data.summary || [];
          } else {
            this.detailData = [];
            this.summaryData = [];
          }

          if (this.detailTable) {
            this.detailTable.setData(this.detailData); // Changed replaceData to setData
          }
          if (this.summaryTable) {
            this.summaryTable.setData(this.summaryData); // Changed replaceData to setData
          }
          this.calcAnswerSummary();

          // Force redraw after data is loaded to ensure layout is correct
          setTimeout(() => {
            this.detailTable?.redraw(true);
            this.summaryTable?.redraw(true);
          }, 200);
        },
        error: (error: any) => { // Changed 'err' to 'error'
          this.isLoading = false;
          const msg = error?.error?.message || error?.message || 'Lỗi không xác định'; // Changed 'err' to 'error'
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          this.detailData = [];
          this.summaryData = [];
          if (this.detailTable) this.detailTable.setData([]);
          if (this.summaryTable) this.summaryTable.setData([]);
        },
      });
  }

  // ─── Tính số câu đúng / sai ───────────────────────────────────────────────
  private calcAnswerSummary(): void {
    let correct = 0;
    let incorrect = 0;
    for (const item of this.detailData) {
      if (
        item['CorrectAnswers'] != null &&
        item['PickedAnswers'] != null &&
        String(item['CorrectAnswers']).trim() === String(item['PickedAnswers']).trim()
      ) {
        correct++;
      } else {
        incorrect++;
      }
    }
    this.correctCount = correct;
    this.incorrectCount = incorrect;
  }

  // ─── Xuất Excel ───────────────────────────────────────────────────────────
  async exportToExcel(): Promise<void> {
    if (!this.detailData || this.detailData.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Chi tiết bài thi');

    // Thông tin header
    const infoRows = [
      ['NĂM:', this.yearValue],
      ['QUÝ:', this.quarter],
      ['LOẠI ĐỀ:', this.examTypeName],
      ['NGƯỜI THAM GIA:', this.employeeName],
    ];
    infoRows.forEach(([label, val]) => {
      const r = ws.addRow([label, val]);
      r.getCell(1).font = { bold: true };
    });
    ws.addRow([]);

    // Header bảng
    const headers = ['STT', 'Nội dung câu hỏi', 'Đáp án đúng', 'Đáp án đã chọn', 'Kết quả'];
    const fields = ['STT', 'Content', 'CorrectAnswers', 'PickedAnswers', 'AnswerStatus'];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    // Dữ liệu
    this.detailData.forEach((row: any) => {
      const rowData = fields.map(f => {
        if (f === 'AnswerStatus') return row[f] === true ? 'Đúng' : 'Sai';
        return row[f] ?? '';
      });
      const excelRow = ws.addRow(rowData);
      excelRow.eachCell(cell => {
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    ws.columns.forEach((col: any) => {
      let maxLen = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const v = cell.value ? cell.value.toString() : '';
        maxLen = Math.max(maxLen, v.length + 2);
      });
      col.width = Math.min(maxLen, 60);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `ChiTietBaiThi_${this.examTypeName}_Q${this.quarter}_${this.yearValue}_${this.employeeName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
