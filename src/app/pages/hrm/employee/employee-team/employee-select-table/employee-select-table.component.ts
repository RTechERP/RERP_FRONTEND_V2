import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-employee-select-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './employee-select-table.component.html',
  styleUrls: ['./employee-select-table.component.css']
})
export class EmployeeSelectTableComponent implements OnInit {
  public activeModal = inject(NgbActiveModal);

  @Input() employeeList: any[] = [];
  @Input() selectedEmployeeIds: number[] = [];
  @Output() selected = new EventEmitter<any[]>();

  selectedEmployees: any[] = [];
  searchValue: string = '';

  ngOnInit(): void {
    // Sắp xếp danh sách theo phòng ban để group
    if (this.employeeList) {
      this.employeeList.sort((a, b) => (a.DepartmentName || '').localeCompare(b.DepartmentName || ''));
    }

    // Pre-select employees if needed
    if (this.selectedEmployeeIds && this.selectedEmployeeIds.length > 0) {
      this.selectedEmployees = this.employeeList.filter(emp => 
        this.selectedEmployeeIds.includes(emp.ID)
      );
    }
  }

  getDepartmentCount(departmentName: string): number {
    return this.employeeList.filter(emp => emp.DepartmentName === departmentName).length;
  }

  confirmSelection(): void {
    this.selected.emit(this.selectedEmployees);
    this.activeModal.close(this.selectedEmployees);
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}
