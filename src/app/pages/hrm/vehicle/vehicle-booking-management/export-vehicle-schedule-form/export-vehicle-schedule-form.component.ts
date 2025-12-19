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
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .toISO();
  dateEnd: any = DateTime.local()
    .set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
    .toISO();

  // Hàm lấy title với ngày cho UI
  getScheduleTitle(): string {
    const lastDate = this.getLastDateFromSchedule();
    return lastDate ? `LỊCH TRÌNH XE NGÀY ${this.formatDate(lastDate).toUpperCase()}` : 'LỊCH TRÌNH XE';
  }

  onDateStartChange() {
    // Khi ngày bắt đầu thay đổi, cập nhật dateEnd nếu dateEnd < dateStart
    if (!this.dateStart) {
      return;
    }

    let startDate: DateTime;
    if (this.dateStart instanceof Date) {
      // Lấy ngày từ Date object và set thời gian về 00:00:00
      startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (typeof this.dateStart === 'string') {
      // Nếu là string, parse và set thời gian về 00:00:00
      const parsed = DateTime.fromISO(this.dateStart);
      startDate = parsed.isValid 
        ? parsed.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        : DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else {
      startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }

    if (!startDate.isValid) {
      startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }

    let endDate: DateTime;
    if (this.dateEnd instanceof Date) {
      endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    } else if (typeof this.dateEnd === 'string') {
      const parsed = DateTime.fromISO(this.dateEnd);
      endDate = parsed.isValid 
        ? parsed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
        : DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    } else {
      endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }

    if (endDate.isValid && endDate < startDate) {
      this.dateEnd = startDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO();
    }

    // Đảm bảo dateStart có đúng format với thời gian 00:00:00
    this.dateStart = startDate.toISO();
  }

  onDateEndChange() {
    // Khi ngày kết thúc thay đổi, cập nhật nếu dateEnd < dateStart
    if (!this.dateEnd) {
      return;
    }

    let startDate: DateTime;
    if (this.dateStart instanceof Date) {
      startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else if (typeof this.dateStart === 'string') {
      const parsed = DateTime.fromISO(this.dateStart);
      startDate = parsed.isValid 
        ? parsed.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        : DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    } else {
      startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    }

    let endDate: DateTime;
    if (this.dateEnd instanceof Date) {
      // Lấy ngày từ Date object và set thời gian về 23:59:59
      endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    } else if (typeof this.dateEnd === 'string') {
      // Nếu là string, parse và set thời gian về 23:59:59
      const parsed = DateTime.fromISO(this.dateEnd);
      endDate = parsed.isValid 
        ? parsed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 })
        : DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    } else {
      endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }

    if (!endDate.isValid) {
      endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
    }

    if (startDate.isValid && endDate < startDate) {
      this.dateEnd = startDate.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO();
      this.notification.warning('Thông báo', 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
      return;
    }

    // Đảm bảo dateEnd có đúng format với thời gian 23:59:59
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
        startDate = DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || '';
      } else if (this.dateStart instanceof Date) {
        startDate = DateTime.fromJSDate(this.dateStart).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || '';
      } else {
        const parsed = DateTime.fromISO(this.dateStart);
        startDate = parsed.isValid 
          ? parsed.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || ''
          : DateTime.local().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toISO() || '';
      }

      // Xử lý dateEnd - có thể là Date object, ISO string, hoặc Date string
      if (!this.dateEnd) {
        endDate = DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || '';
      } else if (this.dateEnd instanceof Date) {
        endDate = DateTime.fromJSDate(this.dateEnd).set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || '';
      } else {
        const parsed = DateTime.fromISO(this.dateEnd);
        endDate = parsed.isValid 
          ? parsed.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || ''
          : DateTime.local().set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).toISO() || '';
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
          console.log("tb_vehicleManagement", response);
          // Lấy dữ liệu từ response.data.data.data (nested structure)
          const dataArray = response?.data?.data?.data || response?.data?.data || response?.data || [];
          this.exportVehicleScheduleList = Array.isArray(dataArray) ? dataArray : [];
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
      
      // Border top: mỏng cho tất cả các dòng
      style['border-top'] = '1px solid #D3D3D3';
      
      // Border bottom: mỏng cho tất cả các dòng
      style['border-bottom'] = '1px solid #D3D3D3';
      
      return style;
    }

    // Hàm lấy màu cho dòng "Thông tin xe" dựa trên index
    getVehicleHeaderColor(index: number): string {
      const vehicleColors = [
        '#ffcbee', // Hồng
        '#cfe2f3', // Xanh nhạt
        '#d9ead3', // Xanh lá nhạt
        '#Fce5cd', // Cam nhạt
        '#ead1dc', // Hồng đậm nhạt
        '#d5e8d4', // Xanh lá đậm nhạt
        '#fff2cc', // Vàng nhạt
        '#e1d5e7', // Tím nhạt
        '#dae8fc', // Xanh dương nhạt
        '#f4cccc'  // Đỏ nhạt
      ];
      return vehicleColors[index % vehicleColors.length];
    }

  //#endregion
  
  // Hàm lấy ngày cuối cùng từ groupedScheduleData
  getLastDateFromSchedule(): string {
    let lastDate = '';
    const allDates: string[] = [];
    
    this.groupedScheduleData.forEach((vehicleGroup) => {
      vehicleGroup.daySessions.forEach((daySession: any) => {
        if (daySession.date && daySession.date.trim() !== '') {
          allDates.push(daySession.date);
        }
      });
    });
    
    if (allDates.length > 0) {
      // Sắp xếp và lấy ngày cuối cùng
      allDates.sort();
      lastDate = allDates[allDates.length - 1];
    }
    
    return lastDate;
  }

  async exportToExcel() {
      if (!this.groupedScheduleData || this.groupedScheduleData.length === 0) {
      this.notification.error('', 'Không có dữ liệu để xuất!', {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lịch trình xe');

      // Lấy ngày cuối cùng để hiển thị trong title
      const lastDate = this.getLastDateFromSchedule();
      const titleText = lastDate ? `Lịch Trình Xe ngày ${this.formatDate(lastDate)}` : 'Lịch Trình Xe';
      
      // Mảng màu cho các xe (mỗi xe một màu khác nhau)
      const vehicleColors = [
        'FFffcbee', // Hồng
        'FFcfe2f3', // Xanh nhạt
        'FFd9ead3', // Xanh lá nhạt
        'FFFce5cd', // Cam nhạt
        'FFead1dc', // Hồng đậm nhạt
        'FFd5e8d4', // Xanh lá đậm nhạt
        'FFfff2cc', // Vàng nhạt
        'FFe1d5e7', // Tím nhạt
        'FFdae8fc', // Xanh dương nhạt
        'FFf4cccc'  // Đỏ nhạt
      ];

      // Thêm dòng header "Lịch Trình Xe" bọc toàn bộ
    const titleRow = worksheet.addRow([titleText]);
    
    // Merge tất cả các cột cho dòng title (merge trước khi set style) - bỏ cột Ngày nên còn 8 cột
    worksheet.mergeCells(1, 1, 1, 8);
    
    // Set style cho merged cell - phải set sau khi merge
    const titleCell = titleRow.getCell(1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00ba25' }, // Màu xanh lá (#00ba25) giống HTML
    };
    titleCell.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' }, // Màu trắng
      size: 12,
      name: 'Times New Roman'
    };
    titleCell.border = {
      top: { style: 'thin', color: { argb: 'FF808080' } },
      left: { style: 'thin', color: { argb: 'FF808080' } },
      bottom: { style: 'thin', color: { argb: 'FF808080' } },
      right: { style: 'thin', color: { argb: 'FF808080' } }
    };
    // Căn giữa cho merged cell - set lại sau khi đã set các style khác
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: false
    };
    // Set alignment cho toàn bộ row để đảm bảo merged cell căn giữa
    titleRow.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    titleRow.height = 30;

    // Bỏ cột "Ngày", chỉ còn 8 cột
    const headers = ['Buổi', 'Người đi', 'Điểm xuất phát', 'Điểm đến', 'Giờ xuất phát', 'Thời gian đến', 'Giờ về', 'Ghi chú'];
    const headerRow = worksheet.addRow(headers);

      // Gán style màu cho header (màu xanh dương cho các cột thường, màu cam cho cột giờ)
    headerRow.eachCell((cell, colNumber) => {
      // Cột 5, 6, 7 (Giờ xuất phát, Thời gian đến, Giờ về) dùng màu cam #e39540 (đã bỏ cột Ngày nên index giảm 1)
      // Các cột khác dùng màu xanh dương #4472C4
      const isTimeColumn = colNumber === 5 || colNumber === 6 || colNumber === 7;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isTimeColumn ? 'FFe39540' : 'FF4472C4' }, // Màu cam cho cột giờ, xanh dương cho cột khác
      };
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' }, // Màu trắng cho chữ
        size: 9,
        name: 'Times New Roman'
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF808080' } },
        left: { style: 'thin', color: { argb: 'FF808080' } },
        bottom: { style: 'thin', color: { argb: 'FF808080' } },
        right: { style: 'thin', color: { argb: 'FF808080' } }
      };
    });

      // Đặt chiều cao cho header
      headerRow.height = 25;

      // Set width cố định cho các cột (trước khi tự động tính) - giãn cột ra thêm nữa
      worksheet.getColumn(1).width = 16; // Buổi
      worksheet.getColumn(2).width = 30; // Người đi
      worksheet.getColumn(3).width = 35; // Điểm xuất phát
      worksheet.getColumn(4).width = 45; // Điểm đến
      worksheet.getColumn(5).width = 20; // Giờ xuất phát
      worksheet.getColumn(6).width = 20; // Thời gian đến
      worksheet.getColumn(7).width = 20; // Giờ về
      worksheet.getColumn(8).width = 65; // Ghi chú

      let currentRow = 3; // Bắt đầu từ dòng 3 (dòng 1: title, dòng 2: header)
      
      // Duyệt qua từng nhóm xe
      this.groupedScheduleData.forEach((vehicleGroup, vehicleIndex) => {
        const vehicleInfo = vehicleGroup.vehicleInfo;
        
        // Lấy màu cho xe này (mỗi xe một màu khác nhau)
        const colorIndex = vehicleIndex % vehicleColors.length;
        const vehicleColor = vehicleColors[colorIndex];
        
        // Thêm dòng header cho thông tin xe
        const vehicleHeaderRow = worksheet.addRow([`Thông tin xe: ${vehicleInfo}`]);
        
        // Merge tất cả các cột cho dòng header xe (phải merge trước khi set style)
        worksheet.mergeCells(currentRow, 1, currentRow, headers.length);
        
        // Set style cho merged cell
        const mergedCell = vehicleHeaderRow.getCell(1);
        mergedCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: vehicleColor }, // Màu custom cho mỗi xe
        };
        mergedCell.font = { 
          bold: true, 
          color: { argb: 'FF000000' }, // Màu đen
          size: 9,
          name: 'Times New Roman'
        };
        mergedCell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
        // Căn giữa cho merged cell - set sau khi đã set các style khác
        mergedCell.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: false
        };
        // Set alignment cho toàn bộ row để đảm bảo merged cell căn giữa
        vehicleHeaderRow.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        // Không set height để Excel tự động dùng height mặc định (1 dòng bình thường)
        
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
              // Bỏ cột Ngày, chỉ còn Buổi (chỉ set giá trị cho dòng đầu, các dòng sau để '' để merge cho đẹp)
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
          
          // Merge cột "Buổi" (col 1) để giống rowspan trên UI (đã bỏ cột Ngày)
          const endRowForDaySession = currentRow - 1;
          
          if (endRowForDaySession > startRowForDaySession) {
            // Merge cột Buổi
            worksheet.mergeCells(startRowForDaySession, 1, endRowForDaySession, 1);
            
            // Căn giữa + giữa dọc cho cell đã merge
            const sessionCell = worksheet.getCell(startRowForDaySession, 1);
            sessionCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          }
        });
      });

      // Format cột có giá trị là Date và thêm border
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || rowNumber === 2) return; // bỏ qua dòng title và header
        
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
        // Set font Times New Roman và size 9px cho tất cả các cell
        cell.font = { ...cell.font, size: 9, name: 'Times New Roman' };
        
        // Format cho các cột thời gian (cột 5, 6, 7: Giờ xuất phát, Thời gian đến, Giờ về - đã bỏ cột Ngày)
        if (cell.value instanceof Date) {
          // Nếu là Date thì format đầy đủ ngày giờ
          cell.numFmt = 'dd/mm/yyyy hh:mm:ss';
        } else if (typeof cell.value === 'string' && /^\d{1,2}:\d{2}$/.test(cell.value.trim())) {
          // Nếu là string dạng "08:00" thì giữ nguyên, không cần format
          // Excel sẽ hiển thị như text
        }
        
        // Set alignment theo loại cột (đã bỏ cột Ngày)
        // Cột 1: Buổi - căn giữa
        // Cột 2, 3, 4, 8: Chữ (Người đi, Điểm xuất phát, Điểm đến, Ghi chú) - căn trái, xuống dòng khi quá width
        // Cột 5, 6, 7: Giờ (Giờ xuất phát, Thời gian đến, Giờ về) - căn giữa
        // Đảm bảo các cột Người đi (2), Điểm xuất phát (3), Điểm đến (4) xuống dòng khi quá width
        if (colNumber === 1) {
          // Buổi: căn giữa
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
          // Các cột giờ: căn giữa
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        } else if (colNumber === 2 || colNumber === 3 || colNumber === 4 || colNumber === 8) {
          // Các cột chữ: Người đi, Điểm xuất phát, Điểm đến, Ghi chú - căn trái, xuống dòng
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        } else {
          // Các cột khác
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        }
        
        // Thêm border cho tất cả các cell dữ liệu
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF808080' } },
          left: { style: 'thin', color: { argb: 'FF808080' } },
          bottom: { style: 'thin', color: { argb: 'FF808080' } },
          right: { style: 'thin', color: { argb: 'FF808080' } }
        };
      });
    });

        // Tự động căn chỉnh độ rộng cột với tính toán tốt hơn (bỏ qua các cột đã set width cố định)
      worksheet.columns.forEach((column: any, index: number) => {
        // Bỏ qua các cột đã set width cố định: tất cả các cột đã được set width
        // Không cần tự động tính nữa vì đã set width cố định cho tất cả
        return;
      });

      // Áp dụng text wrapping và căn chỉnh cho tất cả các ô (bỏ qua row 1 - title, row 2 - header và các dòng "Thông tin xe")
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Bỏ qua title row, đã set alignment riêng
        if (rowNumber === 2) return; // Bỏ qua header row, đã set alignment riêng (căn giữa)
        
        // Kiểm tra xem có phải dòng "Thông tin xe" không
        const firstCellValue = row.getCell(1).value;
        const isVehicleHeader = typeof firstCellValue === 'string' && firstCellValue.includes('Thông tin xe:');
        if (isVehicleHeader) return; // Bỏ qua dòng "Thông tin xe", đã set alignment riêng (căn giữa)
        
        row.eachCell((cell, colNumber) => {
          // Cột Buổi (1) căn giữa, các cột giờ (5,6,7) căn giữa, còn lại căn trái
          // Đảm bảo các cột Người đi (2), Điểm xuất phát (3), Điểm đến (4) có wrapText: true
          const isCenterColumn = colNumber === 1 || colNumber === 5 || colNumber === 6 || colNumber === 7;
          cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: isCenterColumn ? 'middle' : 'top',
            horizontal: isCenterColumn ? 'center' : 'left'
          };
        });
        
        // Tự động điều chỉnh chiều cao hàng dựa trên nội dung (bỏ qua row 1, 2 và các dòng "Thông tin xe")
        if (rowNumber > 2) {
          // Kiểm tra xem có phải dòng "Thông tin xe" không
          const firstCellValue = row.getCell(1).value;
          const isVehicleHeader = typeof firstCellValue === 'string' && firstCellValue.includes('Thông tin xe:');
          
          // Bỏ qua dòng "Thông tin xe" - giữ height mặc định (1 dòng bình thường)
          if (isVehicleHeader) {
            return;
          }
          
          let maxLines = 1;
          row.eachCell((cell, colNumber) => {
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
              const cellValue = cell.value.toString().trim();
              if (cellValue === '') return;
              
              // Đếm số dòng từ \n có sẵn
              const explicitLines = cellValue.split('\n').length;
              
              // Tính toán số dòng dựa trên width cột và độ dài text
              // Với font size 9 Times New Roman, mỗi ký tự chiếm khoảng 0.6-0.65 đơn vị width
              const column = worksheet.getColumn(colNumber);
              const columnWidth = column.width || 20; // Default width nếu chưa set
              
              // Ước tính số ký tự trên 1 dòng: width * 1.5 (vì font size 9, Times New Roman)
              // Trừ đi 2 cho padding
              const charsPerLine = Math.max(1, Math.floor((columnWidth - 2) * 1.5));
              
              // Tính số dòng cần thiết khi wrap text
              const wrappedLines = Math.ceil(cellValue.length / charsPerLine);
              
              // Lấy số dòng lớn nhất giữa explicit lines và wrapped lines
              const totalLines = Math.max(explicitLines, wrappedLines, 1);
              maxLines = Math.max(maxLines, totalLines);
            }
          });
          // Đặt chiều cao hàng (tối thiểu 20, mỗi dòng thêm 18 để đảm bảo đủ không gian)
          // Tăng hệ số từ 15 lên 18 để đảm bảo không bị che
          row.height = Math.max(20, maxLines * 18);
        }
    });

    // Set zoom level về 100%
    worksheet.views = [
      {
        zoomScale: 100
      }
    ];

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
