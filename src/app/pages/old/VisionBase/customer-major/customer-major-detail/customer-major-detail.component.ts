import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  TabulatorFull as Tabulator,
  RowComponent,
  CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { SelectControlComponent } from '../../../select-control/select-control.component';

import { CustomerServiceService } from '../../customer/customer-service/customer-service.service';
import { CustomerMajorService } from '../customer-major-service/customer-major.service';
@Component({
  selector: 'app-customer-major',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
    NzTreeSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './customer-major-detail.component.html',
  styleUrl: './customer-major-detail.component.css',
})
export class CustomerMajorDetailComponent implements OnInit, AfterViewInit {
  @Input() EditID!: number;
  @Input() isEditMode!: boolean;

  Code: any = '';
  Name: any = '';
  STT: number = 0;
  majorData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private customerService: CustomerServiceService,
    private customerMajorService: CustomerMajorService
  ) {}

  ngOnInit(): void {
    this.loadCustomerSpecialization();
  }

  ngAfterViewInit(): void {}

  loadCustomerSpecialization(): void {
    this.customerService.getCustomerSpecialization().subscribe({
      next: (response) => {
        if (response.status === 1) {
          if (this.isEditMode) {
            this.loadDetail(this.EditID);
          } else {
            this.majorData = response.data;
            this.STT = this.majorData.length + 1;
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });
  }

  loadDetail(id: number): void {
    this.customerMajorService.getDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.STT = response.data.STT;
          this.Code = response.data.Code;
          this.Name = response.data.Name;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      },
    });
  }

  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
  }

  save() {
    const model = {
      STT: this.STT,
      Code: this.Code,
      Name: this.Name,
    };
    this.customerMajorService.save(model).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thông báo', 'Lưu thành công');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(
            'Lỗi',
            res?.message || 'Không thể lưu dữ liệu'
          );
        }
      },
      error: (err: any) => {
        this.notification.error('Lỗi', err?.message || 'Không thể lưu dữ liệu');
      },
    });
  }
}
