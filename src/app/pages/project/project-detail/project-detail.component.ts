import { ProjectPriorityDetailComponent } from './../project-priority-detail/project-priority-detail.component';
import { ProjectTechnologyFormComponent } from '../project-application-types/project-technology-form/project-technology-form.component';
import { ProjectApplicationTypesFormComponent } from '../project-application-types/project-application-types-form/project-application-types-form.component';
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../project-service/project.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { SelectLeaderComponent } from '../project-control/select-leader.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { ProjectStatusDetailComponent } from '../project-status-detail/project-status-detail.component';
import { SelectProjectEmployeeGroupComponent } from '../project-control/select-project-employee-group';
import { CustomerDetailComponent } from '../../crm/customers/customer-detail/customer-detail.component';

import { FirmBaseDetailComponent } from '../firmbase-detail/firm-base-detail.component';
import { SelectApplicationTypeComponent } from '../project-control/select-application-type.component';
import { SelectTechnologyComponent } from '../project-control/select-technology.component';
import { combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AuthService } from '../../../auth/auth.service';
import { TreeTableModule } from 'primeng/treetable';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { CustomTreeTable } from '../../../shared/custom-tree-table/custom-tree-table';
import { TreeColumnDef } from '../../../shared/custom-tree-table/tree-column-def.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzTabsModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    TreeTableModule,
    CheckboxModule,
    MultiSelectModule,
    SelectModule,
    CustomTreeTable
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
})
export class ProjectDetailComponent implements OnInit, AfterViewInit {
  //#region Khai báo các biến
  @Input() projectId: any;
  @ViewChild('dateChangeStatus', { static: false })
  dateChangeStatusContainer!: TemplateRef<any>;

  projectIdleader: any = 0;

  projectTypeNodes: TreeNode[] = [];
  selectedTypeNodes: TreeNode[] = [];
  projectTypeCols: TreeColumnDef[] = [];

  projectTypeNodesDetail: TreeNode[] = [];
  selectedTypeNodesDetail: TreeNode[] = [];
  projectTypeDetailCols: TreeColumnDef[] = [];

  customers: any[] = [];
  users: any[] = [];
  statuses: any[] = [];
  pms: any[] = [];
  firmBases: any[] = [];
  projectTypeBases: any[] = [];
  customerIndustries: any[] = [];

  listPriorities: any;
  projectCode: any;
  customerId: any;
  userSaleId: any;
  userTechId: any;
  oldStatusId: any = 0;
  pmId: any;
  firmBaseId: any;
  projectTypeBaseId: any;
  endUserId: any;
  prjTypeBaseId: any;
  priority: any;
  projectTypeId: any = 1;
  projectName: any;
  note: any;
  currentState: any;
  createDate: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toFormat('yyyy-MM-dd');
  // Ngày dự kiến
  expectedPlanDate: any;
  expectedQuotationDate: any;
  expectedPODate: any;
  expectedProjectEndDate: any;

  // Ngày thực tế
  realityPlanDate: any;
  realityQuotationDate: any;
  realityPODate: any;
  realityProjectEndDate: any;
  isRealityProjectEndDateLocked = false;

  readonly STATUS_MAINTENANCE = 6;
  readonly STATUS_FINISHED = 9;

  // Ngày thay đổi trạng thái
  dateChangeStatus: string | null = null;
  tempDateChangeStatus: string | null = null;
  projectUserTeams: any[] = [];
  projectStatus: any;
  projectStatusIdDetail: any;
  projects: any;
  situlator: any;

  projectStatusId: any;
  projectContactName: any;
  currentTab: any = 0;

  dictLeader: { [key: number]: string } = {};
  applicationTypes: any[] = [];
  technologies: any[] = [];
  dictApplicationTypes: { [key: number]: string } = {};
  dictTechnologies: { [key: number]: string } = {};

  leaderLookupConfig: any;
  appLookupConfig: any;
  techLookupConfig: any = {};

  currentUser: any = {};
  // Form validation
  formGroup: FormGroup;
  isSaving: boolean = false;
  //#endregion

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.formGroup = this.fb.group({
      customerId: [null, [Validators.required]],
      projectCode: [{ value: '', disabled: true }, [Validators.required]],
      createdDate: [DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toFormat('yyyy-MM-dd')],
      projectName: ['', [Validators.required]],
      userSaleId: [null, [Validators.required]],
      userTechId: [null, [Validators.required]],
      projectStatusId: [null],
      pmId: [null, [Validators.required]],
      endUserId: [null, [Validators.required]],
      customerIndustryId: [{ value: null, disabled: true }],
      endUserIndustryId: [{ value: null, disabled: true }],
      firmBaseId: [null],
      prjTypeBaseId: [null],
      expectedPlanDate: [null, [Validators.required]],
      expectedQuotationDate: [null, [Validators.required]],
      expectedPODate: [null],
      expectedProjectEndDate: [null],
      realityPlanDate: [null],
      realityQuotationDate: [null],
      realityPODate: [null],
      realityProjectEndDate: [null],
      projectContactName: [''],
      priority: [{ value: '', disabled: true }, [Validators.required]],
      projectTypeId: [1, [Validators.required]],
      note: [''],
      currentState: [''],
      projectIdleader: [null, [Validators.required]],
      projectStatusIdDetail: [null, [Validators.required]],
      situlatorDetail: [''],
      dateChangeStatus: [null]
    });
  }

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    // Đồng bộ dữ liệu từ form controls với các biến
    this.formGroup.get('customerId')?.valueChanges.subscribe(value => {
      this.customerId = value;
      this.syncIndustry(value, 'customerIndustryId');
    });
    this.formGroup.get('projectName')?.valueChanges.subscribe(value => {
      this.projectName = value;
    });
    this.formGroup.get('userSaleId')?.valueChanges.subscribe(value => {
      this.userSaleId = value;
    });
    this.formGroup.get('userTechId')?.valueChanges.subscribe(value => {
      this.userTechId = value;
    });
    this.formGroup.get('pmId')?.valueChanges.subscribe(value => {
      this.pmId = value;
    });
    this.formGroup.get('endUserId')?.valueChanges.subscribe(value => {
      this.endUserId = value;
      this.syncIndustry(value, 'endUserIndustryId');
    });
    this.formGroup.get('expectedPlanDate')?.valueChanges.subscribe(value => {
      this.expectedPlanDate = value;
    });
    this.formGroup.get('expectedQuotationDate')?.valueChanges.subscribe(value => {
      this.expectedQuotationDate = value;
    });
    this.formGroup.get('priority')?.valueChanges.subscribe(value => {
      this.priority = value;
    });
    this.formGroup.get('projectTypeId')?.valueChanges.subscribe(value => {
      this.projectTypeId = value;
    });
    this.formGroup.get('expectedPODate')?.valueChanges.subscribe(value => {
      this.expectedPODate = value;
    });
    this.formGroup.get('expectedProjectEndDate')?.valueChanges.subscribe(value => {
      this.expectedProjectEndDate = value;
    });
    this.formGroup.get('realityPlanDate')?.valueChanges.subscribe(value => {
      this.realityPlanDate = value;
    });
    this.formGroup.get('realityQuotationDate')?.valueChanges.subscribe(value => {
      this.realityQuotationDate = value;
    });
    this.formGroup.get('realityPODate')?.valueChanges.subscribe(value => {
      this.realityPODate = value;
    });
    this.formGroup.get('realityProjectEndDate')?.valueChanges.subscribe(value => {
      this.realityProjectEndDate = value;
    });
    this.formGroup.get('note')?.valueChanges.subscribe(value => {
      this.note = value;
    });
    this.formGroup.get('currentState')?.valueChanges.subscribe(value => {
      this.currentState = value;
    });
    this.formGroup.get('firmBaseId')?.valueChanges.subscribe(value => {
      this.firmBaseId = value;
    });
    this.formGroup.get('prjTypeBaseId')?.valueChanges.subscribe(value => {
      this.prjTypeBaseId = value;
    });
    this.formGroup.get('projectContactName')?.valueChanges.subscribe(value => {
      this.projectContactName = value;
    });
    // Theo dõi customerId và projectTypeId
    // combineLatest([
    //   this.formGroup.get('customerId')!.valueChanges,
    //   this.formGroup.get('projectTypeId')!.valueChanges,
    //   this.formGroup.get('endUserId')!.valueChanges,
    // ]).pipe(
    //   debounceTime(200),
    //   filter(([cid, tid]) => !!cid && this.customers.length > 0),
    //   distinctUntilChanged()
    // ).subscribe(() => {
    //   debugger
    //   this.getProjectCode();
    // });
    this.initTableColumns();
  }

  ngAfterViewInit(): void {
    this.getProject();
    this.getStatuses();
    this.getCustomers();
    this.getCustomerIndustries();
    this.getPms();
    this.getFirmBase();
    this.getProjectTypeBase();
    this.getApplicationTypes();
    this.getTechnologies();
    this.getCurrentUser();
    this.getUserTeams();
    this.getProjectLeader();
    this.getProjectStatus();
    this.getProjectTypeLinks();
    this.getProjectTypeLinksDetail();
    this.getFollowProjectBase();
    this.getUsers();
    this.initLookupConfigs();
    this.initTableColumns();
    this.loadProject(this.projectId);
    this.projectIdleader = this.projectId;
  }
  //#endregion

  initTableColumns() {
    this.projectTypeCols = [
      { field: 'ProjectTypeName', header: 'Kiểu dự án', treeToggler: true, width: '200px' },
      { field: 'FullName', header: 'Leader', width: '150px' },
      {
        field: 'ApplicationTypeIDs', header: 'Kiểu ứng dụng',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'table-lookup',
        editLookupConfig: this.appLookupConfig
      },
      {
        field: 'TechnologyIDs', header: 'Công nghệ ứng dụng',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'table-lookup',
        editLookupConfig: this.techLookupConfig
      }
    ];

    this.projectTypeDetailCols = [
      { field: 'ProjectTypeName', header: 'Kiểu dự án', treeToggler: true },
      {
        field: 'LeaderID', header: 'Leader', width: '250px',
        editable: true,
        isEditable: (rowData) => true,
        editType: 'lookup',
        cssClass: 'app-leader',
        editOptions: [] // Will be populated with projectUserTeams
      },
      {
        field: 'ApplicationTypeIDs', header: 'Kiểu ứng dụng', width: '250px',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'multiselect',
        editOptions: []
      },
      {
        field: 'TechnologyIDs', header: 'Công nghệ ứng dụng', width: '250px',
        editable: true,
        isEditable: (rowData) => !!rowData.Selected,
        cellClass: (rowData) => !rowData.Selected ? 'cell-disabled' : '',
        editType: 'multiselect',
        editOptions: []
      }
    ];
  }

  initLookupConfigs() {
    this.leaderLookupConfig = {
      data: this.projectUserTeams,
      columns: [
        { field: 'Code', header: 'Mã nhân viên', width: '120px' },
        { field: 'FullName', header: 'Họ tên' }
      ],
      valueField: 'EmployeeID',
      displayField: 'FullName'
    };

    this.appLookupConfig = {
      data: this.applicationTypes,
      multiSelect: true,
      columns: [
        { field: 'ApplicationName', header: 'Tên kiểu ứng dụng' }
      ],
      valueField: 'ID',
      displayField: 'ApplicationName',
      // TN.Bình update 15/04/26: Thêm action mở modal thêm mới kiểu ứng dụng
      addAction: (rowData: any) => this.openAddApplicationTypeModal(rowData),
      loadData: (query: string, rowData?: any) => {
        const typeId = rowData?.ProjectTypeID || rowData?.ID;
        let filtered = this.applicationTypes.filter(x => x.ProjectTypeID === typeId);
        if (query) {
          query = query.toLowerCase();
          filtered = filtered.filter(x => x.ApplicationName?.toLowerCase().includes(query));
        }
        return filtered;
      }
    };

    this.techLookupConfig = {
      data: this.technologies,
      multiSelect: true,
      columns: [
        { field: 'TechnologyName', header: 'Tên công nghệ' }
      ],
      valueField: 'ID',
      displayField: 'TechnologyName',
      // TN.Bình update 15/04/26: Thêm action mở modal thêm mới công nghệ
      addAction: (rowData: any) => this.openAddTechnologyModal(rowData),
      loadData: (query: string, rowData?: any) => {
        const typeId = rowData?.ProjectTypeID || rowData?.ID;
        let filtered = this.technologies.filter(x => x.ProjectTypeID === typeId);
        if (query) {
          query = query.toLowerCase();
          filtered = filtered.filter(x => x.TechnologyName?.toLowerCase().includes(query));
        }
        return filtered;
      }
    };
  }

  updateColumnOptions() {
    // No longer needed to populate editOptions for dropdowns as we use table-lookup
    // But we update the static data in the lookup configs
    if (this.leaderLookupConfig) this.leaderLookupConfig.data = this.projectUserTeams;
    if (this.appLookupConfig) this.appLookupConfig.data = this.applicationTypes;
    if (this.techLookupConfig) this.techLookupConfig.data = this.technologies;
  }

  handleCellValueChange(event: any) {
    // Optional logic to trigger dirty checking if needed, otherwise cell binding handles the model update
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
      // Gọi getProjectCurrentSituation() sau khi currentUser đã được load
      this.getProjectCurrentSituation();
    });
  }
  //#region load dữ liệu từ API
  getApplicationTypes() {
    this.projectService.getApplicationTypes().subscribe({
      next: (res: any) => {
        this.applicationTypes = res.data;
        this.applicationTypes.forEach((item: any) => {
          this.dictApplicationTypes[item.ID] = item.ApplicationName;
        });
        this.updateColumnOptions();
      }
    });
  }

  getTechnologies() {
    this.projectService.getTechnologies().subscribe({
      next: (res: any) => {
        this.technologies = res.data;
        this.technologies.forEach((item: any) => {
          this.dictTechnologies[item.ID] = item.TechnologyName;
        });
        this.updateColumnOptions();
      }
    });
  }
  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response.data;
        // Thực hiện đồng bộ industry sau khi đã có danh sách khách hàng
        const customerId = this.formGroup.get('customerId')?.value;
        const endUserId = this.formGroup.get('endUserId')?.value;
        if (customerId) this.syncIndustry(customerId, 'customerIndustryId');
        if (endUserId) this.syncIndustry(endUserId, 'endUserIndustryId');
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getCustomerIndustries() {
    this.projectService.getCustomerIndustries().subscribe({
      next: (response: any) => {
        this.customerIndustries = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
      },
    });
  }

  syncIndustry(customerId: any, targetControl: string) {
    if (!customerId || this.customers.length === 0) {
      this.formGroup.get(targetControl)?.patchValue(null);
      return;
    }
    const customer = this.customers.find(x => x.ID === customerId);
    if (customer && customer.CustomerIndustriesID) {
      this.formGroup.get(targetControl)?.patchValue(customer.CustomerIndustriesID);
    } else {
      this.formGroup.get(targetControl)?.patchValue(null);
    }
  }

  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
        console.log(this.users);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  //hàm gọi modal firm
  openModalFirmBase() {
    const modalRef = this.modalService.open(FirmBaseDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.getFirmBase()
        }
      },
    );
  }
  //end
  getStatuses() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.statuses = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getFirmBase() {
    this.projectService.getFirmBases().subscribe({
      next: (response: any) => {
        this.firmBases = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectTypeBase() {
    this.projectService.getProjectTypeBases().subscribe({
      next: (response: any) => {
        this.projectTypeBases = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProject() {
    if (this.projectId > 0) {
      this.projectService.getProject(this.projectId).subscribe({
        next: (response: any) => {
          console.log('binh log', response.data);
          this.projectCode = response.data.ProjectCode;
          this.projectName = response.data.ProjectName;
          this.note = response.data.Note;
          this.customerId = response.data.CustomerID;
          this.userSaleId = response.data.UserID;
          this.userTechId = response.data.UserTechnicalID;

          // Cập nhật form values
          this.formGroup.patchValue({
            customerId: response.data.CustomerID,
            projectName: response.data.ProjectName,
            userSaleId: response.data.UserID,
            userTechId: response.data.UserTechnicalID,
            projectCode: response.data.ProjectCode,
            note: response.data.Note ?? '',
          });
          this.createDate = DateTime.fromISO(response.data.CreatedDate)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .toFormat('yyyy-MM-dd');

          this.projectStatusId = response.data.ProjectStatus;
          this.oldStatusId = response.data.ProjectStatus;
          this.pmId = response.data.ProjectManager;
          this.currentState = response.data.CurrentState;
          this.endUserId = response.data.EndUser;
          this.priority = response.data.Priotity;
          this.projectTypeId =
            response.data.TypeProject <= 0 ? 1 : response.data.TypeProject;

          // Cập nhật thêm form values
          this.formGroup.patchValue({
            pmId: response.data.ProjectManager,
            endUserId: response.data.EndUser,
            priority: response.data.Priotity,
            projectTypeId: response.data.TypeProject <= 0 ? 1 : response.data.TypeProject,
            projectIdleader: response.data.ID,
            projectStatusIdDetail: response.data.ProjectStatus,
            projectStatusId: response.data.ProjectStatus, // Cập nhật projectStatusId vào form
            createdDate: this.createDate,
            currentState: response.data.CurrentState ?? '',
          });
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  getFollowProjectBase() {
    if (this.projectId > 0) {
      this.projectService.getFollowProjectBases(this.projectId).subscribe({
        next: (res: any) => {
          this.firmBaseId = res.data.FirmBaseID;
          this.prjTypeBaseId = res.data.ProjectTypeBaseID;
          this.projectContactName = res.data.ProjectContactName;

          this.expectedPlanDate = res.data.ExpectedPlanDate
            ? DateTime.fromISO(res.data.ExpectedPlanDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.expectedQuotationDate = res.data.ExpectedQuotationDate
            ? DateTime.fromISO(res.data.ExpectedQuotationDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;

          // Cập nhật form values cho ngày và các combo
          this.formGroup.patchValue({
            expectedPlanDate: this.expectedPlanDate,
            expectedQuotationDate: this.expectedQuotationDate,
            firmBaseId: res.data.FirmBaseID ?? null,
            prjTypeBaseId: res.data.ProjectTypeBaseID ?? null,
            projectContactName: res.data.ProjectContactName ?? '',
          });
          this.expectedPODate = res.data.ExpectedPODate
            ? DateTime.fromISO(res.data.ExpectedPODate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.expectedProjectEndDate = res.data.ExpectedProjectEndDate
            ? DateTime.fromISO(res.data.ExpectedProjectEndDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;

          this.realityPlanDate = res.data.RealityPlanDate
            ? DateTime.fromISO(res.data.RealityPlanDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.realityQuotationDate = res.data.RealityQuotationDate
            ? DateTime.fromISO(res.data.RealityQuotationDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.realityPODate = res.data.RealityPODate
            ? DateTime.fromISO(res.data.RealityPODate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;
          this.realityProjectEndDate = res.data.RealityProjectEndDate
            ? DateTime.fromISO(res.data.RealityProjectEndDate)
              .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
              .toFormat('yyyy-MM-dd')
            : null;

          this.formGroup.patchValue({
            expectedPODate: this.expectedPODate,
            expectedProjectEndDate: this.expectedProjectEndDate,
            realityPlanDate: this.realityPlanDate,
            realityQuotationDate: this.realityQuotationDate,
            realityPODate: this.realityPODate,
            realityProjectEndDate: this.realityProjectEndDate,
          });

          this.setRealityProjectEndDateLocked(!!this.realityProjectEndDate);
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  private setRealityProjectEndDateLocked(locked: boolean): void {
    this.isRealityProjectEndDateLocked = locked;
    const control = this.formGroup.get('realityProjectEndDate');
    if (!control) {
      return;
    }

    if (locked) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

  getProjectCode() {
    if (this.customers.length <= 0) return;

    // Lấy giá trị từ form controls

    const customerId = this.formGroup.get('customerId')?.value;
    const projectTypeId = this.formGroup.get('projectTypeId')?.value;

    if (!customerId) return;

    const customer = (this.customers as any[]).find(
      (x) => x.ID === customerId
    );

    if (!customer || customer.CustomerShortName == '') {
      this.notification.error(
        '',
        'Khách hàng đang không có tên kí hiệu. Xin vui lòng thêm thông tin tên kí hiệu!',
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      this.projectCode = '';
      this.formGroup.patchValue({ projectCode: '' });
      return;
    }
    if (this.projectId == 0) {
      if (this.customers.length > 0) {
        this.projectService
          .getProjectCodeModal(
            this.projectId,
            customer.CustomerShortName,
            projectTypeId || 1
          )
          .subscribe({
            next: (response: any) => {
              this.projectCode = response.data;
              console.log("hshs", this.projectCode)
              this.formGroup.patchValue({ projectCode: response.data });
              const endUserId = this.formGroup.get('endUserId')?.value;
              if (!endUserId) {
                this.formGroup.patchValue({ endUserId: customerId });
              }
            },
            error: (error: any) => {
              const msg = error.message || 'Lỗi không xác định';
              this.notification.error(NOTIFICATION_TITLE.error, msg);
              console.error('Lỗi:', error.error);
            },
          });
      }
    } else {
      let currentCode = this.formGroup.get('projectCode')?.value || '';
      if (!currentCode) return;

      // Xử lý prefix dựa trên projectTypeId
      let newCode = this.updateProjectCodePrefix(currentCode, projectTypeId);

      this.projectCode = newCode;
      this.formGroup.patchValue({ projectCode: newCode });
    }
  }
  // Hàm xử lý thêm/bỏ prefix
  private updateProjectCodePrefix(currentCode: string, projectTypeId: number): string {
    // Loại bỏ các prefix hiện có (TM. hoặc F.)
    let coreCode = currentCode.replace(/^(TM\.|F\.|NB\.|)/, '');

    // Thêm prefix mới dựa trên projectTypeId
    switch (projectTypeId) {
      case 2: // Loại TM
        return `TM.${coreCode}`;
      case 3: // Loại F
        return `F.${coreCode}`;
      case 4: // Loại NB
        return `NB.${coreCode}`;
      default: // Loại thường (1 hoặc các giá trị khác)
        return coreCode;
    }
  }

  getDayChange() {
    const projectStatusId = this.formGroup.get('projectStatusId')?.value;

    // Cập nhật projectStatusId từ form
    this.projectStatusId = projectStatusId;

    if (projectStatusId == this.oldStatusId || this.projectId <= 0) {
      // Nếu trạng thái không thay đổi, reset dateChangeStatus
      this.dateChangeStatus = null;
      return;
    }

    this.openDateChangeStatusModal({
      okText: 'Xác nhận',
      onCancel: () => {
        this.formGroup.patchValue({ projectStatusId: this.oldStatusId });
        this.projectStatusId = this.oldStatusId;
        this.dateChangeStatus = null;
        this.tempDateChangeStatus = null;
      },
      onOk: (selected: Date) => {
        this.tryAutoFillRealityProjectEndDate(selected);
        console.log('dateChangeStatus confirmed:', this.dateChangeStatus);
      },
    });
  }

  private openDateChangeStatusModal(config: {
    okText: string;
    onCancel: () => void;
    onOk: (selected: Date) => void;
  }): void {
    this.dateChangeStatus = null;
    this.tempDateChangeStatus = DateTime.local().toFormat('yyyy-MM-dd');

    const modalRef = this.modal.create({
      nzContent: this.dateChangeStatusContainer,
      nzFooter: [
        {
          label: 'Hủy',
          type: 'default',
          nzDanger: true,
          onClick: () => {
            config.onCancel();
            modalRef.close();
          },
        },
        {
          label: config.okText,
          type: 'primary',
          onClick: () => {
            const selected = this.tempDateChangeStatus
              ? DateTime.fromISO(this.tempDateChangeStatus).toJSDate()
              : null;
            if (!selected || isNaN(selected.getTime())) {
              console.log('tempDateChangeStatus value:', this.tempDateChangeStatus, 'type:', typeof this.tempDateChangeStatus);
              this.notification.error(
                '',
                'Vui lòng chọn ngày thay đổi trạng thái!',
                {
                  nzStyle: { fontSize: '0.75rem' },
                }
              );
              return;
            }

            this.dateChangeStatus = this.tempDateChangeStatus;
            config.onOk(selected);
            modalRef.close();
          },
        },
      ],
    });
  }

  private isAutoFillRealityEndDateStatus(statusId: number): boolean {
    return statusId === this.STATUS_MAINTENANCE || statusId === this.STATUS_FINISHED;
  }

  private tryAutoFillRealityProjectEndDate(dateLog: Date): void {
    const statusId = this.formGroup.get('projectStatusId')?.value;
    if (!this.isAutoFillRealityEndDateStatus(statusId)) {
      return;
    }

    // Chỉ fill nếu ngày kết thúc thực tế đang trống (giống WinForm)
    if (!this.realityProjectEndDate) {
      this.realityProjectEndDate = dateLog;
      this.formGroup.patchValue({ realityProjectEndDate: dateLog });
    }
  }

  getProjectLeader() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projectStatus = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getProjectCurrentSituation() {
    // Đảm bảo currentUser đã được load trước khi gọi API
    if (!this.currentUser || !this.currentUser.EmployeeID) {
      // Nếu currentUser chưa có, đợi một chút rồi thử lại hoặc bỏ qua
      return;
    }
    this.projectService
      .getProjectCurrentSituation(
        this.projectIdleader,
        this.currentUser.EmployeeID || 0
      )
      .subscribe({
        next: (response: any) => {
          this.situlator = response.data;
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          console.error('Lỗi:', error.error);
        },
      });
  }

  getUserTeams() {
    this.projectService.getUserTeams().subscribe({
      next: (response: any) => {
        this.projectUserTeams = response.data;
        this.updateColumnOptions();
        this.getProjectTypeLinksDetail();
        this.createLabelsFromData();
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  loadProject(projectId: number) {
    if (projectId > 0) {
      this.projectService.getProject(projectId).subscribe({
        next: (response: any) => {
          if (response.data) {

            if (this.projectId == this.projectIdleader) {
              this.projectStatusId = response.data.ProjectStatus;

            } else {
              this.projectStatusIdDetail = response.data.ProjectStatus;

            }
          }
        },
        error: (error: any) => {
          const msg = error.message || 'Lỗi không xác định';
          this.notification.error(NOTIFICATION_TITLE.error, msg);
          console.error('Lỗi:', error.error);
        },
      });
    }
  }

  onDateChange(date: any) {
    this.dateChangeStatus = date;
    console.log(this.dateChangeStatus);
  }

  onDateChangeStatusChange(date: any) {
    // Hàm này được gọi khi date picker trong modal thay đổi
    this.tempDateChangeStatus = date;
    console.log('onDateChangeStatusChange - date:', this.tempDateChangeStatus, 'type:', typeof this.tempDateChangeStatus);
  }

  private coerceToDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    try {
      // hỗ trợ trường hợp value là object có toDate()
      if (typeof value?.toDate === 'function') {
        const d = value.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d : null;
      }
    } catch {
      // ignore
    }
    return null;
  }

  // Hàm helper để kiểm tra dateChangeStatus có giá trị hợp lệ không
  private isValidDateChangeStatus(): boolean {
    if (!this.dateChangeStatus) return false;
    const d = DateTime.fromISO(this.dateChangeStatus);
    return d.isValid;
  }

  saveDataProject() {
    this.isSaving = true;
    // Kiểm tra mã dự án nếu đang edit
    if (this.projectId > 0) {
      this.projectService
        .checkProjectCode(this.projectId, this.projectCode)
        .subscribe({
          next: (response: any) => {
            if (response.data == 0) {
              this.isSaving = false;
              this.notification.error('Thông báo', 'Mã dự án đã tồn tại. Vui lòng kiểm tra lại!');
              return;
            } else {
              this.save();
            }
          },
          error: (error: any) => {
            this.isSaving = false;
            const msg = error.message || 'Lỗi không xác định';
            this.notification.error(NOTIFICATION_TITLE.error, msg);
            console.error('Lỗi:', error.error);
          },
        });
    } else {
      this.save();
    }
  }

  save() {
    const projectTypeLinks = this.getSelectedData(this.projectTypeNodes);

    // Kiểm tra mã dự án
    if (!this.projectCode) {
      this.isSaving = false;
      this.notification.error('Thông báo', 'Vui lòng nhập mã dự án');
      return;
    }

    console.log('prjtypelink', projectTypeLinks);

    // Kiểm tra kiểu dự án
    if (projectTypeLinks.length == 0 && this.projectTypeId <= 1) {
      this.isSaving = false;
      this.notification.error('Thông báo', 'Vui lòng chọn kiểu dự án!');
      return;
    }

    // Lấy projectStatusId từ form để đảm bảo giá trị mới nhất
    const currentProjectStatusId = this.formGroup.get('projectStatusId')?.value;
    this.projectStatusId = currentProjectStatusId;

    // Kiểm tra nếu trạng thái đã thay đổi nhưng chưa có ngày thay đổi
    if (
      !this.dateChangeStatus &&
      this.oldStatusId != currentProjectStatusId &&
      this.projectId > 0
    ) {
      this.openDateChangeStatusModal({
        okText: 'Lưu',
        onCancel: () => {
          this.isSaving = false;
          this.dateChangeStatus = null;
          this.tempDateChangeStatus = null;
        },
        onOk: (selected: Date) => {
          this.tryAutoFillRealityProjectEndDate(selected);
          console.log('dateChangeStatus confirmed in save:', this.dateChangeStatus);
          this.continueSave(projectTypeLinks);
        },
      });
      return; // Dừng lại, không tiếp tục lưu
    }

    // Tiếp tục lưu dữ liệu nếu đã có dateChangeStatus hoặc không cần kiểm tra
    this.continueSave(projectTypeLinks);
  }

  continueSave(projectTypeLinks: any[]) {

    // console.log(
    //   DateTime.fromJSDate(new Date(this.dateChangeStatus)).isValid
    //     ? DateTime.fromJSDate(new Date(this.dateChangeStatus)).toISO()
    //     : null
    // );

    const dataSave: any = {
      projectStatusOld: this.oldStatusId ?? 0,
      project: {
        ID: this.projectId ?? 0,
        ProjectCode: this.projectCode ?? '',
        ProjectName: this.projectName ?? '',
        ProjectStatus: this.projectStatusId ?? 0,
        Note: this.note ?? '',
        CustomerID: this.customerId ?? 0,
        UserID: this.userSaleId ?? 0,
        UserTechnicalID: this.userTechId ?? 0,
        CreatedDate: this.createDate
          ? DateTime.fromJSDate(new Date(this.createDate)).toISO()
          : null,
        ProjectManager: this.pmId ?? 0,
        CurrentState: this.currentState ?? '',
        EndUser: this.endUserId ?? 0,
        Priotity: this.priority ?? 0,
        TypeProject: this.projectTypeId ?? 0,
      },
      projectStatusLog: {
        EmployeeID: this.currentUser.EmployeeID ?? 0, // ID người đăng nhập
        DateLog: this.dateChangeStatus
          ? DateTime.fromJSDate(new Date(this.dateChangeStatus)).toISO()
          : undefined,
        CreatedBy: '',
        UpdatedBy: '',
      },
      followProjectBase: {
        ExpectedPlanDate: this.expectedPlanDate
          ? DateTime.fromJSDate(new Date(this.expectedPlanDate)).toISO()
          : null,
        ExpectedQuotationDate: this.expectedQuotationDate
          ? DateTime.fromJSDate(new Date(this.expectedQuotationDate)).toISO()
          : null,
        ExpectedPODate: this.expectedPODate
          ? DateTime.fromJSDate(new Date(this.expectedPODate)).toISO()
          : null,
        ExpectedProjectEndDate: this.expectedProjectEndDate
          ? DateTime.fromJSDate(new Date(this.expectedProjectEndDate)).toISO()
          : null,

        RealityPlanDate: this.realityPlanDate
          ? DateTime.fromJSDate(new Date(this.realityPlanDate)).toISO()
          : null,
        RealityQuotationDate: this.realityQuotationDate
          ? DateTime.fromJSDate(new Date(this.realityQuotationDate)).toISO()
          : null,
        RealityPODate: this.realityPODate
          ? DateTime.fromJSDate(new Date(this.realityPODate)).toISO()
          : null,
        RealityProjectEndDate: this.realityProjectEndDate
          ? DateTime.fromJSDate(new Date(this.realityProjectEndDate)).toISO()
          : null,

        FirmBaseID: this.firmBaseId ?? 0,
        ProjectTypeBaseID: this.prjTypeBaseId ?? 0,
        ProjectContactName: this.projectContactName ?? '',
      },
      projectTypeLinks: projectTypeLinks ?? [], //
      projectUsers: [], //
      listPriorities: this.listPriorities ?? [], //
    };
    console.log(dataSave);
    this.projectService.saveProject(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.projectService.createProjectTree(response.data.project.ID, response.data.selectedProjectTypeLink).subscribe({
            next: (response: any) => {
              if (response.status == 1 && response.data) {
                console.log(response.data);
              }
              this.isSaving = false; // Reset isSaving after successful tree creation
              this.activeModal.dismiss(true);
            },
            error: (error: any) => {
              this.isSaving = false; // Reset isSaving on error during tree creation
              const msg = error.message || 'Lỗi không xác định';
              this.notification.error(NOTIFICATION_TITLE.error, msg);
              console.error('Lỗi:', error.error);
            },
          });
        } else {
          this.isSaving = false;
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  loadAll() {
    const projectIdleader = this.formGroup.get('projectIdleader')?.value;
    this.loadProject(projectIdleader);
    this.getProjectTypeLinksDetail();
    this.getProjectCurrentSituation();
  }

  saveData() {
    if (this.currentTab == 0) {
      // Validate form trước khi lưu
      if (!this.validateForm()) {
        return;
      }
      this.saveDataProject();
    } else if (this.currentTab == 1) {
      console.log(2);
      this.saveProjectTypeLink();
    }
  }

  saveProjectTypeLink() {
    // Validate form trước khi lưu
    if (!this.validateLeaderForm()) {
      return;
    }

    const prjTypeLinks = this.getSelectedData(this.projectTypeNodesDetail);

    const projectIdleader = this.formGroup.get('projectIdleader')?.value;
    const projectStatusIdDetail = this.formGroup.get('projectStatusIdDetail')?.value;
    const situlatorDetail = this.formGroup.get('situlatorDetail')?.value;

    const dataSave = {
      ProjectID: projectIdleader,
      ProjectStatus: projectStatusIdDetail,
      GlobalEmployeeId: this.currentUser.EmployeeID,
      prjTypeLinks: prjTypeLinks,
      Situlator: situlatorDetail ?? '',
    };
    console.log("datasv: ", dataSave)
    this.isSaving = true;
    this.projectService.saveProjectTypeLink(dataSave).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.status == 1) {
          this.notification.success('Thông báo', 'Đã cập nhật leader!');
          this.getProjectTypeLinks();
          this.getProjectTypeLinksDetail();
        }
      },
      error: (error: any) => {
        this.isSaving = false;
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  mapToTreeNodes(data: any[]): TreeNode[] {
    return data.map(item => {
      const node: TreeNode = {
        data: item,
        expanded: true,
        children: item._children ? this.mapToTreeNodes(item._children) : []
      };
      return node;
    });
  }

  syncSelectionToData(nodes: TreeNode[], selection: TreeNode[]) {
    nodes.forEach(node => {
      node.data.Selected = selection.some(s => s.data.ID === node.data.ID);
      if (node.children) {
        this.syncSelectionToData(node.children, selection);
      }
    });
  }

  onSelectionChange(event: any, isDetail: boolean = false) {
    if (isDetail) {
      this.selectedTypeNodesDetail = event;
      this.syncSelectionToData(this.projectTypeNodesDetail, event);
    } else {
      this.selectedTypeNodes = event;
      this.syncSelectionToData(this.projectTypeNodes, event);
    }
  }

  getFlatNodes(nodes: TreeNode[], selection: TreeNode[]) {
    nodes.forEach(node => {
      if (node.data.Selected) {
        selection.push(node);
      }
      if (node.children) {
        this.getFlatNodes(node.children, selection);
      }
    });
  }
  //#endregion

  //#endregion


  getProjectTypeLinks() {
    combineLatest([
      this.projectService.getProjectTypeLinks(this.projectId),
      this.projectService.getProjectApplicationLinks(this.projectId),
      this.projectService.getProjectTechnologyLinks(this.projectId)
    ]).subscribe({
      next: ([responseLinks, responseApps, responseTechs]: any) => {
        const links = responseLinks.data || [];
        const apps = (responseApps.data || []);
        const techs = (responseTechs.data || []);

        links.forEach((item: any) => {
          item.ApplicationTypeIDs = apps.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.ApplicationTypeID);
          item.TechnologyIDs = techs.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.TechnologyID);
        });

        const treeData = this.projectService.setDataTree(links, 'ID');
        this.projectTypeNodes = this.mapToTreeNodes(treeData);

        // Sync initial selection
        this.selectedTypeNodes = [];
        this.getFlatNodes(this.projectTypeNodes, this.selectedTypeNodes);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  //#endregion

  //#endregion

  createLabelsFromData() {
    this.dictLeader = {};

    this.projectUserTeams.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.dictLeader[item.EmployeeID]) {
        this.dictLeader[item.EmployeeID] = item.FullName;
      }
    });
  }

  getProjectTypeLinksDetail() {
    combineLatest([
      this.projectService.getProjectTypeLinks(this.projectIdleader),
      this.projectService.getProjectApplicationLinks(this.projectIdleader),
      this.projectService.getProjectTechnologyLinks(this.projectIdleader)
    ]).subscribe({
      next: ([responseLinks, responseApps, responseTechs]: any) => {
        const links = responseLinks.data || [];
        const apps = (responseApps.data || []);
        const techs = (responseTechs.data || []);

        links.forEach((item: any) => {
          item.ApplicationTypeIDs = apps.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.ApplicationTypeID);
          item.TechnologyIDs = techs.filter((a: any) => a.ProjectTypeLinkID == item.ProjectTypeLinkID).map((x: any) => x.TechnologyID);
        });

        const treeData = this.projectService.setDataTree(links, 'ID');
        this.projectTypeNodesDetail = this.mapToTreeNodes(treeData);

        // Sync initial selection
        this.selectedTypeNodesDetail = [];
        this.getFlatNodes(this.projectTypeNodesDetail, this.selectedTypeNodesDetail);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  getApplicationOptions(rowData: any) {
    if (!rowData) return [];
    const typeId = rowData.ProjectTypeID || rowData.ID;
    return this.applicationTypes.filter((x: any) => x.ProjectTypeID === typeId);
  }

  getTechnologyOptions(rowData: any) {
    if (!rowData) return [];
    const typeId = rowData.ProjectTypeID || rowData.ID;
    return this.technologies.filter((x: any) => x.ProjectTypeID === typeId);
  }

  getNames(ids: any[], dict: any) {
    if (!ids || !Array.isArray(ids)) return '';
    return ids.map(id => dict[id]).filter(n => n).join(', ');
  }

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      console.log(this.projectUserTeams);
      componentRef.instance.leaderId = cell.getValue();
      componentRef.instance.leaders = this.projectUserTeams;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }

  createdControlMulti(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    optionsFn: (cell: any) => any[]
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any, editorParams: any) => {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      componentRef.instance.selectedIds = cell.getValue() || [];
      componentRef.instance.options = optionsFn(cell);

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);

      onRendered(() => {
        if (container.firstElementChild) {
          const focusEl = container.firstElementChild.querySelector('input') || container.firstElementChild;
          (focusEl as HTMLElement).focus();
        }
      });
      return container;
    };
  }

  //#endregion

  //#region sự kiện chuyển tab
  onChangeIndexTab(index: number) {
    if (index == 1) {
      this.projectIdleader = this.projectId;
      this.projectStatusIdDetail = this.projectTypeId;
      this.currentTab = 1;

      // Tải lại dữ liệu cho bảng detail
      this.getProjectTypeLinksDetail();
      this.loadAll();
    } else {
      this.currentTab = 0;
    }
  }
  //#endregion

  //#region Mức ưu tiên
  openProjectPriorityDetail() {
    const modalRef = this.modalService.open(ProjectPriorityDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = this.projectId;

    modalRef.result.catch((reason: any) => {
      if (reason !== undefined) {
        this.formGroup.get('priority')?.setValue(reason.priority);

        this.listPriorities = reason.listPriorities;
      }
    });
  }
  //#endregion

  //#region Thêm trạng thái dự án
  openAddProjectStatusModal() {
    const modalRef = this.modalService.open(ProjectStatusDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.getProjectStatus();
          this.getStatuses();
        }
      },
    );
  }
  //#endregion

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.formGroup.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'customerId':
            return 'Vui lòng chọn khách hàng!';
          case 'projectName':
            return 'Vui lòng nhập tên dự án!';
          case 'userSaleId':
            return 'Vui lòng chọn người phụ trách (Sale)!';
          case 'userTechId':
            return 'Vui lòng chọn người phụ trách (Technical)!';
          case 'pmId':
            return 'Vui lòng chọn PM!';
          case 'endUserId':
            return 'Vui lòng chọn End User!';
          case 'expectedPlanDate':
            return 'Vui lòng chọn ngày gửi phương án!';
          case 'expectedQuotationDate':
            return 'Vui lòng chọn ngày gửi báo giá!';
          case 'priority':
            return 'Vui lòng nhập mức ưu tiên!';
          case 'projectTypeId':
            return 'Vui lòng chọn kiểu dự án!';
          case 'projectIdleader':
            return 'Vui lòng chọn dự án!';
          case 'projectStatusIdDetail':
            return 'Vui lòng chọn trạng thái dự án!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
    this.trimAllStringControls();
    const requiredFields = [
      'customerId',
      'projectName',
      'projectCode',
      'pmId',
      'userSaleId',
      'priority',
      'userTechId',
      'endUserId',
      'expectedPlanDate',
      'expectedQuotationDate',
      'projectTypeId',
    ];
    const invalidFields = requiredFields.filter(key => {
      const control = this.formGroup.get(key);
      return !control || control.invalid || control.value === '' || control.value == null;
    });

    // Kiểm tra mức ưu tiên có giá trị hợp lệ
    const priorityControl = this.formGroup.get('priority');
    const priorityValue = priorityControl?.value;

    if (!priorityControl || priorityValue === '' || priorityValue == null || priorityValue === undefined) {
      this.notification.error('Thông báo', 'Vui lòng nhập mức ưu tiên!');
      priorityControl?.markAsTouched();
      this.formGroup.markAllAsTouched();
      return false;
    }

    // Kiểm tra priority là số và lớn hơn 0
    const priorityNum = parseFloat(priorityValue);
    if (isNaN(priorityNum) || priorityNum <= 0) {
      this.notification.error('Thông báo', 'Mức ưu tiên phải là số lớn hơn 0!');
      priorityControl?.markAsTouched();
      this.formGroup.markAllAsTouched();
      return false;
    }

    // Lấy dữ liệu projectTypeLinks và statusId để kiểm tra attributes
    const projectTypeLinks = this.getSelectedData(this.projectTypeNodes);

    // Chỉ kiểm tra nếu projectTypeId <= 1 (Dự án hoặc Thương mại)
    if (this.projectTypeId <= 1 && projectTypeLinks.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất 1 kiểu dự án trong bảng!');
      this.formGroup.markAllAsTouched();
      return false;
    }

    const currentProjectStatusId = this.formGroup.get('projectStatusId')?.value;
    if (!this.validateProjectAttributes(projectTypeLinks, currentProjectStatusId)) {
      return false;
    }

    if (invalidFields.length > 0) {
      this.formGroup.markAllAsTouched();
      return false;
    }
    return true;
  }

  validateProjectAttributes(gridData: any[], statusId: any): boolean {
    const VALID_STATUS_FOR_ATTRIBUTES = [4, 5, 9];
    if (statusId != null && VALID_STATUS_FOR_ATTRIBUTES.includes(Number(statusId))) {
      const selectedLinks = gridData.filter(x => x.Selected === true);
      for (const link of selectedLinks) {
        if (!link.ApplicationTypeIDs || !Array.isArray(link.ApplicationTypeIDs) || link.ApplicationTypeIDs.length === 0) {
          this.notification.error('Thông báo', `Vui lòng chọn kiểu ứng dụng cho loại dự án: ${link.ProjectTypeName}`);
          return false;
        }
        if (!link.TechnologyIDs || !Array.isArray(link.TechnologyIDs) || link.TechnologyIDs.length === 0) {
          this.notification.error('Thông báo', `Vui lòng chọn công nghệ sử dụng cho loại dự án: ${link.ProjectTypeName}`);
          return false;
        }
      }
    }
    return true;
  }


  validateLeaderForm(): boolean {
    this.trimAllStringControls();
    const projectIdleader = this.formGroup.get('projectIdleader');
    const projectStatusIdDetail = this.formGroup.get('projectStatusIdDetail');
    let isValid = true;
    if (!projectIdleader?.value || projectIdleader?.value <= 0) {
      projectIdleader?.markAsTouched();
      isValid = false;
    }
    if (!projectStatusIdDetail?.value || projectStatusIdDetail?.value <= 0) {
      projectStatusIdDetail?.markAsTouched();
      isValid = false;
    }
    if (!isValid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn dự án và trạng thái!');
      return false;
    }

    const projectTypeLinks = this.getSelectedData(this.projectTypeNodesDetail);
    if (!this.validateProjectAttributes(projectTypeLinks, projectStatusIdDetail?.value)) {
      return false;
    }

    return true;
  }

  getSelectedData(nodes: TreeNode[], result: any[] = []) {
    nodes.forEach(node => {
      if (node.data.Selected) {
        result.push(node.data);
      }
      if (node.children) {
        this.getSelectedData(node.children, result);
      }
    });
    return result;
  }
  openAddCustomer() {
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = false;
    modalRef.result.catch(
      (result) => {
        if (result == true) {
          this.getProjectStatus();
          this.getStatuses();
        }
      },
    );
  }

  // Handle open modals for Lookups
  // TN.Bình update 15/04/26: Hàm mở modal thêm mới kiểu ứng dụng
  openAddApplicationTypeModal(rowData: any) {
    const modalRef = this.modalService.open(ProjectApplicationTypesFormComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    // Truyền ProjectTypeID hiện tại vào modal
    modalRef.componentInstance.projectTypeID = rowData?.ProjectTypeID || rowData?.ID || 0;
    modalRef.result.then((result) => {
      // result = hasSaved flag từ NgbActiveModal.close()
      if (result) {
        this.getApplicationTypes(); // Load lại dữ liệu combobox sau khi thêm mới
      }
    }).catch((res) => {
      // Catch trường hợp đóng modal bằng cách khác nhưng vẫn cần reload nếu res = true
      if (res === true) this.getApplicationTypes();
    });
  }

  // TN.Bình update 15/04/26: Hàm mở modal thêm mới công nghệ
  openAddTechnologyModal(rowData: any) {
    const modalRef = this.modalService.open(ProjectTechnologyFormComponent, {
      size: 'lg',
      backdrop: 'static'
    });
    // Truyền ProjectTypeID hiện tại vào modal
    modalRef.componentInstance.projectTypeID = rowData?.ProjectTypeID || rowData?.ID || 0;
    modalRef.result.then((result) => {
      if (result) {
        this.getTechnologies(); // Load lại dữ liệu combobox sau khi thêm mới
      }
    }).catch((res) => {
      if (res === true) this.getTechnologies();
    });
  }
}
