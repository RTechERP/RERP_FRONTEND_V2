import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { EconomicContractService } from '../economic-contract-service/economic-contract.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { EconomicContractTypeFormComponent } from '../economic-contract-type/economic-contract-type-form/economic-contract-type-form.component';
import { EconimicContractTermFormComponent } from '../econimic-contract-term/econimic-contract-term-form/econimic-contract-term-form.component';

@Component({
    standalone: true,
    selector: 'app-economic-contract-form',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzDatePickerModule,
        NzButtonModule,
        NzInputNumberModule,
        NzIconModule,
        NzDividerModule,
    ],
    templateUrl: './economic-contract-form.component.html',
    styleUrl: './economic-contract-form.component.css'
})
export class EconomicContractFormComponent implements OnInit {
    @Input() dataInput: any = null;
    @Output() formSubmitted = new EventEmitter<void>();

    form!: FormGroup;
    isEdit = false;
    isLoading = false;

    contractTypes: any[] = [];
    contractTerms: any[] = [];
    typeNCCOptions = [
        { value: 1, label: 'NCC' },
        { value: 2, label: 'KH' }
    ];
    moneyTypes = [
        { value: 'VND', label: 'VND' },
        { value: 'USD', label: 'USD' },

    ];
    statusOptions = [
        { value: 1, label: 'Còn hiệu lực' },
        { value: 2, label: 'Đã thanh lý' },
    ];
    timeUnitOptions = [
        { value: 'Năm', label: 'Năm' },
        { value: 'Tháng', label: 'Tháng' },
        { value: 'Ngày', label: 'Ngày' }
    ];

    maxSTTType = 1;
    maxSTTTerm = 1;

    // Number formatter for currency
    formatterNumber = (value: number): string => {
        if (value == null) return '';
        return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    parserNumber = (value: string): number => {
        return Number(value.replace(/,/g, '')) || 0;
    };


    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private economicContractService: EconomicContractService,
        private notification: NzNotificationService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        this.loadDropdownData();
        this.initForm();
        this.isEdit = !!this.dataInput?.ID;
        if (this.isEdit) {
            this.patchFormData();
        }
    }

    loadDropdownData() {
        this.loadContractTypes();
        this.loadContractTerms();
    }

    loadContractTypes(callback?: () => void) {
        this.economicContractService.getEconomicContractTypes().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.contractTypes = res.data?.data || [];
                    this.maxSTTType = res.data?.maxSTT || 1;
                    if (callback) callback();
                }
            }
        });
    }

    loadContractTerms(callback?: () => void) {
        this.economicContractService.getEconomicContractTerms().subscribe({
            next: (res) => {
                if (res?.status === 1) {
                    this.contractTerms = res.data?.data || [];
                    this.maxSTTTerm = res.data?.maxSTT || 1;
                    if (callback) callback();
                }
            }
        });
    }

    initForm() {
        this.form = this.fb.group({
            ID: [0],
            STT: [null],
            ContractNumber: ['', Validators.required],
            TypeNCC: [1, Validators.required],
            EconomicContractTypeID: [null, Validators.required],
            EconomicContractTermID: [null],
            ContractContent: ['', Validators.required],
            NameNcc: ['', Validators.required],
            MSTNcc: [''],
            AddressNcc: [''],
            SDTNcc: [''],
            EmailNcc: ['', Validators.email],
            SignedAmount: [0, Validators.required],
            MoneyType: ['VND'],
            SignDate: [null, Validators.required],
            EffectDateFrom: [null],
            EffectDateTo: [null],
            TimeUnit: ['', Validators.required],
            Adjustment: [''],
            Note: [''],
            StatusContract: [1, Validators.required],
            IsDeleted: [false]
        });
    }

    patchFormData() {
        if (this.dataInput) {
            this.form.patchValue({
                ID: this.dataInput.ID,
                STT: this.dataInput.STT,
                ContractNumber: this.dataInput.ContractNumber,
                TypeNCC: this.dataInput.TypeNCC,
                EconomicContractTypeID: this.dataInput.EconomicContractTypeID,
                EconomicContractTermID: this.dataInput.EconomicContractTermID,
                ContractContent: this.dataInput.ContractContent,
                NameNcc: this.dataInput.NameNcc,
                MSTNcc: this.dataInput.MSTNcc,
                AddressNcc: this.dataInput.AddressNcc,
                SDTNcc: this.dataInput.SDTNcc,
                EmailNcc: this.dataInput.EmailNcc,
                SignedAmount: this.dataInput.SignedAmount,
                MoneyType: this.dataInput.MoneyType || 'VND',
                SignDate: this.dataInput.SignDate ? new Date(this.dataInput.SignDate) : null,
                EffectDateFrom: this.dataInput.EffectDateFrom ? new Date(this.dataInput.EffectDateFrom) : null,
                EffectDateTo: this.dataInput.EffectDateTo ? new Date(this.dataInput.EffectDateTo) : null,
                TimeUnit: this.dataInput.TimeUnit,
                Adjustment: this.dataInput.Adjustment,
                Note: this.dataInput.Note,
                StatusContract: this.dataInput.StatusContract || 1,
                IsDeleted: this.dataInput.IsDeleted || false
            });
        }
    }

    onSubmit() {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        this.isLoading = true;
        const formValue = this.form.value;

        // Format dates
        if (formValue.SignDate) {
            formValue.SignDate = new Date(formValue.SignDate).toISOString();
        }
        if (formValue.EffectDateFrom) {
            formValue.EffectDateFrom = new Date(formValue.EffectDateFrom).toISOString();
        }
        if (formValue.EffectDateTo) {
            formValue.EffectDateTo = new Date(formValue.EffectDateTo).toISOString();
        }

        this.economicContractService.saveEconomicContract(formValue).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật thành công' : 'Thêm mới thành công');
                    this.formSubmitted.emit();
                    this.activeModal.close('save');
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
                }
            },
            error: (err) => {
                this.isLoading = false;
                const msg = err?.error?.message || err?.message || 'Lỗi khi lưu dữ liệu';
                this.notification.error(NOTIFICATION_TITLE.error, msg);
            }
        });
    }

    onCancel() {
        this.activeModal.dismiss('cancel');
    }

    addContractType() {
        const modalRef = this.modalService.open(EconomicContractTypeFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = null;
        modalRef.componentInstance.nextSTT = this.maxSTTType;

        modalRef.result.then(
            (result) => {
                // Luôn load lại để cập nhật danh sách mới nhất kể cả khi dismiss
                this.loadContractTypes(() => {
                    if (result === 'save' && this.contractTypes.length > 0) {
                        const latest = this.contractTypes.reduce((prev, current) => (prev.ID > current.ID) ? prev : current);
                        this.form.get('EconomicContractTypeID')?.setValue(latest.ID);
                    }
                });
            },
            () => {
                // Trường hợp bấm ra ngoài hoặc nhấn dấu X (dismiss)
                this.loadContractTypes();
            }
        );
    }

    addContractTerm() {
        const modalRef = this.modalService.open(EconimicContractTermFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = null;
        modalRef.componentInstance.nextSTT = this.maxSTTTerm;

        modalRef.result.then(
            (result) => {
                // Luôn load lại để cập nhật danh sách mới nhất kể cả khi dismiss
                this.loadContractTerms(() => {
                    if (result === 'save' && this.contractTerms.length > 0) {
                        const latest = this.contractTerms.reduce((prev, current) => (prev.ID > current.ID) ? prev : current);
                        this.form.get('EconomicContractTermID')?.setValue(latest.ID);
                    }
                });
            },
            () => {
                // Trường hợp bấm ra ngoài hoặc nhấn dấu X (dismiss)
                this.loadContractTerms();
            }
        );
    }
}
