
import { List } from 'gojs';
import { DateTime } from 'luxon';

export interface CourseData {
    ID: number;
    STT?: number;
    Code?: string;
    NameCourse?: string;
    Instructor?: string;
    CourseCatalogID?: number;
    DeleteFlag?: boolean;
    FileCourseID?: number;
    IsPractice?: boolean;
    CreateBy?: string;
    CreateDate?: DateTime;
    UpdateBy?: string;
    UpdateDate?: DateTime;
    QuestionCount?: number;
    QuestionDuration?: number;
    LeadTime?: number;
    CourseCopyID?: number;
    CourseTypeID?: number;
    EmployeeID?: number;
    CatalogName?: string;
    DepartmentName?: string;
    CatalogTypeText?: string;
    CourseCatalogSTT?: number;
}
//
export interface Employee {
    ID: number;
    FullName: string;
    Code?: string;
    DepartmentName?: string;
    Status?: number;
}
// api/courseexampractice/get-course-exam
export interface ExamData {
    Code?: string;
    NameCourse?: string;
    ID?: number;
    CourseId?: number;
    NameExam?: string;
    CodeExam?: string;
    Goal?: number;
    TestTime?: number;
    ExamType?: string;
    CreateBy?: string;
    CreateDate?: DateTime;
    UpdateBy?: string;
    UpdateDate?: DateTime;
    LessonID?: number;
    ExamTypeText?: string;
}

// api/courseexampractice/get-check-course-exam
// api/courseexampractice/get-check-lesson-exam
export interface ExamTypeCheck {
    HasExamType1: boolean; // Multiple Choice (Trắc nghiệm)
    HasExamType2: boolean; // Practice (Thực hành)
    HasExamType3: boolean; // Exercise (Bài tập)
}

// api/courseexampractice/get-course-exam-practice
// api/courseexampractice/get-lesson-exam-result
export interface CourseExamPractice {
    TracNhiem: ExamResult[];
    ThucHanh: ExamPracticeResult[];
    BaiTap: ExamPracticeResult[];
}
// ExamResult
export interface ExamResult {
    ID: number;
    NameExam?: string;
    TotalQuestion?: number;
    CourseExamId?: number;
    EmployeeId?: number;
    TotalCorrect?: number;
    TotalIncorrect?: number;
    PercentageCorrect?: number;
    CreatedBy?: string;
    CreatedDate?: DateTime;
    UpdatedBy?: string;
    UpdatedDate?: DateTime;
    FullName?: string;
    CodeExam?: string;
    TotalChosen?: number;
    Code?: string;
    ExamType?: number;
    ExamTypeText?: string;
    Score?: number;
    TestTime?: number;
    CourseID?: number;
    StatusText?: string;
    Status?: number;
    NameCourse?: string;
    Goal?: number;
    OrderNumber?: number;
    RowNumber?: number;
}
//ExamPracticeResult
export interface ExamPracticeResult {
    FullName?: string;
    UpdatedBy?: string;
    ID: number;
    Goal?: number;
    CreatedDate?: DateTime;
    CourseExamId?: number;
    TotalQuestion?: number;
    StatusText?: string;
    PracticePoints?: number;
    Evaluate?: boolean;
    EmployeeId?: number;
    RowNum?: number;
    Status?: number;
    RowNumber?: number;
}

export interface CourseExamResult extends ExamResult, ExamPracticeResult {
    // UI-specific or missing fields from API / Aliases for component compatibility
    TotalQuestions?: number;   // Alias for TotalQuestion
    CorrectAnswers?: number;   // Alias for TotalCorrect
    PassScore?: number;        // Alias for Goal
    SubmissionDate?: string | DateTime;
    PracticeContent?: string;
    ExerciseContent?: string;
    EvaluateText?: string;
    DateEnd?: DateTime;
    Note?: string;
}

// api/courseexampractice/get-course-lessons
export interface CourseLesson {
    ID: number;
    Code?: string;
    LessonTitle?: string;
    LessonContent?: string;
    Duration?: number;
    VideoURL?: string;
    CreatedBy?: string;
    CreatedDate?: DateTime;
    UpdatedBy?: string;
    UpdatedDate?: DateTime;
    STT?: number;
    CourseID?: number;
    FileCourseID?: number;
    UrlPDF?: string;
    LessonCopyID?: number | null;
    IsDeleted?: boolean;
    EmployeeID?: number;
}

export interface ExamResultDetail {
    Code?: string;
    NameCourse?: string;
    CodeExam?: string;
    ID?: number;
    STT?: number;
    QuestionText?: string;
    CodeAnswerRight?: string;
    CodeAnswerChosen?: string;
    TotalRightAnswer?: number;
    TotalChosenAnswer?: number;
    CheckResult?: number;
    Result?: number;
    ResultText?: string;
    FullName?: string;
    AnswerText?: string;
}


// Practice exam result history item (for left panel in practice details modal)
export interface PracticeResultHistory {
    ID: number;
    CreatedDate?: DateTime;
    Note?: string;
    FullName?: string;
    Goal?: number;
    PracticePoints?: number;
    StatusText?: string;
}

// Practice evaluation detail (editable question in right panel)
export interface PracticeEvaluationDetail {
    Point?: number;  // 0-10 scale, editable
    CourseExamEvaluateID: number;
    ID: number;
    Note?: string;   // Editable
    STT?: number;
    QuestionText?: string;
    StatusText?: string;
    CreatedDate?: DateTime;
}
// Payload for saving practice evaluation
export interface SavePracticeEvaluationParam {
    CourseId: number;
    ExamType: number; // 2: Practice, 3: Exercise
    CourseExamResult: {
        ID: number;
        CourseExamId: number;
        EmployeeId: number;
        PracticePoints?: number;
        Evaluate?: boolean;
        Note?: string;
    };
    Evaluations: CourseExamEvaluate[];
}
// CourseExamEvaluate
export interface CourseExamEvaluate {
    ID?: number;
    CourseExamResultID?: number;
    CourseQuestionID?: number;
    Point?: number;
    Evaluate?: boolean;
    Note?: string;
    DateCompleted?: DateTime;
    DateEvaluate?: DateTime;
}