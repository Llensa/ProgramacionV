import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Filters } from '../../../core/models/filters';

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filters-bar.component.html',
  styleUrl: './filters-bar.component.css',
})
export class FiltersBarComponent {
  // inject() en vez de new FormBuilder(): respeta el sistema de DI de Angular
  private fb = inject(FormBuilder);

  @Input() set value(v: Filters | undefined) {
    this.form.patchValue(
      {
        q: v?.q ?? '',
        platform: v?.platform ?? '',
        category: v?.category ?? '',
        sortBy: v?.sortBy ?? '',
      },
      { emitEvent: false }
    );
  }
  @Output() readonly changed = new EventEmitter<Filters>();

  private readonly _categories = signal<string[]>([
    'mmorpg','shooter','strategy','moba','racing','sports','social','sandbox',
    'open-world','survival','pvp','pve','pixel','voxel','zombie','turn-based',
    'first-person','third-person','top-down','tank','space','sailing','side-scroller',
    'superhero','permadeath','card','battle-royale','mmofps','mmotps','3d','2d',
    'anime','fantasy','sci-fi','fighting','action-rpg','action','military','martial-arts',
    'flight','low-spec','tower-defense','horror'
  ]);
  categories = computed(() => this._categories());

  form = this.fb.nonNullable.group({
    q: this.fb.control<string>(''),
    platform: this.fb.control<string | ''>(''),
    category: this.fb.control<string | ''>(''),
    sortBy: this.fb.control<string | ''>(''),
  });

  hasFilters = computed(() => true); // placeholder para el *ngIf del botón limpiar

  constructor() {
    // debounceTime evita disparar una búsqueda por cada tecla:
    // espera 300 ms de inactividad antes de emitir.
    this.form.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed()
      )
      .subscribe(v => {
        this.changed.emit({
          q: (v.q || '').trim() || undefined,
          platform: (v.platform || undefined) as any,
          category: v.category || undefined,
          sortBy: (v.sortBy || undefined) as any,
        });
      });
  }

  clear() {
    this.form.reset({ q: '', platform: '', category: '', sortBy: '' });
  }
}
