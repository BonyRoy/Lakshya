# Capacitor.js Setup Guide for CDG Sir Classes App

## 🎉 Setup Complete!

Your React application has been successfully configured with Capacitor.js for Android and iOS development.

## 📱 What's Been Set Up

### ✅ Installed Packages
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/cli` - Capacitor CLI tools
- `@capacitor/android` - Android platform support
- `@capacitor/ios` - iOS platform support

### ✅ Project Configuration
- **Capacitor Config**: `capacitor.config.json` with app details
- **Vite Config**: Updated for mobile development compatibility
- **Package Scripts**: Added mobile-specific npm scripts

### ✅ Platform Projects
- **Android**: Native Android project created in `./android/`
- **iOS**: Native iOS project created in `./ios/`

## 🚀 Available Commands

```bash
# Build for mobile platforms
npm run build:mobile

# Run on Android (requires Android Studio setup)
npm run android

# Run on iOS (requires Xcode setup)
npm run ios

# Sync web assets to native projects
npm run sync

# Open Android project in Android Studio
npm run open:android

# Open iOS project in Xcode
npm run open:ios
```

## 📋 Prerequisites for Development

### For Android Development
1. **Install Java Development Kit (JDK)**
   ```bash
   # Install via Homebrew (recommended)
   brew install openjdk@17
   
   # Add to your shell profile (.zshrc or .bash_profile)
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)
   ```

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK and build tools
   - Set up Android Virtual Device (AVD) for testing

3. **Configure Android SDK Path**
   ```bash
   # Add to your shell profile
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### For iOS Development (macOS only)
1. **Install Xcode**
   - Download from Mac App Store
   - Install Xcode Command Line Tools:
     ```bash
     xcode-select --install
     ```

2. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

3. **Set up iOS Simulator**
   - Open Xcode
   - Go to Xcode → Preferences → Components
   - Download desired iOS Simulator versions

## 🔧 Development Workflow

### 1. Make Changes to Your React App
Edit your React components in the `src/` directory as usual.

### 2. Build and Sync
```bash
# Build the web app and sync to native projects
npm run build:mobile
```

### 3. Test on Devices/Simulators

#### Android
```bash
# Run on connected device or emulator
npm run android

# Or open in Android Studio for more control
npm run open:android
```

#### iOS
```bash
# Run on connected device or simulator
npm run ios

# Or open in Xcode for more control
npm run open:ios
```

## 🔌 Adding Capacitor Plugins

Capacitor has many plugins for native functionality:

```bash
# Examples of useful plugins
npm install @capacitor/camera
npm install @capacitor/geolocation
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/storage

# After installing plugins, sync to native projects
npm run sync
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Unable to locate a Java Runtime" (Android)**
   - Install JDK as shown in prerequisites
   - Restart terminal after setting JAVA_HOME

2. **"xcode-select: error: tool 'xcodebuild' requires Xcode" (iOS)**
   - Install Xcode from Mac App Store
   - Run: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

3. **"CocoaPods not installed" (iOS)**
   - Install CocoaPods: `sudo gem install cocoapods`
   - Run: `cd ios && pod install`

4. **Build Errors**
   - Clean and rebuild: `npm run build:mobile`
   - For Android: Clean in Android Studio (Build → Clean Project)
   - For iOS: Clean in Xcode (Product → Clean Build Folder)

### Useful Commands

```bash
# Check Capacitor doctor for issues
npx cap doctor

# Update native projects after config changes
npx cap sync

# Copy web assets only (without updating plugins)
npx cap copy

# Update native dependencies
npx cap update
```

## 📱 App Configuration

Your app is configured with:
- **App ID**: `com.cdgsir.classes`
- **App Name**: CDG Sir Classes
- **Web Directory**: `dist` (Vite build output)

To change these, edit `capacitor.config.json` and run `npm run sync`.

## 🔗 Useful Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Android Development](https://capacitorjs.com/docs/android)
- [iOS Development](https://capacitorjs.com/docs/ios)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

## 🎯 Next Steps

1. Set up your development environment (Android Studio/Xcode)
2. Test the app on a device or simulator
3. Add native plugins as needed for your app features
4. Configure app icons and splash screens
5. Set up app signing for production builds

Happy mobile app development! 🚀
