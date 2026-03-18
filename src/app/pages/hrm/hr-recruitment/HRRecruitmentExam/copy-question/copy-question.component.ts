import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HRRecruitmentExamService } from '../hr-recruitment-exam-service/hrrecruitment-exam.service';

@Component({
  selector: 'app-copy-question',
  templateUrl: './copy-question.component.html',
  styleUrl: './copy-question.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzTagModule,
    NzModalModule,
    TableModule,
    CheckboxModule,
    TooltipModule,
  ],
})
export class CopyQuestionComponent implements OnInit, AfterViewInit {

  //#region Input từ form cha
  /** ID đề thi đích (đến) – nhận từ form cha */
  @Input() toExamID: number = 0;
  /** Tên đề thi đích */
  @Input() toExamName: string = '';
  /** Mã đề thi đích */
  @Input() toExamCode: string = '';
  /** Loại đề thi đích (1=Trắc nghiệm, 2=Tự luận...) */
  @Input() toExamType: number = 1;
  /** Phòng ban đích (nhận từ form cha) */
  @Input() toDepartmentID: number = 0;
  /** Phòng ban đích tên */
  @Input() toDepartmentName: string = '';
  /** Đợt tuyển dụng đích (từ form cha) */
  @Input() toRecruitmentBatchId: number = 0;
  //#endregion

  //#region Bộ lọc tìm đích (Dòng 2 - Đến)
  toDepartmentId: number = 0;
  toRecruitmentBatches: any[] = [];
  toExams: any[] = [];
  //#endregion

  //#region Bộ lọc tìm nguồn (Dòng 1 - Từ)
  fromDepartmentId: number = 0;
  fromRecruitmentBatchId: number = 0;
  fromExamId: number = 0;
  fromExamType: number = 0;
  filterText: string = '';
  //#endregion

  //#region Dữ liệu combobox
  departments: any[] = [];

  /** Đợt tuyển dụng nguồn (load theo phòng ban nguồn) */
  fromRecruitmentBatches: any[] = [];

  /** Đề thi nguồn (load theo đợt tuyển dụng nguồn) */
  fromExams: any[] = [];

  examTypes = [
    { value: 0, label: 'Tất cả' },
    { value: 1, label: 'Trắc nghiệm' },
    { value: 2, label: 'Tự luận' },
    { value: 3, label: 'Trắc nghiệm & Tự luận' },
  ];
  //#endregion

  //#region Grid câu hỏi nguồn (PrimeNG)
  @ViewChild('dtQuestion') dtQuestion: any;
  datasetQuestion: any[] = [];
  selectedQuestions: any[] = [];
  dynamicCols: any[] = [];
  //#endregion

  //#region Trạng thái
  isSaving: boolean = false;
  isLoadingQuestion: boolean = false;

  get toExamTypeLabel(): string {
    return this.examTypes.find(t => t.value === this.toExamType)?.label || '';
  }
  //#endregion

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private examService: HRRecruitmentExamService,
    private cdr: ChangeDetectorRef,
  ) { }

  //#region Lifecycle

  ngOnInit(): void {
    // Khởi tạo giá trị mặc định cho form Đích từ Input của form cha
    if (this.toDepartmentID > 0) {
      this.toDepartmentId = this.toDepartmentID;
    }
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadFromRecruitmentBatches();
      // Load dữ liệu cho các combobox Đích nếu có DepartmentID đích
      if (this.toDepartmentId > 0) {
        this.loadToRecruitmentBatches(true);
      }
    }, 100);
  }

  //#endregion

  //#region Khởi tạo grid câu hỏi nguồn (Đã chuyển sang PrimeNG trong HTML)
  //#endregion

  private updateDynamicColumns(maxCharCode: number): void {
    const cols: any[] = [
      { header: 'Nội dung câu hỏi', field: 'QuestionText', width: '350px' },
      { header: 'Điểm', field: 'Point', width: '70px', align: 'right' }
    ];

    if (maxCharCode >= 65) {
      for (let code = 65; code <= maxCharCode; code++) {
        const letter = String.fromCharCode(code);
        cols.push({
          header: `Đáp án ${letter}`, field: letter, width: '120px'
        });
      }
    }

    cols.push({
      header: 'Đáp án đúng', field: 'CorrectAnswers', width: '120px'
    });

    this.dynamicCols = cols;
  }

  //#region Load dữ liệu combobox

  loadDepartments(): void {
    this.examService.getDataDepartment().subscribe({
      next: (res: any) => {
        const list = res.data || [];
        this.departments = [{ ID: 0, Name: 'Tất cả' }, ...list];
      },
      error: () => {
        this.departments = [{ ID: 0, Name: 'Tất cả' }];
      },
    });
  }

  /** Load vị trí tuyển dụng nguồn theo phòng ban nguồn */
  loadFromRecruitmentBatches(): void {
    this.examService.getDataCbbHiringRequest(this.fromDepartmentId || 0).subscribe({
      next: (res: any) => {
        const list = res.data || [];
        this.fromRecruitmentBatches = list;
        // Đồng thời load luôn danh sách đề thi nguồn
        this.loadFromExams();
      },
      error: () => {
        this.fromRecruitmentBatches = [];
        this.loadFromExams();
      }
    });
  }

  /** Load đề thi nguồn theo đợt tuyển dụng nguồn */
  loadFromExams(): void {
    this.examService.getExams(this.fromDepartmentId || 0, this.filterText || '').subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.fromExams = [...data];
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách đề thi nguồn:', error);
        this.fromExams = [];
      },
    });
  }

  /** Load vị trí tuyển dụng đích theo phòng ban đích */
  loadToRecruitmentBatches(isInit: boolean = false): void {
    this.examService.getDataCbbHiringRequest(this.toDepartmentId || 0).subscribe({
      next: (res: any) => {
        const list = res.data || [];
        this.toRecruitmentBatches = list;
        this.loadToExams(isInit);
      },
      error: () => {
        this.toRecruitmentBatches = [];
        this.loadToExams(isInit);
      }
    });
  }

  /** Load đề thi đích theo đợt tuyển dụng đích */
  loadToExams(isInit: boolean = false): void {
    this.examService.getExams(this.toDepartmentId || 0, this.filterText || '').subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.toExams = [...data];

        // Nếu không có ID đề thi từ trước (isInit) thì tự động chọn cái đầu, nếu có thì giữ nguyên (do form cha truyền vào)
        if (!isInit || this.toExamID === 0) {
          if (this.toExams.length > 0) {
            this.toExamID = this.toExams[0].ID;
            this.onToExamChange();
          } else {
            this.toExamID = 0;
            this.toExamType = 0;
          }
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách đề thi đích:', error);
        this.toExams = [];
      },
    });
  }

  //#endregion

  //#region Event handlers combobox

  onFromDepartmentChange(): void {
    this.fromRecruitmentBatchId = 0;
    this.fromExamId = 0;
    this.loadFromRecruitmentBatches();
    this.searchQuestions();
  }

  onFromBatchChange(): void {
    this.fromExamId = 0;
    this.loadFromExams();
    this.searchQuestions();
  }

  onFromExamChange(): void {
    // Tìm đề thi để lấy ExamType
    const selectedExam = this.fromExams.find(e => e.ID === this.fromExamId);
    if (selectedExam && selectedExam.ExamType) {
      this.fromExamType = selectedExam.ExamType;
    }
    this.searchQuestions();
  }

  onFromExamTypeChange(): void {
    this.searchQuestions();
  }

  onToDepartmentChange(): void {
    this.toRecruitmentBatchId = 0;
    this.toExamID = 0;
    this.loadToRecruitmentBatches();
  }

  onToBatchChange(): void {
    this.toExamID = 0;
    this.loadToExams();
  }

  onToExamChange(): void {
    // Cập nhật lại ExamType và ExamName, ExamCode khi chọn đề thi khác
    const selectedExam = this.toExams.find(e => e.ID === this.toExamID);
    if (selectedExam) {
      this.toExamType = selectedExam.ExamType || 0;
      this.toExamName = selectedExam.NameExam || '';
      this.toExamCode = selectedExam.CodeExam || '';
    } else {
      this.toExamType = 0;
      this.toExamName = '';
      this.toExamCode = '';
    }
  }

  //#endregion

  //#region Tìm kiếm câu hỏi nguồn

  searchQuestions(): void {
    this.isLoadingQuestion = true;

    // Chuẩn bị tham số cho API get-data-questionAnswers
    const requestParam = {
      ExamType: this.fromExamType || 0,
      HRRecruitmentExamID: this.fromExamId || 0,
      FilterText: this.filterText || ''
    };

    // Gọi service
    this.examService.getDataQuestionAnswersCopy(requestParam).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          let maxCharCode = 68; // Default to 'D'
          // Gán STT cho từng dòng và tìm số cột đáp án max
          this.datasetQuestion = res.data.map((item: any) => {
            for (const key of Object.keys(item)) {
              if (key.length === 1 && key >= 'A' && key <= 'Z') {
                const code = key.charCodeAt(0);
                if (code > maxCharCode) {
                  maxCharCode = code;
                }
              }
            }
            return { ...item };
          });

          this.updateDynamicColumns(maxCharCode);
        } else {
          this.datasetQuestion = [];
          this.updateDynamicColumns(68);
        }

        this.isLoadingQuestion = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách câu hỏi nguồn:', err);
        this.datasetQuestion = [];
        this.updateDynamicColumns(68);
        this.isLoadingQuestion = false;
        this.cdr.detectChanges();
      }
    });
  }

  //#endregion

  //#region Lưu - Sao chép câu hỏi

  onSaveAndClose(): void {
    // Validate: phải chọn đề thi đích
    if (!this.toExamID || this.toExamID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không xác định được đề thi đích. Vui lòng kiểm tra lại!');
      return;
    }

    // Lấy danh sách câu hỏi được chọn
    const selectedRowsData = this.selectedQuestions || [];
    const listQuestionIDs: number[] = [];
    selectedRowsData.forEach((item: any) => {
      if (item?.ID > 0) listQuestionIDs.push(item.ID);
    });

    if (listQuestionIDs.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một câu hỏi để sao chép!');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận sao chép',
      nzContent: `Bạn có chắc muốn sao chép <b>${listQuestionIDs.length}</b> câu hỏi vào đề thi <b>"${this.toExamName || this.toExamCode}"</b> không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isSaving = true;
        const requestParam = {
          ListQuestionID: listQuestionIDs,
          HRRecruitmentExamID: this.toExamID
        };

        this.examService.copyQuestionAnswers(requestParam).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            if (res && res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res.message || `Đã sao chép ${listQuestionIDs.length} câu hỏi thành công!`);
              this.activeModal.close({ success: true, reloadData: true });
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Có lỗi xảy ra khi sao chép câu hỏi!');
            }
          },
          error: (err) => {
            console.error('Lỗi khi copy câu hỏi:', err);
            this.isSaving = false;
            this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi sao chép câu hỏi!');
          }
        });
      },
    });
  }

  //#endregion

  //#region Đóng

  onClose(): void {
    this.activeModal.dismiss();
  }

  //#endregion
}
