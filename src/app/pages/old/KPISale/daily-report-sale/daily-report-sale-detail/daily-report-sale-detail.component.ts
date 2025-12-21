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
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { DailyReportSaleService } from '../daily-report-sale-service/daily-report-sale.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { FirmService } from '../../../../general-category/firm/firm-service/firm.service';

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
  projectStatusOld: number = 0; // Trạng thái dự án cũ từ project được chọn
  showDateStatusLogModal: boolean = false; // Hiển thị modal chọn ngày thay đổi trạng thái
  isAdmin: boolean = false; // Kiểm tra user có phải admin không
  isUserIdDisabled: boolean = false; // Disable dropdown userId nếu không phải admin
  isEditMode: boolean = false; // Chế độ sửa
  isLoading: boolean = false; // Đang load dữ liệu

  users: any[] = [];
  projects: any[] = [];
  customers: any[] = [];
  contacts: any[] = [];
  groupTypes: any[] = [];
  parts: any[] = [];
  firms: any[] = [];
  projectTypes: any[] = [];
  projectStatuses: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private dailyReportSaleService: DailyReportSaleService,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private firmService: FirmService,
  ) {
    this.initForm();
  }

  initForm(): void {
    this.dailyReportSaleForm = this.fb.group({
      userId: [null, Validators.required],
      projectId: [null, Validators.required],
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
      dateStatusLog: [null], // Ngày thay đổi trạng thái
    });
  }

  ngOnInit(): void {
    // Kiểm tra quyền admin và set userId
    this.isAdmin = this.appUserService.isAdmin;
    this.isUserIdDisabled = !this.isAdmin;
    
    // Nếu không phải admin, set userId của user hiện tại và disable dropdown
    if (!this.isAdmin) {
      const currentUserId = this.appUserService.id;
      if (currentUserId) {
        this.dailyReportSaleForm.patchValue({
          userId: currentUserId
        });
        this.dailyReportSaleForm.get('userId')?.disable();
      }
    }

    this.loadUsers();
    this.loadProjects();
    this.loadCustomers();
    this.loadFirmBase();
    this.loadProjectTypeBase();
    this.loadProjectStatuses();
    this.loadMainIndexes();

    this.dailyReportSaleForm.get('customerId')?.valueChanges.subscribe((customerId: number | null) => {
      this.onCustomerChange(customerId);
    });

    this.dailyReportSaleForm.get('projectId')?.valueChanges.subscribe((projectId: number | null) => {
      this.onProjectChange(projectId);
    });

    this.dailyReportSaleForm.get('projectStatusId')?.valueChanges.subscribe((projectStatusId: number | null) => {
      this.onProjectStatusChange(projectStatusId);
    });

    this.dailyReportSaleForm.get('userId')?.valueChanges.subscribe((userId: number | null) => {
      this.loadProductCustomer();
    });

    // Nếu có editId thì load dữ liệu để sửa
    if (this.editId > 0) {
      this.isEditMode = true;
      this.loadExistingData();
    } else {
      // Nếu thêm mới, tự động set dateStart và dateEnd về hôm nay
      const today = new Date();
      this.dailyReportSaleForm.patchValue({
        dateStart: today,
        dateEnd: today
      });
    }
  }

  ngAfterViewInit(): void {

  }

  loadExistingData(): void {
    this.isLoading = true;
    this.dailyReportSaleService.getById(this.editId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const data = response.data;
          console.log("Data sửa:", data);
          
          // Set projectStatusOld
          this.projectStatusOld = data.ProjectStatusBaseID || 0;

          // Set form values trước (không bao gồm contactId và partId)
          this.dailyReportSaleForm.patchValue({
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
          // Load contacts và parts trước, sau đó mới set contactId và partId
          if (data.CustomerID) {
            const contactId = data.ContacID || null;
            const partId = data.EndUser || null;

            // Sử dụng forkJoin để đợi cả 2 API load xong
            forkJoin({
              contacts: this.dailyReportSaleService.getCustomerContacts(data.CustomerID),
              parts: this.dailyReportSaleService.getCustomerParts(data.CustomerID)
            }).subscribe({
              next: (results) => {
                // Set contacts list
                if (results.contacts.status === 1) {
                  this.contacts = results.contacts.data || [];
                }
                // Set parts list
                if (results.parts.status === 1) {
                  this.parts = results.parts.data || [];
                }

                // Sau khi load xong contacts và parts, mới set contactId và partId
                this.dailyReportSaleForm.patchValue({
                  contactId: contactId,
                  partId: partId
                });

                this.isLoading = false;
                // Gọi onProjectChange sau khi isLoading = false để load projectStatusId
                this.onProjectChange(data.ProjectID || null);
              },
              error: (error) => {
                console.error('Error loading contacts/parts:', error);
                // Vẫn set giá trị dù có lỗi
                this.dailyReportSaleForm.patchValue({
                  contactId: contactId,
                  partId: partId
                });
                this.isLoading = false;
                // Gọi onProjectChange sau khi isLoading = false để load projectStatusId
                this.onProjectChange(data.ProjectID || null);
              }
            });
          } else {
            this.isLoading = false;
            // Gọi onProjectChange sau khi isLoading = false để load projectStatusId
            this.onProjectChange(data.ProjectID || null);
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
    this.dailyReportSaleService.getEmployees().subscribe(
      (response) => {
        if (response.status === 1) {
          this.users = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách nhân viên');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách nhân viên');
        console.error('Error loading employees:', error);
      }
    );
  }

  loadProjects() {
    this.dailyReportSaleService.getProjects().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projects = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách dự án');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách dự án');
        console.error('Error loading projects:', error);
      }
    );
  }

  loadCustomers() {
    this.dailyReportSaleService.getCustomers().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách khách hàng');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách khách hàng');
        console.error('Error loading customers:', error);
      }
    );
  }

  loadFirmBase() {
    this.dailyReportSaleService.getFirmBase().subscribe(
      (response) => {
        if (response.status === 1) {
          this.firms = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách hãng');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách hãng');
        console.error('Error loading firms:', error);
      }
    );
  }
  loadProjectTypeBase() {
    this.dailyReportSaleService.getProjectTypeBase().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projectTypes = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách loại dự án');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách loại dự án');
        console.error('Error loading project types:', error);
      }
    );
  }

  loadProjectStatuses() {
    this.dailyReportSaleService.getProjectStatuses().subscribe(
      (response) => {
        if (response.status === 1) {
          this.projectStatuses = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách trạng thái dự án');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách trạng thái dự án');
        console.error('Error loading project statuses:', error);
      }
    );
  }

  loadCustomerContacts(customerId: number) {
    this.dailyReportSaleService.getCustomerContacts(customerId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.contacts = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách người liên hệ');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách người liên hệ');
        console.error('Error loading customer contacts:', error);
      }
    );
  }

  loadCustomerParts(customerId: number) {
    this.dailyReportSaleService.getCustomerParts(customerId).subscribe(
      (response) => {
        if (response.status === 1) {
          this.parts = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách EndUser');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách EndUser');
        console.error('Error loading customer parts:', error);
      }
    );
  }

  loadMainIndexes() {
    this.dailyReportSaleService.getMainIndexes().subscribe(
      (response) => {
        if (response.status === 1) {
          this.groupTypes = response.data || [];
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải danh sách loại nhóm');
        }
      },
      (error) => {
        this.notification.error('Lỗi', 'Lỗi kết nối khi tải danh sách loại nhóm');
        console.error('Error loading group types:', error);
      }
    );
  }

  onCustomerChange(customerId: number | null): void {
    // Nếu đang load dữ liệu edit thì không reset contactId và partId
    if (this.isLoading) {
      return;
    }

    this.dailyReportSaleForm.patchValue({
      contactId: null,
      partId: null
    });
    
    if (customerId) {
      this.loadCustomerContacts(customerId);
      this.loadCustomerParts(customerId);
    } else {
      this.contacts = [];
      this.parts = [];
    }
  }

  onAddCustomer(): void {
    this.notification.info('Thông báo', 'Chức năng thêm khách hàng đang được phát triển');
  }

  onAddProject(): void {
    this.notification.info('Thông báo', 'Chức năng thêm dự án đang được phát triển');
  }

  onAddContact(): void {
    this.notification.info('Thông báo', 'Chức năng thêm người liên hệ đang được phát triển');
  }

  onAddFirm(): void {
    this.notification.info('Thông báo', 'Chức năng thêm hãng đang được phát triển');
  }

  onAddProjectType(): void {
    this.notification.info('Thông báo', 'Chức năng thêm loại dự án đang được phát triển');
  }

  onAddProjectStatus(): void {
    this.notification.info('Thông báo', 'Chức năng thêm trạng thái dự án đang được phát triển');
  }

  onAddPart(): void {
    this.notification.info('Thông báo', 'Chức năng thêm EndUser đang được phát triển');
  }

  loadProductCustomer(): void {
    // Nếu đang load dữ liệu edit thì không xử lý
    if (this.isLoading) {
      return;
    }

    const userId = this.dailyReportSaleForm.get('userId')?.value;
    const projectId = this.dailyReportSaleForm.get('projectId')?.value;

    // Chỉ load khi có cả userId và projectId
    if (!userId || userId <= 0 || !projectId || projectId <= 0) {
      return;
    }

    // Load DailyReportSale mới nhất để lấy ProductOfCustomer
    this.dailyReportSaleService.getLatestDailyReportSale(userId, projectId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const productOfCustomer = response.data.ProductOfCustomer || '';
          this.dailyReportSaleForm.patchValue({
            productOfCustomer: productOfCustomer
          });
        }
      },
      error: (error) => {
        console.error('Error loading latest DailyReportSale:', error);
      }
    });

    // Load FollowProjectBase mới nhất để lấy FirmBaseID và ProjectTypeBaseID
    this.dailyReportSaleService.getLatestFollowProjectBase(projectId).subscribe({
      next: (response) => {
        if (response.status === 1 && response.data) {
          const followProject = response.data;
          this.dailyReportSaleForm.patchValue({
            firmId: followProject.FirmBaseID || null,
            projectTypeId: followProject.ProjectTypeBaseID || null
          });
        }
      },
      error: (error) => {
        console.error('Error loading latest FollowProjectBase:', error);
      }
    });
  }

  onProjectChange(projectId: number | null): void {
    // Nếu đang load dữ liệu edit thì không xử lý
    if (this.isLoading) {
      return;
    }

    if (projectId && projectId > 0) {
      // Load project detail để lấy CustomerID và ProjectStatus
      this.projectService.getProject(projectId).subscribe({
        next: (response) => {
          if (response.status === 1 && response.data) {
            const project = response.data;
            
            // Set customerId từ project
            this.dailyReportSaleForm.patchValue({
              customerId: project.CustomerID || null
            });
            
            // Set projectStatusId và projectStatusOld
            this.projectStatusOld = project.ProjectStatus || 0;
            this.dailyReportSaleForm.patchValue({
              projectStatusId: this.projectStatusOld
            });
            
            // Load ProductCustomer sau khi set các giá trị
            this.loadProductCustomer();
          }
        },
        error: (error) => {
          console.error('Error loading project:', error);
        }
      });
    } else {
      this.projectStatusOld = 0;
    }
  }

  onProjectStatusChange(projectStatusId: number | null): void {
    // Nếu đang load dữ liệu edit thì không xử lý
    if (this.isLoading) {
      return;
    }

    const projectId = this.dailyReportSaleForm.get('projectId')?.value;
    
    // nếu projectStatus mới giống với projectStatusOld hoặc projectStatus <= 0 hoặc projectId <= 0 thì ẩn modal
    if (!projectId || projectId <= 0 || !projectStatusId || projectStatusId <= 0) {
      this.showDateStatusLogModal = false;
      return;
    }
    
    // Nếu projectStatus mới giống với projectStatusOld thì ẩn modal
    if (this.projectStatusOld === projectStatusId) {
      this.showDateStatusLogModal = false;
      return;
    }
    
    // Nếu projectStatus thay đổi so với projectStatusOld thì hiển thị modal
    if (this.projectStatusOld > 0 && this.projectStatusOld !== projectStatusId) {
      this.showDateStatusLogModal = true;
    }
  }

  onDateStatusLogOk(): void {
    const dateStatusLog = this.dailyReportSaleForm.get('dateStatusLog')?.value;
    if (!dateStatusLog) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn ngày thay đổi trạng thái');
      return;
    }
    this.showDateStatusLogModal = false;
  }

  onDateStatusLogCancel(): void {
    this.dailyReportSaleForm.patchValue({
      projectStatusId: this.projectStatusOld,
      dateStatusLog: null
    });
    this.showDateStatusLogModal = false;
  }

  getFormData(): any {
    // Lấy giá trị từ form, nếu control bị disable thì dùng getRawValue()
    const formValue = this.dailyReportSaleForm.getRawValue();
    const employeeId = this.appUserService.employeeID || 0;
    
    const formatDate = (date: any): string => {
      if (!date) return '';
      if (date instanceof Date) {
        return date.toISOString();
      }
      if (typeof date === 'string') {
        return new Date(date).toISOString();
      }
      return '';
    };

    return {
      ID: this.editId > 0 ? this.editId : 0,
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
      // Các trường cho updateProject
      projectStatusOld: this.projectStatusOld || 0,
      employeeId: employeeId,
      dateStatusLog: formValue.dateStatusLog ? formatDate(formValue.dateStatusLog) : new Date().toISOString(),
    };
  }

  validateForm(): boolean {
    // Lấy giá trị từ form, nếu control bị disable thì dùng getRawValue()
    const formValue = this.dailyReportSaleForm.getRawValue();

    if (!formValue.userId || formValue.userId <= 0) {
      this.notification.warning('Cảnh báo', 'Xin vui lòng nhập Người phụ trách.');
      return false;
    }

    if (!formValue.customerId || formValue.customerId <= 0) {
      this.notification.warning('Cảnh báo', 'Xin vui lòng nhập Khách hàng.');
      return false;
    }

    if (!formValue.groupTypeId || formValue.groupTypeId <= 0) {
      this.notification.warning('Cảnh báo', 'Xin vui lòng nhập Loại nhóm!');
      return false;
    }

    if (!formValue.content || !formValue.content.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Việc đã làm!');
      return false;
    }

    if (!formValue.result || !formValue.result.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Kết quả!');
      return false;
    }

    if (!formValue.planNext || !formValue.planNext.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Kế hoạch ngày tiếp theo!');
      return false;
    }

    if (!formValue.productOfCustomer || !formValue.productOfCustomer.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Sản phẩm của KH!');
      return false;
    }

    if (!formValue.firmId || formValue.firmId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Hãng!');
      return false;
    }

    if (!formValue.projectTypeId || formValue.projectTypeId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Loại dự án!');
      return false;
    }

    if (!formValue.contactId || formValue.contactId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Liên hệ!');
      return false;
    }

    if (!formValue.projectStatusId || formValue.projectStatusId <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Trạng thái dự án!');
      return false;
    }

    // Kiểm tra nếu projectStatus thay đổi và chưa có dateStatusLog
    const projectStatusNew = formValue.projectStatusId;
    if (!formValue.dateStatusLog && this.projectStatusOld > 0 && this.projectStatusOld !== projectStatusNew) {
      this.showDateStatusLogModal = true;
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Ngày thay đổi trạng thái!');
      return false;
    }

    return true;
  }

  closeModal() {
    this.activeModal.close();
  }

  saveAndClose() {
    this.isSubmitted = true;
    
    if (!this.validateForm()) {
      return;
    }

    if (this.dailyReportSaleForm.valid) {
      const dto = this.getFormData();
      
      this.dailyReportSaleService.save(dto).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.notification.success('Thành công', response.message || 'Lưu dữ liệu thành công');
            this.activeModal.close({ success: true, reloadData: true });
          } else {
            this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
          }
        },
        error: (error) => {
          console.error('Error saving daily report sale:', error);
          this.notification.error('Lỗi', error.error?.message || 'Lỗi kết nối khi lưu dữ liệu');
        }
      });
    } else {
      this.notification.error('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }
}
