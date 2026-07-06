<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Cursus es el organizador académico y asistente de productividad definitivo para la Tecnicatura en Programación de la UTN Regional Haedo. Controlá tu promedio, correlatividades, cronómetro Pomodoro y cuotas en un solo lugar.">
    <meta name="keywords" content="Cursus, UTN Haedo, UTN, TUP, Tecnicatura Programación, Estudiantes, Pomodoro, Correlatividades, Autogestión, Campus Virtual, Universidad">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Cursus - Tu Asistente Universitario UTN Haedo">
    <meta property="og:description" content="Organizá tu cursada, simulá tu promedio, planificá tus correlativas y gestioná tus tiempos con el Pomodoro integrado. Diseñado por y para alumnos de la UTN.">
    <meta property="og:image" content="{{ asset('img/landing_hero.png') }}">
    
    <title>Cursus - Tu Asistente Universitario UTN Haedo</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
    <script src="https://unpkg.com/lucide@latest"></script>
     <style>
        /* Estilos específicos para la Landing Page de Cursus */
        :root {
            /* Light theme variables */
            --bg-color: #f5f7fc;
            --text-main: #1e293b;
            --text-heading: #0f172a;
            --text-muted: #475569;
            --text-desc: #64748b;
            --card-bg: rgba(255, 255, 255, 0.7);
            --card-bg-hover: #ffffff;
            --card-border: rgba(226, 232, 240, 0.8);
            --card-shadow: rgba(0, 0, 0, 0.01);
            --header-bg: rgba(245, 247, 252, 0.8);
            --header-border: rgba(226, 232, 240, 0.8);
            --bg-input: #ffffff;
            
            --hero-border: rgba(226, 232, 240, 0.8);
            --global-bg-opacity: 0.07;
            
            --table-th-bg: rgba(241, 245, 249, 0.5);
            --table-td-bg-siu: rgba(241, 245, 249, 0.5);
            --table-td-bg-cursus: rgba(99, 102, 241, 0.05);
            --faq-answer-bg: rgba(255, 255, 255, 0.3);
            
            --mock-bg: #ffffff;
            --mock-border: #cbd5e1;
            --mock-hdr-bg: #f8fafc;
            --mock-sidebar-bg: #0f172a;
            --mock-main-bg: #fafbfc;
            --mock-widget-bg: #ffffff;

            --brand: #4f46e5;
            --brand-hover: #4338ca;
            --brand-light: #eef2ff;
            --brand-dim: #c7d2fe;
            --r: 12px;
            --r-sm: 8px;
            --r-lg: 16px;

            /* Nuevas variables de diseño premium */
            --brand-gradient: linear-gradient(135deg, #5c4fe5 0%, #06b6d4 100%);
            --brand-gradient-hover: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
            --text-gradient: linear-gradient(135deg, #5c4fe5 0%, #0891b2 100%);
            --bg-gradient-aurora: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.18) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.12) 0px, transparent 50%);
            --gray-card-bg: rgba(241, 245, 249, 0.75);
            --gray-card-border: rgba(226, 232, 240, 0.9);
            --gray-card-bg-hover: rgba(226, 232, 240, 0.85);
        }

        body.dark-mode {
            /* Dark theme variables */
            --bg-color: #070a13;
            --text-main: #cbd5e1;
            --text-heading: #f8fafc;
            --text-muted: #94a3b8;
            --text-desc: #64748b;
            --card-bg: rgba(17, 24, 39, 0.75);
            --card-bg-hover: rgba(30, 41, 59, 0.9);
            --card-border: rgba(30, 41, 59, 0.8);
            --card-shadow: rgba(0, 0, 0, 0.15);
            --header-bg: rgba(7, 10, 19, 0.85);
            --header-border: rgba(30, 41, 59, 0.8);
            --bg-input: #1e293b;
            
            --hero-border: rgba(30, 41, 59, 0.8);
            --global-bg-opacity: 0.05;
            
            --table-th-bg: rgba(15, 23, 42, 0.6);
            --table-td-bg-siu: rgba(15, 23, 42, 0.6);
            --table-td-bg-cursus: rgba(99, 102, 241, 0.15);
            --faq-answer-bg: rgba(0, 0, 0, 0.2);
            
            --mock-bg: #0f172a;
            --mock-border: #1e293b;
            --mock-hdr-bg: #1e293b;
            --mock-sidebar-bg: #070a13;
            --mock-main-bg: #111827;
            --mock-widget-bg: #1e293b;
            
            --brand: #818cf8;
            --brand-hover: #6366f1;
            --brand-light: rgba(99, 102, 241, 0.2);
            --brand-dim: rgba(99, 102, 241, 0.4);
            
            --brand-gradient: linear-gradient(135deg, #818cf8 0%, #22d3ee 100%);
            --brand-gradient-hover: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
            --text-gradient: linear-gradient(135deg, #a5b4fc 0%, #22d3ee 100%);
            --bg-gradient-aurora: 
                radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.18) 0px, transparent 50%),
                radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%);
            --gray-card-bg: rgba(30, 41, 59, 0.65);
            --gray-card-border: rgba(51, 65, 85, 0.65);
            --gray-card-bg-hover: rgba(30, 41, 59, 0.8);
            
            background-image: var(--bg-gradient-aurora);
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            position: relative;
            background-image: var(--bg-gradient-aurora);
            background-size: 200% 200%;
            animation: aurora 15s infinite alternate ease-in-out;
            transition: background-color 0.3s, color 0.3s, background-image 0.3s;
        }
        @keyframes aurora {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 100%; }
        }

        /* Background Blobs (Efectos de luces flotantes de fondo) */
        .blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            -webkit-filter: blur(80px);
            z-index: -1;
            opacity: 0.12;
            animation: float 14s infinite alternate ease-in-out;
            pointer-events: none;
        }
        .blob-1 {
            width: 350px;
            height: 350px;
            background: rgba(99, 102, 241, 0.15); /* violet */
            top: 5%;
            left: -5%;
        }
        .blob-2 {
            width: 320px;
            height: 320px;
            background: rgba(16, 185, 129, 0.15); /* emerald */
            top: 40%;
            right: -5%;
            animation-delay: -5s;
        }
        .blob-3 {
            width: 350px;
            height: 350px;
            background: rgba(236, 72, 153, 0.12); /* pink */
            bottom: 15%;
            left: 5%;
            animation-delay: -3s;
        }
        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(50px, 40px) scale(1.15); }
        }

        /* Header Sticky */
        .landing-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 75px;
            background: var(--header-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--header-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 5%;
            z-index: 1000;
            transition: all 0.3s ease;
        }
        .landing-header.scrolled {
            background: var(--card-bg-hover);
            box-shadow: 0 10px 30px var(--card-shadow);
            height: 65px;
        }
        .logo-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: inherit;
        }
        .logo-ic {
            font-size: 24px;
        }
        .logo-tx {
            font-weight: 700;
            font-size: 20px;
            color: var(--text-heading);
            display: flex;
            flex-direction: column;
            line-height: 1.1;
        }
        .logo-tx small {
            font-size: 10px;
            font-weight: 500;
            color: var(--text-desc);
        }
        .landing-nav {
            display: flex;
            align-items: center;
            gap: 32px;
        }
        .landing-nav a {
            text-decoration: none;
            color: var(--text-muted);
            font-weight: 500;
            font-size: 14px;
            transition: color 0.2s, font-weight 0.2s;
        }
        .landing-nav a:hover, .landing-nav a.active-link {
            color: var(--brand);
        }
        .landing-nav a.active-link {
            font-weight: 700;
        }
        .landing-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .btn-login {
            text-decoration: none;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 14px;
            padding: 10px 20px;
            transition: color 0.2s;
        }
        .btn-login:hover {
            color: var(--brand);
        }
        .btn-register {
            text-decoration: none;
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #ffffff !important;
            font-weight: 600;
            font-size: 14px;
            padding: 10px 22px;
            border-radius: 30px;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25), 0 2px 5px rgba(6, 182, 212, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
        }
        .btn-register:hover {
            background-position: right center;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35), 0 4px 10px rgba(6, 182, 212, 0.25);
        }

        /* Global Fixed Background */
        .global-fixed-bg {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: var(--hero-bg-url);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: var(--global-bg-opacity, 0.07);
            filter: grayscale(15%) blur(1.8px);
            z-index: -2;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        /* Hero Section */
        .hero-wrapper {
            width: 100%;
            position: relative;
            overflow: hidden;
            background: transparent;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding-top: 80px;
        }

        .hero-section {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 40px;
            padding: 40px 5%;
            align-items: center;
            max-width: 1300px;
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
        }
        .hero-info {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .badge-utn {
            background: #eef2ff;
            color: var(--brand);
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            padding: 6px 14px;
            border-radius: 20px;
            width: fit-content;
            letter-spacing: 0.8px;
            border: 1px solid var(--brand-dim);
        }
        .hero-title {
            font-size: 48px;
            font-weight: 800;
            color: var(--text-heading);
            line-height: 1.15;
            margin: 0;
        }
        .hero-title span {
            background: var(--text-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: var(--brand);
            display: inline-block;
        }
        .hero-desc {
            font-size: 17px;
            color: var(--text-muted);
            line-height: 1.6;
            margin: 0;
            max-width: 520px;
        }
        .hero-btns {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 10px;
        }
        .btn-hero-primary {
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #fff !important;
            font-weight: 600;
            font-size: 15px;
            padding: 14px 30px;
            border-radius: 30px;
            text-decoration: none;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25), 0 2px 5px rgba(6, 182, 212, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
        }
        .btn-hero-primary:hover {
            background-position: right center;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.35), 0 4px 10px rgba(6, 182, 212, 0.25);
        }
        .btn-hero-secondary {
            background: var(--card-bg);
            color: var(--text-main);
            font-weight: 600;
            font-size: 15px;
            padding: 14px 30px;
            border-radius: 30px;
            text-decoration: none;
            border: 1px solid var(--card-border);
            transition: all 0.2s;
        }
        .btn-hero-secondary:hover {
            border-color: var(--brand);
            background: var(--card-bg-hover);
        }
        
        /* Interactive Mock Dashboard in Hero */
        .hero-visual {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .mock-dashboard {
            width: 100%;
            max-width: 460px;
            background: #ffffff;
            border-radius: var(--r);
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
            border: 1px solid #cbd5e1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            z-index: 10;
        }
        .mock-hdr-dots {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .mock-hdr-dots .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        .mock-hdr-dots .dot.red { background: #ef4444; }
        .mock-hdr-dots .dot.yellow { background: #eab308; }
        .mock-hdr-dots .dot.green { background: #22c55e; }
        .mock-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            margin-left: 10px;
        }
        .mock-body {
            display: flex;
            height: 270px;
        }
        .mock-sidebar {
            width: 45px;
            background: #0f172a;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px 0;
            gap: 12px;
            color: #475569;
        }
        .mock-sb-item {
            font-size: 16px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .mock-sb-item.active {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
        }
        .mock-sb-item:hover {
            color: #ffffff;
        }
        .mock-main {
            flex: 1;
            background: #fafbfc;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow: hidden;
        }
        .mock-widget {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: var(--r-sm);
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .widget-title {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .timer-display {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            text-align: center;
            margin-bottom: 6px;
        }
        .btn-demo-timer {
            display: block;
            margin: 0 auto;
            background: var(--brand);
            color: #fff;
            border: none;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 14px;
            border-radius: 20px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn-demo-timer:hover {
            background: var(--brand-hover);
        }
        .demo-kanban {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .kanban-col {
            background: #f8fafc;
            border-radius: 4px;
            padding: 6px;
            min-height: 50px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .kanban-col-title {
            font-size: 9px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .demo-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px;
            font-size: 10px;
            font-weight: 600;
            color: #334155;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            transition: all 0.2s;
        }
        .demo-card:hover {
            border-color: var(--brand);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(79, 70, 229, 0.05);
        }
        .demo-tab-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: 100%;
        }

        /* Secciones Generales */
        .section {
            padding: 100px 5%;
            max-width: 1300px;
            margin: 0 auto;
        }
        .section-header {
            text-align: center;
            max-width: 650px;
            margin: 0 auto 60px auto;
        }
        .section-lbl {
            color: var(--brand);
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 12px;
            display: block;
        }
        .section-title {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 16px 0;
            line-height: 1.2;
        }
        .section-desc {
            font-size: 15px;
            color: #64748b;
            line-height: 1.6;
            margin: 0;
        }

        /* Animación de Revelado al Scroll */
        .reveal {
            opacity: 0;
            transform: translateY(35px);
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }

        /* Staggered Scroll Delays */
        .reveal.active:nth-child(1) { transition-delay: 0.0s; }
        .reveal.active:nth-child(2) { transition-delay: 0.1s; }
        .reveal.active:nth-child(3) { transition-delay: 0.2s; }
        .reveal.active:nth-child(4) { transition-delay: 0.3s; }

        /* Quiénes Somos / Propósito */
        .purpose-section {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border-radius: var(--r);
            padding: 60px;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 50px;
            align-items: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .purpose-visual {
            font-size: 80px;
            text-align: center;
            background: #fff;
            border-radius: var(--r);
            padding: 40px 0;
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }
        .purpose-text h3 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 16px 0;
        }
        .purpose-text p {
            font-size: 15px;
            color: #475569;
            line-height: 1.7;
            margin: 0 0 16px 0;
        }
        .purpose-highlight {
            font-weight: 600;
            color: var(--brand);
        }

        /* Cómo funciona (Paso a Paso) */
        .steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-top: 40px;
        }
        .step-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: var(--r);
            padding: 30px 24px;
            position: relative;
            transition: all 0.3s;
        }
        .step-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(99, 102, 241, 0.03);
            border-color: rgba(99, 102, 241, 0.3);
            background: #ffffff;
        }
        .step-num {
            position: absolute;
            bottom: -5px;
            right: 15px;
            font-size: 80px;
            font-weight: 900;
            color: var(--text-heading);
            opacity: 0.04;
            line-height: 1;
            user-select: none;
            pointer-events: none;
            transition: all 0.3s ease;
            z-index: 1;
        }
        .step-card:hover .step-num {
            opacity: 0.09;
            color: var(--brand);
            transform: scale(1.05);
        }
        .step-icon {
            font-size: 32px;
            margin-bottom: 20px;
        }
        .step-title {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 10px 0;
        }
        .step-desc {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.6;
            margin: 0;
        }

        /* Beneficios */
        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
        }
        .benefit-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: var(--r);
            padding: 36px;
            display: flex;
            gap: 24px;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .benefit-card:hover {
            transform: translateY(-6px);
            background: #ffffff;
        }
        /* Glow shadows en hover específicos */
        .benefit-card:nth-child(1):hover {
            box-shadow: 0 20px 30px rgba(99, 102, 241, 0.08), 0 0 20px rgba(99, 102, 241, 0.04);
            border-color: rgba(99, 102, 241, 0.4);
        }
        .benefit-card:nth-child(2):hover {
            box-shadow: 0 20px 30px rgba(16, 185, 129, 0.08), 0 0 20px rgba(16, 185, 129, 0.04);
            border-color: rgba(16, 185, 129, 0.4);
        }
        .benefit-card:nth-child(3):hover {
            box-shadow: 0 20px 30px rgba(245, 158, 11, 0.08), 0 0 20px rgba(245, 158, 11, 0.04);
            border-color: rgba(245, 158, 11, 0.4);
        }
        .benefit-card:nth-child(4):hover {
            box-shadow: 0 20px 30px rgba(239, 68, 68, 0.08), 0 0 20px rgba(239, 68, 68, 0.04);
            border-color: rgba(239, 68, 68, 0.4);
        }

        .benefit-icon-box {
            width: 56px;
            height: 56px;
            background: var(--brand-light);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            flex-shrink: 0;
            color: var(--brand);
        }
        .benefit-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .benefit-title {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
        }
        .benefit-desc {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin: 0;
        }

        /* Preguntas Frecuentes (FAQs) Accordion */
        .faq-container {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .faq-item {
            background: var(--card-bg);
            backdrop-filter: blur(8px);
            border: 1px solid var(--card-border);
            border-radius: var(--r);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .faq-item:hover {
            transform: translateY(-2px);
            border-color: var(--brand);
            box-shadow: 0 10px 20px var(--card-shadow);
        }
        .faq-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--brand-gradient);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .faq-item.open::before {
            opacity: 1;
        }
        .faq-question {
            padding: 20px 24px;
            font-size: 15px;
            font-weight: 700;
            color: var(--text-heading);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            transition: color 0.3s;
        }
        .faq-question:hover {
            background: var(--card-bg-hover);
        }
        .faq-item.open .faq-question {
            color: var(--brand);
        }
        .faq-arrow {
            width: 18px;
            height: 18px;
            stroke-width: 2.5;
            color: var(--text-desc);
            transition: transform 0.3s, color 0.3s;
        }
        .faq-item.open .faq-arrow {
            transform: rotate(180deg);
            color: var(--brand);
        }
        .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            background: var(--faq-answer-bg);
            border-top: 0 solid var(--card-border);
        }
        .faq-answer p {
            padding: 16px 24px 20px 24px;
            font-size: 13.5px;
            color: var(--text-muted);
            line-height: 1.6;
            margin: 0;
        }
        .faq-item.open {
            border-color: var(--brand);
            background: var(--card-bg-hover);
            box-shadow: 0 12px 25px var(--card-shadow);
        }
        .faq-item.open .faq-answer {
            border-top-width: 1px;
        }

        /* Contacto */
        .contact-layout {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 60px;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: var(--r);
            padding: 60px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
        }
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .contact-title {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 8px 0;
        }
        .contact-desc {
            font-size: 15px;
            color: #475569;
            line-height: 1.6;
            margin: 0;
        }
        .contact-details {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 10px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: #475569;
        }
        .contact-icon {
            font-size: 18px;
        }
        .contact-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .form-label {
            font-size: 12.5px;
            font-weight: 600;
            color: #475569;
        }
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 12px;
            border-radius: var(--r-sm);
            border: 1px solid #cbd5e1;
            background: #fff;
            font-family: inherit;
            font-size: 14px;
            color: #0f172a;
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        .form-input::placeholder, .form-textarea::placeholder {
            color: #94a3b8;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            border-color: var(--brand);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .form-textarea {
            resize: vertical;
            min-height: 110px;
        }
        .btn-submit {
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #fff !important;
            font-family: inherit;
            font-weight: 600;
            font-size: 14.5px;
            padding: 14px;
            border-radius: var(--r-sm);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25), 0 2px 4px rgba(6, 182, 212, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-submit:hover {
            background-position: right center;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35), 0 4px 8px rgba(6, 182, 212, 0.25);
        }
        .error-lbl {
            font-size: 11px;
            color: var(--red);
            font-weight: 500;
            margin-top: 4px;
            display: none;
        }

        /* Success Modal */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-box {
            background: #fff;
            border-radius: var(--r);
            padding: 32px;
            width: 400px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .modal-overlay.open .modal-box {
            transform: scale(1);
        }
        .modal-icon {
            font-size: 50px;
            margin-bottom: 16px;
        }
        .modal-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
        }
        .modal-desc {
            font-size: 13.5px;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 24px;
        }
        .btn-modal-close {
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #fff !important;
            font-family: inherit;
            font-weight: 600;
            font-size: 13.5px;
            padding: 10px 24px;
            border-radius: var(--r-sm);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2), 0 2px 4px rgba(6, 182, 212, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-modal-close:hover {
            background-position: right center;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3), 0 4px 8px rgba(6, 182, 212, 0.2);
        }

        /* Footer */
        .landing-footer {
            background: #0f172a;
            color: #94a3b8;
            padding: 60px 5% 40px 5%;
            border-top: 1px solid #1e293b;
        }
        .footer-layout {
            max-width: 1300px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 24px;
            padding-bottom: 40px;
            border-bottom: 1px solid #1e293b;
        }
        .footer-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #fff;
            text-decoration: none;
        }
        .footer-logo-tx {
            font-weight: 700;
            font-size: 18px;
            line-height: 1.1;
        }
        .footer-logo-tx small {
            font-size: 9px;
            color: #64748b;
            display: block;
        }
        .footer-nav {
            display: flex;
            gap: 30px;
        }
        .footer-nav a {
            text-decoration: none;
            color: #94a3b8;
            font-size: 14px;
            transition: color 0.2s;
        }
        .footer-nav a:hover {
            color: #fff;
        }
        .footer-bottom {
            max-width: 1300px;
            margin: 0 auto;
            padding-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            flex-wrap: wrap;
            gap: 16px;
        }

        /* Mobile Responsive */
        @media (max-width: 992px) {
            .hero-section {
                grid-template-columns: 1fr;
                padding: 30px 5% 50px 5%;
                text-align: center;
            }
            .hero-info {
                align-items: center;
            }
            .hero-desc {
                max-width: 100%;
            }
            .purpose-section {
                grid-template-columns: 1fr;
                padding: 40px;
            }
            .steps-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .benefits-grid {
                grid-template-columns: 1fr;
            }
            .contact-layout {
                grid-template-columns: 1fr;
                padding: 40px;
                gap: 40px;
            }
            .landing-nav {
                display: none;
            }
        }

        @media (max-width: 600px) {
            .landing-header {
                padding: 0 12px;
                height: 60px;
            }
            .landing-header.scrolled {
                height: 55px;
            }
            .logo-wrap img {
                height: 30px !important;
            }
            .logo-tx {
                font-size: 15px;
            }
            .logo-tx small {
                display: none;
            }
            .theme-toggle-btn {
                width: 32px;
                height: 32px;
            }
            .hero-title {
                font-size: 34px;
            }
            .steps-grid {
                grid-template-columns: 1fr;
            }
            .form-row {
                grid-template-columns: 1fr;
            }
            .landing-actions {
                gap: 4px;
            }
            .btn-login {
                padding: 6px 8px;
                font-size: 12.5px;
            }
            .btn-register {
                padding: 6px 12px;
                font-size: 12.5px;
            }
        }

        /* Ocultar barra de desplazamiento de la tabla comparativa */
        .table-wrapper {
            max-width: 900px;
            margin: 0 auto;
            overflow-x: auto;
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .table-wrapper::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }

        /* ==========================================
           DARK MODE OVERRIDES & GLOW STYLES
           ========================================== */
        
        /* Apply variables to existing classes */
        .mock-dashboard {
            background: var(--mock-bg);
            border-color: var(--mock-border);
            box-shadow: 0 20px 40px var(--card-shadow);
        }
        .mock-hdr-dots {
            background: var(--mock-hdr-bg);
            border-bottom-color: var(--mock-border);
        }
        .mock-sidebar {
            background: var(--mock-sidebar-bg);
        }
        .mock-main {
            background: var(--mock-main-bg);
        }
        .mock-widget {
            background: var(--mock-widget-bg);
            border-color: var(--mock-border);
            box-shadow: 0 1px 3px var(--card-shadow);
        }
        .kanban-col {
            background: var(--mock-hdr-bg);
        }
        .demo-card {
            background: var(--mock-widget-bg);
            border-color: var(--mock-border);
            color: var(--text-main);
            box-shadow: 0 1px 2px var(--card-shadow);
        }
        .section-title {
            color: var(--text-heading);
        }
        .section-desc {
            color: var(--text-desc);
        }
        .purpose-section {
            background: var(--card-bg);
            border-color: var(--card-border);
            box-shadow: 0 10px 30px var(--card-shadow);
        }
        .purpose-visual {
            background: var(--card-bg-hover);
            border-color: var(--card-border);
            box-shadow: 0 4px 15px var(--card-shadow);
        }
        .purpose-text h3 {
            color: var(--text-heading);
        }
        .purpose-text p {
            color: var(--text-muted);
        }
        .step-card {
            background: var(--card-bg);
            border-color: var(--card-border);
        }
        .step-card:hover {
            background: var(--card-bg-hover);
            box-shadow: 0 12px 24px var(--card-shadow);
        }

        .step-title {
            color: var(--text-heading);
        }
        .step-desc {
            color: var(--text-desc);
        }
        .benefit-card {
            background: var(--card-bg);
            border-color: var(--card-border);
        }
        .benefit-card:hover {
            background: var(--card-bg-hover);
        }
        .benefit-title {
            color: var(--text-heading);
        }
        .benefit-desc {
            color: var(--text-muted);
        }

        .contact-layout {
            background: var(--card-bg);
            border-color: var(--card-border);
            box-shadow: 0 10px 30px var(--card-shadow);
        }
        .contact-title {
            color: var(--text-heading);
        }
        .contact-desc, .contact-item, .form-label {
            color: var(--text-muted);
        }
        .form-input, .form-select, .form-textarea {
            border-color: var(--card-border);
            background: var(--bg-input);
            color: var(--text-heading);
        }

        /* Testimonials Styles */
        .testimonial-card {
            background: var(--card-bg);
            backdrop-filter: blur(8px);
            border: 1px solid var(--card-border);
            border-radius: var(--r);
            padding: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .testimonial-card:hover {
            transform: translateY(-5px);
            background: var(--card-bg-hover);
            box-shadow: 0 12px 24px var(--card-shadow);
            border-color: rgba(99, 102, 241, 0.2);
        }

        /* Cursor Glow Effect */
        .benefit-card, .step-card, .testimonial-card {
            position: relative;
            overflow: hidden;
        }
        .benefit-card::before, .step-card::before, .testimonial-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: inherit;
            background: radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 100%);
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
            z-index: 1;
        }
        body.dark-mode .benefit-card::before, 
        body.dark-mode .step-card::before, 
        body.dark-mode .testimonial-card::before {
            background: radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(34, 211, 238, 0.15) 0%, rgba(129, 140, 248, 0.15) 50%, transparent 100%);
        }
        .benefit-card:hover::before, .step-card:hover::before, .testimonial-card:hover::before {
            opacity: 1;
        }
        .benefit-card *, .step-card *, .testimonial-card * {
            position: relative;
            z-index: 2;
        }

        /* Dark Mode Button Styles */
        .theme-toggle-btn {
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(226, 232, 240, 0.8);
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.25s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            outline: none;
        }
        .theme-toggle-btn:hover {
            background: #ffffff;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            border-color: var(--brand);
        }
        body.dark-mode .theme-toggle-btn {
            background: rgba(17, 24, 39, 0.5);
            border-color: rgba(30, 41, 59, 0.8);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        body.dark-mode .theme-toggle-btn:hover {
            background: rgba(30, 41, 59, 0.9);
            border-color: var(--brand);
        }
        body.dark-mode .logo-wrap img {
            filter: brightness(0.9);
        }
        .theme-toggle-btn .icon-sun { display: none; color: #f59e0b; }
        .theme-toggle-btn .icon-moon { display: block; color: #6366f1; }
        body.dark-mode .theme-toggle-btn .icon-sun { display: block; }
        body.dark-mode .theme-toggle-btn .icon-moon { display: none; }

        /* Botón Volver Arriba */
        .scroll-top-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            color: var(--text-heading);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px) scale(0.9);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px var(--card-shadow);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            outline: none;
        }
        .scroll-top-btn:hover {
            background: var(--brand-gradient);
            color: #ffffff;
            border-color: transparent;
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }
        .scroll-top-btn.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        /* Tooltips para la Tabla Comparativa */
        .tooltip-trigger {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .tooltip-trigger::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%) translateY(5px);
            background: var(--mock-bg);
            color: var(--text-main);
            border: 1px solid var(--card-border);
            padding: 8px 12px;
            border-radius: var(--r-sm);
            font-size: 11px;
            font-weight: 500;
            line-height: 1.4;
            width: 220px;
            white-space: normal;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            pointer-events: none;
            text-align: center;
        }
        .tooltip-trigger::before {
            content: '';
            position: absolute;
            bottom: 110%;
            left: 50%;
            transform: translateX(-50%) translateY(5px);
            border-width: 6px 6px 0;
            border-style: solid;
            border-color: var(--card-border) transparent transparent;
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            pointer-events: none;
        }
        .tooltip-trigger:hover::after,
        .tooltip-trigger:hover::before {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }
        /* Ajuste de tooltip en modo oscuro */
        body.dark-mode .tooltip-trigger::after {
            background: #1e293b;
            border-color: #334155;
            color: #f8fafc;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        body.dark-mode .tooltip-trigger::before {
            border-color: #334155 transparent transparent;
        }
    </style>
</head>
<body>

    <!-- FONDO FIJO GLOBAL DE LA FACULTAD -->
    <div class="global-fixed-bg" style="--hero-bg-url: url('{{ asset('assets/img/utn-haedo.jpg') }}');"></div>

    <!-- BACKGROUND BLOBS FLOTANTES -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <!-- MENÚ DE NAVEGACIÓN -->
    <header class="landing-header" id="js-header">
        <a href="#" class="logo-wrap">
            <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" style="height: 38px; width: auto; border-radius: 8px;">
            <div class="logo-tx">
                Cursus
                <small>UTN Haedo</small>
            </div>
        </a>

        <nav class="landing-nav">
            <a href="#que-es">Qué es</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#faq">Preguntas</a>
            <a href="{{ route('contacto') }}">Contacto</a>
        </nav>

        <div class="landing-actions">
            <button id="theme-toggle" class="theme-toggle-btn" aria-label="Cambiar tema">
                <i data-lucide="sun" class="icon-sun" style="width: 18px; height: 18px; stroke-width: 2.25;"></i>
                <i data-lucide="moon" class="icon-moon" style="width: 18px; height: 18px; stroke-width: 2.25;"></i>
            </button>
            @if (Route::has('login'))
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-register">Ir al Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="btn-login">Iniciar sesión</a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="btn-register">Registrarse</a>
                    @endif
                @endauth
            @endif
        </div>
    </header>

    <!-- SECCIÓN HERO CON MINI-DASHBOARD INTERACTIVO -->
    <div class="hero-wrapper">
        <section class="hero-section">
        <div class="hero-info">
            <div class="badge-utn">Asistente Estudiantil</div>
            <h1 class="hero-title">Tu camino universitario, organizado en <span>un solo lugar</span></h1>
            <p class="hero-desc">
                Diseñado especialmente para la UTN Regional Haedo. Controlá tus materias, hacé seguimiento de tus correlativas, medí tu tiempo de estudio y visualizá tu fecha de egreso.
            </p>
            <div class="hero-btns">
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-hero-primary">Ir al Dashboard</a>
                @else
                    <a href="{{ route('register') }}" class="btn-hero-primary">Empezar gratis</a>
                @endauth
                <a href="#que-es" class="btn-hero-secondary">Ver funciones</a>
            </div>
        </div>
        <div class="hero-visual">
            <!-- MOCK DASHBOARD ESTÁTICO -->
            <div class="mock-dashboard">
                <div class="mock-hdr-dots">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="mock-title">Cursus — Demo Interactiva 🧪</span>
                </div>
                <div class="mock-body" style="height: 350px;">
                    <!-- App-like Sidebar (Interactivo) -->
                    <div class="mock-sidebar" style="width: 75px; gap: 12px; padding: 16px 0;">
                        <div class="mock-sb-item active" data-mock-tab="inicio" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; cursor: pointer;">
                            <span>⊞</span>
                            <span style="font-size: 10px; font-weight: 500;">Inicio</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="materias" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>📚</span>
                            <span style="font-size: 10px; font-weight: 500;">Materias</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="estudio" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>⏱️</span>
                            <span style="font-size: 10px; font-weight: 500;">Estudio</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="horarios" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>📅</span>
                            <span style="font-size: 10px; font-weight: 500;">Horarios</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="alertas" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>🔔</span>
                            <span style="font-size: 10px; font-weight: 500;">Alertas</span>
                        </div>
                    </div>
                    <div class="mock-main" style="padding: 16px; gap: 12px; overflow-y: auto;">
                        <!-- Mock App Topbar -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
                            <span style="font-size: 13px; font-weight: 800; color: var(--text-heading);" id="mock-user-welcome">Hola, Estudiante! 👋</span>
                            <span style="font-size: 10px; background: rgba(99, 102, 241, 0.1); color: var(--brand); padding: 3px 8px; border-radius: 10px; font-weight: 700;">TUP 2024</span>
                        </div>

                        <!-- VISTA: INICIO -->
                        <div class="mock-tab-content active" id="mock-tab-inicio" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Mock Widgets Layout -->
                            <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 10px;">
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <!-- Widget Progreso -->
                                    <div class="mock-widget" style="padding: 10px;">
                                        <div class="widget-title" style="font-size: 10px; margin-bottom: 6px;">📈 Progreso Académico</div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="font-size: 15px; font-weight: 800; color: var(--brand);" id="mock-dash-avg">8.45 <span style="font-size: 10px; color: #64748b; font-weight: 500;">Promed.</span></div>
                                            <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px;">
                                                <div style="width: 35%; height: 100%; background: var(--brand); border-radius: 3px;" id="mock-dash-progress-bar"></div>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);" id="mock-dash-progress-text">35%</div>
                                        </div>
                                    </div>
                                    <!-- Widget Pomodoro -->
                                    <div class="mock-widget" style="padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <div>
                                            <div class="widget-title" style="font-size: 10px; margin-bottom: 4px;">⏱️ Enfoque Pomodoro</div>
                                            <div style="font-size: 16px; font-weight: 800; color: var(--text-heading);" id="mock-dash-pomodoro-timer">25:00</div>
                                        </div>
                                        <div style="font-size: 10px; background: #10b981; color: #fff; padding: 3px 8px; border-radius: 10px; font-weight: 700;" id="mock-dash-pomodoro-status">Estudiando</div>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <!-- Widget Kanban/Tareas -->
                                    <div class="mock-widget" style="padding: 10px; height: 100%;">
                                        <div class="widget-title" style="font-size: 10px; margin-bottom: 6px;">📋 Entregas</div>
                                        <div style="display: flex; flex-direction: column; gap: 6px;">
                                            <div style="border-left: 2px solid #ef4444; background: #fee2e2; padding: 4px 6px; border-radius: 0 4px 4px 0; font-size: 11px; font-weight: 600; color: #991b1b;">
                                                TP Álgebra
                                            </div>
                                            <div style="border-left: 2px solid #f59e0b; background: #fef3c7; padding: 4px 6px; border-radius: 0 4px 4px 0; font-size: 11px; font-weight: 600; color: #92400e;">
                                                Proyecto BD
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Alerta Academica Widget -->
                            <div class="mock-widget" style="padding: 8px 10px; background: #eef2ff; border-color: rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 11px; font-weight: 600; color: var(--brand);">🔔 Vence cuota arancelaria: N° 4 Junio</span>
                                <span style="font-size: 11px; font-weight: 700; color: #ef4444;">$80.000</span>
                            </div>
                        </div>

                        <!-- VISTA: MATERIAS -->
                        <div class="mock-tab-content" id="mock-tab-materias" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 12px; font-weight: 700; color: var(--text-heading);">Plan de Estudios (TUP)</span>
                                <span style="font-size: 10px; color: var(--brand); font-weight: 600;">Haz clic para aprobar:</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <div class="mock-subject-card approved" data-subject="prog1" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Prog. I</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (9)</div>
                                </div>
                                <div class="mock-subject-card approved" data-subject="lab1" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Laboratorio I</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (10)</div>
                                </div>
                                <div class="mock-subject-card approved" data-subject="spd" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Sist. Proc. Datos</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (8)</div>
                                </div>
                                <div class="mock-subject-card" data-subject="prog2" style="border: 1px solid var(--mock-border); background: var(--mock-widget-bg); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Prog. II</div>
                                    <div style="font-size: 10px; color: #ef4444; font-weight: 600;" class="status">Cursando</div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11px; padding: 6px; background: rgba(99, 102, 241, 0.05); border-radius: 4px;">
                                <span style="font-weight: 600;">Promedio: <strong id="mock-subject-avg">9.00</strong></span>
                                <span style="font-weight: 600;">Progreso: <strong id="mock-subject-percent">75%</strong></span>
                            </div>
                        </div>

                        <!-- VISTA: ESTUDIO -->
                        <div class="mock-tab-content" id="mock-tab-estudio" style="display: none; flex-direction: column; gap: 10px; text-align: center; padding: 12px 0;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-heading);">Sesión de Enfoque Pomodoro</div>
                            <div style="font-size: 36px; font-weight: 800; color: var(--brand); font-family: monospace; letter-spacing: 1px; margin: 6px 0;" id="mock-pomo-timer">25:00</div>
                            <div style="display: flex; justify-content: center; gap: 12px;">
                                <button id="mock-pomo-play-btn" style="background: var(--brand); color: #fff; border: none; font-size: 11px; padding: 6px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Iniciar</button>
                                <button id="mock-pomo-reset-btn" style="background: rgba(99,102,241,0.1); color: var(--brand); border: 1px solid rgba(99,102,241,0.2); font-size: 11px; padding: 6px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Reiniciar</button>
                            </div>
                            <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;" id="mock-pomo-desc">Haz clic en Iniciar para simular el temporizador Pomodoro.</div>
                        </div>

                        <!-- VISTA: HORARIOS -->
                        <div class="mock-tab-content" id="mock-tab-horarios" style="display: none; flex-direction: column; gap: 8px;">
                            <!-- Header de Simulación -->
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--mock-border); padding-bottom: 6px; margin-bottom: 4px;">
                                <div style="display: flex; gap: 6px; font-size: 10px;">
                                    <span style="background: var(--brand); color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: 700; cursor: pointer;" id="mock-ver-a">Versión A</span>
                                    <span style="background: rgba(0,0,0,0.05); color: var(--text-muted); padding: 2px 6px; border-radius: 3px; font-weight: 700; cursor: pointer;" id="mock-ver-b">Versión B</span>
                                </div>
                                <span style="font-size: 10px; font-weight: 700; color: var(--text-heading); background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 3px;">Curso N1_1 📅</span>
                            </div>
                            
                            <!-- Chips de Compañeros -->
                            <div style="display: flex; gap: 8px; font-size: 10px; margin-bottom: 4px;">
                                <span style="display: inline-flex; align-items: center; gap: 3px; color: #4f46e5; font-weight: 700;">
                                    <span style="width: 5px; height: 5px; border-radius: 50%; background: #4f46e5;"></span>Vos
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 3px; color: #10b981; font-weight: 700;" id="mock-compare-chip">
                                    <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981;"></span>Leandro (Comparando)
                                </span>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 6px;" id="mock-schedule-list">
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px; position: relative; overflow: hidden;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Lunes</span>
                                    <div style="display: flex; flex-direction: column; gap: 3px;">
                                        <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Programación II <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 22:30)</small></span>
                                        <!-- Solapamiento dashed overlay de Leandro -->
                                        <span id="mock-overlap-block" style="font-size: 10px; color: #047857; background: rgba(16, 185, 129, 0.1); border-left: 2px dashed #10b981; padding: 2px 6px; border-radius: 3px; font-weight: 700;">⚡ Solapamiento: Inglés I (Leandro)</span>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Martes</span>
                                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Base de Datos I <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 21:30)</small></span>
                                </div>
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Jueves</span>
                                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Prob. y Estadística <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 21:30)</small></span>
                                </div>
                            </div>

                            <!-- Clash Resolver Sugerencia -->
                            <div id="mock-clash-resolver-bar" style="display: flex; justify-content: space-between; align-items: center; background: #fffbeb; border: 1px solid #fef3c7; padding: 6px 8px; border-radius: 4px; margin-top: 4px;">
                                <span style="font-size: 10px; font-weight: 700; color: #b45309;">💡 Resolutor: Usar Com. N1-2 para Inglés I</span>
                                <button id="mock-resolve-btn" style="background: #f59e0b; color: #fff; border: none; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Resolver</button>
                            </div>
                        </div>

                        <!-- VISTA: ALERTAS -->
                        <div class="mock-tab-content" id="mock-tab-alertas" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px;">Notificaciones y Alertas</div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #fee2e2; border: 1px solid rgba(239,68,68,0.2); padding: 6px 10px; border-radius: 4px;" id="mock-alert-payment-card">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-size: 11px; font-weight: 700; color: #ef4444;">Cuota Arancelaria N° 4</span>
                                        <span style="font-size: 10px; color: #7f1d1d; font-weight: 600;">Vence en 5 días • $80.000</span>
                                    </div>
                                    <button id="mock-pay-btn" style="background: #ef4444; color: #fff; border: none; font-size: 10px; padding: 3px 10px; border-radius: 8px; font-weight: 700; cursor: pointer;">Pagar</button>
                                </div>
                                <div style="display: flex; flex-direction: column; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 10px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: #ea580c;">Inscripción a Finales</span>
                                    <span style="font-size: 10px; color: var(--text-muted);">Inscripciones abiertas en Autogestión hasta el 30/06.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

    <!-- SECCIÓN PROPÓSITO (QUIÉNES SOMOS) -->
    <section class="section" id="que-es">
        <div class="purpose-section">
            <div class="purpose-visual" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; border: none; background: transparent; box-shadow: none;">
                <img src="{{ asset('assets/img/lnicio.webp') }}" alt="Cursus Inicio" style="width: 100%; height: auto; border-radius: var(--r); box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
            </div>
            <div class="purpose-text">
                <span class="section-lbl">Quiénes Somos</span>
                <h3>Creado por y para estudiantes</h3>
                <p>
                    Sabemos que planificar tu cursada en la UTN a veces se siente como una materia más. Entre correlativas cruzadas, fechas de finales y controlar las cuotas, es fácil perder el foco.
                </p>
                <p>
                    <span class="purpose-highlight">Cursus</span> nació en las aulas de la Regional Haedo con el propósito de simplificar tu vida académica. Queremos que te enfoques en lo que realmente importa: aprender y progresar en tu carrera, mientras nosotros nos encargamos de las alertas y la organización visual.
                </p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN ESTADÍSTICAS (Cursus en cifras) -->
    <section class="section" style="padding: 0 5% 60px 5%;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1100px; margin: 0 auto; text-align: center;" class="steps-grid">
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="font-size: 40px; font-weight: 800; color: var(--brand); margin-bottom: 8px;">98%</div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Correlativas Cargadas</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Base de datos del Plan TUP 2024 cargada al completo con su respectivo régimen.</p>
            </div>
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="font-size: 40px; font-weight: 800; color: #10b981; margin-bottom: 8px;">100%</div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Gratis e Institucional</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Hecho sin fines de lucro para ayudar a organizar el trayecto académico de la FRH.</p>
            </div>
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="height: 48px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; color: #f59e0b;">
                    <i data-lucide="timer" style="width: 42px; height: 42px; stroke-width: 1.75;"></i>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Productividad Dirigida</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Centralización de apuntes, cronómetro de concentración y seguimiento semanal.</p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN CÓMO FUNCIONA (PASO A PASO) -->
    <section class="section" id="como-funciona" style="padding-top: 60px;">
        <div class="section-header">
            <span class="section-lbl">Funcionamiento</span>
            <h2 class="section-title">¿Cómo funciona Cursus?</h2>
            <p class="section-desc">Poner en marcha tu semestre es cuestión de minutos. Seguí este camino simple:</p>
        </div>

        <div class="steps-grid">
            <div class="step-card">
                <div class="step-num">01</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="user-plus" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Registrate</h4>
                <p class="step-desc">Creá tu cuenta y accedé al plan de la Tecnicatura en Programación de la UTN Haedo.</p>
            </div>
            <div class="step-card">
                <div class="step-num">02</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="book-open" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Cargá tus materias</h4>
                <p class="step-desc">Indicá qué materias tenés aprobadas, cuáles estás cursando y cuáles tenés regularizadas.</p>
            </div>
            <div class="step-card">
                <div class="step-num">03</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="timer" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Estudiá enfocado</h4>
                <p class="step-desc">Usá el temporizador Pomodoro y el Kanban integrados para medir tus horas de estudio real.</p>
            </div>
            <div class="step-card">
                <div class="step-num">04</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="trending-up" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Medí tu progreso</h4>
                <p class="step-desc">Visualizá tus analíticas de promedio general, simulador de finales y tu fecha estimada de egreso.</p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN BENEFICIOS -->
    <section class="section" id="beneficios">
        <div class="section-header">
            <span class="section-lbl">Beneficios</span>
            <h2 class="section-title">Diseñado para tu éxito académico</h2>
            <p class="section-desc">Cursus centraliza las herramientas académicas necesarias para potenciar tu rendimiento diario.</p>
        </div>

        <div class="benefits-grid">
            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="network" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Correlativas Inteligentes</h4>
                    <p class="benefit-desc">Consultá tu plan de estudios en un árbol gráfico interactivo. Cursus te avisa al instante qué materias tenés bloqueadas y cuáles podés cursar.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="calculator" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Simulador de Promedio</h4>
                    <p class="benefit-desc">Calculá tu promedio real de forma automática. Simulá notas hipotéticas en tus próximos finales para ver cómo impactan en tu desempeño general.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="check-square" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Área de Productividad</h4>
                    <p class="benefit-desc">Temporizador Pomodoro integrado con Kanban dinámico. Registrá tus horas y organizá tus trabajos prácticos en un solo espacio.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="bell" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Alertas y Aranceles</h4>
                    <p class="benefit-desc">Controlá los vencimientos de finales y alertas académicas. Si cursás una tecnicatura, simulá tus pagos y recibí avisos de aumentos de cuota.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="calendar" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Simulador de Horarios</h4>
                    <p class="benefit-desc">Grilla semanal interactiva. Organizá tu cuatrimestre arrastrando bloques, asigná colores temáticos y gestioná dos versiones de horario (A/B) de forma paralela.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="users" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Plantillas y Comparación</h4>
                    <p class="benefit-desc">Cargá el horario oficial de tu curso UTN en 1 clic. Compará tu grilla con hasta 3 compañeros y resolvé solapamientos de comisión al instante con el asistente.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- SECCIÓN COMPARATIVA -->
    <section class="section" style="padding-top: 50px; padding-bottom: 60px;">
        <div class="section-header">
            <span class="section-lbl">Diferencias</span>
            <h2 class="section-title">¿Por qué usar Cursus si ya existe Autogestión y el Campus Virtual?</h2>
            <p class="section-desc">Autogestión y el Campus Virtual son los portales institucionales oficiales de la UTN Haedo para trámites y material académico. Cursus es tu organizador diario de cursada. Se complementan perfectamente:</p>
        </div>

        <div class="table-wrapper reveal" style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border-radius: var(--r); border: 1px solid var(--gray-card-border); box-shadow: 0 10px 30px var(--card-shadow); padding: 10px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; color: var(--text-main); min-width: 600px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--gray-card-border);">
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--text-heading); width: 34%;">Características</th>
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--text-desc); background: var(--table-th-bg);">Autogestión y Campus (UTN)</th>
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--brand); background: var(--table-td-bg-cursus);">Cursus (Tu Asistente)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Inscripción oficial a cursadas y exámenes
                                <span class="tooltip-trigger" data-tooltip="Autogestión registra legalmente tus actas de materias. Cursus no reemplaza este registro, sino que te ayuda a planificarlo de forma interactiva.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #10b981; background: var(--table-td-bg-siu);">Sí (Es obligatorio y legal)</td>
                        <td style="padding: 16px 20px; color: var(--text-desc); background: var(--table-td-bg-cursus);">No (Debes inscribirte en Autogestión)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Árbol visual de correlatividades
                                <span class="tooltip-trigger" data-tooltip="Visualiza de forma interactiva el mapa de materias aprobadas y disponibles según el plan oficial TUP 2024.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo listados de texto plano)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Interactivo y en cascada)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Simulador de promedio y egreso
                                <span class="tooltip-trigger" data-tooltip="Calcula cómo afectará tu próxima nota a tu promedio y proyecta la fecha estimada en la que te graduarás.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (No calcula proyecciones)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Simula finales y fecha de egreso)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Cronómetro Pomodoro y tareas Kanban
                                <span class="tooltip-trigger" data-tooltip="Un espacio de estudio enfocado con temporizador y un tablero para organizar tus entregas de trabajos prácticos.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Los profesores casi nunca suben los temas)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Temporizador integrado con logs)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Controlador de cuotas y alertas
                                <span class="tooltip-trigger" data-tooltip="Lleva el control de tus cuotas arancelarias de la TUP y recibe notificaciones de vencimiento al instante.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (No avisa aranceles ni vencimientos)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Simulador de cuotas TUP)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Planificación en múltiples versiones (A/B)
                                <span class="tooltip-trigger" data-tooltip="Crea dos versiones independientes de horarios de cursada para comparar alternativas antes de inscribirte.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo muestra tu horario definitivo)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Dos borradores A/B independientes)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Coordinación en grupo (Comparación multiusuario)
                                <span class="tooltip-trigger" data-tooltip="Superpone los horarios de hasta 3 compañeros a la vez en tu grilla para encontrar huecos libres en común.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Debes coordinar con capturas por chat)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Superposición de hasta 3 compañeros)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Resolutor de solapamientos (Clash Resolver)
                                <span class="tooltip-trigger" data-tooltip="Busca y sugiere comisiones sin conflicto de forma automática cuando se pisa una materia.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo da error al intentar inscribirte)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Sugiere y aplica comisiones viables)</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Diseño moderno e inmediato
                                <span class="tooltip-trigger" data-tooltip="Accede de forma instantánea a tu información académica con una interfaz moderna, rápida y responsiva.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #f59e0b; background: var(--table-td-bg-siu);">No (Requiere loguearse seguido, interfaz rígida)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Carga instantánea, responsivo)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- SECCIÓN TESTIMONIOS -->
    <section class="section" id="testimonios" style="padding-top: 40px; padding-bottom: 40px;">
        <div class="section-header">
            <span class="section-lbl">Comunidad</span>
            <h2 class="section-title">Lo que dicen otros alumnos</h2>
            <p class="section-desc">Cursus está ayudando a estudiantes de la UTN Haedo a simplificar su día a día. Esto es lo que nos comparten:</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto;" class="steps-grid">
            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"Organizar mi calendario de finales y el árbol de correlativas solía llevarme horas en Excel. Con Cursus es un clic y sé exactamente qué puedo cursar. Una salvación total."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">LM</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Leandro Martínez</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (2° Año)</p>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"El cronómetro Pomodoro integrado con el Kanban de entregas me ayudó a concentrarme de verdad para los parciales de Sintaxis y Análisis II. 100% recomendado."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">SF</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Sofía Fernández</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (3° Año)</p>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"Las alertas de vencimientos de cuotas y finales son geniales. Si cursás la tecnicatura con cuota como la TUP, te avisa los aumentos del arancel al instante. Muy práctico."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #ea580c, #d97706); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">TG</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Tomás Gómez</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (1° Año)</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SECCIÓN PREGUNTAS FRECUENTES -->
    <section class="section" id="faq" style="padding-top: 60px;">
        <div class="section-header">
            <span class="section-lbl">FAQs</span>
            <h2 class="section-title">Preguntas Frecuentes</h2>
            <p class="section-desc">Resolvemos tus dudas principales sobre la plataforma Cursus.</p>
        </div>

        <div class="faq-container">
            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Cursus es gratuita para todos los estudiantes de la UTN?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Sí, la plataforma es 100% gratuita para toda la comunidad académica. El desarrollo fue realizado por alumnos de la carrera con el único propósito de ayudar a los estudiantes a organizarse.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Cómo se calculan mis correlatividades y materias disponibles?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Cursus tiene precargada la base de datos oficial de planes de estudio (por ejemplo, la Tecnicatura en Programación Plan 2024). Al indicar el estado de tus materias en la sección "Mis Materias", el sistema calcula automáticamente qué materias correlativas se habilitan o bloquean de forma recursiva.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Necesito un correo institucional para registrarme?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Preferentemente sí, ya que está diseñado para centralizar la información institucional de la UTN FRH. Sin embargo, en el modo desarrollo se permite ingresar a explorar el dashboard para pruebas.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Mis datos están seguros y guardados en la nube?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>En el prototipo estático, tus datos se guardan en la memoria local de tu navegador (LocalStorage), por lo que no se pierden al recargar la página. En la versión integrada con Laravel, tu progreso se sincroniza con tu cuenta de usuario de forma segura.</p>
                </div>
            </div>
        </div>
    </section>



    <!-- FOOTER -->
    <footer class="landing-footer">
        <div class="footer-layout">
            <a href="#" class="footer-logo">
                <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" style="height: 30px; width: auto; border-radius: 6px;">
                <div class="footer-logo-tx">
                    Cursus
                    <small>UTN Haedo</small>
                </div>
            </a>
            <nav class="footer-nav">
                <a href="#que-es">Qué es</a>
                <a href="#como-funciona">Cómo funciona</a>
                <a href="#beneficios">Beneficios</a>
                <a href="{{ route('contacto') }}">Contacto</a>
            </nav>
        </div>
        <div class="footer-bottom">
            <span>&copy; 2026 Cursus. Creado por alumnos para la comunidad de la UTN FRH.</span>
            <span>Tecnicatura Universitaria en Programación</span>
        </div>
    </footer>



    <!-- BOTÓN VOLVER ARRIBA -->
    <button id="scroll-top-btn" class="scroll-top-btn" aria-label="Volver arriba">
        <i data-lucide="arrow-up"></i>
    </button>

    <!-- SCRIPT DE LOGICA INTERACTIVA -->
    <script src="{{ asset('js/welcome.js') }}"></script>
</body>
</html>
