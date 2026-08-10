# LuxRender Constitution

1. LuxRender is the single source of truth for the spatial AI application and its CAD adapters.
2. Do not create duplicate repositories or parallel implementations for the same product capability.
3. Preserve working code unless a change has a measurable architectural/product reason.
4. One module = one responsibility. Keep host adapters, AI routing, UI and business data separate.
5. Do not hard-wire LuxRender to NBOX or any single AI provider.
6. Geometry preservation is a first-class product requirement, not a prompt afterthought.
7. Long AI operations use job/state semantics; UI must not pretend generation is synchronous.
8. Media assets are project-scoped and versioned.
9. No secrets in client code, plugin code or repository history.
10. New dependencies require clear value; prefer platform APIs where practical.
11. Research sources are extracted, evaluated and deduplicated before becoming features.
12. Avoid scope inflation: implement the smallest complete vertical slice that advances the canonical workflow.
