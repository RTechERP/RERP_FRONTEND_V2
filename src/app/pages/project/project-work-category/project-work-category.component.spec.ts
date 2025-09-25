import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkCategoryComponent } from './project-work-category.component';

describe('ProjectWorkCategoryComponent', () => {
  let component: ProjectWorkCategoryComponent;
  let fixture: ComponentFixture<ProjectWorkCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
