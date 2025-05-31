// profiles.js - Profile Management and Settings
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
  }

  bindEvents() {
    document.getElementById('switch-profile')?.addEventListener('click', () => this.showProfileSwitchModal());
    document.getElementById('close-profile-modal')?.addEventListener('click', () => this.hideProfileSwitchModal());
    
    document.getElementById('calculation-method')?.addEventListener('change', (e) => this.updateSetting('calculationMethod', e.target.value));
    document.getElementById('language-select')?.addEventListener('change', (e) => this.updateSetting('language', e.target.value));
    document.getElementById('prayer-notifications')?.addEventListener('change', (e) => this.updateNotification('prayer', e.target.checked));
    document.getElementById('adhkar-notifications')?.addEventListener('change', (e) => this.updateNotification('adhkar', e.target.checked));
    
    document.getElementById('update-location')?.addEventListener('click', () => this.updateLocation());
    document.getElementById('add-profile')?.addEventListener('click', () => this.showAddProfileModal());
    document.getElementById('edit-profile')?.addEventListener('click', () => this.showEditProfileModal());
    document.getElementById('export-profiles')?.addEventListener('click', () => this.exportProfiles());
    document.getElementById('import-profiles')?.addEventListener('click', () => this.importProfiles());
    document.getElementById('view-backups')?.addEventListener('click', () => this.showBackupListModal());
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

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center';
      modal.innerHTML = `
        <div class="bg-cream dark:bg-darkbg p-6 rounded-xl w-80 max-w-[90%]">
          <h3 class="text-xl font-bold text-golden-dark dark:text-golden-light mb-4">النسخ الاحتياطية المتوفرة</h3>
          <div class="space-y-2 max-h-60 overflow-y-auto mb-4">
            ${backups.map((backup, index) => `
              <button class="w-full text-right bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light p-3 rounded-lg hover:bg-golden-light/10 dark:hover:bg-golden/10 transition-all duration-300" data-backup-index="${index}">
                <div class="font-bold">${new Date(backup.timestamp).toLocaleString('ar-SA')}</div>
                <div class="text-sm text-golden/70 dark:text-golden-light/70">عدد الملفات: ${backup.profiles.length}</div>
              </button>
            `).join('')}
          </div>
          <div class="flex justify-end gap-2">
            <button class="cancel-btn bg-white dark:bg-darkbg border-2 border-golden-light dark:border-golden text-golden-dark dark:text-golden-light px-4 py-2 rounded-lg">
              إلغاء
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

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

document.addEventListener('DOMContentLoaded', () => {
  window.profileManager = new ProfileManager();
  window.profileManager.setupAutoBackup();
});