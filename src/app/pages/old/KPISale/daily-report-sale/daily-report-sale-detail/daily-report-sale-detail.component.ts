import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin, finalize } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { DailyReportSaleService } from '../daily-report-sale-service/daily-report-sale.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { FirmService } from '../../../../general-category/firm/firm-service/firm.service';
import { FirmBaseDetailComponent } from '../../../../project/firmbase-detail/firm-base-detail.component';
import { CustomerDetailComponent } from '../../../../crm/customers/customer-detail/customer-detail.component';
import { ProjectTypeBaseDetailComponent } from '../../../VisionBase/kho-base/follow-project-base/project-type-base-detail/project-type-base-detail.component';
import { CustomerPartComponent } from '../../../customer-part/customer-part.component';

@Component({
  selector: 'app-daily-report-sale-detail',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzFormModule,
    CommonModule,
  ],
  templateUrl: './daily-report-sale-detail.component.html',
  styleUrl: './daily-report-sale-detail.component.css'
})
export class DailyReportSaleDetailComponent implements OnInit, AfterViewInit {
  @Input() editId: number = 0;
  @Input() warehouseId: number = 0;
  dailyReportSaleForm!: FormGroup;
  isSubmitted: boolean = false;

  // Manage data individually per row
  projectStatusOldMap: { [index: number]: number } = {};
  showDateStatusLogModalMap: { [index: number]: boolean } = {};

  // Data sources per row mapped by FormArray index
  contactsMap: { [index: number]: any[] } = {};
  partsMap: { [index: number]: any[] } = {};

  isAdmin: boolean = false;
  isUserIdDisabled: boolean = false;
  isEditMode: boolean = false;
  isLoading: boolean = false;

  // Date constraints: chỉ cho phép báo cáo trong 3 ngày gần nhất
  minDateStart: Date;
  maxDateStart: Date;
  disabledDateStart = (current: Date): boolean => {
    return current < this.minDateStart || current > this.maxDateStart;
  };

  showProjectStatusModal: boolean = false;
  projectStatusForm!: FormGroup;
  isSavingProjectStatus: boolean = false;
  isSaving: boolean = false;

  // Global data sources
  users: any[] = [];
  projects: any[] = [];
  customers: any[] = [];
  groupTypes: any[] = [];
  firms: any[] = [];
  projectTypes: any[] = [];
  projectStatuses: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private dailyReportSaleService: DailyReportSaleService,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private firmService: FirmService,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.maxDateStart = today;
    this.minDateStart = new Date(today);
    this.minDateStart.setDate(this.minDateStart.getDate() - 2);

    this.initForm();
    this.initProjectStatusForm();
  }

  get reports(): FormArray {
    return this.dailyReportSaleForm.get('reports') as FormArray;
  }

  initForm(): void {
    this.dailyReportSaleForm = this.fb.group({
      reports: this.fb.array([])
    });
  }

  createReportGroup(): FormGroup {
    return this.fb.group({
      id: [0], // For tracking edit mode internally
      userId: [null, Validators.required],
      projectId: [null],
      customerId: [null, Validators.required],
      firmId: [null, Validators.required],
      projectTypeId: [null, Validators.required],
      projectStatusId: [null, Validators.required],
      dateStart: [null, Validators.required],
      dateEnd: [null],
      contactId: [null, Validators.required],
      groupTypeId: [null, Validators.required],
      partId: [null],
      bigAccount: [false],
      saleOpportunity: [false],
      content: ['', Validators.required],
      result: ['', Validators.required],
      problemBacklog: [''],
      planNext: ['', Validators.required],
      productOfCustomer: ['', Validators.required],
      dateStatusLog: [null],
    });
  }

  initProjectStatusForm(): void {
    this.projectStatusForm = this.fb.group({
      stt: [1, [Validators.required, Validators.min(1)]],
      statusName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.appUserService.isAdmin;
    this.isUserIdDisabled = !this.isAdmin;

    this.loadUsers();
    this.loadProjects();
    this.loadCustomers();
    this.loadFirmBase();
    this.loadProjectTypeBase();
    this.loadProjectStatuses();
    this.loadMainIndexes();

    if (this.editId > 0) {
      this.isEditMode = true;
      this.loadExistingData();
    } else {
      this.addReport();
    }
  }

  addReport(): void {
    const reportGroup = this.createReportGroup();
    const index = this.reports.length;

    // Set default values logic
    if (!this.isAdmin) {
      const currentUserId = this.appUserService.id;
      if (currentUserId) {
        reportGroup.patchValue({ userId: currentUserId });
        reportGroup.get('userId')?.disable();
      }
    }

    const today = new Date();
    reportGroup.patchValue({
      dateStart: today,
      dateEnd: today
    });

    // Wire up value changes for this specific index
    this.setupValueChanges(reportGroup, index);

    this.reports.push(reportGroup);

    // Initialize map maps for rows
    this.contactsMap[index] = [];
    this.partsMap[index] = [];
    this.projectStatusOldMap[index] = 0;
    this.showDateStatusLogModalMap[index] = false;
  }

  removeReport(index: number): void {
    if (this.reports.length > 1) {
      this.reports.removeAt(index);

      delete this.contactsMap[index];
      delete this.partsMap[index];
      delete this.projectStatusOldMap[index];
      delete this.showDateStatusLogModalMap[index];
      for (let i = index; i < this.reports.length; i++) {
        this.contactsMap[i] = this.contactsMap[i + 1] || [];
        this.partsMap[i] = this.partsMap[i + 1] || [];
        this.projectStatusOldMap[i] = this.projectStatusOldMap[i + 1] || 0;
        this.showDateStatusLogModalMap[i] = this.showDateStatusLogModalMap[i + 1] || false;
      }

      delete this.contactsMap[this.reports.length];
      delete this.partsMap[this.reports.length];
      delete this.projectStatusOldMap[this.reports.length];
      delete this.showDateStatusLogModalMap[this.reports.length];

    }
  }

  setupValueChanges(group: FormGroup, index: number): void {
    group.get('customerId')?.valueChanges.subscribe((customerId: number | null) => {
      this.onCustomerChange(customerId, index);
    });

    group.get('projectId')?.valueChanges.subscribe((projectId: number | null) => {
      this.onProjectChange(projectId, index);
    });

    group.get('projectStatusId')?.valueChanges.subscribe((projectStatusId: number | null) => {
      this.onProjectStatusChange(projectStatusId, index);
    });

    group.get('userId')?.valueChanges.subscribe((userId: number | null) => {
      this.loadProductCustomer(index);
    });
  }

  ngAfterViewInit(): void { }

  loadExistingData(): void {
    this.isLoading = true;
    this.dailyReportSaleService.getById(this.editId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const data = response.data;
          const reportGroup = this.createReportGroup();
          const index = 0;

          this.contactsMap[index] = [];
          this.partsMap[index] = [];

          if (!this.isAdmin) reportGroup.get('userId')?.disable();

          this.projectStatusOldMap[index] = data.ProjectStatusBaseID || 0;

          reportGroup.patchValue({
            id: this.editId,
            userId: data.UserID || null,
            projectId: data.ProjectID || null,
            customerId: data.CustomerID || null,
            firmId: data.FirmBaseID || null,
            projectTypeId: data.ProjectTypeBaseID || null,
            dateStart: data.DateStart ? new Date(data.DateStart) : null,
            dateEnd: data.DateEnd ? new Date(data.DateEnd) : null,
            groupTypeId: data.GroupType || null,
            bigAccount: data.BigAccount || false,
            saleOpportunity: data.SaleOpportunity || false,
            content: data.Content || '',
            result: data.Result || '',
            problemBacklog: data.ProblemBacklog || '',
            planNext: data.PlanNext || '',
            productOfCustomer: data.ProductOfCustomer || '',
          });

          this.reports.push(reportGroup);
          this.setupValueChanges(reportGroup, index);

          if (data.CustomerID) {
            const contactId = data.ContacID || null;
            const partId = data.EndUser || null;

            forkJoin({
              contacts: this.dailyReportSaleService.getCustomerContacts(data.CustomerID),
              parts: this.dailyReportSaleService.getCustomerParts(data.CustomerID)
            }).subscribe({
              next: (results) => {
                if (results.contacts.status === 1) this.contactsMap[index] = results.contacts.data || [];
                if (results.parts.status === 1) this.partsMap[index] = results.parts.data || [];

                reportGroup.patchValue({ contactId, partId }, { emitEvent: false });
                this.loadProjectStatusForEdit(data.ProjectID || null, index);
                this.isLoading = false;
              },
              error: (error) => {
                console.error('Error loading contacts/parts:', error);
                reportGroup.patchValue({ contactId, partId }, { emitEvent: false });
                this.loadProjectStatusForEdit(data.ProjectID || null, index);
                this.isLoading = false;
              }
            });
          } else {
            this.loadProjectStatusForEdit(data.ProjectID || null, index);
            this.isLoading = false;
          }
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading existing data:', error);
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải dữ liệu');
        this.isLoading = false;
      }
    });
  }

  loadUsers() {
    this.dailyReportSaleService.getEmployees().subscribe({
      next: (response) => {
        if (response.status === 1) this.users = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
        console.error('Error loading employees:', error);
      }
    });
  }

  loadProjects() {
    this.dailyReportSaleService.getProjects().subscribe({
      next: (response) => {
        if (response.status === 1) this.projects = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách dự án');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách dự án');
        console.error('Error loading projects:', error);
      }
    });
  }

  loadCustomers() {
    this.dailyReportSaleService.getCustomers().subscribe({
      next: (response) => {
        if (response.status === 1) this.customers = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách khách hàng');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách khách hàng');
        console.error('Error loading customers:', error);
      }
    });
  }

  loadFirmBase() {
    this.dailyReportSaleService.getFirmBase().subscribe({
      next: (response) => {
        if (response.status === 1) this.firms = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách hãng');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách hãng');
        console.error('Error loading firms:', error);
      }
    });
  }

  loadProjectTypeBase() {
    this.dailyReportSaleService.getProjectTypeBase().subscribe({
      next: (response) => {
        if (response.status === 1) this.projectTypes = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách loại dự án');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách loại dự án');
        console.error('Error loading project types:', error);
      }
    });
  }

  loadProjectStatuses() {
    this.dailyReportSaleService.getProjectStatuses().subscribe({
      next: (response) => {
        if (response.status === 1) this.projectStatuses = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách trạng thái dự án');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách trạng thái dự án');
        console.error('Error loading project statuses:', error);
      }
    });
  }

  loadCustomerContacts(customerId: number, index: number) {
    this.dailyReportSaleService.getCustomerContacts(customerId).subscribe({
      next: (response) => {
        if (response.status === 1) this.contactsMap[index] = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách người liên hệ');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách người liên hệ');
        console.error('Error loading customer contacts:', error);
      }
    });
  }

  loadCustomerParts(customerId: number, index: number) {
    this.dailyReportSaleService.getCustomerParts(customerId).subscribe({
      next: (response) => {
        if (response.status === 1) this.partsMap[index] = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách EndUser');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách EndUser');
        console.error('Error loading customer parts:', error);
      }
    });
  }

  loadMainIndexes() {
    this.dailyReportSaleService.getMainIndexes().subscribe({
      next: (response) => {
        if (response.status === 1) this.groupTypes = response.data || [];
        else this.notification.error('Lỗi', response.message || 'Không thể tải danh sách loại nhóm');
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách loại nhóm');
        console.error('Error loading group types:', error);
      }
    });
  }

  onCustomerChange(customerId: number | null, index: number): void {
    if (this.isLoading) return;

    this.reports.at(index).patchValue({
      contactId: null,
      partId: null
    }, { emitEvent: false });

    if (customerId) {
      this.loadCustomerContacts(customerId, index);
      this.loadCustomerParts(customerId, index);
    } else {
      this.contactsMap[index] = [];
      this.partsMap[index] = [];
    }
  }

  onAddCustomer(index: number): void {
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.warehouseId = this.warehouseId;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadCustomers();
        }
      },
      (reason) => console.log('Modal closed:', reason)
    );
  }

  onAddProject(index: number): void {
    this.notification.info('Thông báo', 'Chức năng thêm dự án đang được phát triển');
  }

  onAddContact(index: number): void {
    const customerId = this.reports.at(index).get('customerId')?.value;
    if (!customerId || customerId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Khách hàng trước!');
      return;
    }
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.warehouseId = this.warehouseId;
    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.EditID = customerId;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadCustomers();
          this.loadCustomerContacts(customerId, index);
        }
      },
      (reason) => console.log('Modal closed:', reason)
    );
  }

  onAddFirm(): void {
    const modalRef = this.modalService.open(FirmBaseDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadFirmBase();
        }
      },
      (reason) => console.log('Modal closed:', reason)
    );
  }

  onAddProjectType(): void {
    const modalRef = this.modalService.open(ProjectTypeBaseDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadProjectTypeBase();
        }
      },
      (reason) => console.log('Modal closed:', reason)
    );
  }

  onAddProjectStatus(): void {
    this.projectStatusForm.reset({
      stt: this.projectStatuses.length + 1,
      statusName: ''
    });
    this.showProjectStatusModal = true;
  }

  onProjectStatusModalCancel(): void {
    this.showProjectStatusModal = false;
    this.projectStatusForm.reset();
  }

  saveAndCloseProjectStatus(): void {
    if (this.projectStatusForm.invalid) {
      Object.values(this.projectStatusForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    this.isSavingProjectStatus = true;
    const stt = this.projectStatusForm.get('stt')?.value;
    const statusName = this.projectStatusForm.get('statusName')?.value;

    this.dailyReportSaleService.saveProjectStatus(stt, statusName).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Thêm trạng thái dự án thành công!');
          this.loadProjectStatuses();
          this.showProjectStatusModal = false;
          this.projectStatusForm.reset();
        } else {
          this.notification.error('Lỗi', response.message || 'Thêm trạng thái dự án thất bại!');
        }
        this.isSavingProjectStatus = false;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi thêm trạng thái dự án!');
        this.isSavingProjectStatus = false;
      }
    });
  }

  onAddPart(index: number): void {
    const customerId = this.reports.at(index).get('customerId')?.value;
    if (!customerId || customerId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Khách hàng trước!');
      return;
    }

    const modalRef = this.modalService.open(CustomerPartComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.componentInstance.customerId = customerId;

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadCustomerParts(customerId, index);
        }
      },
      (reason) => console.log('Modal closed:', reason)
    );
  }

  loadProductCustomer(index: number): void {
    if (this.isLoading) return;

    const group = this.reports.at(index);
    const userId = group.get('userId')?.value;
    const projectId = group.get('projectId')?.value;

    if (!userId || userId <= 0 || !projectId || projectId <= 0) return;

    this.dailyReportSaleService.getLatestDailyReportSale(userId, projectId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const productOfCustomer = response.data.ProductOfCustomer || '';
          group.patchValue({ productOfCustomer }, { emitEvent: false });
        }
      },
      error: (error) => console.error('Error loading latest DailyReportSale:', error)
    });

    this.dailyReportSaleService.getLatestFollowProjectBase(projectId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const followProject = response.data;
          group.patchValue({
            firmId: followProject.FirmBaseID || null,
            projectTypeId: followProject.ProjectTypeBaseID || null
          }, { emitEvent: false });
        }
      },
      error: (error) => console.error('Error loading latest FollowProjectBase:', error)
    });
  }

  onProjectChange(projectId: number | null, index: number): void {
    if (this.isLoading) return;

    if (projectId && projectId > 0) {
      this.projectService.getProject(projectId).subscribe({
        next: (response) => {
          if (response.status === 1 && response.data) {
            const project = response.data;
            const group = this.reports.at(index);

            group.patchValue({ customerId: project.CustomerID || null });

            this.projectStatusOldMap[index] = project.ProjectStatus || 0;
            group.patchValue({ projectStatusId: this.projectStatusOldMap[index] }, { emitEvent: false });

            this.loadProductCustomer(index);
          }
        },
        error: (error) => console.error('Error loading project:', error)
      });
    } else {
      this.projectStatusOldMap[index] = 0;
    }
  }

  loadProjectStatusForEdit(projectId: number | null, index: number): void {
    if (!projectId || projectId <= 0) return;
    this.projectService.getProject(projectId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const project = response.data;
          this.projectStatusOldMap[index] = project.ProjectStatus || 0;
          this.reports.at(index).patchValue({
            projectStatusId: this.projectStatusOldMap[index]
          }, { emitEvent: false });
        }
      },
      error: (error) => console.error('Error loading project for edit:', error)
    });
  }

  onProjectStatusChange(projectStatusId: number | null, index: number): void {
    if (this.isLoading) return;

    const projectId = this.reports.at(index).get('projectId')?.value;

    if (!projectId || projectId <= 0 || !projectStatusId || projectStatusId <= 0) {
      this.showDateStatusLogModalMap[index] = false;
      return;
    }

    if (this.projectStatusOldMap[index] === projectStatusId) {
      this.showDateStatusLogModalMap[index] = false;
      return;
    }

    if (this.projectStatusOldMap[index] > 0 && this.projectStatusOldMap[index] !== projectStatusId) {
      this.showDateStatusLogModalMap[index] = true;
    }
  }

  onDateStatusLogOk(index: number): void {
    const dateStatusLog = this.reports.at(index).get('dateStatusLog')?.value;
    if (!dateStatusLog) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày thay đổi trạng thái');
      return;
    }
    this.showDateStatusLogModalMap[index] = false;
  }

  onDateStatusLogCancel(index: number): void {
    this.reports.at(index).patchValue({
      projectStatusId: this.projectStatusOldMap[index],
      dateStatusLog: null
    }, { emitEvent: false });
    this.showDateStatusLogModalMap[index] = false;
  }

  getFormData(group: FormGroup, index: number): any {
    const formValue = group.getRawValue();
    const employeeId = this.appUserService.employeeID || 0;

    const formatDate = (date: any): string => {
      if (!date) return '';
      if (date instanceof Date) return date.toISOString();
      if (typeof date === 'string') return new Date(date).toISOString();
      return '';
    };

    return {
      ID: formValue.id || 0,
      projectId: formValue.projectId || 0,
      customerId: formValue.customerId || 0,
      warehouseId: this.warehouseId || 0,
      projectStatusBaseId: formValue.projectStatusId || 0,
      userId: formValue.userId || 0,
      dateStart: formatDate(formValue.dateStart),
      dateEnd: formValue.dateEnd ? formatDate(formValue.dateEnd) : null,
      firmId: formValue.firmId || 0,
      projectTypeId: formValue.projectTypeId || 0,
      contactId: formValue.contactId || 0,
      groupTypeId: formValue.groupTypeId || 0,
      partId: formValue.partId || null,
      bigAccount: formValue.bigAccount || false,
      saleOpportunity: formValue.saleOpportunity || false,
      content: (formValue.content || '').trim(),
      result: (formValue.result || '').trim(),
      problemBacklog: (formValue.problemBacklog || '').trim(),
      planNext: (formValue.planNext || '').trim(),
      productOfCustomer: (formValue.productOfCustomer || '').trim(),
      projectStatusOld: this.projectStatusOldMap[index] || 0,
      employeeId: employeeId,
      dateStatusLog: formValue.dateStatusLog ? formatDate(formValue.dateStatusLog) : new Date().toISOString(),
    };
  }

  validateForm(): boolean {
    for (let i = 0; i < this.reports.length; i++) {
      const group = this.reports.at(i) as FormGroup;
      const formValue = group.getRawValue();
      const prefix = this.reports.length > 1 ? `[Bản ghi ${i + 1}] ` : '';

      if (!formValue.userId || formValue.userId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Xin vui lòng nhập Người phụ trách.`);
        return false;
      }

      // Validate dateStart trong 3 ngày gần nhất
      if (!formValue.dateStart) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng chọn Ngày thực hiện!`);
        return false;
      }
      const dateStart = new Date(formValue.dateStart);
      dateStart.setHours(0, 0, 0, 0);
      if (dateStart < this.minDateStart || dateStart > this.maxDateStart) {
        const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        this.notification.warning('Cảnh báo', `${prefix}Chỉ được báo cáo trong 3 ngày gần nhất (${formatDate(this.minDateStart)} - ${formatDate(this.maxDateStart)})`);
        return false;
      }

      if (!formValue.customerId || formValue.customerId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Xin vui lòng nhập Khách hàng.`);
        return false;
      }
      if (!formValue.groupTypeId || formValue.groupTypeId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Xin vui lòng nhập Loại nhóm!`);
        return false;
      }
      if (!formValue.content || !formValue.content.trim()) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Việc đã làm!`);
        return false;
      }
      if (!formValue.result || !formValue.result.trim()) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Kết quả!`);
        return false;
      }
      if (!formValue.planNext || !formValue.planNext.trim()) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Kế hoạch ngày tiếp theo!`);
        return false;
      }
      if (!formValue.productOfCustomer || !formValue.productOfCustomer.trim()) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Sản phẩm của KH!`);
        return false;
      }
      if (!formValue.firmId || formValue.firmId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Hãng!`);
        return false;
      }
      if (!formValue.projectTypeId || formValue.projectTypeId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Loại dự án!`);
        return false;
      }
      if (!formValue.contactId || formValue.contactId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Liên hệ!`);
        return false;
      }
      if (!formValue.projectStatusId || formValue.projectStatusId <= 0) {
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng nhập Trạng thái dự án!`);
        return false;
      }

      const projectStatusNew = formValue.projectStatusId;
      if (!formValue.dateStatusLog && this.projectStatusOldMap[i] > 0 && this.projectStatusOldMap[i] !== projectStatusNew) {
        this.showDateStatusLogModalMap[i] = true;
        this.notification.warning('Cảnh báo', `${prefix}Vui lòng chọn Ngày thay đổi trạng thái!`);
        return false;
      }
    }

    return true;
  }

  closeModal() {
    this.activeModal.close();
  }

  saveAndClose() {
    this.isSubmitted = true;

    if (!this.validateForm() || this.dailyReportSaleForm.invalid) {
      this.notification.error('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc cho tất cả các bản ghi');
      return;
    }

    this.isSaving = true;

    const saveObservables = this.reports.controls.map((group, index) => {
      const dto = this.getFormData(group as FormGroup, index);
      return this.dailyReportSaleService.save(dto);
    });

    forkJoin(saveObservables).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (responses) => {
        const hasError = responses.some(res => res.status !== 1);
        if (hasError) {
          this.notification.warning('Cảnh báo', 'Một số bản ghi không thể lưu dữ liệu thành công.');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.success('Thành công', 'Lưu dữ liệu thành công toàn bộ bản ghi');
          this.activeModal.close({ success: true, reloadData: true });
        }
      },
      error: (error) => {
        console.error('Error saving daily report sales:', error);
        const errorMsg = error.error?.data?.message || error.error?.message || 'Có lỗi kết nối khi lưu dữ liệu';
        this.notification.error('Lỗi', errorMsg);
      }
    });

  }
}
