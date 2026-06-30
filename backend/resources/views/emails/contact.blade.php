<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mensaje de contacto — Cursus</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #7c3aed; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; color: #fff; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,.75); }
    .body { padding: 28px 32px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: #ede9fe; color: #7c3aed; margin-bottom: 16px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-bottom: 4px; }
    .field-value { font-size: 14px; color: #111827; line-height: 1.6; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
    .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Nuevo mensaje de contacto</h1>
      <p>Recibido desde la app Cursus</p>
    </div>
    <div class="body">
      <div class="badge">{{ ucfirst($tipo) }}</div>

      <div class="field">
        <div class="field-label">De</div>
        <div class="field-value">{{ $remitenteNombre }} &lt;{{ $remitenteEmail }}&gt;</div>
      </div>

      <div class="field">
        <div class="field-label">Asunto</div>
        <div class="field-value">{{ $asunto }}</div>
      </div>

      <div class="field">
        <div class="field-label">Descripción</div>
        <div class="field-value" style="white-space: pre-wrap;">{{ $descripcion }}</div>
      </div>
    </div>
    <div class="footer">Cursus — Asistente de Estudiantes TUP · UTN Haedo</div>
  </div>
</body>
</html>
