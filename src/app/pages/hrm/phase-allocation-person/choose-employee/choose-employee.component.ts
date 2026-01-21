import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
  imports: [NgbModule],
  selector: 'app-choose-employee',
  templateUrl: './choose-employee.component.html',
  styleUrls: ['./choose-employee.component.css'],
})
export class ChooseEmployeeComponent implements OnInit {
  public activeModal = inject(NgbActiveModal);

  @Input() employeeList: any[] = [];
  @Input() selectedEmployeeIds: number[] = [];
  @Output() selected = new EventEmitter<any[]>();

  @ViewChild('employeeTable', { static: true })
  employeeTable!: ElementRef;

  table!: Tabulator;

  constructor(private employeeService: EmployeeService) { }

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.initTable();
  }
  initTable() {
    if (this.table) {
      this.table.setData(this.employeeList);
      return;
    }
    this.table = new Tabulator(this.employeeTable.nativeElement, {
      layout: 'fitColumns',
      height: '70vh',
      data: this.employeeList,
      selectableRows: true,
      groupBy: 'DepartmentName',
      groupStartOpen: true,
      groupHeader: (value: any, count: number) => {
        return `<span style="font-weight: bold; color: #1677ff;">${value || 'Chưa có phòng ban'}</span> <span style="color: #666;">(${count} nhân viên)</span>`;
      },
      rowHeader: {
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        width: 50,
      },
      columns: [
        {
          title: 'Mã NV',
          field: 'Code',
          width: 120,
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm mã...',
        },
        {
          title: 'Tên nhân viên',
          field: 'FullName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm tên...',
        },
        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          headerFilter: 'input',
          headerFilterPlaceholder: 'Tìm phòng ban...',
        },
      ],
    });
    // ✅ đợi table build xong
    // this.table.on('tableBuilt', () => {
    //   this.selectExistingEmployees();
    // });
  }
  // selectExistingEmployees() {

  //   if (!this.selectedEmployeeIds?.length) return;
  //   this.table.getRows().forEach(row => {
  //     const data = row.getData();
  //     if (this.selectedEmployeeIds.includes(data['ID'])) {
  //       row.select();
  //     }
  //   });
  // }
  confirm() {
    const selected = this.table.getSelectedData();
    this.activeModal.close(selected); // 🔥 trả data
  }

  cancel() {
    this.activeModal.dismiss();
  }
  normalize(text: string = '') {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onSearch(event: Event) {
    const value = this.normalize((event.target as HTMLInputElement).value);

    this.table.setFilter((data: any) => {
      return (
        this.normalize(data.Code).includes(value) ||
        this.normalize(data.FullName).includes(value) ||
        this.normalize(data.DepartmentName).includes(value)
      );
    });
  }
}
