
import React, { useState } from 'react';
import { useStore } from '../store';
import { GradientButton } from '../components/GradientButton';
import { Phone, ArrowRight, ShieldCheck, Aperture } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login } = useStore();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep(2);
  };

  const handleOtpSubmit = () => {
    login(phone);
  };

  return (
    <div className="h-full bg-dark-bg flex flex-col p-8 pt-24 relative overflow-hidden">
       {/* Background Decors */}
       <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px]" />
       <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent opacity-50" />

       <div className="flex-1 z-10 flex flex-col items-center w-full">
          {/* LuxRender Logo */}
          <div className="mb-12 text-center">
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-gold to-orange-400 flex items-center justify-center shadow-glow-gold mb-4 mx-auto relative group">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all"></div>
                <span className="text-4xl font-serif font-bold text-black relative z-10">L</span>
                <Aperture className="absolute bottom-2 right-2 text-black/80 w-6 h-6 animate-spin-slow" />
             </div>
             <h1 className="text-3xl">
                <span className="font-serif font-bold text-brand-gold">Lux</span>
                <span className="font-sans font-light text-white tracking-widest">Render</span>
             </h1>
          </div>

          <div className="w-full flex flex-col items-center">
            <h2 className="text-xl font-bold text-white mb-2 text-center">
                {step === 1 ? 'Đăng nhập đẳng cấp' : 'Xác thực bảo mật'}
            </h2>
            <p className="text-gray-400 mb-8 text-center text-sm">
                {step === 1 
                ? 'Nhập số điện thoại để truy cập kho dữ liệu BĐS.' 
                : `Mã OTP đã được gửi đến ${phone}`}
            </p>

            {step === 1 ? (
                <div className="space-y-6 w-full flex flex-col items-center">
                    <div className="bg-dark-surface border border-dark-border rounded-xl flex items-center p-4 focus-within:border-brand-gold transition-colors shadow-lg w-full md:w-[30%]">
                        <Phone className="text-brand-gold mr-3" size={20} />
                        <div className="w-px h-6 bg-gray-700 mr-3"></div>
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Số điện thoại"
                            className="bg-transparent text-white text-lg w-full focus:outline-none placeholder:text-gray-600 font-medium"
                        />
                    </div>
                    <div className="w-full md:w-[30%]">
                        <GradientButton variant="gold" onClick={handlePhoneSubmit} fullWidth disabled={phone.length < 10}>
                            Tiếp tục <ArrowRight size={18} className="ml-2" />
                        </GradientButton>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 w-full md:w-[30%]">
                    <div className="flex gap-2 justify-between px-2">
                        {otp.map((digit, i) => (
                            <input 
                            key={i}
                            maxLength={1}
                            value={digit}
                            className="w-12 h-14 bg-dark-surface border border-dark-border rounded-xl text-center text-brand-gold text-2xl font-serif font-bold focus:border-brand-gold focus:shadow-glow-gold focus:outline-none transition-all"
                            onChange={(e) => {
                                const newOtp = [...otp];
                                newOtp[i] = e.target.value;
                                setOtp(newOtp);
                                if(e.target.value && i < 5) {
                                    const next = document.querySelector(`input:nth-child(${i+2})`) as HTMLInputElement;
                                    next?.focus();
                                }
                            }}
                            />
                        ))}
                    </div>
                    <GradientButton variant="gold" onClick={handleOtpSubmit} fullWidth>
                        Xác nhận
                    </GradientButton>
                    <button onClick={() => setStep(1)} className="w-full text-center text-gray-500 text-sm hover:text-white">
                        Gửi lại mã?
                    </button>
                </div>
            )}
          </div>
       </div>

       <div className="mt-auto text-center">
          <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1 uppercase tracking-widest">
             <ShieldCheck size={10} /> Secured by LuxRender Core
          </p>
       </div>
    </div>
  );
};
