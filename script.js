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
    const { updatePrice } = createCard(cfg);
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
  card.__config = JSON.parse(JSON.stringify(config));

  const title = {
    "door": "Дверь",
    "swing": "Распашная",
    "slide": "Откатная",
    "double-slide": "Двойная откатная",
    "portal-cladding": "Облицовка портала",
    "entrance-cladding": "Облицовка входной"
  }[type];

  card.innerHTML = `<h3>${title}</h3>`;

  // ------------------ ФУНКЦИИ ДЛЯ ПОЛЕЙ ------------------
  function addSelect(key, labelText, items, parent = card) {
    const wrap = document.createElement("label");
    wrap.textContent = labelText + ": ";
    const select = document.createElement("select");
    items.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      select.appendChild(opt);
    });
    if (config[key] !== undefined) select.value = config[key];
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
    wrap.textContent = labelText + ": ";
    const input = document.createElement("input");
    input.type = "number";
    if (config[key] !== undefined) input.value = config[key];
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
    wrap.textContent = labelText;
    const input = document.createElement("input");
    input.type = "checkbox";
    if (config[key]) input.checked = true;
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

  // ------------------ ПОЛЯ КАРТОЧКИ ------------------
  let hingeType, hingeCount, lockType, depth, trimSides, trimCut;
  let naschelSides, rigelCount;
  let handleCount, gardinaWidth, lockCheck, portalCheck;
  let portalWrap, p_depth, p_sides;

  if (type === "door" || type === "swing") {
    hingeType = addSelect("hingeType", "Тип петель", ["врезная", "накладная"]);
    hingeCount = addSelect("hingeCount", "Количество петель", ["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
    lockType = addSelect("lockType", "Тип замка", ["замок", "защелка", "защелка+задвижка"]);
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addSelect("trimSides", "Наличник", ["0", "1", "2"]);
    trimCut = addSelect("trimCut", "Пил наличника (м)", ["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
    if (type === "swing") {
      naschelSides = addSelect("naschelSides", "Нащельник", ["0", "1", "2"]);
      rigelCount = addSelect("rigelCount", "Врезка ригеля", ["0", "1", "2"]);
    }
  }

  if (type === "portal-cladding") {
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addSelect("trimSides", "Наличник", ["0", "1", "2"]);
  }

  if (type === "entrance-cladding") {
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addCheckbox("trimSides", "Наличник");
  }

  if (type === "slide" || type === "double-slide") {
    handleCount = addSelect("handleCount", "Врезка ручек (пара)", ["0", "1", "2"]);
    gardinaWidth = addNumber("gardinaWidth", "Длинна гардины (см)");
    lockCheck = addCheckbox("lockCheck", "Замок");
    portalCheck = addCheckbox("portalCheck", "Облицовка портала");

    portalWrap = document.createElement("div");
    portalWrap.className = "portal-inner";
    card.appendChild(portalWrap);

    function renderPortalInner() {
      portalWrap.innerHTML = "";
      p_depth = addNumber("p_depth", "Глубина проёма (мм)", portalWrap);
      p_depth.value = card.__config.p_depth || "";
      p_sides = addSelect("p_sides", "Наличник", ["0", "1", "2"], portalWrap);
      p_sides.value = card.__config.p_sides || "0";
      updatePrice();
    }

    if (card.__config.portalCheck) renderPortalInner();
  }

  // ------------------ БЛОК ЦЕНЫ ------------------
  const priceBlock = document.createElement("div");
  priceBlock.style.marginTop = "10px";
  priceBlock.style.fontWeight = "bold";
  card.appendChild(priceBlock);

  // ------------------ УДАЛЕНИЕ КАРТОЧКИ ------------------
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Удалить";
  removeBtn.className = "delete-btn";
  removeBtn.addEventListener("click", () => {
    if (confirm("Удалить эту карточку?")) {
      card.remove(); saveState(); updateTotalSum();
    }
  });
  card.appendChild(removeBtn);

  // ------------------ ФУНКЦИИ РАСЧЁТА ------------------
  function depthPrice(d) {
    d = Number(d);
    if (!d) return 0;
    if (d > 85 && d <= 150) return base * 0.4;
    if (d > 150) return base * 0.4 + base * 0.4 * (d - 150) * 0.005;
    return 0;
  }

  function portalDepthPrice(d) {
    d = Number(d);
    if (d > 150) return base * (d - 150) * 0.002;
    return 0;
  }

  function updatePrice() {
    let total = base;

    // Увеличение базовой цены для распашной и двойной откатной
    if (type === "swing" || type === "double-slide") total *= 1.5;

    function hingePrice() { if (!hingeType) return 0; let k = hingeType.value === "врезная" ? 0.2 : 0.1; return base * k * Number(hingeCount.value || 0); }
    function lockPrice() { if (!lockType) return 0; if (lockType.value === "замок" || lockType.value === "защелка+задвижка") return base * 0.4; if (lockType.value === "защелка") return base * 0.2; return 0; }
    function trimPrice() { if (!trimSides) return 0; let sides = trimSides.type === "checkbox" ? (trimSides.checked ? 1 : 0) : Number(trimSides.value || 0); return base * 0.1 * sides; }
    function trimCutPrice() { return trimCut ? base * 0.04 * Number(trimCut.value || 0) : 0; }
    function naschelPrice() { return naschelSides ? base * 0.1 * Number(naschelSides.value || 0) : 0; }
    function rigelPrice() { return rigelCount ? base * 0.2 * Number(rigelCount.value || 0) : 0; }
    function handlePrice() { return handleCount ? base * 0.2 * Number(handleCount.value || 0) : 0; }
    function gardinaPrice() { return gardinaWidth ? base * 0.2 * (Number(gardinaWidth.value || 0) / 100) : 0; }
    function slideLockPrice() { return lockCheck && lockCheck.checked ? base * 0.4 : 0; }
    function slidePortalPrice() {
      if (!portalCheck || !portalCheck.checked) return 0;
      let sum = base; // добавляем base при включённом портале
      if (p_depth) sum += portalDepthPrice(p_depth.value);
      if (p_sides) sum += base * 0.1 * Number(p_sides.value || 0);
      return sum;
    }

    // Для portal/entrance-cladding
    function portalCladdingPrice() { if (depth) return portalDepthPrice(depth.value); return 0; }

    if (depth) {
      if (type === "portal-cladding" || type === "entrance-cladding") total += portalCladdingPrice();
      else total += depthPrice(depth.value);
    }

    total += hingePrice() + lockPrice() + trimPrice() + trimCutPrice() + naschelPrice() + rigelPrice() + handlePrice() + gardinaPrice() + slideLockPrice() + slidePortalPrice();

    priceBlock.textContent = `Стоимость: ${Math.round(total)} ₽`;
    card.__config.price = Math.round(total);
  }

  updatePrice();
  cardsContainer.prepend(card);
  return { card, updatePrice };
}

// ------------------ ОБЩАЯ СУММА ------------------
function updateTotalSum() {
  let sum = 0;
  document.querySelectorAll(".card").forEach(card => { sum += card.__config.price || 0; });
  totalSumBlock.textContent = `Общая сумма: ${sum} ₽`;
}
