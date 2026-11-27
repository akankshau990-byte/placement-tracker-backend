const express = require("express");
const router = express.Router();

// POST /api/questions/generate
router.post("/generate", async (req, res) => {
  const { companyName, role } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: "Company name is required" });
  }

  const targetRole = role || "Software Developer";
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in .env");
    }

    // Gemini AI ko bhejne wala prompt
    const prompt = `You are a technical placement mentor in India. Generate the top 10 most frequently asked interview questions for the company "${companyName}" for the role "${targetRole}".
Format strictly into three short sections with numbered points:
1. DSA & Coding Questions (4 questions)
2. Core Technical & Stack Questions (4 questions)
3. HR / Behavioral Questions (2 questions)
Keep it concise, practical, and directly useful for student interview preparation. Do not use markdown asterisks (**) or bold symbols.`;

    // Gemini API ko call karna
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      throw new Error("Empty response from Gemini API");
    }

    // Frontend ko questions bhejna
    res.status(200).json({ questions: generatedText.trim() });
  } catch (error) {
    console.error("AI Question fallback triggered:", error.message);

    // Backup Plan: Agar API key missing ho ya internet/quota issue ho, toh app crash nahi hogi
    const fallbackQuestions = `=== ${companyName.toUpperCase()} (${targetRole}) Prep Guide ===

[DSA & Coding]
1. Two Sum & Subarray with Given Sum (Hashing / Sliding Window)
2. Reverse a Linked List & Detect Cycle
3. Valid Parentheses & Next Greater Element (Stack)
4. Binary Search on Rotated Sorted Array

[Core Technical & Web]
5. Explain Event Loop, Promises, and Async/Await in JavaScript
6. React Virtual DOM, Reconciliation & useEffect Lifecycle
7. REST API vs GraphQL & JWT Authentication Flow
8. SQL Joins, Indexing & ACID Properties in DBMS

[HR & Situational]
9. Tell me about your MERN stack project and the toughest bug you solved.
10. Why do you want to join ${companyName}?`;

    res.status(200).json({ questions: fallbackQuestions });
  }
});

module.exports = router;