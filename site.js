/* Quire website: fetches the latest release from the public releases repo so the
   download button, version label and changelog stay current without editing
   the site. Everything degrades gracefully when the API is unreachable. */
(function () {
  var REPO = "moumbou/quire-releases";
  var API = "https://api.github.com/repos/" + REPO + "/releases";
  var STABLE = "https://github.com/" + REPO + "/releases/latest/download/Quire-Setup.exe";
  var PAGE = "https://github.com/" + REPO + "/releases/latest";

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return iso.slice(0, 10);
    }
  }
  function fmtSize(bytes) {
    return (bytes / 1048576).toFixed(1) + " MB";
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  /* Minimal markdown for release notes: ### headings, "- " bullets, `code`, paragraphs. */
  function md(text) {
    var lines = String(text || "").replace(/\r/g, "").split("\n");
    var out = [], list = [];
    function flush() {
      if (list.length) {
        out.push("<ul>" + list.map(function (l) { return "<li>" + inline(l) + "</li>"; }).join("") + "</ul>");
        list = [];
      }
    }
    function inline(s) {
      return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    }
    lines.forEach(function (l) {
      var m = /^(#{1,6})\s+(.*)$/.exec(l);
      if (m) { flush(); out.push("<h4>" + inline(m[2]) + "</h4>"); return; }
      m = /^\s*[-*]\s+(.*)$/.exec(l);
      if (m) { list.push(m[1]); return; }
      flush();
      if (l.trim()) out.push("<p>" + inline(l) + "</p>");
    });
    flush();
    return out.join("");
  }

  function fill(sel, fn) {
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) fn(els[i]);
  }

  function latest(rel) {
    var version = rel.tag_name.replace(/^v/, "");
    var setup = null, sums = null;
    (rel.assets || []).forEach(function (a) {
      if (/^Quire_.*-setup\.exe$/.test(a.name)) setup = a;
      if (a.name === "SHA256SUMS.txt") sums = a;
    });
    fill("[data-version]", function (el) { el.textContent = "v" + version; });
    fill("[data-date]", function (el) { el.textContent = fmtDate(rel.published_at); });
    fill("[data-size]", function (el) { if (setup) el.textContent = fmtSize(setup.size); });
    fill("[data-download]", function (el) { el.href = setup ? setup.browser_download_url : STABLE; });
    fill("[data-release-page]", function (el) { el.href = rel.html_url || PAGE; });
    fill("[data-sums]", function (el) { if (sums) el.href = sums.browser_download_url; else el.hidden = true; });
    fill("[data-version-line]", function (el) {
      el.textContent = "Version " + version + " · " + fmtDate(rel.published_at) + (setup ? " · " + fmtSize(setup.size) : "");
    });
  }

  function changelog(list) {
    var host = document.querySelector("[data-changelog]");
    if (!host) return;
    if (!list.length) return; /* keep the static list written into the page */
    host.innerHTML = list.map(function (rel) {
      var version = rel.tag_name.replace(/^v/, "");
      var exe = (rel.assets || []).filter(function (a) { return /^Quire_.*-setup\.exe$/.test(a.name); })[0];
      return (
        '<article class="release" id="v' + esc(version) + '">' +
        "<h3>Quire " + esc(version) + ' <span class="date">' + esc(fmtDate(rel.published_at)) + "</span></h3>" +
        '<div class="body">' + md(rel.body) + "</div>" +
        '<p class="small"><a href="' + esc(rel.html_url) + '">Release page</a>' +
        (exe ? ' · <a href="' + esc(exe.browser_download_url) + '">Download ' + esc(version) + "</a>" : "") +
        "</p></article>"
      );
    }).join("");
  }

  /* Total installer downloads across all releases, as counted by GitHub.
     Shown only once it is worth showing; a tiny number would do the opposite
     of building trust. */
  function downloads(list) {
    var total = 0;
    list.forEach(function (rel) {
      (rel.assets || []).forEach(function (a) {
        if (/\.exe$/.test(a.name)) total += a.download_count || 0;
      });
    });
    fill("[data-downloads]", function (el) {
      if (total < 100) { el.hidden = true; return; }
      el.hidden = false;
      var n = total >= 10000 ? Math.floor(total / 1000) + "k" : total.toLocaleString();
      el.textContent = n + " downloads";
    });
  }

  var wantLatest = document.querySelector("[data-version], [data-download]");
  var wantLog = document.querySelector("[data-changelog]");
  if (!wantLatest && !wantLog) return;

  fetch(API + "?per_page=30", { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var releases = (data || []).filter(function (r) { return !r.draft && !r.prerelease; });
      if (wantLog) changelog(releases);
      if (releases[0]) latest(releases[0]);
      downloads(releases);
    })
    .catch(function () {
      fill("[data-version-line]", function (el) { el.textContent = "Latest version"; });
      /* the changelog page keeps its static list */
    });
})();
