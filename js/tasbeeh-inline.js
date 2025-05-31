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
      
      window.profileManager.saveProfiles();
    }
  }

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

  // Initialize
  updateProgressRing();
});