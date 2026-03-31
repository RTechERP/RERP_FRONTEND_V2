import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanWeekSharkTeamDetailComponent } from './plan-week-shark-team-detail.component';

describe('PlanWeekSharkTeamDetailComponent', () => {
  let component: PlanWeekSharkTeamDetailComponent;
  let fixture: ComponentFixture<PlanWeekSharkTeamDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanWeekSharkTeamDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanWeekSharkTeamDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
