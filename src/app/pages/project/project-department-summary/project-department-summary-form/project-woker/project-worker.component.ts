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
import { ProjectWorkerSyntheticComponent } from '../project-worker-synthetic/project-worker-synthetic.component';
import { ProjectWorkerService } from './project-worker-service/project-worker.service';
import { ProjectSolutionVersionDetailComponent } from '../project-solution-version-detail/project-solution-version-detail.component';
import { ProjectSolutionDetailComponent } from '../project-solution-detail/project-solution-detail.component';
@Component({
  selector: 'app-project-worker',
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
  templateUrl: './project-worker.component.html',
  styleUrl: './project-worker.component.css'
})
export class ProjectWorkerComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  constructor(
    private projectService: ProjectService,
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    public activeModal: NgbActiveModal,
    private ngbModal: NgbModal
  ) { }
  sizeSearch: string = '22%';
  @ViewChild('tb_solution', { static: false })
  tb_solutionContainer!: ElementRef;
  @ViewChild('tb_solutionVersion', { static: false })
  tb_solutionVersionContainer!: ElementRef;
  @ViewChild('tb_POVersion', { static: false })
  tb_POVersionContainer!: ElementRef;
  @ViewChild('tb_projectWorker', { static: false })
  tb_projectWorkerContainer!: ElementRef;
  tb_solution: any;
  tb_solutionVersion: any;
  tb_POVersion: any;
  tb_projectWorker: any;
  dataProjectWorker: any[] = [];
  dataSolution: any[] = [];
  dataSolutionVersion: any[] = [];
  dataPOVersion: any[] = [];
  dataProject:any[] = [];
  projectworkertypeID: number = 0;
  searchKeyword: string = '';
  dataProjectWorkerType: any[] = [];
  projectSolutionId: number = 0;

  //truyền qua modal
  selectionCode: string = '';
  projectTypeID: number = 0;
  projectTypeName: string = '';
  projectCode: string = '';

  ngOnInit(): void {
    this.loadDataSolution();
    this.loadDataSolutionVersion();
    this.loadDataPOVersion();
  }
  ngAfterViewInit(): void {
    this.drawTbSolution();
    this.drawTbSolutionVersion();
    this.drawTbPOVersion();
    this.drawTbProjectWorker();
  }
  loadDataSolution(): void {
    this.projectWorkerService.getSolution(this.projectId).subscribe({
      next: (response:any) => {
        if (response.status === 1) {
          console.log("dataSolution", response.data);
          this.dataSolution = response.data;
          this.projectSolutionId = this.dataSolution[0].ID;
          this.tb_solution.setData(this.dataSolution);
          this.loadDataSolutionVersion();
          this.loadDataPOVersion();
        } else {
          this.notification.error('Lỗi', response.message);
        }
      }
    });
  } 
  loadDataSolutionVersion(): void {
    this.projectWorkerService.getSolutionVersion(this.projectSolutionId).subscribe({
      next: (response:any) => {
        if (response.status === 1) {
          console.log("dataSolutionVersion", response.data);
          this.dataSolutionVersion = response.data;
          this.tb_solutionVersion.setData(this.dataSolutionVersion);
        } else {
          this.notification.error('Lỗi', response.message);
        }
      }
    });
  }
  loadDataPOVersion(): void {
    this.projectWorkerService.getPOVersion(this.projectSolutionId).subscribe({
      next: (response:any) => {
        if (response.status === 1) {
        console.log("dataPOVersion", response.data);
        this.dataPOVersion = response.data;
          this.tb_POVersion.setData(this.dataPOVersion);  
        } else {
          this.notification.error('Lỗi', response.message);
        }
      }
    });
  } 
  //#region Open Modal chi tiết gaiir pháp
  openProjectSolutionVersionDetail(): void {
    const modalRef = this.ngbModal.open(ProjectSolutionVersionDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.projectSolutionId = this.projectSolutionId;
    modalRef.componentInstance.Code = this.selectionCode;
    modalRef.componentInstance.ProjectTypeID = this.projectTypeID;
    modalRef.componentInstance.ProjectTypeName = this.projectTypeName;
    modalRef.componentInstance.ProjectID = this.projectId;
    modalRef.componentInstance.ProjectCode = this.projectCode;
    modalRef.result.then((result: any) => {
      if (result.success) {
        this.loadDataSolutionVersion();
        this.loadDataPOVersion();
      }
    });
  }
  drawTbSolution(): void {
    this.tb_solution = new Tabulator(this.tb_solutionContainer.nativeElement, {
      data: this.dataSolution,
      layout: 'fitDataStretch',
      groupBy: 'CodeRequest',
      groupStartOpen: true,
      groupHeader: (value: any) => `Mã yêu cầu: ${value}`,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'rownum', // Tự động đánh số thứ tự
        },
        {
          title: 'PO',
          field: 'IsApprovedPO',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check text-success"></i>'
              : '<i class="fa fa-times text-danger"></i>';
          },
       
        },
        {
          title: 'Duyệt báo giá',
          field: 'IsApprovedPrice',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check text-success"></i>'
              : '<i class="fa fa-times text-danger"></i>';
          },
  
        },
        {
          title: 'Duyệt PO',
          field: 'IsApprovedPO',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check text-success"></i>'
              : '<i class="fa fa-times text-danger"></i>';
          },
        
        },
        {
          title: 'Ngày lên GP',
          field: 'DateSolution',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const date = cell.getValue();
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          },
        
        },
        {
          title: 'Deadline báo giá',
          field: 'PriceReportDeadline',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const date = cell.getValue();
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          },
       
        },
        {
          title: 'Mã giải pháp',
          field: 'CodeSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
     
        },
        {
          title: 'Nội dung',
          field: 'ContentSolution',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'textarea',
         
          formatter: 'textarea', // Hiển thị multiline
        },
      ], 
    });
    this.tb_solution.on('rowClick', (e: any, row: any) => {
      console.log("row", row);
      const data = row.getData();
      this.projectSolutionId = data.ID;
      this.loadDataSolutionVersion();
      this.loadDataPOVersion();
    });
  }
  drawTbSolutionVersion(): void {
    this.tb_solutionVersion = new Tabulator(this.tb_solutionVersionContainer.nativeElement, {
      data: this.dataSolutionVersion,
      layout: 'fitDataStretch',
      pagination: false,
      groupBy: 'ProjectTypeName',
      groupStartOpen: true,
      groupHeader: (value: any) => `Danh mục: ${value}`,
      columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'rownum',
        },
        {
          title: 'Sử dụng',
          field: 'IsActive',
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check text-success" title="Đang sử dụng"></i>'
              : '<i class="fa fa-times text-secondary" title="Không sử dụng"></i>';
          },
        },
        {
          title: 'Mã',
          field: 'Code',
          hozAlign: 'center',
          headerHozAlign: 'center'
        },
        {
          title: 'Mô tả',
          field: 'DescriptionVersion',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'textarea',
          formatter: 'textarea',
          variableHeight: true,
        },
        {
          title: 'Người duyệt',
          field: 'UpdatedBy',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
      ],
    });
    this.tb_solutionVersion.on('rowClick', (e: any, row: any) => {
      console.log("row", row);
      const data = row.getData();
      this.selectionCode = data.Code;
      this.projectTypeID = data.ProjectTypeID;
      this.projectTypeName = data.ProjectTypeName;
      this.projectCode = data.ProjectCode;
    });
  }
  drawTbPOVersion(): void {
    this.tb_POVersion = new Tabulator(this.tb_POVersionContainer.nativeElement, {
      data: this.dataPOVersion,
      layout: 'fitDataStretch',
      pagination: false,
      height: '400px',
      groupBy: 'ProjectTypeName',
      groupStartOpen: true,
      groupHeader: (value: any) => `Danh mục: ${value}`,
      columns: [
        {
          title: 'STT',
          width: 60,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'rownum',
        },
        {
          title: 'Sử dụng',
          field: 'IsActive',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 90,
          formatter: (cell: any) => {
            const value = cell.getValue();
            return value === true
              ? '<i class="fa fa-check text-success" title="Đang sử dụng"></i>'
              : '<i class="fa fa-times text-secondary" title="Không sử dụng"></i>';
          },
        },
        {
          title: 'Mã',
          field: 'Code',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
        },
        {
          title: 'Mô tả',
          field: 'DescriptionVersion',
          hozAlign: 'left',
          headerHozAlign: 'center',
          editor: 'textarea',
          formatter: 'textarea',
          variableHeight: true,
          width: 300,
        },
        {
          title: 'Người duyệt',
          field: 'UpdatedBy',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 110,
        },
      ],
      // Tùy chọn: tô màu dòng đang active
      rowFormatter: (row: any) => {
        const data = row.getData();
        if (data.IsActive) {
          row.getElement().style.backgroundColor = '#e6f7e6';
          row.getElement().style.fontWeight = 'bold';
        }
      },
    });
    this.tb_POVersion.on('rowClick', (e: any, row: any) => {
      console.log("row", row);
      const data = row.getData();
      this.selectionCode = data.Code;
      this.projectTypeID = data.ProjectTypeID;
      this.projectTypeName = data.ProjectTypeName;
      this.projectCode = data.ProjectCode;
    });
  }
  drawTbProjectWorker(): void {
    this.tb_projectWorker = new Tabulator(this.tb_projectWorkerContainer.nativeElement, {
      data: this.dataSolutionVersion,
      layout: 'fitDataStretch',
      columns:[
        {
          title: 'TT',
          width: 50,
          hozAlign: 'center',
          headerHozAlign: 'center',
          
        },
        {
          title: 'Nội dung công việc',
          field: 'solutionName',
        
          editor: 'textarea',
        },
        {
          title: 'Số người',
          field: 'solutionName',
        
    
        },
        {
          title: 'Số ngày',
          field: 'solutionName',
        
        },
        {
          title: 'Tổng nhân công',
          field: 'solutionName',
        
       
        },
        {
          title: 'Đơn giá',
          field: 'solutionName',
        
      
        },
        {
          title: 'Thành tiền',
          field: 'solutionName',
        
     
        },
      ]
    });
  }
}