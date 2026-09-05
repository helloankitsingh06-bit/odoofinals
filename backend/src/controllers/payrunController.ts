import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { computeEmployeePayslip, RuleDefinition } from '../services/payrollEngine';
import { generatePayslipPdfBuffer, PayslipPdfData } from '../services/pdfService';
import { sendPayslipEmail } from '../services/emailService';
import { PayrunStatus, WarningType, Role } from '../types';
import { AuthRequest } from '../middleware/auth';

/**
 * Step 1 Wizard Preview (Staged - No DB writes)
 * Identifies eligible employees with active contracts matching the period and salary structure
 */
export const previewPayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { salaryStructureId, periodStart, periodEnd } = req.body;

    if (!salaryStructureId || !periodStart || !periodEnd) {
      res.status(400).json({ error: 'Salary structure, period start, and period end are required' });
      return;
    }

    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);

    // Find all active contracts that match this structure
    const contracts = await prisma.contract.findMany({
      where: {
        salaryStructureId,
        status: 'Active',
        OR: [
          { endDate: null },
          { endDate: { gte: pStart } }
        ]
      },
      include: {
        employee: {
          include: {
            workingSchedule: true
          }
        },
        salaryStructure: true
      }
    });

    // Check for existing payslips in the same period to prevent duplicates
    const existingPayslips = await prisma.payslip.findMany({
      where: {
        periodStart: pStart,
        periodEnd: pEnd
      }
    });
    const paidEmployeeIds = new Set(existingPayslips.map(p => p.employeeId));

    const eligibleEmployees = [];
    const excludedEmployees = [];

    for (const c of contracts) {
      const alreadyHasPayslip = paidEmployeeIds.has(c.employeeId);
      const contractStartDate = new Date(c.startDate);

      // Eligibility Requirement 1: Contract must start on or before the payrun period start date
      const hasCompletedServiceTenure = contractStartDate <= pStart;

      // Eligibility Requirement 2: Must have active office attendance / worked days logged during this month
      const attendancesInPeriod = await prisma.attendance.findMany({
        where: {
          employeeId: c.employeeId,
          checkIn: {
            gte: pStart,
            lte: pEnd
          }
        }
      });

      const totalWorkedHours = attendancesInPeriod.reduce((sum, a) => sum + (a.workedHours || 0), 0);
      const isPresentInMonth = attendancesInPeriod.length > 0;

      const empData = {
        employeeId: c.employee.id,
        name: c.employee.name,
        department: c.employee.department,
        jobPosition: c.employee.jobPosition,
        contractId: c.id,
        wage: c.wage,
        contractStartDate: c.startDate,
        workedDays: attendancesInPeriod.length,
        totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
        alreadyProcessed: alreadyHasPayslip
      };

      if (alreadyHasPayslip) {
        excludedEmployees.push({
          ...empData,
          reason: 'Employee already has a payslip generated for this exact period'
        });
      } else if (!hasCompletedServiceTenure) {
        excludedEmployees.push({
          ...empData,
          reason: `Contract started on ${contractStartDate.toLocaleDateString()} (after pay cycle start date ${pStart.toLocaleDateString()}). Must complete active service period before payroll eligibility.`
        });
      } else if (!isPresentInMonth) {
        excludedEmployees.push({
          ...empData,
          reason: `No attendance records logged for this month (${pStart.toLocaleDateString()} - ${pEnd.toLocaleDateString()}). Employee was not present in the office.`
        });
      } else {
        eligibleEmployees.push(empData);
      }
    }

    res.json({
      salaryStructureId,
      periodStart,
      periodEnd,
      totalFound: contracts.length,
      eligibleCount: eligibleEmployees.length,
      excludedCount: excludedEmployees.length,
      eligibleEmployees,
      excludedEmployees
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Step 2 Wizard Confirmation: Create Payrun in Draft Status
 */
export const createPayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = req.body;

    if (!name || !salaryStructureId || !periodStart || !periodEnd || !employeeIds || !Array.isArray(employeeIds)) {
      res.status(400).json({ error: 'Name, salary structure, period dates, and selected employee IDs are required' });
      return;
    }

    if (employeeIds.length === 0) {
      res.status(400).json({ error: 'At least one eligible employee must be included in the payrun' });
      return;
    }

    // Verify employee eligibility (contract started on or before periodStart)
    const validContracts = await prisma.contract.findMany({
      where: {
        employeeId: { in: employeeIds },
        salaryStructureId,
        status: 'Active',
        startDate: { lte: new Date(periodStart) },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(periodStart) } }
        ]
      }
    });

    if (validContracts.length === 0) {
      res.status(400).json({ error: 'None of the selected employees have completed the required tenure (contract start date must be on or before the pay period start date)' });
      return;
    }

    const validEmployeeIds = validContracts.map(c => c.employeeId);

    const payrun = await prisma.payrun.create({
      data: {
        name,
        salaryStructureId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: PayrunStatus.Draft,
        employees: {
          create: validEmployeeIds.map((empId: string) => ({
            employeeId: empId
          }))
        }
      },
      include: {
        salaryStructure: true,
        employees: {
          include: {
            employee: true
          }
        }
      }
    });

    res.status(201).json(payrun);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listPayruns = async (req: Request, res: Response): Promise<void> => {
  try {
    const payruns = await prisma.payrun.findMany({
      include: {
        salaryStructure: true,
        employees: {
          include: { employee: true }
        },
        payslips: {
          select: {
            id: true,
            employeeId: true,
            grossTotal: true,
            netTotal: true,
            status: true,
            warnings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payruns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getPayrunById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: {
          include: {
            rules: {
              orderBy: { position: 'asc' },
              include: { salaryRule: true }
            }
          }
        },
        employees: {
          include: { employee: true }
        },
        payslips: {
          include: {
            employee: true,
            contract: true,
            lines: {
              include: { salaryRule: true }
            },
            warnings: true
          }
        }
      }
    });

    if (!payrun) {
      res.status(404).json({ error: 'Payrun not found' });
      return;
    }

    res.json(payrun);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Action: Compute Payrun
 * Runs the deterministic payroll engine for each employee, creating or replacing payslip & rule lines
 */
export const computePayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: {
          include: {
            rules: {
              orderBy: { position: 'asc' },
              include: { salaryRule: true }
            }
          }
        },
        employees: {
          include: { employee: true }
        }
      }
    });

    if (!payrun) {
      res.status(404).json({ error: 'Payrun not found' });
      return;
    }

    if (payrun.status === PayrunStatus.Paid) {
      res.status(400).json({ error: 'Cannot recompute a Paid payrun' });
      return;
    }

    const structureRules: RuleDefinition[] = payrun.salaryStructure.rules.map(r => ({
      id: r.salaryRule.id,
      name: r.salaryRule.name,
      code: r.salaryRule.code,
      category: r.salaryRule.category,
      sequence: r.salaryRule.sequence,
      computeType: r.salaryRule.computeType,
      value: r.salaryRule.value,
      formula: r.salaryRule.formula,
      position: r.position
    }));

    // Process each employee idempotently
    for (const pe of payrun.employees) {
      const employee = pe.employee;

      // Find period-applicable contract
      const contracts = await prisma.contract.findMany({
        where: {
          employeeId: employee.id,
          status: 'Active',
          startDate: { lte: payrun.periodEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: payrun.periodStart } }
          ]
        },
        orderBy: { startDate: 'desc' }
      });

      let contract = contracts[0];
      const extraWarnings = [];

      if (!contract) {
        // Fallback to any contract or latest
        const fallback = await prisma.contract.findFirst({
          where: { employeeId: employee.id },
          orderBy: { startDate: 'desc' }
        });
        if (!fallback) {
          throw new Error(`No contract found for employee ${employee.name} (${employee.id})`);
        }
        contract = fallback;
        extraWarnings.push({
          message: 'No active contract specifically covering this period; using latest contract record',
          type: WarningType.Warning
        });
      }

      // Fetch attendances in period
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          checkIn: {
            gte: payrun.periodStart,
            lte: payrun.periodEnd
          }
        }
      });

      // Run Pure Computation Engine
      const calculation = computeEmployeePayslip({
        employee: {
          id: employee.id,
          name: employee.name,
          department: employee.department,
          jobPosition: employee.jobPosition
        },
        contract: {
          id: contract.id,
          employeeId: employee.id,
          wage: contract.wage,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          salaryStructureId: contract.salaryStructureId
        },
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        attendances,
        rules: structureRules
      });

      // Merge extra warnings
      const allWarnings = [...calculation.warnings, ...extraWarnings];

      // Upsert Payslip
      const existingPayslip = await prisma.payslip.findUnique({
        where: {
          payrunId_employeeId: {
            payrunId: payrun.id,
            employeeId: employee.id
          }
        }
      });

      if (existingPayslip) {
        // Clear old rule lines and warnings
        await prisma.payslipRuleLine.deleteMany({ where: { payslipId: existingPayslip.id } });
        await prisma.payslipWarning.deleteMany({ where: { payslipId: existingPayslip.id } });

        await prisma.payslip.update({
          where: { id: existingPayslip.id },
          data: {
            contractId: contract.id,
            periodStart: payrun.periodStart,
            periodEnd: payrun.periodEnd,
            workedDays: calculation.workedDays,
            grossTotal: calculation.grossTotal,
            netTotal: calculation.netTotal,
            status: PayrunStatus.Computed,
            lines: {
              create: calculation.ruleLines.map(l => ({
                salaryRuleId: l.salaryRuleId,
                name: l.name,
                code: l.code,
                category: l.category,
                amount: l.amount
              }))
            },
            warnings: {
              create: allWarnings.map(w => ({
                message: w.message,
                type: w.type
              }))
            }
          }
        });
      } else {
        await prisma.payslip.create({
          data: {
            payrunId: payrun.id,
            employeeId: employee.id,
            contractId: contract.id,
            periodStart: payrun.periodStart,
            periodEnd: payrun.periodEnd,
            workedDays: calculation.workedDays,
            grossTotal: calculation.grossTotal,
            netTotal: calculation.netTotal,
            status: PayrunStatus.Computed,
            lines: {
              create: calculation.ruleLines.map(l => ({
                salaryRuleId: l.salaryRuleId,
                name: l.name,
                code: l.code,
                category: l.category,
                amount: l.amount
              }))
            },
            warnings: {
              create: allWarnings.map(w => ({
                message: w.message,
                type: w.type
              }))
            }
          }
        });
      }
    }

    // Update Payrun status to Computed
    const updatedPayrun = await prisma.payrun.update({
      where: { id: payrun.id },
      data: { status: PayrunStatus.Computed },
      include: {
        payslips: {
          include: { lines: true, warnings: true, employee: true }
        }
      }
    });

    res.json({
      message: `Successfully computed ${updatedPayrun.payslips.length} payslips`,
      payrun: updatedPayrun
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Action: Validate Payrun
 * Rolls up warnings, checks for blocking errors, transitions status to Validated
 */
export const validatePayrun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: { warnings: true, employee: true }
        }
      }
    });

    if (!payrun) {
      res.status(404).json({ error: 'Payrun not found' });
      return;
    }

    if (payrun.payslips.length === 0) {
      res.status(400).json({ error: 'Cannot validate a payrun with no computed payslips. Please run Compute first.' });
      return;
    }

    let hardErrorsCount = 0;
    let warningsCount = 0;
    const warningSummary: Array<{ employeeName: string; message: string; type: string }> = [];

    for (const p of payrun.payslips) {
      for (const w of p.warnings) {
        if (w.type === WarningType.Error) hardErrorsCount++;
        if (w.type === WarningType.Warning) warningsCount++;
        warningSummary.push({
          employeeName: p.employee.name,
          message: w.message,
          type: w.type
        });
      }
    }

    if (hardErrorsCount > 0) {
      res.status(400).json({
        error: `Validation failed: Found ${hardErrorsCount} blocking errors in payrun`,
        warningsCount,
        warningSummary
      });
      return;
    }

    // Update Payrun and child payslips to Validated
    await prisma.payslip.updateMany({
      where: { payrunId: payrun.id },
      data: { status: PayrunStatus.Validated }
    });

    const updatedPayrun = await prisma.payrun.update({
      where: { id: payrun.id },
      data: { status: PayrunStatus.Validated },
      include: {
        payslips: {
          include: { warnings: true, lines: true, employee: true }
        }
      }
    });

    res.json({
      message: 'Payrun validated successfully',
      warningsCount,
      warningSummary,
      payrun: updatedPayrun
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Action: Mark as Paid
 * High privilege action (HRPayrollManager or Admin)
 */
export const markPayrunPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: { payslips: true }
    });

    if (!payrun) {
      res.status(404).json({ error: 'Payrun not found' });
      return;
    }

    if (payrun.status !== PayrunStatus.Validated && payrun.status !== PayrunStatus.Computed) {
      res.status(400).json({ error: `Payrun must be Validated before marking as Paid (Current status: ${payrun.status})` });
      return;
    }

    await prisma.payslip.updateMany({
      where: { payrunId: payrun.id },
      data: { status: PayrunStatus.Paid }
    });

    const updated = await prisma.payrun.update({
      where: { id: payrun.id },
      data: { status: PayrunStatus.Paid },
      include: {
        payslips: {
          include: { employee: true, lines: true }
        }
      }
    });

    res.json({
      message: `Payrun and ${updated.payslips.length} payslips marked as Paid`,
      payrun: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Action: Bulk Send Payslips via Email & PDF
 */
export const sendPayrunPayslips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: true,
            contract: true,
            lines: true,
            warnings: true
          }
        }
      }
    });

    if (!payrun) {
      res.status(404).json({ error: 'Payrun not found' });
      return;
    }

    const sendResults = [];

    for (const payslip of payrun.payslips) {
      const pData: PayslipPdfData = {
        payslipId: payslip.id,
        payrunName: payrun.name,
        periodStart: new Date(payslip.periodStart).toISOString().slice(0, 10),
        periodEnd: new Date(payslip.periodEnd).toISOString().slice(0, 10),
        status: payslip.status,
        employee: {
          name: payslip.employee.name,
          email: payslip.employee.email,
          department: payslip.employee.department,
          jobPosition: payslip.employee.jobPosition
        },
        contract: {
          wage: payslip.contract.wage
        },
        workedDays: payslip.workedDays,
        grossTotal: payslip.grossTotal,
        netTotal: payslip.netTotal,
        lines: payslip.lines.map(l => ({
          name: l.name,
          code: l.code,
          category: l.category,
          amount: l.amount
        })),
        warnings: payslip.warnings.map(w => ({
          message: w.message,
          type: w.type
        }))
      };

      const pdfBuffer = await generatePayslipPdfBuffer(pData);
      const recipientEmail = payslip.employee.email || `${payslip.employee.name.toLowerCase().replace(/\s+/g, '.')}@peoplepay360.com`;

      const emailResult = await sendPayslipEmail({
        to: recipientEmail,
        subject: `Your Payslip for ${payrun.name} (${pData.periodStart} - ${pData.periodEnd})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b;">Hello ${payslip.employee.name},</h2>
            <p>Your official payslip for <strong>${payrun.name}</strong> is now available.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 4px 0;"><strong>Period:</strong> ${pData.periodStart} to ${pData.periodEnd}</p>
              <p style="margin: 4px 0;"><strong>Gross Pay:</strong> $${payslip.grossTotal.toFixed(2)}</p>
              <p style="margin: 4px 0; color: #059669; font-size: 16px;"><strong>Net Take-Home Pay:</strong> $${payslip.netTotal.toFixed(2)}</p>
            </div>
            <p>Please find attached your comprehensive itemized payslip PDF.</p>
            <p style="color: #64748b; font-size: 12px;">PeoplePay360 Automated Payroll Dispatch</p>
          </div>
        `,
        attachments: [
          {
            filename: `Payslip_${payslip.employee.name.replace(/\s+/g, '_')}_${pData.periodStart}.pdf`,
            content: pdfBuffer
          }
        ]
      });

      // Update email sent timestamp
      await prisma.payslip.update({
        where: { id: payslip.id },
        data: { emailSentAt: new Date() }
      });

      sendResults.push({
        employeeId: payslip.employee.id,
        employeeName: payslip.employee.name,
        email: recipientEmail,
        status: emailResult.status,
        success: emailResult.success,
        error: emailResult.error
      });
    }

    res.json({
      message: `Dispatched payslips to ${sendResults.length} employees`,
      sendResults
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Download Payslip PDF
 */
export const downloadPayslipPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        payrun: true,
        employee: true,
        contract: true,
        lines: true,
        warnings: true
      }
    });

    if (!payslip) {
      res.status(404).json({ error: 'Payslip not found' });
      return;
    }

    const pData: PayslipPdfData = {
      payslipId: payslip.id,
      payrunName: payslip.payrun.name,
      periodStart: new Date(payslip.periodStart).toISOString().slice(0, 10),
      periodEnd: new Date(payslip.periodEnd).toISOString().slice(0, 10),
      status: payslip.status,
      employee: {
        name: payslip.employee.name,
        email: payslip.employee.email,
        department: payslip.employee.department,
        jobPosition: payslip.employee.jobPosition
      },
      contract: {
        wage: payslip.contract.wage
      },
      workedDays: payslip.workedDays,
      grossTotal: payslip.grossTotal,
      netTotal: payslip.netTotal,
      lines: payslip.lines.map(l => ({
        name: l.name,
        code: l.code,
        category: l.category,
        amount: l.amount
      })),
      warnings: payslip.warnings.map(w => ({
        message: w.message,
        type: w.type
      }))
    };

    const pdfBuffer = await generatePayslipPdfBuffer(pData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payslip.employee.name.replace(/\s+/g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
