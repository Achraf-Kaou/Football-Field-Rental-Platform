import { Component } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { ComplexForm } from '../complex-form/complex-form';

@Component({
  selector: 'app-add-complex',
  imports: [ManagerLayout, ComplexForm],
  templateUrl: './add-complex.html',
  styleUrl: './add-complex.css',
})
export class AddComplex {

}
