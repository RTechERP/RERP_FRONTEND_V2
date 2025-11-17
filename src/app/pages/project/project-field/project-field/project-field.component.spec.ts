import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFieldComponent } from './project-field.component';

describe('ProjectFieldComponent', () => {
  let component: ProjectFieldComponent;
  let fixture: ComponentFixture<ProjectFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
