import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplexOverview } from './complex-overview';

describe('ComplexOverview', () => {
  let component: ComplexOverview;
  let fixture: ComponentFixture<ComplexOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplexOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
