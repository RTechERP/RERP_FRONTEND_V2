import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EslConfigComponent } from './esl-config.component';

describe('EslConfigComponent', () => {
  let component: EslConfigComponent;
  let fixture: ComponentFixture<EslConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EslConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EslConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
