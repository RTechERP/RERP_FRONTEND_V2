import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPokhComponent } from './view-pokh.component';

describe('ViewPokhComponent', () => {
  let component: ViewPokhComponent;
  let fixture: ComponentFixture<ViewPokhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewPokhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPokhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
