/**
 * Keyframe poses for the PULSE animated exercise figure.
 *
 * A figure is a set of joints (x,y in a 100x140 viewBox). Each animation has
 * two poses (A -> B -> A, looped). The ExerciseAnimation component interpolates
 * every joint between the poses and draws the skeleton with SVG.
 *
 * - 'front' view: symmetric figure used for press / raise / fly / curl / pushdown / calf / lunge
 * - 'side' view:  profile figure used for bench / squat / deadlift / row / pulldown / crunch / plank
 */

export interface Point {
  x: number;
  y: number;
}

export interface Pose {
  joints: Record<string, Point>;
  /** moving bar (interpolated between poses) */
  bar?: [Point, Point];
}

export interface FigureAnim {
  view: 'front' | 'side';
  /** A pose — start of movement */
  a: Pose;
  /** B pose — end of movement */
  b: Pose;
  /** static bar (unused when poses carry their own) */
  bench?: boolean;
  platform?: boolean;
  floor?: boolean;
  dumbbells?: boolean;
  /** cycle duration in ms (one full A->B->A loop) */
  duration?: number;
}

const F = (x: number, y: number) => ({ x, y });

// ---------------------------------------------------------------- FRONT VIEW

/** Neutral standing (front) */
const neutralFront: Pose = {
  joints: {
    head: F(50, 13),
    neck: F(50, 23),
    shoulderL: F(44, 27), shoulderR: F(56, 27),
    elbowL: F(42, 41), elbowR: F(58, 41),
    wristL: F(42, 55), wristR: F(58, 55),
    hipL: F(46, 59), hipR: F(54, 59),
    kneeL: F(44, 90), kneeR: F(56, 90),
    ankleL: F(46, 121), ankleR: F(54, 121),
  },
};

/** Overhead press — arms go from sides to overhead */
const press: FigureAnim = {
  view: 'front',
  dumbbells: true,
  a: neutralFront,
  b: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(44, 15), elbowR: F(56, 15),
      wristL: F(44, 5), wristR: F(56, 5),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
};

/** Lateral raise — arms sweep out to the sides */
const raise: FigureAnim = {
  view: 'front',
  dumbbells: true,
  a: neutralFront,
  b: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(30, 33), elbowR: F(70, 33),
      wristL: F(21, 39), wristR: F(79, 39),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
};

/** Chest fly — arms open wide then close in front */
const fly: FigureAnim = {
  view: 'front',
  dumbbells: true,
  a: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(26, 34), elbowR: F(74, 34),
      wristL: F(14, 43), wristR: F(86, 43),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
  b: {
    joints: {
      head: F(50, 13),
      neck: F(50, 23),
      shoulderL: F(44, 27), shoulderR: F(56, 27),
      elbowL: F(41, 32), elbowR: F(59, 32),
      wristL: F(37, 40), wristR: F(63, 40),
      hipL: F(46, 59), hipR: F(54, 59),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
};

/** Bicep curl — forearms rise, elbows pinned */
const curl: FigureAnim = {
  view: 'front',
  dumbbells: true,
  a: neutralFront,
  b: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(42, 41), elbowR: F(58, 41),
      wristL: F(38, 30), wristR: F(62, 30),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
};

/** Triceps pushdown — forearms extend downward */
const pushdown: FigureAnim = {
  view: 'front',
  a: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(42, 38), elbowR: F(58, 38),
      wristL: F(38, 27), wristR: F(62, 27),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
  b: {
    joints: {
      head: F(50, 12),
      neck: F(50, 22),
      shoulderL: F(44, 26), shoulderR: F(56, 26),
      elbowL: F(42, 42), elbowR: F(58, 42),
      wristL: F(41, 57), wristR: F(59, 57),
      hipL: F(46, 58), hipR: F(54, 58),
      kneeL: F(44, 90), kneeR: F(56, 90),
      ankleL: F(46, 121), ankleR: F(54, 121),
    },
  },
};

/** Calf raise — whole body rises onto toes */
const calf: FigureAnim = {
  view: 'front',
  platform: true,
  dumbbells: true,
  a: neutralFront,
  b: {
    joints: {
      head: F(50, 6),
      neck: F(50, 16),
      shoulderL: F(44, 20), shoulderR: F(56, 20),
      elbowL: F(42, 34), elbowR: F(58, 34),
      wristL: F(42, 48), wristR: F(58, 48),
      hipL: F(46, 52), hipR: F(54, 52),
      kneeL: F(44, 83), kneeR: F(56, 83),
      ankleL: F(46, 112), ankleR: F(54, 112),
    },
  },
};

/** Lunge — split stance drop (front view) */
const lunge: FigureAnim = {
  view: 'front',
  dumbbells: true,
  a: neutralFront,
  b: {
    joints: {
      head: F(50, 22),
      neck: F(50, 32),
      shoulderL: F(44, 36), shoulderR: F(56, 36),
      elbowL: F(42, 48), elbowR: F(58, 48),
      wristL: F(42, 60), wristR: F(58, 60),
      hipL: F(43, 64), hipR: F(55, 66),
      kneeL: F(36, 80), kneeR: F(56, 96),
      ankleL: F(32, 116), ankleR: F(58, 122),
    },
  },
};

// ----------------------------------------------------------------- SIDE VIEW

/** Neutral standing (side) */
const neutralSide: Pose = {
  joints: {
    head: F(56, 11),
    neck: F(56, 19),
    shoulder: F(56, 25),
    elbow: F(64, 37),
    wrist: F(64, 51),
    hip: F(52, 57),
    knee: F(52, 90),
    ankle: F(54, 120),
    foot: F(64, 120),
  },
};

/** Bench press — lying on a bench (side view) */
const bench: FigureAnim = {
  view: 'side',
  bench: true,
  a: {
    joints: {
      head: F(28, 85),
      neck: F(34, 85),
      shoulder: F(42, 85),
      elbow: F(44, 71),
      wrist: F(52, 69),
      hip: F(64, 87),
      knee: F(74, 101),
      ankle: F(80, 116),
      foot: F(88, 116),
    },
    bar: [F(46, 67), F(58, 67)],
  },
  b: {
    joints: {
      head: F(28, 85),
      neck: F(34, 85),
      shoulder: F(42, 85),
      elbow: F(46, 52),
      wrist: F(52, 40),
      hip: F(64, 87),
      knee: F(74, 101),
      ankle: F(80, 116),
      foot: F(88, 116),
    },
    bar: [F(46, 38), F(58, 38)],
  },
};

/** Squat — descend to parallel (side view) */
const squat: FigureAnim = {
  view: 'side',
  a: {
    joints: {
      head: F(56, 9),
      neck: F(56, 17),
      shoulder: F(56, 23),
      elbow: F(62, 34),
      wrist: F(62, 44),
      hip: F(52, 55),
      knee: F(52, 88),
      ankle: F(54, 120),
      foot: F(64, 120),
    },
    bar: [F(46, 22), F(66, 22)],
  },
  b: {
    joints: {
      head: F(58, 39),
      neck: F(58, 47),
      shoulder: F(58, 53),
      elbow: F(47, 61),
      wrist: F(41, 71),
      hip: F(52, 76),
      knee: F(64, 100),
      ankle: F(54, 120),
      foot: F(64, 120),
    },
    bar: [F(48, 51), F(68, 51)],
  },
};

/** Deadlift — hinge to the bar (side view) */
const deadlift: FigureAnim = {
  view: 'side',
  a: {
    joints: {
      head: F(56, 9),
      neck: F(56, 17),
      shoulder: F(56, 23),
      elbow: F(62, 33),
      wrist: F(62, 45),
      hip: F(52, 55),
      knee: F(52, 88),
      ankle: F(54, 120),
      foot: F(64, 120),
    },
    bar: [F(56, 46), F(68, 46)],
  },
  b: {
    joints: {
      head: F(44, 34),
      neck: F(44, 42),
      shoulder: F(44, 48),
      elbow: F(33, 66),
      wrist: F(30, 82),
      hip: F(36, 74),
      knee: F(45, 100),
      ankle: F(50, 120),
      foot: F(62, 120),
    },
    bar: [F(28, 84), F(42, 84)],
  },
};

/** Row — pull weight to hip (side view) */
const row: FigureAnim = {
  view: 'side',
  dumbbells: true,
  a: {
    joints: {
      head: F(42, 28),
      neck: F(42, 36),
      shoulder: F(42, 42),
      elbow: F(29, 56),
      wrist: F(23, 74),
      hip: F(30, 68),
      knee: F(34, 98),
      ankle: F(40, 120),
      foot: F(52, 120),
    },
  },
  b: {
    joints: {
      head: F(42, 28),
      neck: F(42, 36),
      shoulder: F(42, 42),
      elbow: F(20, 52),
      wrist: F(25, 62),
      hip: F(30, 68),
      knee: F(34, 98),
      ankle: F(40, 120),
      foot: F(52, 120),
    },
  },
};

/** Lat pulldown — bar pulled from overhead to chest (side view) */
const pulldown: FigureAnim = {
  view: 'side',
  a: {
    joints: {
      head: F(58, 9),
      neck: F(58, 17),
      shoulder: F(58, 23),
      elbow: F(68, 15),
      wrist: F(72, 7),
      hip: F(52, 55),
      knee: F(52, 88),
      ankle: F(54, 120),
      foot: F(64, 120),
    },
    bar: [F(60, 4), F(82, 4)],
  },
  b: {
    joints: {
      head: F(58, 9),
      neck: F(58, 17),
      shoulder: F(58, 23),
      elbow: F(51, 37),
      wrist: F(51, 45),
      hip: F(52, 55),
      knee: F(52, 88),
      ankle: F(54, 120),
      foot: F(64, 120),
    },
    bar: [F(48, 43), F(60, 43)],
  },
};

/** Crunch — curl torso forward (side view) */
const crunch: FigureAnim = {
  view: 'side',
  floor: true,
  a: {
    joints: {
      head: F(60, 25),
      neck: F(60, 33),
      shoulder: F(60, 39),
      elbow: F(68, 49),
      wrist: F(70, 61),
      hip: F(46, 67),
      knee: F(32, 85),
      ankle: F(40, 114),
      foot: F(52, 114),
    },
  },
  b: {
    joints: {
      head: F(45, 37),
      neck: F(45, 43),
      shoulder: F(45, 47),
      elbow: F(54, 55),
      wrist: F(58, 65),
      hip: F(46, 67),
      knee: F(32, 85),
      ankle: F(40, 114),
      foot: F(52, 114),
    },
  },
};

/** Plank — subtle brace (side view) */
const plank: FigureAnim = {
  view: 'side',
  floor: true,
  a: {
    joints: {
      head: F(18, 61),
      neck: F(24, 61),
      shoulder: F(30, 62),
      elbow: F(26, 73),
      wrist: F(22, 83),
      hip: F(52, 65),
      knee: F(76, 67),
      ankle: F(88, 69),
      foot: F(94, 69),
    },
  },
  b: {
    joints: {
      head: F(18, 63),
      neck: F(24, 63),
      shoulder: F(30, 64),
      elbow: F(26, 75),
      wrist: F(22, 85),
      hip: F(52, 68),
      knee: F(76, 70),
      ankle: F(88, 71),
      foot: F(94, 71),
    },
  },
};

export const FIGURE_ANIMS: Record<string, FigureAnim> = {
  press, raise, fly, curl, pushdown, calf, lunge,
  bench, squat, deadlift, row, pulldown, crunch, plank,
};

/** Exercises that render the cardio pulse motif instead of a figure */
export const PULSE_MOTIF = new Set(['run']);
