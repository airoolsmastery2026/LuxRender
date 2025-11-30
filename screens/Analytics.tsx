import React from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const data = [
  { name: 'Mon', views: 400, likes: 240 },
  { name: 'Tue', views: 300, likes: 139 },
  { name: 'Wed', views: 200, likes: 980 },
  { name: 'Thu', views: 278, likes: 390 },
  { name: 'Fri', views: 1890, likes: 480 },
  { name: 'Sat', views: 2390, likes: 380 },
  { name: 'Sun', views: 3490, likes: 430 },
];

export const Analytics: React.FC = () => {
  const { language } = useStore();

  return (
    <div className="p-4 md:p-8 pb-24 md:ml-20 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
            {language === 'vi' ? 'Hiệu quả Marketing' : 'Marketing Analytics'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border">
                <p className="text-gray-400 text-sm">Total Views</p>
                <h3 className="text-3xl font-bold text-white mt-1">12.5k</h3>
                <span className="text-green-500 text-xs font-medium flex items-center mt-2">↑ 12% vs last week</span>
            </div>
            <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border">
                <p className="text-gray-400 text-sm">Engagement Rate</p>
                <h3 className="text-3xl font-bold text-white mt-1">4.2%</h3>
                <span className="text-green-500 text-xs font-medium flex items-center mt-2">↑ 0.8% vs last week</span>
            </div>
            <div className="bg-dark-surface p-6 rounded-2xl border border-dark-border">
                <p className="text-gray-400 text-sm">Leads Generated</p>
                <h3 className="text-3xl font-bold text-brand-500 mt-1">86</h3>
                <span className="text-gray-500 text-xs font-medium flex items-center mt-2">Direct from video link</span>
            </div>
        </div>

        <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border h-64 mb-6">
            <h3 className="text-white font-semibold mb-4 text-sm">Views Over Time</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border h-64">
            <h3 className="text-white font-semibold mb-4 text-sm">Audience Retention (Heatmap)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="likes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
