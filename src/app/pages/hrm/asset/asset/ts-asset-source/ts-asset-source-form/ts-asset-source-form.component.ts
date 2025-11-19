import {Component,OnInit,Input,Output, EventEmitter, inject} from '@angular/core';
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
import { AssetsService } from '../ts-asset-source-service/ts-asset-source.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
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
  selector: 'app-ts-asset-source-form',
  templateUrl: './ts-asset-source-form.component.html',
  styleUrls: ['./ts-asset-source-form.component.css']
})
export class TsAssetSourceFormComponent implements OnInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  sourceCode: string = "";
  SourceName: string = "";
  sourceID: number = 0;
  sourceAssetData: any[] = [];
  private sourceService = inject(AssetsService);
    private notification = inject(NzNotificationService);
   public activeModal = inject(NgbActiveModal);
   ngOnInit() {
     console.log('dataInput nhận được:', this.dataInput);
     this.sourceID = this.dataInput.ID;
     this.sourceCode = this.dataInput.SourceCode;
     this.SourceName = this.dataInput.SourceName;
   }
   loadAssetType() {
     this.sourceService.getAssets().subscribe((resppon: any) => {
       this.sourceAssetData = resppon.data;
     });
   }
  save() {
  const code = this.sourceCode?.trim();
  const name = this.SourceName?.trim();

  if (!code || !name) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đầy đủ mã và tên nguồn gốc tài sản');
    return;
  }

  const assetID = this.dataInput?.ID || 0;
  const payloadType = {
    ID: assetID,
    SourceCode: code,
    SourceName: name,
    IsDeleted: false
  };

  console.log('payload type', payloadType);

  this.sourceService.SaveData(payloadType).subscribe({
    next: (res: any) => {
      if (res?.status === 1) {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu nguồn gốc tài sản thành công');
        this.loadAssetType();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      }
    },
    error: (res: any) => {
      this.notification.error(NOTIFICATION_TITLE.error, res?.error?.message || 'Không thể lưu loại tài sản');
    }
  });
}


   close() {
     this.closeModal.emit();
     this.activeModal.dismiss('cancel');
   }
 }
