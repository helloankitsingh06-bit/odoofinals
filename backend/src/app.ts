import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import contractRoutes from './routes/contractRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import timeOffRoutes from './routes/timeOffRoutes';
import salaryStructureRoutes from './routes/salaryStructureRoutes';
import payrunRoutes from './routes/payrunRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app: Express = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'PeoplePay360', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/salary-structures', salaryStructureRoutes);
app.use('/api/payruns', payrunRoutes);
app.use('/api/dashboard', dashboardRoutes);

export default app;
