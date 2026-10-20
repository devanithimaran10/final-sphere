/**
 * Game Image Map – Provides inline SVG data URIs for all game objects and words.
 *
 * Each SVG is a stylised icon with gradients and glow effects that fit
 * the neon / sci-fi aesthetic of the Sphere Trainer UI.
 */

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/* ── helper: wrap an SVG icon body into a full viewBox 0 0 100 100 doc ── */
function icon(body: string, gradients = ''): string {
  return svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>${gradients}</defs>
      ${body}
    </svg>`
  );
}

/* ── gradient presets ───────────────────────────────────────────────── */
const G_TEAL = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>`;
const G_RED = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#ee5a24"/></linearGradient>`;
const G_GREEN = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00b894"/><stop offset="1" stop-color="#55efc4"/></linearGradient>`;
const G_BLUE = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0984e3"/><stop offset="1" stop-color="#74b9ff"/></linearGradient>`;
const G_ORANGE = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f39c12"/><stop offset="1" stop-color="#fdcb6e"/></linearGradient>`;
const G_PURPLE = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a29bfe"/><stop offset="1" stop-color="#6c5ce7"/></linearGradient>`;
const G_SILVER = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b2bec3"/><stop offset="1" stop-color="#dfe6e9"/></linearGradient>`;
const G_GOLD = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffeaa7"/><stop offset="1" stop-color="#fdcb6e"/></linearGradient>`;
const G_BROWN = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d35400"/><stop offset="1" stop-color="#e17055"/></linearGradient>`;

/* ────────────────────────────────────────────────────────────────────
   WORD RECALL images
   Maps each word from the WORD_BANK to an SVG icon.
   ──────────────────────────────────────────────────────────────────── */
export const WORD_IMAGES: Record<string, string> = {
  // Apple – red round fruit with leaf
  APPLE: icon(
    `<circle cx="50" cy="54" r="30" fill="url(#g)" opacity="0.9"/>
     <ellipse cx="50" cy="54" rx="28" ry="26" fill="url(#g)"/>
     <path d="M50 24 Q55 18 60 22" stroke="#27ae60" stroke-width="3" fill="none"/>
     <ellipse cx="56" cy="22" rx="8" ry="5" fill="#27ae60" opacity="0.8" transform="rotate(-15 56 22)"/>
     <ellipse cx="40" cy="42" rx="6" ry="8" fill="rgba(255,255,255,0.25)" transform="rotate(-20 40 42)"/>`,
    G_RED
  ),

  // River – flowing water with waves
  RIVER: icon(
    `<path d="M10 50 Q30 35 50 50 T90 50" stroke="url(#g)" stroke-width="6" fill="none" stroke-linecap="round"/>
     <path d="M10 60 Q30 45 50 60 T90 60" stroke="url(#g)" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round"/>
     <path d="M10 70 Q30 55 50 70 T90 70" stroke="url(#g)" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>
     <circle cx="25" cy="44" r="2" fill="#74b9ff" opacity="0.6"/>
     <circle cx="70" cy="48" r="2.5" fill="#74b9ff" opacity="0.5"/>`,
    G_BLUE
  ),

  // Chair – simple chair silhouette
  CHAIR: icon(
    `<rect x="30" y="20" width="6" height="55" rx="3" fill="url(#g)"/>
     <rect x="64" y="48" width="6" height="27" rx="3" fill="url(#g)"/>
     <rect x="28" y="48" width="44" height="6" rx="3" fill="url(#g)"/>
     <rect x="28" y="18" width="6" height="6" rx="2" fill="url(#g)" opacity="0.7"/>
     <line x1="33" y1="28" x2="33" y2="45" stroke="url(#g)" stroke-width="2" opacity="0.5"/>`,
    G_BROWN
  ),

  // Garden – flower with leaves
  GARDEN: icon(
    `<circle cx="50" cy="35" r="10" fill="#fdcb6e"/>
     <circle cx="40" cy="28" r="8" fill="#ff7979" opacity="0.8"/>
     <circle cx="60" cy="28" r="8" fill="#ff7979" opacity="0.8"/>
     <circle cx="42" cy="40" r="8" fill="#ff7979" opacity="0.8"/>
     <circle cx="58" cy="40" r="8" fill="#ff7979" opacity="0.8"/>
     <rect x="48" y="45" width="4" height="30" rx="2" fill="#00b894"/>
     <ellipse cx="40" cy="62" rx="12" ry="6" fill="#00b894" opacity="0.7"/>
     <ellipse cx="60" cy="66" rx="10" ry="5" fill="#55efc4" opacity="0.6"/>`,
    G_GREEN
  ),

  // Clock – analog clock face
  CLOCK: icon(
    `<circle cx="50" cy="50" r="34" fill="rgba(10,15,35,0.8)" stroke="url(#g)" stroke-width="4"/>
     <circle cx="50" cy="50" r="30" fill="none" stroke="url(#g)" stroke-width="1" opacity="0.3"/>
     <line x1="50" y1="50" x2="50" y2="28" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round"/>
     <line x1="50" y1="50" x2="68" y2="50" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
     <circle cx="50" cy="50" r="3" fill="#2dd4bf"/>
     <circle cx="50" cy="22" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="78" cy="50" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="50" cy="78" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="22" cy="50" r="2" fill="url(#g)" opacity="0.7"/>`,
    G_TEAL
  ),

  // Bridge – arched bridge
  BRIDGE: icon(
    `<path d="M10 65 Q50 20 90 65" stroke="url(#g)" stroke-width="5" fill="none" stroke-linecap="round"/>
     <line x1="10" y1="65" x2="90" y2="65" stroke="url(#g)" stroke-width="3"/>
     <line x1="30" y1="65" x2="30" y2="42" stroke="url(#g)" stroke-width="2" opacity="0.6"/>
     <line x1="50" y1="65" x2="50" y2="28" stroke="url(#g)" stroke-width="2" opacity="0.6"/>
     <line x1="70" y1="65" x2="70" y2="42" stroke="url(#g)" stroke-width="2" opacity="0.6"/>`,
    G_SILVER
  ),

  // Candle – candle with flame
  CANDLE: icon(
    `<rect x="40" y="40" width="20" height="38" rx="4" fill="url(#g)"/>
     <ellipse cx="50" cy="40" rx="10" ry="3" fill="url(#g)" opacity="0.7"/>
     <ellipse cx="50" cy="28" rx="6" ry="12" fill="#ffeaa7" opacity="0.9"/>
     <ellipse cx="50" cy="26" rx="4" ry="8" fill="#fdcb6e"/>
     <ellipse cx="50" cy="24" rx="2" ry="5" fill="#fff" opacity="0.7"/>
     <line x1="50" y1="40" x2="50" y2="35" stroke="#e17055" stroke-width="2"/>`,
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa7"/><stop offset="1" stop-color="#fdcb6e"/></linearGradient>`
  ),

  // Forest – trees
  FOREST: icon(
    `<polygon points="30,70 50,20 70,70" fill="url(#g)" opacity="0.8"/>
     <polygon points="20,75 40,30 60,75" fill="#00b894" opacity="0.6"/>
     <polygon points="45,75 65,28 85,75" fill="#55efc4" opacity="0.5"/>
     <rect x="47" y="70" width="6" height="12" rx="1" fill="#d35400"/>
     <rect x="27" y="70" width="5" height="10" rx="1" fill="#e17055"/>`,
    G_GREEN
  ),

  // Mirror – oval mirror with frame
  MIRROR: icon(
    `<ellipse cx="50" cy="48" rx="25" ry="32" fill="none" stroke="url(#g)" stroke-width="5"/>
     <ellipse cx="50" cy="48" rx="20" ry="27" fill="rgba(116,185,255,0.15)"/>
     <ellipse cx="43" cy="38" rx="8" ry="14" fill="rgba(255,255,255,0.12)" transform="rotate(-10 43 38)"/>
     <rect x="47" y="78" width="6" height="10" rx="2" fill="url(#g)"/>`,
    G_SILVER
  ),

  // Pencil – pencil diagonal
  PENCIL: icon(
    `<rect x="25" y="25" width="12" height="50" rx="2" fill="url(#g)" transform="rotate(-45 50 50)"/>
     <polygon points="25,75 20,85 35,80" fill="#ffeaa7" transform="rotate(-45 50 50)"/>
     <rect x="25" y="25" width="12" height="8" rx="1" fill="#e17055" transform="rotate(-45 50 50)"/>`,
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdcb6e"/><stop offset="1" stop-color="#f39c12"/></linearGradient>`
  ),

  // Basket – woven basket
  BASKET: icon(
    `<path d="M20 45 Q50 35 80 45 L75 75 Q50 82 25 75 Z" fill="url(#g)" opacity="0.85"/>
     <path d="M25 52 Q50 48 75 52" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none"/>
     <path d="M25 60 Q50 56 75 60" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>
     <path d="M25 68 Q50 64 75 68" stroke="rgba(255,255,255,0.1)" stroke-width="2" fill="none"/>
     <path d="M35 45 Q50 22 65 45" stroke="url(#g)" stroke-width="4" fill="none"/>`,
    G_BROWN
  ),

  // Window – window with panes
  WINDOW: icon(
    `<rect x="22" y="20" width="56" height="60" rx="4" fill="none" stroke="url(#g)" stroke-width="4"/>
     <line x1="50" y1="20" x2="50" y2="80" stroke="url(#g)" stroke-width="3"/>
     <line x1="22" y1="50" x2="78" y2="50" stroke="url(#g)" stroke-width="3"/>
     <rect x="25" y="23" width="22" height="24" rx="1" fill="rgba(116,185,255,0.15)"/>
     <rect x="53" y="23" width="22" height="24" rx="1" fill="rgba(116,185,255,0.1)"/>
     <rect x="25" y="53" width="22" height="24" rx="1" fill="rgba(116,185,255,0.1)"/>
     <rect x="53" y="53" width="22" height="24" rx="1" fill="rgba(116,185,255,0.12)"/>`,
    G_BLUE
  ),

  // Pillow – soft pillow shape
  PILLOW: icon(
    `<ellipse cx="50" cy="52" rx="34" ry="22" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="50" rx="30" ry="18" fill="url(#g)"/>
     <ellipse cx="40" cy="46" rx="10" ry="8" fill="rgba(255,255,255,0.12)"/>
     <path d="M22 50 Q20 52 22 54" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" fill="none"/>
     <path d="M78 50 Q80 52 78 54" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" fill="none"/>`,
    G_PURPLE
  ),

  // Bottle – bottle shape
  BOTTLE: icon(
    `<rect x="38" y="20" width="24" height="8" rx="3" fill="url(#g)" opacity="0.8"/>
     <rect x="42" y="10" width="16" height="12" rx="4" fill="url(#g)"/>
     <path d="M38 28 Q38 36 34 42 L34 75 Q34 80 39 80 L61 80 Q66 80 66 75 L66 42 Q62 36 62 28 Z" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="46" cy="50" rx="6" ry="12" fill="rgba(255,255,255,0.12)"/>`,
    G_GREEN
  ),

  // Kitchen – cooking pot
  KITCHEN: icon(
    `<ellipse cx="50" cy="55" rx="30" ry="8" fill="url(#g)" opacity="0.4"/>
     <path d="M22 45 L22 60 Q22 72 50 72 Q78 72 78 60 L78 45 Z" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="45" rx="28" ry="8" fill="url(#g)"/>
     <line x1="16" y1="45" x2="12" y2="42" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <line x1="84" y1="45" x2="88" y2="42" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <path d="M46 30 Q48 22 50 30 Q52 22 54 30" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>`,
    G_SILVER
  ),

  // Island – tropical island
  ISLAND: icon(
    `<ellipse cx="50" cy="68" rx="35" ry="12" fill="#f39c12" opacity="0.7"/>
     <path d="M50 25 L50 62" stroke="#d35400" stroke-width="4" stroke-linecap="round"/>
     <path d="M50 25 Q65 20 72 30 Q60 28 50 25" fill="#00b894"/>
     <path d="M50 25 Q35 20 28 30 Q40 28 50 25" fill="#55efc4"/>
     <path d="M50 30 Q62 28 68 35 Q56 32 50 30" fill="#00b894" opacity="0.6"/>
     <path d="M20 72 Q35 62 50 72 Q65 62 80 72" stroke="#0984e3" stroke-width="2" fill="none" opacity="0.5"/>`,
    G_BLUE
  ),

  // Valley – valley/mountains
  VALLEY: icon(
    `<polygon points="5,75 30,30 55,75" fill="url(#g)" opacity="0.6"/>
     <polygon points="45,75 70,25 95,75" fill="url(#g)" opacity="0.8"/>
     <path d="M5 75 L95 75" stroke="url(#g)" stroke-width="2" opacity="0.4"/>
     <circle cx="80" cy="20" r="6" fill="#ffeaa7" opacity="0.7"/>`,
    G_GREEN
  ),

  // Button – round button
  BUTTON: icon(
    `<circle cx="50" cy="50" r="28" fill="url(#g)" opacity="0.85"/>
     <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
     <circle cx="42" cy="44" r="3" fill="rgba(0,0,0,0.3)"/>
     <circle cx="58" cy="44" r="3" fill="rgba(0,0,0,0.3)"/>
     <circle cx="42" cy="56" r="3" fill="rgba(0,0,0,0.3)"/>
     <circle cx="58" cy="56" r="3" fill="rgba(0,0,0,0.3)"/>
     <ellipse cx="42" cy="38" rx="8" ry="6" fill="rgba(255,255,255,0.15)"/>`,
    G_TEAL
  ),

  // Blanket – folded blanket
  BLANKET: icon(
    `<path d="M20 35 Q50 28 80 35 L82 72 Q50 78 18 72 Z" fill="url(#g)" opacity="0.85"/>
     <path d="M20 35 Q50 28 80 35 Q80 42 78 48 Q50 40 22 48 Q20 42 20 35" fill="url(#g)"/>
     <path d="M25 55 Q50 50 75 55" stroke="rgba(255,255,255,0.1)" stroke-width="2" fill="none"/>
     <path d="M25 63 Q50 58 75 63" stroke="rgba(255,255,255,0.08)" stroke-width="2" fill="none"/>`,
    G_PURPLE
  ),

  // Whistle – whistle shape
  WHISTLE: icon(
    `<ellipse cx="40" cy="50" rx="22" ry="14" fill="url(#g)" opacity="0.85"/>
     <rect x="55" y="44" width="25" height="12" rx="3" fill="url(#g)"/>
     <circle cx="40" cy="50" r="6" fill="rgba(0,0,0,0.3)"/>
     <circle cx="40" cy="50" r="3" fill="rgba(0,0,0,0.5)"/>
     <rect x="78" y="42" width="6" height="6" rx="3" fill="url(#g)" opacity="0.7"/>`,
    G_SILVER
  ),

  // Orange – orange fruit
  ORANGE: icon(
    `<circle cx="50" cy="54" r="28" fill="url(#g)" opacity="0.9"/>
     <ellipse cx="50" cy="54" rx="26" ry="24" fill="url(#g)"/>
     <path d="M50 26 Q53 20 56 24" stroke="#27ae60" stroke-width="2.5" fill="none"/>
     <ellipse cx="54" cy="22" rx="6" ry="4" fill="#27ae60" opacity="0.7" transform="rotate(-10 54 22)"/>
     <ellipse cx="40" cy="44" rx="5" ry="7" fill="rgba(255,255,255,0.18)" transform="rotate(-15 40 44)"/>`,
    G_ORANGE
  ),

  // Turtle – turtle shape
  TURTLE: icon(
    `<ellipse cx="50" cy="55" rx="28" ry="18" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="54" rx="22" ry="14" fill="url(#g)"/>
     <path d="M50 48 L42 42 L50 36 L58 42 Z" fill="rgba(255,255,255,0.1)"/>
     <path d="M42 55 L36 55 L34 60 L38 62" stroke="url(#g)" stroke-width="3" fill="url(#g)" opacity="0.6"/>
     <path d="M58 55 L64 55 L66 60 L62 62" stroke="url(#g)" stroke-width="3" fill="url(#g)" opacity="0.6"/>
     <circle cx="72" cy="48" r="6" fill="url(#g)" opacity="0.7"/>
     <circle cx="74" cy="47" r="1.5" fill="rgba(0,0,0,0.5)"/>
     <path d="M22 58 L18 56" stroke="url(#g)" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`,
    G_GREEN
  ),

  // Silver – silver bar / ingot
  SILVER: icon(
    `<polygon points="25,65 35,35 75,35 85,65" fill="url(#g)" opacity="0.85"/>
     <polygon points="35,35 45,25 85,25 75,35" fill="url(#g)"/>
     <polygon points="75,35 85,25 95,55 85,65" fill="url(#g)" opacity="0.6"/>
     <line x1="40" y1="40" x2="70" y2="40" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
     <line x1="38" y1="50" x2="72" y2="50" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`,
    G_SILVER
  ),

  // Planet – ringed planet
  PLANET: icon(
    `<circle cx="50" cy="50" r="22" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="50" rx="38" ry="10" fill="none" stroke="url(#g)" stroke-width="3" opacity="0.5" transform="rotate(-20 50 50)"/>
     <ellipse cx="42" cy="42" rx="6" ry="8" fill="rgba(255,255,255,0.12)"/>
     <circle cx="60" cy="55" r="4" fill="rgba(0,0,0,0.15)"/>`,
    G_PURPLE
  ),

  // Castle – castle with towers
  CASTLE: icon(
    `<rect x="30" y="40" width="40" height="40" rx="2" fill="url(#g)" opacity="0.85"/>
     <rect x="22" y="30" width="14" height="50" rx="2" fill="url(#g)"/>
     <rect x="64" y="30" width="14" height="50" rx="2" fill="url(#g)"/>
     <rect x="22" y="22" width="4" height="10" fill="url(#g)"/>
     <rect x="28" y="22" width="4" height="10" fill="url(#g)"/>
     <rect x="34" y="22" width="4" height="10" fill="url(#g)"/>
     <rect x="64" y="22" width="4" height="10" fill="url(#g)"/>
     <rect x="70" y="22" width="4" height="10" fill="url(#g)"/>
     <rect x="76" y="22" width="4" height="10" fill="url(#g)"/>
     <path d="M44 80 L44 60 Q50 54 56 60 L56 80" fill="rgba(0,0,0,0.4)"/>`,
    G_SILVER
  ),

  // Harbor – ship/anchor
  HARBOR: icon(
    `<path d="M50 18 L50 65" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <line x1="38" y1="18" x2="62" y2="18" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <path d="M30 65 Q50 82 70 65" stroke="url(#g)" stroke-width="4" fill="none" stroke-linecap="round"/>
     <circle cx="50" cy="32" r="8" fill="none" stroke="url(#g)" stroke-width="3"/>
     <path d="M15 75 Q30 68 50 75 Q70 68 85 75" stroke="#0984e3" stroke-width="2" fill="none" opacity="0.5"/>`,
    G_BLUE
  ),

  // Meadow – grass and flowers
  MEADOW: icon(
    `<path d="M5 75 Q25 60 50 75 Q75 60 95 75" fill="#00b894" opacity="0.5"/>
     <path d="M5 80 Q30 65 55 80 Q80 65 95 80" fill="#55efc4" opacity="0.4"/>
     <circle cx="30" cy="50" r="5" fill="#ff7979" opacity="0.8"/>
     <circle cx="60" cy="45" r="5" fill="#fdcb6e"/>
     <circle cx="75" cy="55" r="4" fill="#a29bfe" opacity="0.7"/>
     <line x1="30" y1="55" x2="30" y2="72" stroke="#00b894" stroke-width="2"/>
     <line x1="60" y1="50" x2="60" y2="70" stroke="#00b894" stroke-width="2"/>
     <line x1="75" y1="59" x2="75" y2="72" stroke="#00b894" stroke-width="2"/>
     <line x1="45" y1="65" x2="45" y2="78" stroke="#55efc4" stroke-width="2"/>`,
    G_GREEN
  ),

  // Tunnel – tunnel/arch shape
  TUNNEL: icon(
    `<path d="M15 80 L15 40 Q50 5 85 40 L85 80" fill="none" stroke="url(#g)" stroke-width="5"/>
     <path d="M25 80 L25 45 Q50 18 75 45 L75 80" fill="rgba(0,0,0,0.3)" stroke="url(#g)" stroke-width="2" opacity="0.5"/>
     <path d="M35 80 L35 50 Q50 30 65 50 L65 80" fill="rgba(0,0,0,0.5)"/>
     <circle cx="50" cy="62" r="3" fill="#ffeaa7" opacity="0.6"/>`,
    G_SILVER
  ),

  // Crayon – crayon diagonal
  CRAYON: icon(
    `<rect x="35" y="20" width="16" height="50" rx="3" fill="url(#g)" opacity="0.85" transform="rotate(15 50 50)"/>
     <polygon points="35,70 43,82 51,70" fill="url(#g)" transform="rotate(15 50 50)"/>
     <rect x="35" y="20" width="16" height="10" rx="2" fill="rgba(0,0,0,0.2)" transform="rotate(15 50 50)"/>
     <line x1="40" y1="34" x2="40" y2="65" stroke="rgba(255,255,255,0.1)" stroke-width="1" transform="rotate(15 50 50)"/>`,
    G_RED
  ),

  // Anchor – ship anchor
  ANCHOR: icon(
    `<circle cx="50" cy="22" r="8" fill="none" stroke="url(#g)" stroke-width="3.5"/>
     <line x1="50" y1="30" x2="50" y2="75" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <line x1="36" y1="22" x2="64" y2="22" stroke="url(#g)" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M28 60 Q50 85 72 60" stroke="url(#g)" stroke-width="4" fill="none" stroke-linecap="round"/>
     <line x1="28" y1="60" x2="28" y2="52" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
     <line x1="72" y1="60" x2="72" y2="52" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>`,
    G_BLUE
  ),
};

/* ────────────────────────────────────────────────────────────────────
   SCENE MEMORY object images
   Maps each object from the OBJECT_POOL to an SVG icon.
   ──────────────────────────────────────────────────────────────────── */
export const OBJECT_IMAGES: Record<string, string> = {
  cup: icon(
    `<path d="M25 30 L30 75 Q50 82 70 75 L75 30 Z" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="30" rx="25" ry="8" fill="url(#g)"/>
     <ellipse cx="50" cy="30" rx="20" ry="6" fill="rgba(0,0,0,0.3)"/>
     <path d="M75 40 Q90 40 90 55 Q90 65 75 62" stroke="url(#g)" stroke-width="4" fill="none"/>
     <path d="M45 40 Q48 50 45 60" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>`,
    G_TEAL
  ),

  book: icon(
    `<rect x="22" y="18" width="52" height="64" rx="4" fill="url(#g)" opacity="0.85"/>
     <rect x="28" y="18" width="46" height="64" rx="2" fill="url(#g)"/>
     <line x1="30" y1="18" x2="30" y2="82" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
     <rect x="36" y="30" width="28" height="3" rx="1" fill="rgba(255,255,255,0.2)"/>
     <rect x="36" y="38" width="22" height="3" rx="1" fill="rgba(255,255,255,0.15)"/>
     <rect x="36" y="46" width="26" height="3" rx="1" fill="rgba(255,255,255,0.12)"/>`,
    G_BLUE
  ),

  plant: icon(
    `<rect x="35" y="58" width="30" height="24" rx="4" fill="url(#g)" opacity="0.6"/>
     <ellipse cx="50" cy="58" rx="15" ry="5" fill="url(#g)" opacity="0.4"/>
     <path d="M50 55 Q40 35 30 28 Q42 32 50 42" fill="#00b894" opacity="0.8"/>
     <path d="M50 55 Q60 35 70 28 Q58 32 50 42" fill="#55efc4" opacity="0.7"/>
     <path d="M50 50 Q45 30 50 18 Q55 30 50 50" fill="#00b894"/>
     <line x1="50" y1="55" x2="50" y2="22" stroke="#2d7a56" stroke-width="2" opacity="0.5"/>`,
    G_BROWN
  ),

  clock: icon(
    `<circle cx="50" cy="50" r="32" fill="rgba(10,15,35,0.8)" stroke="url(#g)" stroke-width="4"/>
     <line x1="50" y1="50" x2="50" y2="26" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round"/>
     <line x1="50" y1="50" x2="66" y2="50" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
     <circle cx="50" cy="50" r="3" fill="#2dd4bf"/>
     <circle cx="50" cy="22" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="78" cy="50" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="50" cy="78" r="2" fill="url(#g)" opacity="0.7"/>
     <circle cx="22" cy="50" r="2" fill="url(#g)" opacity="0.7"/>`,
    G_TEAL
  ),

  lamp: icon(
    `<path d="M35 50 Q30 25 50 15 Q70 25 65 50 Z" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="15" rx="4" ry="4" fill="#ffeaa7" opacity="0.8"/>
     <rect x="38" y="50" width="24" height="6" rx="3" fill="url(#g)"/>
     <rect x="46" y="56" width="8" height="16" rx="2" fill="url(#g)" opacity="0.7"/>
     <ellipse cx="50" cy="75" rx="14" ry="5" fill="url(#g)" opacity="0.6"/>
     <path d="M40 30 Q45 28 50 30" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" fill="none"/>`,
    G_GOLD
  ),

  glasses: icon(
    `<circle cx="32" cy="45" r="15" fill="none" stroke="url(#g)" stroke-width="4"/>
     <circle cx="68" cy="45" r="15" fill="none" stroke="url(#g)" stroke-width="4"/>
     <circle cx="32" cy="45" r="12" fill="rgba(116,185,255,0.1)"/>
     <circle cx="68" cy="45" r="12" fill="rgba(116,185,255,0.1)"/>
     <path d="M47 45 Q50 40 53 45" stroke="url(#g)" stroke-width="3" fill="none"/>
     <line x1="17" y1="42" x2="8" y2="38" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
     <line x1="83" y1="42" x2="92" y2="38" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>`,
    G_TEAL
  ),

  vase: icon(
    `<path d="M38 25 Q35 40 30 50 Q28 65 40 75 Q50 80 60 75 Q72 65 70 50 Q65 40 62 25 Z" fill="url(#g)" opacity="0.85"/>
     <ellipse cx="50" cy="25" rx="12" ry="5" fill="url(#g)"/>
     <ellipse cx="50" cy="25" rx="9" ry="3" fill="rgba(0,0,0,0.3)"/>
     <ellipse cx="43" cy="45" rx="5" ry="10" fill="rgba(255,255,255,0.1)"/>`,
    G_PURPLE
  ),

  candle: icon(
    `<rect x="40" y="42" width="20" height="36" rx="4" fill="url(#g)"/>
     <ellipse cx="50" cy="42" rx="10" ry="3" fill="url(#g)" opacity="0.7"/>
     <ellipse cx="50" cy="30" rx="5" ry="10" fill="#ffeaa7" opacity="0.9"/>
     <ellipse cx="50" cy="28" rx="3.5" ry="7" fill="#fdcb6e"/>
     <ellipse cx="50" cy="26" rx="2" ry="4" fill="#fff" opacity="0.7"/>
     <line x1="50" y1="42" x2="50" y2="37" stroke="#e17055" stroke-width="2"/>`,
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa7"/><stop offset="1" stop-color="#fdcb6e"/></linearGradient>`
  ),

  key: icon(
    `<circle cx="35" cy="35" r="14" fill="none" stroke="url(#g)" stroke-width="4"/>
     <circle cx="35" cy="35" r="6" fill="none" stroke="url(#g)" stroke-width="2" opacity="0.5"/>
     <line x1="48" y1="43" x2="78" y2="73" stroke="url(#g)" stroke-width="4" stroke-linecap="round"/>
     <line x1="78" y1="73" x2="78" y2="62" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
     <line x1="70" y1="65" x2="70" y2="58" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>`,
    G_GOLD
  ),

  phone: icon(
    `<rect x="30" y="14" width="40" height="72" rx="8" fill="rgba(10,15,35,0.9)" stroke="url(#g)" stroke-width="3"/>
     <rect x="34" y="24" width="32" height="48" rx="2" fill="rgba(45,212,191,0.08)"/>
     <circle cx="50" cy="80" r="3" fill="none" stroke="url(#g)" stroke-width="1.5" opacity="0.6"/>
     <rect x="42" y="17" width="16" height="3" rx="1.5" fill="url(#g)" opacity="0.4"/>
     <rect x="38" y="34" width="24" height="3" rx="1" fill="rgba(45,212,191,0.2)"/>
     <rect x="38" y="42" width="18" height="3" rx="1" fill="rgba(45,212,191,0.15)"/>`,
    G_TEAL
  ),
};
