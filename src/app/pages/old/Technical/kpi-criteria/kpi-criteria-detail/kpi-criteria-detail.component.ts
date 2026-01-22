import { Component, OnInit, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// NG Zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// SlickGrid imports
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  GridOption,
  Formatters,
  Editors,
  FieldType,
  OnEventArgs,
} from 'angular-slickgrid';

// Service
import { KpiCriteriaService } from '../kpi-criteria-service/kpi-criteria.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-kpi-criteria-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzFormModule,
    NzModalModule,
    AngularSlickgridModule,
  ],
  templateUrl: './kpi-criteria-detail.component.html',
  styleUrl: './kpi-criteria-detail.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class KpiCriteriaDetailComponent implements OnInit {
  @Input() editId: number = 0;
  @Input() year: number = new Date().getFullYear();
  @Input() quarter: number = Math.ceil((new Date().getMonth() + 1) / 3);

  // Form
  criteriaForm!: FormGroup;
  isSubmitted: boolean = false;
  isSaving: boolean = false;

  // SlickGrid properties for Detail table
  angularGridDetail!: AngularGridInstance;
  columnDefinitionsDetail: Column[] = [];
  gridOptionsDetail: GridOption = {};
  datasetDetail: any[] = [];

  // Track deleted detail IDs
  deletedDetailIds: number[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private kpiCriteriaService: KpiCriteriaService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.initGridDetail();
    this.loadData();
  }

  //#region Form Initialization
  initForm(): void {
    this.criteriaForm = this.fb.group({
      year: [this.year, [Validators.required, Validators.min(2024)]],
      quarter: [this.quarter, [Validators.required, Validators.min(1), Validators.max(4)]],
      stt: [1, [Validators.required, Validators.min(1)]],
      criteriaCode: ['', Validators.required],
      criteriaName: ['', Validators.required],
    });
  }
  //#endregion

  //#region Grid Initialization
  initGridDetail(): void {
    this.columnDefinitionsDetail = [
      {
        id: 'action',
        name: '<i class="fa fa-plus text-success" style="cursor:pointer" title="Thêm dòng mới"></i>',
        field: 'action',
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        formatter: () => '<i class="fa fa-times text-danger" style="cursor:pointer" title="Xóa dòng"></i>',
        cssClass: 'text-center',
        excludeFromExport: true,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 60,
        minWidth: 60,
        sortable: true,
        cssClass: 'text-center',
      },
      {
        id: 'Point',
        name: 'Mức điểm hệ số',
        field: 'Point',
        width: 150,
        minWidth: 100,
        sortable: true,
        editor: {
          model: Editors['float'],
        },
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
      },
      {
        id: 'PointPercent',
        name: 'Mức điểm %',
        field: 'PointPercent',
        width: 150,
        minWidth: 100,
        sortable: true,
        editor: {
          model: Editors['float'],
        },
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
      },
      {
        id: 'CriteriaContent',
        name: 'Nội dung',
        field: 'CriteriaContent',
        width: 500,
        minWidth: 200,
        sortable: true,
        editor: {
          model: Editors['longText'],
        },
      },
    ];

    this.gridOptionsDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: false,
      editable: true,
      enableAddRow: false,
      autoEdit: true,
      autoCommitEdit: true,
      asyncEditorLoading: false,
    };
  }
  //#endregion

  //#region Grid Ready Events
  angularGridReadyDetail(angularGrid: AngularGridInstance): void {
    this.angularGridDetail = angularGrid;
  }

  onHeaderClick(e: any, args: any): void {
    const column = args.column;

    // Check if clicking on action column header
    if (column.field === 'action') {
      this.addDetailRow(-1); // Add row at the end
    }
  }

  onDetailCellClick(e: any, args: any): void {
    const column = args.grid.getColumns()[args.cell];
    const item = args.grid.getDataItem(args.row);

    // Check if clicking on action column cell (delete row)
    if (column.field === 'action') {
      this.deleteDetailRow(item, args.row);
    }
  }
  //#endregion

  //#region Data Loading
  loadData(): void {
    if (this.editId > 0) {
      // Load existing criteria - we need to get master data first
      // Since we don't have a specific API to get one criteria, we'll use the list and filter
      this.kpiCriteriaService.getData(this.quarter, this.year, '').subscribe({
        next: (response: any) => {
          if (response.status === 1 && Array.isArray(response.data)) {
            const masterData = response.data.find((item: any) => item.ID === this.editId);
            if (masterData) {
              this.criteriaForm.patchValue({
                year: masterData.KPICriteriaYear,
                quarter: masterData.KPICriteriaQuater,
                stt: masterData.STT,
                criteriaCode: masterData.CriteriaCode,
                criteriaName: masterData.CriteriaName,
              });
            }
          }
          // Now load detail data
          this.loadDetailData();
        },
        error: (error: any) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu tiêu chí: ' + error);
          this.loadDetailData();
        },
      });
    } else {
      // New criteria - get max STT
      this.getMaxSTT();
      this.datasetDetail = [];
    }
  }

  loadDetailData(): void {
    this.kpiCriteriaService.getDetail(this.editId).subscribe({
      next: (response: any) => {
        if (response.status === 1 && Array.isArray(response.data)) {
          this.datasetDetail = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID,
            STT: index + 1,
          }));
        } else {
          this.datasetDetail = [];
        }
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết tiêu chí: ' + error);
        this.datasetDetail = [];
      },
    });
  }

  getMaxSTT(): void {
    const year = this.criteriaForm.get('year')?.value || this.year;
    const quarter = this.criteriaForm.get('quarter')?.value || this.quarter;

    this.kpiCriteriaService.getMaxSTT(quarter, year).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          this.criteriaForm.patchValue({ stt: response.data });
        }
      },
      error: (error: any) => {
        console.error('Error getting max STT:', error);
      },
    });
  }

  onYearQuarterChange(): void {
    if (this.editId <= 0) {
      this.getMaxSTT();
    }
  }
  //#endregion

  //#region Detail Grid Operations
  addDetailRow(afterRow: number): void {
    const newSTT = this.datasetDetail.length > 0
      ? Math.max(...this.datasetDetail.map(d => d.STT || 0)) + 1
      : 1;

    const newPoint = newSTT - 1;
    const newPointPercent = newPoint * 20;

    const newItem = {
      id: `new_${Date.now()}`,
      STT: newSTT,
      Point: newPoint,
      PointPercent: newPointPercent,
      CriteriaContent: '',
      KPICriteriaID: this.editId,
      ID: 0,
    };

    this.datasetDetail = [...this.datasetDetail, newItem];
    this.angularGridDetail?.gridService.renderGrid();
  }

  deleteDetailRow(item: any, rowIndex: number): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa tiêu chí STT ${item.STT}?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Track for deletion if it has an ID from database
        if (item.ID > 0) {
          this.deletedDetailIds.push(item.ID);
        }

        // Remove from dataset
        this.datasetDetail = this.datasetDetail.filter((_, index) => index !== rowIndex);

        // Re-calculate STT
        this.datasetDetail.forEach((detail, index) => {
          detail.STT = index + 1;
        });

        this.angularGridDetail?.gridService.renderGrid();
      },
    });
  }
  //#endregion

  //#region Validation
  validateForm(): boolean {
    this.isSubmitted = true;

    if (this.criteriaForm.invalid) {
      Object.values(this.criteriaForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return false;
    }

    const formValue = this.criteriaForm.value;

    if (!formValue.criteriaCode || formValue.criteriaCode.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Mã Tiêu Chí!');
      return false;
    }

    if (!formValue.criteriaName || formValue.criteriaName.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Tên Tiêu Chí!');
      return false;
    }

    return true;
  }
  //#endregion

  //#region Save Operations
  saveData(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.validateForm()) {
        resolve(false);
        return;
      }

      this.isSaving = true;
      const formValue = this.criteriaForm.value;

      const dto = {
        KPICriterions: {
          ID: this.editId,
          CriteriaCode: formValue.criteriaCode.trim(),
          CriteriaName: formValue.criteriaName.trim(),
          KPICriteriaQuater: formValue.quarter,
          KPICriteriaYear: formValue.year,
          STT: formValue.stt,
        },
        KPICriteriaDetails: this.datasetDetail.map(item => ({
          ID: item.ID || 0,
          KPICriteriaID: this.editId,
          STT: item.STT,
          Point: item.Point || 0,
          PointPercent: item.PointPercent || 0,
          CriteriaContent: item.CriteriaContent || '',
        })),
        DeletedDetailIds: this.deletedDetailIds,
      };

      this.kpiCriteriaService.saveData(dto).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          if (response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu tiêu chí thành công!');
            resolve(true);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi lưu tiêu chí!');
            resolve(false);
          }
        },
        error: (error: any) => {
          this.isSaving = false;
          // Extract message from error response
          const errorMessage = error?.error?.message || error?.message || 'Lỗi khi lưu tiêu chí!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
          resolve(false);
        },
      });
    });
  }

  async saveAndClose(): Promise<void> {
    const success = await this.saveData();
    if (success) {
      this.activeModal.close({ success: true, reloadData: true });
    }
  }

  closeModal(): void {
    this.activeModal.close();
  }
  //#endregion
}
