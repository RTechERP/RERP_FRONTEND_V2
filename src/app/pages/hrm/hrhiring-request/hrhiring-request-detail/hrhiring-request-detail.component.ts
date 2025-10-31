import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSliderModule } from 'ng-zorro-antd/slider';

// NgBootstrap Modal
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// Services
import { HrhiringRequestService } from '../hrhiring-request-service/hrhiring-request.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-hrhiring-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzCheckboxModule,
    NzRadioModule,
    NzInputNumberModule,
    NzSpinModule,
    NzSliderModule,
  ],
  templateUrl: './hrhiring-request-detail.component.html',
  styleUrls: ['./hrhiring-request-detail.component.css'],
})
export class HrhiringRequestDetailComponent implements OnInit {
  @Input() data: any = null; // passed from parent when editing
  @Input() mode: 'add' | 'edit' = 'add';

  form!: FormGroup;
  isSaving: boolean = false;

  // Master data
  departmentList: any[] = [];
  positionList: any[] = [];
  educationList: any[] = [];

  // Education options - giữ nguyên value số
  educationOptions = [
    { value: 1, label: 'Trung học cơ sở' },
    { value: 2, label: 'Trung học phổ thông' },
    { value: 3, label: 'Trung cấp' },
    { value: 4, label: 'Cao đẳng' },
    { value: 5, label: 'Đại học' },
    { value: 6, label: 'Trên đại học' },
  ];

  // Experience options - chuyển thành value số
  expOptions = [
    { value: 1, label: 'Không yêu cầu' },
    { value: 2, label: 'Dưới 1 năm' },
    { value: 3, label: '1-2 năm' },
    { value: 4, label: '2-3 năm' },
    { value: 5, label: '3-5 năm' },
    { value: 6, label: 'Trên 5 năm' },
  ];

  private readonly LANGUAGE_LEVELS: any = {
    'Level A': 1,
    'Level B': 2,
    'Level C': 3,
    'Không cần': 4,
  };

  private readonly LANGUAGE_TYPES = {
    ENGLISH: 1,
    OTHER: 2,
  } as const;

  constructor(
    private fb: FormBuilder,
    private service: HrhiringRequestService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMasterData();
    this.loadData();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Basic info - TẤT CẢ REQUIRED
      DepartmentID: [null, Validators.required],
      PositionID: [null, Validators.required], // THÊM required
      QuantityHiring: [
        1,
        [Validators.required, Validators.min(1), Validators.max(50)],
      ],
      SalaryMin: [5000000, Validators.required],
      SalaryMax: [15000000, Validators.required],
      AgeMin: [
        22,
        [Validators.required, Validators.min(18), Validators.max(65)],
      ],
      AgeMax: [
        45,
        [Validators.required, Validators.min(18), Validators.max(65)],
      ],
      WorkAddress: ['', Validators.required],
      ProfessionalRequirement: ['', Validators.required],
      JobDescription: ['', Validators.required],
      Note: [''], // CHỈ GHI CHÚ KHÔNG REQUIRED

      // Selections - TẤT CẢ REQUIRED
      EducationSelections: [
        [],
        [Validators.required, this.arrayNotEmptyValidator],
      ],
      ExperienceSelections: [
        [],
        [Validators.required, this.arrayNotEmptyValidator],
      ],
      AppearanceSelections: [
        [],
        [Validators.required, this.arrayNotEmptyValidator],
      ],
      GenderSelections: [
        [],
        [Validators.required, this.arrayNotEmptyValidator],
      ],

      // Computer skills - ÍT NHẤT 1 SKILL HOẶC CÓ SKILL KHÁC
      SkillWord: [false],
      SkillExcel: [false],
      SkillPowerpoint: [false],
      SkillOutlook: [false],
      SkillInternet: [false],
      SkillOther: [''],

      // Languages - TIẾNG ANH REQUIRED
      EnglishLevel: ['', Validators.required],
      OtherLanguage: [''],
      OtherLanguageLevel: [''],

      // Health requirements - ÍT NHẤT 1 YÊU CẦU
      NeedPhysical: [false],
      PhysicalNote: [''],
      NeedSpecialStrength: [false],
      StrengthNote: [''],
      EnsureHealth: [false],
      HealthNote: [''],

      // Communication requirements - ÍT NHẤT 1 YÊU CẦU
      CommNoneExternal: [false],
      CommInternal: [false],
      CommDomesticCustomer: [false],
      CommForeignCustomer: [false],
      CommForeignCountry: [''],
      CommMedia: [false],
      CommAuthorities: [false],
    });

    // THÊM CUSTOM VALIDATORS
    this.setupCustomValidators();
  }

  private loadMasterData(): void {
    // Load departments
    this.service.getDepartments().subscribe({
      next: (response: any) => {
        if (response?.status === 1 && Array.isArray(response.data)) {
          this.departmentList = response.data;
        } else if (Array.isArray(response)) {
          this.departmentList = response;
        } else {
          this.departmentList = [];
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách phòng ban');
      },
    });

    // Load positions
    this.service.getChucVuHD().subscribe({
      next: (response: any) => {
        if (response?.status === 1 && Array.isArray(response.data)) {
          this.positionList = response.data;
        } else if (Array.isArray(response)) {
          this.positionList = response;
        } else {
          this.positionList = [];
        }
      },
      error: (error) => {
        console.error('Error loading positions:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách vị trí');
      },
    });
  }

  private loadData(): void {
    if (this.mode === 'edit' && this.data) {
      console.log('Loading edit data:', this.data);

      // Load basic fields
      this.form.patchValue({
        DepartmentID: this.data.DepartmentID,
        PositionID: this.data.EmployeeChucVuHDID,
        QuantityHiring: this.data.QuantityHiring || 1,
        SalaryMin: this.data.SalaryMin || 0,
        SalaryMax: this.data.SalaryMax || 0,
        AgeMin: this.data.AgeMin || 18,
        AgeMax: this.data.AgeMax || 65,
        WorkAddress: this.data.WorkAddress || '',
        ProfessionalRequirement: this.data.ProfessionalRequirement || '',
        JobDescription: this.data.JobDescription || '',
        Note: this.data.Note || '',

        // Selections - SỬA: Load đầy đủ các selection
        EducationSelections: this.data.EducationSelections || [],
        ExperienceSelections: this.data.ExperienceSelections || [],
        GenderSelections: this.data.GenderSelections || [],
        AppearanceSelections: this.data.AppearanceSelections || [], // SỬA: Thêm dòng này

        // Languages
        EnglishLevel: this.data.EnglishLevel || '',
        OtherLanguage: this.data.OtherLanguage || '',
        OtherLanguageLevel: this.data.OtherLanguageLevel || '',

        // Computer skills - SỬA: Load đúng data
        SkillWord: Boolean(this.data.SkillWord),
        SkillExcel: Boolean(this.data.SkillExcel),
        SkillPowerpoint: Boolean(this.data.SkillPowerpoint),
        SkillOutlook: Boolean(this.data.SkillOutlook),
        SkillInternet: Boolean(this.data.SkillInternet),
        SkillOther: this.data.SkillOther || '',

        // Health requirements - SỬA: Load đúng data
        NeedPhysical: Boolean(this.data.NeedPhysical),
        PhysicalNote: this.data.PhysicalNote || '',
        NeedSpecialStrength: Boolean(this.data.NeedSpecialStrength),
        StrengthNote: this.data.StrengthNote || '',
        EnsureHealth: Boolean(this.data.EnsureHealth),
        HealthNote: this.data.HealthNote || '',

        // Communication requirements - SỬA: Load đúng data
        CommNoneExternal: Boolean(this.data.CommNoneExternal),
        CommInternal: Boolean(this.data.CommInternal),
        CommDomesticCustomer: Boolean(this.data.CommDomesticCustomer),
        CommForeignCustomer: Boolean(this.data.CommForeignCustomer),
        CommForeignCountry: this.data.CommForeignCountry || '',
        CommMedia: Boolean(this.data.CommMedia),
        CommAuthorities: Boolean(this.data.CommAuthorities),
      });

      console.log('Form after patch:', this.form.value);

      // SỬA: Log các giá trị để debug
      console.log('AppearanceSelections:', this.data.AppearanceSelections);
      console.log('Health values:', {
        NeedPhysical: this.data.NeedPhysical,
        PhysicalNote: this.data.PhysicalNote,
        NeedSpecialStrength: this.data.NeedSpecialStrength,
        StrengthNote: this.data.StrengthNote,
        EnsureHealth: this.data.EnsureHealth,
        HealthNote: this.data.HealthNote,
      });

      console.log('Communication values:', {
        CommNoneExternal: this.data.CommNoneExternal,
        CommInternal: this.data.CommInternal,
        CommDomesticCustomer: this.data.CommDomesticCustomer,
        CommForeignCustomer: this.data.CommForeignCustomer,
        CommForeignCountry: this.data.CommForeignCountry,
        CommMedia: this.data.CommMedia,
        CommAuthorities: this.data.CommAuthorities,
      });
    }
  }

  // Event handlers
  onSalaryChange(field: string, value: number): void {
    // Có thể thêm logic validation ở đây
    if (field === 'SalaryMin' && value > this.form.value.SalaryMax) {
      this.form.patchValue({ SalaryMax: value });
    } else if (field === 'SalaryMax' && value < this.form.value.SalaryMin) {
      this.form.patchValue({ SalaryMin: value });
    }
  }

  onAgeChange(field: string, value: number): void {
    // Handle age changes if needed
  }

  onEducationChange(value: number | string, checked: boolean) {
    if (checked) {
      if (!this.educationList.includes(value)) {
        this.educationList = [...this.educationList, value];
      }
    } else {
      this.educationList = this.educationList.filter((v) => v !== value);
    }
  }

  salaryFormatter = (value: number): string => {
    return `${value.toLocaleString('vi-VN')} VNĐ`;
  };

  ageFormatter = (value: number): string => {
    return `${value} tuổi`;
  };

  formatSalaryDisplay(value: number): string {
    if (!value) return '0 VNĐ';
    const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formatted} VNĐ`;
  }

  formatSalaryInput(value: number): string {
    if (!value || value === 0) return '';
    // Sử dụng format tùy chỉnh với dấu phẩy
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  parseSalaryInput(value: string): number {
    if (!value || value.trim() === '') return 0;
    
    // Loại bỏ tất cả ký tự không phải số
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    if (cleanValue === '') return 0;
    
    const parsed = parseInt(cleanValue) || 0;
    return Math.max(0, parsed); // Đảm bảo không âm
  }

  validateNumberInput(event: KeyboardEvent): void {
    const char = event.key;
    const currentValue = (event.target as HTMLInputElement).value;
    
    // Cho phép: số (0-9), dấu phẩy (,), Backspace, Delete, Tab, Enter, Arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (allowedKeys.includes(char)) {
      return; // Cho phép các phím điều khiển
    }
    
    // Chỉ cho phép số và dấu phẩy
    if (!/[0-9,]/.test(char)) {
      event.preventDefault();
      return;
    }
    
    // Không cho phép nhiều dấu phẩy liên tiếp
    if (char === ',' && currentValue.slice(-1) === ',') {
      event.preventDefault();
      return;
    }
  }

  // formatSalaryRange(min: number, max: number): string {
  //   const minDisplay = min ? min.toLocaleString('vi-VN') : '0';
  //   const maxDisplay = max ? max.toLocaleString('vi-VN') : '0';
  //   return `${minDisplay} - ${maxDisplay} VNĐ`;
  // }

  toggleEducation(value: number, $event: Event): void {
    const currentSelections = this.form.value.EducationSelections || [];
    const isChecked = ($event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!currentSelections.includes(value)) {
        currentSelections.push(value);
      }
    } else {
      const index = currentSelections.indexOf(value);
      if (index > -1) {
        currentSelections.splice(index, 1);
      }
    }
    this.form.patchValue({ EducationSelections: currentSelections });
  }

  // Sửa lại toggleExperience để giống với toggleEducation
  toggleExperience(value: number, $event: Event): void {
    const currentSelections = this.form.value.ExperienceSelections || [];
    const isChecked = ($event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!currentSelections.includes(value)) {
        currentSelections.push(value);
      }
    } else {
      const index = currentSelections.indexOf(value);
      if (index > -1) {
        currentSelections.splice(index, 1);
      }
    }
    this.form.patchValue({ ExperienceSelections: currentSelections });
  }

  toggleGender(value: number, $event: Event): void {
    const currentSelections = this.form.value.GenderSelections || [];
    const isChecked = ($event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!currentSelections.includes(value)) {
        currentSelections.push(value);
      }
    } else {
      const index = currentSelections.indexOf(value);
      if (index > -1) {
        currentSelections.splice(index, 1);
      }
    }
    this.form.patchValue({ GenderSelections: currentSelections });
  }

  toggleAppearance(value: number, $event: Event): void {
    const currentSelections = this.form.value.AppearanceSelections || [];
    const isChecked = ($event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!currentSelections.includes(value)) {
        currentSelections.push(value);
      }
    } else {
      const index = currentSelections.indexOf(value);
      if (index > -1) {
        currentSelections.splice(index, 1);
      }
    }
    this.form.patchValue({ AppearanceSelections: currentSelections });
  }

  onHealthCheckChange(fieldName: string, event: any): void {
    const isChecked = event.target.checked;
    if (!isChecked) {
      switch (fieldName) {
        case 'NeedPhysical':
          this.form.patchValue({ PhysicalNote: '' });
          break;
        case 'NeedSpecialStrength':
          this.form.patchValue({ StrengthNote: '' });
          break;
        case 'EnsureHealth':
          this.form.patchValue({ HealthNote: '' });
          break;
      }
    }
  }

  onCommunicationCheckChange(fieldName: string, event: any): void {
    const isChecked = event.target.checked;
    if (fieldName === 'CommForeignCustomer' && !isChecked) {
      this.form.patchValue({ CommForeignCountry: '' });
    }
  }

  // Salary range handlers - CẢI THIỆN ĐỂ TRÁNH TRÙNG NHAU
  onMinSalaryChange(event: any): void {
    const value = parseInt(event.target.value);
    const currentMax = this.form.value.SalaryMax;

    // Đảm bảo min không vượt quá max 
    if (value <= currentMax) {
      this.form.patchValue({ SalaryMin: value });
    } else {
      // Tự động điều chỉnh min xuống để có khoảng cách tối thiểu
      const newMin = Math.max(100000, currentMax);
      this.form.patchValue({ SalaryMin: newMin });
      event.target.value = newMin;
    }
  }

  onMaxSalaryChange(event: any): void {
    const value = parseInt(event.target.value);
    const currentMin = this.form.value.SalaryMin;

    // Đảm bảo max không nhỏ hơn min
    if (value >= currentMin ) {
      this.form.patchValue({ SalaryMax: value });
    } else {
      // Tự động điều chỉnh max lên để có khoảng cách tối thiểu
      const newMax = Math.min(100000000, currentMin);
      this.form.patchValue({ SalaryMax: newMax });
      event.target.value = newMax;
    }
  }

  // Age range handlers - CẢI THIỆN ĐỂ TRÁNH TRÙNG NHAU
  onMinAgeChange(event: any): void {
    const value = parseInt(event.target.value);
    const currentMax = this.form.value.AgeMax;
    const step = 1; // Khoảng cách tối thiểu

    // Đảm bảo min không vượt quá max
    if (value <= currentMax ) {
      this.form.patchValue({ AgeMin: value });
    } else {
      // Tự động điều chỉnh min xuống để có khoảng cách tối thiểu
      const newMin = Math.max(18, currentMax);
      this.form.patchValue({ AgeMin: newMin });
      event.target.value = newMin;
    }
  }

  onMaxAgeChange(event: any): void {
    const value = parseInt(event.target.value);
    const currentMin = this.form.value.AgeMin;
    const step = 1; // Khoảng cách tối thiểu

    // Đảm bảo max không nhỏ hơn min
    if (value >= currentMin) {
      this.form.patchValue({ AgeMax: value });
    } else {
      // Tự động điều chỉnh max lên để có khoảng cách tối thiểu
      const newMax = Math.min(65, currentMin);
      this.form.patchValue({ AgeMax: newMax });
      event.target.value = newMax;
    }
  }

  // Input handlers for direct number input
  onMinSalaryInputChange(event: any): void {
    const inputValue = event.target.value;
    const value = this.parseSalaryInput(inputValue);
    const currentMax = this.form.value.SalaryMax;
    
    // Không cho phép min >= max
    if (value > currentMax) {
      // Giữ nguyên giá trị cũ nếu min >= max
      const currentMin = this.form.value.SalaryMin;
      event.target.value = this.formatSalaryInput(currentMin);
      
      // Hiển thị thông báo
      this.notification.warning('Thông báo', `Lương tối thiểu không thể lớn hơn hoặc bằng lương tối đa (${this.formatSalaryInput(currentMax)})`);
      return;
    }
    
    this.form.patchValue({ SalaryMin: value });
    this.validateRange('SalaryMin');
  }

  onMaxSalaryInputChange(event: any): void {
    const value = parseInt(event.target.value) || 0;
    const currentMin = this.form.value.SalaryMin;

    // Validate range
    const clampedValue = Math.max(0, Math.min(100000000, value));
    
    // Không cho phép max <= min
    if (clampedValue < currentMin) {
      // Giữ nguyên giá trị cũ nếu max <= min
      const currentMax = this.form.value.SalaryMax;
      event.target.value = currentMax;
      
      // Hiển thị thông báo
      this.notification.warning('Thông báo', `Lương tối đa không thể nhỏ hơn hoặc bằng lương tối thiểu (${this.formatSalaryInput(currentMin)})`);
      return;
    }
    
    this.form.patchValue({ SalaryMax: clampedValue });
    this.validateRange('SalaryMax');
  }

  onMinSalaryBlur(event: any): void {
    const value = this.form.value.SalaryMin;
    event.target.value = this.formatSalaryInput(value);
  }

  onMaxSalaryBlur(event: any): void {
    const value = this.form.value.SalaryMax;
    event.target.value = this.formatSalaryInput(value);
  }

  onMinAgeInputChange(event: any): void {
    const value = parseInt(event.target.value) || 18;
    const currentMax = this.form.value.AgeMax;
    const step = 1;

    // Validate range
    const clampedValue = Math.max(18, Math.min(65, value));
    
    if (clampedValue <= currentMax) {
      this.form.patchValue({ AgeMin: clampedValue });
    } else {
      // Auto adjust to maintain minimum gap
      const newMin = Math.max(18, currentMax);
      this.form.patchValue({ AgeMin: newMin });
      event.target.value = newMin;
    }
    this.validateRange('AgeMin');
  }

  onMaxAgeInputChange(event: any): void {
    const value = parseInt(event.target.value) || 65;
    const currentMin = this.form.value.AgeMin;
    const step = 1;

    // Validate range
    const clampedValue = Math.max(18, Math.min(65, value));
    
    if (clampedValue >= currentMin + step) {
      this.form.patchValue({ AgeMax: clampedValue });
    } else {
      // Auto adjust to maintain minimum gap
      const newMax = Math.min(65, currentMin + step);
      this.form.patchValue({ AgeMax: newMax });
      event.target.value = newMax;
    }
    this.validateRange('AgeMax');
  }

  // Click handlers for salary slider
  onSalarySliderClick(event: any, type: 'min' | 'max'): void {
    const slider = event.target;
    const rect = slider.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;
    const percentage = clickX / sliderWidth;

    const maxValue = 100000000;
    const minValue = 0;
    const value = Math.round(minValue + (maxValue - minValue) * percentage);

    if (type === 'min') {
      const currentMax = this.form.value.SalaryMax;
      if (value <= currentMax) {
        this.form.patchValue({ SalaryMin: value });
      }
    } else {
      const currentMin = this.form.value.SalaryMin;
      if (value >= currentMin) {
        this.form.patchValue({ SalaryMax: value });
      }
    }
  }

  // Click handlers for age slider
  onAgeSliderClick(event: any, type: 'min' | 'max'): void {
    const slider = event.target;
    const rect = slider.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;
    const percentage = clickX / sliderWidth;

    const maxValue = 65;
    const minValue = 18;
    const value = Math.round(minValue + (maxValue - minValue) * percentage);

    if (type === 'min') {
      const currentMax = this.form.value.AgeMax;
      if (value <= currentMax) {
        this.form.patchValue({ AgeMin: value });
      }
    } else {
      const currentMin = this.form.value.AgeMin;
      if (value >= currentMin) {
        this.form.patchValue({ AgeMax: value });
      }
    }
  }

  formatSalaryShort(value: number): string {
    if (!value) return '0';
    if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
    return value.toString();
  }

  formatSalaryRange(min: number, max: number): string {
    const minDisplay = min ? min.toLocaleString('vi-VN') : '0';
    const maxDisplay = max ? max.toLocaleString('vi-VN') : '0';
    return `${minDisplay} - ${maxDisplay} VNĐ`;
  }

  // Salary range track methods
  getSalaryRangeTrackLeft(): number {
    const min = this.form.value.SalaryMin || 0;
    const total = 100000000;
    return (min / total) * 100;
  }

  getSalaryRangeTrackWidth(): number {
    const min = this.form.value.SalaryMin || 0;
    const max = this.form.value.SalaryMax || 0;
    const total = 100000000;
    return ((max - min) / total) * 100;
  }

  getSalaryMinThumbPosition(): number {
    const min = this.form.value.SalaryMin || 0;
    const total = 100000000;
    return (min / total) * 100;
  }

  getSalaryMaxThumbPosition(): number {
    const max = this.form.value.SalaryMax || 0;
    const total = 100000000;
    return (max / total) * 100;
  }

  // Age range track methods
  getAgeRangeTrackLeft(): number {
    const min = this.form.value.AgeMin || 18;
    const total = 65 - 18;
    return ((min - 18) / total) * 100;
  }

  getAgeRangeTrackWidth(): number {
    const min = this.form.value.AgeMin || 18;
    const max = this.form.value.AgeMax || 65;
    const total = 65 - 18;
    return ((max - min) / total) * 100;
  }

  getAgeMinThumbPosition(): number {
    const min = this.form.value.AgeMin || 18;
    const total = 65 - 18;
    return ((min - 18) / total) * 100;
  }

  getAgeMaxThumbPosition(): number {
    const max = this.form.value.AgeMax || 65;
    const total = 65 - 18;
    return ((max - 18) / total) * 100;
  }

  // Thêm method validation để kiểm tra khoảng cách
  validateRange(field: string): void {
    if (field === 'SalaryMin' || field === 'SalaryMax') {
      const min = this.form.value.SalaryMin;
      const max = this.form.value.SalaryMax;
      const step = 100000;

      if (max - min < step) {
        if (field === 'SalaryMin') {
          this.form.patchValue({ SalaryMax: min + step });
        } else {
          this.form.patchValue({ SalaryMin: max - step });
        }
      }
    } else if (field === 'AgeMin' || field === 'AgeMax') {
      const min = this.form.value.AgeMin;
      const max = this.form.value.AgeMax;
      const step = 1;

      if (max - min < step) {
        if (field === 'AgeMin') {
          this.form.patchValue({ AgeMax: min + step });
        } else {
          this.form.patchValue({ AgeMin: max - step });
        }
      }
    }
  }

  // Cập nhật save method trong component
  save(): void {
    // VALIDATE FORM TRƯỚC KHI SAVE
    if (!this.validateForm()) {
      return;
    }

    const formData = this.form.getRawValue();

    // Prepare languages - sửa lại theo cấu trúc mới
    const languages = [];

    // Mapping level từ string sang số
    const levelMapping = {
      'Level A': 1,
      'Level B': 2,
      'Level C': 3,
      'Không cần': 4,
    };

    // Tiếng Anh
    if (formData.EnglishLevel) {
      languages.push({
        LanguageType: this.LANGUAGE_TYPES.ENGLISH,
        LanguageTypeName: 'Tiếng Anh',
        LanguageLevel: this.LANGUAGE_LEVELS[formData.EnglishLevel] || 4,
      });
    }

    // Ngôn ngữ khác
    if (formData.OtherLanguage && formData.OtherLanguageLevel) {
      languages.push({
        LanguageType: this.LANGUAGE_TYPES.OTHER,
        LanguageTypeName: formData.OtherLanguage,
        LanguageLevel: this.LANGUAGE_LEVELS[formData.OtherLanguageLevel] || 4,
      });
    }

    // Prepare computer skills - SỬA LẠI
    const computerSkills = [];
    const skillMapping: any = {
      SkillWord: { type: 1, name: 'Word' },
      SkillExcel: { type: 4, name: 'Excel' }, // Sửa type cho Excel
      SkillPowerpoint: { type: 2, name: 'PowerPoint' },
      SkillOutlook: { type: 3, name: 'OutLook' },
      SkillInternet: { type: 5, name: 'Internet' },
    };

    // Thêm các skill được chọn
    Object.keys(skillMapping).forEach((skillKey) => {
      if (formData[skillKey]) {
        computerSkills.push({
          ComputerType: skillMapping[skillKey].type,
          ComputerName: skillMapping[skillKey].name,
          // BỎ Note - không cần nữa
        });
      }
    });

    // Kỹ năng khác - ComputerType = 6, ComputerName = textarea content
    if (formData.SkillOther && formData.SkillOther.trim()) {
      computerSkills.push({
        ComputerType: 6, // Khác = 6
        ComputerName: formData.SkillOther.trim(), // Lấy text từ textarea
        // BỎ Note - không cần nữa
      });
    }

    // Prepare health requirements - SỬA LẠI với Type và Description
    const healthRequirements = [];

    if (formData.NeedPhysical) {
      healthRequirements.push({
        HealthType: 1,
        HealthDescription: formData.PhysicalNote || 'Cần thể hình đặc biệt',
      });
    }

    if (formData.NeedSpecialStrength) {
      healthRequirements.push({
        HealthType: 2,
        HealthDescription: formData.StrengthNote || 'Cần sức lực đặc biệt',
      });
    }

    if (formData.EnsureHealth) {
      healthRequirements.push({
        HealthType: 3,
        HealthDescription: formData.HealthNote || 'Sức khỏe đủ đảm bảo',
      });
    }

    // Prepare communications - SỬA LẠI theo database schema
    const communications = [];

    // Không cần giao tiếp bên ngoài
    if (formData.CommNoneExternal) {
      communications.push({
        CommunicationType: 1,
        CommunicationDecription: 'Không cần giao tiếp với bên ngoài',
      });
    }

    // Cần giao tiếp với nhiều người trong công ty
    if (formData.CommInternal) {
      communications.push({
        CommunicationType: 2,
        CommunicationDecription: 'Cần giao tiếp với nhiều người trong Công ty',
      });
    }

    // Cần giao tiếp với khách hàng trong nước
    if (formData.CommDomesticCustomer) {
      communications.push({
        CommunicationType: 3,
        CommunicationDecription: 'Cần giao tiếp với khách hàng trong nước',
      });
    }

    // Cần giao tiếp với khách hàng nước ngoài - có input tên nước
    if (formData.CommForeignCustomer) {
      const countryNote = formData.CommForeignCountry
        ? `. Đặc biệt là nước: ${formData.CommForeignCountry.trim()}`
        : '';
      communications.push({
        CommunicationType: 4,
        CommunicationDecription: `Cần giao tiếp với khách hàng nước ngoài${countryNote}`,
      });
    }

    // Cần tiếp xúc với các cơ quan báo đài, truyền thông
    if (formData.CommMedia) {
      communications.push({
        CommunicationType: 5,
        CommunicationDecription:
          'Cần tiếp xúc với các cơ quan báo đài, truyền thông',
      });
    }

    // Cần tiếp xúc với các cấp chính quyền địa phương, trung ương
    if (formData.CommAuthorities) {
      communications.push({
        CommunicationType: 6,
        CommunicationDecription:
          'Cần tiếp xúc với các cấp chính quyền địa phương, trung ương',
      });
    }

    // Prepare appearances - dùng số
    const appearances = [];
    const appearanceMapping: any = {
      'Không yêu cầu': 1,
      'Tương đối': 2,
      'Quan trọng': 3,
    };
    if (formData.Appearance && appearanceMapping[formData.Appearance]) {
      appearances.push(appearanceMapping[formData.Appearance]);
    }

    const hiringRequestData = {
      ID: this.data?.ID || 0,
      DepartmentID: formData.DepartmentID || 0,
      EmployeeChucVuHDID: formData.PositionID || 0,
      QuantityHiring: formData.QuantityHiring || 1,
      SalaryMin: formData.SalaryMin || null,
      SalaryMax: formData.SalaryMax || null,
      AgeMin: formData.AgeMin || null,
      AgeMax: formData.AgeMax || null,
      WorkAddress: formData.WorkAddress || '',
      ProfessionalRequirement: formData.ProfessionalRequirement || '',
      JobDescription: formData.JobDescription || '',
      Note: formData.Note || '',
      DateRequest: new Date().toISOString(),
    };

    const payload = {
      HiringRequests: hiringRequestData,
      EducationLevels: formData.EducationSelections || [],
      Experiences: formData.ExperienceSelections || [],
      Appearances: formData.AppearanceSelections || [],
      Genders: formData.GenderSelections || [],
      HealthRequirements: healthRequirements,
      Languages: languages,
      ComputerSkills: computerSkills,
      Communications: communications,
      Approvals: [],
    };

    console.log('Payload being sent:', JSON.stringify(payload, null, 2));
    console.log('ExperienceSelections value:', formData.ExperienceSelections);

    this.isSaving = true;
    this.service.saveData(payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response?.status === 1) {
          this.notification.success(
            'Thành công',
            this.mode === 'edit'
              ? 'Cập nhật yêu cầu tuyển dụng thành công!'
              : 'Thêm mới yêu cầu tuyển dụng thành công!'
          );
          this.activeModal.close({ action: 'save', data: response.data });
        } else {
          this.notification.error(
            'Lỗi',
            response?.message || 'Lưu dữ liệu thất bại!'
          );
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Save error details:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lưu dữ liệu!');
      },
    });
  }

  private validateForm(): boolean {
    // Mark all fields as touched để hiển thị lỗi
    this.form.markAllAsTouched();

    let isValid = true;
    const errors: string[] = [];

    // 1. Check basic required fields
    if (!this.form.get('DepartmentID')?.value) {
      errors.push('• Vui lòng chọn phòng ban/bộ phận');
      isValid = false;
    }

    if (!this.form.get('PositionID')?.value) {
      errors.push('• Vui lòng chọn vị trí tuyển dụng');
      isValid = false;
    }

    if (!this.form.get('WorkAddress')?.value?.trim()) {
      errors.push('• Vui lòng nhập địa chỉ làm việc');
      isValid = false;
    }

    if (!this.form.get('ProfessionalRequirement')?.value?.trim()) {
      errors.push('• Vui lòng nhập yêu cầu chuyên môn');
      isValid = false;
    }

    if (!this.form.get('JobDescription')?.value?.trim()) {
      errors.push('• Vui lòng nhập mô tả công việc');
      isValid = false;
    }

    // 2. Check selections
    if (!this.form.get('EducationSelections')?.value?.length) {
      errors.push('• Vui lòng chọn ít nhất 1 trình độ học vấn');
      isValid = false;
    }

    if (!this.form.get('ExperienceSelections')?.value?.length) {
      errors.push('• Vui lòng chọn ít nhất 1 mức kinh nghiệm');
      isValid = false;
    }

    if (!this.form.get('AppearanceSelections')?.value?.length) {
      errors.push('• Vui lòng chọn ít nhất 1 yêu cầu ngoại hình');
      isValid = false;
    }

    if (!this.form.get('GenderSelections')?.value?.length) {
      errors.push('• Vui lòng chọn ít nhất 1 yêu cầu giới tính');
      isValid = false;
    }

    // 3. Check language requirement
    if (!this.form.get('EnglishLevel')?.value) {
      errors.push('• Vui lòng chọn trình độ Tiếng Anh');
      isValid = false;
    }

    // 4. Check computer skills
    const formValue = this.form.value;
    const hasBasicSkills =
      formValue.SkillWord ||
      formValue.SkillExcel ||
      formValue.SkillPowerpoint ||
      formValue.SkillOutlook ||
      formValue.SkillInternet;
    const hasOtherSkills = formValue.SkillOther && formValue.SkillOther.trim();

    if (!hasBasicSkills && !hasOtherSkills) {
      errors.push(
        '• Vui lòng chọn ít nhất 1 kỹ năng máy tính hoặc nhập kỹ năng khác'
      );
      isValid = false;
    }

    // 5. Check health requirements
    const hasHealthRequirement =
      formValue.NeedPhysical ||
      formValue.NeedSpecialStrength ||
      formValue.EnsureHealth;

    if (!hasHealthRequirement) {
      errors.push('• Vui lòng chọn ít nhất 1 yêu cầu về sức khỏe');
      isValid = false;
    }

    // 6. Check communication requirements
    const hasCommunicationRequirement =
      formValue.CommNoneExternal ||
      formValue.CommInternal ||
      formValue.CommDomesticCustomer ||
      formValue.CommForeignCustomer ||
      formValue.CommMedia ||
      formValue.CommAuthorities;

    if (!hasCommunicationRequirement) {
      errors.push('• Vui lòng chọn ít nhất 1 yêu cầu về giao tiếp');
      isValid = false;
    }

    // 7. Check conditional fields
    if (
      formValue.CommForeignCustomer &&
      !formValue.CommForeignCountry?.trim()
    ) {
      errors.push('• Vui lòng nhập tên nước khi chọn "Khách hàng nước ngoài"');
      isValid = false;
    }

    // 8. Check salary and age ranges
    if (
      this.form.get('SalaryMin')?.value >= this.form.get('SalaryMax')?.value
    ) {
      errors.push('• Lương tối đa phải lớn hơn lương tối thiểu');
      isValid = false;
    }

    if (this.form.get('AgeMin')?.value >= this.form.get('AgeMax')?.value) {
      errors.push('• Tuổi tối đa phải lớn hơn tuổi tối thiểu');
      isValid = false;
    }

    // Show errors if any
    if (!isValid) {
      const errorMessage =
        'Vui lòng kiểm tra và điền đầy đủ thông tin:\n\n' + errors.join('\n');
      this.notification.error('Thông tin chưa đầy đủ', errorMessage);
    }

    return isValid;
  }

  // THÊM CÁC CUSTOM VALIDATOR METHODS
  private arrayNotEmptyValidator(control: any) {
    const value = control.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { arrayEmpty: true };
    }
    return null;
  }

  private setupCustomValidators(): void {
    // Computer Skills Validator - ít nhất 1 skill
    this.form.setValidators([
      this.computerSkillsValidator,
      this.healthRequirementsValidator,
      this.communicationRequirementsValidator,
    ]);

    // Salary range validator
    this.form
      .get('SalaryMin')
      ?.valueChanges.subscribe(() => this.validateSalaryRange());
    this.form
      .get('SalaryMax')
      ?.valueChanges.subscribe(() => this.validateSalaryRange());

    // Age range validator
    this.form
      .get('AgeMin')
      ?.valueChanges.subscribe(() => this.validateAgeRange());
    this.form
      .get('AgeMax')
      ?.valueChanges.subscribe(() => this.validateAgeRange());
  }

  private computerSkillsValidator = (control: any) => {
    const formValue = control.value;
    const hasBasicSkills =
      formValue.SkillWord ||
      formValue.SkillExcel ||
      formValue.SkillPowerpoint ||
      formValue.SkillOutlook ||
      formValue.SkillInternet;
    const hasOtherSkills = formValue.SkillOther && formValue.SkillOther.trim();

    if (!hasBasicSkills && !hasOtherSkills) {
      return { computerSkillsRequired: true };
    }
    return null;
  };

  private healthRequirementsValidator = (control: any) => {
    const formValue = control.value;
    const hasHealthRequirement =
      formValue.NeedPhysical ||
      formValue.NeedSpecialStrength ||
      formValue.EnsureHealth;

    if (!hasHealthRequirement) {
      return { healthRequirementsRequired: true };
    }
    return null;
  };

  private communicationRequirementsValidator = (control: any) => {
    const formValue = control.value;
    const hasCommunicationRequirement =
      formValue.CommNoneExternal ||
      formValue.CommInternal ||
      formValue.CommDomesticCustomer ||
      formValue.CommForeignCustomer ||
      formValue.CommMedia ||
      formValue.CommAuthorities;

    if (!hasCommunicationRequirement) {
      return { communicationRequirementsRequired: true };
    }
    return null;
  };

  private validateSalaryRange(): void {
    const min = this.form.get('SalaryMin')?.value || 0;
    const max = this.form.get('SalaryMax')?.value || 0;

    if (min >= max) {
      this.form.get('SalaryMax')?.setErrors({ salaryRangeInvalid: true });
    } else {
      // Clear error if range is valid
      const maxControl = this.form.get('SalaryMax');
      if (maxControl?.errors?.['salaryRangeInvalid']) {
        delete maxControl.errors['salaryRangeInvalid'];
        if (Object.keys(maxControl.errors).length === 0) {
          maxControl.setErrors(null);
        }
      }
    }
  }

  private validateAgeRange(): void {
    const min = this.form.get('AgeMin')?.value || 18;
    const max = this.form.get('AgeMax')?.value || 65;

    if (min >= max) {
      this.form.get('AgeMax')?.setErrors({ ageRangeInvalid: true });
    } else {
      // Clear error if range is valid
      const maxControl = this.form.get('AgeMax');
      if (maxControl?.errors?.['ageRangeInvalid']) {
        delete maxControl.errors['ageRangeInvalid'];
        if (Object.keys(maxControl.errors).length === 0) {
          maxControl.setErrors(null);
        }
      }
    }
  }
}
