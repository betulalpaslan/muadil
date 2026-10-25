// Yapılandırılmış veri (Google zengin sonuçları). "<" kaçırılır ki içerik script'ten çıkamasın.
export function JsonLd({ veri }: { veri: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(veri).replace(/</g, "\\u003c") }}
    />
  );
}
