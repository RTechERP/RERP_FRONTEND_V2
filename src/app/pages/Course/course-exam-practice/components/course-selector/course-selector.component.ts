import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { CourseListComponent } from '../course-list/course-list.component';
import { CourseData } from '../../course-exam-practice.types';

@Component({
    selector: 'app-course-selector',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzInputModule,
        NzIconModule,
        NzDropDownModule,
        CourseListComponent
    ],
    templateUrl: './course-selector.component.html',
    styleUrls: ['./course-selector.component.css']
})
export class CourseSelectorComponent implements OnChanges {
    @Input() allCourseData: CourseData[] = [];
    @Input() selectedCourseId: number | null = null;
    @Input() isLoading: boolean = false;
    @Input() placeholder: string = 'Chọn khoá học';

    @Output() courseSelected = new EventEmitter<CourseData>();

    selectedCourseName: string = '';
    isCourseDropdownVisible: boolean = false;

    // Specific grouping for this selector
    groupBy: any[] = [
        (data: any) => data.DepartmentName || 'Chưa có phòng ban',
        (data: any) => data.CatalogName || 'Chưa có danh mục',
    ];
    groupStartOpen: boolean[] = [true, true];
    groupHeader: any[] = [
        (value: any) => `<strong>Phòng ban: ${value}</strong>`,
        (value: any) => `<strong>Danh mục: ${value}</strong>`,
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedCourseId'] || changes['allCourseData']) {
            this.updateSelectedCourseName();
        }
    }

    updateSelectedCourseName(): void {
        if (this.selectedCourseId && this.allCourseData.length > 0) {
            const course = this.allCourseData.find(c => c.ID === this.selectedCourseId);
            this.selectedCourseName = course ? (course.Code + ' - ' + course.NameCourse) : '';
        } else {
            this.selectedCourseName = '';
        }
    }

    onCourseSelectedFromTable(course: CourseData): void {
        this.selectedCourseName = course.Code + ' - ' + course.NameCourse;
        this.isCourseDropdownVisible = false;
        this.courseSelected.emit(course);
    }
}
