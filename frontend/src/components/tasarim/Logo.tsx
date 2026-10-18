// "muadil." — kalın küçük harf, nokta vurgu renginde.
export default function Logo({ boyut = "26px" }: { boyut?: string }) {
  return (
    <span aria-label="muadil" role="img" className="font-bold tracking-[-0.02em] normal-case" style={{ fontSize: boyut }}>
      <span aria-hidden="true">
        muadil<span className="text-vurgu">.</span>
      </span>
    </span>
  );
}
