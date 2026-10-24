// Database Seeder - Populate with realistic sample data
const db = require('./db');

async function seed() {
    console.log('=== Starting Database Seeder ===\n');
    
    // Initialize database
    await db.initDb();
    console.log('✓ Database initialized\n');
    
// Clear existing data
console.log('Clearing existing data...');

// Delete milestones (if any exist)
try { db.deleteMilestone(1); } catch(e) {}
try { db.deleteMilestone(2); } catch(e) {}
try { db.deleteMilestone(3); } catch(e) {}

// Delete team members (if any exist)
try { db.deleteTeamMember(1); } catch(e) {}
try { db.deleteTeamMember(2); } catch(e) {}
try { db.deleteTeamMember(3); } catch(e) {}
try { db.deleteTeamMember(4); } catch(e) {}
try { db.deleteTeamMember(5); } catch(e) {}

// Delete tasks (if any exist)
try { db.deleteTask(1); } catch(e) {}
try { db.deleteTask(2); } catch(e) {}
try { db.deleteTask(3); } catch(e) {}
try { db.deleteTask(4); } catch(e) {}
try { db.deleteTask(5); } catch(e) {}
try { db.deleteTask(6); } catch(e) {}

// Delete dependencies (if any exist)
const deps = db.getTaskDependencies(1);
deps.forEach(d => { try { db.removeTaskDependency(d.id); } catch(e) {} });

// Delete project (if exists)
try { db.deleteProject(1); } catch(e) {}

console.log('✓ Existing data cleared\n');
    
    // ============================================
    // 1. Create Main Project
    // ============================================
    console.log('Creating project...');
    const project = await db.createProject({
        name: 'Sistem Informasi Kelola Pemberkasan Berkas Digital',
        description: 'Pengembangan sistem informasi terintegrasi untuk pengelolaan, pengarsipan, dan digitalisasi pemberkasan dokumen instansi.',
        organization: 'Dinas Perpustakaan dan Kearsipan Daerah',
        start_date: '2026-11-01',
        end_date: '2026-12-15'
    });
    console.log(`✓ Project created: ${project.name} (ID: ${project.id})\n`);
    
    // ============================================
    // 2. Create Tasks for Each Phase
    // ============================================
    console.log('Creating tasks...');
    
    // Get phases
    const phases = project.phases;
    const phaseMap = {};
    phases.forEach(p => {
        phaseMap[p.name] = p.id;
    });
    
    // Task 1: Analisis Kebutuhan
    const task1 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Analisis Kebutuhan'],
        name: 'Pengumpulan Data & Wawancara Pemangku Kepentingan',
        description: 'Mengumpulkan data kebutuhan dan melakukan wawancara dengan pemangku kepentingan terkait sistem pemberkasan dokumen.',
        duration_days: 4,
        priority: 'High',
        status: 'Completed',
        progress: 100,
        start_date: '2026-11-01',
        end_date: '2026-11-04'
    });
    console.log(`✓ Task 1: ${task1.name} (ID: ${task1.id})`);
    
    // Task 2: Analisis Sistem
    const task2 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Analisis Sistem'],
        name: 'Analisis Alur Dokumen & Penyusunan Spesifikasi Kebutuhan',
        description: 'Menganalisis alur dokumen dan menyusun spesifikasi kebutuhan sistem yang lengkap.',
        duration_days: 5,
        priority: 'High',
        status: 'Completed',
        progress: 100,
        start_date: '2026-11-05',
        end_date: '2026-11-09'
    });
    console.log(`✓ Task 2: ${task2.name} (ID: ${task2.id})`);
    
    // Task 3: Perancangan/Desain
    const task3 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Perancangan/Desain'],
        name: 'Perancangan Basis Data & Wireframe UI/UX',
        description: 'Merancang struktur basis data dan membuat wireframe antarmuka pengguna.',
        duration_days: 6,
        priority: 'Normal',
        status: 'In Progress',
        progress: 60,
        start_date: '2026-11-10',
        end_date: '2026-11-15'
    });
    console.log(`✓ Task 3: ${task3.name} (ID: ${task3.id})`);
    
    // Task 4: Implementasi/Coding
    const task4 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Implementasi/Coding'],
        name: 'Pengembangan Modul Manajemen Berkas & API Server',
        description: 'Mengembangkan modul manajemen berkas digital dan API server untuk integrasi sistem.',
        duration_days: 10,
        priority: 'High',
        status: 'In Progress',
        progress: 25,
        start_date: '2026-11-16',
        end_date: '2026-11-25'
    });
    console.log(`✓ Task 4: ${task4.name} (ID: ${task4.id})`);
    
    // Task 5: Pengujian/Testing
    const task5 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Pengujian/Testing'],
        name: 'Pengujian Fungsionalitas & User Acceptance Testing (UAT)',
        description: 'Melakukan pengujian fungsionalitas sistem dan UAT bersama pengguna.',
        duration_days: 5,
        priority: 'Normal',
        status: 'Pending',
        progress: 0,
        start_date: '2026-11-26',
        end_date: '2026-11-30'
    });
    console.log(`✓ Task 5: ${task5.name} (ID: ${task5.id})`);
    
    // Task 6: Deployment & Maintenance
    const task6 = db.createTask({
        project_id: project.id,
        phase_id: phaseMap['Deployment & Maintenance'],
        name: 'Penerapan Sistem ke Server & Pelatihan Pengguna',
        description: 'Menerapkan sistem ke server produksi dan melaksanakan pelatihan bagi pengguna.',
        duration_days: 3,
        priority: 'Low',
        status: 'Pending',
        progress: 0,
        start_date: '2026-12-01',
        end_date: '2026-12-03'
    });
    console.log(`✓ Task 6: ${task6.name} (ID: ${task6.id})\n`);
    
    // ============================================
    // 3. Create Task Dependencies
    // ============================================
    console.log('Creating task dependencies...');
    
    // Dependency 1: Task 2 depends on Task 1
    const dep1 = db.addTaskDependency({
        task_id: task2.id,
        predecessor_id: task1.id,
        dependency_type: 'Finish-to-Start',
        lag_days: 0
    });
    console.log(`✓ Dependency 1: "${task2.name}" ← "${task1.name}" (FS, Lag: 0)`);
    
    // Dependency 2: Task 3 depends on Task 2
    const dep2 = db.addTaskDependency({
        task_id: task3.id,
        predecessor_id: task2.id,
        dependency_type: 'Finish-to-Start',
        lag_days: 0
    });
    console.log(`✓ Dependency 2: "${task3.name}" ← "${task2.name}" (FS, Lag: 0)`);
    
    // Dependency 3: Task 4 depends on Task 3
    const dep3 = db.addTaskDependency({
        task_id: task4.id,
        predecessor_id: task3.id,
        dependency_type: 'Finish-to-Start',
        lag_days: 0
    });
    console.log(`✓ Dependency 3: "${task4.name}" ← "${task3.name}" (FS, Lag: 0)`);
    
    // Dependency 4: Task 5 depends on Task 4
    const dep4 = db.addTaskDependency({
        task_id: task5.id,
        predecessor_id: task4.id,
        dependency_type: 'Finish-to-Start',
        lag_days: 0
    });
    console.log(`✓ Dependency 4: "${task5.name}" ← "${task4.name}" (FS, Lag: 0)\n`);
    
    // ============================================
    // 4. Create Team Members
    // ============================================
    console.log('Creating team members...');
    
    const member1 = db.createTeamMember({
        project_id: project.id,
        name: 'Ali Wijaya',
        role: 'Project Manager',
        email: 'ali@example.com',
        phone: '081234567890',
        salary: 10000000
    });
    console.log(`✓ Member 1: ${member1.name} (${member1.role}) - ID: ${member1.id}`);
    
    const member2 = db.createTeamMember({
        project_id: project.id,
        name: 'Budi Santoso',
        role: 'System Analyst',
        email: 'budi@example.com',
        phone: '081234567891',
        salary: 8000000
    });
    console.log(`✓ Member 2: ${member2.name} (${member2.role}) - ID: ${member2.id}`);
    
    const member3 = db.createTeamMember({
        project_id: project.id,
        name: 'Citra Dewi',
        role: 'Frontend Developer',
        email: 'citra@example.com',
        phone: '081234567892',
        salary: 7500000
    });
    console.log(`✓ Member 3: ${member3.name} (${member3.role}) - ID: ${member3.id}`);
    
    const member4 = db.createTeamMember({
        project_id: project.id,
        name: 'Doni Prasetyo',
        role: 'Backend Developer',
        email: 'doni@example.com',
        phone: '081234567893',
        salary: 8000000
    });
    console.log(`✓ Member 4: ${member4.name} (${member4.role}) - ID: ${member4.id}`);
    
    const member5 = db.createTeamMember({
        project_id: project.id,
        name: 'Eka Putra',
        role: 'QA Tester',
        email: 'eka@example.com',
        phone: '081234567894',
        salary: 6000000
    });
    console.log(`✓ Member 5: ${member5.name} (${member5.role}) - ID: ${member5.id}\n`);
    
    // ============================================
    // 5. Create Resource Allocations
    // ============================================
    console.log('Creating resource allocations...');
    
    // Ali Wijaya -> Task 1 (Pengumpulan Data)
    const alloc1 = db.assignResource({
        task_id: task1.id,
        team_member_id: member1.id,
        allocation_percentage: 100
    });
    console.log(`✓ Ali Wijaya assigned to "${task1.name}"`);
    
    // Budi Santoso -> Task 2 (Analisis Alur Dokumen)
    const alloc2 = db.assignResource({
        task_id: task2.id,
        team_member_id: member2.id,
        allocation_percentage: 100
    });
    console.log(`✓ Budi Santoso assigned to "${task2.name}"`);
    
    // Citra Dewi -> Task 3 (Perancangan Basis Data)
    const alloc3 = db.assignResource({
        task_id: task3.id,
        team_member_id: member3.id,
        allocation_percentage: 70
    });
    console.log(`✓ Citra Dewi assigned to "${task3.name}" (70%)`);
    
    // Doni Prasetyo -> Task 3 and Task 4
    const alloc4 = db.assignResource({
        task_id: task3.id,
        team_member_id: member4.id,
        allocation_percentage: 30
    });
    console.log(`✓ Doni Prasetyo assigned to "${task3.name}" (30%)`);
    
    const alloc5 = db.assignResource({
        task_id: task4.id,
        team_member_id: member4.id,
        allocation_percentage: 70
    });
    console.log(`✓ Doni Prasetyo assigned to "${task4.name}" (70%)`);
    
    // Citra Dewi -> Task 4
    const alloc6 = db.assignResource({
        task_id: task4.id,
        team_member_id: member3.id,
        allocation_percentage: 30
    });
    console.log(`✓ Citra Dewi assigned to "${task4.name}" (30%)`);
    
    // Eka Putra -> Task 5 (Pengujian)
    const alloc7 = db.assignResource({
        task_id: task5.id,
        team_member_id: member5.id,
        allocation_percentage: 100
    });
    console.log(`✓ Eka Putra assigned to "${task5.name}"\n`);
    
    // ============================================
    // 6. Create Milestones
    // ============================================
    console.log('Creating milestones...');
    
    const ms1 = db.createMilestone({
        project_id: project.id,
        name: 'Persetujuan Dokumen Spesifikasi Sistem',
        target_date: '2026-11-10',
        description: 'Dokumen spesifikasi sistem disetujui oleh pemangku kepentingan.'
    });
    // Manually update the milestone to achieved since createMilestone doesn't accept achieved param
    db.updateMilestone(ms1.id, {
        name: ms1.name,
        target_date: ms1.target_date,
        description: ms1.description,
        achieved: true
    });
    console.log(`✓ Milestone 1: "${ms1.name}" - ACHIEVED`);
    
    const ms2 = db.createMilestone({
        project_id: project.id,
        name: 'Rilis Versi Alpha / Prototipe UI',
        target_date: '2026-11-20',
        description: 'Rilis versi alpha dengan prototipe UI yang dapat diakses untuk testing.',
        achieved: 0
    });
    console.log(`✓ Milestone 2: "${ms2.name}" - PENDING`);
    
    const ms3 = db.createMilestone({
        project_id: project.id,
        name: 'Serah Terima Aplikasi & Training',
        target_date: '2026-12-15',
        description: 'Serah terima aplikasi akhir dan pelatihan pengguna akhir.',
        achieved: 0
    });
    console.log(`✓ Milestone 3: "${ms3.name}" - PENDING\n`);
    
    // ============================================
    // Summary
    // ============================================
    console.log('=== Seeding Complete ===\n');
    console.log('Summary:');
    console.log(`  Project: ${project.name}`);
    console.log(`  Tasks: 6`);
    console.log(`  Dependencies: 4`);
    console.log(`  Team Members: 5`);
    console.log(`  Allocations: 7`);
    console.log(`  Milestones: 3`);
    console.log('\nDatabase saved to: database/projects.db');
    console.log('You can now refresh the application to see the data.\n');
}

// Run seeder
seed().catch(err => {
    console.error('Error during seeding:', err);
    process.exit(1);
});
