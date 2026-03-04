chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    openaiKey: "put your own"
  });
  console.log("API key stored");
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_CODE") {
    analyzeCodeWithLLM(message.payload)
      .then(result => sendResponse({ result }))
      .catch(error => {
        console.error("LLM Error:", error);
        sendResponse({ error: error.message });
      });

    return true; 
  }
});

// send to llm
async function analyzeCodeWithLLM(code) {
  const { openaiKey } = await chrome.storage.local.get("openaiKey");

  if (!openaiKey) {
    throw new Error("OpenAI API key not found.");
  }

  const prompt = `
    You are a senior algorithm expert.

    Analyze the following code and provide:

    1. Time Complexity (Big-O)
    2. Space Complexity (Big-O)
    3. Short explanation (2-4 sentences)

    Code: ${code}
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in algorithms." },
        { role: "user", content: prompt }
      ],
      temperature: 0
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI API error");
  }

  return data.choices[0].message.content;
}