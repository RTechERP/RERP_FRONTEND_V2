import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NOTIFICATION_TITLE } from '../../app.config';
import { AppUserService } from '../../services/app-user.service';
import { PollFormService } from '../poll-form/poll-form.service';

type PollQuestionType = 'Text' | 'SingleChoice' | 'MultipleChoice' | 'Rating' | 'Date' | 'Textarea';
type PollStatusKey = 'active' | 'scheduled' | 'ended' | 'noLimit';

interface PollFormSummary {
  id: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;
}

interface PollQuestionOptionModel {
  id: number;
  optionText: string;
  optionValue: string;
  sortOrder: number;
}

interface PollQuestionModel {
  id: number;
  sectionId: number | null;
  questionText: string;
  fieldKey: string;
  questionType: PollQuestionType;
  isRequired: boolean;
  sortOrder: number;
  configJson: string | null;
  ratingMax: number;
  dataSourceType: string;
  dataSourceField: string;
  dataSourceLabel: string;
  dataSourceValue: string | null;
  dataSourceDisplayValue: string | null;
  isAutoFilled: boolean;
  options: PollQuestionOptionModel[];
}

interface PollSectionModel {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
  showIfJson: string | null;
  branchingRulesJson: string | null;
  questions: PollQuestionModel[];
}

interface PollStatusView {
  key: PollStatusKey;
  label: string;
  color: string;
}

interface SubmitSectionResultModel {
  pollResponseId: number;
  nextSectionId: number | null;
  isCompleted: boolean;
}

interface PollResponseAnswerModel {
  questionId: number;
  answerText: string | null;
  answerJson: string | null;
  displayText: string | null;
}

interface PollResponseModel {
  id: number;
  isCompleted: boolean;
  answers: PollResponseAnswerModel[];
}

interface PollEmployeeResponseStatusModel {
  hasResponse: boolean;
  isCompleted: boolean;
  canEdit: boolean;
  isClosed: boolean;
  closedReason: string;
  response: PollResponseModel | null;
}

interface BranchDecision {
  hasDecision: boolean;
  nextSectionId: number | null;
  isExplicitEnd: boolean;
}

@Component({
  selector: 'app-poll-vote',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzEmptyModule,
    NzInputModule,
    NzNotificationModule,
    NzSpinModule,
    NzTagModule,
  ],
  templateUrl: './poll-vote.component.html',
  styleUrl: './poll-vote.component.css',
})
export class PollVoteComponent implements OnInit {
  @ViewChild('voteSection') private voteSection?: ElementRef<HTMLElement>;

  polls: PollFormSummary[] = [];
  selectedPoll: PollFormSummary | null = null;
  sections: PollSectionModel[] = [];
  answers: Record<string, any> = {};
  currentSectionIndex = 0;
  pollResponseId: number | null = null;
  isCompleted = false;
  isLoadingPolls = false;
  isLoadingDetail = false;
  isSubmitting = false;
  searchText = '';
  employeeResponseStatus: PollEmployeeResponseStatusModel | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pollFormService: PollFormService,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    void this.bootstrap();
  }

  get availablePolls(): PollFormSummary[] {
    const keyword = this.searchText.trim().toLowerCase();
    return this.polls
      .filter((poll) => this.isPollOpenForVote(poll))
      .filter((poll) => {
        if (!keyword) return true;
        return poll.title.toLowerCase().includes(keyword) || poll.description.toLowerCase().includes(keyword);
      });
  }

  get currentSection(): PollSectionModel | null {
    return this.sections[this.currentSectionIndex] ?? null;
  }

  get currentQuestions(): PollQuestionModel[] {
    return this.currentSection?.questions ?? [];
  }

  get visibleSectionIndexes(): number[] {
    return this.sections
      .map((_section, index) => index)
      .filter((index) => this.isSectionVisible(this.sections[index]));
  }

  get currentVisibleSectionPosition(): number {
    const position = this.visibleSectionIndexes.indexOf(this.currentSectionIndex);
    return position >= 0 ? position + 1 : 0;
  }

  get hasExistingResponse(): boolean {
    return !!this.employeeResponseStatus?.hasResponse && !!this.pollResponseId;
  }

  get canSubmit(): boolean {
    return (
      !!this.selectedPoll &&
      !!this.currentSection &&
      this.currentQuestions.length > 0 &&
      !this.isVoteLocked &&
      this.isPollOpenForVote(this.selectedPoll)
    );
  }

  get isVoteLocked(): boolean {
    const status = this.employeeResponseStatus;
    return !!status && (status.isClosed || !status.canEdit);
  }

  selectSection(index: number): void {
    if (index < 0 || index >= this.sections.length) return;
    if (!this.isSectionVisible(this.sections[index])) return;
    if (this.currentSectionIndex === index) return;
    this.currentSectionIndex = index;
    this.scrollCurrentSectionToTop();
  }

  goToPreviousSection(): void {
    const indexes = this.visibleSectionIndexes;
    const position = indexes.indexOf(this.currentSectionIndex);
    if (position <= 0) return;
    this.currentSectionIndex = indexes[position - 1];
    this.scrollCurrentSectionToTop();
  }

  goToNextSection(): void {
    const indexes = this.visibleSectionIndexes;
    const position = indexes.indexOf(this.currentSectionIndex);
    if (position < 0 || position >= indexes.length - 1) return;
    this.currentSectionIndex = indexes[position + 1];
    this.scrollCurrentSectionToTop();
  }

  async selectPoll(poll: PollFormSummary): Promise<void> {
    await this.router.navigate(['/poll-vote', poll.id]);
    await this.loadPollDetail(poll.id);
  }

  async backToList(): Promise<void> {
    await this.router.navigate(['/poll-vote']);
    this.selectedPoll = null;
    this.sections = [];
    this.answers = {};
    this.currentSectionIndex = 0;
    this.pollResponseId = null;
    this.isCompleted = false;
    this.employeeResponseStatus = null;
  }

  async refreshPolls(): Promise<void> {
    if (this.isLoadingPolls) return;

    const selectedPollId = this.selectedPoll?.id ?? 0;
    await this.loadPolls();

    if (!selectedPollId) return;

    const refreshedPoll = this.polls.find((poll) => poll.id === selectedPollId);
    if (refreshedPoll && this.isPollOpenForVote(refreshedPoll)) {
      this.selectedPoll = refreshedPoll;
      return;
    }

    await this.backToList();
  }

  async submitSection(): Promise<void> {
    if (!this.selectedPoll || !this.currentSection || this.isSubmitting) return;
    const submittedSection = this.currentSection;
    const submittedSectionIndex = this.currentSectionIndex;
    if (!this.canSubmit) {
      this.notification.warning(NOTIFICATION_TITLE.warning, this.getPollAvailabilityText(this.selectedPoll));
      return;
    }
    if (!this.validateAnswers()) return;

    this.isSubmitting = true;
    try {
      const payload = {
        pollResponseId: this.pollResponseId,
        sectionId: submittedSection.id,
        employeeId: this.appUserService.employeeID ?? null,
        answers: this.currentQuestions
          .filter((question) => !this.isEmployeeMappedQuestion(question))
          .map((question) => this.buildAnswerPayload(question)),
      };

      const response = await firstValueFrom(this.pollFormService.submitSection(this.selectedPoll.id, payload));
      this.assertSuccess(response);
      const result = this.normalizeSubmitResult(this.unwrap<any>(response, {}));
      this.pollResponseId = result.pollResponseId || this.pollResponseId;

      const nextSectionIndex = this.resolveNextSectionIndex(submittedSection, submittedSectionIndex, result);
      if (nextSectionIndex === null) {
        await this.loadMyResponse(this.selectedPoll.id);
        this.currentSectionIndex = submittedSectionIndex;
        this.notification.success(NOTIFICATION_TITLE.success, 'Gửi bình chọn thành công');
        return;
      }

      this.currentSectionIndex = nextSectionIndex;
      this.scrollCurrentSectionToTop();
      this.notification.success(NOTIFICATION_TITLE.success, 'Đã lưu câu trả lời');
    } catch (error) {
      this.notifyError(error, 'Không gửi được bình chọn');
    } finally {
      this.isSubmitting = false;
    }
  }

  answerKey(question: PollQuestionModel): string {
    return String(question.id);
  }

  toggleMultipleAnswer(question: PollQuestionModel, option: PollQuestionOptionModel, checked: boolean): void {
    const key = this.answerKey(question);
    const current = Array.isArray(this.answers[key]) ? [...this.answers[key]] : [];
    const value = option.optionValue;

    if (checked && !current.includes(value)) current.push(value);
    if (!checked) {
      const index = current.indexOf(value);
      if (index >= 0) current.splice(index, 1);
    }

    this.answers[key] = current;
  }

  isOptionChecked(question: PollQuestionModel, option: PollQuestionOptionModel): boolean {
    const value = this.answers[this.answerKey(question)];
    return Array.isArray(value) && value.includes(option.optionValue);
  }

  setRatingAnswer(question: PollQuestionModel, score: number): void {
    this.answers[this.answerKey(question)] = score;
  }

  isRatingSelected(question: PollQuestionModel, score: number): boolean {
    return Number(this.answers[this.answerKey(question)]) === score;
  }

  canClearAnswer(question: PollQuestionModel): boolean {
    if (question.isRequired || this.isEmployeeMappedQuestion(question)) return false;
    return !this.isAnswerEmpty(this.answers[this.answerKey(question)]);
  }

  clearAnswer(question: PollQuestionModel): void {
    if (question.isRequired || this.isEmployeeMappedQuestion(question) || this.isVoteLocked || this.isSubmitting) return;
    this.answers[this.answerKey(question)] = question.questionType === 'MultipleChoice' ? [] : null;
  }

  getClearAnswerText(question: PollQuestionModel): string {
    return question.questionType === 'Text' || question.questionType === 'Textarea' ? 'Xóa câu trả lời' : 'Xóa lựa chọn';
  }

  ratingScale(question: PollQuestionModel): number[] {
    const max = this.clampRating(question.ratingMax);
    return Array.from({ length: max }, (_, index) => index + 1);
  }

  isEmployeeMappedQuestion(question: PollQuestionModel): boolean {
    return question.dataSourceType === 'Employee' && !!question.dataSourceField;
  }

  getEmployeeMappingLabel(question: PollQuestionModel): string {
    return question.dataSourceLabel || question.dataSourceField || 'Thông tin nhân viên';
  }

  getMappedQuestionValue(question: PollQuestionModel): string {
    const value = question.dataSourceDisplayValue || question.dataSourceValue;
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'API sẽ tự lấy theo nhân viên đăng nhập khi gửi';
    }
    return String(value);
  }

  getPollStatus(poll: PollFormSummary): PollStatusView {
    if (!poll.isPublic) return { key: 'ended', label: 'Chưa xuất bản', color: 'default' };

    const now = Date.now();
    const start = this.getDateTime(poll.startDate);
    const end = this.getDateTime(poll.endDate);

    if (!start && !end) return { key: 'noLimit', label: 'Không giới hạn', color: 'default' };
    if (start && now < start) return { key: 'scheduled', label: 'Sắp mở', color: 'processing' };
    if (end && now > end) return { key: 'ended', label: 'Đã kết thúc', color: 'error' };
    return { key: 'active', label: 'Đang mở', color: 'success' };
  }

  getPollAvailabilityText(poll: PollFormSummary | null): string {
    if (!poll) return 'Chọn một phiếu để bắt đầu bình chọn.';
    if (!poll.isPublic) return 'Phiếu này chưa được xuất bản cho nhân viên bình chọn.';
    if (this.employeeResponseStatus?.isClosed) {
      return this.employeeResponseStatus.closedReason || 'Phiếu bình chọn đã đóng.';
    }
    if (this.employeeResponseStatus?.hasResponse && !this.employeeResponseStatus.canEdit) {
      return this.employeeResponseStatus.closedReason || 'Bạn đã gửi phản hồi và không thể chỉnh sửa.';
    }
    if (this.employeeResponseStatus?.hasResponse) {
      return 'Bạn đã có phản hồi trước đó. Có thể cập nhật lại khi phiếu còn mở.';
    }
    const status = this.getPollStatus(poll);
    if (status.key === 'scheduled') return 'Phiếu chưa đến thời gian mở bình chọn.';
    if (status.key === 'ended') return 'Phiếu đã hết thời gian bình chọn.';
    return 'Có thể gửi bình chọn.';
  }

  getSubmitButtonText(): string {
    if (this.isCompleted) return 'Đã hoàn thành';
    const section = this.currentSection;
    if (!section) return 'Gửi bình chọn';

    const localDecision = this.evaluateBranchDecision(section);
    if (localDecision.hasDecision) {
      return localDecision.isExplicitEnd ? 'Gửi bình chọn' : 'Lưu và tiếp tục';
    }

    return this.findNextVisibleSectionIndex(this.currentSectionIndex + 1) >= 0
      ? 'Lưu và tiếp tục'
      : 'Gửi bình chọn';
  }

  canGoPreviousSection(): boolean {
    return this.visibleSectionIndexes.indexOf(this.currentSectionIndex) > 0;
  }

  canGoNextSection(): boolean {
    const indexes = this.visibleSectionIndexes;
    const position = indexes.indexOf(this.currentSectionIndex);
    return position >= 0 && position < indexes.length - 1;
  }

  getSectionAnswerCount(section: PollSectionModel): number {
    return section.questions.filter((question) => !this.isAnswerEmpty(this.answers[this.answerKey(question)])).length;
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  trackByPollId(_index: number, poll: PollFormSummary): number {
    return poll.id;
  }

  trackByQuestion(_index: number, question: PollQuestionModel): number {
    return question.id;
  }

  trackByOption(_index: number, option: PollQuestionOptionModel): number {
    return option.id || option.sortOrder;
  }

  trackBySection(_index: number, section: PollSectionModel): number {
    return section.id || section.sortOrder;
  }

  private scrollCurrentSectionToTop(): void {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        this.voteSection?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      });
    });
  }

  private async bootstrap(): Promise<void> {
    await this.loadPolls();
    const routeId = Number(this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id') || 0);
    if (routeId > 0) {
      await this.loadPollDetail(routeId);
    }
  }

  private async loadPolls(): Promise<void> {
    this.isLoadingPolls = true;
    try {
      const response = await firstValueFrom(this.pollFormService.getAll());
      this.assertSuccess(response);
      const data = this.unwrap<any[]>(response, []);
      this.polls = data.map((item) => this.normalizePollSummary(item)).sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      this.notifyError(error, 'Không tải được danh sách phiếu bình chọn');
    } finally {
      this.isLoadingPolls = false;
    }
  }

  private async loadPollDetail(pollId: number): Promise<void> {
    this.isLoadingDetail = true;
    try {
      const response = await firstValueFrom(this.pollFormService.getDetail(pollId));
      this.assertSuccess(response);
      const data = this.unwrap<any>(response, {});
      this.selectedPoll = this.normalizePollSummary(data);
      if (!this.selectedPoll.isPublic) {
        this.selectedPoll = null;
        this.sections = [];
        this.answers = {};
        this.currentSectionIndex = 0;
        this.pollResponseId = null;
        this.isCompleted = false;
        this.employeeResponseStatus = null;
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu này đang là bản nháp và chưa mở cho nhân viên bình chọn');
        await this.router.navigate(['/poll-vote']);
        return;
      }
      this.sections = this.normalizeSections(data);
      this.pollResponseId = null;
      this.isCompleted = false;
      this.employeeResponseStatus = null;
      this.resetAnswers();
      await this.loadMyResponse(pollId);
      const firstVisibleIndex = this.findNextVisibleSectionIndex(0);
      this.currentSectionIndex = firstVisibleIndex >= 0 ? firstVisibleIndex : 0;
    } catch (error) {
      this.selectedPoll = null;
      this.sections = [];
      this.answers = {};
      this.currentSectionIndex = 0;
      this.pollResponseId = null;
      this.isCompleted = false;
      this.employeeResponseStatus = null;
      if ((error as { status?: number })?.status === 403) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiếu này chưa được xuất bản cho nhân viên bình chọn.');
        await this.router.navigate(['/poll-vote']);
      } else {
        this.notifyError(error, 'Không tải được chi tiết phiếu bình chọn');
      }
    } finally {
      this.isLoadingDetail = false;
    }
  }

  private async loadMyResponse(pollId: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.pollFormService.getMyResponse(pollId));
      this.assertSuccess(response);
      const status = this.normalizeEmployeeResponseStatus(this.unwrap<any>(response, null));
      this.employeeResponseStatus = status;
      this.applyExistingResponse(status.response);
    } catch {
      this.employeeResponseStatus = null;
    }
  }

  private normalizeSections(data: any): PollSectionModel[] {
    const rawSections = this.readArray(data, 'sections', 'Sections');
    const sections = rawSections
      .map((section) => this.normalizeSection(section))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (sections.length > 0) return sections;

    const fallbackQuestions = this.readArray(data, 'questions', 'Questions')
      .map((question) => this.normalizeQuestion(question))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return fallbackQuestions.length > 0
      ? [{
          id: this.readNullableNumber(fallbackQuestions[0], 'sectionId', 'SectionId') ?? 0,
          title: 'Nội dung bình chọn',
          description: '',
          sortOrder: 1,
          showIfJson: null,
          branchingRulesJson: null,
          questions: fallbackQuestions,
        }]
      : [];
  }

  private normalizeSection(item: any): PollSectionModel {
    return {
      id: this.readId(item),
      title: String(this.readValue(item, 'title', 'Title') ?? 'Section'),
      description: String(this.readValue(item, 'description', 'Description') ?? ''),
      sortOrder: this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0,
      showIfJson: this.readNullableString(item, 'showIfJson', 'ShowIfJson'),
      branchingRulesJson: this.readNullableString(item, 'branchingRulesJson', 'BranchingRulesJson'),
      questions: this.readArray(item, 'questions', 'Questions')
        .map((question) => this.normalizeQuestion(question))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  private normalizeQuestion(item: any): PollQuestionModel {
    const configJson = this.readNullableString(item, 'configJson', 'ConfigJson');
    const config = this.parseConfig(configJson);
    const dataSourceType = String(this.readValue(item, 'dataSourceType', 'DataSourceType') ?? '');
    return {
      id: this.readId(item),
      sectionId: this.readNullableNumber(item, 'sectionId', 'SectionId'),
      questionText: String(this.readValue(item, 'questionText', 'QuestionText') ?? ''),
      fieldKey: String(this.readValue(item, 'fieldKey', 'FieldKey') ?? ''),
      questionType: this.normalizeQuestionType(String(this.readValue(item, 'questionType', 'QuestionType') ?? 'Text')),
      isRequired: this.toBoolean(this.readValue(item, 'isRequired', 'IsRequired'), false),
      sortOrder: this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0,
      configJson,
      ratingMax: this.clampRating(Number(config['max'] ?? config['ratingMax'] ?? 5)),
      dataSourceType,
      dataSourceField: String(this.readValue(item, 'dataSourceField', 'DataSourceField') ?? ''),
      dataSourceLabel: String(this.readValue(item, 'dataSourceLabel', 'DataSourceLabel') ?? ''),
      dataSourceValue: this.readNullableString(item, 'dataSourceValue', 'DataSourceValue'),
      dataSourceDisplayValue: this.readNullableString(item, 'dataSourceDisplayValue', 'DataSourceDisplayValue'),
      isAutoFilled: this.toBoolean(this.readValue(item, 'isAutoFilled', 'IsAutoFilled'), dataSourceType === 'Employee'),
      options: this.readArray(item, 'options', 'Options')
        .map((option) => this.normalizeOption(option))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  private normalizeOption(item: any): PollQuestionOptionModel {
    return {
      id: this.readId(item),
      optionText: String(this.readValue(item, 'optionText', 'OptionText') ?? ''),
      optionValue: String(this.readValue(item, 'optionValue', 'OptionValue') ?? ''),
      sortOrder: this.readNullableNumber(item, 'sortOrder', 'SortOrder') ?? 0,
    };
  }

  private normalizePollSummary(item: any): PollFormSummary {
    return {
      id: this.readId(item),
      title: String(this.readValue(item, 'title', 'Title') ?? 'Phiếu không tên'),
      description: String(this.readValue(item, 'description', 'Description') ?? ''),
      startDate: this.readNullableString(item, 'startDate', 'StartDate'),
      endDate: this.readNullableString(item, 'endDate', 'EndDate'),
      isPublic: this.toBoolean(this.readValue(item, 'isPublic', 'IsPublic'), false),
    };
  }

  private normalizeSubmitResult(item: any): SubmitSectionResultModel {
    return {
      pollResponseId: Number(this.readValue(item, 'pollResponseId', 'PollResponseId') ?? 0),
      nextSectionId: this.readNullableNumber(item, 'nextSectionId', 'NextSectionId'),
      isCompleted: this.toBoolean(this.readValue(item, 'isCompleted', 'IsCompleted'), false),
    };
  }

  private normalizeEmployeeResponseStatus(item: any): PollEmployeeResponseStatusModel {
    const response = this.readValue(item, 'response', 'Response');
    return {
      hasResponse: this.toBoolean(this.readValue(item, 'hasResponse', 'HasResponse'), false),
      isCompleted: this.toBoolean(this.readValue(item, 'isCompleted', 'IsCompleted'), false),
      canEdit: this.toBoolean(this.readValue(item, 'canEdit', 'CanEdit'), true),
      isClosed: this.toBoolean(this.readValue(item, 'isClosed', 'IsClosed'), false),
      closedReason: String(this.readValue(item, 'closedReason', 'ClosedReason') ?? ''),
      response: response ? this.normalizePollResponse(response) : null,
    };
  }

  private normalizePollResponse(item: any): PollResponseModel {
    return {
      id: this.readId(item),
      isCompleted: this.toBoolean(this.readValue(item, 'isCompleted', 'IsCompleted'), false),
      answers: this.readArray(item, 'answers', 'Answers').map((answer) => ({
        questionId: this.readQuestionId(answer),
        answerText: this.readNullableString(answer, 'answerText', 'AnswerText'),
        answerJson: this.readNullableString(answer, 'answerJson', 'AnswerJson'),
        displayText: this.readNullableString(answer, 'displayText', 'DisplayText'),
      })),
    };
  }

  private validateAnswers(): boolean {
    for (let index = 0; index < this.currentQuestions.length; index += 1) {
      const question = this.currentQuestions[index];
      if (this.isEmployeeMappedQuestion(question) || !question.isRequired) continue;
      if (this.isAnswerEmpty(this.answers[this.answerKey(question)])) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng trả lời câu hỏi ${index + 1}`);
        return false;
      }
    }
    return true;
  }

  private buildAnswerPayload(question: PollQuestionModel): { questionId: number; answerText: string | null; answerJson: string | null } {
    const value = this.answers[this.answerKey(question)];
    if (question.questionType === 'MultipleChoice') {
      return {
        questionId: question.id,
        answerText: null,
        answerJson: JSON.stringify(Array.isArray(value) ? value : []),
      };
    }

    return {
      questionId: question.id,
      answerText: value === null || value === undefined ? null : String(value),
      answerJson: null,
    };
  }

  private resetAnswers(): void {
    this.answers = {};
    this.sections.flatMap((section) => section.questions).forEach((question) => {
      this.answers[this.answerKey(question)] = this.isEmployeeMappedQuestion(question)
        ? question.dataSourceValue
        : question.questionType === 'MultipleChoice' ? [] : null;
    });
  }

  private applyExistingResponse(response: PollResponseModel | null): void {
    if (!response) return;

    this.pollResponseId = response.id || this.pollResponseId;
    const questions = this.sections.flatMap((section) => section.questions);

    response.answers.forEach((answer) => {
      const question = questions.find((item) => item.id === answer.questionId);
      if (!question) return;
      if (this.isEmployeeMappedQuestion(question)) {
        question.dataSourceValue = question.dataSourceValue ?? answer.answerText;
        question.dataSourceDisplayValue = question.dataSourceDisplayValue ?? answer.displayText;
        return;
      }

      this.answers[this.answerKey(question)] = this.normalizeExistingAnswerValue(question, answer);
    });
  }

  private normalizeExistingAnswerValue(question: PollQuestionModel, answer: PollResponseAnswerModel): any {
    if (question.questionType === 'MultipleChoice') {
      return this.parseAnswerJsonArray(answer.answerJson);
    }

    const value = answer.answerText ?? this.answerJsonToText(answer.answerJson);
    if (question.questionType === 'Date') {
      return this.toDateInputValue(value);
    }

    if (question.questionType === 'Rating') {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : value;
    }

    return value;
  }

  private toDateInputValue(value: string | null): string | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseAnswerJsonArray(value: string | null): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }

  private answerJsonToText(value: string | null): string | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).join(', ');
      if (parsed === null || parsed === undefined) return null;
      return typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
    } catch {
      return value;
    }
  }

  private resolveNextSectionIndex(section: PollSectionModel, submittedIndex: number, result: SubmitSectionResultModel): number | null {
    if (result.nextSectionId && result.nextSectionId > 0) {
      const apiNextIndex = this.sections.findIndex((item) => item.id === result.nextSectionId);
      if (apiNextIndex >= 0) return apiNextIndex;
    }

    const localDecision = this.evaluateBranchDecision(section);
    if (localDecision.hasDecision) {
      if (localDecision.nextSectionId && localDecision.nextSectionId > 0) {
        const ruleNextIndex = this.sections.findIndex((item) => item.id === localDecision.nextSectionId);
        if (ruleNextIndex >= 0) return ruleNextIndex;
      }
      if (localDecision.isExplicitEnd) return null;
    }

    const fallbackIndex = this.findNextVisibleSectionIndex(submittedIndex + 1);
    return fallbackIndex >= 0 ? fallbackIndex : null;
  }

  private evaluateBranchDecision(section: PollSectionModel): BranchDecision {
    const parsed = this.parseConfig(section.branchingRulesJson);
    const rules = this.readArray(parsed, 'rules', 'Rules');

    for (const rule of rules) {
      const logic = String(this.readValue(rule, 'logic', 'Logic') ?? 'and').toLowerCase() === 'or' ? 'or' : 'and';
      const conditions = this.readConditionArray(rule);
      if (conditions.length === 0) continue;

      const matches = conditions.map((condition) => this.evaluateCondition(condition));
      const isMatched = logic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
      if (isMatched) {
        return this.branchDecisionFromSource(rule, 'nextSectionId', 'NextSectionId');
      }
    }

    if (this.hasAnyKey(parsed, 'defaultNextSectionId', 'DefaultNextSectionId')) {
      return this.branchDecisionFromSource(parsed, 'defaultNextSectionId', 'DefaultNextSectionId');
    }

    return { hasDecision: false, nextSectionId: null, isExplicitEnd: false };
  }

  private branchDecisionFromSource(source: any, ...keys: string[]): BranchDecision {
    if (!this.hasAnyKey(source, ...keys)) {
      return { hasDecision: false, nextSectionId: null, isExplicitEnd: false };
    }

    const nextSectionId = this.readNullableNumber(source, ...keys);
    return {
      hasDecision: true,
      nextSectionId: nextSectionId && nextSectionId > 0 ? nextSectionId : null,
      isExplicitEnd: !nextSectionId || nextSectionId <= 0,
    };
  }

  private findNextVisibleSectionIndex(startIndex: number): number {
    for (let index = startIndex; index < this.sections.length; index += 1) {
      if (this.isSectionVisible(this.sections[index])) return index;
    }
    return -1;
  }

  private isSectionVisible(section: PollSectionModel): boolean {
    const text = String(section.showIfJson ?? '').trim();
    if (!text) return true;

    try {
      const parsed = JSON.parse(text) as any;
      const logic = String(parsed?.logic ?? 'and').toLowerCase() === 'or' ? 'or' : 'and';
      const conditions = this.readConditionArray(parsed);
      if (conditions.length === 0) return true;
      const matches = conditions.map((condition) => this.evaluateCondition(condition));
      return logic === 'or' ? matches.some(Boolean) : matches.every(Boolean);
    } catch {
      return true;
    }
  }

  private evaluateCondition(condition: any): boolean {
    const fieldKey = String(condition?.fieldKey ?? condition?.questionKey ?? condition?.key ?? '');
    const questionId = Number(condition?.questionId ?? condition?.questionID ?? 0);
    const question = this.sections.flatMap((section) => section.questions).find((item) =>
      (!!fieldKey && item.fieldKey === fieldKey) || (questionId > 0 && item.id === questionId)
    );
    const answerValue = question ? this.answers[this.answerKey(question)] : undefined;
    const expectedValue = condition?.value;
    const operator = String(condition?.operator ?? 'equals');

    if (operator === 'empty') return this.isAnswerEmpty(answerValue);
    if (operator === 'notEmpty') return !this.isAnswerEmpty(answerValue);

    if (Array.isArray(answerValue)) {
      const expectedList = Array.isArray(expectedValue) ? expectedValue.map(String) : [String(expectedValue)];
      if (operator === 'contains' || operator === 'equals') return expectedList.some((item) => answerValue.map(String).includes(item));
      if (operator === 'notContains' || operator === 'notEquals') return expectedList.every((item) => !answerValue.map(String).includes(item));
    }

    const actual = answerValue === null || answerValue === undefined ? '' : String(answerValue);
    const expected = expectedValue === null || expectedValue === undefined ? '' : String(expectedValue);
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);

    switch (operator) {
      case 'notEquals':
        return actual !== expected;
      case 'contains':
        return actual.includes(expected);
      case 'notContains':
        return !actual.includes(expected);
      case 'in':
        return this.toStringList(expectedValue).includes(actual);
      case 'notIn':
        return !this.toStringList(expectedValue).includes(actual);
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

  private readConditionArray(source: any): any[] {
    const conditions = this.readArray(source, 'conditions', 'Conditions');
    if (conditions.length > 0) return conditions;
    return this.looksLikeCondition(source) ? [source] : [];
  }

  private toStringList(value: any): string[] {
    if (Array.isArray(value)) return value.map((item) => String(item));
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private isPollOpenForVote(poll: PollFormSummary): boolean {
    if (!poll.isPublic) return false;
    const status = this.getPollStatus(poll).key;
    return status === 'active' || status === 'noLimit';
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

  private normalizeQuestionType(value: string): PollQuestionType {
    const allowed: PollQuestionType[] = ['Text', 'SingleChoice', 'MultipleChoice', 'Rating', 'Date', 'Textarea'];
    return allowed.includes(value as PollQuestionType) ? value as PollQuestionType : 'Text';
  }

  private clampRating(value: number): number {
    if (!Number.isFinite(value)) return 5;
    return Math.min(10, Math.max(2, Math.round(value)));
  }

  private isAnswerEmpty(value: any): boolean {
    if (Array.isArray(value)) return value.length === 0;
    return value === null || value === undefined || String(value).trim() === '';
  }

  private getDateTime(value: string | null | undefined): number {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  private looksLikeCondition(value: any): boolean {
    return !!value && typeof value === 'object' && (
      this.hasAnyKey(value, 'fieldKey', 'FieldKey', 'questionKey', 'QuestionKey', 'key', 'Key', 'questionId', 'QuestionId', 'questionID', 'QuestionID')
    );
  }

  private hasAnyKey(item: any, ...keys: string[]): boolean {
    if (!item || typeof item !== 'object') return false;
    return keys.some((key) => Object.prototype.hasOwnProperty.call(item, key));
  }

  private toBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return String(value).toLowerCase() === 'true';
  }
}
