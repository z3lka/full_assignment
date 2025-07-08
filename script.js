let GOLD_PRICE = null; // Will be set from backend
let allProducts = [];

async function fetchProducts() {
  const response = await fetch("products.json");
  return await response.json();
}

async function fetchGoldPriceUSDPerGram() {
  const response = await fetch("/api/gold-price");
  const data = await response.json();
  return data.pricePerGram;
}

function calculatePrice(popularityScore, weight) {
  if (GOLD_PRICE === null) return "...";
  return ((popularityScore + 1) * weight * GOLD_PRICE).toFixed(2);
}

function popularityToStars(score) {
  // Convert 0-1 to 0-5 scale, 1 decimal
  const fiveStar = (score * 5).toFixed(1);
  return fiveStar;
}

function getStarsHTML(score) {
  // score: 0-1, convert to 0-5
  const fiveStar = score * 5;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (fiveStar >= i) {
      html += '<span class="star">★</span>';
    } else if (fiveStar >= i - 0.5) {
      html += '<span class="star">☆</span>';
    } else {
      html += '<span class="star" style="color:#eee">★</span>';
    }
  }
  return html;
}

function renderProducts(products) {
  const carousel = document.getElementById("carousel");
  carousel.innerHTML = "";
  if (GOLD_PRICE === null) {
    carousel.innerHTML =
      "<div style='margin:40px auto; color:#888;'>Loading gold price...</div>";
    return;
  }
  if (products.length === 0) {
    carousel.innerHTML =
      "<div style='margin:40px auto; color:#888;'>No products found.</div>";
    return;
  }
  products.forEach((product, idx) => {
    const defaultColor = "yellow";
    const price = calculatePrice(product.popularityScore, product.weight);
    const fiveStar = popularityToStars(product.popularityScore);
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-idx", idx);
    card.innerHTML = `
      <img src="${product.images[defaultColor]}" alt="${
      product.name
    }" class="product-img" data-color="${defaultColor}">
      <div class="product-name">${product.name}</div>
      <div class="product-price">$${price} USD</div>
      <div class="color-picker">
        <div class="color-dot yellow selected" data-color="yellow" title="Yellow Gold"></div>
        <div class="color-dot white" data-color="white" title="White Gold"></div>
        <div class="color-dot rose" data-color="rose" title="Rose Gold"></div>
      </div>
      <div class="product-color-label">Yellow Gold</div>
      <div class="stars">${getStarsHTML(
        product.popularityScore
      )}<span class="product-score">${fiveStar}/5</span></div>
    `;
    carousel.appendChild(card);
  });
  addColorPickerListeners(products);
}

function addColorPickerListeners(products) {
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card, idx) => {
    const colorDots = card.querySelectorAll(".color-dot");
    const img = card.querySelector(".product-img");
    const colorLabel = card.querySelector(".product-color-label");
    colorDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        colorDots.forEach((d) => d.classList.remove("selected"));
        dot.classList.add("selected");
        const color = dot.getAttribute("data-color");
        img.src = products[idx].images[color];
        img.setAttribute("data-color", color);
        // Update label
        if (color === "yellow") colorLabel.textContent = "Yellow Gold";
        else if (color === "white") colorLabel.textContent = "White Gold";
        else colorLabel.textContent = "Rose Gold";
      });
    });
  });
}

// Carousel navigation
function scrollCarousel(direction) {
  const carousel = document.getElementById("carousel");
  const card = carousel.querySelector(".product-card");
  if (!card) return;
  const cardWidth = card.offsetWidth + 40; // 40px gap
  if (direction === "left") {
    carousel.scrollBy({ left: -cardWidth, behavior: "smooth" });
  } else {
    carousel.scrollBy({ left: cardWidth, behavior: "smooth" });
  }
}

document
  .getElementById("arrow-left")
  .addEventListener("click", () => scrollCarousel("left"));
document
  .getElementById("arrow-right")
  .addEventListener("click", () => scrollCarousel("right"));

// Swipe/drag support for carousel
function addCarouselSwipe() {
  const carousel = document.getElementById("carousel");
  let isDown = false;
  let startX;
  let scrollLeft;

  // Mouse events
  carousel.addEventListener("mousedown", (e) => {
    isDown = true;
    carousel.classList.add("dragging");
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });
  carousel.addEventListener("mouseleave", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });
  carousel.addEventListener("mouseup", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });
  carousel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.2; // scroll-fast
    carousel.scrollLeft = scrollLeft - walk;
  });

  // Touch events
  carousel.addEventListener("touchstart", (e) => {
    isDown = true;
    startX = e.touches[0].pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });
  carousel.addEventListener("touchend", () => {
    isDown = false;
  });
  carousel.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.2;
    carousel.scrollLeft = scrollLeft - walk;
  });
}

// Filter logic
function filterProducts() {
  const minPrice = parseFloat(document.getElementById("min-price").value) || 0;
  const maxPrice =
    parseFloat(document.getElementById("max-price").value) || Infinity;
  const minPopularity =
    parseFloat(document.getElementById("min-popularity").value) || 0;
  const filtered = allProducts.filter((product) => {
    const price = parseFloat(
      calculatePrice(product.popularityScore, product.weight)
    );
    const popularity = parseFloat(popularityToStars(product.popularityScore));
    return (
      price >= minPrice && price <= maxPrice && popularity >= minPopularity
    );
  });
  renderProducts(filtered);
}

document.getElementById("filter-btn").addEventListener("click", filterProducts);
document
  .getElementById("min-popularity")
  .addEventListener("input", function () {
    document.getElementById("popularity-value").textContent = this.value;
  });

// On page load
Promise.all([fetchProducts(), fetchGoldPriceUSDPerGram()]).then(
  ([products, goldPrice]) => {
    allProducts = products;
    GOLD_PRICE = goldPrice;
    renderProducts(products);
    addCarouselSwipe();
  }
);
