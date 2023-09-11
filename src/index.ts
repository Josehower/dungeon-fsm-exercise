import { AnyEventObject, assign, createMachine, interpret } from 'xstate';

type Context = { bossHealth: number };

const hitBoss = assign<
  Context,
  { type: string; damage: number },
  AnyEventObject
>((context, event) => {
  if (!event.damage) return context;

  const newHealt = context.bossHealth - event.damage;

  if (newHealt > 500) {
    console.log("it doesn't seems to weak him that much");
  } else if (newHealt <= 500 && newHealt > 0) {
    console.log('It really hurts');
  } else if (newHealt <= 0) {
    console.log('Boss is dead!');
  }
  return {
    bossHealth: newHealt,
  };
});

function bossIsAlive(context: Context) {
  return context.bossHealth > 0;
}

function bossIsDead(context: Context) {
  return context.bossHealth <= 0;
}

const dungeonMachine = createMachine(
  {
    id: 'Dungeon',
    initial: 'entrance',
    predictableActionArguments: true,
    context: {
      bossHealth: 1000,
    } as Context,
    states: {
      entrance: { on: { ENTER: 'room_1' } },
      room_1: { on: { EAST_DOOR: 'room_2', SOUTH_DOOR: 'entrance' } },
      room_2: {
        on: {
          NORTH_DOOR: { target: 'room_3', cond: 'bossIsDead' },
          WEST_DOOR: 'room_1',
        },
        always: { target: 'fight', cond: 'bossIsAlive' },
      },
      room_3: { on: { SOUTH_DOOR: 'room_2', CROSS_PORTAL: 'win' } },
      fight: {
        on: {
          ATTACK_BOSS: { target: 'room_2', actions: 'hitBoss' },
          FLEE: 'room_1',
          DIE: 'dead',
          LOG: { actions: 'prepareForFight' },
        },
        always: {
          target: 'room_2',
          cond: 'bossIsDead',
        },
      },
      dead: { type: 'final' },
      win: { type: 'final' },
    },
  },
  {
    actions: {
      hitBoss: hitBoss,
      prepareForFight: () =>
        console.log(`The Boss is hungry and you are food.
Prepare for fight`),
    },
    guards: { bossIsDead, bossIsAlive },
  },
);

// Machine instance with internal state
const dungeonGame = interpret(dungeonMachine);
dungeonGame.subscribe((state) => {
  if (state.event.message) console.log(state.event.message);
  if (state.event.type === 'ATTACK_BOSS') console.log(state.context);
});

dungeonGame.start();
// => logs 'entrance'

dungeonGame.send({ type: 'ENTER', message: 'you are at the entrance' });
// => logs 'room_1'

dungeonGame.send({ type: 'EAST_DOOR', message: 'A very dark room' });
// => logs 'fight'
dungeonGame.send({ type: 'LOG' });

dungeonGame.send({ type: 'ATTACK_BOSS', damage: 300 });
// => it doesn't seems to weak him that much
dungeonGame.send({ type: 'ATTACK_BOSS', damage: 300 });
// => It really hurts
dungeonGame.send({ type: 'ATTACK_BOSS', damage: 300 });
// => It really hurts
dungeonGame.send({ type: 'ATTACK_BOSS', damage: 100 });
// => Boss is dead!
