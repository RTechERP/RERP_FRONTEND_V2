import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanWeekDetailComponent } from './plan-week-detail.component';

describe('PlanWeekDetailComponent', () => {
  let component: PlanWeekDetailComponent;
  let fixture: ComponentFixture<PlanWeekDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanWeekDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanWeekDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
