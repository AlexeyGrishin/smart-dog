package client;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class StreamClient implements Runnable {
    private final InputStream inputStream;
    private final OutputStream outputStream;
    private CommandReactor reactor;
    private String name;
    private Decoder decoder = new Decoder();
    private Map<String, Integer> initMap = null;
    private List<GameObject> objects = new ArrayList<GameObject>();
    private CommandReactor.Turn turn;
    private boolean debug = true;


    public StreamClient(InputStream inputStream, OutputStream outputStream, CommandReactor reactor, String name) {
        this.inputStream = inputStream;
        this.outputStream = outputStream;
        this.reactor = reactor;
        this.name = name;
    }

    @Override
    public void run() {
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        final PrintWriter writer = new PrintWriter(outputStream);
        //TODO: error from server?
        sendCommand(writer, "join " + name);
        turn = new CommandReactor.Turn() {
            @Override
            public void move(int id, CommandReactor.Direction dir) {
                sendCommand(writer, "do " + id + " move " + dir.toString().toLowerCase());
            }

            @Override
            public void bark(int id) {
                sendCommand(writer, "do " + id + " bark");
            }

            @Override
            public void endTurn() {
                sendCommand(writer, "end");
            }
        };
        String str;
        try {
            while ((str = reader.readLine()) != null) {
                if (debug) {
                    System.out.println(" < " + str);
                }
                parseCommand(str);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void sendCommand(PrintWriter writer, String cmd) {
        if (debug) {
            System.out.println(" > " + cmd);
        }
        writer.println(cmd);
        writer.flush();
    }

    void parseCommand(String cmd) {
        int space = cmd.indexOf(" ");
        String command = space == -1 ? cmd : cmd.substring(0, space);
        String args = space == -1 ? "" : cmd.substring(space+1);
        switch (command) {
            case "wait": doWait(); break;
            case "start": doStart(args); break;
            case "landscape": doLandscape(args); break;
            case "state": doState(args); break;
            case "obj": doObj(args); break;
            case "warning": doWarning(args); break;
            case "turn": doTurn(); break;
            case "finished": doFinished(args); break;
            default:
                doUnknown(command, args);
        }
    }

    private void doStart(String args) {
        initMap = decoder.decodeIntMap(args);
    }

    void doWait() {
    }
    
    void doLandscape(String args) {
        Landscape[][] lanscape = parseLandscape(initMap.get("you"), decoder.decodeList(args));
        reactor.onInit(initMap.get("players"), initMap.get("you"), initMap.get("rows"), initMap.get("cols"), lanscape);
        
    }
    
    void doState(String args) {
        objects.clear();
    }
    
    void doObj(String args) {
        objects.add(new GameObject(decoder.decodeMap(args)));
    }
    
    void doTurn() {
        reactor.onTurn(objects.toArray(new GameObject[objects.size()]), turn);
    }
    
    void doUnknown(String command, String args) {
         System.err.println("Unknown command: " + command + " (" + args + ")");
    }
    
    void doWarning(String args) {
        System.err.println(args);
        reactor.onWarning(args);
    }
    
    void doFinished(String args) {
        reactor.onFinish(-1);
    }

    public static Landscape[][] parseLandscape(int ourId, List<String> strings) {
        Landscape[][] landscape = new Landscape[strings.size()][strings.get(0).length()];
        Map<Character, Landscape> parsingMap = new HashMap<Character, Landscape>();
        parsingMap.put('.', Landscape.GRASS);
        parsingMap.put('#', Landscape.WALL);
        for (char i = 1; i <= 4; i++) {
            parsingMap.put((char)('0' + i), i == ourId ? Landscape.YOUR_SITE : Landscape.ENEMY_SITE);
        }
        for (int y = 0; y < strings.size(); y++) {
            String s = strings.get(y);
            for (int x = 0; x < s.length(); x++) {
                landscape[y][x] = parsingMap.get(s.charAt(x));
            }
        }
        return landscape;
    }
}
