let base = 2500;
const cardsContainer = document.getElementById("cardsContainer");
const addCardBtn = document.getElementById("addCard");
const delCardBtn = document.getElementById("delCard");
const workTypeSelect = document.getElementById("workType");
const totalSumBlock = document.getElementById("totalSum");

// Загружаем сохранённые карточки
let savedCards = JSON.parse(localStorage.getItem("door_calc_cards") || "[]");

// ------------------ СОБЫТИЯ ------------------

// Добавить карточку
addCardBtn.addEventListener("click", () => {
  const type = workTypeSelect.value;
  const { card, updatePrice } = createCard({ type });
  cardsContainer.prepend(card);
  updatePrice();
  updateTotalSum();
  saveState();
});

// Удалить все карточки
delCardBtn.addEventListener("click", () => {
  if (!confirm("Удалить ВСЕ карточки? Это действие необратимо.")) return;
  document.querySelectorAll(".card").forEach(card => card.remove());
  localStorage.removeItem("door_calc_cards");
  updateTotalSum();
});

// Восстановление карточек при загрузке
window.onload = () => {
  savedCards.forEach(cfg => {
    const { card, updatePrice } = createCard(cfg);
    cardsContainer.appendChild(card);
    updatePrice();
  });
  updateTotalSum();
};

// ------------------ СОХРАНЕНИЕ ------------------
function saveState() {
  const cards = [];
  document.querySelectorAll(".card").forEach(card => {
    cards.push(card.__config);
  });
  localStorage.setItem("door_calc_cards", JSON.stringify(cards));
}

// ------------------ СОЗДАНИЕ КАРТОЧКИ ------------------
function createCard(config) {
  const type = config.type;
  const card = document.createElement("div");
  card.className = "card";
  card.__config = JSON.parse(JSON.stringify(config || {}));

  const titles = {
    "door": "Дверь",
    "swing": "Распашная",
    "slide": "Откатная",
    "double-slide": "Двойная откатная",
    "portal-cladding": "Облицовка портала",
    "entrance-cladding": "Облицовка входной",
    "extra": "Дополнительные работы"
  };
  card.innerHTML = `<h3>${titles[type] || "Карточка"}</h3>`;

  // ---- Helpers ----
  function addSelect(key, labelText, items, parent = card) {
    const wrap = document.createElement("label");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "space-between";
    wrap.style.alignItems = "center";
    wrap.style.marginBottom = "6px";

    const text = document.createElement("span");
    text.textContent = labelText + ":";
    const select = document.createElement("select");
    items.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      select.appendChild(opt);
    });
    if (config && config[key] !== undefined) select.value = config[key];

    wrap.appendChild(text);
    wrap.appendChild(select);
    parent.appendChild(wrap);

    select.addEventListener("change", () => {
      card.__config[key] = select.value;
      updatePrice(); updateTotalSum(); saveState();
    });
    return select;
  }

  function addNumber(key, labelText, parent = card) {
    const wrap = document.createElement("label");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "space-between";
    wrap.style.alignItems = "center";
    wrap.style.marginBottom = "6px";

    const text = document.createElement("span");
    text.textContent = labelText + ":";
    const input = document.createElement("input");
    input.type = "number";
    input.style.width = "120px";
    if (config && config[key] !== undefined) input.value = config[key];

    wrap.appendChild(text);
    wrap.appendChild(input);
    parent.appendChild(wrap);

    input.addEventListener("input", () => {
      card.__config[key] = input.value;
      updatePrice(); updateTotalSum(); saveState();
    });
    return input;
  }

  function addCheckbox(key, labelText, parent = card) {
    const wrap = document.createElement("label");
    wrap.style.display = "flex";
    wrap.style.justifyContent = "space-between";
    wrap.style.alignItems = "center";
    wrap.style.marginBottom = "6px";

    const text = document.createElement("span");
    text.textContent = labelText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.style.width = "22px";
    input.style.height = "22px";
    input.style.flexShrink = "0";
    input.style.marginLeft = "8px";
    input.style.border = "none";
    input.style.outline = "none";

    if (config && config[key]) input.checked = true;

    wrap.appendChild(text);
    wrap.appendChild(input);
    parent.appendChild(wrap);

    input.addEventListener("change", () => {
      card.__config[key] = input.checked;
      if (key === "portalCheck") {
        if (input.checked) renderPortalInner();
        else portalWrap.innerHTML = "";
      }
      updatePrice(); updateTotalSum(); saveState();
    });
    return input;
  }

  // ---- Поля карточки ----
  let hingeType, hingeCount, lockType, depth, trimSides, trimCut;
  let naschelSides, rigelCount;
  let handleCount, gardinaWidth, lockCheck, portalCheck, doborCheck;
  let portalWrap, p_depth, p_sides;

  // Двери и распашные
  if (type === "door" || type === "swing") {
    hingeType = addSelect("hingeType", "Тип петель", ["врезная", "накладная"]);
    hingeCount = addSelect("hingeCount", "Количество петель", ["2", "3", "4", "5", "6", "7", "8"]);
    lockType = addSelect("lockType", "Тип замка", ["замок", "защелка", "защелка+задвижка"]);
    doborCheck = addCheckbox("doborCheck", "Добор");

    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addSelect("trimSides", "Наличник", ["2", "1", "0"]);
    trimCut = addSelect("trimCut", "Пил наличника (м)", ["0", "1", "2", "3", "4", "5", "6", "7", "8"]);

    if (type === "swing") {
      naschelSides = addSelect("naschelSides", "Нащельник", ["1", "2", "0"]);
      rigelCount = addSelect("rigelCount", "Врезка ригеля", ["1", "2", "0"]);
    }
  }

  // Облицовка портала
  if (type === "portal-cladding") {
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addSelect("trimSides", "Наличник", ["2", "1", "0"]);
  }

  // Облицовка входной — чек включён по умолчанию
  if (type === "entrance-cladding") {
    if (config.trimSides === undefined) config.trimSides = true;
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addCheckbox("trimSides", "Наличник");
  }

  // Откатные
  if (type === "slide" || type === "double-slide") {
    handleCount = addSelect("handleCount", "Врезка ручек (пара)", ["1", "2", "0"]);
    gardinaWidth = addNumber("gardinaWidth", "Длинна гардины (м)");
    lockCheck = addCheckbox("lockCheck", "Замок");
    portalCheck = addCheckbox("portalCheck", "Облицовка портала");

    portalWrap = document.createElement("div");
    portalWrap.className = "portal-inner";
    card.appendChild(portalWrap);

    function renderPortalInner() {
      portalWrap.innerHTML = "";
      if (card.__config.p_sides === undefined) card.__config.p_sides = "2";

      p_depth = addNumber("p_depth", "Глубина проёма (мм)", portalWrap);
      if (card.__config.p_depth) p_depth.value = card.__config.p_depth;

      p_sides = addSelect("p_sides", "Наличник", ["2", "1", "0"], portalWrap);
      p_sides.value = card.__config.p_sides;

      card.__config.p_sides = p_sides.value;
      updatePrice();
    }

    if (card.__config.portalCheck) renderPortalInner();
  }

  // ---- Блок цены ----
  const priceBlock = document.createElement("div");
  priceBlock.style.marginTop = "10px";
  priceBlock.style.fontWeight = "bold";
  card.appendChild(priceBlock);

  // ---- Кнопка удаления ----
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Удалить";
  removeBtn.className = "delete-btn";
  removeBtn.addEventListener("click", () => {
    if (confirm("Удалить эту карточку?")) {
      card.remove(); saveState(); updateTotalSum();
    }
  });
  card.appendChild(removeBtn);

  // ---- Расчёт цены ----
  function depthOver150Price(d) {
    const depthNum = Number(d) || 0;
    return depthNum > 150 ? base * (depthNum - 150) * 0.002 : 0;
  }

  function hingePrice() { if (!hingeType) return 0; const k = hingeType.value === "врезная" ? 0.2 : 0.1; return base * k * Number(hingeCount.value || 0); }
  function lockPrice() { if (!lockType) return 0; if (lockType.value === "замок" || lockType.value === "защелка+задвижка") return base * 0.4; if (lockType.value === "защелка") return base * 0.2; return 0; }
  function trimPrice() { if (!trimSides) return 0; const sides = trimSides.type === "checkbox" ? (trimSides.checked ? 1 : 0) : Number(trimSides.value || 0); return base * 0.1 * sides; }
  function trimCutPrice() { return trimCut ? base * 0.04 * Number(trimCut.value || 0) : 0; }
  function naschelPrice() { return naschelSides ? base * 0.1 * Number(naschelSides.value || 0) : 0; }
  function rigelPrice() { return rigelCount ? base * 0.2 * Number(rigelCount.value || 0) : 0; }
  function handlePrice() { return handleCount ? base * 0.2 * Number(handleCount.value || 0) : 0; }
  function gardinaPrice() { return gardinaWidth ? base * 0.25 * (Number(gardinaWidth.value || 0)) : 0; }
  function slideLockPrice() { return lockCheck && lockCheck.checked ? base * 0.4 : 0; }
  function slidePortalPrice() {
    if (!portalCheck || !portalCheck.checked) return 0;
    let sum = base;
    if (p_depth) sum += depthOver150Price(p_depth.value);
    if (p_sides) sum += base * 0.1 * Number(p_sides.value || 0);
    return sum;
  }

  function updatePrice() {
    let effectiveBase = base;
    if (type === "swing" || type === "double-slide") effectiveBase *= 1.5;

    let total = effectiveBase;
    if (depth) total += depthOver150Price(depth.value);

    if (type === "door" || type === "swing") {
      total += hingePrice() + lockPrice() + (doborCheck && doborCheck.checked ? base * 0.4 : 0);
      total += trimPrice() + trimCutPrice() + naschelPrice() + rigelPrice();
    }

    if (type === "slide" || type === "double-slide") {
      total += handlePrice() + gardinaPrice() + slideLockPrice() + slidePortalPrice();
    }

    if (type === "portal-cladding" || type === "entrance-cladding") {
      total += trimPrice();
    }

    const rounded = Math.round(total);
    priceBlock.textContent = `Стоимость: ${rounded} ₽`;
    card.__config.price = rounded;
  }

  updatePrice();

  return { card, updatePrice };
}

// ------------------ Общая сумма ------------------
function updateTotalSum() {
  let sum = 0;
  document.querySelectorAll(".card").forEach(card => { sum += card.__config.price || 0; });
  totalSumBlock.textContent = `Общая сумма: ${sum} ₽`;
}