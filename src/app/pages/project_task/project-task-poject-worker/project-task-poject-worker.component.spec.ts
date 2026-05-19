import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NzNotificationModule } from 'ng-zorro-antd/notification';

import { ProjectTaskPojectWorkerComponent } from './project-task-poject-worker.component';

describe('ProjectTaskPojectWorkerComponent', () => {
  let component: ProjectTaskPojectWorkerComponent;
  let fixture: ComponentFixture<ProjectTaskPojectWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProjectTaskPojectWorkerComponent,
        HttpClientTestingModule,
        NzNotificationModule,
        NoopAnimationsModule,
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskPojectWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
