# Clipboard Pro+ GitHub Pages site

This folder is the static marketing, support, and privacy site. The homepage uses
local images in `assets/`, local CSS and a small animation script. It has no build
step or external runtime dependency.

## Pages URLs

- Site root: `https://mahmoudfotta.github.io/Clipboard-pro-plus/`
- Support page: `https://mahmoudfotta.github.io/Clipboard-pro-plus/support/`
- iPhone and iPad privacy policy: `https://mahmoudfotta.github.io/Clipboard-pro-plus/privacy-policy/`
- Mac privacy policy: `https://mahmoudfotta.github.io/Clipboard-pro-plus/mac-privacy-policy/`

## Enable GitHub Pages

1. Copy this entire `docs/` folder, including `assets/`, `home.css`, `ai.css`, `home-motion.js`, and all policy pages, into the public repository `https://github.com/mahmoudfotta/Clipboard-pro-plus.git`.
2. Push that repository.
3. Open the public repository on GitHub.
4. Go to `Settings` > `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select the branch you pushed and the `/docs` folder.
7. Save and wait for the site to publish.

## App Store Connect

After Pages is live, use:

- Marketing URL: `https://mahmoudfotta.github.io/Clipboard-pro-plus/`
- Support URL: `https://mahmoudfotta.github.io/Clipboard-pro-plus/support/`
- iPhone and iPad Privacy Policy URL: `https://mahmoudfotta.github.io/Clipboard-pro-plus/privacy-policy/`
- Mac Privacy Policy URL: `https://mahmoudfotta.github.io/Clipboard-pro-plus/mac-privacy-policy/`

## Content and assets

The homepage links to the shared iPhone, iPad, and Mac App Store record. The Mac
app is available, and its feature copy reflects the current native build. The
mobile and Mac privacy policies stay at separate URLs. Keep those paths stable
when publishing.

The homepage images are resized from the approved icon and native iOS/Mac
captures in `AppStore/iOS-Campaign/` and `AppStore/Mac/Screenshots/source/`.
The AI section uses the native iPhone AI Tools capture and describes its
Premium, operating-system, and Apple Intelligence requirements.

## Link preview

The home page declares Open Graph and X large-image card metadata in
`index.html`. The card image is `assets/social-preview.png` (1200 × 630).
Keep its absolute image URL in the metadata in sync with the published Pages
URL when changing the site address or preview artwork.
