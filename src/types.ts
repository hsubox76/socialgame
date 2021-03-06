let lastUserId = 0;
let lastIdeaId = 0;
let lastPostId = 0;

export class User {
  public id: number;
  public meanness: Ratio;
  public politics: Wheel;
  public fandom: Wheel;
  public frequencies: {
    post: Ratio;
    share: {
      negative: Ratio;
      positive: Ratio;
    };
    reply: {
      negative: Ratio;
      positive: Ratio;
    };
    like: Ratio;
    follow: Ratio;
    unfollow: Ratio;
  };
  followLimit: number;
  followers: number;
  fameLevel: number; // outside fame
  constructor() {
    this.id = lastUserId++;
    this.meanness = generateNumber();
    this.politics = new Wheel();
    this.fandom = new Wheel();
    this.frequencies = {
      post: generateNumber(),
      share: {
        negative: generateNumber(),
        positive: generateNumber(),
      },
      reply: {
        negative: generateNumber(),
        positive: generateNumber(),
      },
      like: generateNumber(),
      follow: generateNumber(),
      unfollow: generateNumber(),
    };
    this.followLimit = generateNumber(1, 5000);
    this.fameLevel = generateNumber(1, 5000);
    this.followers = generateNumber(1, 15);
  }
}

export class Wheel {
  public slot: number;
  constructor(private slots = 6) {
    this.slot = generateNumber(0, this.slots);
  }
  get opposite(): number {
    return (this.slot + this.slots / 2) % this.slots;
  }
  /**
   * Range from -1 (total disagreement) to 1 (total agreement)
   * @param other Other wheel to compare to.
   */
  compare(other: Wheel): number {
    let distance1 = Math.abs(this.slot - other.slot);
    let distance2 =
      Math.min(this.slot, other.slot) +
      (this.slots - Math.max(this.slot, other.slot));
    return -2 * (Math.min(distance1, distance2) / (this.slots / 2) - 0.5);
  }
}

export class Post {
  public id: number;
  public results?: PostResults;
  public politics?: Wheel;
  public fandom?: Wheel;
  constructor(private idea: Idea) {
    this.id = lastPostId++;
    this.politics = this.idea.politics;
    this.fandom = this.idea.fandom;
  }
}

export class Idea {
  public politics?: Wheel;
  public fandom?: Wheel;
  public id: number;
  constructor() {
    this.id = lastIdeaId++;
    const hasPolitics = Math.random() < 0.65;
    const hasFandom = !hasPolitics || Math.random() < 0.65;
    this.politics = hasPolitics ? new Wheel() : undefined;
    this.fandom = hasFandom ? new Wheel() : undefined;
  }
}

export interface PostResults {
  reply: {
    negative: number;
    positive: number;
  };
  share: {
    negative: number;
    positive: number;
  };
  like: number;
  follows: User[];
  unfollows: number[];
}

// Number between 0 and 1.
export type Ratio = number;

function generateNumber(min = 0, max = 1) {
  const range = max - min;
  return min + Math.random() * range;
}
