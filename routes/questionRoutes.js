const express = require("express");
const router = express.Router();

// POST /api/questions/generate
router.post("/generate", async (req, res) => {
  const { companyName, role, existingQuestions } = req.body;

  if (!companyName) {
    return res.status(400).json({ message: "Company name is required" });
  }

  const targetRole = role || "Software Developer";
  const apiKey = process.env.GEMINI_API_KEY;
  const hasExisting = existingQuestions && existingQuestions.trim().length > 20;

  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const exclusionInstruction = hasExisting
      ? `\nIMPORTANT: The student already has the following questions. DO NOT repeat any of these; generate 15 COMPLETELY NEW, deeper, and diverse questions:\n"""\n${existingQuestions.slice(-2500)}\n"""\n`
      : "";

    const prompt = `You are an expert Indian Tech Placement Mentor helping a B.Tech CSE student crack "${companyName}" for the role "${targetRole}".
${exclusionInstruction}
Provide a complete, actionable preparation kit in plain text (no markdown asterisks ** or # symbols) with these exact sections:

${!hasExisting ? `=== 1. ${companyName.toUpperCase()} HIRING PATTERN & PREP SOURCES ===
- Rounds & Pattern: (Mention exact rounds like OA, Technical 1, Technical 2, HR)
- Must-Do Prep Sources: (Mention exact LeetCode tags, GFG Company Archive, Striver SDE Sheet topics, CS Fundamentals)
` : ""}
=== DSA & CODING QUESTIONS (6 Most Asked) ===
1. [Topic: e.g., Arrays/DP/Trees] Question statement + expected time complexity
... (6 questions total)

=== CORE CS & TECH STACK QUESTIONS (6 Most Asked) ===
7. [Subject: OS / DBMS / CN / OOPs / React / Node] Question statement
... (6 questions total)

=== PROJECT, SYSTEM DESIGN & HR QUESTIONS (3 Most Asked) ===
13. Question statement
... (3 questions total)

Keep every question specific to ${companyName}'s real interview difficulty and style.`;

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

    res.status(200).json({ questions: generatedText.trim() });
  } catch (error) {
    console.error("AI Question fallback triggered:", error.message);

    const fallbackQuestions = `=== ${companyName.toUpperCase()} (${targetRole}) COMPLETE PREP KIT ===

[Prep Sources & Strategy]
- DSA: Striver A2Z Sheet (Arrays, Strings, Linked List, Trees, DP) + LeetCode Top Interview 150
- Company Archive: GeeksforGeeks "${companyName} Interview Experiences"
- Core CS: Gate Smashers / Love Babbar OS, DBMS, CN & OOPs Cheat Sheets

[DSA & Coding]
1. [Arrays] Kadane's Algorithm & Maximum Product Subarray (O(n))
2. [Hashing] Two Sum, Subarray Sum Equals K & Longest Consecutive Sequence
3. [Linked List] Reverse Linked List in K-Groups & Detect/Remove Loop
4. [Trees] Level Order Traversal, Lowest Common Ancestor (LCA) & Diameter of Binary Tree
5. [Stack/Queue] Valid Parentheses, Next Greater Element & LRU Cache Design
6. [DP/Recursion] Coin Change, Longest Common Subsequence & Climbing Stairs

[Core CS & Web Stack]
7. [OOPs] Runtime vs Compile-time Polymorphism, Virtual Functions & Diamond Problem
8. [DBMS] ACID Properties, Normalization (1NF-BCNF), Indexing & 2nd Highest Salary SQL Query
9. [OS] Process vs Thread, Deadlock Conditions, Paging & Virtual Memory
10. [CN] What happens when you type a URL in browser? TCP 3-Way Handshake & HTTP vs HTTPS
11. [JS/React] Event Loop, Closures, Promises, Virtual DOM & useEffect Cleanup
12. [Backend] REST API Security, JWT Auth Flow & MongoDB Aggregation Pipeline

[Project & HR]
13. Explain your MERN stack project architecture, database schema, and how you handled API security.
14. Describe a tough bug you debugged under deadline pressure.
15. Why ${companyName}, and where do you see yourself in 2 years?`;

    res.status(200).json({ questions: fallbackQuestions });
  }
});

module.exports = router;