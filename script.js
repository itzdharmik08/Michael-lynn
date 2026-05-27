document.addEventListener('DOMContentLoaded', () => {
  // Automatically uses secure Vercel Serverless Proxy in production to protect your URL key, and runs locally in Simulation Mode.
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const WEB_APP_URL = isLocalhost ? 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL' : '/api/bookings';
  const MAX_BOOKINGS_PER_SLOT = 5; // Maximum capacity per slot (5 users)
  const STANDARD_SLOTS = ['09:00 AM', '10:30 AM', '12:00 PM', '01:30 PM', '03:00 PM', '04:30 PM'];

  // Simulated bookings database for fallback/demo mode
  let mockBookings = [
    { date: new Date().toISOString().split('T')[0], time: '09:00 AM', email: 'john@example.com' },
    { date: new Date().toISOString().split('T')[0], time: '09:00 AM', email: 'jane@example.com' }, // Fully booked
    { date: new Date().toISOString().split('T')[0], time: '10:30 AM', email: 'alex@example.com' }, // 1 spot left
    
    // Tomorrow bookings
    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '12:00 PM', email: 'james@example.com' },
    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '12:00 PM', email: 'jill@example.com' }, // Fully booked
    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '01:30 PM', email: 'jake@example.com' }  // 1 spot left
  ];
  // ----------------------------------------

  // Sticky Navbar
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Animated Counters
  const counters = document.querySelectorAll('.counter');
  const animateCounters = () => {
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const speed = 100;
        const inc = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 20);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
  };

  const statsSection = document.querySelector('.stats-grid');
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(statsSection);
  }

  // Pricing Toggle Logic
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const priceBasic = document.getElementById('price-basic');
  const priceStandard = document.getElementById('price-standard');
  const pricePremium = document.getElementById('price-premium');

  const basePrices = { basic: 199, standard: 299, premium: 899 };

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const planType = btn.getAttribute('data-plan');
      let multiplier = 1;
      let suffix = '/mo';

      if (planType === '3month') {
        multiplier = 0.9 * 3;
        suffix = '/3mo';
      }
      if (planType === '6month') {
        multiplier = 0.8 * 6;
        suffix = '/6mo';
      }

      const formatPrice = (base) => {
        return `$${Math.round(base * multiplier)}<span>${suffix}</span>`;
      };

      if (priceBasic) priceBasic.innerHTML = formatPrice(basePrices.basic);
      if (priceStandard) priceStandard.innerHTML = formatPrice(basePrices.standard);
      if (pricePremium) pricePremium.innerHTML = formatPrice(basePrices.premium);
    });
  });

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      faqItems.forEach(faq => {
        faq.classList.remove('active');
        faq.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // Gallery Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-category') === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // --- APPOINTMENT SYSTEM INTERACTIVE LOGIC ---
  const dateInput = document.getElementById('appointmentDate');
  const timeSlotsGrid = document.getElementById('timeSlotsGrid');
  const selectedTimeInput = document.getElementById('selectedTime');
  const contactForm = document.getElementById('contactForm');

  // Disable past dates on calendar picker
  if (dateInput) {
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
    
    // Listen for date changes to render available slots
    dateInput.addEventListener('change', (e) => {
      loadAvailableSlots(e.target.value);
    });
  }

  // Load and render time slots dynamically
  async function loadAvailableSlots(selectedDate) {
    if (!selectedDate) {
      timeSlotsGrid.innerHTML = '<div class="slots-placeholder">Please select a date first</div>';
      selectedTimeInput.value = '';
      return;
    }

    // Show loading spinner
    timeSlotsGrid.innerHTML = `
      <div class="slots-loader">
        <i class="ph ph-spinner ph-spin"></i> Checking availability...
      </div>
    `;
    selectedTimeInput.value = '';

    let bookings = [];

    // 1. Fetch from Google Apps Script if URL is configured
    const isRealAPI = WEB_APP_URL && WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
    if (isRealAPI) {
      try {
        const response = await fetch(WEB_APP_URL, { method: 'GET', mode: 'cors' });
        const result = await response.json();
        if (result.status === 'success') {
          bookings = result.bookings || [];
        } else {
          console.warn('API returned error status, falling back to simulation mode:', result.message);
          bookings = mockBookings;
        }
      } catch (err) {
        console.error('Failed to fetch slots from API, falling back to simulation mode:', err);
        bookings = mockBookings;
      }
    } else {
      // Small simulated latency for natural UX
      await new Promise(resolve => setTimeout(resolve, 600));
      bookings = mockBookings;
    }

    // 2. Count bookings per slot for the selected date
    const slotCounts = {};
    bookings.forEach(b => {
      if (b.date === selectedDate) {
        slotCounts[b.time] = (slotCounts[b.time] || 0) + 1;
      }
    });

    // 3. Check for current-day slots in the past
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;

    // 4. Render slots
    timeSlotsGrid.innerHTML = '';
    
    STANDARD_SLOTS.forEach(slot => {
      let isExpired = false;

      if (isToday) {
        // Parse standard slot time like "10:30 AM" or "01:30 PM"
        const [timePart, modifier] = slot.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        isExpired = now > slotTime;
      }

      const bookingCount = slotCounts[slot] || 0;
      const isFull = bookingCount >= MAX_BOOKINGS_PER_SLOT;

      // Determine visual state classes & status labels
      let statusClass = 'available';
      let isDisabled = false;
      const spotsLeft = MAX_BOOKINGS_PER_SLOT - bookingCount;
      let statusText = `${spotsLeft} / 5 Left`;

      if (isExpired) {
        statusClass = 'expired';
        statusText = 'Expired';
        isDisabled = true;
      } else if (isFull) {
        statusClass = 'full';
        statusText = 'Fully Booked';
        isDisabled = true;
      } else if (bookingCount > 0) {
        statusClass = 'partial';
      }

      // Render 5 visual dots indicators
      let indicatorsHTML = '<div class="slot-indicators">';
      for (let i = 0; i < 5; i++) {
        if (isExpired) {
          indicatorsHTML += '<span class="indicator-dot expired"></span>';
        } else if (isFull) {
          indicatorsHTML += '<span class="indicator-dot taken full"></span>';
        } else {
          if (i < bookingCount) {
            indicatorsHTML += '<span class="indicator-dot taken"></span>';
          } else {
            indicatorsHTML += '<span class="indicator-dot"></span>';
          }
        }
      }
      indicatorsHTML += '</div>';

      // Create button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-slot-btn ${statusClass}`;
      btn.disabled = isDisabled;
      btn.innerHTML = `
        <span class="slot-time">${slot}</span>
        <span class="slot-status">${statusText}</span>
        ${indicatorsHTML}
      `;

      if (!isDisabled) {
        btn.addEventListener('click', () => {
          // Remove selected class from all sibling buttons
          timeSlotsGrid.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedTimeInput.value = slot;
        });
      }

      timeSlotsGrid.appendChild(btn);
    });

    if (timeSlotsGrid.children.length === 0) {
      timeSlotsGrid.innerHTML = '<div class="slots-placeholder">No slots available for this date.</div>';
    }
  }

  // --- CUSTOM POPUP MODAL LOGIC ---
  const customModal = document.getElementById('customModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalActionBtn = document.getElementById('modalActionBtn');

  function showAlert(title, message, type = 'success') {
    if (!customModal) return;
    
    // Set status classes and values
    customModal.className = `custom-modal active ${type}`;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    if (type === 'success') {
      modalIcon.innerHTML = '<i class="ph-fill ph-check-circle"></i>';
      modalActionBtn.style.background = '#25D366';
      modalActionBtn.style.color = '#FFFFFF';
      modalActionBtn.textContent = 'Awesome!';
    } else {
      modalIcon.innerHTML = '<i class="ph-fill ph-warning-circle"></i>';
      modalActionBtn.style.background = '#FF3B30';
      modalActionBtn.style.color = '#FFFFFF';
      modalActionBtn.textContent = 'Understood';
    }
  }

  function hideAlert() {
    if (customModal) {
      customModal.classList.remove('active');
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideAlert);
  if (modalActionBtn) modalActionBtn.addEventListener('click', hideAlert);
  if (customModal) {
    customModal.querySelector('.modal-overlay').addEventListener('click', hideAlert);
  }

  // Appointment Form Submit Handling
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Double-check time slot selection
      if (!selectedTimeInput.value) {
        showAlert('Selection Required', 'Please select an available time slot before submitting.', 'error');
        return;
      }
      
      const submitBtn = contactForm.querySelector('.btn-submit');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const btnSuccess = submitBtn.querySelector('.btn-success');
      
      // Show loading/booking state
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      submitBtn.disabled = true;

      const selectedDate = dateInput.value;
      const selectedTime = selectedTimeInput.value;
      
      const isRealAPI = WEB_APP_URL && WEB_APP_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
      let success = false;
      let errorMsg = 'Failed to book appointment. Please try again.';

      if (isRealAPI) {
        // Send GET request to Google Apps Script to bypass POST CORS redirect limitations
        try {
          const formData = new FormData(contactForm);
          const queryParams = new URLSearchParams(formData).toString();
          const response = await fetch(`${WEB_APP_URL}?${queryParams}`, {
            method: 'GET',
            mode: 'cors'
          });
          const result = await response.json();
          if (result.status === 'success') {
            success = true;
          } else {
            errorMsg = result.message || errorMsg;
          }
        } catch (err) {
          console.error('API submission error:', err);
          errorMsg = 'Connection to booking server lost. Please try again.';
        }
      } else {
        // Simulation mode check for instant visual verification
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        const emailInput = contactForm.querySelector('#email').value.trim().toLowerCase();
        
        // 1. Check if this same user (email) already has a booking on the same day in simulation
        const emailExists = mockBookings.some(b => b.date === selectedDate && b.email === emailInput);
        if (emailExists) {
          success = false;
          errorMsg = 'You have already booked an appointment for this date. Only one appointment per day is allowed.';
        } else {
          // Count in-memory bookings for double booking check
          const activeBookings = mockBookings.filter(b => b.date === selectedDate && b.time === selectedTime).length;
          if (activeBookings >= MAX_BOOKINGS_PER_SLOT) {
            success = false;
            errorMsg = 'This slot was just booked by someone else! Please choose another time.';
          } else {
            // Record booking locally in simulation database
            mockBookings.push({
              date: selectedDate,
              time: selectedTime,
              email: emailInput
            });
            success = true;
          }
        }
      }
      
      // Update submitting feedback
      btnLoading.style.display = 'none';
      
      if (success) {
        btnSuccess.style.display = 'flex';
        submitBtn.style.background = '#25D366';
        
        // Reset and refresh form after visual delay and show success popup
        setTimeout(() => {
          showAlert('Booking Confirmed!', 'Your appointment is booked and locked. We have sent the confirmation to your email!', 'success');
          contactForm.reset();
          loadAvailableSlots(''); // Clear slots view
          btnSuccess.style.display = 'none';
          btnText.style.display = 'inline';
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 1200);
      } else {
        // Friendly custom modal popup for error (like same-day restriction) and reload slots list
        showAlert('Booking Restricted', errorMsg, 'error');
        btnText.style.display = 'inline';
        submitBtn.disabled = false;
        await loadAvailableSlots(selectedDate);
      }
    });
  }

  // WhatsApp Popup Toggle
  window.toggleWhatsAppPopup = function() {
    const popup = document.getElementById('whatsappPopup');
    popup.classList.toggle('active');
  };

  // Close WhatsApp popup when clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('whatsappPopup');
    const float = document.getElementById('whatsappFloat');
    
    if (popup && float && popup.classList.contains('active')) {
      if (!popup.contains(e.target) && !float.contains(e.target)) {
        popup.classList.remove('active');
      }
    }
  });

  // Intersection Observer for Contact Section Animation
  const contactCards = document.querySelectorAll('.contact-card');
  const contactFormWrapper = document.querySelector('.contact-form-wrapper');
  
  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.2 });

  contactCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    contactObserver.observe(card);
  });

  if (contactFormWrapper) {
    contactFormWrapper.style.opacity = '0';
    contactFormWrapper.style.transform = 'translateX(30px)';
    contactFormWrapper.style.transition = 'all 0.8s ease 0.3s';
    contactObserver.observe(contactFormWrapper);
  }

  // Form Input Focus Effects
  const formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
      if (!input.value) {
        input.parentElement.classList.remove('focused');
      }
    });
  });

  // Mobile Navigation Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  let isMenuOpen = false;

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      isMenuOpen = !isMenuOpen;
      mobileNav.classList.toggle('active');
      
      // Change icon
      const icon = mobileMenuBtn.querySelector('i');
      if (isMenuOpen) {
        icon.classList.remove('ph-list');
        icon.classList.add('ph-x');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      } else {
        icon.classList.remove('ph-x');
        icon.classList.add('ph-list');
        document.body.style.overflow = ''; // Restore scrolling
      }
    });

    // Close menu when clicking on a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });
  }

  // Close mobile nav function (global for onclick)
  window.closeMobileNav = function() {
    isMenuOpen = false;
    mobileNav.classList.remove('active');
    const icon = mobileMenuBtn.querySelector('i');
    icon.classList.remove('ph-x');
    icon.classList.add('ph-list');
    document.body.style.overflow = '';
  };

  // Close mobile menu on window resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && isMenuOpen) {
      closeMobileNav();
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.offsetTop - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});
