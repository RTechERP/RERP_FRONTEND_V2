import { Component, Input, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DateTime } from 'luxon';
import { FormControl, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { WorkItemServiceService } from '../../work-item-service/work-item-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-item-problem',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './project-item-problem.component.html',
  styleUrl: './project-item-problem.component.css'
})
export class ProjectItemProblemComponent implements OnInit, AfterViewInit {
  @Input() projectItemId: number = 0;
  @ViewChild('tb_ProjecrItemProblem', { static: false })
  tb_FileProjectItemProblemTableElement!: ElementRef;
  private tb_FileProjectItemProblemTable!: Tabulator;
  fileProjectItemProblemData: any[] = [];
  form!: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private workItemService: WorkItemServiceService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      ContentProblem: new FormControl('', [Validators.required]),
    });
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.tb_FileProjectItemProblemTableElement?.nativeElement) {
        this.drawTbProjecrItemProblemTable(this.tb_FileProjectItemProblemTableElement.nativeElement);
      }
    }, 0);
  }

  loadData(): void {
    if (!this.projectItemId || this.projectItemId <= 0) {
      return;
    }
    
    this.workItemService.getProjectItemProblem(this.projectItemId).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.fileProjectItemProblemData = response.data || [];
          if (this.tb_FileProjectItemProblemTable) {
            this.tb_FileProjectItemProblemTable.setData(this.fileProjectItemProblemData);
          }
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể tải dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error loading problem data:', error);
        this.notification.error('Lỗi', 'Không thể tải dữ liệu vấn đề');
      }
    });
  }

  saveData(): void {
    // Validate form trước khi lưu
    if (!this.validateForm()) {
      return;
    }

    const contentProblem = this.form.get('ContentProblem')?.value?.trim();

    const payload = {
      ID: 0, // Tạo mới
      ProjectItemID: this.projectItemId,
      ContentProblem: contentProblem,
      Note: null,
    };

    this.workItemService.saveProjectItemProblem(payload).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success('Thông báo', response.message || 'Thêm phát sinh vấn đề thành công!');
          // Reset form
          this.form.reset();
          // Reload data
          this.loadData();
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu dữ liệu');
        }
      },
      error: (error: any) => {
        console.error('Error saving problem:', error);
        this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  }

  // Method để nối chuỗi các problems giống logic WinForm
  setContent(): string {
    let contentProblem = '';
    // Sắp xếp theo CreatedDate giảm dần (mới nhất trước)
    const sortedProblems = [...this.fileProjectItemProblemData].sort((a, b) => {
      const dateA = a.CreatedDate ? new Date(a.CreatedDate).getTime() : 0;
      const dateB = b.CreatedDate ? new Date(b.CreatedDate).getTime() : 0;
      return dateB - dateA; // Giảm dần
    });

    sortedProblems.forEach((item) => {
      if (item.CreatedDate && item.ContentProblem) {
        const dateTime = DateTime.fromISO(item.CreatedDate);
        const formattedDate = dateTime.isValid 
          ? dateTime.toFormat('dd/MM/yyyy HH:mm') 
          : '';
        contentProblem += formattedDate + ': ' + item.ContentProblem + '\n';
      }
    });

    return contentProblem;
  }

  //#region Validation methods
  private trimAllStringControls() {
    Object.keys(this.form.controls).forEach(k => {
      const c = this.form.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  // Method để lấy error message cho các trường
  getFieldError(fieldName: string): string | undefined {
    const control = this.form.get(fieldName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        switch (fieldName) {
          case 'ContentProblem':
            return 'Vui lòng nhập nội dung vấn đề!';
          default:
            return 'Trường này là bắt buộc!';
        }
      }
    }
    return undefined;
  }

  // Method để validate form
  validateForm(): boolean {
    this.trimAllStringControls();
    const requiredFields = ['ContentProblem'];
    const invalidFields = requiredFields.filter(key => {
      const control = this.form.get(key);
      return !control || control.invalid || control.value === '' || control.value == null;
    });
    if (invalidFields.length > 0) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }
  //#endregion

  closeModal(): void {
    // Reload data để đảm bảo có dữ liệu mới nhất trước khi nối chuỗi
    if (this.projectItemId && this.projectItemId > 0) {
      this.workItemService.getProjectItemProblem(this.projectItemId).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            this.fileProjectItemProblemData = response.data || [];
            // Nối chuỗi các problems và trả về cho component cha
            const contentProblem = this.setContent();
            this.activeModal.close({ 
              success: true, 
              contentProblem: contentProblem,
              projectItemId: this.projectItemId
            });
          } else {
            // Nếu không load được, vẫn trả về dữ liệu hiện có
            const contentProblem = this.setContent();
            this.activeModal.close({ 
              success: true, 
              contentProblem: contentProblem,
              projectItemId: this.projectItemId
            });
          }
        },
        error: (error: any) => {
          console.error('Error loading problem data before close:', error);
          // Nếu có lỗi, vẫn trả về dữ liệu hiện có
          const contentProblem = this.setContent();
          this.activeModal.close({ 
            success: true, 
            contentProblem: contentProblem,
            projectItemId: this.projectItemId
          });
        }
      });
    } else {
      // Nếu không có projectItemId, trả về empty
      this.activeModal.close({ 
        success: true, 
        contentProblem: '',
        projectItemId: this.projectItemId
      });
    }
  }
  drawTbProjecrItemProblemTable(container: HTMLElement): void {
    this.tb_FileProjectItemProblemTable = new Tabulator(container, {
      data: this.fileProjectItemProblemData,
      layout: 'fitColumns',
      pagination: false,
      paginationSize: 10,
      height: '100%',
      columns: [
       
        { title: 'Nội dung', field: 'ContentProblem', hozAlign: 'left', formatter: 'textarea' },
        {title: 'Ngày tạo', field: 'CreatedDate', hozAlign: 'center', formatter: function (cell, formatterParams, onRendered) {
          let value = cell.getValue() || '';
          const dateTime = DateTime.fromISO(value);
          value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy hh:mm:ss') : '';
          return value;
        } },
        {title: 'Người tạo', field: 'CreatedBy', hozAlign: 'center', formatter: function (cell, formatterParams, onRendered) {
          let value = cell.getValue() || '';
          return value;
        } },
      ],
    });
  }
}