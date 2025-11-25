import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  IterableDiffers,
  TemplateRef,
  input,
  Input,
  inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { EmployeeTimekeepingService } from '../employee-timekeeping-service/employee-timekeeping.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { EmployeeTimekeepingComponent } from '../employee-timekeeping.component';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';

import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin, firstValueFrom } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../../app.config';


@Component({
  selector: 'app-employee-timekeeping-management',
  templateUrl: './employee-timekeeping-management.component.html',
  styleUrls: ['./employee-timekeeping-management.component.css'],
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
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
    NzModalModule,
    NzCheckboxModule,
    CommonModule,
    NzInputNumberModule,
    NzTabsModule,
    CommonModule,
  ],
})
export class EmployeeTimekeepingManagementComponent
  implements OnInit, AfterViewInit
{
  constructor(
    private etService: EmployeeTimekeepingService,
    private vehicleRepairService: VehicleRepairService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    public activeModal?: NgbActiveModal // Optional - chỉ có khi mở qua modal
  ) {}

  // size splitter filter
  sizeSearch: string = '0';

  // khai báo table
  @ViewChild('tb_MT', { static: false }) tbMTRef!: ElementRef;
  @ViewChild('tb_DT', { static: false }) tbDTRef!: ElementRef;

  activeTabIndex = 0;
  tb_MT: any;
  tb_DT: any;
  isMTBuilt = false;
  isDTBuilt = false;
  isTableBuilt = false;

  totalWorkday: number = 0;

  weekdays: any = {};

  isLoadTable = false;
  isUpdating = false; // Flag để track trạng thái đang update
  year: Date = new Date();
  month: Date = new Date();
  selectedDepartment: any | null = null;
  selectedEmployee: any | null = null;
  allEmployees: any[] = []; // full list (để filter theo phòng ban)
  employees: any[] = []; // grouped theo DepartmentName (cho dropdown)
  departments: any[] = [];
  searchValue: string = '';

  // Có thể nhận từ Input hoặc componentInstance khi mở modal
  etId: number = 0;
  masterId: number | null = null;
  etData: any = null; // Data từ parent component
  
  isApproved = false;
  // (nếu chưa có) helper nhỏ
  private toInt(v: any, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }
  private toBool(v: any) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string')
      return ['1', 'true', 'True', 'TRUE', 'yes', 'YES'].includes(v);
    return false;
  }
  ngOnInit() {
    // Ưu tiên lấy ID từ componentInstance (modal) hoặc Input
    // Nếu không có thì mới lấy từ route (để tương thích với route cũ)
    let id = this.etId || this.masterId || 0;
    
    // Nếu đã được set từ modal/input thì dùng luôn
    if (id > 0) {
      this.etId = id;
      this.masterId = id;
      // Lấy thông tin master theo ID => set filter + isApproved
      this.prefillFromETById(id);
      return;
    }
    
    // Nếu chưa có ID, kiểm tra route params (để tương thích với route cũ)
    if (this.route) {
      this.route.paramMap.subscribe((params) => {
        const routeId = +(params.get('id') ?? 0);
        if (routeId > 0) {
          this.etId = routeId;
          this.masterId = routeId;
          this.prefillFromETById(routeId);
        } else {
          // không có id -> mặc định tháng/năm hiện tại rồi load dữ liệu
          this.loadDepartments();
          this.loadEmployees();
          setTimeout(() => {
            this.loadMTData();
            this.loadDTData();
          });
        }
      });
    } else {
      // Không có route (đang mở qua modal và không có ID)
      // Mặc định tháng/năm hiện tại
      this.loadDepartments();
      this.loadEmployees();
      setTimeout(() => {
        this.loadMTData();
        this.loadDTData();
      });
    }
  }

  ngAfterViewInit(): void {
    // Delay để đảm bảo DOM đã render hoàn toàn và ID đã được set từ modal
    setTimeout(() => {
      // Kiểm tra lại ID nếu chưa có (trường hợp mở qua modal)
      if (!this.etId && !this.masterId && this.etData?.ID) {
        this.etId = this.etData.ID;
        this.masterId = this.etData.ID;
        this.prefillFromETById(this.etId);
      } else if ((this.etId || this.masterId) && !this.isTableBuilt) {
        // Nếu đã có ID nhưng chưa load data, load lại
        this.prefillFromETById(this.etId || this.masterId || 0);
      }
      
      this.initializeDefaultTab();
    }, 500);
  }

  private initializeDefaultTab(): void {
    if (this.tbMTRef && !this.tb_MT) {
      this.drawTbMT(this.tbMTRef.nativeElement);
    }
  }

  private prefillFromETById(id: number) {
    this.loadDepartments();

    this.etService.getETById(id).subscribe({
      next: (res) => {
        const et = Array.isArray(res?.data) ? res.data[0] : res?.data;
        if (!et) return;

        // Map linh hoạt theo các tên trường có thể có trên ET (Year/_Year/year…)
        const y = +(
          et?.Year ??
          et?._Year ??
          et?.year ??
          new Date().getFullYear()
        );
        const m = +(
          et?.Month ??
          et?._Month ??
          et?.month ??
          new Date().getMonth() + 1
        );
        const dep = +(
          et?.DepartmentID ??
          et?.DepartmentId ??
          et?.departmentId ??
          0
        );
        const emp = +(et?.EmployeeID ?? et?.EmployeeId ?? et?.employeeId ?? 0);

        // Gán vào filter
        this.year = new Date(y, 0, 1);
        this.month = new Date(y, m - 1, 1);
        this.selectedDepartment = dep || null;
        this.selectedEmployee = emp || null;

        if (dep) this.onDepartmentChange();
        else this.loadEmployees();

        // Nếu bảng đã dựng thì nạp dữ liệu ngay
        if (this.isTableBuilt && this.tb_MT) {
          this.loadMTData();
        }
        if (this.isDTBuilt && this.tb_DT) {
          this.loadDTData();
        }
      },
      error: (e) => {},
    });
  }

  onTabChange(i: number) {
    this.activeTabIndex = i;
    setTimeout(() => {
      if (i === 0) {
        if (this.tbMTRef && !this.tb_MT)
          this.drawTbMT(this.tbMTRef.nativeElement);
        else this.tb_MT?.redraw(true);
      } else if (i === 1) {
        if (this.tbDTRef && !this.tb_DT)
          this.drawTbDT(this.tbDTRef.nativeElement);
        else this.tb_DT?.redraw(true);
      }
    }, 50);
  }

  exportToExcel(): void {
    const params = this.getAjaxParamsMT();
    const month = params.month;
    const year = params.year;

    // helpers
    const toBool = (v: any) => {
      if (v === true || v === false) return v;
      const n = Number(v);
      if (!isNaN(n)) return n > 0;
      const s = String(v).toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    };
    const checkMark = (v: any) => (toBool(v) ? '✓' : '');
    const fmtDate = (v: any) => {
      if (!v) return '';
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const fmtTime = (v: any) => {
      if (!v) return '';
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${hh}:${mi}:${ss}`;
    };
    const num2 = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // gọi song song 2 API – luôn đúng filter hiện tại
    this.notification.info(NOTIFICATION_TITLE.success, 'Đang lấy dữ liệu MT & DT...');
    this.isLoadTable = true;

    forkJoin({
      mt: this.etService.getTimekeepingData(
        params.employeeId,
        params.month,
        params.year,
        params.departmentId,
        params.keyword
      ),
      dt: this.etService.getTimekeepingDetailData(
        params.employeeId,
        params.month,
        params.year,
        params.departmentId,
        params.keyword
      ),
    }).subscribe({
      next: async ({ mt, dt }) => {
        this.isLoadTable = false;

        // ====== CHUẨN BỊ DỮ LIỆU MT ======
        const mtData: any[] = Array.isArray(mt?.data)
          ? mt.data
          : mt?.data || [];
        const totalWorkday = Number(mt?.totalWorkday || this.totalWorkday || 0);

        // Cột trái (lá)
        const leftTitles = ['STT', 'Mã nhân viên', 'Họ tên', 'Chức vụ'];
        const leftFields = ['STT', 'Code', 'FullName', 'PositionName'];

        // Cột ngày
        const daysInMonth = new Date(year, month, 0).getDate();
        const dayTitles = Array.from({ length: daysInMonth }, (_, i) =>
          String(i + 1)
        );
        const dayFields = Array.from(
          { length: daysInMonth },
          (_, i) => `D${i + 1}`
        );

        // Cột tổng bên phải
        const totals = [
          { title: 'Số công đi làm thực tế', field: 'TotalDayActual' },
          { title: 'Công nghỉ Lễ, tết', field: 'TotalHoliday' },
          { title: 'Công nghỉ phép', field: 'TotalDayOnleave2' },
          {
            title: 'Công nghỉ việc riêng có hưởng lương',
            field: 'TotalDayOnleave3',
          },
          { title: 'Công WFH', field: 'TotalDayWFH' },
          { title: 'Tổng số công được hưởng', field: 'TotalDayGet' },
          { title: 'Công nghỉ không hưởng lương', field: 'TotalDayOnleave1' },
          { title: 'Tổng', field: 'TotalDay' },
        ];
        const totalsTitles = totals.map((t) => t.title);
        const totalsFields = totals.map((t) => t.field);

        const allTitles = [...leftTitles, ...dayTitles, ...totalsTitles];
        const allFields = [...leftFields, ...dayFields, ...totalsFields];

        // ====== CHUẨN BỊ DỮ LIỆU DT ======
        const normalizeDT = (res: any): any[] => {
          const isRec = (o: any) =>
            o &&
            typeof o === 'object' &&
            'DayFinger' in o &&
            ('EmployeeID' in o || 'Code' in o || 'FullName' in o);

          const collect = (node: any): any[] => {
            if (!node) return [];
            if (Array.isArray(node)) return node.flatMap(collect);
            if (isRec(node)) return [node];
            if (typeof node === 'object') {
              for (const k of [
                'data',
                'Data',
                'items',
                'result',
                'Results',
                'rows',
                'Records',
                'table',
                'Table',
                '0',
              ]) {
                if (k in node) {
                  const got = collect((node as any)[k]);
                  if (got.length) return got;
                }
              }
              return Object.values(node).flatMap(collect);
            }
            return [];
          };
          return collect(res);
        };

        const dtRows = normalizeDT(dt);

        // ====== TẠO WORKBOOK & SHEETS ======
        const wb = new ExcelJS.Workbook();

        // -- Sheet MT --
        const wsMT = wb.addWorksheet('Bảng MT');

        // Header hàng 1: Công ty | BẢNG CHẤM CÔNG THÁNG M/YYYY
        const h1 = [...new Array(allTitles.length)];
        h1[0] = 'Công ty Cổ Phần RTC Technology Việt Nam';
        h1[leftTitles.length] = `BẢNG CHẤM CÔNG THÁNG ${month}/${year}`;
        wsMT.addRow(h1);

        // gộp ô hàng 1
        wsMT.mergeCells(1, 1, 1, leftTitles.length);
        wsMT.mergeCells(1, leftTitles.length + 1, 1, allTitles.length);
        wsMT.getRow(1).font = { bold: true, size: 13 };
        wsMT.getRow(1).alignment = { horizontal: 'center' };

        // Header hàng 2: Công tiêu chuẩn = X (gộp bên trái)
        const h2 = [...new Array(allTitles.length)];
        h2[0] = `Công tiêu chuẩn = ${totalWorkday}`;
        wsMT.addRow(h2);
        wsMT.mergeCells(2, 1, 2, leftTitles.length);
        wsMT.getRow(2).font = { italic: true };
        wsMT.getRow(2).alignment = { horizontal: 'left' };

        // Header hàng 3: tiêu đề cột
        wsMT.addRow(allTitles);
        wsMT.getRow(3).font = { bold: true };
        wsMT.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' };

        // Tô vàng T7/CN trên header ngày
        for (let i = 0; i < dayFields.length; i++) {
          const colIdx = leftTitles.length + i + 1; // cột thực tế (1-based)
          const date = new Date(year, month - 1, i + 1);
          const dow = date.getDay(); // 0=CN, 6=T7
          if (dow === 0 || dow === 6) {
            wsMT.getRow(3).getCell(colIdx).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFCE699' },
            };
          }
        }

        // Ghi data MT
        for (const r of mtData) {
          const row = allFields.map((f) => r?.[f] ?? '');
          // ép kiểu số cho các cột tổng
          for (let i = 0; i < totalsFields.length; i++) {
            const idx = leftFields.length + dayFields.length + i;
            row[idx] = num2(row[idx]);
          }
          wsMT.addRow(row);
        }

        // set width
        // trái: rộng, ngày: nhỏ, tổng: vừa
        wsMT.columns = [
          ...leftTitles.map((t, i) => ({
            key: `L${i}`,
            width: [6, 14, 22, 22][i] || 14,
          })),
          ...dayTitles.map(() => ({ key: `D`, width: 4 })),
          ...totalsTitles.map(() => ({ key: `T`, width: 18 })),
        ] as any;

        // -- Sheet DT --
        const wsDT = wb.addWorksheet('Bảng DT');

        // tiêu đề cột (đúng title/field bạn đang dùng)
        const dtCols = [
          { title: 'Mã nhân viên', field: 'Code' },
          { title: 'Tên nhân viên', field: 'FullName' },
          { title: 'Chức vụ', field: 'PositionName' },
          { title: 'Ngày', field: 'DayFinger' },
          { title: 'Check In', field: 'CheckIn' },
          { title: 'Check Out', field: 'CheckOut' },
          { title: 'Quên vân tay', field: 'NoFinger', isBool: true },
          { title: 'Đi muộn', field: 'IsLate', isBool: true },
          { title: 'Về sớm', field: 'IsEarly', isBool: true },
          { title: 'Công tác', field: 'BussinessCode', isBusiness: true }, // text hoặc 'Có'
          { title: 'Đi làm sớm', field: 'CostWorkEarly', isBool: true },
          { title: 'Không chấm công', field: 'NotCheckin', isBool: true },
          { title: 'Làm thêm', field: 'TotalTimeOT', isNum: true },
          { title: 'Phụ cấp ăn tối', field: 'Overnight', isBool: true },
          { title: 'Nghỉ phép', field: 'OnLeaveTypeText' },
          { title: 'Tổng ngày nghỉ', field: 'OnLeaveDay', isNum: true },
          { title: 'WFH', field: 'TotalDayWFH', isNum: true },
          { title: 'Làm đêm', field: 'TotalNightShift', isNum: true },
          { title: 'Công', field: 'TotalDayText' },
          { title: 'Ăn ca', field: 'TotalLunchText' },
        ];

        wsDT.addRow(dtCols.map((c) => c.title));
        wsDT.getRow(1).font = { bold: true };
        wsDT.getRow(1).alignment = { horizontal: 'center' };

        for (const r of dtRows) {
          const excelRow = dtCols.map((col) => {
            const val = r?.[col.field];
            if (col.isBool) return checkMark(val);
            if (col.isNum) return num2(val);
            if (col.isBusiness) {
              if (val) return val;
              return num2(r?.CostBussiness) > 0 ? 'Có' : '';
            }
            if (col.field === 'DayFinger') return fmtDate(val);
            if (col.field === 'CheckIn' || col.field === 'CheckOut')
              return fmtTime(val);
            return val ?? '';
          });
          wsDT.addRow(excelRow);
        }

        // width hợp lý
        wsDT.columns = [
          { width: 16 }, // Mã NV
          { width: 24 }, // Tên NV
          { width: 22 }, // Chức vụ
          { width: 12 }, // Ngày
          { width: 11 }, // In
          { width: 11 }, // Out
          { width: 15 }, // Quên vân tay
          { width: 10 }, // Đi muộn
          { width: 10 }, // Về sớm
          { width: 20 }, // Công tác
          { width: 12 }, // Đi làm sớm
          { width: 18 }, // Không chấm công
          { width: 12 }, // Làm thêm
          { width: 16 }, // Phụ cấp ăn tối
          { width: 14 }, // Nghỉ phép
          { width: 14 }, // Tổng ngày nghỉ
          { width: 10 }, // WFH
          { width: 10 }, // Làm đêm
          { width: 12 }, // Công
          { width: 10 }, // Ăn ca
        ] as any;

        // ====== GHI FILE ======
        const fileName = `BangChamCong_${String(month).padStart(
          2,
          '0'
        )}_${year}.xlsx`;
        const buffer = await wb.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Đã xuất Excel 2 sheet (MT & DT)'
        );
      },
      error: (err) => {
        this.isLoadTable = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất file Excel');
      },
    });
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  resetSearch(): void {
    // Reset tất cả giá trị về mặc định
    this.year = new Date();
    this.month = new Date();
    this.selectedDepartment = null;
    this.selectedEmployee = null;
    this.searchValue = '';
    
    // Load lại tất cả nhân viên
    this.loadEmployees();
    
    // Reload dữ liệu bảng
    this.reloadBothFast();
  }

  onSearch(): void {
    this.reloadBothFast();
  }

  searchMT(): void {
    this.reloadBothFast();
  }

  onEmployeeChange(): void {
    if (this.tb_MT && this.isMTBuilt) this.loadMTData();
    if (this.tb_DT && this.isDTBuilt) this.loadDTData();
  }
  onDepartmentChange(): void {
    // Reset nhân viên đã chọn khi thay đổi phòng ban
    this.selectedEmployee = null;
    
    // Nếu đã có allEmployees, filter ngay từ đó (không cần gọi API lại)
    if (this.allEmployees && this.allEmployees.length > 0) {
      const filtered =
        this.selectedDepartment && Number(this.selectedDepartment) > 0
          ? this.allEmployees.filter(
              (x: any) => Number(x.DepartmentID) === Number(this.selectedDepartment)
            )
          : this.allEmployees;
      
      this.employees = this.groupEmployeesByDepartment(filtered);
    } else {
      // Nếu chưa có allEmployees, load lại từ API
      this.loadEmployees();
    }
    
    // Reload dữ liệu bảng
    this.reloadBothFast();
  }

  onUpdateOne(): void {
    if (this.isUpdating) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đang cập nhật, vui lòng đợi...');
      return;
    }

    const p = this.getAjaxParamsMT(); // lấy month/year hiện tại
    const masterId = this.etId; // lấy masterId từ route param
    if (this.isApproved) {
      const p = this.getAjaxParamsMT();
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bảng chấm công tháng ${p.month}/${p.year} đã được duyệt. Vui lòng HUỶ DUYỆT trước khi cập nhật.`
      );
      return;
    }
    if (!masterId) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được EmployeeID để cập nhật.');
      return;
    }

    // lấy EmployeeID từ filter/MT/DT
    const picked = this.pickSelectedFromTables();
    const employeeId = picked.employeeId;
    const fullName = picked.fullName || String(employeeId);

    if (!employeeId) {
      this.notification.info(
        NOTIFICATION_TITLE.success,
        'Vui lòng chọn nhân viên.'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật công cho nhân viên [${fullName}]?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // dùng LoginName mặc định từ service (ADMIN)
        const login = this.etService.LoginName || 'ADMIN';

        this.isUpdating = true;
        this.isLoadTable = true;
        this.etService
          .updateTimekeepingOne(masterId, p.month, p.year, employeeId, login)
          .subscribe({
            next: (res) => {
              this.isLoadTable = false;
              this.isUpdating = false;
              if (res?.status === 0) {
                this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Cập nhật thất bại');
                return;
              }
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Đã cập nhật công của nhân viên'
              );
              if (this.tb_MT) this.loadMTData();
              if (this.tb_DT) this.loadDTData();
            },
            error: () => {
              this.isLoadTable = false;
              this.isUpdating = false;
              this.notification.error(NOTIFICATION_TITLE.error, 'Không thể cập nhật công nhân viên');
            },
          });
      }
    });
  }

  async onUpdateAll(): Promise<void> {
    if (this.isUpdating) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Đang cập nhật, vui lòng đợi...');
      return;
    }

    if (this.isApproved) {
      const p = this.getAjaxParamsMT();
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bảng chấm công tháng ${p.month}/${p.year} đã được duyệt. Vui lòng HUỶ DUYỆT trước khi cập nhật.`
      );
      return;
    }
    const p = this.getAjaxParamsMT();
    const masterId = this.etId; 
    if (!masterId) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không xác định MasterID (etId).');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn cập nhật lại bảng chấm công tháng ${p.month}/${p.year} cho TẤT CẢ nhân viên?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        const login = this.etService.LoginName || 'ADMIN';

        this.isUpdating = true;
        this.isLoadTable = true;
        
        try {
          const res = await firstValueFrom(
            this.etService.updateTimekeepingAll(masterId, p.month, p.year, login)
          );
          
          this.isLoadTable = false;
          this.isUpdating = false;
          
          if (res?.status === 0) {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Cập nhật thất bại');
            return;
          }
          
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Đã cập nhật toàn bộ bảng công'
          );
          
          if (this.tb_MT) this.loadMTData();
          if (this.tb_DT) this.loadDTData();
        } catch (error) {
          this.isLoadTable = false;
          this.isUpdating = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể cập nhật toàn bộ bảng công'
          );
        }
      }
    });
  }

  // Load departments từ API
  loadDepartments(): void {
    this.etService.getDepartment().subscribe({
      next: (response) => {
        if (response && response.status === 1 && response.data) {
          this.departments = response.data;
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách phòng ban');
      },
    });
  }

  // Load employees từ API
  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    
    // Dùng VehicleRepairService.getEmployee() để lấy nhân viên có thông tin phòng ban
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0); // Filter active employees
        this.allEmployees = all;
        
        // Filter theo phòng ban nếu có chọn
        const filtered =
          this.selectedDepartment && Number(this.selectedDepartment) > 0
            ? all.filter(
                (x: any) => Number(x.DepartmentID) === Number(this.selectedDepartment)
              )
            : all;
        
        // Group employees by department
        this.employees = this.groupEmployeesByDepartment(filtered);
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || 'Không thể tải danh sách nhân viên');
      },
    });
  }

  private groupEmployeesByDepartment(employees: any[]): any[] {
    const grouped = employees.reduce((acc, emp) => {
      const deptName = emp.DepartmentName || 'Không xác định';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push({ item: emp });
      return acc;
    }, {});

    return Object.keys(grouped).map((label) => ({
      label,
      options: grouped[label],
    }));
  }
  private reloadBothFast(): void {
    // đảm bảo table đã có, nếu chưa thì vẽ
    if (!this.tb_MT && this.tbMTRef) this.drawTbMT(this.tbMTRef.nativeElement);
    if (!this.tb_DT && this.tbDTRef) this.drawTbDT(this.tbDTRef.nativeElement);

    const p = this.getAjaxParamsMT();
    this.isLoadTable = true;

    // gọi song song 2 API để đồng bộ dữ liệu theo cùng bộ lọc
    forkJoin({
      mt: this.etService.getTimekeepingData(
        p.employeeId,
        p.month,
        p.year,
        p.departmentId,
        p.keyword
      ),
      dt: this.etService.getTimekeepingDetailData(
        p.employeeId,
        p.month,
        p.year,
        p.departmentId,
        p.keyword
      ),
    }).subscribe({
      next: ({ mt, dt }) => {
        // ===== MT =====
        const totalWorkday = Number(mt?.totalWorkday || 0);
        this.totalWorkday = totalWorkday;
        this.weekdays = mt?.weekdays || {};
        // nếu API có trả trạng thái duyệt thì set vào cờ
        this.isApproved =
          mt?.isApproved ??
          ((Array.isArray(mt?.data) &&
            mt.data.length &&
            mt.data[0]?.isApproved) ||
            false);

        // rebuild tiêu đề tháng/năm (đúng chuẩn cột ngày)
        if (this.tb_MT) {
          this.tb_MT.setColumns(this.buildColumnsMT(p.year, p.month));
          this.tb_MT.setData(Array.isArray(mt?.data) ? mt.data : []);
        }

        // ===== DT =====
        const rows = this.normalizeDTDeep(dt); // tái sử dụng helper bạn đang có
        if (this.tb_DT) this.tb_DT.setData(rows);

        this.isLoadTable = false;
      },
      error: (err) => {
        this.isLoadTable = false;
        // clear nhẹ cho chắc
        this.tb_MT?.setData([]);
        this.tb_DT?.setData([]);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu MT/DT');
      },
    });
  }

  drawTbMT(container: HTMLElement) {
    if (!container) {
      return;
    }

    const year = this.getYear();
    const month = this.getMonth();

    try {
      // Destroy existing table if exists
      if (this.tb_MT) {
        this.tb_MT.destroy();
        this.tb_MT = null;
        this.isTableBuilt = false;
      }

      this.tb_MT = new Tabulator(container, {
        height: '100%',
        layout: 'fitDataStretch',
        selectable: 1,
        selectableRows: 1,
        columnHeaderVertAlign: 'bottom',
        movableColumns: false,
        placeholder: 'Không có dữ liệu chấm công',

        // Nhóm theo phòng ban
        groupBy: 'DepartmentName',
        groupStartOpen: true,
        groupHeader: (value: string, count: number) =>
          `<span style="font-weight:600">Phòng ban: ${value} (${count})</span>`,

        columns: this.buildColumnsMT(year, month),
      } as any);

      // Setup events
      this.tb_MT.on('dataLoading', () => {
        this.isLoadTable = true;
      });

      this.tb_MT.on('dataLoaded', (data: any) => {
        this.isLoadTable = false;
      });

      this.tb_MT.on('dataLoadError', (error: any) => {
        this.isLoadTable = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu bảng chấm công');
      });

      this.tb_MT.on('rowClick', (e: any, row: any) => {
        const clickedField = e.target
          .closest('.tabulator-cell')
          ?.getAttribute('tabulator-field');
        if (clickedField !== 'select') {
          this.tb_MT.deselectRow();
          row.select();
        }
      });

      this.tb_MT.on('tableBuilt', () => {
        this.isTableBuilt = true;
        // Load data after table is built
        setTimeout(() => {
          this.loadMTData();
        }, 100); // Thêm một chút delay để đảm bảo table đã sẵn sàng
      });

    } catch (error) {
      this.isLoadTable = false;
      this.notification.error(NOTIFICATION_TITLE.error, 'Không thể khởi tạo bảng chấm công');
    }
  }

  /** Ưu tiên lấy từ filter; nếu không có thì lấy từ tab đang mở; nếu vẫn không có thì lấy từ tab còn lại */
  private pickSelectedFromTables(): { employeeId: number; fullName: string } {
    // 1) từ filter (combobox nhân viên)
    const idFromFilter =
      (this.selectedEmployee &&
        (this.selectedEmployee.id ?? this.selectedEmployee.ID)) ??
      Number(this.selectedEmployee);
    if (idFromFilter) {
      const name =
        this.selectedEmployee?.FullName ||
        this.selectedEmployee?.fullName ||
        '';
      return { employeeId: Number(idFromFilter), fullName: name };
    }

    // 2) hàm lấy từ bảng
    const fromMT = () => {
      const rows = this.tb_MT?.getSelectedData?.() ?? [];
      if (!rows.length) return null;
      return {
        employeeId: Number(rows[0]?.EmployeeID || rows[0]?.ID || 0),
        fullName: rows[0]?.FullName || '',
      };
    };
    const fromDT = () => {
      const rows = this.tb_DT?.getSelectedData?.() ?? [];
      if (!rows.length) return null;
      return {
        employeeId: Number(rows[0]?.EmployeeID || rows[0]?.ID || 0),
        fullName: rows[0]?.FullName || '',
      };
    };

    // 3) ưu tiên tab đang mở
    if (this.activeTabIndex === 0)
      return fromMT() || fromDT() || { employeeId: 0, fullName: '' };
    return fromDT() || fromMT() || { employeeId: 0, fullName: '' };
  }

  drawTbDT(container: HTMLElement) {
    if (!container) {
      return;
    }

    const toBool = (v: any) => {
      if (v === true || v === false) return v;
      const n = Number(v);
      if (!isNaN(n)) return n > 0;
      const s = String(v).toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    };

    const checkboxFormatter = (cell: any) => {
      const checked = toBool(cell.getValue());
      return checked
        ? "<input type='checkbox' checked readonly style='pointer-events:none'/>"
        : "<input type='checkbox' readonly style='pointer-events:none'/>";
    };

    const fmtDate = (v: any) => {
      if (!v) return '';
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const fmtTime = (v: any) => {
      if (!v) return '';
      const d = new Date(v);
      if (isNaN(d.getTime())) return '';
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${hh}:${mi}:${ss}`;
    };

    const fmtNum2 = (cell: any) => {
      const n = Number(cell.getValue());
      return Number.isFinite(n) ? n.toFixed(2) : '0.00';
    };

    try {
      if (this.tb_DT) {
        this.tb_DT.destroy();
        this.tb_DT = null;
      }
      this.isDTBuilt = false;

      this.tb_DT = new Tabulator(container, {
        height: '100%',
        layout: 'fitDataStretch',
        selectable: 1,
        selectableRows: 1,
        columnHeaderVertAlign: 'bottom',
        movableColumns: false,
        placeholder: 'Không có dữ liệu chấm công',

        // GROUP BY phòng ban
        groupBy: 'DepartmentName',
        groupStartOpen: true,
        groupHeader: (value: string, count: number) =>
          `<span style="font-weight:600">Phòng ban: ${value} (${count})</span>`,

        initialSort: [
          { column: 'DepartmentSTT', dir: 'asc' },
          { column: 'FullName', dir: 'asc' },
          { column: 'DayFinger', dir: 'asc' },
        ],

        columns: [
          // Nhân sự
          {
            title: 'Mã nhân viên',
            field: 'Code',
            width: 120,
            headerHozAlign: 'center',
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            width: 220,
            headerHozAlign: 'center',
          },
          {
            title: 'Chức vụ',
            field: 'PositionName',
            width: 220,
            headerHozAlign: 'center',
          },

          // Ngày & giờ
          {
            title: 'Ngày',
            field: 'DayFinger',
            width: 110,
            hozAlign: 'center',
            headerHozAlign: 'center',
            // sorter: 'datetime',
            // sorterParams: { format: 'YYYY-MM-DD' },
            formatter: (c: any) => fmtDate(c.getValue()),
          },
          {
            title: 'Check In',
            field: 'CheckIn',
            width: 95,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (c: any) => fmtTime(c.getValue()),
          },
          {
            title: 'Check Out',
            field: 'CheckOut',
            width: 95,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (c: any) => fmtTime(c.getValue()),
          },

          // Trạng thái (checkbox)
          {
            title: 'Quên vân tay',
            field: 'NoFinger',
            width: 120,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },
          {
            title: 'Đi muộn',
            field: 'IsLate',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },
          {
            title: 'Về sớm',
            field: 'IsEarly',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },

          // Công tác: giữ field = BussinessCode; nếu null nhưng CostBussiness>0 thì hiện "Có"
          {
            title: 'Công tác',
            field: 'BussinessCode',
            width: 220,
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const code = cell.getValue();
              if (code) return code;
              const row = cell.getRow().getData();
              return (Number(row?.CostBussiness) || 0) > 0 ? 'Có' : '';
            },
          },

          {
            title: 'Đi làm sớm',
            field: 'CostWorkEarly',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },
          {
            title: 'Không chấm công',
            field: 'NotCheckin',
            width: 140,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },

          // Số liệu
          {
            title: 'Làm thêm',
            field: 'TotalTimeOT',
            width: 100,
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: fmtNum2,
          },
          {
            title: 'Phụ cấp ăn tối',
            field: 'Overnight',
            width: 140,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: checkboxFormatter,
          },

          // Text / số nghỉ
          {
            title: 'Nghỉ phép',
            field: 'OnLeaveTypeText',
            width: 100,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (c: any) => c.getValue() ?? '',
          },
          {
            title: 'Tổng ngày nghỉ',
            field: 'OnLeaveDay',
            width: 100,
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: fmtNum2,
          },

          // Khác
          {
            title: 'WFH',
            field: 'TotalDayWFH',
            width: 80,
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: fmtNum2,
          },
          {
            title: 'Làm đêm',
            field: 'TotalNightShift',
            width: 90,
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: fmtNum2,
          },
          {
            title: 'Công',
            field: 'TotalDayText',
            width: 120,
            headerHozAlign: 'center',
            formatter: (c: any) => c.getValue() ?? '',
          },
          {
            title: 'Ăn ca',
            field: 'TotalLunchText',
            width: 90,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (c: any) => c.getValue() ?? '',
          },

          // phụ trợ sort group
          { title: '', field: 'DepartmentSTT', visible: false },
        ],
      } as any);

      this.tb_DT.on('tableBuilt', () => {
        this.isDTBuilt = true;
        this.loadDTData();
      });
    } catch (err) {
      // Error creating DT table
    }
  }

  loadMTData(): void {
    if (!this.tb_MT || !this.isTableBuilt) return;

    const params = this.getAjaxParamsMT();
    this.isLoadTable = true;

    this.etService
      .getTimekeepingData(
        params.employeeId,
        params.month,
        params.year,
        params.departmentId,
        params.keyword
      )
      .subscribe({
        next: (response) => {
          this.isLoadTable = false;

          if (response && response.status === 1) {
            // 1) cập nhật info cho header
            this.totalWorkday = response.totalWorkday || 0;
            this.weekdays = response.weekdays || {};

            // 2) REBUILD cột theo tháng/năm hiện tại + totalWorkday mới
            this.tb_MT.setColumns(
              this.buildColumnsMT(params.year, params.month)
            );

            // 3) set data
            const mainData = response.data || [];
            this.tb_MT.setData(mainData);
          } else {
            // vẫn rebuild để đổi tiêu đề kể cả khi rỗng
            this.tb_MT.setColumns(
              this.buildColumnsMT(params.year, params.month)
            );
            this.tb_MT.setData([]);
          }
        },
        error: () => {
          this.isLoadTable = false;
          this.tb_MT.setColumns(this.buildColumnsMT(params.year, params.month));
          this.tb_MT.setData([]);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải dữ liệu bảng chấm công'
          );
        },
      });
  }

  loadDTData(): void {
    if (!this.tb_DT) return;

    const p = this.getAjaxParamsMT();
    this.isLoadTable = true;

    this.etService
      .getTimekeepingDetailData(
        p.employeeId,
        p.month,
        p.year,
        p.departmentId,
        p.keyword
      )
      .subscribe({
        next: (res) => {
          this.isLoadTable = false;
          const rows = this.normalizeDTDeep(res);
          this.tb_DT.setData(rows);
        },
        error: (err) => {
          this.isLoadTable = false;
          this.tb_DT.setData([]);
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu chi tiết công');
        },
      });
  }

  /** Nhận bất kỳ payload nào và trả về mảng bản ghi DT */
  private normalizeDTDeep(res: any): any[] {
    const isRec = (o: any) =>
      o &&
      typeof o === 'object' &&
      'DayFinger' in o &&
      ('EmployeeID' in o || 'Code' in o || 'FullName' in o);

    const collect = (node: any): any[] => {
      if (!node) return [];
      if (Array.isArray(node)) return node.flatMap(collect);
      if (isRec(node)) return [node];

      if (typeof node === 'object') {
        // ưu tiên các key phổ biến
        for (const k of [
          'data',
          'Data',
          'items',
          'result',
          'Results',
          'rows',
          'Records',
          'table',
          'Table',
          '0',
        ]) {
          if (k in node) {
            const got = collect((node as any)[k]);
            if (got.length) return got;
          }
        }
        // fallback: đi qua mọi value
        return Object.values(node).flatMap(collect);
      }
      return [];
    };

    const out = collect(res);
    return out;
  }

  private buildColumnsMT(year: number, month: number) {
    // Các cột thông tin nhân viên (lá)
    const leftInfoCols = [
      {
        title: 'STT',
        field: 'STT',
        width: 60,
        hozAlign: 'center',
        headerHozAlign: 'center',
      },
      {
        title: 'Mã nhân viên',
        field: 'Code',
        width: 115,
        headerHozAlign: 'center',
      },
      {
        title: 'Họ tên',
        field: 'FullName',
        width: 220,
        headerHozAlign: 'center',
      },
      {
        title: 'Chức vụ',
        field: 'PositionName',
        width: 260,
        headerHozAlign: 'center',
      },
    ];

    // Cột ngày + weekend vàng (hàm này bạn đã có)
    const dayCols = this.buildDayColumnsMT(year, month); // giữ titleFormatter tô vàng T7/CN

    // Các cột tổng
    const rightTotals = [
      {
        title: 'Số công đi làm thực tế',
        field: 'TotalDayActual',
        width: 160,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Công nghỉ Lễ, tết',
        field: 'TotalHoliday',
        width: 140,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Công nghỉ phép',
        field: 'TotalDayOnleave2',
        width: 130,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Công nghỉ việc riêng có hưởng lương',
        field: 'TotalDayOnleave3',
        width: 260,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Công WFH',
        field: 'TotalDayWFH',
        width: 110,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Tổng số công được hưởng',
        field: 'TotalDayGet',
        width: 190,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Công nghỉ không hưởng lương',
        field: 'TotalDayOnleave1',
        width: 230,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
      {
        title: 'Tổng',
        field: 'TotalDay',
        width: 120,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
        formatter: (c: any) => (c.getValue() ?? 0).toString(),
      },
    ];

    // NHÓM TRÁI: Công ty (frozen) -> hàng dưới là "Công tiêu chuẩn = X" (group header) -> dưới nữa là cột STT/Code/FullName/Position
    const companyGroup = {
      title: 'Công ty Cổ Phần RTC Technology Việt Nam',
      headerHozAlign: 'center',
      frozen: true, // freeze cả NHÓM (đừng freeze cột con để tránh lỗi)
      columns: [
        {
          title: `Công tiêu chuẩn = ${this.totalWorkday || 0}`,
          headerHozAlign: 'right',
          columns: leftInfoCols, // header này chỉ là TẦNG, không tạo cột dữ liệu
        },
      ],
    };

    // NHÓM PHẢI: Bảng chấm công tháng ...
    const timekeepingGroup = {
      title: `BẢNG CHẤM CÔNG THÁNG ${month}/${year}`,
      headerHozAlign: 'left',
      columns: [...dayCols, ...rightTotals],
    };

    // 2 nhóm top-level cùng tầng
    return [companyGroup, timekeepingGroup];
  }

  private buildDayColumnsMT(year: number, month: number) {
    const days = new Date(year, month, 0).getDate();
    const cols: any[] = [];

    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month - 1, d);
      const dow = date.getDay(); // 0=CN..6=T7
      const isWeekend = dow === 0 || dow === 6;
      const dowLabel = dow === 0 ? 'CN' : `T${dow + 1}`;
      const field = `D${d}`; // Sử dụng D1, D2, ... theo stored procedure

      cols.push({
        title: String(d),
        field,
        width: 48,
        hozAlign: 'center',
        headerHozAlign: 'center',
        headerSort: false,
        cssClass: isWeekend ? 'mt-weekend' : '',
        titleFormatter: () => {
          const key = `D${d}`;
          const dow = new Date(year, month - 1, d).getDay(); // 0=CN..6=T7
          const text = this.weekdays?.[key]
            ? (this.weekdays[key] as string).split(';')[0]
            : dow === 0
            ? 'CN'
            : `T${dow + 1}`;
          const isWeekend = dow === 0 || dow === 6;
          return `<div class="mt-header-day${isWeekend ? ' weekend' : ''}">
            <div class="dow">${text}</div>
            <div class="day">${d}</div>
          </div>`;
        },

        formatter: (cell: any) => {
          const value = cell.getValue();
          return value || '';
        },
      });
    }
    return cols;
  }

  private getYear() {
    return this.year
      ? new Date(this.year).getFullYear()
      : new Date().getFullYear();
  }

  private getMonth() {
    if (typeof this.month === 'number') return this.month;
    if (this.month instanceof Date) return this.month.getMonth() + 1;
    const n = Number(this.month);
    return Number.isFinite(n) ? n : new Date().getMonth() + 1;
  }

  private getAjaxParamsMT() {
    return {
      year: this.getYear(),
      month: this.getMonth(),
      departmentId: this.selectedDepartment ?? 0,
      employeeId: this.selectedEmployee ?? 0,
      keyword: (this.searchValue || '').trim(),
      etId: this.etId || 0,
    };
  }

  // Method để refresh data
  refreshData(): void {
    if (this.isTableBuilt && this.tb_MT) {
      this.loadMTData();
      this.notification.info(NOTIFICATION_TITLE.success, 'Đã làm mới dữ liệu');
    }
  }

  // Method để đóng modal (nếu đang mở qua modal)
  closeModal(result?: any): void {
    if (this.activeModal) {
      this.activeModal.close(result || { action: 'close' });
    }
  }
}
