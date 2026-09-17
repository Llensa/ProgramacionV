import {
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';

/**
 * Emite `reachedBottom` cuando el elemento entra en el viewport.
 * Se usa como centinela al final de una lista para cargar la página siguiente.
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Output() reachedBottom = new EventEmitter<void>();

  // inject() en lugar de inyección por constructor, para mantener el mismo
  // estilo de DI que el resto del proyecto.
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.reachedBottom.emit();
        }
      },
      {
        threshold: 0.2,
        // Se anticipa 200px: la carga empieza antes de llegar al final,
        // así el scroll se percibe continuo.
        rootMargin: '200px',
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
