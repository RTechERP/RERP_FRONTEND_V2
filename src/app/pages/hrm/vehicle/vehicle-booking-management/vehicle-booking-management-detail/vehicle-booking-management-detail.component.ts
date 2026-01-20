import { Component, OnInit, AfterViewInit, OnDestroy, inject, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import { AppUserService } from '../../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import flatpickr from 'flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn.js';

interface Passenger {
  index: number;
  employeeId: number;
  code: string;
  name: string;
  department: string;
  phoneNumber: string;
  note: string;
}

interface AttachedGoods {
  index: number;
  employeeId: number;
  code: string;
  name: string;
  phoneNumber: string;
  packageName: string;
  packageSize: string;
  packageWeight: string;
  packageQuantity: number;
  note: string;
  files: NzUploadFile[];
}

@Component({
  selector: 'app-vehicle-booking-management-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzTabsModule,
    NzUploadModule,
    NzIconModule,
    NzGridModule,
  ],
  templateUrl: './vehicle-booking-management-detail.component.html',
  styleUrl: './vehicle-booking-management-detail.component.css'
})
export class VehicleBookingManagementDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dataInput: any = null;
  @Input() isEdit: boolean = false;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  public activeModal = inject(NgbActiveModal);
  private vehicleBookingService = inject(VehicleBookingManagementService);
  private notification = inject(NzNotificationService);
  private appUserService = inject(AppUserService);

  // Form data
  id: number = 0;
  employeeId: number = 0;
  fullName: string = '';
  codeFullName: string = '';
  bookerVehicles: string = '';
  category: number = 1;
  timeNeedPresent: Date | null = null;
  timeReturn: Date | null = null;
  companyNameArrives: string = '';
  province: string | null = null;
  specificDestinationAddress: string = '';
  departureDate: Date | null = null;
  departureAddressSelect: number = 0;
  departureAddress: string = 'VP Hà Nội';
  departureReturnAddressSelect: number = 0;
  departureReturnAddress: string = 'VP Hà Nội';
  projectId: number = 0;
  vehicleType: number = 1;
  approvedTbp: number = 0;
  problemArises: string = '';

  // Lists
  employees: any[] = [];
  employeesGrouped: any[] = [];
  provinces: any[] = [];
  provincesArrives: any[] = [];
  projects: any[] = [];
  approvedList: any[] = [];
  categories: any[] = [
    { value: 1, label: 'Đăng ký người đi' },
    { value: 5, label: 'Đăng ký người về' },
    { value: 2, label: 'Đăng ký giao hàng thương mại' },
    { value: 6, label: 'Đăng ký lấy hàng thương mại' },
    { value: 7, label: 'Đăng ký lấy hàng Demo/triển Lãm' },
    { value: 8, label: 'Đăng ký giao hàng Demo/triển lãm' },
  ];
  categoryGroups: any[] = [
    {
      label: 'Cá nhân',
      options: [
        { value: 1, label: 'Đăng ký người đi' },
        { value: 5, label: 'Đăng ký người về' },
      ]
    },
    {
      label: 'Thương mại',
      options: [
        { value: 2, label: 'Đăng ký giao hàng thương mại' },
        { value: 6, label: 'Đăng ký lấy hàng thương mại' },
      ]
    },
    {
      label: 'Demo/triển lãm',
      options: [
        { value: 7, label: 'Đăng ký lấy hàng Demo/triển Lãm' },
        { value: 8, label: 'Đăng ký giao hàng Demo/triển lãm' },
      ]
    }
  ];
  vehicleTypes: any[] = [
    { value: 1, label: 'Ô tô, xe máy...' },
    { value: 2, label: 'Máy bay' },
  ];

  // Passengers
  passengers: Passenger[] = [];
  passengerIndex: number = 2;
  activePassengerTab: number = 1;

  // Attached Goods
  attachedGoods: AttachedGoods[] = [];
  attachedGoodsIndex: number = 2;
  activeAttachedGoodsTab: number = 1;

  // UI State
  showApprovedTbp: boolean = false;
  showProblemArises: boolean = false;
  showPassenger: boolean = true;
  showAttachedGoods: boolean = false;
  showTimeReturn: boolean = true;
  showDepartureReturn: boolean = false;
  isProblem: boolean = false;
  isSaving: boolean = false;

  // Flatpickr instances
  private flatpickrInstances: Map<string, flatpickr.Instance> = new Map();
  private documentClickHandler: ((e: MouseEvent) => void) | null = null;

  provinceDepartureIDs: number[] = [1, 2, 3, 4];

  // Validation errors
  errors: any = {
    timeNeedPresent: '',
    companyNameArrives: '',
    province: '',
    specificDestinationAddress: '',
    departureDate: '',
    departureAddress: '',
    departureReturnAddressSelect: '',
    departureReturnAddress: '',
    projectId: '',
    vehicleType: '',
    problemArises: '',
    approvedTbp: '',
    passengers: {} as { [key: number]: { name?: string, phoneNumber?: string } },
  };

  ngOnInit(): void {
    this.loadInitialData();
    if (this.dataInput) {
      this.loadEditData();
    } else {
      this.initializeNewForm();
    }
  }

  ngAfterViewInit(): void {
    // Initialize flatpickr after view is rendered
    setTimeout(() => {
      this.initializeFlatpickr();
    }, 100);
  }

  ngOnDestroy(): void {
    // Remove document click listener
    if (this.documentClickHandler) {
      document.removeEventListener('mousedown', this.documentClickHandler, true);
      this.documentClickHandler = null;
    }
    // Cleanup flatpickr instances
    this.flatpickrInstances.forEach((instance) => {
      instance.destroy();
    });
    this.flatpickrInstances.clear();
  }

  private initializeFlatpickr(): void {
    // Add document click listener để bắt sự kiện click ra ngoài flatpickr
    if (!this.documentClickHandler) {
      this.documentClickHandler = (e: MouseEvent) => {
        this.flatpickrInstances.forEach((instance, fieldId) => {
          if (instance.isOpen && instance.calendarContainer) {
            const target = e.target as HTMLElement;
            const isInsideCalendar = instance.calendarContainer.contains(target);
            const isInput = instance.input === target;

            if (!isInsideCalendar && !isInput) {
              // Click outside - force commit time values
              const hourInput = instance.calendarContainer.querySelector('.flatpickr-hour') as HTMLInputElement;
              const minuteInput = instance.calendarContainer.querySelector('.flatpickr-minute') as HTMLInputElement;

              if (hourInput && minuteInput && instance.selectedDates.length > 0) {
                const finalDate = new Date(instance.selectedDates[0]);
                const hour = parseInt(hourInput.value, 10) || 0;
                const minute = parseInt(minuteInput.value, 10) || 0;
                finalDate.setHours(hour, minute, 0, 0);
                instance.setDate(finalDate, true);
              }
            }
          }
        });
      };
      document.addEventListener('mousedown', this.documentClickHandler, true);
    }

    // TimeNeedPresent
    this.initializeFlatpickrField('timeNeedPresent', this.timeNeedPresent, (date: Date) => {
      this.timeNeedPresent = date;
      this.onTimeNeedPresentChange(date);
      this.errors.timeNeedPresent = '';
    });

    // DepartureDate - with minDate set to today
    this.initializeFlatpickrFieldWithMinDate('departureDate', this.departureDate, (date: Date) => {
      this.departureDate = date;
      this.errors.departureDate = '';
    }, new Date());

    // TimeReturn
    this.initializeFlatpickrField('timeReturn', this.timeReturn, (date: Date) => {
      this.timeReturn = date;
    });
  }

  private initializeFlatpickrField(fieldId: string, initialValue: Date | null, onChange: (date: Date) => void): void {
    const element = document.getElementById(fieldId);
    if (!element) return;

    // Destroy existing instance if any
    if (this.flatpickrInstances.has(fieldId)) {
      this.flatpickrInstances.get(fieldId)?.destroy();
    }

    const fpInstance = flatpickr(element, {
      enableTime: true,
      time_24hr: true,
      dateFormat: 'd/m/Y H:i',
      locale: Vietnamese,
      defaultDate: initialValue || undefined,
      allowInput: true,
      disableMobile: false,
      clickOpens: true,
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length > 0) {
          const date = selectedDates[0];
          date.setSeconds(0, 0);
          onChange(date);
        }
      }
    });

    this.flatpickrInstances.set(fieldId, fpInstance);
  }

  private initializeFlatpickrFieldWithMinDate(fieldId: string, initialValue: Date | null, onChange: (date: Date) => void, minDate: Date): void {
    const element = document.getElementById(fieldId);
    if (!element) return;

    // Destroy existing instance if any
    if (this.flatpickrInstances.has(fieldId)) {
      this.flatpickrInstances.get(fieldId)?.destroy();
    }

    const fpInstance = flatpickr(element, {
      enableTime: true,
      time_24hr: true,
      dateFormat: 'd/m/Y H:i',
      locale: Vietnamese,
      defaultDate: initialValue || undefined,
      allowInput: true,
      disableMobile: false,
      minDate: minDate,
      clickOpens: true,
      onChange: (selectedDates: Date[]) => {
        if (selectedDates.length > 0) {
          const date = selectedDates[0];
          date.setSeconds(0, 0);
          onChange(date);
        }
      }
    });

    this.flatpickrInstances.set(fieldId, fpInstance);
  }

  private updateFlatpickrValue(fieldId: string, value: Date | null): void {
    const instance = this.flatpickrInstances.get(fieldId);
    if (instance && value) {
      instance.setDate(value, false);
    }
  }

  private reinitializeFlatpickr(): void {
    setTimeout(() => {
      this.initializeFlatpickr();
    }, 100);
  }

  loadProvincesArrives(): void {
    this.vehicleBookingService.getProvinceArrives(this.employeeId).subscribe({
      next: (data: any) => {
        const responseData = data?.data || data?.Data || data;
        if (Array.isArray(responseData)) {
          this.provincesArrives = responseData.map((item: any) => ({
            value: item.ID || item.Id || item.Value,
            label: item.ProvinceName || item.Name || item.Label || item.Text
          }));
        } else {
          this.provincesArrives = [];
        }
        if (!this.provincesArrives.find((p: any) => p.value === 0)) {
          this.provincesArrives.push({ value: 0, label: 'Khác' });
        }
      },
      error: (err) => {
        console.error('Error loading provinces arrives:', err);
        this.provincesArrives = [
          { value: 1, label: 'Hà Nội' },
          { value: 2, label: 'Bắc Ninh' },
          { value: 3, label: 'Hải Phòng' },
          { value: 4, label: 'Hồ Chí Minh' },
          { value: 0, label: 'Khác' },
        ];
      }
    });
  }

  loadInitialData(): void {
    // Load employees
    this.vehicleBookingService.getEmployee().subscribe({
      next: (data: any) => {
        if (data?.status === 1) {
          this.employees = (data.data || []).filter((emp: any) => {
            const fullName = emp.FullName || emp.Name || '';
            return fullName && fullName.trim().length > 0;
          });
          this.employeesGrouped = this.vehicleBookingService.createdDataGroup(this.employees, 'DepartmentName').map(group => ({
            department: group.label,
            list: group.options.map((opt: any) => opt.item)
          }));
        } else {
          this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
        }
        // Get current user from appUserService - chỉ set khi không phải chế độ edit
        if (!this.isEdit) {
          const currentEmployeeId = this.appUserService.employeeID;
          if (currentEmployeeId) {
            // Tìm employee trong danh sách đã load
            const currentEmployee = this.employees.find(emp => emp.ID === currentEmployeeId);
            if (currentEmployee) {
              this.employeeId = currentEmployee.ID || 0;
              this.fullName = currentEmployee.FullName || '';
              this.bookerVehicles = this.fullName;
              // Set first passenger to current user
              if (this.passengers.length > 0) {
                this.passengers[0].employeeId = this.employeeId;
                this.onPassengerEmployeeChange(1, this.employeeId);
              }
            } else {
              // Nếu không tìm thấy trong danh sách, dùng thông tin từ appUserService
              this.employeeId = currentEmployeeId;
              this.fullName = this.appUserService.fullName || '';
              this.bookerVehicles = this.fullName;
              // Set first passenger to current user
              if (this.passengers.length > 0) {
                this.passengers[0].employeeId = this.employeeId;
                this.onPassengerEmployeeChange(1, this.employeeId);
              }
            }
          }
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
      }
    });

    // Load provinces for departure (điểm xuất phát) - dùng cho cả arrival và departure
    this.vehicleBookingService.getProvinceDeparture(this.employeeId).subscribe({
      next: (data: any) => {
        // API trả về format: { status: 1, data: [...] } hoặc { Status: 1, Data: [...] }
        const responseData = data?.data || data?.Data || data;
        if (Array.isArray(responseData)) {
          this.provinces = responseData.map((item: any) => ({
            value: item.ID || item.Id || item.Value,
            label: item.ProvinceName || item.Name || item.Label || item.Text
          }));
        } else {
          this.provinces = [];
        }
        // Add "Khác" option if not exists
        if (!this.provinces.find((p: any) => p.value === 0)) {
          this.provinces.push({ value: 0, label: 'Khác' });
        }
      },
      error: (err) => {
        console.error('Error loading provinces:', err);
        this.provinces = [
          { value: 1, label: 'VP Hà Nội' },
          { value: 2, label: 'VP Bắc Ninh' },
          { value: 3, label: 'VP Hải Phòng' },
          { value: 4, label: 'VP Hồ Chí Minh' },
          { value: 0, label: 'Khác' },
        ];
      }
    });

    this.loadProvincesArrives();

    // Load projects
    this.vehicleBookingService.getProjects().subscribe({
      next: (data: any) => {
        // API trả về format: { status: 1, data: [...] } hoặc { Status: 1, Data: [...] }
        const responseData = data?.data || data?.Data || data;
        if (Array.isArray(responseData)) {
          this.projects = responseData.map((item: any) => ({
            value: item.ID || item.Id || item.ProjectID,
            label: item.ProjectCode + ' - ' + item.ProjectName
          }));
        } else {
          this.projects = [];
        }
        // Add default option
        if (!this.projects.find((p: any) => p.value === 0)) {
          this.projects.unshift({ value: 0, label: '--Chọn dự án--' });
        }
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.projects = [{ value: 0, label: '--Chọn dự án--' }];
      }
    });

    // Load approved list
    this.vehicleBookingService.getApprovedList().subscribe({
      next: (data: any) => {
        // API trả về format: { status: 1, data: [...] } hoặc { Status: 1, Data: [...] }
        const responseData = data?.data || data?.Data || data;
        if (Array.isArray(responseData)) {
          this.approvedList = responseData.map((item: any) => ({
            value: item.EmployeeID,
            label: item.FullName
          }));
        } else {
          this.approvedList = [];
        }
        // Add default option
        if (!this.approvedList.find((a: any) => a.value === 0)) {
          this.approvedList.unshift({ value: 0, label: '--Chọn người duyệt--' });
        }
      },
      error: (err) => {
        console.error('Error loading approved list:', err);
        this.approvedList = [{ value: 0, label: '--Chọn người duyệt--' }];
      }
    });

    this.passengers.push({
      index: 1,
      employeeId: 0,
      code: '',
      name: '',
      department: '',
      phoneNumber: '',
      note: ''
    });

    // Initialize first attached goods
    this.attachedGoods.push({
      index: 1,
      employeeId: 0,
      code: '',
      name: '',
      phoneNumber: '',
      packageName: '',
      packageSize: '',
      packageWeight: '',
      packageQuantity: 1,
      note: '[Hàng đang chuẩn bị]',
      files: []
    });
  }

  initializeNewForm(): void {
    this.category = 1;
    this.vehicleType = 1;
    this.departureAddressSelect = 1;
    this.departureAddress = 'VP Hà Nội';
    this.onCategoryChange();
  }

  loadEditData(): void {
    // Load data for editing
    const data = this.dataInput;
    this.id = data.ID || 0;
    this.employeeId = data.EmployeeID || 0;
    this.fullName = data.FullName || '';
    this.bookerVehicles = data.BookerVehicles || data.FullName || '';
    this.category = data.Category || 1;
    this.companyNameArrives = data.CompanyNameArrives || '';
    this.province = data.Province || 0;
    this.specificDestinationAddress = data.SpecificDestinationAddress || '';
    this.departureAddressSelect = data.DepartureAddressStatus || 0;
    this.departureAddress = data.DepartureAddress || '';
    this.projectId = data.ProjectID || 0;
    this.vehicleType = data.VehicleType || 1;
    this.approvedTbp = data.ApprovedTBP || 0;
    this.problemArises = data.ProblemArises || '';

    if (data.TimeNeedPresent) {
      this.timeNeedPresent = new Date(data.TimeNeedPresent);
    }
    if (data.TimeReturn) {
      this.timeReturn = new Date(data.TimeReturn);
    }
    if (data.DepartureDate) {
      this.departureDate = new Date(data.DepartureDate);
    }

    // Load passenger data
    if (data.PassengerEmployeeID) {
      this.passengers[0].employeeId = data.PassengerEmployeeID;
    }
    this.passengers[0].code = data.PassengerCode || '';
    this.passengers[0].name = data.PassengerName || '';
    this.passengers[0].department = data.PassengerDepartment || '';
    this.passengers[0].phoneNumber = data.PassengerPhoneNumber || '';
    this.passengers[0].note = data.Note || '';

    // Load attached goods data
    this.attachedGoods[0].employeeId = data.ReceiverEmployeeID || 0;
    this.attachedGoods[0].code = data.ReceiverCode || '';
    this.attachedGoods[0].name = data.ReceiverName || '';
    this.attachedGoods[0].phoneNumber = data.ReceiverPhoneNumber || '';
    this.attachedGoods[0].packageName = data.PackageName || '';
    this.attachedGoods[0].packageSize = data.PackageSize || '';
    this.attachedGoods[0].packageWeight = data.PackageWeight || '';
    this.attachedGoods[0].packageQuantity = data.PackageQuantity || 1;
    this.attachedGoods[0].note = data.Note || '[Hàng đang chuẩn bị]';

    this.onCategoryChange();
    this.checkIsProblem();

    this.reinitializeFlatpickr();

    // Load images if category is 2, 6, 7, or 8 (giao hàng/lấy hàng)
    if ((this.category == 2 || this.category == 6 || this.category == 7 || this.category == 8) && this.id > 0) {
      this.vehicleBookingService.getImages(this.id).subscribe({
        next: (images: any) => {
          // API trả về format: { status: 1, data: [...] } hoặc { Status: 1, Data: [...] }
          const imageList = images?.data || images?.Data || images || [];
          if (Array.isArray(imageList) && imageList.length > 0 && this.attachedGoods.length > 0) {
            this.attachedGoods[0].files = imageList.map((img: any) => ({
              uid: String(img.ID || img.Id || Date.now()),
              name: img.FileName || img.Name,
              status: 'done',
              url: img.Url || img.FilePath || img.urlImage,
              id: img.ID || img.Id
            }));
          }
        },
        error: (err) => {
          console.error('Error loading images:', err);
        }
      });
    }
  }

  onCategoryChange(): void {
    const selectedValue = this.category;

    // Handle problem arises visibility
    if (selectedValue == 5) {
      this.showApprovedTbp = false;
      this.showProblemArises = false;
    } else {
      this.showApprovedTbp = this.isProblem;
      this.showProblemArises = this.isProblem;
    }

    // Handle time return visibility
    if (selectedValue == 1) {
      this.showTimeReturn = true;
      this.showDepartureReturn = true;
    } else {
      this.showTimeReturn = false;
      this.showDepartureReturn = false;
    }

    // Handle passenger/attached goods visibility
    if (selectedValue == 1 || selectedValue == 4 || selectedValue == 5) {
      this.showPassenger = true;
      this.showAttachedGoods = false;
    } else {
      this.showPassenger = false;
      this.showAttachedGoods = true;
    }

  }

  onDepartureAddressSelectChange(value: number): void {
    const selectedOption = this.provinces.find(p => p.value == value);
    const text = selectedOption ? selectedOption.label : '';

    if (!this.provinceDepartureIDs.includes(value)) {
      this.departureAddress = '';
    } else {
      this.departureAddress = text;
      // Auto set return address if not set
      if (!this.departureReturnAddressSelect) {
        this.departureReturnAddressSelect = value;
        this.departureReturnAddress = text;
      }
    }
  }

  onDepartureReturnAddressSelectChange(value: number): void {
    const selectedOption = this.provinces.find(p => p.value == value);
    const text = selectedOption ? selectedOption.label : '';

    if (!this.provinceDepartureIDs.includes(value)) {
      this.departureReturnAddress = '';
    } else {
      this.departureReturnAddress = text;
    }
  }

  onPassengerEmployeeChange(index: number, employeeId: number): void {
    if (employeeId && employeeId > 0) {
      this.vehicleBookingService.getEmployeeById(employeeId).subscribe({
        next: (result: any) => {
          const data = result?.data || result;
          if (data) {
            const passenger = this.passengers.find(p => p.index === index);
            if (passenger) {
              passenger.code = data.Code || '';
              passenger.name = data.FullName || data.Name || '';
              passenger.department = data.DepartmentName || '';
              passenger.phoneNumber = data.SDTCaNhan || '';
            }
          }
        },
        error: (err) => {
          console.error('Error loading employee:', err);
        }
      });
    } else {
      const passenger = this.passengers.find(p => p.index === index);
      if (passenger) {
        passenger.code = '';
        passenger.name = '';
        passenger.department = '';
        passenger.phoneNumber = '';
      }
    }
  }

  clearPassengerError(index: number, field: string): void {
    if (this.errors.passengers[index]) {
      this.errors.passengers[index][field] = '';
    }
  }

  onAttachedGoodsEmployeeChange(index: number, employeeId: number): void {
    if (employeeId && employeeId > 0) {
      this.vehicleBookingService.getEmployeeById(employeeId).subscribe({
        next: (result: any) => {
          const data = result?.data || result;
          if (data) {
            const goods = this.attachedGoods.find(g => g.index === index);
            if (goods) {
              goods.code = data.Code || '';
              goods.name = data.FullName || data.Name || '';
              goods.phoneNumber = data.SDTCaNhan || data.SdtcaNhan || data.PhoneNumber || '';
            }
          }
        },
        error: (err) => {
          console.error('Error loading employee:', err);
        }
      });
    } else {
      const goods = this.attachedGoods.find(g => g.index === index);
      if (goods) {
        goods.code = '';
        goods.name = '';
        goods.phoneNumber = '';
      }
    }
  }

  addPassenger(): void {
    const newPassenger: Passenger = {
      index: this.passengerIndex,
      employeeId: 0,
      code: '',
      name: '',
      department: '',
      phoneNumber: '',
      note: ''
    };
    this.passengers.push(newPassenger);
    this.activePassengerTab = this.passengerIndex;
    this.passengerIndex++;
  }

  removePassenger(index: number): void {
    this.passengers = this.passengers.filter(p => p.index !== index);
    if (this.passengers.length > 0) {
      this.activePassengerTab = this.passengers[this.passengers.length - 1].index;
    }
  }

  addAttachedGoods(): void {
    const newGoods: AttachedGoods = {
      index: this.attachedGoodsIndex,
      employeeId: 0,
      code: '',
      name: '',
      phoneNumber: '',
      packageName: '',
      packageSize: '',
      packageWeight: '',
      packageQuantity: 1,
      note: '[Hàng đang chuẩn bị]',
      files: []
    };
    this.attachedGoods.push(newGoods);
    this.activeAttachedGoodsTab = this.attachedGoodsIndex;
    this.attachedGoodsIndex++;
  }

  removeAttachedGoods(index: number): void {
    this.attachedGoods = this.attachedGoods.filter(g => g.index !== index);
    if (this.attachedGoods.length > 0) {
      this.activeAttachedGoodsTab = this.attachedGoods[this.attachedGoods.length - 1].index;
    }
  }

  onTimeNeedPresentChange(date: Date | null): void {
    if (date) {
      this.checkIsProblem();
    }
  }

  checkIsProblem(): void {
    if (!this.timeNeedPresent) {
      this.isProblem = false;
      return;
    }

    const now = new Date();
    const selectedDate = new Date(this.timeNeedPresent);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    // Check if booking after 20:00
    if (now.getHours() >= 20) {
      this.isProblem = true;
    } else if (today.getTime() === selectedDay.getTime()) {
      // Same day booking
      const minTime = new Date(today);
      minTime.setHours(16, 30, 0, 0);
      const maxTime = new Date(today);
      maxTime.setHours(20, 0, 0, 0);
      this.isProblem = !(now >= minTime && now <= maxTime);
    } else {
      this.isProblem = false;
    }

    if (this.isProblem && this.category != 5) {
      this.showApprovedTbp = true;
      this.showProblemArises = true;
    } else {
      this.showApprovedTbp = false;
      this.showProblemArises = false;
    }
  }

  validate(): boolean {
    // Reset errors
    this.errors = {
      timeNeedPresent: '',
      companyNameArrives: '',
      province: '',
      specificDestinationAddress: '',
      departureDate: '',
      departureAddress: '',
      departureReturnAddressSelect: '',
      departureReturnAddress: '',
      projectId: '',
      vehicleType: '',
      problemArises: '',
      approvedTbp: '',
      passengers: {} as { [key: number]: { name?: string, phoneNumber?: string } },
    };

    let isValid = true;

    if (!this.timeNeedPresent) {
      this.errors.timeNeedPresent = 'Vui lòng chọn thời gian cần đến';
      isValid = false;
    }

    if (!this.companyNameArrives || this.companyNameArrives.trim() === '') {
      this.errors.companyNameArrives = 'Vui lòng nhập công ty';
      isValid = false;
    }

    if (!this.province || this.province === '') {
      this.errors.province = 'Vui lòng chọn tỉnh';
      isValid = false;
    }

    if (!this.specificDestinationAddress || this.specificDestinationAddress.trim() === '') {
      this.errors.specificDestinationAddress = 'Vui lòng nhập địa chỉ cụ thể';
      isValid = false;
    }

    if (this.showPassenger || this.category == 2 || this.category == 6 || this.category == 7 || this.category == 8) {
      if (!this.departureDate) {
        this.errors.departureDate = 'Vui lòng chọn thời gian xuất phát';
        isValid = false;
      }
    }

    if (this.category != 6 && this.category != 7 && (this.showPassenger || this.category == 2 || this.category == 8)) {
      if (!this.departureAddress || this.departureAddress.trim() === '') {
        this.errors.departureAddress = 'Vui lòng nhập địa chỉ xuất phát';
        isValid = false;
      }
    }

    if (this.showDepartureReturn && this.category == 1) {
      if (this.departureReturnAddressSelect === null || this.departureReturnAddressSelect === undefined) {
        this.errors.departureReturnAddressSelect = 'Vui lòng chọn điểm về';
        isValid = false;
      }
      if (!this.departureReturnAddress || this.departureReturnAddress.trim() === '') {
        this.errors.departureReturnAddress = 'Vui lòng nhập địa chỉ quay về cụ thể';
        isValid = false;
      }
    }

    if (!this.projectId || this.projectId === 0) {
      this.errors.projectId = 'Vui lòng chọn dự án';
      isValid = false;
    }

    if (!this.vehicleType || this.vehicleType === 0) {
      this.errors.vehicleType = 'Vui lòng chọn loại phương tiện';
      isValid = false;
    }

    // Validate problem arises
    if (this.isProblem && this.category != 5) {
      if (!this.problemArises || this.problemArises.trim() === '') {
        this.errors.problemArises = 'Vui lòng nhập vấn đề phát sinh';
        isValid = false;
      }
      if (!this.approvedTbp || this.approvedTbp === 0) {
        this.errors.approvedTbp = 'Vui lòng chọn người duyệt';
        isValid = false;
      }
    }

    // Validate passengers or attached goods
    if (this.category == 1 || this.category == 4 || this.category == 5) {
      for (let i = 0; i < this.passengers.length; i++) {
        const passenger = this.passengers[i];
        if (!this.errors.passengers[passenger.index]) {
          this.errors.passengers[passenger.index] = {};
        }
        if (!passenger.name || passenger.name.trim() === '') {
          this.errors.passengers[passenger.index].name = 'Vui lòng nhập tên người đi';
          isValid = false;
        }
        if (!passenger.phoneNumber || passenger.phoneNumber.trim() === '') {
          this.errors.passengers[passenger.index].phoneNumber = 'Vui lòng nhập số điện thoại người đi';
          isValid = false;
        }
      }
    } else {
      for (const goods of this.attachedGoods) {
        if (!goods.name || goods.name.trim() === '') {
          this.notification.warning('Cảnh báo', 'Vui lòng nhập tên người nhận');
          isValid = false;
          break;
        }
        if (!goods.phoneNumber || goods.phoneNumber.trim() === '') {
          this.notification.warning('Cảnh báo', 'Vui lòng nhập số điện thoại người nhận');
          isValid = false;
          break;
        }
        if (!goods.packageName || goods.packageName.trim() === '') {
          this.notification.warning('Cảnh báo', 'Vui lòng nhập tên kiện hàng');
          isValid = false;
          break;
        }
        if (!goods.packageSize || goods.packageSize.trim() === '') {
          this.notification.warning('Cảnh báo', 'Vui lòng nhập kích thước kiện hàng');
          isValid = false;
          break;
        }
        if (!goods.packageWeight || goods.packageWeight.trim() === '') {
          this.notification.warning('Cảnh báo', 'Vui lòng nhập cân nặng kiện hàng');
          isValid = false;
          break;
        }
        if (!goods.packageQuantity || goods.packageQuantity <= 0) {
          this.notification.warning('Cảnh báo', 'Số lượng kiện hàng phải lớn hơn 0');
          isValid = false;
          break;
        }
      }
    }

    if (!isValid) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    return isValid;
  }

  save(): void {
    if (this.isSaving) {
      return; // Prevent multiple clicks
    }

    this.isSaving = true;

    if (!this.validate()) {
      this.isSaving = false;
      return;
    }

    // Build payload
    const payloads: any[] = [];

    // Khi lưu mới, lấy EmployeeID từ AppUserService
    const employeeIdToSave = this.isEdit ? this.employeeId : (this.appUserService.employeeID || 0);

    if (this.category == 1 || this.category == 4 || this.category == 5) {
      // Create payload for each passenger
      for (let i = 0; i < this.passengers.length; i++) {
        const passenger = this.passengers[i];
        const payload: any = {
          ID: i === 0 ? this.id : 0,
          EmployeeID: employeeIdToSave,
          BookerVehicles: this.bookerVehicles,
          PhoneNumber: '',
          CompanyNameArrives: this.companyNameArrives,
          Province: this.province,
          SpecificDestinationAddress: this.specificDestinationAddress,
          TimeNeedPresent: this.formatDateTime(this.timeNeedPresent),
          TimeReturn: this.formatDateTime(this.timeReturn),
          Category: this.category,
          Note: passenger.note,
          PassengerEmployeeID: passenger.employeeId,
          PassengerCode: passenger.code,
          PassengerName: passenger.name,
          PassengerDepartment: passenger.department,
          PassengerPhoneNumber: passenger.phoneNumber,
          ReceiverEmployeeID: 0,
          ReceiverCode: '',
          ReceiverName: '',
          PackageName: '',
          DeliverName: '',
          DeliverPhoneNumber: '',
          ReceiverPhoneNumber: '',
          ProblemArises: this.isProblem ? this.problemArises : '',
          ApprovedTBP: this.isProblem ? this.approvedTbp : 0,
          IsProblemArises: this.isProblem,
          IsApprovedTBP: false,
          DepartureDate: this.formatDateTime(this.departureDate),
          DepartureAddress: this.departureAddress,
          DepartureAddressStatus: this.departureAddressSelect,
          ProjectID: this.projectId,
          PackageSize: '',
          PackageWeight: '',
          PackageQuantity: 0,
          VehicleType: this.vehicleType,
        };

        payloads.push(payload);
      }
    } else {
      // Create payload for each attached goods
      for (let i = 0; i < this.attachedGoods.length; i++) {
        const goods = this.attachedGoods[i];
        const payload: any = {
          ID: i === 0 ? this.id : 0,
          EmployeeID: employeeIdToSave,
          BookerVehicles: this.bookerVehicles,
          PhoneNumber: '',
          CompanyNameArrives: this.companyNameArrives,
          Province: this.province,
          SpecificDestinationAddress: this.specificDestinationAddress,
          TimeNeedPresent: this.formatDateTime(this.timeNeedPresent),
          TimeReturn: this.formatDateTime(this.timeReturn),
          Category: this.category,
          Note: goods.note,
          PassengerEmployeeID: 0,
          PassengerCode: '',
          PassengerName: '',
          PassengerDepartment: '',
          PassengerPhoneNumber: '',
          ReceiverEmployeeID: goods.employeeId,
          ReceiverCode: goods.code,
          ReceiverName: goods.name,
          PackageName: goods.packageName,
          DeliverName: this.bookerVehicles,
          DeliverPhoneNumber: '',
          ReceiverPhoneNumber: goods.phoneNumber,
          ProblemArises: this.isProblem ? this.problemArises : '',
          ApprovedTBP: this.isProblem ? this.approvedTbp : 0,
          IsProblemArises: this.isProblem,
          IsApprovedTBP: false,
          DepartureDate: this.formatDateTime(this.departureDate),
          DepartureAddress: this.departureAddress,
          DepartureAddressStatus: this.departureAddressSelect,
          ProjectID: this.projectId,
          PackageSize: goods.packageSize,
          PackageWeight: goods.packageWeight,
          PackageQuantity: goods.packageQuantity,
          VehicleType: this.vehicleType,
        };

        if (this.category == 6 || this.category == 7) {
          payload.DepartureAddress = '';
          payload.DepartureAddressStatus = this.category;
        }

        payloads.push(payload);
      }
    }

    let currentIndex = 0;
    const saveNext = () => {
      if (currentIndex >= payloads.length) {
        // Tất cả booking đã được tạo, gửi email
        this.sendEmailNotification();
        this.notification.success('Thành công', 'Đặt xe thành công');
        this.isSaving = false;
        this.activeModal.close(true);
        return;
      }

      const payload = payloads[currentIndex];
      const goodsIndex = (this.category == 2 || this.category == 6 || this.category == 7 || this.category == 8) ? currentIndex : -1;
      const goods = goodsIndex >= 0 ? this.attachedGoods[goodsIndex] : null;

      this.vehicleBookingService.createVehicleBooking(payload).subscribe({
        next: (result: any) => {
          if (result && (result.status == 1 || result.Status == 1)) {
            // Lấy vehicleBookingId từ result - API create trả về vehicleBooking object
            const vehicleBookingId = result.data?.ID || result.data?.Id ||
              result.data?.vehicleBooking?.ID || result.data?.vehicleBooking?.Id ||
              result.vehicleBooking?.ID || result.vehicleBooking?.Id ||
              result.id || result.Id ||
              (payload.Id > 0 ? payload.Id : null);

            // Upload files if category is 2, 6, 7, or 8 and has files
            // Chỉ upload nếu có vehicleBookingId (đã có ID từ trước hoặc vừa tạo)
            if (goods && goods.files && goods.files.length > 0 && vehicleBookingId && vehicleBookingId > 0) {
              this.uploadFilesForGoods(vehicleBookingId, goods.files, goodsIndex);
            }

            currentIndex++;
            saveNext();
          } else {
            this.isSaving = false;
            this.notification.error('Lỗi', result?.message || result?.Message || 'Có lỗi xảy ra khi lưu');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error('Lỗi', err?.error?.message || err?.error?.Message || 'Có lỗi xảy ra khi lưu dữ liệu');
        }
      });
    };

    saveNext();
  }

  uploadFilesForGoods(vehicleBookingId: number, files: NzUploadFile[], goodsIndex: number): void {
    const formData = new FormData();
    let hasFiles = false;

    files.forEach((file: any) => {
      // Only upload new files (not already uploaded ones with id)
      if (file.originFileObj) {
        formData.append('files', file.originFileObj);
        hasFiles = true;
      }
    });

    if (hasFiles) {
      // key: để backend nhận biết loại tài liệu
      formData.append('key', 'VehicleBookingFile');

      // subPath: Năm/Category/BookingID (lọc ký tự không hợp lệ trong đường dẫn)
      const year = new Date().getFullYear().toString();
      const categoryText = this.categories.find(c => c.value === this.category)?.label || 'Unknown';
      const bookingId = vehicleBookingId.toString();
      const sanitize = (s: string) =>
        s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim();
      const subPath = [sanitize(year), sanitize(categoryText), sanitize(bookingId)]
        .filter((x) => x)
        .join('/');

      formData.append('subPath', subPath);

      this.vehicleBookingService.uploadFiles(vehicleBookingId, formData).subscribe({
        next: (result: any) => {
          // API trả về format: { status: 1, message: "..." } hoặc { Status: 1, Message: "..." }
          if (result && (result.status == 1 || result.Status == 1)) {
            console.log('Files uploaded successfully');
          } else {
            console.warn('File upload warning:', result?.message || result?.Message);
          }
        },
        error: (err) => {
          console.error('Error uploading files:', err);
          this.notification.error('Thông báo', 'Lỗi upload files: ' + (err?.error?.message || err?.message || 'Có lỗi xảy ra'));
        }
      });
    }
  }

  formatDateTime(date: Date | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  onFileChange(event: any, goodsIndex: number): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const goods = this.attachedGoods.find(g => g.index === goodsIndex);
      if (goods) {
        Array.from(files).forEach((file: any) => {
          goods.files.push({
            uid: String(Date.now() + Math.random()),
            name: file.name,
            status: 'done',
            originFileObj: file
          });
        });
      }
    }
  }

  removeFile(goodsIndex: number, fileUid: string): void {
    const goods = this.attachedGoods.find(g => g.index === goodsIndex);
    if (goods) {
      goods.files = goods.files.filter(f => f.uid !== fileUid);
    }
  }

  private sendEmailNotification(): void {
    const categories = [1, 4, 5];
    const employeeAttaches: any[] = [];

    // Build employee attaches array
    if (categories.includes(this.category)) {
      // For passenger categories (1, 4, 5)
      this.passengers.forEach(passenger => {
        if (passenger.employeeId && passenger.employeeId > 0) {
          employeeAttaches.push({
            PassengerEmployeeId: passenger.employeeId,
            ReceiverEmployeeId: 0
          });
        }
      });
    } else {
      // For attached goods categories (2, 6, 7, 8) - use ReceiverEmployeeID
      this.attachedGoods.forEach(goods => {
        if (goods.employeeId && goods.employeeId > 0) {
          employeeAttaches.push({
            PassengerEmployeeId: 0,
            ReceiverEmployeeId: goods.employeeId
          });
        }
      });
    }

    // Get category text - updated with all categories
    const categoryTextMap: { [key: number]: string } = {
      1: 'Đăng ký đi',
      2: 'Đăng ký giao hàng thương mại',
      3: 'Xếp xe về',
      4: 'Chủ động phương tiện',
      5: 'Đăng ký về',
      6: 'Đăng ký lấy hàng thương mại',
      7: 'Đăng ký lấy hàng Demo/triển Lãm',
      8: 'Đăng ký giao hàng Demo/triển lãm'
    };
    const categoryText = categoryTextMap[this.category] || '';

    // Build email payload
    const emailPayload = {
      Category: this.category,
      CategoryText: categoryText,
      ApprovedTBP: this.isProblem ? this.approvedTbp : 0,
      DepartureDate: this.formatDateTime(this.departureDate),
      DepartureAddress: this.departureAddress,
      TimeNeedPresent: this.formatDateTime(this.timeNeedPresent),
      SpecificDestinationAddress: this.specificDestinationAddress,
      EmployeeAttaches: employeeAttaches
    };

    // Send email
    this.vehicleBookingService.sendEmail(emailPayload).subscribe({
      next: (result: any) => {
        if (result && (result.status == 1 || result.Status == 1)) {
          console.log('Email sent successfully');
        } else {
          console.warn('Email sending warning:', result?.message || result?.Message);
        }
      },
      error: (err) => {
        console.error('Error sending email:', err);
        // Không hiển thị lỗi cho user vì booking đã thành công
      }
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

