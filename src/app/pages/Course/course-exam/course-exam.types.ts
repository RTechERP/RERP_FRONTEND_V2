
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

export interface QuestionData {
    1?: string;
    2?: string;
    3?: string;
    4?: string;
    ID: number;
    QuestionText?: string;
    STT?: number;
    CourseExamId?: number;
    CheckInput?: number;
    Marks?: number;
    CreateBy?: string;
    CreateDate?: DateTime;
    UpdateBy?: string;
    UpdateDate?: DateTime;
    Image?: string;
    CourseQuestionId?: number;
}

export interface AnswerData {
    AnswerText?: string;
    CourseQuestionID: number;
    AnswerCaption?: string;
}

export interface CourseAnswerModel {
    ID?: number;
    AnswerText: string;
    CourseQuestionId?: number;
    AnswerNumber: number;
    Code?: string; // A, B, C, D
}

export interface CourseRightAnswerModel {
    ID?: number;
    CourseQuestionID: number;
    CourseAnswerID: number;
}

export interface AnswerItem {
    ID?: number;
    AnswerNumber: number;
    Code: string; // A, B, C, D
    AnswerText: string;
    RightAnswer: boolean;
    IsRightAnswer?: boolean; // For backend DTO mapping
    CourseQuestionId?: number;
}

export interface QuestionSavePayload {
    ID?: number;
    QuestionText: string;
    STT: number;
    CourseExamId: number;
    CheckInput: number;
    Image?: string;
    Answers?: AnswerItem[];
}



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

export interface LessonData {
    ID: number;
    CourseId?: number;
    NameExam?: string;
    CodeExam?: string;
    Goal?: number;
    TestTime?: number;
    ExamType?: number;
    CreateBy?: string;
    CreateDate?: DateTime;
    UpdateBy?: string;
    UpdateDate?: DateTime;
    LessonID?: number;
    LessonCode?: string;
    ExamTypeText?: string;
}

export interface CourseLesson {
    ID: number;
    Code: string;
    LessonTitle: string;
    LessonContent: string;
    Duration: number;
    VideoURL: string;
    CreatedBy: string;
    CreatedDate: DateTime;
    UpdatedBy: string;
    UpdatedDate: DateTime;
    STT: number;
    CourseID: number;
    FileCourseID: number;
    UrlPDF: string;
    LessonCopyID: number | null;
    IsDeleted: boolean;
    EmployeeID: number;
}

export interface SaveCourseQuestionPayload {
    ExamType: number;
    Question: QuestionData;
    Answers: AnswerItem[];
    DeleteAnswerIds: number[];
}
