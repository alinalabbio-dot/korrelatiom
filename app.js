(function () {
  const modules = [
    "Наблюдение", "Причинная схема", "Научный детектив", "Третий фактор",
    "Направление стрелки", "Сигнал или причина", "Дизайн эксперимента",
    "Обновление уверенности", "Научный редактор", "Рецензент"
  ];
  const defaultState = {
    stage: 0, done: [], graphEdges: [], detective: {
      clue: 0,
      factorValues: { air: 25, crowd: 25, salt: 25, fresh: 25 },
      factorHistory: []
    },
    beta: { step: 0, values: [], current: 45 }, markerReady: false, editor: 0, expMode: "lab", finalDone: false, dossierSeen: false
  };
  const app = document.querySelector("#app");
  const nav = document.querySelector("#moduleNav");
  let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem("causalityLabState") || "{}"));
  state.detective = Object.assign({}, defaultState.detective, state.detective || {});
  state.beta = Object.assign({}, defaultState.beta, state.beta || {});

  const save = () => localStorage.setItem("causalityLabState", JSON.stringify(state));
  const el = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const toast = (message) => {
    const node = el("#toast"); node.textContent = message; node.classList.add("show");
    setTimeout(() => node.classList.remove("show"), 1700);
  };
  const feedback = (message, good = false) => {
    const node = el("#feedback");
    if (!node) return;
    node.className = `feedback ${good ? "good" : "warn"}`;
    node.innerHTML = message;
  };
  const cite = (key) => {
    const image = IMAGE_META[key];
    return `<div class="image-card"><img src="${image.file}" alt="${image.alt}"><a class="caption" href="${image.page}" target="_blank" rel="noreferrer">${image.source} · ${image.author} · ${image.license}</a></div>`;
  };
  function renderNav() {
    nav.innerHTML = modules.map((name, index) => `<li><button data-stage="${index}" class="${index === state.stage ? "active" : ""} ${state.done.includes(index) ? "done" : ""}"><span>${String(index + 1).padStart(2, "0")} · ${name}</span></button></li>`).join("");
    all("#moduleNav button").forEach((button) => button.onclick = () => {
      state.stage = Number(button.dataset.stage); save(); render();
    });
  }
  function shell(content) {
    app.innerHTML = `<section class="stage">${content}</section>`;
    el("#stageLabel").textContent = `Протокол ${String(state.stage + 1).padStart(2, "0")} / 10`;
    el("#progressFill").style.width = `${(state.stage + 1) * 10}%`;
    renderNav(); app.focus(); window.scrollTo(0, 0);
  }
  function finishStage(nextLabel = "Следующий протокол") {
    if (!state.done.includes(state.stage)) state.done.push(state.stage);
    save();
    const host = el("#feedback");
    if (host && !el("#continue")) host.insertAdjacentHTML("beforeend", `<div class="inline-action"><button id="continue" class="button button-primary">${nextLabel}</button></div>`);
    if (el("#continue")) el("#continue").onclick = () => { state.stage = Math.min(9, state.stage + 1); save(); render(); };
    renderNav();
  }
  function backButton() { return `<button class="button button-ghost" id="back">Назад</button>`; }
  function bindBack() { if (el("#back")) el("#back").onclick = () => { state.stage = Math.max(0, state.stage - 1); save(); render(); }; }
  function bindDragToBins(cardSelector = ".evidence-card", binSelector = ".bin") {
    let picked = null;
    const cards = all(cardSelector), bins = all(binSelector);
    cards.forEach((card) => {
      card.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", card.dataset.id));
      card.onclick = () => { picked = card; cards.forEach((item) => item.classList.toggle("selected", item === card)); };
    });
    bins.forEach((bin) => {
      bin.ondragover = (event) => event.preventDefault();
      bin.ondrop = (event) => { event.preventDefault(); const card = document.querySelector(`[data-id="${event.dataTransfer.getData("text/plain")}"]`); if (card) bin.append(card); };
      bin.addEventListener("click", (event) => {
        const hitCard = event.target.closest(cardSelector);
        if (picked && hitCard !== picked) {
          bin.append(picked); picked.classList.remove("selected"); picked = null;
          event.stopPropagation();
        }
      }, true);
    });
  }

  function renderObservation() {
    const cards = [
      ["d", "Размер обуви связан с результатами чтения"], ["i", "Большая стопа улучшает чтение"],
      ["i", "Возраст может влиять на оба признака"], ["d", "Обнаружена положительная корреляция"],
      ["i", "Причина уже доказана"]
    ];
    shell(`<div class="stage-kicker">Протокол 01 · Отделяем факт от версии</div><h1>Что мы вообще наблюдаем?</h1><p class="lede">Сначала зафиксируй данные. Объяснение — даже очень правдоподобное — появится только на следующем шаге.</p><div class="observation">У детей с большим размером обуви в выборке выше средний балл по чтению.</div><div id="pool" class="card-pool">${cards.map((card, index) => `<button draggable="true" class="evidence-card" data-kind="${card[0]}" data-id="obs-${index}">${card[1]}</button>`).join("")}</div><div class="lab-grid"><div class="bin" data-bin="d"><h3>Следует из данных</h3><p>Можно утверждать уже сейчас</p></div><div class="bin" data-bin="i"><h3>Пока интерпретация</h3><p>Нужны дополнительные проверки</p></div></div><div id="feedback"></div><div class="footer-actions"><span class="microcopy">Перетащи карточки или выбери карточку, затем область.</span><button id="check" class="button button-primary">Проверить разбор</button></div>`);
    bindDragToBins();
    el("#check").onclick = () => {
      const cardsNow = all(".evidence-card");
      const placed = cardsNow.filter((card) => card.parentElement.classList.contains("bin"));
      const wrong = placed.filter((card) => card.dataset.kind !== card.parentElement.dataset.bin);
      if (placed.length < cardsNow.length) feedback("Не все карточки разобраны. Фраза про возраст объясняет наблюдение, но не является самим наблюдением.");
      else if (wrong.length) feedback("Посмотри на глаголы. Данные говорят о связи. Слова «улучшает», «влияет» и «доказана» уже добавляют причинное объяснение.");
      else { feedback("Верно. Корреляция — характеристика данных. Возраст — сильная гипотеза общей причины, но её ещё нужно проверить.", true); finishStage("Построить схему"); toast("Протокол сохранён"); }
    };
  }

  function renderGraph() {
    shell(`<div class="stage-kicker">Протокол 02 · Структура важнее расположения</div><h1>Построй причинную схему</h1><p class="lede">Выбери сначала причину, затем следствие. Элементы можно соединять в любом месте поля — проверяются сами связи.</p><div class="graph-canvas" id="graphCanvas"><svg id="edgeLayer" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs></svg><button class="graph-node node-age" data-node="age">возраст<small>возможная причина</small></button><button class="graph-node node-shoe" data-node="shoe">размер обуви<small>наблюдаемый признак</small></button><button class="graph-node node-read" data-node="read">умение читать<small>наблюдаемый признак</small></button></div><div class="graph-log" id="graphLog"></div><div id="feedback"></div><div class="footer-actions">${backButton()}<div><button class="button button-ghost" id="undo">Убрать последнюю стрелку</button> <button class="button button-primary" id="check">Проверить модель</button></div></div>`);
    bindBack(); let from = null;
    const nodes = all(".graph-node");
    function edgeName(edge) { const names = { age: "возраст", shoe: "размер обуви", read: "чтение" }; return `${names[edge[0]]} → ${names[edge[1]]}`; }
    function drawEdges() {
      const canvas = el("#graphCanvas"), svg = el("#edgeLayer"), rect = canvas.getBoundingClientRect();
      svg.querySelectorAll("line").forEach((line) => line.remove());
      state.graphEdges.forEach(([start, end]) => {
        const a = document.querySelector(`[data-node="${start}"]`).getBoundingClientRect();
        const b = document.querySelector(`[data-node="${end}"]`).getBoundingClientRect();
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.left + a.width / 2 - rect.left); line.setAttribute("y1", a.top + a.height / 2 - rect.top);
        line.setAttribute("x2", b.left + b.width / 2 - rect.left); line.setAttribute("y2", b.top + b.height / 2 - rect.top);
        line.setAttribute("marker-end", "url(#arrow)"); svg.append(line);
      });
      el("#graphLog").innerHTML = state.graphEdges.length ? state.graphEdges.map((edge) => `<span>${edgeName(edge)}</span>`).join("") : "Стрелок пока нет";
    }
    nodes.forEach((node) => node.onclick = () => {
      if (!from) { from = node.dataset.node; nodes.forEach((item) => item.classList.toggle("selected", item === node)); return; }
      const edge = [from, node.dataset.node]; from = null; nodes.forEach((item) => item.classList.remove("selected"));
      if (edge[0] !== edge[1] && !state.graphEdges.some((saved) => saved.join() === edge.join())) state.graphEdges.push(edge);
      save(); drawEdges();
    });
    el("#undo").onclick = () => { state.graphEdges.pop(); save(); drawEdges(); };
    el("#check").onclick = () => {
      const actual = state.graphEdges.map((edge) => edge.join(">"));
      const exact = actual.length === 2 && actual.includes("age>shoe") && actual.includes("age>read");
      if (exact) { feedback("Возраст влияет и на рост стопы, и на развитие чтения. Это общая причина — между обувью и чтением не нужна прямая стрелка.", true); finishStage("Перейти к делу о цинге"); }
      else if (actual.includes("shoe>read")) feedback("Такая стрелка повторяет смелую интерпретацию, но не объясняет, почему оба признака меняются вместе с возрастом. Попробуй дать возрасту две исходящие стрелки.");
      else feedback("В модели нужны ровно две связи. Ищи фактор, который может влиять сразу на оба наблюдаемых признака.");
    };
    drawEdges(); window.addEventListener("resize", drawEdges, { once: true });
  }

  function confidenceChart(values) {
    if (!values.length) return `<div class="empty-chart">После каждой улики здесь появится след твоей уверенности.</div>`;
    const points = values.map((value, index) => `${24 + index * 88},${112 - value}`).join(" ");
    return `<svg class="confidence-chart" viewBox="0 0 340 132" role="img" aria-label="Изменение уверенности"><line x1="18" y1="112" x2="324" y2="112"></line><line x1="18" y1="12" x2="18" y2="112"></line><polyline points="${points}"></polyline>${values.map((value, index) => `<circle cx="${24 + index * 88}" cy="${112 - value}" r="5"></circle><text x="${24 + index * 88}" y="126">${index + 1}</text>`).join("")}</svg>`;
  }
  function factorHistoryChart(history, factors) {
    if (!history.length) return `<div class="empty-chart">После каждой улики здесь появится история конкурирующих версий.</div>`;
    return `<div class="factor-history"><svg viewBox="0 0 340 132" role="img" aria-label="Изменение вероятности четырёх гипотез"><line x1="24" y1="112" x2="322" y2="112"></line><line x1="24" y1="12" x2="24" y2="112"></line>${factors.map((factor) => {
      const points = history.map((snapshot, index) => `${38 + index * 88},${112 - snapshot[factor.key]}`).join(" ");
      return `<polyline points="${points}" style="stroke:${factor.color}"></polyline>${history.map((snapshot, index) => `<circle cx="${38 + index * 88}" cy="${112 - snapshot[factor.key]}" r="4" style="fill:${factor.color}"></circle>`).join("")}`;
    }).join("")}${history.map((snapshot, index) => `<text x="${38 + index * 88}" y="127">${index + 1}</text>`).join("")}</svg><div class="factor-legend">${factors.map((factor) => `<span><i style="background:${factor.color}"></i>${factor.short}</span>`).join("")}</div></div>`;
  }
  function renderDetective() {
    const clues = [
      "XVIII век. После нескольких месяцев в море у матросов появляются слабость, кровоточивость дёсен и кровоизлияния.",
      "На корабле одновременно действуют сырость, скученность, солёная пища и отсутствие свежих продуктов.",
      "Джеймс Линд распределяет больных по небольшим группам и даёт им разные средства при сходных условиях.",
      "Быстрее всего улучшается состояние группы, получавшей апельсины и лимоны. Позже установлен дефицит витамина C."
    ];
    const factors = [
      { key: "air", label: "Морской воздух и сырость", short: "воздух", color: "#72b7ff" },
      { key: "crowd", label: "Скученность и заражение", short: "скученность", color: "#ff7a66" },
      { key: "salt", label: "Солёная пища", short: "соль", color: "#d29cff" },
      { key: "fresh", label: "Отсутствие свежих продуктов", short: "рацион", color: "#c7ff62" }
    ];
    const clue = Math.min(state.detective.clue, clues.length - 1);
    const leading = factors.reduce((best, factor) => state.detective.factorValues[factor.key] > state.detective.factorValues[best.key] ? factor : best, factors[0]);
    shell(`<div class="stage-kicker">Протокол 03 · Архив 1747</div><div class="split"><div><h1>Дело о болезни дальних морей</h1><p class="lede">После каждой улики переоцени четыре версии. Ползунки не обязаны складываться в 100%: здесь ты сравниваешь силу каждой гипотезы.</p><div class="clue-stack">${clues.slice(0, clue + 1).map((text, index) => `<article class="clue ${index === clue ? "current" : ""}"><span>Улика ${index + 1}</span><p>${text}</p></article>`).join("")}</div></div>${cite("scurvy")}</div><div class="factor-panel"><div class="factor-panel-head"><div><span>Твоя оценка после улики ${clue + 1}</span><h2>Какая причина сейчас вероятнее?</h2></div><div class="leading-hypothesis">Ведущая версия <b id="leadingFactor">${leading.label}</b></div></div><div class="factor-sliders">${factors.map((factor) => `<label class="factor-slider" style="--factor-color:${factor.color}"><span>${factor.label}</span><output id="factor-${factor.key}-value">${state.detective.factorValues[factor.key]}%</output><input data-factor="${factor.key}" type="range" min="0" max="100" value="${state.detective.factorValues[factor.key]}" aria-label="${factor.label}"></label>`).join("")}</div></div><div class="chart-wrap wide-chart">${factorHistoryChart(state.detective.factorHistory, factors)}</div><div id="feedback"></div><div class="footer-actions">${backButton()}<button class="button button-primary" id="nextClue">${clue < clues.length - 1 ? "Зафиксировать оценки и открыть улику" : "Завершить расследование"}</button></div>`);
    bindBack();
    all("[data-factor]").forEach((input) => input.oninput = (event) => {
      state.detective.factorValues[event.target.dataset.factor] = Number(event.target.value);
      el(`#factor-${event.target.dataset.factor}-value`).textContent = `${event.target.value}%`;
      const currentLeader = factors.reduce((best, factor) => state.detective.factorValues[factor.key] > state.detective.factorValues[best.key] ? factor : best, factors[0]);
      el("#leadingFactor").textContent = currentLeader.label;
      save();
    });
    el("#nextClue").onclick = () => {
      state.detective.factorHistory[clue] = { ...state.detective.factorValues };
      if (clue < clues.length - 1) { state.detective.clue++; save(); renderDetective(); }
      else {
        const otherMaximum = Math.max(state.detective.factorValues.air, state.detective.factorValues.crowd, state.detective.factorValues.salt);
        if (state.detective.factorValues.fresh <= otherMaximum) {
          feedback("Последняя улика сильнее всего поддерживает версию о питании. Сделай «отсутствие свежих продуктов» наиболее вероятной причиной и проверь ещё раз.");
          return;
        }
        save();
        feedback("Эксперимент по сравнению двух групп подтвердил гипотезу. «Море» было пакетом факторов; конкретный рацион с цитрусовыми помог найти причину в питании", true);
        finishStage("Разобрать третий фактор");
      }
    };
  }

  function renderThirdFactor() {
    const cards = [
      ["common", "Возраст", "Обувь ↔ чтение", "Может влиять и на размер обуви, и на развитие чтения"],
      ["common", "Тёплый влажный климат", "Болота ↔ малярия", "Может способствовать образованию болот и одновременно повышать риск передачи малярии"],
      ["mediator", "Комары Anopheles", "Болота ↔ малярия", "Могут размножаться возле болот и передавать Plasmodium"]
    ];
    shell(`<div class="stage-kicker">Протокол 04 · Роль третьего фактора</div><h1>Общий фактор или часть причинной связи?</h1><p class="lede">Для каждой наблюдаемой связи определи роль третьего фактора: он просто влияет на оба признака или находится внутри причинной цепочки? Перетащи каждую карточку в подходящую зону.</p><div id="pool" class="card-pool factor-pool">${cards.map((card, index) => `<button draggable="true" class="evidence-card factor-card" data-kind="${card[0]}" data-id="factor-${index}"><em>${card[2]}</em><b>${card[1]}</b><small>${card[3]}</small></button>`).join("")}</div><div class="lab-grid"><div class="bin diagram-bin" data-bin="common"><h3>Общий фактор</h3><p>Влияет на оба наблюдаемых признака, но не находится между ними.</p></div><div class="bin diagram-bin" data-bin="mediator"><h3>Часть причинной связи</h3><p>Передаёт влияние от предполагаемой причины к результату.</p></div></div><div class="case-note"><img src="${IMAGE_META.malaria.file}" alt="${IMAGE_META.malaria.alt}"><p><b>Обрати внимание.</b> В одной истории могут одновременно существовать и общие факторы, и звенья механизма. Их роль определяется положением в причинной схеме.</p><a href="${IMAGE_META.malaria.page}" target="_blank" rel="noreferrer">${IMAGE_META.malaria.source} · ${IMAGE_META.malaria.author} · ${IMAGE_META.malaria.license}</a></div><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="check" class="button button-primary">Проверить роли</button></div>`);
    bindBack(); bindDragToBins(".factor-card", ".diagram-bin");
    el("#check").onclick = () => {
      const cardsNow = all(".factor-card");
      if (cardsNow.some((card) => !card.parentElement.classList.contains("diagram-bin"))) feedback("Размести все три фактора. Смотри не на название объекта, а на то, где он находится относительно двух наблюдаемых признаков.");
      else if (cardsNow.some((card) => card.dataset.kind !== card.parentElement.dataset.bin)) feedback("Проверь определение каждой зоны. Общий фактор действует сразу на оба признака; часть причинной связи находится между предполагаемой причиной и результатом.");
      else { feedback("Верно. Возраст — общий фактор для обуви и чтения. В истории малярии климат может быть общим фактором, а комары находятся внутри причинной цепочки передачи.", true); finishStage("Проверить направление"); }
    };
  }

  function renderTimeline() {
    const events = [
      ["measure", "Измерение физической активности"], ["disease", "Появление хронического заболевания"],
      ["exam", "Обследование и включение в выборку"], ["activity", "Снижение активности из-за симптомов"]
    ];
    shell(`<div class="stage-kicker">Протокол 05 · Время задаёт направление</div><h1>Куда идёт стрелка?</h1><div class="observation">У людей с тяжёлыми хроническими заболеваниями в выборке ниже физическая активность.</div><p class="lede">Расположи события по времени: перетаскивай строки за номер.</p><ol class="timeline" id="timeline">${events.map((event) => `<li draggable="true" data-key="${event[0]}"><span>⋮⋮</span>${event[1]}</li>`).join("")}</ol><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="check" class="button button-primary">Проверить хронологию</button></div>`);
    bindBack(); let dragged = null;
    all("#timeline li").forEach((item) => {
      item.ondragstart = () => dragged = item;
      item.ondragover = (event) => event.preventDefault();
      item.ondrop = (event) => { event.preventDefault(); if (dragged && dragged !== item) el("#timeline").insertBefore(dragged, item); };
    });
    el("#check").onclick = () => {
      const order = all("#timeline li").map((item) => item.dataset.key).join(",");
      if (order !== "disease,activity,measure,exam") feedback("Начни с того, что могло произойти до измерения. Симптомы болезни способны изменить поведение ещё до обследования.");
      else {
        feedback(`<b>Возможна обратная причинность:</b> болезнь могла снизить активность. Можно ли по этим данным утверждать, что низкая активность вызвала болезнь?<div class="choice-row"><button data-answer="no">Нет, направление не установлено</button><button data-answer="yes">Да, связь это доказывает</button></div>`, true);
        all("[data-answer]").forEach((button) => button.onclick = () => {
          if (button.dataset.answer === "no") { feedback("Верно. Временной порядок — минимальное условие причинного вывода: причина должна предшествовать следствию.", true); finishStage("Отличить маркер от механизма"); }
          else toast("Связь не показывает, что было раньше");
        });
      }
    };
  }

  function renderMarker() {
    const dots = [[20,90],[42,82],[63,78],[82,66],[101,70],[123,55],[142,48],[166,40],[190,32],[215,25]];
    if (!state.markerReady) {
      shell(`<div class="stage-kicker">Протокол 06 · Сначала познакомимся с показателем</div><h1>Что такое CRP?</h1><div class="crp-definition"><b>CRP</b> — сокращённое название C-реактивного белка. Его уровень можно измерить с помощью анализа крови.</div><div class="intro-steps"><article><span>01</span><h2>В организме начинается воспаление</h2><p>Например, из-за инфекции или повреждения тканей.</p></article><article><span>02</span><h2>Уровень CRP часто повышается</h2><p>Поэтому врачи используют его как сигнал: в организме что-то происходит.</p></article><article><span>03</span><h2>Но сигнал — ещё не причина</h2><p>Высокий CRP не говорит сам по себе, что именно вызвало проблему.</p></article></div><div class="intro-question"><span>Наблюдение учёных</span><p>У людей с высоким CRP чаще бывают инфаркты, инсульты и другие проблемы с сердцем и сосудами.</p><b>CRP сам помогает вызвать эти проблемы или только сообщает о других процессах в организме?</b></div><div class="footer-actions">${backButton()}<button id="showMarkerData" class="button button-primary">Посмотреть данные</button></div>`);
      bindBack();
      el("#showMarkerData").onclick = () => { state.markerReady = true; save(); renderMarker(); };
      return;
    }
    shell(`<div class="stage-kicker">Протокол 06 · Связь ещё не доказывает причину</div><div class="heading-with-action"><h1>Сигнал или причина?</h1><button id="showMarkerIntro" class="quiet-button">Напомнить, что такое CRP</button></div><div class="two-up"><div><div class="observation">У людей с более высоким уровнем CRP чаще возникают проблемы с сердцем и сосудами.</div><p class="lede">Представим, что CRP сам является важной причиной. Что тогда должно произойти, если снизить только CRP, не меняя ничего другого?</p><div class="prediction-list"><button data-prediction="cause">Проблем с сердцем и сосудами должно стать меньше</button><button data-prediction="marker">CRP может снизиться, а риск — остаться прежним</button><button data-prediction="unknown">По одной обнаруженной связи ничего предсказать нельзя</button></div></div><div class="scatter-card"><svg viewBox="0 0 250 130" role="img" aria-label="Схематичный график связи уровня CRP и частоты проблем с сердцем и сосудами"><line x1="20" y1="110" x2="235" y2="110"></line><line x1="20" y1="10" x2="20" y2="110"></line><path d="M24 98 L225 18"></path>${dots.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="4"></circle>`).join("")}</svg><span>уровень CRP →</span><b>проблемы чаще ↑</b></div></div><div id="feedback"></div><div id="alarmDiagram"></div><div class="footer-actions">${backButton()}</div>`);
    bindBack();
    el("#showMarkerIntro").onclick = () => { state.markerReady = false; save(); renderMarker(); };
    all("[data-prediction]").forEach((button) => button.onclick = () => {
      if (button.dataset.prediction !== "cause") { feedback("Сейчас мы не решаем, что верно на самом деле. Мы проверяем предположение «CRP — причина». Если оно верно, снижение CRP должно уменьшить риск."); return; }
      feedback("Именно. Предположение о причине должно предсказывать результат вмешательства. Если CRP снизился, а риск не изменился, CRP, вероятно, был сигналом, а не главной причиной.", true);
      el("#alarmDiagram").innerHTML = `<div class="mechanism-diagram"><div><span>01</span><b>Пожар</b></div><i>→</i><div><span>02</span><b>Дым</b></div><i>→</i><div><span>03</span><b>Сигнализация</b></div></div><p class="analogy">Сигнализация хорошо предсказывает пожар. Но отключить сигнализацию — не значит потушить огонь.</p>`;
      finishStage("Собрать эксперимент");
    });
  }

  function renderExperiment() {
    const labTools = [
      ["control", "Контрольная группа", true], ["experimental", "Экспериментальная группа", true],
      ["random", "Случайное распределение", true], ["same", "Одинаковые условия", true],
      ["only", "Изменить только фактор X", true], ["before", "Измерить до", true],
      ["after", "Измерить после", true], ["blind", "Ослепление", false], ["large", "Увеличить выборку", false],
      ["three", "Изменить три фактора", false], ["opinion", "Спросить мнение", false], ["selected", "Взять только клетки с нужным результатом", false]
    ];
    const smokeTools = [
      ["prospective", "Проспективные наблюдения", true], ["dose", "Риск–экспозиция", true],
      ["time", "Экспозиция раньше болезни", true], ["mechanism", "Биологический механизм", true],
      ["quit", "Снижение риска после отказа", true], ["force", "Заставить людей курить", false],
      ["single", "Один яркий случай", false], ["headline", "Опрос читателей", false]
    ];
    const tools = state.expMode === "lab" ? labTools : smokeTools;
    shell(`<div class="stage-kicker">Протокол 07 · Доказательства проектируют</div><h1>Собери исследование</h1><div class="segmented"><button data-mode="lab" class="${state.expMode === "lab" ? "active" : ""}">Культура клеток</button><button data-mode="smoke" class="${state.expMode === "smoke" ? "active" : ""}">Курение и рак</button></div><div class="experiment-brief"><span>${state.expMode === "lab" ? "Лабораторный кейс" : "Эпидемиологический кейс"}</span><h2>${state.expMode === "lab" ? "Вещество X связано с ускоренным ростом культуры клеток" : "Курение связано с раком лёгкого"}</h2><p>${state.expMode === "lab" ? "Собери контролируемый эксперимент. Нужны все базовые элементы, дополнительные улучшения допустимы." : "Рандомно заставлять людей курить нельзя. Собери независимый пакет причинных свидетельств."}</p></div><div id="toolPool" class="tool-pool">${tools.map((tool) => `<button draggable="true" class="tool-card" data-id="tool-${tool[0]}" data-good="${tool[2]}">${tool[1]}</button>`).join("")}</div><div class="experiment-bench bin" id="bench"><h3>Протокол исследования</h3><p>Перетащи сюда подходящие инструменты</p></div><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="check" class="button button-primary">Проверить дизайн</button></div>`);
    bindBack();
    all("[data-mode]").forEach((button) => button.onclick = () => { state.expMode = button.dataset.mode; save(); renderExperiment(); });
    bindDragToBins(".tool-card", "#bench");
    el("#check").onclick = () => {
      const selected = all("#bench .tool-card"); const bad = selected.filter((item) => item.dataset.good === "false");
      const required = state.expMode === "lab" ? 7 : 5;
      const goodCount = selected.filter((item) => item.dataset.good === "true").length;
      if (bad.length) feedback(`Убери сомнительный элемент: «${bad[0].textContent}». Он создаёт смещение или смешивает несколько причин.`);
      else if (goodCount < required) feedback(state.expMode === "lab" ? "Пока не хватает базовых опор: сравнимых групп, случайного распределения, одного изменения и измерений до/после." : "Для причинного вывода нужен целый сходящийся пакет: время, доза, механизм, проспективность и изменение после отказа.");
      else { feedback(state.expMode === "lab" ? "Хороший дизайн: различие между группами можно связать с одним изменённым фактором. Ослепление и больший объём выборки ещё усилили бы результат." : "Верно. RCT — не единственный путь к причинности. Когда эксперимент неэтичен, уверенность создаёт согласованность разных линий доказательств.", true); finishStage("Обновить уверенность"); }
    };
  }

  function renderBeta() {
    const evidence = [
      ["Наблюдение", "У людей с высоким потреблением овощей риск рака лёгкого ниже."],
      ["Механизм", "Антиоксидантная гипотеза биологически правдоподобна."],
      ["Проверка", "Начинается рандомизированное исследование добавки β-каротина."],
      ["Результат", "Ожидаемой защиты нет; в некоторых испытаниях риск у курильщиков вырос."]
    ];
    const step = Math.min(state.beta.step, evidence.length - 1);
    shell(`<div class="stage-kicker">Протокол 08 · Байесовский характер науки</div><h1>Обнови свою уверенность</h1><div class="hypothesis-banner">Гипотеза: «β-каротин защищает курильщиков от рака лёгкого»</div><div class="evidence-sequence">${evidence.slice(0, step + 1).map((item, index) => `<article class="evidence-step ${index === step ? "current" : ""}"><span>${item[0]}</span><p>${item[1]}</p></article>`).join("")}</div><div class="confidence-panel"><div><label for="betaRange">Насколько ты уверен сейчас?</label><strong id="betaValue">${state.beta.current}%</strong></div><input id="betaRange" type="range" min="0" max="100" value="${state.beta.current}"><div class="range-labels"><span>0 · совсем не уверен</span><span>100 · почти уверен</span></div></div><div class="chart-wrap">${confidenceChart(state.beta.values)}</div><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="commitBeta" class="button button-primary">${step < evidence.length - 1 ? "Зафиксировать и открыть данные" : "Завершить обновление"}</button></div>`);
    bindBack();
    el("#betaRange").oninput = (event) => { state.beta.current = Number(event.target.value); el("#betaValue").textContent = `${event.target.value}%`; };
    el("#commitBeta").onclick = () => {
      const value = Number(el("#betaRange").value); const previous = state.beta.values[state.beta.values.length - 1] ?? 45;
      if (step === 3 && value >= previous) { feedback("Новые интервенционные данные противоречат защите. Разумное обновление должно снизить уверенность — точная цифра не важна."); return; }
      if (step === 0 && value < 45) { feedback("Первое наблюдение поддерживает гипотезу, хотя и слабо. Уверенность логично немного увеличить, не доводя до 100."); return; }
      state.beta.values[step] = value; state.beta.current = value;
      if (step < evidence.length - 1) { state.beta.step++; save(); renderBeta(); }
      else { save(); feedback("Хорошее обновление: гипотеза должна уступать новым данным. Овощи — пакет факторов; добавка одного вещества не воспроизвела наблюдаемую связь.", true); finishStage("Перейти в редакцию"); }
    };
  }

  function renderEditor() {
    const tasks = [
      { head: "Пятёрки делают людей богатыми!", subject: "Высокие школьные оценки", verbs: ["вызывают", "связаны с", "доказывают"], objects: ["богатство вообще", "некоторые последующие образовательные и профессиональные результаты"], answer: [1,1], note: "Наблюдательные данные и сложная причинная сеть требуют языка ассоциации." },
      { head: "Токсоплазма управляет человеком", subject: "Инфицирование T. gondii", verbs: ["управляет", "связано с", "доказывает"], objects: ["отдельными различиями поведения в некоторых исследованиях", "любыми решениями человека"], answer: [1,0], note: "Ассоциации у людей не доказывают причинное управление поведением." },
      { head: "Высокий CRP вызывает инфаркт", subject: "Высокий CRP", verbs: ["вызывает", "может предсказывать", "предотвращает"], objects: ["повышенный сердечно-сосудистый риск", "все болезни сердца"], answer: [1,0], note: "Сильный маркер может помогать прогнозу, не будучи причинной мишенью." },
      { head: "Жизнь возле болота вызывает малярию", subject: "Жизнь возле болотистой местности", verbs: ["магически вызывает", "может повышать", "исключает"], objects: ["риск малярии через большее число переносчиков", "любую лихорадку"], answer: [1,0], note: "Сильнее всего формулировка, которая сохраняет механизм через переносчика." },
      { head: "H. pylori лишь связана с язвой", subject: "Инфекция H. pylori", verbs: ["является одной из причин", "случайно совпадает с", "предсказывает без механизма"], objects: ["значительной доли язвенной болезни", "всех болей в животе"], answer: [0,0], note: "Здесь допустим причинный язык: есть механизм, воспроизводимость и эффект лечения инфекции." }
    ];
    const task = tasks[state.editor % tasks.length];
    shell(`<div class="stage-kicker">Протокол 09 · Точность без потери смысла</div><h1>Научный редактор</h1><div class="headline"><span>Черновик заголовка</span>«${task.head}»</div><div class="sentence-builder"><span>${task.subject}</span><select id="verb" aria-label="Выбрать глагол">${task.verbs.map((verb, index) => `<option value="${index}">${verb}</option>`).join("")}</select><select id="object" aria-label="Выбрать продолжение">${task.objects.map((object, index) => `<option value="${index}">${object}</option>`).join("")}</select></div><div class="editor-progress">Карточка ${state.editor + 1} из ${tasks.length}</div><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="check" class="button button-primary">Отправить редактору</button></div>`);
    bindBack();
    el("#check").onclick = () => {
      const correct = Number(el("#verb").value) === task.answer[0] && Number(el("#object").value) === task.answer[1];
      if (!correct) feedback("Фраза либо сильнее данных, либо слишком расплывчата. Выбери максимально сильную формулировку, которую действительно выдерживают доказательства.");
      else if (state.editor < tasks.length - 1) { feedback(`${task.note}<div class="inline-action"><button class="button button-primary" id="nextEdit">Следующий заголовок</button></div>`, true); el("#nextEdit").onclick = () => { state.editor++; save(); renderEditor(); }; }
      else { feedback(`${task.note} Ты не просто «ослаблял» заголовки: сила языка менялась вместе с силой данных.`, true); finishStage("Стать рецензентом"); }
    };
  }

  function renderReviewer() {
    if (state.finalDone) return renderProfile();
    shell(`<div class="stage-kicker">Финальное дело · Рецензия рукописи</div><h1>Сон делает оценки выше?</h1><div class="paper"><div class="paper-meta">Вымышленный отчёт · наблюдательное исследование · n = 800</div><p class="paper-line" data-line="sample">Исследователи наблюдали 800 школьников в возрасте 13–16 лет.</p><p class="paper-line" data-line="fact">У подростков, спавших не менее 8 часов, средний школьный балл был выше.</p><p class="paper-line" data-line="claim">Следовательно, увеличение сна обязательно повысит успеваемость каждого школьника.</p></div><div class="review-steps"><section><span>01</span><div><h2>Выдели факт наблюдения</h2><p>Нажми на предложение, которое непосредственно сообщает результат сравнения.</p></div></section><section><span>02</span><div><h2>Добавь возможные скрытые факторы</h2><div class="chip-bank">${["состояние здоровья","учебная нагрузка","режим семьи","использование телефона","уровень стресса"].map((item) => `<button class="review-chip">${item}</button>`).join("")}</div></div></section><section><span>03</span><div><h2>Укажи обратное направление</h2><div class="choice-row"><button data-reverse="yes">Трудности в учёбе могут нарушать сон</button><button data-reverse="no">Обратное направление невозможно</button></div></div></section><section><span>04</span><div><h2>Запроси дополнительные данные</h2><div class="choice-row"><button class="extra-data">Повторные измерения во времени</button><button class="extra-data">Данные о стрессе и режиме</button><button class="bad-data">Больше громких заголовков</button></div></div></section><section><span>05</span><div><h2>Собери финальную фразу</h2><select id="finalSentence"><option value="0">Сон доказанно повышает оценки каждого подростка.</option><option value="1">В этой выборке продолжительность сна была связана с успеваемостью; дизайн не устанавливает направление причинной связи.</option><option value="2">Между сном и оценками нет никакой связи.</option></select></div></section></div><div id="feedback"></div><div class="footer-actions">${backButton()}<button id="review" class="button button-primary">Завершить рецензию</button></div>`);
    bindBack(); const review = { fact:false, chips:0, reverse:false, data:0 };
    all(".paper-line").forEach((line) => line.onclick = () => { all(".paper-line").forEach((item) => item.classList.remove("selected-line")); line.classList.add("selected-line"); review.fact = line.dataset.line === "fact"; });
    all(".review-chip").forEach((chip) => chip.onclick = () => { chip.classList.toggle("selected"); review.chips = all(".review-chip.selected").length; });
    all("[data-reverse]").forEach((button) => button.onclick = () => { all("[data-reverse]").forEach((item) => item.classList.remove("selected")); button.classList.add("selected"); review.reverse = button.dataset.reverse === "yes"; });
    all(".extra-data").forEach((button) => button.onclick = () => { button.classList.toggle("selected"); review.data = all(".extra-data.selected").length; });
    el(".bad-data").onclick = () => toast("Заголовки не уменьшают неопределённость");
    el("#review").onclick = () => {
      if (!review.fact) return feedback("Факт наблюдения — не описание выборки и не причинный вывод. Найди предложение со сравнением двух групп.");
      if (review.chips < 3) return feedback("Добавь хотя бы три правдоподобных скрытых фактора. Хорошая рецензия ищет несколько альтернативных объяснений.");
      if (!review.reverse) return feedback("Проверь, может ли школьная ситуация сама влиять на сон — это возможная обратная причинность.");
      if (review.data < 2) return feedback("Нужны данные, которые уточняют время и альтернативные объяснения. Выбери оба содержательных запроса.");
      if (el("#finalSentence").value !== "1") return feedback("Финальная фраза должна сохранить найденную связь и одновременно обозначить ограничение дизайна.");
      state.finalDone = true; if (!state.done.includes(9)) state.done.push(9); save(); renderProfile();
    };
  }

  function renderProfile() {
    const skills = [
      ["Распознавание корреляции", 92], ["Поиск альтернативных объяснений", 86],
      ["Понимание причинных схем", 88], ["Оценка силы доказательств", 84],
      ["Проектирование исследования", 81], ["Научные формулировки", 90]
    ];
    const dossierCards = Object.values(CAUSAL_CASES).map((item, index) => `<article class="dossier-card"><div class="dossier-card-head"><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${item.title}</h3><b>${item.status}</b></div></div><dl><div><dt>Наблюдаемая связь</dt><dd>${item.relation}</dd></div><div><dt>Проверенные гипотезы</dt><dd><ul>${item.hypotheses.map((hypothesis) => `<li>${hypothesis}</li>`).join("")}</ul></dd></div><div><dt>Лучшая схема по имеющимся данным</dt><dd class="causal-model">${item.model}</dd></div></dl></article>`).join("");
    shell(`<div class="stage-kicker">Досье закрыто · Профиль навыков</div><h1>Ты изменил не ответы — ты изменил вопросы.</h1><p class="lede">Теперь вместо «связаны ли признаки?» можно спрашивать: что было раньше, есть ли общая причина, как устроен механизм и что произойдёт при вмешательстве.</p><div class="skill-profile">${skills.map(([name, value]) => `<div><span>${name}</span><div><i style="width:${value}%"></i></div><b>${value}</b></div>`).join("")}</div><div class="case-atlas"><div class="atlas-heading"><div><h2>Карта разобранных историй</h2><p>Все наблюдения, гипотезы и причинные схемы собраны в итоговом досье.</p></div><button class="button button-primary" id="openDossier">Открыть итоговое досье</button></div><div>${Object.values(CAUSAL_CASES).map((item) => `<article><span>${item.title}</span><b>${item.lesson}</b></article>`).join("")}</div></div><div class="source-register"><h2>Реестр изображений</h2>${Object.values(IMAGE_META).map((image) => `<a href="${image.page}" target="_blank" rel="noreferrer"><span>${image.alt}</span><small>${image.source} · ${image.author} · ${image.license}</small></a>`).join("")}</div><div class="footer-actions"><button class="button button-ghost" id="restart">Начать заново</button><button class="button button-primary" id="first">Вернуться к первому протоколу</button></div><dialog id="finalDossier" class="dossier-dialog"><div class="dossier-window"><header><div><span>Итоговый архив · 12 дел</span><h2>Гипотезы и причинные связи</h2><p>Связь — это начало расследования. Сила вывода зависит от того, какие объяснения выдержали новые данные и вмешательства.</p></div><button id="closeDossier" class="dialog-close" aria-label="Закрыть итоговое досье">×</button></header><div class="dossier-legend"><span><i class="legend-relation"></i>Что заметили</span><span><i class="legend-hypothesis"></i>Что предполагали</span><span><i class="legend-model"></i>К какой схеме пришли</span></div><div class="dossier-grid">${dossierCards}</div><footer><button id="closeDossierBottom" class="button button-primary">Закрыть досье</button></footer></div></dialog>`);
    const dossier = el("#finalDossier");
    const openDossier = () => { if (!dossier.open) dossier.showModal(); };
    const closeDossier = () => dossier.close();
    el("#openDossier").onclick = openDossier;
    el("#closeDossier").onclick = closeDossier;
    el("#closeDossierBottom").onclick = closeDossier;
    dossier.onclick = (event) => { if (event.target === dossier) closeDossier(); };
    el("#first").onclick = () => { state.stage = 0; save(); render(); };
    el("#restart").onclick = () => { if (confirm("Сбросить все решения и пройти расследование заново?")) { state = JSON.parse(JSON.stringify(defaultState)); save(); render(); } };
    if (!state.dossierSeen) { state.dossierSeen = true; save(); requestAnimationFrame(openDossier); }
  }

  function render() {
    const screens = [renderObservation, renderGraph, renderDetective, renderThirdFactor, renderTimeline, renderMarker, renderExperiment, renderBeta, renderEditor, renderReviewer];
    screens[state.stage]();
  }
  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const tools = [
      {
        name: "read_training_progress",
        title: "Прочитать прогресс тренажёра",
        description: "Возвращает текущий протокол и список завершённых протоколов без изменения данных.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() { return { currentProtocol: state.stage + 1, currentTitle: modules[state.stage], completedProtocols: state.done.map((index) => index + 1) }; }
      },
      {
        name: "navigate_to_protocol",
        title: "Открыть протокол",
        description: "Открывает один из десяти экранов тренажёра и сохраняет выбранный экран как текущий.",
        inputSchema: { type: "object", properties: { protocol: { type: "integer", minimum: 1, maximum: 10 } }, required: ["protocol"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || !Number.isInteger(input.protocol) || input.protocol < 1 || input.protocol > 10) throw new Error("protocol must be an integer from 1 to 10");
          state.stage = input.protocol - 1; save(); render();
          return { currentProtocol: input.protocol, currentTitle: modules[state.stage] };
        }
      }
    ];
    tools.forEach((tool) => { try { void Promise.resolve(context.registerTool(tool)).catch((error) => console.warn("WebMCP registration failed", error)); } catch (error) { console.warn("WebMCP registration failed", error); } });
  }
  el("#resetButton").onclick = () => {
    if (confirm("Сбросить весь сохранённый прогресс?")) { state = JSON.parse(JSON.stringify(defaultState)); save(); render(); }
  };
  render();
  registerWebMcp();
})();
