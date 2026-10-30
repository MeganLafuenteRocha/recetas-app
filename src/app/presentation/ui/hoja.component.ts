import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Hoja inferior del sistema de diseño (fondo crema, agarre, esquinas de 32).
 * En el celular sube desde abajo; en pantallas grandes es un diálogo centrado.
 * Escape o tocar el velo la cierra. Lo proyectado con `acciones` va junto al título.
 */
@Component({
  selector: 'app-hoja',
  template: `
    <div class="velo" (click)="cerrar.emit()"></div>
    <section class="hoja" role="dialog" aria-modal="true" [attr.aria-label]="titulo()">
      <div class="agarre"></div>
      @if (titulo()) {
        <header>
          <h2>{{ titulo() }}</h2>
          <ng-content select="[acciones]" />
          <button type="button" class="boton-icono" (click)="cerrar.emit()" aria-label="Cerrar">
            <span class="icono">close</span>
          </button>
        </header>
      }
      <div class="contenido"><ng-content /></div>
    </section>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 40; display: flex; align-items: flex-end; justify-content: center; }
    .velo { position: absolute; inset: 0; background: var(--color-velo); animation: aparecer 0.15s ease-out; }
    .hoja {
      position: relative;
      width: 100%;
      max-width: 560px;
      max-height: 90dvh;
      overflow-y: auto;
      padding: 12px var(--esp-pantalla) calc(26px + env(safe-area-inset-bottom));
      border-radius: var(--radio-hoja) var(--radio-hoja) 0 0;
      background: var(--color-fondo);
      animation: subir 0.2s ease-out;
    }
    .agarre { width: 44px; height: 5px; margin: 0 auto 14px; border-radius: var(--radio-pill); background: var(--color-control-apagado); }
    header { display: flex; align-items: center; gap: var(--esp-grupo); margin-bottom: 16px; }
    h2 { flex: 1; min-width: 0; font-size: 20px; }
    .contenido { display: flex; flex-direction: column; gap: 16px; }
    @media (min-width: 720px) {
      :host { align-items: center; }
      .hoja { max-width: 480px; border-radius: var(--radio-hoja); }
      .agarre { display: none; }
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
