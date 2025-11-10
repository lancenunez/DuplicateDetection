const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/duplicate-check"
// or use your ngrok URL if testing externally
// const N8N_WEBHOOK_URL = "https://natational-denice-unheroical.ngrok-free.dev/webhook-test/duplicate-check"

let formData = { Subject: "" }

// Debounce helper
function debounce(func, timeout = 1000) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => func.apply(this, args), timeout)
  }
}

console.log("⏳ Waiting for Ivanti Subject field...")

// Observe DOM for Subject field (Ivanti often loads it dynamically)
const observer = new MutationObserver(() => {
  const subjectInput = document.querySelector('input[frsqa_fname="Subject"]')
  if (subjectInput && !subjectInput._listenerAdded) {
    subjectInput._listenerAdded = true
    console.log("✅ Subject field detected:", subjectInput)

    subjectInput.addEventListener(
      "input",
      debounce(() => {
        formData.Subject = subjectInput.value.trim()
        console.log("🟢 Subject changed:", formData.Subject)
        sendToWebhook(subjectInput)
      }, 800)
    )
  }
})

observer.observe(document, { childList: true, subtree: true })

// Send subject to n8n webhook
function sendToWebhook(inputEl) {
  if (formData.Subject.length > 3) {
    console.log("📡 Sending to n8n:", formData)

    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Subject: formData.Subject,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ n8n response:", data)

        // Only trigger alert if marked duplicate by n8n
        if (data.isDuplicate) {
          showDuplicateWarning(data)
        } else {
          showNoDuplicateNotice(inputEl)
        }
      })
      .catch((err) => console.error("❌ Webhook error:", err))
  }
}

// Display a duplicate warning popup
function showDuplicateWarning(data) {
  const existing = document.querySelector("#duplicate-warning")
  if (existing) existing.remove()

  const div = document.createElement("div")
  div.id = "duplicate-warning"
  div.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
      border-radius: 10px;
      padding: 15px 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      font-size: 14px;
      z-index: 9999;
      max-width: 320px;
      line-height: 1.4;
      ">
      ⚠️ <b>Possible Duplicate Found</b><br><br>
      <b>Incident:</b> ${data.bestMatchIncident || "N/A"}<br>
      <b>Subject:</b> ${data.Subject || "Unknown"}<br>
      <b>Similarity:</b> ${(parseFloat(data.similarity) * 100).toFixed(0)}%
    </div>
  `

  document.body.appendChild(div)
  setTimeout(() => div.remove(), 10000)
}

// New function
function showNoDuplicateNotice(inputEl) {
  const existing = document.querySelector("#no-duplicate-warning")
  if (existing) existing.remove()

  const div = document.createElement("div")
  div.id = "no-duplicate-warning"
  div.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 10px;
        padding: 15px 20px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        z-index: 9999;
        max-width: 320px;
        line-height: 1.4;
      ">
        ✅ No duplicate found.
      </div>
    `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 5000)
}
