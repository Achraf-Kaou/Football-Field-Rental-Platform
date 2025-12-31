import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldForm } from './field-form';

describe('FieldForm', () => {
  let component: FieldForm;
  let fixture: ComponentFixture<FieldForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
