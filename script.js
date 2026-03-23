const STORAGE_KEY = 'todoPastelTasks';
const MAX_CHARS = 60;
const MAX_TASKS = 10;
const EXPIRE_MS = 24 * 60 * 60 * 1000;

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const charCount = document.getElementById('charCount');
const errorMsg = document.getElementById('errorMsg');
const taskCounter = document.getElementById('taskCounter');
const sectionTitle = document.getElementById('sectionTitle');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterButtons = document.querySelectorAll('.filter-btn');

let tasks = [];
let currentFilter = 'all';

function capitalizeFirstLetter(text) {
    if (!text) return '';
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    tasks = saved ? JSON.parse(saved) : [];
    removeExpiredTasks();
}

function removeExpiredTasks() {
    const now = Date.now();
    tasks = tasks.filter(task => now - task.createdAt < EXPIRE_MS);
    saveTasks();
}

function formatRemainingTime(createdAt) {
    const remaining = EXPIRE_MS - (Date.now() - createdAt);

    if (remaining <= 0) return 'Expira agora';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `Expira em ${hours}h ${minutes}min`;
}

function updateCounter() {
    const total = tasks.length;
    taskCounter.textContent = `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
}

function showError(message = '') {
    errorMsg.textContent = message;
}

function updateCharCount() {
    const length = taskInput.value.length;
    charCount.textContent = `${length}/${MAX_CHARS} caracteres`;

    if (length >= MAX_CHARS) {
        showError('Erro: não é mais possível escrever após 60 caracteres.');
    } else {
        showError('');
    }
}

function getFilteredTasks() {
    if (currentFilter === 'pending') {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === 'completed') {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function updateSectionTitle() {
    if (currentFilter === 'pending') {
        sectionTitle.textContent = 'Tarefas pendentes';
        return;
    }

    if (currentFilter === 'completed') {
        sectionTitle.textContent = 'Tarefas concluídas';
        return;
    }

    sectionTitle.textContent = 'Tarefas';
}

function addTask() {
    const rawText = taskInput.value;
    const formattedText = capitalizeFirstLetter(rawText);

    if (tasks.length >= MAX_TASKS) {
        showError('Você não pode adicionar mais de 10 tarefas.');
        return;
    }

    if (!formattedText) {
        showError('Digite uma tarefa antes de adicionar.');
        return;
    }

    if (formattedText.length > MAX_CHARS) {
        showError('A tarefa ultrapassou o limite de 60 caracteres.');
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        text: formattedText,
        completed: false,
        createdAt: Date.now(),
        editing: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    updateCharCount();
    showError('');
    taskInput.focus();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleComplete(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );

    saveTasks();
    renderTasks();
}

function startEdit(id) {
    tasks = tasks.map(task => ({
        ...task,
        editing: task.id === id
    }));

    renderTasks();
}

function cancelEdit(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, editing: false } : task
    );

    renderTasks();
}

function saveEdit(id, newValue) {
    const formattedText = capitalizeFirstLetter(newValue);

    if (!formattedText) {
        alert('A tarefa editada não pode ficar vazia.');
        return;
    }

    if (formattedText.length > MAX_CHARS) {
        alert('A tarefa editada não pode passar de 60 caracteres.');
        return;
    }

    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, text: formattedText, editing: false }
            : { ...task, editing: false }
    );

    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    const hasCompletedTasks = tasks.some(task => task.completed);

    if (!hasCompletedTasks) {
        showError('Não há tarefas concluídas para limpar.');
        return;
    }

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    showError('');
}

function renderTasks() {
    removeExpiredTasks();
    updateCounter();
    updateSectionTitle();

    const filteredTasks = getFilteredTasks();

    if (!filteredTasks.length) {
        taskList.innerHTML = '<div class="empty">Nenhuma tarefa encontrada.</div>';
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {
        const safeText = escapeHtml(task.text);

        return `
      <article class="task ${task.completed ? 'completed' : ''}">
        <div class="task-header">
          <button
            class="check-btn"
            onclick="toggleComplete('${task.id}')"
            aria-label="Concluir tarefa"
          ></button>

          <div class="task-main">
            <div class="task-title">${safeText}</div>

            <div class="task-meta">
              <span>${task.completed ? 'Concluída' : 'Pendente'}</span>
              <span>•</span>
              <span>${formatRemainingTime(task.createdAt)}</span>
            </div>

            ${task.editing ? `
              <div class="edit-wrap">
                <input
                  class="edit-input"
                  id="edit-${task.id}"
                  type="text"
                  maxlength="60"
                  value="${safeAttribute(task.text)}"
                />
                <div class="task-actions">
                  <button
                    class="action-btn save-btn"
                    onclick="saveEdit('${task.id}', document.getElementById('edit-${task.id}').value)"
                  >
                    Salvar
                  </button>
                  <button
                    class="action-btn cancel-btn"
                    onclick="cancelEdit('${task.id}')"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ` : `
              <div class="task-actions">
                <button
                  class="action-btn edit-btn"
                  onclick="startEdit('${task.id}')"
                >
                  Editar
                </button>
                <button
                  class="action-btn delete-btn"
                  onclick="deleteTask('${task.id}')"
                >
                  Remover
                </button>
              </div>
            `}
          </div>
        </div>
      </article>
    `;
    }).join('');
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeAttribute(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('input', () => {
    updateCharCount();

    if (taskInput.value.length === 1) {
        taskInput.value = taskInput.value.toUpperCase();
    }
});

taskInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

clearCompletedBtn.addEventListener('click', clearCompletedTasks);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        renderTasks();
    });
});

setInterval(() => {
    removeExpiredTasks();
    renderTasks();
}, 60000);

loadTasks();
updateCharCount();
renderTasks();

window.toggleComplete = toggleComplete;
window.deleteTask = deleteTask;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;