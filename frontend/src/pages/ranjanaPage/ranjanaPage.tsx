import { RanjanaConverter } from "@/components/ranjana/ranjana-converter";
import { CharacterMap } from "@/components/ranjana/character-map";

export default function RanjanaPage() {
  return (
    <>
      <section className="py-16 md:py-24 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Convert Nepali Text to
            <br />
            <span className="text-primary">Ranjana Script</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg mb-8 text-pretty">
            Transform Nepali (Devanagari) or Romanized text into beautiful
            Ranjana script. Supports consonants, vowels, matras, and conjuncts.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Live Preview
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Client-Side Conversion
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Unicode Support
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <RanjanaConverter />
        </div>
      </section>

      <section className="py-12 md:py-16 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Character Reference
            </h3>
            <p className="text-muted-foreground">
              Browse consonants, vowels, and conjuncts used in the conversion
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <CharacterMap />
          </div>
        </div>
      </section>
    </>
  );
}
