import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakertrainingFormComponent } from './makertraining-form.component';

describe('MakertrainingFormComponent', () => {
  let component: MakertrainingFormComponent;
  let fixture: ComponentFixture<MakertrainingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakertrainingFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakertrainingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
