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
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { CustomerDetailComponent } from '../../../../crm/customers/customer-detail/customer-detail.component';

import { PlanWeekSharkTeamService } from '../../plan-week-shark-team/plan-week-shark-team-services/plan-week-shark-team.service';

@Component({
  selector: 'app-plan-week-shark-team-detail',
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
    NzDividerModule,
  ],
  templateUrl: './plan-week-shark-team-detail.component.html',
  styleUrl: './plan-week-shark-team-detail.component.css',
})
export class PlanWeekSharkTeamDetailComponent implements OnInit, AfterViewInit {
  @Input() UserID!: number;
  @Input() isEditMode!: boolean;

  filters: any = {
    startDate: new Date(),
    endDate: new Date(),
    userId: 0,
  };
  filterUserData: any[] = [];
  mainData: any[] = []; // Each item: { DatePlan, tasks: [...] }
  customers: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private planWeekService: PlanWeekSharkTeamService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    const today = new Date();

    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    monday.setHours(0, 0, 0);
    sunday.setHours(23, 59, 59);

    this.filters.startDate = monday;
    this.filters.endDate = sunday;
    this.loadUser();
    this.loadCustomers();
    console.log('UserID nhận được từ component cha', this.UserID);
  }

  ngAfterViewInit(): void { }

  closeModal() {
    this.activeModal.close({ success: false, reloadData: false });
  }

  openCustomerModal(): void {
    const modalRef = this.modalService.open(CustomerDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result && result.success) {
          this.loadCustomers();
        }
      },
      (reason) => {}
    );
  }

  increaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.userId
    );
  }

  decreaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.userId
    );
  }

  loadUser() {
    this.planWeekService.getEmployees(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;

          this.filters.userId = this.UserID;
          let user = this.filterUserData.find((x) => x.UserID == this.UserID);
          console.log('User:', user);
          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.userId
          );
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  loadCustomers() {
    this.planWeekService.getCustomers().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.customers = response.data || [];
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách khách hàng');
      },
    });
  }

  loadMainData(startDate: Date, endDate: Date, userId: number) {
    this.planWeekService.getData(startDate, endDate, 0, userId, 0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const allData: any[] = response.data.data1 || [];
          // Filter by userId to only show the selected user's data
          const rawData = allData.filter((row: any) => row.UserID === userId);

          // Group existing records by date key
          const dayMap = new Map<string, any[]>();
          for (const row of rawData) {
            const dateKey = this.formatDate(row.DatePlan);
            if (!dayMap.has(dateKey)) {
              dayMap.set(dateKey, []);
            }
            dayMap.get(dateKey)!.push({
              ID: row.ID || 0,
              ContentPlan: row.ContentPlan || '',
              Problem: row.Problem || '',
              CustomerID: row.CustomerID || null,
              UserID: row.UserID || 0,
              _dirty: false,
              IsDeleted: false,
            });
          }

          // Generate all 7 days from startDate to endDate
          this.mainData = [];
          const current = new Date(startDate);
          current.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          while (current <= end) {
            const dateKey = this.formatDate(current);
            const existingTasks = dayMap.get(dateKey);

            this.mainData.push({
              DatePlan: new Date(current),
              tasks: existingTasks && existingTasks.length > 0
                ? existingTasks
                : [{
                  ID: 0,
                  ContentPlan: '',
                  Problem: '',
                  CustomerID: null,
                  UserID: userId,
                  _dirty: false,
                  IsDeleted: false,
                }],
            });

            current.setDate(current.getDate() + 1);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, error);
      },
    });
  }

  saveAndClose() {
    // Flatten all tasks from all days into a single array
    const DATA: any[] = [];
    for (const day of this.mainData) {
      for (const task of day.tasks) {
        if (task._dirty === true) {
          if (!task.IsDeleted) {
            const isCompletelyEmptyAndNew = task.ID === 0 && !task.ContentPlan?.trim() && !task.Problem?.trim() && (!task.CustomerID || task.CustomerID === 0);
            if (isCompletelyEmptyAndNew) {
              continue;
            }
            if (!task.CustomerID || task.CustomerID === 0) {
              this.notification.error('Lỗi', `Vui lòng chọn khách hàng cho công việc ngày ${this.formatDate(day.DatePlan)}`);
              return;
            }
          }

          DATA.push({
            ID: task.ID || 0,
            DatePlan: this.toLocalISOString(day.DatePlan),
            UserID: task.UserID || this.filters.userId || this.UserID || 0,
            ContentPlan: task.ContentPlan || '',
            Problem: task.Problem || '',
            CustomerID: task.CustomerID || 0,
            IsDeleted: task.IsDeleted || false,
          });
        }
      }
    }

    if (DATA.length === 0) {
      this.notification.info('Thông báo', 'Không có thay đổi để lưu');
      this.activeModal.close({ success: false, reloadData: false });
      return;
    }
    this.planWeekService.save(DATA).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Lưu thành công'
          );
          this.UserID = 0;
          this.isEditMode = false;
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.error(
            'Lỗi',
            response?.message || 'Không thể lưu dữ liệu'
          );
        }
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Không thể lưu dữ liệu'
        );
      },
    });
  }

  // Methods cho form dynamic
  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  onTaskFieldChange(task: any): void {
    task._dirty = true;
  }

  addTask(dayItem: any): void {
    dayItem.tasks.push({
      ID: 0,
      ContentPlan: '',
      Problem: '',
      CustomerID: null,
      UserID: this.filters.userId || this.UserID || 0,
      _dirty: true,
      IsDeleted: false,
    });
  }

  removeTask(dayItem: any, taskIndex: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const task = dayItem.tasks[taskIndex];
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa công việc này?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (task.ID > 0) {
          // Existing record: mark as deleted
          task.IsDeleted = true;
          task._dirty = true;
          task.ContentPlan = '';
          task.Problem = '';
          task.CustomerID = null;
        } else {
          // New record: just remove from array
          dayItem.tasks.splice(taskIndex, 1);
        }
      },
    });
  }

  allTasksDeleted(item: any): boolean {
    return item.tasks.length === 0 || item.tasks.every((t: any) => t.IsDeleted);
  }

  deleteItem(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent:
        'Bạn có chắc chắn muốn xóa kế hoạch ngày ' +
        this.formatDate(item.DatePlan) +
        '?',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for (const task of item.tasks) {
          task.IsDeleted = true;
          task._dirty = true;
          task.ContentPlan = '';
          task.Problem = '';
          task.CustomerID = null;
        }
      },
    });
  }

  toLocalISOString(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0') +
      'T' +
      String(date.getHours()).padStart(2, '0') +
      ':' +
      String(date.getMinutes()).padStart(2, '0') +
      ':' +
      String(date.getSeconds()).padStart(2, '0')
    );
  }
}
