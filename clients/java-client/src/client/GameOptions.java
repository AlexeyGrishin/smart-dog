package client;

import java.util.Map;

public class GameOptions {
    public final int rows;
    public final int cols;
    public final int yourId;
    public final int players;
    
    public final int dogVisibilityRadius;
    public final int sheepVisibilityRadius;
    public final int sheepScaryRadius;
    public final int sheepScaryTurns;
    public final int sheepStandBy;
    public final int turnsLimit;
    
    public GameOptions(Map<String, Integer> map) {
        rows = get(map, "rows");
        cols = get(map, "cols");
        yourId = get(map, "you");
        players = get(map, "players");
        dogVisibilityRadius = get(map, "dogVisibilityR");
        sheepVisibilityRadius = get(map, "sheepVisibilityR");
        sheepScaryRadius = get(map, "sheepScaryDistance");
        sheepScaryTurns = get(map, "sheepScaryTurns");
        sheepStandBy = get(map, "sheepStandBy");
        turnsLimit = get(map, "turnsLimit");
        System.out.println(map);
    }

    private int get(Map<String, Integer> map, String key) {
        if (!map.containsKey(key)) throw new IllegalArgumentException("Coming map does not contain '" + key + "': " + map.toString());
        return map.get(key);
    }
}
