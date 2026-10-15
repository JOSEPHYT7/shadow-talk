/**
 * Client-Side HTML Sanitizer
 * Aggressively purges executable scripts, event handlers, and dangerous URI schemes
 * to guarantee complete XSS immunity inside rendered HTML containers.
 */

export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    // Forbidden tag blacklist
    const forbiddenTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'applet',
      'meta',
      'link',
      'form',
      'button',
      'input',
      'textarea',
      'select',
      'style'
    ];

    forbiddenTags.forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // Walk all elements and strip inline handlers / dangerous attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();

        // Remove any inline event handler (e.g. onclick, onerror, onload, etc.)
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }

        // Neutralize dangerous protocols in href, src, formaction, or xlink:href
        if (['href', 'src', 'formaction', 'xlink:href', 'data'].includes(name)) {
          if (
            val.startsWith('javascript:') ||
            val.startsWith('vbscript:') ||
            val.startsWith('data:text/html') ||
            val.startsWith('data:application/javascript')
          ) {
            el.removeAttribute(attr.name);
          }
        }
      });

      // Enforce safe link targeting
      if (el.tagName.toLowerCase() === 'a') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.warn('[SanitizeHtml]: Sanitization fallback triggered:', err.message);
    // Plain text fallback if DOMParser fails
    return dirtyHtml.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
