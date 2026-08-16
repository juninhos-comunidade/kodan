import { ImageResponse } from "next/og";

export const alt = "Kodan, treino de diagnóstico de código";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#1e1f1c", color: "#f5f2eb", padding: "64px", fontFamily: "Georgia, serif" }}>
      <div style={{ display: "flex", flex: 1, border: "2px solid #68745c" }}>
        <div style={{ display: "flex", width: "58%", flexDirection: "column", justifyContent: "space-between", padding: "52px" }}>
          <div style={{ display: "flex", fontFamily: "monospace", fontSize: 24, color: "#c7a45d" }}>KODAN / DOJO 001</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 70, fontWeight: 700, lineHeight: 1.02 }}>Leia. Diagnostique. Evolua.</div>
            <div style={{ display: "flex", marginTop: 28, fontFamily: "monospace", fontSize: 24, color: "#c9c4b8" }}>Treino de código para entrevistas técnicas.</div>
          </div>
        </div>
        <div style={{ display: "flex", width: "42%", flexDirection: "column", justifyContent: "center", borderLeft: "2px solid #68745c", background: "#171815", padding: "42px", fontFamily: "monospace", fontSize: 22, lineHeight: 1.75 }}>
          <div style={{ display: "flex", color: "#7f8877" }}>03  useEffect(() =&gt; {'{'}</div>
          <div style={{ display: "flex" }}>04    setInterval(() =&gt; {'{'}</div>
          <div style={{ display: "flex", color: "#e5a56d" }}>05      setCount(count + 1)</div>
          <div style={{ display: "flex" }}>06    {'}'}, 1000)</div>
          <div style={{ display: "flex", color: "#7f8877" }}>09  {'}'}, [])</div>
        </div>
      </div>
    </div>,
    size,
  );
}
