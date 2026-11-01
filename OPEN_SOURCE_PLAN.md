# 🚀 SmartTV Remote — Open Source Launch & Contribution Plan

A complete, actionable, step-by-step guide to publishing **SmartTV Remote** to GitHub, building an active contributor community, and distributing it to open-source Android repositories like F-Droid.

---

## 📋 Table of Contents

1. [Phase 1: Pre-Launch Readiness (Already Prepared)](#phase-1-pre-launch-readiness)
2. [Phase 2: Publishing to GitHub](#phase-2-publishing-to-github)
3. [Phase 3: Repository Setup & Community Tools](#phase-3-repository-setup--community-tools)
4. [Phase 4: Publishing Release v1.0.0 (Pre-built APK)](#phase-4-publishing-release-v100)
5. [Phase 5: Attracting & Onboarding Contributors](#phase-5-attracting--onboarding-contributors)
6. [Phase 6: Listing on F-Droid (Official Open-Source Store)](#phase-6-listing-on-f-droid)
7. [Phase 7: Maintenance & PR Review Workflow](#phase-7-maintenance--pr-review-workflow)

---

## Phase 1: Pre-Launch Readiness

Before making code public, repository hygiene and safety are essential. These files and configs have already been set up in your repository:

- [x] **`.gitignore`**: Blocks node modules, local SDK paths, build directories, logs, and sensitive keystores.
- [x] **`LICENSE`**: Licensed under the permissive **MIT License** allowing anyone to run, fork, and contribute.
- [x] **`README.md`**: Storefront with architecture diagrams, feature list, prerequisites, and build commands.
- [x] **`CONTRIBUTING.md`**: Instructions for new contributors on project structure, local testing (with/without physical TV), and PR rules.
- [x] **`.github/workflows/ci.yml`**: Continuous Integration workflow that automatically type-checks (`tsc`) and compiles the Android app on every Pull Request.
- [x] **`.github/ISSUE_TEMPLATE/` & PR Template**: Standardized templates for bug reports, feature requests, TV compatibility testing, and PR reviews.
- [x] **Clean Git Commit**: Initial commits created on branch `main` with zero tracked junk files, secrets, or unreferenced assets.

---

## Phase 2: Publishing to GitHub

Follow these steps to create your public repository on GitHub:

### Step 2.1: Create Repository on GitHub
1. Log into your account at [github.com](https://github.com).
2. Go to [github.com/new](https://github.com/new).
3. Fill in the repository details:
   - **Repository Name**: `smarttv-remote` (or `smart-tv-remote-android`)
   - **Description**: `Sleek, zero-latency, local-network open-source remote control for Android TV and Google TV.`
   - **Visibility**: **Public**
   - **Initialize repository with**: Leave **all un-checked** (Do NOT add README, .gitignore, or license — we already created them locally).
4. Click **Create repository**.

### Step 2.2: Push Local Code to GitHub
Run the following commands in your terminal:

```bash
cd /home/naveen/.gemini/antigravity/scratch/android-tv-remote-app

# Link to your new GitHub repository (replace with your GitHub username)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/smarttv-remote.git

# Rename branch to main (if not already) and push
git branch -M main
git push -u origin main
```

---

## Phase 3: Repository Setup & Community Tools

Once your code is on GitHub, enable community features to make it welcoming for contributors:

### Step 3.1: Add Repository Topics (Crucial for Discovery)
On your GitHub repository page:
1. Click the gear icon ⚙️ beside **About** on the right sidebar.
2. In the **Topics** field, add:
   ```
   android, android-tv, google-tv, remote-control, react-native, typescript, kotlin, open-source, smart-home
   ```
3. Save changes.

### Step 3.2: Enable GitHub Discussions
1. Go to **Settings** → **General** → scroll down to **Features**.
2. Check the box for **Discussions**.
3. This gives users a place to ask questions, suggest app shortcuts, and share device compatibility without cluttering Issues.

### Step 3.3: Protect the `main` Branch
1. Go to **Settings** → **Branches** → **Add branch ruleset** (or Branch protection rule).
2. Set branch name pattern to `main`.
3. Check **Require a pull request before merging**.
4. Check **Require status checks to pass before merging** (select the `build` check from GitHub Actions).

---

## Phase 4: Publishing Release v1.0.0

Non-developer users will want to download and install the APK directly without building from source.

### Step 4.1: Tag the Release
```bash
cd /home/naveen/.gemini/antigravity/scratch/android-tv-remote-app

git tag -a v1.0.0 -m "Release v1.0.0: Initial public release"
git push origin v1.0.0
```

### Step 4.2: Create GitHub Release with APK Attached
1. On GitHub, navigate to **Releases** → **Draft a new release**.
2. Select tag: `v1.0.0`.
3. Release Title: `v1.0.0 — SmartTV Remote Initial Release`.
4. Description:
   ```markdown
   ### Features
   - 🔒 100% Local Network (No cloud, zero telemetry).
   - ⚡ Zero-latency tap response.
   - 🔄 Physical remote feel with long-press continuous key repetition.
   - 🚀 4 customizable streaming shortcut buttons with app picker.
   - 📱 Responsive phone and tablet UI.
   - 🎨 Official Material Community vector icons.

   ### Installation
   Download `SmartTV-Remote-v1.0.0.apk` below and install on any Android phone (Android 8.0+).
   ```
5. Drag and drop the compiled release APK:
   `/home/naveen/.gemini/antigravity/scratch/android-tv-remote-app/android/app/build/outputs/apk/release/app-release.apk`
   *(Rename it to `SmartTV-Remote-v1.0.0.apk` for users)*
6. Click **Publish release**.

---

## Phase 5: Attracting & Onboarding Contributors

To get developers actively contributing PRs and features:

### Step 5.1: Create "Good First Issues"
Create 3–5 small, well-scoped GitHub issues labeled `good first issue` and `help wanted`:
1. **`feat: Add Trackpad / Swipe-to-navigate gesture mode`**: Ideal for a frontend React Native contributor.
2. **`feat: Add Volume mute toggle indicator in Header`**: Quick UI addition.
3. **`feat: Support localized translations (Hindi, Spanish, German, etc.)`**: Great for non-code contributors.
4. **`feat: Dark / OLED Black theme selector`**: Accessible styling task.

### Step 5.2: Launch Announcements
Share your release on the following developer and smart home communities:
- **Reddit**:
  - `r/AndroidTV` — *"[Open Source] Built a fast, zero-cloud Android TV Remote app without ads"*
  - `r/androiddev` — Share technical details on the Kotlin Polo protocol implementation.
  - `r/reactnative` — Share how React Native pairs with low-level Kotlin TLS sockets.
  - `r/selfhosted` / `r/homeassistant` — Privacy-focused audiences love local-only control.
- **Hacker News (Show HN)**:
  - Title: *Show HN: SmartTV Remote – Local-only, open-source Android TV remote*
- **X / Twitter / Bluesky**:
  - Share a 15-second screen recording showing zero-delay control and the responsive UI.

---

## Phase 6: Listing on F-Droid (Official Open-Source Store)

F-Droid is the largest open-source Android app repository. Listing here gives you instant visibility to hundreds of thousands of open-source enthusiasts.

### Requirements for F-Droid:
1. Must be licensed under a recognized Free Software license (MIT is accepted).
2. Must build 100% from source without proprietary blobs or tracking SDKs (our project qualifies).
3. All dependencies must be open-source.

### How to Submit:
1. Fork the [fdroiddata repository](https://gitlab.com/fdroid/fdroiddata).
2. Add a metadata file `metadata/com.androidtvremote.yml`:
   ```yaml
   Categories:
     - Multimedia
   License: MIT
   WebSite: https://github.com/<YOUR_USERNAME>/smarttv-remote
   SourceCode: https://github.com/<YOUR_USERNAME>/smarttv-remote
   IssueTracker: https://github.com/<YOUR_USERNAME>/smarttv-remote/issues

   RepoType: git
   Repo: https://github.com/<YOUR_USERNAME>/smarttv-remote.git

   Builds:
     - versionName: '1.0.0'
       versionCode: 1
       commit: v1.0.0
       subdir: android/app
       gradle:
         - assembleRelease
   ```
3. Submit a Merge Request on GitLab. The F-Droid build servers will compile it and publish it to the store.

---

## Phase 7: Maintenance & PR Review Workflow

When contributors submit pull requests:
1. **Automated Verification**: GitHub Actions will automatically run `tsc --noEmit` and `./gradlew assembleDebug` on the PR.
2. **Reviewing Code**: Check that:
   - TypeScript code follows existing component patterns.
   - Any new native methods are thread-safe and non-blocking.
   - UI additions remain responsive on compact screens.
3. **Merging**: Use **Squash and Merge** to keep the `main` git history clean and legible.
4. **Release Regularly**: Batch merged features into milestone releases (`v1.1.0`, `v1.2.0`).

---

*This plan is maintained in your repository at [OPEN_SOURCE_PLAN.md](OPEN_SOURCE_PLAN.md).*

