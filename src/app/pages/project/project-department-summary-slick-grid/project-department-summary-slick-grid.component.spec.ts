import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDepartmentSummarySlickGridComponent } from './project-department-summary-slick-grid.component';

describe('ProjectDepartmentSummarySlickGridComponent', () => {
  let component: ProjectDepartmentSummarySlickGridComponent;
  let fixture: ComponentFixture<ProjectDepartmentSummarySlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDepartmentSummarySlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDepartmentSummarySlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
