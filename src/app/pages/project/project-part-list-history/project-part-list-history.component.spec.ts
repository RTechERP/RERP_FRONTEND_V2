import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartListHistoryComponent } from './project-part-list-history.component';

describe('ProjectPartListHistoryComponent', () => {
  let component: ProjectPartListHistoryComponent;
  let fixture: ComponentFixture<ProjectPartListHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartListHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartListHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
