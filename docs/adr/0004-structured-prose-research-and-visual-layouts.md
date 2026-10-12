# ADR 0004: optional structured creation modules

Date: 12 October 2026. Status: Accepted and implemented. Covers A08/A09/A10 and originally H2 N08/N18/N19.

Preserve Project → Book → Chapter → Scene and its existing contract. WorkDocument is an optional parallel structure for essays, simpler works and semantic prose. Ordered sections/blocks support paragraphs, headings, quotations, list items, code, poetry, footnotes and references as plain text. Arbitrary HTML is not accepted as a renderable document format. A document update checks revision and existing section/block ancestry, retains IDs and citations for retained blocks, and removes deleted children. Footnote labels must be unique and all references must resolve before saving.

ResearchSource belongs to an owned Project and records structured provenance/metadata, optional private reference Media, and citations into owned WorkDocument blocks. A source may be cited from another work owned by the same account; no cross-account sharing is implied. Source media must belong to its project. Media deletion clears its optional reference. URLs are metadata only and are never fetched by the server. Bibliography exposure requires an explicit release selection and copies approved bibliographic fields without private source IDs, provenance, reference file IDs or private quotations.

ProjectMap and ProjectCanvas are optional private tools. Maps have normalized pins and bounded polygons; canvases have bounded spatial nodes and explicit edges constrained to the same canvas. References are validated against owned project resources. Visual tools do not create a global/shared World entity. Deleting a project removes these layouts. A deleted referenced resource may leave an unavailable private visual reference; it does not retain access to that resource.

Released supplements are copied projections. Descriptions require deliberate inclusion, relationship endpoints must both be selected and are remapped to new public supplement IDs, and map images require an explicitly selected processed Work asset. Map projections contain only labels/geometry and the approved asset ID. Private relationships, entity/project IDs and links to unselected lore are never returned. Source editing/deletion cannot mutate a release.

This remains optional: a prose work can use documents alone, a manuscript can use existing book/chapter/scene endpoints, and worldbuilding can be omitted entirely.
