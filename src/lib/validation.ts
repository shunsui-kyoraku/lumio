import { z } from "zod";

/**
 * All request-body schemas. Every API route validates through one of these —
 * unknown keys are stripped by default (no mass assignment), lengths are
 * bounded, and IDs must look like CUIDs.
 */

export const id = z.string().min(20).max(32).regex(/^[a-z0-9]+$/i, "Invalid id");

const httpUrl = z
  .url()
  .max(2000)
  .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
    message: "URL must use http(s)",
  });

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color");

export const difficultyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);
export const resourceTypeEnum = z.enum([
  "BOOK", "VIDEO", "COURSE", "ARTICLE", "PDF", "PODCAST", "PROJECT", "CERTIFICATION", "OTHER",
]);
export const resourceStatusEnum = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "MASTERED"]);
export const reviewGradeEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
export const projectStatusEnum = z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]);
export const learningStyleEnum = z.enum(["VISUAL", "AUDITORY", "READING", "KINESTHETIC", "MIXED"]);

// --- Profile -----------------------------------------------------------

export const profileUpdateSchema = z.object({
  learningGoals: z.string().max(2000).nullish(),
  currentSkills: z.string().max(2000).nullish(),
  learningStyle: learningStyleEnum.optional(),
  dailyGoalMinutes: z.number().int().min(5).max(600).optional(),
  weeklyTargetHours: z.number().int().min(1).max(80).optional(),
  timezone: z.string().max(64).optional(),
});

// --- Skills ------------------------------------------------------------

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(2000).nullish(),
  category: z.string().max(50).nullish(),
  difficulty: difficultyEnum.optional(),
  parentId: id.nullish(),
  color: hexColor.optional(),
});

export const skillUpdateSchema = skillCreateSchema.partial();

// --- Resources ---------------------------------------------------------

export const resourceCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: resourceTypeEnum.optional(),
  url: httpUrl.nullish().or(z.literal("").transform(() => null)),
  author: z.string().max(120).nullish(),
  category: z.string().max(50).nullish(),
  skillId: id.nullish(),
  difficulty: difficultyEnum.optional(),
  status: resourceStatusEnum.optional(),
  difficultyRating: z.number().int().min(1).max(5).nullish(),
  qualityRating: z.number().int().min(1).max(5).nullish(),
  notes: z.string().max(5000).nullish(),
});

export const resourceUpdateSchema = resourceCreateSchema.partial();

// --- Notes -------------------------------------------------------------

export const noteCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50_000).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  skillId: id.nullish(),
});

export const noteUpdateSchema = noteCreateSchema.partial();

// --- Flashcards & reviews ------------------------------------------------

export const flashcardCreateSchema = z.object({
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(2000),
  skillId: id.nullish(),
  resourceId: id.nullish(),
  noteId: id.nullish(),
});

export const flashcardUpdateSchema = flashcardCreateSchema.partial();

export const reviewSchema = z.object({
  flashcardId: id,
  grade: reviewGradeEnum,
});

// --- Sessions ------------------------------------------------------------

export const sessionCreateSchema = z.object({
  minutes: z.number().int().min(1).max(1440),
  skillId: id.nullish(),
  resourceId: id.nullish(),
  projectId: id.nullish(),
  note: z.string().max(500).nullish(),
  date: z.iso.datetime().optional(),
});

// --- Projects -------------------------------------------------------------

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().max(5000).nullish(),
  status: projectStatusEnum.optional(),
  skillIds: z.array(id).max(20).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  done: z.boolean().optional(),
});

// --- Journal ----------------------------------------------------------------

export const journalUpsertSchema = z.object({
  date: z.iso.date().optional(), // defaults to today (UTC)
  learned: z.string().max(5000).nullish(),
  difficult: z.string().max(5000).nullish(),
  questions: z.string().max(5000).nullish(),
  confidence: z.number().int().min(1).max(5).optional(),
});

// --- Goals -------------------------------------------------------------------

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullish(),
  targetDate: z.iso.datetime().nullish(),
});

export const goalUpdateSchema = goalCreateSchema.partial().extend({
  done: z.boolean().optional(),
});

// --- AI ------------------------------------------------------------------------

export const aiSummarizeSchema = z.object({
  text: z.string().trim().min(50).max(30_000),
  skillId: id.nullish(),
  saveFlashcards: z.boolean().optional(),
});

export const aiPlanSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  weeks: z.number().int().min(1).max(24),
  hoursPerWeek: z.number().int().min(1).max(40).optional(),
  level: difficultyEnum.optional(),
});

export const aiExplainSchema = z.object({
  concept: z.string().trim().min(2).max(300),
  level: difficultyEnum.optional(),
});

export const aiQuizSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  count: z.number().int().min(1).max(10).optional(),
  difficulty: difficultyEnum.optional(),
});

export const aiSearchSchema = z.object({
  query: z.string().trim().min(3).max(300),
});
