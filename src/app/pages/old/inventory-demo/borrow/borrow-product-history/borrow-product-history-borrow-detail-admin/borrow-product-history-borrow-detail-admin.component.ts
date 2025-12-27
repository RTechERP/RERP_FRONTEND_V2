import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { BorrowService } from '..//../borrow-service/borrow.service';
import { CommonModule } from '@angular/common';
import { RouterTestingHarness } from '@angular/router/testing';
import { ID_ADMIN_DEMO_LIST } from '../../../../../../app.config';
import { AppUserService } from '../../../../../../services/app-user.service';

@Component({
  selector: 'app-borrow-product-history-borrow-detail-admin',
  templateUrl: './borrow-product-history-borrow-detail-admin.component.html',
  styleUrls: ['./borrow-product-history-borrow-detail-admin.component.css'],
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    NzCheckboxModule,
    CommonModule,


  ]
})
export class BorrowProductHistoryBorrowDetailAdminComponent implements OnInit {
  @Input() HistoryProductID: number = 0;

  ProductName: string = '';
  ProductCode: string = '';
  SerialNumber: string = '';
  PartNumber: string = '';
  Serial: string = '';
  Maker: string = '';
  NumberBorrow: string = '';
  AddressBox: string = '';
  FullName: string = '';
  DateBorrow: Date = new Date();
  DateReturnExpected: Date = new Date();
  Project: string = '';
  Note: string = '';
  hasPermission : boolean = true;
  // Lưu toàn bộ object HistoryProductRTC để update
  private historyProductRTC: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private borrowService: BorrowService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
  ) { }
  ngOnInit() {
    this.loadHisToryProductDetail();
    this.hasPermission = ID_ADMIN_DEMO_LIST.includes(this.appUserService.id || 0) || this.appUserService.isAdmin;
  }
  loadHisToryProductDetail() {
  if (this.HistoryProductID == 0) {
    this.notification.create(
      'warning',
      'Thông báo',
      'Lỗi không tìm thấy sản phẩm!.'
    );
    return;
  }

  // Sử dụng API get-history-product-borrow-detail vì nó JOIN với ProductRTC và Users
  this.borrowService.getHistoryProductBorrowDetail(this.HistoryProductID).subscribe({
    next: (response: any) => {
      console.log('API Response:', response);

      if (!response?.data || response.data.length === 0) {
        this.notification.create(
          'error',
          'Thông báo',
          'Không thể tải dữ liệu sản phẩm.'
        );
        return;
      }

      // API này trả về array, lấy phần tử đầu tiên
      const data = response.data[0];
      console.log('Data to bind:', data);

      // Bind dữ liệu vào form để hiển thị
      this.ProductName = data.ProductName || '';
      this.ProductCode = data.ProductCode || '';
      this.SerialNumber = data.SerialNumber || '';
      this.PartNumber = data.PartNumber || '';
      this.Serial = data.Serial || '';
      this.Maker = data.Maker || '';
      this.NumberBorrow = data.NumberBorrow || '';
      this.AddressBox = data.AddressBox || '';
      this.FullName = data.FullName || '';
      this.DateBorrow = data.DateBorrow ? new Date(data.DateBorrow) : new Date();
      this.DateReturnExpected = data.DateReturnExpected ? new Date(data.DateReturnExpected) : new Date();
      this.Project = data.Project || '';
      this.Note = data.Note || '';

      console.log('Bound values:', {
        ProductName: this.ProductName,
        ProductCode: this.ProductCode,
        FullName: this.FullName
      });

      // Lưu object HistoryProductRTC để update sau (lấy từ API khác)
      this.loadHistoryProductForUpdate();
    },
    error: (error) => {
      console.error('Lỗi:', error);
      this.notification.create(
        'error',
        'Thông báo',
        'Đã xảy ra lỗi khi tải dữ liệu.'
      );
    },
  });
}

// Load HistoryProductRTC object riêng để có thể update
loadHistoryProductForUpdate() {
  this.borrowService.getHistoryProductRTCByID(this.HistoryProductID).subscribe({
    next: (response: any) => {
      if (response?.status === 1 && response?.data) {
        this.historyProductRTC = response.data;
      }
    },
    error: (error) => {
      console.error('Lỗi khi load history object:', error);
    },
  });
}

save() {
  if (!this.historyProductRTC) {
    this.notification.error('Lỗi', 'Không có dữ liệu để lưu!');
    return;
  }

  // Cập nhật các trường có thể sửa (giống WinForm)
  this.historyProductRTC.DateBorrow = this.DateBorrow.toISOString();
  this.historyProductRTC.DateReturnExpected = this.DateReturnExpected.toISOString();
  this.historyProductRTC.Project = this.Project.trim();
  this.historyProductRTC.Note = this.Note.trim();
  this.historyProductRTC.UpdatedDate = new Date().toISOString();

  // Gọi API save
  this.borrowService.postSaveHistoryProduct(this.historyProductRTC).subscribe({
    next: (response: any) => {
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Lưu thành công!');
        this.activeModal.close(true); // Trả về true để parent refresh
      } else {
        this.notification.error('Thông báo', response?.message || 'Lưu thất bại!');
      }
    },
    error: (error) => {
      const message = error?.error?.message || 'Đã xảy ra lỗi khi lưu!';
      this.notification.error('Lỗi', message);
    },
  });
}
}
