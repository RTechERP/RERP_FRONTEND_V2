import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {
  TabulatorFull as Tabulator,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CourseManagementService } from './course-management-service/course-management.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { CourseCatalogDetailComponent } from '../course_management-form/course-catalog-detail/course-catalog-detail.component';
import { CourseDetailComponent } from '../course_management-form/course-detail/course-detail.component';

interface Category {
  ID: number;
  Code: string;
  Name: string;
  STT?: number;
}

interface Lesson {
  ID: number;
  STT: number;
  Code: string;
  Name: string;
  CourseID: number;
}

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzLayoutModule,
    NzSplitterModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    HasPermissionDirective
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css',
})
export class CourseManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('CategoryTable') categoryTableRef!: ElementRef;
  @ViewChild('CourseTable') courseTableRef!: ElementRef;
  @ViewChild('LessonTable') lessonTableRef!: ElementRef;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';

  categoryTable: Tabulator | null = null;
  categoryData: Category[] = [];
  categoryID: number = 0;

  courseTable: Tabulator | null = null;
  courseData: any[] = [];
  courseID: number = 0;

  lessonTable: Tabulator | null = null;
  lessonData: Lesson[] = [];
  lessonID: number = 0;

  searchParams = {
    categoryID: 0,
  };

  keyword: string = '';
  dataDepartment: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private breakpointObserver: BreakpointObserver,
    private message: NzMessageService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });
  }

  ngAfterViewInit(): void {
    this.draw_categoryTable();
    this.draw_courseTable();
    this.draw_lessonTable();
    this.getDataCategory();
    this.getDataDepartment();
  }

  getDataCategory() {
    this.courseService.getDataCategory().subscribe((response: any) => {
      if (response && response.status === 1) {
        this.categoryData = response.data || [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
          setTimeout(() => {
            this.categoryTable?.redraw(true);
          }, 100);
          if (this.categoryData.length > 0) {
            this.searchParams.categoryID = this.categoryData[0].ID;
            this.getCourse();
          }
        }
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách danh mục!');
        this.categoryData = [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
        }
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách danh mục!');
      console.error('Error loading categories:', error);
      this.categoryData = [];
      if (this.categoryTable) {
        this.categoryTable.replaceData(this.categoryData);
      }
    });
  }

  getDataDepartment() {
    this.courseService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || [];
    });
  }

  getCourse() {
    if (this.searchParams.categoryID === 0) {
      this.courseData = [];
      if (this.courseTable) {
        this.courseTable.setData(this.courseData);
      }
      return;
    }

    this.courseService.getCourse(this.searchParams.categoryID).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.courseData = response.data || [];
        if (this.courseTable) {
          this.courseTable.setData(this.courseData);
        }
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách khóa học!');
        this.courseData = [];
        if (this.courseTable) {
          this.courseTable.setData(this.courseData);
        }
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách khóa học!');
      console.error('Error loading courses:', error);
      this.courseData = [];
      if (this.courseTable) {
        this.courseTable.setData(this.courseData);
      }
    });
  }

  getLessonByCourseID(id: number) {
    if (id === 0) {
      this.lessonData = [];
      if (this.lessonTable) {
        this.lessonTable.setData(this.lessonData);
      }
      return;
    }

    this.courseService.getLessonByCourseID(id).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.lessonData = response.data || [];
        if (this.lessonTable) {
          this.lessonTable.setData(this.lessonData);
        }
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách bài học!');
        this.lessonData = [];
        if (this.lessonTable) {
          this.lessonTable.setData(this.lessonData);
        }
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách bài học!');
      console.error('Error loading lessons:', error);
      this.lessonData = [];
      if (this.lessonTable) {
        this.lessonTable.setData(this.lessonData);
      }
    });
  }

  onSearchChange() {
    if (this.courseTable) {
      if (this.keyword && this.keyword.trim() !== '') {
        this.courseTable.setFilter([
          [
            { field: 'NameCourse', type: 'like', value: this.keyword },
            { field: 'Code', type: 'like', value: this.keyword },
            { field: 'Instructor', type: 'like', value: this.keyword },
            { field: 'NameCourseCatalog', type: 'like', value: this.keyword },
            { field: 'DepartmentName', type: 'like', value: this.keyword },
          ],
        ]);
      } else {
        this.getCourse();
      }
    }
  }

  onAddCategory() {
    // Lấy STT lớn nhất từ bảng danh mục
    const maxSTT = this.categoryData.length > 0 
      ? Math.max(...this.categoryData.map(c => c.STT || 0))
      : 0;

    const modalRef = this.modalService.open(CourseCatalogDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newCourseCatalog = {
      TypeID: 0,
      DepartmentID: 0,
      Code: '',
      STT: 0,
      Name: '',
      TeamIDs: []
    };
    modalRef.componentInstance.catalogID = this.categoryID;
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.maxSTT = maxSTT;
    modalRef.componentInstance.dataDepartment = this.dataDepartment;

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataCategory();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      }
    );
  }

  onEditCategory(categoryData?: any) {
    const dataToEdit = categoryData || this.categoryTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một danh mục để sửa!');
      return;
    }

    const modalRef = this.modalService.open(CourseCatalogDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newCourseCatalog = {
      TypeID: 0,
      DepartmentID: 0,
      Code: '',
      STT: 0,
      Name: '',
      TeamIDs: []
    };
    modalRef.componentInstance.catalogID = this.categoryID;
    modalRef.componentInstance.dataInput = dataToEdit;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.maxSTT = 0; // Không cần STT khi edit
    modalRef.componentInstance.dataDepartment = this.dataDepartment;

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataCategory();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      }
    );
  }

  onDeleteCategory() {
    const dataSelect: Category[] = this.categoryTable!.getSelectedData();
    if (dataSelect.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một danh mục để xóa!');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].Name} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // TODO: Implement delete API
        // this.courseService.deleteCategory(dataSelect[0].ID).subscribe({
        //   next: (res) => {
        //     if (res.status === 1) {
        //       this.notification.success('Thông báo', 'Đã xóa thành công!');
        //       this.getDataCategory();
        //     }
        //   }
        // });
        this.notification.info('Thông báo', 'Chức năng xóa danh mục đang được phát triển');
      },
    });
  }

  onAddCourse() {
    const modalRef = this.modalService.open(CourseDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newCourse = {
      CourseID: 0,
      CourseName: '',
      StudyDate: null,
      PersonInCharge: '',
      Creator: '',
    };

  }

  onEditCourse(courseData?: any) {
    // TODO: Implement edit course modal
    const dataToEdit = courseData || this.courseTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một khóa học để sửa!');
      return;
    }
    this.notification.info('Thông báo', 'Chức năng sửa khóa học đang được phát triển');
  }

  onDeleteCourse() {
    const dataSelect: any[] = this.courseTable!.getSelectedData();
    if (dataSelect.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một khóa học để xóa!');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].NameCourse} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // TODO: Implement delete API
        this.notification.info('Thông báo', 'Chức năng xóa khóa học đang được phát triển');
      },
    });
  }

  onAddLesson() {
    // TODO: Implement add lesson modal
    this.notification.info('Thông báo', 'Chức năng thêm bài học đang được phát triển');
  }

  onEditLesson(lessonData?: any) {
    // TODO: Implement edit lesson modal
    const dataToEdit = lessonData || this.lessonTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một bài học để sửa!');
      return;
    }
    this.notification.info('Thông báo', 'Chức năng sửa bài học đang được phát triển');
  }

  onDeleteLesson() {
    const dataSelect: Lesson[] = this.lessonTable!.getSelectedData();
    if (dataSelect.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một bài học để xóa!');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].Name} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // TODO: Implement delete API
        this.notification.info('Thông báo', 'Chức năng xóa bài học đang được phát triển');
      },
    });
  }

  draw_categoryTable(): void {
    if (this.categoryTable) {
      this.categoryTable.setData(this.categoryData);
    } else {
      this.categoryTable = new Tabulator(this.categoryTableRef.nativeElement, {
        data: this.categoryData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        selectableRows: 1,
        paginationMode: 'local',
        groupBy: [
          (data: any) => data.CatalogTypeText || 'Chưa phân loại',
          (data: any) => data.NameDepartment || 'Chưa có phòng ban'
        ],
        groupStartOpen: [true, true],
        groupHeader: [
          (value: any, count: number, data: any) => {
            return `<strong>Loại: ${value}</strong> (${count} danh mục)`;
          },
          (value: any, count: number, data: any) => {
            return `<strong>Phòng ban: ${value}</strong>`;
          }
        ],
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            width: 50,
            bottomCalc: 'count',
          },
          {
            title: 'Mã',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'Code',
          },
          {
            title: 'Tên',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'center',
            resizable: false,
          },
        ],
      });

      this.categoryTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.searchParams.categoryID = rowData['ID'];
        this.getCourse();
      });

      this.categoryTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.onEditCategory(rowData);
      });

      this.categoryTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.categoryID = rowData['ID'];
      });

      this.categoryTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.categoryTable!.getSelectedRows();
        this.categoryID = 0;
        // Xóa dữ liệu bảng khóa học
        this.courseData = [];
        if (this.courseTable) {
          this.courseTable.setData(this.courseData);
        }
        // Xóa dữ liệu bảng bài học
        this.lessonData = [];
        if (this.lessonTable) {
          this.lessonTable.setData(this.lessonData);
        }
        // Reset courseID
        this.courseID = 0;
      });
    }
  }

  draw_courseTable(): void {
    if (this.courseTable) {
      this.courseTable.setData(this.courseData);
    } else {
      this.courseTable = new Tabulator(this.courseTableRef.nativeElement, {
        data: this.courseData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        selectableRows: 1,
        paginationMode: 'local',
        groupBy: 'CourseTypeName',
        groupHeader: function (value, count, data, group) {
          return (
            `Loại: ${value ||""}`
          );
        },
        columns: [
        {
          title: 'STT',
          field: 'STT',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 30,
        },
        {
          title: 'Mã khóa học',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
          headerSort: false,
        },
          {
            title: 'Tên khóa học',
            field: 'NameCourse',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerSort: false,
          },
          {
            title: 'Thời gian học (ngày)',
            field: 'StudyDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value != null && value > 0) {
                return `${parseFloat(value).toFixed(2)}`;
              }
              return '0.00';
            },
            headerSort: false,
          },
          {
            title: 'Người phụ trách training',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerSort: false,
          },
          {
            title: 'Người tạo',
            field: 'Instructor',
            hozAlign: 'left',
            width: 150,
            headerHozAlign: 'center',
            headerSort: false,
          },
          {
            title: 'Thực hành',
            columns: [
              {
                title: 'Thực hành',
                field: 'IsPractice',  
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 50,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu',
                field: 'PracticeQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
            ]
          },
          {
            title: 'Bài tập',
            columns: [
              {
                title: 'Bài tập',
                field: 'IsExercise',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 50,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu',
                field: 'ExerciseQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
            ]
          },
          {
            title: 'Trắc nghiệm',
            columns: [
              {
                title: 'Trắc nghiệm',
                field: 'IsMultiChoice',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 50,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  return `<input type="checkbox" ${(value === true ? 'checked' : '')} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu ',
                field: 'MultiChoiceQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
              {
                title: 'Số câu thi',
                field: 'QuestionCount',
                hozAlign: 'right',
                headerHozAlign: 'center',
                width: 100,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
              {
                title: 'Thời lượng',
                field: 'TotalDuration',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${parseFloat(value).toFixed(2)}`;
                  }
                  return '0.00';
                },
                headerSort: false,
              },
            ]
          },
        ],
      });

      this.courseTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.getLessonByCourseID(rowData['ID']);
      });

      this.courseTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.onEditCourse(rowData);
      });

      this.courseTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.courseID = rowData['ID'];
        this.getLessonByCourseID(this.courseID);
      });

      this.courseTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.courseTable!.getSelectedRows();
        this.courseID = 0;
        this.lessonData = [];
     
          if (this.lessonTable) {
            this.lessonTable.setData(this.lessonData);
          }
        
      });
    }
  }

  draw_lessonTable(): void {
    if (this.lessonTable) {
      this.lessonTable.setData(this.lessonData);
    } else {
      this.lessonTable = new Tabulator(this.lessonTableRef.nativeElement, {
        data: this.lessonData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        selectableRows: 1,
        paginationMode: 'local',
        height: '87vh',
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
            width: 50,
            formatter: 'rownum',
          },
          {
            title: 'Mã bài học',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'Code',
          },
          {
            title: 'Tên bài học',
            field: 'LessonTitle',
            hozAlign: 'left',
            headerHozAlign: 'center',
            resizable: false,
          },
        ],
      });

      this.lessonTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.onEditLesson(rowData);
      });

      this.lessonTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.lessonID = rowData['ID'];
      });

      this.lessonTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.lessonTable!.getSelectedRows();
        this.lessonID = 0;
      });
    }
  }
}
