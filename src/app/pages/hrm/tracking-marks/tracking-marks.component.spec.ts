import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingMarksComponent } from './tracking-marks.component';

describe('TrackingMarksComponent', () => {
  let component: TrackingMarksComponent;
  let fixture: ComponentFixture<TrackingMarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingMarksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingMarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
