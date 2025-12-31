import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddComplex } from './add-complex';

describe('AddComplex', () => {
  let component: AddComplex;
  let fixture: ComponentFixture<AddComplex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddComplex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddComplex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
