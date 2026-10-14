import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Hoja inferior M3 (bottom sheet). En el celular sube desde abajo;
 * en pantallas grandes se muestra como diálogo centrado. Escape o tocar el velo la cierra.
 */
@Component({
  selector: 'app-hoja',
  template: `
    <div class="velo" (click)="cerrar.emit()"></div>
    <section class="hoja" role="dialog" aria-modal="true" [attr.aria-label]="titulo()">
      <div class="asa"></div>
      @if (titulo()) {
        <header>
          <h2>{{ titulo() }}</h2>
          <button type="button" class="icono-btn" (click)="cerrar.emit()" aria-label="Cerrar">
            <span class="icono">close</span>
          </button>
        </header>
      }
      <div class="contenido"><ng-content /></div>
    </section>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; }
    .velo { position: absolute; inset: 0; background: rgba(31, 31, 35, 0.6); animation: aparecer 0.15s ease-out; }
    .hoja {
      position: relative;
      width: 100%;
      max-width: 560px;
      max-height: 88dvh;
      overflow-y: auto;
      background: #fff;
      border-radius: 28px 28px 0 0;
      padding: 10px 20px calc(24px + env(safe-area-inset-bottom));
      animation: subir 0.2s ease-out;
    }
    .asa { width: 36px; height: 4px; border-radius: 999px; background: #e4e4e7; margin: 0 auto 10px; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    h2 { margin: 0; font-size: 20px; }
    .contenido { display: flex; flex-direction: column; gap: 14px; }
    @media (min-width: 720px) {
      :host { align-items: center; }
      .hoja { border-radius: 24px; max-width: 480px; }
      .asa { display: none; }
    }
    @keyframes subir { from { transform: translateY(40px); opacity: 0.6; } }
    @keyframes aparecer { from { opacity: 0; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HojaComponent {
  readonly titulo = input('');
  readonly cerrar = output<void>();

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    this.cerrar.emit();
  }
}
