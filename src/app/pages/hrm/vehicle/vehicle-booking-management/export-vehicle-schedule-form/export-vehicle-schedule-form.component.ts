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
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
  import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-vehicle-schedule-form',
  imports: [
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
    groupedScheduleData: any[] = [];
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0 })
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
  getVehicleSchedule() {
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
            this.processGroupedData();
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
    //#region Xử lý dữ liệu group theo xe và buổi
    processGroupedData() {
      // Group theo thông tin xe (VehicleInformation hoặc tên xe)
      const vehicleGroups = new Map<string, any[]>();
      
      this.exportVehicleScheduleList.forEach((item: any) => {
        // Lấy thông tin xe - có thể là VehicleInformation hoặc tên xe khác
        const vehicleKey = item.VehicleInformation || item.VehicleName || item.VehicleInfo || 'Chưa có thông tin xe';
        
        if (!vehicleGroups.has(vehicleKey)) {
          vehicleGroups.set(vehicleKey, []);
        }
        vehicleGroups.get(vehicleKey)!.push(item);
      });

      // Xử lý từng nhóm xe: group theo ngày và buổi
      this.groupedScheduleData = Array.from(vehicleGroups.entries()).map(([vehicleInfo, items]) => {
        // Group theo ngày và buổi
        const dayGroups = new Map<string, any[]>();
        
        items.forEach((item: any) => {
          // Lấy ngày từ DepartureDateRegister (ngày đăng ký), nếu không có thì dùng DepartureDate
          let dateKey = '';
          const dateSource = item.DepartureDateRegister || item.DepartureDate;
          if (dateSource) {
            try {
              const date = new Date(dateSource);
              // Kiểm tra date hợp lệ
              if (!isNaN(date.getTime())) {
                dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              }
            } catch (e) {
              console.warn('Invalid date:', dateSource);
            }
          }
          
          // Kết hợp ngày và buổi
          const daySessionKey = `${dateKey}_${item.TypeDate || ''}`;
          
          if (!dayGroups.has(daySessionKey)) {
            dayGroups.set(daySessionKey, []);
          }
          dayGroups.get(daySessionKey)!.push(item);
        });

        // Chuyển đổi thành mảng với thông tin ngày và buổi
        const daySessions = Array.from(dayGroups.entries()).map(([daySessionKey, sessionItems]) => {
          const [dateKey, session] = daySessionKey.split('_');
          return {
            date: dateKey,
            session: session || '',
            items: sessionItems
          };
        });

        // Sắp xếp theo ngày và buổi (sáng trước, chiều sau)
        daySessions.sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          // Sáng (Sáng, Morning) trước, Chiều (Chiều, Afternoon) sau
          const sessionOrder: any = { 'Sáng': 1, 'Morning': 1, 'Chiều': 2, 'Afternoon': 2, '': 0 };
          return (sessionOrder[a.session] || 0) - (sessionOrder[b.session] || 0);
        });

        return {
          vehicleInfo: vehicleInfo,
          daySessions: daySessions,
          totalItems: items.length
        };
      });

      // Sắp xếp các nhóm xe
      this.groupedScheduleData.sort((a, b) => a.vehicleInfo.localeCompare(b.vehicleInfo));
    }

    formatDate(dateString: string): string {
      if (!dateString || dateString.trim() === '') return '';
      
      try {
        let date: Date;
        
        // Xử lý format YYYY-MM-DD
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const day = parseInt(parts[2], 10);
            
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              date = new Date(year, month, day);
            } else {
              date = new Date(dateString);
            }
          } else {
            date = new Date(dateString);
          }
        } else {
          date = new Date(dateString);
        }
        
        // Kiểm tra date hợp lệ
        if (isNaN(date.getTime())) {
          return '';
        }
        
        const dd = String(date.getDate()).padStart(2, '0');
        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        
        // Kiểm tra lại các giá trị
        if (isNaN(parseInt(dd)) || isNaN(parseInt(MM)) || isNaN(yyyy)) {
          return '';
        }
        
        return `${dd}/${MM}/${yyyy}`;
      } catch (e) {
        console.warn('Error formatting date:', dateString, e);
        return '';
      }
    }

  private parseTimeToJsDateOrString(value: any): Date | string | '' {
    if (!value) return '';

    // Nếu đã là Date rồi thì trả ra luôn
    if (value instanceof Date) return value;

    if (typeof value === 'string') {
      const raw = value.trim();

      // Case chỉ có giờ: "HH:mm"
      if (/^\d{1,2}:\d{2}$/.test(raw)) {
        // Cho Excel hiển thị dạng text "08:00" là đủ
        return raw;
      }

      // Case datetime SQL: "2024-11-28 08:00:00.000"
      const dtSql = DateTime.fromSQL(raw); // Luxon hiểu format SQL này
      if (dtSql.isValid) {
        return dtSql.toJSDate();
      }

      // Fallback: ISO format hoặc các format khác
      const dtISO = DateTime.fromISO(raw);
      if (dtISO.isValid) {
        return dtISO.toJSDate();
      }

      // Fallback: new Date
      const jsDate = new Date(raw);
      if (!isNaN(jsDate.getTime())) {
        return jsDate;
      }

      return '';
    }

    return '';
  }

  formatDateTime(dateString: string | Date): string {
    if (!dateString) return '';
    
    try {
      // Nếu là string dạng "08:00" thì trả về luôn
      if (typeof dateString === 'string' && /^\d{1,2}:\d{2}$/.test(dateString.trim())) {
        return dateString.trim();
      }
      
      let date: Date;
      
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        // Thử parse bằng Luxon trước (SQL format)
        let dt = DateTime.fromSQL(dateString);
        if (!dt.isValid) {
          // Thử ISO format
          dt = DateTime.fromISO(dateString);
        }
        if (dt.isValid) {
          date = dt.toJSDate();
        } else {
          date = new Date(dateString);
        }
      } else {
        return '';
      }
      
      // Kiểm tra date hợp lệ
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const dd = String(date.getDate()).padStart(2, '0');
      const MM = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      
      // Kiểm tra lại các giá trị
      if (isNaN(parseInt(dd)) || isNaN(parseInt(MM)) || isNaN(yyyy)) {
        return '';
      }
      
      // Format: dd/MM/yyyy HH:mm:ss
      return `${dd}/${MM}/${yyyy} ${hh}:${mm}:${ss}`;
    } catch (e) {
      console.warn('Error formatting datetime:', dateString, e);
      return '';
    }
  }

    getCellBorderStyle(isFirstRow: boolean, isLastRow: boolean, isRowspanCell: boolean): any {
      const style: any = {
        'border-left': '1px solid #D3D3D3',
        'border-right': '1px solid #D3D3D3'
      };
      
      // Border top: đậm cho dòng đầu, mỏng cho các dòng khác
      if (isFirstRow) {
        style['border-top'] = '2px solid #808080';
      } else {
        style['border-top'] = '1px solid #D3D3D3';
      }
      
      // Border bottom: đậm cho dòng cuối, mỏng cho các dòng khác
      if (isLastRow) {
        style['border-bottom'] = '2px solid #808080';
      } else {
        style['border-bottom'] = '1px solid #D3D3D3';
      }
      
      return style;
    }

  //#endregion
  async exportToExcel() {
      if (!this.groupedScheduleData || this.groupedScheduleData.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lịch trình xe');

      // Thêm dòng header "Lịch Trình Xe" bọc toàn bộ
    const titleRow = worksheet.addRow(['Lịch Trình Xe']);
    
    // Merge tất cả các cột cho dòng title (merge trước khi set style)
    worksheet.mergeCells(1, 1, 1, 9);
    
    // Set style cho merged cell
    const titleCell = titleRow.getCell(1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00ba25' }, // Màu xanh lá (#00ba25) giống HTML
    };
    titleCell.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' }, // Màu trắng
      size: 14
    };
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: false
    };
    titleCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    titleRow.height = 30;

    const headers = ['Ngày', 'Buổi', 'Người đi', 'Điểm xuất phát', 'Điểm đến', 'Giờ xuất phát', 'Thời gian đến', 'Giờ về', 'Ghi chú'];
    const headerRow = worksheet.addRow(headers);

      // Gán style màu cho header (màu xanh dương cho các cột thường, màu cam cho cột giờ)
    headerRow.eachCell((cell, colNumber) => {
      // Cột 6, 7, 8 (Giờ xuất phát, Thời gian đến, Giờ về) dùng màu cam #e39540
      // Các cột khác dùng màu xanh dương #4472C4
      const isTimeColumn = colNumber === 6 || colNumber === 7 || colNumber === 8;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isTimeColumn ? 'FFe39540' : 'FF4472C4' }, // Màu cam cho cột giờ, xanh dương cho cột khác
      };
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' }, // Màu trắng cho chữ
        size: 12
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

      // Đặt chiều cao cho header
      headerRow.height = 25;

      // Set width cố định cho các cột (trước khi tự động tính)
      worksheet.getColumn(1).width = 10; // Ngày
      worksheet.getColumn(2).width = 12; // Buổi (tăng từ 8)
      worksheet.getColumn(6).width = 15; // Giờ xuất phát
      worksheet.getColumn(7).width = 15; // Thời gian đến
      worksheet.getColumn(8).width = 15; // Giờ về

      let currentRow = 3; // Bắt đầu từ dòng 3 (dòng 1: title, dòng 2: header)
      
      // Duyệt qua từng nhóm xe
      this.groupedScheduleData.forEach((vehicleGroup) => {
        const vehicleInfo = vehicleGroup.vehicleInfo;
        
        // Thêm dòng header cho thông tin xe
        const vehicleHeaderRow = worksheet.addRow([`Thông tin xe: ${vehicleInfo}`]);
        
        // Merge tất cả các cột cho dòng header xe (phải merge trước khi set style)
        worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
        
        // Set style cho merged cell
        const mergedCell = vehicleHeaderRow.getCell(1);
        mergedCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFffcbee' }, // Màu hồng (#ffcbee) giống HTML
        };
        mergedCell.font = { 
          bold: true, 
          color: { argb: 'FF000000' }, // Màu đen
          size: 12
        };
        mergedCell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center'
        };
        mergedCell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        vehicleHeaderRow.height = 20;
        
        currentRow++;
        
        // Duyệt qua từng ngày/buổi
        vehicleGroup.daySessions.forEach((daySession: any) => {
          const date = daySession.date;
          const session = daySession.session;
          
          // Ghi nhớ dòng bắt đầu của block này
          const startRowForDaySession = currentRow;
          
          // Duyệt qua từng item trong buổi
          daySession.items.forEach((item: any, itemIndex: number) => {
            // Lấy ngày từ DepartureDateRegister nếu có, nếu không thì dùng date từ daySession
            let displayDate = date ? this.formatDate(date) : '';
            if (!displayDate && item.DepartureDateRegister) {
              displayDate = this.formatDate(item.DepartureDateRegister);
            }
            
            const rowData = [
              // Chỉ set giá trị cho dòng đầu, các dòng sau để '' để merge cho đẹp
              itemIndex === 0 ? displayDate : '',
              itemIndex === 0 ? session : '',
              item.PassengerNames || '',               // Người đi
              item.DepartureAddress || '',             // Điểm xuất phát
              item.CompanyNameArrives || '',           // Điểm đến
              this.parseTimeToJsDateOrString(item.DepartureDate || item.TimeLeave),    // Giờ xuất phát
              this.parseTimeToJsDateOrString(item.TimeNeedPresent || item.TimeArrive), // Thời gian đến
              this.parseTimeToJsDateOrString(item.ReturnDate || item.TimeReturn),      // Giờ về
              item.Notes || ''                         // Ghi chú
            ];
            
            worksheet.addRow(rowData);
            currentRow++;
          });
          
          // Merge cột "Ngày" (col 1) và "Buổi" (col 2) để giống rowspan trên UI
          const endRowForDaySession = currentRow - 1;
          
          if (endRowForDaySession > startRowForDaySession) {
            // Merge cột Ngày
            worksheet.mergeCells(startRowForDaySession, 1, endRowForDaySession, 1);
            // Merge cột Buổi
            worksheet.mergeCells(startRowForDaySession, 2, endRowForDaySession, 2);
            
            // Căn giữa + giữa dọc cho cell đã merge
            const dateCell = worksheet.getCell(startRowForDaySession, 1);
            dateCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            
            const sessionCell = worksheet.getCell(startRowForDaySession, 2);
            sessionCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          }
        });
      });

      // Format cột có giá trị là Date và thêm border
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || rowNumber === 2) return; // bỏ qua dòng title và header
        
        // Kiểm tra xem có phải dòng header xe không (chứa "Thông tin xe:")
        const firstCellValue = row.getCell(1).value;
        const isVehicleHeader = typeof firstCellValue === 'string' && firstCellValue.includes('Thông tin xe:');
        
        if (isVehicleHeader) {
          // Dòng header xe đã được format ở trên, chỉ cần thêm border (chỉ border ngang đậm)
          row.getCell(1).border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
          return;
        }
        
        // Xác định dòng đầu và cuối của nhóm xe
        let isFirstDataRow = false;
        let isLastDataRow = false;
        
        // Kiểm tra dòng tiếp theo có phải là header xe không
        const nextRow = worksheet.getRow(rowNumber + 1);
        const nextRowFirstCell = nextRow?.getCell(1)?.value;
        const isNextRowVehicleHeader = typeof nextRowFirstCell === 'string' && nextRowFirstCell.includes('Thông tin xe:');
        
        // Kiểm tra dòng trước có phải là header xe không
        const prevRow = worksheet.getRow(rowNumber - 1);
        const prevRowFirstCell = prevRow?.getCell(1)?.value;
        const isPrevRowVehicleHeader = typeof prevRowFirstCell === 'string' && prevRowFirstCell.includes('Thông tin xe:');
        
        isFirstDataRow = isPrevRowVehicleHeader;
        isLastDataRow = isNextRowVehicleHeader || rowNumber === worksheet.rowCount;
        
      row.eachCell((cell, colNumber) => {
        // Set font size 12px cho tất cả các cell
        cell.font = { ...cell.font, size: 12 };
        
        // Format cho các cột thời gian (cột 6, 7, 8: Giờ xuất phát, Thời gian đến, Giờ về)
        if (cell.value instanceof Date) {
          // Nếu là Date thì format đầy đủ ngày giờ
          cell.numFmt = 'dd/mm/yyyy hh:mm:ss';
        } else if (typeof cell.value === 'string' && /^\d{1,2}:\d{2}$/.test(cell.value.trim())) {
          // Nếu là string dạng "08:00" thì giữ nguyên, không cần format
          // Excel sẽ hiển thị như text
        }
        
        // Set alignment theo loại cột
        // Cột 1: Ngày - căn giữa
        // Cột 2: Buổi - căn giữa
        // Cột 3, 4, 5, 9: Chữ (Người đi, Điểm xuất phát, Điểm đến, Ghi chú) - căn trái
        // Cột 6, 7, 8: Giờ (Giờ xuất phát, Thời gian đến, Giờ về) - căn giữa
        if (colNumber === 1 || colNumber === 2) {
          // Ngày và Buổi: căn giữa
          cell.alignment = { ...cell.alignment, horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
          // Các cột giờ: căn giữa
          cell.alignment = { ...cell.alignment, horizontal: 'center', vertical: 'middle' };
        } else {
          // Các cột chữ: căn trái
          cell.alignment = { ...cell.alignment, horizontal: 'left', vertical: 'top', wrapText: true };
        }
        
        // Thêm border: đậm cho dòng đầu/cuối, mỏng cho các dòng khác
        const border: any = {
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
        
        // Border top: đậm cho dòng đầu, mỏng cho các dòng khác
        if (isFirstDataRow) {
          border.top = { style: 'medium', color: { argb: 'FF808080' } };
        } else {
          border.top = { style: 'thin', color: { argb: 'FFD3D3D3' } };
        }
        
        // Border bottom: đậm cho dòng cuối, mỏng cho các dòng khác
        if (isLastDataRow) {
          border.bottom = { style: 'medium', color: { argb: 'FF808080' } };
        } else {
          border.bottom = { style: 'thin', color: { argb: 'FFD3D3D3' } };
        }
        
        cell.border = border;
      });
    });

        // Tự động căn chỉnh độ rộng cột với tính toán tốt hơn (bỏ qua các cột đã set width cố định)
      worksheet.columns.forEach((column: any, index: number) => {
        // Bỏ qua các cột đã set width cố định: 1 (Ngày), 2 (Buổi), 6 (Giờ xuất phát), 7 (Thời gian đến), 8 (Giờ về)
        if (index === 0 || index === 1 || index === 5 || index === 6 || index === 7) {
          return; // Giữ nguyên width đã set
        }
        
        let maxLength = 10;
        let maxLines = 1;
        
        // Tính độ dài cho header
        const headerValue = headers[index] ? headers[index].toString() : '';
        maxLength = Math.max(maxLength, headerValue.length);
        
        // Tính độ dài cho các ô dữ liệu
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          if (cell.value !== null && cell.value !== undefined) {
            const cellValue = cell.value.toString();
            // Đếm số dòng nếu có xuống dòng
            const lines = cellValue.split('\n').length;
            maxLines = Math.max(maxLines, lines);
            
            // Tính độ dài tối đa của một dòng
            const maxLineLength = Math.max(...cellValue.split('\n').map((line: string) => line.length));
            maxLength = Math.max(maxLength, maxLineLength);
          }
        });
        
        // Đặt độ rộng cột (tối thiểu 10, tối đa 80 để đảm bảo hiển thị đầy đủ)
        // Cộng thêm 2 cho padding
        column.width = Math.min(Math.max(maxLength + 2, 10), 80);
      });

      // Áp dụng text wrapping và căn chỉnh cho tất cả các ô
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: 'top', // Căn trên để dễ đọc khi có nhiều dòng
            horizontal: colNumber === 1 ? 'center' : 'left' // Cột đầu căn giữa, các cột khác căn trái
          };
        });
        
        // Tự động điều chỉnh chiều cao hàng dựa trên nội dung
        if (rowNumber > 1) {
          let maxLines = 1;
          row.eachCell((cell) => {
            if (cell.value !== null && cell.value !== undefined) {
              const cellValue = cell.value.toString();
              const lines = cellValue.split('\n').length;
              maxLines = Math.max(maxLines, lines);
            }
          });
          // Đặt chiều cao hàng (tối thiểu 15, mỗi dòng thêm 15)
          row.height = Math.max(15, maxLines * 15);
        }
    });

    // Thêm bộ lọc cho toàn bộ cột (từ dòng header - dòng 2)
    worksheet.autoFilter = {
      from: {
        row: 2,
        column: 1,
      },
      to: {
        row: 2,
        column: headers.length,
      },
    };

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
