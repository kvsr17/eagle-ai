import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-improvements.ts';
import '@/ai/flows/flag-critical-clauses.ts';
import '@/ai/flows/summarize-legal-document.ts';
import '@/ai/flows/identify-missing-points.ts';