import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '../types';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = Role.Employee, employeeId } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let linkedEmployeeId = employeeId || null;

    // STEP 2: Search Employee table for matching email to auto-link
    if (!linkedEmployeeId && email) {
      const existingEmp = await prisma.employee.findFirst({
        where: { email: email.trim() }
      });
      if (existingEmp) {
        linkedEmployeeId = existingEmp.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim(),
        passwordHash,
        role,
        employeeId: linkedEmployeeId
      },
      include: {
        employee: true
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Auto-link if employeeId was previously null but an Employee record exists now
    if (!user.employeeId && user.email) {
      const matchingEmp = await prisma.employee.findFirst({
        where: { email: user.email.trim() }
      });
      if (matchingEmp) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: matchingEmp.id },
          include: { employee: true }
        });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        employee: {
          include: {
            workingSchedule: {
              include: { days: true }
            },
            contracts: {
              where: { status: 'Active' },
              include: { salaryStructure: true }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Auto-link if employeeId is missing but matching Employee exists
    if (!user.employeeId && user.email) {
      const matchingEmp = await prisma.employee.findFirst({
        where: { email: user.email.trim() }
      });
      if (matchingEmp) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: matchingEmp.id },
          include: {
            employee: {
              include: {
                workingSchedule: {
                  include: { days: true }
                },
                contracts: {
                  where: { status: 'Active' },
                  include: { salaryStructure: true }
                }
              }
            }
          }
        });
      }
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    });

    if (!user) {
      res.status(404).json({ error: 'No account found with this email address' });
      return;
    }

    if (!newPassword) {
      res.json({
        exists: true,
        name: user.name,
        role: user.role,
        message: 'Account verified. You may proceed to set a new password.'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    res.json({
      message: 'Password has been successfully updated. You can now log in with your new password.',
      email: user.email
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        status: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            department: true,
            jobPosition: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

