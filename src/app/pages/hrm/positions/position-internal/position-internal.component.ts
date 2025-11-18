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
    NgIf, HasPermissionDirective
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
  selectedRowIds: number[] = [];
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

  // loadPositionInternal() {
  //   this.isLoading = true;
  //   this.positionService.getPositionInternal().subscribe({
  //     next: (data: any) => {
  //       this.positionInternals = data;
  //       this.tabulator.setData(this.positionInternals);
  //       this.isLoading = false;
  //     },
  //     error: (error) => {
  //       this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách chức vụ nội bộ: ' + error.message);
  //     }
  //   });
  // }

  loadPositionInternal() {
    this.isLoading = true;
    const currentPage = this.tabulator.getPage();
    this.positionService.getPositionInternal().subscribe({
      next: (data: any) => {
        this.positionInternals = data;

        // Set data mới vào bảng
        this.tabulator.setData(this.positionInternals).then(() => {
          // Sau khi render xong, chọn lại các dòng cũ
          if (typeof currentPage === 'number') {
            this.tabulator.setPage(currentPage);
          }
          if (this.selectedRowIds.length > 0) {
            const pageSize = this.tabulator.getPageSize(); // số dòng mỗi trang

            // Tìm index của dòng đầu tiên cần chọn
            let targetIndex = this.positionInternals.findIndex(item => this.selectedRowIds.includes(item.ID));
            if (targetIndex === -1) targetIndex = 0; // fallback nếu không tìm thấy

            // Tính trang chứa dòng đó
            const targetPage = Math.floor(targetIndex / pageSize) + 1;

            // Chuyển tới trang chứa dòng
            this.tabulator.setPage(targetPage).then(() => {
              // Chọn lại các dòng theo ID
              const rows = this.tabulator.getRows();
              let firstRowToScroll: any = null;

              rows.forEach(row => {
                if (this.selectedRowIds.includes(row.getData()['ID'])) {
                  row.select();
                  if (!firstRowToScroll) firstRowToScroll = row;
                }
              });

              // Scroll tới dòng đầu tiên được chọn
              if (firstRowToScroll) firstRowToScroll.scrollTo();
            });
          }
        });

        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách chức vụ nội bộ: ' + error.message
        );
        this.isLoading = false;
      }
    });
  }

  onSearchEmployee(event: any) {

    const keyword = event.target.value.toLowerCase();
    if (keyword != "") {
      this.tabulator.setFilter([
        [
          { field: 'PriorityOrder', type: 'like', value: keyword },
          { field: 'Code', type: 'like', value: keyword },
          { field: 'Name', type: 'like', value: keyword },
        ]
      ], 'or'); // 'or' để tìm ở bất kỳ cột nào
    } else {
      // Xóa filter, load lại dữ liệu
      this.initializeTable();
      this.loadPositionInternal();
      // hoặc this.loadPositionContract(); nếu muốn reload từ server
    }
  }

  updatePriority(priority: Number) {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn chức vụ nội bộ cần cập nhật");
      return;
    }

    // Lấy toàn bộ data của các dòng được chọn
    const positions = selectedRows.map(row => row.getData());
    this.selectedRowIds = selectedRows.map(row => row.getData()['ID']);
    // Chuẩn bị danh sách để gửi lên service
    const payload = positions.map(pos => ({
      ID: pos['ID'],
      PriorityOrder: priority,
      Code: pos['Code'],
      Name: pos['Name'],
      IsBusinessCost: pos['IsBusinessCost'],
    }));

    // Gọi service để cập nhật nhiều record cùng lúc
    this.positionService.changeStatusPositionInternal(payload).subscribe(() => {
      this.notification.success(NOTIFICATION_TITLE.success, "Cập nhật thành công");
      this.loadPositionInternal();
    });
  }


  updateIsBusinessCost(isBusinessCost: boolean) {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng chọn chức vụ nội bộ cần cập nhật");
      return;
    }

    // Lấy toàn bộ data của các dòng được chọn
    const positions = selectedRows.map(row => row.getData());
    this.selectedRowIds = selectedRows.map(row => row.getData()['ID']);
    // Chuẩn bị danh sách để gửi lên service
    const payload = positions.map(pos => ({
      ID: pos['ID'],
      PriorityOrder: pos['PriorityOrder'],
      Code: pos['Code'],
      Name: pos['Name'],
      IsBusinessCost: isBusinessCost,
    }));

    // Gọi service để cập nhật nhiều record cùng lúc
    this.positionService.changeStatusPositionInternal(payload).subscribe(() => {
      this.notification.success(NOTIFICATION_TITLE.success, "Cập nhật thành công");
      this.loadPositionInternal();
    });
  }


  private initializeTable(): void {
    this.tabulator = new Tabulator('#position-internal-table', {
      data: this.positionInternals,
      layout: 'fitDataStretch',
      selectableRows: true,
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },

      height: '82vh',
      rowContextMenu: [
        {
          label: 'Có hưởng CTP',
          action: () => {
            this.updateIsBusinessCost(true);
          }
        },
        {
          label: 'Không hưởng CTP',
          action: () => {
            this.updateIsBusinessCost(false);
          }
        },
        {
          label: 'Mức độ ưu tiên 1',
          action: () => {
            this.updatePriority(1);
          }
        },
        {
          label: 'Mức độ ưu tiên 2',
          action: () => {
            this.updatePriority(2);
          }
        },
        {
          label: 'Mức độ ưu tiên 3',
          action: () => {
            this.updatePriority(3);
          }
        },
        {
          label: 'Mức độ ưu tiên 4',
          action: () => {
            this.updatePriority(4);
          }
        },
        {
          label: 'Mức độ ưu tiên 5',
          action: () => {
            this.updatePriority(5);
          }
        },
        {
          label: 'Mức độ ưu tiên 6',
          action: () => {
            this.updatePriority(6);
          }
        },
        {
          label: 'Mức độ ưu tiên 7',
          action: () => {
            this.updatePriority(7);
          }
        },
        {
          label: 'Mức độ ưu tiên 8',
          action: () => {
            this.updatePriority(8);
          }
        },
        {
          label: 'Mức độ ưu tiên 9',
          action: () => {
            this.updatePriority(9);
          }
        },
        {
          label: 'Mức độ ưu tiên 10',
          action: () => {
            this.updatePriority(10);
          }
        },
        {
          label: 'Khác',
          menu: [
            ...Array.from({ length: 10 }, (_, i) => ({
              label: `Mức độ ưu tiên ${i + 11}`,
              action: () => {
                this.updatePriority(i + 11);
              }
            }))
          ]
        }

      ],
      columns: [
        { title: 'Mức độ ưu tiên', field: 'PriorityOrder', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerWordWrap: true },
        { title: 'Mã chức vụ', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 120 },
        { title: 'Tên chức vụ', field: 'Name', hozAlign: 'left', headerHozAlign: 'center', width: 400, formatter: 'textarea' },
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
          },
          maxWidth: 180,
          minWidth: 180,
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
    if (selectedRows.length != 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 chức vụ nội bộ cần sửa');
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn chức vụ nội bộ cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selectedRows.length} chức vụ nội bộ đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {

        let completed = 0;
        const total = selectedRows.length;

        selectedRows.forEach(row => {
          const data = row.getData();
          this.positionService.savePositionInternal({
            ...data,
            IsDeleted: true
          }).subscribe({
            next: () => {
              completed++;
              if (completed === total) {
                this.notification.success(NOTIFICATION_TITLE.success, 'Đã xóa các chức vụ thành công');
                this.loadPositionInternal();
                this.initializeTable();
              }
            },
            error: (error) => {
              this.notification.error(NOTIFICATION_TITLE.error, `Xóa thất bại ${error.error.message}`);
            }
          });
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSubmitting = true;
    const formData = this.positionForm.value;

    this.positionService.savePositionInternal(formData).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, this.isEditMode ? 'Cập nhật chức vụ nội bộ thành công' : 'Thêm mới chức vụ nội bộ thành công');
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
