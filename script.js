document.addEventListener('DOMContentLoaded', () => {
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

  // Contact Form Handling
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.btn-submit');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoading = submitBtn.querySelector('.btn-loading');
      const btnSuccess = submitBtn.querySelector('.btn-success');
      
      // Show loading state
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
      submitBtn.disabled = true;
      
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success state
      btnLoading.style.display = 'none';
      btnSuccess.style.display = 'flex';
      submitBtn.style.background = '#25D366';
      
      // Reset form after delay
      setTimeout(() => {
        contactForm.reset();
        btnSuccess.style.display = 'none';
        btnText.style.display = 'inline';
        submitBtn.disabled = false;
        submitBtn.style.background = '';
      }, 3000);
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
