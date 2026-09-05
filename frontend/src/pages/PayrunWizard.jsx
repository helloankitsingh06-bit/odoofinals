import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Layers, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText,
  CreditCard,
  Building2,
  Sparkles
} from 'lucide-react';
import { payrollService } from '../lib/payrollService';

export default function PayrunWizard() {
  const navigate = useNavigate();

  // Wizard Step State: 1 or 2
  const [currentStep, setCurrentStep] = useState(1);
  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(true);

  // Step 1 Form State
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [step1Error, setStep1Error] = useState('');

  // Step 2 State (Eligible Employees)
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [step2Error, setStep2Error] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load available salary structures
  useEffect(() => {
    async function loadStructures() {
      try {
        const data = await payrollService.structures.list();
        setStructures(data);
        if (data.length > 0) {
          setSalaryStructureId(data[0].id);
        }
      } catch (err) {
        setStep1Error(err.message || 'Failed to load structures');
      } finally {
        setLoadingStructures(false);
      }
    }
    loadStructures();

    // Default dates to current month
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setStartDate(`${y}-${m}-01`);
    setEndDate(`${y}-${m}-${lastDay}`);
    setName(`Payrun ${now.toLocaleString('default', { month: 'long' })} ${y}`);
  }, []);

  // Step 1 validation check
  const isStep1Valid = Boolean(
    name.trim() &&
    salaryStructureId &&
    startDate &&
    endDate &&
    new Date(startDate) <= new Date(endDate)
  );

  // Advance from Step 1 to Step 2
  async function handleProceedToStep2(e) {
    e?.preventDefault();
    setStep1Error('');

    if (!isStep1Valid) {
      setStep1Error('Please fill all required fields and ensure start date is before end date.');
      return;
    }

    setLoadingEligible(true);
    try {
      const eligible = await payrollService.payruns.getEligibleEmployees({
        salaryStructureId,
        startDate,
        endDate,
      });

      setEligibleEmployees(eligible);
      // Default select all eligible employees
      setSelectedEmpIds(eligible.map((e) => e.id));
      setCurrentStep(2);
    } catch (err) {
      setStep1Error(err.message || 'Failed to query eligible employees');
    } finally {
      setLoadingEligible(false);
    }
  }

  function toggleEmployee(id) {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((empId) => empId !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  }

  function toggleSelectAll() {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.id));
    }
  }

  // Confirm Step 2 and Create Payrun doc in "Draft"
  async function handleCreatePayrun() {
    if (selectedEmpIds.length === 0) {
      setStep2Error('Please select at least one employee for the payrun.');
      return;
    }

    setSubmitting(true);
    setStep2Error('');

    try {
      const payrun = await payrollService.payruns.create({
        name: name.trim(),
        salaryStructureId,
        period: {
          startDate,
          endDate,
        },
        employeeIds: selectedEmpIds,
      });

      // Redirect immediately to Payrun Processing screen
      navigate(`/payruns/${payrun.id}`);
    } catch (err) {
      setStep2Error(err.message || 'Failed to create payrun');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedStructureObj = structures.find((s) => s.id === salaryStructureId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-4">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Payroll Workflow Wizard</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Create New Payrun
        </h1>
        <p className="text-xs text-stone-400 max-w-md mx-auto">
          Configure pay period parameters, resolve matching employee contracts, and initialize a staged draft payrun.
        </p>
      </div>

      {/* Real 2-Step Component Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-stone-800 flex items-center justify-center">
        <div className="flex items-center gap-6 sm:gap-12">
          
          {/* Step 1 Node */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50'
                  : currentStep > 1
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                  : 'bg-stone-900 text-stone-500 border border-stone-800'
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '01'}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">
                Stage 1
              </span>
              <span
                className={`text-xs font-bold ${
                  currentStep === 1 ? 'text-white' : 'text-stone-400'
                }`}
              >
                Structure & Period
              </span>
            </div>
          </div>

          {/* Connector Line */}
          <div
            className={`w-12 sm:w-20 h-0.5 transition-colors duration-300 ${
              currentStep > 1 ? 'bg-emerald-500' : 'bg-stone-800'
            }`}
          ></div>

          {/* Step 2 Node */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 ${
                currentStep === 2
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50'
                  : 'bg-stone-900 text-stone-500 border border-stone-800'
              }`}
            >
              02
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">
                Stage 2
              </span>
              <span
                className={`text-xs font-bold ${
                  currentStep === 2 ? 'text-white' : 'text-stone-500'
                }`}
              >
                Employee Selection
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* STEP 1: CONFIGURATION (Zero Firestore write) */}
      {currentStep === 1 && (
        <div className="p-8 rounded-2xl glass-panel border border-stone-800 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h2 className="text-lg font-bold text-white">
              Step 1: Configure Payrun Parameters
            </h2>
            <p className="text-xs text-stone-400">
              Select the compensation framework and pay date boundaries. No database writes happen in this stage.
            </p>
          </div>

          {step1Error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{step1Error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Payrun Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Payrun Batch Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. October 2026 Monthly Payrun"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Salary Structure Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Salary Structure *
              </label>
              {loadingStructures ? (
                <div className="p-3 bg-stone-900 rounded-xl text-stone-500 text-xs">
                  Loading structures...
                </div>
              ) : structures.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs">
                  No salary structures found. Please create a salary structure first.
                </div>
              ) : (
                <select
                  value={salaryStructureId}
                  onChange={(e) => setSalaryStructureId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.ruleIds?.length || 0} rules)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Period Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Payrun Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Payrun End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Forward Action */}
          <div className="pt-6 border-t border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/payruns')}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!isStep1Valid || loadingEligible}
              onClick={handleProceedToStep2}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {loadingEligible ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin"></div>
                  <span>Checking Eligibility...</span>
                </>
              ) : (
                <>
                  <span>Next: Select Employees</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ELIGIBLE EMPLOYEES SELECTION & CONFIRMATION */}
      {currentStep === 2 && (
        <div className="p-8 rounded-2xl glass-panel border border-stone-800 space-y-6">
          <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Step 2: Review & Select Eligible Employees
              </h2>
              <p className="text-xs text-stone-400">
                Only active employees with active contracts matching &ldquo;{selectedStructureObj?.name}&rdquo; and covering the period are shown.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/40">
                {selectedEmpIds.length} of {eligibleEmployees.length} Selected
              </span>
            </div>
          </div>

          {step2Error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{step2Error}</span>
            </div>
          )}

          {/* Staged Config Summary Card */}
          <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono block">Payrun Name</span>
              <span className="font-bold text-white">{name}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono block">Structure</span>
              <span className="font-bold text-emerald-400">{selectedStructureObj?.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono block">Period</span>
              <span className="font-mono text-stone-300">{startDate} to {endDate}</span>
            </div>
          </div>

          {/* Selection Controls */}
          {eligibleEmployees.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-emerald-400 hover:underline font-semibold"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All Eligible'}
              </button>
              <span className="text-xs text-stone-500 font-mono">
                {eligibleEmployees.length} contract(s) qualified
              </span>
            </div>
          )}

          {/* Employees List */}
          <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-stone-800/80 bg-stone-900/20 p-2">
            {eligibleEmployees.length === 0 ? (
              <div className="py-12 text-center text-stone-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-stone-600" />
                <p className="text-xs">
                  No eligible employees found matching structure &ldquo;{selectedStructureObj?.name}&rdquo; for this period.
                </p>
                <p className="text-[11px] text-stone-600">
                  Ensure employees have status &ldquo;Active&rdquo; and an active contract assigned to this structure.
                </p>
              </div>
            ) : (
              eligibleEmployees.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                const hasBank = Boolean(emp.bankAccount || emp.bankAccountNumber || emp.bankDetails);

                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-stone-900/80 border-emerald-500/40 text-white'
                        : 'bg-stone-950/40 border-stone-800/60 text-stone-400 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div
                        className="rounded bg-stone-800 border-stone-700 text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{emp.name || emp.id}</span>
                          <span className="text-[10px] font-mono text-stone-500">ID: {emp.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-0.5">
                          <span>Contract: {emp.activeContract?.id || 'Active'}</span>
                          {!hasBank && (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Missing Bank Account
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-emerald-400 border border-stone-700">
                        Active Contract
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              disabled={selectedEmpIds.length === 0 || submitting}
              onClick={handleCreatePayrun}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin"></div>
                  <span>Creating Draft Payrun...</span>
                </>
              ) : (
                <>
                  <span>Create Payrun (Draft)</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
