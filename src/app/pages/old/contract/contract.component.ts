import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ContractServiceService } from './contract-service/contract-service.service';
import { FormGroupDirective } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-contract',
  templateUrl: './contract.component.html',
  styleUrls: ['./contract.component.css'],
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
  providers: [NzNotificationService, NzModalService],
  standalone: true
})
export class ContractComponent implements OnInit {
  private tabulator!: Tabulator;
  contracts: any[] = [];
  isEditMode: boolean = false;
  contractForm!: FormGroup;
  selectedContract: any = null;
  isLoading = false;

  constructor(
    private contractService: ContractServiceService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {
    this.initForm();
  }

  private initForm() {
    this.contractForm = this.fb.group({
      ID: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      IsDeleted: [false]
    });
  }

  ngOnInit() {
    this.initializeTable();
    this.loadContracts();
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_contract', {
      data: this.contracts,
      layout: 'fitColumns',
      responsiveLayout: true,
      selectableRows: 1,
      columns: [
        {
          title: 'Mã hợp đồng', field: 'Code', hozAlign:'center',headerHozAlign:'center', width:'40%'
        },
        {
          title: 'Loại hợp đồng', field: 'Name', hozAlign:'center',headerHozAlign:'center'
        }
      ]
    });
  }

  loadContracts() {
    this.isLoading = true;
    this.contractService.getContracts().subscribe({
      next: (data: any) => {
        this.contracts = data.data;
        this.tabulator.setData(this.contracts);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách hợp đồng: ' + error.message);
        this.isLoading = false;
      }
    });
  }

  onSubmit() {
    if (this.contractForm.valid) {
      if (this.isEditMode) {
        this.contractService.saveContract(this.contractForm.value).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Cập nhật hợp đồng thành công');
            this.closeModal();
            this.loadContracts();
          },
          error: (response) => {
            this.notification.error('Lỗi', 'Cập nhật hợp đồng thất bại: ' + response.error.message);
          }
        });
      } else {
        this.contractService.saveContract(this.contractForm.value).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Thêm hợp đồng mới thành công');
            this.closeModal();
            this.loadContracts();
          },
          error: (response) => {
            this.notification.error('Lỗi', 'Thêm hợp đồng mới thất bại: ' + response.error.message);
          }
        });
      }
    } else {
      Object.values(this.contractForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.contractForm.reset({
      ID: 0,
      Code: '',
      Name: '',
      IsDeleted: false
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addContractModal'));
    modal.show();
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn hợp đồng cần sửa');
      return;
    }

    this.isEditMode = true;
    this.selectedContract = selectedRows[0].getData();
    this.contractForm.patchValue({
      ID: this.selectedContract.ID,
      Code: this.selectedContract.Code,
      Name: this.selectedContract.Name,
      IsDeleted: false
    });
    const modal = new (window as any).bootstrap.Modal(document.getElementById('addContractModal'));
    modal.show();
  }

  closeModal() {
    const modal = document.getElementById('addContractModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
    this.contractForm.reset();
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn hợp đồng cần xóa');
      return;
    }

    const selectedContract = selectedRows[0].getData();
    this.modal.confirm({
      nzTitle: "Xác nhận xóa",
      nzContent: `Bạn có chắc chắn muốn xóa loại hợp đồng ${selectedContract['Name']} không?`,
      nzOkText:"Xóa",
      nzOkType:'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.contractService.saveContract({
          ...selectedContract,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success('Thành công', 'Xóa hợp đồng thành công');
            this.loadContracts();
          },
          error: (error) => {
            this.notification.error('Lỗi', 'Xóa hợp đồng thất bại: ' + error.message);
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }
}
