---
title: Ciarán Dunne's webpage
author: Ciarán Dunne
shortbio: Postdoctoral researcher in formal methods
description-meta: Formal methods researcher building tools for proof system interoperability. Postdoc at ENS Paris-Saclay / Télécom SudParis (Deducteam, INRIA).
og-url: https://ciaran-matthew-dunne.github.io
email: ciaran-matthew.dunne@telecom-sudparis.eu
picture: img/profile.jpg
picture-round: true
side-by-side: true
# pronouns: They/Them
# og-picture: img/profile.png
# orcid: 0000-0002-9141-1942
cv: files/cv.pdf
dblp: https://dblp.org/pid/266/3273.html
scholar: https://scholar.google.com/citations?user=aG4vquEAAAAJ&hl=en
# hal: https://hal.science/
# mastodon: https://lipn.info
github: ciaran-matthew-dunne
# gitlab: gitlab
# bitbucket: bitbucket.com
# bluesky: https://bsky.app/
linkedin: https://www.linkedin.com/in/ciar%C3%A1n-dunne-b78083281/
# footer: >-
#   Based on the
#   [basicpage template](https://github.com/basicpage/basicpage.github.io),
#   made to be easy to use! 🎓
---
I am a postdoctoral researcher in the 
  [Deducteam](https://deducteam.gitlabpages.inria.fr/)
research group. 
My research concerns the foundations and interoperability of 
automated reasoning tools. I am particularly interested in bridging
set-theoretic and type-theoretic approaches to foundations.

## Active Projects

- **pp2lp**:
  Supported by the [ANR](https://anr.fr/en/anrs-role-in-research/about-us/missions/)
  mission [ICSPA](https://anr.fr/Project-ANR-21-CE25-0015) (2024--present),
  an OCaml tool translating proof traces from the Predicate Prover used by
  [Atelier-B](https://www.atelierb.eu/en/)---an industrial platform for
  verifying railway and nuclear safety systems---into LambdaPi,
  developed in collaboration with [CLEARSY](https://www.clearsy.com/en/).
  For more information, see the following [note](files/pp2lp-note.pdf).

- **[`eo2lp`](https://github.com/ciaran-matthew-dunne/eo2lp/)**:
  Supported by an [Amazon Research Award](https://www.amazon.science/research-awards) (2024--2025),
  an OCaml tool translating proof certificates from the SMT solver
  [cvc5](https://cvc5.github.io/) to LambdaPi.
  The translation targets [Eunoia](https://github.com/cvc5/ethos/blob/main/user_manual.md),
  a logical framework that encodes cvc5's proof calculus.
  The resulting [paper](files/eo2lp.pdf) was accepted to IJCAR 2026.

- **LambdaPi tooling**:
  [MCP server](https://github.com/ciaran-matthew-dunne/lambdapi/tree/mcp-server)
  allowing LLM agents to interact with LambdaPi
  (see related [talk](files/talks/lp-slop-talk.pdf)),
  and a [Zed editor extension](https://github.com/ciaran-matthew-dunne/zed-lambdapi)
  with LSP and tree-sitter support.

## Publications

``` json {.paper}
"title": "Verifying Atelier B's Predicate Prover",
"authors": "Ciarán Dunne, Guillaume Burel",
"year": "Note — 2026",
"files": [
  {"text": "paper", "type": "pdf", "src": "files/pp2lp-note.pdf"}
]
```

``` json {.paper}
"title": "Automatically Translating Proof Systems for SMT Solvers to the λΠ-calculus",
"authors": "Ciarán Dunne, Guillaume Burel",
"venue": "International Joint Conference on Automated Reasoning, Lisbon, Portugal",
"year": "2026",
"files": [
  {"text": "paper", "type": "pdf", "src": "files/eo2lp.pdf"},
  {"text": "talk", "type": "slides", "src": "files/talks/eo2lp-talk-handout.pdf"}
]
```

``` json {.paper}
"title": "Towards a Set-Theoretic Foundation Closer to Mathematical Text",
"year": "PhD Thesis — 2023",
"files": [
  {"text": "thesis", "type": "pdf", "src": "https://www.ros.hw.ac.uk/server/api/core/bitstreams/46995a75-616c-4632-ab27-6ed227d722a9/content"},
  {"text": "talk (2021)", "type": "slides", "src": "files/talks/numerous-numerosity-talk.pdf"},
  {"text": "talk (2020)", "type": "slides", "src": "files/talks/first-year-talk.pdf"}
]
```

``` json {.paper}
"title": "Isabelle/HOL/GST: A Formal Proof Environment for Generalized Set Theories",
"authors": "Ciarán Dunne, J. B. Wells",
"venue": "Conference for Intelligent Computer Mathematics, Tbisili, Georgia",
"year": "2022",
"files": [
  {"text": "paper", "type": "pdf", "src": "https://arxiv.org/pdf/2207.12039"},
  {"text": "talk", "type": "slides", "src": "files/talks/splv-2022-talk.pdf"},
  {"text": "video", "type": "video", "src": "https://www.youtube.com/watch?v=_h0Qc4aKAAc"},
  {"text": "code", "type": "code", "src": "https://github.com/ultra-group/isabelle-gst"}
]
```

``` json {.paper}
"title": "Generating Custom Set Theories with Non-Set Structured Objects",
"authors": "Ciarán Dunne, J. B. Wells, Fairouz Kamareddine",
"venue": "Conference for Intelligent Computer Mathematics, Timișoara, Romania",
"year": "2021",
"files": [
  {"text": "paper", "type": "pdf", "src": "https://pure.hw.ac.uk/ws/portalfiles/portal/45486933/zf_plus_paper.pdf"},
  {"text": "talk", "type": "slides", "src": "files/talks/cicm-2021-talk.pdf"},
  {"text": "video", "type": "video", "src": "https://www.youtube.com/watch?v=TDde2RunWFE"}
]
```

``` json {.paper}
"title": "Adding an Abstraction Barrier to ZF Set Theory",
"authors": "Ciarán Dunne, J. B. Wells, Fairouz Kamareddine",
"venue": "Conference for Intelligent Computer Mathematics, Bertinoro, Italy",
"year": "2020",
"files": [
  {"text": "paper", "type": "pdf", "src": "https://arxiv.org/pdf/2005.13954"},
  {"text": "talk", "type": "slides", "src": "files/talks/cicm-2020-talk.pdf"}
]
```
