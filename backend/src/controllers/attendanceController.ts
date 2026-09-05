import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AttendanceStatus } from '../types';
import { AuthRequest } from '../middleware/auth';

function calculateWorkedHours(checkIn: Date, checkOut?: Date | null): number {
  if (!checkOut) return 0.0;
  const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.max(0, Math.round(hours * 10) / 10);
}

export const listAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const where: any = {};

    // If Employee role, restrict to their own attendance
    if (req.user && req.user.role === 'Employee' && req.user.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (status && status !== 'All') where.status = String(status);

    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = new Date(String(startDate));
      if (endDate) where.checkIn.lte = new Date(String(endDate));
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, department: true, jobPosition: true }
        }
      },
      orderBy: { checkIn: 'desc' }
    });

    res.json(attendances);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;

    if (!employeeId) {
      res.status(400).json({ error: 'Employee ID is required' });
      return;
    }

    // Check if open attendance exists
    const openAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null
      }
    });

    if (openAttendance) {
      res.status(400).json({
        error: 'Active check-in session already exists. Please check out first.',
        attendance: openAttendance
      });
      return;
    }

    const now = new Date();
    // Default status: check time (after 9:30 AM is Late)
    const hour = now.getHours();
    const min = now.getMinutes();
    const isLate = (hour > 9) || (hour === 9 && min > 30);

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: now,
        status: isLate ? AttendanceStatus.Late : AttendanceStatus.Present,
        workedHours: 0
      },
      include: {
        employee: true
      }
    });

    res.status(201).json(attendance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;

    if (!employeeId) {
      res.status(400).json({ error: 'Employee ID is required' });
      return;
    }

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null
      },
      orderBy: { checkIn: 'desc' }
    });

    if (!openAttendance) {
      res.status(404).json({ error: 'No active check-in session found to check out from.' });
      return;
    }

    const now = new Date();
    const workedHours = calculateWorkedHours(openAttendance.checkIn, now);

    let finalStatus = openAttendance.status;
    if (workedHours >= 9.5) {
      finalStatus = AttendanceStatus.Overtime;
    }

    const updated = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: {
        checkOut: now,
        workedHours,
        status: finalStatus
      },
      include: { employee: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createManualAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, checkIn, checkOut, status = 'Present' } = req.body;

    if (!employeeId || !checkIn) {
      res.status(400).json({ error: 'Employee and check-in date/time are required' });
      return;
    }

    const inDate = new Date(checkIn);
    if (isNaN(inDate.getTime())) {
      res.status(400).json({ error: 'Invalid check-in date/time format' });
      return;
    }

    let outDate: Date | null = null;
    if (checkOut && typeof checkOut === 'string' && checkOut.trim()) {
      outDate = new Date(checkOut);
      if (isNaN(outDate.getTime())) {
        res.status(400).json({ error: 'Invalid check-out date/time format' });
        return;
      }
      if (outDate < inDate) {
        res.status(400).json({ error: 'Check-out time cannot be earlier than check-in time' });
        return;
      }
    }

    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    const workedHours = calculateWorkedHours(inDate, outDate);

    let calculatedStatus = status;
    if (!outDate && status !== AttendanceStatus.Absent) {
      calculatedStatus = AttendanceStatus.MissingCheckout;
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: inDate,
        checkOut: outDate,
        workedHours,
        status: calculatedStatus,
        isManualEdit: true
      },
      include: { employee: true }
    });

    res.status(201).json(attendance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status } = req.body;

    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    let inDate = existing.checkIn;
    if (checkIn) {
      inDate = new Date(checkIn);
      if (isNaN(inDate.getTime())) {
        res.status(400).json({ error: 'Invalid check-in date/time format' });
        return;
      }
    }

    let outDate = existing.checkOut;
    if (checkOut !== undefined) {
      if (checkOut && typeof checkOut === 'string' && checkOut.trim()) {
        outDate = new Date(checkOut);
        if (isNaN(outDate.getTime())) {
          res.status(400).json({ error: 'Invalid check-out date/time format' });
          return;
        }
        if (outDate < inDate) {
          res.status(400).json({ error: 'Check-out time cannot be earlier than check-in time' });
          return;
        }
      } else {
        outDate = null;
      }
    }

    const workedHours = calculateWorkedHours(inDate, outDate);

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        checkIn: inDate,
        checkOut: outDate,
        workedHours,
        status: status || existing.status,
        isManualEdit: true
      },
      include: { employee: true }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({ where: { id } });
    res.json({ message: 'Attendance record deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
