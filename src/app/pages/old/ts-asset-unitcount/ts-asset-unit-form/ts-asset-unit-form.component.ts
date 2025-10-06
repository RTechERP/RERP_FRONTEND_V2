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

import { UnitService } from '../ts-asset-unit-service/ts-asset-unit.service';

@Component({
  standalone: true,
  selector: 'app-ts-asset-unit-form',
  templateUrl: './ts-asset-unit-form.component.html',
  styleUrls: ['./ts-asset-unit-form.component.css'],
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
export class TsAssetUnitFormComponent implements OnInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  modalTitle = 'Đơn vị tính';

  newUnitName = '';
  unit: any[] = [];
  editingUnitId: number | null = null;
  private unitService = inject(UnitService);
  public activeModal = inject(NgbActiveModal); 
  ngOnInit() {
    console.log('dataInput nhận được:', this.dataInput);
      this.newUnitName = this.dataInput.UnitName || '';
      this.editingUnitId = this.dataInput.ID || null;
    this.loadUnits();
  }

  private loadUnits() {
    this.unitService.getUnit().subscribe((respon: any) => {
      this.unit = respon.data;
    });
  }
saveUnit() {
  if (!this.newUnitName.trim()) return;
  const isEditing = this.dataInput && this.dataInput.ID;
  const unit = {
    ID: isEditing ? this.dataInput.ID : 0,
    UnitCode: this.newUnitName.trim(),
    UnitName: this.newUnitName.trim(),
    IsDeleted:false  };
console.log("Payload edit unit",unit);
  this.unitService.SaveData([unit]).subscribe({
    next: () => {
      this.loadUnits();
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
