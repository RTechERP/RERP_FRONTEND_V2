import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { ProjectInfoService, IEmployee, IProject } from './project-info.service';

@Component({
  selector: 'app-project-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzPopoverModule,
    NzAvatarModule
  ],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.css'
})
export class ProjectInfoComponent implements OnInit {
  // Form fields
  projectName: string = '';
  departmentType: number | null = null;
  description: string = '';
  selectedIcon: string = 'message';
  selectedColor: string = '#4CAF50';
  startDate?: Date;
  endDate?: Date;
  priority: 'high' | 'medium' | 'low' | null = null;
  selectedMembers: any[] = [];
  searchText: string = '';

  // Department options
  departmentOptions = [
    { value: 1, label: 'Cá nhân' },
    { value: 2, label: 'Chung' }
  ];

  // Search results
  employees: any[] = [];
  filteredEmployees: any[] = [];

  // Icon picker visibility
  showIconPicker = false;

  // Fixed icon list (matching the image)
  iconList: string[] = [
    'diamond', 'arrow-up', 'edit', 'heart', 'clock-circle', 'check-circle',
    'message', 'heart', 'team', 'star', 'picture', 'sound',
    'like', 'eye', 'link', 'fork', 'setting', 'notification'
  ];

  // Fixed color list (matching the image)
  colorList: string[] = [
    '#1890ff', '#00bfa5', '#4CAF50',
    '#ff7875', '#faad14', '#fa8c16',
    '#ff4d4f', '#eb2f96', '#722ed1'
  ];

  // Priority options with colors
  priorityOptions = [
    { value: 'high', label: 'Cao', bgColor: '#ff4d4f', color: '#ffffffff' },
    { value: 'medium', label: 'Vừa', bgColor: '#fa8c16', color: '#ffffffff' },
    { value: 'low', label: 'Thấp', bgColor: '#1890ff', color: '#ffffffff' }
  ];

  constructor(
    private projectService: ProjectInfoService,
    private modalRef: NzModalRef
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.projectService.getEmployees().subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.employees = res.data || [];
          this.filteredEmployees = this.employees;
          console.log(this.employees);
        }
      }
    });
  }

  // Icon & Color picker methods
  selectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  confirmIconColor(): void {
    this.showIconPicker = false;
  }

  cancelIconColor(): void {
    this.showIconPicker = false;
  }

  // Member management
  searchEmployees(): void {
    if (!this.searchText.trim()) {
      this.filteredEmployees = this.employees.filter(
        e => !this.selectedMembers.some(m => m.ID === e.ID)
      );
      return;
    }

    const search = this.searchText.toLowerCase();
    this.filteredEmployees = this.employees.filter(e =>
      ((e.FullName?.toLowerCase() ?? '').includes(search) 
      // ||(e.Code?.toLowerCase() ?? '').includes(search) 
        &&
      !this.selectedMembers.some(m => m.ID === e.ID))
    );
  }

  addMember(employee: IEmployee): void {
    if (!this.selectedMembers.some(m => m.ID === employee.ID)) {
      this.selectedMembers.push(employee);
      this.searchText = '';
      this.searchEmployees();
    }
  }

  removeMember(employee: IEmployee): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.ID !== employee.ID);
    this.searchEmployees();
  }

  // Get initials for avatar
  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  // Get priority display
  getPriorityOption(value: string) {
    return this.priorityOptions.find(p => p.value === value);
  }

  // Form actions
  save(): void {
    if (!this.projectName.trim()) {
      return;
    }

    const project: IProject = {
      ProjectName: this.projectName,
      Description: this.description,
      Icon: this.selectedIcon,
      Color: this.selectedColor,
      StartDate: this.startDate,
      EndDate: this.endDate,
      Priority: this.priority || 'medium',
      Members: this.selectedMembers
    };

    this.projectService.createProject(project).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.modalRef.close(res.data);
        }
      },
      error: (err) => console.error('Error creating project', err)
    });
  }

  cancel(): void {
    this.modalRef.close();
  }


}
