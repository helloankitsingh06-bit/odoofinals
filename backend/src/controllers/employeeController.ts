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

    if (!name || !department || !jobPosition) {
      res.status(400).json({ error: 'Name, department, and job position are required' });
      return;
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email: email || null,
        department,
        jobPosition,
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

    // Prevent self-management loop
    if (managerId && managerId === id) {
      res.status(400).json({ error: 'An employee cannot be their own manager' });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email: email !== undefined ? email : undefined,
        department,
        jobPosition,
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
