// tasbeeh-inline.js - Tasbeeh counter logic
document.addEventListener('DOMContentLoaded', () => {
  const counterDisplay = document.getElementById('counter-display');
  const progressCircleClick = document.getElementById('progress-circle-click');
  const progressPercentage = document.getElementById('progress-percentage');
  const resetBtn = document.getElementById('reset-btn');
  const tasbeehTypeSelect = document.getElementById('tasbeeh-type-select');
  const targetSelect = document.getElementById('target-select');
  const customTargetContainer = document.getElementById('custom-target-container');
  const customTargetInput = document.getElementById('custom-target');
  const countBtn = document.getElementById('count-btn');

  let counter = 0;
  let target = 33;
  let currentProfile = window.profileManager?.getCurrentProfile();

  // Listen for profile change (after login/signup)
  document.addEventListener('profileChanged', () => {
    currentProfile = window.profileManager?.getCurrentProfile();
  });

  /**
   * Update the progress ring SVG and percentage display.
   */
  function updateProgressRing() {
    const radius = 75;
    const circumference = 2 * Math.PI * radius;
    if (target !== Infinity) {
      const progress = (counter / target) * 100;
      const offset = circumference - (progress / 100) * circumference;
      document.querySelector('.progress-ring__circle').style.strokeDashoffset = offset;
      progressPercentage.textContent = Math.min(100, Math.round(progress)) + '%';
    } else {
      document.querySelector('.progress-ring__circle').style.strokeDashoffset = 0;
      progressPercentage.textContent = '∞';
    }
  }

  /**
   * Save tasbeeh stats to the current profile (if available).
   */
  function saveTasbeehStats() {
    if (currentProfile) {
      const tasbeehType = tasbeehTypeSelect.value;
      const stats = currentProfile.tasbeehStats || {
        totalCount: 0,
        history: [],
        favorites: []
      };
      stats.totalCount += 1;
      stats.history.push({
        type: tasbeehType,
        count: 1,
        date: new Date().toISOString()
      });
      // Keep only last 100 records
      if (stats.history.length > 100) {
        stats.history.shift();
      }
      // --- User Analytics Tracking: Prayer Stats ---
      if (!currentProfile.prayerStats) {
        currentProfile.prayerStats = {
          Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
        };
      }
      const currentHour = new Date().getHours();
      let currentPrayer = '';
      if (currentHour >= 4 && currentHour < 12) currentPrayer = 'Fajr';
      else if (currentHour >= 12 && currentHour < 15) currentPrayer = 'Dhuhr';
      else if (currentHour >= 15 && currentHour < 18) currentPrayer = 'Asr';
      else if (currentHour >= 18 && currentHour < 20) currentPrayer = 'Maghrib';
      else currentPrayer = 'Isha';
      if (currentProfile.prayerStats[currentPrayer] !== undefined) {
        currentProfile.prayerStats[currentPrayer]++;
      }
      window.profileManager.saveProfiles();
    }
  }

  /**
   * Create confetti animation when target is reached.
   */
  function createConfetti() {
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = `hsl(${Math.random() * 60 + 30}, 70%, 60%)`;
      confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
      document.body.appendChild(confetti);
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  }

  // --- Custom Dhikr Logic ---
  const customDhikrContainer = document.getElementById('custom-dhikr-container');
  const customDhikrInput = document.getElementById('custom-dhikr');
  const addCustomDhikrBtn = document.getElementById('add-custom-dhikr-btn');
  const customDhikrListDiv = document.getElementById('custom-dhikr-list');

  // Key for localStorage
  const CUSTOM_DHIKR_KEY = 'tasbeehCustomDhikrList';

  // Load custom dhikr from localStorage
  function loadCustomDhikrList() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_DHIKR_KEY)) || [];
    } catch {
      return [];
    }
  }

  // Save custom dhikr to localStorage
  function saveCustomDhikrList(list) {
    localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(list));
  }

  // Render custom dhikr list below input
  function renderCustomDhikrList() {
    const list = loadCustomDhikrList();
    customDhikrListDiv.innerHTML = '';
    list.forEach((dhikr, idx) => {
      const item = document.createElement('span');
      item.className = 'custom-dhikr-list-item';
      item.textContent = dhikr;
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'custom-dhikr-remove-btn';
      removeBtn.title = 'حذف';
      removeBtn.setAttribute('aria-label', 'حذف هذا الذكر');
      removeBtn.textContent = 'حذف'; // Use word instead of icon
      removeBtn.tabIndex = 0;
      removeBtn.onclick = () => {
        // Confirm deletion for better UX
        if (!confirm('هل تريد حذف هذا الذكر المخصص؟')) return;
        // Animate removal
        item.style.transition = 'opacity 0.3s, transform 0.3s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(40px)';
        setTimeout(() => {
          const newList = loadCustomDhikrList();
          newList.splice(idx, 1);
          saveCustomDhikrList(newList);
          renderCustomDhikrList();
          updateCustomDhikrOptions();
          // If current select is this dhikr, reset to default
          if (tasbeehTypeSelect.value === dhikr) {
            tasbeehTypeSelect.value = 'سبحان الله';
            tasbeehTypeSelect.dispatchEvent(new Event('change'));
          }
        }, 300);
      };
      item.appendChild(removeBtn);
      customDhikrListDiv.appendChild(item);
    });
  }

  // Add custom dhikr to select dropdown
  function updateCustomDhikrOptions() {
    // Remove all previous custom options
    Array.from(tasbeehTypeSelect.options).forEach(opt => {
      if (opt.dataset.custom === 'true') tasbeehTypeSelect.removeChild(opt);
    });
    // Insert custom dhikr before the 'إضافة ذكر مخصص...' option
    const list = loadCustomDhikrList();
    const addOptionIdx = Array.from(tasbeehTypeSelect.options).findIndex(opt => opt.value === 'إضافة ذكر مخصص...');
    list.forEach(dhikr => {
      const opt = document.createElement('option');
      opt.value = dhikr;
      opt.textContent = dhikr;
      opt.dataset.custom = 'true';
      tasbeehTypeSelect.insertBefore(opt, tasbeehTypeSelect.options[addOptionIdx]);
    });
  }

  // Show/hide custom dhikr input
  tasbeehTypeSelect.addEventListener('change', () => {
    if (tasbeehTypeSelect.value === 'إضافة ذكر مخصص...') {
      customDhikrContainer.style.display = 'flex';
      customDhikrInput.focus();
    } else {
      customDhikrContainer.style.display = 'none';
    }
  });

  // Add custom dhikr button
  addCustomDhikrBtn.addEventListener('click', () => {
    const val = customDhikrInput.value.trim();
    if (!val) return;
    let list = loadCustomDhikrList();
    if (list.includes(val)) return; // Prevent duplicates
    list.push(val);
    saveCustomDhikrList(list);
    renderCustomDhikrList();
    updateCustomDhikrOptions();
    // Select the new dhikr
    tasbeehTypeSelect.value = val;
    tasbeehTypeSelect.dispatchEvent(new Event('change'));
    customDhikrInput.value = '';
    customDhikrInput.blur();
    // Animate input for feedback
    customDhikrInput.classList.add('input-success');
    setTimeout(() => customDhikrInput.classList.remove('input-success'), 400);
  });

  // Allow Enter key to add
  customDhikrInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      addCustomDhikrBtn.click();
    }
  });

  // On page load, render custom dhikr
  renderCustomDhikrList();
  updateCustomDhikrOptions();

  // If user reloads and had selected a custom dhikr, keep it selected
  // (Handled by browser if <select> value is set, but we ensure options are present)

  // Event listeners
  progressCircleClick.addEventListener('click', () => {
    if (target === Infinity || counter < target) {
      counter++;
      counterDisplay.textContent = counter;
      updateProgressRing();
      saveTasbeehStats();
      
      if (target !== Infinity && counter === target) {
        createConfetti();
      }
      
      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  });

  if (countBtn) {
    countBtn.addEventListener('click', () => {
      if (target === Infinity || counter < target) {
        counter++;
        counterDisplay.textContent = counter;
        updateProgressRing();
        saveTasbeehStats();
        if (target !== Infinity && counter === target) {
          createConfetti();
        }
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    });
  }

  resetBtn.addEventListener('click', () => {
    counter = 0;
    counterDisplay.textContent = counter;
    updateProgressRing();
  });

  targetSelect.addEventListener('change', () => {
    if (targetSelect.value === 'custom') {
      customTargetContainer.style.display = 'flex';
      target = parseInt(customTargetInput.value) || 1;
    } else if (targetSelect.value === 'unlimited') {
      customTargetContainer.style.display = 'none';
      target = Infinity;
    } else {
      customTargetContainer.style.display = 'none';
      target = parseInt(targetSelect.value);
    }
    counter = 0;
    counterDisplay.textContent = counter;
    updateProgressRing();
  });

  customTargetInput.addEventListener('change', () => {
    target = Math.max(1, parseInt(customTargetInput.value) || 1);
    customTargetInput.value = target;
    counter = 0;
    counterDisplay.textContent = counter;
    updateProgressRing();
  });

  // Custom Dhikr Management
  const dhikrWrapper = document.querySelector('.dhikr-select-wrapper');
  const deleteButton = document.querySelector('.delete-dhikr-btn');
  if (deleteButton) {
    deleteButton.innerHTML = 'حذف'; // Use word instead of icon
  }

  // Function to add custom dhikr
  function addCustomDhikr(dhikrText) {
    if (!dhikrText) return;
    
    let list = loadCustomDhikrList();
    if (list.includes(dhikrText)) return; // Prevent duplicates
    
    list.push(dhikrText);
    saveCustomDhikrList(list);
    
    // Add new option to select
    const option = document.createElement('option');
    option.value = dhikrText;
    option.textContent = dhikrText;
    option.dataset.custom = 'true';
    
    // Insert before the "Add custom" option
    const addCustomOption = Array.from(tasbeehTypeSelect.options).find(opt => opt.value === 'إضافة ذكر مخصص...');
    tasbeehTypeSelect.insertBefore(option, addCustomOption);
    
    // Select the new dhikr
    tasbeehTypeSelect.value = dhikrText;
    tasbeehTypeSelect.dispatchEvent(new Event('change'));
  }

  // Handle delete button clicks
  deleteButton.addEventListener('click', () => {
    const selectedOption = tasbeehTypeSelect.options[tasbeehTypeSelect.selectedIndex];
    if (!selectedOption || selectedOption.dataset.custom !== 'true') return;
    
    const dhikrText = selectedOption.value;
    // Confirmation before delete
    if (!confirm('هل تريد حذف هذا الذكر المخصص؟')) return;
    // Remove from localStorage
    const list = loadCustomDhikrList().filter(d => d !== dhikrText);
    saveCustomDhikrList(list);
    // Remove from select
    tasbeehTypeSelect.removeChild(selectedOption);
    // Update the custom dhikr list and dropdown options
    renderCustomDhikrList();
    updateCustomDhikrOptions();
    // Reset selection to first option
    tasbeehTypeSelect.selectedIndex = 0;
    tasbeehTypeSelect.dispatchEvent(new Event('change'));
  });

  // Update UI when selection changes
  tasbeehTypeSelect.addEventListener('change', () => {
    const selectedOption = tasbeehTypeSelect.options[tasbeehTypeSelect.selectedIndex];
    const isCustomDhikr = selectedOption.dataset.custom === 'true';
    
    dhikrWrapper.classList.toggle('has-custom', isCustomDhikr);
    
    if (tasbeehTypeSelect.value === 'إضافة ذكر مخصص...') {
        customDhikrContainer.style.display = 'flex';
        customDhikrInput.focus();
    } else {
        customDhikrContainer.style.display = 'none';
    }
  });

  // Handle custom dhikr input
  addCustomDhikrBtn.addEventListener('click', () => {
    const val = customDhikrInput.value.trim();
    if (!val) return;
    
    addCustomDhikr(val);
    customDhikrInput.value = '';
    customDhikrContainer.style.display = 'none';
  });

  // Allow Enter key to add custom dhikr
  customDhikrInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addCustomDhikrBtn.click();
    }
  });

  // Initialize
  const savedCustomDhikr = loadCustomDhikrList();
  savedCustomDhikr.forEach(dhikr => {
    const option = document.createElement('option');
    option.value = dhikr;
    option.textContent = dhikr;
    option.dataset.custom = 'true';
    
    // Insert before the "Add custom" option
    const addCustomOption = Array.from(tasbeehTypeSelect.options).find(opt => opt.value === 'إضافة ذكر مخصص...');
    tasbeehTypeSelect.insertBefore(option, addCustomOption);
  });
});