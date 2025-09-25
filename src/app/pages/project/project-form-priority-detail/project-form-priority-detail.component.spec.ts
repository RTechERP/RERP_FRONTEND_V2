import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFormPriorityDetailComponent } from './project-form-priority-detail.component';

describe('ProjectFormPriorityDetailComponent', () => {
  let component: ProjectFormPriorityDetailComponent;
  let fixture: ComponentFixture<ProjectFormPriorityDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormPriorityDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectFormPriorityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
