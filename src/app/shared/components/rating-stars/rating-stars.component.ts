import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stars" [class.disabled]="disabled">
      <button
        type="button"
        class="star"
        *ngFor="let s of [1,2,3,4,5]"
        [class.active]="value >= s"
        [disabled]="disabled"
        (click)="set(s)"
        [attr.aria-label]="'Calificar ' + s + ' estrellas'"
      >★</button>

      <span class="label" *ngIf="showLabel">
        {{ value ? (value + '/5') : 'Sin calificar' }}
      </span>
    </div>
  `,
  styles: [`
    .stars{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .star{
      width:36px;height:36px;border-radius:10px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(0,0,0,.25);
      color:rgba(255,255,255,.35);
      cursor:pointer;
      transition: transform .12s ease, border-color .12s ease, color .12s ease;
      font-size:18px;
    }
    .star:hover{transform:translateY(-1px);border-color:rgba(164,112,255,.35)}
    .star.active{color:#ffd86b;border-color:rgba(255,216,107,.35)}
    .disabled{opacity:.55}
    .label{color:rgba(230,230,240,.75);font-size:.9rem}
  `],
})
export class RatingStarsComponent {
  @Input() value = 0;
  @Input() disabled = false;
  @Input() showLabel = true;
  @Output() valueChange = new EventEmitter<number>();

  set(v: number) {
    if (this.disabled) return;
    this.valueChange.emit(v);
  }
}
