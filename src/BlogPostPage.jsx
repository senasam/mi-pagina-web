import { useEffect } from "react";
import { ArrowRight, Mail, Linkedin, Calendar, Menu, X } from "lucide-react";
import { useState } from "react";
import { blogPosts, profile, navigation } from "./blogData";

export default function BlogPostPage({ slug }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const post = blogPosts.find((item) => item.slug === slug);

  useEffect(() => {
    if (!post) return;
    document.title = post.seoTitle || post.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = post.metaDescription || post.excerpt;
  }, [post]);

  if (!post) {
    return (
      <>
        <header className="site-nav">
          <a href="/" className="brand-mark" aria-label="Inicio">
            <span>FMD</span>
          </a>
        </header>
        <main className="section blog-post-page">
          <div className="blog-post-card">
            <h1>Artículo no encontrado</h1>
            <p>El artículo que buscas no existe o no está disponible.</p>
            <a className="button button--secondary" href="/blog">
              Volver al blog
              <ArrowRight size={16} strokeWidth={1.8} />
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="site-nav">
        <a href="/" className="brand-mark" aria-label="Inicio">
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

      <main className="blog-post-main">
        <article className="blog-post-container">
          <div className="blog-post-header">
            <div className="blog-post-meta">
              <span className="blog-post-category">{post.category}</span>
              <time dateTime={post.date}>{post.date}</time>
            </div>
            <h1 className="blog-post-title">{post.title}</h1>
          </div>

          <div className="blog-post-content">
            {post.content.map((block, index) => {
              if (block.type === "heading") {
                const HeadingTag =
                  block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
                return (
                  <HeadingTag key={index} className="blog-post-section-heading">
                    {block.text}
                  </HeadingTag>
                );
              }
              return (
                <p key={index} className="blog-post-paragraph">
                  {block.text}
                </p>
              );
            })}
          </div>

          <div className="blog-post-actions">
            <a className="button button--secondary" href="/blog">
              <ArrowRight size={16} strokeWidth={1.8} />
              Volver al blog
            </a>
          </div>
        </article>
      </main>

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.role}</span>
      </footer>

      <script type="application/ld+json">
        {JSON.stringify(post.schema)}
      </script>
    </>
  );
}
