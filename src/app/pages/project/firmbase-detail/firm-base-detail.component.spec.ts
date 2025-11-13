import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirmBaseDetailComponent } from './firm-base-detail.component';

describe('FirmBaseDetailComponent', () => {
  let component: FirmBaseDetailComponent;
  let fixture: ComponentFixture<FirmBaseDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirmBaseDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirmBaseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
