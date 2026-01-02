import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingMinuteSlickGridComponent } from './meeting-minute-slick-grid.component';

describe('MeetingMinuteSlickGridComponent', () => {
  let component: MeetingMinuteSlickGridComponent;
  let fixture: ComponentFixture<MeetingMinuteSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingMinuteSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingMinuteSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
