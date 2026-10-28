// src/lib/emoji.ts
// Robust Unicode grapheme-aware emoji detection utility

export interface EmojiOnlyInfo {
  isEmojiOnly: boolean;
  count: number;
}

// Regex matching valid standalone emoji grapheme cluster sequences:
// - \p{Extended_Pictographic}: base pictographic emoji
// - \p{Regional_Indicator}{2}: 2-letter national flags (e.g. 🇯🇵, 🇺🇸)
// - [0-9#*]\uFE0F?\u20E3: keycap emojis (e.g. 1️⃣, #️⃣)
// Followed by optional variation selectors (\uFE0F, \uFE0E), skin-tone modifiers (\p{Emoji_Modifier}),
// and zero-width-joiner (\u200D) sequences for multi-person/composite emojis (e.g. ❤️‍🔥, 👨‍👩‍👧‍👦).
const EMOJI_SEQUENCE_PATTERN =
  "^(?:\\s*(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3)(?:\\uFE0F|\\uFE0E|\\p{Emoji_Modifier}|\\u200D(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3))*\\s*)+$";

const EMOJI_CLUSTER_PATTERN =
  "(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3)(?:\\uFE0F|\\uFE0E|\\p{Emoji_Modifier}|\\u200D(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2}|[0-9#*]\\uFE0F?\\u20E3))*";

let emojiSequenceRegex: RegExp | null = null;
let emojiClusterRegex: RegExp | null = null;

function getEmojiSequenceRegex(): RegExp {
  if (!emojiSequenceRegex) {
    emojiSequenceRegex = new RegExp(EMOJI_SEQUENCE_PATTERN, "u");
  }
  return emojiSequenceRegex;
}

function getEmojiClusterRegex(): RegExp {
  if (!emojiClusterRegex) {
    emojiClusterRegex = new RegExp(EMOJI_CLUSTER_PATTERN, "gu");
  }
  return emojiClusterRegex;
}

/**
 * Checks if a message string consists exclusively of 1 to 6 emoji grapheme clusters.
 * Returns { isEmojiOnly: boolean, count: number }.
 */
export function getEmojiOnlyInfo(text: string): EmojiOnlyInfo {
  if (!text || typeof text !== "string") {
    return { isEmojiOnly: false, count: 0 };
  }

  const trimmed = text.trim();
  // If empty or contains spoiler markers, it is not a standalone emoji message
  if (!trimmed || trimmed.includes("||")) {
    return { isEmojiOnly: false, count: 0 };
  }

  // Fast rejection if text contains non-emoji characters
  try {
    const seqRegex = getEmojiSequenceRegex();
    if (!seqRegex.test(trimmed)) {
      return { isEmojiOnly: false, count: 0 };
    }
  } catch {
    // If environment lacks Unicode property escapes support
    return { isEmojiOnly: false, count: 0 };
  }

  // Count distinct emoji grapheme clusters
  let count = 0;
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const segments = Array.from(segmenter.segment(trimmed)).filter(
        (s) => s.segment.trim().length > 0
      );
      count = segments.length;
    } catch {
      const matches = trimmed.match(getEmojiClusterRegex());
      count = matches ? matches.length : 1;
    }
  } else {
    try {
      const matches = trimmed.match(getEmojiClusterRegex());
      count = matches ? matches.length : 1;
    } catch {
      count = 1;
    }
  }

  // Up to 6 emojis render as standalone unboxed emojis
  if (count >= 1 && count <= 6) {
    return { isEmojiOnly: true, count };
  }

  return { isEmojiOnly: false, count };
}
