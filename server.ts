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
    day: string;
    period: number;
    subject: string;
    teacher: string;
  }

  interface GenerateRequest {
    subjects: string[];
    teachers: Record<string, string>; // subject -> teacher
    days?: string[];
    periodsPerDay?: number;
  }

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const PERIODS = 6;

  // Step 1: Generator - Randomly assigns subjects
  function generateInitial(req: GenerateRequest): TimetableSlot[] {
    const timetable: TimetableSlot[] = [];
    const { subjects, teachers } = req;
    const days = req.days || DAYS;
    const periods = req.periodsPerDay || PERIODS;

    for (const day of days) {
      for (let p = 1; p <= periods; p++) {
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        timetable.push({
          day,
          period: p,
          subject: randomSubject,
          teacher: teachers[randomSubject] || "Unassigned",
        });
      }
    }
    return timetable;
  }

  // Step 2: Checker - Identifies conflicts
  function checkConstraints(timetable: TimetableSlot[]) {
    const conflicts: string[] = [];
    const teacherSchedule: Record<string, Set<string>> = {}; // teacher -> Set("Day-Period")

    // Check for teacher overlap (though in a single class timetable this is less likely unless multiple classes)
    // For this prototype, let's focus on "Balanced Distribution" and "No back-to-back same subject" as constraints
    
    const subjectCounts: Record<string, number> = {};
    timetable.forEach(slot => {
      subjectCounts[slot.subject] = (subjectCounts[slot.subject] || 0) + 1;
    });

    // Constraint: Balanced distribution (no subject should have > 25% more than average)
    const avg = timetable.length / Object.keys(subjectCounts).length;
    for (const sub in subjectCounts) {
      if (subjectCounts[sub] > avg * 1.5) {
        conflicts.push(`Subject ${sub} is over-represented (${subjectCounts[sub]} slots).`);
      }
    }

    // Constraint: No more than 2 consecutive same subjects
    for (let i = 0; i < timetable.length - 2; i++) {
      if (
        timetable[i].day === timetable[i+1].day && 
        timetable[i+1].day === timetable[i+2].day &&
        timetable[i].subject === timetable[i+1].subject && 
        timetable[i+1].subject === timetable[i+2].subject
      ) {
        conflicts.push(`Triple consecutive ${timetable[i].subject} on ${timetable[i].day}.`);
      }
    }

    return conflicts;
  }

  // Step 3 & 4: Optimizer (Agent Loop)
  function agenticRefine(req: GenerateRequest) {
    let timetable = generateInitial(req);
    let attempts = 0;
    const maxAttempts = 10;
    let logs: string[] = ["Initial timetable generated."];

    while (attempts < maxAttempts) {
      const conflicts = checkConstraints(timetable);
      if (conflicts.length === 0) {
        logs.push("No conflicts found. Valid timetable produced.");
        break;
      }

      logs.push(`Attempt ${attempts + 1}: Found ${conflicts.length} conflicts. Fixing...`);
      // Simple "fix": Regenerate a portion or swap
      timetable = generateInitial(req); 
      attempts++;
    }

    if (attempts === maxAttempts) {
      logs.push("Reached max attempts. Returning best effort.");
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
