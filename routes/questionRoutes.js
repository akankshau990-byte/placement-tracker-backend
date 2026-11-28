const express = require("express");
const router = express.Router();

// Helper function to call Gemini with automatic model fallback & exact error logging
async function callGemini(prompt, temperature = 0.7) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = "Unknown Gemini error";

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature },
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    lastError = data?.error?.message || `HTTP ${response.status} on ${model}`;
    console.error(`Gemini (${model}) failed:`, lastError);

    // If API key itself is invalid, no need to retry other models
    if (lastError.toLowerCase().includes("api key")) {
      break;
    }
  }

  throw new Error(lastError);
}

// POST /api/questions/generate
router.post("/generate", async (req, res) => {
  const { companyName, role, existingQuestions, batchNumber = 1 } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: "Company name is required" });
  }

  const targetRole = role || "Software Developer";
  const hasExisting = existingQuestions && existingQuestions.trim().length > 20;

  const previousLines = hasExisting
    ? existingQuestions
        .split("\n")
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.trim())
        .join("\n")
    : "";

  const batchFocusMap = [
    "Arrays, Strings, Hashing, OOPs, DBMS, and Core Web",
    "Linked Lists, Stacks, Queues, Trees, OS, and Computer Networks",
    "Dynamic Programming, Graphs, Recursion, System Design, and API Security",
    "Binary Search, Sliding Window, Heaps, SQL Queries, and Scenario-based Debugging",
  ];
  const currentFocus = batchFocusMap[(batchNumber - 1) % batchFocusMap.length];

  try {
    const exclusionInstruction = hasExisting
      ? `\nCRITICAL RULE: This is Batch #${batchNumber}. Focus specifically on: ${currentFocus}.\nYou MUST NOT repeat or rephrase ANY of the already generated questions listed below:\n"""\n${previousLines}\n"""\nGenerate 15 COMPLETELY DIFFERENT, fresh questions.`
      : `\nFocus on: ${currentFocus}.`;

    const prompt = `You are an expert Indian Tech Placement Mentor helping a B.Tech CSE student crack "${companyName}" for the role "${targetRole}".
${exclusionInstruction}

Provide a complete, actionable preparation kit in plain English text (NO markdown asterisks ** or # symbols) with these exact sections:

${
  !hasExisting
    ? `=== 1. ${companyName.toUpperCase()} HIRING PATTERN & PREP SOURCES ===
- Rounds & Pattern: (Mention exact rounds like OA, Technical 1, Technical 2, HR)
- Must-Do Prep Sources: (Mention exact LeetCode tags, GFG Company Archive, Striver SDE Sheet topics, CS Fundamentals)
`
    : `=== BATCH #${batchNumber} FOCUS: ${currentFocus.toUpperCase()} ===`
}
=== DSA & CODING QUESTIONS (6 Fresh Questions) ===
1. [Topic] Question statement + expected time complexity
... (6 questions total)

=== CORE CS & TECH STACK QUESTIONS (6 Fresh Questions) ===
7. [Subject] Question statement
... (6 questions total)

=== PROJECT, SYSTEM DESIGN & HR QUESTIONS (3 Fresh Questions) ===
13. Question statement
... (3 questions total)

Ensure every single question is unique and tailored to ${companyName}.`;

    const generatedText = await callGemini(prompt, 0.9);
    res.status(200).json({ questions: generatedText });
  } catch (error) {
    console.error("AI Question fallback triggered:", error.message);

    const fallbackBatches = [
      `=== ${companyName.toUpperCase()} (${targetRole}) PREP KIT - BATCH 1 ===
[DSA] 1. Kadane's Algorithm | 2. Two Sum & Subarray Sum K | 3. Reverse Linked List | 4. Level Order Traversal | 5. Valid Parentheses | 6. Coin Change DP
[Core CS] 7. OOPs Polymorphism | 8. ACID & SQL Joins | 9. Deadlock & Paging | 10. TCP 3-Way Handshake | 11. JS Event Loop & Closures | 12. JWT Auth Flow
[HR] 13. MERN Architecture | 14. Toughest Bug Solved | 15. Why ${companyName}?`,
      `=== ${companyName.toUpperCase()} (${targetRole}) PREP KIT - BATCH 2 ===
[DSA] 1. Merge Intervals | 2. Longest Substring Without Repeating Characters | 3. Detect Cycle in Linked List | 4. Lowest Common Ancestor in BST | 5. Next Greater Element | 6. House Robber DP
[Core CS] 7. Abstract Class vs Interface | 8. Indexing & B-Trees in DBMS | 9. Process vs Thread & Context Switching | 10. HTTP/2 vs HTTP/3 & DNS | 11. React Virtual DOM & Reconciliation | 12. Rate Limiting & CORS
[HR] 13. Handling Tight Deadlines | 14. Team Conflict Resolution | 15. Strengths & Weaknesses`,
    ];

    const selectedFallback =
      fallbackBatches[(batchNumber - 1) % fallbackBatches.length];
    res.status(200).json({ questions: selectedFallback });
  }
});

// POST /api/questions/chat — AI Placement Mentor Chatbot
router.post("/chat", async (req, res) => {
  const { message, history = [], userContext = "" } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const recentHistory = history
      .slice(-6)
      .map((m) => `${m.sender === "user" ? "Student" : "Mentor"}: ${m.text}`)
      .join("\n");

    const systemPrompt = `You are an expert, friendly Tech Placement Mentor built inside a student's Placement Tracker web app.
Student's current tracked applications context: ${userContext || "Preparing for SDE / Full-Stack / Tech internships & placements."}

Guidelines:
- Always reply in clear, professional English.
- Give practical, structured, concise advice (DSA topics, company-specific prep, project explanation, mock interview questions, cold email/referral templates).
- Keep answers crisp, encouraging, and easy to read (use short bullet points, avoid messy raw markdown symbols like ###).
- If the student asks for a mock interview, ask 1 focused question at a time and evaluate their answer.

Recent Conversation:
${recentHistory}

Student's New Question: ${message.trim()}
Mentor's Reply:`;

    const reply = await callGemini(systemPrompt, 0.7);
    res.status(200).json({ reply });
  } catch (error) {
    console.error("AI Chatbot error:", error.message);
    res.status(200).json({
      reply: `Gemini API Notice: ${error.message}`,
    });
  }
});

module.exports = router;