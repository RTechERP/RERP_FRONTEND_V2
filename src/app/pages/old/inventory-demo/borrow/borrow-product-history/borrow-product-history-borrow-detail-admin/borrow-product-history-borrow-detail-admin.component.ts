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

  constructor(
    public activeModal: NgbActiveModal,
    private borrowService: BorrowService,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) { }
  ngOnInit() {
    this.loadHisToryProductDetail();
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

  this.borrowService.getHistoryProductBorrowDetail(this.HistoryProductID).subscribe({
    next: (response: any) => {
      const data = response.data[0];
      this.ProductName = data.ProductName;
      this.ProductCode = data.ProductCode;
      this.SerialNumber = data.SerialNumber;
      this.PartNumber = data.PartNumber;
      this.Serial = data.Serial;
      this.Maker = data.Maker;
      this.NumberBorrow = data.NumberBorrow;
      this.AddressBox = data.AddressBox;
      this.FullName = data.FullName;
      this.DateBorrow = new Date(data.DateBorrow);
      this.DateReturnExpected = new Date(data.DateReturnExpected);
      this.Project = data.Project;
      this.Note = data.Note;
    },
    error: (error) => {
      console.error('Lỗi:', error);
    },
  });
}


}
