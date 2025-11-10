export const COPY = {
  triad: {
    self: {
      title: 'Your answer',
      help: 'Say how you would answer this question.'
    },
    acceptable: {
      title: 'Acceptable Answers from a Partner',
      help: 'Which answers, from a partner, would you still be okay with? Pick a range—not just your exact answer.',
      tip: 'Tip: If it isn\'t a dealbreaker, you should pick it.'
    },
    importance: {
      title: 'How much should this matter?',
      help: 'How much should alignment on this question affect your match score? (Low = nice to match on; High = dealbreaker.)'
    }
  },
  sections: {
    pvq21: {
      title: 'Core Values (PVQ‑21)',
      intro: 'Each sentence describes a person. How much does it sound like you? (Very much like me → Not like me at all.) Then choose what would be okay from a partner, and how much this should matter for your match.'
    },
    tipi: {
      title: 'Big Five (TIPI)',
      intro: 'For each trait, pick how much it sounds like you. You should rate theextent to which the pair of traits applies to youThen choose what would be okay from a partner, and how much it should matter for your match.'
    },
    mc_single: {
      title: 'Single choice',
      intro: 'Pick your answer. Then choose any partner answers you’d be okay with.'
    },
    mc_multi: {
      title: 'Select all that apply',
      intro: 'Select all that fit you. Then pick any partner choices you’d be okay with. It’s fine if theirs aren’t identical—choose what you’d genuinely accept.'
    },
    default: {
      title: 'Question guidance',
      intro: 'Answer for yourself first. Then pick what would be okay from a partner and how much that should weigh in the match score.'
    }
  }
} as const

export type CopyDefinition = typeof COPY
