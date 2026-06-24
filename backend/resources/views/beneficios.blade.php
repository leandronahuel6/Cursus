@extends('layouts.app')

@section('title', 'Cursus - Beneficios Estudiantiles')

@push('styles')
<style>
    /* ==========================================================================
       VARIABLES Y TEMA OSCURO LOCAL (PROTO-DISEÑO)
       ========================================================================== */
    body.dark-mode {
        --bg: #070a13;
        --border: rgba(255, 255, 255, 0.08);
        --border-light: rgba(255, 255, 255, 0.04);
        --surface: rgba(17, 24, 39, 0.6);
        --t1: #f3f4f6;
        --t2: #9ca3af;
        --t3: #6b7280;
    }

    /* Sobrescribir fondo de puntos por fondo liso en modo claro */
    body {
        background-image: none;
        background-color: var(--bg);
    }

    /* Fondo Aurora Mesh Gradient Animado (Liso) en Modo Oscuro */
    body.dark-mode {
        background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%);
        background-size: 100% 100%, 100% 100%;
        background-attachment: fixed;
        animation: aurora-bg 20s infinite alternate ease-in-out;
    }

    @keyframes aurora-bg {
        0% { background-position: 0% 0%, 100% 100%; }
        50% { background-position: 50% 50%, 50% 50%; }
        100% { background-position: 100% 100%, 0% 0%; }
    }

    /* Overrides del Layout en Modo Oscuro (Exclusivo en esta página) */
    body.dark-mode .sidebar {
        background: #0b0f19;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
    }
    body.dark-mode .sb-logo {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    body.dark-mode .sb-user {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    body.dark-mode .nav-group {
        color: #4b5563;
    }
    body.dark-mode .nav-item {
        color: #9ca3af;
    }
    body.dark-mode .nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f3f4f6;
    }
    body.dark-mode .nav-item.active {
        background: rgba(79, 70, 229, 0.22);
        color: #a5b4fc;
    }

    body.dark-mode .topbar {
        background: rgba(7, 10, 19, 0.8) !important;
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    body.dark-mode .topbar-title {
        color: #ffffff;
    }
    body.dark-mode .streak-chip {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: #f3f4f6;
    }

    body.dark-mode .bnav {
        background: rgba(11, 15, 25, 0.95);
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    body.dark-mode .bn {
        color: #9ca3af;
    }
    body.dark-mode .bn.on {
        color: #a5b4fc;
    }

    body.dark-mode .contact-box {
        background: #111827;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }
    body.dark-mode .contact-title {
        color: #ffffff;
    }
    body.dark-mode .contact-input {
        background: #1f2937;
        border-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    /* ==========================================================================
       ESTILOS DEL BOTÓN THEME TOGGLE
       ========================================================================== */
    .theme-toggle-btn {
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 50%;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: var(--sh);
        outline: none;
    }
    .theme-toggle-btn:hover {
        background: #ffffff;
        transform: scale(1.05);
        border-color: var(--brand);
    }
    body.dark-mode .theme-toggle-btn {
        background: rgba(17, 24, 39, 0.5);
        border-color: rgba(255, 255, 255, 0.08);
    }
    body.dark-mode .theme-toggle-btn:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: var(--brand);
    }

    .theme-toggle-btn .icon-sun { display: none; color: #f59e0b; }
    .theme-toggle-btn .icon-moon { display: block; color: #6366f1; }
    body.dark-mode .theme-toggle-btn .icon-sun { display: block; }
    body.dark-mode .theme-toggle-btn .icon-moon { display: none; }

    /* ==========================================================================
       ESTILOS ESPECÍFICOS DE LA SECCIÓN DE BENEFICIOS (CON GLASSMORPHISM)
       ========================================================================== */
    .benefits-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .advice-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: rgba(99, 102, 241, 0.04);
        border: 1px solid rgba(99, 102, 241, 0.12);
        border-radius: var(--r-lg);
        gap: 16px;
        transition: all 0.3s ease;
    }
    body.dark-mode .advice-banner {
        background: rgba(99, 102, 241, 0.08);
        border: 1px solid rgba(99, 102, 241, 0.2);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }
    .advice-banner-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .advice-banner-text {
        font-size: 13.5px;
        color: var(--t2);
        line-height: 1.5;
    }
    .advice-banner-text strong {
        color: var(--t1);
    }
    .advice-banner-btn {
        background: var(--brand);
        color: #ffffff;
        border: none;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        border-radius: var(--r-sm);
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.25s, transform 0.2s;
        font-family: inherit;
    }
    .advice-banner-btn:hover {
        background: var(--brand-hover);
        transform: translateY(-1px);
    }

    .filter-tabs-container {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 5px;
        margin-bottom: 5px;
        border-bottom: 1px solid var(--border);
    }
    .filter-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid var(--border);
        color: var(--t2);
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 20px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.25s ease;
        font-family: inherit;
        margin-bottom: 10px;
    }
    .filter-icon {
        flex-shrink: 0;
        opacity: 0.8;
        transition: transform 0.2s ease;
    }
    .filter-tab-btn:hover .filter-icon {
        transform: scale(1.1);
    }
    body.dark-mode .filter-tab-btn {
        background: rgba(17, 24, 39, 0.5);
        border-color: rgba(255, 255, 255, 0.08);
    }
    .filter-tab-btn:hover {
        border-color: var(--brand);
        color: var(--brand);
    }
    .filter-tab-btn.active {
        background: var(--brand);
        border-color: var(--brand);
        color: #ffffff;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
    }
    body.dark-mode .filter-tab-btn.active {
        background: var(--brand);
        border-color: var(--brand);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }

    .benefits-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 10px;
    }

    /* Glassmorphism en tarjetas + Posicionamiento para Cursor Glow */
    .benefit-card {
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(229, 231, 235, 0.8);
        border-radius: var(--r-lg);
        padding: 20px;
        box-shadow: var(--sh);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        overflow: hidden;
    }
    body.dark-mode .benefit-card {
        background: rgba(19, 25, 38, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .benefit-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
        border-color: var(--brand-dim);
    }
    body.dark-mode .benefit-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
    }

    /* Pseudo elemento de Cursor Glow */
    .benefit-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: inherit;
        background: radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
    }
    body.dark-mode .benefit-card::before {
        background: radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(34, 211, 238, 0.14) 0%, rgba(129, 140, 248, 0.14) 50%, transparent 100%);
    }
    .benefit-card:hover::before {
        opacity: 1;
    }

    /* Asegurar que el contenido renderice sobre el Glow */
    .benefit-card > * {
        position: relative;
        z-index: 2;
    }

    .benefit-card-tag {
        position: absolute;
        top: 15px;
        right: 15px;
        font-size: 9.5px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .tag-free {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }
    .tag-discount {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
    }
    .tag-scholarship {
        background: rgba(99, 102, 241, 0.1);
        color: #4f46e5;
    }
    body.dark-mode .tag-scholarship {
        color: #a5b4fc;
        background: rgba(99, 102, 241, 0.2);
    }

    .benefit-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
        padding-right: 110px; /* Evitar colisión con el tag */
    }
    .benefit-card-icon {
        width: 42px;
        height: 42px;
        border-radius: var(--r-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--border-light);
        color: var(--brand);
        font-size: 20px;
    }
    body.dark-mode .benefit-card-icon {
        color: #a5b4fc;
    }
    .benefit-card-provider {
        font-size: 10px;
        font-weight: 700;
        color: var(--brand);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1;
    }
    body.dark-mode .benefit-card-provider {
        color: #818cf8;
    }
    .benefit-card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--t1);
        margin: 4px 0 0 0;
        line-height: 1.2;
    }

    .benefit-card-desc {
        font-size: 13px;
        color: var(--t2);
        line-height: 1.5;
        margin: 0 0 16px 0;
        flex-grow: 1;
    }

    .benefit-card-reqs {
        background: var(--border-light);
        padding: 10px 12px;
        border-radius: var(--r-sm);
        font-size: 12px;
        color: var(--t2);
        margin-bottom: 16px;
        border-left: 3px solid var(--brand);
    }
    body.dark-mode .benefit-card-reqs {
        border-left-color: #818cf8;
    }
    .benefit-card-reqs strong {
        color: var(--t1);
    }

    .btn-benefit-action {
        display: block;
        width: 100%;
        text-align: center;
        background: var(--surface);
        border: 1.5px solid var(--brand);
        color: var(--brand);
        padding: 10px;
        font-size: 13px;
        font-weight: 700;
        border-radius: var(--r-sm);
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
        font-family: inherit;
    }
    body.dark-mode .btn-benefit-action {
        background: rgba(17, 24, 39, 0.4);
        border-color: #6366f1;
        color: #a5b4fc;
    }
    .btn-benefit-action:hover {
        background: var(--brand);
        color: #ffffff;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15);
    }
    body.dark-mode .btn-benefit-action:hover {
        background: #6366f1;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .advice-banner {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
        }
        .advice-banner-content {
            flex-direction: column;
            gap: 8px;
        }
        .advice-banner-btn {
            width: 100%;
        }
    }
</style>
@endpush

@section('mobile-header')
  <!-- Mobile Header -->
  <div class="mob-hdr">
    <div class="mob-greet">Beneficios Estudiantiles 🎁</div>
    <div class="mob-sub">Tus herramientas y becas universitarias</div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Beneficios Estudiantiles <span>🎁</span></div>
@endsection

@section('content')
<div class="benefits-container">
  
  <!-- BANNER CONSEJO -->
  <div class="advice-banner">
    <div class="advice-banner-content">
      <span style="font-size: 24px;">💡</span>
      <div class="advice-banner-text">
        <strong>Consejo Cursus:</strong> Tu <strong>Constancia de Alumno Regular</strong> es la llave de acceso a casi todos estos beneficios. Podés descargarla en formato PDF al instante desde el SIU Guaraní.
      </div>
    </div>
    <button class="advice-banner-btn" onclick="window.open('https://guarani.frh.utn.edu.ar/haedo/', '_blank')">Ir al SIU Guaraní</button>
  </div>

  <div class="filter-tabs-container">
    <button class="filter-tab-btn active" data-category="all">
      <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
      Todos
    </button>
    <button class="filter-tab-btn" data-category="desarrollo">
      <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/><line x1="5" x2="19" y1="16" y2="16"/><line x1="12" x2="12" y1="16" y2="20"/></svg>
      Software y Dev
    </button>
    <button class="filter-tab-btn" data-category="nube">
      <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A5 5 0 0 0 5 14c0 2.76 2.24 5 5 5h7.5Z"/></svg>
      Cloud e Infraestructura
    </button>
    <button class="filter-tab-btn" data-category="becas">
      <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
      Becas y Apoyo
    </button>
    <button class="filter-tab-btn" data-category="suscripciones">
      <svg class="filter-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
      Ocio y Hardware
    </button>
  </div>

  <!-- GRID DE TARJETAS -->
  <div class="benefits-cards-grid" id="benefits-grid">
    
    <!-- TARJETA 1: GitHub Student Developer Pack -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-free">100% Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.76-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">GitHub</div>
            <h4 class="benefit-card-title">Student Developer Pack</h4>
          </div>
        </div>
        <p class="benefit-card-desc">El paquete de herramientas dev más grande del mundo. Incluye GitHub Copilot Pro gratis, GitHub Pro, Figma Professional y créditos de alojamiento.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo institucional o Constancia de Alumno Regular.
        </div>
        <a href="https://education.github.com/pack" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 2: JetBrains All Products Pack -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-free">100% Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#000000"/><path d="M3 13h10v4H3z" fill="#ffffff"/><text x="4" y="10" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold">JB</text></svg>
          </div>
          <div>
            <div class="benefit-card-provider">JetBrains</div>
            <h4 class="benefit-card-title">Licencia Educativa Completa</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso gratuito a todos los IDEs profesionales de JetBrains: WebStorm, PhpStorm, Rider (para C#), IntelliJ IDEA, PyCharm y DataGrip.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo institucional o activar vía GitHub Student Pack.
        </div>
        <a href="https://www.jetbrains.com/community/education/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 3: Becas Manuel Belgrano -->
    <div class="benefit-card" data-category="becas">
      <span class="benefit-card-tag tag-scholarship">Beca Mensual</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Gobierno Nacional</div>
            <h4 class="benefit-card-title">Becas Manuel Belgrano</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Ayuda económica mensual para carreras estratégicas como la TUP. Otorga un estipendio equivalente a 20 horas de salario básico docente.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Regularidad académica e ingresos familiares menores a 3 SMVM.
        </div>
        <a href="https://www.argentina.gob.ar/educacion/becas/becas-manuel-belgrano" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 4: Microsoft Azure for Students -->
    <div class="benefit-card" data-category="nube">
      <span class="benefit-card-tag tag-free">U$S 100</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.571L10.378 24l13.618-20.158H12.723L0 18.571z" fill="#0078d4"/><path d="M12.723 3.842L5.882 12.35l6.841 8.508 11.273-17.016H12.723z" fill="#50e6ff"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Microsoft</div>
            <h4 class="benefit-card-title">Azure for Students</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Crédito de $100 USD anuales en la nube de Azure para hospedar tus bases de datos, APIs y webs. No requiere ingresar tarjeta de crédito.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo de estudiante universitario de la UTN.
        </div>
        <a href="https://azure.microsoft.com/es-es/free/students/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 5: AWS Educate -->
    <div class="benefit-card" data-category="nube">
      <span class="benefit-card-tag tag-free">Créditos</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-server"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/><line x1="10" x2="14" y1="6" y2="6"/><line x1="10" x2="14" y1="18" y2="18"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Amazon Web Services</div>
            <h4 class="benefit-card-title">AWS Educate</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso a laboratorios prácticos autodirigidos de computación en la nube y créditos promocionales para experimentar en la infraestructura de AWS.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Acreditar estatus de estudiante activo.
        </div>
        <a href="https://aws.amazon.com/education/aws-educate/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 6: Boleto Estudiantil Universitario -->
    <div class="benefit-card" data-category="becas">
      <span class="benefit-card-tag tag-scholarship">45 Viajes Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3C13 6.8 11.5 6 10 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2"/><path d="M12 18H6"/><circle cx="16" cy="18" r="2"/><circle cx="8" cy="18" r="2"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Provincia de Bs. As.</div>
            <h4 class="benefit-card-title">Boleto Estudiantil</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Subsidio mensual para transporte público que acredita hasta 45 pasajes gratuitos de colectivo en tu tarjeta SUBE cada mes.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Vivir en PBA, SUBE registrada a tu nombre y regularidad.
        </div>
        <a href="https://www.argentina.gob.ar/servicio/boleto-estudiantil-universitario" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 7: Notion Personal Plus -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-free">100% Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.935 2.135a.8.8 0 0 1 .494-.28L18.423.518a.8.8 0 0 1 .894.622l1.748 11.385a.8.8 0 0 1-.22.68L12.923 21.87a.8.8 0 0 1-.494.28L3.483 23.376a.8.8 0 0 1-.894-.622L.841 11.369a.8.8 0 0 1 .22-.68L2.935 2.135zm2.747 4.148v11.758a.4.4 0 0 0 .546.376L8.8 17.5V5.742a.4.4 0 0 0-.546-.376L5.682 6.2833zm6.318 2.457l3.66 6.84V6.984a.4.4 0 0 0-.4-.4h-1.5a.4.4 0 0 0-.378.267l-1.382 3.89zM18.818 17.5v-8.487l-3.327-6.223a.4.4 0 0 0-.546-.176l-1.573.84a.4.4 0 0 0-.176.546l3.327 6.223V17.5h2.295z"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Notion</div>
            <h4 class="benefit-card-title">Notion for Education</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso gratuito al plan Personal Plus. Permite subir archivos de cualquier tamaño, sincronizar entre dispositivos e invitar a colaboradores.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo institucional o Constancia de Alumno Regular.
        </div>
        <a href="https://www.notion.so/product/notion-for-education" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 8: Spotify Premium para Estudiantes -->
    <div class="benefit-card" data-category="suscripciones">
      <span class="benefit-card-tag tag-discount">50% Descuento</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.307c-.237.388-.747.513-1.138.277-3.048-1.863-6.885-2.286-11.403-1.252-.442.1-.88-.178-.98-.621-.1-.443.178-.88.621-.98 4.962-1.133 9.198-.656 12.624 1.442.39.238.514.748.276 1.134zm1.466-3.26c-.3.49-.938.647-1.428.347-3.488-2.143-8.807-2.766-12.931-1.512-.551.168-1.127-.148-1.295-.7-.168-.552.148-1.128.7-1.296 4.717-1.433 10.575-.75 14.607 1.733.49.3.647.938.347 1.428zm.126-3.414c-4.184-2.485-11.08-2.716-15.074-1.502-.642.195-1.316-.172-1.511-.814-.195-.643.173-1.317.814-1.512 4.582-1.392 12.186-1.116 16.998 1.74.578.343.768 1.096.425 1.674-.343.578-1.096.768-1.674.424z"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Spotify</div>
            <h4 class="benefit-card-title">Spotify Premium Universitario</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Toda tu música y podcasts sin publicidad en segundo plano por la mitad de la tarifa regular. Verificación instantánea vía UNiDAYS.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Constancia de Alumno Regular o credencial UTN.
        </div>
        <a href="https://www.spotify.com/ar/student/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 9: Portal de Estudiantes Samsung -->
    <div class="benefit-card" data-category="suscripciones">
      <span class="benefit-card-tag tag-discount">Hasta 20% Off</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Samsung</div>
            <h4 class="benefit-card-title">Descuentos en Tecnología</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso a la tienda estudiantil oficial con precios especiales en notebooks, tablets, monitores y celulares para cursar programación.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Cuenta estudiantil registrada o mail institucional.
        </div>
        <a href="https://www.samsung.com/ar/multistore/members_educacion/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 10: DigitalOcean -->
    <div class="benefit-card" data-category="nube">
      <span class="benefit-card-tag tag-free">U$S 200</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0080FF" xmlns="http://www.w3.org/2000/svg"><path d="M12.04 0C5.408-.02.005 5.37.005 11.992h4.638c0-4.923 4.882-8.731 10.064-6.855a6.95 6.95 0 014.147 4.148c1.889 5.177-1.924 10.055-6.84 10.064v-4.61H7.391v4.623h4.61V24c7.86 0 13.967-7.588 11.397-15.83-1.115-3.59-3.985-6.446-7.575-7.575A12.8 12.8 0 0012.039 0zM7.39 19.362H3.828v3.564H7.39zm-3.563 0v-2.978H.85v2.978z"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">DigitalOcean</div>
            <h4 class="benefit-card-title">Créditos de Alojamiento Cloud</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Crédito gratuito de $200 USD durante 1 año para crear Droplets (VPS), bases de datos y clústeres de Kubernetes. Requiere ingresar tarjeta de crédito o PayPal para verificación.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Activar a través del GitHub Student Developer Pack.
        </div>
        <a href="https://www.digitalocean.com/products/github-student-developer-pack" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 11: Adobe Creative Cloud -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-discount">60% Descuento</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 91 80" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56.9686 0H90.4318V80L56.9686 0Z" fill="#EB1000"/><path d="M33.4632 0H0V80L33.4632 0Z" fill="#EB1000"/><path d="M45.1821 29.4668L66.5199 80.0002H52.5657L46.1982 63.9461H30.6182L45.1821 29.4668Z" fill="#EB1000"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Adobe</div>
            <h4 class="benefit-card-title">Creative Cloud para Estudiantes</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Suscripción a todo el catálogo de aplicaciones de Adobe (Photoshop, Illustrator, Premiere Pro, Acrobat Pro) con más del 60% de descuento para estudiantes de educación superior.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo institucional (.edu.ar) o Constancia de Alumno Regular.
        </div>
        <a href="https://www.adobe.com/ar/creativecloud/buy/students.html" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 12: Unity Student Plan -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-free">100% Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.999 1.5L22.499 7.5V19.5L11.999 25.5L1.499 19.5V7.5L11.999 1.5ZM11.999 4.168L3.749 8.937V18.437L11.999 23.206L20.249 18.437V8.937L11.999 4.168ZM12.001 10.125L16.201 12.562L12.001 15L7.801 12.562L12.001 10.125Z"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Unity</div>
            <h4 class="benefit-card-title">Unity Student Plan</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso gratuito a Unity Pro, recursos educativos avanzados en Unity Learn Premium y herramientas de desarrollo para la creación de videojuegos 2D/3D.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Estudiante mayor de 16 años verificado vía GitHub Student Pack.
        </div>
        <a href="https://unity.com/es/products/unity-student" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 13: Coursera -->
    <div class="benefit-card" data-category="becas">
      <span class="benefit-card-tag tag-free">100% Gratis</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0056D2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Coursera</div>
            <h4 class="benefit-card-title">Becas y Ayuda Económica</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Acceso gratuito a certificaciones oficiales de Google, IBM, Microsoft y universidades internacionales solicitando el programa de ayuda económica por curso.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Enviar solicitud justificando tu situación socioeconómica.
        </div>
        <a href="https://www.coursera.org/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 14: Platzi -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-discount">Precio Especial</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#00C29D"/><path d="M7 6L13 12L7 18" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 18H17" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Platzi</div>
            <h4 class="benefit-card-title">Suscripción Educativa Especial</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Tarifa reducida en el plan de suscripción anual Expert para estudiantes de educación superior de Latinoamérica. Acceso completo a todas las escuelas.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Correo institucional (.edu.ar) activo.
        </div>
        <a href="https://platzi.com/expert-estudiantes/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 15: EducaciónIT -->
    <div class="benefit-card" data-category="desarrollo">
      <span class="benefit-card-tag tag-discount">Hasta 30% Off</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#F29111"/><text x="4" y="16" fill="white" font-family="Outfit, sans-serif" font-size="12" font-weight="900">IT</text></svg>
          </div>
          <div>
            <div class="benefit-card-provider">EducaciónIT</div>
            <h4 class="benefit-card-title">Descuento para Universitarios</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Capacitación tecnológica con descuento exclusivo en cursos y carreras cortas de programación, bases de datos y DevOps. Ideal para complementar la TUP.</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Constancia de Alumno Regular para validar descuento.
        </div>
        <a href="https://www.educacionit.com/" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

    <!-- TARJETA 16: Becas Progresar -->
    <div class="benefit-card" data-category="becas">
      <span class="benefit-card-tag tag-scholarship">$35.000 / Mes</span>
      <div>
        <div class="benefit-card-header">
          <div class="benefit-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a2e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          </div>
          <div>
            <div class="benefit-card-provider">Ministerio de Capital Humano</div>
            <h4 class="benefit-card-title">Becas Progresar (Educación Superior)</h4>
          </div>
        </div>
        <p class="benefit-card-desc">Ayuda económica mensual para estudiantes universitarios. Otorga $35.000 brutos al mes ($28.000 netos mensuales, reteniendo el 20% que se cobra al certificar regularidad).</p>
      </div>
      <div>
        <div class="benefit-card-reqs">
          <strong>Requisito:</strong> Ser alumno regular de UTN, de 17 a 24 años, e ingresos familiares menores a 3 SMVM.
        </div>
        <a href="https://www.argentina.gob.ar/educacion/progresar" target="_blank" class="btn-benefit-action">Solicitar beneficio</a>
      </div>
    </div>

  </div>

</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // ================= FILTRADO DINÁMICO DE TARJETAS =================
        const filterButtons = document.querySelectorAll('.filter-tab-btn');
        const cards = document.querySelectorAll('.benefit-card');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedCategory = btn.getAttribute('data-category');

                cards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // ================= EFECTO CURSOR GLOW INTERACTIVO =================
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

    });
</script>
@endpush
