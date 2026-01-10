import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { ICONS } from '../constants';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, error } = await supabaseService.signIn(email, password);
      if (error) {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      } else if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError('Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-emerald-500/20 mb-4">
                K
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Hoş Geldiniz</h1>
            <p className="text-slate-500">Kuruyemiş & Cafe POS Sistemi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <div className="relative">
                    <ICONS.Retail className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                <div className="relative">
                    <ICONS.Settings className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <ICONS.Close size={16} />
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
            Demo Modu için herhangi bir e-posta/şifre girebilirsiniz.
        </div>
      </div>
    </div>
  );
};

export default Login;