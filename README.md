# Research Project Website

A static multi-page project site with calendar, Gantt timeline, team chat, and date-pinned comments.

## Pages

| File | Description |
|------|-------------|
| `index.html` | Project overview, phase status, team members |
| `calendar.html` | Interactive calendar with phase shading + advising sessions |
| `gantt.html` | Gantt timeline with progress bars |
| `chat.html` | Team chat (3 channels) + date-pinned comments + permissions |

## Features

- **Calendar**: Phase-shaded days, red-bordered advising sessions, click any day to add comments
- **Gantt**: Visual timeline with today marker, progress bars per phase
- **Chat**: 3 channels, pin messages to specific dates, owner controls who can post
- **Permissions**: Only the "owner" user can toggle collaborator posting rights
- **User switching**: Click your avatar (top right) to cycle between the 3 users — Owner, Alex, Priya
- **Persistence**: All messages and comments saved to browser localStorage

## Deploying

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial project site"
gh repo create my-project-site --public
git remote add origin https://github.com/YOU/my-project-site.git
git push -u origin main
# Enable Pages in repo Settings → Pages → Deploy from branch: main
```

### Netlify (drag & drop)
1. Go to https://netlify.com
2. Drag the project folder onto the deploy zone
3. Done — you get a live URL instantly

### Vercel
```bash
npm i -g vercel
vercel
```

## File Structure
```
project/
├── index.html
├── calendar.html
├── gantt.html
├── chat.html
├── css/
│   └── style.css
├── js/
│   └── data.js
└── README.md
```

## Customization

- **Phases & dates**: Edit `js/data.js` — update the `PHASES` array dates and labels
- **Users**: Edit the `USERS` object in `js/data.js`
- **Colors**: Edit CSS variables in `css/style.css`
- **Project name/description**: Edit `index.html`
