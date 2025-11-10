import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as bootstrap from '@ng-bootstrap/ng-bootstrap';

import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ISADMIN } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

import { IssueSolutionService } from '../issue-solution/issue-solution/issue-solution.service';


@Component({
  selector: 'app-issue-status-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgbModule,
  ],
  templateUrl: './issue-status-detail.component.html',
  styleUrl: './issue-status-detail.component.css'
})
export class IssueStatusDetailComponent implements OnInit, AfterViewInit {
  @Input() selectedId = 0;
  @Input() MAINDATA: any;
  @Input() isEditMode: boolean = false;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private issueSolutionService: IssueSolutionService,
    private modalService: NgbModal,
  ){}

  ngOnInit(): void {
    this.form = this.fb.group({
      StatusCode: ['', Validators.required],
      StatusName: ['', Validators.required]
    });

    if(this.isEditMode)
      {
        this.handleEditModeData();
      }
  }

  ngAfterViewInit(): void {
    
  }

  handleEditModeData(): void {
    const data = this.MAINDATA;
    console.log("dataEditIssueStatus",data);
    if(data)
    {
      const formData = {
        StatusCode: data.StatusCode ?? '',
        StatusName: data.StatusName ?? ''
      }
      this.form.patchValue(formData);
    }
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  saveData(){
    if(this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        ID: this.selectedId ?? 0,
        StatusCode: formValue.StatusCode,
        StatusName: formValue.StatusName
      }
      this.issueSolutionService.saveIssueStatus(payload).subscribe({
        next: (response) => {
          if (response.status === 1) {
            this.activeModal.close({
              success: true,
              reloadData: true,
            });          
          } else {
            this.notification.error(
              'Lỗi',
              response.message || 'Lưu dữ liệu thất bại!'
            );
          }
        },
        error: (err: any) => {
          this.notification.error('Lỗi', 'Không thể lưu dữ liệu!', err.message);
        },
      });
    }
    else {
      this.markAllFieldsAsTouched();
      this.notification.error('Lỗi', 'Vui lòng kiểm tra lại thông tin!');
    }
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }
}
