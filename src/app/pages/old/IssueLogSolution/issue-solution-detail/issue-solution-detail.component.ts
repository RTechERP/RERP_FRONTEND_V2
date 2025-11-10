import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { ISADMIN } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { IssueSolutionService } from '../issue-solution/issue-solution/issue-solution.service';
import { IssueCauseComponent } from '../issue-cause/issue-cause.component';
import { IssueStatusComponent } from '../issue-status/issue-status.component';
@Component({
  selector: 'app-issue-solution-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzDatePickerModule,
    NgbModule,

  ],
  templateUrl: './issue-solution-detail.component.html',
  styleUrl: './issue-solution-detail.component.css'
})
export class IssueSolutionDetailComponent implements OnInit, AfterViewInit {

  @Input() selectedId = 0;
  @Input() groupedData: any[] = [];
  @Input() isEditMode: boolean = false;

  form!: FormGroup;
  
  departments: any[] = [];
  customers: any[] = [];
  suppliers: any[] = [];
  projects: any[] = [];
  employees: any[] = [];
  statuses: any[] = [];
  issueCauses: any[] = [];
  documents: any[] = [];
  

  issueSolutionTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private issueSolutionService: IssueSolutionService,
    private modalService: NgbModal,
  ) {
    // Khởi tạo seed data cho loại biểu ghi
    this.issueSolutionTypes = [
      { value: 0, name: 'Chung' },
      { value: 1, name: 'Dự án' },
    ];
  }
  ngOnInit(): void {
    this.loadDepartmentAndRelatedDepartment();
    this.loadCustomers();
    this.loadEmployeeAndVerifiedBy();
    this.loadProjects();
    this.loadSupplierSales();
    this.loadStatuses();
    this.loadCauses();
    this.loadDocuments();

    this.form = this.fb.group({
      issueSolutionType: ['', Validators.required],
      dateIssue: [null, Validators.required],
      departmentId: [null, Validators.required],
      relatedDepartmentId: [null],
      documentNumber: [[]],
      supplierId: [null],
      statusId: [null, Validators.required],
      reasonIgnoreStatusText: [{ value: '', disabled: true }],
      issueDescription: ['', Validators.required],
      immediateAction: ['', Validators.required],
      customerId: [null, Validators.required],
      verifiedBy: [null],
      employeeId: [null, Validators.required],
      deadline: [null, Validators.required],
      projectId: [null, Validators.required],
      issueCauseId: [null, Validators.required],
      otherIssueCauseNote: [{ value: '', disabled: true }],
      impactDetail: ['', Validators.required],
      preventiveAction: [''],
      note: [''],
    });

    this.form.get('statusId')?.valueChanges.subscribe(() => {
      this.updateStatusValidation();
    });

    this.form.get('issueCauseId')?.valueChanges.subscribe(() => {
      this.updateCauseValidation();
    });

    if(this.isEditMode && this.groupedData.length > 0)
    {
      this.handleEditModeData();
    }
  }

  ngAfterViewInit(): void {

  }

  handleEditModeData(): void{
    const data = this.groupedData[0];
    console.log("data", data.MainData)
    
    if (data.MainData) {
      // Set values trực tiếp vào FormGroup
      const formData = {
        issueSolutionType: data.MainData[0].IssueSolutionType ?? 0,
        dateIssue: data.MainData[0].DateIssue ? new Date(data.MainData[0].DateIssue) : new Date(),
        departmentId: data.MainData[0].DepartmentID ?? null,
        relatedDepartmentId: data.MainData[0].RelatedDepartmentID ?? null,
        issueDescription: data.MainData[0].IssueDescription ?? '',
        customerId: data.MainData[0].CustomerID ?? null,
        supplierId: data.MainData[0].SupplierID ?? null,
        projectId: data.MainData[0].ProjectID ?? null,
        impactDetail: data.MainData[0].ImpactDetail ?? '',
        immediateAction: data.MainData[0].ImmediateAction ?? '',
        preventiveAction: data.MainData[0].PreventiveAction ?? '',
        employeeId: data.MainData[0].EmployeeID ?? null,
        deadline: data.MainData[0].Deadline ? new Date(data.MainData[0].Deadline) : new Date(),
        verifiedBy: data.MainData[0].VerifiedBy ?? null,
        note: data.MainData[0].Note ?? '',
        issueCauseId: data.MainData[0].IssueCauseID ?? null,
        otherIssueCauseNote: data.MainData[0].OtherIssueCauseNote ?? '',
        statusId: data.MainData[0].StatusID ?? null,
        reasonIgnoreStatusText: data.MainData[0].ReasonIgnoreStatusText ?? '',
        documentNumber: []
      };
      
      // Set vào FormGroup
      this.form.patchValue(formData);
      
      // Update validation sau khi set data
      this.updateStatusValidation();
      this.updateCauseValidation();
      
      // Lấy dữ liệu chứng từ từ issueSolutionDocuments
      const documentsData = data.DocData
      if (documentsData.length > 0) {
        const documentNumbers = documentsData.map((doc: any) => doc.DocumentNumber).filter(Boolean);
        this.form.patchValue({ documentNumber: documentNumbers });
      }
    }
  }

  isIgnoreStatusSelected(): boolean {
    const selected = this.statuses.find((s: any) => s.ID === this.form.get('statusId')?.value);
    return !!(selected && (selected.StatusCode === 'SC4' || selected.ID === 4 || selected.StatusName === 'Không đồng ý (ghi rõ lý do)'));
  }

  onStatusChange(): void {
    if (!this.isIgnoreStatusSelected()) {
      this.form.patchValue({ reasonIgnoreStatusText: '' });
    }
    this.updateStatusValidation();
  }

  updateStatusValidation(): void {
    const reasonControl = this.form.get('reasonIgnoreStatusText');
    if (this.isIgnoreStatusSelected()) {
      reasonControl?.setValidators([Validators.required]);
      reasonControl?.enable();
    } else {
      reasonControl?.clearValidators();
      reasonControl?.setValue('');
      reasonControl?.disable();
    }
    reasonControl?.updateValueAndValidity();
  }

  isOtherCauseSelected(): boolean {
    const selected = this.issueCauses.find((c: any) => c.ID === this.form.get('issueCauseId')?.value);
    if (!selected) return false;
    const text = (selected.IssueCauseText || '').toLowerCase();
    return !!(selected.IssueCauseCode === 'IC5' || selected.ID === 5 || text.includes('Khác'));
  }

  onIssueCauseChange(): void {
    if (!this.isOtherCauseSelected()) {
      this.form.patchValue({ otherIssueCauseNote: '' });
    }
    this.updateCauseValidation();
  }

  openModalIssueCause(): void {
    const modalRef = this.modalService.open(IssueCauseComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: "lg",
      backdrop: 'static',
    });

    modalRef.result.then(
      (result: any) => {
        if (result.success && result.reloadData) {
        }
      },
      (reason : any) => {
        console.log('Modal closed');
      }
    );
  }

  openModalIssueStatus(): void {
    const modalRef = this.modalService.open(IssueStatusComponent, {
      centered: true,
      // windowClass: 'full-screen-modal',
      size: "lg",
      backdrop: 'static',
    });
    modalRef.result.then(
      (result: any) => {
        if (result.success && result.reloadData) {
        }
      },
      (reason : any) => {
        console.log('Modal closed');
      }
    );
  }

  updateCauseValidation(): void {
    const otherCauseControl = this.form.get('otherIssueCauseNote');
    if (this.isOtherCauseSelected()) {
      otherCauseControl?.setValidators([Validators.required]);
      otherCauseControl?.enable();
    } else {
      otherCauseControl?.clearValidators();
      otherCauseControl?.setValue('');
      otherCauseControl?.disable();
    }
    otherCauseControl?.updateValueAndValidity();
  }

  loadStatuses(){
    this.issueSolutionService.getAllIssueStatuses().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.statuses = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu statuses thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadCauses(){
    this.issueSolutionService.getAllIssueCauses().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.issueCauses = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu issueCauses thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadDepartmentAndRelatedDepartment(){
    this.issueSolutionService.getAllDepartment().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.departments = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu departments thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadCustomers(){
    this.issueSolutionService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu customers thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadSupplierSales(){
    this.issueSolutionService.getSupplierSale().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.suppliers = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu suppliers thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadProjects(){
    this.issueSolutionService.getAllProjects().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.projects = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu projects thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }
  
  loadEmployeeAndVerifiedBy(){
    this.issueSolutionService.getEmployees().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.employees = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu employees thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  loadDocuments(){
    this.issueSolutionService.getDocuments().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.documents = response.data
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Lấy dữ liệu documents thất bại!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy dữ liệu!');
      },
    });
  }

  saveData(): void {
    // Kiểm tra form hợp lệ
    if (this.form.valid) {
      // Lấy data trực tiếp từ FormGroup
      const formValue = this.form.value;
      
      const IssueLogSolution = {
        ID: this.selectedId ?? 0,
        DateIssue: formValue.dateIssue,
        DepartmentID: formValue.departmentId ?? 0,
        RelatedDepartmentID: formValue.relatedDepartmentId ?? 0,
        IssueDescription: formValue.issueDescription ?? '',
        CustomerID: formValue.customerId ?? 0,
        SupplierID: formValue.supplierId ?? 0,
        ProjectID: formValue.projectId ?? 0,
        ImpactDetail: formValue.impactDetail ?? '',
        ImmediateAction: formValue.immediateAction ?? '',
        PreventiveAction: formValue.preventiveAction ?? '',
        EmployeeID: formValue.employeeId ?? 0,
        Deadline: formValue.deadline,
        VerifiedBy: formValue.verifiedBy ?? 0,
        Note: formValue.note ?? '',
        IssueSolutionType: formValue.issueSolutionType ?? 0
      };

      const CauseLink = {
        ID: 0, 
        IssueCauseID: formValue.issueCauseId ?? null, 
        Note: formValue.otherIssueCauseNote ?? '', 
        CreatedDate: new Date(),
        CreatedBy: '', 
        UpdatedBy: '',
        UpdatedDate: null,
      }

      const StatusLink = {
        ID: 0, 
        StatusID: formValue.statusId ?? null, // ID status từ combo 
        Note: formValue.reasonIgnoreStatusText ?? '', 
        CreatedDate: new Date(),
        CreatedBy: '', 
        UpdatedBy: '',
        UpdatedDate: null,
      }

      // Tạo danh sách documents
      const issueSolutionDocuments = formValue.documentNumber?.map((docCode: string) => {
        const document = this.documents.find(doc => doc.Code === docCode); //tìm loại chứng từ tương ứng
        return {
          ID: 0,
          DocumentNumber: docCode,
          DocumentType: document?.SourceTable || '',
          CreatedDate: new Date(),
          CreatedBy: '',
          UpdatedBy: '',
          UpdatedDate: null,
        };
      }) || [];

      const payload = {
        issueSolutionLogs: IssueLogSolution,
        issueSolutionCauseLink: CauseLink,
        issueSolutionStatusLink: StatusLink,
        issueSolutionDocuments: issueSolutionDocuments, 
        DeletedIds: [], 
      };

      this.issueSolutionService.saveData(payload).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.handleSuccess(response);
          } else {
            this.notification.error(
              'Lỗi',
              response.message || 'Lưu dữ liệu thất bại!'
            );
          }
        },
        error: (err: any) => {
          this.notification.error('Lỗi', 'Không thể lưu dữ liệu!');
        },
      });
    } else {
      // Hiển thị lỗi validation
      this.markAllFieldsAsTouched();
      this.notification.error('Lỗi', 'Vui lòng kiểm tra lại thông tin!');
    }
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  handleSuccess(response: any): void {
    this.notification.success('Thành công', 'Lưu dữ liệu thành công!');
    this.activeModal.close({
      success: true,
      reloadData: true,
    });
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  onDateStartChange(): void {
    // Logic xử lý khi ngày thay đổi
  }
}
