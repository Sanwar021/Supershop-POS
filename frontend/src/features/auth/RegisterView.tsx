import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Building2 } from 'lucide-react';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountType = searchParams.get('type') === 'business' ? 'business' : 'partner';
  const isBusiness = accountType === 'business';
  const { login } = useAuth();
  const [storeName, setStoreName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BDT');

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalizedName = storeName.trim();
    const normalizedOwner = ownerName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    if (!normalizedName || !normalizedOwner || !normalizedEmail || !normalizedPhone) {
      setError('Please complete every required field.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/auth/register', {
        restaurant_name: normalizedName,
        owner_name: normalizedOwner,
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        currency,
        account_type: accountType,
      });

      // Auto login with new credentials
      await login(normalizedEmail, password);
      navigate('/pos');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#E6F4EA_0%,_#F8FAFC_45%,_#EBF2EE_100%)] flex flex-col justify-center items-center p-4 selection:bg-[#0D5C3A] selection:text-white">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0D5C3A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#E21B70] flex items-center justify-center text-white font-black shadow-lg shadow-[#E21B70]/25 mb-3">
            {isBusiness ? <Building2 className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            {isBusiness ? 'Create Your Business Account' : 'Become a Supermarket Partner'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">Multi-branch retail management • 14 days full trial</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">{isBusiness ? 'Business / Organization Name:' : 'Super Shop / Store Name:'}</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder={isBusiness ? 'e.g. Acme Trading Ltd.' : 'e.g. NovaMart Super Shop'}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">{isBusiness ? 'Account Administrator:' : 'Owner / Director Name:'}</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={isBusiness ? 'e.g. Procurement Manager' : 'e.g. Rahim Chowdhury'}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#0F172A] mb-1 block">Work Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@novamart.com"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#0F172A] mb-1 block">Contact Phone:</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1711..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Password (min 6 chars):</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F172A] mb-1 block">Confirm Password:</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Enter the same password again"
              autoComplete="new-password"
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#E21B70]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#0D5C3A] hover:bg-[#0A472D] text-white text-xs font-black shadow-md shadow-[#0D5C3A]/20 transition-all disabled:opacity-50 mt-4 min-h-[44px]"
          >
            {isSubmitting ? 'Creating your account...' : isBusiness ? 'Create Business Account' : 'Create Partner Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#64748B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0D5C3A] font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterView;
