import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoverMinutesComponent } from './handover-minutes.component';

describe('HandoverMinutesComponent', () => {
  let component: HandoverMinutesComponent;
  let fixture: ComponentFixture<HandoverMinutesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandoverMinutesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandoverMinutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
