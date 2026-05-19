import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule, } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';
import { ProjectPartListService } from '../project-part-list/project-partlist-service/project-part-list-service.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
interface ProjectSolution {
  SolutionName: string;
  CategoryID: number;
  VersionCode: string;
  STT: number;
  Status: string;
  Description: string;
  IsUsed: boolean;
}

@Component({
  selector: 'app-project-solution-version-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzFormModule,
    NzCheckboxModule,
    NzInputNumberModule

  ],
  templateUrl: './project-solution-version-detail.component.html',
  styleUrl: './project-solution-version-detail.component.css'
})
export class ProjectSolutionVersionDetailComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  @Input() typecheck: number = 0; //0: phiên bản partlist, 1: phiên bản nhân công ( danh cho thêm sửa giải pháp)
  @Input() projectSolutionId: number = 0;
  @Input() VersionCode: string = '';
  @Input() ProjectTypeID: number = 0;
  @Input() ProjectTypeName: string = '';
  @Input() ProjectID: number = 0;
  @Input() ProjectCode: string = '';
  @Input() typeNumber: number = 0;

  //binh moi them
  @Input() ProjectSolutionName: string = '';
  @Input() SolutionTypeID: any;
  @Input() STT: number = 1;
  @Input() IsActive: boolean = false;
  @Input() IsConsumable: boolean = false;
  @Input() IsProblem: boolean = false;
  @Input() ProjectHistoryProblemIds: any = null;
  @Input() DescriptionVersion: string = '';
  @Input() ProjectworkerID: number = 0;
  @Input() versionData: any[] = [];
  @Input() isEdit: boolean = false;
  projectTypeList: any[] = [];
  cbbSolutionType: any[] = [
    { ID: 1, Name: 'Giải pháp' },
    { ID: 2, Name: 'Po' },
  ];
  historyProblems: any[] = [];

  cbbProjectSolution: any[] = [];
  ngOnInit(): void {
    this.loadProjectType();
    this.loadProjectSolutionCbb();
    this.loadHistoryProblems();
    this.form = this.fb.group({
      VersionCode: [{ value: this.VersionCode || '', disabled: true }, [this.trimRequiredValidator]], //mã phiên bản
      ProjectTypeID: [this.ProjectTypeID || null, [Validators.required]],
      ProjectSolutionID: [this.projectSolutionId || null, [Validators.required]],
      STT: [this.STT || 1],
      IsActive: [this.IsActive || false],
      IsConsumable: [this.IsConsumable || false],
      SolutionTypeID: [{ value: this.SolutionTypeID || '', disabled: true }, [Validators.required]], //trạng thái
      IsProblem: [this.IsProblem || false], // New field for Phát sinh
      ProjectHistoryProblemIds: [this.ProjectHistoryProblemIds || null], // Dropdown selection
      DescriptionVersion: [this.DescriptionVersion || '', [this.trimRequiredValidator]], //mô tả
    });

    // Subscribe to IsProblem to handle validation if needed
    this.form.get('IsProblem')?.valueChanges.subscribe(isProblem => {
      if (!isProblem) {
        this.form.get('ProjectHistoryProblemIds')?.setValue(null);
      }
    });

    if (this.isEdit && this.ProjectworkerID > 0) {
      if (this.typecheck !== 1) { // Worker
        this.projectWorkerService.getProjectHistoryProblemLinked(this.ProjectworkerID).subscribe({
          next: (response: any) => {
            if (response.status === 1 && response.data && response.data.length > 0) {
              this.form.patchValue({
                IsProblem: true,
                ProjectHistoryProblemIds: response.data[0].ID
              });
            }
          }
        });
      } else { // PartList
        this.projectPartListService.getProjectHistoryProblemLinked(this.ProjectworkerID).subscribe({
          next: (response: any) => {
            if (response.status === 1 && response.data && response.data.length > 0) {
              this.form.patchValue({
                IsProblem: true,
                ProjectHistoryProblemIds: response.data[0].ID
              });
            }
          }
        });
      }
    }
  }

  ngAfterViewInit(): void {
    // Set values after view init to ensure @Input values are available
    if (this.ProjectTypeID) {
      this.form.patchValue({
        ProjectTypeID: this.ProjectTypeID,
        ProjectTypeName: this.ProjectTypeName
      });
    }

    // Subscribe to ProjectTypeID changes to update ProjectTypeName và VersionCode
    this.form.get('ProjectTypeID')?.valueChanges.subscribe((projectTypeId: number) => {
      if (projectTypeId) {
        const selectedType = this.projectTypeList.find(type => type.ID === projectTypeId);
        if (selectedType) {
          this.form.patchValue({
            ProjectTypeName: selectedType.ProjectTypeName
          }, { emitEvent: false });
        }
        // Chỉ tính lại STT khi không phải edit mode (VersionCode chưa được set từ input)
        if (!this.VersionCode) {
          this.changeProjectTypeID();
        }
      } else {
        this.form.patchValue({
          ProjectTypeName: ''
        }, { emitEvent: false });
      }
    });
  }
  loadProjectSolutionCbb(): void {
    this.projectWorkerService.getProjectSolutionCbb(this.ProjectID).subscribe({
      next: (response: any) => {
        console.log("response", response);
        if (response.status === 1) {
          this.cbbProjectSolution = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.log("error", error);
      }
    });
  }

  loadHistoryProblems(): void {
    this.projectWorkerService.getProjectHistoryProblem(this.ProjectID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.historyProblems = response.data || [];
        }
      },
      error: (error: any) => {
        console.error("Error loading history problems:", error);
      }
    });
  }
  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private projectWorkerService: ProjectWorkerService,
    private projectPartListService: ProjectPartListService
  ) { }
  changeSTT() {
    const stt = this.form.get('STT')?.value;   // lấy giá trị STT từ form

    this.form.patchValue({
      VersionCode: 'V' + stt
    });
  }
  changeProjectTypeID(): void {
    //#region Tính STT lớn nhất + 1 theo ProjectTypeID
    let maxSTT = 0;
    if (!this.isEdit) {
      const currentProjectTypeID = this.form.get('ProjectTypeID')?.value;

      if (currentProjectTypeID && this.versionData && this.versionData.length > 0) {
        // Filter data theo ProjectTypeID hiện tại
        const filteredData = this.versionData.filter(
          (item: any) => item.ProjectTypeID === currentProjectTypeID
        );

        if (filteredData.length > 0) {
          const sttValues = filteredData
            .map((item: any) => item.STT)
            .filter(
              (stt: any) => stt != null && stt !== undefined && !isNaN(stt)
            );
          if (sttValues.length > 0) {
            maxSTT = Math.max(...sttValues);
          }
        }
      }
      // STT mới = STT lớn nhất + 1, ít nhất là 1
      const nextSTT = Math.max(1, maxSTT + 1);
      //#endregion
      this.form.patchValue({
        VersionCode: 'V' + nextSTT,
        STT: nextSTT,
      });
    }
  }
  loadProjectType(): void {
    this.projectWorkerService.getProjectType().subscribe({
      next: (response: any) => {
        console.log("response", response);
        if (response.status === 1) {
          this.projectTypeList = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error: any) => {
        console.log("error", error);
      }
    });
  }
  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };

  closeModal() {
    this.activeModal.close({ success: true, isConsumable: this.form.value.IsConsumable });
  }


  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valueRaw = this.form.getRawValue();
    const payload: any = {
      ID: this.ProjectworkerID || 0,
      ProjectSolutionID: this.projectSolutionId,
      ProjectID: this.projectSolutionId,
      STT: valueRaw.STT,
      DescriptionVersion: typeof valueRaw.DescriptionVersion === 'string' ? valueRaw.DescriptionVersion.trim() : valueRaw.DescriptionVersion,
      IsActive: valueRaw.IsActive || false,
      Code: valueRaw.VersionCode,
      StatusVersion: this.typeNumber,
      ProjectTypeID: valueRaw.ProjectTypeID,
      IsConsumable: valueRaw.IsConsumable || false,
    };
    console.log("payload", payload);
    if (this.typecheck === 1) {
      payload.IsProblem = valueRaw.IsProblem || false;
      const partListPayload = {
        ProjectPartListVersion: payload,
        ProjectHistoryProblemIDs: valueRaw.ProjectHistoryProblemIds ? [valueRaw.ProjectHistoryProblemIds] : []
      };
      this.projectPartListService.saveProjectPartListVersion(partListPayload).subscribe({
        next: (response: any) => {
          console.log("response", response);
          if (response.status === 1) {
            this.notification.success('Thông báo', response.message);
            this.closeModal();
          }
          else {
            this.notification.error('Lỗi', response.message);
          }
        },
        error: (error: any) => {
          this.notification.error('Lỗi', error.error.message);
        }
      });
    } else {
      // New payload format per SaveProjectWorkerVersionDTO
      payload.IsProblem = valueRaw.IsProblem || false;
      const workerPayload = {
        ProjectWorkerVersion: payload,
        ProjectHistoryProblemIds: valueRaw.ProjectHistoryProblemIds ? [valueRaw.ProjectHistoryProblemIds] : []
      };
      this.projectWorkerService.saveSolutionVersion(workerPayload).subscribe({
        next: (response: any) => {
          console.log("response", response);
          if (response.status === 1) {
            this.notification.success('Thông báo', response.message);
            this.closeModal();
          } else {
            this.notification.error('Lỗi', response.message);
          }
        },
        error: (error: any) => {
          console.log("error", error);
          this.notification.error('Lỗi', error.error.message);
        }
      });
    }
  }
}
