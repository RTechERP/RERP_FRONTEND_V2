import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueStatusDetailComponent } from './issue-status-detail.component';

describe('IssueStatusDetailComponent', () => {
  let component: IssueStatusDetailComponent;
  let fixture: ComponentFixture<IssueStatusDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueStatusDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueStatusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
