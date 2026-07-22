{{-- 
  Partial de VERIFICACIÓN de refactorización CSS modular.
  
  Cómo usar:
  1. Dejar este @include activo 
  2. En layouts/app.blade.php, COMENTAR temporalmente el <link> a css/main.css
  3. Refrescar cualquier página y verificar visualmente que se vea igual
  4. Si algo falta, checkear que el archivo modular correspondiente existe y tiene el contenido correcto
  5. Una vez verificada cada vista, reconectar main.css y remover este include
--}}

{{-- LAYOUT --}}
<link rel="stylesheet" href="{{ asset('css/layout/app.css') }}">
<link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
<link rel="stylesheet" href="{{ asset('css/layout/topbar.css') }}">
<link rel="stylesheet" href="{{ asset('css/layout/mobile-nav.css') }}">

{{-- COMPONENTS --}}
<link rel="stylesheet" href="{{ asset('css/components/buttons.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/cards.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/modals.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/tabs.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/filters.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/forms.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/toast.css') }}">
<link rel="stylesheet" href="{{ asset('css/components/pomo-float.css') }}">

{{-- VIEWS — se cargan siempre (cada view solo usa las que necesita, pero es más simple así para verificación) --}}
<link rel="stylesheet" href="{{ asset('css/views/dashboard.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/materias.css') }}">
{{-- <link rel="stylesheet" href="{{ asset('css/views/alertas.css') }}"> --}}
<link rel="stylesheet" href="{{ asset('css/views/horarios.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/progreso.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/auth.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/welcome.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/area-estudio.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/area-estudio-focus.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/beneficios.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/contacto.css') }}">
<link rel="stylesheet" href="{{ asset('css/views/flashcards.css') }}">

{{-- ADMIN --}}
<link rel="stylesheet" href="{{ asset('css/admin/shared.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin/alumnos.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin/cuotas.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin/plan-estudios.css') }}">
