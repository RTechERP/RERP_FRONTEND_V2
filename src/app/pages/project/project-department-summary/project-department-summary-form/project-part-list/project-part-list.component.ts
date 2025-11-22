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
  ChangeDetectorRef,
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
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { ImportExcelProjectWorkerComponent } from '../import-excel-project-worker/import-excel-project-worker.component';
import { ProjectPartListService } from './project-partlist-service/project-part-list-service.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { left } from '@popperjs/core';
import { ImportExcelPartlistComponent } from './project-partlist-import-excel/import-excel-partlist/import-excel-partlist.component';

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
    HasPermissionDirective,
  ],
  templateUrl: './project-part-list.component.html',
  styleUrl: './project-part-list.component.css',
})
export class ProjectPartListComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  //0: phiên bản partlist, 1: phiên bản nhân công ( danh cho thêm sửa giải pháp)
  typecheck: number = 0;
  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private projectPartListService: ProjectPartListService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService
  ) {}
  sizeSearch: string = '22%';
  sizeLeftPanel: string = '25%'; // Size của panel bên trái (3 bảng)
  sizeRightPanel: string = '75%'; // Size của panel bên phải (bảng vật tư)
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
  tb_solution: any;
  tb_projectPartListVersion: any;
  tb_projectPartListVersionPO: any;
  tb_projectWorker: any;
  dataProjectWorker: any[] = [];
  isTogglingChildren: boolean = false; // Flag để tránh vòng lặp vô hạn khi toggle children
  previousSelectedRows: Set<number> = new Set(); // Lưu lại các row đã được chọn trước đó
  dataSolution: any[] = [];
  dataSolutionVersion: any[] = [];
  dataPOVersion: any[] = [];
  dataProject: any[] = [];
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



  ngOnInit(): void {
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.isApprovedPurchase = -1;
    // Không load data ở đây vì bảng chưa được khởi tạo
    // Data sẽ được load sau khi bảng được khởi tạo trong ngAfterViewInit
  }
  ngAfterViewInit(): void {
    // Khởi tạo bảng trước
    this.drawTbSolution();
    this.drawTbProjectPartListVersion();
    this.drawTbProjectPartListVersionPO();
    this.drawTbProjectPartList();
    
    // Sau khi bảng đã được khởi tạo, mới load data
    this.loadDataSolution();
  }
  loadDataSolution(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_solution) {
      console.warn('tb_solution chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataSolution(), 100);
      return;
    }

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
            this.loadDataProjectPartListVersion();
            this.loadDataProjectPartListVersionPO();
          } else {
            this.dataSolution = [];
            if (this.tb_solution) {
              this.tb_solution.setData([]);
            }
            this.projectSolutionId = 0;
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error loading solution:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu giải pháp');
      },
    });
  }
  loadDataProjectPartListVersion(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_projectPartListVersion) {
      console.warn('tb_projectPartListVersion chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataProjectPartListVersion(), 100);
      return;
    }

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
        },
        error: (error: any) => {
          console.error('Error loading project part list version:', error);
          this.notification.error('Lỗi', error.message);
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
      },
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
    if (this.type === 1) {
      // Giải pháp
      this.selectedData = this.tb_projectPartListVersion?.getSelectedData();
      if (this.selectedData && this.selectedData.length > 0) {
        selectedVersionID = this.selectedData[0].ID || 0;
        projectTypeID = this.selectedData[0].ProjectTypeID || 0;
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
      PartlistTypeID:  projectTypeID,
      IsDeleted: this.isDeleted || 0, 
     Keywords: this.keyword || '',
      IsApprovedTBP: this.isApprovedTBP ,
    IsApprovedPurchase:this.isApprovedPurchase,
     ProjectPartListVersionID:selectedVersionID || 0,
     //17433,7,0,'',-1,-1,1384
        // projectID: this.projectId || 0,
        // projectWorkerTypeID: this.projectworkertypeID || 0,
        // IsApprovedTBP: this.isApprovedTBP ,
        // IsDeleted: this.isDeleted || 0,
        // KeyWord: this.keyword || '',
        // versionID: selectedVersionID || 0
    
    };
    console.log('payload', payload);
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
              }, 100);
            }); 
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu nhân công');
      }
    });
  }
  //#endregion
  //#region cập nhật trạng thái duyệt TBP
  updateApprove(action: number): void {
    const isApproved = action === 1;
    const isApprovedText = isApproved ? 'duyệt' : 'hủy duyệt';
    
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
          this.notification.success('Thành công', 'Duyệt thành công!');
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
    const actionText = isFix ? 'duyệt' : 'hủy duyệt';
    const actionTextCapital = isFix ? 'Duyệt' : 'Hủy duyệt';
    
    // Kiểm tra phiên bản đang sử dụng (giống logic updateApprove)
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
      nzContent: `Bạn có chắc chắn muốn ${actionText} tích xanh cho ${itemCount} vật tư${sttList ? ` (Stt: ${sttList})` : ''}?`,
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
    const isApprovedText = isApproved ? 'duyệt' : 'hủy duyệt';
    
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
      this.notification.warning('Thông báo', `Không có vật tư hợp lệ để ${isApprovedText} mã mới.\nVui lòng chọn các vật tư có mã mới (node lá)`);
      return;
    }

    // Hiển thị modal xác nhận
    const itemCount = requestItems.length;
    const sttList = requestItems.map((item: any) => item.TT).join(', ');
    
    this.modal.confirm({
      nzTitle: `Xác nhận ${isApprovedText} mã mới`,
      nzContent: `Bạn có chắc chắn muốn ${isApprovedText} mã mới cho ${itemCount} vật tư (Stt: ${sttList})?`,
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
    console.log('=== SENDING APPROVE NEW CODE TO API ===');
    console.log('Total items:', requestItems.length);
    console.log('IsApproved:', isApproved);
    console.log('Payload:', JSON.stringify(requestItems, null, 2));

    this.projectPartListService.approveNewCode(requestItems, isApproved).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          const actionText = isApproved ? 'Duyệt' : 'Hủy duyệt';
          this.notification.success('Thành công', response.message || `${actionText} mã mới thành công!`);
          this.loadDataProjectPartList();
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể cập nhật trạng thái duyệt mã mới');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật trạng thái duyệt mã mới');
        }
      },
      error: (error: any) => {
        console.error('=== API ERROR ===');
        console.error('Error approving new code:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
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
      if (selectedVersion['IsActive'] == false || selectedVersion['IsActive'] == null) {
        this.notification.warning('Thông báo', `Vui lòng chọn sử dụng phiên bản [${selectedVersion.Code}] trước!`);
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
        this.notification.warning('Thông báo', `Không thể yêu cầu báo giá vì vật tư thứ tự [${row.TT || row.ID}] đã bị xóa!`);
        return;
      }

      // Xác định IsLeaf trước để validate đúng
      const isLeaf = !row._children || row._children.length === 0;

      // ===== VALIDATION CHỈ ÁP DỤNG CHO NODE LÁ (giống API) =====
      if (isLeaf) {
        // Kiểm tra IsNewCode và IsApprovedTBPNewCode
        if (row.IsNewCode == true && row.IsApprovedTBPNewCode == false) {
          this.notification.warning('Thông báo', `Vật tư Stt [${row.TT}] chưa được TBP duyệt mới.\nVui lòng kiểm tra lại!`);
          return;
        }

        // Kiểm tra đã yêu cầu báo giá chưa
        if (row.StatusPriceRequest > 0) {
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
        IsApprovedTBPNewCode: row.IsApprovedTBPNewCode,
        StatusPriceRequest: row.StatusPriceRequest,
        IsLeaf: isLeaf,
        DeadlinePriceRequest: null // Sẽ được set sau khi chọn ngày
      });
    }

    // Reset deadline và mở modal chọn deadline
    this.deadlinePriceRequest = null;
    this.showPriceRequestModal(requestItems);
  }

  // Hàm tính ngày deadline tối thiểu
  getMinDeadlineDate(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Nếu sau 15h, bắt đầu từ ngày mai + 2 ngày
    // Nếu trước 15h, bắt đầu từ hôm nay + 2 ngày
    let minDays = 2;
    let startDate = new Date(now);
    
    if (currentHour >= 15) {
      // Sau 15h: bắt đầu từ ngày mai
      startDate.setDate(startDate.getDate() + 1);
    }
    
    // Thêm 2 ngày làm việc
    startDate.setDate(startDate.getDate() + minDays);
    
    // Đảm bảo là ngày làm việc (T2-T6)
    return this.getNextWorkingDay(startDate);
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
  disabledDate = (current: Date): boolean => {
    if (!current) {
      return false;
    }
    
    const minDate = this.getMinDeadlineDate();
    minDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(current);
    currentDate.setHours(0, 0, 0, 0);
    
    // Disable nếu trước ngày tối thiểu
    if (currentDate < minDate) {
      return true;
    }
    
    // Disable thứ 7 và chủ nhật
    const day = currentDate.getDay();
    return day === 0 || day === 6;
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
      const selectedDate = new Date(this.deadlinePriceRequest);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < minDate) {
        this.notification.warning('Thông báo', 'Deadline phải từ ' + minDate.toLocaleDateString('vi-VN') + ' trở đi!');
        resolve(false);
        return;
      }

      // Kiểm tra có phải ngày làm việc không
      const day = selectedDate.getDay();
      if (day === 0 || day === 6) {
        this.notification.warning('Thông báo', 'Deadline phải là ngày làm việc (Thứ 2 - Thứ 6)!');
        resolve(false);
        return;
      }

      // Đếm số ngày cuối tuần giữa hôm nay và deadline
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const countWeekend = this.countWeekendDays(now, selectedDate);

      // Nếu có ngày cuối tuần, hiển thị thông báo xác nhận
      if (countWeekend > 0) {
        const deadlineStr = selectedDate.toLocaleDateString('vi-VN');
        const message = `Deadline sẽ không tính Thứ 7 và Chủ nhật (có ${countWeekend} ngày cuối tuần).\nBạn có chắc muốn chọn Deadline là ngày [${deadlineStr}] không?`;
        
        this.modal.confirm({
          nzTitle: 'Xác nhận Deadline',
          nzContent: message,
          nzOkText: 'Có',
          nzCancelText: 'Không',
          nzOkType: 'primary',
          nzOnOk: () => {
            // Người dùng xác nhận → Gán deadline và gọi API
            this.assignDeadlineToItems(requestItems);
            this.confirmPriceRequest(requestItems);
            resolve(true); // Đóng modal đầu tiên
          },
          nzOnCancel: () => {
            // Người dùng không xác nhận → Không đóng modal đầu tiên
            resolve(false);
          }
        });
      } else {
        // Không có ngày cuối tuần → Gán deadline và gọi API trực tiếp
        this.assignDeadlineToItems(requestItems);
        this.confirmPriceRequest(requestItems);
        resolve(true); // Đóng modal
      }
    });
  }

  // Hàm gán deadline vào các items trong payload
  assignDeadlineToItems(requestItems: any[]): void {
    if (!this.deadlinePriceRequest) {
      console.error('Deadline is null or undefined');
      return;
    }

    // Convert Date sang ISO string để gửi lên API
    // Backend ASP.NET Core sẽ tự động parse ISO string thành DateTime
    const deadlineISO = new Date(this.deadlinePriceRequest).toISOString();

    requestItems.forEach((item: any) => {
      // Gán deadline vào đúng trường DeadlinePriceRequest
      item.DeadlinePriceRequest = deadlineISO;
    });

    console.log('Deadline assigned to items:', {
      selectedDate: this.deadlinePriceRequest,
      isoFormat: deadlineISO,
      itemsCount: requestItems.length,
      sampleItem: requestItems[0]
    });
  }

  // Hàm xác nhận và gọi API
  confirmPriceRequest(requestItems: any[]): void {
    // Log payload trước khi gửi API để debug
    console.log('=== SENDING PRICE REQUEST TO API ===');
    console.log('Total items:', requestItems.length);
    console.log('Payload:', JSON.stringify(requestItems, null, 2));
    console.log('Sample item:', requestItems[0]);
    console.log('DeadlinePriceRequest value:', requestItems[0]?.DeadlinePriceRequest);
    console.log('====================================');

    this.projectPartListService.requestPrice(requestItems).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
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
        console.error('=== API ERROR ===');
        console.error('Error requesting price quote:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
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
        this.notification.warning('Thông báo', `Vật tư Stt [${row.STT || row.TT || row.ID}] chưa được yêu cầu báo giá.\nKhông thể hủy yêu cầu báo giá!`);
        return;
      }

      // Kiểm tra phòng mua đã check giá chưa
      if (row.IsCheckPrice === true) {
        this.notification.warning('Thông báo', `Phòng mua đã check giá sản phẩm Stt [${row.STT || row.TT || row.ID}].\nBạn không thể hủy y/c báo giá`);
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
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để hủy yêu cầu báo giá.\nVui lòng chọn các vật tư đã được yêu cầu báo giá (node lá)');
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
      if (row.IsApprovedTBP == false) {
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

      // Thêm vào danh sách yêu cầu
      requestItems.push({
        ID: row.ID,
        STT: row.STT|| 0,
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
        TotalPriceOrder: row.TotalPriceOrder ||0,
        QtyFull: row.QtyFull || 0,
        LeadTime: row.LeadTime || "",
        UnitMoney: row.UnitMoney || ""
      });
    }

    // Kiểm tra có item nào để yêu cầu không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để yêu cầu mua hàng.\nVui lòng chọn các vật tư đã được TBP duyệt (node lá)');
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
    
    // Nếu sau 15h, bắt đầu từ ngày mai + 2 ngày
    // Nếu trước 15h, bắt đầu từ hôm nay + 2 ngày
    let minDays = 2;
    let startDate = new Date(now);
    
    if (currentHour >= 15) {
      // Sau 15h: bắt đầu từ ngày mai
      startDate.setDate(startDate.getDate() + 1);
    }
    
    // Thêm 2 ngày làm việc
    startDate.setDate(startDate.getDate() + minDays);
    
    // Đảm bảo là ngày làm việc (T2-T6)
    return this.getNextWorkingDay(startDate);
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
    
    // Disable nếu trước ngày tối thiểu
    if (currentDate < minDate) {
      return true;
    }
    
    // Disable thứ 7 và chủ nhật
    const day = currentDate.getDay();
    return day === 0 || day === 6;
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

      const now = new Date();
      const selectedDate = new Date(this.deadlinePurchaseRequest);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Tính số ngày (timeSpan) - giống logic WinForm: (deadline.Date - dateNow.Date).TotalDays + 1
      const timeSpan = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const currentHour = now.getHours();

      // Validation 1: Kiểm tra số ngày tối thiểu
      if (currentHour < 15) {
        // Trước 15h: deadline phải >= 2 ngày
        if (timeSpan < 2) {
          this.notification.warning('Thông báo', 'Deadline tối thiểu là 2 ngày từ ngày hiện tại!');
          resolve(false);
          return;
        }
      } else {
        // Sau 15h: deadline phải >= 3 ngày (vì tính từ ngày hôm sau)
        if (timeSpan < 3) {
          this.notification.warning('Thông báo', 'Yêu cầu từ sau 15h nên ngày Deadline sẽ bắt đầu tính từ ngày hôm sau và tối thiểu là 2 ngày!');
          resolve(false);
          return;
        }
      }

      // Validation 2: Kiểm tra deadline phải là ngày làm việc (T2-T6)
      const day = selectedDate.getDay();
      if (day === 0 || day === 6) {
        this.notification.warning('Thông báo', 'Deadline phải là ngày làm việc (T2 - T6)!');
        resolve(false);
        return;
      }

      // Validation 3: Đếm số ngày cuối tuần trong khoảng thời gian
      const countWeekend = this.countWeekendDays(today, selectedDate);

      // Nếu có ngày cuối tuần, hiển thị thông báo xác nhận
      if (countWeekend > 0) {
        const deadlineStr = selectedDate.toLocaleDateString('vi-VN');
        const message = `Deadline sẽ không tính Thứ 7 và Chủ nhật (có ${countWeekend} ngày cuối tuần).\nBạn có chắc muốn chọn Deadline là ngày [${deadlineStr}] không?`;
        
        this.modal.confirm({
          nzTitle: 'Xác nhận Deadline',
          nzContent: message,
          nzOkText: 'Có',
          nzCancelText: 'Không',
          nzOkType: 'primary',
          nzOnOk: () => {
            // Người dùng xác nhận → Gán deadline và gọi API
            this.assignDeadlineToPurchaseItems(requestItems);
            this.confirmPurchaseRequest(requestItems, projectTypeID);
            resolve(true); // Đóng modal đầu tiên
          },
          nzOnCancel: () => {
            // Người dùng không xác nhận → Không đóng modal đầu tiên
            resolve(false);
          }
        });
      } else {
        // Không có ngày cuối tuần → Gán deadline và gọi API trực tiếp
        this.assignDeadlineToPurchaseItems(requestItems);
        this.confirmPurchaseRequest(requestItems, projectTypeID);
        resolve(true); // Đóng modal
      }
    });
  }

  // Hàm gán deadline vào các items trong payload
  assignDeadlineToPurchaseItems(requestItems: any[]): void {
    if (!this.deadlinePurchaseRequest) {
      console.error('Deadline is null or undefined');
      return;
    }

    // Convert Date sang ISO string để gửi lên API
    const deadlineISO = new Date(this.deadlinePurchaseRequest).toISOString();

    requestItems.forEach((item: any) => {
      item.DeadlinePur = deadlineISO;
    });
  }

  // Hàm xác nhận và gọi API yêu cầu mua hàng
  confirmPurchaseRequest(requestItems: any[], projectTypeID: number): void {
    console.log('=== SENDING PURCHASE REQUEST TO API ===');
    console.log('Total items:', requestItems.length);
    console.log('Payload:', JSON.stringify(requestItems, null, 2));

    const projectSolutionID = this.projectSolutionId || 0;
    const projectID = this.projectId || 0;

    this.projectPartListService.approvePurchaseRequest(requestItems, true, projectTypeID, projectSolutionID, projectID).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Yêu cầu mua hàng thành công!');
          this.loadDataProjectPartList();
          this.deadlinePurchaseRequest = null;
        } else if (response.status === 2) {
          this.notification.warning('Thông báo', response.message || 'Không thể yêu cầu mua hàng');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể yêu cầu mua hàng');
        }
      },
      error: (error: any) => {
        console.error('=== API ERROR ===');
        console.error('Error requesting purchase:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.error?.message || error?.message,
          error: error?.error
        });
        console.error('=================');
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
        TT: row.TT ,
        IsLeaf: isLeaf,
        IsApprovedPurchase: row.IsApprovedPurchase || false
      });
    }

    // Kiểm tra có item nào để hủy không
    if (requestItems.length === 0) {
      this.notification.warning('Thông báo', 'Không có vật tư hợp lệ để hủy yêu cầu mua hàng.\nVui lòng chọn các vật tư đã được yêu cầu mua hàng (node lá)');
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

  //#region open modal import excel nhân công
  openImportExcelProjectPartList(): void {
    const modalRef = this.ngbModal.open(ImportExcelPartlistComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCode = this.projectCodex;
    modalRef.componentInstance.versionId = this.versionID;
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
  //#region export excel nhân công 
  onExportExcel(){
    if(!this.tb_projectWorker) return;
    const data = this.tb_projectWorker.getData();
    if(!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    
    // Lấy tất cả columns và filter: bỏ cột đầu tiên và các cột có visible: false
    const allColumns = this.tb_projectWorker.getColumns();
    const visibleColumns = allColumns.filter((col: any, index: number) => {
      // Bỏ cột đầu tiên (rowSelection)
      if (index === 0) return false;
      // Chỉ lấy các cột có visible: true hoặc undefined (mặc định là visible)
      const colDef = col.getDefinition();
      return colDef.visible !== false; // undefined hoặc true đều được giữ lại
    });
    
    // Tạo một table tạm với chỉ các cột visible để export
    const filteredTable = {
      getColumns: () => visibleColumns
    };
    
    this.projectService.exportExcel(filteredTable, data, 'Nhân công', 'NhanCongDuAn_'+this.projectCodex);
  }
  //#endregion
  //#region export excel phiên bản giải pháp
  onExportExcelSolutionVersion(): void {
    if(!this.tb_projectPartListVersion) return;
    const data = this.tb_projectPartListVersion.getData();
    if(!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(this.tb_projectPartListVersion, data, 'Phiên bản giải pháp', 'PhienBanGiaiPhapDuAn_'+this.projectCodex);
  }
  //#endregion
  //#region export excel phiên bản PO
  onExportExcelPOVersion(): void {
    if(!this.tb_projectPartListVersionPO) return;
    const data = this.tb_projectPartListVersionPO.getData();
    if(!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(this.tb_projectPartListVersionPO, data, 'Phiên bản PO', 'PhienBanPODuAn_'+this.projectCodex);
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
        el.style.color = 'white';
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

      // Kiểm tra xem cột đầu tiên có phải là group không
      if (firstColumn.getDefinition().columns) {
        // Là group → cập nhật title của group
        firstColumn.updateDefinition({ title: newTitle });
      } else {
        // Không phải group → tìm group cha (nếu có)
        const parentGroup = firstColumn.getParentColumn();
        if (parentGroup && parentGroup.getDefinition().columns) {
          parentGroup.updateDefinition({ title: newTitle });
        } else {
          // Fallback: đặt title cho cột đầu tiên (nếu không có group)
          firstColumn.updateDefinition({ title: newTitle });
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
  deleteProjectSolutionVersion(typenumber: number): void {
    var ID: number = 0;
    if (typenumber === 1) {
      const data = this.tb_projectPartListVersion.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn 1 phiên bản giải pháp'
        );
        return;
      }
      ID = data[0].ID;
    } else {
        const data = this.tb_projectPartListVersionPO.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản PO');
        return;
      }
      ID = data[0].ID;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa phiên bản giải pháp này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const payload = {
          ID: ID,
          IsDeleted: true,
        };
        console.log('payload', payload);
        this.projectWorkerService.saveSolutionVersion(payload).subscribe({
          next: (response: any) => {
            if (response.status === 1) {
              this.notification.success('Thành công', response.message);
              this.loadDataProjectPartListVersion();
              this.loadDataProjectPartListVersionPO();
            } else {
              this.notification.error('Lỗi', response.message);
            }
          },
        });
      },
      nzCancelText: 'Hủy',
    });
  }
  //#endregion
  //#region draw bảng giải pháp, phiên bản giải pháp, phiên bản PO, nhân công
  drawTbSolution(): void {
    this.tb_solution = new Tabulator(this.tb_solutionContainer.nativeElement, {
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
          // Tự động đánh số thứ tự
        },
        {
          title: 'PO',
          field: 'StatusSolution',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === 1 ? 'checked' : '')} onclick="return false;">`;
          },
        },
        // {
        //   title: 'Duyệt báo giá',
        //   field: 'IsApprovedPrice',
        //   hozAlign: 'center',
        //   headerHozAlign: 'center',
        //   formatter: (cell: any) => {
        //     const value = cell.getValue();
        //     return value === true
        //       ? '<i class="fa fa-check text-success"></i>'
        //       : '<i class="fa fa-times text-danger"></i>';
        //   },
        // },
        {
          title: 'Duyệt PO',
          field: 'IsApprovedPO',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
          },
        },
        {
          title: 'Ngày lên GP',
          field: 'DateSolution',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
        // {
        //   title: 'Deadline báo giá',
        //   field: 'PriceReportDeadline',
        //   hozAlign: 'center',
        //   headerHozAlign: 'center',
        //   formatter: (cell: any) => {
        //     const value = cell.getValue();
        //     return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        //   },
        // },
        {
          title: 'Mã giải pháp',
          field: 'CodeSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Nội dung',
          field: 'ContentSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'textarea',

          formatter: 'textarea', // Hiển thị multiline
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
    });
  }
  drawTbProjectPartListVersion(): void {
    this.tb_projectPartListVersion = new Tabulator(
      this.tb_projectPartListVersionContainer.nativeElement,
      {
        pagination: false,
        paginationMode: 'local',
        data: this.dataSolutionVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        groupHeader: (value: any) => `Danh mục: ${value}`,
        columns: [
          {
            title: 'STT',
            field: 'STT',
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
          },
          {
            title: 'Mô tả',
            field: 'DescriptionVersion',
            hozAlign: 'left',
            headerHozAlign: 'center',
            formatter: 'textarea',
            variableHeight: true,
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
    this.tb_projectPartListVersionPO = new Tabulator(
      this.tb_projectPartListVersionPOContainer.nativeElement,
      {
        pagination: false,
        paginationMode: 'local',
        data: this.dataPOVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        
        groupHeader: (value: any) => `Danh mục: ${value}`,
        columns: [
          {
            title: 'STT',
            width: 60,
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
            width: 90,
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
      const data = row.getData();
      this.selectionCode = data.Code;
      this.projectTypeID = data.ProjectTypeID;
      this.projectTypeName = data.ProjectTypeName;
      this.projectCode = data.ProjectCode;
      this.versionID = data.ID || 0;
      this.type = 2; // PO
      this.CodeName = data.Code;
      // Bỏ chọn tất cả các dòng đã chọn trong bảng solutionVersion
      const selectedRows = this.tb_projectPartListVersion.getSelectedRows();
      selectedRows.forEach((selectedRow: any) => {
        selectedRow.deselect();
      });
      console.log('type', this.type);
      this.toggleTBPColumn();
      this.loadDataProjectPartList();
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
  applyCellColor(cell: any, field: string, checkField: string): void {
    try {
      const data = cell.getRow().getData();
      
      // Kiểm tra nếu là node cha (có children) thì không vẽ màu (giống WinForm: if (e.Node.HasChildren) return;)
      if (data._children && data._children.length > 0) {
        return;
      }
      
      // Kiểm tra isNewCode (giống WinForm: if (!isNewCode) return;)
      const isNewCode = data.IsNewCode === true;
      if (!isNewCode) {
        return;
      }
      
      // Kiểm tra field check tương ứng (giống WinForm: if (totalSame == 0) → màu hồng)
      const checkValue = Number(data[checkField]) || 0;
      if (checkValue === 0) {
        // Vẽ màu hồng cho cell này (giống WinForm: e.Appearance.BackColor = Color.Pink)
        const cellElement = cell.getElement();
        if (cellElement) {
          cellElement.style.backgroundColor = 'pink';
        }
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
        
        // Áp dụng màu IsFix cho cột ProductCode (ưu tiên cao hơn)
        const isFix = data.IsFix === true;
        if (isFix) {
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
        }
        
        // Chỉ áp dụng khi isNewCode = true - giống WinForm: if (!isNewCode) return;
        const isNewCode = data.IsNewCode === true;
        if (!isNewCode) {
          return;
        }
        
        // Áp dụng màu cho các cột: GroupMaterial, ProductCode, Manufacturer, Unit
        // (giống WinForm: e.Column == colGroupMaterial, colProductCode, colManufacturer, colUnit)
        // Lưu ý: ProductCode sẽ bị ghi đè bởi màu IsFix nếu IsFix = true
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
          
          const checkValue = Number(data[checkField]) || 0;
          if (checkValue === 0) {
            try {
              const cell = row.getCell(field);
              if (cell) {
                const cellElement = cell.getElement();
                if (cellElement) {
                  cellElement.style.backgroundColor = 'pink'; // giống WinForm: Color.Pink
                }
              }
            } catch (e) {
              // Ignore errors for cells that don't exist
            }
          }
        });
      });
    } catch (e) {
      console.error('Error applying cell colors:', e);
    }
  }

  drawTbProjectPartList(): void {
    // let selectedData: any[] = [];
    // if (this.type === 1) {
    //   // Giải pháp
    //   selectedData = this.tb_projectPartListVersion?.getSelectedData();
    //    } else if (this.type === 2) {
    //   // PO
    //   selectedData= this.tb_projectPartListVersionPO?.getSelectedData();
     
    // }
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
            el.style.color = 'white';
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
            title: 'ID',
            field: 'ID',
            visible: false,
          },
          {
            title: 'EmployeeIDRequestPrice',
            field: 'EmployeeIDRequestPrice',
            visible: false,
          },
          {
            title: 'STT',
            field: 'STT',
            visible: false,
          },
          {
            title: 'Vật tư dự án',
          
            columns: [
              // === CỘT CHỌN DÒNG ===
              {
                title: 'rowSelection',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 50,
                formatter: 'rowSelection',
                titleFormatter: 'rowSelection',
              
                
              },
              // === CỘT ẨN ===
              { title: 'ParentID', field: 'ParentID', visible: false ,},
              { title: 'ID', field: 'ID', visible: false ,  },
              { title: 'ProjectPartListVersionID', field: 'ProjectPartListVersionID', visible: false ,  },
              { title: 'IsDeleted', field: 'IsDeleted', visible: false ,},
              // Các cột phục vụ yêu cầu mua hàng (ẩn) - chỉ thêm các field chưa có trong bảng
              { title: 'IsApprovedTBP', field: 'IsApprovedTBP', visible: false }, // Cần cho 
              { title: 'DeadlinePur', field: 'DeadlinePur', visible: false },
              { title: 'SupplierSaleQuoteID', field: 'SupplierSaleQuoteID', visible: false },
              { title: 'TotalPriceOrder', field: 'TotalPriceOrder', visible: false },
              { title: 'TotalPriceQuote', field: 'TotalPriceQuote', visible: false },
              { title: 'TotalPrice', field: 'TotalPrice', visible: false },
              { title: 'LeadTime', field: 'LeadTime', visible: false },
              { title: 'UnitMoney', field: 'UnitMoney', visible: false },
              // Các cột phục vụ duyệt mã mới
              { title: 'IsLeaf', field: 'IsLeaf', visible: false },
              { title: 'HasChildren', field: 'HasChildren', visible: false },
              { title: 'UnitPriceQuote', field: 'UnitPriceQuote', visible: false },
  
              // === DANH MỤC VẬT TƯ ===
              { 
                title: 'TT', 
                field: 'TT', 
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
              
                // formatter: 'rowSelection',
                // titleFormatter: 'rowSelection',
              },
              { 
                title: 'Tên vật tư', 
                field: 'GroupMaterial', 
                formatter: (cell: any) => {
                  // Áp dụng logic CustomDrawNodeCell (giống WinForm treeListData_CustomDrawNodeCell)
                  const result = this.customDrawNodeCell(cell, 'GroupMaterial', 'IsSameProductName');
                  // Đảm bảo màu được áp dụng sau khi render
                  setTimeout(() => {
                    this.applyCellColor(cell, 'GroupMaterial', 'IsSameProductName');
                  }, 0);
                  return result;
                },
                widthGrow: 2,
                maxWidth: 250,
              
              },
              { 
                title: 'Mã thiết bị', 
                field: 'ProductCode', 
              
                formatter: (cell: any) => {
                  // Áp dụng logic CustomDrawNodeCell (giống WinForm treeListData_CustomDrawNodeCell)
                  const result = this.customDrawNodeCell(cell, 'ProductCode', 'IsSameProductCode');
                  // Đảm bảo màu được áp dụng sau khi render
                  setTimeout(() => {
                    this.applyCellColor(cell, 'ProductCode', 'IsSameProductCode');
                    // Nếu IsFix = true, tô màu xanh nước biển cho cột Mã thiết bị
                    this.applyIsFixColor(cell);
                  }, 0);
                  return result;
                },
                widthGrow: 2,
                maxWidth: 100,
              },
              { title: 'Số lượng / 1 máy', field: 'QtyMin', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }, },
              { title: 'Số lượng tổng', field: 'QtyFull', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }, },
            ]
          },
          {
            title: '',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Tích xanh',
                field: 'IsFix',
                hozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
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
              { title: 'Thông số kỹ thuật', field: 'Model', formatter: 'textarea' },
              {
                title: 'Đơn giá',
                field: 'Price',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              {
                title: 'Tổng tiền',
                field: 'Amount',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              {
                title: 'Đơn giá lịch sử',
                field: 'UnitPriceHistory',
                hozAlign: 'right',
                headerHozAlign: 'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { title: 'Loại tiền', field: 'CurrencyCode', headerHozAlign: 'center' },
              { title: 'Chất lượng', field: 'Quality', headerHozAlign: 'center' },
              { title: 'Người tạo', field: 'FullNameCreated', headerHozAlign: 'center' },
              { title: 'Ngày tạo', field: 'CreatedDate', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              { title: 'Note', field: 'Note', formatter: 'textarea', widthGrow: 2, maxWidth: 300 },
              { title: 'Lý do phát sinh', field: 'ReasonProblem' },
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
              { title: 'NV báo giá', field: 'FullNameRequestPrice' },
              { title: 'Ngày yêu cầu', hozAlign: 'center', field: 'DatePriceRequest', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              { title: 'Người yêu cầu', field: 'FullNameRequestPurchase' },
              { title: 'Deadline Báo giá', hozAlign: 'center', field: 'DeadlinePriceRequest', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              { title: 'Ngày báo giá', hozAlign: 'center', field: 'DatePriceQuote1', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              {
                title: 'Đơn giá báo',
                field: 'UnitPriceQuote',
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              {
                title: 'Thành tiền báo giá',
                field: 'TotalPriceQuote1',  // Sửa: dùng TotalPriceQuote1
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { title: 'Loại tiền', field: 'CurrencyQuote', hozAlign: 'center' },
              { title: 'Tỷ giá báo', field: 'CurrencyRateQuote', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},
              { 
                title: 'Thành tiền quy đổi báo giá (VND)', 
                field: 'TotalPriceExchangeQuote', 
                hozAlign: 'right', 
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { title: 'Nhà cung cấp báo giá', field: 'NameNCCPriceQuote', hozAlign: 'right' },
              { title: 'Lead Time báo giá', field: 'LeadTimeQuote', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},
              { title: 'Ngày về dự kiến', field: 'DateExpectedQuote', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              { title: 'Ghi chú báo giá', field: 'NoteQuote', formatter: 'textarea' },
            ]
          },
          {
            title: 'Yêu cầu mua hàng',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              { title: 'Yêu cầu mua', field: 'IsApprovedPurchase', 
                hozAlign:'center',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === 'Đã ' || value === true ? 'checked' : '')} onclick="return false;">`;
                }
              },
              { title: 'Người yêu cầu mua', field: 'FullNameRequestPurchase', hozAlign: 'left' },  // Sửa: dùng FullNameRequestPurchase
              { title: 'Tình trạng', field: 'StatusText', hozAlign: 'center' },  // Sửa: không có StatusPurchaseRequestText
              { title: 'NV mua hàng', field: 'FullNamePurchase', hozAlign: 'left' },  // Sửa: dùng FullNamePurchase
              { title: 'Deadline mua hàng', field: 'ExpectedReturnDate', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa: không có DeadlinePurchaseRequest
              { title: 'Ngày yêu cầu đặt hàng', field: 'RequestDate', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày bắt đầu đặt hàng', field: 'RequestDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày dự kiến đặt hàng', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày dự kiến hàng về', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              {
                title: 'Mã đặt hàng',
                field: 'BillCodePurchase', hozAlign: 'left'  // Sửa
              },
              { 
                title: 'Đơn giá mua hàng', 
                field: 'UnitPricePurchase', 
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { 
                title: 'Thành tiền mua hàng', 
                field: 'TotalPricePurchase',  // Sửa: dùng TotalPricePurchaseExport
                hozAlign: 'right',
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { title: 'Loại tiền', field: 'CurrencyPurchase', hozAlign: 'center' },
              { title: 'Tỷ giá mua', field: 'CurrencyRatePurchase', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},
              { 
                title: 'Thành tiền quy đổi mua hàng (VND)', 
                field: 'TotalPriceExchangePurchase', 
                hozAlign: 'right', 
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
                },
              },
              { title: 'NCC mua hàng', field: 'SupplierNamePurchase', hozAlign: 'right' },  // Sửa
              { title: 'Lead Time đặt hàng', field: 'LeadTimePurchase', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'SL đã về', field: 'QuantityReturn', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa: không có QtyReceivePurchase
              { title: 'SL đã xuất', field: 'TotalExport', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'SL còn lại', field: 'RemainQuantity', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'Mã nội bộ', field: 'ProductNewCode', hozAlign: 'center' },  // Sửa
              { title: 'Phiếu xuất', field: 'BillExportCode', hozAlign: 'center' },  // Sửa
              { title: 'Ngày nhận hàng', field: 'DateImport', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
  
              { title: 'Ghi chú mua', field: 'NotePurchase', formatter: 'textarea' },
            ]
          },
          {
            title: '',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              { title: 'Ngày nhập kho', field: 'DateImport', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
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
              { title: 'Hà Nội', field: 'TotalHN', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'Hồ Chí Minh', field: 'TotalHCM', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'Đan phượng', field: 'TotalDP', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa: không có DanPhuong
              { title: 'Hải Phòng', field: 'TotalHP', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
              { title: 'Bắc Ninh', field: 'TotalBN', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},  // Sửa
            ]
          },
        ],
      }
    );
  this.tb_projectWorker.on('dataLoaded', () => {
    setTimeout(() => {
      this.applyDeletedRowStyle();
      // Áp dụng màu cho các cell (giống WinForm CustomDrawNodeCell)
      this.applyCellColors();
    }, 50); // Đảm bảo DOM đã render xong
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
      // Áp dụng màu xanh nước biển nếu IsFix = true
      this.applyIsFixColor(cell);
    } else if (field === 'Manufacturer') {
      this.applyCellColor(cell, 'Manufacturer', 'IsSameMaker');
    } else if (field === 'Unit') {
      this.applyCellColor(cell, 'Unit', 'IsSameUnit');
    }
  });

    // Thêm logic: khi chọn nút cha, tự động chọn tất cả nút con
    // Xử lý cả chọn và bỏ chọn
    this.tb_projectWorker.on('rowSelectionChanged', (data: any[], rows: any[]) => {
      // Lấy danh sách các row ID hiện tại đang được chọn
      const currentSelectedIds = new Set<number>();
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
      this.previousSelectedRows.forEach((id: number) => {
        if (!currentSelectedIds.has(id)) {
          deselectedIds.add(id);
        }
      });

      // Kiểm tra xem có đang bỏ chọn node lá không (node không có children - ở bất kỳ cấp nào)
      // Ví dụ: 1.1.1 là node lá, 1.1 có thể là node cha (có 1.1.1, 1.1.2)
      let isDeselectingLeaf = false;
      if (deselectedIds.size > 0) {
        const allRows = this.tb_projectWorker.getRows();
        for (const deselectedId of deselectedIds) {
          for (const row of allRows) {
            const rowData = row.getData();
            if (rowData.ID === deselectedId) {
              // Kiểm tra xem row có phải là node lá không (không có children)
              // Sử dụng cả getTreeChildren() và _children để đảm bảo chính xác
              let hasChildren = false;
              try {
                const treeChildren = row.getTreeChildren();
                hasChildren = treeChildren && treeChildren.length > 0;
              } catch (e) {
                // Fallback: kiểm tra _children trong data
                hasChildren = rowData._children && Array.isArray(rowData._children) && rowData._children.length > 0;
              }
              
              // Nếu không có children → là node lá đang bị bỏ chọn (có thể là 1.1.1, 1.2.1, etc.)
              if (!hasChildren) {
                isDeselectingLeaf = true;
                console.log(`Detected deselection of leaf node ID: ${rowData.ID}, TT: ${rowData.TT}`);
                break;
              }
            }
          }
          if (isDeselectingLeaf) break;
        }
      }

      // Tránh xử lý lại nếu đang trong quá trình toggle children (để tránh vòng lặp)
      // NHƯNG LUÔN cho phép bỏ chọn node lá độc lập (ở bất kỳ cấp nào: 1.1, 1.1.1, etc.)
      // Nếu đang bỏ chọn node lá, reset flag NGAY LẬP TỨC và tiếp tục xử lý
      if (isDeselectingLeaf) {
        // Đang bỏ chọn node lá → LUÔN cho phép, reset flag nếu cần
        if (this.isTogglingChildren) {
          console.log('Resetting isTogglingChildren because deselecting leaf node');
          this.isTogglingChildren = false;
        }
        // Tiếp tục xử lý bình thường (không return)
      } else if (this.isTogglingChildren) {
        // Đang toggle children và KHÔNG phải đang bỏ chọn node lá → return
        console.log('Blocked: isTogglingChildren = true and not deselecting leaf');
        return;
      }

      // Xử lý các row mới được chọn
      if (rows && rows.length > 0) {
        rows.forEach((row: any) => {
          const rowData = row.getData();
          const isSelected = row.isSelected();
          
          // Chỉ xử lý nếu row mới được chọn (không có trong previous)
          if (isSelected && !this.previousSelectedRows.has(rowData.ID)) {
            // Kiểm tra xem row có phải là parent không (có children)
            let hasChildren = false;
            try {
              const treeChildren = row.getTreeChildren();
              hasChildren = treeChildren && treeChildren.length > 0;
            } catch (e) {
              hasChildren = rowData._children && rowData._children.length > 0;
            }
            
            if (hasChildren) {
              console.log(`rowSelectionChanged - Selecting children of parent ID: ${rowData.ID}`);
              // Lưu lại ID của parent đang được toggle để chỉ block các event từ children của parent này
              const parentIdBeingToggled = rowData.ID;
              this.isTogglingChildren = true;
              this.toggleChildrenSelection(row, true);
              // Cập nhật previousSelectedRows ngay sau khi toggle children xong
              setTimeout(() => {
                this.isTogglingChildren = false;
                // Cập nhật previousSelectedRows với tất cả các node đã được chọn (bao gồm cả parent và children)
                const allRows = this.tb_projectWorker.getRows();
                const finalSelectedIds = new Set<number>();
                allRows.forEach((r: any) => {
                  if (r.isSelected()) {
                    const rData = r.getData();
                    finalSelectedIds.add(rData.ID);
                  }
                });
                this.previousSelectedRows = finalSelectedIds;
                console.log(`Updated previousSelectedRows (after toggle children): ${Array.from(finalSelectedIds).join(', ')}`);
              }, 200); // Tăng timeout lên 200ms để đảm bảo toggle xong
            }
          }
        });
      }

      // Xử lý các row đã bị bỏ chọn
      // CHỈ tự động bỏ chọn children khi bỏ chọn node CHA (có children)
      // KHÔNG tự động bỏ chọn khi bỏ chọn node CON (không có children)
      if (deselectedIds.size > 0) {
        const allRows = this.tb_projectWorker.getRows();
        deselectedIds.forEach((deselectedId: number) => {
          // Tìm row tương ứng với ID
          allRows.forEach((row: any) => {
            const rowData = row.getData();
            if (rowData.ID === deselectedId) {
              // Kiểm tra xem row có phải là parent không (có children)
              let hasChildren = false;
              try {
                const treeChildren = row.getTreeChildren();
                hasChildren = treeChildren && treeChildren.length > 0;
              } catch (e) {
                hasChildren = rowData._children && rowData._children.length > 0;
              }
              
              // CHỈ xử lý nếu là node CHA (có children)
              // Nếu là node CON (không có children) → cho phép bỏ chọn bình thường, không làm gì
              if (hasChildren) {
                console.log(`rowSelectionChanged - Deselecting children of parent ID: ${rowData.ID}`);
                this.isTogglingChildren = true;
                this.toggleChildrenSelection(row, false);
                // Cập nhật previousSelectedRows ngay sau khi toggle children xong
                setTimeout(() => {
                  this.isTogglingChildren = false;
                  // Cập nhật previousSelectedRows với tất cả các node đã được chọn (sau khi bỏ chọn children)
                  const allRows = this.tb_projectWorker.getRows();
                  const finalSelectedIds = new Set<number>();
                  allRows.forEach((r: any) => {
                    if (r.isSelected()) {
                      const rData = r.getData();
                      finalSelectedIds.add(rData.ID);
                    }
                  });
                  this.previousSelectedRows = finalSelectedIds;
                  console.log(`Updated previousSelectedRows (after deselect children): ${Array.from(finalSelectedIds).join(', ')}`);
                }, 200);
              } else {
                // Node con bị bỏ chọn → cho phép bỏ chọn bình thường, không làm gì
                console.log(`rowSelectionChanged - Deselecting child node ID: ${rowData.ID} (no children, allowing normal deselection)`);
              }
            }
          });
        });
      }

      // Cập nhật previousSelectedRows
      // QUAN TRỌNG: Cập nhật ngay lập tức để đảm bảo khi bỏ chọn nhiều node cùng lúc,
      // previousSelectedRows luôn phản ánh đúng trạng thái hiện tại
      // Điều này ngăn chặn việc logic tự động chọn lại các node cũ khi chọn node khác
      // LƯU Ý: Khi đang toggle children, previousSelectedRows sẽ được cập nhật trong setTimeout của toggleChildrenSelection
      // Nên ở đây chỉ cập nhật khi KHÔNG đang toggle children
      if (!this.isTogglingChildren || isDeselectingLeaf) {
        // Cập nhật ngay lập tức khi không đang toggle children hoặc đang bỏ chọn node lá
        const allRows = this.tb_projectWorker.getRows();
        const finalSelectedIds = new Set<number>();
        allRows.forEach((row: any) => {
          if (row.isSelected()) {
            const rowData = row.getData();
            finalSelectedIds.add(rowData.ID);
          }
        });
        this.previousSelectedRows = finalSelectedIds;
        console.log(`Updated previousSelectedRows (immediate): ${Array.from(finalSelectedIds).join(', ')}`);
      }
      // KHÔNG cập nhật ở đây nếu đang toggle children - sẽ được cập nhật trong setTimeout của toggleChildrenSelection
    });
  }
  //#endregion

  // Hàm đệ quy để chọn/bỏ chọn tất cả node con
  toggleChildrenSelection(parentRow: any, isSelected: boolean): void {
    try {
      const parentData = parentRow.getData();
      console.log(`Toggle children for parent ID: ${parentData.ID}, TT: ${parentData.TT}, isSelected: ${isSelected}`);
      
      // Sử dụng getTreeChildren() của Tabulator để lấy children
      let childRows: any[] = [];
      
      try {
        // Thử dùng getTreeChildren() - method chính thức của Tabulator
        childRows = parentRow.getTreeChildren();
        console.log(`Found ${childRows.length} children using getTreeChildren()`);
      } catch (e) {
        console.log('getTreeChildren() not available, using fallback method');
        // Fallback: nếu không có getTreeChildren(), dùng cách khác
        const parentID = parentData.ID;
        const allRows = this.tb_projectWorker.getRows();
        
        allRows.forEach((row: any) => {
          const rowData = row.getData();
          if (rowData.ParentID === parentID) {
            childRows.push(row);
          }
        });
        console.log(`Found ${childRows.length} children using fallback method`);
      }
      
      if (!childRows || childRows.length === 0) {
        console.log('No children found');
        return;
      }
      
      // Xử lý từng child
      childRows.forEach((childRow: any) => {
        const childData = childRow.getData();
        console.log(`Processing child ID: ${childData.ID}, TT: ${childData.TT}`);
        
        // Chọn hoặc bỏ chọn node con
        if (isSelected) {
          childRow.select();
          console.log(`Selected child ID: ${childData.ID}`);
        } else {
          childRow.deselect();
          console.log(`Deselected child ID: ${childData.ID}`);
        }
        
        // Đệ quy: kiểm tra xem node con có con không
        let hasGrandChildren = false;
        try {
          const grandChildren = childRow.getTreeChildren();
          hasGrandChildren = grandChildren && grandChildren.length > 0;
        } catch (e) {
          hasGrandChildren = childData._children && childData._children.length > 0;
        }
        
        if (hasGrandChildren) {
          console.log(`Child ID: ${childData.ID} has children, recursing...`);
          this.toggleChildrenSelection(childRow, isSelected);
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

  // Mở modal thêm/sửa nhân công
  openProjectWorkerDetail(isEdit: boolean): void {
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

    if (selectedVersionID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phiên bản giải pháp hoặc PO');
      return;
    }

    let workerData: any = null;
    let workerID: number = 0;

    // Nếu là edit mode, lấy dữ liệu từ row đã chọn
    if (isEdit) {
      const selectedRows = this.tb_projectWorker?.getSelectedData();
      if (!selectedRows || selectedRows.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn nhân công cần sửa');
        return;
      }

      const selectedRow = selectedRows[0];
      workerID = selectedRow.ID || 0;

      // Kiểm tra node có con không (chỉ cho sửa node lá)
      if (selectedRow._children && selectedRow._children.length > 0) {
        this.notification.warning('Thông báo', 'Chỉ được sửa nhân công ở node lá (không có con)');
        return;
      }

      // Kiểm tra đã duyệt TBP chưa
      if (selectedRow.IsApprovedTBP) {
        this.notification.warning('Thông báo', `Nhân công TT[${selectedRow.TT}] đã được TBP duyệt! Vui lòng chọn lại.`);
        return;
      }

      workerData = selectedRow;
    }

    // Lấy danh sách parent từ tree data (chỉ lấy các node cha, không phải node lá)
    const parentList = this.getParentListFromTree(this.treeWorkerData);

    // Mở modal
    const modalRef = this.ngbModal.open(ProjectWorkerDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    // Set các Input properties
    modalRef.componentInstance.projectID = this.projectId;
    modalRef.componentInstance.ProjectWorkerVersionID = selectedVersionID;
    modalRef.componentInstance.ID = workerID;
    modalRef.componentInstance.workerData = workerData;
    modalRef.componentInstance.parentList = parentList;

    // Xử lý kết quả từ modal
    modalRef.result
      .then((result: any) => {
        if (result && result.success) {
          this.loadDataProjectPartList();
          this.notification.success('Thành công', isEdit ? 'Sửa nhân công thành công!' : 'Thêm nhân công thành công!');
        }
      })
      .catch((error: any) => {
        console.error('Error in project worker detail modal:', error);
      });
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
  deleteProjectWorker(): void {
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân công cần xóa');
      return;
    }

    // Kiểm tra xem có nhân công nào đã được duyệt TBP không
    const approvedWorkers = selectedRows.filter((row: any) => row.IsApprovedTBP);
    if (approvedWorkers.length > 0) {
      const approvedTTs = approvedWorkers.map((w: any) => w.TT).join(', ');
      this.notification.warning('Thông báo', `Không thể xóa nhân công đã được TBP duyệt: TT[${approvedTTs}]`);
      return;
    }

    // Tạo danh sách TT để hiển thị trong thông báo
    const ttList = selectedRows.map((row: any) => row.TT).join(', ');
    const message = selectedRows.length === 1 
      ? `Bạn có chắc chắn muốn xóa nhân công TT[${ttList}] không? Thao tác này sẽ xóa tất cả các nhân công con của nhân công này!`
      : `Bạn có chắc chắn muốn xóa ${selectedRows.length} nhân công (TT: ${ttList}) không? Thao tác này sẽ xóa tất cả các nhân công con của các nhân công này!`;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteProjectWorkerConfirm(selectedRows),
      nzCancelText: 'Hủy',
    });
  }
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

  //#region đóng/mở panel bên trái
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%'; // Mở rộng panel vật tư lên 100%
  }

  toggleLeftPanel(): void {
    if (this.sizeLeftPanel === '0') {
      this.sizeLeftPanel = '25%';
      this.sizeRightPanel = '75%';
    } else {
      this.sizeLeftPanel = '0';
      this.sizeRightPanel = '100%';
    }
  }
  //#endregion
}
