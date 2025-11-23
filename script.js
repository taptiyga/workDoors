
let base = 2000;
const cardsContainer = document.getElementById("cardsContainer");
const addCardBtn = document.getElementById("addCard");
const workTypeSelect = document.getElementById("workType");
const totalSumBlock = document.getElementById("totalSum");

let savedCards = JSON.parse(localStorage.getItem("door_calc_cards") || "[]");

addCardBtn.addEventListener("click", () => {
  const type = workTypeSelect.value;
  createCard({ type });
  saveState();
});

window.onload = () => {
  savedCards.forEach(cfg => createCard(cfg));
  updateTotalSum();
};

function saveState() {
  const cards = [];
  document.querySelectorAll(".card").forEach(card => {
    cards.push(card.__config);
  });
  localStorage.setItem("door_calc_cards", JSON.stringify(cards));
}

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

  function addSelect(key, labelText, items, parent = card) {
    const wrap = document.createElement("label");
    wrap.textContent = labelText + ": ";
    const select = document.createElement("select");
    items.forEach(i => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = i; select.appendChild(opt);
    });
    if (config[key]) select.value = config[key];
    wrap.appendChild(select);
    parent.appendChild(wrap);
    select.addEventListener("change", () => {
      card.__config[key] = select.value; updatePrice(); updateTotalSum(); saveState();
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
      card.__config[key] = input.value; updatePrice(); updateTotalSum(); saveState();
    });
    return input;
  }

  function addCheckbox(key, labelText, parent = card) {
    const wrap = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    if (config[key]) input.checked = true;
    wrap.appendChild(input); wrap.append(" " + labelText);
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

  // ------------ Поля карточек ------------
  let hingeType, hingeCount, lockType, depth, trimSides, trimCut;
  let naschelSides, rigelCount;
  let handleCount, gardinaWidth, lockCheck, portalCheck;
  let portalWrap, p_depth, p_sides;

  if (type === "door" || type === "swing") {
    hingeType = addSelect("hingeType", "Тип петель", ["врезная", "накладная"]);
    hingeCount = addNumber("hingeCount", "Количество петель");
    lockType = addSelect("lockType", "Тип замка", ["замок", "защелка", "защелка+задвижка"]);
    depth = addNumber("depth", "Глубина проёма (мм)");
    trimSides = addSelect("trimSides", "Наличник", ["0", "1", "2"]);
    trimCut = addNumber("trimCut", "Пил наличника (м)");

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
    handleCount = addNumber("handleCount", "Врезка ручек (шт)");
    gardinaWidth = addNumber("gardinaWidth", "Ширина гардины (см)");
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

    if (portalCheck.checked) renderPortalInner();
  }

  const priceBlock = document.createElement("div");
  priceBlock.style.marginTop = "10px";
  priceBlock.style.fontWeight = "bold";
  card.appendChild(priceBlock);

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Удалить";
  removeBtn.className = "remove-btn";
  removeBtn.addEventListener("click", () => {
    if (confirm("Удалить эту карточку?")) {
      card.remove(); saveState(); updateTotalSum();
    }
  });
  card.appendChild(removeBtn);

  function updatePrice() {
    let total = base;

    function hingePrice() { if (!hingeType || !hingeCount.value) return 0; let k = hingeType.value === "врезная" ? 0.2 : 0.1; return base * k * Number(hingeCount.value); }
    function lockPrice() { if (!lockType) return 0; if (lockType.value === "замок" || lockType.value === "защелка+задвижка") return base * 0.4; if (lockType.value === "защелка") return base * 0.2; return 0; }
    function depthPrice(d) { if (!d) return 0; d = Number(d); if (d < 100) return 0; if (d <= 200) return base * 0.3; return base * 0.3 + base * 0.3 * (d - 200) * 0.005; }
    function trimPrice() { if (!trimSides) return 0; let sides = trimSides.type === "checkbox" ? trimSides.checked ? 1 : 0 : Number(trimSides.value); return base * 0.1 * sides; }
    function trimCutPrice() { if (!trimCut) return 0; return base * 0.05 * Number(trimCut.value || 0); }
    function naschelPrice() { if (!naschelSides) return 0; return base * 0.1 * Number(naschelSides.value); }
    function rigelPrice() { if (!rigelCount) return 0; return base * 0.2 * Number(rigelCount.value); }
    function handlePrice() { if (!handleCount) return 0; return base * 0.2 * Number(handleCount.value || 0); }
    function gardinaPrice() { if (!gardinaWidth) return 0; return base * 0.2 * (Number(gardinaWidth.value) / 100); }
    function slideLockPrice() { return lockCheck && lockCheck.checked ? base * 0.4 : 0; }
    function slidePortalPrice() { if (!portalCheck || !portalCheck.checked) return 0; let sum = base; if (p_depth) sum += depthPrice(p_depth.value); if (p_sides) sum += base * 0.1 * Number(p_sides.value); return sum; }

    if (depth) total += depthPrice(depth.value);
    total += hingePrice(); total += lockPrice(); total += trimPrice(); total += trimCutPrice(); total += naschelPrice(); total += rigelPrice();
    total += handlePrice(); total += gardinaPrice(); total += slideLockPrice(); total += slidePortalPrice();

    priceBlock.textContent = `Стоимость: ${Math.round(total)} ₽`;
    card.__config.price = Math.round(total);
  }

  updatePrice();
  cardsContainer.appendChild(card);
}

function updateTotalSum() {
  let sum = 0;
  document.querySelectorAll(".card").forEach(card => { sum += card.__config.price || 0; });
  totalSumBlock.textContent = `Общая сумма: ${sum} ₽`;
}
