import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { PermissionManagerService } from '../permission-manager.service';

@Component({
  selector: 'app-permission-manager-function-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTreeSelectModule,
  ],
  templateUrl: './permission-manager-function-form.component.html',
  styleUrls: ['./permission-manager-function-form.component.css']
})
export class PermissionManagerFunctionFormComponent implements OnInit {
  @Input() dataInput: any = null;
  @Input() groupId: number = 0;
  @Input() groupList: any[] = [];

  form!: FormGroup;
  isEdit = false;
  parentGroupTree: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private permissionService: PermissionManagerService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();
    this.buildParentTree();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        Code: this.dataInput.Code,
        Name: this.dataInput.Name,
        Description: this.dataInput.Description,
        ShortcutKey: this.dataInput.ShortcutKey,
        ShiftKey: this.dataInput.ShiftKey || false,
        CtrlKey: this.dataInput.CtrlKey || false,
        AltKey: this.dataInput.AltKey || false,
        FormAndFunctionGroupID: this.dataInput.FormAndFunctionGroupID ? this.dataInput.FormAndFunctionGroupID.toString() : this.groupId.toString(),
        IsHide: this.dataInput.IsHide || false
      });
    } else {
      this.form.patchValue({
        FormAndFunctionGroupID: this.groupId.toString()
      });
    }
  }

  buildParentTree(): void {
    const map = new Map<number, any>();
    this.groupList.forEach(g => map.set(g.ID, {
      title: `${g.Code} - ${g.Name}`,
      key: `${g.ID}`,
      value: `${g.ID}`,
      isLeaf: true,
      children: []
    }));

    const roots: any[] = [];
    this.groupList.forEach(g => {
      const node = map.get(g.ID)!;
      if (g.ParentID && map.has(g.ParentID)) {
        const parent = map.get(g.ParentID)!;
        parent.children.push(node);
        parent.isLeaf = false;
      } else {
        roots.push(node);
      }
    });

    this.parentGroupTree = [...roots];
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      Code: ['', [Validators.required]],
      Name: ['', [Validators.required]],
      Description: [''],
      ShortcutKey: [''],
      ShiftKey: [false],
      CtrlKey: [false],
      AltKey: [false],
      FormAndFunctionGroupID: [this.groupId.toString(), [Validators.required]],
      IsHide: [false]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const payload = { 
        ...this.form.value,
        FormAndFunctionGroupID: Number(this.form.value.FormAndFunctionGroupID)
      };

      this.permissionService.saveFunction(payload).subscribe({
        next: () => {
          this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật chức năng thành công');
          this.activeModal.close('save');
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
