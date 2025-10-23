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
import { ISADMIN } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import { IssueSolutionService } from '../issue-solution/issue-solution/issue-solution.service';
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
  
  departments: any[] = [];
  customers: any[] = [];
  suppliers: any[] = [];
  projects: any[] = [];
  employees: any[] = [];
  statuses: any[] = [];
  issueCauses: any[] = [];
  documents: any[] = [];
  

  issueSolutionTypes: any[] = [];
  

  formData = {
    issueSolutionType: null, //0.Chung, 1.Dự án
    dateIssue: new Date(),
    departmentId: null,
    relatedDepartmentId: null,
    issueDescription: '',
    customerId: null,
    supplierId: null,
    projectId: null,
    impactDetail: '',
    immediateAction: '',
    preventiveAction: '',
    employeeId: null,
    deadline: new Date(),
    verifiedBy: null,
    statusId: null,
    issueCauseId: null,
    note: '',
    documentNumber: [],
    reasonIgnoreStatusText: '',
    otherIssueCauseNote: ''
  };

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private issueSolutionService: IssueSolutionService,
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

        this.formData.issueSolutionType = data.MainData.IssueSolutionType ?? 0;
        this.formData.dateIssue = data.MainData.DateIssue ? new Date(data.MainData.DateIssue) : new Date();
        this.formData.departmentId = data.MainData.DepartmentID ?? null;
        this.formData.relatedDepartmentId = data.MainData.RelatedDepartmentID ?? null;
        this.formData.issueDescription = data.MainData.IssueDescription ?? '';
        this.formData.customerId = data.MainData.CustomerID ?? null;
        this.formData.supplierId = data.MainData.SupplierID ?? null;
        this.formData.projectId = data.MainData.ProjectID ?? null;
        this.formData.impactDetail = data.MainData.ImpactDetail ?? '';
        this.formData.immediateAction = data.MainData.ImmediateAction ?? '';
        this.formData.preventiveAction = data.MainData.PreventiveAction ?? '';
        this.formData.employeeId = data.MainData.EmployeeID ?? null;
        this.formData.deadline = data.MainData.Deadline ? new Date(data.MainData.Deadline) : new Date();
        this.formData.verifiedBy = data.MainData.VerifiedBy ?? null;
        this.formData.note = data.MainData.Note ?? '';
      
      
        this.formData.issueCauseId = data.MainData.IssueCauseID ?? null;
        this.formData.otherIssueCauseNote = data.MainData.OtherIssueCauseNote ?? '';
      
      
      // Lấy dữ liệu trạng thái từ issueSolutionStatusLink
        this.formData.statusId = data.MainData.StatusID ?? null;
        this.formData.reasonIgnoreStatusText = data.MainData.ReasonIgnoreStatusText ?? '';
      
      
      // Lấy dữ liệu chứng từ từ issueSolutionDocuments
      // const documentsData = data.find(item => item.issueSolutionDocuments);
      // if (documentsData && documentsData.issueSolutionDocuments && Array.isArray(documentsData.issueSolutionDocuments)) {
      //   this.formData.documentNumber = documentsData.issueSolutionDocuments.map((doc: any) => doc.DocumentNumber).filter(Boolean);
      // }
    }
  }

  isIgnoreStatusSelected(): boolean {
    const selected = this.statuses.find((s: any) => s.ID === this.formData.statusId);
    return !!(selected && (selected.StatusCode === 'SC4' || selected.ID === 4 || selected.StatusName === 'Không đồng ý (ghi rõ lý do)'));
  }

  onStatusChange(): void {
    if (!this.isIgnoreStatusSelected()) {
      this.formData.reasonIgnoreStatusText = '';
    }
  }

  isOtherCauseSelected(): boolean {
    const selected = this.issueCauses.find((c: any) => c.ID === this.formData.issueCauseId);
    if (!selected) return false;
    const text = (selected.IssueCauseText || '').toLowerCase();
    return !!(selected.IssueCauseCode === 'IC5' || selected.ID === 5 || text.includes('Khác'));
  }

  onIssueCauseChange(): void {
    if (!this.isOtherCauseSelected()) {
      this.formData.otherIssueCauseNote = '';
    }
  }

  loadStatuses(){
    this.issueSolutionService.getStatuses().subscribe({
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
    this.issueSolutionService.getCauses().subscribe({
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
    const IssueLogSolution = {
      ID: this.selectedId ?? 0,
      DateIssue: this.formData.dateIssue,
      DepartmentID: this.formData.departmentId ?? 0,
      RelatedDepartmentID: this.formData.relatedDepartmentId ?? 0,
      IssueDescription: this.formData.issueDescription ?? '',
      CustomerID: this.formData.customerId ?? 0,
      SupplierID: this.formData.supplierId ?? 0,
      ProjectID: this.formData.projectId ?? 0,
      ImpactDetail: this.formData.impactDetail ?? '',
      ImmediateAction: this.formData.immediateAction ?? '',
      PreventiveAction: this.formData.preventiveAction ?? '',
      EmployeeID: this.formData.employeeId ?? 0,
      Deadline: this.formData.deadline,
      VerifiedBy: this.formData.verifiedBy ?? 0,
      Note: this.formData.note ?? '',
      IssueSolutionType: this.formData.issueSolutionType ?? 0
    };

    const CauseLink = {
      ID: 0, 
      IssueCauseID: this.formData.issueCauseId ?? null, 
      Note: this.formData.otherIssueCauseNote ?? '', 
      CreatedDate: new Date(),
      CreatedBy: '', 
      UpdatedBy: '',
      UpdatedDate: null,
    }

    const StatusLink = {
      ID: 0, 
      StatusID: this.formData.statusId ?? null, // ID status từ combo 
      Note: this.formData.reasonIgnoreStatusText ?? '', 
      CreatedDate: new Date(),
      CreatedBy: '', 
      UpdatedBy: '',
      UpdatedDate: null,
    }

    // Tạo danh sách documents
    const issueSolutionDocuments = this.formData.documentNumber?.map((docCode: string) => {
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
  }

  handleSuccess(response: any): void {
    this.notification.success('Thành công', 'Lưu dữ liệu thành công!');
    this.activeModal.close(response.data);
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  onDateStartChange(): void {
    // Logic xử lý khi ngày thay đổi
  }
}
