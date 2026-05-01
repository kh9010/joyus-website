import random

PROJECTS = {
  "klydo":         "Klydo",
  "tomboyx":       "TomboyX",
  "rachna-nivas":  "Rachna Nivas",
  "agemo":         "Agemo",
  "convegenius":   "ConveGenius",
  "pratham":       "Pratham USA",
  "tatsam":        "Tatsam",
  "xtdb":          "XTDB",
  "gliitch":       "Gliitch",
  "secret-senses": "Secret Senses",
}

DISC_LABEL = {"brand":"Brand","product":"Product","research":"Research","story":"Story","growth":"Growth"}

# Hand-curated tilt sequence — feels intentional, not random
TILTS = [-1.4, 0.7, -0.5, 1.1, -0.9, 0.4, -0.3, 1.3, -1.2, 0.8, -0.6, 1.0, -1.1, 0.5]
random.seed(7)

# Hand-drawn-style SVG circle scribble (used around stat numbers)
DOODLE_SVG = (
  '<svg class="fact-num-doodle" viewBox="0 0 220 160" preserveAspectRatio="none" aria-hidden="true">'
  '<path d="M 30 80 C 30 30, 80 18, 120 22 C 175 28, 200 60, 196 95 C 192 130, 150 148, 110 144 C 65 140, 30 122, 30 80 Z"/>'
  '</svg>'
)

def proj(slug, size="", sticker=None, sticker_color="yellow", sticker_side="right"):
    name = PROJECTS[slug]
    size_str = " " + size if size else ""
    tilt = TILTS[hash((slug, size, sticker)) % len(TILTS)]
    sticker_html = ""
    if sticker:
        sticker_html = ('        <span class="card-sticker ' + sticker_color + ' ' + sticker_side + '">'
                        + sticker + '</span>\n')
    return ('      <a class="card' + size_str + '" href="./work/' + slug + '.html"'
            ' style="background-image: url(\'./images/work/' + slug + '.jpg\'); --tilt: ' + str(tilt) + 'deg;">\n'
            + sticker_html
            + '        <span class="card-name">' + name + '</span>\n'
            '      </a>')

def stat(num, label, size="", key=""):
    size_str = " " + size if size else ""
    tilt = TILTS[hash(("stat", num, key)) % len(TILTS)]
    return ('      <div class="fact stat' + size_str + '" style="--tilt: ' + str(tilt) + 'deg;">\n'
            '        <div class="fact-num-wrap">'
            '<span class="fact-num">' + str(num) + '</span></div>\n'
            '        <span class="fact-num-label">' + label + '</span>\n'
            '      </div>')

def quote(text, attribution, size="", key=""):
    size_str = " " + size if size else ""
    tilt = TILTS[hash(("quote", text, key)) % len(TILTS)]
    return ('      <div class="fact quote' + size_str + '" style="--tilt: ' + str(tilt) + 'deg;">\n'
            '        <span class="fact-q">' + text + '</span>\n'
            '        <span class="fact-att"><span class="dot-bullet"></span>' + attribution + '</span>\n'
            '      </div>')

def note(kicker, statement, size="", invert=False, key=""):
    size_str = " " + size if size else ""
    inv_str = " invert" if invert else ""
    tilt = TILTS[hash(("note", kicker, key)) % len(TILTS)]
    return ('      <div class="fact note' + inv_str + size_str + '" style="--tilt: ' + str(tilt) + 'deg;">\n'
            '        <span class="fact-kicker">' + kicker + '</span>\n'
            '        <span class="fact-statement">' + statement + '</span>\n'
            '      </div>')

# band-bg now hidden via CSS — no in-band dot scatter
def band_dots(seed_str):
    return ""

# Each band's content is an ordered sequence of cards
BANDS = [
  {
    "id":"band-brand", "color":"pink", "num":"01", "label":"Brand &amp; Identity",
    "dir_class":"right", "speed":"55", "dir":"-1",
    "items": lambda: [
      proj("klydo", "mega", sticker="★ studio favourite", sticker_color="yellow", sticker_side="right"),
      proj("tomboyx"),
      note("recurring problem", "Naming the thing the founder can&rsquo;t say out loud yet.", invert=True, key="brand"),
      proj("rachna-nivas", "tight"),
      proj("tatsam", sticker="2024 in flight", sticker_color="cyan", sticker_side="left"),
      quote("A logo isn&rsquo;t an identity. An identity is what the brand can do when no one&rsquo;s watching.", "Studio principle", "wide", key="brand"),
      proj("pratham", "tight"),
      proj("xtdb"),
      stat("8", "Brand identities shipped since 2022.", key="brand"),
      proj("gliitch", "tight"),
      proj("secret-senses"),
    ],
  },
  {
    "id":"band-product", "color":"cyan", "num":"02", "label":"Product &amp; Interface",
    "dir_class":"left-slow", "speed":"42", "dir":"1",
    "items": lambda: [
      proj("klydo"),
      quote("The interface is where research meets opinion. One of them has to lose.", "Kahran, on Agemo", "wide", key="product"),
      proj("agemo", "mega", sticker="behind the scenes →", sticker_color="pink", sticker_side="right"),
      proj("tatsam", "tight"),
      note("our bias", "Make the state obvious before the action.", key="product"),
      proj("convegenius"),
      stat("4", "Products shipped or in flight.", key="product"),
    ],
  },
  {
    "id":"band-research", "color":"yellow", "num":"03", "label":"Research &amp; Strategy",
    "dir_class":"right-fast", "speed":"75", "dir":"-1",
    "items": lambda: [
      proj("agemo", "wide"),
      quote("Research isn&rsquo;t a deck. It&rsquo;s a fight the team has with the user, and someone takes notes.", "Studio principle", "wide", key="research"),
      proj("convegenius", sticker="12 interviews", sticker_color="yellow", sticker_side="right"),
      note("how we work", "User interviews, diary studies, hypothesis sprints, category mapping.", invert=True, key="research"),
      proj("tomboyx", "tight"),
      stat("31", "User interviews across the last three projects.", key="research"),
    ],
  },
  {
    "id":"band-story", "color":"pink", "num":"04", "label":"Story &amp; Narrative",
    "dir_class":"left", "speed":"50", "dir":"1",
    "items": lambda: [
      proj("tomboyx", "wide", sticker="the line that landed", sticker_color="pink", sticker_side="right"),
      quote("All up in our undies.", "TomboyX, the line that landed", "tight", key="story"),
      proj("agemo", "tight"),
      proj("tatsam"),
      note("a tagline took", "26 drafts and a slot machine to find.", key="story"),
      proj("rachna-nivas", "wide"),
      proj("xtdb", "tight"),
      stat("5", "Narratives shipped end to end.", key="story"),
    ],
  },
  {
    "id":"band-growth", "color":"cyan", "num":"05", "label":"Growth &amp; Distribution",
    "dir_class":"right-mid", "speed":"60", "dir":"-1",
    "items": lambda: [
      proj("tatsam"),
      note("we don&rsquo;t run ads", "We build compounding surfaces. Content, docs, packaging, pitch.", invert=True, key="growth"),
      proj("pratham"),
      proj("xtdb", "wide", sticker="docs as marketing", sticker_color="ink", sticker_side="left"),
      stat("4", "Long-tail channels we&rsquo;ve built into engines.", key="growth"),
      proj("klydo", "tight"),
    ],
  },
]

def render_band(b):
    items = b["items"]()
    block = "\n".join(items)
    dots = band_dots(b["id"])
    return ('  <!-- =========== BAND ' + b["num"] + ' — ' + DISC_LABEL[b["id"].split("-")[1]].upper() + ' =========== -->\n'
            '  <section class="band" id="' + b["id"] + '" data-color="' + b["color"] + '">\n'
            '    <div class="band-head">\n'
            '      <span class="band-num">' + b["num"] + '</span>\n'
            '      <span class="band-name">' + b["label"] + '</span>\n'
            '    </div>\n'
            '    <div class="marquee ' + b["dir_class"] + '" data-speed="' + b["speed"] + '" data-dir="' + b["dir"] + '">\n'
            + block + '\n'
            + block + '\n'
            '    </div>\n'
            '  </section>\n')

if __name__ == "__main__":
    import sys
    out = "\n".join(render_band(b) for b in BANDS)
    sys.stdout.write(out)
