import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastStore } from '../../../core/services/toast.store';

/**
 * Pila de avisos emergentes. Se monta una sola vez en el componente raiz
 * y lee su contenido del ToastStore, que es global.
 */
@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.css',
})
export class ToastsComponent {
  private store = inject(ToastStore);

  items = computed(() => this.store.items());

  remove(id: string) {
    this.store.remove(id);
  }
}
