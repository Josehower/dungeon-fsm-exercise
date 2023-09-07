import { assign, createMachine, interpret } from 'xstate';

type Context = { isBossAlive: boolean };

const killBoss = assign<Context>(() => {
  return {
    isBossAlive: false,
  };
});

function bossIsAlive(context: Context) {
  return context.isBossAlive === true;
}

function bossIsDead(context: Context) {
  return context.isBossAlive !== true;
}

const dungeonMachine = createMachine(
  {
    id: 'Dungeon',
    initial: 'entrance',
    predictableActionArguments: true,
    context: {
      isBossAlive: true,
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
          WIN_FIGHT: { target: 'room_2', actions: 'killBoss' },
          FLEE: 'room_1',
          DIE: 'dead',
        },
      },
      dead: { type: 'final' },
      win: { type: 'final' },
    },
  },
  {
    actions: { killBoss },
    guards: { bossIsDead, bossIsAlive },
  },
);

// Machine instance with internal state
const toggleActor = interpret(dungeonMachine);
toggleActor.subscribe((state) => console.log(state.value));
toggleActor.start();
// => logs 'entrance'

toggleActor.send({ type: 'ENTER' });
// => logs 'room_1'

toggleActor.send({ type: 'EAST_DOOR' });
// => logs 'fight'
