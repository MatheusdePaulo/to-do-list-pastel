const STORAGE_KEY = "todoPastelTasks";
const MAX_CHARS = 60;
const MAX_TASKS = 10;

const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const clearTasksBtn = document.getElementById("clearTasksBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const taskList = document.getElementById("taskList");
const charCount = document.getElementById("charCount");
const errorMsg = document.getElementById("errorMsg");
const taskCounter = document.getElementById("taskCounter");
const filterAllBtn = document.getElementById("filterAllBtn");
const filterPendingBtn = document.getElementById("filterPendingBtn");
const filterCompletedBtn = document.getElementById("filterCompletedBtn");

let tasks = [];
let draggedTaskId = null;
let currentFilter = "all";

function capitalizeFirstLetter(text) {
    if (!text) return "";
    const trimmed = text.trim().replace(/\s+/g, " ");
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeAttribute(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function showError(message = "") {
    errorMsg.textContent = message;
}

function updateCharCount() {
    const length = taskInput.value.length;
    charCount.textContent = `${length}/${MAX_CHARS} caracteres`;

    if (length >= MAX_CHARS) {
        showError("Erro: não é mais possível escrever após 60 caracteres.");
    } else {
        showError("");
    }
}

function updateCounter() {
    const total = tasks.length;
    taskCounter.textContent = `${total} ${total === 1 ? "tarefa" : "tarefas"}`;
}

function setFilter(filter) {
    currentFilter = filter;
    updateFilterButtons();
    renderTasks();
}

function updateFilterButtons() {
    filterAllBtn.classList.toggle("active", currentFilter === "all");
    filterPendingBtn.classList.toggle("active", currentFilter === "pending");
    filterCompletedBtn.classList.toggle("active", currentFilter === "completed");
}

function getFilteredTasks() {
    if (currentFilter === "pending") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function normalizeTask(task) {
    return {
        id: task?.id || generateId(),
        text: typeof task?.text === "string" ? task.text : "",
        completed: Boolean(task?.completed),
        completedAt: task?.completed ? (task?.completedAt || Date.now()) : null,
        editing: false
    };
}

function saveTasks() {
    const cleanTasks = tasks.map(task => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        completedAt: task.completedAt || null
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanTasks));
}

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        tasks = Array.isArray(parsed) ? parsed.map(normalizeTask) : [];
        rebuildTaskOrder();
    } catch {
        tasks = [];
        localStorage.removeItem(STORAGE_KEY);
    }
}

function rebuildTaskOrder() {
    const pending = tasks.filter(task => !task.completed);
    const completed = tasks
        .filter(task => task.completed)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    tasks = [...pending, ...completed];
    saveTasks();
}

function getFirstCompletedIndex() {
    return tasks.findIndex(task => task.completed);
}

function addTask() {
    const rawText = taskInput.value;
    const formattedText = capitalizeFirstLetter(rawText);

    if (!formattedText) {
        showError("Digite uma tarefa antes de adicionar.");
        return;
    }

    if (formattedText.length > MAX_CHARS) {
        showError("A tarefa ultrapassou o limite de 60 caracteres.");
        return;
    }

    if (tasks.length >= MAX_TASKS) {
        showError("Você não pode adicionar mais de 10 tarefas.");
        return;
    }

    const newTask = {
        id: generateId(),
        text: formattedText,
        completed: false,
        completedAt: null,
        editing: false
    };

    const firstCompletedIndex = getFirstCompletedIndex();

    if (firstCompletedIndex === -1) {
        tasks.push(newTask);
    } else {
        tasks.splice(firstCompletedIndex, 0, newTask);
    }

    saveTasks();
    renderTasks();

    taskInput.value = "";
    updateCharCount();
    showError("");
    taskInput.focus();
}

function deleteTask(id) {
    const confirmed = confirm("Tem certeza que deseja remover esta tarefa?");
    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function clearTasks() {
    if (!tasks.length) {
        alert("Não há tarefas para limpar.");
        return;
    }

    const confirmed = confirm("Tem certeza que deseja limpar todas as tarefas?");
    if (!confirmed) return;

    tasks = [];
    saveTasks();
    renderTasks();
}

function clearCompletedTasks() {
    const hasCompletedTasks = tasks.some(task => task.completed);

    if (!hasCompletedTasks) {
        alert("Não há tarefas concluídas para limpar.");
        return;
    }

    const confirmed = confirm("Tem certeza que deseja remover todas as tarefas concluídas?");
    if (!confirmed) return;

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

function toggleComplete(id) {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return;

    const task = tasks[index];
    tasks.splice(index, 1);

    if (!task.completed) {
        task.completed = true;
        task.completedAt = Date.now();
        task.editing = false;
        tasks.push(task);
    } else {
        task.completed = false;
        task.completedAt = null;
        task.editing = false;

        const firstCompletedIndex = getFirstCompletedIndex();

        if (firstCompletedIndex === -1) {
            tasks.push(task);
        } else {
            tasks.splice(firstCompletedIndex, 0, task);
        }
    }

    saveTasks();
    renderTasks();
}

function moveTask(id, direction) {
    const visibleTasks = getFilteredTasks();
    const visibleIndex = visibleTasks.findIndex(task => task.id === id);
    if (visibleIndex === -1) return;

    const targetVisibleIndex = direction === "up" ? visibleIndex - 1 : visibleIndex + 1;
    if (targetVisibleIndex < 0 || targetVisibleIndex >= visibleTasks.length) return;

    const currentTask = visibleTasks[visibleIndex];
    const targetTask = visibleTasks[targetVisibleIndex];

    if (currentTask.completed !== targetTask.completed) return;

    const fromIndex = tasks.findIndex(task => task.id === currentTask.id);
    const toIndex = tasks.findIndex(task => task.id === targetTask.id);

    if (fromIndex === -1 || toIndex === -1) return;

    [tasks[fromIndex], tasks[toIndex]] = [tasks[toIndex], tasks[fromIndex]];

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
        alert("A tarefa editada não pode ficar vazia.");
        return;
    }

    if (formattedText.length > MAX_CHARS) {
        alert("A tarefa editada não pode passar de 60 caracteres.");
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

function formatCompletionTime(timestamp) {
    if (!timestamp) return "";

    return new Date(timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function handleDragStart(event, id) {
    draggedTaskId = id;
    event.currentTarget.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");

    document.querySelectorAll(".task").forEach(taskEl => {
        taskEl.classList.remove("drag-over");
        taskEl.classList.remove("drop-blocked");
    });

    draggedTaskId = null;
}

function handleDragOver(event, targetId) {
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const draggedTask = tasks.find(task => task.id === draggedTaskId);
    const targetTask = tasks.find(task => task.id === targetId);

    if (!draggedTask || !targetTask) return;
    if (draggedTask.completed !== targetTask.completed) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
}

function handleDragEnter(event, targetId) {
    if (!draggedTaskId || draggedTaskId === targetId) return;

    const draggedTask = tasks.find(task => task.id === draggedTaskId);
    const targetTask = tasks.find(task => task.id === targetId);

    if (!draggedTask || !targetTask) return;

    if (draggedTask.completed !== targetTask.completed) {
        event.currentTarget.classList.add("drop-blocked");
        return;
    }

    event.currentTarget.classList.remove("drop-blocked");
    event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
    event.currentTarget.classList.remove("drop-blocked");
}

function handleDrop(event, targetId) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    event.currentTarget.classList.remove("drop-blocked");

    if (!draggedTaskId || draggedTaskId === targetId) return;

    const fromIndex = tasks.findIndex(task => task.id === draggedTaskId);
    const toIndex = tasks.findIndex(task => task.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const draggedTask = tasks[fromIndex];
    const targetTask = tasks[toIndex];

    if (draggedTask.completed !== targetTask.completed) return;

    const [removedTask] = tasks.splice(fromIndex, 1);
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    tasks.splice(adjustedToIndex, 0, removedTask);

    saveTasks();
    renderTasks();
}

function renderTasks() {
    updateCounter();
    updateFilterButtons();

    const visibleTasks = getFilteredTasks();

    if (!visibleTasks.length) {
        let emptyMessage = "Nenhuma tarefa no momento.";

        if (currentFilter === "pending") {
            emptyMessage = "Nenhuma tarefa pendente.";
        } else if (currentFilter === "completed") {
            emptyMessage = "Nenhuma tarefa concluída.";
        }

        taskList.innerHTML = `<div class="empty">${emptyMessage}</div>`;
        return;
    }

    taskList.innerHTML = visibleTasks.map((task, index) => {
        const safeText = escapeHtml(task.text);
        const previousVisibleTask = visibleTasks[index - 1];
        const nextVisibleTask = visibleTasks[index + 1];

        const canMoveUp =
            Boolean(previousVisibleTask) &&
            previousVisibleTask.completed === task.completed;

        const canMoveDown =
            Boolean(nextVisibleTask) &&
            nextVisibleTask.completed === task.completed;

        const metaHtml = task.completed
            ? `<span>Concluída às ${formatCompletionTime(task.completedAt)}</span>`
            : `<span>Pendente</span>`;

        return `
      <article
        class="task ${task.completed ? "completed" : ""}"
        draggable="true"
        ondragstart="handleDragStart(event, '${task.id}')"
        ondragend="handleDragEnd(event)"
        ondragover="handleDragOver(event, '${task.id}')"
        ondragenter="handleDragEnter(event, '${task.id}')"
        ondragleave="handleDragLeave(event)"
        ondrop="handleDrop(event, '${task.id}')"
      >
        <div class="task-header">
          <button
            class="check-btn"
            onclick="toggleComplete('${task.id}')"
            aria-label="${task.completed ? "Desmarcar tarefa" : "Concluir tarefa"}"
            title="${task.completed ? "Desmarcar tarefa" : "Concluir tarefa"}"
          ></button>

          <div class="task-main">
            <div class="task-title">${safeText}</div>

            <div class="task-meta">
              ${metaHtml}
            </div>

            ${
            task.editing
                ? `
                <div class="edit-wrap">
                  <input
                    class="edit-input"
                    id="edit-${task.id}"
                    type="text"
                    maxlength="60"
                    value="${safeAttribute(task.text)}"
                  />
                  <div class="task-actions">
                    <button class="action-btn save-btn" onclick="saveEdit('${task.id}', document.getElementById('edit-${task.id}').value)">Salvar</button>
                    <button class="action-btn cancel-btn" onclick="cancelEdit('${task.id}')">Cancelar</button>
                  </div>
                </div>
              `
                : `
                <div class="task-actions">
                  <button class="action-btn move-btn" onclick="moveTask('${task.id}', 'up')" ${canMoveUp ? "" : "disabled"}>↑</button>
                  <button class="action-btn move-btn" onclick="moveTask('${task.id}', 'down')" ${canMoveDown ? "" : "disabled"}>↓</button>
                  <button class="action-btn edit-btn" onclick="startEdit('${task.id}')">Editar</button>
                  <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')">Remover</button>
                </div>
              `
        }
          </div>
        </div>
      </article>
    `;
    }).join("");
}

addTaskBtn.addEventListener("click", addTask);
clearTasksBtn.addEventListener("click", clearTasks);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);
filterAllBtn.addEventListener("click", () => setFilter("all"));
filterPendingBtn.addEventListener("click", () => setFilter("pending"));
filterCompletedBtn.addEventListener("click", () => setFilter("completed"));

taskInput.addEventListener("input", () => {
    updateCharCount();

    if (taskInput.value.length === 1) {
        taskInput.value = taskInput.value.toUpperCase();
    }
});

taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTask();
});

loadTasks();
updateCharCount();
renderTasks();

window.toggleComplete = toggleComplete;
window.deleteTask = deleteTask;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;
window.moveTask = moveTask;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;