# Ferrous Group Website

Production build. Four pages, zero build steps, deploys as-is.

## Structure
```
index.html        ferrous.co.in
fe/index.html     ferrous.co.in/fe
de/index.html     ferrous.co.in/de
fapl/index.html   ferrous.co.in/fapl
sitemap.xml  robots.txt  vercel.json
```

## Deploy (one time, ~10 minutes)
1. Put these files in the ROOT of the same GitHub repo that holds the media folders
   (github.com/shauryamanglik/Ferrous). index.html sits next to "General Site Media".
2. Go to vercel.com, sign in with GitHub, click "Add New Project", import the Ferrous repo.
   Framework preset: Other. No build command. Output directory: leave default. Deploy.
3. In Vercel: Settings > Domains > add ferrous.co.in and www.ferrous.co.in.
   Vercel shows you 2 DNS records (an A record and a CNAME). Add them wherever
   the ferrous.co.in domain is registered. Done within an hour usually.

## Updating media later
Drag new photos into the matching folder on GitHub. The site references them live.

## Notes
- Internal links are root-absolute (/fe/ etc), so pages link correctly on Vercel
  but not when opening the HTML file directly from disk. Deploy to test navigation.
- "Smaller RAL.HEIC" is excluded: browsers cannot display HEIC. Convert to .jpg
  and it can be added to the FE gallery.
- The 3D RAL viewer streams ral3d.stl from the repo. If the file ever moves,
  the viewer falls back to a procedural model automatically.
