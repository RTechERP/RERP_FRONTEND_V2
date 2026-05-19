import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectRequestDetailComponent } from './project-request-detail.component';

describe('ProjectRequestDetailComponent', () => {
  let component: ProjectRequestDetailComponent;
  let fixture: ComponentFixture<ProjectRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
