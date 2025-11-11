import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCauseDetailComponent } from './issue-cause-detail.component';

describe('IssueCauseDetailComponent', () => {
  let component: IssueCauseDetailComponent;
  let fixture: ComponentFixture<IssueCauseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCauseDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueCauseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
