import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TimeOffStatus } from '../types';
import { AuthRequest } from '../middleware/auth';

// ----------------- Time Off Types -----------------
export const listTimeOffTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await prisma.timeOffType.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTimeOffType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, unit = 'Days', requiresAllocation = true, requiresApproval = true, payrollIntegrated = true } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Time off type name is required' });
      return;
    }

    const type = await prisma.timeOffType.create({
      data: {
        name,
        unit,
        requiresAllocation,
        requiresApproval,
        payrollIntegrated
      }
    });

    res.status(201).json(type);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------- Allocations -----------------
export const listAllocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, timeOffTypeId } = req.query;
    const where: any = {};

    if (req.user && req.user.role === 'Employee' && req.user.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (timeOffTypeId) where.timeOffTypeId = String(timeOffTypeId);

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, department: true }
        },
        timeOffType: true
      },
      orderBy: { validFrom: 'desc' }
    });

    res.json(allocations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, timeOffTypeId, allocatedAmount, validFrom, validTo, status = 'Approved' } = req.body;

    if (!employeeId || !timeOffTypeId || allocatedAmount === undefined || !validFrom || !validTo) {
      res.status(400).json({ error: 'All allocation fields are required' });
      return;
    }

    const amount = Number(allocatedAmount);
    const allocation = await prisma.allocation.create({
      data: {
        employeeId,
        timeOffTypeId,
        allocatedAmount: amount,
        takenAmount: 0.0,
        remainingAmount: amount,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        status
      },
      include: {
        employee: true,
        timeOffType: true
      }
    });

    res.status(201).json(allocation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------- Time Off Requests & Live Deduction Flow -----------------
export const listRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, status } = req.query;
    const where: any = {};

    if (req.user && req.user.role === 'Employee' && req.user.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (status && status !== 'All') where.status = String(status);

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, department: true, jobPosition: true }
        },
        timeOffType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;
    const { timeOffTypeId, startDate, endDate, duration, reason } = req.body;

    if (!employeeId || !timeOffTypeId || !startDate || !endDate || duration === undefined) {
      res.status(400).json({ error: 'All request fields are required' });
      return;
    }

    const dur = Number(duration);
    const type = await prisma.timeOffType.findUnique({ where: { id: timeOffTypeId } });
    if (!type) {
      res.status(404).json({ error: 'Time off type not found' });
      return;
    }

    // Check available allocation balance if required
    if (type.requiresAllocation) {
      const activeAllocations = await prisma.allocation.findMany({
        where: {
          employeeId,
          timeOffTypeId,
          status: 'Approved',
          validFrom: { lte: new Date(endDate) },
          validTo: { gte: new Date(startDate) }
        }
      });

      const totalRemaining = activeAllocations.reduce((sum, a) => sum + a.remainingAmount, 0);
      if (totalRemaining < dur) {
        res.status(400).json({
          error: `Insufficient leave balance. Requested: ${dur} ${type.unit}, Available: ${totalRemaining} ${type.unit}`
        });
        return;
      }
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId,
        timeOffTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: dur,
        status: TimeOffStatus.Pending,
        reason: reason || null
      },
      include: {
        employee: true,
        timeOffType: true
      }
    });

    res.status(201).json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approve Time Off Request — LIVE ALLOCATION DEDUCTION
 */
export const approveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.timeOffRequest.findUnique({
        where: { id },
        include: { timeOffType: true }
      });

      if (!request) {
        throw new Error('Time off request not found');
      }

      if (request.status === TimeOffStatus.Approved) {
        throw new Error('Request has already been approved');
      }

      // Deduct from allocation if required
      if (request.timeOffType.requiresAllocation) {
        const allocation = await tx.allocation.findFirst({
          where: {
            employeeId: request.employeeId,
            timeOffTypeId: request.timeOffTypeId,
            status: 'Approved',
            validFrom: { lte: request.endDate },
            validTo: { gte: request.startDate },
            remainingAmount: { gte: request.duration }
          },
          orderBy: { validTo: 'asc' }
        });

        if (!allocation) {
          // Check aggregate if split across allocations
          const allAllocations = await tx.allocation.findMany({
            where: {
              employeeId: request.employeeId,
              timeOffTypeId: request.timeOffTypeId,
              status: 'Approved',
              remainingAmount: { gt: 0 }
            },
            orderBy: { validTo: 'asc' }
          });

          let needed = request.duration;
          for (const alloc of allAllocations) {
            const deduct = Math.min(alloc.remainingAmount, needed);
            await tx.allocation.update({
              where: { id: alloc.id },
              data: {
                takenAmount: alloc.takenAmount + deduct,
                remainingAmount: alloc.remainingAmount - deduct
              }
            });
            needed -= deduct;
            if (needed <= 0) break;
          }

          if (needed > 0) {
            throw new Error(`Insufficient leave balance remaining to approve ${request.duration} ${request.timeOffType.unit}`);
          }
        } else {
          // Single matching allocation
          await tx.allocation.update({
            where: { id: allocation.id },
            data: {
              takenAmount: allocation.takenAmount + request.duration,
              remainingAmount: allocation.remainingAmount - request.duration
            }
          });
        }
      }

      const updatedRequest = await tx.timeOffRequest.update({
        where: { id },
        data: { status: TimeOffStatus.Approved },
        include: { employee: true, timeOffType: true }
      });

      return updatedRequest;
    });

    res.json({
      message: 'Time off request approved and balance deducted successfully',
      request: result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Refuse Time Off Request
 */
export const refuseRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: { status: TimeOffStatus.Refused },
      include: { employee: true, timeOffType: true }
    });

    res.json({ message: 'Request refused', request: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const alloc = await prisma.allocation.findUnique({ where: { id } });
    if (!alloc) {
      res.status(404).json({ error: 'Allocation not found' });
      return;
    }
    await prisma.allocation.delete({ where: { id } });
    res.json({ message: 'Leave allocation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!request) {
      res.status(404).json({ error: 'Time off request not found' });
      return;
    }

    // If approved, restore the deducted quota back to the allocation
    if (request.status === TimeOffStatus.Approved) {
      const alloc = await prisma.allocation.findFirst({
        where: {
          employeeId: request.employeeId,
          timeOffTypeId: request.timeOffTypeId
        }
      });
      if (alloc) {
        await prisma.allocation.update({
          where: { id: alloc.id },
          data: {
            takenAmount: Math.max(0, alloc.takenAmount - request.duration),
            remainingAmount: alloc.remainingAmount + request.duration
          }
        });
      }
    }

    await prisma.timeOffRequest.delete({ where: { id } });
    res.json({ message: 'Time off request deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

