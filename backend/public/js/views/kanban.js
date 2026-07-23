/**
 * @fileoverview Lógica del tablero Kanban y Modales de Tarea.
 *
 * @module kanban
 */

'use strict';

import { ApiService } from '../services/ApiService.js';

export const KanbanManager = {
    tasks: [],
    selectedMateriaId: null,
    callbacks: {},

    /**
     * @param {Object} context { selectedMateriaId, tasks, showToast, openConfirm, escapeHTML, reloadApp, updateFocusActiveGoal }
     */
    init(context) {
        this.selectedMateriaId = context.selectedMateriaId;
        this.tasks = context.tasks || [];
        this.callbacks = {
            showToast: context.showToast,
            openConfirm: context.openConfirm,
            escapeHTML: context.escapeHTML,
            reloadApp: context.reloadApp,
            updateFocusActiveGoal: context.updateFocusActiveGoal
        };
        this.bindEvents();
    },

    updateTasks(tasks) {
        this.tasks = tasks;
        this.renderKanban();
    },

    setMateriaId(id) {
        this.selectedMateriaId = id;
    },

    saveTasksToLocal() {
        localStorage.setItem('cursus_tasks', JSON.stringify(this.tasks));
    },

    /* ==========================================================================
       RENDERIZADO
       ========================================================================== */

    renderKanban() {
        const cols = ['pending', 'progress', 'done'];
        cols.forEach(col => {
            const container = document.getElementById(`cards-${col}`);
            if (!container) return;
            container.innerHTML = '';
            
            // Ordenar por la propiedad 'orden' de menor a mayor
            const colTasks = this.tasks.filter(t => t.column === col).sort((a, b) => (a.orden || 0) - (b.orden || 0));
            const cntEl    = document.getElementById(`cnt-${col}`);
            if (cntEl) cntEl.textContent = colTasks.length;

            colTasks.forEach(task => {
                const card = document.createElement('div');
                card.className = 'kbcard';
                card.id        = `task-${task.id}`;
                card.draggable = true;
                card.dataset.taskId = task.id;

                card.addEventListener('dragstart', (e) => this.dragStart(e, task.id));
                card.addEventListener('dragend', (e) => this.dragEnd(e));
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.kb-del')) return;
                    this.openTaskModal(task.id);
                });

                let metaHtml = '';
                if (task.dueDate) {
                    const [datePart, timePart] = task.dueDate.split('T');
                    const [y, m, d] = datePart.split('-');
                    const date       = new Date(y, m - 1, d);
                    const currentYear = new Date().getFullYear();
                    let dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                    if (date.getFullYear() !== currentYear) dateStr += ` ${date.getFullYear()}`;
                    if (timePart) dateStr += ` · ${timePart.substring(0, 5)}`;
                    const today    = new Date(); today.setHours(0, 0, 0, 0);
                    const isOverdue = date < today && task.column !== 'done';
                    metaHtml += `
                      <div class="kb-meta ${isOverdue ? 'urg' : ''}">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 1v2M11 1v2M2 6h12"/></svg>
                        <span>Vence ${dateStr}</span>
                      </div>
                    `;
                }
                if (task.subtasks && task.subtasks.length > 0) {
                    const completed = task.subtasks.filter(s => s.completed).length;
                    metaHtml += `
                      <div class="kb-meta">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M6 8l1.5 1.5L10 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span>Subtareas ${completed}/${task.subtasks.length}</span>
                      </div>
                    `;
                }

                card.innerHTML = `
                  <div class="kb-title">${this.callbacks.escapeHTML(task.title)}</div>
                  <div class="kb-meta-wrap">${metaHtml}</div>
                  <button class="kb-del" title="Eliminar tarea">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
                  </button>
                `;
                card.querySelector('.kb-del').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.callbacks.openConfirm(`¿Desea eliminar la tarea "${task.title}"?`, () => this.deleteTask(task.id));
                });
                container.appendChild(card);
            });
        });
        if (this.callbacks.updateFocusActiveGoal) this.callbacks.updateFocusActiveGoal();
    },

    /* ==========================================================================
       DRAG & DROP Y REORDENAMIENTO
       ========================================================================== */

    dragId: null,

    dragStart(e, id) {
        this.dragId = id;
        const card = document.getElementById(`task-${id}`);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { if (card) card.classList.add('dragging'); }, 0);
    },

    dragEnd(e) {
        e.target.classList.remove('dragging');
        this.dragId = null;
    },

    allowDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.add('over');
    },

    leaveDrop(e) {
        e.currentTarget.classList.remove('over');
    },

    dropCard(e, col) {
        e.preventDefault();
        e.currentTarget.classList.remove('over');
        if (!this.dragId) return;

        const card = document.getElementById(`task-${this.dragId}`);
        const taskObj = this.tasks.find(t => t.id === this.dragId);
        const cardsContainer = document.getElementById(`cards-${col}`);
        if (!card || !taskObj || !cardsContainer) return;

        // Determinar posición usando el Y del mouse para reordenar
        const afterElement = this.getDragAfterElement(cardsContainer, e.clientY);
        if (afterElement == null) {
            cardsContainer.appendChild(card);
        } else {
            cardsContainer.insertBefore(card, afterElement);
        }

        const mapColsToDb = { pending: 'pendiente', progress: 'progreso', done: 'finalizado' };

        // Guardar estado previo para rollback en caso de error
        const oldTasksState = JSON.parse(JSON.stringify(this.tasks));

        // Recalcular orden para toda la columna
        const currentCards = Array.from(cardsContainer.querySelectorAll('.kbcard'));
        const tareasPayload = [];
        let newOrder = 1;

        currentCards.forEach(c => {
            const tId = c.dataset.taskId;
            // Solo si es un id numerico/valido, aunque por ahora todos lo son
            const tObj = this.tasks.find(t => String(t.id) === String(tId));
            if (tObj) {
                tObj.column = col;
                tObj.orden = newOrder * 1000; // Multiplicador para dejar espacio entre tarjetas si se quisiera
                tareasPayload.push({
                    id: tObj.id,
                    columna: mapColsToDb[col],
                    orden: tObj.orden
                });
                newOrder++;
            }
        });

        this.updateCounts();
        this.saveTasksToLocal();
        if (this.callbacks.updateFocusActiveGoal) this.callbacks.updateFocusActiveGoal();

        ApiService.moveTareasEnBloque(tareasPayload)
            .then(() => {
                // Éxito, se queda como está en el DOM
            })
            .catch(() => {
                this.callbacks.showToast('Error al mover la tarea. Volviendo a la posición original.', 'error');
                card.classList.add('kb-error-shake');
                setTimeout(() => {
                    card.classList.remove('kb-error-shake');
                    // Rollback local sin recargar app
                    this.tasks = oldTasksState;
                    this.saveTasksToLocal();
                    this.renderKanban();
                    if (this.callbacks.updateFocusActiveGoal) this.callbacks.updateFocusActiveGoal();
                }, 400); // Dar tiempo a la animación antes de recargar
            });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.kbcard:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    updateCounts() {
        ['pending', 'progress', 'done'].forEach(col => {
            const el = document.getElementById(`cnt-${col}`);
            if (el) el.textContent = this.tasks.filter(t => t.column === col).length;
        });
    },

    /* ==========================================================================
       CREACIÓN INLINE Y ELIMINACIÓN
       ========================================================================== */

    showInlineAddCardForm(col) {
        this.cancelAllInlineForms();
        const container = document.getElementById(`add-form-container-${col}`);
        const btnAdd    = document.getElementById(`btn-add-${col}`);
        if (!container || !btnAdd) return;
        btnAdd.style.display = 'none';

        const form = document.createElement('div');
        form.className = 'kb-add-form';
        form.id        = `inline-form-${col}`;
        form.innerHTML = `
          <textarea class="kb-add-inp" id="inline-inp-${col}" placeholder="Introduce el título de la tarea..." required></textarea>
          <div class="kb-add-btns">
            <button class="kb-add-btn-save" onclick="window.KanbanManager.saveInlineCard('${col}')">Añadir tarea</button>
            <button class="kb-add-btn-cancel" onclick="window.KanbanManager.cancelInlineAddCard('${col}')">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>
            </button>
          </div>
        `;
        container.appendChild(form);

        const textarea = form.querySelector('textarea');
        textarea.focus();
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.saveInlineCard(col); }
        });
        textarea.addEventListener('blur', () => {
            setTimeout(() => {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.closest(`#inline-form-${col}`)) return;
                if (textarea.value.trim()) this.saveInlineCard(col);
                else this.cancelInlineAddCard(col);
            }, 150);
        });
    },

    cancelInlineAddCard(col) {
        const form = document.getElementById(`inline-form-${col}`);
        if (form) form.remove();
        const btn = document.getElementById(`btn-add-${col}`);
        if (btn) btn.style.display = 'block';
    },

    cancelAllInlineForms() {
        ['pending', 'progress', 'done'].forEach(col => this.cancelInlineAddCard(col));
    },

    saveInlineCard(col) {
        const input = document.getElementById(`inline-inp-${col}`);
        if (!input) return;
        const title = input.value.trim();
        if (!title) { this.cancelInlineAddCard(col); return; }
        if (!this.selectedMateriaId) { this.callbacks.showToast('Elegí una materia primero', 'warn'); return; }

        this.cancelInlineAddCard(col);
        const mapColsToDb = { pending: 'pendiente', progress: 'progreso', done: 'finalizado' };

        ApiService.createTarea(this.selectedMateriaId, title, mapColsToDb[col])
            .then(() => {
                this.callbacks.reloadApp();
                this.callbacks.showToast('Tarea agregada exitosamente', 'success');
            })
            .catch(() => this.callbacks.showToast('Error creando tarea', 'error'));
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasksToLocal();
        this.renderKanban();

        ApiService.deleteTarea(id)
            .then(() => this.callbacks.showToast('Tarea eliminada', 'success'))
            .catch(() => this.callbacks.showToast('Error al eliminar la tarea en el servidor', 'error'));
    },

    /* ==========================================================================
       MODAL DE TAREA
       ========================================================================== */

    currentEditingTaskId: null,
    subtasksTempList: [],

    openTaskModal(id) {
        this.currentEditingTaskId = id;
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('task-modal-col-name').textContent = this.translateCol(task.column);
        document.getElementById('task-modal-title').value          = task.title;

        let dueStr = '';
        if (task.dueDate) {
            dueStr = task.dueDate.length === 10 ? task.dueDate + 'T00:00' : task.dueDate.substring(0, 16);
        }
        document.getElementById('task-modal-due').value  = dueStr;
        document.getElementById('task-modal-desc').value = task.description || '';

        this.subtasksTempList = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        this.renderModalSubtasks();
        this.hideSubtaskAddInput();
        document.getElementById('task-modal').classList.add('show');
    },

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('show');
        this.currentEditingTaskId = null;
    },

    translateCol(col) {
        const map = { pending: 'Pendiente', progress: 'En Curso', done: 'Finalizado' };
        return map[col] || col;
    },

    handleDateAutocomplete(input) {
        if (!input.value) return;
        const parts = input.value.split('T');
        if (parts.length === 2 && parts[1] === '00:00') {
            input.value = `${parts[0]}T23:59:00`;
        }
    },

    renderModalSubtasks() {
        const list = document.getElementById('task-modal-subtasks-list');
        if (!list) return;
        list.innerHTML = '';
        this.subtasksTempList.forEach((sub, index) => {
            const item = document.createElement('div');
            item.className = 'subtask-item';
            item.innerHTML = `
              <input type="checkbox" class="subtask-chk" ${sub.completed ? 'checked' : ''} onchange="window.KanbanManager.toggleSubtaskStatus(${index})">
              <span class="subtask-txt ${sub.completed ? 'done' : ''}" contenteditable="true" onblur="window.KanbanManager.saveSubtaskText(${index}, this)" onkeydown="window.KanbanManager.handleSubtaskEnter(event, ${index}, this)">${this.callbacks.escapeHTML(sub.text)}</span>
              <div class="subtask-del" title="Eliminar subtarea" onclick="window.KanbanManager.deleteSubtask(${index})">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
              </div>
            `;
            list.appendChild(item);
        });
    },

    toggleSubtaskStatus(index) {
        this.subtasksTempList[index].completed = !this.subtasksTempList[index].completed;
        const list = document.getElementById('task-modal-subtasks-list');
        if (list) {
            const items = list.children;
            if (items[index]) {
                const chk = items[index].querySelector('.subtask-chk');
                const txt = items[index].querySelector('.subtask-txt');
                if (chk) chk.checked = this.subtasksTempList[index].completed;
                if (txt) txt.classList.toggle('done', this.subtasksTempList[index].completed);
            }
        }
        this.saveTaskSubtasksStateOnly(index, 'update');
    },

    saveSubtaskText(index, element) {
        const newText = element.textContent.trim();
        if (newText) {
            this.subtasksTempList[index].text = newText;
        } else {
            element.textContent = this.subtasksTempList[index].text;
        }
        this.saveTaskSubtasksStateOnly(index, 'update');
    },

    handleSubtaskEnter(e, index, element) {
        if (e.key === 'Enter') { e.preventDefault(); element.blur(); }
    },

    deleteSubtask(index) {
        const sub = this.subtasksTempList[index];
        this.subtasksTempList.splice(index, 1);
        this.renderModalSubtasks();

        const task = this.tasks.find(t => t.id === this.currentEditingTaskId);
        if (task && sub.id && !String(sub.id).startsWith('s_')) {
            ApiService.deleteSubtarea(sub.id).catch(() => this.callbacks.reloadApp());
        }
        
        if (task) {
            task.subtasks = JSON.parse(JSON.stringify(this.subtasksTempList));
            this.saveTasksToLocal();
            this.renderKanban();
        }
    },

    showSubtaskAddInput() {
        document.getElementById('subtask-add-form').style.display  = 'flex';
        document.getElementById('btn-show-subtask-add').style.display = 'none';
        const input = document.getElementById('subtask-new-txt');
        input.value = '';
        input.focus();
        input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); this.saveNewSubtask(); } };
    },

    hideSubtaskAddInput() {
        document.getElementById('subtask-add-form').style.display      = 'none';
        document.getElementById('btn-show-subtask-add').style.display  = 'inline-flex';
    },

    saveNewSubtask() {
        const input = document.getElementById('subtask-new-txt');
        const text  = input.value.trim();
        if (!text) { this.hideSubtaskAddInput(); return; }
        
        const tempId = `s_${Date.now()}`;
        this.subtasksTempList.push({ id: tempId, text, completed: false });
        const newIndex = this.subtasksTempList.length - 1;
        this.renderModalSubtasks();
        this.hideSubtaskAddInput();
        this.saveTaskSubtasksStateOnly(newIndex, 'create');
    },

    saveTaskSubtasksStateOnly(index, action) {
        const task = this.tasks.find(t => t.id === this.currentEditingTaskId);
        if (!task) return;

        const sub = this.subtasksTempList[index];
        task.subtasks = JSON.parse(JSON.stringify(this.subtasksTempList));
        this.saveTasksToLocal();
        this.renderKanban();

        if (action === 'create') {
            ApiService.createSubtarea(task.id, sub.text)
                .then(res => {
                    sub.id = res.id;
                    task.subtasks[index].id = res.id;
                    this.saveTasksToLocal();
                })
                .catch(() => this.callbacks.reloadApp());
        } else if (action === 'update' && sub.id && !String(sub.id).startsWith('s_')) {
            ApiService.updateSubtarea(sub.id, { descripcion: sub.text, completado: sub.completed })
                .catch(() => this.callbacks.reloadApp());
        }
    },

    saveTaskDetails() {
        const task = this.tasks.find(t => t.id === this.currentEditingTaskId);
        if (!task) return;

        const newTitle = document.getElementById('task-modal-title').value.trim();
        if (!newTitle) { this.callbacks.showToast('El título de la tarea no puede estar vacío', 'error'); return; }

        const oldTitle   = task.title;
        const oldDueDate = task.dueDate;
        const oldDesc    = task.description;

        task.title       = newTitle;
        task.dueDate     = document.getElementById('task-modal-due').value;
        task.description = document.getElementById('task-modal-desc').value.trim();

        this.saveTasksToLocal();
        this.renderKanban();
        this.closeTaskModal();

        ApiService.updateTarea(task.id, { titulo: task.title, fecha_vencimiento: task.dueDate || null, descripcion: task.description })
            .then(() => {
                this.callbacks.reloadApp();
                this.callbacks.showToast('Tarea actualizada exitosamente', 'success');
            })
            .catch(() => {
                task.title       = oldTitle;
                task.dueDate     = oldDueDate;
                task.description = oldDesc;
                this.saveTasksToLocal();
                this.renderKanban();
                this.callbacks.showToast('Error actualizando tarea', 'error');
            });
    },

    deleteTaskFromModal() {
        if (!this.currentEditingTaskId) return;
        this.callbacks.openConfirm('¿Desea eliminar esta tarea de forma permanente?', () => {
            const id = this.currentEditingTaskId;
            this.closeTaskModal();
            this.deleteTask(id);
        });
    },

    bindEvents() {
        // Exponer KanbanManager al window para handlers en HTML inline de los modales/botones
        window.KanbanManager = this;
    }
};
