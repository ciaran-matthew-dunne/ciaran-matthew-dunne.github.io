---
title: Ciarán Dunne's webpage
author: Ciarán Dunne
shortbio: Postdoctoral researcher in formal methods
# description-meta: PhD student in 👽 science
og-url: https://ciaran-matthew-dunne.github.io
email: ciaran-matthew.dunne@telecom-sudparis.eu
picture: img/profile.jpg
picture-round: true
side-by-side: true
# pronouns: They/Them
# og-picture: img/profile.png
# orcid: 0000-0002-9141-1942
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
I am a postdoctoral researcher in the INRIA research group
[Deducteam](https://deducteam.gitlabpages.inria.fr/),
interested in the foundations and interoperability of automated reasoning
tools---particularly bridging set-theoretic and type-theoretic approaches
to mathematics.

I build tools that facilitate interoperability between proof assistants,
SMT solvers, and other automated reasoning systems.
I also maintain the
[Zed extension](https://github.com/ciaran-matthew-dunne/zed-lambdapi)
for the [LambdaPi](https://github.com/Deducteam/lambdapi) proof assistant,
and an [MCP server](https://github.com/ciaran-matthew-dunne/lambdapi/tree/mcp-server)
that allows LLM agents to interact with LambdaPi.

Currently working on two projects on proof system interoperability:

- **[`eo2lp`](https://github.com/ciaran-matthew-dunne/eo2lp/)**:
  Supported by an [Amazon Research Award](https://www.amazon.science/research-awards) (2024--2025),
  an OCaml tool translating proof certificates from the SMT solver
  [cvc5](https://cvc5.github.io/) to LambdaPi.
  The translation targets [Eunoia](https://github.com/cvc5/ethos/blob/main/user_manual.md),
  a logical framework that encodes cvc5's proof calculus.
  See the [draft paper](files/eo2lp.pdf).

- **pp2lp**:
  Supported by the [ANR](https://anr.fr/en/anrs-role-in-research/about-us/missions/)
  mission [ICSPA](https://anr.fr/Project-ANR-21-CE25-0015) (2024--present),
  an OCaml tool translating proof traces from the Predicate Prover used by
  [Atelier-B](https://www.atelierb.eu/en/)---an industrial platform for
  verifying railway and nuclear safety systems---into LambdaPi,
  developed in collaboration with [CLEARSY](https://www.clearsy.com/en/).


## Working Papers and Drafts

``` json {.paper}
"title": "Automatically Translating Proof Systems for SMT Solvers to the λΠ-calculus",
"authors": "Ciarán Dunne, Guillaume Burel",
"year": "2025",
"url": "files/eo2lp.pdf"
```


## Publications

``` json {.paper}
"title": "Isabelle/HOL/GST: A Formal Proof Environment for Generalized Set Theories",
"authors": "Ciarán Dunne, J. B. Wells",
"venue": "Conference for Intelligent Computer Mathematics, Tbisili, Georgia",
"year": "2022",
"url": "https://arxiv.org/pdf/2207.12039"
```

``` json {.paper}
"title": "Generating Custom Set Theories with Non-Set Structured Objects",
"authors": "Ciarán Dunne, J. B. Wells, Fairouz Kamareddine",
"venue": "Conference for Intelligent Computer Mathematics, Timișoara, Romania",
"year": "2021",
"url": "https://pure.hw.ac.uk/ws/portalfiles/portal/45486933/zf_plus_paper.pdf"
```

``` json {.paper}
"title": "Adding an Abstraction Barrier to ZF Set Theory",
"authors": "Ciarán Dunne, J. B. Wells, Fairouz Kamareddine",
"venue": "Conference for Intelligent Computer Mathematics, Temasora, Italy",
"year": "2020",
"url": "https://arxiv.org/pdf/2005.13954"
```

## Software

- **[eo2lp](https://github.com/ciaran-matthew-dunne/eo2lp)** --- OCaml tool translating Eunoia/cvc5 proof systems to LambdaPi.
- **pp2lp** --- OCaml tool translating Atelier B proof traces to LambdaPi. (With CLEARSY, ANR ICSPA.)
- **[LambdaPi MCP server](https://github.com/ciaran-matthew-dunne/lambdapi/tree/mcp-server)** --- Model Context Protocol server allowing LLM agents to interact with LambdaPi.
- **[zed-lambdapi](https://github.com/ciaran-matthew-dunne/zed-lambdapi)** --- Zed editor extension for LambdaPi with LSP and tree-sitter support.
- **[Isabelle/HOL/GST](https://github.com/ultra-group/isabelle-gst)** --- Isabelle framework for generalized set theories.

## PhD Thesis

``` json {.paper}
"title": "Towards a Set-Theoretic Foundation Closer to Mathematical Text",
"year": "2023",
"url": "https://www.ros.hw.ac.uk/server/api/core/bitstreams/46995a75-616c-4632-ab27-6ed227d722a9/content"
```

<!-- ## Talks

``` json {.papers}
{
  "title": "Talk 1",
  "authors": "Templato Urnehm",
  "venue": "My room"
},
{
  "title": "Secret talk",
  "authors": "Templato Urnehm",
  "year": "1990"
},
{
  "title": "Talk 3",
  "authors": "Templato Urnehm",
  "venue": "Don't remember…",
  "year": "???"
}
``` -->
<!--
# Education

- I was able to paint with my hands in kindergarten.
- I went to high school where I studied stuff.
- Master degree in hand painting.

# Teaching

- I am teaching the TD sessions on the 👽 science course.

# Community service

- 32 reviews for Journal of Awesomeness.
- 1 review for a cool conference.
- PC member of the journal of my school.
 -->
