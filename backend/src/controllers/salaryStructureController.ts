import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { validateSalaryStructureRules, RuleDefinition } from '../services/payrollEngine';

// ----------------- Salary Rules -----------------
export const listSalaryRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await prisma.salaryRule.findMany({
      orderBy: { sequence: 'asc' }
    });
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, category, sequence = 1, computeType, value, formula } = req.body;

    if (!name || !code || !category || !computeType) {
      res.status(400).json({ error: 'Name, code, category, and computeType are required' });
      return;
    }

    if (sequence < 0) {
      res.status(400).json({ error: 'Sequence number cannot be negative' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.salaryRule.findUnique({ where: { code: cleanCode } });
    if (existing) {
      res.status(400).json({ error: `Salary rule with code '${cleanCode}' already exists` });
      return;
    }

    const rule = await prisma.salaryRule.create({
      data: {
        name,
        code: cleanCode,
        category,
        sequence: Number(sequence),
        computeType,
        value: value !== undefined && value !== null ? Number(value) : null,
        formula: formula || null
      }
    });

    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, category, sequence, computeType, value, formula } = req.body;

    if (sequence !== undefined && sequence < 0) {
      res.status(400).json({ error: 'Sequence number cannot be negative' });
      return;
    }

    let cleanCode: string | undefined = undefined;
    if (code) {
      cleanCode = code.trim().toUpperCase();
      const existing = await prisma.salaryRule.findFirst({
        where: { code: cleanCode, id: { not: id } }
      });
      if (existing) {
        res.status(400).json({ error: `Salary rule with code '${cleanCode}' already exists` });
        return;
      }
    }

    const updated = await prisma.salaryRule.update({
      where: { id },
      data: {
        name: name || undefined,
        code: cleanCode,
        category: category || undefined,
        sequence: sequence !== undefined ? Number(sequence) : undefined,
        computeType: computeType || undefined,
        value: value !== undefined ? (value === null ? null : Number(value)) : undefined,
        formula: formula !== undefined ? formula : undefined
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.salaryRule.delete({ where: { id } });
    res.json({ message: 'Salary rule deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------- Salary Structures -----------------
export const listSalaryStructures = async (req: Request, res: Response): Promise<void> => {
  try {
    const structures = await prisma.salaryStructure.findMany({
      include: {
        rules: {
          orderBy: { position: 'asc' },
          include: { salaryRule: true }
        },
        _count: {
          select: { contracts: true, payruns: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(structures);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSalaryStructureById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const structure = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          orderBy: { position: 'asc' },
          include: { salaryRule: true }
        },
        contracts: {
          include: { employee: true }
        }
      }
    });

    if (!structure) {
      res.status(404).json({ error: 'Salary structure not found' });
      return;
    }

    res.json(structure);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Dry-run Structure Validation Endpoint
 */
export const validateStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ruleIds } = req.body; // array of rule IDs in explicit sequence order

    if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
      res.status(400).json({ valid: false, errors: ['At least one rule is required'] });
      return;
    }

    // Fetch all rules
    const rules = await prisma.salaryRule.findMany({
      where: { id: { in: ruleIds } }
    });

    // Map according to given ordered array
    const orderedRules: RuleDefinition[] = [];
    for (let i = 0; i < ruleIds.length; i++) {
      const r = rules.find(x => x.id === ruleIds[i]);
      if (!r) {
        res.status(400).json({ valid: false, errors: [`Rule ID '${ruleIds[i]}' does not exist`] });
        return;
      }
      orderedRules.push({
        id: r.id,
        name: r.name,
        code: r.code,
        category: r.category,
        sequence: r.sequence,
        computeType: r.computeType,
        value: r.value,
        formula: r.formula,
        position: i + 1
      });
    }

    const validation = validateSalaryStructureRules(orderedRules);
    res.json(validation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status = 'Active', ruleIds = [] } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Structure name is required' });
      return;
    }

    // Fetch rules to validate
    const rules = await prisma.salaryRule.findMany({
      where: { id: { in: ruleIds } }
    });

    const orderedRules: RuleDefinition[] = [];
    for (let i = 0; i < ruleIds.length; i++) {
      const r = rules.find(x => x.id === ruleIds[i]);
      if (!r) {
        res.status(400).json({ error: `Rule ID '${ruleIds[i]}' not found` });
        return;
      }
      orderedRules.push({
        id: r.id,
        name: r.name,
        code: r.code,
        category: r.category,
        sequence: r.sequence,
        computeType: r.computeType,
        value: r.value,
        formula: r.formula,
        position: i + 1
      });
    }

    // Dry-run validate
    const validation = validateSalaryStructureRules(orderedRules);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Salary structure validation failed',
        details: validation.errors
      });
      return;
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        name,
        status,
        rules: {
          create: ruleIds.map((ruleId: string, idx: number) => ({
            salaryRuleId: ruleId,
            position: idx + 1
          }))
        }
      },
      include: {
        rules: {
          orderBy: { position: 'asc' },
          include: { salaryRule: true }
        }
      }
    });

    res.status(201).json(structure);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, status, ruleIds } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      if (ruleIds && Array.isArray(ruleIds)) {
        const rules = await tx.salaryRule.findMany({
          where: { id: { in: ruleIds } }
        });

        const orderedRules: RuleDefinition[] = [];
        for (let i = 0; i < ruleIds.length; i++) {
          const r = rules.find(x => x.id === ruleIds[i]);
          if (!r) throw new Error(`Rule ID '${ruleIds[i]}' not found`);
          orderedRules.push({
            id: r.id,
            name: r.name,
            code: r.code,
            category: r.category,
            sequence: r.sequence,
            computeType: r.computeType,
            value: r.value,
            formula: r.formula,
            position: i + 1
          });
        }

        const validation = validateSalaryStructureRules(orderedRules);
        if (!validation.valid) {
          throw new Error(`Structure validation failed: ${validation.errors.join('; ')}`);
        }

        // Delete existing rule relations
        await tx.salaryStructureRule.deleteMany({
          where: { salaryStructureId: id }
        });

        // Insert new ordered positions
        for (let idx = 0; idx < ruleIds.length; idx++) {
          await tx.salaryStructureRule.create({
            data: {
              salaryStructureId: id,
              salaryRuleId: ruleIds[idx],
              position: idx + 1
            }
          });
        }
      }

      return tx.salaryStructure.update({
        where: { id },
        data: {
          name: name || undefined,
          status: status || undefined
        },
        include: {
          rules: {
            orderBy: { position: 'asc' },
            include: { salaryRule: true }
          }
        }
      });
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.salaryStructure.delete({ where: { id } });
    res.json({ message: 'Salary structure deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
