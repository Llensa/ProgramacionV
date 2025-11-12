import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

export type Filters = {
  platform?: 'pc' | 'browser' | 'all';
  category?: string;
  sortBy?: 'relevance' | 'release-date' | 'alphabetical' | 'popularity';
};

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .filters{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px;background:#181828;border:1px solid #222334;border-radius:12px;padding:12px;margin-bottom:16px}
    .filters label{display:block;font-size:.85rem;color:#a3a7b3;margin-bottom:4px}
    .filters select{width:100%;background:#0f0f18;color:#e6e6f0;border:1px solid #2a2a3a;border-radius:8px;padding:8px}
    @media (max-width: 760px){.filters{grid-template-columns:1fr}}
  `],
  template: `
    <div class="filters" [formGroup]="form">
      <div>
        <label>Plataforma</label>
        <select formControlName="platform">
          <option value="">Todas</option>
          <option value="pc">PC (Windows)</option>
          <option value="browser">Browser</option>
          <option value="all">PC + Browser</option>
        </select>
      </div>

      <div>
        <label>Categoría</label>
        <select formControlName="category">
          <option value="">Todas</option>
          <option *ngFor="let c of categories()" [value]="c">{{ c }}</option>
        </select>
      </div>

      <div>
        <label>Ordenar por</label>
        <select formControlName="sortBy">
          <option value="">Relevancia</option>
          <option value="release-date">Fecha de lanzamiento</option>
          <option value="alphabetical">Alfabético</option>
          <option value="popularity">Popularidad</option>
        </select>
      </div>
    </div>
  `,
})
export class FiltersBarComponent {
  private fb = new FormBuilder();

  @Input() set value(v: Filters | undefined) {
    this.form.patchValue(v ?? {}, { emitEvent: false });
  }
  @Output() readonly changed = new EventEmitter<Filters>();

  // lista “amigable” de categorías comunes de FreeToGame
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
    platform: this.fb.control<string | ''>(''),
    category: this.fb.control<string | ''>(''),
    sortBy: this.fb.control<string | ''>(''),
  });

  constructor() {
    this.form.valueChanges.subscribe(v => {
      this.changed.emit({
        platform: (v.platform || undefined) as any,
        category: v.category || undefined,
        sortBy: (v.sortBy || undefined) as any,
      });
    });
  }
}
