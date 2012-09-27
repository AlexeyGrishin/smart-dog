package client;

import java.util.Map;

public class GameObject {
    public enum Type {
        UNKNOWN, DOG, SHEEP
    }
    public enum Voice {
        NONE, BARKING
    }
    public enum Action {
        UNKNOWN, STANDBY, MOVE, PANIC, INDIGNANT
    }
    public enum Direction {
        UNKNOWN, UP, DOWN, LEFT, RIGHT
    }

    public GameObject(Map<String, String> map) {
        id = toInt(map.get("id"));
        x = toInt(map.get("x"));
        y = toInt(map.get("y"));
        type = extract(map, "type", Type.UNKNOWN);
        owner = toInt(map.get("owner"));
        voice = extract(map, "voice", Voice.NONE);
        direction = extract(map, "direction", Direction.UNKNOWN);
        action = extract(map, "action", Action.UNKNOWN);
    }
    
    private <E extends Enum<E>> E extract(Map<String, String> map, String name, E defaultVal) {
        String value = map.get(name);
        if (value == null) return defaultVal;
        return Enum.valueOf(defaultVal.getDeclaringClass(), value.toUpperCase());
    }

    private Integer toInt(String integer) {
        return integer == null ? null : Integer.parseInt(integer);
    }

    public final Integer id;
    public final Type type;
    public final int x;
    public final int y;
    public final Integer owner;
    public final Voice voice;
    public final Action action;
    public final Direction direction;
    
}
