package client;

import java.util.*;

public class Decoder {
    
    static interface To<T> {
        T from(String arg);
    }
    private final static To<String> ToString = new To<String>() {
        @Override
        public String from(String arg) {
            return arg;
        }
    };
    private final static To<Integer> ToInteger = new To<Integer>() {
        @Override
        public Integer from(String arg) {
            return Integer.parseInt(arg);
        }
    };
    

    public Map<String, String> decodeMap(String str) {
        return decodeMap(str, ToString);
    }
    
    private <T> Map<String, T> decodeMap(String str, To<T> converter) {
        Map<String, T> map = new HashMap<String, T>();
        for (String pair: str.split(",")) {
            String[] kv = pair.split(":");
            String key = stripQuotes(kv[0]);
            String val = stripQuotes(kv[1]);
            map.put(key, converter.from(val));
        }
        return map;
    }

    private String stripQuotes(String s) {
        String key = s.trim();
        if (key.charAt(0) == '"' || key.charAt(0) == '\'')
            key = key.substring(1, key.length()-1);
        return key;
    }

    public List<String> decodeList(String str) {
        String items[] = str.split(",");
        List<String> list = new ArrayList<String>(items.length);
        for (String item: items) {
            list.add(stripQuotes(item));
        }
        return list;
    }

    public Map<String, Integer> decodeIntMap(String string) {
        return decodeMap(string, ToInteger);
    }
}
