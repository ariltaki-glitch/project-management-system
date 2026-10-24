const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'projects.db');

let SQL = null;
let dbInstance = null;
let dbInitialized = false;

async function initDb() {
    if (dbInitialized && dbInstance) return dbInstance;
    
    SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        dbInstance = new SQL.Database(fileBuffer);
    } else {
        dbInstance = new SQL.Database();
    }
    initializeSchema();
    dbInitialized = true;
    return dbInstance;
}

function getDb() {
    return dbInstance;
}

function saveDb() {
    if (dbInstance && dbInitialized) {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

function initializeSchema() {
    if (!dbInstance) return;
    
    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            organization TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS phases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            order_index INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            phase_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            duration_days INTEGER DEFAULT 1,
            priority TEXT DEFAULT 'Normal',
            start_date TEXT,
            end_date TEXT,
            status TEXT DEFAULT 'Pending',
            progress INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE SET NULL
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS task_dependencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            predecessor_id INTEGER NOT NULL,
            dependency_type TEXT DEFAULT 'Finish-to-Start',
            lag_days INTEGER DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            salary REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS task_assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            team_member_id INTEGER NOT NULL,
            allocation_percentage INTEGER DEFAULT 100,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
        )
    `);

    dbInstance.run(`
        CREATE TABLE IF NOT EXISTS milestones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target_date TEXT NOT NULL,
            description TEXT,
            achieved INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);
}

function queryToObjects(result) {
    if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) return [];
    const { columns, values } = result[0];
    return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
    });
}

function queryFirst(result) {
    const objects = queryToObjects(result);
    return objects[0] || null;
}

// Projects CRUD
function createProject(projectData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    db.run(`
        INSERT INTO projects (name, description, organization, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `, [projectData.name, projectData.description || '', projectData.organization || '', projectData.start_date, projectData.end_date]);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const projectId = result[0].values[0][0];
    
    const defaultPhases = [
        { name: 'Analisis Kebutuhan', order: 1 },
        { name: 'Analisis Sistem', order: 2 },
        { name: 'Perancangan/Desain', order: 3 },
        { name: 'Implementasi/Coding', order: 4 },
        { name: 'Pengujian/Testing', order: 5 },
        { name: 'Deployment & Maintenance', order: 6 }
    ];
    
    for (const phase of defaultPhases) {
        db.run('INSERT INTO phases (project_id, name, order_index) VALUES (?, ?, ?)', [projectId, phase.name, phase.order]);
    }
    
    saveDb();
    return getProjectById(projectId);
}

function getProjects() {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM projects ORDER BY created_at DESC');
    return queryToObjects(result);
}

function getProjectById(id) {
    const db = getDb();
    if (!db) return null;
    
    const projectResult = db.exec('SELECT * FROM projects WHERE id = ?', [id]);
    const project = queryFirst(projectResult);
    if (!project) return null;
    
    const phasesResult = db.exec('SELECT * FROM phases WHERE project_id = ? ORDER BY order_index', [id]);
    project.phases = queryToObjects(phasesResult);
    
    const milestonesResult = db.exec('SELECT * FROM milestones WHERE project_id = ? ORDER BY target_date', [id]);
    project.milestones = queryToObjects(milestonesResult);
    
    const membersResult = db.exec(`
        SELECT tm.*, GROUP_CONCAT(t.name) as task_names
        FROM team_members tm
        LEFT JOIN task_assignments ta ON tm.id = ta.team_member_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE tm.project_id = ?
        GROUP BY tm.id
    `, [id]);
    project.team_members = queryToObjects(membersResult);
    
    return project;
}

function updateProject(id, projectData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    
    db.run(`
        UPDATE projects SET 
            name = ?, 
            description = ?, 
            organization = ?, 
            start_date = ?, 
            end_date = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [projectData.name, projectData.description || '', projectData.organization || '', projectData.start_date, projectData.end_date, id]);
    saveDb();
    return getProjectById(id);
}

function deleteProject(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM projects WHERE id = ?', [id]);
    saveDb();
    return true;
}

// Phases CRUD
function getPhases(projectId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM phases WHERE project_id = ? ORDER BY order_index', [projectId]);
    return queryToObjects(result);
}

function createPhase(phaseData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('INSERT INTO phases (project_id, name, order_index) VALUES (?, ?, ?)', 
        [phaseData.project_id, phaseData.name, phaseData.order_index]);
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return queryFirst(db.exec('SELECT * FROM phases WHERE id = ?', [result[0].values[0][0]]));
}

function updatePhase(id, phaseData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('UPDATE phases SET name = ?, order_index = ? WHERE id = ?', 
        [phaseData.name, phaseData.order_index, id]);
    saveDb();
    return queryFirst(db.exec('SELECT * FROM phases WHERE id = ?', [id]));
}

function deletePhase(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM phases WHERE id = ?', [id]);
    saveDb();
    return true;
}

// Tasks CRUD
function createTask(taskData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        INSERT INTO tasks (project_id, phase_id, name, description, duration_days, priority, start_date, end_date, status, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [taskData.project_id, taskData.phase_id || null, taskData.name, taskData.description || '', 
        taskData.duration_days || 1, taskData.priority || 'Normal', taskData.start_date || null, 
        taskData.end_date || null, taskData.status || 'Pending', taskData.progress || 0]);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return getTaskById(result[0].values[0][0]);
}

function getTasks(projectId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec(`
        SELECT t.*, p.name as phase_name,
               GROUP_CONCAT(td.predecessor_id) as predecessor_ids,
               GROUP_CONCAT(td.dependency_type) as dependency_types,
               GROUP_CONCAT(td.lag_days) as lag_days_list
        FROM tasks t
        LEFT JOIN phases p ON t.phase_id = p.id
        LEFT JOIN task_dependencies td ON t.id = td.task_id
        WHERE t.project_id = ?
        GROUP BY t.id
        ORDER BY t.start_date, t.id
    `, [projectId]);
    
    const rawTasks = queryToObjects(result);
    
    return rawTasks.map(task => {
        const predIds = task.predecessor_ids ? String(task.predecessor_ids).split(',').filter(Boolean).map(Number) : [];
        const depTypes = task.dependency_types ? String(task.dependency_types).split(',').filter(Boolean) : [];
        const lags = task.lag_days_list ? String(task.lag_days_list).split(',').filter(Boolean).map(Number) : [];
        
        task.dependencies = predIds.map((pid, i) => ({
            predecessor_id: pid,
            dependency_type: depTypes[i] || 'Finish-to-Start',
            lag_days: lags[i] || 0
        }));
        delete task.predecessor_ids;
        delete task.dependency_types;
        delete task.lag_days_list;
        return task;
    });
}

function getTaskById(id) {
    const db = getDb();
    if (!db) return null;
    const result = db.exec(`
        SELECT t.*, p.name as phase_name
        FROM tasks t
        LEFT JOIN phases p ON t.phase_id = p.id
        WHERE t.id = ?
    `, [id]);
    
    const task = queryFirst(result);
    if (!task) return null;
    
    const depsResult = db.exec('SELECT * FROM task_dependencies WHERE task_id = ?', [id]);
    task.dependencies = queryToObjects(depsResult);
    
    const assigneesResult = db.exec(`
        SELECT tm.*, ta.allocation_percentage
        FROM team_members tm
        JOIN task_assignments ta ON tm.id = ta.team_member_id
        WHERE ta.task_id = ?
    `, [id]);
    task.assignees = queryToObjects(assigneesResult);
    
    return task;
}

function updateTask(id, taskData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        UPDATE tasks SET 
            phase_id = ?, 
            name = ?, 
            description = ?, 
            duration_days = ?, 
            priority = ?, 
            start_date = ?, 
            end_date = ?, 
            status = ?, 
            progress = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `, [taskData.phase_id || null, taskData.name, taskData.description || '', 
        taskData.duration_days || 1, taskData.priority || 'Normal', taskData.start_date || null, 
        taskData.end_date || null, taskData.status || 'Pending', taskData.progress || 0, id]);
    saveDb();
    return getTaskById(id);
}

function deleteTask(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    saveDb();
    return true;
}

// Task Dependencies
function addTaskDependency(depData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        INSERT INTO task_dependencies (task_id, predecessor_id, dependency_type, lag_days)
        VALUES (?, ?, ?, ?)
    `, [depData.task_id, depData.predecessor_id, depData.dependency_type || 'Finish-to-Start', depData.lag_days || 0]);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return queryFirst(db.exec('SELECT * FROM task_dependencies WHERE id = ?', [result[0].values[0][0]]));
}

function removeTaskDependency(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM task_dependencies WHERE id = ?', [id]);
    saveDb();
    return true;
}

function getTaskDependencies(taskId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM task_dependencies WHERE task_id = ?', [taskId]);
    return queryToObjects(result);
}

// Team Members CRUD
function createTeamMember(memberData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        INSERT INTO team_members (project_id, name, role, email, phone, salary)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [memberData.project_id, memberData.name, memberData.role, memberData.email || '', memberData.phone || '', memberData.salary || 0]);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return queryFirst(db.exec('SELECT * FROM team_members WHERE id = ?', [result[0].values[0][0]]));
}

function getTeamMembers(projectId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec(`
        SELECT tm.*, GROUP_CONCAT(t.name) as tasks
        FROM team_members tm
        LEFT JOIN task_assignments ta ON tm.id = ta.team_member_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE tm.project_id = ?
        GROUP BY tm.id
        ORDER BY tm.name
    `, [projectId]);
    return queryToObjects(result);
}

function getTeamMemberById(id) {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT * FROM team_members WHERE id = ?', [id]);
    return queryFirst(result);
}

function updateTeamMember(id, memberData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        UPDATE team_members SET 
            name = ?, 
            role = ?, 
            email = ?, 
            phone = ?, 
            salary = ?
        WHERE id = ?
    `, [memberData.name, memberData.role, memberData.email || '', memberData.phone || '', memberData.salary || 0, id]);
    saveDb();
    return queryFirst(db.exec('SELECT * FROM team_members WHERE id = ?', [id]));
}

function deleteTeamMember(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM team_members WHERE id = ?', [id]);
    saveDb();
    return true;
}

// Task Assignments (Resource Allocation)
function assignResource(assignmentData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        INSERT INTO task_assignments (task_id, team_member_id, allocation_percentage)
        VALUES (?, ?, ?)
    `, [assignmentData.task_id, assignmentData.team_member_id, assignmentData.allocation_percentage || 100]);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return queryFirst(db.exec('SELECT * FROM task_assignments WHERE id = ?', [result[0].values[0][0]]));
}

function removeAssignment(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM task_assignments WHERE id = ?', [id]);
    saveDb();
    return true;
}

function getTaskAssignments(taskId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec(`
        SELECT ta.*, tm.name as member_name, tm.role as member_role
        FROM task_assignments ta
        JOIN team_members tm ON ta.team_member_id = tm.id
        WHERE ta.task_id = ?
    `, [taskId]);
    return queryToObjects(result);
}

function getResourceAllocation(projectId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec(`
        SELECT tm.id, tm.name, tm.role, tm.email, tm.phone, tm.salary,
               GROUP_CONCAT(t.name) as tasks,
               COUNT(ta.id) as task_count
        FROM team_members tm
        LEFT JOIN task_assignments ta ON tm.id = ta.team_member_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE tm.project_id = ?
        GROUP BY tm.id
        ORDER BY tm.role, tm.name
    `, [projectId]);
    return queryToObjects(result);
}

// Milestones CRUD
function createMilestone(milestoneData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        INSERT INTO milestones (project_id, name, target_date, description)
        VALUES (?, ?, ?, ?)
    `, [milestoneData.project_id, milestoneData.name, milestoneData.target_date, milestoneData.description || '']);
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    saveDb();
    return queryFirst(db.exec('SELECT * FROM milestones WHERE id = ?', [result[0].values[0][0]]));
}

function getMilestones(projectId) {
    const db = getDb();
    if (!db) return [];
    const result = db.exec('SELECT * FROM milestones WHERE project_id = ? ORDER BY target_date', [projectId]);
    return queryToObjects(result);
}

function updateMilestone(id, milestoneData) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run(`
        UPDATE milestones SET 
            name = ?, 
            target_date = ?, 
            description = ?,
            achieved = ?
        WHERE id = ?
    `, [milestoneData.name, milestoneData.target_date, milestoneData.description || '', milestoneData.achieved ? 1 : 0, id]);
    saveDb();
    return queryFirst(db.exec('SELECT * FROM milestones WHERE id = ?', [id]));
}

function deleteMilestone(id) {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');
    db.run('DELETE FROM milestones WHERE id = ?', [id]);
    saveDb();
    return true;
}

// Analytics helpers
function calculateProjectTimeline(projectId) {
    const db = getDb();
    if (!db) return null;
    const result = db.exec('SELECT start_date, end_date FROM tasks WHERE project_id = ? AND start_date IS NOT NULL AND end_date IS NOT NULL', [projectId]);
    const tasks = result[0]?.values || [];
    
    if (tasks.length === 0) return null;
    
    let earliestStart = null;
    let latestEnd = null;
    
    for (const task of tasks) {
        if (!earliestStart || task[0] < earliestStart) earliestStart = task[0];
        if (!latestEnd || task[1] > latestEnd) latestEnd = task[1];
    }
    
    return { earliestStart, latestEnd };
}

function calculateProjectProgress(projectId) {
    const db = getDb();
    if (!db) return { total: 0, completed: 0, inProgress: 0, averageProgress: 0 };
    const result = db.exec(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            AVG(progress) as avg_progress
        FROM tasks
        WHERE project_id = ?
    `, [projectId]);
    
    const values = result[0]?.values?.[0] || [0, 0, 0];
    
    return {
        total: values[0],
        completed: values[1] || 0,
        inProgress: values[0] - (values[1] || 0),
        averageProgress: Math.round((values[2] || 0) * 100) / 100
    };
}

module.exports = {
    initDb,
    getDb,
    // Projects
    createProject, getProjects, getProjectById, updateProject, deleteProject,
    // Phases
    getPhases, createPhase, updatePhase, deletePhase,
    // Tasks
    createTask, getTasks, getTaskById, updateTask, deleteTask,
    // Dependencies
    addTaskDependency, removeTaskDependency, getTaskDependencies,
    // Team Members
    createTeamMember, getTeamMembers, getTeamMemberById, updateTeamMember, deleteTeamMember,
    // Assignments
    assignResource, removeAssignment, getTaskAssignments, getResourceAllocation,
    // Milestones
    createMilestone, getMilestones, updateMilestone, deleteMilestone,
    // Analytics
    calculateProjectTimeline, calculateProjectProgress
};
