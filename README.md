# 🕌 تطبيق الأذكار | Athkar Application

A comprehensive Islamic Athkar (remembrance) application with prayer times, Qibla direction, and daily dhikr tracking.

## ✨ Features

### 📿 Core Functionality
- **Daily Athkar**: Morning and evening Islamic remembrances
- **Duaa Collection**: Comprehensive collection of Islamic supplications
- **Digital Tasbeeh**: Electronic counter for dhikr counting
- **Prayer Times**: Accurate prayer time calculations based on location
- **Qibla Direction**: Real-time Qibla compass
- **Hijri Calendar**: Islamic calendar integration

### 🎨 User Experience
- **Dark Mode**: Toggle between light and dark themes
- **RTL Support**: Full right-to-left layout for Arabic content
- **Responsive Design**: Mobile-first, works on all devices
- **Profile Management**: User profiles with Firebase authentication
- **Statistics Tracking**: Track your dhikr and prayer completion
- **Offline Support**: Progressive Web App (PWA) capabilities

### 🌐 Localization
- Primary language: Arabic (العربية)
- RTL interface design
- Islamic calendar integration

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for initial load and API features)

### Installation

#### Option 1: Direct Use
1. Clone the repository:
```bash
git clone https://github.com/AlBaraa-1/athkar_applacation.git
cd athkar_applacation
```

2. Open `index.html` in your web browser

#### Option 2: Local Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

Then navigate to `http://localhost:8000`

#### Option 3: PWA Installation
1. Visit the deployed website
2. Click "Install" when prompted by your browser
3. Use as a standalone app on your device

## 📁 Project Structure

```
athkar_applacation/
├── index.html              # Main homepage
├── morning.html            # Morning athkar page
├── duaa.html              # Duaa collection page
├── tasbeeh.html           # Digital tasbeeh counter
├── statistics.html        # User statistics dashboard
├── settings.html          # Application settings
├── manifest.json          # PWA manifest
│
├── components/            # Reusable components
│   ├── header.html
│   ├── footer.html
│   └── sidebar.html
│
├── css/                   # Stylesheets
│   ├── styles.css         # Main styles
│   ├── custom.css         # Custom styles
│   ├── components.css     # Component styles
│   ├── duaa.css          # Duaa page styles
│   └── hijri-calendar.css # Calendar styles
│
└── js/                    # JavaScript modules
    ├── common.js          # Shared utilities
    ├── adhkar-dynamic.js  # Dynamic athkar loading
    ├── profiles.js        # User profile management
    ├── statistics.js      # Statistics tracking
    ├── tasbeeh-inline.js  # Tasbeeh counter logic
    ├── sidebar-ui.js      # Sidebar interactions
    ├── hijri-calendar.js  # Hijri calendar logic
    └── sw.js             # Service worker for PWA
```

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Tajawal, Amiri)
- **Backend**: Firebase (Authentication & Firestore)
- **APIs**: 
  - Aladhan API (Prayer times)
  - Geolocation API (Qibla direction)

## 🔧 Configuration

### Firebase Setup
To use the profile and statistics features, configure Firebase:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore
3. Add your Firebase configuration in the HTML files
4. Update the Firebase SDK initialization

### Prayer Times API
The application uses the Aladhan API. No API key required, but you can customize:
- Calculation method
- Juristic method (Hanafi/Shafi)
- Time adjustments

## 📱 Features in Detail

### Morning & Evening Athkar
- Complete collection of daily remembrances
- Audio playback support
- Progress tracking
- Counter for repeated dhikr

### Duaa Section
- Categorized supplications
- Search functionality
- Bookmark favorite duas
- Share functionality

### Tasbeeh Counter
- Multiple counter support
- History tracking
- Custom goals
- Vibration feedback

### Statistics Dashboard
- Daily, weekly, monthly views
- Completion rates
- Streak tracking
- Visual charts

### Prayer Times
- Automatic location detection
- Manual location input
- Notification support
- Multiple calculation methods

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**AlBaraa-1**
- GitHub: [@AlBaraa-1](https://github.com/AlBaraa-1)

## 🙏 Acknowledgments

- Prayer times data provided by [Aladhan API](https://aladhan.com/prayer-times-api)
- Islamic content verified against authentic sources
- Community feedback and contributions

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Contribute to documentation improvements

## 🔄 Updates

Check the repository regularly for updates and new features. Star ⭐ the repository to stay updated!

---

**Made with ❤️ for the Muslim community**
