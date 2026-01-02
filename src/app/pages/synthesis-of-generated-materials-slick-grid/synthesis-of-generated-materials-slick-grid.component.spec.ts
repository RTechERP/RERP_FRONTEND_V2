import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynthesisOfGeneratedMaterialsSlickGridComponent } from './synthesis-of-generated-materials-slick-grid.component';

describe('SynthesisOfGeneratedMaterialsSlickGridComponent', () => {
  let component: SynthesisOfGeneratedMaterialsSlickGridComponent;
  let fixture: ComponentFixture<SynthesisOfGeneratedMaterialsSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SynthesisOfGeneratedMaterialsSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SynthesisOfGeneratedMaterialsSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
