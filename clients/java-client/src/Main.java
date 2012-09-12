import ai.AI;
import client.AbstractClient;
import client.CommandLineClient;
import client.SocketClient;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class Main {
    /**
     * Usage: java Main [-name UserName][-host host][-port port][-exe 'nodejs <path-to-client>'][-count N]
     *
     * If nothing is specified then connects to localhost:3002.
     * If 'exe' specified then starts the correspondign process and sends commands to its stdin and reads response from stdout.
     * Assuming that 'exe' points to the nodejs client.
     * -count specified how much games shall be played. -1 means that client will never stop
     *
     */
    public static void main(String args[]) throws IOException, InterruptedException {
        Map<String, String> options = new HashMap<>();
        for (int idx = 0; idx < args.length; idx+=2) {
            options.put(args[idx].substring(1), args[idx+1]);
        }
        if (!options.containsKey("name")) options.put("name", "SampleBot");
        if (!options.containsKey("host") && !options.containsKey("exe"))
            options.put("host", "localhost");
        if (!options.containsKey("port")) 
            options.put("port", "3002");

        int count = options.containsKey("count") ? Integer.parseInt(options.get("count")) : 1;
        boolean infinite = count == -1;
        while (infinite || count-->0) {
            AI ai = new AI();
            AbstractClient client;
            if (options.containsKey("exe")) {
                client = new CommandLineClient(ai, options.get("exe"));
            }
            else {
                client = new SocketClient(ai, options.get("host"), Integer.parseInt(options.get("port")));
            }
            client.start(options.get("name"));
            System.out.println("Finished!!");
        }
    }
}
