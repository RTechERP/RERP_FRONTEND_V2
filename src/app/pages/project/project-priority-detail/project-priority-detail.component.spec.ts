import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPriorityDetailComponent } from './project-priority-detail.component';

describe('ProjectPriorityDetailComponent', () => {
  let component: ProjectPriorityDetailComponent;
  let fixture: ComponentFixture<ProjectPriorityDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPriorityDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPriorityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
