package client;

import java.util.Map;

public class GameOptions {
    public final int rows;
    public final int cols;
    public final int yourId;
    public final int players;
    public final int areaX1, areaX2, areaY1, areaY2; 
    
    public final int dogVisibilityRadius;
    public final int dogBarkingRadius;
    public final int sheepScaryTurns;
    public final int dogScaryTurns;
    public final int sheepStandBy;
    public final int turnsLimit;
    
    public GameOptions(Map<String, Integer> map) {
        rows = get(map, "rows");
        cols = get(map, "cols");
        yourId = get(map, "you");
        players = get(map, "players");
        dogVisibilityRadius = get(map, "dogVisibilityR");
        dogBarkingRadius = get(map, "dogBarkingR");
        sheepScaryTurns = get(map, "sheepScaryTurns");
        dogScaryTurns = get(map, "dogScaryTurns");
        sheepStandBy = get(map, "sheepStandBy");
        turnsLimit = get(map, "turnsLimit");
        areaX1 = get(map, "x1");
        areaX2 = get(map, "x2");
        areaY1 = get(map, "y1");
        areaY2 = get(map, "y2");
        System.out.println(map);
    }

    private int get(Map<String, Integer> map, String key) {
        if (!map.containsKey(key)) throw new IllegalArgumentException("Coming map does not contain '" + key + "': " + map.toString());
        return map.get(key);
    }
}
