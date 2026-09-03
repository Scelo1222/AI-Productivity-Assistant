/* StudySync AI — vanilla JS app logic
   No frameworks, no backend. State lives in localStorage. */

(function () {
  "use strict";

  /* ---------------- State ---------------- */
  var STORE = "studysync.v2";
  var state = load();

  function load() {
    var base = {
      theme: "light",
      stats: { total: 0, minutes: 0, emails: 0, notes: 0, plans: 0, research: 0 },
      activity: [],
      chat: [],
      firstSeen: new Date().toDateString(),
      seenDisclaimer: false,
    };
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      return Object.assign(base, raw, { stats: Object.assign(base.stats, raw.stats || {}) });
    } catch (e) {
      return base;
    }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- Theme ---------------- */
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    $("themeBtn").innerHTML = state.theme === "dark"
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
  $("themeBtn").addEventListener("click", function () {
    state.theme = state.theme === "dark" ? "light" : "dark";
    save(); applyTheme(); toast(state.theme === "dark" ? "Dark mode on 🌙" : "Light mode on ☀️");
  });

  /* ---------------- UI helpers ---------------- */
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function track(kind, label, minutes) {
    state.stats.total++;
    state.stats.minutes += minutes || 5;
    if (state.stats[kind] !== undefined) state.stats[kind]++;
    state.activity.unshift({ text: label, at: Date.now() });
    state.activity = state.activity.slice(0, 8);
    save();
  }

  function ago(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    return Math.floor(m / 60) + "h ago";
  }

  function loading(el, text) {
    el.innerHTML = '<div class="empty"><div class="spinner"></div><span>' + esc(text) + "</span></div>";
  }

  /* Simulated AI latency so the UI shows real loading states. */
  function think(fn, ms) { setTimeout(fn, ms || 750 + Math.random() * 650); }

  function lines(text) {
    return String(text).split(/\n|•|;/).map(function (l) { return l.replace(/^[-*\d.\s]+/, "").trim(); })
      .filter(function (l) { return l.length > 1; });
  }

  /* ---------------- Prompt engineering layer ----------------
     Every generator builds an explicit role + context + constraints
     + output-format prompt, then renders a deterministic response. */
  function buildPrompt(role, context, constraints, format) {
    return [
      "ROLE: " + role,
      "CONTEXT: " + context,
      "CONSTRAINTS: " + constraints,
      "OUTPUT FORMAT: " + format,
      "SAFETY: study aid only — flag anything the student must verify.",
    ].join("\n");
  }

  /* ---------------- Pages ---------------- */
  var pages = {};
  var titles = {
    dashboard: ["Dashboard", "Everything in one place, no chaos."],
    email: ["Email Writer", "Send it like you mean it — professionally."],
    notes: ["Notes Summarizer", "Turn messy lecture notes into a clean plan."],
    planner: ["Study Planner", "A realistic timetable, built around your life."],
    research: ["Research Helper", "Structure your topic before you write."],
    tutor: ["AI Tutor", "Ask anything, get study-smart answers."],
  };

  /* ---- Dashboard ---- */
  pages.dashboard = function () {
    var s = state.stats;
    var tools = [
      ["email", "fa-envelope", "Email Writer", "Draft emails to lecturers, tutors or employers with the right tone."],
      ["notes", "fa-file-lines", "Notes Summarizer", "Pull action items, deadlines and key points out of raw notes."],
      ["planner", "fa-calendar-check", "Study Planner", "Get a time-blocked schedule with breaks that respect your energy."],
      ["research", "fa-book-open", "Research Helper", "Build an outline, key questions and search terms for your topic."],
      ["tutor", "fa-comment-dots", "AI Tutor", "Talk through concepts, exam prep and study-life balance."],
    ];

    return (
      '<section class="hero">' +
        "<h2>Hey 👋 let's get this work done</h2>" +
        "<p>StudySync AI is your all-in-one study desk: draft the awkward email, summarise the 3-hour lecture, plan the week and revise with a tutor that never sleeps.</p>" +
        '<div class="hero-actions">' +
          '<button class="chip" data-go="planner"><i class="fa-solid fa-wand-magic-sparkles"></i> Plan my day</button>' +
          '<button class="chip" data-go="notes"><i class="fa-solid fa-bolt"></i> Summarise notes</button>' +
          '<button class="chip" data-go="tutor"><i class="fa-solid fa-graduation-cap"></i> Ask the tutor</button>' +
        "</div>" +
      "</section>" +

      '<div class="grid stats" style="margin-bottom:20px">' +
        stat("Tools used", s.total, "v-brand") +
        stat("Time saved", s.minutes + "m", "v-cyan") +
        stat("Emails", s.emails, "v-pink") +
        stat("Notes", s.notes, "v-amber") +
        stat("Plans", s.plans, "v-brand") +
        stat("Research", s.research, "v-cyan") +
      "</div>" +

      '<div class="grid cards">' +
        tools.map(function (t) {
          return '<button class="card" data-go="' + t[0] + '">' +
            '<div class="ico"><i class="fa-solid ' + t[1] + '"></i></div>' +
            "<h3>" + t[2] + "</h3><p>" + t[3] + "</p></button>";
        }).join("") +
      "</div>" +

      '<section class="panel" style="margin-top:20px">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-clock-rotate-left"></i> Recent activity</h2>' +
        '<button class="btn btn-ghost" id="clearActivity">Clear</button></div>' +
        '<div id="activityList">' + renderActivity() + "</div>" +
      "</section>"
    );
  };

  function stat(label, value, cls) {
    return '<div class="stat"><div class="label">' + label + '</div><div class="value ' + cls + '">' + value + "</div></div>";
  }

  function renderActivity() {
    if (!state.activity.length) {
      return '<div class="empty"><i class="fa-regular fa-face-smile"></i><span>No activity yet — pick a tool above and start.</span></div>';
    }
    return state.activity.map(function (a) {
      return '<div class="activity"><span class="dot"></span><span>' + esc(a.text) + '</span><span class="time">' + ago(a.at) + "</span></div>";
    }).join("");
  }

  /* ---- Email writer ---- */
  var tone = "formal";
  pages.email = function () {
    return (
      '<section class="panel">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-envelope"></i> Smart email draft</h2><span class="tag">Tone-aware</span></div>' +
        '<div class="row"><div class="field"><label>Send to</label><input id="eTo" value="Prof. Johnson" placeholder="e.g. Prof. Johnson"></div>' +
        '<div class="field"><label>Subject</label><input id="eSubj" value="Assignment extension request" placeholder="What is it about?"></div></div>' +
        '<div class="field"><label>Your main points</label><textarea id="ePoints" rows="5" placeholder="Bullet the facts — the AI writes the polish.">I was unwell this week and could not finish the Data Structures assignment.\nParts 1 and 2 are done, I need 3 more days for the coding section.\nHappy to show my progress in office hours.</textarea></div>' +
        '<div class="field"><label>Tone</label><div class="actions" id="toneRow">' +
          toneBtn("formal", "Formal · lecturer") + toneBtn("friendly", "Friendly · classmate") + toneBtn("confident", "Confident · employer") +
        "</div></div>" +
        '<div class="actions"><button class="btn btn-primary" id="eGo"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate email</button>' +
        '<button class="btn btn-ghost" data-copy="eOut"><i class="fa-solid fa-copy"></i> Copy</button>' +
        '<button class="btn btn-ghost" data-download="eOut"><i class="fa-solid fa-download"></i> Export</button></div>' +
        '<div class="output" id="eOut" contenteditable="true"><div class="empty"><i class="fa-regular fa-pen-to-square"></i><span>Your draft appears here — and stays editable.</span></div></div>' +
        note("Read it once before sending. Never send AI text that claims something untrue about you.") +
      "</section>"
    );
  };
  function toneBtn(id, label) {
    return '<button class="btn btn-ghost' + (tone === id ? " active" : "") + '" data-tone="' + id + '">' + label + "</button>";
  }

  function generateEmail() {
    var to = $("eTo").value.trim() || "there";
    var subject = $("eSubj").value.trim() || "Quick question";
    var pts = lines($("ePoints").value);
    var out = $("eOut");
    if (!pts.length) { toast("Add a few points first"); return; }

    var prompt = buildPrompt(
      "a university student writing a " + tone + " email",
      "Recipient: " + to + ". Subject: " + subject + ". Points: " + pts.join(" | "),
      "Max 180 words, no invented facts, one clear ask, polite close.",
      "Subject line, greeting, 2-3 short paragraphs, sign-off."
    );
    console.log("[StudySync prompt]\n" + prompt);

    loading(out, "Drafting your email…");
    think(function () {
      var open = {
        formal: "Dear " + to + ",\n\nI hope this email finds you well.",
        friendly: "Hi " + to + ",\n\nHope you're doing okay!",
        confident: "Dear " + to + ",\n\nThank you for your time — I'll keep this brief.",
      }[tone];
      var close = {
        formal: "Thank you for your understanding and for considering my request.\n\nKind regards,\n[Your name]\n[Student number]",
        friendly: "Thanks a mil — let me know what works for you!\n\nCheers,\n[Your name]",
        confident: "I'm confident I can deliver on this and I'd welcome the chance to discuss it.\n\nBest regards,\n[Your name]",
      }[tone];
      var body = pts.map(function (p, i) {
        var lead = ["I wanted to let you know that", "In addition,", "Finally,"][Math.min(i, 2)];
        return lead + " " + p.charAt(0).toLowerCase() + p.slice(1).replace(/\.$/, "") + ".";
      }).join(" ");
      var ask = tone === "friendly" ? "Would that work on your side?" : "Please let me know whether this would be possible.";

      out.textContent = "Subject: " + subject + "\n\n" + open + "\n\n" + body + "\n\n" + ask + "\n\n" + close;
      track("emails", "Drafted an email to " + to, 12);
      toast("Email drafted ✍️");
    });
  }

  /* ---- Notes summarizer ---- */
  pages.notes = function () {
    return (
      '<section class="panel">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-file-lines"></i> Lecture notes → study plan</h2><span class="tag">Extracts deadlines</span></div>' +
        '<div class="field"><label>Paste your raw notes</label><textarea id="nIn" rows="11">CS301 Lecture: Graph Algorithms\n- Covered Dijkstra shortest path and Bellman-Ford\n- Dijkstra does not work with negative weights\n- Bellman-Ford can detect negative cycles\n- Assignment 3 released: implement both algorithms in Python\n- Due: 20 September before midnight\n- Office hours: Wed 2-4pm Room 304\n- Midterm exam moved to 25 September\n- Recommended reading: CLRS Chapter 24</textarea></div>' +
        '<div class="actions"><button class="btn btn-primary" id="nGo"><i class="fa-solid fa-wand-magic-sparkles"></i> Summarise &amp; extract</button>' +
        '<button class="btn btn-ghost" data-copy="nOut"><i class="fa-solid fa-copy"></i> Copy</button>' +
        '<button class="btn btn-ghost" data-download="nOut"><i class="fa-solid fa-download"></i> Export</button></div>' +
        '<div id="nOut"><div class="output"><div class="empty"><i class="fa-regular fa-file-lines"></i><span>Summary, to-dos and deadlines land here.</span></div></div></div>' +
        note("Auto-extracted dates can be wrong — confirm every deadline on your LMS.") +
      "</section>"
    );
  };

  function summariseNotes() {
    var src = $("nIn").value.trim();
    var out = $("nOut");
    if (!src) { toast("Paste some notes first"); return; }
    console.log("[StudySync prompt]\n" + buildPrompt(
      "a study coach summarising lecture notes",
      src.slice(0, 400),
      "No new facts. Separate tasks, concepts and dated items.",
      "Summary paragraph + action items + key concepts + deadlines."
    ));

    out.innerHTML = '<div class="output"><div class="empty"><div class="spinner"></div><span>Reading your notes…</span></div></div>';
    think(function () {
      var ls = lines(src);
      var dateRx = /(\d{1,2}\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|due|deadline|submit|exam|test|midterm|by\s\d)/i;
      var taskRx = /(assignment|implement|read|write|prepare|revise|complete|practice|study|watch|submit)/i;

      var deadlines = ls.filter(function (l) { return dateRx.test(l); });
      var tasks = ls.filter(function (l) { return taskRx.test(l) && deadlines.indexOf(l) === -1; });
      var concepts = ls.filter(function (l) { return deadlines.indexOf(l) === -1 && tasks.indexOf(l) === -1; });

      var title = ls[0] || "these notes";
      var summary = title + " covers " + Math.max(concepts.length, 1) + " key ideas, " + tasks.length +
        " task(s) to action and " + deadlines.length + " dated item(s). Start with the earliest deadline, " +
        "block one focused session per key concept, and bring your questions to office hours.";

      out.innerHTML =
        '<div class="out-cards">' +
          card("fa-list-check", "Action items", tasks) +
          card("fa-lightbulb", "Key concepts", concepts) +
          card("fa-clock", "Deadlines", deadlines) +
        "</div>" +
        '<div class="output" id="nText">' + esc(summary) + "</div>";
      track("notes", "Summarised notes: " + title.slice(0, 34), 25);
      toast("Notes summarised 📄");
    });
  }
  function card(icon, title, items) {
    var body = items.length
      ? "<ul>" + items.slice(0, 8).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>"
      : '<li style="color:var(--muted)">Nothing detected</li>';
    return '<div class="out-card"><h4><i class="fa-solid ' + icon + '"></i> ' + title + "</h4>" + body + "</div>";
  }

  /* ---- Planner ---- */
  pages.planner = function () {
    return (
      '<section class="panel">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-calendar-check"></i> Build my schedule</h2><span class="tag">Breaks included</span></div>' +
        '<div class="field"><label>What do you need to get done?</label><textarea id="pIn" rows="6">Finish Data Structures assignment\nShift at the campus cafe (4pm-8pm)\nRevise graph algorithms for midterm\nGym session\nEmail group about project meeting</textarea></div>' +
        '<div class="row"><div class="field"><label>Start</label><input type="time" id="pStart" value="08:00"></div>' +
        '<div class="field"><label>End</label><input type="time" id="pEnd" value="21:00"></div>' +
        '<div class="field"><label>Energy peak</label><select id="pEnergy"><option value="morning">Morning person</option><option value="evening">Night owl</option></select></div></div>' +
        '<div class="actions"><button class="btn btn-primary" id="pGo"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate schedule</button>' +
        '<button class="btn btn-ghost" data-copy="pOut"><i class="fa-solid fa-copy"></i> Copy</button>' +
        '<button class="btn btn-ghost" data-download="pOut"><i class="fa-solid fa-download"></i> Export</button></div>' +
        '<div class="output" id="pOut" contenteditable="true"><div class="empty"><i class="fa-regular fa-calendar"></i><span>Your time-blocked day shows up here.</span></div></div>' +
        note("Your plan should serve you — move blocks around and protect your sleep.") +
      "</section>"
    );
  };

  function generatePlan() {
    var tasks = lines($("pIn").value);
    var out = $("pOut");
    if (!tasks.length) { toast("Add at least one task"); return; }
    var start = $("pStart").value || "08:00";
    var end = $("pEnd").value || "21:00";
    var energy = $("pEnergy").value;
    console.log("[StudySync prompt]\n" + buildPrompt(
      "a productivity coach for students",
      "Tasks: " + tasks.join(" | ") + ". Window " + start + "-" + end + ". Energy peak: " + energy + ".",
      "Deep work at the energy peak, 10-min breaks, a meal break, never exceed the window.",
      "Time-blocked list plus 3 focus tips."
    ));

    loading(out, "Blocking out your day…");
    think(function () {
      var toMin = function (t) { return +t.split(":")[0] * 60 + +t.split(":")[1]; };
      var fmt = function (m) { return String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
      var cur = toMin(start), limit = toMin(end);
      var ordered = energy === "evening" ? tasks.slice().reverse() : tasks.slice();
      var rows = [];

      ordered.forEach(function (t, i) {
        if (cur >= limit) return;
        var block = /gym|shift|work|meeting/i.test(t) ? 120 : 60;
        block = Math.min(block, limit - cur);
        rows.push(fmt(cur) + " – " + fmt(cur + block) + "   " + t);
        cur += block;
        if (cur + 10 < limit && i < ordered.length - 1) {
          var isMeal = cur - toMin(start) > 240 && !rows.some(function (r) { return /Meal/.test(r); });
          var pause = isMeal ? 40 : 10;
          rows.push(fmt(cur) + " – " + fmt(cur + pause) + "   " + (isMeal ? "🍜 Meal + reset" : "☕ Break — screens down"));
          cur += pause;
        }
      });

      out.textContent =
        "YOUR PLAN (" + start + "–" + end + ", " + energy + " focus)\n\n" + rows.join("\n") +
        "\n\nFOCUS TIPS\n1. Phone in another room for the first two blocks.\n" +
        "2. Use 25/5 pomodoros inside any 60-minute study block.\n" +
        "3. If a block overruns, cut the next one — don't cut sleep.";
      track("plans", "Generated a study schedule", 18);
      toast("Schedule ready 📅");
    });
  }

  /* ---- Research ---- */
  pages.research = function () {
    return (
      '<section class="panel">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-book-open"></i> Research starter</h2><span class="tag">Outline + sources to find</span></div>' +
        '<div class="field"><label>Your topic or question</label><textarea id="rIn" rows="3">Impact of remote learning on student productivity and mental health</textarea></div>' +
        '<div class="row"><div class="field"><label>Depth</label><select id="rDepth"><option value="brief">Brief overview</option><option value="detailed">Detailed analysis</option></select></div>' +
        '<div class="field"><label>Format</label><select id="rFormat"><option value="essay">Essay outline</option><option value="report">Report structure</option><option value="presentation">Presentation deck</option></select></div></div>' +
        '<div class="actions"><button class="btn btn-primary" id="rGo"><i class="fa-solid fa-wand-magic-sparkles"></i> Build outline</button>' +
        '<button class="btn btn-ghost" data-copy="rOut"><i class="fa-solid fa-copy"></i> Copy</button>' +
        '<button class="btn btn-ghost" data-download="rOut"><i class="fa-solid fa-download"></i> Export</button></div>' +
        '<div class="output" id="rOut" contenteditable="true"><div class="empty"><i class="fa-regular fa-lightbulb"></i><span>Structure, questions and search terms appear here.</span></div></div>' +
        note("This tool never invents citations. It tells you what to search for — you find and read the real sources.") +
      "</section>"
    );
  };

  function generateResearch() {
    var topic = $("rIn").value.trim();
    var out = $("rOut");
    if (!topic) { toast("Enter a topic"); return; }
    var depth = $("rDepth").value, format = $("rFormat").value;
    console.log("[StudySync prompt]\n" + buildPrompt(
      "an academic research assistant",
      "Topic: " + topic + ". Depth: " + depth + ". Format: " + format + ".",
      "Never fabricate citations or statistics. Provide search strategy instead.",
      "Framing, outline, key questions, search terms, verification checklist."
    ));

    loading(out, "Structuring your research…");
    think(function () {
      var sections = format === "presentation"
        ? ["Hook slide: why this matters now", "Background in 3 bullets", "Evidence part 1", "Evidence part 2", "Counter-argument", "So what: your conclusion", "References"]
        : format === "report"
        ? ["Executive summary", "Introduction & scope", "Methodology", "Findings", "Discussion & limitations", "Recommendations", "References"]
        : ["Introduction & thesis", "Context and definitions", "Argument 1 + evidence", "Argument 2 + evidence", "Counter-argument & rebuttal", "Conclusion", "Reference list"];
      if (depth === "brief") sections = sections.slice(0, 5).concat(sections.slice(-1));

      var core = topic.replace(/[?.]$/, "");
      out.textContent =
        "TOPIC\n" + core +
        "\n\nHOW TO FRAME IT\nNarrow it to one population, one place and one time window — e.g. \"" +
        core + "\" among undergraduates, 2020–2025. A narrow question is easier to defend.\n\n" +
        "OUTLINE (" + format + ", " + depth + ")\n" +
        sections.map(function (s, i) { return (i + 1) + ". " + s; }).join("\n") +
        "\n\nKEY QUESTIONS TO ANSWER\n• What does the strongest evidence actually show?\n• Who disagrees, and on what grounds?\n• What is missing from the current research?\n• What does this mean for students like you?\n\n" +
        "SEARCH TERMS FOR GOOGLE SCHOLAR / YOUR LIBRARY\n• \"" + core + "\" systematic review\n• \"" + core + "\" longitudinal study\n• " + core + " AND wellbeing AND undergraduates\n\n" +
        "VERIFY BEFORE YOU WRITE\n☐ Every source read, not just the abstract\n☐ Publication date within scope\n☐ Citation style matches your brief\n☐ No claim in your draft without a source behind it";
      track("research", "Built a research outline", 30);
      toast("Outline ready 🔍");
    });
  }

  /* ---- Tutor ---- */
  pages.tutor = function () {
    return (
      '<section class="panel">' +
        '<div class="panel-head"><h2><i class="fa-solid fa-comment-dots"></i> AI Tutor</h2>' +
        '<button class="btn btn-ghost" id="clearChat"><i class="fa-solid fa-trash-can"></i> Clear chat</button></div>' +
        '<div class="chat"><div class="chat-log" id="chatLog"></div>' +
        '<div class="chat-bar"><input id="chatInput" placeholder="Ask about study methods, exams, balance…" autocomplete="off">' +
        '<button id="chatSend" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button></div></div>' +
        '<div class="quick">' +
          quick("How do I balance work and study?") + quick("Help me plan for exams") +
          quick("How do I stop procrastinating?") + quick("Explain active recall") +
        "</div>" +
        note("The tutor gives study guidance, not medical, legal or financial advice — and it will not do your assessment for you.") +
      "</section>"
    );
  };
  function quick(q) { return '<button class="btn btn-ghost" data-quick="' + esc(q) + '">' + esc(q) + "</button>"; }

  function renderChat() {
    var log = $("chatLog");
    if (!log) return;
    if (!state.chat.length) {
      state.chat = [{ role: "bot", text: "Hey! I'm your AI tutor 🎓 Ask me about study techniques, exam prep, time management or balancing work and school. I explain things — I don't write your assessments." }];
    }
    log.innerHTML = state.chat.map(function (m) {
      return '<div class="msg ' + m.role + '"><div class="avatar"><i class="fa-solid ' +
        (m.role === "user" ? "fa-user" : "fa-robot") + '"></i></div><div class="bubble">' + esc(m.text) + "</div></div>";
    }).join("");
    log.scrollTop = log.scrollHeight;
  }

  function answer(q) {
    var t = q.toLowerCase();
    if (/balance|work and study|part.?time|job/.test(t))
      return "Balancing a job with study comes down to three moves:\n1. Map fixed blocks first (shifts, lectures) — study only fits in what's left.\n2. Protect two deep-work blocks per week per module; treat them like shifts you can't skip.\n3. Batch admin (emails, readings prep) into one 30-minute slot instead of all day.\nIf you're consistently below 6 hours of sleep, the schedule is wrong, not you.";
    if (/procrastinat|focus|motivat|distract/.test(t))
      return "Procrastination is usually task ambiguity, not laziness.\n• Rewrite the task until it's a 2-minute first step (\"open the doc and write the heading\").\n• Use a 25/5 pomodoro; commit to just one.\n• Remove the phone from the room — willpower loses to proximity.\n• Body-double: study next to someone, on campus or on a call.";
    if (/exam|midterm|test|revis/.test(t))
      return "Exam plan that actually works:\n1. Build a topic list from the syllabus, rate each 1-5 on confidence.\n2. Spend 70% of your time on the 1s and 2s — not on rewriting notes you already know.\n3. Use active recall: close the notes, write what you remember, then check.\n4. Space it: revisit each topic after 1 day, 3 days, then 7 days.\n5. Do one full past paper under timed conditions before the real thing.";
    if (/active recall|spaced|technique|memor|study method/.test(t))
      return "Active recall = retrieving information instead of rereading it. Practically: turn every heading in your notes into a question, close the notes, answer out loud or on paper, then check.\nPair it with spaced repetition (1 day → 3 days → 7 days → 21 days) and you'll remember far more than highlighting ever gave you.";
    if (/stress|anxiet|burn|overwhelm|tired|depress/.test(t))
      return "That sounds heavy, and it's common — you're not failing.\nShort term: pick the single most urgent task, do 20 minutes, then take a real break away from screens.\nStructural: talk to your lecturer early about extensions; most would rather help than fail you.\nImportant: I'm an AI study tool, not a counsellor. If this has lasted more than a couple of weeks, please contact your campus counselling service or a health professional.";
    if (/write|essay|assignment|report/.test(t))
      return "Essay flow that avoids blank-page paralysis:\n1. Write the thesis sentence first — one sentence, arguable.\n2. List 3 supporting arguments as headings.\n3. Under each, dump evidence in bullets (with sources).\n4. Only then write full prose, introduction last.\nI can help you structure and critique it — the words that get submitted should be yours.";
    if (/cite|referenc|plagiar|integrity/.test(t))
      return "Rules of thumb: cite every idea that isn't yours or common knowledge, keep a reference note the moment you read a source, and check your institution's required style (APA, Harvard, IEEE).\nAI-generated text submitted as your own is usually a policy breach — use these drafts as scaffolding and rewrite in your voice.";
    return "Good question. Break it down like this:\n1. What exactly do you need to produce or understand?\n2. What's the deadline and how much time is truly available?\n3. What's the smallest first step you could do in 10 minutes?\nGive me more detail — the module, the task or the deadline — and I'll get specific. Remember to verify anything factual against your course material.";
  }

  function sendChat(text) {
    var input = $("chatInput");
    var q = (text !== undefined ? text : input.value).trim();
    if (!q) return;
    if (input) input.value = "";
    state.chat.push({ role: "user", text: q });
    renderChat();
    var log = $("chatLog");
    log.insertAdjacentHTML("beforeend", '<div class="msg bot" id="typing"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="bubble">typing…</div></div>');
    log.scrollTop = log.scrollHeight;
    console.log("[StudySync prompt]\n" + buildPrompt("a supportive student tutor", q, "Explain, never complete graded work. Refer serious wellbeing issues to humans.", "Short answer with numbered steps."));
    think(function () {
      state.chat.push({ role: "bot", text: answer(q) });
      state.chat = state.chat.slice(-40);
      track("total", "Asked the AI tutor a question", 6);
      renderChat();
    }, 700);
  }

  function note(text) {
    return '<p style="margin-top:14px; font-size:12.5px; color:var(--muted); display:flex; gap:8px; align-items:flex-start">' +
      '<i class="fa-solid fa-circle-info" style="margin-top:2px"></i><span>' + esc(text) + "</span></p>";
  }

  /* ---------------- Router ---------------- */
  var current = "dashboard";
  function go(page) {
    if (!pages[page]) page = "dashboard";
    current = page;
    $("view").innerHTML = pages[page]();
    $("pageTitle").textContent = titles[page][0];
    $("pageSub").textContent = titles[page][1];
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (b) {
      b.classList.toggle("active", b.dataset.page === page);
    });
    if (page === "tutor") renderChat();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- Events ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-page], [data-go], [data-tone], [data-copy], [data-download], [data-quick]");
    if (el) {
      if (el.dataset.page) return go(el.dataset.page);
      if (el.dataset.go) return go(el.dataset.go);
      if (el.dataset.tone) { tone = el.dataset.tone; return go("email"); }
      if (el.dataset.quick) return sendChat(el.dataset.quick);
      if (el.dataset.copy) {
        var t = $(el.dataset.copy).innerText.trim();
        navigator.clipboard.writeText(t).then(function () { toast("Copied to clipboard 📋"); },
          function () { toast("Copy failed"); });
        return;
      }
      if (el.dataset.download) {
        var text = $(el.dataset.download).innerText.trim();
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
        a.download = "studysync-" + current + ".txt";
        a.click();
        toast("Exported as .txt ⬇️");
        return;
      }
    }
    if (e.target.closest("#eGo")) return generateEmail();
    if (e.target.closest("#nGo")) return summariseNotes();
    if (e.target.closest("#pGo")) return generatePlan();
    if (e.target.closest("#rGo")) return generateResearch();
    if (e.target.closest("#chatSend")) return sendChat();
    if (e.target.closest("#clearChat")) { state.chat = []; save(); renderChat(); toast("Chat cleared"); return; }
    if (e.target.closest("#clearActivity")) { state.activity = []; save(); $("activityList").innerHTML = renderActivity(); toast("Activity cleared"); return; }
    if (e.target.closest("#openDisclaimer")) return $("disclaimerModal").classList.add("show");
    if (e.target.closest("#closeDisclaimer") || e.target.id === "disclaimerModal") {
      $("disclaimerModal").classList.remove("show");
      state.seenDisclaimer = true; save();
      return;
    }
    if (e.target.closest("#menuBtn")) return $("sidebar").classList.add("open"), $("scrim").classList.add("show");
    if (e.target.id === "scrim") return closeSidebar();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "chatInput") sendChat();
    if (e.key === "Escape") { $("disclaimerModal").classList.remove("show"); closeSidebar(); }
  });

  function closeSidebar() {
    $("sidebar").classList.remove("open");
    $("scrim").classList.remove("show");
  }

  /* ---------------- Boot ---------------- */
  applyTheme();
  var days = Math.max(1, Math.round((Date.now() - new Date(state.firstSeen).getTime()) / 86400000) + 1);
  $("streakDays").textContent = days + (days === 1 ? " day" : " days");
  go("dashboard");
  if (!state.seenDisclaimer) $("disclaimerModal").classList.add("show");
})();
