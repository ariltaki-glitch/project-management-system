const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Initialize database before handling requests
db.initDb().catch(console.error);

// Helper to ensure DB is ready
async function withDb(handler) {
    try {
        await db.initDb();
        return await handler();
    } catch (error) {
        console.error('DB error:', error);
        throw error;
    }
}

// ============================================
// PROJECT ROUTES
// ============================================

// Get all projects
router.get('/projects', async (req, res) => {
    try {
        await db.initDb();
        const projects = db.getProjects();
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single project with details
router.get('/projects/:id', async (req, res) => {
    try {
        await db.initDb();
        const project = db.getProjectById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        
        const timeline = db.calculateProjectTimeline(req.params.id);
        const progress = db.calculateProjectProgress(req.params.id);
        
        project.timeline = timeline;
        project.progress = progress;
        
        res.json({ success: true, data: project });
    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create project
router.post('/projects', async (req, res) => {
    try {
        await db.initDb();
        const project = db.createProject(req.body);
        res.status(201).json({ success: true, data: project, message: 'Project created successfully' });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update project
router.put('/projects/:id', async (req, res) => {
    try {
        await db.initDb();
        const project = db.updateProject(req.params.id, req.body);
        res.json({ success: true, data: project, message: 'Project updated successfully' });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete project
router.delete('/projects/:id', async (req, res) => {
    try {
        await db.initDb();
        db.deleteProject(req.params.id);
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PHASE ROUTES
// ============================================

// Get phases for a project
router.get('/projects/:projectId/phases', async (req, res) => {
    try {
        await db.initDb();
        const phases = db.getPhases(req.params.projectId);
        res.json({ success: true, data: phases });
    } catch (error) {
        console.error('Error getting phases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create phase
router.post('/phases', async (req, res) => {
    try {
        await db.initDb();
        const phase = db.createPhase(req.body);
        res.status(201).json({ success: true, data: phase, message: 'Phase created successfully' });
    } catch (error) {
        console.error('Error creating phase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update phase
router.put('/phases/:id', async (req, res) => {
    try {
        await db.initDb();
        const phase = db.updatePhase(req.params.id, req.body);
        res.json({ success: true, data: phase, message: 'Phase updated successfully' });
    } catch (error) {
        console.error('Error updating phase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete phase
router.delete('/phases/:id', async (req, res) => {
    try {
        await db.initDb();
        db.deletePhase(req.params.id);
        res.json({ success: true, message: 'Phase deleted successfully' });
    } catch (error) {
        console.error('Error deleting phase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TASK ROUTES
// ============================================

// Get tasks for a project
router.get('/projects/:projectId/tasks', async (req, res) => {
    try {
        await db.initDb();
        const tasks = db.getTasks(req.params.projectId);
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single task
router.get('/tasks/:id', async (req, res) => {
    try {
        await db.initDb();
        const task = db.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        res.json({ success: true, data: task });
    } catch (error) {
        console.error('Error getting task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create task
router.post('/tasks', async (req, res) => {
    try {
        await db.initDb();
        const task = db.createTask(req.body);
        res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update task
router.put('/tasks/:id', async (req, res) => {
    try {
        await db.initDb();
        const task = db.updateTask(req.params.id, req.body);
        res.json({ success: true, data: task, message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete task
router.delete('/tasks/:id', async (req, res) => {
    try {
        await db.initDb();
        db.deleteTask(req.params.id);
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TASK DEPENDENCY ROUTES
// ============================================

// Add dependency
router.post('/dependencies', async (req, res) => {
    try {
        await db.initDb();
        const dependency = db.addTaskDependency(req.body);
        res.status(201).json({ success: true, data: dependency, message: 'Dependency added successfully' });
    } catch (error) {
        console.error('Error adding dependency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove dependency
router.delete('/dependencies/:id', async (req, res) => {
    try {
        await db.initDb();
        db.removeTaskDependency(req.params.id);
        res.json({ success: true, message: 'Dependency removed successfully' });
    } catch (error) {
        console.error('Error removing dependency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get task dependencies
router.get('/tasks/:taskId/dependencies', async (req, res) => {
    try {
        await db.initDb();
        const dependencies = db.getTaskDependencies(req.params.taskId);
        res.json({ success: true, data: dependencies });
    } catch (error) {
        console.error('Error getting dependencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TEAM MEMBER ROUTES
// ============================================

// Get team members for a project
router.get('/projects/:projectId/team', async (req, res) => {
    try {
        await db.initDb();
        const members = db.getTeamMembers(req.params.projectId);
        res.json({ success: true, data: members });
    } catch (error) {
        console.error('Error getting team members:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single team member
router.get('/team/:id', async (req, res) => {
    try {
        await db.initDb();
        const member = db.getTeamMemberById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, error: 'Team member not found' });
        }
        res.json({ success: true, data: member });
    } catch (error) {
        console.error('Error getting team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create team member
router.post('/team', async (req, res) => {
    try {
        await db.initDb();
        const member = db.createTeamMember(req.body);
        res.status(201).json({ success: true, data: member, message: 'Team member added successfully' });
    } catch (error) {
        console.error('Error creating team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update team member
router.put('/team/:id', async (req, res) => {
    try {
        await db.initDb();
        const member = db.updateTeamMember(req.params.id, req.body);
        res.json({ success: true, data: member, message: 'Team member updated successfully' });
    } catch (error) {
        console.error('Error updating team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete team member
router.delete('/team/:id', async (req, res) => {
    try {
        await db.initDb();
        db.deleteTeamMember(req.params.id);
        res.json({ success: true, message: 'Team member deleted successfully' });
    } catch (error) {
        console.error('Error deleting team member:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// TASK ASSIGNMENT ROUTES
// ============================================

// Assign resource to task
router.post('/assignments', async (req, res) => {
    try {
        await db.initDb();
        const assignment = db.assignResource(req.body);
        res.status(201).json({ success: true, data: assignment, message: 'Resource assigned successfully' });
    } catch (error) {
        console.error('Error assigning resource:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove assignment
router.delete('/assignments/:id', async (req, res) => {
    try {
        await db.initDb();
        db.removeAssignment(req.params.id);
        res.json({ success: true, message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Error removing assignment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get assignments for a task
router.get('/tasks/:taskId/assignments', async (req, res) => {
    try {
        await db.initDb();
        const assignments = db.getTaskAssignments(req.params.taskId);
        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get resource allocation for a project
router.get('/projects/:projectId/allocation', async (req, res) => {
    try {
        await db.initDb();
        const allocation = db.getResourceAllocation(req.params.projectId);
        res.json({ success: true, data: allocation });
    } catch (error) {
        console.error('Error getting allocation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MILESTONE ROUTES
// ============================================

// Get milestones for a project
router.get('/projects/:projectId/milestones', async (req, res) => {
    try {
        await db.initDb();
        const milestones = db.getMilestones(req.params.projectId);
        res.json({ success: true, data: milestones });
    } catch (error) {
        console.error('Error getting milestones:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create milestone
router.post('/milestones', async (req, res) => {
    try {
        await db.initDb();
        const milestone = db.createMilestone(req.body);
        res.status(201).json({ success: true, data: milestone, message: 'Milestone created successfully' });
    } catch (error) {
        console.error('Error creating milestone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update milestone
router.put('/milestones/:id', async (req, res) => {
    try {
        await db.initDb();
        const milestone = db.updateMilestone(req.params.id, req.body);
        res.json({ success: true, data: milestone, message: 'Milestone updated successfully' });
    } catch (error) {
        console.error('Error updating milestone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete milestone
router.delete('/milestones/:id', async (req, res) => {
    try {
        await db.initDb();
        db.deleteMilestone(req.params.id);
        res.json({ success: true, message: 'Milestone deleted successfully' });
    } catch (error) {
        console.error('Error deleting milestone:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
