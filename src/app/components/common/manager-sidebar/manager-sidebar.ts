import { AfterViewInit, Component, effect, ElementRef, signal, viewChild, viewChildren } from '@angular/core';

@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './manager-sidebar.html',
  styleUrl: './manager-sidebar.css',
})
export class ManagerSidebar implements AfterViewInit {
  // Query signals for DOM elements
  sidebar = viewChild.required<ElementRef>('sidebar');
  nav = viewChild.required<ElementRef>('nav');
  buttons = viewChildren<ElementRef>('navButton');

  // State signals
  isOpen = signal(false);
  activeIndex = signal(0);

  constructor() {
    // Effect to update CSS variable when active index changes
    effect(() => {
      const index = this.activeIndex();
      const navElement = this.nav().nativeElement;

      if (navElement) {
        const topPosition = index === 0 ? 0 : index * 56;
        navElement.style.setProperty('--top', `${topPosition}px`);
      }
    });
  }

  ngAfterViewInit() {
    // Set initial active button
    const buttonElements = this.buttons();
    if (buttonElements.length > 0) {
      buttonElements[0].nativeElement.classList.add('active');
    }

    // Initialize CSS variable
    const navElement = this.nav().nativeElement;
    navElement.style.setProperty('--top', '0px');
  }

  // Toggle sidebar open/closed
  toggleOpen() {
    this.isOpen.update(value => !value);
  }

  // Handle button click
  onButtonClick(index: number) {
    this.activeIndex.set(index);

    // Update active class on buttons
    const buttonElements = this.buttons();
    buttonElements.forEach((button, i) => {
      if (i === index) {
        button.nativeElement.classList.add('active');
      } else {
        button.nativeElement.classList.remove('active');
      }
    });
  }
}