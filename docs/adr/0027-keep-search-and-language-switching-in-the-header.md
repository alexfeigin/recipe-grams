# Keep search and language switching in the header at every width

Supersedes [0014 — Use a mobile navigation drawer](0014-use-a-mobile-navigation-drawer.md) in part.

The hamburger drawer stays, but it holds category navigation only. The search field and the language toggle remain in the header bar itself at every width, so a phone reader can search a recipe or switch language without opening the drawer first. Search is the primary way to reach an unfeatured recipe, and hiding it behind a trigger cost a step on exactly the device where readers use it most; the compact header proved to have room for both controls beside the brand.

The drawer's original purpose is unchanged: category navigation would crowd the top bar on small screens, so it collapses at the header breakpoint of `880px`. `DESIGN.md` records the supported viewports and the breakpoint each surface owns.
