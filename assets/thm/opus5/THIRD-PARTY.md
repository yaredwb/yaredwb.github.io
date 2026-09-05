# Third-party components

This site is deliberately dependency-free at runtime — no CDN, no network
requests — which means two third-party components are **vendored into the
repository** rather than fetched. Their licences and notices are reproduced
here as those licences require.

---

## KaTeX 0.16.22

Used to typeset all mathematics. `assets/vendor/katex/katex.min.js` is the
upstream distribution unmodified. `assets/vendor/katex/katex.inline.css` is the
upstream `katex.min.css` with the WOFF2 font files inlined as `data:` URIs and
the `.woff` / `.ttf` fallbacks removed, so the page needs no font requests.

- Project: https://github.com/KaTeX/KaTeX
- Licence: MIT

```
The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## Newsreader (variable, latin subset)

The display face used for headings. The latin weight-axis WOFF2 is embedded as
a `data:` URI at the top of `assets/css/site.css`, taken from
`@fontsource-variable/newsreader` 5.3.0.

- Project: https://github.com/productiontype/Newsreader
- Licence: SIL Open Font License 1.1

```
Copyright 2020 The Newsreader Project Authors
(https://github.com/productiontype/Newsreader)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This licence is available with a FAQ at https://scripts.sil.org/OFL
```

The OFL permits embedding the font in a document or web page. The font is not
sold on its own, and it is not renamed — both conditions the licence requires.

---

## Everything else

All other code, prose, figures and solvers in this repository are original and
are covered by the MIT licence in `LICENSE`.
