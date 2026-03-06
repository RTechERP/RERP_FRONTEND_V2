import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { forkJoin, interval, of, Subject } from 'rxjs';
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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HRRecruitmentApplicationFormService } from './hr-recruitment-application-form.service';

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
    ],
    templateUrl: './home-layout-candidate.component.html',
    styleUrl: './home-layout-candidate.component.css'
})
export class HomeLayoutCandidateComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    form!: FormGroup;
    isLoading = false;
    private isSaving = false;
    private sanitizeData(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;
        const newObj = { ...obj };
        Object.keys(newObj).forEach(key => {
            if (newObj[key] === '') newObj[key] = null;
        });
        return newObj;
    }

    private formatDateForInput(date: any): string | null {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
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

    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private cdr: ChangeDetectorRef,
        private router: Router,
        private hrService: HRRecruitmentApplicationFormService,
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
        this.startTimers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private startTimers() {
        // Kiểm tra mỗi 50 giây
        interval(50000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.checkSession();
            this.autoSave();
        });
    }

    private checkSession() {
        const expiresAt = localStorage.getItem('candidate_token_expires');
        if (expiresAt && new Date().getTime() > parseInt(expiresAt)) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Phiên đăng nhập đã hết hạn!');
            this.router.navigateByUrl('/login-candidate');
        }
    }

    private autoSave() {
        // Chỉ tự động lưu nếu form hợp lệ và không đang trong quá trình save/reload
        if (this.form.valid && !this.isLoading && !this.isSaving) {
            console.log('Auto saving...');
            this.saveFormData(true);
        }
    }

    loadInitialData() {
        this.isLoading = true;
        const candidateStr = localStorage.getItem('CurrentUserCandidate');
        let hRRecruitmentCandidateID = 0;

        if (candidateStr) {
            try {
                const candidate = JSON.parse(candidateStr);
                hRRecruitmentCandidateID = candidate.ID || 0;
                if (hRRecruitmentCandidateID > 0) {
                    this.form.patchValue({ HRRecruitmentCandidateID: hRRecruitmentCandidateID });
                }
            } catch (e) { console.error('Error parsing candidate', e); }
        }

        const observables: any = {
            chucVu: this.hrService.getAllChucVu()
        };

        if (hRRecruitmentCandidateID > 0) {
            observables.candidateInfo = this.hrService.getCandidateInformation(hRRecruitmentCandidateID);
        }

        forkJoin(observables).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                // 1. Load Chuc Vu
                if (res.chucVu?.isSuccess || res.chucVu?.status === 1) {
                    this.chucVuList = res.chucVu.data || [];
                }

                // 2. Patch Form - Always call to handle defaults if no data exists
                this.patchForm(res.candidateInfo?.data || {});
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu ban đầu');
            }
        });
    }

    patchForm(data: any) {
        if (data.applicationForm && data.applicationForm.length > 0) {
            const mainForm = data.applicationForm[0];
            if (mainForm.CreatedDate) {
                this.createdDate = new Date(mainForm.CreatedDate);
            }
            this.form.patchValue({
                ...mainForm,
                DateOfBirth: this.formatDateForInput(mainForm.DateOfBirth),
                IssuedOn: this.formatDateForInput(mainForm.IssuedOn),
                DateSign: this.formatDateForInput(mainForm.DateSign),
                DateOfStart: this.formatDateForInput(mainForm.DateOfStart),
                HasRelativeOrFriendInCompany: mainForm.HasRelativeOrFriendInCompany ?? false,
                HasSocialInsurance: mainForm.HasSocialInsurance ?? false,
                HasTaxCode: mainForm.HasTaxCode ?? false,
                InjuriesOrSeriousIll: mainForm.InjuriesOrSeriousIll ?? false,
                CurrentlyPregnant: mainForm.CurrentlyPregnant ?? false,
                IsPlanPregnant: mainForm.IsPlanPregnant ?? false,
            });

            // Bind position info - now chucVuList is already loaded
            if (mainForm.ChucVuHDID) {
                this.onPositionChange(mainForm.ChucVuHDID);
            }

            // Image preview
            if (mainForm.FileName) {
                this.hrService.downloadFile(mainForm.FileName).subscribe({
                    next: (blob) => {
                        this.imagePreview = URL.createObjectURL(blob);
                        this.cdr.markForCheck();
                    },
                    error: (err) => console.error('Error downloading image:', err)
                });
            }
        } else {
            // Form chưa có dữ liệu → lấy thông tin từ CurrentUserCandidate
            try {
                const candidateStr = localStorage.getItem('CurrentUserCandidate');
                if (candidateStr) {
                    const candidate = JSON.parse(candidateStr);
                    this.form.patchValue({
                        FullName: candidate.FullName || null,
                        DateOfBirth: this.formatDateForInput(candidate.DateOfBirth) || null,
                        Email: candidate.Email || null,
                        Gender: candidate.Gender ?? null,
                        Mobile: candidate.PhoneNumber || null,
                        ChucVuHDID: candidate.EmployeeChucVuHDID || null,
                    });
                    if (candidate.EmployeeChucVuHDID) {
                        this.onPositionChange(candidate.EmployeeChucVuHDID);
                    }
                }
            } catch (e) { console.error('Error reading CurrentUserCandidate for default values', e); }
        }

        // Populate lists
        const arraysMapping = [
            { key: 'emergencyContacts', data: data.emergencyContacts, defaultCount: 2, formGroupFn: (item: any) => this.fb.group({ ID: [item.ID || 0], FullName: [item.FullName, [Validators.required]], Relation: [item.Relation, [Validators.required]], Tel: [item.Tel, [Validators.required]], Address: [item.Address, [Validators.required]] }) },
            { key: 'educations', data: data.educations, defaultCount: 1, formGroupFn: (item: any) => this.fb.group({ ID: [item.ID || 0], NameOfSchool: [item.NameOfSchool, [Validators.required]], Major: [item.Major, [Validators.required]], GraduatedTime: [item.GraduatedTime, [Validators.required]], QualificationLevel: [item.QualificationLevel, [Validators.required]] }) },
            { key: 'foreignLanguages', data: data.foreignLanguageSkills, defaultCount: 1, formGroupFn: (item: any) => this.fb.group({ ID: [item.ID || 0], ForeignLanguage: [item.ForeignLanguage], Listening: [item.Listening], Speaking: [item.Speaking], Reading: [item.Reading], Writing: [item.Writing] }) },
            { key: 'otherCertificates', data: data.otherCertificates, defaultCount: 1, formGroupFn: (item: any) => this.fb.group({ ID: [item.ID || 0], DateOfIssue: [this.formatDateForInput(item.DateOfIssue)], Certificates: [item.Certificates, [Validators.maxLength(550)]], IssuedBy: [item.IssuedBy, [Validators.maxLength(550)]], QualificationLevel: [item.QualificationLevel] }) },
            { key: 'workExperiences', data: data.workingExperiences, defaultCount: 1, formGroupFn: (item: any) => this.fb.group({ ID: [item.ID || 0], CompanyName: [item.CompanyName, [Validators.maxLength(250)]], PositionName: [item.PositionName, [Validators.maxLength(250)]], DateStart: [this.formatDateForInput(item.DateStart)], DateEnd: [this.formatDateForInput(item.DateEnd)], Leader: [item.Leader, [Validators.maxLength(550)]], Mission: [item.Mission, [Validators.maxLength(550)]], Achievement: [item.Achievement, [Validators.maxLength(550)]], Salary: [item.Salary], WorkingStatus: [item.WorkingStatus], ReasonQuit: [item.ReasonQuit, [Validators.maxLength(550)]], }) }
        ];

        arraysMapping.forEach(m => {
            const fa = this.form.get(m.key) as FormArray;
            if (fa) {
                // Clear all existing controls to avoid duplicates
                fa.clear();

                if (m.data && m.data.length > 0) {
                    m.data.forEach((item: any) => {
                        fa.push(m.formGroupFn(item));
                    });
                } else {
                    // Only add default empty rows if we have no data at all
                    for (let i = 0; i < (m.defaultCount || 1); i++) {
                        if (m.key === 'emergencyContacts') this.addEmergencyContact();
                        else if (m.key === 'educations') this.addEducation();
                        else if (m.key === 'foreignLanguages') this.addForeignLanguage();
                        else if (m.key === 'otherCertificates') this.addOtherCertificate();
                        else if (m.key === 'workExperiences') this.addWorkExperience();
                    }
                }
            }
        });

        // RecruitmentInfo
        if (data.recruitmentInfo) {
            const info = Array.isArray(data.recruitmentInfo) ? data.recruitmentInfo[0] : data.recruitmentInfo;
            if (info) {
                this.form.get('recruitmentInfo')?.patchValue(info);
            }
        }

        // Set dynamic validators based on survey answers
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
    onPositionChange(id: any) {
        const item = this.chucVuList.find(x => x.ID === id);
        if (item) {
            this.form.patchValue({
                ChucVuHDID: item.ID,
                Position: item.Name
            });
        } else {
            this.form.patchValue({
                ChucVuHDID: null,
                Position: null
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
            ChucVuHDID: [null, [Validators.required]],
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
            Tel: [null, [Validators.required, Validators.maxLength(150)]],
            Mobile: [null, [Validators.required, Validators.maxLength(150)]],
            Email: [null, [Validators.required, Validators.email, Validators.maxLength(150)]],
            Hobbies: [null, [Validators.maxLength(550)]],
            Height: [null],
            Weight: [null],
            MaritalStatus: [null, [Validators.required]],
            InjuriesOrSeriousIll: [false, [Validators.required]],
            IfYesSpecify: [null, [Validators.maxLength(550)]],
            CurrentlyPregnant: [false],
            IsPlanPregnant: [false],
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
        this.emergencyContacts.push(this.fb.group({
            ID: [0],
            FullName: [null, [Validators.required, Validators.maxLength(250)]],
            Relation: [null, [Validators.required, Validators.maxLength(250)]],
            Tel: [null, [Validators.required, Validators.maxLength(150)]],
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
        this.educations.push(this.fb.group({
            ID: [0],
            NameOfSchool: [null, [Validators.required, Validators.maxLength(550)]],
            Major: [null, [Validators.required, Validators.maxLength(550)]],
            GraduatedTime: [null, [Validators.required, Validators.maxLength(150)]],
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
        this.foreignLanguages.push(this.fb.group({
            ID: [0],
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
        this.otherCertificates.push(this.fb.group({
            ID: [0],
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
        this.workExperiences.push(this.fb.group({
            ID: [0],
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
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Ảnh không được vượt quá 5MB!');
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

    onSubmit() {
        this.markControlsDirty(this.form);

        if (this.form.invalid) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc (các ô màu đỏ)!');
            return;
        }

        this.isLoading = true;

        // Nếu có file mới được chọn, upload trước rồi mới save form
        if (this.selectedFile) {
            this.hrService.uploadFile(this.selectedFile).subscribe({
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
                error: (err) => {
                    this.isLoading = false;
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải ảnh lên: ' + (err?.error?.message || err?.message));
                }
            });
        } else {
            // Nếu không có file mới (giữ ảnh cũ hoặc không có ảnh), save form luôn
            this.saveFormData();
        }
    }

    private saveFormData(isSilent: boolean = false) {
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

        this.hrService.saveForm(payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.status === 1 || res.isSuccess) {
                    // Xóa danh sách chờ sau khi lưu thành công
                    Object.keys(this.deletedList).forEach(k => this.deletedList[k] = []);

                    // ★ FIX: Reload data từ server để cập nhật ID cho tất cả bảng link
                    // Tránh lỗi trùng lặp khi save tiếp theo (ID=0 sẽ tạo INSERT mới)
                    const candidateStr = localStorage.getItem('CurrentUserCandidate');
                    if (candidateStr) {
                        try {
                            const candidate = JSON.parse(candidateStr);
                            const candidateID = candidate.ID || 0;
                            if (candidateID > 0) {
                                this.hrService.getCandidateInformation(candidateID).subscribe({
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
                        } catch (e) {
                            this.isSaving = false;
                        }
                    } else {
                        this.isSaving = false;
                    }

                    if (!isSilent) {
                        this.notification.success(NOTIFICATION_TITLE.success, 'Đã lưu tờ khai thành công!');
                    }
                } else {
                    this.isSaving = false;
                    if (!isSilent) {
                        this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu tờ khai thất bại');
                    }
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.isSaving = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra: ' + (err?.error?.message || err?.message));
            }
        });
    }
}
