import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakertrainingComponent } from './makertraining.component';

describe('MakertrainingComponent', () => {
  let component: MakertrainingComponent;
  let fixture: ComponentFixture<MakertrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakertrainingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakertrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
