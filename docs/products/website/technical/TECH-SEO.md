# SEO Specification

## Overview

SEO requirements and implementation for variscout.com.

---

## Meta Tags

### Default Meta Template

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta -->
  <title>{page.title} | VaRiScout</title>
  <meta name="description" content="{page.description}" />
  <meta name="keywords" content="{page.keywords}" />

  <!-- Canonical -->
  <link rel="canonical" href="https://variscout.com{page.path}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://variscout.com{page.path}" />
  <meta property="og:title" content="{page.title}" />
  <meta property="og:description" content="{page.description}" />
  <meta property="og:image" content="https://variscout.com/og/{page.og_image}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{page.title}" />
  <meta name="twitter:description" content="{page.description}" />
  <meta name="twitter:image" content="https://variscout.com/og/{page.og_image}" />

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
```

---

## Page-Specific SEO

### Homepage

```yaml
title: "VaRiScout | Find What's Driving Variation"
description: "VaRiScout: Find what's driving variation in your data. 1 minute to insight, 1 minute to adjust, 1 minute to present. Free to try, no signup required."
keywords: 'variation analysis, SPC, control charts, boxplot, Lean Six Sigma, quality management, process improvement'
og_image: 'og-home.png'
```

### Product: Web App

```yaml
title: 'VaRiScout Web | Browser-Based Variation Analysis'
description: 'VaRiScout Web: Browser-based variation analysis. Upload CSV, see charts instantly, click to filter. No installation needed. Free to start.'
keywords: 'variation analysis online, SPC tool, control chart software, free statistical analysis, online boxplot'
og_image: 'og-web-app.png'
```

### Product: Excel

```yaml
title: 'VaRiScout for Excel | Variation Analysis Add-in'
description: 'VaRiScout for Excel: Analyze variation without leaving Excel. Microsoft certified add-in from AppSource.'
keywords: 'Excel add-in, SPC Excel, control chart Excel, statistical analysis Excel, Excel boxplot'
og_image: 'og-excel.png'
```

### Product: Power BI

```yaml
title: 'VaRiScout for Power BI | Variation Analysis Visuals'
description: 'VaRiScout for Power BI: Four custom visuals for variation analysis. I-Chart, Boxplot, Pareto, Capability. Microsoft certified.'
keywords: 'Power BI SPC, Power BI control chart, Power BI custom visual, variation analysis dashboard'
og_image: 'og-powerbi.png'
```

### Product: Azure

```yaml
title: 'VaRiScout Azure | Self-Deploy to Your Tenant'
description: 'VaRiScout Azure: Deploy to your own Azure environment. Custom branding, custom domain, complete data sovereignty.'
keywords: 'Azure static web app, self-hosted SPC, enterprise variation analysis, data sovereignty'
og_image: 'og-azure.png'
```

### Use Case: LSS Training

```yaml
title: 'VaRiScout for LSS Training & Projects | Simplified Statistics'
description: 'VaRiScout for Lean Six Sigma training and projects. Simplified statistics for Green Belts. Plain language insights. Zero learning curve.'
keywords: 'Lean Six Sigma tools, Green Belt software, LSS training, statistical analysis Six Sigma, Minitab alternative'
og_image: 'og-lss.png'
```

### Use Case: Operations

```yaml
title: 'VaRiScout for Quality & Operations | Live Team Analysis'
description: 'VaRiScout for quality and operations teams. Analyze variation live in meetings. Visual clarity for supervisors and managers.'
keywords: 'quality management tools, operations analytics, SPC software, manufacturing variation analysis'
og_image: 'og-operations.png'
```

### Pricing

```yaml
title: 'VaRiScout Pricing | Free to Start, Simple to Scale'
description: 'VaRiScout pricing: Free forever with watermark. €49/year for individuals. Team and enterprise options for Power BI and Azure.'
keywords: 'VaRiScout pricing, SPC software cost, variation analysis pricing, Minitab alternative price'
og_image: 'og-pricing.png'
```

---

## Heading Structure

### H1 Rules

- One H1 per page
- Contains primary keyword
- Matches page intent

### Heading Hierarchy

```html
<h1>Main Page Title</h1>
<h2>Major Section</h2>
<h3>Subsection</h3>
<h3>Subsection</h3>
<h2>Major Section</h2>
<h3>Subsection</h3>
```

---

## Schema Markup

### Organization (Site-wide)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VaRiScout",
  "url": "https://variscout.com",
  "logo": "https://variscout.com/logo.png",
  "description": "Variation analysis tools for Lean Six Sigma and operations",
  "parentOrganization": {
    "@type": "Organization",
    "name": "RDMAIC Oy",
    "url": "https://rdmaic.fi"
  }
}
```

### SoftwareApplication (Product Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VaRiScout",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Free tier"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "50"
  }
}
```

### FAQPage (Pricing, Product Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What's the difference between Free and Individual?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Free includes all features but adds a watermark..."
      }
    }
  ]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://variscout.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Product",
      "item": "https://variscout.com/product"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Web App",
      "item": "https://variscout.com/product/web-app"
    }
  ]
}
```

---

## URL Structure

### Rules

- Lowercase only
- Hyphens for word separation
- No trailing slashes
- No special characters
- Max 3 levels deep

### Examples

```
✓ /product/web-app
✓ /use-cases/lss-training
✓ /resources/sample-data

✗ /Product/Web_App
✗ /use-cases/lss-training/
✗ /resources/sample-data/pizza-delivery-csv
```

---

## Internal Linking

### Link Text Guidelines

```html
<!-- Good -->
<a href="/product/web-app">VaRiScout Web App</a>
<a href="/pricing">See pricing details</a>

<!-- Bad -->
<a href="/product/web-app">Click here</a>
<a href="/pricing">Learn more</a>
```

### Minimum Links Per Page

| Page Type     | Min Internal Links |
| ------------- | ------------------ |
| Homepage      | 15+                |
| Product page  | 8+                 |
| Use case page | 8+                 |
| Resource page | 10+                |

---

## Image SEO

### File Naming

```
✓ variscout-dashboard-screenshot.png
✓ boxplot-chart-example.png
✓ lss-training-workflow.png

✗ img001.png
✗ Screenshot 2024-01-15.png
```

### Alt Text

```html
<!-- Good -->
<img src="..." alt="VaRiScout dashboard showing I-Chart, Boxplot, and Pareto charts" />

<!-- Bad -->
<img src="..." alt="dashboard" />
<img src="..." alt="" />
```

### Image Optimization

| Format | Use Case               |
| ------ | ---------------------- |
| WebP   | Photos, complex images |
| PNG    | Screenshots, UI        |
| SVG    | Icons, logos           |

Sizes:

- Max width: 1200px for content
- Max width: 2400px for hero
- Serve responsive sizes

---

## Sitemap

### sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://variscout.com/</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://variscout.com/product/web-app</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- ... -->
</urlset>
```

### Priority Levels

| Priority | Pages                  |
| -------- | ---------------------- |
| 1.0      | Homepage               |
| 0.9      | Product pages, Pricing |
| 0.8      | Use case pages         |
| 0.7      | Resources hub          |
| 0.6      | Individual tutorials   |
| 0.5      | Legal pages            |

---

## robots.txt

```
User-agent: *
Allow: /

Disallow: /app/
Disallow: /api/

Sitemap: https://variscout.com/sitemap.xml
```

---

## Performance SEO

### Core Web Vitals Targets

| Metric | Target  | Impact         |
| ------ | ------- | -------------- |
| LCP    | < 2.5s  | Ranking factor |
| FID    | < 100ms | Ranking factor |
| CLS    | < 0.1   | Ranking factor |

### Technical Checklist

- [ ] HTTPS enabled
- [ ] Mobile-responsive
- [ ] Fast server response (< 200ms)
- [ ] Compressed assets (gzip/brotli)
- [ ] Browser caching headers
- [ ] No render-blocking resources
- [ ] Lazy loading for images

---

## Keyword Targets

### Primary Keywords

| Keyword              | Target Page  | Search Volume |
| -------------------- | ------------ | ------------- |
| variation analysis   | Home         | Medium        |
| SPC software         | Home         | Medium        |
| control chart online | Web App      | Medium        |
| Power BI SPC         | Power BI     | Low           |
| Minitab alternative  | LSS Training | Medium        |
| Lean Six Sigma tools | LSS Training | Medium        |

### Long-Tail Keywords

| Keyword                              | Target Page  |
| ------------------------------------ | ------------ |
| free online control chart maker      | Web App      |
| Power BI control chart custom visual | Power BI     |
| Excel SPC add-in                     | Excel        |
| Green Belt statistical analysis      | LSS Training |
| how to analyze variation in data     | Resources    |

---

## Monitoring

### Tools

- Google Search Console
- Bing Webmaster Tools
- Ahrefs or SEMrush (optional)

### Metrics to Track

- Organic traffic
- Keyword rankings
- Click-through rate
- Index coverage
- Core Web Vitals
- Backlinks

### Monthly Review

- Check Search Console for issues
- Review top performing pages
- Identify keyword opportunities
- Fix any crawl errors
