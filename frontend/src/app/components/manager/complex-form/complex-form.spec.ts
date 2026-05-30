import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplexForm } from './complex-form';

describe('ComplexForm', () => {
  let component: ComplexForm;
  let fixture: ComponentFixture<ComplexForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplexForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
