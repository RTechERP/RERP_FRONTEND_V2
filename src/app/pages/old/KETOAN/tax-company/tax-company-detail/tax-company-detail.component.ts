import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TaxCompanyService } from '../tax-company-service/tax-company.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-tax-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './tax-company-detail.component.html',
  styleUrl: './tax-company-detail.component.css'
})
export class TaxCompanyDetailComponent implements OnInit {
  @Input() id: number = 0;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() onSaved = new EventEmitter<any>();

  code: string = '';
  name: string = '';
  fullName: string = '';
  taxCode: string = '';
  address: string = '';
  phoneNumber: string = '';
  director: string = '';
  position: string = '';
  
  buyerEnglish: string = '';
  addressBuyerEnglish: string = '';
  legalRepresentativeEnglish: string = '';
  
  buyerVietnamese: string = '';
  addressBuyerVienamese: string = '';
  taxVietnamese: string = '';

  errors: any = {};

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private modalService: NzModalService,
    private taxCompanyService: TaxCompanyService
  ) {}

  ngOnInit(): void {
    if (this.mode === 'edit' && this.id) {
      this.loadData();
    }
  }

  loadData(): void {
    this.taxCompanyService.getTaxCompanyById(this.id).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          this.code = data.Code || '';
          this.name = data.Name || '';
          this.fullName = data.FullName || '';
          this.taxCode = data.TaxCode || '';
          this.address = data.Address || '';
          this.phoneNumber = data.PhoneNumber || '';
          this.director = data.Director || '';
          this.position = data.Position || '';
          this.buyerEnglish = data.BuyerEnglish || '';
          this.addressBuyerEnglish = data.AddressBuyerEnglish || '';
          this.legalRepresentativeEnglish = data.LegalRepresentativeEnglish || '';
          this.buyerVietnamese = data.BuyerVietnamese || '';
          this.addressBuyerVienamese = data.AddressBuyerVienamese || '';
          this.taxVietnamese = data.TaxVietnamese || '';
        }
      },
      error: (error: any) => {
        console.error('Error loading tax company:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
  }

  validate(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.code || this.code.trim() === '') {
      this.errors.code = 'Vui lòng nhập mã công ty';
      isValid = false;
    }

    if (!this.name || this.name.trim() === '') {
      this.errors.name = 'Vui lòng nhập tên công ty';
      isValid = false;
    }

    return isValid;
  }

  saveAndClose(): void {
    if (!this.validate()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    const data = {
      ID: this.id,
      Code: this.code,
      Name: this.name,
      FullName: this.fullName,
      TaxCode: this.taxCode,
      Address: this.address,
      PhoneNumber: this.phoneNumber,
      Director: this.director,
      Position: this.position,
      BuyerEnglish: this.buyerEnglish,
      AddressBuyerEnglish: this.addressBuyerEnglish,
      LegalRepresentativeEnglish: this.legalRepresentativeEnglish,
      BuyerVietnamese: this.buyerVietnamese,
      AddressBuyerVienamese: this.addressBuyerVienamese,
      TaxVietnamese: this.taxVietnamese
    };

    this.taxCompanyService.saveTaxCompany(data).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.onSaved.emit(response.data);
          this.activeModal.close(response.data);
        } else if (response && response.success === false && response.needConfirm) {
          // Trường hợp công ty đã tồn tại nhưng đã bị xóa, cần confirm để khôi phục
          this.modalService.confirm({
            nzTitle: 'Xác nhận',
            nzContent: response.message,
            nzOkText: 'Có',
            nzCancelText: 'Không',
            nzOnOk: () => {
              this.restoreAndUseCompany(response.data.id);
            }
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
        }
      },
      error: (error: any) => {
        console.error('Error saving tax company:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  }

  restoreAndUseCompany(id: number): void {
    this.taxCompanyService.restoreTaxCompany(id).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Khôi phục thành công');
          this.onSaved.emit(response.data);
          this.activeModal.close(response.data);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Khôi phục thất bại');
        }
      },
      error: (error: any) => {
        console.error('Error restoring tax company:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi khôi phục dữ liệu');
      }
    });
  }

  
  resetForm(): void {
    this.code = '';
    this.name = '';
    this.fullName = '';
    this.taxCode = '';
    this.address = '';
    this.phoneNumber = '';
    this.director = '';
    this.position = '';
    this.buyerEnglish = '';
    this.addressBuyerEnglish = '';
    this.legalRepresentativeEnglish = '';
    this.buyerVietnamese = '';
    this.addressBuyerVienamese = '';
    this.taxVietnamese = '';
    this.errors = {};
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
