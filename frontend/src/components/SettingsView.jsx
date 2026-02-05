import React, { useState } from 'react';
import { Save, User, Shield, Bell } from 'lucide-react';

const SettingsView = () => {
    return (
        <div className="max-w-2xl mx-auto h-full flex flex-col space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white">System Settings</h2>
                <p className="text-slate-400">Configure your trading terminal</p>
            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><User size={20} /> User Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Display Name</label>
                            <input type="text" defaultValue="Trader" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Risk Tolerance</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                <option>Conservative</option>
                                <option>Moderate</option>
                                <option>Aggressive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-slate-800">
                    <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><Shield size={20} /> API Configuration</h3>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">OpenAI / LLM API Key (Optional)</label>
                        <input type="password" placeholder="sk-..." className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        <p className="text-xs text-slate-500 mt-1">Currently using Local FinBERT (Free)</p>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><Bell size={20} /> Notifications</h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                            <span className="text-slate-300">Price Alerts</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 accent-cyan-500" />
                            <span className="text-slate-300">Daily Market Summary</span>
                        </label>
                    </div>
                </div>

                <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end">
                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
