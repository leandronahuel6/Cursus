// UX: Función para mostrar/ocultar el tooltip de ayuda de IA
function toggleAIHelpTooltip(event) {
    event.stopPropagation();
    const tooltip = document.getElementById("ai-help-tooltip-content");
    if (!tooltip) return;
    const isVisible = tooltip.style.visibility === "visible";
    tooltip.style.opacity = isVisible ? "0" : "1";
    tooltip.style.visibility = isVisible ? "hidden" : "visible";
    tooltip.style.transform = isVisible
        ? "translateX(-50%) translateY(5px)"
        : "translateX(-50%) translateY(0)";
}

// UX: Cerrar tooltip al hacer clic fuera
document.addEventListener("click", function (event) {
    const tooltip = document.getElementById("ai-help-tooltip-content");
    const btn = document.getElementById("btn-ai-help");
    if (
        tooltip &&
        tooltip.style.visibility === "visible" &&
        btn &&
        !btn.contains(event.target) &&
        !tooltip.contains(event.target)
    ) {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
        tooltip.style.transform = "translateX(-50%) translateY(5px)";
    }
});
// Variables de estado
let activeToken =
    localStorage.getItem("token") || sessionStorage.getItem("token");
let currentDecks = [];
let currentStudyDeck = null;
let currentStudyCards = [];
let masterSessionCards = []; // Todos los del mazo para distractores
let currentStudyIndex = 0;
let currentSessionCorrect = 0;
let currentSessionIncorrect = 0;
let keyboardListener = null;
let editingCardId = null;
let selectedDeckIdForStudy = null;
let currentStudyMode = "all";
let confirmPromiseResolve = null;

function showCustomConfirm({
    title,
    message,
    acceptText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false,
}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("custom-confirm-modal");
        const modalBox = modal.querySelector(".fc-modal-box");
        const titleEl = document.getElementById("confirm-modal-title-text");
        const bodyEl = document.getElementById("confirm-modal-body-text");
        const btnCancel = document.getElementById("btn-confirm-cancel");
        const btnAccept = document.getElementById("btn-confirm-accept");
        const iconContainer = document.getElementById(
            "confirm-modal-icon-container",
        );

        titleEl.textContent = title;
        bodyEl.textContent = message;
        btnCancel.textContent = cancelText;
        btnAccept.textContent = acceptText;

        if (isDestructive) {
            btnAccept.style.background = "#dc2626";
            btnAccept.style.color = "#ffffff";
            btnAccept.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.2)";
            iconContainer.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
        } else {
            btnAccept.style.background =
                "linear-gradient(135deg, #4f46e5, #06b6d4)";
            btnAccept.style.color = "#ffffff";
            btnAccept.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
            iconContainer.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`;
        }

        modal.style.display = "flex";
        setTimeout(() => {
            modal.classList.add("open");
            modalBox.style.transform = "scale(1)";
            modalBox.style.opacity = "1";
        }, 10);

        confirmPromiseResolve = resolve;
    });
}

function closeCustomConfirm(result) {
    const modal = document.getElementById("custom-confirm-modal");
    const modalBox = modal.querySelector(".fc-modal-box");
    modal.classList.remove("open");
    modalBox.style.transform = "scale(0.9)";
    modalBox.style.opacity = "0";
    setTimeout(() => {
        modal.style.display = "none";
        if (confirmPromiseResolve) {
            confirmPromiseResolve(result);
            confirmPromiseResolve = null;
        }
    }, 250);
}

// Elementos DOM de secciones
const sectionDecks = document.getElementById("section-decks");
const sectionStudy = document.getElementById("section-study");
const sectionSummary = document.getElementById("section-summary");
const sectionManage = document.getElementById("section-manage");

// Carga inicial
document.addEventListener("DOMContentLoaded", async () => {
    if (!activeToken) {
        window.location.replace("/login");
        return;
    }

    await loadMateriasCursandoFlashcards();
    loadDecks();
    initColorPicker();
    initStudyModeSelector();

    // Listeners confirm modal
    document
        .getElementById("btn-confirm-cancel")
        .addEventListener("click", () => closeCustomConfirm(false));
    document
        .getElementById("btn-confirm-accept")
        .addEventListener("click", () => closeCustomConfirm(true));
    document
        .getElementById("custom-confirm-modal")
        .addEventListener("click", (e) => {
            if (e.target === document.getElementById("custom-confirm-modal")) {
                closeCustomConfirm(false);
            }
        });
});

// Configuración headers de la API
function getApiHeaders() {
    return {
        Authorization: "Bearer " + activeToken,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": "{{ csrf_token() }}",
    };
}

// Atajos de teclado para la sesión de estudio
function enableKeyboardShortcuts() {
    if (keyboardListener) return;
    keyboardListener = function (e) {
        if (
            e.target.tagName === "INPUT" ||
            e.target.tagName === "TEXTAREA" ||
            e.target.isContentEditable
        ) {
            return;
        }

        if (sectionStudy.style.display === "none") return;
        if (currentStudyMode === "exam") return; // En modo examen desactivamos atajos para no colisionar

        if (e.code === "Space") {
            e.preventDefault();
            flipStudyCard();
        } else if (e.code === "Digit1" || e.code === "ArrowLeft") {
            const flipCard = document.getElementById("flip-card");
            if (flipCard.classList.contains("flipped")) {
                submitCardResult("incorrecto");
            }
        } else if (e.code === "Digit2" || e.code === "ArrowRight") {
            const flipCard = document.getElementById("flip-card");
            if (flipCard.classList.contains("flipped")) {
                submitCardResult("correcto");
            }
        }
    };
    document.addEventListener("keydown", keyboardListener);
}

function disableKeyboardShortcuts() {
    if (keyboardListener) {
        document.removeEventListener("keydown", keyboardListener);
        keyboardListener = null;
    }
}

// ==========================================================================
// LÓGICA DE MAZOS (DECKS)
// ==========================================================================
let materiasCursandoFlashcards = [];

async function loadMateriasCursandoFlashcards() {
    try {
        const response = await fetch("/api/mis-materias", {
            headers: getApiHeaders(),
        });
        if (!response.ok) throw new Error("No se pudieron cargar las materias");
        const data = await response.json();
        materiasCursandoFlashcards = data.filter(
            (m) => m.estado === "cursando",
        );
    } catch (err) {
        materiasCursandoFlashcards = [];
    }
}

async function loadDecks() {
    const container = document.getElementById("decks-container");
    try {
        const response = await fetch("/api/flashcards/decks", {
            method: "GET",
            headers: getApiHeaders(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.replace("/login");
                return;
            }
            throw new Error("Error al cargar mazos");
        }

        currentDecks = await response.json();
        renderDecks(currentDecks);
    } catch (error) {
        console.error(error);
        container.innerHTML = `
                <div style="text-align:center; padding:3rem; color:var(--red);">
                    ⚠️ Ocurrió un error al cargar tus mazos de estudio. Intenta recargar la página.
                </div>
            `;
    }
}

function toggleCategoryGroup(catId) {
    const grid = document.getElementById("grid-" + catId);
    const group = document.getElementById("group-" + catId);
    const header = document.querySelector(`#group-${catId} .category-header`);
    const chevron = header.querySelector(".category-chevron");

    if (grid._anim) {
        grid._anim.cancel();
        grid._anim = null;
    }
    grid.style.maxHeight = "";
    grid.style.opacity = "";

    if (group.classList.contains("collapsed")) {
        const startExpand = async () => {
            chevron.style.transform = "rotate(0deg)";
            localStorage.setItem("collapsed_cat_" + catId, "false");

            if (document.fonts?.ready) await document.fonts.ready;

            group.classList.remove("collapsed");
            const targetHeight = grid.scrollHeight;

            grid.style.maxHeight = "0px";
            grid.style.opacity = "0";
            void grid.offsetHeight;

            const anim = grid.animate(
                [
                    { maxHeight: "0px", opacity: "0" },
                    { maxHeight: targetHeight + "px", opacity: "1" },
                ],
                { duration: 300, easing: "ease-out", fill: "forwards" },
            );
            grid._anim = anim;

            anim.onfinish = () => {
                grid._anim = null;
                anim.cancel();
                grid.style.maxHeight = "";
                grid.style.opacity = "";
            };
        };
        startExpand();
    } else {
        const startHeight = grid.scrollHeight;

        grid.style.maxHeight = startHeight + "px";
        grid.style.opacity = "1";
        void grid.offsetHeight;

        const anim = grid.animate(
            [
                { maxHeight: startHeight + "px", opacity: "1" },
                { maxHeight: "0px", opacity: "0" },
            ],
            { duration: 250, easing: "ease-in", fill: "forwards" },
        );
        grid._anim = anim;

        anim.onfinish = () => {
            grid._anim = null;
            anim.cancel();
            grid.style.maxHeight = "0px";
            grid.style.opacity = "0";
            group.classList.add("collapsed");
        };
        chevron.style.transform = "rotate(-180deg)";
        localStorage.setItem("collapsed_cat_" + catId, "true");
    }
}

function renderDecks(decks) {
    const container = document.getElementById("decks-container");
    if (decks.length === 0 && materiasCursandoFlashcards.length === 0) {
        container.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                    <h3 class="empty-state-title">No tienes mazos aún</h3>
                    <p class="empty-state-desc">Crea tu primer mazo para agregar tarjetas de estudio y comenzar a repasar.</p>
                    <button class="btn-create-deck" style="margin: 0 auto;" onclick="openCreateDeckModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                        Crear Primer Mazo
                    </button>
                </div>
            `;
        return;
    }

    // Agrupar mazos por categoría
    const groups = {};
    decks.forEach((deck) => {
        const cat = deck.categoria ? deck.categoria.trim() : "General";
        if (!groups[cat]) {
            groups[cat] = [];
        }
        groups[cat].push(deck);
    });

    // Materias que el alumno está cursando ahora mismo (vienen de la base de datos vía /api/mis-materias)
    const materiaNombres = materiasCursandoFlashcards.map((m) => m.nombre);
    let materiasOptionsHtml = "";
    if (materiaNombres.length > 0) {
        materiasOptionsHtml += `<optgroup label="Mis materias en curso">`;
        materiaNombres.forEach((nombre) => {
            materiasOptionsHtml += `<option value="${escapeHtml(nombre)}">${escapeHtml(nombre)}</option>`;
        });
        materiasOptionsHtml += `</optgroup>`;
    }

    // Poblar el selector de carpetas del modal de creación
    const selectCategory = document.getElementById("deck-select-category");
    if (selectCategory) {
        const distinctCategories = Object.keys(groups).filter(
            (cat) => cat !== "General" && !materiaNombres.includes(cat),
        );
        const currentValue = selectCategory.value;

        let selectHtml = `<option value="General">General (Sin contenedor)</option>`;
        selectHtml += materiasOptionsHtml;
        if (distinctCategories.length > 0) {
            selectHtml += `<optgroup label="Otros contenedores">`;
            distinctCategories.forEach((cat) => {
                selectHtml += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
            });
            selectHtml += `</optgroup>`;
        }
        selectHtml += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;

        selectCategory.innerHTML = selectHtml;

        if (
            currentValue &&
            selectCategory.querySelector(`option[value="${currentValue}"]`)
        ) {
            selectCategory.value = currentValue;
        }
    }

    // Poblar el selector de carpetas del modal de IA
    const aiSelectCategory = document.getElementById("ai-deck-select-category");
    if (aiSelectCategory) {
        const distinctCategories = Object.keys(groups).filter(
            (cat) => cat !== "General" && !materiaNombres.includes(cat),
        );
        const currentValue = aiSelectCategory.value;

        let selectHtml = `
                <option value="__AUTO__">Auto-detectar con IA ✨</option>
                <option value="General">General (Sin contenedor)</option>
            `;
        selectHtml += materiasOptionsHtml;
        if (distinctCategories.length > 0) {
            selectHtml += `<optgroup label="Otros contenedores">`;
            distinctCategories.forEach((cat) => {
                selectHtml += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
            });
            selectHtml += `</optgroup>`;
        }
        selectHtml += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;

        aiSelectCategory.innerHTML = selectHtml;

        if (
            currentValue &&
            aiSelectCategory.querySelector(`option[value="${currentValue}"]`)
        ) {
            aiSelectCategory.value = currentValue;
        }
    }

    // Renderizar cada grupo de categoría colapsable
    let html = "";
    Object.keys(groups)
        .sort((a, b) => {
            if (a === "General") return -1;
            if (b === "General") return 1;
            return a.localeCompare(b);
        })
        .forEach((cat) => {
            const catDecks = groups[cat];
            const catId = "cat-" + cat.toLowerCase().replace(/[^a-z0-9]/g, "-");
            const isCollapsed =
                localStorage.getItem("collapsed_cat_" + catId) === "true";

            html += `
                <div class="category-group ${isCollapsed ? "collapsed" : ""}" id="group-${catId}">
                    <div class="category-header" onclick="toggleCategoryGroup('${catId}')">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.85;">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span style="font-weight:700; font-size:1.02rem; color:var(--t1);">${escapeHtml(cat)}</span>
                            <span style="font-size:0.75rem; font-weight:600; padding:0.15rem 0.5rem; background:var(--border); border-radius:9999px; color:var(--t3);">${catDecks.length}</span>
                        </div>
                        <svg class="category-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${isCollapsed ? "transform:rotate(-180deg);" : ""}">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                    <div class="decks-grid" id="grid-${catId}">\n            `;

            if (catDecks.length === 0) {
                html += `
                    <div class="empty-state" style="grid-column: 1 / -1; padding: 1.5rem;">
                        <p class="empty-state-desc" style="margin: 0 0 0.8rem 0;">Todavía no tienes mazos para esta materia.</p>
                        <button class="btn-create-deck" style="margin: 0 auto;" onclick="openCreateDeckModalForMateria('${escapeJs(cat)}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                            Crear Mazo
                        </button>
                    </div>
                `;
            }

            catDecks.forEach((deck) => {
                const hasCards = deck.cards_count > 0;
                const accuracy = deck.porcentaje_acierto;

                let accuracyClass = "accuracy-none";
                let accuracyText = "Sin datos";
                if (accuracy !== null) {
                    accuracyText = `${accuracy}% aciertos`;
                    if (accuracy >= 80) accuracyClass = "accuracy-high";
                    else if (accuracy >= 50) accuracyClass = "accuracy-medium";
                    else accuracyClass = "accuracy-low";
                }

                html += `
                    <div class="deck-card" id="deck-card-${deck.id}" style="--mouse-x: 0px; --mouse-y: 0px;">
                        <div class="deck-card-glow deck-color-${deck.color || "indigo"}"></div>
                        <div class="deck-info">
                            <h3 class="deck-title">${escapeHtml(deck.nombre)}</h3>
                            <p class="deck-desc">${deck.descripcion ? escapeHtml(deck.descripcion) : "Sin descripción."}</p>
                            
                            <div class="deck-stats-row">
                                <div class="deck-stat-item" title="Cantidad de tarjetas">
                                    <svg class="deck-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                                    <span>${deck.cards_count} ${deck.cards_count === 1 ? "tarjeta" : "tarjetas"}</span>
                                </div>
                                <span class="accuracy-badge ${accuracyClass}">
                                    ${accuracyText}
                                </span>
                            </div>
                        </div>

                        <div class="deck-actions">
                            <button class="btn-study" onclick="startStudySession(${deck.id})" ${!hasCards ? "disabled" : ""} title="${hasCards ? "Comenzar a estudiar" : "Agrega tarjetas primero para estudiar"}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                                Estudiar
                            </button>
                            <button class="btn-deck-icon" onclick="openEditDeckModal(${deck.id}, event)" title="Editar mazo">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-deck-icon" onclick="handleExportDeck(${deck.id}, event)" title="Exportar mazo (JSON)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M10 16l4-4-4-4M14 16V4"/></svg>
                            </button>
                            <button class="btn-deck-icon" onclick="openManageSection(${deck.id}, '${escapeJs(deck.nombre)}')" title="Gestionar tarjetas">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                            </button>
                            <button class="btn-deck-icon delete-btn" onclick="handleDeleteDeck(${deck.id})" title="Eliminar mazo">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });
    container.innerHTML = html;

    // Añadir efecto de brillo en movimiento del ratón
    const cards = container.querySelectorAll(".deck-card");
    cards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });
}

function handleDeckSelectCategoryChange() {
    const select = document.getElementById("deck-select-category");
    const wrapper = document.getElementById("new-category-input-wrapper");
    const input = document.getElementById("deck-input-category");
    if (select && wrapper && input) {
        if (select.value === "__NEW__") {
            wrapper.style.display = "block";
            input.focus();
        } else {
            wrapper.style.display = "none";
            input.value = "";
        }
    }
}

// Modal de mazo
function openCreateDeckModal() {
    document.getElementById("deck-edit-id").value = "";
    document.getElementById("deck-input-name").value = "";
    document.getElementById("deck-input-desc").value = "";
    document.getElementById("deck-input-category").value = "";

    const select = document.getElementById("deck-select-category");
    if (select) select.value = "General";
    const wrapper = document.getElementById("new-category-input-wrapper");
    if (wrapper) wrapper.style.display = "none";

    document.getElementById("deck-modal-title-text").innerText =
        "Nuevo Mazo de Estudio";
    document.getElementById("btn-deck-submit").innerText = "Crear Mazo";
    document.getElementById("create-deck-modal").classList.add("open");
}

function openCreateDeckModalForMateria(materiaNombre) {
    openCreateDeckModal();
    const select = document.getElementById("deck-select-category");
    if (
        select &&
        select.querySelector(`option[value="${CSS.escape(materiaNombre)}"]`)
    ) {
        select.value = materiaNombre;
        handleDeckSelectCategoryChange();
    }
}

function openEditDeckModal(deckId, event) {
    event.stopPropagation();
    const deck = currentDecks.find((d) => d.id === deckId);
    if (!deck) return;

    document.getElementById("deck-edit-id").value = deckId;
    document.getElementById("deck-input-name").value = deck.nombre;
    document.getElementById("deck-input-desc").value = deck.descripcion || "";

    const select = document.getElementById("deck-select-category");
    const wrapper = document.getElementById("new-category-input-wrapper");

    if (select) {
        const cat = deck.categoria || "General";
        const hasOption = Array.from(select.options).some(
            (opt) => opt.value === cat,
        );
        if (hasOption) {
            select.value = cat;
            if (wrapper) wrapper.style.display = "none";
        } else {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.innerText = cat;
            select.insertBefore(
                opt,
                select.querySelector('option[value="__NEW__"]'),
            );
            select.value = cat;
            if (wrapper) wrapper.style.display = "none";
        }
    }
    document.getElementById("deck-input-category").value = "";

    document.getElementById("deck-modal-title-text").innerText =
        "Editar Mazo de Estudio";
    document.getElementById("btn-deck-submit").innerText = "Guardar Cambios";

    // Seleccionar color
    const picker = document.getElementById("color-picker-grid");
    picker
        .querySelectorAll(".color-option")
        .forEach((opt) => opt.classList.remove("selected"));
    const colorOpt = picker.querySelector(
        `.color-option[data-color="${deck.color || "indigo"}"]`,
    );
    if (colorOpt) colorOpt.classList.add("selected");

    document.getElementById("create-deck-modal").classList.add("open");
}

function closeCreateDeckModal() {
    document.getElementById("create-deck-modal").classList.remove("open");
    document.getElementById("create-deck-form").reset();
    document.getElementById("deck-input-category").value = "";
    const select = document.getElementById("deck-select-category");
    if (select) select.value = "General";
    const wrapper = document.getElementById("new-category-input-wrapper");
    if (wrapper) wrapper.style.display = "none";
    document
        .querySelectorAll(".color-option")
        .forEach((opt) => opt.classList.remove("selected"));
    document
        .querySelector('.color-option[data-color="indigo"]')
        .classList.add("selected");
}

function closeCreateDeckModalOnOverlay(event) {
    if (event.target === document.getElementById("create-deck-modal")) {
        closeCreateDeckModal();
    }
}

function initColorPicker() {
    const picker = document.getElementById("color-picker-grid");
    picker.addEventListener("click", (e) => {
        const option = e.target.closest(".color-option");
        if (!option) return;
        picker
            .querySelectorAll(".color-option")
            .forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
    });
}

async function handleCreateDeck(event) {
    event.preventDefault();
    const deckId = document.getElementById("deck-edit-id").value;
    const nombreInput = document.getElementById("deck-input-name");
    const descInput = document.getElementById("deck-input-desc");
    const selectVal = document.getElementById("deck-select-category").value;
    const categoriaInput = document.getElementById("deck-input-category");
    let category = null;
    if (selectVal === "__NEW__") {
        category = categoriaInput.value.trim() || null;
    } else if (selectVal !== "General") {
        category = selectVal;
    }

    const selectedColorOpt = document.querySelector(".color-option.selected");
    const color = selectedColorOpt
        ? selectedColorOpt.getAttribute("data-color")
        : "indigo";

    const saveBtn = document.getElementById("btn-deck-submit");
    const originalText = saveBtn.innerText;
    saveBtn.disabled = true;
    saveBtn.innerText = deckId ? "Guardando..." : "Creando...";

    const url = deckId
        ? `/api/flashcards/decks/${deckId}`
        : "/api/flashcards/decks";
    const method = deckId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: getApiHeaders(),
            body: JSON.stringify({
                nombre: nombreInput.value.trim(),
                descripcion: descInput.value.trim() || null,
                color: color,
                categoria: category,
            }),
        });

        if (!response.ok) throw new Error("Error al procesar mazo");

        const createdOrUpdatedDeck = await response.json();

        closeCreateDeckModal();
        await loadDecks();

        // Si es la creación de un nuevo mazo, redirigir directamente a la pantalla de gestión de tarjetas
        if (method === "POST") {
            openManageSection(
                createdOrUpdatedDeck.id,
                createdOrUpdatedDeck.nombre,
            );
        }
    } catch (error) {
        console.error(error);
        showToast("No se pudo procesar el mazo. Intente de nuevo.", "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }
}

async function handleDeleteDeck(deckId) {
    const confirmed = await showCustomConfirm({
        title: "¿Eliminar mazo?",
        message:
            "¿Estás seguro de que quieres eliminar este mazo? Se eliminarán también todas sus tarjetas asociadas. Esta acción no se puede deshacer.",
        acceptText: "Eliminar",
        cancelText: "Cancelar",
        isDestructive: true,
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/flashcards/decks/${deckId}`, {
            method: "DELETE",
            headers: getApiHeaders(),
        });

        if (!response.ok) throw new Error("Error al eliminar mazo");
        await loadDecks();
        showToast("Mazo eliminado con éxito.", "success");
    } catch (error) {
        console.error(error);
        showToast("No se pudo eliminar el mazo. Intente de nuevo.", "error");
    }
}

// ==========================================================================
// LÓGICA DE ESTUDIO ACTIVO (3D FLIP CARD CAROUSEL & EXAMEN)
// ==========================================================================
function startStudySession(deckId) {
    selectedDeckIdForStudy = deckId;

    // Restablecer la selección del modo de estudio a "all" al abrir el modal
    const rAll = document.querySelector(
        'input[name="study-mode-choice"][value="all"]',
    );
    if (rAll) {
        rAll.checked = true;
        // Disparar el evento change manualmente para actualizar la UI y ocultar el selector de cantidad
        rAll.dispatchEvent(new Event("change"));
    }

    document.getElementById("study-mode-modal").classList.add("open");
}

function closeStudyModeModal() {
    document.getElementById("study-mode-modal").classList.remove("open");
}

function closeStudyModeModalOnOverlay(event) {
    if (event.target === document.getElementById("study-mode-modal")) {
        closeStudyModeModal();
    }
}

function initStudyModeSelector() {
    const rAll = document.querySelector(
        'input[name="study-mode-choice"][value="all"]',
    );
    const rExam = document.querySelector(
        'input[name="study-mode-choice"][value="exam"]',
    );
    const lblAll = document.getElementById("label-mode-all");
    const lblExam = document.getElementById("label-mode-exam");

    const updateUI = (selected, mode) => {
        [lblAll, lblExam].forEach((lbl) => {
            if (lbl) {
                lbl.style.background = "transparent";
                lbl.style.borderColor = "var(--border)";
            }
        });
        if (selected) {
            selected.style.background = "var(--border-light)";
            selected.style.borderColor = "var(--brand)";
        }

        const examQtyWrapper = document.getElementById("exam-quantity-wrapper");
        if (examQtyWrapper) {
            if (mode === "exam") {
                examQtyWrapper.style.display = "block";
            } else {
                examQtyWrapper.style.display = "none";
            }
        }
    };

    if (rAll) rAll.addEventListener("change", () => updateUI(lblAll, "all"));
    if (rExam)
        rExam.addEventListener("change", () => updateUI(lblExam, "exam"));
}

async function confirmStudySessionStart() {
    const choice = document.querySelector(
        'input[name="study-mode-choice"]:checked',
    ).value;
    currentStudyMode = choice;
    closeStudyModeModal();

    const deckId = selectedDeckIdForStudy;

    try {
        const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
            method: "GET",
            headers: getApiHeaders(),
        });

        if (!response.ok)
            throw new Error("No se pudieron obtener las tarjetas del mazo");

        let cards = await response.json();
        if (cards.length === 0) {
            showToast("Este mazo no tiene tarjetas para estudiar.", "error");
            return;
        }

        currentStudyDeck = currentDecks.find((d) => d.id === deckId);
        masterSessionCards = cards; // Guardar copia maestra para distractores

        if (currentStudyMode === "exam") {
            cards = shuffleArray(cards);
            const limitSelect = document.getElementById("exam-question-count");
            if (limitSelect && limitSelect.value !== "all") {
                const limit = parseInt(limitSelect.value, 10);
                if (!isNaN(limit)) {
                    cards = cards.slice(0, limit);
                }
            }
        } else {
            cards = shuffleArray(cards);
        }

        currentStudyCards = cards;
        currentStudyIndex = 0;
        currentSessionCorrect = 0;
        currentSessionIncorrect = 0;

        showStudyCard(currentStudyIndex);

        // Transición visual
        sectionDecks.style.display = "none";
        sectionStudy.style.display = "block";

        if (currentStudyMode !== "exam") {
            enableKeyboardShortcuts();
        } else {
            disableKeyboardShortcuts();
        }
    } catch (error) {
        console.error(error);
        showToast("Error al iniciar sesión de estudio.", "error");
    }
}

function showStudyCard(index) {
    const card = currentStudyCards[index];

    if (currentStudyMode === "exam") {
        // Modo Examen
        document.getElementById("card-mode-wrapper").style.display = "none";
        document.getElementById("exam-mode-wrapper").style.display = "block";
        document.getElementById("study-controls").style.display = "none";
        document.getElementById("flip-hint-message").style.display = "none";

        // Cargar datos del examen
        const qExamText = document.getElementById("exam-question-text");
        qExamText.innerHTML = parseCardText(card.pregunta);

        if (window.renderMathInElement) {
            window.renderMathInElement(qExamText, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                ],
                throwOnError: false,
            });
        }

        // Ocultar botón continuar
        document.getElementById("exam-next-action-wrapper").style.display =
            "none";

        // Construir opciones de respuesta (Correcta + distractores)
        const correctAnswer = card.respuesta;
        let options = [];

        if (card.distractor_1) {
            // Usar distractores de alta calidad generados por la IA y guardados en la DB
            options = [
                correctAnswer,
                card.distractor_1,
                card.distractor_2,
                card.distractor_3,
            ];
        } else {
            // Fallback: extraer distractores al azar de otras tarjetas del mismo mazo (mazos manuales o antiguos)
            const distractors = masterSessionCards
                .filter((c) => c.id !== card.id)
                .map((c) => c.respuesta);

            const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
            options = [correctAnswer, ...shuffledDistractors];
        }

        // Barajar todas las opciones finales
        options = shuffleArray(options);

        // Pintar botones de opciones
        const grid = document.getElementById("exam-options-grid");
        grid.innerHTML = "";

        options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "btn-exam-option";
            btn.innerHTML = parseCardText(opt);

            if (window.renderMathInElement) {
                window.renderMathInElement(btn, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false },
                    ],
                    throwOnError: false,
                });
            }

            btn.onclick = () =>
                selectExamOption(btn, opt, correctAnswer, card.id);
            grid.appendChild(btn);
        });
    } else {
        // Modo Tarjetas 3D
        document.getElementById("card-mode-wrapper").style.display = "block";
        document.getElementById("exam-mode-wrapper").style.display = "none";
        document.getElementById("study-controls").style.display = "flex";
        document.getElementById("flip-hint-message").style.display = "block";

        const flipCard = document.getElementById("flip-card");
        flipCard.classList.remove("flipped");
        flipCard.classList.remove("shake-incorrect");

        const qTextEl = document.getElementById("card-question-text");
        const aTextEl = document.getElementById("card-answer-text");

        qTextEl.innerHTML = parseCardText(card.pregunta);
        aTextEl.innerHTML = parseCardText(card.respuesta);

        if (window.renderMathInElement) {
            window.renderMathInElement(qTextEl, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                ],
                throwOnError: false,
            });
            window.renderMathInElement(aTextEl, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                ],
                throwOnError: false,
            });
        }

        const totalAttempts = (card.correctas || 0) + (card.incorrectas || 0);
        const accuracy =
            totalAttempts > 0
                ? Math.round((card.correctas / totalAttempts) * 100)
                : null;
        let cardStatsText = "Sin repaso previo";
        if (accuracy !== null) {
            cardStatsText = `Historial: 🟢 ${card.correctas} | 🔴 ${card.incorrectas} (${accuracy}% aciertos)`;
        }
        document.getElementById("card-study-stats").innerText = cardStatsText;

        document.getElementById("study-controls").classList.remove("visible");
        document.getElementById("flip-hint-message").classList.remove("hidden");
    }

    // Actualizar barra de progreso superior
    const progressPercent = (index / currentStudyCards.length) * 100;
    document.getElementById("study-progress-bar").style.width =
        `${progressPercent}%`;
    document.getElementById("study-progress-text").innerText =
        `Tarjeta ${index + 1} de ${currentStudyCards.length}`;
}

function flipStudyCard() {
    if (currentStudyMode === "exam") return;
    const flipCard = document.getElementById("flip-card");
    flipCard.classList.toggle("flipped");

    const flipped = flipCard.classList.contains("flipped");
    if (flipped) {
        document.getElementById("study-controls").classList.add("visible");
        document.getElementById("flip-hint-message").classList.add("hidden");
    } else {
        document.getElementById("study-controls").classList.remove("visible");
        document.getElementById("flip-hint-message").classList.remove("hidden");
    }
}

// Selección en Modo Examen (Múltiple Opción)
function selectExamOption(selectedBtn, chosenAnswer, correctAnswer, cardId) {
    const grid = document.getElementById("exam-options-grid");
    const buttons = grid.querySelectorAll(".btn-exam-option");

    // Desactivar todos los botones de opciones
    buttons.forEach((btn) => (btn.disabled = true));

    if (chosenAnswer === correctAnswer) {
        selectedBtn.classList.add("option-correct");
        currentSessionCorrect++;
        submitCardResultBackground(cardId, "correcto");
    } else {
        selectedBtn.classList.add("option-incorrect");
        currentSessionIncorrect++;
        submitCardResultBackground(cardId, "incorrecto");

        // Resaltar la opción correcta en verde
        buttons.forEach((btn) => {
            // Comparamos el contenido de texto ignorando KaTeX markup
            if (
                btn.innerText.trim() === correctAnswer.trim() ||
                btn.textContent.trim() === correctAnswer.trim()
            ) {
                btn.classList.add("option-correct");
            }
        });
    }

    // Mostrar botón de continuar
    document.getElementById("exam-next-action-wrapper").style.display = "flex";
}

function submitCardResultBackground(cardId, outcome) {
    try {
        fetch(`/api/flashcards/cards/${cardId}/resultado`, {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({ resultado: outcome }),
        });
    } catch (err) {
        console.error("Error al reportar resultado:", err);
    }
}

function proceedToNextExamCard() {
    currentStudyIndex++;
    if (currentStudyIndex < currentStudyCards.length) {
        showStudyCard(currentStudyIndex);
    } else {
        document.getElementById("study-progress-bar").style.width = "100%";
        showSummarySession();
    }
}

async function submitCardResult(outcome) {
    const card = currentStudyCards[currentStudyIndex];

    if (outcome === "correcto") {
        currentSessionCorrect++;
    } else {
        currentSessionIncorrect++;
        const flipCard = document.getElementById("flip-card");
        flipCard.classList.add("shake-incorrect");
        setTimeout(() => {
            flipCard.classList.remove("shake-incorrect");
        }, 400);
    }

    // Guardar resultado
    try {
        fetch(`/api/flashcards/cards/${card.id}/resultado`, {
            method: "POST",
            headers: getApiHeaders(),
            body: JSON.stringify({ resultado: outcome }),
        });
    } catch (err) {
        console.error("Error al guardar:", err);
    }

    const nextIndex = currentStudyIndex + 1;
    const delay = outcome === "incorrecto" ? 400 : 0;

    setTimeout(() => {
        if (nextIndex < currentStudyCards.length) {
            currentStudyIndex = nextIndex;
            showStudyCard(currentStudyIndex);
        } else {
            document.getElementById("study-progress-bar").style.width = "100%";
            showSummarySession();
        }
    }, delay + 100);
}

function triggerConfettiCelebration() {
    if (
        typeof window.animacionesHabilitadas === "function" &&
        !window.animacionesHabilitadas()
    ) {
        return;
    }
    if (typeof confetti === "undefined") return;

    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1100,
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Efecto fuegos artificiales cruzados
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
    }, 250);
}

function showSummarySession() {
    disableKeyboardShortcuts();
    sectionStudy.style.display = "none";
    sectionSummary.style.display = "block";

    document.getElementById("summary-stat-correct").innerText =
        currentSessionCorrect;
    document.getElementById("summary-stat-incorrect").innerText =
        currentSessionIncorrect;
    document.getElementById("summary-stat-total").innerText =
        currentStudyCards.length;

    const total = currentStudyCards.length;
    const accuracyPercent = Math.round((currentSessionCorrect / total) * 100);
    document.getElementById("summary-percentage-text").innerText =
        `${accuracyPercent}%`;

    const radius = 60;
    const circumference = 2 * Math.PI * radius; // 377
    const offset = circumference - (accuracyPercent / 100) * circumference;
    const fgCircle = document.getElementById("summary-circle-progress");
    fgCircle.style.strokeDashoffset = offset;

    const feedbackText = document.getElementById("summary-feedback-text");
    const feedbackBox = document.getElementById("summary-feedback-box");
    if (accuracyPercent === 100) {
        feedbackText.innerText =
            "¡Increíble! Has dominado el 100% de este mazo. ¡Excelente retención!";
        feedbackBox.style.background = "rgba(5, 150, 105, 0.1)";
        feedbackBox.style.borderColor = "rgba(5, 150, 105, 0.3)";
    } else if (accuracyPercent >= 70) {
        feedbackText.innerText =
            "¡Muy buen rendimiento! Tienes claros la mayoría de los conceptos. Dale un repaso extra para la perfección.";
        feedbackBox.style.background = "rgba(99, 102, 241, 0.1)";
        feedbackBox.style.borderColor = "rgba(99, 102, 241, 0.3)";
    } else {
        feedbackText.innerText =
            "Sigue repasando este mazo. La repetición espaciada te ayudará a consolidar estos temas complejos.";
        feedbackBox.style.background = "rgba(217, 119, 6, 0.1)";
        feedbackBox.style.borderColor = "rgba(217, 119, 6, 0.3)";
    }

    // Lanzar confeti si el resultado es alto
    if (accuracyPercent >= 75) {
        triggerConfettiCelebration();
    }
}

function restartStudySession() {
    sectionSummary.style.display = "none";

    currentStudyCards = shuffleArray(currentStudyCards);

    currentStudyIndex = 0;
    currentSessionCorrect = 0;
    currentSessionIncorrect = 0;

    showStudyCard(currentStudyIndex);
    sectionStudy.style.display = "block";

    if (currentStudyMode !== "exam") {
        enableKeyboardShortcuts();
    }
}

async function exitStudySession() {
    const confirmed = await showCustomConfirm({
        title: "¿Salir del estudio?",
        message:
            "¿Estás seguro de que deseas salir del estudio activo? El progreso no guardado de esta sesión se perderá.",
        acceptText: "Salir",
        cancelText: "Cancelar",
        isDestructive: true,
    });
    if (confirmed) {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        disableKeyboardShortcuts();
        sectionStudy.style.display = "none";
        sectionDecks.style.display = "block";
        loadDecks();
    }
}

function exitSummaryToDecks() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    sectionSummary.style.display = "none";
    sectionDecks.style.display = "block";
    loadDecks();
}

// ==========================================================================
// LÓGICA DE IMPORTACIÓN Y EXPORTACIÓN JSON
// ==========================================================================
function triggerImportSelector() {
    document.getElementById("import-deck-file-input").click();
}

async function handleImportDeckFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.nombre || !data.cards || !Array.isArray(data.cards)) {
                showToast(
                    "El archivo JSON no tiene el formato de mazo compatible con Cursus.",
                    "error",
                );
                return;
            }

            const response = await fetch("/api/flashcards/decks/import", {
                method: "POST",
                headers: getApiHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Error al importar");

            showToast("Mazo importado con éxito. ✨", "success");
            loadDecks();
        } catch (err) {
            console.error(err);
            showToast(
                "No se pudo leer o importar el archivo JSON. Verifica su estructura.",
                "error",
            );
        } finally {
            event.target.value = "";
        }
    };
    reader.readAsText(file);
}

async function handleExportDeck(deckId, event) {
    event.stopPropagation();
    const deck = currentDecks.find((d) => d.id === deckId);
    if (!deck) return;

    try {
        const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
            method: "GET",
            headers: getApiHeaders(),
        });

        if (!response.ok) throw new Error("Error al obtener tarjetas");

        const cards = await response.json();
        const exportData = {
            nombre: deck.nombre,
            descripcion: deck.descripcion,
            color: deck.color,
            categoria: deck.categoria,
            cards: cards.map((c) => ({
                pregunta: c.pregunta,
                respuesta: c.respuesta,
                distractor_1: c.distractor_1,
                distractor_2: c.distractor_2,
                distractor_3: c.distractor_3,
            })),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mazo-${deck.nombre.toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Mazo exportado con éxito. ✨", "success");
    } catch (err) {
        console.error(err);
        showToast("Error al exportar el mazo.", "error");
    }
}

// ==========================================================================
// LÓGICA DE GESTIÓN DE TARJETAS (MANAGE DECK)
// ==========================================================================
let manageDeckId = null;

async function openManageSection(deckId, deckName) {
    manageDeckId = deckId;
    document.getElementById("manage-deck-name").innerText =
        `Gestionar Mazo: ${deckName}`;

    sectionDecks.style.display = "none";
    sectionManage.style.display = "block";

    await loadManageCards();
}

async function loadManageCards() {
    const container = document.getElementById("manage-cards-list");
    container.innerHTML =
        '<div style="text-align: center; padding: 2rem; color: var(--t3);">Cargando tarjetas del mazo...</div>';

    try {
        const response = await fetch(
            `/api/flashcards/decks/${manageDeckId}/cards`,
            {
                method: "GET",
                headers: getApiHeaders(),
            },
        );

        if (!response.ok) throw new Error("Error al obtener tarjetas");

        const cards = await response.json();
        document.getElementById("manage-cards-count").innerText = cards.length;
        renderManageCards(cards);
    } catch (error) {
        console.error(error);
        container.innerHTML =
            '<div style="text-align: center; padding: 2rem; color: var(--red);">Error al cargar tarjetas.</div>';
    }
}

function renderManageCards(cards) {
    const container = document.getElementById("manage-cards-list");
    if (cards.length === 0) {
        container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--t3); border: 2px dashed var(--border); border-radius: var(--r);">
                    Este mazo no tiene tarjetas añadidas aún. ¡Crea una en el formulario de la izquierda!
                </div>
            `;
        return;
    }

    let html = "";
    cards.forEach((card) => {
        const totalAttempts = card.correctas + card.incorrectas;
        const accuracy =
            totalAttempts > 0
                ? Math.round((card.correctas / totalAttempts) * 100)
                : null;
        let statsHtml = `<span style="font-size:0.75rem; color:var(--t3);">Sin repasos aún</span>`;
        if (accuracy !== null) {
            statsHtml = `<span style="font-size:0.75rem; font-weight:600; color:${accuracy >= 75 ? "var(--green)" : accuracy >= 50 ? "var(--yellow)" : "var(--red)"};">
                    Acierto: ${accuracy}% (🟢 ${card.correctas} | 🔴 ${card.incorrectas}) • Caja: ${card.caja || 1}
                </span>`;
        }

        html += `
                <div class="card-list-item" id="card-item-${card.id}">
                    <div class="card-item-qa" id="card-display-${card.id}">
                        <div class="qa-block">
                            <div class="qa-label">Pregunta (Frente)</div>
                            <div class="qa-content">${escapeHtml(card.pregunta)}</div>
                        </div>
                        <div class="qa-block">
                            <div class="qa-label">Respuesta (Reverso)</div>
                            <div class="qa-content">${escapeHtml(card.respuesta)}</div>
                        </div>
                        <div style="margin-top:0.4rem; display:flex; align-items:center; gap:0.5rem;">
                            ${statsHtml}
                        </div>
                        <div class="card-item-actions">
                            <button class="btn-deck-icon" onclick="startEditCard(${card.id})" title="Editar tarjeta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-deck-icon delete-btn" onclick="handleDeleteCard(${card.id})" title="Eliminar tarjeta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="card-edit-form" id="card-edit-form-${card.id}" style="display:none;">
                        <div class="form-group" style="margin-bottom: 0.5rem;">
                            <label>Pregunta (Frente)</label>
                            <textarea id="edit-textarea-q-${card.id}" class="fc-input fc-textarea" style="min-height:50px;" required>${escapeHtml(card.pregunta)}</textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0.5rem;">
                            <label>Respuesta (Reverso)</label>
                            <textarea id="edit-textarea-a-${card.id}" class="fc-input fc-textarea" style="min-height:50px;" required>${escapeHtml(card.respuesta)}</textarea>
                        </div>
                        <div style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                <span style="font-size:0.8rem; font-weight:600; color:var(--t2);">Opciones incorrectas (Opcional)</span>
                                <button type="button" id="btn-edit-suggest-${card.id}" onclick="handleEditSuggestDistractors(${card.id})" style="background:var(--border-light); border:1px solid var(--border); border-radius:4px; padding:0.15rem 0.4rem; font-size:0.7rem; font-weight:600; color:var(--brand); cursor:pointer; display:flex; align-items:center; gap:0.2rem; transition:all 0.2s;">
                                    <span>Sugerir con IA ✨</span>
                                </button>
                            </div>
                            <input type="text" id="edit-input-d1-${card.id}" class="fc-input" placeholder="Opción incorrecta 1" value="${escapeHtml(card.distractor_1 || "")}" style="font-size:0.75rem; padding:0.4rem; margin-bottom:0.4rem; width:100%;">
                            <input type="text" id="edit-input-d2-${card.id}" class="fc-input" placeholder="Opción incorrecta 2" value="${escapeHtml(card.distractor_2 || "")}" style="font-size:0.75rem; padding:0.4rem; margin-bottom:0.4rem; width:100%;">
                            <input type="text" id="edit-input-d3-${card.id}" class="fc-input" placeholder="Opción incorrecta 3" value="${escapeHtml(card.distractor_3 || "")}" style="font-size:0.75rem; padding:0.4rem; width:100%;">
                        </div>
                        <div class="card-edit-actions" style="margin-top: 0.75rem;">
                            <button class="btn-card-cancel" onclick="cancelEditCard(${card.id})">Cancelar</button>
                            <button class="btn-card-save" onclick="saveEditCard(${card.id})">Guardar</button>
                        </div>
                    </div>
                </div>
            `;
    });
    container.innerHTML = html;

    // Renderizar ecuaciones KaTeX sobre la lista de gestión
    if (window.renderMathInElement) {
        window.renderMathInElement(container, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
            ],
            throwOnError: false,
        });
    }
}

function startEditCard(cardId) {
    if (editingCardId !== null) {
        cancelEditCard(editingCardId);
    }
    editingCardId = cardId;
    document.getElementById(`card-display-${cardId}`).style.display = "none";
    document.getElementById(`card-edit-form-${cardId}`).style.display = "block";
}

function cancelEditCard(cardId) {
    editingCardId = null;
    document.getElementById(`card-display-${cardId}`).style.display = "block";
    document.getElementById(`card-edit-form-${cardId}`).style.display = "none";
}

async function handleSuggestDistractors() {
    const qVal = document.getElementById("card-input-question").value.trim();
    const aVal = document.getElementById("card-input-answer").value.trim();

    if (!qVal || !aVal) {
        showToast(
            "Por favor, escribe la Pregunta y la Respuesta primero.",
            "error",
        );
        return;
    }

    const btn = document.getElementById("btn-suggest-distractors");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<span>Generando... ⏳</span>";

    try {
        const currentDeck = currentDecks.find((d) => d.id === manageDeckId);
        const category = currentDeck ? currentDeck.categoria : "General";

        const response = await fetch(
            "/api/flashcards/cards/generate-distractors",
            {
                method: "POST",
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: qVal,
                    respuesta: aVal,
                    categoria: category,
                }),
            },
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Error al generar distractores.");
        }

        const data = await response.json();
        document.getElementById("card-input-d1").value =
            data.distractor_1 || "";
        document.getElementById("card-input-d2").value =
            data.distractor_2 || "";
        document.getElementById("card-input-d3").value =
            data.distractor_3 || "";
        showToast("¡Opciones incorrectas sugeridas con éxito! ✨", "success");
    } catch (error) {
        console.error(error);
        showToast(
            "No se pudieron generar las opciones con IA. Inténtalo de nuevo.",
            "error",
        );
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function handleEditSuggestDistractors(cardId) {
    const qVal = document
        .getElementById(`edit-textarea-q-${cardId}`)
        .value.trim();
    const aVal = document
        .getElementById(`edit-textarea-a-${cardId}`)
        .value.trim();

    if (!qVal || !aVal) {
        showToast(
            "Por favor, escribe la Pregunta y la Respuesta primero.",
            "error",
        );
        return;
    }

    const btn = document.getElementById(`btn-edit-suggest-${cardId}`);
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<span>Generando... ⏳</span>";

    try {
        const currentDeck = currentDecks.find((d) => d.id === manageDeckId);
        const category = currentDeck ? currentDeck.categoria : "General";

        const response = await fetch(
            "/api/flashcards/cards/generate-distractors",
            {
                method: "POST",
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: qVal,
                    respuesta: aVal,
                    categoria: category,
                }),
            },
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Error al generar distractores.");
        }

        const data = await response.json();
        document.getElementById(`edit-input-d1-${cardId}`).value =
            data.distractor_1 || "";
        document.getElementById(`edit-input-d2-${cardId}`).value =
            data.distractor_2 || "";
        document.getElementById(`edit-input-d3-${cardId}`).value =
            data.distractor_3 || "";
        showToast("¡Opciones incorrectas sugeridas con éxito! ✨", "success");
    } catch (error) {
        console.error(error);
        showToast(
            "No se pudieron generar las opciones con IA. Inténtalo de nuevo.",
            "error",
        );
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function saveEditCard(cardId) {
    const pregunta = document
        .getElementById(`edit-textarea-q-${cardId}`)
        .value.trim();
    const respuesta = document
        .getElementById(`edit-textarea-a-${cardId}`)
        .value.trim();
    const dist1 =
        document.getElementById(`edit-input-d1-${cardId}`).value.trim() || null;
    const dist2 =
        document.getElementById(`edit-input-d2-${cardId}`).value.trim() || null;
    const dist3 =
        document.getElementById(`edit-input-d3-${cardId}`).value.trim() || null;

    if (!pregunta || !respuesta) {
        showToast("Ambos campos son requeridos", "error");
        return;
    }

    try {
        const response = await fetch(`/api/flashcards/cards/${cardId}`, {
            method: "PUT",
            headers: getApiHeaders(),
            body: JSON.stringify({
                pregunta,
                respuesta,
                distractor_1: dist1,
                distractor_2: dist2,
                distractor_3: dist3,
            }),
        });

        if (!response.ok) throw new Error("Error al actualizar tarjeta");

        editingCardId = null;
        await loadManageCards();
        showToast("Tarjeta guardada con éxito.", "success");
    } catch (error) {
        console.error(error);
        showToast("No se pudo guardar la tarjeta. Intente de nuevo.", "error");
    }
}

async function handleCreateCard(event) {
    event.preventDefault();
    const preguntaInput = document.getElementById("card-input-question");
    const respuestaInput = document.getElementById("card-input-answer");
    const d1Input = document.getElementById("card-input-d1");
    const d2Input = document.getElementById("card-input-d2");
    const d3Input = document.getElementById("card-input-d3");
    const submitBtn = event.target.querySelector(".btn-add-card");

    submitBtn.disabled = true;
    submitBtn.innerText = "Guardando...";

    try {
        const response = await fetch(
            `/api/flashcards/decks/${manageDeckId}/cards`,
            {
                method: "POST",
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: preguntaInput.value.trim(),
                    respuesta: respuestaInput.value.trim(),
                    distractor_1: d1Input.value.trim() || null,
                    distractor_2: d2Input.value.trim() || null,
                    distractor_3: d3Input.value.trim() || null,
                }),
            },
        );

        if (!response.ok) throw new Error("Error al añadir tarjeta");

        preguntaInput.value = "";
        respuestaInput.value = "";
        d1Input.value = "";
        d2Input.value = "";
        d3Input.value = "";
        preguntaInput.focus();
        await loadManageCards();
        showToast("Tarjeta añadida con éxito.", "success");
    } catch (error) {
        console.error(error);
        showToast("No se pudo guardar la tarjeta. Intente de nuevo.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Guardar Tarjeta";
    }
}

async function handleDeleteCard(cardId) {
    const confirmed = await showCustomConfirm({
        title: "¿Eliminar tarjeta?",
        message:
            "¿Estás seguro de que quieres eliminar esta tarjeta? Esta acción no se puede deshacer.",
        acceptText: "Eliminar",
        cancelText: "Cancelar",
        isDestructive: true,
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/flashcards/cards/${cardId}`, {
            method: "DELETE",
            headers: getApiHeaders(),
        });

        if (!response.ok) throw new Error("Error al eliminar tarjeta");
        await loadManageCards();
        showToast("Tarjeta eliminada con éxito.", "success");
    } catch (error) {
        console.error(error);
        showToast("No se pudo eliminar la tarjeta. Intente de nuevo.", "error");
    }
}

function exitManageSection() {
    sectionManage.style.display = "none";
    sectionDecks.style.display = "block";
    loadDecks();
}

// ==========================================================================
// UTILS / HELPERS
// ==========================================================================
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function escapeHtml(text) {
    if (!text) return "";
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

function escapeJs(text) {
    if (!text) return "";
    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
}

// Parsear Markdown (código, negrita, cursiva, listas) y saltos de línea
function parseCardText(text) {
    if (!text) return "";
    let escaped = escapeHtml(text);

    // Bloques de código (multilínea) con look de terminal oscuro
    escaped = escaped.replace(
        /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g,
        '<pre style="background:#0f172a; color:#e2e8f0; padding:0.75rem; border-radius:8px; overflow-x:auto; text-align:left; font-family:monospace; font-size:0.82rem; border:1px solid rgba(255,255,255,0.08); width:100%; white-space:pre-wrap; margin: 0.75rem 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);"><code>$1</code></pre>',
    );

    // Código inline
    escaped = escaped.replace(
        /`([^`]+)`/g,
        '<code style="background:rgba(99,102,241,0.08); color:var(--brand); padding:0.15rem 0.35rem; border-radius:4px; font-family:monospace; font-size:0.85rem; border:1px solid var(--brand-dim); font-weight:600;">$1</code>',
    );

    // Negrita (**texto**)
    escaped = escaped.replace(
        /\*\*([\s\S]*?)\*\*/g,
        '<strong style="font-weight:700;">$1</strong>',
    );

    // Cursiva (*texto*)
    escaped = escaped.replace(
        /\*([\s\S]*?)\*/g,
        '<em style="font-style:italic;">$1</em>',
    );

    // Listas con viñetas:
    // Procesar línea por línea para estructurar listas de forma semántica
    let lines = escaped.split("\n");
    let inList = false;
    let processedLines = [];

    lines.forEach((line) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("- ")) {
            if (!inList) {
                processedLines.push(
                    '<ul style="text-align: left; margin: 0.5rem 0 0.5rem 1.5rem; list-style-type: disc; width: 100%;">',
                );
                inList = true;
            }
            processedLines.push(
                '<li style="margin-bottom: 0.25rem; font-size: 0.95rem; line-height: 1.5; color: inherit;">' +
                    trimmed.substring(2) +
                    "</li>",
            );
        } else {
            if (inList) {
                processedLines.push("</ul>");
                inList = false;
            }
            processedLines.push(line);
        }
    });
    if (inList) {
        processedLines.push("</ul>");
    }

    escaped = processedLines.join("\n");

    // Saltos de línea
    escaped = escaped.replace(/\n/g, "<br>");

    return escaped;
}

// Lógica Text-To-Speech (Lectura en Voz Alta)
function speakCardText(event, elementId) {
    if (event) event.stopPropagation(); // Evitar que gire la tarjeta

    if (!("speechSynthesis" in window)) {
        showToast("Tu navegador no soporta síntesis de voz.", "error");
        return;
    }

    window.speechSynthesis.cancel(); // Cancelar cualquier lectura activa

    const el = document.getElementById(elementId);
    if (!el) return;

    // Extraer texto plano libre de formato markdown
    let cleanText = el.innerText
        .replace(/```[\s\S]*?```/g, "") // Eliminar bloques de código
        .replace(/`([^`]+)`/g, "$1") // Código inline a texto
        .replace(/\*\*([^*]+)\*\*/g, "$1") // Negrita a texto
        .replace(/\*([^*]+)\*/g, "$1") // Cursiva a texto
        .replace(/[-*]\s+/g, "") // Viñetas
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES"; // Configurar voz en Español

    // Intentar seleccionar la voz en español de mejor calidad
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utterance.voice = esVoice;

    window.speechSynthesis.speak(utterance);
}

function handleAIDeckSelectCategoryChange() {
    const select = document.getElementById("ai-deck-select-category");
    const wrapper = document.getElementById("ai-new-category-input-wrapper");
    const input = document.getElementById("ai-deck-input-category");
    if (select && wrapper && input) {
        if (select.value === "__NEW__") {
            wrapper.style.display = "block";
            input.focus();
        } else {
            wrapper.style.display = "none";
            input.value = "";
        }
    }
}

function openAIDeckModal() {
    const select = document.getElementById("ai-deck-select-category");
    if (select) select.value = "__AUTO__";
    const wrapper = document.getElementById("ai-new-category-input-wrapper");
    if (wrapper) wrapper.style.display = "none";
    document.getElementById("ai-deck-input-category").value = "";

    document.getElementById("ai-deck-modal").classList.add("open");
}

// Modal de IA cerrar
function closeAIDeckModal() {
    document.getElementById("ai-deck-modal").classList.remove("open");
    document.getElementById("ai-deck-form").reset();
    const select = document.getElementById("ai-deck-select-category");
    if (select) select.value = "__AUTO__";
    const wrapper = document.getElementById("ai-new-category-input-wrapper");
    if (wrapper) wrapper.style.display = "none";
    document.getElementById("ai-deck-input-category").value = "";
}

function closeAIDeckModalOnOverlay(event) {
    if (event.target === document.getElementById("ai-deck-modal")) {
        closeAIDeckModal();
    }
}

async function handleAICreateDeck(event) {
    event.preventDefault();

    const fileInput = document.getElementById("ai-deck-file");
    if (!fileInput.files.length) {
        showToast("Por favor, selecciona un archivo.", "error");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const countInput = document.getElementById("ai-deck-cards-count");
    if (countInput) {
        formData.append("cantidad", countInput.value);
    }

    const selectVal = document.getElementById("ai-deck-select-category").value;
    const newCatInput = document.getElementById("ai-deck-input-category");
    let category = "__AUTO__";
    if (selectVal === "__NEW__") {
        category = newCatInput.value.trim() || "__AUTO__";
    } else {
        category = selectVal;
    }
    formData.append("categoria", category);

    // Cerrar modal de carga de archivos y abrir overlay de progreso
    closeAIDeckModal();

    const loadingOverlay = document.getElementById("ai-loading-overlay");
    const loadingTitle = document.getElementById("ai-loading-title");
    const loadingText = document.getElementById("ai-loading-text");

    loadingOverlay.style.display = "flex";
    setTimeout(() => {
        loadingOverlay.classList.add("open");
    }, 10);
    loadingTitle.textContent = "Subiendo archivo...";
    loadingText.textContent =
        "Tu documento se está cargando en el servidor local.";

    // Simular fases en la UI de carga para dar un look premium interactivo
    const phases = [
        {
            t: 1500,
            title: "Procesando archivo...",
            text: "Analizando el documento o imagen subida.",
        },
        {
            t: 4000,
            title: "Analizando contenido...",
            text: "La IA de Cursus está leyendo y estructurando los conceptos principales.",
        },
        {
            t: 8500,
            title: "Diseñando flashcards...",
            text: "Redactando las mejores preguntas y respuestas académicas para ti.",
        },
        {
            t: 13000,
            title: "Finalizando creación...",
            text: "Guardando el mazo en la base de datos de tu panel.",
        },
    ];

    const timers = [];
    phases.forEach((phase) => {
        timers.push(
            setTimeout(() => {
                loadingTitle.textContent = phase.title;
                loadingText.textContent = phase.text;
            }, phase.t),
        );
    });

    try {
        const headers = getApiHeaders();
        delete headers["Content-Type"]; // Permitir al navegador añadir el boundary de FormData

        const response = await fetch("/api/flashcards/decks/generate-ia", {
            method: "POST",
            headers: headers,
            body: formData,
        });

        // Cancelar todos los timers de animación simulada
        timers.forEach((t) => clearTimeout(t));

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Error en la generación con IA.");
        }

        const createdDeck = await response.json();

        showToast("¡Mazo generado con IA con éxito! ✨", "success");

        // Recargar la lista y simular clic para estudiar
        await loadDecks();

        // Cerrar carga
        loadingOverlay.classList.remove("open");
        setTimeout(() => {
            loadingOverlay.style.display = "none";
        }, 250);

        // Preguntar si quiere estudiar de inmediato
        startStudySession(createdDeck.id);
    } catch (error) {
        timers.forEach((t) => clearTimeout(t));
        loadingOverlay.classList.remove("open");
        setTimeout(() => {
            loadingOverlay.style.display = "none";
        }, 250);
        showToast(error.message || "No se pudo generar el mazo.", "error");
        openAIDeckModal(); // Volver a abrir el modal de subida si falla
    }
}
