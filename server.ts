import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AGENTIC AI LOGIC ---

  interface TimetableSlot {
    section: string;
    day: string;
    period: number;
    subject: string;
    teacher: string;
    isConflict?: boolean;
    conflictMessage?: string;
  }

  interface GenerateRequest {
    sections: string[]; // e.g. ["CSE-A", "CSE-B"]
    subjects: string[];
    teachers: Record<string, string>; // subject -> teacher
    labs?: string[]; // subjects that are labs (double periods)
    absentTeachers?: string[];
    constraints: {
      maxClassesPerDay: number;
      avoidConsecutive: boolean;
    };
    days?: string[];
    periodsPerDay?: number;
  }

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const PERIODS = 6;

  // Step 1: Generator - Handles multiple sections and avoids absent teachers
  function generateInitial(req: GenerateRequest): TimetableSlot[] {
    const timetable: TimetableSlot[] = [];
    const { sections, subjects, teachers, labs = [], absentTeachers = [] } = req;
    const days = req.days || DAYS;
    const periods = req.periodsPerDay || PERIODS;

    for (const section of sections) {
      for (const day of days) {
        const daySlots: (TimetableSlot | null)[] = new Array(periods).fill(null);
        
        // Place Labs (Double Periods)
        const availableLabs = labs.filter(l => subjects.includes(l));
        if (availableLabs.length > 0 && Math.random() > 0.3) {
          const labSubject = availableLabs[Math.floor(Math.random() * availableLabs.length)];
          const startIdx = Math.floor(Math.random() * (periods - 1));
          
          const teacher = teachers[labSubject] || "Unassigned";
          const finalTeacher = absentTeachers.includes(teacher) ? "Substitution" : teacher;

          daySlots[startIdx] = {
            section, day, period: startIdx + 1,
            subject: `${labSubject} (Lab)`,
            teacher: finalTeacher,
          };
          daySlots[startIdx + 1] = {
            section, day, period: startIdx + 2,
            subject: `${labSubject} (Lab)`,
            teacher: finalTeacher,
          };
        }

        // Fill remaining slots
        for (let i = 0; i < periods; i++) {
          if (!daySlots[i]) {
            const nonLabSubjects = subjects.filter(s => !labs.includes(s) || Math.random() > 0.5);
            const randomSubject = nonLabSubjects[Math.floor(Math.random() * nonLabSubjects.length)] || subjects[0];
            const teacher = teachers[randomSubject] || "Unassigned";
            const finalTeacher = absentTeachers.includes(teacher) ? "Substitution" : teacher;

            daySlots[i] = {
              section, day, period: i + 1,
              subject: randomSubject,
              teacher: finalTeacher,
            };
          }
        }
        
        daySlots.forEach(slot => { if (slot) timetable.push(slot); });
      }
    }
    return timetable;
  }

  // Step 2: Checker - Identifies conflicts (Teacher Overlap, Constraints)
  function checkConstraints(timetable: TimetableSlot[], req: GenerateRequest) {
    const conflicts: { slotIndex: number; message: string }[] = [];
    const teacherUsage: Record<string, number[]> = {}; // "Teacher-Day-Period" -> [slotIndices]

    timetable.forEach((slot, index) => {
      if (slot.teacher !== "Substitution" && slot.teacher !== "Unassigned") {
        const key = `${slot.teacher}-${slot.day}-${slot.period}`;
        if (!teacherUsage[key]) teacherUsage[key] = [];
        teacherUsage[key].push(index);
      }
    });

    // 1. Conflict: Teacher Overlap across sections
    for (const key in teacherUsage) {
      if (teacherUsage[key].length > 1) {
        const teacherName = key.split("-")[0];
        teacherUsage[key].forEach(idx => {
          conflicts.push({ 
            slotIndex: idx, 
            message: `Conflict: ${teacherName} is assigned to multiple sections in this slot.` 
          });
        });
      }
    }

    // 2. Constraint: Avoid consecutive same subjects
    if (req.constraints.avoidConsecutive) {
      for (let i = 0; i < timetable.length - 1; i++) {
        const s1 = timetable[i];
        const s2 = timetable[i+1];
        if (s1.section === s2.section && s1.day === s2.day && s1.subject === s2.subject && !s1.subject.includes("(Lab)")) {
          conflicts.push({ slotIndex: i+1, message: `Constraint: Consecutive ${s1.subject} sessions.` });
        }
      }
    }

    return conflicts;
  }

  // Step 3 & 4: Optimizer (Agent Loop)
  function agenticRefine(req: GenerateRequest) {
    let timetable = generateInitial(req);
    let attempts = 0;
    const maxAttempts = 15;
    let logs: string[] = ["Agent started optimization loop..."];

    while (attempts < maxAttempts) {
      const conflicts = checkConstraints(timetable, req);
      
      // Clear previous conflict markers
      timetable.forEach(s => { delete s.isConflict; delete s.conflictMessage; });

      if (conflicts.length === 0) {
        logs.push("Success: All constraints satisfied.");
        break;
      }

      // Mark conflicts for the final return if we fail
      conflicts.forEach(c => {
        timetable[c.slotIndex].isConflict = true;
        timetable[c.slotIndex].conflictMessage = c.message;
      });

      logs.push(`Attempt ${attempts + 1}: Found ${conflicts.length} issues. Re-optimizing...`);
      
      // Strategy: Regenerate and try again
      timetable = generateInitial(req); 
      attempts++;
    }

    return { timetable, logs, attempts };
  }

  // API Endpoints
  app.post("/api/generate", (req, res) => {
    const { subjects, teachers } = req.body;
    if (!subjects || !teachers) {
      return res.status(400).json({ error: "Missing subjects or teachers" });
    }

    const result = agenticRefine(req.body);
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
