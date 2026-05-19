import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { forkJoin, interval, of, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { HRRecruitmentApplicationFormService } from './hr-recruitment-application-form.service';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-home-layout-candidate',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterLink,
        NzLayoutModule,
        NzButtonModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzInputNumberModule,
        NzRadioModule,
        NzCheckboxModule,
        NzIconModule,
        NzFormModule,
        NzGridModule,
        NzModalModule,
        NzSpinModule,
    ],
    templateUrl: './home-layout-candidate.component.html',
    styleUrl: './home-layout-candidate.component.css'
})
export class HomeLayoutCandidateComponent implements OnInit, OnDestroy, OnChanges {
    @Input() candidateId: number | null = null;
    @Input() isEmbedded = false;
    private destroy$ = new Subject<void>();
    private cancelLoad$ = new Subject<void>();
    data: any; // Raw API data
    form!: FormGroup;
    isLoading = false;
    isComplete = false;
    private isSaving = false;
    private sanitizeData(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;
        const newObj = { ...obj };
        Object.keys(newObj).forEach(key => {
            if (newObj[key] === '') newObj[key] = null;
        });
        return newObj;
    }

    private requiredTrim(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const v = control.value;
            if (v === null || v === undefined) return { required: true };
            if (typeof v === 'string' && v.trim().length === 0) return { required: true };
            return null;
        };
    }

    private formatDateForInput(date: any): string | null {
        if (!date) return null;
        // Handle common API formats safely (avoid timezone shifts)
        if (typeof date === 'string') {
            // ISO like 2026-03-12 or 2026-03-12T00:00:00...
            const iso = date.match(/^(\d{4}-\d{2}-\d{2})/);
            if (iso) return iso[1];
            // dd/MM/yyyy
            const vn = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (vn) return `${vn[3]}-${vn[2]}-${vn[1]}`;
        }

        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    }

    private normalizeGender(val: any): number | null {
        if (val === null || val === undefined || val === '') return null;
        // Numeric/string codes
        const n = Number(val);
        if (n === 1 || n === 2) return n;
        // Text fallback
        const s = String(val).trim().toLowerCase();
        if (s === 'nam' || s === 'male' || s === 'm') return 0;
        if (s === 'nữ' || s === 'nu' || s === 'female' || s === 'f') return 1;
        return null;
    }

    imagePreview: string | null = null;
    chucVuList: any[] = [];
    selectedFile: File | null = null;
    previewVisible = false;
    deletedList: any = { emergencyContacts: [], educations: [], foreignLanguages: [], otherCertificates: [], workExperiences: [] };
    createdDate: Date = new Date();

    qualificationLevelOptions = [
        { label: 'Yếu', value: 1 },
        { label: 'Trung bình', value: 2 },
        { label: 'Khá', value: 3 },
        { label: 'Giỏi', value: 4 },
        { label: 'Xuất sắc', value: 5 },
    ];

    languageLevelOptions = [
        { label: 'Tốt', value: 1 },
        { label: 'Khá', value: 2 },
        { label: 'Trung bình', value: 3 },
        { label: 'Yếu', value: 4 },
    ];

    formatterVND = (value: number | string): string => {
        if (!value) return '';
        return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    parserVND = (value: string): number => Number(value.replace(/\./g, ''));
    private readonly FIELD_LABELS: any = {
        FullName: 'Họ và tên',
        Gender: 'Giới tính',
        DateOfBirth: 'Ngày sinh',
        PlaceOfBirth: 'Nơi sinh',
        Ethnic: 'Dân tộc',
        Religion: 'Tôn giáo',
        PermanentResidence: 'Hộ khẩu thường trú',
        CurrentAddress: 'Nơi ở hiện nay',
        Tel: 'Điện thoại',
        Mobile: 'Di động',
        Email: 'Email',
        MaritalStatus: 'Tình trạng hôn nhân',
        Experiences: 'Kinh nghiệm phù hợp',
        ReasonApplication: 'Lý do ứng tuyển',
        AcceptedSalary: 'Mức lương tối thiểu mong muốn',
        DateOfStart: 'Ngày có thể bắt đầu nhận việc',
        PositionName: 'Vị trí ứng tuyển',
        WorkExperienceLevel: 'Mức kinh nghiệm làm việc',
        // FormArrays
        emergencyContacts: 'Người liên hệ khẩn cấp',
        educations: 'Trình độ học vấn/Bằng cấp',
        foreignLanguages: 'Trình độ ngoại ngữ',
        otherCertificates: 'Chứng chỉ khác',
        workExperiences: 'Kinh nghiệm làm việc',
        // Nested fields
        'emergencyContacts.FullName': 'Người liên hệ khẩn cấp: Họ tên',
        'emergencyContacts.Relation': 'Người liên hệ khẩn cấp: Quan hệ',
        'emergencyContacts.Tel': 'Người liên hệ khẩn cấp: Số điện thoại',
        'emergencyContacts.Address': 'Người liên hệ khẩn cấp: Địa chỉ',
        'educations.NameOfSchool': 'Trình độ học vấn: Tên trường',
        'educations.Major': 'Trình độ học vấn: Ngành học',
        'educations.GraduatedTime': 'Trình độ học vấn: Thời gian',
        'educations.QualificationLevel': 'Trình độ học vấn: Xếp loại',
        'RelativeInfo': 'Thông tin người thân tại công ty',
        'BHXH': 'Số sổ BHXH',
        'TaxCode': 'Mã số thuế',
    };

    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private hrService: HRRecruitmentApplicationFormService,
        private modal: NzModalService,
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
        if (!this.isEmbedded) {
            this.startTimers();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['candidateId'] && this.form) {
            // Luôn gọi loadInitialData khi candidateId thay đổi (ngay cả lần đầu)
            // nhưng ngOnInit cũng đã gọi rồi, nên ta chỉ gọi nếu không phải firstChange
            // để tránh gọi 2 lần lúc init.
            if (!changes['candidateId'].firstChange) {
                this.loadInitialData();
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.cancelLoad$.next();
        this.cancelLoad$.complete();
        if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.imagePreview);
        }
    }

    private startTimers() {
        // Chạy sau 30 giây và sau đó mỗi 30 giây
        timer(30000, 30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            console.log('--- Timer check ---');
            this.checkSession();
            this.autoSave();
        });
    }

    private checkSession() {
        if (this.isEmbedded) return;
        const expiresAt = localStorage.getItem('candidate_token_expires');
        if (expiresAt && new Date().getTime() > parseInt(expiresAt)) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiên đăng nhập đã hết hạn!');
            this.router.navigateByUrl('/login-candidate');
        }
    }

    private autoSave() {
        if (this.isEmbedded) return;
        if (this.isComplete) return; // Không auto-save nếu đã hoàn thành
        // Gỡ bỏ kiểm tra form.valid để lưu tiến độ tự động ngay cả khi chưa nhập đủ
        if (!this.isLoading && !this.isSaving) {
            console.log('Auto saving at:', new Date().toLocaleTimeString());
            this.saveFormData(false, true);
        } else {
            console.log('Skip auto save. Loading:', this.isLoading, 'Saving:', this.isSaving);
        }
    }

    loadInitialData() {
        this.cancelLoad$.next(); // Hủy các request đang chạy trước đó

        // Reset image preview and file state when loading new data (switching candidates)
        if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = null;
        this.selectedFile = null;

        this.isLoading = true;
        let hRRecruitmentCandidateID = 0;
        let candidateFromStorage = null;

        // Ưu tiên dùng candidateId từ @Input (HR xem), nếu không có mới dùng localStorage (Ứng viên tự xem)
        if (this.isEmbedded && this.candidateId && this.candidateId > 0) {
            hRRecruitmentCandidateID = this.candidateId;
        } else if (!this.isEmbedded) {
            const candidateStr = localStorage.getItem('CurrentUserCandidate');
            if (candidateStr) {
                try {
                    const candidate = JSON.parse(candidateStr);
                    hRRecruitmentCandidateID = candidate.ID || 0;
                    candidateFromStorage = candidate;
                } catch (e) {
                    console.error('Error parsing candidate from localStorage', e);
                }
            }
        }

        // Luôn gán ID vào form ngay lập tức để tránh mất ID khi save
        if (hRRecruitmentCandidateID > 0) {
            this.form.patchValue({ HRRecruitmentCandidateID: hRRecruitmentCandidateID });
        }

        const observables: any = {
            chucVu: this.hrService.getAllChucVu()
        };

        if (hRRecruitmentCandidateID > 0) {
            observables.candidateInfo = this.hrService.getCandidateInformation(hRRecruitmentCandidateID);
        }

        forkJoin(observables).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                // 1. Load Chuc Vu
                if (res.chucVu?.isSuccess || res.chucVu?.status === 1) {
                    this.chucVuList = res.chucVu.data || [];
                }

                // 2. Patch Form - Always call to handle defaults if no data exists
                const candidateData = res.candidateInfo?.data || {};
                this.data = candidateData;
                this.patchForm(candidateData, candidateFromStorage);
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.isLoading = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    }
                );
            }
        });
    }

    patchForm(data: any, candidateFromStorage?: any) {
        if (!data) data = {};

        // 1. Hard Reset delete list
        this.deletedList = {
            emergencyContacts: [],
            educations: [],
            foreignLanguages: [],
            otherCertificates: [],
            workExperiences: []
        };

        // 2. Lấy dữ liệu tờ khai chính
        const mainForm = (data.applicationForm && data.applicationForm.length > 0) ? data.applicationForm[0] : (data.HRRecruitmentApplicationForm || null);
        const masterID = mainForm ? (mainForm.ID || 0) : 0;

        // 3. Reset toàn bộ Form về trạng thái trống (bao gồm cả recruitmentInfo)
        this.form.reset();
        this.form.patchValue({
            ID: masterID,
            HRRecruitmentCandidateID: this.candidateId || 0,
            IsComplete: false,
            InjuriesOrSeriousIll: false,
            CurrentlyPregnant: false,
            IsPlanPregnant: false,
            WorkExperienceLevel: null,
            HasRelativeOrFriendInCompany: false,
            HasSocialInsurance: false,
            HasTaxCode: false
        }, { emitEvent: false });

        this.form.get('recruitmentInfo')?.reset({
            ID: 0,
            HRRecruitmentApplicationFormID: masterID,
            JobWebsites: false,
            Newspapers: false,
            SocialNetwork: false,
            Headhunters: false,
            Relatives: false,
            Others: false,
        }, { emitEvent: false });

        // 4. Patch dữ liệu tờ khai chính
        if (mainForm || candidateFromStorage) {
            if (mainForm?.CreatedDate) this.createdDate = new Date(mainForm.CreatedDate);
            this.isComplete = !this.isEmbedded && mainForm?.IsComplete === true;

            const position = mainForm?.PositionName || candidateFromStorage?.PositionName || null;
            this.form.patchValue({
                ...(mainForm || {}),
                FullName: mainForm?.FullName || candidateFromStorage?.FullName || null,
                Email: mainForm?.Email || candidateFromStorage?.Email || null,
                Tel: mainForm?.Tel || candidateFromStorage?.PhoneNumber || null,
                Mobile: mainForm?.Mobile || candidateFromStorage?.PhoneNumber || null,
                PositionName: position,
                DateOfBirth: this.formatDateForInput(mainForm?.DateOfBirth || candidateFromStorage?.DateOfBirth),
                IssuedOn: this.formatDateForInput(mainForm?.IssuedOn),
                DateSign: this.formatDateForInput(mainForm?.DateSign),
                DateOfStart: this.formatDateForInput(mainForm?.DateOfStart),
                Gender: this.normalizeGender(mainForm?.Gender ?? candidateFromStorage?.Gender),
            }, { emitEvent: false });

            if (this.candidateId || mainForm?.HRRecruitmentCandidateID) {
                this.form.get('PositionName')?.disable();
            } else {
                this.form.get('PositionName')?.enable();
            }

            // Ảnh chân dung
            if (mainForm?.FileName && !this.imagePreview) {
                const dateApply = mainForm.DateApply || mainForm.DateSign || mainForm.CreatedDate || new Date();
                const positionName = mainForm.PositionName || 'NoPosition';
                const yearStr = DateTime.fromJSDate(new Date(dateApply)).toFormat('yyyy');
                const subPath = `/${yearStr}/${positionName}`;

                this.hrService.downloadFile(mainForm.FileName, subPath).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
                    next: (blob) => {
                        this.imagePreview = URL.createObjectURL(blob);
                        this.cdr.markForCheck();
                    }
                });
            } else if (!mainForm?.FileName) {
                this.imagePreview = null;
            }
        }

        // 5. Xử lý các FormArray bằng setControl (Ép giao diện vẽ lại hoàn toàn)
        const getID = (item: any) => item.HRRecruitmentApplicationFormID || item.HRHiringCandidateInformationFormID || masterID;

        const arrayConfigs = [
            {
                key: 'emergencyContacts',
                data: data.emergencyContacts || data.EmergencyContacts,
                count: 2,
                groupFn: (item?: any) => this.fb.group({
                    ID: [item?.ID || 0],
                    HRRecruitmentApplicationFormID: [getID(item || {})],
                    FullName: [item?.FullName || null, [Validators.required, Validators.maxLength(250)]],
                    Relation: [item?.Relation || null, [Validators.required, Validators.maxLength(250)]],
                    Tel: [item?.Tel || null, [Validators.required, Validators.maxLength(150), Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/)]],
                    Address: [item?.Address || null, [Validators.required, Validators.maxLength(550)]]
                })
            },
            {
                key: 'educations',
                data: data.educations || data.Educations,
                count: 1,
                groupFn: (item?: any) => this.fb.group({
                    ID: [item?.ID || 0],
                    HRRecruitmentApplicationFormID: [getID(item || {})],
                    NameOfSchool: [item?.NameOfSchool || null, [this.requiredTrim(), Validators.maxLength(550)]],
                    Major: [item?.Major || null, [this.requiredTrim(), Validators.maxLength(550)]],
                    GraduatedTime: [item?.GraduatedTime || null, [this.requiredTrim(), Validators.maxLength(150)]],
                    QualificationLevel: [item?.QualificationLevel ? Number(item.QualificationLevel) : null, [Validators.required]]
                })
            },
            {
                key: 'foreignLanguages',
                data: data.foreignLanguageSkills || data.ForeignLanguageSkills || data.foreignLanguages,
                count: 1,
                groupFn: (item?: any) => this.fb.group({
                    ID: [item?.ID || 0],
                    HRRecruitmentApplicationFormID: [getID(item || {})],
                    ForeignLanguage: [item?.ForeignLanguage || null, [Validators.maxLength(550)]],
                    Listening: [item?.Listening || null],
                    Speaking: [item?.Speaking || null],
                    Reading: [item?.Reading || null],
                    Writing: [item?.Writing || null]
                })
            },
            {
                key: 'otherCertificates',
                data: data.otherCertificates || data.OtherCertificates,
                count: 1,
                groupFn: (item?: any) => this.fb.group({
                    ID: [item?.ID || 0],
                    HRRecruitmentApplicationFormID: [getID(item || {})],
                    DateOfIssue: [this.formatDateForInput(item?.DateOfIssue)],
                    Certificates: [item?.Certificates || null, [Validators.maxLength(550)]],
                    IssuedBy: [item?.IssuedBy || null, [Validators.maxLength(550)]],
                    QualificationLevel: [item?.QualificationLevel || null]
                })
            },
            {
                key: 'workExperiences',
                data: data.workingExperiences || data.WorkingExperiences || data.workExperiences || data.workExperiences,
                count: 1,
                groupFn: (item?: any) => this.fb.group({
                    ID: [item?.ID || 0],
                    HRRecruitmentApplicationFormID: [getID(item || {})],
                    CompanyName: [item?.CompanyName || null, [Validators.maxLength(250)]],
                    PositionName: [item?.PositionName || null, [Validators.maxLength(250)]],
                    DateStart: [this.formatDateForInput(item?.DateStart)],
                    DateEnd: [this.formatDateForInput(item?.DateEnd)],
                    Leader: [item?.Leader || null, [Validators.maxLength(550)]],
                    Mission: [item?.Mission || null],
                    Achievement: [item?.Achievement || null],
                    Salary: [item?.Salary || null],
                    WorkingStatus: [item?.WorkingStatus || null],
                    ReasonQuit: [item?.ReasonQuit || null]
                })
            }
        ];

        arrayConfigs.forEach(conf => {
            const newArray = this.fb.array<AbstractControl>([]);
            if (conf.data && conf.data.length > 0) {
                conf.data.forEach((item: any) => newArray.push(conf.groupFn(item) as AbstractControl));
            } else {
                for (let i = 0; i < (conf.count || 1); i++) newArray.push(conf.groupFn() as AbstractControl);
            }
            this.form.setControl(conf.key, newArray, { emitEvent: false });
        });

        // 6. Tuyển dụng qua kênh nào
        const recInfo = (data.recruitmentInfo && data.recruitmentInfo.length > 0) ? data.recruitmentInfo[0] : (data.RecruitmentInfo || null);
        if (recInfo) {
            this.form.get('recruitmentInfo')?.patchValue(recInfo, { emitEvent: false });
        }

        this.updateSurveyValidators();
        this.cdr.detectChanges();
    }

    updateSurveyValidators() {
        const surveyConfigs = [
            { flag: 'HasRelativeOrFriendInCompany', detail: 'RelativeInfo', max: 500 },
            { flag: 'HasSocialInsurance', detail: 'BHXH', max: 100 },
            { flag: 'HasTaxCode', detail: 'TaxCode', max: 100 }
        ];

        surveyConfigs.forEach(cfg => {
            const flagCtrl = this.form.get(cfg.flag);
            const detailCtrl = this.form.get(cfg.detail);
            if (flagCtrl && detailCtrl) {
                const validators = [Validators.maxLength(cfg.max)];
                if (flagCtrl.value === true) {
                    validators.push(Validators.required);
                }
                detailCtrl.setValidators(validators);
                detailCtrl.updateValueAndValidity({ emitEvent: false });
            }
        });
    }
    onPositionChange(name: string) {
        if (name) {
            this.form.patchValue({
                PositionName: name
            });
        } else {
            this.form.patchValue({
                PositionName: null
            });
        }
    }

    initForm() {
        this.form = this.fb.group({
            // === Bảng chính: HRRecruitmentApplicationForm ===
            ID: [0],
            HRRecruitmentCandidateID: [null],
            Image3x4: [null, [Validators.maxLength(550)]],
            Position: [null],
            PositionName: [null, [Validators.required]],
            FileName: [null],
            FullName: [null, [Validators.required, Validators.maxLength(250)]],
            Gender: [null, [Validators.required]],
            DateOfBirth: [null, [Validators.required]],
            PlaceOfBirth: [null, [Validators.required, Validators.maxLength(550)]],
            Ethnic: [null, [Validators.required, Validators.maxLength(250)]],
            Religion: [null, [Validators.required, Validators.maxLength(250)]],
            PermanentResidence: [null, [Validators.required, Validators.maxLength(550)]],
            CurrentAddress: [null, [Validators.required, Validators.maxLength(550)]],
            NumberCCCD: [null, [Validators.maxLength(150)]],
            IssuedOn: [null],
            IssuedBy: [null, [Validators.maxLength(550)]],
            Tel: [null, [Validators.required, Validators.maxLength(150), Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/)]],
            Mobile: [null, [Validators.required, Validators.maxLength(150), Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/)]],
            Email: [null, [Validators.required, Validators.email, Validators.maxLength(150)]],
            Hobbies: [null, [Validators.maxLength(550)]],
            Height: [null],
            Weight: [null],
            MaritalStatus: [null, [Validators.required]],
            InjuriesOrSeriousIll: [false, [Validators.required]],
            IfYesSpecify: [null, [Validators.maxLength(550)]],
            CurrentlyPregnant: [false],
            IsPlanPregnant: [false],
            WorkExperienceLevel: [null, [Validators.required]],
            OtherActivities: [null, [Validators.maxLength(550)]],
            Experiences: [null, [Validators.required, Validators.maxLength(550)]],
            ReasonApplication: [null, [Validators.required, Validators.maxLength(550)]],
            AcceptedSalary: [null, [Validators.required]],
            DateOfStart: [null, [Validators.required]],
            HasRelativeOrFriendInCompany: [false, [Validators.required]],
            RelativeInfo: [null, [Validators.maxLength(500)]],
            HasSocialInsurance: [false, [Validators.required]],
            BHXH: [null, [Validators.maxLength(100)]],
            HasTaxCode: [false, [Validators.required]],
            TaxCode: [null, [Validators.maxLength(100)]],
            IsSignature: [false],
            DateSign: [null],
            IsComplete: [false],
            // === Bảng phụ ===
            emergencyContacts: this.fb.array([], [Validators.minLength(2)]),
            educations: this.fb.array([]),
            foreignLanguages: this.fb.array([]),
            otherCertificates: this.fb.array([]),
            workExperiences: this.fb.array([]),
            recruitmentInfo: this.fb.group({
                ID: [0],
                HRRecruitmentApplicationFormID: [0],
                JobWebsites: [false],
                Newspapers: [false],
                SocialNetwork: [false],
                Headhunters: [false],
                Relatives: [false],
                Others: [false],
            }),
        });
    }

    // ===== Emergency Contacts =====
    get emergencyContacts(): FormArray { return this.form.get('emergencyContacts') as FormArray; }
    addEmergencyContact() {
        const masterID = this.form?.get('ID')?.value || 0;
        this.emergencyContacts.push(this.fb.group({
            ID: [0],
            HRRecruitmentApplicationFormID: [masterID],
            FullName: [null, [Validators.required, Validators.maxLength(250)]],
            Relation: [null, [Validators.required, Validators.maxLength(250)]],
            Tel: [null, [Validators.required, Validators.maxLength(150), Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/)]],
            Address: [null, [Validators.required, Validators.maxLength(550)]]
        }));
    }
    removeEmergencyContact(i: number) {
        if (this.emergencyContacts.length > 1) {
            const item = this.emergencyContacts.at(i).value;
            if (item.ID > 0) this.deletedList.emergencyContacts.push({ ...item, IsDeleted: true });
            this.emergencyContacts.removeAt(i);
        }
    }

    // ===== Education =====
    get educations(): FormArray { return this.form.get('educations') as FormArray; }
    addEducation() {
        const masterID = this.form?.get('ID')?.value || 0;
        this.educations.push(this.fb.group({
            ID: [0],
            HRRecruitmentApplicationFormID: [masterID],
            NameOfSchool: [null, [this.requiredTrim(), Validators.maxLength(550)]],
            Major: [null, [this.requiredTrim(), Validators.maxLength(550)]],
            GraduatedTime: [null, [this.requiredTrim(), Validators.maxLength(150)]],
            QualificationLevel: [null, [Validators.required]]
        }));
    }
    removeEducation(i: number) {
        if (this.educations.length > 1) {
            const item = this.educations.at(i).value;
            if (item.ID > 0) this.deletedList.educations.push({ ...item, IsDeleted: true });
            this.educations.removeAt(i);
        }
    }

    // ===== Foreign Languages =====
    get foreignLanguages(): FormArray { return this.form.get('foreignLanguages') as FormArray; }
    addForeignLanguage() {
        const masterID = this.form?.get('ID')?.value || 0;
        this.foreignLanguages.push(this.fb.group({
            ID: [0],
            HRRecruitmentApplicationFormID: [masterID],
            ForeignLanguage: [null, [Validators.maxLength(550)]],
            Listening: [null],
            Speaking: [null],
            Reading: [null],
            Writing: [null]
        }));
    }
    removeForeignLanguage(i: number) {
        if (this.foreignLanguages.length > 1) {
            const item = this.foreignLanguages.at(i).value;
            if (item.ID > 0) this.deletedList.foreignLanguages.push({ ...item, IsDeleted: true });
            this.foreignLanguages.removeAt(i);
        }
    }

    // ===== Other Certificates =====
    get otherCertificates(): FormArray { return this.form.get('otherCertificates') as FormArray; }
    addOtherCertificate() {
        const masterID = this.form?.get('ID')?.value || 0;
        this.otherCertificates.push(this.fb.group({
            ID: [0],
            HRRecruitmentApplicationFormID: [masterID],
            DateOfIssue: [null],
            Certificates: [null, [Validators.maxLength(550)]],
            IssuedBy: [null, [Validators.maxLength(550)]],
            QualificationLevel: [null]
        }));
    }
    removeOtherCertificate(i: number) {
        if (this.otherCertificates.length > 1) {
            const item = this.otherCertificates.at(i).value;
            if (item.ID > 0) this.deletedList.otherCertificates.push({ ...item, IsDeleted: true });
            this.otherCertificates.removeAt(i);
        }
    }

    // ===== Work Experiences =====
    get workExperiences(): FormArray { return this.form.get('workExperiences') as FormArray; }
    addWorkExperience() {
        const masterID = this.form?.get('ID')?.value || 0;
        this.workExperiences.push(this.fb.group({
            ID: [0],
            HRRecruitmentApplicationFormID: [masterID],
            CompanyName: [null, [Validators.maxLength(250)]],
            PositionName: [null, [Validators.maxLength(250)]],
            DateStart: [null],
            DateEnd: [null],
            Leader: [null, [Validators.maxLength(550)]],
            Mission: [null, [Validators.maxLength(550)]],
            Achievement: [null, [Validators.maxLength(550)]],
            Salary: [null],
            WorkingStatus: [null],
            ReasonQuit: [null, [Validators.maxLength(550)]],
        }));
    }
    removeWorkExperience(i: number) {
        if (this.workExperiences.length > 1) {
            const item = this.workExperiences.at(i).value;
            if (item.ID > 0) this.deletedList.workExperiences.push({ ...item, IsDeleted: true });
            this.workExperiences.removeAt(i);
        }
    }

    // ===== Image Upload =====
    onImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file ảnh!');
                return;
            }
            this.selectedFile = file;

            // Preview local
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
                this.cdr.markForCheck();
            };
            reader.readAsDataURL(file);
        }
    }

    clearImage(event: Event) {
        event.stopPropagation();
        this.imagePreview = null;
        this.selectedFile = null;
        this.form.patchValue({ Image3x4: null, FileName: null });
    }

    viewPreviewImage(event: Event) {
        event.stopPropagation();
        this.previewVisible = true;
    }

    private markControlsDirty(group: FormGroup | FormArray) {
        Object.keys(group.controls).forEach((key: any) => {
            const control = group.get(key);
            if (control instanceof FormGroup || control instanceof FormArray) {
                this.markControlsDirty(control);
            } else if (control) {
                control.markAsDirty();
                control.markAsTouched();
                control.updateValueAndValidity();
            }
        });
    }

    private collectInvalidControls(control: AbstractControl, path: string = ''): Array<{ path: string; errors: any; value: any }> {
        const invalids: Array<{ path: string; errors: any; value: any }> = [];
        if (control instanceof FormGroup) {
            Object.keys(control.controls).forEach(key => {
                const child = control.get(key);
                if (!child) return;
                const nextPath = path ? `${path}.${key}` : key;
                invalids.push(...this.collectInvalidControls(child, nextPath));
            });
            if (control.invalid && control.errors) {
                invalids.push({ path, errors: control.errors, value: control.value });
            }
        } else if (control instanceof FormArray) {
            control.controls.forEach((child, idx) => {
                const nextPath = `${path}[${idx}]`;
                invalids.push(...this.collectInvalidControls(child, nextPath));
            });
            if (control.invalid && control.errors) {
                invalids.push({ path, errors: control.errors, value: control.value });
            }
        } else {
            if (control.invalid) {
                invalids.push({ path, errors: control.errors, value: control.value });
            }
        }
        return invalids;
    }

    onSubmit() {
        this.markControlsDirty(this.form);

        if (this.form.invalid) {
            const invalids = this.collectInvalidControls(this.form);

            // Create list of unique human-readable field names
            const fieldNames = new Set<string>();
            invalids.forEach(x => {
                // Simplify path: emergencyContacts[0].FullName -> emergencyContacts.FullName
                const cleanPath = x.path.replace(/\[\d+\]/g, '');
                const label = this.FIELD_LABELS[cleanPath] || cleanPath;
                fieldNames.add(label);
            });

            const errorList = Array.from(fieldNames).map(name => `• ${name}`).join('\n');

            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Vui lòng kiểm tra lại các thông tin sau:\n${errorList}`,
                { nzStyle: { whiteSpace: 'pre-line' }, nzDuration: 5000 }
            );

            // Scroll to the first invalid element
            const firstInvalid = document.querySelector('.ant-form-item-has-error');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Cross-validation: If experience level > 1 (has experience), workExperiences must have at least 1 entry
        const level = this.form.get('WorkExperienceLevel')?.value;
        if (level > 1) {
            const activeExp = this.workExperiences.controls.filter(x => x.get('IsDeleted')?.value !== true);
            if (activeExp.length === 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Vì bạn đã có kinh nghiệm làm việc, vui lòng nhập ít nhất 1 thông tin Quá trình công tác (Mục III).',
                    { nzDuration: 5000 }
                );
                // Scroll to Section III
                const sectionIII = document.querySelector('.section-title.mt-4:nth-of-type(3)'); // Or use a specific ID if available
                if (sectionIII) sectionIII.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        // Ứng viên tự điền: hiện confirm trước khi lưu, set IsComplete = true
        if (!this.isEmbedded) {
            this.modal.confirm({
                nzTitle: NOTIFICATION_TITLE.warning,
                nzContent: 'Sau khi lưu, bạn sẽ <b>không thể chỉnh sửa</b> tờ khai này nữa. Bạn có chắc chắn muốn lưu?',
                nzOkText: 'Đồng ý lưu',
                nzOkDanger: true,
                nzCancelText: 'Hủy',
                nzOnOk: () => {
                    this.form.patchValue({ IsComplete: true });
                    this.doSave();
                }
            });
        } else {
            // HR: lưu trực tiếp, không set IsComplete
            this.doSave();
        }
    }

    private doSave() {
        this.isLoading = true;

        const formData = this.form.getRawValue();
        const mainForm = (this.data?.applicationForm && this.data.applicationForm.length > 0) ? this.data.applicationForm[0] : (this.data?.HRRecruitmentApplicationForm || {});

        const dateApply = mainForm?.DateApply || formData.DateSign || mainForm?.CreatedDate || new Date();
        const positionName = formData.PositionName || mainForm?.PositionName || 'NoPosition';
        const yearStr = DateTime.fromJSDate(new Date(dateApply)).toFormat('yyyy');
        const subPath = `/${yearStr}/${positionName}`;

        // Nếu có file mới được chọn, upload trước rồi mới save form
        if (this.selectedFile) {
            this.hrService.uploadFile(this.selectedFile, subPath).subscribe({
                next: (res) => {
                    if ((res.status === 1 || res.isSuccess) && res.data?.length > 0) {
                        const uploadedFile = res.data[0];
                        this.form.patchValue({
                            FileName: uploadedFile.SavedFileName
                        });
                        // Sau khi upload thành công thì save form
                        this.saveFormData();
                    } else {
                        this.isLoading = false;
                        this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Tải ảnh lên thất bại, không thể lưu tờ khai');
                    }
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.notification.create(
                        NOTIFICATION_TYPE_MAP[err.status] || 'error',
                        NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                        err?.error?.message || `${err.error}\n${err.message}`,
                        {
                            nzStyle: { whiteSpace: 'pre-line' }
                        }
                    );
                }
            });
        } else {
            // Nếu không có file mới (giữ ảnh cũ hoặc không có ảnh), save form luôn
            this.saveFormData();
        }
    }

    private saveFormData(isSilent: boolean = false, isAuto: boolean = false) {
        this.isSaving = true;
        const formValue = this.form.value;

        // Tách các trường của bảng chính và các bảng phụ theo cấu trúc HRRecruitmentApplicationFullDTO
        const {
            emergencyContacts,
            educations,
            foreignLanguages,
            otherCertificates,
            workExperiences,
            recruitmentInfo,
            ...mainFormFields
        } = formValue;

        const payload = {
            HRRecruitmentApplicationForm: this.sanitizeData(mainFormFields),
            WorkingExperiences: [
                ...workExperiences.map((x: any) => this.sanitizeData(x)),
                ...this.deletedList.workExperiences.map((item: any) => this.sanitizeData(item))
            ],
            OtherCertificates: [
                ...otherCertificates.map((x: any) => this.sanitizeData(x)),
                ...this.deletedList.otherCertificates.map((item: any) => this.sanitizeData(item))
            ],
            Educations: [
                ...educations.map((x: any) => this.sanitizeData(x)),
                ...this.deletedList.educations.map((item: any) => this.sanitizeData(item))
            ],
            EmergencyContacts: [
                ...emergencyContacts.map((x: any) => this.sanitizeData(x)),
                ...this.deletedList.emergencyContacts.map((item: any) => this.sanitizeData(item))
            ],
            ForeignLanguageSkills: [
                ...foreignLanguages.map((x: any) => this.sanitizeData(x)),
                ...this.deletedList.foreignLanguages.map((item: any) => this.sanitizeData(item))
            ],
            RecruitmentInfo: this.sanitizeData(recruitmentInfo)
        };

        // Debug: log payload (manual save only, to avoid spamming console during autosave)
        if (!isAuto) {
            console.groupCollapsed('[HRRecruitmentApplicationForm] Save payload');
            console.log(payload);
            console.groupEnd();
        }

        const saveObs = isAuto ? this.hrService.saveFormAuto(payload) : this.hrService.saveForm(payload);

        saveObs.subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.status === 1 || res.isSuccess) {
                    // Xóa danh sách chờ sau khi lưu thành công
                    Object.keys(this.deletedList).forEach(k => this.deletedList[k] = []);

                    if (res.data) {
                        const data = res.data;
                        let mainForm = null;
                        if (data.applicationForm && data.applicationForm.length > 0) {
                            mainForm = data.applicationForm[0];
                        } else if (data.HRRecruitmentApplicationForm) {
                            mainForm = data.HRRecruitmentApplicationForm;
                        }

                        // Update master ID if it was 0
                        if (mainForm && mainForm.ID) {
                            const currentID = this.form.get('ID')?.value;
                            if (!currentID || currentID === 0) {
                                this.form.patchValue({ ID: mainForm.ID }, { emitEvent: false });
                            }
                        }

                        // Update RecruitmentInfo IDs
                        const recInfo = data.recruitmentInfo || data.RecruitmentInfo;
                        if (recInfo) {
                            const info = Array.isArray(recInfo) ? recInfo[0] : recInfo;
                            if (info) {
                                if (info.ID) this.form.get('recruitmentInfo.ID')?.setValue(info.ID, { emitEvent: false });
                                if (info.HRRecruitmentApplicationFormID) this.form.get('recruitmentInfo.HRRecruitmentApplicationFormID')?.setValue(info.HRRecruitmentApplicationFormID, { emitEvent: false });
                            }
                        }

                        // Update child array IDs by index matching (safe since isSaving guards concurrent saves)
                        const arrayKeys = [
                            { formKey: 'emergencyContacts', resKey: 'EmergencyContacts' },
                            { formKey: 'educations', resKey: 'Educations' },
                            { formKey: 'foreignLanguages', resKey: 'ForeignLanguageSkills' },
                            { formKey: 'otherCertificates', resKey: 'OtherCertificates' },
                            { formKey: 'workExperiences', resKey: 'WorkingExperiences' }
                        ];

                        arrayKeys.forEach(mapping => {
                            const fa = this.form.get(mapping.formKey) as FormArray;
                            const resArray = data[mapping.resKey] || data[mapping.formKey];
                            if (fa && Array.isArray(resArray) && resArray.length === fa.length) {
                                resArray.forEach((item, idx) => {
                                    if (item.ID) {
                                        const ctrl = fa.at(idx).get('ID');
                                        if (ctrl && (!ctrl.value || ctrl.value === 0)) {
                                            ctrl.setValue(item.ID, { emitEvent: false });
                                        }
                                    }
                                });
                            }
                        });
                    }

                    if (isAuto) {
                        // Lưu tự động: KHÔNG patchForm(res.data) vì patchForm sẽ clear/rebuild FormArray
                        // có thể ghi đè giá trị người dùng đang nhập (DOM hiển thị nhưng control bị reset).
                        this.isSaving = false;
                        if (!isSilent) {
                            //    this.notification.success(NOTIFICATION_TITLE.success, 'Đã lưu tờ khai thành công!');
                        }
                    } else {
                        // Reload data để cập nhật ID cho các grid con (manual save)
                        let candidateIDForReload = 0;
                        if (this.isEmbedded) {
                            candidateIDForReload = this.candidateId || 0;
                        } else {
                            const candidateStr = localStorage.getItem('CurrentUserCandidate');
                            if (candidateStr) {
                                try {
                                    const candidate = JSON.parse(candidateStr);
                                    candidateIDForReload = candidate.ID || 0;
                                } catch (e) { }
                            }
                        }

                        if (candidateIDForReload > 0) {
                            this.hrService.getCandidateInformation(candidateIDForReload).subscribe({
                                next: (reloadRes) => {
                                    if (reloadRes?.data) {
                                        this.patchForm(reloadRes.data);
                                    }
                                    this.isSaving = false;
                                },
                                error: () => {
                                    this.isSaving = false;
                                }
                            });
                        } else {
                            this.isSaving = false;
                        }

                        if (!isSilent) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Đã lưu tờ khai thành công!');
                        }
                    }
                } else {
                    this.isSaving = false;
                    if (!isSilent) {
                        this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu tờ khai thất bại');
                    }
                }
            },
            error: (err: any) => {
                this.isLoading = false;
                this.isSaving = false;
                this.notification.create(
                    NOTIFICATION_TYPE_MAP[err.status] || 'error',
                    NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                    err?.error?.message || `${err.error}\n${err.message}`,
                    {
                        nzStyle: { whiteSpace: 'pre-line' }
                    }
                );
            }
        });
    }

    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
}
