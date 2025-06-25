import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-unapproval-reason-modal',
  templateUrl: './unapproval-reason-modal.component.html',
  styleUrls: ['./unapproval-reason-modal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ]
})
export class UnapprovalReasonModalComponent implements OnInit {
  @Input() trainingRegistrationApprovedID!: number;

  
  // Dữ liệu form
  formData = {
    unapprovalReason: '',
    note: ''
  };

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  // Đóng modal và trả về null
  cancel(): void {
    this.activeModal.dismiss();
  }

  // Đóng modal và trả về dữ liệu
  confirm(): void {
    if (!this.formData.unapprovalReason) {
      return; // Không cho phép xác nhận nếu chưa nhập lý do
    }
    
    const result = {
      ID: this.trainingRegistrationApprovedID,
      unapprovalReason: this.formData.unapprovalReason,
      note: this.formData.note
    };
    
    this.activeModal.close(result);
  }
}