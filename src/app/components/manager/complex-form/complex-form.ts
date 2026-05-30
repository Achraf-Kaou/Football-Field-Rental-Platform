import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Field, form } from '@angular/forms/signals';
import { ComplexService } from '../../../services/complex.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplexDTO } from '../../../interfaces/complex.dto';
import { ToastService } from '../../../services/toast.service';
import { Complex } from '../../../models/complex.model';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { ImageItem } from '../../../interfaces/image-item';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-complex-form',
  imports: [Field, ManagerLayout],
  templateUrl: './complex-form.html',
  styleUrl: './complex-form.css',
})

export class ComplexForm implements OnInit {
  private complexService = inject(ComplexService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Images management
  images = signal<ImageItem[]>([]);
  nextImageId = signal(0);
  isSubmitting = signal(false);
  user=this.authService.currentUser();

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
    userId: this.user?.id || 0
  });

  complexForm = form(this.complexModel);

  complex = signal<Complex | null>(null);
  complexId = signal<number | null>(null);
  isEditMode = signal(false);

  headerTitle = computed(() => this.isEditMode() ? 'Edit Complex' : 'Add New Complex');
  buttonText = computed(() => this.isEditMode() ? 'Update Complex' : 'Create Complex');
  buttonSubmittingText = computed(() => this.isEditMode() ? 'Updating...' : 'Creating...');
  ngOnInit(): void {
    const complexId = this.activatedRoute.snapshot.paramMap.get('id');
    if (complexId) {
      this.isEditMode.set(true);
      this.complexId.set(+complexId);
      this.loadComplex(+complexId);
    }
  }

  loadComplex(id: number): void {
    this.complexService.getComplexById(id).subscribe({
      next: (data) => {
        this.complex.set(data);
        this.complexModel.set({
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          email: data.email,
          images: data.images,
          tags: data.tags,
          openAt: data.openAt,
          closeAt: data.closeAt,
          userId: data.userId
        });
        // Load images
        const imageItems: ImageItem[] = data.images.map((url, index) => ({
          id: index,
          url: url
        }));
        this.images.set(imageItems);
        this.nextImageId.set(imageItems.length);
      },
      error: (error) => {
        console.error('Error loading complex:', error);
        this.toastService.error('Failed to load complex data. Please try again.', 5000);
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
        this.toastService.warning('Please select a valid image file', 3000);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.warning('Image size must be less than 5MB', 3000);
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
          this.toastService.success(`Location pinned: ${position.coords.latitude}, ${position.coords.longitude}`, 3000);
        },
        (error) => {
          console.error('Error getting location:', error);
          this.toastService.error('Unable to get your location', 3000);
        }
      );
    } else {
      this.toastService.error('Geolocation is not supported by your browser', 3000);
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
      this.toastService.warning('Complex name is required', 3000);
      return false;
    }

    if (!model.address.trim()) {
      this.toastService.warning('Address is required', 3000);
      return false;
    }

    if (!model.phone.trim()) {
      this.toastService.warning('Contact phone is required', 3000);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!model.email.trim() || !emailRegex.test(model.email)) {
      this.toastService.warning('Valid business email is required', 3000);
      return false;
    }

    if (!model.openAt) {
      this.toastService.warning('Opening time is required', 3000);
      return false;
    }

    if (!model.closeAt) {
      this.toastService.warning('Closing time is required', 3000);
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
    console.log('Submitting complex:', this.complexModel());
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
      if (!this.isEditMode()) {
        this.complexService.createComplex(formData).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toastService.success('Complex created successfully.', 3000);
            this.router.navigate(['/manager/complex-list']);
          },
          error: (error) => {
            console.error('Error creating complex:', error);
            this.toastService.error('Failed to create complex. Please try again.', 5000);
            this.isSubmitting.set(false);
          }
        });
      }
      else {
        this.complexService.updateComplex(this.complexId(), formData).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.toastService.success('Complex updated successfully.', 3000);
            this.router.navigate(['/manager/complex-list']);
          },
          error: (error) => {
            console.error('Error updating complex:', error);
            this.toastService.error('Failed to update complex. Please try again.', 5000);
            this.isSubmitting.set(false);
          }
        });
      }


    } catch (error) {
      console.error('Error creating complex:', error);
      this.toastService.error('An unexpected error occurred. Please try again.', 5000);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Cancel and go back
  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      this.router.navigate(['/manager/complex-list']);
    }
  }
}