import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrhiringRequestDetailComponent } from './hrhiring-request-detail.component';

describe('HrhiringRequestDetailComponent', () => {
  let component: HrhiringRequestDetailComponent;
  let fixture: ComponentFixture<HrhiringRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrhiringRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrhiringRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
