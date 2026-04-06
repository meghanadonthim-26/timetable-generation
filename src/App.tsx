import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  User,
  BookOpen,
  Activity,
  Terminal,
  Download,
  Settings2,
  Users,
  UserMinus,
  LayoutGrid
} from "lucide-react";

interface TimetableSlot {
  section: string;
  day: string;
  period: number;
  subject: string;
  teacher: string;
  isConflict?: boolean;
  conflictMessage?: string;
}

interface GenerationResult {
  timetable: TimetableSlot[];
  logs: string[];
  attempts: number;
}

export default function App() {
  const [sections, setSections] = useState<string>("CSE-A, CSE-B");
  const [activeSection, setActiveSection] = useState<string>("CSE-A");
  const [subjects, setSubjects] = useState<string>("Mathematics, Physics, Chemistry, English, Computer Science, Biology");
  const [labs, setLabs] = useState<string[]>(["Physics", "Chemistry"]);
  const [absentTeachers, setAbsentTeachers] = useState<string[]>([]);
  const [constraints, setConstraints] = useState({
    maxClassesPerDay: 6,
    avoidConsecutive: true
  });
  
  const [teacherMap, setTeacherMap] = useState<Record<string, string>>({
    "Mathematics": "Dr. Smith",
    "Physics": "Prof. Johnson",
    "Chemistry": "Dr. Brown",
    "English": "Ms. Davis",
    "Computer Science": "Mr. Wilson",
    "Biology": "Dr. Lee"
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const sectionList = sections.split(",").map(s => s.trim()).filter(s => s);
      const subjectList = subjects.split(",").map(s => s.trim()).filter(s => s);
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sectionList,
          subjects: subjectList,
          teachers: teacherMap,
          labs: labs,
          absentTeachers,
          constraints
        })
      });
      
      if (!response.ok) throw new Error("Failed to generate timetable");
      
      const data = await response.json();
      setResult(data);
      if (sectionList.length > 0) setActiveSection(sectionList[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleLab = (subject: string) => {
    setLabs(prev => 
      prev.includes(subject) 
        ? prev.filter(l => l !== subject) 
        : [...prev, subject]
    );
  };

  const toggleAbsence = (teacher: string) => {
    setAbsentTeachers(prev => 
      prev.includes(teacher) 
        ? prev.filter(t => t !== teacher) 
        : [...prev, teacher]
    );
  };

  const updateTeacher = (subject: string, name: string) => {
    setTeacherMap(prev => ({ ...prev, [subject]: name }));
  };

  const exportCSV = () => {
    if (!result) return;
    let csv = "Section,Day,Period,Subject,Teacher\n";
    result.timetable.forEach(s => {
      csv += `${s.section},${s.day},${s.period},${s.subject},${s.teacher}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "timetable.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6];

  const getSlot = (day: string, period: number) => {
    return result?.timetable.find(s => s.section === activeSection && s.day === day && s.period === period);
  };

  const workloadSummary = () => {
    if (!result) return [];
    const counts: Record<string, { total: number; absent: boolean }> = {};
    
    // Initialize all teachers
    Object.values(teacherMap).forEach((name) => {
      const teacherName = name as string;
      counts[teacherName] = { total: 0, absent: absentTeachers.includes(teacherName) };
    });

    result.timetable.forEach(s => {
      if (counts[s.teacher]) {
        counts[s.teacher].total += 1;
      }
    });
    return Object.entries(counts).map(([name, data]) => ({ name, ...data }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4"
          >
            <Activity className="w-4 h-4" />
            Advanced Agentic AI System
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Smart AI Timetable Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Multi-class support, conflict detection, and real-time agentic optimization.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Sections
                  </label>
                  <input
                    type="text"
                    value={sections}
                    onChange={(e) => setSections(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="CSE-A, CSE-B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subjects (Comma separated)
                  </label>
                  <textarea
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Teacher & Lab Settings
                  </label>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {subjects.split(",").map(s => s.trim()).filter(s => s).map((sub) => (
                      <div key={sub} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 truncate">{sub}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleLab(sub)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                labs.includes(sub) ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              LAB
                            </button>
                            <button
                              onClick={() => toggleAbsence(teacherMap[sub])}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                absentTeachers.includes(teacherMap[sub]) ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              ABSENT
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={teacherMap[sub] || ""}
                          onChange={(e) => updateTeacher(sub, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          placeholder="Teacher"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    Optimize AI
                  </button>
                  {result && (
                    <button
                      onClick={exportCSV}
                      className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* AI Logs */}
            <AnimatePresence>
              {result && (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 rounded-2xl shadow-lg p-6 text-slate-300 font-mono text-[10px]"
                >
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Terminal className="w-4 h-4" />
                    <span>Agent Optimization Logs</span>
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {result.logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-indigo-400">[{i+1}]</span>
                        <span className={log.includes("Success") ? "text-emerald-400" : ""}>{log}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Timetable Display */}
          <div className="lg:col-span-8 space-y-6">
            {result && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {sections.split(",").map(s => s.trim()).filter(s => s).map(section => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      activeSection === section 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                        : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            )}

            {!result && !loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <p>Configure sections and subjects to start optimization.</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <p className="mt-6 text-slate-600 font-medium">Agent is solving multi-class constraints...</p>
              </div>
            )}

            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Timetable Grid */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Day</th>
                          {periods.map(p => (
                            <th key={p} className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Period {p}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {days.map(day => (
                          <tr key={day} className="border-b border-slate-100 last:border-0">
                            <td className="p-4 font-bold text-slate-700 bg-slate-50/50">{day}</td>
                            {periods.map(p => {
                              const slot = getSlot(day, p);
                              return (
                                <td key={p} className="p-2">
                                  <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    title={slot?.conflictMessage}
                                    className={`p-3 rounded-xl h-full min-h-[85px] flex flex-col justify-between border transition-all ${
                                      slot?.isConflict
                                        ? "bg-red-50 border-red-200 ring-2 ring-red-500 ring-offset-2"
                                        : slot?.subject.includes("(Lab)")
                                        ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                                        : "bg-indigo-50 text-indigo-900 border-indigo-100"
                                    }`}
                                  >
                                    <div className={`text-[11px] font-bold leading-tight mb-1 ${
                                      slot?.isConflict ? "text-red-700" : slot?.subject.includes("(Lab)") ? "text-white" : "text-indigo-900"
                                    }`}>
                                      {slot?.subject}
                                    </div>
                                    <div className={`flex items-center gap-1 text-[9px] font-medium ${
                                      slot?.isConflict ? "text-red-600" : slot?.subject.includes("(Lab)") ? "text-indigo-100" : "text-indigo-600"
                                    }`}>
                                      <User className="w-2.5 h-2.5" />
                                      {slot?.teacher}
                                    </div>
                                    {slot?.isConflict && (
                                      <div className="mt-1 text-[8px] text-red-500 font-bold uppercase">Conflict</div>
                                    )}
                                  </motion.div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-semibold">Teacher Workload Dashboard</h3>
                    </div>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {workloadSummary().map(item => (
                        <div key={item.name} className={`flex items-center justify-between p-2 rounded-lg ${item.absent ? "bg-red-50 opacity-60" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                            {item.absent && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded">ABSENT</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${item.absent ? "bg-red-400" : "bg-indigo-500"}`} 
                                style={{ width: `${(item.total / 20) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{item.total} slots</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-semibold">Agentic Insights</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Optimization Efficiency</div>
                        <div className="text-2xl font-bold text-indigo-600">{result.attempts} <span className="text-sm font-normal text-slate-400">cycles</span></div>
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        The agent successfully resolved <span className="font-bold text-indigo-600">{sections.split(",").length}</span> section schedules while ensuring no teacher is double-booked across classrooms.
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
