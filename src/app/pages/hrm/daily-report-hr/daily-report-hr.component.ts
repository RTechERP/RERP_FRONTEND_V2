import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload'; (window as any).luxon = { DateTime };
declare var bootstrap: any;
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DailyReportHrService } from './daily-report-hr-service/daily-report-hr.service';

@Component({
  selector: 'app-daily-report-hr',
  standalone: true,
  imports: [
    NzUploadModule,
    CommonModule,
    NzCardModule,
    FormsModule,
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
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule,
    NzModalModule
  ],

  templateUrl: './daily-report-hr.component.html',
  styleUrl: './daily-report-hr.component.css'
})
export class DailyReportHrComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private dailyReportHrService: DailyReportHrService,
  ) { }
  DateStart: Date | null = null;
  DateEnd: Date | null = null;
  Keyword: string = '';
  DepartmentID: number | null = null;
  UserID: number | null = null;
  EmployeeID: number | null = null;

  ngAfterViewInit(): void {

  }
  ngOnInit(): void {
    this.getDailyReportHr();
  }
 getDailyReportHr(): void {
    const payload = {
      // nếu không chọn ngày thì gửi null -> API tự set tuần hiện tại
      dateStart: this.DateStart ? this.DateStart.toISOString() : null,
      dateEnd: this.DateEnd ? this.DateEnd.toISOString() : null,
      keyword: this.Keyword || '',
      departmentID: this.DepartmentID || 0,
      userID: this.UserID || 0,
      employeeID: this.EmployeeID || 0
    };

    console.log('payload', payload);

    this.dailyReportHrService.getDailyReportHr(payload).subscribe({
      next: (res: any) => {
        console.log('res', res);
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error('Lỗi', err.error?.message || 'Không tải được dữ liệu');
      }
    });
  }

}
