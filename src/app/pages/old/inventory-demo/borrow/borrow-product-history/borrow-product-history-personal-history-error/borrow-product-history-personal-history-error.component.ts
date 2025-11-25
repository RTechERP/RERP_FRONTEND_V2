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
  selector: 'app-borrow-product-history-personal-history-error',
  templateUrl: './borrow-product-history-personal-history-error.component.html',
  styleUrls: ['./borrow-product-history-personal-history-error.component.css'],
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
export class BorrowProductHistoryPersonalHistoryErrorComponent implements OnInit {
  @ViewChild('tb_personalHistoryError', { static: false })
  tb_personalHistoryErrorContainer!: ElementRef;
  tb_personalHistoryErrorBody: any;
  ID: number = 0;
  constructor(
    public activeModal: NgbActiveModal,
    private borrowService: BorrowService,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
    this.loadPersonalHistoryError();
  }
  ngAfterViewInit(): void {
    this.drawTbPersonalHistoryError(this.tb_personalHistoryErrorContainer.nativeElement);
  }

  drawTbPersonalHistoryError(container: HTMLElement) {
    this.tb_personalHistoryErrorBody = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      selectableRows: 1, //make rows selectable

      columns:
        [
          {
            title: 'ID',
            field: 'ID',
            headerHozAlign: 'center',
            hozAlign: 'left',
            visible: false,
            frozen: true
          },

          {
            title: 'Tên',
            field: 'ProductName',
            headerHozAlign: 'center',
            hozAlign: 'left',
            frozen: true
          },
          {
            title: 'Mã sản phẩm',
            field: 'ProductCode',
            headerHozAlign: 'center',
            hozAlign: 'left',
            frozen: true
          },
          {
            title: 'Serial',
            field: 'SerialNumber',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Part Number',
            field: 'PartNumber',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Code',
            field: 'Serial',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Hãng',
            field: 'Maker',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Số lượng mượn',
            field: 'NumberBorrow',
            headerHozAlign: 'center',
            hozAlign: 'right'
          },
          {
            title: 'Vị trí (Hộp)',
            field: 'AddressBox',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Người mượn',
            field: 'FullName',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Ngày mượn',
            field: 'DateBorrow',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: function (cell) {
              const raw = cell.getValue();
              if (!raw) return "";
              try {
                return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
              } catch {
                return raw;
              }
            }
          },
          {
            title: 'Ngày dự kiến trả',
            field: 'DateReturnExpected',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: function (cell) {
              const raw = cell.getValue();
              if (!raw) return "";
              try {
                return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
              } catch {
                return raw;
              }
            }
          },
          {
            title: 'Ngày trả',
            field: 'DateReturn',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: function (cell) {
              const raw = cell.getValue();
              if (!raw) return "";
              try {
                return DateTime.fromISO(raw).toFormat('dd/MM/yyyy');
              } catch {
                return raw;
              }
            }
          },
          {
            title: 'Dự án',
            field: 'Project',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Note',
            field: 'Note',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Duyệt',
            field: 'AdminConfirm',
            formatter: 'tickCross',
            hozAlign: 'center',
            headerHozAlign: 'center'
          },
          {
            title: 'Mô tả lỗi',
            field: 'DescriptionError',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
        ],
    });

  }
  loadPersonalHistoryError() {
    this.borrowService.getPersonalHistoryError(this.ID).subscribe({
      next: (data) => {
        if (data.status == 1) {
          this.tb_personalHistoryErrorBody.setData(data.data);
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
