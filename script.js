(function() {
  "use strict";

  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  var moodOpeners = {
    "": "",
    "fired up": "That energy? We're spending ALL of it today. ",
    "okay-ish": "An okay-ish day is still a showing-up day. ",
    "running on caffeine": "Hydrate too, caffeine gremlin. Water is free. ",
    "doomscrolling": "Hey. Close the other tab. Just us now. ",
    "main character": "Main character behaviour — let's write your next scene. "
  };

  var subtexts = {
    "": ["Let's make today productive — without the burnout.", "Your academic chaos, lovingly organised.", "The to-do list is scared of you. Good."],
    "fired up": ["Channel it. One task at a time.", "Let's burn through that list (metaphorically)."],
    "okay-ish": ["Slow is fine. Stopped is not.", "Gentle progress still counts. It all counts."],
    "running on caffeine": ["Ride the wave — but drink some water, yeah?", "Coffee first, conquering second."],
    "doomscrolling": ["One thing. Just do one thing. I'll wait.", "The algorithm can survive without you for an hour."],
    "main character": ["Every protagonist has a montage. This is yours.", "Scene one: you, winning."]
  };

  var peps = [
    "Small steps, {n}. Future-you is already grateful.",
    "You've done more than your brain is giving you credit for.",
    "Done > perfect. Ship the draft.",
    "One boring task today = one less panic later.",
    "Nobody remembers the email. Everybody remembers you showed up.",
    "Hydrate. Stretch. Then one more block.",
    "You're not behind. You're mid-story.",
    "The assignment is huge. The next step is small. Do the small one."
  ];

  var toastLines = {
    email: ["Email drafted — give it one human read before sending.", "Draft's ready. Your voice, polished.", "Done. Now make it sound like YOU before it goes out."],
    notes: ["Notes wrangled — but check those dates yourself!", "Summary's in. The deadlines are your job to verify.", "Tamed the wall of text. You legend."],
    plan: ["There's your day. Now defend it from distractions.", "Planned! The plan bends — sleep doesn't."],
    research: ["Framework's up. Now go hunt the real sources.", "You have a map. The treasure (sources) is unmined."],
    copy: ["Copied", "In your clipboard.", "Stolen... I mean, copied."],
    export: ["Saved as a txt. How retro.", "Downloaded. It's yours now."],
    mood: ["Vibe noted", "Got it. Adjusting expectations accordingly.", "Logged. Zero judgment here."],
    clear: ["Swept. Fresh page.", "Clean slate.", "Gone. Like it never happened."]
  };

  var lastLines = {};
  function fresh(kind) {
    var arr = toastLines[kind] || ["nice."];
    var options = arr.filter(function (a) { return a !== lastLines[kind]; });
    var chosen = pick(options.length ? options : arr);
    lastLines[kind] = chosen;
    return chosen;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function confetti() {
    var symbols = ["✦", "◈", "◆", "⬤", "✦", "◈"];
    for (var i = 0; i < 16; i++) {
      var c = document.createElement("span");
      c.className = "confetti";
      c.textContent = pick(symbols);
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      c.style.fontSize = 12 + Math.random() * 16 + "px";
      document.body.appendChild(c);
      setTimeout(function (el) { el.remove(); }.bind(null, c), 3400);
    }
  }

  var STORE = "studysync.v2p";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { saved = {}; }

  var userName = saved.name || "";
  var mood = saved.mood || "";
  var emailTone = "formal";
  var currentFeature = "dashboard";
  var stats = Object.assign({ total: 0, time: 0, emails: 0, tasks: 0, meetings: 0, research: 0 }, saved.stats || {});
  var activities = saved.activities || [];
  var lastPep = saved.lastPep || "";
  var seenDisclaimer = !!saved.seenDisclaimer;
  var firstSeen = saved.firstSeen || new Date().toDateString();

  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        name: userName, mood: mood, stats: stats, activities: activities,
        lastPep: lastPep, seenDisclaimer: seenDisclaimer, firstSeen: firstSeen
      }));
    } catch (e) {}
  }

  function first() { return (userName || "friend").split(" ")[0]; }

  function timeOfDay() {
    var h = new Date().getHours();
    if (h < 5) return "night owl hours";
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    if (h < 21) return "evening";
    return "night owl hours";
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }
  window.showToast = showToast;

  function updateGreeting() {
    var tod = timeOfDay();
    var opener = moodOpeners[mood] || "";
    var line;
    if (tod === "night owl hours") {
      line = pick(["Up late, {n}? Let's make it count.", "{n}, it's officially night-owl hours. One solid block, then bed. Deal?"]);
    } else {
      line = pick(["Good {tod}, {n}. Let's get this work done.", "Good {tod}! The deadlines aren't going to fight themselves.", "{tod} already, {n}? Time flies when you're avoiding tasks. Not today."]);
    }
    document.getElementById('greetingMessage').innerHTML = esc(opener) + esc(line).replace("{n}", '<span class="highlight">' + esc(first()) + '</span>').replace("{tod}", tod);
    var subs = subtexts[mood] || subtexts[""];
    document.getElementById('greetingSubtext').textContent = pick(subs);
  }

  function updateProfileUI() {
    var initial = first().charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = userName || "friend";
    document.getElementById('sidebarMood').textContent = mood ? "vibes: " + mood : "vibes: unreported";
    document.getElementById('sidebarAvatar').textContent = initial;
    document.getElementById('headerAvatar').textContent = initial;
    document.getElementById('brandTag').textContent = userName ? first() + "'s study wingman" : "your study wingman";
    document.querySelectorAll('#moodRow button').forEach(function (b) {
      b.classList.toggle('picked', b.dataset.mood === mood);
    });
  }

  function addActivity(text, type) {
    type = type || 'primary';
    var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    activities.unshift({ text: text, time: time, type: type });
    if (activities.length > 8) activities.pop();
    persist();
    renderActivities();
  }

  function renderActivities() {
    var list = document.getElementById('activityList');
    if (!list) return;
    if (!activities.length) {
      list.innerHTML = '<div style="text-align:center; color:var(--gray); padding:20px; font-size:14px;">Nothing yet — pick a tool above and make ' + esc(first()) + ' proud. (That\'s you. You\'re ' + esc(first()) + '.)</div>';
      return;
    }
    list.innerHTML = activities.map(function (a) {
      return '<div class="activity-item"><div class="dot ' + a.type + '"></div><div class="text">' + esc(a.text) + '</div><div class="time">' + a.time + '</div></div>';
    }).join('');
  }

  function updateStats(type, count) {
    count = count || 1;
    if (type === 'emails') stats.emails += count;
    else if (type === 'tasks') stats.tasks += count;
    else if (type === 'meetings') stats.meetings += count;
    else if (type === 'research') stats.research += count;
    stats.total++;
    stats.time += 5;
    persist();
    ['Total', 'Time', 'Emails', 'Tasks', 'Meetings', 'Research'].forEach(function (id) {
      var el = document.getElementById('stat' + id);
      if (!el) return;
      var key = id.toLowerCase();
      if (key === 'total') el.textContent = stats.total;
      else if (key === 'time') el.textContent = stats.time + 'm';
      else if (key === 'emails') el.textContent = stats.emails;
      else if (key === 'tasks') el.textContent = stats.tasks;
      else if (key === 'meetings') el.textContent = stats.meetings;
      else if (key === 'research') el.textContent = stats.research;
    });
  }

  function setLoading(elId, msg) {
    document.getElementById(elId).innerHTML = '<div class="loading-state"><div class="spinner"></div><p>' + esc(msg || "One sec, thinking…") + '</p></div>';
  }

  function realTalk(text) {
    return '<div class="real-talk"><i class="fas fa-circle-info"></i><span>' + text + '</span></div>';
  }

  function pep() {
    var options = peps.filter(function (p) { return p !== lastPep; });
    var chosen = pick(options.length ? options : peps);
    lastPep = chosen; persist();
    return '<p class="pep">' + esc(chosen.replace("{n}", first())) + '</p>';
  }

  function openProfileModal() {
    document.getElementById('profileModal').classList.add('show');
    var input = document.getElementById('userNameInput');
    input.value = userName;
    setTimeout(function () { input.focus(); }, 200);
  }
  window.openProfileModal = openProfileModal;

  function closeProfileModal() { document.getElementById('profileModal').classList.remove('show'); }
  window.closeProfileModal = closeProfileModal;

  function saveProfile() {
    var input = document.getElementById('userNameInput');
    var name = input.value.trim();
    if (!name) {
      input.style.borderColor = 'var(--primary)';
      input.placeholder = 'I need SOMETHING to call you!';
      setTimeout(function () {
        input.style.borderColor = 'var(--light-gray)';
        input.placeholder = 'e.g., Frank, Maria, or Alex';
      }, 2000);
      return;
    }
    var isNew = name !== userName;
    userName = name;
    persist();
    updateProfileUI();
    updateGreeting();
    closeProfileModal();
    if (isNew) {
      confetti();
      showToast("Nice to meet you, " + first());
    } else {
      showToast("Updated. Looking good, " + first() + ".");
    }
    if (currentFeature === 'chatbot') renderFeature('chatbot');
    if (currentFeature === 'dashboard') renderFeature('dashboard');
  }
  window.saveProfile = saveProfile;

  function skipProfile() {
    closeProfileModal();
    showToast("No worries — 'friend' it is");
  }
  window.skipProfile = skipProfile;

  function showDisclaimer() { document.getElementById('disclaimerModal').classList.add('show'); }
  window.showDisclaimer = showDisclaimer;

  function hideDisclaimer() {
    document.getElementById('disclaimerModal').classList.remove('show');
    seenDisclaimer = true; persist();
  }
  window.hideDisclaimer = hideDisclaimer;

  window.toggleSidebar = function () {
    document.getElementById('sidebar').classList.toggle('open');
  };

  document.querySelectorAll('#moodRow button').forEach(function (b) {
    b.addEventListener('click', function () {
      mood = b.dataset.mood;
      persist(); updateProfileUI(); updateGreeting();
      showToast(fresh('mood'));
      if (currentFeature === 'dashboard') renderFeature('dashboard');
    });
  });

  window.copyFrom = function (elId) {
    var el = document.getElementById(elId);
    if (!el) return;
    var text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(
      function () { showToast(fresh('copy')); },
      function () { showToast('Copy failed — old-school select & Ctrl+C it is'); });
  };

  window.exportCurrent = function () {
    var map = { email: 'emailOutput', meeting: 'outSummary', task: 'taskOutput', research: 'researchOutput' };
    var el = document.getElementById(map[currentFeature]);
    var content = el ? el.innerText : '';
    if (!content || content.indexOf('appear here') !== -1) { showToast('Nothing to export yet'); return; }
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'studysync-' + currentFeature + '-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast(fresh('export'));
  };

  var features = {
    dashboard: { title: 'Dashboard', icon: 'fa-th-large', desc: 'Balance classes, work & side projects' },
    email: { title: 'Smart Email Generator', icon: 'fa-envelope', desc: 'Emails to professors, employers & teams' },
    meeting: { title: 'Notes Summarizer', icon: 'fa-file-alt', desc: 'Lecture notes, group meetings & standups' },
    task: { title: 'Study & Work Planner', icon: 'fa-tasks', desc: 'Schedule classes, shifts & project time' },
    research: { title: 'Research Assistant', icon: 'fa-book-open', desc: 'Structured outlines — never fake sources' },
    chatbot: { title: 'AI Tutor', icon: 'fa-comment-dots', desc: 'Study tips, time management & career advice' }
  };

  function renderDashboard() {
    var days = Math.max(1, Math.round((Date.now() - new Date(firstSeen).getTime()) / 86400000) + 1);
    var cards = Object.keys(features).filter(function (k) { return k !== 'dashboard'; }).map(function (k) {
      var colorMap = { email: 'primary', meeting: 'secondary', task: 'accent', research: 'purple', chatbot: 'primary' };
      return '<div class="feature-card" onclick="window.renderFeature(\'' + k + '\')">' +
        '<div class="icon-bg ' + (colorMap[k] || 'primary') + '"><i class="fas ' + features[k].icon + '"></i></div>' +
        '<h3>' + features[k].title + '</h3><p>' + features[k].desc + '</p>' +
        '<button class="btn-outline">Open <i class="fas fa-arrow-right"></i></button></div>';
    }).join('');

    return '' +
      '<div class="feature-panel" style="margin-bottom:24px; background:linear-gradient(135deg, rgba(74,107,61,0.08), rgba(184,169,122,0.08));">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">' +
          '<div><h2 style="font-size:22px;">Day ' + days + ' of showing up</h2>' +
          '<p style="color:var(--gray); font-size:14px; margin-top:4px;">Nobody talks about this part — but it\'s the whole game.</p></div>' +
          '<div style="display:flex; gap:10px; flex-wrap:wrap;">' +
            '<button class="btn-secondary" onclick="window.renderFeature(\'task\')"><i class="fas fa-wand-magic-sparkles"></i> Plan my day</button>' +
            '<button class="btn-secondary" onclick="window.renderFeature(\'meeting\')"><i class="fas fa-bolt"></i> Tame my notes</button>' +
            '<button class="btn-secondary" onclick="window.renderFeature(\'chatbot\')"><i class="fas fa-graduation-cap"></i> Talk to the tutor</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="stats-grid">' +
        '<div class="stat-card"><div class="label">Things tackled</div><div class="value" id="statTotal">' + stats.total + '</div></div>' +
        '<div class="stat-card"><div class="label">Minutes saved</div><div class="value secondary" id="statTime">' + stats.time + 'm</div></div>' +
        '<div class="stat-card"><div class="label">Emails rescued</div><div class="value primary" id="statEmails">' + stats.emails + '</div></div>' +
        '<div class="stat-card"><div class="label">Days planned</div><div class="value accent" id="statTasks">' + stats.tasks + '</div></div>' +
        '<div class="stat-card"><div class="label">Notes wrangled</div><div class="value primary" id="statMeetings">' + stats.meetings + '</div></div>' +
        '<div class="stat-card"><div class="label">Research mapped</div><div class="value secondary" id="statResearch">' + stats.research + '</div></div>' +
      '</div>' +
      '<div class="feature-grid">' + cards + '</div>' +
      '<div class="activity-panel">' +
        '<div class="panel-title">What you\'ve been up to <button class="btn-secondary" style="font-size:12px; padding:6px 14px;" onclick="window.clearActivities()"><i class="fas fa-broom"></i> Sweep</button></div>' +
        '<div id="activityList"></div>' +
      '</div>' + pep();
  }

  function renderEmail() {
    return '<div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-sliders"></i> Compose</h2></div>' +
        '<p class="panel-sub">Just bullet the facts — I\'ll do the polite gymnastics.</p>' +
        '<div class="input-area">' +
          '<label>Recipient</label>' +
          '<input type="text" id="emailRecipient" value="Prof. Johnson" placeholder="e.g., Prof. Smith">' +
          '<label>Subject</label>' +
          '<input type="text" id="emailSubject" value="Assignment Extension Request" placeholder="Subject">' +
          '<label>Key points</label>' +
          '<textarea rows="4" id="emailPoints" placeholder="What do you want to say?">I have been unwell this week and could not complete the assignment. I need 3 more days to finish the coding section and documentation.</textarea>' +
          '<label>Pick your flavour</label>' +
          '<div class="action-row">' +
            '<button class="btn-secondary ' + (emailTone === 'formal' ? 'active' : '') + '" onclick="window.setEmailTone(\'formal\')">Formal</button>' +
            '<button class="btn-secondary ' + (emailTone === 'friendly' ? 'active' : '') + '" onclick="window.setEmailTone(\'friendly\')">Friendly</button>' +
            '<button class="btn-secondary ' + (emailTone === 'persuasive' ? 'active' : '') + '" onclick="window.setEmailTone(\'persuasive\')">Persuasive</button>' +
          '</div>' +
          '<button class="btn-primary" onclick="window.generateEmail()"><i class="fas fa-wand-magic-sparkles"></i> Write it for me</button>' +
        '</div>' +
      '</div>' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-envelope-open-text"></i> Your Email</h2>' +
          '<div style="display:flex; gap:8px;">' +
            '<button class="btn-secondary" onclick="window.copyFrom(\'emailOutput\')"><i class="fas fa-copy"></i></button>' +
            '<button class="btn-secondary" onclick="window.exportCurrent()"><i class="fas fa-download"></i></button>' +
          '</div></div>' +
        '<div class="output-box" id="emailOutput" contenteditable="true"><div class="empty-state"><i class="fas fa-envelope"></i><p>Your draft lands here — and stays editable.</p></div></div>' +
        realTalk("Read it out loud once before sending. If a sentence sounds like a robot wrote it — it's because one did. Fix it in your voice.") +
      '</div></div>';
  }

  function renderMeeting() {
    return '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px;">' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-pen-to-square"></i> Paste Notes</h2></div>' +
        '<p class="panel-sub">Dump it all. The messier, the better.</p>' +
        '<div class="input-area">' +
          '<label>Lecture / meeting notes</label>' +
          '<textarea rows="12" id="meetingInput" placeholder="Paste your notes here...">CS301 Lecture: Graph Algorithms\n- Covered Dijkstra and Bellman-Ford\n- Dijkstra does not work with negative weights\n- Assignment 3: implement both algorithms in Python\n- Due: 20 Sept before midnight\n- Office hours: Wed 2-4pm Room 304</textarea>' +
          '<button class="btn-primary" onclick="window.summarizeMeeting()"><i class="fas fa-wand-magic-sparkles"></i> Wrangle it</button>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<div class="meeting-outputs" id="meetingOutputs" style="display:none;">' +
          '<div class="meeting-output-card"><h4><i class="fas fa-list-check"></i> Action items</h4><ul id="outActions"></ul></div>' +
          '<div class="meeting-output-card"><h4><i class="fas fa-gavel"></i> Decisions</h4><ul id="outDecisions"></ul></div>' +
          '<div class="meeting-output-card"><h4><i class="fas fa-clock"></i> Deadlines</h4><ul id="outDeadlines"></ul></div>' +
          '<div class="meeting-output-card" style="grid-column:1/-1;"><h4><i class="fas fa-align-left"></i> Summary</h4><p id="outSummary" style="font-size:14px; line-height:1.7;"></p></div>' +
        '</div>' +
        '<div class="output-box" id="meetingPlaceholder"><div class="empty-state"><i class="fas fa-clipboard-list"></i><p>Extracted insights appear here</p></div></div>' +
        '<div class="output-actions" id="meetingActions" style="display:none;">' +
          '<button class="btn-secondary" onclick="window.copyFrom(\'outSummary\')"><i class="fas fa-copy"></i> Copy summary</button>' +
          '<button class="btn-secondary" onclick="window.exportCurrent()"><i class="fas fa-download"></i> Export</button>' +
        '</div>' +
        realTalk("I can sniff out dates, but I can't read your lecturer's mind. Cross-check every deadline on the LMS before trusting it.") +
      '</div></div>';
  }

  function renderTask() {
    return '<div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-sliders"></i> Plan</h2></div>' +
        '<p class="panel-sub">A schedule with breaks you\'re actually allowed to take.</p>' +
        '<div class="input-area">' +
          '<label>Tasks (one per line)</label>' +
          '<textarea rows="6" id="taskInput" placeholder="Enter tasks...">Complete Data Structures assignment\nWork shift 4pm-8pm\nFix landing page bug\nStudy for midterm\nEmail group about project</textarea>' +
          '<label>Timeframe</label>' +
          '<select id="taskTimeframe"><option value="daily">Daily</option><option value="weekly">Weekly</option></select>' +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">' +
            '<div><label>Start</label><input type="time" id="taskStart" value="08:00"></div>' +
            '<div><label>End</label><input type="time" id="taskEnd" value="22:00"></div>' +
          '</div>' +
          '<button class="btn-primary" onclick="window.generatePlan()"><i class="fas fa-wand-magic-sparkles"></i> Build my day</button>' +
        '</div>' +
      '</div>' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-calendar-days"></i> Schedule</h2>' +
          '<div style="display:flex; gap:8px;">' +
            '<button class="btn-secondary" onclick="window.copyFrom(\'taskOutput\')"><i class="fas fa-copy"></i></button>' +
            '<button class="btn-secondary" onclick="window.exportCurrent()"><i class="fas fa-download"></i></button>' +
          '</div></div>' +
        '<div class="output-box" id="taskOutput" contenteditable="true"><div class="empty-state"><i class="fas fa-calendar-check"></i><p>Your day, time-blocked and break-friendly, appears here.</p></div></div>' +
        realTalk("This is a starting point, not a court order. If a block overruns, steal time from another block — never from sleep.") +
      '</div></div>';
  }

  function renderResearch() {
    return '<div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-sliders"></i> Research</h2></div>' +
        '<p class="panel-sub">From blank doc to battle plan.</p>' +
        '<div class="input-area">' +
          '<label>What are you wrestling with?</label>' +
          '<textarea rows="3" id="researchInput" placeholder="Enter your topic...">Impact of remote work on student productivity and mental health</textarea>' +
          '<label>How deep?</label>' +
          '<select id="researchDepth"><option value="brief">Skimming for survival</option><option value="detailed">Going full scholar</option></select>' +
          '<label>Focus areas</label>' +
          '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
            '<label style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid var(--light-gray); border-radius:40px; font-size:13px; cursor:pointer; background:var(--white);"><input type="checkbox" class="research-focus" value="trends" checked style="accent-color:var(--primary);"> Trends</label>' +
            '<label style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid var(--light-gray); border-radius:40px; font-size:13px; cursor:pointer; background:var(--white);"><input type="checkbox" class="research-focus" value="challenges" style="accent-color:var(--primary);"> Challenges</label>' +
            '<label style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid var(--light-gray); border-radius:40px; font-size:13px; cursor:pointer; background:var(--white);"><input type="checkbox" class="research-focus" value="opportunities" checked style="accent-color:var(--primary);"> Opportunities</label>' +
            '<label style="display:flex; align-items:center; gap:6px; padding:8px 14px; border:2px solid var(--light-gray); border-radius:40px; font-size:13px; cursor:pointer; background:var(--white);"><input type="checkbox" class="research-focus" value="recommendations" checked style="accent-color:var(--primary);"> Recommendations</label>' +
          '</div>' +
          '<button class="btn-primary" onclick="window.generateResearch()"><i class="fas fa-wand-magic-sparkles"></i> Build my battle plan</button>' +
        '</div>' +
      '</div>' +
      '<div class="feature-panel">' +
        '<div class="panel-header"><h2><i class="fas fa-file-lines"></i> Report</h2>' +
          '<div style="display:flex; gap:8px;">' +
            '<button class="btn-secondary" onclick="window.copyFrom(\'researchOutput\')"><i class="fas fa-copy"></i></button>' +
            '<button class="btn-secondary" onclick="window.exportCurrent()"><i class="fas fa-download"></i></button>' +
          '</div></div>' +
        '<div class="output-box" id="researchOutput" contenteditable="true"><div class="empty-state"><i class="fas fa-magnifying-glass-chart"></i><p>Your research summary appears here</p></div></div>' +
        realTalk("I will never invent a citation. Ever. I'll tell you exactly what to search for — finding and reading the real sources is your quest.") +
      '</div></div>';
  }

  function tutorGreeting() {
    var base = "Hey " + first() + "! I'm your AI Tutor. Ask me about study tips, time management, career advice — anything student-life. I explain things; I don't write your assessments for you. That's the deal.";
    if (mood === "doomscrolling") return base + "\n\nAlso — doomscrolling vibes detected. One question at a time. We rebuild from there.";
    if (mood === "fired up") return base + "\n\nFeeling that fire? Good. Aim it at one task.";
    if (mood === "running on caffeine") return base + "\n\nCaffeine levels acknowledged. Water break in T-minus one hour.";
    return base;
  }

  function renderChatbot() {
    return '<div class="feature-panel">' +
      '<div class="panel-header"><h2><i class="fas fa-robot"></i> AI Tutor</h2>' +
        '<button class="btn-secondary" onclick="window.clearChat()"><i class="fas fa-trash-can"></i> Fresh start</button></div>' +
      '<div class="chat-container">' +
        '<div class="chat-messages" id="chatMessages">' +
          '<div class="chat-msg bot"><div class="avatar"><i class="fas fa-robot"></i></div><div class="bubble">' + esc(tutorGreeting()).replace(/\n/g, '<br>') + '</div></div>' +
        '</div>' +
        '<div class="chat-input-area">' +
          '<input type="text" id="chatInput" placeholder="Ask about exams, balance, side projects…" onkeypress="if(event.key===\'Enter\') window.sendChat()">' +
          '<button onclick="window.sendChat()"><i class="fas fa-paper-plane"></i></button>' +
        '</div>' +
        '<div class="chat-quick-actions">' +
          '<button onclick="window.quickChat(\'How do I balance work and study?\')">Work-study balance</button>' +
          '<button onclick="window.quickChat(\'Exam panic. Help.\')">Exam prep</button>' +
          '<button onclick="window.quickChat(\'Why do I keep procrastinating?\')">Procrastination</button>' +
          '<button onclick="window.quickChat(\'Side project tips\')">Side projects</button>' +
        '</div>' +
      '</div>' +
      realTalk("I give study advice, not medical/legal/financial advice — and I won't do your assessment for you. That part's yours, and it should be.") +
    '</div>';
  }

  window.setEmailTone = function (tone) {
    emailTone = tone;
    renderFeature('email');
  };

  window.generateEmail = function () {
    var recipient = (document.getElementById('emailRecipient') || {}).value || 'Professor';
    recipient = recipient.trim();
    var subject = ((document.getElementById('emailSubject') || {}).value || 'Follow-up').trim();
    var points = ((document.getElementById('emailPoints') || {}).value || 'General discussion').trim();
    setLoading('emailOutput', "Drafting something that sounds human…");
    setTimeout(function () {
      var body;
      if (emailTone === 'formal') {
        body = 'Subject: ' + subject + '\n\nDear ' + recipient + ',\n\nI hope this email finds you well.\n\nI am writing regarding ' + subject.toLowerCase() + '. ' + points + '\n\nPlease let me know if you need any further information. I would be happy to discuss this during office hours.\n\nThank you for your time.\n\nBest regards,\n' + (userName || 'Your Name');
      } else if (emailTone === 'friendly') {
        body = 'Subject: ' + subject + '\n\nHi ' + recipient + ',\n\nHope you\'re doing well!\n\nI wanted to chat about ' + subject.toLowerCase() + '. ' + points + '\n\nLet me know what you think — happy to discuss whenever you\'re free.\n\nCheers,\n' + (userName || 'Your Name');
      } else {
        body = 'Subject: ' + subject + '\n\nHey ' + recipient + ',\n\nI\'ve been thinking about ' + subject.toLowerCase() + '. ' + points + '\n\nI really believe this could be a great opportunity for us to collaborate. Let me know your thoughts!\n\nBest,\n' + (userName || 'Your Name');
      }

      var output = document.getElementById('emailOutput');
      if (output) {
        output.innerHTML = '<pre style="white-space:pre-wrap; margin:0; font-family:inherit;">' + esc(body).replace(/\n/g, '<br>') + '</pre>';
      }

      updateStats('emails');
      addActivity('Email drafted for ' + recipient, 'primary');
      showToast(fresh('email'));
    }, 500);
  };

})();