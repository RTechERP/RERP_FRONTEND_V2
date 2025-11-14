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
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { PositionServiceService } from '../position-service/position-service.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-position-contract',
  templateUrl: './position-contract.component.html',
  styleUrls: ['./position-contract.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    NzSpinModule,
    NgIf,HasPermissionDirective
  ],
  standalone: true
})
export class PositionContractComponent implements OnInit {
  private tabulator!: Tabulator;
  positionContracts: any[] = [];
  positionContract: any = {};
  isEditMode: boolean = false;
  selectedPositionContract: any = null;
  isVisible = false;
  isSubmitting = false;
  positionForm!: FormGroup;
  isLoading = false;

  constructor(
    private positionService: PositionServiceService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) {
    this.initForm();
  }

  private initForm() {
    this.positionForm = this.fb.group({
      ID: [0],
      PriorityOrder: [0],
      Code: ['',[Validators.required]],
      Name: ['',[Validators.required]],
      IsBusinessCost: [false]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadPositionContract();
  }

  loadPositionContract() {
    this.isLoading = true;
    this.positionService.getPositionContract().subscribe({
      next: (data: any) => {
        this.positionContracts = data;
        this.tabulator.setData(this.positionContracts);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách chức vụ theo hợp đồng: ' + error.message);
      }
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#position-contract-table', {
      data: this.positionContracts,
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
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            console.log(position);
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = position['PriorityOrder'];
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = true;
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Không hưởng CTP',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = position['PriorityOrder'];
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = false;
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 1',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 1;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 2',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 2;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");
              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 3',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 3;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 4',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");
              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 4;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 5',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 5;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 6',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 6;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 7',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 7;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 8',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 8;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 9',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 9;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
            });
          }
        },
        {
          label: 'Mức độ ưu tiên 10',
          action: () => {
            const selectedRows = this.tabulator.getSelectedRows();
            if (selectedRows.length === 0) {
              this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

              return;
            }
            const position = selectedRows[0].getData();
            this.positionContract.ID = position['ID'];
            this.positionContract.PriorityOrder = 10;
            this.positionContract.Code = position['Code'];
            this.positionContract.Name = position['Name'];
            this.positionContract.IsBusinessCost = position['IsBusinessCost'];
            this.positionService.savePositionContract(this.positionContract).subscribe(() => {
              this.notification.success('Thành công', "Cập nhật thành công");

              this.loadPositionContract();
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
                  this.notification.warning('Cảnh báo', "Vui lòng chọn chức vụ theo hợp đồng cần cập nhật");

                  return;
                }
                const position = selectedRows[0].getData();
                this.positionContract.ID = position['ID'];
                this.positionContract.PriorityOrder = i + 11;
                this.positionContract.Code = position['Code'];
                this.positionContract.Name = position['Name'];
                this.positionContract.IsBusinessCost = position['IsBusinessCost'];
                this.positionService.savePositionContract(this.positionContract).subscribe(() => {
                  this.notification.success('Thành công', "Cập nhật thành công");

                  this.loadPositionContract();
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
      this.notification.warning('Cảnh báo', 'Vui lòng chọn chức vụ theo hợp đồng cần sửa');
      return;
    }
    this.isEditMode = true;
    this.selectedPositionContract = selectedRows[0].getData();
    this.positionForm.patchValue(this.selectedPositionContract);
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn chức vụ theo hợp đồng cần xóa');
      return;
    }
    const selectedPositionContract = selectedRows[0].getData();


    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa chức vụ theo hợp đồng đã chọn?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.positionService.savePositionContract({
          ...selectedPositionContract,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Xóa chức vụ theo hợp đồng thành công');
            this.loadPositionContract();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa chức vụ theo hợp đồng thất bại: ' + error.message);
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
      return;
    }

    this.isSubmitting = true;
    const formData = this.positionForm.value;

    this.positionService.savePositionContract(formData).subscribe({
      next: () => {
        this.notification.success('Thành công', this.isEditMode ? 'Cập nhật chức vụ theo hợp đồng thành công' : 'Thêm mới chức vụ theo hợp đồng thành công');
        this.closeModal();
        this.loadPositionContract();
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, (this.isEditMode ? 'Cập nhật' : 'Thêm mới') + ' chức vụ theo hợp đồng thất bại: ' + error.message);
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






