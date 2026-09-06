import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { VALID_ROLES, generateTempPassword } from '../types';

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
          take: 100
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
      status = 'Active',
      role,
      isTopLevel = false
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim() ||
        !department || typeof department !== 'string' || !department.trim() ||
        !jobPosition || typeof jobPosition !== 'string' || !jobPosition.trim()) {
      res.status(400).json({ error: 'Name, department, and job position are required and cannot be empty' });
      return;
    }

    // --- Field-level validation first (format), then business rules below ---

    // --- ISSUE 1B: an email is required so we can provision the login account ---
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        res.status(400).json({ error: 'Invalid email address format' });
        return;
      }
    }
    if (!cleanEmail) {
      res.status(400).json({ error: "An email address is required to create the employee's login account." });
      return;
    }

    // --- ISSUE 1A: reporting manager is required (server-side), unless explicitly top-level ---
    if (!isTopLevel && !managerId) {
      res.status(400).json({ error: 'A reporting manager must be assigned before creating this employee.' });
      return;
    }

    // --- ISSUE 4: an explicit, valid system role is required ---
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({
        error: `A valid system role is required. Choose one of: ${VALID_ROLES.join(', ')}`
      });
      return;
    }

    let managerRecord: any = null;
    if (managerId && !isTopLevel) {
      managerRecord = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!managerRecord) {
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
        email: cleanEmail,
        department: department.trim(),
        jobPosition: jobPosition.trim(),
        managerId: isTopLevel ? null : (managerId || null),
        managerName: isTopLevel ? null : (managerRecord?.name || null),
        workingScheduleId: workingScheduleId || null,
        status
      },
      include: {
        manager: true,
        workingSchedule: true
      }
    });

    // --- ISSUE 1B + ISSUE 4: provision (or link) the User login account ---
    let tempPassword: string | null = null;
    let userCreated = false;
    let credentialNote = '';

    const existingUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existingUser) {
      // A login already exists for this email — link it and align its system role.
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { employeeId: employee.id, role }
      });
      credentialNote =
        'A login account for this email already existed. It has been linked to this employee and its role updated. ' +
        'Its existing password was kept — use "Forgot password" if it needs to be reset.';
    } else {
      tempPassword = generateTempPassword(10);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role,
          employeeId: employee.id,
          status: 'Active',
          mustChangePassword: true
        }
      });
      userCreated = true;
      credentialNote =
        'Share these credentials with the employee securely. They will be forced to set a new password on first login.';
    }

    const full = await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        manager: { select: { id: true, name: true, jobPosition: true } },
        workingSchedule: true,
        user: { select: { id: true, email: true, role: true, status: true, mustChangePassword: true } }
      }
    });

    res.status(201).json({
      ...full,
      credentials: {
        loginEmail: cleanEmail,
        tempPassword,
        userCreated,
        role,
        note: credentialNote
      }
    });
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
      status,
      role,
      isTopLevel = false
    } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!existing) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Prevent self-management loop
    if (managerId && managerId === id) {
      res.status(400).json({ error: 'An employee cannot be their own manager' });
      return;
    }

    // --- ISSUE 1A: a reporting manager stays required unless explicitly top-level ---
    if (managerId !== undefined) {
      const resolvedManager = isTopLevel ? null : (managerId || null);
      if (!resolvedManager && !isTopLevel) {
        res.status(400).json({ error: 'A reporting manager must be assigned before creating this employee.' });
        return;
      }
    }

    // --- ISSUE 4: if a role is supplied it must be valid ---
    if (role !== undefined && role !== null && role !== '' && !VALID_ROLES.includes(role)) {
      res.status(400).json({
        error: `A valid system role is required. Choose one of: ${VALID_ROLES.join(', ')}`
      });
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

    let resolvedManagerId: string | null | undefined = undefined;
    let resolvedManagerName: string | null | undefined = undefined;

    if (managerId !== undefined) {
      if (isTopLevel || !managerId) {
        resolvedManagerId = null;
        resolvedManagerName = null;
      } else {
        const mgr = await prisma.employee.findUnique({ where: { id: managerId } });
        if (!mgr) {
          res.status(404).json({ error: 'Reporting manager not found' });
          return;
        }
        resolvedManagerId = managerId;
        resolvedManagerName = mgr.name;
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
        managerId: resolvedManagerId,
        managerName: resolvedManagerName,
        workingScheduleId: workingScheduleId !== undefined ? workingScheduleId : undefined,
        status
      },
      include: {
        manager: true,
        workingSchedule: true
      }
    });

    // If employee name changed, sync managerName for all subordinates reporting to this employee
    if (name !== undefined && name.trim() !== existing.name) {
      await prisma.employee.updateMany({
        where: { managerId: id },
        data: { managerName: name.trim() }
      });
    }

    // Auto-link user account if email was set or updated, and keep the
    // system role (ISSUE 4) in sync with what the form selected.
    if (updated.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: updated.email }
      });
      if (existingUser) {
        const userData: any = {};
        if (existingUser.employeeId !== updated.id) userData.employeeId = updated.id;
        if (role && VALID_ROLES.includes(role) && existingUser.role !== role) userData.role = role;
        if (Object.keys(userData).length > 0) {
          await prisma.user.update({ where: { id: existingUser.id }, data: userData });
        }
      }
    } else if (role && VALID_ROLES.includes(role) && existing.user && existing.user.role !== role) {
      // Email cleared but a linked user still exists — still honour the role change.
      await prisma.user.update({ where: { id: existing.user.id }, data: { role } });
    }

    const result = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, jobPosition: true } },
        workingSchedule: true,
        user: { select: { id: true, email: true, role: true, status: true, mustChangePassword: true } }
      }
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyEmployeeDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let empId = req.user.employeeId;
    if (!empId && req.user.email) {
      const emp = await prisma.employee.findFirst({
        where: { email: req.user.email.trim() }
      });
      if (emp) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { employeeId: emp.id }
        });
        empId = emp.id;
      }
    }

    if (!empId) {
      res.status(404).json({ error: 'No employee record linked to this user' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
      include: {
        manager: {
          select: { id: true, name: true, jobPosition: true }
        },
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
        }
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

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unlink any user accounts linked to this employee
      await tx.user.updateMany({
        where: { employeeId: id },
        data: { employeeId: null }
      });

      // 2. Unlink any subordinates where this employee is manager
      await tx.employee.updateMany({
        where: { managerId: id },
        data: { managerId: null }
      });

      // 3. Delete payslip lines & warnings
      await tx.payslipWarning.deleteMany({
        where: { payslip: { employeeId: id } }
      });

      await tx.payslipRuleLine.deleteMany({
        where: { payslip: { employeeId: id } }
      });

      // 4. Delete payslips
      await tx.payslip.deleteMany({
        where: { employeeId: id }
      });

      // 5. Delete payrun link
      await tx.payrunEmployee.deleteMany({
        where: { employeeId: id }
      });

      // 6. Delete attendances
      await tx.attendance.deleteMany({
        where: { employeeId: id }
      });

      // 7. Delete time off requests & allocations
      await tx.timeOffRequest.deleteMany({
        where: { employeeId: id }
      });

      await tx.allocation.deleteMany({
        where: { employeeId: id }
      });

      // 8. Delete contracts
      await tx.contract.deleteMany({
        where: { employeeId: id }
      });

      // 9. Delete employee record
      await tx.employee.delete({
        where: { id }
      });
    });

    res.json({ message: 'Employee and all associated records deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
