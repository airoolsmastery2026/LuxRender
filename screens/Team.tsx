import React from 'react';
import { useStore } from '../store';
import { UserPlus, Mail, CheckCircle } from 'lucide-react';

export const Team: React.FC = () => {
    return (
        <div className="p-4 md:p-8 pb-24 md:ml-20 max-w-4xl mx-auto">
             <h1 className="text-2xl font-bold text-white mb-6">Team & Collaboration</h1>
             
             <div className="bg-dark-surface rounded-2xl p-6 border border-dark-border mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">Members</h2>
                    <button className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                        <UserPlus size={16} /> Invite
                    </button>
                </div>
                
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b border-dark-border pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                    <img src={`https://picsum.photos/id/${50+i}/50/50`} />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-sm">Architect {i}</h4>
                                    <p className="text-xs text-gray-500">Editor • last active 2m ago</p>
                                </div>
                            </div>
                            <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">Active</span>
                        </div>
                    ))}
                </div>
             </div>

             <div className="bg-dark-surface rounded-2xl p-6 border border-dark-border">
                <h2 className="text-lg font-semibold text-white mb-4">Approval Workflow</h2>
                <div className="space-y-3">
                    <div className="flex gap-4 items-start">
                        <div className="mt-1"><CheckCircle className="text-green-500" size={20} /></div>
                        <div>
                            <p className="text-white text-sm">Villa Project v2 approved by <span className="text-brand-400">Manager Dave</span></p>
                            <span className="text-xs text-gray-500">Today at 10:30 AM</span>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start opacity-60">
                         <div className="mt-1"><Mail className="text-gray-500" size={20} /></div>
                        <div>
                            <p className="text-white text-sm">Invited <span className="text-brand-400">sarah@studio.com</span> to team</p>
                            <span className="text-xs text-gray-500">Yesterday</span>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};
