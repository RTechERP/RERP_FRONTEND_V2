// import { ProjectPriorityDetailComponent } from './../project-priority-detail/project-priority-detail.component';
import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  TemplateRef,
  input,
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
import { NodeWithI18n } from '@angular/compiler';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';

@Component({
  standalone: true,
  selector: 'app-project-type-detail-folder',
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
    NzTreeSelectModule,
  ],
  templateUrl: './project-type-detail-folder.component.html',
  styleUrl: './project-type-detail-folder.component.css',
})
export class ProjectTypeDetailFolderComponent implements OnInit, AfterViewInit {
  parentIDList: any[] = [];
  @Input() projectId: any;
  @Input() defaultParentFolderId: number | null = null;
  @ViewChild('tb_projectTypeFolderContainer', { static: false })
  tb_projectTypeFolderContainer!: ElementRef;
  tb_projectTypeFolder: any;
  form!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder
  ) {}

  //#region Chạy khi mở chương trình
  ngOnInit(): void {
    this.form = this.fb.group({
      ParentID: [this.defaultParentFolderId ?? null, [Validators.required]],
      FolderName: ['', [this.trimRequiredValidator, this.noAccentNoSpaceValidator]],
    });
  }

  ngAfterViewInit(): void {
    this.getFolder();
  }
  //#endregion

  getFolder() {
    this.projectService.getFolders().subscribe({
      next: (response: any) => {
        if (response.status === 1 && Array.isArray(response.data)) {
          const treeData = this.buildTree(response.data);
          this.parentIDList = treeData.map((node) => this.mapToNzTree(node));
        }
      },
      error: (error:any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  saveData(): void {
    this.save();
  }

  noAccentNoSpaceValidator = (control: any) => {
    const value = control?.value;
    if (!value) return { required: true };
  
    const trimmed = value.trim();
  
    // Regex: chỉ cho phép a-z, A-Z, 0-9, gạch dưới và gạch ngang
    const regex = /^[a-zA-Z0-9_-]+$/;
  
    // Chuyển tiếng Việt có dấu → không dấu để kiểm tra
    const normalized = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
    // Nếu có ký tự không hợp lệ hoặc có dấu hoặc có khoảng trắng
    if (!regex.test(trimmed) || trimmed !== normalized) {
      return { invalidFolderName: true };
    }
  
    return null;
  };
  
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const dataSave: any = {
      ParentID: raw.ParentID ?? '',
      FolderName: typeof raw.FolderName === 'string' ? raw.FolderName.trim() : raw.FolderName,
      ProjectTypeID: this.projectId ?? '',
    };
    this.projectService.saveProjectTreeFolder(dataSave).subscribe({
      next: (response: any) => {
        if (response.status == 1) {
          this.activeModal.close(true);
        }
      },
      error: (error:any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  drawTbProjectTypeFolder(data: any[]) {
    if (this.tb_projectTypeFolder) {
      this.tb_projectTypeFolder.destroy();
    }
    this.tb_projectTypeFolder = new Tabulator(
      this.tb_projectTypeFolderContainer.nativeElement,
      {
        height: '80vh',
        layout: 'fitColumns',
        dataTree: true,
        dataTreeStartExpanded: true,
        locale: 'vi',
        dataTreeChildField: '_children',
        data: data,
        columns: [
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'ParentID',
            field: 'ParentID',
            visible: false,
          },
          {
            title: 'FolderName',
            field: 'FolderName',
            width: 150,
          },
        ],
      }
    );
    this.tb_projectTypeFolder.on('dataLoading', () => {
      this.tb_projectTypeFolder.deselectRow();
      this.form.patchValue({ ParentID: null });
    });

    this.tb_projectTypeFolder.on('rowClick', (e: any, row: any) => {
      this.tb_projectTypeFolder.deselectRow();
      row.select();
      var rowData = row.getData();
      if (e.type === 'click') this.form.patchValue({ ParentID: rowData['ID'] });
    });
  }
  mapToNzTree(node: any): any {
    return {
      title: node.FolderName,
      key: node.ID,
      value: String(node.ID),
      children: (node.children || []).map((child: any) =>
        this.mapToNzTree(child)
      ),
    };
  }
  buildTree(list: any[]): any[] {
    const map: { [key: number]: any } = {};
    const roots: any[] = [];

    // Bước 1: Gán mỗi phần tử vào map để truy cập nhanh
    list.forEach((item) => {
      map[item.ID] = { ...item, children: [] };
    });

    // Bước 2: Xác định cha-con
    list.forEach((item) => {
      if (item.ParentID && map[item.ParentID]) {
        map[item.ParentID].children.push(map[item.ID]);
      } else {
        roots.push(map[item.ID]);
      }
    });

    return roots;
  }

  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };
  closeModal(){
    this.activeModal.close();
  }
}
