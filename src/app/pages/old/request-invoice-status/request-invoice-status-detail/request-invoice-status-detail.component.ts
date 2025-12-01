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
import { OnInit, AfterViewInit } from '@angular/core';
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
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { RequestInvoiceStatusLinkService } from '../../request-invoice-status-link/request-invoice-status-link-service/request-invoice-status-link.service';

@Component({
  selector: 'app-request-invoice-status-detail',
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
    HasPermissionDirective
  ],
  templateUrl: './request-invoice-status-detail.component.html',
  styleUrl: './request-invoice-status-detail.component.css'
})
export class RequestInvoiceStatusDetailComponent implements OnInit, AfterViewInit {
  @Input() isEditMode = false;
  @Input() dataEdit: any;

  StatusCode: string = "";
  StatusName: string = "";
  ID: number = 0;
  
  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    private requestInvoiceStatusLinkService: RequestInvoiceStatusLinkService
  ){}
  
  ngOnInit(): void {
    if (this.isEditMode && this.dataEdit) {
      this.ID = this.dataEdit.ID;
      this.StatusCode = this.dataEdit.StatusCode;
      this.StatusName = this.dataEdit.StatusName;
    }
  }

  ngAfterViewInit(): void {

  }

  closeModal() {
    this.activeModal.close();
  }

  saveAndClose() {
    const payload = {
      ID: this.ID ?? 0,
      StatusCode: this.StatusCode,
      StatusName: this.StatusName
    };
  
    if (!payload.StatusCode || !payload.StatusName) {
      this.notification.error("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }
  
    this.requestInvoiceStatusLinkService.saveStatus(payload).subscribe({
      next: (res) => {
        this.notification.success("Thành công", "Lưu trạng thái thành công!");
        this.activeModal.close({ success: true, reloadData: true });
      },
      error: () => {
        this.notification.error("Lỗi", "Lưu dữ liệu thất bại!");
      }
    });
  }
}
