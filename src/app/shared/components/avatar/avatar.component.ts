import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar reutilizable: muestra la foto de perfil (Google) y, si no hay o
 * falla la descarga, cae a la inicial del nombre sobre un fondo de color
 * derivado del propio nombre, para que cada usuario tenga un tono estable.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  @Input() photoURL: string | null | undefined = null;
  @Input() name = '';
  @Input() size = 36;

  private failed = signal(false);

  showImage = computed(() => !!this.photoURL && !this.failed());

  initial = computed(() => {
    const n = (this.name || '').trim();
    return n ? n[0].toUpperCase() : '👤';
  });

  /** Color estable por usuario: mismo nombre, mismo tono */
  bgColor = computed(() => {
    const n = this.name || 'U';
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 65% 38%))`;
  });

  onError() {
    this.failed.set(true);
  }
}
