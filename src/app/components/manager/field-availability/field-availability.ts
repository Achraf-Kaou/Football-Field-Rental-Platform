import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ManagerLayout } from '../../layouts/manager-layout/manager-layout';
import { ComplexService } from '../../../services/complex.service';
import { FieldService } from '../../../services/field.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Complex } from '../../../models/complex.model';
import { FieldModel } from '../../../models/field.model';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface TimeSlot {
  id: number;
  fieldId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'maintenance' | 'blocked';
  notes?: string;
  recurring?: boolean;
  createdAt: string;
}

interface SlotForm {
  startTime: string;
  endTime: string;
  status: 'maintenance' | 'blocked';
  notes: string;
  recurring: boolean;
}

@Component({
  selector: 'app-field-availability',
  imports: [ManagerLayout, FormsModule, TranslateModule],
  templateUrl: './field-availability.html',
  styleUrl: './field-availability.css',
})
export class FieldAvailability implements OnInit {
  private complexService = inject(ComplexService);
  private fieldService = inject(FieldService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  complex = signal<Complex | null>(null);
  fields = signal<FieldModel[]>([]);
  isLoading = signal(false);
  isError = signal(false);
  isSaving = signal(false);

  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  selectedField = signal<FieldModel | null>(null);
  slots = signal<TimeSlot[]>([]);
  showSlotModal = signal<boolean>(false);
  editingSlot = signal<TimeSlot | null>(null);

  // Store opening hour to calculate positions
  openingHour = signal<number>(8);
  timeSlots = signal<string[]>([]);

  newSlot = signal<SlotForm>({
    startTime: '09:00',
    endTime: '10:00',
    status: 'maintenance',
    notes: '',
    recurring: false
  });

  statusOptions: Array<'maintenance' | 'blocked'> = ['maintenance', 'blocked'];

  // Computed signals
  filteredSlots = computed(() => {
    return this.slots().filter(
      slot => slot.fieldId === this.selectedField()?.id && slot.date === this.selectedDate()
    );
  });

  debugData = computed(() => {
    return JSON.stringify({
      selectedDate: this.selectedDate(),
      selectedField: this.selectedField()?.name,
      slotsCount: this.filteredSlots().length,
      slots: this.filteredSlots()
    }, null, 2);
  });

  constructor() {
    effect(() => {
      console.log('Selected date changed:', this.selectedDate());
    });

    effect(() => {
      console.log('Slots updated:', this.slots().length);
    });

    effect(() => {
      console.log('Time slots updated:', this.timeSlots().length);
    });

    // Auto-save effect when slots change
    effect(() => {
      const field = this.selectedField();
      const slots = this.slots();

      if (field && slots.length > 0) {
        console.log('Slots changed, will save to backend');
        // Debounce could be added here if needed
      }
    });
  }

  ngOnInit(): void {
    const complexId = this.route.snapshot.paramMap.get('id');
    if (complexId) {
      this.loadComplex(+complexId);
      this.loadComplexFields(+complexId);
    }
  }

  /**
   * Load all fields for a complex and extract their availability data
   */
  loadComplexFields(complexId: number): void {
    this.isLoading.set(true);

    // TODO: Implement in FieldService
    // getAllFields(page?, limit?, search?, status?, type?, complexId?)
    this.fieldService.getAllFields(undefined, undefined, undefined, undefined, undefined, complexId).subscribe({
      next: (fieldsData: FieldModel[]) => {
        this.fields.set(fieldsData);

        // Extract all availability slots from all fields
        const allSlots: TimeSlot[] = [];
        fieldsData.forEach(field => {
          if (field.availability && Array.isArray(field.availability)) {
            // Cast the availability data to TimeSlot array
            const fieldSlots = (field.availability as any[]).map(slot => ({
              ...slot,
              fieldId: field.id
            }));
            allSlots.push(...fieldSlots);
          }
        });

        this.slots.set(allSlots);
        console.log(`Loaded ${allSlots.length} slots from ${fieldsData.length} fields`);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading fields:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Load complex details and generate time slots based on operating hours
   */
  loadComplex(complexId: number): void {
    this.isLoading.set(true);

    // TODO: Implement in ComplexService
    // getComplexById(id: number): Observable<Complex>
    this.complexService.getComplexById(complexId).subscribe({
      next: (complexData) => {
        this.complex.set(complexData);

        // Parse opening and closing hours
        const openHour = parseInt(complexData.openAt.split(':')[0], 10);
        const closeHour = complexData.closeAt === '00:00' ? 24 : parseInt(complexData.closeAt.split(':')[0], 10);

        // Store opening hour for calculations
        this.openingHour.set(openHour);

        // Generate time slots based on operating hours
        const slotCount = closeHour - openHour;
        const slots = Array.from({ length: slotCount }, (_, i) => {
          const hour = i + openHour;
          return `${hour.toString().padStart(2, '0')}:00`;
        });

        this.timeSlots.set(slots);
        this.isLoading.set(false);

        console.log(`Complex opens at ${openHour}:00, closes at ${closeHour}:00`);
        console.log(`Generated ${slotCount} time slots`);
      },
      error: (err) => {
        console.error('Error loading complex:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Select a field and load its specific availability data
   */
  selectField(field: FieldModel): void {
    this.selectedField.set(field);

    // Filter slots for this field are automatically computed
    console.log(`Selected field: ${field.name}, found ${this.filteredSlots().length} slots`);
  }

  /**
   * Open modal to add a new time slot
   */
  openSlotModal(): void {
    this.showSlotModal.set(true);
    this.editingSlot.set(null);

    // Set default times based on opening hours
    const openHour = this.openingHour();
    const defaultStart = `${openHour.toString().padStart(2, '0')}:00`;
    const defaultEnd = `${(openHour + 1).toString().padStart(2, '0')}:00`;

    this.newSlot.set({
      startTime: defaultStart,
      endTime: defaultEnd,
      status: 'maintenance',
      notes: '',
      recurring: false
    });
  }

  closeSlotModal(): void {
    this.showSlotModal.set(false);
    this.editingSlot.set(null);
  }

  updateSlotForm(field: keyof SlotForm, value: any): void {
    this.newSlot.update(current => ({
      ...current,
      [field]: value
    }));
  }

  /**
   * Edit an existing time slot
   */
  editSlot(slot: TimeSlot): void {
    this.editingSlot.set(slot);
    this.newSlot.set({
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      notes: slot.notes || '',
      recurring: slot.recurring || false
    });
    this.showSlotModal.set(true);
  }

  /**
   * Save a time slot (create or update) and sync with backend
   */
  saveSlot(): void {
    if (!this.selectedField()) {
      alert('Please select a field first');
      return;
    }

    const slot: TimeSlot = {
      id: this.editingSlot()?.id || Date.now(),
      fieldId: this.selectedField()!.id,
      date: this.selectedDate(),
      startTime: this.newSlot().startTime,
      endTime: this.newSlot().endTime,
      status: this.newSlot().status,
      notes: this.newSlot().notes,
      recurring: this.newSlot().recurring,
      createdAt: this.editingSlot()?.createdAt || new Date().toISOString()
    };

    // Update local state
    if (this.editingSlot()) {
      this.slots.update(slots =>
        slots.map(s => s.id === this.editingSlot()!.id ? slot : s)
      );
    } else {
      this.slots.update(slots => [...slots, slot]);
    }

    // Save to backend
    this.saveFieldAvailability(this.selectedField()!.id);

    this.closeSlotModal();
  }

  /**
   * Delete a time slot and sync with backend
   */
  deleteSlot(event: Event, slotId: number): void {
    event.stopPropagation();

    const fieldId = this.selectedField()?.id;
    if (!fieldId) return;

    // Update local state
    this.slots.update(slots => slots.filter(s => s.id !== slotId));

    // Save to backend
    this.saveFieldAvailability(fieldId);
  }

  /**
   * Save field availability to backend
   * Syncs all slots for the selected field with the database
   */
  saveFieldAvailability(fieldId: number): void {
    this.isSaving.set(true);

    // Get all slots for this field
    const fieldSlots = this.slots().filter(slot => slot.fieldId === fieldId);

    // Remove fieldId from slots before sending to backend (it's not part of the DTO)
    const cleanedSlots = fieldSlots.map(({ fieldId, ...slot }) => slot);

    // TODO: Implement in FieldService
    // updateField(id: number, updateFieldDto: Partial<FieldModel>): Observable<FieldModel>
    this.fieldService.updateField(fieldId, {
      availability: cleanedSlots as any // Will be cast to InputJsonValue on backend
    }).subscribe({
      next: (updatedField) => {
        console.log('Field availability saved successfully', updatedField);
        this.isSaving.set(false);

        // Update the field in the fields array
        this.fields.update(fields =>
          fields.map(f => f.id === fieldId ? (updatedField as FieldModel) : f)
        );
      },
      error: (err) => {
        console.error('Error saving field availability:', err);
        alert('Failed to save availability. Please try again.');
        this.isSaving.set(false);
      }
    });
  }

  // UI Helper Methods
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSlotHeight(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return (minutes / 60) * 40;
  }

  getSlotTop(time: string): number {
    const [hour, min] = time.split(':').map(Number);
    const openHour = this.openingHour();
    const hoursSinceOpen = hour - openHour + (min / 60);
    return hoursSinceOpen * 40;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 border-emerald-500';
      case 'maintenance':
        return 'bg-orange-500/20 border-orange-500';
      case 'blocked':
        return 'bg-gray-500/20 border-gray-700';
      default:
        return 'bg-emerald-500/20 border-emerald-500';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getFieldClasses(field: FieldModel): string {
    return this.selectedField()?.id === field.id
      ? 'bg-gray-800 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
      : 'bg-gray-800 border border-gray-700 hover:border-gray-600';
  }

  getFieldIconClasses(field: FieldModel): string {
    return this.selectedField()?.id === field.id
      ? 'bg-emerald-500/20 text-emerald-500'
      : 'bg-gray-700 text-gray-400';
  }

  getFieldStatusClasses(field: FieldModel): string {
    return this.selectedField()?.id === field.id
      ? 'text-emerald-500'
      : 'text-gray-500';
  }

  getStatusButtonClasses(status: string): string {
    const isActive = this.newSlot().status === status;
    if (isActive) {
      switch (status) {
        case 'maintenance':
          return 'bg-orange-600';
        case 'blocked':
          return 'bg-gray-600';
      }
    }
    return 'bg-gray-700 hover:bg-gray-600';
  }
}