import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarlyLatePersonComponent } from './early-late-person.component';

describe('EarlyLatePersonComponent', () => {
  let component: EarlyLatePersonComponent;
  let fixture: ComponentFixture<EarlyLatePersonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarlyLatePersonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarlyLatePersonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
