import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoverRejectreasonFormComponent } from './handover-rejectreason-form.component';

describe('HandoverRejectreasonFormComponent', () => {
  let component: HandoverRejectreasonFormComponent;
  let fixture: ComponentFixture<HandoverRejectreasonFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandoverRejectreasonFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandoverRejectreasonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
