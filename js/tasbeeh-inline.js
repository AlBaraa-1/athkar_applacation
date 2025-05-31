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
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = () => {
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

  // Custom Dhikr selection and delete button logic
  const dhikrSelect = document.querySelector('.custom-dhikr-select-row select');
  const deleteBtn = document.querySelector('.selected-dhikr-delete-btn');
  const selectRow = document.querySelector('.custom-dhikr-select-row');

  // Update delete button visibility when select changes
  dhikrSelect.addEventListener('change', () => {
    const selectedOption = dhikrSelect.options[dhikrSelect.selectedIndex];
    const isCustomDhikr = selectedOption.dataset.custom === 'true';
    
    selectRow.classList.toggle('has-custom-selected', isCustomDhikr);
    
    if (isCustomDhikr) {
      deleteBtn.setAttribute('data-dhikr', selectedOption.value);
    } else {
      deleteBtn.removeAttribute('data-dhikr');
    }
  });

  // Handle delete button click
  deleteBtn.addEventListener('click', () => {
    const dhikrToDelete = deleteBtn.getAttribute('data-dhikr');
    if (!dhikrToDelete) return;
    
    // Remove from localStorage
    const customList = loadCustomDhikrList().filter(d => d !== dhikrToDelete);
    saveCustomDhikrList(customList);
    
    // Remove from select
    const optionToRemove = Array.from(dhikrSelect.options)
      .find(opt => opt.value === dhikrToDelete);
    if (optionToRemove) {
      dhikrSelect.removeChild(optionToRemove);
    }
    
    // Reset to first option
    dhikrSelect.selectedIndex = 0;
    selectRow.classList.remove('has-custom-selected');
  });

  // Add custom dhikr to select
  function addCustomDhikrToSelect(dhikrText) {
    const select = document.querySelector('.custom-dhikr-select-row select');
    const option = document.createElement('option');
    option.value = dhikrText;
    option.dataset.custom = 'true';
    
    const optionContent = document.createElement('div');
    optionContent.className = 'custom-dhikr-option';
    
    const dhikrSpan = document.createElement('span');
    dhikrSpan.textContent = dhikrText;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-custom-dhikr';
    deleteButton.innerHTML = '🗑️';
    deleteButton.title = 'حذف';
    
    optionContent.appendChild(dhikrSpan);
    optionContent.appendChild(deleteButton);
    
    // Set the option's text and HTML content
    option.textContent = dhikrText;
    option.innerHTML = optionContent.outerHTML;
    
    select.appendChild(option);
    select.value = dhikrText; // Select the new dhikr
  }

  // Handle delete button clicks
  document.querySelector('.custom-dhikr-select-row').addEventListener('click', (e) => {
    if (e.target.closest('.delete-custom-dhikr')) {
      e.preventDefault();
      e.stopPropagation();
      
      const select = document.querySelector('.custom-dhikr-select-row select');
      const selectedOption = select.options[select.selectedIndex];
      
      if (selectedOption && selectedOption.dataset.custom === 'true') {
        const dhikrText = selectedOption.value;
        
        // Remove from localStorage
        const customList = loadCustomDhikrList().filter(d => d !== dhikrText);
        saveCustomDhikrList(customList);
        
        // Remove from select
        select.removeChild(selectedOption);
        
        // Reset selection to first option
        select.selectedIndex = 0;
      }
    }
  });

  // Initial population of custom dhikr to select (if any exist)
  renderCustomDhikrList();
  updateCustomDhikrOptions();
  const initialCustomDhikrList = loadCustomDhikrList();
  initialCustomDhikrList.forEach(dhikr => {
    addCustomDhikrToSelect(dhikr);
  });
});