import { Icon } from "./icon";

const concepts = [
  {
    number: "01",
    icon: "book" as const,
    title: "Write your story.",
    description:
      "Find your rhythm. Give every chapter, scene, and sentence a place to grow.",
  },
  {
    number: "02",
    icon: "world" as const,
    title: "Build your world.",
    description:
      "Know the people, places, and possibilities that make your story yours.",
  },
  {
    number: "03",
    icon: "connect" as const,
    title: "Connect the details.",
    description:
      "Keep the threads in sight. Let the small things become something greater.",
  },
];

export function ProductIntro() {
  return (
    <section
      className="product-intro container"
      id="features"
      aria-labelledby="product-heading"
    >
      <div className="product-heading" id="about">
        <p className="eyebrow">ROOM FOR THE WHOLE STORY</p>
        <h2 id="product-heading">
          One space. <em>Endless possibility.</em>
        </h2>
        <p>
          Rawan is taking shape around a simple idea: your words and your world
          belong together.
        </p>
      </div>
      <div className="concepts">
        {concepts.map((concept) => (
          <article className="concept" key={concept.number}>
            <div className="concept-top">
              <Icon name={concept.icon} />
              <span>{concept.number}</span>
            </div>
            <h3>{concept.title}</h3>
            <p>{concept.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
