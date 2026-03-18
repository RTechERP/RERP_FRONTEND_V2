import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PermissionService } from '../../../../../services/permission.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { HRRecruitmentExamService } from '../hr-recruitment-exam-service/hrrecruitment-exam.service';
import { HRRecruitmentExamDetailComponent } from '../hrrecruitment-exam-detail/hrrecruitment-exam-detail.component';
import { HRRecruitmentQuestionDetailComponent } from '../hrrecruitment-question-detail/hrrecruitment-question-detail.component';
import { CopyQuestionComponent } from '../copy-question/copy-question.component';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

@Component({
  selector: 'app-hrrecruitment-exam',
  templateUrl: './hrrecruitment-exam.component.html',
  styleUrl: './hrrecruitment-exam.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzSpinModule,
    NzModalModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    TableModule,
    CheckboxModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CopyQuestionComponent,
    Menubar,
    HasPermissionDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HRRecruitmentExamComponent implements OnInit, AfterViewInit {

  //#region Trạng thái loading
  isLoadingExam: boolean = false;
  isLoadingQuestion: boolean = false;
  isLoadingRightAnswer: boolean = false;
  //#endregion

  //#region ID dòng đang chọn
  selectedExamID: number = 0;
  selectedExamType: number = 1;
  selectedQuestionID: number = 0;
  //#endregion

  //#region Trạng thái SlickGrid cũ (Đã thay = PrimeNG)
  // angularGridExam, angularGridQuestion, vv... được thay bằng biến ngModel
  selectedExam: any = null;
  selectedQuestions: any[] = [];
  dynamicAnswerCols: any[] = [];
  menuBarsExam: MenuItem[] = [];
  menuBarsQuestion: MenuItem[] = [];
  //#endregion

  //#region Dữ liệu bảng
  departmentId: number | null = null;
  isAdmin: boolean = false;

  datasetExam: any[] = [];
  datasetQuestion: any[] = [];
  datasetRightAnswer: any[] = [];
  //#endregion

  //#region Trạng thái grid đã sẵn sàng
  gridsReady = false;
  //#endregion

  //#region Filter bar state
  showSearchBar: boolean = true;
  //departmentId: number = 0;
  keyword: string = '';
  recruitmentBatches: any[] = [];
  departments: any[] = [];
  //#endregion

  constructor(
    private notification: NzNotificationService,
    private examService: HRRecruitmentExamService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private tabService: TabServiceService,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
  ) { }

  //#region Lifecycle hooks

  ngOnInit(): void {
    // Thêm mảng employeeID đặc biệt có quyền như admin
    const specialAdminIds = [54, 1, 2, 3, 400, 401, 402, 403];

    // Determine admin status
    this.isAdmin = this.appUserService.isAdmin || specialAdminIds.includes(this.appUserService.employeeID || 0);
    // Auto-fill department if not admin
    if (!this.isAdmin) {
      this.departmentId = this.appUserService.departmentID || null;
    }

    // Load dữ liệu filter
    this.loadDepartments();
    this.initMenuBars();
  }

  initMenuBars() {
    this.menuBarsExam = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onAddExam();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onEditExam();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onDeleteExam();
        },
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.onRefreshExam();
        },
      },
    ];

    this.menuBarsQuestion = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onAddQuestion();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onEditQuestion();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onDeleteQuestion();
        },
      },
      {
        label: 'Sao chép câu hỏi',
        icon: 'fa-solid fa-copy fa-lg text-warning',
        visible: this.permissionService.hasPermission('N1,N2,N32,N33,N38,N51,N52,N56,N61,N79,N81,N86'),
        command: () => {
          this.onCopyQuestion();
        },
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.onRefreshQuestion();
        },
      },
    ];
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.gridsReady = true;
      this.loadExams();
      this.resizeAllGrids();
    }, 100);
  }

  //#endregion

  //#region Filter bar - Toggle search panel

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;

    // Resize grids khi toggle filter bar
    setTimeout(() => this.resizeAllGrids(), 200);
  }

  //#endregion

  //#region Filter bar - Load dữ liệu combobox

  /** Tải danh sách vị trí tuyển dụng (Đợt tuyển dụng) theo departmentId */
  // loadRecruitmentBatches(): void {
  //   this.examService.getDataCbbHiringRequest(this.departmentId || 0).subscribe({
  //     next: (res: any) => {
  //       const list = res.data || [];
  //       this.recruitmentBatches = [{ ID: 0, Name: 'Tất cả' }, ...list];
  //     },
  //     error: () => {
  //       this.recruitmentBatches = [{ ID: 0, Name: 'Tất cả' }];
  //     }
  //   });
  // }

  /** Xử lý khi chọn Combobox Phòng ban ở Filter */
  onDepartmentChange(): void {
    this.searchExams();
    // this.loadRecruitmentBatches();
  }

  /** Tải danh sách phòng ban từ service */
  loadDepartments(): void {
    this.examService.getDataDepartment().subscribe({
      next: (response: any) => {
        const list = response.data || [];
        this.departments = [{ ID: 0, Name: 'Tất cả' }, ...list];
        // Mặc định chọn Tất cả (ID: 0) với Admin, với Non-admin chọn phòng ban của mình
        if (this.isAdmin) {
          this.departmentId = 0;
        } else {
          this.departmentId = this.appUserService.departmentID || 0;
        }

        // this.loadRecruitmentBatches();
        if (this.gridsReady) {
          this.loadExams();
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.departments = [{ ID: 0, Name: 'Tất cả' }];
        if (this.isAdmin) {
          this.departmentId = 0;
        } else {
          this.departmentId = this.appUserService.departmentID || 0;
        }

        // this.loadRecruitmentBatches();
      },
    });
  }

  /** Tìm kiếm đề thi theo bộ lọc */
  searchExams(): void {
    this.loadExams();
    this.datasetQuestion = [];
    this.datasetRightAnswer = [];
  }

  //#endregion

  //#region Sự kiện chọn dòng (PrimeNG)

  /** Khi chọn dòng đề thi → load câu hỏi tương ứng */
  onExamRowSelect(event: any): void {
    if (event.data) {
      this.selectedExamID = event.data.ID;
      this.selectedExamType = event.data.ExamType || 1;
      this.loadQuestions(this.selectedExamID);
    }
  }

  /** Khi chọn hủy dòng đề thi */
  onExamRowUnselect(event: any): void {
    this.selectedExamID = 0;
    this.datasetQuestion = [];
    this.datasetRightAnswer = [];
  }

  /** Khi chọn dòng câu hỏi → load đáp án đúng tương ứng */
  onQuestionRowSelect(event: any): void {
    if (event.data) {
      this.selectedQuestionID = event.data.ID;
      this.loadRightAnswers(this.selectedQuestionID);
    }
  }

  /** Xử lý click thẳng vào dòng câu hỏi (dùng kết hợp với nút checkbox) */
  onQuestionRowClick(q: any): void {
    if (q && q.ID) {
      this.selectedQuestionID = q.ID;
      this.loadRightAnswers(q.ID);
    }
  }

  //#endregion

  //#region Tải dữ liệu

  /** Tải danh sách đề thi theo phòng ban và đợt tuyển dụng */
  loadExams(): void {
    this.isLoadingExam = true;
    this.examService.getExams(this.departmentId || 0, this.keyword || '').subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.datasetExam = data.map((item: any, index: number) => {
          let computedType = item.ExamType;
          if (computedType === undefined || computedType === null) {
            if (item.ExamTypeText === 'Tự luận' || String(item.ExamTypeText).toLowerCase().includes('tự luận') && !String(item.ExamTypeText).toLowerCase().includes('trắc nghiệm')) {
              computedType = 2;
            } else if (item.ExamTypeText === 'Khác' || String(item.ExamTypeText).toLowerCase().includes('&')) {
              computedType = 3;
            } else {
              computedType = 1; // Mặc định Trắc nghiệm
            }
          }
          return {
            ...item,
            ExamType: computedType,
            id: item.ID || `exam_${index + 1}`,
          };
        });

        // Chọn dòng đầu tiên hoặc giữ dòng đang chọn
        if (this.datasetExam.length > 0) {
          const existingItem = this.datasetExam.find((x: any) => x.ID === this.selectedExamID);
          if (existingItem) {
            this.selectedExam = existingItem;
            this.selectedExamType = existingItem.ExamType || 1;
            this.loadQuestions(this.selectedExamID);
          } else {
            this.selectedExam = this.datasetExam[0];
            this.selectedExamID = this.datasetExam[0].ID;
            this.selectedExamType = this.datasetExam[0].ExamType || 1;
            this.loadQuestions(this.selectedExamID);
          }
        } else {
          this.datasetQuestion = [];
          this.datasetRightAnswer = [];
          this.selectedExam = null;
        }
        this.isLoadingExam = false;
      },
      error: (err: any) => {
        this.isLoadingExam = false;
        this.datasetExam = [];

        let errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
        if (typeof err?.error === 'string') {
          try { errorMsg = JSON.parse(err.error).message; } catch (e) { }
        }

        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          errorMsg,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  /** Tải danh sách câu hỏi theo ExamID */
  loadQuestions(examId: number): void {
    this.isLoadingQuestion = true;
    this.examService.getQuestionsByExamId(examId).subscribe({
      next: (response: any) => {
        const data = response.data || [];

        // Xác định số lượng cột đáp án max (để tạo cột động)
        let maxAnswerCols = 0;

        this.datasetQuestion = data.map((item: any, index: number) => {
          // Tính số cột tối đa từ các field số "1", "2", "3"...
          for (const key of Object.keys(item)) {
            const num = parseInt(key, 10);
            if (!isNaN(num) && num > maxAnswerCols) {
              maxAnswerCols = num;
            }
          }

          return {
            ...item,
            id: item.ID || `question_${index + 1}`,
          };
        });

        // Reset list chọn checkbox mỗi khi load lại danh sách câu hỏi
        this.selectedQuestions = [];

        // Trích ra các cột động để grid PrimeNG hiển thị
        this.dynamicAnswerCols = [];
        if (this.selectedExamType !== 2) {
          for (let i = 1; i <= maxAnswerCols; i++) {
            const code = String.fromCharCode(64 + i); // 1->A, 2->B...
            this.dynamicAnswerCols.push({ field: i.toString(), header: `Đáp án ${code}` });
          }
        }

        // Chọn dòng đầu tiên hoặc giữ dòng đang chọn để tải danh sách đáp án
        if (this.datasetQuestion.length > 0) {
          const existingItem = this.datasetQuestion.find((x: any) => x.ID === this.selectedQuestionID);
          if (existingItem) {
            // Giữ nguyên selectedQuestionID
            this.loadRightAnswers(this.selectedQuestionID);
          } else {
            this.selectedQuestionID = this.datasetQuestion[0].ID;
            this.loadRightAnswers(this.selectedQuestionID);
          }
        } else {
          this.datasetRightAnswer = [];
        }
        this.isLoadingQuestion = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoadingQuestion = false;
        this.datasetQuestion = [];

        let errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
        if (typeof err?.error === 'string') {
          try { errorMsg = JSON.parse(err.error).message; } catch (e) { }
        }

        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          errorMsg,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  /** Tải đáp án đúng theo QuestionID */
  loadRightAnswers(questionId: number): void {
    this.isLoadingRightAnswer = true;
    this.examService.getRightAnswersByQuestionId(questionId).subscribe({
      next: (response: any) => {
        const data = response.data || [];
        this.datasetRightAnswer = data.map((item: any, index: number) => ({
          ...item,
          id: item.ID || `answer_${index + 1}`,
        }));
        this.isLoadingRightAnswer = false;
      },
      error: (err: any) => {
        this.isLoadingRightAnswer = false;
        this.datasetRightAnswer = [];

        let errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
        if (typeof err?.error === 'string') {
          try { errorMsg = JSON.parse(err.error).message; } catch (e) { }
        }

        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          errorMsg,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  //#endregion

  //#region Hành động Đề thi

  /** Thêm đề thi mới */
  onAddExam(): void {
    this.openExamDetailDialog(0, false);
  }

  /** Sửa đề thi đang chọn */
  onEditExam(): void {
    if (!this.datasetExam || this.datasetExam.length === 0 || this.selectedExamID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đề thi để sửa!');
      return;
    }
    this.openExamDetailDialog(this.selectedExamID, true);
  }

  /** Mở dialog chi tiết đề thi (thêm mới hoặc sửa) */
  private openExamDetailDialog(examId: number, isEdit: boolean): void {
    const modalRef = this.modalService.open(HRRecruitmentExamDetailComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.examID = examId;
    modalRef.componentInstance.isEditMode = isEdit;
    // Truyền ID đợt tuyển dụng và phòng ban từ filter bar
    // modalRef.componentInstance.recruitmentSessionID = this.recruitmentBatchId || 0;
    modalRef.componentInstance.departmentID = this.departmentId || 0;
    modalRef.componentInstance.recruitmentBatches = (this.recruitmentBatches || []).filter((item: any) => item.ID !== 0);
    modalRef.result.then(
      (result: any) => {
        // Nếu lưu thành công → reload danh sách đề thi
        if (result?.success || result?.reloadData) {
          this.loadExams();
        }
      },
      () => { /* Dismiss - không làm gì */ }
    );
  }

  /** Xóa đề thi đang chọn */
  onDeleteExam(): void {
    if (this.selectedExamID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đề thi để xóa!');
      return;
    }
    const selectedRow = this.datasetExam.find((item) => item.ID === this.selectedExamID);
    if (!selectedRow) return;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa đề thi "${selectedRow.NameExam}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.examService.deleteExam(this.selectedExamID).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa đề thi thành công!');
              this.loadExams();
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể xóa đề thi!');
            }
          },
          error: (err: any) => {
            let errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
            if (typeof err?.error === 'string') {
              try { errorMsg = JSON.parse(err.error).message; } catch (e) { }
            }

            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              errorMsg,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          },
        });
      },
    });
  }

  /** Refresh danh sách đề thi */
  onRefreshExam(): void {
    this.loadExams();
  }

  //#endregion

  //#region Hành động Câu hỏi

  /** Thêm câu hỏi mới */
  onAddQuestion(): void {
    if (!this.datasetExam || this.datasetExam.length === 0 || this.selectedExamID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đề thi trước!');
      return;
    }
    this.openQuestionDetailDialog(0, false);
  }


  /** Mở chi tiết câu hỏi bằng tab (thay vì modal) theo pattern Danh mục vật tư */
  private openQuestionDetailDialog(questionId: number, isEdit: boolean): void {
    const tabKey = isEdit
      ? `question-detail-edit-${questionId}`
      : `question-detail-new-${this.selectedExamID}-${Date.now()}`;

    const selectedExam = this.datasetExam.find((e: any) => e.ID === this.selectedExamID);
    const examCode = selectedExam?.CodeExam || '';
    const title = isEdit
      ? `Sửa câu hỏi - ${examCode}`
      : `Thêm câu hỏi - ${examCode}`;

    this.tabService.openTabComp({
      comp: HRRecruitmentQuestionDetailComponent,
      title,
      key: tabKey,
      data: {
        tabKey: tabKey,
        questionID: questionId,
        examID: this.selectedExamID,
        examType: this.selectedExamType,
        isEditMode: isEdit,
        datasetRightAnswer: this.datasetRightAnswer || [],
        onSavedCallback: (result: any) => {
          if (result?.success || result?.reloadData) {
            this.loadQuestions(this.selectedExamID);
          }
        },
      },
    });
  }

  /** Sửa câu hỏi đang chọn */
  onEditQuestion(): void {
    if (!this.datasetQuestion || this.datasetQuestion.length === 0 || this.selectedQuestionID <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một câu hỏi để sửa!');
      return;
    }
    this.openQuestionDetailDialog(this.selectedQuestionID, true);
  }

  /** Xóa câu hỏi đang chọn (hỗ trợ chọn nhiều dòng) */
  onDeleteQuestion(): void {
    let listIDToDelete: number[] = [];
    if (this.selectedQuestions && this.selectedQuestions.length > 0) {
      listIDToDelete = this.selectedQuestions.map(q => q.ID);
    } else if (this.selectedQuestionID > 0) {
      listIDToDelete = [this.selectedQuestionID];
    }

    if (listIDToDelete.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một câu hỏi để xóa!');
      return;
    }

    const confirmMsg = listIDToDelete.length === 1
      ? 'Bạn có chắc chắn muốn xóa câu hỏi này không?'
      : `Bạn có chắc muốn xóa danh sách ${listIDToDelete.length} câu hỏi đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: confirmMsg,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.examService.deleteQuestions(listIDToDelete).subscribe({
          next: (res) => {
            if (res?.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Đã xóa câu hỏi thành công!');
              this.loadQuestions(this.selectedExamID);
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Không thể xóa câu hỏi!');
            }
          },
          error: (err: any) => {
            let errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra!';
            if (typeof err?.error === 'string') {
              try { errorMsg = JSON.parse(err.error).message; } catch (e) { }
            }
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              errorMsg,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          },
        });
      },
    });
  }

  /** Refresh danh sách câu hỏi */
  onRefreshQuestion(): void {
    if (this.selectedExamID > 0) {
      this.loadQuestions(this.selectedExamID);
    }
  }

  /** Mở màn hình Sao chép câu hỏi (fullscreen modal) */
  onCopyQuestion(): void {
    // Cho phép mở copy form kể cả khi không chọn dòng nào (người dùng tự chọn đích trong form)
    const selectedExam = this.datasetExam && this.selectedExamID > 0
      ? this.datasetExam.find((e: any) => e.ID === this.selectedExamID)
      : null;

    const modalRef = this.modalService.open(CopyQuestionComponent, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      windowClass: 'fullscreen-modal',   // CSS class để làm fullscreen
      fullscreen: true,
    });

    // Truyền thông tin bộ lọc hiện tại để form Copy khởi tạo
    modalRef.componentInstance.toDepartmentID = selectedExam ? (selectedExam.DepartmentID || 0) : (this.departmentId || 0);
    // modalRef.componentInstance.toRecruitmentBatchId = selectedExam ? (selectedExam.RecruitmentSessionID || 0) : (this.recruitmentBatchId || 0);

    if (selectedExam) {
      modalRef.componentInstance.toExamID = this.selectedExamID;
      modalRef.componentInstance.toExamName = selectedExam.NameExam || '';
      modalRef.componentInstance.toExamCode = selectedExam.CodeExam || '';
      modalRef.componentInstance.toExamType = this.selectedExamType || 1;
      modalRef.componentInstance.toDepartmentName = selectedExam.DepartmentName || '';
    }

    modalRef.result.then(
      (result: any) => {
        if (result?.success || result?.reloadData) {
          this.loadQuestions(this.selectedExamID);
        }
      },
      () => { /* Dismiss */ }
    );
  }

  //#endregion

  //#region Tiện ích

  /** Xóa tag HTML để hiển thị tooltip text thuần */
  stripHtml(html: any): string {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Tải file từ grid khi double click vào cột ảnh */
  downloadFileFromGrid(serverPath: string): void {
    if (!serverPath) return;
    const fileName = serverPath.split('/').pop() || serverPath.split('\\').pop() || 'downloaded_file';
    this.examService.downloadFile(serverPath).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải file!');
      }
    });
  }

  /** Resize tất cả các grid */
  private resizeAllGrids(): void {
    // PrimeNG grids auto resize, no longer need explicit resizerService calls
  }

  //#endregion
}
