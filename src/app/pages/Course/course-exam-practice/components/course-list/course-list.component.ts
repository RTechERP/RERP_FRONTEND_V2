import { Component, OnInit, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseData } from '../../course-exam-practice.types';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface TreeNode {
    name: string;
    isCollapsed: boolean;
    courseCount: number;
    children: TreeNode[];
    course?: CourseData;
}

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CommonModule, NzSpinModule, NzIconModule, NzTagModule],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit, OnChanges {
    @Input() data: CourseData[] = [];
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() courseSelected = new EventEmitter<CourseData>();

    treeData: TreeNode[] = [];
    selectedCourseId: number | null = null;

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data'] && this.data) {
            this.buildTreeData(this.data);
            if (this.autoSelectFirst && this.data.length > 0 && this.selectedCourseId === null) {
                this.selectFirstCourse();
            }
        }
    }

    private buildTreeData(courses: CourseData[]): void {
        const deptMap = new Map<string, TreeNode>();

        for (const course of courses) {
            const deptName = course.DepartmentName || 'Chưa có phòng ban';
            const catalogType = course.CatalogTypeText || 'Chưa phân loại';
            const catalogName = course.CatalogName || 'Chưa có danh mục';

            if (!deptMap.has(deptName)) {
                deptMap.set(deptName, {
                    name: deptName,
                    isCollapsed: false,
                    courseCount: 0,
                    children: []
                });
            }
            const deptNode = deptMap.get(deptName)!;

            let catTypeNode = deptNode.children.find(c => c.name === catalogType);
            if (!catTypeNode) {
                catTypeNode = { name: catalogType, isCollapsed: false, courseCount: 0, children: [] };
                deptNode.children.push(catTypeNode);
            }

            let catalogNode = catTypeNode.children.find(c => c.name === catalogName);
            if (!catalogNode) {
                catalogNode = { name: catalogName, isCollapsed: true, courseCount: 0, children: [] };
                catTypeNode.children.push(catalogNode);
            }

            const courseNode: TreeNode = {
                name: course.NameCourse || '',
                isCollapsed: false,
                courseCount: 1,
                children: [],
                course: course
            };
            catalogNode.children.push(courseNode);

            catalogNode.courseCount++;
            catTypeNode.courseCount++;
            deptNode.courseCount++;
        }

        this.treeData = Array.from(deptMap.values());
    }

    toggleNode(node: TreeNode, event: Event): void {
        event.stopPropagation();
        node.isCollapsed = !node.isCollapsed;
    }

    selectCourse(courseNode: TreeNode, event: Event): void {
        event.stopPropagation();
        this.selectedCourseId = courseNode.course?.ID || null;
        if (courseNode.course) {
            this.courseSelected.emit(courseNode.course);
        }
    }

    isSelected(courseNode: TreeNode): boolean {
        return courseNode.course?.ID === this.selectedCourseId;
    }

    getCatalogColor(typeName: string): string {
        const colors: Record<string, string> = {
            'CƠ BẢN': 'green',
            'NÂNG CAO': 'orange',
            'BẮT BUỘC': 'red'
        };
        return colors[typeName] || 'default';
    }

    getCatalogTypeClass(typeName: string): string {
        const typeMap: Record<string, string> = {
            'CƠ BẢN': 'type-co-ban',
            'NÂNG CAO': 'type-nang-cao',
            'BẮT BUỘC': 'type-bat-buoc'
        };
        return typeMap[typeName] || '';
    }

    private selectFirstCourse(): void {
        for (const deptNode of this.treeData) {
            for (const catTypeNode of deptNode.children) {
                for (const catNode of catTypeNode.children) {
                    if (catNode.children.length > 0) {
                        const firstCourse = catNode.children[0];
                        if (firstCourse.course) {
                            this.selectedCourseId = firstCourse.course.ID;
                            this.courseSelected.emit(firstCourse.course);
                            return;
                        }
                    }
                }
            }
        }
    }
}
