import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitCountComponent } from './unit-count.component';

describe('UnitCountComponent', () => {
  let component: UnitCountComponent;
  let fixture: ComponentFixture<UnitCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitCountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
