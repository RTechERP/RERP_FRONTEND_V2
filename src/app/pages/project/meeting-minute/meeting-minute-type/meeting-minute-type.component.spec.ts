import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingMinuteTypeComponent } from './meeting-minute-type.component';

describe('MeetingMinuteTypeComponent', () => {
  let component: MeetingMinuteTypeComponent;
  let fixture: ComponentFixture<MeetingMinuteTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingMinuteTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingMinuteTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
