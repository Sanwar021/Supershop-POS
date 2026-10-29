import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Save, Store, Receipt, Percent, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { restaurant } = useAuth();
  const [name, setName] = useState<string>('NovaMart');
  const [phone, setPhone] = useState<string>('+880 1711-000000');
  const [address, setAddress] = useState<string>('Plot 12, Road 11, Block D, Banani, Dhaka-1213');
  const [taxNo, setTaxNo] = useState<string>('BIN-001928374-0101');
  const [currency, setCurrency] = useState<string>('BDT');

  // Tax settings
  const [vatPct, setVatPct] = useState<number>(5); // 5% retail super shop VAT
  const [servicePct, setServicePct] = useState<number>(0); // 0% service charge in super shop
  const [isInclusive, setIsInclusive] = useState<boolean>(true);

  // Receipt settings
  const [receiptHeader, setReceiptHeader] = useState<string>('NovaMart Super Shop\nEveryday essentials, intelligently managed');
  const [receiptFooter, setReceiptFooter] = useState<string>('Thank you for shopping with NovaMart!\nExchange within 7 days with original invoice.');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const rest = await api.get('/restaurant');
        if (rest) {
          setName(rest.name || 'NovaMart');
          setPhone(rest.phone || '+880 1711-000000');
          setAddress(rest.address || 'Plot 12, Road 11, Block D, Banani, Dhaka-1213');
          setTaxNo(rest.tax_no || 'BIN-001928374-0101');
          setCurrency(rest.currency || 'BDT');
        }

        const settings = await api.get('/settings');
        if (settings) {
          if (settings.tax) {
            setVatPct(settings.tax.vat_pct ?? 5);
            setServicePct(settings.tax.service_pct ?? 0);
            setIsInclusive(settings.tax.is_inclusive ?? true);
          }
          if (settings.receipt) {
            setReceiptHeader(settings.receipt.header || 'NovaMart Super Shop\nEveryday essentials, intelligently managed');
            setReceiptFooter(settings.receipt.footer || 'Thank you for shopping with NovaMart!\nExchange within 7 days with original invoice.');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.patch('/restaurant', {
        name,
        phone,
        address,
        tax_no: taxNo,
        currency,
      });

      await api.patch('/settings', {
        tax: {
          vat_pct: vatPct,
          service_pct: servicePct,
          is_inclusive: isInclusive,
          rounding_unit: 100,
          vat_on_service: false,
        },
        receipt: {
          header: receiptHeader,
          footer: receiptFooter,
          paper_width: '80mm',
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert('Error saving store configuration: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0D5C3A] bg-[#E6F4EA] px-2 py-0.5 rounded-full">
              Enterprise Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]">Store & Legal Settings</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Manage store branding, NBR BIN registration, VAT rates, and 80mm receipt templates</p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#0A472D] text-white text-xs font-black shadow-sm disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </>
          )}
        </button>
      </div>

      {/* Section 1: Store Legal Info */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
          <Store className="w-4 h-4 text-[#0D5C3A]" />
          <h3 className="text-sm font-extrabold text-[#0F172A]">Store Identity & Contact</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Brand / Store Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Helpline / Phone</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">NBR BIN / Trade License Number</label>
            <input
              type="text"
              value={taxNo}
              onChange={(e) => setTaxNo(e.target.value)}
              placeholder="e.g. BIN-001928374-0101"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Currency Code</label>
            <input
              type="text"
              disabled
              value={currency}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#64748B] cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Headquarters / Outlet Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Taxation & VAT */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
          <Percent className="w-4 h-4 text-[#0D5C3A]" />
          <h3 className="text-sm font-extrabold text-[#0F172A]">Taxation & Super Shop VAT Engine</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Super Shop VAT Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={vatPct}
              onChange={(e) => setVatPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
            <p className="text-[10px] text-[#64748B] mt-1">Standard retail super shop rate in Bangladesh: 5%</p>
          </div>

          <div className="flex flex-col justify-center pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={isInclusive}
                onChange={(e) => setIsInclusive(e.target.checked)}
                className="rounded text-[#0D5C3A] focus:ring-[#0D5C3A]"
              />
              <span>Prices entered in catalogue include VAT (Tax-inclusive pricing)</span>
            </label>
            <p className="text-[10px] text-[#64748B] mt-1 pl-5">
              Cashier bill displays extracted 5% VAT on receipt automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Receipt Template */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
          <Receipt className="w-4 h-4 text-[#0D5C3A]" />
          <h3 className="text-sm font-extrabold text-[#0F172A]">80mm Thermal Receipt Header & Footer</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Receipt Header</label>
            <textarea
              rows={3}
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Receipt Footer & Return Policy</label>
            <textarea
              rows={3}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
export default SettingsView;
