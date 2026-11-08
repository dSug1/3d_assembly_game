// THE GEOMETRY DUMP for map2d_probe.mjs (2026-11-07): a page expression for orbit_probe.mjs AFTER= (MODE=seq SEQ='[]'): the placed parts' model-pose
// vertices, their ids, the shell's facets and the piece's width, as JSON. Save the AFTER line to geom.json, then: node scripts/probes/map2d_probe.mjs geom.json
(async () => { const st = window.__st, L = st.loop; const S = await import("/src/input/section.ts");
  const p = st.orbitPieces.find((o) => o.mesh === st.greenBox);
  const w = p && p.restingFace ? S.faceWidth(p.restingFace.normal, p.restingEdges) : 0;
  return JSON.stringify({ parts: st.asmParts.parts, ids: st.asmParts.ids, facets: L.map.facets.map((f) => ({ n: f.n, e: f.e, es: f.es })), w }); })()
