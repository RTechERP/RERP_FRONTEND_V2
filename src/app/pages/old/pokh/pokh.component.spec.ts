import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokhComponent } from './pokh.component';

describe('PokhComponent', () => {
  let component: PokhComponent;
  let fixture: ComponentFixture<PokhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
