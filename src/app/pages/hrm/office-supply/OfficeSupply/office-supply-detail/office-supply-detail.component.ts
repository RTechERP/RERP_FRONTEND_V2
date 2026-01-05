import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyService } from '../office-supply-service/office-supply-service.service';
import { OfficeSupplyUnitDetailComponent } from '../../OfficeSupplyUnit/office-supply-unit-detail/office-supply-unit-detail.component';
import { OfficeSupplyUnitService } from '../../OfficeSupplyUnit/office-supply-unit-service/office-supply-unit-service.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

interface Product {
  ID?: number;
  CodeRTC: string;
  CodeNCC: string;
  NameRTC: string;
  NameNCC: string;
  SupplyUnitID: number;
  Price: number;
  RequestLimit: number;
  Type: number;
}
@Component({
  selector: 'app-office-supply-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule
  ],
  templateUrl: './office-supply-detail.component.html',
  styleUrl: './office-supply-detail.component.css'
})
export class OfficeSupplyDetailComponent implements OnInit, AfterViewInit {
  @Input() newProduct!: Product;
  @Input() isCheckmode: boolean = false;
  @Input() listUnit: any[] = [];
  @Input() typeOptions: any[] = [];

  validateForm!: FormGroup;

  constructor(
    private officesupplyService: OfficeSupplyService,
    private officesupplyunitService: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  private initForm() {
    this.validateForm = this.fb.group({
      CodeRTC: [''],
      CodeNCC: ['', [Validators.required]],
      NameRTC: [''],
      NameNCC: ['', [Validators.required]],
      SupplyUnitID: [null, [Validators.required]],
      Price: [0, [Validators.required, Validators.min(0)]],
      RequestLimit: [0, [Validators.min(0)]],
      Type: [2, [Validators.required]]
    });
  }

  private patchFormValues(): void {
    if (this.newProduct && this.validateForm) {
      // Convert Type từ string sang integer nếu cần
      let typeValue = this.newProduct.Type;
      if (typeof typeValue === 'string') {
        if (typeValue === 'Cá nhân') {
          typeValue = 1;
        } else if (typeValue === 'Dùng chung') {
          typeValue = 2;
        } else {
          typeValue = 2; // default
        }
      }

      this.validateForm.patchValue({
        CodeRTC: this.newProduct.CodeRTC || '',
        CodeNCC: this.newProduct.CodeNCC || '',
        NameRTC: this.newProduct.NameRTC || '',
        NameNCC: this.newProduct.NameNCC || '',
        SupplyUnitID: this.newProduct.SupplyUnitID || null,
        Price: this.newProduct.Price || 0,
        RequestLimit: this.newProduct.RequestLimit || 0,
        Type: typeValue || 2
      });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormValues();
  }

  ngAfterViewInit(): void {
    if (this.listUnit.length === 0) {
      this.getUnits();
    }
  }
  getUnits(): void {
    this.officesupplyService.getUnit().subscribe({
      next: (res) => {
        console.log('Danh sách đơn vị tính:', res);
        this.listUnit = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
      }
    });
  }
  addNewUnit() {
    const modalRef = this.modalService.open(OfficeSupplyUnitDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedItem = {};

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getUnits(); // Refresh unit list
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  private syncFormToProduct(): void {
    const formValue = this.validateForm.getRawValue();
    this.newProduct = {
      ...this.newProduct,
      CodeRTC: formValue.CodeRTC || '',
      CodeNCC: formValue.CodeNCC || '',
      NameRTC: formValue.NameRTC || '',
      NameNCC: formValue.NameNCC || '',
      SupplyUnitID: formValue.SupplyUnitID || 0,
      Price: formValue.Price || 0,
      RequestLimit: formValue.RequestLimit || 0,
      Type: formValue.Type || 2
    };
  }

  add(): void {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    this.syncFormToProduct();
    this.officesupplyService.adddata(this.newProduct).subscribe({
      next: (res) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Thêm thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }

  update(): void {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    this.syncFormToProduct();
    console.log('Dữ liệu update:', this.newProduct);
    this.officesupplyService.updatedata(this.newProduct).subscribe({
      next: (res) => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi cập nhật dữ liệu!');
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
