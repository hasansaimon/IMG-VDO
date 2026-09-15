# Android APK build (Capacitor 7)

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| JDK | 17 or 21 |
| Android SDK | API 35 (compileSdk 35) |
| Gradle | 8.11.1 (wrapper) |
| AGP | 8.7.2 |

Install Android Studio **or** command-line tools with packages:

```text
platforms;android-35
build-tools;35.0.0
platform-tools
```

Set:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Workable debug APK (recommended for testing)

```bash
cd apps/web
cp .env.production.example .env.production
# edit NEXT_PUBLIC_API_URL — never use localhost inside the APK

# Start API on the machine (port 3001), then:
npm install
npm run android:apk
```

Output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Phone on LAN

1. API must listen on `0.0.0.0` (not only 127.0.0.1).
2. Set `NEXT_PUBLIC_API_URL=http://<PC-LAN-IP>:3001`.
3. Rebuild APK (URL is baked in at `next build`).

### Emulator

Use `http://10.0.2.2:3001` (special alias to host loopback).

## Release APK (signed)

1. Create `android/keystore.properties` + keystore (not committed).
2. `npm run android:apk:release`
3. Artifact: `android/app/build/outputs/apk/release/app-release.apk`

## Common build failures

| Symptom | Fix |
|---------|-----|
| `SDK location not found` | Set `ANDROID_HOME` / `sdk.dir` in `android/local.properties` |
| `compileSdk 35 not found` | Install platform android-35 |
| `Invalid API URL / missing NEXT_PUBLIC_API_URL` | Create `.env.production` |
| Blank app / network errors | Wrong API host (localhost in APK) or cleartext blocked |
| Release install fails | Unsigned release — use debug APK or configure keystore |
| Gradle JVM | Use JDK 17–21; AGP 8.7 wants recent JDK |

## App notes

- `minSdk 24`, `targetSdk 35`
- Cleartext HTTP allowed for LAN/dev testing
- Adult routes still require login + consent on the API
