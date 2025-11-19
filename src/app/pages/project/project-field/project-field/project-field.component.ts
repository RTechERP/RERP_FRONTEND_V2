import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
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
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import { ProjectService } from '../../project-service/project.service';
import { CommonModule } from '@angular/common';
import { ProjectSurveyDetailComponent } from '../../project-survey-detail/project-survey-detail.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AuthService } from '../../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ProjectFieldService } from './project-field-service/project-field.service';
import { ProjectFieldDetailComponent } from './project-field-detail/project-field-detail.component';
@Component({
  selector: 'app-project-field',
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
    NzUploadModule,HasPermissionDirective
  ],
  templateUrl: './project-field.component.html',
  styleUrl: './project-field.component.css'
})
export class ProjectFieldComponent implements OnInit, AfterViewInit {
  constructor(
    private projectFieldService: ProjectFieldService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private projectService: ProjectService
  ) {}
  ngOnInit(): void { 
    this.loadData();
  }
  ngAfterViewInit(): void {
    this.drawTbProjectField(this.tb_projectFieldContainer.nativeElement);
    this.loadData();
  }
  sizeSearch: string = '0';
  keyword: string = '';
  isLoadTable: boolean = false;
  dataTableProjectField: any[] = [];
  originalDataTableProjectField: any[] = []; // Lưu dữ liệu gốc để tìm kiếm
  @ViewChild('tb_projectField', { static: false })
  tb_projectFieldContainer!: ElementRef;
  tb_projectField: any;
  toggleSearchPanel(){
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetSearch(){
    this.keyword = '';
    this.dataTableProjectField = [...this.originalDataTableProjectField];
    this.tb_projectField.replaceData(this.dataTableProjectField);
  }
  loadData(){
    this.isLoadTable = true;
    this.projectFieldService.getProjectField().subscribe({
      next: (res: any) => {
        if(res.status === 1){
          console.log('datahaha', res.data);
          this.originalDataTableProjectField = res.data; // Lưu dữ liệu gốc
          this.dataTableProjectField = res.data;
          this.tb_projectField.replaceData(this.dataTableProjectField);
          this.isLoadTable = false;
        }else{
          this.notification.error('Lỗi', res.message);
          this.isLoadTable = false;
        }
      }
    });
  }
  drawTbProjectField(container: HTMLElement){
    this.tb_projectField = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTableProjectField,
      paginationMode: 'local',
      layout: 'fitColumns',
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
        { title: 'Mã lĩnh vực', field: 'Code', hozAlign: 'left' },
        { title: 'Tên lĩnh vực', field: 'Name', hozAlign: 'left' },
        { title: 'Ghi chú', field: 'Note', hozAlign: 'left', formatter: 'textarea' }
      ]
    });
  }
  exportExcel(){
   if(this.dataTableProjectField.length > 0){
    this.projectService.exportExcel(this.tb_projectField, this.dataTableProjectField, 'Lĩnh vực dự án', 'LINHVUCDUAN');
   }else{
    this.notification.info('Thông báo','Không có dữ liệu để xuất!');
   }
  }
  openProjectFieldDetail(isEditMode: boolean, projectField: any){
    const modalRef = this.modalService.open(ProjectFieldDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = isEditMode;
    modalRef.componentInstance.projectField = projectField;
    modalRef.result.then((result) => {
      if(result == true){
        this.loadData();
      }
    });
  }
  addProjectField(){
    // Lấy ID lớn nhất + 1 để gán vào STT
    let maxSTT = 0;
    if(this.dataTableProjectField.length > 0){
      const ids = this.dataTableProjectField
        .map((item: any) => item.STT)
        .filter((stt: any) => stt != null && stt !== undefined && !isNaN(stt));
      maxSTT = ids.length > 0 ? Math.max(...ids) : 0;
    }
    
    const newProjectField = {
      ID: 0,
      STT: maxSTT + 1,
      Code: '',
      Name: '',
      Note: ''
    };
    this.openProjectFieldDetail(false, newProjectField);
  }
  editProjectField(){
    const selectedProjectField = this.tb_projectField.getSelectedData();
    if(selectedProjectField.length > 0){
      this.openProjectFieldDetail(true, selectedProjectField[0]);
    }else{
      this.notification.error('Thông báo', 'Vui lòng chọn một lĩnh vực để sửa!');
      return;
    }
  }
  deleteProjectField(){
    const selectedProjectField = this.tb_projectField.getSelectedData();
    if(!selectedProjectField || selectedProjectField.length === 0){
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất một lĩnh vực để xóa!');
      return;
    }
    
    // Hiển thị dialog xác nhận
    const count = selectedProjectField.length;
    const message = count === 1 
      ? `Bạn có chắc chắn muốn xóa lĩnh vực <strong>"${selectedProjectField[0].Name}"</strong> không?`
      : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> lĩnh vực đã chọn không?`;
    
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Map tất cả các item đã chọn và gắn IsDeleted = true
        const projectFieldsToDelete = selectedProjectField.map((item: any) => ({
          ID: item.ID,
          STT: item.STT,
          Code: item.Code,
          Name: item.Name,
          Note: item.Note || '',
          IsDeleted: true
        }));
        this.projectFieldService.saveProjectField(projectFieldsToDelete).subscribe({
          next: (res: any) => {
            if(res.status === 1){
              this.notification.success('Thông báo', 'Đã xóa thành công');
              this.loadData();
            }else{
              this.notification.error('Thông báo', res.message);
            }
          },
          error: (err: any) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
            console.error('Lỗi khi xóa:', err);
          }
        });
      }
    });
  }
  // Hàm chuẩn hóa tiếng Việt: chuyển về không dấu và lowercase
  private normalizeVietnamese(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
  }

  onsearchData() {
    this.keyword = this.keyword.trim();
  
    // Nếu keyword rỗng, hiển thị lại toàn bộ dữ liệu gốc
    if (!this.keyword || this.keyword === '') {
      this.dataTableProjectField = [...this.originalDataTableProjectField];
      this.tb_projectField.replaceData(this.dataTableProjectField);
      return;
    }
  
    // Chuẩn hóa keyword để tìm kiếm (ví dụ: "Má" → "ma", "Máy" → "may")
    const keywordNorm = this.normalizeVietnamese(this.keyword);
  
    // Filter từ dữ liệu gốc
    this.dataTableProjectField = this.originalDataTableProjectField.filter((item: any) => {
      const code = this.normalizeVietnamese(item.Code || '');
      const name = this.normalizeVietnamese(item.Name || '');
      const note = this.normalizeVietnamese(item.Note || '');
  
      return code.includes(keywordNorm) ||
             name.includes(keywordNorm) ||
             note.includes(keywordNorm);
    });
  
    this.tb_projectField.replaceData(this.dataTableProjectField);
  }
}
