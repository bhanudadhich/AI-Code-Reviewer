import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

/* ------------------------------------------------------------------ */
/*  Robust model handling                                              */
/*  - Models are discovered automatically from Google's live list,     */
/*    so retired / renamed models never break the app.                 */
/*  - Retired models (404) are skipped permanently for the session.    */
/*  - Busy models (503 / 429 / timeouts) are retried with backoff.     */
/*  - The last working model is tried first next time.                 */
/* ------------------------------------------------------------------ */

// Used only if the live model list cannot be fetched.
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

const EXCLUDE =
  /image|tts|live|audio|embed|robotics|transcribe|translate|omni|veo|lyria|imagen|aqa|vision|computer-use|customtools/i;

const MAX_ROUNDS = 3;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_DISCOVERED = 8;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms),
    ),
  ]);

let modelsPromise = null;
let preferredModel = null;
const deadModels = new Set();

function rankModel(name) {
  const id = name.replace("models/", "");
  const versionMatch = id.match(/gemini-(\d+(?:\.\d+)?)/);
  const version = versionMatch ? parseFloat(versionMatch[1]) : 0;

  let tier = 0;
  if (/preview|exp/.test(id)) tier += 10;
  if (/pro/.test(id)) tier += 5;
  if (/latest/.test(id)) tier += 3;
  if (/lite/.test(id)) tier += 1;

  return { tier, version };
}

async function discoverModels() {
  const found = [];
  try {
    const pager = await withTimeout(ai.models.list(), 15000);
    for await (const m of pager) {
      const name = m?.name || "";
      if (!name.startsWith("models/gemini")) continue;
      if (EXCLUDE.test(name)) continue;
      const actions = m.supportedActions || m.supportedGenerationMethods;
      if (Array.isArray(actions) && !actions.includes("generateContent")) {
        continue;
      }
      found.push(name.replace("models/", ""));
    }
  } catch (err) {
    console.warn(
      "Could not fetch model list, using fallback:",
      String(err?.message || err).slice(0, 120),
    );
  }

  found.sort((a, b) => {
    const ra = rankModel(a);
    const rb = rankModel(b);
    if (ra.tier !== rb.tier) return ra.tier - rb.tier;
    return rb.version - ra.version;
  });

  const merged = [...found.slice(0, MAX_DISCOVERED)];
  for (const m of FALLBACK_MODELS) {
    if (!merged.includes(m)) merged.push(m);
  }
  return merged;
}

function getModels() {
  if (!modelsPromise) modelsPromise = discoverModels();
  return modelsPromise;
}

function errorInfo(err) {
  const msg = String(err?.message || err);
  let code = Number(err?.status || err?.code) || 0;
  try {
    const json = JSON.parse(msg.slice(msg.indexOf("{")));
    code = Number(json?.error?.code) || code;
  } catch {
    // message is not JSON, ignore
  }
  return { code, msg };
}

function cleanJson(text) {
  let t = text.trim();
  t = t
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    JSON.parse(t);
    return t;
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const sliced = t.slice(start, end + 1);
      try {
        JSON.parse(sliced);
        return sliced;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generate(prompt, label, json = false) {
  let lastError;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const allModels = await getModels();
    let candidates = allModels.filter((m) => !deadModels.has(m));

    // Everything was marked dead: refresh the list and start clean.
    if (candidates.length === 0) {
      deadModels.clear();
      modelsPromise = null;
      candidates = await getModels();
    }

    // Try the last working model first.
    if (preferredModel && candidates.includes(preferredModel)) {
      candidates = [
        preferredModel,
        ...candidates.filter((m) => m !== preferredModel),
      ];
    }

    for (const model of candidates) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            ...(json
              ? { config: { responseMimeType: "application/json" } }
              : {}),
          }),
          REQUEST_TIMEOUT_MS,
        );

        let text = response.text;
        if (!text || !text.trim()) continue;

        if (json) {
          text = cleanJson(text);
          if (text === null) continue; // invalid JSON, try next model
        }

        preferredModel = model;
        console.log("Used model" + label + ":", model);
        return text;
      } catch (err) {
        lastError = err;
        const { code, msg } = errorInfo(err);

        // Wrong / invalid API key: no point trying other models.
        if (/API_KEY_INVALID|API key not valid|API key expired/i.test(msg)) {
          throw new Error(
            "Invalid API key. Please check VITE_API_KEY in your environment settings.",
          );
        }

        // Retired or unknown model: never try it again this session.
        if (
          code === 404 ||
          /no longer available|not found|not supported/i.test(msg)
        ) {
          deadModels.add(model);
        }

        console.warn("Model failed:", model, msg.slice(0, 120));
      }
    }

    // Wait a bit before the next round (2s, 4s, 8s).
    if (round < MAX_ROUNDS - 1) await sleep(2000 * 2 ** round);
  }

  console.error("All models failed:", lastError);
  throw new Error(
    "The AI service is busy right now. Please try again in a minute.",
  );
}

/* ------------------------------------------------------------------ */
/*  Prompts (unchanged)                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Public API (same names and signatures as before)                   */
/* ------------------------------------------------------------------ */

export async function main(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_ANALYZE +
    "\n\nLanguage: " +
    language +
    "\n\nCode to review:\n" +
    code;

  return generate(finalPrompt, "", true);
}

export async function explain(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_EXPLAIN +
    "\n\nLanguage: " +
    language +
    "\n\nCode to explain:\n" +
    code;

  return generate(finalPrompt, " (explain)");
}

export async function fix(code, language) {
  const finalPrompt =
    SYSTEM_PROMPT_FIX +
    "\n\nLanguage: " +
    language +
    "\n\nCode to fix:\n" +
    code;

  return generate(finalPrompt, " (fix)");
}
