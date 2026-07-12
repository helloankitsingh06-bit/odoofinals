const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

/**
 * POST /api/admin/departments
 * Creates a department record.
 * Body: { name, description }
 */
router.post('/departments', async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing or invalid required field: name'
    });
  }

  try {
    const departmentsRef = db.collection('departments');
    
    // Check for duplicate name case-insensitively
    const querySnapshot = await departmentsRef.where('name', '==', name.trim()).limit(1).get();
    if (!querySnapshot.empty) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Department with name "${name.trim()}" already exists`
      });
    }

    const newDept = {
      name: name.trim(),
      description: description ? String(description).trim() : null,
      createdAt: new Date()
    };

    const docRef = await departmentsRef.add(newDept);
    
    return res.status(201).json({
      id: docRef.id,
      ...newDept
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create department'
    });
  }
});

/**
 * GET /api/admin/departments
 * Lists all departments.
 */
router.get('/departments', async (req, res) => {
  try {
    const snapshot = await db.collection('departments').get();
    const departments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch departments'
    });
  }
});

/**
 * PATCH /api/admin/departments/:id
 * Body: { name, description }
 * Updates a department.
 */
router.patch('/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const updates = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Bad Request', message: 'Name cannot be empty' });
    }
    updates.name = name.trim();
  }
  if (description !== undefined) {
    updates.description = description ? String(description).trim() : null;
  }

  try {
    const deptRef = db.collection('departments').doc(id);
    const deptDoc = await deptRef.get();
    if (!deptDoc.exists) {
      return res.status(404).json({ error: 'Not Found', message: `Department with ID "${id}" not found` });
    }

    await deptRef.update(updates);
    return res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update department' });
  }
});

module.exports = router;
