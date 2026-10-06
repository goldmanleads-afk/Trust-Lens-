(function(){
  "use strict";

  var EXAMPLE_TEXT = "ChatGPT Plus users can now automatically connect every Google Drive folder to any custom GPT. The connection is completely secure, works in every country, and guarantees that the GPT always remembers the latest version of each file. Setup takes less than two minutes and no administrator approval is required.";
  var ANALYZE_ENDPOINT = "/.netlify/functions/analyze";
  var SUBSCRIBE_ENDPOINT = "/.netlify/functions/subscribe-nowis";
  var REQUEST_TIMEOUT_MS = 45000;

  var input = document.getElementById("input");
  var checkBtn = document.getElementById("checkBtn");
  var exampleBtn = document.getElementById("exampleBtn");
  var characterCount = document.getElementById("characterCount");
  var conversation = document.getElementById("conversation");
  var conversationEmpty = document.getElementById("conversationEmpty");
  var submittedAnswer = document.getElementById("submittedAnswer");
  var submittedPreview = document.getElementById("submittedPreview");
  var resultsEl = document.getElementById("results");
  var responseState = document.getElementById("responseState");
  var analysisLoading = document.getElementById("analysisLoading");
  var analysisContent = document.getElementById("analysisContent");
  var analysisVerdict = document.getElementById("analysisVerdict");
  var quickHits = document.getElementById("quickHits");
  var clearAnswer = document.getElementById("clearAnswer");
  var responseActions = document.getElementById("responseActions");
  var deeperBtn = document.getElementById("deeperBtn");
  var analysisError = document.getElementById("analysisError");
  var analysisErrorText = document.getElementById("analysisErrorText");
  var retryBtn = document.getElementById("retryBtn");
  var currentAnswer = "";

  function updateCharacterCount(){
    characterCount.textContent = input.value.length.toLocaleString() + " / 12,000";
  }

  function scrollConversationToBottom(){
    window.setTimeout(function(){
      conversation.scrollTop = conversation.scrollHeight;
    }, 0);
  }

  function setLoading(answer){
    conversationEmpty.hidden = true;
    submittedPreview.textContent = answer;
    submittedAnswer.hidden = false;
    resultsEl.hidden = false;
    analysisLoading.hidden = false;
    analysisContent.hidden = true;
    analysisError.hidden = true;
    responseState.textContent = "Looking for the important misses";
    checkBtn.disabled = true;
    checkBtn.textContent = "…";
    scrollConversationToBottom();
  }

  function clearLoading(){
    analysisLoading.hidden = true;
    checkBtn.disabled = false;
    checkBtn.textContent = "↑";
  }

  function makeQuickHit(hit){
    var item = document.createElement("li");
    item.className = "quick-hit";
    var title = document.createElement("strong");
    title.textContent = hit.title + ": ";
    item.appendChild(title);
    item.appendChild(document.createTextNode(hit.point));
    return item;
  }

  function isValidQuickAnalysis(value){
    if (!value || typeof value !== "object") return false;
    if (typeof value.verdict !== "string" || !Array.isArray(value.hits)) return false;
    return value.hits.every(function(hit){
      return hit && typeof hit.title === "string" && typeof hit.point === "string";
    });
  }

  function renderQuickAnalysis(analysis){
    quickHits.replaceChildren();
    analysisVerdict.textContent = analysis.verdict;
    analysis.hits.forEach(function(hit){
      quickHits.appendChild(makeQuickHit(hit));
    });

    clearAnswer.hidden = analysis.hits.length > 0;
    responseActions.hidden = false;
    deeperBtn.hidden = false;
    deeperBtn.disabled = false;
    deeperBtn.textContent = "Go deeper";
    analysisContent.hidden = false;
    analysisError.hidden = true;
    responseState.textContent = "Short answer first";
    scrollConversationToBottom();
  }

  function renderError(message){
    analysisContent.hidden = true;
    analysisError.hidden = false;
    analysisErrorText.textContent = message;
    responseState.textContent = "Couldn't finish";
    scrollConversationToBottom();
  }

  async function requestAnalysis(answer, mode, signal){
    var response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: answer, mode: mode }),
      signal: signal
    });

    var payload = await response.json().catch(function(){ return {}; });
    if (!response.ok){
      if (response.status === 404){
        throw new Error("Trust Lens AI isn't connected in this preview yet.");
      }
      throw new Error(payload.error || "Trust Lens couldn't analyze that answer right now. Please try again.");
    }
    return payload.analysis;
  }

  async function runCheck(answerOverride){
    var text = typeof answerOverride === "string" ? answerOverride : input.value.trim();
    if (!text){
      input.focus();
      return;
    }

    currentAnswer = text;
    setLoading(text);
    if (typeof answerOverride !== "string"){
      input.value = "";
      updateCharacterCount();
    }
    var controller = new AbortController();
    var timeoutId = setTimeout(function(){ controller.abort(); }, REQUEST_TIMEOUT_MS);

    try {
      var analysis = await requestAnalysis(text, "quick", controller.signal);
      if (!isValidQuickAnalysis(analysis)){
        throw new Error("Trust Lens received an incomplete analysis. Please try again.");
      }

      renderQuickAnalysis(analysis);
      maybeTriggerEarlyAccess();
    } catch (error) {
      if (error && error.name === "AbortError"){
        renderError("That answer took too long to analyze. Please try again.");
      } else {
        renderError(error && error.message ? error.message : "Trust Lens couldn't analyze that answer right now. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      clearLoading();
    }
  }

  input.addEventListener("input", updateCharacterCount);
  input.addEventListener("keydown", function(e){
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter"){
      e.preventDefault();
      runCheck();
    }
  });
  checkBtn.addEventListener("click", runCheck);
  retryBtn.addEventListener("click", function(){ runCheck(currentAnswer); });
  exampleBtn.addEventListener("click", function(){
    input.value = EXAMPLE_TEXT;
    updateCharacterCount();
    input.focus();
  });

  var memberGateOverlay = document.getElementById("memberGateOverlay");
  var memberGateClose = document.getElementById("memberGateClose");
  var memberUpgradeBtn = document.getElementById("memberUpgradeBtn");
  var memberGateForm = document.getElementById("memberGateForm");
  var memberGateEmail = document.getElementById("memberGateEmail");
  var memberGateLastFocus = null;

  function openMemberGate(){
    memberGateLastFocus = document.activeElement;
    memberGateOverlay.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(function(){ memberGateClose.focus(); }, 0);
  }

  function closeMemberGate(){
    memberGateOverlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (memberGateLastFocus && memberGateLastFocus.focus) memberGateLastFocus.focus();
  }

  deeperBtn.addEventListener("click", openMemberGate);
  memberGateClose.addEventListener("click", closeMemberGate);
  memberGateOverlay.addEventListener("click", function(e){
    if (e.target === memberGateOverlay) closeMemberGate();
  });
  memberGateOverlay.addEventListener("keydown", function(e){
    if (e.key === "Escape"){
      e.preventDefault();
      closeMemberGate();
      return;
    }
    if (e.key !== "Tab") return;
    var focusable = [memberGateClose, memberGateEmail, memberUpgradeBtn];
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  });
  updateCharacterCount();

  // "Go deeper" member gate: capture the email before sending them on to
  // the Stan Store upgrade page, so we don't lose leads who click through
  // but don't buy on the spot.
  if (memberGateForm){
    memberGateForm.addEventListener("submit", function(e){
      e.preventDefault();
      submitToNetlify({ "form-name": "member-gate", email: memberGateEmail.value })
        .catch(function(err){ console.error("Netlify Forms submit failed:", err); });
      subscribeToNowis(memberGateEmail.value);
      window.location.href = SALES_PAGE_URL;
    });
  }

  // Netlify Forms submission helper.
  function encodeFormData(data){
    return Object.keys(data)
      .map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]); })
      .join("&");
  }

  function submitToNetlify(fields){
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(fields)
    });
  }

  // NOWIS eResponder subscribe helper. Fire-and-forget: a failure here
  // should never block the on-page success message or the Stan Store link.
  function subscribeToNowis(email){
    return fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    }).catch(function(err){
      console.error("NOWIS subscribe failed:", err);
    });
  }

  var seForm = document.getElementById("seForm");
  if (seForm){
    seForm.addEventListener("submit", function(e){
      e.preventDefault();
      var seEmailInput = document.getElementById("seEmail");
      submitToNetlify({ "form-name": "standing-email", email: seEmailInput.value })
        .catch(function(err){ console.error("Netlify Forms submit failed:", err); });
      subscribeToNowis(seEmailInput.value);
      var success = document.createElement("p");
      success.className = "form-success";
      success.textContent = "You're on the list — thanks.";
      seForm.replaceChildren(success);
    });
  }

  // Exclusive early-access popup: third successful analysis, fixed 24 hours.
  var CHECK_COUNT_KEY = "icaCheckCount";
  var EA_DEADLINE_KEY = "icaEaDeadline";
  var EA_SHOWN_KEY = "icaEaShown";
  var SALES_PAGE_URL = "https://stan.store/lrmobi/p/the-ica-pro-blueprint";
  var THANK_YOU_PAGE_URL = "https://nateg27.gonowos.com/pb/bleuprint";

  var eaOverlay = document.getElementById("eaOverlay");
  var eaClose = document.getElementById("eaClose");
  var eaForm = document.getElementById("eaForm");
  var eaEmail = document.getElementById("eaEmail");
  var eaTimer = document.getElementById("eaTimer");
  var eaDirectLink = document.getElementById("eaDirectLink");
  var eaReopen = document.getElementById("eaReopen");
  var eaReopenTimer = document.getElementById("eaReopenTimer");
  var eaReopenBtn = document.getElementById("eaReopenBtn");
  var countdownTimerId = null;
  var reopenTimerId = null;
  var lastFocusedElement = null;

  function readStored(key){
    try { return localStorage.getItem(key); }
    catch (e) { return null; }
  }

  function writeStored(key, value){
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getCheckCount(){
    var n = parseInt(readStored(CHECK_COUNT_KEY) || "0", 10);
    return isNaN(n) ? 0 : n;
  }

  function bumpCheckCount(){
    var n = getCheckCount() + 1;
    return writeStored(CHECK_COUNT_KEY, String(n)) ? n : 0;
  }

  function getOrCreateDeadline(){
    var existing = parseInt(readStored(EA_DEADLINE_KEY) || "0", 10);
    if (existing) return existing;
    var deadline = Date.now() + (24 * 60 * 60 * 1000);
    return writeStored(EA_DEADLINE_KEY, String(deadline)) ? deadline : 0;
  }

  function formatRemaining(ms){
    if (ms <= 0) return "00:00:00";
    var totalSeconds = Math.floor(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    function pad(n){ return (n < 10 ? "0" : "") + n; }
    return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  }

  function expireEarlyAccess(){
    eaOverlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (eaReopen) eaReopen.hidden = true;
    if (countdownTimerId){
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
    if (reopenTimerId){
      clearInterval(reopenTimerId);
      reopenTimerId = null;
    }
  }

  function startCountdown(deadline){
    if (countdownTimerId) clearInterval(countdownTimerId);
    function tick(){
      var remaining = deadline - Date.now();
      eaTimer.textContent = formatRemaining(remaining);
      if (remaining <= 0) expireEarlyAccess();
    }
    tick();
    if (deadline > Date.now()) countdownTimerId = setInterval(tick, 1000);
  }

  function isOfferActive(){
    var deadline = parseInt(readStored(EA_DEADLINE_KEY) || "0", 10);
    return Boolean(deadline && deadline > Date.now());
  }

  function openEaPopup(){
    var deadline = getOrCreateDeadline();
    if (!deadline || deadline <= Date.now()){
      expireEarlyAccess();
      return;
    }
    lastFocusedElement = document.activeElement;
    eaOverlay.hidden = false;
    document.body.classList.add("modal-open");
    startCountdown(deadline);
    writeStored(EA_SHOWN_KEY, "1");
    window.setTimeout(function(){ eaEmail.focus(); }, 0);
  }

  function checkReopenEligibility(){
    var wasShown = readStored(EA_SHOWN_KEY) === "1";
    if (!wasShown || !eaReopen){
      if (eaReopen) eaReopen.hidden = true;
      return;
    }

    var deadline = parseInt(readStored(EA_DEADLINE_KEY) || "0", 10);
    if (!deadline || deadline <= Date.now()){
      expireEarlyAccess();
      return;
    }

    eaReopen.hidden = false;
    if (reopenTimerId) clearInterval(reopenTimerId);
    function tick(){
      var remaining = deadline - Date.now();
      if (remaining <= 0){
        expireEarlyAccess();
        return;
      }
      eaReopenTimer.textContent = formatRemaining(remaining);
    }
    tick();
    reopenTimerId = setInterval(tick, 1000);
  }

  function closeEaPopup(restoreFocus){
    eaOverlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (countdownTimerId){
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
    checkReopenEligibility();
    if (restoreFocus !== false && lastFocusedElement && lastFocusedElement.focus){
      lastFocusedElement.focus();
    }
  }

  function maybeTriggerEarlyAccess(){
    var count = bumpCheckCount();
    var alreadyShown = readStored(EA_SHOWN_KEY) === "1";
    if (count === 3 && !alreadyShown) setTimeout(openEaPopup, 600);
  }

  if (eaReopenBtn) eaReopenBtn.addEventListener("click", openEaPopup);
  checkReopenEligibility();

  if (eaClose){
    eaClose.addEventListener("click", function(){ closeEaPopup(true); });
  }
  if (eaOverlay){
    eaOverlay.addEventListener("click", function(e){
      if (e.target === eaOverlay) closeEaPopup(true);
    });
    eaOverlay.addEventListener("keydown", function(e){
      if (e.key === "Escape"){
        e.preventDefault();
        closeEaPopup(true);
        return;
      }
      if (e.key !== "Tab") return;
      var focusable = eaOverlay.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    });
  }
  if (eaForm){
    eaForm.addEventListener("submit", function(e){
      e.preventDefault();
      if (!isOfferActive()){
        expireEarlyAccess();
        return;
      }
      submitToNetlify({ "form-name": "early-access", email: eaEmail.value })
        .catch(function(err){ console.error("Netlify Forms submit failed:", err); });
      subscribeToNowis(eaEmail.value);

      window.location.href = THANK_YOU_PAGE_URL;
    });
  }
  if (eaDirectLink){
    eaDirectLink.addEventListener("click", function(e){
      if (!isOfferActive()){
        e.preventDefault();
        expireEarlyAccess();
        return;
      }
      e.preventDefault();
      window.location.href = SALES_PAGE_URL;
    });
  }
})();
