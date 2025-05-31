// common.js - يحتوي على الوظائف المشتركة لجميع الصفحات (الوضع الليلي، القائمة الجانبية، القبلة والأوقات)
(function() {
  "use strict";

  /*** Dark mode toggle logic ***/
  const darkToggleBtn = document.getElementById('darkmode-toggle');
  const darkKnob = document.getElementById('darkmode-knob');
  const sunEmoji = document.getElementById('darkmode-emoji-sun');
  const moonEmoji = document.getElementById('darkmode-emoji-moon');
  let darkOn = false;
  
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
      if (sidebar && sidebarOpen) {
        sidebar.style.left = '-260px';
        sidebarOpen = false;
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

    // Calculate Qibla direction (bearing from current location to Kaaba)
    function calculateQiblaDirection(lat, lon) {
      const phi = lat * Math.PI / 180.0;
      const lambda = lon * Math.PI / 180.0;
      const phiK = KAABA_LAT * Math.PI / 180.0;
      const lambdaK = KAABA_LON * Math.PI / 180.0;
      // Formula for initial bearing (degrees)
      const psi = (180.0/Math.PI) * Math.atan2(
        Math.sin(lambdaK - lambda),
        Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
      );
      return psi;
    }

    // Handle device orientation event to rotate Qibla arrow
    function handleOrientation(e) {
      if (qiblaBearing === null) return;
      const heading = e.webkitCompassHeading ?? ((typeof e.alpha === 'number') ? Math.abs(e.alpha - 360) : 0);
      const rotation = qiblaBearing - heading;
      // Rotate the arrow element (pivot at base center)
      qiblaArrow.style.transform = `rotate(${rotation}deg)`;
    }

    // Start listening to compass events (with permission for iOS if needed)
    function startCompass() {
      // Hide the start button after starting
      const btn = document.getElementById('qibla-start');
      if (btn) btn.style.display = 'none';
      // iOS 13+ requires permission prompt
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else {
            alert('لم يتم منح إذن استخدام البوصلة.');
          }
        }).catch(console.error);
      } else {
        // Other devices: start directly
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }
    }

    // Fetch prayer times via Aladhan API
    function fetchPrayerTimes(lat, lon) {
      const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;
      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.data || !data.data.timings) return;
          const timings = data.data.timings;
          const prayerNames = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
          const order = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
          
          // Clear the list
          prayerList.innerHTML = '';
          
          // Get next prayer time
          const next = getNextPrayerTime(timings);
          
          // Create and append prayer time cards
          order.forEach(key => {
            if (timings[key]) {
              const time = timings[key];
              const nameAr = prayerNames[key];
              const isNext = next && next.name === key;
              const card = createPrayerTimeCard(nameAr, time, isNext);
              prayerList.appendChild(card);
            }
          });
        })
        .catch(err => {
          console.error('Prayer times fetch error:', err);
          prayerList.innerHTML = `
            <li class="p-3 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 text-center">
              تعذّر جلب مواقيت الصلاة
            </li>
          `;
        });
    }

    // Geolocation to get current coordinates and then fetch prayer times + compute Qibla
    if (currentLocation) {
      const { lat, lon } = currentLocation;
      updateQiblaDirection(lat, lon);
      fetchPrayerTimes(lat, lon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        currentLocation = { lat, lon };
        localStorage.setItem('userLocation', JSON.stringify(currentLocation));
        updateQiblaDirection(lat, lon);
        fetchPrayerTimes(lat, lon);
      }, error => {
        console.warn('Geolocation error:', error);
        prayerList.innerHTML = `
          <li class="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200 text-center">
            لم يتم تحديد الموقع. جاري استخدام الموقع الافتراضي.
          </li>
        `;
        // Use default location (Mecca)
        updateQiblaDirection(KAABA_LAT, KAABA_LON);
        fetchPrayerTimes(KAABA_LAT, KAABA_LON);
      });
    } else {
      prayerList.innerHTML = `
        <li class="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200 text-center">
          المتصفح لا يدعم تحديد الموقع. جاري استخدام الموقع الافتراضي.
        </li>
      `;
      // Use default location (Mecca)
      updateQiblaDirection(KAABA_LAT, KAABA_LON);
      fetchPrayerTimes(KAABA_LAT, KAABA_LON);
    }

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

    // --- Patch prayer times logic to add countdown ---
    const origFetchPrayerTimes = window.fetch;
    window.fetch = function(...args) {
      return origFetchPrayerTimes.apply(this, args).then(res => {
        // Patch only for Aladhan timings API
        if (args[0] && args[0].toString().includes('aladhan.com/v1/timings')) {
          res.clone().json().then(data => {
            if (data && data.data && data.data.timings) {
              const next = getNextPrayerTime(data.data.timings);
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
          <span class="text-lg ${isNext ? 'text-white' : 'text-golden dark:text-golden-light'}">
            ${getEmojiForPrayer(nameAr)}
          </span>
        </div>
        <span class="text-lg">${nameAr}</span>
      </div>
      <span class="text-lg ${isNext ? 'text-white' : 'text-golden-dark dark:text-golden-light'}">${time}</span>
    `;
    
    return card;
  }

  function getEmojiForPrayer(name) {
    const emojiMap = {
      'الفجر': '🌅',
      'الظهر': '☀️',
      'العصر': '🌤️',
      'المغرب': '🌅',
      'العشاء': '🌙'
    };
    return emojiMap[name] || '🕌';
  }

  // Sidebar loader and logic
  async function loadSidebar() {
    try {
      const resp = await fetch('components/sidebar.html');
      const html = await resp.text();
      const placeholder = document.getElementById('profile-sidebar-container');
      if (placeholder) {
        placeholder.insertAdjacentHTML('beforebegin', html);
        // Sidebar logic after loading
        const profileBtn = document.getElementById('profile-slider-btn');
        var athkarSidebar = document.getElementById('profile-sidebar');
        var athkarSidebarOpen = false;
        const closeBtn = document.getElementById('close-profile-sidebar');
        
        profileBtn.addEventListener('click', e => {
          athkarSidebar.style.right = '0';
          athkarSidebarOpen = true;
          e.stopPropagation();
        });
        
        closeBtn.addEventListener('click', e => {
          athkarSidebar.style.right = '-280px';
          athkarSidebarOpen = false;
          e.stopPropagation();
        });
        
        document.addEventListener('click', e => {
          if (athkarSidebarOpen && !athkarSidebar.contains(e.target) && e.target !== profileBtn) {
            athkarSidebar.style.right = '-280px';
            athkarSidebarOpen = false;
          }
        });
        
        athkarSidebar.addEventListener('click', e => e.stopPropagation());
        
        // Settings link (placeholder)
        const settingsLink = document.getElementById('sidebar-settings-link');
        if (settingsLink) {
          settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('صفحة الإعدادات ستتوفر قريبًا.');
          });
        }
      }
    } catch (error) {
      console.error('Failed to load sidebar:', error);
    }
  }
  loadSidebar();

  // Ripple effect for buttons
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
    if (ripple) ripple.remove();
    
    button.appendChild(circle);
  }
  
  // Add ripple effect to all buttons
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.addEventListener("click", createRipple);
  }
  
  // Add vibration on mobile for tasbeeh counter
  if ('vibrate' in navigator) {
    const progressCircle = document.getElementById('progress-circle-click');
    if (progressCircle) {
      progressCircle.addEventListener('click', function() {
        navigator.vibrate(10);
      });
    }
  }
})();