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
import { CommonModule } from '@angular/common';import { ImportExcelProjectWorkerComponent } from '../import-excel-project-worker/import-excel-project-worker.component';
;
import { ProjectPartListService } from './project-partlist-service/project-part-list-service.service';
import { left } from '@popperjs/core';
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
    private cdr: ChangeDetectorRef
  ) {}
  sizeSearch: string = '22%';
  @ViewChild('tb_solution', { static: false })
  tb_solutionContainer!: ElementRef;
  @ViewChild('tb_projectPartListVersion', { static: false })
  tb_projectPartListVersionContainer!: ElementRef;
  @ViewChild('tb_projectPartListVersionPO', { static: false })
  tb_projectPartListVersionPOContainer!: ElementRef;
  @ViewChild('tb_projectWorker', { static: false })
  tb_projectWorkerContainer!: ElementRef;
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

  //selected data
  selectedData: any[] = [];



  ngOnInit(): void {
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    this.loadDataSolution();
    this.loadDataProjectPartListVersion();
    this.loadDataProjectPartListVersionPO();
    this.loadDataProjectWorker();
  }
  ngAfterViewInit(): void {
    this.drawTbSolution();
    this.drawTbProjectPartListVersion();
    this.drawTbProjectPartListVersionPO();
    this.drawTbProjectWorker();
  }
  loadDataSolution(): void {
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataSolution', response.data);
          this.dataSolution = response.data || [];
          if (this.dataSolution && this.dataSolution.length > 0) {
            this.projectSolutionId = this.dataSolution[0].ID;
            this.tb_solution.setData(this.dataSolution);
            this.loadDataProjectPartListVersion();
            this.loadDataProjectPartListVersionPO();
          } else {
            this.dataSolution = [];
            this.tb_solution.setData([]);
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
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, false).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            console.log('dataSolutionVersion', response.data);
            this.dataSolutionVersion = response.data;
            this.tb_projectPartListVersion.setData(this.dataSolutionVersion);
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
    this.loadDataProjectWorker();
  }

  loadDataProjectPartListVersionPO(): void {
    this.projectPartListService.getProjectPartListVersion(this.projectSolutionId, true).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataPOVersion', response.data);
          this.dataPOVersion = response.data;
          this.tb_projectPartListVersionPO.setData(this.dataPOVersion);
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
    });
  }
  //#region load dữ liệu nhân công
  loadDataProjectWorker(): void {
    // Lấy versionID từ bảng đã chọn
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      // Giải pháp
      this.selectedData = this.tb_projectPartListVersion?.getSelectedData();
      if (this.selectedData && this.selectedData.length > 0) {
        selectedVersionID = this.selectedData[0].ID || 0;
      }
    } else if (this.type === 2) {
      // PO
      this.selectedData = this.tb_projectPartListVersionPO?.getSelectedData();
      if (this.selectedData && this.selectedData.length > 0) {
        selectedVersionID = this.selectedData[0].ID || 0;
      }
    }
    const payload = {
     ProjectID: this.projectId || 0,
      PartlistTypeID:  7,
      IsDeleted: false, 
     Keywords: this.keyword || '',
      IsApprovedTBP:-1 ,
    IsApprovedPurchase:-1,
    // ProjectPartListVersionID:selectedVersionID || 0
     ProjectPartListVersionID:1384
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
  //#region cập nhật trạng thái duyệt
  updateApprove(action: number): void {
    debugger;
    console.log('updateApprove', action);
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vật tư cần ' + (action === 1 ? 'duyệt' : 'hủy duyệt'));
      return;
    }
    else {
      let checkDeleted =0;
      let checkiApprovedPurchase =0;
      for(let row of selectedRows) {
        if(row.IsDeleted == true) {
          checkDeleted ++
        }
        if(row.IsApprovedPurchase == true) {
          checkiApprovedPurchase ++
        }
      }
      if(checkDeleted > 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn các vật tư chưa bị xóa để '+ (action === 1 ? 'duyệt' : 'hủy duyệt'));
        return;
      }
      if(checkiApprovedPurchase > 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn các vật tư chưa được duyệt yêu cầu mua để '+ (action === 1 ? 'duyệt' : 'hủy duyệt'));
        return;
      }
    }
    var projectPartListVersionID = 0;
    if(this.type == 1) {
      const selectedRows = this.tb_projectPartListVersion?.getSelectedData();
      projectPartListVersionID = selectedRows[0]['ID'] || 0;
      if (selectedRows[0]['IsActive'] == false) {
        this.notification.warning('Thông báo', 'Vui lòng chọn sử dụng phiên bản '+selectedRows[0].Code +' để cập nhật');
        return;
      }
    } else {
      const selectedRows = this.tb_projectPartListVersionPO?.getSelectedData();
      projectPartListVersionID = selectedRows[0]['ID'] || 0;
      if (selectedRows[0]['IsActive']  == false) {
        this.notification.warning('Thông báo', 'Vui lòng chọn sử dụng phiên bản PO '+selectedRows[0].Code +' để cập nhật');
        return;
      }
    }
    const payload = selectedRows.map((row: any) => ({
      ID: row.ID,
      TT:row.TT,
      ProjectTypeID:row.ProjectTypeID,
      IsApprovedTBP: action === 1 ? true : false,
      ProjectPartListVersionID: projectPartListVersionID
    }));
    console.log('payload', payload);
    this.projectPartListService.saveProjectPartList(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thành công', 'Cập nhật trạng thái thành công!');
          this.loadDataProjectWorker();
        }
      },
      error: (error: any) => {
        console.error('Error updating approve:', error);
        this.notification.error('Lỗi', 'Không thể cập nhật trạng thái duyệt');
      }
    });
  }
  //#endregion
  //#region open modal import excel nhân công
  openImportExcelProjectWorker(): void {
    const modalRef = this.ngbModal.open(ImportExcelProjectWorkerComponent, {
      centered: true,
      size: 'xl',
      keyboard: false,
    });
    modalRef.componentInstance.projectId = this.projectId;
    modalRef.componentInstance.projectCodex = this.projectCodex;
    modalRef.componentInstance.tb_projectWorker = this.tb_projectWorker;
    modalRef.componentInstance.tb_projectPartListVersion = this.tb_projectPartListVersion;
    modalRef.componentInstance.tb_projectPartListVersionPO = this.tb_projectPartListVersionPO;
    modalRef.componentInstance.dataProjectWorker = this.dataProjectWorker;
    modalRef.componentInstance.dataSolution = this.dataSolution;
    modalRef.componentInstance.dataSolutionVersion = this.dataSolutionVersion;
    modalRef.componentInstance.dataPOVersion = this.dataPOVersion;
    
    modalRef.result.then((result: any) => {
      if (result.success) {
        this.loadDataProjectWorker();
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
        modalRef.componentInstance.STT = row.STT;
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
    if (!this.tb_projectWorker) return;
  
    if (this.type == 1) {
      this.tb_projectWorker.hideColumn("IsApprovedTBP");
    } else {
      this.tb_projectWorker.showColumn("IsApprovedTBP");
    }
  }
  applyDeletedRowStyle(): void {
    if (!this.tb_projectWorker) return;
  
    const rows = this.tb_projectWorker.getRows();
    rows.forEach((row: any) => {
      const data = row.getData();
      const el = row.getElement();
      if (el) { // Kiểm tra element tồn tại
        if (data['IsDeleted'] === true) {
          el.style.backgroundColor = 'red';
          el.style.color = 'white';
        } else {
          el.style.backgroundColor = '';
          el.style.color = '';
        }
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
            return value === 1
              ? '<i class="fa fa-check text-success"></i>'
              : '<i class="fa fa-times text-danger"></i>';
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
            return value === true
              ? '<i class="fa fa-check text-success"></i>'
              : '<i class="fa fa-times text-danger"></i>';
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
              return value === true
                ? '<i class="fa fa-check text-success" title="Đang sử dụng"></i>'
                : '<i class="fa fa-times text-danger" title="Không sử dụng"></i>';
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
      this.type = 1; // Giải pháp
      const selectedRows = this.tb_projectPartListVersionPO.getSelectedRows();
      selectedRows.forEach((selectedRow: any) => {
        selectedRow.deselect();
      });
      this.toggleTBPColumn();
      this.loadDataProjectWorker();
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
              return value === true
                ? '<i class="fa fa-check text-success" title="Đang sử dụng"></i>'
                : '<i class="fa fa-times text-danger" title="Không sử dụng"></i>';
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
          // {
          //   title: 'Người duyệt',
          //   field: 'UpdatedBy',
          //   hozAlign: 'center',
          //   headerHozAlign: 'center',
          //   width: 110,
          // },
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
      // Bỏ chọn tất cả các dòng đã chọn trong bảng solutionVersion
      const selectedRows = this.tb_projectPartListVersion.getSelectedRows();
      selectedRows.forEach((selectedRow: any) => {
        selectedRow.deselect();
      });
      console.log('type', this.type);
      this.toggleTBPColumn();
      this.loadDataProjectWorker();
    });
  }

  drawTbProjectWorker(): void {
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
        pagination: false,
        layout: 'fitDataStretch',
        selectableRows: true,
        height: '100%',
        maxHeight: '100%',
        rowFormatter: (row: any) => {
          const data = row.getData();
          const el = row.getElement();
          if (data['IsDeleted'] ===true) {
            el.style.backgroundColor = 'red';
            el.style.color = 'white';
          } else {
            el.style.backgroundColor = '';
            el.style.color = '';
          }
        },
        columns: [
          {
            title: 'ID',
            field: 'ID',
            visible: false,
          },
          {
            title: 'Vật tư dự án - ' + this.projectCodex + ' - ' + (this.type === 1 ? 'Giải pháp - ' : 'PO - ') + this.selectedData[0]?.ProjectTypeName + ' - ' + this.selectedData[0]?.Code,
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
              { title: 'ID', field: 'ID', visible: false },
              { title: 'ProjectPartListVersionID', field: 'ProjectPartListVersionID', visible: false },
              { title: 'IsDeleted', field: 'IsDeleted', visible: false },
  
              // === DANH MỤC VẬT TƯ ===
              { title: 'TT', field: 'TT', hozAlign: 'center' },
              { title: 'Tên vật tư', field: 'GroupMaterial', formatter: 'textarea' },
              { title: 'Mã thiết bị', field: 'Model' },
              { title: 'Số lượng / 1 máy', field: 'QtyMin', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},
              { title: 'Số lượng tổng', field: 'QtyFull', hozAlign: 'right', formatter: (cell: any) => {
                const value = cell.getValue();
                return value != null && value !== '' ? parseFloat(value).toFixed(1) : '';
              }},
            ]
          },
          {
            title: '',
            headerHozAlign: 'center',
            hozAlign: 'center',
            columns: [
              {
                title: 'Tích xanh',
                field: 'IsNewCode',
                hozAlign: 'center',
                formatter: (cell) => cell.getValue() ? '<i class="fa fa-check-circle text-success"></i>' : ''
              },
              { title: 'Mã đặc biệt', field: 'SpecialCode' },
              { title: 'Hãng SX', field: 'Manufacturer' },
              { title: 'Đơn vị', field: 'Unit', hozAlign: 'center' },
              {
                title: 'TBP duyệt',
                field: 'IsApprovedTBPText',  // Sửa: dùng text thay vì boolean
                hozAlign: 'center',
                formatter: (cell) => cell.getValue() === 'Đã duyệt'
                  ? '<i class="fa fa-check text-success" title="Đã duyệt"></i>'
                  : '<i class="fa fa-times text-secondary" title="Chưa duyệt"></i>'
              },
              {
                title: 'Hàng mới',
                headerHozAlign: 'center',
                hozAlign: 'center',
                field: 'IsNewCode1',  // Sửa: dùng IsNewCode1
                formatter: (cell) => cell.getValue() === 'Đã duyệt'
                ? '<i class="fa fa-check text-success" title="Đã duyệt"></i>'
                : '<i class="fa fa-times text-secondary" title="Chưa duyệt"></i>'
              },
              {
                title: 'TBP duyệt sản phẩm mới',
                field: 'IsApprovedTBPNewCode',  // Sửa: dùng field đúng
                hozAlign: 'center',
                formatter: (cell) => cell.getValue()
                  ? '<i class="fa fa-check text-success" title="Đã duyệt"></i>'
                  : '<i class="fa fa-times text-secondary" title="Chưa duyệt"></i>'
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
              { title: 'Loại tiền', field: 'UnitMoney', headerHozAlign: 'center' },
              { title: 'Chất lượng', field: 'Quality', headerHozAlign: 'center' },
              { title: 'Người tạo', field: 'FullNameCreated', headerHozAlign: 'center' },
              { title: 'Ngày tạo', field: 'CreatedDate', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },
              { title: 'Note', field: 'Note', formatter: 'textarea' },
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
                formatter: 'tickCross',
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
                formatter: (cell) => cell.getValue() === 'Đã '
                ? '<i class="fa fa-check text-success" title="Đã dduyệtuyệt"></i>'
                : '<i class="fa fa-times text-secondary" title="Chưa duyệt"></i>'
              },
              { title: 'Người yêu cầu mua', field: 'FullNameRequestPurchase', hozAlign: 'left' },  // Sửa: dùng FullNameRequestPurchase
              { title: 'Tình trạng', field: 'StatusText', hozAlign: 'center' },  // Sửa: không có StatusPurchaseRequestText
              { title: 'NV mua hàng', field: 'FullNamePurchase', hozAlign: 'left' },  // Sửa: dùng FullNamePurchase
              { title: 'Deadline mua hàng', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa: không có DeadlinePurchaseRequest
              { title: 'Ngày yêu cầu đặt hàng', field: 'RequestDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày bắt đầu đặt hàng', field: 'OrderDate', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày dự kiến đặt hàng', field: 'ExpectedDatePurchase', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              { title: 'Ngày dự kiến hàng về', field: 'ExpectedReturnDate1', hozAlign: 'center', formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
              }, },  // Sửa
              {
                title: 'Mã đặt hàng',
                field: 'OrderCode', hozAlign: 'left'  // Sửa
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
                field: 'TotalPricePurchaseExport',  // Sửa: dùng TotalPricePurchaseExport
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
              { title: 'SL đã về', field: 'QtyReturned', hozAlign: 'right', formatter: (cell: any) => {
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
    }, 50); // Đảm bảo DOM đã render xong
  });

    // Thêm logic: khi chọn nút cha, tự động chọn tất cả nút con
    // Xử lý cả chọn và bỏ chọn
    this.tb_projectWorker.on('rowSelectionChanged', (data: any[], rows: any[]) => {
      // Tránh xử lý lại nếu đang trong quá trình toggle children (để tránh vòng lặp)
      if (this.isTogglingChildren) {
        return;
      }

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
              this.isTogglingChildren = true;
              this.toggleChildrenSelection(row, true);
              setTimeout(() => {
                this.isTogglingChildren = false;
              }, 100);
            }
          }
        });
      }

      // Xử lý các row đã bị bỏ chọn
      if (deselectedIds.size > 0) {
        const allRows = this.tb_projectWorker.getRows();
        deselectedIds.forEach((parentId: number) => {
          // Tìm row tương ứng với ID
          allRows.forEach((row: any) => {
            const rowData = row.getData();
            if (rowData.ID === parentId) {
              // Kiểm tra xem row có phải là parent không (có children)
              let hasChildren = false;
              try {
                const treeChildren = row.getTreeChildren();
                hasChildren = treeChildren && treeChildren.length > 0;
              } catch (e) {
                hasChildren = rowData._children && rowData._children.length > 0;
              }
              
              if (hasChildren) {
                console.log(`rowSelectionChanged - Deselecting children of parent ID: ${rowData.ID}`);
                this.isTogglingChildren = true;
                this.toggleChildrenSelection(row, false);
                setTimeout(() => {
                  this.isTogglingChildren = false;
                }, 100);
              }
            }
          });
        });
      }

      // Cập nhật previousSelectedRows (chỉ khi không đang toggle children)
      // Lưu ý: Khi toggle children, các children sẽ được chọn/bỏ chọn và trigger lại event này
      // Nhưng vì isTogglingChildren = true nên sẽ return sớm, không cập nhật previousSelectedRows
      // Chỉ cập nhật khi đã xử lý xong
      setTimeout(() => {
        if (!this.isTogglingChildren) {
          // Lấy lại danh sách selected rows hiện tại để cập nhật
          const allRows = this.tb_projectWorker.getRows();
          const finalSelectedIds = new Set<number>();
          allRows.forEach((row: any) => {
            if (row.isSelected()) {
              const rowData = row.getData();
              finalSelectedIds.add(rowData.ID);
            }
          });
          this.previousSelectedRows = finalSelectedIds;
        }
      }, 150); // Đợi sau khi toggle children xong
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
  calculateWorkerTree(data: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];
  
    // Clone và thêm _children
    data.forEach(item => {
      const node = { ...item, _children: [] };
      map.set(node.ID, node);
    });
  
    // Xây dựng cây
    data.forEach(item => {
      const node = map.get(item.ID)!;
      if (item.ParentID && item.ParentID !== 0) {
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        } else {
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });
  
    // Hàm thu thập tất cả node theo thứ tự từ dưới lên (post-order traversal)
    const getAllNodesBottomUp = (nodes: any[]): any[] => {
      const result: any[] = [];
      
      const traverse = (node: any): void => {
        // Duyệt các con trước
        if (node._children && node._children.length > 0) {
          node._children.forEach((child: any) => traverse(child));
        }
        // Sau đó thêm node vào kết quả (từ dưới lên)
        result.push(node);
      };
      
      nodes.forEach(root => traverse(root));
      return result;
    };
  
    // Lấy tất cả node theo thứ tự từ dưới lên
    const allNodes = getAllNodesBottomUp(tree);
  
    // Duyệt từ cuối về đầu (từ dưới lên) - giống WinForm: for (int i = lst.Count - 1; i >= 0; i--)
    for (let i = allNodes.length - 1; i >= 0; i--) {
      const node = allNodes[i];
      
      // Chỉ xử lý node có children (node cha)
      if (!node._children || node._children.length === 0) {
        continue;
      }
  
      // Set giá trị cho node cha
      node.IsNewCode = false;
      node.IsApprovedTBPNewCode = false;
  
      // Khởi tạo tổng
      let totalAmount = 0;
      let totalAmountQuote = 0;
      let totalAmountPurchase = 0;
      let totalPriceExchangePurchase = 0;
      let totalPriceExchangeQuote = 0;
  
      // Tính tổng từ các children
      node._children.forEach((child: any) => {
        totalAmount += Number(child.Amount) || 0;
        totalAmountQuote += Number(child.TotalPriceQuote1) || 0;
        totalAmountPurchase += Number(child.TotalPricePurchaseExport) || 0;
        totalPriceExchangePurchase += Number(child.TotalPriceExchangePurchase) || 0;
        totalPriceExchangeQuote += Number(child.TotalPriceExchangeQuote) || 0;
      });
  
      // Set Price = 0 cho node cha nếu có children
      if (node._children.length > 0) {
        node.Price = 0;
      }
  
      // Gán tổng vào node cha
      node.Amount = totalAmount;
      node.TotalPriceQuote1 = totalAmountQuote;
      node.TotalPricePurchaseExport = totalAmountPurchase;
      node.TotalPriceExchangePurchase = totalPriceExchangePurchase;
      node.TotalPriceExchangeQuote = totalPriceExchangeQuote;
    }
  
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
          this.loadDataProjectWorker();
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
          this.loadDataProjectWorker(); // Reload lại dữ liệu
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
}
