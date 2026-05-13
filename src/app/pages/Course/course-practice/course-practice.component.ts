import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { RowComponent } from 'tabulator-tables';
import { CourseManagementService } from '../course-management/course-management-service/course-management.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { CourseListComponent } from './components/course-list/course-list.component';
import { LessonViewComponent } from './components/lesson-view/lesson-view.component';
import { CoursePracticeService } from './course-practice.service';
import { CourseExamResultComponent } from './course-exam/course-exam-result/course-exam-result.component';
import { CourseExamResultPracticeComponent } from './course-exam/course-exam-result-practice/course-exam-result-practice.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AppUserService } from '../../../services/app-user.service';

interface CourseExam {
  ID: number;
  CourseId?: number;
  Goal?: number;
  TestTime?: number;
  ExamType?: number; // 1: Trắc nghiệm, 2: Thực hành, 3: Bài tập
}

interface Category {
  ID: number;
  Code: string;
  Name: string;
  STT?: number;
  CatalogTypeText?: string;
  NameDepartment?: string;
  CatalogType?: string;
}

interface Course {
  ID: number;
  Code: string;
  NameCourse: string;
  LeadTime?: number;
  TotalTimeLearned?: number;
  TotalHistoryLession?: number;
  Instructor?: string;
  NumberLesson?: number;
  FullName?: string;
  CourseTypeName?: string;
  Status?: number;
  TestScore?: number;
  Rating?: number;
  CompletionStatus?: string; // 'Hoạt động' | 'Đã hoàn thành'
  EvaluateText?: string;
  DeleteFlag?: number;
}

interface Lesson {
  ID: number;
  Code: string;
  LessonTitle: string;
  Content?: string;
  VideoUrl?: string;
  STT?: number;
  CourseID?: number;
  EmployeeID?: number;
  FullName?: string;
}

interface LessonFile {
  ID: number;
  LessonID: number;
  NameFile: string;
  LinkFile: string;
  TypeFile?: string;
}

interface CourseLesson {
  ID: number;
  STT?: number;
  Code?: string;
  NameCourse?: string;
  LessonTitle: string;
  Status?: number;
  StatusText?: string;
  CourseID?: number;
  LessonContent?: string;
  Duration?: number;
  VideoURL?: string;
  UrlPDF?: string;
}

// Cấu trúc nhóm theo Phòng ban và Loại - cho feature xem tất cả
interface CourseGroupByDepartment {
  departmentId: number;
  departmentName: string;
  catalogTypes: CatalogTypeGroup[];
  isCollapsed: boolean;
}

interface CatalogTypeGroup {
  catalogType: number;
  catalogTypeName: string;
  courses: Course[];
  isCollapsed: boolean;
}

// Interface cho Tree View 5 cấp: Department → CatalogType → Catalog → TechType → Course
interface CourseTreeNode {
  id: string; // Sử dụng string để tránh trùng ID
  name: string;
  type: 'department' | 'catalogType' | 'catalog' | 'techType' | 'course';
  departmentId?: number;
  catalogType?: number;    // 1: Cơ bản, 2: Nâng cao, 3: Bắt buộc
  catalogCode?: string;    // RULES, PLC, NOKT...
  catalogName?: string;    // Tên đầy đủ
  techType?: string;       // C#, SQL, Java...
  course?: any;
  children: CourseTreeNode[];
  isCollapsed: boolean;
  courseCount: number;
}

@Component({
  selector: 'app-course-practice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzTagModule,
    CourseListComponent,
    LessonViewComponent,
    CourseExamResultComponent,
    CourseExamResultPracticeComponent,
    NzToolTipModule,
    NzSpinModule
  ],
  templateUrl: './course-practice.component.html',
  styleUrl: './course-practice.component.css',
})
export class CoursePracticeComponent implements OnInit, AfterViewInit {
  @ViewChild('CategoryTable') categoryTableRef!: ElementRef;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  isCategoryVisible: boolean = true;
  isSmallScreen: boolean = false;

  categoryTable: Tabulator | null = null;
  categoryData: Category[] = [];
  selectedCategoryID: number = 0;
  selectedCatalogType: number = 0;

  courseData: Course[] = [];
  lessonData: Lesson[] = [];

  selectedCourseID: number = 0;
  selectedCourseName: string = '';

  viewMode: 'courses' | 'lessons' | 'examResult' | 'practiceResult' = 'courses';

  courseExamData: CourseExam[] = [];
  courseLessonData: CourseLesson[] = [];
  categoryCourseID: number = 0;

  // Properties cho feature "Tất cả khóa học"
  showAllCourses: boolean = false;
  allCoursesByDepartment: CourseGroupByDepartment[] = [];

  // Properties cho Tree View (view mode mới)
  isAllCoursesView: boolean = true;
  courseTreeData: CourseTreeNode[] = [];
  selectedTreeNode: CourseTreeNode | null = null;
  allCoursesRaw: any[] = [];
  currentUserDepartmentId: number = 0;
  constructor(
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer,
    private coursePracticeService: CoursePracticeService,
    private appUserService: AppUserService,
  ) {
    this.currentUserDepartmentId = this.appUserService.departmentID || 0;
   }

  ngOnInit(): void {
    // Auto switch layout based on screen size
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });

    // Hamburger menu responsive behavior (768px breakpoint)
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((result) => {
        this.isSmallScreen = result.matches;
        // Auto-hide Category Table on small screens (only on first load)
        if (this.isSmallScreen && this.isCategoryVisible) {
          this.isCategoryVisible = false;
        }
      });
    this.isAllCoursesView = true;
    this.loadCourseExam();
    this.getDataCategory();
    this.toggleViewAllCourses();
  }

  ngAfterViewInit(): void {
    this.draw_categoryTable();
  }
  private sortCategoryData(): void {
    this.categoryData = this.categoryData
      .map((x: any) => ({
        ...x,
        __catalogOrder:
          x.CatalogTypeText === 'KHÓA HỌC BẮT BUỘC' ? 1 :
            x.CatalogTypeText === 'CƠ BẢN' ? 2 :
              x.CatalogTypeText === 'NÂNG CAO' ? 3 : 4,
      }))
      .sort((a: any, b: any) => {
        if (a.__catalogOrder !== b.__catalogOrder) {
          return a.__catalogOrder - b.__catalogOrder;
        }

        return (a.NameDepartment || '')
          .localeCompare(b.NameDepartment || '');
      });
  }
  getDataCategory() {
    this.courseService.getDataCategory(0).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.categoryData = response.data || [];
          this.sortCategoryData();
          if (this.categoryTable) {
            this.categoryTable.replaceData(this.categoryData);
            setTimeout(() => {
              this.categoryTable?.redraw(true);
            }, 100);
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
        this.categoryData = [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
        }
      },
    );
  }

  loadCourseExam(): void {
    this.coursePracticeService.GetAllCourseExam().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.courseExamData = response.data || [];
        } else {
          this.courseExamData = [];
        }
      },
      error: (error) => {
        this.courseExamData = [];
      },
    });
  }

  // Load tất cả khóa học theo phòng ban
  loadAllCoursesByDepartment(): void {
    this.coursePracticeService.getAllCourses().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          const courses = response.data || [];
          this.groupCoursesByDepartmentAndType(courses);
        } else {
          this.allCoursesByDepartment = [];
          this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách khóa học!');
        }
      },
      error: (error) => {
        this.allCoursesByDepartment = [];
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách khóa học!');
      }
    });
  }

  // Nhóm khóa học theo Phòng ban và Loại
  groupCoursesByDepartmentAndType(courses: any[]): void {
    const departmentMap = new Map<number, CourseGroupByDepartment>();

    for (const course of courses) {
      const deptId = course.DepartmentID || 0;
      const deptName = course.DepartmentName || 'Chưa phân loại';
      const catalogType = course.CatalogType || 0;
      const catalogTypeName = this.getCatalogTypeName(catalogType);

      // Tạo/lấy department group
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          catalogTypes: [],
          isCollapsed: false
        });
      }

      const deptGroup = departmentMap.get(deptId)!;

      // Tạo/cập nhật catalog type group
      let typeGroup = deptGroup.catalogTypes.find(t => t.catalogType === catalogType);
      if (!typeGroup) {
        typeGroup = {
          catalogType,
          catalogTypeName,
          courses: [],
          isCollapsed: false
        };
        deptGroup.catalogTypes.push(typeGroup);
      }

      // Thêm khóa học vào nhóm
      typeGroup.courses.push(course);
    }

    // Sắp xếp catalog types theo thứ tự: Bắt buộc -> Cơ bản -> Nâng cao
    for (const dept of departmentMap.values()) {
      dept.catalogTypes.sort((a, b) => {
        const order: Record<number, number> = { 3: 1, 1: 2, 2: 3 };
        return (order[a.catalogType] || 99) - (order[b.catalogType] || 99);
      });
    }

    // Sắp xếp department: ưu tiên phòng ban của user đăng nhập lên đầu
    const sortedDepts = Array.from(departmentMap.values()).sort((a, b) => {
      if (a.departmentId === this.currentUserDepartmentId) return -1;
      if (b.departmentId === this.currentUserDepartmentId) return 1;
      return a.departmentName.localeCompare(b.departmentName);
    });
    this.allCoursesByDepartment = sortedDepts;
  }

  // Lấy tên loại danh mục
  getCatalogTypeName(catalogType: number): string {
    switch (catalogType) {
      case 1: return 'CƠ BẢN';
      case 2: return 'NÂNG CAO';
      case 3: return 'KHÓA HỌC BẮT BUỘC';
      default: return 'KHÁC';
    }
  }

  // Toggle hiển thị phòng ban
  toggleDepartment(dept: CourseGroupByDepartment): void {
    dept.isCollapsed = !dept.isCollapsed;
  }

  // Toggle hiển thị loại khóa học
  toggleCatalogType(type: CatalogTypeGroup): void {
    type.isCollapsed = !type.isCollapsed;
  }

  // Toggle view giữa "Theo danh mục" và "Tất cả"
  toggleViewAllCourses(): void {
    //this.showAllCourses = !this.showAllCourses;

    // Khi chuyển sang view "Tất cả" - ẩn panel trái
    //if (this.showAllCourses) {
    if (this.allCoursesByDepartment.length === 0) {
      this.loadAllCoursesByDepartment();
    }
    // Load tree data nếu chưa có
    if (this.courseTreeData.length === 0) {
      if (this.allCoursesRaw.length === 0) {
        this.loadAllCoursesForTree();
      } else {
        this.buildCourseTree();
      }
    }
    //}
  }

  // ==================== TREE VIEW METHODS ====================

  // Toggle view mode: Theo danh mục / Tất cả (Tree View)
  toggleViewMode(): void {
    this.isAllCoursesView = !this.isAllCoursesView;

    if (this.isAllCoursesView) {
      // Chuyển sang chế độ Tree View
      // Ẩn table danh mục cũ, hiện tree view
      if (this.allCoursesRaw.length === 0) {
        this.loadAllCoursesForTree();
      } else {
        this.buildCourseTree();
      }
    }
  }

  // Load tất cả khóa học cho Tree View
  loadAllCoursesForTree(callback?: () => void): void {
    this.coursePracticeService.getAllCourses().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.allCoursesRaw = response.data || [];

          // DEBUG: Log để kiểm tra cấu trúc data
          console.log('=== loadAllCoursesForTree DEBUG ===');
          console.log('Total courses:', this.allCoursesRaw.length);
          if (this.allCoursesRaw.length > 0) {
            console.log('Sample course keys:', Object.keys(this.allCoursesRaw[0]));
            console.log('Sample course:', this.allCoursesRaw[0]);
            console.log('Unique DepartmentIDs:', [...new Set(this.allCoursesRaw.map(c => c.DepartmentID || 0))]);
          }

          this.buildCourseTree();

          // Gọi callback sau khi tree đã build xong
          if (callback) {
            callback();
          }
        } else {
          this.courseTreeData = [];
          this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách khóa học!');
        }
      },
      error: (error) => {
        this.courseTreeData = [];
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách khóa học!');
      }
    });
  }

  // Build tree structure: Department → CatalogType → Catalog → TechType → Course (5 cấp)
  buildCourseTree(): void {
    // Map để theo dõi các cấp
    const departmentMap = new Map<number, CourseTreeNode>();
    const catalogTypeMap = new Map<string, CourseTreeNode>();
    const catalogMap = new Map<string, CourseTreeNode>();
    const techTypeMap = new Map<string, CourseTreeNode>();

    // DEBUG: Kiểm tra categoryData
    console.log('=== buildCourseTree DEBUG ===');
    console.log('categoryData length:', this.categoryData.length);
    console.log('allCoursesRaw length:', this.allCoursesRaw.length);
    console.log('Unique DepartmentNames:', [...new Set(this.allCoursesRaw.map(c => c.DepartmentName || 'Chưa phân loại'))]);

    // Sắp xếp thứ tự catalog type: Bắt buộc (3) -> Cơ bản (1) -> Nâng cao (2)
    const catalogOrder: Record<number, number> = { 3: 1, 1: 2, 2: 3 };

    // Sắp xếp thứ tự tech type: Web -> C# -> SQL -> Khác
    const techTypeOrder = (name: string): number => {
      const lower = name.toLowerCase();
      if (lower.includes('web') || lower.includes('frontend') || lower.includes('angular') || lower.includes('react')) return 1;
      if (lower.includes('c#') || lower.includes('.net') || lower.includes('csharp')) return 2;
      if (lower.includes('sql') || lower.includes('database') || lower.includes('db')) return 3;
      return 99; // Khác
    };

    for (const course of this.allCoursesRaw) {
      // Dùng DepartmentName làm key vì DepartmentID = 0 cho tất cả
      const deptId = course.DepartmentID || 0;
      const deptName = course.DepartmentName || 'Chưa phân loại';
      const deptKey = deptName; // Dùng tên làm key để phân nhóm đúng

      // DEBUG: Log từng course để xem DepartmentID/Name
      if (deptId !== 0) {
        console.log('Course:', course.NameCourse, '| DeptID:', deptId, '| DeptName:', deptName);
      }

      // Approach A: IsRequired override CatalogType
      // Chỉ check IsRequired: true → Bắt buộc, false → mặc định CatalogType = 0 (Tất cả)
      const catalogCategory = this.categoryData.find(c => c.ID === course.CatalogID);
      const isRequired = course.IsRequired === true || course.IsRequired === 1;

      let catalogType: number;
      let catalogTypeName: string;

      if (isRequired) {
        catalogType = 3; // Bắt buộc
        catalogTypeName = 'Bắt buộc';
      } else {
        // Nếu có CatalogType từ course data thì dùng, không thì mặc định 0
        catalogType = Number(course.CatalogType) || 0;
        catalogTypeName = catalogCategory?.CatalogTypeText || '';
      }

      // ========== Cấp 3: CATALOG (Code + Name) - Từ Category ==========
      const catalogCode = catalogCategory?.Code || 'OTHER';
      const catalogName = catalogCategory?.Name || 'Danh mục khác';

      const techType = course.CourseTypeName || 'Khác'; // C#, SQL, Java...

      // ========== Cấp 1: Department (dùng deptName làm key) ==========
      if (!departmentMap.has(deptKey)) {
        departmentMap.set(deptKey, {
          id: `dept-${deptKey}`,
          name: deptName,
          type: 'department',
          departmentId: deptId,
          children: [],
          isCollapsed: false,
          courseCount: 0
        });
      }
      const deptNode = departmentMap.get(deptKey)!;

      // ========== Cấp 2: CatalogType (Bắt buộc, Cơ bản, Nâng cao) ==========
      const catalogKey = `${deptKey}-${catalogType}`;
      let catalogNode = deptNode.children.find(c => c.id === catalogKey);

      if (!catalogNode) {
        catalogNode = {
          id: catalogKey,
          name: catalogTypeName,
          type: 'catalogType',
          catalogType: catalogType || 0,
          children: [],
          isCollapsed: false,
          courseCount: 0
        };
        deptNode.children.push(catalogNode!);
      }

      // ========== Cấp 3: Catalog (Code + Name) ==========
      const catalogGroupKey = `${catalogKey}-${catalogCode}`;
      let catalogGroupNode = catalogNode!.children.find(c => c.id === catalogGroupKey);

      if (!catalogGroupNode) {
        catalogGroupNode = {
          id: catalogGroupKey,
          name: catalogCode,
          type: 'catalog',
          catalogCode: catalogCode,
          catalogName: catalogName,
          children: [],
          isCollapsed: false,
          courseCount: 0
        };
        catalogNode!.children.push(catalogGroupNode!);
      }

      // ========== Cấp 4: TechType (C#, SQL, Java...) ==========
      const techKey = `${catalogGroupKey}-${techType}`;
      let techNode = catalogGroupNode!.children.find(c => c.id === techKey);

      if (!techNode) {
        techNode = {
          id: techKey,
          name: techType,
          type: 'techType',
          techType: techType,
          children: [],
          isCollapsed: false,
          courseCount: 0
        };
        catalogGroupNode!.children.push(techNode!);
      }

      // ========== Cấp 5: Course ==========
      const courseNode: CourseTreeNode = {
        id: `course-${course.ID}`,
        name: course.NameCourse || 'Khóa học',
        type: 'course',
        course: course,
        children: [],
        isCollapsed: false,
        courseCount: 1
      };

      techNode.children.push(courseNode);
      techNode.courseCount++;
      catalogGroupNode.courseCount++;
      catalogNode.courseCount++;
      deptNode.courseCount++;
    }

    // Chuyển Map thành Array và sắp xếp
    // Ưu tiên phòng ban của user đăng nhập lên đầu
    this.courseTreeData = Array.from(departmentMap.values())
      .sort((a, b) => {
        // User department lên đầu
        if (a.departmentId === this.currentUserDepartmentId) return -1;
        if (b.departmentId === this.currentUserDepartmentId) return 1;
        // Các department khác sort theo tên
        return a.name.localeCompare(b.name);
      })
      .map(dept => ({
        ...dept,
        children: dept.children
          .sort((a, b) => (catalogOrder[a.catalogType!] || 99) - (catalogOrder[b.catalogType!] || 99))
          .map(catalog => ({
            ...catalog,
            // Sắp xếp Catalog (Code) theo tên
            children: catalog.children.sort((a, b) => a.name.localeCompare(b.name))
              .map(catalogGroup => ({
                ...catalogGroup,
                // Sắp xếp TechType: Web -> C# -> SQL -> Khác
                children: catalogGroup.children.sort((a, b) => techTypeOrder(a.name) - techTypeOrder(b.name))
              }))
          }))
      }));
  }

  // Toggle node trong tree
  toggleTreeNode(node: CourseTreeNode, event: Event): void {
    event.stopPropagation();
    node.isCollapsed = !node.isCollapsed;
  }

  // Xử lý click vào khóa học trong tree
  onTreeCourseClick(node: CourseTreeNode, event: Event): void {
    event.stopPropagation();

    if (node.type !== 'course') return;

    // Ngăn click nếu khóa học bị khóa
    if (this.isCourseLocked(node.course)) {
      return;
    }

    this.selectedTreeNode = node;

    const course = node.course;
    if (course) {
      this.onCourseSelected(course);
    }
  }

  // Kiểm tra node có được chọn không
  isNodeSelected(node: CourseTreeNode): boolean {
    return this.selectedTreeNode?.id === node.id;
  }

  // Helper: Lấy màu cho tag Catalog Type
  getCatalogTagColor(catalogType: number | undefined): string {
    switch (catalogType) {
      case 3: return 'red';    // KHÓA HỌC BẮT BUỘC
      case 1: return 'green';  // CƠ BẢN
      case 2: return 'orange'; // NÂNG CAO
      default: return 'default';
    }
  }

  getCoursesByCategory(categoryID: number, catalogType: number = 0) {
    if (categoryID === 0) {
      this.courseData = [];
      return;
    }
    this.categoryCourseID = categoryID;

    this.coursePracticeService.getCourse(categoryID, catalogType).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          // Map data and add mock completion status, rating for demo
          this.courseData = (response.data || []).map(
            (course: any, index: number) => ({
              ...course,
              CompletionStatus: index % 3 === 0 ? 'Đã hoàn thành' : 'Hoạt động',
              TestScore:
                course.TestScore || 70 + Math.floor(Math.random() * 30),
              Rating: course.Rating || 3 + Math.floor(Math.random() * 3),
              LessonCount:
                course.LessonCount || 5 + Math.floor(Math.random() * 15),
            }),
          );
        } else {
          this.notification.warning(
            'Thông báo',
            response?.message || 'Không thể tải danh sách khóa học!',
          );
          this.courseData = [];
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi tải danh sách khóa học!',
        );
        this.courseData = [];
      },
    );
  }

  loadCourseLessonData(courseID: number): void {
    this.coursePracticeService.CourseLessonByCourseID(courseID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          const data = response.data || [];
          this.courseLessonData = data;
          // Nếu không có bài học nào → quay về chọn khóa học thay vì hiện panel rỗng
          if (data.length === 0) {
            this.viewMode = 'courses';
          }
        } else {
          this.courseLessonData = [];
          this.viewMode = 'courses';
        }
      },
      error: (error) => {
        this.courseLessonData = [];
        this.viewMode = 'courses';
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
        pagination: false,
        selectableRows: 1,
        paginationMode: 'local',
        groupBy: [
          (data: any) => data.NameDepartment || 'Chưa có phòng ban',
          (data: any) => data.__catalogOrder,
        ],
        groupStartOpen: [true, true],
        groupHeader: [
          (value: any, count: number, data: any) => {
            return `<strong>Phòng ban: ${value}</strong>`;
          },
          (value: any, count: number, data: any) => {
            const labelMap: Record<number, string> = { 1: 'KHÓA HỌC BẮT BUỘC', 2: 'CƠ BẢN', 3: 'NÂNG CAO' };
            const text = labelMap[value] || 'Chưa phân loại';
            return `<strong>Loại: ${text}</strong> (${count} danh mục)`;
          },
        ],
        columns: [
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

      this.categoryTable.on('rowClick', (e: any, row: RowComponent) => {
        const rowData = row.getData() as any;
        this.selectedCategoryID = rowData.ID;
        const catalogType = rowData.CatalogType || (rowData.__catalogOrder === 1 ? 3 : rowData.__catalogOrder === 2 ? 1 : 2);
        this.selectedCatalogType = catalogType;
        this.getCoursesByCategory(this.selectedCategoryID, catalogType);
        this.viewMode = 'courses';
      });

      this.categoryTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData() as any;
        this.selectedCategoryID = rowData['ID'];
        const catalogType = rowData.CatalogType || (rowData.__catalogOrder === 1 ? 3 : rowData.__catalogOrder === 2 ? 1 : 2);
        this.selectedCatalogType = catalogType;
        this.getCoursesByCategory(this.selectedCategoryID, catalogType);
        this.viewMode = 'courses';
      });

      this.categoryTable.on('rowDeselected', (row: RowComponent) => {
        this.selectedCategoryID = 0;
        this.courseData = [];
      });
    }
  }

  onCourseSelected(course: Course): void {
    this.selectedCourseID = course.ID;
    this.selectedCourseName = course.NameCourse;
    // Clear lesson data trước khi load mới, tránh hiện data cũ khi course mới không có bài học
    this.courseLessonData = [];
    this.lessonData = [];
    this.viewMode = 'courses';
    this.getLessonsByCourse(course.ID);
    this.loadCourseLessonData(course.ID);
  }

  getLessonsByCourse(courseID: number): void {
    this.courseService.getLessonByCourseID(courseID).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.lessonData = response.data || [];
          if (this.lessonData.length > 0) {
            this.viewMode = 'lessons';
          } else {
            this.notification.warning(
              'Thông báo',
              'Khóa học này chưa có bài học nào!',
            );
          }
        } else {
          this.notification.warning(
            'Thông báo',
            response?.message || 'Không thể tải danh sách bài học!',
          );
          this.lessonData = [];
        }
      },
      (error) => {
        this.notification.error(
          'Thông báo',
          'Có lỗi xảy ra khi tải danh sách bài học!',
        );
        this.lessonData = [];
      },
    );
  }

  onBackToCourses(): void {
    this.getCoursesByCategory(this.categoryCourseID, this.selectedCatalogType);
    this.viewMode = 'courses';
    this.lessonData = [];
    this.selectedCourseID = 0;
    this.selectedCourseName = '';
  }

  // Computed properties for exam
  get currentCourseExamID(): number {
    if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
      const quizExam = this.courseExamData.find(
        (exam) =>
          exam.CourseId === this.selectedCourseID && exam.ExamType === 1,
      );
      return quizExam?.ID || 0;
    }
    return 0;
  }

  get currentTestTime(): number {
    if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
      const quizExam = this.courseExamData.find(
        (exam) =>
          exam.CourseId === this.selectedCourseID && exam.ExamType === 1,
      );
      return quizExam?.TestTime || 50;
    }
    return 50;
  }

  onOpenExamResult(): void {
    this.viewMode = 'examResult';
  }

  onBackFromExamResult(): void {
    this.viewMode = 'lessons';
    this.selectedLessonID = 0;
    this.currentLessonExam = null;
  }

  // For lesson exam
  selectedLessonID: number = 0;
  currentLessonExam: CourseExam | null = null;

  onOpenLessonExamResult(event: { lessonID: number; exam: CourseExam }): void {
    this.selectedLessonID = event.lessonID;
    this.currentLessonExam = event.exam;

    // Check exam type: 1 = Quiz, 2 = Practice, 3 = Exercise
    if (event.exam.ExamType === 2 || event.exam.ExamType === 3) {
      // Both Practice and Exercise use the same component
      this.viewMode = 'practiceResult';
    } else {
      this.viewMode = 'examResult';
    }
  }

  // Handler for course-level practice exam
  onOpenPracticeResult(): void {
    // Find practice exam for current course
    const practiceExam = this.courseExamData.find(
      (exam) => exam.CourseId === this.selectedCourseID && exam.ExamType === 2,
    );
    if (practiceExam) {
      this.currentLessonExam = practiceExam;
      this.viewMode = 'practiceResult';
    }
  }

  onOpenQuizResult(): void {
    // Find practice exam for current course
    const practiceExam = this.courseExamData.find(
      (exam) => exam.CourseId === this.selectedCourseID && exam.ExamType === 3,
    );
    if (practiceExam) {
      this.currentLessonExam = practiceExam;
      this.viewMode = 'practiceResult';
    }
  }

  // Updated computed properties to support lesson exam
  get currentCourseExamIDForView(): number {
    // If viewing lesson exam, return lesson exam ID
    if (this.currentLessonExam) {
      return this.currentLessonExam.ID;
    }
    // Otherwise return course exam ID
    return this.currentCourseExamID;
  }

  get currentTestTimeForView(): number {
    // If viewing lesson exam, return lesson exam test time
    if (this.currentLessonExam) {
      return this.currentLessonExam.TestTime || 50;
    }
    // Otherwise return course exam test time
    return this.currentTestTime;
  }

  get currentExamType(): number {
    // Return exam type from current lesson exam
    if (this.currentLessonExam) {
      return this.currentLessonExam.ExamType || 2;
    }
    return 2; // Default to Practice
  }

  onLessonSelected(lesson: CourseLesson): void {
    // Child component handles lesson selection
    // This is just a placeholder for future enhancements
  }

  formatStudyDate(value: number | undefined): string {
    if (value == null || value === 0) return '0';
    return value % 1 === 0 ? value.toString() : value.toFixed(2);
  }

  toggleCategoryTable(): void {
    this.isCategoryVisible = !this.isCategoryVisible;
  }

  // Helper: Đếm tổng khóa học trong phòng ban
  getTotalCoursesInDepartment(dept: CourseGroupByDepartment): number {
    return dept.catalogTypes.reduce((total, type) => total + type.courses.length, 0);
  }

  // Helper: Kiểm tra khóa học bị khóa
  isCourseLocked(course: any): boolean {
    return course.Status === 0 || course.Status === -1;
  }

  // Helper: Format số thập phân
  formatDecimal(value: number | undefined | null): string {
    if (value == null || value === undefined || value === 0) return '0.00';
    return value % 1 === 0 ? value.toFixed(2) : value.toFixed(2);
  }

  // Helper: Kiểm tra có điểm thi nào không
  hasAnyScore(course: any): boolean {
    return (course?.GoalMultiChoice > 0) ||
      (course?.GoalPractice > 0) ||
      (course?.GoalExercise > 0);
  }

  // Helper: Tooltip cho lock icon
  getLockTooltip(course: any): string {
    if (course?.Status === -1) {
      return 'Vui lòng hoàn thành khóa học bắt buộc để mở khóa khóa học này';
    }
    if (course?.Status === 0) {
      return 'Khóa học này chưa được mở';
    }
    return 'Khóa học bị khóa';
  }

  // Helper: Tooltip hiện đầy đủ điểm thi
  getScoresTooltip(course: any): string {
    const parts: string[] = [];
    if (course?.GoalMultiChoice > 0) {
      parts.push(`Trắc nghiệm: ${this.formatDecimal(course.QuizPoints)}/${this.formatDecimal(course.GoalMultiChoice)}`);
    }
    if (course?.GoalPractice > 0) {
      parts.push(`Thực hành: ${this.formatDecimal(course.PracticePoints)}/${this.formatDecimal(course.GoalPractice)}`);
    }
    if (course?.GoalExercise > 0) {
      parts.push(`Bài tập: ${this.formatDecimal(course.ExcercisePoints)}/${this.formatDecimal(course.GoalExercise)}`);
    }
    return parts.join('\n');
  }

  // Xử lý khi click vào khóa học trong view "Tất cả"
  onViewCourseDetailFromAll(course: any): void {
    if (course.Status === -1) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng hoàn thành khóa học bắt buộc để mở khóa khóa học này',
      );
      return;
    }
    if (course.Status === 0) {
      this.notification.warning(
        'Thông báo',
        'Khóa học này chưa được mở',
      );
      return;
    }
    this.onCourseSelected(course);
  }

  // Xử lý khi hoàn thành lesson (Cách B: Luôn reload tree - UX nhất quán)
  onLessonCompleted(event: { lesson: CourseLesson; completed: boolean }): void {
    // Lưu selected state TRƯỚC KHI reload
    const savedCourseId = this.selectedCourseID;
    const savedCourseName = this.selectedCourseName;

    // Luôn reload tree để cập nhật lock/unlock status
    // (cả khi tick lẫn untick để UX nhất quán)
    this.loadAllCoursesForTree(() => {
      this.restoreSelectedTreeNode(savedCourseId, savedCourseName);
    });
  }

  // Khôi phục selected node và lessons sau khi reload tree
  private restoreSelectedTreeNode(courseId: number, courseName: string): void {
    // Tìm node trong tree mới
    const findNode = (nodes: CourseTreeNode[]): CourseTreeNode | null => {
      for (const node of nodes) {
        if (node.type === 'course' && node.course?.ID === courseId) {
          return node;
        }
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(this.courseTreeData);
    if (node) {
      this.selectedTreeNode = node;
      this.selectedCourseID = courseId;
      this.selectedCourseName = courseName;

      // Reload lessons data
      this.getLessonsByCourse(courseId);
      this.loadCourseLessonData(courseId);
    }
  }
}
