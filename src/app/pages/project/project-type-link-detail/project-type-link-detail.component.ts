import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  ViewChild,
  ElementRef,
  Type,
  ApplicationRef,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ProjectService } from '../project-service/project.service';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { SelectLeaderComponent } from '../project-control/select-leader.component';
import { createComponent } from '@angular/core';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AuthService } from '../../../auth/auth.service';
@Component({
  selector: 'app-project-type-link-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzFormModule,
  ],
  templateUrl: './project-type-link-detail.component.html',
  styleUrl: './project-type-link-detail.component.css'
})
export class ProjectTypeLinkDetailComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  @Input() projectId: number = 0;
  @Input() statusId: number = 0;
  @Input() currentSituation: string = '';
  @Input() isEdit: boolean = false;

  @ViewChild('tb_ProjectTypeLink', { static: false })
  tb_ProjectTypeLinkContainer!: ElementRef;

  tb_ProjectTypeLink!: Tabulator;
  tableData: any[] = [];
  projects: any[] = [];
  statusList: any[] = [];
  projectUserTeams: any[] = [];
  dictLeader: { [key: number]: string } = {};
  currentUser: any = {};
  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.getProjects();
    this.getStatuses();
    this.getUserTeams();
    this.form = this.fb.group({
      projectId: [this.projectId || null, [Validators.required]],
      statusId: [this.statusId || null, [Validators.required]],
      currentSituation: [this.currentSituation || ''],
    });

    // Subscribe to projectId changes to load table data and project status
    this.form.get('projectId')?.valueChanges.subscribe((projectId: number) => {
      if (projectId) {
        this.loadTableData(projectId);
        // Gọi API để lấy trạng thái dự án
        this.loadProjectStatus(projectId);
        // Gọi API để lấy hiện trạng dự án
        this.loadCurrentSituation(projectId);
      } else {
        this.tableData = [];
        if (this.tb_ProjectTypeLink) {
          this.tb_ProjectTypeLink.setData([]);
        }
        // Reset trạng thái và hiện trạng khi không có dự án
        this.form.patchValue({ 
    
          currentSituation: '' 
        }, { emitEvent: false });
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_ProjectTypeLinkContainer?.nativeElement) {
        this.drawTbProjectTypeLink(this.tb_ProjectTypeLinkContainer.nativeElement);
        // Nếu có projectId từ input, tự động load data
        if (this.projectId && this.projectId > 0) {
          this.loadTableData(this.projectId);
          // Nếu chưa có statusId (tạo mới), tự động load trạng thái từ API
          if (!this.statusId || this.statusId === 0) {
            this.loadProjectStatus(this.projectId);
          }
          // Nếu chưa có currentSituation (tạo mới), tự động load hiện trạng từ API
          if (!this.currentSituation || this.currentSituation === '') {
            this.loadCurrentSituation(this.projectId);
          }
        }
      }
    }, 100);
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
    });
  }

  getProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.projects = response.data;
        } else if (Array.isArray(response)) {
          this.projects = response;
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách dự án');
      }
    });
  }

  getStatuses(): void {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.statusList = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading statuses:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách trạng thái');
      }
    });
  }

  getUserTeams(): void {
    this.projectService.getUserTeams().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.projectUserTeams = response.data;
          this.createLabelsFromData();
        }
      },
      error: (error: any) => {
        console.error('Error loading user teams:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách leader');
      }
    });
  }

  createLabelsFromData(): void {
    this.dictLeader = {};
    this.projectUserTeams.forEach((item) => {
      if (!this.dictLeader[item.EmployeeID]) {
        this.dictLeader[item.EmployeeID] = item.FullName;
      }
    });
  }

  loadTableData(projectId: number): void {
    this.projectService.getProjectTypeLinks(projectId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          const treeData = this.projectService.setDataTree(response.data, 'ID');
          if (this.tb_ProjectTypeLink) {
            this.tb_ProjectTypeLink.setData(treeData);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading project type links:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu bảng');
      }
    });
  }

  loadProjectStatus(projectId: number): void {
    this.projectService.getProjectById(projectId).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          // Lấy ProjectStatusID.ProjectStatus (value của trạng thái)
          const project = response.data;
          if (project.ProjectStatus) {
            // Set giá trị trạng thái vào form
            this.form.patchValue({ statusId: project.ProjectStatus }, { emitEvent: false });
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading project status:', error);
        // Không hiển thị thông báo lỗi vì đây là tính năng tự động
      }
    });
  }

  loadCurrentSituation(projectId: number): void {
    this.projectService.getDataByProjectID(projectId).subscribe({
      next: (response: any) => {
        // Luôn set giá trị hiện trạng, kể cả khi không có dữ liệu (reset về rỗng)
        let currentSituation = '';
        if (response && response.data) {
          // Lấy dữ liệu hiện trạng từ response
          const situationData = response.data;
          // Có thể là situationData.Situlator hoặc situationData.CurrentSituation tùy vào cấu trúc dữ liệu
          currentSituation = situationData.ContentSituation || situationData.Situlator || situationData.CurrentSituation || '';
        }
        // Luôn set giá trị để đảm bảo hiện trạng được cập nhật khi thay đổi dự án
        this.form.patchValue({ currentSituation: currentSituation }, { emitEvent: false });
      },
      error: (error: any) => {
        console.error('Error loading current situation:', error);
        // Reset về rỗng nếu có lỗi
        this.form.patchValue({ currentSituation: '' }, { emitEvent: false });
        // Không hiển thị thông báo lỗi vì đây là tính năng tự động
      }
    });
  }

  drawTbProjectTypeLink(container: HTMLElement): void {
    this.tb_ProjectTypeLink = new Tabulator(container, {
      data: this.tableData || [],
      ...DEFAULT_TABLE_CONFIG,
      height: '30vh',
      dataTree: true,
      pagination: false,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      layout: 'fitDataStretch',
    
      locale: 'vi',
      columns: [
        {
          title: 'Chọn',
          field: 'Selected',
          formatter: function (cell: any, formatterParams: any, onRendered: any) {
            const checked = cell.getValue() ? 'checked' : '';
            return `<input type='checkbox' ${checked} />`;
          },
          cellClick: (e: any, cell: any) => {
            const newValue = !cell.getValue();
            const row = cell.getRow();
            if (row.getTreeChildren && row.getTreeChildren().length > 0) {
              const children = row.getTreeChildren();
              children.forEach((childRow: any) => {
                childRow.update({ Selected: newValue });
              });
            }
            cell.setValue(newValue);
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          headerHozAlign: 'center',
          widthGrow: 2,
    
        },
        {
          title: 'Leader',
          field: 'LeaderID',
          headerHozAlign: 'center',
          editor: this.createdControl(
            SelectLeaderComponent,
            this.injector,
            this.appRef,
            this.projectUserTeams
          ),
          formatter: (cell: any) => {
            const val = cell.getValue();
            return val
              ? `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.dictLeader[val] || ''}</p> <i class="fas fa-angle-down"></i></div>`
              : '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">Chọn leader</p> <i class="fas fa-angle-down"></i></div>';
          },
          widthGrow: 2,
        },
      ],
    });
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

      componentRef.instance.leaderId = cell.getValue();
      componentRef.instance.leaders = this.projectUserTeams;

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

  closeModal() {
    this.activeModal.close({ success: false });
  }

  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const allData = this.tb_ProjectTypeLink.getData();
    const projectTypeLinks = this.projectService.getSelectedRowsRecursive(allData);

    const formValue = this.form.getRawValue();
    const payload = {
      ProjectID: formValue.projectId,
      ProjectStatus: formValue.statusId,
      GlobalEmployeeId: this.currentUser.EmployeeID ?? 0,
      prjTypeLinks: projectTypeLinks,
      Situlator: formValue.currentSituation || '',
    };

    console.log('Payload:', payload);
    
    this.projectService.saveProjectTypeLink(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Đã cập nhật leader!');
          // Đóng modal và trả về success để component cha load lại
          this.activeModal.close({ success: true, data: response.data });
        } else {
          this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra');
        }
      },
      error: (error: any) => {
        const msg = error.message || error.error?.message || 'Có lỗi xảy ra';
        this.notification.error('Lỗi', msg);
        console.error('Error:', error);
      }
    });
  }
}
