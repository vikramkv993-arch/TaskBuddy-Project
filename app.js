const STORAGE_KEY = "taskbuddy.tasks.v1";

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const categorySelect = document.querySelector("#category-select");
const taskList = document.querySelector("#task-list");
const countLabel = document.querySelector("#progress-count");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const clearButton = document.querySelector("#clear-button");
const storageNotice = document.querySelector("#storage-notice");

let tasks = loadTasks();

function showStorageNotice(message) {
  storageNotice.textContent = message;
  storageNotice.hidden = !message;
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

    if (!Array.isArray(parsedTasks)) {
      showStorageNotice("Saved tasks could not be read. Add a task to start a fresh list.");
      return [];
    }

    const validTasks = parsedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean" &&
        typeof task.priority === "string" &&
        typeof task.category === "string",
    );

    if (validTasks.length !== parsedTasks.length) {
      showStorageNotice("Some saved tasks could not be read and were skipped.");
    }

    return validTasks;
  } catch (error) {
    console.error("Could not load saved TaskBuddy tasks.", error);
    showStorageNotice("Saved tasks could not be loaded. Your new tasks may not be saved.");
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    showStorageNotice("");
  } catch (error) {
    console.error("Could not save TaskBuddy tasks.", error);
    showStorageNotice("Your changes could not be saved in this browser.");
  }
}

function createTask(title, priority, category) {
  return {
    id: crypto.randomUUID(),
    title,
    priority,
    category,
    completed: false,
  };
}

function renderTask(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-complete" : ""}`;
  item.dataset.taskId = task.id;

  const copy = document.createElement("div");
  copy.className = "task-copy";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = `${task.title} (${task.priority}, ${task.category})`;
  copy.append(title);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-action complete-action";
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.textContent = task.completed ? "Undo" : "Complete";

  const deleteButton = document.createElement("button");
  deleteButton.className = "task-action delete-action";
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete: ${task.title}`);

  actions.append(toggleButton, deleteButton);
  item.append(copy, actions);
  return item;
}

function render() {
  const completedCount = tasks.filter((task) => task.completed).length;
  const percentage = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  taskList.replaceChildren(...tasks.map(renderTask));
  clearButton.hidden = tasks.length === 0;
  countLabel.textContent = `${completedCount} of ${tasks.length} ${
    tasks.length === 1 ? "task" : "tasks"
  } completed`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
  progressFill.style.width = `${percentage}%`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    taskInput.focus();
    return;
  }

  tasks.unshift(
    createTask(title, prioritySelect.value, categorySelect.value),
  );
  saveTasks();
  render();
  form.reset();
  taskInput.focus();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const item = button?.closest(".task-item");

  if (!button || !item) {
    return;
  }

  const taskId = item.dataset.taskId;

  if (button.dataset.action === "toggle") {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
  } else if (button.dataset.action === "delete") {
    tasks = tasks.filter((task) => task.id !== taskId);
  }

  saveTasks();
  render();
});

clearButton.addEventListener("click", () => {
  tasks = [];
  saveTasks();
  render();
});

render();
