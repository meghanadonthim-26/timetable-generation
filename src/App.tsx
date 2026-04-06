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
  Terminal
} from "lucide-react";

interface TimetableSlot {
  day: string;
  period: number;
  subject: string;
  teacher: string;
}

interface GenerationResult {
  timetable: TimetableSlot[];
  logs: string[];
  attempts: number;
}

export default function App() {
  const [subjects, setSubjects] = useState<string>("Mathematics, Physics, Chemistry, English, Computer Science, Biology");
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
      const subjectList = subjects.split(",").map(s => s.trim()).filter(s => s);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: subjectList,
          teachers: teacherMap
        })
      });
      
      if (!response.ok) throw new Error("Failed to generate timetable");
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateTeacher = (subject: string, name: string) => {
    setTeacherMap(prev => ({ ...prev, [subject]: name }));
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6];

  const getSlot = (day: string, period: number) => {
    return result?.timetable.find(s => s.day === day && s.period === period);
  };

  const workloadSummary = () => {
    if (!result) return [];
    const counts: Record<string, number> = {};
    result.timetable.forEach(s => {
      counts[s.teacher] = (counts[s.teacher] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
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
            Agentic AI System
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Smart AI Timetable Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            An intelligent agent that generates, validates, and optimizes academic schedules using a feedback loop.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subjects (Comma separated)
                  </label>
                  <textarea
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[100px] text-sm"
                    placeholder="Math, Physics, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Teacher Mapping
                  </label>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {subjects.split(",").map(s => s.trim()).filter(s => s).map((sub) => (
                      <div key={sub} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 w-24 truncate">{sub}</span>
                        <input
                          type="text"
                          value={teacherMap[sub] || ""}
                          onChange={(e) => updateTeacher(sub, e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Teacher name"
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
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                    {result ? "Regenerate" : "Generate"}
                  </button>
                </div>
              </div>
            </section>

            {/* AI Logs */}
            <AnimatePresence>
              {result && (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 rounded-2xl shadow-lg p-6 text-slate-300 font-mono text-xs"
                >
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Terminal className="w-4 h-4" />
                    <span>Agent Execution Logs</span>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {result.logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-indigo-400">[{i+1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Timetable Display */}
          <div className="lg:col-span-8 space-y-6">
            {!result && !loading && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <p>Configure subjects and click Generate to see the AI in action.</p>
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
                <p className="mt-6 text-slate-600 font-medium animate-pulse">Agent is optimizing constraints...</p>
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
                                    className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 h-full min-h-[80px] flex flex-col justify-between"
                                  >
                                    <div className="text-sm font-bold text-indigo-900 leading-tight mb-1">
                                      {slot?.subject}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                                      <User className="w-3 h-3" />
                                      {slot?.teacher}
                                    </div>
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

                {/* Workload Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-semibold">Teacher Workload</h3>
                    </div>
                    <div className="space-y-3">
                      {workloadSummary().map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(item.count / 30) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{item.count} slots</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-semibold">System Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm text-emerald-700 font-medium">Conflict-Free Schedule</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        The agent performed <span className="font-bold text-indigo-600">{result.attempts}</span> optimization cycles to ensure subject balance and teacher availability.
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
