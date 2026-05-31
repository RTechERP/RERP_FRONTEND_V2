import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { environment } from '../../../environments/environment';
import { NOTIFICATION_TITLE } from '../../app.config';
import { AppUserService } from '../../services/app-user.service';
import { PollFormService } from './poll-form.service';

type PollQuestionType = 'Text' | 'SingleChoice' | 'MultipleChoice' | 'Rating' | 'Date' | 'Textarea';
type PollDataSourceType = '' | 'Employee';
type PollStatusKey = 'active' | 'scheduled' | 'ended' | 'noLimit';
type PollStatusFilter = 'all' | PollStatusKey | 'public' | 'draft';
type ConditionLogic = 'and' | 'or';
type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'in'
  | 'notIn'
  | 'greaterThan'
  | 'greaterOrEqual'
  | 'lessThan'
  | 'lessOrEqual'
  | 'empty'
  | 'notEmpty';

interface PollFormSummary {
  id: number;
  title: string;
  description: string;
  backgroundImagePath: string | null;
  titleColor: string;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
  createdBy: string;
  createdDate: string | null;
  updatedDate: string | null;
}

interface PollQuestionOptionModel {
  id: number;
  pollQuestionId: number | null;
  optionText: string;
  optionValue: string;
  sortOrder: number;
}

interface PollSectionModel {
  id: number;
  clientId: string;
  pollFormId: number | null;
  title: string;
  description: string;
  sortOrder: number;
  showIfJson: string | null;
  branchingRulesJson: string | null;
  showIfLogic: ConditionLogic;
  showIfConditions: SectionConditionModel[];
  branchingRules: SectionBranchRuleModel[];
  defaultNextSectionTarget: string;
}

interface PollQuestionModel {
  id: number;
  pollFormId: number | null;
  sectionId: number | null;
  sectionClientId: string;
  questionText: string;
  fieldKey: string;
  questionType: PollQuestionType;
  isRequired: boolean;
  sortOrder: number;
  configJson: string | null;
  ratingMax: number;
  dataSourceType: PollDataSourceType;
  dataSourceField: string;
  dataSourceLabel: string;
  dataSourceValue: string | null;
  dataSourceDisplayValue: string | null;
  isAutoFilled: boolean;
  options: PollQuestionOptionModel[];
}

interface PollStatisticOption {
  optionId: number;
  optionText: string;
  optionValue: string;
  count: number;
}

interface PollStatisticQuestion {
  questionId: number;
  questionText: string;
  questionType: PollQuestionType;
  totalAnswers: number;
  options: PollStatisticOption[];
}

interface PollStatisticsModel {
  pollFormId: number;
  pollFormTitle: string;
  totalResponses: number;
  questions: PollStatisticQuestion[];
}

interface PollResponseAnswerModel {
  id: number;
  questionId: number;
  answerText: string | null;
  answerJson: string | null;
  displayText: string | null;
}

interface PollResponseModel {
  id: number;
  pollFormId: number;
  employeeId: number | null;
  employeeCode: string | null;
  employeeName: string | null;
  createdDate: string | null;
  answers: PollResponseAnswerModel[];
}

interface PollResponseSectionGroup {
  key: string;
  title: string;
  answers: PollResponseAnswerModel[];
}

interface SubmitSectionResultModel {
  pollResponseId: number;
  pollFormId: number;
  sectionId: number;
  nextSectionId: number | null;
  isCompleted: boolean;
  savedAnswerCount: number;
}

interface BranchDecision {
  hasDecision: boolean;
  nextSectionId: number | null;
  nextSectionIndex: number | null;
  isExplicitEnd: boolean;
}

interface QuestionTypeOption {
  value: PollQuestionType;
  label: string;
  icon: string;
}

interface PollEmployeeFieldOptionModel {
  fieldKey: string;
  label: string;
  dataType: string;
  suggestedQuestionType: PollQuestionType;
  displayType: string;
  lookupSource: string | null;
  isSensitive: boolean;
}

interface ConditionOperatorOption {
  value: ConditionOperator;
  label: string;
}

interface SectionConditionModel {
  fieldKey: string;
  operator: ConditionOperator;
  value: string;
}

interface SectionBranchRuleModel {
  logic: ConditionLogic;
  conditions: SectionConditionModel[];
  nextSectionTarget: string;
}

interface RuleQuestionOption {
  value: string;
  label: string;
}

interface SectionTargetOption {
  value: string;
  label: string;
}

interface SectionOptionCache {
  signature: string;
  showIfQuestionOptions: RuleQuestionOption[];
  branchQuestionOptions: RuleQuestionOption[];
  defaultTargetOptions: SectionTargetOption[];
  branchTargetOptions: SectionTargetOption[];
}

interface SectionQuestionCache {
  signature: string;
  questions: PollQuestionModel[];
}

interface BranchingRulePayload {
  logic: ConditionLogic;
  conditions: Record<string, any>[];
  nextSectionId: number | null;
}

interface PollStatusView {
  key: PollStatusKey;
  label: string;
  color: string;
}

@Component({
  selector: 'app-poll-form',
  templateUrl: './poll-form.component.html',
  styleUrl: './poll-form.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzAlertModule,
    NzButtonModule,
    NzDatePickerModule,
    NzEmptyModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzNotificationModule,
    NzProgressModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTabsModule,
    NzTagModule,
    NzToolTipModule,
  ],
})
export class PollFormComponent implements OnInit {
  readonly autoNextTargetValue = '__auto_next__';
  readonly endFormTargetValue = '__end_form__';

  readonly conditionLogicOptions: { value: ConditionLogic; label: string }[] = [
    { value: 'and', label: 'Tất cả điều kiện' },
    { value: 'or', label: 'Một trong các điều kiện' },
  ];

  readonly conditionOperatorOptions: ConditionOperatorOption[] = [
    { value: 'equals', label: 'Bằng' },
    { value: 'notEquals', label: 'Khác' },
    { value: 'contains', label: 'Có chứa' },
    { value: 'notContains', label: 'Không chứa' },
    { value: 'in', label: 'Nằm trong' },
    { value: 'notIn', label: 'Không nằm trong' },
    { value: 'greaterThan', label: 'Lớn hơn' },
    { value: 'greaterOrEqual', label: 'Lớn hơn hoặc bằng' },
    { value: 'lessThan', label: 'Nhỏ hơn' },
    { value: 'lessOrEqual', label: 'Nhỏ hơn hoặc bằng' },
    { value: 'empty', label: 'Trống' },
    { value: 'notEmpty', label: 'Không trống' },
  ];

  readonly questionTypes: QuestionTypeOption[] = [
    { value: 'Text', label: 'Trả lời ngắn', icon: 'fa-solid fa-minus' },
    { value: 'Textarea', label: 'Đoạn văn', icon: 'fa-solid fa-align-left' },
    { value: 'SingleChoice', label: 'Một lựa chọn', icon: 'fa-regular fa-circle-dot' },
    { value: 'MultipleChoice', label: 'Nhiều lựa chọn', icon: 'fa-regular fa-square-check' },
    { value: 'Rating', label: 'Đánh giá', icon: 'fa-regular fa-star' },
    { value: 'Date', label: 'Ngày', icon: 'fa-regular fa-calendar' },
  ];

  readonly statusOptions: { value: PollStatusFilter; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang mở' },
    { value: 'scheduled', label: 'Sắp mở' },
    { value: 'ended', label: 'Đã kết thúc' },
    { value: 'noLimit', label: 'Không giới hạn' },
    { value: 'public', label: 'Đã xuất bản' },
    { value: 'draft', label: 'Bản nháp' },
  ];

  pollForm: UntypedFormGroup;
  polls: PollFormSummary[] = [];
  sections: PollSectionModel[] = [];
  questions: PollQuestionModel[] = [];
  employeeFieldOptions: PollEmployeeFieldOptionModel[] = [];
  responses: PollResponseModel[] = [];
  selectedResponse: PollResponseModel | null = null;
  statistics: PollStatisticsModel | null = null;
  answers: Record<string, any> = {};
  searchText = '';
  responseKeyword = '';
  statusFilter: PollStatusFilter = 'all';
  selectedPollId = 0;
  selectedSectionIndex = 0;
  selectedQuestionIndex = 0;
  previewSectionIndex = 0;
  pollResponseId: number | null = null;
  isPollCompleted = false;
  activeTabIndex = 0;
  isLoadingPolls = false;
  isLoadingDetail = false;
  isLoadingEmployeeFields = false;
  isLoadingResults = false;
  isExportingExcel = false;
  exportingExcelMode: 'completed' | 'all' | null = null;
  isLoadingResponseDetail = false;
  isResponseDetailVisible = false;
  isSaving = false;
  isSubmitting = false;
  isUploadingBackground = false;
  private sectionSequence = 0;
  private deletedSectionIds: number[] = [];
  private deletedQuestionIds: number[] = [];
  private deletedOptionIds: number[] = [];
  private filteredPollsSignature = '';
  private filteredPollsCache: PollFormSummary[] = [];
  private readonly sectionOptionCache = new WeakMap<PollSectionModel, SectionOptionCache>();
  private readonly sectionQuestionCache = new WeakMap<PollSectionModel, SectionQuestionCache>();
  private readonly ratingScaleCache = new Map<number, number[]>();
  private readonly responseSectionGroupCache = new WeakMap<PollResponseModel, { signature: string; groups: PollResponseSectionGroup[] }>();

  constructor(
    private fb: UntypedFormBuilder,
    private pollFormService: PollFormService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) {
    this.pollForm = this.fb.group({
      id: [0],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      backgroundImagePath: [''],
      titleColor: ['#111827'],
      startDate: [''],
      endDate: [''],
      isPublic: [false],
    });
  }

  ngOnInit(): void {
    this.newPoll();
    void this.loadEmployeeFieldOptions();
    void this.loadPolls(true);
  }

  get filteredPolls(): PollFormSummary[] {
    const keyword = this.searchText.trim().toLowerCase();
    const timeBucket = ['active', 'scheduled', 'ended'].includes(this.statusFilter) ? Math.floor(Date.now() / 60000) : 0;
    const signature = [
      keyword,
      this.statusFilter,
      timeBucket,
      this.polls.map((poll) => `${poll.id}:${poll.title}:${poll.description}:${poll.backgroundImagePath}:${poll.titleColor}:${poll.createdBy}:${poll.startDate}:${poll.endDate}:${poll.isPublic}`).join('|'),
    ].join('::');

    if (this.filteredPollsSignature === signature) {
      return this.filteredPollsCache;
    }

    this.filteredPollsCache = this.polls.filter((poll) => {
      const matchesKeyword =
        !keyword ||
        poll.title.toLowerCase().includes(keyword) ||
        poll.description.toLowerCase().includes(keyword) ||
        poll.createdBy.toLowerCase().includes(keyword);

      if (!matchesKeyword) return false;
      if (this.statusFilter === 'all') return true;
      if (this.statusFilter === 'public') return poll.isPublic;
      if (this.statusFilter === 'draft') return !poll.isPublic;
      return this.getPollStatus(poll).key === this.statusFilter;
    });
    this.filteredPollsSignature = signature;
    return this.filteredPollsCache;
  }

  get totalResponses(): number {
    return this.statistics?.totalResponses ?? this.responses.length;
  }

  get currentPollTitle(): string {
    const title = String(this.pollForm.get('title')?.value ?? '').trim();
    return title || 'Phiếu bình chọn chưa đặt tên';
  }

  get currentPollBackgroundUrl(): string {
    return this.resolveBackgroundImageUrl(this.pollForm.get('backgroundImagePath')?.value);
  }

  get currentPollBackgroundStyle(): string | null {
    const url = this.currentPollBackgroundUrl;
    return url ? `linear-gradient(rgba(238, 241, 245, 0.78), rgba(238, 241, 245, 0.88)), url("${this.escapeCssUrl(url)}")` : null;
  }

  get currentPollTitleColor(): string {
    return this.normalizeHexColor(this.pollForm.get('titleColor')?.value, '#111827');
  }

  get currentSection(): PollSectionModel | null {
    return this.sections[this.selectedSectionIndex] ?? null;
  }

  get currentPreviewSection(): PollSectionModel | null {
    return this.sections[this.previewSectionIndex] ?? this.sections[0] ?? null;
  }

  get currentSectionQuestions(): PollQuestionModel[] {
    const section = this.currentSection;
    if (!section) return [];
    return this.getQuestionsBySection(section);
  }

  get currentPreviewQuestions(): PollQuestionModel[] {
    const section = this.currentPreviewSection;
    if (!section) return [];
    return this.getQuestionsBySection(section);
  }

  get previewSections(): PollSectionModel[] {
    return this.sections;
  }

  get previewQuestions(): PollQuestionModel[] {
    return this.previewSections.reduce<PollQuestionModel[]>((questions, section) => {
      questions.push(...this.getQuestionsBySection(section));
      return questions;
    }, []);
  }

  get canSubmitPreview(): boolean {
    return (
      this.selectedPollId > 0 &&
      this.previewSections.length > 0 &&
      this.previewSections.every((section) => section.id > 0) &&
      this.previewQuestions.length > 0 &&
      this.previewQuestions.every((question) => question.id > 0) &&
      this.isPollOpenForVote() &&
      !this.isPollCompleted
    );
  }

  async loadPolls(selectFirst: boolean): Promise<void> {
    this.isLoadingPolls = true;
    try {
      const response = await firstValueFrom(this.pollFormService.getAll());
      this.assertSuccess(response);
      const data = this.unwrap<any[]>(response, []);
      this.polls = data.map((item) => this.normalizePollSummary(item));
      this.polls.sort((a, b) => this.getDateTime(b.createdDate) - this.getDateTime(a.createdDate));

      if (selectFirst && this.polls.length > 0) {
        await this.selectPoll(this.polls[0]);
      }
    } catch (error) {
      this.notifyError(error, 'Không tải được danh sách bình chọn');
    } finally {
      this.isLoadingPolls = false;
    }
  }

  async loadEmployeeFieldOptions(): Promise<void> {
    this.isLoadingEmployeeFields = true;
    try {
      let response: any;
      try {
        response = await firstValueFrom(this.pollFormService.getEmployeeFieldOptions());
      } catch {
        response = await firstValueFrom(this.pollFormService.getEmployeeFields());
      }
      this.assertSuccess(response);
      const data = this.unwrap<any[]>(response, []);
      this.employeeFieldOptions = data.map((item) => this.normalizeEmployeeFieldOption(item));
    } catch (error) {
      this.employeeFieldOptions = [];
      this.notifyError(error, 'Không tải được danh sách trường Employee');
    } finally {
      this.isLoadingEmployeeFields = false;
    }
  }

  async selectPoll(poll: PollFormSummary): Promise<void> {
    if (this.selectedPollId === poll.id && this.pollForm.get('id')?.value === poll.id) return;
    await this.loadPollDetail(poll.id, true);
  }

  newPoll(): void {
    const startDate = this.toDateTimeLocal(new Date());
    this.selectedPollId = 0;
    this.selectedSectionIndex = 0;
    this.selectedQuestionIndex = 0;
    this.previewSectionIndex = 0;
    this.pollResponseId = null;
    this.isPollCompleted = false;
    this.activeTabIndex = 0;
    this.statistics = null;
    this.responses = [];
    this.selectedResponse = null;
    this.isResponseDetailVisible = false;
    this.answers = {};
    this.deletedSectionIds = [];
    this.deletedQuestionIds = [];
    this.deletedOptionIds = [];
    this.pollForm.reset({
      id: 0,
      title: '',
      description: '',
      backgroundImagePath: '',
      titleColor: '#111827',
      startDate,
      endDate: '',
      isPublic: false,
    });
    this.sections = [this.createSectionModel(1)];
    this.questions = [this.createQuestion('SingleChoice', 1, this.sections[0])];
    this.resetAnswers();
  }

  async savePoll(): Promise<void> {
    if (this.isSaving) return;
    if (!this.validatePollBeforeSave()) return;

    this.isSaving = true;
    try {
      const formValue = this.pollForm.getRawValue();
      let pollId = Number(formValue.id || 0);
      const pollPayload = {
        id: pollId,
        title: String(formValue.title).trim(),
        description: String(formValue.description ?? '').trim(),
        backgroundImagePath: String(formValue.backgroundImagePath ?? '').trim(),
        titleColor: this.normalizeHexColor(formValue.titleColor, '#111827'),
        startDate: this.toApiDate(formValue.startDate),
        endDate: this.toApiDate(formValue.endDate),
        isPublic: Boolean(formValue.isPublic),
      };

      if (pollId > 0) {
        const response = await firstValueFrom(this.pollFormService.updatePollForm(pollPayload));
        this.assertSuccess(response);
      } else {
        const response = await firstValueFrom(this.pollFormService.createPollForm({
          title: pollPayload.title,
          description: pollPayload.description,
          backgroundImagePath: pollPayload.backgroundImagePath,
          titleColor: pollPayload.titleColor,
          startDate: pollPayload.startDate,
          endDate: pollPayload.endDate,
          isPublic: pollPayload.isPublic,
        }));
        this.assertSuccess(response);
        pollId = this.readId(this.unwrap<any>(response, {}));
        if (pollId <= 0) {
          throw new Error('API không trả về ID phiếu bình chọn vừa tạo');
        }
        this.pollForm.patchValue({ id: pollId });
      }

      this.reorderSections();
      for (const section of this.sections) {
        section.pollFormId = pollId;

        if (section.id <= 0) {
          const sectionPayload = {
            title: section.title.trim(),
            description: section.description.trim(),
            sortOrder: section.sortOrder,
            showIfJson: null,
            branchingRulesJson: null,
          };
          const response = await firstValueFrom(this.pollFormService.createSection(pollId, sectionPayload));
          this.assertSuccess(response);
          section.id = this.readId(this.unwrap<any>(response, {}));
          if (section.id <= 0) {
            throw new Error(`API không trả về ID cho section ${section.sortOrder}`);
          }
        }
      }

      for (const optionId of this.deletedOptionIds) {
        const response = await firstValueFrom(this.pollFormService.deleteOption(optionId));
        this.assertSuccess(response);
      }

      for (const questionId of this.deletedQuestionIds) {
        const response = await firstValueFrom(this.pollFormService.deleteQuestion(questionId));
        this.assertSuccess(response);
      }

      for (const sectionId of this.deletedSectionIds) {
        const response = await firstValueFrom(this.pollFormService.deleteSection(sectionId));
        this.assertSuccess(response);
      }

      this.reorderQuestions();
      for (let index = 0; index < this.questions.length; index += 1) {
        const question = this.questions[index];
        const section = this.findSectionForQuestion(question);
        if (!section || section.id <= 0) {
          throw new Error(`Câu hỏi ${index + 1} chưa thuộc section hợp lệ`);
        }
        question.pollFormId = pollId;
        question.sectionId = section.id;
        question.sectionClientId = section.clientId;
        question.fieldKey = question.fieldKey || this.buildFieldKey(question.questionText, index);

        const questionPayload = {
          id: question.id,
          pollFormId: pollId,
          sectionId: section.id,
          questionText: question.questionText.trim(),
          fieldKey: question.fieldKey.trim(),
          questionType: question.questionType,
          isRequired: question.isRequired,
          sortOrder: question.sortOrder,
          configJson: this.buildConfigJson(question),
          dataSourceType: this.getQuestionDataSourceType(question),
          dataSourceField: this.getQuestionDataSourceField(question),
        };

        if (question.id > 0) {
          const response = await firstValueFrom(this.pollFormService.updateQuestion(questionPayload));
          this.assertSuccess(response);
        } else {
          const response = await firstValueFrom(this.pollFormService.addQuestion({
            pollFormId: questionPayload.pollFormId,
            sectionId: questionPayload.sectionId,
            questionText: questionPayload.questionText,
            fieldKey: questionPayload.fieldKey,
            questionType: questionPayload.questionType,
            isRequired: questionPayload.isRequired,
            sortOrder: questionPayload.sortOrder,
            configJson: questionPayload.configJson,
            dataSourceType: questionPayload.dataSourceType,
            dataSourceField: questionPayload.dataSourceField,
          }));
          this.assertSuccess(response);
          question.id = this.readId(this.unwrap<any>(response, {}));
          if (question.id <= 0) {
            throw new Error(`API không trả về ID cho câu hỏi ${index + 1}`);
          }
        }

        if (this.isChoiceType(question.questionType)) {
          this.reorderOptions(question);
          for (const option of question.options) {
            option.pollQuestionId = question.id;
            const optionPayload = {
              id: option.id,
              pollQuestionId: question.id,
              optionText: option.optionText.trim(),
              optionValue: option.optionValue.trim(),
              sortOrder: option.sortOrder,
            };

            if (option.id > 0) {
              const response = await firstValueFrom(this.pollFormService.updateOption(optionPayload));
              this.assertSuccess(response);
            } else {
              const response = await firstValueFrom(this.pollFormService.addOption({
                pollQuestionId: optionPayload.pollQuestionId,
                optionText: optionPayload.optionText,
                optionValue: optionPayload.optionValue,
                sortOrder: optionPayload.sortOrder,
              }));
              this.assertSuccess(response);
              option.id = this.readId(this.unwrap<any>(response, {}));
            }
          }
        }
      }

      for (const section of this.sections) {
        this.syncSectionRuleJson(section);
        const sectionPayload = {
          title: section.title.trim(),
          description: section.description.trim(),
          sortOrder: section.sortOrder,
          showIfJson: this.cleanJsonText(section.showIfJson),
          branchingRulesJson: this.cleanJsonText(section.branchingRulesJson),
        };
        const response = await firstValueFrom(this.pollFormService.updateSection(section.id, sectionPayload));
        this.assertSuccess(response);
      }

      this.deletedQuestionIds = [];
      this.deletedOptionIds = [];
      this.deletedSectionIds = [];
      this.selectedPollId = pollId;
      await this.loadPolls(false);
      await this.loadPollDetail(pollId, true);
      this.notification.success(NOTIFICATION_TITLE.success, 'Lưu phiếu bình chọn thành công');
    } catch (error) {
      this.notifyError(error, 'Không lưu được phiếu bình chọn');
    } finally {
      this.isSaving = false;
    }
  }

  async uploadBackgroundImage(event: Event): Promise<void> {
    if (this.isUploadingBackground) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) return;
    if (!this.validateBackgroundFile(file)) return;

    this.isUploadingBackground = true;
    try {
      const response = await firstValueFrom(this.pollFormService.uploadBackgroundImage(file));
      this.assertSuccess(response);
      const data = this.unwrap<any>(response, {});
      const backgroundImagePath = this.readNullableString(data, 'backgroundImagePath', 'BackgroundImagePath');
      if (!backgroundImagePath) {
        throw new Error('API không trả về đường dẫn ảnh nền');
      }

      this.pollForm.patchValue({ backgroundImagePath });
      this.notification.success(NOTIFICATION_TITLE.success, 'Upload ảnh nền thành công');
    } catch (error) {
      this.notifyError(error, 'Không upload được ảnh nền');
    } finally {
      this.isUploadingBackground = false;
    }
  }

  clearBackgroundImage(): void {
    this.pollForm.patchValue({ backgroundImagePath: '' });
  }

  deleteCurrentPoll(): void {
    const pollId = Number(this.pollForm.get('id')?.value || 0);
    if (pollId <= 0) {
      this.newPoll();
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa phiếu "<strong>${this.currentPollTitle}</strong>" không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeletePoll(pollId),
    });
  }

  deletePollFromList(poll: PollFormSummary, event: MouseEvent): void {
    event.stopPropagation();
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa phiếu "<strong>${poll.title}</strong>" không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDeletePoll(poll.id),
    });
  }

  addSection(): void {
    this.sections.push(this.createSectionModel(this.sections.length + 1));
    this.selectedSectionIndex = this.sections.length - 1;
    this.reorderSections();
  }

  duplicateSection(index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    const source = this.sections[index];
    if (!source) return;

    const sourceQuestions = this.getQuestionsBySection(source);
    const usedFieldKeys = new Set(this.questions.map((question) => question.fieldKey.trim()).filter(Boolean));
    const copiedFieldKeys = new Map<string, string>();

    const duplicate = this.createSectionModel(index + 2, {
      title: `${source.title} (bản sao)`,
      description: source.description,
      showIfJson: source.showIfJson,
      branchingRulesJson: source.branchingRulesJson,
      showIfLogic: source.showIfLogic,
      showIfConditions: this.cloneConditions(source.showIfConditions),
      defaultNextSectionTarget: source.defaultNextSectionTarget,
    });

    const duplicateQuestions = sourceQuestions.map((question, questionIndex) => ({
      ...question,
      id: 0,
      sectionId: null,
      sectionClientId: duplicate.clientId,
      questionText: question.questionText,
      fieldKey: this.createCopiedFieldKey(question, questionIndex, usedFieldKeys, copiedFieldKeys),
      sortOrder: questionIndex + 1,
      options: question.options.map((option, optionIndex) => ({
        ...option,
        id: 0,
        pollQuestionId: null,
        sortOrder: optionIndex + 1,
      })),
    }));

    duplicate.branchingRules = source.branchingRules.map((rule) => ({
      logic: rule.logic,
      nextSectionTarget: rule.nextSectionTarget,
      conditions: this.cloneConditions(rule.conditions, copiedFieldKeys),
    }));
    this.syncSectionRuleJson(duplicate);

    this.sections.splice(index + 1, 0, duplicate);
    this.questions.push(...duplicateQuestions);
    this.selectedSectionIndex = index + 1;
    this.selectedQuestionIndex = duplicateQuestions.length ? this.questions.length - duplicateQuestions.length : 0;
    this.reorderSections();
    this.reorderQuestions();
    this.resetAnswers();
  }

  removeSection(index: number): void {
    if (this.sections.length === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu cần ít nhất một section');
      return;
    }

    const [section] = this.sections.splice(index, 1);
    if (!section) return;
    if (section.id > 0) {
      this.deletedSectionIds.push(section.id);
    }

    const removedQuestions = this.getQuestionsBySection(section);
    removedQuestions.forEach((question) => {
      if (question.id > 0) this.deletedQuestionIds.push(question.id);
      question.options
        .filter((option) => option.id > 0)
        .forEach((option) => this.deletedOptionIds.push(option.id));
    });
    this.questions = this.questions.filter((question) => question.sectionClientId !== section.clientId);
    this.clearRemovedSectionTargets(section.clientId);
    this.selectedSectionIndex = Math.max(0, Math.min(index, this.sections.length - 1));
    this.selectedQuestionIndex = 0;
    this.reorderSections();
    this.reorderQuestions();
    this.resetAnswers();
  }

  moveSection(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= this.sections.length) return;
    const [section] = this.sections.splice(index, 1);
    this.sections.splice(nextIndex, 0, section);
    this.selectedSectionIndex = nextIndex;
    this.reorderSections();
  }

  selectSection(index: number): void {
    this.selectedSectionIndex = index;
    const firstQuestion = this.currentSectionQuestions[0];
    this.selectedQuestionIndex = firstQuestion ? this.getQuestionIndex(firstQuestion) : 0;
  }

  addQuestion(type: PollQuestionType = 'SingleChoice'): void {
    const section = this.currentSection ?? this.sections[0];
    if (!section) return;
    this.questions.push(this.createQuestion(type, this.getQuestionsBySection(section).length + 1, section));
    this.selectedQuestionIndex = this.questions.length - 1;
    this.reorderQuestions();
    this.resetAnswers();
  }

  duplicateQuestion(index: number): void {
    const question = this.questions[index];
    const usedFieldKeys = new Set(this.questions.map((item) => item.fieldKey.trim()).filter(Boolean));
    const copiedFieldKeys = new Map<string, string>();
    const duplicate: PollQuestionModel = {
      ...question,
      id: 0,
      pollFormId: Number(this.pollForm.get('id')?.value || 0) || null,
      sectionId: question.sectionId,
      sectionClientId: question.sectionClientId,
      questionText: `${question.questionText} (bản sao)`,
      fieldKey: this.createCopiedFieldKey(question, index, usedFieldKeys, copiedFieldKeys),
      sortOrder: question.sortOrder + 1,
      options: question.options.map((option, optionIndex) => ({
        ...option,
        id: 0,
        pollQuestionId: null,
        sortOrder: optionIndex + 1,
      })),
    };

    this.questions.splice(index + 1, 0, duplicate);
    this.selectedQuestionIndex = index + 1;
    this.reorderQuestions();
    this.resetAnswers();
  }

  removeQuestion(index: number): void {
    if (this.questions.length === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu cần ít nhất một câu hỏi');
      return;
    }

    const [question] = this.questions.splice(index, 1);
    if (question?.id > 0) {
      this.deletedQuestionIds.push(question.id);
    }
    this.selectedQuestionIndex = Math.max(0, Math.min(index, this.questions.length - 1));
    this.reorderQuestions();
    this.resetAnswers();
  }

  moveQuestion(index: number, direction: -1 | 1): void {
    const question = this.questions[index];
    if (!question) return;
    const section = this.findSectionForQuestion(question);
    if (!section) return;
    const sectionQuestions = this.getQuestionsBySection(section);
    const localIndex = sectionQuestions.findIndex((item) => item === question);
    const nextLocalIndex = localIndex + direction;
    if (nextLocalIndex < 0 || nextLocalIndex >= sectionQuestions.length) return;
    const swapQuestion = sectionQuestions[nextLocalIndex];
    const currentOrder = question.sortOrder;
    question.sortOrder = swapQuestion.sortOrder;
    swapQuestion.sortOrder = currentOrder;
    this.selectedQuestionIndex = this.getQuestionIndex(question);
    this.reorderQuestions();
  }

  onQuestionTypeChange(question: PollQuestionModel): void {
    if (this.isChoiceType(question.questionType)) {
      if (question.options.length === 0) {
        question.options = [this.createOption(1), this.createOption(2)];
      }
    } else {
      question.options
        .filter((option) => option.id > 0)
        .forEach((option) => this.deletedOptionIds.push(option.id));
      question.options = [];
    }

    if (question.questionType === 'Rating' && !question.ratingMax) {
      question.ratingMax = 5;
    }
    this.resetAnswers();
  }

  addOption(question: PollQuestionModel): void {
    question.options.push(this.createOption(question.options.length + 1, question.id || null));
    this.reorderOptions(question);
  }

  removeOption(question: PollQuestionModel, optionIndex: number): void {
    const [option] = question.options.splice(optionIndex, 1);
    if (option?.id > 0) {
      this.deletedOptionIds.push(option.id);
    }
    if (question.options.length === 0) {
      question.options.push(this.createOption(1, question.id || null));
    }
    this.reorderOptions(question);
    this.resetAnswers();
  }

  moveOption(question: PollQuestionModel, index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= question.options.length) return;
    const [option] = question.options.splice(index, 1);
    question.options.splice(nextIndex, 0, option);
    this.reorderOptions(question);
  }

  ensureQuestionFieldKey(question: PollQuestionModel, index: number): void {
    if (!question.fieldKey.trim()) {
      question.fieldKey = this.buildFieldKey(question.questionText, index);
    }
  }

  syncOptionValue(option: PollQuestionOptionModel, index: number): void {
    if (!option.optionValue.trim()) {
      option.optionValue = String(index + 1);
    }
  }

  onQuestionEmployeeFieldChange(question: PollQuestionModel, fieldKey: string | null): void {
    const option = this.employeeFieldOptions.find((item) => item.fieldKey === fieldKey);
    if (!option) {
      this.clearQuestionEmployeeMapping(question);
      return;
    }

    question.dataSourceType = 'Employee';
    question.dataSourceField = option.fieldKey;
    question.dataSourceLabel = option.label;
    question.dataSourceValue = null;
    question.dataSourceDisplayValue = null;
    question.isAutoFilled = true;
    if (!question.questionText.trim()) {
      question.questionText = option.label;
    }

    question.questionType = option.suggestedQuestionType;
    this.onQuestionTypeChange(question);
  }

  clearQuestionEmployeeMapping(question: PollQuestionModel): void {
    question.dataSourceType = '';
    question.dataSourceField = '';
    question.dataSourceLabel = '';
    question.dataSourceValue = null;
    question.dataSourceDisplayValue = null;
    question.isAutoFilled = false;
  }

  isEmployeeMappedQuestion(question: PollQuestionModel): boolean {
    return question.dataSourceType === 'Employee' && !!question.dataSourceField.trim();
  }

  getEmployeeFieldLabel(question: PollQuestionModel): string {
    const option = this.employeeFieldOptions.find((item) => item.fieldKey === question.dataSourceField);
    return option?.label || question.dataSourceLabel || question.dataSourceField;
  }

  isEmployeeFieldSensitive(question: PollQuestionModel): boolean {
    return this.employeeFieldOptions.find((item) => item.fieldKey === question.dataSourceField)?.isSensitive ?? false;
  }

  getEmployeeFieldDataType(question: PollQuestionModel): string {
    const option = this.employeeFieldOptions.find((item) => item.fieldKey === question.dataSourceField);
    if (option?.displayType === 'lookup') return 'Tên hiển thị';
    if (option?.dataType === 'date') return 'Ngày';
    if (option?.dataType === 'number') return 'Số';
    if (option?.dataType === 'bool') return 'Có/Không';
    return option ? 'Văn bản' : '';
  }

  getMappedQuestionValue(question: PollQuestionModel): string {
    const value = question.dataSourceDisplayValue || question.dataSourceValue;
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'API sẽ tự lấy theo nhân viên đăng nhập khi gửi';
    }
    if (this.isEmployeeMappedDateQuestion(question)) {
      return this.formatDateOnly(value);
    }
    return String(value);
  }

  private isEmployeeMappedDateQuestion(question: PollQuestionModel): boolean {
    if (!this.isEmployeeMappedQuestion(question)) return false;
    if (question.questionType === 'Date') return true;

    const option = this.employeeFieldOptions.find((item) => item.fieldKey === question.dataSourceField);
    if (option?.dataType === 'date') return true;

    const key = `${question.dataSourceField} ${question.dataSourceLabel} ${question.questionText}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

    return key.includes('ngay') || key.includes('date') || key.includes('dob') || key.includes('birth') || key.includes('sinh');
  }

  private formatDateOnly(value: any): string {
    if (value instanceof Date) {
      return this.formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate()) ?? String(value);
    }

    const text = String(value ?? '').trim();
    if (!text) return '';

    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (isoMatch) {
      return this.formatDateParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])) ?? text;
    }

    const numericDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s.*)?$/);
    if (numericDateMatch) {
      const parts = this.resolveNumericDateParts(Number(numericDateMatch[1]), Number(numericDateMatch[2]), Number(numericDateMatch[3]));
      return parts ? this.formatDateParts(parts.year, parts.month, parts.day) ?? text : text;
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;

    return this.formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate()) ?? text;
  }

  private toApiDateValue(value: any): string | null {
    if (value instanceof Date) {
      return this.formatDateForApi(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }

    const text = String(value ?? '').trim();
    if (!text) return null;

    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (isoMatch) {
      return this.formatDateForApi(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const numericDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s.*)?$/);
    if (numericDateMatch) {
      const parts = this.resolveNumericDateParts(Number(numericDateMatch[1]), Number(numericDateMatch[2]), Number(numericDateMatch[3]));
      return parts ? this.formatDateForApi(parts.year, parts.month, parts.day) : null;
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return null;

    return this.formatDateForApi(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  private formatDateParts(year: number, month: number, day: number): string | null {
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return [
      String(day).padStart(2, '0'),
      String(month).padStart(2, '0'),
      String(year),
    ].join('/');
  }

  private formatDateForApi(year: number, month: number, day: number): string | null {
    if (!this.formatDateParts(year, month, day)) return null;
    return [
      String(year),
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0'),
    ].join('-');
  }

  private resolveNumericDateParts(first: number, second: number, year: number): { year: number; month: number; day: number } | null {
    const candidates = second > 12
      ? [{ year, month: first, day: second }]
      : first > 12
        ? [{ year, month: second, day: first }]
        : [
          { year, month: second, day: first },
          { year, month: first, day: second },
        ];

    return candidates.find((item) => this.formatDateParts(item.year, item.month, item.day)) ?? null;
  }

  getShowIfQuestionOptions(section: PollSectionModel): RuleQuestionOption[] {
    return this.getSectionOptionCache(section).showIfQuestionOptions;
  }

  getBranchQuestionOptions(section: PollSectionModel): RuleQuestionOption[] {
    return this.getSectionOptionCache(section).branchQuestionOptions;
  }

  getDefaultTargetOptions(section: PollSectionModel): SectionTargetOption[] {
    return this.getSectionOptionCache(section).defaultTargetOptions;
  }

  getBranchTargetOptions(section: PollSectionModel): SectionTargetOption[] {
    return this.getSectionOptionCache(section).branchTargetOptions;
  }

  addShowIfCondition(section: PollSectionModel): void {
    section.showIfConditions.push(this.createCondition(section, true));
    this.syncSectionRuleJson(section);
  }

  removeShowIfCondition(section: PollSectionModel, conditionIndex: number): void {
    section.showIfConditions.splice(conditionIndex, 1);
    this.syncSectionRuleJson(section);
  }

  addBranchRule(section: PollSectionModel): void {
    section.branchingRules.push({
      logic: 'and',
      conditions: [this.createCondition(section, false)],
      nextSectionTarget: this.getNextSectionTarget(section),
    });
    this.syncSectionRuleJson(section);
  }

  removeBranchRule(section: PollSectionModel, ruleIndex: number): void {
    section.branchingRules.splice(ruleIndex, 1);
    this.syncSectionRuleJson(section);
  }

  addBranchCondition(section: PollSectionModel, rule: SectionBranchRuleModel): void {
    rule.conditions.push(this.createCondition(section, false));
    this.syncSectionRuleJson(section);
  }

  removeBranchCondition(section: PollSectionModel, rule: SectionBranchRuleModel, conditionIndex: number): void {
    rule.conditions.splice(conditionIndex, 1);
    if (rule.conditions.length === 0) {
      rule.conditions.push(this.createCondition(section, false));
    }
    this.syncSectionRuleJson(section);
  }

  onConditionFieldChange(condition: SectionConditionModel): void {
    condition.value = '';
  }

  onConditionOperatorChange(condition: SectionConditionModel): void {
    if (!this.conditionNeedsValue(condition)) {
      condition.value = '';
    }
  }

  conditionNeedsValue(condition: SectionConditionModel): boolean {
    return condition.operator !== 'empty' && condition.operator !== 'notEmpty';
  }

  shouldUseOptionSelect(condition: SectionConditionModel): boolean {
    const question = this.findQuestionByFieldKey(condition.fieldKey);
    return !!question && this.isChoiceType(question.questionType) && (condition.operator === 'equals' || condition.operator === 'notEquals');
  }

  getConditionOptionChoices(condition: SectionConditionModel): PollQuestionOptionModel[] {
    return this.findQuestionByFieldKey(condition.fieldKey)?.options ?? [];
  }

  getConditionValuePlaceholder(condition: SectionConditionModel): string {
    if (condition.operator === 'in' || condition.operator === 'notIn') return 'Nhập nhiều giá trị, cách nhau bằng dấu phẩy';
    if (condition.operator === 'greaterThan' || condition.operator === 'greaterOrEqual' || condition.operator === 'lessThan' || condition.operator === 'lessOrEqual') return 'Nhập giá trị số';
    return 'Nhập giá trị so sánh';
  }

  async submitVote(): Promise<void> {
    if (this.isSubmitting) return;

    const pollId = Number(this.pollForm.get('id')?.value || 0);
    if (pollId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu phiếu trước khi gửi bình chọn');
      return;
    }
    if (this.previewSections.length === 0 || this.previewQuestions.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu chưa có section hoặc câu hỏi');
      return;
    }
    if (this.previewSections.some((section) => section.id <= 0) || this.previewQuestions.some((question) => question.id <= 0)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu phiếu trước khi gửi bình chọn');
      return;
    }

    const previewQuestions = this.previewQuestions;
    if (!this.validateAnswers(previewQuestions)) return;

    this.isSubmitting = true;
    try {
      const payload = {
        pollFormId: pollId,
        employeeId: this.appUserService.employeeID ?? null,
        answers: previewQuestions
          .filter((question) => !this.isEmployeeMappedQuestion(question))
          .map((question) => this.buildAnswerPayload(question)),
      };

      const response = await firstValueFrom(this.pollFormService.submitResponse(payload));
      this.assertSuccess(response);
      const savedResponse = this.normalizeResponse(this.unwrap<any>(response, {}));
      this.pollResponseId = savedResponse.id || this.pollResponseId;
      this.selectedResponse = savedResponse.id > 0 ? savedResponse : this.selectedResponse;
      this.isPollCompleted = true;
      this.notification.success(NOTIFICATION_TITLE.success, 'Gửi bình chọn thành công');
      await this.loadResults(pollId);
    } catch (error) {
      this.notifyError(error, 'Không gửi được bình chọn');
    } finally {
      this.isSubmitting = false;
    }
  }

  async refreshResults(): Promise<void> {
    const pollId = Number(this.pollForm.get('id')?.value || 0);
    if (pollId <= 0) return;
    await this.loadResults(pollId);
  }

  async exportResponsesExcel(includeIncomplete = false): Promise<void> {
    const pollId = Number(this.pollForm.get('id')?.value || this.selectedPollId || 0);
    if (pollId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu phiếu trước khi xuất Excel');
      return;
    }
    if (this.isExportingExcel) return;

    this.isExportingExcel = true;
    this.exportingExcelMode = includeIncomplete ? 'all' : 'completed';
    try {
      const blob = await firstValueFrom(this.pollFormService.exportResponsesExcel(pollId, includeIncomplete));
      if (!blob || blob.size === 0) {
        throw new Error('File Excel trả về đang rỗng');
      }
      this.downloadBlob(blob, this.buildExportFileName(includeIncomplete));
    } catch (error) {
      this.notifyError(error, 'Không xuất được file Excel');
    } finally {
      this.isExportingExcel = false;
      this.exportingExcelMode = null;
    }
  }

  async openResponseDetail(response: PollResponseModel): Promise<void> {
    this.selectedResponse = response;
    this.isResponseDetailVisible = true;
    this.isLoadingResponseDetail = true;

    try {
      const detailResponse = await firstValueFrom(this.pollFormService.getResponseDetail(response.id));
      this.assertSuccess(detailResponse);
      this.selectedResponse = this.normalizeResponse(this.unwrap<any>(detailResponse, response));
    } catch (error) {
      this.notifyError(error, 'Không tải được chi tiết phản hồi');
    } finally {
      this.isLoadingResponseDetail = false;
    }
  }

  closeResponseDetail(): void {
    this.isResponseDetailVisible = false;
  }

  answerKey(question: PollQuestionModel, index: number): string {
    return question.id > 0 ? String(question.id) : `new-${index}`;
  }

  toggleMultipleAnswer(question: PollQuestionModel, index: number, option: PollQuestionOptionModel, checked: boolean): void {
    const key = this.answerKey(question, index);
    const current = Array.isArray(this.answers[key]) ? [...this.answers[key]] : [];
    const value = option.optionValue;

    if (checked && !current.includes(value)) {
      current.push(value);
    }
    if (!checked) {
      const valueIndex = current.indexOf(value);
      if (valueIndex >= 0) current.splice(valueIndex, 1);
    }

    this.answers[key] = current;
  }

  isOptionChecked(question: PollQuestionModel, index: number, option: PollQuestionOptionModel): boolean {
    const value = this.answers[this.answerKey(question, index)];
    return Array.isArray(value) && value.includes(option.optionValue);
  }

  setRatingAnswer(question: PollQuestionModel, index: number, score: number): void {
    this.answers[this.answerKey(question, index)] = score;
  }

  isRatingSelected(question: PollQuestionModel, index: number, score: number): boolean {
    return Number(this.answers[this.answerKey(question, index)]) === score;
  }

  ratingScale(question: PollQuestionModel): number[] {
    const max = this.clampRating(question.ratingMax);
    const cached = this.ratingScaleCache.get(max);
    if (cached) return cached;
    const scale = Array.from({ length: max }, (_, index) => index + 1);
    this.ratingScaleCache.set(max, scale);
    return scale;
  }

  getQuestionTypeLabel(type: PollQuestionType): string {
    return this.questionTypes.find((item) => item.value === type)?.label ?? type;
  }

  isChoiceType(type: PollQuestionType): boolean {
    return type === 'SingleChoice' || type === 'MultipleChoice';
  }

  isSelectedPoll(poll: PollFormSummary): boolean {
    return poll.id === this.selectedPollId;
  }

  isSelectedQuestion(index: number): boolean {
    return this.selectedQuestionIndex === index;
  }

  getPollStatus(poll: PollFormSummary): PollStatusView {
    const now = Date.now();
    const start = this.getDateTime(poll.startDate);
    const end = this.getDateTime(poll.endDate);

    if (!start && !end) return { key: 'noLimit', label: 'Không giới hạn', color: 'default' };
    if (start && now < start) return { key: 'scheduled', label: 'Sắp mở', color: 'processing' };
    if (end && now > end) return { key: 'ended', label: 'Đã kết thúc', color: 'error' };
    return { key: 'active', label: 'Đang mở', color: 'success' };
  }

  getCurrentPollStatus(): PollStatusView {
    const poll = this.normalizePollSummary({
      id: Number(this.pollForm.get('id')?.value || 0),
      title: this.currentPollTitle,
      description: this.pollForm.get('description')?.value,
      startDate: this.pollForm.get('startDate')?.value,
      endDate: this.pollForm.get('endDate')?.value,
      isPublic: this.pollForm.get('isPublic')?.value,
    });
    return this.getPollStatus(poll);
  }

  isPollOpenForVote(): boolean {
    if (!this.pollForm.get('isPublic')?.value) return false;
    const status = this.getCurrentPollStatus().key;
    return status === 'active' || status === 'noLimit';
  }

  getPollAvailabilityText(): string {
    const status = this.getCurrentPollStatus();
    if (this.selectedPollId <= 0) return 'Lưu phiếu để bật gửi bình chọn.';
    if (!this.pollForm.get('isPublic')?.value) return 'Phiếu đang ở bản nháp. Xuất bản để nhân viên nhìn thấy và bình chọn.';
    if (status.key === 'scheduled') return 'Phiếu chưa đến thời gian mở bình chọn.';
    if (status.key === 'ended') return 'Phiếu đã hết thời gian bình chọn.';
    return 'Có thể gửi bình chọn.';
  }

  getStatisticPercent(option: PollStatisticOption, question: PollStatisticQuestion): number {
    if (!question.totalAnswers) return 0;
    return Math.round((option.count / question.totalAnswers) * 100);
  }

  getQuestionText(questionId: number): string {
    return this.findQuestionById(questionId)?.questionText ?? `Câu hỏi #${questionId}`;
  }

  getResponseEmployeeName(response: PollResponseModel): string {
    const directName = response.employeeName?.trim();
    if (directName) return directName;

    const mappedName = this.findEmployeeNameAnswer(response);
    if (mappedName) return mappedName;

    if (response.employeeCode?.trim()) return response.employeeCode.trim();
    return response.employeeId ? String(response.employeeId) : '-';
  }

  getResponseSectionGroups(response: PollResponseModel): PollResponseSectionGroup[] {
    const signature = this.getResponseSectionGroupSignature(response);
    const cached = this.responseSectionGroupCache.get(response);
    if (cached?.signature === signature) return cached.groups;

    const usedAnswers = new Set<PollResponseAnswerModel>();
    const groups = [...this.sections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => {
        const questionIds = new Set(this.getQuestionsBySection(section).map((question) => question.id));
        const answers = response.answers
          .filter((answer) => questionIds.has(answer.questionId))
          .sort((a, b) => this.compareResponseAnswers(a, b));
        answers.forEach((answer) => usedAnswers.add(answer));

        return {
          key: section.clientId || String(section.id),
          title: section.title || `Section ${section.sortOrder}`,
          answers,
        };
      })
      .filter((group) => group.answers.length > 0);

    const otherAnswers = response.answers
      .filter((answer) => !usedAnswers.has(answer))
      .sort((a, b) => this.compareResponseAnswers(a, b));

    if (otherAnswers.length > 0) {
      groups.push({
        key: 'other',
        title: 'Khác',
        answers: otherAnswers,
      });
    }

    this.responseSectionGroupCache.set(response, { signature, groups });
    return groups;
  }

  private getResponseSectionGroupSignature(response: PollResponseModel): string {
    const sectionSignature = this.sections
      .map((section) => `${section.clientId}:${section.id}:${section.sortOrder}:${section.title}`)
      .join('|');
    const questionSignature = this.questions
      .map((question) => `${question.id}:${question.sectionId}:${question.sectionClientId}:${question.sortOrder}`)
      .join('|');
    const answerSignature = response.answers
      .map((answer) => `${answer.id}:${answer.questionId}:${answer.answerText}:${answer.answerJson}:${answer.displayText}`)
      .join('|');
    return `${sectionSignature}::${questionSignature}::${answerSignature}`;
  }

  formatAnswer(answer: PollResponseAnswerModel): string {
    const question = this.findQuestionById(answer.questionId);
    if (answer.displayText && answer.displayText.trim()) {
      return question?.questionType === 'Date' ? this.formatDateOnly(answer.displayText) : answer.displayText;
    }

    if (answer.answerJson) {
      try {
        const parsed = JSON.parse(answer.answerJson) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => this.getOptionText(answer.questionId, String(item))).join(', ') || '-';
        }
        return JSON.stringify(parsed);
      } catch {
        return answer.answerJson;
      }
    }
    if (!answer.answerText) return '-';
    if (question?.questionType === 'Date') {
      return this.formatDateOnly(answer.answerText);
    }
    return this.getOptionText(answer.questionId, answer.answerText);
  }

  getOptionText(questionId: number, optionValue: string): string {
    const question = this.findQuestionById(questionId);
    const option = question?.options.find((item) => item.optionValue === optionValue);
    return option?.optionText ?? optionValue;
  }

  getQuestionsBySection(section: PollSectionModel): PollQuestionModel[] {
    const signature = this.getSectionQuestionsSignature(section);
    const cached = this.sectionQuestionCache.get(section);
    if (cached?.signature === signature) return cached.questions;

    const questions = this.questions
      .filter((question) => {
        if (section.id > 0 && question.sectionId === section.id) return true;
        return question.sectionClientId === section.clientId;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    this.sectionQuestionCache.set(section, { signature, questions });
    return questions;
  }

  getSectionQuestionCount(section: PollSectionModel): number {
    return this.getQuestionsBySection(section).length;
  }

  getQuestionIndex(question: PollQuestionModel): number {
    return this.questions.findIndex((item) => item === question);
  }

  getQuestionDisplayIndex(question: PollQuestionModel): number {
    const section = this.findSectionForQuestion(question);
    if (!section) return this.getQuestionIndex(question) + 1;
    return this.getQuestionsBySection(section).findIndex((item) => item === question) + 1;
  }

  private getSectionQuestionsSignature(section: PollSectionModel): string {
    return [
      section.clientId,
      section.id,
      this.questions
        .map((question) => `${question.sectionClientId}:${question.sectionId}:${question.id}:${question.sortOrder}`)
        .join('|'),
    ].join('::');
  }

  isSelectedSection(index: number): boolean {
    return this.selectedSectionIndex === index;
  }

  getPreviewButtonText(): string {
    if (this.isPollCompleted) return 'Đã hoàn thành';
    return 'Gửi bình chọn';
  }

  formatDateTime(value: string | null | undefined): string {
    const text = String(value ?? '').trim();
    if (!text) return '-';

    const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
    if (isoMatch) {
      const dateText = this.formatDateParts(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
      if (!dateText) return '-';
      if (!isoMatch[4] || !isoMatch[5]) return dateText;
      return `${dateText} ${String(Number(isoMatch[4])).padStart(2, '0')}:${String(Number(isoMatch[5])).padStart(2, '0')}`;
    }

    const numericDateMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[T\s]+(\d{1,2}):(\d{1,2}))?/);
    if (numericDateMatch) {
      const parts = this.resolveNumericDateParts(Number(numericDateMatch[1]), Number(numericDateMatch[2]), Number(numericDateMatch[3]));
      const dateText = parts ? this.formatDateParts(parts.year, parts.month, parts.day) : null;
      if (!dateText) return '-';
      if (!numericDateMatch[4] || !numericDateMatch[5]) return dateText;
      return `${dateText} ${String(Number(numericDateMatch[4])).padStart(2, '0')}:${String(Number(numericDateMatch[5])).padStart(2, '0')}`;
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return '-';
    const dateText = this.formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
    if (!dateText) return '-';
    return `${dateText} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  trackByPollId(_index: number, poll: PollFormSummary): number {
    return poll.id;
  }

  trackBySection(_index: number, section: PollSectionModel): string {
    return section.clientId;
  }

  trackByQuestion(_index: number, question: PollQuestionModel): string {
    return `${question.sectionClientId}-${question.id || 'new'}-${question.sortOrder}`;
  }

  trackByOption(_index: number, option: PollQuestionOptionModel): string {
    return `${option.id || 'new'}-${option.sortOrder}`;
  }

  trackByValue(_index: number, option: { value: string }): string {
    return option.value;
  }

  trackByEmployeeField(_index: number, field: PollEmployeeFieldOptionModel): string {
    return field.fieldKey;
  }

  trackByNumber(_index: number, value: number): number {
    return value;
  }

  trackByStatisticQuestion(_index: number, question: PollStatisticQuestion): number {
    return question.questionId;
  }

  trackByStatisticOption(_index: number, option: PollStatisticOption): string {
    return `${option.optionId || 'new'}-${option.optionValue}`;
  }

  trackByResponse(_index: number, response: PollResponseModel): number {
    return response.id;
  }

  trackByResponseSectionGroup(_index: number, group: PollResponseSectionGroup): string {
    return group.key;
  }

  trackByResponseAnswer(_index: number, answer: PollResponseAnswerModel): string {
    return `${answer.id || 'new'}-${answer.questionId}`;
  }

  private async loadPollDetail(id: number, loadRelated: boolean): Promise<void> {
    this.isLoadingDetail = true;
    try {
      const response = await firstValueFrom(this.pollFormService.getDetail(id));
      this.assertSuccess(response);
      const data = this.unwrap<any>(response, {});
      const summary = this.normalizePollSummary(data);
      this.selectedPollId = summary.id;
      this.pollForm.reset({
        id: summary.id,
        title: summary.title,
        description: summary.description,
        backgroundImagePath: summary.backgroundImagePath ?? '',
        titleColor: summary.titleColor,
        startDate: this.toDateTimeLocal(summary.startDate),
        endDate: this.toDateTimeLocal(summary.endDate),
        isPublic: summary.isPublic,
      });

      const rawSections = this.readArray(data, 'sections', 'Sections');
      this.sections = rawSections
        .map((item) => this.normalizeSection(item))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      this.sections.forEach((section) => this.hydrateSectionRules(section));

      const nestedQuestions = rawSections.flatMap((section) => {
        const normalizedSection = this.sections.find((item) => item.id === this.readId(section));
        return this.readArray(section, 'questions', 'Questions').map((question) =>
          this.normalizeQuestion(question, normalizedSection)
        );
      });

      const nestedQuestionIds = new Set(nestedQuestions.map((question) => question.id).filter((questionId) => questionId > 0));
      const fallbackQuestions = this.readArray(data, 'questions', 'Questions')
        .filter((question) => !nestedQuestionIds.has(this.readId(question)));

      if (this.sections.length === 0) {
        const fallbackSectionId = this.readNullableNumber(fallbackQuestions[0], 'sectionId', 'SectionId');
        this.sections = [
          this.createSectionModel(1, {
            id: fallbackSectionId ?? 0,
            pollFormId: summary.id,
            title: 'Nội dung bình chọn',
            description: '',
          }),
        ];
      }

      this.questions = [
        ...nestedQuestions,
        ...fallbackQuestions.map((item) => this.normalizeQuestion(item, this.sections[0])),
      ].sort((a, b) => {
        const sectionDiff = this.getSectionSortOrder(a) - this.getSectionSortOrder(b);
        return sectionDiff !== 0 ? sectionDiff : a.sortOrder - b.sortOrder;
      });

      if (this.questions.length === 0) {
        this.questions = [this.createQuestion('SingleChoice', 1, this.sections[0])];
      }

      this.deletedSectionIds = [];
      this.deletedQuestionIds = [];
      this.deletedOptionIds = [];
      this.selectedResponse = null;
      this.isResponseDetailVisible = false;
      this.selectedSectionIndex = 0;
      this.previewSectionIndex = 0;
      this.pollResponseId = null;
      this.isPollCompleted = false;
      this.selectedQuestionIndex = 0;
      this.reorderSections();
      this.reorderQuestions();
      this.resetAnswers();

      if (loadRelated) {
        await this.loadResults(summary.id);
      }
    } catch (error) {
      this.notifyError(error, 'Không tải được chi tiết phiếu bình chọn');
    } finally {
      this.isLoadingDetail = false;
    }
  }

  private async loadResults(pollId: number): Promise<void> {
    this.isLoadingResults = true;
    try {
      const [statisticsResponse, responsesResponse] = await Promise.all([
        firstValueFrom(this.pollFormService.getStatistics(pollId)),
        firstValueFrom(this.pollFormService.getResponses(pollId, this.responseKeyword)),
      ]);
      this.assertSuccess(statisticsResponse);
      this.assertSuccess(responsesResponse);

      this.statistics = this.normalizeStatistics(this.unwrap<any>(statisticsResponse, null));
      const responseData = this.unwrap<any[]>(responsesResponse, []);
      this.responses = responseData.map((item) => this.normalizeResponse(item));
    } catch (error) {
      this.statistics = null;
      this.responses = [];
      this.notifyError(error, 'Không tải được kết quả bình chọn');
    } finally {
      this.isLoadingResults = false;
    }
  }

  async searchResponses(): Promise<void> {
    if (this.selectedPollId <= 0) return;
    this.isLoadingResults = true;
    try {
      const response = await firstValueFrom(this.pollFormService.getResponses(this.selectedPollId, this.responseKeyword));
      this.assertSuccess(response);
      const responseData = this.unwrap<any[]>(response, []);
      this.responses = responseData.map((item) => this.normalizeResponse(item));
    } catch (error) {
      this.responses = [];
      this.notifyError(error, 'Không tìm kiếm được danh sách phản hồi');
    } finally {
      this.isLoadingResults = false;
    }
  }

  private async confirmDeletePoll(pollId: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.pollFormService.deletePollForm(pollId));
      this.assertSuccess(response);
      this.notification.success(NOTIFICATION_TITLE.success, 'Xóa phiếu bình chọn thành công');
      this.newPoll();
      await this.loadPolls(false);
    } catch (error) {
      this.notifyError(error, 'Không xóa được phiếu bình chọn');
    }
  }

  private findSectionForQuestion(question: PollQuestionModel): PollSectionModel | null {
    return (
      this.sections.find((section) => section.id > 0 && section.id === question.sectionId) ||
      this.sections.find((section) => section.clientId === question.sectionClientId) ||
      null
    );
  }

  private getSectionSortOrder(question: PollQuestionModel): number {
    return this.findSectionForQuestion(question)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
  }

  private buildAnswerPayload(question: PollQuestionModel): { questionId: number; answerText: string | null; answerJson: string | null } {
    const value = this.answers[this.answerKey(question, this.getQuestionIndex(question))];
    if (question.questionType === 'MultipleChoice') {
      return {
        questionId: question.id,
        answerText: null,
        answerJson: JSON.stringify(Array.isArray(value) ? value : []),
      };
    }

    if (question.questionType === 'Date') {
      return {
        questionId: question.id,
        answerText: this.toApiDateValue(value),
        answerJson: null,
      };
    }

    return {
      questionId: question.id,
      answerText: value === null || value === undefined ? null : String(value),
      answerJson: null,
    };
  }

  private resolveNextPreviewSectionIndex(section: PollSectionModel, submittedIndex: number, result: SubmitSectionResultModel): number | null {
    if (result.nextSectionId && result.nextSectionId > 0) {
      const apiNextIndex = this.sections.findIndex((item) => item.id === result.nextSectionId);
      if (apiNextIndex >= 0) return apiNextIndex;
    }

    const localDecision = this.evaluateSectionBranchDecision(section);
    if (localDecision.hasDecision) {
      if (localDecision.nextSectionIndex !== null && localDecision.nextSectionIndex >= 0) {
        return localDecision.nextSectionIndex;
      }
      if (localDecision.nextSectionId && localDecision.nextSectionId > 0) {
        const ruleNextIndex = this.sections.findIndex((item) => item.id === localDecision.nextSectionId);
        if (ruleNextIndex >= 0) return ruleNextIndex;
      }
      if (localDecision.isExplicitEnd) return null;
    }

    const fallbackIndex = this.findNextVisiblePreviewSectionIndex(submittedIndex + 1);
    return fallbackIndex >= 0 ? fallbackIndex : null;
  }

  private evaluateSectionBranchDecision(section: PollSectionModel): BranchDecision {
    for (const rule of section.branchingRules) {
      if (rule.conditions.length === 0) continue;
      const matches = rule.conditions.map((condition) => this.evaluateSectionCondition(condition));
      const isMatched = rule.logic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
      if (isMatched) return this.branchDecisionFromTarget(rule.nextSectionTarget);
    }

    if (section.defaultNextSectionTarget !== this.autoNextTargetValue) {
      return this.branchDecisionFromTarget(section.defaultNextSectionTarget);
    }

    return this.emptyBranchDecision();
  }

  private branchDecisionFromTarget(target: string): BranchDecision {
    if (target === this.autoNextTargetValue) return this.emptyBranchDecision();
    if (target === this.endFormTargetValue) {
      return { hasDecision: true, nextSectionId: null, nextSectionIndex: null, isExplicitEnd: true };
    }

    const nextSectionIndex = this.sections.findIndex((section) => section.clientId === target);
    if (nextSectionIndex < 0) {
      return { hasDecision: true, nextSectionId: null, nextSectionIndex: null, isExplicitEnd: true };
    }

    return {
      hasDecision: true,
      nextSectionId: this.sections[nextSectionIndex].id || null,
      nextSectionIndex,
      isExplicitEnd: false,
    };
  }

  private emptyBranchDecision(): BranchDecision {
    return { hasDecision: false, nextSectionId: null, nextSectionIndex: null, isExplicitEnd: false };
  }

  private findNextVisiblePreviewSectionIndex(startIndex: number): number {
    for (let index = startIndex; index < this.sections.length; index += 1) {
      if (this.isPreviewSectionVisible(this.sections[index])) return index;
    }
    return -1;
  }

  private isPreviewSectionVisible(section: PollSectionModel): boolean {
    if (section.showIfConditions.length === 0) return true;
    const matches = section.showIfConditions.map((condition) => this.evaluateSectionCondition(condition));
    return section.showIfLogic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
  }

  private evaluateSectionCondition(condition: SectionConditionModel): boolean {
    const question = this.findQuestionByFieldKey(condition.fieldKey);
    const answerValue = question ? this.answers[this.answerKey(question, this.getQuestionIndex(question))] : undefined;

    if (condition.operator === 'empty') return this.isAnswerEmpty(answerValue);
    if (condition.operator === 'notEmpty') return !this.isAnswerEmpty(answerValue);

    if (Array.isArray(answerValue)) {
      const actualList = answerValue.map((item) => String(item));
      const expectedList = this.toConditionValueList(condition.value);
      if (condition.operator === 'contains' || condition.operator === 'equals') {
        return expectedList.some((item) => actualList.includes(item));
      }
      if (condition.operator === 'notContains' || condition.operator === 'notEquals') {
        return expectedList.every((item) => !actualList.includes(item));
      }
    }

    const actual = answerValue === null || answerValue === undefined ? '' : String(answerValue);
    const expected = String(condition.value ?? '');
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);

    switch (condition.operator) {
      case 'notEquals':
        return actual !== expected;
      case 'contains':
        return actual.includes(expected);
      case 'notContains':
        return !actual.includes(expected);
      case 'in':
        return this.toConditionValueList(expected).includes(actual);
      case 'notIn':
        return !this.toConditionValueList(expected).includes(actual);
      case 'greaterThan':
        return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber > expectedNumber;
      case 'greaterOrEqual':
        return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber >= expectedNumber;
      case 'lessThan':
        return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber < expectedNumber;
      case 'lessOrEqual':
        return Number.isFinite(actualNumber) && Number.isFinite(expectedNumber) && actualNumber <= expectedNumber;
      default:
        return actual === expected;
    }
  }

  private toConditionValueList(value: string): string[] {
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getRuleQuestionOptions(section: PollSectionModel, previousOnly: boolean): RuleQuestionOption[] {
    return previousOnly ? this.getShowIfQuestionOptions(section) : this.getBranchQuestionOptions(section);
  }

  private buildRuleQuestionOptions(section: PollSectionModel, previousOnly: boolean): RuleQuestionOption[] {
    const seen = new Set<string>();
    return this.questions
      .filter((question) => {
        const fieldKey = question.fieldKey.trim();
        if (!fieldKey || seen.has(fieldKey)) return false;
        const owner = this.findSectionForQuestion(question);
        if (!owner) return false;
        const allowed = previousOnly ? owner.sortOrder < section.sortOrder : owner.sortOrder <= section.sortOrder;
        if (!allowed) return false;
        seen.add(fieldKey);
        return true;
      })
      .sort((a, b) => {
        const sectionDiff = this.getSectionSortOrder(a) - this.getSectionSortOrder(b);
        return sectionDiff !== 0 ? sectionDiff : a.sortOrder - b.sortOrder;
      })
      .map((question) => ({
        value: question.fieldKey,
        label: `Câu ${this.getQuestionDisplayIndex(question)} - ${question.questionText || 'Câu hỏi chưa có nội dung'}`,
      }));
  }

  private buildSectionTargetOptions(section: PollSectionModel, includeAuto: boolean): SectionTargetOption[] {
    const options: SectionTargetOption[] = [];
    if (includeAuto) {
      options.push({ value: this.autoNextTargetValue, label: 'Tự động theo thứ tự' });
    }

    this.sections
      .filter((item) => item.clientId !== section.clientId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((item) => {
        options.push({
          value: item.clientId,
          label: `Section ${item.sortOrder}: ${item.title || 'Chưa đặt tên'}`,
        });
      });

    options.push({ value: this.endFormTargetValue, label: 'Kết thúc form' });
    return options;
  }

  private getSectionOptionCache(section: PollSectionModel): SectionOptionCache {
    const signature = this.getSectionOptionSignature(section);
    const cached = this.sectionOptionCache.get(section);
    if (cached?.signature === signature) return cached;

    const nextCache: SectionOptionCache = {
      signature,
      showIfQuestionOptions: this.buildRuleQuestionOptions(section, true),
      branchQuestionOptions: this.buildRuleQuestionOptions(section, false),
      defaultTargetOptions: this.buildSectionTargetOptions(section, true),
      branchTargetOptions: this.buildSectionTargetOptions(section, false),
    };
    this.sectionOptionCache.set(section, nextCache);
    return nextCache;
  }

  private getSectionOptionSignature(section: PollSectionModel): string {
    const sectionSignature = this.sections
      .map((item) => `${item.clientId}:${item.id}:${item.sortOrder}:${item.title}`)
      .join('|');
    const questionSignature = this.questions
      .map((item) => `${item.sectionClientId}:${item.sectionId}:${item.id}:${item.sortOrder}:${item.fieldKey}:${item.questionText}`)
      .join('|');
    return `${section.clientId}:${section.id}:${section.sortOrder}::${sectionSignature}::${questionSignature}`;
  }

  private getNextSectionTarget(section: PollSectionModel): string {
    return this.sections
      .filter((item) => item.sortOrder > section.sortOrder)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.clientId ?? this.endFormTargetValue;
  }

  private createCondition(section: PollSectionModel, previousOnly: boolean): SectionConditionModel {
    const firstQuestion = this.getRuleQuestionOptions(section, previousOnly)[0];
    return {
      fieldKey: firstQuestion?.value ?? '',
      operator: 'equals',
      value: '',
    };
  }

  private cloneConditions(conditions: SectionConditionModel[], fieldKeyMap?: Map<string, string>): SectionConditionModel[] {
    return conditions.map((condition) => ({
      fieldKey: fieldKeyMap?.get(condition.fieldKey) ?? condition.fieldKey,
      operator: this.normalizeConditionOperator(condition.operator),
      value: condition.value ?? '',
    }));
  }

  private findQuestionByFieldKey(fieldKey: string): PollQuestionModel | null {
    const normalized = fieldKey.trim();
    if (!normalized) return null;
    return this.questions.find((question) => question.fieldKey === normalized) ?? null;
  }

  private clearRemovedSectionTargets(sectionClientId: string): void {
    this.sections.forEach((section) => {
      if (section.defaultNextSectionTarget === sectionClientId) {
        section.defaultNextSectionTarget = this.autoNextTargetValue;
      }

      section.branchingRules.forEach((rule) => {
        if (rule.nextSectionTarget === sectionClientId) {
          rule.nextSectionTarget = this.endFormTargetValue;
        }
      });
      this.syncSectionRuleJson(section);
    });
  }

  private hydrateSectionRules(section: PollSectionModel): void {
    const showIf = this.parseShowIfJson(section.showIfJson);
    section.showIfLogic = showIf.logic;
    section.showIfConditions = showIf.conditions;

    const branching = this.parseBranchingRulesJson(section.branchingRulesJson);
    section.branchingRules = branching.rules;
    section.defaultNextSectionTarget = branching.defaultNextSectionTarget;
  }

  private parseShowIfJson(value: string | null): { logic: ConditionLogic; conditions: SectionConditionModel[] } {
    const parsed = this.parseConfig(value);
    return {
      logic: this.normalizeConditionLogic(this.readValue(parsed, 'logic', 'Logic')),
      conditions: this.parseConditions(parsed),
    };
  }

  private parseBranchingRulesJson(value: string | null): { rules: SectionBranchRuleModel[]; defaultNextSectionTarget: string } {
    const parsed = this.parseConfig(value);
    const rawRules = this.readArray(parsed, 'rules', 'Rules');
    const rules = rawRules.map((rule) => ({
      logic: this.normalizeConditionLogic(this.readValue(rule, 'logic', 'Logic')),
      conditions: this.parseConditions(rule),
      nextSectionTarget: this.sectionIdToTarget(this.readNullableNumber(rule, 'nextSectionId', 'NextSectionId')),
    }));

    const hasDefault = this.hasAnyKey(parsed, 'defaultNextSectionId', 'DefaultNextSectionId');
    return {
      rules,
      defaultNextSectionTarget: hasDefault
        ? this.sectionIdToTarget(this.readNullableNumber(parsed, 'defaultNextSectionId', 'DefaultNextSectionId'))
        : this.autoNextTargetValue,
    };
  }

  private parseConditions(source: any): SectionConditionModel[] {
    const rawConditions = this.readArray(source, 'conditions', 'Conditions');
    const conditions = rawConditions.length > 0 ? rawConditions : this.looksLikeCondition(source) ? [source] : [];

    return conditions.map((condition) => {
      const questionId = this.readNullableNumber(condition, 'questionId', 'QuestionId', 'questionID', 'QuestionID');
      const fieldKey =
        String(this.readValue(condition, 'fieldKey', 'FieldKey', 'questionKey', 'QuestionKey', 'key', 'Key') ?? '') ||
        this.questions.find((question) => question.id > 0 && question.id === questionId)?.fieldKey ||
        '';

      return {
        fieldKey,
        operator: this.normalizeConditionOperator(String(this.readValue(condition, 'operator', 'Operator') ?? 'equals')),
        value: this.conditionValueToText(this.readValue(condition, 'value', 'Value')),
      };
    });
  }

  private looksLikeCondition(value: any): boolean {
    return !!value && typeof value === 'object' && (
      this.hasAnyKey(value, 'fieldKey', 'FieldKey', 'questionKey', 'QuestionKey', 'key', 'Key', 'questionId', 'QuestionId', 'questionID', 'QuestionID')
    );
  }

  private conditionValueToText(value: any): string {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private normalizeConditionLogic(value: any): ConditionLogic {
    return String(value ?? '').toLowerCase() === 'or' ? 'or' : 'and';
  }

  private normalizeConditionOperator(value: any): ConditionOperator {
    const operator = String(value ?? '') as ConditionOperator;
    return this.conditionOperatorOptions.some((item) => item.value === operator) ? operator : 'equals';
  }

  private sectionIdToTarget(sectionId: number | null): string {
    if (!sectionId) return this.endFormTargetValue;
    return this.sections.find((section) => section.id === sectionId)?.clientId ?? this.endFormTargetValue;
  }

  private hasAnyKey(item: any, ...keys: string[]): boolean {
    if (!item || typeof item !== 'object') return false;
    return keys.some((key) => Object.prototype.hasOwnProperty.call(item, key));
  }

  private syncSectionRuleJson(section: PollSectionModel): void {
    section.showIfJson = this.buildShowIfJson(section);
    section.branchingRulesJson = this.buildBranchingRulesJson(section);
  }

  private buildShowIfJson(section: PollSectionModel): string | null {
    const conditions = section.showIfConditions
      .map((condition) => this.normalizeConditionForPayload(condition))
      .filter((condition): condition is Record<string, any> => !!condition);

    if (conditions.length === 0) return null;
    return JSON.stringify({
      logic: section.showIfLogic,
      conditions,
    });
  }

  private buildBranchingRulesJson(section: PollSectionModel): string | null {
    const rules = section.branchingRules
      .map((rule) => {
        const conditions = rule.conditions
          .map((condition) => this.normalizeConditionForPayload(condition))
          .filter((condition): condition is Record<string, any> => !!condition);

        if (conditions.length === 0) return null;
        return {
          logic: rule.logic,
          conditions,
          nextSectionId: this.targetToSectionId(rule.nextSectionTarget),
        };
      })
      .filter((rule): rule is BranchingRulePayload => !!rule);

    const hasDefault = section.defaultNextSectionTarget !== this.autoNextTargetValue;
    if (rules.length === 0 && !hasDefault) return null;

    const payload: Record<string, any> = { rules };
    if (hasDefault) {
      payload['defaultNextSectionId'] = this.targetToSectionId(section.defaultNextSectionTarget);
    }

    return JSON.stringify(payload);
  }

  private normalizeConditionForPayload(condition: SectionConditionModel): Record<string, any> | null {
    const fieldKey = condition.fieldKey.trim();
    if (!fieldKey) return null;

    const operator = this.normalizeConditionOperator(condition.operator);
    const payload: Record<string, any> = {
      fieldKey,
      operator,
    };

    if (this.conditionNeedsValue({ ...condition, operator })) {
      payload['value'] = this.parseConditionValue(condition.value, operator);
    }

    return payload;
  }

  private parseConditionValue(value: string, operator: ConditionOperator): string | number | string[] | number[] {
    const text = String(value ?? '').trim();
    if (operator === 'in' || operator === 'notIn') {
      return text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (operator === 'greaterThan' || operator === 'greaterOrEqual' || operator === 'lessThan' || operator === 'lessOrEqual') {
      const numeric = Number(text);
      return Number.isFinite(numeric) ? numeric : text;
    }

    return text;
  }

  private targetToSectionId(target: string): number | null {
    if (target === this.endFormTargetValue) return 0;
    if (target === this.autoNextTargetValue) return null;
    return this.sections.find((section) => section.clientId === target)?.id ?? 0;
  }

  private validateSectionRules(section: PollSectionModel, sectionIndex: number): boolean {
    if (!this.validateConditionList(section.showIfConditions, sectionIndex, 'Điều kiện hiển thị')) {
      return false;
    }

    if (section.defaultNextSectionTarget !== this.autoNextTargetValue && !this.isValidSectionTarget(section.defaultNextSectionTarget)) {
      this.selectedSectionIndex = sectionIndex;
      this.notification.warning(NOTIFICATION_TITLE.warning, `Section ${sectionIndex + 1} có section mặc định không hợp lệ`);
      return false;
    }

    for (let ruleIndex = 0; ruleIndex < section.branchingRules.length; ruleIndex += 1) {
      const rule = section.branchingRules[ruleIndex];
      if (!this.isValidSectionTarget(rule.nextSectionTarget) || rule.nextSectionTarget === this.autoNextTargetValue) {
        this.selectedSectionIndex = sectionIndex;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Luồng rẽ nhánh ${ruleIndex + 1} của section ${sectionIndex + 1} chưa chọn section đích`);
        return false;
      }

      if (rule.conditions.length === 0) {
        this.selectedSectionIndex = sectionIndex;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Luồng rẽ nhánh ${ruleIndex + 1} của section ${sectionIndex + 1} cần ít nhất một điều kiện`);
        return false;
      }

      if (!this.validateConditionList(rule.conditions, sectionIndex, `Luồng rẽ nhánh ${ruleIndex + 1}`)) {
        return false;
      }
    }

    this.syncSectionRuleJson(section);
    return true;
  }

  private validateConditionList(conditions: SectionConditionModel[], sectionIndex: number, label: string): boolean {
    for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex += 1) {
      const condition = conditions[conditionIndex];
      if (!condition.fieldKey.trim()) {
        this.selectedSectionIndex = sectionIndex;
        this.notification.warning(NOTIFICATION_TITLE.warning, `${label}: điều kiện ${conditionIndex + 1} chưa chọn câu hỏi`);
        return false;
      }

      if (this.conditionNeedsValue(condition) && !condition.value.trim()) {
        this.selectedSectionIndex = sectionIndex;
        this.notification.warning(NOTIFICATION_TITLE.warning, `${label}: điều kiện ${conditionIndex + 1} chưa nhập giá trị`);
        return false;
      }
    }

    return true;
  }

  private isValidSectionTarget(target: string): boolean {
    return target === this.endFormTargetValue || target === this.autoNextTargetValue || this.sections.some((section) => section.clientId === target);
  }

  private cleanJsonText(value: string | null): string | null {
    const text = String(value ?? '').trim();
    return text ? text : null;
  }

  private isJsonTextValid(value: string | null): boolean {
    const text = this.cleanJsonText(value);
    if (!text) return true;
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  private validatePollBeforeSave(): boolean {
    if (this.pollForm.invalid) {
      Object.values(this.pollForm.controls).forEach((control) => {
        control.markAsTouched();
        control.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tiêu đề phiếu bình chọn');
      return false;
    }

    const start = this.getDateTime(this.pollForm.get('startDate')?.value);
    const end = this.getDateTime(this.pollForm.get('endDate')?.value);
    if (start && end && end < start) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }

    if (this.questions.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu cần ít nhất một câu hỏi');
      return false;
    }

    if (this.sections.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu cần ít nhất một section');
      return false;
    }

    for (let index = 0; index < this.sections.length; index += 1) {
      const section = this.sections[index];
      section.title = section.title.trim() || `Section ${index + 1}`;
      section.description = section.description.trim();
      if (!this.validateSectionRules(section, index)) {
        return false;
      }
      if (this.getQuestionsBySection(section).length === 0) {
        this.selectedSectionIndex = index;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Section ${index + 1} cần ít nhất một câu hỏi`);
        return false;
      }
    }

    const fieldKeys = new Set<string>();
    for (let index = 0; index < this.questions.length; index += 1) {
      const question = this.questions[index];
      if (!this.findSectionForQuestion(question)) {
        this.selectedQuestionIndex = index;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Câu hỏi ${index + 1} chưa thuộc section nào`);
        return false;
      }
      question.questionText = question.questionText.trim();
      this.ensureUniqueQuestionFieldKey(question, index, fieldKeys);

      if (!question.questionText) {
        this.selectedQuestionIndex = index;
        this.notification.warning(NOTIFICATION_TITLE.warning, `Câu hỏi ${index + 1} chưa có nội dung`);
        return false;
      }

      if (this.isEmployeeMappedQuestion(question) && this.employeeFieldOptions.length > 0) {
        const matchedEmployeeField = this.employeeFieldOptions.find((option) => option.fieldKey === question.dataSourceField);
        if (!matchedEmployeeField) {
          this.selectedQuestionIndex = index;
          this.notification.warning(NOTIFICATION_TITLE.warning, `Câu hỏi ${index + 1} đang map Employee field không hợp lệ`);
          return false;
        }
      }

      if (this.isChoiceType(question.questionType)) {
        const validOptions = question.options.filter((option) => option.optionText.trim());
        if (validOptions.length < 2) {
          this.selectedQuestionIndex = index;
          this.notification.warning(NOTIFICATION_TITLE.warning, `Câu hỏi ${index + 1} cần ít nhất 2 lựa chọn`);
          return false;
        }
        question.options = validOptions.map((option, optionIndex) => ({
          ...option,
          optionText: option.optionText.trim(),
          optionValue: option.optionValue.trim() || String(optionIndex + 1),
          sortOrder: optionIndex + 1,
        }));
      }
    }

    return true;
  }

  private validateAnswers(questions: PollQuestionModel[]): boolean {
    if (!this.isPollOpenForVote()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, this.getPollAvailabilityText());
      return false;
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const globalIndex = this.getQuestionIndex(question);
      if (question.id <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng lưu phiếu trước khi gửi bình chọn');
        return false;
      }
      if (this.isEmployeeMappedQuestion(question)) continue;
      if (!question.isRequired) continue;
      const value = this.answers[this.answerKey(question, globalIndex)];
      if (this.isAnswerEmpty(value)) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng trả lời câu hỏi ${index + 1}`);
        return false;
      }
    }

    return true;
  }

  private createSectionModel(sortOrder: number, data: Partial<PollSectionModel> = {}): PollSectionModel {
    this.sectionSequence += 1;
    const id = Number(data.id ?? 0);
    return {
      id,
      clientId: data.clientId || `section-${id || `new-${Date.now()}-${this.sectionSequence}`}`,
      pollFormId: data.pollFormId ?? (Number(this.pollForm.get('id')?.value || 0) || null),
      title: data.title ?? `Section ${sortOrder}`,
      description: data.description ?? '',
      sortOrder,
      showIfJson: data.showIfJson ?? null,
      branchingRulesJson: data.branchingRulesJson ?? null,
      showIfLogic: data.showIfLogic ?? 'and',
      showIfConditions: this.cloneConditions(data.showIfConditions ?? []),
      branchingRules: (data.branchingRules ?? []).map((rule) => ({
        logic: rule.logic ?? 'and',
        nextSectionTarget: rule.nextSectionTarget ?? this.endFormTargetValue,
        conditions: this.cloneConditions(rule.conditions ?? []),
      })),
      defaultNextSectionTarget: data.defaultNextSectionTarget ?? this.autoNextTargetValue,
    };
  }

  private createQuestion(type: PollQuestionType, sortOrder: number, section: PollSectionModel): PollQuestionModel {
    const question: PollQuestionModel = {
      id: 0,
      pollFormId: Number(this.pollForm.get('id')?.value || 0) || null,
      sectionId: section.id || null,
      sectionClientId: section.clientId,
      questionText: '',
      fieldKey: `question_${sortOrder}`,
      questionType: type,
      isRequired: false,
      sortOrder,
      configJson: type === 'Rating' ? JSON.stringify({ max: 5 }) : null,
      ratingMax: 5,
      dataSourceType: '',
      dataSourceField: '',
      dataSourceLabel: '',
      dataSourceValue: null,
      dataSourceDisplayValue: null,
      isAutoFilled: false,
      options: [],
    };

    if (this.isChoiceType(type)) {
      question.options = [this.createOption(1), this.createOption(2)];
    }

    return question;
  }

  private createOption(sortOrder: number, questionId: number | null = null): PollQuestionOptionModel {
    return {
      id: 0,
      pollQuestionId: questionId,
      optionText: `Lựa chọn ${sortOrder}`,
      optionValue: String(sortOrder),
      sortOrder,
    };
  }

  private normalizePollSummary(item: any): PollFormSummary {
    return {
      id: this.readId(item),
      title: String(this.readValue(item, 'title', 'Title') ?? 'Phiếu không tên'),
      description: String(this.readValue(item, 'description', 'Description') ?? ''),
      backgroundImagePath: this.readNullableString(item, 'backgroundImagePath', 'BackgroundImagePath'),
      titleColor: this.normalizeHexColor(this.readNullableString(item, 'titleColor', 'TitleColor', 'formTitleColor', 'FormTitleColor'), '#111827'),
      startDate: this.readNullableString(item, 'startDate', 'StartDate'),
      endDate: this.readNullableString(item, 'endDate', 'EndDate'),
      isPublic: this.toBoolean(this.readValue(item, 'isPublic', 'IsPublic'), false),
      createdBy: String(this.readValue(item, 'createdBy', 'CreatedBy') ?? ''),
      createdDate: this.readNullableString(item, 'createdDate', 'CreatedDate'),
      updatedDate: this.readNullableString(item, 'updatedDate', 'UpdatedDate'),
    };
  }

  private normalizeSection(item: any): PollSectionModel {
    const sectionId = this.readId(item);
    return this.createSectionModel(this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0, {
      id: sectionId,
      clientId: `section-${sectionId || `new-${Date.now()}-${this.sectionSequence + 1}`}`,
      pollFormId: this.readNullableNumber(item, 'pollFormId', 'PollFormId'),
      title: String(this.readValue(item, 'title', 'Title') ?? 'Section'),
      description: String(this.readValue(item, 'description', 'Description') ?? ''),
      showIfJson: this.readNullableString(item, 'showIfJson', 'ShowIfJson'),
      branchingRulesJson: this.readNullableString(item, 'branchingRulesJson', 'BranchingRulesJson'),
    });
  }

  private normalizeQuestion(item: any, section?: PollSectionModel): PollQuestionModel {
    const type = this.normalizeQuestionType(String(this.readValue(item, 'questionType', 'QuestionType') ?? 'Text'));
    const configJson = this.readNullableString(item, 'configJson', 'ConfigJson');
    const config = this.parseConfig(configJson);
    const options = this.readArray(item, 'options', 'Options')
      .map((option) => this.normalizeOption(option))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const sectionId = this.readNullableNumber(item, 'sectionId', 'SectionId') ?? section?.id ?? null;
    const matchedSection =
      section ||
      this.sections.find((itemSection) => itemSection.id > 0 && itemSection.id === sectionId) ||
      this.sections[0];
    const dataSourceType = String(this.readValue(item, 'dataSourceType', 'DataSourceType') ?? '') === 'Employee' ? 'Employee' : '';
    const dataSourceField = String(this.readValue(item, 'dataSourceField', 'DataSourceField') ?? '');
    const dataSourceValue = this.readNullableString(item, 'dataSourceValue', 'DataSourceValue');
    const dataSourceDisplayValue = this.readNullableString(item, 'dataSourceDisplayValue', 'DataSourceDisplayValue');

    return {
      id: this.readId(item),
      pollFormId: this.readNullableNumber(item, 'pollFormId', 'PollFormId'),
      sectionId,
      sectionClientId: matchedSection?.clientId ?? '',
      questionText: String(this.readValue(item, 'questionText', 'QuestionText') ?? ''),
      fieldKey: String(this.readValue(item, 'fieldKey', 'FieldKey') ?? ''),
      questionType: type,
      isRequired: this.toBoolean(this.readValue(item, 'isRequired', 'IsRequired'), false),
      sortOrder: this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0,
      configJson,
      ratingMax: this.clampRating(Number(config['max'] ?? config['ratingMax'] ?? 5)),
      dataSourceType,
      dataSourceField,
      dataSourceLabel: String(this.readValue(item, 'dataSourceLabel', 'DataSourceLabel') ?? ''),
      dataSourceValue,
      dataSourceDisplayValue,
      isAutoFilled: this.toBoolean(this.readValue(item, 'isAutoFilled', 'IsAutoFilled'), dataSourceType === 'Employee' && !!dataSourceField),
      options,
    };
  }

  private normalizeEmployeeFieldOption(item: any): PollEmployeeFieldOptionModel {
    return {
      fieldKey: String(this.readValue(item, 'fieldKey', 'FieldKey') ?? ''),
      label: String(this.readValue(item, 'label', 'Label') ?? ''),
      dataType: String(this.readValue(item, 'dataType', 'DataType') ?? ''),
      suggestedQuestionType: this.normalizeQuestionType(String(this.readValue(item, 'suggestedQuestionType', 'SuggestedQuestionType') ?? 'Text')),
      displayType: String(this.readValue(item, 'displayType', 'DisplayType') ?? 'raw'),
      lookupSource: this.readNullableString(item, 'lookupSource', 'LookupSource'),
      isSensitive: this.toBoolean(this.readValue(item, 'isSensitive', 'IsSensitive'), false),
    };
  }

  private normalizeOption(item: any): PollQuestionOptionModel {
    return {
      id: this.readId(item),
      pollQuestionId: this.readNullableNumber(item, 'pollQuestionId', 'PollQuestionId', 'pollQuestionID', 'PollQuestionID'),
      optionText: String(this.readValue(item, 'optionText', 'OptionText') ?? ''),
      optionValue: String(this.readValue(item, 'optionValue', 'OptionValue') ?? ''),
      sortOrder: this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0,
    };
  }

  private normalizeStatistics(item: any): PollStatisticsModel | null {
    if (!item) return null;
    const questions = this.readArray(item, 'questions', 'Questions').map((question) => ({
      questionId: this.readQuestionId(question),
      questionText: String(this.readValue(question, 'questionText', 'QuestionText') ?? ''),
      questionType: this.normalizeQuestionType(String(this.readValue(question, 'questionType', 'QuestionType') ?? 'Text')),
      totalAnswers: Number(this.readValue(question, 'totalAnswers', 'TotalAnswers') ?? 0),
      options: this.readArray(question, 'options', 'Options').map((option) => ({
        optionId: Number(this.readValue(option, 'optionId', 'OptionId') ?? 0),
        optionText: String(this.readValue(option, 'optionText', 'OptionText') ?? ''),
        optionValue: String(this.readValue(option, 'optionValue', 'OptionValue') ?? ''),
        count: Number(this.readValue(option, 'count', 'Count') ?? 0),
      })),
    }));

    return {
      pollFormId: Number(this.readValue(item, 'pollFormId', 'PollFormId') ?? 0),
      pollFormTitle: String(this.readValue(item, 'pollFormTitle', 'PollFormTitle') ?? ''),
      totalResponses: Number(this.readValue(item, 'totalResponses', 'TotalResponses') ?? 0),
      questions,
    };
  }

  private normalizeResponse(item: any): PollResponseModel {
    const employee = this.readValue(item, 'employee', 'Employee');
    return {
      id: this.readId(item),
      pollFormId: Number(this.readValue(item, 'pollFormId', 'PollFormId') ?? 0),
      employeeId: this.readNullableNumber(item, 'employeeId', 'EmployeeId', 'EmployeeID'),
      employeeCode:
        this.readNullableString(item, 'employeeCode', 'EmployeeCode', 'employeeNo', 'EmployeeNo', 'maNhanVien', 'MaNhanVien', 'code', 'Code') ??
        this.readNullableString(employee, 'employeeCode', 'EmployeeCode', 'employeeNo', 'EmployeeNo', 'maNhanVien', 'MaNhanVien', 'code', 'Code'),
      employeeName:
        this.readNullableString(item, 'employeeName', 'EmployeeName', 'employeeFullName', 'EmployeeFullName', 'fullName', 'FullName', 'hoTen', 'HoTen', 'name', 'Name') ??
        this.readNullableString(employee, 'employeeName', 'EmployeeName', 'employeeFullName', 'EmployeeFullName', 'fullName', 'FullName', 'hoTen', 'HoTen', 'name', 'Name'),
      createdDate: this.readNullableString(item, 'createdDate', 'CreatedDate'),
      answers: this.readArray(item, 'answers', 'Answers').map((answer) => ({
        id: this.readId(answer),
        questionId: this.readQuestionId(answer),
        answerText: this.readNullableString(answer, 'answerText', 'AnswerText'),
        answerJson: this.readNullableString(answer, 'answerJson', 'AnswerJson'),
        displayText: this.readNullableString(answer, 'displayText', 'DisplayText'),
      })),
    };
  }

  private normalizeQuestionType(value: string): PollQuestionType {
    const matched = this.questionTypes.find((item) => item.value === value);
    return matched?.value ?? 'Text';
  }

  private normalizeSubmitSectionResult(item: any): SubmitSectionResultModel {
    return {
      pollResponseId: Number(this.readValue(item, 'pollResponseId', 'PollResponseId') ?? 0),
      pollFormId: Number(this.readValue(item, 'pollFormId', 'PollFormId') ?? 0),
      sectionId: Number(this.readValue(item, 'sectionId', 'SectionId') ?? 0),
      nextSectionId: this.readNullableNumber(item, 'nextSectionId', 'NextSectionId'),
      isCompleted: this.toBoolean(this.readValue(item, 'isCompleted', 'IsCompleted'), false),
      savedAnswerCount: Number(this.readValue(item, 'savedAnswerCount', 'SavedAnswerCount') ?? 0),
    };
  }

  private reorderSections(): void {
    this.sections.forEach((section, index) => {
      section.sortOrder = index + 1;
      section.title = section.title || `Section ${index + 1}`;
    });
  }

  private reorderQuestions(): void {
    this.sections.forEach((section) => {
      this.getQuestionsBySection(section).forEach((question, index) => {
        question.sectionClientId = section.clientId;
        question.sectionId = section.id || null;
        question.sortOrder = index + 1;
        if (!question.fieldKey) {
          question.fieldKey = this.buildFieldKey(question.questionText, index);
        }
      });
    });
  }

  private reorderOptions(question: PollQuestionModel): void {
    question.options.forEach((option, index) => {
      option.sortOrder = index + 1;
      option.optionValue = option.optionValue || String(index + 1);
    });
  }

  private resetAnswers(): void {
    this.answers = {};
    this.questions.forEach((question, index) => {
      this.answers[this.answerKey(question, index)] = this.isEmployeeMappedQuestion(question)
        ? question.dataSourceValue
        : question.questionType === 'MultipleChoice' ? [] : null;
    });
  }

  private buildConfigJson(question: PollQuestionModel): string | null {
    const config = this.parseConfig(question.configJson);
    if (question.questionType === 'Rating') {
      question.ratingMax = this.clampRating(question.ratingMax);
      config['max'] = question.ratingMax;
    } else {
      delete config['max'];
      delete config['ratingMax'];
    }

    if (this.isEmployeeMappedQuestion(question)) {
      config['readonly'] = true;
    } else {
      delete config['readonly'];
    }

    return Object.keys(config).length > 0 ? JSON.stringify(config) : null;
  }

  private getQuestionDataSourceType(question: PollQuestionModel): PollDataSourceType {
    return this.isEmployeeMappedQuestion(question) ? 'Employee' : '';
  }

  private getQuestionDataSourceField(question: PollQuestionModel): string {
    return this.isEmployeeMappedQuestion(question) ? question.dataSourceField.trim() : '';
  }

  private ensureUniqueQuestionFieldKey(question: PollQuestionModel, index: number, usedKeys: Set<string>): void {
    const fallback = this.buildFieldKey(question.questionText, index);
    const base = (question.fieldKey || fallback).trim() || fallback;
    let nextKey = base;
    let suffix = 2;

    while (usedKeys.has(nextKey)) {
      nextKey = `${base}_${suffix}`;
      suffix += 1;
    }

    question.fieldKey = nextKey;
    usedKeys.add(nextKey);
  }

  private createCopiedFieldKey(
    question: PollQuestionModel,
    questionIndex: number,
    usedKeys: Set<string>,
    copiedFieldKeys: Map<string, string>
  ): string {
    const sourceKey = question.fieldKey.trim() || this.buildFieldKey(question.questionText, questionIndex);
    const baseKey = `${sourceKey}_copy`;
    let nextKey = baseKey;
    let suffix = 2;

    while (usedKeys.has(nextKey)) {
      nextKey = `${baseKey}_${suffix}`;
      suffix += 1;
    }

    usedKeys.add(nextKey);
    copiedFieldKeys.set(sourceKey, nextKey);
    return nextKey;
  }

  private buildFieldKey(text: string, index: number): string {
    const value = text || `question_${index + 1}`;
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return normalized || `question_${index + 1}`;
  }

  private parseConfig(configJson: string | null): Record<string, any> {
    if (!configJson) return {};
    try {
      const parsed = JSON.parse(configJson) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, any> : {};
    } catch {
      return {};
    }
  }

  private clampRating(value: number): number {
    if (!Number.isFinite(value)) return 5;
    return Math.min(10, Math.max(2, Math.round(value)));
  }

  private isAnswerEmpty(value: any): boolean {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || String(value).trim() === '';
  }

  private toDateTimeLocal(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private toApiDate(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  }

  private validateBackgroundFile(file: File): boolean {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const maxSize = 10 * 1024 * 1024;

    if (!allowedExtensions.includes(extension)) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chỉ hỗ trợ ảnh .jpg, .jpeg, .png, .gif, .bmp, .webp');
      return false;
    }

    if (file.size > maxSize) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Ảnh nền không được vượt quá 10MB');
      return false;
    }

    return true;
  }

  private resolveBackgroundImageUrl(value: string | null | undefined): string {
    const path = String(value ?? '').trim().replace(/\\/g, '/').replace(/^\/\/192\.168\.1\.190\//i, '');
    if (!path) return '';
    if (/^(https?:|data:image\/|blob:)/i.test(path)) return path;
    if (/^\/?assets\//i.test(path)) return path;

    const host = environment.host.replace(/\/+$/, '');
    if (path.startsWith('/')) return `${host}${path}`;
    if (/^api\//i.test(path)) return `${host}/${path}`;

    return `${host}/api/share/${path.replace(/^\/+/, '')}`;
  }

  private escapeCssUrl(value: string): string {
    return value.replace(/["\\]/g, '\\$&');
  }

  private normalizeHexColor(value: unknown, fallback: string): string {
    const text = String(value ?? '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(text)) return text;
    const shortHex = text.match(/^#([0-9a-fA-F]{3})$/);
    if (shortHex) {
      return `#${shortHex[1].split('').map((char) => char + char).join('')}`;
    }
    return fallback;
  }

  private getDateTime(value: string | null | undefined): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  private buildExportFileName(includeIncomplete: boolean): string {
    const normalizedTitle = this.currentPollTitle
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
    const safeTitle =
      normalizedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'poll-responses';
    const mode = includeIncomplete ? 'all-responses' : 'completed-responses';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `${safeTitle}-${mode}-${timestamp}.xlsx`;
  }

  private unwrap<T>(response: any, fallback: T): T {
    const data = response && typeof response === 'object' && 'data' in response ? response.data : response;
    return data === undefined || data === null ? fallback : data as T;
  }

  private assertSuccess(response: any): void {
    if (response?.success === false || response?.status === 0) {
      throw new Error(response?.message || 'API trả về trạng thái lỗi');
    }
  }

  private notifyError(error: unknown, fallbackMessage: string): void {
    const responseError = error as { error?: { message?: string; Message?: string }; message?: string };
    const message =
      responseError?.error?.message ||
      responseError?.error?.Message ||
      responseError?.message ||
      fallbackMessage;
      this.notification.error(NOTIFICATION_TITLE.error, message);
  }

  private findEmployeeNameAnswer(response: PollResponseModel): string | null {
    const nameAnswer = response.answers.find((answer) => {
      const question = this.findQuestionById(answer.questionId);
      return question ? this.isEmployeeNameQuestion(question) : false;
    });
    const value = nameAnswer ? this.formatAnswer(nameAnswer).trim() : '';
    return value && value !== '-' ? value : null;
  }

  private isEmployeeNameQuestion(question: PollQuestionModel): boolean {
    if (!this.isEmployeeMappedQuestion(question) && !question.dataSourceField.trim()) return false;

    const sourceKey = this.normalizeEmployeeNameKey(question.dataSourceField || question.fieldKey);
    if (['fullname', 'hoten', 'employeename', 'name'].includes(sourceKey)) return true;

    const displayKey = this.normalizeEmployeeNameKey(`${question.dataSourceLabel} ${question.questionText}`);
    return displayKey.includes('hoten') || displayKey.includes('tennhanvien') || displayKey.includes('fullname') || displayKey.includes('employeename');
  }

  private normalizeEmployeeNameKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  private compareResponseAnswers(first: PollResponseAnswerModel, second: PollResponseAnswerModel): number {
    const firstQuestion = this.findQuestionById(first.questionId);
    const secondQuestion = this.findQuestionById(second.questionId);
    const firstSection = firstQuestion ? this.findSectionForQuestion(firstQuestion) : null;
    const secondSection = secondQuestion ? this.findSectionForQuestion(secondQuestion) : null;
    const sectionDiff = (firstSection?.sortOrder ?? Number.MAX_SAFE_INTEGER) - (secondSection?.sortOrder ?? Number.MAX_SAFE_INTEGER);
    if (sectionDiff !== 0) return sectionDiff;
    const questionDiff = (firstQuestion?.sortOrder ?? Number.MAX_SAFE_INTEGER) - (secondQuestion?.sortOrder ?? Number.MAX_SAFE_INTEGER);
    return questionDiff !== 0 ? questionDiff : first.questionId - second.questionId;
  }

  private findQuestionById(questionId: number): PollQuestionModel | null {
    return this.questions.find((question) => question.id === questionId) ?? null;
  }

  private readId(item: any): number {
    return Number(this.readValue(item, 'id', 'ID', 'Id') ?? 0);
  }

  private readQuestionId(item: any): number {
    return Number(this.readValue(
      item,
      'questionId',
      'QuestionId',
      'questionID',
      'QuestionID',
      'pollQuestionId',
      'PollQuestionId',
      'pollQuestionID',
      'PollQuestionID'
    ) ?? 0);
  }

  private readNullableNumber(item: any, ...keys: string[]): number | null {
    const value = this.readValue(item, ...keys);
    if (value === undefined || value === null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private readNullableString(item: any, ...keys: string[]): string | null {
    const value = this.readValue(item, ...keys);
    if (value === undefined || value === null || value === '') return null;
    return String(value);
  }

  private readArray(item: any, ...keys: string[]): any[] {
    const value = this.readValue(item, ...keys);
    return Array.isArray(value) ? value : [];
  }

  private readValue(item: any, ...keys: string[]): any {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined) return item[key];
    }
    return undefined;
  }

  private toBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return String(value).toLowerCase() === 'true';
  }
}
