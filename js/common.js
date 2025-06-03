// common.js - Shared logic for dark mode, sidebar, qibla, prayer times, and UI enhancements
(function() {
  "use strict";

  /*** Dark mode toggle logic ***/
  const darkToggleBtn = document.getElementById('darkmode-toggle');
  const darkKnob = document.getElementById('darkmode-knob');
  const sunEmoji = document.getElementById('darkmode-emoji-sun');
  const moonEmoji = document.getElementById('darkmode-emoji-moon');
  let darkOn = false;
  
  /**
   * Set dark mode on or off.
   * @param {boolean} on
   */
  function setDarkMode(on) {
    document.documentElement.classList.toggle('dark', on);
    document.body.classList.toggle('darkmode', on);
    // Move knob
    darkKnob.style.left = on ? '25px' : '3px';
    // Toggle sun/moon icons
    if (sunEmoji && moonEmoji) {
      if (on) {
        sunEmoji.style.opacity = '0';  
        sunEmoji.style.zIndex = '1';
        moonEmoji.style.opacity = '1'; 
        moonEmoji.style.zIndex = '3';
      } else {
        sunEmoji.style.opacity = '1';  
        sunEmoji.style.zIndex = '3';
        moonEmoji.style.opacity = '0'; 
        moonEmoji.style.zIndex = '1';
      }
    }
    // Toggle background color of button
    if (darkToggleBtn) {
      darkToggleBtn.style.background = on ? '#7c5c1e' : '#e0c97f';
    }
    darkOn = on;
    
    // Store the preference
    localStorage.setItem('darkMode', on ? 'true' : 'false');
  }

  if (darkToggleBtn) {
    darkToggleBtn.onclick = function() {
      setDarkMode(!darkOn);
      // Hide the profile sidebar if open
      if (SidebarManager.isOpen) {
        SidebarManager.toggleSidebar(false);
      }
    };
  }
  
  // Initialize dark mode from saved preference or system preference
  const savedDarkMode = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setDarkMode(savedDarkMode ? savedDarkMode === 'true' : prefersDark);

  // Listen for system dark mode changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('darkMode') === null) {
      setDarkMode(e.matches);
    }
  });

  /*** Qibla Compass & Prayer Times (only on index page) ***/
  const qiblaArrow = document.getElementById('qibla-arrow');
  const prayerList = document.getElementById('prayer-times-list');
  // Check if Qibla/prayer section exists (to run only on main page)
  if (qiblaArrow && prayerList) {
    // Coordinates of Kaaba in Mecca
    const KAABA_LAT = 21.4225;
    const KAABA_LON = 39.8262;
    let qiblaBearing = null;
    let currentLocation = null;

    // Try to get saved location
    const savedLocation = JSON.parse(localStorage.getItem('userLocation'));
    if (savedLocation) {
      currentLocation = savedLocation;
    }

    /**
     * Calculate Qibla direction (bearing from current location to Kaaba).
     */
    function calculateQiblaDirection(lat, lon) {
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        console.error('Invalid coordinates provided to calculateQiblaDirection');
        return 0;
      }
      const phi = lat * Math.PI / 180.0;
      const lambda = lon * Math.PI / 180.0;
      const phiK = KAABA_LAT * Math.PI / 180.0;
      const lambdaK = KAABA_LON * Math.PI / 180.0;
      
      // Great circle bearing calculation
      const y = Math.sin(lambdaK - lambda) * Math.cos(phiK);
      const x = Math.cos(phi) * Math.sin(phiK) - 
               Math.sin(phi) * Math.cos(phiK) * Math.cos(lambdaK - lambda);
      const bearing = Math.atan2(y, x) * 180.0 / Math.PI;
      
      // Normalize to 0-360
      return (bearing + 360) % 360;
    }

    /**
     * Handle device orientation event to rotate Qibla arrow.
     */
    function handleOrientation(e) {
      if (qiblaBearing === null) return;

      let heading;
      if (e.webkitCompassHeading !== undefined) {
        // iOS devices
        heading = e.webkitCompassHeading;
      } else if (e.absolute === true && e.alpha !== null) {
        // Android devices with absolute orientation
        heading = 360 - e.alpha;
      } else if (e.alpha !== null) {
        // Fallback for other devices
        heading = e.alpha;
        // Try to correct for screen orientation
        if (window.screen.orientation) {
          const screenOrientation = window.screen.orientation.type;
          if (screenOrientation.includes('landscape')) {
            heading = e.alpha + 90;
          }
        }
      } else {
        console.warn('Device orientation data not available');
        return;
      }

      // Normalize heading to 0-360
      heading = ((heading % 360) + 360) % 360;

      // Calculate rotation needed (Qibla relative to device heading)
      const rotation = qiblaBearing - heading;

      // Apply rotation with smooth transition
      if (qiblaArrow) {
        qiblaArrow.style.transition = 'transform 0.2s ease-out';
        qiblaArrow.style.transform = `rotate(${rotation}deg)`;
      }

      // Update bearing display (show Qibla direction, not device heading)
      const bearingDisplay = document.getElementById('qibla-bearing-display');
      if (bearingDisplay) {
        const dirLetter = (qiblaBearing >= 315 || qiblaBearing < 45) ? 'N'
                         : (qiblaBearing < 135) ? 'E'
                         : (qiblaBearing < 225) ? 'S' : 'W';
        bearingDisplay.textContent = `${dirLetter} ${Math.round(qiblaBearing)}°`;
      }
    }

    /**
     * Start listening to compass events (with permission for iOS if needed).
     */
    function startCompass() {
      const btn = document.getElementById('qibla-start');
      if (btn) btn.style.display = 'none';

      // First check if device has the required sensors
      if (!window.DeviceOrientationEvent) {
        alert('عذراً، جهازك لا يدعم استخدام البوصلة.');
        if (btn) btn.style.display = 'inline-block';
        return;
      }

      // iOS 13+ requires permission prompt
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              initializeCompass();
            } else {
              alert('لم يتم منح إذن استخدام البوصلة.');
              if (btn) btn.style.display = 'inline-block';
            }
          })
          .catch(error => {
            console.error('Error requesting device orientation permission:', error);
            alert('حدث خطأ أثناء طلب إذن استخدام البوصلة.');
            if (btn) btn.style.display = 'inline-block';
          });
      } else {
        // Other devices: start directly
        initializeCompass();
      }
    }

    function initializeCompass() {
      // Remove any existing listeners first
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
      
      // Try absolute orientation first
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
      
      // Add error handling for sensor
      window.addEventListener('compassneedscalibration', function(event) {
        alert('يرجى معايرة البوصلة عن طريق تحريك هاتفك في شكل رقم 8.');
      });
    }

    /**
     * Fetch prayer times via Aladhan API.
     */
    function fetchPrayerTimes(lat, lon) {
      // Use HTTPS and allow method selection
      const method = localStorage.getItem('currentPrayerMethod') || '4';
      const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=1`;
      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.data || !data.data.timings) {
            throw new Error('Invalid prayer times data');
          }
          const timings = data.data.timings;
          const prayerNames = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
          const order = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
          // Clear the list
          prayerList.innerHTML = '';
          // Get current and next prayer
          const { current, next } = getCurrentAndNextPrayerTime(timings);
          // Create and append prayer time cards
          order.forEach(key => {
            if (timings[key]) {
              const time = timings[key];
              const nameAr = prayerNames[key];
              const isCurrent = current && current.name === key;
              const card = createPrayerTimeCard(nameAr, time, isCurrent);
              prayerList.appendChild(card);
            }
          });
        })
        .catch(err => {
          console.error('Prayer times error:', err);
          prayerList.innerHTML = `
            <li class="p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 text-center">
              تعذر جلب مواقيت الصلاة. الرجاء المحاولة لاحقًا
            </li>
          `;
        });
    }

    /**
     * Unified location handling (async).
     */
    async function fetchLocation() {
      if (currentLocation) return currentLocation;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        return {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
      } catch {
        return { lat: KAABA_LAT, lon: KAABA_LON }; // Default to Mecca
      }
    }

    // Geolocation to get current coordinates and then fetch prayer times + compute Qibla
    (async function() {
      const loc = await fetchLocation();
      currentLocation = loc;
      updateQiblaDirection(loc.lat, loc.lon);
      fetchPrayerTimes(loc.lat, loc.lon);
    })();

    function updateQiblaDirection(lat, lon) {
      // Calculate Qibla bearing from current location
      let bearing = calculateQiblaDirection(lat, lon);
      if (bearing < 0) bearing += 360; // normalize to 0-360
      qiblaBearing = bearing;
      // Display Qibla direction as cardinal letter and angle
      const bearingDisplay = document.getElementById('qibla-bearing-display');
      if (bearingDisplay) {
        const dirLetter = (qiblaBearing >= 315 || qiblaBearing < 45) ? 'N'
                         : (qiblaBearing < 135) ? 'E'
                         : (qiblaBearing < 225) ? 'S' : 'W';
        const angle = Math.round(qiblaBearing);
        bearingDisplay.textContent = `${dirLetter} ${angle}°`;
      }
    }

    // Set up compass activation button logic
    const qiblaBtn = document.getElementById('qibla-start');
    if (qiblaBtn) {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS – show button to activate compass
        qiblaBtn.style.display = 'inline-block';
        qiblaBtn.onclick = startCompass;
      } else {
        // Other devices – start compass immediately, no button needed
        startCompass();
        // (Button remains hidden)
      }
    }

    // --- Next Prayer Countdown ---
    /**
     * Get next prayer time from timings object.
     */
    function getNextPrayerTime(timings) {
      // Only consider Fajr, Dhuhr, Asr, Maghrib, Isha
      const order = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
      const now = new Date();
      let nextPrayer = null;
      let minDiff = Infinity;
      order.forEach(key => {
        if (timings[key]) {
          // Parse time (HH:MM)
          const [h, m] = timings[key].split(":");
          const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
          let diff = (prayerDate - now) / 1000; // seconds
          if (diff < -60) diff += 24*3600; // if already passed, add 24h
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = { name: key, time: prayerDate };
          }
        }
      });
      return nextPrayer;
    }

    /**
     * Update countdown timer for next prayer.
     */
    function updateCountdown(prayerName, prayerTime) {
      const countdownDiv = document.getElementById('next-prayer-countdown');
      if (!countdownDiv) return;
      function pad(n) { return n < 10 ? '0'+n : n; }
      function tick() {
        const now = new Date();
        let diff = Math.floor((prayerTime - now) / 1000);
        if (diff < 0) diff += 24*3600;
        const h = Math.floor(diff/3600), m = Math.floor((diff%3600)/60), s = diff%60;
        const namesAr = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
        countdownDiv.innerHTML = `الصلاة القادمة: <b>${namesAr[prayerName]||prayerName}</b> بعد ${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      tick();
      if (window._prayerCountdownInterval) clearInterval(window._prayerCountdownInterval);
      window._prayerCountdownInterval = setInterval(tick, 1000);
    }

    // --- Insert new function to get current and next prayer ---
    /**
     * Get current and next prayer time from timings.
     */
    function getCurrentAndNextPrayerTime(timings) {
      const order = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
      const now = new Date();
      let current = null;
      let next = null;
      let prevPrayerTime = null;
      let prevPrayerName = null;
      for (let i = 0; i < order.length; i++) {
        const key = order[i];
        if (timings[key]) {
          const [h, m] = timings[key].split(":");
          const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
          if (now >= prayerDate) {
            current = { name: key, time: prayerDate };
          } else if (!next) {
            next = { name: key, time: prayerDate };
            break;
          }
          prevPrayerTime = prayerDate;
          prevPrayerName = key;
        }
      }
      // If after Isha, current is Isha and next is Fajr of next day
      if (!next && current) {
        const [h, m] = timings['Fajr'].split(":");
        const fajrNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, m);
        next = { name: 'Fajr', time: fajrNextDay };
      }
      // If before Fajr, current is Isha of previous day (optional: can be null)
      if (!current && next) {
        // Before Fajr
        current = { name: 'Isha', time: null };
      }
      return { current, next };
    }

    // --- Patch prayer times logic to add countdown ---
    const origFetchPrayerTimes = window.fetch;
    window.fetch = function(...args) {
      return origFetchPrayerTimes.apply(this, args).then(res => {
        // Patch only for Aladhan timings API
        if (args[0] && args[0].toString().includes('aladhan.com/v1/timings')) {
          res.clone().json().then(data => {
            if (data && data.data && data.data.timings) {
              const { next } = getCurrentAndNextPrayerTime(data.data.timings);
              if (next) updateCountdown(next.name, next.time);
            }
          });
        }
        return res;
      });
    };
  }

  /*** Manual Location Handling ***/
  const manualLocationBtn = document.getElementById('manual-location');
  const locationModal = document.getElementById('location-modal');
  const saveLocationBtn = document.getElementById('save-location');
  const cancelLocationBtn = document.getElementById('cancel-location');
  
  if (manualLocationBtn && locationModal) {
    manualLocationBtn.addEventListener('click', () => {
      locationModal.classList.remove('hidden');
    });
    
    saveLocationBtn.addEventListener('click', () => {
      const lat = parseFloat(document.getElementById('manual-lat').value);
      const lon = parseFloat(document.getElementById('manual-lon').value);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        currentLocation = { lat, lon };
        localStorage.setItem('userLocation', JSON.stringify(currentLocation));
        locationModal.classList.add('hidden');
        // Refresh prayer times and qibla
        if (typeof fetchPrayerTimes === 'function') {
          fetchPrayerTimes(lat, lon);
        }
        if (typeof updateQiblaDirection === 'function') {
          updateQiblaDirection(lat, lon);
        }
      } else {
        alert('الرجاء إدخال إحداثيات صالحة');
      }
    });
    
    cancelLocationBtn.addEventListener('click', () => {
      locationModal.classList.add('hidden');
    });
  }

  /*** Prayer Times Display Enhancement ***/
  /**
   * Create a prayer time card element.
   */
  function createPrayerTimeCard(nameAr, time, isNext = false) {
    const card = document.createElement('li');
    card.className = `flex justify-between items-center p-3 rounded-lg transition-all duration-300 ${
      isNext ? 'bg-golden-light dark:bg-golden text-white font-bold shadow-md' : 'bg-white/50 dark:bg-darkbg/50'
    }`;
    card.setAttribute('data-prayer', nameAr);

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 flex items-center justify-center rounded-full ${
          isNext ? 'bg-white/20 dark:bg-black/20' : 'bg-golden-light/20 dark:bg-golden/20'
        }">
          ${getIconForPrayer(nameAr)}
        </div>
        <span class="text-lg">${nameAr}</span>
      </div>
      <span class="text-lg ${isNext ? 'text-white' : 'text-golden-dark dark:text-golden-light'}">${time}</span>
    `;
    
    return card;
  }

  function getIconForPrayer(name) {
    switch (name) {
      case 'الفجر':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a67c2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="M5.22 5.22l1.42 1.42"/><path d="M2 12h2"/><path d="M5.22 18.78l1.42-1.42"/><path d="M12 20v2"/><path d="M18.78 18.78l-1.42-1.42"/><path d="M20 12h2"/><path d="M18.78 5.22l-1.42 1.42"/><circle cx="12" cy="12" r="5"/></svg>';
      case 'الشروق':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e0c97f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="M5.22 5.22l1.42 1.42"/><path d="M2 12h2"/><path d="M5.22 18.78l1.42-1.42"/><path d="M12 20v2"/><path d="M18.78 18.78l-1.42-1.42"/><path d="M20 12h2"/><path d="M18.78 5.22l-1.42 1.42"/><circle cx="12" cy="16" r="5"/></svg>';
      case 'الظهر':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e0c97f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>';
      case 'العصر':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a67c2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 12l3 3"/></svg>';
      case 'المغرب':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e07c2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M2 20h20"/><path d="M7 20v2"/><path d="M17 20v2"/></svg>';
      case 'العشاء':
        return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#23201a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M17 17l4 4"/><path d="M3 21l4-4"/></svg>';
      default:
        return '';
    }
  }
  // Sidebar Management
  const SidebarManager = {
    MOVE_THRESHOLD: 15,      // Pixels to consider as movement
    TAP_TIME_THRESHOLD: 250, // Max ms for a tap
    TOUCH_DEBOUNCE: 400,     // Ms between touches
    SWIPE_THRESHOLD: 50,     // Pixels for swipe

    init: async function() {
      try {
        const resp = await fetch('components/sidebar.html');
        const html = await resp.text();
        const placeholder = document.getElementById('profile-sidebar-container');
        if (!placeholder) return;

        placeholder.insertAdjacentHTML('beforebegin', html);
        this.setupSidebar();

        // Settings link (placeholder)
        const settingsLink = document.getElementById('sidebar-settings-link');
        if (settingsLink) {
          settingsLink.addEventListener('click', e => {
            e.preventDefault();
            alert('صفحة الإعدادات ستتوفر قريبًا.');
          });
        }
      } catch (error) {
        console.error('Failed to load sidebar:', error);
        this.handleError('فشل في تحميل القائمة الجانبية');
      }
    },

    setupSidebar: function() {
      this.sidebar = document.getElementById('profile-sidebar');
      this.profileBtn = document.getElementById('profile-slider-btn');
      this.closeBtn = document.getElementById('close-profile-sidebar');
      this.isOpen = false;
      this.lastTouchTime = 0;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchStartTime = 0;
      this.isTouchMoved = false;

      if (!this.sidebar || !this.profileBtn || !this.closeBtn) return;

      this.setupEventListeners();
      this.setupAccessibility();
    },

    setupEventListeners: function() {
      // Touch handling for mobile
      this.profileBtn.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      this.profileBtn.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.profileBtn.addEventListener('touchend', this.handleTouchEnd.bind(this));

      // Click handling for desktop
      this.profileBtn.addEventListener('click', (e) => {
        if (!('ontouchstart' in window)) {
          this.toggleSidebar(!this.isOpen);
          e.stopPropagation();
        }
      });

      // Close button handler
      this.closeBtn.addEventListener('click', (e) => {
        this.toggleSidebar(false);
        e.stopPropagation();
      });      // Outside click handler
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.sidebar.contains(e.target) && e.target !== this.profileBtn) {
          this.toggleSidebar(false);
        }
      });

      // Overlay click handler
      document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
        if (this.isOpen) {
          this.toggleSidebar(false);
        }
      });

      // Stop propagation inside sidebar
      this.sidebar.addEventListener('click', e => e.stopPropagation());

      // Swipe to close
      this.sidebar.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
      }, { passive: true });      this.sidebar.addEventListener('touchmove', (e) => {
        if (!this.isOpen) return;
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.touchStartX; // LTR: swipe left to close
        if (deltaX < -this.SWIPE_THRESHOLD) {
          this.toggleSidebar(false);
        }
      }, { passive: true });

      // Escape key handler
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.toggleSidebar(false);
        }
      });
    },

    setupAccessibility: function() {
      this.sidebar.setAttribute('role', 'navigation');
      this.sidebar.setAttribute('aria-label', 'قائمة جانبية');
      this.profileBtn.setAttribute('aria-expanded', 'false');
      this.profileBtn.setAttribute('aria-controls', 'profile-sidebar');
      this.closeBtn.setAttribute('aria-label', 'إغلاق القائمة');
    },

    handleTouchStart: function(e) {
      if (e.touches.length !== 1) return; // Prevent multi-touch
      e.preventDefault();
      
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isTouchMoved = false;
    },

    handleTouchMove: function(e) {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartX);
      const deltaY = Math.abs(touch.clientY - this.touchStartY);

      // Only mark as moved if primarily horizontal movement
      if (deltaX > this.MOVE_THRESHOLD && deltaX > deltaY) {
        this.isTouchMoved = true;
      }
    },

    handleTouchEnd: function(e) {
      e.preventDefault();
      const touchDuration = Date.now() - this.touchStartTime;
      const now = Date.now();

      // Debounce rapid touches
      if (now - this.lastTouchTime < this.TOUCH_DEBOUNCE) return;
      this.lastTouchTime = now;

      // Only toggle on quick tap without movement
      if (!this.isTouchMoved && touchDuration < this.TAP_TIME_THRESHOLD) {
        this.toggleSidebar(!this.isOpen);
      }
    },    toggleSidebar: function(open) {
        if (open === this.isOpen) return;
        
        const overlay = document.getElementById('sidebar-overlay');
        const scrollY = window.scrollY;
        
        this.isOpen = open;
        
        if (open) {
            // Store the scrollbar width before hiding overflow
            document.documentElement.style.setProperty('--scrollbar-width', getScrollbarWidth() + 'px');
            document.body.classList.add('sidebar-open');
            this.sidebar.style.left = '0';
            if (overlay) overlay.classList.add('active');
        } else {
            document.body.classList.remove('sidebar-open');
            this.sidebar.style.left = '-280px';
            if (overlay) overlay.classList.remove('active');
            // Reset scrollbar width variable
            document.documentElement.style.setProperty('--scrollbar-width', '0px');
            // Restore scroll position after a brief delay
            setTimeout(() => window.scrollTo(0, scrollY), 50);
        }
        
        this.sidebar.setAttribute('aria-hidden', (!open).toString());
        this.profileBtn.setAttribute('aria-expanded', open.toString());
        this.sidebar.classList.toggle('closing', !open);
    },

    handleError: function(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-state text-center p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg';
      errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle mb-2"></i>
        <p>${message}</p>
      `;
      if (this.sidebar) {
        this.sidebar.appendChild(errorDiv);
      }
    }
  };
  // Initialize sidebar
  SidebarManager.init();

  /*** Ripple effect for buttons ***/
  /**
   * Ripple effect for buttons.
   */
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }
    button.appendChild(circle);
  }

  // Attach ripple effect to all buttons
  document.querySelectorAll('button, .ripple-btn').forEach(btn => {
    btn.addEventListener('click', createRipple);
  });

  /**
   * Update the Hijri date in the footer.
   */
  function updateHijriDate() {
    const today = new Date();
    let hijri = '--/--/----';
    try {
      // Use Islamic calendar if supported
      hijri = new Intl.DateTimeFormat('ar-TN-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(today);
    } catch (e) {
      // Fallback: show Gregorian date
      hijri = today.toLocaleDateString('ar-EG');
    }
    var el = document.getElementById('hijri-date-display');
    if (el) el.textContent = hijri;
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateHijriDate();
    // Update daily (every 24h)
    setInterval(updateHijriDate, 86400000);
  });
})();