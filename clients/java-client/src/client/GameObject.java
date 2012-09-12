package client;

import java.util.Map;

public class GameObject {
    public enum Type {
        UNKNOWN, DOG, SHEEP
    }
    public enum Voice {
        NONE, BARKING
    }
    
    public GameObject(Map<String, String> map) {
        id = toInt(map.get("id"));
        x = toInt(map.get("x"));
        y = toInt(map.get("y"));
        String t = map.get("type");
        type = t == null ? Type.UNKNOWN : Type.valueOf(t.toUpperCase());
        owner = toInt(map.get("owner"));
        String v = map.get("voice");
        voice = v == null ? null : Voice.valueOf(v.toUpperCase());
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
    
}
