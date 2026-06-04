import { MonogramShow } from "@/components/kutakshar/monogram";

export default function KutaksharPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: "24px 28px 40px",
        background: "var(--background)",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <MonogramShow />
      </div>
    </div>
  );
}
