import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { ProductIntro } from "@/components/product-intro";

export default function Home() {
  return (
    <div id="top" className="homepage">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <ProductIntro />
      </main>
      <Footer />
    </div>
  );
}
