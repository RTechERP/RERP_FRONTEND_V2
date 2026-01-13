import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ChangeDetectorRef
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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  styleUrl: './course-catalog-detail.component.css'
})
export class CourseCatalogDetailComponent implements OnInit, AfterViewInit {
  @Input() newCourseCatalog: CourseCatalog = {
    TypeID: 0,
    DepartmentID: 0,
    Code: '',
    STT: 0,
    Name: '',
    TeamIDs: [],
    IsActive: true
  };

  private _dataInput: any;
  @Input() set dataInput(value: any) {
    this._dataInput = value;
    this.initFormData();
  }
  get dataInput() { return this._dataInput; }

  private _dataDepartment: any[] = [];
  @Input() set dataDepartment(value: any[]) {
    this._dataDepartment = (value || []).map(item => ({
      ...item,
      standardizedID: this.ensureNumber(item.STT),
      standardizedLabel: item.Name
    }));
    this.initFormData();
  }
  get dataDepartment() { return this._dataDepartment; }

  private _dataTeam: any[] = [];
  @Input() set dataTeam(value: any[]) {
    this._dataTeam = (value || []).map(item => ({
      ...item,
      standardizedID: this.ensureNumber(item.ID ),
      standardizedLabel: item.ProjectTypeName
    }));
    this.initFormData();
  }
  get dataTeam() { return this._dataTeam; }

  @Input() catalogID: number = 0;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() maxSTT: number = 0; 

  formGroup: FormGroup;
  saving: boolean = false;
  private patchTimeout: any;

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
      STT: [0],
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
      });
    }
    if (!this.dataTeam || this.dataTeam.length === 0) {
      this.courseService.getDataTeams().subscribe((response: any) => {
        this.dataTeam = response.data || response || [];
      });
    }
  }

  private initFormData() {
    if (!this.formGroup) return;

    const data = this.dataInput;
    if (data && (this.mode === 'edit' || (this.ensureNumber(data?.ID ?? data?.Id ?? data?.id) ?? 0) > 0)) {
      
      const typeID = this.ensureNumber(data.CatalogType ?? data.catalogType ?? data.TypeID ?? data.typeID ?? data.ID_CatalogType ?? data.IdCatalogType ?? data.idCatalogType ?? data.LoaiID ?? data.ID_Loai);
      const deptID = this.ensureNumber(data.DepartmentSTT);
      const teamIDs = this.ensureNumberArray(data.ProjectTypeID);

      if (this.patchTimeout) clearTimeout(this.patchTimeout);
      this.patchTimeout = setTimeout(() => {
        if (!this.formGroup) return;
        this.formGroup.patchValue({
          TypeID: typeID,
          DepartmentID: deptID,
          Code: data.Code ?? data.code ?? data.MaDanhMuoc ?? '',
          STT: data.STT ?? data.stt ?? 0,
          IsActive: data.Status,
          Name: data.Name ?? data.name ?? data.TenDanhMuc ?? '',
          TeamIDs: teamIDs,
        }, { emitEvent: false });
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 200);
    } else if (this.mode === 'add') {
      this.formGroup.patchValue({
        STT: (this.maxSTT || 0) + 1,
      }, { emitEvent: false });
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {

  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  loadTypeData() {
    this.typeData = [
      { standardizedID: 1, standardizedLabel: 'Cơ bản' },
      { standardizedID: 2, standardizedLabel: 'Nâng cao' }
    ];
  }


  loadTeamData() {
    this.teamData = this.dataTeam || [];
    // Force change detection or redraw if necessary, but usually @Input is enough
  }

  private ensureNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'object') return this.ensureNumber(value.ID ?? value.Id ?? value.id);
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private ensureNumberArray(value: any): number[] {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v));
    }
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return Number(item.ID ?? item.Id ?? item.id ?? item.ProjectTypeID ?? item.projectTypeID ?? item.ProjectTypeId ?? item.ID_ProjectType ?? item.id_project_type ?? 0);
        }
        return Number(item);
      }).filter(v => !isNaN(v) && v !== 0);
    }
    return [];
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
      DepartmentSTT: formValue.DepartmentID,
      DeleteFlag: formValue.IsActive,
      STT: formValue.STT,
      CatalogType: formValue.TypeID,
      ProjectTypeIDs: formValue.TeamIDs || [],
      IsDeleted: false
    };

    this.courseService.saveCourseCatalog(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.status === 1) {
          const message = this.mode === 'edit' ? 'Cập nhật danh mục thành công!' : 'Thê mới danh mục thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể lưu danh mục!');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error('Thông báo', err?.message || 'Không thể lưu danh mục!');
        console.error('Error saving course catalog:', err);
      }
    });
  }

  close() {
    this.activeModal.close(true);
  }
}
