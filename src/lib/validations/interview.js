import { z } from 'zod'

export const interviewSchema = z.object({
  jobRole: z.string().min(1, 'Job role is required'),
  companyName: z.string().min(1, 'Company name is required'),
  interviewType: z.enum(['DSA', 'HR', 'Behavioral', 'System Design', 'Full Stack', 'Mixed'], {
    required_error: 'Please select an interview type',
  }),
  difficultyLevel: z.enum(['Easy', 'Medium', 'Hard'], {
    required_error: 'Please select a difficulty level',
  }),
  duration: z.number()
    .min(5, 'Minimum duration is 5 minutes')
    .max(60, 'Maximum duration is 60 minutes'),
  jobDescription: z.string().optional(),
  interviewerPersonality: z.enum([
    'Friendly Dev',
    'Strict HR',
    'Calm Manager',
    'Fast-Paced Tech Lead'
  ], {
    required_error: 'Please select an interviewer personality',
  }),
  enableWebcam: z.boolean().default(false),
  customFocusAreas: z.string().optional(),
  resume: z.instanceof(File)
    .refine((file) => file.type === 'application/pdf', {
      message: 'Only PDF files are allowed',
    })
    .optional(),
}) 