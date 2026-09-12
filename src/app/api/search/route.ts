import { NextRequest, NextResponse } from "next/server";
import { MediaSearchResult, InternetSummary } from "@/types/media";

// Featured curated list
const FEATURED_MEDIA: MediaSearchResult[] = [
  {
    id: "csm-featured",
    title: "Chainsaw Man",
    japaneseTitle: "チェンソーマン",
    type: "anime",
    year: 2022,
    score: 8.6,
    ratingRank: "#1 Trending",
    posterUrl: "https://media.kitsu.app/anime/poster_images/43806/medium.jpg",
    genres: ["Action", "Supernatural", "Dark Fantasy"],
    synopsis:
      "Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while harvesting devil corpses with Pochita. When betrayed and killed, Pochita fuses with him, making him Chainsaw Man.",
    trailerUrl: "https://www.youtube.com/embed/dFlDRhvM4b0?autoplay=1",
    watchUrl: "https://www.youtube.com/watch?v=dFlDRhvM4b0",
    episodes: 12,
    status: "Completed",
    source: "featured",
    internetSummary: {
      headline: "Chainsaw Man (チェンソーマン)",
      sourceName: "Internet Knowledge Graph",
      sourceUrl: "https://en.wikipedia.org/wiki/Chainsaw_Man",
      description: "Japanese manga and anime series written and illustrated by Tatsuki Fujimoto",
      extract:
        "Chainsaw Man follows the story of Denji, an impoverished young man who makes a contract that fuses his body with that of a dog-like devil named Pochita, granting him the ability to transform parts of his body into chainsaws. Denji eventually joins the Public Safety Devil Hunters, a government agency dedicated to fighting against devils whenever they become a threat to the world.",
      keyFacts: [
        { label: "Creator", value: "Tatsuki Fujimoto" },
        { label: "Studio", value: "MAPPA" },
        { label: "Episodes", value: "12 (Season 1)" },
        { label: "Status", value: "Reze Arc Film Announced" },
      ],
    },
  },
  {
    id: "jujutsu-featured",
    title: "Jujutsu Kaisen",
    japaneseTitle: "呪術廻戦",
    type: "anime",
    year: 2020,
    score: 8.7,
    ratingRank: "Top Rated",
    posterUrl: "https://media.kitsu.app/anime/poster_images/42765/medium.jpg",
    genres: ["Action", "Fantasy", "Supernatural"],
    synopsis:
      "Yuji Itadori, a high schooler who possesses exceptional physical strength, swallows a cursed talisman—the finger of Ryomen Sukuna—and becomes cursed himself. He enters Tokyo Prefectural Jujutsu High School to combat curses.",
    trailerUrl: "https://www.youtube.com/embed/4A_X-Dvl0ws?autoplay=1",
    watchUrl: "https://www.youtube.com/watch?v=4A_X-Dvl0ws",
    episodes: 47,
    status: "Completed",
    source: "featured",
    internetSummary: {
      headline: "Jujutsu Kaisen (呪術廻戦)",
      sourceName: "Internet Knowledge Graph",
      sourceUrl: "https://en.wikipedia.org/wiki/Jujutsu_Kaisen",
      description: "Manga and anime series written and illustrated by Gege Akutami",
      extract:
        "The story follows high school student Yuji Itadori as he joins a secret organization of Jujutsu Sorcerers in order to eliminate a powerful Curse named Ryomen Sukuna, of whom Yuji becomes the host.",
      keyFacts: [
        { label: "Creator", value: "Gege Akutami" },
        { label: "Studio", value: "MAPPA" },
        { label: "Main Character", value: "Yuji Itadori & Satoru Gojo" },
      ],
    },
  },
  {
    id: "stranger-things-featured",
    title: "Stranger Things",
    type: "show",
    year: 2016,
    score: 8.7,
    posterUrl: "https://static.tvmaze.com/uploads/images/medium_portrait/396/991288.jpg",
    genres: ["Drama", "Fantasy", "Horror"],
    synopsis:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl with telekinetic powers.",
    trailerUrl: "https://www.youtube.com/embed/b9EkMc79ZSU?autoplay=1",
    watchUrl: "https://www.youtube.com/watch?v=b9EkMc79ZSU",
    episodes: 34,
    status: "Running",
    source: "featured",
    internetSummary: {
      headline: "Stranger Things",
      sourceName: "Internet Knowledge Graph",
      sourceUrl: "https://en.wikipedia.org/wiki/Stranger_Things",
      description: "American science fiction television series created by the Duffer Brothers",
      extract:
        "Set in the fictional rural town of Hawkins, Indiana, during the 1980s, the nearby Hawkins National Laboratory ostensibly performs scientific research for the United States Department of Energy, but secretly does experiments into the paranormal and supernatural, including those that involve human test subjects.",
      keyFacts: [
        { label: "Creators", value: "The Duffer Brothers" },
        { label: "Network", value: "Netflix" },
        { label: "Seasons", value: "4 Seasons (Season 5 in production)" },
      ],
    },
  },
  {
    id: "interstellar-featured",
    title: "Interstellar",
    type: "movie",
    year: 2014,
    score: 8.7,
    posterUrl: "https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    synopsis:
      "In Earth's future, a global crop blight and second Dust Bowl are slowly rendering the planet uninhabitable. Professor Brand, a brilliant NASA physicist, is working on plans to save mankind by transporting Earth's population to a new home via a wormhole.",
    trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E?autoplay=1",
    watchUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    status: "Released",
    source: "featured",
    internetSummary: {
      headline: "Interstellar (2014 Film)",
      sourceName: "Internet Knowledge Graph",
      sourceUrl: "https://en.wikipedia.org/wiki/Interstellar_(film)",
      description: "Epic science fiction film directed by Christopher Nolan",
      extract:
        "Set in a dystopian future where humanity is embroiled by catastrophic blight and famine, the film follows a group of astronauts who travel through a wormhole near Saturn in search of a new home for mankind.",
      keyFacts: [
        { label: "Director", value: "Christopher Nolan" },
        { label: "Music", value: "Hans Zimmer" },
        { label: "Cast", value: "Matthew McConaughey, Anne Hathaway, Jessica Chastain" },
      ],
    },
  },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

// Fetch Wikipedia summary
async function fetchWikipediaSummary(query: string): Promise<InternetSummary | null> {
  try {
    // 1. Search Wikipedia page title
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
        query
      )}&limit=1&namespace=0&format=json`,
      { next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const resolvedTitle = searchData[1]?.[0];
    const resolvedUrl = searchData[3]?.[0];

    if (!resolvedTitle) return null;

    // 2. Fetch page summary REST API
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(resolvedTitle)}`,
      { next: { revalidate: 86400 } }
    );
    if (!summaryRes.ok) return null;
    const data = await summaryRes.json();

    if (!data.extract) return null;

    return {
      headline: data.title || resolvedTitle,
      sourceName: "Wikipedia & Internet Knowledge",
      sourceUrl: resolvedUrl || data.content_urls?.desktop?.page || "https://en.wikipedia.org",
      description: data.description || "Internet encyclopedia overview",
      extract: data.extract,
      thumbnail: data.thumbnail?.source,
      keyFacts: [
        { label: "Source", value: "Wikipedia Knowledge Graph" },
        { label: "Topic", value: data.description || "Entertainment" },
      ],
    };
  } catch (err) {
    console.warn("Wikipedia summary fetch error:", err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";
  const filterType = searchParams.get("type") || "all";

  if (!query) {
    const filtered =
      filterType === "all"
        ? FEATURED_MEDIA
        : FEATURED_MEDIA.filter((m) =>
            filterType === "anime" ? m.type === "anime" : m.type !== "anime"
          );
    return NextResponse.json({
      summary: FEATURED_MEDIA[0].internetSummary,
      results: filtered,
    });
  }

  const results: MediaSearchResult[] = [];
  let internetSummary: InternetSummary | null = null;

  // 1. Fetch Wikipedia Internet Summary
  const wikiPromise = fetchWikipediaSummary(query).then((summary) => {
    if (summary) internetSummary = summary;
  });

  // 2. Search Kitsu for Anime
  const fetchAnime = async () => {
    if (filterType === "show") return;
    try {
      const res = await fetch(
        `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=6`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return;
      const data = await res.json();

      // eslint-disable-next-line
      data.data?.forEach((item: any) => {
        const attrs = item.attributes || {};
        const youtubeId = attrs.youtubeVideoId;
        const poster =
          attrs.posterImage?.medium ||
          attrs.posterImage?.original ||
          attrs.posterImage?.small ||
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300";

        results.push({
          id: `kitsu-${item.id}`,
          title: attrs.canonicalTitle || attrs.titles?.en || attrs.titles?.en_jp || "Unknown Anime",
          japaneseTitle: attrs.titles?.ja_jp,
          type: "anime",
          year: attrs.startDate ? attrs.startDate.slice(0, 4) : undefined,
          score: attrs.averageRating ? (parseFloat(attrs.averageRating) / 10).toFixed(1) : undefined,
          posterUrl: poster,
          genres: attrs.subtype ? [attrs.subtype.toUpperCase(), "Anime"] : ["Anime"],
          synopsis: attrs.synopsis || "No synopsis available.",
          trailerUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1` : undefined,
          watchUrl: youtubeId
            ? `https://www.youtube.com/watch?v=${youtubeId}`
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                attrs.canonicalTitle + " episode 1"
              )}`,
          episodes: attrs.episodeCount || undefined,
          status: attrs.status,
          source: "kitsu",
        });
      });
    } catch (e) {
      console.warn("Kitsu fetch failed:", e);
    }
  };

  // 3. Search TVMaze for Shows & Movies
  const fetchShows = async () => {
    if (filterType === "anime") return;
    try {
      const res = await fetch(
        `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return;
      // eslint-disable-next-line
      const data = (await res.json()) as any[];

      data.slice(0, 6).forEach((item) => {
        const show = item.show || {};
        const poster =
          show.image?.medium ||
          show.image?.original ||
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300";

        results.push({
          id: `tvmaze-${show.id}`,
          title: show.name || "Unknown Show",
          type: show.type === "Animation" ? "anime" : "show",
          year: show.premiered ? show.premiered.slice(0, 4) : undefined,
          score: show.rating?.average ? show.rating.average.toFixed(1) : undefined,
          posterUrl: poster,
          genres: show.genres || ["Drama"],
          synopsis: show.summary ? stripHtml(show.summary) : "No synopsis provided.",
          trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            show.name + " trailer"
          )}`,
          watchUrl:
            show.officialSite ||
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              show.name + " full episode"
            )}`,
          status: show.status,
          source: "tvmaze",
        });
      });
    } catch (e) {
      console.warn("TVMaze fetch failed:", e);
    }
  };

  await Promise.allSettled([wikiPromise, fetchAnime(), fetchShows()]);

  // Fallback to local featured if empty
  if (results.length === 0) {
    const qLower = query.toLowerCase();
    const fallback = FEATURED_MEDIA.filter(
      (m) =>
        m.title.toLowerCase().includes(qLower) ||
        m.genres.some((g) => g.toLowerCase().includes(qLower)) ||
        m.synopsis.toLowerCase().includes(qLower)
    );
    return NextResponse.json({
      summary: fallback[0]?.internetSummary || internetSummary,
      results: fallback,
    });
  }

  // If internetSummary wasn't found from Wikipedia, synthesize one from the best result!
  if (!internetSummary && results.length > 0) {
    const top = results[0];
    internetSummary = {
      headline: top.title,
      sourceName: "Internet & Anime Database",
      sourceUrl: top.watchUrl || "https://google.com",
      description: `${top.type.toUpperCase()} • ${top.year || "Popular Release"} • ${top.genres.join(", ")}`,
      extract: top.synopsis,
      thumbnail: top.posterUrl,
      keyFacts: [
        { label: "Rating", value: top.score ? `⭐ ${top.score}/10` : "Highly Rated" },
        { label: "Type", value: top.type.toUpperCase() },
        { label: "Episodes", value: top.episodes ? `${top.episodes} Episodes` : "Feature Length" },
      ],
    };
  }

  return NextResponse.json({
    summary: internetSummary,
    results,
  });
}
