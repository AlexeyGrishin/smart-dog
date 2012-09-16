package ai;

import client.CommandReactor;
import client.GameObject;
import client.GameOptions;
import client.Landscape;

public class AI implements CommandReactor {
    private int me;

    @Override
    public void onWarning(String warning) {
        System.err.println(warning);
    }

    @Override
    public void onInit(GameOptions options, Landscape[][] map) {
        this.me = options.yourId;
    }
    
    private int turn = 0;

    private int getMyDog(GameObject[] info) {
        for (GameObject go: info) {
            if (go.type == GameObject.Type.DOG && go.owner == me) {
                return go.id;
            }
        }
        return -1;
    }
    
    @Override
    public void onTurn(GameObject[] info, Turn turn) {
        for (GameObject go: info) {
            if (go.type == GameObject.Type.UNKNOWN && go.voice == GameObject.Voice.BARKING) {
                System.out.println("Someone barking at " + go.x + "," + go.y);
            }
        }
        this.turn++;
        Direction moveTo = Direction.values()[(int)(Math.random()*Direction.values().length)];
        if ((this.turn % this.me) == 0) {
            turn.move(getMyDog(info), moveTo);
            turn.bark(getMyDog(info));
        }
        turn.endTurn();
    }

    @Override
    public void onFinish(int winnerId) {
        System.out.println(" =( ");
    }
}
