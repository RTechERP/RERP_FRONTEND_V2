import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPoVersionDetailComponent } from '../../../proeject-department-summary/project-po-version-detail/project-po-version-detail.component';

describe('ProjectPoVersionDetailComponent', () => {
  let component: ProjectPoVersionDetailComponent;
  let fixture: ComponentFixture<ProjectPoVersionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPoVersionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPoVersionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
