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
import { FilmManagementService } from '../firm-management-service/film-management.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SelectControlComponent } from '../../../old/select-control/select-control.component';
import { UnitService } from '../../asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
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
    NzInputNumberModule,
    HasPermissionDirective
  ],
  selector: 'app-film-management-form',
  templateUrl: './film-management-form.component.html',
  styleUrl: './film-management-form.component.css'
})
export class FilmManagementFormComponent implements OnInit, AfterViewInit {
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
  deletedRows: any[] = [];

  public activeModal = inject(NgbActiveModal);
  constructor(private notification: NzNotificationService,
    private filmManagementService: FilmManagementService,
    private modal: NzModalService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private unitService: UnitService
  ) { }
  ngAfterViewInit(): void {
    // Load unit options trước, sau đó mới vẽ bảng
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
      IsDeleted: d.IsDeleted ?? false,
    }));

    // Không gọi drawTable() ở đây nữa, sẽ gọi sau khi getunit() xong
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
    };

    this.filmManagementService.getFilm(paramm).subscribe({
      next: (res: any) => {
        // tùy cấu trúc API, ví dụ:
        // res = { data: [...], maxSTT: 10 }
        // hoặc res = { data: { items: [...], maxSTT: 10 } }

        this.filmData = res.data;

        const nextStt = res.maxSTT ?? res.data?.maxSTT; // chỉnh cho đúng API của m

        // chỉ set STT auto khi THÊM MỚI
        if (!this.dataInput?.master?.ID || this.dataInput.master.ID === 0) {
          this.formDeviceInfo.patchValue({
            STT: (nextStt || 0) + 1
          });
        }

        this.maxSTT = (nextStt || 0) + 1;
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
        
        // Vẽ bảng sau khi đã có dữ liệu unitOption
        this.drawTable();
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lấy danh sách dự án');
        this.unitOption = [];
        
        // Vẫn vẽ bảng dù có lỗi
        this.drawTable();
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

                    // Nếu là dòng đã tồn tại trong DB thì push vào deletedRows
                    if (rowData['ID'] && rowData['ID'] > 0) {
                      this.deletedRows.push({
                        ...rowData,
                        IsDeleted: true
                      });
                    }

                    // Xóa khỏi bảng để user không nhìn thấy nữa
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

          { 
            title: 'Hiệu suất trung bình', 
            field: 'PerformanceAVG', 
            hozAlign: 'right', 
            headerHozAlign: 'center', 
            editor: (cell, onRendered, success, cancel) => {
              const input = document.createElement('input');
              input.type = 'text';
              input.style.width = '100%';
              input.style.height = '100%';
              input.style.border = 'none';
              input.style.padding = '4px';
              input.style.textAlign = 'right';
              input.value = cell.getValue() || '';

              // Chặn ngay khi gõ - chỉ cho phép số và dấu chấm
              input.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                let value = target.value;
                
                // Thay dấu phẩy thành dấu chấm ngay lập tức
                value = value.replace(/,/g, '.');
                
                // Chỉ cho phép số, dấu chấm và dấu trừ ở đầu
                value = value.replace(/[^\d.-]/g, '');
                
                // Chỉ cho phép 1 dấu chấm
                const dotIndex = value.indexOf('.');
                if (dotIndex !== -1) {
                  value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '');
                }
                
                // Chỉ cho phép dấu trừ ở đầu
                if (value.indexOf('-') > 0) {
                  value = value.replace(/-/g, '');
                }
                
                target.value = value;
              });

              input.addEventListener('blur', () => {
                const numValue = parseFloat(input.value) || 0;
                success(numValue);
              });

              input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                  const numValue = parseFloat(input.value) || 0;
                  success(numValue);
                } else if (e.key === 'Escape') {
                  cancel(cell.getValue());
                }
              });

              onRendered(() => {
                input.focus();
                input.select();
              });

              return input;
            }
          },
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
        IsDeleted: false,
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
  // 1. Validate form master
  if (this.formDeviceInfo.invalid) {
    Object.values(this.formDeviceInfo.controls).forEach(c => {
      if (c.invalid) {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      }
    });
    this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    return;
  }

  // 2. Lấy dữ liệu chi tiết trên bảng
  const tableRows = this.deviceTempTable ? this.deviceTempTable.getData() : [];

  // 2.1. Bắt buộc phải có ít nhất 1 dòng chi tiết
  if (!tableRows || tableRows.length === 0) {
    this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất 1 dòng nội dung công việc');
    return;
  }

  // 2.2. Check từng dòng: WorkContent không được để trống (chỉ check dòng chưa xóa)
  const invalidIndex = tableRows.findIndex((row: any) =>
    !row.IsDeleted && (!row.WorkContent || row.WorkContent.toString().trim() === '')
  );

  if (invalidIndex !== -1) {
    const rowNumber = invalidIndex + 1; // STT hiển thị

    this.notification.warning(
      'Cảnh báo',
      `Vui lòng nhập "Nội dung công việc" cho dòng chi tiết số ${rowNumber}`
    );

    // Optional: highlight ô lỗi + scroll tới đó cho dễ nhìn
    if (this.deviceTempTable) {
      const rows = this.deviceTempTable.getRows();
      const rowComp = rows[invalidIndex];
      if (rowComp) {
        const cell = rowComp.getCell('WorkContent');
        if (cell) {
          const el = cell.getElement();
          el.classList.add('cell-error'); // class CSS tự định nghĩa
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    return; 
  }

  const allRows = [

    ...tableRows,
    ...this.deletedRows
  ];

  const formValue = this.formDeviceInfo.value;

  const payload = {
    filmManagement: {
      ID: formValue.ID || 0,
      Code: formValue.Code,
      STT: formValue.STT || 0,
      Name: formValue.Name || '',
      RequestResult: !!formValue.RequestResult
    },
    filmManagementDetails: allRows.map((row: any, idx: number) => ({
      ID: row.ID || 0,
      STT: idx + 1,
      FilmManagementID: formValue.ID || 0,
      UnitID: row.Unit ?? null,
      PerformanceAVG: Number(row.PerformanceAVG) || 0,
      WorkContent: row.WorkContent || '',
      IsDeleted: !!row.IsDeleted
    })),
  };

  this.filmManagementService.saveData(payload).subscribe({
    next: () => {
      this.notification.success(NOTIFICATION_TITLE.success, 'Lưu phiếu thành công');
      this.formSubmitted.emit();
      this.activeModal.close();
    },
    error: (res: any) => {
      console.error('Lỗi khi lưu dữ liệu:', res);
      this.notification.error(NOTIFICATION_TITLE.error, res.error.message);
    }
  });
}


}