import { ArrowRight, Leaf, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { products } from "../data/products";
import ProductCard from "../components/ProductCard";

function Home() {
  const featuredProducts = products.slice(0, 4);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            THE LITTLE THINGS MATTER
          </p>

          <h1>
            Find your kind
            <br />
            of <em>everyday.</em>
          </h1>

          <p className="hero-description">
            Thoughtful pieces for your home, your
            adventures, and all the little moments
            in between.
          </p>

          <Link to="/shop" className="primary-button">
            Explore the collection
            <ArrowRight size={18} />
          </Link>

          <p className="hero-note">
            Good finds. Good feelings. Every day.
          </p>
        </div>

        <div className="hero-image-wrapper">
          <img
            src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85"
            alt="Warm, thoughtfully styled living space"
            className="hero-image"
          />

          <div className="hero-image-caption">
            <span>A slower kind of shopping.</span>
            <span>✳</span>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="benefit">
          <Leaf size={23} />

          <div>
            <h3>Thoughtfully chosen</h3>
            <p>Everyday pieces worth keeping.</p>
          </div>
        </div>

        <div className="benefit">
          <Truck size={23} />

          <div>
            <h3>Simple shopping</h3>
            <p>From our collection to your door.</p>
          </div>
        </div>

        <div className="benefit">
          <span className="benefit-star">✳</span>

          <div>
            <h3>A little more joy</h3>
            <p>Small things can mean a lot.</p>
          </div>
        </div>
      </section>

      <section className="featured-section" id="featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE GOOD STUFF</p>

            <h2>Things you'll <em>love.</em></h2>
          </div>

          <Link to="/shop" className="text-link">
            Shop everything
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>

      <section className="story-section">
        <div className="story-image">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85"
            alt="A carefully arranged lifestyle shop"
          />
        </div>

        <div className="story-content">
          <p className="eyebrow">A LITTLE ABOUT US</p>

          <h2>
            Less noise.
            <br />
            More <em>meaning.</em>
          </h2>

          <p>
            We believe shopping should feel good.
            Not overwhelming, not complicated.
            Just lovely things that make ordinary
            days feel a little more special.
          </p>

          <Link to="/shop" className="primary-button">
            Find your favourite
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;