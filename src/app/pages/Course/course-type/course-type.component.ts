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
import { ProjectService } from '../../project/project-service/project.service';
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AuthService } from '../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { CourseTypeService } from './course-type-sevice/course-type.service';
import { CourseTypeDetailComponent } from './course-type-detail/course-type-detail.component';

@Component({
  selector: 'app-course-type',
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
    NzUploadModule,
    HasPermissionDirective
  ],
  templateUrl: './course-type.component.html',
  styleUrl: './course-type.component.css'
})
export class CourseTypeComponent implements OnInit, AfterViewInit {
  constructor(
    private courseTypeService: CourseTypeService,
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
    this.drawTbCourseType(this.tb_courseTypeContainer.nativeElement);
    this.loadData();
  }
  sizeSearch: string = '0';
  keyword: string = '';
  isLoadTable: boolean = false;
  dataTableCourseType: any[] = [];
  originalDataTableCourseType: any[] = []; // Lưu dữ liệu gốc để tìm kiếm
  @ViewChild('tb_courseType', { static: false })
  tb_courseTypeContainer!: ElementRef;
  tb_courseType: any;
  toggleSearchPanel(){
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetSearch(){
    this.keyword = '';
    this.dataTableCourseType = [...this.originalDataTableCourseType];
    this.tb_courseType.replaceData(this.dataTableCourseType);
  }
  loadData(){
    this.isLoadTable = true;
    this.courseTypeService.getAllCourseType().subscribe({
      next: (res: any) => {
        if(res.status === 1){
          console.log('data course type', res.data);
          this.originalDataTableCourseType = res.data; // Lưu dữ liệu gốc
          this.dataTableCourseType = res.data;
          this.tb_courseType.replaceData(this.dataTableCourseType);
          this.isLoadTable = false;
        }else{
          this.notification.error('Lỗi', res.message);
          this.isLoadTable = false;
        }
      }
    });
  }
  drawTbCourseType(container: HTMLElement){
    this.tb_courseType = new Tabulator(container, {
      ...DEFAULT_TABLE_CONFIG,
      data: this.dataTableCourseType,
      paginationMode: 'local',
      layout: 'fitColumns',
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
        { title: 'Mã loại khóa học', field: 'CourseTypeCode', hozAlign: 'left' },
        { title: 'Tên loại khóa học', field: 'CourseTypeName', hozAlign: 'left' }
      ]
    });
  }
  exportExcel(){
   if(this.dataTableCourseType.length > 0){
    this.projectService.exportExcel(this.tb_courseType, this.dataTableCourseType, 'Loại khóa học', 'LOAIKHOAHOC');
   }else{
    this.notification.info('Thông báo','Không có dữ liệu để xuất!');
   }
  }
  openCourseTypeDetail(isEditMode: boolean, courseType: any){
    const modalRef = this.modalService.open(CourseTypeDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.isEditMode = isEditMode;
    modalRef.componentInstance.courseType = courseType;
    modalRef.result.then((result) => {
      if(result == true){
        this.loadData();
      }
    });
  }
  addCourseType(){
    // Lấy ID lớn nhất + 1 để gán vào STT
    let maxSTT = 0;
    if(this.dataTableCourseType.length > 0){
      const ids = this.dataTableCourseType
        .map((item: any) => item.STT)
        .filter((stt: any) => stt != null && stt !== undefined && !isNaN(stt));
      maxSTT = ids.length > 0 ? Math.max(...ids) : 0;
    }
    
    const newCourseType = {
      ID: 0,
      STT: maxSTT + 1,
      CourseTypeCode: '',
      CourseTypeName: '',
      IsLearnInTurn: false
    };
    this.openCourseTypeDetail(false, newCourseType);
  }
  editCourseType(){
    const selectedCourseType = this.tb_courseType.getSelectedData();
    if(selectedCourseType.length > 0){
      this.openCourseTypeDetail(true, selectedCourseType[0]);
    }else{
      this.notification.error('Thông báo', 'Vui lòng chọn một loại khóa học để sửa!');
      return;
    }
  }
  deleteCourseType(){
    const selectedCourseType = this.tb_courseType.getSelectedData();
    if(!selectedCourseType || selectedCourseType.length === 0){
      this.notification.error('Thông báo', 'Vui lòng chọn ít nhất một loại khóa học để xóa!');
      return;
    }
    
    // Hiển thị dialog xác nhận
    const count = selectedCourseType.length;
    const message = count === 1 
      ? `Bạn có chắc chắn muốn xóa loại khóa học <strong>"${selectedCourseType[0].CourseTypeName}"</strong> không?`
      : `Bạn có chắc chắn muốn xóa <strong>${count}</strong> loại khóa học đã chọn không?`;
    
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Map tất cả các item đã chọn và gắn IsDeleted = true
        const courseTypesToDelete = selectedCourseType.map((item: any) => ({
          ID: item.ID,
          STT: item.STT,
          CourseTypeCode: item.CourseTypeCode,
          CourseTypeName: item.CourseTypeName,
          IsLearnInTurn: item.IsLearnInTurn || false,
          IsDeleted: true
        }));
        this.courseTypeService.saveCourseType(courseTypesToDelete).subscribe({
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
      this.dataTableCourseType = [...this.originalDataTableCourseType];
      this.tb_courseType.replaceData(this.dataTableCourseType);
      return;
    }
  
    // Chuẩn hóa keyword để tìm kiếm (ví dụ: "Má" → "ma", "Máy" → "may")
    const keywordNorm = this.normalizeVietnamese(this.keyword);
  
    // Filter từ dữ liệu gốc
    this.dataTableCourseType = this.originalDataTableCourseType.filter((item: any) => {
      const code = this.normalizeVietnamese(item.CourseTypeCode || '');
      const name = this.normalizeVietnamese(item.CourseTypeName || '');
  
      return code.includes(keywordNorm) ||
             name.includes(keywordNorm);
    });
  
    this.tb_courseType.replaceData(this.dataTableCourseType);
  }
}
