// Cursus - Lógica interactiva de la Landing Page pública

document.addEventListener('DOMContentLoaded', () => {
    // 1. Efecto sticky/scrolled en el Header
    const header = document.getElementById('js-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Scroll suave para los enlaces de navegación internos
    const navLinks = document.querySelectorAll('.landing-nav a, .footer-nav a, .btn-hero-secondary');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            // Verificar que sea un enlace interno
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = 75; // Altura aproximada del header
                    const targetPosition = targetSection.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 3. ScrollSpy para actualizar enlace activo en el menú lateral
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.landing-nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollY = window.pageYOffset;
        const headerHeight = 85;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active-link');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active-link');
            }
        });
    });

    // 4. Animación de revelado al scroll (Intersection Observer)
    const revealElements = document.querySelectorAll('.step-card, .benefit-card, .purpose-section, .contact-layout, .faq-item, .section-header, table, .reveal');
    
    revealElements.forEach(el => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal');
        }
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // detener observación tras animar
            }
        });
    }, {
        threshold: 0.08
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
});

// ================= PREGUNTAS FRECUENTES (ACCORDION) =================
window.toggleFaq = function(questionElement) {
    const item = questionElement.parentElement;
    const answer = item.querySelector('.faq-answer');
    const isOpen = item.classList.contains('open');
    
    // Cerrar todas las demás preguntas abiertas para comportamiento de acordeón limpio
    const allItems = document.querySelectorAll('.faq-item');
    allItems.forEach(i => {
        if (i !== item) {
            i.classList.remove('open');
            i.querySelector('.faq-answer').style.maxHeight = null;
        }
    });

    // Abrir/Cerrar la actual
    if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = null;
    } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }
};

// ================= FORMULARIO DE CONTACTO =================
window.handleContactSubmit = async function() {
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const subjectSelect = document.getElementById('contact-subject');
    const msgInput = document.getElementById('contact-msg');

    const errName = document.getElementById('err-name');
    const errEmail = document.getElementById('err-email');
    const errMsg = document.getElementById('err-msg');

    errName.style.display = 'none';
    errEmail.style.display = 'none';
    errMsg.style.display = 'none';

    let isValid = true;

    if (nameInput.value.trim() === '') {
        errName.style.display = 'block';
        isValid = false;
    }

    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue === '' || !emailRegex.test(emailValue)) {
        errEmail.textContent = 'Ingresá un correo electrónico válido';
        errEmail.style.display = 'block';
        isValid = false;
    }

    if (msgInput.value.trim().length < 10) {
        errMsg.style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        const subjectVal = subjectSelect.value;
        const asunto = subjectSelect.options[subjectSelect.selectedIndex].text;

        try {
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    tipo: subjectVal,
                    asunto: asunto,
                    descripcion: msgInput.value.trim(),
                    remitente_nombre: nameInput.value.trim(),
                    remitente_email: emailValue,
                })
            });
        } catch (_) { /* no bloqueamos el modal si falla */ }

        const modalDesc = document.getElementById('js-modal-feedback-desc');

        if (subjectVal === 'academica') {
            modalDesc.textContent = `Hemos recibido tu Consulta Académica. Estudiantes avanzados y coordinadores del plan TUP 2024 responderán a la brevedad en tu correo ${emailValue}.`;
        } else if (subjectVal === 'soporte') {
            modalDesc.textContent = `Tu reporte de Soporte Técnico fue registrado. Nos pondremos en contacto contigo a ${emailValue} si necesitamos más detalles.`;
        } else if (subjectVal === 'arancel') {
            modalDesc.textContent = `Tu consulta sobre aranceles de cuotas fue derivada a administración de la Regional Haedo. Recibirás una respuesta en ${emailValue}.`;
        } else {
            modalDesc.textContent = `¡Gracias por tu sugerencia! Cursus crece gracias al feedback de los alumnos. Tomamos nota de tus comentarios para seguir mejorando.`;
        }

        const modal = document.getElementById('js-success-modal');
        modal.classList.add('open');

        nameInput.value = '';
        emailInput.value = '';
        msgInput.value = '';
        subjectSelect.selectedIndex = 3;
    }
};

window.closeSuccessModal = function() {
    const modal = document.getElementById('js-success-modal');
    modal.classList.remove('open');
};

// ================= MODO OSCURO / CLARO =================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Cargar tema guardado o preferencia del sistema
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Alternar tema al hacer clic
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // ================= CURSOR GLOW EFFECT =================
    const glowCards = document.querySelectorAll('.benefit-card, .step-card, .testimonial-card');
    glowCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // ================= INTERACTIVIDAD MOCK DASHBOARD (HERO) =================
    const mockTabs = document.querySelectorAll('.mock-sb-item');
    const mockContents = document.querySelectorAll('.mock-tab-content');
    
    mockTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Activar tab en el sidebar
            mockTabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = '#475569';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--brand)';
            
            // Mostrar contenido correspondiente
            const targetTab = tab.getAttribute('data-mock-tab');
            mockContents.forEach(content => {
                if (content.id === `mock-tab-${targetTab}`) {
                    content.style.display = 'flex';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });

    // Subpestaña Materias: Clic para aprobar / desaprobar
    const mockSubjectCards = document.querySelectorAll('.mock-subject-card');
    const mockSubjectAvg = document.getElementById('mock-subject-avg');
    const mockSubjectPercent = document.getElementById('mock-subject-percent');
    
    const mockDashAvg = document.getElementById('mock-dash-avg');
    const mockDashProgressBar = document.getElementById('mock-dash-progress-bar');
    const mockDashProgressText = document.getElementById('mock-dash-progress-text');

    const subjectsData = {
        prog1: { approved: true, grade: 9 },
        lab1: { approved: true, grade: 10 },
        spd: { approved: true, grade: 8 },
        prog2: { approved: false, grade: 0 }
    };

    function recalculateMockAcademicState() {
        let totalGrades = 0;
        let approvedCount = 0;
        const totalSubjects = Object.keys(subjectsData).length;

        for (const key in subjectsData) {
            if (subjectsData[key].approved) {
                totalGrades += subjectsData[key].grade;
                approvedCount++;
            }
        }

        const avg = approvedCount > 0 ? (totalGrades / approvedCount).toFixed(2) : "0.00";
        const progress = Math.round((approvedCount / totalSubjects) * 100);

        // Actualizar vista de materias
        if (mockSubjectAvg) mockSubjectAvg.textContent = avg;
        if (mockSubjectPercent) mockSubjectPercent.textContent = `${progress}%`;

        // Sincronizar con widgets en Dashboard General (Inicio)
        if (mockDashAvg) {
            mockDashAvg.innerHTML = `${avg} <span style="font-size: 7px; color: #64748b; font-weight: 500;">Promedio</span>`;
        }
        if (mockDashProgressBar) {
            mockDashProgressBar.style.width = `${progress}%`;
        }
        if (mockDashProgressText) {
            mockDashProgressText.textContent = `${progress}%`;
        }
    }

    mockSubjectCards.forEach(card => {
        card.addEventListener('click', () => {
            const code = card.getAttribute('data-subject');
            const data = subjectsData[code];
            
            if (data.approved) {
                // Desaprobar (pasa a Cursando)
                data.approved = false;
                card.classList.remove('approved');
                card.style.border = '1px solid var(--mock-border)';
                card.style.background = 'var(--mock-widget-bg)';
                const statusDiv = card.querySelector('.status');
                statusDiv.textContent = 'Cursando';
                statusDiv.style.color = '#ef4444';
            } else {
                // Aprobar
                data.approved = true;
                data.grade = code === 'prog2' ? 10 : data.grade; // Nota 10 para Prog II
                card.classList.add('approved');
                card.style.border = '1px solid #10b981';
                card.style.background = 'rgba(16, 185, 129, 0.05)';
                const statusDiv = card.querySelector('.status');
                statusDiv.textContent = `Aprobada (${data.grade})`;
                statusDiv.style.color = '#10b981';
            }
            recalculateMockAcademicState();
        });
    });

    // Subpestaña Pomodoro: Temporizador Interactiva
    let pomoInterval = null;
    let pomoSecondsRemaining = 25 * 60;
    let pomoIsRunning = false;
    
    const pomoTimerDisplay = document.getElementById('mock-pomo-timer');
    const pomoPlayBtn = document.getElementById('mock-pomo-play-btn');
    const pomoResetBtn = document.getElementById('mock-pomo-reset-btn');
    const pomoDesc = document.getElementById('mock-pomo-desc');

    const dashPomoTimer = document.getElementById('mock-dash-pomodoro-timer');
    const dashPomoStatus = document.getElementById('mock-dash-pomodoro-status');

    function updatePomoDisplay() {
        const mins = Math.floor(pomoSecondsRemaining / 60);
        const secs = pomoSecondsRemaining % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (pomoTimerDisplay) pomoTimerDisplay.textContent = timeStr;
        if (dashPomoTimer) dashPomoTimer.textContent = timeStr;
    }

    if (pomoPlayBtn) {
        pomoPlayBtn.addEventListener('click', () => {
            if (pomoIsRunning) {
                // Pausar
                pomoIsRunning = false;
                clearInterval(pomoInterval);
                pomoPlayBtn.textContent = 'Iniciar';
                pomoPlayBtn.style.background = 'var(--brand)';
                if (pomoDesc) pomoDesc.textContent = 'Temporizador pausado.';
                if (dashPomoStatus) {
                    dashPomoStatus.textContent = 'Pausado';
                    dashPomoStatus.style.background = '#ea580c';
                }
            } else {
                // Iniciar
                pomoIsRunning = true;
                pomoPlayBtn.textContent = 'Pausar';
                pomoPlayBtn.style.background = '#ef4444';
                if (pomoDesc) pomoDesc.textContent = '¡Enfoque activo! Estudiando...';
                if (dashPomoStatus) {
                    dashPomoStatus.textContent = 'Estudiando';
                    dashPomoStatus.style.background = '#10b981';
                }
                
                pomoInterval = setInterval(() => {
                    if (pomoSecondsRemaining > 0) {
                        pomoSecondsRemaining--;
                        updatePomoDisplay();
                    } else {
                        // Terminado
                        clearInterval(pomoInterval);
                        pomoIsRunning = false;
                        pomoSecondsRemaining = 25 * 60;
                        updatePomoDisplay();
                        pomoPlayBtn.textContent = 'Iniciar';
                        pomoPlayBtn.style.background = 'var(--brand)';
                        if (pomoDesc) pomoDesc.textContent = '¡Sesión de Pomodoro completada! Descansa 5 min.';
                        if (dashPomoStatus) {
                            dashPomoStatus.textContent = 'Terminado';
                            dashPomoStatus.style.background = 'var(--brand)';
                        }
                    }
                }, 1000);
            }
        });
    }

    if (pomoResetBtn) {
        pomoResetBtn.addEventListener('click', () => {
            pomoIsRunning = false;
            clearInterval(pomoInterval);
            pomoSecondsRemaining = 25 * 60;
            updatePomoDisplay();
            if (pomoPlayBtn) {
                pomoPlayBtn.textContent = 'Iniciar';
                pomoPlayBtn.style.background = 'var(--brand)';
            }
            if (pomoDesc) pomoDesc.textContent = 'Temporizador reiniciado.';
            if (dashPomoStatus) {
                dashPomoStatus.textContent = 'Estudiando';
                dashPomoStatus.style.background = '#10b981';
            }
        });
    }

    // Subpestaña Alertas: Pagar Cuota
    const mockPayBtn = document.getElementById('mock-pay-btn');
    const mockAlertPaymentCard = document.getElementById('mock-alert-payment-card');
    
    if (mockPayBtn) {
        mockPayBtn.addEventListener('click', () => {
            if (mockPayBtn.textContent === 'Pagar') {
                mockPayBtn.textContent = 'Pagada ✓';
                mockPayBtn.style.background = '#10b981';
                if (mockAlertPaymentCard) {
                    mockAlertPaymentCard.style.background = '#d1fae5';
                    mockAlertPaymentCard.style.borderColor = 'rgba(16,185,129,0.2)';
                    const descSpan = mockAlertPaymentCard.querySelector('span:nth-child(2)') || mockAlertPaymentCard.querySelector('.status');
                    if (descSpan) {
                        descSpan.textContent = 'Pagada exitosamente • $80.000';
                        descSpan.style.color = '#065f46';
                    }
                }
            } else {
                mockPayBtn.textContent = 'Pagar';
                mockPayBtn.style.background = '#ef4444';
                if (mockAlertPaymentCard) {
                    mockAlertPaymentCard.style.background = '#fee2e2';
                    mockAlertPaymentCard.style.borderColor = 'rgba(239,68,68,0.2)';
                    const descSpan = mockAlertPaymentCard.querySelector('span:nth-child(2)') || mockAlertPaymentCard.querySelector('.status');
                    if (descSpan) {
                        descSpan.textContent = 'Vence en 5 días • $80.000';
                        descSpan.style.color = '#7f1d1d';
                    }
                }
            }
        });
    }

    // 7.5. Subpestaña Horarios: Simular Versiones A/B y Resolutor
    const mockResolveBtn = document.getElementById('mock-resolve-btn');
    const mockOverlapBlock = document.getElementById('mock-overlap-block');
    const mockClashResolverBar = document.getElementById('mock-clash-resolver-bar');
    const mockVerA = document.getElementById('mock-ver-a');
    const mockVerB = document.getElementById('mock-ver-b');
    const mockScheduleList = document.getElementById('mock-schedule-list');

    function attachResolveEvent(btn) {
        if (!btn) return;
        btn.addEventListener('click', () => {
            const overlap = document.getElementById('mock-overlap-block');
            if (overlap) {
                overlap.style.transition = 'all 0.3s ease';
                overlap.style.opacity = '0';
                setTimeout(() => {
                    overlap.style.display = 'none';
                }, 300);
            }
            if (mockClashResolverBar) {
                mockClashResolverBar.innerHTML = `
                    <span style="font-size: 10px; font-weight: 700; color: #047857; display: flex; align-items: center; gap: 4px;">
                        ✓ Solapamiento resuelto: Inglés I movida a Miércoles.
                    </span>
                    <span style="font-size: 9px; color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 2px; font-weight: 700;">Seguro</span>
                `;
                mockClashResolverBar.style.background = '#d1fae5';
                mockClashResolverBar.style.borderColor = '#a7f3d0';
            }
        });
    }

    if (mockResolveBtn) {
        attachResolveEvent(mockResolveBtn);
    }

    if (mockVerA && mockVerB && mockScheduleList) {
        mockVerA.addEventListener('click', () => {
            mockVerA.style.background = 'var(--brand)';
            mockVerA.style.color = '#fff';
            mockVerB.style.background = 'rgba(0,0,0,0.05)';
            mockVerB.style.color = 'var(--text-muted)';
            
            mockScheduleList.innerHTML = `
                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px; position: relative; overflow: hidden;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Lunes</span>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Programación II <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 22:30)</small></span>
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
            `;
            if (mockClashResolverBar) {
                mockClashResolverBar.style.display = 'flex';
                mockClashResolverBar.style.background = '#fffbeb';
                mockClashResolverBar.style.borderColor = '#fef3c7';
                mockClashResolverBar.innerHTML = `
                    <span style="font-size: 10px; font-weight: 700; color: #b45309;">💡 Resolutor: Usar Com. N1-2 para Inglés I</span>
                    <button id="mock-resolve-btn-new" style="background: #f59e0b; color: #fff; border: none; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Resolver</button>
                `;
                attachResolveEvent(document.getElementById('mock-resolve-btn-new'));
            }
        });

        mockVerB.addEventListener('click', () => {
            mockVerB.style.background = 'var(--brand)';
            mockVerB.style.color = '#fff';
            mockVerA.style.background = 'rgba(0,0,0,0.05)';
            mockVerA.style.color = 'var(--text-muted)';
            
            mockScheduleList.innerHTML = `
                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Lunes</span>
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Programación II <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 22:30)</small></span>
                </div>
                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Miércoles</span>
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Inglés I <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 20:30)</small></span>
                </div>
                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Viernes</span>
                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Metodología I <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 21:30)</small></span>
                </div>
            `;
            if (mockClashResolverBar) {
                mockClashResolverBar.style.display = 'none';
            }
        });
    }

    // 8. Botón Volver Arriba (Floating Scroll-To-Top Button)
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});


