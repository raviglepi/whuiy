/**
 * Content for the Craft example, captured from craft.gustavofior.com: short
 * essays on the details that make interfaces feel considered.
 */

export type Chapter = "Craft" | "Typography" | "Color" | "Layout" | "Motion" | "Sound" | "Data";

export interface Entry {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly chapter: Chapter;
  readonly status: "published" | "soon";
}

export interface Link {
  readonly text: string;
  readonly href: string;
}

export type Block =
  | {readonly kind: "prose"; readonly text: string}
  | {readonly kind: "list"; readonly items: readonly string[]}
  | {readonly kind: "code"; readonly code: string; readonly filename?: string}
  | {readonly kind: "quote"; readonly text: string; readonly cite?: string};

export interface Section {
  readonly heading?: string;
  readonly blocks: readonly Block[];
}

export interface Resource {
  readonly title: string;
  readonly href: string;
  readonly blurb: string;
}

export interface Essay {
  readonly slug: string;
  readonly title: string;
  readonly chapter: Chapter;
  readonly tagline: string;
  readonly sections: readonly Section[];
  readonly resources: readonly Resource[];
  readonly prev?: Link;
  readonly next?: Link;
}

export const intro: readonly string[] = [
  "A collection of design engineering concepts. These essays are short and simple, meant as a collection of useful ideas and tricks rather than an exhaustive resource.",
  "This project is brought to you by [Gustavo](https://gustavofior.com), a guy who likes computers and beautiful things. I also created a skill based on these guides:",
];

export const chapters: readonly Chapter[] = [
  "Craft",
  "Typography",
  "Color",
  "Layout",
  "Motion",
  "Sound",
  "Data",
];

export const entries: readonly Entry[] = [
  {
    slug: "performance-is-design",
    title: "Performance Is Design",
    tagline: "How fast it feels is a design choice.",
    chapter: "Craft",
    status: "soon",
  },
  {
    slug: "how-to-get-references",
    title: "How to Get References",
    tagline: "Great work starts with great inputs.",
    chapter: "Craft",
    status: "soon",
  },
  {
    slug: "novelty-budget",
    title: "Novelty Budget",
    tagline: "Save delight for the rare moments.",
    chapter: "Craft",
    status: "soon",
  },
  {
    slug: "taste-is-trained",
    title: "Taste Is Trained",
    tagline: "Taste is a skill, and it takes reps.",
    chapter: "Craft",
    status: "soon",
  },
  {
    slug: "timelessness",
    title: "Timelessness",
    tagline: "Surface ages fast. Structure doesn't.",
    chapter: "Craft",
    status: "soon",
  },
  {
    slug: "letter-spacing",
    title: "Letter Spacing",
    tagline: "Tighten big text, loosen small text.",
    chapter: "Typography",
    status: "soon",
  },
  {
    slug: "text-wrapping",
    title: "Text Wrapping",
    tagline: "Balanced headings, no lonely last words.",
    chapter: "Typography",
    status: "soon",
  },
  {
    slug: "tabular-numbers",
    title: "Tabular Numbers",
    tagline: "Steady digits for values that change.",
    chapter: "Typography",
    status: "published",
  },
  {
    slug: "optical-alignment",
    title: "Optical Alignment",
    tagline: "Center for the eye, not the math.",
    chapter: "Typography",
    status: "published",
  },
  {
    slug: "icons",
    title: "Icons",
    tagline: "One set, one weight, sized to the text.",
    chapter: "Typography",
    status: "soon",
  },
  {
    slug: "font-smoothing",
    title: "Font Smoothing",
    tagline: "Light text on dark renders heavier.",
    chapter: "Typography",
    status: "published",
  },
  {
    slug: "oklch",
    title: "OKLCH",
    tagline: "Lightness values that look equal.",
    chapter: "Color",
    status: "soon",
  },
  {
    slug: "noise",
    title: "Noise",
    tagline: "Grain hides banding and adds texture.",
    chapter: "Color",
    status: "published",
  },
  {
    slug: "shadows-not-borders",
    title: "Shadows, Not Borders",
    tagline: "Layered shadows give edge and depth.",
    chapter: "Color",
    status: "soon",
  },
  {
    slug: "image-outlines",
    title: "Image Outlines",
    tagline: "A faint inner edge that frames images.",
    chapter: "Color",
    status: "published",
  },
  {
    slug: "nested-border-radius",
    title: "Nested Border Radius",
    tagline: "Inner radius is outer minus padding.",
    chapter: "Layout",
    status: "published",
  },
  {
    slug: "hit-areas",
    title: "Hit Areas",
    tagline: "Make the target bigger than the icon.",
    chapter: "Layout",
    status: "soon",
  },
  {
    slug: "html-background",
    title: "HTML Background",
    tagline: "Paint the canvas behind your page.",
    chapter: "Layout",
    status: "published",
  },
  {
    slug: "clip-path",
    title: "Clip-Path",
    tagline: "Reveal by clipping, not resizing.",
    chapter: "Layout",
    status: "soon",
  },
  {
    slug: "scroll-fades",
    title: "Scroll Fades",
    tagline: "Fade the edge that has more to scroll.",
    chapter: "Layout",
    status: "published",
  },
  {
    slug: "squircles",
    title: "Squircles",
    tagline: "Corners that ease into the edge.",
    chapter: "Layout",
    status: "soon",
  },
  {
    slug: "icon-morph",
    title: "Icon Morph",
    tagline: "Blur, scale and fade between icons.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "button-press",
    title: "Button Press",
    tagline: "Scale down on press so it feels real.",
    chapter: "Motion",
    status: "published",
  },
  {
    slug: "easings",
    title: "Easings",
    tagline: "Ease-out for anything the user triggers.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "stagger",
    title: "Stagger",
    tagline: "Turn one block into a sequence.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "interruptibility",
    title: "Interruptibility",
    tagline: "Let people change their mind mid-motion.",
    chapter: "Motion",
    status: "published",
  },
  {
    slug: "hover-restraint",
    title: "Hover Restraint",
    tagline: "Frequent interactions should be instant.",
    chapter: "Motion",
    status: "published",
  },
  {
    slug: "shared-layout",
    title: "Shared Layout",
    tagline: "One element moving beats two swapping.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "exit-animations",
    title: "Exit Animations",
    tagline: "Leave faster and quieter than you came.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "scale-entrances",
    title: "Scale Entrances",
    tagline: "Grow from the trigger, not from zero.",
    chapter: "Motion",
    status: "soon",
  },
  {
    slug: "interface-sfx",
    title: "Interface SFX",
    tagline: "Quiet sounds that confirm actions.",
    chapter: "Sound",
    status: "soon",
  },
  {
    slug: "layering-sounds",
    title: "Layering Sounds",
    tagline: "Stack short sources into one full cue.",
    chapter: "Sound",
    status: "soon",
  },
  {
    slug: "living-charts",
    title: "Living Charts",
    tagline: "Charts that flow instead of jump.",
    chapter: "Data",
    status: "soon",
  },
  {
    slug: "curve-smoothing",
    title: "Curve Smoothing",
    tagline: "Smooth lines that don't invent data.",
    chapter: "Data",
    status: "soon",
  },
];

export const essays: readonly Essay[] = [
  {
    slug: "tabular-numbers",
    title: "Tabular Numbers",
    chapter: "Typography",
    tagline: "Steady digits for values that change.",
    sections: [
      {
        blocks: [
          {kind: "prose", text: "Digits can have two kinds of widths."},
          {
            kind: "prose",
            text: "Proportional figures use the natural width of each shape: `1` is narrow, while `8` is wide. Tabular figures give every digit the same width.",
          },
          {
            kind: "prose",
            text: "Use proportional figures when numbers sit inside a sentence. They read more naturally. Use tabular figures when changing values need to stay steady or align vertically.",
          },
        ],
      },
      {
        heading: "Changing values",
        blocks: [
          {
            kind: "prose",
            text: "A timer made with proportional figures changes width as it runs. Everything beside it moves too. Watch the blue edge:",
          },
          {
            kind: "prose",
            text: "Tabular figures turn every character into a stable slot. Use them for clocks, counters, scores, prices, and live metrics.",
          },
          {
            kind: "prose",
            text: "The usual instinct here is to switch to a monospace font, but you don't need to. A mono font changes the whole voice of the interface. Often, you just need to use tabular figures.",
          },
        ],
      },
      {
        heading: "Tables",
        blocks: [
          {
            kind: "prose",
            text: "In a numeric column, equal-width digits create a vertical grid. Repeated places line up, so differences are easier to scan. It feels much better to see data this way.",
          },
          {
            kind: "prose",
            text: "Right-align numeric columns as well. Right alignment keeps numbers with different lengths anchored to the same edge.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {kind: "code", code: '<span class="tabular-nums">12:45</span>', filename: "app.tsx"},
          {
            kind: "prose",
            text: "The font must include tabular figures for this to work. If `tabular-nums` makes no visible difference, drop the font file into [Wakamai Fondue](https://wakamaifondue.com) and check whether it lists `tnum` among its features.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Details that make interfaces feel better",
        href: "https://jakub.kr/writing/details-that-make-interfaces-feel-better",
        blurb: "A practical collection of small interface improvements.",
      },
      {
        title: "font-variant-numeric",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric",
        blurb: "Syntax, examples, and browser support on MDN.",
      },
      {
        title: "CSS Fonts Module Level 4 — Numerical formatting",
        href: "https://www.w3.org/TR/css-fonts-4/#font-variant-numeric-prop",
        blurb: "The specification behind proportional and tabular figures.",
      },
      {
        title: "OpenType tabular figures",
        href: "https://learn.microsoft.com/en-us/typography/opentype/otspec190/features_pt#tag-tnum",
        blurb: "How the tnum font feature maps digits to uniform widths.",
      },
      {
        title: "Wakamai Fondue",
        href: "https://wakamaifondue.com",
        blurb: "Drop in a font file to see every OpenType feature it supports.",
      },
    ],
    next: {text: "Optical Alignment", href: "https://craft.gustavofior.com/optical-alignment"},
  },
  {
    slug: "optical-alignment",
    title: "Optical Alignment",
    chapter: "Typography",
    tagline: "Center for the eye, not the math.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Aligning icons exactly by their edges doesn't always look right. A tiny shift is often needed because different shapes feel heavier or lighter to the eye.",
          },
          {
            kind: "prose",
            text: "Optical alignment means nudging things until they look right, then keeping the nudge.",
          },
          {
            kind: "prose",
            text: "The play icon moves left, because a triangle pointing right has most of its area on the left. The star and the download icon move up a bit. The amounts are tiny and specific to each icon, so this is a per icon decision, not a global rule.",
          },
        ],
      },
      {
        heading: "How to align the icon",
        blocks: [
          {
            kind: "prose",
            text: "A good test is to blur the icon. Add a heavy `filter: blur()` to it in the inspector, or squint at it, and the shape collapses into a soft blob of ink.",
          },
          {
            kind: "prose",
            text: "The blob sits where the icon's visual weight is, not where its bounding box is, so if it lands off the center of the button the nudge you need is the distance back. Sharp edges hide this, because your eye reads the outline and trusts it. Blur removes the outline and leaves only the weight.",
          },
        ],
      },
      {
        heading: "Buttons with icons",
        blocks: [
          {
            kind: "prose",
            text: "The same thing happens with padding. An icon has air inside its box, and that air adds to the padding next to it. Equal padding on both sides ends up looking heavier on the icon side.",
          },
          {
            kind: "prose",
            text: "Shave a few pixels off the padding on the side that holds the icon.",
          },
        ],
      },
      {
        heading: "Shape weight",
        blocks: [
          {
            kind: "prose",
            text: "Different shapes have varying visual weight. For example, when a circle or triangle is drawn inside the same box as a square, it appears smaller to the eye.",
          },
        ],
      },
      {
        heading: "Optical sizes",
        blocks: [
          {
            kind: "prose",
            text: "Type has the same problem across sizes. Strokes that are sturdy at 14px look clumsy at 40px. Some typefaces ship an optical size axis that redraws the letters for the size they are set at.",
          },
          {
            kind: "prose",
            text: "Browsers turn this on automatically through `font-optical-sizing: auto`, so you usually get the right design for free. The demo forces the text design onto a display size so you can see what you would be missing.",
          },
        ],
      },
      {
        heading: "Hanging punctuation",
        blocks: [
          {
            kind: "prose",
            text: "A quote that starts with a quotation mark looks indented, because the mark is mostly whitespace. Hanging it into the margin lines the first letter up with the text below.",
          },
          {
            kind: "prose",
            text: "Safari supports `hanging-punctuation: first`. Elsewhere a small negative `text-indent` gets the same result for a known opening character.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "code",
            code: '<button class="grid size-12 place-items-center rounded-full">\n    <PlayIcon class="size-5 translate-x-px" weight="fill" />\n</button>\n\n<blockquote class="indent-[-0.42em]">\n    “Good design is as little design as possible.”\n</blockquote>',
            filename: "app.tsx",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Apple Human Interface Guidelines on icons",
        href: "https://developer.apple.com/design/human-interface-guidelines/icons",
        blurb: "Apple's rules for optical balance inside an icon's bounding shape.",
      },
      {
        title: "Details that make interfaces feel better",
        href: "https://jakub.kr/writing/details-that-make-interfaces-feel-better",
        blurb: "A short list of fixes, several of which are optical adjustments like these.",
      },
      {
        title: "hanging-punctuation",
        href: "https://www.w3.org/TR/css-inline-3/#hanging-punctuation-property",
        blurb: "The CSS spec for letting quotes hang outside the text box.",
      },
      {
        title: "Inter features",
        href: "https://rsms.me/inter/#features",
        blurb: "What the optical size axis of Inter actually changes.",
      },
    ],
    prev: {text: "Tabular Numbers", href: "https://craft.gustavofior.com/tabular-numbers"},
    next: {text: "Font Smoothing", href: "https://craft.gustavofior.com/font-smoothing"},
  },
  {
    slug: "font-smoothing",
    title: "Font Smoothing",
    chapter: "Typography",
    tagline: "Light text on dark renders heavier.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Put white text on a dark surface and look closely. On a Mac, it comes out a little bolder and a little fuzzier than the same text on white.",
          },
          {
            kind: "prose",
            text: "MacOS smooths text in browsers by thickening the edges of every glyph, a leftover from the days of subpixel rendering on low resolution screens. On dark backgrounds that extra thickness reads as bloom.",
          },
          {
            kind: "prose",
            text: "Every demo on this page only changes on a Mac. Windows renders with ClearType and ignores the property, Linux never had it, and iOS Safari does not do subpixel antialiasing at all. If you are reading this anywhere but macOS, nothing below will look any different.",
          },
          {
            kind: "prose",
            text: "The property is `-webkit-font-smoothing: antialiased`. It tells the browser to skip the thickening and use plain grayscale antialiasing, which renders the glyph at its true weight.",
          },
        ],
      },
      {
        heading: "Where it shows",
        blocks: [
          {
            kind: "prose",
            text: "The difference is easy to see on dark backgrounds and a bit harder to see on light ones.",
          },
          {
            kind: "prose",
            text: "That is why this mostly comes up when a product ships a dark mode. Everything looks fine in light mode, then the dark theme arrives and every heading feels half a weight heavier than the design file.",
          },
        ],
      },
      {
        heading: "Thin weights",
        blocks: [
          {
            kind: "prose",
            text: "The thickening the default rendering adds is the same for every weight, but it is not felt the same way. A bold heading barely needs it, while a light weight often relies on it: sometimes 300 only looks readable on a dark background because the renderer has been quietly fattening it.",
          },
          {
            kind: "prose",
            text: "From 400 up, the antialiased side just looks cleaner. At 300 the text comes out lighter than you meant, and at 200 the strokes start to fall apart. Thin text gets even thinner on a non-Retina screen, where a stroke can be less than a pixel wide. So if you set body text at 300 or below on dark surfaces, give it a look on a 1x display before turning this on everywhere. If you stick to 400 and up, like most products do, you are fine.",
          },
        ],
      },
      {
        heading: "The other two values",
        blocks: [
          {
            kind: "prose",
            text: "The property takes four values, and the two nobody reaches for are worth knowing.",
          },
          {
            kind: "prose",
            text: "`none` turns antialiasing off entirely. Edges go hard and stepped, the way type looked before any of this existed. There is no real use for it in a product, but it is the fastest way to see how much work antialiasing is doing.",
          },
          {
            kind: "prose",
            text: "`subpixel-antialiased` is the one you might actually want one day. It forces the default back on, which matters because the recommendation below is a global rule on `body`. Once that is in place you have no way to exempt a region without this value.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "code",
            code: '<body class="antialiased">\n  <!-- ...and one region that wants the default back -->\n  <div class="subpixel-antialiased">...</div>\n</body>',
            filename: "app.tsx",
          },
          {
            kind: "prose",
            text: "Both properties are non-standard and only do anything on macOS. Windows, Linux, iOS and Android ignore them, which is fine, because the bloom is a macOS problem. Since Firefox 128, Firefox on macOS treats the WebKit property as its own, so the `-moz-osx-font-smoothing` line is only there for older versions.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "font-smooth",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth",
        blurb: "MDN on the non-standard smoothing properties and their browser support.",
      },
      {
        title: "Details that make interfaces feel better",
        href: "https://jakub.kr/writing/details-that-make-interfaces-feel-better",
        blurb: "A practical collection of small interface improvements, including this one.",
      },
      {
        title: "What is -webkit-font-smoothing?",
        href: "https://dbushell.com/2024/11/05/webkit-font-smoothing/",
        blurb:
          "David Bushell on what the property changes, where it has no effect, and why the Firefox prefix is no longer needed.",
      },
      {
        title: "Laissez-faire font smoothing and anti-aliasing",
        href: "https://www.zachleat.com/web/font-smooth/",
        blurb: "Zach Leatherman on what the property does and the case against using it blindly.",
      },
      {
        title: "Font smoothing in Tailwind",
        href: "https://tailwindcss.com/docs/font-smoothing",
        blurb: "The antialiased and subpixel-antialiased utilities.",
      },
    ],
    prev: {text: "Optical Alignment", href: "https://craft.gustavofior.com/optical-alignment"},
    next: {text: "Noise", href: "https://craft.gustavofior.com/noise"},
  },
  {
    slug: "noise",
    title: "Noise",
    chapter: "Color",
    tagline: "Grain hides banding and adds texture.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "When the UI feels too flat, sometimes I like to add noise to some components to give them some texture.",
          },
          {
            kind: "prose",
            text: "Noise is a layer of random light and dark pixels laid over the surface. It breaks the steps up and gives the color some texture.",
          },
        ],
      },
      {
        heading: "Grain size",
        blocks: [
          {
            kind: "prose",
            text: "The `baseFrequency` attribute controls how fine the noise is. Low values give big soft blobs, whle high values give the tight speckle of film grain.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put the filter in one SVG anywhere on the page, then reference it from an overlay. The overlay is an empty element, so it costs nothing in markup and can be dropped onto any positioned container.",
          },
          {
            kind: "code",
            code: '<svg class="absolute size-0" aria-hidden="true">\n  <filter id="grain">\n    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />\n    <feColorMatrix type="saturate" values="0" />\n  </filter>\n</svg>\n\n<div class="relative isolate overflow-hidden rounded-2xl bg-violet-600">\n  <div class="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay filter-[url(#grain)]" aria-hidden="true"></div>\n  <!-- content -->\n</div>',
            filename: "app.tsx",
          },
          {
            kind: "prose",
            text: "The `isolate` on the container matters. Without it, `mix-blend-mode` blends the grain with everything behind the card, including the page background, and the effect changes depending on where the card sits. With it, the grain only ever blends with the surface it belongs to.",
          },
        ],
      },
      {
        heading: "Performance",
        blocks: [
          {
            kind: "prose",
            text: "The filter is not free. `feTurbulence` is generated per pixel and re-rendered whenever the element repaints. On a card that is a few hundred pixels wide you will never notice. Stretched across a full-screen hero, especially one that scrolls or animates, it can drop a page to a handful of frames per second on a phone or a low-end laptop.",
          },
          {
            kind: "prose",
            text: 'The fix is to render the noise once and tile it. With `stitchTiles="stitch"` and the filter region pinned to the tile, a small tile repeats seamlessly, and a tiled image costs the browser almost nothing after the first paint. The result looks the same for static grain. The only thing you give up is tuning `baseFrequency` live, since the frequency is baked into the tile.',
          },
          {
            kind: "prose",
            text: "You do not even need an image file. Put the filter inside an SVG data URI and let the browser rasterize it once per tile:",
          },
          {
            kind: "code",
            code: "<div class=\"relative isolate min-h-screen overflow-hidden bg-violet-600\">\n  <div\n    class=\"pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay bg-size-[200px_200px] bg-repeat\"\n    style=\"background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E&quot;)\"\n    aria-hidden=\"true\"\n  ></div>\n  <!-- content -->\n</div>",
            filename: "app.tsx",
          },
          {
            kind: "prose",
            text: "A 200px tile is small enough to be cheap and large enough that the repeat is invisible under the blend. If you can see the seams, export the tile as a PNG at 2x instead and use that as the `background-image`.",
          },
          {
            kind: "prose",
            text: "As a rule: use the live filter on small surfaces and in demos where you want to tweak the grain. Use a tiled image anywhere the overlay is large or the page is expected to move.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "feTurbulence",
        href: "https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence",
        blurb: "The SVG filter primitive that generates the noise. Everything here is built on it.",
      },
      {
        title: "Grainy Gradients",
        href: "https://css-tricks.com/grainy-gradients/",
        blurb:
          "A thorough walkthrough of noise on gradients, with the color matrix tricks explained.",
      },
      {
        title: "mix-blend-mode",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode",
        blurb: "How the grain layer combines with the color underneath it.",
      },
    ],
    prev: {text: "Font Smoothing", href: "https://craft.gustavofior.com/font-smoothing"},
    next: {text: "Image Outlines", href: "https://craft.gustavofior.com/image-outlines"},
  },
  {
    slug: "image-outlines",
    title: "Image Outlines",
    chapter: "Color",
    tagline: "A faint inner edge that frames images.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Images do not know what is behind them. A pale sky on a white card has no edge at all, and a photo with a bright corner blends into the page.",
          },
          {
            kind: "prose",
            text: "An inset outline fixes that with one line, drawn just inside the image at around 10% opacity.",
          },
          {
            kind: "prose",
            text: "The outline's visibility can vary based on light or dark mode and the image content.",
          },
          {
            kind: "prose",
            text: "The line is too faint to read as a border. What you notice instead is that every image suddenly has a shape.",
          },
          {
            kind: "prose",
            text: "I basically learned this trick from [Jakub](https://jakub.kr/writing/details-that-make-interfaces-feel-better). It is one of those details you cannot unsee once someone points it out.",
          },
        ],
      },
      {
        heading: "Why not a border",
        blocks: [
          {
            kind: "prose",
            text: "A `border` sits between the padding and the margin, so it takes up space. Adding one pushes content around and changes the size of the box.",
          },
          {
            kind: "prose",
            text: "Paint the line over the image, not around it. An `outline` with a negative `outline-offset`, or an inset `box-shadow`, sits on top of the outermost pixels.",
          },
        ],
      },
      {
        heading: "How strong",
        blocks: [
          {
            kind: "prose",
            text: "Ten percent is a good default, but I like to tune it differently for light and dark mode sometimes.",
          },
          {
            kind: "prose",
            text: "Below about 5% the line disappears against the pale sky. Above about 20% it starts to look like a frame, and the eye reads it as a design element instead of a fix. Stay in between.",
          },
        ],
      },
      {
        heading: "Avatars",
        blocks: [
          {
            kind: "prose",
            text: "Avatars are where this matters most. They are small, round, and often mostly white: an initial on a light background, a pale logo, a photo of someone against a wall. Without an edge they float on the surface.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Set the outline color per theme. Black at 10% on light, white at 10% on dark.",
          },
          {
            kind: "code",
            code: '<img\n  class="rounded-lg outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"\n  src="/cover.jpg"\n  alt="Album cover"\n/>',
            filename: "app.tsx",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Details that make interfaces feel better",
        href: "https://jakub.kr/writing/details-that-make-interfaces-feel-better",
        blurb:
          "Jakub Krehel's list of small touches, including the inset image outline this page is about.",
      },
      {
        title: "outline-offset",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/outline-offset",
        blurb: "The property that pulls an outline inside the box instead of around it.",
      },
      {
        title: "box-shadow",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow",
        blurb:
          "The inset form is the other way to draw the same line, with full support for rounded corners.",
      },
      {
        title: "color-mix()",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix",
        blurb:
          "Handy for mixing the outline color into the current text color so it adapts to any theme.",
      },
    ],
    prev: {text: "Noise", href: "https://craft.gustavofior.com/noise"},
    next: {
      text: "Nested Border Radius",
      href: "https://craft.gustavofior.com/nested-border-radius",
    },
  },
  {
    slug: "nested-border-radius",
    title: "Nested Border Radius",
    chapter: "Layout",
    tagline: "Inner radius is outer minus padding.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Rounded corners look best when one curve follows the other. If a box sits inside another box, using the same radius on both usually makes the gap wider near the corner.",
          },
          {
            kind: "prose",
            text: "This is one of those little things that makes an interface feel off.",
          },
          {kind: "prose", text: "The fix is a simple relationship:"},
          {kind: "quote", text: "outer radius = inner radius + inset"},
          {
            kind: "prose",
            text: "The inset is the distance between the two edges. It is often the parent’s padding. If the parent has a border, include its width too.",
          },
          {
            kind: "prose",
            text: "In the demo, the inner radius is `16px` and the inset is `12px`. That makes the outer radius `28px`.",
          },
        ],
      },
      {
        heading: "Start from the outer radius",
        blocks: [
          {
            kind: "prose",
            text: "Design systems usually start with a radius on the outer component. In that case, reverse the formula:",
          },
          {kind: "quote", text: "inner radius = outer radius − inset"},
          {
            kind: "prose",
            text: "The inner radius cannot go below zero. If the inset is larger than the outer radius, use a square inner corner. In CSS, `max()` can handle that limit for you.",
          },
        ],
      },
      {
        heading: "Real components",
        blocks: [
          {
            kind: "prose",
            text: "The difference is easier to see in a card or a menu than in an empty diagram.",
          },
          {
            kind: "prose",
            text: "The card has a `16px` outer radius and an `8px` inset, so its media uses `8px`. The menu has a `12px` outer radius and a `4px` inset, so its highlighted item uses `8px`.",
          },
        ],
      },
      {
        heading: "When to adjust it",
        blocks: [
          {
            kind: "prose",
            text: "The formula is a strong starting point, not a rule for every shape. Tune the result by eye when the inset changes around the component, the inner element does not reach the corner, or the surfaces use different corner shapes.",
          },
          {
            kind: "prose",
            text: "The fancy name for this is concentric corners: nested corners whose curves share the same center.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "The math behind nesting rounded corners",
        href: "https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/",
        blurb: "Cloud Four’s explanation of the radius formula with practical CSS examples.",
      },
      {
        title: "border-radius",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-radius",
        blurb: "MDN’s reference for the CSS border-radius property.",
      },
      {
        title: "CSS corner shaping",
        href: "https://www.w3.org/TR/css-backgrounds-3/#corners",
        blurb: "The specification for outer, padding, and content edge radii.",
      },
    ],
    prev: {text: "Image Outlines", href: "https://craft.gustavofior.com/image-outlines"},
    next: {text: "HTML Background", href: "https://craft.gustavofior.com/html-background"},
  },
  {
    slug: "html-background",
    title: "HTML Background",
    chapter: "Layout",
    tagline: "Paint the canvas behind your page.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Pull past the top of a dark page in Safari and a white strip can appear behind it. The app is dark, but the document canvas is still white.",
          },
          {kind: "prose", text: "The canvas is the surface the browser paints behind the page."},
        ],
      },
      {
        heading: "The document canvas",
        blocks: [
          {
            kind: "prose",
            text: "A wrapper only paints its own box. When it moves during overscroll, the canvas shows through. Set the background on the root element to paint that surface too.",
          },
          {
            kind: "prose",
            text: "Browsers normally use the `body` background when `html` is transparent. Setting it on `html` directly makes the intended canvas color clear and does not rely on that behavior.",
          },
        ],
      },
      {
        heading: "Other edges",
        blocks: [
          {
            kind: "list",
            items: [
              "Theme color: The `theme-color` meta tag can tint supported browser UI to match the page. Keep it in sync when the theme changes.",
              "Overscroll: `overscroll-behavior: none` can remove the bounce and stop scroll chaining. Use it carefully. The bounce is a familiar part of the platform.",
              "Both themes: The root background must follow the active theme, or the white flash can return in one mode.",
            ],
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {kind: "code", code: '<html class="bg-background">', filename: "app.tsx"},
          {
            kind: "prose",
            text: "Use the same background token for the root and the app. If the theme changes, that token should change with it.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "HTML vs Body in CSS",
        href: "https://css-tricks.com/html-vs-body-in-css/",
        blurb: "A practical look at how the root and body elements behave.",
      },
      {
        title: "Canvas backgrounds",
        href: "https://www.w3.org/TR/css-backgrounds-3/#special-backgrounds",
        blurb: "How browsers paint the document canvas from the root or body.",
      },
      {
        title: "overscroll-behavior",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior",
        blurb: "Control what happens when scrolling reaches a boundary.",
      },
      {
        title: "theme-color",
        href: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color",
        blurb: "Match supported browser chrome to the page background.",
      },
    ],
    prev: {
      text: "Nested Border Radius",
      href: "https://craft.gustavofior.com/nested-border-radius",
    },
    next: {text: "Scroll Fades", href: "https://craft.gustavofior.com/scroll-fades"},
  },
  {
    slug: "scroll-fades",
    title: "Scroll Fades",
    chapter: "Layout",
    tagline: "Fade the edge that has more to scroll.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "A scroll container with a hard edge looks like a list that ends. A scroll fade dissolves the rows at the edge into the background, so the reader understands there is more to see without a scrollbar telling them.",
          },
          {
            kind: "prose",
            text: "The fade comes from `mask-image` with a linear gradient. A mask is not a layer on top. It sets how visible each part of the element is: where the gradient is opaque the content shows, where it is transparent the content disappears. Because it is a mask and not an overlay, it works over any background, including images and gradients, and it never blocks clicks.",
          },
        ],
      },
      {
        heading: "Only fade the side that can scroll",
        blocks: [
          {
            kind: "prose",
            text: "The obvious version is a static mask on both ends. It has one flaw: it fades the first row when you are at the top, and the last row when you are at the bottom. At the bottom this is actively misleading. The final item looks half hidden, as if something is still below it.",
          },
          {
            kind: "prose",
            text: "The right list only fades the edge that still has content behind it. The trick is that the two fade sizes are custom properties, and a scroll-driven animation moves them. The top fade grows from `0` to its full size over the first `3rem` of scrolling, the bottom fade shrinks back to `0` over the last `3rem`.",
          },
        ],
      },
      {
        heading: "Horizontal rows",
        blocks: [
          {
            kind: "prose",
            text: "The same idea applies sideways. A row of chips or tabs that overflows should fade at the edge that can still scroll, which also hints at the gesture.",
          },
          {
            kind: "prose",
            text: "I like to hide the scrollbar on rows like this. I know that we lose the indication of how much is left to scroll, but a horizontal bar under a row of chips is just too much visual noise.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "code",
            code: '<!-- scroll-fade-y and scroll-fade-x come from the CSS tab -->\n\n<!-- Vertical -->\n<div class="h-44 overflow-y-auto scroll-fade-y">\n  ...\n</div>\n\n<!-- Horizontal, and hide the scrollbar -->\n<div class="flex overflow-x-auto scroll-fade-x scrollbar-none">\n  ...\n</div>',
            filename: "app.tsx",
          },
          {
            kind: "prose",
            text: "One thing to know: the mask applies to the whole scroll container, scrollbar included, so a visible scrollbar fades out at both ends too. Either hide it, as above, or move the mask to an inner wrapper and let the outer element scroll.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Scroll Fade in shadcn/ui",
        href: "https://ui.shadcn.com/docs/utils/scroll-fade",
        blurb:
          "A CSS-only utility that fades the edges of a scroll container and reveals them as you reach the end. The approach this article follows.",
      },
      {
        title: "mask-image on MDN",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image",
        blurb: "The property that does the fading, with the gradient and image forms it accepts.",
      },
      {
        title: "Scroll-driven animations",
        href: "https://developer.chrome.com/docs/css-ui/scroll-driven-animations",
        blurb:
          "How animation-timeline and animation-range tie an animation to a scroll position instead of time.",
      },
      {
        title: "@property on MDN",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/@property",
        blurb:
          "Registering a custom property so the browser can animate it, which the edge aware fade relies on.",
      },
      {
        title: "Building the Next.js website",
        href: "https://rauno.me/craft/nextjs",
        blurb:
          "Rauno Freiberg on the small layout details of a real site, including masking the edges of decorative elements.",
      },
    ],
    prev: {text: "HTML Background", href: "https://craft.gustavofior.com/html-background"},
    next: {text: "Button Press", href: "https://craft.gustavofior.com/button-press"},
  },
  {
    slug: "button-press",
    title: "Button Press",
    chapter: "Motion",
    tagline: "Scale down on press so it feels real.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "A real button moves when you push it. A button on screen can borrow that with one rule: scale it down a little while it is pressed. It is the cheapest feedback the web has, and it makes the button feel like it heard you.",
          },
          {
            kind: "prose",
            text: "The one on the right is not doing much. It shrinks to 97% for as long as your finger is down, then eases back to full size.",
          },
          {
            kind: "prose",
            text: 'The goal with press feedback is to make it invisible. Nobody should think "oh, the button scales". If they do, the animation is too much.',
          },
        ],
      },
      {
        heading: "Finding the amount",
        blocks: [
          {
            kind: "prose",
            text: "Two numbers matter: how far the button shrinks and how quickly it gets there.",
          },
          {
            kind: "prose",
            text: "I like `0.98` or `0.97` for the scale. Below `0.95` it starts to look like an effect, and people notice the animation instead of the click. For the duration, I usually go somewhere between `100ms` and `150ms`. Longer than that and the button lags behind your finger, which feels worse than no feedback at all.",
          },
        ],
      },
      {
        heading: "Not just buttons",
        blocks: [
          {
            kind: "prose",
            text: "This works on other clickable things too: cards, tiles, chips. Just be careful not to overdo it.",
          },
          {
            kind: "prose",
            text: "Larger surfaces should shrink less. A full-width card at `0.97` moves several pixels at the edges, which is a lot more than a button does at the same scale.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "code",
            code: '<button\n  class="transition-transform duration-100 ease-out active:scale-[0.97] disabled:active:scale-100 motion-reduce:transition-none [-webkit-tap-highlight-color:transparent]"\n>\n  Save changes\n</button>',
            filename: "app.tsx",
          },
          {
            kind: "prose",
            text: "Transition `transform` only, not `all`, so the press timing does not leak into hover colors. A disabled button should not press, and on iOS it is worth clearing the grey tap highlight so it does not flash over the scale.",
          },
          {
            kind: "prose",
            text: "iOS Safari also only applies `:active` while something on the page listens for touches. Frameworks like React already do, but on a plain page add an empty listener, or the press never shows:",
          },
          {
            kind: "code",
            code: 'button.addEventListener("touchstart", () => {}, { passive: true });',
            filename: "app.js",
          },
        ],
      },
    ],
    resources: [
      {
        title: "7 practical animation tips",
        href: "https://emilkowal.ski/ui/7-practical-animation-tips",
        blurb:
          "Emil Kowalski's short list of rules for interface motion, including the press scale.",
      },
      {
        title: "Great animations",
        href: "https://emilkowal.ski/ui/great-animations",
        blurb: "What separates motion that feels right from motion that just moves.",
      },
      {
        title: "Invisible Details of Interaction Design",
        href: "https://rauno.me/craft/interaction-design",
        blurb: "Rauno Freiberg on feedback that should apply the moment you touch something.",
      },
      {
        title: "The :active pseudo-class",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/:active",
        blurb: "When the browser considers an element pressed, on mouse and on keyboard.",
      },
      {
        title: "Animations guide",
        href: "https://web.dev/articles/animations-guide",
        blurb: "Why transform and opacity are the properties you can animate cheaply.",
      },
    ],
    prev: {text: "Scroll Fades", href: "https://craft.gustavofior.com/scroll-fades"},
    next: {text: "Interruptibility", href: "https://craft.gustavofior.com/interruptibility"},
  },
  {
    slug: "interruptibility",
    title: "Interruptibility",
    chapter: "Motion",
    tagline: "Let people change their mind mid-motion.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Open a sheet, then close it before it finishes arriving. What should happen?",
          },
          {
            kind: "prose",
            text: "The obvious answer is that it should turn around. It is somewhere in the middle, so it should head back from there. That is interruptibility: an animation that can change its mind. It sounds too simple to be worth a name, which is exactly why it is so jarring when an interface gets it wrong.",
          },
          {
            kind: "prose",
            text: "Tap the button twice, quickly. The left sheet will jump to fully open and then slides down, as if closing had to start from the beginning. The right one turns around wherever it happens to be.",
          },
          {
            kind: "prose",
            text: "Both look identical if you wait. The difference only shows when you do not wait, and trust me, most people do not wait.",
          },
        ],
      },
      {
        heading: "A recording and a destination",
        blocks: [
          {
            kind: "prose",
            text: 'The left sheet runs on CSS keyframes, one clip for opening and one for closing. A keyframe animation is a "recording". It has a first frame and a last frame, and when you play it, it plays from the first frame no matter where the element currently is. Closing mid-flight means jumping to the start of the closing clip, which is fully open, and sliding down from there.',
          },
          {
            kind: "prose",
            text: 'The right sheet runs on a CSS transition. A transition is not a recording, it is a "destination". You tell the browser where the element should be, and it animates from wherever the element is right now. If the destination changes halfway, it simply aims at the new one and keeps going.',
          },
          {
            kind: "prose",
            text: "That is most of the idea. Describe where things should end up, not the trip to get there. Transitions, Motion's `animate`, and springs all work this way. Keyframes do not.",
          },
        ],
      },
      {
        heading: "Never lock the door",
        blocks: [
          {
            kind: "prose",
            text: 'Another way to get it wrong is to "lock the door". The animation is fine, but the interface stops listening while it runs. An `isAnimating` flag drops clicks, or `pointer-events: none` stays on until the motion is done.',
          },
          {
            kind: "prose",
            text: "If you click too fast, you'll notice some of your taps vanish. The interface decided its animation mattered more than your input and made you wait. It is only a few hundred milliseconds, but it is long enough to feel ignored, so people tap again, which drops another tap, which makes it worse.",
          },
          {
            kind: "prose",
            text: "The right menu stays listening the whole time. If you tap at any point, the menu will hear you. You shouldn't be obligated to wait for the full animation to finish.",
          },
        ],
      },
      {
        heading: "Keep the momentum",
        blocks: [
          {
            kind: "prose",
            text: "A transition fixes the jump, but look closely and there is still a small lie in it. Reverse a transition halfway and the element stops, then starts again from a standstill in the other direction. It remembers where it is, but it forgets how fast it was going.",
          },
          {
            kind: "prose",
            text: "A spring remembers both. It is simulated physics: at every frame it knows its position and its speed, and when the target changes it bends that speed toward the new target instead of throwing it away. The turn becomes one movement instead of two.",
          },
          {
            kind: "prose",
            text: "So should everything be a spring? No. [Sonner](https://sonner.emilkowal.ski/) and [Vaul](https://vaul.emilkowal.ski/), two of the best-feeling components on the web, both run on plain CSS transitions and never feel broken. A good ease-out transition is enough for most sheets, menus and sidebars. Reach for a spring when the motion comes from a gesture, like a flicked card that should keep your finger's speed, or when something gets flipped back and forth fast enough that the restart shows.",
          },
        ],
      },
      {
        heading: "When others join in",
        blocks: [
          {
            kind: "prose",
            text: "Interrupting is not only about reversing. Sometimes the animation is still running and something new arrives: a second toast while the first is still settling, a row inserted while the list is still sliding open. Everything already in motion needs a new destination.",
          },
          {
            kind: "prose",
            text: "Press the button a few times, fast. Each toast slides up to make room while the previous one is still landing, and none of them flinch. This is a Motion `layout` animation. Whenever a sibling appears or leaves, Motion measures the new positions and retargets anything still in flight.",
          },
        ],
      },
      {
        heading: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use a transition for anything a person can toggle. Keep keyframes for one-shots nothing can interrupt, like a spinner. And never gate input on an animation: no `isAnimating` guards, no `pointer-events: none` while things move.",
          },
          {
            kind: "code",
            code: ".sheet {\n  transform: translateY(100%);\n  transition: transform 300ms cubic-bezier(0.33, 1, 0.68, 1);\n}\n\n.sheet[data-open] {\ntransform: translateY(0);\n}",
            filename: "styles.css",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Invisible Details of Interaction Design",
        href: "https://rauno.me/craft/interaction-design",
        blurb:
          "Rauno Freiberg on why an interface should never lock the user out while something moves.",
      },
      {
        title: "Building a Toast Component",
        href: "https://emilkowal.ski/ui/building-a-toast-component",
        blurb:
          "Emil Kowalski on Sonner, and why he chose CSS transitions over keyframes so toasts keep moving while others arrive.",
      },
      {
        title: "Animate with springs",
        href: "https://developer.apple.com/videos/play/wwdc2023/10158/",
        blurb:
          "Apple on why springs suit interruptible motion, because they carry velocity into a new target.",
      },
      {
        title: "Using CSS transitions",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions",
        blurb:
          "The MDN reference, including how a transition behaves when its target changes mid-flight.",
      },
      {
        title: "@starting-style",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style",
        blurb: "How to transition an element in from display none without reaching for keyframes.",
      },
      {
        title: "Layout animations in Motion",
        href: "https://motion.dev/docs/react-layout-animations",
        blurb:
          "How Motion retargets layout animations that are already running when the layout changes again.",
      },
    ],
    prev: {text: "Button Press", href: "https://craft.gustavofior.com/button-press"},
    next: {text: "Hover Restraint", href: "https://craft.gustavofior.com/hover-restraint"},
  },
  {
    slug: "hover-restraint",
    title: "Hover Restraint",
    chapter: "Motion",
    tagline: "Frequent interactions should be instant.",
    sections: [
      {
        blocks: [
          {
            kind: "prose",
            text: "Hover fires more than any other interaction. When you sweep the cursor across a nav you can cross ten items in a second. If each one fades in, the interface is always a few frames behind the pointer, and it reads as slow even when nothing is.",
          },
          {
            kind: "prose",
            text: "The more often something happens, the less animation it can afford.",
          },
          {
            kind: "prose",
            text: "The right one switches its highlight on with no transition at all. Instant is the correct default for hover.",
          },
        ],
      },
      {
        heading: "Tooltips",
        blocks: [
          {
            kind: "prose",
            text: "Tooltips are one hover case where a delay helps. Without one they pop up while you are just passing through on the way to something else.",
          },
          {
            kind: "prose",
            text: "So the first tooltip should wait, around 400ms to 700ms, and then its neighbors should appear at once. You have already shown you want the labels, and making you wait again for each one is frustrating.",
          },
        ],
      },
      {
        heading: "Keyboard actions",
        blocks: [
          {kind: "prose", text: "The same thinking applies away from the pointer."},
          {
            kind: "prose",
            text: "Someone toggling a sidebar with a shortcut is your fastest user. They are not looking for the panel to arrive from somewhere. They already know what the shortcut does, and a 250ms slide is like a speeding ticket.",
          },
          {
            kind: "prose",
            text: "The line to draw is by frequency and intent, not by input device. A modal that opens once a session can animate. A panel you flip forty times a day should not.",
          },
          {
            kind: "prose",
            text: "Notable examples of interactions that would be worse if animated:",
          },
          {
            kind: "list",
            items: [
              "[Raycast launcher - Opens and closes with no transition, every time.](https://www.raycast.com/)",
              "[macOS Alt+Tab - Rauno Freiberg on why the app switcher appears instantly.](https://rauno.me/craft/interaction-design)",
            ],
          },
        ],
      },
    ],
    resources: [
      {
        title: "You don't need animations",
        href: "https://emilkowal.ski/ui/you-dont-need-animations",
        blurb:
          "Emil Kowalski on when animation helps and when it gets in the way, with hover as the main case.",
      },
      {
        title: "7 practical animation tips",
        href: "https://emilkowal.ski/ui/7-practical-animation-tips",
        blurb: "Short, concrete rules for interface motion, including how tooltips should behave.",
      },
      {
        title: "Base UI Tooltip",
        href: "https://base-ui.com/react/components/tooltip",
        blurb: "The tooltip used on this site, with the delay and instant-open behavior built in.",
      },
      {
        title: "The :hover pseudo-class",
        href: "https://developer.mozilla.org/en-US/docs/Web/CSS/:hover",
        blurb:
          "What counts as hover across mouse, pen and touch, and why it is unreliable on touch.",
      },
    ],
    prev: {text: "Interruptibility", href: "https://craft.gustavofior.com/interruptibility"},
  },
];

export const goats: readonly Link[] = [
  {text: "Rauno Freiberg ∙ Design engineer at Vercel", href: "https://rauno.me"},
  {text: "Emil Kowalski ∙ Design engineer at Linear", href: "https://emilkowal.ski"},
  {text: "Jakub Krehel ∙ Founding Design Engineer at Interfere", href: "https://jakub.kr"},
  {text: "Paco Coursey ∙ Design engineer at Linear", href: "https://paco.me"},
  {text: "Shu Ding ∙ Engineer at Vercel", href: "https://shud.in"},
  {text: "Benji Taylor ∙ Design at X", href: "https://benji.org"},
  {text: "Raphael Salaja ∙ Design engineer at Warp", href: "https://www.raphaelsalaja.com"},
];

export const resources: readonly {readonly heading: string; readonly links: readonly Link[]}[] = [
  {
    heading: "My Vaults",
    links: [
      {
        text: "UI ∙ Interface references and patterns collected on Vayo.",
        href: "https://vayo.me/bookmarks/019ce8a2-931e-7308-8bc7-a3f10b2bd9ff",
      },
      {
        text: "Cool Stuff ∙ Interesting products, ideas, and details collected on Vayo.",
        href: "https://vayo.me/bookmarks/clublk9rh000113g5qf4tj038",
      },
      {
        text: "Articles ∙ Writing worth returning to, collected on Vayo.",
        href: "https://vayo.me/bookmarks/cltpx1nq70001jw1tc90e4ht6",
      },
    ],
  },
  {
    heading: "Learning",
    links: [
      {
        text: "Devouring Details ∙ Rauno Freiberg's interaction design course.",
        href: "https://devouringdetails.com",
      },
      {
        text: "animations.dev ∙ Emil Kowalski's course on web animations.",
        href: "https://animations.dev",
      },
      {
        text: "Invisible Details ∙ A course on the small decisions behind great interfaces.",
        href: "https://invisibledetails.com/",
      },
      {
        text: "Interfaces ∙ Jakub Krehel's design engineering magazine.",
        href: "https://interfaces.dev/",
      },
      {
        text: "Interface Craft ∙ A working library for designing with uncommon care.",
        href: "https://www.interfacecraft.dev/",
      },
    ],
  },
  {
    heading: "Icons",
    links: [
      {
        text: "Lucide ∙ Clean, customizable SVG icons made by the community.",
        href: "https://lucide.dev/",
      },
      {
        text: "Phosphor Icons ∙ The icon family used on this site - six weights.",
        href: "https://phosphoricons.com/",
      },
      {
        text: "Tabler Icons ∙ 6,000+ open-source icons built on a consistent 24px grid.",
        href: "https://tabler.io/icons",
      },
      {
        text: "Nucleo ∙ 40,000+ premium SVG icons with an app to manage them.",
        href: "https://nucleoapp.com/",
      },
      {
        text: "Radix Icons ∙ A crisp set of 15×15 icons available as React components.",
        href: "https://www.radix-ui.com/icons",
      },
      {
        text: "Hugeicons ∙ A large free and premium library across multiple styles.",
        href: "https://hugeicons.com/",
      },
      {
        text: "Central Icons ∙ A beautifully consistent, lovingly crafted icon collection.",
        href: "https://centralicons.com/",
      },
      {
        text: "SVGL ∙ A searchable library of brand and product SVG logos.",
        href: "https://svgl.app/",
      },
    ],
  },
  {
    heading: "Sound",
    links: [
      {
        text: "@web-kits/audio ∙ Synthesized interface sounds; powers this site's SFX.",
        href: "https://audio.raphaelsalaja.com",
      },
      {
        text: "Cuelume ∙ A tiny library of interaction sounds synthesized with Web Audio.",
        href: "https://cuelume-site.pages.dev/",
      },
    ],
  },
  {
    heading: "Inspiration",
    links: [
      {
        text: "Are.na ∙ The best place to collect and connect references.",
        href: "https://www.are.na",
      },
      {
        text: "Recent ∙ A daily curation of exceptional design, websites, and tools.",
        href: "https://recent.design/",
      },
      {text: "Cosmos ∙ A calmer, curated alternative to Pinterest.", href: "https://www.cosmos.so"},
      {
        text: "Mobbin ∙ A searchable library of mobile and web app screenshots.",
        href: "https://mobbin.com/",
      },
      {
        text: "X ∙ Design work, ideas, and conversations from people I follow.",
        href: "https://x.com/",
      },
    ],
  },
];
