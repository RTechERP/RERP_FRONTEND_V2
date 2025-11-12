// import { ProjectPriorityDetailComponent } from './../project-priority-detail/project-priority-detail.component';
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectService } from '../../project-service/project.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ViewContainerRef } from '@angular/core';
import { SelectLeaderComponent } from '../../project-control/select-leader.component';

import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { ProjectStatusDetailComponent } from '../../project-status-detail/project-status-detail.component';
import { SelectProjectEmployeeGroupComponent } from '../../project-control/select-project-employee-group';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  standalone: true,
  selector: 'app-project-type-detail',
  imports: [
    NzTabsModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    CommonModule,
    NzFormModule,
  ],
  templateUrl: './project-type-detail.component.html',
  styleUrl: './project-type-detail.component.css',
})
export class ProjectTypeDetailComponent implements OnInit, AfterViewInit {
  parentProjectType: any[] = [];
  @Input() projectId: any;
  @ViewChild('tb_projectType', { static: false })
  tb_projectType!: ElementRef;

  form!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {}

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    this.form = this.fb.group({
      ParentID: [null, [Validators.required]],
      ProjectTypeCode: ['', [this.trimRequiredValidator]],
      ProjectTypeName: ['', [this.trimRequiredValidator]],
    });
  }

  ngAfterViewInit(): void {
    this.getParentprojectType();
    this.getProjectTypeDetail();
  }
  //#endregion

  getParentprojectType() {
    this.projectService.getParentProjectTypes().subscribe({
      next: (response: any) => {
        this.parentProjectType = response.data;
      },
      error: (error:any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  saveData(): void {
    this.saveDataProject();
  }

  saveDataProject() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
        this.save();
  }

  getProjectTypeDetail(): void {
    this.projectService.getProjectTypeByID(this.projectId).subscribe({
      next: (response: any) => {
        const data = response.data?.[0];
        if (!data) return;
        this.form.patchValue({
          ProjectTypeCode: data.ProjectTypeCode ?? '',
          ProjectTypeName: data.ProjectTypeName ?? '',
          ParentID: data.ParentID ?? null,
        });
      },
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const dataSave: any = {
      ProjectTypeCode: typeof raw.ProjectTypeCode === 'string' ? raw.ProjectTypeCode.trim() : raw.ProjectTypeCode,
      ParentID: raw.ParentID ?? '',
      ProjectTypeName: typeof raw.ProjectTypeName === 'string' ? raw.ProjectTypeName.trim() : raw.ProjectTypeName,
      ID: this.projectId ?? '',
    };
    this.projectService.saveProjectType(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.notification.success("Thông báo"," Đã cập nhật kiểu dự án!");
          this.activeModal.close(true);
        }else if(response.status ==2){
          this.notification.error("Thông báo","Mã kiểu dự án đã tồn tại. Vui lòng thử lại" )
        }
      },
      error: (error:any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };
  closeModal(){
    this.activeModal.close(false);
  }
}
