import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Check,
  X,
  Plus,
  AlertCircle,
  Sparkles,
  Award,
  Clock,
  Search,
  ChevronDown,
  User,
  Layers,
  CheckCircle2,
  HelpCircle,
  Edit2,
  Lock,
  Users
} from 'lucide-react';

interface EmployeeLeaveTypeRow {
  typeId: string;
  typeName: string;
  unit: string;
  allocationId?: string;
  allocatedAmount: number;
  initialAllocatedAmount: number;
  takenAmount: number;
  validFrom: string;
  validTo: string;
  error?: string | null;
  saved?: boolean;
}

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const [types, setTypes] = useState<any[]>([]);
  const [typesWithBalances, setTypesWithBalances] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [showAllocationModal, setShowAllocationModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 3-Dropdown Leave Allocation Modal State (Unified Box with 3 Repeated Dropdowns & Description Box)
  const defaultYearStart = `${new Date().getFullYear()}-01-01`;
  const defaultYearEnd = `${new Date().getFullYear()}-12-31`;

  const [modalEmployeeId, setModalEmployeeId] = useState<string>('');
  const [slot1, setSlot1] = useState<{ typeId: string; amount: number; initialAmount: number; taken: number; validFrom: string; validTo: string; allocationId?: string; error?: string | null }>({
    typeId: '',
    amount: 20,
    initialAmount: 0,
    taken: 0,
    validFrom: defaultYearStart,
    validTo: defaultYearEnd
  });
  const [slot2, setSlot2] = useState<{ typeId: string; amount: number; initialAmount: number; taken: number; validFrom: string; validTo: string; allocationId?: string; error?: string | null }>({
    typeId: '',
    amount: 10,
    initialAmount: 0,
    taken: 0,
    validFrom: defaultYearStart,
    validTo: defaultYearEnd
  });
  const [slot3, setSlot3] = useState<{ typeId: string; amount: number; initialAmount: number; taken: number; validFrom: string; validTo: string; allocationId?: string; error?: string | null }>({
    typeId: '',
    amount: 0,
    initialAmount: 0,
    taken: 0,
    validFrom: defaultYearStart,
    validTo: defaultYearEnd
  });
  const [allocationDescription, setAllocationDescription] = useState<string>('');
  const [modalGlobalSuccess, setModalGlobalSuccess] = useState<string | null>(null);
  const [modalGlobalError, setModalGlobalError] = useState<string | null>(null);
  const [isSavingAllocations, setIsSavingAllocations] = useState<boolean>(false);

  // Searchable Employee Select state for Allocation Modal
  const [allocEmpSearch, setAllocEmpSearch] = useState('');
  const [isAllocEmpDropdownOpen, setIsAllocEmpDropdownOpen] = useState(false);
  const allocEmpDropdownRef = useRef<HTMLDivElement>(null);

  // Searchable Employee Select state for Request Modal
  const [reqEmpSearch, setReqEmpSearch] = useState('');
  const [isReqEmpDropdownOpen, setIsReqEmpDropdownOpen] = useState(false);
  const reqEmpDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Leave Type Dropdown states
  const [isAllocTypeDropdownOpen, setIsAllocTypeDropdownOpen] = useState(false);
  const allocTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [isReqTypeDropdownOpen, setIsReqTypeDropdownOpen] = useState(false);
  const reqTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Requests Table Search & Filter
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');

  // Employee Allocation Cards Search
  const [employeeCardSearch, setEmployeeCardSearch] = useState('');

  // Unpaid Leave Toggle State
  const [isUnpaidLeave, setIsUnpaidLeave] = useState(false);

  const [requestForm, setRequestForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    duration: 1,
    reason: ''
  });

  const toggleUnpaidLeave = () => {
    const nextVal = !isUnpaidLeave;
    setIsUnpaidLeave(nextVal);
    if (nextVal) {
      const unpaidType = types.find(t => t.name.toLowerCase().includes('unpaid') || !t.requiresAllocation);
      if (unpaidType) {
        setRequestForm(prev => ({ ...prev, timeOffTypeId: unpaidType.id }));
      }
    } else {
      const defaultAllocType = types.find(t => t.requiresAllocation) || types[0];
      if (defaultAllocType) {
        setRequestForm(prev => ({ ...prev, timeOffTypeId: defaultAllocType.id }));
      }
    }
  };

  // Helper: Calculate inclusive days between two YYYY-MM-DD date strings
  const calculateDaysBetween = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 1;
    const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endStr.split('-').map(Number);
    const startUTC = Date.UTC(sYear, sMonth - 1, sDay);
    const endUTC = Date.UTC(eYear, eMonth - 1, eDay);
    const diffDays = Math.round((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  // Helper: Given a start date and duration in days, calculate inclusive end date string
  const calculateEndDateFromDuration = (startStr: string, days: number): string => {
    if (!startStr) return startStr;
    const [year, month, day] = startStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const offset = Math.max(0, Math.ceil(days) - 1);
    date.setUTCDate(date.getUTCDate() + offset);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleRequestStartDateChange = (newStartDate: string) => {
    const newEndDate = calculateEndDateFromDuration(newStartDate, requestForm.duration || 1);
    setRequestForm(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate
    }));
  };

  const handleRequestEndDateChange = (newEndDate: string) => {
    let startStr = requestForm.startDate;
    if (newEndDate < startStr) {
      startStr = newEndDate;
    }
    const newDuration = calculateDaysBetween(startStr, newEndDate);
    setRequestForm(prev => ({
      ...prev,
      startDate: startStr,
      endDate: newEndDate,
      duration: newDuration
    }));
  };

  const handleRequestDurationChange = (newDurVal: number) => {
    const dur = Math.max(0.5, newDurVal);
    const newEndDate = calculateEndDateFromDuration(requestForm.startDate, dur);
    setRequestForm(prev => ({
      ...prev,
      duration: dur,
      endDate: newEndDate
    }));
  };

  // Edit Time Off Request Modal State (Admin/HR can edit unpaid leaves and other leaves)
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editRequestForm, setEditRequestForm] = useState({
    id: '',
    employeeName: '',
    timeOffTypeName: '',
    isUnpaid: false,
    startDate: '',
    endDate: '',
    duration: 1,
    reason: '',
    status: 'Pending'
  });
  const [isSavingEditRequest, setIsSavingEditRequest] = useState(false);
  const [editRequestError, setEditRequestError] = useState<string | null>(null);

  const openEditRequestModal = (req: any) => {
    setEditingRequest(req);
    const isUnpaid = !req.timeOffType?.requiresAllocation || req.timeOffType?.name?.toLowerCase().includes('unpaid');
    setEditRequestForm({
      id: req.id,
      employeeName: req.employee?.name || 'Employee',
      timeOffTypeName: req.timeOffType?.name || 'Leave',
      isUnpaid,
      startDate: new Date(req.startDate).toISOString().slice(0, 10),
      endDate: new Date(req.endDate).toISOString().slice(0, 10),
      duration: req.duration,
      reason: req.reason || '',
      status: req.status
    });
    setEditRequestError(null);
    setShowEditRequestModal(true);
  };

  const handleEditRequestStartDateChange = (newStartDate: string) => {
    const newEndDate = calculateEndDateFromDuration(newStartDate, editRequestForm.duration || 1);
    setEditRequestForm(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate
    }));
  };

  const handleEditRequestEndDateChange = (newEndDate: string) => {
    let startStr = editRequestForm.startDate;
    if (newEndDate < startStr) {
      startStr = newEndDate;
    }
    const newDuration = calculateDaysBetween(startStr, newEndDate);
    setEditRequestForm(prev => ({
      ...prev,
      startDate: startStr,
      endDate: newEndDate,
      duration: newDuration
    }));
  };

  const handleEditRequestDurationChange = (newDurVal: number) => {
    const dur = Math.max(0.5, newDurVal);
    const newEndDate = calculateEndDateFromDuration(editRequestForm.startDate, dur);
    setEditRequestForm(prev => ({
      ...prev,
      duration: dur,
      endDate: newEndDate
    }));
  };

  const handleSaveEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequestForm.id) return;
    setIsSavingEditRequest(true);
    setEditRequestError(null);
    try {
      await apiRequest(`/time-off/requests/${editRequestForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          startDate: editRequestForm.startDate,
          endDate: editRequestForm.endDate,
          duration: Number(editRequestForm.duration),
          reason: editRequestForm.reason,
          status: editRequestForm.status
        })
      });
      setShowEditRequestModal(false);
      fetchData();
    } catch (err: any) {
      setEditRequestError(err.message || 'Failed to update request');
    } finally {
      setIsSavingEditRequest(false);
    }
  };

  // Quick edit for an employee's unpaid leaves from their card
  const handleEditUnpaidLeave = (emp: any) => {
    const empUnpaid = requests.filter(
      (r) =>
        r.employeeId === emp.id &&
        (!r.timeOffType?.requiresAllocation || r.timeOffType?.name?.toLowerCase().includes('unpaid'))
    );
    if (empUnpaid.length > 0) {
      // Edit the most recent unpaid request for this employee
      openEditRequestModal(empUnpaid[0]);
    } else {
      // If none taken yet, open Request modal prefilled for Unpaid Leave
      const unpaidType = types.find(t => t.name.toLowerCase().includes('unpaid') || !t.requiresAllocation);
      setRequestForm({
        employeeId: emp.id,
        timeOffTypeId: unpaidType ? unpaidType.id : (types[0]?.id || ''),
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        duration: 1,
        reason: ''
      });
      setIsUnpaidLeave(true);
      setShowRequestModal(true);
    }
  };

  const [allocationForm, setAllocationForm] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 20,
    validFrom: `${new Date().getFullYear()}-01-01`,
    validTo: `${new Date().getFullYear()}-12-31`,
    status: 'Approved'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, aData, rData, eData] = await Promise.all([
        apiRequest('/time-off/types'),
        apiRequest('/time-off/allocations'),
        apiRequest('/time-off/requests'),
        apiRequest('/employees').catch(() => [])
      ]);
      const cleanTypes = (tData || []).filter((t: any) => 
        !/\d{4,}/.test(t.name) && 
        !t.name.includes('Sabbatical') && 
        !t.name.includes('Bonding') &&
        !t.name.toLowerCase().includes('floating')
      );
      setTypes(cleanTypes);
      setAllocations(aData || []);
      setRequests(rData || []);
      setEmployees(eData || []);

      if (cleanTypes && cleanTypes.length > 0 && !requestForm.timeOffTypeId) {
        setRequestForm(prev => ({ ...prev, timeOffTypeId: cleanTypes[0].id }));
      }
      if (cleanTypes && cleanTypes.length > 0 && !allocationForm.timeOffTypeId) {
        setAllocationForm(prev => ({ ...prev, timeOffTypeId: cleanTypes[0].id }));
      }
      if (eData && eData.length > 0) {
        if (!requestForm.employeeId) {
          setRequestForm(prev => ({ ...prev, employeeId: user?.employeeId || eData[0].id }));
        }
        if (!allocationForm.employeeId) {
          setAllocationForm(prev => ({ ...prev, employeeId: eData[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load time off data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Fetch live leave type balances for selected employee
  const fetchBalancesForEmployee = async (empId: string) => {
    if (!empId) return;
    try {
      const balances = await apiRequest(`/time-off/types/balances?employeeId=${empId}`);
      const cleanBalances = (balances || []).filter((t: any) => 
        !/\d{4,}/.test(t.name) && 
        !t.name.includes('Sabbatical') && 
        !t.name.includes('Bonding') &&
        !t.name.toLowerCase().includes('floating')
      );
      setTypesWithBalances(cleanBalances);
    } catch {
      // fallback to standard types if balance route fails
      setTypesWithBalances(types);
    }
  };

  useEffect(() => {
    const targetEmpId = requestForm.employeeId || user?.employeeId || (employees[0]?.id || '');
    if (targetEmpId) {
      fetchBalancesForEmployee(targetEmpId);
    }
  }, [requestForm.employeeId, user, employees, showRequestModal]);

  // Click outside to close all dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (allocEmpDropdownRef.current && !allocEmpDropdownRef.current.contains(target)) {
        setIsAllocEmpDropdownOpen(false);
      }
      if (reqEmpDropdownRef.current && !reqEmpDropdownRef.current.contains(target)) {
        setIsReqEmpDropdownOpen(false);
      }
      if (allocTypeDropdownRef.current && !allocTypeDropdownRef.current.contains(target)) {
        setIsAllocTypeDropdownOpen(false);
      }
      if (reqTypeDropdownRef.current && !reqTypeDropdownRef.current.contains(target)) {
        setIsReqTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let typeId = requestForm.timeOffTypeId;
      if (isUnpaidLeave) {
        const unpaidType = types.find(t => t.name.toLowerCase().includes('unpaid') || !t.requiresAllocation);
        if (unpaidType) typeId = unpaidType.id;
      }
      if (!typeId) {
        typeId = types[0]?.id ?? '';
      }

      await apiRequest('/time-off/requests', {
        method: 'POST',
        body: JSON.stringify({
          ...requestForm,
          timeOffTypeId: typeId,
          employeeId: requestForm.employeeId || user?.employeeId
        })
      });
      setShowRequestModal(false);
      setIsUnpaidLeave(false);
      fetchData();
      if (requestForm.employeeId) {
        fetchBalancesForEmployee(requestForm.employeeId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    }
  };

  const handleCreateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmpId = allocationForm.employeeId || employees[0]?.id;
    const targetTypeId = allocationForm.timeOffTypeId || (types[0]?.id ?? '');

    // Requirement 4: Check if an allocation already exists for that employee + timeOffType combination
    const existing = allocations.find(
      a => a.employeeId === targetEmpId && a.timeOffTypeId === targetTypeId
    );
    if (existing) {
      const empName = existing.employee?.name || employees.find(e => e.id === targetEmpId)?.name || 'this employee';
      const typeName = existing.timeOffType?.name || types.find(t => t.id === targetTypeId)?.name || 'this leave type';
      setError(`An allocation already exists for ${empName} — ${typeName} (${existing.remainingAmount} days remaining). Use Edit on the existing allocation instead.`);
      return;
    }

    try {
      await apiRequest('/time-off/allocations', {
        method: 'POST',
        body: JSON.stringify({
          ...allocationForm,
          employeeId: targetEmpId,
          timeOffTypeId: targetTypeId
        })
      });
      setShowAllocationModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to grant allocation');
    }
  };

  // Open 3-Dropdown Unified Leave Allocation Modal for an Employee
  const openAllocationModal = (empId?: string) => {
    const targetEmpId = empId || employees[0]?.id || '';
    setModalEmployeeId(targetEmpId);
    setModalGlobalSuccess(null);
    setModalGlobalError(null);

    const annualType = types.find(t => t.name.toLowerCase().includes('annual')) || types[0];
    const sickType = types.find(t => t.name.toLowerCase().includes('sick')) || types[1] || types[0];
    const otherType = types.find(t => t.name.toLowerCase().includes('other')) || types[2] || types[0];

    const alloc1 = allocations.find(a => a.employeeId === targetEmpId && a.timeOffTypeId === annualType?.id);
    const alloc2 = allocations.find(a => a.employeeId === targetEmpId && a.timeOffTypeId === sickType?.id);
    const alloc3 = allocations.find(a => a.employeeId === targetEmpId && a.timeOffTypeId === otherType?.id);

    const defaultFrom = `${new Date().getFullYear()}-01-01`;
    const defaultTo = `${new Date().getFullYear()}-12-31`;

    setSlot1({
      typeId: annualType ? annualType.id : (types[0]?.id || ''),
      amount: alloc1 ? alloc1.allocatedAmount : 20,
      initialAmount: alloc1 ? alloc1.allocatedAmount : 0,
      taken: alloc1 ? alloc1.takenAmount : 0,
      validFrom: alloc1?.validFrom ? new Date(alloc1.validFrom).toISOString().slice(0, 10) : defaultFrom,
      validTo: alloc1?.validTo ? new Date(alloc1.validTo).toISOString().slice(0, 10) : defaultTo,
      allocationId: alloc1 ? alloc1.id : undefined,
      error: null
    });

    setSlot2({
      typeId: sickType ? sickType.id : (types[1]?.id || types[0]?.id || ''),
      amount: alloc2 ? alloc2.allocatedAmount : 10,
      initialAmount: alloc2 ? alloc2.allocatedAmount : 0,
      taken: alloc2 ? alloc2.takenAmount : 0,
      validFrom: alloc2?.validFrom ? new Date(alloc2.validFrom).toISOString().slice(0, 10) : defaultFrom,
      validTo: alloc2?.validTo ? new Date(alloc2.validTo).toISOString().slice(0, 10) : defaultTo,
      allocationId: alloc2 ? alloc2.id : undefined,
      error: null
    });

    setSlot3({
      typeId: otherType ? otherType.id : (types[2]?.id || types[0]?.id || ''),
      amount: alloc3 ? alloc3.allocatedAmount : 0,
      initialAmount: alloc3 ? alloc3.allocatedAmount : 0,
      taken: alloc3 ? alloc3.takenAmount : 0,
      validFrom: alloc3?.validFrom ? new Date(alloc3.validFrom).toISOString().slice(0, 10) : defaultFrom,
      validTo: alloc3?.validTo ? new Date(alloc3.validTo).toISOString().slice(0, 10) : defaultTo,
      allocationId: alloc3 ? alloc3.id : undefined,
      error: null
    });

    setAllocationDescription('');
    setShowAllocationModal(true);
  };

  const handleSlotTypeChange = (slotNum: 1 | 2 | 3, newTypeId: string) => {
    const existing = allocations.find(a => a.employeeId === modalEmployeeId && a.timeOffTypeId === newTypeId);
    const defaultFrom = `${new Date().getFullYear()}-01-01`;
    const defaultTo = `${new Date().getFullYear()}-12-31`;
    const updater = (prev: any) => ({
      ...prev,
      typeId: newTypeId,
      amount: existing ? existing.allocatedAmount : prev.amount,
      initialAmount: existing ? existing.allocatedAmount : 0,
      taken: existing ? existing.takenAmount : 0,
      validFrom: existing?.validFrom ? new Date(existing.validFrom).toISOString().slice(0, 10) : prev.validFrom || defaultFrom,
      validTo: existing?.validTo ? new Date(existing.validTo).toISOString().slice(0, 10) : prev.validTo || defaultTo,
      allocationId: existing ? existing.id : undefined,
      error: null
    });
    if (slotNum === 1) setSlot1(updater);
    if (slotNum === 2) setSlot2(updater);
    if (slotNum === 3) setSlot3(updater);
  };

  const handleSlotDateChange = (slotNum: 1 | 2 | 3, field: 'validFrom' | 'validTo', val: string) => {
    const updater = (prev: any) => ({
      ...prev,
      [field]: val
    });
    if (slotNum === 1) setSlot1(updater);
    if (slotNum === 2) setSlot2(updater);
    if (slotNum === 3) setSlot3(updater);
  };

  const handleSlotAmountChange = (slotNum: 1 | 2 | 3, val: number) => {
    const updater = (prev: any) => {
      let err = null;
      const type = types.find(t => t.id === prev.typeId);
      const isUnpaid = type && (!type.requiresAllocation || type.name.toLowerCase().includes('unpaid'));
      if (!isUnpaid && val < prev.taken) {
        err = `Cannot reduce allocation to ${val} days — employee has already taken ${prev.taken} days. Minimum allowed allocation is ${prev.taken} days.`;
      }
      return { ...prev, amount: val, error: err };
    };
    if (slotNum === 1) setSlot1(updater);
    if (slotNum === 2) setSlot2(updater);
    if (slotNum === 3) setSlot3(updater);
  };

  const handleSaveAllocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmployeeId) return;

    setIsSavingAllocations(true);
    setModalGlobalSuccess(null);
    setModalGlobalError(null);

    const selectedTypeIds = [slot1.typeId, slot2.typeId, slot3.typeId].filter(Boolean);
    const uniqueTypeIds = new Set(selectedTypeIds);
    if (uniqueTypeIds.size < selectedTypeIds.length) {
      setModalGlobalError('Please select different leave types for each of the 3 dropdowns.');
      setIsSavingAllocations(false);
      return;
    }

    const slots = [slot1, slot2, slot3];
    const updatedSlots = [...slots];
    let anySaved = false;
    let anyError = false;

    for (let i = 0; i < slots.length; i++) {
      const slot = { ...slots[i] };
      if (!slot.typeId) continue;

      const type = types.find(t => t.id === slot.typeId);
      const isUnpaid = type && (!type.requiresAllocation || type.name.toLowerCase().includes('unpaid'));

      if (!isUnpaid && slot.amount < slot.taken) {
        slot.error = `Cannot reduce allocation to ${slot.amount} days — employee has already taken ${slot.taken} days. Minimum allowed allocation is ${slot.taken} days.`;
        updatedSlots[i] = slot;
        anyError = true;
        continue;
      }

      if (slot.allocationId && slot.amount === slot.initialAmount && !slot.error && !isUnpaid) {
        continue;
      }

      if (!slot.allocationId && slot.amount === 0 && !isUnpaid) {
        continue;
      }

      try {
        if (slot.allocationId) {
          await apiRequest(`/time-off/allocations/${slot.allocationId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              allocatedAmount: Number(slot.amount),
              validFrom: slot.validFrom,
              validTo: slot.validTo
            })
          });
        } else {
          const created = await apiRequest('/time-off/allocations', {
            method: 'POST',
            body: JSON.stringify({
              employeeId: modalEmployeeId,
              timeOffTypeId: slot.typeId,
              allocatedAmount: Number(slot.amount),
              validFrom: slot.validFrom,
              validTo: slot.validTo
            })
          });
          slot.allocationId = created.id;
        }
        slot.initialAmount = Number(slot.amount);
        slot.error = null;
        anySaved = true;
      } catch (err: any) {
        slot.error = err.message || 'Failed to save allocation';
        anyError = true;
      }
      updatedSlots[i] = slot;
    }

    setSlot1(updatedSlots[0]);
    setSlot2(updatedSlots[1]);
    setSlot3(updatedSlots[2]);
    setIsSavingAllocations(false);

    if (anySaved) {
      await fetchData();
      if (!anyError) {
        setShowAllocationModal(false);
      } else {
        setModalGlobalSuccess('Valid allocations saved successfully. Please review the highlighted row errors below.');
      }
    } else if (anyError) {
      setModalGlobalError('Please resolve the errors highlighted on the invalid rows.');
    } else {
      setShowAllocationModal(false);
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave allocation?')) return;
    try {
      await apiRequest(`/time-off/allocations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete / cancel this time off request?')) return;
    try {
      await apiRequest(`/time-off/requests/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiRequest(`/time-off/requests/${requestId}/approve`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRefuse = async (requestId: string) => {
    try {
      await apiRequest(`/time-off/requests/${requestId}/refuse`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canManage = user?.role !== 'Employee';

  const filteredAllocEmployees = employees.filter(emp => {
    const q = allocEmpSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });
  const selectedAllocEmployee = employees.find(e => e.id === allocationForm.employeeId);
  const selectedAllocType = types.find(t => t.id === allocationForm.timeOffTypeId);

  const filteredReqEmployees = employees.filter(emp => {
    const q = reqEmpSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });
  const currentReqEmpId = requestForm.employeeId || user?.employeeId || (employees[0]?.id || '');
  const selectedReqEmployee = employees.find(e => e.id === currentReqEmpId);
  const availableTypesList = typesWithBalances.length > 0 ? typesWithBalances : types;
  const selectedReqType = availableTypesList.find(t => t.id === requestForm.timeOffTypeId) || availableTypesList[0];

  const filteredRequests = requests.filter(req => {
    const q = requestSearch.toLowerCase().trim();
    const empName = (req.employee?.name || '').toLowerCase();
    const leaveType = (req.timeOffType?.name || '').toLowerCase();
    const reason = (req.reason || '').toLowerCase();
    const status = (req.status || '').toLowerCase();

    const matchesSearch = !q || empName.includes(q) || leaveType.includes(q) || reason.includes(q) || status.includes(q);
    const matchesStatus = requestStatusFilter === 'All' || req.status === requestStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedEmployees = employees.filter(emp => {
    if (!canManage && user?.employeeId && emp.id !== user.employeeId) return false;
    const q = employeeCardSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.jobPosition && emp.jobPosition.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-[#0b0914]/80 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40 backdrop-blur-xl shadow-lg dark:shadow-2xl transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-amber-500 dark:text-amber-400" />
            Time Off & Leave Balances
          </h1>
          <p className="text-sm text-slate-600 dark:text-purple-200/60 font-medium mt-0.5">
            Live leave allocation accounting: approvals automatically decrement remaining balances in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <button
              onClick={() => {
                setError(null);
                openAllocationModal();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Award size={15} className="text-amber-400" /> Grant Leave Allocation
            </button>
          )}

          <button
            onClick={() => { setError(null); setIsUnpaidLeave(false); setShowRequestModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={16} /> Request Time Off
          </button>
        </div>
      </div>

      {/* Per-Employee Allocation Cards (Requirement 1) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-black text-amber-500 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-500 dark:text-purple-400" /> Employee Leave Quotas & Balances
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-purple-300/60 mt-0.5">
              Unified leave portfolio per employee. Click any card to manage all leave allocations together.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={employeeCardSearch}
              onChange={(e) => setEmployeeCardSearch(e.target.value)}
              placeholder="Search employee or department..."
              className="w-full bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-medium"
            />
            {employeeCardSearch && (
              <button
                type="button"
                onClick={() => setEmployeeCardSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {displayedEmployees.length === 0 ? (
          <div className="bg-white/70 dark:bg-[#0b0914]/60 border border-purple-100 dark:border-purple-900/30 rounded-3xl p-8 text-center text-slate-500 dark:text-purple-300/60 text-xs">
            No employees found matching &quot;{employeeCardSearch}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedEmployees.map((emp) => {
              const empAllocations = allocations.filter((a) => a.employeeId === emp.id);

              // Strictly calculate the 3 quota-allocated leave types (DO NOT include Unpaid Leave)
              let totalRemaining = 0;
              let totalAllocated = 0;
              let totalTaken = 0;
              empAllocations.forEach((a) => {
                totalRemaining += a.remainingAmount || 0;
                totalAllocated += a.allocatedAmount || 0;
                totalTaken += a.takenAmount || 0;
              });

              // Separate Unpaid Leave ratio and metrics (NO LIMIT, ISOLATED from the other 3 types)
              const empUnpaidRequests = requests.filter(
                (r) =>
                  r.employeeId === emp.id &&
                  (!r.timeOffType?.requiresAllocation || r.timeOffType?.name?.toLowerCase().includes('unpaid'))
              );
              const empApprovedUnpaid = empUnpaidRequests.filter((r) => r.status === 'Approved');
              const empPendingUnpaid = empUnpaidRequests.filter((r) => r.status === 'Pending');
              const unpaidDaysTaken = empApprovedUnpaid.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);
              const unpaidDaysPending = empPendingUnpaid.reduce((sum, r) => sum + (Number(r.duration) || 0), 0);

              return (
                <div
                  key={emp.id}
                  onClick={() => canManage && openAllocationModal(emp.id)}
                  className={`bg-white/90 dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl p-5 relative overflow-hidden shadow-md dark:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    canManage ? 'hover:border-amber-400/70 hover:shadow-2xl hover:scale-[1.01] cursor-pointer group' : ''
                  }`}
                >
                  <div>
                    {/* Employee Info Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-500/20 shrink-0">
                          {emp.name?.slice(0, 2).toUpperCase() || 'EM'}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                            {emp.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-purple-300/70 font-medium">
                            {emp.department || 'General'} {emp.jobPosition ? `• ${emp.jobPosition}` : ''}
                          </p>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAllocationModal(emp.id);
                          }}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition shadow-sm flex items-center gap-1 active:scale-95 shrink-0"
                          title="Manage Leave Allocations"
                        >
                          <Edit2 size={11} />
                          <span>Manage</span>
                        </button>
                      )}
                    </div>

                    {/* Overall Remaining Leave Stat (Strictly for 3 Paid Quota Leave Types) */}
                    <div className="mb-3.5 px-3.5 py-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-purple-300/70 font-medium block">Total Available Leave (Paid Quota)</span>
                        <span className="text-[10px] text-slate-400 dark:text-purple-400/60 font-mono">
                          {totalRemaining} Days Remaining ({totalTaken} Used • {totalAllocated} Allocated)
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-black text-amber-600 dark:text-amber-400 text-base">
                          {totalRemaining}
                        </span>
                        <span className="text-[10px] font-bold text-amber-500/80 ml-1">Days</span>
                      </div>
                    </div>

                    {/* All Leave Types Summary (Every leave type shown, 0/0 or Not allocated if none) */}
                    <div className="space-y-2">
                      {types.filter(t => t.requiresAllocation).map((type) => {
                        const matchingAllocs = empAllocations.filter((a) => a.timeOffTypeId === type.id);
                        const isAllocated = matchingAllocs.length > 0;
                        const remaining = matchingAllocs.reduce((sum, a) => sum + (a.remainingAmount || 0), 0);
                        const allocated = matchingAllocs.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);
                        const taken = matchingAllocs.reduce((sum, a) => sum + (a.takenAmount || 0), 0);
                        const percent = allocated > 0 ? Math.min(100, Math.max(0, (remaining / allocated) * 100)) : 0;

                        return (
                          <div
                            key={type.id}
                            className={`p-2.5 rounded-xl border transition-colors ${
                              isAllocated
                                ? 'bg-slate-50/70 dark:bg-[#06050b]/60 border-slate-200/80 dark:border-purple-950'
                                : 'bg-slate-50/30 dark:bg-[#06050b]/30 border-dashed border-slate-200/60 dark:border-purple-950/40 opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 dark:text-white">
                                  {type.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                                  Days
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                {isAllocated ? (
                                  <>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                      {remaining} / {allocated}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-purple-300/60 font-sans">
                                      Days remaining
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-slate-400 dark:text-purple-400/50 font-medium">
                                      0 / 0
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-purple-400/50 italic font-sans">
                                      (Not allocated)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="w-full bg-slate-200/70 dark:bg-purple-950/50 h-1.5 rounded-full overflow-hidden">
                              {isAllocated && allocated > 0 ? (
                                <div
                                  className="bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              ) : (
                                <div className="w-0 h-full" />
                              )}
                            </div>

                            {isAllocated && (
                              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-purple-400/60 mt-1 font-medium font-mono">
                                <span>Taken: {taken} Days</span>
                                <span>Remaining: {remaining} Days</span>
                                <span>Allocated: {allocated} Days</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Dedicated Unpaid Leave Cell (Status: Unpaid Leave, Separate Ratio: Taken / No Limit, Excluded from 3 types) */}
                      <div
                        className={`p-2.5 rounded-xl border transition-all ${
                          unpaidDaysTaken > 0
                            ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-500/40 shadow-sm'
                            : 'bg-slate-50/40 dark:bg-[#06050b]/40 border-slate-200/60 dark:border-purple-950/40 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-white">
                              Unpaid Leave
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black uppercase tracking-wider border border-amber-400/30">
                              Unpaid
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                              Days
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Separate Ratio: Taken / No Limit */}
                            <div className="flex items-center gap-1 font-mono text-xs">
                              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                                {unpaidDaysTaken} Taken
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-purple-300/60 font-sans font-medium">
                                / No Limit
                              </span>
                            </div>

                            {/* Edit Button for Unpaid Leave */}
                            {canManage && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditUnpaidLeave(emp);
                                }}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-400/30 transition shadow-sm flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer"
                                title="Edit Unpaid Leave Details"
                              >
                                <Edit2 size={10} />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Visual indicator (No progress bar limit, full unbounded accent bar when taken) */}
                        <div className="w-full bg-slate-200/70 dark:bg-purple-950/50 h-1.5 rounded-full overflow-hidden">
                          {unpaidDaysTaken > 0 ? (
                            <div
                              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 h-full rounded-full transition-all duration-300"
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <div className="w-0 h-full" />
                          )}
                        </div>

                        {/* Separate Ratio Details & Cell Status */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-purple-400/70 mt-1 font-medium font-mono">
                          <span className={unpaidDaysTaken > 0 ? 'font-bold text-slate-700 dark:text-purple-200' : ''}>
                            Taken: {unpaidDaysTaken} Days
                          </span>
                          {unpaidDaysPending > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Pending: {unpaidDaysPending} Days
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-purple-400/40 italic">
                              0 Pending
                            </span>
                          )}
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            Limit: None (Quota-Free)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer prompt */}
                  {canManage && (
                    <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-[11px] text-slate-400 dark:text-purple-300/60 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-medium">
                      <span>Click card to manage all leave quotas</span>
                      <span className="text-amber-500 font-bold text-xs">→</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-[#0b0914]/80 border border-purple-100 dark:border-purple-900/40 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors duration-300">
        {/* Table Header with Search & Filter */}
        <div className="p-4 bg-purple-50/70 dark:bg-[#06050b] border-b border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Time Off Requests Workflow</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
              {filteredRequests.length === requests.length
                ? `${requests.length} Requests`
                : `${filteredRequests.length} of ${requests.length} Requests`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-purple-400/70 pointer-events-none" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search by employee, leave type, reason..."
                className="w-full bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl pl-10 pr-9 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-400/50 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
              />
              {requestSearch && (
                <button
                  type="button"
                  onClick={() => setRequestSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="bg-white dark:bg-[#0e0c18] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-purple-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Refused">Refused</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-purple-50/70 dark:bg-[#06050b] text-purple-900 dark:text-purple-300/70 font-bold uppercase tracking-wider text-[10px] border-b border-purple-100 dark:border-purple-900/50">
            <tr>
              <th className="px-5 py-4">Employee</th>
              <th className="px-5 py-4">Leave Type</th>
              <th className="px-5 py-4">Dates</th>
              <th className="px-5 py-4">Duration</th>
              <th className="px-5 py-4">Reason</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-950 text-purple-100">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-purple-950/20 transition">
                <td className="px-5 py-4 font-bold text-white">
                  {req.employee?.name}
                </td>
                <td className="px-5 py-4 font-bold flex items-center gap-1.5 flex-wrap">
                  <span className="text-amber-300">{req.timeOffType?.name}</span>
                  {!req.timeOffType?.requiresAllocation && (
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-extrabold uppercase tracking-wider">
                      Unpaid (No Limit)
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono text-purple-300/80">
                  {new Date(req.startDate).toISOString().slice(0, 10)} → {new Date(req.endDate).toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-4 font-bold font-mono text-white">
                  {req.duration} Days
                </td>
                <td className="px-5 py-4 text-purple-300/70 max-w-xs truncate">
                  {req.reason || '—'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block w-fit ${req.status === 'Approved' ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' :
                        req.status === 'Refused' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                      }`}>
                      {req.status}
                    </span>
                    {!req.timeOffType?.requiresAllocation && (
                      <span className="text-[9px] text-amber-400/80 font-mono font-medium">
                        Unpaid • Quota-Free
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  {canManage ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditRequestModal(req)}
                        className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer active:scale-95"
                        title="Edit Leave Request Details"
                      >
                        <Edit2 size={12} className="text-amber-400" /> Edit
                      </button>

                      {req.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl text-[11px] font-black flex items-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            <Check size={13} /> {!req.timeOffType?.requiresAllocation ? 'Approve (Unpaid)' : 'Approve (Deduct)'}
                          </button>
                          <button
                            onClick={() => handleRefuse(req.id)}
                            className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <X size={13} /> Refuse
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-purple-400/50 font-mono">Completed</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-purple-400/50 font-mono">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3-Dropdown Leave Allocation Modal (The Same Box with Dropdowns As Before, Repeated 3 Times with Description Box) */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div
            className="fixed inset-0"
            onClick={() => setShowAllocationModal(false)}
          />
          <div className="relative bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl z-10 transition-colors duration-300 my-8 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-purple-100 dark:border-purple-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  <Award size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Grant / Manage Leave Allocation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">
                    Allocate leave quotas across 3 leave types with description for this employee.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllocationModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {modalGlobalSuccess && (
              <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 shrink-0">
                <Check size={16} className="shrink-0 mt-0.5" />
                <span>{modalGlobalSuccess}</span>
              </div>
            )}

            {modalGlobalError && (
              <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 shrink-0">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{modalGlobalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAllocations} className="flex flex-col flex-1 overflow-hidden space-y-3.5">
              <div className="overflow-y-auto pr-1 flex-1 space-y-3">
                {/* Employee Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 dark:text-purple-300/80 font-semibold text-xs flex items-center gap-1.5">
                      <User size={13} className="text-amber-500 dark:text-amber-400" />
                      Employee
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-purple-400/60">
                      {employees.length} available
                    </span>
                  </div>
                  <select
                    required
                    value={modalEmployeeId}
                    onChange={(e) => openAllocationModal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium cursor-pointer"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department || 'General'}{emp.jobPosition ? ` - ${emp.jobPosition}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 1 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  slot1.error
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                    : 'bg-slate-50/70 dark:bg-[#06050b]/80 border-slate-200/80 dark:border-purple-900/40'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                        Leave Type 1
                      </label>
                      <select
                        value={slot1.typeId}
                        onChange={(e) => handleSlotTypeChange(1, e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} {!t.requiresAllocation ? '(Unpaid • No Limit)' : '(Days)'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-700 dark:text-purple-300/80 font-semibold">
                          Allocated ({types.find(t => t.id === slot1.typeId)?.requiresAllocation ? types.find(t => t.id === slot1.typeId)?.unit || 'Days' : 'Unpaid • Quota-Free'})
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-mono">
                          Taken: {slot1.taken} | Rem: {types.find(t => t.id === slot1.typeId)?.requiresAllocation ? Math.max(0, slot1.amount - slot1.taken) : 'No Limit'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={slot1.amount}
                        onChange={(e) => handleSlotAmountChange(1, Number(e.target.value))}
                        disabled={types.find(t => t.id === slot1.typeId)?.requiresAllocation === false}
                        placeholder={types.find(t => t.id === slot1.typeId)?.requiresAllocation === false ? 'No Limit' : 'Days'}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono font-bold disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Validity Dates for Slot 1 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid From</label>
                      <input
                        type="date"
                        required
                        value={slot1.validFrom}
                        onChange={(e) => handleSlotDateChange(1, 'validFrom', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid To</label>
                      <input
                        type="date"
                        required
                        value={slot1.validTo}
                        onChange={(e) => handleSlotDateChange(1, 'validTo', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {slot1.error && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={13} /> {slot1.error}
                    </p>
                  )}
                </div>

                {/* Dropdown 2 */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  slot2.error
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                    : 'bg-slate-50/70 dark:bg-[#06050b]/80 border-slate-200/80 dark:border-purple-900/40'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                        Leave Type 2
                      </label>
                      <select
                        value={slot2.typeId}
                        onChange={(e) => handleSlotTypeChange(2, e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} {!t.requiresAllocation ? '(Unpaid • No Limit)' : '(Days)'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-700 dark:text-purple-300/80 font-semibold">
                          Allocated ({types.find(t => t.id === slot2.typeId)?.requiresAllocation ? types.find(t => t.id === slot2.typeId)?.unit || 'Days' : 'Unpaid • Quota-Free'})
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-mono">
                          Taken: {slot2.taken} | Rem: {types.find(t => t.id === slot2.typeId)?.requiresAllocation ? Math.max(0, slot2.amount - slot2.taken) : 'No Limit'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={slot2.amount}
                        onChange={(e) => handleSlotAmountChange(2, Number(e.target.value))}
                        disabled={types.find(t => t.id === slot2.typeId)?.requiresAllocation === false}
                        placeholder={types.find(t => t.id === slot2.typeId)?.requiresAllocation === false ? 'No Limit' : 'Days'}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono font-bold disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Validity Dates for Slot 2 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid From</label>
                      <input
                        type="date"
                        required
                        value={slot2.validFrom}
                        onChange={(e) => handleSlotDateChange(2, 'validFrom', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid To</label>
                      <input
                        type="date"
                        required
                        value={slot2.validTo}
                        onChange={(e) => handleSlotDateChange(2, 'validTo', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {slot2.error && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={13} /> {slot2.error}
                    </p>
                  )}
                </div>

                {/* Dropdown 3 with Description Box */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  slot3.error
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                    : 'bg-slate-50/70 dark:bg-[#06050b]/80 border-slate-200/80 dark:border-purple-900/40'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                        Leave Type 3
                      </label>
                      <select
                        value={slot3.typeId}
                        onChange={(e) => handleSlotTypeChange(3, e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} {!t.requiresAllocation ? '(Unpaid • No Limit)' : '(Days)'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-700 dark:text-purple-300/80 font-semibold">
                          Allocated ({types.find(t => t.id === slot3.typeId)?.requiresAllocation ? types.find(t => t.id === slot3.typeId)?.unit || 'Days' : 'Unpaid • Quota-Free'})
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-mono">
                          Taken: {slot3.taken} | Rem: {types.find(t => t.id === slot3.typeId)?.requiresAllocation ? Math.max(0, slot3.amount - slot3.taken) : 'No Limit'}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={slot3.amount}
                        onChange={(e) => handleSlotAmountChange(3, Number(e.target.value))}
                        disabled={types.find(t => t.id === slot3.typeId)?.requiresAllocation === false}
                        placeholder={types.find(t => t.id === slot3.typeId)?.requiresAllocation === false ? 'No Limit' : 'Days'}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono font-bold disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Validity Dates for Slot 3 */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-2.5">
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid From</label>
                      <input
                        type="date"
                        required
                        value={slot3.validFrom}
                        onChange={(e) => handleSlotDateChange(3, 'validFrom', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-purple-300/70 mb-1 font-medium text-[11px]">Valid To</label>
                      <input
                        type="date"
                        required
                        value={slot3.validTo}
                        onChange={(e) => handleSlotDateChange(3, 'validTo', e.target.value)}
                        className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Description Box */}
                  <div>
                    <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold text-xs">
                      Description / Reason
                    </label>
                    <textarea
                      value={allocationDescription}
                      onChange={(e) => setAllocationDescription(e.target.value)}
                      placeholder="Specify description or reason..."
                      rows={2}
                      className="w-full bg-white dark:bg-[#090712] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-400/40 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 text-xs font-medium"
                    />
                  </div>

                  {slot3.error && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium flex items-center gap-1">
                      <AlertCircle size={13} /> {slot3.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-purple-100 dark:border-purple-900/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllocationModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAllocations}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingAllocations ? 'Saving...' : 'Save Allocations'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              Request Time Off
            </h2>
            <p className="text-xs text-slate-500 dark:text-purple-300/60 mb-4 font-medium">
              Submit your time off request for approval. Live leave balance will be automatically checked and deducted upon approval.
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              {/* Unpaid Leave Switch Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#06050b] border border-slate-200/80 dark:border-purple-900/50 shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border transition-colors ${
                    isUnpaidLeave 
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-500 dark:text-amber-400' 
                      : 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-300'
                  }`}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Unpaid Leave Request</span>
                      {isUnpaidLeave && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-black uppercase tracking-wider">
                          Unpaid
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-purple-300/60 font-medium">
                      {isUnpaidLeave 
                        ? 'Leave quota allocation NOT required • Will be approved by HR' 
                        : 'Enable this toggle to request unpaid leave without quota'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isUnpaidLeave}
                  onClick={toggleUnpaidLeave}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    isUnpaidLeave ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-slate-300 dark:bg-purple-950/80'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isUnpaidLeave ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {canManage && (
                <div>
                  <label className="block text-purple-300/80 mb-1 font-semibold">Employee</label>
                  <select
                    value={requestForm.employeeId}
                    onChange={(e) => setRequestForm({ ...requestForm, employeeId: e.target.value })}
                    className="w-full bg-[#06050b] border border-purple-900/50 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
              )}

              {isUnpaidLeave ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-purple-300/70 font-semibold">Leave Type:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">Unpaid Leave</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg bg-amber-500/20">
                    Quota-Free
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Time Off Type</label>
                  <select
                    value={requestForm.timeOffTypeId}
                    onChange={(e) => setRequestForm({ ...requestForm, timeOffTypeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    {types.filter(t => t.requiresAllocation).map(t => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-[#0b0914] text-slate-900 dark:text-white">{t.name} (Days)</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.startDate}
                    onChange={(e) => handleRequestStartDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.endDate}
                    onChange={(e) => handleRequestEndDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-purple-300/80 font-semibold">
                    Duration (Days)
                  </label>
                  {isUnpaidLeave ? (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                      Quota not required (Unpaid)
                    </span>
                  ) : (
                    selectedReqType && selectedReqType.remainingBalance !== undefined && (
                      <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-mono">
                        Max available: {selectedReqType.remainingBalance} Days
                      </span>
                    )
                  )}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={requestForm.duration}
                  onChange={(e) => handleRequestDurationChange(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                />
              </div>

              {/* Reason: optional for Unpaid, required for Other */}
              {isUnpaidLeave ? (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                    Reason / Description for Unpaid Leave <span className="text-slate-400 dark:text-purple-400/50 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    placeholder="Provide details or reason for taking unpaid leave..."
                    rows={2}
                  />
                </div>
              ) : selectedReqType?.name?.toLowerCase() === 'other' ? (
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                    Please specify reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                    placeholder="Please specify detailed reason for Other leave request..."
                    rows={3}
                  />
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-4 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Request Modal (Admin/HR can edit unpaid leaves and other leaves) */}
      {showEditRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#090712] border border-purple-200 dark:border-purple-800/60 rounded-3xl w-full max-w-md p-6 shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit {editRequestForm.isUnpaid ? 'Unpaid Leave' : 'Leave Request'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-purple-300/60 font-medium">
                    Modify duration, dates, reason, or status for this leave.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditRequestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-purple-950/60 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {editRequestError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{editRequestError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditRequest} className="space-y-4 text-xs">
              {/* Employee & Type Summary */}
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-[#06050b] border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-medium block">Employee</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{editRequestForm.employeeName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-purple-400/60 font-medium block">Leave Type</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{editRequestForm.timeOffTypeName}</span>
                    {editRequestForm.isUnpaid && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase border border-amber-400/30">
                        Unpaid (No Limit)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editRequestForm.startDate}
                    onChange={(e) => handleEditRequestStartDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={editRequestForm.endDate}
                    onChange={(e) => handleEditRequestEndDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  />
                </div>
              </div>

              {/* Duration & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Duration (Days)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={editRequestForm.duration}
                    onChange={(e) => handleEditRequestDurationChange(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">Status</label>
                  <select
                    value={editRequestForm.status}
                    onChange={(e) => setEditRequestForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Refused">Refused</option>
                  </select>
                </div>
              </div>

              {/* Reason / Details */}
              <div>
                <label className="block text-slate-700 dark:text-purple-300/80 mb-1 font-semibold">
                  Reason / Description {editRequestForm.isUnpaid ? <span className="text-slate-400 font-normal">(optional)</span> : null}
                </label>
                <textarea
                  value={editRequestForm.reason}
                  onChange={(e) => setEditRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-[#06050b] border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium"
                  placeholder="Details or reason for this leave..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-purple-100 dark:border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setShowEditRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-purple-950/60 border border-slate-200 dark:border-purple-900/50 text-slate-600 dark:text-purple-300 rounded-xl hover:bg-slate-200 dark:hover:bg-purple-900/40 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditRequest}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 rounded-xl font-black shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEditRequest ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

