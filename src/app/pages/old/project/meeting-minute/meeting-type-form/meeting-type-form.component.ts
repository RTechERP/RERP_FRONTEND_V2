import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectControlComponent } from '../../../select-control/select-control.component';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';

import { MeetingMinuteComponent } from '../meeting-minute.component';
import { MeetingMinuteService } from '../meeting-minute-service/meeting-minute.service';

interface MeetingType {
  GroupID: number;
  TypeCode: string;
  TypeName: string;
  TypeContent: string;
}
@Component({
  selector: 'app-meeting-type-form',
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
    NzSplitterModule,
    NzButtonModule,
    NzModalModule,
    FormsModule,
  ],
  templateUrl: './meeting-type-form.component.html',
  styleUrl: './meeting-type-form.component.css',
})
export class MeetingTypeFormComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
    this.newMeetingType = {
      GroupID: 0,
      TypeCode: '',
      TypeName: '',
      TypeContent: '',
    };
  }

  ngAfterViewInit(): void {}

  newMeetingType: MeetingType = {
    GroupID: 0,
    TypeCode: '',
    TypeName: '',
    TypeContent: '',
  };

  constructor(
    private notification: NzNotificationService,
    private meetingminuteService: MeetingMinuteService,
    private activeModal: NgbActiveModal,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) {}

  closeModal() {
    this.activeModal.close();
  }

  saveData() {
    // Add new product group
    const payload = {
      GroupID: this.newMeetingType.GroupID, 
      TypeCode: this.newMeetingType.TypeCode,
      TypeName: this.newMeetingType.TypeName,
      TypeContent: this.newMeetingType.TypeContent,
    };
    this.meetingminuteService.saveMeetingType(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning(
            'Thông báo',
            res.message || 'Không thể thêm nhóm!'
          );
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      },
    });
  }
}
