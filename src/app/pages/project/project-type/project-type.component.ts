import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ProjectService } from '../project-service/project.service';
import { Tabulator } from 'tabulator-tables';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
// import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLinkWithHref } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMentionComponent, NzMentionModule } from 'ng-zorro-antd/mention';
import { ProjectTypeDetailComponent } from '../project-type-form/project-type-detail/project-type-detail.component';
import { ProjectTypeDetailFolderComponent } from '../project-type-form/project-type-detail-folder/project-type-detail-folder.component';
import { debounceTime } from 'rxjs';
import { NgZone } from '@angular/core';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

@Component({
  selector: 'project-type',
  templateUrl: './project-type.component.html',
  standalone:true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzMentionModule,
    HasPermissionDirective
  ],
})
export class ProjectTypeComponent implements OnInit, AfterViewInit {
  tb_projectType: any;
  projectTypes: any;
  tb_folderTree: any;
  projectId: any = 0;
  keyword: string = '';
  sizeSearch: string = '0';
  isHide: any = true;
  selectedParentID: any = 0;
  FolderName: any;
  FolderID: any;
  isSearchVisible: boolean = false;
  projectCode: string = '';
  selectedParentProjectTypeId: any = '0';
  projectTypeName: any = '';
  isDeleteProject: boolean = false;
  private searchSubject: Subject<string> = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private zone: NgZone
  ) {}
  @ViewChild('tb_projectType', { static: false })
  tb_projectTypeContainer!: ElementRef;
  @ViewChild('tb_folderTree', { static: false })
  tb_folderTreeContainer!: ElementRef;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(500))
      .subscribe((value) => {
        this.keyword = value;
        this.searchProjects();
      });
  }

  ngAfterViewInit(): void {
    this.drawTbProjectType(this.tb_projectTypeContainer.nativeElement);
    setTimeout(() => {
      this.getProjectTypes();
    }, 1);
    this.drawTbFolderTree(this.tb_folderTreeContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  drawTbProjectType(container: HTMLElement) {
    this.tb_projectType = new Tabulator(container, {
      height: '89vh',
      layout: 'fitColumns',
      dataTree: true,
      dataTreeStartExpanded: true,
      selectableRows: true,
      locale: 'vi',
      dataTreeChildField: '_children',
      // ajaxURL: this.projectService.getAPIProjectTypes(),
      // ajaxParams: this.getProjectAjaxParams(),
      ajaxResponse: (url, params, response) => {
        return this.projectService.setDataTree(response.data, 'ID');
      },
      columns: [
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
        {
          title: 'Mã kiểu dự án',
          field: 'ProjectTypeCode',
          width: 150,
        },
        {
          title: 'Tên kiểu dự án',
          field: 'ProjectTypeName',
          widthGrow: 2,
        },
        {
          title: 'Thư mục',
          field: 'RootFolder',
          visible: false,
        },
        {
          title: 'ParentID',
          field: 'ParentID',
          visible: false,
        },
        {
          title: 'isDelete',
          field: 'isDelete',
          visible: false,
        },
      ],
    });
    this.tb_projectType.on('dataLoading', () => {
      if (
        this.tb_projectType &&
        typeof this.tb_projectType.deselectRow === 'function'
      ) {
        this.tb_projectType.deselectRow();
      }

      //this.sizeTbDetail = '0';
    });

    this.tb_projectType.on('rowClick', (e: any, row: any) => {
      
      this.tb_projectType.deselectRow();
      row.select();
      //this.sizeTbDetail = null;
      var rowData = row.getData();
      this.projectId = rowData['ID'];
      this.projectCode = rowData['ProjectTypeCode'];
      this.projectTypeName = rowData['ProjectTypeName'];
      this.selectedParentID = rowData['ParentID'];
      this.isDeleteProject = rowData['isDelete'];
      this.getFolderByProjectType();
    });
  }

  getFolderByProjectType() {
    this.projectService.getFolderByProjectType(this.projectId).subscribe({
      next: (response: any) => {
        this.tb_folderTree.setData(
          this.projectService.setDataTree(response.data, 'ID')
        );
      },
      error: (error:any) => {
        console.error('Lỗi:', error);
      },
    });
  }

  getProjectTypes() {
    this.projectService.getProjectType().subscribe({
      next: (response: any) => {
        let data = this.projectService.setDataTree(response.data, 'ID');
        this.tb_projectType.setData(data);
      },
      error: (err) => console.error('Lỗi:', err),
    });
  }

  //Khởi tạo tree folder
  drawTbFolderTree(container: HTMLElement) {
    this.tb_folderTree = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '89vh',
      layout: 'fitColumns',
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      columns: [
        {
          title: 'FolderName',
          field: 'FolderName',
          widthGrow: 1,
        },
        {
          title: 'ID',
          field: 'ID',
          visible: false,
        },
        {
          title: 'ParentID',
          field: 'ParentID',
          visible: false,
        },
      ],
    });
    this.tb_folderTree.on('rowClick', (e: any, row: any) => {
      this.tb_folderTree.deselectRow();
      row.select();
      var rowData = row.getData();
      this.FolderName = rowData['FolderName'];
      this.selectedParentID = rowData['ParentID'];
      this.FolderID = rowData['ID'];
      //this.sizeTbDetail = null;
    });
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '25%' : '0';
  }

  setDefautSearch() {
    this.keyword = '';
  }

  searchProjects() {
    this.projectService.getProjectType().subscribe({
      next: (response: any) => {
        const data = this.projectService.setDataTree(response.data, 'ID');
        this.tb_projectType.setData(data);
      },
      error: (err) => console.error('Lỗi tải dữ liệu:', err),
    });
  }

  getProjectAjaxParams() {
    return {
      keyword: this.keyword.trim() ?? '',
    };
  }

  createdText(text: String) {
    return `<span class="fs-12">${text}</span>`;
  }

  updateProject(status: number) {
    let selectedRows = this.tb_projectType.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);
    let selectedParentIDlist = selectedRows.map(
      (row: any) => row.getData().ParentID
    );

    // console.log("status: " + status);
    if (status == 1) {
      if (selectedIDs.length != 1) {
        this.notification.warning('Thông báo', this.createdText('Vui lòng chọn dự án!'), {
          nzStyle: { fontSize: '0.75rem' },
        });
        return;
      }
    }
    const modalRef = this.modalService.open(ProjectTypeDetailComponent, {
      centered: true,
      windowClass: 'custom-modal-size',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = status == 0 ? 0 : selectedIDs[0];

    modalRef.result.then((reason) => {
      if (reason == true) {
        this.setDefautSearch();
        this.searchProjects();
      }
    });
  }

  deletedProjects() {
    let selectedRows = this.tb_projectType.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);

    if (selectedIDs.length <= 0) {
      this.notification.warning(
        'Thông báo',
        this.createdText('Vui lòng chọn ít nhất 1 kiểu dự án để xóa!'),
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    const dataSave: any = {
      ProjectTypeCode: this.projectCode ?? '',
      ParentID: this.selectedParentProjectTypeId ?? '',
      ProjectTypeName: this.projectTypeName ?? '',
      ID: this.projectId ?? '',
      IsDeleted: true,
    };

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa kiểu dự án đã chọn?'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        this.projectService.saveProjectType(dataSave).subscribe({
          next: (response: any) => {
            this.notification.success('', this.createdText('Đã xóa kiểu dự án!'), {
              nzStyle: { fontSize: '0.75rem' },
            });
            this.searchProjects();
          },
          error: (error:any) => {
            this.notification.error('Thông báo', error.error.message, {
              nzStyle: { fontSize: '0.75rem' },
            });
            console.error('Lỗi:', error);
          },
        });
      },
    });
  }

  updateFolder(status: number) {
    let selectedProjectRows = this.tb_projectType.getSelectedRows();
    let selectedProjectIDs = selectedProjectRows.map(
      (row: any) => row.getData().ID
    );
    if (selectedProjectIDs.length !== 1) {
      this.notification.warning(
        'Thông báo',
        this.createdText('Vui lòng chọn 1 kiểu dự án!'),
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let selectedFolderRows = this.tb_folderTree.getSelectedRows();
    let selectedFolder =
      selectedFolderRows.length > 0 ? selectedFolderRows[0].getData() : null;

    // 3. Xác định folder cha mặc định
    let defaultParentFolderId: number | null = null;
    if (selectedFolder) {
      defaultParentFolderId = selectedFolder.ID; // Nếu chọn folder thì dùng folder đó
    } else {
      // Nếu không chọn thì lấy folder cha đầu tiên (folder root)
      let folderData = this.tb_folderTree.getData();
      if (folderData.length > 0) {
        defaultParentFolderId = folderData[0].ID;
      }
    }

    const modalRef = this.modalService.open(ProjectTypeDetailFolderComponent, {
      centered: true,
      windowClass: 'custom-modal-size',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId = selectedProjectIDs[0];
    modalRef.componentInstance.defaultParentFolderId = defaultParentFolderId;

    modalRef.result.then((reason) => {
      if (reason == true) {
        if (status == 0) {
          this.notification.success('', this.createdText('Đã thêm folder!'), {
            nzStyle: { fontSize: '0.75rem' },
          });
        }
        this.setDefautSearch();
        this.searchProjects();
        this.getFolderByProjectType();
      }
    });
  }

  deletedFolder() {
    let selectedRows = this.tb_folderTree.getSelectedRows();
    let selectedIDs = selectedRows.map((row: any) => row.getData().ID);
    if (selectedIDs.length <= 0) {
      this.notification.warning(
        'Thông báo','Vui lòng chọn ít nhất 1 folder để xóa!'
      );
      return;
    }
    const dataSave: any = {
      ParentID: this.selectedParentID ?? '',
      FolderName: this.FolderName ?? '',
      ProjectTypeID: this.projectId ?? '',
      ID: this.FolderID ?? '',
    };

    this.modal.confirm({
      nzTitle: this.createdText('Bạn có chắc muốn xóa folder đã chọn?<br>Lưu ý: Các folder con bên trong sẽ bị xóa'),
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOkDanger: true,

      nzOnOk: () => {
        this.projectService.deleteProjectFolder(dataSave).subscribe({
          next: (response: any) => {
            this.notification.success('Thông báo', 'Đã xóa folder!');
            this.searchProjects();
            this.getFolderByProjectType();
          },
          error: (error:any) => {
            this.notification.error('Thông báo', error.error.message, {
              nzStyle: { fontSize: '0.75rem' },
            });
            console.error('Lỗi:', error);
          },
        });
      },
    });
  }

  onKeywordChange(value: string) {
    this.searchSubject.next(value);
  }
}
