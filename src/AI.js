import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const SYSTEM_PROMPT_ANALYZE = `
You are an expert Senior Software Engineer, Security Auditor, and Code Reviewer.

Analyze the provided code and return ONLY valid JSON.

IMPORTANT RULES:
1. Return ONLY raw JSON.
2. Do not wrap JSON in markdown or backticks.
3. Do not include any explanation outside the JSON.
4. All scores must be realistic and based on the actual code.
5. Keep summaries concise and professional.
6. If a section is not relevant, return an empty array for it.
7. For the "icon" field in critical items, use ONLY "FaFileAlt" or "FaSyncAlt".
8. If the code has bugs, security risks, bad practices or syntax errors, set "needToFix" to true, otherwise false.

Return exactly this JSON structure:

{
  "overallScore": 0,
  "rulesChecked": 0,
  "scoreBreakdown": [
    { "name": "", "score": 0 }
  ],
  "summary": {
    "before": "",
    "highlight": "",
    "after": ""
  },
  "critical": [
    { "icon": "FaFileAlt", "title": "", "description": "" }
  ],
  "warnings": [
    { "title": "", "line": "" }
  ],
  "securityAudit": {
    "metrics": [
      { "name": "", "value": "" }
    ],
    "compliance": [
      { "text": "", "ok": true }
    ]
  },
  "refactoredCode": "",
  "proTip": "",
  "needToFix": false
}

SCORING RULES:
- overallScore must be between 0 and 100.
- scoreBreakdown scores must be between 0 and 100.
- Generate score categories dynamically based on the code (for example Readability, Performance, Security, Best Practices, Accessibility).
- Do NOT force categories such as Security or Performance if they are not relevant.
- Give 2 to 4 categories.

SECURITY AUDIT RULES:
- metrics should have 2 items, for example "OWASP Score" with a grade like "B+", and "Injection Risk" with LOW, MEDIUM, HIGH or MAX.
- compliance should have 3 to 5 items. Use ok true if the code follows the standard, false if it does not.

"line" must be the line number as a string.
"refactoredCode" must contain the full improved code as a string.
"proTip" must be one short helpful tip as a string.
`;

const SYSTEM_PROMPT_EXPLAIN = `
You are an expert Software Engineer and Programming Instructor.

Your task is to explain the provided code in a clear, educational, and beginner-friendly way.

IMPORTANT RULES:

1. Return ONLY Markdown.
2. Do NOT use JSON.
3. Do NOT wrap the entire response in a markdown code block.
4. Adapt the explanation style to the complexity of the code.
5. Use headings, subheadings, bullet points, tables, and code snippets whenever helpful.
6. Do NOT force sections that are not relevant.
7. Keep explanations concise for simple code and detailed for complex code.
8. Assume the reader is learning programming.
9. Explain what the code does, how it works step by step, and the important concepts used.
10. If there are bugs or bad practices, mention them briefly at the end.
`;

const SYSTEM_PROMPT_FIX = `
You are an expert Senior Software Engineer.

Your task is to fix the provided code.

IMPORTANT RULES:

1. Fix all bugs, syntax errors, security issues and bad practices.
2. Keep the original logic, structure, naming and coding style as much as possible.
3. Do NOT add features that were not in the original code.
4. Return ONLY the complete fixed code.
5. Do NOT include any explanation, comments about your changes, or markdown backticks.
6. If the code has no problems, return it unchanged.
`;

export async function main(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_ANALYZE +
    "\n\nLanguage: " +
    language +
    "\n\nCode to review:\n" +
    code;

  let lastError;

  // Try the full model list for up to 2 rounds
  for (let round = 0; round < 2; round++) {
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: finalPrompt,
          config: { responseMimeType: "application/json" },
        });
        const text = response.text;
        if (text && text.trim()) {
          console.log("Used model:", model);
          return text;
        }
      } catch (err) {
        lastError = err;
        console.warn(
          "Model failed:",
          model,
          String(err?.message || err).slice(0, 120),
        );
      }
    }
    await sleep(2000);
  }

  throw lastError;
}

export async function explain(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_EXPLAIN +
    "\n\nLanguage: " +
    language +
    "\n\nCode to explain:\n" +
    code;

  let lastError;

  // Same fallback logic as main(), without JSON mode (Markdown output)
  for (let round = 0; round < 2; round++) {
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: finalPrompt,
        });
        const text = response.text;
        if (text && text.trim()) {
          console.log("Used model (explain):", model);
          return text;
        }
      } catch (err) {
        lastError = err;
        console.warn(
          "Model failed:",
          model,
          String(err?.message || err).slice(0, 120),
        );
      }
    }
    await sleep(2000);
  }

  throw lastError;
}

export async function fix(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_FIX +
    "\n\nLanguage: " +
    language +
    "\n\nCode to fix:\n" +
    code;

  let lastError;

  for (let round = 0; round < 2; round++) {
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: finalPrompt,
        });
        const text = response.text;
        if (text && text.trim()) {
          console.log("Used model (fix):", model);
          return text;
        }
      } catch (err) {
        lastError = err;
        console.warn(
          "Model failed:",
          model,
          String(err?.message || err).slice(0, 120),
        );
      }
    }
    await sleep(2000);
  }

  throw lastError;
}
