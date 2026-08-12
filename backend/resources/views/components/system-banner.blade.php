@props([
    'id' => null,
    'type' => 'info',
    'title' => null,
])

<div {{ $attributes->merge(['class' => 'system-banner system-banner--' . $type]) }} 
     @if($id) id="{{ $id }}" @endif
     role="alert" 
     aria-live="polite" 
     aria-atomic="true">
    
    <div class="system-banner__dot" aria-hidden="true"></div>
    
    <div class="system-banner__text">
        @if($title)
            <strong class="system-banner__title">{{ $title }}</strong>
        @endif
        {{ $slot }}
    </div>
    
    <button class="system-banner__close" type="button" aria-label="Cerrar alerta" data-js-action="close-banner">
        <svg width="14" height="14" aria-hidden="true" focusable="false">
            <use href="{{ asset('assets/icons/sprite.svg#x') }}"></use>
        </svg>
    </button>
</div>
