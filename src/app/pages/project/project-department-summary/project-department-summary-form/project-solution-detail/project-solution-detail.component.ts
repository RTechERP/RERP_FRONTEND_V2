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
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';

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
  selector: 'app-project-solution-detail',
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
  ],
  templateUrl: './project-solution-detail.component.html',
  styleUrl: './project-solution-detail.component.css'
})
export class ProjectSolutionDetailComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  @Input() projectSolutionId: number = 0;
  projectTypeList: any[] = [];
  ngOnInit(): void {
    this.form = this.fb.group({
      SolutionName: ['', [this.trimRequiredValidator]],
      CategoryID: [null, [Validators.required]],
      VersionCode: ['', [this.trimRequiredValidator]],
      STT: [null],
      Status: ['', [this.trimRequiredValidator]],
      Description: [''],
      IsUsed: [false],
    });
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
      }
    });
  }
  ngAfterViewInit(): void {}

  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private projectWorkerService: ProjectWorkerService
  ) {}

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };

  closeModal() {
    this.activeModal.close(true);
  }

  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valueRaw = this.form.getRawValue();
    const value = {
      SolutionName: typeof valueRaw.SolutionName === 'string' ? valueRaw.SolutionName.trim() : valueRaw.SolutionName,
      CategoryID: valueRaw.CategoryID,
      VersionCode: typeof valueRaw.VersionCode === 'string' ? valueRaw.VersionCode.trim() : valueRaw.VersionCode,
      STT: valueRaw.STT,
      Status: typeof valueRaw.Status === 'string' ? valueRaw.Status.trim() : valueRaw.Status,
      Description: typeof valueRaw.Description === 'string' ? valueRaw.Description.trim() : valueRaw.Description,
      IsUsed: valueRaw.IsUsed || false,
    };
    
    // TODO: Implement save logic
    console.log('Form data:', value);
    this.notification.success('Thông báo', 'Lưu thành công!');
    this.closeModal();
  }
}
