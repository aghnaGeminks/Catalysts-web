const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const backgroundImages = ["Cyberpang.png", "float.png", "lobby.png", "Vaiiking-kosong.jpg", "Trops.png"];
let backgroundImageIndex = 0;

window.setInterval(() => {
    backgroundImageIndex = (backgroundImageIndex + 1) % backgroundImages.length;
    const updateBackground = () => {
        document.body.style.setProperty("--page-background-image", `url("${backgroundImages[backgroundImageIndex]}")`);
        document.body.classList.remove("background-fading");
    };

    if (reducedMotion) {
        updateBackground();
        return;
    }

    document.body.classList.add("background-fading");
    window.setTimeout(updateBackground, 320);
}, 6500);

const navbar = document.querySelector(".container-navbar");

if (navbar) {
    const updateNavbar = () => navbar.classList.toggle("is-scrolled", window.scrollY > 12);

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });
}

const cartButton = document.querySelector(".navbar-cart");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartPanel = document.querySelector(".cart-panel");
const cartItemsElement = document.querySelector(".cart-items");
const cartCountElement = document.querySelector(".cart-count");
const cartTotalElement = document.querySelector(".cart-total strong");
const cartCheckoutButton = document.querySelector(".cart-checkout");
const cartStorageKey = "catalysts-cart";
const productImages = {
    "Cyberpang City": "Cyberpang.png",
    "Float Islands": "float.png",
    "Neon Lobby": "lobby.png",
    "Trops Arena": "Trops.png"
};

let cartItems = [];

try {
    cartItems = JSON.parse(localStorage.getItem(cartStorageKey)) || [];
} catch {
    cartItems = [];
}

if (!Array.isArray(cartItems)) {
    cartItems = [];
}

cartItems = cartItems.map((item) => ({ ...item, quantity: 1 }));

const saveCart = () => localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));

const updateAddButtons = () => {
    document.querySelectorAll(".buy-button").forEach((button) => {
        const isInCart = cartItems.some((item) => item.name === button.dataset.product);

        button.classList.toggle("cart-added", isInCart);
        button.disabled = isInCart;
        button.setAttribute("aria-label", isInCart ? `${button.dataset.product} is already in cart` : `Add ${button.dataset.product} to cart`);
    });
};

const setCartOpen = (isOpen) => {
    cartPanel.hidden = !isOpen;
    cartBackdrop.hidden = !isOpen;
    document.body.classList.toggle("cart-open", isOpen);
    document.documentElement.classList.toggle("cart-open", isOpen);
    cartButton.setAttribute("aria-expanded", String(isOpen));
};

document.addEventListener("wheel", (event) => {
    if (!cartPanel.hidden && !event.target.closest(".cart-panel")) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener("touchmove", (event) => {
    if (!cartPanel.hidden && !event.target.closest(".cart-panel")) {
        event.preventDefault();
    }
}, { passive: false });

const renderCart = () => {
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartCountElement.textContent = itemCount;
    cartCountElement.setAttribute("aria-label", `${itemCount} items`);
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
    cartCheckoutButton.disabled = itemCount === 0;
    updateAddButtons();
    cartItemsElement.innerHTML = cartItems.length
        ? cartItems.map((item) => `<div class="cart-line"><img src="${item.image || productImages[item.name]}" alt="${item.name}" /><div class="cart-line-details"><strong>${item.name}</strong><span>Quantity: ${item.quantity}</span><b>$${(item.price * item.quantity).toFixed(2)}</b></div><button class="cart-remove" type="button" data-product="${item.name}">REMOVE</button></div>`).join("")
        : '<p class="cart-empty">Your cart is empty.</p>';
};

document.addEventListener("click", (event) => {
    const addButton = event.target.closest(".buy-button");

    if (addButton) {
        const product = cartItems.find((item) => item.name === addButton.dataset.product);

        if (product) {
            product.quantity = 1;
        } else {
            cartItems.push({ name: addButton.dataset.product, price: Number(addButton.dataset.price), image: addButton.dataset.image, quantity: 1 });
        }

        saveCart();
        renderCart();
        addButton.classList.add("is-added");
        window.setTimeout(() => addButton.classList.remove("is-added"), 700);
        return;
    }

    if (event.target.closest(".navbar-cart")) {
        setCartOpen(cartPanel.hidden);
        return;
    }

    if (event.target === cartBackdrop) {
        setCartOpen(false);
        return;
    }

    const removeButton = event.target.closest(".cart-remove");

    if (removeButton) {
        cartItems = cartItems.filter((item) => item.name !== removeButton.dataset.product);
        saveCart();
        renderCart();
        return;
    }

    if (event.target.closest(".cart-checkout")) {
        window.alert(`Your order total is $${cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}.`);
        return;
    }

    if (event.target.closest(".cart-close")) {
        setCartOpen(false);
        cartButton.focus();
        return;
    }

    if (!cartPanel.hidden && !event.target.closest(".cart-panel")) {
        setCartOpen(false);
    }
});

renderCart();

if (!reducedMotion) {
    let navigationStarted = false;
    const currentPage = document.body.dataset.page || window.location.pathname.split("/").pop().toLowerCase();
    const incomingTransition = new URLSearchParams(window.location.search).get("transition");

    if (["home", "about", "index.html", "about.html"].includes(currentPage) && incomingTransition === "slide") {
        const enterFromRight = currentPage === "about" || currentPage === "about.html";
        document.body.classList.add(enterFromRight ? "page-slide-enter-reverse" : "page-slide-enter");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("transition");
        window.history.replaceState(null, "", cleanUrl.href);
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");

        if (!link) return;

        if (navigationStarted) {
            event.preventDefault();
            return;
        }

        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            link.hasAttribute("download") ||
            (link.target && link.target !== "_self")
        ) {
            return;
        }

        const destination = new URL(link.href, window.location.href);
        const destinationPage = destination.pathname.split("/").pop().toLowerCase();
        const isHomeOrAbout = ["index.html", "about.html"].includes(destinationPage);

        if (
            destination.origin !== window.location.origin ||
            !isHomeOrAbout ||
            destination.pathname === window.location.pathname
        ) {
            return;
        }

        event.preventDefault();
        navigationStarted = true;
        const fromAboutToHome = ["about", "about.html"].includes(currentPage) && destinationPage === "index.html";
        const fromHomeToAbout = ["home", "index.html"].includes(currentPage) && destinationPage === "about.html";

        if (fromAboutToHome || fromHomeToAbout) {
            destination.searchParams.set("transition", "slide");
            document.body.classList.add(fromAboutToHome ? "page-loading-slide" : "page-loading-slide-reverse");
        } else {
            document.body.classList.add("page-loading");
        }

        window.setTimeout(() => window.location.assign(destination.href), 420);
    });

    window.addEventListener("pageshow", () => {
        document.body.classList.remove("page-loading");
        document.body.classList.remove("page-loading-slide");
        document.body.classList.remove("page-loading-slide-reverse");
    });
}
