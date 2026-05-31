import { Component, OnInit, AfterViewInit, ViewChild, inject, ChangeDetectorRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { CustomTableKpi } from '../../../shared/custom-table-kpi/custom-table-kpi';
import { ColumnDef } from '../../../shared/custom-table-kpi/column-def.model';

import { KpiCriteriaViewService } from './kpicriteria-view-service/kpicriteria-view.service';
import { ReadOnlyLongTextEditor } from '../kpievaluation-employee/frmKPIEvaluationEmployee/readonly-long-text-editor';

@Component({
  selector: 'app-kpicriteria-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzTabsModule,
    NzInputNumberModule,
    CustomTableKpi,
  ],
  templateUrl: './kpicriteria-view.component.html',
  styleUrl: './kpicriteria-view.component.css'
})
export class KPICriteriaViewComponent implements OnInit, AfterViewInit {
  //#region Dependency Injection
  private injector = inject(Injector);
  private modalRef = inject(NzModalRef, { optional: true });
  private activeModal = inject(NgbActiveModal, { optional: true });
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private service = inject(KpiCriteriaViewService);
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

  //#region Grid instances (PrimeNG)
  @ViewChild('gridEvaluatePoint') gridEvaluatePoint!: CustomTableKpi;
  @ViewChild('gridCriteria') gridCriteria!: CustomTableKpi;
  @ViewChild('gridProjectType') gridProjectType!: CustomTableKpi;
  //#endregion

  //#region Định nghĩa cột
  evaluatePointColumns: ColumnDef[] = [];
  criteriaColumns: ColumnDef[] = [];
  projectTypeColumns: ColumnDef[] = [];

  // Header Groups cho bảng tiêu chí
  criteriaHeaderGroups: any[][] = [];
  //#endregion

  //#region Datasets
  dataEvaluatePoint: any[] = [];
  dataCriteria: any[] = [];
  dataProjectType: any[] = [];
  //#endregion

  constructor() { }

  ngOnInit(): void {
    console.log('🚀 [KPICriteriaViewComponent] V3 - Component initialized');
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
    this.gridsInitialized = true;
    this.cdr.detectChanges();
  }

  //#region Khởi tạo Grid Configurations
  private initializeGrids(): void {
    this.initEvaluatePointGrid();
    this.initCriteriaGrid();
    this.initProjectTypeGrid();
  }

  private initEvaluatePointGrid(): void {
    this.evaluatePointColumns = [
      {
        field: 'point1',
        header: 'A',
        width: '150px',
        cssClass: 'text-center',
      },
      {
        field: 'point2',
        header: 'B+',
        width: '150px',
        cssClass: 'text-center',
      },
      {
        field: 'point3',
        header: 'B',
        width: '150px',
        cssClass: 'text-center',
      },
      {
        field: 'point4',
        header: 'B-',
        width: '150px',
        cssClass: 'text-center',
      },
      {
        field: 'point5',
        header: 'C',
        width: '150px',
        cssClass: 'text-center',
      },
      {
        field: 'point6',
        header: 'D',
        width: '200px',
        cssClass: 'text-center',
      },
    ];
  }

  private initCriteriaGrid(): void {
    this.criteriaColumns = [
      {
        field: 'Point',
        header: 'Điểm',
        width: '60px',
        cssClass: 'text-right',
        sortable: true,
        format: (val) => val != null && val !== '' ? Number(val).toFixed(2) : '',
      },
      {
        field: 'PointPercent',
        header: 'Điểm %',
        width: '60px',
        cssClass: 'text-right',
        sortable: true,
        format: (val) => val != null ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      },
    ];
  }

  private initProjectTypeGrid(): void {
    this.projectTypeColumns = [
      {
        field: 'ProjectType',
        header: 'Loại dự án',
        width: '200px',
        sortable: true,
        textWrap: true,
      },
      {
        field: 'PLC',
        header: 'PLC Robot',
        width: '160px',
        sortable: true,
        textWrap: true,
      },
      {
        field: 'Vision',
        header: 'Vision',
        width: '160px',
        sortable: true,
        textWrap: true,
      },
      {
        field: 'SoftWare',
        header: 'Phần mềm',
        width: '160px',
        sortable: true,
        textWrap: true,
      },
    ];
  }
  //#endregion

  //#region Load dữ liệu
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
  }

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
  }

  private loadCriteriaData(): void {
    this.service.getKPICriteriaList(this.criteriaYear, this.criteriaQuarter).subscribe({
      next: (res: any) => {
        const criteria = Array.isArray(res) ? res : (res?.data || []);

        // Reset columns to base columns
        this.initCriteriaGrid();

        const dynamicFields: string[] = [];
        criteria.forEach((item: any) => {
          const col: ColumnDef = {
            field: item.CriteriaCode,
            header: `${item.CriteriaCode}: ${item.CriteriaName}`,
            width: '180px',
            sortable: true,
            textWrap: true,
          };
          this.criteriaColumns.push(col);
          dynamicFields.push(item.CriteriaCode);
        });

        // Cấu hình Header Groups
        this.criteriaHeaderGroups = [
          [
            { header: 'Mức điểm', fields: ['Point', 'PointPercent'], rowspan: 1 },
            { header: 'Tiêu chí', fields: dynamicFields, rowspan: 1 }
          ]
        ];

        this.service.getKPICriteriaPivot(this.criteriaYear, this.criteriaQuarter).subscribe({
          next: (resPivot: any) => {
            const data = Array.isArray(resPivot) ? resPivot : (resPivot?.data || []);
            this.dataCriteria = data.map((item: any, idx: number) => ({
              ...item,
              id: item.id ?? item.ID ?? idx
            }));
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.notification.error('Thông báo', 'Lỗi khi tải dữ liệu bảng tiêu chí!');
            console.error('Lỗi:', error);
          }
        });
      },
      error: (error) => {
        this.notification.error('Thông báo', 'Lỗi khi tải danh sách tiêu chí!');
        console.error('Lỗi:', error);
      }
    });
  }

  onYearChange(value: number): void {
    this.criteriaYear = value;
    this.loadCriteriaData();
  }

  onQuarterChange(value: number): void {
    this.criteriaQuarter = value;
    this.loadCriteriaData();
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
