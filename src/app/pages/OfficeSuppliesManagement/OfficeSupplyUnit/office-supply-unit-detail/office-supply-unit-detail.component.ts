import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OfficeSupplyUnitService } from '../office-supply-unit-service/office-supply-unit-service.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface newOfficeSupplyUnit {
  ID?: number;
  Name: string;
}

@Component({
  selector: 'app-office-supply-unit-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './office-supply-unit-detail.component.html',
  styleUrl: './office-supply-unit-detail.component.css'
})
export class OfficeSupplyUnitDetailComponent implements OnInit {
  @Input() isCheckmode: boolean = false;
  @Input() selectedItem: any = {};
  validateForm: any;
  unitName: string = '';

  constructor(
    private fb: NonNullableFormBuilder,
    private officesupplyunitSV: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {
    this.initForm();
  }

  private initForm() {
    this.validateForm = this.fb.group({
      unitName: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.isCheckmode && this.selectedItem) {
      this.unitName = this.selectedItem.Name;
      this.validateForm.patchValue({
        unitName: this.selectedItem.Name
      });
    }
  }

  add(): void {
    if (!this.selectedItem.Name) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    this.officesupplyunitSV.savedata(this.selectedItem).subscribe({
      next: (res) => {
        this.notification.success('Thông báo', 'Thêm thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }

  update(): void {
    if (!this.selectedItem.Name) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    console.log('Dữ liệu update:', this.selectedItem);
    this.officesupplyunitSV.savedata(this.selectedItem).subscribe({
      next: (res) => {
        this.notification.success('Thông báo', 'Cập nhật thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật dữ liệu!');
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
