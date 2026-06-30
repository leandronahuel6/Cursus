@extends('layouts.app')

@section('title', 'Cursus - ' . $title)

@section('mobile-header')
  <div class="mob-hdr">
    <div class="mob-greet">{{ $title }}</div>
    <div class="mob-sub">Académico</div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">{{ $title }}</div>
@endsection

@section('content')
  <div class="card" style="padding: 40px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--sh); margin-top: 20px;">
    <div style="font-size: 60px; margin-bottom: 20px;">🚧</div>
    <h2 style="font-size: 20px; font-weight: 600; color: var(--t1); margin-bottom: 10px;">Sección en Desarrollo</h2>
    <p style="font-size: 14px; color: var(--t3); max-width: 400px; margin: 0 auto 24px; line-height: 1.5;">
      Estamos trabajando para traerte la sección de <strong>{{ $title }}</strong> muy pronto. Aquí podrás ver y gestionar tu información académica de forma integrada.
    </p>
    <button class="btn-primary" onclick="location.href='{{ route('dashboard') }}'">
      Volver al Inicio
    </button>
  </div>
@endsection
