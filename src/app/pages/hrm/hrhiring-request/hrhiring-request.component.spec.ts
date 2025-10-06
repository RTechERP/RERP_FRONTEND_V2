import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrhiringRequestComponent } from './hrhiring-request.component';

describe('HrhiringRequestComponent', () => {
  let component: HrhiringRequestComponent;
  let fixture: ComponentFixture<HrhiringRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrhiringRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrhiringRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
