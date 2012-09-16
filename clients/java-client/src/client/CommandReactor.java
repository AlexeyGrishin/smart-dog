package client;

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
    
    void onInit(GameOptions options, Landscape[][] map);
    
    void onTurn(GameObject[] info, Turn turn);
    
    void onFinish(int winnerId);
    
}
