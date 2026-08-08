{{--
  Componente: <x-modal>
  Descripción: Modal Base genérico. Contiene overlay, box, header condicional y slot.
               Controlado por Vanilla JS (public/js/components/modal.js).

  Props:
    - $id        (string, requerido) — ID del overlay; es el selector que usa el JS para abrir/cerrar.
    - $title     (string, opcional) — Texto del encabezado. Si se omite, el header solo muestra la X.
    - $maxWidth  (string, opcional) — Ancho máximo del box. Default: '500px'.
    - $ariaLabel (string, opcional) — Label accesible del diálogo. Usa $title si no se especifica.

  Uso sin título (modal de confirmación, icono central):
    <x-modal id="confirm-delete">
      ... contenido del slot ...
    </x-modal>

  Uso con título (modal de formulario):
    <x-modal id="edit-user" title="Editar usuario">
      <x-slot name="body">...</x-slot>
    </x-modal>

  Apertura desde JS:
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'mi-modal' } }));

  Cierre desde JS:
    document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'mi-modal' } }));
--}}
@props([
    'id'        => 'modal',
    'title'     => null,
    'maxWidth'  => '500px',
    'ariaLabel' => null,
])

@php
    $labelText = $ariaLabel ?? $title ?? 'Modal';
    $labelId   = $id . '-title';
@endphp

<div
    class="modal-overlay"
    id="{{ $id }}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="{{ $title ? $labelId : null }}"
    aria-label="{{ !$title ? $labelText : null }}"
    data-js="modal-overlay"
>
    <div
        class="modal-box"
        style="max-width: {{ $maxWidth }};"
        role="document"
        data-js="modal-box"
    >
        {{-- Header: Flexbox. Si hay título → left; X siempre → right. Si no hay título → solo X. --}}
        <header class="modal-hdr">
            @if($title)
                <h2 class="modal-title" id="{{ $labelId }}">{{ $title }}</h2>
            @endif

            <button
                type="button"
                class="modal-close"
                data-js="modal-close"
                aria-label="Cerrar"
            >
                <svg width="16" height="16" aria-hidden="true" focusable="false">
                    <use href="{{ asset('assets/icons/sprite.svg') }}#x"></use>
                </svg>
            </button>
        </header>

        {{-- Slot genérico: el consumidor pone body + footer aquí --}}
        {{ $slot }}
    </div>
</div>
