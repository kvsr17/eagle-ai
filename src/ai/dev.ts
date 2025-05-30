
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-improvements.ts';
import '@/ai/flows/flag-critical-clauses.ts';
import '@/ai/flows/summarize-legal-document.ts';
import '@/ai/flows/identify-missing-points.ts';
import '@/ai/flows/predict-legal-outcomes.ts';
import '@/ai/flows/chatWithDocument.ts'; // Added new chat flow
import '@/ai/flows/auto-fix-clause.ts'; // Added new auto-fix flow
