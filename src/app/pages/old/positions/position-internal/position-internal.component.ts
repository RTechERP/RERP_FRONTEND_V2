import { Component, OnInit } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { PositionServiceService } from '../position-service/position-service.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-position-internal',
  templateUrl: './position-internal.component.html',
  styleUrls: ['./position-internal.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    NzNotificationModule,
    NzSpinModule,
    NgIf,HasPermissionDirective
  ],
  standalone: true
})
export class PositionInternalComponent implements OnInit {
  private tabulator!: Tabulator;
  positionInternals: any[] = [];
  positionInternal: any = {};
  isEditMode: boolean = false;
  selectedPositionInternal: any = null;
  isVisible = false;
  isSubmitting = false;
  positionForm!: FormGroup;
  isLoading = false;

  constructor(
    private positionService: PositionServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    this.initForm();
  }

  private initForm() {
    this.positionForm = this.fb.group({
      ID: [0],
      PriorityOrder: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      IsBusinessCost: [false]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadPositionInternal();
  }

  loadPositionInternal() {
    this.isLoading = true;
    this.positionService.getPositionInternal().subscribe({
      next: (data: any) => {
        this.positionInternals = data;
        this.tabulator.setData(this.positionInternals);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách chức vụ nội bộ: ' + error.message);
      }
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#position-internal-table', {
      data: this.positionInternals,
      layout: 'fitDataFill',
      selectableRows: true,
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },
      responsiveLayout: true,
      height: '80vh',
      rowContextMenu: [
        {
          label: 'Có hưởng CTP',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            console.log(position);
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = position['PriorityOrder'];
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = true;
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Không hưởng CTP',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = position['PriorityOrder'];
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = false;
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 1',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 1;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 2',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 2;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 3',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 3;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 4',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 4;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 5',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 5;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 6',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 6;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 7',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 7;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 8',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 8;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 9',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 9;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 10',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionInternal.ID = position['ID'];
            this.positionInternal.PriorityOrder = 10;
            this.positionInternal.Code = position['Code'];
            this.positionInternal.Name = position['Name'];
            this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionInternal();
            });
          }
        },
        {
          label: 'Khác',
          menu: [
            ...Array.from({ length: 10 }, (_, i) => ({
              label: `Mức độ ưu tiên ${i + 11}`,
              action: () => {
                const selectedRows = this.tabulator.getSelectedRows();
                if (selectedRows.length === 0) {
                  this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ nội bộ cần cập nhật");

                  return;
                }
                const position = selectedRows[0].getData();
                this.positionInternal.ID = position['ID'];
                this.positionInternal.PriorityOrder = i + 11;
                this.positionInternal.Code = position['Code'];
                this.positionInternal.Name = position['Name'];
                this.positionInternal.IsBusinessCost = position['IsBusinessCost'];
                this.positionService.savePositionInternal(this.positionInternal).subscribe(() => {
                  this.notification.success('Thành công', "Cập nhật thành công");

                  this.loadPositionInternal();
                });
              }
            }))
          ]
        }

      ],
      columns: [
        { title: 'Mức độ ưu tiên', field: 'PriorityOrder', hozAlign: 'right', headerHozAlign: 'center', width: '17vw' },
        { title: 'Mã chức vụ', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: '25vw' },
        { title: 'Tên chức vụ', field: 'Name', hozAlign: 'left', headerHozAlign: 'center', width: '37vw' },
        {
          title: 'Hưởng CTP',
          field: 'IsBusinessCost',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'tickCross',
          formatterParams: {
            allowEmpty: true,
            allowTruthy: true,
            tickElement: '<i class="fas fa-check"></i>',
            crossElement: ''
          }
        },
      ],
      pagination: true,
      paginationSize: 100,
      paginationSizeSelector: [10, 20, 40, 80, 100],
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.positionForm.reset();
    this.positionForm.patchValue({
      ID: 0,
      PriorityOrder: 0,
      Code: '',
      Name: '',
      IsBusinessCost: false
    });
    this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn chức vụ nội bộ cần sửa');
      return;
    }
    this.isEditMode = true;
    this.selectedPositionInternal = selectedRows[0].getData();
    this.positionForm.patchValue(this.selectedPositionInternal);
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn chức vụ nội bộ cần xóa');
      return;
    }
    // const idsToDelete = selectedRows.map(row => row.getData()['ID']);

    // this.modal.confirm({
    //   nzTitle: 'Xác nhận xóa',
    //   nzContent: `Bạn có chắc chắn muốn xóa ${idsToDelete.length} chức vụ nội bộ đã chọn?`,
    //   nzOkText: 'Xóa',
    //   nzOkType: 'primary',
    //   nzOkDanger: true,
    //   nzOnOk: () => {
    //     Promise.all(idsToDelete.map(id =>
    //       this.positionService.deletePositionInternal(id).toPromise()
    //     )).then(() => {
    //       this.notification.success('Thành công', 'Đã xóa thành công các chức vụ nội bộ đã chọn');
    //       this.loadPositionInternal();
    //     }).catch(() => {
    //       this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa');
    //     });
    //   },
    //   nzCancelText: 'Hủy'
    // });


    const selectedPositionInternal = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa chức vụ nội bộ đã chọn không?`,
      nzOkText:"Xóa",
      nzOkType:'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.positionService.savePositionInternal({
          ...selectedPositionInternal,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Xóa chức vụ nội bộ thành công');
            this.loadPositionInternal();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa chức vụ nội bộ thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  onSubmit() {
    if (this.positionForm.invalid) {
      Object.values(this.positionForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSubmitting = true;
    const formData = this.positionForm.value;

    this.positionService.savePositionInternal(formData).subscribe({
      next: () => {
        this.notification.success('Thành công', this.isEditMode ? 'Cập nhật chức vụ nội bộ thành công' : 'Thêm mới chức vụ nội bộ thành công');
        this.closeModal();
        this.loadPositionInternal();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, (this.isEditMode ? 'Cập nhật' : 'Thêm mới') + ' chức vụ nội bộ thất bại: ' + error.message);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  closeModal() {
    this.isVisible = false;
    this.positionForm.reset();
    this.isSubmitting = false;
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }
}
