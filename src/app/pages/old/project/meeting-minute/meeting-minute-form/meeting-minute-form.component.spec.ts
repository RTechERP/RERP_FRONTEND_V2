import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingMinuteFormComponent } from './meeting-minute-form.component';

describe('MeetingMinuteFormComponent', () => {
  let component: MeetingMinuteFormComponent;
  let fixture: ComponentFixture<MeetingMinuteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingMinuteFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingMinuteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
