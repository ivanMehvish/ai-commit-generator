// src/aiClient.js
import fetch from "node-fetch";
import dotenv from 'dotenv';
dotenv.config();

// Remove this circular import - you can't import from the same file!
// import { generateCommitMessage } from './src/aiClient.js';

/**
 * Generate a git commit message using Gemini API
 */
export async function generateCommitMessage(diff) {
  // Add debug logging
  console.log("🔍 Environment check:");
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
  console.log("AI_MODE:", process.env.AI_MODE);
  
  const mode = process.env.AI_MODE;

  // 1️⃣ Mock mode
  if (mode === "mock") {
    return [
      "feat: mock commit message",
      "fix: mock commit message",
      "refactor: mock commit message",
    ];
  }

  // 2️⃣ Gemini API mode - FIX: You forgot to declare apiKey variable!
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY not set. Falling back to mock messages.");
    console.warn("   Get your API key from: https://aistudio.google.com/app/apikey");
    return [
      "feat: add missing API key configuration",
      "fix: configure Gemini API key in environment",
      "docs: update setup instructions for API key",
    ];
  }

  try {
    console.log("🤖 Generating commit message with Gemini...");
    
    // Correct Gemini API endpoint and request format
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate 3 different concise git commit messages for the following diff. Follow conventional commit format (type: description). Return only the commit messages, one per line.

Diff:
${diff}

Examples:
feat: add user authentication
fix: resolve memory leak in parser
refactor: extract validation logic`
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      
      // Handle specific error cases
      if (response.status === 403) {
        console.error("🔑 API key may be invalid or doesn't have proper permissions");
        console.error("   Check your API key at: https://aistudio.google.com/app/apikey");
      } else if (response.status === 429) {
        console.error("🚫 Rate limit exceeded. Please try again later.");
      }
      
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Raw API response:", JSON.stringify(data, null, 2));

    // Extract the generated text
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("No text returned from Gemini API");
    }

    console.log("✅ Generated text:", generatedText);

    // Parse the response into individual commit messages
    const commitMessages = generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 3); // Take only first 3 messages

    // Ensure we have at least 3 messages
    while (commitMessages.length < 3) {
      commitMessages.push(`feat: update codebase based on diff`);
    }

    console.log("🎯 Parsed commit messages:", commitMessages);
    return commitMessages;

  } catch (err) {
    console.error("❌ Error generating commit message via Gemini:", err.message);
    console.warn("⚠️ Falling back to mock messages.");
    
    // Provide better fallback messages based on diff analysis
    return generateFallbackMessages(diff);
  }
}

/**
 * Generate fallback commit messages based on simple diff analysis
 */
function generateFallbackMessages(diff) {
  const messages = [];
  
  // Simple heuristics based on diff content
  if (diff.includes('+') && (diff.includes('function') || diff.includes('const ') || diff.includes('class '))) {
    messages.push("feat: add new functionality");
  }
  
  if (diff.includes('-') && diff.includes('+')) {
    messages.push("fix: update implementation");
  }
  
  if (diff.includes('test') || diff.includes('spec')) {
    messages.push("test: add or update tests");
  }
  
  if (diff.includes('README') || diff.includes('.md')) {
    messages.push("docs: update documentation");
  }
  
  if (diff.includes('package.json') || diff.includes('dependencies')) {
    messages.push("deps: update dependencies");
  }
  
  // Fill remaining slots
  while (messages.length < 3) {
    messages.push("chore: update codebase");
  }
  
  return messages.slice(0, 3);
}

/**
 * Test the Gemini API connection
 */
export async function testGeminiConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY environment variable not set");
    return false;
  }
  
  try {
    console.log("🔍 Testing Gemini API connection...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello, this is a test message. Please respond with 'Connection successful!'"
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.1
          }
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Gemini API connection successful!");
      console.log("Response:", data.candidates[0].content.parts[0].text);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Connection failed: ${response.status}`);
      console.error(`Error: ${errorText}`);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
}