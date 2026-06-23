import { ArrowRight, Mail, Linkedin, Calendar, Menu, X } from "lucide-react";
import { useState } from "react";
import { blogPosts, profile, navigation } from "./blogData";

function BlogPostCard({ post }) {
  return (
    <article className="blog-card">
      <div className="blog-card__meta">
        <span className="blog-card__category">{post.category}</span>
        <time dateTime={post.date}>{post.date}</time>
      </div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <a className="button button--secondary" href={`/blog/${post.slug}`}>
        Leer más
        <ArrowRight size={16} strokeWidth={1.8} />
      </a>
    </article>
  );
}

export default function BlogListPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="site-nav">
        <a
          className="brand-mark"
          href="/"
          aria-label="Inicio de Felipe Masanés Didyk"
        >
          <span>FMD</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          {navigation.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="nav-cta"
            href={profile.booking}
            target="_blank"
            rel="noreferrer"
          >
            <Calendar size={16} strokeWidth={1.8} />
            Agendar
          </a>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {navigation.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMobileOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}

      <main className="blog-list-main">
        <section className="blog-hero">
          <div className="section-header">
            <p className="eyebrow">Blog</p>
            <h1>Reflexiones, aprendizajes y recursos breves para líderes y equipos.</h1>
            <p className="section-lead">
              Publicaciones seleccionadas con ideas prácticas en estrategia,
              growth, finanzas y liderazgo aplicable.
            </p>
          </div>
        </section>

        <section className="section blog-section">
          <div className="blog-grid">
            {blogPosts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.role}</span>
      </footer>
    </>
  );
}
