import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitCountDetailComponent } from './unit-count-detail.component';

describe('UnitCountDetailComponent', () => {
  let component: UnitCountDetailComponent;
  let fixture: ComponentFixture<UnitCountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitCountDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitCountDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
