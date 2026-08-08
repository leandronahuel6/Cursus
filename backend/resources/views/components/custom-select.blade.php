{{--
  Componente: <x-custom-select>
  Descripción: Select estilizado con chevron SVG. Envuelve cualquier <select>
               pasado como slot dentro del wrapper con ícono posicionado.

  Props:
    - $id       (string, requerido) — ID del <select> para el <label> externo
    - $name     (string, requerido) — atributo name del <select>
    - $class    (string, opcional) — clases extra para el <select>
    - $required (bool,   opcional) — añade el atributo required
    - $disabled (bool,   opcional) — añade el atributo disabled
    - $ariaLabel (string, opcional) — aria-label para accesibilidad cuando no hay <label> explícito

  Uso:
    <x-custom-select id="mi-select" name="mi_campo" required>
      <option value="">Seleccionar...</option>
      <option value="1">Opción A</option>
    </x-custom-select>
--}}
@props([
    'id'        => null,
    'name'      => null,
    'class'     => '',
    'required'  => false,
    'disabled'  => false,
    'ariaLabel' => null,
    'onchange'  => null,
])

<div class="custom-select-wrapper">
    <select
        id="{{ $id }}"
        name="{{ $name }}"
        class="custom-input {{ $class }}"
        @if($required)  required  @endif
        @if($disabled)  disabled  @endif
        @if($ariaLabel) aria-label="{{ $ariaLabel }}" @endif
        @if($onchange)  onchange="{{ $onchange }}" @endif
    >
        {{ $slot }}
    </select>

    {{-- Chevron decorativo (aria-hidden porque es puramente visual) --}}
    <svg class="select-chevron"
         width="16"
         height="16"
         aria-hidden="true"
         focusable="false">
        <use href="{{ asset('assets/icons/sprite.svg') }}#chevron-down"></use>
    </svg>
</div>
