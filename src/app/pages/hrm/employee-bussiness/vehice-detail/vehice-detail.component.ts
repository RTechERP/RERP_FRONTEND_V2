import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';

@Component({
  selector: 'app-vehice-detail',
  imports: [FormsModule, NzSelectModule, NzGridModule, NzButtonModule],
  templateUrl: './vehice-detail.component.html',
  styleUrl: './vehice-detail.component.css'
})

export class VehiceDetailComponent implements OnInit, AfterViewInit {
  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private employeeBussinessService: EmployeeBussinessService,
  ) { }

  @ViewChild('tb_VehiceDetail', { static: false })
  tb_VehiceDetailContainer!: ElementRef;
  tb_VehiceDetail: any;
  @Input() employeeBussinessId: any = 0;
  vehiceList: any[] = [];

  vehiceDetail: any[] = [
    {
      STT: 1,
      vehiceType: 0,
      vehiceName: '',
      cost: 0,
      Note: '',
      ID: 0
    }
  ];
  ngOnInit(): void {
    this.getEmployeeVehicleBussiness();
  }

  ngAfterViewInit(): void {
    this.drawTbVehiceDetail(this.tb_VehiceDetailContainer.nativeElement);
  }

  getEmployeeVehicleBussiness() {
    this.employeeBussinessService.getEmployeeVehicleBussiness().subscribe({
      next: (res) => {
        if (res.data && res.data.length) {
          debugger
          this.vehiceList = [
            { ID: 0, vehiceType: 'Phương tiện khác', cost: 0 },
            ...res.data
              .filter((item: any) => !item.IsDeleted)
              .map((item: any) => ({
                ID: item.ID,
                vehiceType: `${item.VehicleName}`,
                cost: item.Cost
              }))
          ];

          if (this.tb_VehiceDetail) {
            const values = this.vehiceList.reduce((acc: any, item: any) => {
              acc[item.ID] = item.vehiceType;
              return acc;
            }, {});
            const col = this.tb_VehiceDetail.getColumn('vehiceType');
            col.updateDefinition({ editorParams: { values } });
          }
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Lỗi tải danh sách phương tiện');
      }
    });
  }



  drawTbVehiceDetail(container: HTMLElement) {
    this.tb_VehiceDetail = new Tabulator(container, {
      data: this.vehiceDetail,
      height: '60vh',
      layout: 'fitDataStretch',
      columns: [
        {
          title: '+',
          field: 'addRow',
          headerSort: false,
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          titleFormatter: () =>
            `<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
          <i class="fas fa-plus text-success cursor-pointer" title="Thêm dòng"></i></div>`,
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          formatter: (cell: any) => {
            debugger
            const data = cell.getRow().getData();
            let id = data['ID'];
            return (id <= 0 || id == null) && data.STT != 1
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },

          cellClick: (e: any, cell: any) => {
            const rowData = cell.getRow().getData();
            if (rowData.ID > 0 || rowData.STT == 1) {
              return; // Không cho xoá
            }
            cell.getRow().delete();
            this.resetSTT();
          }
        } as any,
        { title: 'STT', field: 'STT', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 80, headerSort: false },
        {
          title: 'Loại phương tiện',
          field: 'vehiceType', // lưu cost
          hozAlign: 'center',
          width: 400,
          editor: 'list',
          headerSort:false,
          editorParams: {
            values: this.vehiceList.reduce((acc: any, item: any) => {
              acc[item.ID] = item.vehiceType; // key = ID
              return acc;
            }, {})
          },
          formatter: (cell: any) => {
            const value = parseInt(cell.getValue()); // value = cost
            const type = this.vehiceList.find(emp => emp.ID === value);
            return type ? type.vehiceType : '';
          },
          cellEdited: (cell: any) => {
            debugger
            const value = parseInt(cell.getValue()); // value = ID đã chọn
            const row = cell.getRow();
            const type = this.vehiceList.find(emp => emp.ID === value);
            if (type) {
              row.update({ cost: type.cost });
              // fill cả cột Chi phí và Tên phương tiện nếu muốn
            }
          }
        },
        { title: 'Tên phương tiện', field: 'vehiceName', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false },
        {
          title: 'Chi phí',
          field: 'cost',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 150,
          headerSort: false,    // vẫn cho phép edit
          formatter: "money",      // định dạng tiền
          formatterParams: {
            decimal: ",",         // dấu thập phân
            thousand: ".",        // dấu ngăn cách nghìn
            precision: 0,         // số chữ số sau dấu thập phân
            symbol: ""            // nếu muốn thêm ký hiệu, ví dụ "₫"
          },
          bottomCalc:'sum'
        },
        { title: 'Ghi chú', field: 'Note', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 120, headerSort: false },
      ],
    });
  }

  addRow() {
    if (this.tb_VehiceDetail) {
      const data = this.tb_VehiceDetail.getData();
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tb_VehiceDetail.addRow({
        STT: maxSTT + 1,
        vehiceType: 0,
        vehiceName: "",
        cost: "",
        Note: "",
        ID: 0
      });
    }
  }

  resetSTT() {
    const rows = this.tb_VehiceDetail.getRows();
    rows.forEach((row: any, index: any) => {
      row.update({ STT: index + 1 });
    });
  }

  saveVehiceType(){

  }
}

