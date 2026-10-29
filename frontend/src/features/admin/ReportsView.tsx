import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatMoney } from '../../lib/money';
import { Calendar, Download, TrendingUp, ShieldAlert, FileText, ArrowRight, BarChart3, DollarSign } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { restaurant, activeBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<'pnl' | 'exceptions' | 'audit'>('pnl');

  // Date range presets
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days'>('30days');
  const [pnlData, setPnlData] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let days = 30;
      if (datePreset === 'today') days = 0;
      if (datePreset === '7days') days = 7;

      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);

      const sStr = start.toISOString().slice(0, 10);
      const eStr = end.toISOString().slice(0, 10);

      const pnl = await api.get(`/reports/profit-loss?branch_id=${activeBranch?.id || ''}&start_date=${sStr}&end_date=${eStr}`);
      setPnlData(pnl);

      const exc = await api.get(`/reports/exceptions`);
      setExceptions(exc || []);

      const logs = await api.get(`/audit-logs`);
      setAuditLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [datePreset, activeBranch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0D5C3A] bg-[#E6F4EA] px-2 py-0.5 rounded-full">
              Financial Management
            </span>
            <span className="text-xs text-[#64748B]">• Store Statements</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]">Financial & Operational Reports</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Automated Profit & Loss, theft control exceptions, and immutable audit logs</p>
        </div>

        {/* Date presets */}
        <div className="flex rounded-xl bg-white p-1 border border-[#E2E8F0] shadow-sm">
          <button
            onClick={() => setDatePreset('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              datePreset === 'today' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0D5C3A]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDatePreset('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              datePreset === '7days' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0D5C3A]'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              datePreset === '30days' ? 'bg-[#0D5C3A] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0D5C3A]'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-4 sm:gap-6 text-xs font-bold overflow-x-auto whitespace-nowrap pb-0.5 scrollbar-none">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 shrink-0 flex items-center gap-2 border-b-2 transition-all min-h-[40px] ${
            activeTab === 'pnl' ? 'border-[#0D5C3A] text-[#0D5C3A]' : 'border-transparent text-[#64748B] hover:text-[#0D5C3A]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Profit & Loss Statement (P&L)</span>
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={`pb-3 shrink-0 flex items-center gap-2 border-b-2 transition-all min-h-[40px] ${
            activeTab === 'exceptions' ? 'border-[#0D5C3A] text-[#0D5C3A]' : 'border-transparent text-[#64748B] hover:text-[#0D5C3A]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Theft Control & Cashier Exceptions</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 shrink-0 flex items-center gap-2 border-b-2 transition-all min-h-[40px] ${
            activeTab === 'audit' ? 'border-[#0D5C3A] text-[#0D5C3A]' : 'border-transparent text-[#64748B] hover:text-[#0D5C3A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>System Audit Log</span>
        </button>
      </div>

      {/* TAB 1: Profit & Loss Statement */}
      {activeTab === 'pnl' && pnlData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-[#64748B] uppercase">Net Sales Revenue</span>
              <h3 className="text-2xl font-black text-[#0F172A] mt-1">
                {formatMoney(pnlData.revenue_net_minor, restaurant?.currency)}
              </h3>
              <p className="text-[10px] text-[#64748B] mt-1">Excludes Output VAT and customer refunds</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-[#64748B] uppercase">Gross Profit</span>
              <h3 className="text-2xl font-black text-[#0D5C3A] mt-1">
                {formatMoney(pnlData.gross_profit_minor, restaurant?.currency)}
              </h3>
              <p className="text-[10px] text-[#64748B] mt-1">Net Revenue - FMCG COGS - Shrinkage</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-[#64748B] uppercase">Net Store Margin</span>
              <h3 className="text-2xl font-black text-[#0D5C3A] mt-1">
                {formatMoney(pnlData.net_profit_minor, restaurant?.currency)}
              </h3>
              <p className="text-[10px] text-[#0D5C3A] font-bold mt-1">
                Net Margin: {pnlData.margin_pct?.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Statement of Retail Performance</h3>

            <div className="divide-y divide-[#F1F5F9] text-xs">
              <div className="py-2.5 flex justify-between font-bold text-[#0F172A]">
                <span>Gross Checkout Invoiced Sales ({pnlData.orders_count} receipts)</span>
                <span>{formatMoney(pnlData.gross_sales_minor, restaurant?.currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-[#64748B] pl-4">
                <span>Less: Output Super Shop VAT (5%)</span>
                <span>-{formatMoney(pnlData.vat_minor, restaurant?.currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-[#64748B] pl-4">
                <span>Less: Customer Returns & Refunds</span>
                <span>-{formatMoney(pnlData.refunds_minor, restaurant?.currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-black text-[#0D5C3A] bg-[#E6F4EA] px-3 py-2 rounded-lg">
                <span>RETAIL REVENUE (NET)</span>
                <span className="text-[#0D5C3A] font-black">{formatMoney(pnlData.revenue_net_minor, restaurant?.currency)}</span>
              </div>

              <div className="py-2.5 flex justify-between font-bold text-[#0F172A]">
                <span>Cost of Goods Sold (Inventory Product Deductions)</span>
                <span>-{formatMoney(pnlData.cogs_minor - pnlData.wastage_minor, restaurant?.currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between text-[#64748B] pl-4">
                <span>Inventory Shrinkage & Spoilage</span>
                <span>-{formatMoney(pnlData.wastage_minor, restaurant?.currency)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-black text-[#0D5C3A] bg-[#E6F4EA] px-3 py-2 rounded-lg">
                <span>GROSS PROFIT</span>
                <span>{formatMoney(pnlData.gross_profit_minor, restaurant?.currency)}</span>
              </div>

              <div className="py-2.5 flex justify-between font-bold text-[#0F172A]">
                <span>Operating Expenses (Rent, Electricity, Cashier Salaries)</span>
                <span>-{formatMoney(pnlData.expenses_minor, restaurant?.currency)}</span>
              </div>
              {pnlData.expenses_breakdown &&
                Object.entries(pnlData.expenses_breakdown).map(([cat, amt]: any) => (
                  <div key={cat} className="py-1.5 flex justify-between text-[#64748B] pl-4 capitalize">
                    <span>• {cat}</span>
                    <span>{formatMoney(amt, restaurant?.currency)}</span>
                  </div>
                ))}

              <div className="py-3 flex justify-between text-sm font-black text-white bg-[#0D5C3A] px-4 rounded-xl mt-2 shadow-md">
                <span>NET STORE PROFIT</span>
                <span className="text-[#A3E5C1] font-black">{formatMoney(pnlData.net_profit_minor, restaurant?.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Exceptions Report */}
      {activeTab === 'exceptions' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <h3 className="font-black text-sm text-[#0F172A]">Theft & Cashier Exception Control Log</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">Price discounts, line voids, and customer returns with responsible cashier audit</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Cashier / Staff</th>
                  <th className="py-3 px-4">Details / Reason</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
                {exceptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#94A3B8]">
                      No supervisor overrides or suspicious exceptions recorded.
                    </td>
                  </tr>
                ) : (
                  exceptions.map((exc, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-black">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          {exc.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0D5C3A]">{exc.staff_name}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">
                        {exc.details ? JSON.stringify(exc.details) : '-'}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{new Date(exc.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[#0F172A]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#94A3B8]">
                      Audit log is empty.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-bold text-[#0D5C3A]">{log.user_name || 'System'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">{log.action}</td>
                      <td className="py-3 px-4 text-[#64748B]">{log.entity_type}</td>
                      <td className="py-3 px-4 text-[#64748B]">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsView;
