import { useEffect, useState } from 'react';
import type { Account } from '../../types/account.types';
import { PeriodSelector } from '../molecules/PeriodSelector';
import { Button } from '../atoms/Button';
import { useAppSelector } from '../../store/hooks';
import {
  fetchPayrollsApi,
  fetchWorkingDaysApi,
  processPayrollApi,
  recordPayrollPaymentApi,
  saveWorkingDaysApi,
} from '../../services/hrService';

interface PayrollPanelProps {
  propertyId?: number;
  employees: Account[];
  onClose: () => void;
}

export default function PayrollPanel({ propertyId, employees, onClose }: PayrollPanelProps) {
  const token = useAppSelector((state) => state.auth?.accessToken ?? null);

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [activeTab, setActiveTab] = useState<'payroll' | 'workingDays'>('payroll');
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [workRecords, setWorkRecords] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment modal state
  const [paymentModalPayroll, setPaymentModalPayroll] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceId, setReferenceId] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const staffList = employees.filter((emp) => emp.role === 'MANAGER' || emp.role === 'STAFF' || emp.baseSalary);

  const [yearStr, monthStr] = selectedPeriod.split('-');
  const year = parseInt(yearStr || '2026', 10);
  const month = parseInt(monthStr || '10', 10);
  const maxDaysInMonth = new Date(year, month, 0).getDate();

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const [payrollData, workData] = await Promise.all([
        fetchPayrollsApi(selectedPeriod, propertyId, token),
        fetchWorkingDaysApi(selectedPeriod, propertyId, token),
      ]);
      setPayrolls(payrollData);

      const map: Record<number, number> = {};
      workData.forEach((w: any) => {
        map[w.accountId] = w.workingDays;
      });
      setWorkRecords(map);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load payroll data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedPeriod, propertyId, token]);

  const handleProcessPayroll = async () => {
    if (!token) return;
    setProcessing(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await processPayrollApi({ propertyId, payrollPeriod: selectedPeriod }, token);
      setMessage(`Successfully processed payroll for ${res.length} staff member(s).`);
      void loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to process payroll.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveWorkingDays = async (accountId: number, days: number) => {
    if (!token) return;
    if (days < 0 || days > maxDaysInMonth) {
      setErrorMessage(`Working days must be between 0 and ${maxDaysInMonth} for this month.`);
      return;
    }
    setErrorMessage(null);
    try {
      await saveWorkingDaysApi(
        {
          accountId,
          propertyId,
          payrollPeriod: selectedPeriod,
          workingDays: days,
        },
        token
      );
      setWorkRecords((prev) => ({ ...prev, [accountId]: days }));
      setMessage(`Working days updated for employee #${accountId}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save working days.');
    }
  };

  const handleRecordPayment = async () => {
    if (!token || !paymentModalPayroll) return;
    setIsRecordingPayment(true);
    setErrorMessage(null);
    try {
      await recordPayrollPaymentApi(
        paymentModalPayroll.id,
        {
          paymentMethod,
          referenceId,
        },
        token
      );
      setMessage(`Payment recorded for ${paymentModalPayroll.account?.firstName} ${paymentModalPayroll.account?.lastName}.`);
      setPaymentModalPayroll(null);
      setReferenceId('');
      void loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const totalPayrollAmount = payrolls.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
  const paidPayrollAmount = payrolls
    .filter((p) => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + Number(p.netSalary || 0), 0);

  return (
    <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Payroll & Work Records</h2>
          <p className="text-sm text-slate-500">
            Period: {selectedPeriod} {propertyId ? `(Property #${propertyId})` : '(Organization-wide)'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
          <Button variant="secondary" onClick={onClose}>
            Back to Directory
          </Button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'payroll'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Payroll Processing & Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workingDays')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'workingDays'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Monthly Working Days
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      )}

      {activeTab === 'payroll' && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Eligible Staff</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{staffList.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Generated Records</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{payrolls.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Net Payroll</span>
              <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                ₹{totalPayrollAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Disbursed (Paid)</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                ₹{paidPayrollAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={processing}
              onClick={() => void handleProcessPayroll()}
            >
              Generate / Lock {selectedPeriod} Payroll
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-700">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role / Designation</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      {loading
                        ? 'Loading payroll data...'
                        : 'No payroll generated for this period yet. Click "Generate / Lock Payroll" above.'}
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {payroll.account?.firstName} {payroll.account?.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {payroll.account?.designation || payroll.account?.role}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 dark:text-white">
                        ₹{Number(payroll.baseSalary || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {payroll.workingDays != null ? `${payroll.workingDays} days` : 'Full month'}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600">
                        -₹{Number(payroll.totalDeductions || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{Number(payroll.netSalary || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            payroll.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {payroll.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {payroll.paymentStatus !== 'PAID' ? (
                          <button
                            type="button"
                            onClick={() => setPaymentModalPayroll(payroll)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
                          >
                            Record Payment
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Paid on {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'N/A'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'workingDays' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <strong>Administrative Notice:</strong> Monthly working-day counts are recorded directly as non-negative whole numbers (maximum {maxDaysInMonth} days in {selectedPeriod}). No daily attendance marking, biometric clock-ins, or present/absent registers are maintained.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 dark:border-slate-700">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Monthly Working Days (Max {maxDaysInMonth})</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  staffList.map((emp) => {
                    const daysVal = workRecords[emp.id] ?? maxDaysInMonth;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {emp.designation || emp.role}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {emp.department || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max={maxDaysInMonth}
                            value={daysVal}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setWorkRecords((prev) => ({ ...prev, [emp.id]: isNaN(val) ? 0 : val }));
                            }}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => void handleSaveWorkingDays(emp.id, daysVal)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                          >
                            Save Days
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {paymentModalPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Salary Disbursement</h3>
            <p className="mt-1 text-sm text-slate-500">
              Employee: {paymentModalPayroll.account?.firstName} {paymentModalPayroll.account?.lastName}
            </p>
            <p className="mt-1 text-sm font-mono font-bold text-indigo-600">
              Net Amount: ₹{Number(paymentModalPayroll.netSalary).toLocaleString()}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Transaction Reference / UTR ID
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className="w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPaymentModalPayroll(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={isRecordingPayment}
                onClick={() => void handleRecordPayment()}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
