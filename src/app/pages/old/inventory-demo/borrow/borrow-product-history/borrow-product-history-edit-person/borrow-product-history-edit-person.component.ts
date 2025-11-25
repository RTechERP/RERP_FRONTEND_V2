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
import { catchError, map, Observable, throwError } from 'rxjs';
@Component({
  selector: 'app-borrow-product-history-edit-person',
  templateUrl: './borrow-product-history-edit-person.component.html',
  styleUrls: ['./borrow-product-history-edit-person.component.css'],
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
export class BorrowProductHistoryEditPersonComponent implements OnInit {
  @Input() arrHistoryProductID: any[] = [];
  @Input() ProductCode: any = '';
  @Input() ProductName: any = '';

  employees: any[] = [];
  oldEmployees: any[] = [];

  Project: any = '';
  PeopleID: any = 0;
  NewPeopleID: any = 0;
  Note: any = ''
  addExport: any = false;
  dateExtend: any = new Date().toISOString();
  supplier: any = '';
  BillType: any = 0;
  BillExportTechnicalID: any = 0;
  BillNumber: any = '';
  NewPeopleName: any = '';
  constructor(
    public activeModal: NgbActiveModal,
    private borrowService: BorrowService,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
    this.onLoad();
  }

  onChangeUser(selectedValue: number) {
    const selected = this.employees.find(x => x.value === selectedValue);
    if (selected) {
      console.log("Title:", selected.title);
      // gán vào biến nếu cần
      this.NewPeopleName = selected.title;
    }
  }

  onLoad() {
    this.borrowService.getUserHistoryProduct(0).subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.employees = data.data.map((item: any) => ({
            title: item.FullName,
            value: item.ID
          }));
        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu.'
          );
        }
      },
      error: (error) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        );
      }
    });
    this.borrowService.getUserHistoryProduct(0).subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.oldEmployees = data.data.map((item: any) => ({
            title: item.FullName,
            value: item.ID
          }));

        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu.'
          );
        }
      },
      error: (error) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        );
      }
    });
    // nếu arr id .length = 0
    if (this.arrHistoryProductID.length == 0) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Không có dữ liệu.'
      );
      return;
    }
    else {
      let id = this.arrHistoryProductID[0];
      this.borrowService.getHistoryProductRTCByID(id).subscribe({
        next: (response) => {
          if (response.status == 1) {
            // đổ data vào các input
            let data = response.data;
            this.PeopleID = data.PeopleID;
            this.Project = data.Project;
            this.Note = data.Note;
          } else {
            this.notification.create(
              'warning',
              'Thông báo',
              'Không có dữ liệu.'
            );
          }
        },
        error: (error) => {
          this.notification.create(
            'error',
            'Lỗi',
            'Không thể tải dữ liệu. Vui lòng thử lại sau.'
          );
        }
      });
    }
  }
  onSubmit() {
    if (this.NewPeopleID == 0 || this.NewPeopleID == null) {
      this.notification.create(
        'warning',
        'Thông báo',
        'Vui lòng chọn người mượn mới!'
      );
      return;
    }

    let arrID = this.arrHistoryProductID;

    if (this.addExport) {
      this.loadBilllNumber(); // lấy billnumber
      let billExportTechnical = {
        ID: 0,
        Code: this.BillNumber,
        Status: 0,
        ReceiverID: this.NewPeopleID,
        Deliver: "Vũ Kim Ngân",
        ExpectedDate: this.dateExtend,
        Receiver: this.NewPeopleName,
        CreatedDate: new Date().toISOString(),
        WarehouseType: "Demo",
        SupplierName: this.supplier,
        BillType: this.BillType,
        ProjectName: this.Project,
        CheckAddHistoryProductRTC: false,
        ApproverID: 0,
        UpdatedDate: new Date().toISOString(),
        WarehouseID: 1,
      };

      this.borrowService.postSaveBillExportTechnical(billExportTechnical).subscribe({
        next: (resTech) => {
          if (resTech.status === 1) {
            this.BillExportTechnicalID = billExportTechnical.ID;
          } else {
            this.notification.warning('Thông báo', 'Không có dữ liệu.');
          }
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
        }
      });
    }
    arrID.forEach((id, i) => {
      this.borrowService.getHistoryProductRTCByID(id).subscribe({
        next: (resHistory) => {
          if (resHistory.status === 1) {
            let data = resHistory.data; // data
            // tạo billExportDetail
            if (this.addExport) {
              const billExportDetail = {
                BillExportTechID: this.BillExportTechnicalID,
                ProductID: data.ProductRTCID,
                Quantity: Number(data.NumberBorrow) || 0,
                TotalQuantity: Number(data.NumberBorrow) || 0,
                Note: data.Note || '',
                STT: i + 1,
                ProductRTCQRCodeID: data.ProductRTCQRCodeID,
                HistoryProductRTCID: data.ID,
                WarehouseID: 1,
              };
              this.borrowService.postSaveBillExportDetailTechnical(billExportDetail).subscribe();

            }
            // lưu data mới
            data.PeopleID = this.NewPeopleID;
            data.Project = this.Project;
            data.Note = this.Note;
            // ngày gia hạn đâu
            data.BillExportTechnicalID = this.BillExportTechnicalID;
            this.borrowService.postSaveHistoryProduct(data).subscribe();
          }
        }
      });
    });
    this.notification.success('Thông báo', 'Cập nhật người mượn thành công!.');
    this.activeModal.close();
  }

  loadBilllNumber(): void {
    this.borrowService.getBillNumber().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const billNumber = response.data as string;
          this.BillNumber = billNumber;
        } else {
          this.notification.create(
            'warning',
            'Thông báo',
            'Không có dữ liệu.'
          );
        }
      },
      error: (err) => {
        this.notification.create(
          'error',
          'Lỗi',
          'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        );
        console.error(err);
      }
    });
  }


}
