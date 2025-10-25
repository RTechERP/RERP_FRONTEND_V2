import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynthesisOfGeneratedMaterialsComponent } from './synthesis-of-generated-materials.component';

describe('SynthesisOfGeneratedMaterialsComponent', () => {
  let component: SynthesisOfGeneratedMaterialsComponent;
  let fixture: ComponentFixture<SynthesisOfGeneratedMaterialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SynthesisOfGeneratedMaterialsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SynthesisOfGeneratedMaterialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
