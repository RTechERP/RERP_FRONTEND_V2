import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
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
  HostListener,
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
  CellComponent,
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
import { LessonDetailComponent } from '../course_management-form/lesson-detail/lesson-detail.component';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { DateTime } from 'luxon';
import { VideoUploadStateService } from '../course_management-form/video-upload-state.service';
interface Category {
  ID: number;
  Code: string;
  Name: string;
  STT?: number;
}

interface Lesson {
  ID: number;
  STT?: number;
  Code?: string;
  Name?: string;
  LessonTitle?: string;
  LessonContent?: string;
  Duration?: number;
  VideoURL?: string;
  CourseID: number;
  FileCourseID?: number;
  UrlPDF?: string;
  LessonCopyID?: number;
  EmployeeID?: number;
  IsDeleted?: boolean;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
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
    HasPermissionDirective,
    Menubar,
  ],
  templateUrl: './course-management.component.html',
  styleUrl: './course-management.component.css',
})
export class CourseManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('CategoryTable') categoryTableRef!: ElementRef;
  @ViewChild('CourseTable') courseTableRef!: ElementRef;
  @ViewChild('LessonTable') lessonTableRef!: ElementRef;

  categoryMenuBars: MenuItem[] = [
    {
      label: 'Thêm',
      icon: 'fa-solid fa-circle-plus fa-lg text-success',
      //visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onAddCategory();
      },
    },

    {
      label: 'Sửa',
      icon: 'fa-solid fa-file-pen fa-lg text-primary',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onEditCategory();
      },
    },
    {
      label: 'Xóa',
      icon: 'fa-solid fa-trash fa-lg text-danger',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onDeleteCategory();
      },
    },
    { separator: true },
  ];

  courseMenuBars: MenuItem[] = [
    {
      label: 'Thêm',
      icon: 'fa-solid fa-circle-plus fa-lg text-success',
      //visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onAddCourse();
      },
    },

    {
      label: 'Sửa',
      icon: 'fa-solid fa-file-pen fa-lg text-primary',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onEditCourse();
      },
    },
    {
      label: 'Xóa',
      icon: 'fa-solid fa-trash fa-lg text-danger',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onDeleteCourse();
      },
    },

    { separator: true },
  ];

  lessonMenuBars: MenuItem[] = [
    {
      label: 'Thêm',
      icon: 'fa-solid fa-circle-plus fa-lg text-success',
      //visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onAddLesson();
      },
    },

    {
      label: 'Sửa',
      icon: 'fa-solid fa-file-pen fa-lg text-primary',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onEditLesson();
      },
    },
    {
      label: 'Xóa',
      icon: 'fa-solid fa-trash fa-lg text-danger',
      // visible: this.permissionService.hasPermission(""),
      command: () => {
        this.onDeleteLesson();
      },
    },
    { separator: true },
  ];

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
  dataTeam: any[] = [];

  // Search text for each table
  searchCategoryText: string = '';
  searchCourseText: string = '';
  searchLessonText: string = '';

  constructor(
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private breakpointObserver: BreakpointObserver,
    private message: NzMessageService,
    private permissionService: PermissionService,
    private videoUploadService: VideoUploadStateService,
  ) { }

  // Cảnh báo khi user đóng tab trong lúc có video đang upload
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    // Check nếu có bất kỳ upload nào đang chạy
    const hasActiveUpload = this.videoUploadService.hasAnyActiveUpload();
    if (hasActiveUpload) {
      $event.returnValue = 'Đang có video upload, bạn có chắc muốn đóng?';
    }
  }

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });
  }

  ngAfterViewInit(): void {
    this.draw_categoryTable();
    this.draw_courseTable();
    this.draw_lessonTable();
    this.getDataCategory();
    this.getDataDepartment();
    this.getDataTeam();
  }

  getDataCategory() {
    this.courseService.getDataCategory(-1).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.categoryData = response.data || [];
          this.sortCategoryData();
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
          this.notification.warning(
            'Thông báo',
            response?.message || 'Không thể tải danh sách danh mục!',
          );
          this.categoryData = [];
          if (this.categoryTable) {
            this.categoryTable.replaceData(this.categoryData);
          }
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi tải danh sách danh mục!',
        );
        console.error('Error loading categories:', error);
        this.categoryData = [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
        }
      },
    );
  }

  getDataDepartment() {
    this.courseService.getDataDepartment().subscribe((response: any) => {
      this.dataDepartment = response.data || response || [];
    });
  }

  getDataTeam() {
    this.courseService.getDataTeams().subscribe((response: any) => {
      this.dataTeam = response.data || response || [];
    });
  }

  getCourse() {
    if (this.searchParams.categoryID === 0) {
      this.courseData = [];
      if (this.courseTable) {
        this.courseTable.setData(this.courseData);
        console.log('courseData', this.courseData);
      }
      return;
    }

    this.courseService.getCourse(this.searchParams.categoryID).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.courseData = response.data || [];
          if (this.courseTable) {
            this.courseTable.setData(this.courseData);
          }
        } else {
          this.notification.warning(
            'Thông báo',
            response?.message || 'Không thể tải danh sách khóa học!',
          );
          this.courseData = [];
          if (this.courseTable) {
            this.courseTable.setData(this.courseData);
          }
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi tải danh sách khóa học!',
        );
        console.error('Error loading courses:', error);
        this.courseData = [];
        if (this.courseTable) {
          this.courseTable.setData(this.courseData);
        }
      },
    );
  }

  getLessonByCourseID(id: number) {
    if (id === 0) {
      this.lessonData = [];
      if (this.lessonTable) {
        this.lessonTable.setData(this.lessonData);
      }
      return;
    }

    this.courseService.getLessonByCourseID(id).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.lessonData = response.data || [];
          if (this.lessonTable) {
            this.lessonTable.setData(this.lessonData);
          }
        } else {
          this.notification.warning(
            'Thông báo',
            response?.message || 'Không thể tải danh sách bài học!',
          );
          this.lessonData = [];
          if (this.lessonTable) {
            this.lessonTable.setData(this.lessonData);
          }
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi tải danh sách bài học!',
        );
        console.error('Error loading lessons:', error);
        this.lessonData = [];
        if (this.lessonTable) {
          this.lessonTable.setData(this.lessonData);
        }
      },
    );
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
    const maxSTT =
      this.categoryData.length > 0
        ? Math.max(...this.categoryData.map((c) => c.STT || 0))
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
      TeamIDs: [],
    };
    modalRef.componentInstance.catalogID = this.categoryID;
    modalRef.componentInstance.dataInput = null;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.maxSTT = maxSTT;
    modalRef.componentInstance.dataDepartment = this.dataDepartment;
    modalRef.componentInstance.dataTeam = this.dataTeam;

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataCategory();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
  }

  onEditCategory(categoryData?: any) {
    const dataToEdit =
      categoryData || this.categoryTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một danh mục để sửa!',
      );
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
      TeamIDs: [],
    };
    modalRef.componentInstance.catalogID = this.categoryID;
    modalRef.componentInstance.dataInput = { ...dataToEdit };
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.maxSTT = 0;
    modalRef.componentInstance.dataDepartment = [...this.dataDepartment];
    modalRef.componentInstance.dataTeam = [...this.dataTeam];
    console.log('dataToEdit', dataToEdit);
    console.log('dataDepartment', this.dataDepartment);
    console.log('dataTeam', this.dataTeam);

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getDataCategory();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
  }

  onDeleteCategory() {
    const dataSelect: any[] = this.categoryTable!.getSelectedData();
    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một danh mục để xóa!',
      );
      return;
    }

    const categoryNames = dataSelect.map((c) => c.Name).join(', ');
    const displayNames =
      dataSelect.length > 3
        ? `${dataSelect
          .slice(0, 3)
          .map((c) => c.Name)
          .join(', ')} và ${dataSelect.length - 3} danh mục khác`
        : categoryNames;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa danh mục "${displayNames}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const deleteRequests = dataSelect.map((category) => {
          const payload = {
            ID: category.ID,
            Code: category.Code,
            Name: category.Name,
            DepartmentSTT: category.DepartmentSTT ?? category.DepartmentID, // API expects DepartmentSTT
            STT: category.STT,
            CatalogType: category.CatalogType,
            ProjectTypeIDs: category.ProjectTypeIDs || [],
            DeleteFlag: false,
            IsDeleted: true,
          };
          return this.courseService.saveCourseCatalog(payload);
        });

        forkJoin(deleteRequests).subscribe({
          next: (results: any[]) => {
            const successCount = results.filter(
              (res) => res && res.status === 1,
            ).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
              this.notification.success(
                'Thông báo',
                `Đã xóa thành công ${successCount} danh mục!`,
              );
            }

            if (failCount > 0) {
              this.notification.warning(
                'Thông báo',
                `Có ${failCount} danh mục không thể xóa!`,
              );
            }

            this.getDataCategory();
          },
          error: (err) => {
            this.notification.error(
              'Thông báo',
              'Có lỗi xảy ra khi thực hiện xóa danh sách danh mục!',
            );
            console.error('Error deleting categories:', err);
            this.getDataCategory();
          },
        });
      },
    });
  }

  onAddCourse() {
    const maxSTT =
      this.courseData.length > 0
        ? Math.max(...this.courseData.map((c) => c.STT || 0))
        : 0;

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
    modalRef.componentInstance.dataCategory = this.categoryData;
    modalRef.componentInstance.dataCourse = this.courseData;
    modalRef.componentInstance.categoryID = this.categoryID;
    modalRef.componentInstance.maxSTT = maxSTT;
    modalRef.componentInstance.mode = 'add';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getCourse();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
  }

  onEditCourse(courseData?: any) {
    // TODO: Implement edit course modal
    const dataToEdit = courseData || this.courseTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một khóa học để sửa!',
      );
      return;
    }

    const modalRef = this.modalService.open(CourseDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.dataInput = dataToEdit;
    console.log('Dữ liệu truyền vào modal sửa khóa học:', dataToEdit);

    modalRef.componentInstance.dataCategory = this.categoryData;
    modalRef.componentInstance.dataCourse = this.courseData;
    modalRef.componentInstance.categoryID = this.categoryID;
    modalRef.componentInstance.mode = 'edit';
    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getCourse();
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
    //this.notification.info('Thông báo', 'Chức năng sửa khóa học đang được phát triển');
  }

  onDeleteCourse() {
    const dataSelect: any[] = this.courseTable!.getSelectedData();
    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một khóa học để xóa!',
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].NameCourse} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        for (let selectedData of dataSelect) {
          const deleteDTO = {
            ...selectedData,
            DeleteFlag: false,
          };

          this.courseService.saveCourse(deleteDTO).subscribe({
            next: (response: any) => {
              this.notification.success(
                'Thông báo',
                'Đã xóa thành công khóa học!',
              );
              this.getCourse();
            },
            error: (error: any) => {
              this.notification.error('Thông báo', 'Lỗi xóa khóa học');
            },
          });
        }
      },
    });
  }

  onAddLesson() {
    // TODO: Implement add lesson modal
    const maxSTT =
      this.lessonData.length > 0
        ? Math.max(...this.lessonData.map((c) => c.STT || 0))
        : 0;

    const dataToEdit = this.courseTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một khóa học để thêm bài học!',
      );
      return;
    }
    const modalRef = this.modalService.open(LessonDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.dataCategory = this.categoryData;
    // modalRef.componentInstance.dataCourse = this.courseData;
    modalRef.componentInstance.categoryID = this.categoryID;
    modalRef.componentInstance.courseID = dataToEdit.ID;
    modalRef.componentInstance.maxSTT = maxSTT;
    modalRef.componentInstance.mode = 'add';
    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getLessonByCourseID(this.courseID);
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
    //this.notification.info('Thông báo', 'Chức năng thêm bài học đang được phát triển');
  }

  onEditLesson(lessonData?: any) {
    const dataToEdit = lessonData || this.lessonTable?.getSelectedData()?.[0];
    if (!dataToEdit) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một bài học để sửa!',
      );
      return;
    }

    // Lưu courseID ngay lập tức (primitive value, không bị ảnh hưởng bởi closure)
    const courseIdToRefresh = dataToEdit.CourseID;

    const modalRef = this.modalService.open(LessonDetailComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.dataInput = dataToEdit;
    modalRef.componentInstance.dataCategory = this.categoryData;
    modalRef.componentInstance.categoryID = this.categoryID;
    modalRef.componentInstance.courseID = courseIdToRefresh;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result.then(
      (result) => {
        if (result == true) {
          this.getLessonByCourseID(this.courseID);
        }
      },
      (reason) => {
        // Modal dismissed - không làm gì
      },
    );
  }

  onDeleteLesson() {
    const dataSelect: Lesson[] = this.lessonTable!.getSelectedData();
    const dataToEdit = this.lessonTable?.getSelectedData()?.[0];
    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bài học để xóa!',
      );
      return;
    }

    const lessonNames = dataSelect.map((l) => l.LessonTitle).join(', ');
    const displayNames =
      dataSelect.length > 3
        ? `${dataSelect
          .slice(0, 3)
          .map((l) => l.LessonTitle)
          .join(', ')} và ${dataSelect.length - 3} bài học khác`
        : lessonNames;

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa bài học "${displayNames}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        const deleteRequests = dataSelect.map((lesson) => {
          const payload = {
            CourseLesson: {
              ID: lesson.ID,
              Code: lesson.Code,
              LessonTitle: lesson.LessonTitle,
              LessonContent: lesson.LessonContent,
              Duration: lesson.Duration,
              VideoURL: lesson.VideoURL,
              STT: lesson.STT,
              CourseID: lesson.CourseID,
              FileCourseID: lesson.FileCourseID,
              UrlPDF: lesson.UrlPDF,
              LessonCopyID: lesson.LessonCopyID,
              EmployeeID: lesson.EmployeeID,
              IsDeleted: true,
            },
            CoursePdf: null,
            CourseFiles: null,
          };
          return this.courseService.saveLesson(payload);
        });

        forkJoin(deleteRequests).subscribe({
          next: (results: any[]) => {
            const successCount = results.filter(
              (res) => res && res.status === 1,
            ).length;
            const failCount = results.length - successCount;

            if (successCount > 0) {
              this.notification.success(
                'Thông báo',
                `Đã xóa thành công ${successCount} bài học!`,
              );
            }

            if (failCount > 0) {
              this.notification.warning(
                'Thông báo',
                `Có ${failCount} bài học không thể xóa!`,
              );
            }
            this.getLessonByCourseID(dataToEdit.ID);
          },
          error: (err) => {
            this.notification.error(
              'Thông báo',
              'Có lỗi xảy ra khi thực hiện xóa danh sách bài học!',
            );
            console.error('Error deleting lessons:', err);
            this.getLessonByCourseID(
              dataSelect[0].CourseID || dataToEdit.CourseID,
            );
          },
        });
      },
    });
  }
  private sortCategoryData(): void {
    this.categoryData = this.categoryData
      .map((x: any) => ({
        ...x,
        __catalogOrder:
          x.CatalogTypeText === 'CƠ BẢN' ? 1 :
            x.CatalogTypeText === 'NÂNG CAO' ? 2 : 3,
      }))
      .sort((a: any, b: any) => {
        if (a.__catalogOrder !== b.__catalogOrder) {
          return a.__catalogOrder - b.__catalogOrder;
        }

        return (a.NameDepartment || '')
          .localeCompare(b.NameDepartment || '');
      });
    console.log('categoryData', this.categoryData);
  }
  draw_categoryTable(): void {
    this.sortCategoryData();
    if (this.categoryTable) {
      this.categoryTable.setData(this.categoryData);
    } else {
      this.categoryTable = new Tabulator(this.categoryTableRef.nativeElement, {
        data: this.categoryData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '83vh',
        selectableRows: 1,
        sortMode: 'local',
        initialSort: [],
        pagination: false,
        paginationMode: 'local',
        reactiveData: false,
        groupBy: [
          (data: any) => data.__catalogOrder,
          (data: any) => data.NameDepartment || 'Chưa có phòng ban',
        ],
        groupStartOpen: [true, true],
        groupHeader: [
          (value: any, count: number, data: any) => {
            const labelMap: Record<number, string> = { 1: 'CƠ BẢN', 2: 'NÂNG CAO' };
            const text = labelMap[value] || 'Chưa phân loại';
            return `<strong>Loại: ${text}</strong> (${count} danh mục)`;
          },
          (value: any, count: number, data: any) => {
            return `<strong>Phòng ban: ${value}</strong>`;
          },
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
        this.categoryID = rowData['ID'];
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
        height: '83vh',
        selectableRows: 1,
        pagination: false,
        paginationMode: 'local',
        groupBy: 'CourseTypeName',
        groupHeader: function (value, count, data, group) {
          return `Loại: ${value || ''}`;
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
            width: 300,
            headerHozAlign: 'center',
            headerSort: false,
          },
          {
            title: 'Thời gian học (ngày)',
            field: 'LeadTime',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            formatter: (cell: any) => {
              const value = cell.getValue();
              if (value != null && value > 0) {
                const num = parseFloat(value);
                return num % 1 === 0 ? num.toString() : num.toFixed(2);
              }
              return '0';
            },
            headerSort: false,
          },
          {
            title: 'Người tạo',
            field: 'Instructor',
            hozAlign: 'left',
            headerHozAlign: 'center',
            headerSort: false,
          },
          {
            title: 'Danh sách loại vị trí',
            field: 'KPIPositionTypeCodes',
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
                  return `<input type="checkbox" ${value === true ? 'checked' : ''} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu',
                field: 'PracticeQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
            ],
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
                  return `<input type="checkbox" ${value === true ? 'checked' : ''} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu',
                field: 'ExerciseQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    return `${value}`;
                  }
                  return '0';
                },
                headerSort: false,
              },
            ],
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
                  return `<input type="checkbox" ${value === true ? 'checked' : ''} onclick="return false;">`;
                },
                headerSort: false,
              },
              {
                title: 'Tổng số câu',
                field: 'MultiChoiceQuestions',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 100,
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
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
                bottomCalc: 'sum',
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
                headerSort: false,
              },
              {
                title: 'Thời lượng',
                field: 'QuestionDuration',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 150,
                bottomCalc: (values: any, data: any, calcParams: any) => {
                  // Tính tổng: QuestionDuration × QuestionCount của mỗi khóa học
                  let total = 0;
                  data.forEach((row: any) => {
                    const duration = parseFloat(row.QuestionDuration) || 0;
                    const count = parseFloat(row.QuestionCount) || 0;
                    total += duration * count;
                  });
                  return total;
                },
                bottomCalcFormatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null) {
                    const num = parseFloat(value);
                    const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    return `${formatted} (Phút)`;
                  }
                  return '0 (Phút)';
                },
                formatter: (cell: any) => {
                  const value = cell.getValue();
                  if (value != null && value > 0) {
                    const num = parseFloat(value);
                    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  }
                  return '0';
                },
                headerSort: false,
              },
            ],
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
        pagination: false,
        paginationMode: 'local',
        height: '83vh',
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
          {
            title: 'Người phụ trách training',
            field: 'FullName',
            hozAlign: 'left',
            headerHozAlign: 'center',
            resizable: false,
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            width: 120,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: (cell: CellComponent) => {
              const date = cell.getValue();
              return date ? DateTime.fromISO(date).toFormat('dd/MM/yyyy') : '';
            },
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

  // Search functionality for tables
  searchInTable(tableType: 'category' | 'course' | 'lesson'): void {
    let table: Tabulator | null = null;
    let searchText = '';

    switch (tableType) {
      case 'category':
        table = this.categoryTable;
        searchText = this.searchCategoryText;
        break;
      case 'course':
        table = this.courseTable;
        searchText = this.searchCourseText;
        break;
      case 'lesson':
        table = this.lessonTable;
        searchText = this.searchLessonText;
        break;
    }

    if (table) {
      if (searchText && searchText.trim()) {
        // Lấy tất cả các cột từ bảng
        const columns = table.getColumns();

        // Tạo filter cho tất cả các cột (OR logic)
        const filters: any[] = [];
        columns.forEach((column: any) => {
          const field = column.getField();
          // Chỉ tìm kiếm các cột có field và không phải checkbox/button
          if (field && field !== 'id' && !field.startsWith('_')) {
            filters.push({ field: field, type: 'like', value: searchText });
          }
        });

        if (filters.length > 0) {
          table.setFilter([filters]);
        }
      } else {
        // Clear filter if search text is empty
        table.clearFilter(true);
      }
    }
  }
}
