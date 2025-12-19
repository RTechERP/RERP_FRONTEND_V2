import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { RegisterContractService } from '../register-contract-service/register-contract.service';
import { AuthService } from '../../../../auth/auth.service';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-registercontractdetail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzInputNumberModule,
    NzIconModule,
  ],
  templateUrl: './register-contract-detail.component.html',
  styleUrl: './register-contract-detail.component.css'
})
export class RegistercontractdetailComponent implements OnInit {
  @Input() dataInput: any = null;

  formGroup!: FormGroup;
  saving: boolean = false;
  mode: 'add' | 'edit' = 'add';
  currentUser: any = null;

  employees: any[] = [];
  departments: any[] = [];
  companies: any[] = [];
  documentTypes: any[] = [];
  contractTypes: any[] = [
    { ID: 1, Name: 'Sao y' },
    { ID: 2, Name: 'Gốc' },
    { ID: 3, Name: 'Treo' },
  ];

  constructor(
    private fb: FormBuilder,
    private registerContractService: RegisterContractService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.mode = this.dataInput ? 'edit' : 'add';
    this.initForm();
    this.getCurrentUser();
    this.loadDepartments();
    this.loadEmployees();
    this.loadDocumentTypes();
    this.loadTaxCompanies();
    
    if (this.dataInput && this.dataInput.ID) {
      // Nếu có ID, gọi API để lấy dữ liệu mới nhất
      this.loadDataById(this.dataInput.ID);
    }
  }

  getCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentUser = data;
          
          // Tự động điền thông tin người đăng ký và bộ phận từ user hiện tại
          if (!this.dataInput) { // Chỉ áp dụng khi thêm mới
            this.formGroup.patchValue({
              EmployeeID: data.EmployeeID || null,
              DepartmentID: data.DepartmentID || null
            });
          }
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin user:', error);
      }
    });
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      ID: [0],
      EmployeeID: [null, [Validators.required]], // Người đăng ký
      DepartmentID: [null, [Validators.required]],
      TaxCompanyID: [null, [Validators.required]], // ID công ty
      ContractTypeID: [null, [Validators.required]], // ID loại hồ sơ
      RegistedDate: [new Date(), [Validators.required]],
      EmployeeReciveID: [null, [Validators.required]],
      DocumentTypeID: [null, [Validators.required]], // ID loại văn bản
      DocumentQuantity: [1, [Validators.required, Validators.min(1)]],
      DocumentName: [null, [Validators.required]],
      FolderPath: [null],
      IsScan: [false], // false = chưa scan, true = đã scan
      IsDeleted: [false], // Dùng cho xóa
    });
  }

  loadDataById(id: number): void {
    this.saving = true; // Show loading
    this.registerContractService.getDataById(id).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.dataInput = response.data;
          this.patchFormValue();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy dữ liệu');
        }
        this.saving = false;
      },
      error: (error: any) => {
        const msg = error.error?.message || error.message || 'Lỗi khi tải dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi khi load data by ID:', error);
        this.saving = false;
      }
    });
  }

  patchFormValue(): void {
    if (this.dataInput) {
      this.formGroup.patchValue({
        ID: this.dataInput.ID || 0,
        EmployeeID: this.dataInput.EmployeeID || null,
        DepartmentID: this.currentUser.DepartmentID || null,
        TaxCompanyID: this.dataInput.TaxCompanyID || null,
        ContractTypeID: this.dataInput.ContractTypeID || null,
        RegistedDate: this.dataInput.RegistedDate ? new Date(this.dataInput.RegistedDate) : new Date(),
        EmployeeReciveID: this.dataInput.EmployeeReciveID || null,
        DocumentTypeID: this.dataInput.DocumentTypeID || null,
        DocumentQuantity: this.dataInput.DocumentQuantity || 1,
        DocumentName: this.dataInput.DocumentName || null,
        FolderPath: this.dataInput.FolderPath || null,
        IsScan: this.dataInput.IsScan || false,
      });
    }
  }

  loadDepartments(): void {
    this.registerContractService.getDepartment().subscribe({
      next: (response: any) => {
        this.departments = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi load phòng ban:', error);
      }
    });
  }

  loadEmployees(): void {
    this.registerContractService.getEmployees(0).subscribe({
      next: (response: any) => {
        // Group employees theo phòng ban
        this.employees = this.registerContractService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        console.error('Lỗi khi load nhân viên:', error);
      }
    });
  }

  loadDocumentTypes(): void {
    this.registerContractService.getDocumentType().subscribe({
      next: (response: any) => {
        this.documentTypes = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi load loại hồ sơ:', error);
      }
    });
  }

  loadTaxCompanies(): void {
    this.registerContractService.getTaxCompany().subscribe({
      next: (response: any) => {
        this.companies = response.data || [];
      },
      error: (error: any) => {
        console.error('Lỗi khi load danh sách công ty:', error);
      }
    });
  }

  saveDailyReport(): void {
    // Mark all fields as dirty and touched to show validation errors
    Object.values(this.formGroup.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });

    if (this.formGroup.valid) {
      this.saving = true;
      const formValue = this.formGroup.value;
      
      const data = {
        ID: formValue.ID || 0,
        EmployeeID: formValue.EmployeeID,
        EmployeeReciveID: formValue.EmployeeReciveID,
        TaxCompanyID: formValue.TaxCompanyID,
        RegistedDate: formValue.RegistedDate 
          ? DateTime.fromJSDate(new Date(formValue.RegistedDate)).toISO() 
          : null,
        DocumentTypeID: formValue.DocumentTypeID,
        DocumentName: formValue.DocumentName,
        DocumentQuantity: formValue.DocumentQuantity,
        ContractTypeID: formValue.ContractTypeID,
        FolderPath: formValue.FolderPath || null,
        IsScan: formValue.IsScan || false,
        IsDeleted: false, // Không phải xóa
      };

      console.log('Data to save:', data);
      
      this.registerContractService.saveData(data).subscribe({
        next: (response) => {
          if (response && response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
            debugger;
            // Nếu là thêm mới (mode === 'add'), gửi email thông báo cho người nhận
            if (this.mode === 'add' && response.data && response.data.ID) {
              this.registerContractService.sendEmailNewContract({
                RegisterContractID: response.data.ID
              }).subscribe({
                next: () => console.log('Email thông báo đăng ký mới đã được gửi'),
                error: (err) => console.error('Lỗi gửi email đăng ký mới:', err)
              });
            }
            
            this.saving = false;
            this.activeModal.close(true);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi không xác định');
            this.saving = false;
          }
        },
        error: (error) => {
          const msg = error.error?.message || error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          this.saving = false;
        }
      });
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  close(): void {
    this.activeModal.dismiss(); // Đóng modal mà không trả về kết quả
  }

  onIsScanChange(event: any): void {
    const isChecked = event.target.checked;
    this.formGroup.patchValue({
      IsScan: isChecked
    });
  }
}
