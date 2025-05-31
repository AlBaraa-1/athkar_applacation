// Chart.js Integration: Add <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> to your main HTML file.
// profiles.js - Profile Management and Settings
// i18n translations object
const translations = {
  en: {
    analytics: "Analytics",
    switchProfile: "Switch Profile",
    settings: "Settings",
    calculationMethod: "Prayer Calculation Method",
    favorites: "Favorites",
    totalTasbeeh: "Total Tasbeeh",
    prayerConsistency: "Prayer Consistency",
    tasbeehDistribution: "Tasbeeh Distribution",
    close: "Close",
    addProfile: "Add Profile",
    editProfile: "Edit Profile",
    cancel: "Cancel",
    save: "Save",
    emailNotSet: "Email not set",
    backups: "Backups",
    export: "Export",
    import: "Import",
    backupFileCount: "Files: ", // Added for backup modal
    // Add more as needed
  },
  ar: {
    analytics: "التحليلات",
    switchProfile: "تبديل الملف الشخصي",
    settings: "الإعدادات",
    calculationMethod: "طريقة حساب أوقات الصلاة",
    favorites: "المفضلة",
    totalTasbeeh: "إجمالي التسبيح",
    prayerConsistency: "انتظام الصلاة",
    tasbeehDistribution: "توزيع التسبيح",
    close: "إغلاق",
    addProfile: "إضافة ملف شخصي",
    editProfile: "تعديل الملف الشخصي",
    cancel: "إلغاء",
    save: "حفظ",
    emailNotSet: "لم يتم تعيين البريد الإلكتروني",
    backups: "النسخ الاحتياطية",
    export: "تصدير",
    import: "استيراد",
    backupFileCount: "عدد الملفات: ", // Added for backup modal
    // Add more as needed
  }
};

function updateI18n(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

class ProfileManager {
  constructor() {
    this.migrateExistingData();
    
    this.profiles = JSON.parse(localStorage.getItem('userProfiles')) || [
      {
        id: 'default',
        name: 'المستخدم الافتراضي',
        email: '',
        settings: {
          calculationMethod: '4',
          language: 'ar',
          notifications: {
            prayer: true,
            adhkar: true
          },
          location: null,
          darkMode: localStorage.getItem('darkMode') === 'true'
        },
        tasbeehStats: {
          totalCount: 0,
          history: [],
          favorites: []
        }
      }
    ];
    
    this.currentProfileId = localStorage.getItem('currentProfileId') || 'default';
    this.initializeUI();
    this.bindEvents();
  }

  migrateExistingData() {
    if (localStorage.getItem('dataMigrated')) return;

    const defaultProfile = {
      id: 'default',
      name: 'المستخدم الافتراضي',
      email: '',
      settings: {
        calculationMethod: '4',
        language: 'ar',
        notifications: {
          prayer: true,
          adhkar: true
        },
        location: null,
        darkMode: false
      },
      tasbeehStats: {
        totalCount: 0,
        history: [],
        favorites: []
      }
    };

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode !== null) {
      defaultProfile.settings.darkMode = darkMode === 'true';
    }

    const bookmarkedAdhkar = localStorage.getItem('bookmarkedAdhkar');
    if (bookmarkedAdhkar) {
      defaultProfile.bookmarkedAdhkar = JSON.parse(bookmarkedAdhkar);
    }

    const tasbeehStats = localStorage.getItem('tasbeehStats');
    if (tasbeehStats) {
      defaultProfile.tasbeehStats = JSON.parse(tasbeehStats);
    }

    localStorage.setItem('userProfiles', JSON.stringify([defaultProfile]));
    localStorage.setItem('currentProfileId', 'default');
    localStorage.setItem('dataMigrated', 'true');
    this.showToast('تم ترحيل البيانات الموجودة بنجاح');
  }

  initializeUI() {
    this.updateCurrentUserDisplay();
    const currentProfile = this.getCurrentProfile();
    document.getElementById('calculation-method').value = currentProfile.settings.calculationMethod;
    document.getElementById('language-select').value = currentProfile.settings.language;
    document.getElementById('prayer-notifications').checked = currentProfile.settings.notifications.prayer;
    document.getElementById('adhkar-notifications').checked = currentProfile.settings.notifications.adhkar;
    // Set dark mode
    if (currentProfile.settings.darkMode !== undefined) {
      document.documentElement.classList.toggle('dark', currentProfile.settings.darkMode);
    }
    // Update i18n
    updateI18n(currentProfile.settings.language);
    this.updateStatisticsDisplay();
  }

  bindEvents() {
    document.getElementById('switch-profile')?.addEventListener('click', () => this.showProfileSwitchModal());
    document.getElementById('close-profile-modal')?.addEventListener('click', () => this.hideProfileSwitchModal());
    
    document.getElementById('calculation-method')?.addEventListener('change', (e) => this.updateSetting('calculationMethod', e.target.value));
    document.getElementById('language-select')?.addEventListener('change', (e) => {
      this.updateSetting('language', e.target.value);
      updateI18n(e.target.value);
    });
    document.getElementById('prayer-notifications')?.addEventListener('change', (e) => this.updateNotification('prayer', e.target.checked));
    document.getElementById('adhkar-notifications')?.addEventListener('change', (e) => this.updateNotification('adhkar', e.target.checked));
    
    document.getElementById('update-location')?.addEventListener('click', () => this.updateLocation());
    document.getElementById('add-profile')?.addEventListener('click', () => this.showAddProfileModal());
    document.getElementById('edit-profile')?.addEventListener('click', () => this.showEditProfileModal());
    document.getElementById('export-profiles')?.addEventListener('click', () => this.exportProfiles());
    document.getElementById('import-profiles')?.addEventListener('click', () => this.importProfiles());
    document.getElementById('view-backups')?.addEventListener('click', () => this.showBackupListModal());
    document.getElementById('profile-analytics')?.addEventListener('click', () => this.showProfileAnalytics());
  }

  getCurrentProfile() {
    return this.profiles.find(p => p.id === this.currentProfileId) || this.profiles[0];
  }

  updateCurrentUserDisplay() {
    const profile = this.getCurrentProfile();
    const avatar = document.getElementById('current-user-avatar');
    const name = document.getElementById('current-user-name');
    const email = document.getElementById('current-user-email');
    
    if (avatar) avatar.textContent = profile.name.charAt(0);
    if (name) name.textContent = profile.name;
    if (email) email.textContent = profile.email || 'لم يتم تعيين البريد الإلكتروني';
  }

  showProfileSwitchModal() {
    const modal = document.getElementById('profile-switch-modal');
    const profilesList = document.getElementById('profiles-list');
    
    if (!modal || !profilesList) return;
    
    profilesList.innerHTML = '';
    this.profiles.forEach(profile => {
      const profileEl = document.createElement('div');
      profileEl.className = `p-3 rounded-lg cursor-pointer transition-all duration-300 ${
        profile.id === this.currentProfileId 
          ? 'bg-golden-light/20 dark:bg-golden/20' 
          : 'hover:bg-golden-light/10 dark:hover:bg-golden/10'
      }`;
      
      profileEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-golden-light dark:bg-golden flex items-center justify-center text-white">
            ${profile.name.charAt(0)}
          </div>
          <div>
            <h4 class="font-bold text-golden-dark dark:text-golden-light">${profile.name}</h4>
            ${profile.email ? `<p class="text-sm text-golden/70 dark:text-golden-light/70">${profile.email}</p>` : ''}
          </div>
        </div>
      `;
      
      profileEl.addEventListener('click', () => this.switchProfile(profile.id));
      profilesList.appendChild(profileEl);
    });
    
    modal.classList.remove('hidden');
  }

  hideProfileSwitchModal() {
    document.getElementById('profile-switch-modal')?.classList.add('hidden');
  }

  switchProfile(profileId) {
    this.currentProfileId = profileId;
    localStorage.setItem('currentProfileId', profileId);
    this.initializeUI();
    this.hideProfileSwitchModal();
    this.showToast('تم تغيير الملف الشخصي بنجاح');
  }

  updateSetting(key, value) {
    const profile = this.getCurrentProfile();
    profile.settings[key] = value;
    this.saveProfiles();
    this.showToast('تم حفظ الإعدادات');
  }

  updateNotification(type, enabled) {
    const profile = this.getCurrentProfile();
    profile.settings.notifications[type] = enabled;
    this.saveProfiles();
    this.showToast(`تم ${enabled ? 'تفعيل' : 'تعطيل'} التنبيهات`);
  }

  async updateLocation() {
    try {
      const position = await this.getCurrentPosition();
      const profile = this.getCurrentProfile();
      profile.settings.location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      this.saveProfiles();
      this.showToast('تم تحديث الموقع بنجاح');
    } catch (error) {
      this.showToast('تعذر تحديث الموقع', 'error');
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  showAddProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-cream dark:bg-darkbg p-6 rounded-xl w-80 max-w-[90%]">
        <h3 class="text-xl font-bold text-golden-dark dark:text-golden-light mb-4">إضافة ملف شخصي جديد</h3>
        <form id="add-profile-form" class="space-y-4">
          <div>
            <label class="block text-golden-dark dark:text-golden-light text-sm mb-2">الاسم</label>
            <input type="text" required class="w-full bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-2 rounded-lg">
          </div>
          <div>
            <label class="block text-golden-dark dark:text-golden-light text-sm mb-2">البريد الإلكتروني (اختياري)</label>
            <input type="email" class="w-full bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-2 rounded-lg">
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="cancel-btn bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light px-4 py-2 rounded-lg">
              إلغاء
            </button>
            <button type="submit" class="bg-golden-light hover:bg-golden text-white dark:bg-golden dark:hover:bg-golden-dark px-4 py-2 rounded-lg">
              إضافة
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = e.target.elements;
      this.addProfile({
        name: inputs[0].value,
        email: inputs[1].value
      });
      modal.remove();
    });
  }

  showEditProfileModal() {
    const currentProfile = this.getCurrentProfile();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-cream dark:bg-darkbg p-6 rounded-xl w-80 max-w-[90%]">
        <h3 class="text-xl font-bold text-golden-dark dark:text-golden-light mb-4">تعديل الملف الشخصي</h3>
        <form id="edit-profile-form" class="space-y-4">
          <div>
            <label class="block text-golden-dark dark:text-golden-light text-sm mb-2">الاسم</label>
            <input type="text" name="name" required value="${currentProfile.name}" 
              class="w-full bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-2 rounded-lg">
          </div>
          <div>
            <label class="block text-golden-dark dark:text-golden-light text-sm mb-2">البريد الإلكتروني (اختياري)</label>
            <input type="email" name="email" value="${currentProfile.email || ''}"
              class="w-full bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-2 rounded-lg">
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="cancel-btn bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light px-4 py-2 rounded-lg">
              إلغاء
            </button>
            <button type="submit" class="bg-golden-light hover:bg-golden text-white dark:bg-golden dark:hover:bg-golden-dark px-4 py-2 rounded-lg">
              حفظ
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = e.target.elements;
      this.updateProfile({
        ...currentProfile,
        name: inputs[0].value,
        email: inputs[1].value
      });
      modal.remove();
    });
  }

  addProfile(profileData) {
    const newProfile = {
      id: 'profile_' + Date.now(),
      name: profileData.name,
      email: profileData.email,
      settings: {
        calculationMethod: '4',
        language: 'ar',
        notifications: {
          prayer: true,
          adhkar: true
        },
        location: null
      },
      tasbeehStats: {
        totalCount: 0,
        history: [],
        favorites: []
      }
    };

    this.profiles.push(newProfile);
    this.saveProfiles();
    this.switchProfile(newProfile.id);
    this.showToast('تم إضافة الملف الشخصي بنجاح');
  }

  updateProfile(profileData) {
    const index = this.profiles.findIndex(p => p.id === this.currentProfileId);
    if (index !== -1) {
      this.profiles[index] = { ...this.profiles[index], ...profileData };
      this.saveProfiles();
      this.updateCurrentUserDisplay();
      this.showToast('تم تحديث الملف الشخصي بنجاح');
    }
  }

  exportProfiles() {
    const exportData = {
      profiles: this.profiles,
      currentProfileId: this.currentProfileId,
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'athkar_profiles_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.showToast('تم تصدير الملفات الشخصية بنجاح');
  }

  importProfiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = event => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          if (!importedData.profiles || !importedData.currentProfileId || !importedData.version) {
            throw new Error('Invalid backup file format');
          }
          
          this.profiles = importedData.profiles;
          this.currentProfileId = importedData.currentProfileId;
          this.saveProfiles();
          this.initializeUI();
          this.showToast('تم استيراد الملفات الشخصية بنجاح');
        } catch (error) {
          this.showToast('فشل استيراد الملفات الشخصية. الرجاء التحقق من صحة الملف', 'error');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }

  setupAutoBackup() {
    setInterval(() => this.createAutoBackup(), 3600000);
    window.addEventListener('beforeunload', () => this.createAutoBackup());
  }

  createAutoBackup() {
    const backupData = {
      profiles: this.profiles,
      currentProfileId: this.currentProfileId,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    try {
      const backups = JSON.parse(localStorage.getItem('profileBackups') || '[]');
      backups.unshift(backupData);
      if (backups.length > 5) backups.pop();
      localStorage.setItem('profileBackups', JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to create auto-backup:', error);
    }
  }

  async restoreFromBackup(backupIndex = 0) {
    try {
      const backups = JSON.parse(localStorage.getItem('profileBackups') || '[]');
      if (backups.length === 0) {
        this.showToast('لا توجد نسخ احتياطية متاحة', 'error');
        return;
      }

      const backup = backups[backupIndex];
      if (!backup) {
        this.showToast('النسخة الاحتياطية غير موجودة', 'error');
        return;
      }

      this.profiles = backup.profiles;
      this.currentProfileId = backup.currentProfileId;
      this.saveProfiles();
      this.initializeUI();
      this.showToast('تم استعادة النسخة الاحتياطية بنجاح');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      this.showToast('فشل استعادة النسخة الاحتياطية', 'error');
    }
  }

  showBackupListModal() {
    try {
      const backups = JSON.parse(localStorage.getItem('profileBackups') || '[]');
      if (backups.length === 0) {
        this.showToast('لا توجد نسخ احتياطية متاحة', 'error');
        return;
      }
      const currentProfile = this.getCurrentProfile();
      const lang = currentProfile.settings.language || 'ar';
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center';
      modal.innerHTML = `
        <div class="bg-cream dark:bg-darkbg p-6 rounded-xl w-80 max-w-[90%]">
          <h3 class="text-xl font-bold text-golden-dark dark:text-golden-light mb-4" data-i18n="backups">النسخ الاحتياطية المتوفرة</h3>
          <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
            ${backups.map((backup, index) => `
              <button class="w-full text-right bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-3 rounded-lg hover:bg-golden-light/10 dark:hover:bg-golden/10 transition-all duration-300" data-backup-index="${index}">
                <div class="font-bold">${new Date(backup.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                <div class="text-sm text-golden/70 dark:text-golden-light/70" data-i18n="backupFileCount">عدد الملفات: ${backup.profiles.length}</div>
              </button>
            `).join('')}
          </div>
          <div class="flex justify-end gap-2">
            <button class="cancel-btn bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light px-4 py-2 rounded-lg" data-i18n="cancel">
              إلغاء
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      updateI18n(lang);
      modal.querySelectorAll('[data-backup-index]').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.backupIndex);
          this.restoreFromBackup(index);
          modal.remove();
        });
      });
      modal.querySelector('.cancel-btn').addEventListener('click', () => {
        modal.remove();
      });
    } catch (error) {
      console.error('Failed to show backup list:', error);
      this.showToast('فشل عرض النسخ الاحتياطية', 'error');
    }
  }

  // Profile analytics modal
  showProfileAnalytics() {
    const profile = this.getCurrentProfile();
    const lang = profile.settings.language || 'ar';
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-cream dark:bg-darkbg p-6 rounded-xl w-90 max-w-[95%]">
        <h3 class="text-xl font-bold text-golden-dark dark:text-golden-light mb-4">
          ${profile.name} <span data-i18n="analytics">التحليلات</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white/80 dark:bg-darkbg/80 p-4 rounded-lg border border-golden-light">
            <div class="text-center">
              <div class="text-3xl font-bold text-golden-dark dark:text-golden-light">
                ${profile.tasbeehStats.totalCount || 0}
              </div>
              <p class="text-sm text-golden/80" data-i18n="totalTasbeeh">Total Tasbeeh</p>
            </div>
          </div>
          <div class="bg-white/80 dark:bg-darkbg/80 p-4 rounded-lg border border-golden-light">
            <div class="text-center">
              <div class="text-3xl font-bold text-golden-dark dark:text-golden-light">
                ${(profile.tasbeehStats.favorites && profile.tasbeehStats.favorites.length) || 0}
              </div>
              <p class="text-sm text-golden/80" data-i18n="favorites">Favorites</p>
            </div>
          </div>
          <div class="bg-white/80 dark:bg-darkbg/80 p-4 rounded-lg border border-golden-light">
            <div class="text-center">
              <div class="text-3xl font-bold text-golden-dark dark:text-golden-light">
                ${this.getPrayerConsistency(profile)}
              </div>
              <p class="text-sm text-golden/80" data-i18n="prayerConsistency">Prayer Consistency</p>
            </div>
          </div>
        </div>
        <h4 class="font-bold mb-2" data-i18n="tasbeehDistribution">Tasbeeh Distribution</h4>
        <div class="h-40 mb-4" id="tasbeeh-chart"></div>
        <div class="flex justify-end">
          <button class="close-btn bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light px-4 py-2 rounded-lg" data-i18n="close">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.renderTasbeehChart(profile, modal.querySelector('#tasbeeh-chart'));
    updateI18n(lang);
    modal.querySelector('.close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  renderTasbeehChart(profile, container) {
    const types = {};
    if (profile.tasbeehStats && Array.isArray(profile.tasbeehStats.history)) {
      profile.tasbeehStats.history.forEach(entry => {
        types[entry.type] = (types[entry.type] || 0) + entry.count;
      });
    }
    if (window.Chart && container) {
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: Object.keys(types),
          datasets: [{
            data: Object.values(types),
            backgroundColor: [
              '#a67c2e', '#e0c97f', '#7c5c1e', '#f9e7b3', '#d4b96a'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    } else if (container) {
      container.innerHTML = '<p class="text-center py-8">Chart library not loaded</p>';
    }
  }

  getPrayerConsistency(profile) {
    if (!profile.prayerStats) return "0%";
    const totalPrayers = Object.values(profile.prayerStats).reduce((sum, val) => sum + val, 0);
    const maxPossible = Object.keys(profile.prayerStats).length * 30; // 30 days
    return Math.round((totalPrayers / maxPossible) * 100) + '%';
  }

  updateStatisticsDisplay() {
    const profile = this.getCurrentProfile();
    // Update statistics
    document.getElementById('stat-total-tasbeeh').textContent = 
      profile.tasbeehStats?.totalCount || 0;
    document.getElementById('stat-favorites').textContent = 
      profile.tasbeehStats?.favorites?.length || 0;
    const consistency = this.calculatePrayerConsistency(profile);
    document.getElementById('stat-prayer-consistency').textContent = 
      `${consistency}%`;
    document.getElementById('prayer-progress').style.width = `${consistency}%`;
    // Render chart
    this.renderTasbeehChart(profile);
  }

  calculatePrayerConsistency(profile) {
    if (!profile.prayerStats) return 0;
    const totalDays = Object.keys(profile.prayerStats).length;
    const totalPrayers = Object.values(profile.prayerStats).reduce((sum, count) => sum + count, 0);
    return Math.round((totalPrayers / (totalDays * 5)) * 100);
  }

  saveProfiles() {
    localStorage.setItem('userProfiles', JSON.stringify(this.profiles));
    localStorage.setItem('currentProfileId', this.currentProfileId);
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform translate-y-full opacity-0 transition-all duration-300 ${
      type === 'success' ? 'bg-golden text-white' : 'bg-red-500 text-white'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      toast.style.transform = 'translateY(full)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Add user authentication and JSON-based storage
class AuthManager {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    this.initAuthUI();
  }

  syncProfileWithUser(user) {
    // Find or create a profile for the user
    const pm = window.profileManager;
    let profile = pm.profiles.find(p => p.email === user.email);
    if (!profile) {
      profile = {
        id: 'profile_' + Date.now(),
        name: user.name,
        email: user.email,
        settings: {
          calculationMethod: '4',
          language: 'ar',
          notifications: { prayer: true, adhkar: true },
          location: null
        },
        tasbeehStats: { totalCount: 0, history: [], favorites: [] }
      };
      pm.profiles.push(profile);
    }
    pm.currentProfileId = profile.id;
    pm.saveProfiles();
    pm.initializeUI();
    document.dispatchEvent(new Event('profileChanged'));
  }

  saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  saveCurrentUser(user) {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  signup(name, email, password) {
    if (this.users.find(u => u.email === email)) {
      return { success: false, message: 'Email already exists.' };
    }
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this!
      stats: { tasbeeh: 0, prayers: 0 }
    };
    this.users.push(user);
    this.saveUsers();
    this.saveCurrentUser(user);
    this.syncProfileWithUser(user);
    return { success: true };
  }

  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Invalid credentials.' };
    this.saveCurrentUser(user);
    this.syncProfileWithUser(user);
    return { success: true };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  initAuthUI() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const userName = document.getElementById('current-user-name');
    const userEmail = document.getElementById('current-user-email');
    const userAvatar = document.getElementById('current-user-avatar');
    const authSection = document.getElementById('auth-section');

    if (showSignup) showSignup.onclick = (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    };
    if (showLogin) showLogin.onclick = (e) => {
      e.preventDefault();
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    };
    if (loginForm) loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const result = this.login(email, password);
      if (result.success) {
        loginForm.reset();
        loginForm.classList.add('hidden');
        authSection.classList.add('hidden');
        if (userName) userName.textContent = this.currentUser.name;
        if (userEmail) userEmail.textContent = this.currentUser.email;
        if (userAvatar) userAvatar.textContent = this.currentUser.name[0] || '?';
      } else {
        alert(result.message);
      }
    };
    if (signupForm) signupForm.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const result = this.signup(name, email, password);
      if (result.success) {
        signupForm.reset();
        signupForm.classList.add('hidden');
        authSection.classList.add('hidden');
        if (userName) userName.textContent = name;
        if (userEmail) userEmail.textContent = email;
        if (userAvatar) userAvatar.textContent = name[0] || '?';
      } else {
        alert(result.message);
      }
    };
    // Show user info if already logged in
    if (this.currentUser) {
      authSection.classList.add('hidden');
      if (userName) userName.textContent = this.currentUser.name;
      if (userEmail) userEmail.textContent = this.currentUser.email;
      if (userAvatar) userAvatar.textContent = this.currentUser.name[0] || '?';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.profileManager = new ProfileManager();
  window.profileManager.setupAutoBackup();
  window.AuthManager = new AuthManager();
  document.addEventListener('profileChanged', () => {
    window.profileManager.updateStatisticsDisplay();
  });
});