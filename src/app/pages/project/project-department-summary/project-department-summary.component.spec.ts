import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDepartmentSummaryComponent } from './project-department-summary.component';

describe('ProjectDepartmentSummaryComponent', () => {
  let component: ProjectDepartmentSummaryComponent;
  let fixture: ComponentFixture<ProjectDepartmentSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDepartmentSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDepartmentSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
