# Ashwin G — Portfolio

A dark, warm-toned cybersecurity-themed portfolio. Static site — no build step required.

## Structure
```
index.html
css/style.css
js/script.js
assets/ashwin.jpg
```

## Preview locally
Any static server works, e.g.:
```
cd portfolio
python3 -m http.server 8000
```
Then open http://localhost:8000

## Deploy to GitHub Pages
1. Create a new repo on GitHub, e.g. `ashwin-portfolio` (or use `Ashwin7807.github.io` for a root-domain site).
2. Push these files to the repo's `main` branch (root, not a subfolder).
3. On GitHub: Settings → Pages → Source → select `main` branch, `/ (root)` folder → Save.
4. Wait ~1 minute — your site goes live at:
   - `https://ashwin7807.github.io/ashwin-portfolio/` (if repo name isn't the special one), or
   - `https://ashwin7807.github.io/` (if the repo is named exactly `Ashwin7807.github.io`)

## Adding your resume later
Drop the PDF in as `assets/resume.pdf`, then in `index.html` find the Resume section
(`id="resume"`) and swap the disabled button for:
```html
<a class="btn btn-solid" href="assets/resume.pdf" download>Download resume</a>
```

## Adding projects
Each project card in the Projects section is a plain `<a class="project-card">` block —
duplicate one, swap in a title, description, and repo link.
