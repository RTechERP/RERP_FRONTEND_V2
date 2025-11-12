import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkerComponent } from './project-worker.component';
describe('ProjectWorkerComponent', () => {
  let component: ProjectWorkerComponent;
  let fixture: ComponentFixture<ProjectWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
