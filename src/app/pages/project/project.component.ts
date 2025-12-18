import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
// import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
// import { ProjectService } from './project-service/project.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectChangeComponent } from './project-change/project-change.component';
import { ProjectStatusComponent } from './project-status/project-status.component';
import { Router } from '@angular/router';
import { ProjectEmployeeComponent } from './project-employee/project-employee.component';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DEFAULT_TABLE_CONFIG } from '../../tabulator-default.config';
import { ProjectService } from './project-service/project.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AuthService } from '../../auth/auth.service';
import { ProjectRequestComponent } from '../project-request/project-request.component';
import { ProjectWorkerSyntheticComponent } from './project-department-summary/project-department-summary-form/project-worker-synthetic/project-worker-synthetic.component';
import { ProjectListWorkReportComponent } from './project-list-work-report/project-list-work-report.component';
import { WorkItemComponent } from './work-item/work-item.component';
import { ProjectWorkerComponent } from './project-department-summary/project-department-summary-form/project-woker/project-worker.component';
import { ProjectPartListComponent } from './project-department-summary/project-department-summary-form/project-part-list/project-part-list.component';
import { ProjectCurrentSituationComponent } from './project-current-situation/project-current-situation.component';
import { ProjectPartlistProblemComponent } from './project-partlist-problem/project-partlist-problem.component';
import { ProjectTypeLinkDetailComponent } from './project-type-link-detail/project-type-link-detail.component';
import { ProjectHistoryProblemComponent } from './project-history-problem/project-history-problem.component';


import { PermissionService } from '../../services/permission.service';
import { environment } from '../../../environments/environment';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    HasPermissionDirective,
  ],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
  //   encapsulation: ViewEncapsulation.None,
})
export class ProjectComponent implements OnInit, AfterViewInit {
  // Khai báo format ngày giờ
  private searchSubject = new Subject<string>();
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  selected = '';
  options = [
    { label: 'Mới', value: 'new' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Hoàn thành', value: 'done' },
  ];

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {
    this.searchSubject
      .pipe(debounceTime(1200)) // 800ms debounce
      .subscribe(value => {
        this.searchProjects(); 
      });
  }
  //Ga
  //#region Khai báo biến
  @ViewChild('tb_projects', { static: false })
  tb_projectsContainer!: ElementRef;
  @ViewChild('tb_projectWorkReport', { static: false })
  tb_projectWorkReportContainer!: ElementRef;
  @ViewChild('tb_projectTypeLink', { static: false })
  tb_projectTypeLinkContainer!: ElementRef;
  @ViewChild('statusDateModalContent', { static: false })
  statusDateModalContent!: any;

  isHide: any = false;

  sizeSearch: string = '0';
  sizeTbDetail: any = '0';
  project: any[] = [];
  projectTypes: any[] = [];
  users: any[] = [];
  pms: any[] = [];
  businessFields: any[] = [];
  customers: any[] = [];
  projectStatuses: any[] = []; // Danh sách trạng thái dự án
  projecStatuses: any[] = [];

  tb_projects: any;
  tb_projectTypeLinks: any;
  tb_projectWorkReports: any;
  projectTypeIds: number[] = [];
  projecStatusIds: string[] = [];
  userId: any;
  pmId: any;
  businessFieldId: any;
  technicalId: any;
  customerId: any;
  keyword: string = '';
  projectId: any = 0;
  projectCode: any = '';
  currentUser: any = null;
  savedPage: number = 1; // Lưu page hiện tại khi reload
  selectedStatusDate: Date | null = null; // Biến lưu ngày được chọn trong modal
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2024, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
    .toISO();
  //#endregion

  //#region chạy khi mở chương trình
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      let id = params.get('id');
      if (Number(id) == 2) {
        this.isHide = false;
        this.projectTypeIds = [2];
        // this.drawTbProjects(this.tb_projectsContainer.nativeElement);
        // this.drawTbProjectTypeLinks(
        //   this.tb_projectTypeLinkContainer.nativeElement
        // );
      } else {
        this.isHide = true;
        this.projectTypeIds = [];
        // this.drawTbProjects(this.tb_projectsContainer.nativeElement);
        // this.drawTbProjectTypeLinks(
        //   this.tb_projectTypeLinkContainer.nativeElement
        // );
      }
      //   console.log(this.isHide);
    });
  }

  ngAfterViewInit(): void {
    this.drawTbProjects(this.tb_projectsContainer.nativeElement);
    this.drawTbProjectTypeLinks(this.tb_projectTypeLinkContainer.nativeElement);
    this.drawTbProjectWorkReports(
      this.tb_projectWorkReportContainer.nativeElement
    );

    this.getUsers();
    this.getPms();
    this.getBusinessFields();
    this.getCustomers();
    this.getProjectTypes();
    this.getProjectStatus();
  }

  onChange(val: string) {
    this.valueChange.emit(val);
  }

  // Khai báo các hàm

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }
  //#endregion

  //#region xử lý bảng danh sách dự án
  drawTbProjects(container: HTMLElement) {
      let contextMenuProject = [
      {
        label: `<span style="font-size: 0.75rem;"><img src="assets/icon/priority_level_16.png" alt="Mức độ ưu tiên cá nhân" class="me-1" /> Mức độ ưu tiên cá nhân</span>`,
        menu: [1, 2, 3, 4, 5].map((level) => ({
          label: `<span style="font-size: 0.75rem;">${level}</span>`,
          action: (e: any, row: any) => {
            this.setPersionalPriority(level);
          },
        })),
      },
      {
        label:  
          '<span style="font-size: 0.75rem;"><img src="assets/icon/action_export_excel_16.png" alt="Xuất Excel" class="me-1" /> Xuất excel</span>',
        action: (e: any, row: any) => {
          this.exportExcel();
        },
      },
      // {
      //   label:
      //     '<span style="font-size: 0.75rem;"><i class="fas fa-chart-simple"></i> Tổng hợp nhân công</span>',
      //   action: (e: any, row: any) => {
      //     // this.openProjectWorkerPriority();
      //   },
      // },

      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/list_project_report_16.png" alt="Danh sách báo cáo công việc" class="me-1" /> Danh sách báo cáo công việc</span>',
        action: (e: any, row: any) => {
          this.openProjectWorkReportModal();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/participants_16.png" alt="Người tham gia" class="me-1" /> Người tham gia</span>',
        action: (e: any, row: any) => {
          this.openProjectEmployee();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/compare_project_16.png" alt="Chuyển dự án" class="me-1" /> Chuyển dự án</span>',
        action: (e: any, row: any) => {
          this.changeProject();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/additional_goods_16.png" alt="Hàng phát sinh" class="me-1" /> Hàng phát sinh</span>',
        action: (e: any, row: any) => {
          this.openProjectPartListProblemModal();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/solution_16.png" alt="yêu cầu giải pháp" class="me-1" /> Yêu cầu - Giải pháp</span>',
        action: (e: any, row: any) => {
          this.openProjectRequest();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/update_leader_16.png" alt=="Cập nhật Leader" class="me-1" /> Cập nhật Leader</span>',
        action: (e: any, row: any) => {
          this.openProjectTypeLinkDetail();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/problem_history_16.png" alt=="Lịch sử phát sinh" class="me-1" /> Lịch sử phát sinh</span>',
        action: (e: any, row: any) => {
          this.openProjectHistoryProblemModal();
        },
      },
    ];

    // Thêm menu item "Trạng thái dự án" nếu có quyền
    if (this.permissionService.hasPermission('N1,N13,N27')) {
      contextMenuProject.push({
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/project_status_16.png" alt="Trạng thái dự án" class="me-1" /> Trạng thái dự án</span>',
        action: (e: any, row: any) => {
          this.openProjectStatus();
        },
      });
    }

    // Thêm menu item "Cập nhật hiện trạng" nếu có quyền
    if (this.permissionService.hasPermission('N1,N13,N27')) {
      contextMenuProject.push({
        label:
          '<span style="font-size: 0.75rem;"><img src="assets/icon/update_status_16.png" alt="Cập nhật hiện trạng" class="me-1" /> Cập nhật hiện trạng</span>',
        action: (e: any, row: any) => {
          this.openUpdateCurrentSituation();
        },
      });
    }
       // Thêm menu item "Cập nhật trạng thái" nếu có quyền
      if (this.permissionService.hasPermission('N1,N13,N27')) {
        // Tạo menu với dữ liệu từ projectStatuses (sẽ được cập nhật động)
        const getStatusMenuItems = () => {
          if (this.projectStatuses && this.projectStatuses.length > 0) {
            return this.projectStatuses.map((status: any) => ({
              label: `<span style="font-size: 0.75rem;">${status.StatusName || ''}</span>`,
              action: (e: any, row: any) => {
                this.selectProjectStatus(status.ID);
              },
            }));
          }
          return [
            {
              label: '<span style="font-size: 0.75rem;">Đang tải...</span>',
              action: () => {},
            }
          ];
        };
        
        contextMenuProject.push({
          label:
            '<span style="font-size: 0.75rem;"><img src="assets/icon/update_status2_16.png" alt="Cập nhật trạng thái" class="me-1" /> Cập nhật trạng thái</span>',
          menu: getStatusMenuItems(),
        });
      }


    if (!this.isHide) {
      contextMenuProject = [
        {
          label:
            '<span style="font-size: 0.75rem;"><i class="fas fa-file-excel"></i> Xuất excel</span>',
          action: (e: any, row: any) => {
            this.exportExcel();
          },
        },
      ];
    }

    this.tb_projects = new Tabulator(container, {
      // data:[{ID:1}],
      //   height: '100%',
      //   layout: 'fitColumns',

      ...DEFAULT_TABLE_CONFIG,
      rowHeader: false,
      selectableRows: 1,
      height: '87vh',
      //   pagination: true,
      //   paginationMode: 'remote',
      //   paginationSize: 100,
      //   paginationSizeSelector: [100, 200, 400, 800, 1000],
      ajaxURL: 'dummy', // Required but not used with ajaxRequestFunc
      ajaxRequestFunc: (_url: string, _config: any, params: any) => {
        return new Promise((resolve, reject) => {
          const page = params.page || 1;
          const size = params.size || 50;
          const ajaxParams = this.getProjectAjaxParams();

          this.projectService
            .getProjectsPagination(ajaxParams, page, size)
            .subscribe({
              next: (res) => {
                if (res?.data) {
                  // Tabulator expects { last_page, data } format
                  resolve({
                    last_page: res.data.totalPage || Math.ceil((res.data.totalRecords || 0) / size),
                    data: res.data.project || [],
                  });
                } else {
                  resolve({ last_page: 1, data: [] });
                }
              },
              error: (err) => {
                console.error('Error loading project data:', err);
                reject(err);
              },
            });
        });
      },
      rowContextMenu: (e: any, row: any) => {
        // Tạo menu động để luôn lấy dữ liệu mới nhất từ projectStatuses
        const menu = [...contextMenuProject];
        
        // Tìm và cập nhật menu "Cập nhật trạng thái" với dữ liệu mới nhất
        const statusMenuIndex = menu.findIndex((item: any) => 
          item.label && item.label.includes('Cập nhật trạng thái')
        );
        
        if (statusMenuIndex >= 0) {
          if (this.projectStatuses && this.projectStatuses.length > 0) {
            menu[statusMenuIndex].menu = this.projectStatuses.map((status: any) => ({
              label: `<span style="font-size: 0.75rem;">${status.StatusName || ''}</span>`,
              action: (e: any, row: any) => {
                this.selectProjectStatus(status.ID);
              },
            }));
          } else {
            menu[statusMenuIndex].menu = [
              {
                label: '<span style="font-size: 0.75rem;">Đang tải...</span>',
                action: () => {},
              }
            ];
          }
        }
        
        return menu;
      },
      columns: [
        {
          title: 'Trạng thái',
          field: 'ProjectStatusName',
          width: 100,
          formatter: 'textarea',
        },
        {
          title: 'Mã dự án',
          field: 'ProjectCode',
          //   hozAlign: 'left',
          bottomCalc: 'count',
          //   headerHozAlign: 'center',
          width: 150,
        },
        {
          title: 'Tên dự án',
          field: 'ProjectName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'End User',
          field: 'EndUserName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        { title: 'PO', field: 'PO', hozAlign: 'center', width: 100 },
        {
          title: 'Ngày PO',
          field: 'PODate',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          //   headerHozAlign: 'center',
          width: 100,
        },
        {
          title: 'Người phụ trách(sale)',
          field: 'FullNameSale',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Người phụ trách(kỹ thuật)',
          field: 'FullNameTech',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'PM',
          field: 'FullNamePM',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Lĩnh vực dự án',
          field: 'BussinessField',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          title: 'Hiện trạng',
          field: 'CurrentSituation',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName',
          //   hozAlign: 'left',
          //   headerHozAlign: 'center',
          width: 200,
          formatter: 'textarea',
        },
        {
          //create column group
          title: 'Mức độ ưu tiên',
          columns: [
            {
              title: 'Dự án',
              field: 'PriotityText',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 70,
            },
            {
              title: 'Cá nhân',
              field: 'PersonalPriotity',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 90,
            },
          ],
        },
        {
          //create column group
          title: 'Dự kiến',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanDateStart',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'PlanDateEnd',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },

        {
          //create column group
          title: 'Thực tế',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualDateStart',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualDateEnd',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },
        {
          title: 'Ngày tạo',
          field: 'CreatedDate',
          width: 100,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          //   headerHozAlign: 'center',
        },
        {
          title: 'Ngày cập nhật',
          field: 'UpdatedDate',
          width: 100,
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            const dateTime = DateTime.fromISO(value);
            value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
            return value;
          },
          hozAlign: 'center',
          //   headerHozAlign: 'center',
        },
        {
          title: 'Người tạo',
          field: 'CreatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
          width: 100,
        },
        {
          title: 'Người sửa',
          field: 'UpdatedBy',
          //   headerHozAlign: 'center',
          //   hozAlign: 'left',
          width: 100,
        },
      ],
    });

    this.tb_projects.on('dataLoading', () => {
      this.tb_projects.deselectRow();
      this.sizeTbDetail = '0';
    });

    // Lắng nghe event dataLoaded để set lại page sau khi reload
    this.tb_projects.on('dataLoaded', () => {
      if (this.savedPage > 0) {
        const maxPage = this.tb_projects.getPageMax() || 1;
        const targetPage = this.savedPage > maxPage ? maxPage : this.savedPage;
        this.tb_projects.setPage(targetPage);
        this.savedPage = 0; // Reset sau khi đã set
      }
    });

    this.tb_projects.on('rowClick', (e: any, row: any) => {
      //   this.tb_projects.deselectRow();
      //   row.select();
      this.sizeTbDetail = null;
      var rowData = row.getData();
      this.projectId = rowData['ID'];
      this.projectCode = rowData['ProjectCode'];
      this.getProjectWorkReports();
      this.getProjectTypeLinks();
    });

    // Event để tự động điều chỉnh vị trí context menu
    this.tb_projects.on('menuOpened', () => {
      setTimeout(() => {
        this.adjustContextMenuPosition();
      }, 10);
    });
  }

  // Hàm điều chỉnh vị trí context menu
  adjustContextMenuPosition() {
    const menu = document.querySelector('.tabulator-menu') as HTMLElement;
    if (!menu) return;

    const menuRect = menu.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Điều chỉnh chiều dọc nếu menu vượt quá viewport
    if (menuRect.bottom > viewportHeight) {
      const overflow = menuRect.bottom - viewportHeight;
      const currentTop = parseFloat(menu.style.top || '0');
      const newTop = currentTop - overflow - 10;

      // Đảm bảo menu không bị âm
      menu.style.top = `${Math.max(10, newTop)}px`;
    }

    // Điều chỉnh chiều ngang nếu menu vượt quá viewport
    if (menuRect.right > viewportWidth) {
      const overflow = menuRect.right - viewportWidth;
      const currentLeft = parseFloat(menu.style.left || '0');
      menu.style.left = `${currentLeft - overflow - 10}px`;
    }
  }

  getProjectAjaxParams() {
    const projectTypeStr =
      this.projectTypeIds?.length > 0 ? this.projectTypeIds.join(',') : '';

    const projectStatusStr =
      this.projecStatusIds?.length > 0 ? this.projecStatusIds.join(',') : '';
    return {
      dateTimeS: DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 0, minute: 0, second: 0 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      dateTimeE: DateTime.fromJSDate(new Date(this.dateEnd))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      keyword: this.keyword.trim() || '',
      customerID: this.customerId || 0,
      saleID: this.userId || 0,
      projectType: projectTypeStr || '',
      leaderID: this.technicalId || 0,
      userTechID: 0,
      pmID: this.pmId || 0,
      globalUserID: this.currentUser?.EmployeeID || 0,
      bussinessFieldID: this.businessFieldId || 0,
      projectStatus: projectStatusStr || '',
      isAGV: this.isHide,
    };
  }
  getDay() {
    console.log(
      DateTime.fromJSDate(new Date(this.dateStart))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      DateTime.fromJSDate(this.dateStart)
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss')
    );
  }
  //#endregion

  //#region xử lý bảng danh sách hạng mục công việc
  drawTbProjectWorkReports(container: HTMLElement) {
    this.tb_projectWorkReports = new Tabulator(container, {
      // ...DEFAULT_TABLE_CONFIG,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        hozAlign: 'left',
        vertAlign: 'middle',
        resizable: true,
      },

      height: '78vh',
      selectableRows: 1,
      layout: 'fitDataFill',
      ajaxURL: 'dummy', // Required but not used with ajaxRequestFunc
      ajaxRequestFunc: (_url: string, _config: any, params: any) => {
        return new Promise((resolve, reject) => {
          // Kiểm tra projectId hợp lệ
          if (!this.projectId || this.projectId === 0) {
            resolve([]);
            return;
          }

          this.projectService
            .getProjectItemsData(this.projectId)
            .subscribe({
              next: (res) => {
                if (res?.data) {
                  // Tabulator expects array data directly
                  const dataArray = Array.isArray(res.data) ? res.data : [];
                  resolve(dataArray);
                } else {
                  resolve([]);
                }
              },
              error: (err) => {
                console.error('Error loading project work reports data:', err);
                reject(err);
              },
            });
        });
      },
      locale: 'vi',
      rowFormatter: function (row) {
        let data = row.getData();

        let itemLate = parseInt(data['ItemLateActual']);
        // console.log('item', itemLate);
        let totalDayExpridSoon = parseInt(data['TotalDayExpridSoon']);
        let dateEndActual = DateTime.fromISO(data['ActualEndDate']).isValid
          ? DateTime.fromISO(data['ActualEndDate']).toFormat('dd/MM/yyy')
          : null;

        if (itemLate == 1) {
          row.getElement().style.backgroundColor = 'Orange';
          row.getElement().style.color = 'white';
        } else if (itemLate == 2) {
          row.getElement().style.backgroundColor = 'Red';
          row.getElement().style.color = 'white';
        } else if (totalDayExpridSoon <= 3 && !dateEndActual) {
          row.getElement().style.backgroundColor = 'LightYellow';
        }
      },
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          width: 50,
        },
        {
          title: 'Mã',
          field: 'Code',
          hozAlign: 'left',
          width: 120,
          bottomCalc: 'count',
        },
        {
          title: 'Trạng thái',
          field: 'StatusText',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          width: 100,
        },
        {
          title: 'Kiểu hạng mục',
          field: 'ProjectTypeName',
          formatter: function (cell, formatterParams, onRendered) {
            let value = cell.getValue() || '';
            return value;
          },
          width: 150,
        },
        {
          title: 'Người phụ trách',
          field: 'FullName',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          width: 150,
          formatter: 'textarea',
        },
        {
          title: '%',
          field: 'PercentItem',
          hozAlign: 'right',
          width: 50,
        },
        {
          title: 'Công việc',
          field: 'Mission',
          //   headerHozAlign: 'center',
          width: 300,
          //   editor: true,
          formatter: 'textarea',
        },
        {
          title: 'Người giao việc',
          field: 'EmployeeRequest',
          //   headerHozAlign: 'center',
          width: 150,
          formatter: 'textarea',
        },
        {
          //create column group
          title: 'Dự kiến',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'PlanStartDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Số ngày',
              field: 'TotalDayPlan',
              hozAlign: 'right',
              //   headerHozAlign: 'center',
              width: 80,
            },
            {
              title: 'Ngày kết thúc',
              field: 'PlanEndDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
          ],
        },

        {
          title: 'Thực tế',
          columns: [
            {
              title: 'Ngày bắt đầu',
              field: 'ActualStartDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: 'Ngày kết thúc',
              field: 'ActualEndDate',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
              //   headerHozAlign: 'center',
              width: 120,
            },
            {
              title: '%',
              field: 'PercentageActual',
              hozAlign: 'right',
              //   formatter: function (cell, formatterParams, onRendered) {
              //     let value = cell.getValue() || '';
              //     return value;
              //   },
              width: 50,
            },
          ],
        },

        {
          title: 'Ghi chú',
          field: 'Note',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          headerHozAlign: 'center',
          width: 300,
          formatter: 'textarea',
        },
        {
          title: 'Người tham gia',
          field: 'ProjectEmployeeName',
          //   formatter: function (cell, formatterParams, onRendered) {
          //     let value = cell.getValue() || '';
          //     return value;
          //   },
          headerHozAlign: 'center',
          width: 300,
          formatter: 'textarea',
        },
      ],
      initialSort: [{ column: 'ID', dir: 'asc' }],
    });
  }

  getProjectWorkReports() {
    // With ajaxRequestFunc, we just need to replace data and it will use the current projectId
    if (this.tb_projectWorkReports) {
      this.tb_projectWorkReports.replaceData();
    }
  }
  //#endregion

  //#region xử lý bảng kiểu dự án
  drawTbProjectTypeLinks(container: HTMLElement) {
    this.tb_projectTypeLinks = new Tabulator(container, {
        columnDefaults: {
          headerWordWrap: true,
          headerVertical: false,
          headerHozAlign: 'center',
          minWidth: 60,
          hozAlign: 'left',
          vertAlign: 'middle',
          resizable: true,
        },
        height: '80vh',
        dataTree: true,
        dataTreeStartExpanded: true,
        layout: 'fitDataStretch',
        locale: 'vi',
      columns: [
        {
          title: 'Chọn',
          field: 'Selected',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
          }
        },
        {
          title: 'Kiểu dự án',
          field: 'ProjectTypeName',
          //   headerHozAlign: 'center',
        },
        {
          title: 'Leader',
          field: 'FullName',
          headerHozAlign: 'center',
          visible: this.isHide,
        },
      ],
    });
  }

  getProjectTypeLinks() {
    this.projectService.getProjectTypeLinks(this.projectId).subscribe({
      next: (response: any) => {
        this.tb_projectTypeLinks.setData(
          this.projectService.setDataTree(response.data, 'ID')
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region tìm kiếm
  getUsers() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.users = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getPms() {
    this.projectService.getPms().subscribe({
      next: (response: any) => {
        this.pms = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getBusinessFields() {
    this.projectService.getBusinessFields().subscribe({
      next: (response: any) => {
        this.businessFields = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getCustomers() {
    this.projectService.getCustomers().subscribe({
      next: (response: any) => {
        this.customers = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectTypes() {
    this.projectService.getProjectTypes().subscribe({
      next: (response: any) => {
        this.projectTypes = response.data;
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectStatus() {
    this.projectService.getProjectStatus().subscribe({
      next: (response: any) => {
        this.projecStatuses = response.data;
        this.projectStatuses = response.data || []; // Lưu danh sách status để dùng cho menu
        // Menu sẽ tự động cập nhật vì đã sử dụng function trong rowContextMenu
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }

  // Hàm xử lý khi chọn trạng thái từ menu
  selectProjectStatus(statusID: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const projectID = selectedIDs[0];
    // Set ngày mặc định là ngày hôm nay
    this.selectedStatusDate = new Date();

    // Tạo modal chọn ngày
    const modalRef = this.modal.create({
      nzTitle: 'Cập nhật trạng thái',
      nzContent: this.statusDateModalContent,
      nzFooter: [
        {
          label: 'Hủy',
          type: 'default',
          onClick: () => {
            this.selectedStatusDate = null;
            modalRef.close();
          },
        },
        {
          label: 'OK',
          type: 'primary',
          onClick: () => {
            if (!this.selectedStatusDate) {
              this.notification.error('Thông báo', 'Vui lòng chọn ngày thay đổi trạng thái!', {
                nzStyle: { fontSize: '0.75rem' },
              });
              return;
            }

            const dateLog = this.selectedStatusDate;
            this.selectedStatusDate = null; // Reset sau khi dùng

            // Gọi API cập nhật trạng thái
            this.projectService.updateProjectStatus(projectID, statusID, dateLog).subscribe({
              next: (response: any) => {
                if (response && response.status === 1) {
                  this.notification.success('Thông báo', response.message || 'Cập nhật trạng thái thành công!', {
                    nzStyle: { fontSize: '0.75rem' },
                  });
                  modalRef.close();
                  this.searchProjects(); // Reload dữ liệu
                } else {
                  this.notification.error('Lỗi', response?.message || 'Không thể cập nhật trạng thái!', {
                    nzStyle: { fontSize: '0.75rem' },
                  });
                }
              },
              error: (error: any) => {
                const errorMsg = error?.error?.message || error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái!';
                this.notification.error('Lỗi', errorMsg, {
                  nzStyle: { fontSize: '0.75rem' },
                });
                console.error('Error updating project status:', error);
              },
            });
          },
        },
      ],
      nzWidth: 500,
    });
  }
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }
  searchProjects() {
    // Lưu page hiện tại trước khi reload (chỉ lưu nếu đang có page > 1)
    const currentPage = this.tb_projects.getPage() || 1;
    if (currentPage > 1) {
      this.savedPage = currentPage;
    }
    
    this.tb_projects.setData(
      this.projectService.getAPIProjects(),
      this.getProjectAjaxParams()
    );
  }

  setDefautSearch() {
    this.dateStart = DateTime.local()
      .minus({ years: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.dateEnd = DateTime.local()
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
    this.projectTypeIds = [];
    this.projecStatusIds = [];
    this.userId = 0;
    this.pmId = 0;
    this.businessFieldId = 0;
    this.technicalId = 0;
    this.customerId = 0;
    this.keyword = '';
    this.savedPage = 0; // Reset savedPage khi reset search params
  }
  //#endregion
  openFolder() {
    // Kiểm tra đã chọn dự án chưa
    if(this.tb_projects.getSelectedRows().length == 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }
    
    let selectedRows = this.tb_projects.getSelectedRows();
    let projectId = selectedRows[0].getData().ID;
    
    // Lấy danh sách ID các kiểu dự án được chọn từ bảng kiểu dự án
    let selectedProjectTypeIds: number[] = [];
    
    if (this.tb_projectTypeLinks) {
      // Lấy tất cả dữ liệu từ bảng (bao gồm cả cây)
      const allData = this.tb_projectTypeLinks.getData();
      
      // Hàm đệ quy để lấy các ID được chọn
      const getSelectedIds = (data: any[]): void => {
        data.forEach((row: any) => {
          // Kiểm tra nếu dòng được chọn (Selected === true)
          if (row.Selected === true && row.ID) {
            selectedProjectTypeIds.push(row.ID);
          }
          // Đệ quy kiểm tra children nếu có
          if (row._children && row._children.length > 0) {
            getSelectedIds(row._children);
          }
        });
      };
      
      getSelectedIds(allData);
    }
    
    // Kiểm tra đã chọn ít nhất 1 kiểu dự án chưa
    if (selectedProjectTypeIds.length === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất 1 kiểu dự án!');
      return;
    }
    
    // Gọi API tạo cây thư mục
    this.projectService.createProjectTree(projectId, selectedProjectTypeIds).subscribe({
      next: (response: any) => {
        if (response.status == 1 && response.data) {
          // Xử lý URL: loại bỏ dấu / đầu tiên nếu có để tránh double slash
          let path = response.data.startsWith('/') ? response.data.substring(1) : response.data;
          let url = environment.host + path;
          window.open(url, '_blank');
          //this.notification.success('Thông báo', 'Tạo cây thư mục thành công!');
        } else {
          this.notification.error('Thông báo', response.message || 'Không thể tạo cây thư mục dự án!');
        }
      },
      error: (error) => {
        this.notification.error('Thông báo', error.error?.message || 'Lỗi khi tạo cây thư mục dự án!');
        console.error('Lỗi:', error);
      }
    });
  }

  //#region thêm/sửa dự án 0 thêm 1 sửa
  updateProject(status: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);
    if (status == 1) {
      if (selectedIDs.length != 1) {
        this.notification.error('Thông báo','Vui lòng chọn dự án!')
        return;
      }
    }

    const modalRef = this.modalService.open(ProjectDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      // centered: true,
      // backdrop: 'static',
      // windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectId = status == 0 ? 0 : selectedIDs[0];

    modalRef.result.catch((reason) => {
      if (reason == true) {
        if (status == 0) {
          this.notification.success('Thông báo', this.createdText('Đã thêm dự án thành công!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        } else {
          this.notification.success('Cập nhật', this.createdText('Đã sửa dự án thành công'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        }

        this.setDefautSearch();
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region xuất excel
  async exportExcel() {
    const table = this.tb_projects;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error(
        '',
        this.createdText('Không có dữ liệu xuất excel!'),
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DanhSachDuAn.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion

  //#region xóa dự án
  deletedProjects() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length <= 0) {
      this.notification.error("Thông báo",
       'Vui lòng chọn ít nhất 1 dự án để xóa!'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Bạn có chắc muốn xóa dự án đã chọn?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectService.deletedProject(selectedIDs).subscribe({
          next: (response: any) => {
            this.notification.success('', this.createdText('Đã xóa dự án!'), {
              nzStyle: { fontSize: '0.75rem' },
            });
            this.searchProjects();
          },
          error: (error) => {
            this.notification.error('', this.createdText('Lỗi xóa dự án!'), {
              nzStyle: { fontSize: '0.75rem' },
            });
            console.error('Lỗi:', error);
          },
        });
      },
    });
  }
  //#endregion

  //#region độ ưu tiên cá nhân
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
      console.log('CurentUser:', this.currentUser);
    });
  }
  setPersionalPriority(priority: number) {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length <= 0) {
      this.notification.error('Thông báo','Vui lòng chọn dự án!')
      return;
    }

    const dataSave = {
      ID: 0,
      UserID: this.currentUser?.EmployeeID ?? 0,
      ProjectID: selectedIDs[0],
      Priotity: priority,
    };
    this.projectService.saveProjectPersonalPriority(dataSave).subscribe({
      next: (response: any) => {
        if (response.data == true) {
          this.notification.success(
            '',
            this.createdText('Đã đổi độ ưu tiên cá nhân!'),
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          this.searchProjects();
        }
      },
      error: (error) => {
        console.error('Lỗi:', error);
      },
    });
  }
  //#endregion

  //#region chuyển dự án
  changeProject() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án cần chuyển!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectChangeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    
    modalRef.componentInstance.projectIdOld = selectedIDs[0];
    modalRef.componentInstance.disable = false;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion
  //#region Hàng phát sinh
  openProjectPartListProblemModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }
    const modalRef = this.modalService.open(ProjectPartlistProblemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectID = selectedIDs[0];
  }

  //#region Yêu cầu - Giải pháp
  openProjectRequest() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }
    const modalRef = this.modalService.open(ProjectRequestComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectID = selectedIDs[0];

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Cập nhật hiện trạng dự án
  openUpdateCurrentSituation() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectCurrentSituationComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true || reason?.success) {
        // Reload data tình hình hiện tại
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Trạng thái dự án
  openProjectStatus() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectStatusComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Cập nhật Leader
  openProjectTypeLinkDetail() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectTypeLinkDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.then((result) => {
      // Xử lý khi modal đóng bằng close() (resolve)
      if (result?.success) {
        this.searchProjects();
      }
    }).catch((reason) => {
      // Xử lý khi modal đóng bằng dismiss() (reject)
      if (reason == true || reason?.success) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Danh sách báo cáo công việc
  openProjectListWorkReport() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    this.router.navigate(['/projectListWork', selectedIDs[0]]);
  }
  //#endregion

  //#region đóng panel
  closePanel() {
    this.sizeTbDetail = '0';
  }
  //#endregion
  //#region Người tham gia dự án
  openProjectEmployee() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    let modalRef = this.modalService.open(ProjectEmployeeComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedIDs[0] ?? 0;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Tổng hợp nhân công
  openProjectWorkerSynthetic() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const modalRef = this.modalService.open(ProjectWorkerSyntheticComponent, {
      centered: true,
      size: 'xl',
    });
    modalRef.componentInstance.projectID = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Danh sách báo cáo công việc
  openProjectWorkReportModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo','Vui lòng chọn 1 dự án!')
      return;
    }

    const modalRef = this.modalService.open(ProjectListWorkReportComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
       // this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Hạng mục công việc
  openWorkItemModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo','Vui lòng chọn 1 dự án!')
      return;
    }
    const modalRef = this.modalService.open(WorkItemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectCode = this.projectCode;
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Nhân công dự án
  openProjectWorkerModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo','Vui lòng chọn 1 dự án!')
      return;
    }
    const modalRef = this.modalService.open(ProjectWorkerComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.tb_projects.getSelectedData()[0].ProjectCode;
    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    });
  }
  //#endregion

  //#region Danh mục vật tư
  openProjectPartListModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo','Vui lòng chọn 1 dự án!')
      return;
    }
    const modalRef = this.modalService.open(ProjectPartListComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      scrollable:false,
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectNameX = this.tb_projects.getSelectedData()[0].ProjectName;
    modalRef.componentInstance.projectCodex = this.tb_projects.getSelectedData()[0].ProjectCode;
    modalRef.componentInstance.tbp = false;
    modalRef.result.then((result) => {
      if (result == true) {
      //this.searchProjects();
    }
  });
}
//#endregion

  //#region Lịch sử phát sinh
  openProjectHistoryProblemModal() {
    let selectedRows = this.tb_projects.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length != 1) {
      this.notification.error('Thông báo', 'Vui lòng chọn 1 dự án!');
      return;
    }

    const modalRef = this.modalService.open(ProjectHistoryProblemComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCode;

    modalRef.result.then((result) => {
      if (result == true) {
        //this.searchProjects();
      }
    }).catch((reason) => {
      // Handle modal dismissal
      console.log('Modal dismissed:', reason);
    });
  }
  //#endregion
}
