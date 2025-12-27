import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryProjectJoinComponent } from './summary-project-join.component';

describe('SummaryProjectJoinComponent', () => {
  let component: SummaryProjectJoinComponent;
  let fixture: ComponentFixture<SummaryProjectJoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryProjectJoinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryProjectJoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
