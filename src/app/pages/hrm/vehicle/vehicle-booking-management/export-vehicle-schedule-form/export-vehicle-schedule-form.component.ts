import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
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
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-export-vehicle-schedule-form',
  imports: [
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
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule
  ],
  templateUrl: './export-vehicle-schedule-form.component.html',
  styleUrl: './export-vehicle-schedule-form.component.css'
})
export class ExportVehicleScheduleFormComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal

  ) { }
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleBookingManagementService = inject(VehicleBookingManagementService);
  searchText: string = '';
  exportVehicleScheduleList: any[] = [];
  tb_ExportVehicleSchedule: Tabulator | null = null;
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0})
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 23, minute: 59, second: 59 })
    .toISO();

  onDateStartChange() {
    // Khi ngày bắt đầu thay đổi, cập nhật dateEnd nếu dateEnd < dateStart
    if (!this.dateStart) {
      return;
    }
    
    let startDate: DateTime;
    if (this.dateStart instanceof Date) {
      startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0 });
    } else {
      startDate = DateTime.fromISO(this.dateStart).set({ hour: 0, minute: 0, second: 0 });
    }
    
    if (!startDate.isValid) {
      return;
    }
    
    let endDate: DateTime;
    if (this.dateEnd instanceof Date) {
      endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59 });
    } else {
      endDate = DateTime.fromISO(this.dateEnd).set({ hour: 23, minute: 59, second: 59 });
    }
    
    if (endDate.isValid && endDate < startDate) {
      this.dateEnd = startDate.set({ hour: 23, minute: 59, second: 59 }).toISO();
    }
    
    // Đảm bảo dateStart có đúng format
    this.dateStart = startDate.toISO();
  }

  onDateEndChange() {
    // Khi ngày kết thúc thay đổi, cập nhật nếu dateEnd < dateStart
    if (!this.dateEnd) {
      return;
    }
    
    let startDate: DateTime;
    if (this.dateStart instanceof Date) {
      startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0 });
    } else {
      startDate = DateTime.fromISO(this.dateStart).set({ hour: 0, minute: 0, second: 0 });
    }
    
    let endDate: DateTime;
    if (this.dateEnd instanceof Date) {
      endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59 });
    } else {
      endDate = DateTime.fromISO(this.dateEnd).set({ hour: 23, minute: 59, second: 59 });
    }
    
    if (!endDate.isValid) {
      return;
    }
    
    if (startDate.isValid && endDate < startDate) {
      this.dateEnd = startDate.set({ hour: 23, minute: 59, second: 59 }).toISO();
      this.notification.warning('Thông báo', 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
      return;
    }
    
    // Đảm bảo dateEnd có đúng format
    this.dateEnd = endDate.toISO();
  }
  ngOnInit(): void {
    console.log("DateStart", this.dateStart)
    this.getVehicleSchedule();
  } 

  onSearch() {
    this.getVehicleSchedule();
  }
  getVehicleSchedule(){
    // Đảm bảo DateStart và DateEnd có đúng format với giờ phút giây
    let startDate: string;
    let endDate: string;
    
    try {
      if (!this.dateStart) {
        startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0 }).toISO() || '';
      } else if (this.dateStart instanceof Date) {
        startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0 }).toISO() || '';
      } else {
        startDate = DateTime.fromISO(this.dateStart).set({ hour: 0, minute: 0, second: 0 }).toISO() || '';
      }

      // Xử lý dateEnd - có thể là Date object, ISO string, hoặc Date string
      if (!this.dateEnd) {
        endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59 }).toISO() || '';
      } else if (this.dateEnd instanceof Date) {
        endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59 }).toISO() || '';
      } else {
        endDate = DateTime.fromISO(this.dateEnd).set({ hour: 23, minute: 59, second: 59 }).toISO() || '';
      }
      if (!startDate || !endDate) {
        this.notification.error('Thông báo', 'Ngày bắt đầu và ngày kết thúc không hợp lệ!');
        return;
      }
      
      const request = {
        StartDate: startDate,
        EndDate: endDate
      };
      
      console.log("request", request);
      this.vehicleBookingManagementService.getVehicleSchedule(request).subscribe({
        next: (response: any) => {
          console.log("tb_vehicleManagement", response.data);
          this.exportVehicleScheduleList = response.data || [];
          this.drawTbVehicleCategory();
          console.log("exportVehicleScheduleList", this.exportVehicleScheduleList)
        },
        error: (error) => {
          console.error('Lỗi:', error);
          this.notification.error('Thông báo', 'Lỗi khi tải dữ liệu lịch trình xe!');
        }
      });
    } catch (error) {
      console.error('Lỗi xử lý ngày:', error);
      this.notification.error('Thông báo', 'Lỗi khi xử lý ngày bắt đầu và ngày kết thúc!');
    }
  }
  //#region Vẽ bảng khảo sát dự án
  drawTbVehicleCategory() {
    this.tb_ExportVehicleSchedule = new Tabulator('#tb_ExportVehicleSchedule', {
    ...DEFAULT_TABLE_CONFIG,
    height: '81vh',
    paginationMode: 'local',
    paginationSizeSelector: [10, 30, 50, 100],
      data: this.exportVehicleScheduleList,
      columns: [
        {
          title: 'Buổi',
          field: 'TypeDate',
          headerHozAlign: 'center',
        },
        {
          title: 'Người đi',
          field: 'PassengerNames',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Điểm xuất phát',
          field: 'DepartureAddress',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Điểm đến',
          field: 'CompanyNameArrives',
          headerHozAlign: 'center',
          formatter: 'textarea',
        },
        {
          title: 'Giờ xuất phát',
          field: 'DepartureDate',
          headerHozAlign: 'center',
        },
        {
          title: 'Thời gian đến',
          field: 'TimeNeedPresent',
          headerHozAlign: 'center',
        },
        {
          title: 'Giờ về',
          field: 'ReturnDate',
          headerHozAlign: 'center',
        },
        {
          title: 'Note',
          field: 'Notes',
          headerHozAlign: 'center',
        }
      ],
    });

  }
  //#endregion
  async exportToExcel() {
    let table = this.tb_ExportVehicleSchedule;
    if (!table) return;
    let data = table.getData();
    if (!data || data.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lĩnh vực dự án');
    const columns = table.getColumns();

    const headers = columns.map(
      (col: any) => col.getDefinition().title
    );
    const headerRow = worksheet.addRow(headers);


    // Gán style màu xám cho từng ô trong dòng header
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D9D9D9' }, // Màu xám nhạt
      };
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });



    data.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    const startRow = 2;
    const column = 'A';

    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount - 2; i += 3) {
      const cell1 = worksheet.getCell(`${column}${i}`);
      const cell2 = worksheet.getCell(`${column}${i + 1}`);
      const cell3 = worksheet.getCell(`${column}${i + 2}`);

      if (cell1.value === cell2.value && cell1.value === cell3.value) {
        worksheet.mergeCells(`${column}${i}:${column}${i + 2}`);
        // Căn giữa nếu cần
        cell1.alignment = { vertical: 'middle' };
      }
    }

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: columns.length,
      },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.alignment = {
          ...cell.alignment,
          wrapText: true,
          vertical: 'middle', // tùy chọn: căn giữa theo chiều dọc
        };
      });
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Format ngày tháng hiện tại: dd-MM-yyyy
    const now = DateTime.local();
    const formattedDate = now.toFormat('dd-MM-yyyy');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Lịch trình xe - ${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
