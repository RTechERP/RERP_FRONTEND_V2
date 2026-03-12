import {
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { TabulatorTableSingleComponent } from '../../_shared/tabulator-table/tabulator-tables.component';
import { Devices } from '../../../models/devices';
import { DevicesService } from '../../../services/managers/devices.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faPenToSquare,
  faCopy,
  faTrash,
  faEye,
  faClipboard,
} from '@fortawesome/free-solid-svg-icons';
import { CellComponent, ColumnDefinition } from 'tabulator-tables';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefreshableDirective } from '../../../directives/refreshData.directive';
import { FormsModule } from '@angular/forms';
import { ToastHelper } from '../../../services/toastHelper.service';
import { NgxSelectModule } from 'ngx-select-ex';
import { AreasService } from '../../../services/managers/areas.service';
import { Areas } from '../../../models/areas';
import { DeviceParam } from '../../../models/deviceParam';
import { DeviceParamService } from '../../../services/managers/deviceParam.service';
import { Communication } from '../../../models/communication';
import { CommunicationService } from '../../../services/managers/communication.service';
import { DeviceCommunicationParamConfig } from '../../../models/deviceCommunicationParamConfig';
import { DeviceCommunicationParamConfigService } from '../../../services/managers/deviceCommunicationParamConfig.service';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css'],
  imports: [
    TabulatorTableSingleComponent,
    FontAwesomeModule,
    RefreshableDirective,
    FormsModule,
    NgxSelectModule,
    FormsModule,
  ],
})
export class DevicesComponent implements OnInit {
  //#region Properties
  devices: Devices[] = [];
  deviceParams: DeviceParam[] = [];
  communication: Communication[] = [];
  areas: Areas[] = [];
  deviceCommParamConfig: DeviceCommunicationParamConfig[] = [];
  deviceColumns: ColumnDefinition[] = [
    {
      title: 'Tên',
      field: 'DeviceName',
      width: '35%',
      headerHozAlign: 'center',
    },
    {
      title: 'Mô tả',
      field: 'Description',
      width: '25%',
      headerHozAlign: 'center',
    },
    {
      title: 'Khu vực',
      field: 'AreaName',
      width: '20%',
      headerHozAlign: 'center',
    },
    {
      title: 'Trạng thái',
      field: 'IsActive',
      formatter: 'tickCross',
      hozAlign: 'center',
      width: '10%',
      headerHozAlign: 'center',
    },
  ];
  deviceParamsColumns: ColumnDefinition[] = [];
  faPlus = faPlus;
  faPenToSquare = faPenToSquare;
  faCopy = faCopy;
  faTrash = faTrash;
  faEye = faEye;
  faClipboard = faClipboard;
  deviceFormValue: Devices = new Devices();
  @ViewChild('tblComp', { static: false })
  tblComp!: TabulatorTableSingleComponent;
  @ViewChild('tblModalDetail', { static: false })
  tblModalDetail!: TabulatorTableSingleComponent;
  @ViewChild('btnCopy', { static: false })
  btnCopy!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnPaste', { static: false })
  btnPaste!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnDelete', { static: false })
  btnDelete!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnDeleteDetail', { static: false })
  btnDeleteDetail!: ElementRef<HTMLButtonElement>;
  @ViewChild('paramValues', { static: false })
  paramModal!: TemplateRef<any>;
  //#endregion

  //#region Constructor
  constructor(
    private devicesService: DevicesService,
    private areasSevices: AreasService,
    private commService: CommunicationService,
    private deviceParamService: DeviceParamService,
    private deviceCommParamConfigService: DeviceCommunicationParamConfigService,
    private modalService: NgbModal,
    private toastHelper: ToastHelper //private toastr : ToastrService
  ) {}
  //#endregion

  //#region Life cycle
  ngOnInit() {
    this.loadDevices();
  }
  //#endregion
  initCol(): ColumnDefinition[] {
    return [
      {
        title: '',
        headerSort: false,
        headerHozAlign: 'center',
        formatter: (cell) => {
          const btn = document.createElement('button');
          btn.classList.add('btn', 'btn-sm', 'btn-primary', 'do-btn');
          const i = document.createElement('i');
          i.classList.add('bi', 'bi-eye');
          btn.append(i);
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const rowData = cell.getRow().getData() as DeviceParam;
            if (!rowData.Id)
              this.deviceParamService
                .createOrUpdate(rowData)
                .subscribe((result) => {
                  rowData.Id = result.Id;
                  this.openParamModal(rowData);
                });
            else this.openParamModal(rowData);
          });
          return btn;
        },
        width: 100,
        hozAlign: 'center',
      },
      {
        title: 'Tên tham số',
        field: 'ParamName',
        width: '18%',
        headerHozAlign: 'center',
        editable: true,
        editor: true,
      },
      {
        title: 'Kiểu truyền thông',
        field: 'CommunicationId',
        width: '21%',
        headerHozAlign: 'center',
        editable: true,
        editor: 'list',
        editorParams: {
          values: this.communication.map((c) => ({
            value: c.Id,
            label: c.CommunicationName,
          })),
          multiselect: false,
          autocomplete: true,
        },
        formatter: (cell) => {
          const id = cell.getValue() as number;
          return (
            this.communication.find((c) => c.Id == id)?.CommunicationName ?? ''
          );
        },
      },
      {
        title: 'Đơn vị',
        field: 'Unit',
        width: '15%',
        headerHozAlign: 'center',
        editable: true,
        editor: true,
      },
      {
        title: 'Active',
        field: 'IsActive',
        formatter: 'tickCross',
        hozAlign: 'center',
        width: '15%',
        headerHozAlign: 'center',
        cellClick: function (_: Event, cell: CellComponent) {
          const currentValue = cell.getValue();
          cell.setValue(!currentValue);
        },
      },
      {
        title: 'Thời gian lấy mẫu (ms)',
        field: 'PollingInterval',
        width: '20%',
        headerHozAlign: 'center',
        editable: true,
        editor: true,
      },
    ];
  }
  loadDevices() {
    this.devicesService.getAll().subscribe({
      next: (data) => {
        this.devices = data;
      },
      error: (err) => {
        console.error('Failed to load areas', err);
      },
    });
  }
  loadAreas() {
    this.areasSevices.getAll().subscribe({
      next: (data) => {
        this.areas = data;
      },
      error: (err) => {
        console.error('Failed to load areas', err);
      },
    });
  }
  loadDeviceParam(deviceId: number) {
    this.deviceParamService.getByDeviceId(deviceId).subscribe({
      next: (data) => {
        this.deviceParams = data;
      },
    });
  }
  openModal(content: TemplateRef<any>, isEditing = false) {
    const selected = this.tblComp.getSelectedRow() as Devices;
    if (isEditing && !selected) return;
    this.loadAreas();
    this.commService
      .getAll()
      .subscribe((data) => {
        this.communication = data;
      })
      .add(() => {
        this.deviceParamService
          .getByDeviceId(isEditing ? selected.Id : 0)
          .subscribe((data) => {
            const newRow = new DeviceParam();
            newRow.DeviceId = this.deviceFormValue.Id;
            this.deviceParams = data.length ? data : [newRow];
          })
          .add(() => {
            this.deviceFormValue = isEditing
              ? new Devices(selected)
              : new Devices();
            this.modalService.open(content, {
              fullscreen: true,
            });
          });
      });
  }
  onRefresh() {
    this.loadDevices();
    console.log('data reloaded');
  }
  save(modal: NgbActiveModal) {
    const isEditing = !!this.deviceFormValue.Id;
    this.devicesService.createOrUpdate(this.deviceFormValue).subscribe({
      error: (err) => {
        console.error('Failed to call API:', err);
      },
      next: () => {
        this.deviceParams.forEach((dp) => {
          this.deviceParamService.createOrUpdate(dp).subscribe();
        });
        this.onRefresh();
      },
    });
    modal.close();
  }
  onDelete() {
    const selected = this.tblComp.getSelectedRow() as Devices;
    if (!selected) return;
    this.btnDelete.nativeElement.classList.add('disabled');

    this.toastHelper.showToast(
      'error',
      'Xác nhận xóa?',
      '✔',
      () => {
        this.devicesService.deleteById(selected.Id).subscribe({
          complete: () => {
            this.loadDevices();
            this.btnDelete.nativeElement.classList.remove('disabled');
          },
        });
      },
      '✖',
      () => {
        this.btnDelete.nativeElement.classList.remove('disabled');
      }
    );
  }
  onAddRow() {
    const newRow = new DeviceParam();
    newRow.DeviceId = this.deviceFormValue.Id;
    this.tblModalDetail
      .table!.addRow(newRow, true)
      .then(() => {
        this.tblModalDetail.table!.setPage(1);
      })
      .catch((err) => console.error(err));
  }
  onDeleteRow() {
    const selected = this.tblModalDetail.getSelectedRows();
    this.toastHelper.showToast(
      'error',
      'Xác nhận xóa?',
      '✔',
      () => {
        const deleteRequests = selected.map((s) =>
          this.deviceParamService.deleteById(s.Id)
        );
        forkJoin(deleteRequests).subscribe({
          next: (results) => {
            this.btnDeleteDetail.nativeElement.classList.remove('disabled');
            this.onRefreshDetail();
          },
          error: (err) => {
            console.error('Some request failed:', err);
          },
        });
      },
      '✖',
      () => {
        this.btnDeleteDetail.nativeElement.classList.remove('disabled');
      }
    );
  }
  onRefreshDetail() {
    this.deviceParamService
      .getByDeviceId(this.deviceFormValue.Id)
      .subscribe((data) => {
        this.deviceParams = data;
      });
  }
  onTableBuildt() {
    this.tblModalDetail.table!.setColumns(this.initCol());
  }
  openParamModal(deviceParam: DeviceParam) {
    this.deviceCommParamConfigService
      .getByDeviceParamId(deviceParam.Id)
      .subscribe((data) => {
        deviceParam.ConfigValues = this.deviceCommParamConfig = data;
        const modalRef = this.modalService.open(this.paramModal, {
          centered: true,
          windowClass: 'modal-md',
        });
        modalRef.result.then(
          () => {
            deviceParam.ConfigValues = this.deviceCommParamConfig;
          },
          () => {
            console.log('modal dismissed');
          }
        );
      });
  }
  copyValues() {
    sessionStorage.setItem(
      'device_param_values',
      JSON.stringify(this.deviceCommParamConfig)
    );
    this.btnCopy.nativeElement.classList.add('disabled');
    setTimeout(() => {
      this.btnCopy.nativeElement.classList.remove('disabled');
    }, 300);
  }
  pasteValues() {
    const dataJSON = sessionStorage.getItem('device_param_values');
    if (!dataJSON) return;
    const data = JSON.parse(dataJSON) as DeviceCommunicationParamConfig[];
    this.deviceCommParamConfig = this.deviceCommParamConfig.map((value, i) => {
      return { ...value, ConfigValue: data[i].ConfigValue };
    });
    this.btnPaste.nativeElement.classList.add('disabled');
    setTimeout(() => {
      this.btnPaste.nativeElement.classList.remove('disabled');
    }, 300);
  }
}
