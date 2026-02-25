import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CourseData, Employee, CourseLesson, ExamTypeCheck, ExamResult, ExamPracticeResult, SavePracticeEvaluationParam } from '../course-exam-practice.types';

@Injectable({
    providedIn: 'root'
})
export class CourseExamPracticeService {
    private apiUrl = environment.host + 'api/CourseExamPractice/';

    constructor(private http: HttpClient) { }

    // Load khóa học
    getCourseData(employeeID?: number): Observable<{ status: number, data: CourseData[], message: string }> {
        let params = new HttpParams();
        if (employeeID !== undefined && employeeID !== null) {
            params = params.set('employeeID', employeeID.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-course-data', { params });
    }

    // load khóa học new
    getCourseNew(): Observable<any> {
        return this.http.get<any>(this.apiUrl + `get-course-new`);
    }


    // Load nhân viên
    getEmployeeData(): Observable<{ status: number, data: Employee[], message: string }> {
        return this.http.get<any>(this.apiUrl + 'get-employee-data');
    }

    // Load đề thi
    getCourseExam(courseID?: number): Observable<{ status: number, data: any[], message: string }> {
        let params = new HttpParams();
        if (courseID !== undefined && courseID !== null) {
            params = params.set('courseID', courseID.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-course-exam', { params });
    }

    // Check exam types availability for course
    getCheckCourseExam(courseID?: number): Observable<{ status: number, data: ExamTypeCheck, message: string }> {
        let params = new HttpParams();
        if (courseID !== undefined && courseID !== null) {
            params = params.set('courseID', courseID.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-check-course-exam', { params });
    }

    // Load course exam practice results (TN, TH, BT)
    getCourseExamPractice(courseId?: number, employeeId?: number): Observable<{ status: number, data: { TracNhiem: ExamResult[], ThucHanh: ExamPracticeResult[], BaiTap: ExamPracticeResult[] }, message: string }> {
        let params = new HttpParams();
        if (courseId !== undefined && courseId !== null) {
            params = params.set('courseId', courseId.toString());
        }
        if (employeeId !== undefined && employeeId !== null) {
            params = params.set('employeeId', employeeId.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-course-exam-practice', { params });
    }

    // Delete course exam practice result
    deleteCourseExamPractice(id: number): Observable<{ status: number, data: any, message: string }> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.post<any>(this.apiUrl + 'delete-course-exam-practice', {}, { params });
    }

    // Evaluate results (pass/fail)
    evaluateResults(lstId: string, evaluate: boolean): Observable<{ status: number, data: any, message: string }> {
        let params = new HttpParams().set('lstId', lstId.toString())
            .set('evaluate', evaluate.toString());
        return this.http.post<any>(this.apiUrl + 'course-exam-results-evaluate', {}, { params });
    }

    // Load course lessons
    getCourseLessons(courseID?: number): Observable<{ status: number, data: CourseLesson[], message: string }> {
        let params = new HttpParams();
        if (courseID !== undefined && courseID !== null) {
            params = params.set('courseID', courseID.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-course-lessons', { params });
    }

    // Load lesson exam results (TN, TH, BT)
    getLessonExamResult(lessonId?: number, employeeId?: number): Observable<{ status: number, data: { TracNhiem: ExamResult[], ThucHanh: ExamPracticeResult[], BaiTap: ExamPracticeResult[] }, message: string }> {
        let params = new HttpParams();
        if (lessonId !== undefined && lessonId !== null) {
            params = params.set('lessonId', lessonId.toString());
        }
        if (employeeId !== undefined && employeeId !== null) {
            params = params.set('employeeId', employeeId.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-lesson-exam-result', { params });
    }

    // Check lesson exam types availability
    getCheckLessonExam(lessonID?: number): Observable<{ status: number, data: ExamTypeCheck, message: string }> {
        let params = new HttpParams();
        if (lessonID !== undefined && lessonID !== null) {
            params = params.set('lessonID', lessonID.toString());
        }
        return this.http.get<any>(this.apiUrl + 'get-check-lesson-exam', { params });
    }

    saveCourseExamPractice(data: any): Observable<{ status: number, data: any, message: string }> {
        return this.http.post<any>(this.apiUrl + 'save-course-exam-practice', data);
    }

    getCourseExamResultById(id: number): Observable<{ status: number, data: any, message: string }> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<any>(this.apiUrl + 'get-course-exam-result-by-id', { params });
    }

    getExamResultDetail(courseID: number, courseResultID: number, employeeID: number, courseExamID: number): Observable<{ status: number, data: any[], message: string }> {
        let params = new HttpParams()
            .set('courseID', courseID.toString())
            .set('courseResultID', courseResultID.toString())
            .set('employeeID', employeeID.toString())
            .set('courseExamID', courseExamID.toString());
        return this.http.get<any>(this.apiUrl + 'get-exam-result-detail', { params });
    }

    // Get practice exam result history for an employee (spGetResultHistoryPractice)
    getPracticeResultHistory(employeeId: number, courseExamId: number): Observable<{ status: number, data: any[], message: string }> {
        let params = new HttpParams()
            .set('employeeId', employeeId.toString())
            .set('courseExamId', courseExamId.toString());
        return this.http.get<any>(this.apiUrl + 'get-practice-result-history', { params });
    }

    // Get evaluation details for a specific practice exam result (spGetResultHistoryByPractice)
    getPracticeEvaluationDetails(courseExamId: number, employeeId: number, courseResultId: number): Observable<{ status: number, data: any[], message: string }> {
        let params = new HttpParams()
            .set('courseExamId', courseExamId.toString())
            .set('employeeId', employeeId.toString())
            .set('courseResultId', courseResultId.toString());
        return this.http.get<any>(this.apiUrl + 'get-practice-evaluation-details', { params });
    }

    // Save practice evaluation (update points and notes)
    savePracticeEvaluation(evaluationData: SavePracticeEvaluationParam): Observable<{ status: number, data: any, message: string }> {
        return this.http.post<any>(this.apiUrl + 'save-practice-evaluation', evaluationData);
    }
}
