import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface DayInput {
  day: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakMins?: number;
}

// Derive total weekly hours from day patterns
export function calculateWeeklyHours(days: DayInput[]): number {
  let totalMinutes = 0;

  for (const d of days) {
    if (!d.startTime || !d.endTime) continue;
    const [startH, startM] = d.startTime.split(':').map(Number);
    const [endH, endM] = d.endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const breakMins = d.breakMins || 0;

    let dayWorkMins = endTotal - startTotal - breakMins;
    if (dayWorkMins < 0) dayWorkMins = 0;
    totalMinutes += dayWorkMins;
  }

  return Math.round((totalMinutes / 60) * 10) / 10;
}

export const listSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.workingSchedule.findMany({
      include: {
        days: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(schedules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        days: true,
        employees: {
          select: { id: true, name: true, department: true, jobPosition: true }
        }
      }
    });

    if (!schedule) {
      res.status(404).json({ error: 'Working Schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type = 'Standard', days = [] } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Schedule name is required' });
      return;
    }

    // Auto-calculate weekly hours
    const totalWeeklyHours = calculateWeeklyHours(days);

    const schedule = await prisma.workingSchedule.create({
      data: {
        name,
        type,
        totalWeeklyHours,
        days: {
          create: days.map((d: DayInput) => ({
            day: d.day,
            startTime: d.startTime,
            endTime: d.endTime,
            breakMins: d.breakMins || 60
          }))
        }
      },
      include: {
        days: true
      }
    });

    res.status(201).json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, days } = req.body;

    let totalWeeklyHours: number | undefined = undefined;

    if (days && Array.isArray(days)) {
      totalWeeklyHours = calculateWeeklyHours(days);
    }

    // Transaction to update schedule and refresh days
    const result = await prisma.$transaction(async (tx) => {
      if (days && Array.isArray(days)) {
        await tx.workingScheduleDay.deleteMany({
          where: { workingScheduleId: id }
        });
        await tx.workingScheduleDay.createMany({
          data: days.map((d: DayInput) => ({
            workingScheduleId: id,
            day: d.day,
            startTime: d.startTime,
            endTime: d.endTime,
            breakMins: d.breakMins || 60
          }))
        });
      }

      return tx.workingSchedule.update({
        where: { id },
        data: {
          name: name || undefined,
          type: type || undefined,
          totalWeeklyHours: totalWeeklyHours !== undefined ? totalWeeklyHours : undefined
        },
        include: { days: true }
      });
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.workingSchedule.delete({ where: { id } });
    res.json({ message: 'Working Schedule deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
