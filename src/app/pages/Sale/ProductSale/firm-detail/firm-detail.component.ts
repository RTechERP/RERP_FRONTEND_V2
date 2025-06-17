import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
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
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
interface Firm {
  ID?: number,
  FirmCode: string,
  FirmName: string,
  FirmType: number,
}

@Component({
  selector: 'app-firm-detail',
  standalone:true,
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
  templateUrl: './firm-detail.component.html',
  styleUrl: './firm-detail.component.css'
})
export class FirmDetailComponent implements OnInit, AfterViewInit {
  newFirm: Firm= {
    FirmCode: '',
    FirmName: '',
    FirmType: 1,
  };
  firmtype = [
    { id: 2, name: 'Demo' },
    { id: 1, name: 'Sale' }
  ];
  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService
  ) { }
  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    
  }
  addNewFirm(){
    if (!this.newFirm.FirmType || !this.newFirm.FirmName || !this.newFirm.FirmCode) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    const payload = [{   
        FirmCode: this.newFirm.FirmCode,
        FirmName: this.newFirm.FirmName,
        FirmType: this.newFirm.FirmType,
        CreatedBy: 'admin',
        CreatedDate: new Date(),
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
        IsDelete: false,
    }];
  console.log("payload",payload);
    this.productsaleService.saveDataFirm(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể thêm hãng!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      }
    });
  }
  closeModal() {
    this.activeModal.dismiss(true);
  }
 
}
