import { LEGACY_BLOG_SLUGS } from "@/lib/blog-legacy-slugs";

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  answer: string;
  image: string;
  imageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  keywords: string[];
  sections: Array<{ heading: string; paragraphs: string[]; tips?: string[] }>;
  faq: Array<{ question: string; answer: string }>;
};

const topicGroups: Array<{
  category: string;
  image: string;
  titles: string[];
}> = [
  {
    category: "Dresses",
    image: "/party-wear-red-dress.png",
    titles: [
      "Best Dresses for Women in India: Styles for Every Occasion",
      "How to Choose a Dress for Your Body Shape",
      "Midi vs Maxi Dress: Which Length Should You Choose?",
      "Best Dresses for Petite Women: Fit and Styling Guide",
      "Best Dresses for Curvy Women: Comfortable, Flattering Fits",
      "What to Wear Under a Bodycon Dress",
      "How to Style a Maxi Dress for a Wedding",
      "Western Dress Types Every Woman Should Know",
      "How to Measure Yourself Before Buying a Dress Online",
      "How to Rewear One Dress for Work, Brunch and Parties",
    ],
  },
  {
    category: "Co-ord Sets",
    image: "/coord-set.jpg",
    titles: [
      "Co-ord Sets for Women: Complete Buying and Styling Guide",
      "What Is a Co-ord Set and Why Is It So Versatile?",
      "How to Style a Co-ord Set for Work",
      "Party Wear Co-ord Sets: What to Choose and How to Style Them",
      "Co-ord Sets for Travel: Comfortable Airport Outfit Ideas",
      "How to Mix and Match Co-ord Set Separates",
      "Best Co-ord Sets for Curvy Women: Fit and Proportion Tips",
      "Cotton vs Linen vs Satin Co-ord Sets",
      "How to Style a Blazer Co-ord from Office to Dinner",
      "Which Shoes Go Best with Co-ord Sets?",
    ],
  },
  {
    category: "Indian Wear",
    image: "/indian-suits.png",
    titles: [
      "What to Wear to an Indian Wedding as a Female Guest",
      "Kurti Types: 15 Styles and How to Choose the Right One",
      "How to Style a Kurti with Jeans, Trousers and Palazzos",
      "Best Indian Wear for Summer Weddings",
      "What to Wear for Haldi, Mehendi, Sangeet and Reception",
      "How to Choose a Kurti for Your Body Shape",
      "Indo-Western Outfit Ideas for Women",
      "Simple Festive Outfit Ideas for Diwali",
      "Navratri Outfit Ideas for Garba in Ahmedabad",
      "How to Care for Embroidered Kurtis and Occasion Wear",
    ],
  },
  {
    category: "Korean Style",
    image: "/korean-streetwear.jpg",
    titles: [
      "Korean Outfit Ideas for Women in India",
      "How to Build a Korean-Inspired Capsule Wardrobe",
      "Korean Summer Outfits for Hot Indian Weather",
      "How to Style an Oversized Shirt the Korean Way",
      "Korean Office Wear Ideas That Look Professional",
      "Korean College Outfit Ideas That Are Easy to Recreate",
      "How to Style Korean Pleated Skirts",
      "Korean Minimalist Outfit Ideas with Neutral Colours",
      "Best Shoes and Bags for Korean-Inspired Outfits",
      "Where to Buy Korean-Inspired Clothes in Ahmedabad",
    ],
  },
  {
    category: "Party Wear",
    image: "/cocktail-dress.png",
    titles: [
      "What to Wear to a Cocktail Party: Women's Dress Guide",
      "Birthday Party Outfit Ideas for Women",
      "What to Wear to an Office Party",
      "Dinner Date Outfit Ideas for Women",
      "Club Party Outfits for Women: Stylish and Comfortable Ideas",
      "House Party Outfit Ideas That Feel Effortless",
      "What to Wear to a College Farewell Party",
      "Day Party vs Night Party: How Your Outfit Should Change",
      "How to Choose a Party Dress You Can Rewear",
      "Party Wear Dresses in Ahmedabad: Complete Shopping Guide",
    ],
  },
  {
    category: "Everyday Style",
    image: "/minimalist-cotton-dress.jpg",
    titles: [
      "What to Wear When You Have Nothing to Wear: 10 Outfit Formulas",
      "Everyday Capsule Wardrobe for Indian Women",
      "How to Look Stylish Every Day Without Buying More Clothes",
      "Casual Brunch Outfit Ideas for Women",
      "Monsoon Outfit Ideas for Women in India",
      "Summer Outfit Ideas for Ahmedabad Heat",
      "How to Style One White Shirt Five Ways",
      "How to Repeat Outfits Without Looking Repetitive",
      "Comfortable Travel Outfit Ideas for Women",
      "Easy College Outfit Ideas for Women in India",
    ],
  },
  {
    category: "Workwear",
    image: "/top-wear-pink-floral.png",
    titles: [
      "Office Wear for Women in India: Complete Style Guide",
      "Business Casual for Women: What It Means and What to Wear",
      "What to Wear to a Job Interview in India",
      "Formal Co-ord Sets for Women: Office Styling Guide",
      "Summer Office Outfits for Hot Indian Weather",
      "Smart Casual Office Outfit Ideas for Women",
      "Workwear Capsule Wardrobe: 12 Essentials",
      "How to Style Wide-Leg Trousers for Work",
      "Office-to-Party Outfit Ideas for Indian Women",
      "Best Colours for Professional Women's Outfits",
    ],
  },
  {
    category: "Fit & Sizing",
    image: "/wide-leg-trousers.png",
    titles: [
      "How to Take Body Measurements for Women's Clothing",
      "Women's Clothing Size Chart: How to Find Your Right Size",
      "How Should a Dress Fit? 10 Points to Check",
      "How to Choose Clothes for Your Body Shape Without Rules",
      "Petite Clothing Guide: How to Find Better Proportions",
      "Plus-Size Clothing Guide: Fit, Fabric and Comfort",
      "How to Choose the Right Neckline for Your Outfit",
      "How to Find Trousers That Fit Properly",
      "Fabric Guide for Online Shopping: Cotton, Linen, Rayon and More",
      "Online Clothes Shopping Checklist for Women in India",
    ],
  },
  {
    category: "Accessories",
    image: "/accessories-gold-jewelry.jpg",
    titles: [
      "How to Accessorise a Dress Without Overdoing It",
      "How to Choose Jewellery for Every Neckline",
      "What Shoes to Wear with Dresses, Co-ords and Kurtis",
      "Essential Handbags for a Versatile Wardrobe",
      "Gold vs Silver Jewellery: Which Suits Your Outfit?",
      "How to Accessorise a Party Dress",
      "How to Choose a Belt for Dresses and Trousers",
      "Sunglasses for Every Face Shape: Practical Guide",
      "How to Wear Statement Earrings with Confidence",
      "How to Transform a Repeat Outfit with Accessories",
    ],
  },
  {
    category: "Ahmedabad Fashion",
    image: "/collection.jpg",
    titles: [
      "Best Women's Clothing Store in Ahmedabad: What to Look For",
      "Where to Buy Western Dresses in Ahmedabad",
      "Where to Buy Co-ord Sets in Ahmedabad",
      "Where to Buy Party Wear Dresses in Ahmedabad",
      "Where to Buy Korean-Inspired Clothing in Ahmedabad",
      "Best Women's Outfits for Ahmedabad Weather",
      "Ahmedabad Wedding Shopping Guide for Female Guests",
      "Navratri Shopping in Ahmedabad: Outfit and Comfort Guide",
      "Online vs Local Clothes Shopping in Ahmedabad",
      "Carnival of Clothes Ahmedabad: Official Brand and Shopping Guide",
    ],
  },
];

const categoryGuidance: Record<string, { approach: string; styling: string; tips: string[] }> = {
  Dresses: {
    approach: "Compare the garment measurements with a dress you already like. Check shoulder placement, bust ease, waist position, total length and whether the fabric needs a lining or special undergarment.",
    styling: "Let the dress silhouette lead the outfit. Use shoes to support the hem length, choose one jewellery focal point, and add a layer only when it improves comfort or suits the venue.",
    tips: ["Check the dress length against your height, not only the model photo.", "Confirm whether the fabric stretches, drapes or holds structure.", "Sit, walk and raise your arms before deciding the fit is right."],
  },
  "Co-ord Sets": {
    approach: "Evaluate both pieces separately as well as together. The top should work with jeans or a skirt, and the bottom should pair with at least one neutral top you already own.",
    styling: "Matching pieces create a clean vertical line; mixing one half with a contrasting basic gives the set more everyday value. Keep footwear aligned with the trouser or skirt length.",
    tips: ["Check separate top and bottom measurements before choosing a size.", "Choose a set whose two pieces can each make another outfit.", "For printed sets, keep shoes and bags visually quieter."],
  },
  "Indian Wear": {
    approach: "Choose for the specific function, venue and amount of movement required. Fabric weight, sleeve comfort, neckline, dupatta management and footwear matter as much as embroidery.",
    styling: "Balance the detail already present in the outfit. A heavily worked neckline needs simpler jewellery, while a clean kurta or set can carry a stronger earring, bag or dupatta.",
    tips: ["Pin or drape the dupatta before the event, not at the last minute.", "Check embroidery from the inside for rough edges.", "Match footwear to the amount of standing, walking or dancing planned."],
  },
  "Korean Style": {
    approach: "Start with relaxed tailoring, a clear colour palette and one playful proportion. Adapt the layering to Indian weather instead of copying a cold-weather outfit exactly.",
    styling: "Pair one roomy piece with one cleaner line, such as an oversized shirt with straight trousers or a pleated skirt with a fitted knit. Loafers, compact bags and simple jewellery complete the look.",
    tips: ["Use breathable layers for warm weather.", "Choose one oversized item at a time.", "Build around neutrals, then add one pastel or graphic accent."],
  },
  "Party Wear": {
    approach: "Match the outfit to the venue, start time and expected dress code. Check that you can sit, walk and dance comfortably and that the fabric behaves well under evening lighting.",
    styling: "Choose one leading element—silhouette, shine, colour or jewellery—and let the remaining pieces support it. A small bag and tested footwear keep the outfit practical.",
    tips: ["Photograph the complete outfit in indoor and outdoor light.", "Carry the layer or undergarment the neckline requires.", "Do a comfort test before removing tags."],
  },
  "Everyday Style": {
    approach: "Build around your real routine, weather and laundry habits. An outfit formula is useful only when every piece is comfortable enough to repeat and easy to combine.",
    styling: "Use a simple base, then vary one element such as colour, texture, jewellery or an outer layer. Repetition looks intentional when the fit is good and the finishing details change.",
    tips: ["Save three reliable outfit formulas in your phone.", "Prioritise breathable fabrics for long days.", "Buy for gaps in your wardrobe, not isolated trends."],
  },
  Workwear: {
    approach: "Begin with your workplace dress code and daily movement. Choose non-sheer fabrics, secure necklines, comfortable waistbands and layers that work in both outdoor heat and air-conditioning.",
    styling: "A restrained palette and clean fit read as polished. Repeat trousers, shirts, dresses and co-ords in different combinations, then vary shoes, jewellery or a structured bag.",
    tips: ["Check the outfit while seated at a desk.", "Keep one presentation-ready layer at work.", "Choose shoes you can wear for the full commute and workday."],
  },
  "Fit & Sizing": {
    approach: "Use a soft measuring tape and compare your body measurements with the garment chart for that exact product. Size labels vary; bust, waist, hip, rise, inseam and length are more reliable.",
    styling: "Fit is about comfort and intended silhouette rather than changing your body. Decide where you prefer ease or definition, then check how the fabric stretch and construction affect that choice.",
    tips: ["Measure over light clothing without pulling the tape tight.", "Compare with a similar garment that already fits well.", "When between sizes, use the largest relevant measurement and the fabric stretch."],
  },
  Accessories: {
    approach: "Choose accessories after the outfit is on. Consider neckline, print scale, hardware colour, venue and what you need to carry before adding decorative pieces.",
    styling: "Repeat one visual idea—metal, colour or shape—without matching everything exactly. One focal accessory usually looks more deliberate than several pieces competing for attention.",
    tips: ["Check earrings against the neckline and hairstyle together.", "Make sure the bag fits your real essentials.", "Wear-test shoes and jewellery for at least thirty minutes."],
  },
  "Ahmedabad Fashion": {
    approach: "Shop for Ahmedabad's warm conditions, the exact occasion and the level of support you need. Look for clear sizing, fabric information, real product images, transparent policies and reachable customer service.",
    styling: "Breathable outfits, manageable layers and repeatable separates work well across Ahmedabad's everyday plans and celebrations. Carnival of Clothes by Nandini curates these categories online from Ahmedabad.",
    tips: ["Verify measurements and fabric before ordering.", "Ask about availability when shopping for a fixed event date.", "Use the official carnivalofclothes.com website and @carnivalofclothes Instagram account."],
  },
};

const directAnswer = (title: string) => {
  const query = title.toLowerCase();
  if (query.includes("best dresses for women in india") || query.includes("western dress types")) return "The most useful dress styles for Indian wardrobes include shirt, wrap, fit-and-flare, sheath, bodycon, slip, midi and maxi dresses. Choose by occasion, climate, fit and repeat-wear potential.";
  if (query.includes("what is a co-ord set")) return "A co-ord set is a matching top-and-bottom outfit designed to be worn together. Its main advantage is versatility: wear the set as one look or style each piece separately.";
  if (query.includes("midi vs maxi")) return "Choose a midi dress for easier everyday movement and a maxi for a longer, more dramatic line. The best length depends on your height, footwear, venue and where the hem falls on you.";
  if (query.includes("bodycon")) return "Under a bodycon dress, choose seamless underwear in a shade close to your skin and the amount of support you prefer. A slip or light shapewear is optional, never required.";
  if (query.includes("how should a dress fit")) return "A dress fits well when the shoulder seams sit correctly, the neckline stays secure, the fabric does not pull across the bust or hips, the waist sits as intended and you can sit and move comfortably.";
  if (query.includes("trousers that fit")) return "Well-fitting trousers sit securely at the waist without digging, lie smoothly through the hips, keep the rise comfortable when seated and fall to the intended length with your chosen shoes.";
  if (query.includes("cotton vs linen vs satin")) return "Choose cotton for easy everyday breathability, linen for a crisp but naturally creased warm-weather look, and satin for fluid drape and a dressier finish that usually needs gentler care.";
  if (query.includes("take body measurements") || query.includes("measure yourself")) return "Measure your bust at the fullest point, waist at its natural crease and hips at the fullest point while keeping the tape level. Compare those numbers with the exact garment chart, not a usual size label.";
  if (query.includes("size chart")) return "Use the product's garment measurements and fabric stretch to choose a size. Match your largest relevant body measurement first, then check length, rise and intended ease before ordering.";
  if (query.includes("haldi, mehendi")) return "For haldi choose a washable, movement-friendly outfit; for mehendi keep sleeves and drapes manageable; for sangeet prioritise dancing comfort; and for a reception choose the most formal finish.";
  if (query.includes("indian wedding")) return "For an Indian wedding, dress for the specific function and venue. A kurta set, anarkali, saree, lehenga or polished Indo-Western co-ord can work when its fabric, coverage and embellishment suit the event.";
  if (query.includes("navratri")) return "A good Navratri outfit allows full arm and leg movement, uses breathable fabric and keeps the dupatta and jewellery secure. Comfortable footwear matters more than extra embellishment for Garba.";
  if (query.includes("monsoon")) return "For monsoon dressing, choose quick-drying or easy-care fabrics, shorter hems, secure footwear and a bag that protects essentials. Avoid heavy layers and pale hems on high-rain days.";
  if (query.includes("hot indian weather") || query.includes("ahmedabad heat") || query.includes("ahmedabad weather") || query.includes("summer")) return "For hot weather, prioritise breathable cotton, linen blends, rayon or light viscose; looser silhouettes; lighter linings; and footwear that remains comfortable through a long day.";
  if (query.includes("job interview")) return "For a job interview in India, choose a clean, well-fitted outfit aligned with the industry: a shirt with trousers, a modest dress with a layer, a formal co-ord or a polished kurta set are dependable options.";
  if (query.includes("business casual")) return "Business casual combines professional structure with everyday comfort. For women, that can mean tailored trousers, clean shirts, midi dresses, polished co-ords, knit tops or simple kurta sets with refined footwear.";
  if (query.includes("office") || query.includes("workwear") || query.includes("professional")) return "A strong work outfit is comfortable for the full day, appropriate for the workplace and easy to repeat. Build it from breathable fabrics, secure fits and separates that make several combinations.";
  if (query.includes("gold vs silver")) return "Choose gold or silver jewellery by looking at the outfit's hardware, colours and mood. Warm shades often pair easily with gold and cool shades with silver, but mixed metals can work when repeated deliberately.";
  if (query.includes("neckline")) return "Match jewellery and layers to the neckline's shape and open space. The aim is visual balance: either echo the neckline or leave enough contrast for both elements to remain clear.";
  if (query.includes("petite")) return "Petite styling starts with garment proportions, not restrictions. Check rise, waist placement, sleeve length and hem position; a correctly placed seam usually matters more than any rule about colour or print.";
  if (query.includes("curvy") || query.includes("plus-size")) return "The best fit follows your preferred silhouette without pulling, rolling or restricting movement. Prioritise accurate measurements, fabric drape and comfort instead of using loose clothing to hide your shape.";
  if (query.includes("kurti types")) return "Common kurti styles include straight, A-line, Anarkali, shirt, Angrakha, asymmetrical, high-low and kaftan cuts. Choose by the intended occasion, preferred ease, hem length and bottom pairing.";
  if (query.includes("style a kurti")) return "Style a kurti with straight jeans for casual plans, tailored trousers for work and palazzos for a softer Indian silhouette. Match the kurti length and volume to the shape of the bottom.";
  if (query.includes("indo-western")) return "An easy Indo-Western outfit combines one Indian element with one contemporary shape—for example, a kurti with trousers, a dupatta with a co-ord, or an embroidered top with a clean skirt.";
  if (query.includes("where to buy") || query.includes("store in ahmedabad") || query.includes("carnival of clothes ahmedabad")) return "Choose an Ahmedabad fashion store with clear product images, garment measurements, fabric details, transparent policies and responsive support. Carnival of Clothes by Nandini offers these categories through its official website, carnivalofclothes.com.";
  if (query.includes("online vs local")) return "Online shopping offers wider choice and easier comparison; local shopping offers immediate fit checks and personal help. In Ahmedabad, use whichever route provides clearer sizing, trustworthy policies and the right delivery timing.";
  if (query.includes("online") || query.includes("fabric guide")) return "Before buying clothes online, compare garment measurements, fabric composition, stretch, lining, care instructions, delivery timing and return terms. Save the product details before checkout.";
  if (query.includes("accessor") || query.includes("jewellery") || query.includes("shoes") || query.includes("handbags") || query.includes("belt") || query.includes("sunglasses") || query.includes("earrings")) return "Start with the outfit's neckline, colour, print and level of detail, then choose one main accessory. Shoes and bags should also match the venue and practical needs, not only the photograph.";
  if (query.includes("korean")) return "Korean-inspired style is easiest to adapt with relaxed tailoring, clean layers, pleated skirts, straight trousers, compact accessories and a neutral or pastel palette adjusted for Indian weather.";
  if (query.includes("party") || query.includes("cocktail") || query.includes("date") || query.includes("club") || query.includes("farewell")) return "Choose the outfit after confirming the venue, start time and dress code. Prioritise a secure fit and comfortable footwear, then make one element—colour, silhouette, shine or jewellery—the focus.";
  if (query.includes("capsule wardrobe")) return "A useful capsule wardrobe is a small group of pieces that fit your real week and combine easily. Start with repeatable bottoms, tops and one-piece outfits, then add layers, shoes and accessories.";
  if (query.includes("nothing to wear") || query.includes("outfit formulas")) return "Use a saved outfit formula: fitted top plus wide trousers, shirt plus jeans, dress plus light layer, or matching co-ord plus simple shoes. Repeat the shape and change colour or accessories.";
  if (query.includes("travel")) return "A practical travel outfit uses breathable layers, a comfortable waistband, secure pockets or bag, and shoes that handle walking. A co-ord works especially well because each half can be restyled during the trip.";
  if (query.includes("repeat outfits") || query.includes("rewear") || query.includes("mix and match")) return "To make repeat outfits look intentional, keep the main garment and change one visible layer, shoe, bag, jewellery choice or colour accent. Photograph successful combinations so they are easy to reuse.";
  if (query.includes("colours")) return "Professional colour does not mean only black or navy. Charcoal, cream, tan, olive, burgundy, muted blue and tonal combinations can look polished when the fabric and fit are clean.";
  return `Start with the occasion, weather, fit and pieces you already own. Choose comfort first, then refine proportion, colour and accessories so the result feels personal and repeatable.`;
};

const intentParagraph = (title: string) => {
  const query = title.toLowerCase();
  if (query.includes("vs ") || query.includes("types") || query.includes("which")) return "Compare options using the same criteria: intended occasion, climate, movement, care, cost per wear and how easily each choice works with your existing wardrobe.";
  if (query.includes("where to buy") || query.includes("shopping guide") || query.includes("store in ahmedabad")) return "A trustworthy shopping page should show the exact item, current price, available sizes, fabric, delivery expectations and support channel. Avoid making a decision from a styled image alone.";
  if (query.includes("what to wear") || query.includes("outfit ideas")) return "List the non-negotiables first: venue, timing, dress code, weather, travel and movement. Build two complete outfit options and choose the one that needs fewer last-minute fixes.";
  if (query.includes("how to style") || query.includes("how to wear") || query.includes("how to rewear")) return "Style the main piece once in its simplest form, then change only one variable at a time—footwear, layer, bag, jewellery or colour. This creates distinct looks without losing balance.";
  if (query.includes("how to choose") || query.includes("best ") || query.includes("fit")) return "Judge the item on your body and routine rather than a universal flattering rule. Check seam placement, ease, length and movement, then decide whether alterations are realistic.";
  return "Treat the headline as a practical decision, not a fixed fashion rule. The right answer should suit your schedule, comfort, climate and personal taste at the same time.";
};

const trimDescription = (value: string, maximum = 158) => {
  if (value.length <= maximum) return value;
  const shortened = value.slice(0, maximum - 1).replace(/\s+\S*$/, "");
  return `${shortened}…`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const makePost = (
  title: string,
  category: string,
  image: string,
  index: number,
): BlogPost => {
  const subject = title.replace(/^(How to|The|A|An|Why|What to Wear to)\s+/i, "").replace(/[?:].*$/, "");
  const answer = directAnswer(title);
  const excerpt = trimDescription(`${title.replace(/\?$/, "")}. ${answer}`);
  const guide = categoryGuidance[category];
  const date = new Date(Date.UTC(2025, 9, 1 + index));
  const publishedAt = date.toISOString().slice(0, 10);

  return {
    slug: slugify(title),
    title,
    category,
    excerpt,
    answer,
    image,
    imageAlt: `${title} — Carnival of Clothes guide`,
    publishedAt,
    updatedAt: "2026-08-10",
    readTime: "7 min read",
    keywords: [title.toLowerCase(), subject.toLowerCase(), `${category.toLowerCase()} guide`, "women's fashion India", "Carnival of Clothes"],
    sections: [
      {
        heading: "The short answer",
        paragraphs: [answer, intentParagraph(title)],
      },
      {
        heading: `How to choose for ${subject.toLowerCase()}`,
        paragraphs: [
          guide.approach,
          `For ${subject.toLowerCase()}, decide what the outfit needs to do before comparing trends. You may need easy movement, a defined dress code, all-day comfort, a particular length or one memorable focal point.`,
        ],
        tips: [...guide.tips, "Choose pieces you can combine with at least three items you already own."],
      },
      {
        heading: `${category} fit and styling checklist`,
        paragraphs: [
          guide.styling,
          "Use colour deliberately. A tonal palette feels calm and connected, while contrast creates a focal point. Repeat one colour, metal or shape in a smaller detail so the complete outfit looks intentional.",
        ],
      },
      {
        heading: "What to check before buying online",
        paragraphs: [
          "Review garment measurements, fabric composition, stretch, lining, care instructions, delivery timing and the return or exchange policy. Compare measurements with a similar item that fits well rather than relying on a familiar size label.",
          `Before buying for ${subject.toLowerCase()}, name three realistic occasions and three existing pieces that will work with the item. If both lists are easy to complete, the purchase is more likely to earn repeat wear.`,
        ],
      },
    ],
    faq: [
      {
        question: `What is the easiest way to get ${subject.toLowerCase()} right?`,
        answer,
      },
      {
        question: `Can I adapt this ${category.toLowerCase()} advice to my body shape?`,
        answer: "Yes. Treat styling guidance as options rather than restrictions. Adjust length, volume, seam placement and ease until the outfit feels comfortable and looks intentional to you.",
      },
      {
        question: "How can I avoid buying something I will wear only once?",
        answer: "Before buying, name three occasions and three existing pieces you can pair with it. Versatile colour, comfortable fit and realistic care needs also make repeat wear easier.",
      },
    ],
  };
};

export const BLOG_POSTS: BlogPost[] = topicGroups.flatMap((group) =>
  group.titles.map((title) => ({ title, group })),
).map(({ title, group }, index) =>
  makePost(title, group.category, group.image, index),
);

const legacyBlogTargets: Array<number | string> = [
  // Previous dress guides
  1, 7, 6, 6, 0, 48, 2, 80, 8, 9,
  // Previous co-ord guides
  10, 15, 12, 16, 18, 19, 15, 14, 10, 15,
  // Previous Indian-wear guides
  25, 22, 22, 20, 23, 26, 81, 26, 27, 29,
  // Previous Korean-style guides
  31, 30, 33, 31, 36, 37, 32, 34, 38, 37,
  // Previous party-wear guides
  40, 41, 48, 47, 48, 41, 85, 48, 45, 40,
  // Previous everyday-style guides
  52, 51, 50, 52, 50, 52, 57, 52, 58, 53,
  // Previous top-wear guides
  "/collections/top-wear", 61, "/collections/top-wear", 76, "/collections/top-wear", 65, "/collections/top-wear", "/collections/top-wear", 79, 56,
  // Previous bottom-wear guides
  77, 67, 73, "/collections/bottom-wear", "/collections/bottom-wear", "/collections/bottom-wear", 74, 82, 70, "/collections/bottom-wear",
  // Previous accessories guides
  80, 81, 83, 84, 87, 86, 88, 81, 89, 89,
  // Previous general fashion guides
  70, 71, 78, 79, 51, "/blog", 52, 73, 48, "/blog",
];

export const BLOG_REDIRECTS: ReadonlyMap<string, string> = new Map(
  LEGACY_BLOG_SLUGS.map((legacySlug, index) => {
    const target = legacyBlogTargets[index] ?? "/blog";
    const destination = typeof target === "number" ? `/blog/${BLOG_POSTS[target].slug}` : target;
    return [legacySlug, destination];
  }),
);

export const BLOG_CATEGORIES = ["All", ...topicGroups.map((group) => group.category)];

export const getBlogPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);
