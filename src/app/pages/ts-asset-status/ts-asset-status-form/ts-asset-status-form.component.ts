import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject
} from '@angular/core';
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
import { AssetStatusService } from '../ts-asset-status-service/ts-asset-status.service';

@Component({
  standalone: true,
  selector: 'app-ts-asset-status-form',
  templateUrl: './ts-asset-status-form.component.html',
  styleUrls: ['./ts-asset-status-form.component.css'],
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
  ]
})
export class TsAssetStatusFormComponent implements OnInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  assetStatus: string = "";
  assetStatusID: string = "";
  assetStatusData: any[] = [];
  private assetStatusService = inject(AssetStatusService);
  public activeModal = inject(NgbActiveModal);
  ngOnInit() {
    console.log('dataInput nhận được', this.dataInput);
    this.assetStatus = this.dataInput.Status;
    this.assetStatusID = this.dataInput.ID;
  }
  loadAssetStatus() {
    this.assetStatusService.getStatus().subscribe((resppon: any) => {
      this.assetStatusData = resppon.data;
    });
  }
  saveStatus() {
  if (!this.assetStatus.trim()) return;
  const isEditing = this.dataInput && this.dataInput.ID;
  const status = {
    ID: isEditing ? this.dataInput.ID : 0,
    Status: this.assetStatus.trim(),
    };
console.log("Payload edit unit",status);
  this.assetStatusService.SaveData(status).subscribe({
    next: () => {
      this.loadAssetStatus();
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
