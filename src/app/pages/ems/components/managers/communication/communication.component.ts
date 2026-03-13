import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCopy,
  faPenToSquare,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CellComponent, ColumnDefinition } from 'tabulator-tables';
import { RefreshableDirective } from '../../../directives/refreshData.directive';
import { Communication } from '../../../models/communication';
import { CommunicationParam } from '../../../models/communicationParam';
import { CommunicationService } from '../../../services/managers/communication.service';
import { CommunicationParamService } from '../../../services/managers/communicationParam.service';
import { ToastHelper } from '../../../services/toastHelper.service';
import { TabulatorTableSingleComponent } from '../../_shared/tabulator-table/tabulator-tables.component';

@Component({
  selector: 'communication',
  templateUrl: './communication.component.html',
  styleUrls: ['./communication.component.css'],
  imports: [
    TabulatorTableSingleComponent,
    FontAwesomeModule,
    RefreshableDirective,
    FormsModule,
  ],
})
export class CommunicationComponent implements OnInit {
  //#region Properties
  faPlus = faPlus;
  faPenToSquare = faPenToSquare;
  faCopy = faCopy;
  faTrash = faTrash;
  commMaster: Communication[] = [];
  commDetail: CommunicationParam[] = [];
  masterColumns: ColumnDefinition[] = [
    {
      title: 'Tên',
      field: 'CommunicationName',
      headerHozAlign: 'center',
      width: 120,
    },
    {
      title: 'Mô tả',
      field: 'Description',
      headerHozAlign: 'center',
      widthGrow: 1,
    },
  ];
  detailColumns: ColumnDefinition[] = [
    { title: 'Tên', field: 'ParamKey', headerHozAlign: 'center' },
    { title: 'Kiểu dữ liệu', field: 'DataType', headerHozAlign: 'center' },
    {
      title: 'Bắt buộc',
      field: 'IsRequired',
      headerHozAlign: 'center',
      formatter: 'tickCross',
      hozAlign: 'center',
    },
    { title: 'Mô tả', field: 'Description', headerHozAlign: 'center' },
  ];
  modalDetailColumns: ColumnDefinition[] = [
    {
      title: 'STT',
      field: 'SortOrder',
      headerHozAlign: 'center',
      hozAlign: 'center',
      editable: true,
      editor: true,
      width: 80,
    },
    {
      title: 'Tên',
      field: 'ParamKey',
      headerHozAlign: 'center',
      editable: true,
      editor: true,
      width: 150,
    },
    {
      title: 'Kiểu dữ liệu',
      field: 'DataType',
      headerHozAlign: 'center',
      editable: true,
      editor: true,
      width: 150,
    },
    {
      title: 'Bắt buộc',
      field: 'IsRequired',
      headerHozAlign: 'center',
      formatter: 'tickCross',
      hozAlign: 'center',
      cellClick: function (_, cell) {
        const currentValue = cell.getValue();
        cell.setValue(!currentValue);
      },
    },
    {
      title: 'Mô tả',
      field: 'Description',
      headerHozAlign: 'center',
      editable: true,
      editor: true,
      widthGrow: 1,
    },
  ];
  commFormValue: Communication = new Communication();

  commModalDetail: CommunicationParam[] = [];

  @ViewChild('tblMaster', { static: false })
  tblMaster!: TabulatorTableSingleComponent;
  @ViewChild('tblDetail', { static: false })
  tblDetail!: TabulatorTableSingleComponent;
  @ViewChild('tblModalDetail', { static: false })
  tblModalDetail!: TabulatorTableSingleComponent;
  @ViewChild('btnDeleteMaster', { static: false })
  btnDeleteMaster!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnDeleteDetail', { static: false })
  btnDeleteDetail!: ElementRef<HTMLButtonElement>;
  //#endregion

  //#region Constructor
  constructor(
    private commService: CommunicationService,
    private commParamService: CommunicationParamService,
    private modalService: NgbModal,
    private toastHelper: ToastHelper,
    private toastr: ToastrService
  ) {}
  //#endregion

  //#region Life cycle
  ngOnInit() {
    this.loadCommunication();
  }
  //#endregion
  loadCommunication() {
    this.commService.getAll().subscribe({
      next: (data) => {
        this.commDetail = [];
        this.commMaster = data;
      },
      error: (err) => {
        console.error('Failed to load data', err);
      },
    });
  }
  openModal(content: TemplateRef<any>, isEditing = false) {
    const selected = this.tblMaster.getSelectedRow();
    if (isEditing && !selected) return;
    this.commFormValue = isEditing
      ? new Communication(selected)
      : new Communication();
    this.commParamService
      .getByCommunicationId(this.commFormValue.Id)
      .subscribe({
        next: (data) => {
          this.commModalDetail = data;
          this.modalService.open(content, { fullscreen: true });
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Tải dữ liệu thất bại', 'Thông báo');
        },
      });
  }
  onRefresh() {
    this.loadCommunication();
    console.log('data reloaded');
  }
  save(modal: NgbActiveModal) {
    const isEditing = !!this.commFormValue.Id;
    this.commService.createOrUpdate(this.commFormValue).subscribe({
      next: (data) => {
        if (!isEditing) {
          this.commModalDetail.forEach((d) => {
            d.CommunicationId = data.Id;
            this.commParamService.create(d).subscribe();
          });
        } else {
          // If we need optimization we can check the table and see which row is edited
          // For now it's not implemented
          this.commModalDetail.forEach((d) => {
            if (!d.ParamKey || !d.DataType) return;
            this.commParamService.createOrUpdate(d).subscribe();
          });
        }
        this.loadCommunication();
        modal.close();
      },
      error: (err) => {
        console.error('Failed to call API:', err);
        this.toastr.error('Gửi dữ liệu không thành công', 'Thông báo');
      },
    });
  }
  onDelete() {
    const selected = this.tblMaster.getSelectedRow();
    if (!selected) return;
    this.btnDeleteMaster.nativeElement.classList.add('disabled');

    this.toastHelper.showToast(
      'error',
      'Xác nhận xóa?',
      '✔',
      () => {
        this.commService.deleteById(selected.Id).subscribe({
          complete: () => {
            this.loadCommunication();
            this.onMasterRowChanged();
            this.btnDeleteMaster.nativeElement.classList.remove('disabled');
          },
        });
      },
      '✖',
      () => {
        this.btnDeleteMaster.nativeElement.classList.remove('disabled');
      }
    );
  }
  onMasterRowChanged() {
    // this shit doesn't change correctly when any row is deleted after reloading data
    // so if Communication table has IsDeleted column we need to change this stupid shit
    // it only works, FOR NOW!
    const comm = this.tblMaster.getSelectedRow() as Communication;
    if (!comm) return;
    this.commParamService.getByCommunicationId(comm.Id).subscribe({
      next: (data) => {
        this.commDetail = data;
      },
      error: (err) => {
        console.error('Failed to load data', err);
        this.toastr.error('Tải dữ liệu thất bại', 'Thông báo');
      },
    });
  }
  addRow() {
    const newParam = new CommunicationParam();
    newParam.Id = 0;
    newParam.CommunicationId = this.commFormValue.Id;
    newParam.DataType = '';
    newParam.Description = '';
    newParam.IsRequired = false;
    newParam.ParamKey = '';
    this.commModalDetail = [newParam, ...this.commModalDetail];
  }
  onRefreshDetail() {
    this.commParamService
      .getByCommunicationId(this.commFormValue.Id)
      .subscribe({
        next: (data) => {
          this.commModalDetail = data;
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Tải dữ liệu thất bại', 'Thông báo');
        },
      });
  }
  // onCellEdit(cell: CellComponent) {
  //   const data = cell.getRow().getData() as CommunicationParam;
  //   if (!data.Id && (!data.ParamKey || !data.DataType || !data.CommunicationId))
  //     return;
  //   this.commParamService.createOrUpdate(data).subscribe({
  //     next: () => {
  //       this.onRefreshDetail();
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.toastr.error('Gửi dữ liệu không thành công', 'Thông báo');
  //     },
  //   });
  // }
  onCellsDelete() {
    const selected =
      this.tblModalDetail.getSelectedRows() as CommunicationParam[];
    if (!selected.length) return;
    this.btnDeleteDetail.nativeElement.classList.add('disabled');
    this.toastHelper.showToast(
      'error',
      'Xác nhận xóa?',
      '✔',
      () => {
        selected.forEach((s) => {
          if (!s.Id) return;
          this.commParamService.deleteById(s.Id).subscribe({
            next: () => {
              this.commModalDetail = this.commModalDetail.filter(
                (c) => c.Id != s.Id
              );
            },
            error: (err) => {
              console.error(err);
              this.toastr.error('Gửi dữ liệu không thành công', 'Thông báo');
            },
          });
        });
        this.btnDeleteDetail.nativeElement.classList.remove('disabled');
      },
      '✖',
      () => {
        this.btnDeleteDetail.nativeElement.classList.remove('disabled');
      }
    );
  }
}
