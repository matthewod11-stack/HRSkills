# Quick Start: Warm Theme Redesign

## Immediate Steps

### 1. View the New Design

```bash
cd /Users/mattod/Desktop/HRSkills/webapp
npm run dev
```

Then open in your browser:
- **Main app:** http://localhost:3000
- **Color palette reference:** http://localhost:3000/design-preview

### 2. What You'll See

**Homepage (`/`):**
- Warm cream background instead of dark
- Terracotta/amber branding and accents
- Metric cards with earth-tone progress circles
- Chat interface with warm, inviting colors

**Design Preview (`/design-preview`):**
- Complete color palette with swatches
- Design principles
- Component examples
- Usage guidelines

## Key Color Reference (Quick Copy-Paste)

```css
/* Primary Colors */
--terracotta: #E07856;
--terracotta-dark: #D4704A;

/* Secondary Colors */
--sage: #8B9D83;
--sage-light: #A8B89B;

/* Accent Colors */
--amber: #E6A852;
--amber-dark: #D4A855;

/* Backgrounds */
--cream: #F5F1E8;
--cream-light: #EDE7DC;
--cream-white: #FEFDFB;

/* Text */
--charcoal: #2C2C2C;
--charcoal-light: #6B6B6B;
--charcoal-soft: #9A9A9A;
```

## Using the New Colors

### In Your Components

```tsx
// Tailwind classes available now:
className="bg-terracotta text-cream-white"
className="border-warm shadow-warm"
className="bg-sage hover:bg-sage-light"
className="text-charcoal"
className="bg-cream rounded-2xl"

// New utility classes:
className="hover-lift"           // Lifts on hover
className="shadow-warm"           // Warm terracotta shadow
className="bg-radial-cream"       // Warm gradient background
className="text-warm-gradient"    // Terracotta-to-amber text
```

### Common Patterns

**Primary Button:**
```tsx
<button className="bg-terracotta hover:bg-terracotta-dark text-cream-white
                   rounded-xl px-6 py-3 shadow-warm hover:shadow-warm-lg
                   transition-premium font-semibold">
  Click Me
</button>
```

**Card:**
```tsx
<div className="bg-cream-white border-2 border-cream-light rounded-2xl p-6
                shadow-soft hover:shadow-warm hover:border-terracotta/30
                transition-premium">
  {/* Content */}
</div>
```

**Input:**
```tsx
<input className="bg-cream-white border-2 border-cream-light rounded-xl
                  px-4 py-3 focus:border-terracotta focus:ring-2
                  focus:ring-terracotta/20 text-charcoal
                  placeholder-charcoal-soft" />
```

## Testing Checklist

- [ ] Homepage loads with warm colors
- [ ] Metric cards display correctly
- [ ] Chat interface is styled with earth tones
- [ ] Buttons have terracotta/amber accents
- [ ] Hover states work (lift effects, color changes)
- [ ] Text is readable (charcoal on cream backgrounds)
- [ ] Design preview page displays color palette
- [ ] Mobile responsive (test at 375px, 768px, 1024px)

## Troubleshooting

### Colors Not Showing?
1. Restart dev server: `npm run dev`
2. Clear browser cache (Cmd+Shift+R on Mac)
3. Check Tailwind is compiling: Look for `Rebuilding...` in terminal

### TypeScript Errors?
The redesign doesn't change types, but if you see errors:
```bash
npm run type-check
```

### Build Issues?
```bash
rm -rf .next
npm run build
```

## Customizing Further

### Want Different Shades?

Edit `tailwind.config.js`:
```js
terracotta: {
  DEFAULT: '#E07856',
  dark: '#D4704A',      // Make darker
  light: '#F0A58F',     // Make lighter
  custom: '#YOUR_COLOR' // Add new shade
},
```

### Want Different Border Radius?

Edit `tailwind.config.js`:
```js
borderRadius: {
  'xl': '0.75rem',  // Change from 0.75rem
  '2xl': '1.5rem',  // Change from 1rem
  '3xl': '2rem',    // Change from 1.5rem
}
```

### Want Different Shadows?

Edit `tailwind.config.js`:
```js
boxShadow: {
  'warm': '0 4px 20px rgba(224, 120, 86, 0.20)',  // Adjust opacity
  'warm-lg': '0 8px 32px rgba(224, 120, 86, 0.25)',
}
```

## Next Components to Update (Optional)

If you want to continue the redesign:

1. **Message Bubbles** - Update user/AI message styling in `MessageItem.tsx`
2. **Analytics Charts** - Apply new chart colors in `AnalyticsChartPanel.tsx`
3. **Suggestion Cards** - Update in `SuggestionCards.tsx`
4. **Context Panel** - Update `ContextPanel.tsx` styling
5. **Quick Actions** - Update action buttons throughout

## Getting Help

If you need to revert changes:
```bash
git status                    # See what changed
git diff tailwind.config.js   # Review specific file
git checkout -- [file]        # Revert specific file
```

Or create a new branch:
```bash
git checkout -b warm-theme-experiment
# Work safely without affecting main
```

## Production Deployment

When ready to deploy:
```bash
npm run build    # Build for production
npm run start    # Test production build locally
# Then deploy to Vercel/your hosting
```

---

**Enjoy your new warm, human-centric HR Command Center!** 🌿

For detailed documentation, see `WARM_REDESIGN_SUMMARY.md`.
