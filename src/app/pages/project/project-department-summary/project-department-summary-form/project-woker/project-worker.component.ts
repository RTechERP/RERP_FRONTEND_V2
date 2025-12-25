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
import { ProjectWorkerService } from './project-worker-service/project-worker.service';
import { ProjectSolutionVersionDetailComponent } from '../project-solution-version-detail/project-solution-version-detail.component';
import { ProjectSolutionDetailComponent } from '../project-solution-detail/project-solution-detail.component';
import { ProjectWorkerDetailComponent } from '../project-worker-detail/project-worker-detail.component';
import { max } from 'rxjs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { CommonModule } from '@angular/common';
import { ImportExcelProjectWorkerComponent } from '../import-excel-project-worker/import-excel-project-worker.component';
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
  templateUrl: './project-worker.component.html',
  styleUrl: './project-worker.component.css',
})
export class ProjectWorkerComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCodex: string = '';
  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private cdr: ChangeDetectorRef
  ) {}

    // Biến lưu dòng đang được focus (click)
    private lastClickedWorkerRow: any = null;

    sizeLeftPanel: string = ''; // Khởi tạo rỗng
    sizeRightPanel: string = ''; // Khởi tạo rỗng
  @ViewChild('tb_solution', { static: false })
  tb_solutionContainer!: ElementRef;
  @ViewChild('tb_solutionVersion', { static: false })
  tb_solutionVersionContainer!: ElementRef;
  @ViewChild('tb_POVersion', { static: false })
  tb_POVersionContainer!: ElementRef;
  @ViewChild('tb_projectWorker', { static: false })
  tb_projectWorkerContainer!: ElementRef;
  tb_solution: any;
  tb_solutionVersion: any;
  tb_POVersion: any;
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
  isLoading: boolean = false; // Loading state cho toàn bộ component
  private loadingCounter: number = 0; // Counter để track số lượng request đang chạy
  private loadingTimeout: any = null; // Timeout để đảm bảo loading không bị kẹt

  ngOnInit(): void {
    this.isDeleted = 0;
    this.isApprovedTBP = -1;
    // KHÔNG gọi loadDataSolution() ở đây vì bảng chưa được khởi tạo
    // Sẽ gọi sau khi drawTbSolution() hoàn thành trong ngAfterViewInit()
  }
  ngAfterViewInit(): void {
    // Khởi tạo các bảng trước
    this.drawTbSolution();
    this.drawTbSolutionVersion();
    this.drawTbPOVersion();
    this.drawTbProjectWorker();
    
    // Sau khi các bảng đã được khởi tạo, mới load dữ liệu
    // Sử dụng setTimeout để đảm bảo DOM đã render xong
    setTimeout(() => {
      this.loadDataSolution();
    }, 0);
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
            // Đảm bảo bảng đã được khởi tạo trước khi setData
            if (this.tb_solution) {
              this.tb_solution.setData(this.dataSolution);
            }
            // KHÔNG tự động load phiên bản - chờ user click vào giải pháp
            // Clear các bảng phụ thuộc
            this.clearVersionTables();
            this.clearWorkerTable();
            this.projectSolutionId = 0;
          } else {
            this.dataSolution = [];
            // Đảm bảo bảng đã được khởi tạo trước khi setData
            if (this.tb_solution) {
              this.tb_solution.setData([]);
            }
            this.projectSolutionId = 0;
            // Clear các bảng phụ thuộc
            this.clearVersionTables();
            this.clearWorkerTable();
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
        this.stopLoading();
      },
      error: (error: any) => {
        console.error('Error loading solution:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu giải pháp');
        this.stopLoading();
      },
    });
  }

  // Clear bảng phiên bản giải pháp và PO
  clearVersionTables(): void {
    this.dataSolutionVersion = [];
    this.dataPOVersion = [];
    if (this.tb_solutionVersion) {
      this.tb_solutionVersion.setData([]);
    }
    if (this.tb_POVersion) {
      this.tb_POVersion.setData([]);
    }
    this.versionID = 0;
    this.type = 0;
  }

  // Clear bảng nhân công
  clearWorkerTable(): void {
    this.dataProjectWorker = [];
    this.treeWorkerData = [];
    if (this.tb_projectWorker) {
      this.tb_projectWorker.setData([]);
    }
  }
  loadDataSolutionVersion(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_solutionVersion) {
      console.warn('tb_solutionVersion chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataSolutionVersion(), 100);
      return;
    }

    this.startLoading();
    this.projectWorkerService
      .getSolutionVersion(this.projectSolutionId)
      .subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            console.log('dataSolutionVersion', response.data);
            this.dataSolutionVersion = response.data;
            // Đảm bảo bảng đã được khởi tạo trước khi setData
            if (this.tb_solutionVersion) {
              this.tb_solutionVersion.setData(this.dataSolutionVersion);
            }
          } else {
            this.notification.error('Lỗi', response.message);
          }
          this.stopLoading();
        },
        error: (error: any) => {
          console.error('Error loading solution version:', error);
          this.notification.error('Lỗi', error.message);
          this.stopLoading();
        }
      });
  }
  searchDataProjectWorker(): void {
    this.loadDataProjectWorker();
  }

  loadDataPOVersion(): void {
    // Kiểm tra bảng đã được khởi tạo chưa
    if (!this.tb_POVersion) {
      console.warn('tb_POVersion chưa được khởi tạo, đợi khởi tạo xong...');
      setTimeout(() => this.loadDataPOVersion(), 100);
      return;
    }

    this.startLoading();
    this.projectWorkerService.getPOVersion(this.projectSolutionId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log('dataPOVersion', response.data);
          this.dataPOVersion = response.data;
          // Đảm bảo bảng đã được khởi tạo trước khi setData
          if (this.tb_POVersion) {
            this.tb_POVersion.setData(this.dataPOVersion);
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
  //#region load dữ liệu nhân công
  loadDataProjectWorker(): void {
    // Lấy versionID từ bảng đã chọn
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      // Giải pháp
      const selectedData = this.tb_solutionVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    } else if (this.type === 2) {
      // PO
      const selectedData = this.tb_POVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    }
    const payload = 
    {  
      projectID: this.projectId || 0,
      projectWorkerTypeID: this.projectworkertypeID || 0,
      IsApprovedTBP: this.isApprovedTBP || -1,
      IsDeleted: this.isDeleted || 0,
      KeyWord: this.keyword || '',
      versionID: selectedVersionID || 0,
  };
    // "projectID": 0,
    // "projectWorkerTypeID": 0,
    // "IsApprovedTBP": true,
    // "IsDeleted": true,
    // "KeyWord": "string",
    // "versionID": 0
    console.log('payload', payload);
    this.startLoading();
    this.projectWorkerService.getProjectWorker(payload).subscribe({
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
        this.notification.error('Lỗi', 'Không thể tải dữ liệu nhân công');
        this.stopLoading();
      },
    });
  }
  //#endregion
  //#region cập nhật trạng thái duyệt
  updateApprove(action: number): void {
    console.log('updateApprove', action);
    const selectedRows = this.tb_projectWorker?.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn nhân công cần cập nhật'
      );
      return;
    }
    console.log('selectedRows', selectedRows);
    if (this.type == 1) {
      const selectedRows = this.tb_solutionVersion?.getSelectedData();
      if (selectedRows[0].IsActive == false) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn sử dụng phiên bản ' +
            selectedRows[0].Code +
            ' để cập nhật'
        );
        return;
      }
    } else {
      const selectedRows = this.tb_POVersion?.getSelectedData();
      if (selectedRows[0].IsActive == false) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn sử dụng phiên bản PO ' +
            selectedRows[0].Code +
            ' để cập nhật'
        );
        return;
      }
    }
    const payload = selectedRows.map((row: any) => ({
      ID: row.ID,
      IsApprovedTBP: action === 1 ? true : false,
    }));
    console.log('payload', payload);
    this.projectWorkerService.saveWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thành công',
            'Cập nhật trạng thái thành công!'
          );
          this.loadDataProjectWorker();
        }
      },
      error: (error: any) => {
        console.error('Error updating approve:', error);
        this.notification.error('Lỗi', 'Không thể cập nhật trạng thái duyệt');
      },
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
    modalRef.componentInstance.tb_solutionVersion = this.tb_solutionVersion;
    modalRef.componentInstance.tb_POVersion = this.tb_POVersion;
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
  onExportExcel() {
    if (!this.tb_projectWorker) return;
  
    const treeData = this.tb_projectWorker.getData('tree');
    if (!treeData || treeData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
  
    const allColumns = this.tb_projectWorker.getColumns();
    const visibleColumns = allColumns.filter((col: any, index: number) => {
      if (index === 0) return false;
      const colDef = col.getDefinition();
      return colDef.visible !== false;
    });
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nhân công');
  
    // === HEADER ===
    const headerRow = worksheet.addRow(
      visibleColumns.map((col:any) => col.getDefinition().title)
    );
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
    // === Hàm thêm node (đệ quy) ===
    const addNodeToSheet = (node: any, level: number = 0) => {
      // Tạo row mới và lấy reference
      const row = worksheet.addRow([]); // Truyền mảng rỗng để tránh lỗi
  
      visibleColumns.forEach((col:any, idx:any) => {
        const field = col.getField();
        let value = node[field] ?? '';
  
        const cell = row.getCell(idx + 1);
  
        // 1. Thụt lề cột TT
        if (field === 'TT' && level > 0) {
          value = '  '.repeat(level * 2)  + value;
        }
  
        // 2. Xử lý ngày
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
          cell.numFmt = 'dd/mm/yyyy';
        }
  
        // 3. Cột số: 1.0, 2.0, 1000.0
        const numberFields = ['AmountPeople', 'NumberOfDay', 'TotalWorkforce', 'Price', 'TotalPrice'];
        if (numberFields.includes(field)) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
            cell.numFmt = '0.0'; // 1.0, 2.0
            cell.alignment = { horizontal: 'right' };
          } else {
            value = '';
          }
        }
  
        // 4. Thành tiền: định dạng có dấu chấm
        if (field === 'TotalPrice') {
          cell.numFmt = '#,##0'; // 1.000, 5.000.000
        }
  
        cell.value = value;
      });
  
      // Thêm con
      if (node._children && node._children.length > 0) {
        node._children.forEach((child: any) => addNodeToSheet(child, level + 1));
      }
    };
  
    // === Duyệt root ===
    treeData.forEach((root: any) => addNodeToSheet(root));
  
    // === Tự động width ===
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, val.length + 3);
      });
      column.width = Math.min(maxLength, 50);
    });
  
    // === Auto filter ===
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };
  
    // === Xuất file ===
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `NhanCongDuAn_${this.projectCodex}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }
  //#endregion
  //#region export excel phiên bản giải pháp
  onExportExcelSolutionVersion(): void {
    if (!this.tb_solutionVersion) return;
    const data = this.tb_solutionVersion.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(
      this.tb_solutionVersion,
      data,
      'Phiên bản giải pháp',
      'PhienBanGiaiPhapDuAn_' + this.projectCodex
    );
  }
  //#endregion
  //#region export excel phiên bản PO
  onExportExcelPOVersion(): void {
    if (!this.tb_POVersion) return;
    const data = this.tb_POVersion.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    this.projectService.exportExcel(
      this.tb_POVersion,
      data,
      'Phiên bản PO',
      'PhienBanPODuAn_' + this.projectCodex
    );
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
        const data = this.tb_solutionVersion.getSelectedData();
        if (data.length <= 0) {
          this.notification.warning(
            'Thông báo',
            'Vui lòng chọn 1 phiên bản giải pháp'
          );
          return;
        }
      } else {
        const data = this.tb_POVersion.getSelectedData();
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

    //#region Tính STT lớn nhất + 1
    let maxSTT = 0;
    if (typenumber === 1) {
      // Lấy STT lớn nhất từ dataSolutionVersion
      if (this.dataSolutionVersion && this.dataSolutionVersion.length > 0) {
        const sttValues = this.dataSolutionVersion
          .map((item: any) => item.STT)
          .filter(
            (stt: any) => stt != null && stt !== undefined && !isNaN(stt)
          );
        if (sttValues.length > 0) {
          maxSTT = Math.max(...sttValues);
        }
      }
    } else {
      // Lấy STT lớn nhất từ dataPOVersion
      if (this.dataPOVersion && this.dataPOVersion.length > 0) {
        const sttValues = this.dataPOVersion
          .map((item: any) => item.STT)
          .filter(
            (stt: any) => stt != null && stt !== undefined && !isNaN(stt)
          );
        if (sttValues.length > 0) {
          maxSTT = Math.max(...sttValues);
        }
      }
    }
    // STT mới = STT lớn nhất + 1, ít nhất là 1
    const nextSTT = Math.max(1, maxSTT + 1);
    //#endregion

    // Mở modal sau khi đã kiểm tra tất cả điều kiện
    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.ProjectID = this.projectId;
    modalRef.componentInstance.typeNumber = typenumber;
    modalRef.componentInstance.isEdit = isEdit;

    //#region Set giá trị cho modal
    if (isEdit === true) {
      if (typenumber === 1) {
        const data = this.tb_solutionVersion.getSelectedData();
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
        const data = this.tb_POVersion.getSelectedData();
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
        this.loadDataSolutionVersion();
        this.loadDataPOVersion();
      }
    });
  }
  //#region format row cho bảng nhân công
  toggleTBPColumn(): void {
    if (!this.tb_projectWorker) return;

    if (this.type == 1) {
      this.tb_projectWorker.hideColumn('IsApprovedTBP');
    } else {
      this.tb_projectWorker.showColumn('IsApprovedTBP');
    }
  }
  applyDeletedRowStyle(): void {
    if (!this.tb_projectWorker) return;

    const rows = this.tb_projectWorker.getRows();
    rows.forEach((row: any) => {
      const data = row.getData();
      const el = row.getElement();
      // if (el) {
      //   // Kiểm tra element tồn tại
      //   if (data['IsDeleted'] === true) {
      //     el.style.backgroundColor = 'red';
      //     el.style.color = 'white';
      //   } else {
      //     el.style.backgroundColor = '';
      //     el.style.color = '';
      //   }
      // }
      el.style.cssText = '';
        
      // 1. Ưu tiên: Dòng bị xóa → đỏ
      if (data.IsDeleted === true) {
        el.style.backgroundColor = 'red';
        el.style.color = 'white';
      }
      // 2. Dòng CHA → lightyellow + bold (chỉ khi KHÔNG bị xóa)
      else if (data._children?.length > 0) {
        el.style.backgroundColor = 'lightyellow';
        el.style.fontWeight = 'bold';
      }
      // Không cần else → không reset gì cả!
    });
  }
  //#endregion
  //#region xóa phiên bản giải pháp
  deleteProjectSolutionVersion(typenumber: number): void {
    var ID: number = 0;
    var IsActive: boolean = false;
    if (typenumber === 1) {
      const data = this.tb_solutionVersion.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn 1 phiên bản giải pháp'
        );
        return;
      } else {
        if (data[0]['IsActive'] == true) {
          this.notification.warning(
            'Thông báo',
            'Phiên bản đang sử dụng vui lòng thử lại!'
          );
          return;
        }
      }
      ID = data[0].ID;
    } else {
      const data = this.tb_POVersion.getSelectedData();
      if (data.length <= 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn 1 phiên bản PO');
        return;
      }
      if (data[0]['IsActive'] == true) {
        this.notification.warning(
          'Thông báo',
          'Phiên bản đang sử dụng vui lòng thử lại!'
        );
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
              this.loadDataSolutionVersion();
              this.loadDataPOVersion();
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
        {
          title: 'Duyệt báo giá',
          field: 'IsApprovedPrice',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
          },
        },
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
        {
          title: 'Deadline báo giá',
          field: 'PriceReportDeadline',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          },
        },
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
      // Load phiên bản giải pháp và PO khi click vào giải pháp
      this.loadDataSolutionVersion();
      this.loadDataPOVersion();
      // Clear bảng nhân công - chờ user click vào phiên bản
      this.clearWorkerTable();
    });
    this.tb_solution.on('rowDeselected', (row: any) => {
      console.log('row deselected:', row);
      // Khi bỏ chọn giải pháp → clear tất cả bảng phụ thuộc
      this.projectSolutionId = 0;
      this.clearVersionTables();
      this.clearWorkerTable();
    });
  }
  drawTbSolutionVersion(): void {
    this.tb_solutionVersion = new Tabulator(
      this.tb_solutionVersionContainer.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        pagination: false,
        rowHeader:false,
        paginationMode: 'local',
        data: this.dataSolutionVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        groupHeader: (value: any) => `Danh mục: ${value}`,
        rowContextMenu: [
          {
            label: 'Sử dụng',
            action: (e: any, row: any) => {
              const rowData = row.getData();
              this.approvedActiveVersion(rowData["ID"], true, 1);
            },
          },
          {
            label: 'Không sử dụng',
            action: (e: any, row: any) => {
              const rowData = row.getData();
              this.approvedActiveVersion(rowData["ID"], false, 1);
            },
          },
        ],
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
            title: 'Người duyệt',
            field: 'UpdatedBy',
            hozAlign: 'center',
            headerHozAlign: 'center',
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
    this.tb_solutionVersion.on('rowClick', (e: any, row: any) => {
      console.log('row', row);
      const data = row.getData();
      this.selectionCode = data.Code;
      this.versionID = data.ID || 0;
      this.type = 1; // Giải pháp
      this.tb_POVersion.deselectRow();
      this.toggleTBPColumn();
      // Load nhân công khi click vào phiên bản giải pháp
      this.loadDataProjectWorker();
    });
    this.tb_solutionVersion.on('rowDeselected', (row: any) => {
      console.log('solutionVersion row deselected:', row);
      // Khi bỏ chọn phiên bản giải pháp → clear bảng nhân công
      this.versionID = 0;
      this.type = 0;
      this.clearWorkerTable();
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
  drawTbPOVersion(): void {
    this.tb_POVersion = new Tabulator(
      this.tb_POVersionContainer.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
        pagination: false,
        rowHeader:false,
        paginationMode: 'local',
        data: this.dataPOVersion,
        layout: 'fitDataStretch',
        height: '100%',
        maxHeight: '100%',
        groupBy: 'ProjectTypeName',
        groupStartOpen: true,
        selectableRows: 1,
        groupHeader: (value: any) => `Danh mục: ${value}`,
        rowContextMenu: [
          {
            label: 'Sử dụng',
            action: (e: any, row: any) => {
              const rowData = row.getData();
              this.approvedActiveVersion(rowData["ID"], true, 2);
            },
          },
          {
            label: 'Không sử dụng',
            action: (e: any, row: any) => {
              const rowData = row.getData();
              this.approvedActiveVersion(rowData["ID"], false, 2);
            },
          },
        ],
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
            title: 'Người duyệt',
            field: 'UpdatedBy',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 110,
          },
        ],
      }
    );
    this.tb_POVersion.on('rowClick', (e: any, row: any) => {
      console.log('row', row);
      const data = row.getData();
      this.selectionCode = data.Code;
      this.projectTypeID = data.ProjectTypeID;
      this.projectTypeName = data.ProjectTypeName;
      this.projectCode = data.ProjectCode;
      this.versionID = data.ID || 0;
      this.type = 2; // PO
      // Bỏ chọn tất cả các dòng đã chọn trong bảng solutionVersion
      const selectedRows = this.tb_solutionVersion.getSelectedRows();
      selectedRows.forEach((selectedRow: any) => {
        selectedRow.deselect();
      });
      console.log('type', this.type);
      this.toggleTBPColumn();
      // Load nhân công khi click vào phiên bản PO
      this.loadDataProjectWorker();
    });
    this.tb_POVersion.on('rowDeselected', (row: any) => {
      console.log('POVersion row deselected:', row);
      // Khi bỏ chọn phiên bản PO → clear bảng nhân công
      this.versionID = 0;
      this.type = 0;
      this.clearWorkerTable();
    });
  }

  drawTbProjectWorker(): void {
    this.tb_projectWorker = new Tabulator(
      this.tb_projectWorkerContainer.nativeElement,
      {
        ...DEFAULT_TABLE_CONFIG,
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
        
          // Reset style 1 lần duy nhất
          el.style.cssText = '';
        
          // 1. Ưu tiên: Dòng bị xóa → đỏ
          if (data.IsDeleted === true) {
            el.style.backgroundColor = 'red';
            el.style.color = 'white';
          }
          // 2. Dòng CHA → lightyellow + bold (chỉ khi KHÔNG bị xóa)
          else if (data._children?.length > 0) {
            el.style.backgroundColor = 'lightyellow';
            el.style.fontWeight = 'bold';
          }
          // Không cần else → không reset gì cả!
        },
        columns: [
          // {
          //   title: 'rowSelection',
          //   hozAlign: 'center',
          //   headerHozAlign: 'center',
          //   width: 70,
          //   formatter: 'rowSelection',
          //   titleFormatter: 'rowSelection',
          //   cellClick: (e: any, cell: any) => {
          //     // Logic chính được xử lý trong rowSelectionChanged
          //     // cellClick chỉ để debug nếu cần
          //     // const row = cell.getRow();
          //     // const rowData = row.getData();
          //     // console.log('Checkbox clicked for row:', rowData.ID, rowData.TT);
          //   },
          // },
          { title: 'ID', field: 'ID', visible: false },
          { title: 'TT', field: 'TT', width: 100, hozAlign: 'left' },
          {
            title: 'TBP duyệt',
            field: 'IsApprovedTBPText',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 90,
          },
          {
            title: 'Nội dung công việc',
            field: 'WorkContent',
            formatter: 'textarea',
            width: 400,
            hozAlign: 'left',
          },
          {
            title: 'Số người',
            field: 'AmountPeople',
            hozAlign: 'center',
            // Chỉ hiển thị nếu là lá (không có con)
            formatter: (cell: any) => {
              const row = cell.getRow().getData();
              return row._children && row._children.length > 0
                ? ''
                : cell.getValue();
            },
          },
          {
            title: 'Số ngày',
            field: 'NumberOfDay',
            hozAlign: 'center',
            width: 100,
            formatter: (cell: any) => {
              const row = cell.getRow().getData();
              return row._children && row._children.length > 0
                ? ''
                : cell.getValue();
            },
          },
          {
            title: 'Tổng nhân công',
            field: 'TotalWorkforce',
            hozAlign: 'right',
            width: 100,
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? value.toLocaleString('vi-VN') : '';
            },
            bottomCalc: 'sum',
          },
          {
            title: 'Đơn giá',
            field: 'Price',
            hozAlign: 'right',
            formatter: (cell: any) => {
              const row = cell.getRow().getData();
              if (row._children && row._children.length > 0) {
                return '';
              }
              const value = cell.getValue();
              return value ? Number(value).toLocaleString('vi-VN') : '';
            },
          },
          {
            title: 'Thành tiền',
            field: 'TotalPrice',
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: 'money',
            formatterParams: { thousand: '.', decimal: ',', precision: 0 },
            bottomCalc: 'sum',
            bottomCalcFormatter: 'money',
            bottomCalcFormatterParams: {
              thousand: '.',
              decimal: ',',
              precision: 0,
            },
          },
          {
            title: 'IsDeleted',
            field: 'IsDeleted',
            hozAlign: 'center',
            headerHozAlign: 'center',
            visible: false,
          },
        ],
      }
    );
    // QUAN TRỌNG: Áp dụng style sau khi dữ liệu được load
    this.tb_projectWorker.on('dataLoaded', () => {
      setTimeout(() => {
        this.applyDeletedRowStyle();
      }, 50); // Đảm bảo DOM đã render xong
    });

    // Thêm logic: khi chọn nút cha, tự động chọn tất cả nút con
    // Xử lý cả chọn và bỏ chọn
    this.tb_projectWorker.on(
      'rowSelectionChanged',
      (data: any[], rows: any[]) => {
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
                console.log(
                  `rowSelectionChanged - Selecting children of parent ID: ${rowData.ID}`
                );
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
                  hasChildren =
                    rowData._children && rowData._children.length > 0;
                }

                if (hasChildren) {
                  console.log(
                    `rowSelectionChanged - Deselecting children of parent ID: ${rowData.ID}`
                  );
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
      }
    );
    this.tb_projectWorker.on('cellClick', (e: any, cell: any) => {
      const field = cell.getField();
      if (field === 'rowSelection') return;
      
      // Xóa highlight cũ
      if (this.lastClickedWorkerRow) {
        const oldElement = this.lastClickedWorkerRow.getElement();
        if (oldElement) {
          oldElement.style.outline = '';
        }
      }
      
      // Lưu và highlight dòng mới
      this.lastClickedWorkerRow = cell.getRow();
      const rowData = this.lastClickedWorkerRow.getData();
      
      const newElement = this.lastClickedWorkerRow.getElement();
      if (newElement) {
        newElement.style.outline = '3px solid #52c41a';
        newElement.style.outlineOffset = '-1px';
      }
      
      console.log('Cell clicked - Row TT:', rowData.TT, 'ID:', rowData.ID);
    });
  }
  //#endregion

  // Hàm đệ quy để chọn/bỏ chọn tất cả node con
  toggleChildrenSelection(parentRow: any, isSelected: boolean): void {
    try {
      const parentData = parentRow.getData();
      console.log(
        `Toggle children for parent ID: ${parentData.ID}, TT: ${parentData.TT}, isSelected: ${isSelected}`
      );

      // Sử dụng getTreeChildren() của Tabulator để lấy children
      let childRows: any[] = [];

      try {
        // Thử dùng getTreeChildren() - method chính thức của Tabulator
        childRows = parentRow.getTreeChildren();
        console.log(
          `Found ${childRows.length} children using getTreeChildren()`
        );
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
        console.log(
          `Processing child ID: ${childData.ID}, TT: ${childData.TT}`
        );

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
          hasGrandChildren =
            childData._children && childData._children.length > 0;
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
  // hàm cập nhật tổng giá con và cha đệ quy
  calculateWorkerTree(data: any[]): any[] {
    const map = new Map<number, any>();
    const tree: any[] = [];

    // Clone và thêm _children
    data.forEach((item) => {
      const node = { ...item, _children: [] };
      map.set(node.ID, node);
    });

    // Xây dựng cây
    data.forEach((item) => {
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

    // Hàm đệ quy tính tổng từ con
    const calculateNode = (node: any): void => {
      // Lấy thông tin về công việc hiện tại
      const numberOfPeople = Number(node.AmountPeople) || 0;
      const numberOfDays = Number(node.NumberOfDay) || 0;
      const laborCostPerDay = Number(node.Price) || 0;

      // Xử lý các công việc con
      let totalLaborFromDirectChildren = 0;
      let totalCostFromDirectChildren = 0;

      // Duyệt qua tất cả con trực tiếp
      node._children.forEach((child: any) => {
        // Tính con trước (đệ quy) để đảm bảo con đã có giá trị
        calculateNode(child);

        // Lấy giá trị từ con trực tiếp (đã được tính từ các con trực tiếp của nó)
        // Node cha chỉ lấy tổng từ các con trực tiếp, không đệ quy sâu hơn
        totalLaborFromDirectChildren += Number(child.TotalWorkforce) || 0;
        totalCostFromDirectChildren += Number(child.TotalPrice) || 0;
      });

      // Kiểm tra xem node có con hay không
      const hasChildren = node._children && node._children.length > 0;

      if (hasChildren) {
        // Node CHA: chỉ tính tổng từ các con trực tiếp (không bao gồm giá trị của chính node cha)
        node.TotalWorkforce = totalLaborFromDirectChildren;
        node.TotalPrice = totalCostFromDirectChildren;
      } else {
        // Node LÁ: tính từ giá trị của chính node
        const totalLabor = numberOfPeople * numberOfDays;
        const totalCost = totalLabor * laborCostPerDay;
        node.TotalWorkforce = totalLabor;
        node.TotalPrice = totalCost;
      }
    };

    // Tính từ gốc
    tree.forEach((root) => calculateNode(root));

    return tree;
  }

  // Mở modal thêm/sửa nhân công
  openProjectWorkerDetail(isEdit: boolean): void {
    // Lấy versionID từ bảng đã chọn
    let selectedVersionID: number = 0;
    if (this.type === 1) {
      const selectedData = this.tb_solutionVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    } else if (this.type === 2) {
      const selectedData = this.tb_POVersion?.getSelectedData();
      if (selectedData && selectedData.length > 0) {
        selectedVersionID = selectedData[0].ID || 0;
      }
    }

    if (selectedVersionID <= 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn phiên bản giải pháp hoặc PO'
      );
      return;
    }

    let workerData: any = null;
    let workerID: number = 0;

    // Nếu là edit mode, lấy dữ liệu từ dòng đang focus
    if (isEdit) {
      // Thử 3 cách lấy dòng theo thứ tự ưu tiên
      let targetRow: any = null;
      
      // Cách 1: Lấy từ biến đã lưu (khi click vào cell)
      if (this.lastClickedWorkerRow) {
        targetRow = this.lastClickedWorkerRow;
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
          'Vui lòng click vào nhân công cần sửa'
        );
        return;
      }

      const focusedRow = targetRow.getData();
      workerID = focusedRow.ID || 0;

      console.log('Edit worker - TT:', focusedRow.TT, 'ID:', workerID, 'HasChildren:', (focusedRow._children?.length || 0));

      // Kiểm tra đã duyệt TBP chưa
      if (focusedRow.IsApprovedTBP) {
        this.notification.warning(
          'Thông báo',
          `Nhân công TT[${focusedRow.TT}] đã được TBP duyệt! Vui lòng chọn lại.`
        );
        return;
      }

      workerData = focusedRow;
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
           // Không hiện notification ở đây vì component con đã hiện rồi
         }
       })
       .catch((error: any) => {
         // Chỉ log error nếu không phải là dismiss với 'cancel' (đóng modal bình thường)
         if (error !== 'cancel') {
           console.error('Error in project worker detail modal:', error);
         }
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
          _children: node._children || [],
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
    const approvedWorkers = selectedRows.filter(
      (row: any) => row.IsApprovedTBP
    );
    if (approvedWorkers.length > 0) {
      const approvedTTs = approvedWorkers.map((w: any) => w.TT).join(', ');
      this.notification.warning(
        'Thông báo',
        `Không thể xóa nhân công đã được TBP duyệt: TT[${approvedTTs}]`
      );
      return;
    }

    // Tạo danh sách TT để hiển thị trong thông báo
    const ttList = selectedRows.map((row: any) => row.TT).join(', ');
    const message =
      selectedRows.length === 1
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
      IsDeleted: true,
    }));

    console.log('Delete payload:', JSON.stringify(payload, null, 2));

    // Gọi API để xóa (API nhận List<ProjectWorker>, chỉ cần ID và IsDeleted)
    this.projectWorkerService.saveWorker(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thành công',
            response.message || 'Xóa nhân công thành công!'
          );
          this.loadDataProjectWorker(); // Reload lại dữ liệu
        } else {
          this.notification.error(
            'Lỗi',
            response.message || 'Không thể xóa nhân công'
          );
        }
      },
      error: (error: any) => {
        console.error('Error deleting worker:', error);
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể xóa nhân công';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  //#region duyệt/hủy duyệt phiên bản giải pháp hoặc PO
  approvedActiveVersion(projectWorkerVersionID: number, isActive: boolean, type: number): void {
    this.projectWorkerService.approvedActive(projectWorkerVersionID, isActive).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(
            'Thành công',
            response.message || 'Cập nhật thành công!'
          );
          // Reload lại dữ liệu cho cả 2 bảng
          this.loadDataSolutionVersion();
          this.loadDataPOVersion();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể cập nhật');
        }
      },
      error: (error: any) => {
        console.error('Error updating approved active:', error);
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể cập nhật';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }
  //#endregion
  //#region đóng/mở panel bên trái
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%'; // Mở rộng panel nhân công lên 100%
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
}
