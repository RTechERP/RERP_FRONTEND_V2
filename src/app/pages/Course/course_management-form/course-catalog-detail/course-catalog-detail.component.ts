import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { CourseManagementService } from '../../course-management/course-management-service/course-management.service';

interface CourseCatalog {
  ID?: number;
  TypeID: number;
  DepartmentID: number;
  Code: string;
  STT: number;
  Name: string;
  TeamIDs: number[];
  IsActive?: boolean;
}

@Component({
  selector: 'app-course-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    ReactiveFormsModule,
    NzInputNumberModule,
    NzCheckboxModule,
  ],
  templateUrl: './course-catalog-detail.component.html',
  styleUrl: './course-catalog-detail.component.css',
})
export class CourseCatalogDetailComponent implements OnInit, AfterViewInit {
  @Input() newCourseCatalog: CourseCatalog = {
    TypeID: 0,
    DepartmentID: 0,
    Code: '',
    STT: 1,
    Name: '',
    TeamIDs: [],
    IsActive: true,
  };

  private _dataInput: any;
  @Input() set dataInput(value: any) {
    this._dataInput = value;
    this.initFormData();
  }
  get dataInput() {
    return this._dataInput;
  }

  private _dataDepartment: any[] = [];
  @Input() set dataDepartment(value: any[]) {
    this._dataDepartment = (value || []).map((item) => ({
      ...item,
      standardizedID: this.ensureNumber(
        item.ID ?? item.Id ?? item.id ?? item.STT,
      ),
      standardizedLabel: item.Name,
    }));
    this.initFormData();
  }
  get dataDepartment() {
    return this._dataDepartment;
  }

  private _dataTeam: any[] = [];
  @Input() set dataTeam(value: any[]) {
    this._dataTeam = (value || []).map((item) => ({
      ...item,
      standardizedID: this.ensureNumber(item.ID),
      standardizedLabel: item.ProjectTypeName,
    }));
    this.initFormData();
  }
  get dataTeam() {
    return this._dataTeam;
  }

  @Input() catalogID: number = 0;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() maxSTT: number = 1;

  formGroup: FormGroup;
  saving: boolean = false;
  private patchTimeout: any;

  // Track original values for edit mode
  private originalTypeID: number | null = null;
  private originalDepartmentID: number | null = null;

  // Data for dropdowns
  typeData: any[] = [];
  teamData: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
  ) {
    this.formGroup = this.fb.group({
      TypeID: [null, [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      STT: [1],
      IsActive: [true],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      TeamIDs: [[], []], // Multi-select, không required
    });
  }

  ngOnInit(): void {
    // Load dữ liệu dropdown cố định
    this.loadTypeData();
    this.initFormData();

    // Backup fetch if data is not provided by parent
    if (!this.dataDepartment || this.dataDepartment.length === 0) {
      this.courseService.getDataDepartment().subscribe((response: any) => {
        this.dataDepartment = response.data || response || [];
        console.log('Fetched departments:', this.dataDepartment);
      });
    }
    if (!this.dataTeam || this.dataTeam.length === 0) {
      this.courseService.getDataTeams().subscribe((response: any) => {
        this.dataTeam = response.data || response || [];
      });
    }

    // Listen to TypeID and DepartmentID changes to fetch max STT
    this.formGroup.get('TypeID')?.valueChanges.subscribe(() => {
      this.updateSTTFromAPI();
    });

    this.formGroup.get('DepartmentID')?.valueChanges.subscribe(() => {
      this.updateSTTFromAPI();
    });

    // Note: Không cần gọi updateSTTFromAPI ngay vì TypeID và DepartmentID
    // đều do user chọn, sẽ trigger qua valueChanges
  }

  private initFormData() {
    if (!this.formGroup) return;

    const data = this.dataInput;
    if (
      data &&
      (this.mode === 'edit' ||
        (this.ensureNumber(data?.ID ?? data?.Id ?? data?.id) ?? 0) > 0)
    ) {
      const typeID = this.ensureNumber(
        data.CatalogType ??
        data.catalogType ??
        data.TypeID ??
        data.typeID ??
        data.ID_CatalogType ??
        data.IdCatalogType ??
        data.idCatalogType ??
        data.LoaiID ??
        data.ID_Loai,
      );
      console.log('🔍 data object:', data);
      const deptID = this.ensureNumber(data.DepartmentID);
      console.log('🔍 deptID result:', deptID, 'from data.DepartmentID:', data.DepartmentID);
      const teamIDs = this.ensureNumberArray(data.ProjectTypeID);
      console.log('🔍 data.ProjectTypeID (raw):', data.ProjectTypeID);
      console.log('🔍 teamIDs (parsed):', teamIDs);
      console.log('🔍 dataTeam standardizedIDs:', this._dataTeam.map(t => t.standardizedID));

      // Track original values for edit mode
      this.originalTypeID = typeID;
      this.originalDepartmentID = deptID;

      if (this.patchTimeout) clearTimeout(this.patchTimeout);
      this.patchTimeout = setTimeout(() => {
        if (!this.formGroup) return;
        this.formGroup.patchValue(
          {
            TypeID: typeID,
            DepartmentID: deptID,
            Code: data.Code ?? data.code ?? data.MaDanhMuoc ?? '',
            STT: data.STT ?? data.stt ?? 1, // Nếu edit thì giữ nguyên STT từ data
            IsActive: data.Status,
            Name: data.Name ?? data.name ?? data.TenDanhMuc ?? '',
            TeamIDs: teamIDs,
          },
          { emitEvent: false },
        );
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 200);
    } else if (this.mode === 'add') {
      // Nếu thêm mới thì STT ban đầu = 0
      this.formGroup.patchValue(
        {
          STT: 1,
        },
        { emitEvent: false },
      );
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void { }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  loadTypeData() {
    this.typeData = [
      { standardizedID: 1, standardizedLabel: 'Cơ bản' },
      { standardizedID: 2, standardizedLabel: 'Nâng cao' },
    ];
  }

  loadTeamData() {
    this.teamData = this.dataTeam || [];
    // Force change detection or redraw if necessary, but usually @Input is enough
  }

  private ensureNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'object')
      return this.ensureNumber(value.ID ?? value.Id ?? value.id);
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private ensureNumberArray(value: any): number[] {
    if (!value) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => !isNaN(v));
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return Number(
              item.ID ??
              item.Id ??
              item.id ??
              item.ProjectTypeID ??
              item.projectTypeID ??
              item.ProjectTypeId ??
              item.ID_ProjectType ??
              item.id_project_type ??
              0,
            );
          }
          return Number(item);
        })
        .filter((v) => !isNaN(v) && v !== 0);
    }
    return [];
  }

  // Cập nhật STT từ API khi có đủ TypeID và DepartmentID
  private updateSTTFromAPI(): void {
    const typeID = this.formGroup.get('TypeID')?.value;
    const departmentID = this.formGroup.get('DepartmentID')?.value;
    console.log('TypeID or DepartmentID changed:', typeID, departmentID);

    // Nếu là mode add: luôn gọi API khi có đủ 2 giá trị
    // Nếu là mode edit: chỉ gọi API khi có sự thay đổi so với giá trị ban đầu
    const shouldFetchSTT =
      this.mode === 'add'
        ? typeID && departmentID // Add mode: có đủ 2 giá trị
        : typeID &&
        departmentID &&
        (typeID !== this.originalTypeID ||
          departmentID !== this.originalDepartmentID); // Edit mode: có thay đổi

    if (shouldFetchSTT) {
      console.log('Fetching new STT from API...');
      this.courseService.getSTTCourseCatalog(typeID, departmentID).subscribe({
        next: (response: any) => {
          const maxSTT = response?.data ?? response?.STT ?? response ?? 0;
          console.log('Received max STT from API:', maxSTT);
          this.formGroup.patchValue(
            {
              STT: maxSTT,
            },
            { emitEvent: false },
          );
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching max STT:', err);
        },
      });
    } else {
      console.log(
        'No need to fetch STT (no change detected or missing values)',
      );
    }
  }

  saveCourseCatalog() {
    if (this.saving) {
      return; // Ngăn không cho lưu nhiều lần
    }

    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.saving = true; // Bắt đầu lưu

    const formValue = this.formGroup.value;
    const payload = {
      ID: this.dataInput?.ID || 0,
      Code: formValue.Code,
      Name: formValue.Name,
      DepartmentID: formValue.DepartmentID,
      DeleteFlag: formValue.IsActive,
      STT: formValue.STT,
      CatalogType: formValue.TypeID,
      ProjectTypeIDs: formValue.TeamIDs || [],
      IsDeleted: false,
    };

    this.courseService.saveCourseCatalog(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.status === 1) {
          const message =
            this.mode === 'edit'
              ? 'Cập nhật danh mục thành công!'
              : 'Thêm mới danh mục thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể lưu danh mục!',
          );
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error(
          'Thông báo',
          err?.message || 'Không thể lưu danh mục!',
        );
        console.error('Error saving course catalog:', err);
      },
    });
  }

  close() {
    this.activeModal.close(true);
  }
}
