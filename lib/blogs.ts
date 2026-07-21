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
  focus: string;
  titles: string[];
}> = [
  {
    category: "Dresses",
    image: "/party-wear-red-dress.png",
    focus: "choosing and styling dresses for a flattering, occasion-ready wardrobe",
    titles: [
      "How to Choose the Perfect Dress for Your Body Shape",
      "10 Dress Styles Every Woman Should Know",
      "What to Wear to a Day Wedding: A Complete Dress Guide",
      "How to Style a Maxi Dress from Day to Night",
      "The Best Dress Colours for Every Indian Skin Tone",
      "How to Choose a Party Dress That Feels Comfortable",
      "Mini, Midi or Maxi: Which Dress Length Is Right for You?",
      "How to Accessorise a Statement Dress Without Overdoing It",
      "A Practical Guide to Buying Dresses Online",
      "How to Rewear One Dress for Five Different Occasions",
    ],
  },
  {
    category: "Co-ord Sets",
    image: "/coord-set.jpg",
    focus: "building polished outfits with versatile matching separates",
    titles: [
      "Why Co-ord Sets Are the Easiest Way to Look Put Together",
      "How to Style a Co-ord Set in Five Different Ways",
      "Co-ord Sets for Work: A Modern Office Styling Guide",
      "How to Choose the Right Co-ord Set for Your Body Type",
      "Blazer Co-ords: From Brunch to Evening Plans",
      "The Best Shoes to Wear with Co-ord Sets",
      "How to Mix and Match Co-ord Separates",
      "Co-ord Sets for Travel: Comfortable and Camera Ready",
      "How to Layer a Co-ord Set in Every Season",
      "Printed or Solid Co-ords: How to Choose Your Best Match",
    ],
  },
  {
    category: "Indian Wear",
    image: "/indian-suits.png",
    focus: "wearing Indian silhouettes with comfort, balance and modern personal style",
    titles: [
      "How to Choose a Kurti for Your Body Shape",
      "Kurti Styling Ideas for College, Work and Festive Days",
      "How to Style an Anarkali Suit Without Heavy Accessories",
      "A Simple Guide to Choosing the Right Dupatta",
      "Indian Wear Colours That Photograph Beautifully",
      "How to Build a Small but Versatile Indian Wear Wardrobe",
      "What Jewellery to Wear with Different Necklines",
      "How to Make a Kurta Set Look More Contemporary",
      "Festive Dressing Made Easy: Outfit Planning Checklist",
      "How to Care for Embroidered and Delicate Indian Wear",
    ],
  },
  {
    category: "Korean Style",
    image: "/korean-streetwear.jpg",
    focus: "adapting clean Korean-inspired silhouettes to an everyday wardrobe",
    titles: [
      "How to Build a Korean-Inspired Wardrobe",
      "Korean Outfit Ideas You Can Wear in India",
      "How to Style an Oversized Shirt the Korean Way",
      "The Korean Capsule Wardrobe: 12 Useful Pieces",
      "How to Wear Pleated Skirts Without Looking Too Formal",
      "Neutral Korean Style Outfits for Everyday Wear",
      "How to Layer Korean-Inspired Outfits in Warm Weather",
      "Korean Workwear Ideas That Still Feel Professional",
      "The Best Accessories for a Minimal Korean Look",
      "How to Combine Pastels in a Korean-Inspired Outfit",
    ],
  },
  {
    category: "Party Wear",
    image: "/cocktail-dress.png",
    focus: "creating confident party outfits suited to the venue and dress code",
    titles: [
      "What to Wear to a Cocktail Party: A Simple Guide",
      "Party Outfit Ideas for Every Kind of Celebration",
      "How to Dress for a Party Without Sacrificing Comfort",
      "Day Party vs Night Party: How Your Outfit Should Change",
      "How to Choose Party Wear You Will Actually Rewear",
      "Last-Minute Party Styling: Five Fast Outfit Upgrades",
      "How to Balance Sequins, Shine and Statement Accessories",
      "The Best Party Wear Colours Beyond Black",
      "House Party Outfit Ideas That Feel Effortless",
      "How to Plan a Complete Party Look from Dress to Shoes",
    ],
  },
  {
    category: "Everyday Style",
    image: "/minimalist-cotton-dress.jpg",
    focus: "making daily outfits practical, repeatable and expressive",
    titles: [
      "How to Look Polished Every Day Without Overthinking It",
      "The Everyday Capsule Wardrobe: A Beginner's Guide",
      "Seven Easy Outfit Formulas for Busy Mornings",
      "How to Make Simple Outfits Look More Expensive",
      "What to Wear When You Have Nothing to Wear",
      "How to Find Your Personal Style in Five Steps",
      "A Realistic Guide to Repeating Outfits with Confidence",
      "How to Use Colour to Refresh Your Everyday Wardrobe",
      "Comfortable Outfits That Still Look Put Together",
      "How to Take an Outfit from Basic to Beautiful",
    ],
  },
  {
    category: "Top Wear",
    image: "/top-wear-pink-floral.png",
    focus: "pairing tops with proportion, colour and useful layers",
    titles: [
      "How to Choose the Right Top for Every Bottom",
      "The Most Versatile Tops for a Capsule Wardrobe",
      "How to Style a Crop Top for Different Occasions",
      "A Guide to Necklines and What Flatters You",
      "How to Wear an Oversized T-shirt and Still Look Polished",
      "Shirt Styling Ideas Beyond the Office",
      "How to Layer Tops Without Adding Bulk",
      "The Best Top Colours to Pair with Denim",
      "How to Choose Tops When Shopping Online",
      "Five Ways to Style One Classic White Shirt",
    ],
  },
  {
    category: "Bottom Wear",
    image: "/wide-leg-trousers.png",
    focus: "choosing comfortable bottoms and balancing their proportions",
    titles: [
      "How to Find Trousers That Fit Properly",
      "Wide-Leg Trousers: A Complete Styling Guide",
      "How to Choose Jeans for Your Body Shape",
      "What Tops Look Best with Different Skirt Lengths",
      "How to Style Cargo Pants for a Modern Look",
      "Palazzo Pants for Work, Travel and Celebrations",
      "How to Balance Proportions with Baggy Jeans",
      "The Best Shoes for Wide-Leg and Flared Bottoms",
      "How to Measure Yourself for Bottom Wear Online",
      "Five Bottom-Wear Staples That Create More Outfits",
    ],
  },
  {
    category: "Accessories",
    image: "/accessories-gold-jewelry.jpg",
    focus: "using accessories to finish an outfit without overwhelming it",
    titles: [
      "How to Accessorise Any Outfit: The Complete Guide",
      "How to Choose Jewellery for Your Outfit Neckline",
      "The Essential Handbags for a Versatile Wardrobe",
      "How to Mix Gold and Silver Jewellery Confidently",
      "Sunglasses for Every Face Shape: A Practical Guide",
      "How to Choose a Belt and Wear It Well",
      "Minimal vs Statement Accessories: Finding the Balance",
      "How to Build an Everyday Jewellery Collection",
      "Accessory Mistakes That Can Distract from an Outfit",
      "How to Transform a Repeat Outfit with Accessories",
    ],
  },
  {
    category: "Fashion Guides",
    image: "/collection.jpg",
    focus: "shopping thoughtfully and caring for clothes so they last longer",
    titles: [
      "How to Take Accurate Body Measurements at Home",
      "The Complete Guide to Women's Clothing Sizes",
      "How to Read Fabric Details Before Buying Clothes Online",
      "A Smart Checklist for Shopping for Clothes Online",
      "How to Build a Wardrobe You Actually Wear",
      "How to Care for Your Clothes and Make Them Last",
      "How to Choose Colours That Work Well Together",
      "A Beginner's Guide to Outfit Proportions",
      "How to Shop for an Occasion Without Panic Buying",
      "Fashion Terms Explained: A Simple Style Glossary",
    ],
  },
];

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
  focus: string,
  index: number,
): BlogPost => {
  const subject = title.replace(/^(How to|The|A|An|Why|What to Wear to)\s+/i, "").replace(/[?:].*$/, "");
  const answer = `${title.replace(/[?:].*$/, "")} starts with understanding your occasion, preferred fit and the pieces you already own. Prioritise comfort and proportion, then use colour, layers and accessories to make the look feel personal.`;
  const excerpt = `A practical Carnival of Clothes guide to ${focus}, with simple outfit ideas and shopping advice you can use immediately.`;
  const date = new Date(Date.UTC(2025, 0, 15 + index));
  const publishedAt = date.toISOString().slice(0, 10);

  return {
    slug: slugify(title),
    title,
    category,
    excerpt,
    answer,
    image,
    imageAlt: `${category} styling guide from Carnival of Clothes`,
    publishedAt,
    updatedAt: "2026-07-21",
    readTime: "6 min read",
    keywords: [subject.toLowerCase(), `${category.toLowerCase()} guide`, "women's fashion India", "Carnival of Clothes"],
    sections: [
      {
        heading: "The short answer",
        paragraphs: [answer, `There is no single rule that works for everyone. The strongest choice is one that suits your plans, lets you move comfortably and works with your real wardrobe.`],
      },
      {
        heading: `How to approach ${subject.toLowerCase()}`,
        paragraphs: [
          `Begin with the setting: note the time, venue, expected weather and dress code. These details narrow your options before trends or impulse purchases enter the decision.`,
          `Next, decide what you want the outfit to do. You may want a longer line, a defined waist, easy movement or one memorable focal point. Choose one priority and let the other pieces support it.`,
        ],
        tips: [
          "Check fit while sitting, walking and raising your arms.",
          "Keep one clear focal point instead of making every element compete.",
          "Try the complete outfit with shoes and accessories before the occasion.",
          "Choose pieces you can combine with at least three items you already own.",
        ],
      },
      {
        heading: "Colour, proportion and finishing touches",
        paragraphs: [
          `Use colour deliberately. A tonal palette creates a calm, lengthened look; contrast creates energy and draws attention. Repeat one colour in a smaller detail to make the outfit feel connected.`,
          `Balance volume rather than hiding your shape. Pair a relaxed piece with a cleaner line, or define one point such as the waist, shoulder or ankle. Finish with accessories that match the mood rather than simply adding more detail.`,
        ],
      },
      {
        heading: "What to check before you buy",
        paragraphs: [
          `Review the garment measurements, fabric composition, care instructions and return policy. Compare measurements with a similar item that fits you well rather than relying only on a familiar size label.`,
          `Finally, imagine three genuine occasions and three existing wardrobe pairings for the piece. If both are easy to name, it is more likely to become a useful part of your wardrobe.`,
        ],
      },
    ],
    faq: [
      {
        question: `What is the easiest way to get ${subject.toLowerCase()} right?`,
        answer: "Start with fit and comfort, choose one focal point, and keep the remaining elements simple and balanced.",
      },
      {
        question: `Can I adapt this ${category.toLowerCase()} advice to my body shape?`,
        answer: "Yes. Use the principles as options rather than restrictions: highlight the features you enjoy and adjust length, volume and waist placement until you feel comfortable.",
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
  makePost(title, group.category, group.image, group.focus, index),
);

export const BLOG_CATEGORIES = ["All", ...topicGroups.map((group) => group.category)];

export const getBlogPost = (slug: string) =>
  BLOG_POSTS.find((post) => post.slug === slug);
