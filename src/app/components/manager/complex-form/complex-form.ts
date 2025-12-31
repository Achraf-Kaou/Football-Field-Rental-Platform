import { Component, inject, signal } from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { ComplexService } from '../../../services/complex.service';
import { Router } from '@angular/router';
import { ComplexDTO } from '../../../interfaces/complex.dto';

interface ImageItem {
  id: number;
  url: string;
  file?: File;
}

@Component({
  selector: 'app-complex-form',
  imports: [Field],
  templateUrl: './complex-form.html',
  styleUrl: './complex-form.css',
})

export class ComplexForm {
  private complexService = inject(ComplexService);
  private router = inject(Router);

  // Images management
  images = signal<ImageItem[]>([]);
  nextImageId = signal(0);
  isSubmitting = signal(false);

  // Form model
  complexModel = signal<ComplexDTO>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    images: [],
    tags: [],
    openAt: '08:00',
    closeAt: '22:00',
  });

  complexForm = form(this.complexModel);

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

  // Pin location on map
  pinLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location:', position.coords.latitude, position.coords.longitude);
          alert(`Location pinned: ${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  }

  // Toggle amenity tag
  toggleTag(tag: string): void {
    this.complexModel.update(model => {
      const tags = model.tags || [];
      const index = tags.indexOf(tag);

      if (index > -1) {
        // Remove tag
        return {
          ...model,
          tags: tags.filter(t => t !== tag)
        };
      } else {
        // Add tag
        return {
          ...model,
          tags: [...tags, tag]
        };
      }
    });
  }

  // Check if tag is selected
  hasTag(tag: string): boolean {
    return this.complexModel().tags?.includes(tag) || false;
  }

  // Validate form
  private validateForm(): boolean {
    const model = this.complexModel();

    if (!model.name.trim()) {
      alert('Complex name is required');
      return false;
    }

    if (!model.address.trim()) {
      alert('Address is required');
      return false;
    }

    if (!model.phone.trim()) {
      alert('Contact phone is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!model.email.trim() || !emailRegex.test(model.email)) {
      alert('Valid business email is required');
      return false;
    }

    if (!model.openAt) {
      alert('Opening time is required');
      return false;
    }

    if (!model.closeAt) {
      alert('Closing time is required');
      return false;
    }

    return true;
  }

  // Submit form
  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Collect all valid image URLs
      const imageUrls = this.images()
        .filter(img => img.url)
        .map(img => img.url);

      // Update model with images
      const formData: ComplexDTO = {
        ...this.complexModel(),
        images: imageUrls
      };

      console.log(formData);

      // Submit to service
      await this.complexService.createComplex(formData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          alert('Complex created successfully!');
          this.router.navigate(['/manager/complexes']);
        },
        error: (error) => {
          console.error('Error creating complex:', error);
          alert('Failed to create complex. Please try again.');
          this.isSubmitting.set(false);
        }
      });

    } catch (error) {
      console.error('Error creating complex:', error);
      alert('Failed to create complex. Please try again.');
    } finally {
      /* this.isSubmitting.set(false); */
    }
  }

  // Cancel and go back
  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/manager/complexes']);
    }
  }
}