import {
  getChuteFrameIndex,
  getDoubleJumpFrameIndex,
  getJumpFrameIndex,
  getWinFrameIndex,
} from "./logic.js";

const PLAYER_VISUAL_HEIGHT = 206;
const PLAYER_LAYOUTS = {
  homeIdle: {
    width: 330,
    height: 400,
    offsetY: -54,
    groundOffsetY: 58,
  },
  idle: {
    width: 186,
    height: 220,
    offsetY: -14,
    groundOffsetY: 10,
  },
  run: {
    width: 178,
    height: PLAYER_VISUAL_HEIGHT,
    offsetY: -2,
    groundOffsetY: 10,
  },
  jump: {
    width: 150,
    height: PLAYER_VISUAL_HEIGHT,
    offsetY: -2,
    groundOffsetY: 10,
  },
  doubleJump: {
    width: 176,
    height: 190,
    offsetY: 6,
    groundOffsetY: 10,
  },
  hit: {
    width: 172,
    height: PLAYER_VISUAL_HEIGHT,
    offsetY: -2,
    groundOffsetY: 10,
  },
  falling: {
    width: 184,
    height: 202,
    offsetY: 0,
    groundOffsetY: 12,
  },
  gameOver: {
    width: 194,
    height: 206,
    offsetY: -2,
    groundOffsetY: 12,
  },
  win: {
    width: 186,
    height: 238,
    offsetY: -6,
    groundOffsetY: 10,
  },
};
const HIT_ANIMATION_FRAMES_PER_SECOND = 8;
const GAME_OVER_ANIMATION_FRAMES_PER_SECOND = 12;
const WIN_ANIMATION_INTRO_FRAMES_PER_SECOND = 6.2;
const WIN_ANIMATION_LOOP_FRAMES_PER_SECOND = 5.4;
const WIN_ANIMATION_LOOP_TAIL_COUNT = 4;
const HOME_IDLE_ANIMATION_FRAMES_PER_SECOND = 5;
const IDLE_ANIMATION_FRAMES_PER_SECOND = 4;
const PLAYER_FRAME_COUNTS = {
  idleIntro: 71,
  run: 15,
  jump: 8,
  doubleJump: 6,
  chute: 5,
  idle: 26,
  hit: 4,
  gameOver: 20,
  win: 83,
};
const GAME_OVER_ANIMATION_DURATION = PLAYER_FRAME_COUNTS.gameOver / GAME_OVER_ANIMATION_FRAMES_PER_SECOND;

function getLoopingFrameIndex(animationTime, frameCount, framesPerSecond) {
  if (frameCount <= 0 || framesPerSecond <= 0) {
    return 0;
  }

  return Math.floor(animationTime * framesPerSecond) % frameCount;
}

export const PLAYER_VISUAL_STATES = {
  IDLE: "idle",
  POST_GAME_IDLE: "post-game-idle",
  RUNNING: "running",
  JUMPING: "jumping",
  DOUBLE_JUMPING: "double-jumping",
  HIT: "hit",
  FALLING: "falling",
  GAME_OVER: "game-over",
  VICTORY: "victory",
};

export function resolvePlayerVisualState(state, player, runtime) {
  if (state.gameOver) {
    if (!runtime.didBeatRecordOnDeath && state.gameOverAnimationTime >= GAME_OVER_ANIMATION_DURATION) {
      return PLAYER_VISUAL_STATES.POST_GAME_IDLE;
    }

    return runtime.didBeatRecordOnDeath
      ? PLAYER_VISUAL_STATES.VICTORY
      : PLAYER_VISUAL_STATES.GAME_OVER;
  }

  if (!state.gameStarted) {
    return PLAYER_VISUAL_STATES.IDLE;
  }

  if (state.pendingGameOver) {
    return PLAYER_VISUAL_STATES.FALLING;
  }

  if (runtime.hitAnimationTime !== null) {
    return PLAYER_VISUAL_STATES.HIT;
  }

  if (player.isJumping) {
    return player.isDoubleJumping
      ? PLAYER_VISUAL_STATES.DOUBLE_JUMPING
      : PLAYER_VISUAL_STATES.JUMPING;
  }

  return PLAYER_VISUAL_STATES.RUNNING;
}

export function createPlayerAnimationFromVisualState(visualState, state, player, runtime) {
  switch (visualState) {
    case PLAYER_VISUAL_STATES.VICTORY:
      return {
        visualState,
        sheet: "win",
        frameIndex: getWinFrameIndex(
          state.gameOverAnimationTime,
          PLAYER_FRAME_COUNTS.win,
          WIN_ANIMATION_INTRO_FRAMES_PER_SECOND,
          WIN_ANIMATION_LOOP_TAIL_COUNT,
          WIN_ANIMATION_LOOP_FRAMES_PER_SECOND
        ),
        ...PLAYER_LAYOUTS.win,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0,
        tiltAmplitude: 0.01,
        bobAmplitude: 2,
        strideAmplitude: 0,
        motionPhase: state.headSwingTime * 1.2,
      };

    case PLAYER_VISUAL_STATES.GAME_OVER: {
      const gameOverFrameStep = Math.floor(state.gameOverAnimationTime * GAME_OVER_ANIMATION_FRAMES_PER_SECOND);
      const frameCount = PLAYER_FRAME_COUNTS.gameOver;

      return {
        visualState,
        sheet: "gameOver",
        frameIndex: gameOverFrameStep < frameCount
          ? gameOverFrameStep % frameCount
          : frameCount - 1,
        ...PLAYER_LAYOUTS.gameOver,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0.03,
        tiltAmplitude: 0.015,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: state.headSwingTime * 1.4,
      };
    }

    case PLAYER_VISUAL_STATES.FALLING:
      return {
        visualState,
        sheet: "chute",
        frameIndex: getChuteFrameIndex(
          state.deathFallTime,
          runtime.deathFallDuration,
          PLAYER_FRAME_COUNTS.chute
        ),
        ...PLAYER_LAYOUTS.falling,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0,
        tiltAmplitude: 0,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: 0,
      };

    case PLAYER_VISUAL_STATES.HIT:
      return {
        visualState,
        sheet: "hit",
        frameIndex: Math.min(
          PLAYER_FRAME_COUNTS.hit - 1,
          Math.floor((runtime.hitAnimationTime ?? 0) * HIT_ANIMATION_FRAMES_PER_SECOND)
        ),
        ...PLAYER_LAYOUTS.hit,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0,
        tiltAmplitude: 0,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: 0,
      };

    case PLAYER_VISUAL_STATES.DOUBLE_JUMPING:
      return {
        visualState,
        sheet: "doubleJump",
        frameIndex: getDoubleJumpFrameIndex(player.jumpAnimationTime, player.jumpStrength, player.gravity),
        ...PLAYER_LAYOUTS.doubleJump,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0.04,
        tiltAmplitude: 0.025,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: 0,
      };

    case PLAYER_VISUAL_STATES.JUMPING:
      return {
        visualState,
        sheet: "jump",
        frameIndex: getJumpFrameIndex(player.jumpAnimationTime, player.jumpStrength, player.gravity),
        ...PLAYER_LAYOUTS.jump,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0.015,
        tiltAmplitude: 0.015,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: 0,
      };

    case PLAYER_VISUAL_STATES.RUNNING: {
      const runFrameProgress = player.runCycle % PLAYER_FRAME_COUNTS.run;
      const runPhase = (runFrameProgress / PLAYER_FRAME_COUNTS.run) * Math.PI * 2;

      return {
        visualState,
        sheet: "run",
        frameIndex: Math.floor(runFrameProgress) % PLAYER_FRAME_COUNTS.run,
        ...PLAYER_LAYOUTS.run,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0.04,
        tiltAmplitude: 0.035,
        bobAmplitude: 7,
        strideAmplitude: 8,
        motionPhase: runPhase,
      };
    }

    case PLAYER_VISUAL_STATES.POST_GAME_IDLE:
    case PLAYER_VISUAL_STATES.IDLE:
    default: {
      if (visualState === PLAYER_VISUAL_STATES.IDLE) {
        return {
          visualState,
          sheet: "idleIntro",
          frameIndex: getLoopingFrameIndex(
            state.headSwingTime,
            PLAYER_FRAME_COUNTS.idleIntro,
            HOME_IDLE_ANIMATION_FRAMES_PER_SECOND
          ),
          ...PLAYER_LAYOUTS.homeIdle,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0,
          tiltAmplitude: 0,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0,
        };
      }

      const idleLoopTime = state.gameOverAnimationTime
        - GAME_OVER_ANIMATION_DURATION;

      return {
        visualState,
        sheet: "idle",
        frameIndex: getLoopingFrameIndex(
          idleLoopTime,
          PLAYER_FRAME_COUNTS.idle,
          IDLE_ANIMATION_FRAMES_PER_SECOND
        ),
        ...PLAYER_LAYOUTS.idle,
        allowSwing: false,
        swingAmplitude: 0,
        baseTilt: 0,
        tiltAmplitude: 0,
        bobAmplitude: 0,
        strideAmplitude: 0,
        motionPhase: 0,
      };
    }
  }
}
