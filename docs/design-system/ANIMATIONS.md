# Animation System

Animation tokens, keyframes, and utilities for the VaRiScout marketing website.

## Design Principles

1. **Performance**: Only animate `transform` and `opacity` (GPU-accelerated)
2. **Accessibility**: Respect `prefers-reduced-motion` preference
3. **Subtlety**: Enhance UX without distracting from content
4. **Consistency**: Use standardized timing and easing

---

## Timing Tokens

### Durations

| Token               | Value  | Use Case                           |
| ------------------- | ------ | ---------------------------------- |
| `--duration-fast`   | 200ms  | Micro-interactions, hover states   |
| `--duration-normal` | 400ms  | Fades, simple transitions          |
| `--duration-slow`   | 600ms  | Scroll reveals, complex animations |
| `--duration-slower` | 1000ms | Page transitions                   |

### Easing Functions

| Name            | Value                           | Character                     |
| --------------- | ------------------------------- | ----------------------------- |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth deceleration (primary) |
| `ease-out`      | `ease-out`                      | Standard deceleration         |
| `ease-in-out`   | `ease-in-out`                   | Symmetric                     |
| `linear`        | `linear`                        | Constant speed                |

**Default**: `cubic-bezier(0.16, 1, 0.3, 1)` - Fast start, smooth landing

---

## Keyframes

### Entrance Animations

#### fade-up

Fade in while moving upward. Primary scroll reveal animation.

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### fade-in

Simple opacity transition.

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

#### slide-left

Enter from the right side.

```css
@keyframes slide-left {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

#### slide-right

Enter from the left side.

```css
@keyframes slide-right {
  from {
    opacity: 0;
    transform: translateX(-40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

#### scale-in

Scale up from 95% size.

```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Continuous Animations

#### pulse-ring

Attention-grabbing pulsing ring. Used for chart highlights.

```css
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
}
```

#### float

Gentle floating motion. Used for decorative elements.

```css
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

---

## Utility Classes

### Animation Classes

```css
.animate-fade-up {
  animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}

.animate-slide-left {
  animation: slide-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-right {
  animation: slide-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-scale-in {
  animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pulse-ring {
  animation: pulse-ring 1.5s ease-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Delay Classes

For staggered animations:

```css
.animation-delay-100 {
  animation-delay: 100ms;
}
.animation-delay-200 {
  animation-delay: 200ms;
}
.animation-delay-300 {
  animation-delay: 300ms;
}
.animation-delay-400 {
  animation-delay: 400ms;
}
.animation-delay-500 {
  animation-delay: 500ms;
}
```

---

## ScrollReveal Component

Declarative scroll-triggered animations.

### Props

| Prop        | Type                                                                 | Default     |
| ----------- | -------------------------------------------------------------------- | ----------- |
| `animation` | `'fade-up' \| 'fade-in' \| 'slide-left' \| 'slide-right' \| 'scale'` | `'fade-up'` |
| `delay`     | `number` (ms)                                                        | `0`         |
| `duration`  | `number` (ms)                                                        | `600`       |
| `threshold` | `number` (0-1)                                                       | `0.1`       |
| `once`      | `boolean`                                                            | `true`      |

### Usage

```astro
<!-- Single element -->
<ScrollReveal animation="fade-up">
  <Card />
</ScrollReveal>

<!-- Staggered group -->
<ScrollReveal animation="fade-up" delay={0}>
  <Card />
</ScrollReveal>
<ScrollReveal animation="fade-up" delay={100}>
  <Card />
</ScrollReveal>
<ScrollReveal animation="fade-up" delay={200}>
  <Card />
</ScrollReveal>
```

### Implementation

Uses Intersection Observer with `rootMargin: '0px 0px -50px 0px'` to trigger slightly before element enters viewport.

---

## Reduced Motion

All animations must respect the user's motion preference.

### Global Override

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ScrollReveal Handling

When `prefers-reduced-motion: reduce`:

- Elements are shown immediately (no animation)
- `is-revealed` class added without transition

### PWA Chart Highlights

When `prefers-reduced-motion: reduce`:

- `pulse` animation replaced with static ring
- `glow` effect uses static shadow

---

## Best Practices

### Do

- Use `transform` and `opacity` for smooth 60fps
- Keep durations under 1 second
- Add delays for staggered effects
- Test with reduced motion enabled

### Don't

- Animate `width`, `height`, `top`, `left` (causes layout thrashing)
- Use animations for critical information
- Chain more than 3 staggered elements
- Auto-play infinite animations on large elements

---

## File Locations

| File                                             | Content                       |
| ------------------------------------------------ | ----------------------------- |
| `apps/website/src/styles/global.css`             | Keyframes and utility classes |
| `apps/website/src/components/ScrollReveal.astro` | Scroll animation component    |
| `apps/pwa/src/index.css`                         | Chart highlight animations    |

---

## Related Documentation

- [Case Study Components](../products/website/components/CASE-COMPONENTS.md)
- [PWA Embed Mode](../products/pwa/EMBED-MODE.md)
