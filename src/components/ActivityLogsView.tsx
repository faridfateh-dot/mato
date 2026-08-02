import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { History, Shield, Search, UserCheck, Clock } from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const { activityLogs, currentRestaurant } = useData();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = activityLogs.filter(log => {
    const matchesRole = filterRole === 'all' || log.userRole === filterRole;
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" />
          <span>سجل العمليات الأمني (Activity Logs & Audit Trail)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          سجل كامل غير قابل للتعديل يتتبع كل مستخدم، تاريخ، نوع العملية والبيانات المعدلة
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالعملية أو المستخدم..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-600">تصفية حسب الدور:</span>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
          >
            <option value="all">جميع الأدوار</option>
            <option value="Owner">المالك (Owner)</option>
            <option value="Manager">المدير (Manager)</option>
            <option value="Cashier">الكاشير (Cashier)</option>
            <option value="Inventory Manager">مدير المخزون (Inventory)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">المستخدم والتفاصيل</th>
                <th className="p-3.5">الدور والصلاحية</th>
                <th className="p-3.5">نوع العملية</th>
                <th className="p-3.5">البيانات والوصف المتغير</th>
                <th className="p-3.5 text-left">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>{log.userName}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900">{log.actionType}</td>
                  <td className="p-3.5 text-slate-700 leading-relaxed max-w-md">{log.description}</td>
                  <td className="p-3.5 text-left text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('ar-SY')} {new Date(log.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
