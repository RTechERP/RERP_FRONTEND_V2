import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  input,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
} from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  OnEventArgs,
  OperatorType,
  SortDirectionNumber,
} from '@slickgrid-universal/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { AppUserService } from '../../../../../services/app-user.service';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportQcService } from '../bill-import-qc-service/bill-import-qc-service.service';

@Component({
  selector: 'app-bill-import-qc-file',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularSlickgridModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzCheckboxModule,
    NzTabsModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    HasPermissionDirective,
    NzSplitterModule,
    FormsModule,
  ],
  templateUrl: './bill-import-qc-file.component.html',
  styleUrl: './bill-import-qc-file.component.css',
})
export class BillImportQcFileComponent implements OnInit, AfterViewInit {
  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private billImportQcService: BillImportQcService
  ) {}
  @Input() fileData: any = [];
  @Input() fileName: string = '';
  @Input() fileType: any = 0;
  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};

  lsFileDelete: any = [];

  ngOnInit(): void {
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void {}

  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;
    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
    }, 100);
  }

  onGridMasterHeaderClick(e: Event, args: any) {
    const column = args.column;
    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-plus')) {
        this.openFilePicker();
      }
    }
  }

  onGridMasterClick(e: Event, args: OnClickEventArgs) {
    const column = args.grid.getColumns()[args.cell];

    if (column.id === 'action') {
      const clickedElement = e.target as HTMLElement;

      if (clickedElement.classList.contains('fa-trash')) {
        const item = args.grid.getDataItem(args.row);

        this.modal.confirm({
          nzTitle: 'Xác nhận xóa',
          nzContent: `Bạn có chắc chắn muốn xóa file ${item.FileName} không?`,
          nzOkText: 'Xóa',
          nzCancelText: 'Hủy',
          nzOkDanger: true,
          nzOnOk: () => {
            this.deleteRow(item);
          },
        });
      }
    }
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';

    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.addFilesToGrid(files);
      }
    };

    input.click();
  }

  addFilesToGrid(files: FileList) {
    const existingFileNames = this.fileData.map((x: any) => x.FileName);
    const duplicateFiles: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (existingFileNames.includes(file.name)) {
        duplicateFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (duplicateFiles.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Các file sau đã tồn tại: ${duplicateFiles.join(', ')}`
      );
    }

    if (validFiles.length > 0) {
      const newFiles = validFiles.map((file, index) => {
        const newId =
          this.fileData.length > 0
            ? Math.max(...this.fileData.map((x: any) => x.ID || 0)) + index + 1
            : index + 1;

        return {
          ID: newId,
          STT: this.fileData.length + index + 1,
          FileName: file.name,
          FileSize: file.size,
          FileObject: file,
        };
      });

      this.fileData = [...this.fileData, ...newFiles];
    }
  }

  deleteRow(item: any) {
    this.fileData = this.fileData.filter((x: any) => x.ID !== item.ID);
    if (!this.lsFileDelete.includes(item.ID) && item.ID > 0) {
      this.lsFileDelete.push(item.ID);
    }
    this.fileData = this.fileData.map((x: any, index: number) => ({
      ...x,
      STT: index + 1,
    }));
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-detail-file',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      datasetIdPropertyName: 'ID',
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: true,
      enableAutoSizeColumns: true,
      forceFitColumns: true,
      enableColumnReorder: true,
    };
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'action',
        name: '<i class="fas fa-plus" style="cursor:pointer; color:#1890ff;" title="Thêm file mới"></i>',
        field: 'action',
        width: 60,
        sortable: false,
        filterable: false,
        excludeFromHeaderMenu: true,
        formatter: (_row, _cell, _value, _column, _dataContext) => {
          return `<div style="text-align:center;"><i class="fas fa-trash" style="cursor:pointer; color:#ff4d4f;" title="Xóa file"></i></div>`;
        },
      },
      {
        id: 'STT',
        name: 'STT',
        field: 'STT',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                <span
                  title="${dataContext.StatusText ?? ''}"
                  style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;"
                >
                  ${value}
                </span>
              `;
        },
      },
      {
        id: 'FileName',
        name: 'Tên file',
        field: 'FileName',
        width: 765,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
    ];
  }

  saveFile() {
    this.activeModal.close({
      fileData: this.fileData,
      fileDelete: this.lsFileDelete,
      fileType: this.fileType,
    });
  }
}
