import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const listEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, status, search } = req.query;

    const where: any = {};
    if (department && department !== 'All') where.department = String(department);
    if (status && status !== 'All') where.status = String(status);
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { email: { contains: String(search) } },
        { jobPosition: { contains: String(search) } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        manager: {
          select: { id: true, name: true, jobPosition: true }
        },
        workingSchedule: {
          select: { id: true, name: true, totalWeeklyHours: true }
        },
        contracts: {
          orderBy: { startDate: 'desc' },
          include: { salaryStructure: true }
        },
        user: {
          select: { id: true, email: true, role: true, status: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: true,
        subordinates: true,
        workingSchedule: {
          include: { days: true }
        },
        contracts: {
          orderBy: { startDate: 'desc' },
          include: { salaryStructure: true }
        },
        allocations: {
          include: { timeOffType: true }
        },
        timeOffRequests: {
          orderBy: { createdAt: 'desc' },
          include: { timeOffType: true }
        },
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 30
        },
        payslips: {
          orderBy: { periodStart: 'desc' },
          include: { lines: true, payrun: true }
        },
        user: true
      }
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    res.json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      department,
      jobPosition,
      managerId,
      workingScheduleId,
      status = 'Active'
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim() ||
        !department || typeof department !== 'string' || !department.trim() ||
        !jobPosition || typeof jobPosition !== 'string' || !jobPosition.trim()) {
      res.status(400).json({ error: 'Name, department, and job position are required and cannot be empty' });
      return;
    }

    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ error: 'Invalid email address format' });
        return;
      }
    }

    if (managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) {
        res.status(404).json({ error: 'Reporting manager not found' });
        return;
      }
    }

    if (workingScheduleId) {
      const schedule = await prisma.workingSchedule.findUnique({ where: { id: workingScheduleId } });
      if (!schedule) {
        res.status(404).json({ error: 'Working schedule not found' });
        return;
      }
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: email && typeof email === 'string' && email.trim() ? email.trim() : null,
        department: department.trim(),
        jobPosition: jobPosition.trim(),
        managerId: managerId || null,
        workingScheduleId: workingScheduleId || null,
        status
      },
      include: {
        manager: true,
        workingSchedule: true
      }
    });

    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      department,
      jobPosition,
      managerId,
      workingScheduleId,
      status
    } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Prevent self-management loop
    if (managerId && managerId === id) {
      res.status(400).json({ error: 'An employee cannot be their own manager' });
      return;
    }

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      res.status(400).json({ error: 'Employee name cannot be empty' });
      return;
    }

    if (email !== undefined && email !== null && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ error: 'Invalid email address format' });
        return;
      }
    }

    if (managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) {
        res.status(404).json({ error: 'Reporting manager not found' });
        return;
      }
    }

    if (workingScheduleId) {
      const schedule = await prisma.workingSchedule.findUnique({ where: { id: workingScheduleId } });
      if (!schedule) {
        res.status(404).json({ error: 'Working schedule not found' });
        return;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        department: department !== undefined ? department.trim() : undefined,
        jobPosition: jobPosition !== undefined ? jobPosition.trim() : undefined,
        managerId: managerId !== undefined ? managerId : undefined,
        workingScheduleId: workingScheduleId !== undefined ? workingScheduleId : undefined,
        status
      },
      include: {
        manager: true,
        workingSchedule: true
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Remove user association first if exists
    await prisma.user.updateMany({
      where: { employeeId: id },
      data: { employeeId: null }
    });

    await prisma.employee.delete({
      where: { id }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
