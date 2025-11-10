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

import { PlanWeekService } from '../../plan-week/plan-week-services/plan-week.service';

@Component({
  selector: 'app-plan-week-detail',
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
  ],
  templateUrl: './plan-week-detail.component.html',
  styleUrl: './plan-week-detail.component.css',
})
export class PlanWeekDetailComponent implements OnInit, AfterViewInit {
  @Input() UserID!: number;
  @Input() isEditMode!: boolean;

  @ViewChild('tb_MainTable', { static: false })
  tb_MainTableElement!: ElementRef;

  private tb_MainTable!: Tabulator;

  filters: any = {
    startDate: new Date(),
    endDate: new Date(),
    userId: 0, //Cần truyền ID người dùng hiện tại vào để thêm mới kế hoạch tuần theo đúng user đó
  };
  filterUserData: any[] = [];
  mainData: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private planWeekService: PlanWeekService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {}

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
    console.log('UserID nhận được từ component cha', this.UserID);
  }

  ngAfterViewInit(): void {
    this.initMainTable();
  }

  closeModal() {
    this.activeModal.close();
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

          if (this.isEditMode === true) {
            this.filters.userId = this.UserID;
            let user = this.filterUserData.find((x) => x.UserID == this.UserID);
            console.log('User:', user);
            this.loadMainData(
              this.filters.startDate,
              this.filters.endDate,
              this.filters.userId
            );
          } else {
            this.loadMainData(
              this.filters.startDate,
              this.filters.endDate,
              this.filters.userId
            );
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

  loadMainData(startDate: Date, endDate: Date, userId: number) {
    this.planWeekService.getData(startDate, endDate, 0, userId, 0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.mainData = response.data.data1;
          if (this.tb_MainTable) {
            this.tb_MainTable.setColumns([]);
            this.tb_MainTable.setData(this.mainData);
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

  saveAndClose() {
    const DATA = this.tb_MainTable
      .getData()
      .filter((row: any) => row?._dirty === true)
      .map((row: any) => ({
        ...row,
        UserID: row?.UserID || this.filters.userId || this.UserID || 0,
      }));
    if (DATA.length === 0) {
      this.notification.info('Thông báo', 'Không có thay đổi để lưu');
      this.activeModal.close({ success: false, reloadData: false });
      return;
    }
    this.planWeekService.save(DATA).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.notification.success('Thông báo', 'Lưu thành công');
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
        this.notification.error('Lỗi', error?.error?.message || 'Không thể lưu dữ liệu');
      },
    });
  }

  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      layout: 'fitColumns',
      height: '75vh',
      selectableRows: 1,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      autoColumns: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: 'center',
        minWidth: 60,
        resizable: true,
      },
      autoColumnsDefinitions: (definitions: any[] = []) => {
        const cols = definitions.map((def: any) => {
          if (def.field === 'ID') {
            return { ...def, visible: false };
          }
          if (def.field === 'UserID') {
            return { ...def, visible: false };
          }
          if (def.field === 'DatePlan') {
            return {
              ...def,
              title: 'Ngày',
              formatter: (cell: any) => {
                const value = cell.getValue();
                if (!value) return '';
                const date = new Date(value);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
              },
              width: 100,
            };
          }
          if (def.field === 'ContentPlan') {
            return { ...def, title: 'Nội dung', editor: 'input' };
          }
          if (def.field === 'Result') {
            return { ...def, title: 'Kết quả mong đợi', editor: 'input' };
          }
          return def;
        });

        cols.unshift({
          title: '',
          field: 'actions',
          hozAlign: 'center',
          width: 50,
          headerSort: false,
          formatter: (_cell: any) => {
            return `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`;
          },
          cellClick: (_e: any, cell: any) => {
            this.modal.confirm({
              nzTitle: 'Xác nhận xóa',
              nzContent: 'Bạn có chắc chắn muốn xóa dòng này?',
              nzOkText: 'Đồng ý',
              nzCancelText: 'Hủy',
              nzOnOk: () => {
                const row = cell.getRow();
                const data = row.getData();
                data.IsDeleted = true;
                data._dirty = true;
                row.update({
                  ContentPlan: '',
                  Result: '',
                });
              },
            });
          },
        });

        return cols;
      },
    });
    this.tb_MainTable.on('cellEdited', (cell: any) => {
      const row = cell.getRow();
      const data = row.getData();
      data._dirty = true;
      row.update(data);
    });
  }
}
