import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Tabulator } from 'tabulator-tables';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
  ],
  selector: 'app-tb-product-group-rtc-form',
  templateUrl: './tb-product-group-rtc-form.component.html',
  styleUrls: ['./tb-product-group-rtc-form.component.css']
})
export class TbProductGroupRtcFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  productGroupData: any[] = [];
productCode:string="";
  constructor(private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService
  ) { }
  public activeModal = inject(NgbActiveModal);
  ngOnInit() {
    console.log(this.dataInput);
  }
  ngAfterViewInit(): void {

  }
  getGroup() {
    this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;
      console.log("Group", this.productGroupData);
    });
  }

  saveProduct() {
    if (!this.dataInput.ProductGroupName.trim()) return;
    const payload = {
      productGroupRTC: {
        ID: this.dataInput.ID || 0,
        NumberOrder: this.dataInput.NumberOrder,
        ProductGroupName: this.dataInput.ProductGroupName,
        ProductGroupNo: this.dataInput.ProductGroupNo,
        WarehouseID: this.dataInput.WarehouseID||1,
        IsDeleted:false
      },
      productRTCs: []
    };
    console.log("payload",payload);
    this.tbProductRtcService.saveData(payload).subscribe({
      next: () => {
         this.notification.success('Thành công', 'Sửa nhóm TB thành công');
        this.getGroup();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
