import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface PayslipPdfData {
  payslipId: string;
  payrunName: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  employee: {
    name: string;
    email?: string | null;
    department: string;
    jobPosition: string;
  };
  contract: {
    wage: number;
  };
  workedDays: number;
  grossTotal: number;
  netTotal: number;
  lines: Array<{
    name: string;
    code: string;
    category: string;
    amount: number;
  }>;
  warnings?: Array<{
    message: string;
    type: string;
  }>;
}

export function generatePayslipPdfBuffer(data: PayslipPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header Branding
      doc.rect(40, 40, 515, 60).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('PeoplePay360', 60, 52);
      doc.fontSize(10).font('Helvetica').text('CONFIDENTIAL EMPLOYEE PAYSLIP', 60, 78);

      doc.fillColor('#94A3B8').fontSize(9).text(`Payrun: ${data.payrunName}`, 380, 52, { align: 'right', width: 155 });
      doc.text(`Period: ${data.periodStart} to ${data.periodEnd}`, 380, 68, { align: 'right', width: 155 });
      doc.text(`Status: ${data.status.toUpperCase()}`, 380, 84, { align: 'right', width: 155 });

      // Employee Information Box
      doc.moveDown(3);
      const startY = 120;
      doc.rect(40, startY, 515, 75).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text(data.employee.name, 60, startY + 12);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Role: ${data.employee.jobPosition}`, 60, startY + 30);
      doc.text(`Department: ${data.employee.department}`, 60, startY + 45);
      doc.text(`Email: ${data.employee.email || 'N/A'}`, 60, startY + 60);

      doc.font('Helvetica').fillColor('#64748B').text(`Base Wage: INR ${data.contract.wage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 340, startY + 15);
      doc.text(`Worked Days: ${data.workedDays} days`, 340, startY + 30);
      doc.text(`Payslip ID: ${data.payslipId.slice(0, 8)}...`, 340, startY + 45);

      // Rule Breakdown Table
      let tableY = 215;
      doc.rect(40, tableY, 515, 24).fill('#3B82F6');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('EARNINGS & ALLOWANCES', 55, tableY + 7);
      doc.text('CODE', 240, tableY + 7);
      doc.text('CATEGORY', 340, tableY + 7);
      doc.text('AMOUNT (INR)', 450, tableY + 7, { width: 90, align: 'right' });

      tableY += 28;

      let isAlternate = false;
      for (const line of data.lines) {
        if (isAlternate) {
          doc.rect(40, tableY - 4, 515, 20).fill('#F1F5F9');
        }
        isAlternate = !isAlternate;

        const isDeduction = line.category.toLowerCase() === 'deduction';
        doc.fillColor(isDeduction ? '#DC2626' : '#0F172A').fontSize(9).font('Helvetica');
        doc.text(line.name, 55, tableY);
        doc.fillColor('#64748B').text(line.code, 240, tableY);
        doc.text(line.category, 340, tableY);

        doc.fillColor(isDeduction ? '#DC2626' : '#0F172A').font('Helvetica-Bold');
        const formattedAmt = `${isDeduction ? '-' : ''}INR ${Math.abs(line.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        doc.text(formattedAmt, 440, tableY, { width: 100, align: 'right' });

        tableY += 20;
      }

      // Summary Box
      tableY += 10;
      doc.rect(40, tableY, 515, 65).fillAndStroke('#F8FAFC', '#CBD5E1');

      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text('Gross Earnings:', 300, tableY + 12);
      doc.text(`INR ${data.grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, tableY + 12, { align: 'right', width: 110 });

      doc.fontSize(13).fillColor('#059669').font('Helvetica-Bold').text('NET PAY (TAKE-HOME):', 230, tableY + 36);
      doc.fontSize(14).text(`INR ${data.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 410, tableY + 34, { align: 'right', width: 130 });

      // Warnings (if any)
      if (data.warnings && data.warnings.length > 0) {
        tableY += 80;
        doc.fillColor('#D97706').fontSize(9).font('Helvetica-Bold').text('SYSTEM AUDIT NOTES / WARNINGS:', 40, tableY);
        tableY += 14;
        for (const w of data.warnings) {
          doc.fillColor('#78350F').fontSize(8).font('Helvetica').text(`• [${w.type}] ${w.message}`, 50, tableY);
          tableY += 12;
        }
      }

      // Footer
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
        'Generated securely by PeoplePay360 HR & Payroll Engine • This is a computer-generated document requiring no signature.',
        40,
        780,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
