<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido/a a Cursus</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -.02em; }
    .logo span { color: #c4b5fd; }
    .tagline { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.7); }
    .body { padding: 32px 32px 24px; }
    .greeting { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    .text { font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 20px; }
    .features { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .features ul { margin: 0; padding: 0 0 0 18px; }
    .features li { font-size: 13.5px; color: #374151; line-height: 1.8; }
    .cta { text-align: center; margin-bottom: 8px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; }
    .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Cursus<span>.</span></div>
      <p class="tagline">Tu asistente de estudio TUP · UTN Haedo</p>
    </div>
    <div class="body">
      <p class="greeting">¡Bienvenido/a, {{ explode(' ', $user->nombre)[0] }}!</p>
      <p class="text">
        Tu cuenta fue creada exitosamente. Ya podés ingresar con tu legajo <strong>{{ $user->legajo }}</strong> y empezar a organizar tu cursada.
      </p>
      <div class="features">
        <ul>
          <li>Seguimiento de materias y notas</li>
          <li>Temporizador Pomodoro integrado</li>
          <li>Alertas y recordatorio de cuotas</li>
          <li>Horarios y tareas por materia</li>
          <li>Flashcards para repasar</li>
        </ul>
      </div>
      <div class="cta">
        <a class="btn" href="{{ url('/login') }}">Ingresar a Cursus</a>
      </div>
    </div>
    <div class="footer">Cursus — Asistente de Estudiantes TUP · UTN Haedo</div>
  </div>
</body>
</html>
