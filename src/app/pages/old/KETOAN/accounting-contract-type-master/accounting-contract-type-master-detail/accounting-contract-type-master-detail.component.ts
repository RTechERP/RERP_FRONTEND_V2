import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
  viewChild,
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
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AccountingContractTypeMasterService } from '../accounting-contract-type-master-service/accounting-contract-type-master.service';

@Component({
  selector: 'app-accounting-contract-type-master-detail',
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
    NzCollapseModule,
    NzFormModule,
  ],
  templateUrl: './accounting-contract-type-master-detail.component.html',
  styleUrl: './accounting-contract-type-master-detail.component.css'
})
export class AccountingContractTypeMasterDetailComponent implements OnInit, AfterViewInit {
  @Input() editData: any = null;
  @Input() isEditMode: boolean = false;

  formData: any = {
    ID: 0,
    TypeCode: '',
    TypeName: '',
    STT: 0,
    IsContractValue: false
  };

  constructor(
    public activeModal: NgbActiveModal,
    private accountingContractTypeMasterService: AccountingContractTypeMasterService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ){}

  ngOnInit(): void {
    this.loadFormData();
  }

  ngAfterViewInit(): void {
    this.loadFormData();
  }

  private loadFormData(): void {
    if (this.editData) {
      this.formData = {
        ID: this.editData.ID || 0,
        TypeCode: this.editData.TypeCode || '',
        TypeName: this.editData.TypeName || '',
        STT: this.editData.STT || 0,
        IsContractValue: this.editData.IsContractValue || false
      };
    } else if (!this.isEditMode) {
      this.formData = {
        ID: 0,
        TypeCode: '',
        TypeName: '',
        STT: this.editData.STT,
        IsContractValue: false
      };
    }
  }

  saveAndClose() {
    // Validate
    if (!this.formData.TypeCode || this.formData.TypeCode.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Mã loại');
      return;
    }
    if (!this.formData.TypeName || this.formData.TypeName.trim() === '') {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Tên loại');
      return;
    }

    // Prepare data to send (matching API format)
    const requestData = {
      ID: this.formData.ID || 0,
      STT: this.formData.STT || 0,
      TypeCode: this.formData.TypeCode.trim(),
      TypeName: this.formData.TypeName.trim(),
      IsContractValue: this.formData.IsContractValue || false
    };

    // Call service to save
    this.accountingContractTypeMasterService.saveData(requestData).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể lưu dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
  }
}
