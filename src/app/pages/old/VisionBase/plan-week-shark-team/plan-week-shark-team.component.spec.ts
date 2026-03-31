import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanWeekSharkTeamComponent } from './plan-week-shark-team.component';

describe('PlanWeekSharkTeamComponent', () => {
  let component: PlanWeekSharkTeamComponent;
  let fixture: ComponentFixture<PlanWeekSharkTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanWeekSharkTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanWeekSharkTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
