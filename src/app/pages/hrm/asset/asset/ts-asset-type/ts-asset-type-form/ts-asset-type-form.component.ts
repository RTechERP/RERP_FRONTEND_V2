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
import { TypeAssetsService } from '../ts-asset-type-service/ts-asset-type.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
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
  selector: 'app-ty-asset-type-form',
  templateUrl: './ts-asset-type-form.component.html',
  styleUrls: ['./ts-asset-type-form.component.css']
})
export class TyAssetTypeFormComponent implements OnInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  assetCode: string = "";
  assetType: string = "";
  assetID: number = 0;
  typeAssetData: any[] = [];
  private typeAssetService = inject(TypeAssetsService);
  public activeModal = inject(NgbActiveModal);
      private notification = inject(NzNotificationService);
  ngOnInit() {
    console.log('dataInput nhận được:', this.dataInput);
    this.assetID = this.dataInput.ID;
    this.assetCode = this.dataInput.AssetCode;
    this.assetType = this.dataInput.AssetType;
  }
  loadAssetType() {
    this.typeAssetService.getTypeAssets().subscribe((resppon: any) => {
      this.typeAssetData = resppon.data;
    });
  }
saveAssetType() {
  const code = this.assetCode?.trim();
  const type = this.assetType?.trim();

  if (!code || !type) {
    this.notification.warning('Cảnh báo', 'Vui lòng nhập đầy đủ mã và tên loại tài sản');
    return;
  }

  const assetID = this.dataInput?.ID || 0;
  const payloadType = {
    ID: assetID,
    AssetCode: code,
    AssetType: type,
    IsDeleted: false
  };

  console.log('payload type', payloadType);

  this.typeAssetService.SaveData(payloadType).subscribe({
    next: (res: any) => {
      if (res?.status === 1) {
        this.notification.success('Thành công', 'Lưu loại tài sản thành công');
        this.loadAssetType();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      }
    },
    error: (res: any) => {
      this.notification.error('Lỗi', res?.error?.message || 'Không thể lưu loại tài sản');
    }
  });
}

close() {
  this.closeModal.emit();
  this.activeModal.dismiss('cancel');
}

}
