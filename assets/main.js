/* =========================================================
   PARAGOS — Main Application Controller
   Stage 2: Centralized data + localStorage foundation
   GitHub Pages / No Database
   ========================================================= */

"use strict";

const PARAGOS_ASSET_BASE =
  document.currentScript && document.currentScript.src
    ? document.currentScript.src.replace(/[^/]*$/, "")
    : "assets/";

/* =========================================================
   PARAGOS DATA
   ========================================================= */

const PARAGOS_DATA = {
  destinations:
    typeof PARAGOS_DESTINATIONS !== "undefined"
      ? PARAGOS_DESTINATIONS
      : [],

  stays:
    typeof PARAGOS_STAYS !== "undefined"
      ? PARAGOS_STAYS
      : [],

  vehicles:
    typeof PARAGOS_VEHICLES !== "undefined"
      ? PARAGOS_VEHICLES
      : [],

  offers:
    typeof PARAGOS_OFFERS !== "undefined"
      ? PARAGOS_OFFERS
      : [],

  faqs:
    typeof PARAGOS_FAQS !== "undefined"
      ? PARAGOS_FAQS
      : [],

  policies:
    typeof PARAGOS_POLICIES !== "undefined"
      ? PARAGOS_POLICIES
      : []
};


/* =========================================================
   STORAGE
   GitHub Pages / localStorage only
   ========================================================= */

const PARAGOSStorage = {

  prefix: "paragos:",

  key(name) {
    return `${this.prefix}${name}`;
  },

  get(name, fallback = null) {
    try {
      const value = localStorage.getItem(
        this.key(name)
      );

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);

    } catch (error) {
      console.warn(
        "PARAGOSStorage.get error:",
        error
      );

      return fallback;
    }
  },

  set(name, value) {
    try {
      localStorage.setItem(
        this.key(name),
        JSON.stringify(value)
      );

      return true;

    } catch (error) {
      console.warn(
        "PARAGOSStorage.set error:",
        error
      );

      return false;
    }
  },

  remove(name) {
    try {
      localStorage.removeItem(
        this.key(name)
      );

      return true;

    } catch (error) {
      console.warn(
        "PARAGOSStorage.remove error:",
        error
      );

      return false;
    }
  },

  list(prefix = "") {
    const results = [];

    try {
      for (
        let index = 0;
        index < localStorage.length;
        index++
      ) {
        const storageKey =
          localStorage.key(index);

        if (!storageKey) {
          continue;
        }

        if (
          storageKey.startsWith(
            this.key(prefix)
          )
        ) {
          results.push(storageKey);
        }
      }

    } catch (error) {
      console.warn(
        "PARAGOSStorage.list error:",
        error
      );
    }

    return results;
  },

  clearAll() {
    const keys = [];

    try {
      for (
        let index = 0;
        index < localStorage.length;
        index++
      ) {
        const storageKey =
          localStorage.key(index);

        if (
          storageKey &&
          storageKey.startsWith(
            this.prefix
          )
        ) {
          keys.push(storageKey);
        }
      }

      keys.forEach(storageKey => {
        localStorage.removeItem(
          storageKey
        );
      });

      return true;

    } catch (error) {
      console.warn(
        "PARAGOSStorage.clearAll error:",
        error
      );

      return false;
    }
  }
};


/* =========================================================
   BACKWARD COMPATIBILITY
   ========================================================= */

const KatigStorage =
  PARAGOSStorage;


/* =========================================================
   AUTHENTICATION
   ========================================================= */

const PARAGOSAuth = {

  normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  },


  findUser(email) {

    const normalizedEmail =
      this.normalizeEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    return PARAGOSStorage.get(
      `users:${normalizedEmail}`,
      null
    );
  },


  saveUser(user) {

    if (
      !user ||
      !user.email
    ) {
      return false;
    }

    const normalizedEmail =
      this.normalizeEmail(
        user.email
      );

    if (!normalizedEmail) {
      return false;
    }

    const normalizedUser = {
      ...user,
      email: normalizedEmail
    };

    return PARAGOSStorage.set(
      `users:${normalizedEmail}`,
      normalizedUser
    );
  },


  getUsers() {

    return PARAGOSStorage
      .list("users:")
      .map(storageKey => {

        const cleanKey =
          storageKey.startsWith(
            PARAGOSStorage.prefix
          )
            ? storageKey.substring(
                PARAGOSStorage.prefix.length
              )
            : storageKey;

        return PARAGOSStorage.get(
          cleanKey,
          null
        );
      })
      .filter(Boolean);
  },


  getSession() {

    return PARAGOSStorage.get(
      "session",
      null
    );
  },


  setSession(user) {

    if (!user) {
      return false;
    }

    /*
      Never place the password in the
      active session object.
    */

    const sessionUser = {
      id:
        user.id || null,

      name:
        user.name || "",

      email:
        this.normalizeEmail(
          user.email
        )
    };

    return PARAGOSStorage.set(
      "session",
      sessionUser
    );
  },


  clearSession() {

    return PARAGOSStorage.remove(
      "session"
    );
  },


  isAuthenticated() {

    return !!this.getSession();
  },


  register(
    name,
    email,
    password
  ) {

    const cleanName =
      String(name || "").trim();

    const normalizedEmail =
      this.normalizeEmail(email);

    const cleanPassword =
      String(password || "");

    if (
      !cleanName ||
      !normalizedEmail ||
      !cleanPassword
    ) {
      return {
        success: false,
        message:
          "Please complete all required fields."
      };
    }

    if (
      this.findUser(
        normalizedEmail
      )
    ) {
      return {
        success: false,
        message:
          "An account with this email already exists."
      };
    }

    /*
      GitHub Pages demo authentication.

      IMPORTANT:
      This is not production-grade authentication.
      Passwords are stored locally only for this
      browser demo. A real production system should
      use a secure backend with password hashing.
    */

    const user = {
      id:
        `USR-${Date.now()}`,

      name:
        cleanName,

      email:
        normalizedEmail,

      password:
        cleanPassword,

      createdAt:
        new Date().toISOString()
    };

    const saved =
      this.saveUser(user);

    if (!saved) {
      return {
        success: false,
        message:
          "The account could not be saved in this browser."
      };
    }

    return {
      success: true,
      user
    };
  },


  signIn(
    email,
    password
  ) {

    const normalizedEmail =
      this.normalizeEmail(email);

    const user =
      this.findUser(
        normalizedEmail
      );

    if (
      !user ||
      user.password !== password
    ) {
      return {
        success: false,
        message:
          "Invalid email or password."
      };
    }

    const sessionSaved =
      this.setSession(user);

    if (!sessionSaved) {
      return {
        success: false,
        message:
          "Unable to create a session in this browser."
      };
    }

    return {
      success: true,
      user
    };
  }
};


/* =========================================================
   BACKWARD COMPATIBILITY
   ========================================================= */

const KatigAuth =
  PARAGOSAuth;


/* =========================================================
   AUTH GUARD
   ========================================================= */

function requireAuth() {

  const session =
    PARAGOSAuth.getSession();

  if (session) {
    return session;
  }

  const currentPage =
    window.location.pathname
      .split("/")
      .pop();

  const redirect =
    encodeURIComponent(
      currentPage ||
      "index.html"
    );

  window.location.href =
    `signin.html?redirect=${redirect}`;

  return null;
}


/* =========================================================
   SAFE REDIRECT
   ========================================================= */

function getSafeRedirect(
  fallback = "authenticated.html"
) {

  const requested =
    new URLSearchParams(
      window.location.search
    ).get("redirect");

  if (!requested) {
    return fallback;
  }

  if (
    requested.startsWith("http://") ||
    requested.startsWith("https://") ||
    requested.startsWith("//") ||
    requested.includes(":")
  ) {
    return fallback;
  }

  return requested;
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupMobileNavigation() {

  const toggle =
    document.querySelector(
      ".nav-toggle"
    );

  if (!toggle) {
    return;
  }

  /*
    Support both navigation structures
    used by the PARAGOS pages.
  */

  const nav =
    document.querySelector(
      ".site-nav"
    ) ||
    document.querySelector(
      ".nav-links"
    );

  if (!nav) {
    return;
  }

  toggle.addEventListener(
    "click",
    () => {

      const isOpen =
        nav.classList.toggle(
          "open"
        );

      toggle.setAttribute(
        "aria-expanded",
        isOpen
          ? "true"
          : "false"
      );
    }
  );

  nav
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          nav.classList.remove(
            "open"
          );

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      );
    });
}


/* =========================================================
   FAQ ACCORDION
   ========================================================= */

function setupFAQ() {

  const faqItems =
    document.querySelectorAll(
      ".faq-item"
    );

  faqItems.forEach(item => {

    const question =
      item.querySelector(
        ".faq-question"
      );

    if (!question) {
      return;
    }

    question.addEventListener(
      "click",
      () => {

        const isOpen =
          item.classList.contains(
            "open"
          );

        faqItems.forEach(other => {

          other.classList.remove(
            "open"
          );

          const otherQuestion =
            other.querySelector(
              ".faq-question"
            );

          if (otherQuestion) {
            otherQuestion.setAttribute(
              "aria-expanded",
              "false"
            );
          }

          const otherAnswer =
            other.querySelector(
              ".faq-answer"
            );

          if (otherAnswer) {
            otherAnswer.style.maxHeight =
              null;
          }
        });

        if (!isOpen) {

          item.classList.add(
            "open"
          );

          question.setAttribute(
            "aria-expanded",
            "true"
          );

          const answer =
            item.querySelector(
              ".faq-answer"
            );

          if (answer) {
            answer.style.maxHeight =
              `${answer.scrollHeight}px`;
          }
        }
      }
    );
  });
}


/* =========================================================
   FILTER CHIPS
   ========================================================= */

function setupFilterChips() {

  document
    .querySelectorAll(
      ".filter-chip"
    )
    .forEach(chip => {

      chip.addEventListener(
        "click",
        () => {

          const group =
            chip.closest(
              ".filter-group"
            );

          if (group) {

            group
              .querySelectorAll(
                ".filter-chip"
              )
              .forEach(other => {

                other.classList.remove(
                  "active"
                );

                other.setAttribute(
                  "aria-pressed",
                  "false"
                );
              });
          }

          chip.classList.add(
            "active"
          );

          chip.setAttribute(
            "aria-pressed",
            "true"
          );
        }
      );
    });
}


/* =========================================================
   SELECTABLE CARDS
   ========================================================= */

function setupSelectableCards() {

  document
    .querySelectorAll(
      "[data-selectable]"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const group =
            card.closest(
              "[data-selection-group]"
            );

          if (group) {

            group
              .querySelectorAll(
                "[data-selectable]"
              )
              .forEach(other => {

                other.classList.remove(
                  "selected"
                );

                other.setAttribute(
                  "aria-selected",
                  "false"
                );
              });
          }

          card.classList.add(
            "selected"
          );

          card.setAttribute(
            "aria-selected",
            "true"
          );
        }
      );
    });
}


/* =========================================================
   NAV AUTH STATE
   ========================================================= */

function renderNavAuthState() {

  const session =
    PARAGOSAuth.getSession();

  document
    .querySelectorAll(
      "[data-auth-state]"
    )
    .forEach(container => {

      const state =
        container.dataset.authState;

      if (
        state ===
        "authenticated"
      ) {
        container.style.display =
          session ? "" : "none";
      }

      if (
        state === "guest"
      ) {
        container.style.display =
          session ? "none" : "";
      }
    });


  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(element => {

      element.textContent =
        session?.name ||
        session?.email ||
        "Guest";
    });


  document
    .querySelectorAll(
      "[data-user-email]"
    )
    .forEach(element => {

      element.textContent =
        session?.email ||
        "";
    });


  /*
    Support the explicit IDs used by the
    current authentication pages.
  */

  const navUser =
    document.getElementById(
      "navUser"
    );

  const navSignIn =
    document.getElementById(
      "navSignIn"
    );

  const navAuthLink =
    document.getElementById(
      "navAuthLink"
    );

  const navLogout =
    document.getElementById(
      "navLogout"
    );

  if (navUser) {
    navUser.style.display =
      session ? "" : "none";
  }

  if (navSignIn) {
    navSignIn.style.display =
      session ? "none" : "";
  }

  if (navAuthLink) {
    navAuthLink.style.display =
      session ? "none" : "";
  }

  if (navLogout) {
    navLogout.style.display =
      session ? "" : "none";
  }

  if (navUser && session) {

    const nameElement =
      navUser.querySelector(
        "[data-user-name]"
      );

    const emailElement =
      navUser.querySelector(
        "[data-user-email]"
      );

    if (nameElement) {
      nameElement.textContent =
        session.name ||
        session.email ||
        "Account";
    }

    if (emailElement) {
      emailElement.textContent =
        session.email ||
        "";
    }
  }
}


/* =========================================================
   REGISTRATION
   ========================================================= */

function setupRegistration() {

  const form =
    document.querySelector(
      "#registerForm"
    );

  if (!form) {
    return;
  }

  /*
    Some versions of register.html handle
    registration themselves. Avoid attaching
    a duplicate submit handler when the page
    already marks the form as externally handled.
  */

  if (
    form.dataset.paragosHandled ===
    "true"
  ) {
    return;
  }

  form.dataset.paragosHandled =
    "true";

  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const name =
        form.querySelector(
          '[name="name"]'
        )?.value.trim() || "";

      const email =
        form.querySelector(
          '[name="email"]'
        )?.value.trim().toLowerCase() || "";

      const password =
        form.querySelector(
          '[name="password"]'
        )?.value || "";

      const confirmPassword =
        form.querySelector(
          '[name="confirmPassword"]'
        )?.value || "";

      const terms =
        form.querySelector(
          '[name="terms"]'
        )?.checked || false;


      if (
        name.length < 2
      ) {
        alert(
          "Please enter your full name."
        );

        return;
      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ) {
        alert(
          "Please enter a valid email address."
        );

        return;
      }


      if (
        password.length < 8
      ) {
        alert(
          "Password must be at least 8 characters."
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {
        alert(
          "Passwords do not match."
        );

        return;
      }


      if (!terms) {
        alert(
          "Please accept the terms and conditions."
        );

        return;
      }


      const result =
        PARAGOSAuth.register(
          name,
          email,
          password
        );


      if (!result.success) {
        alert(
          result.message ||
          "Registration failed."
        );

        return;
      }


      const loginResult =
        PARAGOSAuth.signIn(
          email,
          password
        );

      if (!loginResult.success) {

        window.location.href =
          "signin.html";

        return;
      }


      window.location.href =
        getSafeRedirect(
          "authenticated.html"
        );
    }
  );
}


/* =========================================================
   SIGN IN
   ========================================================= */

function setupSignin() {

  const form =
    document.querySelector(
      "#signinForm"
    );

  if (!form) {
    return;
  }

  if (
    form.dataset.paragosHandled ===
    "true"
  ) {
    return;
  }

  form.dataset.paragosHandled =
    "true";

  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const email =
        form.querySelector(
          '[name="email"]'
        )?.value.trim().toLowerCase() || "";

      const password =
        form.querySelector(
          '[name="password"]'
        )?.value || "";


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ) {
        alert(
          "Please enter a valid email address."
        );

        return;
      }


      if (!password) {
        alert(
          "Please enter your password."
        );

        return;
      }


      const result =
        PARAGOSAuth.signIn(
          email,
          password
        );


      if (!result.success) {
        alert(
          result.message ||
          "Invalid email or password."
        );

        return;
      }


      const rememberMe =
        form.querySelector(
          '[name="rememberMe"]'
        )?.checked || false;

      PARAGOSStorage.set(
        "remember_me",
        rememberMe
      );


      window.location.href =
        getSafeRedirect(
          "authenticated.html"
        );
    }
  );
}


/* =========================================================
   SIGN OUT
   ========================================================= */

function setupSignout() {

  document
    .querySelectorAll(
      "[data-signout]"
    )
    .forEach(button => {

      if (
        button.dataset.paragosHandled ===
        "true"
      ) {
        return;
      }

      button.dataset.paragosHandled =
        "true";

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          PARAGOSAuth.clearSession();

          window.location.href =
            "index.html";
        }
      );
    });
}


/* =========================================================
   DATA HELPERS
   ========================================================= */

function normalizeId(value) {

  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}


function findById(
  collection,
  id
) {

  if (
    !Array.isArray(collection) ||
    id === undefined ||
    id === null
  ) {
    return null;
  }

  const target =
    normalizeId(id);

  return (
    collection.find(item => {

      if (!item) {
        return false;
      }

      return [
        item.id,
        item.code,
        item.slug,
        item.key
      ]
        .filter(
          value =>
            value !== undefined &&
            value !== null
        )
        .some(
          value =>
            normalizeId(value) === target
        );
    }) ||
    null
  );
}


function getDestination(id) {

  return findById(
    PARAGOS_DATA.destinations,
    id
  );
}


function getStay(id) {

  return findById(
    PARAGOS_DATA.stays,
    id
  );
}


function getVehicle(id) {

  return findById(
    PARAGOS_DATA.vehicles,
    id
  );
}


function getOffer(id) {

  return findById(
    PARAGOS_DATA.offers,
    id
  );
}


function getFAQ(id) {

  return findById(
    PARAGOS_DATA.faqs,
    id
  );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatPHP(amount) {

  const value =
    Number(amount) || 0;

  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0
    }
  ).format(value);
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function parseDateOnly(
  value
) {

  if (!value) {
    return null;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/
      .test(value)
  ) {

    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


function getNights(
  checkin,
  checkout
) {

  const start =
    parseDateOnly(checkin);

  const end =
    parseDateOnly(checkout);

  if (
    !start ||
    !end
  ) {
    return 0;
  }

  const difference =
    end.getTime() -
    start.getTime();

  if (
    difference <= 0
  ) {
    return 0;
  }

  return Math.round(
    difference /
    (1000 * 60 * 60 * 24)
  );
}


/* =========================================================
   BOOKING STORAGE
   ========================================================= */

function normalizeBooking(
  booking
) {

  if (!booking) {
    return null;
  }

  const normalized = {
    ...booking
  };

  /*
    booking.html stores the owner as userEmail; the booking
    index is keyed on email, so mirror it here.
  */
  if (
    !normalized.email &&
    normalized.userEmail
  ) {
    normalized.email =
      normalized.userEmail;
  }

  if (normalized.email) {
    normalized.email =
      String(
        normalized.email
      )
        .trim()
        .toLowerCase();
  }

  if (
    !normalized.createdAt
  ) {
    normalized.createdAt =
      new Date().toISOString();
  }

  return normalized;
}


function saveBooking(
  booking
) {

  const normalizedBooking =
    normalizeBooking(
      booking
    );

  if (
    !normalizedBooking ||
    !normalizedBooking.reference
  ) {
    return false;
  }

  const saved =
    PARAGOSStorage.set(
      `bookings:${normalizedBooking.reference}`,
      normalizedBooking
    );

  if (!saved) {
    return false;
  }


  if (
    normalizedBooking.email
  ) {

    const email =
      normalizedBooking.email;

    const indexKey =
      `booking-index:${email}`;

    const existing =
      PARAGOSStorage.get(
        indexKey,
        []
      );

    const references =
      Array.isArray(existing)
        ? existing
        : [];

    if (
      !references.includes(
        normalizedBooking.reference
      )
    ) {

      references.push(
        normalizedBooking.reference
      );

      PARAGOSStorage.set(
        indexKey,
        references
      );
    }
  }

  return true;
}


function getBooking(
  reference
) {

  if (!reference) {
    return null;
  }

  return PARAGOSStorage.get(
    `bookings:${reference}`,
    null
  );
}


function getUserBookings(
  email
) {

  const normalizedEmail =
    PARAGOSAuth.normalizeEmail(
      email
    );

  if (!normalizedEmail) {
    return [];
  }

  const indexed =
    PARAGOSStorage.get(
      `booking-index:${normalizedEmail}`,
      []
    );

  const found =
    new Map();

  (Array.isArray(indexed)
    ? indexed
    : []
  ).forEach(reference => {

    const booking =
      getBooking(reference);

    if (booking) {
      found.set(
        booking.reference ||
          reference,
        booking
      );
    }
  });

  /*
    Also scan stored bookings so ones saved before the index
    was keyed correctly (userEmail only) still show up.
  */
  PARAGOSStorage
    .list("bookings:")
    .forEach(storageKey => {

      const booking =
        PARAGOSStorage.get(
          storageKey.substring(
            PARAGOSStorage.prefix.length
          ),
          null
        );

      if (
        booking &&
        !found.has(booking.reference) &&
        PARAGOSAuth.normalizeEmail(
          booking.email ||
          booking.userEmail
        ) === normalizedEmail
      ) {
        found.set(
          booking.reference,
          booking
        );
      }
    });

  return Array.from(
    found.values()
  );
}


/* =========================================================
   BOOKING REFERENCE
   ========================================================= */

function generateBookingReference() {

  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

  return (
    `PRG-${timestamp}-${random}`
  );
}


/* =========================================================
   SESSION UI
   ========================================================= */

function setupSessionUI() {

  renderNavAuthState();

  setupSignout();
}


/* =========================================================
   GLOBAL WINDOW API
   =========================================================

   IMPORTANT:
   These are explicitly attached to window.

   This allows pages such as register.html,
   signin.html, booking.html and admin.html
   to safely access:

     window.PARAGOSAuth
     window.PARAGOSStorage
     window.KatigAuth
     window.KatigStorage

   ========================================================= */

window.PARAGOS_DATA =
  PARAGOS_DATA;

window.PARAGOSStorage =
  PARAGOSStorage;

window.KatigStorage =
  KatigStorage;

window.PARAGOSAuth =
  PARAGOSAuth;

window.KatigAuth =
  KatigAuth;


/* =========================================================
   GLOBAL PARAGOS API
   ========================================================= */

window.PARAGOS = {

  data:
    PARAGOS_DATA,

  storage:
    PARAGOSStorage,

  auth:
    PARAGOSAuth,

  requireAuth,

  getSafeRedirect,

  getDestination,

  getStay,

  getVehicle,

  getOffer,

  getFAQ,

  formatPHP,

  parseDateOnly,

  getNights,

  saveBooking,

  getBooking,

  getUserBookings,

  generateBookingReference
};


/* =========================================================
   SHARED NAVBAR
   Single source of truth for every page. Renders the guest or
   authenticated variant into <nav class="navbar" id="siteNav">.
   ========================================================= */

function renderNavbar() {

  const nav =
    document.getElementById("siteNav") ||
    document.querySelector("nav.navbar");

  if (!nav) {
    return;
  }

  const session =
    PARAGOSAuth.getSession();

  const links = session
    ? [
        ["authenticated.html", "My Account"],
        ["index.html", "Home"],
        ["destinations.html", "Destinations"],
        ["booking.html", "Booking"],
        ["offers.html", "Offers"],
        ["support.html", "Support"]
      ]
    : [
        ["index.html", "Home"],
        ["destinations.html", "Destinations"],
        ["offers.html", "Offers"],
        ["support.html", "Support"]
      ];

  const currentPage =
    (window.location.pathname
      .split("/")
      .pop() || "index.html")
      .toLowerCase();

  const linkItems =
    links
      .map(([href, label]) => {

        const active =
          href === currentPage
            ? ' class="active" aria-current="page"'
            : "";

        return `<li><a href="${href}"${active}>${label}</a></li>`;
      })
      .join("");

  /*
    Auth actions are duplicated inside the link list so the
    mobile menu (which hides .nav-cta buttons) still has them.
  */

  const mobileItems = session
    ? '<li class="nav-mobile-only"><button type="button" data-nav-logout>Sign out</button></li>'
    : '<li class="nav-mobile-only"><a href="signin.html">Sign in</a></li>' +
      '<li class="nav-mobile-only"><a href="register.html">Register</a></li>';

  const cta = session
    ? `<span class="user-chip"></span>
       <button type="button" class="btn btn-primary" data-nav-logout>Sign out</button>`
    : `<a href="signin.html" class="btn btn-ghost">Sign in</a>
       <a href="register.html" class="btn btn-primary nav-register">Register</a>`;

  nav.innerHTML = `
    <a href="index.html" class="logo" aria-label="PARAGOS home">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 17c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 6 0"
              stroke="#FF6B4A" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 17V6l10 3-6 2.4V17"
              stroke="#0A2E2C" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      PARAGOS
    </a>

    <ul class="nav-links" id="navLinks">
      ${linkItems}
      ${mobileItems}
    </ul>

    <div class="nav-cta">
      ${cta}
      <button class="nav-toggle" type="button"
              aria-label="Open menu" aria-expanded="false"
              aria-controls="navLinks">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  const chip =
    nav.querySelector(".user-chip");

  if (chip && session) {
    chip.textContent =
      session.name ||
      session.email ||
      "Account";
  }

  nav
    .querySelectorAll("[data-nav-logout]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          PARAGOSAuth.clearSession();

          window.location.href =
            "index.html";
        }
      );
    });
}

/*
  Render immediately (main.js loads after the markup) so page
  scripts that run later already see the final navbar.
*/

renderNavbar();


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupMobileNavigation();

    setupFAQ();

    setupFilterChips();

    setupSelectableCards();

    setupRegistration();

    setupSignin();

    setupSessionUI();

    loadChatbot();

  }
);

/* =========================================================
   CHAT SUPPORT (Gemini widget, see assets/chatbot.js)
   ========================================================= */

function loadChatbot() {

  if (document.querySelector("[data-no-chatbot]")) {
    return;
  }

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = PARAGOS_ASSET_BASE + "chatbot.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = PARAGOS_ASSET_BASE + "chatbot.js";
  document.body.appendChild(script);
}