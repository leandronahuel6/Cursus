{{--
  Componente: <x-modal-confirm>
  Descripción: Modal de confirmación. Extiende <x-modal> (sin título en header → solo X).
               Diseño: icono intercambiable centrado, título grande, descripción, footer centrado.

  Props:
    - $id          (string, requerido) — ID único del overlay; se usa en JS para abrir/cerrar.
    - $title       (string, requerido) — Título principal en negrita debajo del icono.
    - $description (string, opcional) — Texto descriptivo debajo del título.
    - $type        (string, opcional) — 'danger' (rojo, ícono de advertencia) | 'primary' (brand).
                                        Default: 'danger'.
    - $icon        (string, opcional) — ID del ícono en sprite.svg. Defaults: 'trash-2' (danger), 'help-circle' (primary).
    - $confirmText (string, opcional) — Texto del botón de acción. Default: 'Eliminar' (danger) | 'Confirmar' (primary).
    - $cancelText  (string, opcional) — Texto del botón cancelar. Default: 'Cancelar'.
    - $confirmId   (string, opcional) — ID del botón de confirmación para enlazarlo desde JS.

  Uso:
    <x-modal-confirm
        id="confirm-delete-deck"
        title="¿Eliminar mazo?"
        description="Esta acción no se puede deshacer. Se eliminarán todas las cartas."
        type="danger"
        confirm-text="Eliminar"
        :confirm-id="'btn-confirm-delete-deck'"
    />

    <x-modal-confirm
        id="confirm-submit"
        title="¿Enviar evaluación?"
        description="Una vez enviada no podrás cambiar tus respuestas."
        type="primary"
        icon="send"
        confirm-text="Enviar"
    />

  Apertura desde JS (con callback opcional):
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'confirm-delete-deck' } }));
--}}
@props([
    'id'          => 'modal-confirm',
    'title'       => 'Confirmar acción',
    'description' => null,
    'type'        => 'danger',
    'icon'        => null,
    'confirmText' => null,
    'cancelText'  => 'Cancelar',
    'confirmId'   => 'modal-confirm-btn',
])

@php
    $isDanger    = $type === 'danger';
    $iconId      = $icon ?? ($isDanger ? 'trash-2' : 'help-circle');
    $confirmLabel = $confirmText ?? ($isDanger ? 'Eliminar' : 'Confirmar');
    $iconClass   = $isDanger ? 'modal-confirm__icon-wrap--danger' : 'modal-confirm__icon-wrap--primary';
    $btnClass    = $isDanger ? 'btn btn--danger' : 'btn btn--primary';
@endphp

{{-- Reutiliza el Modal Base SIN título: el header solo renderizará la X a la derecha --}}
<x-modal :id="$id" :max-width="'400px'">

    {{-- Body centrado: icono + título + descripción --}}
    <div class="modal-confirm-body">

        {{-- Icono intercambiable --}}
        <div class="modal-confirm__icon-wrap {{ $iconClass }}" aria-hidden="true">
            <svg width="28" height="28" focusable="false">
                <use href="{{ asset('assets/icons/sprite.svg') }}#{{ $iconId }}"></use>
            </svg>
        </div>

        {{-- Título --}}
        <p class="modal-confirm__title">{{ $title }}</p>

        {{-- Descripción (condicional) --}}
        @if($description)
            <p class="modal-confirm__desc">{{ $description }}</p>
        @endif

    </div>

    {{-- Footer centrado --}}
    <footer class="modal-confirm-foot">
        {{-- Cancelar: siempre estilo neutro --}}
        <button
            type="button"
            class="btn btn--cancel"
            data-js="modal-close"
            aria-label="{{ $cancelText }}"
        >
            {{ $cancelText }}
        </button>

        {{-- Acción principal: rojo (danger) o brand (primary) --}}
        <button
            type="button"
            id="{{ $confirmId }}"
            class="{{ $btnClass }}"
            data-js="modal-confirm-action"
            aria-label="{{ $confirmLabel }}"
        >
            {{ $confirmLabel }}
        </button>
    </footer>

</x-modal>
