import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingTypeFormComponent } from './meeting-type-form.component';

describe('MeetingTypeFormComponent', () => {
  let component: MeetingTypeFormComponent;
  let fixture: ComponentFixture<MeetingTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingTypeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
