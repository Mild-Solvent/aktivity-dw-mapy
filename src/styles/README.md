# Styles

The application styles are split by responsibility so new CSS has an obvious home.

- `index.css` imports the full style stack in cascade order.
- `tokens.css` stores theme variables and reusable design values.
- `base.css` contains reset, body, and global container styles.
- `layout.css` contains shared page layout primitives.
- `shell/` contains app chrome such as navigation, header actions, search, and footer.
- `components/` contains reusable visual groups such as filters, icons, stats, gallery, and modal styles.
- `pages/` contains page-specific styles for home, track detail, admin, and legal pages.
- `responsive.css`, `animations.css`, and `accessibility.css` hold cross-page overrides.

For now, selectors are preserved from the original global stylesheet. The next cleanup pass can introduce shared objects such as `.button`, `.card`, `.badge`, and `.form-field` aliases without changing the site all at once.
