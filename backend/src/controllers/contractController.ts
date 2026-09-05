import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ContractStatus } from '../types';

export const listContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, status } = req.query;
    const where: any = {};
    if (employeeId) where.employeeId = String(employeeId);
    if (status && status !== 'All') where.status = String(status);

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, department: true, jobPosition: true }
        },
        salaryStructure: true
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(contracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      wage,
      salaryStructureId,
      department,
      jobPosition,
      status = 'Active'
    } = req.body;

    if (!employeeId || !startDate || !wage || !salaryStructureId || !department || !jobPosition) {
      res.status(400).json({ error: 'All contract fields are required' });
      return;
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && end < start) {
      res.status(400).json({ error: 'Contract end date cannot be earlier than start date' });
      return;
    }

    // OVERLAP VALIDATION: Check for overlapping Active contracts for the same employee
    if (status === 'Active') {
      const activeContracts = await prisma.contract.findMany({
        where: {
          employeeId,
          status: 'Active'
        }
      });

      for (const c of activeContracts) {
        const cStart = new Date(c.startDate);
        const cEnd = c.endDate ? new Date(c.endDate) : new Date('2099-12-31');
        const targetEnd = end ? end : new Date('2099-12-31');

        // Check date overlap: (StartA <= EndB) and (EndA >= StartB)
        if (start <= cEnd && targetEnd >= cStart) {
          res.status(400).json({
            error: `Contract overlaps with existing Active contract (${c.id}) spanning ${cStart.toISOString().slice(0, 10)} to ${c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : 'Open-Ended'}. Please expire or adjust dates.`
          });
          return;
        }
      }
    }

    const contract = await prisma.contract.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        wage: Number(wage),
        salaryStructureId,
        department,
        jobPosition,
        status
      },
      include: {
        employee: true,
        salaryStructure: true
      }
    });

    res.status(201).json(contract);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      wage,
      salaryStructureId,
      department,
      jobPosition,
      status
    } = req.body;

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const start = startDate ? new Date(startDate) : existing.startDate;
    const end = endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate;

    if (end && end < start) {
      res.status(400).json({ error: 'Contract end date cannot be earlier than start date' });
      return;
    }

    // Overlap validation if status is Active
    const targetStatus = status || existing.status;
    if (targetStatus === 'Active') {
      const activeContracts = await prisma.contract.findMany({
        where: {
          employeeId: existing.employeeId,
          status: 'Active',
          id: { not: id }
        }
      });

      for (const c of activeContracts) {
        const cStart = new Date(c.startDate);
        const cEnd = c.endDate ? new Date(c.endDate) : new Date('2099-12-31');
        const targetEnd = end ? end : new Date('2099-12-31');

        if (start <= cEnd && targetEnd >= cStart) {
          res.status(400).json({
            error: `Contract dates overlap with active contract ${c.id}`
          });
          return;
        }
      }
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        startDate: start,
        endDate: end,
        wage: wage !== undefined ? Number(wage) : undefined,
        salaryStructureId: salaryStructureId || undefined,
        department: department || undefined,
        jobPosition: jobPosition || undefined,
        status: targetStatus
      },
      include: {
        employee: true,
        salaryStructure: true
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
