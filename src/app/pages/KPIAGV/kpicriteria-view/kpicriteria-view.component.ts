import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Formatters,
  GridOption,
  EditCommand,
} from 'angular-slickgrid';

import { KPIAGVCriteriaViewService } from './kpicriteria-view-service/kpicriteria-view.service';
import { ReadOnlyLongTextEditor } from '../kpievaluation-employee/frmKPIEvaluationEmployee/readonly-long-text-editor';

@Component({
  selector: 'app-kpiagv-criteria-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzInputNumberModule,
    NzFormModule,
    AngularSlickgridModule,
  ],
  templateUrl: './kpicriteria-view.component.html',
  styleUrl: './kpicriteria-view.component.css'
})
export class KPIAGVCriteriaViewComponent implements OnInit, AfterViewInit {
  //#region Dependency Injection
  private injector = inject(Injector);
  private modalRef = inject(NzModalRef, { optional: true });
  private activeModal = inject(NgbActiveModal, { optional: true });
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private service = inject(KPIAGVCriteriaViewService);
  private nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as any;

  //#endregion

  //#region Dữ liệu đầu vào từ modal
  criteriaYear: number = 2024;
  criteriaQuarter: number = 1;
  //#endregion

  //#region Trạng thái UI
  gridsInitialized = false;
  selectedTabIndex = 0;
  //#endregion

  //#region Grid instances
  angularGridEvaluatePoint!: AngularGridInstance;
  angularGridCriteria!: AngularGridInstance;
  angularGridProjectType!: AngularGridInstance;
  //#endregion

  //#region Định nghĩa cột
  evaluatePointColumns: Column[] = [];
  criteriaColumns: Column[] = [];
  projectTypeColumns: Column[] = [];
  //#endregion

  //#region Grid options
  evaluatePointGridOptions: GridOption = {};
  criteriaGridOptions: GridOption = {};
  projectTypeGridOptions: GridOption = {};
  //#endregion

  //#region Datasets
  dataEvaluatePoint: any[] = [];
  dataCriteria: any[] = [];
  dataProjectType: any[] = [];
  editCommandQueue: EditCommand[] = [];
  //#endregion

  constructor() { }

  ngOnInit(): void {
    console.log('🚀 [KPIAGVCriteriaViewComponent] V3 - Component initialized');
    //#region Nhận dữ liệu từ modal
    if (this.nzModalData) {
      this.criteriaYear = this.nzModalData.criteriaYear ?? this.criteriaYear;
      this.criteriaQuarter = this.nzModalData.criteriaQuarter ?? this.criteriaQuarter;
    }
    //#endregion

    //#region Khởi tạo grids
    this.initializeGrids();
    //#endregion

    //#region Load dữ liệu ban đầu
    this.loadEvaluatePoint();
    this.loadProjectType();
    this.loadCriteriaData();
    //#endregion
  }

  ngAfterViewInit(): void {
    //#region Delay để đảm bảo DOM đã sẵn sàng cho SlickGrid
    setTimeout(() => {
      this.gridsInitialized = true;
      this.cdr.detectChanges();
    }, 100);
    //#endregion
  }

  //#region Khởi tạo Grid Configurations
  private initializeGrids(): void {
    this.initEvaluatePointGrid();
    this.initCriteriaGrid();
    this.initProjectTypeGrid();
  }

  /**
   * Khởi tạo grid hiển thị thang điểm đánh giá (A, B+, B, B-, C, D)
   */
  private initEvaluatePointGrid(): void {
    this.evaluatePointColumns = [
      {
        id: 'point1',
        field: 'point1',
        name: 'A',
        width: 150,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
      {
        id: 'point2',
        field: 'point2',
        name: 'B+',
        width: 150,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
      {
        id: 'point3',
        field: 'point3',
        name: 'B',
        width: 150,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
      {
        id: 'point4',
        field: 'point4',
        name: 'B-',
        width: 150,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
      {
        id: 'point5',
        field: 'point5',
        name: 'C',
        width: 150,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
      {
        id: 'point6',
        field: 'point6',
        name: 'D',
        width: 200,
        sortable: false,
        cssClass: 'cell-multiline text-center',
      },
    ];

    this.evaluatePointGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-evaluate-point-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      gridHeight: 80,
      enableCellNavigation: false,
      enableSorting: false,
      enablePagination: false,
      enableFiltering: false,
      forceFitColumns: true,
      editable: false,
      autoCommitEdit: true,
      autoEdit: true,
    };
  }

  /**
   * Khởi tạo grid hiển thị bảng tiêu chí
   */
  private initCriteriaGrid(): void {
    //#region Cột cố định: Điểm và Điểm %
    this.criteriaColumns = [
      {
        id: 'Point',
        field: 'Point',
        name: 'Điểm',
        width: 80,
        minWidth: 80,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Mức điểm',
      },
      {
        id: 'PointPercent',
        field: 'PointPercent',
        name: 'Điểm %',
        width: 80,
        minWidth: 80,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Mức điểm',
      },
    ];
    //#endregion

    this.criteriaGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-criteria-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      enableFiltering: false,
      forceFitColumns: false,
      editable: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 30,
      rowHeight: 60,
      autoCommitEdit: true,
      autoEdit: true,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
    };
  }

  /**
   * Khởi tạo grid hiển thị loại dự án
   */
  private initProjectTypeGrid(): void {
    this.projectTypeColumns = [
      {
        id: 'ProjectType',
        field: 'ProjectType',
        name: 'Loại dự án',
        width: 200,
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
      },
      {
        id: 'PLC',
        field: 'PLC',
        name: 'PLC Robot',
        width: 400,
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
      },
      {
        id: 'Vision',
        field: 'Vision',
        name: 'Vision',
        width: 400,
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
      },
      {
        id: 'SoftWare',
        field: 'SoftWare',
        name: 'Phần mềm',
        width: 400,
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
      },
    ];

    this.projectTypeGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-project-type-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      enableFiltering: false,
      forceFitColumns: false,
      editable: true,
      autoCommitEdit: true,
      autoEdit: true,
      rowHeight: 60,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
    };
  }
  //#endregion

  //#region Load dữ liệu
  /**
   * Load thang điểm đánh giá (hardcoded như WinForm)
   */
  private loadEvaluatePoint(): void {
    this.dataEvaluatePoint = [
      {
        id: 1,
        point1: '>= 100%',
        point2: '90% <= B+ < 100%',
        point3: '80% <= B < 90%',
        point4: '70% <= B- < 80%',
        point5: '60% <= C < 70%',
        point6: '< 60% (Không có thưởng)'
      }
    ];
    if (this.angularGridEvaluatePoint) {
      this.updateGrid(this.angularGridEvaluatePoint, this.dataEvaluatePoint);
    }
  }

  /**
   * Load thông tin loại dự án (hardcoded như WinForm)
   */
  private loadProjectType(): void {
    this.dataProjectType = [
      {
        id: 1,
        ProjectType: 'Dự án đơn giản',
        PLC: 'Dự án có PLC điều khiển ít cụm và IO, và 1, 2 servo phát xung chạy điểm hay biến tần, vision …',
        Vision: 'Dự án check có không, đọc code đơn giản dùng smart camera (VPM hoặc SC của Hik), code reader (DL code)',
        SoftWare: '- Nghiệp vụ đơn giản, database ít bảng, không link nhiều, chỉ bao gồm thêm sửa xóa danh mục, có thêm phần log data\n- Có thể truyền thông đơn giản với các thiết bị ngoại vi'
      },
      {
        id: 2,
        ProjectType: 'Dự án phức tạp',
        PLC: 'Dự án lớn như SDV, LG. có nhiều cụm, IO, remote IO, truyền thông PLC CIM, Robot + vision align, có tiêu chuẩn thiết kế an toàn riêng theo ISO của nhà máy như safety, đi dây …',
        Vision: 'Dự án PC base nhiều camera, alignment (auto calib) nhiều camera với robot, cần xử lý và truyền thông data lớn, xây dựng giao diện, check các lỗi khó, tạo được procedure riêng trên Halcon',
        SoftWare: '- Nghiệp vụ phức tạp, database lớn, dữ liệu lưu trữ rất nhiều, liên tục\n- Hệ thống báo cáo nhiều, phức tạp, lấy lên từ nhiều bảng\n- Làm việc vời nhiều thiết bị truyền thông, việc truyền nhận diễn ra liên tục, cần xử lý bất đồng bộ nhiều'
      }
    ];
    if (this.angularGridProjectType) {
      this.updateGrid(this.angularGridProjectType, this.dataProjectType);
    }
  }

  /**
   * Load dữ liệu bảng tiêu chí từ API
   */
  private loadCriteriaData(): void {
    //#region Gọi API để lấy danh sách tiêu chí theo năm và quý
    this.service.getKPICriteriaList(this.criteriaYear, this.criteriaQuarter).subscribe({
      next: (res: any) => {
        const criteria = Array.isArray(res) ? res : (res?.data || []);

        //#region Thêm cột động cho mỗi tiêu chí
        criteria.forEach((item: any) => {
          const col: Column = {
            id: item.CriteriaCode,
            field: item.CriteriaCode,
            name: `${item.CriteriaCode}: ${item.CriteriaName}`,
            width: 300,
            sortable: true,
            cssClass: 'cell-multiline',
            columnGroup: 'Tiêu chí',
          };
          this.criteriaColumns.push(col);
        });
        //#endregion

        // Cập nhật lại danh sách cột cho Grid nếu đã khởi tạo
        if (this.angularGridCriteria?.slickGrid) {
          this.angularGridCriteria.slickGrid.setColumns(this.criteriaColumns);
        }

        //#region Gọi API để lấy dữ liệu pivot
        this.service.getKPICriteriaPivot(this.criteriaYear, this.criteriaQuarter).subscribe({
          next: (resPivot: any) => {
            const data = Array.isArray(resPivot) ? resPivot : (resPivot?.data || []);
            // Map ID to id for SlickGrid
            this.dataCriteria = data.map((item: any, idx: number) => ({
              ...item,
              id: item.id ?? item.ID ?? idx
            }));
            this.cdr.detectChanges();
            if (this.angularGridCriteria) {
              this.updateGrid(this.angularGridCriteria, this.dataCriteria);
            }
          },
          error: (error) => {
            this.notification.error('Thông báo', 'Lỗi khi tải dữ liệu bảng tiêu chí!');
            console.error('Lỗi:', error);
          }
        });
        //#endregion
      },
      error: (error) => {
        this.notification.error('Thông báo', 'Lỗi khi tải danh sách tiêu chí!');
        console.error('Lỗi:', error);
      }
    });
    //#endregion
  }

  /**
   * Xử lý khi thay đổi năm
   */
  onYearChange(value: number): void {
    this.criteriaYear = value;
    this.reloadCriteriaData();
  }

  /**
   * Xử lý khi thay đổi quý
   */
  onQuarterChange(value: number): void {
    this.criteriaQuarter = value;
    this.reloadCriteriaData();
  }

  /**
   * Reload lại dữ liệu bảng tiêu chí
   */
  private reloadCriteriaData(): void {
    //#region Reset cột động
    this.criteriaColumns = this.criteriaColumns.filter(col =>
      col.id === 'Point' || col.id === 'PointPercent'
    );
    //#endregion

    //#region Load lại data
    this.loadCriteriaData();
    //#endregion
  }
  //#endregion

  //#region Event handlers cho grids
  onEvaluatePointGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridEvaluatePoint = angularGrid;
    if (this.dataEvaluatePoint && this.dataEvaluatePoint.length > 0) {
      this.updateGrid(this.angularGridEvaluatePoint, this.dataEvaluatePoint);
    }
  }

  onCriteriaGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridCriteria = angularGrid;
    if (this.dataCriteria && this.dataCriteria.length > 0) {
      this.updateGrid(this.angularGridCriteria, this.dataCriteria);
    }
  }

  onProjectTypeGridReady(angularGrid: AngularGridInstance): void {
    this.angularGridProjectType = angularGrid;
    if (this.dataProjectType && this.dataProjectType.length > 0) {
      this.updateGrid(this.angularGridProjectType, this.dataProjectType);
    }
  }

  private updateGrid(grid: AngularGridInstance, data: any[]): void {
    if (grid && grid.dataView && grid.slickGrid) {
      grid.dataView.setItems(data || []);
      grid.slickGrid.invalidate();
      grid.slickGrid.render();
      grid.resizerService?.resizeGrid();
    }
  }
  //#endregion

  //#region Close modal
  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    } else if (this.activeModal) {
      this.activeModal.close();
    }
  }
  //#endregion
}

