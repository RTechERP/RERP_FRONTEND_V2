import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { BookingRoomService, BookingRoom } from './booking-room.service';
import { BookingRoomStateService } from './booking-room-state.service';
import { DepartmentServiceService } from '../department/department-service/department-service.service';
import { EmployeeService } from '../employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { BookingRoomFormComponent } from './booking-room-form/booking-room-form.component';

interface BookingRoomValue {
  Value: string;
  Id: number;
  EmployeeId: number;
  IsApproved: number;
}

interface TimeSlot {
  field: string;
  time: string;
}

@Component({
  selector: 'app-booking-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzFormModule,
    NzSpinModule,
    NzGridModule,
  ],
  templateUrl: './booking-room.component.html',
  styleUrls: ['./booking-room.component.css'],
})
export class BookingRoomComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('calendar1', { static: false })
  calendar1Ref!: ElementRef<HTMLDivElement>;
  @ViewChild('calendar2', { static: false })
  calendar2Ref!: ElementRef<HTMLDivElement>;
  @ViewChild('calendar3', { static: false })
  calendar3Ref!: ElementRef<HTMLDivElement>;

  searchForm!: FormGroup;

  isDataLoading = false;

  dateStart: Date | null = null;
  dateEnd: Date | null = null;

  roomCalendars: Map<string, Calendar> = new Map();
  roomData: { room1: any[]; room2: any[]; room3: any[] } = {
    room1: [],
    room2: [],
    room3: [],
  };

  departments: any[] = [];
  employees: any[] = [];
  meetingRooms = [
    { value: 1, label: 'MEETING ROOM 1 (HỒ TÂY)' },
    { value: 2, label: 'MEETING ROOM 2 (HỒ GƯƠM)' },
    { value: 3, label: 'MEETING ROOM 3 (HỒ TRÚC BẠCH)' },
  ];

  colors = [
    '#EF9A9A',
    '#F48FB1',
    '#CE93D8',
    '#9FA8DA',
    '#90CAF9',
    '#4FC3F7',
    '#80DEEA',
    '#80CBC4',
    '#A5D6A7',
    '#9CCC65',
    '#FFCC80',
    '#BCAAA4',
    '#FFD600',
    '#FFAB00',
    '#00BFA5',
    '#AEEA00',
    '#ECEFF1',
    '#B388FF',
    '#EA80FC',
    '#FF8A80',
  ];
  currentEmployeeId: number = 0;

  private dateRangeSubscription?: Subscription;
  private isUpdatingFromStore = false;

  private readonly TIME_SLOTS: TimeSlot[] = [
    { field: '08:00', time: '08:00' },
    { field: '08:30', time: '08:30' },
    { field: '09:00', time: '09:00' },
    { field: '09:30', time: '09:30' },
    { field: '10:00', time: '10:00' },
    { field: '10:30', time: '10:30' },
    { field: '11:00', time: '11:00' },
    { field: '11:30', time: '11:30' },
    { field: '12:00', time: '12:00' },
    { field: '12:30', time: '12:30' },
    { field: '13:00', time: '13:00' },
    { field: '13:30', time: '13:30' },
    { field: '14:00', time: '14:00' },
    { field: '14:30', time: '14:30' },
    { field: '15:00', time: '15:00' },
    { field: '15:30', time: '15:30' },
    { field: '16:00', time: '16:00' },
    { field: '16:30', time: '16:30' },
    { field: '17:00', time: '17:00' },
    { field: '17:30', time: '17:30' },
  ];

  constructor(
    private fb: FormBuilder,
    private bookingRoomService: BookingRoomService,
    private bookingRoomStateService: BookingRoomStateService,
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private appUserService: AppUserService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) {
    this.currentEmployeeId = this.appUserService.employeeID || 0;
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadDepartments();
    this.loadEmployees();

    const currentRange = this.bookingRoomStateService.getCurrentDateRange();
    this.dateStart = currentRange.dateStart;
    this.dateEnd = currentRange.dateEnd;

    this.searchForm.patchValue({
      dateStart: currentRange.dateStart,
      dateEnd: currentRange.dateEnd,
    });

    this.dateRangeSubscription = this.bookingRoomStateService.dateRange$.subscribe(
      (range) => {
        const isDateChanged = 
          !this.dateStart || 
          !this.dateEnd ||
          this.dateStart.getTime() !== range.dateStart.getTime() ||
          this.dateEnd.getTime() !== range.dateEnd.getTime();
        
        if (!isDateChanged) {
          return;
        }
        
        this.dateStart = range.dateStart;
        this.dateEnd = range.dateEnd;
        this.searchForm.patchValue(
          {
            dateStart: range.dateStart,
            dateEnd: range.dateEnd,
          },
          { emitEvent: false }
        );
        
        if (this.isUpdatingFromStore) {
          this.isUpdatingFromStore = false;
        }
        
        this.getAllBookingRoom();
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCalendars();
      const currentRange = this.bookingRoomStateService.getCurrentDateRange();
      this.roomCalendars.forEach((calendar) => {
        if (calendar) {
          calendar.gotoDate(currentRange.dateStart);
        }
      });
      this.getAllBookingRoom();
    }, 100);
  }

  ngOnDestroy(): void {
    this.roomCalendars.forEach((cal) => cal.destroy());
    this.roomCalendars.clear();
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  private initializeForms(): void {
    this.searchForm = this.fb.group({
      dateStart: [null, Validators.required],
      dateEnd: [null, Validators.required],
    });
  }

  private initializeCalendars(): void {
    this.initCalendar('calendar1', 1);
    this.initCalendar('calendar2', 2);
    this.initCalendar('calendar3', 3);
  }

  private initCalendar(refName: string, roomId: number): void {
    const ref =
      refName === 'calendar1'
        ? this.calendar1Ref
        : refName === 'calendar2'
        ? this.calendar2Ref
        : this.calendar3Ref;

    if (!ref?.nativeElement) return;

    const el = ref.nativeElement;
    const calendar = new Calendar(el, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      locale: 'vi',
      initialView: 'timeGridWeek',
      firstDay: 1,
      slotMinTime: '08:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '00:30:00',
      allDaySlot: false,
      slotLabelInterval: '01:00:00',
      slotLabelContent: (arg: any) => {
        const h = arg.date.getHours();
        const m = arg.date.getMinutes();
        return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
      },
      height: 'auto',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay',
      },
      editable: false,
      eventStartEditable: false,
      eventDurationEditable: false,
      droppable: false,
      navLinks: false,
      eventClick: (info: any) => {
        if (info.jsEvent.target.closest('.fc-event-delete-btn')) return;
        const id = parseInt(info.event.id || '0', 10) || 0;
        const date = info.event.startStr.split('T')[0];
        const roomId = parseInt(
          info.event.extendedProps?.MeetingRoomID || '0',
          10
        );
        const startTime = info.event.startStr;
        const endTime = info.event.endStr;
        const canDelete = info.event.extendedProps?.canDelete;    
        this.onEditBookingRoom(id, date, roomId, startTime, endTime, !canDelete);
      },
      dateClick: (info: any) => {
        const date = DateTime.fromJSDate(info.date).toFormat('yyyy-MM-dd');
        const time = `${String(info.date.getHours()).padStart(2, '0')}:${String(info.date.getMinutes()).padStart(2, '0')}`;
        const roomId = this.getRoomIdFromCalendarKey(refName);
        this.onAddBookingRoomFromCalendar(date, time, roomId);
      },
      selectable: true,
      datesSet: (dateInfo: any) => {
        if (refName === 'calendar1' && dateInfo.start && dateInfo.end) {
          const startDate = new Date(dateInfo.start);
          const endDate = new Date(dateInfo.end);
          const dayOfWeek = startDate.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate.setDate(startDate.getDate() + diff);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          this.isUpdatingFromStore = true;
          this.bookingRoomStateService.setDateRange(startDate, endDate);
        }
      },
      eventDidMount: (info: any) => {
        const canDelete = info.event.extendedProps?.canDelete;
        if (!canDelete) return;

        const eventMain = info.el.querySelector('.fc-event-main');
        if (!eventMain) return;

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'fc-event-delete-btn';
        deleteBtn.title = 'Xóa đặt phòng';

        const icon = document.createElement('i');
        icon.className = 'fas fa-trash';
        deleteBtn.appendChild(icon);
        
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const id = parseInt(info.event.id, 10);
          const room = parseInt(
            info.event.extendedProps?.MeetingRoomID || '0',
            10
          );
          const date = info.event.startStr.split('T')[0];
          this.onDeleteBookingRoom(id, room, date, e);
        });

        const eventEl = info.el;
        if (window.getComputedStyle(eventEl).position === 'static') {
          eventEl.style.position = 'relative';
        }

        eventEl.appendChild(deleteBtn);
      },
    });

    calendar.render();
    this.roomCalendars.set(refName, calendar);
    
    if (refName === 'calendar1') {
      setTimeout(() => {
        const calendarEl = el;
        const prevBtn = calendarEl.querySelector('.fc-prev-button');
        const nextBtn = calendarEl.querySelector('.fc-next-button');
        const todayBtn = calendarEl.querySelector('.fc-today-button');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            setTimeout(() => this.handleCalendarNavigation(), 100);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            setTimeout(() => this.handleCalendarNavigation(), 100);
          });
        }
        if (todayBtn) {
          todayBtn.addEventListener('click', () => {
            setTimeout(() => this.handleCalendarNavigation(), 100);
          });
        }
      }, 200);
    }
  }

  private handleCalendarNavigation(): void {
    const calendar1 = this.roomCalendars.get('calendar1');
    if (!calendar1) return;

    const view = calendar1.view;
    if (!view) return;

    const start = view.activeStart;
    const end = view.activeEnd;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const dayOfWeek = startDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate.setDate(startDate.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      this.isUpdatingFromStore = true;
      this.bookingRoomStateService.setDateRange(startDate, endDate);
    }
  }

  onSearchDateChange(): void {
    const dateStart = this.searchForm.get('dateStart')?.value;
    const dateEnd = this.searchForm.get('dateEnd')?.value;

    if (dateStart && dateEnd) {
      this.dateStart = dateStart;
      this.dateEnd = dateEnd;
      this.isUpdatingFromStore = true;
      this.bookingRoomStateService.setDateRange(dateStart, dateEnd);
      setTimeout(() => {
        this.isUpdatingFromStore = false;
      }, 100);
      this.updateCalendarViews(dateStart);
      this.getAllBookingRoom();
    }
  }

  private updateCalendarViews(dateStart: Date): void {
    this.roomCalendars.forEach((calendar) => {
      if (calendar) {
        calendar.gotoDate(dateStart);
      }
    });
  }

  getAllBookingRoom(): void {
    if (!this.dateStart || !this.dateEnd) return;

    this.isDataLoading = true;
    this.bookingRoomService
      .getBookingRooms(this.dateStart, this.dateEnd, true)
      .subscribe({
        next: (result: any) => {
          if (result.status === 1 && result.data) {
            const data = result.data;
            this.roomData = {
              room1: data.room1 || data.Item1 || [],
              room2: data.room2 || data.Item2 || [],
              room3: data.room3 || data.Item3 || [],
            };
            this.hydrateCalendarsFromResult();
          } else {
            this.roomData = { room1: [], room2: [], room3: [] };
            this.hydrateCalendarsFromResult();
          }
          this.isDataLoading = false;
        },
        error: (err) => {
          this.isDataLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Không thể tải dữ liệu đặt phòng'
          );
        },
      });
  }

  private hydrateCalendarsFromResult(): void {
    const events1 = this.buildEvents(this.roomData.room1, 1);
    const events2 = this.buildEvents(this.roomData.room2, 2);
    const events3 = this.buildEvents(this.roomData.room3, 3);

    const initDate = this.pickInitDate(this.roomData.room1);

    this.renderCalendar('calendar1', events1, initDate);
    this.renderCalendar('calendar2', events2, initDate);
    this.renderCalendar('calendar3', events3, initDate);
  }

  private buildEvents(dataSource: any[], meetingRoomId: number): any[] {
    const events: any[] = [];
    const colorMap = new Map<number, string>();

    if (!dataSource || dataSource.length === 0) {
      return events;
    }

    for (const row of dataSource) {
      if (!row || !row.AllDate) {
        continue;
      }

      let allDate: Date;
      if (typeof row.AllDate === 'string') {
        allDate = new Date(row.AllDate);
      } else {
        allDate = row.AllDate;
      }

      if (isNaN(allDate.getTime())) {
        continue;
      }

      const dateISO = DateTime.fromJSDate(allDate).toFormat('yyyy-MM-dd');

      let i = 0;
      while (i < this.TIME_SLOTS.length) {
        const fieldName = this.TIME_SLOTS[i].field;
        const fieldValue = row[fieldName];
        const v = this.getValueBookingRoom(fieldValue);
        
        if (!v.Id) {
          i++;
          continue;
        }

        const idStart = v.Id;
        const employeeId = v.EmployeeId || 0;
        
        if (!colorMap.has(employeeId)) {
          const colorIndex = colorMap.size % this.colors.length;
          colorMap.set(employeeId, this.colors[colorIndex]);
        }
        const backgroundColor = colorMap.get(employeeId) || this.colors[0];

        const title = `${row.DepartmentName ? `[${row.DepartmentName}] ` : ''}${
          v.Value || 'Nội dung cuộc họp'
        }`;

        let j = i + 1;
        while (
          j < this.TIME_SLOTS.length &&
          this.getValueBookingRoom(row[this.TIME_SLOTS[j].field]).Id === idStart
        ) {
          j++;
        }

        const start = `${dateISO}T${this.TIME_SLOTS[i].time}:00`;
        const end =
          j < this.TIME_SLOTS.length
            ? `${dateISO}T${this.TIME_SLOTS[j].time}:00`
            : DateTime.fromISO(`${dateISO}T${this.TIME_SLOTS[j - 1].time}:00`)
                .plus({ minutes: 30 })
                .toISO();

        const event = {
          id: String(idStart),
          title: title.trim() || 'Đặt phòng họp',
          start,
          end,
          allDay: false,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor,
          textColor: '#ffffff',
          extendedProps: {
            MeetingRoomID: row.MeetingRoomID || meetingRoomId,
            AllDate: row.AllDate,
            canDelete: v.EmployeeId === this.currentEmployeeId,
            Content: v.Value || '',
            DepartmentName: row.DepartmentName || '',
            IsApproved: v.IsApproved || 0,
          },
        };

        events.push(event);
        i = j;
      }
    }

    return events;
  }

  private getValueBookingRoom(data: string = ''): BookingRoomValue {
    const obj: BookingRoomValue = {
      Value: '',
      Id: 0,
      EmployeeId: 0,
      IsApproved: 0,
    };

    if (!data) return obj;
    
    const dataStr = typeof data === 'string' ? data : String(data || '');
    const s = dataStr.trim();
    
    if (!s || s.indexOf('#') < 0) {
      return obj;
    }

    const [val, meta] = s.split('#');
    const [id, emp, appr] = (meta || '').split('-').map((x) => {
      const parsed = parseInt(x, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });

    if (!Number.isFinite(id) || id <= 0) {
      return obj;
    }

    obj.Value = val || '';
    obj.Id = id;
    obj.EmployeeId = Number.isFinite(emp) ? emp : 0;
    obj.IsApproved = Number.isFinite(appr) ? appr : 0;

    return obj;
  }

  private pickInitDate(ds: any[]): string {
    if (Array.isArray(ds) && ds.length && ds[0]?.AllDate) {
      return DateTime.fromJSDate(new Date(ds[0].AllDate)).toFormat('yyyy-MM-dd');
    }
    return this.dateStart
      ? DateTime.fromJSDate(this.dateStart).toFormat('yyyy-MM-dd')
      : DateTime.now().toFormat('yyyy-MM-dd');
  }

  private renderCalendar(
    refName: string,
    events: any[],
    initDate: string
  ): void {
    const calendar = this.roomCalendars.get(refName);
    if (!calendar) {
      return;
    }

    calendar.removeAllEvents();
    
    if (events && events.length > 0) {
      events.forEach((event) => {
        try {
          calendar.addEvent(event);
        } catch (error) {
        }
      });
    }
    
    if (initDate) {
      calendar.gotoDate(initDate);
    }
    
    calendar.render();
    
    setTimeout(() => {
      calendar.updateSize();
    }, 100);
  }

  onAddBookingRoom(): void {
    const modalRef = this.modalService.open(BookingRoomFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.getAllBookingRoom();
        }
      }
    );
  }

  onEditBookingRoom(id: number, date: string, roomId?: number, startTime?: string, endTime?: string, isViewOnly: boolean = false): void {
    if (id <= 0) {
      const finalRoomId = roomId || 1;
      const bookingData: BookingRoom = {
        ID: 0,
        MeetingRoomId: finalRoomId,
        DateRegister: date,
        Content: '',
        StartTime: '',
        EndTime: '',
        DepartmentId: 0,
        EmployeeId: this.currentEmployeeId,
      };

      const modalRef = this.modalService.open(BookingRoomFormComponent, {
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });

      modalRef.componentInstance.data = bookingData;
      modalRef.componentInstance.isEditMode = false;
      modalRef.componentInstance.isViewOnly = false;

      modalRef.result.then(
        (result) => {
          if (result?.success) {
            this.getAllBookingRoom();
          }
        }
      );
      return;
    }

    this.bookingRoomService.getBookingRoomById(id).subscribe({
      next: (result: any) => {
        if (result.status === 1 && result.data) {
          const booking = result.data;
          const finalStartTime = startTime || booking.StartTime || `${date}T08:00:00`;
          const finalEndTime = endTime || booking.EndTime || `${date}T10:00:00`;
          const bookingEmployeeId = booking.EmployeeId || booking.EmployeeID || 0;
          const isViewOnlyMode = isViewOnly || (bookingEmployeeId !== this.currentEmployeeId);
          
          const bookingData: BookingRoom = {
            ID: booking.ID || booking.Id || 0,
            MeetingRoomId: booking.MeetingRoomId || booking.MeetingRoomID,
            DateRegister: booking.DateRegister || date,
            StartTime: finalStartTime,
            EndTime: finalEndTime,
            Content: booking.Content || '',
            EmployeeId: bookingEmployeeId,
            DepartmentId: booking.DepartmentId || booking.DepartmentID || 0,
            IsApproved: booking.IsApproved || 0,
          };

          const modalRef = this.modalService.open(BookingRoomFormComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false
          });

          modalRef.componentInstance.data = bookingData;
          modalRef.componentInstance.isEditMode = !isViewOnlyMode;
          modalRef.componentInstance.isViewOnly = isViewOnlyMode;
          modalRef.componentInstance.id = bookingData.ID || 0;

          modalRef.result.then(
            (result) => {
              if (result?.success) {
                this.getAllBookingRoom();
              }
            }
          );
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Không tìm thấy thông tin đặt phòng'
          );
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Lỗi khi tải thông tin đặt phòng'
        );
      },
    });
  }

  private findBookingInData(data: any[], id: number): any {
    for (const row of data) {
      for (const slot of this.TIME_SLOTS) {
        const value = this.getValueBookingRoom(row[slot.field]);
        if (value.Id === id) {
          return {
            ID: value.Id,
            MeetingRoomId: row.MeetingRoomID,
            DateRegister: row.AllDate,
            StartTime: `${row.AllDate}T${slot.time}:00`,
            EndTime: this.calculateEndTime(row, slot),
            Content: value.Value,
            EmployeeId: value.EmployeeId,
            DepartmentId: row.DepartmentID,
            IsApproved: value.IsApproved,
          };
        }
      }
    }
    return null;
  }

  private calculateEndTime(row: any, startSlot: TimeSlot): string {
    let endSlotIndex = this.TIME_SLOTS.findIndex((s) => s.field === startSlot.field) + 1;
    while (
      endSlotIndex < this.TIME_SLOTS.length &&
      this.getValueBookingRoom(row[this.TIME_SLOTS[endSlotIndex].field]).Id ===
        this.getValueBookingRoom(row[startSlot.field]).Id
    ) {
      endSlotIndex++;
    }
    const endSlot =
      endSlotIndex < this.TIME_SLOTS.length
        ? this.TIME_SLOTS[endSlotIndex]
        : this.TIME_SLOTS[endSlotIndex - 1];
    return `${row.AllDate}T${endSlot.time}:00`;
  }

  onAddBookingRoomFromCalendar(date: string, time: string, roomId: number): void {
    const bookingData: BookingRoom = {
      ID: 0,
      MeetingRoomId: roomId,
      DateRegister: date,
      Content: '',
      StartTime: `${date}T${time}:00`,
      EndTime: `${date}T${this.addHoursToTime(time, 2)}:00`,
      DepartmentId: 0,
      EmployeeId: this.currentEmployeeId,
    };

    const modalRef = this.modalService.open(BookingRoomFormComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.data = bookingData;
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.getAllBookingRoom();
        }
      }
    );
  }

  private addHoursToTime(time: string, hours: number): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const newH = (h + hours) % 24;
    return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private getRoomIdFromCalendarKey(key: string): number {
    if (key === 'calendar1') return 1;
    if (key === 'calendar2') return 2;
    if (key === 'calendar3') return 3;
    return 1;
  }

  onDeleteBookingRoom(id: number, roomId: number, date: string, event: any): void {
    event?.stopPropagation?.();
    const dateStr = DateTime.fromISO(date).toFormat('dd/MM/yyyy');
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa Đăng ký Phòng họp ${roomId}\nngày ${dateStr} không?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.bookingRoomService.deleteBookingRoom(id).subscribe({
          next: (result) => {
            if (result.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xóa thành công!'
              );
              this.getAllBookingRoom();
            } else {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                result.message || 'Không thể xóa!'
              );
            }
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              err?.error?.message || 'Lỗi khi xóa đặt phòng'
            );
          },
        });
      },
    });
  }

  private loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (result: any) => {
        const data = result.status === 1 ? result.data : result;
        if (Array.isArray(data)) {
          this.departments = data.map((dept: any) => ({
            value: dept.ID,
            label: dept.Name,
          }));
        }
      },
    });
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (result: any) => {
        const data = result.status === 1 ? result.data : result;
        if (Array.isArray(data)) {
          this.employees = data.map((emp: any) => ({
            value: emp.ID,
            label: `${emp.Code} - ${emp.FullName}`,
          }));
        }
      },
    });
  }

  onTabChange(index: number): void {
    setTimeout(() => {
      this.roomCalendars.forEach((cal) => cal.updateSize());
    }, 100);
  }
}

