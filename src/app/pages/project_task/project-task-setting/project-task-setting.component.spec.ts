import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskSettingComponent } from './project-task-setting.component';

describe('ProjectTaskSettingComponent', () => {
  let component: ProjectTaskSettingComponent;
  let fixture: ComponentFixture<ProjectTaskSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskSettingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
