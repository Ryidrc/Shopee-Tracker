import React, { useState, useEffect } from 'react';
import { TeamMember, KPIReport, TeamTask, TeamTaskCompletion, Issue, ProjectIdea, Shop } from '../types';
import { Plus, X, ChevronLeft, AlertCircle, CheckCircle, TrendingUp, TrendingDown, ClipboardList, Lightbulb, User, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface TeamKPIViewProps {
  members: TeamMember[];
  reports: KPIReport[];
  tasks: TeamTask[];
  taskCompletions: TeamTaskCompletion[];
  issues: Issue[];
  projects: ProjectIdea[];
  shops: Shop[];
  onUpdateMembers: (m: TeamMember[]) => void;
  onUpdateReports: (r: KPIReport[]) => void;
  onUpdateTasks: (t: TeamTask[]) => void;
  onUpdateTaskCompletions: (tc: TeamTaskCompletion[]) => void;
  onUpdateIssues: (i: Issue[]) => void;
  onUpdateProjects: (p: ProjectIdea[]) => void;
  role?: 'manager' | 'employee' | null;
  activeMemberId?: string;
}

export const TeamKPIView: React.FC<TeamKPIViewProps> = ({
  members, reports, tasks, taskCompletions, issues, projects, shops,
  onUpdateMembers, onUpdateReports, onUpdateTasks, onUpdateTaskCompletions, onUpdateIssues, onUpdateProjects,
  role, activeMemberId
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const viewMemberId = role === 'employee' ? activeMemberId : selectedMemberId;

  useEffect(() => {
    if (viewMemberId && !members.find(m => m.id === viewMemberId)) {
      // Only cleanup selectedMemberId if it's the one causing problems (manager mode)
      // If it's activeMemberId (employee mode), clearing selectedMemberId won't help, just prevents loop
      if (selectedMemberId) {
        setSelectedMemberId(null);
      }
    }
  }, [viewMemberId, members, selectedMemberId]);

  if (viewMemberId) {
    const member = members.find(m => m.id === viewMemberId);
    if (!member) {
      return <div className="p-8 text-center text-slate-500">Loading member profile...</div>;
    }
    return (
      <MemberDetail 
        member={member} 
        onBack={role === 'manager' ? () => setSelectedMemberId(null) : undefined}
        reports={reports.filter(r => r.memberId === member.id)}
        tasks={tasks.filter(t => t.isGlobal || (t.assignedMemberIds && t.assignedMemberIds.includes(member.id)))}
        taskCompletions={taskCompletions.filter(tc => tc.memberId === member.id)}
        issues={issues.filter(i => i.memberId === member.id)}
        projects={projects.filter(p => p.memberId === member.id)}
        shops={shops.filter(s => member.managedShopIds.includes(s.id))}
        onUpdateReports={(newReports) => {
          const others = reports.filter(r => r.memberId !== member.id);
          onUpdateReports([...others, ...newReports]);
        }}
        onUpdateTaskCompletions={(newTC) => {
          const others = taskCompletions.filter(tc => tc.memberId !== member.id);
          onUpdateTaskCompletions([...others, ...newTC]);
        }}
        onUpdateIssues={(newIssues) => {
          const others = issues.filter(i => i.memberId !== member.id);
          onUpdateIssues([...others, ...newIssues]);
        }}
        onUpdateProjects={(newProj) => {
          const others = projects.filter(p => p.memberId !== member.id);
          onUpdateProjects([...others, ...newProj]);
        }}
      />
    );
  }

  return (
    <ManagerDashboard 
      members={members} 
      reports={reports}
      tasks={tasks}
      taskCompletions={taskCompletions}
      issues={issues}
      shops={shops}
      onSelectMember={setSelectedMemberId}
      onUpdateMembers={onUpdateMembers}
      onUpdateTasks={onUpdateTasks}
      onUpdateIssues={onUpdateIssues}
    />
  );
};

// --- MANAGER DASHBOARD ---


const ManagerDashboard: React.FC<{
  members: TeamMember[];
  reports: KPIReport[];
  tasks: TeamTask[];
  taskCompletions: TeamTaskCompletion[];
  issues: Issue[];
  shops: Shop[];
  onSelectMember: (id: string) => void;
  onUpdateMembers: (m: TeamMember[]) => void;
  onUpdateTasks: (t: TeamTask[]) => void;
  onUpdateIssues: (i: Issue[]) => void;
}> = ({ members, reports, tasks, taskCompletions, issues, shops, onSelectMember, onUpdateMembers, onUpdateTasks, onUpdateIssues }) => {
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'pending');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Summarize sales for charting (last 7 days, sum across all members)
  const today = new Date();
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    const dayReports = reports.filter(r => r.date === dateStr);
    const totalSales = dayReports.reduce((sum, r) => sum + (r.penjualan || 0), 0);
    
    return { name: d.toLocaleDateString('en-US', { weekday: 'short' }), sales: totalSales, date: dateStr };
  });

  const getMemberTaskCompletion = (memberId: string) => {
    // Only looking at today's tasks for simplicity
    const dateStr = today.toISOString().split('T')[0];
    const memberTasks = tasks.filter(t => t.isGlobal || (t.assignedMemberIds && t.assignedMemberIds.includes(memberId)));
    if (memberTasks.length === 0) return 0;

    const completionsToday = taskCompletions.filter(tc => tc.memberId === memberId && tc.periodKey === dateStr && tc.completed);
    return Math.round((completionsToday.length / memberTasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Manager Dashboard</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition"
          >
            <ClipboardList size={18} /> Manage Tasks
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-shopee-orange text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-orange-600 transition"
          >
            <Plus size={18} /> Add Member
          </button>
        </div>
      </div>

      {openIssues.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold mb-2">
            <AlertCircle size={20} /> {openIssues.length} Open Issue{openIssues.length > 1 ? 's' : ''} — Action Required
          </div>
          <div className="space-y-2">
            {openIssues.map(issue => {
              const mName = members.find(m => m.id === issue.memberId)?.name || 'Unknown';
              return (
                <div key={issue.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-800 dark:text-white text-sm">{mName}: </span>
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{issue.title}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {issue.status === 'open' && <button onClick={() => onUpdateIssues(issues.map(i => i.id === issue.id ? {...i, status: 'pending'} : i))} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 font-medium">Mark Pending</button>}
                    {issue.status !== 'resolved' && <button onClick={() => onUpdateIssues(issues.map(i => i.id === issue.id ? {...i, status: 'resolved'} : i))} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">Resolve</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const completionRate = getMemberTaskCompletion(member.id);
          return (
            <div 
              key={member.id} 
              onClick={() => onSelectMember(member.id)}
              className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-md hover:border-shopee-orange transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{member.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {member.managedShopIds.map(sid => shops.find(s => s.id === sid)?.name).filter(Boolean).join(', ')}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); const ok = confirm("Remove this member?"); if(ok) onUpdateMembers(members.filter(m => m.id !== member.id)); }}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Remove Member"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Today's Tasks</span>
                    <span className="font-medium dark:text-white">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${completionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg mb-4 dark:text-white">Team Performance Overview (7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(v) => `Rp${v/1000000}M`} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="sales" fill="#EE4D2D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        shops={shops}
        onSave={(name, color, selectedShops) => {
          onUpdateMembers([...members, { id: `mem-${Date.now()}`, name, color, managedShopIds: selectedShops }]);
        }}
      />
      
      <TaskManagerModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tasks={tasks}
        onUpdateTasks={onUpdateTasks}
      />
    </div>
  );
};

// --- MEMBER DETAIL ---


const MemberDetail: React.FC<{
  member: TeamMember;
  onBack?: () => void;
  reports: KPIReport[];
  tasks: TeamTask[];
  taskCompletions: TeamTaskCompletion[];
  issues: Issue[];
  projects: ProjectIdea[];
  shops: Shop[];
  onUpdateReports: (r: KPIReport[]) => void;
  onUpdateTaskCompletions: (tc: TeamTaskCompletion[]) => void;
  onUpdateIssues: (i: Issue[]) => void;
  onUpdateProjects: (p: ProjectIdea[]) => void;
}> = ({
  member, onBack, reports, tasks, taskCompletions, issues, projects, shops,
  onUpdateReports, onUpdateTaskCompletions, onUpdateIssues, onUpdateProjects
}) => {
  const [activeTab, setActiveTab] = useState<'reports'|'tasks'|'issues'|'projects'>('reports');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSolution, setIssueSolution] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectPriority, setProjectPriority] = useState<'high'|'medium'|'low'>('medium');
  const [projectEstimate, setProjectEstimate] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);

  const getPeriodKey = (freq: string) => {
    const now = new Date();
    if (freq === 'daily') return now.toISOString().split('T')[0];
    if (freq === 'weekly') {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay());
      return 'week-' + d.toISOString().split('T')[0];
    }
    return 'month-' + now.getFullYear() + '-' + (now.getMonth() + 1);
  };

  const isTaskDone = (taskId: string, freq: string) =>
    taskCompletions.some(tc => tc.taskId === taskId && tc.memberId === member.id && tc.periodKey === getPeriodKey(freq) && tc.completed);

  const toggleTask = (taskId: string, freq: string) => {
    const key = getPeriodKey(freq);
    const existing = taskCompletions.find(tc => tc.taskId === taskId && tc.memberId === member.id && tc.periodKey === key);
    if (existing) {
      onUpdateTaskCompletions(taskCompletions.map(tc =>
        tc.taskId === taskId && tc.memberId === member.id && tc.periodKey === key
          ? { ...tc, completed: !tc.completed } : tc));
    } else {
      onUpdateTaskCompletions([...taskCompletions, { taskId, memberId: member.id, periodKey: key, completed: true }]);
    }
  };

  const handleIssueSubmit = () => {
    if (!issueTitle.trim()) return;
    const newIssue: Issue = { id: `iss-${Date.now()}`, date: new Date().toISOString().split('T')[0], memberId: member.id, title: issueTitle, description: issueDesc, solution: issueSolution, status: 'open' };
    onUpdateIssues([newIssue, ...issues]);
    setIssueTitle(''); setIssueDesc(''); setIssueSolution('');
  };

  const handleProjectSubmit = () => {
    if (!projectTitle.trim()) return;
    const newProj: ProjectIdea = { id: `proj-${Date.now()}`, date: new Date().toISOString().split('T')[0], memberId: member.id, title: projectTitle, description: projectDesc, estimatedTime: projectEstimate, priority: projectPriority };
    onUpdateProjects([newProj, ...projects]);
    setProjectTitle(''); setProjectDesc(''); setProjectEstimate(''); setShowProjectForm(false);
  };

  // Report Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportShopId, setReportShopId] = useState<string>('');
  const [reportSales, setReportSales] = useState<string>('');
  const [reportOrders, setReportOrders] = useState<string>('');
  const [reportConversion, setReportConversion] = useState<string>('');
  const [reportVisitors, setReportVisitors] = useState<string>('');

  const handleReportSubmit = () => {
    if (!reportDate || !reportShopId) {
      alert("Please select a date and shop.");
      return;
    }
    const newReport: KPIReport = {
      id: `rep-${Date.now()}`,
      date: reportDate,
      memberId: member.id,
      shopId: reportShopId,
      penjualan: Number(reportSales) || 0,
      pesanan: Number(reportOrders) || 0,
      konversi: Number(reportConversion) || 0,
      pengunjung: Number(reportVisitors) || 0
    };
    onUpdateReports([newReport, ...reports].sort((a, b) => b.date.localeCompare(a.date)));
    setReportSales(''); setReportOrders(''); setReportConversion(''); setReportVisitors('');
    setReportSubmitted(true); setTimeout(() => setReportSubmitted(false), 3000);
  };

  const tabs = [
    { id: 'reports', label: 'Daily Reports', icon: TrendingUp },
    { id: 'tasks', label: 'Task Checklist', icon: ClipboardList },
    { id: 'issues', label: 'Reviews & Issues', icon: AlertCircle },
    { id: 'projects', label: 'Projects & Ideas', icon: Lightbulb },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
      )}

      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md"
          style={{ backgroundColor: member.color }}
        >
          {member.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">{member.name}</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {shops.map(s => s.name).join(', ')}
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors",
                isActive 
                  ? "bg-shopee-orange text-white" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg dark:text-white">Daily Report Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                 <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
               </div>
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Shop</label>
                 <select value={reportShopId} onChange={e => setReportShopId(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">
                   <option value="">Select...</option>
                   {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Sales (Rp)</label>
                 <input type="number" value={reportSales} onChange={e => setReportSales(e.target.value)} placeholder="0" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
               </div>
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Orders</label>
                 <input type="number" value={reportOrders} onChange={e => setReportOrders(e.target.value)} placeholder="0" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
               </div>
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Conv Rate (%)</label>
                 <input type="number" step="0.01" value={reportConversion} onChange={e => setReportConversion(e.target.value)} placeholder="0.0" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
               </div>
               <div className="lg:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Visitors</label>
                 <input type="number" value={reportVisitors} onChange={e => setReportVisitors(e.target.value)} placeholder="0" className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" />
               </div>
               <div className="lg:col-span-6 flex justify-between items-center">
                 {reportSubmitted && <span className="text-green-600 font-medium text-sm flex items-center gap-1"><CheckCircle size={16}/> Report submitted!</span>}
                 <button onClick={handleReportSubmit} className="ml-auto bg-shopee-orange text-white rounded px-6 py-2 font-medium hover:bg-orange-600">Submit Report</button>
               </div>
            </div>
            
            <div className="mt-8 border-t dark:border-slate-800 pt-6">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg dark:text-white">Recent Reports</h3>
                 <span className="text-xs text-slate-400">{reports.length} total</span>
               </div>
               {reports.length === 0 ? (
                 <p className="text-slate-500 dark:text-slate-400 text-sm">No recent reports found.</p>
               ) : (
                 <div className="space-y-2">
                   {reports.map(r => (
                     <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                       <div className="flex items-center gap-3">
                         <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-500">
                           <TrendingUp size={16} />
                         </div>
                         <div>
                           <p className="font-bold dark:text-white">{shops.find(s => s.id === r.shopId)?.name || 'Unknown'}</p>
                           <p className="text-xs text-slate-500">{r.date}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3 mt-2 sm:mt-0">
                         <div className="flex gap-3 text-sm">
                           <div><span className="text-slate-500">Sales:</span> <span className="font-medium dark:text-white">Rp {(r.penjualan/1000).toFixed(0)}k</span></div>
                           <div><span className="text-slate-500">Orders:</span> <span className="font-medium dark:text-white">{r.pesanan}</span></div>
                           <div><span className="text-slate-500">Conv:</span> <span className="font-medium dark:text-white">{r.konversi}%</span></div>
                           <div><span className="text-slate-500">Vis:</span> <span className="font-medium dark:text-white">{r.pengunjung}</span></div>
                         </div>
                         <button
                           onClick={() => onUpdateReports(reports.filter(x => x.id !== r.id))}
                           className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 shrink-0"
                           title="Delete report"
                         >
                           <X size={16} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg dark:text-white mb-2">Checklist</h3>
            {tasks.length === 0 && <p className="text-slate-500 dark:text-slate-400">No tasks assigned yet. Ask the manager to add tasks.</p>}
            {['daily', 'weekly', 'monthly'].map(freq => {
              const freqTasks = tasks.filter(t => t.frequency === freq);
              if (freqTasks.length === 0) return null;
              const done = freqTasks.filter(t => isTaskDone(t.id, freq)).length;
              return (
                <div key={freq} className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold capitalize text-slate-700 dark:text-slate-300">{freq} Tasks</h4>
                    <span className="text-xs text-slate-500">{done}/{freqTasks.length} done</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3">
                    <div className={`h-1.5 rounded-full transition-all ${done===freqTasks.length?'bg-green-500':'bg-shopee-orange'}`} style={{width:`${freqTasks.length?done/freqTasks.length*100:0}%`}}/>
                  </div>
                  <div className="space-y-2">
                    {freqTasks.map(task => {
                      const done = isTaskDone(task.id, freq);
                      return (
                        <label key={task.id} onClick={() => toggleTask(task.id, freq)} className={clsx('flex items-start gap-3 p-3 rounded-lg cursor-pointer transition', done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800')}>
                          <input type="checkbox" checked={done} onChange={() => toggleTask(task.id, freq)} className="mt-1 w-4 h-4 accent-orange-500" />
                          <span className={clsx('text-slate-800 dark:text-slate-200', done && 'line-through text-slate-400')}>{task.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg dark:text-white">Reviews & Issues</h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-3">
              <input value={issueTitle} onChange={e=>setIssueTitle(e.target.value)} type="text" placeholder="Issue Title" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
              <textarea value={issueDesc} onChange={e=>setIssueDesc(e.target.value)} placeholder="Describe the issue..." className="w-full p-2 border rounded h-20 dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
              <textarea value={issueSolution} onChange={e=>setIssueSolution(e.target.value)} placeholder="Your proposed solution..." className="w-full p-2 border rounded h-16 dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
              <button onClick={handleIssueSubmit} disabled={!issueTitle.trim()} className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50">Report Issue</button>
            </div>
            <div className="space-y-3">
              {issues.length === 0 && <p className="text-slate-500 dark:text-slate-400">No reported issues yet.</p>}
              {issues.map(issue => (
                <div key={issue.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold dark:text-white">{issue.title}</h4>
                    <span className={clsx('text-xs px-2 py-1 rounded font-bold uppercase', issue.status==='open'?'bg-red-100 text-red-700':issue.status==='pending'?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700')}>{issue.status}</span>
                  </div>
                  <p className="text-sm text-slate-500">{issue.date}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{issue.description}</p>
                  {issue.solution && <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">💡 {issue.solution}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Projects & Ideas</h3>
              <button onClick={()=>setShowProjectForm(!showProjectForm)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2"><Plus size={16}/> New Idea</button>
            </div>
            {showProjectForm && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-3">
                <input value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} placeholder="Idea Title" className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
                <textarea value={projectDesc} onChange={e=>setProjectDesc(e.target.value)} placeholder="Description" className="w-full p-2 border rounded h-20 dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
                <div className="flex gap-2">
                  <input value={projectEstimate} onChange={e=>setProjectEstimate(e.target.value)} placeholder="Estimated time (e.g. 2 weeks)" className="flex-1 p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
                  <select value={projectPriority} onChange={e=>setProjectPriority(e.target.value as any)} className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                </div>
                <button onClick={handleProjectSubmit} disabled={!projectTitle.trim()} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50">Submit</button>
              </div>
            )}
            <div className="grid gap-3">
              {projects.length === 0 && <p className="text-slate-500 dark:text-slate-400">No ideas submitted yet.</p>}
              {projects.map(p => (
                <div key={p.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold dark:text-white">{p.title}</h4>
                    <span className={clsx('text-xs px-2 py-1 rounded font-bold uppercase', p.priority==='high'?'bg-red-100 text-red-700':p.priority==='medium'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700')}>{p.priority}</span>
                  </div>
                  <p className="text-sm text-slate-500">{p.date} {p.estimatedTime && `· Est: ${p.estimatedTime}`}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --- ADD MEMBER MODAL ---
const AddMemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, shops: string[]) => void;
  shops: Shop[];
}> = ({ isOpen, onClose, onSave, shops }) => {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#EE4D2D');
  const [selectedShops, setSelectedShops] = React.useState<string[]>([]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in p-6">
        <h3 className="font-bold text-lg mb-4 dark:text-white">Add New Team Member</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Member Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar Color</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 border rounded dark:bg-slate-800 dark:border-slate-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Managed Shops</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {shops.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedShops.includes(s.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedShops([...selectedShops, s.id]);
                    else setSelectedShops(selectedShops.filter(id => id !== s.id));
                  }} />
                  <span className="dark:text-white">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
          <button onClick={() => { onSave(name, color, selectedShops); onClose(); setName(''); setSelectedShops([]); }} className="px-4 py-2 bg-shopee-orange text-white rounded hover:bg-orange-600 disabled:opacity-50" disabled={!name}>Save</button>
        </div>
      </div>
    </div>
  );
};

// --- TASK MANAGER MODAL ---
const TaskManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tasks: TeamTask[];
  onUpdateTasks: (t: TeamTask[]) => void;
}> = ({ isOpen, onClose, tasks, onUpdateTasks }) => {
  const [newTask, setNewTask] = React.useState('');
  const [frequency, setFrequency] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in p-6 flex flex-col max-h-[90vh]">
        <h3 className="font-bold text-lg mb-4 dark:text-white">Manage Global Tasks</h3>
        <div className="flex gap-2 mb-6">
          <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} className="flex-1 p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="New task..." />
          <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button onClick={() => { if(newTask) { onUpdateTasks([...tasks, {id: Date.now().toString(), text: newTask, frequency, isGlobal: true}]); setNewTask(''); } }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {tasks.filter(t => t.isGlobal).map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded border dark:border-slate-700">
              <div>
                <p className="font-medium dark:text-white">{t.text}</p>
                <p className="text-xs text-slate-500 capitalize">{t.frequency}</p>
              </div>
              <button onClick={() => onUpdateTasks(tasks.filter(x => x.id !== t.id))} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={16} /></button>
            </div>
          ))}
          {tasks.filter(t => t.isGlobal).length === 0 && <p className="text-slate-500 italic text-center py-4">No global tasks defined.</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 dark:text-white rounded">Close</button>
        </div>
      </div>
    </div>
  );
};
