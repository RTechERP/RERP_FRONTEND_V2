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
import {
  CopyCourseCatalogCounts,
  CopyCourseCatalogRequest,
} from '../../course-management/course-management.types';

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
  @Input() mode: 'add' | 'edit' | 'copy' | 'move' = 'add';
  @Input() maxSTT: number = 1;

  formGroup: FormGroup;
  saving: boolean = false;
  loadingPreview: boolean = false;
  copyCounts: CopyCourseCatalogCounts | null = null;
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
      Code: ['', [Validators.required, Validators.maxLength(50)]],
      STT: [1],
      IsActive: [true],
      Name: ['', [Validators.required, Validators.maxLength(100)]],
      TeamIDs: [[], []], // Multi-select, không required
    });
  }

  ngOnInit(): void {
    // Load dữ liệu dropdown cố định
    this.loadTypeData();
    this.initFormData();
    if (this.mode === 'copy' || this.mode === 'move') {
      this.loadCopyPreview();
    }

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
  }

  private initFormData() {
    if (!this.formGroup) return;

    const data = this.dataInput;
    if (
      data &&
      (this.mode === 'edit' ||
        this.mode === 'copy' ||
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

      if (this.patchTimeout) clearTimeout(this.patchTimeout);
      this.patchTimeout = setTimeout(() => {
        if (!this.formGroup) return;
        this.formGroup.patchValue(
          {
            TypeID: typeID,
            DepartmentID: deptID,
            Code: this.mode === 'copy'
              ? `${data.Code ?? data.code ?? data.MaDanhMuoc ?? ''}-COPY`
              : (this.mode === 'move' 
                  ? data.Code ?? data.code ?? data.MaDanhMuoc ?? ''
                  : data.Code ?? data.code ?? data.MaDanhMuoc ?? ''),
            STT: (this.mode === 'copy' || this.mode === 'move') ? 0 : data.STT ?? data.stt ?? 1,
            IsActive: data.Status ?? true,
            Name: this.mode === 'copy'
              ? `${data.Name ?? data.name ?? data.TenDanhMuc ?? ''} - Bản sao`
              : (this.mode === 'move'
                  ? data.Name ?? data.name ?? data.TenDanhMuc ?? ''
                  : data.Name ?? data.name ?? data.TenDanhMuc ?? ''),
            TeamIDs: teamIDs,
          },
          { emitEvent: false },
        );
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 200);
    } else if (this.mode === 'add') {
      this.formGroup.patchValue(
        {
          STT: 0,
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

  private loadCopyPreview(): void {
    const sourceCatalogId = this.ensureNumber(this.dataInput?.ID) ?? 0;
    if (sourceCatalogId <= 0) return;

    this.loadingPreview = true;
    
    const previewMethod = this.mode === 'move' 
      ? this.courseService.getMoveCourseCatalogPreview(sourceCatalogId)
      : this.courseService.getCopyCourseCatalogPreview(sourceCatalogId);
    
    previewMethod.subscribe({
      next: (res: any) => {
        this.loadingPreview = false;
        if (res?.status === 1) {
          this.copyCounts = res.data?.Counts ?? null;
          const source = res.data?.SourceCatalog;
          if (source) {
            this.formGroup.patchValue({
              TypeID: source.CatalogType,
              DepartmentID: source.DepartmentID,
              TeamIDs: source.ProjectTypeIDs || [],
            });
          }
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể tải thông tin!',
          );
        }
      },
      error: (err) => {
        this.loadingPreview = false;
        this.notification.error(
          'Thông báo',
          err?.error?.message || 'Không thể tải thông tin!',
        );
      },
    });
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
    if (
      this.mode === 'copy' &&
      formValue.Code.toLowerCase() === (this.dataInput?.Code || '').trim().toLowerCase()
    ) {
      this.saving = false;
      this.formGroup.get('Code')?.setErrors({ duplicateSource: true });
      return;
    }

    let request$: any;
    if (this.mode === 'move') {
      request$ = this.courseService.moveCourseCatalog({
        SourceCatalogId: this.dataInput?.ID || 0,
        TargetDepartmentId: formValue.DepartmentID,
        TargetCatalogType: formValue.TypeID,
        ProjectTypeIds: formValue.TeamIDs || [],
      });
    } else if (this.mode === 'copy') {
      request$ = this.courseService.copyCourseCatalogFull({
        SourceCatalogId: this.dataInput?.ID || 0,
        NewCode: formValue.Code,
        NewName: formValue.Name,
        DepartmentId: formValue.DepartmentID,
        CatalogType: formValue.TypeID,
        ProjectTypeIds: formValue.TeamIDs || [],
      } as CopyCourseCatalogRequest);
    } else {
      request$ = this.courseService.saveCourseCatalog({
        ID: this.dataInput?.ID || 0,
        Code: formValue.Code,
        Name: formValue.Name,
        DepartmentID: formValue.DepartmentID,
        DeleteFlag: formValue.IsActive,
        STT: formValue.STT,
        CatalogType: formValue.TypeID,
        ProjectTypeIDs: formValue.TeamIDs || [],
        IsDeleted: false,
      });
    }

    request$.subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res && res.status === 1) {
          const message = this.mode === 'copy'
            ? 'Sao chép toàn bộ danh mục thành công!'
            : this.mode === 'move'
              ? 'Di chuyển danh mục thành công!'
              : this.mode === 'edit'
                ? 'Cập nhật danh mục thành công!'
                : 'Thêm mới danh mục thành công!';
          this.notification.success('Thông báo', message);
          if (this.mode === 'move') {
            this.activeModal.close({ success: true, movedCatalogId: res.data?.MovedCatalogId });
          } else if (this.mode === 'copy') {
            this.activeModal.close({ success: true, newCatalogId: res.data?.NewCatalogId });
          } else {
            this.activeModal.close(true);
          }
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể lưu danh mục!',
          );
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error(
          'Thông báo',
          err?.error?.message || err?.message || 'Không thể lưu danh mục!',
        );
        console.error('Error saving course catalog:', err);
      },
    });
  }

  close() {
    this.activeModal.close(true);
  }
}
