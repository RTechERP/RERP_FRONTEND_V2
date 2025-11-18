import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectItemFileComponent } from './project-item-file.component';

describe('ProjectItemFileComponent', () => {
  let component: ProjectItemFileComponent;
  let fixture: ComponentFixture<ProjectItemFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectItemFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectItemFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
