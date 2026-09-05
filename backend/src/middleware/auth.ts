import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, AuthenticatedUser } from '../types';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-super-secret-jwt-key-2026-hackathon';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`
      });
      return;
    }

    next();
  };
};

export const requireSelfOrRoles = (targetEmployeeIdGetter: (req: Request) => string | undefined, ...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User is not authenticated' });
      return;
    }

    const targetEmpId = targetEmployeeIdGetter(req);

    // If user's own employee ID matches target, or user role is permitted
    if (req.user.employeeId && targetEmpId && req.user.employeeId === targetEmpId) {
      next();
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Access forbidden: Cannot access records for other employees`
    });
  };
};
