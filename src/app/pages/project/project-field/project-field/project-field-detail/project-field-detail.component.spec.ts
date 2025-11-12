import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFieldDetailComponent } from './project-field-detail.component';

describe('ProjectFieldDetailComponent', () => {
  let component: ProjectFieldDetailComponent;
  let fixture: ComponentFixture<ProjectFieldDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFieldDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectFieldDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
