import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSynthesisDepartmentComponent } from './project-synthesis-department.component';

describe('ProjectSynthesisDepartmentComponent', () => {
  let component: ProjectSynthesisDepartmentComponent;
  let fixture: ComponentFixture<ProjectSynthesisDepartmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSynthesisDepartmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSynthesisDepartmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
