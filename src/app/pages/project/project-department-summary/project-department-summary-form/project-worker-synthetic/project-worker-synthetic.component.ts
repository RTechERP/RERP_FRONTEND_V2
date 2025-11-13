import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, Input } from '@angular/core';
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
import { NzFormModule } from 'ng-zorro-antd/form';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
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
import { Router } from '@angular/router';
import { ProjectService } from '../../../project-service/project.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-project-worker-synthetic',
  templateUrl: './project-worker-synthetic.component.html',
  styleUrls: ['./project-worker-synthetic.component.css'],
  standalone: true,
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
    NzFormModule,
  ],
})
export class ProjectWorkerSyntheticComponent implements OnInit {
  @Input() projectID: number = 0;
  sizeSearch: string = '22%';

  constructor(
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal
    

  ) { }
  
  @ViewChild('tb_projectWorkerSynthetic', { static: false })
  tb_projectWorkerSyntheticContainer!: ElementRef;
  tb_projectWorkerSynthetic: any;
  dataProjectWorkerSynthetic: any[] = [];
  dataProject:any[] = [];
  projectworkertypeID: number = 0;
  searchKeyword: string = '';
  dataProjectWorkerType: any[] = [];
  ngOnInit() {
    this.getProjectWorkerSynthetic();
    this.getProject();
    this.getProjectWorkerType();
  }

  ngAfterViewInit() {
    // Ensure the table is drawn after the view is initialized
    this.drawTbProjectWorkerSynthetic(this.tb_projectWorkerSyntheticContainer.nativeElement);
    this.getProjectWorkerSynthetic();
  }
  drawTbProjectWorkerSynthetic(container: HTMLElement) {
    this.tb_projectWorkerSynthetic = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      height: '100%',
      pagination:false,
      layout: 'fitColumns',
      locale: 'vi',
      index: 'ID',
      rowHeader:false,
      paginationMode:"local",
      selectableRows: true,
      columns: [
        {
          title: 'STT',
          formatter: 'rownum',
          headerHozAlign: 'center',
          width: 60,
          headerSort: false,
          frozen: true,
        },
        {
          title: 'Nội dung',
          field: 'WorkContent',
          headerHozAlign: 'center',
          width: 120,
        },
        {
          title: 'Tổng số người',
          field: 'AmountPeople',
          headerHozAlign: 'center',

        },
        {
          title: 'Tổng số ngày',
          field: 'NumberOfDay',
          headerHozAlign: 'center',

        },
        {
          title: 'Tổng nhân công',
          field: 'FullNWorkForceame',
          headerHozAlign: 'center',

        },
        {
          title: 'Tổng đơn giá',
          field: 'Price',
          headerHozAlign: 'center',

        },
        {
          title: 'Tổng thành tiền',
          field: 'TotalPrice',
          headerHozAlign: 'center',
        },
      ],

    });
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  setDefaultSearch() {
    this.projectID = 0;
    this.projectworkertypeID = 0;
    this.searchKeyword = '';
    this.getProjectWorkerSynthetic();
  }
  getProject() {
    this.projectService.getProjectCombobox().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProject = response.data;
          console.log('dataProject', this.dataProject);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách dự án!');
      },
    });
  }
  // Lấy danh sách tổng hợp nhân công 
  getProjectWorkerSynthetic() {
    this.projectService.getProjectWorkerSynthetic(this.projectID, this.projectworkertypeID, this.searchKeyword).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          console.log("giá trị:", response.data);
          this.dataProjectWorkerSynthetic = response.data;
          this.tb_projectWorkerSynthetic.setData(this.dataProjectWorkerSynthetic);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Không thể tải dữ liệu tổng hợp nhân công!');
      },
    });
  }
  getProjectWorkerType() {
    this.projectService.getProjectWorkerType().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.dataProjectWorkerType = response.data;
          console.log('dataProjectWorkerType', this.dataProjectWorkerType);
        }
      },
      error: (error) => {
          this.notification.error('Lỗi', 'Không thể tải dữ liệu danh sách loại nhân công!');
        },
    });
  }
  exportExcel(){
    const table = this.tb_projectWorkerSynthetic;
    if (!table) return;
    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }
    this.projectService.exportExcel(table, data, 'Tổng hợp nhân công', 'Tổng hợp nhân công');
  }
  onClose() {
    this.activeModal.close(true); // đóng modal và trả dữ liệu về
  }
}
