package client;

import java.util.Map;

public interface CommandReactor {

    void onWarning(String warning);

    static interface Turn {
        void move(int id, Direction direction);
        void bark(int id);
        void endTurn();
    }

    enum Direction {
        LEFT, RIGHT, UP, DOWN
    }
    
    void onInit(int players, int yourId, int cols, int rows, Landscape[][] map);
    
    void onTurn(GameObject[] info, Turn turn);
    
    void onFinish(int winnerId);
    
}
