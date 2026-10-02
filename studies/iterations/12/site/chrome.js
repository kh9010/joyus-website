// Nav + footer for every prototype page: round 4's chrome with Study 03's
// destinations, now real hrefs. Pages carry <header id="nav"> and
// <footer id="foot">; this fills them (the real site does the same job with
// scripts/sync-chrome.js). Podcast is the live page at the repo root.
(function () {
  const nav = document.getElementById('nav'), foot = document.getElementById('foot');
  if (nav) {
    nav.className = 'nav';
    nav.innerHTML = '<a class="gbox" href="index.html">wordmark</a>' +
      '<ul><li><a href="work.html">work</a></li><li><a href="about.html">about</a></li><li><a href="say-hi.html">say hi</a></li></ul>';
  }
  if (foot) {
    foot.className = 'foot';
    foot.innerHTML = '<div><a class="gbox" href="index.html">wordmark</a><p style="margin-top:12px">© 2026 · Joyus Studio · Kahran Singh &amp; Divya Tak</p></div>' +
      '<div>say hi<ul><li><a href="mailto:hello@joyus.studio">hello@joyus.studio</a></li><li><a href="say-hi.html">contact</a></li></ul></div>' +
      '<div>find us<ul><li><a href="kahran-singh.html">Kahran</a></li><li><a href="divya-tak.html">Divya</a></li><li><a href="../../../../podcast.html">podcast</a></li></ul></div>';
  }
})();
