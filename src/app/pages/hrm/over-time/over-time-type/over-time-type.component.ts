import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { FormGroupDirective } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgIf } from '@angular/common';
import { OverTimeService } from '../over-time-service/over-time.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-over-time-type',
  templateUrl: './over-time-type.component.html',
  styleUrls: ['./over-time-type.component.css'],
  imports: [
    NzIconModule,
    NzButtonModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    NgIf
  ],
})
export class OverTimeTypeComponent implements OnInit, AfterViewInit{
  private tabulator!: Tabulator;
  overTimeTypeList: any[] = [];
  overTimeTypeForm!: FormGroup;
  selectedOverTimeType: any = null;
  isLoading = false;
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private overTimeService: OverTimeService
  ) {
    this.initForm();
   }

   private initForm() {
    this.overTimeTypeForm = this.fb.group({
      ID: [0],
      TypeCode: ['', [Validators.required]],
      Type: ['', [Validators.required]],
      Ratio: ['', [Validators.required]],
      Note: [''],
      IsDeleted: [false]
    });
  }

  ngOnInit() {
    this.loadOverTimeType();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  loadOverTimeType() {
    this.isLoading = true;
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data: any) => {
        this.overTimeTypeList = data.data;
        this.tabulator.setData(this.overTimeTypeList);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách loại làm thêm: ' + error.message);
        this.isLoading = false;
      }
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_over_time_type', {
      data: this.overTimeTypeList,
      layout: 'fitDataStretch',
      selectableRows: 1,
      height: '70vh',
      columns: [
        {
          title: 'Mã', field: 'TypeCode', hozAlign:'left',headerHozAlign:'center', width: 200
        },
        {
          title: 'Loại', field: 'Type', hozAlign:'left',headerHozAlign:'center', width: 330
        },
        {
          title: 'Tỷ lệ (%)', field: 'Ratio', hozAlign:'right',headerHozAlign:'center', width: 200
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign:'left',headerHozAlign:'center', width: 370
        }
      ]
    });
  }

  openAddModal() {
    this.overTimeTypeForm.reset({
      ID: 0,
      TypeCode: '',
      Type: '',
      Ratio: '',
      Note: '',
      IsDeleted: false
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addOverTimeTypeModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kiểu làm thêm cần sửa');
      return;
    }

    this.selectedOverTimeType = selectedRows[0].getData();
    this.overTimeTypeForm.patchValue({
      ID: this.selectedOverTimeType.ID,
      TypeCode: this.selectedOverTimeType.TypeCode,
      Type: this.selectedOverTimeType.Type,
      Ratio: this.selectedOverTimeType.Ratio,
      Note: this.selectedOverTimeType.Note,
      IsDeleted: false
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addOverTimeTypeModal'));
    modal.show();
  }

  closeModal() {
    const modal = document.getElementById('addOverTimeTypeModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.overTimeTypeForm.reset();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kiểu làm thêm cần xóa');
      return;
    }

    const selectedOverTimeType = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa kiểu làm thêm ${selectedOverTimeType['TypeCode']} này không?`,
      nzOkText:"Xóa",
      nzOkType:'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.overTimeService.saveEmployeeTypeOverTime({
          ...selectedOverTimeType,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa kiểu làm thêm thành công');
            this.loadOverTimeType();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa kiểu làm thêm thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit() {
    if (this.overTimeTypeForm.valid) {

        this.overTimeService.saveEmployeeTypeOverTime(this.overTimeTypeForm.value).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Lưu kiểu làm thêm mới thành công');
            this.closeModal();
            this.loadOverTimeType();
          },
          error: (response) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lưu kiểu làm thêm mới thất bại: ' + response.error.message);
          }
        });
    } else {
      Object.values(this.overTimeTypeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }
}
