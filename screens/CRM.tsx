
import React from 'react';
import { useStore } from '../store';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { Phone, MessageSquare, TrendingUp, Users, Calendar, ArrowUpRight, Filter } from 'lucide-react';

export const CRM: React.FC = () => {
    const { leads } = useStore();
    
    const pieData = [
        { name: 'Mới', value: 30, color: '#00D4B1' },
        { name: 'Đã gọi', value: 45, color: '#0078D4' },
        { name: 'Chốt', value: 25, color: '#FFD700' },
    ];

    const barData = [
        { day: 'T2', leads: 4 },
        { day: 'T3', leads: 7 },
        { day: 'T4', leads: 2 },
        { day: 'T5', leads: 9 },
        { day: 'T6', leads: 6 },
        { day: 'T7', leads: 3 },
        { day: 'CN', leads: 5 },
    ];

    const StatCard = ({ label, value, sub, subColor, icon: Icon }: any) => (
        <div className="bg-dark-surface p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col justify-between h-full hover:border-brand-gold/20 transition-all group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                {Icon && <Icon size={16} className="text-gray-600 group-hover:text-brand-gold transition-colors" />}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <span className={`${subColor} text-xs font-medium flex items-center gap-1`}>
                    {sub}
                </span>
            </div>
        </div>
    );

    return (
        <div className="h-full">
            <Header />
            
            <div className="px-4 md:px-8 max-w-[1600px] mx-auto pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Sales Dashboard</h1>
                        <p className="text-gray-400 text-sm mt-1">Tổng quan hiệu suất kinh doanh hôm nay</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-dark-surface text-white px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/5 flex items-center gap-2">
                            <Calendar size={16} /> Tháng này
                        </button>
                        <button className="bg-brand-gold text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white transition-colors shadow-glow-gold">
                            <ArrowUpRight size={16} /> Xuất Báo Cáo
                        </button>
                    </div>
                </div>
                
                {/* Stats Grid - Fixed equal heights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <StatCard 
                        label="Lead Mới" 
                        value="12" 
                        sub="+20% so với hôm qua" 
                        subColor="text-green-400" 
                        icon={Users}
                    />
                     <StatCard 
                        label="Tỷ lệ Chuyển đổi" 
                        value="4.2%" 
                        sub="+0.5% tuần này" 
                        subColor="text-brand-gold" 
                        icon={TrendingUp}
                    />
                    <StatCard 
                        label="Doanh Thu (Est)" 
                        value="$1.2M" 
                        sub="Đạt 85% mục tiêu" 
                        subColor="text-blue-400" 
                        icon={ArrowUpRight}
                    />
                    <StatCard 
                        label="Lịch Hẹn" 
                        value="08" 
                        sub="Sắp diễn ra: 2" 
                        subColor="text-purple-400" 
                        icon={Calendar}
                    />
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-dark-surface p-6 rounded-2xl border border-white/5 shadow-lg min-h-[350px]">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-base">Biểu đồ Lead Tuần</h3>
                            <button className="p-1 text-gray-400 hover:text-white"><Filter size={16}/></button>
                         </div>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <Bar dataKey="leads" fill="#0078D4" radius={[4,4,0,0]} barSize={40} />
                                    <XAxis dataKey="day" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                        contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} 
                                        itemStyle={{color: '#fff'}} 
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-dark-surface p-6 rounded-2xl border border-white/5 shadow-lg min-h-[350px]">
                        <h3 className="text-white font-bold text-base mb-6">Phân loại Khách hàng</h3>
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}} itemStyle={{color: '#fff'}} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-2xl font-bold text-white block">100</span>
                                <span className="text-[10px] text-gray-500 uppercase">Tổng Lead</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leads List Table */}
                <div className="bg-dark-surface rounded-2xl border border-white/5 overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">Lead Nóng <span className="text-red-500 text-xs bg-red-500/10 px-2 py-0.5 rounded-full">LIVE</span></h3>
                        <button className="text-brand-gold text-sm font-medium hover:underline">Xem tất cả</button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leads.map(lead => (
                            <div key={lead.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/5 hover:border-brand-gold/30 transition-all cursor-pointer">
                                <div>
                                    <h4 className="text-white font-bold text-sm group-hover:text-brand-gold transition-colors">{lead.name}</h4>
                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                        <span className="text-brand-start text-[10px] font-bold bg-brand-start/10 px-2 py-0.5 rounded">{lead.interest}</span>
                                        {lead.score && lead.score > 800 && <span className="text-red-400 text-[10px] font-bold bg-red-900/20 px-2 py-0.5 rounded flex items-center gap-1">HOT {lead.score}</span>}
                                    </div>
                                    <p className="text-gray-500 text-[10px] mt-2 flex items-center gap-1.5">
                                        {lead.source === 'zalo' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block shadow-[0_0_5px_blue]"></span>}
                                        {lead.source === 'facebook' && <span className="w-1.5 h-1.5 rounded-full bg-blue-700 block shadow-[0_0_5px_blue]"></span>}
                                        {lead.source === 'telegram' && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 block shadow-[0_0_5px_skyblue]"></span>}
                                        <span className="opacity-70">{lead.date} via {lead.source}</span>
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors border border-green-500/20">
                                        <Phone size={14} />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors border border-blue-500/20">
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};
