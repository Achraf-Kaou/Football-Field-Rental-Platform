import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { FieldService } from '../../../services/field.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { FieldModel } from '../../../models/field.model';
import { FieldDTO } from '../../../interfaces/field.dto';
import { Field, form } from '@angular/forms/signals';
import { ImageItem } from '../../../interfaces/image-item';

@Component({
  selector: 'app-field-form',
  imports: [ManagerLayout, Field],
  templateUrl: './field-form.html',
  styleUrl: './field-form.css',
})
export class FieldForm implements OnInit{
  private fieldService = inject(FieldService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  images = signal<ImageItem[]>([]);
  nextImageId = signal(0);

  fieldId = signal<number | null>(null);
  complexId = signal<number | null>(null);
  field = signal<FieldModel | null>(null);

  isEditMode = signal(false);
  headerTitle = computed(() => this.isEditMode() ? 'Edit Field' : 'Add New Field');
  buttonText = computed(() => this.isEditMode() ? 'Update Field' : 'Create Field');
  buttonSubmittingText = computed(() => this.isEditMode() ? 'Updating...' : 'Creating...');

  fieldModel = signal<FieldDTO>({
    name: '',
    description: '',
    type: '',
    surface: 0,
    price: 0,
    status: '',
    complexId: 0,
    images: [],
  });
  fieldFrom = form(this.fieldModel);


  ngOnInit(): void {
    const fieldId = this.route.snapshot.paramMap.get('fieldId');
    if (fieldId) {
      this.isEditMode.set(true);
      this.fieldId.set(+fieldId);
      this.loadField(+fieldId);
    }
    const complexId = this.route.snapshot.paramMap.get('complexId');
    if (complexId) {
      this.complexId.set(+complexId);
    }
  }

  loadField(id: number) {
    this.fieldService.getFieldById(id).subscribe({
      next: (data) => {
        this.field.set(data);
        this.fieldModel.set({
          name: data.name,
          description: data.description,
          type: data.type,
          surface: data.surface,
          price: data.price,
          status: data.status,
          complexId: data.complexId,
          images: data.images,
        });
        const imageItems: ImageItem[] = data.images.map((url, index) => ({
          id: index,
          url: url
        }));
        this.images.set(imageItems);
        this.nextImageId.set(imageItems.length);
      },
      error: (err) => {
        this.toastService.error('Error fetching field details: ' + err.message, 3000);
      }
    });
  }

  // Add new image slot
  addImage(): void {
    const id = this.nextImageId();
    this.images.update(imgs => [...imgs, { id, url: '' }]);
    this.nextImageId.update(id => id + 1);
  }

  // Remove image
  removeImage(id: number): void {
    this.images.update(imgs => imgs.filter(img => img.id !== id));
  }

  // Handle file selection
  onImageFileSelected(event: Event, id: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const url = e.target?.result as string;
        this.images.update(imgs =>
          imgs.map(img =>
            img.id === id ? { ...img, url, file } : img
          )
        );
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle URL input
  onImageUrlChange(url: string, id: number): void {
    this.images.update(imgs =>
      imgs.map(img =>
        img.id === id ? { ...img, url, file: undefined } : img
      )
    );
  }

  // Clear image
  clearImage(id: number): void {
    this.images.update(imgs =>
      imgs.map(img =>
        img.id === id ? { ...img, url: '', file: undefined } : img
      )
    );
  }

  // Validate form
  private validateForm(): boolean {
    const model = this.fieldModel();

    if (!model.name.trim()) {
      alert('Complex name is required');
      return false;
    }

    if (!model.description.trim()) {
      alert('Address is required');
      return false;
    }

    if (!model.price || model.price <= 0) {
      alert('Valid price is required higher than 0');
      return false;
    }

    if (!model.type) {
      alert('Type field is required');
      return false;
    }

    if (!model.surface || model.surface <= 0) {
      alert('surface is required and must be higher than 0');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    console.log('Submitting form...');
    if (!this.validateForm()) {
      console.log('Form validation failed');
      alert('Please correct the errors in the form before submitting.');
      
    }
    // Prepare FieldDTO
    const fieldData: FieldDTO = {
      name: this.fieldModel().name,
      description: this.fieldModel().description,
      type: this.fieldModel().type,
      surface: this.fieldModel().surface,
      price: this.fieldModel().price,
      status: this.fieldModel().status,
      complexId: this.complexId() || 0,
      images: this.images().map(img => img.url).filter(url => url !== ''),
    };
    console.log('Submitting field:', fieldData);

    if (this.isEditMode() && this.fieldId()) {
      console.log('Updating existing field with ID:', this.fieldId());
      // Update existing field
      this.fieldService.updateField(this.fieldId()!, fieldData).subscribe({
        next: () => {
          this.toastService.success('Field updated successfully!', 3000);
          this.router.navigate(['/manager/complex', this.complexId()]);
        },
        error: (err) => {
          this.toastService.error('Error updating field: ' + err.message, 3000);
        }
      });
    } else {
      // Create new field
      this.fieldService.createField(fieldData).subscribe({
        next: () => {
          this.toastService.success('Field created successfully!', 3000);
          this.router.navigate(['/manager/complex', this.complexId()]);
        },
        error: (err) => {
          this.toastService.error('Error creating field: ' + err.message, 3000);
        }
      });
    }
  }

  // Cancel and go back
  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
          this.router.navigate(['/manager/complex'], { queryParams: { complexId: this.complexId() } });
    }
  }
}
