import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  IterableDiffers,
  TemplateRef,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Inject,
  Optional,
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../../../project-service/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { ProjectWorkerSyntheticComponent } from '../project-worker-synthetic/project-worker-synthetic.component';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';
import { ProjectSolutionVersionDetailComponent } from '../project-solution-version-detail/project-solution-version-detail.component';
import { ProjectSolutionDetailComponent } from '../project-solution-detail/project-solution-detail.component';
import { ProjectWorkerDetailComponent } from '../project-worker-detail/project-worker-detail.component';
import { max } from 'rxjs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { ImportExcelProjectWorkerComponent } from '../import-excel-project-worker/import-excel-project-worker.component';
import { ProjectPartListService } from './project-partlist-service/project-part-list-service.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { left } from '@popperjs/core';
import { ImportExcelPartlistComponent } from './project-partlist-detail/import-excel-partlist/import-excel-partlist.component';
import { ProjectPartlistDetailComponent } from './project-partlist-detail/project-partlist-detail.component';
import { ProjectPartListHistoryComponent } from '../../../project-part-list-history/project-part-list-history.component';
import { BillExportDetailComponent } from '../../../../old/Sale/BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { BillExportService } from '../../../../old/Sale/BillExport/bill-export-service/bill-export.service';
import { AuthService } from '../../../../../auth/auth.service';
import { PokhDetailComponent } from '../../../../old/pokh-detail/pokh-detail.component';
import { FormExportExcelPartlistComponent } from './project-partlist-detail/form-export-excel-partlist/form-export-excel-partlist.component';
import { ProjectPartlistPurchaseRequestDetailComponent } from '../../../../purchase/project-partlist-purchase-request/project-partlist-purchase-request-detail/project-partlist-purchase-request-detail.component';
@Component({
  selector: 'app-project-worker',
  standalone: true,
  imports: [
    CommonModule,
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
    NzFormModule,
    NzDropDownModule,
    NzCheckboxModule,
    HasPermissionDirective,
  ],
  templateUrl: './project-part-list.component.html',
  styleUrl: './project-part-list.component.css',
})
export class ProjectPartListComponent implements OnInit, AfterViewInit {
  @Input() tbp: boolean = false;
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  @Input() projectNameX: string = '';
  //nhận từ POKHDetailComponent
  @Input() project: any;
  @Input() isPOKH: boolean = false;
  @Input() dtAddDetail: any;
  @Input() nodeMinLevelCount: number = 0;
  @Input() isSelectPartlist: any;
  //0: phiên bản partlist, 1: phiên bản nhân công ( danh cho thêm sửa giải pháp)
  typecheck: number = 0;
  // Callback function để truyền dữ liệu về component cha (khi mở bằng modal)
  @Input() onSelectProductPOCallback?: (data: { listIDInsert: number[], processedData: any[] }) => void;
  // Biến lưu trữ dữ liệu từ SelectProroduct để trả về khi đóng modal
  private selectProductPOData: { listIDInsert: number[], processedData: any[] } | null = null;
  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private projectPartListService: ProjectPartListService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    @Optional() public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService,
    private billExportService: BillExportService,
    private authService: AuthService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }
  sizeLeftPanel: string = ''; // Khởi tạo rỗng
  sizeRightPanel: string = ''; // Khởi tạo rỗng
  @ViewChild('tb_solution', { static: false })
  tb_solutionContainer!: ElementRef;
  @ViewChild('tb_projectPartListVersion', { static: false })
  tb_projectPartListVersionContainer!: ElementRef;
  @ViewChild('tb_projectPartListVersionPO', { static: false })
  tb_projectPartListVersionPOContainer!: ElementRef;
  @ViewChild('tb_projectWorker', { static: false })
  tb_projectWorkerContainer!: ElementRef;
  @ViewChild('priceRequestModalContent', { static: false })
  priceRequestModalContent!: TemplateRef<any>;
  @ViewChild('purchaseRequestModalContent', { static: false })
  purchaseRequestModalContent!: TemplateRef<any>;
  @ViewChild('deletePartListModalContent', { static: false })
  deletePartListModalContent!: TemplateRef<any>;
  @ViewChild('deleteVersionModalContent', { static: false })
  deleteVersionModalContent!: TemplateRef<any>;
  @ViewChild('additionalPartListPOModalContent', { static: false })
  additionalPartListPOModalContent!: TemplateRef<any>;
  // Biến lưu dòng đang được focus (click)
  private lastClickedPartListRow: any = null;
  // Biến cho yêu cầu xuất kho
  warehouses: any[] = [];
  tb_solution: any;
  tb_projectPartListVersion: any;
  tb_projectPartListVersionPO: any;
  tb_projectWorker: any;
  dataProjectWorker: any[] = [];
  isTogglingChildren: boolean = false; // Flag để tránh vòng lặp vô hạn khi toggle children
  previousSelectedRows: Set<number> = new Set(); // Lưu lại các row đã được chọn trước đó
  independentlyDeselectedNodes: Set<number> = new Set(); // Lưu các node đã được bỏ chọn độc lập (không tự động chọn lại)
  dataSolution: any[] = [];
  dataSolutionVersion: any[] = [];
  dataPOVersion: any[] = [];
  dataProject: any[] = [];
  projects: any[] = []; // Danh sách dự án cho combobox
  treeWorkerData: any[] = []; // Dữ liệu tree worker để lấy parent list
  projectworkertypeID: number = 0;
  searchKeyword: string = '';
  dataProjectWorkerType: any[] = [];
  projectSolutionId: number = 0;
  //truyền qua modal
  selectionCode: string = '';
  projectTypeID: number = 0;
  projectTypeName: string = '';
  projectCode: string = '';
  selectionProjectSolutionName: string = '';
  STT: number = 0;
  //dành cho nhân công
  isDeleted: number = 0; // -1: Tất cả, 0: Chưa xóa, 1: Đã xóa
  isApprovedTBP: number = -1; // -2: Tất cả, 0: Chưa duyệt, 1: Đã duyệt
  keyword: string = '';
  versionID: number = 0; //id phiên bản giải pháp
  versionPOID: number = 0; //id phiên bản PO
  type: number = 0; //1: giải pháp, 2: PO
  isApprovedPurchase: number = -1; // -1: Tất cả, 0: Chưa yêu cầu mua, 1: Đã yêu cầu mua
  //selected data
  selectedData: any[] = [];
  CodeName: string = '';
  currentUser: any;
  isLoading: boolean = false; // Loading state cho toàn bộ component
  private loadingCounter: number = 0; // Counter để track số lượng request đang chạy
  private loadingTimeout: any = null; // Timeout để đảm bảo loading không bị kẹt
  ngOnInit(): void {
    if (this.tabData?.tbp) {
      this.tbp = this.tabData.tbp;
      // cập nhật ẩn hiện 
      if(this.tbp) {
        
      }
    
    }
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.isApprovedPurchase = -1;
    // Không load data ở đây vì bảng chưa được khởi tạo
    // Data sẽ được load sau khi bảng được khởi tạo trong ngAfterViewInit
  }
  ngAfterViewInit(): void {
    // Đảm bảo ViewChild đã được khởi tạo bằng cách sử dụng setTimeout
    setTimeout(() => {
      // Khởi tạo bảng trước
      this.drawTbSolution();
      // Chỉ khởi tạo bảng phiên bản giải pháp khi không phải PO KH
      if (!this.isPOKH) {
        this.drawTbProjectPartListVersion();
      }
      this.drawTbProjectPartListVersionPO();
      this.drawTbProjectPartList();
      // Load danh sách dự án cho combobox
      this.loadProjects();
      // Sau khi bảng đã được khởi tạo, mới load data
      this.loadDataSolution();
      // Load danh sách kho để phục vụ yêu cầu xuất kho
      this.loadWarehouses();
    }, 0);
    this.authService.getCurrentUser().subscribe((user: any) => {
      this.currentUser = user.data;
    });
  }
  // Load danh sách kho
  loadWarehouses(): void {
    this.billExportService.getWarehouses().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.warehouses = response.data || [];
        } else {
          console.error('Error loading warehouses:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading warehouses:', error);
      }
    });
  }
  // Load danh sách dự án cho combobox
  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.projects = response.data;
        } else {
          this.projects = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách dự án');
        this.projects = [];
      }
    });
  }
  // Xử lý khi projectId thay đổi
  onProjectIdChange(projectId: number | null): void {
    // Cập nhật projectId
    this.projectId = projectId || 0;
    
    // Reset các biến liên quan đến version khi projectId thay đổi
    this.versionID = 0;
    this.versionPOID = 0;
    this.type = 0;
    this.selectionCode = '';
    this.projectTypeID = 0;
    this.projectTypeName = '';
    this.projectCode = '';
    this.CodeName = '';
    
    if (this.projectId > 0) {
      // Tìm project tương ứng trong danh sách
      const selectedProject = this.projects.find(p => p.ID === this.projectId);
      if (selectedProject) {
        // Cập nhật projectCodex
        this.projectCodex = selectedProject.ProjectCode || '';
      }
      // Gọi lại các hàm load cần projectId
      // loadDataSolution() sẽ tự động gọi loadDataProjectPartListVersion() và loadDataProjectPartListVersionPO()
      this.loadDataSolution();
    } else {
      // Nếu projectId = null hoặc 0, reset các giá trị
      this.projectCodex = '';
      // Clear dữ liệu
      this.dataSolution = [];
      this.dataSolutionVersion = [];
      this.dataPOVersion = [];
      this.dataProjectWorker = [];
      this.projectSolutionId = 0;
      // Clear bảng
      if (this.tb_solution) {
        this.tb_solution.setData([]);
      }
      if (this.tb_projectPartListVersion) {
        this.tb_projectPartListVersion.setData([]);
      }
      if (this.tb_projectPartListVersionPO) {
        this.tb_projectPartListVersionPO.setData([]);
      }
      if (this.tb_projectWorker) {
        this.tb_projectWorker.setData([]);
      }
    }
  }
  // Helper methods để quản lý loading state
  private startLoading(): void {
    this.loadingCounter++;
    this.isLoading = true;
    // Clear timeout cũ nếu có
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    // Set timeout để đảm bảo loading không bị kẹt quá 30 giây
    this.loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout - force stop loading');
      this.loadingCounter = 0;
      this.isLoading = false;
    }, 30000);
  }
  private stopLoading(): void {
    this.loadingCounter--;
    if (this.loadingCounter <= 0) {
      this.loadingCounter = 0;
      this.isLoading = false;
      // Clear timeout khi loading đã dừng
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
    }
  }
  loadDataSolution(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_solution) {
      console.warn('tb_solution chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataSolution(), 100);
      return;
    }
    this.startLoading();
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataSolution', response.data);
          this.dataSolution = response.data || [];
          if (this.dataSolution && this.dataSolution.length > 0) {
            this.projectSolutionId = this.dataSolution[0].ID;
            if (this.tb_solution) {
              this.tb_solution.setData(this.dataSolution);
            }
            // Dừng loading của loadDataSolution trước khi gọi 2 hàm con
            this.stopLoading();
            // Gọi 2 hàm load version, loading sẽ được quản lý trong các hàm đó
            // Chỉ load phiên bản giải pháp khi không phải PO KH
            if (!this.isPOKH) {
              this.loadDataProjectPartListVersion();
            }
            this.loadDataProjectPartListVersionPO();
          } else {
            this.dataSolution = [];
            if (this.tb_solution) {
              this.tb_solution.setData([]);
            }
            this.projectSolutionId = 0;
            this.stopLoading();
          }
        } else {
          this.notification.error('Lỗi', response.message);
          this.stopLoading();
        }
      },
      error: (error: any) => {
        console.error('Error loading solution:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu giải pháp');
        this.stopLoading();
      },
    });
  }
  loadDataProjectPartListVersion(): void {
    // Nếu là PO KH, không cần load phiên bản giải pháp
    if (this.isPOKH) {
      return;
    }
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_projectPartListVersion) {
      console.warn('tb_projectPartListVersion chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataProjectPartListVersion(), 100);
      return;
    }
    this.startLoading();
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, false).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataSolutionVersion', response.data);
          this.dataSolutionVersion = response.data;
          if (this.tb_projectPartListVersion) {
            this.tb_projectPartListVersion.setData(this.dataSolutionVersion);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading project part list version:', error);
        this.notification.error('Lỗi', error.message);
        this.stopLoading();
      }
    });
  }
  searchDataProjectWorker(): void {
    this.loadDataProjectPartList();
  }
  loadDataProjectPartListVersionPO(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_projectPartListVersionPO) {
      console.warn('tb_projectPartListVersionPO chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataProjectPartListVersionPO(), 100);
      return;
    }
    this.startLoading();
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, true).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataPOVersion', response.data);
          this.dataPOVersion = response.data;
          if (this.tb_projectPartListVersionPO) {
            this.tb_projectPartListVersionPO.setData(this.dataPOVersion);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading PO version:', error);
        this.notification.error('Lỗi', error.message);
        this.stopLoading();
      }
    });
  }
  //#region load dữ liệu Partlist
  loadDataProjectPartList(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_projectWorker) {
      console.warn('tb_projectWorker chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataProjectPartList(), 100);
      return;
    }
    // Lấy versionID từ bảng đã chọn
    let selectedVersionID: number = 0;
    let projectTypeID: number = 0;
    if (this.type === 1 && !this.isPOKH) {
      // Giải pháp - chỉ lấy khi không phải PO KH và bảng tồn tại
      if (this.tb_projectPartListVersion) {
        this.selectedData = this.tb_projectPartListVersion.getSelectedData();
        if (this.selectedData && this.selectedData.length > 0) {
          selectedVersionID = this.selectedData[0].ID || 0;
          projectTypeID = this.selectedData[0].ProjectTypeID || 0;
        }
      }
    } else if (this.type === 2) {
      // PO
      this.selectedData = this.tb_projectPartListVersionPO?.getSelectedData();
      if (this.selectedData && this.selectedData.length > 0) {
        selectedVersionID = this.selectedData[0].ID || 0;
        projectTypeID = this.selectedData[0].ProjectTypeID || 0;
      }
    }
    const payload = {
      ProjectID: this.projectId || 0,
      PartlistTypeID: projectTypeID,
      IsDeleted: this.isDeleted || 0,
      Keywords: this.keyword.trim() || '',
      IsApprovedTBP: this.isApprovedTBP || 0,
      IsApprovedPurchase: this.isApprovedPurchase || 0,
      ProjectPartListVersionID: selectedVersionID || 0,
      //17433,7,0,'',-1,-1,1384
      // projectID: this.projectId || 0,
      // projectWorkerTypeID: this.projectworkertypeID || 0,
      // IsApprovedTBP: this.isApprovedTBP ,
      // IsDeleted: this.isDeleted || 0,
      // KeyWord: this.keyword || '',
      // versionID: selectedVersionID || 0
    };
    console.log('payload', payload);
    this.startLoading();
    this.projectPartListService.getProjectPartList(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          let rawData = response.data || [];
          // Tính tổng theo cây
          const treeData = this.calculateWorkerTree(rawData);
          this.treeWorkerData = treeData; // Lưu lại để dùng cho parent list
          // Cập nhật vào Tabulator
          if (this.tb_projectWorker) {
            this.tb_projectWorker.setData(treeData).then(() => {
              // Đảm bảo style được áp dụng sau khi setData hoàn tất
              setTimeout(() => {
                this.applyDeletedRowStyle();
                this.applyCellColors();
                this.stopLoading();
              }, 100);
            });
          } else {
            this.stopLoading();
          }
        } else {
          this.notification.error('Lỗi', response.message);
          this.stopLoading();
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi',error.message|| error.error.message || 'Không thể tải dữ liệu giải pháp');
        this.stopLoading();
      }
    });
  }
  //#endregion
  //#region cập nhật trạng thái duyệt TBP
  updateApprove(action: number): void {
    const isApproved = action === 1;
    const isApprovedText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${isApprovedText}`);
      return;
    }
    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để cập nhật');
        return;
      }
      selectedVersion = versionRows[0];
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
        return;
      }
    } else {
      const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để cập nhật');
        return;
      }
      selectedVersion = versionRows[0];
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
        return;
      }
    }
    // Validate từng vật tư được chọn
    const projectpartlistIDs: number[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư!');
        return;
      }
      // Kiểm tra vật tư đã bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return;
      }
      // Chỉ kiểm tra IsApprovedPurchase khi hủy duyệt
      if (!isApproved && row.IsApprovedPurchase == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT || row.ID}] đã được Yêu cầu mua!`);
        return;
      }
      projectpartlistIDs.push(row.ID);
    }
    // Gọi API để duyệt/hủy duyệt
    this.projectPartListService.approveProjectPartList(projectpartlistIDs, isApproved).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', `${isApprovedText} thành công!`);
          this.loadDataProjectPartList();
        } else if (response.status === 2) {
          // Validation error từ backend
          this.notification.warning('Thông báo', response.message || 'Không thể cập nhật trạng thái duyệt');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật trạng thái duyệt');
        }
      },
      error: (error: any) => {
        console.error('Error updating approve:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể cập nhật trạng thái duyệt';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region Duyệt/Hủy duyệt tích xanh sản phẩm
  approveIsFix(isFix: boolean): void {
    const actionText = isFix ? 'Duyệt' : 'Hủy duyệt';
    const actionTextCapital = isFix ? 'Duyệt' : 'Hủy duyệt';
    // Kiểm tra phiên bản đang sử dụng (giống logic updateApprove)
    let selectedVersion: any = null;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để cập nhật');
        return;
      }
      // selectedVersion = versionRows[0];
      // if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      //   this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
      //   return;
      // }
    } else {
      const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để cập nhật');
        return;
      }
      // selectedVersion = versionRows[0];
      // if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      //   this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
      //   return;
      // }
    }
    // Lấy dữ liệu từ bảng
    const selectedRows = this.tb_projectWorker?.getSelectedData() || [];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${actionText} tích xanh`);
      return;
    }
    // Lọc chỉ lấy các dòng chưa bị xóa (lấy cả node lá và node cha, backend sẽ xử lý)
    // Phân biệt node lá và node cha:
    // - Node cha: có _children và _children.length > 0 (ví dụ: TT = "1" nếu có "1.1", "1.2")
    // - Node lá: không có _children hoặc _children.length === 0 (ví dụ: TT = "1.1.1" không có con)
    // Backend sẽ xử lý dựa trên IsLeaf field
    const validRows = selectedRows.filter((row: any) => {
      // Kiểm tra bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${actionText} vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return false;
      }
      return true;
    });
    if (validRows.length === 0) {
      this.notification.warning('Thông báo', `Không có vật tư hợp lệ để ${actionText} tích xanh.\nVui lòng chọn các vật tư`);
      return;
    }
    // Chuẩn bị payload theo ProjectPartlistDTO structure (lấy cả node lá và node cha)
    // Xác định IsLeaf: node lá = không có _children hoặc _children.length === 0
    const requestItems = validRows.map((row: any) => {
      // Xác định IsLeaf dựa trên _children
      // Node lá: không có _children hoặc _children.length === 0
      // Node cha: có _children và _children.length > 0
      const hasChildren = row._children && Array.isArray(row._children) && row._children.length > 0;
      const isLeaf = !hasChildren;
      return {
        ID: row.ID || 0,
        ProjectID: row.ProjectID || 0,
        ProjectTypeID: row.ProjectTypeID || 0,
        ProjectPartListVersionID: row.ProjectPartListVersionID || 0,
        TT: row.TT || '',
        ProductCode: row.ProductCode || '',
        GroupMaterial: row.GroupMaterial || '',
        Manufacturer: row.Manufacturer || '',
        Unit: row.Unit || '',
        IsLeaf: isLeaf, // Node lá = true, Node cha = false
        IsNewCode: row.IsNewCode || false,
        IsDeleted: row.IsDeleted || false
      };
    });
    // Đếm số lượng và lấy danh sách TT
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.TT).filter((tt: string) => tt).join(', ');
    // Hiển thị dialog xác nhận
    this.modal.confirm({
      nzTitle: `Xác nhận ${actionText} tích xanh`,
      nzContent: `Bạn có chắc chắn muốn ${actionText} tích xanh cho ${itemCount} vật tư${sttList ? ` (Stt: ${sttList})` : ''}? \nNhững mã vật tư mới sẽ tự động bỏ qua!`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkDanger: !isFix,
      nzOnOk: () => {
        this.confirmApproveIsFix(requestItems, isFix);
      }
    });
  }
  // Hàm xác nhận và gọi API duyệt/hủy duyệt tích xanh
  confirmApproveIsFix(requestItems: any[], isFix: boolean): void {
    console.log('=== SENDING APPROVE IS FIX TO API ===');
    console.log('Request Items:', requestItems);
    console.log('IsFix:', isFix);
    this.projectPartListService.approveIsFix(requestItems, isFix).subscribe({
      next: (response: any) => {
        console.log('Response từ approveIsFix API:', response);
        if (response.status === 1) {
          const actionText = isFix ? 'Duyệt' : 'Hủy duyệt';
          this.notification.success('Thành công', `${actionText} tích xanh thành công!`);
          // Reload dữ liệu sau khi duyệt/hủy duyệt thành công
          this.loadDataProjectPartList();
        } else {
          this.notification.warning('Thông báo', response.message || 'Không thể cập nhật trạng thái tích xanh');
        }
      },
      error: (error: any) => {
        console.error('Error updating approve isFix:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể cập nhật trạng thái tích xanh';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region Duyệt/Hủy duyệt mã mới
  approveNewCode(isApproved: boolean): void {
    const isApprovedText = isApproved ? 'Duyệt' : 'Hủy duyệt';
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', `Vui lòng chọn vật tư cần ${isApprovedText} mã mới`);
      return;
    }
    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để cập nhật');
        return;
      }
      selectedVersion = versionRows[0];
    }
      // if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      //   this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
      //   return;
      // }
    // } else {
    //   const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
    //   selectedVersion = versionRows[0];
    //   if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
    //     this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
    //     return;
    //   }
    // }
    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể ${isApprovedText} vì vật tư thứ tự [${row.TT}] đã bị xóa!`);
        return;
      }
      // Xác định IsLeaf
      const isLeaf = !row._children || row._children.length === 0;
      // Chỉ xử lý node lá (IsLeaf = true)
      if (!isLeaf) {
        continue;
      }
      // Kiểm tra IsNewCode = false và đang duyệt → bỏ qua (theo logic API)
      if (row.IsNewCode == false && isApproved) {
        continue;
      }
      // Kiểm tra ProductCode không được rỗng
      if (!row.ProductCode || row.ProductCode.trim() === '') {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.ID}] không có mã thiết bị!`);
        return;
      }
      // Thêm vào danh sách yêu cầu
      requestItems.push({
        ID: row.ID || 0,
        TT: row.TT || row.ID || '',
        ProductCode: row.ProductCode || '',
        GroupMaterial: row.GroupMaterial || '',
        Manufacturer: row.Manufacturer || '',
        Unit: row.Unit || '',
        IsNewCode: row.IsNewCode || false,
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode || false,
        IsLeaf: isLeaf,
        // Các field từ DTO (nếu có)
        HasChildren: row._children && row._children.length > 0,
        IsCheckPrice: row.IsCheckPrice || false,
        EmployeeIDRequestPrice: row.EmployeeIDRequestPrice || null,
        DeadlinePur: row.DeadlinePur || null,
        SupplierSaleQuoteID: row.SupplierSaleQuoteID || null,
        UnitPriceQuote: row.UnitPriceQuote || null,
      });
    }
    // Kiểm tra có item nào để xử lý không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', `Không có vật tư hợp lệ để ${isApprovedText} mã mới.\nVui lòng chọn các vật tư có mã mới`);
      return;
    }
    // Hiển thị modal xác nhận
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.TT).join(', ');
    this.modal.confirm({
      nzTitle: `Xác nhận ${isApprovedText} mã mới`,
      nzContent: `Bạn có chắc chắn muốn ${isApprovedText} mã mới cho ${itemCount} vật tư đã chọn?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: !isApproved,
      nzOnOk: () => {
        this.confirmApproveNewCode(requestItems, isApproved);
      }
    });
  }
  // Hàm xác nhận và gọi API duyệt/hủy duyệt mã mới
  confirmApproveNewCode(requestItems: any[], isApproved: boolean): void {
    this.projectPartListService.approveNewCode(requestItems, isApproved).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          const actionText = isApproved ? 'Duyệt' : 'Hủy duyệt';
          this.notification.success('Thành công', `${actionText} mã mới thành công!`);
          this.loadDataProjectPartList();
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể cập nhật trạng thái duyệt mã mới');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật trạng thái duyệt mã mới');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể cập nhật trạng thái duyệt mã mới';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region yêu cầu báo giá
  // Biến lưu deadline cho modal
  deadlinePriceRequest: Date | null = null;
  //#region yêu cầu mua hàng
  // Biến lưu deadline cho modal mua hàng
  deadlinePurchaseRequest: Date | null = null;
  // Biến lưu lý do xóa cho modal xóa partlist
  reasonDeleted: string = '';
  reasonDeletedVersion: string = '';
  // Biến lưu lý do phát sinh cho modal bổ sung PO
  reasonProblem: string = '';
  // Biến lưu trạng thái checkbox hàng phát sinh
  isGeneratedItem: boolean = false;
  requestPriceQuote(): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần yêu cầu báo giá');
      return;
    }
    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để yêu cầu báo giá');
        return;
      }
      selectedVersion = versionRows[0];
      // if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      //   this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
      //   return;
      // }
      if (selectedVersion['StatusVersion'] == 2) {
        this.notification.warning('Thông báo', `Phiên bản [${selectedVersion.Code}] đã bị PO. Bạn không thể yêu cầu báo giá!`);
        return;
      }
    } else {
      const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để yêu cầu báo giá');
        return;
      }
      selectedVersion = versionRows[0];
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
        return;
      }
    }
    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể yêu cầu báo giá vì vật tư thứ tự [${row.TT}] đã bị xóa!`);
        return;
      }
      // Xác định IsLeaf trước để validate đúng
      const isLeaf = !row._children || row._children.length === 0;
      // ===== VALIDATION CHỈ ÁP DỤNG CHO NODE LÁ (giống API) =====
      if (isLeaf) {
        // Kiểm tra IsNewCode và IsApprovedTBPNewCode
        if (row.IsNewCode == true && (row.IsApprovedTBPNewCode ?? false) == false) {
          this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] chưa được TBP duyệt mới.\nVui lòng kiểm tra lại!`);
          return;
        }
        // Kiểm tra đã yêu cầu báo giá chưa
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const datePriceQuote = row.DatePriceQuote ? new Date(row.DatePriceQuote) : null;
        // Kiểm tra đã yêu cầu báo giá chưa
        debugger;
        if ((row.StatusPriceRequest > 0)
          && (datePriceQuote == null || datePriceQuote > threeMonthsAgo)) {
          this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] đã được yêu cầu báo giá.\nVui lòng kiểm tra lại!`);
          return;
        }
        // Validate các trường bắt buộc theo CheckValidate (CHỈ CHO NODE LÁ)
        if (!row.ProductCode || row.ProductCode.trim() === '') {
          this.notification.warning('Thông báo', `[Mã thiết bị] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.GroupMaterial || row.GroupMaterial.trim() === '') {
          this.notification.warning('Thông báo', `[Tên vật tư] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.Manufacturer || row.Manufacturer.trim() === '') {
          this.notification.warning('Thông báo', `[Hãng SX] có số thứ tự [${row.TT}] không được trống!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.QtyMin || row.QtyMin <= 0) {
          this.notification.warning('Thông báo', `[Số lượng / 1 máy] có số thứ tự [${row.TT}] phải lớn hơn 0!\nVui lòng kiểm tra lại!`);
          return;
        }
        if (!row.QtyFull || row.QtyFull <= 0) {
          this.notification.warning('Thông báo', `[Số lượng tổng] có số thứ tự [${row.TT}] phải lớn hơn 0!\nVui lòng kiểm tra lại!`);
          return;
        }
      }
      // ===== KẾT THÚC VALIDATION CHO NODE LÁ =====
      // Thêm vào danh sách yêu cầu
      requestItems.push({
        ID: row.ID,
        STT: row.STT,
        ProductCode: row.ProductCode,
        GroupMaterial: row.GroupMaterial,
        Manufacturer: row.Manufacturer,
        QtyMin: row.QtyMin,
        QtyFull: row.QtyFull,
        ParentID: row.ParentID,
        IsNewCode: row.IsNewCode,
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode ?? false,
        StatusPriceRequest: row.StatusPriceRequest,
        IsLeaf: isLeaf,
        DatePriceQuote: row.DatePriceQuote || null,
        DeadlinePriceRequest: null // Sẽ được set sau khi chọn ngày
      });
    }
    // Reset deadline và mở modal chọn deadline
    this.deadlinePriceRequest = null;
    this.showPriceRequestModal(requestItems);
  }
  // Hàm tính ngày deadline tối thiểu (chỉ để disable ngày quá khứ)
  getMinDeadlineDate(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    let minDate = new Date(now);
    minDate.setHours(0, 0, 0, 0);
    // Nếu sau 15h: ngày đầu tiên có thể chọn là 2 ngày tới (ngày kia)
    // Nếu trước 15h: ngày đầu tiên có thể chọn là 1 ngày tới (ngày mai)
    if (currentHour >= 15) {
      minDate.setDate(minDate.getDate() + 2);
    } else {
      minDate.setDate(minDate.getDate() + 1);
    }
    return minDate;
  }
  // Hàm chuyển Thứ 7/Chủ nhật thành Thứ 2 tuần sau
  convertWeekendToMonday(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // 0 = Chủ nhật, 6 = Thứ 7 -> chuyển sang Thứ 2 tuần sau
    if (day === 0) { // Chủ nhật -> chuyển sang Thứ 2 tuần sau
      result.setDate(result.getDate() + 1);
    } else if (day === 6) { // Thứ 7 -> chuyển sang Thứ 2 tuần sau
      result.setDate(result.getDate() + 2);
    }
    return result;
  }
  // Hàm lấy ngày làm việc tiếp theo (T2-T6)
  getNextWorkingDay(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    // 0 = CN, 6 = T7
    if (day === 0) { // Chủ nhật -> chuyển sang thứ 2
      result.setDate(result.getDate() + 1);
    } else if (day === 6) { // Thứ 7 -> chuyển sang thứ 2
      result.setDate(result.getDate() + 2);
    }
    return result;
  }
  // Hàm đếm số ngày cuối tuần giữa ngày hiện tại và deadline
  countWeekendDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    // Tính số ngày giữa start và end
    const timeSpan = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // Đếm số ngày cuối tuần
    for (let i = 0; i <= timeSpan; i++) {
      const dateValue = new Date(start);
      dateValue.setDate(dateValue.getDate() + i);
      const dayOfWeek = dateValue.getDay();
      // 0 = Chủ nhật, 6 = Thứ 7
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        count++;
      }
    }
    return count;
  }
  // Hàm disable các ngày không hợp lệ trong date picker
  // Chỉ disable ngày quá khứ, cho phép chọn Thứ 7 và Chủ nhật (sẽ tự động chuyển thành Thứ 2 tuần sau)
  disabledDate = (current: Date): boolean => {
    if (!current) {
      return false;
    }
    const minDate = this.getMinDeadlineDate();
    minDate.setHours(0, 0, 0, 0);
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    // Chỉ disable nếu trước ngày tối thiểu (không disable Thứ 7 và Chủ nhật)
    return currentDate < minDate;
  };
  // Hiển thị modal chọn deadline
  showPriceRequestModal(requestItems: any[]): void {
    const ttList = requestItems.map((item: any) => item.STT).join(', ');
    const itemCount = requestItems.length;
    this.modal.confirm({
      nzTitle: 'Yêu cầu báo giá',
      nzContent: this.priceRequestModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmDeadline(requestItems);
      },
      nzOnCancel: () => {
        this.deadlinePriceRequest = null;
      }
    });
    // Sau khi modal mở, cập nhật nội dung động
    setTimeout(() => {
      const modalData = {
        itemCount: itemCount,
        ttList: ttList
      };
      this.cdr.detectChanges();
    }, 0);
  }
  // Validate và xác nhận deadline (có thể trả về Promise để xử lý modal lồng nhau)
  validateAndConfirmDeadline(requestItems: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Validate deadline đã chọn
      if (!this.deadlinePriceRequest) {
        this.notification.warning('Thông báo', 'Vui lòng chọn deadline báo giá!');
        resolve(false); // Không đóng modal
        return;
      }
      // Kiểm tra deadline có hợp lệ không
      const minDate = this.getMinDeadlineDate();
      minDate.setHours(0, 0, 0, 0);
      let selectedDate = new Date(this.deadlinePriceRequest);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < minDate) {
        this.notification.warning('Thông báo', 'Deadline phải từ ' + minDate.toLocaleDateString('vi-VN') + ' trở đi!');
        resolve(false);
        return;
      }
      // Nếu chọn Thứ 7 hoặc Chủ nhật, tự động chuyển thành Thứ 2 tuần sau
      const day = selectedDate.getDay();
      const originalDate = new Date(selectedDate);
      let wasConverted = false;
      let convertedDate = new Date(selectedDate);
      if (day === 0 || day === 6) {
        convertedDate = this.convertWeekendToMonday(new Date(selectedDate));
        wasConverted = true;
      }
      // Lưu ngày đã chuyển đổi vào biến để đảm bảo dữ liệu gửi API là đúng
      const finalDeadlineDate = wasConverted ? convertedDate : selectedDate;
      // Đếm số ngày cuối tuần giữa hôm nay và deadline
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const countWeekend = this.countWeekendDays(now, finalDeadlineDate);
      // Nếu có ngày cuối tuần hoặc đã chuyển đổi từ Thứ 7/CN, hiển thị thông báo xác nhận
      if (countWeekend > 0 || wasConverted) {
        let message = '';
        if (wasConverted) {
          const originalStr = originalDate.toLocaleDateString('vi-VN');
          const convertedStr = finalDeadlineDate.toLocaleDateString('vi-VN');
          const dayName = day === 0 ? 'Chủ nhật' : 'Thứ 7';
          message = `Bạn đã chọn ngày ${dayName} [${originalStr}].\nDeadline sẽ được chuyển thành Thứ 2 tuần sau [${convertedStr}].\nBạn có chắc muốn tiếp tục không?`;
        } else {
          const deadlineStr = finalDeadlineDate.toLocaleDateString('vi-VN');
          message = `Deadline sẽ không tính Thứ 7 và Chủ nhật (có ${countWeekend} ngày cuối tuần).\nBạn có chắc muốn chọn Deadline là ngày [${deadlineStr}] không?`;
        }
        this.modal.confirm({
          nzTitle: 'Xác nhận Deadline',
          nzContent: message,
          nzOkText: 'Có',
          nzCancelText: 'Không',
          nzOkType: 'primary',
          nzOnOk: () => {
            // Cập nhật deadline với giá trị đã chuyển đổi (đảm bảo là thứ 2 nếu chọn cuối tuần)
            this.deadlinePriceRequest = finalDeadlineDate;
            // Người dùng xác nhận → Gán deadline và gọi API (truyền trực tiếp finalDeadlineDate)
            this.assignDeadlineToItems(requestItems, finalDeadlineDate);
            this.confirmPriceRequest(requestItems);
            resolve(true); // Đóng modal đầu tiên
          },
          nzOnCancel: () => {
            // Người dùng không xác nhận → Không đóng modal đầu tiên
            // Reset về ngày ban đầu nếu đã chuyển đổi
            if (wasConverted) {
              this.deadlinePriceRequest = originalDate;
            }
            resolve(false);
          }
        });
      } else {
        // Không có ngày cuối tuần → Cập nhật deadline và gọi API trực tiếp
        this.deadlinePriceRequest = finalDeadlineDate;
        this.assignDeadlineToItems(requestItems, finalDeadlineDate);
        this.confirmPriceRequest(requestItems);
        resolve(true); // Đóng modal
      }
    });
  }
  // Hàm gán deadline vào các items trong payload
  assignDeadlineToItems(requestItems: any[], deadline?: Date): void {
    // Ưu tiên sử dụng deadline được truyền vào, nếu không có thì lấy từ this.deadlinePriceRequest
    const finalDeadline = deadline || this.deadlinePriceRequest;
    
    if (!finalDeadline) {
      console.error('Deadline is null or undefined');
      return;
    }
    
    // Fix timezone issue: Set giờ về 12:00:00 (giữa ngày) để tránh lệch ngày khi convert sang UTC
    const deadlineFixed = new Date(finalDeadline);
    deadlineFixed.setHours(12, 0, 0, 0);
    
    // Convert Date sang ISO string để gửi lên API
    // Backend ASP.NET Core sẽ tự động parse ISO string thành DateTime
    const deadlineISO = deadlineFixed.toISOString();
    
    requestItems.forEach((item: any) => {
      // Gán deadline vào đúng trường DeadlinePriceRequest
      item.DeadlinePriceRequest = deadlineISO;
    });
  }
  // Hàm xác nhận và gọi API
  confirmPriceRequest(requestItems: any[]): void {
    this.projectPartListService.requestPrice(requestItems).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Yêu cầu báo giá thành công!');
          this.loadDataProjectPartList();
          this.deadlinePriceRequest = null;
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể yêu cầu báo giá');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu báo giá');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể yêu cầu báo giá';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region hủy yêu cầu báo giá
  cancelPriceRequest(): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần hủy yêu cầu báo giá');
      return;
    }
    // Lấy thông tin user hiện tại
    const currentUser = this.appUserService.currentUser;
    if (!currentUser) {
      this.notification.error('Lỗi', 'Không thể lấy thông tin người dùng');
      return;
    }
    // Validate và chuẩn bị payload
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        continue; // Bỏ qua nếu ID không hợp lệ
      }
      // Xác định IsLeaf
      const isLeaf = !row._children || row._children.length === 0;
      // Bỏ qua TẤT CẢ node cha (mọi cấp) - chỉ xử lý node lá
      if (!isLeaf) {
        continue;
      }
      // Kiểm tra đã yêu cầu báo giá chưa (StatusPriceRequest > 0)
      if (!row.StatusPriceRequest || row.StatusPriceRequest <= 0) {
        this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] chưa được yêu cầu báo giá.\nKhông thể hủy yêu cầu báo giá!`);
        return;
      }
      // Kiểm tra phòng mua đã check giá chưa
      if (row.IsCheckPrice === true) {
        this.notification.warning('Thông báo', `Phòng mua đã check giá sản phẩm Stt [${row.TT}].\nBạn không thể hủy y/c báo giá`);
        return;
      }
      // Kiểm tra quyền: chỉ người tạo yêu cầu hoặc admin mới được hủy
      if (row.EmployeeIDRequestPrice &&
        row.EmployeeIDRequestPrice !== currentUser.EmployeeID &&
        !currentUser.IsAdmin) {
        this.notification.warning('Thông báo', `Bạn không thể hủy yêu cầu báo giá của người khác!`);
        return;
      }
      // Thêm vào danh sách yêu cầu hủy
      requestItems.push({
        ID: row.ID,
        STT: row.STT,
        IsLeaf: isLeaf,
        IsCheckPrice: row.IsCheckPrice || false,
        EmployeeIDRequestPrice: row.EmployeeIDRequestPrice || null
      });
    }
    // Kiểm tra có item nào để hủy không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để hủy yêu cầu báo giá.\nVui lòng chọn các vật tư đã được yêu cầu báo giá');
      return;
    }
    // Hiển thị modal xác nhận
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.STT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy yêu cầu báo giá',
      nzContent: `Bạn có chắc chắn muốn hủy yêu cầu báo giá cho ${itemCount} vật tư (Stt: ${sttList})?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.confirmCancelPriceRequest(requestItems);
      }
    });
  }
  // Hàm xác nhận và gọi API hủy yêu cầu báo giá
  confirmCancelPriceRequest(requestItems: any[]): void {
    console.log('=== SENDING CANCEL PRICE REQUEST TO API ===');
    console.log('Total items:', requestItems.length);
    console.log('Payload:', JSON.stringify(requestItems, null, 2));
    this.projectPartListService.cancelPriceRequest(requestItems).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Hủy yêu cầu báo giá thành công!');
          this.loadDataProjectPartList();
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể hủy yêu cầu báo giá');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể hủy yêu cầu báo giá');
        }
      },
      error: (error: any) => {
        console.error('=== API ERROR ===');
        console.error('Error canceling price request:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
        const errorMessage = error?.error?.message || error?.message || 'Không thể hủy yêu cầu báo giá';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region yêu cầu mua hàng
  requestPurchase(): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần yêu cầu mua hàng');
      return;
    }
    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    let projectTypeID: number = 0;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
        return;
      }
    } else {
      const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản PO [${selectedVersion.Code}] trước!`);
        return;
      }
    }
    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] đã bị xóa!`);
        return;
      }
      // Xác định IsLeaf
      const isLeaf = !row._children || row._children.length === 0;
      // Chỉ xử lý node lá
      if (!isLeaf) {
        continue;
      }
      // Kiểm tra đã được TBP duyệt chưa
      if ((row.IsApprovedTBP  ?? false)== false ) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được TBP duyệt!`);
        return;
      }
      // Kiểm tra đã được TBP duyệt mới chưa (nếu là mã mới)
      if (row.IsNewCode == true && row.IsApprovedTBPNewCode == false) {
        this.notification.warning('Thông báo', `Không thể yêu cầu mua hàng vì vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được TBP duyệt mới!`);
        return;
      }
      // Kiểm tra đã được yêu cầu mua chưa
      if (row.IsApprovedPurchase == true) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] đã được Y/c mua.\nVui lòng kiểm tra lại!`);
        return;
      }
      debugger;
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const datePriceQuote = row.DatePriceQuote ? new Date(row.DatePriceQuote) : null;
      if(datePriceQuote == null) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] chưa được báo giá!\nVui lòng kiểm tra lại!`  );
        return;
      }
      if(datePriceQuote < threeMonthsAgo) {
        this.notification.warning('Thông báo', `Vật tư thứ tự [${row.TT || row.STT || row.ID}] đã được báo giá từ hơn 3 tháng trước!\nVui lòng yêu cầu báo giá lại!`  );
        return;
      }
      // Thêm vào danh sách yêu cầu
      requestItems.push({
        ID: row.ID,
        STT: row.STT || 0,
        TT: row.TT || 0,
        IsLeaf: isLeaf,
        IsDeleted: row.IsDeleted || false,
        IsApprovedTBP: row.IsApprovedTBP || false,
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode || false,
        IsNewCode: row.IsNewCode || false,
        IsApprovedPurchase: row.IsApprovedPurchase || false,
        DeadlinePur: null, // Sẽ được set sau khi chọn ngày
        SupplierSaleQuoteID: row.SupplierSaleQuoteID || 0,
        UnitPriceQuote: row.UnitPriceQuote || 0,
        TotalPriceOrder: row.TotalPriceOrder || 0,
        QtyFull: row.QtyFull || 0,
        LeadTime: row.LeadTime || "",
        UnitMoney: row.UnitMoney || "",
        DatePriceQuote: row.DatePriceQuote || null,
      });
    }
    // Kiểm tra có item nào để yêu cầu không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để yêu cầu mua hàng.\nVui lòng chọn các vật tư đã được TBP duyệt ');
      return;
    }
    // Reset deadline và mở modal chọn deadline
    this.deadlinePurchaseRequest = null;
    this.showPurchaseRequestModal(requestItems, projectTypeID);
  }
  // Hiển thị modal chọn deadline mua hàng
  showPurchaseRequestModal(requestItems: any[], projectTypeID: number): void {
    const ttList = requestItems.map((item: any) => item.STT || item.TT).join(', ');
    const itemCount = requestItems.length;
    this.modal.confirm({
      nzTitle: 'Yêu cầu mua hàng',
      nzContent: this.purchaseRequestModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmPurchaseDeadline(requestItems, projectTypeID);
      },
      nzOnCancel: () => {
        this.deadlinePurchaseRequest = null;
      }
    });
    // Sau khi modal mở, cập nhật nội dung động
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  // Hàm tính ngày deadline tối thiểu cho mua hàng
  getMinDeadlinePurchaseDate(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    let minDate = new Date(now);
    minDate.setHours(0, 0, 0, 0);
    // Nếu sau 15h: ngày đầu tiên có thể chọn là 2 ngày tới (ngày kia)
    // Nếu trước 15h: ngày đầu tiên có thể chọn là 1 ngày tới (ngày mai)
    if (currentHour >= 15) {
      minDate.setDate(minDate.getDate() + 2);
    } else {
      minDate.setDate(minDate.getDate() + 1);
    }
    return minDate;
  }
  // Hàm disable các ngày không hợp lệ trong date picker mua hàng
  disabledDatePurchase = (current: Date): boolean => {
    if (!current) {
      return false;
    }
    const minDate = this.getMinDeadlinePurchaseDate();
    minDate.setHours(0, 0, 0, 0);
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    // Chỉ disable nếu trước ngày tối thiểu (không disable Thứ 7 và Chủ nhật - sẽ tự động chuyển thành Thứ 2 tuần sau)
    return currentDate < minDate;
  };
  // Validate và xác nhận deadline mua hàng
  validateAndConfirmPurchaseDeadline(requestItems: any[], projectTypeID: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Validate deadline đã chọn
      if (!this.deadlinePurchaseRequest) {
        this.notification.warning('Thông báo', 'Vui lòng chọn deadline hàng về!');
        resolve(false);
        return;
      }
      // Kiểm tra deadline có hợp lệ không
      const minDate = this.getMinDeadlinePurchaseDate();
      minDate.setHours(0, 0, 0, 0);
      let selectedDate = new Date(this.deadlinePurchaseRequest);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < minDate) {
        this.notification.warning('Thông báo', 'Deadline phải từ ' + minDate.toLocaleDateString('vi-VN') + ' trở đi!');
        resolve(false);
        return;
      }
      // Nếu chọn Thứ 7 hoặc Chủ nhật, tự động chuyển thành Thứ 2 tuần sau
      const day = selectedDate.getDay();
      const originalDate = new Date(selectedDate);
      let wasConverted = false;
      let convertedDate = new Date(selectedDate);
      
      if (day === 0 || day === 6) {
        convertedDate = this.convertWeekendToMonday(new Date(selectedDate));
        wasConverted = true;
      }
      
      // Lưu ngày đã chuyển đổi vào biến để đảm bảo dữ liệu gửi API là đúng
      const finalDeadlineDate = wasConverted ? convertedDate : selectedDate;
      // Đếm số ngày cuối tuần giữa hôm nay và deadline
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const countWeekend = this.countWeekendDays(now, finalDeadlineDate);
      // Nếu có ngày cuối tuần hoặc đã chuyển đổi từ Thứ 7/CN, hiển thị thông báo xác nhận
      if (countWeekend > 0 || wasConverted) {
        let message = '';
        if (wasConverted) {
          const originalStr = originalDate.toLocaleDateString('vi-VN');
          const convertedStr = finalDeadlineDate.toLocaleDateString('vi-VN');
          const dayName = day === 0 ? 'Chủ nhật' : 'Thứ 7';
          message = `Bạn đã chọn ngày ${dayName} [${originalStr}].\nDeadline sẽ được chuyển thành Thứ 2 tuần sau [${convertedStr}].\nBạn có chắc muốn tiếp tục không?`;
        } else {
          const deadlineStr = finalDeadlineDate.toLocaleDateString('vi-VN');
          message = `Deadline sẽ không tính Thứ 7 và Chủ nhật (có ${countWeekend} ngày cuối tuần).\nBạn có chắc muốn chọn Deadline là ngày [${deadlineStr}] không?`;
        }
        this.modal.confirm({
          nzTitle: 'Xác nhận Deadline',
          nzContent: message,
          nzOkText: 'Có',
          nzCancelText: 'Không',
          nzOkType: 'primary',
          nzOnOk: () => {
            // Cập nhật deadline với giá trị đã chuyển đổi (đảm bảo là thứ 2 nếu chọn cuối tuần)
            this.deadlinePurchaseRequest = finalDeadlineDate;
            // Người dùng xác nhận → Gán deadline và gọi API (truyền trực tiếp finalDeadlineDate)
            this.assignDeadlineToPurchaseItems(requestItems, finalDeadlineDate);
            this.confirmPurchaseRequest(requestItems, projectTypeID);
            resolve(true); // Đóng modal đầu tiên
          },
          nzOnCancel: () => {
            // Người dùng không xác nhận → Không đóng modal đầu tiên
            // Reset về ngày ban đầu nếu đã chuyển đổi
            if (wasConverted) {
              this.deadlinePurchaseRequest = originalDate;
            }
            resolve(false);
          }
        });
      } else {
        // Không có ngày cuối tuần → Cập nhật deadline và gọi API trực tiếp
        this.deadlinePurchaseRequest = finalDeadlineDate;
        this.assignDeadlineToPurchaseItems(requestItems, finalDeadlineDate);
        this.confirmPurchaseRequest(requestItems, projectTypeID);
        resolve(true); // Đóng modal
      }
    });
  }
  // Hàm gán deadline vào các items trong payload
  assignDeadlineToPurchaseItems(requestItems: any[], deadline?: Date): void {
    // Ưu tiên sử dụng deadline được truyền vào, nếu không có thì lấy từ this.deadlinePurchaseRequest
    const finalDeadline = deadline || this.deadlinePurchaseRequest;
    
    if (!finalDeadline) {
      console.error('Deadline is null or undefined');
      return;
    }
    
    // Fix timezone issue: Set giờ về 12:00:00 (giữa ngày) để tránh lệch ngày khi convert sang UTC
    const deadlineFixed = new Date(finalDeadline);
    deadlineFixed.setHours(12, 0, 0, 0);
    
    // Convert Date sang ISO string để gửi lên API
    const deadlineISO = deadlineFixed.toISOString();
    
    requestItems.forEach((item: any) => {
      item.DeadlinePur = deadlineISO;
    });
  }
  // Hàm xác nhận và gọi API yêu cầu mua hàng
  confirmPurchaseRequest(requestItems: any[], projectTypeID: number): void {
    const projectSolutionID = this.projectSolutionId || 0;
    const projectID = this.projectId || 0;
    this.projectPartListService.approvePurchaseRequest(requestItems, true, projectTypeID, projectSolutionID, projectID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Yêu cầu mua hàng thành công!');
          this.loadDataProjectPartList();
          this.deadlinePurchaseRequest = null;
        }
        else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu mua hàng');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể yêu cầu mua hàng';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  // Hàm hủy yêu cầu mua hàng
  cancelPurchaseRequest(): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần hủy yêu cầu mua hàng');
      return;
    }
    // Kiểm tra phiên bản đang sử dụng
    let selectedVersion: any = null;
    let projectTypeID: number = 0;
    if (this.type == 1) {
      const versionRows = this.tb_projectPartListVersion?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản để hủy yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
    } else {
      const versionRows = this.tb_projectPartListVersionPO?.getSelectedData();
      if (!versionRows || versionRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản PO để hủy yêu cầu mua hàng');
        return;
      }
      selectedVersion = versionRows[0];
      projectTypeID = selectedVersion.ProjectTypeID || 0;
    }
    // Validate và chuẩn bị payload
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        continue;
      }
      // Xác định IsLeaf
      const isLeaf = !row._children || row._children.length === 0;
      // Bỏ qua TẤT CẢ node cha - chỉ xử lý node lá
      if (!isLeaf) {
        continue;
      }
      // Kiểm tra đã được yêu cầu mua chưa
      if (!row.IsApprovedPurchase || row.IsApprovedPurchase == false) {
        this.notification.warning('Thông báo', `Vật tư Stt [${row.STT || row.TT || row.ID}] chưa được yêu cầu mua hàng.\nKhông thể hủy yêu cầu mua hàng!`);
        return;
      }
      // Thêm vào danh sách yêu cầu hủy
      requestItems.push({
        ID: row.ID,
        STT: row.STT || 0,
        TT: row.TT,
        IsLeaf: isLeaf,
        IsApprovedPurchase: row.IsApprovedPurchase || false
      });
    }
    // Kiểm tra có item nào để hủy không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để hủy yêu cầu mua hàng.\nVui lòng chọn các vật tư đã được yêu cầu mua hàng');
      return;
    }
    // Hiển thị modal xác nhận
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.STT || item.TT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy yêu cầu mua hàng',
      nzContent: `Bạn có chắc chắn muốn hủy yêu cầu mua hàng cho ${itemCount} vật tư (Stt: ${sttList})?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.confirmCancelPurchaseRequest(requestItems, projectTypeID);
      }
    });
  }
  // Hàm xác nhận và gọi API hủy yêu cầu mua hàng
  confirmCancelPurchaseRequest(requestItems: any[], projectTypeID: number): void {
    console.log('=== SENDING CANCEL PURCHASE REQUEST TO API ===');
    console.log('Total items:', requestItems.length);
    console.log('Payload:', JSON.stringify(requestItems, null, 2));
    const projectSolutionID = this.projectSolutionId || 0;
    const projectID = this.projectId || 0;
    this.projectPartListService.approvePurchaseRequest(requestItems, false, projectTypeID, projectSolutionID, projectID).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Hủy yêu cầu mua hàng thành công!');
          this.loadDataProjectPartList();
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể hủy yêu cầu mua hàng');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể hủy yêu cầu mua hàng');
        }
      },
      error: (error: any) => {
        console.error('=== API ERROR ===');
        console.error('Error canceling purchase request:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
        const errorMessage = error?.error?.message || error?.message || 'Không thể hủy yêu cầu mua hàng';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  async openFormExportExcelPartlist(): Promise<void> {
    // Xuất Excel trước
    const exportSuccess = await this.exportExcelPartlist();
    // Sau khi xuất thành công, mở modal
    if (exportSuccess) {
      const modalRef = this.ngbModal.open(FormExportExcelPartlistComponent, {
        centered: true,
        windowClass: 'full-screen-modal',
        keyboard: false,
      });
      modalRef.componentInstance.projectId = this.projectId;
      modalRef.componentInstance.projectCode = this.projectCodex || '';
      modalRef.componentInstance.projectName = this.projectNameX || '';
      modalRef.componentInstance.versionPOID = this.versionPOID;
      modalRef.componentInstance.partListData = this.tb_projectWorker?.getData('tree') || [];
    }
  }
  //#region open modal import excel
  openImportExcelProjectPartList(): void {
    // Lấy versionID từ bảng đã chọn (giống như openProjectPartlistDetail)
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      // Phiên bản giải pháp
      const selectedData = this.tb_projectPartListVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      } else {
        selectedVersionID = this.versionID;
      }
    } else if (this.type === 2) {
      // Phiên bản PO
      const selectedData = this.tb_projectPartListVersionPO?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      } else {
        selectedVersionID = this.versionPOID;
      }
    } else {
      // Nếu không có type, thử lấy từ versionID hoặc versionPOID
      selectedVersionID = this.versionID > 0 ? this.versionID : this.versionPOID;
    }

    const modalRef = this.ngbModal.open(ImportExcelPartlistComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
      backdrop: 'static',
    });
    console.log('selectedVersionID', selectedVersionID, 'type', this.type);
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCodex;
    modalRef.componentInstance.versionId = selectedVersionID;
    modalRef.componentInstance.versionCode = this.CodeName;
    modalRef.componentInstance.projectTypeId = this.projectTypeID;
    modalRef.componentInstance.projectTypeName = this.projectTypeName;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.result.then((result: any) => {
      if (result.success) {
        this.loadDataProjectPartList();
      }
    });
  }
  //#endregion
  //#region export excel vật tư
  async onExportExcel(): Promise<void> {
    if (!this.tb_projectWorker) return;
    const treeData = this.tb_projectWorker.getData('tree');
    if (!treeData || treeData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    // Lấy thông tin từ các bảng đã chọn (theo logic WinForm)
    let codeSolution = '';
    let versionCode = '';
    let partlistVersionID = 0;
    let partListTypeID = 0;
    let projectTypeName = '';
    // Lấy CodeSolution từ bảng giải pháp
    const solutionSelected = this.tb_solution?.getSelectedData();
    if (solutionSelected && solutionSelected.length > 0) {
      codeSolution = solutionSelected[0].CodeSolution || solutionSelected[0].Code || '';
    }
    // Lấy thông tin version từ bảng đã chọn (GP hoặc PO)
    if (this.type === 1) {
      // Giải pháp (GP)
      const versionSelected = this.tb_projectPartListVersion?.getSelectedData();
      if (versionSelected && versionSelected.length > 0) {
        versionCode = versionSelected[0].Code || '';
        partlistVersionID = versionSelected[0].ID || 0;
        partListTypeID = versionSelected[0].ProjectTypeID || 0;
        const typeName = versionSelected[0].ProjectTypeName || '';
        projectTypeName = `${codeSolution}_GP_${versionCode}_${typeName}`;
      }
    } else if (this.type === 2) {
      // PO
      const versionSelected = this.tb_projectPartListVersionPO?.getSelectedData();
      if (versionSelected && versionSelected.length > 0) {
        versionCode = versionSelected[0].Code || '';
        partlistVersionID = versionSelected[0].ID || 0;
        partListTypeID = versionSelected[0].ProjectTypeID || 0;
        const typeName = versionSelected[0].ProjectTypeName || '';
        projectTypeName = `${codeSolution}_PO_${versionCode}_${typeName}`;
      }
    }
    // Nếu không có thông tin version, dùng thông tin mặc định
    if (!projectTypeName) {
      projectTypeName = this.projectTypeName || 'PartList';
    }
    // Tạo tên file theo format WinForm: DanhMucVatTuDuAn_{projectCode}_{projectTypeName}.xlsx
    const fileName = `DanhMucVatTuDuAn_${this.projectCodex || 'Project'}_${projectTypeName}.xlsx`;
    // Lấy tất cả columns từ Tabulator
    const allColumns = this.tb_projectWorker.getColumns();
    // Hàm flatten các nested columns (group columns) để lấy tất cả cột con
    const flattenColumns = (columns: any[]): any[] => {
      const result: any[] = [];
      columns.forEach((col: any) => {
        try {
          const colDef = col.getDefinition();
          // Nếu là group column (có columns bên trong), đệ quy flatten
          if (colDef.columns && colDef.columns.length > 0) {
            // Lấy các sub-columns từ Tabulator column object
            const subCols = col.getSubColumns();
            if (subCols && subCols.length > 0) {
              result.push(...flattenColumns(subCols));
            }
          } else {
            // Nếu không phải group, thêm vào kết quả nếu có field và visible
            const field = col.getField ? col.getField() : colDef.field;
            if (field && colDef.visible !== false) {
              result.push(col);
            }
          }
        } catch (e) {
          // Bỏ qua lỗi
        }
      });
      return result;
    };
    // Flatten các nested columns
    const flattenedCols = flattenColumns(allColumns);
    // Filter: bỏ cột rowSelection và các cột không có field
    const visibleColumns = flattenedCols.filter((col: any) => {
      try {
        const colDef = col.getDefinition();
        const field = col.getField ? col.getField() : colDef.field;
        // Bỏ cột rowSelection
        if (colDef.formatter === 'rowSelection' || colDef.title === 'rowSelection' || field === 'rowSelection') {
          return false;
        }
        // Chỉ lấy các cột có field và visible !== false
        return field && colDef.visible !== false;
      } catch (e) {
        return false;
      }
    });
    // Sử dụng visibleColumns từ getColumns() thay vì flattenColumns
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh mục vật tư');
    // === HEADER ===
    const headerRow = worksheet.addRow(
      visibleColumns.map((col: any) => {
        const colDef = col.getDefinition();
        return colDef.title || (col.getField ? col.getField() : colDef.field) || '';
      })
    );
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, name: 'Times New Roman', size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    // === Hàm thêm node (đệ quy) ===
    const addNodeToSheet = (node: any, level: number = 0) => {
      const row = worksheet.addRow([]);
      visibleColumns.forEach((col: any, idx: number) => {
        const field = col.getField ? col.getField() : col.getDefinition().field;
        let value = node[field] ?? '';
        const cell = row.getCell(idx + 1);
        cell.font = { name: 'Times New Roman', size: 11 };
        // 1. Thụt lề cho cột TT (tree structure)
        if (field === 'TT' && level > 0) {
          value = '  '.repeat(level * 2) + (value || '');
        }
        // 2. Xử lý ngày tháng
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              value = dateValue;
              cell.numFmt = 'dd/mm/yyyy';
            }
          } catch (e) {
            // Giữ nguyên giá trị string nếu không parse được
          }
        }
        // 3. Format các cột tiền tệ (sử dụng formatMoney đã có)
        const moneyFields = ['Price', 'Amount', 'UnitPriceQuote', 'TotalPriceQuote1',
          'UnitPricePurchase', 'TotalPricePurchase',
          'TotalPriceExchangeQuote', 'TotalPriceExchangePurchase'];
        if (moneyFields.includes(field)) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            value = numValue;
            // Format với dấu chấm cho hàng nghìn, phẩy cho thập phân
            cell.numFmt = '#,##0.00'; // Ví dụ: 1.234.567,89
            cell.alignment = { horizontal: 'right' };
          } else {
            value = '';
          }
        }
        // 4. Cột số: format số thập phân
        const numberFields = ['QtyMin', 'QtyFull', 'VAT', 'CurrencyRateQuote', 'CurrencyRatePurchase',
          'QuantityReturn', 'TotalExport', 'RemainQuantity',
          'TotalHN', 'TotalHCM', 'TotalDP', 'TotalHP', 'TotalBN'];
        if (numberFields.includes(field)) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
            cell.numFmt = '0.00';
            cell.alignment = { horizontal: 'right' };
          } else {
            value = '';
          }
        }
        // 5. Format checkbox fields (boolean)
        const checkboxFields = ['IsFix', 'IsApprovedTBPText', 'IsNewCode', 'IsApprovedTBPNewCode',
          'IsApprovedPurchase', 'IsCheckPrice'];
        if (checkboxFields.includes(field)) {
          if (value === true || value === 'Đã duyệt' || value === 'Đã ') {
            value = '✓';
          } else {
            value = '';
          }
        }
        // 6. Áp dụng màu nền theo logic trong bảng
        const hasChildren = node._children && node._children.length > 0;
        const isDeleted = node.IsDeleted === true;
        const isProblem = node.IsProblem === true;
        const quantityReturn = Number(node.QuantityReturn) || 0;
        if (isDeleted) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Đỏ
          cell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FFFFFFFF' } }; // Trắng
        } else if (isProblem) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } }; // Cam
        } else if (quantityReturn > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; // Xanh lá
        } else if (hasChildren) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFACD' } }; // Light yellow
          cell.font = { name: 'Times New Roman', size: 11, bold: true };
        }
        // 7. Áp dụng màu cho các cell đặc biệt (IsNewCode, IsFix)
        if (node.IsNewCode === true && !hasChildren) {
          // Hàng mới - màu hồng cho các cột GroupMaterial, ProductCode, Manufacturer, Unit
          if (['GroupMaterial', 'ProductCode', 'Manufacturer', 'Unit'].includes(field)) {
            const checkField = field === 'GroupMaterial' ? 'IsSameProductName' :
              field === 'ProductCode' ? 'IsSameProductCode' :
                field === 'Manufacturer' ? 'IsSameMaker' : 'IsSameUnit';
            const totalSame = Number(node[checkField]) || 0;
            if (totalSame === 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC0CB' } }; // Hồng
            }
          }
        }
        // Tích xanh - màu xanh dương cho ProductCode
        if (node.IsFix === true && field === 'ProductCode' && !hasChildren) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4682B4' } }; // Xanh dương
          cell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FFFFFFFF' } }; // Trắng
        }
        cell.value = value;
      });
      // Thêm con (đệ quy)
      if (node._children && node._children.length > 0) {
        node._children.forEach((child: any) => addNodeToSheet(child, level + 1));
      }
    };
    // === Duyệt root nodes ===
    treeData.forEach((root: any) => addNodeToSheet(root));
    // === Tự động điều chỉnh độ rộng cột ===
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, val.length + 3);
      });
      column.width = Math.min(maxLength, 50);
    });
    // === Auto filter ===
    if (visibleColumns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: visibleColumns.length },
      };
    }
    // === Border cho tất cả các cell ===
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
    // === Xuất file ===
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      this.notification.success('Thành công', `Xuất Excel thành công: ${fileName}`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.notification.error('Lỗi', 'Không thể xuất file Excel!');
    }
  }
  //#endregion
  //#region export excel phiên bản giải pháp
  onExportExcelSolutionVersion(): void {
    if (!this.tb_projectPartListVersion) return;
    const data = this.tb_projectPartListVersion.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(this.tb_projectPartListVersion, data, 'Phiên bản giải pháp', 'PhienBanGiaiPhapDuAn_' + this.projectCodex);
  }
  //#endregion
  //#region export excel phiên bản PO
  onExportExcelPOVersion(): void {
    if (!this.tb_projectPartListVersionPO) return;
    const data = this.tb_projectPartListVersionPO.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(this.tb_projectPartListVersionPO, data, 'Phiên bản PO', 'PhienBanPODuAn_' + this.projectCodex);
  }
  //#endregion
  //#region open modal giải pháp
  openProjectSolutionDetail(isEdit: boolean): void {
    let selectedData: any = null;
    if (isEdit === true) {
      const data = this.tb_solution.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp');
        return;
      }
      selectedData = data[0];
      this.projectSolutionId = selectedData.ID;
    } else {
      this.projectSolutionId = 0;
    }
    const modalRef = this.ngbModal.open(ProjectSolutionDetailComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });
    // Set các Input properties
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.solutionId = this.projectSolutionId;
    // Nếu là edit mode, truyền dữ liệu vào modal
    if (isEdit === true && selectedData) {
      modalRef.componentInstance.solutionData = selectedData;
    }
    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          this.loadDataSolution();
        }
      })
      .catch((error: any) => {
        console.error('Error opening project solution detail:', error);
      });
  }
  //#endregion
  //#region open modal phiên bản giải pháp
  openProjectSolutionVersionDetail(typenumber: number, isEdit: boolean): void {
    if (this.tb_solution.getSelectedData().length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp');
      return;
    }
    //#region Kiểm tra điều kiện edit trước khi mở modal
    if (isEdit === true) {
      if (typenumber === 1) {
        const data = this.tb_projectPartListVersion.getSelectedData();
        if (data.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Vui lòng chọn 1 phiên bản giải pháp'
          );
          return;
        }
      } else {
        const data = this.tb_projectPartListVersionPO.getSelectedData();
        if (data.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Vui lòng chọn 1 phiên bản PO'
          );
          return;
        }
      }
    }
    //#endregion
    // Mở modal sau khi đã kiểm tra tất cả điều kiện
    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.ProjectID = this.projectId;
    modalRef.componentInstance.typeNumber = typenumber;
    modalRef.componentInstance.isEdit = isEdit;
    modalRef.componentInstance.typecheck = 1;
    //#region Set giá trị cho modal
    if (isEdit === true) {
      if (typenumber === 1) {
        const data = this.tb_projectPartListVersion.getSelectedData();
        const row = data[0];
        modalRef.componentInstance.ProjectTypeID = row.ProjectTypeID;
        modalRef.componentInstance.VersionCode = row.Code;
        modalRef.componentInstance.STT = row.STT;
        modalRef.componentInstance.SolutionTypeID = typenumber; //giải pháp
        modalRef.componentInstance.typeNumber = typenumber; //1: giải pháp, 2: PO
        modalRef.componentInstance.IsActive = row.IsActive;
        modalRef.componentInstance.DescriptionVersion = row.DescriptionVersion;
        modalRef.componentInstance.ProjectworkerID = row.ID;
        modalRef.componentInstance.versionData =
          typenumber === 1 ? this.dataSolutionVersion : this.dataPOVersion;
      } else {
        const data = this.tb_projectPartListVersionPO.getSelectedData();
        const row = data[0];
        modalRef.componentInstance.ProjectTypeID = row.ProjectTypeID;
        modalRef.componentInstance.VersionCode = row.Code;
        modalRef.componentInstance.STT = row.TT;
        modalRef.componentInstance.SolutionTypeID = typenumber; //giải pháp
        modalRef.componentInstance.typeNumber = typenumber; //1: giải pháp, 2: PO
        modalRef.componentInstance.IsActive = row.IsActive;
        modalRef.componentInstance.DescriptionVersion = row.DescriptionVersion;
        modalRef.componentInstance.ProjectworkerID = row.ID;
        modalRef.componentInstance.versionData =
          typenumber === 1 ? this.dataSolutionVersion : this.dataPOVersion;
      }
    } else {
      modalRef.componentInstance.SolutionTypeID = typenumber; //giải pháp
      modalRef.componentInstance.typeNumber = typenumber; //1: giải pháp, 2: PO
      modalRef.componentInstance.versionData =
        typenumber === 1 ? this.dataSolutionVersion : this.dataPOVersion;
    }
    //#endregion
    modalRef.result.then((result: any) => {
      if (result.success) {
        this.loadDataProjectPartListVersion();
        this.loadDataProjectPartListVersionPO();
      }
    });
  }
  //#region format row cho bảng nhân công
  toggleTBPColumn(): void {
    // Không còn cột IsApprovedTBP trong bảng, đã thay bằng IsApprovedTBPText
    // Giữ lại hàm này để tránh lỗi nếu có nơi nào đó gọi
    return;
  }
  applyDeletedRowStyle(): void {
    if (!this.tb_projectWorker) return;
    const rows = this.tb_projectWorker.getRows();
    rows.forEach((row: any) => {
      const data = row.getData();
      const el = row.getElement();
      if (!el) return; // Kiểm tra element tồn tại
      // Reset style
      el.style.cssText = '';
      // === LOGIC VẼ MÀU GIỐNG WINFORM NodeCellStyle ===
      const hasChildren = data._children && data._children.length > 0;
      const isDeleted = data.IsDeleted === true;
      const isProblem = data.IsProblem === true;
      const quantityReturn = Number(data.QuantityReturn) || 0;
      // 1. Ưu tiên cao nhất: Dòng bị xóa → Red + White text
      if (isDeleted) {
        el.style.backgroundColor = 'red';
        el.style.color = 'black';
        return;
      }
      // 2. Dòng có vấn đề → Orange
      if (isProblem) {
        el.style.backgroundColor = 'orange';
        return;
      }
      // 3. Số lượng trả về > 0 → LightGreen
      if (quantityReturn > 0) {
        el.style.backgroundColor = 'lightgreen';
        return;
      }
      // 4. Node cha (có children) → LightGray + Bold
      if (hasChildren) {
        el.style.backgroundColor = 'lightgray';
        el.style.fontWeight = 'bold';
        return;
      }
    });
    // === CẬP NHẬT TIÊU ĐỀ CỘT NHÓM ĐẦU TIÊN ===
    let newTitle = 'Vật tư dự án';
    if (this.projectCodex) {
      newTitle += ` - ${this.projectCodex}`;
    }
    if (this.type === 1) {
      this.selectedData = this.tb_projectPartListVersion?.getSelectedData() || [];
      newTitle += ' - Giải pháp';
    } else if (this.type === 2) {
      this.selectedData = this.tb_projectPartListVersionPO?.getSelectedData() || [];
      newTitle += ' - PO';
    }
    if (this.selectedData.length > 0) {
      const item = this.selectedData[0];
      if (item.ProjectTypeName) newTitle += ` - ${item.ProjectTypeName}`;
      if (item.Code) newTitle += ` - ${item.Code}`;
    }
    // === CẬP NHẬT TITLE CỦA CỘT NHÓM ĐẦU TIÊN (group column) ===
    try {
      const columns = this.tb_projectWorker.getColumns();
      if (columns && columns.length > 0) {
        const firstColumn = columns[0];
        const firstColumnDef = firstColumn.getDefinition();
        
        // Kiểm tra xem cột đầu tiên có phải là group không
        if (firstColumnDef.columns) {
          // Là group → cập nhật title thông qua DOM manipulation
          // Vì Tabulator không cho phép updateDefinition() trên column groups
          const headerElement = firstColumn.getElement();
          if (headerElement) {
            const titleElement = headerElement.querySelector('.tabulator-col-content');
            if (titleElement) {
              titleElement.textContent = newTitle;
            }
          }
        } else {
          // Không phải group → tìm group cha (nếu có)
          const parentGroup = firstColumn.getParentColumn();
          if (parentGroup) {
            const parentDef = parentGroup.getDefinition();
            if (parentDef && parentDef.columns) {
              // Parent là group → cập nhật title thông qua DOM manipulation
              const headerElement = parentGroup.getElement();
              if (headerElement) {
                const titleElement = headerElement.querySelector('.tabulator-col-content');
                if (titleElement) {
                  titleElement.textContent = newTitle;
                }
              }
            } else {
              // Parent không phải group → có thể update bằng updateDefinition
              if (parentGroup && typeof parentGroup.updateDefinition === 'function') {
                parentGroup.updateDefinition({ title: newTitle });
              }
            }
          } else {
            // Không có parent → đặt title cho cột đầu tiên (nếu không phải group)
            if (typeof firstColumn.updateDefinition === 'function') {
              firstColumn.updateDefinition({ title: newTitle });
            }
          }
        }
        // BẮT BUỘC: Redraw header để hiển thị title mới
        this.tb_projectWorker.redraw(true); // true = force full redraw
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật tiêu đề bảng:', error);
    }
  }
  //#endregion
  //#region xóa phiên bản giải pháp
  deleteProjectPartListVersion(typenumber: number): void {
    let selectedVersion: any = null;
    if (typenumber === 1) {
      const data = this.tb_projectPartListVersion.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn 1 phiên bản giải pháp'
        );
        return;
      }
      selectedVersion = data[0];
    } else {
      const data = this.tb_projectPartListVersionPO.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản PO');
        return;
      }
      selectedVersion = data[0];
    }
    // Kiểm tra điều kiện xóa trước khi hiển thị modal
    if (selectedVersion.IsActive === true) {
      this.notification.warning(
        'Thông báo',
        `Phiên bản [${selectedVersion.Code}] đang được sử dụng.\nBạn không thể xóa!`
      );
      return;
    }
    if (selectedVersion.IsApproved === true) {
      this.notification.warning(
        'Thông báo',
        `Phiên bản [${selectedVersion.Code}] đã được phê duyệt.\nBạn không thể xóa!`
      );
      return;
    }
    // Reset lý do xóa
    this.reasonDeletedVersion = '';
    // Tạo modal nhập lý do xóa
    this.modal.confirm({
      nzTitle: `Xác nhận xóa phiên bản [${selectedVersion.Code || ''}]`,
      nzContent: this.deleteVersionModalContent,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmDeleteVersion(selectedVersion);
      },
      nzOnCancel: () => {
        this.reasonDeletedVersion = '';
      }
    });
    // Sau khi modal mở, cập nhật nội dung động
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  // Validate và xác nhận xóa phiên bản
  validateAndConfirmDeleteVersion(selectedVersion: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Validate lý do xóa
      if (!this.reasonDeletedVersion || this.reasonDeletedVersion.trim() === '') {
        this.notification.warning('Thông báo', 'Vui lòng nhập lý do xóa!');
        resolve(false); // Không đóng modal
        return;
      }
      // Tạo payload đầy đủ theo ProjectPartListVersion entity
      const payload: any = {
        ID: selectedVersion.ID || 0,
        ProjectID: selectedVersion.ProjectID || null,
        STT: selectedVersion.STT || null,
        Code: selectedVersion.Code || '',
        DescriptionVersion: selectedVersion.DescriptionVersion || '',
        IsActive: selectedVersion.IsActive || false,
        CreatedDate: selectedVersion.CreatedDate || null,
        CreatedBy: selectedVersion.CreatedBy || '',
        UpdatedDate: selectedVersion.UpdatedDate || null,
        UpdatedBy: selectedVersion.UpdatedBy || '',
        ProjectSolutionID: selectedVersion.ProjectSolutionID || null,
        ProjectTypeID: selectedVersion.ProjectTypeID || null,
        StatusVersion: selectedVersion.StatusVersion || null,
        IsApproved: selectedVersion.IsApproved || false,
        ApprovedID: selectedVersion.ApprovedID || null,
        IsDeleted: true,
        ReasonDeleted: this.reasonDeletedVersion.trim()
      };
      // Gọi API xóa
      this.projectPartListService.saveProjectPartListVersion(payload).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            this.notification.success('Thành công', response.message || 'Xóa phiên bản thành công!');
            this.loadDataProjectPartListVersion();
            this.loadDataProjectPartListVersionPO();
            this.reasonDeletedVersion = '';
          } else {
            this.notification.error('Lỗi', response.message || 'Không thể xóa phiên bản!');
          }
          resolve(true); // Đóng modal
        },
        error: (error: any) => {
          console.error('Error deleting version:', error);
          const errorMessage = error?.error?.message || error?.message || 'Không thể xóa phiên bản!';
          this.notification.error('Lỗi', errorMessage);
          resolve(true); // Đóng modal dù có lỗi
        }
      });
    });
  }
  //#endregion
  //#region draw bảng giải pháp, phiên bản giải pháp, phiên bản PO, nhân công
  drawTbSolution(): void {
    // Kiểm tra ViewChild đã được khởi tạo chưa
    if (!this.tb_solutionContainer) {
      console.warn('tb_solutionContainer chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.drawTbSolution(), 100);
      return;
    }
    this.tb_solution = new Tabulator(this.tb_solutionContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      pagination: false,
      data: this.dataSolution,
      layout: 'fitDataStretch',
      height: '100%',
      maxHeight: '100%',
      groupBy: 'CodeRequest',
      groupStartOpen: true,
      selectableRows: 1,
      groupHeader: (value: any) => `Mã yêu cầu: ${value}`,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
          // Tự động đánh số thứ tự
        },
        {
          title: 'PO',
          field: 'StatusSolution',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === 1 ? 'checked' : '')} onclick="return false;">`;
          },
        },
        {
          title: 'Duyệt PO',
          field: 'IsApprovedPO',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
          },
        },
        {
          title: 'Ngày GP',
          field: 'DateSolution',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        {
          title: 'Mã',
          field: 'CodeSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 40, headerSort: false,
        },
        {
          title: 'Nội dung',
          field: 'ContentSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'textarea',
          formatter: 'textarea', // Hiển thị multiline
          width: 300,
        },
      ],
    });
    this.tb_solution.on('rowClick', (e: any, row: any) => {
      console.log('row', row);
      const data = row.getData();
      this.projectSolutionId = data.ID;
      this.selectionProjectSolutionName = data.CodeSolution;
      this.loadDataProjectPartListVersion();
      this.loadDataProjectPartListVersionPO();
      this.dataProjectWorker = [];
      if (this.tb_projectWorker) {
        this.tb_projectWorker.setData([]);
            }
    });
  }
  drawTbProjectPartListVersion(): void {
    // Nếu là PO KH, không cần khởi tạo bảng phiên bản giải pháp
    if (this.isPOKH) {
      return;
    }
    // Kiểm tra ViewChild đã được khởi tạo chưa
    if (!this.tb_projectPartListVersionContainer) {
      console.warn('tb_projectPartListVersionContainer chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.drawTbProjectPartListVersion(), 100);
      return;
    }
    this.tb_projectPartListVersion = new Tabulator(
      this.tb_projectPartListVersionContainer.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        pagination: false,
        paginationMode: 'local',
        data: this.dataSolutionVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        rowHeader: false,
        headerSort: false,
        rowContextMenu: (e: any, row: any) => this.getSolutionVersionContextMenu(row.getData()),
        groupHeader: (value: any) => `Danh mục: ${value}`,
        columns: [
          {
            title: 'STT',
            field: 'STT',
            width: 30,
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Sử dụng',
            field: 'IsActive',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 30,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
            },
          },
          {
            title: 'Mã',
            field: 'Code',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 30,
          },
          {
            title: 'Mô tả',
            field: 'DescriptionVersion',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: 'textarea',
            headerSort: false,
            variableHeight: true,
            width: 300,
          },
          {
            title: 'Người tạo',
            field: 'FullNameCreated',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'ProjectTypeID',
            field: 'ProjectTypeID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
          },
        ],
      }
    );
    this.tb_projectPartListVersion.on('rowClick', (e: any, row: any) => {
      console.log('row', row);
      // Kiểm tra nếu row đang được chọn hay bị bỏ chọn
      const isSelected = row.isSelected();
      
      if (isSelected) {
        // Row được chọn
        const data = row.getData();
        this.selectionCode = data.Code;
        this.versionID = data.ID || 0;
        this.projectTypeID = data.ProjectTypeID;
        this.projectTypeName = data.ProjectTypeName;
        this.type = 1; // Giải pháp
        this.CodeName = data.Code;
        const selectedRows = this.tb_projectPartListVersionPO.getSelectedRows();
        selectedRows.forEach((selectedRow: any) => {
          selectedRow.deselect();
        });
        this.toggleTBPColumn();
        this.loadDataProjectPartList();
      } else {
        // Row bị bỏ chọn - reset các biến về giá trị mặc định
        const selectedRows = this.tb_projectPartListVersion.getSelectedRows();
        if (selectedRows.length === 0) {
          // Không còn row nào được chọn
          this.type = 0;
          this.versionID = 0;
          this.versionPOID = 0;
          this.selectionCode = '';
          this.projectTypeID = 0;
          this.projectTypeName = '';
          this.projectCode = '';
          this.CodeName = '';
          console.log('type reset to:', this.type);
          this.toggleTBPColumn();
          //  this.loadDataProjectPartList();
          this.dataProjectWorker = [];
          if (this.tb_projectWorker) {
            this.tb_projectWorker.setData([]);
          }
        }
      }
    });
  }
  //set data tree cho bảng
  setDataTree(flatData: any[], valueField: string): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];
    // Bước 1: Map từng item theo ID
    flatData.forEach((item) => {
      map.set(item[valueField], { ...item, _children: [] });
    });
    // Bước 2: Gắn item vào parent hoặc top-level
    flatData.forEach((item) => {
      const current = map.get(item[valueField]);
      if (item.ParentID && item.ParentID != 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(current);
        } else {
          tree.push(current);
        }
      } else {
        tree.push(current);
      }
    });
    return tree;
  }
  //end
  drawTbProjectPartListVersionPO(): void {
    // Kiểm tra ViewChild đã được khởi tạo chưa
    if (!this.tb_projectPartListVersionPOContainer) {
      console.warn('tb_projectPartListVersionPOContainer chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.drawTbProjectPartListVersionPO(), 100);
      return;
    }
    this.tb_projectPartListVersionPO = new Tabulator(
      this.tb_projectPartListVersionPOContainer.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        pagination: false,
        paginationMode: 'local',
        data: this.dataPOVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        rowHeader: false,
        headerSort: false,
        groupHeader: (value: any) => `Danh mục: ${value}`,
        columns: [
          {
            title: 'STT',
            field: 'STT',
            width: 30,
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
          },
          {
            title: 'Sử dụng',
            field: 'IsActive',
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            width: 30,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
            },
          },
          {
            title: 'Mã',
            field: 'Code',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 80,
          },
          {
            title: 'Mô tả',
            field: 'DescriptionVersion',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: 'textarea',
            variableHeight: true,
            headerSort: false,
            width: 300,
          },
          {
            title: 'Người tạo',
            field: 'FullNameCreated',
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'ProjectTypeID',
            field: 'ProjectTypeID',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
          },
        ],
      }
    );
    this.tb_projectPartListVersionPO.on('rowClick', (e: any, row: any) => {
      console.log('row', row);
      // Kiểm tra nếu row đang được chọn hay bị bỏ chọn
      const isSelected = row.isSelected();
      
      if (isSelected) {
        // Row được chọn
        const data = row.getData();
        this.selectionCode = data.Code;
        this.projectTypeID = data.ProjectTypeID;
        this.projectTypeName = data.ProjectTypeName;
        this.projectCode = data.ProjectCode;
        this.versionPOID = data.ID || 0;
        this.type = 2; // PO
        this.CodeName = data.Code;
        // Bỏ chọn tất cả các dòng đã chọn trong bảng solutionVersion (nếu bảng tồn tại)
        if (this.tb_projectPartListVersion) {
          const selectedRows = this.tb_projectPartListVersion.getSelectedRows();
          selectedRows.forEach((selectedRow: any) => {
            selectedRow.deselect();
          });
        }
        console.log('type', this.type);
        this.toggleTBPColumn();
        this.loadDataProjectPartList();
      } else {
        // Row bị bỏ chọn - reset các biến về giá trị mặc định
        const selectedRows = this.tb_projectPartListVersionPO.getSelectedRows();
        if (selectedRows.length === 0) {
          // Không còn row nào được chọn
          this.type = 0;
          this.versionID = 0;
          this.versionPOID = 0;
          this.selectionCode = '';
          this.projectTypeID = 0;
          this.projectTypeName = '';
          this.projectCode = '';
          this.CodeName = '';
          console.log('type reset to:', this.type);
          this.toggleTBPColumn();
        //  this.loadDataProjectPartList();
        this.dataProjectWorker = [];
        if (this.tb_projectWorker) {
          this.tb_projectWorker.setData([]);
        }
        }
      }
    });
  }
  // Helper function: Vẽ màu cho cell giống CustomDrawNodeCell trong WinForm
  customDrawNodeCell(cell: any, field: string, checkField: string): string {
    const data = cell.getRow().getData();
    const value = cell.getValue();
    // Chỉ áp dụng cho node lá (không có children) - giống WinForm: if (e.Node.HasChildren) return;
    const hasChildren = data._children && data._children.length > 0;
    if (hasChildren) return value || '';
    // Chỉ áp dụng nếu IsNewCode = true - giống WinForm: if (!isNewCode) return;
    const isNewCode = data.IsNewCode === true;
    if (!isNewCode) return value || '';
    // Kiểm tra totalSame của field tương ứng - giống WinForm: if (totalSame == 0) → màu hồng
    const totalSame = Number(data[checkField]) || 0;
    // Nếu totalSame = 0 → Background Pink - giống WinForm: e.Appearance.BackColor = Color.Pink
    if (totalSame === 0) {
      const cellElement = cell.getElement();
      if (cellElement) {
        cellElement.style.backgroundColor = 'pink';
      }
    }
    return value || '';
  }
  // Hàm áp dụng màu cho cell sau khi render (giống WinForm CustomDrawNodeCell)
  applyCellColor(cell: any, field: string, checkField: string, element?: HTMLElement): void {
    try {
      const data = cell.getRow().getData();
      // Nếu có truyền element thì dùng element; nếu không thì lấy từ cell
      const el = element || cell.getElement();
      if (!el) return;
      // 1) Nếu node có children → không tô màu
      if (data._children && data._children.length > 0) {
        return;
      }
      // 2) Các trạng thái ưu tiên không áp dụng màu
      if (data.IsDeleted === true) return;      // đỏ
      if (data.IsProblem === true) return;      // cam
      if ((Number(data.QuantityReturn) || 0) > 0) return; // xanh lá
      // 3) Kiểm tra isNewCode
      if (data.IsNewCode !== true) return;
      // 4) Kiểm tra checkField → nếu = 0 tô hồng
      const checkValue = Number(data[checkField]) || 0;
      if (checkValue === 0) {
        el.style.backgroundColor = 'pink';
      }
    } catch (e) {
      console.error('Error applying cell color:', e);
    }
  }
  // Hàm áp dụng màu xanh nước biển cho cột Mã thiết bị khi IsFix = true
  applyIsFixColor(cell: any): void {
    try {
      const data = cell.getRow().getData();
      // Chỉ áp dụng cho node lá (không có children)
      if (data._children && data._children.length > 0) {
        return;
      }
      // Kiểm tra IsDeleted → không áp dụng (ưu tiên màu đỏ)
      if (data.IsDeleted === true) {
        return;
      }
      // Kiểm tra IsProblem → không áp dụng (ưu tiên màu cam)
      if (data.IsProblem === true) {
        return;
      }
      // Kiểm tra QuantityReturn > 0 → không áp dụng (ưu tiên màu xanh lá cây)
      const quantityReturn = Number(data.QuantityReturn) || 0;
      if (quantityReturn > 0) {
        return;
      }
      // Kiểm tra IsFix = true
      const isFix = data.IsFix === true;
      if (isFix) {
        const cellElement = cell.getElement();
        if (cellElement) {
          // Tô màu xanh nước biển (steelblue)
          cellElement.style.backgroundColor = '#4682B4'; // steelblue
          cellElement.style.color = 'white'; // Chữ màu trắng để dễ đọc
        }
      }
    } catch (e) {
      console.error('Error applying IsFix color:', e);
    }
  }
  // Hàm áp dụng màu light yellow cho cột Mã thiết bị khi IsProductSale không null/empty và IsFix không bằng true
  // Chỉ áp dụng khi không có màu khác (ưu tiên thấp nhất)
  applyIsProductSaleColor(cell: any): void {
    try {
      const data = cell.getRow().getData();
      // Chỉ áp dụng cho node lá (không có children)
      if (data._children && data._children.length > 0) {
        return;
      }
      // Kiểm tra IsDeleted → không áp dụng (ưu tiên màu đỏ)
      if (data.IsDeleted === true) {
        return;
      }
      // Kiểm tra IsProblem → không áp dụng (ưu tiên màu cam)
      if (data.IsProblem === true) {
        return;
      }
      // Kiểm tra QuantityReturn > 0 → không áp dụng (ưu tiên màu xanh lá cây)
      const quantityReturn = Number(data.QuantityReturn) || 0;
      if (quantityReturn > 0) {
        return;
      }
      // Kiểm tra IsFix = true → không áp dụng màu light yellow (ưu tiên màu xanh nước biển)
      const isFix = data.IsFix === true;
      if (isFix) {
        return;
      }
      // Kiểm tra IsNewCode và IsSameProductCode = 0 → không áp dụng màu light yellow (ưu tiên màu hồng)
      const isNewCode = data.IsNewCode === true;
      const isSameProductCode = parseInt(data.IsSameProductCode) || 0;
      if (isNewCode && isSameProductCode === 0) {
        return;
      }
      // Kiểm tra IsProductSale không null và không empty
      const isProductSale = data.IsProductSale;
      const hasIsProductSale = isProductSale != null && isProductSale !== '' && isProductSale !== undefined;
      if (hasIsProductSale) {
        const cellElement = cell.getElement();
        if (cellElement) {
          // Chỉ tô màu light yellow khi không có màu khác
          cellElement.style.backgroundColor = '#FFFFE0'; // light yellow
        }
      }
    } catch (e) {
      console.error('Error applying IsProductSale color:', e);
    }
  }
  // Hàm áp dụng màu cho tất cả các cell sau khi data được load (giống WinForm CustomDrawNodeCell)
  applyCellColors(): void {
    try {
      if (!this.tb_projectWorker) return;
      const rows = this.tb_projectWorker.getRows();
      rows.forEach((row: any) => {
        const data = row.getData();
        // Chỉ áp dụng cho node lá (không có children) - giống WinForm: if (e.Node.HasChildren) return;
        if (data._children && data._children.length > 0) {
          return;
        }
        // Kiểm tra các điều kiện màu theo thứ tự ưu tiên
        const isDeleted = data.IsDeleted === true;
        const isProblem = data.IsProblem === true;
        const quantityReturn = Number(data.QuantityReturn) || 0;
        const isFix = data.IsFix === true;
        const isNewCode = data.IsNewCode === true;
        const isSameProductCode = parseInt(data.IsSameProductCode) || 0;
        // Chỉ áp dụng màu cho ProductCode nếu không có màu row-level (đỏ, cam, xanh lá)
        if (!isDeleted && !isProblem && quantityReturn === 0) {
          if (isFix) {
            // Ưu tiên cao nhất: IsFix = true → màu xanh nước biển
            try {
              const productCodeCell = row.getCell('ProductCode');
              if (productCodeCell) {
                const cellElement = productCodeCell.getElement();
                if (cellElement) {
                  cellElement.style.backgroundColor = '#4682B4'; // steelblue
                  cellElement.style.color = 'white';
                }
              }
            } catch (e) {
              // Ignore errors for cells that don't exist
            }
          } else {
            // Nếu IsFix không bằng true, kiểm tra các màu khác trước
            // Áp dụng màu hồng từ IsNewCode (nếu có) - ưu tiên thứ 2
            if (isNewCode && isSameProductCode === 0) {
              // Màu hồng sẽ được áp dụng trong phần fieldsToCheck bên dưới
            } else {
              // Nếu không có màu hồng, kiểm tra IsProductSale để tô màu light yellow - ưu tiên thấp nhất
              try {
                const productCodeCell = row.getCell('ProductCode');
                if (productCodeCell) {
                  const isProductSale = data.IsProductSale;
                  const hasIsProductSale = isProductSale != null && isProductSale !== '' && isProductSale !== undefined;
                  if (hasIsProductSale) {
                    const cellElement = productCodeCell.getElement();
                    if (cellElement) {
                      // Chỉ tô màu light yellow khi không có màu khác
                      cellElement.style.backgroundColor = '#FFFFE0'; // light yellow
                    }
                  }
                }
              } catch (e) {
                // Ignore errors for cells that don't exist
              }
            }
          }
        }
        // Áp dụng màu hồng cho các cột khi IsNewCode = true và IsSame* = 0
        // (giống WinForm: e.Column == colGroupMaterial, colProductCode, colManufacturer, colUnit)
        // Lưu ý: ProductCode sẽ bị ghi đè bởi màu IsFix nếu IsFix = true
        if (isNewCode) {
          const fieldsToCheck = [
            { field: 'GroupMaterial', checkField: 'IsSameProductName' },
            { field: 'ProductCode', checkField: 'IsSameProductCode' },
            { field: 'Manufacturer', checkField: 'IsSameMaker' },
            { field: 'Unit', checkField: 'IsSameUnit' }
          ];
          fieldsToCheck.forEach(({ field, checkField }) => {
            // Bỏ qua ProductCode nếu IsFix = true (đã được tô màu xanh nước biển)
            if (field === 'ProductCode' && isFix) {
              return;
            }
            // Bỏ qua ProductCode nếu đã có màu light yellow (IsProductSale)
            if (field === 'ProductCode' && !isFix && !isNewCode) {
              return;
            }
            const checkValue = Number(data[checkField]) || 0;
            if (checkValue === 0) {
              try {
                const cell = row.getCell(field);
                if (cell) {
                  const cellElement = cell.getElement();
                  if (cellElement) {
                    // Chỉ tô màu hồng nếu chưa có màu khác
                    const currentBgColor = cellElement.style.backgroundColor;
                    const hasOtherColor = currentBgColor &&
                      currentBgColor !== 'transparent' &&
                      currentBgColor !== 'rgba(0, 0, 0, 0)' &&
                      currentBgColor !== '';
                    if (!hasOtherColor) {
                      cellElement.style.backgroundColor = 'pink'; // giống WinForm: Color.Pink
                    }
                  }
                }
              } catch (e) {
                // Ignore errors for cells that don't exist
              }
            }
          });
        }
      });
    } catch (e) {
      console.error('Error applying cell colors:', e);
    }
  }
  // Method để build context menu động dựa trên type
  getContextMenuItems(): any[] {
    const menuItems: any[] = [
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/price_history_16.png" alt="Chuyển dự án" class="me-1" /> Xem sản phẩm trong kho, lịch sử giá</span>',
        action: (e: any, row: any) => {
          // Lưu row vào lastClickedPartListRow để method có thể lấy productCode (theo yêu cầu)
          this.lastClickedPartListRow = row;
          // Method sẽ tự lấy productCode từ lastClickedPartListRow
          this.openProjectPartListHistory();
        },
      },
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/money_16.png" alt="Lấy giá lịch sử" class="me-1" /> Lấy giá lịch sử</span>',
        action: (e: any, row: any) => {
          this.lastClickedPartListRow = row;
          this.getPriceHistory();
        },
      },
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/revert_16.png" alt="Khôi phục" class="me-1" /> Khôi phục</span>',
        action: (e: any, row: any) => {
          this.lastClickedPartListRow = row;
          this.restoreDelete();
        }
      },
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/add_PO_16.png" alt="Hủy đã mua" class="me-1" />Bổ sung vào PO</span>',
        action: (e: any, row: any) => {
          this.lastClickedPartListRow = row;
          this.additionalPartListPO();
        },
      }
    ];
    // Chỉ thêm 2 action "Đã mua" và "Hủy đã mua" khi type === 2 (bảng PO)
    if (this.type === 2) {
      menuItems.push(
        {
          label: '<span style="font-size: 0.75rem;"><img src="assets/icon/buy_16.png" alt="Đã mua" class="me-1" /> Đã mua</span>',
          action: (e: any, row: any) => {
            this.lastClickedPartListRow = row;
            this.techBought();
          },
        },
        {
          label: '<span style="font-size: 0.75rem;"><img src="assets/icon/unbuy_16.png" alt="Hủy đã mua" class="me-1" /> Hủy đã mua</span>',
          action: (e: any, row: any) => {
            this.lastClickedPartListRow = row;
            this.unTechBought();
          },
        },

      );
    }
    return menuItems;
  }
  // Context menu cho bảng phiên bản giải pháp
  getSolutionVersionContextMenu(rowData: any): any[] {
    return [
      {
        label: '<span style="font-size: 0.75rem;"><img src="assets/icon/convert_po_16.png" class="me-1" /> Chuyển thành PO</span>',
        action: () => this.convertVersionToPO(rowData),
      },
    ];
  }

  // Chuyển phiên bản giải pháp thành PO
  convertVersionToPO(rowData: any): void {
    if (!rowData || !rowData.ID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản hợp lệ!');
      return;
    }
    // Không cho chuyển nếu đã là PO
    if (rowData.StatusVersion === 2) {
      this.notification.info('Thông báo', 'Phiên bản này đã là PO.');
      return;
    }
    const payload = {
      ID: rowData.ID,
      ProjectTypeID: rowData.ProjectTypeID,
      ProjectSolutionID: rowData.ProjectSolutionID,
      ProjectTypeName: rowData.ProjectTypeName,
      ProjectID: this.projectId,
    };
    this.startLoading();
    // dùng as any để tránh lỗi type khi mở rộng service
    (this.projectPartListService as any).convertVersionPO(payload).subscribe({
      next: (res: any) => {
        this.notification.success('Thành công', res?.message || 'Đã chuyển phiên bản thành PO');
        // Reload bảng PO để hiển thị phiên bản mới tạo
        this.loadDataSolution();
        this.loadDataProjectPartListVersion();
        this.loadDataProjectPartListVersionPO();
      },
      error: (err: any) => {
        const msg = err?.error?.message || err?.message || 'Chuyển phiên bản thất bại';
        this.notification.error('Lỗi', msg);
      },
      complete: () => this.stopLoading(),
    });
  }
  private textWithTooltipFormatter = (cell: any): HTMLElement => {
    const value = cell.getValue();
    const div = document.createElement('div');
    
    if (!value || value.trim() === '') {
      return div;
    }
    
    // Style cho div: giới hạn 3 dòng với ellipsis
    div.style.cssText = `
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
      max-height: calc(1.4em * 3);
      cursor: text;
    `;
    
    // Chuyển đổi URLs thành links
    const linkedText = this.linkifyText(value);
    div.innerHTML = linkedText;
    
    // Thêm title attribute để hiển thị tooltip với text gốc (không có HTML)
    div.title = value;
    
    // Cho phép click vào links mà không trigger row selection
    div.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.stopPropagation(); // Ngăn không cho event bubble lên row
      }
    });
    
    return div;
  };
  
  /**
   * Chuyển đổi URLs trong text thành clickable links
   * @param text - Text có thể chứa URLs
   * @returns HTML string với URLs được chuyển thành <a> tags
   */
  private linkifyText(text: string): string {
    // Regex pattern để match URLs (http, https, ftp, www)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    
    // Escape HTML để tránh XSS
    const escapeHtml = (str: string): string => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    // Split text thành các phần (text và URLs)
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    // Reset regex
    urlPattern.lastIndex = 0;
    
    while ((match = urlPattern.exec(text)) !== null) {
      // Thêm text trước URL
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }
      
      // Xử lý URL
      let url = match[0];
      let href = url;
      
      // Thêm protocol nếu chưa có
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }
      
      // Tạo link với target="_blank" để mở tab mới
      parts.push(`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline; cursor: pointer;">${escapeHtml(url)}</a>`);
      
      lastIndex = match.index + match[0].length;
    }
    
    // Thêm phần text còn lại
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }
    
    return parts.join('');
  }
  drawTbProjectPartList(): void {
    // Kiểm tra ViewChild đã được khởi tạo chưa
    if (!this.tb_projectWorkerContainer) {
      console.warn('tb_projectWorkerContainer chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.drawTbProjectPartList(), 100);
      return;
    }
    this.tb_projectWorker = new Tabulator(
      this.tb_projectWorkerContainer.nativeElement,
      {
        dataTree: true,
        dataTreeStartExpanded: true,
        dataTreeChildField: '_children', // Quan trọng: dùng _children
        dataTreeElementColumn: 'TT', // Chỉ định cột hiển thị tree toggle
        pagination: false,
        layout: 'fitDataStretch',
        selectableRows: true,
        height: '100%',
        maxHeight: '100%',
        rowContextMenu: (e: any, row: any) => {
          return this.getContextMenuItems();
        },
        rowFormatter: (row: any) => {
          const data = row.getData();
          const el = row.getElement();
          // Reset style
          el.style.cssText = '';
          // === LOGIC VẼ MÀU GIỐNG WINFORM NodeCellStyle ===
          const hasChildren = data._children && data._children.length > 0;
          const isDeleted = data.IsDeleted === true;
          const isProblem = data.IsProblem === true;
          const quantityReturn = Number(data.QuantityReturn) || 0;
          // 1. Ưu tiên cao nhất: Dòng bị xóa → Red + White text
          if (isDeleted) {
            el.style.backgroundColor = 'red';
            el.style.color = 'black';
            return;
          }
          // 2. Dòng có vấn đề → Orange
          if (isProblem) {
            el.style.backgroundColor = 'orange';
            return;
          }
          // 3. Số lượng trả về > 0 → LightGreen
          if (quantityReturn > 0) {
            el.style.backgroundColor = 'lightgreen';
            return;
          }
          // 4. Node cha (có children) → LightGray + Bold
          if (hasChildren) {
            el.style.backgroundColor = 'lightgray';
            el.style.fontWeight = 'bold';
            return;
          }
          // 5. Node lá không có điều kiện đặc biệt → màu trắng mặc định
        },
        columns: [
          {
            title: 'Vật tư dự án',
            frozen: true,
            columns: [
              // === CỘT CHỌN DÒNG ===
              {
                title: 'rowSelection',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 50,
                formatter: 'rowSelection',
                titleFormatter: 'rowSelection',
                frozen: true,
              },
              {
                title: 'TT',
                field: 'TT',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                frozen: true,
                bottomCalc: (values: any[], data: any[]) => {
                  // Tính tổng chỉ cho các node cha (không có parent)
                  const parentNodes = data.filter((row: any) => {
                    return !row.ParentID || row.ParentID === 0;
                  });
                  return parentNodes.length;
                },
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null ? value.toLocaleString('vi-VN') : '0';
                },
              },
              {
                title: 'Tên vật tư',
                field: 'GroupMaterial',
                formatter: (cell: any) => {
                  // Lấy giá trị đã xử lý từ customDrawNodeCell
                  const value = this.customDrawNodeCell(cell, 'GroupMaterial', 'IsSameProductName');
                  // Tạo element để Tabulator tính đúng chiều cao
                  const div = document.createElement('div');
                  div.innerText = value;
                  // Style để không bị hụt khi chữ dài
                  div.style.whiteSpace = 'pre-wrap';
                  div.style.wordWrap = 'break-word';
                  div.style.lineHeight = '1.4';
                  // Áp dụng màu (nếu có)
                  this.applyCellColor(cell, 'GroupMaterial', 'IsSameProductName', div);
                  return div;
                },
                variableHeight: true,   // quan trọng để auto giãn dòng
                widthGrow: 2,
                width: 200,
                frozen: true,
              },
              {
                title: 'Mã thiết bị',
                field: 'ProductCode',
                frozen: true,
                formatter: (cell: any) => {
                  // Áp dụng logic CustomDrawNodeCell (giống WinForm treeListData_CustomDrawNodeCell)
                  const result = this.customDrawNodeCell(cell, 'ProductCode', 'IsSameProductCode');
                  // Đảm bảo màu được áp dụng sau khi render
                  setTimeout(() => {
                    this.applyCellColor(cell, 'ProductCode', 'IsSameProductCode');
                    // Nếu IsFix = true, tô màu xanh nước biển cho cột Mã thiết bị (ưu tiên cao nhất)
                    this.applyIsFixColor(cell);
                    // Nếu IsProductSale không null/empty và IsFix không bằng true, tô màu light yellow
                    this.applyIsProductSaleColor(cell);
                  }, 0);
                  return result;
                },
                widthGrow: 5,
                maxWidth: 200,
                
              },
              { title: 'Thông số kỹ thuật', field: 'Model',   
                formatter: this.textWithTooltipFormatter,  // ← Thay đổi này
                widthGrow: 2,
                maxWidth: 300,
                variableHeight: true, },
              {
                title: 'Số lượng / 1 máy', field: 'QtyMin', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              {
                title: 'Số lượng tổng', field: 'QtyFull', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
            ]
          },
          {
            title: '',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              { title: 'Mã đặc biệt', field: 'SpecialCode' },
              {
                title: 'Hãng SX',
                field: 'Manufacturer',
                formatter: (cell: any) => {
                  // Áp dụng logic CustomDrawNodeCell (giống WinForm treeListData_CustomDrawNodeCell)
                  const result = this.customDrawNodeCell(cell, 'Manufacturer', 'IsSameMaker');
                  // Đảm bảo màu được áp dụng sau khi render
                  setTimeout(() => {
                    this.applyCellColor(cell, 'Manufacturer', 'IsSameMaker');
                  }, 0);
                  return result;
                },
              },
              {
                title: 'Đơn vị',
                field: 'Unit',
                hozAlign: 'center',
                formatter: (cell: any) => {
                  // Áp dụng logic CustomDrawNodeCell (giống WinForm treeListData_CustomDrawNodeCell)
                  const result = this.customDrawNodeCell(cell, 'Unit', 'IsSameUnit');
                  // Đảm bảo màu được áp dụng sau khi render
                  setTimeout(() => {
                    this.applyCellColor(cell, 'Unit', 'IsSameUnit');
                  }, 0);
                  return result;
                },
              },
              {
                title: 'Tích xanh',
                field: 'IsFix',
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
              {
                title: 'TBP duyệt',
                field: 'IsApprovedTBPText',  // Sửa: dùng text thay vì boolean
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === 'Đã duyệt' ? 'checked' : '')} onclick="return false;">`;
                }
              },
              {
                title: 'Hàng mới',
                headerHozAlign: 'center',
                hozAlign: 'center',
                field: 'IsNewCode',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
              {
                title: 'TBP duyệt sản phẩm mới',
                field: 'IsApprovedTBPNewCode',  // Sửa: dùng field đúng
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
              {
                title: 'Đơn giá',
                field: 'Price',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('Price'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              {
                title: 'Tổng tiền',
                field: 'Amount',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('Amount'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              {
                title: 'Đơn giá lịch sử',
                field: 'UnitPriceHistory',
                hozAlign: 'right',
                headerHozAlign: 'center',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              { title: 'Loại tiền', field: 'CurrencyCode', headerHozAlign: 'center' },
              { title: 'Chất lượng', field: 'Quality', headerHozAlign: 'center' },
              { title: 'Người tạo', field: 'FullNameCreated', headerHozAlign: 'center' },
              {
                title: 'Ngày tạo', field: 'CreatedDate', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              {
                title: 'Ghi chú',
                field: 'Note',
                formatter: this.textWithTooltipFormatter,  // ← Thay đổi này
                widthGrow: 2,
                maxWidth: 300,
                variableHeight: true,
              },
              {
                title: 'Lý do phát sinh',
                field: 'ReasonProblem',
                formatter: this.textWithTooltipFormatter,  // ← Thay đổi này
                widthGrow: 2,
                maxWidth: 300,
                variableHeight: true,
              },
              { title: 'Lý do xóa', field: 'ReasonDeleted' },
            ]
          },
          {
            title: 'Yêu cầu báo giá',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Check giá',
                field: 'IsCheckPrice',
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                },
              },
              { title: 'Trạng thái báo giá', field: 'StatusPriceRequestText', hozAlign: 'center' },
              { title: 'NV báo giá', field: 'FullNameQuote' },
              {
                title: 'Ngày yêu cầu', hozAlign: 'center', field: 'DatePriceRequest', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              { title: 'Người yêu cầu', field: 'FullNameRequestPrice' },
              {
                title: 'Deadline Báo giá', hozAlign: 'center', field: 'DeadlinePriceRequest', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              {
                title: 'Ngày báo giá', hozAlign: 'center', field: 'DatePriceQuote', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              {
                title: 'Đơn giá báo',
                field: 'UnitPriceQuote',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('UnitPriceQuote'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              {
                title: 'Thành tiền báo giá',
                field: 'TotalPriceQuote1',  // Sửa: dùng TotalPriceQuote1
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              { title: 'Loại tiền', field: 'CurrencyQuote', hozAlign: 'center' },
              {
                title: 'Tỷ giá báo', field: 'CurrencyRateQuote', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },
              {
                title: 'Thành tiền quy đổi báo giá (VND)',
                field: 'TotalPriceExchangeQuote',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('TotalPriceExchangeQuote'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              { title: 'Nhà cung cấp báo giá', field: 'NameNCCPriceQuote', hozAlign: 'right' },
              {
                title: 'Lead Time báo giá', field: 'LeadTimeQuote', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },
              {
                title: 'Ngày về dự kiến', field: 'DateExpectedQuote', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              { 
                title: 'Ghi chú báo giá', field: 'NoteQuote',
                    formatter: this.textWithTooltipFormatter,  // ← Thay đổi này 
              },
            ]
          },
          {
            title: 'Yêu cầu mua hàng',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Yêu cầu mua', field: 'IsApprovedPurchase',
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === 'Đã ' || value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
              { title: 'Người yêu cầu mua', field: 'FullNameRequestPurchase', hozAlign: 'left' },  // Sửa: dùng FullNameRequestPurchase
              { title: 'Tình trạng', field: 'StatusText', hozAlign: 'center' },  // Sửa: không có StatusPurchaseRequestText
              { title: 'NV mua hàng', field: 'FullNamePurchase', hozAlign: 'left' },  // Sửa: dùng FullNamePurchase
              {
                title: 'Deadline mua hàng', field: 'ExpectedReturnDate', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa: không có DeadlinePurchaseRequest
              {
                title: 'Ngày yêu cầu đặt hàng', field: 'RequestDate', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa
              {
                title: 'Ngày bắt đầu đặt hàng', field: 'RequestDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa
              {
                title: 'Ngày dự kiến đặt hàng', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa
              {
                title: 'Ngày dự kiến hàng về', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa
              {
                title: 'Mã đặt hàng',
                field: 'BillCodePurchase', hozAlign: 'left'  // Sửa
              },
              {
                title: 'Đơn giá mua hàng',
                field: 'UnitPricePurchase',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('UnitPricePurchase'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              {
                title: 'Thành tiền mua hàng',
                field: 'TotalPricePurchase',  // Sửa: dùng TotalPricePurchaseExport
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('TotalPricePurchase'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              { title: 'Loại tiền', field: 'CurrencyPurchase', hozAlign: 'center' },
              {
                title: 'Tỷ giá mua', field: 'CurrencyRatePurchase', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },
              {
                title: 'Thành tiền quy đổi mua hàng (VND)',
                field: 'TotalPriceExchangePurchase',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
                bottomCalc: this.createBottomCalcByParent('TotalPriceExchangePurchase'),
                bottomCalcFormatter: (cell: any) => {
                  return this.formatMoney(cell.getValue(), 2);
                },
              },
              { title: 'NCC mua hàng', field: 'SupplierNamePurchase', hozAlign: 'right' },  // Sửa
              {
                title: 'Lead Time đặt hàng', field: 'LeadTimePurchase', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              {
                title: 'SL đã về', field: 'QuantityReturn', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa: không có QtyReceivePurchase
              {
                title: 'SL đã xuất', field: 'TotalExport', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              {
                title: 'SL còn lại', field: 'RemainQuantity', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'center' },  // Sửa
              { title: 'Phiếu xuất', field: 'BillExportCode', hozAlign: 'center' },  // Sửa
              {
                title: 'Ngày nhận hàng', field: 'DateImport', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },  // Sửa
              { title: 'Ghi chú mua', field: 'NotePurchase', 
                widthGrow: 2,
                maxWidth: 300,
                variableHeight: true,
                formatter: this.textWithTooltipFormatter,  // ← Thay đổi này 
              },
            ]
          },
          {
            title: '',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Ngày nhập kho', field: 'DateImport', hozAlign: 'center', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
              },
              { title: 'Mã phiếu nhập', field: 'BillImportCode', hozAlign: 'center' },  // Sửa
              { title: 'Người nhập kho', field: 'Reciver', hozAlign: 'left' },  // Sửa: dùng FullNameCreated
              { title: 'Kho nhập', field: 'KhoType', hozAlign: 'left' },  // Sửa: không có WarehouseNamePurchase
            ]
          },
          //cột phục vụ y/c mua
          {
            title: 'Tồn CK( được sử dụng)',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Hà Nội', field: 'TotalHN', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              {
                title: 'Hồ Chí Minh', field: 'TotalHCM', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              {
                title: 'Đan phượng', field: 'TotalDP', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa: không có DanPhuong
              {
                title: 'Hải Phòng', field: 'TotalHP', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
              {
                title: 'Bắc Ninh', field: 'TotalBN', hozAlign: 'right', formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                }
              },  // Sửa
            ]
          },
        ],
      }
    );
    this.tb_projectWorker.on('dataLoaded', () => {
      setTimeout(() => {
        this.applyDeletedRowStyle();
        // Áp dụng màu cho các cell
        this.applyCellColors();
      }, 50); // Đảm bảo DOM đã render xong
    });
    // Lưu row khi chuột phải (context menu) - để có thể lấy productCode
    this.tb_projectWorker.on('rowContext', (e: any, row: any) => {
      this.lastClickedPartListRow = row;
    });
    // Lưu cell được click để có thể copy sau
    let lastClickedCell: any = null;
    
    this.tb_projectWorker.on('cellClick', (e: any, cell: any) => {
      const field = cell.getField();
      if (field === 'rowSelection') return;
      
      // Lưu cell được click để copy khi nhấn Ctrl+C
      lastClickedCell = cell;
      
      // Xóa highlight cũ
      if (this.lastClickedPartListRow) {
        const oldElement = this.lastClickedPartListRow.getElement();
        if (oldElement) {
          oldElement.style.outline = '';
        }
      }
      // Lưu và highlight dòng mới
      this.lastClickedPartListRow = cell.getRow();
      const rowData = this.lastClickedPartListRow.getData();
      const newElement = this.lastClickedPartListRow.getElement();
      if (newElement) {
        newElement.style.outline = '3px solid rgb(119, 133, 29)';
        newElement.style.outlineOffset = '2px';
      }
      console.log('Cell clicked - Row TT:', rowData.TT, 'ID:', rowData.ID);
    });

    // Lắng nghe sự kiện Ctrl+C để copy dữ liệu cell
    this.tb_projectWorker.on('tableBuilt', () => {
      const tableElement = this.tb_projectWorker.element;
      if (tableElement) {
        tableElement.addEventListener('keydown', (e: KeyboardEvent) => {
          // Kiểm tra Ctrl+C hoặc Cmd+C (Mac)
          if ((e.ctrlKey || e.metaKey) && e.key === 'c' && lastClickedCell) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định
            
            const cellValue = lastClickedCell.getValue();
            const textToCopy = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
            
            if (textToCopy) {
              // Kiểm tra xem clipboard API có khả dụng không
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                  // Copy thành công
                }).catch((err) => {
                  console.error('Lỗi khi copy vào clipboard:', err);
                  // Fallback: sử dụng cách copy cũ nếu clipboard API không khả dụng
                  this.fallbackCopyTextToClipboard(textToCopy);
                });
              } else {
                // Nếu clipboard API không khả dụng, dùng fallback ngay
                this.fallbackCopyTextToClipboard(textToCopy);
              }
            }
          }
        });
      }
    });
    // Thêm event cellRendered để áp dụng màu sau khi cell được render
    this.tb_projectWorker.on('cellRendered', (cell: any) => {
      const field = cell.getField();
      const data = cell.getData();
      // Chỉ áp dụng cho các cột cần vẽ màu (giống WinForm: GroupMaterial, ProductCode, Manufacturer, Unit)
      if (field === 'GroupMaterial') {
        this.applyCellColor(cell, 'GroupMaterial', 'IsSameProductName');
      } else if (field === 'ProductCode') {
        this.applyCellColor(cell, 'ProductCode', 'IsSameProductCode');
        // Áp dụng màu xanh nước biển nếu IsFix = true (ưu tiên cao nhất)
        this.applyIsFixColor(cell);
        // Áp dụng màu light yellow nếu IsProductSale không null/empty và IsFix không bằng true
        this.applyIsProductSaleColor(cell);
      } else if (field === 'Manufacturer') {
        this.applyCellColor(cell, 'Manufacturer', 'IsSameMaker');
      } else if (field === 'Unit') {
        this.applyCellColor(cell, 'Unit', 'IsSameUnit');
      }
    });
    // Thêm logic: khi chọn nút cha, tự động chọn tất cả nút con
    // Xử lý cả chọn và bỏ chọn
    this.tb_projectWorker.on('rowSelectionChanged', (data: any[], rows: any[]) => {
      // Nếu đang toggle children, bỏ qua xử lý để tránh vòng lặp
      if (this.isTogglingChildren) {
        return;
      }
      
      // QUAN TRỌNG: Lưu reference row từ previousSelectedRows TRƯỚC khi kiểm tra deselected
      // Thử nhiều cách để tìm row reference
      const previousRowMap = new Map<number, any>();
      
      // Cách 1: Tìm trong allRows (visible rows)
      const allRowsForRef = this.tb_projectWorker.getRows();
      this.previousSelectedRows.forEach((id: number) => {
        if (!previousRowMap.has(id)) {
          allRowsForRef.forEach((row: any) => {
            const rowData = row.getData();
            if (rowData.ID === id) {
              previousRowMap.set(id, row);
            }
          });
        }
      });
      
      // Cách 2: Nếu chưa tìm thấy, thử getRows(true) để lấy cả collapsed rows
      if (previousRowMap.size < this.previousSelectedRows.size) {
        try {
          const allRowsExpanded = this.tb_projectWorker.getRows(true);
          this.previousSelectedRows.forEach((id: number) => {
            if (!previousRowMap.has(id)) {
              allRowsExpanded.forEach((row: any) => {
                const rowData = row.getData();
                if (rowData.ID === id) {
                  previousRowMap.set(id, row);
                }
              });
            }
          });
        } catch (e) {
          // Error getting rows
        }
      }
      
      // Cách 3: Thử tìm từ data parameter của event (có thể chứa row vừa bị deselect)
      if (previousRowMap.size < this.previousSelectedRows.size && data && data.length > 0) {
        data.forEach((rowData: any) => {
          const id = rowData.ID;
          if (this.previousSelectedRows.has(id) && !previousRowMap.has(id)) {
            // Tìm row object từ rowData
            allRowsForRef.forEach((row: any) => {
              if (row.getData().ID === id) {
                previousRowMap.set(id, row);
              }
            });
          }
        });
      }
      
      const allRows = this.tb_projectWorker.getRows();
      
      // Lấy danh sách các row ID hiện tại đang được chọn
      // Sử dụng getSelectedRows() để đảm bảo lấy đúng các rows đang được chọn
      const currentSelectedIds = new Set<number>();
      try {
        const selectedRows = this.tb_projectWorker.getSelectedRows();
        selectedRows.forEach((row: any) => {
          const rowData = row.getData();
          currentSelectedIds.add(rowData.ID);
        });
      } catch (e) {
        // Fallback: duyệt tất cả rows
        allRows.forEach((row: any) => {
          if (row.isSelected()) {
            const rowData = row.getData();
            currentSelectedIds.add(rowData.ID);
          }
        });
      }
      
      // Cũng kiểm tra tham số rows từ event (có thể chứa rows vừa được chọn/bỏ chọn)
      if (rows && rows.length > 0) {
        rows.forEach((row: any) => {
          const rowData = row.getData();
          if (row.isSelected()) {
            currentSelectedIds.add(rowData.ID);
          }
        });
      }
      
      // Tìm các row đã bị bỏ chọn (có trong previous nhưng không có trong current)
      const deselectedIds = new Set<number>();
      const deselectedRowMap = new Map<number, any>(); // Lưu reference row trước khi bị deselect
      this.previousSelectedRows.forEach((id: number) => {
        if (!currentSelectedIds.has(id)) {
          deselectedIds.add(id);
          // QUAN TRỌNG: Sử dụng reference row đã lưu từ previousRowMap
          if (previousRowMap.has(id)) {
            deselectedRowMap.set(id, previousRowMap.get(id));
          }
        }
      });
      
      // Tìm các row mới được chọn (có trong current nhưng không có trong previous)
      const selectedIds = new Set<number>();
      currentSelectedIds.forEach((id: number) => {
        if (!this.previousSelectedRows.has(id)) {
          selectedIds.add(id);
        }
      });
      
      // Logic 1: Chọn cha → các con được chọn
      // Xử lý cho tất cả node mới được chọn (selectedIds) - bao gồm cả node cha cấp 1, cấp 2, cấp 3...
      // Lấy selected rows trực tiếp từ Tabulator
      let selectedRows: any[] = [];
      try {
        selectedRows = this.tb_projectWorker.getSelectedRows();
      } catch (e) {
        // Fallback
      }
      
      // Sắp xếp selectedIds để xử lý các node cha trước (node không có parent hoặc có parent nhưng parent không có trong selectedIds)
      // Điều này đảm bảo khi xử lý children, parent đã được xử lý và children đã được chọn
      const sortedSelectedIds = Array.from(selectedIds).sort((a, b) => {
        // Tìm parent của mỗi node
        let aParent: any = null;
        let bParent: any = null;
        allRows.forEach((row: any) => {
          const rowData = row.getData();
          if (rowData.ID === a) {
            if (rowData.ParentID) {
              allRows.forEach((r: any) => {
                if (r.getData().ID === rowData.ParentID) {
                  aParent = r.getData();
                }
              });
            }
          }
          if (rowData.ID === b) {
            if (rowData.ParentID) {
              allRows.forEach((r: any) => {
                if (r.getData().ID === rowData.ParentID) {
                  bParent = r.getData();
                }
              });
            }
          }
        });
        
        // Node không có parent hoặc parent không có trong selectedIds → xử lý trước
        const aIsParent = !aParent || !selectedIds.has(aParent.ID);
        const bIsParent = !bParent || !selectedIds.has(bParent.ID);
        
        if (aIsParent && !bIsParent) return -1;
        if (!aIsParent && bIsParent) return 1;
        return 0;
      });
      
      sortedSelectedIds.forEach((selectedId: number) => {
        let foundRow = false;
        let targetRow: any = null;
        
        // Thử tìm trong selectedRows trước (nhanh hơn)
        selectedRows.forEach((row: any) => {
          const rowData = row.getData();
          if (rowData.ID === selectedId) {
            targetRow = row;
            foundRow = true;
          }
        });
        
        // Nếu không tìm thấy, tìm trong allRows
        if (!foundRow) {
          allRows.forEach((row: any) => {
            const rowData = row.getData();
            if (rowData.ID === selectedId) {
              targetRow = row;
              foundRow = true;
            }
          });
        }
        
        if (foundRow && targetRow) {
          const rowData = targetRow.getData();
          
          // QUAN TRỌNG: Kiểm tra xem node này đã có trong previousSelectedRows chưa
          // Nếu đã có, có nghĩa là nó đã được chọn bởi toggleChildrenSelection trong event trước đó
          // Bỏ qua để tránh xử lý lại
          if (this.previousSelectedRows.has(selectedId)) {
            return; // Bỏ qua node này
          }
          
          // QUAN TRỌNG: Kiểm tra xem node này có phải là child của một node cha đang được xử lý không
          // Nếu có, bỏ qua xử lý để tránh xử lý lại các children đã được chọn bởi toggleChildrenSelection
          let isChildOfProcessingParent = false;
          if (rowData.ParentID) {
            // Kiểm tra xem parent của node này có trong selectedIds không (đang được xử lý)
            if (selectedIds.has(rowData.ParentID)) {
              // Kiểm tra xem parent có phải là parent node (có children) không
              allRows.forEach((r: any) => {
                const rData = r.getData();
                if (rData.ID === rowData.ParentID) {
                  let parentHasChildren = false;
                  try {
                    const parentChildren = r.getTreeChildren();
                    parentHasChildren = parentChildren && parentChildren.length > 0;
                  } catch (e) {
                    parentHasChildren = rData._children && rData._children.length > 0;
                  }
                  if (parentHasChildren) {
                    isChildOfProcessingParent = true;
                  }
                }
              });
            }
          }
          
          if (isChildOfProcessingParent) {
            return; // Bỏ qua node này
          }
          
          // Kiểm tra xem row có phải là parent không (có children)
          let hasChildren = false;
          try {
            const treeChildren = targetRow.getTreeChildren();
            hasChildren = treeChildren && treeChildren.length > 0;
          } catch (e) {
            hasChildren = rowData._children && rowData._children.length > 0;
          }
          
          // QUAN TRỌNG: Thêm node vào previousSelectedRows ngay lập tức để tránh xử lý lại trong event tiếp theo
          this.previousSelectedRows.add(rowData.ID);
          
          if (hasChildren) {
            this.isTogglingChildren = true;
            this.toggleChildrenSelection(targetRow, true);
            // Không cần gọi updatePreviousSelectedRows() ở đây vì toggleChildrenSelection đã thêm children vào previousSelectedRows
            // Chỉ cần set isTogglingChildren về false sau một chút
            setTimeout(() => {
              this.isTogglingChildren = false;
            }, 50);
          }
        }
      });
      
      // Logic 1b: Xử lý đặc biệt cho node cha cấp 2+ (có cả parent và children)
      // Khi một node cha cấp 2+ được chọn (có thể do parent chọn nó thông qua toggleChildrenSelection),
      // đảm bảo children của nó cũng được chọn
      // Chỉ kiểm tra các node đang được chọn nhưng không có trong selectedIds (tức là được chọn bởi parent)
      // Lưu ý: Logic này chủ yếu là backup, vì toggleChildrenSelection đã xử lý đệ quy
      // Nhưng vẫn cần để xử lý các trường hợp edge case
      currentSelectedIds.forEach((nodeId: number) => {
        // Bỏ qua nếu đã xử lý trong Logic 1 (selectedIds)
        if (selectedIds.has(nodeId)) {
          return;
        }
        
        allRows.forEach((row: any) => {
          const rowData = row.getData();
          // Chỉ xử lý node có parent (tức là node cha cấp 2+) và đang được chọn
          // Kiểm tra ParentID: có thể là số, null, undefined, hoặc 0
          const hasParent = rowData.ParentID != null && rowData.ParentID !== 0 && rowData.ParentID !== '';
          if (rowData.ID === nodeId && row.isSelected() && hasParent) {
            // Kiểm tra xem row có phải là parent không (có children)
            let hasChildren = false;
            try {
              const treeChildren = row.getTreeChildren();
              hasChildren = treeChildren && treeChildren.length > 0;
            } catch (e) {
              hasChildren = rowData._children && rowData._children.length > 0;
            }
            
            if (hasChildren) {
              // Kiểm tra xem tất cả children đã được chọn chưa
              let allChildrenSelected = true;
              let childRows: any[] = [];
              try {
                childRows = row.getTreeChildren();
                if (childRows && childRows.length > 0) {
                  childRows.forEach((childRow: any) => {
                    if (!childRow.isSelected()) {
                      allChildrenSelected = false;
                    }
                  });
                }
              } catch (e) {
                // Fallback: kiểm tra qua ParentID
                allRows.forEach((r: any) => {
                  const rData = r.getData();
                  if (rData.ParentID === rowData.ID) {
                    childRows.push(r);
                    if (!r.isSelected()) {
                      allChildrenSelected = false;
                    }
                  }
                });
              }
              
              // Nếu node cha cấp 2+ được chọn nhưng không phải tất cả children đã được chọn
              // Kiểm tra xem có children nào đã được bỏ chọn độc lập không
              const childrenToSelect: any[] = [];
              childRows.forEach((childRow: any) => {
                const childData = childRow.getData();
                // Chỉ chọn children chưa được chọn VÀ không nằm trong danh sách đã bỏ chọn độc lập
                if (!childRow.isSelected() && !this.independentlyDeselectedNodes.has(childData.ID)) {
                  childrenToSelect.push(childRow);
                }
              });
              
              if (childrenToSelect.length > 0) {
                this.isTogglingChildren = true;
                // Chọn từng child một (không dùng toggleChildrenSelection vì nó sẽ chọn tất cả)
                childrenToSelect.forEach((childRow: any) => {
                  childRow.select();
                  const childData = childRow.getData();
                  this.previousSelectedRows.add(childData.ID);
                });
                setTimeout(() => {
                  this.isTogglingChildren = false;
                  this.updatePreviousSelectedRows();
                }, 100);
              }
            }
          }
        });
      });
      
      // Logic 2: Bỏ chọn cha → các con cũng được bỏ chọn
      // Logic 3: Bỏ chọn con độc lập khi vẫn chọn cha → chỉ bỏ chọn con đó
      deselectedIds.forEach((deselectedId: number) => {
        let targetRow: any = null;
        
        // QUAN TRỌNG: Sử dụng reference row đã lưu từ trước
        if (deselectedRowMap.has(deselectedId)) {
          targetRow = deselectedRowMap.get(deselectedId);
        } else {
          
          // Fallback: Tìm lại trong allRows
          allRows.forEach((row: any) => {
            const rowData = row.getData();
            if (rowData.ID === deselectedId && !targetRow) {
              targetRow = row;
            }
          });
          
          // Thử từ rows parameter của event
          if (!targetRow && rows && rows.length > 0) {
            rows.forEach((row: any) => {
              const rowData = row.getData();
              if (rowData.ID === deselectedId && !targetRow) {
                targetRow = row;
              }
            });
          }
          
          // Thử từ data parameter của event
          if (!targetRow && data && data.length > 0) {
            // data có thể chứa rowData objects, cần tìm row object
            allRows.forEach((row: any) => {
              const rowData = row.getData();
              data.forEach((d: any) => {
                if (d.ID === deselectedId && rowData.ID === deselectedId && !targetRow) {
                  targetRow = row;
                }
              });
            });
          }
          
          // Nếu vẫn không tìm thấy, thử dùng getRows(true) để lấy cả collapsed rows
          if (!targetRow) {
            try {
              const allRowsExpanded = this.tb_projectWorker.getRows(true);
              allRowsExpanded.forEach((row: any) => {
                const rowData = row.getData();
                if (rowData.ID === deselectedId && !targetRow) {
                  targetRow = row;
                }
              });
            } catch (e) {
              // Error getting rows
            }
          }
          
          // Nếu vẫn không tìm thấy, thử dùng findRow với filter function
          if (!targetRow) {
            try {
              const foundRows = this.tb_projectWorker.searchRows('ID', '=', deselectedId);
              if (foundRows && foundRows.length > 0) {
                targetRow = foundRows[0];
              }
            } catch (e) {
              // Error searching rows
            }
          }
        }
        
        // Nếu không tìm thấy row object, vẫn có thể xử lý bằng cách tìm children qua ParentID
        let rowData: any = null;
        let hasChildren = false;
        let childrenCount = 0;
        
        if (targetRow) {
          rowData = targetRow.getData();
          
          // Kiểm tra xem row có phải là parent không (có children)
          try {
            const treeChildren = targetRow.getTreeChildren();
            hasChildren = treeChildren && treeChildren.length > 0;
            childrenCount = treeChildren ? treeChildren.length : 0;
          } catch (e) {
            hasChildren = rowData._children && rowData._children.length > 0;
            childrenCount = rowData._children ? rowData._children.length : 0;
          }
        } else {
          // Không tìm thấy row object, tìm thông tin từ data hoặc tìm children trực tiếp
          // Thử lấy rowData từ data parameter
          if (data && data.length > 0) {
            const foundData = data.find((d: any) => d.ID === deselectedId);
            if (foundData) {
              rowData = foundData;
            }
          }
          
          // Nếu vẫn không có rowData, tạo object giả với ID
          if (!rowData) {
            rowData = { ID: deselectedId };
          }
          
          // QUAN TRỌNG: Tìm children từ selectedRows trước (vì children đang được chọn nên chắc chắn có trong selectedRows)
          const childrenRows: any[] = [];
          
          // Cách 1: Tìm trong selectedRows (children đang được chọn nên chắc chắn có ở đây)
          try {
            const selectedRows = this.tb_projectWorker.getSelectedRows();
            selectedRows.forEach((row: any) => {
              const childData = row.getData();
              if (childData.ParentID === deselectedId) {
                childrenRows.push(row);
              }
            });
          } catch (e) {
            // Error getting selected rows
          }
          
          // Cách 2: Nếu không tìm thấy trong selectedRows, thử tìm trong allRows
          if (childrenRows.length === 0) {
            allRows.forEach((row: any) => {
              const childData = row.getData();
              if (childData.ParentID === deselectedId) {
                childrenRows.push(row);
              }
            });
          }
          
          // Cách 3: Nếu vẫn không tìm thấy, thử getRows(true) để lấy cả collapsed rows
          if (childrenRows.length === 0) {
            try {
              const allRowsExpanded = this.tb_projectWorker.getRows(true);
              allRowsExpanded.forEach((row: any) => {
                const childData = row.getData();
                if (childData.ParentID === deselectedId) {
                  childrenRows.push(row);
                }
              });
            } catch (e) {
              // Error getting expanded rows
            }
          }
          
          hasChildren = childrenRows.length > 0;
          childrenCount = childrenRows.length;
          
          if (hasChildren && childrenRows.length > 0) {
            // Nếu tìm thấy children, có thể xử lý trực tiếp mà không cần row object của parent
            // Xóa children khỏi independentlyDeselectedNodes
            childrenRows.forEach((childRow: any) => {
              const childData = childRow.getData();
              this.independentlyDeselectedNodes.delete(childData.ID);
            });
            
            // Bỏ chọn tất cả children
            this.isTogglingChildren = true;
            childrenRows.forEach((childRow: any) => {
              const childData = childRow.getData();
              childRow.deselect();
              this.previousSelectedRows.delete(childData.ID);
              
              // Nếu child này cũng là parent, đệ quy bỏ chọn children của nó
              let hasGrandChildren = false;
              try {
                const grandChildren = childRow.getTreeChildren();
                hasGrandChildren = grandChildren && grandChildren.length > 0;
              } catch (e) {
                hasGrandChildren = childData._children && childData._children.length > 0;
              }
              
              if (hasGrandChildren) {
                this.toggleChildrenSelection(childRow, false);
              }
            });
            
            setTimeout(() => {
              this.isTogglingChildren = false;
              this.updatePreviousSelectedRows();
            }, 100);
            
            return; // Đã xử lý xong, không cần tiếp tục
          }
        }
        
        if (!rowData) {
          return;
        }
        
        // Kiểm tra xem node này có parent đang được chọn không
        let hasSelectedParent = false;
        let parentRow: any = null;
        if (rowData.ParentID) {
          // Tìm parent trong allRows
          allRows.forEach((r: any) => {
            const rData = r.getData();
            if (rData.ID === rowData.ParentID) {
              parentRow = r;
              if (r.isSelected()) {
                hasSelectedParent = true;
              }
            }
          });
          // Nếu không tìm thấy trong allRows, thử dùng getSelectedRows
          if (!parentRow) {
            try {
              const selectedRows = this.tb_projectWorker.getSelectedRows();
              selectedRows.forEach((r: any) => {
                const rData = r.getData();
                if (rData.ID === rowData.ParentID) {
                  parentRow = r;
                  hasSelectedParent = true;
                }
              });
            } catch (e) {
              // Error getting selected rows
            }
          }
        }
        
        // Nếu node có children → LUÔN bỏ chọn tất cả children (không phụ thuộc vào việc có parent được chọn hay không)
        if (hasChildren) {
          // Xóa tất cả children khỏi independentlyDeselectedNodes (vì parent đã bị bỏ chọn)
          try {
            const treeChildren = targetRow.getTreeChildren();
            if (treeChildren && treeChildren.length > 0) {
              treeChildren.forEach((childRow: any) => {
                const childData = childRow.getData();
                this.independentlyDeselectedNodes.delete(childData.ID);
              });
            }
          } catch (e) {
            // Fallback: xóa qua ParentID
            allRows.forEach((r: any) => {
              const rData = r.getData();
              if (rData.ParentID === rowData.ID) {
                this.independentlyDeselectedNodes.delete(rData.ID);
              }
            });
          }
          this.isTogglingChildren = true;
          this.toggleChildrenSelection(targetRow, false);
          // Cập nhật previousSelectedRows sau khi toggle xong
          setTimeout(() => {
            this.isTogglingChildren = false;
            this.updatePreviousSelectedRows();
          }, 100);
        } else {
          // Logic 3: Bỏ chọn con độc lập (không có children và có parent được chọn) → chỉ bỏ chọn node đó
          // QUAN TRỌNG: Cho phép bỏ chọn node con độc lập, không tự động chọn lại
          // Lưu node này vào danh sách các node đã được bỏ chọn độc lập
          // Để Logic 1b không tự động chọn lại nó
          if (hasSelectedParent) {
            this.independentlyDeselectedNodes.add(rowData.ID);
          }
        }
      });
      
      // Cập nhật previousSelectedRows
      this.updatePreviousSelectedRows();
    });
  }
  //#endregion
  // Helper function để cập nhật previousSelectedRows
  private updatePreviousSelectedRows(): void {
    // QUAN TRỌNG: Không ghi đè previousSelectedRows, mà merge với các rows đang được chọn
    // Điều này đảm bảo các children đã được thêm vào previousSelectedRows trong toggleChildrenSelection
    // không bị mất khi getRows() không trả về đủ rows (do collapsed hoặc chưa render)
    const allRows = this.tb_projectWorker.getRows();
    allRows.forEach((row: any) => {
      if (row.isSelected()) {
        const rowData = row.getData();
        this.previousSelectedRows.add(rowData.ID);
      }
    });
    // Cũng cần xóa các rows không còn được chọn
    const currentSelectedIds = new Set<number>();
    try {
      const selectedRows = this.tb_projectWorker.getSelectedRows();
      selectedRows.forEach((row: any) => {
        const rowData = row.getData();
        currentSelectedIds.add(rowData.ID);
      });
    } catch (e) {
      // Fallback: dùng allRows
      allRows.forEach((row: any) => {
        if (row.isSelected()) {
          const rowData = row.getData();
          currentSelectedIds.add(rowData.ID);
        }
      });
    }
    // Xóa các rows không còn được chọn khỏi previousSelectedRows
    this.previousSelectedRows.forEach((id: number) => {
      if (!currentSelectedIds.has(id)) {
        this.previousSelectedRows.delete(id);
      }
    });
  }
  
  // Hàm đệ quy để chọn/bỏ chọn tất cả node con
  toggleChildrenSelection(parentRow: any, isSelected: boolean): void {
    try {
      const parentData = parentRow.getData();
      
      // Sử dụng getTreeChildren() của Tabulator để lấy children
      let childRows: any[] = [];
      try {
        // Thử dùng getTreeChildren() - method chính thức của Tabulator
        childRows = parentRow.getTreeChildren();
      } catch (e) {
        // Fallback: nếu không có getTreeChildren(), dùng cách khác
        const parentID = parentData.ID;
        const allRows = this.tb_projectWorker.getRows();
        allRows.forEach((row: any) => {
          const rowData = row.getData();
          if (rowData.ParentID === parentID) {
            childRows.push(row);
          }
        });
      }
      
      if (!childRows || childRows.length === 0) {
        return;
      }
      
      // Xử lý từng child
      childRows.forEach((childRow: any, index: number) => {
        const childData = childRow.getData();
        
        // Kiểm tra xem node con có con không (trước khi chọn/bỏ chọn)
        let hasGrandChildren = false;
        try {
          const grandChildren = childRow.getTreeChildren();
          hasGrandChildren = grandChildren && grandChildren.length > 0;
        } catch (e) {
          hasGrandChildren = childData._children && childData._children.length > 0;
        }
        
        // Chọn hoặc bỏ chọn node con
        if (isSelected) {
          // QUAN TRỌNG: Không chọn lại các node đã được bỏ chọn độc lập
          if (!this.independentlyDeselectedNodes.has(childData.ID)) {
            childRow.select();
            // Thêm child vào previousSelectedRows ngay lập tức để tránh nó được coi là "mới được chọn"
            this.previousSelectedRows.add(childData.ID);
            // Xóa khỏi independentlyDeselectedNodes nếu có (khi được chọn lại bởi parent)
            this.independentlyDeselectedNodes.delete(childData.ID);
            
            // QUAN TRỌNG: Nếu child này cũng là parent (node cha cấp 2+), đệ quy chọn children của nó ngay lập tức
            // Điều này đảm bảo khi node cha cấp 2 được chọn bởi parent, children của nó cũng được chọn
            if (hasGrandChildren) {
              // Đệ quy chọn children của child này
              this.toggleChildrenSelection(childRow, isSelected);
            }
          }
        } else {
          childRow.deselect();
          // Xóa child khỏi previousSelectedRows
          this.previousSelectedRows.delete(childData.ID);
          
          // Nếu bỏ chọn và child này cũng là parent, đệ quy bỏ chọn children của nó
          if (hasGrandChildren) {
            this.toggleChildrenSelection(childRow, isSelected);
          }
        }
      });
    } catch (error) {
      console.error('Error toggling children selection:', error);
    }
  }
  // hàm cập nhật tổng giá con và cha đệ quy - theo logic WinForm CalculatorData
  // Hàm tính toán dữ liệu tree (giống CalculatorData trong WinForm)
  calculateWorkerTree(data: any[]): any[] {
    if (!data || data.length === 0) return [];
    const map = new Map<number, any>();
    const tree: any[] = [];
    // Bước 1: Clone và khởi tạo _children
    data.forEach(item => {
      const node = { ...item, _children: [] };
      map.set(node.ID, node);
    });
    // Bước 2: Xây dựng cây (build tree structure)
    data.forEach(item => {
      const node = map.get(item.ID);
      if (!node) return;
      // Kiểm tra điều kiện parent
      if (item.ParentID && item.ParentID !== 0 && item.ParentID !== null) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          // Parent không tồn tại → thêm vào root
          tree.push(node);
        }
      } else {
        // Không có parent → root node
        tree.push(node);
      }
    });
    // Bước 3: Tính tổng từ dưới lên (post-order traversal - giống WinForm loop từ cuối lên)
    const calculateTotals = (nodes: any[]): void => {
      nodes.forEach(node => {
        // Bỏ qua nếu không có children
        if (!node._children || node._children.length === 0) {
          return;
        }
        // Đệ quy tính con trước (bottom-up)
        calculateTotals(node._children);
        // Khởi tạo biến tổng
        let totalAmount = 0;
        let totalAmountQuote = 0;
        let totalAmountPurchase = 0;
        let totalPriceExchangePurchase = 0;
        let totalPriceExchangeQuote = 0;
        // Tính tổng từ tất cả children (giống foreach trong WinForm)
        node._children.forEach((child: any) => {
          totalAmount += Number(child.Amount) || 0;
          totalAmountQuote += Number(child.TotalPriceQuote1) || 0;
          totalAmountPurchase += Number(child.TotalPricePurchaseExport) || 0;
          totalPriceExchangePurchase += Number(child.TotalPriceExchangePurchase) || 0;
          totalPriceExchangeQuote += Number(child.TotalPriceExchangeQuote) || 0;
        });
        // Gán giá trị vào parent node (giống SetValue trong WinForm)
        // Parent có children → Price = 0
        if (node._children.length > 0) {
          node.Price = 0;
        }
        // Gán tổng vào parent
        node.Amount = totalAmount;
        node.TotalPriceQuote1 = totalAmountQuote;
        node.TotalPricePurchaseExport = totalAmountPurchase;
        node.TotalPriceExchangePurchase = totalPriceExchangePurchase;
        node.TotalPriceExchangeQuote = totalPriceExchangeQuote;
        // Set các flag cho parent (node cha không có các flag này)
        node.IsNewCode = false;
        node.IsApprovedTBPNewCode = false;
        node.IsFix = false; // Tích xanh chỉ dành cho node lá
      });
    };
    // Bắt đầu tính toán từ root
    calculateTotals(tree);
    return tree;
  }
  // Hàm lấy danh sách parent từ tree (chỉ lấy các node cha, có thể làm parent)
  getParentListFromTree(tree: any[]): any[] {
    const parentList: any[] = [];
    const traverse = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        // Thêm node vào danh sách parent (cả node cha và node lá đều có thể làm parent)
        parentList.push({
          ID: node.ID,
          TT: node.TT,
          WorkContent: node.WorkContent,
          _children: node._children || []
        });
        // Duyệt đệ quy các con
        if (node._children && node._children.length > 0) {
          traverse(node._children);
        }
      });
    };
    traverse(tree);
    return parentList;
  }
  // Mở modal thêm/sửa vật tư
  openProjectPartlistDetail(isEdit: boolean): void {
    // Lấy versionID từ bảng đã chọn
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      const selectedData = this.tb_projectPartListVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    } else if (this.type === 2) {
      const selectedData = this.tb_projectPartListVersionPO?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    }
    // if (selectedVersionID <= 0) {
    //   this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp hoặc PO');
    //   return;
    // }
    // Nếu là edit mode, lấy ID từ row đã chọn và gọi API
    if (isEdit) {
      // Thử 3 cách lấy dòng theo thứ tự ưu tiên
      let targetRow: any = null;
      // Cách 1: Lấy từ biến đã lưu (khi click vào cell)
      if (this.lastClickedPartListRow) {
        targetRow = this.lastClickedPartListRow;
        console.log('Lấy từ lastClickedWorkerRow');
      }
      // Cách 2: Lấy dòng đầu tiên trong selected rows (nếu chỉ chọn 1 dòng)
      else {
        const selectedRows = this.tb_projectWorker?.getSelectedRows();
        if (selectedRows && selectedRows.length === 1) {
          targetRow = selectedRows[0];
          console.log('Lấy từ selectedRows (1 dòng)');
        }
      }
      if (!targetRow) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn vật tư cần sửa'
        );
        return;
      }
      const focusedRow = targetRow.getData();
      const partListID = focusedRow.ID || 0;
      // Gọi API để lấy dữ liệu partlist theo ID
      this.projectPartListService.getPartListByID(partListID).subscribe({
        next: (response: any) => {
          if (response && response.data) {
            const partListData = response.data;
            this.openPartListDetailModal(isEdit, selectedVersionID,  focusedRow );
          } else {
            this.notification.error('Thông báo', 'Không tìm thấy dữ liệu vật tư');
          }
        },
        error: (error) => {
          console.error('Lỗi khi lấy dữ liệu partlist:', error);
          this.notification.error('Thông báo', 'Lỗi khi lấy dữ liệu vật tư');
        }
      });
      return; // Return để không tiếp tục mở modal ở dưới
    }
    // Nếu không phải edit mode, mở modal bình thường
    this.openPartListDetailModal(isEdit, selectedVersionID, null);
  }
  // Hàm mở modal detail (tách riêng để tái sử dụng)
  private openPartListDetailModal(isEdit: boolean, selectedVersionID: number, partListData: any): void {
    // Lấy thông tin phiên bản để truyền vào modal
    let versionData: any = null;
    if (this.type === 1) {
      versionData = this.tb_projectPartListVersion?.getSelectedData()?.[0];
    } else if (this.type === 2) {
      versionData = this.tb_projectPartListVersionPO?.getSelectedData()?.[0];
    }
    // Mở modal
    const modalRef = this.ngbModal.open(ProjectPartlistDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    // Set các Input properties
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.projectCodex;
    modalRef.componentInstance.type = this.type;
    modalRef.componentInstance.versionPOID = selectedVersionID;
    modalRef.componentInstance.CodeName = versionData?.Code || this.CodeName;
    modalRef.componentInstance.projectTypeName = this.projectTypeName;
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId || 0;
    // Nếu là edit mode, map dữ liệu từ API vào selectedData
    if (isEdit && partListData) {
      modalRef.componentInstance.selectedData = [{
        ProductID: partListData.ProductID || 0,
        ProductCode: partListData.ProductCode || '',
        ProductName: partListData.GroupMaterial || '',
        GuestCode: partListData.ProductCode || '',
        Maker: partListData.Manufacturer || '',
        Qty: partListData.QtyFull || 0,
        Unit: partListData.Unit || '',
        TT: partListData.TT || '',
        ProjectPartListID: partListData.ID || 0,
        ID: partListData.ID || 0,
        STT: partListData.STT || 0,
        ParentID: partListData.ParentID || 0,
        Note: partListData.Note || '',
        EmployeeID: partListData.EmployeeID || 0,
        // Thêm các field khác từ partListData
        SpecialCode: partListData.SpecialCode || '',
        IsDeleted: partListData.IsDeleted || false,
        Model: partListData.Model || '',
        QtyMin: partListData.QtyMin || 0,
        EmployeeIDRequestPrice: partListData.EmployeeIDRequestPrice || null,
        IsProblem: partListData.IsProblem || false,
        ReasonProblem: partListData.ReasonProblem || '',
        // Thông tin báo giá
        SupplierSaleID: partListData.SupplierSaleID || null,
        NCC: partListData.NCC || '',
        Price: partListData.Price || 0,
        Amount: partListData.Amount || 0,
        UnitMoney: partListData.UnitMoney || '',
        LeadTime: partListData.LeadTime || "",
        // Thông tin đặt mua
        OrderCode: partListData.OrderCode || '',
        NCCFinal: partListData.NCCFinal || '',
        PriceOrder: partListData.PriceOrder || 0,
        TotalPriceOrder: partListData.TotalPriceOrder || 0,
        CurrencyExchange: partListData.CurrencyExchange || '',
        ExpectedDate: partListData.ExpectedDate || null,
        ActualDate: partListData.ActualDate || null, // ngày hàng về
        ExpectedReturnDate: partListData.ExpectedReturnDate || null, // dự kiến hàng về
        RequestDate: partListData.RequestDate || null, // ngày yêu cầu đặt hàng // ngày nhận hàng
        Status: partListData.Status || 0, // trạng thái đặt hàng
        Quality: partListData.Quality || '', // chất lượng
        ///check quyền sửa
        IsApprovedTBP: partListData.IsApprovedTBP || false,
        IsApprovedTBPNewCode: partListData.IsApprovedTBPNewCode || false,
        // Trạng thái yêu cầu/giá (chuẩn hóa boolean/number)
        IsCheckPrice:
          partListData.IsCheckPrice === true ||
          partListData.IsCheckPrice === 1 ||
          partListData.IsCheckPrice === '1',
        StatusRequest: partListData.StatusRequest ?? null,
        StatusPriceRequest: partListData.StatusPriceRequest ?? null,
        // Trạng thái duyệt khác nếu có
        IsApprovedPurchase: partListData.IsApprovedPurchase ?? null,
        IsRequestPurchase: partListData.IsRequestPurchase ?? null,
        IsApprovedWarehouseExport: partListData.IsApprovedWarehouseExport ?? null,
      }];
    } else {
      // Add mode: selectedData rỗng hoặc không có
      modalRef.componentInstance.selectedData = [];
    }
    // Xử lý kết quả từ modal
    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          this.loadDataProjectPartList();
        }
      })
      .catch((error: any) => {
        // Modal bị đóng (ESC, click outside, etc.)
        console.log('Modal dismissed:', error);
      });
  }
  //#region Xóa partlist
  deleteProjectPartList(): void {
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần xóa');
      return;
    }
    // Validate từng vật tư được chọn
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã được yêu cầu mua hàng chưa
      if (row.IsApprovedPurchase == true) {
        const tt = row.TT
        this.notification.warning('Thông báo', `Vật tư TT ${tt} đã được yêu cầu mua hàng. Vui lòng hủy yêu cầu mua trước`);
        return;
      }
      // Kiểm tra vật tư đã được TBP duyệt chưa
      if (row.IsApprovedTBP == true) {
        const tt = row.TT
        this.notification.warning('Thông báo', `Vật tư TT ${tt} đã được TBP duyệt. Vui lòng hủy duyệt trước`);
        return;
      }
    }
    // Tạo danh sách TT để hiển thị trong thông báo
    const ttList = selectedRows.map((row: any) => row.TT || row.STT).join(', ');
    const itemCount = selectedRows.length;
    const message = itemCount === 1
      ? `Bạn có chắc chắn muốn xóa vật tư TT[${ttList}] không?`
      : `Bạn có chắc chắn muốn xóa ${itemCount} vật tư (TT: ${ttList}) không?`;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        // Reset lý do xóa và mở modal nhập lý do
        this.reasonDeleted = '';
        this.showDeletePartListModal(selectedRows);
      }
    });
  }
  // Hiển thị modal nhập lý do xóa
  showDeletePartListModal(selectedRows: any[]): void {
    const ttList = selectedRows.map((item: any) => item.TT || item.STT).join(', ');
    const itemCount = selectedRows.length;
    this.modal.confirm({
      nzTitle: 'Xóa vật tư',
      nzContent: this.deletePartListModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmDelete(selectedRows);
      },
      nzOnCancel: () => {
        this.reasonDeleted = '';
      }
    });
    // Sau khi modal mở, cập nhật nội dung động
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  // Validate và xác nhận xóa
  validateAndConfirmDelete(selectedRows: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Validate lý do xóa
      if (!this.reasonDeleted || this.reasonDeleted.trim() === '') {
        this.notification.warning('Thông báo', 'Vui lòng nhập lý do xóa!');
        resolve(false); // Không đóng modal
        return;
      }
      // Gán lý do xóa vào từng item và gọi API
      this.confirmDeletePartList(selectedRows);
      resolve(true); // Đóng modal
    });
  }
  // Hàm xác nhận và gọi API xóa
  confirmDeletePartList(selectedRows: any[]): void {
    // Tạo payload với lý do xóa cho mỗi item
    const payload = selectedRows.map((row: any) => ({
      ID: row.ID || 0,
      TT: row.TT || '',
      IsDeleted: true,
      ReasonDeleted: this.reasonDeleted.trim()
    }));
    this.projectPartListService.deletePartList(payload).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Xóa vật tư thành công!');
          this.loadDataProjectPartList();
          this.reasonDeleted = '';
        } else if (response.status === 2) {
          // Validation error từ backend
          this.notification.warning('Thông báo', response.message || 'Không thể xóa vật tư');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể xóa vật tư');
        }
      },
      error: (error: any) => {
        console.error('=== API ERROR ===');
        console.error('Error deleting partlist:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
        const errorMessage = error?.error?.message || error?.message || 'Không thể xóa vật tư';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  deleteProjectWorkerConfirm(selectedRows: any[]): void {
    // Tạo payload chỉ gồm ID và IsDeleted = true
    const payload = selectedRows.map((row: any) => ({
      ID: row.ID,
      IsDeleted: true
    }));
    console.log('Delete payload:', JSON.stringify(payload, null, 2));
    // Gọi API để xóa (API nhận List<ProjectWorker>, chỉ cần ID và IsDeleted)
    this.projectWorkerService.saveWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Xóa nhân công thành công!');
          this.loadDataProjectPartList(); // Reload lại dữ liệu
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể xóa nhân công');
        }
      },
      error: (error: any) => {
        console.error('Error deleting worker:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể xóa nhân công';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#region Duyệt/Hủy duyệt PO
  ApprovePO(isApproveAction: boolean): void {
    // Lấy dữ liệu từ bảng solution đã chọn
    const selectedRows = this.tb_solution?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn giải pháp cần duyệt/hủy duyệt PO!');
      return;
    }
    const selectedData = selectedRows[0];
    const solutionId = selectedData.ID;
    if (!solutionId || solutionId <= 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy giải pháp!');
      return;
    }
    // Validate: Nếu duyệt PO nhưng giải pháp không có PO
    if (isApproveAction && selectedData.StatusSolution !== 1) {
      this.notification.warning('Thông báo', 'Bạn không thể duyệt PO cho giải pháp không có PO!');
      return;
    }
    // Validate: Kiểm tra trạng thái hiện tại
    if (isApproveAction && selectedData.IsApprovedPO === true) {
      this.notification.warning('Thông báo', 'Giải pháp này đã được duyệt PO trước đó.');
      return;
    }
    if (!isApproveAction && selectedData.IsApprovedPO === false) {
      this.notification.warning('Thông báo', 'Giải pháp này chưa được duyệt PO để hủy.');
      return;
    }
    const actionText = isApproveAction ? 'duyệt' : 'hủy duyệt';
    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} PO cho giải pháp "${selectedData.CodeSolution || 'này'}" không?`;
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmMessage,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        const payload = {
          ID: solutionId,
          ApproveStatus: 2, // 2: PO (1: Báo giá)
          IsApproveAction: isApproveAction, // true: Duyệt, false: Hủy duyệt
        };
        this.projectWorkerService.saveSolution(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} PO thành công!`);
              // Reload danh sách giải pháp
              this.loadDataSolution();
            } else {
              this.notification.error('Lỗi', response.message || `Không thể ${actionText} PO!`);
            }
          },
          error: (error: any) => {
            console.error('Error approving PO:', error);
            const errorMessage = error?.error?.message || error?.message || `Không thể ${actionText} PO!`;
            this.notification.error('Lỗi', errorMessage);
          },
        });
      },
    });
  }
  //#endregion
  //#region Bổ sung PO
  SelectProroduct(): void {
    // Lấy tất cả các row đã chọn từ bảng (bao gồm cả children nếu parent được chọn)
    const selectedRows = this.tb_projectWorker?.getSelectedRows() || [];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần bổ sung PO!');
      return;
    }
    // Lấy dữ liệu từ tất cả các row đã chọn (getSelectedRows đã bao gồm children nếu parent được chọn)
    const allSelectedNodes: any[] = selectedRows
      .filter((row: any) => row.isSelected())
      .map((row: any) => row.getData());
    if (allSelectedNodes.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư nào được chọn!');
      return;
    }
    // Lấy tất cả dữ liệu từ dtAddDetail (nếu có) hoặc từ bảng để tính max STT
    const allTableData = this.tb_projectWorker?.getData() || [];
    // Tính max STT từ dtAddDetail hoặc từ tất cả dữ liệu (bao gồm cả nested children)
    let maxSTT = 0;
    if (this.dtAddDetail && Array.isArray(this.dtAddDetail)) {
      // Nếu có dtAddDetail, tính max STT từ đó
      this.dtAddDetail.forEach((row: any) => {
        const stt = Number(row.STT || 0);
        if (stt > maxSTT) {
          maxSTT = stt;
        }
      });
    } else {
      // Nếu không có dtAddDetail, tính từ bảng
      const getAllRowsRecursive = (data: any[]): any[] => {
        let result: any[] = [];
        data.forEach((item: any) => {
          if (item.STT && Number(item.STT) > maxSTT) {
            maxSTT = Number(item.STT);
          }
          result.push(item);
          if (item._children && Array.isArray(item._children) && item._children.length > 0) {
            result = result.concat(getAllRowsRecursive(item._children));
          }
        });
        return result;
      };
      getAllRowsRecursive(allTableData);
    }
    // Tính minLevel từ các node đã chọn
    const getNodeLevel = (tt: string): number => {
      if (!tt) return 0;
      return (tt.match(/\./g) || []).length;
    };
    const minLevel = Math.min(...allSelectedNodes.map((node: any) => getNodeLevel(node.TT || '')));
    // Biến đếm STT cho mỗi level (khởi tạo mảng 10 phần tử với giá trị 0)
    const nodeLevelSTT: number[] = new Array(10).fill(0);
    // Sử dụng nodeMinLevelCount từ Input, nếu không có thì dùng maxSTT
    let nodeMinLevelCount = this.nodeMinLevelCount || maxSTT;
    // Xử lý từng node đã chọn
    const processedData: any[] = [];
    const listIDInsert: number[] = [];
    allSelectedNodes.forEach((node: any) => {
      const nodeLevel = getNodeLevel(node.TT || '');
      // Tạo object dữ liệu mới
      const newRow: any = {
        ProductID: node.ProductID || 0,
        ProductCode: node.ProductCode || '',
        ProductName: node.GroupMaterial || '',
        GuestCode: node.ProductCode || '',
        Maker: node.Manufacturer || '',
        Qty: node.QtyFull || 0,
        Unit: node.Unit || '',
        TT: node.TT || '',
        ProjectPartListID: node.ID || 0,
        ID:node.ID || 0,
      };
      // Tính STT dựa trên level (giống logic C# chính xác)
      if (nodeLevel === minLevel) {
        // Với node có level = minLevel: STT = nodeMinLevelCount + 1, sau đó tăng nodeMinLevelCount
        newRow.STT = nodeMinLevelCount + 1;
        nodeMinLevelCount++;
      } else {
        // Với node khác: sử dụng nodeLevelSTT để đếm theo level
        if (nodeLevelSTT[nodeLevel] === 0) {
          newRow.STT = 1;
          nodeLevelSTT[nodeLevel] = 1;
        } else {
          nodeLevelSTT[nodeLevel]++;
          newRow.STT = nodeLevelSTT[nodeLevel];
        }
      }
      // Xử lý ParentID (giống logic C# chính xác)
      const childTT = (node.TT || '').toString();
      const indexLast = childTT.lastIndexOf('.');
      if (indexLast >= 0) {
        // Có dấu chấm trong TT, extract parentTT
        const parentTT = childTT.substring(0, indexLast);
        // Kiểm tra nếu childTT === parentTT (trường hợp đặc biệt)
        if (childTT === parentTT) {
          newRow.ParentID = 0;
        } else {
          // Sử dụng ParentID từ node nếu có, ngược lại tìm parent
          if (node.ParentID !== undefined && node.ParentID !== null && node.ParentID !== 0) {
            newRow.ParentID = node.ParentID;
          } else {
            // Tìm parent trong danh sách đã chọn trước (đã được processed)
            const parentNode = processedData.find((n: any) => n.TT === parentTT);
            if (parentNode) {
              newRow.ParentID = parentNode.ID || 0;
            } else {
              // Tìm parent trong danh sách allSelectedNodes (chưa processed)
              const parentInSelected = allSelectedNodes.find((n: any) => n.TT === parentTT);
              if (parentInSelected) {
                newRow.ParentID = parentInSelected.ID || 0;
              } else {
                // Tìm parent trong tất cả dữ liệu bảng
                const findParentInData = (data: any[], parentTTToFind: string): any => {
                  for (const item of data) {
                    if (item.TT === parentTTToFind) {
                      return item;
                    }
                    if (item._children && item._children.length > 0) {
                      const found = findParentInData(item._children, parentTTToFind);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const parentInTable = findParentInData(allTableData, parentTT);
                newRow.ParentID = parentInTable ? (parentInTable.ID || 0) : 0;
              }
            }
          }
        }
      } else {
        // Không có dấu chấm trong TT, là root node
        newRow.ParentID = 0;
      }
      // Thêm ID vào danh sách insert
      if (newRow.ID > 0) {
        listIDInsert.push(newRow.ID);
      }
      processedData.push(newRow);
    });
    // Gộp dữ liệu cũ và dữ liệu mới đã xử lý
    const mergedData = [
      ...this.dtAddDetail, // dữ liệu cũ
      ...processedData     // dữ liệu mới
    ];
    // Lưu dữ liệu để trả về khi đóng modal
    this.selectProductPOData = {
      listIDInsert: listIDInsert,
      processedData: mergedData
    };
    // Truyền dữ liệu về component cha (nếu có callback)
    if (this.onSelectProductPOCallback) {
      this.onSelectProductPOCallback(this.selectProductPOData);
    }
    console.log("Dữ liệu trả về POKHDetail: ", this.selectProductPOData);
    // Đóng modal và trả dữ liệu về POKHDetail
    if (this.activeModal) {
      this.activeModal.close({
        success: true,
        dtAddDetail: mergedData,
        listIDInsert: listIDInsert,
        isPartlist: true
      });
    }
  }
  //#endregion
  //#region mở modal xem lịch sử giá và tồn kho
  openProjectPartListHistory(productCode?: string): void {
    // Sử dụng logic lastClickedPartListRow để lấy đúng productCode
    let finalProductCode = '';
    if (this.lastClickedPartListRow) {
      const rowData = this.lastClickedPartListRow.getData();
      finalProductCode = rowData.ProductCode || '';
    } else if (productCode) {
      // Fallback: nếu không có lastClickedPartListRow thì dùng tham số
      finalProductCode = productCode;
    }
    if (!finalProductCode || finalProductCode.trim() === '') {
      this.notification.warning('Thông báo', 'Không tìm thấy mã sản phẩm!');
      return;
    }
    const modalRef = this.ngbModal.open(ProjectPartListHistoryComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      keyboard: false,
    });
    // Truyền productCode vào modal
    modalRef.componentInstance.productCode = finalProductCode;
    modalRef.result.then(
      (result: any) => {
        // Xử lý kết quả nếu cần
      },
      (reason: any) => {
        // Modal bị đóng
        console.log('Modal dismissed:', reason);
      }
    );
  }
  //#endregion
  //#region đã mua
  techBought(): void {
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư mua!');
      return;
    }
    const selectedRow = selectedRows[0];
    if (selectedRow.BillCodePurchase.length > 0) {
      this.notification.warning('Thông báo', `Mã sản phẩm ${selectedRow.ProductCode} đã được có đơn mua ${selectedRow.BillCodePurchase}, bạn không thể mua!`);
      return;
    }
    const modalRef = this.ngbModal.open(ProjectPartlistPurchaseRequestDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    const projectPartlistDetail: any = {
      ID: 0,
      IsTechBought: false,
      ProjectPartListID: selectedRow.ID,
      ProductSaleID: selectedRow.ProductSaleID || 0,
      ProductCode: selectedRow.ProductCode || '',
      ProductName: selectedRow.GroupMaterial || '',
      UnitName: selectedRow.Unit || '',
      Manufacturer: selectedRow.Maker || '',
      Quantity: selectedRow.QtyFull || 0,
      EmployeeID: selectedRow.EmployeeID || 0
    };
    modalRef.componentInstance.projectPartlistDetail = projectPartlistDetail;
    modalRef.result.finally(() => {
      this.loadDataProjectPartList();
    });
  }
  //#endregion
  //#region hủy đã mua
  unTechBought(): void {
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư mua!');
      return;
    }
    const selectedRow = selectedRows[0];
    if (selectedRow.BillCodePurchase.length > 0) {
      this.notification.warning('Thông báo', `Mã sản phẩm ${selectedRow.ProductCode} đã được có đơn mua ${selectedRow.BillCodePurchase}, bạn không thể hủy!`);
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy đã mua',
      nzContent: `Bạn có chắc muốn hủy đã mua mã sản phẩm ${selectedRow.ProductCode} không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectPartListService.cancelTechBought(selectedRow.ID).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Hủy đã mua thành công!');
              this.loadDataProjectPartList();
            }
          }
        });
      }
    });
  }
  // Helper function để flatten tree rows
  private flattenAllRows(rows: any[]): any[] {
    const result: any[] = [];
    rows.forEach((row: any) => {
      result.push(row);
      const treeChildren = row.getTreeChildren();
      if (treeChildren && treeChildren.length > 0) {
        result.push(...this.flattenAllRows(treeChildren));
      }
    });
    return result;
  }
  // Lấy giá lịch sử
  getPriceHistory(): void {
    if (!this.tb_projectWorker) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }
    // Lấy danh sách vật tư đã chọn (tương tự requestPriceQuote)
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư!');
      return;
    }
    // Lấy tất cả rows có ID > 0 và có UnitPriceHistory (cả cha và con, backend sẽ xử lý)
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        continue;
      }
      // Kiểm tra có UnitPriceHistory
      if (row.UnitPriceHistory == null || row.UnitPriceHistory === '') {
        continue;
      }
      // Xác định IsLeaf (tương tự requestPriceQuote)
      const isLeaf = !row._children || row._children.length === 0;
      // Thêm vào danh sách
      requestItems.push({
        ID: row.ID,
        IsLeaf: isLeaf,
        UnitPriceHistory: row.UnitPriceHistory || 0,
        QtyFull: row.QtyFull || 0
      });
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn hoặc các dòng được chọn không có giá lịch sử!');
      return;
    }
    // Hiển thị modal xác nhận (tương tự requestPriceQuote)
    this.modal.confirm({
      nzTitle: 'Xác nhận lấy giá lịch sử',
      nzContent: `Bạn có chắc muốn lấy giá lịch sử cho ${requestItems.length} vật tư không? Hành động này sẽ cập nhật giá và thành tiền của các vật tư.`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isLoading = true;
        this.projectPartListService.getPriceHistory(requestItems).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Lấy giá lịch sử thành công!');
              // Reload dữ liệu sau khi thành công
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi lấy giá lịch sử!');
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lấy giá lịch sử!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }
  //#endregion
  //#region Khôi phục dòng đã xóa
  restoreDelete(): void {
    if (!this.tb_projectWorker) {
      this.notification.warning('Thông báo', 'Bảng dữ liệu chưa được khởi tạo!');
      return;
    }
    // Lấy danh sách vật tư đã chọn (tương tự requestPriceQuote)
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn!');
      return;
    }
    // Lấy tất cả rows đã bị xóa (IsDeleted = true) và có ID > 0
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        continue;
      }
      // Xác định IsLeaf (tương tự requestPriceQuote)
      const isLeaf = !row._children || row._children.length === 0;
      // Thêm vào danh sách
      requestItems.push({
        ID: row.ID,
        IsLeaf: isLeaf
      });
    }
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào được chọn!');
      return;
    }
    // Hiển thị modal xác nhận
    const itemCount = requestItems.length;
    const sttList = selectedRows
      .filter((row: any) => row.IsDeleted === true && row.ID > 0)
      .map((row: any) => row.TT || row.STT)
      .join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận khôi phục',
      nzContent: `Bạn có chắc chắn muốn khôi phục ${itemCount} dòng đã xóa (Stt: ${sttList})?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isLoading = true;
        this.projectPartListService.restoreDelete(requestItems).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            if (response.status === 1) {
              this.notification.success('Thành công', response.message || 'Khôi phục thành công!');
              // Reload dữ liệu sau khi thành công
              this.loadDataProjectPartList();
            } else {
              this.notification.error('Lỗi', response.message || 'Có lỗi xảy ra khi khôi phục!');
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi khôi phục!';
            this.notification.error('Lỗi', errorMessage);
          }
        });
      }
    });
  }
  //#endregion
  //#region Bổ sung PartList vào PO
  additionalPartListPO(): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần bổ sung vào PO');
      return;
    }
    // Kiểm tra phiên bản đang sử dụng (phải là phiên bản giải pháp - type === 1)
    if (this.type !== 1) {
      this.notification.warning('Thông báo', 'Chức năng này chỉ áp dụng cho phiên bản giải pháp (GP)');
      return;
    }
    let selectedVersion: any = null;
    const versionRows = this.tb_projectPartListVersion?.getSelectedData();
    if (!versionRows || versionRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp để bổ sung vào PO');
      return;
    }
    selectedVersion = versionRows[0];
    if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
      this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
      return;
    }
    // Validate từng vật tư được chọn
    const requestItems: any[] = [];
    for (let row of selectedRows) {
      // Kiểm tra ID hợp lệ
      if (!row.ID || row.ID <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn vật tư hợp lệ!');
        return;
      }
      // Kiểm tra vật tư đã bị xóa
      if (row.IsDeleted == true) {
        this.notification.warning('Thông báo', `Không thể bổ sung vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return;
      }
      // Xác định IsLeaf (node lá = không có children)
      const isLeaf = !row._children || row._children.length === 0;
      // Thêm vào danh sách yêu cầu (chỉ gửi các trường cần thiết)
      requestItems.push({
        ID: row.ID || 0,
        TT: row.TT || '',
        IsLeaf: isLeaf
      });
    }
    // Kiểm tra có item nào để bổ sung không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để bổ sung vào PO');
      return;
    }
    // Reset lý do phát sinh và checkbox, mở modal nhập lý do
    this.reasonProblem = '';
    this.isGeneratedItem = false;
    this.showAdditionalPartListPOModal(requestItems, selectedVersion);
  }
  // Hiển thị modal nhập lý do phát sinh
  showAdditionalPartListPOModal(requestItems: any[], selectedVersion: any): void {
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.TT).filter((tt: string) => tt).join(', ');
    this.modal.confirm({
      nzTitle: 'Bổ sung vật tư vào PO',
      nzContent: this.additionalPartListPOModalContent,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzWidth: 500,
      nzOnOk: () => {
        return this.validateAndConfirmAdditionalPartListPO(requestItems, selectedVersion);
      },
      nzOnCancel: () => {
        this.reasonProblem = '';
        this.isGeneratedItem = false;
      }
    });
    // Sau khi modal mở, cập nhật nội dung động
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  // Xử lý sự kiện thay đổi checkbox hàng phát sinh
  onIsGeneratedItemChange(): void {
    if (!this.isGeneratedItem) {
      // Nếu bỏ chọn checkbox, reset lý do phát sinh
      this.reasonProblem = '';
    }
  }
  // Validate và xác nhận bổ sung PO
  validateAndConfirmAdditionalPartListPO(requestItems: any[], selectedVersion: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Validate lý do phát sinh chỉ khi checkbox được chọn
      if (this.isGeneratedItem) {
        if (!this.reasonProblem || this.reasonProblem.trim() === '') {
          this.notification.warning('Thông báo', 'Vui lòng nhập lý do phát sinh!');
          resolve(false); // Không đóng modal
          return;
        }
      }
      // Gọi API bổ sung PO
      this.confirmAdditionalPartListPO(requestItems, selectedVersion);
      resolve(true); // Đóng modal
    });
  }
  // Hàm xác nhận và gọi API bổ sung PO
  confirmAdditionalPartListPO(requestItems: any[], selectedVersion: any): void {
    // Chuẩn bị payload theo AdditionPartlistPoDTO
    const payload = {
      ListItem: requestItems,
      VersionID: selectedVersion.ID || 0,
      ProjectTypeID: selectedVersion.ProjectTypeID || 0,
      ProjectTypeName: selectedVersion.ProjectTypeName || '',
      ProjectSolutionID: this.projectSolutionId || 0,
      projectID: this.projectId || 0,
      ReasonProblem: this.reasonProblem.trim()
    };
    console.log('=== SENDING ADDITIONAL PARTLIST PO TO API ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    this.startLoading();
    this.projectPartListService.additionalPartListPO(payload).subscribe({
      next: (response: any) => {
        this.stopLoading();
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Bổ sung vật tư vào PO thành công!');
          this.loadDataProjectPartList();
          this.loadDataProjectPartListVersionPO(); // Reload phiên bản PO
          this.reasonProblem = '';
          this.isGeneratedItem = false;
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể bổ sung vật tư vào PO');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể bổ sung vật tư vào PO');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể bổ sung vật tư vào PO';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  //#endregion
  //#region đóng/mở panel bên trái
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%'; // Mở rộng panel vật tư lên 100%
  }
  closeModal(): void {
    if (!this.activeModal) {
      return;
    }
    // Nếu có dữ liệu từ SelectProroduct, trả về khi đóng modal
    if (this.selectProductPOData) {
      this.activeModal.close({
        success: true,
        selectProductPOData: this.selectProductPOData
      });
    } else {
      // Nếu không có dữ liệu, dismiss modal
      this.activeModal.dismiss();
    }
  }
  toggleLeftPanel(): void {
    if (this.sizeLeftPanel === '0') {
      this.sizeLeftPanel = ''; // Rỗng = dùng nzDefaultSize
      this.sizeRightPanel = ''; // Rỗng = auto
    } else {
      this.sizeLeftPanel = '0';
      this.sizeRightPanel = '100%';
    }
  }
  //#endregion
  //#region Yêu cầu xuất kho
  requestExport(warehouseCode?: string): void {
    // Lấy danh sách vật tư đã chọn
    const selectedRows = this.tb_projectWorker?.getSelectedData() || [];
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn sản phẩm muốn yêu cầu xuất kho!');
      return;
    }
    // Lọc chỉ lấy node lá (không có children) - bỏ comment để validate
    const leafNodes = selectedRows.filter((row: any) => {
      const hasChildren = row._children && Array.isArray(row._children) && row._children.length > 0;
      return !hasChildren;
    });
    if (leafNodes.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn các sản phẩm  để yêu cầu xuất kho!');
      return;
    }
    // Nếu đã có warehouseCode, xử lý trực tiếp
    if (warehouseCode) {
      this.confirmRequestExport(leafNodes, warehouseCode);
      return;
    }
    // Nếu chưa có warehouseCode, mở modal chọn kho
    if (!this.warehouses || this.warehouses.length === 0) {
      this.notification.error('Lỗi', 'Không có kho nào để chọn!');
      return;
    }
  }
  // Yêu cầu xuất kho theo kho cụ thể
  requestExportByWarehouse(warehouseCode: string): void {
    this.requestExport(warehouseCode);
  }
  // Xác nhận và gọi API yêu cầu xuất kho
  confirmRequestExport(selectedNodes: any[], warehouseCode: string): void {
    const itemCount = selectedNodes.length;
    const ttList = selectedNodes.map((node: any) => node.TT || node.STT).join(', ');
    this.modal.confirm({
      nzTitle: 'Xác nhận yêu cầu xuất kho',
      nzContent: `Bạn có chắc muốn yêu cầu xuất kho ${itemCount} sản phẩm (TT: ${ttList}) không?`,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.executeRequestExport(selectedNodes, warehouseCode);
      }
    });
  }
  // Thực hiện yêu cầu xuất kho
  executeRequestExport(selectedNodes: any[], warehouseCode: string): void {
    // Chuẩn bị payload theo ProjectPartListExportDTO structure mới
    // Chỉ gửi các field cần thiết theo DTO (không extends ProjectPartList nữa)
    const listItem = selectedNodes.map((node: any) => {
      const item: any = {
        // Các field từ TreeListNode (UI) - BẮT BUỘC theo DTO mới
        ID: node.ID || 0,
        RemainQuantity: node.RemainQuantity || 0, // Số lượng còn lại có thể xuất
        QuantityReturn: node.QuantityReturn || 0, // Số lượng trả (MỚI THÊM - quan trọng!)
        QtyFull: node.QtyFull || 0, // Số lượng đầy đủ
        ProductNewCode: node.ProductNewCode || '', // Mã nội bộ
        GroupMaterial: node.GroupMaterial || '', // Tên sản phẩm
        Unit: node.Unit || '', // Đơn vị tính
        ProjectCode: node.ProjectCode || this.projectCodex || '', // Mã dự án
        ProjectID: node.ProjectID || 0,
        // Các field khác nếu cần cho ValidateKeep
        ProductID: node.ProductID || 0,
        TT: node.TT || '',
        WarehouseID: 0 // Backend sẽ xử lý từ warehouseCode, có thể để 0 hoặc không cần gửi
      };
      return item;
    });
    const request = {
      WarehouseCode: warehouseCode,
      ListItem: listItem
    };
    this.projectPartListService.requestExport(request).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          const billsData = response.data.Bills || [];
          const warningMessage = response.data.Warning || '';
          // Hiển thị cảnh báo nếu có
          if (warningMessage) {
            this.notification.warning('Thông báo', warningMessage);
          }
          // Kiểm tra có bills để mở modal không
          if (billsData.length === 0) {
            this.notification.warning('Thông báo', 'Không có dữ liệu để xuất kho!');
            return;
          }
          // Mở modal BillExportDetail tuần tự cho từng bill
          this.openBillExportDetailModals(billsData, 0);
          // Reload data sau khi hoàn thành (sẽ được gọi trong openBillExportDetailModals)
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu xuất kho!');
        }
      },
      error: (error: any) => {
        console.error('Error requesting export:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể yêu cầu xuất kho';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }
  // Mở modal BillExportDetail tuần tự cho từng bill
  private openBillExportDetailModals(billsData: any[], index: number): void {
    if (index >= billsData.length) {
      // Đã mở hết tất cả modal → reload data
      this.loadDataProjectPartList();
      return;
    }
    const billData = billsData[index];
    const bill = billData.Bill || {};
    const details = billData.Details || [];
    const billExportForModal = {
      TypeBill: false,
      Code: bill.Code || '',
      Address: bill.Address || '',
      CustomerID: bill.CustomerID || 0,
      UserID: bill.UserID || 0,              // Sẽ được auto-fill trong BillExportDetail nếu = 0
      SenderID: bill.SenderID || 0,          // Sẽ được auto-fill dựa vào KhoTypeID
      WarehouseType: bill.WarehouseType || '',
      GroupID: bill.GroupID || '',
      KhoTypeID: bill.KhoTypeID || 0,
      ProductType: bill.ProductType || 0,
      AddressStockID: bill.AddressStockID || 0,
      WarehouseID: bill.WarehouseID || 0,
      Status: bill.Status || 6,              // 6 = Yêu cầu xuất kho
      SupplierID: bill.SupplierID || 0,
      CreatDate: bill.CreatDate || bill.RequestDate || new Date(),
      RequestDate: bill.RequestDate || new Date(),
    };
    // Map details cho modal theo BillExportDetailRQPDTO structure
    const detailsForModal = details.map((detail: any) => ({
      ID: 0, // Detail mới, chưa có ID
      STT: detail.STT || 0,
      ChildID: detail.ChildID || 0,
      ParentID: detail.ParentID || 0,
      // Thông tin sản phẩm
      ProductID: detail.ProductID || 0,
      ProductCode: detail.ProductCode || '',
      ProductNewCode: detail.ProductNewCode || '',
      ProductName: detail.ProductName || '', // Từ ProductName
      ProductFullName: detail.ProductFullName || '', // Từ ProductFullName
      Unit: detail.Unit || '',
      // Số lượng - Qty đã được tính toán trong backend (qtyToExport)
      Qty: detail.Qty || 0, // Số lượng xuất (đã tính toán từ backend)
      TotalQty: detail.TotalQty || 0, // Tổng số lượng
      QuantityRemain: detail.Qty || 0, // Số lượng còn lại = số lượng yêu cầu (để hiển thị)
      // Thông tin dự án
      ProjectID: detail.ProjectID || 0,
      ProjectName: detail.ProjectName || '',
      ProjectCodeText: detail.ProjectCodeText || '',
      ProjectCodeExport: detail.ProjectCodeExport || '',
      // Thông tin khác
      ProjectPartListID: detail.ProjectPartListID || 0,
      Note: detail.Note || '',
      SerialNumber: detail.SerialNumber || '',
      // Các field để hiển thị trong modal (nếu cần)
      ProjectNameText: detail.ProjectName || '',
      TotalInventory: detail.TotalQty || 0
    }));
    const modalRef = this.ngbModal.open(BillExportDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    console.log('billExportForModal:', billExportForModal);
    console.log('isPOKH:', bill.IsPOKH);
    console.log('wareHouseCode:', bill.wareHouseCode);
    // Truyền dữ liệu vào modal
    modalRef.componentInstance.newBillExport = billExportForModal;
    modalRef.componentInstance.isCheckmode = false; // Tạo mới
    modalRef.componentInstance.id = 0;
    modalRef.componentInstance.isAddExport = true;
    modalRef.componentInstance.wareHouseCode = bill.WarehouseCode || '';
    modalRef.componentInstance.isPOKH = bill.IsPOKH || false;
    modalRef.componentInstance.isFromProjectPartList = true; // FLAG RIÊNG cho luồng ProjectPartList
    // Set detail data sau khi modal mở
    setTimeout(() => {
      modalRef.componentInstance.dataTableBillExportDetail = detailsForModal;
      if (modalRef.componentInstance.table_billExportDetail) {
        modalRef.componentInstance.table_billExportDetail.replaceData(detailsForModal);
      }
    }, 200);
    // Xử lý khi modal đóng
    modalRef.result.then(
      (result) => {
        // Modal đóng thành công → mở modal tiếp theo
        if (result === true && index < billsData.length - 1) {
          this.openBillExportDetailModals(billsData, index + 1);
        } else if (result === true && index === billsData.length - 1) {
          // Modal cuối cùng đóng → reload data và gọi API thông báo
          const text = "Mã phiếu xuất: " + bill.Code + "\nNgười yêu cầu: " + (this.currentUser?.FullName || '');
          const employeeID = this.currentUser?.ID || this.currentUser?.EmployeeID || 0;
          const departmentID = 0;
          // Gọi API thông báo
          this.projectPartListService.addNotify(text, employeeID, departmentID).subscribe({
            next: (response: any) => {
              if (response.status === 1) {
                console.log('Thông báo đã được gửi thành công:', response);
              } else {
                console.warn('Có lỗi khi gửi thông báo:', response.message);
              }
            },
            error: (error: any) => {
              console.error('Lỗi khi gọi API thông báo:', error);
              // Không hiển thị notification để không làm gián đoạn flow chính
            }
          });
          this.loadDataProjectPartList();
        }
      },
      (dismissed) => {
        // Modal bị dismiss → vẫn tiếp tục mở modal tiếp theo nếu có
        if (index < billsData.length - 1) {
          this.openBillExportDetailModals(billsData, index + 1);
        } else {
          // Modal cuối cùng bị dismiss → reload data
          this.loadDataProjectPartList();
        }
      }
    );
  }
  //#endregion
  //#region: Helper để tính tổng theo node cha
  /**
   * Tạo bottomCalc function để tính tổng chỉ cho các node cha (không có parent)
   * @param fieldName - Tên field cần tính tổng
   * @returns Function để tính tổng cho bottomCalc
   */
  private createBottomCalcByParent(fieldName: string) {
    return (values: any[], data: any[]) => {
      // Tính tổng chỉ cho các node cha (không có parent)
      let total = 0;
      const parentNodes = data.filter((row: any) => {
        return !row.ParentID || row.ParentID === 0;
      });
      parentNodes.forEach((row: any) => {
        const value = row[fieldName];
        if (value != null && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            total += numValue;
          }
        }
      });
      return total;
    };
  }
  /**
   * Format số tiền với dấu phân cách hàng nghìn và phần thập phân
   * Định dạng: 1.000.000,00 (dấu chấm cho hàng nghìn, dấu phẩy cho phần thập phân)
   * @param value - Giá trị số cần format
   * @param decimals - Số chữ số thập phân (mặc định: 2)
   * @returns Chuỗi đã được format
   */
  private formatMoney(value: any, decimals: number = 2): string {
    if (value == null || value === '' || value === undefined) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    // Format với số thập phân
    const formatted = numValue.toFixed(decimals);
    // Tách phần nguyên và phần thập phân
    const parts = formatted.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1] || '';
    // Xử lý số âm
    const isNegative = integerPart.startsWith('-');
    if (isNegative) {
      integerPart = integerPart.substring(1);
    }
    // Thêm dấu chấm phân cách hàng nghìn
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Thêm lại dấu âm nếu có
    if (isNegative) {
      integerPart = '-' + integerPart;
    }
    // Kết hợp với dấu phẩy cho phần thập phân
    if (decimalPart) {
      return `${integerPart},${decimalPart}`;
    }
    return integerPart;
  }
  //#endregion

  //#region Export Excel Partlist (từ form-export-excel-partlist component)
  /**
   * Format số với 2 chữ số thập phân
   */
  private formatNumberForExport(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format ngày tháng
   */
  private formatDateForExport(value: any): string {
    if (!value) return '';
    const dateTime = DateTime.fromISO(value);
    return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  }

  /**
   * Flatten tree data to array (recursive)
   */
  private flattenTreeDataForExport(treeData: any[]): any[] {
    const result: any[] = [];
    const flatten = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        result.push(node);
        if (node._children && node._children.length > 0) {
          flatten(node._children);
        }
      });
    };
    flatten(treeData);
    return result;
  }

  /**
   * Xuất Excel danh mục vật tư (từ form-export-excel-partlist)
   * @returns Promise<boolean> - true nếu xuất thành công, false nếu thất bại
   */
  async exportExcelPartlist(): Promise<boolean> {
    if (!this.tb_projectWorker) return false;

    // Lấy toàn bộ dữ liệu tree (cả node cha và node con) từ dữ liệu gốc
    const treeData = this.tb_projectWorker.getData('tree') || [];
    // Flatten tree data để export tất cả các node
    const data = this.flattenTreeDataForExport(treeData);

    if (!data || data.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel!'
      );
      return false;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh mục vật tư');

    // ===== HEADER SECTION (Rows 1-6) =====
    // Row 1: Title "DANH MỤC VẬT TƯ"
    // ===== MERGE CELLS (HEADER) =====
    worksheet.mergeCells('A1:A3');
    worksheet.mergeCells('B1:B3');
    worksheet.mergeCells('A4:B4');
    worksheet.mergeCells('A5:B5');

    worksheet.mergeCells('C1:F1');
    worksheet.mergeCells('G2:I2');
    worksheet.mergeCells('G3:I3');

    // ===== HEADER VALUES =====
    worksheet.getCell('C1').value = 'DANH MỤC VẬT TƯ';
    worksheet.getCell('C1').font = { bold: true, size: 14 };
    worksheet.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getCell('C2').value = 'Mã dự án:';
    worksheet.getCell('C2').alignment = { horizontal: 'right' };
    worksheet.getCell('D2').value = this.projectCodex || '';

    worksheet.getCell('C3').value = 'Tên dự án';
    worksheet.getCell('C3').alignment = { horizontal: 'right' };
    worksheet.getCell('D3').value = this.projectNameX || '';

    worksheet.getCell('G3').value = 'BM03-RTC.TE-QT01\nBan hành lần: 02';
    worksheet.getCell('G3').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    worksheet.getCell('A4').value = 'Người lập:';
    worksheet.getCell('E4').value = 'Kiểm tra:';
    worksheet.getCell('H4').value = 'Phê duyệt:';

    worksheet.getCell('A6').value = 'Ngày:';
    worksheet.getCell('G6').value = DateTime.now().toFormat('dd/MM/yyyy');
    worksheet.getCell('E6').value = 'Ngày:';
    worksheet.getCell('H6').value = 'Ngày:';

    // ===== DATA HEADER (Row 7) =====
    const exportColumns = [
      { header: 'TT', field: 'TT', width: 10 },
      { header: 'Tên vật tư', field: 'GroupMaterial', width: 35 },
      { header: 'Mã thiết bị', field: 'ProductCode', width: 18 },
      { header: 'Mã đặt hàng', field: 'BillCodePurchase', width: 18 },
      { header: 'Hãng SX', field: 'Manufacturer', width: 15 },
      { header: 'Thông số kỹ thuật', field: 'Model', width: 30 },
      { header: 'Số lượng/1 máy', field: 'QtyMin', width: 15, isNumber: true },
      { header: 'Số lượng tổng', field: 'QtyFull', width: 15, isNumber: true },
      { header: 'Đơn vị', field: 'Unit', width: 10 },
      { header: 'Đơn giá KT nhập', field: 'Price', width: 15, isNumber: true },
      { header: 'Thành tiền KT nhập', field: 'Amount', width: 18, isNumber: true },
      { header: 'Tiến độ', field: 'LeadTime', width: 15 },
      { header: 'Nhà cung cấp', field: 'NameNCCPriceQuote', width: 20 },
      { header: 'Ngày yêu cầu đặt hàng', field: 'RequestDate', width: 20, isDate: true },
      { header: 'Tiến độ yêu cầu', field: 'LeadTimePurchase', width: 18 },
      { header: 'SL đặt thực tế', field: 'QtyOrderActual', width: 15, isNumber: true },
      { header: 'NCC mua hàng', field: 'SupplierNamePurchase', width: 18 },
      { header: 'Giá đặt mua', field: 'PriceOrder', width: 15, isNumber: true },
      { header: 'Ngày đặt hàng thực tế', field: 'RequestDatePurchase', width: 18, isDate: true },
      { header: 'Dự kiến hàng về', field: 'ExpectedReturnDate', width: 18, isDate: true },
      { header: 'Tình trạng', field: 'StatusText', width: 12 },
      { header: 'Chất lượng', field: 'Quality', width: 12 },
      { header: 'Note', field: 'Note', width: 20 },
      { header: 'Lý do phát sinh', field: 'ReasonProblem', width: 20 },
      { header: 'Mã đặc biệt', field: 'SpecialCode', width: 15 },
      { header: 'Đơn giá Pur báo', field: 'UnitPriceQuote', width: 15, isNumber: true },
      { header: 'Thành tiền Pur báo', field: 'TotalPriceQuote1', width: 18, isNumber: true },
      { header: 'Loại tiền Pur báo', field: 'CurrencyQuote', width: 18 },
      { header: 'Tỷ giá báo', field: 'CurrencyRateQuote', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi báo giá (VNĐ)', field: 'TotalPriceExchangeQuote', width: 25, isNumber: true },
      { header: 'Đơn giá Pur mua', field: 'UnitPricePurchase', width: 18, isNumber: true },
      { header: 'Thành tiền Pur mua', field: 'TotalPricePurchase', width: 18, isNumber: true },
      { header: 'Loại tiền Pur mua', field: 'CurrencyPurchase', width: 18 },
      { header: 'Tỷ giá mua', field: 'CurrencyRatePurchase', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi mua (VNĐ)', field: 'TotalPriceExchangePurchase', width: 25, isNumber: true },
      { header: 'Leadtime Pur báo giá', field: 'LeadTimeQuote', width: 20 },
      { header: 'Leadtime Pur đặt mua', field: 'LeadTimePurchase', width: 20 },
      { header: 'SL đã về', field: 'QuantityReturn', width: 12, isNumber: true },
      { header: 'Mã nội bộ', field: 'ProductNewCode', width: 15 },
      { header: 'Số HĐ đầu vào', field: 'SomeBill', width: 18 },
      { header: 'SL đã về', field: 'QuantityReturn', width: 12, isNumber: true },
      { header: 'SL đã xuất', field: 'TotalExport', width: 12, isNumber: true },
      { header: 'SL còn lại', field: 'RemainQuantity', width: 12, isNumber: true },
    ];

    // Set column widths
    worksheet.columns = exportColumns.map((col, index) => ({
      key: col.field,
      width: col.width,
    }));

    // Add header row (Row 7 - tự động là row 7 vì đã có 6 dòng trước đó)
    const headerRowData = exportColumns.map((col) => col.header);
    const excelHeaderRow = worksheet.addRow(headerRowData);
    excelHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Light grey background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Add data rows
    data.forEach((row: any, rowIndex: number) => {
      const rowData = exportColumns.map((col) => {
        let value = row[col.field];

        // Format dates
        if (col.isDate && value) {
          const dateTime = DateTime.fromISO(value);
          value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        }

        // Format numbers
        if (col.isNumber && value !== null && value !== undefined && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
          } else {
            value = '';
          }
        }

        return value ?? '';
      });

      const excelRow = worksheet.addRow(rowData);

      // Style data rows
      excelRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Right-align number columns
        const colDef = exportColumns[colNumber - 1];
        if (colDef && colDef.isNumber) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }
      });
      excelRow.eachCell((cell, colNumber) => {
        const colDef = exportColumns[colNumber - 1];
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: colDef?.isNumber ? 'right' : 'left'
        };
      });

      // Highlight group rows (rows without TT or with parent indicator)
      if (!row.TT || (row._children && row._children.length > 0)) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow background for group rows
          };
        });
      }
    });

    // Generate and download file
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Lấy thông tin loại phiên bản, tên phiên bản và tên danh mục phiên bản
      let versionType = ''; // GP hoặc PO
      let versionName = ''; // Tên phiên bản (Code)
      let projectTypeName = ''; // Tên danh mục phiên bản (ProjectTypeName)
      
      if (this.type === 1) {
        // Giải pháp (GP)
        versionType = 'GP';
        const versionSelected = this.tb_projectPartListVersion?.getSelectedData();
        if (versionSelected && versionSelected.length > 0) {
          versionName = versionSelected[0].Code || this.CodeName || '';
          projectTypeName = versionSelected[0].ProjectTypeName || this.projectTypeName || '';
        } else {
          versionName = this.CodeName || '';
          projectTypeName = this.projectTypeName || '';
        }
      } else if (this.type === 2) {
        // PO
        versionType = 'PO';
        const versionSelected = this.tb_projectPartListVersionPO?.getSelectedData();
        if (versionSelected && versionSelected.length > 0) {
          versionName = versionSelected[0].Code || this.CodeName || '';
          projectTypeName = versionSelected[0].ProjectTypeName || this.projectTypeName || '';
        } else {
          versionName = this.CodeName || '';
          projectTypeName = this.projectTypeName || '';
        }
      } else {
        // Mặc định nếu không có type
        versionType = '';
        versionName = this.CodeName || '';
        projectTypeName = this.projectTypeName || '';
      }

      // Tạo tên file: DanhMucVatTu_ProjectCode_Loại phiên bản_tên danh mục phiên bản
      const projectCode = (this.projectCodex);
      const versionTypeClean = versionType;
      const versionNameClean = (versionName );
      const projectTypeNameClean = (projectTypeName);
      
      let fileName = `DanhMucVatTu_${projectCode}`;
      if (versionTypeClean) {
        fileName += `_${versionTypeClean}`;
      }
      if (versionNameClean) {
        fileName += `_${versionNameClean}`;
      }
      // if (projectTypeNameClean) {
      //   fileName += `_${projectTypeNameClean}`;
      // }
      fileName += '.xlsx';

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      this.notification.success(
        'Thành công',
        'Xuất Excel thành công!'
      );

      return true;
    } catch (error) {
      console.error('Error exporting Excel:', error);
      this.notification.error(
        'Lỗi',
        'Không thể xuất file Excel!'
      );
      return false;
    }
  }
  //#endregion

  // Fallback method để copy text nếu clipboard API không khả dụng
  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        console.error('Fallback: Không thể copy text');
      }
    } catch (err) {
      console.error('Fallback: Lỗi khi copy text', err);
    }
    
    document.body.removeChild(textArea);
  }
}
