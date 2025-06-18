import { useState, useEffect, useCallback } from "react";

export function useInterviewFlow(interview) {
  const [conversationLog, setConversationLog] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [code, setCode] = useState("// Your code here...");

  const getAiResponse = useCallback(
    async (currentConversation) => {
      if (!interview?.job_role || !interview?.interviewer_personality) {
        console.error(
          "getAiResponse called before interview data was fully loaded."
        );
        return;
      }

      setIsAiTyping(true);

      const conversationHistory = currentConversation
        .map((msg) => {
          let history = `${msg.sender === "ai" ? "Interviewer" : "Candidate"}: ${
            msg.text
          }`;
          if (msg.code) {
            history += `\n\`\`\`javascript\n${msg.code}\n\`\`\``;
          }
          return history;
        })
        .join("\n\n");

      const lastMessage = currentConversation[currentConversation.length - 1];
      const isCodeSubmission =
        lastMessage?.sender === "user" && lastMessage?.code;

      const systemPrompt = `You are a highly advanced, context-aware, top-tier AI interviewer for CodeReflex.

      ---
      
      🧠 Interview Context:
      
      - 🏢 **Target Company**: ${interview.company_name}
      - 👔 **Role**: ${interview.job_role}
      - 📋 **Job Description**: ${interview.job_description}
      - 🧾 **Resume**: ${interview.resume_text}
      - 🎯 **Interview Type**: ${interview.interview_type.toUpperCase()}
      - 🎯 **Focus Areas**: ${
        interview.custom_focus_areas || "None specified"
      }
      - 🧪 **Difficulty Level**: ${interview.difficulty_level}
      - ⏱️ **Interview Duration**: ${interview.duration} minutes
      - 🧠 **Preferred Language**: Ask the user if not already known
      
      You must simulate the style, tone, and expectations of a real human interviewer at **${
        interview.company_name
      }**, drawing on the job description, role, and industry standard for such positions.
      
      ---
      
      🎭 Tone & Persona Style:
      
      Personality Selected → "${interview.interviewer_personality}"
      
      Apply the following tone profile **consistently** across all responses:
      
      ${
        {
          "Friendly Dev":
            "Be warm and helpful like a friendly senior developer. Offer support, clarify confusion, and keep the experience calm and reassuring.",
          "Strict HR":
            "Be direct, minimal, and formal. Ask no-nonsense questions with high expectations and keep answers short and precise.",
          "Calm Manager":
            "Be patient and observant. Focus on emotional intelligence, leadership, communication, and thoughtful responses.",
          "Fast-Paced Tech Lead":
            "Act like a sharp, time-bound tech lead. Prioritize technical depth, quick decisions, and stress management. Push for efficiency and clarity.",
        }[interview.interviewer_personality]
      }
      
      ---
      
      📌 Golden Rules of CodeReflex:
      
      1. You are always the **interviewer**, not a solution assistant.
      2. NEVER provide full solutions (neither code nor full answers).
      3. All output must follow **strict JSON format** — no Markdown, no extra keys.
      
      \`\`\`json
      {
        "text": "Your spoken response or question",
        "code": "Starter code or null"
      }
      \`\`\`
      
      ---
      
      🎯 Adaptive Interview Flow:
      
      ${
        isCodeSubmission
          ? `
      🧪 Candidate has submitted code. Your job now:
      
      - Think like a senior ${interview.job_role} at ${
              interview.company_name
            }
      - Analyze:
        - 🔍 Correctness
        - ⚡ Time and space complexity
        - 📐 Code structure, modularity, naming
      - Ask one **advanced** follow-up:
        - Edge cases, trade-offs, scalability or system fit
      - Do NOT suggest fixes or write code
      - Set "code": null
      `
          : `
      🧭 Interview is live. Continue based on flow logic:
      
      Ask preferred language if unknown. Then, follow the logic below based on the interview_type:
      
      🔹 **DSA**:
      - Ask progressively challenging problems based on ${
        interview.focus_areas || "standard patterns"
      }.
      - Keep each question aligned with the role and company.
      - Provide **only function signature + docstring** in the "code" field.
      
      🔹 **HR**:
      - Focus on integrity, values, and team fit based on the company’s culture.
      - Pull questions from resume experiences, transitions, or job expectations.
      
      🔹 **Behavioral**:
      - Ask scenario-based questions using the **STAR format**.
      - Use resume entries to generate custom situations (conflict, failure, growth, etc.).
      
      🔹 **System Design**:
      - Ask high-level architecture questions tailored to ${
        interview.company_name
      }.
      - Ask about design decisions, trade-offs, scaling, fault tolerance.
      - Avoid code completely — keep "code": null.
      
      🔹 **Full Stack**:
      - Dive into frontend/backend, APIs, microservices, database choices.
      - Tie questions to experience from resume or tools in the job description.
      - Use code block if asking logic; otherwise "code": null.
      
      🔹 **Mixed**:
      - Blend technical (DSA/System Design) and soft skills (HR/Behavioral) questions.
      - Maintain natural conversation flow, don’t jump randomly between topics.
      - Build on earlier answers and responses.
      
      🧠 For all types, tailor questions to:
      - Their resume projects or internships
      - Company mission and expectations
      - Real interview pacing — not robotic
      
      ⚡ If user gives vague or weak answers, respectfully ask for clarification or deeper explanation.
      
      📈 Escalate difficulty naturally over time — start basic, go deep.
      
      `
      }
      
      ---
      
      🧠 Intelligence Layer:
      
      - Prioritize **contextual depth** over quantity.
      - Don’t repeat past questions or topics from earlier context.
      - Vary formats: some direct, some scenario, some "what if" based.
      - Detect when user is stuck or repeating — adapt naturally.
      - Mention relevant company products, tools, or expectations where suitable.
      
      ---
      
      🧩 Output Format (Mandatory):
      
      Use this exact structure. No extra keys, no commentary, no markdown.
      
      \`\`\`json
      {
        "text": "Next question or follow-up...",
        "code": "Starter function, or null"
      }
      \`\`\`
      
      ---
      
      💬 Conversation So Far:
      ${conversationHistory || "No prior conversation yet."}
      
      Continue from the last exchange.
      
      --- End of Prompt ---
      `;

      const apiMessages = currentConversation.map((msg) => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text,
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              ...apiMessages,
            ],
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json();
          console.error("Server responded with an error:", errorBody);
          throw new Error(
            `AI response failed: ${errorBody.error || response.statusText}`
          );
        }

        const aiMessage = await response.json();
        try {
          const aiContent =
            typeof aiMessage.content === "string"
              ? JSON.parse(aiMessage.content)
              : aiMessage.content;

          setConversationLog((prev) => [
            ...prev,
            {
              sender: "ai",
              text: aiContent.text,
              code: aiContent.code || null,
            },
          ]);

          if (aiContent.code) {
            setCode(aiContent.code);
          }
        } catch (parseError) {
          console.error(
            "Failed to parse AI response as JSON:",
            aiMessage.content
          );
          setConversationLog((prev) => [
            ...prev,
            { sender: "ai", text: aiMessage.content, code: null },
          ]);
        }
      } catch (err) {
        console.error("Error fetching AI response:", err);
        setConversationLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "I'm sorry, I encountered an error. Could you please repeat that?",
          },
        ]);
      } finally {
        setIsAiTyping(false);
      }
    },
    [interview]
  );

  useEffect(() => {
    if (conversationLog.length > 0) {
      const lastMessage = conversationLog[conversationLog.length - 1];
      if (lastMessage.sender === "user") {
        getAiResponse(conversationLog);
      }
    }
  }, [conversationLog, getAiResponse]);

  const startInterview = useCallback(() => {
    if (interview && conversationLog.length === 0) {
      getAiResponse([]);
    }
  }, [interview, conversationLog.length, getAiResponse]);

  const addUserMessage = useCallback((text, code = null) => {
    setConversationLog((prevLog) => {
      const lastMessage =
        prevLog.length > 0 ? prevLog[prevLog.length - 1] : null;
      // Only add the user's speech if the last message was from the AI.
      if (lastMessage && lastMessage.sender === "ai") {
        return [...prevLog, { sender: "user", text, code }];
      }
      // Otherwise, do not update the log.
      return prevLog;
    });
  }, []);

  return {
    conversationLog,
    setConversationLog,
    isAiTyping,
    code,
    setCode,
    startInterview,
    addUserMessage,
  };
}