export interface CopyCourseCatalogCounts {
  CatalogProjectTypes: number;
  Courses: number;
  CourseKpiMaps: number;
  Lessons: number;
  CourseFiles: number;
  Exams: number;
  Questions: number;
  Answers: number;
  RightAnswers: number;
}

export interface CopyCourseCatalogPreview {
  SourceCatalog: {
    ID: number;
    Code: string;
    Name: string;
    DepartmentID: number;
    CatalogType: number;
    ProjectTypeIDs: number[];
  };
  Counts: CopyCourseCatalogCounts;
}

export interface CopyCourseCatalogRequest {
  SourceCatalogId: number;
  NewCode: string;
  NewName: string;
  DepartmentId: number;
  CatalogType: number;
  ProjectTypeIds: number[];
}

export interface CopyCourseCatalogResult {
  NewCatalogId: number;
  Counts: CopyCourseCatalogCounts;
}

// Move Course Catalog Types
export interface MoveCourseCatalogRequest {
  SourceCatalogId: number;
  TargetDepartmentId: number;
  TargetCatalogType: number;
  ProjectTypeIds: number[];
}

export interface MoveCourseCatalogResult {
  MovedCatalogId: number;
  Counts: MoveCourseCatalogCounts;
}

export interface MoveCourseCatalogPreview {
  SourceCatalog: {
    ID: number;
    Code: string;
    Name: string;
    DepartmentID: number;
    CatalogType: number;
    ProjectTypeIDs: number[];
  };
  Counts: MoveCourseCatalogCounts;
}

export interface MoveCourseCatalogCounts {
  CatalogProjectTypes: number;
  Courses: number;
  CourseKpiMaps: number;
  Lessons: number;
  CourseFiles: number;
  Exams: number;
  Questions: number;
  Answers: number;
  RightAnswers: number;
}

// Copy Course Types
export interface CopyCourseCounts {
  Lessons: number;
  CourseFiles: number;
  Exams: number;
  Questions: number;
  Answers: number;
  RightAnswers: number;
}

export interface CopyCoursePreview {
  SourceCourse: {
    ID: number;
    Code: string;
    NameCourse: string;
    CourseCatalogID: number;
    CourseCatalogName: string;
    CatalogType: number;
  };
  Counts: CopyCourseCounts;
}

export interface CopyCourseRequest {
  SourceCourseId: number;
  NewCode: string;
  NewName: string;
  TargetCatalogId: number;
}

export interface CopyCourseResult {
  NewCourseId: number;
  Counts: CopyCourseCounts;
}

// Copy Lesson Types
export interface CopyLessonCounts {
  Files: number;
  Exams: number;
  Questions: number;
  Answers: number;
  RightAnswers: number;
}

export interface CopyLessonPreview {
  SourceLesson: {
    ID: number;
    Code: string;
    LessonTitle: string;
    LessonContent: string;
    CourseID: number;
    CourseName: string;
    Duration: number;
    VideoURL: string;
    UrlPDF: string;
  };
  Counts: CopyLessonCounts;
}

export interface CopyLessonRequest {
  SourceLessonId: number;
  NewCode: string;
  NewName: string;
  TargetCourseId: number;
}

export interface CopyLessonResult {
  NewLessonId: number;
  Counts: CopyLessonCounts;
}
