# CDG Sir Classes Application

A React application built with Vite for CDG Sir Classes, featuring Firebase integration and mobile app capabilities through Capacitor.js.

## 🚀 Features

- **Web Application**: Built with React and Vite
- **Mobile Apps**: Android and iOS support via Capacitor.js
- **Firebase Integration**: Authentication and database services
- **Admin Dashboard**: User management and analytics
- **Responsive Design**: Works on all devices

## 📱 Mobile Development

This project is configured for mobile app development using Capacitor.js. See [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) for detailed setup instructions.

### Quick Start for Mobile
```bash
# Build for mobile platforms
npm run build:mobile

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 🛠️ Development

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation
```bash
npm install
```

### Available Scripts
```bash
# Development server
npm run dev

# Build for production
npm run build

# Build and sync for mobile
npm run build:mobile

# Preview production build
npm run preview

# Lint code
npm run lint

# Mobile development
npm run android        # Run on Android
npm run ios           # Run on iOS
npm run sync          # Sync web assets to native projects
npm run open:android  # Open Android Studio
npm run open:ios      # Open Xcode
```

## 📁 Project Structure

```
src/
├── Admin Components/     # Admin dashboard components
│   ├── Analysis.jsx     # Analytics and reporting
│   └── MaintainDb.jsx   # Database management
├── Pages/               # Main application pages
│   ├── Admin.jsx        # Admin dashboard
│   ├── Login.jsx        # Authentication
│   └── User.jsx         # User dashboard
├── firebase/            # Firebase configuration
│   ├── config.js        # Firebase setup
│   └── dbService.js     # Database services
└── App.jsx             # Main application component
```

## 🔧 Configuration

### Firebase Setup
See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for Firebase configuration instructions.

### Mobile Setup
See [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) for mobile development setup.

## 📱 Mobile Platforms

- **Android**: Native Android app in `./android/` directory
- **iOS**: Native iOS app in `./ios/` directory

## 🔗 Technologies Used

- **Frontend**: React, Vite
- **Mobile**: Capacitor.js
- **Backend**: Firebase (Auth, Firestore)
- **Styling**: CSS
- **Icons**: Lucide React
- **Charts**: React Circular Progressbar
- **File Processing**: XLSX
- **Notifications**: React Toastify
- **Routing**: React Router DOM

## 📄 License

This project is private and proprietary.
