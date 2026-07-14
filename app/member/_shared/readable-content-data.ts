/**
 * Chapter-level body content for a readable Resource. Chapters (not raw
 * pages) are the atomic unit here — a scroll's existing `pages: number`
 * field on `Resource` is a physical page *count* used for display only
 * (see resources-data.ts), never a content array; chapters give reading
 * progress a natural, stable unit to track against without inventing a
 * second, disconnected page-numbering scheme.
 */
export interface Chapter {
  id: string
  title: string
  body: string
}

export interface ReadableContent {
  /** Matches Resource.id from resources-data.ts. */
  resourceId: string
  chapters: Chapter[]
}

/**
 * Seeded for 4 resources spanning 4 different KCS pillars (Foundation,
 * Wisdom, Gospel, Revelation) — enough variety to exercise the reader
 * across distinct tones/lengths without seeding all 16 resources up
 * front. Prose is original placeholder writing in the Kingdom Library's
 * voice, not lorem ipsum — every other seed description in this app is
 * real prose, and reader-view screenshots would look broken with
 * filler Latin text sitting where real chapter body text belongs.
 */
export const initialReadableContent: Record<string, ReadableContent> = {
  '1': {
    resourceId: '1',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1 — In the Beginning',
        body: `In the beginning, the Kingdom was spoken into being. Before there was a throne to sit upon or a people to govern, there was the Word, and the Word brought order out of formlessness.

Light was called forth first, not because darkness was evil, but because a Kingdom cannot be seen, named, or entered without light to reveal its shape. Every boundary that followed — sky from sea, land from water, day from night — was drawn the same way: not by force, but by declaration.

On the sixth day, the Kingdom received its first citizens, made not as servants but as image-bearers — carrying the pattern of the throne itself into a garden meant to be tended, not merely occupied. Dominion was given here, not seized later. This is the first lesson of the Foundation pillar: authority in the Kingdom is granted before it is exercised.`,
      },
      {
        id: 'ch-2',
        title: 'Chapter 2 — The Garden and the Charge',
        body: `A garden was planted eastward, and within it grew every tree pleasant to the eye and good for food, along with two trees set apart by name — one of life, one of the knowledge of good and evil. The citizen was placed there not to wander idly, but to work and to keep it, the Kingdom's pattern of labor woven into paradise itself before any curse existed to make labor feel like punishment.

A single boundary was drawn: eat freely from every tree but one. This is the second lesson of the Foundation pillar — a Kingdom of abundant freedom still has a throne, and a throne still draws a line. Freedom without any boundary is not the Kingdom's design; it is formlessness wearing the Kingdom's clothing.

From the citizen's own side, a helper was formed — bone of bone, flesh of flesh — and the two were called one. Marriage, then, is not a later invention layered onto the Kingdom; it is foundational architecture, present before the fall, present before the first commandment was ever broken.`,
      },
      {
        id: 'ch-3',
        title: 'Chapter 3 — The Boundary Broken',
        body: `The serpent's question was small, almost reasonable: did the throne really say every tree? It is always this way — rebellion rarely announces itself as rebellion. It arrives first as a question about whether the boundary was ever really there, or ever really meant what it said.

The fruit was taken, shared, and eaten, and in that single act the Kingdom's citizens traded dominion for hiding. Where they had once walked freely in the garden's cool of the day, they now covered themselves and fled the sound of the throne approaching — the first evidence that sin's primary damage is not guilt alone, but distance.

Yet even in judgment, a promise was folded into the curse: a future seed would come to crush the serpent's head. The Foundation pillar closes its opening lesson here — not with the fall as the final word, but with covenant already forming in the wreckage, the pattern that will carry through every scroll that follows.`,
      },
    ],
  },
  '7': {
    resourceId: '7',
    chapters: [
      {
        id: 'ch-1',
        title: 'Psalm of Ascent — The Shepherd King',
        body: `The Lord is a shepherd, and where a shepherd leads, want cannot follow. Green pastures are not accidents of geography; they are provision that arrived before the need was even spoken. Still waters are not the absence of a current, but a shepherd's deliberate choice of where his flock may safely drink.

Even the valley of deep shadow does not go unaccompanied. A rod for correction, a staff for support — both carried by the same hand, both proof that comfort and discipline are not opposites in the Kingdom, but companions. Fear loses its grip not because the valley disappears, but because the Shepherd does not.

A table is prepared in full view of every enemy who doubted it would ever be set. The cup runs over — not filled to the brim and stopped there, but overflowing, because the Kingdom's provision was never designed to be measured out sparingly. Goodness and mercy do not merely visit; they follow, every day, all the way home.`,
      },
      {
        id: 'ch-2',
        title: 'A Song of Trust in the Storm',
        body: `When the earth gives way and the mountains are carried into the heart of the sea, there remains a river whose streams make glad the city of the Kingdom. Water in that image is not chaos; it is the quiet, sure provision flowing through the one place that will not be moved, however loudly everything else roars.

Nations rage, kingdoms totter, but a single voice is enough to melt what seemed unshakeable. "Be still, and know" is not a suggestion offered gently to the anxious — it is a command given to a world convinced that its own noise is what holds it together.

The refrain returns twice, unhurried: the Kingdom's God is with us; the Kingdom's God is our refuge. Repetition here is not decoration. It is how a worshiping people rehearse the truth loudly enough to out-shout their own fear.`,
      },
      {
        id: 'ch-3',
        title: 'A Confession and a Restoration',
        body: `Mercy is asked for first, before any defense is offered — because a citizen who has genuinely broken covenant does not open with an explanation. He opens with an appeal to the character of the throne he has wronged, trusting steadfast love more than his own case.

The confession does not minimize: sin is ever before him, done against the throne alone in the deepest sense, even when the wound was inflicted on another citizen. This is the Wisdom pillar's sharper edge — sin's first casualty is always the relationship with the King, whatever else it also breaks.

Yet the psalm does not end in the ash of confession. A clean heart is asked for, a right spirit renewed, the joy of salvation restored — not earned back by penance, but requested as a gift only the throne can give. Wisdom does not merely diagnose sin; it points, every time, back toward restoration.`,
      },
    ],
  },
  '11': {
    resourceId: '11',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1 — The Lineage of the King',
        body: `A genealogy opens the Gospel of the King, and it is not filler before the real story begins — it is the real story's first argument. Every name in the list is a link in a chain reaching back through exile, through kingship, through promise, to prove that this King did not appear from nowhere. He arrived exactly where the record said a King would arrive.

The list includes names a royal genealogy would ordinarily omit — foreigners, the formerly disgraced, the unexpected. The Kingdom's own record-keeping, from its very first sentence, refuses to pretend its King's arrival required a spotless family tree. Grace was already written into the lineage before grace was ever preached.

Then the announcement itself: a child conceived not by ordinary means, named both Jesus — for he will save his people — and Immanuel — God with us. Two names, two claims. One about what he came to do; one about who he actually is.`,
      },
      {
        id: 'ch-2',
        title: 'Chapter 5 — The Constitution of the Kingdom',
        body: `Seated on a mountainside, the King begins not with a list of rules but with a list of blessings — the poor in spirit, the mourning, the meek, the hungry for righteousness, all named blessed before they have done anything to earn the title. This is the Kingdom's constitution, and its opening clause is grace extended to those the world would never call fortunate.

"You are the salt of the earth. You are the light of the world" — identity is declared before instruction follows, the same pattern the Foundation pillar established at creation: authority and identity granted before they are exercised.

Then the sharper turns: anger judged alongside murder, lust alongside adultery, love commanded even for enemies. The Kingdom's law was never meant to regulate behavior at arm's length. It reaches for the heart, because a Kingdom ruled from the heart outward needs citizens transformed at the root, not merely policed at the surface.`,
      },
      {
        id: 'ch-3',
        title: 'Chapter 28 — All Authority Given',
        body: `On a mountain in Galilee, the risen King gathers his remaining eleven, and some still doubt even as they worship — an honest admission left uncensored in the record, proof that the Gospel was never interested in manufacturing a tidier story than the one that actually happened.

"All authority in heaven and on earth has been given to me." This is the claim the entire Gospel has been building toward since its opening genealogy: a King with a legitimate lineage now holding an authority with no remaining rival.

From that authority comes a commission, not a retirement: go, make disciples of all nations, baptizing, teaching everything commanded. And a final promise closes the scroll — "I am with you always, to the end of the age." The Gospel of the King ends the way the Foundation pillar's Immanuel-promise began: God, with his people, still.`,
      },
    ],
  },
  '16': {
    resourceId: '16',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1 — The Unveiling Begins',
        body: `A revelation, not a riddle — the scroll announces its own purpose in its first line: to show what must soon take place. What follows is not meant to obscure the King from his people but to unveil him more fully than any previous scroll dared.

John, exiled on Patmos for the testimony he carried, is found "in the Spirit on the Lord's Day" when a voice like a trumpet turns him around. What he sees is not a distant, abstract deity but one like a son of man, standing among lampstands, eyes like blazing fire, voice like rushing waters, holding seven stars in a right hand.

"Do not be afraid. I am the First and the Last, the Living One. I was dead, and behold, I am alive forever and ever, and I hold the keys of death and Hades." Every fear this scroll will later provoke is answered in advance, in its very first appearance of the King himself.`,
      },
      {
        id: 'ch-2',
        title: 'Chapter 21 — A Kingdom Without End',
        body: `A new heaven and a new earth are seen, the first having passed away, and the sea — the Kingdom's ancient image of chaos and threat — is no more. What could not be tamed is simply gone, not conquered so much as rendered irrelevant in a Kingdom finally arrived at its intended shape.

The holy city descends like a bride prepared for her husband, and a voice from the throne declares: "Behold, the dwelling place of God is with man. He will dwell with them, and they will be his people, and God himself will be with them as their God." Immanuel — God with us — spoken first as promise in the Foundation pillar, sung as longing throughout the Wisdom pillar, fulfilled in the Gospel, and here, finally, made permanent.

Every tear is wiped away; death, mourning, crying, and pain pass away with the old order they belonged to. "Behold, I am making all things new," says the one seated on the throne — not repairing the old creation, but making all things new, the Kingdom's oldest promise kept in full at last.`,
      },
      {
        id: 'ch-3',
        title: 'Chapter 22 — Come',
        body: `A river of the water of life flows from the throne, clear as crystal, and on either side stands the tree of life, bearing fruit every month, its leaves for the healing of the nations. The tree first seen guarded and forbidden in the Foundation pillar's garden is here again — no longer withheld, but freely offered to every citizen of the finished Kingdom.

"No longer will there be anything accursed." The boundary broken in the very first scroll is here fully repaired, not merely forgiven but undone at its root, its consequences reversed rather than simply forgotten.

The scroll closes as it opened, with urgency: "Behold, I am coming soon." The Spirit and the bride say, "Come." Let the one who hears say, "Come." Let the one who is thirsty come. The whole of the Kingdom's library, from its first spoken light to its final open invitation, ends not with a conclusion to be studied, but with a door still standing open.`,
      },
    ],
  },
}
