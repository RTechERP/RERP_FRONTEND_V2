import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { KpiErrorEmployeeService } from '../kpi-error-employee-service/kpi-error-employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-kpi-error-employee-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzInputNumberModule,
        NzDatePickerModule,
        NzIconModule,
        NzTableModule,
        NzModalModule
    ],
    templateUrl: './kpi-error-employee-detail.component.html',
    styleUrl: './kpi-error-employee-detail.component.css'
})
export class KpiErrorEmployeeDetailComponent implements OnInit {
    @Input() id: number = 0;
    @Input() isEditMode: boolean = false;
    @Input() departmentId: number = 0;
    @Output() onSaved = new EventEmitter<any>();

    // Model data
    model: any = {};

    kpiErrors: any[] = [];
    groupedKpiErrors: { key: string; value: any[] }[] = [];
    employees: any[] = [];

    files: any[] = [];
    filesToDelete: any[] = [];
    filesToUpload: File[] = [];

    errorName: string = '';
    errorContent: string = '';
    quantity: number = 0;

    // Code for special handling (codeError = "L2")
    readonly codeError: string = 'L2';
    isMoneyReadOnly: boolean = true;

    formatterNumber = (value: number): string => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    parserNumber = (value: string): number => parseInt(value.replace(/,/g, ''), 10) || 0;

    errors: any = {};

    constructor(
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private kpiErrorEmployeeService: KpiErrorEmployeeService
    ) { }

    ngOnInit(): void {
        this.initModel();
        this.loadKPIErrors();
        this.loadEmployees();

        if (this.isEditMode && this.id > 0) {
            this.loadDetail();
        }
    }

    /**
     * Khởi tạo model với default values
     */
    private initModel(): void {
        this.model = {
            ID: this.id || 0,
            KPIErrorID: 0,
            EmployeeID: 0,
            ErrorNumber: 1,
            ErrorDate: new Date(),
            Note: '',
            TotalMoney: 0
        };
    }

    /**
     * Load chi tiết KPIErrorEmployee từ API (mode sửa)
     */
    private loadDetail(): void {
        this.kpiErrorEmployeeService.getKPIErrorEmployeeById(this.id).subscribe({
            next: (response: any) => {
                if (response?.status === 1 && response.data) {
                    const data = response.data;
                    this.model.ID = data.ID || 0;
                    this.model.KPIErrorID = data.KPIErrorID || 0;
                    this.model.EmployeeID = data.EmployeeID || 0;
                    this.model.ErrorNumber = data.ErrorNumber === 0 ? 1 : (data.ErrorNumber || 1);
                    this.model.ErrorDate = data.ErrorDate ? new Date(data.ErrorDate) : new Date();
                    this.model.Note = data.Note || '';
                    this.model.TotalMoney = data.TotalMoney || 0;
                    this.onKPIErrorChange();
                }
            },
            error: (error: any) => {
                console.error('Error loading detail:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải dữ liệu chi tiết');
            }
        });

        // Load danh sách file
        this.kpiErrorEmployeeService.loadDataFile(this.id).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.files = (response.data || []).map((f: any) => ({
                        ...f,
                        isNew: false
                    }));
                }
            },
            error: (error: any) => {
                console.error('Error loading files:', error);
            }
        });
    }

    loadKPIErrors(): void {
        this.kpiErrorEmployeeService.getKPIErrorByDepartment(this.departmentId).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.kpiErrors = response.data;
                    this.groupKpiErrors();
                    if (this.model.KPIErrorID > 0) {
                        this.onKPIErrorChange();
                    }
                }
            },
            error: (error: any) => {
                console.error('Error loading KPI errors:', error);
            }
        });
    }

    private groupKpiErrors(): void {
        const grouped = new Map<string, any[]>();
        this.kpiErrors.forEach(error => {
            const typeName = error.TypeName || 'Khác';
            if (!grouped.has(typeName)) {
                grouped.set(typeName, []);
            }
            grouped.get(typeName)!.push(error);
        });
        this.groupedKpiErrors = Array.from(grouped, ([key, value]) => ({ key, value }));
    }

    loadEmployees(): void {
        this.kpiErrorEmployeeService.getEmployees().subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    this.employees = response.data;
                }
            },
            error: (error: any) => {
                console.error('Error loading employees:', error);
            }
        });
    }

    onKPIErrorChange(): void {
        this.errors.kpiErrorId = '';
        const selectedError = this.kpiErrors.find(e => e.ID === this.model.KPIErrorID);
        if (selectedError) {
            const code = (selectedError.Code || '').trim().toLowerCase();
            this.isMoneyReadOnly = code !== this.codeError.toLowerCase();
            this.quantity = selectedError.Quantity || 0;
            this.model.TotalMoney = selectedError.Monney || 0;
            this.errorName = selectedError.Name || '';
            this.errorContent = selectedError.Content || '';
        } else {
            this.isMoneyReadOnly = true;
            this.quantity = 0;
            this.model.TotalMoney = 0;
            this.errorName = '';
            this.errorContent = '';
        }
    }

    validate(): boolean {
        this.errors = {};
        let isValid = true;

        if (!this.model.KPIErrorID || this.model.KPIErrorID === 0) {
            this.errors.kpiErrorId = 'Vui lòng chọn mã lỗi vi phạm';
            isValid = false;
        }

        if (!this.model.EmployeeID || this.model.EmployeeID === 0) {
            this.errors.employeeId = 'Vui lòng chọn nhân viên vi phạm';
            isValid = false;
        }

        return isValid;
    }

    save(): void {
        if (!this.validate()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
            return;
        }

        const payload = {
            ID: this.model.ID || 0,
            KPIErrorID: this.model.KPIErrorID,
            EmployeeID: this.model.EmployeeID,
            ErrorNumber: this.model.ErrorNumber || 1,
            ErrorDate: this.model.ErrorDate,
            Note: (this.model.Note || '').trim(),
            TotalMoney: this.model.TotalMoney || 0
        };

        this.kpiErrorEmployeeService.saveKPIErrorEmployee(payload).subscribe({
            next: (response: any) => {
                if (response?.status === 1) {
                    const savedId = response.data?.ID || response.data?.id || this.model.ID;
                    this.uploadFiles(savedId);
                    this.deleteFiles();
                    this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
                    this.onSaved.emit(response.data);
                    this.activeModal.close(response.data);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
                }
            },
            error: (error: any) => {
                console.error('Error saving:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
            }
        });
    }

    private uploadFiles(kpiErrorEmployeeId: number): void {
        const newFiles = this.files.filter((f: any) => f.isNew && f.file);
        if (newFiles.length === 0) return;

        const formData = new FormData();
        newFiles.forEach((fileObj: any) => {
            formData.append('files', fileObj.file);
        });
        formData.append('key', 'KPIErrorEmployeeFile');

        const errorDate = new Date(this.model.ErrorDate);
        const year = errorDate.getFullYear().toString();
        const month = (errorDate.getMonth() + 1).toString().padStart(2, '0');
        const day = errorDate.getDate().toString().padStart(2, '0');
        const subPath = `${year}/T${errorDate.getMonth() + 1}/N${day}.${month}.${year}`;
        formData.append('subPath', subPath);

        this.kpiErrorEmployeeService.uploadFiles(formData, kpiErrorEmployeeId, 0).subscribe({
            next: () => {
                console.log('Upload files thành công');
                this.filesToUpload = [];
            },
            error: (error) => {
                console.error('Error uploading files:', error);
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi upload files');
            }
        });
    }

    private deleteFiles(): void {
        if (this.filesToDelete.length === 0) return;

        const fileIds = this.filesToDelete
            .filter(f => f.ID && f.ID > 0)
            .map(f => f.ID);

        if (fileIds.length === 0) return;

        this.kpiErrorEmployeeService.deleteFiles(fileIds).subscribe({
            next: () => {
                this.filesToDelete = [];
            },
            error: (error) => {
                console.error('Error deleting files:', error);
            }
        });
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                this.filesToUpload.push(file);
                this.files.push({
                    ID: 0,
                    FileName: file.name,
                    OriginPath: '',
                    isNew: true,
                    file: file
                });
            }
            input.value = '';
        }
    }

    removeFile(index: number): void {
        const file = this.files[index];
        const fileName = file.FileName || '';

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc muốn xoá file đính kèm [${fileName}] không?`,
            nzOkText: 'Xóa',
            nzOkType: 'primary',
            nzOkDanger: true,
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                if (file.isNew) {
                    const uploadIndex = this.filesToUpload.findIndex(f => f.name === file.FileName);
                    if (uploadIndex > -1) {
                        this.filesToUpload.splice(uploadIndex, 1);
                    }
                } else if (file.ID > 0) {
                    this.filesToDelete.push(file);
                }
                this.files.splice(index, 1);
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
