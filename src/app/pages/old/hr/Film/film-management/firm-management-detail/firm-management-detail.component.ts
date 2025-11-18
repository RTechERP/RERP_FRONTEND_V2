import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import {

  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Editor } from 'tabulator-tables';
import { NzFormModule } from 'ng-zorro-antd/form'; //
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FilmManagementService } from '../film-management-service/film-management.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SelectControlComponent } from '../select-control/select-control.component';
import { UnitService } from '../../../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
@Component({
  standalone: true,
  imports: [

    NzCheckboxModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputNumberModule
  ],
  selector: 'app-firm-management-detail',
  templateUrl: './firm-management-detail.component.html',
  styleUrls: ['./firm-management-detail.component.css']
})
export class FirmManagementDetailComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  deviceTempTable: Tabulator | null = null;
  formDeviceInfo!: FormGroup;
  selectedDevices: any[] = [];
  dataTableBillExportDetail: any[] = [];
  projectOptions: any[] = [];
  unitOption: any[] = [];
  filmData: any[] = [];
  maxSTT: number = 0;


  public activeModal = inject(NgbActiveModal);
  constructor(private notification: NzNotificationService,
    private filmManagementService: FilmManagementService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private unitService: UnitService
  ) { }
  ngAfterViewInit(): void {
    this.getunit();
    this.getFilm();
  }
  ngOnInit() {
    this.initForm();

    if (this.dataInput?.master?.ID && this.dataInput.master.ID > 0) {
      // Có dữ liệu master để sửa
      this.patchFormData(this.dataInput.master);
    } else {
      // Thêm mới
      this.formDeviceInfo.reset({
        ID: 0,
        STT: 0,
        Code: '',
        Name: '',
        RequestResult: false,
        IsDeleted: false
      });
    }
    this.selectedDevices = (this.dataInput?.details || []).map((d: any) => ({
      ID: d.ID || 0,
      WorkContent: d.WorkContent || '',
      Unit: d.UnitID ?? null,
      PerformanceAVG: d.PerformanceAVG ?? 0,
    }));

    this.drawTable();
  }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ID: [0, null],
      STT: [0, Validators.required],
      Code: ['', Validators.required],
      Name: ['', Validators.required],
      RequestResult: [''],
      IsDeleted: [''],
    });
  }
  getFilm() {
    let paramm = {
      keyWord: "",
      page: 1,
      size: 30000,
    }
    this.filmManagementService.getFilm(paramm).subscribe({
      next: (res: any) => {
        this.filmData = res.data;
        this.maxSTT = res.data.maxSTT + 1;
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy danh sách phim');
      }
    });
  }
  getunit() {
    this.unitService.getUnit().subscribe({
      next: (res: any) => {
        console.log('pj', res.data);
        const unitData = res.data;
        if (Array.isArray(unitData)) {
          this.unitOption = unitData
            .filter((unitOption) => unitOption.ID !== null && unitOption.ID !== undefined && unitOption.ID !== 0)
            .map((unitOption) => ({
              label: unitOption.UnitName,
              value: unitOption.ID,
            }));
        } else {
          this.unitOption = [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy danh sách dự án');
        this.unitOption = [];
      },
    });
  }
  patchFormData(data: any) {
    if (!data) return;
    this.formDeviceInfo.patchValue({
      ...data
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }


  drawTable() {
    if (this.deviceTempTable) {
      this.deviceTempTable.replaceData(this.dataTableBillExportDetail);
    } else {
      this.deviceTempTable = new Tabulator('#deviceTempTable', {
        data: this.selectedDevices,
        layout: 'fitColumns',
        height: '38vh',
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 1,
        columns: [
          {
            title: '',
            field: 'addRow',
            hozAlign: 'center',
            width: 40,
            headerSort: false,
            titleFormatter: () =>
              `<div style="display: flex; justify-content: center; align-items: center; height: 100%;"><i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i> </div>`,
            headerClick: () => {
              this.addRow();
            },
            formatter: () => `<i class="fas fa-times text-danger cursor-pointer delete-btn" title="Xóa dòng"></i>`,
            cellClick: (e, cell) => {
              if ((e.target as HTMLElement).classList.contains('fas')) {
                this.modal.confirm({
                  nzTitle: 'Xác nhận xóa',
                  nzContent: 'Bạn có chắc chắn muốn xóa không?',
                  nzOkText: 'Đồng ý',
                  nzCancelText: 'Hủy',
                  nzOnOk: () => {
                    const row = cell.getRow();
                    const rowData = row.getData();

                    row.delete();
                  },
                });
              }
            },
          },
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            headerSort: false,
          },
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, headerSort: false, visible: false },

          { title: 'Nội dung công việc', field: 'WorkContent', hozAlign: 'left', headerHozAlign: 'center', editor: 'input' },
          {
            title: 'ĐVT',
            field: 'Unit',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 200,
            editor: this.createdControl(SelectControlComponent, this.injector, this.appRef, () => this.unitOption, {
              valueField: 'value',
              labelField: 'label',
            }),
            formatter: (cell) => {
              const val = cell.getValue();
              if (!val) {
                return '<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0 text-muted"></p> <i class="fas fa-angle-down"></i></div>';
              }
              const unit = this.unitOption.find((p: any) => p.value === val);
              const unitName = unit ? unit.label : val;
              return `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${unitName}</p> <i class="fas fa-angle-down"></i></div>`;
            },
            // cellEdited: (cell) => {
            //   const row = cell.getRow();
            //   const newValue = cell.getValue();
            //   const selectedProject = this.unitOption.find((p: any) => p.value === newValue);
            //   if (selectedProject) {
            //     row.update({
            //       ProjectCodeExport: selectedProject.UnitName,
            //       InventoryProjectIDs: [newValue],
            //     });
            //   }
            // },
          },

          { title: 'Hiệu suất trung bình', field: 'PerformanceAVG', hozAlign: 'right', headerHozAlign: 'center', editor: 'input' },
        ],
      });
    }
  }
  addRow() {
    if (this.deviceTempTable) {
      this.deviceTempTable.addRow({
        ID: 0,
        WorkContent: '',
        Unit: null,
        PerformanceAVG: 0,
      });
    }
  }
  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    getData: () => any[],
    config: {
      valueField: string;
      labelField: string;
      placeholder?: string;
    }
  ) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      const data = getData();
      componentRef.instance.id = cell.getValue();
      componentRef.instance.data = data;

      componentRef.instance.valueField = config.valueField;
      componentRef.instance.labelField = config.labelField;
      if (config.placeholder) {
        componentRef.instance.placeholder = config.placeholder;
      }

      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => { });

      return container;
    };
  }
  async saveData() {
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach(c => {
        if (c.invalid) { c.markAsTouched(); c.updateValueAndValidity({ onlySelf: true }); }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formValue = this.formDeviceInfo.value;

    // LẤY DỮ LIỆU TỪ BẢNG, KHÔNG DÙNG selectedDevices
    const tableRows = this.deviceTempTable ? this.deviceTempTable.getData() : [];

    const payload = {
      filmManagement: {
        ID: formValue.ID || 0,
        Code: formValue.Code,
        STT: formValue.STT || 0,
        Name: formValue.Name || '',
        RequestResult: !!formValue.RequestResult
      },
      filmManagementDetails: tableRows.map((row: any, idx: number) => ({
        ID: row.ID || 0,
        STT: idx + 1,
        FilmManagementID: formValue.ID || 0,
        UnitID: row.Unit ?? null,
        PerformanceAVG: Number(row.PerformanceAVG) || 0,
        WorkContent: row.WorkContent || ''
      })),
    };
    this.filmManagementService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Lưu phiếu thành công');
        this.formSubmitted.emit();
        this.activeModal.close();
      },
      error: (error: any) => {
        console.error('Lỗi khi lưu dữ liệu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lưu phiếu, vui lòng thử lại sau');
      }
    });
  }

}
