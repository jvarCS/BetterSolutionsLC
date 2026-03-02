console.log("script start");

let prevID = null;
function watchForAcceptedSubmission() {
  console.log("Starting observer for Accepted submission");

  const observer = new MutationObserver(() => {
    const resultSpan = document.querySelector('[data-e2e-locator="submission-result"]');
    if (!resultSpan) return;

    const subID = location.href.split("/submissions/")[1]?.replace("/", "");
    if (!subID || subID === prevID) return;

    if (resultSpan.textContent.trim().toLowerCase() === "accepted") {
      prevID = subID;
      observer.disconnect();
      console.log("Accepted submission detected");
      runAnalyzer();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function runAnalyzer() {
  const accept = await showAsk();
  if (!(accept)) return;

  const code = extractCodeFromPage();
  if (!code) return;

  showLoadingPanel();

  chrome.runtime.sendMessage(
    { type: "ANALYZE_CODE", payload: code },
    (response) => {
      if (response?.error) {
        updatePanel("Error:\n" + response.error);
      } else {
        updatePanel("Complexity Analysis:\n\n" + response.result);
      }
    }
  );
}

function extractCodeFromPage() {
  const codeBlock = document.querySelector('code[class^="language-"]');
  if (!codeBlock) {
    console.error("Code block not found");
    return null;
  }

  const lines = [];
  let currentLine = "";

  codeBlock.childNodes.forEach(node => {
    if (
      node.tagName === "SPAN" &&
      node.classList.contains("react-syntax-highlighter-line-number")
    ) {
      if (currentLine) lines.push(currentLine);
      currentLine = "";
    } else if (node.textContent !== "\n") {
      currentLine += node.textContent;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.join("\n");
}

let panel;
let ask;

function showAsk() {
  return new Promise((resolve) => {
    if (ask) ask.remove();

    ask = document.createElement("div");
    ask.style.position = "fixed";
    ask.style.bottom = "20px";
    ask.style.right = "20px";
    ask.style.background = "#111";
    ask.style.color = "#fff";
    ask.style.padding = "15px 15px 30px 15px";
    ask.style.zIndex = 9999;
    ask.innerText = "Accepted submission detected! Do you want to analyze?";
    ask.style.maxWidth = "400px";

    const yesBtn = document.createElement("span");
    const noBtn = document.createElement("span");

    [yesBtn, noBtn].forEach(btn => {
        btn.style.position = "absolute";
        btn.style.bottom = "8px";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "14px";
        btn.style.color = "#aaa";
    });

    yesBtn.innerText = "Yes";
    noBtn.innerText = "No";

    yesBtn.style.left = "15px";
    noBtn.style.right = "15px";

    //  hover logic
    yesBtn.addEventListener("mouseenter", () => {
        yesBtn.style.color = "#fff";
      });

    yesBtn.addEventListener("mouseleave", () => {
      yesBtn.style.color = "#aaa";
    });

    noBtn.addEventListener("mouseenter", () => {
        noBtn.style.color = "#fff";
      });

    noBtn.addEventListener("mouseleave", () => {
      noBtn.style.color = "#aaa";
    });

    // click logic
    yesBtn.addEventListener("click", () => {
      ask.remove();
      resolve(true);
    });

    noBtn.addEventListener("click", () => {
      ask.remove();
      resolve(false);
    });


    document.body.appendChild(ask);
    ask.appendChild(yesBtn);
    ask.appendChild(noBtn);
  });
}

function showLoadingPanel() {
  if (panel) panel.remove();

  panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.bottom = "20px";
  panel.style.right = "20px";
  panel.style.background = "#111";
  panel.style.color = "#fff";
  panel.style.padding = "15px";
  panel.style.borderRadius = "10px";
  panel.style.zIndex = 9999;
  panel.style.maxWidth = "400px";
  panel.style.whiteSpace = "pre-wrap";
  panel.innerText = "Analyzing";

  document.body.appendChild(panel);
  // panel.appendChild(closeBtn);
}

function updatePanel(text) {
  if (panel) {
    panel.innerText = text;
    const closeBtn = document.createElement("span");
    closeBtn.innerText = "✖";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "8px";
    closeBtn.style.right = "10px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "14px";
    closeBtn.style.color = "#aaa";

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.color = "#fff";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.color = "#aaa";
    });

    closeBtn.addEventListener("click", () => {
      panel.remove();
      panel = null;
    });

    panel.style.paddingTop = "25px"; 
    panel.appendChild(closeBtn);
  }
}

if (location.href.includes("/submissions/")) {
  watchForAcceptedSubmission();
}

let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (lastUrl.includes("/submissions/")) {
      watchForAcceptedSubmission();
    }
  }
}, 500);