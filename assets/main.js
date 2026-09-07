const KatigStorage = (() => {
  const memory = {};
  const hasLocal = () => {
    try {
      const testKey = '__katig_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  };
  const localOk = hasLocal();

  function get(key) {
    try {
      if (localOk) return window.localStorage.getItem(key);
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    } catch (err) {
      return null;
    }
  }

  function set(key, value) {
    try {
      if (localOk) {
        window.localStorage.setItem(key, value);
        return true;
      }
      memory[key] = value;
      return true;
    } catch (err) {
      return false;
    }
  }

  function remove(key) {
    try {
      if (localOk) {
        window.localStorage.removeItem(key);
        return true;
      }
      delete memory[key];
      return true;
    } catch (err) {
      return false;
    }
  }

  function list(prefix = '') {
    try {
      if (localOk) {
        return Object.keys(window.localStorage).filter((k) => k.startsWith(prefix));
      }
      return Object.keys(memory).filter((k) => k.startsWith(prefix));
    } catch (err) {
      return [];
    }
  }

  return { get, set, remove, list, isLocal: () => localOk };
})();

const KatigAuth = (() => {
  function findUser(email) {
    const raw = KatigStorage.get('users:' + email.toLowerCase());
    return raw ? JSON.parse(raw) : null;
  }

  function saveUser(user) {
    KatigStorage.set('users:' + user.email.toLowerCase(), JSON.stringify(user));
  }

  function getSession() {
    const raw = KatigStorage.get('session');
    return raw ? JSON.parse(raw) : null;
  }

  function setSession(user) {
    KatigStorage.set('session', JSON.stringify({ name: user.name, email: user.email }));
  }

  function clearSession() {
    KatigStorage.remove('session');
  }

  return { findUser, saveUser, getSession, setSession, clearSession };
})();

const navToggle = document.querySelector('.nav-toggle');
const navLinksEl = document.querySelector('.nav-links');
if (navToggle && navLinksEl) {
  navToggle.addEventListener('click', () => {
    const open = navLinksEl.style.display === 'flex';
    navLinksEl.style.display = open ? 'none' : 'flex';
    navLinksEl.style.cssText += open ? '' : 'position:fixed;top:86px;left:5vw;right:5vw;background:rgba(255,255,255,0.92);backdrop-filter:blur(18px);flex-direction:column;padding:20px;border-radius:14px;box-shadow:0 20px 40px rgba(7,33,31,0.2);';
  });
}

document.querySelectorAll('.filter-chips').forEach((group) => {
  group.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});

document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!question || !answer) return;
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((other) => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });
    item.classList.toggle('open', !isOpen);
    answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
  });
});

document.querySelectorAll('.select-grid').forEach((grid) => {
  grid.querySelectorAll('.select-card').forEach((card) => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.select-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
});

function renderNavAuthState() {
  const authLink = document.getElementById('navAuthLink');
  if (!authLink) return;
  const session = KatigAuth.getSession();
  if (session) {
    authLink.textContent = 'Sign out';
    authLink.setAttribute('href', '#');
    authLink.onclick = (e) => {
      e.preventDefault();
      KatigAuth.clearSession();
      window.location.href = 'index.html';
    };
  }
}
renderNavAuthState();

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  const existingSession = KatigAuth.getSession();
  if (existingSession) {
    window.location.href = 'index.html';
  }

  const messageBox = document.getElementById('registerMessage');
  const submitBtn = document.getElementById('regSubmit');

  function showRegisterMessage(text, kind) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    messageBox.style.background = kind === 'error' ? 'rgba(255,107,74,0.12)' : 'rgba(23,163,152,0.12)';
    messageBox.style.color = kind === 'error' ? '#B8422A' : '#0E6E66';
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const terms = document.getElementById('regTerms').checked;

    if (!name || !email || !password) {
      showRegisterMessage('Please fill in every field.', 'error');
      return;
    }
    if (password.length < 8) {
      showRegisterMessage('Password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      showRegisterMessage('Passwords do not match.', 'error');
      return;
    }
    if (!terms) {
      showRegisterMessage('Please agree to the Terms and Privacy Policy.', 'error');
      return;
    }

    const existingUser = KatigAuth.findUser(email);
    if (existingUser) {
      showRegisterMessage('An account with this email already exists. Try signing in instead.', 'error');
      return;
    }

    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    KatigAuth.saveUser({ name, email, password });
    KatigAuth.setSession({ name, email });
    showRegisterMessage('Account created. Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
  });
}

const signinForm = document.getElementById('signinForm');
if (signinForm) {
  const existingSession = KatigAuth.getSession();
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect') || 'index.html';
  if (existingSession) {
    window.location.href = redirectTo;
  }

  const messageBox = document.getElementById('signinMessage');
  const submitBtn = document.getElementById('loginSubmit');

  function showSigninMessage(text, kind) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    messageBox.style.background = kind === 'error' ? 'rgba(255,107,74,0.12)' : 'rgba(23,163,152,0.12)';
    messageBox.style.color = kind === 'error' ? '#B8422A' : '#0E6E66';
  }

  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showSigninMessage('Please enter your email and password.', 'error');
      return;
    }

    const user = KatigAuth.findUser(email);
    if (!user || user.password !== password) {
      showSigninMessage('Incorrect email or password.', 'error');
      return;
    }

    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    KatigAuth.setSession(user);
    showSigninMessage('Signed in. Redirecting...', 'success');
    setTimeout(() => { window.location.href = redirectTo; }, 500);
  });
}

const bookingLayout = document.getElementById('bookingLayout');
if (bookingLayout) {
  const SERVICE_FEE = 850;
  const PROMO_CODES = { WELCOME10: 0.10, ISLAND15: 0.15 };
  let appliedPromo = null;

  const destinationSelect = document.getElementById('tripDestination');
  const travelersSelect = document.getElementById('tripTravelers');
  const checkinInput = document.getElementById('tripCheckin');
  const checkoutInput = document.getElementById('tripCheckout');
  const stayGrid = document.getElementById('stayGrid');
  const carGrid = document.getElementById('carGrid');
  const promoInput = document.getElementById('promoInput');
  const promoApplyBtn = document.getElementById('promoApplyBtn');
  const promoMsg = document.getElementById('promoMsg');
  const authBanner = document.getElementById('authBanner');

  function peso(amount) {
    return '₱' + Math.round(amount).toLocaleString('en-PH');
  }

  function formatDate(value) {
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d)) return value;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getNights() {
    const inDate = new Date(checkinInput.value + 'T00:00:00');
    const outDate = new Date(checkoutInput.value + 'T00:00:00');
    const diff = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  function updateSummary() {
    const nights = getNights();
    const destOption = destinationSelect.selectedOptions[0];
    const destName = destOption.textContent;
    const destCode = destOption.getAttribute('data-code');
    const travelers = travelersSelect.value === '4' ? '4+' : travelersSelect.value;

    document.getElementById('summaryCode').textContent = destCode;
    document.getElementById('metaDestination').textContent = destName;
    document.getElementById('metaCheckin').textContent = formatDate(checkinInput.value);
    document.getElementById('metaCheckout').textContent = formatDate(checkoutInput.value);
    document.getElementById('metaTravelers').textContent = travelers;

    const stayCard = stayGrid.querySelector('.select-card.selected');
    const stayName = stayCard.getAttribute('data-name');
    const stayPrice = parseFloat(stayCard.getAttribute('data-price'));
    const stayTotal = stayPrice * nights;
    document.getElementById('rowStayLabel').textContent = stayName + ', ' + nights + ' night' + (nights > 1 ? 's' : '');
    document.getElementById('rowStayPrice').textContent = peso(stayTotal);

    const carCard = carGrid.querySelector('.select-card.selected');
    const carName = carCard.getAttribute('data-name');
    const carPrice = parseFloat(carCard.getAttribute('data-price'));
    const carRow = document.getElementById('rowCar');
    let carTotal = 0;
    if (carName) {
      carTotal = carPrice * nights;
      carRow.style.display = 'flex';
      document.getElementById('rowCarLabel').textContent = carName + ' rental, ' + nights + ' day' + (nights > 1 ? 's' : '');
      document.getElementById('rowCarPrice').textContent = peso(carTotal);
    } else {
      carRow.style.display = 'none';
    }

    document.getElementById('rowServiceFee').textContent = peso(SERVICE_FEE);

    const subtotal = stayTotal + carTotal;
    const discountRow = document.getElementById('rowDiscount');
    let discount = 0;
    if (appliedPromo) {
      discount = subtotal * PROMO_CODES[appliedPromo];
      document.getElementById('rowDiscountLabel').textContent = 'Promo ' + appliedPromo;
      document.getElementById('rowDiscountAmount').textContent = '−' + peso(discount);
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }

    const total = subtotal + SERVICE_FEE - discount;
    document.getElementById('summaryTotal').textContent = peso(total);

    return { nights, destName, destCode, travelers, stayName, stayTotal, carName, carTotal, subtotal, discount, total };
  }

  destinationSelect.addEventListener('change', updateSummary);
  travelersSelect.addEventListener('change', updateSummary);
  checkinInput.addEventListener('change', updateSummary);
  checkoutInput.addEventListener('change', updateSummary);
  stayGrid.querySelectorAll('.select-card').forEach((card) => card.addEventListener('click', updateSummary));
  carGrid.querySelectorAll('.select-card').forEach((card) => card.addEventListener('click', updateSummary));

  promoApplyBtn.addEventListener('click', () => {
    const code = promoInput.value.trim().toUpperCase();
    promoMsg.style.display = 'block';
    if (!code) {
      promoMsg.textContent = 'Enter a code to apply.';
      promoMsg.style.color = 'rgba(10,46,44,0.55)';
      return;
    }
    if (PROMO_CODES[code]) {
      appliedPromo = code;
      promoMsg.textContent = code + ' applied.';
      promoMsg.style.color = '#0E6E66';
    } else {
      appliedPromo = null;
      promoMsg.textContent = 'Invalid code. Try WELCOME10 or ISLAND15.';
      promoMsg.style.color = '#B8422A';
    }
    updateSummary();
  });

  const session = KatigAuth.getSession();
  authBanner.style.display = 'block';
  if (session) {
    authBanner.innerHTML = 'Booking as <strong>' + session.name + '</strong> (' + session.email + '). This trip will be saved to your account.';
    const paymentName = document.getElementById('paymentName');
    if (!paymentName.value) paymentName.value = session.name;
  } else {
    authBanner.innerHTML = 'Not signed in. <a href="signin.html?redirect=booking.html" style="color:var(--coral);font-weight:600;">Sign in</a> to save this booking to your account.';
  }

  document.getElementById('confirmPayBtn').addEventListener('click', () => {
    const name = document.getElementById('paymentName').value.trim();
    const card = document.getElementById('paymentCard').value.trim();
    const expiry = document.getElementById('paymentExpiry').value.trim();
    const cvv = document.getElementById('paymentCVV').value.trim();
    const errorBox = document.getElementById('paymentError');

    if (!name || !card || !expiry || !cvv) {
      errorBox.textContent = 'Please complete all payment fields before confirming.';
      errorBox.style.display = 'block';
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    errorBox.style.display = 'none';

    const details = updateSummary();
    const currentSession = KatigAuth.getSession();
    const reference = 'KTG-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const booking = {
      reference,
      email: currentSession ? currentSession.email : null,
      destination: details.destName,
      code: details.destCode,
      checkin: checkinInput.value,
      checkout: checkoutInput.value,
      travelers: details.travelers,
      stay: details.stayName,
      car: details.carName || null,
      total: details.total,
      createdAt: new Date().toISOString()
    };
    KatigStorage.set('bookings:' + reference, JSON.stringify(booking));

    document.getElementById('confirmCode').textContent = details.destCode;
    document.getElementById('confirmDestination').textContent = details.destName;
    document.getElementById('confirmRef').textContent = reference;
    document.getElementById('confirmCheckin').textContent = formatDate(checkinInput.value);
    document.getElementById('confirmCheckout').textContent = formatDate(checkoutInput.value);
    document.getElementById('confirmTravelers').textContent = details.travelers;
    document.getElementById('confirmTotal').textContent = peso(details.total);

    document.getElementById('bookingLayout').style.display = 'none';
    document.querySelector('.stepper').style.display = 'none';
    authBanner.style.display = 'none';
    document.getElementById('confirmationPanel').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  updateSummary();
}

const usersWrap = document.getElementById('usersWrap');
if (usersWrap) {
  const bookingsWrap = document.getElementById('bookingsWrap');
  const storagePill = document.getElementById('storagePill');
  const storageLabel = document.getElementById('storageLabel');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (KatigStorage.isLocal()) {
    storageLabel.textContent = 'Connected to browser localStorage';
  } else {
    storagePill.classList.add('offline');
    storageLabel.textContent = 'Using in-memory fallback (this tab only)';
  }

  const userKeys = KatigStorage.list('users:');
  if (userKeys.length === 0) {
    usersWrap.innerHTML = '<div class="empty-note">No accounts yet. Create one on the Register page.</div>';
  } else {
    const rows = [];
    for (const key of userKeys) {
      const raw = KatigStorage.get(key);
      if (!raw) continue;
      const user = JSON.parse(raw);
      rows.push(
        '<tr><td>' + escapeHtml(user.name) + '</td>' +
        '<td>' + escapeHtml(user.email) + '</td>' +
        '<td><code>' + '•'.repeat(Math.min(user.password.length, 12)) + '</code></td></tr>'
      );
    }
    usersWrap.innerHTML =
      '<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Password</th></tr></thead><tbody>' +
      rows.join('') + '</tbody></table>';
  }

  const bookingKeys = KatigStorage.list('bookings:');
  if (bookingKeys.length === 0) {
    bookingsWrap.innerHTML = '<div class="empty-note">No bookings yet. Confirm one on the Booking page.</div>';
  } else {
    const rows = [];
    for (const key of bookingKeys) {
      const raw = KatigStorage.get(key);
      if (!raw) continue;
      const b = JSON.parse(raw);
      rows.push(
        '<tr><td>' + escapeHtml(b.reference) + '</td>' +
        '<td>' + escapeHtml(b.destination) + '</td>' +
        '<td>' + escapeHtml(b.checkin) + ' → ' + escapeHtml(b.checkout) + '</td>' +
        '<td>' + escapeHtml(b.email || 'Guest') + '</td>' +
        '<td>₱' + Math.round(b.total).toLocaleString('en-PH') + '</td></tr>'
      );
    }
    bookingsWrap.innerHTML =
      '<table class="data-table"><thead><tr><th>Reference</th><th>Destination</th><th>Dates</th><th>Account</th><th>Total</th></tr></thead><tbody>' +
      rows.join('') + '</tbody></table>';
  }
}