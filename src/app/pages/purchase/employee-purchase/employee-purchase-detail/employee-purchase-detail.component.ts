// ✅ employee-purchase-detail.component.ts - Rewritten for NgBootstrap Modal
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// ✅ NgBootstrap Modal
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// ✅ NG-ZORRO modules
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// ✅ Services
import { EmployeePurchaseService } from '../employee-purchase-service/employee-purchase.service';
import {
  EmployeePurchaseDto,
  EmployeeDto,
  TaxCompanyDto,
} from '../employee-purchase-service/employee-purchase.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-employee-purchase-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './employee-purchase-detail.component.html',
  styleUrls: ['./employee-purchase-detail.component.css'],
})
export class EmployeePurchaseDetailComponent implements OnInit, OnDestroy {
  // ✅ Properties từ parent component (được set từ main component)
  employeePurchaseID: number = 0;
  isEdit: boolean = false;
  currentData: EmployeePurchaseDto | null = null;

  // ✅ Modal state
  modalTitle: string = 'THÊM NHÂN VIÊN MUA HÀNG';
  saving: boolean = false;
  loading: boolean = false;

  // ✅ Reactive Form
  employeePurchaseForm!: FormGroup;

  // ✅ Data sources
  employees: any[] = [];
  companyList: TaxCompanyDto[] = [];

  // ✅ Duplicate check
  isDuplicateWarning: boolean = false;
  duplicateMessage: string = '';
  private duplicateCheckTimeout: any;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private employeePurchaseService: EmployeePurchaseService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  // ✅ Initialize reactive form
  private initializeForm(): void {
    this.employeePurchaseForm = this.fb.group({
      selectedEmployeeId: [null, [Validators.required]],
      selectedCompanyId: [null, [Validators.required]],
      telephone: [''],
      email: ['', [Validators.email]],
      displayName: ['', [Validators.maxLength(100)]]
    });

    // Subscribe to form changes for duplicate checking
    this.employeePurchaseForm.get('selectedEmployeeId')?.valueChanges.subscribe(() => {
      this.onEmployeeChange();
    });

    this.employeePurchaseForm.get('selectedCompanyId')?.valueChanges.subscribe(() => {
      this.onCompanyChange();
    });
  }

  ngOnInit(): void {
    this.initializeModal();
    this.loadEmployees();
    this.loadCompanies();

    if (this.isEdit) {
      this.initializeEditMode();
    }
  }

  ngOnDestroy(): void {
    if (this.duplicateCheckTimeout) {
      clearTimeout(this.duplicateCheckTimeout);
    }
  }

  // ✅ Initialize modal based on mode
  private initializeModal(): void {
    this.modalTitle = this.isEdit
      ? 'SỬA NHÂN VIÊN MUA HÀNG'
      : 'THÊM NHÂN VIÊN MUA HÀNG';

    if (!this.isEdit) {
      this.resetForm();
    }
  }

  // ✅ Initialize edit mode
  private initializeEditMode(): void {
    if (this.currentData) {
      this.loadDataForEdit();
    } else if (this.employeePurchaseID && this.employeePurchaseID > 0) {
      this.loadEmployeePurchaseDetail(this.employeePurchaseID);
    }
  }

  // ✅ Load employee purchase detail by ID
  private loadEmployeePurchaseDetail(id: number): void {
    this.loading = true;

    this.employeePurchaseService.getEmployeePurchaseDetail(id).subscribe({
      next: (response: any) => {
        console.log('Employee purchase detail response:', response);

        if (response && response.Success && response.Data) {
          this.currentData = response.Data;
          this.loadDataForEdit();
        } else if (response && response.data) {
          this.currentData = response.data;
          this.loadDataForEdit();
        } else {
          this.notification.error(
            'Lỗi',
            'Không tìm thấy thông tin nhân viên mua hàng'
          );
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Load employee purchase detail error:', error);
        this.notification.error(
          'Lỗi',
          'Không thể tải thông tin nhân viên mua hàng'
        );
        this.loading = false;
      },
    });
  }

  // ✅ Load data for edit mode
  private loadDataForEdit(): void {
    if (this.currentData) {
      // Xử lý số điện thoại để loại bỏ dấu chấm
      let telephone = this.currentData.Telephone || '';
      telephone = telephone.replace(/\./g, '');

      this.employeePurchaseForm.patchValue({
        selectedEmployeeId: this.currentData.EmployeeID || null,
        selectedCompanyId: this.currentData.TaxCompayID || null,
        telephone: telephone,
        email: this.currentData.Email || '',
        displayName: this.currentData.FullName || this.currentData.EmployeeName || ''
      });

      console.log('Loaded data for edit:', {
        selectedEmployeeId: this.currentData.EmployeeID || null,
        selectedCompanyId: this.currentData.TaxCompayID || null,
        displayName: this.currentData.FullName || this.currentData.EmployeeName || '',
      });
    }
  }

  // ✅ Load employees
  private loadEmployees(): void {
    this.employeePurchaseService.getAllEmployee().subscribe({
      next: (response: any) => {
        console.log('Employee Response:', response);

        let employeeData: EmployeeDto[] = [];

        if (response) {
          if (
            response.Success &&
            response.Data &&
            Array.isArray(response.Data)
          ) {
            employeeData = response.Data;
          } else if (response.data && Array.isArray(response.data)) {
            employeeData = response.data;
          } else if (Array.isArray(response)) {
            employeeData = response;
          }
        }

        this.employees = this.employeePurchaseService.createdDataGroup(
          employeeData,
          'DepartmentName'
        );

        console.log('Grouped Employees:', this.employees);
      },
      error: (error) => {
        console.error('Load employees error:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách nhân viên');
        this.employees = [];
      },
    });
  }

  // ✅ Load companies
  private loadCompanies(): void {
    this.employeePurchaseService.getAllTaxCompany().subscribe({
      next: (response: any) => {
        console.log('Company Response:', response);

        if (response) {
          if (
            response.Success &&
            response.Data &&
            Array.isArray(response.Data)
          ) {
            this.companyList = response.Data;
          } else if (response.data && Array.isArray(response.data)) {
            this.companyList = response.data;
          } else if (Array.isArray(response)) {
            this.companyList = response;
          }
        }

        console.log('Company List:', this.companyList);
      },
      error: (error) => {
        console.error('Load companies error:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách công ty');
        this.companyList = [];
      },
    });
  }

  // ✅ Employee selection change handler
  onEmployeeChange(): void {
    const selectedEmployeeId = this.employeePurchaseForm.get('selectedEmployeeId')?.value;
    
    if (selectedEmployeeId) {
      let selectedEmployee: any = null;

      // Find selected employee in grouped data
      for (const group of this.employees) {
        selectedEmployee = group.options.find(
          (opt: any) => opt.item.ID === selectedEmployeeId
        );
        if (selectedEmployee) {
          selectedEmployee = selectedEmployee.item;
          break;
        }
      }

      if (selectedEmployee) {
        // Auto-fill display name
        const displayName = selectedEmployee.FullName || selectedEmployee.Name || '';
        this.employeePurchaseForm.patchValue({ displayName });

        // Check duplicate if company is selected
        const selectedCompanyId = this.employeePurchaseForm.get('selectedCompanyId')?.value;
        if (selectedCompanyId) {
          this.checkDuplicateRealTime();
        }
      }
    } else {
      this.employeePurchaseForm.patchValue({ displayName: '' });
      this.clearDuplicateWarning();
    }
  }

  // ✅ Company selection change handler
  onCompanyChange(): void {
    const selectedCompanyId = this.employeePurchaseForm.get('selectedCompanyId')?.value;
    
    if (selectedCompanyId) {
      const selectedCompany = this.companyList.find(
        (c) => c.ID === selectedCompanyId
      );

      if (selectedCompany) {
        console.log('Selected company:', selectedCompany);

        // Check duplicate if employee is selected
        const selectedEmployeeId = this.employeePurchaseForm.get('selectedEmployeeId')?.value;
        if (selectedEmployeeId) {
          this.checkDuplicateRealTime();
        }
      }
    } else {
      this.clearDuplicateWarning();
    }
  }

  // ✅ Filter options for employee select
  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!input) return true;

    let employee: any = null;
    for (const group of this.employees) {
      employee = group.options.find(
        (opt: any) => opt.item.ID === option.nzValue
      );
      if (employee) {
        employee = employee.item;
        break;
      }
    }

    if (!employee) return false;

    const searchText = input.toLowerCase();
    return (
      employee.FullName?.toLowerCase().includes(searchText) ||
      employee.Name?.toLowerCase().includes(searchText) ||
      employee.Code?.toLowerCase().includes(searchText) ||
      employee.DepartmentName?.toLowerCase().includes(searchText)
    );
  };

  // ✅ Filter options for company select
  filterCompanyOption = (input: string, option: any): boolean => {
    if (!input) return true;

    const company = this.companyList.find((c) => c.ID === option.nzValue);
    if (!company) return false;

    const searchText = input.toLowerCase();
    return company.Name?.toLowerCase().includes(searchText);
  };

  // ✅ Check duplicate API method
  private async checkDuplicateEmployee(): Promise<boolean> {
    const selectedEmployeeId = this.employeePurchaseForm.get('selectedEmployeeId')?.value;
    const selectedCompanyId = this.employeePurchaseForm.get('selectedCompanyId')?.value;
    
    if (!selectedEmployeeId || !selectedCompanyId) return false;

    return new Promise((resolve) => {
      const currentId = this.isEdit ? this.currentData?.ID || 0 : 0;

      this.employeePurchaseService
        .checkEmployeePurchaseDuplicate(
          selectedEmployeeId!,
          selectedCompanyId!,
          currentId
        )
        .subscribe({
          next: (response: any) => {
            console.log('Duplicate check response:', response);

            if (response && response.status === 1) {
              this.duplicateMessage =
                response.data === true
                  ? 'Nhân viên đã tồn tại trong công ty này'
                  : '';
              resolve(response.data === true);
            } else {
              resolve(false);
            }
          },
          error: (error) => {
            console.error('Duplicate check error:', error);
            resolve(false);
          },
        });
    });
  }

  
  private checkDuplicateRealTime(): void {
    const selectedEmployeeId = this.employeePurchaseForm.get('selectedEmployeeId')?.value;
    const selectedCompanyId = this.employeePurchaseForm.get('selectedCompanyId')?.value;
    
    if (!selectedEmployeeId || !selectedCompanyId) {
      this.clearDuplicateWarning();
      return;
    }

    // Debounce to avoid spam API calls
    if (this.duplicateCheckTimeout) {
      clearTimeout(this.duplicateCheckTimeout);
    }

    this.duplicateCheckTimeout = setTimeout(async () => {
      try {
        this.isDuplicateWarning = await this.checkDuplicateEmployee();

        if (this.isDuplicateWarning) {
          this.notification.warning(
            'Cảnh báo trùng lặp',
            this.duplicateMessage || 'Nhân viên đã tồn tại trong công ty này!',
            { nzDuration: 4000 }
          );
        }
      } catch (error) {
        console.error('Real-time duplicate check error:', error);
      }
    }, 500);
  }

  private clearDuplicateWarning(): void {
    this.isDuplicateWarning = false;
    this.duplicateMessage = '';
  }

  
  isFormValid(): boolean {
    return this.employeePurchaseForm.valid && !this.isDuplicateWarning;
  }


  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+84|84|0)?[0-9]{9,10}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

 
  async saveEmployeePurchase(): Promise<void> {
    // Mark all fields as touched to show validation errors
    this.employeePurchaseForm.markAllAsTouched();

    // Basic validation using reactive form
    if (this.employeePurchaseForm.invalid) {
      this.notification.error(
        'Lỗi',
        'Vui lòng điền đầy đủ thông tin bắt buộc và kiểm tra định dạng dữ liệu'
      );
      return;
    }

    const formValues = this.employeePurchaseForm.value;

    // Additional phone validation
    if (
      formValues.telephone &&
      formValues.telephone.trim() &&
      !this.isValidPhone(formValues.telephone.trim())
    ) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Định dạng số điện thoại không hợp lệ');
      return;
    }

    // Duplicate check
    this.saving = true;

    try {
      const isDuplicate = await this.checkDuplicateEmployee();

      if (isDuplicate) {
        this.saving = false;
        this.notification.error(
          'Lỗi trùng lặp',
          this.duplicateMessage ||
            'Nhân viên đã tồn tại trong công ty này. Vui lòng chọn nhân viên khác hoặc công ty khác.',
          { nzDuration: 6000 }
        );
        return;
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
      // Continue save if duplicate check fails
    }

    // Prepare save data
    const data: EmployeePurchaseDto = {
      ID: this.currentData?.ID || this.employeePurchaseID || 0,
      EmployeeID: formValues.selectedEmployeeId!,
      TaxCompayID: formValues.selectedCompanyId!,
      Telephone: (formValues.telephone || '').trim(),
      Email: (formValues.email || '').trim(),
      EmployeeName: (formValues.displayName || '').trim(),
      FullName: (formValues.displayName || '').trim(),
      CreatedBy: this.isEdit
        ? this.currentData?.CreatedBy || this.employeePurchaseService.LoginName
        : this.employeePurchaseService.LoginName,
      CreatedDate: this.isEdit
        ? this.currentData?.CreatedDate || new Date()
        : new Date(),
      UpdatedBy: this.employeePurchaseService.LoginName,
      UpdatedDate: new Date(),
    };

    console.log('Saving employee purchase data:', data);

    // Save API call
    this.employeePurchaseService.saveEmployeePurchase(data).subscribe({
      next: (response: any) => {
        console.log('Save response:', response);

        if (
          response &&
          (response.Success || response.success || response.status === 1)
        ) {
          this.notification.success(
            'Thành công',
            this.isEdit
              ? 'Cập nhật thông tin nhân viên mua hàng thành công!'
              : 'Thêm nhân viên mua hàng thành công!'
          );
          this.activeModal.close(true);
        } else {
          this.notification.error(
            'Lỗi',
            response?.Message ||
              response?.message ||
              'Có lỗi xảy ra khi lưu dữ liệu'
          );
        }

        this.saving = false;
      },
      error: (error) => {
        console.error('Save error:', error);
        this.saving = false;
        this.notification.error(
          'Lỗi',
          'Không thể lưu dữ liệu: ' + (error.message || 'Unknown error')
        );
      },
    });
  }

  // ✅ Reset form
  resetForm(): void {
    this.employeePurchaseForm.reset({
      selectedEmployeeId: null,
      selectedCompanyId: null,
      telephone: '',
      email: '',
      displayName: ''
    });
    this.clearDuplicateWarning();
  }

  // ✅ Close modal
  closeModal(): void {
    this.activeModal.close(false);
  }

  // ✅ Keyboard shortcuts
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.saveEmployeePurchase();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
    }
  }
}
