// Application State
let currentProjectId = null;
let currentTaskId = null;
let projects = [];
let tasks = [];
let phases = [];
let teamMembers = [];
let dependencies = [];
let milestones = [];
let assignments = [];

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/api${endpoint}`, options);
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.error || 'API Error');
    }
    
    return result;
}

// Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal Functions
function openModal(id) {
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close modal on click outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Navigation
function updateSidebarActive(section) {
    // Remove active from all sidebar links
    document.querySelectorAll('.sidebar nav a, .sidebar .mt-8 a').forEach(el => {
        el.classList.remove('active', 'text-white');
        el.classList.add('text-gray-300');
    });
    
    if (section === 'projects') {
        const projectLink = document.querySelector('.sidebar-project-link');
        if (projectLink) {
            projectLink.classList.add('active', 'text-white');
            projectLink.classList.remove('text-gray-300');
        }
        document.getElementById('sidebar-features').style.display = 'none';
    } else {
        const featuresSection = document.getElementById('sidebar-features');
        if (featuresSection) {
            featuresSection.style.display = 'block';
        }
        const sidebarMap = {
            'tasks': 'Manajemen Tugas',
            'phases': 'Fase SDLC',
            'dependencies': 'Ketergantungan',
            'team': 'Tim & Resource',
            'gantt': 'Gantt Chart',
            'milestones': 'Milestones'
        };
        const sidebarText = sidebarMap[section];
        if (sidebarText) {
            document.querySelectorAll('.sidebar-link').forEach(el => {
                if (el.textContent.trim() === sidebarText) {
                    el.classList.add('active', 'text-white');
                    el.classList.remove('text-gray-300');
                } else {
                    el.classList.remove('active', 'text-white');
                    el.classList.add('text-gray-300');
                }
            });
        }
    }
}

function showProjects() {
    currentProjectId = null;
    document.getElementById('projects-section').style.display = 'block';
    document.getElementById('project-detail-section').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'Selamat Datang';
    document.getElementById('pageSubtitle').textContent = 'Kelola proyek dan tugas Anda';
    updateSidebarActive('projects');
    loadProjects();
}

function loadProjects() {
    apiCall('/projects')
        .then(res => {
            projects = res.data;
            renderProjects();
        })
        .catch(err => showToast(err.message, 'error'));
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    
    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full empty-state">
                <i class="fas fa-folder-open"></i>
                <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada proyek</h3>
                <p class="text-gray-500 mt-2">Klik tombol "Proyek Baru" untuk membuat proyek pertama Anda</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = projects.map(project => {
        const progress = project.progress || { completed: 0, total: 0, averageProgress: 0 };
        const percentage = project.timeline ? Math.round(progress.averageProgress) : 0;
        
        return `
            <div class="card p-6 cursor-pointer hover:shadow-lg transition" onclick="selectProject(${project.id})">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-lg font-bold text-gray-900">${escapeHtml(project.name)}</h3>
                    <span class="badge ${percentage >= 100 ? 'badge-completed' : percentage > 0 ? 'badge-in-progress' : 'badge-pending'}">
                        ${percentage}%
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(project.description || 'Tidak ada deskripsi')}</p>
                
                <div class="flex items-center text-sm text-gray-500 mb-3">
                    <i class="fas fa-building mr-1"></i>
                    <span>${escapeHtml(project.organization || 'N/A')}</span>
                </div>
                
                <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center text-gray-500">
                        <i class="far fa-calendar-alt mr-1"></i>
                        <span>${formatDate(project.start_date)}</span>
                    </div>
                    <div class="flex items-center text-gray-500">
                        <i class="far fa-calendar-check mr-1"></i>
                        <span>${formatDate(project.end_date)}</span>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                        ${progress.completed}/${progress.total} tugas selesai
                    </div>
                    <div class="progress-bar w-20">
                        <div class="progress-fill bg-blue-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function selectProject(id) {
    currentProjectId = id;
    document.getElementById('projects-section').style.display = 'none';
    document.getElementById('project-detail-section').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Detail Proyek';
    document.getElementById('pageSubtitle').textContent = '';
    updateSidebarActive('tasks');
    loadProjectDetail(id);
}

// Project Functions
async function openCreateProjectModal() {
    document.getElementById('project-name-input').value = '';
    document.getElementById('project-desc-input').value = '';
    document.getElementById('project-org-input').value = '';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('project-start-input').value = today;
    document.getElementById('project-end-input').value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    openModal('createProjectModal');
}

async function createProject() {
    const name = document.getElementById('project-name-input').value.trim();
    if (!name) {
        showToast('Nama proyek wajib diisi!', 'error');
        return;
    }
    
    const start = document.getElementById('project-start-input').value;
    const end = document.getElementById('project-end-input').value;
    if (!start || !end) {
        showToast('Tanggal mulai dan selesai wajib diisi!', 'error');
        return;
    }
    if (new Date(end) <= new Date(start)) {
        showToast('Tanggal selesai harus setelah tanggal mulai!', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/projects', 'POST', {
            name,
            description: document.getElementById('project-desc-input').value.trim(),
            organization: document.getElementById('project-org-input').value.trim(),
            start_date: start,
            end_date: end
        });
        
        closeModal('createProjectModal');
        showToast('Proyek berhasil dibuat!', 'success');
        showProjects();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function editProject() {
    const project = await apiCall(`/projects/${currentProjectId}`);
    
    document.getElementById('edit-project-id').value = currentProjectId;
    document.getElementById('edit-project-name').value = project.data.name;
    document.getElementById('edit-project-desc').value = project.data.description || '';
    document.getElementById('edit-project-org').value = project.data.organization || '';
    document.getElementById('edit-project-start').value = project.data.start_date;
    document.getElementById('edit-project-end').value = project.data.end_date;
    
    openModal('editProjectModal');
}

async function saveProjectEdit() {
    const id = document.getElementById('edit-project-id').value;
    const name = document.getElementById('edit-project-name').value.trim();
    
    if (!name) {
        showToast('Nama proyek wajib diisi!', 'error');
        return;
    }
    
    try {
        await apiCall(`/projects/${id}`, 'PUT', {
            name,
            description: document.getElementById('edit-project-desc').value.trim(),
            organization: document.getElementById('edit-project-org').value.trim(),
            start_date: document.getElementById('edit-project-start').value,
            end_date: document.getElementById('edit-project-end').value
        });
        
        closeModal('editProjectModal');
        showToast('Proyek berhasil diperbarui!', 'success');
        loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteProject() {
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

async function confirmDeleteProject() {
    try {
        await apiCall(`/projects/${currentProjectId}`, 'DELETE');
        closeModal('deleteConfirmModal');
        showToast('Proyek berhasil dihapus!', 'success');
        showProjects();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadProjectDetail(id) {
    try {
        const project = await apiCall(`/projects/${id}`);
        const data = project.data;
        
        document.getElementById('project-name').textContent = data.name;
        document.getElementById('project-description').textContent = data.description || 'Tidak ada deskripsi';
        document.getElementById('project-organization').textContent = data.organization || 'N/A';
        document.getElementById('project-start').textContent = formatDate(data.start_date);
        document.getElementById('project-end').textContent = formatDate(data.end_date);
        
        if (data.timeline) {
            const diff = Math.ceil((new Date(data.timeline.latestEnd) - new Date(data.timeline.earliestStart)) / (1000 * 60 * 60 * 24));
            document.getElementById('project-duration').textContent = `${diff} hari kerja`;
        } else {
            document.getElementById('project-duration').textContent = '-';
        }
        
        const progress = data.progress || { completed: 0, total: 0, averageProgress: 0 };
        const percentage = Math.round(progress.averageProgress);
        document.getElementById('project-progress-percent').textContent = `${percentage}%`;
        document.getElementById('project-progress-bar').style.width = `${percentage}%`;
        document.getElementById('tasks-completed').textContent = progress.completed;
        document.getElementById('tasks-total').textContent = progress.total;
        
        await loadPhases();
        await loadTasks();
        await loadTeamMembers();
        await loadMilestones();
        await loadGanttChart();
        await loadDependencies();
        await loadResourceAllocation();
        
        switchTab('tasks');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Tab Switching
function switchTab(tabName, event) {
    const tabs = ['tasks', 'phases', 'dependencies', 'team', 'gantt', 'milestones'];
    const tabElements = {
        tasks: document.getElementById('tab-tasks'),
        phases: document.getElementById('tab-phases'),
        dependencies: document.getElementById('tab-dependencies'),
        team: document.getElementById('tab-team'),
        gantt: document.getElementById('tab-gantt'),
        milestones: document.getElementById('tab-milestones')
    };
    
    tabs.forEach(t => {
        const tabEl = tabElements[t];
        tabEl.style.display = t === tabName ? 'block' : 'none';
    });
    
    // Update tab active state
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar nav a, .sidebar .mt-8 a').forEach(el => el.classList.remove('active'));
    const sidebarMap = {
        'tasks': 'Manajemen Tugas',
        'dependencies': 'Ketergantungan',
        'team': 'Tim & Resource',
        'gantt': 'Gantt Chart',
        'milestones': 'Milestones',
        'phases': 'Fase SDLC'
    };
    const sidebarText = sidebarMap[tabName];
    if (sidebarText) {
        document.querySelectorAll('.sidebar a').forEach(el => {
            if (el.textContent.trim() === sidebarText) {
                el.classList.add('active');
            }
        });
    }
    
    if (tabName === 'tasks') loadTasks();
    if (tabName === 'dependencies') loadDependencies();
    if (tabName === 'team') loadResourceAllocation();
    if (tabName === 'gantt') loadGanttChart();
    if (tabName === 'milestones') loadMilestones();
}

// Phase Functions
async function loadPhases() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/phases`);
        phases = res.data;
    } catch (err) {
        phases = [];
    }
}

// Task Functions
async function loadTasks() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/tasks`);
        tasks = res.data;
        renderTasks();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderTasks() {
    const container = document.getElementById('tab-tasks');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-list-check"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada tugas</h3>
                    <p class="text-gray-500 mt-2">Klik tombol "Tambah Tugas" untuk membuat tugas baru</p>
                    <button onclick="openCreateTaskModal()" class="btn btn-primary mt-4">
                        <i class="fas fa-plus mr-2"></i> Tambah Tugas
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const priorityColors = {
        High: 'text-red-600 bg-red-50 border-red-200',
        Normal: 'text-amber-600 bg-amber-50 border-amber-200',
        Low: 'text-green-600 bg-green-50 border-green-200'
    };
    
    const statusColors = {
        'Pending': 'badge-pending',
        'In Progress': 'badge-in-progress',
        'Completed': 'badge-completed'
    };
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800">Daftar Tugas (${tasks.length})</h3>
            <button onclick="openCreateTaskModal()" class="btn btn-primary">
                <i class="fas fa-plus mr-2"></i> Tambah Tugas
            </button>
        </div>
        <div class="card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200">
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tugas</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fase</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioritas</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${tasks.map(task => `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-4 py-4">
                                    <div class="font-medium text-gray-900">${escapeHtml(task.name)}</div>
                                    ${task.description ? `<div class="text-xs text-gray-500 mt-1 line-clamp-1">${escapeHtml(task.description)}</div>` : ''}
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${task.phase_name ? escapeHtml(task.phase_name) : '-'}
                                </td>
                                <td class="px-4 py-4">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[task.priority] || priorityColors.Normal}">
                                        ${task.priority}
                                    </span>
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${task.duration_days || 1} hari
                                </td>
                                <td class="px-4 py-4">
                                    <span class="badge ${statusColors[task.status] || 'badge-pending'}">
                                        ${task.status}
                                    </span>
                                </td>
                                <td class="px-4 py-4 w-32">
                                    <div class="flex items-center gap-2">
                                        <div class="progress-bar flex-1" style="height: 6px;">
                                            <div class="progress-fill ${task.status === 'Completed' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'}" 
                                                 style="width: ${task.progress || 0}%"></div>
                                        </div>
                                        <span class="text-xs text-gray-500 w-8">${task.progress || 0}%</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="flex gap-1">
                                        <button onclick="editTask(${task.id})" class="btn btn-secondary btn-sm" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteTask(${task.id})" class="btn btn-danger btn-sm" title="Hapus">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button onclick="openAssignResourceModal(${task.id})" class="btn btn-secondary btn-sm" title="Alokasi Resource">
                                            <i class="fas fa-user-check"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function openCreateTaskModal() {
    // Populate phase dropdown
    const phaseSelect = document.getElementById('task-phase-select');
    phaseSelect.innerHTML = '<option value="">Pilih fase (opsional)</option>';
    phases.forEach(phase => {
        phaseSelect.innerHTML += `<option value="${phase.id}">${escapeHtml(phase.name)}</option>`;
    });
    
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-desc-input').value = '';
    document.getElementById('task-priority-select').value = 'Normal';
    document.getElementById('task-duration-input').value = 1;
    document.getElementById('task-status-select').value = 'Pending';
    document.getElementById('task-start-input').value = '';
    document.getElementById('task-end-input').value = '';
    document.getElementById('task-progress-input').value = 0;
    document.getElementById('task-progress-value').textContent = '0%';
    
    document.getElementById('task-progress-input').addEventListener('input', function() {
        document.getElementById('task-progress-value').textContent = `${this.value}%`;
    });
    
    openModal('createTaskModal');
}

async function createTask() {
    const name = document.getElementById('task-name-input').value.trim();
    if (!name) {
        showToast('Nama tugas wajib diisi!', 'error');
        return;
    }
    
    const start = document.getElementById('task-start-input').value;
    const end = document.getElementById('task-end-input').value;
    if ((start || end) && (!start || !end)) {
        showToast('Tanggal mulai dan selesai harus diisi bersamaan!', 'error');
        return;
    }
    
    try {
        const result = await apiCall('/tasks', 'POST', {
            project_id: currentProjectId,
            phase_id: document.getElementById('task-phase-select').value || null,
            name,
            description: document.getElementById('task-desc-input').value.trim(),
            duration_days: parseInt(document.getElementById('task-duration-input').value) || 1,
            priority: document.getElementById('task-priority-select').value,
            status: document.getElementById('task-status-select').value,
            start_date: start || null,
            end_date: end || null,
            progress: parseInt(document.getElementById('task-progress-input').value) || 0
        });
        
        closeModal('createTaskModal');
        showToast('Tugas berhasil ditambahkan!', 'success');
        loadTasks();
        loadGanttChart();
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function editTask(id) {
    try {
        const task = await apiCall(`/tasks/${id}`);
        const data = task.data;
        
        currentTaskId = id;
        
        const phaseSelect = document.getElementById('task-phase-select');
        phaseSelect.innerHTML = '<option value="">Pilih fase (opsional)</option>';
        phases.forEach(phase => {
            phaseSelect.innerHTML += `<option value="${phase.id}" ${phase.id === data.phase_id ? 'selected' : ''}>${escapeHtml(phase.name)}</option>`;
        });
        
        document.getElementById('task-name-input').value = data.name;
        document.getElementById('task-desc-input').value = data.description || '';
        document.getElementById('task-priority-select').value = data.priority;
        document.getElementById('task-duration-input').value = data.duration_days || 1;
        document.getElementById('task-status-select').value = data.status;
        document.getElementById('task-start-input').value = data.start_date || '';
        document.getElementById('task-end-input').value = data.end_date || '';
        document.getElementById('task-progress-input').value = data.progress || 0;
        document.getElementById('task-progress-value').textContent = `${(data.progress || 0)}%`;
        
        document.getElementById('task-progress-input').addEventListener('input', function() {
            document.getElementById('task-progress-value').textContent = `${this.value}%`;
        });
        
        openModal('createTaskModal');
        
        // Change button to update
        const btn = document.querySelector('#createTaskModal .modal-footer button:last-child');
        btn.innerHTML = '<i class="fas fa-save mr-2"></i> Update Tugas';
        btn.onclick = updateTask;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function updateTask() {
    const name = document.getElementById('task-name-input').value.trim();
    if (!name) {
        showToast('Nama tugas wajib diisi!', 'error');
        return;
    }
    
    try {
        await apiCall(`/tasks/${currentTaskId}`, 'PUT', {
            phase_id: document.getElementById('task-phase-select').value || null,
            name,
            description: document.getElementById('task-desc-input').value.trim(),
            duration_days: parseInt(document.getElementById('task-duration-input').value) || 1,
            priority: document.getElementById('task-priority-select').value,
            status: document.getElementById('task-status-select').value,
            start_date: document.getElementById('task-start-input').value || null,
            end_date: document.getElementById('task-end-input').value || null,
            progress: parseInt(document.getElementById('task-progress-input').value) || 0
        });
        
        closeModal('createTaskModal');
        showToast('Tugas berhasil diperbarui!', 'success');
        loadTasks();
        loadGanttChart();
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteTask(id) {
    try {
        await apiCall(`/tasks/${id}`, 'DELETE');
        showToast('Tugas berhasil dihapus!', 'success');
        loadTasks();
        loadGanttChart();
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Dependency Functions
async function loadDependencies() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/tasks`);
        const allTasksWithDeps = res.data;
        
        dependencies = [];
        allTasksWithDeps.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(dep => {
                    dependencies.push({
                        id: null, // Will be fetched if needed
                        task_id: task.id,
                        task_name: task.name,
                        predecessor_id: dep.predecessor_id,
                        predecessor_name: '',
                        dependency_type: dep.dependency_type,
                        lag_days: dep.lag_days
                    });
                });
            }
        });
        
        // Get predecessor names
        for (const dep of dependencies) {
            try {
                const predTask = await apiCall(`/tasks/${dep.predecessor_id}`);
                dep.predecessor_name = predTask.data.name;
            } catch {
                dep.predecessor_name = 'Tugas tidak ditemukan';
            }
        }
        
        renderDependencies();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderDependencies() {
    const container = document.getElementById('tab-dependencies');
    
    if (dependencies.length === 0) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-link"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada ketergantungan</h3>
                    <p class="text-gray-500 mt-2">Hubungkan tugas-tugas untuk membuat dependencies</p>
                    <button onclick="openCreateDependencyModal()" class="btn btn-primary mt-4">
                        <i class="fas fa-link mr-2"></i> Tambah Ketergantungan
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800">Ketergantungan Tugas (${dependencies.length})</h3>
            <button onclick="openCreateDependencyModal()" class="btn btn-primary">
                <i class="fas fa-link mr-2"></i> Tambah Ketergantungan
            </button>
        </div>
        <div class="card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200">
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tugas Berikut</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tugas Pendahulu</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Hubungan</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jeda (hari)</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${dependencies.map((dep, index) => `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-4 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <i class="fas fa-arrow-right text-xs"></i>
                                        </div>
                                        <span class="font-medium text-gray-900">${escapeHtml(dep.task_name)}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                            <i class="fas fa-arrow-left text-xs"></i>
                                        </div>
                                        <span class="text-gray-700">${escapeHtml(dep.predecessor_name)}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <select class="input w-40 text-sm" onchange="updateDependencyType(${index}, this.value)">
                                        <option value="Finish-to-Start" ${dep.dependency_type === 'Finish-to-Start' ? 'selected' : ''}>Finish-to-Start</option>
                                        <option value="Start-to-Start" ${dep.dependency_type === 'Start-to-Start' ? 'selected' : ''}>Start-to-Start</option>
                                        <option value="Finish-to-Finish" ${dep.dependency_type === 'Finish-to-Finish' ? 'selected' : ''}>Finish-to-Finish</option>
                                        <option value="Start-to-Finish" ${dep.dependency_type === 'Start-to-Finish' ? 'selected' : ''}>Start-to-Finish</option>
                                    </select>
                                </td>
                                <td class="px-4 py-4">
                                    <input type="number" class="input w-20 text-sm" value="${dep.lag_days}" min="0" 
                                           onchange="updateDependencyLag(${index}, this.value)">
                                </td>
                                <td class="px-4 py-4">
                                    <button onclick="removeDependency(${index})" class="btn btn-danger btn-sm">
                                        <i class="fas fa-trash mr-1"></i> Hapus
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function openCreateDependencyModal() {
    // Populate task dropdown
    const taskSelect = document.getElementById('dep-task-select');
    taskSelect.innerHTML = '<option value="">Pilih tugas yang bergantung</option>';
    tasks.forEach(task => {
        taskSelect.innerHTML += `<option value="${task.id}">${escapeHtml(task.name)}</option>`;
    });
    
    // Populate predecessor dropdown
    const predSelect = document.getElementById('dep-predecessor-select');
    predSelect.innerHTML = '<option value="">Pilih tugas pendahulu</option>';
    tasks.forEach(task => {
        predSelect.innerHTML += `<option value="${task.id}">${escapeHtml(task.name)}</option>`;
    });
    
    document.getElementById('dep-type-select').value = 'Finish-to-Start';
    document.getElementById('dep-lag-input').value = 0;
    
    openModal('createDependencyModal');
}

async function createDependency() {
    const taskId = document.getElementById('dep-task-select').value;
    const predecessorId = document.getElementById('dep-predecessor-select').value;
    
    if (!taskId || !predecessorId) {
        showToast('Tugas dan tugas pendahulu wajib dipilih!', 'error');
        return;
    }
    
    if (taskId === predecessorId) {
        showToast('Tugas tidak boleh bergantung pada dirinya sendiri!', 'error');
        return;
    }
    
    try {
        await apiCall('/dependencies', 'POST', {
            task_id: parseInt(taskId),
            predecessor_id: parseInt(predecessorId),
            dependency_type: document.getElementById('dep-type-select').value,
            lag_days: parseInt(document.getElementById('dep-lag-input').value) || 0
        });
        
        closeModal('createDependencyModal');
        showToast('Ketergantungan berhasil ditambahkan!', 'success');
        loadDependencies();
        loadGanttChart();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function removeDependency(index) {
    const dep = dependencies[index];
    if (confirm(`Hapus ketergantungan antara "${dep.task_name}" dan "${dep.predecessor_name}"?`)) {
        dependencies.splice(index, 1);
        showToast('Ketergantungan dihapus!', 'info');
        renderDependencies();
    }
}

function updateDependencyType(index, type) {
    dependencies[index].dependency_type = type;
    showToast('Jenis hubungan diperbarui!', 'info');
}

function updateDependencyLag(index, lag) {
    dependencies[index].lag_days = parseInt(lag) || 0;
    showToast('Jeda diperbarui!', 'info');
}

// Team Member Functions
async function loadTeamMembers() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/team`);
        teamMembers = res.data;
    } catch (err) {
        teamMembers = [];
    }
}

async function openCreateMemberModal() {
    document.getElementById('member-name-input').value = '';
    document.getElementById('member-role-select').value = '';
    document.getElementById('member-email-input').value = '';
    document.getElementById('member-phone-input').value = '';
    document.getElementById('member-salary-input').value = '';
    
    openModal('createMemberModal');
}

async function createTeamMember() {
    const name = document.getElementById('member-name-input').value.trim();
    if (!name) {
        showToast('Nama anggota tim wajib diisi!', 'error');
        return;
    }
    
    const role = document.getElementById('member-role-select').value;
    if (!role) {
        showToast('Peran/posisi wajib dipilih!', 'error');
        return;
    }
    
    try {
        await apiCall('/team', 'POST', {
            project_id: currentProjectId,
            name,
            role,
            email: document.getElementById('member-email-input').value.trim(),
            phone: document.getElementById('member-phone-input').value.trim(),
            salary: parseFloat(document.getElementById('member-salary-input').value) || 0
        });
        
        closeModal('createMemberModal');
        showToast('Anggota tim berhasil ditambahkan!', 'success');
        await loadTeamMembers();
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Resource Allocation Functions
async function loadResourceAllocation() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/allocation`);
        assignments = res.data;
        renderResourceAllocation();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderResourceAllocation() {
    const container = document.getElementById('tab-team');
    
    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada anggota tim</h3>
                    <p class="text-gray-500 mt-2">Tambahkan anggota tim dan alokasikan resource</p>
                    <div class="flex gap-3 mt-4 justify-center">
                        <button onclick="openCreateMemberModal()" class="btn btn-primary">
                            <i class="fas fa-user-plus mr-2"></i> Tambah Anggota
                        </button>
                        <button onclick="openAssignResourceModal(null)" class="btn btn-secondary">
                            <i class="fas fa-check mr-2"></i> Alokasikan Resource
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    const roleColors = {
        'Project Manager': 'bg-purple-100 text-purple-700',
        'System Analyst': 'bg-indigo-100 text-indigo-700',
        'Programmer': 'bg-blue-100 text-blue-700',
        'Tester': 'bg-cyan-100 text-cyan-700',
        'UI/UX Designer': 'bg-pink-100 text-pink-700',
        'DevOps Engineer': 'bg-orange-100 text-orange-700',
        'Database Administrator': 'bg-teal-100 text-teal-700',
        'QA Engineer': 'bg-green-100 text-green-700',
        'Other': 'bg-gray-100 text-gray-700'
    };
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800">Alokasi Resource (${assignments.length} anggota)</h3>
            <div class="flex gap-3">
                <button onclick="openCreateMemberModal()" class="btn btn-primary">
                    <i class="fas fa-user-plus mr-2"></i> Tambah Anggota
                </button>
                <button onclick="openAssignResourceModal()" class="btn btn-secondary">
                    <i class="fas fa-check mr-2"></i> Alokasikan
                </button>
            </div>
        </div>
        <div class="card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-200">
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peran</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gaji</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tugas</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${assignments.map(member => `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-4 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                            ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <span class="font-medium text-gray-900">${escapeHtml(member.name)}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-4">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] || roleColors.Other}">
                                        ${escapeHtml(member.role)}
                                    </span>
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${member.email || '-'}
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${member.phone || '-'}
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${member.salary ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(member.salary) : '-'}
                                </td>
                                <td class="px-4 py-4 text-sm text-gray-600">
                                    ${member.task_count || 0} tugas${member.tasks ? `<br><span class="text-xs">${escapeHtml(member.tasks)}</span>` : ''}
                                </td>
                                <td class="px-4 py-4">
                                    <div class="flex gap-1">
                                        <button onclick="editTeamMember(${member.id})" class="btn btn-secondary btn-sm" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteTeamMember(${member.id})" class="btn btn-danger btn-sm" title="Hapus">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function editTeamMember(id) {
    try {
        const member = await apiCall(`/team/${id}`);
        const data = member.data;
        
        document.getElementById('member-name-input').value = data.name;
        document.getElementById('member-role-select').value = data.role;
        document.getElementById('member-email-input').value = data.email || '';
        document.getElementById('member-phone-input').value = data.phone || '';
        document.getElementById('member-salary-input').value = data.salary || 0;
        
        const btn = document.querySelector('#createMemberModal .modal-footer button:last-child');
        btn.innerHTML = '<i class="fas fa-save mr-2"></i> Update Anggota';
        btn.onclick = async () => {
            const name = document.getElementById('member-name-input').value.trim();
            const role = document.getElementById('member-role-select').value;
            
            if (!name) {
                showToast('Nama wajib diisi!', 'error');
                return;
            }
            if (!role) {
                showToast('Peran wajib dipilih!', 'error');
                return;
            }
            
            try {
                await apiCall(`/team/${id}`, 'PUT', {
                    name, role,
                    email: document.getElementById('member-email-input').value.trim(),
                    phone: document.getElementById('member-phone-input').value.trim(),
                    salary: parseFloat(document.getElementById('member-salary-input').value) || 0
                });
                
                closeModal('createMemberModal');
                showToast('Anggota tim berhasil diperbarui!', 'success');
                await loadTeamMembers();
                await loadProjectDetail(currentProjectId);
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
        
        openModal('createMemberModal');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteTeamMember(id) {
    if (confirm('Hapus anggota tim ini?')) {
        try {
            await apiCall(`/team/${id}`, 'DELETE');
            showToast('Anggota tim dihapus!', 'success');
            await loadTeamMembers();
            await loadProjectDetail(currentProjectId);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
}

async function openAssignResourceModal(taskId = null) {
    // Populate task dropdown
    const taskSelect = document.getElementById('assign-task-select');
    taskSelect.innerHTML = '<option value="">Pilih tugas</option>';
    tasks.forEach(task => {
        taskSelect.innerHTML += `<option value="${task.id}" ${taskId === task.id ? 'selected' : ''}>${escapeHtml(task.name)}</option>`;
    });
    
    // Populate member dropdown
    const memberSelect = document.getElementById('assign-member-select');
    memberSelect.innerHTML = '<option value="">Pilih anggota tim</option>';
    teamMembers.forEach(member => {
        memberSelect.innerHTML += `<option value="${member.id}">${escapeHtml(member.name)} (${escapeHtml(member.role)})</option>`;
    });
    
    document.getElementById('assign-percentage-input').value = 100;
    currentTaskId = taskId;
    
    openModal('assignResourceModal');
}

async function createAssignment() {
    const taskId = document.getElementById('assign-task-select').value;
    const memberId = document.getElementById('assign-member-select').value;
    
    if (!taskId || !memberId) {
        showToast('Tugas dan anggota tim wajib dipilih!', 'error');
        return;
    }
    
    try {
        await apiCall('/assignments', 'POST', {
            task_id: parseInt(taskId),
            team_member_id: parseInt(memberId),
            allocation_percentage: parseInt(document.getElementById('assign-percentage-input').value) || 100
        });
        
        closeModal('assignResourceModal');
        showToast('Resource berhasil dialokasikan!', 'success');
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Milestone Functions
async function loadMilestones() {
    try {
        const res = await apiCall(`/projects/${currentProjectId}/milestones`);
        milestones = res.data;
        renderMilestones();
    } catch (err) {
        milestones = [];
    }
}

function renderMilestones() {
    const container = document.getElementById('tab-milestones');
    
    if (milestones.length === 0) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-flag"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada milestone</h3>
                    <p class="text-gray-500 mt-2">Tambahkan milestone untuk menandai pencapaian penting</p>
                    <button onclick="openCreateMilestoneModal()" class="btn btn-primary mt-4">
                        <i class="fas fa-plus mr-2"></i> Tambah Milestone
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800">Milestones (${milestones.length})</h3>
            <button onclick="openCreateMilestoneModal()" class="btn btn-primary">
                <i class="fas fa-plus mr-2"></i> Tambah Milestone
            </button>
        </div>
        <div class="space-y-4">
            ${milestones.map((ms, index) => {
                const isPastDue = ms.target_date < today && !ms.achieved;
                return `
                    <div class="card p-4 flex items-center gap-4 ${ms.achieved ? 'border-green-200' : isPastDue ? 'border-red-200' : ''} ${!ms.achieved && !isPastDue ? 'border-gray-200' : ''}">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center ${ms.achieved ? 'bg-green-100' : isPastDue ? 'bg-red-100' : 'bg-gray-100'}">
                            <i class="fas ${ms.achieved ? 'fa-check-circle text-green-600' : isPastDue ? 'fa-exclamation-circle text-red-600' : 'fa-flag text-gray-600'}"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-gray-900">${escapeHtml(ms.name)}</span>
                                ${ms.achieved ? '<span class="badge badge-completed text-xs">Selesai</span>' : ''}
                                ${isPastDue ? '<span class="badge badge-high text-xs">Terlambat</span>' : ''}
                            </div>
                            <div class="text-sm text-gray-500 mt-1">
                                Target: ${formatDate(ms.target_date)}
                                ${ms.description ? `• ${escapeHtml(ms.description)}` : ''}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="toggleMilestoneAchievement(${index})" class="btn ${ms.achieved ? 'btn-secondary' : 'btn-success'} btn-sm">
                                <i class="fas ${ms.achieved ? 'fa-undo' : 'fa-check'} mr-1"></i>
                                ${ms.achieved ? 'Belum' : 'Selesaikan'}
                            </button>
                            <button onclick="deleteMilestone(${index})" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function openCreateMilestoneModal() {
    document.getElementById('milestone-name-input').value = '';
    document.getElementById('milestone-date-input').value = new Date().toISOString().split('T')[0];
    document.getElementById('milestone-desc-input').value = '';
    openModal('createMilestoneModal');
}

async function createMilestone() {
    const name = document.getElementById('milestone-name-input').value.trim();
    if (!name) {
        showToast('Nama milestone wajib diisi!', 'error');
        return;
    }
    
    const targetDate = document.getElementById('milestone-date-input').value;
    if (!targetDate) {
        showToast('Tanggal target wajib diisi!', 'error');
        return;
    }
    
    try {
        await apiCall('/milestones', 'POST', {
            project_id: currentProjectId,
            name,
            target_date: targetDate,
            description: document.getElementById('milestone-desc-input').value.trim()
        });
        
        closeModal('createMilestoneModal');
        showToast('Milestone berhasil ditambahkan!', 'success');
        loadMilestones();
        await loadProjectDetail(currentProjectId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function toggleMilestoneAchievement(index) {
    const ms = milestones[index];
    try {
        apiCall(`/milestones/${ms.id}`, 'PUT', {
            name: ms.name,
            target_date: ms.target_date,
            description: ms.description,
            achieved: !ms.achieved
        });
        
        ms.achieved = !ms.achieved;
        showToast(ms.achieved ? 'Milestone ditandai selesai!' : 'Milestone ditandai belum selesai!', 'success');
        loadMilestones();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteMilestone(index) {
    const ms = milestones[index];
    if (confirm(`Hapus milestone "${ms.name}"?`)) {
        try {
            await apiCall(`/milestones/${ms.id}`, 'DELETE');
            showToast('Milestone dihapus!', 'success');
            loadMilestones();
            await loadProjectDetail(currentProjectId);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
}

// Gantt Chart Functions
async function loadGanttChart() {
    try {
        const tasksRes = await apiCall(`/projects/${currentProjectId}/tasks`);
        const phasesRes = await apiCall(`/projects/${currentProjectId}/phases`);
        const projectRes = await apiCall(`/projects/${currentProjectId}`);
        
        tasks = tasksRes.data;
        phases = phasesRes.data;
        
        renderGanttChart(tasks, phases, projectRes.data);
    } catch (err) {
        console.error('Gantt chart error:', err);
    }
}

function renderGanttChart(tasks, phases, project) {
    const container = document.getElementById('tab-gantt');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Belum ada data untuk Gantt Chart</h3>
                    <p class="text-gray-500 mt-2">Tambahkan tugas dengan tanggal mulai dan selesai untuk melihat timeline</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Calculate date range
    let minDate = project.start_date || '';
    let maxDate = project.end_date || '';
    
    tasks.forEach(task => {
        if (task.start_date && task.start_date < minDate) minDate = task.start_date;
        if (task.end_date && task.end_date > maxDate) maxDate = task.end_date;
    });
    
    if (!minDate || !maxDate) {
        container.innerHTML = `
            <div class="card p-8">
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3 class="text-lg font-medium text-gray-600 mt-4">Tambahkan tanggal untuk tugas</h3>
                    <p class="text-gray-500 mt-2">Set tanggal mulai dan selesai pada tugas untuk melihat Gantt Chart</p>
                </div>
            </div>
        `;
        return;
    }
    
    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Generate day headers
    let daysHtml = '';
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayNum = date.getDate();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        daysHtml += `
            <th class="px-2 py-2 text-center text-xs ${isWeekend ? 'text-gray-300 bg-gray-50' : 'text-gray-500'} font-medium sticky left-0 bg-white" style="min-width: 32px; z-index: 10;">
                ${dayNum}
            </th>
        `;
    }
    
    const statusColors = {
        'Completed': 'bg-green-500',
        'In Progress': 'bg-blue-500',
        'Pending': 'bg-gray-400'
    };
    
    container.innerHTML = `
        <div class="card overflow-hidden">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-800">Gantt Chart - ${escapeHtml(project.name)}</h3>
                <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-green-500"></div>
                        <span class="text-gray-600">Selesai</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-blue-500"></div>
                        <span class="text-gray-600">Proses</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded bg-gray-400"></div>
                        <span class="text-gray-600">Pending</span>
                    </div>
                </div>
            </div>
            <div class="gantt-container">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 w-64 sticky left-0 bg-gray-50 z-10">Tugas</th>
                            <th class="px-2 py-2 bg-gray-50" colspan="${totalDays}">
                                <div class="flex" style="position: relative;">
                                    ${daysHtml}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map((task, taskIndex) => {
                            const taskStart = task.start_date ? new Date(task.start_date) : null;
                            const taskEnd = task.end_date ? new Date(task.end_date) : null;
                            
                            let barLeft = 0;
                            let barWidth = 0;
                            
                            if (taskStart && taskEnd) {
                                const startOffset = Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24));
                                const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
                                barLeft = Math.max(0, startOffset);
                                barWidth = Math.max(1, duration);
                            }
                            
                            const dependenciesHtml = task.dependencies && task.dependencies.length > 0 ? 
                                task.dependencies.map(dep => {
                                    const predTask = tasks.find(t => t.id === dep.predecessor_id);
                                    return predTask ? `
                                        <div class="absolute bottom-0 left-0 w-full h-0.5 bg-gray-400" style="position: relative;">
                                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
                                                <i class="fas fa-long-arrow-alt-right"></i>
                                            </div>
                                        </div>
                                    ` : '';
                                }).join('') : '';
                            
                            return `
                                <tr class="border-b border-gray-100 hover:bg-gray-50">
                                    <td class="px-4 py-2 sticky left-0 bg-white z-10" style="border-right: 1px solid #e5e7eb;">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-medium text-gray-900 truncate max-w-40">${escapeHtml(task.name)}</span>
                                            <span class="badge text-xs ${task.status === 'Completed' ? 'badge-completed' : task.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending'}">
                                                ${task.status}
                                            </span>
                                        </div>
                                        ${task.phase_name ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(task.phase_name)}</div>` : ''}
                                    </td>
                                    <td colspan="${totalDays}" class="px-2 py-2" style="position: relative; min-height: 40px;">
                                        <div class="relative h-10 flex items-center">
                                            <div class="gantt-bar ${statusColors[task.status] || 'bg-gray-400'} absolute" 
                                                 style="left: ${barLeft * (100 / totalDays)}%; width: ${barWidth * (100 / totalDays)}%; 
                                                        ${task.progress && task.status !== 'Completed' ? `background: linear-gradient(90deg, ${getStatusColor(task.status)} 0%, ${getStatusColor(task.status)} ${task.progress}%, #e5e7eb ${task.progress}%, #e5e7eb 100%)` : ''};
                                                        height: 24px;">
                                                <span class="text-xs text-white px-1" style="position: absolute; top: 50%; transform: translateY(-50%); ${barWidth * (100 / totalDays) < 10 ? 'display: none' : ''}">
                                                    ${task.duration_days || 1}d
                                                </span>
                                            </div>
                                            ${dependenciesHtml}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getStatusColor(status) {
    switch(status) {
        case 'Completed': return '#10b981';
        case 'In Progress': return '#3b82f6';
        default: return '#9ca3af';
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    
    // Progress slider handler
    const progressSlider = document.getElementById('task-progress-input');
    if (progressSlider) {
        progressSlider.addEventListener('input', function() {
            document.getElementById('task-progress-value').textContent = `${this.value}%`;
        });
    }
});
