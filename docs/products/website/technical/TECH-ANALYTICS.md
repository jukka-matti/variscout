# Technical: Analytics

## Overview

Analytics implementation for variscout.com to track user behavior and conversion.

---

## Analytics Platform

### Recommended: Plausible or Fathom

| Option             | Pros                                  | Cons                      |
| ------------------ | ------------------------------------- | ------------------------- |
| Plausible          | Privacy-first, GDPR compliant, simple | Less detailed             |
| Fathom             | Privacy-first, simple                 | Cost                      |
| Google Analytics 4 | Free, detailed                        | Privacy concerns, complex |
| Mixpanel           | Event-focused, funnels                | Cost, complexity          |

**Recommendation:** Plausible for marketing site, with custom events.

Why:

- No cookie banner needed
- GDPR compliant out of box
- Simple dashboard
- Custom events supported

---

## Implementation

### Plausible Script

```html
<script defer data-domain="variscout.com" src="https://plausible.io/js/script.js"></script>
```

### Custom Events (Plausible)

```javascript
// Helper function
function trackEvent(name, props = {}) {
  if (window.plausible) {
    plausible(name, { props });
  }
}

// Usage
trackEvent('CTA Click', { location: 'hero', text: 'Try Free' });
```

---

## Events to Track

### Navigation Events

| Event               | Properties         | Trigger                 |
| ------------------- | ------------------ | ----------------------- |
| `Nav Click`         | `item`, `dropdown` | Navigation item clicked |
| `Mobile Menu Open`  | —                  | Hamburger clicked       |
| `Footer Link Click` | `section`, `link`  | Footer link clicked     |

### CTA Events

| Event       | Properties                 | Trigger                |
| ----------- | -------------------------- | ---------------------- |
| `CTA Click` | `location`, `text`, `url`  | Any CTA button clicked |
| `Hero CTA`  | `type` (primary/secondary) | Hero section CTA       |
| `Final CTA` | `page`                     | Bottom-of-page CTA     |

### Product Interest

| Event                     | Properties | Trigger                |
| ------------------------- | ---------- | ---------------------- |
| `Product View`            | `product`  | Product page viewed    |
| `Product Compare`         | —          | Comparison page viewed |
| `AppSource Click`         | `product`  | AppSource link clicked |
| `Azure Marketplace Click` | —          | Azure link clicked     |

### Content Engagement

| Event             | Properties             | Trigger                |
| ----------------- | ---------------------- | ---------------------- |
| `Video Play`      | `video_id`, `location` | Demo video started     |
| `Video Complete`  | `video_id`             | Demo video finished    |
| `Sample Download` | `dataset`              | Sample data downloaded |
| `Tutorial Start`  | `tutorial`             | Tutorial page viewed   |

### Conversion Events

| Event               | Properties                 | Trigger             |
| ------------------- | -------------------------- | ------------------- |
| `App Launch`        | `source`                   | /app opened         |
| `Pricing View`      | —                          | Pricing page viewed |
| `Checkout Start`    | `product`, `tier`          | Checkout initiated  |
| `Purchase Complete` | `product`, `tier`, `value` | Purchase completed  |

---

## Page Views

Track all page views with:

- URL
- Referrer
- UTM parameters
- Device type
- Country

---

## Goals / Conversions

### Primary Goals

| Goal           | Event               | Value   |
| -------------- | ------------------- | ------- |
| App Launch     | `App Launch`        | —       |
| Checkout Start | `Checkout Start`    | —       |
| Purchase       | `Purchase Complete` | Revenue |

### Secondary Goals

| Goal                 | Event             |
| -------------------- | ----------------- |
| Demo Video Watch     | `Video Play`      |
| Sample Data Download | `Sample Download` |
| Product Page View    | `Product View`    |

---

## Funnels

### Main Conversion Funnel

```
Homepage → Product Page → Pricing → App Launch → (Purchase)
```

Track:

1. Homepage view
2. Any product page view
3. Pricing page view
4. App launch
5. Purchase (if applicable)

### Content Funnel

```
Resources → Video/Tutorial → App Launch
```

---

## UTM Parameters

### Standard Parameters

| Parameter      | Usage                                         |
| -------------- | --------------------------------------------- |
| `utm_source`   | Traffic source (linkedin, google, newsletter) |
| `utm_medium`   | Medium (cpc, organic, email, social)          |
| `utm_campaign` | Campaign name                                 |
| `utm_content`  | Content variant (for A/B testing)             |

### Examples

```
variscout.com/?utm_source=linkedin&utm_medium=social&utm_campaign=variation-scouting
variscout.com/?utm_source=google&utm_medium=cpc&utm_campaign=spc-keywords
variscout.com/?utm_source=newsletter&utm_medium=email&utm_campaign=january
```

---

## Event Implementation

### Astro Component Example

```astro
---
// CTAButton.astro
interface Props {
  text: string;
  href: string;
  location: string;
  variant?: 'primary' | 'secondary';
}

const { text, href, location, variant = 'primary' } = Astro.props;
---

<a
  href={href}
  class:list={['btn', `btn-${variant}`]}
  data-track="cta"
  data-location={location}
  data-text={text}
>
  {text}
</a>

<script>
  document.querySelectorAll('[data-track="cta"]').forEach(el => {
    el.addEventListener('click', () => {
      if (window.plausible) {
        plausible('CTA Click', {
          props: {
            location: el.dataset.location,
            text: el.dataset.text
          }
        });
      }
    });
  });
</script>
```

---

## Dashboard Views

### Executive Dashboard

- Total visitors (daily/weekly/monthly)
- Top pages
- Traffic sources
- Conversion rate (visitors → app launches)
- Revenue (if tracking purchases)

### Product Dashboard

- Product page views by product
- AppSource/Marketplace clicks
- Pricing page engagement
- Comparison page usage

### Content Dashboard

- #VariationScouting engagement
- Sample data downloads
- Tutorial completions
- Video watch rates

---

## Privacy Compliance

### GDPR

With Plausible/Fathom:

- No cookie consent needed
- No personal data collected
- IP addresses not stored
- EU hosting available

### Cookie Policy

If using GA4 or similar:

- Cookie consent banner required
- Respect DNT header
- Allow opt-out

---

## Reporting

### Weekly Report

- Visitors
- Top pages
- Traffic sources
- Conversions

### Monthly Report

- All weekly metrics
- Month-over-month trends
- Funnel analysis
- Campaign performance

---

## Integration with App Analytics

The PWA (/app) should have its own analytics for:

- Feature usage
- File uploads
- Chart interactions
- Export actions

Consider separate analytics instance or property for app vs. marketing site.

---

## Testing

### Verify Implementation

1. Install browser extension (Plausible/GA debugger)
2. Visit each page
3. Click all CTAs
4. Verify events fire
5. Check dashboard within 5 minutes

### Checklist

- [ ] Script loads on all pages
- [ ] Page views tracked
- [ ] CTA clicks tracked
- [ ] Video plays tracked
- [ ] Download clicks tracked
- [ ] UTM parameters captured
- [ ] Goals configured
- [ ] Funnels set up
