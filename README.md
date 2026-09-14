# quire-site

The public website for [Quire](https://moumbou.github.io/quire-site/), a free PDF and EPUB reader for Windows with a phone remote. Plain HTML, CSS and one small script; no build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Landing page: features, phone remote, download, support |
| `download/index.html` | Redirects straight to `Quire-Setup.exe` from the latest release |
| `changelog.html` | Release notes; the static list is replaced by the live releases from GitHub |
| `privacy.html` | The privacy statement linked from the app |
| `license.html` | The end-user license, same text as the installer shows |
| `site.js` | Fetches the latest release from `api.github.com/repos/moumbou/quire-releases` and fills version, date, size and download links |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

All links are relative so the site works both at `moumbou.github.io/quire-site/` and on a custom domain.

## Publishing

The site is served by GitHub Pages from the `main` branch, root folder
(Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/`).
Every push to `main` goes live within a minute or two.

## Updating

- New release: nothing to do, the version and changelog come from the releases repo.
- New screenshot: replace the file in `img/` under the same name.
- Support link: search for `ko-fi.com` in `index.html`.
- Text changes to the privacy statement should be mirrored in the app's About dialog (`src/components/AboutDialog.tsx` in the app repo).
